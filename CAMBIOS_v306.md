# APPI v306 · El mazo, a punto

Segunda ronda de ajustes con el mazo ya probado en la mano.

## Deslizar desde cualquier parte, ahora de verdad

El gesto solo funcionaba en la parte de arriba: el cuerpo de la tarjeta
es un área con scroll y el navegador se quedaba con el gesto horizontal.
Con `touch-action: pan-y` en el cuerpo, el dedo desliza la tarjeta desde
cualquier punto — arriba, abajo, sobre la lista — y el scroll vertical
interno sigue funcionando.

## Letra más grande, menos aire

Título 23px, frase 17,5px, renglones 15px, chips y notas más presentes.
Las tarjetas se sienten llenas y se leen de un vistazo.

## Tocar una tarea te lleva ahí

Cada renglón de las listas (un contacto de la jornada, un cumpleaños,
una oportunidad) ahora es tocable y **lleva directo a la pantalla**
donde se resuelve, con su flechita › a la derecha. El mazo se cierra
solo en el camino.

## "Pasar ›" al pie de la tarjeta

El botón dejó el fondo de la pantalla: ahora acompaña al mazo, pegado
abajo de la tarjeta, con la pista de uso debajo.

## La tarjeta se presenta sola

Al abrir el mazo, la primera tarjeta hace un vaivén suave hacia los
costados (1,5 s): el gesto se explica solo. Se corta apenas la tocás.

## Pruebas

Nueva en `home-limpio.spec.js`: el vaivén de demostración está presente
y tocar el renglón de Jorge en Tu jornada abre el Panel directamente.

## App Shell y caché v306

- `306.0.0` · visible `v306` · caché `appi-v306-mazo-a-punto`
