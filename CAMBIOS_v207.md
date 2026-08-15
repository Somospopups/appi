# APPI v207 · Llamadas desde toda APPI

## Problema corregido

En una PC, el botón **Llamar al contacto** de Mi Equipo abría un enlace `tel:` en Windows. El navegador mostraba “Elegir una aplicación” en lugar de enviar la solicitud al teléfono vinculado.

## Cambios

- Mi Equipo utiliza el puente de llamadas para personas con uno o varios teléfonos.
- Las oportunidades de Bonus utilizan el mismo recorrido.
- Contactos y Usuarios/Garantías envían la llamada al teléfono vinculado desde PC o tablet.
- Los enlaces telefónicos de Histórico también son interceptados por el puente desde PC o tablet.
- En un teléfono real se conserva la apertura directa del marcador nativo.
- Los botones indican **Llamar en teléfono** o **Vincular teléfono** según el estado disponible.
- La solicitud mantiene el nombre y número del contacto y continúa requiriendo confirmación en el teléfono.
- Se agregó una regresión E2E específica para el botón de Mi Equipo.

## Publicación

Esta versión sólo cambia frontend y pruebas. No requiere una nueva migración SQL ni volver a desplegar la Edge Function `dispositivo-puente`.
