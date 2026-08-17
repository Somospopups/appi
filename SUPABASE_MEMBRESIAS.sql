-- APPI · Membresías, prórrogas y registro de pagos
-- Fuente de verdad de acceso: appi_perfiles.membresia_vence.
-- user_memberships y membership_payments conservan el estado administrativo y la auditoría.

create extension if not exists pgcrypto;

alter table public.appi_perfiles add column if not exists membresia_meses integer;
alter table public.appi_perfiles add column if not exists membresia_inicio timestamptz;
alter table public.appi_perfiles add column if not exists membresia_vence timestamptz;

alter table public.appi_perfiles drop constraint if exists appi_membresia_meses_validos;
alter table public.appi_perfiles add constraint appi_membresia_meses_validos
check (membresia_meses is null or membresia_meses in (1,3,6));

-- Otorga un mes inicial a distribuidores existentes que todavía no tienen membresía.
update public.appi_perfiles
set membresia_meses = 1,
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

create table if not exists public.user_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active',
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  grace_period_until timestamptz,
  grace_period_notes text,
  monthly_fee numeric(12,2) not null default 5000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_memberships add column if not exists grace_period_until timestamptz;
alter table public.user_memberships add column if not exists grace_period_notes text;
alter table public.user_memberships add column if not exists monthly_fee numeric(12,2) not null default 5000;
alter table public.user_memberships add column if not exists updated_at timestamptz not null default now();

alter table public.user_memberships drop constraint if exists user_memberships_status_check;
alter table public.user_memberships add constraint user_memberships_status_check
check (status in ('active','grace_period','expired','suspended'));

create unique index if not exists user_memberships_user_id_uidx on public.user_memberships(user_id);
create index if not exists user_memberships_status_idx on public.user_memberships(status);
create index if not exists user_memberships_expires_at_idx on public.user_memberships(expires_at);

