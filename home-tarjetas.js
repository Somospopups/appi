/* ============================================================
   APPI · Tarjetas de notificaciones del Home (estilo mazo)
   ------------------------------------------------------------
   Al entrar al Home, las novedades aparecen como un mazo de
   tarjetas que se pasan deslizando (como Tinder): la primera es
   el aliento del día con el progreso real; después, una tarjeta
   por categoría, solo si esa categoría tiene algo para decir:

     💙 Especial  · aliento personalizado (siempre, 1 frase/día)
     ⚡ Hoy te conviene · LA jugada del día (primera carta, un nombre)
     🔄 Plan Canje · equipos vencidos < 1 año, listos para renovar
     📅 Tu jornada · seguimientos y presentaciones de hoy
     🎯 Oportunidades · bonus al alcance en Mi Equipo
     🎂 Cumpleaños · equipo + clientes que cumplen hoy
     📝 Reempadronar · Alta de este mes, hace 1 año o más
     👥 Mi Equipo · Cultura + a quién invitar
     📇 Panel de Contactos · nuevos sin contactar y vencidos
     💧 Usuarios · las acciones del día sin marcar (✓/✗)

   Deslizar pasa la tarjeta y el mazo da la vuelta en bucle: se
   puede ir para adelante y para atrás sin fin. El mazo vive
   siempre a la vista arriba del Home; el botón de cada tarjeta
   lleva directo a la pantalla que corresponde.
   ============================================================ */
