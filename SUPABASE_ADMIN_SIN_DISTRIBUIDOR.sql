-- APPI · Administrador POPUPS sin número de distribuidor
-- Ejecutar después de crear el usuario interno admin-popups@appi.invalid.

alter table public.appi_perfiles
add column if not exists username text;

alter table public.appi_perfiles
alter column dip drop not null;

alter table public.appi_perfiles
alter column sucursal drop not null;

alter table public.appi_perfiles
alter column numero_distribuidor drop not null;

alter table public.appi_perfiles
drop constraint if exists appi_perfiles_dip_formato;

alter table public.appi_perfiles
add constraint appi_perfiles_dip_formato check (
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

insert into public.appi_perfiles (
  user_id,
  username,
  dip,
  sucursal,
  numero_distribuidor,
  nombre,
  rol,
  activo
)
select
  id,
  'popups',
  null,
  null,
  null,
  'POPUPS',
  'admin',
  true
from auth.users
where email = 'admin-popups@appi.invalid'
on conflict (user_id) do update
set
  username = 'popups',
  dip = null,
  sucursal = null,
  numero_distribuidor = null,
  nombre = 'POPUPS',
  rol = 'admin',
  activo = true,
  updated_at = now();

select
  u.email,
  p.username,
  p.dip,
  p.sucursal,
  p.numero_distribuidor,
  p.nombre,
  p.rol,
  p.activo
from auth.users u
join public.appi_perfiles p on p.user_id = u.id
where u.email = 'admin-popups@appi.invalid';
