# APPI v299 · El panel de administración también tiene su "?"

## Qué cambia

Auditoría a pedido del equipo: de las 24 pantallas de APPI, 23 tenían su
botón de ayuda "?" con la guía correspondiente, todos conectados y
funcionando. La única sin guía era, irónicamente, el **panel de
administración**.

Desde v299 el panel tiene su "?" arriba, con la guía completa de las
secciones: crear cuenta (1 mes / 🧪 PRUEBA), solicitudes pendientes,
carpetas de cuentas con todos sus botones (personas, contraseña,
prórroga, pago, prueba, bloquear, eliminar), cumplimiento diario y el
WhatsApp de soporte.

## Pruebas

`prueba.spec.js` suma la verificación: el botón existe y la guía nombra
las secciones nuevas (PRUEBA y Cumplimiento diario).

## App Shell y caché v299

- `299.0.0` · visible `v299` · caché `appi-v299-ayuda-del-admin`
