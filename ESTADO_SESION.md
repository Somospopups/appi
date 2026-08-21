# Estado al retomar — APPI v299

Repo: `github.com/somospopups/appi` · **suite en verde**.

Corrida local completa: **282 pruebas pasan, 1 salteada, 0 fallan** (sin flakes en esta corrida).

---

## Último cambio: v299 · Ayuda del panel de administración

Auditoría de ayudas: 23 de 24 pantallas tenían su "?" conectado; faltaba
solo el panel de administración. Ahora tiene su guía completa (crear
cuenta con 1 mes/PRUEBA, solicitudes, botones de cada carpeta,
cumplimiento diario, WhatsApp de soporte). Test en prueba.spec.js.

## Anterior: v298 · Home sin "Tu impulso"

A pedido del equipo se retiró completa la tarjeta "Tu impulso" del Home:
vista, lógica (racha, sugerencia del día, chips), estilos y su
notificación diaria. El Home queda con saludo, porqué, Tu jornada y
avisos. Cultura, Las 7 P y el Panel siguen intactos en sus pantallas.
El botón "Avisos" del engranaje se conserva (permiso del navegador).

## Anterior: v297 · Ayuda de los botones ✓/✗

Debajo de los botones de marca del carrusel hay una explicación breve y
siempre visible: el verde es "ya lo hice" (aunque haya sido por llamada o
en persona) y el rojo es "hoy no se va a hacer, queda anotado". La prueba
del carrusel exige que la ayuda esté visible.

## Anterior: v296 · Limpieza de pendientes menores

Barridos los tres pendientes menores de REVISION_APPI.md: (1) los logs del
geocodificador ya no vuelcan direcciones de personas en la consola; (2) los
mensajes de error de Excel dejaron de aconsejar desactivar AdBlock para un
CDN que la app no usa desde v250; (3) verificado que no queda ninguna URL
de cdnjs/jsdelivr/unpkg en el código. El README pasó a v296 y quedó
vigilado: pwa-cache.spec ahora exige que diga la misma versión que el
paquete.

Pendientes que quedan: solo revocar el token de GitHub (manual, del equipo).

## Anterior: v295 · Panel de Contactos privado (bug real de privacidad)

Reportado por el equipo: la sesión admin veía en SU Panel de Contactos los
encuestados/referidos de todas las distribuidoras. Diagnóstico con datos:
las encuestas SIEMPRE se guardaron bien (asignación por token); lo roto era
la cláusula `or appi_es_admin()` en las políticas RLS de gestión + el panel
pidiendo "todo lo visible". Doble arreglo: SUPABASE_PANEL_PRIVADO.sql
(políticas solo-dueño; la Edge Function usa service_role y no pierde nada)
+ filtro soloMios() en gestion-client (nube y caché). Instaladores
alineados. No hubo datos mal guardados; no hay nada que transferir.

⚠️ PENDIENTE DE DESPLIEGUE: correr SUPABASE_PANEL_PRIVADO.sql en Supabase
(URGENTE: hasta entonces la sesión admin sigue viendo datos ajenos si usa
una versión vieja de la app; la v295 ya filtra en el cliente igualmente).

## Anterior: v294 · Modo PRUEBA de 5 días

Píldoras de creación reducidas a [1 mes] [🧪 PRUEBA · 5 días] (también al
aprobar solicitudes). La prueba dura 5 días calendario (vence a medianoche
argentina del quinto día). Franja roja fija en todas las pantallas, sin
cerrar, con días → horas el último día (prueba-banner.js, en el App Shell).
Píldora 🧪 en cada carpeta del panel para poner a prueba cuentas existentes
(pisa la membresía, con confirmación) + badge 🧪 PRUEBA · XD. Pago o
prórroga sacan del modo prueba solos (trigger). Al vencer: bloqueo de
ingreso con mensaje propio.

⚠️ PENDIENTE DE DESPLIEGUE: correr SUPABASE_PRUEBA.sql en Supabase
(además de SUPABASE_ACCIONES_DIA.sql de v292 si todavía no corrió).

