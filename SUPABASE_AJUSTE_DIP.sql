-- APPI · Ajuste del formato de distribuidores y administradores
-- Distribuidores: sucursal + número. Administradores: username sin DIP.

alter table public.appi_perfiles add column if not exists username text;
alter table public.appi_perfiles add column if not exists sucursal text;
alter table public.appi_perfiles add column if not exists numero_distribuidor text;
alter table public.appi_perfiles alter column dip drop not null;
alter table public.appi_perfiles alter column sucursal drop not null;
alter table public.appi_perfiles alter column numero_distribuidor drop not null;

update public.appi_perfiles
set
  sucursal = coalesce(sucursal, left(regexp_replace(dip, '\D', '', 'g'), 2)),
  numero_distribuidor = coalesce(numero_distribuidor, substring(regexp_replace(dip, '\D', '', 'g') from 3))
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

select
  'Formato de cuentas actualizado' as resultado,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'appi_perfiles' and column_name = 'username'
  ) as username_listo,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'appi_perfiles' and column_name = 'sucursal'
  ) as sucursal_lista,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'appi_perfiles' and column_name = 'numero_distribuidor'
  ) as distribuidor_listo;
