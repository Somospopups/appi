# APPI v320 — El saludo al cumpleañero va directo al WhatsApp

## El problema (con datos reales, no en los tests)

En la tarjeta de Cumpleaños del mazo, tocar a la persona del equipo
tenía que abrir el WhatsApp con el saludo listo. Con datos reales no lo
hacía: mandaba a Mi Equipo (el plan B para cuando no hay teléfono).

## Qué pasaba por dentro

Los cumpleañeros y las oportunidades de bonus del equipo salen de la
planilla de Línea Descendente, y el lector de la planilla guarda el
número en el campo **`tel`**. Las tarjetas buscaban `telefono`/`telf`
— campos que la planilla no genera — así que para el equipo real nunca
encontraban el número y caían siempre al plan B.

¿Y por qué la suite no lo pescó? El test de guardia sembraba a la
persona de prueba con `telefono:` — justo el campo equivocado que el
código leía. El test y el código compartían el mismo error y se
validaban entre sí. Con datos de la planilla real, fallaba.

## El arreglo

- `tarjetaCumples()` (saludarEquipo) y `tarjetaOportunidades()`
  (proponer) leen `p.tel || p.telefono || p.telf`: primero el campo
  real de la planilla, con los otros de respaldo.
- El fallback a Mi Equipo queda solo para quien de verdad no tiene
  número cargado en la planilla.

## Tests

- El test del cumpleaños ahora siembra a Ana con `tel:` (el campo real
  del lector de planilla). Antes del arreglo, falla; después, pasa.
- Nuevo: **proponer el bonus abre el WhatsApp de la persona con el
  teléfono real de la planilla (v320)** — mismo bug en la tarjeta de
  Oportunidades, mismo arreglo, su propio guardia.
- 22 tests del Home/mazo en verde.
