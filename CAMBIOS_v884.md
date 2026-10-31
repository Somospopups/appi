# APPI v884 · Scroll inmediato en listas grandes de Usuarios

## Qué cambia

- La colección completa de Usuarios permanece en memoria, pero el navegador sólo crea las fichas cercanas a la pantalla.
- Un margen preventivo de al menos 1.500 px prepara las personas anteriores y siguientes antes de que entren en la pantalla.
- La lista mantiene su altura completa y la posición natural del desplazamiento: no hay páginas, botón “Cargar más” ni saltos artificiales.
- El desplazamiento se detecta tanto cuando lo administra la ventana como cuando lo administra el cuerpo de la aplicación, para funcionar igual en computadora y teléfono.

## Fichas y funciones conservadas

- Al desplegar una persona se crean bajo demanda sus datos de contacto, todos los productos, fechas de compra y vencimiento, historial y acciones.
- Las fichas abiertas conservan su estado aunque salgan momentáneamente de la ventana visible.
- La altura variable de una ficha desplegada se mide automáticamente para que nunca se superponga con la siguiente.
- Búsqueda, filtros, estadísticas, zonas, tarjetas, cumpleaños, reasignados, Usuarios estrella, revisión de coincidencias y mensajes siguen trabajando sobre la colección completa.
- Se conserva sin cambios el diseño aprobado en v883.

## Prueba de volumen

- La regresión automática usa 1.500 garantías distintas.
- Exige conservar las 1.500 personas en memoria y mantener menos de 120 cabeceras simultáneas en el DOM.
- Recorre cuatro zonas alejadas de la lista y comprueba que nunca quede un hueco visible ni una espera de un segundo.
- También verifica detalle bajo demanda, seis acciones, persistencia de la ficha desplegada y las reglas de identidad segura.
- Mediciones finales del entorno de prueba: Home disponible entre 1,3 y 1,6 segundos, entrada a Usuarios por debajo de 0,9 segundos y salto más lento de scroll alrededor de 0,14 segundos.
- La inspección de escritorio y teléfono no detectó solapamientos ni ciclos de `ResizeObserver`.
