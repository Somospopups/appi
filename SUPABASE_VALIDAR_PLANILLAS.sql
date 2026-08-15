-- APPI · Bloqueo de planillas pertenecientes a otro distribuidor

create or replace function public.appi_planilla_pertenece_a_usuario(
  owner_id uuid,
  planilla_dip text,
  planilla_sucursal text default ''
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  perfil public.appi_perfiles%rowtype;
  detectado text := regexp_replace(coalesce(planilla_dip,''), '\D', '', 'g');
  suc_detectada text := regexp_replace(coalesce(planilla_sucursal,''), '\D', '', 'g');
  esperado text;
begin
  select * into perfil from public.appi_perfiles where user_id = owner_id;
  if not found then return false; end if;
  if perfil.rol = 'admin' then return true; end if;
  esperado := coalesce(perfil.sucursal,'') || coalesce(perfil.numero_distribuidor,'');
  if detectado = '' or perfil.numero_distribuidor is null then return false; end if;
  if not (detectado = perfil.numero_distribuidor or detectado = esperado or right(detectado,char_length(perfil.numero_distribuidor)) = perfil.numero_distribuidor) then return false; end if;
  if char_length(detectado) > char_length(perfil.numero_distribuidor)
     and left(detectado,char_length(detectado)-char_length(perfil.numero_distribuidor)) <> perfil.sucursal then return false; end if;
  if char_length(suc_detectada) >= 2 and position(perfil.sucursal in suc_detectada) = 0 then return false; end if;
  return true;
end;
$$;

revoke all on function public.appi_planilla_pertenece_a_usuario(uuid,text,text) from public;
grant execute on function public.appi_planilla_pertenece_a_usuario(uuid,text,text) to authenticated;

create or replace function public.appi_validar_equipo_guardado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare payload jsonb;
begin
  if new.data_key <> 'equipoData' then return new; end if;
  begin
    payload := (new.data->>'value')::jsonb;
  exception when others then
    raise exception 'El archivo de equipo no tiene un formato válido.';
  end;
  if not public.appi_planilla_pertenece_a_usuario(new.user_id,payload#>>'{titular,dip}',payload#>>'{titular,sucursal}') then
    raise exception 'La planilla no pertenece al distribuidor autenticado.';
  end if;
  return new;
end;
$$;

drop trigger if exists appi_datos_validar_equipo on public.appi_datos;
create trigger appi_datos_validar_equipo
before insert or update on public.appi_datos
for each row execute function public.appi_validar_equipo_guardado();

create or replace function public.appi_validar_historico_guardado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.appi_planilla_pertenece_a_usuario(new.user_id,new.data#>>'{titular,dip}',new.data#>>'{titular,sucursal}') then
    raise exception 'El cierre histórico no pertenece al distribuidor autenticado.';
  end if;
  return new;
end;
$$;

drop trigger if exists appi_historico_validar_titular on public.historico_periodos;
create trigger appi_historico_validar_titular
before insert or update on public.historico_periodos
for each row execute function public.appi_validar_historico_guardado();

select 'Validación de titular instalada' as resultado;
