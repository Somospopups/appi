# APPI v265 · Compartir APPI desde el engranaje

APPI v265 agrega un botón visible **📤 Compartir APPI** dentro del menú del engranaje, en celular, tablet y PC. El Centro de Acción de v264 y el álbum anual de doce meses de v263 se conservan intactos.

## Botón Compartir APPI

El ítem vive en el menú ⚙️, inmediatamente después de **Modo noche**. Está siempre visible, cierra el menú antes de abrir WhatsApp y usa el mismo diseño que el resto de las opciones, en modo claro y oscuro.

## Apertura directa de WhatsApp

Al tocarlo, APPI abre **específicamente WhatsApp**. No usa `navigator.share`. Respeta la preferencia ya existente:

- WhatsApp normal
- WhatsApp Business

## Selector de contactos sin destinatario fijo

El enlace **no incluye** `phone=` ni un destinatario preseleccionado. WhatsApp muestra el listado de contactos o conversaciones para que la persona elija a quién enviarlo.

- En Android se usa el mecanismo actual de `window.APPIWhatsApp`: `intent://send?text=MENSAJE` con el paquete `com.whatsapp` o `com.whatsapp.w4b`.
- En iPhone, PC y otros dispositivos se usa `https://wa.me/?text=MENSAJE`.

## Mensaje fijo con la landing

El texto queda listo para que el usuario confirme el envío. APPI **nunca lo envía automáticamente**. El mensaje incluye la landing y no agrega “escribime”, “te cuento cómo funciona”, el nombre del distribuidor ni ningún teléfono:

```
¡Hola! 😊 Quiero compartirte APPI, una app pensada para ayudar a organizar el negocio, planificar el mes y tener siempre claro cuál es el próximo paso.

Es simple, práctica y acompaña la actividad diaria.

Conocela acá:
https://somospopups.github.io/appi-landing/
```

## App Shell y caché v265

- Versión del paquete: `265.0.0`
- Versión visible y registro del Service Worker: `v265`
- Caché: `appi-v265-compartir-appi`
- `historico.js` y `historico.css` continúan embebidos exactamente una vez en `index.html` y sincronizados con sus archivos fuente.
