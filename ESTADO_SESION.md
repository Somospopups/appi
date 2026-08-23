# Estado al retomar — APPI v323

Repo: `github.com/somospopups/appi` · **suite en verde**.

Corrida local completa: **314 pruebas pasan, 1 salteada, 0 fallan** (sin flakes en esta corrida).

---

## Último cambio: v323 · Nombre y apellido en las tarjetas + el mazo no desaparece

Dos retoques pedidos: (1) los renglones de Cumpleaños y Oportunidades
muestran nombre y apellido legibles con nombreLindo() ("TRONCOSO,
SEBASTIAN" → "Sebastian Troncoso"; da vuelta el orden de la planilla y
baja mayúsculas a título con acentos/guiones; los nombres ya legibles
quedan igual). (2) Hacer una acción ya no cierra el mazo: irYCerrar
pasó a ejecutar() en cablearTope (CTA y renglones); el mazo queda en su
tarjeta y al volver al Home sigue donde estaba. Tests: 1 nuevo de
nombres + 3 adaptados (la acción deja el mazo con count 1); 25 del
Home/mazo en verde.

## Anterior: v322 · El cumpleañero sin teléfono lo dice de frente

Reporte: con dos cumpleañeros, el primero saludaba por WhatsApp y el
segundo no. Test primero: con teléfonos válidos los DOS renglones
saludan → el código estaba sano; el segundo real no tiene número válido
en la planilla y el plan B (abrir Mi Equipo en silencio) parecía rotura.
Arreglo de honestidad: el renglón sin número dice "sin teléfono" (i en
rojo del estilo de ht-lista) y el toque abre APPIDialog explicando que
falta el número en la planilla de Línea Descendente. Igual en la
tarjeta de Oportunidades. Con número válido, WhatsApp directo como en
v320. 2 tests nuevos de guardia.

## Anterior: v321 · El aviso "Hoy cumplen" del Home se retiró

Con la tarjeta de Cumpleaños del mazo a pleno (v320), el widget HOY
CUMPLEN del Home quedó redundante y se quitó a pedido: contenedor
#bdayBannerWrap, renderBdayBanner() y su llamada en
renderHomeCompleto(), CSS de .bday-banner (claro/oscuro) y el keyframes
bounce que solo usaba el banner. OJO: .bday-list/.bday-item son la
lista de cumpleaños de Mi Equipo y siguen igual. avisos-duplicados.spec
reescrito: exige 0 copias del banner, que renderBdayBanner no exista, y
que el cumpleañero siga cubierto por la tarjeta del mazo.

## Anterior: v320 · El saludo al cumpleañero va directo al WhatsApp

Bug real con datos reales: el lector de la planilla de Línea
Descendente guarda el número en `tel`, pero tarjetaCumples y
tarjetaOportunidades buscaban `telefono`/`telf` (campos que la planilla
no genera) → nunca había número y el toque caía al plan B (abrir Mi
Equipo) en vez del WhatsApp con el saludo listo. La suite no lo pescaba
porque el test sembraba `telefono:`, el mismo campo equivocado que leía
el código. Arreglo: `p.tel || p.telefono || p.telf` en ambas tarjetas;
el test del cumple ahora siembra `tel:` y hay guardia nuevo para el
WhatsApp de la tarjeta de Oportunidades. 22 tests del Home/mazo.

## Anterior: v319 · El vuelo de las tarjetas es igual para los dos lados

Al deslizar a la derecha, la tarjeta anterior "entraba desde el
costado": un efecto distinto al vuelo de pasar. Ahora es espejo
perfecto: para la derecha la de arriba vuela girando
(translateX(130vw) rotate(22deg)) como fantasma por encima del mazo
(ht-fantasma, se elimina al terminar) y la anterior sube desde atrás
(arranca como detras1 y sube). pintar() y los selectores del tope
excluyen fantasmas; pasar() devuelve true/false como volver() (con una
sola tarjeta el gesto rebota suave en ambos sentidos). Test nuevo de
guardia del vuelo espejado; 21 tests del Home/mazo.

## Anterior: v318 · El mazo queda a la vista y da la vuelta en bucle

