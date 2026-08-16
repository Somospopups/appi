-- =====================================================================
-- APPI · Mi Gente (v223)
-- Unifica Contactos (que vivía en el teléfono) con Mi Gestión (nube).
--
-- Esta migración es ADITIVA y se puede correr varias veces sin problema:
-- no borra datos, no cambia lo que ya funciona y solo agrega lo que falta
-- para que los contactos locales entren sin perder información.
--
-- Ejecutar en: Supabase → SQL Editor → Run
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Campo "¿Por qué lo llamamos?" (venía de Contactos)
--    Producto / Negocio / Canjes / Ambas cosas
-- ---------------------------------------------------------------------
alter table public.appi_gestion_contactos
  add column if not exists interes text not null default '';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'appi_gestion_interes_valido'
      and conrelid = 'public.appi_gestion_contactos'::regclass
  ) then
    alter table public.appi_gestion_contactos
      add constraint appi_gestion_interes_valido
      check (interes in ('', 'Producto', 'Negocio', 'Canjes', 'Ambas cosas'));
  end if;
end$$;

-- ---------------------------------------------------------------------
-- 2. Estados que existían en Contactos y no en Mi Gestión
--    'no_contactado' (aún no lo llamé) y 'mas_adelante' (rebote suave).
--    Se amplía el check sin tocar los estados que ya se usan.
-- ---------------------------------------------------------------------
do $$
declare
  nombre_check text;
begin
  select conname into nombre_check
  from pg_constraint
  where conrelid = 'public.appi_gestion_contactos'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%estado%in%'
  limit 1;

  if nombre_check is not null then
    execute format('alter table public.appi_gestion_contactos drop constraint %I', nombre_check);
  end if;

  alter table public.appi_gestion_contactos
    add constraint appi_gestion_estado_valido
    check (estado in (
      'nuevo','no_contactado','contactado','seguimiento',
      'presentacion','mas_adelante','convertido','no_interesado'
    ));
end$$;

-- ---------------------------------------------------------------------
-- 3. Marca de origen: sirve para saber qué vino de Contactos del teléfono
--    y para que la migración sea idempotente (no duplica al reintentar).
-- ---------------------------------------------------------------------
alter table public.appi_gestion_contactos
  add column if not exists origen text not null default 'appi';

alter table public.appi_gestion_contactos
  add column if not exists origen_local_id text not null default '';

-- Evita que el mismo contacto local se importe dos veces.
create unique index if not exists appi_gestion_origen_local_uidx
on public.appi_gestion_contactos (user_id, origen_local_id)
where origen_local_id <> '';

-- ---------------------------------------------------------------------
-- 4. 'manual' sigue siendo un tipo válido; agregamos 'contacto' para los
--    que llegan desde la agenda local, sin romper los tipos existentes.
-- ---------------------------------------------------------------------
do $$
declare
  nombre_check text;
begin
  select conname into nombre_check
  from pg_constraint
  where conrelid = 'public.appi_gestion_contactos'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%tipo%in%'
  limit 1;

  if nombre_check is not null then
    execute format('alter table public.appi_gestion_contactos drop constraint %I', nombre_check);
  end if;

  alter table public.appi_gestion_contactos
    add constraint appi_gestion_tipo_valido
    check (tipo in ('encuestado','referido','manual','contacto'));
end$$;

-- ---------------------------------------------------------------------
-- 5. Importar un contacto local sin duplicar.
--    Devuelve el id del contacto (nuevo o ya existente).
--
--    Reglas:
--    - Si ya se importó ese origen_local_id, no hace nada.
--    - Si ya existe una persona con el mismo teléfono, NO la pisa:
--      devuelve la que estaba y suma el origen.
--    - El teléfono es obligatorio: la app filtra antes los que no tienen.
-- ---------------------------------------------------------------------
drop function if exists public.appi_gente_importar_contacto(text, text, text, text, text, date, text, text);

