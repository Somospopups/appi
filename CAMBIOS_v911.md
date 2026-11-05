# APPI v911 · Tu volumen personal entra al ranking aunque Bonos sea de otro mes

## Qué pasaba (la causa real)

La v910 ya buscaba el **Volumen Personal** en el Reporte de Bonos, pero con una
condición que en la vida real no se cumple:

> sólo se usaba si el reporte era **del mismo mes** que el cierre.

En el teléfono del titular eso nunca ocurre: el **cierre disponible es Octubre
2026** y el **Reporte de Bonos es Noviembre-2026** (PSA publica el reporte del
mes con la producción del cierre anterior). Resultado: la condición fallaba, el
47,65 se descartaba y el titular **seguía sin aparecer**. La app no mostraba
ningún error: simplemente no había número para poner.

## Cómo funciona ahora

1. **Primero manda el cierre**: si la Línea Descendente trae tu PB (en tu fila),
   o el cierre lo tiene guardado, se usa eso. El Reporte de Bonos **no lo pisa**.
2. **Si el cierre no trae tu PB**, APPI usa el "Volumen Personal" del Reporte de
   Bonos **aunque sea de otro mes**, y lo dice en pantalla:
   *"Tu volumen personal viene del Reporte de Bonos de Noviembre-2026. La Línea
   Descendente del cierre de Octubre 2026 no trae tu PB personal…"*
3. Si todavía no hay nada de nada, en lugar de quedarse callada avisa:
   *"Todavía no tenemos tu volumen personal. Abrí Mi negocio → Reporte de Bonos
   una vez"*.
4. **Funciona aunque el cierre guardado no tenga bloque de titular**: el nombre
   y el DIP salen del propio Reporte de Bonos.
5. El período del reporte se lee en varios formatos: `Noviembre-2026`,
   `Noviembre 2026`, `11/2026`, `2026-11`.

No hay que volver a importar nada: el ranking se calcula al abrirlo.

## Pruebas

`ranking-pb.spec.js` — **9/9**. Tres nuevas, con los datos reales:

- *el volumen de bonos de otro mes se usa sólo si el cierre no trae tu PB*:
  cierre de octubre + Bonos de noviembre + Línea Descendente sin su PB →
  **1º con 47,65** y la app informa el origen.
- *si el cierre ya trae el PB del titular, el reporte de bonos no lo pisa*:
  cierre 30 y Bonos 99,90 de otro mes → vale **30**.
- *aunque el cierre no tenga bloque de titular, aparece con los datos de Bonos*.

Suite amplia: **99 en verde** (histórico ×5, ranking, caché, Appi, gotita,
recorrido, buscador, bonos, sintaxis).

## Versión

- `version`: **911.0.0** · pie **APPI · v911 · Segura**
- Caché: `appi-v911-ranking-completo`
- Archivos: `historico.js` + `index.html` (ambas copias idénticas),
  `service-worker.js`, `package.json`, `README.md`