Retoques pedidos por el administrador: se fue el botón 🔔 del Home (el
mazo queda siempre visible, montado arriba de todo apenas carga la
app), se fueron el botón "Pasar ›", la ✗ de cada tarjeta y la ✕ del
encabezado (el mazo no se cierra), y las tarjetas ahora son un bucle
infinito para los dos lados (índice en módulo: tras la última asoma la
primera; antes de la primera, la última). Texto de abajo corregido:
"← Deslizá para un lado o para el otro: las tarjetas dan la vuelta →".
Se eliminó la maquinaria del botón (contador, latido, marca de visto).
APPIHomeTarjetas exporta también pasar/volver. 2 tests nuevos de bucle
y de "no existe nada de lo quitado"; el resto adaptado (20 en total).

## Anterior: v317 · El gesto de atrás cierra el calendario por la puerta

Bug real solo-teléfono: al cerrar el calendario con el botón/gesto de
atrás de Android, panel-atras.js no encontraba el botón de cerrar (el ×
no tenía aria-label) y escondía #calModal con hidden, dejando el fondo
#calOverlay con la clase open para siempre. El guard de overlays lo veía
"abierto" y liberarScrollCuerpo no liberaba nunca más → scroll muerto en
toda la app (Mi Equipo, la pantalla larga, era donde más se notaba). En
la compu nunca se reprodujo porque los tests cerraban con la ✕. Arreglo:
el × del calendario lleva aria-label="Cerrar" (panel-atras lo clickea y
closeCal libera todo), panel-atras vigila #calOverlay (que es quien
lleva la clase open) en vez de #calModal, cerrarTodos() libera el scroll
como cinturón si algún panel se cerró por la ventana, y renderCal revive
un modal que quedó con hidden. 2 tests de regresión nuevos en
panel-atras.spec.js (goBack + scroll vivo + reabrir entero).

## Anterior: v316 · Mazo dentro del Home + 2 bugs de fondo

El mazo dejó de ser popup: vive en una tarjeta contenedora arriba del
Home con todo igual (pila, gestos ida/vuelta, ✗ descarta una, acciones
directas, vaivén); ✕ oculta, 🔔 trae de vuelta; si el Home se repinta,
se re-monta solo conservando la posición. BUG 1 (real, desde v300): el
guard de overlays veía el popup oculto de Crear cuenta
(.membership-modal-overlay en DOM) y liberarScrollCuerpo nunca liberaba
→ scroll muerto en toda la app tras abrir el calendario o una ficha;
ahora solo cuenta overlays visibles + test de regresión. BUG 2: el
bootScreen seguía capturando toques durante su animación de salida
(medio segundo de botones muertos por apertura); con exit-requested/
leaving/gone ahora deja pasar los toques.

## Anterior: v315 · Bonus en Mi Equipo

Las tarjetas OPORTUNIDAD DE BONUS salieron del Home y viven en Mi
Equipo, después del título y antes de los botones, con entrada animada
en cascada (bonusEntra + delays). openEquipo() las repinta frescas. El
Home no pierde nada: el mazo ya trae Oportunidades con WhatsApp directo.
avisos-duplicados.spec exige bonusNotifWrap único y en view-equipo.

## Anterior: v314 · Tareas del calendario con hora

El alta de tareas del calendario del Home suma selector de hora
(opcional). Chip de hora en la lista, orden automático (con hora
primero, ascendente; sueltas al final) y la línea de tiempo de Tu
jornada muestra la hora en lugar del 📌. Sin hora, todo como antes.

## Anterior: v313 · WhatsApp directo al distribuidor

El teléfono de la solicitud ahora queda en appi_perfiles.telefono al
aprobar (y el opcional al crear). El 💬 de cada cuenta va directo si hay
número válido (APPITel); si falta, ofrece cargarlo una vez (queda) o
elegir contacto a mano. Botón 📱 Teléfono para editar/borrar. RPCs
appi_admin_set_telefono / appi_admin_telefonos en SUPABASE_TELEFONOS.sql.

⚠️ PENDIENTE DE DESPLIEGUE: correr SUPABASE_TELEFONOS.sql (y
SUPABASE_PARA_SIEMPRE.sql de v312 si aún no corrió).

## Anterior: v312 · X descarta de a una + Distribuidores cómodos

