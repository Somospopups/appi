# APPI

PWA local-first para planificación mensual, presupuesto, equipo, garantías, contactos, notas, grabadora, Histórico, encuestas y gestión de referidos.

## Estado actual

## v577 · Popup de vencimiento: fecha sin etiquetas HTML

- El aviso de confirmación muestra la fecha normal (ya no aparece `<b>24/9/2026</b>`).
- Versión: **v577 · Segura** · Cache `appi-v577-popup-fecha`.

## v576 · Panel admin: período en el ticket y día de vencimiento

- **Ver Ticket** pide fecha **desde** y **hasta** y las imprime en el comprobante.
- Botón **📆 Vence el** para elegir el día en que se le corta APPI a esa cuenta.
- Versión: **v576 · Segura** · Cache `appi-v576-ticket-vence`.

## v575 · PSA automático: sin carga manual de archivos

- Se sacaron los campos para subir Excel de Mi Equipo y Usuarios. Un distribuidor nuevo solo ve **Conectar MI PSA**.
- Versión: **v575 · Segura** · Cache `appi-v575-psa-auto`.

## v574 · Opciones de ingreso: solo las 22 del flyer
- Se **sacaron** los 3 Kit de Acceso de la lista (Mini Bianco, Mini Nero y Portátil).
- Quedan **solo las 22** combinaciones del flyer oficial (11 Portátil + 11 Mini), con foto de combo y badge de PB.
- Versión: **v574 · Segura** · Cache `appi-v574-opciones-ingreso`.

## v573 · Las 22 opciones de ingreso del flyer oficial
- Chip **Opciones de ingreso** con las **22 combinaciones** del flyer *Opciones de ingreso al sistema* (Argentina, vigencia 9-sep-2026): 11 con Kit de Acceso Portátil y 11 con Kit de Acceso Mini.
- Fotos recortadas del flyer (combo + badge de PB), mismo formato de cards, precio Dist. Junior RI (categorizado) y popup al tocar la imagen.
- Se conservan los 3 Kit de Acceso oficiales de la lista (Mini Bianco, Mini Nero y Portátil).
- Versión: **v573 · Segura** · Cache `appi-v573-opciones-ingreso-22`.

## v572 · Opciones de ingreso en Lista de precios
- Chip **Opciones de ingreso** (Presentación oficial del Sitio Privado DIP) con los tres Kit de Acceso de la lista Argentina: Mini Bianco, Mini Nero y Portátil.
- Mismo formato de cards: foto PCD, composición, precio Dist. Junior RI y popup al tocar la imagen.
- Versión: **v572 · Segura** · Cache `appi-v572-opciones-ingreso`.

## v571 · Margarita más flor: pétalos más largos, tallo con dos hojitas y centrada
- Los pétalos **sobresalen más** del centro dorado para que se lea como una flor abierta.
- Suma **tallo verde con dos hojitas** debajo del círculo.
- La flor baja un poco en la tarjeta: el espacio de arriba y el de abajo queda más parejo, y el tallo ocupa lo que sobraba abajo.
- Versión: **v571 · Segura** · Cache `appi-v571-margarita-tallo`.

## v567 · Mi Margarita: fondo APPI y cielo difuminado
- **Mi Margarita** conserva sus pétalos editables alineados directamente con el borde externo del centro, sin atravesarlo, con textos e íconos legibles en escritorio y móvil.
- La vista ahora usa exactamente el fondo compartido de APPI y la tarjeta de la flor suma un cielo azul suave y difuminado para destacar los pétalos y sus textos.
- En móviles, la cabecera ahora respeta la barra de estado y el mensaje inferior queda debajo de la flor, sin tapar el pétalo de Familia.
- Cada pétalo permite elegir contactos desde el selector del teléfono cuando está disponible o desde la **Agenda Personal de APPI**, y deja listos grupos para demostraciones, presentaciones de negocio y pedidos de referidos.
- La margarita se accede desde **Mi negocio**, guarda el progreso local por cuenta y participa de la sincronización habitual.
- El fondo beige APPI unifica **Mi Margarita** y **Campus PSA**.
- Versión: **v567 · Segura** · Cache `appi-v567-margarita-contactos`.

## v562 · Campus PSA: aprendizaje que activa acción
- **Campus PSA × APPI** suma un recorrido de aprendizaje visual, personalizado por categoría comercial (incluye el itinerario de **Líder de Equipo** relevado).
- Al completar las **10 acciones base** de la jornada aparece una celebración y un desafío original de cinco preguntas sobre comercialización, crecimiento, posventa y autoliderazgo.
- Cinco respuestas correctas activan el **Impulso del día**: hasta **3 prioridades reales adicionales** (jornada de 10 a 13 cuando existen candidatas), compartidas por titular y socio.
- El progreso se guarda localmente por cuenta y día, participa de la sincronización habitual de APPI y no consulta ni almacena credenciales de PSA Campus.
- Versión: **v562 · Segura** · Cache `appi-v562-campus-impulso`.


