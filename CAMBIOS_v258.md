# APPI v258 · Motion graphics en los gráficos del Histórico

Los gráficos del Histórico ahora entran con animaciones suaves tipo motion graphics, sin librerías extra y respetando `prefers-reduced-motion`.

## Qué se anima

- **Línea que se dibuja** de izquierda a derecha (`stroke-dashoffset`).
- **Área bajo la curva** que crece desde la base con degradé.
- **Puntos** que aparecen en cascada, con halo suave en el último valor.
- **Etiquetas y meses** que entran con fade + slide.
- **Brillo sutil** que recorre la línea después de dibujarse.
- Glow de fondo del color del gráfico.
- Tarjetas COPA, KPIs del año, franja de comparación y medidores de mes con entrada escalonada.
- El anillo de progreso anual y las barras de cada mes también tienen entrada animada.

## Detalles técnicos

- La animación se dispara al entrar el gráfico en pantalla (`IntersectionObserver`), no apenas se renderiza fuera de vista.
- Si el dispositivo pide menos movimiento, todo queda estático e inmediatamente legible.
- Sin dependencias nuevas: SVG + CSS + un poco de JS para medir el largo de la línea.

## Archivos

- `historico.js` · `lineChart` + `animateHistCharts`
- `historico.css` · keyframes y estados `.is-ready` / `.is-drawn`
- `index.html` · bloques inline sincronizados
- `service-worker.js` · cache `appi-v258-historico-chart-motion`
