# APPI v313 · El 💬 del panel va directo al distribuidor

## Qué cambia

El formulario de solicitud ya pedía el WhatsApp, pero al aprobar la
cuenta ese número se perdía. Desde ahora:

- **Al aprobar una solicitud, el teléfono queda guardado en el perfil**
  automáticamente. Al crear una cuenta, el campo opcional de WhatsApp
  también queda.
- **El botón 💬 de cada distribuidor va directo**: si la cuenta tiene
  número guardado (validado por APPITel), WhatsApp abre en su chat con
  el mensaje listo. El renglón muestra el 📱 junto al DIP.
- **Si la cuenta no tiene número** (las creadas antes de hoy), al tocar
  💬 APPI te ofrece cargarlo una vez y queda para siempre; si preferís,
  lo dejás vacío y elegís el contacto a mano como antes.
- **Botón 📱 Teléfono** en las acciones de cada cuenta para cargar,
  corregir o borrar el número cuando quieras (siempre validado).

## Nueva migración `SUPABASE_TELEFONOS.sql`

Columna `appi_perfiles.telefono` + RPC `appi_admin_set_telefono` y
`appi_admin_telefonos` (solo rol admin). Sin la migración, el panel
sigue funcionando con el selector de contactos.

## App Shell y caché v313

- `313.0.0` · visible `v313` · caché `appi-v313-whatsapp-directo`
