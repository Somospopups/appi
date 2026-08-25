# APPI v352 — Progreso persistente en Acciones del día

## Qué cambia

La tarjeta de **Acciones del día** ahora distingue entre el historial de una
jornada y el progreso real de cada acción:

- Una acción marcada con **✓ Ya lo hice** queda guardada como completada.
- Enviar el mensaje por WhatsApp también resuelve esa acción, como antes.
- Si la aplicación se abre al día siguiente, una acción ya hecha no vuelve a
  aparecer.
- Una acción marcada con **✗ No se hizo** queda registrada en el día, pero
  vuelve a aparecer al día siguiente mientras siga pendiente.
- El progreso se vincula al ciclo correspondiente: un nuevo mantenimiento, un
  nuevo cumpleaños o una nueva fecha de garantía puede generar una acción
  nueva.
- Las marcas `✓` históricas de versiones anteriores se respetan, por lo que
  no se pierde el progreso ya guardado.

Durante el día, las acciones resueltas siguen visibles en la tarjeta con su
`✓` para mostrar el progreso. Al cambiar la fecha dejan de formar parte de la
agenda pendiente.

## Fecha visible

La tarjeta muestra la fecha exacta de la agenda, por ejemplo:

> 📅 25/08/2026

Así se puede distinguir la lista de hoy de la del día anterior.

## Datos y sincronización

El nuevo mapa `completadas` vive dentro de `appi_acciones_v1_<usuario>`, que ya
forma parte de `data-sync`. Se conserva la separación entre titular y socio,
la copia local, la cola offline y la sincronización con Supabase.

## Pruebas

- Una acción completada no reaparece al día siguiente.
- Las marcas históricas de v292-v351 se siguen respetando.
- La fecha de la agenda aparece en la tarjeta.
- Se conserva el comportamiento de `✗`, que vuelve a entrar si la acción sigue
  pendiente.

## Versionado

- `package.json` 352.0.0 · visible `v352` · caché `appi-v352-progreso-acciones`.
