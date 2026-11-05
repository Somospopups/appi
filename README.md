# APPI

## v918 · Inicio inmediato

- Reanudación local segura: Home primero; validación y nube en segundo plano.
- Planillas grandes y bibliotecas de Excel/PDF/escaneo salen de la ruta crítica.
- OCR se carga solamente al abrir la cámara de Mi stock.
- Versión: **v918 · Segura** → Cache `appi-v918-inicio-inmediato`.

PWA local-first para planificación mensual, presupuesto, equipo, garantías, contactos, notas, grabadora, Histórico, encuestas y gestión de referidos.

> **Agentes:** al retomar el trabajo, leer [`AGENTE.md`](AGENTE.md) y preguntar si el propietario está trabajando desde Arena.ai. Si confirma que sí, seguir [`PUBLICAR_CAMBIOS.md`](PUBLICAR_CAMBIOS.md) y entregar al final un ZIP con `PUBLICAR.bat` y un Git bundle.

## Estado actual

## v917 · Inicio móvil protegido

- **La app instalada en Android ya no espera indefinidamente a la red:** el Service Worker entrega de inmediato el HTML guardado y actualiza la copia en segundo plano.
- Scripts y estilos disponibles en caché se sirven primero, incluso cuando el teléfono muestra señal pero la conexión no responde.
- Las cuatro hojas de estilo de Appi dejaron de bloquear el primer dibujo: Android abandona su splash nativo y muestra el arranque real de APPI sin esperar esos archivos.
- Toda solicitud de red del arranque tiene un límite; si no existe una copia local, APPI muestra una explicación en vez de quedar congelada.
- Una actualización sólo reemplaza la versión anterior cuando el HTML de inicio quedó guardado correctamente.
- Se agregó una prueba PWA real: instala el Service Worker, corta por completo la conexión y exige que APPI vuelva a abrir desde su copia local.
- Versión: **v917 · Segura** → Cache `appi-v917-inicio-movil`.

## v916 · Arranque rápido y protección para cuentas grandes

- **Mi avance ya no compite con el inicio de APPI:** el login, la sincronización inicial y el primer render terminan antes de calcular el progreso comercial.
- Se eliminó el análisis pesado que se ejecutaba dentro de cada render del Home y podía repetir el trabajo varias veces durante el arranque.
- La pantalla completa de Mi avance se construye sólo al abrirla; mientras está cerrada no genera todo su DOM ni monta animaciones ocultas.
- El análisis de usuarios anteriores ahora hace **una sola lectura** del estado de reactivación y una pasada lineal por la planilla. Antes podía leer y parsear el mismo dato por cada usuario, varias veces, congelando cuentas con muchas garantías.
- Los resultados de reactivación se cachean brevemente y se invalidan al sincronizar, cambiar datos o abrir Mi avance, conservando información actual sin bloquear la interfaz.
- Se agregó una regresión de rendimiento con **4.000 usuarios y 1.000 reactivaciones** para evitar que el problema vuelva.
- Versión: **v916 · Segura** → Cache `appi-v916-arranque-rapido`.

## v915 · Mi avance con evidencia real y próximo paso comercial

- El Home suma una tarjeta compacta **debajo del calendario** y una nueva pantalla completa **Mi avance**, también accesible desde Mi negocio y desde el asistente Appi.
- Las cuatro áreas —**Orden, Constancia, Movimiento comercial y Resultados**— se calculan sólo con evidencia ya guardada en la jornada, el Panel de Contactos, la agenda, la reactivación y los presupuestos generados.
- Appi conserva la primera medición y fotografías diarias para comparar **Cuando empezaste / Hoy**, mostrar el resumen semanal y explicar el origen de cada número. No se atribuye ventas ni completa resultados automáticamente.
- El plan diario detecta seguimientos sin próximo paso, candidatos reales para demostraciones, usuarios anteriores para retomar, necesidad de sumar contactos y presupuestos pendientes. Appi abre la ficha o herramienta correcta; **el distribuidor siempre decide y confirma**.
- La preparación de visitas a usuarios anteriores requiere dos confirmaciones y crea un seguimiento con fecha sin duplicar contactos. Los presupuestos se registran al generar el PDF y una firma determinística evita contarlos dos veces.
- El progreso forma parte de la sincronización y del backup de la cuenta. La fusión conserva la línea de partida más antigua y une eventos, planes y fotografías de distintos dispositivos, titular y socio.
- Diseño responsive profesional con animación interna de Appi, modo oscuro, recorrido guiado y respeto por `prefers-reduced-motion`.
- Versión: **v915 · Segura** → Cache `appi-v915-mi-avance`.

## v914 · CyberWeek temporal y financiación con vencimiento automático

- **CyberWeek del 5 al 8/11/2026:** PSA Iontrix 3 tiene 25% OFF en precio normal y Plan Canje; las cinco PSA Senior4 (Bianco, Nero, BM, Grigio y Terra) tienen 10% OFF en ambas modalidades.
- Los demás productos con precio de **Plan Canje habilitado** reciben 10% OFF sólo sobre ese precio. Las reglas específicas ganan, por lo que los descuentos no se acumulan.
- La promoción anterior de **Vero 45%** queda cerrada el 4/11 y no se extiende. Los precios base permanecen intactos y todo vuelve automáticamente a lista el 9/11.
- Financiación actualizada con las once entidades de las piezas aprobadas. **Credicoop/Cabal** ofrece 3, 6, 9, 12 y 18 cuotas del 5 al 11/11, sin 15 cuotas ni reintegro.
- La Lista y el presupuesto ocultan automáticamente una entidad antes de su comienzo o después de su vencimiento. Pantalla y PDF repiten descuento, cuotas, canal y vigencia; los reintegros se informan sin descontarlos del total.
- Versión: **v914 · Segura** → Cache `appi-v914-cyberweek`.

## v913 · Jornada garantizada de 10 tareas útiles

- La jornada diaria ahora tiene **exactamente 10 tareas útiles**: primero usa clientes realmente elegibles y completa los lugares libres con acciones comerciales concretas.
- **No inventa ni repite contactos** para llegar a diez. Las personas asignadas avanzan por una cola de rotación aunque la tarea anterior quede pendiente.
- La lista del día queda persistida: no se reordena al recargar y se combina de forma determinística entre dispositivos, titular y socio.
- Se corrigió el cálculo vacío que podía quedar memorizado antes de que MI PSA terminara de cargar, y el recálculo al cambiar de fecha.
- La tarjeta de inicio y la franja de Usuarios muestran juntas las tareas con clientes y las acciones comerciales, con su progreso real.
- Versión: **v913 · Segura** → Cache `appi-v913-jornada-10`.

## v912 · El titular también entra al ranking del Tablero

- **El ranking de ventas del Tablero** (`Mi negocio → Tablero`, con sus pestañas Personal y Organización y los cumpleaños debajo) es **otro componente**: se arma con la Línea Descendente, donde la fila del titular (nivel 0) no viene. Por eso el titular no aparecía **aunque sus datos ya estuvieran cargados** — las correcciones anteriores tocaban el ranking del Histórico, no éste.
- Ahora el Tablero agrega al titular con su **volumen personal**: primero el del cierre (`equipoData.titular.pbPersonal`) y, si no viene, el **"Volumen Personal" del Reporte de Bonos** (`appi_bonos_v1`).
- En **Personal** aparece con su PB personal; en **Organización**, con lo suyo más toda su red.
- **No se duplica**: si su fila llegó dentro de las personas, se descarta del árbol para el ranking.
- Tocar su fila explica de dónde salió el número. El ranking que se comparte por WhatsApp usa exactamente la misma lista.
- Si no hay ningún volumen personal, no se inventa un puesto.
- Versión: **v912 · Segura** → Cache `appi-v912-ranking-completo`.

## v911 · Tu volumen personal entra al ranking aunque Bonos sea de otro mes

- **Caso real que seguía fallando**: cierre de *octubre* y Reporte de Bonos de *noviembre*. La v910 exigía el mismo mes, así que el 47,65 del titular no se usaba y volvía a quedar afuera.
- **Nueva regla**: primero manda el cierre (tu fila del árbol o el PB guardado). **Si el cierre no trae tu PB**, se usa el "Volumen Personal" del Reporte de Bonos **aunque sea de otro mes**, y la app lo dice en pantalla: *"Tu volumen personal viene del Reporte de Bonos de Noviembre-2026"*.
- **Si el cierre sí trae tu PB, Bonos no lo pisa** (nunca se mezclan números de dos meses).
- **Funciona aunque el cierre guardado no tenga bloque de titular**: el nombre y el DIP se toman del Reporte de Bonos.
- El período del reporte se lee en varios formatos (`Noviembre-2026`, `Noviembre 2026`, `11/2026`, `2026-11`).
- Versión: **v911 · Segura** → Cache `appi-v911-ranking-completo`.

## v910 · Tu volumen personal también cuenta cuando viene de Bonos

- **El ranking personal ahora usa el "Volumen Personal" del Reporte de Bonos** cuando la Línea Descendente no trae el PB del titular. Antes, si tu fila venía sin PB (o no venía), tu producción existía —la veías en Bonos— pero el ranking no tenía de dónde sacarla y quedabas afuera.
- **Sólo se usa del mismo mes**: el volumen de Bonos de noviembre no se mezcla con el cierre de octubre.
- **Si tu fila está con 0** en la Línea Descendente pero Bonos dice 47,65, el ranking toma 47,65.
- **No se duplica**: se toma el mayor número disponible entre el cierre, tu fila y Bonos.
- Versión: **v910 · Segura** → Cache `appi-v910-ranking-completo`.

## v909 · El titular entra al ranking y el círculo deja de tapar

- **El titular ya figura en el ranking de PB personales.** Su fila (nivel 0 del reporte de PSA) no forma parte del árbol de personas: vivía sólo en `period.titular`. Por eso, aunque el reporte de bonos mostrara el **volumen personal** (por ejemplo 50 PB), en *Histórico → Rankings del cierre → Personal* no aparecía. Ahora se suma con ese mismo PB, en el puesto que le corresponde.
- **En Organización** aparece con lo suyo más toda su red, y **el "PB personal" del resumen** dejó de mostrarse vacío cuando el titular no estaba en la lista.
- **Tocar su fila abre su ficha**: PB personal (el mismo del reporte de bonos), PB del equipo y PB total.
- **No se duplica**: si su DIP ya viene dentro de las personas, no se agrega dos veces.
- **El círculo de Appi ya no se come los toques.** Su aro decorativo se estiraba hasta el ancho del encabezado donde vive (el del Histórico es sticky) y bloqueaba botones vecinos como **"‹ Volver"**. Ahora el aro mide lo mismo que el círculo y no recibe toques.
- **Desborde del archivo anual:** el globito del encabezado ("Todos los datos del año") ya no estira la tarjeta 16 px fuera de la pantalla.
- Versión: **v909 · Segura** → Cache `appi-v909-ranking-personal`.

## v908 · La caja de Appi, más clara

- **Se fue la opción repetida.** "¿Cómo funciona esta pantalla?" explicaba lo mismo que el recorrido nuevo: ahora hay **una sola** forma de pedir la explicación de la pantalla, *"¿Qué hay en mi pantalla?"*.
- **"Appi está lista para ayudarte" arriba de todo**, con el punto verde al lado. El cartelito con el nombre *Appi* que estaba abajo del personaje ya no está: el nombre aparece en el saludo y en el título.
- **Más aire entre las opciones:** 11 px entre el buscador y la primera opción (antes quedaba pegada), 12 px hasta el título de la sección y 8 px entre una opción y la siguiente.
- Versión: **v908 · Segura** → Cache `appi-v908-lista-para-ayudarte`.

## v907 · «¿Qué hay en mi pantalla?»: Appi te hace un recorrido

- **Una opción nueva adentro de Appi.** Al tocar el círculo de Appi, la caja abre con la fila **"¿Qué hay en mi pantalla?"** arriba de todo, destacada en celeste: *"Te lo muestro y te lo explico"*.
- **El recorrido baja el telón:** la pantalla se oscurece y queda **iluminado un solo lugar** por vez, con un anillo celeste que late y la tarjeta crema de Appi explicándolo con palabras simples.
- **Cada paso se mueve y se marca:** el recorrido lleva la vista hasta el lugar (desplazamiento suave), lo enmarca y la colita de la tarjeta apunta justo a lo que está mostrando, aunque scrollees o gires el teléfono.
- **Se maneja como un cuento:** *"2 de 5"*, puntitos, **Atrás**, **Siguiente** y en el último paso **Terminar**. También con las flechas del teclado, y se cierra con **Escape** o la ×.
- **Escuchar.** Cada paso se puede oír: Appi lo lee en voz alta (es-AR) con el mismo botón de siempre.
- **Recorridos escritos** para Home, Mi mes, Mi negocio, Herramientas, Lista de precios, Mi stock, Usuarios, Gestión de contactos e Histórico. En las demás pantallas el recorrido se **arma solo** con las tarjetas y títulos que se ven, así nunca deja a nadie sin explicación.
- **Si hay un aviso abierto**, el recorrido es sobre el aviso: qué es y dónde se cierra. Cuando lo cierran, lo vuelven a abrir para seguir con el resto de la pantalla (no se explica lo que está tapado).
- Todo local: no hay red, ni IA remota, ni claves.
- Versión: **v907 · Segura** → Cache `appi-v907-recorrido`.

