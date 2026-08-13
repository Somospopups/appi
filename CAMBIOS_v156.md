# APPI v156 — Grabadora simple, transcripción y resumen

## Nuevo diseño compacto

La Grabadora fue rediseñada para ocupar menos espacio y presentar un único flujo de tres pasos:

1. Grabar.
2. Transcribir.
3. Resumir.

Cambios visuales:

- Consola de grabación compacta.
- Micrófono, cronómetro y controles en una misma fila en pantallas grandes.
- Tres botones claros: Grabar, Pausar/Continuar y Finalizar.
- Indicador visual del progreso.
- Transcripción y resumen en dos cuadros contiguos en escritorio.
- Una sola columna sin desplazamiento horizontal en celulares.
- Biblioteca de grabaciones plegada por defecto.
- Estados breves y visibles sin ventanas emergentes innecesarias.

## Grabación de audio

- Solicitud clara del permiso de micrófono.
- Mensajes específicos para permiso rechazado, micrófono ausente o dispositivo ocupado.
- Captura mono con cancelación de eco, reducción de ruido y control automático de ganancia.
- Formato Opus cuando el navegador lo permite.
- Grabación por fragmentos para reducir el riesgo de perder todo el audio.
- Cronómetro estable al pausar y continuar.
- Reproductor inmediato del último audio.
- Guardado persistente del archivo en IndexedDB.
- Advertencia antes de cerrar la página mientras se está grabando.

## Transcripción

Al finalizar una grabación:

- El audio se guarda primero.
- La transcripción comienza automáticamente.
- Si existe una clave de IA online configurada, se utiliza Whisper online para priorizar precisión.
- Si no existe o la conexión online falla, APPI usa Whisper Tiny de forma local.
- La primera ejecución muestra el progreso de preparación del modelo.
- El modelo queda almacenado en la caché del navegador.
- El audio se convierte a mono de 16 kHz.
- Se normaliza el volumen antes de transcribir.
- Se detectan audios sin voz o con volumen insuficiente.
- Se limpian espacios, etiquetas de ruido y repeticiones evidentes.
- Ante un error se conserva el audio y aparece la opción de reintentar.

Se eliminó la transcripción en vivo experimental del flujo principal porque podía producir ruido y resultados inestables.

## Resumen automático

El resumen se genera únicamente después de completar la transcripción.

Incluye:

- Resumen general.
- Puntos importantes.
- Próximas acciones.
- Decisiones detectadas.

También se puede corregir manualmente la transcripción y volver a crear el resumen.

## Grabaciones guardadas

Cada grabación conserva:

- Fecha y duración.
- Archivo de audio reproducible.
- Transcripción.
- Resumen completo.
- Estado de procesamiento.

Acciones disponibles:

- Abrir.
- Reproducir.
- Volver a transcribir.
- Descargar audio.
- Borrar individualmente.
- Borrar todas.

## Validaciones realizadas

Prueba integral con micrófono simulado del navegador:

- Inicio de grabación correcto.
- Cronómetro funcionando.
- Pausa y continuación correctas.
- Finalización y archivo WebM válido.
- Audio de prueba guardado: más de 22 KB.
- Reproductor del último audio visible.
- Reproductor dentro de Grabaciones guardadas.
- Transcripción automática aplicada.
- Resumen creado después de la transcripción.
- Tres pasos marcados como completados.
- Audio, transcripción y resumen restaurados después de recargar APPI.
- Modelo Whisper local cargado correctamente.
- Vista móvil de 390 px sin desplazamiento horizontal.
- Consola compacta: aproximadamente 179 px en escritorio y 251 px en celular.
- Cero errores del navegador.

## Versión técnica

- Caché: `appi-v156-grabadora-simple`.
- Pie visible: **APPI · v156 · Grabadora simple**.
