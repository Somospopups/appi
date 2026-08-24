# APPI v333 — Se elimina la función de mapa por completo

## Qué cambia

A pedido del equipo, la función de mapa se elimina de raíz (en v332 se
habían quitado los botones; ahora se quita todo lo demás):

- **Ficha del cliente**: se quita el botón **👥 Vecinos** (que abría el mapa).
  Queda **🧭 ¿Cómo llego?**, que abre Google Maps en una pestaña nueva.
- **Panel de accesos rápidos (Home)**: la tarjeta de Usuarios deja de decir
  "Garantías y mapa" y "Mapa"; ahora dice "Garantías y vencimientos".
- Se elimina el mapa interno completo: contenedor `usuariosMap`, Leaflet,
  geocodificación (Nominatim), pines, funciones `verVecinosU`,
  `abrirMapaU`, `cerrarMapaU`, `mostrarEnMapaU`, `provinciaPorCP`,
  `geocodePreciseForUser`, etc.
- Se quitan del App Shell (Service Worker) y del repo los archivos de
  Leaflet y las imágenes de pines.

## Cómo queda

- Usuarios / Garantías: sin mapa. La ficha conserva WhatsApp, Llamar y
  ¿Cómo llego? (Google Maps). La barra conserva Tarjetas, Ordenar, Zonas
  y Cambiar archivo.
- El mini-mapa del organigrama (Mi Equipo) NO se toca: es un canvas del
  árbol, no un mapa geográfico.

## Versionado

- `package.json` 333.0.0 · visible `v333` · caché `appi-v333-sin-mapa`.

## Pruebas

- `mapa-usuarios.spec.js` reescrito: exige que no existan botones, ni
  contenedor, ni funciones globales de mapa.
- `seguridad-frontend.spec.js` actualizado: Leaflet y los pines ya no se
  exigen (el mapa no existe).
- `mensajes-usuarios.spec.js` actualizado al grupo sin Vecinos.
