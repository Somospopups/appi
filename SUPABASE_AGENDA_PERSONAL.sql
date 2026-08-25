-- =====================================================================
-- APPI · Agenda personal (v358)
-- La solapa "📱 AGENDA PERSONAL" del Panel de Contactos guarda los
-- contactos del teléfono del distribuidor en su propia cuenta, para
-- que no se pierdan al cambiar de celular y poder pasarlos de a uno
-- a la Agenda APPI.
--
-- Esta migración es ADITIVA y se puede correr varias veces sin
-- problema: no borra datos ni toca las tablas existentes.
--
-- Ejecutar en: Supabase → SQL Editor → Run
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. La tabla: un contacto personal por teléfono (por cuenta).
--    estado: 'nuevo'  -> todavía no se pasó a la Agenda APPI
--           'mergado' -> ya vive en appi_gestion_contactos
--    contacto_id apunta a la ficha de la Agenda APPI si ya se pasó
--    (sin FK a propósito: la ficha puede ser provisoria mientras
--    sube la cola offline y no debe bloquear el alta).
-- ---------------------------------------------------------------------
create table if not exists public.appi_agenda_personal (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nombre text not null default '',
  telefono text not null default '',
  telefono_normalizado text not null,
  estado text not null default 'nuevo' check (estado in ('nuevo', 'mergado')),
  contacto_id uuid,
  origen text not null default 'manual' check (origen in ('telefono', 'vcf', 'manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, telefono_normalizado)
);

-- Índice para el listado por cuenta (la unique ya sirve de índice de
-- búsqueda por teléfono; este acelera el select de sincronización).
create index if not exists appi_agenda_personal_usuario
  on public.appi_agenda_personal (user_id, created_at);

-- updated_at se mantiene sola al cambiar una fila.
drop trigger if exists appi_agenda_personal_updated on public.appi_agenda_personal;
create or replace function public.appi_toque_agenda_personal()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end$$;
create trigger appi_agenda_personal_updated
  before update on public.appi_agenda_personal
  for each row execute function public.appi_toque_agenda_personal();

-- ---------------------------------------------------------------------
-- 2. Privacidad: cada distribuidor ve y toca únicamente su agenda.
-- ---------------------------------------------------------------------
alter table public.appi_agenda_personal enable row level security;

drop policy if exists "agenda personal propia" on public.appi_agenda_personal;
create policy "agenda personal propia"
  on public.appi_agenda_personal
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 3. Permisos: la API anónima no puede listar la agenda de nadie.
--    (Los clientes usan la sesión de cada usuario, como el resto de
--    las tablas de Mi Gente; sólo hace falta quedar bajo RLS.)
-- ---------------------------------------------------------------------
revoke all on public.appi_agenda_personal from anon, authenticated;
grant select, insert, update, delete on public.appi_agenda_personal to authenticated;

-- Listo: desde la app, Panel de Contactos → 📱 AGENDA PERSONAL.
-- Si ya se usó la solapa antes de correr esto, los contactos que
-- quedaron en el teléfono se suben solos la próxima vez que entre.
