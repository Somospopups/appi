# APPI v904 · La gotita Appi, dibujada y animada de verdad

## Qué cambió

Hasta la v903, Appi eran cinco imágenes WebP (normal, pensando, feliz,
sorprendida, alerta) que se movían enteras con CSS: la misma foto
trasladada, girada o escalada. A pedido del propietario, el personaje se
volvió a dibujar y ahora **se anima por piezas**.

## Dibujo vectorial

- Nuevo módulo `appi-gotita.js`: la gotita es un SVG propio (240 × 240)
  con las piezas separadas en nodos: cuerpo, brillo, ojos, pupilas,
  cejas, mejillas, boca cerrada y boca abierta, dos brazos, dos pies,
  sombra, pensamientos, destellos, ondas de escucha y signo de admiración.
- Nuevo `appi-gotita.css`: cada estado anima piezas distintas, sin
  fotogramas ni imágenes.
- Se eliminaron los cinco WebP de `assets/appi/` y del App Shell.

## Movimiento por estado

1. **Normal:** respira (el cuerpo se estira y aplasta), parpadea con un
   doble pestañeo cada 6,2 s, mira a un lado y al otro, y saluda con la
   mano derecha cada tanto.
2. **Pensando:** se inclina, mira hacia arriba, levanta una ceja, achica
   la boca en "o" y le suben tres burbujas de pensamiento.
3. **Feliz:** salta con aplaste al despegar y al caer, cambia los ojos
   por arcos de alegría, abre la boca, se le agrandan las mejillas, los
   pies se levantan y aparecen destellos girando.
4. **Sorprendida:** se estira de golpe, abre los ojos con las pupilas
   chicas, levanta las dos cejas, aparece el signo de admiración y sale
   una onda desde el cuerpo.
5. **Alerta:** se inclina hacia adelante con un pequeño temblor, levanta
   la mano, frunce una ceja y emite un pulso ámbar.
6. **Escuchando:** ondas de sonido animadas y la mirada atenta.
7. **Hablando:** la boca se abre y se cierra sílaba por sílaba y el
   cuerpo acompaña con un vaivén suave.

## Color

- La gotita es **celeste sólido** (`#5ec1f2`), a pedido del propietario: se
  retiraron los degradés del cuerpo, de los brazos, de los pies y la luz
  radial suave. Quedan sólo los reflejos blancos del brillo, que son
  formas, no degradés.
- El color vive en una sola variable CSS (`--go-celeste` en
  `appi-gotita.css`), así que cambiarlo es una línea.
- Se quitó el reflejo grande que salía sobre la ceja izquierda y la banda
  de luz del borde: la gotita quedó limpia, con un solo puntito de brillo.

## Detalles de agua y transiciones

- **Burbujitas internas:** tres burbujas suben por dentro del cuerpo en
  cualquier estado, con su propio brillo; le dan la lectura de agua.
- **Luz de borde:** un reflejo suave sobre el costado izquierdo para que
  el cuerpo tenga volumen y no parezca una calcomanía plana.
- **Salpicadura al aterrizar:** en el estado feliz, tres gotitas salen
  disparadas cuando la gotita toca el piso después del salto.
- **Cambio de estado líquido:** al pasar de un estado a otro el cuerpo se
  aplasta un instante (280 ms) en vez de cortar seco.
- **Onda de sorpresa corregida:** el pulso salía cruzando la cara; ahora
  nace por fuera del cuerpo y se expande.
- **Cuerpo redondeado:** la punta se acortó y el cuerpo se ensanchó para
  que se lea mejor a 122 px, con las piezas de la cara reacomodadas.

## Viñeta y panel en la misma familia

- La **viñeta** que aparece cuando Appi saluda o habla quedó con la forma
  elegida por el propietario (opción A): blanca, borde suave, esquina con
  cola hacia la gotita y **entrada animada** (aparece con un pequeño
  rebote desde abajo a la derecha).
- El **panel** grande comparte ahora los mismos tokens que la viñeta
  (radio, color de borde y sombra) y suma una **colita** que apunta a la
  gotita, para que se lea como una sola conversación.
- Para que la colita no se recorte, el scroll pasó a un contenedor
  interno (`.appi-panel-scroll`): el panel conserva su alto máximo y su
  desplazamiento, la cola queda siempre visible.
- Modo oscuro: la cola toma el fondo del panel y su borde.

## El panel: buscador, accesos directos y lo que más usás

El propietario eligió, entre cinco paneles posibles, el de **buscador
primero** y pidió que las filas sean *"las 4 más utilizadas, para
tenerlas siempre a mano"*.

