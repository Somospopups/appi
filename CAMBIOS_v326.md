# APPI v326 — Anuncios para todos y mensajes propios

## Qué pidió el administrador

1. Que los distribuidores puedan **agregar mensajes predefinidos propios**
   (los de Garantías y Reactivación ya se editaban; faltaba poder sumar).
2. Un campo del panel para escribir un **mensaje que vean todos al abrir
   APPI** (reuniones por Zoom, avisos), con **dos botones** para que cada
   distribuidor agrende las reuniones a su agenda sin tipear nada.

## Cómo quedó

### 📣 Anuncio para todos (panel → cartel en cada teléfono)

- Nueva sección **📣 Anuncio para todos** en el panel de administración
  (entre Ingresos y Configuración): mensaje de hasta 600 caracteres y hasta
  **3 reuniones opcionales** con título, fecha, hora y lugar/link.
- **Publicar** reemplaza el aviso vigente; **Quitar** lo apaga. El formulario
  arranca precargado con el aviso actual para retocarlo y volver a publicar.
- Al abrir APPI, el distribuidor ve el **cartel** (overlay propio, estilo
  APPI, modo oscuro incluido). Si no hay conexión, se muestra el último aviso
  conocido (queda cacheado por cuenta en el dispositivo).
- Cada reunión del cartel trae sus dos botones:
  - **📅 En el calendario de APPI**: usa `APPICalendario.agregar` (fecha,
    hora y título con 📣); queda ✓ Agendado y se recuerda por aviso.
  - **📲 En la agenda del teléfono**: Google Calendar en Android/PC
    (enlace `render?action=TEMPLATE`, evento de 1 hora o día completo) y
    archivo `.ics` descargable en iPhone.
- **🔔 campanita** fija en la esquina superior derecha para reabrir el aviso;
  puntito rojo mientras el aviso vigente no se haya visto. Baja un escalón
  si está la franja de versión de prueba.
- La cuenta administradora no recibe carteles ni campanita.

### ✍️ Mensajes propios (Garantías → Mensajes)

- En la pantalla de edición de textos, botón **✍️ Crear un mensaje nuevo**:
  emoji, nombre y texto, con los mismos comodines (`{nombre}`, `{vence}`, …)
  y la misma vista previa con cliente de ejemplo.
- Las plantillas propias aparecen al final de la lista para **cualquier
  cliente** (grupo `todos`), se envían en un toque como las demás, se editan
  (incluido emoji y nombre) y se eliminan con confirmación `APPIDialog`.
- Viven en el mismo almacenamiento por cuenta que las ediciones: recargar la
  planilla no las toca. Las de fábrica siguen con su "Volver al texto
  original".

### Base de datos

- `SUPABASE_ANUNCIOS.sql`: tabla `appi_anuncios` (RLS: lectura para
  autenticados, escritura sólo vía RPC `appi_admin_publicar_anuncio` /
  `appi_admin_quitar_anuncio`, que exigen rol admin y sanean los eventos:
  máx. 4, fecha `AAAA-MM-DD`, hora `HH:MM`). Agregada al workflow
  `deploy-backend.yml`.

## Versionado

- `package.json` 326.0.0 · visible `v326` · caché `appi-v326-anuncios-y-mensajes-propios`.
- `anuncios.js` agregado al App Shell del Service Worker.

## Pruebas

- `anuncios.spec.js` (nueva, 8): el cartel salta con el aviso vigente, agenda en
  el calendario de APPI, no vuelve a saltar el mismo aviso, la 🔔 lo reabre
  (puntito hasta cerrarlo), sin aviso vigente no hay cartel, el admin no recibe
  nada, el enlace de Google Calendar y el `.ics` salen bien armados (con y sin
  hora), y el panel/SQL/workflow/sw quedan cableados.
- `mensajes-usuarios.spec.js` (3 nuevas): crear un mensaje propio y mandarlo,
  editarlo (emoji/nombre/texto) y eliminarlo con confirmación, y valen para
  cualquier cliente sobreviviendo recargas de planilla.
- `convenciones.spec.js`: `anuncios.js` entra a la lista de archivos que
  prohíben diálogos nativos.
- Suite completa: **329 passed, 1 skipped, 0 failed**.
