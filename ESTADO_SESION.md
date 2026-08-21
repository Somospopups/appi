# Estado al retomar — APPI v292

Repo: `github.com/somospopups/appi` · **suite en verde**.

Corrida local completa: **269 pruebas pasan, 1 salteada, 0 fallan** (10,2 min, sin flakes).

---

## Último cambio: v292 · Acciones del día con ✓ y ✗

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
