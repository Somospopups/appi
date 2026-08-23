# APPI v311 · El toque en el teléfono ya no se confunde con arrastre

## El problema (reproducido con eventos táctiles reales)

En el teléfono, tocar los botones de las tarjetas muchas veces no hacía
nada. La causa exacta: el dedo real no baja quieto — al tocar "tiembla"
5–10 píxeles — y el detector de arrastre del mazo (umbral de 7px) tomaba
ese temblor como el inicio de un arrastre y **anulaba el toque**. En la
PC con mouse nunca pasaba, por eso las pruebas no lo veían.

## El arreglo

El gesto recién cuenta como arrastre cuando el movimiento es claramente
**horizontal y amplio**:

- 14px de recorrido mínimo (antes 7), y siempre más horizontal que
  vertical;
- sobre un botón, un renglón o la ✗: **26px** — un toque con temblor
  jamás llega a eso, y un arrastre intencional lo pasa sin esfuerzo.

Deslizar sigue funcionando igual desde cualquier parte de la tarjeta.

## Pruebas

Nueva prueba táctil permanente: un toque que baja, tiembla 9px y suelta
sobre el botón dispara la acción (la ficha de Jorge se abre). Antes de
este arreglo, esa prueba fallaba — quedó de guardia.

## App Shell y caché v311

- `311.0.0` · visible `v311` · caché `appi-v311-toque-firme`
