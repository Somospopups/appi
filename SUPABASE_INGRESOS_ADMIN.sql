-- APPI · Ingresos por mes para el panel administrador · v300
-- Los pagos ya quedaban registrados en membership_payments (fecha, monto,
-- método). Esta función se los muestra a la cuenta administradora con el
-- nombre y DIP de cada distribuidor, para la vista mensual y el resumen
-- anual del panel. Solo responde al rol admin.

create or replace function public.appi_admin_pagos(p_meses integer default 24)
returns table(
  fecha timestamptz,
  monto numeric,
  metodo text,
  notas text,
  cuenta uuid,
  dip text,
  nombre text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.appi_perfiles quien
    where quien.user_id = auth.uid() and quien.rol = 'admin'
  ) then
    raise exception 'Sólo la cuenta administradora puede ver los ingresos.';
  end if;

  return query
  select mp.payment_date,
         mp.amount,
         mp.payment_method,
         mp.notes,
         mp.user_id,
         p.dip,
         p.nombre
  from public.membership_payments mp
  join public.appi_perfiles p on p.user_id = mp.user_id
  where mp.payment_date >= date_trunc('month', now())
        - make_interval(months => greatest(coalesce(p_meses, 24), 1))
  order by mp.payment_date desc;
end;
$$;

revoke all on function public.appi_admin_pagos(integer) from public;
grant execute on function public.appi_admin_pagos(integer) to authenticated;

select 'Ingresos mensuales instalados' as resultado;
