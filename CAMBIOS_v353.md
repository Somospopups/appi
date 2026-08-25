# APPI v353 — Ajustar panel de acciones del día

## Qué cambia

- Acciones del día: al marcar con ✓ deja de ser clickeable; el resumen queda visible (`✓ 1 realizada`). La persistencia sigue usando `completadas` y la clave `appi_acciones_v1_`. Las acciones con ✗ vuelven al día siguiente mientras sigan vigentes.
- Fecha: en el panel lateral la fecha queda debajo del título (`📅 Pendiente desde: DD/MM/AAAA`, `Vence: DD/MM/AAAA`, `Cumple: DD/MM/AAAA`).
- Encabezado (`muHoy`): "Quedan X" queda en la misma línea que el nombre del motivo (`🔧 Retrolavado`) y alineado a la derecha. El panel conserva el estilo lateral.
- Cuadro verde del mensaje (`mu-prev`): desaparece el botón viejo `🔁 Cambiar mensaje`. En la esquina inferior derecha quedan dos botones redondos: `✏️` (editor) y `💬` (biblioteca completa: generales, propios, mantenimiento e instalación). El editor abre dentro de la misma pantalla. Al guardar se puede elegir "Todos los clientes" (conserva comodines `{nombre}`, `{vence}`, `{producto}`, etc.) o "Sólo esta persona".
- Depurar (`muFilaDepurar`): fila de botones `[Ya lo hice] [🧹] [No se hizo]`. `🧹` es circular, queda exactamente entre los otros dos y usa la confirmación existente (`Teléfono no corresponde`). Al confirmar: registra en `Depurados`, saca de `Usuarios`, ignora en futuras cargas (`depuradosEsUsuario`) y avanza automáticamente al siguiente contacto (`fila.i++`). Reutiliza la lógica existente (`window.depurarUsuario`).

## Versionado

- `package.json` 353.0.0 · visible `v353`.
- Clave `appi_acciones_v1_` preservada.
