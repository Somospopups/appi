# APPI v290 · El panel de administración deja de inventar números

## El problema (reportado con captura real)

Al avisar por WhatsApp desde el **panel de administración** (solicitud recibida
o cuenta aprobada), WhatsApp respondía:

> +549280434264454 no es un número de teléfono válido.

La migración de v289 unificó los números en `telefono.js`, pero
`admin-panel.js` conservó una función propia (`whatsappPhone`) que quedó
afuera. Esa función **agregaba dígitos sin validar el largo**:

```
+54 280 434264454  (14 dígitos, sin el 9)  ->  549280434264454  (15 dígitos: no existe)
0280 15-434-2644                            ->  280154342644    (ni siquiera empieza en 549)
```

## Qué cambia

- **`admin-panel.js`**: se eliminó `whatsappPhone`. Los avisos de
  "solicitud recibida" y "cuenta aprobada" ahora usan `window.APPITel.abrir`,
  que valida el número y, si no sirve, avisa con el nombre de la persona en
  vez de abrir un chat con un número que no existe.
- **`admin-panel.js` · Guardar WhatsApp de soporte**: el número se valida con
  `APPITel.normalizar` **antes** de guardarse. Si no es un celular argentino
  válido, no se guarda y se explica cómo cargarlo.
- **`account-request.js` · Botón de soporte**: el número configurado pasa por
  `APPITel.normalizar`. Distingue dos errores: "todavía no está configurado"
  y "está mal cargado, avisale a la persona administradora".

## Pruebas

- `telefono.spec.js` suma el caso real de la captura y variantes:
  números con dígitos de más se **rechazan**, no se completan.
- Casos válidos nuevos del área 280 (Rawson/Trelew), con y sin 15.
- Test de convención nuevo: **solo `telefono.js` puede concatenar `'549'`**.
  Si una pantalla vuelve a armar números a mano, la suite falla y muestra
  archivo y línea.

## App Shell y caché v290

- Versión del paquete: `290.0.0`
- Versión visible y registro del Service Worker: `v290`
- Caché: `appi-v290-numeros-del-panel`
