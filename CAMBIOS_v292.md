# APPI v292 · Acciones del día con ✓ y ✗

## Qué cambia

La franja **"Hoy tenés N mensajes para mandar"** (Garantías) deja de ser un
aviso que se desinfla y pasa a ser la agenda del día, con rendición:

- **Dura todo el día y no se puede eliminar.** Las acciones marcadas no
  desaparecen: quedan a la vista con su estado. Cuando un motivo se completa,
  su renglón queda como "completado". Cuando está todo marcado, la franja
  celebra: *"🎉 Día completo"* — y sigue ahí.
- **Cambia sola al cambiar el día.** A medianoche (o al volver a abrir), la
  lista se rearma con las acciones del día nuevo. Las marcas son por día.
- **Cada acción se marca sí o sí.** En el carrusel ya no existe "Saltear".
  Debajo del botón verde de WhatsApp hay dos botones chicos:
  - **✓ Ya lo hice** (verde): la acción se hizo — por WhatsApp, llamada o visita.
  - **✗ No se hizo** (rojo): queda registrado que no se hizo.
  - **Mandar por WhatsApp marca la ✓ sola.**

## El cómputo, visible para el administrador

Las marcas se guardan por día en `appi_acciones_v1_<usuario>` con resumen
(`total`, `hechas`, `noHechas`). Esa clave entró a la lista de `data-sync`,
así que sube a `appi_datos` como el resto del espacio personal: con nube,
backup, cola offline y separación titular/socio ya resueltos.

**Nueva migración `SUPABASE_ACCIONES_DIA.sql`:**
- `appi_admin_cumplimiento(dias_atras)`: función RPC que devuelve el resumen
  diario por cuenta (DIP, nombre, titular/socio, fecha, ✓, ✗). **Solo
  responde al rol `admin`**; cualquier otra cuenta recibe un error.
- `appi_json_seguro(text)`: un JSON corrupto no puede voltear la consulta.

**Panel de administración**, sección nueva **"Cumplimiento diario"**: por cada
cuenta muestra *Hoy: ✓ a · ✗ b de N* y *Últimos 7 días: ✓ x · ✗ y de N (z%
hecho)*. Se carga con el panel y tiene su botón Actualizar.

> ⚠️ Para activarla hay que correr `SUPABASE_ACCIONES_DIA.sql` en Supabase
> (SQL Editor). Hasta entonces el panel avisa que falta la migración.

## Detalles honestos

- Solo se guardan los últimos 60 días de marcas por cuenta.
- El día se computa con la fecha local del teléfono.
- Si la persona no marca nada y no abre la app, ese día queda sin marcas
  (el panel del admin lo muestra tal cual: sin datos ese día).

## Pruebas

- `mensajes-usuarios.spec.js` reescrito donde cambió el contrato: el
  contactado ya no desaparece (queda ✓ visible), la ✗ registra y no hay
  saltear, la ✓ marca sin abrir WhatsApp, y el cómputo del día queda
  guardado con total/hechas/noHechas.
- `acciones-dia.spec.js` (nuevo): la clave está en data-sync, la migración
  existe y solo responde al admin, el panel tiene la sección y no queda
  ningún "saltear" en el módulo.

## App Shell y caché v292

- Versión del paquete: `292.0.0`
- Versión visible y registro del Service Worker: `v292`
- Caché: `appi-v292-acciones-del-dia`
