-- APPI · Membresía PARA SIEMPRE · v312
-- La cuenta administradora puede dar acceso permanente: la membresía se
-- fija en el 31/12/2099 y sale del modo prueba si lo tenía. Solo responde
-- al rol admin (se llama directo desde el panel por REST RPC).

create or replace function public.appi_admin_para_siempre(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_perfil public.appi_perfiles%rowtype;
  v_vence timestamptz := '2099-12-31T00:00:00Z';
begin
  if not exists (
    select 1 from public.appi_perfiles quien
    where quien.user_id = auth.uid() and quien.rol = 'admin'
  ) then
    raise exception 'Sólo la cuenta administradora puede dar acceso permanente.';
  end if;

  select * into v_perfil from public.appi_perfiles
  where user_id = p_user_id and rol = 'usuario'
  for update;
  if not found then raise exception 'La cuenta no existe.'; end if;

  update public.appi_perfiles
  set membresia_vence = v_vence,
      membresia_meses = null,
      membresia_prueba = false,
      activo = true
  where user_id = p_user_id;

  insert into public.user_memberships (user_id, status, starts_at, expires_at)
  values (p_user_id, 'active', now(), v_vence)
  on conflict (user_id) do update
  set status = 'active',
      expires_at = excluded.expires_at,
      updated_at = now();

  select * into v_perfil from public.appi_perfiles where user_id = p_user_id;
  return to_jsonb(v_perfil);
end;
$$;

revoke all on function public.appi_admin_para_siempre(uuid) from public;
grant execute on function public.appi_admin_para_siempre(uuid) to authenticated;

select 'Membresía PARA SIEMPRE instalada' as resultado;
