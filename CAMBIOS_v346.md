# APPI v346 — Podio con medallas grandes en el panel

## Qué cambia

El "Cumplimiento diario" del panel administrador ahora muestra el podio de
forma bien visible, como en la opción 4 elegida:

- **Columna de trofeo** a la izquierda de cada tarjeta: 🥇🥈🥉 para el top 3
  (🏅 para el resto) y el puesto (1°, 2°, 3°).
- **Fondo propio** dorado / plata / bronce para el top 3.
- **Estrellas** de rendimiento junto al nombre: ★★★ (≥95%), ★★ (≥75%),
  ★ (≥50%).
- Se conservan el avatar, los chips del día y la barra de progreso semanal.

## Versionado

- `package.json` 346.0.0 · visible `v346` · caché `appi-v346-podio-grande`.

## Pruebas

- `admin-cumplimiento.spec.js` actualizado: trofeo, puesto y estrellas.
