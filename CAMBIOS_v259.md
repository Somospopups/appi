# APPI v259 · Histórico en tres modos claros

Reorganizamos el Histórico según el uso real: primero comparar meses, después mirar el año completo, y aparte cargar.

## Pestañas

1. **Comparar** (inicio)
   - Selector de meses arriba
   - Por defecto: **todo el año actual**
   - Un solo gráfico principal (elegís la métrica: PB, actividad, pendientes, ingresos, personas)
   - Franja de KPIs de la selección
   - **Atención según tu selección** (alertas calculadas con los meses elegidos)
   - Más detalle (categorías y personas) minimizado
2. **Mi año**
   - Historia visual del año, tarjetas por mes, matrices y lectura COPA
3. **Cargar**
   - Cargar y administrar cierres (igual que antes)

## Por qué

Los gráficos dependen de los meses elegidos. Tener el selector y un gráfico principal arriba evita scrollear por el año completo antes de poder analizar.

## Archivos

- `historico.js` · `renderCompareView`, `renderYearView`, métrica de gráfico, selección anual por defecto
- `historico.css` · chips de métrica y pestañas de 3
- `index.html` · nav y bloques inline
- `service-worker.js` · `appi-v259-historico-modos-comparar`
