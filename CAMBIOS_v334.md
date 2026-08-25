# APPI v334 — Vecinos vuelve con un listado de la zona (sin mapa)

## Qué pasaba

En v333 se había quitado el botón **👥 Vecinos** de la ficha por error, junto
con el mapa. Lo correcto era conservarlo y cambiarle la función: antes dependía
del mapa interno (que se eliminó), ahora tiene que mostrar a las personas.

## Qué cambia

- El botón **👥 Vecinos** vuelve a la ficha de cada cliente, junto a
  "¿Cómo llego?".
- Al tocarlo se abre un listado con **todas las personas de la misma zona**
  (mismo panel visual que el listado de tarjetas/zonas):
  - Cada renglón: nombre, domicilio + vencimiento, estado (Vigente / Por
    vencer / Vencida, con su color) y botón **💬 WhatsApp** directo.
  - La persona desde la que se abrió va primera, marcada "· esta persona".
  - Quien no tiene teléfono muestra "Sin teléfono".
- El mapa sigue eliminado; nada depende de él.

## Versionado

- `package.json` 334.0.0 · visible `v334` · caché `appi-v334-vecinos-lista`.

## Pruebas

- `mapa-usuarios.spec.js`: el botón Vecinos existe y abre el listado de la
  zona; el mapa sigue sin existir.
- `usuarios-botones.spec.js`, `mensajes-usuarios.spec.js` y
  `seguridad-frontend.spec.js` actualizados.
