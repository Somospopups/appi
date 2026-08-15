# APPI · v215 · Notificaciones accionables

## Objetivo

Hacer que una solicitud de llamada recibida por Web Push abra o enfoque APPI aunque la PWA esté cerrada, y conserve la acción pendiente hasta que la persona pueda completarla.

## Cambios

- El Service Worker construye la URL dentro del alcance real de la PWA.
- Si APPI ya está abierta, envía el comando a la ventana existente y la enfoca.
- Si APPI está cerrada, abre una nueva ventana con `bridge_call` en la URL.
- El frontend conserva el comando durante el ingreso y la elección de titular o socio.
- Se fuerza la actualización del Service Worker con `service-worker.js?v=215`.
- Se evita procesar dos veces la misma solicitud mientras su pantalla está abierta.

## Alcance actual

Las solicitudes de llamada ya usan Web Push y pueden llegar con APPI cerrada. Otros recordatorios internos todavía requieren definir qué eventos deben generar notificaciones desde el backend.
