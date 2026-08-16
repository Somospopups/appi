# APPI v221 · Elegir con qué WhatsApp se envía

## El problema

Un distribuidor con **WhatsApp y WhatsApp Business** en el mismo teléfono reportó que APPI le abría siempre Business, cuando él quería usar el común.

No era un error de APPI: los enlaces `wa.me` son enlaces web normales, y Android se los entrega a la aplicación que esté marcada como predeterminada para abrir esos links. Si Business tomó ese lugar, se lleva todos los mensajes. Se puede cambiar en los ajustes de Android, pero es un camino largo y distinto en cada marca de teléfono, y además hay distribuidores que necesitan justo lo contrario.

## La solución

APPI ahora nombra explícitamente la aplicación al abrir WhatsApp.

- En **Android** se usa un enlace `intent://` que incluye el paquete exacto: `com.whatsapp` para el común y `com.whatsapp.w4b` para Business. El teléfono ya no decide.
- En **iPhone y computadora** no hay ambigüedad, así que se mantiene `wa.me` de siempre.
- Si la aplicación elegida no estuviera instalada, el intent lleva un `browser_fallback_url` al `wa.me` original: nunca queda un botón muerto.

## Cómo lo ve el distribuidor

- **La primera vez que envía** un mensaje desde APPI en Android aparece un diálogo: *"¿Con cuál WhatsApp?"*, con las dos opciones. Queda recordado.
- **Para cambiarlo**: menú ⚙️ → *"Enviar por WhatsApp"* (el ítem muestra cuál está activo). El ítem solo aparece en Android, donde tiene sentido.
- **Si cancela** el diálogo, el mensaje se envía igual por el camino de siempre y se vuelve a preguntar la próxima vez. No queda trabado.
- Quien tenga una sola aplicación de WhatsApp elige una vez y no lo piensa nunca más.

## Detalle técnico

Nuevo archivo `whatsapp-app.js` con `window.APPIWhatsApp`:

- `abrir(url, {popup})` — abre respetando la preferencia. Acepta una pestaña ya abierta dentro del gesto del usuario, para no perder el permiso de ventanas emergentes (lo usa Mi Encuesta).
- `construir(url, app)` — arma el `intent://` o el `wa.me` según plataforma y preferencia.
- `partirEnlace(url)` — separa número y texto de `wa.me/...`, `wa.me/?text=` y `api.whatsapp.com/send?phone=`.
- `preferencia()` / `setPreferencia(v)` — leen y escriben `appi_whatsapp_app` (`normal` | `business`).
- `elegirDesdeAjustes()` — diálogo desde el menú ⚙️.
- **Interceptor global de clics**: cualquier `<a>` que apunte a `wa.me` o `api.whatsapp.com` pasa por la preferencia sin tocar cada pantalla. Cubre los enlaces que se generan dinámicamente en Mi Gestión, Contactos, Equipo e Histórico, y también los que se agreguen en el futuro. Se puede excluir un enlace con `data-no-wa-intent`.

Se reemplazaron 16 llamadas `window.open('https://wa.me/...')` por `APPIWhatsApp.abrir(...)` en `index.html`, `account-request.js` y `admin-panel.js`. El envío de Mi Encuesta en `gestion-client.js` pasa su popup al módulo.

`whatsapp-app.js` se agregó al `APP_SHELL` del service worker para que funcione sin conexión.

## Pruebas

Nueva suite `tests/e2e/whatsapp-app.spec.js`, 8 pruebas:

- fuera de Android se mantiene el `wa.me` de siempre;
- en Android se arma el intent con el paquete correcto de cada aplicación, con texto y `browser_fallback_url`;
- `partirEnlace` entiende los cuatro formatos de enlace que usa la app;
- la preferencia se guarda, sobrevive a recargar y rechaza valores inválidos;
- la primera vez pregunta y guarda; la segunda ya no pregunta;
- si cancela, el mensaje se envía igual y no se guarda preferencia;
- los enlaces `<a>` de WhatsApp se interceptan solos y los que no son de WhatsApp no se tocan;
- fuera de Android el interceptor no actúa.

Las pruebas se validaron por mutación: ignorar la preferencia, no recordar la elección y desactivar el interceptor hacen fallar a su prueba correspondiente.

Suite completa de Playwright: **35 aprobadas**.

## Pendiente para la próxima versión

- Horario configurable del resumen diario de Mi Gestión.
- Aviso inmediato al recibir una encuesta nueva.
