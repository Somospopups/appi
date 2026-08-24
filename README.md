# APPI

PWA local-first para planificación mensual, presupuesto, equipo, garantías, contactos, notas, grabadora, Histórico, encuestas y gestión de referidos.

## Estado actual

- Versión: **v327 · Segura**.
- Publicación: [https://somospopups.github.io/appi/](https://somospopups.github.io/appi/)
- Acceso por número de distribuidor y contraseña.
- Acceso administrador POPUPS mediante el candado, sin DIP ni número de distribuidor.
- Autenticación, datos, membresías, solicitudes y archivos mediante Supabase.
- Sincronización automática por cuenta.
- Funcionamiento offline por hasta 7 días desde la última validación.
- Grabaciones y transcripciones de audio locales: no se suben a la nube.

## Arranque con el logo de vidrio

Desde v256, todos los dispositivos abren APPI con el mismo logo de vidrio.

- `scripts/logo_vidrio.py` dibuja el logo una sola vez: fondo pastel, cartel de vidrio esmerilado y el wordmark APPI en letras heladas.
- `python3 scripts/make-splash.py` genera las 26 imágenes de arranque de iPhone y iPad, verticales y apaisadas, dentro de `splash/`.
- `python3 scripts/make-icons.py` genera los íconos del manifiesto y `apple-touch-icon.png`; Android usa el ícono para su pantalla de arranque, así que ve el mismo logo.
- Dentro de la app, la animación de carga muestra el mismo cartel de vidrio dibujado con CSS, sin descargar imágenes, en celular, tablet y PC.

Al cambiar el logo hay que regenerar ambos juegos y volver a correr `npm test`: `tests/e2e/logo-vidrio.spec.js` verifica que cada dispositivo tenga su imagen y que el arranque muestre el vidrio.

## Anuncios del administrador (v326)

Desde el panel, la sección **📣 Anuncio para todos** publica un mensaje que
todo el equipo ve como cartel al abrir APPI (reuniones por Zoom, avisos). Se
pueden sumar hasta tres reuniones con título, fecha, hora y lugar; en el
cartel, cada una trae dos botones: agendarla en el **calendario de APPI** o en
la **agenda del teléfono** (Google Calendar, o `.ics` en iPhone). La 🔔 de la
esquina vuelve a mostrar el aviso vigente. Publicar reemplaza el aviso
anterior; quitar lo apaga para todos.

- La tabla `appi_anuncios` se lee con la sesión de cada distribuidor y sólo
  se escribe mediante `SUPABASE_ANUNCIOS.sql` (RPC exclusivas del rol admin).
- Sin conexión, el teléfono muestra el último aviso que conoció.

## Mensajes propios del distribuidor (v326)

En **Mensajes** de Garantías, el botón **✍️ Crear un mensaje nuevo** suma
plantillas propias (emoji, nombre y texto) que se envían igual que las de
fábrica, aceptan los mismos comodines (`{nombre}`, `{vence}`, …) y valen para
cualquier cliente. Se editan y se borran desde la misma lista; las de fábrica
siguen pudiendo volver a su texto original.

## Con qué WhatsApp se envía

Los enlaces `wa.me` son enlaces web, así que en Android los abre la aplicación marcada como predeterminada: en un teléfono con WhatsApp y WhatsApp Business puede no ser la deseada.

APPI nombra la aplicación de forma explícita mediante un enlace `intent://` con el paquete `com.whatsapp` o `com.whatsapp.w4b`. La primera vez que se envía un mensaje en Android, la app pregunta cuál usar y lo recuerda; se cambia desde el menú ⚙️ → **¿Qué WhatsApp utilizás?**. En iPhone y computadora se usa `wa.me` normal.

Desde el mismo engranaje, **📤 Compartir APPI** abre WhatsApp con un mensaje preparado y sin destinatario fijo, para que la persona elija a quién enviarlo. El texto incluye la landing `https://somospopups.github.io/appi-landing/` y APPI nunca lo envía automáticamente.

Todo pasa por `whatsapp-app.js` (`window.APPIWhatsApp`), que además intercepta los clics en cualquier enlace a `wa.me` o `api.whatsapp.com`. Para excluir un enlace puntual se le agrega `data-no-wa-intent`.

Los enlaces `intent://` se navegan **en la pestaña actual**, nunca con `window.open`: el navegador no puede dibujar un intent y dejaría una pantalla en blanco. Los `wa.me` comunes sí se abren en otra pestaña.

## Panel de Contactos (Mi Encuesta y Mi Gestión)

Vive en **Mi negocio** y reúne encuestas y seguimiento en una sola pantalla, con las solapas **Hoy**, **Todos** y **Resultados**. Arriba, dos accesos del mismo tamaño: **Enviar encuesta** y **Agregar contacto** (formulario a la vista, con errores traducidos al lado de cada campo). La encuesta es una **herramienta de retorno**, no reemplaza el trabajo cara a cara: el contacto de verdad se genera en la demostración.

Al tocar **Enviar encuesta**, APPI crea la invitación, muestra la animación de envío y abre WhatsApp con el mensaje listo, donde el distribuidor elige el contacto desde su propia agenda. Cada toque genera una invitación privada diferente, que vence en 24 horas, queda ligada al primer dispositivo que la abre y acepta una sola respuesta.

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
2. Ejecutar `SUPABASE_MI_GENTE.sql` (v223+): agrega el interés, los estados de Contactos, el origen y la función de importación que usa **Agregar contacto**. En bases ya instaladas antes de v223, `ARREGLO_CHECKS_PANEL_CONTACTOS.sql` limpia los checks viejos que quedan apilados.
3. Desplegar `encuesta-publica` sin verificación JWT:

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
- `whatsapp-app.js`: elige entre WhatsApp y WhatsApp Business al abrir mensajes en Android.
- `anuncios.js`: carteles del administrador con botones para agendar en APPI o en el teléfono.
- `device-bridge.js`: vinculación y solicitudes de llamada entre dispositivos.
- `qr-code.js`: QR local para vincular teléfonos (MIT).
- `auth-config.js`: configuración pública de Supabase.
- `auth-client.js`: login y sesión.
- `data-sync.js`: sincronización local/nube.
- `appi-dialog.js`: diálogos visuales APPI.
- `service-worker.js`: caché offline y notificaciones Push.
- `scripts/logo_vidrio.py`: generador único del logo de vidrio del arranque.
- `splash/`: imágenes de arranque de iPhone y iPad con el logo de vidrio.
- `vendor/`: bibliotecas fijadas localmente y licencias de terceros.
- `SUPABASE_INSTALACION_COMPLETA.sql`: instalación consolidada.
- `SUPABASE_ENCUESTAS_GESTION.sql`: módulo de encuestas y CRM.
- `SUPABASE_MEMBRESIAS.sql`: acceso, prórrogas y registro seguro de pagos.
- `supabase/functions/encuesta-publica/index.ts`: recepción pública segura.
- `.github/workflows/deploy-backend.yml`: migraciones y despliegue de las Edge Functions.

## Seguridad y privacidad

- Los distribuidores sólo acceden a sus propios registros.
- Las respuestas públicas ingresan mediante una Edge Function; el navegador anónimo no escribe directamente en las tablas.
- Cada invitación vence en 24 horas, se reclama desde un solo dispositivo y queda inutilizada después del envío.
- Los referidos son opcionales y requieren confirmación de autorización.
- Se normalizan teléfonos y se evitan contactos duplicados por distribuidor.
- Supabase es el único mecanismo de acceso; no existe una activación calculada en el navegador.
- `appi_perfiles.membresia_vence` es la fuente de verdad del acceso, incluso cuando se registra un pago o una prórroga.
- La clave `service_role`, los tokens personales y claves de proveedores externos nunca deben incluirse en el frontend ni en GitHub.
- Las grabaciones y transcripciones permanecen en el dispositivo; APPI no acepta claves privadas de IA en el navegador.
- No deben agregarse `alert()`, `confirm()` ni `prompt()` nativos. Usar siempre `APPIDialog`.

## Publicación

La rama `main` se publica mediante GitHub Pages. En cada release:

1. Actualizar la versión visible y `package.json`.
2. Cambiar `CACHE_NAME` en `service-worker.js`.
3. Ejecutar `npm test` y confirmar que la suite completa esté en verde.
4. Ejecutar manualmente **Publicar backend completo de APPI** si hay migraciones o Edge Functions nuevas.
5. Integrar a `main`, revisar GitHub Actions y verificar GitHub Pages.
