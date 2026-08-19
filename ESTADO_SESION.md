# Estado al retomar — APPI v268

Repo: `github.com/somospopups/appi` · HEAD `4575f1f` · **suite en verde**.

Corrida local completa: **146 pruebas pasan, 0 fallan** (5,7 min, Chromium, 28 archivos).

> Actualizado tras traer 76 commits nuevos. La lectura anterior de este archivo
> era sobre v247 y quedó completamente obsoleta: **todo lo que estaba pendiente
> ahí ya fue resuelto por el equipo.**

---

## Lo que se resolvió desde v247

Los tres puntos que había marcado en la sesión anterior están cerrados:

| Pendiente de v247 | Estado |
|---|---|
| CI en rojo por `data-admin-action="membership"` (`auth.spec.js:261`) | **Resuelto.** El botón se retiró del panel de forma definitiva y el test se reescribió. Hay además un `membresias-admin.spec.js` nuevo. |
| 10 tests obsoletos (Mi Carrera, Tu Parque, Home viejo) | **Resuelto.** `carrera-empresarial.js`, `parque-amigo.js` y sus specs fueron eliminados; `home-limpio` y `v230` se reescribieron contra el Home nuevo. |
| Bug: `#homeExtraKeep` inexistente dejaba sin dibujar La botella y Simulador | **Resuelto.** `tablero-negocio.js:391` documenta que ambos viven ahora en Herramientas; se quitó el código muerto. |
| RLS de membresías con `USING (true) WITH CHECK (true)` | **Resuelto.** `SQL_MEMBRESIAS.txt` fue reemplazado por `SUPABASE_MEMBRESIAS.sql`, con políticas separadas por rol (`user_membership_select_own`, `admin_membership_select`, etc.). |

---

## Lo que trajeron los 76 commits (v247 → v268)

**Funciones nuevas**
- **Histórico** muy expandido: álbum anual de 12 meses, Centro de Acción, modos
  Comparar / Mi año, legibilidad y modo noche.
- **Mi stock** con préstamos (`stock-personal.js`), en Herramientas.
- **Tarjetas y promos** (`tarjetas-promos.js`): carga por Excel, filtros y aviso
  por WhatsApp.
- **Coach de Demo** interactivo en `demo-guia.js`.
- **Compartir APPI** desde el engranaje.
- Home con impulso del día, racha y avisos.

**Arranque y PWA**
- Logo de vidrio generado por `scripts/logo_vidrio.py`, splash para 25 tamaños
  de pantalla Apple, íconos regenerados.

**Robustez** (los cuatro hallazgos del informe `REVISION_APPI.md`, todos cerrados)
- Los avisos de Cultura, Bonus y cumpleaños ahora se pintan en **todas** las
  pantallas (`appiPintarTodos` reemplazó al `getElementById` que solo llenaba el
  primer contenedor).
- **Alta de contactos sin internet**: la cola `queueMutation` ahora cubre el alta,
  no solo la edición. Con `alta-sin-internet.spec.js` cubriéndolo.
- **Migraciones SQL**: `migraciones.spec.js` ahora descubre los archivos por
  patrón (`/^SUPABASE_.+\.sql$/`), así que cubre los 16 automáticamente.
- **Pruebas del Histórico** (v268): cuentas, comparación de meses, guardado y
  vista anual.

**Dependencias**
- Las librerías externas pasaron a ser locales en `vendor/` (Leaflet, XLSX,
  jsPDF, JSZip, html2canvas, svg2pdf, transformers) con sus licencias. La app ya
  no depende de CDN para funcionar.

---

## Verificado ahora

- `package.json` **268.0.0** y `service-worker.js` `appi-v268-pruebas-del-historico`: coherentes.
- 146 pruebas en verde, sin flakes en esta corrida.
- El README todavía dice **"Versión: v265 · Segura"** en *Estado actual* —
  quedó atrás respecto de v268. Detalle menor de documentación.

---

## Pendientes que siguen abiertos

Del informe `REVISION_APPI.md`, quedan solo los menores:

1. **34 `console.log` en `index.html`** — conviene revisar los que impriman datos
   de personas.
2. **Una URL externa** sobrevive: la sombra de los marcadores del mapa (`cdnjs`).
   Cosmética; el mapa anda igual sin ella.
3. **`openai_api_key` en `localStorage`** para la Grabadora. Verificado que no se
   sincroniza ni sale en backups.
4. **README desactualizado** (dice v265, va v268).
5. ⚠️ **Revocar el token de GitHub** → https://github.com/settings/tokens
   (marcado como "pendiente de siempre" en el informe del equipo).
