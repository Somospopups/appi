# APPI

PWA local-first para planificación mensual, presupuesto, equipo, garantías, contactos, notas, grabadora, Histórico, encuestas y gestión de referidos.

## Estado actual

- Versión: **v204 · Gestión inteligente**.
- Publicación: [https://somospopups.github.io/appi/](https://somospopups.github.io/appi/)
- Acceso por número de distribuidor y contraseña.
- Acceso administrador POPUPS mediante el candado, sin DIP ni número de distribuidor.
- Autenticación, datos, membresías, solicitudes y archivos mediante Supabase.
- Sincronización automática por cuenta.
- Funcionamiento offline por hasta 7 días desde la última validación.
- Grabaciones de audio locales: no se suben a la nube.

## Mi Encuesta y Mi Gestión

Desde **Mis herramientas → Mi Encuesta**, cada distribuidor genera una invitación privada diferente para cada envío por WhatsApp. La invitación vence en 24 horas, queda ligada al primer dispositivo que la abre y acepta una sola respuesta. La persona responde sin crear una cuenta y los datos se registran automáticamente en **Mi Gestión** del distribuidor que la invitó.

Mi Gestión incluye:

- Vista **Hoy** con nuevos, seguimientos, vencidos y presentaciones.
- Prioridad automática y motivos visibles basados en estado y respuestas.
- Embudo comercial y resultados mensuales.
- Encuestados y referidos.
- Mensajes de WhatsApp preparados según cada situación.
- Registro del resultado al volver de WhatsApp o una llamada.
- Historial cronológico de actividades.
- Seguimientos y presentaciones programadas.
- Búsqueda, filtros, notas, llamada, WhatsApp y exportación CSV.
- Selección de referidos desde la agenda en navegadores compatibles, con carga manual como alternativa.
- Cola de invitaciones privadas individuales para varios destinatarios.
- Copia local y cola de cambios cuando no hay conexión.
- Aislamiento mediante RLS por `user_id`.

Instalación del backend:

1. Ejecutar `SUPABASE_ENCUESTAS_GESTION.sql` en el SQL Editor.
2. Desplegar `encuesta-publica` sin verificación JWT:

```bash
supabase functions deploy encuesta-publica --no-verify-jwt
```

La función valida el enlace, la membresía, el contenido, el consentimiento y los referidos antes de registrar los datos.

## Desarrollo y pruebas

Requisitos: Node.js 20+, Python 3 y Chromium de Playwright.

```bash
npm ci
npx playwright install --with-deps chromium
npm test
```

La suite cubre la aplicación, autenticación, aislamiento por cuenta, solicitudes, membresías, planillas, Mi Encuesta y Mi Gestión.

## Archivos principales

- `index.html`: aplicación principal.
- `encuesta.html`: formulario público responsive.
- `gestion-client.js`: Mi Encuesta y Mi Gestión dentro de APPI.
- `auth-config.js`: configuración pública de Supabase.
- `auth-client.js`: login y sesión.
- `data-sync.js`: sincronización local/nube.
- `appi-dialog.js`: diálogos visuales APPI.
- `SUPABASE_INSTALACION_COMPLETA.sql`: instalación consolidada.
- `SUPABASE_ENCUESTAS_GESTION.sql`: módulo de encuestas y CRM.
- `supabase/functions/encuesta-publica/index.ts`: recepción pública segura.

## Seguridad y privacidad

- Los distribuidores sólo acceden a sus propios registros.
- Las respuestas públicas ingresan mediante una Edge Function; el navegador anónimo no escribe directamente en las tablas.
- Cada invitación vence en 24 horas, se reclama desde un solo dispositivo y queda inutilizada después del envío.
- Los referidos son opcionales y requieren confirmación de autorización.
- Se normalizan teléfonos y se evitan contactos duplicados por distribuidor.
- La clave `service_role`, los tokens personales y claves de proveedores externos nunca deben incluirse en el frontend ni en GitHub.
- No deben agregarse `alert()`, `confirm()` ni `prompt()` nativos. Usar siempre `APPIDialog`.

## Publicación

La rama `main` se publica mediante GitHub Pages. En cada release:

1. Actualizar la versión visible y `package.json`.
2. Cambiar `CACHE_NAME` en `service-worker.js`.
3. Ejecutar `npm test`.
4. Integrar a `main` y revisar GitHub Actions.
