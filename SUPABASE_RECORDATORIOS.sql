-- APPI · v216 · Recordatorios de Mi Gestión
-- Resumen diario a las 9:00 (hora de Argentina) y aviso puntual antes de cada
-- presentación con hora. Reutiliza las suscripciones Web Push del puente de
-- dispositivos: no crea un canal nuevo ni pide otro permiso al distribuidor.

create extension if not exists pgcrypto;
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ============================================================
-- 1. Hora opcional para las presentaciones
-- ============================================================

-- `proximo_contacto` es solo fecha. Para avisar "media hora antes" hace falta
-- una hora concreta, que sigue siendo opcional: sin hora, la presentación
-- viaja únicamente dentro del resumen de la mañana.
alter table public.appi_gestion_contactos
  add column if not exists proximo_contacto_hora time;

create index if not exists appi_gestion_presentaciones_hora_idx
on public.appi_gestion_contactos (proximo_contacto, proximo_contacto_hora)
where proximo_contacto is not null and proximo_contacto_hora is not null and estado = 'presentacion';

-- ============================================================
-- 2. Registro de recordatorios enviados
-- ============================================================

-- Garantiza que cada aviso salga una sola vez aunque el cron se ejecute de más,
-- se reintente o el proyecto se reinicie.
create table if not exists public.appi_recordatorios_enviados (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  persona_tipo text not null default 'titular' check (persona_tipo in ('titular','socio')),
  tipo text not null check (tipo in ('resumen_diario','presentacion')),
  clave text not null,
  contacto_id uuid references public.appi_gestion_contactos(id) on delete cascade,
  detalle jsonb not null default '{}'::jsonb,
  estado text not null default 'enviado' check (estado in ('enviado','sin_dispositivo','error')),
  created_at timestamptz not null default now(),
  constraint appi_recordatorio_detalle_object check (jsonb_typeof(detalle) = 'object'),
  constraint appi_recordatorio_clave_length check (char_length(clave) between 1 and 120),
  unique (user_id, persona_tipo, tipo, clave)
);

create index if not exists appi_recordatorios_user_fecha_idx
on public.appi_recordatorios_enviados (user_id, created_at desc);

-- Limpieza automática: el historial de avisos no necesita vivir para siempre.
create index if not exists appi_recordatorios_created_idx
on public.appi_recordatorios_enviados (created_at);

alter table public.appi_recordatorios_enviados enable row level security;
revoke all on public.appi_recordatorios_enviados from anon, authenticated;

drop policy if exists "appi_recordatorios_select_own" on public.appi_recordatorios_enviados;
create policy "appi_recordatorios_select_own"
on public.appi_recordatorios_enviados for select
to authenticated
using (auth.uid() = user_id and public.appi_cuenta_activa());

-- ============================================================
-- 3. Preferencia por dispositivo
-- ============================================================

-- Cada teléfono vinculado decide si quiere recibir recordatorios de Mi Gestión.
-- Las solicitudes de llamada siguen llegando siempre: son una acción explícita
-- que la persona acaba de iniciar desde su PC.
alter table public.appi_dispositivos_vinculados
  add column if not exists recordatorios boolean not null default true;

-- ============================================================
-- 4. Cálculo del resumen diario
-- ============================================================

-- Devuelve, por cuenta, los números del tablero Hoy de Mi Gestión.
-- La fecha se evalúa en horario argentino para que "hoy" signifique lo mismo
-- que ve el distribuidor en pantalla.
create or replace function public.appi_resumen_gestion(p_user_id uuid, p_fecha date)
returns table (
  nuevos integer,
  hoy integer,
  vencidos integer,
  presentaciones integer,
  encuestas_nuevas integer,
  total integer
)
language sql
stable
security definer
set search_path = public
as $$
  with base as (
    select
      count(*) filter (where estado = 'nuevo') as nuevos,
      count(*) filter (where proximo_contacto = p_fecha and estado not in ('convertido','no_interesado')) as hoy,
      count(*) filter (where proximo_contacto < p_fecha and estado not in ('convertido','no_interesado')) as vencidos,
      count(*) filter (where estado = 'presentacion') as presentaciones
    from public.appi_gestion_contactos
    where user_id = p_user_id
  ),
  encuestas as (
    select count(*) as recientes
    from public.appi_encuestas
    where user_id = p_user_id
      and (created_at at time zone 'America/Argentina/Buenos_Aires')::date = p_fecha - 1
  )
  select
    base.nuevos::integer,
    base.hoy::integer,
    base.vencidos::integer,
    base.presentaciones::integer,
    encuestas.recientes::integer,
    (base.nuevos + base.hoy + base.vencidos + base.presentaciones)::integer
  from base, encuestas;
