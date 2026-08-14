-- APPI · Ajuste del número de distribuidor
-- Acepta sucursal de 2 dígitos y número de distribuidor de longitud variable.
-- Formato canónico: 02-9802014

alter table public.appi_perfiles
add column if not exists sucursal text;

alter table public.appi_perfiles
add column if not exists numero_distribuidor text;

update public.appi_perfiles
set
  sucursal = coalesce(sucursal, left(regexp_replace(dip, '\D', '', 'g'), 2)),
  numero_distribuidor = coalesce(numero_distribuidor, substring(regexp_replace(dip, '\D', '', 'g') from 3))
where sucursal is null or numero_distribuidor is null;

alter table public.appi_perfiles
alter column sucursal set not null;

alter table public.appi_perfiles
alter column numero_distribuidor set not null;

alter table public.appi_perfiles
drop constraint if exists appi_perfiles_dip_formato;

alter table public.appi_perfiles
add constraint appi_perfiles_dip_formato check (
  sucursal ~ '^[0-9]{2}$'
  and numero_distribuidor ~ '^[0-9]{1,12}$'
  and dip = sucursal || '-' || numero_distribuidor
);

select
  'Formato de distribuidor actualizado' as resultado,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'appi_perfiles'
      and column_name = 'sucursal'
  ) as sucursal_lista,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'appi_perfiles'
      and column_name = 'numero_distribuidor'
  ) as distribuidor_listo;