## v906 · Appi es el círculo del «?»

- **Se van los signos de pregunta.** El botón de ayuda de todas las pantallas (25 en total) es ahora el **círculo de Appi**: crema, con anillo celeste y su carita animada.
- **El círculo se mueve para que lo vean:** respira, el anillo late cada tanto, parpadea, mira para los costados y, cuando hace el saludo del día, se hamaca tres veces. `aria-label="Appi, tu asistente"`.
- **Un toque y se abre la caja**, en la familia crema del dock: la gotita entera a la izquierda con su nombre *Appi*, la pregunta, el buscador de siempre (usuarios, series, productos, contactos y pantallas), los accesos más usados y el botón de escuchar.
- **La ayuda no se pierde:** adentro hay una fila, *"¿Cómo funciona esta pantalla?"*, que abre la explicación de la pantalla en la que estabas.
- **Se cierra tocando afuera**, con la × o con Escape; nunca queda un signo de pregunta suelto en el camino.
- Versión: **v906 · Segura** → Cache `appi-v906-circulo-de-appi`.

## v905 · Appi se asoma desde el borde derecho

- *(Reemplazado en la v906: la gotita asomada dio lugar al círculo del «?».)* **El dock vuelve a tener cuatro botones.** Se quitó el quinto botón de Appi que achicaba a los demás: Home, Mi mes, Mi negocio y Herramientas recuperan su tamaño y su etiqueta completos.
- **Appi vive asomada en el borde derecho** de la pantalla, inclinada hacia adentro y con el costado cortado por el borde: no tapa el dock ni la navegación.
- **Saluda cada tanto:** se estira hacia la pantalla, levanta la mano y aparece la viñeta *"¡Hola! Tocame y hablamos."*. El primer saludo del día llega a los dos segundos de abrir la app.
- **Un toque y sale de su escondite:** se desliza hasta pararse sobre el dock con el panel abierto, como siempre. **Al cerrar el panel vuelve sola** al borde derecho.
- Los saludos automáticos se pueden apagar con `APPIAssistant.saludos(false)`.
- Versión: **v905 · Segura** → Cache `appi-v905-asomada`.

## v904 · La gotita Appi, dibujada y animada de verdad

- La asistente dejó de ser cinco imágenes WebP que se movían: ahora es **un dibujo vectorial propio (SVG)** con piezas separadas, en celeste sólido y sin degradés.
- Se animan de verdad el cuerpo, los párpados, las pupilas, las cejas, la boca, los brazos y los pies.
- En reposo respira, parpadea y saluda con la mano; al pensar se inclina y le aparecen burbujas; al festejar salta con destellos; al sorprenderse se estira con admiración; al alertar se acerca con un pulso ámbar.
- La boca se mueve sílaba por sílaba mientras Appi lee en voz alta, y el botón pasa a **Detener** para cortar la lectura.
- **Appi vive en el dock:** hay un botón suyo al final. *(Reemplazado en la v905 por la gotita asomada: el quinto botón achicaba los otros cuatro.)*
- El panel es un buscador con cuatro accesos directos que son **las pantallas que más usa cada persona** (se cuentan en el propio teléfono).
- Ese buscador también busca **en los datos**: usuarios, distribuidores del equipo, números de serie de los purificadores, productos de la lista, contactos y pantallas, cada grupo por separado, con acceso directo al resultado y la coincidencia resaltada.
- Se retiró la carrera que podía pisar una respuesta con el estado "normal" al terminar de cargar la app.
- El dibujo no pesa: no hay imágenes ni descargas, funciona sin conexión y respeta el movimiento reducido.
- Versión: **v904 · Segura** → Cache `appi-v904-gotita-animada`.

## v903 · Precios verificados contra la lista oficial del 1 al 4 de noviembre

- Corrige 25 importes finales de Plan Canje que necesitaban un 10% adicional durante la promoción.
- Distingue descuentos de precio normal y descuentos exclusivos de Plan Canje.
- La vigencia oficial comienza el 1 de noviembre y vence automáticamente al finalizar el 4.
- Recupera Senik y Soda Burby, que estaban ocultos por una marca promocional vencida.
- Incorpora seis repuestos/servicios presentes en el PDF oficial y conserva la promoción de cilindro incluida en esa lista.
- Mantiene Appi animada y todas las funciones publicadas en v902.
- Versión: **v903 · Segura** → Cache `appi-v903-precios-verificados`.

## v902 · Appi animada desde el dock

- **Appi** se asoma desde el borde inferior derecho, detrás del dock, y saluda una vez por día.
- Al tocarla sube completa y despliega su conversación hacia la izquierda sin tapar la navegación.
- Tiene cinco estados visuales realmente distintos: normal, pensando, feliz, sorprendida y alerta.
- Permite hablar con el micrófono o escribir; muestra siempre lo que entendió y nunca queda escuchando sola.
- Responde consultas de la jornada, explica pantallas y abre por voz las principales herramientas de APPI.
- Incluye lectura opcional de la respuesta, alternativa escrita, modo oscuro y movimiento reducido.
- No agrega contraseñas, tokens ni servicios externos.
- Versión: **v902 · Segura** → Cache `appi-v902-appi-animada`.

## v901 · Mi Encuesta explicada paso a paso

- **Mi Encuesta** incorpora una guía visible que explica qué hace y cómo utilizarla.
- Un aviso destacado aclara que cada invitación es única y que cada nuevo envío debe comenzar desde esta pantalla.
- Tres pasos muestran cómo crear la invitación, elegir la persona en WhatsApp y recibir automáticamente la respuesta en el Panel de Contactos.
- Un recordatorio indica que no se deben reutilizar invitaciones anteriores, incluso si se vuelve a enviar a la misma persona.
- Se agrega el acceso **Ver respuestas en Panel de Contactos**.
- Se conservan el envío privado, WhatsApp, la animación del avión y el ingreso automático de respuestas y personas recomendadas.
- Versión: **v901 · Segura** → Cache `appi-v901-encuesta-clara`.

## v900 · Contactos claros y encuesta en Herramientas

- **Mi Encuesta** aparece como primera tarjeta de **Mis herramientas** y vuelve a abrir su propia pantalla.
- El Panel de Contactos queda dedicado a agregar personas y dar seguimiento: Hoy, Todos y Resultados.
- Hoy muestra una única frase con la cantidad de personas que requieren atención y pone primero los vencidos.
- Las fichas ya no exponen puntos ni niveles de prioridad; APPI sigue ordenando internamente.
- Todos usa cuatro filtros simples y Resultados muestra primero contactos nuevos, presentaciones y cierres.
- Agenda del teléfono, opciones de lista, estadísticas completas, mensajes, respuestas e historial siguen disponibles como detalles secundarios.
- Después de una llamada o WhatsApp se ofrecen cuatro resultados claros y el cierre se completa sólo cuando corresponde.
- Versión: **v900 · Segura** → Cache `appi-v900-contactos-claros`.

## v899 · Puntajes mensuales verificados

- Corrige la lectura de PB con separador de miles de PSA: valores como `1.234` vuelven a representar **1234 PB**, no 1,234.
- La corrección se aplica al Ranking de Ventas **Personal** y **Organización** de Mi negocio y a cada cierre mensual de Histórico.
- Antes de guardar, APPI contrasta personas, PB individuales y total contra la normalización del informe de origen.
- Una Línea Descendente con DIPs repetidos o valores que no coinciden no se guarda, para evitar duplicaciones silenciosas.
- Histórico detecta automáticamente los cierres PSA creados con el lector anterior y vuelve a recuperarlos para el año vigente y el anterior.
- Se conserva la regla aprobada: Organización suma el PB propio y el de todos los descendientes.
- Versión: **v899 · Segura** → Cache `appi-v899-ranking-pb-validado`.

## v898 · Crear una cuenta más visible

- La opción **Crear una cuenta** ahora se destaca en turquesa desde la pantalla de acceso.
- Incorpora la etiqueta **NUEVO** y un pulso suave de tres repeticiones que luego se detiene.
- Una indicación clara explica: **¿Es tu primera vez? Tocá “Crear una cuenta”**.
- Al abrir el formulario, la indicación desaparece para mantener una pantalla limpia.
- Se respeta la preferencia del dispositivo para reducir movimientos y se conserva el acceso habitual para quienes ya tienen cuenta.
- Versión: **v898 · Segura** → Cache `appi-v898-crear-cuenta-visible`.

## v897 · Acompañamiento después de una reactivación

- Cuando APPI detecta una cuenta desactivada, sin membresía o con la membresía vencida, guarda localmente que esa persona necesitará revisar la preparación al volver.
- En el primer ingreso exitoso después de reactivar la cuenta, el recorrido de primeros pasos aparece automáticamente desde la bienvenida.
- Se muestra una sola vez: al cerrarlo o terminarlo, la marca de reactivación se elimina.
- La marca está asociada a la cuenta, por lo que no afecta a otros distribuidores que usen el mismo dispositivo.
- Los usuarios habituales no reciben un popup adicional y conservan el acceso manual desde **Mi perfil → Revisar primeros pasos**.
- Versión: **v897 · Segura** → Cache `appi-v897-reactivacion-acompanada`.

## v896 · Primeros pasos desde Mi perfil y alerta simplificada

- **Mi perfil** incorpora **Revisar primeros pasos** dentro de una sección clara de preparación de APPI.
- El botón vuelve a abrir desde la bienvenida el recorrido de acceso directo, MI PSA y avisos todas las veces que la persona lo necesite.
- La alerta preventiva de Lista de precios conserva su diseño aprobado, pero el botón rojo ahora dice solamente **CONTINUAR**.
- Al tocar **CONTINUAR**, APPI mantiene la actualización y verificación directa de precios antes de mostrar la lista.
- Se elimina por completo el enlace inferior **Continuar a la lista**; la X continúa disponible para cerrar sin actualizar.
- Versión: **v896 · Segura** → Cache `appi-v896-perfil-y-alerta-precios`.

## v895 · Instalación directa en Android

- Al tocar **Tengo Android** en el primer ingreso, APPI abre inmediatamente la instalación nativa cuando el navegador la ofrece.
- Después de confirmar la instalación, el recorrido continúa directamente con MI PSA, sin obligar a leer pasos que ya no son necesarios.
- Si el teléfono no ofrece instalación automática o la persona la cancela, APPI muestra la guía Android habitual y permite continuar más tarde.
- Si APPI ya está abierta desde su ícono, el acceso directo se reconoce como listo y se avanza automáticamente.
- iPhone conserva la guía obligatoria de Safari porque Apple no permite iniciar esa instalación desde un botón web.
- Versión: **v895 · Segura** → Cache `appi-v895-instalacion-android-directa`.

## v894 · Primer ingreso acompañado

- El primer ingreso ahora es un único recorrido progresivo, con textos claros, botones grandes y la posibilidad de volver atrás o continuar más tarde.
- La persona elige iPhone o Android y recibe indicaciones específicas para crear el acceso directo de APPI.
- El mismo recorrido conecta MI PSA con los campos reales de APPI y permite elegir y activar los avisos reales del teléfono.
- El tutorial anterior y los popups automáticos de MI PSA y notificaciones quedan coordinados para no superponerse.
- Los pasos no completados se guardan y aparecen como una tarjeta discreta en el Home, sin volver a interrumpir cada ingreso.
- Se validaron los recorridos completos de iPhone y Android, la persistencia, los permisos, el caché offline y la compatibilidad con autenticación.
- Versión: **v894 · Segura** → Cache `appi-v894-primer-ingreso`.

## v893 · Verificación preventiva de precios

- Al ingresar a Lista de precios aparece una alerta preventiva bordó para recordar que los valores pueden cambiar.
- La advertencia se muestra en cada ingreso y puede cerrarse para continuar sin actualizar.
- **ACTUALIZAR Y VERIFICAR PRECIOS** cierra la alerta y ejecuta directamente la actualización existente.
- El popup reutiliza la animación 4 de APPI, con rebote suave y sonido de gota, e incluye modo oscuro y controles accesibles.
- Se conservan la lista, los precios, los beneficios CyberMonday y la financiación publicados en v892.
- Versión: **v893 · Segura** → Cache `appi-v893-alerta-precios`.

## v892 · Beneficios CyberMonday PSA

