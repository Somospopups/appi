# APPI v337 — Ficha del carrusel en dos columnas

## Qué cambia

En el carrusel de Acciones del día, la ficha de cada persona queda en dos
columnas, en este orden:

- **Izquierda:** 📍 localidad → 🏠 dirección → 📞 teléfono.
- **Derecha:** 📦 producto → 🛒 Compra → 📅 Vence.

El vencimiento va en **rojo y negrita** (también en modo oscuro).

## Versionado

- `package.json` 337.0.0 · visible `v337` · caché `appi-v337-ficha-en-dos-columnas`.

## Pruebas

- `mensajes-usuarios.spec.js`: el test de la ficha ahora exige las dos
  columnas y el rojo/negrita del vencimiento.
