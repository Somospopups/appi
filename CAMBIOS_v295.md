# APPI v295 · El Panel de Contactos es privado de cada cuenta

## El problema (reportado con caso real)

La cuenta administradora veía en **su propio Panel de Contactos** los
encuestados y referidos de las distribuidoras, como si fueran suyos. Con
datos en la mano: las encuestas estaban **bien guardadas** en la cuenta de
cada distribuidora — el enlace de encuesta asigna por token y eso nunca
falló. Lo roto era la **visibilidad**: las políticas RLS de gestión tenían
`or appi_es_admin()`, y como el panel pide "todo lo visible", a la sesión
admin le llegaba el panel de todo el mundo (y podía editarlo o borrarlo).

## El arreglo, en dos capas

**Base (`SUPABASE_PANEL_PRIVADO.sql`, nueva migración):** las políticas de
`appi_encuestas`, `appi_encuesta_invitaciones`, `appi_encuesta_links`,
`appi_gestion_contactos` y `appi_gestion_actividades` quedan **solo-dueño**.
La Edge Function administradora usa `service_role` (no pasa por RLS), así
que ninguna herramienta legítima pierde acceso. Los instaladores
(`SUPABASE_ENCUESTAS_GESTION.sql` e `SUPABASE_INSTALACION_COMPLETA.sql`)
quedaron alineados para que una instalación nueva no reintroduzca el bug.

**Cliente (`gestion-client.js`):** el panel filtra por cuenta con
`soloMios()` tanto lo que llega de la nube como lo que levanta de la caché
local — que pudo quedar mezclada de antes del arreglo y se limpia sola.

## Qué NO pasó

Ningún referido se cargó en la cuenta equivocada. No hay datos que mover.

## Pruebas

`panel-privado.spec.js` (nuevo): ningún SQL conserva `or appi_es_admin()`
en datos personales, la migración recrea las 10 políticas, el cliente
filtra en nube y caché, y `soloMios` descarta filas de otra cuenta.

## App Shell y caché v295

- `295.0.0` · visible `v295` · caché `appi-v295-panel-privado`
