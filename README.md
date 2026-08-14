# APPI

PWA local-first para planificación, presupuesto, equipo, garantías, contactos, notas, grabadora e Histórico mensual.

## Estado actual

La versión v187 incorpora una base de acceso por número de distribuidor, aislamiento por cuenta y sincronización mediante Supabase. El nuevo acceso permanece deshabilitado en `auth-config.js` hasta completar la configuración del servidor.

No activar `APPI_AUTH.enabled` en producción sin seguir primero [`CONFIGURAR_ACCESO.md`](./CONFIGURAR_ACCESO.md).

## Desarrollo y pruebas

Requisitos: Node.js 20+, Python 3 y Chromium de Playwright.

```bash
npm ci
npx playwright install --with-deps chromium
npm test
```

Las pruebas cubren:

- Arranque y navegación principal.
- Importación única de Garantías.
- Protección frente a XSS importado.
- WhatsApp de Usuarios.
- Estados de Contactos.
- Backup sin credenciales.
- Login por número de distribuidor.
- Separación de datos entre cuentas.
- Sesión dentro del período offline.

## Supabase

1. Ejecutar `SUPABASE_SETUP.sql`.
2. Ejecutar `SUPABASE_ACCESO.sql`.
3. Desplegar las funciones:

```bash
supabase functions deploy admin-distribuidores
supabase functions deploy historico-analisis
```

4. Crear el primer administrador siguiendo `CONFIGURAR_ACCESO.md`.
5. Configurar la URL y clave pública en `auth-config.js`.

La clave `service_role` y las claves privadas de IA deben existir solamente como secretos de Supabase.

## Datos y privacidad

- Los datos estructurados se sincronizan por `user_id` con políticas RLS.
- Histórico guarda sus archivos originales en un bucket privado.
- Las grabaciones de audio quedan únicamente en el dispositivo donde fueron creadas.
- La geocodificación de mapas consulta OpenStreetMap/Nominatim.

## Despliegue

La aplicación sigue siendo estática y compatible con GitHub Pages. `service-worker.js` limita sus operaciones a cachés con prefijo `appi-` y usa fallback HTML únicamente para navegación.
