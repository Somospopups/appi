# APPI v157 — Histórico unificado y Org. Líder

## Org. Líder corregida

El Resumen de acumulación ahora también utiliza la categoría informada en el encabezado del titular.

Esto corrige el caso en el que:

- El titular es Líder.
- El titular no aparece como una persona dentro de su propia Línea Descendente.
- No había ninguna otra persona categoría L en el padrón.
- La fila Org. Líder quedaba oculta.

Nueva regla:

- Si el titular es Líder, Org. Líder aparece aunque no exista otra persona L en la tabla.
- La organización del titular utiliza el PB completo del reporte.
- Si existen otras personas L, también se incorporan sus organizaciones completas.
- La misma detección funciona con las categorías del titular DJ, D, DC, CE, LE, EJ y E.
- Se reconocen nombres completos como “Líder de Equipo” y no solamente la sigla L.

Al abrir Org. Líder se muestra la organización del titular con nombre, DIP, categoría y PB organizacional.

## Navegación simplificada

Histórico tiene ahora solamente dos secciones visibles:

1. **Resumen y análisis**.
2. **Cargar y administrar**.

Se eliminaron de la navegación:

- Analizar como pantalla independiente.
- Meses como pantalla independiente.
- Nube.

También se retiraron del usuario:

- La barra de estado de sincronización.
- El botón Sincronizar.
- Las etiquetas Local/Nube dentro de los cierres.

La sincronización automática puede seguir funcionando internamente cuando está configurada, pero ya no ocupa espacio ni requiere interacción del usuario.

## Resumen y análisis unificados

Se eliminó completamente el bloque **Resumen fácil**.

La pantalla unificada contiene:

- Último cierre.
- Atención requerida.
- Resumen Anual.
- Evolución anual de PB.
- Evolución anual de Ingresos.
- Selector de períodos para comparar.
- Indicadores comparativos de PB, actividad, personas, ingresos y pendientes.
- Evolución de actividad.
- Evolución de garantías pendientes.
- Evolución por categoría.
- Cambios individuales con buscador.
- Próximas acciones.
- Generación del informe completo en PDF.

El botón Comparar períodos desplaza directamente hasta el análisis dentro de la misma pantalla.

## Cargar y administrar unificados

La misma pantalla reúne:

- Los doce casilleros mensuales.
- Carga de Línea Descendente.
- Carga de Garantías por Organización.
- Carga de Ingresos.
- Guardado y actualización de cierres.
- Meses guardados.
- Descarga de archivos originales.
- ZIP mensual.
- Eliminación de cierres.
- Backup completo.
- Restauración del backup.

## Informe completo mensual

El detalle de cada mes fue rediseñado para ocupar una sola hoja A4 horizontal.

Cada página mensual incluye:

- Cinco indicadores principales.
- PB organizacional por categoría.
- Top 10 vendedores.
- Top 10 organizaciones.
- Ingresos del mes.
- Pases y Bonus.

Las tablas utilizan altura y tipografía dinámicas. Si existe una cantidad excepcional de filas que no puede leerse correctamente en el espacio disponible, se informa cuántos registros adicionales pueden consultarse dentro de APPI, sin generar una segunda hoja para ese mes.

## Validación integral

Se probaron siete cierres con treinta ingresos por mes:

- Solo dos pestañas visibles.
- Nube y Sincronizar no aparecen.
- Resumen fácil no aparece.
- Resumen y análisis comparten pantalla.
- Carga y administración comparten pantalla.
- Doce tarjetas mensuales visibles.
- Biblioteca de cierres y backup visibles en la misma sección.
- Titular real detectado como Líder.
- Org. Líder visible en el Resumen de acumulación.
- Org. Líder del titular: 1.262,8 PB en el cierre probado.
- Detalle con nombre y DIP del titular.
- Informe completo: 11 páginas para siete meses.
- Exactamente siete páginas de detalle mensual.
- Ningún mes genera una segunda hoja.
- Cero errores del navegador.

## Versión técnica

- Caché: `appi-v157-historico-unificado`.
- Pie visible: **APPI · v157 · Histórico unificado**.
