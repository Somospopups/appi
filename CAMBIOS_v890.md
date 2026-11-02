# APPI v890 · Compartir rankings como imagen

## Resultado visible

- En Histórico, los botones **Personal** y **Organización** conservan su toque normal para cambiar el ranking mostrado.
- Al mantener presionado cualquiera de los dos botones, APPI prepara una imagen PNG del ranking correspondiente.
- La imagen conserva el cierre elegido, el titular, el Top 10, los puestos, los nombres, las categorías, los colores y los PB.
- La pantalla incluye una indicación visible: **“Mantené presionado”**, para que la función no dependa de descubrir un gesto oculto.
- En dispositivos compatibles se abre el menú nativo de compartir con el PNG listo; desde allí se puede elegir WhatsApp.
- Si el dispositivo no admite compartir archivos, APPI descarga automáticamente el PNG e indica que debe adjuntarse en WhatsApp.
- La pulsación prolongada muestra una barra de progreso y no cambia el ranking activo.

## Aislamiento mensual

- El archivo se genera únicamente con los datos del cierre seleccionado.
- Personal usa el PB personal del mes y Organización usa el PB total guardado para cada organización.
- El nombre del PNG identifica el modo y el período, por ejemplo `APPI_Ranking_Organizacion_2026-10.png`.

## Validación

- La prueba focalizada verifica el PNG de Personal mediante el menú nativo simulado.
- También verifica la descarga alternativa del PNG de Organización cuando compartir archivos no está disponible.
- Se comprobó visualmente un PNG real de 1080 píxeles de ancho generado por APPI.

## Integración

- Base pública al comenzar: `265b40580d0704aeb160a8ae0823796558bff93c`.
- No se realizó push desde el agente.

## Versión

- Versión: `890.0.0`
- Caché: `appi-v890-compartir-ranking`