- Del 2 al 4 de noviembre de 2026 aplica automáticamente 45% OFF a PSA Vero, 25% OFF a PSA Iontrix 3 y 10% OFF a todas las variantes PSA Senior4.
- Los beneficios alcanzan precio normal y Plan Canje, sin modificar los precios base ni acumular otros descuentos de producto.
- Lista, Presupuesto y PDF muestran precio anterior, porcentaje y precio final; el 5 de noviembre la campaña vence automáticamente.
- Se conserva el diseño de financiación aprobado en v891, con cuotas y reintegros según banco/tarjeta y sin descontar el reintegro del total.
- El actualizador audita los porcentajes temporales contra Tienda PSA y conserva Plan Canje, packs, categorías y orden del catálogo.
- Se incorpora `FINANCIACION_TARJETAS_APPI.md` como regla permanente de diseño y actualización segura.
- Versión: **v892 · Segura** → Cache `appi-v892-cybermonday-2026`.

## v891 · Financiación de tarjetas actualizada

- Presupuesto incorpora la financiación oficial publicada por PSA el 2 de noviembre de 2026.
- Cada entidad ofrece sólo sus cuotas reales; se elimina el plan genérico que agregaba opciones inexistentes.
- Al seleccionar una tarjeta se muestran beneficio, tarjetas admitidas, canal y vigencia.
- Se incorpora Banco Provincia y se actualizan Naranja X, Macro, Galicia, BBVA, Nación, Santander, Hipotecario, Cabal/Credicoop, American Express y las tarjetas provinciales.
- Los PDF incluyen las condiciones correspondientes a la entidad elegida.
- El actualizador conserva la última tabla verificada si una publicación futura no permite interpretar todos los planes de forma segura.
- Versión: **v891 · Segura** → Cache `appi-v891-financiacion-tarjetas`.

## v890 · Compartir rankings como imagen

- En Histórico, el toque normal continúa alternando entre **Personal** y **Organización**.
- Al mantener presionado cualquiera de esos botones, APPI genera el PNG del ranking correspondiente al cierre elegido.
- La imagen conserva el Top 10, los puestos, los nombres, las categorías, los colores y los PB del mes, sin mezclar cierres.
- En dispositivos compatibles se abre el menú nativo para elegir WhatsApp; si no se pueden compartir archivos, el PNG se descarga para adjuntarlo manualmente.
- Una indicación visible explica el gesto y una barra muestra el avance de la pulsación prolongada.
- Versión: **v890 · Segura** → Cache `appi-v890-compartir-ranking`.

## v889 · Rankings mensuales en Histórico

- Cada cierre guardado muestra la misma tarjeta **Ranking de Ventas** de Mi negocio.
- Incluye los dos rankings aprobados: **Personal** por PB individual y **Organización** por PB total de cada organización.
- El Top 10 se reconstruye exclusivamente con la Línea Descendente del mes elegido, por lo que octubre no se mezcla con noviembre.
- Conserva puestos, nombres, categorías, colores y formato de PB de la tarjeta original.
- Los nombres siguen ocultos en el resumen y sólo aparecen al abrir deliberadamente **Rankings del cierre**.
- También incorpora la recuperación visible y el reintento inmediato preparados para v888.
- Versión: **v889 · Segura** → Cache `appi-v889-rankings-historicos`.

## v888 · Histórico visible y reintento inmediato

- Si Histórico todavía no tiene cierres, ya no queda vacío ni esperando en silencio: muestra el motivo exacto de la falla.
- **Reintentar ahora** vuelve a consultar MI PSA inmediatamente, sin esperar el bloqueo automático de tres horas.
- **Verificar datos de MI PSA** abre los campos editables de Centro, Número y Clave cuando faltan datos o el acceso no es válido.
- Un fallo de sincronización con la nube ya no impide que comience la recuperación directa desde PSA.
- Los PDF de años anteriores continúan accesibles aunque todavía no exista un cierre del año vigente.
- Se conserva el diseño aprobado de Histórico y toda la recuperación automática mediante los informes PSA 69, 34 y 71.
- Versión: **v888 · Segura** → Cache `appi-v888-historico-visible-y-reintento`.

## v887 · Scroll siempre fluido en Usuarios

- El desplazamiento continuo ya no destruye y reconstruye las fichas visibles al avanzar cada renglón.
- La ventana virtual se prepara por bloques amplios y conserva exactamente los mismos nodos mientras permanecen cerca de la pantalla.
- Al avanzar sólo se agregan las fichas nuevas y se retiran las que quedaron lejos, sin destellos ni espacios vacíos.
- El diseño aprobado de v886, la apertura de detalles, la búsqueda, los filtros, los contadores y todas las funciones permanecen iguales.
- La prueba focalizada recorre 1.500 garantías, conserva la misma ficha durante un desplazamiento continuo de 1.728 píxeles y comprueba que las fichas nuevas sigan abriendo sus productos y acciones.
- Versión: **v887 · Segura** → Cache `appi-v887-scroll-usuarios-fluido`.

## v886 · Renglones simples en Usuarios

- Cada renglón de Usuarios muestra únicamente la cantidad de productos, el nombre y apellido, el estado del producto más reciente y su fecha de vencimiento.
- La cantidad aparece destacada a la izquierda, el nombre ocupa el centro y el estado con su fecha queda ordenado a la derecha.
- Los estados **VENCIDO**, **POR VENCER** y **VIGENTE** se identifican automáticamente en rojo, ámbar y verde.
- Todo el renglón continúa siendo tocable para abrir productos, historial, datos de contacto y acciones.
- La agrupación, búsqueda, filtros, contadores, virtualización y demás funciones de Usuarios se conservan sin cambios.
- Versión: **v886 · Segura** → Cache `appi-v886-filas-usuarios-simples`.

## v885 · Usuarios completamente automático

- Se eliminó de la cabecera de Usuarios la tarjeta que mostraba “GARANTÍAS · fecha/hora”.
- También se quitó el botón manual de actualización de Garantías: ya no es necesario porque APPI sincroniza automáticamente con MI PSA.
- El bloque de acciones del día sube y aprovecha el espacio liberado, sin dejar un hueco en la pantalla.
- La sincronización automática, los datos guardados y todas las funciones de Usuarios permanecen activos.
- Versión: **v885 · Segura** → Cache `appi-v885-usuarios-automaticos`.

## v884 · Scroll inmediato en listas grandes de Usuarios

- Usuarios conserva todas las personas en memoria para búsquedas, filtros, estadísticas, zonas, tarjetas, cumpleaños, reasignados, Usuarios estrella, coincidencias y mensajes.
- En listas grandes, el navegador crea sólo las fichas cercanas a la pantalla, con un margen preventivo antes y después; la altura y la posición natural del desplazamiento no cambian.
- Al desplegar una persona siguen apareciendo bajo demanda todos sus productos, fechas, historial y acciones, y la ficha permanece abierta aunque salga momentáneamente de la pantalla.
- La regresión de 1.500 garantías exige menos de 120 cabeceras simultáneas, cuatro saltos rápidos sin huecos y respuesta inferior a un segundo. En las mediciones finales, el salto más lento tardó alrededor de 140 ms.
- El comportamiento y la apariencia aprobados en v883 se mantienen sin paginación, botones “Cargar más” ni pérdida de funciones.
- Versión: **v884 · Segura** → Cache `appi-v884-scroll-usuarios`.

## v883 · Recuperación de velocidad en Usuarios

- El Home deja para después la preparación de la planilla y ya no construye miles de fichas invisibles durante el inicio.
- La unificación y la revisión de coincidencias usan índices de identidad y comparan únicamente candidatos posibles, sin recorrer toda la base contra toda la base.
- Al entrar a Usuarios se muestran las cabeceras y cada historial completo se crea recién cuando se despliega la persona.
- Se mantiene todo el comportamiento de v882: identidad segura, decisiones manuales, historial, Usuarios estrella, filtros, mensajes y Plan Canje sobre la compra más reciente.
- Se agregó una prueba de volumen con 1.500 garantías; en el entorno de prueba el Home bajó de aproximadamente 30 segundos a alrededor de 1,5 segundos.
- Versión: **v883 · Segura** → Cache `appi-v883-rendimiento-usuarios`.

## v882 · Usuarios unificados y Usuarios estrella

- Usuarios representa personas y no renglones de garantía: reúne automáticamente las compras corroborando nombre con teléfono, correo, cumpleaños o domicilio.
- Las coincidencias dudosas nunca se unen sólo por el nombre; aparecen en **Revisar coincidencias** para decidir entre unir perfiles o mantenerlos separados, y la decisión queda guardada.
- Cada persona muestra todos sus productos, incluso modelos repetidos, con serie, fecha de compra y fecha de vencimiento.
- Una serie repetida se considera el mismo producto; dos series del mismo modelo cuentan como dos compras.
- El estado, las estadísticas, los filtros y cualquier acción de renovación o Plan Canje se calculan únicamente con el producto adquirido más recientemente.
- Los productos anteriores permanecen visibles como **Equipo anterior renovado** y no generan canjes incorrectos.
- **Usuarios estrella** identifica desde la segunda compra, ordena por cantidad de productos y ofrece mensajes editables para agradecimiento, promoción, obsequio o recontacto, sin envío automático.
- Versión: **v882 · Segura** → Cache `appi-v882-usuarios-unificados`.

## v881 · Histórico automático, PDF anuales y precios conservados

- Conserva la actualización **“precios: lista tienda PSA”** publicada en `4513612`, sin reemplazar ni retroceder sus archivos de catálogo, planes y precios.
- Histórico completa automáticamente los meses del año vigente y del anterior; se eliminó el botón **Completar meses faltantes ahora**.
- La vista principal y las comparaciones conservan únicamente **PB, Actividad e Ingresos**. Actividad muestra siempre el signo `%`, tanto en tarjetas como en planillas, gráficas y diferencias.
- Los años 2024 a 2020 se recuperan automáticamente con las consultas directas de PSA 69, 34 y 71, sin exponer esos meses como cierres navegables.
- Cada año antiguo se archiva únicamente cuando están disponibles sus 12 cierres: APPI crea un PDF anual, lo sube, vuelve a descargarlo y verifica su integridad antes de retirar las planillas mensuales.
- La recuperación anual es reanudable: si se interrumpe, conserva lo ya recuperado, muestra el avance por año y vuelve a intentarlo automáticamente.
- El listado muestra un renglón explícito por cada año hasta 2020 y habilita la descarga cuando el PDF quedó verificado en la nube.
- El backend seguro publicado conserva el marcador `historico-directo-v879`; v881 reutiliza ese motor ya validado y cambia la automatización del cliente.
- Versión: **v881 · Segura** → Cache `appi-v881-historico-y-precios`.

## v879 · Campus ordenado y despliegue seguro del Histórico

- **Mi capacitación** ya no aparece en la portada de Mi negocio: se muestra al final de **Campus Appi**, después de todo el contenido del Campus.
- Campus conserva el acceso desde Mi negocio, el botón Volver regresa allí y la navegación inferior mantiene seleccionado **Mi negocio**.
- Histórico exige que la función segura responda con el motor de recuperación directa v879; si el backend todavía no fue publicado, muestra un mensaje claro y no guarda respuestas antiguas.
- La función `consulta-serial` cuenta con un despliegue dedicado que valida su sintaxis y las URL directas antes de publicarla, sin depender de pruebas antiguas no relacionadas.
- La recuperación conserva los índices directos 69, 34 y 71, su validación de período y el descubrimiento alternativo como respaldo.
- La pantalla de recuperación muestra el último motivo de error para poder distinguir una función pendiente de un informe faltante.
- Versión: **v879 · Segura** → Cache `appi-v879-campus-y-recuperacion`.

## v876 · Histórico automático desde MI PSA

- **Histórico** trae automáticamente Línea Descendente, Garantías por Organización e Ingresos del mismo período usando la cuenta de MI PSA ya configurada.
- Al abrir el módulo se actualiza el mes actual; las tarjetas permiten traer o actualizar meses del año vigente y del anterior sin descargar planillas.
- Se conservan las validaciones de titular, período, coincidencia de DIPs e integridad; un informe de Ingresos con cero personas continúa siendo válido.
- Sólo el año vigente y el anterior permanecen navegables y comparables. No se permite importar automáticamente un período más antiguo.
- Cada año que sale de esa ventana se convierte automáticamente en **un PDF anual resumido independiente** y aparece en el listado de años archivados.
- APPI sube y vuelve a descargar el PDF para verificarlo en la nube; recién entonces elimina los cierres mensuales y las planillas originales de ese año. Si la verificación falla, conserva todos los originales.
- El backup ZIP incluye también los PDF anuales que estén disponibles localmente.
- La pantalla de Histórico fue reconstruida con letras grandes, contraste fuerte, botones con texto y navegación explícita para facilitar el uso por personas mayores.
- El inicio separa claramente Línea Descendente y PB, Ingresos, Garantías, planillas comparativas, gráficas y PDF anuales.
- Las planillas comparan mes a mes el año vigente con el anterior; se conservan las cinco gráficas de PB, actividad, pendientes, ingresos y personas.
- Los PDF anuales visibles llegan hasta 2020, cada año con su descarga independiente.
- La selección manual de archivos queda dentro de **Administrar cierres y recuperación** y sólo se usa si PSA no responde.
- La Edge Function descubre Ingresos por nombre en el menú de Autoconsulta, admite override seguro y no fija un índice frágil.
- Versión: **v876 · Segura** → Cache `appi-v876-historico-automatico`.

