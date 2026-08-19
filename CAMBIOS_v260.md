# APPI v260 · Histórico legible en PC

En pantallas grandes el Histórico seguía usando tipografías pensadas para celular (9–12 px). Los números, tablas, KPIs y tarjetas se veían chicos en el monitor.

## Qué cambia (≥900 px)

- Títulos, párrafos, badges y botones más grandes
- Franja de comparación (KPIs) con valores ~22 px
- Selector de meses, chips de métrica y pestañas más cómodos
- Gráficos más altos (min-height ~280–310 px)
- Tablas, COPA, tarjetas del año y matrices anuales con tipografía de escritorio
- Contenedor del Histórico centrado hasta ~1180–1280 px

En pantallas ≥1200 px hay un segundo escalón un poco más amplio.

En celular se mantienen los tamaños de v257–v259.

## Archivos

- `historico.css` · media queries desktop
- `historico.js` · etiquetas SVG un poco mayores
- `index.html` · bloques inline
- `service-worker.js` · `appi-v260-historico-desktop-type`
