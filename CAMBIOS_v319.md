# APPI v319 — El vuelo de las tarjetas es igual para los dos lados

## Qué pidió el administrador

Al deslizar a la izquierda, la tarjeta de arriba **vuela girando** y la
de atrás sube a su lugar: esa animación le encanta. Pero al deslizar a
la derecha pasaba otra cosa: la tarjeta anterior "entraba desde el
costado" — un efecto distinto. Pidió el mismo vuelo de los dos lados.

## Cómo quedó

Espejo perfecto:

- **Izquierda (pasar)**: la de arriba vuela hacia la izquierda girando
  (`translateX(-130vw) rotate(-22deg)`), la siguiente sube desde atrás.
- **Derecha (volver)**: la de arriba vuela hacia la derecha girando
  (`translateX(130vw) rotate(22deg)`), la anterior sube desde atrás.

### Detalles técnicos

- Al volver, la tarjeta que se va queda como **fantasma volando por
  encima** del mazo (clase `ht-fantasma`, z-index alto) mientras abajo
  ya está pintada la anterior; al terminar el vuelo (~470 ms) el
  fantasma se elimina del DOM.
- La tarjeta nueva arranca "un pasito atrás" (clase `detras1` + reflow
  + se la saca) y sube a su lugar con la transición base: la misma
  sensación de subida que al pasar.
- `pintar()` ya no barre los fantasmas (`.ht-card:not(.ht-fantasma)`),
  y los selectores del tope los excluyen.
- `pasar()` ahora devuelve verdadero/falso como `volver()`: si hay una
  sola tarjeta, el gesto rebota suave para los dos lados (antes, a la
  izquierda, la tarjeta podía quedar corrida sin volver a su lugar).

## Tests

- Nuevo en `home-limpio.spec.js`: **deslizar a la derecha vuela con el
  mismo gesto que a la izquierda, espejado (v319)** — exige el fantasma
  volando con `translateX(130vw) rotate(22deg)` (y no `-130vw`), que
  desaparezca al terminar y que la tarjeta anterior quede arriba.
- El test del gesto ida/vuelta ahora excluye al fantasma en su selector
  de "tarjeta de arriba" (mientras vuela convivían las dos).
- 21 tests del Home/mazo en verde.