## v875 · Herramientas compactas con iconos a la derecha

- La pantalla **Mis herramientas** conserva los iconos y colores actuales, pero los ubica a la derecha de cada tarjeta.
- Las tarjetas reducen su altura y agrupan nombre y descripción para aprovechar mejor el espacio.
- Se ocultan únicamente en esta pantalla las etiquetas superiores y la línea inferior con reloj/dato secundario, tal como se aprobó en la maqueta.
- Las tarjetas de Mi mes y Mi negocio conservan sus indicadores y datos actuales.
- Versión: **v875 · Segura** → Cache `appi-v875-herramientas-compactas`.

## v874 · Presupuesto verde y tarjetas fáciles de distinguir

- El encabezado de **Presupuesto** abandona el marrón y usa el mismo fondo crema que la hoja.
- La tarjeta del total cambia del naranja fuerte a un degradado verde de alto contraste.
- Cuota Simple, Naranja X, Galicia y BBVA mantienen sus colores auditados; las demás tarjetas recuperan acentos variados y estables para reconocerlas rápidamente, siempre acompañadas por nombre y sigla.
- Se conserva la caída de la fila al cesto, Deshacer, descuentos y movimiento reducido de v873.
- Versión: **v874 · Segura** → Cache `appi-v874-presupuesto-verde`.

## v873 · Swipe al cesto y medios de pago auditados

- Al completar el swipe de una fila, el artículo se desprende y cae hacia el cesto inferior con desplazamiento, reducción, giro y reacción del botón.
- La eliminación conserva el aviso **Deshacer** y restaura tanto la cantidad como el descuento; con movimiento reducido se omite el vuelo.
- Cuota Simple, Naranja X, Galicia y BBVA usan paletas verificadas; las demás entidades se muestran en gris neutro con nombre y sigla visibles, sin atribuir colores corporativos no auditados.
- Versión: **v873 · Segura** → Cache `appi-v873-swipe-al-cesto`.

## v872 · Presupuesto visual y deslizable

- El presupuesto abierto estrena encabezado camel, total grande en naranja y una fila compacta por artículo con foto, cantidad y precio.
- El precio abre las opciones de descuento; al deslizar una fila hacia la izquierda se elimina el producto con animación y opción para deshacer.
- Las formas de pago muestran una tarjeta ilustrada para Contado, Cuota Simple, Naranja, Galicia, BBVA y el resto de entidades disponibles.
- El diseño conserva ganancias desplegables, cuotas, modo oscuro y adaptación a móvil y escritorio.
- Versión: **v872 · Segura** → Cache `appi-v872-presupuesto-deslizable`.

## v871 · Bandeja naranja con carrito animado

- La bandeja inferior del presupuesto usa un fondo naranja degradado, alto contraste y un botón verde con icono de carrito.
- Al sumar un producto, su foto vuela desde la ficha hasta la bandeja y el carrito reacciona al recibirla; la animación se omite cuando el dispositivo solicita movimiento reducido.
- Tocar la bandeja continúa abriendo el presupuesto completo, tanto en móvil como en escritorio.
- Versión: **v871 · Segura** → Cache `appi-v871-bandeja-carrito`.

## v870 · Verificación directa de MI PSA y versión visible

- La versión visible, el paquete y el Service Worker vuelven a quedar alineados en v870; se corrige el valor interno que había quedado detenido en v866.
- Un fallo general de red o de PSA ya no abre el aviso bloqueante al entrar: el Home usa la copia guardada y continúa cargando.
- Si PSA rechaza específicamente Sucursal, Distribuidor o Contraseña, APPI abre un formulario directo con los datos actuales para revisarlos y volver a probar.
- Versión: **v870 · Segura** → Cache `appi-v870-credenciales-psa`.

## v869 · Bandeja desplegable de presupuesto

- La Lista de precios reemplaza la píldora flotante por una bandeja fija sobre la navegación inferior.
- La bandeja muestra cantidad de productos, total, miniaturas y un control ascendente para abrir el presupuesto completo.
- Al agregar un producto, confirma la acción con texto, rebote suave y sonido de gota; también adapta sus colores al modo oscuro y su posición a escritorio.
- Versión: **v869 · Segura** → Cache `appi-v869-bandeja-presupuesto`.

## v868 · Comparativas oficiales dentro de las fichas PDF

- Senior4, Senior Bianco, S·1000·2, Senik y SodaBurby incorporan la imagen de la comparativa oficial de PSA en la misma hoja de su ficha técnica.
- La ficha conserva foto, precio, descripción y tratamientos en formato compacto; la imagen oficial muestra su vigencia y enlaza al PDF fuente.
- El workflow de precios verifica dos veces al día el contenido de los cinco PDF y regenera la imagen si PSA reemplaza el archivo aun conservando el mismo enlace.
- Versión: **v868 · Segura** → Cache `appi-v868-comparativas-oficiales-pdf`.

## v866 · Fondo uniforme en presupuestos PDF

- Las fichas de producto y sus continuaciones usan el mismo fondo arena que las páginas del presupuesto.
- Versión: **v866 · Segura** → Cache `appi-v866-presupuesto-fondo-arena`.

## v865 · Rebote y gotita en ventanas emergentes

- Animación de rebote suave al abrir diálogos y paneles emergentes, con sonido breve de gota después de interactuar con la app.
- Se respeta la preferencia de movimiento reducido; el audio puede estar limitado por el navegador o el dispositivo.
- Versión: **v865 · Segura** → Cache `appi-v865-popups-gota`.

## v864 · Presupuesto compacto

- Ganancias privadas ocultas inicialmente, accesibles desde el botón 💵.
- Cada producto tiene un botón −$ para desplegar descuentos; se conserva el porcentaje aplicado y el total.
- Versión: **v864 · Segura** → Cache `appi-v864-presupuesto-compacto`.

## v863 · Botones centrados y precio Iontrix

- Se centra el contenido de los botones de precio.
- Se corrige el precio normal de Iontrix 3 a $1.223.000 según la lista con acuerdo vigente desde el 9 de septiembre de 2026; canje $1.100.700.
- Se evita mostrar un canje que no sea menor al precio normal y se rechazan combinaciones incompatibles del Storage.
- Versión: **v863 · Segura** → Cache `appi-v863-precios-centrados-iontrix`.

## v862 · Canje primero e imágenes

- La lista muestra primero los productos con Plan Canje; después aparecen los demás por categoría. Se respeta el orden original dentro de cada bloque.
- Se agregan imágenes para 13 productos; cinco siguen sin foto identificada.
- Versión: **v862 · Segura** → Cache `appi-v862-canje-primero-imagenes`.

## v861 · Botones de precio uniformes

- Los botones **Precio de canje** y **Precio normal** usan el mismo ancho y alto en todas las fichas con Plan Canje, tengan o no miniatura.
- Se conserva el nombre y SKU a la izquierda y las dos opciones de precio en la misma fila.
- Versión: **v861 · Segura** → Cache `appi-v861-botones-precio-uniformes`.

## v860 · Vivo PSA especial del 28/10/2026

- Sólo para el **miércoles 28 de octubre de 2026**, el Vivo PSA comienza a las **13:00** (ART), en lugar de las 15:00 habituales.
- El aviso del Home y la sección del Campus muestran el horario especial; el estado pasa a “en vivo” desde las 13:00. El horario de los miércoles siguientes queda en 15:00.
- Versión: **v860 · Segura** → Cache `appi-v860-vivo-especial-28oct`.

## v859 · Opciones de precio en el mismo renglón

- Las fichas con Plan Canje muestran nombre, referencia y los dos botones de precio en una sola fila, también en pantallas angostas.
- Si falta una miniatura, la ficha se reacomoda sin reservar el espacio de la imagen.
- Versión: **v859 · Segura** → Cache `appi-v859-precios-misma-fila`.

## v858 · Canje primero y productos seleccionados

- En las fichas de una sola fila, **Precio de canje** queda a la izquierda y **Precio normal** a la derecha.
- Al elegir una opción, se resalta su botón y queda resaltada la ficha completa; el contador indica cuántas unidades se agregaron.
- El orden y el estado seleccionado se verifican en las pruebas de la Lista de precios.
- Versión: **v858 · Segura** → Cache `appi-v858-canje-seleccionado`.

## v857 · Catálogo sin promociones y Plan Canje en una sola ficha

- La Lista de precios excluye productos marcados como promoción o llamados **PROMO/COMBO**; las fichas restantes ya no llevan distintivos, precios tachados ni resaltado naranja.
- Los productos con Plan Canje aparecen una sola vez, con dos botones de precio: **Canje a la izquierda** y **Normal a la derecha**. El botón elegido y la ficha quedan resaltados; cada botón agrega esa variante al presupuesto.
- Se agregan pruebas para las promociones y para el uso conjunto de los precios normal/canje.
- Se documenta el flujo condicional de Arena.ai en [`AGENTE.md`](AGENTE.md) y [`PUBLICAR_CAMBIOS.md`](PUBLICAR_CAMBIOS.md); si el propietario confirma que trabaja desde Arena, la entrega final será un ZIP con `PUBLICAR.bat` y un Git bundle.
- Versión: **v857 · Segura** → Cache `appi-v857-catalogo-limpio-canje-en-fila`.

## v856 · Packs y Opciones de ingreso sólo se ven al tocar su píldora

- En **Todos** ya no aparecen los **Packs PSA** ni las **Opciones de ingreso**: eran 33 productos caros (11 packs + 22 ingresos) que se mezclaban con el catálogo habitual y ensuciaban el listado.
- Cada uno se muestra únicamente cuando se toca su píldora: **Packs PSA** y **Opciones de ingreso**.
- El buscador es **estricto**: en "Todos" tampoco trae packs ni ingresos (decisión de Germán). Si ya estás en la píldora, la búsqueda sí funciona dentro de esa categoría.
- El carrito no se ve afectado: si ya tenías un pack agregado, el resumen lo sigue sumando aunque no esté visible en la lista.
- Tests nuevos en `lista-precios-frescos.spec.js` (4) que comparan contra las claves reales del catálogo — incluye `SUPER-PACK`, que no arranca con el prefijo `PACK-`.
- Se ajusta `stock-qr.spec.js`: el total de fichas en "Todos" pasa de 391 a 358 (323 visibles + 35 líneas de canje).
- Versión: **v856 · Segura** → Cache `appi-v856-solo-por-pill`.

## v855 · Se va el apartado Novedades de la lista de precios

- Desaparece la pestaña **✨ Novedades** de los filtros de la Lista de precios.
- Desaparece la etiqueta **NUEVO** con su descripción que aparecía sobre las fichas de los productos recién lanzados, y el resaltado de color que esa etiqueta le daba a la tarjeta.
- El campo sigue existiendo en los JSON del catálogo (lo escribe el script de precios); simplemente la app ya no lo interpreta ni lo muestra.
- Test nuevo: `lista-precios-frescos.spec.js` verifica que ni la pestaña ni la etiqueta vuelvan a aparecer aunque el catálogo los traiga marcados.
- Versión: **v855 · Segura** → Cache `appi-v855-sin-novedades`.

## v854 · Aviso claro cuando PSA no responde y lista de precios que no se atrasa

- **Pop-up de datos sin actualizar**: cuando la nube del Campus falla con copia guardada, la app ya no se queda en silencio mostrando datos viejos. Aparece un pop-up que dice desde qué fecha es la copia que se está viendo y las causas más probables (PSA caído o lento, clave de MI PSA cambiada, sin internet), con la sugerencia de revisar Ajustes → MI PSA. Se muestra una sola vez por día.
- **La lista de precios deja de pisar datos frescos por viejos**: el overlay del bucket `catalogo-psa` sólo se aplica si su `actualizado` es más nuevo que el del repositorio. Antes pisaba siempre, y como el workflow de precios refresca el repo dos veces por día mientras el Storage sólo se toca con el botón "🔄 Actualizar precios", todos terminaban viendo la lista del 15/10 aunque la del 25/10 ya estaba publicada.
- **CI vuelve a quedar verde**: las fechas de garantía de `recordatorios.spec.js` pasan a ser relativas al día de la corrida (la fecha fija de octubre ya había vencido y dejaba el plan con 5 avisos en vez de 6), y el reload del test de offline de `auth.spec.js` deja de esperar `networkidle` — con el backend caído la app reintenta y esa espera nunca se cumplía. Con la suite verde, `deploy-backend.yml` vuelve a publicar el backend solo.
- Tests nuevos: `campus-aviso-fallo.spec.js` (el pop-up aparece, no se repite el mismo día y no se abre sin cuenta MI PSA) y `lista-precios-frescos.spec.js` (Storage viejo no pisa, Storage nuevo sí manda y una fuente sin fecha nunca gana).
- Versión: **v854 · Segura** → Cache `appi-v854-avisos-psa`.

