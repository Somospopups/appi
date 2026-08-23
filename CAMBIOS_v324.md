# APPI v324 — El asomo dice la verdad y el botón de Oportunidades va a Mi Equipo

## Qué pidió el administrador

1. Que el botón violeta de la tarjeta de Oportunidades diga
   **"Ir a Mi Equipo"** (decía "Proponerle a Ana").
2. Que al arrastrar una tarjeta **siempre asome atrás la que de verdad
   viene**: asomaba siempre la siguiente, y si el gesto era hacia la
   derecha (volver) aparecía la anterior de golpe — no coincidía con lo
   que se veía venir y quedaba feo.

## Cómo quedó

### Botón de Oportunidades
- CTA: **"Ir a Mi Equipo"** → `abrirEquipo()` (ahí viven los avisos de
  Bonus completos con WhatsApp/Llamar).
- Los renglones siguen igual: tocar a la persona manda la propuesta por
  WhatsApp directo (y avisa si no tiene teléfono, v322).

### Asomo direccional (v324)
- Nuevo `asomar(dir)`: repinta las tarjetas de atrás sin tocar la de
  arriba. Con `dir=1` asoman la siguiente y la subsiguiente; con
  `dir=-1`, la anterior y la ante-anterior (índices en módulo, como
  todo el mazo en bucle).
- En el arrastre se detecta la dirección del dedo (signo de dx): al
  cambiar de lado, `asomar()` intercambia lo que se ve atrás al vuelo.
  Arrastrás a la derecha → asoma la anterior; soltás y esa misma sube.
  Continuidad perfecta en los dos sentidos.
- Si el gesto no se concreta (rebote), atrás vuelve a asomar la
  siguiente.
- De paso, el armado del HTML de cada carta se extrajo a `crearCarta()`
  (lo usan `pintar()` y `asomar()`, cero duplicación).

## Tests

- **el botón de Oportunidades dice Ir a Mi Equipo y te lleva ahí
  (v324)** — texto exacto, navega a view-equipo y el mazo sigue vivo.
- **al arrastrar asoma la tarjeta correcta según la dirección (v324)**
  — con PointerEvents sintéticos: arrastre a la derecha asoma la
  anterior, cambio de dirección en el aire intercambia a la siguiente,
  y el rebote deja la siguiente asomando.
- 27 tests del Home/mazo en verde.