$$;

revoke all on function public.appi_resumen_gestion(uuid, date) from anon, authenticated;
grant execute on function public.appi_resumen_gestion(uuid, date) to service_role;

-- ============================================================
-- 5. Cuentas que deben recibir el resumen
-- ============================================================

-- Solo cuentas activas, con membresía vigente, con al menos un teléfono
-- vinculado que aceptó notificaciones y recordatorios, y con acciones reales
-- para hacer hoy. Sin pendientes no se envía nada.
create or replace function public.appi_pendientes_resumen(p_fecha date)
returns table (
  user_id uuid,
  persona_tipo text,
  nombre text,
  device_id uuid,
  push_endpoint text,
  push_p256dh text,
  push_auth text,
  nuevos integer,
  hoy integer,
  vencidos integer,
  presentaciones integer,
  encuestas_nuevas integer,
  total integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    perfil.user_id,
    device.persona_tipo,
    case when device.persona_tipo = 'socio' then coalesce(nullif(perfil.socio_nombre, ''), 'Socio')
         else coalesce(nullif(perfil.nombre, ''), 'Distribuidor') end as nombre,
    device.id as device_id,
    device.push_endpoint,
    device.push_p256dh,
    device.push_auth,
    resumen.nuevos,
    resumen.hoy,
    resumen.vencidos,
    resumen.presentaciones,
    resumen.encuestas_nuevas,
    resumen.total
  from public.appi_perfiles perfil
  join public.appi_dispositivos_vinculados device
    on device.user_id = perfil.user_id
   and device.activo = true
   and device.notificaciones = true
   and device.recordatorios = true
   and device.push_endpoint is not null
  cross join lateral public.appi_resumen_gestion(perfil.user_id, p_fecha) as resumen
  where perfil.rol = 'usuario'
    and perfil.activo = true
    and perfil.membresia_vence > now()
    and resumen.total > 0
    and not exists (
      select 1 from public.appi_recordatorios_enviados enviado
      where enviado.user_id = perfil.user_id
        and enviado.persona_tipo = device.persona_tipo
        and enviado.tipo = 'resumen_diario'
        and enviado.clave = p_fecha::text
    );
$$;

revoke all on function public.appi_pendientes_resumen(date) from anon, authenticated;
grant execute on function public.appi_pendientes_resumen(date) to service_role;

-- ============================================================
-- 6. Presentaciones próximas
-- ============================================================

-- Presentaciones con hora que empiezan dentro de la ventana indicada.
-- Se avisa una sola vez por contacto y fecha.
create or replace function public.appi_presentaciones_proximas(p_minutos integer default 30)
returns table (
  user_id uuid,
  persona_tipo text,
  contacto_id uuid,
  contacto_nombre text,
  contacto_telefono text,
  fecha date,
  hora time,
  device_id uuid,
  push_endpoint text,
  push_p256dh text,
  push_auth text
)
language sql
stable
security definer
set search_path = public
as $$
  with ahora as (
    select (now() at time zone 'America/Argentina/Buenos_Aires') as local_ts
  )
  select
    contacto.user_id,
    device.persona_tipo,
    contacto.id as contacto_id,
    contacto.nombre as contacto_nombre,
    contacto.telefono as contacto_telefono,
    contacto.proximo_contacto as fecha,
    contacto.proximo_contacto_hora as hora,
    device.id as device_id,
    device.push_endpoint,
    device.push_p256dh,
    device.push_auth
  from public.appi_gestion_contactos contacto
  join public.appi_perfiles perfil
    on perfil.user_id = contacto.user_id
   and perfil.rol = 'usuario'
   and perfil.activo = true
   and perfil.membresia_vence > now()
  join public.appi_dispositivos_vinculados device
    on device.user_id = contacto.user_id
   and device.activo = true
   and device.notificaciones = true
   and device.recordatorios = true
   and device.push_endpoint is not null
  cross join ahora
  where contacto.estado = 'presentacion'
    and contacto.proximo_contacto is not null
    and contacto.proximo_contacto_hora is not null
    and (contacto.proximo_contacto + contacto.proximo_contacto_hora)
        between ahora.local_ts and ahora.local_ts + make_interval(mins => p_minutos)
    and not exists (
      select 1 from public.appi_recordatorios_enviados enviado
      where enviado.user_id = contacto.user_id
        and enviado.persona_tipo = device.persona_tipo
        and enviado.tipo = 'presentacion'
        and enviado.clave = contacto.id::text || '|' || contacto.proximo_contacto::text
    );
$$;

revoke all on function public.appi_presentaciones_proximas(integer) from anon, authenticated;
grant execute on function public.appi_presentaciones_proximas(integer) to service_role;

-- ============================================================
-- 7. Limpieza del historial
-- ============================================================

create or replace function public.appi_limpiar_recordatorios()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  eliminados integer;
begin
  delete from public.appi_recordatorios_enviados
  where created_at < now() - interval '90 days';
  get diagnostics eliminados = row_count;
  return eliminados;
end;
$$;

revoke all on function public.appi_limpiar_recordatorios() from anon, authenticated;
grant execute on function public.appi_limpiar_recordatorios() to service_role;

-- ============================================================
-- 8. Programación automática
-- ============================================================

-- El cron invoca la Edge Function `recordatorios-gestion`, que es la única
-- que sabe firmar Web Push. La clave de servicio se lee desde Vault: nunca
-- queda escrita en la definición del job ni en este archivo.
--
-- Antes de ejecutar esta sección, guardar los secretos una sola vez:
--
--   select vault.create_secret('https://TU_PROYECTO.supabase.co', 'appi_project_url');
--   select vault.create_secret('SERVICE_ROLE_KEY', 'appi_service_role_key');

create or replace function public.appi_disparar_recordatorios(p_modo text)
returns bigint
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_url text;
  v_key text;
  v_request_id bigint;
begin
  if p_modo not in ('resumen', 'presentaciones') then
    raise exception 'Modo de recordatorio desconocido: %', p_modo;
  end if;

  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'appi_project_url';
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'appi_service_role_key';
  if v_url is null or v_key is null then
    raise exception 'Faltan los secretos appi_project_url o appi_service_role_key en Vault.';
  end if;

  select net.http_post(
    url := v_url || '/functions/v1/recordatorios-gestion',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := jsonb_build_object('modo', p_modo),
    timeout_milliseconds := 55000
  ) into v_request_id;

  return v_request_id;
end;
$$;

revoke all on function public.appi_disparar_recordatorios(text) from anon, authenticated;
grant execute on function public.appi_disparar_recordatorios(text) to service_role;

-- Resumen diario: 9:00 en Argentina = 12:00 UTC.
select cron.unschedule('appi-resumen-diario')
where exists (select 1 from cron.job where jobname = 'appi-resumen-diario');

select cron.schedule(
  'appi-resumen-diario',
  '0 12 * * *',
  $cron$ select public.appi_disparar_recordatorios('resumen'); $cron$
);

-- Presentaciones: cada 15 minutos, avisando media hora antes.
select cron.unschedule('appi-presentaciones')
where exists (select 1 from cron.job where jobname = 'appi-presentaciones');

select cron.schedule(
  'appi-presentaciones',
  '*/15 * * * *',
  $cron$ select public.appi_disparar_recordatorios('presentaciones'); $cron$
);

-- Limpieza mensual del historial de avisos.
select cron.unschedule('appi-limpiar-recordatorios')
where exists (select 1 from cron.job where jobname = 'appi-limpiar-recordatorios');

select cron.schedule(
  'appi-limpiar-recordatorios',
  '30 4 1 * *',
  $cron$ select public.appi_limpiar_recordatorios(); $cron$
);

-- ============================================================
-- 9. Verificación
-- ============================================================

select
  'Recordatorios de Mi Gestión instalados' as resultado,
  to_regclass('public.appi_recordatorios_enviados') is not null as registro_listo,
  exists (
    select 1 from information_schema.columns
    where table_name = 'appi_gestion_contactos' and column_name = 'proximo_contacto_hora'
  ) as hora_presentacion_lista,
  exists (
    select 1 from information_schema.columns
    where table_name = 'appi_dispositivos_vinculados' and column_name = 'recordatorios'
  ) as preferencia_lista,
  (select count(*) from cron.job where jobname in ('appi-resumen-diario','appi-presentaciones','appi-limpiar-recordatorios')) as tareas_programadas;
