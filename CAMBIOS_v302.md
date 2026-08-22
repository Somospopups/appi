# APPI v302 · La sesión admin cierra bien y vive solo en el panel

Dos reportes del equipo, ambos reproducidos con pruebas antes de tocar nada.

## No se podía cerrar sesión (bug real desde v299)

El botón "?" de ayuda que se agregó al panel en v299 quedó posicionado
**exactamente encima** del botón ↪ de cerrar sesión (una regla global lo
manda a la esquina derecha con `!important`). Desde entonces, cada toque
al ↪ lo recibía el "?". La prueba lo mostró textual:
`button.help-btn intercepts pointer events`.

- Ahora el orden del encabezado es **? · 🔑 · ↪**, cada uno en su lugar.
- Además, la salida quedó blindada: si la sincronización de despedida
  falla (sin internet, por ejemplo), APPI avisa y ofrece **cerrar igual**.
  La salida nunca más queda rehén de nada.

## La sesión admin no puede pasear por la app

Antes, desde el panel se podía llegar al Home y a todas las pantallas de
distribuidor. Ahora la sesión administradora vive **solo en el panel**:

- `showView` redirige cualquier intento (venga de donde venga: menú,
  código, gestos) de vuelta a `view-admin` cuando el rol es admin.
- El chrome de la app desaparece para el admin: sidebar de escritorio,
  botón ☰ Menú y pestañas quedan ocultos.

## De paso

- El badge "● 0 NUEVAS" ya no aparece cuando no hay solicitudes: el
  atributo `hidden` ahora le gana al display de la clase.

## Pruebas

`auth.spec.js` suma la prueba completa del flujo: entrar como admin,
intentar abrir el Home (rebota), verificar que el menú no está, tocar ↪,
confirmar y volver al candado.

## App Shell y caché v302

- `302.0.0` · visible `v302` · caché `appi-v302-salida-y-frontera`
