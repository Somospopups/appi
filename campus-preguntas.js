/* ============================================================
   APPI · Banco de preguntas post-video (v646)
   ------------------------------------------------------------
   Preguntas ORIGINALES de APPI (no son las del Campus ni copian
   sus capacitaciones): acompañan cada clase del Campus con 3
   preguntas cortas cuando terminás de verla.

   Clave: url de la clase. Si una clase no está en el banco, se
   marca "vista ✓" como siempre y se va sumando con el tiempo.

   Formato por pregunta:
     [ pregunta, [opciónA, opciónB, opciónC, opciónD], índiceCorrecta ]
   El área y el tema se toman de la propia clase.
   ============================================================ */
(function(){
  'use strict';

  var BANCO = {
    /* ---- M1 · Esencia PSA ---- */
    '/curso/modulo-1-esencia-psa/video/m1-bloque-1-mision-vision-y-valores': [
      ['¿Para qué sirve tener misión, visión y valores claros en el negocio?', ['Para adornar la presentación inicial.','Para orientar cada decisión y explicarle a otros hacia dónde vamos.','Para reemplazar la lista de contactos.','Para fijar únicamente el precio de los productos.'], 1],
      ['La visión de tu negocio debe ayudarte a...', ['Definir hacia dónde querés crecer a futuro.','Recordar el precio de cada equipo.','Evitar hablar con clientes.','Copiar lo que hace la competencia.'], 0],
      ['Los valores se sostienen cuando...', ['Se escriben una sola vez y quedan archivados.','Se usan para elegir cómo actuás todos los días.','Se publican sin relación con el trabajo.','Dependen del ánimo de cada semana.'], 1]
    ],
    '/curso/modulo-1-esencia-psa/video/m1-bloque-2-tu-rol-como-dip': [
      ['¿Qué significa ser DIP en el Negocio PSA?', ['Ser un consumidor ocasional del producto.','Ser un distribuidor independiente que presenta y acompaña el negocio.','Ser el empleado de una tienda.','Ser únicamente un usuario de garantía.'], 1],
      ['Tu rol como DIP se construye sobre todo con...', ['Acción diaria, aprendizaje y acompañamiento a otros.','Esperar que el equipo haga el trabajo.','Cambiar de estrategia cada semana.','Evitar el seguimiento a los contactos.'], 0],
      ['La responsabilidad principal de un DIP es...', ['Facturar el primer mes a cualquier costo.','Cuidar la relación con personas y usuarios.','Delegar todo el trabajo administrativo.','Vender únicamente a familiares.'], 1]
    ],
    '/curso/modulo-1-esencia-psa/video/m1-bloque-3-negocios-tradicionales-y-el-negocio-psa': [
      ['¿Qué diferencia al Negocio PSA de un negocio tradicional?', ['No requiere relación con las personas.','Se basa en acompañar y hacer crecer una red de distribuidores y usuarios.','Depende sólo del local físico.','No necesita seguimiento.'], 1],
      ['En el Negocio PSA, el crecimiento sostenible viene de...', ['Sumar personas sin acompañamiento.','Repetir acciones simples y acompañar a cada persona.','Vender de forma aislada cada mes.','Esperar referidos espontáneos.'], 1],
      ['Un negocio tradicional y el Negocio PSA comparten la necesidad de...', ['Ignorar al cliente.','Tener un sistema y atención al cliente.','No medir resultados.','Trabajar sin metas.'], 1]
    ],
    '/curso/modulo-1-esencia-psa/video/m1-bloque-4-tipos-de-ingreso': [
      ['¿Cuál de estos es un ingreso activo?', ['Un alquiler que cobrás sin trabajar.','Tu acción comercial del día a día.','Un rendimiento financiero.','Una herencia.'], 1],
      ['La idea clave de los tipos de ingreso es...', ['Que todos los ingresos son iguales.','Distinguir entre ganar con tu tiempo y ganar con un sistema.','Que sólo existe el ingreso fijo.','Que ahorrar reemplaza a ganar.'], 1],
      ['Para construir ingresos pasivos en el negocio conviene...', ['Focalizarte sólo en la venta del día.','Construir acompañamiento que siga creciendo aunque no estés vendiendo hoy.','Esperar el momento perfecto.','Evitar llevar registro de resultados.'], 1]
    ],
    '/curso/modulo-1-esencia-psa/video/m1-bloque-5-actitud-emprendedora': [
      ['La actitud emprendedora se nota cuando...', ['Se actúa a pesar de la incomodidad y se aprende del resultado.','Se espera a tener todas las certezas.','Se blame a las circunstancias.','Se cambia de plan a diario.'], 0],
      ['Ante un "no" de un contacto, la respuesta emprendedora es...', ['Insistir de inmediato y presionar.','Agradecer, registrar el resultado y avanzar con otro contacto.','Dejar el negocio por una semana.','Pedirle que lo piense todos los días.'], 1],
      ['¿Qué hábito sostiene mejor una actitud emprendedora?', ['Acción diaria con revisión de lo aprendido.','Trabajar sólo cuando hay urgencia.','Compararse constantemente con otros.','Postergar decisiones hasta el lunes.'], 0]
    ],
    '/curso/modulo-1-esencia-psa/video/m1-bloque-6-que-es-el-exito': [
      ['¿Cómo define el negocio el éxito?', ['Sólo por el ingreso del mes.','Como un proceso que se construye con metas, aprendizaje y vínculos.','Como la ausencia total de problemas.','Como llegar antes que los demás.'], 1],
      ['Una medición útil del éxito...', ['Te muestra qué acciones te acercan a tu meta.','Se compara con el resultado de otros.','Se revisa una vez al año.','Depende de la suerte del mes.'], 0],
      ['El éxito sostenible en el negocio se apoya en...', ['Acción constante, aprendizaje y relaciones de confianza.','Resultados aislados de un fin de semana.','Copiar la estrategia de otro.','Evitar registrar los números.'], 0]
    ],
    /* ---- M2 · Productos PSA ---- */
    '/curso/modulo-2-productos-psa-1/video/b1-fuentes-de-agua': [
      ['¿Por qué importa conocer la fuente del agua?', ['Porque define qué tratamiento necesita el agua.','Porque marca el color del equipo.','Porque fija el precio de venta.','Porque determina el horario de la demo.'], 0],
      ['Agua de pozo, red o superficial se diferencian en...', ['En su composición y contaminantes presentes.','En el lugar donde se guardan las facturas.','En la cantidad de contactos de la lista.','En el tipo de llamado que se hace.'], 0],
      ['Antes de recomendar un equipo conviene saber...', ['La fuente y el uso que se le da al agua.','El modelo de celular del usuario.','La marca de grifería.','Su horario libre.'], 0]
    ],
    '/curso/modulo-2-productos-psa-1/video/b2-contaminantes': [
      ['Los contaminantes del agua pueden ser...', ['Sólo químicos de origen industrial.','Biológicos, químicos y físicos.','Visibles siempre a simple vista.','Únicamente cloro.'], 1],
      ['Detectar el problema del agua permite...', ['Recomendar una solución acorde a la necesidad.','Ajustar únicamente el precio.','Evitar hacer preguntas.','Vender sin demostración.'], 0],
      ['Saber qué contaminante tiene el agua sirve para...', ['Elegir el medio de tratamiento correcto.','Recordar la fecha de la visita.','Definir la lista de contactos.','Escribir mejor el mensaje inicial.'], 0]
    ],
    '/curso/modulo-2-productos-psa-1/video/b3-medios-filtrantes-y-medios-activos': [
      ['¿Cuál es la función de un medio filtrante?', ['Retener partículas sólidas del agua.','Darle sabor al agua.','Medir la presión de la red.','Calentar el agua para la ducha.'], 0],
      'blank',
      ['Un medio activo trabaja principalmente...', ['Con adsorción o reacción sobre contaminantes específicos.','Aumentando la presión del agua.','Enchestrando el equipo.','Marcando el vencimiento de la garantía.'], 0]
    ],
    '/curso/modulo-2-productos-psa-1/video/b4-productos-y-soluciones-parte-i': [
      ['Al recomendar un equipo, el punto de partida es...', ['La necesidad y la fuente de agua del usuario.','El stock disponible en depósito.','El precio más alto de la línea.','La promoción del mes.'], 0],
      ['La demostración al usuario busca...', ['Demostrar el problema y la solución en su propia agua.','Impresionar con datos sin contexto.','Evitar preguntas del usuario.','Apurar el cierre.'], 0],
      ['Elegir bien el producto evita...', ['Que el usuario quede conforme a largo plazo.','Que la instalación se realice.','Que el cliente recomiende.','Que haya que dar seguimiento.'], 0]
    ],
    '/curso/modulo-2-productos-psa-1/video/b5-productos-y-soluciones-parte-ii': [
      ['Los beneficios de un equipo se comunican...', ['Enfocándose en qué mejora para el usuario.','Nombrando únicamente el modelo.','Comparando con marcas ajenas.','Listando todas las características técnicas sin contexto.'], 0],
      ['¿Qué ayuda más a decidir a un usuario?', ['Ver el resultado en su propia agua y entender el beneficio.','Leer la lista completa de repuestos.','Recibir el precio por mensaje sin explicación.','Insistir con llamados diarios.'], 0],
      ['Al presentar una solución conviene...', ['Relacionar cada característica con una necesidad real.','Omitir los detalles de mantenimiento.','Dar por sentado que conoce el equipo.','Presionar para que decida en el momento.'], 0]
    ],
    /* ---- M3 · Contactos ---- */
    '/curso/modulo-3-contactos/video/b1-que-es-un-contacto': [
      ['¿Qué es un contacto en el negocio?', ['Una persona a quien podés presentar la oportunidad con respeto.','Un cliente que ya compró obligatoriamente.','Un número de teléfono comprado.','Un contacto que se molesta al llamar.'], 0],
      ['Una lista de contactos se construye...', ['Con personas conocidas de confianza, sin comprar datos.','Comprando listas ajenas.','Sólo con familiares directos.','Esperando a que te la den hecha.'], 0],
      ['El primer paso con un contacto es...', ['Presentarte y pedir permiso para contarle.','Mandar la lista de precios de inmediato.','Insistir hasta que responda.','Pedirle que compre primero.'], 0]
    ],
    '/curso/modulo-3-contactos/video/b2-primera-lista': [
      ['¿Cómo se arma la primera lista?', ['Anotando a las personas de tu círculo con las que hay confianza.','Pidiendo números a desconocidos.','Comprando una base de datos.','Copiando la agenda de otra persona.'], 0],
      ['La primera lista debe contener...', ['Nombres y datos de contacto fiables de personas conocidas.','Sólo correos electrónicos.','Únicamente clientes actuales.','Contactos de otras provincias.'], 0],
      ['Un buen criterio para sumar contactos es...', ['Que sea alguien con quien ya existe vínculo y confianza.','Que tenga muchas redes sociales.','Que viva lejos.','Que nunca haya escuchado de vos.'], 0]
    ],
    '/curso/modulo-3-contactos/video/b3-consideraciones-previas-al-llamado': [
      ['Antes de llamar conviene...', ['Tener presente el objetivo del llamado y el horario adecuado.','Llamar sin preparación para sonar espontáneo.','Hacerlo en pleno horario de descanso.','Escribir un guion largo que se lea palabra por palabra.'], 0],
      ['Una consideración clave previa al llamado es...', ['Elegir un momento en que la persona pueda conversar con calma.','Llamar justo al iniciar la jornada.','Pedirle que resuelva todo en el primer contacto.','Evitar presentarte.'], 0],
      ['Preparar el llamado ayuda a...', ['Ir con un propósito claro y evitar perder el tiempo del otro.','Hablar más rápido.','Omitir la invitación.','Vender en el primer minuto.'], 0]
    ],
    '/curso/modulo-3-contactos/video/b4-llamado-para-demo': [
      ['El objetivo del llamado para demo es...', ['Agendar una demostración, no cerrar la venta por teléfono.','Vender el equipo en la misma llamada.','Cobrar por adelantado.','Dar la lista de precios completa.'], 0],
      ['En el llamado para demo conviene...', ['Invitar a conocer la propuesta y dejar espacio para preguntas.','Explicar todo el catálogo técnico.','Insistir hasta obtener un sí.','Presionar con un límite de tiempo.'], 0],
      ['Cerrás bien un llamado para demo cuando...', ['Queda agendado un próximo contacto concreto.','Se intercambian muchos datos técnicos.','La persona cuelga sin quedar comprometida.','Se le manda un mensaje largo.'], 0]
    ],
    '/curso/modulo-3-contactos/video/b5-llamado-para-pn': [
      ['¿Qué es un PN?', ['Un pedido o necesidad concreta de la persona.','Un tipo de grifería.','Un horario de llamado.','Una categoría de producto.'], 0],
      ['Ante una necesidad puntual (PN), la acción es...', ['Profundizar en esa necesidad y ofrecer una demostración acorde.','Cambiar de tema inmediatamente.','Enviar la lista completa de precios.','Llamar otra vez sin motivo.'], 0],
      ['Una PN bien registrada sirve para...', ['Personalizar el seguimiento y la demostración.','Reducir la lista de contactos.','Evitar nuevas consultas.','Definir el precio final.'], 0]
    ],
    '/curso/modulo-3-contactos/video/b6-nuevas-listas': [
      ['¿Cómo se siguen generando nuevas listas?', ['Pidiendo referidos y sumando vínculos de cada contacto nuevo.','Repetir siempre la misma lista inicial.','Comprando datos.','Limitarse a un único círculo.'], 0],
      ['Los referidos son importantes porque...', ['Abren puertas con confianza ya construida.','Reemplazan la necesidad de seguimiento.','Aumentan el costo de adquisición.','Eliminan la demostración.'], 0],
      ['Una lista nueva se cuida...', ['Agradeciendo y haciendo un seguimiento ordenado.','Mezclando todos los contactos sin registro.','Escribiendo siempre el mismo mensaje.','Esperando meses para retomarla.'], 0]
    ],
    /* ---- M4 · Demostración ---- */
    '/curso/modulo-4-demostracion/video/que-es-una-demostracion': [
      ['¿Qué es una demostración?', ['Mostrar en vivo el problema del agua y su solución ante el usuario.','Un folleto enviado por mensaje.','Una lista de precios leída en voz alta.','Una llamada comercial larga.'], 0],
      ['La demostración tiene sentido cuando...', ['Se parte de la necesidad real de esa persona.','Se repite igual para todos sin preguntar.','Se muestra todo el catálogo.','Se evita el contacto visual.'], 0],
      ['El propósito de la demo es...', ['Generar confianza mostrando un resultado verificable.','Apurar la decisión.','Comparar con marcas ajenas.','Entregar el equipo sin explicar.'], 0]
    ],
    '/curso/modulo-4-demostracion/video/paso-1-imagen': [
      ['El paso de imagen busca...', ['Generar una buena primera impresión y credibilidad.','Vender el equipo en el ingreso.','Evitar la presentación personal.','Recordar la fecha de vencimiento.'], 0],
      ['Cuidar la imagen ayuda a...', ['Que la persona confíe en la propuesta desde el inicio.','Reducir la duración de la demo.','Omitir las preguntas del usuario.','Aumentar el precio percibido.'], 0],
      ['La imagen en la demo se nota en...', ['Tu presentación, el orden y el cuidado del espacio.','El número de folletos que llevás.','La marca del equipo que usás.','El horario elegido.'], 0]
    ],
    '/curso/modulo-4-demostracion/video/paso-2-vinculo': [
      ['El paso de vínculo consiste en...', ['Construir confianza antes de mostrar la solución.','Negociar el precio de inmediato.','Entregar la documentación.','Explicar todos los repuestos.'], 0],
      ['Un vínculo sólido se logra...', ['Escuchando y mostrando interés genuino por la persona.','Hablando sin pausas del producto.','Haciendo promesas exageradas.','Evitando preguntas personales relevantes.'], 0],
      ['¿Por qué se cuida el vínculo antes de la demo?', ['Porque la confianza hace que el resultado se perciba con mayor claridad.','Porque reduce el tiempo de instalación.','Porque evita tener que hacer seguimiento.','Porque fija un precio obligatorio.'], 0]
    ],
    '/curso/modulo-4-demostracion/video/paso-3-solicitud-de-referidos': [
      ['Pedir referidos en la demo corresponde al paso...', ['Solicitud de Referidos, antes de la demostración.','Cierre, después de la venta.','Análisis, una semana después.','Comparativa, antes del vínculo.'], 0],
      ['¿Cuándo conviene pedir referidos?', ['Cuando la persona ya confía y vio el valor de la propuesta.','Al inicio, antes de presentarse.','Nunca, porque incomoda.','Después de la entrega, sin preparar.'], 0],
      ['Un pedido de referido efectivo es...', ['Concreto, respetuoso y con un contexto claro.','Genérico y repetido.','Acompañado de presión.','Planteado como condición.'], 0]
    ],
    '/curso/modulo-4-demostracion/video/paso-4-demostracion-1': [
      ['En el paso de demostración conviene...', ['Mostrar el problema y la solución con la agua del usuario.','Leer la ficha técnica completa.','Saltar directo al precio.','Hacerla sin preguntar previamente.'], 0],
      ['La demostración más eficaz es...', ['Aquella que responde a la necesidad que levantó la persona.','La que muestra más productos a la vez.','La que dura más tiempo.','La que evita las objeciones.'], 0],
      ['Durante la demo debés...', ['Observar la reacción y adaptar la explicación.','Hablar de forma continua.','Evitar las preguntas.','Terminar lo antes posible.'], 0]
    ],
    '/curso/modulo-4-demostracion/video/paso-5-analisis-de-referidos-1': [
      ['El análisis de referidos busca...', ['Entender a quién más le puede interesar y cuidar la red.','Evaluar el precio del equipo.','Comparar con la competencia.','Definir el horario de instalación.'], 0],
      ['¿Por qué se analizan los referidos?', ['Porque amplían la lista con confianza ya ganada.','Porque reducen la duración de la demo.','Porque reemplazan el seguimiento.','Porque evitan la instalación.'], 0],
      ['Un buen análisis de referidos deja...', ['Una lista accionable con vínculo de confianza.','Un folleto nuevo.','Un precio fijo.','Un recordatorio vacío.'], 0]
    ],
    '/curso/modulo-4-demostracion/video/paso-6-comparativa': [
      ['El paso de comparativa sirve para...', ['Situar la propuesta frente a otras opciones con honestidad.','Desacreditar a otras marcas.','Ocultar información del usuario.','Fijar el precio final.'], 0],
      ['Una comparativa profesional...', ['Se basa en datos y beneficios concretos.','Compara por criticar.','Evita nombrar alternativas.','Muestra sólo lo a favor propio.'], 0],
      ['Al comparar conviene...', ['Ser claro con ventajas y límites.','Exagerar los beneficios.','Omitir costos de mantenimiento.','Evitar cualquier pregunta.'], 0]
    ],
    '/curso/modulo-4-demostracion/video/paso-7-limpieza-de-objeciones': [
      ['La limpieza de objeciones consiste en...', ['Escuchar la duda y resolverla con información clara.','Ignorar la preocupación.','Contestar con presión.','Cambiar de tema.'], 0],
      ['Una objeción bien atendida...', ['Fortalece la confianza y acerca la decisión.','Cierra la conversación.','Debe responderse con un descuento.','Se deja para después sin registrar.'], 0],
      ['¿Cuál es el primer paso ante una objeción?', ['Escucharla completa y entender de dónde viene.','Responder de inmediato con un precio.','Pedir que lo piense otro día.','Ofrecer un regalo.'], 0]
    ],
    '/curso/modulo-4-demostracion/video/paso-8-cierre': [
      ['El cierre se da cuando...', ['La persona comprendió el valor y queda un próximo paso concreto.','Se entrega el equipo sin conversación.','Se agotaron los argumentos.','Terminó el horario disponible.'], 0],
      ['Un cierre honesto...', ['Propone una acción clara respetando el momento del otro.','Presiona para que diga sí ya.','Omite los costos.','Depende del descuento final.'], 0],
      ['Si la persona no decide hoy, corresponde...', ['Agendar un seguimiento concreto y agradecer.','Insistir inmediatamente.','Cortar la relación.','Mandar mensajes diarios.'], 0]
    ],
    '/curso/modulo-4-demostracion/video/chequeo': [
      ['El chequeo sirve para...', ['Confirmar que la demostración quedó clara y no quedaron dudas.','Firmar el contrato.','Cobrar el equipo.','Instalar el producto.'], 0],
      ['Hacer un chequeo al final...', ['Asegura que la persona haya entendido cada paso.','Agrega valor al precio.','Reemplaza el seguimiento.','Evita futuros reclamos por garantía.'], 0],
      ['En el chequeo conviene...', ['Preguntar si quedó alguna duda antes de avanzar.','Dar por sentada la decisión.','Apurar la firma.','Omitir el próximo contacto.'], 0]
    ],
    /* ---- M5 · Patrocinio ---- */
    '/curso/modulo-5-patrocinio-1/video/m5-bloque-1': [
      ['¿Qué es el patrocinio en el negocio?', ['Acompañar a una persona para que aprenda a desarrollar su propio negocio.','Contratar empleados.','Vender equipos mayoristas.','Firmar convenios con tiendas.'], 0],
      ['El patrocinio se basa en...', ['Acción, ejemplo y acompañamiento sostenido.','Dar indicaciones sin seguir el resultado.','Delegar todo a un sistema.','Esperar que la persona avance sola.'], 0],
      ['Un buen patrocinador...', ['Acompaña con método y mide los avances.','Se ausenta después de la invitación.','Cobra por cada consejo.','Cambia de persona constantemente.'], 0]
    ],
    '/curso/modulo-5-patrocinio-1/video/m5-bloque-2': [
      ['La invitación al negocio debe ser...', ['Clara, breve y con espacio para preguntas.','Larga y técnica.','Vaga para despertar curiosidad.','Presionada para lograr respuesta inmediata.'], 0],
      ['Al invitar conviene...', ['Explicar de qué se trata y proponer un próximo contacto.','Ocultar el tipo de negocio.','Pedir una decisión en el momento.','Enviar sólo el precio.'], 0],
      ['Una invitación bien hecha deja...', ['Una reunión o demo agendada con confianza.','Un contacto incomodo.','Un precio conocido sin contexto.','Una promesa de compra.'], 0]
    ],
    '/curso/modulo-5-patrocinio-1/video/m5-bloque-3': [
      ['El seguimiento de invitados busca...', ['Mantener viva la conversación con un propósito concreto.','Escribir todos los días sin motivo.','Presionar hasta que acepte.','Reemplazar la presentación.'], 0],
      ['Un seguimiento efectivo...', ['Tiene fecha, tema y una pregunta clara.','Es un mensaje genérico repetido.','Se hace meses después.','Evita mencionar el negocio.'], 0],
      ['Si el invitado no responde, corresponde...', ['Reprogramar el contacto con un tono respetuoso.','Insistir el mismo día varias veces.','Cortar el vínculo para siempre.','Enviar la lista de precios.'], 0]
    ],
    '/curso/modulo-5-patrocinio-1/video/m5-bloque-4': [
      ['Guiar al nuevo consiste en...', ['Ayudarle a definir sus primeras acciones y acompañar sus avances.','Dejarle que descubra todo por su cuenta.','Darle toda la información de una.','Pedirle resultados inmediatos.'], 0],
      ['Los primeros 3 meses del nuevo son decisivos porque...', ['Definen hábitos y confianza en el sistema.','Porque fijan el precio final.','Porque reemplazan la capacitación.','Porque reducen la lista de contactos.'], 0],
      ['Para lograr permanencia en el equipo conviene...', ['Enseñar un método repetible y celebrar cada avance.','Cambiar de estrategia cada semana.','Cobrar por acompañar.','Evitar el contacto después del alta.'], 0]
    ],
    '/curso/modulo-5-patrocinio-1/video/m5-bloque-5': [
      ['Un equipo sólido se construye...', ['Con acompañamiento, formación y acciones repetibles.','Con alta rotación de personas.','Con presión constante por resultados.','Sin registrar avances.'], 0],
      ['La clave para la permanencia es...', ['Que cada persona pueda avanzar con un sistema claro.','Ofrecer incentivos sin formación.','Limitar el contacto a una vez al mes.','Cambiar los objetivos seguido.'], 0],
      ['El plan de crecimiento funciona cuando...', ['Traduce metas en acciones concretas y medibles.','Se escribe sin acciones asociadas.','Depende sólo de la motivación.','Se revisa una vez al año.'], 0]
    ],
    /* ---- M6 · Posventa ---- */
    '/curso/modulo-6-posventa/video/b1-que-es-la-posventa': [
      ['¿Qué es la posventa?', ['El acompañamiento al usuario luego de la venta.','La primera presentación del producto.','El cobro de la instalación.','La negociación del precio.'], 0],
      ['La posventa aporta...', ['Confianza, vínculo y nuevas oportunidades de servicio.','Menos trabajo para el equipo.','Un costo sin retorno.','Evita tener que hacer seguimiento.'], 0],
      ['Una posventa activa permite...', ['Detectar necesidades y referidos con confianza.','Obligar a una recompra.','Reducir la calidad del servicio.','Cerrar la relación con el usuario.'], 0]
    ],
    '/curso/modulo-6-posventa/video/b2-que-es-la-garantia': [
      ['La garantía es...', ['Una respuesta del negocio ante un problema del producto.','Un descuento permanente.','Un seguro obligatorio del usuario.','Un programa de referidos.'], 0],
      ['Atender una garantía bien...', ['Refuerza la confianza y fortalece la relación.','Debe evitarse siempre.','Termina la relación con el usuario.','Aumenta el costo del equipo.'], 0],
      ['Para gestionar la garantía conviene...', ['Registrar el caso y dar seguimiento hasta resolverlo.','Derivarlo sin registrar.','Esperar el reclamo del usuario.','Cambiar el producto sin consultar.'], 0]
    ],
    '/curso/modulo-6-posventa/video/b3-fidelizacion-como-se-construye-el-vinculo': [
      ['La fidelización se construye...', ['Con contacto útil y consistente en el tiempo.','Con descuentos permanentes.','Con llamados de venta frecuentes.','Sin registrar los datos.'], 0],
      ['Un vínculo de fidelidad se sostiene...', ['Acompañando con información relevante y resolviendo necesidades.','Escribiendo sólo cuando hay promoción.','Limitándose a la factura.','Evitando conversaciones personales.'], 0],
      ['El mejor indicador de fidelización es...', ['Que el usuario te recomiende con confianza.','La cantidad de mensajes enviados.','El número de promociones enviadas.','La frecuencia de los reclamos.'], 0]
    ],
    '/curso/modulo-6-posventa/video/b4-herramientas-para-la-posventa': [
      ['Las herramientas de posventa sirven para...', ['Organizar y dar seguimiento a cada usuario de forma ordenada.','Reducir la cantidad de usuarios.','Evitar el registro de datos.','Aumentar el precio del servicio.'], 0],
      ['Un buen registro de posventa permite...', ['Recorder vencimientos y contactos a tiempo.','Reemplazar la demostración.','Evitar futuros reclamos.','Medir sólo las ventas.'], 0],
      ['Elegir la herramienta adecuada ayuda a...', ['No dejar usuarios sin seguimiento.','Escribir mensajes más largos.','Evitar la instalación.','Fijar el precio del canje.'], 0]
    ],
    /* ---- M7 · Sistema de categorías ---- */
    '/curso/modulo-7-flex-marketing-plan-psa-r/video/m7-bloque-1-introduccion-a-nuestro-sistema': [
      ['El sistema de categorías de PSA...', ['Reconoce resultados y acompañamiento dentro de la Carrera Empresarial.','Premia sólo la antigüedad.','Depende de la suerte.','Es un descuento fijo.'], 0],
      'blank',
      ['Avanzar de categoría requiere...', ['Acción sostenida, resultados y acompañamiento al equipo.','Cambiar de equipo cada mes.','Comprar mayor cantidad.','Ausentarse de las capacitaciones.'], 0]
    ],
    '/curso/modulo-7-flex-marketing-plan-psa-r/video/m7-bloque-2-categoria-d': [
      ['La Categoría D representa...', ['Un primer escalón de reconocimiento dentro de la Carrera Empresarial.','El nivel máximo de la carrera.','Un cargo administrativo.','Una promoción de producto.'], 0],
      ['Para alcanzar la Categoría D conviene...', ['Sostener las acciones base y el acompañamiento inicial.','Esperar un año sin actuar.','Cambiar de estrategia seguido.','Evitar la lista de contactos.'], 0],
      ['Los beneficios de categoría se vinculan con...', ['El crecimiento dentro de la Carrera Empresarial.','Un descuento de stock.','El horario de trabajo.','La antigüedad en la base.'], 0]
    ],
    '/curso/modulo-7-flex-marketing-plan-psa-r/video/m7-bloque-3-beneficios-categoria-d': [
      ['Los beneficios de la Categoría D buscan...', ['Reconocer y acompañar el crecimiento del DIP.','Reducir el esfuerzo comercial.','Reemplazar la capacitación.','Limitar el desarrollo del equipo.'], 0],
      'blank',
      ['Aprovechar los beneficios de categoría ayuda a...', ['Sostener el ritmo de crecimiento.','Evitar nuevas acciones.','Cerrar la relación con usuarios.','Disminuir el acompañamiento.'], 0]
    ],
    '/curso/modulo-7-flex-marketing-plan-psa-r/video/m7-bloque-4-categoria-dc': [
      ['La Categoría DC se consigue...', ['Con resultados sostenidos y desarrollo de equipo.','Con antigüedad únicamente.','Con una compra grande.','Con ausencia de reclamos.'], 0],
      'blank',
      ['Subir a DC implica...', ['Mayor responsabilidad en el acompañamiento del equipo.','Menos contacto con usuarios.','Cambiar de producto.','Dejar la lista de contactos.'], 0]
    ],
    '/curso/modulo-7-flex-marketing-plan-psa-r/video/m7-bloque-5-beneficios-categoria-dc': [
      ['Los beneficios de DC...', ['Acompañan a quien ya sostiene resultados y equipo.','Son automáticos sin requisitos.','Reemplazan el seguimiento.','Dependen del stock.'], 0],
      'blank',
      ['Para mantener la categoría DC...', ['Hay que sostener el acompañamiento y los resultados.','Basta con no tener reclamos.','Se mantiene sin actuar.','Depende de otra persona.'], 0]
    ],
    '/curso/modulo-7-flex-marketing-plan-psa-r/video/m7-bloque-6-categoria-ce': [
      ['La Categoría CE es...', ['Un nivel superior de la Carrera Empresarial con mayor acompañamiento.','Un tipo de producto.','Un horario de trabajo.','Un descuento de precio.'], 0],
      'blank',
      ['Alcanzar la Categoría CE requiere...', ['Desarrollo sostenido de equipo y resultados consistentes.','Un único mes de venta alta.','Cambiar de categoría a menudo.','Evitar la capacitación.'], 0]
    ],
    /* ---- M8 · Nuestra marca ---- */
    '/curso/modulo-8-nuestra-marca/video/m8-bloque-1-la-marca-psa': [
      ['La marca PSA representa...', ['Una propuesta de valor y confianza en agua y bienestar.','Una etiqueta decorativa.','Un tipo de grifería.','Un horario de atención.'], 0],
      ['Cuidar la marca personal y de PSA...', ['Aumenta la confianza en cada presentación.','No influye en la venta.','Sólo importa en redes.','Disminuye el vínculo.'], 0],
      ['La marca se construye...', ['Con coherencia entre lo que decís y lo que hacés.','Con promesas exageradas.','Con publicidad constante.','Con descuentos permanentes.'], 0]
    ],
    '/curso/modulo-8-nuestra-marca/video/m8-bloque-2-el-dip-y-la-marca': [
      ['El DIP es protagonista de la marca porque...', ['Su conducta diaria es la cara visible del negocio ante los demás.','Su foto aparece en el logo.','Fija los precios.','Define el horario de las reuniones.'], 0],
      'blank',
      ['Coherencia con la marca se logra...', ['Actuando con ética y claridad en cada contacto.','Evitando las conversaciones difíciles.','Cambiando la propuesta según la persona.','Ocultando límites del producto.'], 0]
    ],
    '/curso/modulo-8-nuestra-marca/video/m8-bloque-3-la-marca-y-la-sustentabilidad': [
      ['La sustentabilidad en PSA...', ['Se relaciona con cuidar el agua y el entorno.','Es un eslogan sin acciones.','Depende del usuario final.','Sólo aplica a productos específicos.'], 0],
      'blank',
      ['Comunicar sustentabilidad con honestidad...', ['Aporta valor real a la propuesta.','Es una obligación legal.','No aporta nada al negocio.','Debe evitarse en las demos.'], 0]
    ],
    '/curso/modulo-8-nuestra-marca/video/m8-bloque-4-nuestras-acciones-la-comunicacion': [
      ['Una comunicación efectiva es...', ['Clara, respetuosa y adaptada a la otra persona.','Larga y técnica.','Idéntica para todos.','Centrada sólo en el precio.'], 0],
      'blank',
      ['La comunicación en el negocio sirve para...', ['Mantener vínculos y coordinar acciones.','Reemplazar la demostración.','Evitar el seguimiento.','Reducir la lista de contactos.'], 0]
    ],
    '/curso/modulo-8-nuestra-marca/video/m8-bloque-5-nuestras-acciones-marketing-personal': [
      ['El marketing personal consiste en...', ['Construir tu presencia y credibilidad de forma coherente.','Publicar sin criterio todo el día.','Ocultar tu actividad.','Copiar el contenido de otros.'], 0],
      'blank',
      ['El marketing personal bien hecho...', ['Suma confianza antes de la primera conversación.','Reemplaza el contacto directo.','Aumenta la desconfianza.','Sólo sirve para vender.'], 0]
    ],
    '/curso/modulo-8-nuestra-marca/video/m8-bloque-6-servicio-de-comercializacion': [
      ['El servicio de comercialización acompaña...', ['La presentación, la demo y el cierre con método.','Únicamente la instalación.','Sólo la parte legal.','El cobro posterior.'], 0],
      'blank',
      ['Contar con un servicio de comercialización ayuda a...', ['Trabajar con un proceso claro y repetible.','Evitar hacer preguntas al usuario.','Reducir la confianza.','Eliminar el seguimiento.'], 0]
    ],
    '/curso/modulo-8-nuestra-marca/video/m8-bloque-7-servicio-de-patrocinio': [
      ['El servicio de patrocinio se centra en...', ['Acompañar a personas nuevas a desarrollar su negocio.','Vender equipos mayoristas.','Atender reclamos.','Administrar inventario.'], 0],
      'blank',
      ['Acompañar con el servicio de patrocinio implica...', ['Dar ejemplo y método con acompañamiento constante.','Dar indicaciones una sola vez.','Cobrar por cada reunión.','Desaparecer tras el alta.'], 0]
    ],
    '/curso/modulo-8-nuestra-marca/video/m8-bloque-8-servicio-de-posventa': [
      ['El servicio de posventa de la marca...', ['Busca sostener la experiencia del usuario después de la venta.','Finaliza la relación con el usuario.','Debe evitarse si hay queja.','Se limita a la entrega.'], 0],
      'blank',
      ['Una posventa de marca se diferencia por...', ['Su organización y acompañamiento consistente.','La cantidad de mensajes.','El descuento aplicado.','El horario de atención.'], 0]
    ]
  };

  // Algunas entradas traen 'blank' como marcador de relleno: se descartan.
  Object.keys(BANCO).forEach(function(k){
    BANCO[k] = (BANCO[k] || []).filter(function(p){ return p && p !== 'blank' && p.length >= 3; });
    if (!BANCO[k].length) delete BANCO[k];
  });

  function preguntasDeClase(url){
    var arr = BANCO[String(url || '')];
    if (!arr || !arr.length) return null;
    return arr.map(function(p){
      return { pregunta: p[0], opciones: p[1], correcta: p[2], explicacion: '' };
    });
  }

  window.APPICampusPreguntas = {
    banco: BANCO,
    preguntasDeClase: preguntasDeClase,
    totalClases: Object.keys(BANCO).length
  };
})();
