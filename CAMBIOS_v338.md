# APPI v338 — El vencimiento se pinta según el estado de la garantía

## Qué cambia

En la ficha del carrusel de Acciones del día, la fecha de vencimiento ahora
se pinta según el estado (siempre en negrita):

- 🔴 **Vencida** → rojo (`#d9534f`).
- 🟡 **Por vencer** → ámbar (`#a3670b`).
- 🟢 **Vigente** → verde (`#168765`).

En modo oscuro se usan tonos equivalentes más claros.

## Versionado

- `package.json` 338.0.0 · visible `v338` · caché `appi-v338-vencimiento-por-estado`.

## Pruebas

- `mensajes-usuarios.spec.js`: el vencimiento vigente se espera verde, y se
  suman dos tests (vencida en rojo, por vencer en ámbar).
