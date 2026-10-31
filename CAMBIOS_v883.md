# APPI v883 · Recuperación de velocidad en Usuarios

## Corrección urgente

- Se eliminó la comparación de cada persona contra toda la base, que hacía crecer el tiempo de inicio de forma desproporcionada.
- La identidad segura usa ahora índices por nombre, teléfono, correo, cumpleaños y domicilio para revisar únicamente candidatos posibles.
- Las coincidencias dudosas también se localizan mediante índices, sin recorrer todas las combinaciones de usuarios.
- Los datos de Usuarios siguen disponibles para estadísticas, mensajes y acciones, pero el Home ya no construye miles de fichas invisibles.
- Al entrar a Usuarios se crean sólo las cabeceras. El historial completo, los productos y las acciones se dibujan cuando se despliega cada persona.
- La lista de contactos depurados se lee una sola vez por carga en lugar de consultar el almacenamiento por cada garantía.

## Comportamiento conservado

- Se mantienen la unificación segura, la revisión manual y las decisiones guardadas.
- Continúan contando las compras repetidas del mismo modelo cuando tienen series diferentes.
- La repetición de la misma serie se deduplica.
- Usuarios estrella, filtros, zonas, tarjetas, mensajes, cumpleaños, reasignados y Plan Canje conservan el comportamiento de v882.
- No se modifica ni elimina información guardada.

## Prueba de volumen

- Se agregó una prueba automática con 1.500 garantías distintas.
- La prueba exige que el Home no cree las fichas invisibles, que Usuarios conserve las 1.500 personas y que el detalle aparezca al desplegar una ficha.
- En el entorno de prueba, Home quedó disponible en alrededor de 1,3 segundos y la apertura completa de 1.500 cabeceras tardó alrededor de 3 segundos, frente a los aproximadamente 30 segundos de v882.
rga del Home bajó de aproximadamente 30 segundos en v882 a alrededor de 1,5 segundos en v883.
