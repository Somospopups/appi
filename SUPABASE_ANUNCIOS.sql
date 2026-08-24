-- APPI · Anuncios del administrador a todo el equipo · v326
-- ------------------------------------------------------------
-- El administrador escribe un mensaje (reuniones por Zoom, avisos) y
-- opcionalmente hasta cuatro reuniones con fecha, hora y lugar. El
-- aviso vigente les aparece a todos los distribuidores como cartel al
-- abrir APPI, con botones para agendar cada reunión en el calendario
-- de la app o en la agenda del teléfono.

-- La tabla guarda el historial completo; sólo una fila está activa.
create table if not exists public.appi_anuncios (
  id uuid primary key default gen_random_uuid(),
  texto text not null default '' check (char_length(texto) between 1 and 600),
  eventos jsonb not null default '[]'::jsonb check (jsonb_typeof(eventos) = 'array'),
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  creado_por text not null default ''
);

create index if not exists appi_anuncios_activo_idx
on public.appi_anuncios (activo, creado_en desc);

-- Nadie escribe directo: sólo las funciones de acá abajo, que exigen
-- rol admin. La lectura es de todos los autenticados (el aviso es
-- público para el equipo).
alter table public.appi_anuncios enable row level security;
revoke all on public.appi_anuncios from anon, authenticated;
grant select on public.appi_anuncios to authenticated;

drop policy if exists "appi_anuncios_leer_equipo" on public.appi_anuncios;
create policy "appi_anuncios_leer_equipo"
on public.appi_anuncios for select
to authenticated
using (true);

-- ============================================================
-- Publicar: desactiva el aviso anterior y deja uno nuevo vigente.
-- ============================================================
drop function if exists public.appi_admin_publicar_anuncio(text, jsonb);
create or replace function public.appi_admin_publicar_anuncio(p_texto text, p_eventos jsonb default '[]'::jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_eventos jsonb := coalesce(p_eventos, '[]'::jsonb);
  v_limpio jsonb := '[]'::jsonb;
  ev jsonb;
  v_titulo text;
  v_fecha text;
  v_hora text;
  v_lugar text;
  v_n integer := 0;
  v_id uuid;
begin
  if not exists (
    select 1 from public.appi_perfiles quien
    where quien.user_id = auth.uid() and quien.rol = 'admin'
  ) then
    raise exception 'Sólo la cuenta administradora puede publicar anuncios.';
  end if;

  if p_texto is null or char_length(btrim(p_texto)) = 0 then
    raise exception 'El aviso necesita un texto.';
  end if;
  if char_length(p_texto) > 600 then
    raise exception 'El texto del aviso no puede pasar de 600 caracteres.';
  end if;

  if jsonb_typeof(v_eventos) <> 'array' then
    raise exception 'Las reuniones tienen que venir como lista.';
  end if;

  for ev in select * from jsonb_array_elements(v_eventos)
  loop
    v_n := v_n + 1;
    if v_n > 4 then
      raise exception 'Máximo 4 reuniones por aviso.';
    end if;
    v_titulo := btrim(coalesce(ev->>'titulo', ''));
    v_fecha := coalesce(ev->>'fecha', '');
    v_hora := coalesce(ev->>'hora', '');
    v_lugar := btrim(coalesce(ev->>'lugar', ''));

    if char_length(v_titulo) = 0 then
      raise exception 'La reunión % necesita un título.', v_n;
    end if;
    if v_fecha !~ '^\d{4}-\d{2}-\d{2}$' then
      raise exception 'La reunión % necesita fecha válida (AAAA-MM-DD).', v_n;
    end if;
    if v_hora <> '' and v_hora !~ '^\d{2}:\d{2}$' then
      raise exception 'La hora de la reunión % tiene que ser HH:MM.', v_n;
    end if;

    v_limpio := v_limpio || jsonb_build_object(
      'titulo', left(v_titulo, 80),
      'fecha', v_fecha,
      'hora', v_hora,
      'lugar', left(v_lugar, 200)
    );
  end loop;

  update public.appi_anuncios set activo = false where activo;

  insert into public.appi_anuncios (texto, eventos, creado_por)
  values (btrim(p_texto), v_limpio,
          coalesce((select p.nombre from public.appi_perfiles p where p.user_id = auth.uid() limit 1), ''))
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.appi_admin_publicar_anuncio(text, jsonb) from public;
grant execute on function public.appi_admin_publicar_anuncio(text, jsonb) to authenticated;

-- ============================================================
-- Quitar: apaga el aviso vigente sin borrar el historial.
-- ============================================================
drop function if exists public.appi_admin_quitar_anuncio();
create or replace function public.appi_admin_quitar_anuncio()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.appi_perfiles quien
    where quien.user_id = auth.uid() and quien.rol = 'admin'
  ) then
    raise exception 'Sólo la cuenta administradora puede quitar anuncios.';
  end if;

  update public.appi_anuncios set activo = false where activo;
end;
$$;

revoke all on function public.appi_admin_quitar_anuncio() from public;
grant execute on function public.appi_admin_quitar_anuncio() to authenticated;

select 'Anuncios del administrador instalados' as resultado;
