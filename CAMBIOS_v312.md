# APPI v312 · La X descarta de a una y los distribuidores, cómodos

## El mazo: la X descarta esa tarjeta

- La **✗ de cada tarjeta descarta solo esa notificación** y pasa a la
  siguiente (con el mismo vuelo del deslizar).
- Para cerrar todas: el **✕ del encabezado** del mazo, o tocar el fondo
  oscuro. El 🔔 las trae de vuelta, como siempre.

## Panel de administración: Distribuidores renovado

- **💬 WhatsApp directo al distribuidor**: cada cuenta tiene su botón
  verde con el mensaje listo — *"Hola Valeria! 😊 ¿Cómo vas con APPI?
  ¿Necesitás ayuda con algo?"*. Como los perfiles no guardan teléfono,
  WhatsApp abre con el mensaje cargado y elegís el contacto.
- **♾️ PARA SIEMPRE**: la tercera membresía. Está en las píldoras de
  crear cuenta, al aprobar solicitudes y como acción en cada cuenta.
  Fija el vencimiento en 2099, saca del modo prueba si lo tenía, y el
  badge dorado la muestra. Nueva migración `SUPABASE_PARA_SIEMPRE.sql`
  (solo rol admin).
- **La sección se minimiza**: arranca cerrada con el resumen a la vista
  (*"14 cuentas · 11 activas"*); tocá y se abre con el buscador.
- **Cada distribuidor, rediseñado**: un renglón compacto (nombre, DIP,
  vencimiento y badges) que al tocarlo despliega **todas las acciones en
  botones grandes y claros**, en dos columnas: WhatsApp, Registrar pago,
  Prórroga, Nueva contraseña, Personas, Prueba 5 días, Para siempre,
  Bloquear/Activar y Eliminar (a lo ancho, bien abajo).

> ⚠️ Requiere correr `SUPABASE_PARA_SIEMPRE.sql` en Supabase para que
> la membresía permanente funcione. El resto anda sin migración.

## Pruebas

- La ✗ descarta una sola y el ✕ del encabezado cierra todo.
- Distribuidores minimizable, WhatsApp con el mensaje amable, PARA
  SIEMPRE completo (píldora, acción, RPC, badge) y el flujo del panel
  con la sección y el renglón desplegados.

## App Shell y caché v312

- `312.0.0` · visible `v312` · caché `appi-v312-distribuidores-comodos`
