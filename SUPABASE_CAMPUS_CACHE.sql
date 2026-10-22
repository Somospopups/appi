-- APPI - Cache compartida del contenido del Campus PSA (v644 - v654)
-- Quien primero abre la app del dia refresca el contenido con SU sesion MI PSA
-- y todos los demas lo leen rapido desde aca. Nunca hay una cuenta fija.
--
--   clave      'contenido' (antes 'catalogo': todavia se lee como respaldo)
--   actualizado  cuando se rastreo por ultima vez
--   json         el contenido entero (kits/secciones/clases/playlists/vivoPlayer)
--
-- RLS habilitado SIN politicas: la unica lectora/escritora es la edge
-- function campus-contenido, que entra con el service role.

create table if not exists public.appi_campus_cache (
  clave text primary key,
  actualizado timestamptz not null default now(),
  json jsonb not null
);

alter table public.appi_campus_cache enable row level security;

-- La edad de la fila decide si hay que rastrear de nuevo:
--   contenidos completos -> 12 h; con streams pendientes -> 5 min.
create index if not exists appi_campus_cache_actualizado_idx
  on public.appi_campus_cache(actualizado);

select 'Cache del Campus PSA lista: clave, actualizado y json (solo service role)' as resultado;
