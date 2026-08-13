# APPI v154 — Archivos de Ingresos sin personas

## Corrección

Un reporte de Ingresos sin personas ahora se considera un archivo válido.

Al cargarlo:

- Se muestra el check verde.
- El archivo cuenta dentro del indicador `3/3`.
- El mes queda habilitado para guardar.
- La tarjeta informa **Recibido · No hubo ingresos**.
- El archivo original se conserva igual que los demás.
- El cierre mensual registra exactamente 0 ingresos.

## Información y detalle

Cuando el cierre no tuvo ingresos:

- El resumen muestra `0 ingresos`.
- Ingresos por patrocinante muestra **No hubo ingresos**.
- Al abrir el indicador se informa **No hubo ingresos en este cierre**.
- El Resumen Anual registra cero en las filas correspondientes.

## Compatibilidad

Se aceptan como válidos:

- Reportes con la tabla y sus encabezados, pero sin filas de personas.
- Reportes vacíos que informan explícitamente `Total de 0 incorporaciones` o `Total de 0 ingresos`.
- Reportes que indican expresamente que no se encontraron o registraron ingresos.

Un archivo que no pueda reconocerse como reporte de Ingresos continúa mostrando error para evitar aceptar documentos equivocados.

## Validación integral

Prueba de julio de 2026:

- Línea Descendente recibida.
- Garantías por Organización recibida.
- Reporte de Ingresos con encabezados y 0 personas recibido.
- Resultado previo al guardado: `3/3`.
- Botón Guardar mes habilitado.
- Cierre guardado correctamente.
- Archivo persistido con check verde.
- Dashboard: `0 ingresos`.
- Detalle: `No hubo ingresos en este cierre`.
- También se probó un reporte explícitamente vacío sin tabla de personas.
- Cero errores del navegador.

## Versión técnica

- Caché: `appi-v154-ingresos-vacios-validos`.
- Pie visible: **APPI · v154 · Ingresos vacíos válidos**.
