-- APPI · Validación de planillas por distribuidor · v2
-- Tolera formatos equivalentes del DIP y prioriza el DIP completo sobre el campo Sucursal.

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
  sucursal_perfil text;
  numero_perfil text;
  dip_perfil text;
  detectado_cmp text;
  suc_detectada_cmp text;
  sucursal_cmp text;
  numero_cmp text;
  dip_cmp text;
  coincide_dip_completo boolean := false;
  coincide_numero boolean := false;
begin
  select * into perfil from public.appi_perfiles where user_id = owner_id;
  if not found then return false; end if;
  if perfil.rol = 'admin' then return true; end if;

  dip_perfil := regexp_replace(coalesce(perfil.dip,''), '\D', '', 'g');
  sucursal_perfil := regexp_replace(coalesce(perfil.sucursal,''), '\D', '', 'g');
  numero_perfil := regexp_replace(coalesce(perfil.numero_distribuidor,''), '\D', '', 'g');
  -- El DIP canónico usado en el login tiene prioridad sobre columnas separadas
  -- que pueden haber quedado desactualizadas en perfiles anteriores.
  if char_length(dip_perfil) > 2 then
    sucursal_perfil := left(dip_perfil,2);
    numero_perfil := substring(dip_perfil from 3);
  end if;
  if dip_perfil = '' then dip_perfil := sucursal_perfil || numero_perfil; end if;
  if detectado = '' or numero_perfil = '' then return false; end if;

  detectado_cmp := coalesce(nullif(ltrim(detectado,'0'),''),'0');
  suc_detectada_cmp := coalesce(nullif(ltrim(suc_detectada,'0'),''),'0');
  sucursal_cmp := coalesce(nullif(ltrim(sucursal_perfil,'0'),''),'0');
  numero_cmp := coalesce(nullif(ltrim(numero_perfil,'0'),''),'0');
  dip_cmp := coalesce(nullif(ltrim(dip_perfil,'0'),''),'0');
  coincide_dip_completo := detectado_cmp = dip_cmp or detectado_cmp = sucursal_cmp || numero_cmp;
  coincide_numero := detectado_cmp = numero_cmp;

  if not coincide_dip_completo and not coincide_numero then return false; end if;
  -- Si el DIP completo coincide, se lo considera más confiable que el campo
  -- Sucursal, que en algunos reportes representa otra clasificación.
  if coincide_numero and suc_detectada <> '' and suc_detectada_cmp <> sucursal_cmp then return false; end if;
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
