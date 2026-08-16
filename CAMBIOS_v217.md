# APPI · v217 · Enviar encuesta

## Objetivo

Mi Encuesta mostraba cuatro tarjetas, la URL completa de la invitación, fechas de vencimiento y explicaciones sobre tokens y dispositivos. Todo eso es funcionamiento interno, no algo que el distribuidor necesite decidir. Ahora la pantalla es **un botón**.

## Cómo se usa

1. Tocar **Enviar encuesta**.
2. Elegir a quién: desde la agenda del teléfono o escribiendo nombre y WhatsApp.
3. El avión cruza la tarjeta y aparece **✓ Para Ana**.
4. Se abre WhatsApp con el mensaje listo.

Cada pulsación arranca de cero y pide un destinatario nuevo. No hay enlace que reutilizar ni cola que administrar.

## Qué se sacó de la vista

- La URL completa de la invitación.
- El token y la fecha de vencimiento.
- Las frases sobre "un dispositivo · una respuesta · vencimiento automático".
- El bloque "Así funciona" de tres pasos.
- El aviso de privacidad con la mecánica interna.
- Los botones "Copiar invitación", "Elegir de la agenda" y "Agregar manualmente" como acciones sueltas.
- La cola de invitaciones con vencimientos por fila.

Nada de esto cambió por dentro: las invitaciones siguen siendo privadas, venciendo a las 24 horas y aceptando una sola respuesta. Simplemente dejó de ocupar la pantalla.

## Qué se agregó

- Botón único con degradado APPI y estados de reposo, envío y confirmación.
- **Motion graphic**: el avión sale del centro, cruza en diagonal y deja una estela de tres puntos. Al llegar, la tarjeta gira al tilde con el nombre de la persona.
- La animación se dispara **después** de que el servidor confirma la invitación: nunca muestra un envío que no ocurrió.
- Lista **Envíos recientes**: sólo nombre y si falta enviar o ya se envió, con botón para enviar o reenviar.
- Selección de destinatario con agenda del teléfono cuando el navegador la soporta, y carga manual siempre disponible.
- Validación del número antes de gastar una invitación.
- Respeta `prefers-reduced-motion`: con animaciones reducidas el flujo termina igual, sin movimiento.

## Detalles de implementación

- Nuevo `installShareStyles()` con las animaciones `shareFly`, `shareTrail`, `shareDot` y `shareDone`.
- `startShareFlow()` orquesta: elegir persona → crear invitación → animar → abrir WhatsApp → registrar.
- `pickShareRecipient()` resuelve agenda o carga manual y valida los datos.
- `playShareAnimation()` devuelve una promesa y contempla movimiento reducido.
- `recentSharesHTML()` reemplaza a `bulkQueueHTML()`.
- Se eliminaron `sharePrivateSurvey`, `copyPrivateSurvey`, `prepareBulkFromAgenda`, `addBulkManual`, `clearBulkQueue` y `bulkQueueHTML`.
- `markBulkSent(id, rerender)` acepta no re-renderizar para no cortar la animación.
- `openEncuestaTool()` recarga la lista local al abrir.
- `APPIGestion.prepareBulk` sigue disponible para cargas múltiples desde otras pantallas.

## Pruebas

- Nueva suite `tests/e2e/compartir-encuesta.spec.js`, 3 pruebas:
  - la pantalla tiene un solo botón y no muestra token, URL, vencimientos ni jerga;
  - cada envío pide un destinatario nuevo, anima el viaje, abre WhatsApp con el número correcto y registra el envío; dos envíos generan dos invitaciones distintas;
  - un número incompleto no genera invitación ni abre WhatsApp.
- `encuesta-gestion.spec.js` actualizada al nuevo diseño.
- Suite completa de Playwright: **27 aprobadas**.
- Sintaxis JavaScript y `git diff --check`: correctas.

## Pendiente para la próxima versión

- Permitir elegir varios destinatarios de una vez desde la agenda, manteniendo un botón único.
- Horario configurable del resumen diario de Mi Gestión.
