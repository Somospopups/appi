# APPI v232 · Botones vivos

## El problema

Dos funciones nuevas (la Escalera de Sueños y la Guía de Demo) quedaron
definidas dentro de su módulo sin exponerse al alcance global, así que los
botones que las llamaban no hacían nada: el clic moría con un error silencioso
en la consola.

## Cambios

- `openSuenos()` y `openDemo()` quedan expuestas globalmente: todos los
  botones del menú, del inicio y de Los 8 Pasos funcionan.
- Nuevo test "botones vivos": recorre el inicio, Los 8 Pasos, la Escalera y la
  Guía apretando cada botón visible, y falla si alguno muere con
  "is not defined / is not a function". De ahora en más, un botón muerto no
  llega a publicarse.
- Nuevo test que verifica que cada acceso de Los 8 Pasos abra efectivamente
  su herramienta.

## Pruebas

68 en verde.
