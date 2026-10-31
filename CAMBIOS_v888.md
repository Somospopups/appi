# APPI v888 · Histórico visible y reintento inmediato

## Problema corregido

Cuando Histórico no conseguía crear el primer cierre, la pantalla podía quedar sin datos y sin explicar la causa. Si tres consultas fallaban, el siguiente intento automático quedaba bloqueado durante tres horas. Además, un error independiente de sincronización con la nube podía interrumpir el inicio de la recuperación desde MI PSA.

## Solución

- La pantalla sin cierres muestra el motivo exacto informado por la recuperación.
- El botón **Reintentar ahora** ignora la espera automática y consulta MI PSA inmediatamente.
- El botón **Verificar datos de MI PSA** abre el formulario existente con Centro, Número y Clave editables.
- La falta de conexión y la falta de credenciales también se explican directamente en Histórico.
- Los errores de nube quedan aislados y no impiden iniciar la descarga desde PSA.
- Los PDF anuales ya archivados siguen disponibles aunque todavía no haya cierres activos.
- Se mantienen la recuperación automática, los índices directos 69, 34 y 71, las validaciones, los informes, las comparaciones y el diseño aprobado.

## Validación

- Pruebas nuevas para falta de credenciales, motivo visible y reintento inmediato.
- Regresión focalizada de cálculos, guardado, recuperación automática, PDFs, integridad de nube, diseño y Centro de Acción.
- Código fuente y copias embebidas de Histórico sincronizados.
- `git diff --check` sin errores.

## Versión

- Versión: `888.0.0`
- Caché: `appi-v888-historico-visible-y-reintento`
- Base: `e916e515c833bc62d96b5c76aaf38844648d22bf`
