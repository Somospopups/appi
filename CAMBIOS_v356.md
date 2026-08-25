# APPI v356 — CI en verde: guardar con APPIDialog, selector por equipo y versiones alineadas

## Qué cambia

- **Guardar mensajes**: el botón `Guardar` del editor deja de usar un `confirm` nativo (prohibido por convención del README y riesgoso en la PWA instalada de iOS) y pasa a `APPIDialog.confirm`, con botones `Todos los clientes` / `Sólo esta persona`. El comportamiento de fondo no cambia: "todos" guarda la plantilla con comodines; "sólo esta persona" deja el texto apenas para el cliente abierto.
- **Arreglo (bug)**: editar un **mensaje propio** y responder "Sólo esta persona" creaba un **duplicado** en la lista (creaba un mensaje nuevo en vez de editar el existente). Los propios ya son personales: ahora se guardan sin preguntar (`guardarPropia`).
- **Vuelve el selector por equipo (v342)**: en la fila de trabajo, el cuadro del mensaje recupera el botón redondo `🔁` junto a `✏️` y `💬`. Permite mandarle al cliente de la vista el mensaje de mantenimiento o instalación **de su equipo**, sin editar ni guardar plantillas (`fila.textoActual`). La función `pintarSelectorMensaje` había quedado inalcanzable desde v353.
- **Versiones alineadas (v356)**: `package.json` `356.0.0`, pie de la pantalla de acceso `APPI · v356 · Segura`, `swVersion='356'` y README `v356 · Segura`. El test de caché (`pwa-cache.spec.js`) vuelve a pasar.
- **Tests actualizados** a la UI de v353/f9b2ab3: el avance "cuántos quedan" se asserts en `.mu-fila-pos` (`1 de 2`) y la pastilla de fecha en `#muSub`; el guardado de plantillas confirma el diálogo `#appiDialogOk`.
- **Convenciones**: `mensajes-usuarios.js` entra en la lista de archivos vigilados por "nada de `alert`/`confirm`/`prompt` nativos" (`convenciones.spec.js`), donde faltaba.

## Versionado

- `package.json` 356.0.0 · visible `v356` · `swVersion='356'`.
- Sin cambios de esquema de datos: claves `appi_mensajes_*`, `appi_acciones_v1_` y `personales` se conservan igual.
