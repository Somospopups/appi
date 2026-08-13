# APPI v159 — Organización y distribución verificable

## Corrección conceptual del Resumen Anual

Se eliminó la acumulación progresiva de la versión anterior.

Aunque esa fórmula producía números crecientes, no representaba correctamente la estructura del reporte. También se descartó sumar organizaciones completas por categoría porque las ramas pueden estar anidadas y las mismas personas terminarían contadas varias veces.

El nuevo modelo separa dos datos diferentes.

## Organización del titular

Se muestra una única fila:

- **Organización del titular · categoría detectada**.

El valor corresponde al total del padrón mensual y cada persona se cuenta una sola vez.

Con el cierre real validado:

- Titular: SILVIA DEL VALLE TOLEDO.
- Categoría detectada: Líder.
- Organización del titular: 1.262,8 PB.

Al tocar la fila se muestra:

- Nombre del titular.
- DIP.
- Categoría.
- PB organizacional total.
- Top 10 de organizaciones internas.

## Distribución del PB por categoría

Debajo se muestran únicamente las categorías presentes entre las personas del padrón:

| Categoría | PB personales |
|---|---:|
| DJ | 371,1 |
| D | 513,7 |
| DC | 303,1 |
| CE | 74,9 |
| **Total** | **1.262,8** |

La suma coincide exactamente con la Organización del titular.

Reglas:

- Cada persona pertenece a una sola categoría.
- Se utiliza únicamente su PB Personal.
- No se suman descendientes en el total de la fila.
- No se duplican organizaciones anidadas.
- La categoría del titular no crea una fila de distribución si el titular no aparece dentro del padrón y no existe otra persona de esa categoría.

Por este motivo no se exige que D sea menor que DC o que DC sea menor que CE: las filas representan distribución real del total, no una escala de crecimiento.

## Rankings conservados

Al abrir una categoría se mantienen:

- Top 10 vendedores de esa categoría.
- Top 10 organizaciones como información complementaria.

El encabezado explica cuántas personas componen la categoría y cuántos PB personales generaron.

## Informe completo

Se actualizó el informe PDF para utilizar el mismo modelo:

- Organización del titular separada.
- Distribución por categoría.
- Columna PB Personal.
- Sin acumulación progresiva.
- Sin duplicación de descendientes.

Se conservaron las mejoras de v158:

- Gráficos con áreas, puntos y píldoras.
- Actividad y Vencidas sin superposición.
- Una sola hoja por mes.

## Secciones minimizables

Se mantienen los diez controles de minimización.

- Cambios individuales comienza cerrado.
- La elección del usuario se conserva localmente.

## Validación integral

- Organización del titular: 1.262,8 PB.
- DJ: 371,1 PB.
- D: 513,7 PB.
- DC: 303,1 PB.
- CE: 74,9 PB.
- Suma de categorías: 1.262,8 PB.
- Diferencia contra el total organizacional: 0.
- Org. Líder del titular visible.
- No aparece una fila personal L artificial.
- Detalle del titular correcto.
- Detalle de D: 79 personas y 513,7 PB personales.
- PDF de siete meses: 11 páginas.
- Siete páginas mensuales.
- Cero errores del navegador.

## Versión técnica

- Caché: `appi-v159-distribucion-verificable`.
- Pie visible: **APPI · v159 · Distribución verificable**.
