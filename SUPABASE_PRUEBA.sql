-- APPI · Modo PRUEBA de 5 días · v294
-- La cuenta administradora puede poner cualquier cuenta en PRUEBA: 5 días
-- calendario contando el día de activación, con vencimiento a la medianoche
-- (hora argentina) del quinto día. El que está en prueba ve una franja roja
-- constante en la app; al vencer, el ingreso queda bloqueado con un mensaje
-- claro. Un pago o una prórroga sacan a la cuenta del modo prueba solos.

alter table public.appi_perfiles
  add column if not exists membresia_prueba boolean not null default false;

-- Activar la prueba. Se llama directo desde el panel (REST RPC) con el token
-- del administrador: por eso el control de rol es obligatorio acá adentro.
create or replace function public.appi_admin_activar_prueba(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_perfil public.appi_perfiles%rowtype;
  v_vence timestamptz;
begin
  if not exists (
    select 1 from public.appi_perfiles quien
    where quien.user_id = auth.uid() and quien.rol = 'admin'
  ) then
    raise exception 'Sólo la cuenta administradora puede activar una prueba.';
  end if;

  select * into v_perfil from public.appi_perfiles
  where user_id = p_user_id and rol = 'usuario'
  for update;
  if not found then raise exception 'La cuenta no existe.'; end if;

  -- 5 días calendario contando hoy: medianoche argentina del quinto día.
  v_vence := (date_trunc('day', now() at time zone 'America/Argentina/Cordoba')
              + interval '5 days') at time zone 'America/Argentina/Cordoba';

  -- La marca transaccional le avisa al trigger que este cambio ES la prueba.
  perform set_config('appi.prueba_rpc', '1', true);

  update public.appi_perfiles
  set membresia_prueba = true,
      membresia_inicio = now(),
      membresia_vence = v_vence,
      membresia_meses = null,
      activo = true
  where user_id = p_user_id;

  insert into public.user_memberships (user_id, status, starts_at, expires_at)
  values (p_user_id, 'active', now(), v_vence)
  on conflict (user_id) do update
  set status = 'active',
      starts_at = now(),
      expires_at = excluded.expires_at,
      updated_at = now();

  select * into v_perfil from public.appi_perfiles where user_id = p_user_id;
  return to_jsonb(v_perfil);
end;
$$;

-- Un pago o una prórroga cambian membresia_vence por otro camino: eso saca a
-- la cuenta del modo prueba sin ningún paso extra.
create or replace function public.appi_perfiles_salir_de_prueba()
returns trigger
language plpgsql
as $$
begin
  if old.membresia_prueba
     and new.membresia_vence is distinct from old.membresia_vence
     and coalesce(current_setting('appi.prueba_rpc', true), '') <> '1' then
    new.membresia_prueba := false;
  end if;
  return new;
end;
$$;

drop trigger if exists appi_perfiles_prueba_paga on public.appi_perfiles;
create trigger appi_perfiles_prueba_paga
before update on public.appi_perfiles
for each row execute function public.appi_perfiles_salir_de_prueba();

-- Listado para las carpetas del panel: qué cuentas están en prueba y hasta cuándo.
create or replace function public.appi_admin_lista_pruebas()
returns table(cuenta uuid, vence timestamptz)
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
    raise exception 'Sólo la cuenta administradora puede ver las pruebas.';
  end if;

  return query
  select p.user_id, p.membresia_vence
  from public.appi_perfiles p
  where p.membresia_prueba;
end;
$$;

revoke all on function public.appi_admin_activar_prueba(uuid) from public;
grant execute on function public.appi_admin_activar_prueba(uuid) to authenticated;
revoke all on function public.appi_admin_lista_pruebas() from public;
grant execute on function public.appi_admin_lista_pruebas() to authenticated;

select 'Modo PRUEBA instalado' as resultado;
