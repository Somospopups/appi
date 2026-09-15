-- APPI · Día de pago por usuario (12 o 22) y popup sutil de compromiso
-- El admin elige 12 o 22 en la fila de cada usuario; el usuario ve popup 2 días antes

alter table public.appi_perfiles add column if not exists dia_pago integer;
alter table public.appi_perfiles drop constraint if exists appi_dia_pago_valido;
alter table public.appi_perfiles add constraint appi_dia_pago_valido
check (dia_pago is null or dia_pago in (12, 22));

-- Índice para filtrar por día de pago si hace falta
create index if not exists appi_perfiles_dia_pago_idx on public.appi_perfiles(dia_pago) where rol='usuario';

-- Por defecto, sin día asignado (null) → no muestra popup hasta que el admin elija

select 'Dia de pago agregado: 12 o 22 por usuario' as resultado,
       count(*) filter (where dia_pago=12) as dia12,
       count(*) filter (where dia_pago=22) as dia22,
       count(*) filter (where dia_pago is null) as sin_asignar
from public.appi_perfiles where rol='usuario';
