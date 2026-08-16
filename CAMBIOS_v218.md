# APPI v218 · Nota de voz en Notas Keep

## Qué cambia para el distribuidor

Notas Keep ahora es una sola acción: **tocar el micrófono, hablar y volver a tocar**. La nota se escribe, se titula, se pinta y se guarda sola.

Antes había que escribir el título, escribir el texto, tocar Guardar y elegir un color en un popup: cuatro pasos y dos teclados. Ahora es un botón.

## Cómo funciona

- **Botón único.** Un micrófono grande al centro de la pantalla. En reposo dice "Grabar nota"; mientras graba se pone rojo, late y muestra el cronómetro con "Tocá para terminar".
- **Se ve lo que decís.** Cuando el navegador tiene dictado en vivo (Chrome, Edge, Safari), el texto aparece en pantalla mientras se habla, con lo provisorio en gris claro.
- **Respaldo automático.** Si el navegador no tiene dictado, o el dictado falla a mitad de camino, APPI graba el audio y lo transcribe con la IA local que ya usa la Grabadora. El distribuidor no elige nada: pasa solo.
- **Título automático.** Si el dictado supera los 60 caracteres, la primera oración se convierte en título (recortada a 46 caracteres en palabra entera) y el texto completo queda en el cuerpo. Si es corto, la nota va sin título.
- **Color automático.** Rota por la paleta de ocho colores según la cantidad de notas. Se cambia después tocando la nota, como siempre.
- **Sin audio guardado.** La grabación es un paso intermedio para transcribir; no se almacena. Las notas siguen siendo texto: editable, buscable y liviano.
- **Escribir a mano.** Un enlace discreto debajo del micrófono crea una nota en blanco y abre el editor de siempre.

## Cuidados para que funcione bien

- **Toques accidentales:** menos de 0,7 segundos de grabación no crea nota y avisa "Fue muy cortito".
- **Corte de seguridad:** la grabación se detiene sola a los 3 minutos.
- **Sin permiso de micrófono:** mensaje concreto explicando que hay que habilitarlo desde el candado de la barra de direcciones. También hay mensajes propios para micrófono no encontrado y micrófono ocupado por otra aplicación.
- **Silencio:** si no se detectó voz, lo dice y no crea una nota vacía.
- **Reanudación del dictado:** Chrome corta el reconocimiento tras unos segundos de silencio; APPI lo reinicia solo mientras el botón siga en rojo.
- **Limpieza:** al terminar (o al fallar) se cierran el reconocedor, el `MediaRecorder`, el `stream` del micrófono y los temporizadores. El micrófono no queda tomado.
- **Movimiento reducido:** con `prefers-reduced-motion` se desactivan el latido y el giro.

## Detalle técnico

- `index.html` — nueva tarjeta `.keep-voice` (`#keepRecBtn`, `#keepRecLabel`, `#keepRecStatus`, `#keepRecLive`, `#keepWriteBtn`) en lugar del formulario `.keep-add`.
- Funciones nuevas: `keepStartVoiceNote`, `keepStopVoiceNote`, `keepToggleVoiceNote`, `keepNoteFromSpeech`, `keepSaveVoiceNote`, `keepWriteByHand`.
- El módulo de la Grabadora expone `window.transcribeBlobToText(blob, onProgress)`: transcribe y devuelve el texto sin tocar el estado de la Grabadora (badges, pasos ni lista de audios).
- Eliminados por obsoletos: `window.addKeep`, `window.confirmKeepColor`, los inputs `#keepTitle`, `#keepText`, `#keepColor` y el bloque muerto `#keepColors` de `initKeep()`.
- Las notas creadas por voz llevan `origen:'voz'`; el formato guardado en `appi_keep_notas` no cambió, así que las notas viejas siguen funcionando igual.

## Pruebas

Cinco pruebas nuevas en `tests/e2e/appi.spec.js`:

- la vista tiene el botón de grabar y ya no existen los campos del formulario viejo;
- `keepNoteFromSpeech` separa título y cuerpo según el largo, y `keepSaveVoiceNote` crea la nota con color y la persiste; un dictado vacío no crea nada;
- el ciclo completo con micrófono y dictado simulados: el botón pasa a rojo, muestra el texto en vivo y al segundo toque aparece la nota ya redactada;
- un toque accidental no crea notas vacías y avisa;
- sin permiso de micrófono se explica cómo solucionarlo y el botón queda utilizable.

Cada prueba se validó reintroduciendo su bug a mano para confirmar que falla cuando debe.

Suite completa de Playwright: **32 aprobadas**.

## Pendiente para la próxima versión

- Horario configurable del resumen diario de Mi Gestión.
- Aviso inmediato al recibir una encuesta nueva.
