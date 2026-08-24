# APPI v330 — Mandar no pasa solo a la siguiente persona

## Qué pasaba

En el carrusel de **Acciones del día** (Usuarios), al tocar "💬 Mandar a …"
se abría WhatsApp y, de una, el carrusel saltaba a la siguiente persona.
Al volver de WhatsApp ya no estaba la misma persona: no se podía marcar
qué pasó en ese contacto (✓ ya lo hice / ✗ no se hizo) sin volver atrás
con la flechita.

## Qué cambia

- El botón "💬 Mandar" **ya no avanza solo**. Abre WhatsApp, deja la ✓
  puesta (como siempre) y la **misma persona queda a la vista** cuando se
  vuelve, con su marca "✓ Marcada como hecha". Ahí se confirma con el ✓ o
  se corrige con la ✗, y recién entonces se pasa a la siguiente.
- Tests: los tres que asumían el avance automático se actualizaron y se
  suma uno nuevo de guardia (`mandar no pasa solo a la siguiente`).

## Versionado

- `package.json` 330.0.0 · visible `v330` · caché `appi-v330-mandar-queda-en-la-misma`.

## Pruebas

- `mensajes-usuarios.spec.js` completo en verde, más `pwa-cache` y
  `admin-scope` como guardias de versión.
