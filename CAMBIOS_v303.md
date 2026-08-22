# APPI v303 · El WhatsApp del panel y las guías que scrollean

## Los envíos del panel abren el WhatsApp correcto

El administrador tiene WhatsApp común y Business en el mismo teléfono, y
los envíos del panel (bienvenida, contraseña, avisos de solicitud) tienen
que salir siempre por el del número registrado, sin preguntar cada vez.

APPI ya tenía la preferencia normal/Business (todos los envíos del panel
pasan por ella), pero desde v302 el admin no tenía dónde configurarla:
el selector vivía en el menú de la app, que la sesión admin ya no ve.

Ahora vive en **⚙️ Configuración** del panel: dos píldoras —
📱 WhatsApp normal / 💼 WhatsApp Business — que marcan cuál está activa.
La elección vale por dispositivo (en la PC, WhatsApp Web usa la cuenta
que esté abierta: eso es de WhatsApp y ningún enlace puede cambiarlo).

## Las guías "?" ahora se pueden leer enteras

El popup de los diálogos no tenía scroll: una guía larga (como la del
panel) se desbordaba de la pantalla sin forma de deslizarla. El arreglo
es para **todos** los diálogos de APPI: la tarjeta se limita al alto de
la pantalla y el texto scrollea adentro, con los botones siempre a la
vista.

## Pruebas

- El selector existe y guarda la preferencia real de APPIWhatsApp.
- Funcional: un popup de 300 líneas scrollea y la tarjeta entra en la
  pantalla.

## App Shell y caché v303

- `303.0.0` · visible `v303` · caché `appi-v303-whatsapp-del-admin`