## v853 · Conexión MI PSA recuperada

- La autenticación server-side de MI PSA conserva las cookies aunque Supabase exponga `Set-Cookie` en formatos distintos y valida de verdad la respuesta del login; una clave incorrecta ya no se confunde con un fallo de SSO.
- La sincronización renueva el JWT de APPI si venció mientras la aplicación seguía abierta y deja visible el error real devuelto por la Edge Function.
- Los reportes de Línea y Garantías toleran cambios de columnas del portal de PSA, y el número de distribuidor se normaliza a los 8 dígitos que pide el formulario oficial.
- Versión: **v853 · Segura** → Cache `appi-v853-psa-conexion`.

## v655 · El Vivo PSA existe sólo el miércoles

- **Se van el replay y "🎬 Vivos anteriores"**: la grabación publicada del vivo no siempre existe (el video de la semana pasada no se pudo ver), así que esas dos tarjetas dejan de existir — ni en la vista del Campus ni en el mazo del Home. Del jueves al martes APPI no muestra absolutamente nada de vivo: tampoco queda el anuncio "Miércoles 15:00" de las semanas anteriores.
- **El Vivo PSA sólo aparece el miércoles**: antes de las 15:00 la tarjeta avisa "Hoy 15:00 · Vivo PSA" con su previa para escucharla, y mientras dura el directo (15:00–16:35) invita a verlo **acá mismo en APPI** con el player del contenido (`vivoPlayer`, v654). En cuanto termina el directo, la tarjeta desaparece hasta el próximo miércoles.
- **Mazo del Home**: la tarjeta `vivoPsa` sigue la misma regla — sólo el miércoles, nunca el resto de la semana, con CTA "Ver el vivo 🔴" cuando está en curso.
- Tests: `campus-vivo.spec.js` se ajusta — terminado el directo no queda ninguna tarjeta; del jueves al martes no hay nada de vivo (y el miércoles siguiente vuelve el directo); el ▶ de la previa se abre desde la tarjeta del día; el test de repintado (v649) usa las filas de audios como referencia.
- Versión: **v655 · Segura** → Cache `appi-v655-vivo-miercoles`.

## v654 · Todo el Campus pasa a llamarse "contenido del Campus" y el Vivo se reproduce adentro de APPI

- **Renombrado total de la capa Campus**: la palabra "catálogo" desaparece de la vista, el respaldo local, los eventos y los nombres internos — todo pasa a llamarse **contenido del Campus**. La clave de respaldo es `appi_campus_contenido_v1` (con migración automática en el dispositivo que todavía tenga la clave vieja: nadie pierde su copia), el evento es `appi-campus-contenido`, los métodos son `contenido()` / `cargarContenido()` / `estadoContenido()`, la función edge es `campus-contenido` y su respuesta trae `cont` en lugar de `cat`. La caché en la nube se escribe con la clave `contenido` y todavía **lee la clave vieja como respaldo**. El fixture de tests también cambió a `tests/e2e/fixtures/campus-contenido.json`. Los catálogos de productos PSA (lista de precios, stock, imágenes `catalogo-img/`) **no se tocan**: son otra cosa.
- **El Vivo PSA se reproduce dentro de APPI**: el contenido del Campus ahora trae el player de la transmisión (`vivoPlayer`: embed de la plataforma o stream HLS del propio Campus, extraído de la página del vivo — **nunca la agenda de reuniones**, que sigue fuera desde v652). Cada tarjeta del vivo (en directo, replay del miércoles y "🎬 Vivos anteriores" hasta el próximo miércoles) suma un ▶ que abre el modal con el video **acá mismo, sin registrar avance y sin quiz**: es vivo, no una clase. Si todavía no hay player detectado, queda sólo el texto — **nunca un link al sitio**.
- **Se van los links al sitio**: "Entrar al vivo ↗", "Entrar al vivo 🔴" y "Ver en Campus ↗" dejan de existir en las secciones del vivo.
- Tests: los specs de Campus usan los nombres, rutas y claves nuevos (`campus-contenido`, `cont`, `appi_campus_contenido_v1`); `campus-vivo.spec.js` afirma el ▶ del vivo con `vivoPlayer` en el mock y `campus-vivo-audio.spec.js` sigue verificando que las reuniones internas no se muestren.
- Versión: **v654 · Segura** → Cache `appi-v654-vivo-adentro`.

## v653 · La tarjeta de PB del Home suma los movimientos uno a uno, con racha y récord

- **Feed de PB en la tarjeta del mazo**: la tarjeta ⭐ Producción del Equipo ahora lista los movimientos del día **uno a uno con hora** ("10:42 · Juan · +30 PB"), desde el mismo registro diario que alimenta los avisos "⚡ Juan sumó +X PB" (`appi_pb_mov_v1`) — así el Home refleja lo que fue pasando durante el día, no sólo un top 3 al cierre.
- **Total del día y racha**: el titular suma todo lo del día (el feed manda si el snapshot del día no lo capturó) y aparece la **racha de días seguidos con PB**, con la misma semántica del Campus: si hoy todavía no sumó, la tarjeta avisa "Sumá PB hoy para mantener la racha de N días".
- **Festejo del mejor día**: `appiPBDiario` guarda el **récord histórico** (`appi_pb_record_v1`, atraviesa los meses y conserva el récord anterior). Cuando hoy es el día que más PB hizo de la historia del equipo, la tarjeta lo festeja: "🏆 ¡Mejor día del equipo! Superaron el récord de X PB (fecha) 🎉".
- Tests: `pb-tarjeta.spec.js` (nuevo) cubre feed + racha, festejo de récord, racha viva sin PB de hoy y el caso sin movimientos.
- Versión: **v653 · Segura** → Cache `appi-v653-pb-record`.

## v652 · Se va la agenda de "Reunión de Equipo" de otros equipos

- **`📅 Próximos en vivo` deja de existir**: la agenda que el Campus publica en `/proximas-clases-en-vivo` traía SÓLO las reuniones internas de los equipos del distribuidor ( Equipos Sin Fronteras, Espigas Doradas, Alpinistas, MegaRed… con sus horarios): datos internos de otros equipos que no corresponden publicar en APPI ni compartir con la nube de todos. La sección se eliminó del todo — ni se lista ni se ofrece "Agendar".
- **La función edge tampoco los rastrea**: `campus-catalogo` dejó de scrapea esa agenda, así que esos nombres y horarios ya no entran en el catálogo compartido (`appi_campus_cache`) ni en el respaldo local de cada dispositivo.
- **El Vivo PSA no se toca**: el vivo del miércoles 15:00, su previa y "🎬 Vivos anteriores" (v645/v648) se ubican por fecha y playlists — nunca usaron esa agenda.
- Tests: `campus-vivo-audio.spec.js` pasa a regresión de privacidad: el fixture real trae 17 reuniones y APPI debe mostrar **cero**; `campus-usuario.spec.js` ya no espera "Próximos en vivo" y afirma el contenido de kits en su lugar.
- Versión: **v652 · Segura** → Cache `appi-v652-agenda-fuera`.

## v651 · Se va el recuadro rojo del catálogo caído

- **Nube caída con copia guardada: silencio**: si el Campus ya tiene una última copia en el dispositivo y la nube no responde, ahora no aparece ningún recuadro — se muestra la copia tal cual. El aviso "📡 No pudimos actualizar el catálogo" resultaba ruidoso para un problema que la propia copia ya resuelve.
- **Sólo si no hay nada que mostrar**: sin copia guardada queda un aviso chico en una línea (`.cp-aviso.mini`) con **Reintentar**: la pantalla no puede quedar vacía sin explicar por qué.
- Tests: `campus-usuario.spec.js` cubre los dos casos — con respaldo no hay `[data-cp-aviso="error"]` y el contenido se ve; sin respaldo aparece el mini con reintento.
- Versión: **v651 · Segura** → Cache `appi-v651-aviso-discreto`.

## v650 · Marcar una clase vista cierra la hoja (y su quiz de verificación)

- **Marcar como vista / escuchado cierra el popup**: antes el botón sólo dejaba el botón en "Vista ✓" con la hoja abierta. Ahora guarda el avance y cierra: con clase sin banco cierra directo; con banco sin aprobar, el quiz de 3 preguntas reemplaza la hoja y recién ahí se da la clase por terminada (igual para audio, que cierra siempre).
- **Bug del quiz post-video (v646)**: `ofrecerPostVideo` frenaba si existía el overlay del popup… y la hoja de clase vive en ese mismo overlay. En uso real el quiz nunca se abría y la racha no se registraba al ver un video. El guard ahora chequea "ya hay un quiz activo" (`pvSession`, que se limpia al cerrar cualquier modal) y suelta el reproductor antes de abrir el quiz.
- **Tests**: `campus-reproductor.spec.js` cubre los dos caminos — clase sin banco → clic → popup cerrado + avance 100 + reapertura "✓ vista"; clase con banco → clic → quiz "1/3" con la hoja previa abierta.
- Versión: **v650 · Segura** → Cache `appi-v650-vista-cierra`.

## v649 · El Campus deja de parpadear

- **Sin repintado si nada cambió**: la vista Campus escucha los eventos de sync, de persona y del catálogo, que en una cuenta real pueden llegar seguido. Hasta ahora cada evento reconstruía todo el HTML (`innerHTML` desde cero) aunque el contenido fuera idéntico, y eso se veía como un parpadeo constante de la pantalla (reportado en PC apenas subió la v648). Ahora `render()` firma el HTML junto con el avance y la versión del catálogo: si la firma coincide con lo ya pintado, el DOM no se toca — quedan el scroll, los botones cableados y la playlist de audios elegida como estaban.
- **Los cambios reales sí repintan**: un avance nuevo, un catálogo refrescado o un cambio de estado de la cuenta MI PSA alteran la firma y la pantalla se actualiza como siempre.
- Tests: `campus-vivo.spec.js` suma la regresión «repintar sin cambios no reemplaza el DOM» (una ráfaga de eventos deja el mismo nodo pintado; un avance nuevo sí repinta y marca el audio escuchado). Sin el arreglo, ese test falla.
- Versión: **v649 · Segura** → Cache `appi-v649-campus-sin-parpadeo`.

## v648 · El último Vivo PSA queda toda la semana para verlo cuando quieras

- **Sección «🎬 Vivos anteriores»**: en v645 el replay del vivo de los miércoles vivía sólo esa noche; el jueves APPI ya anunciaba el próximo y la grabación quedaba sin lugar en la app. Ahora la vista Campus suma una sección propia con el **último Vivo PSA** (fecha incluida) que queda visible **toda la semana, hasta el próximo miércoles**: botón **Ver en Campus ↗** a la transmisión publicada y, si la previa de *ese* vivo está en el catálogo, **▶ Escuchar previa** adentro de APPI. El miércoles a la mañana muestra el vivo de la semana pasada, debajo del aviso del vivo de hoy.
- **Sin duplicados ni previas cruzadas**: mientras el vivo está en curso manda el directo y la sección se oculta; la noche del miércoles el replay de hoy (v645) ya es el último y no se repite. `ultimoVivoPsaRef()` ubica el miércoles 15:00 ya terminado (95 minutos, como v645) y la previa se busca **sólo por la fecha exacta de ese vivo** (`audioPreviaVivo(fecha, true)`): si todavía no está, la tarjeta va sin ▶ en vez de pasar la previa del próximo como si fuera la anterior. Como ahora puede haber dos ▶ en pantalla, cada botón se cablea con los datos de su propia tarjeta.
- **El video sigue en el Campus**: APPI no re-copia la transmisión (mismo criterio de v641/v645); guarda el acceso y la previa. La tarjeta del mazo del Home sigue apareciendo sólo el miércoles, para no ocupar el mazo todos los días.
- Tests: `campus-vivo.spec.js` suma la lógica del último vivo (jueves y martes sigue el mismo miércoles; en vivo todavía no terminó), la previa exacta sin respaldo cruzado y la sección visible del jueves al martes con su ▶ abriendo la previa de su fecha.
- Versión: **v648 · Segura** → Cache `appi-v648-vivo-toda-semana`.

## v647 · Se retira el catálogo volcado y la cuenta fija que lo generaba

