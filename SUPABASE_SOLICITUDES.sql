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
  socio_nombre text,
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

alter table public.appi_solicitudes add column if not exists socio_nombre text;

create index if not exists appi_solicitudes_estado_fecha_idx
on public.appi_solicitudes (estado, created_at desc);

create unique index if not exists appi_solicitud_pendiente_dip_idx
on public.appi_solicitudes (dip)
where estado = 'pendiente';

select
  'Solicitudes y WhatsApp configurados' as resultado,
  to_regclass('public.appi_solicitudes') is not null as solicitudes_listas,
  to_regclass('public.appi_configuracion') is not null as configuracion_lista;
