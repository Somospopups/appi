# APPI v348 — Se quita la carta de cumplimiento del mazo

## Qué cambia

A pedido del equipo, se elimina la carta **🏆 Cumplimiento del día** que se
había agregado al mazo del distribuidor: el distribuidor ya no la ve.

Se quita también todo lo asociado a esa carta:

- La tarjeta en el mazo (`tarjetaCumplimiento`) y sus estilos.
- El campo `completo_at` de las marcas del día.
- La migración `SUPABASE_CUMPLIMIENTO_POSICION.sql` y su entrada en el
  workflow de despliegue.

Se conserva el **podio con medallas en el panel administrador** (opción 4
elegida): 🥇🥈🥉, fondos dorado/plata/bronce, puestos y estrellas.

## Versionado

- `package.json` 348.0.0 · visible `v348` · caché `appi-v348-sin-carta-medalla`.