create table if not exists public.membership_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  membership_id uuid not null references public.user_memberships(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  payment_date timestamptz not null default now(),
  payment_method text not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.membership_payments add column if not exists payment_date timestamptz not null default now();
alter table public.membership_payments add column if not exists payment_method text;
alter table public.membership_payments add column if not exists notes text;
create index if not exists membership_payments_user_id_idx on public.membership_payments(user_id);
create index if not exists membership_payments_payment_date_idx on public.membership_payments(payment_date);

create or replace function public.update_membership_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_user_memberships_updated_at on public.user_memberships;
create trigger update_user_memberships_updated_at
before update on public.user_memberships
for each row execute function public.update_membership_updated_at();

alter table public.user_memberships enable row level security;
alter table public.membership_payments enable row level security;

-- El navegador sólo puede leer sus propios datos. Toda administración escribe
-- mediante admin-distribuidores, que valida el JWT administrador y usa service_role.
revoke all on public.user_memberships from anon, authenticated;
revoke all on public.membership_payments from anon, authenticated;
grant select on public.user_memberships to authenticated;
grant select on public.membership_payments to authenticated;

drop policy if exists "Users can view their own membership" on public.user_memberships;
drop policy if exists "Admins can manage all memberships" on public.user_memberships;
drop policy if exists "Users can view their own payments" on public.membership_payments;
drop policy if exists "Admins can manage all payments" on public.membership_payments;
drop policy if exists user_membership_select_own on public.user_memberships;
drop policy if exists admin_membership_select on public.user_memberships;
drop policy if exists user_payment_select_own on public.membership_payments;
drop policy if exists admin_payment_select on public.membership_payments;

create policy user_membership_select_own on public.user_memberships
for select to authenticated
using (user_id = auth.uid());

create policy admin_membership_select on public.user_memberships
for select to authenticated
using (exists (
  select 1 from public.appi_perfiles p
  where p.user_id = auth.uid() and p.rol = 'admin' and p.activo = true
));

create policy user_payment_select_own on public.membership_payments
for select to authenticated
using (user_id = auth.uid());

create policy admin_payment_select on public.membership_payments
for select to authenticated
using (exists (
  select 1 from public.appi_perfiles p
  where p.user_id = auth.uid() and p.rol = 'admin' and p.activo = true
));

-- Migra perfiles existentes a la tabla administrativa sin cambiar vencimientos.
insert into public.user_memberships (user_id,status,starts_at,expires_at)
select p.user_id,
       case when p.activo = true and p.membresia_vence > now() then 'active' else 'expired' end,
       coalesce(p.membresia_inicio,p.created_at,now()),
       coalesce(p.membresia_vence,now())
from public.appi_perfiles p
where p.rol = 'usuario'
on conflict (user_id) do update
set starts_at = excluded.starts_at,
    expires_at = excluded.expires_at,
    status = case
      when public.user_memberships.status = 'grace_period'
       and public.user_memberships.grace_period_until > now()
      then 'grace_period'
      else excluded.status
    end,
    updated_at = now();

-- Operaciones atómicas invocadas únicamente por la Edge Function administradora.
create or replace function public.appi_admin_prorrogar_membresia(
  p_user_id uuid,
  p_until timestamptz,
  p_notes text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.appi_perfiles%rowtype;
  v_membership public.user_memberships%rowtype;
begin
  if p_until <= now() or p_until > now() + interval '366 days' then
    raise exception 'La fecha de prórroga no es válida.';
  end if;

  select * into v_profile from public.appi_perfiles
  where user_id = p_user_id and rol = 'usuario'
  for update;
  if not found then raise exception 'La cuenta no existe.'; end if;

  update public.appi_perfiles
  set membresia_vence = p_until, activo = true
  where user_id = p_user_id;

  insert into public.user_memberships (
    user_id,status,starts_at,expires_at,grace_period_until,grace_period_notes
  ) values (
    p_user_id,'grace_period',coalesce(v_profile.membresia_inicio,now()),p_until,p_until,left(coalesce(p_notes,''),1000)
  )
  on conflict (user_id) do update
  set status = 'grace_period',
      expires_at = excluded.expires_at,
      grace_period_until = excluded.grace_period_until,
      grace_period_notes = excluded.grace_period_notes,
      updated_at = now()
  returning * into v_membership;

  return to_jsonb(v_membership);
end;
$$;

create or replace function public.appi_admin_registrar_pago_membresia(
  p_user_id uuid,
  p_amount numeric,
  p_method text,
  p_notes text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.appi_perfiles%rowtype;
  v_membership public.user_memberships%rowtype;
  v_payment public.membership_payments%rowtype;
  v_started timestamptz := now();
  v_base timestamptz;
  v_expires timestamptz;
begin
  if p_amount <= 0 or p_amount > 1000000000 then raise exception 'El monto no es válido.'; end if;
  if p_method not in ('transferencia','efectivo','mercadopago','otro') then raise exception 'El método de pago no es válido.'; end if;

  select * into v_profile from public.appi_perfiles
  where user_id = p_user_id and rol = 'usuario'
  for update;
  if not found then raise exception 'La cuenta no existe.'; end if;

  v_base := greatest(now(),coalesce(v_profile.membresia_vence,now()));
  v_expires := v_base + interval '1 month';

  update public.appi_perfiles
  set membresia_meses = 1,
      membresia_inicio = v_started,
      membresia_vence = v_expires,
      activo = true
  where user_id = p_user_id;

  insert into public.user_memberships (
    user_id,status,starts_at,expires_at,grace_period_until,grace_period_notes
  ) values (p_user_id,'active',v_started,v_expires,null,null)
  on conflict (user_id) do update
  set status = 'active',
      starts_at = excluded.starts_at,
      expires_at = excluded.expires_at,
      grace_period_until = null,
      grace_period_notes = null,
      updated_at = now()
  returning * into v_membership;

  insert into public.membership_payments (
    user_id,membership_id,amount,payment_method,notes
  ) values (
    p_user_id,v_membership.id,p_amount,p_method,left(coalesce(p_notes,''),1000)
  ) returning * into v_payment;

  return jsonb_build_object(
    'ok',true,
    'membership',to_jsonb(v_membership),
    'payment',to_jsonb(v_payment),
    'expires_at',v_expires
  );
end;
$$;

revoke all on function public.appi_admin_prorrogar_membresia(uuid,timestamptz,text) from public, anon, authenticated;
revoke all on function public.appi_admin_registrar_pago_membresia(uuid,numeric,text,text) from public, anon, authenticated;
grant execute on function public.appi_admin_prorrogar_membresia(uuid,timestamptz,text) to service_role;
grant execute on function public.appi_admin_registrar_pago_membresia(uuid,numeric,text,text) to service_role;

drop function if exists public.get_revenue_stats();
revoke all on function public.update_membership_updated_at() from public, anon, authenticated;

select
  'Membresías configuradas de forma segura' as resultado,
  count(*) filter (where rol='usuario' and membresia_vence > now())::int as membresias_activas
from public.appi_perfiles;
