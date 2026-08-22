# APPI v307 · El cumpleaños se saluda con un toque

## El problema

Tocar la tarjeta de Cumpleaños abría Mi Equipo **vacío** (se navegaba a
la vista sin pasar por `openEquipo()`, que es quien carga y dibuja).
Y aunque abriera bien, faltaba lo importante: saludar rápido.

## Qué cambia

- **Tocar a la persona que cumple abre WhatsApp con el saludo listo.**
  - Si es de tu equipo: APPITel valida el teléfono y sale el "¡Feliz
    cumpleaños, Ana! 🎂🎉…" con el nombre de pila bien puesto.
  - Si es cliente: sale la plantilla de Cumpleaños de Mensajes — y de
    paso queda **marcada la ✓** en las acciones del día, como
    corresponde.
  - Sin teléfono válido: se abre la pantalla correspondiente, ya
    renderizada.
- El botón de la tarjeta pasa a ser **"Saludar ahora"**: saluda a la
  primera persona de la lista.
- Las tarjetas de Oportunidades y de Mi Equipo (Cultura) también abren
  Mi Equipo por la puerta correcta (`openEquipo()`): nunca más una
  pantalla vacía.
- El mazo ahora soporta **acción propia por renglón** (cada fila puede
  llevar a su propia persona, no solo a la pantalla general).

## Pruebas

Nueva en `home-limpio.spec.js`: con una cumpleañera del equipo, tocar
su renglón dispara el WhatsApp con "Feliz cumpleaños, Ana" al teléfono
correcto y el mazo se cierra.

## App Shell y caché v307

- `307.0.0` · visible `v307` · caché `appi-v307-saludo-directo`
