# APPI v321 — El aviso "Hoy cumplen" del Home se retiró

## Qué pidió el administrador

Con la tarjeta de Cumpleaños del mazo funcionando a pleno (v320: saludo
directo por WhatsApp a cada persona), el widget "HOY CUMPLEN" que
quedaba en el Home era redundante. Pidió quitarlo.

## Qué se quitó

- El contenedor `#bdayBannerWrap` del Home.
- La función `renderBdayBanner()` completa y su llamada en
  `renderHomeCompleto()`.
- Todo el CSS de `.bday-banner` (claro y oscuro) y el `@keyframes
  bounce` que solo usaba ese banner.

## Qué NO se tocó

- `.bday-list` y `.bday-item`: son la lista de cumpleaños de **Mi
  Equipo**, que sigue igual.
- La tarjeta de Cumpleaños del mazo: es la que cubre el saludo ahora
  (toque directo al WhatsApp del cumpleañero, teléfono real de la
  planilla).

## Tests

`avisos-duplicados.spec.js` actualizado:

- **cada aviso vive sólo en su lugar** — cultura en el inicio, Bonus en
  Mi Equipo, y `bdayBannerWrap` con 0 copias (retirado).
- **el Bonus se pinta en Mi Equipo y el cumple ya no tiene aviso
  propio** — sin `.bday-banner` en el DOM y `renderBdayBanner` ya no
  existe.
- **el cumpleañero sigue cubierto: la tarjeta del mazo lo trae (v321)**
  — con una persona que cumple hoy, `armarTarjetas()` trae la tarjeta
  de cumpleaños con esa persona adentro: nadie queda sin saludo.
