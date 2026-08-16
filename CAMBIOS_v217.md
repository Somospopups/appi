# APPI · v217 · Enviar encuesta

## Objetivo

Mi Encuesta mostraba cuatro tarjetas, la URL completa de la invitación, fechas de vencimiento y explicaciones sobre tokens y dispositivos. Todo eso es funcionamiento interno, no algo que el distribuidor necesite decidir. Ahora la pantalla es **un botón**.

## Cómo se usa

1. Tocar **Enviar encuesta**.
2. El avión cruza la tarjeta y aparece **✓ ¡Lista para enviar!**.
3. Se abre WhatsApp con el mensaje listo y su propio selector de contactos.
4. El distribuidor elige ahí a quién se la manda.

Un solo toque. Elegir la persona es tarea de WhatsApp, que ya muestra la agenda completa con buscador: APPI no duplica ese paso.

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
- La pestaña de WhatsApp se abre en el mismo gesto del toque, para que el navegador no la bloquee como popup.
- Si la creación falla, se cierra esa pestaña, se avisa el error y el botón vuelve a quedar disponible.
- Respeta `prefers-reduced-motion`: con animaciones reducidas el flujo termina igual, sin movimiento.

## Detalles de implementación

- Nuevo `installShareStyles()` con las animaciones `shareFly`, `shareTrail`, `shareDot` y `shareDone`.
- `startShareFlow()` orquesta: abrir pestaña → crear invitación → animar → navegar a WhatsApp.
- `playShareAnimation()` devuelve una promesa y contempla movimiento reducido.
- Se eliminaron `sharePrivateSurvey`, `copyPrivateSurvey`, `prepareBulkFromAgenda`, `addBulkManual`, `clearBulkQueue` y `bulkQueueHTML`.
- `APPIGestion.prepareBulk` sigue disponible para cargas múltiples desde otras pantallas.

## Pruebas

- Nueva suite `tests/e2e/compartir-encuesta.spec.js`, 3 pruebas:
  - la pantalla tiene un solo botón y no muestra token, URL, vencimientos ni jerga;
  - el botón crea la invitación, anima el viaje y navega a `wa.me` **sin número**, para que WhatsApp abra su selector; dos toques generan dos invitaciones distintas;
  - si la creación falla, se avisa, se cierra la pestaña y el botón vuelve a quedar utilizable.
- `encuesta-gestion.spec.js` actualizada al nuevo diseño.
- Suite completa de Playwright: **27 aprobadas**.
- Sintaxis JavaScript y `git diff --check`: correctas.

## Limpieza en Usuarios / Garantías

- Se eliminó el selector de archivo "de emergencia" (`¿No abre? Probá con este botón de emergencia`) de la tarjeta de carga: era un segundo `input[type=file]` que compartía el mismo manejador que la zona principal.
- Ahora hay un único control visible para elegir el archivo: la zona de arrastrar/`Elegir archivo`.
- Regresión cubierta en `tests/e2e/appi.spec.js`: la tarjeta tiene exactamente un `input[type=file]`, no menciona "emergencia" y la importación de `test_garantias.xlsx` sigue dando 4 usuarios.

## Pendiente para la próxima versión

- Horario configurable del resumen diario de Mi Gestión.
- Aviso inmediato al recibir una encuesta nueva.
