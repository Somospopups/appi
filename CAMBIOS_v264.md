# APPI v264 · Histórico: Centro de Acción

APPI v264 convierte las recomendaciones de **Próximas acciones** del Histórico en un flujo de trabajo semanal, individual y local-first. El álbum anual de doce meses incorporado en v263 se conserva completo dentro de **Mi año**.

## Centro de Acción

Antes de las alertas aparece el resumen **Qué tenés que hacer hoy**, con cuatro indicadores: acciones para hoy o vencidas, planes activos, personas sin atender y alertas sin plan. Desde allí se puede accionar sobre la primera tarea o abrir el drawer del Centro.

El drawer se adapta a PC y celular y tiene tres vistas:

- **Hoy:** tareas del día y vencidas, ordenadas por urgencia.
- **Planes:** objetivos, avance, responsables, revisión semanal, tareas y cierre sin borrar historial.
- **Organizaciones:** avance, pendientes y planes agrupados por rama.

## Alertas y afectados

Las alertas tienen identificadores estables (`pb_drop`, `pb_growth`, `active_drop`, `active_growth`, `pending`, `consecutive`, `income_no_purchase`, `contact_incomplete`, `branch_balance`, `expired` y `monthly_control`). Mantienen prioridad, evidencia, acción sugerida y color, y ahora muestran su estado y progreso.

**Ver afectados** calcula la lista individual según cada diagnóstico y muestra DIP, categoría, PB anterior y actual, diferencia y teléfono. Los teléfonos se cruzan con Línea Descendente, Ingresos y Panel de Contactos por DIP, teléfono normalizado o nombre normalizado. Las personas sin teléfono quedan visibles en el diagnóstico, pero se excluyen del plan activo y se informa su cantidad.

## Planes y agenda semanal

Antes de guardar siempre se muestra una vista previa. Se puede elegir trabajar persona por persona, por rama principal o por la organización descendente de un líder. También son editables:

- organización incluida;
- objetivo de contactos;
- PB sugeridos a recuperar;
- responsable (titular, socio/a o líder de cada organización);
- fecha de revisión semanal.

Las tareas se distribuyen automáticamente durante los próximos siete días. Cada una conserva persona, DIP, categoría, rama, teléfono, contacto relacionado, valores de PB, responsable, fecha, resultado, notas e historial.

## Ejecución y resultados

Cada tarea prepara un guion individual, cercano y empático. El texto se puede revisar y editar antes de abrir WhatsApp; APPI nunca envía mensajes automáticamente. También se puede llamar o registrar uno de estos resultados:

- Sin respuesta
- Contactada
- Conversación pendiente
- Objetivo acordado
- Reactivada
- No desea seguimiento
- Derivada

“Sin respuesta” agenda otro intento en dos días. “Conversación pendiente” y “Objetivo acordado” programan una revisión en siete días. Los cierres de tarea no eliminan notas ni historial.

## Integración con Panel de Contactos

`gestion-client.js` expone `APPIGestion.programarDesdeHistorico(contactId, action)`. La API:

- busca por id, DIP, teléfono o nombre;
- importa sin duplicar a quien todavía no está en Mi Gestión;
- usa interés **Negocio** y estado **Seguimiento**;
- guarda próxima fecha y metadata del plan;
- agrega historial y actividades (`historico_accion`, `historico_plan_actualizado`, `whatsapp_abierto` y `llamada_iniciada`);
- trabaja offline mediante la cola existente y actualiza la vista de Mi Gestión.

## Nuevos cierres, persistencia y sincronización

`reconcileActionPlans` recalcula los planes activos cuando se guarda un cierre:

- actualiza PB y diferencias;
- suma afectados nuevos dentro del alcance;
- marca reactivaciones automáticas en planes de inactividad;
- evita duplicar tareas ya existentes;
- conserva resultados, notas, fechas e historial;
- actualiza períodos de origen y último cierre usado.

Los planes usan una clave de `localStorage` separada por usuario y por titular/socio. Además se copian a `_actionPlans` en el cierre más reciente. Cada cambio marca el cierre como pendiente, lo persiste en IndexedDB y queda disponible para la sincronización ya existente con Supabase. Al cargar, APPI compara las copias local y sincronizada y elige la más reciente por `updatedAt`.

## Recordatorios

El Centro cuenta las tareas para hoy o vencidas. Si el permiso de notificaciones ya estaba concedido, `notifyActionDueOnce` emite como máximo un aviso diario con el texto “Tenés N acciones para hoy o vencidas”. No solicita permisos de manera agresiva. Las próximas fechas también se copian al Panel de Contactos para aprovechar sus recordatorios.

## App Shell y caché v264

- Versión del paquete: `264.0.0`
- Versión visible y registro del Service Worker: `v264`
- Caché: `appi-v264-centro-accion`
- `historico.js` y `historico.css` continúan embebidos exactamente una vez en `index.html` y sincronizados con sus archivos fuente.
