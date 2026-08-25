-- APPI · Posición en el cumplimiento diario · v345
-- ------------------------------------------------------------
-- Cada cuenta marca sus acciones del día con ✓/✗ y, cuando no queda
-- nada pendiente, se anota `completo_at` en el día (mensajes-usuarios.js).
-- Esta función le dice a cada distribuidor su lugar en el podio de hoy:
-- si completó y en qué puesto quedó, sin revelar los datos de los demás.

create or replace function public.appi_mi_posicion_cumplimiento()
returns table(completo boolean, posicion integer, total_completos integer, total_cuentas integer)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  return query
  with datos as (
    select d.user_id,
           public.appi_json_seguro(d.data->>'value')->'dias' -> (current_date::text) as dia
    from public.appi_datos d
    where d.data_key like 'appi\_acciones\_v1\_%'
       or d.data_key like 'persona\_socio\_\_appi\_acciones\_v1\_%'
  ),
  por_cuenta as (
    select user_id,
           min(dia->>'completo_at') as completo_at,
           bool_or(dia->>'total' is not null) as tiene_hoy
    from datos
    group by user_id
  ),
  completos as (
    select user_id, completo_at,
           row_number() over (order by completo_at asc) as lugar
    from por_cuenta
    where completo_at is not null
  )
  select
    coalesce((select c.user_id is not null from completos c where c.user_id = v_uid), false) as completo,
    coalesce((select c.lugar from completos c where c.user_id = v_uid), 0)::integer as posicion,
    (select count(*) from completos)::integer as total_completos,
    (select count(*) from por_cuenta where tiene_hoy)::integer as total_cuentas;
end;
$$;

revoke all on function public.appi_mi_posicion_cumplimiento() from public;
grant execute on function public.appi_mi_posicion_cumplimiento() to authenticated;

select 'Posición en el cumplimiento instalada' as resultado;
