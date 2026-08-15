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
