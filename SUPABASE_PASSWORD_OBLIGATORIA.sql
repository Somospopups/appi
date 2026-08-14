-- APPI · Cambio obligatorio de contraseña temporal

alter table public.appi_perfiles
add column if not exists debe_cambiar_password boolean not null default false;

create or replace function public.appi_confirmar_cambio_password()
returns void
language sql
security definer
set search_path = public
as $$
  update public.appi_perfiles
  set debe_cambiar_password = false, updated_at = now()
  where user_id = auth.uid();
$$;

revoke all on function public.appi_confirmar_cambio_password() from public;
grant execute on function public.appi_confirmar_cambio_password() to authenticated;

-- Las cuentas existentes mantienen su contraseña actual.
-- Las nuevas cuentas y los restablecimientos se marcarán desde la función administradora.
update public.appi_perfiles
set debe_cambiar_password = false
where debe_cambiar_password is null;

select
  'Cambio obligatorio de contraseña configurado' as resultado,
  exists (
    select 1 from information_schema.columns
    where table_schema='public'
      and table_name='appi_perfiles'
      and column_name='debe_cambiar_password'
  ) as columna_lista;
