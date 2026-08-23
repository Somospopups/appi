# APPI v322 — El cumpleañero sin teléfono lo dice de frente

## El reporte

"Tengo dos personas con cumpleaños en la tarjeta: el primero me envía
al WhatsApp, pero el segundo NO."

## Qué era

Se reprodujo primero el camino del código con un test: dos cumpleañeros
del equipo con teléfono válido → los DOS renglones saludan bien. El
código estaba sano; el segundo cumpleañero real no tiene un teléfono
válido cargado en la planilla de Línea Descendente, y el plan B de la
tarjeta era abrir Mi Equipo en silencio: parecía que el toque no hacía
nada o estaba roto.

## El arreglo (honestidad en la interfaz)

- El renglón de quien no tiene número válido ahora lo dice:
  **"🎂 OVIEDO · de tu equipo — sin teléfono"** (en rojo, chiquito).
- Al tocarlo, en vez de mandar a otra pantalla en silencio, APPI lo
  explica con un diálogo: *"… no tiene un teléfono válido cargado en la
  planilla de Línea Descendente. Cuando subas una planilla con su
  número, el saludo sale a un toque."*
- Lo mismo en la tarjeta de **Oportunidades** (proponer el bonus):
  renglón marcado y aviso claro.
- Con teléfono válido, todo igual que en v320: WhatsApp directo.

## Tests

- **con dos cumpleañeros, el segundo renglón también saluda por
  WhatsApp (v322)** — fija que el camino sano funciona para el segundo.
- **el cumpleañero sin teléfono lo dice en el renglón y el toque lo
  explica (v322)** — renglón marcado, diálogo con la explicación, cero
  llamadas a WhatsApp.
- 24 tests del Home/mazo en verde (28 con avisos-duplicados).
