# APPI v316 · El mazo vive dentro del Home (y dos bugs de regalo)

## El mazo, sin popup

A pedido del equipo: las tarjetas de notificaciones dejan de aparecer
como popup (se sentía invasivo) y pasan a vivir **dentro del panel del
Home**, en una tarjeta contenedora arriba de todo, con TODO igual:

- el mazo apilado con las de atrás asomando, mismas animaciones;
- deslizar (izquierda pasa, derecha vuelve), la ✗ que descarta de a
  una, los botones de acción directa, el vaivén de presentación;
- el ✕ del encabezado la oculta y el 🔔 la trae de vuelta;
- si el Home se repinta, el mazo abierto se vuelve a montar solo donde
  estaba, conservando la tarjeta en la que ibas.

## Bug 1: el scroll que moría (el de Mi Equipo)

Desde v300, abrir cualquier cosa que bloquee el scroll (el calendario,
una ficha) lo dejaba **muerto para siempre**: el guard de overlays veía
el popup oculto de "Crear cuenta" (que vive en el DOM con la clase
`membership-modal-overlay`) y nunca liberaba. Por eso Mi Equipo no
scrolleaba después de usar el calendario. Ahora el guard solo cuenta
overlays visibles. Prueba de regresión incluida.

## Bug 2: el arranque robaba toques

Mientras la pantalla de arranque hacía su animación de salida, seguía
capturando los toques de toda la app (~medio segundo de "botones
muertos" en cada apertura, y el mazo inline quedaba debajo). Ahora, en
cuanto pide salida, deja pasar los toques.

## App Shell y caché v316

- `316.0.0` · visible `v316` · caché `appi-v316-mazo-en-casa`
