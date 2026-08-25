# APPI v345 — Medallas del podio: cumplimiento gamificado

## 1) Panel administrador: cumplimiento con medallas y estrellas

El "Cumplimiento diario" ahora muestra el podio, sin perder el orden
alfabético de la lista:

- **🥇🥈🥉** para el top 3 por porcentaje semanal (insignia en la esquina de
  la tarjeta, con fondo propio dorado/plata/bronce).
- **Estrellas** según el rendimiento: ★★★ (≥95%), ★★ (≥75%), ★ (≥50%).
- Se conservan las tarjetas con avatar, chips del día y barra de progreso.

## 2) Nueva tarjeta en el mazo del distribuidor

- Se agrega la tarjeta **🏆 Cumplimiento del día** al mazo del Home (solo
  cuando hay acciones hoy). Muestra si ya completó y su lugar en el podio:
  🥇 "Completaste en el puesto #1 de 4", o "Ya completaron 3 personas · ¡todavía
  estás a tiempo!".
- Cada distribuidor ve **solo su propia** posición (privado).

## 3) Backend: hora de finalización + posición

- `mensajes-usuarios.js` anota `completo_at` (hora) cuando la cuenta termina
  todas las acciones del día.
- Nueva migración `SUPABASE_CUMPLIMIENTO_POSICION.sql` con la función
  `appi_mi_posicion_cumplimiento()`: devuelve al distribuidor su posición
  entre quienes completaron hoy, sin exponer los datos de los demás.
- Se suma a `deploy-backend.yml` para que se instale en cada despliegue.
  ⚠️ Requiere correr el workflow "Publicar backend completo de APPI" (o la
  migración a mano) para que la medalla funcione; mientras tanto la tarjeta
  se muestra con el estado local.

## Versionado

- `package.json` 345.0.0 · visible `v345` · caché `appi-v345-medallas-del-podio`.

## Pruebas

- `admin-cumplimiento.spec.js`: medallas 🥇🥈 y estrellas del podio.
- `cumplimiento-medalla.spec.js` (nuevo): la tarjeta del mazo aparece y
  muestra la posición del backend.
