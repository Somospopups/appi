# APPI v305 · El mazo, pulido

Ajustes pedidos por el equipo después de probar el mazo de v304.

## Tarjetas del mismo tamaño

Todas las tarjetas miden exactamente igual (alto fijo, contenido con
scroll interno y el botón anclado abajo): el mazo se ve parejo y
prolijo, tenga la tarjeta mucho o poco para decir.

## La ✗ en la punta de cada tarjeta

El botón de cerrar dejó el encabezado del overlay y ahora vive en la
punta derecha de **cada tarjeta**, como corresponde: cierra las
notificaciones y deja el Home limpio (el 🔔 las trae de vuelta).

## Deslizar suave, limpio y desde cualquier parte

- El arrastre arranca desde **cualquier punto de la tarjeta**, botones
  incluidos: si el dedo casi no se mueve cuenta como toque (la ✗ y el
  botón responden normal); si se mueve, es arrastre y el toque se anula.
- La tarjeta vuela con una curva más suave (rotación y elevación leves,
  desvanecido) y **las de atrás suben a su lugar mientras tanto**, en
  una sola transición continua: nada salta, nada parpadea.
- El resorte de volver (cuando el gesto no llega) tiene un rebote más
  amable.

## Pruebas

Nueva en `home-limpio.spec.js`: todas las tarjetas miden lo mismo, cada
una lleva exactamente una ✗ y está en la punta derecha.

## App Shell y caché v305

- `305.0.0` · visible `v305` · caché `appi-v305-mazo-pulido`
