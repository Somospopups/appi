# APPI v360 — Selección flotante en la Agenda Personal

## Qué pasaba

La solapa **📱 AGENDA PERSONAL** del Panel de Contactos ya tenía selección
múltiple (v358), pero sólo se llegaba a ella de una manera:

- había que acertarle al **checkbox chiquito** de cada fila, uno por uno, y
- la barra de acciones sólo aparecía **después** de marcar el primero, así que
  no había ninguna pista de que se podía elegir más de un contacto.

En el teléfono eso es incómodo: el checkbox es un blanco chico entre el avatar,
el número y los cuatro botones de la tarjeta, y para elegir cinco contactos hay
que hacer cinco punterías.

## Qué cambia

La selección pasa a ser un **modo** que se abre de dos formas y se cierra con
una ✕:

- **Mantener presionado** un contacto (~medio segundo) lo elige y abre la
  barra. Vibra un toque donde el teléfono lo permite.
- El botón **"☑️ Elegir varios"** del encabezado de la lista abre el modo sin
  seleccionar nada. Con el modo abierto **toca la fila entera** para elegir o
  soltar, y el botón pasa a decir **"✓ Listo"** para cerrarlo.

La **barra flotante** queda pegada abajo (`position:sticky`) con:

- el contador de elegidos,
- **📇 Pasar a APPI (n)** y **🗑️ Quitar (n)**,
- **✕** para soltar todo y cerrar el modo.

Con el modo abierto pero cero elegidos la barra igual se muestra —es la señal
de que se puede seguir tocando filas— y las dos acciones quedan apagadas hasta
que haya algo elegido.

### Detalles que evitan falsas selecciones

- **Recorrer la lista no elige nada.** Si el dedo se corre más de 10 px, el
  gesto se cancela: era un desplazamiento, no una selección.
- **Soltar antes de medio segundo es un toque común**: no selecciona (y con el
  modo cerrado no hace nada).
- **Los controles de la fila siguen haciendo lo suyo.** El gesto ignora
  `button, a, input, label, select, textarea`: el 💬, el 📞, el 📇, el 🗑️ y el
  checkbox de la tarjeta no se confunden con el toque que elige.
- **El click con el que termina el gesto no deshace la selección.** Al elegir,
  el panel se repinta y el `click` que sigue al `pointerup` cae sobre la fila
  nueva; un sello de una sola vez (registrado en fase de captura sobre
  `document`, una sola vez por página) descarta ese click. Sin esto, el gesto
  largo elegía y soltaba en el mismo movimiento.

El modo se cierra solo cuando termina una acción masiva (pasar o quitar), con
la ✕ de la barra o con "✓ Listo". Los caminos que ya existían (checkbox por
fila y "Seleccionar todos") siguen funcionando igual.

## Archivos tocados

- **`agenda-personal.js`** · el gesto largo, el modo de selección, el botón
  "Elegir varios", la barra visible con cero elegidos, los estilos del modo y
  el sello anti-click. Se exportan `alternarSeleccion()` y `modoSeleccion()`
  en `window.APPIAgendaPersonal`.
- **`tests/e2e/agenda-personal.spec.js`** · cinco regresiones nuevas (gesto
  largo, botón "Elegir varios", recorrido que no selecciona, botones de la fila
  con el modo abierto, y la ✕).
- **`index.html`** · pie en `v360`, `swVersion='360'` y
  `CACHE_NAME='appi-v360-seleccion-flotante'`.
- **`service-worker.js`** · `CACHE_NAME='appi-v360-seleccion-flotante'`.
- **`package.json`** · `version: 360.0.0`, `cacheName` nuevo.
- **`README.md`** · versión y caché al día.
- **`CAMBIOS_v360.md`** · este archivo.

Sin cambios en la base de datos.

## Versionado y caché

- Pie visible: `APPI · v360 · Segura` · `swVersion='360'`.
- `CACHE_NAME='appi-v360-seleccion-flotante'` en `service-worker.js` y en la
  metadata de `index.html` / `package.json` / `README.md`. Al cambiar el
  nombre, el teléfono descarta el caché viejo la primera vez que abre la app.

## Cómo se verificó

- **`tests/e2e/agenda-personal.spec.js`** · cinco pruebas nuevas sobre
  Chromium con Supabase simulado:
  - mantener presionado abre la barra con **exactamente** un elegido;
  - "Elegir varios" abre la barra con las acciones apagadas, deja elegir y
    soltar tocando las filas, y "✓ Listo" cierra y suelta todo;
  - correr el dedo 40 px no selecciona nada;
  - con el modo abierto, el 📇 de la fila abre el diálogo de pasar a APPI (y no
    elige la fila) y el checkbox elige sólo a su contacto;
  - la ✕ suelta todo y deja `modoSeleccion()` en `false`.
- **Regresiones del repo** · `pwa-cache.spec.js` (la versión visible, el
  paquete, el `index.html` y el Service Worker dicen todos `v360` con el mismo
  `CACHE_NAME`) y `sintaxis.spec.js` (todos los `.js` y los scripts inline
  compilan) en verde.
- **Prueba de gesto a nivel de módulo** · además de las pruebas de navegador se
  corrió el `agenda-personal.js` real dentro de un DOM y se lo manejó con
  `pointerdown` / `pointermove` / `pointerup` / `click`: 44 verificaciones en
  verde. Como control negativo se le sacó el sello anti-click a una copia del
  módulo y 7 de esas verificaciones pasaron a fallar —o sea que la prueba del
  gesto largo realmente cubre ese riesgo.
