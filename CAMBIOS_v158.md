# APPI v158 — Secciones plegables y acumulación progresiva

## Secciones minimizables

Todas las tarjetas de **Resumen y análisis** incorporan ahora un botón:

- Minimizar.
- Mostrar.

El estado elegido se conserva en el dispositivo después de cambiar períodos o volver a renderizar Histórico.

La sección **Cambios individuales** comienza minimizada por defecto. El usuario puede abrirla y APPI recuerda esa elección.

También son minimizables:

- Atención requerida.
- Resumen Anual.
- Evolución de PB.
- Evolución de Ingresos.
- Comparar y analizar.
- Actividad.
- Garantías pendientes.
- Evolución por categoría.
- Próximas acciones.

## Resumen de acumulación corregido

Se eliminó la suma de organizaciones completas superpuestas, porque podía contar a las mismas personas varias veces y producir valores sin una progresión lógica.

Nueva regla:

- Org. DJ: PB de personas DJ.
- Org. D: DJ + D.
- Org. DC: DJ + D + DC.
- Org. CE: DJ + D + DC + CE.
- Org. Líder: DJ + D + DC + CE + L.
- La misma acumulación continúa con LE, EJ y E.

Cada persona se cuenta una sola vez.

Esto garantiza que al avanzar de categoría el acumulado sea igual o mayor al nivel anterior.

Validación con el cierre real:

| Nivel | PB acumulados |
|---|---:|
| DJ | 371,1 |
| D | 884,8 |
| DC | 1.187,9 |
| CE | 1.262,8 |
| L | 1.262,8 |

La fila Org. Líder continúa apareciendo mediante la categoría detectada en el encabezado del titular.

## Gráficos del informe completo

Los gráficos PDF fueron rediseñados para reproducir la presentación de APPI:

- Fondo acumulado bajo la línea.
- Líneas de referencia.
- Puntos circulares.
- Valores exactos dentro de píldoras blancas.
- Color azul para PB.
- Color violeta para Ingresos.
- Meses debajo de cada punto.

## Indicadores mensuales del PDF

Se corrigió la superposición de información en los cuadros pequeños del detalle mensual.

En particular:

- Actividad.
- Vencidas.

Ahora utilizan tamaños y posiciones adaptados cuando tienen información secundaria.

Validación visual:

- Etiqueta Actividad.
- Valor principal 40%.
- Detalle 142/353 en una línea separada.
- Etiqueta Vencidas.
- Valor principal 70%.
- Detalle 30.441 de 43.699 en una línea separada.
- Sin cruces ni texto pisado.

## Validaciones realizadas

- Diez tarjetas y diez controles de minimización.
- Cambios individuales minimizado inicialmente.
- Apertura manual recordada después de volver a renderizar.
- Acumulación anual monotónica comprobada.
- Informe completo de siete meses: 11 páginas.
- Exactamente una hoja por mes.
- Gráficos de PB e Ingresos verificados visualmente.
- Píldoras de valores visibles.
- Actividad y Vencidas sin superposición.
- Cero errores del navegador.

## Versión técnica

- Caché: `appi-v158-historico-plegable`.
- Pie visible: **APPI · v158 · Histórico plegable**.
