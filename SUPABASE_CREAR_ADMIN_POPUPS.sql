-- APPI · Convertir la cuenta 02-9802014 en administradora principal

insert into public.appi_perfiles (
  user_id,
  dip,
  sucursal,
  numero_distribuidor,
  nombre,
  rol,
  activo
)
select
  id,
  '02-9802014',
  '02',
  '9802014',
  'POPUPS',
  'admin',
  true
from auth.users
where email = 'dip-02-9802014@distribuidores.appi.invalid'
on conflict (user_id) do update
set
  dip = excluded.dip,
  sucursal = excluded.sucursal,
  numero_distribuidor = excluded.numero_distribuidor,
  nombre = excluded.nombre,
  rol = 'admin',
  activo = true,
  updated_at = now();

select
  dip,
  sucursal,
  numero_distribuidor,
  nombre,
  rol,
  activo
from public.appi_perfiles
where dip = '02-9802014';
