-- APPI · Telegram · cada titular/socio vincula su chat
-- El token del bot NO va en este archivo: vive en el secreto
-- TELEGRAM_BOT_TOKEN de la Edge Function telegram-avisos.

create table if not exists public.appi_telegram_codigos (
  codigo text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  persona_tipo text not null check (persona_tipo in ('titular','socio')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint appi_telegram_codigo_len check (char_length(codigo) between 6 and 16)
);

create index if not exists appi_telegram_codigos_expira_idx
  on public.appi_telegram_codigos (expires_at);

create table if not exists public.appi_telegram_vinculos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  persona_tipo text not null check (persona_tipo in ('titular','socio')),
  chat_id bigint not null,
  telegram_username text,
  telegram_nombre text,
  created_at timestamptz not null default now(),
  unique (user_id, persona_tipo),
  unique (chat_id)
);

create index if not exists appi_telegram_vinculos_user_idx
  on public.appi_telegram_vinculos (user_id, persona_tipo);

alter table public.appi_telegram_codigos enable row level security;
alter table public.appi_telegram_vinculos enable row level security;
revoke all on public.appi_telegram_codigos from anon, authenticated;
revoke all on public.appi_telegram_vinculos from anon, authenticated;

drop policy if exists "appi_telegram_vinculos_select_own" on public.appi_telegram_vinculos;
create policy "appi_telegram_vinculos_select_own"
on public.appi_telegram_vinculos for select
to authenticated
using (auth.uid() = user_id and public.appi_cuenta_activa());

-- Cuentas con Telegram vinculado y pendientes de hoy, aunque no tengan push.
create or replace function public.appi_pendientes_telegram(p_fecha date)
returns table (
  user_id uuid,
  persona_tipo text,
  nombre text,
  chat_id bigint,
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
    vinculo.persona_tipo,
    case when vinculo.persona_tipo = 'socio' then coalesce(nullif(perfil.socio_nombre, ''), 'Socio')
         else coalesce(nullif(perfil.nombre, ''), 'Distribuidor') end as nombre,
    vinculo.chat_id,
    resumen.nuevos,
    resumen.hoy,
    resumen.vencidos,
    resumen.presentaciones,
    resumen.encuestas_nuevas,
    resumen.total
  from public.appi_telegram_vinculos vinculo
  join public.appi_perfiles perfil
    on perfil.user_id = vinculo.user_id
   and perfil.rol = 'usuario'
   and perfil.activo = true
   and perfil.membresia_vence > now()
  cross join lateral public.appi_resumen_gestion(perfil.user_id, p_fecha) as resumen
  where resumen.total > 0
    and not exists (
      select 1 from public.appi_recordatorios_enviados enviado
      where enviado.user_id = perfil.user_id
        and enviado.persona_tipo = vinculo.persona_tipo
        and enviado.tipo = 'resumen_diario'
        and enviado.clave = p_fecha::text
    );
$$;

revoke all on function public.appi_pendientes_telegram(date) from anon, authenticated;
grant execute on function public.appi_pendientes_telegram(date) to service_role;

create or replace function public.appi_presentaciones_telegram(p_minutos integer default 30)
returns table (
  user_id uuid,
  persona_tipo text,
  contacto_id uuid,
  contacto_nombre text,
  fecha date,
  hora time,
  chat_id bigint
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
    vinculo.persona_tipo,
    contacto.id as contacto_id,
    contacto.nombre as contacto_nombre,
    contacto.proximo_contacto as fecha,
    contacto.proximo_contacto_hora as hora,
    vinculo.chat_id
  from public.appi_gestion_contactos contacto
  join public.appi_perfiles perfil
    on perfil.user_id = contacto.user_id
   and perfil.rol = 'usuario'
   and perfil.activo = true
   and perfil.membresia_vence > now()
  join public.appi_telegram_vinculos vinculo
    on vinculo.user_id = contacto.user_id
  cross join ahora
  where contacto.estado = 'presentacion'
    and contacto.proximo_contacto is not null
    and contacto.proximo_contacto_hora is not null
    and (contacto.proximo_contacto + contacto.proximo_contacto_hora)
        between ahora.local_ts and ahora.local_ts + make_interval(mins => p_minutos)
    and not exists (
      select 1 from public.appi_recordatorios_enviados enviado
      where enviado.user_id = contacto.user_id
        and enviado.persona_tipo = vinculo.persona_tipo
        and enviado.tipo = 'presentacion'
        and enviado.clave = contacto.id::text || '|' || contacto.proximo_contacto::text
    );
$$;

revoke all on function public.appi_presentaciones_telegram(integer) from anon, authenticated;
grant execute on function public.appi_presentaciones_telegram(integer) to service_role;

select 'Telegram de APPI listo' as resultado,
  to_regclass('public.appi_telegram_vinculos') is not null as vinculos,
  to_regclass('public.appi_telegram_codigos') is not null as codigos;
