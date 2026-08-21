-- APPI · El Panel de Contactos es privado de cada cuenta · v295
-- ------------------------------------------------------------
-- Bug real reportado: la cuenta administradora veía en SU Panel de
-- Contactos los encuestados y referidos de todas las distribuidoras,
-- como si fueran propios. La causa era la cláusula "or appi_es_admin()"
-- en las políticas RLS de los datos personales de gestión: el panel
-- pide "todo lo visible" y, para el admin, visible era todo el mundo.
--
-- Los datos nunca se guardaron mal: cada encuesta y referido quedó en
-- la cuenta dueña del enlace. Esto corrige lo que el admin puede VER
-- y TOCAR desde el navegador.
--
-- Las herramientas administrativas legítimas no pierden nada: la Edge
-- Function del panel usa service_role, que no pasa por RLS.

begin;

drop policy if exists "appi_encuesta_links_select_own" on public.appi_encuesta_links;
create policy "appi_encuesta_links_select_own"
on public.appi_encuesta_links for select
to authenticated
using (auth.uid() = user_id and public.appi_cuenta_activa());

drop policy if exists "appi_encuestas_select_own" on public.appi_encuestas;
create policy "appi_encuestas_select_own"
on public.appi_encuestas for select
to authenticated
using (auth.uid() = user_id and public.appi_cuenta_activa());

drop policy if exists "appi_encuestas_delete_own" on public.appi_encuestas;
create policy "appi_encuestas_delete_own"
on public.appi_encuestas for delete
to authenticated
using (auth.uid() = user_id and public.appi_cuenta_activa());

drop policy if exists "appi_encuesta_invitaciones_select_own" on public.appi_encuesta_invitaciones;
create policy "appi_encuesta_invitaciones_select_own"
on public.appi_encuesta_invitaciones for select
to authenticated
using (auth.uid() = user_id and public.appi_cuenta_activa());

drop policy if exists "appi_gestion_select_own" on public.appi_gestion_contactos;
create policy "appi_gestion_select_own"
on public.appi_gestion_contactos for select
to authenticated
using (auth.uid() = user_id and public.appi_cuenta_activa());

drop policy if exists "appi_gestion_update_own" on public.appi_gestion_contactos;
create policy "appi_gestion_update_own"
on public.appi_gestion_contactos for update
to authenticated
using (auth.uid() = user_id and public.appi_cuenta_activa())
with check (auth.uid() = user_id and public.appi_cuenta_activa());

drop policy if exists "appi_gestion_delete_own" on public.appi_gestion_contactos;
create policy "appi_gestion_delete_own"
on public.appi_gestion_contactos for delete
to authenticated
using (auth.uid() = user_id and public.appi_cuenta_activa());

drop policy if exists "appi_gestion_actividades_select_own" on public.appi_gestion_actividades;
create policy "appi_gestion_actividades_select_own"
on public.appi_gestion_actividades for select
to authenticated
using (auth.uid() = user_id and public.appi_cuenta_activa());

drop policy if exists "appi_gestion_actividades_insert_own" on public.appi_gestion_actividades;
create policy "appi_gestion_actividades_insert_own"
on public.appi_gestion_actividades for insert
to authenticated
with check (
  auth.uid() = user_id
  and public.appi_cuenta_activa()
  and exists (
    select 1 from public.appi_gestion_contactos c
    where c.id = contacto_id and c.user_id = auth.uid()
  )
);

drop policy if exists "appi_gestion_actividades_delete_own" on public.appi_gestion_actividades;
create policy "appi_gestion_actividades_delete_own"
on public.appi_gestion_actividades for delete
to authenticated
using (auth.uid() = user_id and public.appi_cuenta_activa());

commit;

select 'Panel de Contactos privado por cuenta' as resultado;
