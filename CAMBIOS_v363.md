# APPI v363 — Cultura: el PB ya no se tipea

## Qué pasaba

v362 buscaba el PB oficial, pero el recuadro seguía siendo un campo para
escribir. Quien ya tenía un número tipeado (un 1, un 7,5) lo veía igual,
porque no se pisaba. Parecía manual.

## Qué cambia

El PB personal es **sólo lectura**.

- Si está en la Línea, se muestra el número y “Desde tu Línea”.
- Si no está, un guión y “Cargá tu Línea” (un toque abre Mi Equipo).
- No hay input. No se puede tipear. No se inventa.
- Los invitados siguen a mano.

## Archivos tocados

- **`index.html`** · display automático, sync siempre que hay número oficial.
- **`tests/e2e/cultura-pb.spec.js`**, **`tests/e2e/avisos-duplicados.spec.js`**,
  **`tests/cultura-pb.node.js`**.
- Versión y caché: `v363` / `appi-v363-pb-auto`.
