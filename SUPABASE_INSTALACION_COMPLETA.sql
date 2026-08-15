-- APPI · Instalación completa de Supabase

-- Ejecutar todo este archivo una sola vez desde SQL Editor.

-- ============================================================
-- 1. Histórico, archivos privados y políticas base
-- ============================================================
-- APPI Histórico · configuración de Supabase
-- Ejecutar una sola vez en SQL Editor del proyecto.

create table if not exists public.historico_periodos (
  user_id uuid not null references auth.users(id) on delete cascade,
  period_id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, period_id)
);

alter table public.historico_periodos enable row level security;
grant select, insert, update, delete on public.historico_periodos to authenticated;

drop policy if exists "historico_select_own" on public.historico_periodos;
create policy "historico_select_own"
on public.historico_periodos for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "historico_insert_own" on public.historico_periodos;
create policy "historico_insert_own"
on public.historico_periodos for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "historico_update_own" on public.historico_periodos;
create policy "historico_update_own"
on public.historico_periodos for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "historico_delete_own" on public.historico_periodos;
create policy "historico_delete_own"
on public.historico_periodos for delete
to authenticated
using (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit)
values ('historico-files', 'historico-files', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = 52428800;

drop policy if exists "historico_files_select_own" on storage.objects;
create policy "historico_files_select_own"
on storage.objects for select
to authenticated
using (
  bucket_id = 'historico-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "historico_files_insert_own" on storage.objects;
create policy "historico_files_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'historico-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "historico_files_update_own" on storage.objects;
create policy "historico_files_update_own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'historico-files'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'historico-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "historico_files_delete_own" on storage.objects;
create policy "historico_files_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'historico-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create index if not exists historico_periodos_updated_idx
on public.historico_periodos (user_id, updated_at desc);


-- ============================================================


-- 2. Acceso, cuentas y sincronización


-- ============================================================
-- APPI · Acceso por número de distribuidor y datos por cuenta
-- Ejecutar después de SUPABASE_SETUP.sql en el SQL Editor de Supabase.

create table if not exists public.appi_perfiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  dip text unique,
  sucursal text,
  numero_distribuidor text,
  nombre text not null default '',
  rol text not null default 'usuario' check (rol in ('usuario','admin')),
  activo boolean not null default true,
  debe_cambiar_password boolean not null default false,
  membresia_meses integer check (membresia_meses is null or membresia_meses in (1,3,6)),
  membresia_inicio timestamptz,
  membresia_vence timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Compatibilidad para proyectos que ejecutaron una versión anterior del instalador.
alter table public.appi_perfiles add column if not exists username text;
alter table public.appi_perfiles add column if not exists debe_cambiar_password boolean not null default false;
alter table public.appi_perfiles add column if not exists membresia_meses integer;
alter table public.appi_perfiles add column if not exists membresia_inicio timestamptz;
alter table public.appi_perfiles add column if not exists membresia_vence timestamptz;
alter table public.appi_perfiles add column if not exists sucursal text;
alter table public.appi_perfiles add column if not exists numero_distribuidor text;
alter table public.appi_perfiles alter column dip drop not null;
alter table public.appi_perfiles alter column sucursal drop not null;
alter table public.appi_perfiles alter column numero_distribuidor drop not null;
update public.appi_perfiles
set
  sucursal = coalesce(sucursal, left(regexp_replace(dip, '\\D', '', 'g'), 2)),
  numero_distribuidor = coalesce(numero_distribuidor, substring(regexp_replace(dip, '\\D', '', 'g') from 3))
where dip is not null and (sucursal is null or numero_distribuidor is null);
alter table public.appi_perfiles drop constraint if exists appi_perfiles_dip_formato;
alter table public.appi_perfiles add constraint appi_perfiles_dip_formato check (
  (
    rol = 'admin'
    and username ~ '^[a-z0-9._-]{3,30}$'
    and dip is null
    and sucursal is null
    and numero_distribuidor is null
  )
  or
  (
    rol = 'usuario'
    and dip = sucursal || '-' || numero_distribuidor
    and sucursal ~ '^[0-9]{2}$'
    and numero_distribuidor ~ '^[0-9]{1,12}$'
  )
);
create unique index if not exists appi_perfiles_username_lower_idx
on public.appi_perfiles (lower(username))
where username is not null;

alter table public.appi_perfiles enable row level security;
grant select on public.appi_perfiles to authenticated;

drop policy if exists "appi_perfil_select_own" on public.appi_perfiles;
create policy "appi_perfil_select_own"
on public.appi_perfiles for select
to authenticated
using (auth.uid() = user_id);

create or replace function public.appi_cuenta_activa()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.appi_perfiles
    where user_id = auth.uid()
      and activo = true
      and (
        rol = 'admin'
        or (membresia_vence is not null and membresia_vence > now())
      )
  );
$$;

revoke all on function public.appi_cuenta_activa() from public;
grant execute on function public.appi_cuenta_activa() to authenticated;

create or replace function public.appi_confirmar_cambio_password()
returns void
language sql
security definer
set search_path = public
as $$
  update public.appi_perfiles
  set debe_cambiar_password = false, updated_at = now()
  where user_id = auth.uid();
$$;

revoke all on function public.appi_confirmar_cambio_password() from public;
grant execute on function public.appi_confirmar_cambio_password() to authenticated;

create table if not exists public.appi_datos (
  user_id uuid not null references auth.users(id) on delete cascade,
  data_key text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, data_key),
  constraint appi_data_key_length check (char_length(data_key) between 1 and 120)
);