- **Baja de la cuenta fija**: ya no existe el rastreo automático con credenciales compartidas. Se borraron los secrets `PSA_DIP_NUMERO` / `PSA_DIP_CLAVE`, el workflow `.github/workflows/campus-psa.yml` (corría 2 veces por día) y el script `scripts/actualizar-campus-psa.mjs`. El catálogo de cada distribuidor lo arma **sólo** la función edge `campus-catalogo` con las credenciales MI PSA de ese usuario (v644), nunca una cuenta genérica.
- **`campus-catalogo.json` fuera de la app**: el artefacto que se publicaba en la raíz se eliminó del repo, del precache (`APP_SHELL`) y de la cadena de fallback. Si la nube falla sin respaldo local, el Campus muestra el aviso de error con **Reintentar** (y aclara que todavía no hay copia guardada); con respaldo local se sigue mostrando la última copia.
- **Tests**: el catálogo de pruebas ahora llega como si fuera la nube: `tests/e2e/fixtures/campus-catalogo.json` se sirve desde el helper `helpers/app-entrar.js` en `/functions/v1/campus-catalogo`. El spec `campus-catalogo.spec.js` (validaba el volcado) se reemplazó por la validación de ese fixture dentro de los specs de Campus.
- Se corrigió un test con carrera propia: `home-limpio.spec.js` leía la animación de entrada afuera de la ventana de 380ms de `page-enter`.
- Versión: **v647 · Segura** → Cache `appi-v647-baja-cuenta-fija`.

## v646 · Terminaste la clase: 3 preguntas para verificar lo que aprendiste

- **Preguntas post-video**: al terminar una clase (90% o `ended`) con banco, APPI abre un quiz de **3 preguntas originales de APPI** con 4 opciones cada una. El banco `campus-preguntas.js` arranca con **50 clases y 137 preguntas** escritas por nosotros; las clases sin banco siguen marcándose "vista ✓" y el resto queda cubierto por el curso, sin bloquear el avance.
- **Sin regalar el acierto**: si errás sólo se marca la opción elegida como incorrecta (nunca se revela cuál era la buena) y se reintenta esa pregunta hasta acertar. Al terminar las 3 se guarda el resultado en el mismo estado sincronizado (`appi_campus_psa_v1_`).
- **Racha**: días seguidos con al menos una clase completada. Vive en el mismo storage de Campus, se muestra como chip en **Mi capacitación** y como tarjeta nueva en el mazo del Home. Con clase hecha hoy muestra "¡N días seguidos! 🔥" (con felicitación especial a partir de 3); sin clase de hoy avisa **"Te falta 1 clase para mantener la racha"** y abriéndola desde la tarjeta encadenás el día. Si falta un día, la racha vuelve a 0.
- El spec `campus-racha.spec.js` cubre el banco (50 clases / 137 preguntas / sin malformadas), el quiz sin regalar el acierto, el registro de racha al completar y el corte por días incompletos.
- Versión: **v646 · Segura** → Cache `appi-v646-quiz-racha`.

## v645 · El Vivo PSA te avisa, te previa y te deja ver la grabación

- **Vivo PSA semanal**: APPI ubica el vivo que el Campus transmite todos los **miércoles a las 15:00 (ART)**. La agenda del catálogo trae las reuniones de equipo, no el vivo general, así que se calcula por fecha.
- **Aviso el miércoles**: el mazo del Home muestra la tarjeta "Hoy 15:00 · Vivo PSA" con la previa publicada ("La Previa del VIVO") y el botón para entrar al vivo desde el Campus. Cuando la transmisión ya arrancó, la tarjeta y la sección de Campus cambian a "En vivo ahora" con **Entrar al vivo**.
- **Replay**: cuando el vivo del miércoles ya pasó, la sección de Campus muestra "El Vivo de hoy ya está disponible" con la previa del día y el enlace a la grabación en el Campus.
- **Previa por fecha**: la previa se elige por la fecha del vivo (DD/MM del título), con respaldo al audio más reciente si no hay coincidencia exacta.
- El spec `campus-vivo.spec.js` congela el reloj para cubrir los cuatro estados (hoy, en vivo, replay, próximo) sin depender de la hora real.
- Versión: **v645 · Segura** → Cache `appi-v645-vivo-psa`.

## v644 · Tu cuenta MI PSA arma tu Campus dentro de APPI

- **Catálogo por usuario**: la vista Campus se arma ahora con las credenciales MI PSA de **cada distribuidor**. La nueva función `campus-catalogo` (Supabase Edge) ingresa a mi.psa.com.ar con los datos guardados en tu dispositivo, hace SSO al Campus y rastrea tu catálogo (kits, secciones y clases con su stream, playlists de audio y agenda de vivo completa) devolviéndolo como JSON: APPI guarda sólo metadatos y enlaces, nunca re-copia contenido.
- **Caché compartida en la nube**: el resultado vive en la tabla `appi_campus_cache` (migración `SUPABASE_CAMPUS_CACHE.sql`); con menos de 12 horas se sirve tal cual y si está vencida lo refresca el primero que lo pida, así cada carga cuesta un solo request en vez de cientos.
- **Flujo del cliente**: si el respaldo local tiene menos de 7 días se muestra de inmediato y la nube refresca en segundo plano; sin respaldo se espera la nube y, si no responde, se cae al `campus-catalogo.json` del repo. Los estados (`ok`, `cargando`, `sinCuenta`, `error`) viajan en el evento `appi-campus-estado`.
- **Aviso de cuenta**: sin credenciales MI PSA aparece "Cargá tu cuenta MI PSA" en la vista Campus y en Mi negocio, más una tarjeta nueva en el Home que abre el popup de carga existente (una sola vez, sólo en ese dispositivo). Con cuenta cargada pero nube caída aparece el aviso de error con **Reintentar**; el contenido de respaldo nunca desaparece.
- `deploy-backend.yml` publica la migración y la función en cada push; el spec nuevo `campus-usuario.spec.js` cubre los tres caminos (nube con las credenciales del usuario, sin cuenta con aviso + popup, nube caída con fallback).
- Versión: **v644 · Segura** → Cache `appi-v644-cuenta-usuario`.

## v643 · El vivo se agenda y los audios suenan adentro de APPI

- **Próximos en vivo**: la vista Campus suma la agenda real del catálogo (hasta 4 transmisiones, ordenadas por fecha con año corregido si el vivo ya pasó) con equipo, título y horario, y botón **Agendar** que abre Google Calendar con el evento armado (título, fechas y detalle del Campus).
- **Audios del Campus**: las 10 playlists del catálogo viven como chips dentro de la vista; al elegir una se listan sus audios (los escuchados muestran ✓) y el ▶ abre la hoja de audio con el stream `A_XXXXX` y el mismo avance sincronizado que las clases.
- El catálogo llega en segundo plano y, si la vista está abierta, la pantalla se repinta sola con vivo y audios.
- Tests: `tests/e2e/campus-vivo-audio.spec.js` (agenda + agendar a Google Calendar, chips de playlist y hoja de audio).
- Versión: **v643 · Segura** → Cache `appi-v643-vivo-y-audio`.

## v642 · El Campus llena los huecos del mazo y aparece en Mi negocio

- **Tarjeta Capacitación en el Home**: `tarjetaCapacitacion()` suma **una sola** tarjeta al mazo (regla: el negocio manda, la capacitación nunca encabeza y llena ≤25% del mazo) con la próxima clase real del catálogo elegida por contexto — `contextoCapacitacion()` mira usuarios vencidos → *canje* (Posventa), equipo chico → *Básica*, y si no, PB flojo → *Comercialización*. El botón **Ver clase** abre la hoja Clase sin salir del Home. Cuando llega el catálogo o avanza el avance, el mazo se repinta solo (`refrescarPorCapacitacion`).
- **Mi capacitación dentro de Campus Appi**: `pintarCapacitacion()` llena `#campusTrainingWrap`, al final de la pantalla, con una sección de progreso real (vistas/total, barra %), la próxima clase con su área y duración, y botones **Continuar clase** / **Ver ruta**. Se repinta al abrir Campus y en cada avance.
- Sin catálogo la tarjeta simplemente no aparece (el hueco queda para las tarjetas del negocio) y todo se rescata con el respaldo local.
- Tests: `tests/e2e/campus-ruta.spec.js` — el mazo (regla del hueco), el CTA que abre la clase y la sección de Mi negocio con su avance.
- Versión: **v642 · Segura** → Cache `appi-v642-ruta-capacitacion`.

## v641 · La clase del Campus se ve adentro de APPI

- **Hoja Clase**: al tocar una clase del catálogo ahora se abre una hoja con título, autor, duración y chips de estado; el video HLS se reproduce **inline** con `vendor/hls.min.js` (hls.js 1.5.13, Apache-2.0, cargado bajo demanda; Safari usa HLS nativo). Nada se re-copia: solo se apunta al stream público del Campus y queda el botón **Abrir en Campus ↗**.
- **Avance propio**: cada clase/audio guarda `avance[id]` (pct/estado/ts/dia) dentro del estado que `data-sync.js` ya sincroniza con la cuenta (prefijo `appi_campus_psa_v1_`), así que el progreso viaja a la nube y se comparte entre titular y socio sin tabla nueva. Al 90% (o al `ended`) se marca solo, con botón manual **Marcar como vista**.
- **Catálogo con red offline**: `campus-catalogo.json` se trae con `fetch`, se guarda como respaldo en `appi_campus_catalogo_v1` (clave fuera de la sincronización: es artefacto de red, no dato de la cuenta) y el módulo funciona aunque hoy no haya conexión.
- **Ruta**: `proximaClase(contexto)` elige la próxima clase pendiente según el área que pide el momento del negocio (canje→Posventa, equipo→Básica, visita→DIP Técnico, PB→Comercialización) y siempre la más corta, para el hueco del día.
- **Audio**: `abrirAudio()` reproduce los `A_XXXXX` de las playlists con el mismo patrón de avance.
- `APP_SHELL` ahora precachea `campus-catalogo.json` y `vendor/hls.min.js`.
- Tests: `tests/e2e/campus-reproductor.spec.js` (catálogo, hoja Clase, avance y audio).
- Versión: **v641 · Segura** → Cache `appi-v641-clase-hls`.

## v640 · El catálogo real del Campus PSA llega a APPI

- **Catálogo vivo**: nuevo script `scripts/actualizar-campus-psa.mjs` (Node puro, sin dependencias) que ingresa a mi.psa.com.ar con las credenciales del distribuidor (variables de entorno, nunca en el repo), hace SSO a campus.psa.com.ar y rastrea todo el Campus: **9 áreas, 62 secciones, 204 clases** (cada una con el id de su stream HLS público), **10 playlists con 425 audios** y **17 transmisiones de la agenda de vivo**.
- **Workflow** `.github/workflows/campus-psa.yml`: corre dos veces por día (11:30 y 20:30 ART), escribe `campus-catalogo.json` y lo commitea sólo si cambió. Si el parseo no alcanza los mínimos razonables (50 clases / 10 audios / 5 playlists) el script sale con error y **no se publica un catálogo roto**: queda la última versión buena.
- **`campus-catalogo.json`**: el artefacto que la app va a leer desde red con caché offline, con el mismo patrón que `psa-catalogo.json`. Trae áreas → secciones → clases (título, autor, duración, URL y stream `V_XXXXX`), playlists de audio (con su `A_XXXXX` y el id numérico que usa el Campus para el avance) y la agenda de vivo por equipo.
- El parser tolera los dos formatos del Campus (curso con el link envolviendo el bloque y temática con el link al final) y reutiliza los streams ya conocidos entre corridas: sólo resuelve los que faltan.
- Tests: `tests/e2e/campus-catalogo.spec.js` fija mínimos y forma del catálogo.
- Versión: **v640 · Segura** · Cache `appi-v640-campus-catalogo`.

## v639 · Dos números en un solo campo ya no rompen la pantalla

- **Teléfonos**: `APPITel.bonito()` y `APPITel.link()` pasan por `primeroValido()` en vez de `normalizar()`. El reporte de PSA guarda dos números en la misma celda, separados por un salto de línea, y a veces sobra un `54-` suelto al final; `normalizar()` veía 14 dígitos seguidos y devolvía vacío.
- **Antes**: el vacío hacía que las pantallas cayeran al texto crudo — se veía `54-3856454957⏎54-` en la lista de la zona y en la ficha de contacto — y `link()` frenaba la redirección con "Número incompleto".
- **Ahora**: se muestra el primer número legible y el chat de WhatsApp abre. Si no hay ninguno, la pantalla dice **Sin teléfono válido** en vez de tirar el texto crudo.
- `normalizar()` y `esValido()` **no se tocaron**: siguen estrictos, para no abrir un chat con un número inventado.
- Medido sobre la copia de la nube: 1129 personas → **363** pasan de texto crudo a número legible y **68** quedan marcadas como inválidas (400 campos traían salto de línea).
- Tests: 7 nuevos en `telefono.spec.js`.
- Versión: **v639 · Segura** · Cache `appi-v639-numeros-pegados`.

## v638 · Las pruebas corren en el puerto 8123

