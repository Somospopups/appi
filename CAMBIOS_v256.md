# APPI v256 · El logo de vidrio en el arranque de todos los dispositivos

En v255 el logo de vidrio existía sólo en las imágenes de arranque de algunos iPhone. En el resto de los equipos el arranque mostraba otro dibujo: Android usaba el ícono plano del manifiesto, los iPad y los iPhone nuevos arrancaban con un recuadro claro sin logo, y la PC entraba directamente a la animación con el texto suelto.

v256 unifica el arranque: **el mismo logo de vidrio en todos los dispositivos**.

## Un solo dibujo para todos los arranques

- `scripts/logo_vidrio.py` es ahora el único generador: el fondo pastel de la app, el cartel de vidrio esmerilado con esquinas redondeadas reales, el reflejo diagonal y el wordmark APPI en letras heladas.
- `scripts/make-splash.py` genera con él las imágenes de arranque de iPhone y iPad.
- `scripts/make-icons.py` genera con él los íconos del manifiesto y el `apple-touch-icon`.

Al salir del mismo generador, el logo del arranque nativo, el del ícono y el de la pantalla de ingreso son idénticos.

## iPhone y iPad

- Se pasó de 14 a 26 imágenes de arranque.
- Verticales nuevas: iPhone SE (640×1136), iPhone 16 Pro (1206×2622), iPhone 16 Pro Max (1320×2868), iPad mini (1488×2266) e iPad Pro 10.5 (1668×2224).
- Apaisadas nuevas para toda la línea de iPad: 2048×1536, 2160×1620, 2224×1668, 2266×1488, 2360×1640, 2388×1668 y 2732×2048. Antes, una tablet abierta de costado arrancaba con una pantalla en blanco.
- Se conserva una imagen sin `media` como red de seguridad para cualquier equipo que no coincida con la lista.

## Android

- Android dibuja su pantalla de arranque con el ícono del manifiesto sobre `background_color`. Los íconos `192`, `512` y sus versiones `maskable` ahora llevan el logo de vidrio, así que el arranque de Android muestra lo mismo que el de iPhone.
- Las versiones `maskable` dejan el cartel dentro de la zona segura para que el recorte circular de Android no lo corte.
- `apple-touch-icon.png` y el logo de la pantalla de ingreso quedan con el mismo dibujo.

## Dentro de la app (celular, tablet y PC)

- La animación de carga mantiene el agua que sube, pero el wordmark suelto se reemplazó por el cartel de vidrio: panel translúcido con desenfoque, borde de luz, reflejo superior y brillo diagonal, con las letras heladas.
- Se dibuja con CSS: el arranque no descarga ninguna foto y no agrega espera.
- Hay una variante sin `backdrop-filter` para los navegadores que no lo soportan, y tamaños reducidos en pantallas angostas.

## Versión y caché

- Versión visible, `package.json` y registro del Service Worker alineados en **v256**.
- `CACHE_NAME` pasa a `appi-v256-logo-vidrio`, así los equipos que ya tenían APPI instalada reciben el arranque nuevo.

## Verificación

- Suite Playwright completa, con la prueba nueva `tests/e2e/logo-vidrio.spec.js`:
  - cada `apple-touch-startup-image` declarado apunta a un archivo que existe;
  - 15 familias de iPhone y iPad tienen su imagen vertical, y las tablets también la apaisada;
  - los íconos del manifiesto existen y salen del generador único;
  - el arranque muestra el logo de vidrio en celular (360 px), tablet (834 px) y PC (1440 px), sin pedir imágenes.
- Sintaxis JavaScript comprobada con `node --check`.