alter table public.appi_datos enable row level security;
grant select, insert, update, delete on public.appi_datos to authenticated;

create index if not exists appi_datos_updated_idx
on public.appi_datos (user_id, updated_at desc);

drop policy if exists "appi_datos_select_own" on public.appi_datos;
create policy "appi_datos_select_own"
on public.appi_datos for select
to authenticated
using (auth.uid() = user_id and public.appi_cuenta_activa());

drop policy if exists "appi_datos_insert_own" on public.appi_datos;
create policy "appi_datos_insert_own"
on public.appi_datos for insert
to authenticated
with check (auth.uid() = user_id and public.appi_cuenta_activa());

drop policy if exists "appi_datos_update_own" on public.appi_datos;
create policy "appi_datos_update_own"
on public.appi_datos for update
to authenticated
using (auth.uid() = user_id and public.appi_cuenta_activa())
with check (auth.uid() = user_id and public.appi_cuenta_activa());

drop policy if exists "appi_datos_delete_own" on public.appi_datos;
create policy "appi_datos_delete_own"
on public.appi_datos for delete
to authenticated
using (auth.uid() = user_id and public.appi_cuenta_activa());

-- Las cuentas nuevas también pueden usar el Histórico existente.
-- Al reactivar a todos, cada cierre queda ligado al user_id autenticado.
drop policy if exists "historico_select_own" on public.historico_periodos;
create policy "historico_select_own"
on public.historico_periodos for select
to authenticated
using (auth.uid() = user_id and public.appi_cuenta_activa());

drop policy if exists "historico_insert_own" on public.historico_periodos;
create policy "historico_insert_own"
on public.historico_periodos for insert
to authenticated
with check (auth.uid() = user_id and public.appi_cuenta_activa());

drop policy if exists "historico_update_own" on public.historico_periodos;
create policy "historico_update_own"
on public.historico_periodos for update
to authenticated
using (auth.uid() = user_id and public.appi_cuenta_activa())
with check (auth.uid() = user_id and public.appi_cuenta_activa());

drop policy if exists "historico_delete_own" on public.historico_periodos;
create policy "historico_delete_own"
on public.historico_periodos for delete
to authenticated
using (auth.uid() = user_id and public.appi_cuenta_activa());

-- Refuerza también el bucket privado del Histórico para cuentas activas.
drop policy if exists "historico_files_select_own" on storage.objects;
create policy "historico_files_select_own"
on storage.objects for select
to authenticated
using (
  bucket_id = 'historico-files'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.appi_cuenta_activa()
);

drop policy if exists "historico_files_insert_own" on storage.objects;
create policy "historico_files_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'historico-files'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.appi_cuenta_activa()
);

drop policy if exists "historico_files_update_own" on storage.objects;
create policy "historico_files_update_own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'historico-files'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.appi_cuenta_activa()
)
with check (
  bucket_id = 'historico-files'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.appi_cuenta_activa()
);

drop policy if exists "historico_files_delete_own" on storage.objects;
create policy "historico_files_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'historico-files'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.appi_cuenta_activa()
);

-- Actualiza updated_at sin confiar en la hora del navegador.
create or replace function public.appi_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists appi_perfiles_touch on public.appi_perfiles;
create trigger appi_perfiles_touch
before insert or update on public.appi_perfiles
for each row execute function public.appi_touch_updated_at();

