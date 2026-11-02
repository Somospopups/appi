# APPI v889 · Rankings mensuales en Histórico

## Resultado visible

- Histórico incorpora el acceso **Rankings del cierre** para el mes seleccionado.
- La pantalla reproduce la tarjeta **Ranking de Ventas** de Mi negocio.
- Permite alternar entre:
  - **Personal:** Top 10 por PB personal del cierre.
  - **Organización:** Top 10 por PB total de la organización de cada persona.
- Los valores se calculan únicamente con la Línea Descendente guardada para ese período.
- Octubre de 2026 queda separado del ranking vigente de noviembre.
- Los puestos conservan los colores, las categorías y el formato de PB de la tarjeta original.
- El resumen de Histórico sigue sin mostrar distribuidores: los nombres aparecen sólo al abrir el ranking.

## Recuperación de cierres

- Se incluyen también las mejoras preparadas en v888: estado visible cuando no hay datos, reintento inmediato, edición de datos MI PSA y recuperación independiente de la nube.
- Los cierres continúan recuperándose automáticamente mediante los informes PSA 69, 34 y 71.
- Si se toca **Reintentar ahora** mientras una recuperación automática está terminando, APPI espera esa operación y ejecuta el reintento solicitado en lugar de ignorarlo.
- Los datos de rankings no requieren un informe nuevo: se reconstruyen desde la Línea Descendente del cierre.

## Integración

- Base pública al comenzar: `cb5da37433800c017d7309a5e230ca0777f27ccb`.
- El paquete conserva la actualización pública más reciente de precios.
- Incluye la actualización v888 que todavía no estaba publicada sobre la base pública.
- No se realizó push desde el agente.

## Versión

- Versión: `889.0.0`
- Caché: `appi-v889-rankings-historicos`
