-- APPI · Puente entre PC/tablet y teléfono
-- Vinculación segura, suscripciones Web Push y comandos de llamada.

create extension if not exists pgcrypto;

create table if not exists public.appi_dispositivos_vinculados (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_key uuid not null,
  nombre text not null,
  plataforma text not null default 'otro' check (plataforma in ('android','ios','otro')),
  user_agent text not null default '',
  push_endpoint text,
  push_p256dh text,
  push_auth text,
  notificaciones boolean not null default false,
  activo boolean not null default true,
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appi_dispositivo_nombre_length check (char_length(nombre) between 2 and 80),
  constraint appi_dispositivo_endpoint_length check (push_endpoint is null or char_length(push_endpoint) between 20 and 3000),
  unique (user_id, device_key)
);

create unique index if not exists appi_dispositivos_push_endpoint_uidx
on public.appi_dispositivos_vinculados (push_endpoint)
where push_endpoint is not null;

create index if not exists appi_dispositivos_user_activos_idx
on public.appi_dispositivos_vinculados (user_id, activo, last_seen desc);

create table if not exists public.appi_vinculaciones_dispositivo (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  codigo text not null,
  source_device_key uuid,
  claimed_device_id uuid references public.appi_dispositivos_vinculados(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '5 minutes'),
  claimed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  constraint appi_vinculacion_codigo check (codigo ~ '^[0-9]{6}$'),
  constraint appi_vinculacion_fechas check (expires_at > created_at)
);

create unique index if not exists appi_vinculaciones_codigo_activo_uidx
on public.appi_vinculaciones_dispositivo (codigo)
where claimed_at is null and cancelled_at is null;

create index if not exists appi_vinculaciones_user_fecha_idx
on public.appi_vinculaciones_dispositivo (user_id, created_at desc);

create table if not exists public.appi_comandos_dispositivo (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_device_id uuid not null references public.appi_dispositivos_vinculados(id) on delete cascade,
  source_device_key uuid,
  tipo text not null check (tipo in ('llamada','whatsapp')),
  payload jsonb not null default '{}'::jsonb,
  estado text not null default 'pendiente' check (estado in ('pendiente','notificado','abierto','aceptado','cancelado','vencido','error')),
  expires_at timestamptz not null default (now() + interval '2 minutes'),
  notified_at timestamptz,
  opened_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appi_comando_payload_object check (jsonb_typeof(payload) = 'object'),
  constraint appi_comando_fechas check (expires_at > created_at)
);

create index if not exists appi_comandos_target_estado_idx
on public.appi_comandos_dispositivo (target_device_id, estado, created_at desc);

create index if not exists appi_comandos_user_fecha_idx
on public.appi_comandos_dispositivo (user_id, created_at desc);

alter table public.appi_dispositivos_vinculados enable row level security;
alter table public.appi_vinculaciones_dispositivo enable row level security;
alter table public.appi_comandos_dispositivo enable row level security;

-- Toda escritura y lectura pasa por la Edge Function, que vuelve a validar la sesión.
revoke all on public.appi_dispositivos_vinculados from anon, authenticated;
revoke all on public.appi_vinculaciones_dispositivo from anon, authenticated;
revoke all on public.appi_comandos_dispositivo from anon, authenticated;

-- Las políticas documentan y refuerzan la pertenencia por cuenta aunque en el
-- futuro se habilite alguna lectura directa.
drop policy if exists "appi_dispositivos_select_own" on public.appi_dispositivos_vinculados;
create policy "appi_dispositivos_select_own"
on public.appi_dispositivos_vinculados for select
to authenticated
using (auth.uid() = user_id and public.appi_cuenta_activa());

drop policy if exists "appi_vinculaciones_select_own" on public.appi_vinculaciones_dispositivo;
create policy "appi_vinculaciones_select_own"
on public.appi_vinculaciones_dispositivo for select
to authenticated
using (auth.uid() = user_id and public.appi_cuenta_activa());

drop policy if exists "appi_comandos_select_own" on public.appi_comandos_dispositivo;
create policy "appi_comandos_select_own"
on public.appi_comandos_dispositivo for select
to authenticated
using (auth.uid() = user_id and public.appi_cuenta_activa());

drop trigger if exists appi_dispositivos_touch on public.appi_dispositivos_vinculados;
create trigger appi_dispositivos_touch
before update on public.appi_dispositivos_vinculados
for each row execute function public.appi_touch_updated_at();

drop trigger if exists appi_comandos_touch on public.appi_comandos_dispositivo;
create trigger appi_comandos_touch
before update on public.appi_comandos_dispositivo
for each row execute function public.appi_touch_updated_at();

select
  'Puente de dispositivos instalado' as resultado,
  to_regclass('public.appi_dispositivos_vinculados') is not null as dispositivos_listos,
  to_regclass('public.appi_vinculaciones_dispositivo') is not null as vinculaciones_listas,
  to_regclass('public.appi_comandos_dispositivo') is not null as comandos_listos;
