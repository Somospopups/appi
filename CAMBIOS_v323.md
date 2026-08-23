# APPI v323 — Nombre y apellido en las tarjetas, y el mazo no desaparece

## Qué pidió el administrador

1. Que en las tarjetas salga **nombre y apellido** de las personas,
   para entenderlo con más claridad (salía solo el apellido, a los
   gritos de la planilla: "TRONCOSO").
2. Que **hacer una acción no borre el mazo**: al tocar un renglón o el
   botón de la tarjeta, las tarjetas desaparecían.

## Cómo quedó

### Nombres legibles
- Helper nuevo `nombreLindo()`: "TRONCOSO, SEBASTIAN" →
  **"Sebastian Troncoso"** (da vuelta el "APELLIDO, NOMBRE" de la
  planilla y baja las mayúsculas a título, con acentos y guiones).
- Aplica a los renglones de **Cumpleaños** (equipo y clientes) y de
  **Oportunidades**. Los nombres que ya venían legibles ("María Pérez",
  "Jorge Salas") quedan como estaban.

### El mazo no se borra por actuar
- Antes cada renglón y cada botón cerraban el mazo antes de ejecutar la
  acción (`irYCerrar`). Ahora solo ejecutan (`ejecutar`): el mazo queda
  quieto en su tarjeta.
- Si la acción navega a otra pantalla, al volver al Home el mazo sigue
  donde estaba, con la misma tarjeta arriba.
- Si la acción abre WhatsApp (saludo de cumpleaños), el Home queda
  intacto atrás.

## Tests

- Nuevo: **las tarjetas muestran nombre y apellido, no solo el apellido
  (v323)** — exige "Sebastian Troncoso" y prohíbe "TRONCOSO,".
- Actualizados a la conducta nueva: tocar a Jorge abre su ficha Y el
  mazo sigue (count 1); el saludo de cumpleaños no borra el mazo; el
  toque con temblor dispara la acción y el mazo queda vivo.
- 25 tests del Home/mazo en verde.
