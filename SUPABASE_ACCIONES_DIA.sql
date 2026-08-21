-- APPI · Cumplimiento diario de acciones · v292
-- Cada cuenta marca sus acciones del día con ✓ (hecha) o ✗ (no se hizo).
-- Las marcas viven en la clave local appi_acciones_v1_* y data-sync las sube
-- a appi_datos como el resto del espacio personal. Esta migración le da a la
-- cuenta administradora una función para ver el resumen de todas las cuentas.

-- El valor guardado es un string JSON. Si alguna fila quedara corrupta, la
-- consulta del administrador no puede caerse por eso: se la salta.
create or replace function public.appi_json_seguro(entrada text)
returns jsonb
language plpgsql
immutable
as $$
begin
  return entrada::jsonb;
exception when others then
  return null;
end;
$$;

create or replace function public.appi_admin_cumplimiento(dias_atras integer default 7)
returns table(
  cuenta uuid,
  dip text,
  nombre text,
  persona text,
  fecha date,
  total integer,
  hechas integer,
  no_hechas integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.appi_perfiles perfil
    where perfil.user_id = auth.uid() and perfil.rol = 'admin'
  ) then
    raise exception 'Sólo la cuenta administradora puede ver el cumplimiento.';
  end if;

  return query
  select d.user_id,
         p.dip,
         p.nombre,
         case when d.data_key like 'persona\_socio\_\_%' then 'socio' else 'titular' end,
         (dia.key)::date,
         coalesce((dia.value->>'total')::integer, 0),
         coalesce((dia.value->>'hechas')::integer, 0),
         coalesce((dia.value->>'noHechas')::integer, 0)
  from public.appi_datos d
  join public.appi_perfiles p on p.user_id = d.user_id
  cross join lateral jsonb_each(
    coalesce(public.appi_json_seguro(d.data->>'value')->'dias', '{}'::jsonb)
  ) as dia(key, value)
  where (d.data_key like 'appi\_acciones\_v1\_%'
     or  d.data_key like 'persona\_socio\_\_appi\_acciones\_v1\_%')
    and dia.key ~ '^\d{4}-\d{2}-\d{2}$'
    and (dia.key)::date >= current_date - greatest(coalesce(dias_atras, 7), 0)
  order by (dia.key)::date desc, p.dip;
end;
$$;

revoke all on function public.appi_json_seguro(text) from public;
grant execute on function public.appi_json_seguro(text) to authenticated;
revoke all on function public.appi_admin_cumplimiento(integer) from public;
grant execute on function public.appi_admin_cumplimiento(integer) to authenticated;

select 'Cumplimiento diario instalado' as resultado;
