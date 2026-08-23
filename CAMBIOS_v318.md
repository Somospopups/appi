# APPI v318 — El mazo queda a la vista y da la vuelta en bucle

## Qué pidió el administrador

El mazo de tarjetas del Home gustó, pero con retoques para que moleste
cero:

1. **Sin botón 🔔 Notificaciones**: las tarjetas quedan siempre visibles
   en el Home, no hace falta reabrirlas.
2. **Bucle infinito**: deslizando para la izquierda o para la derecha
   las tarjetas dan la vuelta sin fin (después de la última viene la
   primera, y antes de la primera está la última).
3. **Sin el botón "Pasar ›"** de abajo: el gesto alcanza.
4. **Texto de abajo corregido**: ya no dice "a la derecha volvés";
   ahora explica el bucle.
5. **Sin las dos ✗**: ni la de cada tarjeta (descartar una) ni la ✕ del
   encabezado (cerrar todo). El mazo no se cierra.

## Cómo quedó

- El mazo se monta arriba de todo en el Home apenas la app termina de
  cargar, todos los días (siempre está la tarjeta especial 💙 con el
  aliento del día). Las animaciones quedaron igual: pila de tarjetas,
  vaivén de demostración, arrastre con rotación, vuelo al pasar.
- `pasar()` y `volver()` usan índice en módulo: `(i+1) % N` y
  `(i-1+N) % N`. Con una sola tarjeta no hay a dónde ir y el gesto
  rebota suave. Detrás de la última asoma de nuevo la primera.
- Texto nuevo bajo el mazo: "← Deslizá para un lado o para el otro:
  las tarjetas dan la vuelta →".
- Se fue la maquinaria del botón (contador, latido `late`, marca de
  "visto" en localStorage): sin botón no hay nada que avisar.
- Tocar un renglón o el botón de acción sigue llevando directo a la
  pantalla; al volver al Home el mazo reaparece solo.
- `APPIHomeTarjetas` ahora también exporta `pasar` y `volver` (los
  tests los usan en lugar del botón que ya no existe).
- La llave `appi_tarjetas_auto='0'` sigue apagando la apertura
  automática (la usan los 23 arneses de prueba).

## Tests

`home-limpio.spec.js` quedó con 20 tests del Home/mazo:

- **el mazo queda a la vista: sin botón 🔔, sin ✕ de cierre, sin ✗ y
  sin Pasar (v318)** — exige que no exista nada de lo que se quitó y
  que el texto nuevo hable del bucle.
- **las tarjetas dan la vuelta en bucle para los dos lados (v318)** —
  pasar N veces cae de nuevo en la primera; volver desde la primera
  muestra la última; el mazo nunca se cierra en el camino.
- Los demás se adaptaron al gesto/exports (ya no existe `#htPasar`).
