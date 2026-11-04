# APPI v903 · Hotfix urgente de precios PSA

## Fuente auditada

- Documento: `Lista de Precios Sugeridos`.
- Vigencia indicada: promoción desde el 1 hasta el 4 de noviembre de 2026.
- Extensión revisada: 7 páginas, 354 líneas de precio, incluidas 31 líneas de Plan Canje.

## Correcciones

- Se corrigen 25 precios finales de Plan Canje que debían recibir un 10% adicional durante la vigencia.
- La promoción ahora distingue entre:
  - descuentos aplicables al precio normal y al Plan Canje;
  - descuentos aplicables únicamente al Plan Canje.
- Se corrige el inicio de vigencia del 2 al **1 de noviembre**.
- La promoción vence automáticamente después del 4 de noviembre.
- Senior 4 Terra deja de recibir una rebaja que no figura en el PDF auditado.

## Productos recuperados

Se vuelven a mostrar productos normales que una marca promocional antigua ocultaba:

- PSA Senik BM Bianco.
- PSA Senik SM Bianco.
- PSA Soda Burby Bianco.
- PSA Soda Burby Terra.

También se conserva la línea oficial `PROMO CILINDRO + PACK RENDIMIENTO II` a $116.000, mientras los combos que no aparecen en el PDF continúan excluidos.

## Productos incorporados

- PSA UV LED — $285.000.
- Repuesto N.º 1 Sedimentos PSA Rotech UV — $101.100.
- Repuesto N.º 2 Carbón Bloque PSA Rotech UV — $56.800.
- Repuesto N.º 3 Membrana PSA Rotech UV — $164.300.
- Repuesto N.º 4 Post Membrana PSA Rotech UV — $57.800.
- Instalación Rotech — $175.500.

## Prevención

- El actualizador automático conserva la marca de pertenencia a la lista oficial.
- El actualizador elimina marcas promocionales vencidas de productos normales.
- La validación automática de la tienda sólo compara promociones del precio normal; los beneficios exclusivos de Plan Canje se controlan contra la lista oficial.
- Las pruebas verifican importes anteriores, porcentaje, precio final, modalidad, vencimiento y contenido del presupuesto PDF.

## Verificación final

- Las 354 líneas del PDF fueron comparadas contra APPI.
- Resultado: 0 faltantes, 0 ocultas, 0 diferencias de precio base y 0 diferencias de precio final.
- Pruebas E2E finales: 7/7 de campaña y 16/16 de regresión focalizada.
- Sintaxis JavaScript, compilación del actualizador Python y `git diff --check`: correctos.

## Versión

- Aplicación: `903.0.0`
- Versión visible: **v903 · Segura**
- Caché: `appi-v903-precios-verificados`
