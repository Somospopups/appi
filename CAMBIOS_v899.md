# APPI v899 · Puntajes mensuales verificados

## Diagnóstico corregido

- El informe HTML de PSA expresa miles con punto: `1.234` significa 1234 PB.
- La conexión segura ya normalizaba ese dato correctamente, pero la aplicación lo volvía a interpretar como 1,234 PB al construir Mi negocio y los cierres mensuales.
- El error podía alterar el PB Personal, el PB de Organización y el orden de los puestos.

## Mi negocio

- La Línea Descendente conserva los números reales recibidos desde Excel y reconoce correctamente miles, decimales con coma o punto y espacios de agrupación.
- Ranking Personal vuelve a ordenar por el PB individual correcto.
- Ranking Organización conserva su definición: PB propio más el PB de todos los descendientes.
- Antes de reemplazar los datos locales, APPI contrasta cantidad de filas, nombres, PB individuales y total con la normalización del informe PSA.

## Histórico

- Los cierres nuevos se guardan con la versión verificada del lector de PB.
- Los cierres automáticos del año vigente y del anterior que fueron creados con el lector anterior quedan nuevamente en la cola de recuperación.
- Aunque el archivo mensual no haya cambiado, APPI lo reconstruye una vez con los valores corregidos y después lo sincroniza con la nube.
- Los rankings compartidos como imagen usan el cierre corregido, sin una fórmula paralela.

## Integridad

- Si la Línea Descendente repite un DIP, APPI no la guarda para impedir que una persona sume dos veces.
- Si el total o un PB individual no coincide con la fuente normalizada por la conexión PSA, el cierre tampoco se guarda y puede reintentarse automáticamente.
- Las planillas manuales pasan por el mismo control de DIPs repetidos.

## Pruebas focalizadas

- Miles argentinos, decimales, espacios y valores numéricos de Excel.
- Orden Personal y acumulación de Organización.
- Titular separado y jerarquía padre/hijo.
- Persistencia del cierre mensual y versión del lector.
- Rechazo de DIPs duplicados.
- Recuperación automática de cierres creados con el lector anterior.

## Integración

- Base pública confirmada antes de comenzar: `2c8106f4b2cb4eb6fc80d09534c8aab5b47f59a6`.
- No se realizó push desde el agente.

## Versión

- Versión: `899.0.0`
- Caché: `appi-v899-ranking-pb-validado`
