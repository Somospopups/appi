# APPI v343 — Una sola reunión en el anuncio del administrador

## Qué cambia

En el panel administrador, la sección "Reuniones para agendar (opcional)"
tenía tres reuniones. A pedido del equipo queda **una sola**: se quitan la
Reunión 2 y la Reunión 3, y el formulario deja cargar únicamente una reunión
con su título, fecha, hora y lugar.

El cartel que ven los distribuidores no cambia: la reunión sigue con sus dos
botones (agendar en APPI o en la agenda del teléfono). El backend sigue
aceptando la reunión sin cambios (el límite máximo sigue siendo más amplio,
pero el panel solo envía una).

## Versionado

- `package.json` 343.0.0 · visible `v343` · caché `appi-v343-una-reunion`.

## Pruebas

- `anuncios.spec.js`: el cableado ahora exige una sola reunión (Ev0) y que
  Ev1/Ev2 ya no existan, con `ANUNCIO_EVENTOS=1`.
