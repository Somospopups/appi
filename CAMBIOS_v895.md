# APPI v895 · Instalación directa en Android

## Cambio principal

- El botón **Tengo Android** intenta abrir inmediatamente la instalación nativa de APPI.
- Si la persona confirma, el recorrido salta la explicación manual y continúa directamente con MI PSA.
- Si APPI ya se abrió desde el ícono instalado, el paso se marca como listo automáticamente.
- Si el navegador no ofrece instalación automática, se mantiene la guía Android aprobada.
- Si la persona cancela el cartel del sistema, también se muestra la guía y puede continuar más tarde.

## Límites del sistema

- Android y navegadores Chromium compatibles siempre muestran su confirmación oficial antes de instalar.
- iPhone conserva **Compartir → Agregar a pantalla de inicio**, ya que Safari no expone una instalación automática para sitios web.

## Pruebas

- Instalación Android inmediata al tocar la tarjeta.
- Continuación directa a MI PSA después de aceptar.
- Alternativa manual cuando el navegador no ofrece la instalación.
- Recorridos completos de iPhone y Android, pasos pendientes y recarga.
- Sintaxis, versión, caché y App Shell.

## Versión

- Versión: `895.0.0`
- Caché: `appi-v895-instalacion-android-directa`
