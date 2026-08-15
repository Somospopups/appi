# APPI · v214 · Notificaciones APPI

## Objetivo

Evitar que Android muestre un cuadrado completamente blanco como ícono pequeño cuando llega una solicitud de llamada.

## Cambios

- El ícono principal de la notificación continúa usando el logotipo completo y a color de APPI.
- Se creó `notification-badge.png`, una insignia monocromática específica para Android.
- La insignia tiene fondo totalmente transparente y una “A” blanca, gruesa y centrada.
- Android puede reducirla y teñirla correctamente en la barra de estado sin convertir todo el cuadrado en blanco.
- El nuevo recurso se incluye en la caché offline del Service Worker.
- El manifiesto lo declara también como recurso `monochrome`.

## Compatibilidad

- Android: muestra la insignia monocromática pequeña y conserva el ícono completo dentro de la notificación cuando el sistema lo permite.
- iPhone/iPad: iOS continúa administrando el ícono a partir de la PWA instalada.
- No cambia la vinculación, el envío de llamadas ni el contenido de las notificaciones.

## Pruebas

- El Service Worker conserva sus eventos `push` y `notificationclick`.
- La prueba verifica el ícono principal.
- La prueba verifica la nueva ruta de `badge`.
- La prueba confirma que `notification-badge.png` se sirve correctamente como PNG.

## Resultados

- Pruebas específicas del Service Worker y puente de llamadas: **2 aprobadas en 7,5 s**.
- Suite completa de Playwright: **16 aprobadas en 44,4 s**.
- Validación del PNG: **192 × 192**, esquinas transparentes y contenido visible limitado al **17,6 %** del lienzo.
- Sintaxis, manifiesto y `git diff --check`: correctos.
