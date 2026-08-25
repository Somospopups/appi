# APPI v339 — El equipo se muestra con su nombre lindo

## Qué cambia

La planilla trae el equipo con códigos cortos (por ejemplo `SEN4BLAC`) y la
app lo mostraba tal cual. Ahora hay un traductor de códigos a nombre completo:

| Código en la planilla | Se muestra como |
|-----------------------|------------------|
| SEN4BLAC / SEN4BLACK / SEN4NEGRO | Senior 4 Black |
| SEN4 / SENIOR4 / SENIOR 4 / PSA SENIOR 4 | Senior 4 |
| PSA VERO / VERO | Vero |
| SODA BURBY / BURBY | Soda Burby |
| PSA | PSA |

- Si aparece un código que no está en la tabla, se muestra como título
  (primera letra de cada palabra en mayúscula, "PSA" se mantiene).
- La búsqueda de Usuarios también entiende el nombre lindo (buscar "senior"
  encuentra "SEN4BLAC").

## Dónde se aplica

- Ficha del carrusel de Acciones del día (📦).
- Ficha del cliente en Usuarios (📦).
- Detalle de Reactivación.
- Comodín `{producto}` de los mensajes.

## Versionado

- `package.json` 339.0.0 · visible `v339` · caché `appi-v339-nombre-de-equipo`.

## Pruebas

- `producto-nombre.spec.js` (nuevo): 15 casos de `nombreProducto`.
- `mensajes-usuarios.spec.js` actualizado al nombre lindo.
