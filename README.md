# APPI

PWA local-first para planificación mensual, presupuesto, equipo, garantías, contactos, notas, grabadora, Histórico, encuestas y gestión de referidos.

## Estado actual

- Versión: **v217 · Enviar encuesta**.
- Publicación: [https://somospopups.github.io/appi/](https://somospopups.github.io/appi/)
- Acceso por número de distribuidor y contraseña.
- Acceso administrador POPUPS mediante el candado, sin DIP ni número de distribuidor.
- Autenticación, datos, membresías, solicitudes y archivos mediante Supabase.
- Sincronización automática por cuenta.
- Funcionamiento offline por hasta 7 días desde la última validación.
- Grabaciones de audio locales: no se suben a la nube.

## Notas Keep

La pantalla tiene un solo control principal: el botón del micrófono. Se toca, se habla y se vuelve a tocar; APPI escribe la nota, le pone título y color, y la guarda sola. El título sale de la primera oración cuando el dictado es largo; si es corto, la nota queda sin título. El color rota por la paleta.

El texto se obtiene con el dictado del navegador, que lo muestra en vivo mientras se habla. El dictado usa el micrófono en exclusiva: mientras funciona no se graba audio en paralelo, porque en Android eso impide que arranque. Si el navegador no lo soporta, si falla o si queda mudo más de 1,5 segundos, APPI graba el audio y lo transcribe con la IA local de la Grabadora (`Xenova/whisper-base`). El audio es solo un paso intermedio: no se guarda.

Si se carga una clave de OpenAI en `openai_api_key`, la transcripción de respaldo la resuelve Whisper online, que es más preciso.

La grabación se corta sola a los 3 minutos, los toques de menos de 0,7 segundos se descartan y los errores de micrófono se explican en pantalla. El enlace **Escribir a mano** crea una nota en blanco y abre el editor. Todo queda en el dispositivo.

## Mi Encuesta y Mi Gestión

Desde **Mis herramientas → Mi Encuesta**, la pantalla es un solo botón: **Enviar encuesta**. Al tocarlo, APPI crea la invitación, muestra la animación de envío y abre WhatsApp con el mensaje listo, donde el distribuidor elige el contacto desde su propia agenda. Cada toque genera una invitación privada diferente, que vence en 24 horas, queda ligada al primer dispositivo que la abre y acepta una sola respuesta.

La persona responde sin crear una cuenta y los datos se registran automáticamente en **Mi Gestión** del distribuidor que la invitó.

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

## Titular y socio

Una cuenta puede tener un titular y, opcionalmente, un socio. Ambos usan el mismo número de distribuidor, contraseña y membresía. Después de ingresar, APPI pregunta **¿Quién sos?** y abre el espacio de la persona elegida.

- El Home saluda con **Hola + nombre**.
- Planificación, presupuesto, Siete Pasos, ruedas, contactos, notas e Histórico son personales.
- Mi Equipo y Garantías cargados mediante Excel se comparten.
- Mi Encuesta y Mi Gestión también se comparten; cada invitación conserva el nombre de quien la envió.
- La Grabadora continúa siendo local en cada dispositivo.
- Cada persona puede vincular un teléfono; las llamadas van al teléfono de la persona activa.
- Las cuentas sin socio ingresan directamente como titular.

## Puente de llamadas entre dispositivos

Desde el **engranaje → Vincular teléfono**, una PC o tablet muestra automáticamente un QR y un código de seis dígitos. Cada integrante de la cuenta puede vincular su propio teléfono. Cuando la persona activa ya tiene uno, el engranaje muestra **Desvincular teléfono** y solicita una confirmación simple con **Sí** o **No**.

Al tocar **Llamar** desde Mi Gestión en PC o tablet:

- se envía una notificación privada identificada con el ícono de APPI;
- en Android, la insignia pequeña utiliza una “A” blanca sobre fondo transparente para evitar el cuadrado blanco;
- la solicitud vence en dos minutos;
- el teléfono muestra el contacto y requiere confirmación;
- al aceptar, abre el marcador nativo;
- la actividad y su resultado quedan registrados en Mi Gestión.

En iPhone, APPI debe instalarse en la pantalla de inicio para recibir Web Push. En Android funciona como PWA o desde Chrome con notificaciones autorizadas.

## Recordatorios de Mi Gestión

El mismo teléfono vinculado recibe dos avisos automáticos, sin permisos ni vinculaciones adicionales:

- **Resumen diario a las 9:00**: nuevos, seguimientos del día, vencidos, presentaciones y encuestas recibidas el día anterior, en una sola notificación. Si no hay nada pendiente, no llega nada.
- **Aviso 30 minutos antes de cada presentación** que tenga hora cargada.

Al tocar el resumen se abre Mi Gestión en la vista **Hoy**; al tocar un aviso de presentación se abre ese contacto. El destino se conserva durante el ingreso y la elección de titular o socio.

La hora de la presentación es un campo opcional dentro del detalle del contacto. Titular y socio reciben el resumen de la cuenta en su propio teléfono.

Instalación del backend:

1. Ejecutar `SUPABASE_RECORDATORIOS.sql` en el SQL Editor.
2. Guardar `appi_project_url` y `appi_service_role_key` en Vault.
3. Desplegar `recordatorios-gestion`.

Archivos relacionados:

- `SUPABASE_RECORDATORIOS.sql`
- `supabase/functions/recordatorios-gestion/index.ts`
- `service-worker.js`
- `gestion-client.js`

Archivos relacionados:

- `device-bridge.js`
- `qr-code.js`
- `SUPABASE_DISPOSITIVOS.sql`
- `supabase/functions/dispositivo-puente/index.ts`

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
- `device-bridge.js`: vinculación y solicitudes de llamada entre dispositivos.
- `qr-code.js`: QR local para vincular teléfonos (MIT).
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
