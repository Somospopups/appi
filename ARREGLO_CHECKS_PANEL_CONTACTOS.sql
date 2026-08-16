-- =====================================================================
-- APPI · Arreglo de checks del Panel de Contactos (v224)
--
-- Qué hace: borra los checks viejos de "tipo" y "estado" que quedaron
-- apilados con los nuevos y dejan fuera a 'contacto', 'no_contactado'
-- y 'mas_adelante'. Después deja un único check ampliado por columna.
--
-- Es seguro: no borra datos, se puede ejecutar varias veces y solo
-- toca restricciones, no filas.
--
-- Ejecutar en: Supabase → SQL Editor → Run
-- Debe terminar con cartel verde "Success".
-- =====================================================================

do $$
declare
  viejo record;
begin
  -- Postgres guarda `in (...)` como `= ANY (ARRAY[...])`, así que
  -- comparamos contra la definición normalizada y borramos TODO check
  -- de tipo o estado, tenga el nombre que tenga (viejo o nuevo).
  for viejo in
    select conname
    from pg_constraint
    where conrelid = 'public.appi_gestion_contactos'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ~* '\((tipo|estado) (=|in)'
  loop
    execute format('alter table public.appi_gestion_contactos drop constraint %I', viejo.conname);
  end loop;

  alter table public.appi_gestion_contactos
    add constraint appi_gestion_tipo_valido
    check (tipo in ('encuestado','referido','manual','contacto'));

  alter table public.appi_gestion_contactos
    add constraint appi_gestion_estado_valido
    check (estado in (
      'nuevo','no_contactado','contactado','seguimiento',
      'presentacion','mas_adelante','convertido','no_interesado'
    ));
end$$;

-- Verificación: debe devolver EXACTAMENTE estas dos filas.
select conname
from pg_constraint
where conrelid = 'public.appi_gestion_contactos'::regclass
  and contype = 'c'
  and conname in ('appi_gestion_tipo_valido', 'appi_gestion_estado_valido');
