# APPI v301 · El panel de administración es un tablero

Rediseño completo elegido por el equipo entre maquetas (Opción B).

## El tablero

Arriba de todo, un tablero violeta con la plata como protagonista:

- **Recaudado del mes** en grande, con la comparación contra el mes
  anterior (↑/↓ %) y el histórico al lado.
- **Las 12 barras del año**: la tendencia de un vistazo. Tocás una barra
  y saltás a ese mes en Ingresos.
- **Chips de estado**: 👥 activas de N · 🧪 en prueba · ⏳ vencen esta
  semana · ● solicitudes (parpadea y te lleva al tocarla).

Reemplaza a las 4 tarjetas sueltas y al panel "Estadísticas de
membresías": todo lo que decían está en el tablero, sin repetirse.

## ⚠️ Necesitan tu atención

La tarjeta que ordena el día: junta solicitudes sin resolver, membresías
vencidas / que vencen hoy o en 3 días, y pruebas que terminan en 2 días.
Cada renglón te lleva a donde se resuelve. Sin urgencias: *"✓ Todo en
orden"*.

## Accesos rápidos y orden por urgencia

- Dos botones grandes: **➕ Crear cuenta** y **📨 Solicitudes** (con el
  contador parpadeando).
- El orden nuevo: tablero → accesos → atención → solicitudes →
  distribuidores → cumplimiento (colapsado) → ingresos (colapsado) →
  configuración (colapsada).
- **📅 Ingresos por mes** ahora es colapsable, con su resumen a la vista
  (*"Agosto: $45.000 · 9 pagos"*).
- **⚙️ Configuración** agrupa el WhatsApp del equipo, colapsado al fondo.
- Se eliminó la sección "Configuración de Precios": estaba vacía desde
  siempre (markup muerto, sin contenido ni funcionalidad).

La guía "?" quedó al día. Sin migraciones nuevas: el tablero se alimenta
de lo que ya existe (pagos, cuentas, pruebas, solicitudes).

## Pruebas

`admin-orden.spec.js` verifica el tablero, la atención, los colapsables
y que lo viejo se haya ido de verdad. `auth.spec.js` pasó a verificar el
chip de solicitudes y la tarjeta de atención.

## App Shell y caché v301

- `301.0.0` · visible `v301` · caché `appi-v301-tablero-admin`
