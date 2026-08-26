# APPI v358 — Sincronización de Agenda Personal

## Qué cambia

- **Subida masiva por lotes**: la agenda del teléfono se envía a Supabase
  mediante batch upsert en paquetes JSON de hasta 500 contactos. Los paquetes
  se procesan en paralelo y dejan de generarse requests individuales por cada
  teléfono. La cola offline conserva el último cambio de cada contacto.
- **Sincronización automática en PC**: al abrir APPI, al volver a enfocar la
  ventana, al recuperar la conexión y al cambiar entre **Agenda APPI** y
  **Agenda Personal**, la PC descarga los contactos que se hayan subido desde
  el celular y sube los pendientes locales.
- **Sin pantallazo**: la solapa guardada se renderiza mientras el Panel de
  Contactos todavía está oculto. Cuando se muestra la pantalla ya contiene la
  Agenda Personal o la Agenda APPI elegida, sin un frame de la agenda vieja.
- **Se conserva la explicación de permisos de v357/v358**: si Android bloquea
  el selector nativo, APPI explica cómo habilitar Contactos y ofrece el `.vcf`;
  cancelar el selector sigue siendo silencioso.

## Versionado y caché

- `package.json` y `package-lock.json`: `358.0.0`.
- Pie visible: `v358` · `swVersion='358'`.
- `CACHE_NAME='appi-v358-sync-agenda-personal'` en `service-worker.js` y en
  la metadata de `index.html`/`package.json`/`README.md`.
- El registro del Service Worker usa `updateViaCache: 'none'` y la URL incluye
  el identificador de caché para que los navegadores renueven los recursos al
  abrir APPI.

## Base de datos

La tabla `appi_agenda_personal` de `SUPABASE_AGENDA_PERSONAL.sql` no cambia y
sigue siendo una migración aditiva. Si todavía no se ejecutó, la agenda local
continúa funcionando y APPI avisa que falta correr ese SQL para sincronizarla
con la cuenta.

## Verificación de deploy

La versión v358 ya está publicada en `main` vía el pull request
**#28 — "v358: sincronización por lotes de Agenda Personal"**, cuyo merge commit
es `c692a22e799e192c55bb8242cb4a229ae07d5f8c`.

Se verificó que los cuatro puntos pedidos están presentes en el código de esa
versión:

- **Subida masiva por lotes**: `agenda-personal.js` usa `UPSERT_BATCH_SIZE = 500`
  y `subirLote()` envía un array JSON a
  `/rest/v1/appi_agenda_personal?on_conflict=user_id,telefono_normalizado`
  con `Prefer: resolution=merge-duplicates,return=minimal`; `vaciarCola()` parte
  la cola en paquetes y los envía en paralelo.
- **Sincronización automática en PC**: `openMiGestion()` dispara la descarga al
  abrir el Panel de Contactos; `agenda-personal.js` también sincroniza con
  `focus`, `online`, `visibilitychange` y al cambiar entre **Agenda APPI** y
  **Agenda Personal**.
- **Sin pantallazo**: `openMiGestion()` renderiza la solapa guardada en
  `#gestionContent` mientras el panel sigue oculto y recién después llama a
  `showView('view-gestion')`, evitando un frame de la agenda anterior.
- **Versión v358**: `CACHE_NAME`/`cacheName` es
  `appi-v358-sync-agenda-personal` en `service-worker.js`, `index.html`,
  `package.json`, `package-lock.json` y `README.md`; `package.json` y el pie
  visible indican `358.0.0` / `v358`.

