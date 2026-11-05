# APPI v908 · La caja de Appi, más clara

Sólo mejoras: nada de lo que ya funcionaba se quitó.

## Por qué

Con el recorrido de la v907 quedaron **dos** filas que explicaban la misma
pantalla ("¿Qué hay en mi pantalla?" y "¿Cómo funciona esta pantalla?"). El
propietario lo marcó en una captura y pidió:

> *"fijate que esta opción está repetida, quítala y verifica los espacios entre
> las opciones que aparecen, porque la primera está muy pegada al buscador"*

Y además:

> *"me gustaría que saques el APPI de abajo del personaje y pongas arriba de
> todo «Appi está lista para ayudarte»"*

## Qué cambió

- **Una sola puerta a la explicación de la pantalla.** Se quitó la fila
  *"¿Cómo funciona esta pantalla?"* (y su botón `#appiHelpRow`): la explicación
  completa es el recorrido de *"¿Qué hay en mi pantalla?"*. La ayuda propia de
  cada pantalla sigue existiendo en la app, pero ya no se ofrece duplicada
  adentro de la caja.
- **Arriba de todo dice "Appi está lista para ayudarte"**, con el punto verde.
  La frase reemplaza a la etiqueta en mayúsculas *"LISTA PARA AYUDARTE"* (y
  vuelve a aparecer cada vez que Appi termina una respuesta: *Pensando y
  buscando*, *¡Listo!*, *Encontré algo interesante*, *Necesito tu atención* son
  los otros estados).
- **Se fue el cartelito con el nombre *Appi*** que estaba debajo de la gotita:
  el personaje queda limpio y el nombre aparece en el saludo y en el título de
  la caja.
- **Aire entre las opciones:**
  - 11 px entre el buscador y la primera opción (antes: 0, quedaba pegada),
  - 12 px entre esa opción y el título de la sección,
  - 8 px entre una opción y la siguiente (antes: 6),
  - el título de la sección se acomoda con su nuevo margen (4 px arriba).
- **Nada más se movió:** el buscador, los accesos de siempre, el botón de
  escuchar, el recorrido y el cierre con ×, Escape o tocando afuera quedan
  igual.

## Versión

- `version`: **908.0.0**
- Cache del Service Worker: `appi-v908-lista-para-ayudarte`
- Pie de la app: **APPI · v908 · Segura**
- Archivos táctiles: `appi-assistant.js` (estado de arriba, sin cartelito, sin
  la fila repetida), `appi-assistant.css` (espacios y tipografía del estado),
  `index.html`, `service-worker.js`, `package.json`

## Pruebas

- Se actualizó `appi-assistant.spec.js`:
  - la caja ya no muestra *"¿Cómo funciona esta pantalla?"* y `#appiHelpRow`
    no existe más,
  - **una sola** opción de la caja habla de la pantalla,
  - arriba dice *"Appi está lista para ayudarte"* y no hay `.appi-chip`.
- Suites: **13/13** Appi, **6/6** recorrido, **7/7** gotita, **9/9** buscador,
  **5/5** caché.
