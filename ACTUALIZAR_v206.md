# APPI v206 · Dispositivos y planillas estables

## Cambios incluidos

- Los diálogos de vinculación y desvinculación ahora aparecen por encima del panel de dispositivos.
- El panel cierra correctamente “Mi cuenta” antes de abrirse.
- Las acciones tienen estados de carga, reintento y mensajes de resultado.
- Cada teléfono muestra un botón visible **Desvincular dispositivo**.
- Al desvincular se eliminan del backend el endpoint y las claves Web Push, y se cancelan solicitudes pendientes.
- La validación de planillas acepta formatos equivalentes del mismo DIP:
  - sucursal sin cero inicial, como `2-98020174`, para una cuenta `02-98020174`;
  - número solo o DIP completo;
  - sucursales con ceros adicionales;
  - encabezados como `DIP`, `D.I.P.`, `DIP Nro.:` o `DIP N°:`;
  - etiqueta y número ubicados en celdas separadas;
  - perfiles antiguos cuyas columnas separadas quedaron desactualizadas, usando `dip` como identidad canónica.
- Se siguen rechazando números o sucursales realmente pertenecientes a otra cuenta.

## Actualización del frontend

Publicar todos los archivos de la revisión v206. El nuevo caché es:

```text
appi-v206-dispositivos-planillas
```

Al recargar la PWA, el Service Worker reemplazará el caché anterior.

## Actualización de Supabase

### 1. Validación de planillas

Ejecutar en el SQL Editor:

```text
SUPABASE_VALIDAR_PLANILLAS.sql
```

Es idempotente y reemplaza las funciones/triggers anteriores.

### 2. Desvinculación completa de dispositivos

La revisión incluye `.github/workflows/deploy-device-bridge.yml`. Al publicar en `main`, GitHub desplegará automáticamente la Edge Function autenticada si el repositorio tiene configurado este secreto:

```text
SUPABASE_ACCESS_TOKEN
```

El token se crea en <https://supabase.com/dashboard/account/tokens> y debe guardarse directamente en GitHub Actions Secrets. Nunca debe pegarse en el código ni en un chat.

También puede ejecutarse manualmente desde GitHub Actions mediante **Publicar puente de dispositivos → Run workflow**.

No se requieren tablas nuevas para esta actualización.

## Verificación

```bash
npm ci
npx playwright install --with-deps chromium
npm test
```

La prueba de dispositivos comprueba ahora:

- botón visible de desvinculación;
- diálogo por encima del panel;
- confirmación;
- llamada al backend;
- desaparición del dispositivo de la lista;
- mensaje final de éxito.

La prueba de autenticación comprueba formatos alternativos válidos del DIP y rechaza otra sucursal u otro número.

## Validación con el archivo real

Antes de considerar cerrado el incidente de la planilla, conviene repetir la carga con el archivo que produjo el falso rechazo. No debe editarse el archivo para la prueba: la finalidad es verificar su formato original.