- **Infraestructura de pruebas**: `playwright.config.js` y los specs que fijaban el origen ahora usan `http://127.0.0.1:8123`. Windows reservó el tramo 4151–4250 (rango de exclusión dinámico de Hyper-V/winnat) y con eso `4174` quedó bloqueado para cualquier proceso, así que `npm test` no podía ni arrancar el servidor (`WinError 10013`).
- No toca la app: sólo cambia dónde se levanta el servidor de pruebas.
- Versión: **v638 · Segura** · Cache `appi-v638-puerto-8123`.

## v637 · El pétalo abre con dos botones y su tarjeta de contacto

- **Mi Margarita**: tocar un pétalo abre directo la hoja con dos botones hermosos: **Elegir dentro de APPI** y **Elegir de mis contactos**.
- Debajo aparecen **sólo las personas que elegiste**; al tocar cada una se abre su **tarjeta de contacto** con **WhatsApp**, **teléfono** y un apartado de **notas** para escribir lo que quieras (se guarda sola y se sincroniza).
- "Elegir de mis contactos" usa la agenda del teléfono; si el navegador no la permite aparece la opción de subir un `.vcf`.
- Se borró el "⋯" de cada pétalo y todo lo que había adentro (buscador, panel técnico, "Agregar personas" viejo).
- Tests: 11 en `margarita-contactos.spec.js`.
- Versión: **v637 · Segura** · Cache `appi-v637-tarjeta-contacto`.

## v636 · El pétalo muestra sólo a las personas elegidas

- **Mi Margarita**: al entrar a ver el listado de un pétalo aparecen **sólo las personas elegidas**. Antes se mezclaban con todos tus contactos de APPI (Panel + Agenda Personal), como si se hubieran metido solas en el pétalo.
- Para sumar gente ahora hay que tocar **➕ Agregar personas** —recién ahí aparece el resto— o usar la agenda del teléfono / subir el `.vcf`. **‹ Ver las personas del pétalo** vuelve al listado propio.
- El buscador filtra dentro del modo en el que se está: dentro del pétalo, o al agregar.
- Nuevo test que fija la regla: con Ana y Bruno esperando en el Panel y sólo Lucía elegida, el listado muestra a Lucía; Ana y Bruno aparecen sólo después de tocar "Agregar personas". Margarita 10/10.
- Versión: **v636 · Segura** · Cache `appi-v636-solo-elegidas`.

## v635 · El pétalo intenta la agenda del teléfono antes que nada

- **Mi Margarita**: tocar un pétalo **intenta SIEMPRE abrir la agenda del teléfono como primera intención** —sin consultar antes si el navegador "deja"— y sólo si no se pudo se abren **las otras opciones** en la hoja: subir una agenda `.vcf`, elegir del teléfono y las personas que ya están en APPI (Panel + Agenda Personal). Antes, en un navegador sin Contact Picker el pétalo iba directo a la hoja sin siquiera intentar.
- `pedirDelTelefono` devuelve el mismo "no anduvo" cuando **no existe la API** (iPhone, Firefox, escritorio, iframe), así que el llamador nunca se queda mudo: o guarda lo elegido, o abre la hoja. Cancelar sigue siendo silencio total: ni hoja, ni carteles, ni cambios.
- `capazPicker()` queda sólo para **mostrar** los accesos (el "⋯" del pétalo y el botón de la hoja), no para decidir si se intenta.
- Nuevo test que fija la prioridad: con la agenda presente pero `capazPicker()` en false, el pétalo la usa igual y no abre la hoja.
- Versión: **v635 · Segura** · Cache `appi-v635-agenda-primero`.

## v634 · Un toque en el pétalo abre la agenda del teléfono

- **Mi Margarita**: tocar un pétalo ya no abre la hoja con las opciones: **abre directo la agenda del teléfono** (Contact Picker, Android) para elegir la gente desde ahí. Lo elegido **queda guardado solo**, con un aviso del grupo y del conteo, sin pasos intermedios. Si se cancela la agenda no pasa nada: ni hoja, ni carteles, ni cambios.
- **Nuevo botón ⋯ en cada pétalo** para administrar el grupo desde la misma hoja de siempre (buscar, subir una agenda `.vcf`, elegir del teléfono y las personas que ya están en APPI). Se muestra únicamente donde el toque del pétalo dispara el picker.
- **Sin Contact Picker** (iPhone, escritorio, iframe) **o si el picker no anda**, el pétalo se comporta como siempre y abre la hoja: el error cae en silencio, sin alertas nativas ni textos que pidan permisos o configurar el dispositivo.
- `elegirTelefono` ahora distingue **cancelar** (silencio) de **fallar** (respaldo a la hoja); el resto del módulo no cambia.
- Cubierto por `margarita-contactos.spec.js`: pétalo que abre la agenda y guarda sin hoja intermedia, cancelación sin rastro, picker roto que cae a la hoja (6 intentos: 3 del pétalo + 3 del botón) y la hoja intacta.
- Versión: **v634 · Segura** · Cache `appi-v634-petalo-agenda`.

## v633 · El teléfono de una persona se puede corregir

- **Panel de Contactos (Mi Gestión)**: el número pasó de ser texto de solo lectura a un campo editable dentro de la ficha de detalle. Se guarda con el mismo botón "Guardar cambios" de siempre (y con la misma cola si no hay internet) y viaja con su versión normalizada de dígitos. Si el contacto cambia, se registra en la línea de tiempo.
- **Usuarios / Garantías**: botón **✏️ Teléfono** en la ficha expandida. La planilla de PSA se vuelve a bajar en cada sincronización, así que la corrección se guarda aparte, por cuenta (`appi_telf_editados_v1_<uid>`), se marca con ✏️ en la ficha y se vuelve a aplicar encima en cada carga: aunque la planilla refresque con otro número, la corrección manda. Queda guardada con **dos claves** —nombre + domicilio y, de respaldo, la serie del equipo— así que sobrevive aunque la planilla reescriba el nombre o la dirección; y como la clave entra en la lista de sincronización, viaja con la cuenta a otro equipo y a un "borrar datos" del navegador. Dejarlo vacío también es un cambio válido (hay fichas con un número que ya no sirve).
- **Agenda Personal**: **Editar tel** en la fila abierta. Como en la nube la fila se identifica por el teléfono, el cambio se manda como dos movimientos —borrar el viejo y cargar el nuevo— que conviven en la cola sin pisarse.
- Regla única en **`APPITel.edicion`** (`telefono.js`): el mismo diálogo en las tres pantallas, entre 8 y 15 dígitos con característica y sin el 0 ni el 15 (la misma regla del alta), y la respuesta `23505` de Postgres traducida a **"Ya tenés a alguien con ese teléfono"**. El índice único `(user_id, telefono_normalizado)` sigue protegiendo la tabla y la política `appi_gestion_update_own` ya permitía el UPDATE: **no hizo falta migración SQL**.
- Cubierto por `editar-telefono.spec.js` (guardado normalizado, número corto rechazado, número repetido sin jerga de base, corrección que sobrevive a una bajada nueva de la planilla y a que la planilla cambie el nombre, agenda que sube baja + alta, y una caché sucia sin teléfono que no bloquea guardar las notas).
- Ajustados tres contadores viejos de la barra de Usuarios/Garantías (`usuarios-botones`, `reactivacion` y `mensajes-usuarios`): pedían 8/8/9 botones y la barra quedó en 7/7/8 desde que salió el botón Plantillas. **La suite vuelve a quedar verde de punta a punta.**
- Versión: **v633 · Segura** · Cache `appi-v633-telefono-editable`.

## v632 · La línea "sin cambios" ya no tapa los movimientos del día

- Si la línea de PSA de un día se trae **sin cambios** (por ejemplo PSA va atrasado y todavía no subió el Excel), los movimientos de PB que el teléfono sí detectó quedaban tapados y el día mostraba 0.0 PB con "Ingresaste este día · sin cambios de PB". Ahora la línea manda **solo cuando tiene cambios reales**; si el registro del día está vacío, los movimientos detectados completan ese día (no se suman, así que no hay doble conteo) y conservan el acumulado de la línea.
- El primer ingreso del mes (`esInicial`) se mantiene protegido: sigue mostrando "Estado inicial del mes cargado" aunque haya movimientos.
- Cubierto por `psa-sync-automatico.spec.js` (día con línea sin cambios + movimiento → muestra el +3.2 PB y el acumulado de la línea; día inicial protegido).
- Versión: **v632 · Segura** · Cache `appi-v632-sin-cambios-completa`.

## v631 · El desglose de PB se fija en la hora de Buenos Aires

- El desglose semanal/diario usaba la fecha y hora del **dispositivo** mientras los registros de línea y de movimientos se guardan en hora de Buenos Aires; cerca del cambio de día o de mes podía mostrar un mes/día distinto al de los datos. Ahora mes, día actual, "día futuro" y el detalle del día se calculan con **`appiFechaBA()`** (la misma hora de los almacenes), con el reloj del dispositivo solo como respaldo si no está disponible.
- Se eliminó una línea muerta (`hoyClave`) en el marcado de los días del mes.
- Cubierto por `psa-sync-automatico.spec.js` (con `appiFechaBA` fijo: el desglose muestra el mes y el día de Buenos Aires, marca hoy el 15 y futuro el 16).
- Versión: **v631 · Segura** · Cache `appi-v631-desglose-hora-ba`.

## v630 · El registro diario deja de borrarse y no duplica PB

- Corregido el bug de fondo que podía dejar días del desglose **"sin cambios de PB"** aunque sí hubiera habido compras: al volver a traer la línea de PSA en el mismo día (la app la refresca sola cada algunos minutos), la comparación se hacía contra el propio registro de ese día y los cambios quedaban en cero. Ahora se compara siempre contra el **día anterior real** y el registro del día se recalcula sin perderse.
- La línea **manda** en los días que cubre: ya no se suman arriba los movimientos detectados (medían los mismos aumentos con otra base y duplicaban PB). Los movimientos de PB solo **completan días sin registro de línea** (ahí mantienen su acumulado real, igual que v628/v629).
- El mensaje neutral del día de hoy y el acumulado con el total del equipo se conservan tal cual.
- Cubierto por `psa-sync-automatico.spec.js` (re-traer la línea el mismo día conserva los cambios; el día con línea muestra una sola fila sin duplicar).
- Versión: **v630 · Segura** · Cache `appi-v630-linea-no-borra`.

## v629 · El día de hoy ya no dice "no ingresaste": se carga solo

- El día de hoy sin compras mostraba "😴 No ingresaste este día / Como no abriste APPI..." — algo falso si estás con la app abierta y simplemente nadie compró todavía. Ahora dice **"Todavía no hay movimientos de PB hoy"**, y en la tarjeta del día "se cargan solos". Los días pasados conservan "No ingresaste este día" (ahí sí es cierto).
- Los días sin registro de línea con movimientos de PB muestran su **acumulado real** (`acum.`) calculado con el total del equipo al momento de la detección (misma semántica que el `total` que guarda la línea).
- Cubierto por `psa-sync-automatico.spec.js`.
- Versión: **v629 · Segura** · Cache `appi-v629-hoy-sin-mensaje-error`.

## v628 · Los avisos de PB quedan registrados en el desglose

- Cuando te llega el aviso **"⚡ Juan sumó +X PB"** (alguien de tu equipo hizo una compra), ese movimiento ya no queda solo en la notificación: **se guarda automáticamente en el registro diario** del desglose semanal y diario de PB (`Mi negocio → TOTAL PB → VER`).
- El día de la compra muestra a los distribuidores que sumaron PB, cuánto sumó cada uno y su nuevo total — aunque ese día no haya registro propio de la línea de PSA. El total de la semana y del mes sigue calculándose igual.
- El registro se guarda aunque tengas los avisos apagados o sin permiso de notificaciones: con que el teléfono note el movimiento, queda en el día.
- `recordatorios-app.js` alimenta el nuevo registro (`appi_pb_mov_v1`) en el mismo detector que dispara los avisos; `index.html` lo mezcla en `abrirModalDetallePB`. Cubierto por `psa-sync-automatico.spec.js`.
- Versión: **v628 · Segura** · Cache `appi-v628-registro-diario-pb`.

## v627 · Compartir contacto → APPI, directo desde el teléfono

- Un usuario de Android con APPI instalada como app puede **compartirle un contacto desde cualquier otra app** (Contactos, WhatsApp, un archivo .vcf): APPI aparece en el menú compartir gracias al `share_target` del manifest.
- El Service Worker atrapa el envío, lo aparta en una cola de respaldo y redirige a la app; la página importa los contactos a la **Agenda Personal** (Mi Gestión), de donde ya los lista la hoja de **cada pétalo** de la Margarita sin que nadie los vuelva a tocar.
- Si no es una agenda (.vcf) sino un texto simple, se rescata el nombre y el número a ojo. En iPhone/Safari el menú compartir no ofrece esto: sigue valiendo "Subir agenda" dentro de la hoja.
- Versión: **v627 · Segura** · Cache `appi-v627-compartir`.