- **Título simple:** *"¿Qué necesitás?"*.
- **Una sola caja para buscar o hablar:** se escribe el nombre de la
  pantalla y se entra; el micrófono está adentro de la misma caja, así no
  hay que buscar dónde hablar.
- **Cuatro filas, no más:** cada una con ícono propio (SVG, no emojis),
  nombre y una línea que explica para qué sirve; la flecha indica que se
  entra. Un toque y ya está adentro: sin confirmar nada.
- **Las cuatro filas son las que más se usan.** Mientras la persona usa
  APPI se cuentan las visitas a cada pantalla (sólo un número en el
  teléfono, nada sale del aparato) y el panel muestra siempre las cuatro
  primeras. El rótulo cambia solo: *"Para empezar"* al princio,
  *"Lo que más usás"* cuando ya hay historial.
- **Primeras cuatro de arranque:** Lista de precios, Mis contactos,
  Histórico y Mi Encuesta.
- **Sin confirmaciones:** cualquier lugar que la persona nombre —hablado
  o escrito— la lleva ahí en el acto; si no entiende, propone lugares con
  palabras simples y deja las filas a mano.
- **Textos cómodos:** filas de 46 px de alto, nombre a 12 px y la
  explicación a 10 px; el pie y el botón de escuchar también crecieron.
- El botón de lectura pasó a un ícono de parlante dibujado (nada de
  emojis que cambian según el teléfono).

## Buscador de Appi: todo lo que hay en el teléfono

Pedido del propietario: *"si escribo Juan, me aparecen todos los usuarios
llamados Juan y, separado, todos los distribuidores llamados Juan; pasa lo
mismo con los números de serie de los purificadores"*.

El buscador del panel dejó de buscar sólo pantallas: ahora **busca en los
datos** y ordena los resultados por tipo, cada grupo con su contador.

- **Usuarios** — por nombre, teléfono, dirección, localidad, código postal,
  correo o DIP. Muestra localidad, teléfono y producto.
- **Distribuidores** — el equipo de la planilla: nombre y DIP.
- **Purificadores** — por **número de serie** (se puede escribir el número
  completo o un pedazo: `0117`, `8842`), con el dueño, el modelo y el
  vencimiento al lado.
- **Productos** — los de la Lista de precios, por nombre, SKU o grupo
  (`senior4`, `611010510`, `rinnova`). Muestra SKU, grupo y precio, y abre
  la Lista ya filtrada por ese producto. Si el catálogo todavía no se había
  cargado, Appi lo pide en segundo plano sin abrir la pantalla.
- **Contactos** — los del Panel, por nombre o teléfono.
- **Pantallas** — las 30 pantallas de APPI, con sus nombres de siempre.
- **Sin internet:** todo sale del aparato (la planilla de usuarios guardada,
  el equipo, los contactos). Si la planilla todavía no se abrió en esta
  sesión, el buscador la lee igual de la memoria del teléfono.
- **Tolerante:** no importan los acentos, las mayúsculas ni los espacios;
  "juan perez", "JUAN PÉREZ" y "Perez Juan" encuentran lo mismo. Los números
  se comparan sin guiones ni puntos (`AP5-2024-0117` = `ap520240117`).
- **Cada resultado lleva a la pantalla correcta ya filtrada:** un usuario
  abre *Mis usuarios* con su nombre puesto (`Filtrando 1 de 5`), un
  distribuidor abre *Mi Equipo → Distribuidores* con su DIP, una serie abre
  *Mis usuarios* filtrado por esa serie y un contacto abre **su ficha** en el
  Panel. Nada de listas para volver a buscar a mano.
- **"Ver los N…"**: cuando hay más de cuatro coincidencias, un botón abre la
  pantalla con ese filtro para verlas todas.
- **Se ve qué coincidió:** la parte del nombre, la serie o el SKU que la
  persona escribió queda **resaltada en amarillo**, sin importar acentos ni
  mayúsculas.
- **Enter** va a la primera coincidencia; si no hay ninguna, Appi responde
  como antes (jornada, explicaciones) y, si no entiende, propone qué probar.
- **Si no hay datos cargados**, el buscador no inventa: dice "No encontré" y
  sugiere probar con nombre, DIP, teléfono o serie.
- **Pruebas nuevas** (`tests/e2e/appi-buscar.spec.js`, 9 casos): que «juan»
  separe usuarios y distribuidores, que una serie encuentre el equipo y a su
  dueño, que cada resultado navegue a la pantalla filtrada, el mensaje de
  "no encontré", el Enter, los productos de la lista y el resaltado.