Mazo: la ✗ de cada tarjeta descarta SOLO esa (vuelo incluido); cerrar
todo = ✕ del encabezado o tocar el fondo. Panel admin/Distribuidores:
sección minimizable con resumen; cada cuenta es un renglón que se abre
con las acciones en botones grandes (💬 WhatsApp al distribuidor con
mensaje amable — via selector de contactos porque el perfil no guarda
teléfono —, 💳 pago, 📅 prórroga, 🔑 contraseña, 👥 personas, 🧪 prueba,
♾️ para siempre, bloquear, eliminar). Membresía ♾️ PARA SIEMPRE nueva
(píldora de creación + aprobar + acción por cuenta): vence 2099, badge
dorado, RPC appi_admin_para_siempre en SUPABASE_PARA_SIEMPRE.sql.

⚠️ PENDIENTE DE DESPLIEGUE: correr SUPABASE_PARA_SIEMPRE.sql.

## Anterior: v311 · El toque no se confunde con arrastre

Bug real de teléfono reproducido con eventos táctiles: el dedo tiembla
5-10px al tocar y el umbral de arrastre (7px) anulaba el click de los
botones de las tarjetas. Ahora el arrastre exige movimiento horizontal
y amplio: 14px general, 26px sobre botones/renglones/✗, y siempre más
horizontal que vertical. Test táctil permanente (toque con 9px de
temblor dispara la acción).

## Anterior: v310 · Acción directa, gesto ida/vuelta, franja que achica

(1) El botón grande de TODAS las tarjetas ejecuta la primera acción
(como Usuarios): Ir con Jorge (ficha), Proponerle a Ana (WA bonus),
Saludar a X (WA cumple), primer carrusel, vencidos de hoy. (2) Deslizar:
izquierda pasa, derecha vuelve a la anterior (entra volando desde la
izquierda; en la primera hace resorte). (3) La franja de PRUEBA mide su
alto real y setea --appi-prueba-alto: el body y el deskSidebar se corren
exactamente eso; nada queda tapado; al apagarse devuelve el espacio.

## Anterior: v309 · El mazo espera su turno

Bug reportado: las tarjetas salían antes de tiempo (sobre la elección
titular/socio). Causa: view-home queda activa debajo de los overlays de
arranque y el mazo salía a los 650ms fijos. Arreglo: appTerminoDeCargar()
verifica bootScreen ido, elección de persona cerrada y no pendiente
(needsPersonChoice), inicio no cubierto y sesión autorizada; el auto-open
espera cada 400ms hasta 18s y recién ahí sale (+500ms de respiro). Test
nuevo que simula la elección pendiente vía needsPersonChoice.

## Anterior: v308 · Enlaces del mazo auto-dirigibles

Regla: tocar un renglón deja EN la persona/acción exacta. Jornada y
nuevos del Panel → ficha del contacto abierta (APPIGestion.abrirContacto
nuevo export); vencidos → Panel vista Hoy; Oportunidades → WhatsApp
directo con la propuesta del Bonus (APPITel); Cultura → Mi Equipo
posicionado en la Cultura; Usuarios → renglones por motivo que abren su
carrusel (APPIMensajes.abrirFila). Cumpleaños ya estaba (v307).

## Anterior: v307 · Saludo directo desde la tarjeta de cumpleaños

Bug: la tarjeta de Cumpleaños abría Mi Equipo vacío (showView sin
openEquipo). Arreglo + mejora: tocar a la persona abre WhatsApp con el
saludo listo (equipo → APPITel con nombre de pila; cliente → plantilla
de Mensajes que además marca la ✓ del día); sin teléfono → pantalla
bien renderizada. CTA "Saludar ahora". Oportunidades y Cultura también
usan openEquipo(). El mazo soporta acción propia por renglón (t.items).

## Anterior: v306 · Mazo a punto

Segunda ronda con el mazo en la mano: (1) deslizar desde cualquier parte
de verdad — el cuerpo scrolleable se quedaba con el gesto; touch-action
pan-y lo libera; (2) letra más grande en toda la tarjeta (título 23px,
frase 17,5px, renglones 15px); (3) cada renglón de las listas navega
directo a su pantalla (con ›); (4) Pasar › pegado al pie de la tarjeta;
(5) vaivén de demostración al abrir (1,5s, se corta al tocar). Fix: la
tarjeta promovida durante el vuelo se cablea al instante (no había
handlers por 330ms).

