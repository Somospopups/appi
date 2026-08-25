# APPI v350 — Contactos depurados (teléfono no corresponde)

## Qué cambia

Nueva función en **Usuarios / Garantías** para marcar contactos cuyo teléfono
no corresponde y que no vuelvan a aparecer:

- **Botón 🧹 Depurar** en la ficha de cada contacto. Al tocarlo pide
  confirmación y el contacto sale de la lista al instante.
- **Se ignora en futuras cargas**: al cargar una planilla nueva (o recuperar
  la guardada), los depurados se filtran solos por su número de teléfono.
- **Planilla descargable**: el botón **🧹 Depurados** de la barra de Usuarios
  abre la lista completa, con **⬇️ Descargar planilla (CSV)** para pasársela a
  la empresa. Columnas: Nombre, Teléfono, Dirección, Localidad, Producto,
  DIP, Motivo y Fecha.
- Cada depurado se puede **deshacer** desde el panel si fue un error.

## Cómo funciona

- La lista vive en la memoria del dispositivo (`appi_depurados_v1_`).
- Al cargar, se compara por dígitos del teléfono; si coincide, se salta y se
  avisa cuántos depurados se ignoraron.

## Versionado

- `package.json` 350.0.0 · visible `v350` · caché `appi-v350-contactos-depurados`.

## Pruebas

- `depurados.spec.js` (nuevo): depurar saca de la lista, el panel lista y
  descarga el CSV, y el contacto no reaparece al recargar.
