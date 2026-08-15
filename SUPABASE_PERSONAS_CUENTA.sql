-- APPI · Titular y socio por cuenta
-- Ejecutar una vez antes de publicar las Edge Functions de la versión correspondiente.

begin;

alter table public.appi_perfiles
  add column if not exists socio_nombre text;

alter table public.appi_perfiles
  drop constraint if exists appi_perfiles_socio_nombre_length;
alter table public.appi_perfiles
  add constraint appi_perfiles_socio_nombre_length
  check (socio_nombre is null or char_length(trim(socio_nombre)) between 2 and 120);

alter table public.appi_solicitudes
  add column if not exists socio_nombre text;

alter table public.appi_solicitudes
  drop constraint if exists appi_solicitudes_socio_nombre_length;
alter table public.appi_solicitudes
  add constraint appi_solicitudes_socio_nombre_length
  check (socio_nombre is null or char_length(trim(socio_nombre)) between 2 and 120);

alter table public.appi_dispositivos_vinculados
  add column if not exists persona_tipo text not null default 'titular';

alter table public.appi_dispositivos_vinculados
  drop constraint if exists appi_dispositivos_persona_tipo_check;
alter table public.appi_dispositivos_vinculados
  add constraint appi_dispositivos_persona_tipo_check
  check (persona_tipo in ('titular', 'socio'));

alter table public.appi_vinculaciones_dispositivo
  add column if not exists persona_tipo text not null default 'titular';

alter table public.appi_vinculaciones_dispositivo
  drop constraint if exists appi_vinculaciones_persona_tipo_check;
alter table public.appi_vinculaciones_dispositivo
  add constraint appi_vinculaciones_persona_tipo_check
  check (persona_tipo in ('titular', 'socio'));

-- Conserva el teléfono titular usado más recientemente si una cuenta antigua
-- hubiera acumulado más de uno antes de aplicar la nueva regla.
with ranked as (
  select id,
         row_number() over (
           partition by user_id, persona_tipo
           order by last_seen desc nulls last, created_at desc, id
         ) as position
  from public.appi_dispositivos_vinculados
  where activo = true
)
update public.appi_dispositivos_vinculados as device
set activo = false,
    notificaciones = false,
    push_endpoint = null,
    push_p256dh = null,
    push_auth = null
from ranked
where device.id = ranked.id
  and ranked.position > 1;

create unique index if not exists appi_dispositivos_persona_activa_uidx
on public.appi_dispositivos_vinculados (user_id, persona_tipo)
where activo = true;

commit;

select
  'Titular y socio instalados' as resultado,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'appi_perfiles' and column_name = 'socio_nombre'
  ) as perfiles_listos,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'appi_dispositivos_vinculados' and column_name = 'persona_tipo'
  ) as telefonos_listos;
