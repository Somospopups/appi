# APPI v906 · Appi es el círculo del «?»

Sólo mejoras: nada de lo que ya funcionaba se quitó.

## Por qué

Después de la gotita asomada, el propietario pidió otra puerta de entrada:
*"¿y si creamos un notch animado desde el botón del signo de preguntas?"*,
con la referencia de la app de Mac **Coucou** (louis-cfm/coucou). De las tres
terminaciones que se le mostraron eligió **Crema del dock**, y pidió dos cosas
más: que la gotita aparezca dentro del cuadro *"para que la gente la conozca"*
y que *"ese circulito sea animado para que la gente lo vea y presione allí"*.

## Qué cambió

- **Se van los signos de pregunta.** Los **25** botones de ayuda de la app
  (`.help-btn` de cada pantalla y `.hs-help` del Histórico) ahora son el
  **círculo de Appi**: fondo crema, anillo celeste y su carita dibujada en SVG.
  El «?» no queda en ningún lado; `aria-label="Appi, tu asistente"`.
- **El círculo está vivo para que se note:**
  - respira (el halo crece y se achica),
  - cada 7 segundos el anillo hace un latido,
  - parpadea cada 5 segundos,
  - cada 9 segundos mira para los costados,
  - en el saludo del día se hamaca tres veces.
  Todo con CSS puro: no pesa nada y respeta el movimiento reducido.
- **Un toque abre la caja**, en la misma familia crema del dock, anclada arriba
  a la derecha, con su colita apuntando al círculo. Adentro:
  - **la gotita entera, saludando, con su nombre** (*Appi*) para que la
    conozcan a simple vista;
  - la pregunta *¿Qué necesitás?*;
  - el buscador de siempre (usuarios, distribuidores, series, productos de la
    lista, contactos y pantallas, con el resaltado amarillo);
  - los cuatro accesos que más usa cada persona;
  - **"¿Cómo funciona esta pantalla?"**, que abre la explicación de la
    pantalla en la que estaba, sin perder la ayuda vieja;
  - el botón de escuchar y el micrófono.
- **Se cierra con la ×, con Escape o tocando afuera.** No queda ningún
  elemento flotante sobre el contenido: el dock vuelve a tener sus cuatro
  botones y la gotita ya no se asoma por el borde.
- **Los textos de ayuda que hablaban del «?»** ahora hablan del círculo de
  Appi.
- **Versión:** `906.0.0`, caché `appi-v906-circulo-de-appi`, pie *APPI · v906 ·
  Segura* y todos los `?v=906`.

## Pruebas

- *"el «?» de cada pantalla es el círculo de Appi"*: que haya más de diez
  botones y **todos** estén vestidos, que no quede ningún «?», que el cuerpo,
  los ojos y el halo estén animados, que el dock siga con cuatro botones y que
  la caja abra arriba a la derecha con la gotita y su nombre adentro.
- *"la ayuda de la pantalla sigue disponible adentro de Appi"*: tocar la fila
  cierra Appi y abre la explicación de la pantalla actual.
- *"la caja abre arriba a la derecha y no tapa el dock"*.
- Total: **13/13** asistente, **7/7** gotita, **9/9** buscador y **5/5** de
  versión y caché.

## Archivos

- Nuevos: `CAMBIOS_v906.md`.
- Modificados: `appi-assistant.js`, `appi-assistant.css`, `index.html`,
  `service-worker.js`, `package.json`, `README.md`,
  `tests/e2e/appi-assistant.spec.js`, `tests/e2e/appi-gotita.spec.js`,
  `tests/e2e/appi-buscar.spec.js`.
