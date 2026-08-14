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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Compatibilidad para proyectos que ejecutaron una versión anterior del instalador.
alter table public.appi_perfiles add column if not exists username text;
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
    where user_id = auth.uid() and activo = true
  );
$$;

revoke all on function public.appi_cuenta_activa() from public;
grant execute on function public.appi_cuenta_activa() to authenticated;

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
