# APPI v228 · Mi carrera

La carrera empresarial oficial del negocio, en primera persona y en el inicio.

## Cambios

- **Tarjeta "Mi carrera" en el inicio:** muestra la categoría oficial del
  distribuidor (Distribuidor Junior → Distribuidor → Calificado → Coordinador
  de Equipo → Líder → Líder Ejecutivo → Ejecutivo → Empresa) tal como viene
  en la Línea Descendente de Mi Equipo.
- **Próximo pase con las reglas reales del Flex:** barras de progreso con los
  volúmenes (A) personal, (B) organizaciones de DJ y (C) organizaciones de D,
  calculados sobre el árbol de Mi Equipo igual que en el material oficial
  (la organización de una D suma su línea completa).
- **Checklist humana:** lo que la base no puede medir (Capacitación Básica,
  corazones, carta de intención) se marca a mano y queda guardado en el
  dispositivo.
- **Carrera completa y ganancias de referencia** plegadas en la tarjeta, con
  los valores del material oficial y la aclaración de que pueden variar.
- Sin Línea Descendente cargada, la tarjeta no aparece: no se inventa nada.

## Lo que NO hace (a propósito)

- No agrega tablas ni migraciones: todo se calcula con datos que la app ya
  tiene.
- No inventa categorías ni precios: usa los nombres y requisitos oficiales.
- Para categorías Coordinator hacia arriba muestra volúmenes de referencia
  hasta terminar de validar los requisitos exactos con el material completo.

## Respaldo

Antes de este cambio se crearon la etiqueta `respaldo-v226-pre-carrera` y la
rama `backup/v226-pre-carrera`.

## Pruebas

59 en verde, con cuatro nuevas: volúmenes A/B/C fieles al Flex (incluida la
organización de D que suma su línea), tarjeta con el pase y las barras,
checklist que sobrevive un refresco, y ausencia de tarjeta sin Línea.
