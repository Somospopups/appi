-- APPI · v544 · Avisos por Telegram
-- Canal de avisos alternativo al Web Push: el distribuidor vincula su chat de
-- Telegram y el resumen diario (8:00 ART) y los avisos de presentación llegan
-- ahí, aunque la PWA no esté instalada, el navegador duerma la app o nunca se
-- haya vinculado un teléfono. Reutiliza la reserva anti-duplicados de
-- appi_recordatorios_enviados: un aviso se envía una sola vez por persona.

create extension if not exists pgcrypto;

-- ============================================================
-- 1. Canales de aviso por cuenta y persona
-- ============================================================

create table if not exists public.appi_canales_aviso (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  persona_tipo text not null default 'titular' check (persona_tipo in ('titular','socio')),
  canal text not null default 'telegram' check (canal in ('telegram')),
  destino text,
  activo boolean not null default false,
  codigo text,
  codigo_vence timestamptz,
  ultimo_error text,
  ultimo_uso timestamptz,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint appi_canal_destino_vacio check (destino is null or destino <> ''),
  constraint appi_canal_codigo_vacio check (codigo is null or codigo <> '')
);

-- Una fila por (cuenta, persona, canal): vincular otra vez reemplaza el destino.
create unique index if not exists appi_canales_aviso_persona_uq
on public.appi_canales_aviso (user_id, persona_tipo, canal);

-- Un mismo chat de Telegram no puede pertenecer a dos cuentas distintas.
create unique index if not exists appi_canales_aviso_destino_uq
on public.appi_canales_aviso (destino) where destino is not null;

-- Búsqueda del código de vínculo en el webhook (/start codigo).
create index if not exists appi_canales_aviso_codigo_idx
on public.appi_canales_aviso (codigo) where codigo is not null;

-- Búsqueda por chat para /pausa y /reanudar.
create index if not exists appi_canales_aviso_destino_activo_idx
on public.appi_canales_aviso (destino, activo) where activo and destino is not null;

alter table public.appi_canales_aviso enable row level security;
revoke all on public.appi_canales_aviso from anon;

drop policy if exists "appi_canales_aviso_select_own" on public.appi_canales_aviso;
create policy "appi_canales_aviso_select_own"
on public.appi_canales_aviso for select
to authenticated
using (auth.uid() = user_id and public.appi_cuenta_activa());

-- ============================================================
-- 2. Candidatos al resumen diario (sin depender del dispositivo)
-- ============================================================