drop trigger if exists appi_datos_touch on public.appi_datos;
create trigger appi_datos_touch
before insert or update on public.appi_datos
for each row execute function public.appi_touch_updated_at();


-- ============================================================


-- 3. Solicitudes y WhatsApp


-- ============================================================
-- APPI · Solicitudes públicas de cuenta y configuración de WhatsApp

create table if not exists public.appi_configuracion (
  config_key text primary key,
  config_value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.appi_configuracion enable row level security;
revoke all on public.appi_configuracion from anon, authenticated;

insert into public.appi_configuracion (config_key, config_value)
values ('whatsapp_soporte', jsonb_build_object('numero', '5493515638843'))
on conflict (config_key) do nothing;

create table if not exists public.appi_solicitudes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  dip text not null,
  sucursal text not null,
  numero_distribuidor text not null,
  telefono text not null,
  estado text not null default 'pendiente' check (estado in ('pendiente','aprobada','rechazada')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  constraint appi_solicitud_nombre check (char_length(nombre) between 3 and 120),
  constraint appi_solicitud_sucursal check (sucursal ~ '^[0-9]{2}$'),
  constraint appi_solicitud_numero check (numero_distribuidor ~ '^[0-9]{1,12}$'),
  constraint appi_solicitud_dip check (dip = sucursal || '-' || numero_distribuidor),
  constraint appi_solicitud_telefono check (telefono ~ '^[0-9]{8,15}$')
);

alter table public.appi_solicitudes enable row level security;
revoke all on public.appi_solicitudes from anon, authenticated;

create index if not exists appi_solicitudes_estado_fecha_idx
on public.appi_solicitudes (estado, created_at desc);

create unique index if not exists appi_solicitud_pendiente_dip_idx
on public.appi_solicitudes (dip)
where estado = 'pendiente';

select
  'Solicitudes y WhatsApp configurados' as resultado,
  to_regclass('public.appi_solicitudes') is not null as solicitudes_listas,
  to_regclass('public.appi_configuracion') is not null as configuracion_lista;


-- ============================================================


-- 4. Validación de titular


-- ============================================================
-- APPI · Bloqueo de planillas pertenecientes a otro distribuidor

create or replace function public.appi_planilla_pertenece_a_usuario(
  owner_id uuid,
  planilla_dip text,
  planilla_sucursal text default ''
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  perfil public.appi_perfiles%rowtype;
  detectado text := regexp_replace(coalesce(planilla_dip,''), '\D', '', 'g');
  suc_detectada text := regexp_replace(coalesce(planilla_sucursal,''), '\D', '', 'g');
  esperado text;
begin
  select * into perfil from public.appi_perfiles where user_id = owner_id;
  if not found then return false; end if;
  if perfil.rol = 'admin' then return true; end if;
  esperado := coalesce(perfil.sucursal,'') || coalesce(perfil.numero_distribuidor,'');
  if detectado = '' or perfil.numero_distribuidor is null then return false; end if;
  if not (detectado = perfil.numero_distribuidor or detectado = esperado or right(detectado,char_length(perfil.numero_distribuidor)) = perfil.numero_distribuidor) then return false; end if;
  if char_length(detectado) > char_length(perfil.numero_distribuidor)
     and left(detectado,char_length(detectado)-char_length(perfil.numero_distribuidor)) <> perfil.sucursal then return false; end if;
  if char_length(suc_detectada) >= 2 and position(perfil.sucursal in suc_detectada) = 0 then return false; end if;
  return true;
end;
$$;

revoke all on function public.appi_planilla_pertenece_a_usuario(uuid,text,text) from public;
grant execute on function public.appi_planilla_pertenece_a_usuario(uuid,text,text) to authenticated;

create or replace function public.appi_validar_equipo_guardado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare payload jsonb;
begin
  if new.data_key <> 'equipoData' then return new; end if;
  begin
    payload := (new.data->>'value')::jsonb;
  exception when others then
    raise exception 'El archivo de equipo no tiene un formato válido.';
  end;
  if not public.appi_planilla_pertenece_a_usuario(new.user_id,payload#>>'{titular,dip}',payload#>>'{titular,sucursal}') then
    raise exception 'La planilla no pertenece al distribuidor autenticado.';
  end if;
  return new;
end;
$$;

drop trigger if exists appi_datos_validar_equipo on public.appi_datos;
create trigger appi_datos_validar_equipo
before insert or update on public.appi_datos
for each row execute function public.appi_validar_equipo_guardado();

create or replace function public.appi_validar_historico_guardado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.appi_planilla_pertenece_a_usuario(new.user_id,new.data#>>'{titular,dip}',new.data#>>'{titular,sucursal}') then
    raise exception 'El cierre histórico no pertenece al distribuidor autenticado.';
  end if;
  return new;
end;
$$;

drop trigger if exists appi_historico_validar_titular on public.historico_periodos;
create trigger appi_historico_validar_titular
before insert or update on public.historico_periodos
for each row execute function public.appi_validar_historico_guardado();

select 'Validación de titular instalada' as resultado;


-- ============================================================


-- 5. Verificación final


-- ============================================================
select 'APPI instalada correctamente' as resultado,
  to_regclass('public.historico_periodos') is not null as historico_listo,
  to_regclass('public.appi_perfiles') is not null as perfiles_listos,
  to_regclass('public.appi_datos') is not null as datos_listos,
  to_regclass('public.appi_solicitudes') is not null as solicitudes_listas;


-- ============================================================
-- 6. Mi Encuesta y Mi Gestión
-- ============================================================

-- APPI · Mi Encuesta + Mi Gestión
-- Ejecutar una sola vez en el SQL Editor del proyecto appi-produccion.
-- Requiere que SUPABASE_ACCESO.sql ya esté instalado.

create extension if not exists pgcrypto;

-- ============================================================
-- 1. Utilidades de seguridad
-- ============================================================

create or replace function public.appi_es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.appi_perfiles
    where user_id = auth.uid()
      and rol = 'admin'
      and activo = true
  );
$$;

revoke all on function public.appi_es_admin() from public;
grant execute on function public.appi_es_admin() to authenticated;

create or replace function public.appi_normalizar_telefono(value text)
returns text
language sql
immutable
set search_path = public
as $$
  select left(regexp_replace(coalesce(value, ''), '\D', '', 'g'), 15);
$$;

revoke all on function public.appi_normalizar_telefono(text) from public;
grant execute on function public.appi_normalizar_telefono(text) to authenticated, service_role;

-- ============================================================
-- 2. Enlace público permanente por distribuidor
-- ============================================================

create table if not exists public.appi_encuesta_links (
  user_id uuid primary key references auth.users(id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.appi_encuesta_links enable row level security;
grant select on public.appi_encuesta_links to authenticated;
revoke insert, update, delete on public.appi_encuesta_links from anon, authenticated;

create or replace function public.appi_crear_link_encuesta_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.rol = 'usuario' then
    insert into public.appi_encuesta_links (user_id)
    values (new.user_id)
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

revoke all on function public.appi_crear_link_encuesta_perfil() from public;

drop trigger if exists appi_perfil_crear_link_encuesta on public.appi_perfiles;
create trigger appi_perfil_crear_link_encuesta
after insert or update of rol on public.appi_perfiles
for each row execute function public.appi_crear_link_encuesta_perfil();

-- Crea el enlace de los distribuidores que ya existían.
insert into public.appi_encuesta_links (user_id)
select user_id
from public.appi_perfiles
where rol = 'usuario'
on conflict (user_id) do nothing;

drop policy if exists "appi_encuesta_links_select_own" on public.appi_encuesta_links;
create policy "appi_encuesta_links_select_own"
on public.appi_encuesta_links for select
to authenticated
using (
  (auth.uid() = user_id and public.appi_cuenta_activa())
  or public.appi_es_admin()
);

-- ============================================================
-- 3. Respuestas completas de la encuesta
-- ============================================================

create table if not exists public.appi_encuestas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  link_token uuid not null,
  client_submission_id uuid not null,
  nombre text not null,
  telefono text not null,
  telefono_normalizado text not null,
  respuestas jsonb not null default '{}'::jsonb,
  referidos jsonb not null default '[]'::jsonb,
  consentimiento boolean not null default false,
  autorizacion_referidos boolean not null default false,
  created_at timestamptz not null default now(),
  constraint appi_encuesta_nombre_length check (char_length(nombre) between 2 and 120),
  constraint appi_encuesta_telefono_length check (char_length(telefono_normalizado) between 8 and 15),
  constraint appi_encuesta_respuestas_object check (jsonb_typeof(respuestas) = 'object'),
  constraint appi_encuesta_referidos_array check (jsonb_typeof(referidos) = 'array'),
  constraint appi_encuesta_consentimiento check (consentimiento = true),
  unique (user_id, client_submission_id)
);

create index if not exists appi_encuestas_user_fecha_idx
on public.appi_encuestas (user_id, created_at desc);

alter table public.appi_encuestas enable row level security;
grant select, delete on public.appi_encuestas to authenticated;
revoke insert, update on public.appi_encuestas from anon, authenticated;

-- Cada vez que el distribuidor comparte se crea una invitación privada.
-- Es válida por 24 horas, queda ligada al primer dispositivo que la abre
-- y acepta una sola encuesta.
create table if not exists public.appi_encuesta_invitaciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  claim_id uuid,
  opened_at timestamptz,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  used_at timestamptz,
  encuesta_id uuid references public.appi_encuestas(id) on delete set null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appi_encuesta_invitacion_fechas check (expires_at > created_at)
);

create index if not exists appi_encuesta_invitaciones_user_idx
on public.appi_encuesta_invitaciones (user_id, created_at desc);

create index if not exists appi_encuesta_invitaciones_vigentes_idx
on public.appi_encuesta_invitaciones (expires_at)
where used_at is null and revoked_at is null;

alter table public.appi_encuesta_invitaciones enable row level security;
grant select on public.appi_encuesta_invitaciones to authenticated;
revoke insert, update, delete on public.appi_encuesta_invitaciones from anon, authenticated;

create or replace function public.appi_crear_invitacion_encuesta()
returns table(token uuid, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
  new_token uuid;
  new_expires timestamptz;
begin
  select p.user_id into owner_id
  from public.appi_perfiles p
  where p.user_id = auth.uid()
    and p.rol = 'usuario'
    and p.activo = true
    and p.membresia_vence is not null
    and p.membresia_vence > now();

  if owner_id is null then
    raise exception 'Necesitás una cuenta distribuidora activa para compartir la encuesta.' using errcode = 'P0001';
  end if;

  -- Evita acumular invitaciones abiertas indefinidamente.
  update public.appi_encuesta_invitaciones
  set revoked_at = now(), updated_at = now()
  where user_id = owner_id
    and used_at is null
    and revoked_at is null
    and expires_at <= now();

  insert into public.appi_encuesta_invitaciones as created (user_id)
  values (owner_id)
  returning created.token, created.expires_at
  into new_token, new_expires;

  return query select new_token, new_expires;
end;
$$;

revoke all on function public.appi_crear_invitacion_encuesta() from public, anon;
grant execute on function public.appi_crear_invitacion_encuesta() to authenticated;

create or replace function public.appi_reclamar_invitacion_encuesta(
  p_token uuid,
  p_claim_id uuid
)
returns table(user_id uuid, nombre text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation public.appi_encuesta_invitaciones%rowtype;
  owner_profile public.appi_perfiles%rowtype;
begin
  select * into invitation
  from public.appi_encuesta_invitaciones
  where token = p_token
  for update;

  if not found or invitation.revoked_at is not null then
    raise exception 'Esta invitación no está disponible.' using errcode = 'P0001';
  end if;
  if invitation.used_at is not null then
    raise exception 'Esta invitación ya fue utilizada.' using errcode = 'P0001';
  end if;
  if invitation.expires_at <= now() then
    raise exception 'Esta invitación venció. Pedí un enlace nuevo.' using errcode = 'P0001';
  end if;
  if invitation.claim_id is null then
    update public.appi_encuesta_invitaciones
    set claim_id = p_claim_id, opened_at = now(), updated_at = now()
    where id = invitation.id;
    invitation.claim_id := p_claim_id;
  elsif invitation.claim_id <> p_claim_id then
    raise exception 'Esta invitación ya fue abierta en otro dispositivo.' using errcode = 'P0001';
  end if;

  select * into owner_profile
  from public.appi_perfiles
  where appi_perfiles.user_id = invitation.user_id
    and rol = 'usuario'
    and activo = true
    and membresia_vence is not null
    and membresia_vence > now();

  if not found then
    raise exception 'Esta encuesta no está disponible en este momento.' using errcode = 'P0001';
  end if;

  return query select invitation.user_id, owner_profile.nombre, invitation.expires_at;
end;
$$;

revoke all on function public.appi_reclamar_invitacion_encuesta(uuid,uuid) from public, anon, authenticated;
grant execute on function public.appi_reclamar_invitacion_encuesta(uuid,uuid) to service_role;

-- ============================================================
-- 4. Contactos de Mi Gestión
-- ============================================================

create table if not exists public.appi_gestion_contactos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  encuesta_id uuid references public.appi_encuestas(id) on delete set null,
  tipo text not null default 'manual' check (tipo in ('encuestado','referido','manual')),
  nombre text not null,
  telefono text not null,
  telefono_normalizado text not null,
  relacion text not null default '',
  zona text not null default '',
  referido_por text not null default '',
  estado text not null default 'nuevo' check (estado in ('nuevo','contactado','seguimiento','presentacion','convertido','no_interesado')),
  notas text not null default '',
  proximo_contacto date,
  ultimo_contacto timestamptz,
  cantidad_origenes integer not null default 1 check (cantidad_origenes >= 1),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appi_gestion_nombre_length check (char_length(nombre) between 2 and 120),
  constraint appi_gestion_telefono_length check (char_length(telefono_normalizado) between 8 and 15),
  constraint appi_gestion_notas_length check (char_length(notas) <= 5000),
  constraint appi_gestion_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create unique index if not exists appi_gestion_contacto_telefono_uidx
on public.appi_gestion_contactos (user_id, telefono_normalizado)
where telefono_normalizado <> '';

create index if not exists appi_gestion_user_estado_idx
on public.appi_gestion_contactos (user_id, estado, updated_at desc);

create index if not exists appi_gestion_user_proximo_idx
on public.appi_gestion_contactos (user_id, proximo_contacto)
where proximo_contacto is not null;

alter table public.appi_gestion_contactos enable row level security;
grant select, insert, update, delete on public.appi_gestion_contactos to authenticated;

-- ============================================================
-- 5. Políticas por distribuidor
-- ============================================================

drop policy if exists "appi_encuestas_select_own" on public.appi_encuestas;
create policy "appi_encuestas_select_own"
on public.appi_encuestas for select
to authenticated
using (
  (auth.uid() = user_id and public.appi_cuenta_activa())
  or public.appi_es_admin()
);

drop policy if exists "appi_encuestas_delete_own" on public.appi_encuestas;
create policy "appi_encuestas_delete_own"
on public.appi_encuestas for delete
to authenticated
using (
  (auth.uid() = user_id and public.appi_cuenta_activa())
  or public.appi_es_admin()
);

drop policy if exists "appi_encuesta_invitaciones_select_own" on public.appi_encuesta_invitaciones;
create policy "appi_encuesta_invitaciones_select_own"
on public.appi_encuesta_invitaciones for select
to authenticated
using (
  (auth.uid() = user_id and public.appi_cuenta_activa())
  or public.appi_es_admin()
);

drop policy if exists "appi_gestion_select_own" on public.appi_gestion_contactos;
create policy "appi_gestion_select_own"
on public.appi_gestion_contactos for select
to authenticated
using (
  (auth.uid() = user_id and public.appi_cuenta_activa())
  or public.appi_es_admin()
);

drop policy if exists "appi_gestion_insert_own" on public.appi_gestion_contactos;
create policy "appi_gestion_insert_own"
on public.appi_gestion_contactos for insert
to authenticated
with check (auth.uid() = user_id and public.appi_cuenta_activa());

drop policy if exists "appi_gestion_update_own" on public.appi_gestion_contactos;
create policy "appi_gestion_update_own"
on public.appi_gestion_contactos for update
to authenticated
using (
  (auth.uid() = user_id and public.appi_cuenta_activa())
  or public.appi_es_admin()
)
with check (
  (auth.uid() = user_id and public.appi_cuenta_activa())
  or public.appi_es_admin()
);

drop policy if exists "appi_gestion_delete_own" on public.appi_gestion_contactos;
create policy "appi_gestion_delete_own"
on public.appi_gestion_contactos for delete
to authenticated
using (
  (auth.uid() = user_id and public.appi_cuenta_activa())
  or public.appi_es_admin()
);

-- ============================================================
-- 6. Actualización automática de fechas
-- ============================================================

drop trigger if exists appi_encuesta_links_touch on public.appi_encuesta_links;
create trigger appi_encuesta_links_touch
before update on public.appi_encuesta_links
for each row execute function public.appi_touch_updated_at();

drop trigger if exists appi_encuesta_invitaciones_touch on public.appi_encuesta_invitaciones;
create trigger appi_encuesta_invitaciones_touch
before update on public.appi_encuesta_invitaciones
for each row execute function public.appi_touch_updated_at();

drop trigger if exists appi_gestion_contactos_touch on public.appi_gestion_contactos;
create trigger appi_gestion_contactos_touch
before update on public.appi_gestion_contactos
for each row execute function public.appi_touch_updated_at();

-- ============================================================
-- 7. Alta atómica de encuesta + contactos
-- Sólo puede ejecutarla la Edge Function con service_role.
-- ============================================================

drop function if exists public.appi_registrar_encuesta_publica(uuid,uuid,jsonb);

create or replace function public.appi_registrar_encuesta_publica(
  p_token uuid,
  p_claim_id uuid,
  p_submission_id uuid,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation public.appi_encuesta_invitaciones%rowtype;
  owner_id uuid;
  response_id uuid;
  person_name text;
  person_phone text;
  person_phone_norm text;
  answer_data jsonb;
  referrals_data jsonb;
  referral jsonb;
  referral_name text;
  referral_phone text;
  referral_phone_norm text;
  referral_relation text;
  referral_zone text;
  referral_count integer := 0;
  contact_count integer := 0;
  daily_count integer := 0;
begin
  select * into invitation
  from public.appi_encuesta_invitaciones
  where token = p_token
  for update;

  if not found then
    raise exception 'Esta invitación no está disponible.' using errcode = 'P0001';
  end if;
  if invitation.claim_id is null or invitation.claim_id <> p_claim_id then
    raise exception 'Esta invitación pertenece a otro dispositivo.' using errcode = 'P0001';
  end if;

  owner_id := invitation.user_id;

  -- Reintentar el mismo envío es seguro aunque la invitación ya esté usada.
  if invitation.used_at is not null then
    select id, jsonb_array_length(referidos) into response_id, referral_count
    from public.appi_encuestas
    where user_id = owner_id
      and link_token = p_token
      and client_submission_id = p_submission_id;
    if response_id is not null then
      return jsonb_build_object(
        'ok', true,
        'duplicada', true,
        'encuesta_id', response_id,
        'contactos', 0,
        'referidos', referral_count
      );
    end if;
    raise exception 'Esta invitación ya fue utilizada.' using errcode = 'P0001';
  end if;

  if invitation.revoked_at is not null then
    raise exception 'Esta invitación fue cancelada.' using errcode = 'P0001';
  end if;
  if invitation.expires_at <= now() then
    raise exception 'Esta invitación venció. Pedí un enlace nuevo.' using errcode = 'P0001';
  end if;

  select p.user_id into owner_id
  from public.appi_perfiles p
  where p.user_id = invitation.user_id
    and p.rol = 'usuario'
    and p.activo = true
    and p.membresia_vence is not null
    and p.membresia_vence > now();

  if owner_id is null then
    raise exception 'Esta encuesta no está disponible en este momento.' using errcode = 'P0001';
  end if;

  select count(*) into daily_count
  from public.appi_encuestas
  where user_id = owner_id and created_at >= now() - interval '24 hours';
  if daily_count >= 200 then
    raise exception 'La encuesta alcanzó temporalmente el límite de respuestas. Intentá más tarde.' using errcode = 'P0001';
  end if;

  if coalesce((p_payload->>'consentimiento')::boolean, false) is not true then
    raise exception 'Es necesario aceptar el consentimiento.' using errcode = 'P0001';
  end if;

  person_name := trim(regexp_replace(coalesce(p_payload->>'nombre',''), '\s+', ' ', 'g'));
  person_phone := left(trim(coalesce(p_payload->>'telefono','')), 30);
  person_phone_norm := public.appi_normalizar_telefono(person_phone);
  answer_data := coalesce(p_payload->'respuestas', '{}'::jsonb);
  referrals_data := coalesce(p_payload->'referidos', '[]'::jsonb);

  if char_length(person_name) < 2 or char_length(person_name) > 120 then
    raise exception 'El nombre no es válido.' using errcode = 'P0001';
  end if;
  if char_length(person_phone_norm) < 8 then
    raise exception 'El teléfono no es válido.' using errcode = 'P0001';
  end if;
  if jsonb_typeof(answer_data) <> 'object' or jsonb_typeof(referrals_data) <> 'array' then
    raise exception 'El formato de la encuesta no es válido.' using errcode = 'P0001';
  end if;
  if jsonb_array_length(referrals_data) > 10 then
    raise exception 'La encuesta supera el máximo de referidos.' using errcode = 'P0001';
  end if;
  if jsonb_array_length(referrals_data) > 0
     and coalesce((p_payload->>'autorizacion_referidos')::boolean, false) is not true then
    raise exception 'Falta confirmar la autorización de los referidos.' using errcode = 'P0001';
  end if;

  insert into public.appi_encuestas (
    user_id, link_token, client_submission_id, nombre, telefono,
    telefono_normalizado, respuestas, referidos, consentimiento,
    autorizacion_referidos
  ) values (
    owner_id, p_token, p_submission_id, person_name, person_phone,
    person_phone_norm, answer_data, referrals_data, true,
    coalesce((p_payload->>'autorizacion_referidos')::boolean, false)
  )
  returning id into response_id;

  insert into public.appi_gestion_contactos (
    user_id, encuesta_id, tipo, nombre, telefono, telefono_normalizado,
    estado, metadata
  ) values (
    owner_id, response_id, 'encuestado', person_name, person_phone,
    person_phone_norm, 'nuevo', jsonb_build_object('ultima_fuente','encuesta')
  )
  on conflict (user_id, telefono_normalizado) where telefono_normalizado <> ''
  do update set
    encuesta_id = excluded.encuesta_id,
    tipo = 'encuestado',
    nombre = case
      when public.appi_gestion_contactos.nombre = 'Sin nombre' then excluded.nombre
      else public.appi_gestion_contactos.nombre
    end,
    telefono = excluded.telefono,
    cantidad_origenes = public.appi_gestion_contactos.cantidad_origenes + 1,
    metadata = public.appi_gestion_contactos.metadata || excluded.metadata,
    updated_at = now();
  contact_count := contact_count + 1;

  for referral in select value from jsonb_array_elements(referrals_data)
  loop
    referral_name := trim(regexp_replace(coalesce(referral->>'nombre',''), '\s+', ' ', 'g'));
    referral_phone := left(trim(coalesce(referral->>'telefono','')), 30);
    referral_phone_norm := public.appi_normalizar_telefono(referral_phone);
    referral_relation := left(trim(coalesce(referral->>'relacion','')), 80);
    referral_zone := left(trim(coalesce(referral->>'zona','')), 120);

    if char_length(referral_name) < 2 or char_length(referral_phone_norm) < 8 then
      continue;
    end if;

    insert into public.appi_gestion_contactos (
      user_id, encuesta_id, tipo, nombre, telefono, telefono_normalizado,
      relacion, zona, referido_por, estado, metadata
    ) values (
      owner_id, response_id, 'referido', left(referral_name,120), referral_phone,
      referral_phone_norm, referral_relation, referral_zone, person_name,
      'nuevo', jsonb_build_object('ultima_fuente','referido')
    )
    on conflict (user_id, telefono_normalizado) where telefono_normalizado <> ''
    do update set
      encuesta_id = excluded.encuesta_id,
      nombre = case
        when public.appi_gestion_contactos.nombre = 'Sin nombre' then excluded.nombre
        else public.appi_gestion_contactos.nombre
      end,
      telefono = excluded.telefono,
      relacion = case
        when public.appi_gestion_contactos.relacion = '' then excluded.relacion
        else public.appi_gestion_contactos.relacion
      end,
      zona = case
        when public.appi_gestion_contactos.zona = '' then excluded.zona
        else public.appi_gestion_contactos.zona
      end,
      referido_por = excluded.referido_por,
      cantidad_origenes = public.appi_gestion_contactos.cantidad_origenes + 1,
      metadata = public.appi_gestion_contactos.metadata || excluded.metadata,
      updated_at = now();

    referral_count := referral_count + 1;
    contact_count := contact_count + 1;
  end loop;

  update public.appi_encuesta_invitaciones
  set used_at = now(), encuesta_id = response_id, updated_at = now()
  where id = invitation.id;

  return jsonb_build_object(
    'ok', true,
    'duplicada', false,
    'encuesta_id', response_id,
    'contactos', contact_count,
    'referidos', referral_count
  );
end;
$$;

revoke all on function public.appi_registrar_encuesta_publica(uuid,uuid,uuid,jsonb) from public, anon, authenticated;
grant execute on function public.appi_registrar_encuesta_publica(uuid,uuid,uuid,jsonb) to service_role;

-- ============================================================
-- 8. Verificación final
-- ============================================================

select
  'Mi Encuesta y Mi Gestión instaladas' as resultado,
  to_regclass('public.appi_encuesta_links') is not null as links_anteriores_listos,
  to_regclass('public.appi_encuesta_invitaciones') is not null as invitaciones_privadas_listas,
  to_regclass('public.appi_encuestas') is not null as encuestas_listas,
  to_regclass('public.appi_gestion_contactos') is not null as gestion_lista;
