# APPI v342 — Mensajes de mantenimiento e instalación por producto

## Qué cambia

Se agregan **22 mensajes predefinidos**, uno por video de PSA Purificadores,
agrupados en dos grupos y editables como las plantillas de fábrica:

- **🔧 Mantenimiento** (lo que se hace cada 6 meses): PSA Senik, PSA Senik
  Bajo Mesada, PSA Domus, Grifería bicomando, PSA Iontrix 3, PSA ROPOT,
  Purificador de Aire, PSA DUCHA II (retrolavado, cambio de cartucho y
  mantenimiento), PSA S•1000 II Bajo Mesada, PSA Quantum y SodaBurby.
- **🛠️ Instalación y puesta en marcha** (clientes nuevos): PSA Domus
  (instalación y puesta en funcionamiento), Grifería (puesta a punto),
  PSA Iontrix 3 (instalación y acondicionamiento), PSA ROPOT (instalación y
  reemplazo de módulos), Purificador de Aire (presentación y funcionamiento).

## Dónde aparecen

1. **Carrusel de Acciones del día**: botón **🔁 Cambiar mensaje** debajo de
   "Así lo va a recibir". Abre la lista agrupada; al elegir, el carrusel
   vuelve con ese texto para mandar.
2. **Editor de Mensajes**: al tocar "✏️ Editar los textos" aparecen al final
   los dos grupos; se editan y restauran como las plantillas de fábrica.

Cada mensaje usa `{nombre}` y lleva el link de su video. El distribuidor elige
el que corresponde al producto del cliente.

## Versionado

- `package.json` 342.0.0 · visible `v342` · caché `appi-v342-mantenimientos-por-producto`.

## Pruebas

- `mensajes-mantenimiento.spec.js` (nuevo): los 22 mensajes existen, están
  agrupados y el botón 🔁 del carrusel permite cambiar el mensaje.