## Anterior: v305 · Mazo pulido

Ajustes tras la prueba del equipo: tarjetas todas del mismo tamaño (alto
fijo, cuerpo con scroll, CTA anclado), la ✗ en la punta derecha de CADA
tarjeta (cierra el mazo), arrastre desde cualquier parte de la tarjeta
(umbral de 7px distingue toque de arrastre; la captura del puntero se
toma recién al arrastrar para no matar los clicks), vuelo con curva más
suave y las tarjetas de atrás suben en la misma transición.

Bug real encontrado por el camino: el mazo se abría sobre el candado y
sobre el panel admin (view-home queda 'active' debajo). Guardia nueva
sesionDeDistribuidor(): nunca sin sesión, nunca rol admin. Y
botones-vivos.spec ahora cierra el mazo en su limpieza entre clicks.

## Anterior: v304 · Mazo de tarjetas de notificaciones en el Home

Feature grande pedida por el equipo (especificada con 6 preguntas):
home-tarjetas.js. Mazo estilo Tinder al entrar al Home (solo si hay
novedades reales): 💙 especial siempre primera (84 frases rotando sin
repetir + progreso real), y tarjetas inteligentes por categoría (jornada,
oportunidades/bonus, cumpleaños equipo+clientes, Mi Equipo/cultura,
panel, usuarios/acciones). Deslizar pasa (touch y mouse), botón actúa,
"Pasar ›" para PC. Botón 🔔 en el Home con contador que late solo con
tarjetas sin ver (firma por día+categorías en appi_tarjetas_visto_).
Convive con Tu jornada. Llave appi_tarjetas_auto='0' apaga el auto-open
(sembrada en los 23 arneses de tests). 5 tests nuevos en
home-limpio.spec.js.

## Anterior: v303 · WhatsApp del admin + guías con scroll

(1) Selector 📱 normal / 💼 Business en ⚙️ Configuración del panel: los
envíos del admin (bienvenida, contraseña, avisos) abren siempre esa app
en el teléfono, sin preguntar (la preferencia APPIWhatsApp existía pero
el admin no tenía dónde elegirla desde que la sesión admin no ve el menú
de la app). Por dispositivo; en PC manda WhatsApp Web. (2) Todos los
diálogos de APPI ahora scrollean: tarjeta limitada al alto de pantalla y
texto deslizable — las guías largas se leen enteras.

## Anterior: v302 · Salida y frontera de la sesión admin

Dos bugs reales reportados y reproducidos con pruebas: (1) desde v299 el
"?" de ayuda tapaba el botón de cerrar sesión (header.top .help-btn con
right:0 !important); ahora el orden es ? · 🔑 · ↪ y la salida quedó
blindada (si la sync de despedida falla, ofrece cerrar igual). (2) la
sesión admin podía navegar a las vistas de distribuidor; ahora showView
redirige todo a view-admin con rol admin y el chrome de la app (sidebar,
menú, tabs) se oculta con body.appi-admin. Bonus: badge "● 0 NUEVAS" ya
no aparece con cero solicitudes ([hidden] con !important).

## Anterior: v301 · Tablero del panel admin (rediseño Opción B)

Elegido por el equipo entre dos maquetas (en /maquetas del sandbox, no
versionadas). Tablero violeta arriba: recaudado del mes + % vs anterior +
histórico + 12 barras del año (clic → salta a ese mes en Ingresos) +
chips (activas, prueba, por vencer, solicitudes parpadeando). Tarjeta
"⚠️ Necesitan tu atención" (solicitudes, vencimientos, pruebas por
terminar, con navegación). Accesos rápidos Crear cuenta/Solicitudes.
Ingresos y Configuración colapsables. Se eliminaron las 4 tarjetas
sueltas, el panel Estadísticas de membresías (redundante) y la sección
vacía "Configuración de Precios". Sin migraciones nuevas.

## Anterior: v300 · Panel de administración ordenado