## Appi en el dock

Pedido del propietario: *"¿y si ponemos a Appi dentro del dock? Presionamos
el botón y salta sobre el dock; si volvemos a presionar el botón del dock
se vuelve a guardar"*.

- **Botón propio en el dock**, al final, con la carita de la gotita en
  celeste y la etiqueta *Appi*. Los cuatro accesos de siempre quedan
  igual, en el mismo orden y del mismo tamaño.
- **Un toque la saca:** Appi salta desde adentro del dock (rebote con
  estiramiento), se para con los pies sobre el borde del dock y abre su
  panel. El botón queda marcado, así se ve que está afuera.
- **Otro toque la guarda:** el panel se cierra, ella se mete de nuevo en
  el dock y la pantalla queda limpia. `aria-pressed` acompaña el cambio.
- **La gotita se recuerda:** el estado queda guardado en el teléfono, así
  que si alguien la dejó afuera, al volver la encuentra afuera.
- **El saludo del día no se pierde:** si está guardada, el aviso es un
  latido en su botón del dock (con un punto ámbar), en vez de una viñeta
  que nadie podría ver.
- **Tocarla a ella** (cuando está afuera) abre y cierra el panel, como
  antes. **Tocar cualquier otra solapa del dock** cierra el panel y la
  deja afuera, sin guardarla.
- **En la computadora** el dock no existe: ahí no hay dónde guardarla, así
  que sigue como estaba, sin botón y oculta por el diseño de escritorio.
- Prueba nueva: *"Appi vive en el dock: un toque la saca y otro la
  guarda"*, que mide que sus pies queden sobre el borde del dock (menos
  de 16 px de diferencia) y que guardada no se pueda tocar.

## Voz

- La lectura en voz alta ahora mueve la boca de la gotita sólo mientras
  el teléfono habla de verdad (`onstart` / `onend` / `onerror`).
- El botón pasa a **⏹ Detener** mientras lee: tocarlo corta la lectura.
  Antes solo se podía cancelar empezando otra.
- Al cerrar el panel se detiene la lectura y la boca vuelve a la sonrisa.

## Correcciones de paso

- **Carrera al terminar de cargar:** `waitUntilAppReady` forzaba el
  estado `normal` y podía pisar una respuesta en curso si la persona le
  hablaba mientras la app terminaba de abrirse. Ahora sólo ordena el
  estado si Appi está cerrada.
- **Reposo invisible:** con la gotita nueva, en reposo sólo asomaba la
  punta de la gota por debajo del dock. Se ajustó la altura de reposo
  para que se le vea la cara, como pedía el diseño de la v902.
- Se retiró el código muerto de visemas (`[STATE:{"viseme":…}]`), que ya
  no se usaba desde que el estado viaja por API.
- El globo del saludo diario se separó unos píxeles de la cabeza.

## Compatibilidad

- Modo claro, modo oscuro, pantallas de 360 px y menores, y
  `prefers-reduced-motion`: con movimiento reducido la gotita queda
  quieta pero completa y visible.
- Sin claves, tokens, servicios externos ni descargas: el dibujo viaja
  dentro del App Shell y funciona sin conexión.

## Pruebas

- Nuevo `tests/e2e/appi-gotita.spec.js` (7 pruebas): que sea dibujo y no
  imágenes, que cada estado anime piezas distintas y no cambie el tamaño,
  que parpadee de verdad (se mide la escala del párpado), que la boca se
  mueva al leer y se corte, que muestre las ondas al escuchar, que ninguna
  pieza se despegue del cuerpo y que el movimiento reducido la deje quieta.
- `tests/e2e/appi-assistant.spec.js` actualizado a la gotita vectorial y
  con tres pruebas nuevas del panel: que un lugar nombrado lleve ahí sin
  confirmación, que los atajos abran la pantalla en un solo toque y que,
  cuando no entiende, proponga lugares con palabras simples.

## Archivos

- Nuevos: `appi-gotita.js`, `appi-gotita.css`, `appi-buscar.js`,
  `tests/e2e/appi-gotita.spec.js`, `tests/e2e/appi-buscar.spec.js`.
- Modificados: `appi-assistant.js`, `appi-assistant.css`, `lista-precios.js`, `index.html`,
  `service-worker.js`, `package.json`, `package-lock.json`, `README.md`.
- Eliminados: `assets/appi/normal.webp`, `thinking.webp`, `happy.webp`,
  `surprise.webp`, `alert.webp`.

## Versión

- Aplicación: `904.0.0`
- Versión visible: **v904 · Segura**
- Caché: `appi-v904-gotita-animada`