create function public.appi_gente_importar_contacto(
  p_nombre text,
  p_telefono text,
  p_interes text default '',
  p_estado text default 'nuevo',
  p_notas text default '',
  p_proximo date default null,
  p_local_id text default '',
  p_zona text default ''
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_digits text;
  v_estado text;
  v_interes text;
  v_id uuid;
begin
  if v_user is null then
    raise exception 'Necesitás iniciar sesión para importar contactos';
  end if;

  if p_nombre is null or char_length(trim(p_nombre)) < 2 then
    raise exception 'El contacto necesita un nombre';
  end if;

  -- Solo dígitos; el teléfono es obligatorio en la tabla unificada.
  v_digits := regexp_replace(coalesce(p_telefono, ''), '[^0-9]', '', 'g');
  if char_length(v_digits) not between 8 and 15 then
    raise exception 'El contacto % necesita un teléfono válido', p_nombre;
  end if;

  v_estado := case lower(coalesce(p_estado, ''))
    when 'contactado'     then 'contactado'
    when 'no contactado'  then 'no_contactado'
    when 'seguimiento'    then 'seguimiento'
    when 'más adelante'   then 'mas_adelante'
    when 'mas adelante'   then 'mas_adelante'
    when 'no le interesa' then 'no_interesado'
    else 'nuevo'
  end;

  v_interes := case
    when p_interes in ('Producto','Negocio','Canjes','Ambas cosas') then p_interes
    else ''
  end;

  -- ¿Ya lo importamos antes? (reintento seguro)
  if coalesce(p_local_id, '') <> '' then
    select id into v_id
    from public.appi_gestion_contactos
    where user_id = v_user and origen_local_id = p_local_id
    limit 1;
    if v_id is not null then
      return v_id;
    end if;
  end if;

  -- ¿Ya existe esa persona por teléfono? No la pisamos.
  select id into v_id
  from public.appi_gestion_contactos
  where user_id = v_user and telefono_normalizado = v_digits
  limit 1;

  if v_id is not null then
    update public.appi_gestion_contactos
    set cantidad_origenes = cantidad_origenes + 1,
        origen_local_id = case when origen_local_id = '' then coalesce(p_local_id, '') else origen_local_id end,
        notas = case
                  when coalesce(p_notas, '') = '' or notas ilike '%' || p_notas || '%' then notas
                  when notas = '' then p_notas
                  else notas || E'\n' || p_notas
                end,
        interes = case when interes = '' then v_interes else interes end,
        proximo_contacto = coalesce(proximo_contacto, p_proximo),
        updated_at = now()
    where id = v_id;
    return v_id;
  end if;

  insert into public.appi_gestion_contactos (
    user_id, tipo, nombre, telefono, telefono_normalizado,
    estado, interes, notas, proximo_contacto, zona,
    origen, origen_local_id
  ) values (
    v_user, 'contacto', trim(p_nombre), trim(p_telefono), v_digits,
    v_estado, v_interes, coalesce(p_notas, ''), p_proximo, coalesce(p_zona, ''),
    'contactos_local', coalesce(p_local_id, '')
  )
  returning id into v_id;

  insert into public.appi_gestion_actividades (user_id, contacto_id, tipo, detalle, metadata)
  values (v_user, v_id, 'contacto_creado', 'Importado desde Contactos del teléfono.',
          jsonb_build_object('origen', 'contactos_local'));

  return v_id;
end;
$$;

revoke all on function public.appi_gente_importar_contacto(text, text, text, text, text, date, text, text) from public;
grant execute on function public.appi_gente_importar_contacto(text, text, text, text, text, date, text, text) to authenticated;

-- ---------------------------------------------------------------------
-- Comprobación rápida (opcional): debería devolver las columnas nuevas.
--
-- select column_name from information_schema.columns
-- where table_name = 'appi_gestion_contactos'
--   and column_name in ('interes','origen','origen_local_id');
-- =====================================================================
