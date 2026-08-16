# APPI v220 · Vuelta a las notas escritas

Se revierten las versiones v218 y v219: Notas Keep vuelve al formulario escrito que funcionaba bien.

## Motivo

La nota de voz no transcribía con la fidelidad necesaria en el uso real (Android). Se intentó corregirla en v219 dándole al dictado el micrófono en exclusiva y mejorando el modelo de respaldo, pero el resultado siguió sin ser confiable. Como una nota mal transcripta es peor que no tener la función, se vuelve al método anterior.

## Qué queda

Notas Keep funciona igual que en v217:

- Campo de título y campo de texto.
- Botón **Guardar** y elección de color en el popup.
- Tocar una nota para editarla, fijarla, enviarla o borrarla.
- Búsqueda por texto.

## Detalle técnico

- Revertidos los commits `e33c0ae` (v218) y `6824001` (v219) con `git revert`. El árbol quedó idéntico a `2604b4c`, verificado con `git diff` vacío.
- Se eliminaron: la tarjeta `.keep-voice`, `#keepRecBtn` y sus estilos, las funciones `keepStartVoiceNote`, `keepStopVoiceNote`, `keepToggleVoiceNote`, `keepNoteFromSpeech`, `keepSaveVoiceNote`, `keepWriteByHand` y el helper `transcribeBlobToText`.
- El módulo de la Grabadora vuelve a `Xenova/whisper-tiny` y queda como estaba: la Grabadora **no se vio afectada** por este cambio en ningún momento.
- Se eliminaron `CAMBIOS_v218.md` y `CAMBIOS_v219.md`.
- Las notas ya guardadas no se tocan: el formato de `appi_keep_notas` nunca cambió, así que las notas creadas por voz en v218/v219 siguen ahí y se editan con normalidad.

## Versión

Se sube a v220 en lugar de volver a v217 para que el `CACHE_NAME` del service worker cambie y los dispositivos que ya habían cacheado v218 o v219 reciban esta versión. Volver al número anterior habría dejado la nota de voz activa en esos equipos.

## Pruebas

Vuelven las pruebas originales de Notas Keep (formulario, popup de 10 colores, grilla de 5 columnas) y se retiran las cinco de la nota de voz.

Suite completa de Playwright: **27 aprobadas**.

## Pendiente para la próxima versión

- Horario configurable del resumen diario de Mi Gestión.
- Aviso inmediato al recibir una encuesta nueva.
