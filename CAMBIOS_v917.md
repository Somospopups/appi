# APPI v917 · Inicio móvil protegido

## Diagnóstico

La captura corresponde al splash nativo de la PWA instalada en Android, no a la pantalla interna de APPI. El teléfono todavía no había podido dibujar el primer cuadro de la web.

El Service Worker anterior priorizaba la red en la navegación, scripts y estilos. En una red móvil que muestra señal pero deja una solicitud pendiente, el navegador podía esperar sin límite. Además, cuatro hojas de estilo externas bloqueaban el primer dibujo. Por eso Android mantenía su splash aunque el servidor y la aplicación estuvieran publicados correctamente.

## Solución

- El HTML guardado se entrega inmediatamente al abrir la PWA.
- La copia de red se actualiza en segundo plano.
- Scripts y estilos guardados también se entregan antes de esperar la red.
- Todas las solicitudes críticas tienen tiempo máximo.
- Sin caché ni conexión se devuelve una pantalla recuperable, nunca una respuesta vacía.
- Una nueva versión sólo se activa si el HTML de inicio se guardó correctamente.
- Los estilos de Appi ya no bloquean el primer dibujo del navegador.

## Prueba nueva

Una prueba con Service Worker real instala APPI, corta completamente Internet y recarga. La aplicación debe responder desde caché antes del límite de 7 segundos.

## Versión

- `version`: **917.0.0**
- Pie: **APPI · v917 · Segura**
- Caché: `appi-v917-inicio-movil`
