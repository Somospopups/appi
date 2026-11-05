# APPI v907 · «¿Qué hay en mi pantalla?»

Sólo mejoras: nada de lo que ya funcionaba se quitó.

## Por qué

El propietario pidió, dentro de la caja de Appi, una opción que haga un
**recorrido por la pantalla**:

> *"cuando presiones en appi exista una opción que diga, ¿qué hay en mi
> pantalla? y que esta le haga un tour con movimientos, marcas, etc.
> explicándole detalladamente cada cosa que se vea allí"*

La idea es que alguien que abre APPI por primera vez (o que se olvidó cómo se
hacía algo) toque Appi, toque esa fila y **vea la pantalla explicada paso a
paso**, sin tener que leer un manual.

## Qué cambió

- **La opción vive adentro de la caja de Appi.** La primera fila, destacada en
  celeste, dice **"¿Qué hay en mi pantalla?"** con el subtítulo *"Te lo muestro
  y te lo explico"*. Un toque cierra la caja y arranca el recorrido.
- **El recorrido baja el telón y marca.** Una capa oscurece todo
  (`rgba(12,20,34,.62)`) y deja un **nido iluminado** sobre un elemento por
  vez, con un anillo celeste que late (`tourLatido`, 2,2 s) y las esquinas
  redondeadas. Se ve exactamente qué se está explicando.
- **Se mueve.** Antes de mostrar cada paso, la pantalla se desplaza suave hasta
  el lugar (`scrollIntoView` suave) y el nido se reacomoda solo mientras
  scrolleás o girás el teléfono.
- **La tarjeta crema de Appi explica.** Arriba dice *"2 de 5"*, abajo el título
  y el texto en palabras simples, los puntitos del recorrido y los botones
  **Escuchar**, **Atrás** y **Siguiente** (en el último paso, **Terminar ✓**).
  La colita de la tarjeta apunta al lugar iluminado: si el hueco queda arriba,
  la colita mira para arriba, y al revés.
- **Escuchar.** Lee el paso en voz alta con `speechSynthesis` en es-AR, al mismo
  ritmo que el resto de Appi.
- **Teclado:** `Escape` termina, `←` vuelve y `→` avanza (útil en la compu).
- **Recorridos escritos** con nombre y explicación propia para: Home, Mi mes,
  Mi negocio, Herramientas, Lista de precios, Mi stock, Usuarios, Gestión de
  contactos e Histórico.
- **En las demás pantallas se arma solo.** Si no hay recorrido escrito, o si la
  pantalla cambió y un elemento no está, el recorrido se construye con las
  tarjetas y títulos que se ven (hasta 5 pasos, con el texto de cada bloque), y
  si la pantalla todavía está cargando se rearma medio segundo después.
- **Si hay un aviso abierto encima** (por ejemplo el aviso de precios de la
  Lista), el recorrido es de dos pasos y habla sólo del aviso: **"Este aviso"**
  (qué es y que lo de atrás queda esperando) y **"Para cerrarlo"**, que ilumina
  el botón de cerrar. Nunca se explica algo que está tapado: cuando el aviso se
  cierra, se vuelve a tocar Appi y se sigue con el resto.
- **Detalles finos:** la capa del recorrido siempre queda arriba de todo
  (`z-index` alto) para que los botones se puedan tocar; la caja de Appi ahora
  tiene altura máxima y scroll propio para que el pie y los accesos entren
  siempre en pantallas chicas; respeta `prefers-reduced-motion`.
- **Todo local:** no hay red, ni IA remota, ni claves.

## Versión

- `version`: **907.0.0**
- Cache del Service Worker: `appi-v907-recorrido`
- Pie de la app: **APPI · v907 · Segura**
- Archivos nuevos: `appi-tour.js`, `appi-tour.css` (incluidos en `APP_SHELL`)
- Archivos táctiles: `appi-assistant.js` (fila nueva + `empezarRecorrido()`),
  `appi-assistant.css` (fila celeste y alto máximo de la caja),
  `index.html` (carga de los dos archivos nuevos)

## Pruebas

- Nueva suite `tests/e2e/appi-tour.spec.js` — **6/6**: la opción está y es la
  primera de la caja; el recorrido abre, oscurece e ilumina; Siguiente/Atrás/
  Terminar; Escape y flechas; funciona en todas las pantallas abriéndolas como
  en la vida real (Stock, Lista, Histórico incluidos); después del recorrido el
  dock y Appi siguen funcionando.
- `appi-assistant.spec.js` **13/13**, `appi-gotita.spec.js` **7/7**,
  `appi-buscar.spec.js` **9/9**, `pwa-cache.spec.js` **5/5**.
- Arreglo de una fragilidad vieja de las pruebas: la fecha "hoy" de los
  fixtures se calculaba en UTC y a la tarde/noche se adelantaba un día (los
  contactos pendientes no aparecían). Ahora se toma en
  `America/Buenos_Aires`, igual que APPI.
