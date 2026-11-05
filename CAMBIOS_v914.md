# APPI v914 · CyberWeek y vencimiento automático de financiación

## Promociones de producto

- Vigencia CyberWeek: **5 al 8 de noviembre de 2026**.
- PSA Iontrix 3: **25% OFF** sobre precio normal y Plan Canje.
- PSA Senior4 Bianco, Nero, BM, Grigio y Terra: **10% OFF** sobre precio normal y Plan Canje.
- Los demás productos con precio de Plan Canje habilitado: **10% OFF** sobre esa modalidad.
- Las reglas específicas tienen prioridad y los descuentos no se acumulan.
- La promoción histórica de Vero 45% conserva su cierre del 4/11 y no se extiende.
- Los precios del catálogo no se modificaron: las rebajas viven en `psa-beneficios.json` y dejan de aplicarse automáticamente el 9/11.

## Financiación

La pantalla y el presupuesto muestran solamente los planes vigentes para la fecha argentina:

- Naranja X y Macro: hasta el 8/11.
- Galicia: hasta el 10/11.
- Banco Provincia, American Express, BBVA, Cuota Simple, Banco Nación, Santander e Hipotecario: hasta el 11/11.
- Credicoop/Cabal: desde el 5 hasta el 11/11, con 3, 6, 9, 12 y 18 cuotas; sin 15 cuotas ni reintegro.

Una selección guardada que ya venció vuelve de manera segura a contado. Los reintegros de Galicia y Banco Provincia se informan como condición del banco, pero nunca se restan del total.

## Presupuesto y PDF

- Cada línea promocionada muestra precio anterior, porcentaje, modalidad y precio final.
- El PDF identifica dinámicamente CyberMonday o CyberWeek según la fecha de la línea.
- El plan elegido repite entidad, tarjetas, cuotas, canal, vigencia, beneficio y condiciones.

## Archivos principales

- `psa-beneficios.json`
- `psa-planes.json`
- `lista-precios.js`
- `scripts/actualizar-precios-psa.py`
- `scripts/planes-psa-verificados.json`
- `tests/e2e/cyberweek.spec.js`
- `tests/e2e/lista-precios-financiacion.spec.js`

## Validación

- Suite focalizada de promociones, financiación, presupuesto y caché: **31/31**.
- Regresión final de CyberWeek y financiación después del descarte persistente de planes vencidos: **9/9**.
- Suite completa en dos tramos: **672 aprobadas, 8 fallos preexistentes y 1 omitida** sobre 681 pruebas.
- Los ocho fallos ajenos a v914 se reprodujeron sobre la base v913; uno de ellos (`auth.spec.js`) es intermitente.

## Versión

- `version`: **914.0.0**
- Pie: **APPI · v914 · Segura**
- Caché: `appi-v914-cyberweek`
