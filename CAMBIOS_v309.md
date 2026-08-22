# APPI v309 · El mazo espera su turno

## El problema

Las tarjetas de notificaciones aparecían antes de tiempo: mientras el
usuario todavía estaba en la elección de titular/socio (o con la
pantalla de arranque encima), el mazo se abría por debajo/encima y se
mezclaba con el inicio. La causa: el Home queda técnicamente "activo"
debajo de esos overlays, y el mazo salía a los 650 ms fijos.

## El arreglo

El mazo ahora espera a que **la app termine de cargar de verdad** antes
de aparecer. La verificación cubre todo el arranque:

- la pantalla de arranque (bootScreen) ya se fue;
- la elección de titular/socio no está abierta (ni pendiente según la
  sesión);
- el inicio no está cubierto por ningún overlay del boot;
- la sesión está autorizada localmente.

Si algo de eso falta, el mazo **espera pacientemente** (revisa cada
400 ms hasta 18 s) y recién cuando todo está listo respira medio
segundo más y sale. Si el usuario se fue del Home mientras tanto, no
aparece.

## Pruebas

Nueva en `home-limpio.spec.js`: con la elección de persona pendiente,
el mazo no aparece; apenas se resuelve, sale solo con la tarjeta
especial primera.

## App Shell y caché v309

- `309.0.0` · visible `v309` · caché `appi-v309-mazo-espera-su-turno`
