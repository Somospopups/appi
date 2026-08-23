# APPI v310 · Botones a la acción, gesto de ida y vuelta, franja que no tapa

## Los botones de las tarjetas van a LA ACCIÓN

Como la tarjeta de Usuarios (que ya iba directo al carrusel), ahora el
botón grande de **todas** las tarjetas ejecuta la primera acción, no
abre la pantalla:

- 📅 Tu jornada → **"Ir con Jorge"**: la ficha del primer contacto.
- 🎯 Oportunidades → **"Proponerle a Ana"**: WhatsApp con la propuesta
  del Bonus.
- 🎂 Cumpleaños → **"Saludar a Ana"**: WhatsApp con el saludo.
- 📇 Panel → **"Ir con Carla"** (ficha del primer nuevo) o "Ver los
  vencidos de hoy" si no hay nuevos.
- 💧 Usuarios → "Ir a marcar" abre el primer carrusel pendiente.
- 👥 Mi Equipo → "Cargar mi avance" ya posicionaba en la Cultura.

## Deslizar: para un lado pasa, para el otro vuelve

- **← Izquierda: pasa** a la siguiente (vuela como siempre).
- **→ Derecha: vuelve** a la tarjeta anterior, que entra volando desde
  la izquierda, por donde se había ido. En la primera tarjeta, el gesto
  a la derecha hace el resorte (no hay a dónde volver).
- La pista de uso lo dice: "← Deslizá a la izquierda para pasar · a la
  derecha volvés →".

## La franja de PRUEBA no tapa: achica

La barra roja ahora **mide su alto real** (una o dos líneas, con o sin
notch) y la pantalla se corre exactamente eso: ningún dato queda abajo.
En PC también corre la barra lateral. Al salir del modo prueba devuelve
el espacio.

## Pruebas

- Gesto de ida y vuelta completo (izquierda pasa, derecha vuelve).
- La franja empuja: el padding del cuerpo es ≥ al alto real de la barra.

## App Shell y caché v310

- `310.0.0` · visible `v310` · caché `appi-v310-accion-directa`
