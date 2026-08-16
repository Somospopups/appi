# APPI v222 · Corrección: pantalla en blanco al enviar

Corrección de un error introducido en v221.

## Qué pasaba

Al tocar un botón de WhatsApp en el teléfono quedaba una **pantalla en blanco** en lugar de abrirse la aplicación.

La causa fue un error de implementación en v221: el enlace `intent://` se abría con `window.open(...)`, es decir en una pestaña nueva. **Un `intent://` no es una página**: el navegador no sabe dibujarlo. Lanza la aplicación, pero la pestaña que lo recibió queda vacía, y eso es lo que se veía.

Además, Mi Encuesta abría un `about:blank` dentro del gesto del usuario (necesario para que el navegador no bloquee la ventana emergente). Con el intent ese `about:blank` ya no se usa y quedaba como una segunda pestaña vacía.

## Qué cambia

- **El `intent://` viaja por la pestaña actual**, con `window.location.href`. Chrome lo intercepta, abre WhatsApp y APPI se mantiene atrás, intacta: al volver, la app sigue donde estaba. No se abre ninguna pestaña.
- **Si venía un popup del gesto, se cierra** antes de navegar, para no dejar la ventana vacía.
- **Mi Encuesta no abre `about:blank` en Android**, porque ahí el envío ya no lo necesita. En iPhone y computadora se mantiene igual, ya que ahí sí hace falta para no perder el permiso de ventana emergente.
- Los enlaces `wa.me` comunes (iPhone, computadora) siguen abriéndose en otra pestaña, que es el comportamiento correcto para ellos.

## Detalle técnico

- `whatsapp-app.js`: nueva rama en `ir(destino)` para los destinos `intent:`; se expone `APPIWhatsApp.esIntent(url)`.
- `gestion-client.js`: `startShareFlow()` calcula `usaIntent` y solo abre la ventana intermedia cuando no se usa intent.

## Pruebas

Dos pruebas nuevas que reproducen exactamente el error reportado:

- `whatsapp-app.spec.js` — *"el intent se navega en la pestaña actual, nunca en una nueva"*: verifica que no se llame a `window.open`, que no se redirija ningún popup, que el popup recibido se cierre y que la sesión quede con una sola pestaña viva.
- `whatsapp-app.spec.js` — *"un enlace wa.me normal sí puede ir a otra pestaña"*: protege el camino de iPhone y computadora, para que la corrección no lo rompa.
- `compartir-encuesta.spec.js` — *"en Android el envío no deja una pestaña en blanco"*: Mi Encuesta dispara el intent sin abrir ninguna ventana.

Validadas por mutación: se reintrodujo el bug de v221 (intent por `window.open`), la variante de mandarlo al popup, y el `about:blank` incondicional de Mi Encuesta. Las tres mutaciones hacen fallar a su prueba.

Suite completa de Playwright: **38 aprobadas**.

## Nota sobre las pruebas

El navegador no expone el fragmento `#Intent;...;end` en la URL de las peticiones, así que las aserciones verifican la parte observable (`intent://send`, `phone=...`). La construcción completa del intent, con `package=` y `browser_fallback_url`, se sigue verificando en la prueba de `construir()`, que trabaja con la cadena directamente.

## Pendiente para la próxima versión

- Horario configurable del resumen diario de Mi Gestión.
- Aviso inmediato al recibir una encuesta nueva.
