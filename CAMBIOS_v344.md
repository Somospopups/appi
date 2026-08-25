# APPI v344 — Cumplimiento diario con tarjetas y colores

## Qué cambia

El "Cumplimiento diario" del panel administrador dejó de ser texto plano y
ahora cada cuenta es una **tarjeta** ordenada y fácil de leer:

- **Avatar** circular con las iniciales del nombre.
- **Nombre** + badge "socio/a" cuando corresponde, y el DIP debajo.
- **Hoy**: chips verdes/rojos (✓ hechas · ✗ no hechas) o "Hoy · sin marcas".
- **Últimos 7 días**: contador ✓/✗, porcentaje grande y una **barra de
  progreso** con color según el rendimiento (verde ≥80%, ámbar ≥50%,
  rojo por debajo).

De paso se corrigió el buscador de la sección: ahora filtra de verdad
(antes `loadAcciones` pintaba directo y el filtro no veía los datos).

## Versionado

- `package.json` 344.0.0 · visible `v344` · caché `appi-v344-cumplimiento-lindo`.

## Pruebas

- `admin-cumplimiento.spec.js` (nuevo): las tarjetas se pintan con avatar,
  chips del día, porcentaje y barra; la segunda cuenta sale como socio/a
  con porcentaje medio.
