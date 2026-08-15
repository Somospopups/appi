-- APPI · Membresías de 1, 3 y 6 meses

alter table public.appi_perfiles add column if not exists membresia_meses integer;
alter table public.appi_perfiles add column if not exists membresia_inicio timestamptz;
alter table public.appi_perfiles add column if not exists membresia_vence timestamptz;

alter table public.appi_perfiles drop constraint if exists appi_membresia_meses_validos;
alter table public.appi_perfiles add constraint appi_membresia_meses_validos
check (membresia_meses is null or membresia_meses in (1,3,6));

-- Otorga un mes inicial a distribuidores existentes que todavía no tienen membresía.
update public.appi_perfiles
set
  membresia_meses = 1,
  membresia_inicio = now(),
  membresia_vence = now() + interval '1 month'
where rol = 'usuario' and membresia_vence is null;

create index if not exists appi_perfiles_membresia_vence_idx
on public.appi_perfiles (membresia_vence)
where rol = 'usuario';

create or replace function public.appi_cuenta_activa()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.appi_perfiles
    where user_id = auth.uid()
      and activo = true
      and (
        rol = 'admin'
        or (membresia_vence is not null and membresia_vence > now())
      )
  );
$$;

revoke all on function public.appi_cuenta_activa() from public;
grant execute on function public.appi_cuenta_activa() to authenticated;

select
  'Membresías configuradas' as resultado,
  count(*) filter (where rol='usuario' and membresia_vence > now())::int as membresias_activas
from public.appi_perfiles;
