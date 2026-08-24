# APPI v331 — Dos números en un campo ya no rompen el WhatsApp

## Qué pasaba

Varias planillas cargan en un mismo campo de teléfono más de un número (o un
"54" suelto al final, por ejemplo `351 766-9967 / 54`). Como toda la app
limpia el número juntando TODOS los dígitos, ese campo quedaba inválido:

- El enlace de WhatsApp no se armaba (o abría sin número) → "conflicto en la
  redirección".
- En el selector de números aparecían dos opciones: el número completo y un
  segundo que solo decía "54".

## Qué cambia

- `telefono.js` suma `APPITel.primeroValido(valor)`: de un campo con varios
  números devuelve el PRIMER número válido listo para wa.me, y descarta la
  basura ("54" suelto, mitades). Si el campo trae un solo número válido,
  funciona igual que antes.
- `parseTelefonos` (Mi Equipo) ahora sólo guarda números **realmente válidos**
  (antes bastaba con 8 dígitos y un "54" roto entraba). Además rescata un
  número único partido por guiones con espacios (ej. `54 351 766 - 9967`) y
  no duplica el mismo número escrito de dos formas.
- Las listas (cumpleaños y personas de Mi Equipo) ya no muestran el "54"
  suelto: se ve sólo el/los número/s válido/s.
- Las acciones de WhatsApp que usaban el campo crudo ahora pasan por el primer
  número válido: tarjetas del Home (cumpleaños/oportunidades), Acciones del
  día, Reactivación, Panel de Contactos, Histórico y Usuarios (Garantías).

## Versionado

- `package.json` 331.0.0 · visible `v331` · caché `appi-v331-telefonos-dobles`.

## Pruebas

- `telefono.spec.js`: casos nuevos de `primeroValido` (13).
- `telefonos-dobles.spec.js` (nuevo): `parseTelefonos` con "54" suelto, dos
  números, número partido y deduplicación.
