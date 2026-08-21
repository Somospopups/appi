# APPI v294 · Modo PRUEBA de 5 días

## Qué cambia

**Las píldoras de creación de cuentas quedaron en dos:** `1 mes` y
`🧪 PRUEBA · 5 días`. Las de 3 y 6 meses se retiraron. El mismo par de
opciones aparece al aprobar una solicitud de acceso.

**La PRUEBA dura 5 días calendario** contando el día de activación: vence a
la medianoche (hora argentina) del quinto día.

## La franja roja constante

Quien usa una cuenta en modo PRUEBA ve una **franja roja fija arriba, en
todas las pantallas, sin botón de cerrar** (`prueba-banner.js`):

- `🔴 VERSIÓN DE PRUEBA · Te quedan 4 días de uso`
- El último día pasa a horas: `Te quedan 7 horas de uso`
- Se actualiza sola cada minuto y desaparece sola si la cuenta deja el modo
  prueba (pago o prórroga).

Al vencer, el ingreso queda bloqueado con su propio mensaje: *"Tu período de
PRUEBA de APPI terminó. Contactá a administración para activar tu membresía."*

## Poner a prueba cuentas ya creadas

Cada carpeta del panel tiene la píldora **🧪 Prueba 5 días**: previa
confirmación (la membresía vigente se pisa), la cuenta pasa a PRUEBA en el
momento. Las cuentas en prueba muestran el badge rojo `🧪 PRUEBA · XD`.

## Cómo sale una cuenta del modo prueba

Registrar un **pago** o una **prórroga** la convierte en cuenta normal
automáticamente (trigger en la base): la franja roja desaparece sola.

## Nueva migración `SUPABASE_PRUEBA.sql`

- Columna `appi_perfiles.membresia_prueba` (el check de `membresia_meses`
  no se toca: la prueba usa `null`).
- `appi_admin_activar_prueba(uuid)` y `appi_admin_lista_pruebas()`: solo
  responden al rol `admin`.
- Trigger `appi_perfiles_prueba_paga`: cualquier cambio de vencimiento que
  no venga de la propia RPC saca a la cuenta del modo prueba.

> ⚠️ Hay que correr `SUPABASE_PRUEBA.sql` en Supabase. Hasta entonces: el
> panel funciona sin badges, la píldora 🧪 avisa el error con claridad y el
> login usa el bloqueo genérico. Nada se rompe por el orden del despliegue.

## App Shell y caché v294

- Versión del paquete: `294.0.0` · visible `v294` · caché `appi-v294-modo-prueba`
- `prueba-banner.js` entra al App Shell del Service Worker.
