# APPI v910 · Tu volumen personal también cuenta cuando viene de Bonos

Sólo mejoras: nada de lo que ya funcionaba se quitó.

## Por qué

Con la v909 el titular ya entraba al ranking, pero el propietario probó con sus
datos reales y mostró dos capturas:

> *"mira mi volumen personal de 47.65 y fijate que no aparezco en el ranking"*

En el **Reporte de Bonos** se lee *Volumen Personal 47,65* y el ranking personal
de ese mismo cierre mostraba 24.80, 22.35, 12.80… sin ella. La v909 tomaba el PB
del titular de `period.titular.pbPersonal`, que sale de la **Línea Descendente**;
cuando esa planilla **no trae su PB** (o lo trae en cero, porque sólo lista
patrocinados), no había nada que sumar y seguía faltando.

## Qué cambió

- **Se usa el "Volumen Personal" del Reporte de Bonos** como fuente del PB
  personal del titular. Es el mismo número que la persona ve en *Mi negocio →
  Reporte de Bonos*, leído de la copia que APPI ya guarda en el teléfono
  (`appi_bonos_v1`), así que funciona sin conexión.
- **Sólo del mismo mes.** El reporte trae su período (*Noviembre-2026*); si no
  coincide con el mes del cierre (*Octubre-2026*), no se usa. Nunca se mezclan
  meses.
- **Se toma el mayor número disponible** entre el cierre
  (`titular.pbPersonal`), la fila del titular en el árbol (`pnAct`) y Bonos.
- **Si su fila está en cero**, el ranking igual la muestra con el volumen de
  Bonos.
- **No se duplica**: si el titular ya está en la lista de personas, se
  actualiza su valor; si no está, se agrega una sola vez.
- El **"PB personal" del resumen** y la **ficha del titular** usan el mismo
  criterio, así los tres lugares dicen lo mismo.

## Versión

- `version`: **910.0.0**
- Cache del Service Worker: `appi-v910-ranking-completo`
- Pie de la app: **APPI · v910 · Segura**
- Archivos táctiles: `index.html` y `historico.js` (copias idénticas),
  `service-worker.js`, `package.json`, `README.md`

## Pruebas

`ranking-pb.spec.js` — **7/7**, con dos pruebas nuevas que reproducen el caso
real:

- *el titular aparece en el ranking aunque su PB venga sólo del Reporte de
  Bonos*: la Línea Descendente sin su fila, Bonos de octubre con 47,65 y el
  ranking personal encabezado por ella con 47,65.
- *el volumen de bonos de otro mes no se mezcla con el cierre*: con Bonos de
  noviembre y un cierre de octubre, el ranking queda como estaba.
- Las cinco pruebas anteriores siguen en verde (titular con su PB en el cierre,
  sin duplicados, miles, DIP repetido, recuperación automática).