## Anterior: v293 · Flechitas en el carrusel

Flechitas ‹ › alrededor del contador para ir y volver entre las tareas del
día. Pasear no marca nada; volver a una tarea marcada muestra su marca y
deja corregirla (se pisa, no se duplica). El resumen final se cuenta de las
marcas reales.

## Anterior: v292 · Acciones del día con ✓ y ✗

Pedido del equipo: la franja "Hoy tenés N mensajes" (Garantías) dura todo el
día, no se puede eliminar, rota sola al cambiar el día, y cada acción se
marca sí o sí con ✓ (hecha) o ✗ (no se hizo) — sin "Saltear". Mandar por
WhatsApp marca la ✓ sola.

Cómputo: marcas por día en appi_acciones_v1_<uid> (prefijo nuevo en
data-sync → sube a appi_datos con nube/offline/titular-socio resueltos).
Migración nueva SUPABASE_ACCIONES_DIA.sql: RPC appi_admin_cumplimiento
(solo rol admin) + sección "Cumplimiento diario" en el panel admin.

⚠️ PENDIENTE DE DESPLIEGUE: correr SUPABASE_ACCIONES_DIA.sql en el SQL
Editor de Supabase. Hasta entonces la sección del panel avisa que falta.

## Anterior: v291 · Solo la planilla del titular

Pedido del equipo: que no se pueda cargar una planilla de Garantías ajena.
La LD ya se validaba por DIP del titular (cliente + triggers de Supabase),
pero la GO se aceptaba ignorando en silencio las filas que no coincidían.

Desde v291 la GO se valida por contenido (el reporte no trae el DIP del
titular): si ningún DIP está en la LD, o con 5+ registros coincide menos
del 20%, se rechaza entera. Aplica en la pantalla principal, en la carga
del Histórico (con la LD del mes, en cualquier orden) y como respaldo en
normalizePeriod al guardar el cierre. Tests en garantias-titular.spec.js.

## Anterior: v290 · El panel dejaba de lado la validación de números

El usuario reportó con captura real que WhatsApp respondía
"+549280434264454 no es un número de teléfono válido" al avisar desde el
panel de administración.

**Causa:** la migración v289 unificó los números en `telefono.js`
(`window.APPITel`), pero `admin-panel.js` conservó una función propia
(`whatsappPhone`) que quedó afuera y agregaba dígitos sin validar el largo:
`+54 280 434264454` (14 dígitos, sin el 9) → `549280434264454` (15 dígitos,
no existe).

**Arreglo (v290):**
- `admin-panel.js`: se eliminó `whatsappPhone`; los avisos de "solicitud
  recibida" y "cuenta aprobada" usan `APPITel.abrir`, que valida y avisa.
- `admin-panel.js`: el número de soporte se valida con `APPITel.normalizar`
  antes de guardarse.
- `account-request.js`: el botón de soporte normaliza el número configurado
  y distingue "no configurado" de "mal cargado".
- `telefono.spec.js`: casos nuevos — números con dígitos de más se rechazan,
  área 280 (Rawson/Trelew) válida con y sin 15, y un test de convención que
  prohíbe concatenar `'549'` fuera de `telefono.js`.

Versionado alineado: `package.json` 290.0.0, caché
`appi-v290-numeros-del-panel`, versión visible v290.

---

## Pendientes que siguen abiertos

Del informe `REVISION_APPI.md`, quedan solo los menores:

1. **34 `console.log` en `index.html`** — conviene revisar los que impriman
   datos de personas.
2. **Una URL externa** sobrevive: la sombra de los marcadores del mapa
   (`cdnjs`). Cosmética; el mapa anda igual sin ella.
3. **`openai_api_key` en `localStorage`** para la Grabadora. Verificado que
   no se sincroniza ni sale en backups.
4. **README desactualizado** (dice v265; el paquete va por v290).
5. ⚠️ **Revocar el token de GitHub** → https://github.com/settings/tokens
   (pendiente de siempre; es manual, desde la cuenta del equipo).
