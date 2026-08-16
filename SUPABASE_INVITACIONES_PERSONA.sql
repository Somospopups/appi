-- APPI · Identidad de quien comparte Mi Encuesta
-- Conserva el nombre del titular o socio que creó cada invitación.

begin;

alter table public.appi_encuesta_invitaciones
  add column if not exists persona_tipo text not null default 'titular';

alter table public.appi_encuesta_invitaciones
  drop constraint if exists appi_encuesta_invitaciones_persona_tipo_check;
alter table public.appi_encuesta_invitaciones
  add constraint appi_encuesta_invitaciones_persona_tipo_check
  check (persona_tipo in ('titular', 'socio'));

-- Se eliminan ambas firmas: la original sin argumentos y la de esta versión.
-- Sin esto, repetir la migración falla con 42723 (la función ya existe) y
-- corta el resto del despliegue.
drop function if exists public.appi_crear_invitacion_encuesta();
drop function if exists public.appi_crear_invitacion_encuesta(text);

create function public.appi_crear_invitacion_encuesta(
  p_persona_tipo text default 'titular'
)
returns table(token uuid, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_profile public.appi_perfiles%rowtype;
  requested_person text := case when p_persona_tipo = 'socio' then 'socio' else 'titular' end;
  new_token uuid;
  new_expires timestamptz;
begin
  select * into owner_profile
  from public.appi_perfiles p
  where p.user_id = auth.uid()
    and p.rol = 'usuario'
    and p.activo = true
    and p.membresia_vence is not null
    and p.membresia_vence > now();

  if not found then
    raise exception 'Necesitás una cuenta distribuidora activa para compartir la encuesta.' using errcode = 'P0001';
  end if;
  if requested_person = 'socio' and nullif(trim(owner_profile.socio_nombre), '') is null then
    raise exception 'La cuenta no tiene un socio configurado.' using errcode = 'P0001';
  end if;

  update public.appi_encuesta_invitaciones
  set revoked_at = now(), updated_at = now()
  where user_id = owner_profile.user_id
    and used_at is null
    and revoked_at is null
    and expires_at <= now();

  insert into public.appi_encuesta_invitaciones as created (user_id, persona_tipo)
  values (owner_profile.user_id, requested_person)
  returning created.token, created.expires_at
  into new_token, new_expires;

  return query select new_token, new_expires;
end;
$$;

revoke all on function public.appi_crear_invitacion_encuesta(text) from public, anon;
grant execute on function public.appi_crear_invitacion_encuesta(text) to authenticated;

create or replace function public.appi_reclamar_invitacion_encuesta(
  p_token uuid,
  p_claim_id uuid
)
returns table(user_id uuid, nombre text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation public.appi_encuesta_invitaciones%rowtype;
  owner_profile public.appi_perfiles%rowtype;
  inviter_name text;
begin
  select * into invitation
  from public.appi_encuesta_invitaciones
  where token = p_token
  for update;

  if not found or invitation.revoked_at is not null then
    raise exception 'Esta invitación no está disponible.' using errcode = 'P0001';
  end if;
  if invitation.used_at is not null then
    raise exception 'Esta invitación ya fue utilizada.' using errcode = 'P0001';
  end if;
  if invitation.expires_at <= now() then
    raise exception 'Esta invitación venció. Pedí un enlace nuevo.' using errcode = 'P0001';
  end if;
  if invitation.claim_id is null then
    update public.appi_encuesta_invitaciones
    set claim_id = p_claim_id, opened_at = now(), updated_at = now()
    where id = invitation.id;
    invitation.claim_id := p_claim_id;
  elsif invitation.claim_id <> p_claim_id then
    raise exception 'Esta invitación ya fue abierta en otro dispositivo.' using errcode = 'P0001';
  end if;

  select * into owner_profile
  from public.appi_perfiles
  where appi_perfiles.user_id = invitation.user_id
    and rol = 'usuario'
    and activo = true
    and membresia_vence is not null
    and membresia_vence > now();

  if not found then
    raise exception 'Esta encuesta no está disponible en este momento.' using errcode = 'P0001';
  end if;

  inviter_name := case
    when invitation.persona_tipo = 'socio' then coalesce(nullif(trim(owner_profile.socio_nombre), ''), owner_profile.nombre)
    else owner_profile.nombre
  end;

  return query select invitation.user_id, inviter_name, invitation.expires_at;
end;
$$;

revoke all on function public.appi_reclamar_invitacion_encuesta(uuid,uuid) from public, anon, authenticated;
grant execute on function public.appi_reclamar_invitacion_encuesta(uuid,uuid) to service_role;

commit;
