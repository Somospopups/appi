-- APPI · Teléfono de cada distribuidor · v313
-- El formulario de solicitud ya pedía el WhatsApp, pero al aprobar la cuenta
-- ese número se perdía: el perfil no lo guardaba. Desde ahora queda en
-- appi_perfiles.telefono, se completa solo al aprobar (y al crear si el
-- administrador lo cargó), y el botón 💬 del panel va directo a la persona.

alter table public.appi_perfiles
  add column if not exists telefono text;

-- Guardar o corregir el teléfono de una cuenta. Solo rol admin.
create or replace function public.appi_admin_set_telefono(
  p_user_id uuid,
  p_telefono text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_perfil public.appi_perfiles%rowtype;
begin
  if not exists (
    select 1 from public.appi_perfiles quien
    where quien.user_id = auth.uid() and quien.rol = 'admin'
  ) then
    raise exception 'Sólo la cuenta administradora puede guardar teléfonos.';
  end if;

  update public.appi_perfiles
  set telefono = nullif(left(trim(coalesce(p_telefono, '')), 30), '')
  where user_id = p_user_id and rol = 'usuario';
  if not found then raise exception 'La cuenta no existe.'; end if;

  select * into v_perfil from public.appi_perfiles where user_id = p_user_id;
  return to_jsonb(v_perfil);
end;
$$;

-- Los teléfonos de todas las cuentas, para el panel. Solo rol admin.
create or replace function public.appi_admin_telefonos()
returns table(cuenta uuid, telefono text)
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
    raise exception 'Sólo la cuenta administradora puede ver los teléfonos.';
  end if;

  return query
  select p.user_id, p.telefono
  from public.appi_perfiles p
  where p.rol = 'usuario' and p.telefono is not null;
end;
$$;

revoke all on function public.appi_admin_set_telefono(uuid, text) from public;
grant execute on function public.appi_admin_set_telefono(uuid, text) to authenticated;
revoke all on function public.appi_admin_telefonos() from public;
grant execute on function public.appi_admin_telefonos() to authenticated;

select 'Teléfonos de distribuidores instalados' as resultado;
