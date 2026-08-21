# Estado al retomar — APPI v290

Repo: `github.com/somospopups/appi` · **suite en verde**.

Corrida local completa: **257 pruebas pasan, 1 salteada, 0 fallan** (9,7 min, Chromium).

---

## Último arreglo: v290 · El panel dejaba de lado la validación de números

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
