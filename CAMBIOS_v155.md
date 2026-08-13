# APPI v155 — Gráficos detallados e informe profesional

## Gráfico de PB

- Cada punto de la línea muestra ahora su valor exacto.
- Los valores utilizan formato legible en español.
- Se conserva el mes debajo de cada punto.
- Las etiquetas se acomodan por encima o por debajo para evitar cortes.

## Gráfico de Ingresos

- Se agregó un segundo cuadro con la evolución mensual de Ingresos.
- Cada punto muestra la cantidad exacta del cierre.
- Los meses con reporte vacío muestran cero.
- El cuadro informa el total acumulado del año.

## Elementos eliminados

Se quitaron por completo del dashboard:

- Ingresos por patrocinante.
- Lectura rápida de Ingresos.

La información individual continúa disponible desde los indicadores, el Resumen Anual y el informe completo.

## Resumen Anual — Organizaciones completas

La fórmula de todas las filas por categoría fue actualizada:

- Org. Distribuidor Junior.
- Org. Distribuidores.
- Org. Distribuidor Calificado.
- Org. Coordinador.
- Org. Líder.
- Org. Líder Ejecutivo.
- Org. Ejecutivo.
- Org. Empresa.

Cada fila suma el PB total completo de las organizaciones encabezadas por personas de esa categoría. El PB total incluye a la persona y todos sus descendientes.

Solo se muestran las categorías que aparecen en algún cierre del año.

Al abrir cualquier categoría se muestran:

- Top 10 vendedores por PB Personal.
- Top 10 organizaciones por PB total completo.

## Informe completo en PDF

Se agregó al final del dashboard el botón **Generar y compartir PDF**.

El informe es un documento vectorial A4 horizontal e incluye:

1. Portada profesional con titular, período e indicadores principales.
2. Evolución anual de PB con valores mensuales.
3. Evolución anual de Ingresos con valores mensuales.
4. Resumen Anual completo.
5. Lectura ejecutiva y próximas acciones.
6. Una página detallada por cada cierre mensual.
7. PB organizacional por categoría.
8. Top 10 vendedores.
9. Top 10 organizaciones.
10. Ingresos con nombre, DIP, categoría y patrocinante.
11. Pases y Bonus.
12. Páginas adicionales si un mes contiene más ingresos de los que entran en la página principal.

En dispositivos compatibles se abre el menú nativo para compartir el PDF, incluyendo WhatsApp. En los demás navegadores el documento se descarga automáticamente.

Nombre del archivo: `APPI-Informe-Completo-AÑO.pdf`.

## Validación integral

Se probó un año de siete cierres con valores diferentes:

- Siete etiquetas visibles sobre el gráfico de PB.
- Siete etiquetas visibles sobre el gráfico de Ingresos.
- Meses con cero Ingresos representados correctamente.
- Los dos bloques eliminados ya no aparecen.
- Org. Líder aparece cuando existe la categoría.
- Org. Líder utiliza PB total organizacional.
- DJ también utiliza PB organizacional y no la suma de PB personales.
- Informe completo generado correctamente.
- PDF A4 horizontal de 11 páginas.
- Portada, gráficos, matriz anual, Org. Líder y páginas mensuales verificadas.
- Cero errores del navegador.

## Versión técnica

- Caché: `appi-v155-informe-profesional`.
- Pie visible: **APPI · v155 · Informe profesional**.
