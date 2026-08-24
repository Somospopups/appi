# APPI v332 — Se quita el botón Mapa de Usuarios

## Qué cambia

A pedido del equipo, el botón **Mapa** se elimina de los dos lugares donde
aparecía en Usuarios / Garantías:

- **Barra de herramientas** (el 🗺️ Mapa junto a Tarjetas/Ordenar/Zonas).
- **Ficha de cada cliente** (el 📍 Mapa junto a Vecinos / ¿Cómo llego?).

## Cómo queda

- La ficha conserva **👥 Vecinos** (que sigue mostrando el mapa con los
  vecinos de la misma zona) y **🧭 ¿Cómo llego?** (que abre Google Maps).
- Como el mapa lo sigue usando Vecinos, ahora trae su propio botón **×**
  para cerrarlo (antes se cerraba tocando de nuevo el botón Mapa).
- Se quitó la lógica muerta (`verMapaU`, `alternarMapaU`) y la referencia
  al botón en filtros e inicialización.

## Versionado

- `package.json` 332.0.0 · visible `v332` · caché `appi-v332-sin-boton-mapa`.

## Pruebas

- `mapa-usuarios.spec.js` reescrito: exige que los botones Mapa no existan
  y cubre Vecinos + el botón × para cerrar.
- `usuarios-botones.spec.js`, `mensajes-usuarios.spec.js` y
  `reactivacion.spec.js` actualizados al nuevo contador de herramientas.
