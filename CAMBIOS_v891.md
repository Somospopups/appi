# APPI v891 · Financiación de tarjetas actualizada

## Resultado visible

- Presupuesto usa la financiación oficial publicada por PSA el 2 de noviembre de 2026.
- Cada tarjeta muestra únicamente sus cuotas reales, sin completar opciones genéricas.
- Al elegir una entidad se informa el beneficio, las tarjetas admitidas, el canal de pago y su vigencia.
- Los presupuestos PDF conservan el detalle de las cuotas y ahora agregan beneficio, canal, vigencia y condiciones importantes.
- Se incorpora Banco Provincia, que faltaba en APPI.

## Cambios principales

- Naranja X: 6, 9, 12 y 18 cuotas, además de Plan Z.
- Macro: suma 24 cuotas.
- Galicia: 3, 6, 9 y 12 cuotas más 10% de reintegro sin tope.
- Banco Provincia: 3, 6, 9, 12 y 15 cuotas; o 18 cuotas más 10% sin tope.
- BBVA, Santander y American Express: 3, 6, 9 y 12 cuotas.
- Hipotecario: 9 y 12 cuotas.
- Cabal/Credicoop: 3, 6, 9 y 12 cuotas con reintegro, o 18 sin descuento.
- Patagonia 365, Tuya, Data, Banco del Sol y Tarjeta Sol conservan sus planes particulares publicados.

## Actualización segura

- El importador queda ligado a la edición exacta del PDF y las piezas oficiales verificadas.
- Se elimina el reemplazo incorrecto que asignaba 3, 6, 9, 12, 15 y 18 cuotas a cualquier entidad cuyo legal no repitiera el plan.
- Si PSA publica una edición nueva que no se puede interpretar de forma completa, APPI conserva la última tabla verificada en lugar de inventar cuotas.

## Integración

- Base pública: `9eebf70255e0ffeff866d3a825835d08057c5b59`.
- Fuente: `https://tienda.psa.com.ar/promociones_vigentes`.
- No se realizó push desde el agente.

## Versión

- Versión: `891.0.0`
- Caché: `appi-v891-financiacion-tarjetas`
