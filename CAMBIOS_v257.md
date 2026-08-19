# APPI v257 · Histórico legible en celular

En el Histórico, los cuadritos con gráficos y las tarjetas del año se veían demasiado chicos en el celular: tipografías de 5–8 px, gráficos bajos y chips casi ilegibles.

## Qué cambia

- **Gráficos de línea** más altos (viewBox 240 px) con etiquetas, ejes y puntos más grandes. En celular el SVG escala al ancho completo con `min-height` de 210–230 px.
- **Tarjetas del año** (mes por mes): nombre del mes, PB, categorías y chips de ingresos/pases con tipografía legible (~11–16 px) y botones con área táctil cómoda.
- **Lectura COPA**, KPIs anuales, franja de comparación y matrices mobile: tipografías y paddings ampliados.
- En pantallas angostas (≤430 px) COPA pasa a una columna para que cada tarjeta ocupe todo el ancho.

## Archivos

- `historico.css` — tipografías, paddings y media queries mobile.
- `historico.js` — `lineChart` con más altura y fuentes SVG mayores.
- `service-worker.js` — cache `appi-v257-historico-mobile-cards`.
