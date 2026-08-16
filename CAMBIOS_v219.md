# APPI v219 · Que el dictado entienda de verdad

Corrección de la nota de voz de v218: en Android la transcripción no se parecía a lo dictado.

## Qué estaba pasando

El síntoma reportado fue: en Android Chrome no aparecía texto mientras se hablaba y la nota final salía equivocada. Ese detalle fue la pista, porque Android Chrome **sí** tiene dictado en vivo: si no se veía texto, el dictado nunca había arrancado y todo caía en el respaldo, que era la parte más débil del sistema.

Tres causas encadenadas:

1. **Le peleábamos el micrófono al dictado.** v218 abría el `MediaRecorder` con `getUserMedia` *antes* de encender el reconocimiento de voz. En Android el dictado necesita el micrófono para él solo: al encontrarlo ocupado, no arrancaba.
2. **El modelo de respaldo era el más chico que existe.** `Xenova/whisper-tiny` es rápido pero impreciso en español rioplatense, y era justo el que terminaba haciendo todo el trabajo.
3. **Había 450 ms muertos al arrancar.** Se esperaba un "handshake" con el micrófono antes de pasar el botón a rojo, así que se perdía el comienzo de la frase.

## Qué cambia

- **El dictado toma el micrófono primero y en exclusiva.** Ya no se abre un `MediaRecorder` en paralelo: mientras el dictado en vivo funcione, es el único que escucha. Es el que mejor entiende porque usa el reconocimiento del sistema operativo.
- **Arranque instantáneo.** El botón pasa a rojo en el mismo gesto, sin esperas. No se pierde la primera palabra.
- **Respaldo mejor.** Cuando hay que transcribir audio, ahora se usa `Xenova/whisper-base` en lugar de `whisper-tiny`: bastante más preciso en español (~145 MB, se descarga una sola vez y queda cacheado).
- **Idioma del dispositivo.** El dictado usa `navigator.language` cuando es español (respeta es-AR, es-MX, etc.) en lugar de forzar es-AR siempre.
- **Reintento ante cortes de red.** El error `network` reintenta hasta 3 veces antes de rendirse, en lugar de caer al respaldo de una.

## Redes de seguridad nuevas

- **Dictado mudo (el caso Android).** Si el reconocimiento dice estar activo pero no entrega una sola palabra en 1,5 segundos, arranca la grabación de audio en paralelo para no perder la nota. Es la falla más difícil de detectar porque no emite ningún error.
- **Dictado caído a mitad.** Un vigía cada 500 ms levanta el respaldo por audio si el reconocimiento se rompe mientras se habla.
- **Permiso denegado con dictado presente.** Antes la app se quedaba en rojo "grabando" la nada. Ahora corta en el acto y explica cómo habilitar el micrófono.
- **Respaldo imposible.** Si el dictado falla y además no se puede grabar, se corta con el mensaje del error real en vez de seguir en falso.
- **Sin texto ni audio útil.** Mensaje claro y ninguna nota vacía.

## Detalle técnico

- `vStartRecognition()` devuelve el reconocedor (antes un booleano) y expone `onstart`; nuevas banderas `vRecogDenied`, `vRecogAlive`, `vRecogRetries`, `vArrancandoRespaldo`.
- `vStartBackupRecorder()` — abre `getUserMedia` + `MediaRecorder` solo cuando hace falta; guarda el motivo del fallo en `vLastMicError`.
- `vAbortVoiceNote(mensaje)` — corte limpio desde cualquier punto: detiene grabador, reconocedor, stream y temporizadores.
- `keepStopVoiceNote()` — espera el cierre del reconocimiento (hasta 1,6 s) para no perder el último tramo, y recién ahí decide entre dictado y audio.
- El respaldo por audio ya no exige `!vRecogFailed` para usar el texto del dictado: si hubo texto, se usa.
- `MODELO_ASR = 'Xenova/whisper-base'` en el módulo de transcripción.

## Pruebas

`tests/e2e/appi.spec.js`, tres pruebas nuevas sobre el arreglo:

- con dictado disponible **no se abre un segundo micrófono** (`getUserMedia` no se llama ni una vez) y la nota se crea igual;
- si el dictado **se cae** con error, el respaldo por audio salva la nota;
- si el dictado **queda mudo** sin dar error (caso Android), el respaldo entra igual y rescata la nota.

Las tres se validaron por mutación: se reintrodujo cada bug a mano (grabar siempre, no levantar respaldo, ignorar el caso mudo) y las tres pruebas fallaron como corresponde.

También se corrigieron los simuladores de `MediaRecorder` de la suite, que emitían objetos falsos en lugar de `Blob` reales y tapaban el camino del respaldo.

Suite completa de Playwright: **35 aprobadas**.

## Si aun así falla

El dictado del navegador depende del reconocimiento de Google en Android. Si sigue sin acertar, el siguiente paso es cargar una clave de OpenAI en Ajustes: `transcribeBlobToText` ya la usa primero cuando existe (`openai_api_key`) y Whisper-1 online es notablemente más preciso que cualquier modelo local.

## Pendiente para la próxima versión

- Horario configurable del resumen diario de Mi Gestión.
- Aviso inmediato al recibir una encuesta nueva.
