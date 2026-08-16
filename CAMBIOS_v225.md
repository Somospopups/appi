# APPI v225 · Diálogos propios

Ninguna pantalla de APPI muestra ya las ventanitas feas del navegador:
todo pasa por `APPIDialog`, con título e ícono propios.

## Cambios

- **Se fueron los `alert()` nativos** que quedaban en `index.html` (carga y
  exportación de Excel de Usuarios, mapas y vecinos, exportar CSV, nota sin
  contenido) y en `historico.js` (respaldo del modal de ayuda). Ahora cada
  aviso abre el diálogo de APPI con su título y su ícono, y los mensajes de
  error de Excel se leen completos con sus tips.
- **Revisar contactos** (`revisar-contactos.html`): si el dispositivo no deja
  copiar el resumen solo, ya no aparece un `prompt()` nativo: el resumen se
  muestra en un cuadro de texto quedado seleccionado, listo para copiar a mano.
- **Base de datos sana:** la migración de Mi Gente (`SUPABASE_MI_GENTE.sql`)
  ahora borra los checks viejos de `tipo` y `estado` antes de crear los
  ampliados. Antes los buscaba con un patrón `ilike '%...%in%'` que nunca
  podía encontrarlos, porque Postgres guarda `in (...)` como
  `= ANY (ARRAY[...])`: en bases ya instaladas quedaban los checks apilados y
  **Agregar contacto** fallaba con jerga cruda de la base al querer guardar
  `tipo='contacto'`.
- La función de importar contactos acepta también los estados con guion bajo
  (`no_contactado`, `mas_adelante`, …), no solo las etiquetas con espacio que
  venían de Contactos.
- **README al día:** versión v225, Panel de Contactos ubicado en Mi negocio,
  y los pasos de backend incluyen `SUPABASE_MI_GENTE.sql` y el hotfix
  `ARREGLO_CHECKS_PANEL_CONTACTOS.sql` para bases migradas antes de v223.

## Pruebas

53 en verde, con una nueva que recorre todos los archivos de la app y falla si
aparece un `alert(`, `confirm(` o `prompt(` nativo (los usos de `APPIDialog`
no cuentan). Validada por mutación: agregando un `alert()` de prueba en
`index.html`, la suite falló señalando la línea exacta.
