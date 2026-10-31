# APPI v887 · Scroll siempre fluido en Usuarios

## Qué se corrigió

- La lista virtual ya no vuelve a crear todas las fichas cercanas cada vez que el desplazamiento avanza apenas un renglón.
- Las fichas visibles se mantienen como los mismos elementos mientras la persona desplaza la pantalla.
- Las siguientes fichas se preparan con varias pantallas de anticipación.
- La ventana avanza por bloques estables y sólo agrega o retira las fichas que realmente entran o salen de la zona preparada.
- Se elimina el destello o la demora visual provocada por reemplazar repetidamente toda la ventana.

## Apariencia y funciones conservadas

- El diseño aprobado de v886 no cambia: cantidad a la izquierda, nombre en el centro y estado con vencimiento a la derecha.
- Se conservan los estados VENCIDO, POR VENCER y VIGENTE con sus colores rojo, ámbar y verde.
- Todo el renglón continúa siendo tocable.
- Se mantienen productos, historial, acciones, búsqueda, filtros, contadores, agrupación, Usuarios estrella, reasignados y demás funciones.

## Verificación focalizada

- La prueba de volumen utiliza 1.500 garantías y mantiene menos de 120 fichas en el navegador.
- Los saltos rápidos no dejan huecos y permanecen por debajo del límite de un segundo.
- Durante un desplazamiento continuo de 1.728 píxeles se conserva exactamente el mismo nodo visible.
- En ese recorrido sólo se producen 48 movimientos de nodos, correspondientes a un único bloque; antes se reemplazaba repetidamente toda la ventana.
- Las fichas agregadas durante el desplazamiento conservan la apertura de productos y acciones.
