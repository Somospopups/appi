# APPI v913 · Jornada garantizada de 10 tareas útiles

## Qué se corrigió

La jornada podía quedar vacía si se calculaba antes de que MI PSA terminara de cargar y, cuando había pocos clientes elegibles, mostraba solamente 2, 3, 4 o 5 tareas. También podía conservar un cálculo viejo después de cambiar la fecha.

La v913 aplica una sola regla visible y verificable: **cada jornada tiene exactamente 10 tareas útiles, sin inventar ni repetir contactos**.

## Cómo funciona ahora

1. APPI elige primero hasta 10 personas realmente elegibles, respetando la prioridad de cumpleaños, garantía, mantenimiento, canje y seguimiento.
2. Cada asignación queda registrada aunque la tarea siga pendiente. Al día siguiente avanza la cola y toma otras personas antes de repetir.
3. Si faltan clientes, completa los lugares con acciones comerciales concretas tomadas de un catálogo rotativo de 20 opciones.
4. La lista elegida y el relleno comercial quedan guardados por fecha. Recargar no cambia la jornada.
5. Al cambiar de fecha o al terminar de cargar MI PSA, la memoria se invalida y vuelve a calcular con la información correcta.

## Estabilidad y sincronización

- `dias[fecha].lista` guarda las personas elegidas.
- `dias[fecha].relleno` guarda las acciones comerciales.
- `asignadas` conserva la cola de rotación por motivo y ciclo.
- El merge de cuenta conserva marcas, resultados, lista, relleno y asignaciones.
- Si dos dispositivos armaron listas antes de sincronizar, la combinación converge de forma determinística para titular y socio.

## Interfaz

- La franja de Usuarios muestra siempre el progreso sobre 10 e informa cuántas tareas son con usuarios y cuántas son comerciales.
- La tarjeta del inicio muestra las 10 filas mixtas en una sola lista.
- Una jornada sólo se considera ganada cuando están hechas sus 10 tareas.
- Campus PSA mantiene su cupo base de 10 y su bonus existente de hasta 3 tareas.

## Pruebas

Suite focalizada con navegador Chromium: **64/64 en verde**.

Incluye regresiones para:

- carga tardía de MI PSA (`0 → 10` sin intervención manual);
- combinación de 3 clientes + 7 acciones comerciales;
- dos jornadas consecutivas con 10 usuarios diferentes;
- agotamiento de la cola sin forzar repetidos;
- persistencia al reconstruir la tarjeta;
- marcas ✓ y ✗ dentro del total de 10;
- cupo y bonus de Campus PSA;
- combinación determinística entre dispositivos.

Pruebas Node adicionales:

- `acciones-cuenta.node.js`: OK;
- `jornada-memo.node.js`: OK;
- sintaxis de `mensajes-usuarios.js`, `home-tarjetas.js` y `data-sync.js`: OK.

## Versión

- `version`: **913.0.0**
- Pie: **APPI · v913 · Segura**
- Caché: `appi-v913-jornada-10`
