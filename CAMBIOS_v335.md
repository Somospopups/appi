# APPI v335 — Acciones en un solo renglón + fechas más seguras

## 1) Ficha del cliente: todas las acciones en un solo renglón

- Las píldoras de cada tarjeta de usuario (tarjetas cargadas, "+ Agregar
  tarjeta", 💬 WhatsApp, 📲 Llamar, 👥 Vecinos y 🧭 ¿Cómo llego?) ahora van
  en **un solo renglón**, con deslizado horizontal si no entran.
- Se quita el botón **"💬 Avisar promo"**: la promo se manda desde Mensajes
  (o desde el popup de Tarjetas). En el Panel de Contactos se conserva.

## 2) Fechas de compra y vencimiento (revisadas)

- **Diagnóstico:** la app lee bien las fechas en texto DD/MM/AAAA. Los casos
  que "aparecen mal" vienen con años viejos escritos en la planilla (p. ej.
  `17/4/2002`, `17/10/2003` en la columna F.Compra/F.Vence): si el año está
  mal en el archivo, la app lo muestra tal cual, no lo inventa.
- **Se corrigió** un comportamiento peligroso: fechas imposibles (mes 13,
  día 32, 31/02, día/mes invertidos como 4/17) antes se "acomodaban" solas
  y quedaban como una fecha inventada (p. ej. 4/17/2022 → 5/4/2023). Ahora
  se rechazan: no se muestra una fecha que no existe.
- **Se agregó** soporte para fechas reales de Excel: si una celda viene como
  número de serie (p. ej. 44668), se convierte a DD/MM/AAAA en vez de
  mostrarse como "44668" o perderse.

## Versionado

- `package.json` 335.0.0 · visible `v335` · caché `appi-v335-acciones-en-un-renglon`.

## Pruebas

- `fechas-usuarios.spec.js` (nuevo): rechazo de fechas imposibles, conversión
  de número de serie de Excel y paso de texto.
- `mensajes-usuarios.spec.js` y `tarjetas-promos.spec.js` actualizados al
  nuevo renglón único y a la promo desde el popup de Tarjetas.
