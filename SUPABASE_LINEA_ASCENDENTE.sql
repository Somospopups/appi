-- =====================================================================
-- APPI · Línea Ascendente (v227) · Fundadores
--
-- Guarda los primeros 10 cupos de Fundador, con número de orden.
-- La función reclama el cupo de quien entra: si ya tiene uno lo
-- devuelve, si quedan libres asigna el siguiente, y si están los
-- 10 ocupados devuelve null.
--
-- Migración ADITIVA e idempotente: se puede correr varias veces.
-- Ejecutar en: Supabase → SQL Editor → Run
-- =====================================================================

create table if not exists public.appi_fundadores (
  user_id uuid primary key references auth.users(id) on delete cascade,
  numero integer not null,
  created_at timestamptz not null default now(),
  constraint appi_fundador_numero_valido check (numero between 1 and 10)
);

create unique index if not exists appi_fundadores_numero_uidx
on public.appi_fundadores (numero);

alter table public.appi_fundadores enable row level security;

drop policy if exists appi_fundadores_select_own on public.appi_fundadores;
create policy appi_fundadores_select_own
on public.appi_fundadores for select to authenticated
using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- Reclamar cupo de Fundador.
-- security definer para poder insertar aunque la tabla no tenga
-- política de insert (el cupo se gana por la función, no por RLS).
-- El unique de numero resuelve la carrera entre dos reclamos simultáneos.
-- ---------------------------------------------------------------------
drop function if exists public.appi_reclamar_fundador();

create function public.appi_reclamar_fundador()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_n integer;
begin
  if auth.uid() is null then
    raise exception 'Necesitás iniciar sesión para reclamar tu cupo.';
  end if;

  select numero into v_n
  from public.appi_fundadores
  where user_id = auth.uid();
  if v_n is not null then
    return v_n;
  end if;

  loop
    select coalesce(max(numero), 0) + 1 into v_n
    from public.appi_fundadores;

    if v_n > 10 then
      return null;
    end if;

    begin
      insert into public.appi_fundadores (user_id, numero)
      values (auth.uid(), v_n);
      return v_n;
    exception
      when unique_violation then
        -- Otro distribuidor tomó ese número hace un milisegundo:
        -- volvemos a intentar con el siguiente.
        continue;
    end;
  end loop;
end;
$$;

revoke all on function public.appi_reclamar_fundador() from public;
grant execute on function public.appi_reclamar_fundador() to authenticated;
