# APPI v315 · El aviso de Bonus vive en Mi Equipo

## Qué cambia

Las tarjetas de **OPORTUNIDAD DE BONUS** ("Ana está en 11,2 PB…") dejan
el Home y pasan a la pantalla de **Mi Equipo**, que es donde tienen
sentido: aparecen **después del título y antes de los botones**, con una
entrada animada en cascada (cada aviso se desliza hacia arriba con un
toque de rebote, uno tras otro).

- El Home queda más despejado: el mazo de notificaciones ya trae la
  tarjeta de Oportunidades con el WhatsApp directo, así que nada se
  pierde.
- Al abrir Mi Equipo, los avisos se repintan frescos.
- Los botones WhatsApp / Llamar de cada aviso siguen igual, y el aviso
  sigue desapareciendo cuando contactás a la persona.

## Pruebas

`avisos-duplicados.spec.js` ahora exige que el aviso de Bonus exista
una sola vez y viva en Mi Equipo (y que el Home no lo tenga).

## App Shell y caché v315

- `315.0.0` · visible `v315` · caché `appi-v315-bonus-en-equipo`
