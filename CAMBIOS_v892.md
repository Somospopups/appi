# APPI v892 · Beneficios CyberMonday PSA

## Campaña oficial

Vigencia inclusiva: **2, 3 y 4 de noviembre de 2026**.

- **PSA Vero:** 45% OFF.
- **PSA Iontrix 3:** 25% OFF.
- **PSA Senior4:** 10% OFF en Bianco, Nero, Grigio, Terra y Bajo Mesada.
- Los beneficios se aplican tanto al **precio normal** como al **Plan Canje**.
- No son acumulables con otros descuentos de producto.

## Lista de precios y Presupuesto

- Los precios base permanecen intactos; la campaña vive en `psa-beneficios.json` y se calcula al mostrar y presupuestar.
- Cada botón muestra precio original tachado, porcentaje y precio final.
- El Presupuesto muestra el mismo detalle y deshabilita el descuento manual en esas líneas para evitar acumulaciones.
- Los totales, cuotas y PDF se calculan con el importe CyberMonday.
- El PDF informa producto, precio anterior, porcentaje, precio final, vigencia y condición de no acumulación.
- El 5 de noviembre la promoción deja de aplicarse automáticamente, incluso si el dispositivo está sin conexión.

## Financiación

- Se conserva sin cambios el diseño horizontal aprobado en v891 y la información detallada de las 16 entidades.
- Las cuotas y el reintegro se informan según banco/tarjeta seleccionados.
- El reintegro no se resta automáticamente del total.
- Se incorpora al repositorio `FINANCIACION_TARJETAS_APPI.md` como regla permanente.

## Protecciones

- El actualizador conserva el precio regular como precio base y usa el precio final de Tienda PSA sólo para auditar el porcentaje temporal.
- Durante la vigencia, el workflow detiene la publicación si Tienda PSA no confirma 45%, 25% y 10% en los productos principales.
- Se preservan Plan Canje, categorías, packs, orden y metadatos locales al fusionar GraphQL.
- Se añadieron pruebas focalizadas para SKU, importes Normal/Canje, no acumulación, PDF y vencimiento.

## Versión

- Versión: `892.0.0`
- Caché: `appi-v892-cybermonday-2026`