## v626 · La Margarita mete la agenda del teléfono de una

- La hoja de un pétalo ahora tiene **"Subir agenda"**: la persona elige una vez el archivo `.vcf` que exporta su teléfono (Android e iPhone) y toda su agenda entra al pétalo de una sola vez, sin tocar contacto por contacto. Se queda guardada en su cuenta y lista para siempre.
- El botón del teléfono (**"Elegir del teléfono"**, Contact Picker de Android) pasa a vivir **dentro de la hoja**, como una opción más, no se dispara solo al tocar un pétalo vacío. Si el picker no abre en el dispositivo, **no pasa nada visible**: ni cartel, ni toast, ni guía de permisos — la hoja sigue ahí y la persona elige otra vía.
- Se quitaron todos los mensajes que pedían configurar el dispositivo o tocar un pétalo vacío: si no hay personas para mostrar sale una línea y los dos botones ("Subir agenda" y "Ver mi Agenda APPI").
- `margarita-contactos.spec.js` cubre la importación `.vcf`, el picker dentro de la hoja y el test de honestidad: el picker roto no muestra ningún diálogo ni texto de configuración (7 tests).
- Versión: **v626 · Segura** · Cache `appi-v626-subir-agenda`.

## v625 · La Margarita no vuelve a frenar si la agenda no abre

- En algunos Android (Chromium de fabricante, pestaña secundaria) el botón del teléfono existe pero la agenda se niega a abrir. Ahora el pétalo **cae solo a la hoja** con tus contactos de APPI, te avisa con un aviso breve y deja el botón "Elegir del teléfono" para reintentar — nunca más un callejón con solo un alert. Si el teléfono vuelve a funcionar, todo sigue igual.
- El selector se pide además en pestaña de primer plano, reintenta con una sola propiedad si el combo completo no cierra, y recuerda la falla para no volver a intentar en cada toque.
- `margarita-contactos.spec.js` suma el caso "picker roto → hoja" (6 tests).
- Versión: **v625 · Segura** · Cache `appi-v625-contactos-fix`.

## v624 · La Margarita habla con tu teléfono y con tu Panel

- Un **pétalo vacío** ahora abre **directo la agenda del teléfono** (Contact Picker) en Android: un solo toque, selección múltiple, y queda guardado con el contador al día.
- Donde el navegador no permite abrir la agenda del teléfono (iPhone/Safari, PC), el pétalo abre la hoja con los contactos que ya guardaste en APPI: **Mi Gestión → Panel de Contactos + Agenda Personal** unificados, sin duplicados (dedup por teléfono), ordenados por nombre y con etiqueta de origen ("Panel APPI" / "Agenda" / "Teléfono").
- La hoja ahora muestra arriba lo que ya elegiste (para poder desmarcarlo), busca por nombre o teléfono, y con miles de contactos muestra por tandas de 100 con "mostrar más" para no colgar el teléfono. Si no tenés contactos cargados aún, refresca Mi Gestión solo y te orienta a cargarlos.
- El selector se pide con las propiedades que el dispositivo realmente soporta (`getProperties`), se deduplican los elegidos por dígitos del teléfono y la selección guardada sigue siendo la misma de siempre (no cambia el formato sincronizado con la nube).
- `margarita-contactos.spec.js` + 2 tests nuevos (picker directo y hoja con Panel) y el spec ya corre en CI (shard A).
- Versión: **v624 · Segura** · Cache `appi-v624-margarita-contactos`.

## v623 · El Campus vuelve al fondo de APPI

- El fondo del Campus traía unos resplandores amarillos (radiales dorados y arena) que chocaban con el resto de la app. Quedó con el mismo color crema que toda APPI (`#f3eee3`), como corresponde al idioma visual unificado.
- Versión: **v623 · Segura** · Cache `appi-v623-campus-blanco`.

## v622 · Las tarjetas del mazo entran en cascada

- En el teléfono las tarjetas del Home aparecían de golpe (o tardaban en montarse: el mazo arma ~14 cartas desde cero). Ahora, cada vez que llegás al Home, las cartas **entran en cascada** igual que el "deal" de escritorio: la de arriba aterriza primero y las de atrás la siguen, cada una asomando desde abajo con una leve respiración de escala.
- Respetan `prefers-reduced-motion` (sin animación si lo activaste) y si agarrás una carta en pleno vuelo, el dedo manda al instante: la entrada se corta y el arrastre funciona normal.
- El vaivén de demostración de la primera carta espera a que la entrada termine, así no se pisan las dos animaciones.
- Versión: **v622 · Segura** · Cache `appi-v622-entrada-cartas`.

## v621 · Desglose PB en dos columnas (delta + acumulado)

- El desglose semanal/diario de Mi negocio → Total PB → Ver ahora muestra **dos números por día**: lo que se sumó ese día (delta, en azul) y el **acumulado del mes hasta ese día** (`acum.`). Lo mismo en la cabecera de cada semana (acumulado al cierre) y en el detalle de un día (`acum. X` bajo el número grande).
- El acumulado ya estaba guardado por día en `appi_linea_v1` (`total` = total del mes a esa fecha con la ventana de 35 días); este cambio solo lo muestra.
- Los días sin apertura siguen marcados (`No ingresaste` / `Sin datos` / `futuro`), no se inventan números. Primer día de carga del mes: delta 0 y acumulado = total del día (punto de partida).
- `abrirModalDetallePB` quedó expuesta en `window` para poder testearla y para los `onclick` inline.
- Test e2e nuevo: 'el desglose semanal/diario muestra delta y acumulado por día'.
- Versión: **v621 · Segura** · Cache `appi-v621-desglose-acumulado`.

## v620 · PB del equipo al día

- El PB por persona (👤 en Mi negocio y en el equipo) quedaba congelado: la Línea de PSA ya viene alineada (header y filas de 14 celdas, `PB Mes Actual` en la columna 7), pero `filasLineaHtml` le anteponía una celda vacía y `procesarExcel` descartaba a todas las personas (leía el nivel `(1)` como nombre). El total sí se movía porque el desglose usa otro parser. Ahora el sync devuelve las filas crudas y `equipoData` se refresca a cada apertura.
- De paso quedó visible el botón de refrescar de Mis Garantías/Usuarios (un CSS viejo lo ocultaba con `!important`).
- Versión: **v620 · Segura** · Cache `appi-v620-linea-alineada-equipo`.

## v619 · Arreglado el desglose semanal y diario de PB

- El desglose de PB por día/semana (Mi negocio → Total PB → Ver) se alimentaba de `action:'linea'`, que seguía usando el motor viejo: descubría el informe solo con links `<a idx>`, pedía el período como `MM-YYYY` y parseaba con el formato de tabla que PSA dejó de usar. Contra el PSA real devolvía 0 integrantes y el desglose nunca juntaba datos.
- Ahora `action:'linea'` usa el mismo motor que el sync de v618: descubrimiento real por `AutoConsulta` (idx 69 en ac_cat=20), `bajarReporte` con `periodo YYYY-MM` + el nombre exacto de la consulta y reenvío del form por POST (inputs y selects, Latin-1), y `parsearLineaHtml` con el formato real `[centro-dip] Apellido [región]` (nombre + PB).
- Al bajar la línea con éxito la app guarda el `idx` resuelto en `appsi_psa_idx`, para que el sync posterior lo use como override. Cada día que abrís APPI se registra el día y el desglose marca los días sin ingreso (`No ingresaste este día`), el estado inicial del mes, y suma solo los cambios reales de PB por integrante.
- Versión: **v619 · Segura** · Cache `appi-v619-desglose-pb-linea-fix`.

## v618 · Los 3 archivos de PSA al día con una sola entrada

- **Al entrar con MI PSA conectado se bajan los 3 archivos en UNA sola sesión**: Línea descendente (ac_cat=20), Garantías por organización y Garantías (ac_cat=21), y se aplican al equipo, a cada persona y a la base de clientes sin que toques nada.
- Antes solo la base de Garantías se descargaba de verdad; la Línea y las Garantías por organización se actualizaban de a una (o quedaban solo de "nombre"). Ahora un solo `action:'sync'` trae todo y los índices resueltos quedan cacheados en el dispositivo (`appsi_psa_idx`) para no redescubrirlos cada vez.
- El refresco respeta las casillas de MI PSA (Línea / Garantías org / Garantías) y la de **Auto-actualizar al abrir**, y cualquiera de los botones de actualizar (Mi equipo, Usuarios) dispara la misma sincronización completa.
- Si PSA esconde algún informe detrás de un índice nuevo, la app avisa con el listado (`menu`) que expone Autoconsulta para ajustarlo sin reversionar.
- Versión: **v618 · Segura** · Cache `appi-v618-sync-psa-completo`.

## v617 · Números del equipo solos y archivos siempre nuevos

- **Los números del equipo se actualizan solos**: cada vez que entrás y mientras dejás APPI abierta, la Línea de PSA se refresca automáticamente (cada 3 minutos) y el PB, personas y activos de Mi negocio / Mi equipo se repintan sin tocar nada.
- **Los archivos siempre son la versión nueva**: todos los `.js` y `.css` se versionan con el número de release (`?v=617`) al subir cada versión, así el teléfono/CDN nunca se queda con una copia vieja al entrar por primera vez.
- El refresco automático respeta la casilla **Auto-actualizar al abrir** de MI PSA: sin marcar, no hay descargas en segundo plano.
- Versión: **v617 · Segura** · Cache `appi-v617-numeros-automaticos`.

## v616 · Actualización de archivos desde el arranque

- La actualización de archivos arranca apenas se pinta la pantalla del agua (antes esperaba el evento `load` de la página): el Service Worker se registra y revisa la versión al inicio.
- Si el dispositivo traía una versión anterior, se actualiza el Service Worker y la app se recarga UNA sola vez con el boot todavía en pantalla, así nadie entra a APPI con archivos viejos.
- El agua se aguanta unos segundos mientras corre la actualización: la recarga cae cubierta y el usuario nunca alcanza a usar la copia vieja.
- Versión: **v616 · Segura** · Cache `appi-v616-actualizacion-desde-boot`.

## v615 · Diario de ingresos: el desglose sigue los días que usás APPI

- El desglose de **Mi negocio → TOTAL PB** funciona como un diario de tu uso de APPI: cada día que abrís la app se cargan **solo los cambios de PB** detectados (nombre y PB), nunca acumulados.
- Día que **no abriste APPI** → figura **"No ingresaste este día"** (y el detalle lo explica). Días anteriores a tu primer ingreso del mes → "Sin datos registrados".
- El **primer ingreso del mes** carga el estado inicial del equipo como punto de partida; los cambios se suman a partir del próximo ingreso.
- Si hubo días sin abrir la app, los cambios acumulados en ese tramo se muestran el día que volvés a entrar (el informe de PSA no permite repartir por día calendario).
- Con datos de la Línea activos, el desglose ya **no reparte PB acumulado** entre días: muestra solo cambios reales.
- Versión: **v615 · Segura** · Cache `appi-v615-diario-de-ingresos`.

## v614 · PB por día con la Línea descendente de PSA

- El desglose de **Mi negocio → TOTAL PB** se alimenta solo del informe **Autoconsulta → Informes de organización → Línea descendente**: muestra **nombre y PB** de cada integrante por día.
- Cada vez que se abre la app se baja la Línea desde PSA (con las credenciales de MI PSA de Ajustes), se guardan los números y se acumulan los cambios de un día para el otro. Sirve para todo el que tenga organización.
- TOTAL PB pasa a ser la suma de los PB de la Línea descendente (respaldo: Reporte de Bonos / archivo de equipo mientras no haya dato).
- Sin conexión MI PSA o sin informe reconocido, todo queda como antes.
- Nota técnica: el índice del informe se redescubre en Autoconsulta; si PSA lo cambia, se ajusta con el secret `PSA_LINEA_IDX`.
- Versión: **v614 · Segura** · Cache `appi-v614-pb-por-dia`.

## v613 · Una sola carga por apertura (Service Worker consolidado)

- El Service Worker se registra una sola vez: se eliminó el segundo registro del bloque de actualización que podía provocar recargas duplicadas al abrir la app.
- Toda recarga automática (despertar desde memoria o instalación de una versión nueva) pasa por un presupuesto único por apertura: como máximo una recarga.
- Se quitó el banner "Nueva versión disponible" obsoleto (el flujo principal ya actualiza y recarga solo, una vez).
- Versión: **v613 · Segura** · Cache `appi-v613-una-sola-recarga`.

## v578 · Vencimiento: se guarda de verdad (sin esperar el backend nuevo)

- **📆 Vence el** graba el día usando la prórroga que ya está en el servidor.
- El popup muestra la fecha sin `<b>`.
- Versión: **v578 · Segura** · Cache `appi-v578-vence-rpc`.

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
