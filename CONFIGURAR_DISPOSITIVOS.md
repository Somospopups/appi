# Configurar llamadas desde PC o tablet

## Backend

1. Ejecutar `SUPABASE_DISPOSITIVOS.sql` en el SQL Editor de `appi-produccion`.
2. Generar un par VAPID para Web Push.
3. Guardar como secretos de Supabase:

```text
VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_SUBJECT=https://somospopups.github.io/appi/
```

4. Desplegar la función autenticada:

```bash
supabase functions deploy dispositivo-puente
```

## Prueba de vinculación

1. Ingresar con un distribuidor desde PC.
2. Abrir `Mi cuenta → Teléfonos vinculados`.
3. Tocar `Mostrar QR y código`.
4. En Android, escanear el QR o abrir APPI e ingresar el código desde `Este es mi teléfono`.
5. En iPhone, instalar APPI en la pantalla de inicio, ingresar y usar el código de seis dígitos.
6. Autorizar notificaciones.
7. Confirmar que el teléfono aparezca como vinculado.

## Prueba de llamada

1. Abrir Mi Gestión en PC o tablet.
2. Tocar `Llamar en teléfono`.
3. Elegir el teléfono si hay más de uno.
4. Confirmar que llegue una notificación incluso con APPI en segundo plano.
5. Tocar la notificación y luego `Llamar ahora`.
6. Verificar que se abra el marcador nativo.
7. Al volver, registrar el resultado del contacto.

## Seguridad

- El QR y código vencen en cinco minutos.
- Sólo puede reclamarlo una sesión de la misma cuenta distribuidora.
- La solicitud de llamada vence en dos minutos.
- El teléfono siempre confirma antes de abrir el marcador.
- Push endpoints y claves del dispositivo sólo son leídos por la Edge Function.
- Los dispositivos pueden desvincularse desde Mi cuenta.
- Las claves VAPID privadas nunca deben guardarse en GitHub ni en el frontend.
