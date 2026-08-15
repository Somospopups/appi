# APPI · v213 · Datos compartidos seguros

## Objetivo

Pulir dos situaciones detectadas después de incorporar titular y socio, sin cambiar la forma habitual de usar APPI.

## Mi Encuesta

- Cada invitación guarda si fue creada por el titular o por el socio.
- Cuando el socio comparte una encuesta, el formulario público muestra el nombre del socio.
- Cuando la comparte el titular, continúa mostrando el nombre del titular.
- Las invitaciones anteriores conservan al titular como autor para mantener compatibilidad.
- Mi Encuesta y Mi Gestión siguen siendo compartidas por la cuenta.

## Sincronización compartida

- Una sincronización manual o un cierre de sesión ya no vuelve a subir toda la copia local indiscriminadamente.
- APPI envía solamente las claves que realmente cambiaron en ese dispositivo.
- Después recupera la versión más reciente de la nube.
- Esto evita que una computadora con un Excel antiguo sobrescriba el archivo compartido más nuevo.
- Mi Equipo y Garantías continúan compartidos entre titular y socio.
- Los espacios personales continúan separados.

## Backend

- Nueva columna `persona_tipo` en `appi_encuesta_invitaciones`.
- La función de creación de invitaciones recibe la identidad activa.
- La función pública devuelve el nombre de la persona que generó la invitación.
- Migración: `SUPABASE_INVITACIONES_PERSONA.sql`.
- Workflow de backend ejecutado correctamente: `31902161818`.

## Resultados

- Pruebas específicas de identidad, invitaciones y sincronización: **2 aprobadas**.
- Suite completa de Playwright: **16 aprobadas en 47,8 s**.
- Sintaxis JavaScript y `git diff --check`: correctas.
