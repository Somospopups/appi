# APPI v362 — PB oficiales en Cultura

## Qué pasaba

Cultura de crecimiento pedía el PB personal a mano cada mes. El número
oficial ya está en la Línea Descendente, pero APPI no lo leía: el parser
salteaba el nivel 0 (el titular, que figura primero) y el nodo virtual
del titular tenía `pnAct: 0`. Si la cuenta tiene socio, el segundo
nombre de la cabecera no es el PB a usar.

## Qué cambia

Cultura carga sola **el PB personal del titular de la cuenta**.

- En la planilla el titular figura primero. Si hay socio, se busca el
  nombre/DIP del titular, nunca el del socio.
- Si el Excel trae al titular como nivel 0, se toma esa fila (no entra
  al árbol del equipo: sólo su PB).
- Si no está el número oficial, el campo queda vacío. APPI no inventa.
- Los invitados siguen a mano.
- Al recargar la Línea, el PB oficial pisa el del mes. Si todavía no
  hay Línea, se puede seguir tipeando.

El GPS del mes usa la misma fuente, para no leer el PB de la primera
persona de la red como si fuera el tuyo.

## Archivos tocados

- **`index.html`** · parser nivel 0, cruce titular/DIP/nombre, auto-carga
  en Cultura, pie `v362`, caché `appi-v362-pb-cultura`.
- **`tablero-negocio.js`** · GPS lee `culturaPbOficial`.
- **`tests/cultura-pb.node.js`** · cruce titular vs socio, DIP, sin inventar.
- **`tests/e2e/cultura-pb.spec.js`** · campo de Cultura y carga manual de
  respaldo.
- **`service-worker.js`**, **`package.json`**, **`package-lock.json`**,
  **`README.md`**, **`CAMBIOS_v362.md`**.

Sin cambios en la base de datos.

## Versionado y caché

- Pie visible: `APPI · v362 · Segura` · `swVersion='362'`.
- `CACHE_NAME='appi-v362-pb-cultura'`.