-- Quien tenga un canal Telegram activo o un teléfono con Web Push apto recibe
-- el resumen. Se devuelve una fila por persona (antes era una por teléfono),
-- y la Edge Function decide a qué dispositivos y chats enviar.
create or replace function public.appi_pendientes_canales(p_fecha date)
returns table (
  user_id uuid,
  persona_tipo text,
  nombre text,
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
  with fuentes as (
    select c.user_id, c.persona_tipo
    from public.appi_canales_aviso c
    where c.canal = 'telegram'
      and c.activo = true
      and c.destino is not null
    union
    select distinct d.user_id, d.persona_tipo
    from public.appi_dispositivos_vinculados d
    where d.activo = true
      and d.notificaciones = true
      and d.recordatorios = true
      and d.push_endpoint is not null
  )
  select
    fu.user_id,
    fu.persona_tipo,
    case when fu.persona_tipo = 'socio' then coalesce(nullif(perfil.socio_nombre, ''), 'Socio')
         else coalesce(nullif(perfil.nombre, ''), 'Distribuidor') end as nombre,
    resumen.nuevos,
    resumen.hoy,
    resumen.vencidos,
    resumen.presentaciones,
    resumen.encuestas_nuevas,
    resumen.total
  from fuentes fu
  join public.appi_perfiles perfil
    on perfil.user_id = fu.user_id
   and perfil.rol = 'usuario'
   and perfil.activo = true
   and perfil.membresia_vence > now()
  cross join lateral public.appi_resumen_gestion(fu.user_id, p_fecha) as resumen
  where resumen.total > 0
    and not exists (
      select 1 from public.appi_recordatorios_enviados enviado
      where enviado.user_id = fu.user_id
        and enviado.persona_tipo = fu.persona_tipo
        and enviado.tipo = 'resumen_diario'
        and enviado.clave = p_fecha::text
    );
$$;

revoke all on function public.appi_pendientes_canales(date) from anon, authenticated;
grant execute on function public.appi_pendientes_canales(date) to service_role;

-- ============================================================
-- 3. Presentaciones próximas (por persona, sin depender del dispositivo)
-- ============================================================

create or replace function public.appi_presentaciones_canales(p_minutos integer default 30)
returns table (
  user_id uuid,
  persona_tipo text,
  contacto_id uuid,
  contacto_nombre text,
  fecha date,
  hora time
)
language sql
stable
security definer
set search_path = public
as $$
  with ahora as (
    select (now() at time zone 'America/Argentina/Buenos_Aires') as local_ts
  ),
  fuentes as (
    select c.user_id, c.persona_tipo
    from public.appi_canales_aviso c
    where c.canal = 'telegram'
      and c.activo = true
      and c.destino is not null
    union
    select distinct d.user_id, d.persona_tipo
    from public.appi_dispositivos_vinculados d
    where d.activo = true
      and d.notificaciones = true
      and d.recordatorios = true
      and d.push_endpoint is not null
  )
  select
    contacto.user_id,
    fu.persona_tipo,
    contacto.id as contacto_id,
    contacto.nombre as contacto_nombre,
    contacto.proximo_contacto as fecha,
    contacto.proximo_contacto_hora as hora
  from public.appi_gestion_contactos contacto
  join fuentes fu
    on fu.user_id = contacto.user_id
  join public.appi_perfiles perfil
    on perfil.user_id = contacto.user_id
   and perfil.rol = 'usuario'
   and perfil.activo = true
   and perfil.membresia_vence > now()
  cross join ahora
  where contacto.estado = 'presentacion'
    and contacto.proximo_contacto is not null
    and contacto.proximo_contacto_hora is not null
    and (contacto.proximo_contacto + contacto.proximo_contacto_hora)
        between ahora.local_ts and ahora.local_ts + make_interval(mins => p_minutos)
    and not exists (
      select 1 from public.appi_recordatorios_enviados enviado
      where enviado.user_id = contacto.user_id
        and enviado.persona_tipo = fu.persona_tipo
        and enviado.tipo = 'presentacion'
        and enviado.clave = contacto.id::text || '|' || contacto.proximo_contacto::text
    );
$$;

revoke all on function public.appi_presentaciones_canales(integer) from anon, authenticated;
grant execute on function public.appi_presentaciones_canales(integer) to service_role;

-- ============================================================
-- 4. Resumen diario a las 8:00 (antes era 9:00)
-- ============================================================

-- 8:00 en Argentina (UTC-3, sin DST) = 11:00 UTC.
select cron.unschedule('appi-resumen-diario')
where exists (select 1 from cron.job where jobname = 'appi-resumen-diario');

select cron.schedule(
  'appi-resumen-diario',
  '0 11 * * *',
  $cron$ select public.appi_disparar_recordatorios('resumen'); $cron$
);

-- ============================================================
-- 5. Verificación
-- ============================================================

select
  'Avisos por Telegram instalados' as resultado,
  to_regclass('public.appi_canales_aviso') is not null as canal_listo,
  to_regprocedure('public.appi_pendientes_canales(date)') is not null as resumen_canales,
  to_regprocedure('public.appi_presentaciones_canales(integer)') is not null as presentaciones_canales,
  (select schedule from cron.job where jobname = 'appi-resumen-diario') as resumen_cron;