Seis mejoras pedidas por el equipo: (1) Crear cuenta pasa a ser un botón
que abre un popup con todos los campos + WhatsApp opcional del titular;
(2) las credenciales se mandan en dos mensajes separados (bienvenida con
pasos SIN contraseña, y la contraseña sola para copiar/pegar) en ambos
flujos; (3) Solicitudes pendientes parpadea fuerte con badge ● N NUEVAS;
(4) Cumplimiento diario arranca minimizado con resumen, buscador por
nombre/DIP y orden alfabético; (5) tarjeta 🧪 En prueba en estadísticas;
(6) sección 📅 Ingresos por mes con selector ‹ ›, total, lista de pagos
y tira anual (RPC nueva appi_admin_pagos).

⚠️ PENDIENTE DE DESPLIEGUE: correr SUPABASE_INGRESOS_ADMIN.sql.

## Anterior: v299 · Ayuda del panel de administración

Auditoría de ayudas: 23 de 24 pantallas tenían su "?" conectado; faltaba
solo el panel de administración. Ahora tiene su guía completa (crear
cuenta con 1 mes/PRUEBA, solicitudes, botones de cada carpeta,
cumplimiento diario, WhatsApp de soporte). Test en prueba.spec.js.

## Anterior: v298 · Home sin "Tu impulso"

A pedido del equipo se retiró completa la tarjeta "Tu impulso" del Home:
vista, lógica (racha, sugerencia del día, chips), estilos y su
notificación diaria. El Home queda con saludo, porqué, Tu jornada y
avisos. Cultura, Las 7 P y el Panel siguen intactos en sus pantallas.
El botón "Avisos" del engranaje se conserva (permiso del navegador).

## Anterior: v297 · Ayuda de los botones ✓/✗

Debajo de los botones de marca del carrusel hay una explicación breve y
siempre visible: el verde es "ya lo hice" (aunque haya sido por llamada o
en persona) y el rojo es "hoy no se va a hacer, queda anotado". La prueba
del carrusel exige que la ayuda esté visible.

## Anterior: v296 · Limpieza de pendientes menores

Barridos los tres pendientes menores de REVISION_APPI.md: (1) los logs del
geocodificador ya no vuelcan direcciones de personas en la consola; (2) los
mensajes de error de Excel dejaron de aconsejar desactivar AdBlock para un
CDN que la app no usa desde v250; (3) verificado que no queda ninguna URL
de cdnjs/jsdelivr/unpkg en el código. El README pasó a v296 y quedó
vigilado: pwa-cache.spec ahora exige que diga la misma versión que el
paquete.

Pendientes que quedan: solo revocar el token de GitHub (manual, del equipo).

## Anterior: v295 · Panel de Contactos privado (bug real de privacidad)

Reportado por el equipo: la sesión admin veía en SU Panel de Contactos los
encuestados/referidos de todas las distribuidoras. Diagnóstico con datos:
las encuestas SIEMPRE se guardaron bien (asignación por token); lo roto era
la cláusula `or appi_es_admin()` en las políticas RLS de gestión + el panel
pidiendo "todo lo visible". Doble arreglo: SUPABASE_PANEL_PRIVADO.sql
(políticas solo-dueño; la Edge Function usa service_role y no pierde nada)
+ filtro soloMios() en gestion-client (nube y caché). Instaladores
alineados. No hubo datos mal guardados; no hay nada que transferir.

⚠️ PENDIENTE DE DESPLIEGUE: correr SUPABASE_PANEL_PRIVADO.sql en Supabase
(URGENTE: hasta entonces la sesión admin sigue viendo datos ajenos si usa
una versión vieja de la app; la v295 ya filtra en el cliente igualmente).

## Anterior: v294 · Modo PRUEBA de 5 días

Píldoras de creación reducidas a [1 mes] [🧪 PRUEBA · 5 días] (también al
aprobar solicitudes). La prueba dura 5 días calendario (vence a medianoche
argentina del quinto día). Franja roja fija en todas las pantallas, sin
cerrar, con días → horas el último día (prueba-banner.js, en el App Shell).
Píldora 🧪 en cada carpeta del panel para poner a prueba cuentas existentes
(pisa la membresía, con confirmación) + badge 🧪 PRUEBA · XD. Pago o
prórroga sacan del modo prueba solos (trigger). Al vencer: bloqueo de
ingreso con mensaje propio.