(function(){
  'use strict';

  /* ---------- utilidades ---------- */
  function uid(){ return window.APPIAuth && window.APPIAuth.userId ? (window.APPIAuth.userId() || 'local') : 'local'; }
  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }
  function hoyKey(){
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }
  function leerLS(clave, defecto){
    try{ var v = JSON.parse(localStorage.getItem(clave)); return v == null ? defecto : v; }catch(e){ return defecto; }
  }
  function nombrePila(){
    try{
      var activo = window.APPIAuth && window.APPIAuth.activePerson ? window.APPIAuth.activePerson() : null;
      var perfil = window.APPIAuth && window.APPIAuth.currentProfile ? window.APPIAuth.currentProfile() : null;
      var full = String((activo && activo.nombre) || (perfil && perfil.nombre) || '').trim();
      return full.split(/\s+/)[0] || '';
    }catch(e){ return ''; }
  }
  // La planilla trae "TRONCOSO, SEBASTIAN" a los gritos; en las tarjetas se
  // lee mejor "Sebastian Troncoso": nombre y apellido, en su orden (v323).
  function nombreLindo(n){
    var t = String(n == null ? '' : n).trim();
    if (!t) return '';
    if (t.indexOf(',') >= 0){
      var partes = t.split(',');
      t = ((partes[1] || '').trim() + ' ' + (partes[0] || '').trim()).trim();
    }
    if (t === t.toUpperCase()){
      t = t.toLowerCase().replace(/(^|[\s-])([a-záéíóúüñ])/g, function(m, a, b){ return a + b.toUpperCase(); });
    }
    return t;
  }

  /* ---------- el aliento del día ----------
     Muchas frases para que no se repitan seguido: se sortea entre las que
     todavía no salieron y recién cuando se usaron todas vuelve a barajar. */
  var FRASES = [
    'Hoy es un gran día para avanzar un paso más, {nombre}.',
    'Lo que hacés todos los días pesa más que lo que hacés de vez en cuando.',
    'Una llamada de hoy puede ser el ingreso del mes que viene.',
    'No hace falta hacerlo perfecto: hace falta hacerlo hoy.',
    'Tu constancia está construyendo algo que todavía no se ve entero.',
    'Cada demo que hacés es una semilla. Alguna siempre florece.',
    'El "no" de hoy te acerca al "sí" de mañana. Seguí.',
    'La diferencia entre soñar y lograr se llama agenda.',
    'Hoy alguien de tu equipo necesita esa palabra tuya. Mandala.',
    'Los grandes meses se arman con días comunes bien usados.',
    'Nadie llegó lejos sin un día como hoy: normal, pero trabajado.',
    'Tu ejemplo arrastra más que tus palabras. Mostrá cómo se hace.',
    'Si el día viene lento, hacé UNA cosa importante y ya ganaste.',
    'La gente no compra productos: te compra a vos. Cuidate.',
    'Retomá ese contacto que quedó frío. Hoy es buen día.',
    'El mes no se cierra el 30: se cierra hoy, un poquito.',
    'Quien pregunta vende. Hoy preguntá más.',
    'Tu racha vale oro: no la cortes hoy, {nombre}.',
    'Un equipo crece cuando su líder no se esconde. Aparecé.',
    'Hoy puede aparecer tu próximo líder. Tratá a todos como si lo fueran.',
    'La visita que estás postergando es la que más te va a agradecer.',
    'Cuando dudes, volvé a tu porqué. Ahí está la nafta.',
    'No compitas con nadie: superá a tu versión de ayer.',
    'Al miedo se le gana marcando el número igual.',
    'Vender es servir. Hoy salí a servir y las ventas vienen solas.',
    'Un mensaje corto y sincero abre más puertas que mil excusas.',
    'Tus clientes de hoy son tus referidos de mañana. Mimalos.',
    'El Bonus no se gana el último día: se gana hoy.',
    'Si ya hiciste lo difícil, no te frenes en lo fácil.',
    'Hacé que hoy valga la pena contarse el domingo.',
    'La organización de tu semana es el sueldo de tu mes.',
    'Hay alguien esperando exactamente lo que vos ofrecés.',
    'Tomate 5 minutos y agendá. El resto del día te lo agradece.',
    'Las oportunidades no se pierden: las agarra otro. Agarrala vos.',
    'Hoy no hace falta motivación: hace falta empezar. Después viene sola.',
    'Cada persona nueva que conocés agranda tu mundo y tu negocio.',
    'Sé la persona que te hubiera gustado que te invite a esto.',
    'Un seguimiento a tiempo vale más que diez promesas.',
    'Tu escalera de sueños se sube con los escalones de hoy.',
    'El PB que falta está a una conversación de distancia.',
    'Que tu equipo hoy te vea cerca: un audio alcanza.',
    'Ordenar el Panel 10 minutos te devuelve horas de cabeza.',
    'A la primera demo del día le siguen las demás más fáciles.',
    'Hablá con una persona nueva hoy. Solo una. Cambia todo.',
    'No es suerte: es que nunca dejaste de aparecer.',
    'Los meses grandes empiezan con lunes chicos bien usados.',
    'Tu palabra tiene más llegada de la que creés. Usala hoy.',
    'Reactivar un cliente dormido es la venta más barata que existe.',
    'Hoy festejá lo que ya hiciste y después andá por más.',
    'El negocio crece al ritmo de tus conversaciones.',
    'Poné primera: el envión viene después del arranque.',
    'Una familia más cuidando su agua. Ese es el impacto de hoy.',
    'Si te caés siete veces, la octava llamada sale mejor.',
    'Lo urgente grita, lo importante construye. Hacé lo importante.',
    'Tu futuro yo está mirando lo que hacés hoy. Dale material.',
    'De a un contacto por vez se arma una red gigante.',
    'Las garantías vencen, las relaciones no. Cultivalas.',
    'Contale tu historia a alguien hoy. Las historias venden.',
    'El que muestra el plan dos veces por día no tiene meses malos.',
    'Sonreí antes de llamar: se escucha del otro lado.',
    'Hoy es un buen día para pedir un referido. Pedilo.',
    'La cultura se contagia: cargá tus PB y tu equipo te copia.',
    'Cuando el equipo te ve marcar, el equipo marca.',
    'Tu demo número cien empieza por la de hoy.',
    'Invitar no es molestar: es dar la posibilidad de elegir.',
    'Un café con un prospecto vale más que una tarde de redes.',
    'Medí tu día por conversaciones, no por horas.',
    'El seguimiento es donde se esconde la plata.',
    'Hacelo simple: contactar, mostrar, acompañar. Repetir.',
    'Tu energía de hoy es la publicidad de tu negocio.',
    'Si ayudás a dos de tu equipo hoy, tu mes se ayuda solo.',
    'Nadie se arrepiente de la llamada que sí hizo.',
    'Hoy hay alguien cumpliendo años: un saludo tuyo vale doble.',
    'Que la agenda mande y el ánimo obedezca.',
    'Un pasito hoy, otro mañana: así se llega a Directora.',
    'Las metas de papel se cumplen con zapatos gastados.',
    'Vos ya sabés qué hay que hacer. Hoy solo hay que hacerlo.',
    'La mejor hora para sembrar fue ayer. La segunda mejor es ahora.',
    'Tu equipo no necesita un jefe: necesita verte en acción.',
    'Cerrá el día pudiendo decir: hice lo que dependía de mí.',
    'Todo gran cheque empezó con un "hola, ¿cómo estás?".',
    'Hay 24 horas nuevas sobre la mesa. Son tuyas, {nombre}.',
    'No pares cuando estés cansado: pará cuando esté hecho.',
    'Hoy también se puede. Y vos lo sabés.'
  ];

  function fraseDelDia(){
    var clave = 'appi_tarjetas_frases_' + uid();
    var estado = leerLS(clave, {});
    var hoy = hoyKey();
    if (estado.dia === hoy && typeof estado.idx === 'number' && FRASES[estado.idx]) return FRASES[estado.idx];
    var usadas = Array.isArray(estado.usadas) ? estado.usadas : [];
    if (usadas.length >= FRASES.length) usadas = [];
    var libres = [];
    for (var i = 0; i < FRASES.length; i++) if (usadas.indexOf(i) < 0) libres.push(i);
    var idx = libres[Math.floor(Math.random() * libres.length)];
    usadas.push(idx);
    try{ localStorage.setItem(clave, JSON.stringify({ dia: hoy, idx: idx, usadas: usadas })); }catch(e){}
    return FRASES[idx];
  }

  /* ---------- fuentes de datos (todas a prueba de ausencias) ---------- */
  function contactosGestion(){
    try{
      if (window.APPIGestion && window.APPIGestion.state && Array.isArray(window.APPIGestion.state.contacts) && window.APPIGestion.state.contacts.length){
        return window.APPIGestion.state.contacts;
      }
      var cache = leerLS('appi_gestion_cache_v1_' + uid(), null);
      return cache && Array.isArray(cache.contacts) ? cache.contacts : [];
    }catch(e){ return []; }
  }
  function personasEquipo(){
    try{
      if (window.equipoData && Array.isArray(window.equipoData.personas)) return window.equipoData.personas;
      var data = leerLS('equipoData', null);
      return data && Array.isArray(data.personas) ? data.personas : [];
    }catch(e){ return []; }
  }
  function culturaMes(){
    try{
      var data = leerLS('cultura_crecimiento_v1', {});
      var d = new Date();
      var id = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
      var row = data[id] || {};
      var inv = Array.isArray(row.invitados) ? row.invitados.length : Number(row.invitados) || 0;
      return { pb: Number(row.pb) || 0, invitados: inv, metaPb: 15, metaInv: 2 };
    }catch(e){ return { pb: 0, invitados: 0, metaPb: 15, metaInv: 2 }; }
  }
  function pilaDe(n){
    try{ if (typeof window.nombreDePila === 'function'){ var v = window.nombreDePila(n); if (v) return v; } }catch(e){}
    var t = String(n == null ? '' : n).trim();
    if (t.indexOf(',') >= 0) t = (t.split(',')[1] || t.split(',')[0] || '').trim();
    t = t.split(/\s+/)[0] || '';
    return t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : '';
  }
  function abrirContacto(c){
    return function(){
      if (window.APPIGestion && window.APPIGestion.abrirContacto) window.APPIGestion.abrirContacto(c.id);
      else if (typeof window.openMiGestion === 'function') window.openMiGestion();
    };
  }
  function abrirEquipo(){
    if (typeof window.openEquipo === 'function') window.openEquipo();
    else if (typeof window.showView === 'function') window.showView('view-equipo');
  }
  function abrirCultura(){
    abrirEquipo();
    setTimeout(function(){
      var cult = document.getElementById('culturaWrap') || document.querySelector('.cultura-card');
      if (cult) try{ cult.scrollIntoView({ behavior: 'smooth', block: 'center' }); }catch(e){}
    }, 450);
  }
  function colaMensajes(id){
    try{
      if (window.APPIMensajes && typeof window.APPIMensajes.colaMotivo === 'function'){
        return window.APPIMensajes.colaMotivo(id) || [];
      }
    }catch(e){}
    return [];
  }
  function enLasDiez(u){
    try{
      if (window.APPIMensajes && typeof window.APPIMensajes.enJornada === 'function'){
        return window.APPIMensajes.enJornada(u);
      }
    }catch(e){}
    return true;
  }
  function topeHoy(){
    try{
      if (window.APPITel && window.APPITel.cuidado && window.APPITel.cuidado.estado){
        var e = window.APPITel.cuidado.estado('');
        if (e && e.tope) return e.tope;
      }
    }catch(e){}
    try{ if (window.APPIMensajes && window.APPIMensajes.CUPO_DIA) return window.APPIMensajes.CUPO_DIA; }catch(e){}
    return 10;
  }
  function usadosWA(){
    try{
      if (window.APPITel && window.APPITel.cuidado && window.APPITel.cuidado.estado){
        return window.APPITel.cuidado.estado('').usados || 0;
      }
    }catch(e){}
    return 0;
  }
  function quedanLinea(){ return Math.max(0, topeHoy() - usadosWA()); }
  function partidoDe(){
    try{
      if (window.APPIMensajes && window.APPIMensajes.partidoHoy) return window.APPIMensajes.partidoHoy();
    }catch(e){}
    return { total: 0, hechas: 0, hay: false, ganado: false };
  }
  function rachaDe(){
    try{
      if (window.APPIMensajes && window.APPIMensajes.rachaGanados) return window.APPIMensajes.rachaGanados() || 0;
    }catch(e){}
    return 0;
  }
  function textoMarcador(){
    var p = partidoDe();
    if (p.ganado) return 'Hoy ganaste';
    if (p.hay) return 'Hoy ' + p.hechas + ' / ' + p.total;
    return 'Hoy';
  }
  function textoSubMarcador(){
    var n = rachaDe();
    if (n > 1) return 'venís ' + n + ' días ganados';
    if (n === 1) return '1 día ganado';
    var p = partidoDe();
    if (p.hay && !p.ganado) return 'partido de hoy';
    return '';
  }
  function referidosPedidosMes(){
    var d = new Date();
    var clave = 'appi_referidos_mes_' + uid() + '_' + d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
    var set = leerLS(clave, []);
    return { clave: clave, set: Array.isArray(set) ? set : [] };
  }
  function marcarReferidoPedido(tel){
    var st = referidosPedidosMes();
    var n = String(tel || '').replace(/\D/g,'');
    if (!n || st.set.indexOf(n) >= 0) return;
    st.set.push(n);
    try{ localStorage.setItem(st.clave, JSON.stringify(st.set)); }catch(e){}
  }
  function colaCanje(){ return colaMensajes('renovacion').filter(enLasDiez); }
  var RINNOVA_DESDE = '2026-08-26';
  var RINNOVA_HASTA = '2026-08-30';
  var LINK_RINNOVA = 'https://www.youtube.com/watch?v=lM2XjEVCPFI';
  function ventanaRinnova(){
    var h = hoyKey();
    return h >= RINNOVA_DESDE && h <= RINNOVA_HASTA;
  }
  function listaUsuariosHome(){
    try{
      if (typeof window.usuariosTodosActual === 'function'){
        var vivos = window.usuariosTodosActual() || [];
        if (vivos.length) return vivos;
      }
    }catch(e){}
    if (Array.isArray(window.usuariosU) && window.usuariosU.length) return window.usuariosU;
    var raw = leerLS('usuarios_garantias', []);
    return Array.isArray(raw) ? raw : [];
  }
  function esDucha(u){
    // En la planilla viene abreviado: DUCH PLA, PSA DUCH, DUCH MA, DUCHA II…
    return /duch/i.test(String((u && u.producto) || ''));
  }
  function rinnovaPedidos(){
    var clave = 'appi_ducha_rinnova_v1_' + uid();
    var set = leerLS(clave, []);
    return { clave: clave, set: Array.isArray(set) ? set : [] };
  }
  function marcarRinnovaPedido(tel){
    var st = rinnovaPedidos();
    var n = String(tel || '').replace(/\D/g, '');
    if (!n || st.set.indexOf(n) >= 0) return;
    st.set.push(n);
    try{ localStorage.setItem(st.clave, JSON.stringify(st.set)); }catch(e){}
  }
  function textoRinnova(u){
    var p = window.APPIMensajes && window.APPIMensajes.mensajeMantenimiento
      ? window.APPIMensajes.mensajeMantenimiento('mant_ducha_rinnova')
      : null;
    if (p && window.APPIMensajes.completar) return window.APPIMensajes.completar(p.texto, u);
    var nombre = pilaDe(u && (u.usuario || u.nombre));
    return 'Hola ' + (nombre || '') + '! 😊\n\nAhora nos renovamos y salió Rinnova.\n\n' + LINK_RINNOVA;
  }
  function colaDuchaRinnova(){
    if (!ventanaRinnova()) return [];
    var st = rinnovaPedidos();
    return listaUsuariosHome().filter(function(u){
      if (!esDucha(u) || !enLasDiez(u)) return false;
      var tel = telDeUsuario(u);
      return tel && st.set.indexOf(tel) < 0 && st.set.indexOf(String(tel).replace(/\D/g, '')) < 0;
    });
  }
  function mandarRinnovaA(u){
    return function(){
      var nombre = pilaDe(u.usuario || u.nombre);
      var tel = telDeUsuario(u);
      var abierto = false;
      if (window.APPITel && window.APPITel.abrir && tel){
        abierto = !!window.APPITel.abrir(tel, textoRinnova(u), nombre, u);
      }
      if (abierto){
        marcarRinnovaPedido(tel);
        if (mazo){ mazo.tarjetas = armarTarjetas(); pintar(); }
      }
    };
  }
  function telDeUsuario(u){
    var crudo = (u && (u.telf || u.tel || u.telefono)) || '';
    if (window.APPITel && window.APPITel.primeroValido) return window.APPITel.primeroValido(crudo) || '';
    return String(crudo).replace(/\D/g, '');
  }
  function colaVigentesParaReferido(){
    var st = referidosPedidosMes();
    return colaMensajes('checkin').filter(function(u){
      if (!enLasDiez(u)) return false;
      var tel = telDeUsuario(u);
      return tel && st.set.indexOf(tel) < 0;
    });
  }
  function prospectosEquipo(){
    return contactosGestion().filter(function(c){
      if (!c || ['convertido','no_interesado'].indexOf(c.estado) >= 0) return false;
      var interes = String(c.interes || '').toLowerCase();
      if (interes.indexOf('negocio') >= 0 || interes.indexOf('oportunidad') >= 0) return true;
      return c.tipo === 'referido' && c.estado === 'nuevo';
    });
  }
  function pedirReferidoA(u){
    return function(){
      var nombre = pilaDe(u.usuario || u.nombre);
      var tel = telDeUsuario(u);
      var texto = 'Hola ' + (nombre || '') + '! ¿Cómo andás? 😊\n\nTe escribo porque estoy armando un grupo chico de personas que quieren cuidar el agua de su casa.\n\n¿Se te ocurre alguien (familia, vecinos, laburo) a quien le vendría bien que le cuente?\n\nCon un nombre y un teléfono me alcanza. ¡Gracias!';
      var abierto = false;
      if (window.APPITel && window.APPITel.abrir && tel){
        abierto = !!window.APPITel.abrir(tel, texto, nombre, u);
      } else if (window.APPIMensajes && window.APPIMensajes.mandar){
        window.APPIMensajes.mandar('saludo', u);
      } else if (typeof window.showView === 'function') window.showView('view-usuarios');
      if (abierto) marcarReferidoPedido(tel);
    };
  }
  function mejorAccionHoy(){
    var hoy = hoyKey();
    var cs = contactosGestion();
    var pres = cs.filter(function(c){
      return c && c.estado === 'presentacion' && c.proximo_contacto && c.proximo_contacto <= hoy;
    }).sort(function(a,b){ return String(a.proximo_contacto_hora || '').localeCompare(String(b.proximo_contacto_hora || '')); });
    if (pres[0]) return {
      motor: 'venta', tipo: 'presentacion', persona: pres[0],
      titulo: 'Hoy cerrás con ' + (pilaDe(pres[0].nombre) || 'tu presentación'),
      detalle: 'Tenés una presentación. Es la plata del mes: 30 demos, 10 cierres.',
      cta: 'Ir con ' + (pilaDe(pres[0].nombre) || 'ella'),
      go: abrirContacto(pres[0])
    };
    var canjes = quedanLinea() ? colaCanje() : [];
    if (canjes[0]) return {
      motor: 'canje', tipo: 'canje', persona: canjes[0],
      titulo: 'Canje listo: ' + (nombreLindo(canjes[0].usuario) || 'un cliente'),
      detalle: 'Ya conoce el producto. El Plan Canje es la venta más fácil entre tus usuarios.',
      cta: 'Escribirle ahora',
      go: function(){
        if (window.APPIMensajes && window.APPIMensajes.mandar) window.APPIMensajes.mandar('renovacion', canjes[0]);
        else if (typeof window.showView === 'function') window.showView('view-usuarios');
      }
    };
    var nuevos = cs.filter(function(c){ return c && c.estado === 'nuevo'; })
      .sort(function(a,b){ return new Date(a.created_at || 0) - new Date(b.created_at || 0); });
    if (nuevos[0]) return {
      motor: 'venta', tipo: 'nuevo', persona: nuevos[0],
      titulo: 'Escribile a ' + (pilaDe(nuevos[0].nombre) || 'tu nuevo contacto'),
      detalle: 'Las primeras 24 horas pesan más que una semana entera.',
      cta: 'Abrir la ficha',
      go: abrirContacto(nuevos[0])
    };
    var bonus = [];
    try{ if (typeof window.personasOportunidadBonus === 'function') bonus = window.personasOportunidadBonus() || []; }catch(e){}
    if (bonus[0]) return {
      motor: 'equipo', tipo: 'bonus', persona: bonus[0],
      titulo: (nombreLindo(bonus[0].nombre) || 'Alguien de tu red') + ' está a un paso del Bonus',
      detalle: '12 PB personales + un patrocinio de 9 PB. Acompañalo esta semana.',
      cta: 'Ir a Mi Equipo',
      go: abrirEquipo
    };
    var cul = culturaMes();
    if (cul.invitados < cul.metaInv){
      var prospecto = prospectosEquipo()[0];
      if (prospecto) return {
        motor: 'equipo', tipo: 'invitar', persona: prospecto,
        titulo: 'Invitá a ' + (pilaDe(prospecto.nombre) || 'esta persona'),
        detalle: 'Te faltan ' + (cul.metaInv - cul.invitados) + ' invitado' + (cul.metaInv - cul.invitados === 1 ? '' : 's') + ' para la Cultura del mes.',
        cta: 'Ir con ' + (pilaDe(prospecto.nombre) || 'esa persona'),
        go: abrirContacto(prospecto)
      };
    }
    var segs = cs.filter(function(c){
      return c && c.estado === 'seguimiento' && c.proximo_contacto && c.proximo_contacto <= hoy;
    });
    if (segs[0]) return {
      motor: 'venta', tipo: 'seguimiento', persona: segs[0],
      titulo: 'Retomá a ' + (pilaDe(segs[0].nombre) || 'ese seguimiento'),
      detalle: 'El seguimiento es donde se esconde la plata.',
      cta: 'Ir con ' + (pilaDe(segs[0].nombre) || 'esa persona'),
      go: abrirContacto(segs[0])
    };
    var refs = quedanLinea() ? colaVigentesParaReferido() : [];
    if (refs[0]) return {
      motor: 'equipo', tipo: 'referido', persona: refs[0],
      titulo: 'Pedile un nombre a ' + (pilaDe(refs[0].usuario) || 'un cliente'),
      detalle: 'Tus clientes de hoy son tus referidos de mañana. Un nombre alcanza.',
      cta: 'Pedir el nombre',
      go: pedirReferidoA(refs[0])
    };
    return null;
  }

  /* ---------- las tarjetas por categoría ---------- */
  function tarjetaEspecial(){
    var nombre = nombrePila();
    var frase = fraseDelDia().replace('{nombre}', nombre || 'campeón/a');
    var chips = [];
    try{
      var cul = culturaMes();
      chips.push('💎 ' + String(cul.pb).replace('.', ',') + ' / ' + cul.metaPb + ' PB');
      chips.push('🤝 ' + cul.invitados + ' / ' + cul.metaInv + ' invitados');
    }catch(e){}
    try{
      if (window.APPIMensajes && window.APPIMensajes.resumenHoy){
        var r = window.APPIMensajes.resumenHoy();
        if (r.total) chips.push('✓ ' + r.hechas + ' / ' + r.total);
      }
    }catch(e){}
    try{
      if (window.APPITel && window.APPITel.cuidado && window.APPITel.cuidado.estado){
        var linea = window.APPITel.cuidado.estado('');
        chips.push('💬 ' + linea.usados + ' / ' + linea.tope + ' hoy');
      }
    }catch(e){}
    return {
      cat: 'especial', icono: '💙', kicker: 'Para vos' + (nombre ? ', ' + nombre : ''),
      titulo: 'Tu impulso de hoy',
      html: '<div class="ht-esp-centro"><span class="ht-esp-comilla">“</span>' +
            '<p class="ht-frase ht-esp-frase">' + esc(frase) + '</p></div>' +
            (chips.length ? '<div class="ht-chips">' + chips.map(function(c){ return '<span>' + esc(c) + '</span>'; }).join('') + '</div>' : '') +
            '<span class="ht-esp-marca">💙</span>',
      cta: null
    };
  }

  function tarjetaHoyConviene(){
    var a = mejorAccionHoy();
    if (!a) return null;
    var motor = a.motor === 'venta' ? 'Venta' : a.motor === 'canje' ? 'Plan Canje' : 'Equipo';
    return {
      cat: 'hoy', icono: '⚡', kicker: 'Hoy te conviene · ' + motor,
      titulo: a.titulo,
      html: '<p class="ht-frase">' + esc(a.detalle) + '</p>',
      cta: { label: a.cta, go: a.go }
    };
  }

  function tarjetaCanje(){
    if (!quedanLinea()) return null;
    var lista = colaCanje();
    if (!lista.length) return null;
    var filas = [], items = [];
    lista.slice(0, 3).forEach(function(u){
      filas.push('<li>🔄 <b>' + esc(nombreLindo(u.usuario)) + '</b> · canje listo</li>');
      items.push(function(){
        if (window.APPIMensajes && window.APPIMensajes.mandar) window.APPIMensajes.mandar('renovacion', u);
        else if (typeof window.showView === 'function') window.showView('view-usuarios');
      });
    });
    if (lista.length > 3){
      filas.push('<li>… y ' + (lista.length - 3) + ' más</li>');
      items.push(function(){
        if (typeof window.showView === 'function') window.showView('view-usuarios');
        setTimeout(function(){ try{ window.APPIMensajes.abrirFila('renovacion'); }catch(e){} }, 480);
      });
    }
    return {
      cat: 'canje', icono: '🔄', kicker: 'Plan Canje',
      titulo: lista.length === 1 ? 'Hay 1 equipo para canjear' : 'Hay ' + lista.length + ' equipos para canjear',
      html: '<ul class="ht-lista">' + filas.join('') + '</ul><p class="ht-nota">Ya conocen el producto. Un toque y sale el mensaje del canje.</p>',
      items: items,
      cta: { label: 'Escribirle al primero', go: items[0] }
    };
  }

  function tarjetaJornada(){
    var hoy = hoyKey();
    var lista = contactosGestion().filter(function(c){
      return c && ['seguimiento','presentacion'].indexOf(c.estado) >= 0 && c.proximo_contacto && c.proximo_contacto <= hoy;
    });
    if (!lista.length) return null;
    var ficha = function(c){ return function(){
      if (window.APPIGestion && window.APPIGestion.abrirContacto) window.APPIGestion.abrirContacto(c.id);
      else if (typeof window.openMiGestion === 'function') window.openMiGestion();
    }; };
    var filas = [], items = [];
    lista.slice(0, 3).forEach(function(c){
      filas.push('<li>' + (c.estado === 'presentacion' ? '🎤 ' : '📞 ') + esc(c.nombre || 'Sin nombre') +
                 (c.proximo_contacto < hoy ? ' <i>(atrasado)</i>' : '') + '</li>');
      items.push(ficha(c));
    });
    if (lista.length > 3){
      filas.push('<li>… y ' + (lista.length - 3) + ' más</li>');
      items.push(function(){ if (typeof window.openMiGestion === 'function') window.openMiGestion(); });
    }
    var primero = String(lista[0].nombre || '').split(/\s+|,/)[0] || 'la primera';
    return {
      cat: 'jornada', icono: '📅', kicker: 'Tu jornada',
      titulo: lista.length === 1 ? '1 contacto te espera hoy' : lista.length + ' contactos te esperan hoy',
      html: '<ul class="ht-lista">' + filas.join('') + '</ul><p class="ht-nota">Tocá a la persona y se abre su ficha, lista para escribirle o llamarla.</p>',
      items: items,
      cta: { label: 'Ir con ' + primero, go: items[0] }
    };
  }

  function tarjetaOportunidades(){
    try{
      if (typeof window.personasOportunidadBonus !== 'function') return null;
      var gente = window.personasOportunidadBonus() || [];
      if (!gente.length) return null;
      var pilaB = function(n){
        try{ if (typeof window.nombreDePila === 'function'){ var v = window.nombreDePila(n); if (v) return v; } }catch(e){}
        var t = String(n || '').trim();
        if (t.indexOf(',') >= 0) t = (t.split(',')[1] || t.split(',')[0]);
        return (t.trim().split(/\s+/)[0] || '');
      };
      var abrirEquipo = function(){ if (typeof window.openEquipo === 'function') window.openEquipo(); else if (typeof window.showView === 'function') window.showView('view-equipo'); };
      var telDeB = function(p){ var c = p.tel || p.telefono || p.telf || ''; var v = window.APPITel && window.APPITel.primeroValido ? window.APPITel.primeroValido(c) : ''; return v || c; };
      var telValidoB = function(p){ var t = telDeB(p); return !!(t && window.APPITel && window.APPITel.esValido(t)); };
      var proponer = function(p){ return function(){
        var pb = String(Number(p.pnAct || p.pb || 0)).replace('.', ',');
        if (telValidoB(p)){
          window.APPITel.abrir(telDeB(p), 'Hola ' + pilaB(p.nombre) + '! 😊 Vi que ya estás en ' + pb + ' PB… ¡a nada del Bonus! ¿Te ayudo a llegar? Podemos invitar a alguien y trabajarlo juntos esta semana. 💪', pilaB(p.nombre));
        } else if (window.APPIDialog && window.APPIDialog.alert){
          // Sin teléfono en la planilla, decirlo de frente (v322).
          if (window.APPITel && window.APPITel.avisarInvalido) window.APPITel.avisarInvalido(telDeB(p), pilaB(p.nombre), p);
          else if (window.APPIDialog && window.APPIDialog.alert) window.APPIDialog.alert((pilaB(p.nombre) || 'Esta persona') + ' no tiene un teléfono válido cargado en la planilla de Línea Descendente. Cuando subas una planilla con su número, el mensaje sale a un toque.', { title: 'Sin teléfono en la planilla', icon: '📵' });
        } else abrirEquipo();
      }; };
      var filas = [], items = [];
      gente.slice(0, 3).forEach(function(p){
        var pb = Number(p.pnAct || p.pb || 0);
        filas.push('<li>🎯 <b>' + esc(nombreLindo(p.nombre)) + '</b> está en ' + String(pb).replace('.', ',') + ' PB' + (telValidoB(p) ? '' : ' <i>sin teléfono</i>') + '</li>');
        items.push(proponer(p));
      });
      return {
        cat: 'oportunidades', icono: '🎯', kicker: 'Oportunidades',
        titulo: gente.length === 1 ? 'Un Bonus al alcance de la mano' : gente.length + ' Bonus al alcance de la mano',
        html: '<ul class="ht-lista">' + filas.join('') + '</ul><p class="ht-nota">Tocá a la persona y sale la propuesta por WhatsApp.</p>',
        items: items,
        cta: { label: 'Ir a Mi Equipo', go: abrirEquipo }
      };
    }catch(e){ return null; }
  }

  function tarjetaCumples(){
    var hoy = new Date(), dia = hoy.getDate(), mes = hoy.getMonth() + 1;
    var equipo = personasEquipo().filter(function(p){
      if (!p || !p.cumple) return false;
      var partes = String(p.cumple).split('-');
      return partes.length >= 3 && parseInt(partes[1]) === mes && parseInt(partes[2]) === dia;
    });
    var clientes = [];
    try{
      if (window.APPIMensajes && window.APPIMensajes.deHoy){
        window.APPIMensajes.deHoy().forEach(function(g){
          if (g.motivo && g.motivo.id === 'cumple') clientes = g.gente;
        });
      }
    }catch(e){}
    var total = equipo.length + clientes.length;
    if (!total) return null;

    var pila = function(n){
      try{ if (typeof window.nombreDePila === 'function'){ var v = window.nombreDePila(n); if (v) return v; } }catch(e){}
      var t = String(n || '').trim();
      if (t.indexOf(',') >= 0) t = (t.split(',')[1] || t.split(',')[0]);
      t = t.trim().split(/\s+/)[0] || '';
      return t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : '';
    };
    var abrirEquipo = function(){ if (typeof window.openEquipo === 'function') window.openEquipo(); else if (typeof window.showView === 'function') window.showView('view-equipo'); };
    var telDe = function(p){ var c = p.tel || p.telefono || p.telf || ''; var v = window.APPITel && window.APPITel.primeroValido ? window.APPITel.primeroValido(c) : ''; return v || c; };
    var telValido = function(p){ var t = telDe(p); return !!(t && window.APPITel && window.APPITel.esValido(t)); };
    // Sin teléfono en la planilla no hay a quién marcarle: mejor decirlo de
    // frente que mandar a otra pantalla en silencio (v322).
    var avisarSinTelefono = function(p){
      var nombre = pila(p.nombre) || 'Esta persona';
      if (window.APPIDialog && window.APPIDialog.alert){
        if (window.APPITel && window.APPITel.avisarInvalido) window.APPITel.avisarInvalido(telDe(p), nombre, p);
        else if (window.APPIDialog && window.APPIDialog.alert) window.APPIDialog.alert(nombre + ' no tiene un teléfono válido cargado en la planilla de Línea Descendente. Cuando subas una planilla con su número, el saludo sale a un toque.', { title: 'Sin teléfono en la planilla', icon: '📵' });
      } else abrirEquipo();
    };
    // Saludo directo: a la persona del equipo la saluda APPITel con el mensaje
    // de cumpleaños; al cliente lo saluda la plantilla de Mensajes, que además
    // deja marcada la ✓ de la acción del día.
    var saludarEquipo = function(p){ return function(){
      if (telValido(p)){
        window.APPITel.abrir(telDe(p), '¡Feliz cumpleaños, ' + pila(p.nombre) + '! 🎂🎉\n\nTe mando un saludo grande en tu día. Que lo disfrutes mucho.\n\n¡Un abrazo!', pila(p.nombre));
      } else avisarSinTelefono(p);
    }; };
    var saludarCliente = function(u){ return function(){
      if (window.APPIMensajes && window.APPIMensajes.mandar) window.APPIMensajes.mandar('cumple', u);
      else if (typeof window.showView === 'function') window.showView('view-usuarios');
    }; };

    var filas = [], items = [];
    equipo.slice(0, 2).forEach(function(p){
      filas.push('<li>🎂 <b>' + esc(nombreLindo(p.nombre)) + '</b> · de tu equipo' + (telValido(p) ? '' : ' <i>sin teléfono</i>') + '</li>');
      items.push(saludarEquipo(p));
    });
    clientes.slice(0, 2).forEach(function(u){
      filas.push('<li>🎂 <b>' + esc(nombreLindo(u.usuario)) + '</b> · cliente</li>');
      items.push(saludarCliente(u));
    });
    if (total > 4){
      filas.push('<li>… y más cumpleaños</li>');
      items.push(clientes.length > 2 ? function(){ if (typeof window.showView === 'function') window.showView('view-usuarios'); } : abrirEquipo);
    }
    // El botón grande lleva a la lista de cumpleaños del mes en Mi Equipo:
    // se abre la pantalla y se hace scroll hasta la lista (v325).
    var verCumplesDelMes = function(){
      abrirEquipo();
      var intentos = 0;
      (function buscar(){
        var lista = document.getElementById('bdayListWrap') || document.querySelector('.bday-list');
        if (lista){ try{ lista.scrollIntoView({ behavior: 'smooth', block: 'start' }); }catch(e){ lista.scrollIntoView(); } return; }
        if (++intentos < 10) setTimeout(buscar, 300);
      })();
    };
    return {
      cat: 'cumples', icono: '🎂', kicker: 'Cumpleaños',
      titulo: total === 1 ? 'Hoy hay un cumpleaños' : 'Hoy hay ' + total + ' cumpleaños',
      html: '<ul class="ht-lista">' + filas.join('') + '</ul><p class="ht-nota">Tocá a la persona y sale el saludo por WhatsApp.</p>',
      items: items,
      cta: { label: 'Revisar los cumpleaños del mes', go: verCumplesDelMes }
    };
  }

  function parseAlta(p){
    var s = String((p && p.alta) || '').trim();
    var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    return { y: +m[1], mo: +m[2], d: +m[3], iso: m[0] };
  }
  function fechaAltaTxt(a){
    if (!a) return '—';
    return String(a.d).padStart(2,'0') + '/' + String(a.mo).padStart(2,'0') + '/' + a.y;
  }
  function personasAReempadronar(){
    var hoy = new Date();
    var mes = hoy.getMonth() + 1;
    var anio = hoy.getFullYear();
    return personasEquipo().filter(function(p){
      var a = parseAlta(p);
      if (!a) return false;
      if (a.mo !== mes) return false;
      if (a.y >= anio) return false;
      return true;
    }).sort(function(x,y){
      return String(x.nombre||'').localeCompare(String(y.nombre||''), 'es', {sensitivity:'base'});
    });
  }
  function textoRequisitosReemp(){
    return 'La Solicitud de Distribución Independiente que firmaste al ingresar al Negocio PSA tiene un año de vigencia. La renovación o reempadronamiento *no es automática*. Cada año, en el mes que hiciste tu ingreso, deberás presentar nuevamente la Solicitud con fotocopia de tu DNI y haber realizado el requisito de reempadronamiento.\n\n' +
      '*¿Cuál es el requisito para reempadronarme?*\n' +
      'Desde el 1° de julio de 2022:\n\n' +
      '1. Cumplir con el mínimo de *1 PB personal* o *1 ingreso personal* durante el mes de reempadronamiento o durante alguno de los últimos tres meses anteriores.\n\n' +
      '2. Presentar en formato físico en tu Centro PSA:\n' +
      '• Solicitud de Distribución Independiente PSA firmada de forma manuscrita (frente y dorso) por el titular, por el socio (si corresponde) y por el Patrocinante.\n' +
      '• Fotocopia del DNI vigente del titular y socio (si corresponde).\n' +
      '• Fotocopia de un servicio del domicilio (no excluyente).\n\n' +
      'Cualquier otra consulta: tu Centro PSA o cuidadodelamarca@psa.com.ar';
  }
  function reempYm(){
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
  }
  function reempClaves(){
    var ym = reempYm();
    var keys = ['appi_reemp_ok_v1_' + ym, 'appi_reemp_ok_v1_local_' + ym];
    var id = uid();
    if (id) keys.push('appi_reemp_ok_v1_' + id + '_' + ym);
    return keys;
  }
  function reempId(p){
    var nom = String((p && p.nombre) || '').trim().toLowerCase();
    var alta = String((p && p.alta) || '').trim();
    var cod = String((p && p.codigo) || '').trim();
    if (cod && nom) return cod + '|' + nom + '|' + alta;
    if (nom && alta) return nom + '|' + alta;
    if (cod) return cod;
    return nom || String((p && p.id) || '').trim();
  }
  function reempIdsDe(p){
    var nom = String((p && p.nombre) || '').trim();
    var nomL = nom.toLowerCase();
    var alta = String((p && p.alta) || '').trim();
    var cod = String((p && p.codigo) || '').trim();
    var id = p && p.id != null ? String(p.id) : '';
    var keys = [];
    function add(k){ if (k && keys.indexOf(k) < 0) keys.push(k); }
    add(reempId(p));
    add(cod);
    add(nom);
    add(id);
    add(nomL + '|' + alta);
    return keys;
  }
  function reempEnviados(){
    var all = [];
    reempClaves().forEach(function(k){
      var set = leerLS(k, []);
      if (!Array.isArray(set)) return;
      set.forEach(function(x){ if (x && all.indexOf(x) < 0) all.push(x); });
    });
    return all;
  }
  function reempGuardar(set){
    reempClaves().forEach(function(k){
      try{ localStorage.setItem(k, JSON.stringify(set)); }catch(e){}
    });
  }
  function reempMarcar(p){
    var set = reempEnviados();
    var hubo = false;
    reempIdsDe(p).forEach(function(id){
      if (id && set.indexOf(id) < 0){ set.push(id); hubo = true; }
    });
    if (hubo) reempGuardar(set);
  }
  function reempYa(p){
    var set = reempEnviados();
    return reempIdsDe(p).some(function(k){ return set.indexOf(k) >= 0; });
  }
  function pintarVerdesReemp(el){
    if (!el) return;
    var set = reempEnviados();
    el.querySelectorAll('[data-reemp-id]').forEach(function(li){
      var id = li.getAttribute('data-reemp-id') || '';
      if (id && set.indexOf(id) >= 0) li.classList.add('ht-hecho');
    });
  }
  function telDeEquipo(p){
    var c = (p && (p.tel || p.telefono || p.telf)) || '';
    var v = window.APPITel && window.APPITel.primeroValido ? window.APPITel.primeroValido(c) : '';
    return v || c;
  }
  function saludoHoraReemp(){
    var h = new Date().getHours();
    if (h >= 6 && h < 12) return 'Buenos días';
    if (h >= 12 && h < 20) return 'Buenas tardes';
    return 'Buenas noches';
  }
  function siguientePlantillaReemp(){
    var clave = 'appi_reemp_plantillas_v1_' + uid();
    var estado = leerLS(clave, {});
    var usadas = Array.isArray(estado.usadas) ? estado.usadas : [];
    var n = 10;
    if (usadas.length >= n) usadas = [];
    var libres = [];
    for (var i = 0; i < n; i++) if (usadas.indexOf(i) < 0) libres.push(i);
    var idx = libres[Math.floor(Math.random() * libres.length)];
    usadas.push(idx);
    try{ localStorage.setItem(clave, JSON.stringify({ usadas: usadas })); }catch(e){}
    return idx;
  }
  function mensajeReempPersona(p, mesNom){
    var pila = pilaDe(p.nombre) || '';
    var saludo = saludoHoraReemp();
    var mes = mesNom;
    var req = textoRequisitosReemp();
    var plantillas = [
      saludo + (pila ? ' ' + pila : '') + '! ¿Cómo andás? 😊\n\nTe escribo porque en *' + mes + '* te toca el reempadronamiento.\n\n' + req,
      'Hola' + (pila ? ' ' + pila : '') + '! ' + saludo + ' 😊\n\nPaso a recordarte que este mes (*' + mes + '*) hay que reempadronarse. No es automático.\n\n' + req,
      saludo + (pila ? ' ' + pila : '') + '!\n\nEn *' + mes + '* vence tu Solicitud de Distribución. Hay que renovarla en el Centro PSA.\n\n' + req,
      'Hola' + (pila ? ' ' + pila : '') + '! Te dejo el aviso del reempadronamiento de *' + mes + '*, así lo tenés a mano.\n\n' + req,
      saludo + (pila ? ' ' + pila : '') + '! ¿Todo bien?\n\nEste mes te corresponde reempadronar (el mes de tu ingreso). Te dejo qué hay que llevar.\n\n' + req,
      'Hola' + (pila ? ' ' + pila : '') + '! 😊\n\nUn recordatorio: la renovación no es automática. En *' + mes + '* hay que presentar de nuevo la Solicitud.\n\n' + req,
      saludo + (pila ? ' ' + pila : '') + '!\n\nPara no perder la distribución, en *' + mes + '* hay que reempadronarse. Te copio los requisitos.\n\n' + req,
      'Hola' + (pila ? ' ' + pila : '') + '! Te escribo por el reempadronamiento de *' + mes + '*.\n\nSi ya lo hiciste, ignorá este mensaje. Si no, esto es lo que piden:\n\n' + req,
      saludo + (pila ? ' ' + pila : '') + '! Te aviso con tiempo: *' + mes + '* es tu mes de reempadronamiento. Se presenta en el Centro PSA.\n\n' + req,
      'Hola' + (pila ? ' ' + pila : '') + '! ¿Cómo venís?\n\nTe dejo la info del reempadronamiento (vigencia anual, no se renueva sola).\n\n' + req
    ];
    return plantillas[siguientePlantillaReemp()];
  }
  function enviarReempadronar(lista, mesNom, anio){
    var n = lista.length;
    var msg = '📋 *Reempadronar · ' + mesNom.charAt(0).toUpperCase() + mesNom.slice(1) + ' ' + anio + '*\n';
    msg += n + (n === 1 ? ' persona' : ' personas') + '\n━━━━━━━━━━━━━━━\n';
    msg += '*Apellido, nombre - Categoría - Alta*\n\n';
    lista.forEach(function(p){
      var a = parseAlta(p);
      msg += String(p.nombre||'').trim() + ' - ' + (p.cat || '—') + ' - ' + fechaAltaTxt(a) + '\n';
    });
    msg += '\n━━━━━━━━━━━━━━━\n' + textoRequisitosReemp();
    msg += '\n\n━━━━━━━━━━━━━━━\nEnviado desde *APPI* 🚀';
    if (typeof window.enviarMensajeWhatsApp === 'function') window.enviarMensajeWhatsApp(msg, 'Reempadronar');
    else if (window.APPIWhatsApp && window.APPIWhatsApp.abrir) window.APPIWhatsApp.abrir('https://wa.me/?text=' + encodeURIComponent(msg));
  }
  function escribirReempA(p, mesNom){
    return function(li){
      var nombre = pilaDe(p.nombre) || 'Esta persona';
      var tel = telDeEquipo(p);
      var okTel = !!(tel && window.APPITel && window.APPITel.esValido && window.APPITel.esValido(tel));
      if (!okTel && tel && !window.APPITel) okTel = String(tel).replace(/\D/g,'').length >= 8;
      if (!okTel){
        if (window.APPITel && window.APPITel.avisarInvalido) window.APPITel.avisarInvalido(tel, nombre, p);
        else if (window.APPIDialog && window.APPIDialog.alert) window.APPIDialog.alert(nombre + ' no tiene un teléfono válido en la planilla.', { title: 'Sin teléfono', icon: '📵' });
        return;
      }
      var texto = mensajeReempPersona(p, mesNom);
      var abierto = false;
      if (window.APPITel && window.APPITel.abrir){
        abierto = !!window.APPITel.abrir(tel, texto, nombre);
      } else if (window.APPIWhatsApp && window.APPIWhatsApp.abrir){
        window.APPIWhatsApp.abrir('https://wa.me/' + String(tel).replace(/\D/g,'') + '?text=' + encodeURIComponent(texto));
        abierto = true;
      }
      if (abierto){
        reempMarcar(p);
        if (li && li.classList) li.classList.add('ht-hecho');
      }
    };
  }
  function tarjetaReempadronar(){
    var lista = personasAReempadronar();
    if (!lista.length) return null;
    var hoy = new Date();
    var MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    var mesNom = MESES[hoy.getMonth()];
    var anio = hoy.getFullYear();
    var n = lista.length;
    var filas = [];
    var items = [];
    lista.forEach(function(p){
      var a = parseAlta(p);
      var hecho = reempYa(p);
      filas.push('<li data-reemp-id="' + esc(reempId(p)) + '" class="' + (hecho ? 'ht-hecho' : '') + '">📝 <b>' + esc(p.nombre || '') + '</b> · ' + esc(p.cat || '—') + ' · alta ' + esc(fechaAltaTxt(a)) + '</li>');
      items.push(escribirReempA(p, mesNom));
    });
    return {
      cat: 'reempadronar', icono: '📝', kicker: 'Reempadronar',
      titulo: n === 1
        ? '1 persona para reempadronar en ' + mesNom
        : n + ' personas para reempadronar en ' + mesNom,
      html: '<ul class="ht-lista">' + filas.join('') + '</ul>' +
            '<p class="ht-nota">Tocá un nombre para escribirle. Mantené la tarjeta para enviar el listado.</p>',
      items: items,
      alMantener: function(){ enviarReempadronar(lista, mesNom, anio); },
      cta: null
    };
  }

  function tarjetaEquipo(){
    var cul = culturaMes();
    var faltaPb = Math.max(0, cul.metaPb - cul.pb);
    var faltaInv = Math.max(0, cul.metaInv - cul.invitados);
    if (!faltaPb && !faltaInv) return null;
    var dia = new Date().getDate();
    if (dia <= 3 && cul.pb === 0 && cul.invitados === 0) return null; // el mes recién arranca: sin reproches
    var partes = [];
    if (faltaPb) partes.push('<b>' + String(faltaPb).replace('.', ',') + ' PB</b>');
    if (faltaInv) partes.push('<b>' + faltaInv + ' invitado' + (faltaInv === 1 ? '' : 's') + '</b>');
    var prospecto = faltaInv ? prospectosEquipo()[0] : null;
    var ref = faltaInv ? colaVigentesParaReferido()[0] : null;
    var extra = '';
    if (prospecto) extra += '<ul class="ht-lista"><li>🌱 <b>' + esc(nombreLindo(prospecto.nombre)) + '</b> · para invitar</li></ul>';
    else if (ref) extra += '<ul class="ht-lista"><li>🌱 Pedile un nombre a <b>' + esc(nombreLindo(ref.usuario)) + '</b></li></ul>';
    return {
      cat: 'equipo', icono: '👥', kicker: 'Mi Equipo',
      titulo: faltaInv ? 'Sumá gente a tu equipo' : 'La Cultura del mes te está esperando',
      html: '<p class="ht-frase">Te falta' + (partes.length > 1 ? 'n' : '') + ' ' + partes.join(' y ') + ' para completar el mes.</p>' + extra +
            '<div class="ht-chips"><span>💎 ' + String(cul.pb).replace('.', ',') + ' / ' + cul.metaPb + '</span><span>🤝 ' + cul.invitados + ' / ' + cul.metaInv + '</span></div>',
      items: prospecto ? [abrirContacto(prospecto)] : (ref ? [pedirReferidoA(ref)] : null),
      cta: { label: prospecto ? 'Ir con ' + (pilaDe(prospecto.nombre) || 'esa persona') : (faltaInv ? 'Cargar un invitado' : 'Cargar mi avance'), go: prospecto ? abrirContacto(prospecto) : abrirCultura }
    };
  }

  function tarjetaPanel(){
    var hoy = hoyKey();
    var nuevos = contactosGestion().filter(function(c){ return c && c.estado === 'nuevo'; });
    var vencidos = contactosGestion().filter(function(c){
      return c && c.proximo_contacto && c.proximo_contacto < hoy && ['seguimiento','presentacion'].indexOf(c.estado) >= 0;
    });
    if (!nuevos.length && !vencidos.length) return null;
    var ficha = function(c){ return function(){
      if (window.APPIGestion && window.APPIGestion.abrirContacto) window.APPIGestion.abrirContacto(c.id);
      else if (typeof window.openMiGestion === 'function') window.openMiGestion();
    }; };
    var vistaHoy = function(){
      if (typeof window.openMiGestion === 'function') window.openMiGestion();
      setTimeout(function(){ try{ if (window.APPIGestion && window.APPIGestion.setView) window.APPIGestion.setView('hoy'); }catch(e){} }, 450);
    };
    var filas = [], items = [];
    nuevos.slice(0, 2).forEach(function(c){
      filas.push('<li>✨ <b>' + esc(c.nombre || 'Sin nombre') + '</b> · sin el primer contacto</li>');
      items.push(ficha(c));
    });
    if (nuevos.length > 2){ filas.push('<li>✨ … y ' + (nuevos.length - 2) + ' nuevos más</li>'); items.push(vistaHoy); }
    if (vencidos.length){ filas.push('<li>⏰ <b>' + vencidos.length + '</b> con la fecha pasada</li>'); items.push(vistaHoy); }
    return {
      cat: 'panel', icono: '📇', kicker: 'Panel de Contactos',
      titulo: 'Hay gente esperando tu mensaje',
      html: '<ul class="ht-lista">' + filas.join('') + '</ul><p class="ht-nota">Tocá a la persona y se abre su ficha. Las primeras 24 horas pesan más que una semana.</p>',
      items: items,
      cta: nuevos.length
        ? { label: 'Ir con ' + (String(nuevos[0].nombre || '').split(/\s+|,/)[0] || 'la primera'), go: items[0] }
        : { label: 'Ver los vencidos de hoy', go: vistaHoy }
    };
  }

  function tarjetaUsuarios(){
    try{
      if (!window.APPIMensajes || !window.APPIMensajes.resumenHoy) return null;
      var r = window.APPIMensajes.resumenHoy();
      if (!r.pendientes) return null;
      var alCarrusel = function(motivoId){ return function(){
        if (typeof window.showView === 'function') window.showView('view-usuarios');
        setTimeout(function(){ try{ window.APPIMensajes.abrirFila(motivoId); }catch(e){} }, 480);
      }; };
      var filas = [], items = [];
      (window.APPIMensajes.pendientes ? window.APPIMensajes.pendientes() : []).forEach(function(g){
        var n = g.gente.length;
        filas.push('<li>' + g.motivo.icono + ' <b>' + n + '</b> ' + esc(n === 1 ? g.motivo.uno : g.motivo.varios) + '</li>');
        items.push(alCarrusel(g.motivo.id));
      });
      return {
        cat: 'usuarios', icono: '💧', kicker: 'Usuarios',
        titulo: r.pendientes === 1
        ? 'Queda 1 de ' + r.total
        : 'Quedan ' + r.pendientes + ' de ' + r.total,
        html: '<ul class="ht-lista">' + filas.join('') + '</ul>' +
              '<div class="ht-chips"><span>✓ ' + r.hechas + '</span><span>✗ ' + r.noHechas + '</span><span>quedan ' + r.pendientes + '</span></div>' +
              '<p class="ht-nota">Tocá un motivo y se abre el carrusel para mandar y marcar ✓/✗.</p>',
        items: items,
        cta: { label: 'Ir a marcar', go: items[0] || function(){ if (typeof window.showView === 'function') window.showView('view-usuarios'); } }
      };
    }catch(e){ return null; }
  }

  function tarjetaMetodoEnvio(){
    try{
      if (window.APPITel && window.APPITel.cuidado && window.APPITel.cuidado.vioMetodo && window.APPITel.cuidado.vioMetodo()) return null;
    }catch(e){}
    var tope = 10;
    try{
      if (window.APPITel && window.APPITel.cuidado && window.APPITel.cuidado.TOPE) tope = window.APPITel.cuidado.TOPE;
    }catch(e){}
    var entendido = function(){
      try{
        if (window.APPITel && window.APPITel.cuidado && window.APPITel.cuidado.marcarMetodoVisto){
          window.APPITel.cuidado.marcarMetodoVisto();
        }
      }catch(e){}
      if (mazo){ mazo.tarjetas = armarTarjetas(); pintar(); }
    };
    return {
      cat: 'metodo', icono: '⚠️', kicker: 'Atención · tu WhatsApp',
      titulo: 'WhatsApp puede suspender tu línea',
      html: '<p class="ht-frase">Si le escribís a mucha gente el mismo mensaje, uno atrás del otro.</p>' +
            '<ol class="ht-pasos">' +
            '<li><b>Por eso, de a uno.</b> APPI te abre el chat. No es un envío masivo.</li>' +
            '<li><b>' + tope + ' personas distintas por día.</b> A la misma podés escribirle de nuevo.</li>' +
            '<li><b>Un minuto entre cada una.</b> Mañana otros ' + tope + '. En dos semanas, ' + (tope * 14) + ' — y tu número sigue vivo.</li>' +
            '</ol>',
      cta: { label: 'Entendido, cuido mi línea', go: entendido }
    };
  }

  function tarjetaGanaste(){
    var p = partidoDe();
    if (!p.ganado) return null;
    var n = rachaDe();
    var extra = n > 1 ? ' Venís ' + n + ' días ganados.' : '';
    return {
      cat: 'ganaste', icono: '✅', kicker: 'Partido de hoy',
      titulo: 'Hoy ganaste',
      html: '<p class="ht-frase">Mañana otros 10.' + extra + '</p>',
      cta: null
    };
  }

  function tarjetaLlegamos(){
    if (quedanLinea() > 0) return null;
    var tope = topeHoy();
    return {
      cat: 'llegamos', icono: '✅', kicker: 'Tope de WhatsApp',
      titulo: 'Hoy llegamos: ' + tope + ' de ' + tope,
      html: '<p class="ht-frase">Escribiste a ' + tope + ' personas distintas. Mañana otros ' + tope + '. Así WhatsApp no te toca la línea.</p>',
      cta: null
    };
  }

  function tarjetaDuchaRinnova(){
    if (!quedanLinea()) return null;
    var lista = colaDuchaRinnova();
    if (!lista.length) return null;
    var filas = [], items = [];
    lista.slice(0, 3).forEach(function(u){
      var prod = String(u.producto || '').trim();
      filas.push('<li>🚿 <b>' + esc(nombreLindo(u.usuario || u.nombre)) + '</b>' +
        (prod ? ' · ' + esc(prod) : '') + '</li>');
      items.push(mandarRinnovaA(u));
    });
    if (lista.length > 3){
      filas.push('<li>… y ' + (lista.length - 3) + ' más</li>');
      items.push(mandarRinnovaA(lista[3]));
    }
    return {
      cat: 'rinnova', icono: '🚿', kicker: 'PSA Ducha · 5 días',
      titulo: lista.length === 1 ? 'Mandale el video de Rinnova' : 'Mandales el video de Rinnova',
      html: '<img class="ht-foto" src="./img/rinnova-ducha.jpg" alt="">' +
            '<ul class="ht-lista">' + filas.join('') + '</ul>' +
            '<p class="ht-nota">Vigentes y vencidos. Un toque y sale el video. Hasta el 30 de agosto.</p>',
      items: items,
      cta: { label: 'Enviar a ' + (pilaDe(lista[0].usuario || lista[0].nombre) || 'la primera'), go: items[0] }
    };
  }

  function armarTarjetas(){
    var lista = [tarjetaEspecial()];
    try{ if (window.APPIMensajes && window.APPIMensajes.registrarPartido) window.APPIMensajes.registrarPartido(); }catch(e){}
    [tarjetaHoyConviene(), tarjetaGanaste(), tarjetaMetodoEnvio(), tarjetaLlegamos(), tarjetaDuchaRinnova(), tarjetaCanje(), tarjetaJornada(), tarjetaOportunidades(), tarjetaCumples(), tarjetaReempadronar(), tarjetaEquipo(), tarjetaPanel(), tarjetaUsuarios()].forEach(function(t){
      if (t) lista.push(t);
    });
    return lista;
  }
  function cuantasNovedades(){ return armarTarjetas().length - 1; } // la especial no cuenta como "pendiente"

  /* ---------- el mazo ---------- */
  var mazo = null; // { tarjetas, i }

  function css(){
    if (document.getElementById('htEstilos')) return;
    var st = document.createElement('style');
    st.id = 'htEstilos';
    st.textContent = [
      '#htOverlay{position:relative;margin:0 0 14px;padding:14px 12px 12px;border-radius:22px;background:linear-gradient(160deg,rgba(91,141,239,.09),rgba(160,107,255,.08));border:1px solid rgba(255,255,255,.7)}',
      'body.dark #htOverlay{background:linear-gradient(160deg,rgba(91,141,239,.13),rgba(160,107,255,.11));border-color:rgba(255,255,255,.08)}',
      '.ht-top{display:flex;align-items:center;gap:10px;padding:0 4px 10px}',
      '.ht-top b{font-size:14px;color:#30303d}.ht-top span{font-size:11px;color:#777887;font-weight:800;margin-left:auto;margin-right:2px}',
      '.ht-tope{display:block;font-size:10px;color:#777887;font-weight:800;letter-spacing:.2px}',
      'body.dark .ht-top b{color:#f2f2f7}',
      '.ht-centro{display:flex;flex-direction:column;align-items:center;gap:11px}',
      '.ht-deck{position:relative;width:100%;max-width:400px;height:min(56vh,440px);margin:0 auto}',
      '.ht-card{position:absolute;inset:0;display:flex;flex-direction:column;padding:18px 20px;border-radius:24px;background:linear-gradient(160deg,#ffffff,#f4f6ff);box-shadow:0 22px 60px rgba(10,12,40,.35);touch-action:pan-y;user-select:none;-webkit-user-select:none;cursor:grab;will-change:transform;transition:transform .32s cubic-bezier(.22,.9,.35,1),opacity .32s ease}',
      '.ht-card.demo{animation:htVaiven 1.5s ease .55s 1}',
      '@keyframes htVaiven{0%,100%{transform:none}22%{transform:translateX(34px) rotate(2.5deg)}60%{transform:translateX(-30px) rotate(-2.2deg)}}',
      '.ht-card.detras1{transform:translateY(15px) scale(.95);opacity:.75;pointer-events:none}',
      '.ht-card.detras2{transform:translateY(28px) scale(.9);opacity:.45;pointer-events:none}',
      '.ht-card.arrastre{transition:none;cursor:grabbing}',
      '.ht-card.volver{transition:transform .34s cubic-bezier(.28,1.45,.45,1)}',
      '.ht-card.vuela{transition:transform .46s cubic-bezier(.3,.7,.4,1),opacity .4s ease-out;opacity:0;pointer-events:none}',
      '.ht-cab{display:flex;align-items:center;gap:8px;margin-bottom:2px}',
      '.ht-cab .ht-ico{font-size:24px;line-height:1}',
      '.ht-card .ht-kicker{flex:1;min-width:0;color:#3d63c9;font-size:11.5px;font-weight:950;letter-spacing:.7px;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.ht-card h3{margin:9px 0 11px;color:#1d1d2c;font-size:23px;line-height:1.22;letter-spacing:-.4px}',
      '.ht-cuerpo{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;min-height:0;touch-action:pan-y}',
      '.ht-frase{margin:0;color:#41424f;font-size:17.5px;line-height:1.55;font-weight:700}',
      '.ht-lista{margin:0;padding:0;list-style:none;display:grid;gap:9px}',
      '.ht-lista li{display:flex;align-items:center;gap:8px;padding:13px 14px;border-radius:14px;background:rgba(91,141,239,.08);color:#33343f;font-size:15px;font-weight:750;cursor:pointer;transition:background .14s}',
      '.ht-lista li:hover{background:rgba(91,141,239,.16)}',
      '.ht-lista li::after{content:"›";margin-left:auto;color:#3d63c9;font-weight:900;font-size:17px}',
      '.ht-lista.ht-plain li{cursor:default}',
      '.ht-lista.ht-plain li::after{content:none}',
      '.ht-lista li.ht-hecho{background:rgba(58,208,164,.22);color:#146b54}',
      '.ht-lista li.ht-hecho::after{content:"✓";color:#168765}',
      'body.dark .ht-lista li.ht-hecho{background:rgba(58,208,164,.2);color:#d8f5e6}',
      'body.dark .ht-lista li.ht-hecho::after{color:#3ad0a4}',
      '.ht-lista li i{color:#c0392b;font-style:normal;font-size:12px;font-weight:900}',
      '.ht-nota{margin:12px 0 0;color:#8a8b98;font-size:13px;line-height:1.5}',
      '.ht-pasos{margin:12px 0 0;padding:0;list-style:none;display:grid;gap:8px}',
      '.ht-pasos li{padding:11px 13px;border-radius:14px;background:rgba(91,141,239,.08);color:#33343f;font-size:14.5px;line-height:1.4;font-weight:650}',
      '.ht-pasos li b{font-weight:900}',
      'body.dark .ht-pasos li{background:rgba(255,255,255,.07);color:#d4d5e2}',
      '.ht-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}',
      '.ht-chips span{padding:7px 12px;border-radius:999px;background:rgba(91,141,239,.1);color:#3d63c9;font-size:12.5px;font-weight:900}',
      '.ht-cta{margin-top:12px;min-height:52px;border:0;border-radius:15px;background:linear-gradient(135deg,#5b8def,#8b63e8);color:#fff;font:inherit;font-size:15px;font-weight:900;cursor:pointer}',
      '.ht-foto{display:block;width:100%;height:148px;object-fit:contain;background:#eef2f7;border-radius:16px;margin:0 0 12px}',
      /* La tarjeta especial se viste distinta: fondo pleno, frase grande y
         centrada, chips vidriosos y el corazón de marca de agua (v325). */
      '.ht-card.ht-esp{background:linear-gradient(150deg,#4f7df2,#8b63e8 55%,#a06bff);}',
      'body.dark .ht-card.ht-esp{background:linear-gradient(150deg,#3b5fc4,#6f4cc4 55%,#7e54d6)}',
      '.ht-card.ht-esp .ht-kicker{color:rgba(255,255,255,.9)}',
      '.ht-card.ht-esp h3{color:#fff;text-shadow:0 1px 6px rgba(20,20,60,.25)}',
      '.ht-card.ht-esp .ht-cuerpo{display:flex;flex-direction:column}',
      '.ht-esp-centro{margin:auto 0;position:relative;padding:4px 2px 0}',
      '.ht-esp-comilla{position:absolute;top:-14px;left:-4px;font-size:58px;line-height:1;color:rgba(255,255,255,.35);font-weight:900;pointer-events:none}',
      '.ht-esp-frase{margin:0;padding-left:14px;color:#fff;font-size:21px;line-height:1.45;font-weight:800;letter-spacing:-.2px;text-shadow:0 1px 8px rgba(20,20,60,.22)}',
      '.ht-card.ht-esp .ht-chips{margin-top:14px}',
      '.ht-card.ht-esp .ht-chips span{background:rgba(255,255,255,.18);color:#fff;border:1px solid rgba(255,255,255,.22)}',
      '.ht-esp-marca{position:absolute;right:10px;bottom:2px;font-size:74px;line-height:1;opacity:.16;pointer-events:none}',
      'body.dark .ht-card.ht-esp .ht-esp-frase{color:#fff}',
      '.ht-hint{text-align:center;color:#9a9ba8;font-size:10.5px;font-weight:800}',
      '.ht-card.ht-hoy{background:linear-gradient(160deg,#fffdf6,#fff3d6);border:2px solid #e8b84a;box-shadow:0 22px 60px rgba(180,130,20,.28)}',
      'body.dark .ht-card.ht-hoy{background:linear-gradient(160deg,#3a3218,#2c2818);border-color:#e8b84a}',
      '.ht-card.ht-hoy .ht-kicker{color:#a67c12}',
      '.ht-card.ht-hoy .ht-cta{background:linear-gradient(135deg,#e8b84a,#d4891a)}',
      '.ht-card.ht-alerta{background:linear-gradient(155deg,#fff4e0,#ffd7a8 55%,#ffc078);box-shadow:0 22px 60px rgba(180,70,0,.38);border:2px solid #f08a1a}',
      'body.dark .ht-card.ht-alerta{background:linear-gradient(155deg,#5a3208,#7a4010 55%,#9a4e12);border-color:#f0a040}',
      '.ht-card.ht-alerta .ht-kicker{color:#b04600}',
      'body.dark .ht-card.ht-alerta .ht-kicker{color:#ffc078}',
      '.ht-card.ht-alerta h3{color:#7a2e00}',
      'body.dark .ht-card.ht-alerta h3{color:#fff3e0}',
      '.ht-card.ht-alerta .ht-frase{color:#5c2e0a;font-size:15.5px;line-height:1.45}',
      'body.dark .ht-card.ht-alerta .ht-frase{color:#ffe0b8}',
      '.ht-card.ht-alerta .ht-pasos li{background:rgba(176,70,0,.12);color:#5c2e0a}',
      'body.dark .ht-card.ht-alerta .ht-pasos li{background:rgba(255,200,120,.12);color:#ffe8c8}',
      '.ht-card.ht-alerta .ht-cta{background:linear-gradient(135deg,#f08a1a,#e04a12);box-shadow:0 8px 20px rgba(200,70,10,.35)}',
      '.ht-card.ht-ganaste{background:linear-gradient(160deg,#f3fff8,#d8f5e6);border:2px solid #3ad0a4;box-shadow:0 22px 60px rgba(18,140,126,.22)}',
      'body.dark .ht-card.ht-ganaste{background:linear-gradient(160deg,#1a3328,#152820);border-color:#3ad0a4}',
      '.ht-card.ht-ganaste .ht-kicker{color:#178a6c}',
      'body.dark .ht-card.ht-ganaste .ht-kicker{color:#3ad0a4}',
      '.ht-card.ht-ganaste h3{color:#146b54}',
      'body.dark .ht-card.ht-ganaste h3{color:#d8f5e6}',
      'body.dark .ht-card{background:linear-gradient(160deg,#262838,#1f2130)}',
      'body.dark .ht-card h3{color:#f2f2f7}body.dark .ht-frase{color:#c9cad8}body.dark .ht-lista li{background:rgba(255,255,255,.07);color:#d4d5e2}'
    ].join('');
    document.head.appendChild(st);
  }

  var inlineAbierto = false;
  var abriendo = false;
  function abrir(reusar){
    if (abriendo) return false;
    if (!sesionDeDistribuidor()) return false;
    abriendo = true;
    try{
      css();
      var home = document.getElementById('homeLimpio');
      if (!home) return false;
      if (!(reusar && mazo && mazo.tarjetas && mazo.tarjetas.length)){
        var tarjetas = armarTarjetas();
        if (!tarjetas.length) return false;
        mazo = { tarjetas: tarjetas, i: 0 };
      }
      var previo = document.getElementById('htOverlay');
      if (previo) previo.remove();
      var ov = document.createElement('div');
      ov.id = 'htOverlay';
      ov.innerHTML = '<div class="ht-top"><div><b id="htCupo">' + esc(textoMarcador()) + '</b><small class="ht-tope" id="htSubCupo">' + esc(textoSubMarcador()) + '</small></div><span id="htPos"></span></div>' +
        '<div class="ht-centro"><div class="ht-deck" id="htDeck"></div>' +
        '<div class="ht-hint">← Deslizá para un lado o para el otro: las tarjetas dan la vuelta →</div></div>';
      home.insertBefore(ov, home.firstChild);
      inlineAbierto = true;
      pintar();
      return true;
    }catch(e){ return false; }
    finally{ abriendo = false; }
  }

  function cerrar(){
    var ov = document.getElementById('htOverlay');
    if (ov) ov.remove();
    mazo = null;
    inlineAbierto = false;
  }

  function crearCarta(t){
    var el = document.createElement('div');
    el.className = 'ht-card' + (t.cat === 'especial' ? ' ht-esp' : '') + (t.cat === 'metodo' ? ' ht-alerta' : '') + (t.cat === 'hoy' ? ' ht-hoy' : '') + (t.cat === 'ganaste' ? ' ht-ganaste' : '');
    el.innerHTML = '<div class="ht-cab"><span class="ht-ico">' + t.icono + '</span>' +
      '<span class="ht-kicker">' + esc(t.kicker) + '</span></div>' +
      '<h3>' + esc(t.titulo) + '</h3>' +
      '<div class="ht-cuerpo">' + t.html + '</div>' +
      (t.cta ? '<button type="button" class="ht-cta">' + esc(t.cta.label) + '</button>' : '');
    if (t && t.cat === 'reempadronar') pintarVerdesReemp(el);
    return el;
  }

  // Mientras se arrastra, atrás asoma la tarjeta que de verdad viene: si el
  // gesto va a la izquierda asoma la siguiente, si va a la derecha asoma la
  // anterior. Antes asomaba siempre la siguiente y al volver aparecía otra
  // cosa: quedaba feo (v324).
  function asomar(dir){
    if (!mazo) return;
    var deck = document.getElementById('htDeck');
    if (!deck) return;
    var len = mazo.tarjetas.length;
    if (len < 2) return;
    var top = deck.querySelector('.ht-card:not(.detras1):not(.detras2):not(.ht-fantasma)');
    if (!top) return;
    deck.querySelectorAll('.ht-card.detras1, .ht-card.detras2').forEach(function(n){ n.remove(); });
    var offs = dir < 0 ? [-1, -2] : [1, 2];
    for (var j = Math.min(2, len - 1); j >= 1; j--){
      var k = ((mazo.i + offs[j - 1]) % len + len) % len;
      var el = crearCarta(mazo.tarjetas[k]);
      el.classList.add(j === 1 ? 'detras1' : 'detras2');
      deck.insertBefore(el, top);
    }
  }

  function pintar(){
    if (!mazo) return;
    var deck = document.getElementById('htDeck');
    var pos = document.getElementById('htPos');
    var cupoEl = document.getElementById('htCupo');
    if (cupoEl) cupoEl.textContent = textoMarcador();
    var subEl = document.getElementById('htSubCupo');
    if (subEl) subEl.textContent = textoSubMarcador();
    if (!deck) return;
    deck.querySelectorAll('.ht-card:not(.ht-fantasma)').forEach(function(n){ n.remove(); });
    var len = mazo.tarjetas.length;
    if (!len){ cerrar(); return; }
    // El mazo es un bucle: el índice siempre da la vuelta.
    mazo.i = ((mazo.i % len) + len) % len;
    if (pos) pos.textContent = (mazo.i + 1) + ' de ' + len;
    // Se pintan la de arriba y hasta dos de atrás; con el bucle, después de la
    // última asoma de nuevo la primera.
    for (var off = Math.min(2, len - 1); off >= 0; off--){
      var k = (mazo.i + off) % len;
      var t = mazo.tarjetas[k];
      var el = crearCarta(t);
      if (off > 0) el.classList.add(off === 1 ? 'detras1' : 'detras2');
      if (off === 0){
        cablearTope(el, t);
        // La primera vez, la tarjeta se hamaca sola: así se entiende el gesto.
        if (mazo.i === 0 && !mazo.demoHecha){ mazo.demoHecha = true; el.classList.add('demo'); }
      }
      deck.appendChild(el);
    }
  }

  function cablearTope(el, t){
    if (!el || el.__cableada) return;
    el.__cableada = true;
    // La acción se ejecuta con el mazo quieto: las tarjetas quedan donde
    // estaban, listas para seguir cuando se vuelve al Home (v323).
    var ejecutar = function(ir){ return function(){ try{ ir(); }catch(e){} }; };
    if (t && t.cta){
      var cta = el.querySelector('.ht-cta');
      if (cta) cta.onclick = ejecutar(t.cta.go);
    }
    el.querySelectorAll('.ht-lista li').forEach(function(li, i){
      var accion = (t.items && t.items[i]) || (t.cta && t.cta.go);
      if (accion){
        (function(fn, fila){
          li.onclick = function(){ try{ fn(fila); }catch(e){} };
        })(accion, li);
      }
    });
    if (t && typeof t.alMantener === 'function'){
      var holdT = null;
      var clearHold = function(){ if (holdT){ clearTimeout(holdT); holdT = null; } };
      el.addEventListener('pointerdown', function(e){
        if (e.target.closest('button, a, .ht-lista li')) return;
        clearHold();
        holdT = setTimeout(function(){
          holdT = null;
          if (el.__arrastro) return;
          try{ if (navigator.vibrate) navigator.vibrate(18); }catch(err){}
          try{ t.alMantener(); }catch(err){}
        }, 550);
      });
      el.addEventListener('pointerup', clearHold);
      el.addEventListener('pointercancel', clearHold);
      el.addEventListener('pointermove', function(){ if (el.__arrastro) clearHold(); });
      el.addEventListener('contextmenu', function(e){ e.preventDefault(); });
    }
    activarArrastre(el);
  }

  function pasar(){
    if (!mazo) return false;
    var len = mazo.tarjetas.length;
    if (len < 2) return false;                   // con una sola no hay a dónde ir
    var deck = document.getElementById('htDeck');
    var top = deck && deck.querySelector('.ht-card:not(.detras1):not(.detras2):not(.ht-fantasma)');
    if (top){
      top.classList.add('vuela');
      top.style.transform = 'translateX(-130vw) translateY(-4vh) rotate(-22deg)';
      // Las de atrás suben a su nuevo lugar mientras la de arriba vuela:
      // la transición base de .ht-card hace el resto.
      var d1 = deck.querySelector('.ht-card.detras1');
      var d2 = deck.querySelector('.ht-card.detras2');
      if (d1){ d1.classList.remove('detras1'); cablearTope(d1, mazo.tarjetas[(mazo.i + 1) % len]); }
      if (d2){ d2.classList.remove('detras2'); d2.classList.add('detras1'); }
      setTimeout(function(){ if (mazo){ mazo.i = (mazo.i + 1) % len; pintar(); } }, 330);
    } else {
      mazo.i = (mazo.i + 1) % len; pintar();
    }
    return true;
  }

  // Deslizar a la derecha va a la tarjeta anterior con el MISMO vuelo que al
  // pasar, pero espejado: la de arriba vuela girando hacia la derecha y la
  // anterior sube desde atrás a su lugar. El mazo es un bucle para los dos
  // lados: desde la primera aparece la última.
  function volver(){
    if (!mazo || mazo.tarjetas.length < 2) return false;
    var deck = document.getElementById('htDeck');
    var top = deck && deck.querySelector('.ht-card:not(.detras1):not(.detras2):not(.ht-fantasma)');
    if (top){
      // La que se va queda volando por encima del mazo mientras abajo ya
      // está pintada la anterior; al terminar el vuelo, desaparece.
      top.classList.add('ht-fantasma', 'vuela');
      top.style.zIndex = '30';
      top.style.transform = 'translateX(130vw) translateY(-4vh) rotate(22deg)';
      setTimeout(function(){ if (top.parentNode) top.parentNode.removeChild(top); }, 470);
    }
    mazo.i = (mazo.i - 1 + mazo.tarjetas.length) % mazo.tarjetas.length;
    pintar();
    var nuevo = deck && deck.querySelector('.ht-card:not(.detras1):not(.detras2):not(.ht-fantasma)');
    if (nuevo){
      // Arranca un pasito atrás y sube a su lugar: igual que cuando se pasa.
      nuevo.classList.add('detras1');
      void nuevo.offsetWidth;                    // forzar el punto de partida
      nuevo.classList.remove('detras1');
    }
    return true;
  }

  function activarArrastre(el){
    // Se arrastra desde cualquier parte de la tarjeta, botones incluidos.
    // El dedo real tiembla unos píxeles al tocar: para que un toque nunca se
    // confunda con un arrastre, el gesto recién cuenta como arrastre cuando
    // el movimiento es claramente horizontal y amplio (y sobre un botón o un
    // renglón, más amplio todavía). Si fue toque, el click sale normal.
    var x0 = 0, y0 = 0, dx = 0, dy = 0, arrastrando = false, umbral = 14, dir = 0;
    el.addEventListener('pointerdown', function(e){
      el.classList.remove('demo');
      arrastrando = true; x0 = e.clientX; y0 = e.clientY; dx = 0; dy = 0; dir = 0; el.__arrastro = false;
      umbral = e.target.closest('button, .ht-lista li, a') ? 26 : 14;
      // Ojo: la captura del puntero recién se toma cuando el gesto ES un
      // arrastre. Si se toma acá, el click de la ✗ y del botón se pierde.
    });
    el.addEventListener('pointermove', function(e){
      if (!arrastrando) return;
      dx = e.clientX - x0;
      dy = e.clientY - y0;
      if (!el.__arrastro && Math.abs(dx) > umbral && Math.abs(dx) > Math.abs(dy) + 4){
        el.__arrastro = true;
        el.classList.add('arrastre');
        try{ el.setPointerCapture(e.pointerId); }catch(err){}
      }
      if (el.__arrastro && dx !== 0){
        // Atrás asoma la tarjeta hacia donde va el gesto (v324).
        var nueva = dx < 0 ? 1 : -1;
        if (nueva !== dir){ dir = nueva; asomar(dir); }
        el.style.transform = 'translateX(' + dx + 'px) rotate(' + (dx / 20) + 'deg)';
      }
    });
    function soltar(){
      if (!arrastrando) return;
      arrastrando = false;
      el.classList.remove('arrastre');
      if (el.__arrastro && dx < -80 && pasar()){ /* pasó a la siguiente */ }
      else if (el.__arrastro && dx > 80 && volver()){ /* volvió a la anterior */ }
      else if (el.__arrastro){
        el.classList.add('volver'); el.style.transform = '';
        setTimeout(function(){ el.classList.remove('volver'); }, 360);
        // El gesto no se concretó: atrás vuelve a asomar la siguiente.
        if (dir === -1) asomar(1);
      }
      dir = 0;
    }
    el.addEventListener('pointerup', soltar);
    el.addEventListener('pointercancel', soltar);
    el.addEventListener('click', function(e){
      if (el.__arrastro){ e.stopPropagation(); e.preventDefault(); }
    }, true);
  }

  /* ---------- integración con el Home ---------- */
  function esHome(){
    var v = document.getElementById('view-home');
    return !!(v && v.classList.contains('active'));
  }
  // El mazo es del distribuidor logueado: nunca sobre el candado, nunca
  // para la sesión administradora, nunca sin perfil cargado.
  function sesionDeDistribuidor(){
    try{
      var lock = document.getElementById('lockScreen');
      if (lock && !lock.classList.contains('hidden')) return false;
      if (window.APPIAuth && window.APPIAuth.isEnabled && window.APPIAuth.isEnabled()){
        var p = window.APPIAuth.currentProfile ? window.APPIAuth.currentProfile() : null;
        if (!p || p.rol === 'admin') return false;
      }
      return true;
    }catch(e){ return false; }
  }
  var autoAbierto = false;
  // El mazo aparece recién cuando la app terminó de cargar DE VERDAD:
  // sin pantalla de arranque, sin la elección de titular/socio abierta,
  // con la sesión autorizada. Antes de eso, espera.
  function appTerminoDeCargar(){
    try{
      var boot = document.getElementById('bootScreen');
      if (boot && !boot.classList.contains('gone') && boot.offsetParent !== null) return false;
      var persona = document.getElementById('personChoiceOverlay');
      if (persona && !persona.hidden) return false;
      if (window.__appiCubriendoInicio) return false;
      if (window.APPIAuth && window.APPIAuth.isEnabled && window.APPIAuth.isEnabled()){
        if (window.APPIAuth.isLocallyAuthorized && !window.APPIAuth.isLocallyAuthorized()) return false;
        if (window.APPIAuth.needsPersonChoice && window.APPIAuth.needsPersonChoice()) return false;
      }
      return true;
    }catch(e){ return false; }
  }
  function alEntrarAlHome(){
    if (!sesionDeDistribuidor() || !esHome()) return;
    css();
    if (autoAbierto) return;      // una apertura automática por entrada al Home
    autoAbierto = true;
    // La llave existe para las pruebas automatizadas y para depurar: apaga la
    // apertura automática; el mazo se puede abrir a mano con APPIHomeTarjetas.abrir().
    if (localStorage.getItem('appi_tarjetas_auto') === '0') return;
    var intentos = 0;
    (function esperar(){
      if (!esHome() || document.getElementById('htOverlay')) return;
      if (++intentos > 45) return;                     // ~18 s y desistimos por hoy
      if (!appTerminoDeCargar()){ setTimeout(esperar, 400); return; }
      // Un respiro final después de cargar, y recién ahí el mazo. Siempre hay
      // al menos la tarjeta especial: el mazo queda a la vista todos los días.
      setTimeout(function(){
        if (esHome() && appTerminoDeCargar() && !document.getElementById('htOverlay')) abrir();
      }, 500);
    })();
  }

  function envolver(){
    if (window.__htWrapped) return;
    if (typeof window.showView !== 'function') return;
    window.__htWrapped = true;
    var orig = window.showView;
    window.showView = function(id){
      var r = orig.apply(this, arguments);
      try{
        if (id === 'view-home'){ autoAbierto = false; setTimeout(alEntrarAlHome, 350); }
        else { autoAbierto = false; }
      }catch(e){}
      return r;
    };
    // Si el Home ya estaba activo cuando cargó el módulo:
    if (esHome()) setTimeout(alEntrarAlHome, 900);
    // Si el Home se repintó con el mazo abierto, se vuelve a montar donde
    // estaba, conservando la tarjeta en la que se había quedado.
    setInterval(function(){
      if (!esHome()) return;
      if (inlineAbierto && mazo && !document.getElementById('htOverlay')) abrir(true);
    }, 2500);
  }

  window.APPIHomeTarjetas = {
    abrir: abrir,
    cerrar: cerrar,
    pasar: pasar,
    volver: volver,
    armarTarjetas: armarTarjetas,
    mejorAccionHoy: mejorAccionHoy,
    cuantasNovedades: cuantasNovedades,
    fraseDelDia: fraseDelDia,
    FRASES: FRASES,
    ventanaRinnova: ventanaRinnova,
    esDucha: esDucha,
    colaDuchaRinnova: colaDuchaRinnova,
    colaCanje: colaCanje,
    enLasDiez: enLasDiez,
    topeHoy: topeHoy,
    tarjetaMetodoEnvio: tarjetaMetodoEnvio,
    tarjetaLlegamos: tarjetaLlegamos,
    tarjetaGanaste: tarjetaGanaste,
    textoMarcador: textoMarcador
  };

  window.addEventListener('appi-datasync-applied', function(){
    try{ if (document.getElementById('htOverlay')) pintar(); }catch(e){}
  });

  if (document.readyState === 'complete') envolver();
  else window.addEventListener('load', envolver);
  setTimeout(envolver, 1200);
})();
