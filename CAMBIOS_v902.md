# APPI v902 · Appi animada desde el dock

## Qué cambia

- Se incorpora **Appi**, la nueva asistente personal Cute 2D elegida para la aplicación.
- Appi vive en el borde inferior derecho, detrás del dock: en reposo asoma la mirada y, al tocarla, sube completa.
- El saludo de descubrimiento aparece una sola vez por día para que sea visible sin resultar invasivo.
- La conversación se abre hacia la izquierda y queda por encima del contenido, sin cubrir los cuatro botones de navegación.

## Estados animados

Appi conserva siempre el mismo personaje, pero cambia imagen, movimiento y efectos según el contexto:

1. **Normal:** se asoma y saluda.
2. **Pensando:** inclina el cuerpo y muestra pensamientos en movimiento.
3. **Feliz:** toma impulso, salta y celebra con destellos.
4. **Sorprendida:** reacciona con volumen y una onda visual.
5. **Alerta:** se acerca, levanta la mano y emite un pulso ámbar.

La preferencia de movimiento reducido del dispositivo se respeta automáticamente.

## Voz, texto y ayuda

- El micrófono se activa únicamente cuando la persona toca **Hablar con Appi**; nunca queda escuchando en segundo plano.
- La transcripción se muestra en pantalla antes de responder.
- Si el navegador no ofrece reconocimiento de voz o no tiene permiso, siempre queda disponible la escritura.
- Appi puede leer la respuesta en voz alta cuando se toca **Escuchar**.
- Puede consultar la jornada, explicar la pantalla actual y abrir las principales secciones de APPI mediante lenguaje natural.
- Las acciones implementadas son navegación y consulta; no modifica ni elimina información sin una función y confirmación específicas.
- Esta versión no incorpora claves, tokens ni un servicio externo de inteligencia artificial.

## Compatibilidad

- En celular, Appi se integra con el dock existente.
- En escritorio continúa mandando la barra lateral y Appi no invade la pantalla.
- Incluye estilos para modo claro, modo oscuro y pantallas angostas.
- Los cinco recursos visuales se guardan en formato WebP optimizado y forman parte del App Shell offline.

## Archivos principales

- `appi-assistant.js`
- `appi-assistant.css`
- `assets/appi/normal.webp`
- `assets/appi/thinking.webp`
- `assets/appi/happy.webp`
- `assets/appi/surprise.webp`
- `assets/appi/alert.webp`
- `tests/e2e/appi-assistant.spec.js`

## Versión

- Aplicación: `902.0.0`
- Versión visible: **v902 · Appi animada**
- Caché: `appi-v902-appi-animada`