⚠️ PENDIENTE DE DESPLIEGUE: correr SUPABASE_PRUEBA.sql en Supabase
(además de SUPABASE_ACCIONES_DIA.sql de v292 si todavía no corrió).

## Anterior: v293 · Flechitas en el carrusel

Flechitas ‹ › alrededor del contador para ir y volver entre las tareas del
día. Pasear no marca nada; volver a una tarea marcada muestra su marca y
deja corregirla (se pisa, no se duplica). El resumen final se cuenta de las
marcas reales.

## Anterior: v292 · Acciones del día con ✓ y ✗

Pedido del equipo: la franja "Hoy tenés N mensajes" (Garantías) dura todo el
día, no se puede eliminar, rota sola al cambiar el día, y cada acción se
marca sí o sí con ✓ (hecha) o ✗ (no se hizo) — sin "Saltear". Mandar por
WhatsApp marca la ✓ sola.

Cómputo: marcas por día en appi_acciones_v1_<uid> (prefijo nuevo en
data-sync → sube a appi_datos con nube/offline/titular-socio resueltos).
Migración nueva SUPABASE_ACCIONES_DIA.sql: RPC appi_admin_cumplimiento
(solo rol admin) + sección "Cumplimiento diario" en el panel admin.

⚠️ PENDIENTE DE DESPLIEGUE: correr SUPABASE_ACCIONES_DIA.sql en el SQL
Editor de Supabase. Hasta entonces la sección del panel avisa que falta.

## Anterior: v291 · Solo la planilla del titular

Pedido del equipo: que no se pueda cargar una planilla de Garantías ajena.
La LD ya se validaba por DIP del titular (cliente + triggers de Supabase),
pero la GO se aceptaba ignorando en silencio las filas que no coincidían.

Desde v291 la GO se valida por contenido (el reporte no trae el DIP del
titular): si ningún DIP está en la LD, o con 5+ registros coincide menos
del 20%, se rechaza entera. Aplica en la pantalla principal, en la carga
del Histórico (con la LD del mes, en cualquier orden) y como respaldo en
normalizePeriod al guardar el cierre. Tests en garantias-titular.spec.js.

## Anterior: v290 · El panel dejaba de lado la validación de números

El usuario reportó con captura real que WhatsApp respondía
"+549280434264454 no es un número de teléfono válido" al avisar desde el
panel de administración.

**Causa:** la migración v289 unificó los números en `telefono.js`
(`window.APPITel`), pero `admin-panel.js` conservó una función propia
(`whatsappPhone`) que quedó afuera y agregaba dígitos sin validar el largo:
`+54 280 434264454` (14 dígitos, sin el 9) → `549280434264454` (15 dígitos,
no existe).

**Arreglo (v290):**
- `admin-panel.js`: se eliminó `whatsappPhone`; los avisos de "solicitud
  recibida" y "cuenta aprobada" usan `APPITel.abrir`, que valida y avisa.
- `admin-panel.js`: el número de soporte se valida con `APPITel.normalizar`
  antes de guardarse.
- `account-request.js`: el botón de soporte normaliza el número configurado
  y distingue "no configurado" de "mal cargado".
- `telefono.spec.js`: casos nuevos — números con dígitos de más se rechazan,
  área 280 (Rawson/Trelew) válida con y sin 15, y un test de convención que
  prohíbe concatenar `'549'` fuera de `telefono.js`.

Versionado alineado: `package.json` 290.0.0, caché
`appi-v290-numeros-del-panel`, versión visible v290.

---

## Pendientes que siguen abiertos

Del informe `REVISION_APPI.md`, quedan solo los menores:

1. **34 `console.log` en `index.html`** — conviene revisar los que impriman
   datos de personas.
2. **Una URL externa** sobrevive: la sombra de los marcadores del mapa
   (`cdnjs`). Cosmética; el mapa anda igual sin ella.
3. **`openai_api_key` en `localStorage`** para la Grabadora. Verificado que
   no se sincroniza ni sale en backups.
4. **README desactualizado** (dice v265; el paquete va por v290).
5. ⚠️ **Revocar el token de GitHub** → https://github.com/settings/tokens
   (pendiente de siempre; es manual, desde la cuenta del equipo).
