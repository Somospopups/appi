# APPI v886 · Renglones simples en Usuarios

## Diseño aprobado: opción 2

- Cada renglón muestra únicamente cuatro datos: cantidad total de productos, nombre y apellido, estado del producto más reciente y fecha de vencimiento.
- La cantidad queda destacada en un bloque grande a la izquierda.
- El nombre ocupa el centro del renglón.
- El estado y la fecha quedan alineados a la derecha.
- Los estados se muestran completos y por color: **VENCIDO** en rojo, **POR VENCER** en ámbar y **VIGENTE** en verde.

## Funciones conservadas

- El renglón completo sigue siendo tocable y permite abrir todos los productos, las fechas de compra y vencimiento, el historial y las acciones.
- Los datos de contacto, la reasignación y demás información continúan disponibles dentro del detalle, sin sumar información al renglón cerrado.
- Se mantienen la agrupación por persona, los productos repetidos con distinta serie, la búsqueda, los filtros, los contadores, Usuarios estrella, la virtualización y el rendimiento con listas grandes.

## Verificación

- Se agregaron comprobaciones para las tres variantes de estado y para asegurar que el renglón no vuelva a mostrar localidad, modelo, flecha ni distintivos adicionales.
- Se ajustaron las pruebas de reasignados al nuevo renglón, manteniendo intacto su filtro y su detalle.
- Se verificó visualmente el diseño en pantalla móvil y se mantuvo la apertura del detalle desde cualquier parte del renglón.
