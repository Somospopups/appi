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

drop trigger if exists appi_gestion_contactos_touch on public.appi_gestion_contactos;
create trigger appi_gestion_contactos_touch
before update on public.appi_gestion_contactos
for each row execute function public.appi_touch_updated_at();

-- ============================================================
-- 7. Alta atómica de encuesta + contactos
-- Sólo puede ejecutarla la Edge Function con service_role.
-- ============================================================

create or replace function public.appi_registrar_encuesta_publica(
  p_token uuid,
  p_submission_id uuid,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
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
  select l.user_id into owner_id
  from public.appi_encuesta_links l
  join public.appi_perfiles p on p.user_id = l.user_id
  where l.token = p_token
    and l.activo = true
    and p.rol = 'usuario'
    and p.activo = true
    and p.membresia_vence is not null
    and p.membresia_vence > now();

  if owner_id is null then
    raise exception 'El enlace de encuesta no está disponible.' using errcode = 'P0001';
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
  on conflict (user_id, client_submission_id) do nothing
  returning id into response_id;

  -- Un doble toque en Enviar devuelve la misma respuesta sin duplicarla.
  if response_id is null then
    select id, jsonb_array_length(referidos) into response_id, referral_count
    from public.appi_encuestas
    where user_id = owner_id and client_submission_id = p_submission_id;
    return jsonb_build_object(
      'ok', true,
      'duplicada', true,
      'encuesta_id', response_id,
      'contactos', 0,
      'referidos', referral_count
    );
  end if;

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

  return jsonb_build_object(
    'ok', true,
    'duplicada', false,
    'encuesta_id', response_id,
    'contactos', contact_count,
    'referidos', referral_count
  );
end;
$$;

revoke all on function public.appi_registrar_encuesta_publica(uuid,uuid,jsonb) from public, anon, authenticated;
grant execute on function public.appi_registrar_encuesta_publica(uuid,uuid,jsonb) to service_role;

-- ============================================================
-- 8. Verificación final
-- ============================================================

select
  'Mi Encuesta y Mi Gestión instaladas' as resultado,
  to_regclass('public.appi_encuesta_links') is not null as links_listos,
  to_regclass('public.appi_encuestas') is not null as encuestas_listas,
  to_regclass('public.appi_gestion_contactos') is not null as gestion_lista,
  (
    select count(*)
    from public.appi_encuesta_links
  ) as enlaces_creados;
