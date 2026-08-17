# APPI v247 · Motion

La app se siente viva, sin marear:

- **Selector de páginas glass:** fondo translúcido con blur y saturación,
  borde luminoso, y un indicador pastel que se desliza con resorte hasta la
  página activa. Hace un pequeño "pop" en cada cambio.
- **Pantallas que se deslizan:** al cambiar de página, la nueva entra desde
  el lado correcto y la anterior se despide deslizándose, con dirección
  según el orden Home → Mi mes → Mi negocio → Herramientas.
- **Títulos que bajan:** cada pantalla nueva recibe su título (y subtítulo)
  con una entrada suave desde arriba.
- Respeta `prefers-reduced-motion`: quien pide menos movimiento, recibe
  menos movimiento.