## v830 · iOS: panel de contactos liviano (sin pantalla blanca)
· Los listados grandes del Panel (Prioridad de hoy, Todos, Agenda personal) ahora se pintan por tandas (50/100/150) con botón “Mostrar más”: antes, con miles de contactos, el DOM de varios megas dejaba la pantalla blanca en iOS (Safari mata el webview por memoria).
· Red de seguridad global: cualquier error de script o promesa se guarda (anillo en `appi_err_v1`) y muestra una barra roja con “Recargar” — nada vuelve a fallar en blanco silencio.

## v831 · Panel de Contactos a prueba de balas
- Blindaje total contra la pantalla blanca de iOS: ninguna fila malformada (estado inexistente, nombre numérico, teléfono nulo, fecha basura, metadata de megas) puede tumbar el listado ni la ficha — se dibuja con lo mínimo seguro.
- `renderManagement`, `openMiGestion` (cola de la agenda personal) y `openContactDetail` quedan dentro de try/catch con tarjeta de error visible y botón “Reintentar” dentro del Panel: el peor caso posible es un aviso, nunca un blanco.
- Agenda personal: la misma protección fila por fila (una fila corrupta se cuenta y se avisa, no explota).
- Test de regresión `panel-blindado.spec.js`: abre el Panel con contactos sucios y verifica que se dibuja, que la ficha sucia abre y que no hay pageerrors.
- Versión: **v852 · Segura** · 🏠✨ **Píldora verde exclusiva de Home (restringida a view-home)** + cancelación instantánea al navegar. · Cache `appi-v852-toast-home-only`.
- Versión anterior: **v831 · Segura**
- Versión anterior: **v830 · Segura** · 🔵 iOS sin pantalla blanca en el Panel de Contactos: los listados grandes se pintan por tandas (50/100/150) con botón “Mostrar más” (antes, con miles de contactos, un DOM de varios megas) + red de seguridad global de errores (barra roja con “Recargar” y anillo en `appi_err_v1`). · Cache `appi-v830-ios-panel`.
- Versión anterior: **v829 · Segura** · 🟢 **CI verdE de verdad (457 tests) y la sync ya no pisa lo nuevo**: (1) al entrar, la sincronización de datos corre en segundo plano y ahora respeta las escrituras locales que llegan mientras termina (el snapshot inicial ya no las aplasta: antes una carga o un cambio hecho en los primeros segundos del login podía borrarse — en las pruebas, sembrar datos y leerlos después). (2) El mazo del Home ya no pierde su "hamaca" de demostración por el repinte que trae la sync (y no repinta si la data no cambió). (3) El arranque muestra la marca ~1,8 s siempre (con o sin reduced-motion) y deja de depender del tiempo de la sync. (4) Historico: la copia embebida de CSS queda sincronizada con historico.css. (5) Tests a la UI actual: stock por FAB + carga manual + picker de equipo + pregunta de serie al devolver, toast que espera su slide-in, y el cartel de avisos no tapa clics en lista de precios. · Cache `appi-v829-ci-verde`.
- Versión anterior: **v828 · Segura** · 🟢 **CI verde y dos arreglos**: (1) **CI vuelve a verde** — el guard del service worker impide que un SW viejo bloquee la app (causa de la CI roja desde v826): 446 tests e2e en verde (144 + 200 + 102 en tres shards). (2) **El mazo vuelve a abrirse**: la tarjeta de presupuesto se abre al tocarla (el click se re-targeteaba sobre el `setPointerCapture` interno). (3) **El login ya no corta tu flujo**: el sync de datos al entrar corre en segundo plano y al terminar NO te tira a Home si ya navegaste a otra vista. · Cache `appi-v828-ci-verde`.
- Versión anterior: **v802 · Segura** · 🎰 Ruleta PSA v2: una ruleta animada con sonido (bips, ticks y campanita, confeti) que entrega la tarea del día con tus clientes reales: 3 mensajes, llamada, referido, demo, stock, retrolavado, negocio… o el premio "¡Ya fue mucho por hoy!". Cada tarea hecha suma una ⭐ al día, suma a la racha 🔥 y trae un botón **IR →** que lleva directo a su lugar (Mi Stock, Mi negocio, la ficha del cliente). La entrada GIRAR vive en Mi negocio (reemplazó al GPS del mes).
- v796: Sincronización automática de garantías y usuarios desde MI PSA mediante consulta de reportes seriales en Edge Function sin bloqueos de CORS, 10 tareas diarias garantizadas y carga manual por Excel restaurada como respaldo. Mi Stock y Pendientes de canje en tiempo real con lupa pensante y compartir por WhatsApp.
- Caché de la app: `appi-v797-fab-catalogo` (se renueva al abrir APPI).
- Publicación: [https://somospopups.github.io/appi/](https://somospopups.github.io/appi/)
- Acceso por número de distribuidor y contraseña.
- Acceso administrador POPUPS mediante el candado, sin DIP ni número de distribuidor.
- Autenticación, datos, membresías, solicitudes y archivos mediante Supabase.
- Sincronización automática por cuenta.
- Funcionamiento offline por hasta 7 días desde la última validación.
- Grabaciones y transcripciones de audio locales: no se suben a la nube.

## Lector de Mi Stock: lectura en vivo, rápida, sin fotos (v733–v750)

En **Mi Stock** hay un solo botón, **📷 Cargar equipo con la cámara**.
No hay que sacar ninguna foto ni subir ninguna: con el escáner abierto
y el marco alargado (forma de etiqueta, con línea vertical que barre de
derecha a izquierda), al apuntar a la caja la unidad **se lee sola** y
se carga sola, en unos pocos segundos:

- **El QR** (ZXing, fijo en `vendor/zxing.min.js`, Apache 2.0) se lee de
  fondo cada ~450 ms: los QR actuales traen únicamente el número de
  serie, y es la serie confiable.
- **El texto impreso** (nombre + color) se transcribe con **OCR local**
  (Tesseract.js, fijo en `vendor/tesseract/`, Apache 2.0). Para que sea
  rápido y certero (v737–v738):
  - el motor OCR se **calienta al abrir Mi Stock** (v738, antes de tocar
    la cámara): cuando se abre el escáner ya está listo;
  - el OCR **recorta la región del cuadro** (donde se enmarca la
    etiqueta), la agranda a ~1000 px y pasa a **grises con contraste**:
    menos fondo, texto más nítido, lectura mucho más fiable;
  - la orientación se prueba por pasadas (0/90/180/270°): si una
    orientación no da nada, pasa a la siguiente; si dio algo, se queda
    en esa y la **confirmación sale a los ~0,9 s**;
  - cuando hay **nombre + color + serie**, la unidad **se carga al
    toque**: suena el **bip de confirmación** (Web Audio, sin
    archivos, v734) y el escáner se cierra;
  - **carga exacta** (v739): el texto se interpreta por la estructura
    de la etiqueta ("PSA \<NOMBRE\> \<COLOR\> + K. POSV." + serie): el
    nombre es todo lo que va **antes del color**, más el kit; lo que
    venga después (ruido de la caja o de otra etiqueta pegada) se
    descarta, así "OF AO) AE" jamas entra en la fila;
  - **solo lo que ves** (v740): el lector **solo mira dentro del
    cuadro** — el texto se recorta exacto al campo y el QR se lee con
    su zona de silencio (18%); todo lo que quede afuera (otra
    etiqueta, texto de la caja) queda bloqueado y no se lee;
  - **lee de memoria con TODOS los productos** (v743): cada lectura
    de OCR se contrasta contra el **catálogo completo de PSA**
    (`psa-catalogo.json`, 312 productos = TODOS los de la lista
    oficial "Precios Sugeridos con Acuerdo" —la de mi.psa.com.ar, con
    el precio de la primera columna— + los que solo vende la tienda;
    se publica también en Supabase y queda en caché para funcionar
    sin internet). Si el texto coincide con un producto conocido
    —aunque el OCR haya leído "VER0 B1ANCO" o haya soltado el "4" de
    Senior4—, el nombre y el color se escriben **exactos, como
    figuran en la lista oficial**, y la unidad **se carga en una sola
    pasada** apenas aparece la serie del QR: sin segunda lectura de
    confirmación y sin probar orientaciones de a ciegas. Si no hay
    coincidencia clara (o dos productos empatados, ej. Senior vs.
    Senior4), se usa la lectura estructural clásica. El campo
    PRODUCTO del alta manual sugiere los nombres oficiales del
    catálogo;
  - **super rápido** (v742): el OCR pasa a ser más veloz y limpio —
    el recorte se procesa a **760 px** (antes 1000), con **whitelist
    de caracteres** (solo mayúsculas, números, "+", "." y "-", que es
    todo lo que trae una etiqueta PSA: menos reconocimiento y menos
    ruido tipo "OF AO) AE") y modo **PSM 6** (bloque corto de texto).
    Las pasadas de texto se repiten cada **1,2 s** (antes 1,8) y,
    cuando el catálogo ya dio el producto, el OCR se aparta para no
    robarle CPU al QR. Con todo esto, apuntando quieto, la carga sale
    en la primera pasada (~2 s).
- El motor OCR (~8 MB) se descarga **una sola vez** y queda en caché
  (service worker + IndexedDB): después funciona sin internet.
- Si falta la serie, se pide **una vez** en un diálogo; si el QR trae
  los datos completos (nombre + color + serie), carga directo sin
  esperar al OCR.
- No existe carga por foto manual: si no hay cámara, el escáner avisa.

- **Pendientes de canje** (v746): tab dentro de Mi Stock para los
  equipos viejos que nos quedamos al hacer un plan canje y hay que
  entregar a la empresa. Con el botón **📷 CARGAR BASE DEL EQUIPO
  VIEJO** se apunta al QR de la BASE del purificador (el que trae el
  N° de serie): la app lo consulta en la base de PSA (función
  `consulta-serial` → reporte de Garantías de dip.psa.com.ar, con la
  sesión MI PSA) y carga sola el equipo **con a quién pertenecía**
  (nombre, teléfono y producto). Si la serie no figura en la base de
  PSA, la app avisa con un popup y te deja guardarla **solo con la
  serie** (sin datos): después se toca la fila y se completa cuando
  se habla con la empresa (también hay buscador de la propia base de
  usuarios de APPI). **ENTREGADO** (🚚) confirma la entrega y baja
  la fila.
- **Primero el teléfono, después PSA** (v750): la planilla de
  Usuarios ahora parsea la columna **Serie** (antes la ignoraba) y la
  muestra en la ficha de cada usuario (🔖). Al escanear (o buscar) una
  base en Pendientes, la app busca primero en esa planilla local: si
  figura, carga al instante y sin internet; si no, consulta la base de
  PSA.
- **Rápido de verdad** (v749): al abrir la cámara de Pendientes, la app
  pre-carga en segundo plano la base completa de Garantías de PSA
  (reporte `consulta-serial` con `action:"report"`). Cuando se lee el QR,
  la búsqueda se hace en el teléfono al instante; la primera carga de la
  base (5-6 s) no se nota porque pasa mientras se apunta.
- **Pitido de confirmación en Pendientes** (v749): pitido único al leer
  el QR (feedback inmediato) y el doble bip de siempre al cargar el
  equipo (la acción se realizó).
- **Lupa "pensando"** (v749): mientras se busca la serie, una lupa
  recorriendo ficheros en pantalla completa; check verde con los datos
  cuando la encuentra, marca ámbar cuando no figura (y se guarda igual
  para completar después).
- **Cuadradito en Pendientes** (v748): el escáner del tab Pendientes
  vuelve a ser el cuadro cuadrado de siempre (solo hay que enmarcar el
  QR de la base); en Stock personal sigue alargado para la etiqueta
  completa (QR + OCR).
- **Agrupado por producto** (v746): en Stock personal, Prestados y
  Pendientes las filas van ordenadas por producto (todos los Senior
  juntos, los Senior 4 por otro lado…), y dentro, por color y serie.

Alta manual, con sus campos (v738): **PRODUCTO · COLOR · N° DE
SERIE** + cantidad. Si cargás serie, la fila es propia (igual que la
escaneada) y una serie repetida avisa sin duplicar; sin serie, el
producto se suma a la fila del mismo nombre **y color** (los colores
nero/negro, blanco/bianco y grigio/gris se reconocen).

Reglas de la fila:

- Cada unidad es su propia fila (la serie la identifica); escanear dos
  veces la misma caja no duplica: la serie ya cargada se detecta y avisa.
- PRESTAR de una unidad con serie conserva la serie: al devolvérsela, la
  unidad vuelve a su fila original, no crea una fila manual nueva.
- El alta manual sin serie no se mezcla con las filas escaneadas.
- El bucle en vivo reutiliza dos canvases fijos (no crea uno nuevo cada
  ciclo) para no trabar el teléfono; una pasada de OCR a la vez y un
  try/catch por frame: un frame malo nunca detiene el escáner.

## Arranque con el logo de vidrio

Desde v256, todos los dispositivos abren APPI con el mismo logo de vidrio.

- `scripts/logo_vidrio.py` dibuja el logo una sola vez: fondo pastel, cartel de vidrio esmerilado y el wordmark APPI en letras heladas.
- `python3 scripts/make-splash.py` genera las 26 imágenes de arranque de iPhone y iPad, verticales y apaisadas, dentro de `splash/`.
- `python3 scripts/make-icons.py` genera los íconos de la pantalla de inicio desde `brand/icono-app.png` (vidrio oscuro, APPI al centro para que Android e iOS no recorten el nombre).
- Dentro de la app, la animación de carga muestra el mismo cartel de vidrio dibujado con CSS, sin descargar imágenes, en celular, tablet y PC.

Al cambiar el logo hay que regenerar ambos juegos y volver a correr `npm test`: `tests/e2e/logo-vidrio.spec.js` verifica que cada dispositivo tenga su imagen y que el arranque muestre el vidrio.

## Agenda personal, listado sutil (v366)

La agenda del teléfono se lee como una guía: letras A B C, nombre y
número. Un puntito marca a quien ya está en la Agenda APPI. Las acciones
(WhatsApp, llamar, pasar, quitar) aparecen al tocar el nombre.

## Número incompleto → Depurados (v365)

Cuando un teléfono no sirve para WhatsApp, el cartel **Número incompleto**
trae **A depurados**. La persona entra a la planilla que se le pasa a la
empresa. Aceptar cierra sin tocar nada.

## Hoy te conviene (v364)

El mazo del Home ahora trabaja como un gerente comercial. Después del
impulso del día aparece **Hoy te conviene**: una sola acción, la que más
plata mueve hoy (presentación, canje listo, contacto nuevo, bonus,
invitado o un nombre pedido a un vigente). Si hay equipos vencidos de
menos de un año, sale además la carta **Plan Canje**. Mi Equipo pasa a
decir a quién invitar. Ninguna carta se inventa: si no hay alguien real,
no está.

## PB personales de Cultura (v363)

El PB del mes **ya no se tipea**. Cultura lo lee solo de tu Línea
Descendente: es el PB personal del titular (figura primero; si hay socio,
ese segundo nombre no se usa). Si todavía no está la planilla, se ve un
guión y un toque abre Mi Equipo. Los invitados siguen a mano. APPI no
inventa un número.

## Primer WhatsApp: hielo, después plantillas (v412)

El primer mensaje es sólo un saludo: 8 frases, según la hora (Buenos días 6–12, Buenas tardes 12–20, Buenas noches 20–6) y el nombre que eligió titular o socio en el engranaje. El equipo, el video o el canje no van en ese primer toque.

Después, **Mensajes** en Usuarios agrupa por para qué: mantenimiento, vida útil o canje, visita, cumpleaños, pedir un nombre, instalación y los míos. El video sale del equipo de esa ficha. Desde ahí también se abre WhatsApp para mandárselo a quien quieras.

## 1 mes completo (v411)

En cada cuenta del panel, junto a Prueba y Para siempre: **📅 1 mes completo**. Suma un mes a lo que le queda (si está vencida, arranca de hoy). No registra un pago. Si ya es para siempre, no se toca.

## Dos tarjetas (v410)

Si hay titular y socio, dos tarjetas verticales: avatar, nombre y rol.

## Ficha sobre el agua (v409)

Login y panel: tarjeta blanca. El agua se ve alrededor, no a través.

## Sin manito (v408)

Al entrar, titular y socio: solo los nombres. Sin 👋 ni ¿Quién sos?

## Vidrio sobre el agua (v407)

El login deja ver el agua. El panel deja el violeta: mismo verde del arranque.

## Login sin logo (v406)

El ingreso ya no muestra el ícono arriba del título.

## Admin con agua (v405)

El panel de administrador usa el mismo verde del arranque.

## Agua del arranque (v404)

El ícono y el login usan el mismo verde del agua de la pantalla de inicio.

## Agenda del mismo vidrio (v403)

La Agenda personal ya no parece una guía aparte: mismas tarjetas,
mismo azul. Sigue A–Z, puntito a la derecha y toque para abrir.

## Un idioma visual (v402)

Vidrio, pastel, azul a violeta. Login, Home, mazo, admin, membresías
y la Agenda personal hablan igual.

## Home suelto (v401)

El mazo del Home calculaba las 10 de hoy una vez por cada cliente. Con la
planilla grande se clavaba. Ahora se calcula una sola vez.

## Ícono de inicio (v400)

Vidrio oscuro, APPI al centro. Se lee en la grilla del teléfono y no se
corta cuando Android hace un círculo o iPhone redondea las esquinas.

## Una sola lista (v399)

Titular y socio ven las mismas 10. Si uno ya la hizo (✓), al otro no le
queda pendiente. El partido es de la casa: entre los dos llenan el día.

## El partido de hoy (v398)

Cada día con tareas es un partido: el marcador es **hechas / las que hay**.
Ganar es hacerlas todas (✓). La ✗ no suma. Sin tareas no hay partido y la
racha no se corta. En el mazo: **Hoy ganaste. Mañana otros 10.**

## Las 10 de hoy (v397)

En **Usuarios** y en el mazo del Home hay **10 tareas por día**: el mismo
tope que WhatsApp. Los cumpleaños entran primero y cuentan. Si el
calendario está flojo, se rellena con:

1. Cumpleaños de hoy.
2. Garantía que vence en 0–30 días (las más cercanas primero).
3. Mantenimiento caído en los últimos 30 días (los más viejos primero).
4. Canje: equipo vencido hace menos de 1 año.
5. Check-in a vigentes a los que no se les escribe hace 90 días.

Si hay 20 vencimientos, hoy salen 10. El mazo no ofrece a una undécima
persona. La franja dice **Hoy: n de 10 · tope de WhatsApp**. El vencido
hace más de un año sigue en Reactivación. Sin trabajo real, no se inventa
carta ni franja.

## Agenda personal (v358)

El Panel de Contactos tiene dos agendas, con un switch arriba:

- **📇 AGENDA APPI**: la de siempre (Hoy / Todos / Resultados).
- **📱 AGENDA PERSONAL**: la agenda del teléfono del distribuidor. Se sube una
  sola vez con un archivo `.vcf` (hay guía para Android e iPhone) y queda
  guardada en su cuenta: si cambia de celular, no se pierde. Cada contacto se
  pasa a la Agenda APPI de a uno, con confirmación; los que ya están se
  detectan por teléfono y no se duplican.
- La carga masiva usa **batch upsert**: los contactos se envían a Supabase en
  paquetes JSON de hasta 500 filas, en paralelo, nunca con una request por
  contacto.
- La PC sincroniza y descarga la agenda al abrir APPI, al volver a la pestaña
  y cada vez que se cambia entre Agenda APPI y Agenda Personal. La solapa
  elegida se pre-renderiza desde la caché local antes de mostrar el panel, para
  que no aparezca un frame de la agenda anterior.

Requiere `SUPABASE_AGENDA_PERSONAL.sql` (una sola vez, aditiva); sin ella la
solapa funciona igual en local. La barra de tarjetas de crédito se quitó del
panel (sigue en Usuarios).

## Anuncios del administrador (v326)

Desde el panel, la sección **📣 Anuncio para todos** publica un mensaje que
todo el equipo ve como cartel al abrir APPI (reuniones por Zoom, avisos). Se
pueden sumar hasta tres reuniones con título, fecha, hora y lugar; en el
cartel, cada una trae dos botones: agendarla en el **calendario de APPI** o en
la **agenda del teléfono** (Google Calendar, o `.ics` en iPhone). La 🔔 de la
esquina vuelve a mostrar el aviso vigente. Publicar reemplaza el aviso
anterior; quitar lo apaga para todos.

- La tabla `appi_anuncios` se lee con la sesión de cada distribuidor y sólo
  se escribe mediante `SUPABASE_ANUNCIOS.sql` (RPC exclusivas del rol admin).
- Sin conexión, el teléfono muestra el último aviso que conoció.

## Mensajes propios del distribuidor (v326)

En **Mensajes** de Garantías, el botón **✍️ Crear un mensaje nuevo** suma
plantillas propias (emoji, nombre y texto) que se envían igual que las de
fábrica, aceptan los mismos comodines (`{nombre}`, `{vence}`, …) y valen para
cualquier cliente. Se editan y se borran desde la misma lista; las de fábrica
siguen pudiendo volver a su texto original.

## Con qué WhatsApp se envía

Los enlaces `wa.me` son enlaces web, así que en Android los abre la aplicación marcada como predeterminada: en un teléfono con WhatsApp y WhatsApp Business puede no ser la deseada.

APPI nombra la aplicación de forma explícita mediante un enlace `intent://` con el paquete `com.whatsapp` o `com.whatsapp.w4b`. La primera vez que se envía un mensaje en Android, la app pregunta cuál usar y lo recuerda; se cambia desde el menú ⚙️ → **¿Qué WhatsApp utilizás?**. En iPhone y computadora se usa `wa.me` normal.

Desde el mismo engranaje, **📤 Compartir APPI** abre WhatsApp con un mensaje preparado y sin destinatario fijo, para que la persona elija a quién enviarlo. El texto incluye la landing `https://somospopups.github.io/appi-landing/` y APPI nunca lo envía automáticamente.

Todo pasa por `whatsapp-app.js` (`window.APPIWhatsApp`), que además intercepta los clics en cualquier enlace a `wa.me` o `api.whatsapp.com`. Para excluir un enlace puntual se le agrega `data-no-wa-intent`.

Los enlaces `intent://` se navegan **en la pestaña actual**, nunca con `window.open`: el navegador no puede dibujar un intent y dejaría una pantalla en blanco. Los `wa.me` comunes sí se abren en otra pestaña.

## Panel de Contactos (Mi Encuesta y Mi Gestión)

Vive en **Mi negocio** y reúne encuestas y seguimiento en una sola pantalla, con las solapas **Hoy**, **Todos** y **Resultados**. Arriba, dos accesos del mismo tamaño: **Enviar encuesta** y **Agregar contacto** (formulario a la vista, con errores traducidos al lado de cada campo). La encuesta es una **herramienta de retorno**, no reemplaza el trabajo cara a cara: el contacto de verdad se genera en la demostración.

Al tocar **Enviar encuesta**, APPI crea la invitación, muestra la animación de envío y abre WhatsApp con el mensaje listo, donde el distribuidor elige el contacto desde su propia agenda. Cada toque genera una invitación privada diferente, que vence en 24 horas, queda ligada al primer dispositivo que la abre y acepta una sola respuesta.

La persona responde sin crear una cuenta y los datos se registran automáticamente en **Mi Gestión** del distribuidor que la invitó.

Mi Gestión incluye:

- Vista **Hoy** con nuevos, seguimientos, vencidos y presentaciones.
- Prioridad automática y motivos visibles basados en estado y respuestas.
- Embudo comercial y resultados mensuales.
- Encuestados y referidos.
- Mensajes de WhatsApp preparados según cada situación.
- Registro del resultado al volver de WhatsApp o una llamada.
- Historial cronológico de actividades.
- Seguimientos y presentaciones programadas.
- Búsqueda, filtros, notas, llamada, WhatsApp y exportación CSV.
- Selección de referidos desde la agenda en navegadores compatibles, con carga manual como alternativa.
- Cola de invitaciones privadas individuales para varios destinatarios.
- Copia local y cola de cambios cuando no hay conexión.
- Aislamiento mediante RLS por `user_id`.

Instalación del backend:

1. Ejecutar `SUPABASE_ENCUESTAS_GESTION.sql` en el SQL Editor.
2. Ejecutar `SUPABASE_MI_GENTE.sql` (v223+): agrega el interés, los estados de Contactos, el origen y la función de importación que usa **Agregar contacto**. En bases ya instaladas antes de v223, `ARREGLO_CHECKS_PANEL_CONTACTOS.sql` limpia los checks viejos que quedan apilados.
3. Desplegar `encuesta-publica` sin verificación JWT:

```bash
supabase functions deploy encuesta-publica --no-verify-jwt
```

La función valida el enlace, la membresía, el contenido, el consentimiento y los referidos antes de registrar los datos.

## Titular y socio

Una cuenta puede tener un titular y, opcionalmente, un socio. Ambos usan el mismo número de distribuidor, contraseña y membresía. Después de ingresar, si hay socio, se elige entre dos tarjetas y se abre ese espacio.

- El Home saluda con **Hola + nombre**.
- Planificación, presupuesto, Siete Pasos, ruedas, contactos, notas e Histórico son personales.
- Mi Equipo y Garantías cargados mediante Excel se comparten.
- Las 10 de hoy son de la cuenta: si uno ya le escribió a alguien, al otro no le aparece. El partido también es de los dos.
- Mi Encuesta y Mi Gestión también se comparten; cada invitación conserva el nombre de quien la envió.
- La Grabadora continúa siendo local en cada dispositivo.
- Cada persona puede vincular un teléfono; las llamadas van al teléfono de la persona activa.
- Las cuentas sin socio ingresan directamente como titular.

## Puente de llamadas entre dispositivos

Desde el **engranaje → Vincular teléfono**, una PC o tablet muestra automáticamente un QR y un código de seis dígitos. Cada integrante de la cuenta puede vincular su propio teléfono. Cuando la persona activa ya tiene uno, el engranaje muestra **Desvincular teléfono** y solicita una confirmación simple con **Sí** o **No**.

Al tocar **Llamar** desde Mi Gestión en PC o tablet:

- se envía una notificación privada identificada con el ícono de APPI;
- en Android, la insignia pequeña utiliza una “A” blanca sobre fondo transparente para evitar el cuadrado blanco;
- la solicitud vence en dos minutos;
- el teléfono muestra el contacto y requiere confirmación;
- al aceptar, abre el marcador nativo;
- la actividad y su resultado quedan registrados en Mi Gestión.

En iPhone, APPI debe instalarse en la pantalla de inicio para recibir Web Push. En Android funciona como PWA o desde Chrome con notificaciones autorizadas.

## Recordatorios de Mi Gestión

El mismo teléfono vinculado recibe dos avisos automáticos, sin permisos ni vinculaciones adicionales:

- **Resumen diario a las 9:00**: nuevos, seguimientos del día, vencidos, presentaciones y encuestas recibidas el día anterior, en una sola notificación. Si no hay nada pendiente, no llega nada.
- **Aviso 30 minutos antes de cada presentación** que tenga hora cargada.

Al tocar el resumen se abre Mi Gestión en la vista **Hoy**; al tocar un aviso de presentación se abre ese contacto. El destino se conserva durante el ingreso y la elección de titular o socio.

La hora de la presentación es un campo opcional dentro del detalle del contacto. Titular y socio reciben el resumen de la cuenta en su propio teléfono.

Instalación del backend:

1. Ejecutar `SUPABASE_RECORDATORIOS.sql` en el SQL Editor.
2. Guardar `appi_project_url` y `appi_service_role_key` en Vault.
3. Desplegar `recordatorios-gestion`.

Archivos relacionados:

- `SUPABASE_RECORDATORIOS.sql`
- `supabase/functions/recordatorios-gestion/index.ts`
- `service-worker.js`
- `gestion-client.js`

Archivos relacionados:

- `device-bridge.js`
- `qr-code.js`
- `SUPABASE_DISPOSITIVOS.sql`
- `supabase/functions/dispositivo-puente/index.ts`

## Desarrollo y pruebas

Requisitos: Node.js 20+, Python 3 y Chromium de Playwright.

```bash
npm ci
npx playwright install --with-deps chromium
npm test
```

La suite cubre la aplicación, autenticación, aislamiento por cuenta, solicitudes, membresías, planillas, Mi Encuesta y Mi Gestión.

## Archivos principales

- `index.html`: aplicación principal.
- `encuesta.html`: formulario público responsive.
- `gestion-client.js`: Mi Encuesta y Mi Gestión dentro de APPI.
- `whatsapp-app.js`: elige entre WhatsApp y WhatsApp Business al abrir mensajes en Android.
- `anuncios.js`: carteles del administrador con botones para agendar en APPI o en el teléfono.
- `device-bridge.js`: vinculación y solicitudes de llamada entre dispositivos.
- `qr-code.js`: QR local para vincular teléfonos (MIT).
- `auth-config.js`: configuración pública de Supabase.
- `auth-client.js`: login y sesión.
- `data-sync.js`: sincronización local/nube.
- `appi-dialog.js`: diálogos visuales APPI.
- `service-worker.js`: caché offline y notificaciones Push.
- `scripts/logo_vidrio.py`: generador único del logo de vidrio del arranque.
- `splash/`: imágenes de arranque de iPhone y iPad con el logo de vidrio.
- `vendor/`: bibliotecas fijadas localmente y licencias de terceros.
- `SUPABASE_INSTALACION_COMPLETA.sql`: instalación consolidada.
- `SUPABASE_ENCUESTAS_GESTION.sql`: módulo de encuestas y CRM.
- `SUPABASE_MEMBRESIAS.sql`: acceso, prórrogas y registro seguro de pagos.
- `supabase/functions/encuesta-publica/index.ts`: recepción pública segura.
- `.github/workflows/deploy-backend.yml`: migraciones y despliegue de las Edge Functions.

## Seguridad y privacidad

- Los distribuidores sólo acceden a sus propios registros.
- Las respuestas públicas ingresan mediante una Edge Function; el navegador anónimo no escribe directamente en las tablas.
- Cada invitación vence en 24 horas, se reclama desde un solo dispositivo y queda inutilizada después del envío.
- Los referidos son opcionales y requieren confirmación de autorización.
- Se normalizan teléfonos y se evitan contactos duplicados por distribuidor.
- Supabase es el único mecanismo de acceso; no existe una activación calculada en el navegador.
- `appi_perfiles.membresia_vence` es la fuente de verdad del acceso, incluso cuando se registra un pago o una prórroga.
- La clave `service_role`, los tokens personales y claves de proveedores externos nunca deben incluirse en el frontend ni en GitHub.
- Las grabaciones y transcripciones permanecen en el dispositivo; APPI no acepta claves privadas de IA en el navegador.
- No deben agregarse `alert()`, `confirm()` ni `prompt()` nativos. Usar siempre `APPIDialog`.

## Publicación

La rama `main` se publica mediante GitHub Pages. En cada release:

1. Actualizar la versión visible y `package.json`.
2. Cambiar `CACHE_NAME` en `service-worker.js`.
3. Ejecutar `npm test` y confirmar que la suite completa esté en verde.
4. Ejecutar manualmente **Publicar backend completo de APPI** si hay migraciones o Edge Functions nuevas.
5. Integrar a `main`, revisar GitHub Actions y verificar GitHub Pages.
