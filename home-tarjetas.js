/* ============================================================
   APPI · Tarjetas de notificaciones del Home (estilo mazo)
   ------------------------------------------------------------
   Al entrar al Home, las novedades aparecen como un mazo de
   tarjetas que se pasan deslizando (como Tinder): la primera es
   el aliento del día con el progreso real; después, una tarjeta
   por categoría, solo si esa categoría tiene algo para decir:

     💙 Especial  · aliento personalizado (siempre, 1 frase/día)
     📅 Tu jornada · seguimientos y presentaciones de hoy
     🎯 Oportunidades · bonus al alcance en Mi Equipo
     🎂 Cumpleaños · equipo + clientes que cumplen hoy
     👥 Mi Equipo · la Cultura del mes que falta completar
     📇 Panel de Contactos · nuevos sin contactar y vencidos
     💧 Usuarios · las acciones del día sin marcar (✓/✗)

   Deslizar pasa la tarjeta; el botón de cada tarjeta lleva a la
   pantalla. El Home tiene el botón 🔔 Notificaciones: parpadea
   con el contador cuando hay tarjetas sin ver y las reabre.
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
        if (r.total) chips.push('✓ ' + r.hechas + ' de ' + r.total + ' acciones');
      }
    }catch(e){}
    return {
      cat: 'especial', icono: '💙', kicker: 'Para vos' + (nombre ? ', ' + nombre : ''),
      titulo: 'Tu impulso de hoy',
      html: '<p class="ht-frase">' + esc(frase) + '</p>' +
            (chips.length ? '<div class="ht-chips">' + chips.map(function(c){ return '<span>' + esc(c) + '</span>'; }).join('') + '</div>' : ''),
      cta: null
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
      var proponer = function(p){ return function(){
        var tel = p.telefono || p.telf || '';
        var pb = String(Number(p.pnAct || p.pb || 0)).replace('.', ',');
        if (tel && window.APPITel && window.APPITel.esValido(tel)){
          window.APPITel.abrir(tel, 'Hola ' + pilaB(p.nombre) + '! 😊 Vi que ya estás en ' + pb + ' PB… ¡a nada del Bonus! ¿Te ayudo a llegar? Podemos invitar a alguien y trabajarlo juntos esta semana. 💪', pilaB(p.nombre));
        } else abrirEquipo();
      }; };
      var filas = [], items = [];
      gente.slice(0, 3).forEach(function(p){
        var pb = Number(p.pnAct || p.pb || 0);
        filas.push('<li>🎯 <b>' + esc(String(p.nombre || '').split(',')[0]) + '</b> está en ' + String(pb).replace('.', ',') + ' PB</li>');
        items.push(proponer(p));
      });
      return {
        cat: 'oportunidades', icono: '🎯', kicker: 'Oportunidades',
        titulo: gente.length === 1 ? 'Un Bonus al alcance de la mano' : gente.length + ' Bonus al alcance de la mano',
        html: '<ul class="ht-lista">' + filas.join('') + '</ul><p class="ht-nota">Tocá a la persona y sale la propuesta por WhatsApp.</p>',
        items: items,
        cta: { label: 'Proponerle a ' + (pilaB(gente[0].nombre) || 'la primera persona'), go: items[0] }
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
    // Saludo directo: a la persona del equipo la saluda APPITel con el mensaje
    // de cumpleaños; al cliente lo saluda la plantilla de Mensajes, que además
    // deja marcada la ✓ de la acción del día.
    var saludarEquipo = function(p){ return function(){
      var tel = p.telefono || p.telf || '';
      if (tel && window.APPITel && window.APPITel.esValido(tel)){
        window.APPITel.abrir(tel, '¡Feliz cumpleaños, ' + pila(p.nombre) + '! 🎂🎉\n\nTe mando un saludo grande en tu día. Que lo disfrutes mucho.\n\n¡Un abrazo!', pila(p.nombre));
      } else abrirEquipo();
    }; };
    var saludarCliente = function(u){ return function(){
      if (window.APPIMensajes && window.APPIMensajes.mandar) window.APPIMensajes.mandar('cumple', u);
      else if (typeof window.showView === 'function') window.showView('view-usuarios');
    }; };

    var filas = [], items = [];
    equipo.slice(0, 2).forEach(function(p){
      filas.push('<li>🎂 <b>' + esc(String(p.nombre || '').split(',')[0]) + '</b> · de tu equipo</li>');
      items.push(saludarEquipo(p));
    });
    clientes.slice(0, 2).forEach(function(u){
      filas.push('<li>🎂 <b>' + esc(String(u.usuario || '').split(',')[0]) + '</b> · cliente</li>');
      items.push(saludarCliente(u));
    });
    if (total > 4){
      filas.push('<li>… y más cumpleaños</li>');
      items.push(clientes.length > 2 ? function(){ if (typeof window.showView === 'function') window.showView('view-usuarios'); } : abrirEquipo);
    }
    var primero = items[0];
    return {
      cat: 'cumples', icono: '🎂', kicker: 'Cumpleaños',
      titulo: total === 1 ? 'Hoy hay un cumpleaños' : 'Hoy hay ' + total + ' cumpleaños',
      html: '<ul class="ht-lista">' + filas.join('') + '</ul><p class="ht-nota">Tocá a la persona y sale el saludo por WhatsApp.</p>',
      items: items,
      cta: { label: 'Saludar a ' + (equipo.length ? pila(equipo[0].nombre) : pila(clientes[0] && clientes[0].usuario)) , go: primero }
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
    return {
      cat: 'equipo', icono: '👥', kicker: 'Mi Equipo',
      titulo: 'La Cultura del mes te está esperando',
      html: '<p class="ht-frase">Te falta' + (partes.length > 1 ? 'n' : '') + ' ' + partes.join(' y ') + ' para completar el mes.</p>' +
            '<div class="ht-chips"><span>💎 ' + String(cul.pb).replace('.', ',') + ' / ' + cul.metaPb + '</span><span>🤝 ' + cul.invitados + ' / ' + cul.metaInv + '</span></div>',
      cta: { label: 'Cargar mi avance', go: function(){
        if (typeof window.openEquipo === 'function') window.openEquipo();
        else if (typeof window.showView === 'function') window.showView('view-equipo');
        setTimeout(function(){
          var cult = document.getElementById('culturaWrap') || document.querySelector('.cultura-card');
          if (cult) cult.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 500);
      } }
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
        titulo: r.pendientes === 1 ? 'Queda 1 acción del día sin marcar' : 'Quedan ' + r.pendientes + ' acciones del día sin marcar',
        html: '<ul class="ht-lista">' + filas.join('') + '</ul>' +
              '<div class="ht-chips"><span>✓ ' + r.hechas + '</span><span>✗ ' + r.noHechas + '</span><span>quedan ' + r.pendientes + '</span></div>' +
              '<p class="ht-nota">Tocá un motivo y se abre el carrusel para mandar y marcar ✓/✗.</p>',
        items: items,
        cta: { label: 'Ir a marcar', go: items[0] || function(){ if (typeof window.showView === 'function') window.showView('view-usuarios'); } }
      };
    }catch(e){ return null; }
  }

  function armarTarjetas(){
    var lista = [tarjetaEspecial()];
    [tarjetaJornada(), tarjetaOportunidades(), tarjetaCumples(), tarjetaEquipo(), tarjetaPanel(), tarjetaUsuarios()].forEach(function(t){
      if (t) lista.push(t);
    });
    return lista;
  }
  function cuantasNovedades(){ return armarTarjetas().length - 1; } // la especial no cuenta como "pendiente"
  function firmaTarjetas(){
    return hoyKey() + '|' + armarTarjetas().map(function(t){ return t.cat; }).join(',');
  }
  function vistoKey(){ return 'appi_tarjetas_visto_' + uid(); }
  function hayNovedadesSinVer(){
    return cuantasNovedades() > 0 && localStorage.getItem(vistoKey()) !== firmaTarjetas();
  }
  function marcarVisto(){
    try{ localStorage.setItem(vistoKey(), firmaTarjetas()); }catch(e){}
  }

  /* ---------- el mazo ---------- */
  var mazo = null; // { tarjetas, i }

  function css(){
    if (document.getElementById('htEstilos')) return;
    var st = document.createElement('style');
    st.id = 'htEstilos';
    st.textContent = [
      '#htOverlay{position:fixed;inset:0;z-index:10055;display:flex;flex-direction:column;background:rgba(22,24,40,.55);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px)}',
      '.ht-top{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:16px 18px calc(0px + env(safe-area-inset-top,0px));padding-top:calc(16px + env(safe-area-inset-top,0px));color:#fff}',
      '.ht-top b{font-size:15px}.ht-top span{font-size:11px;opacity:.8;font-weight:800;margin-left:auto;margin-right:10px}',
      '.ht-cerrar{width:40px;height:40px;border:0;border-radius:50%;background:rgba(255,255,255,.16);color:#fff;font-size:19px;font-weight:900;cursor:pointer}',
      '.ht-cerrar{width:42px;height:42px;border:0;border-radius:50%;background:rgba(255,255,255,.16);color:#fff;font-size:20px;font-weight:900;cursor:pointer}',
      '.ht-centro{margin:auto;display:flex;flex-direction:column;align-items:center;gap:12px;padding:10px 18px;min-height:0}',
      '.ht-deck{position:relative;width:min(92vw,400px);height:min(62vh,470px)}',
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
      '.ht-x{flex:0 0 auto;width:34px;height:34px;border:0;border-radius:50%;background:rgba(120,120,140,.12);color:#63636f;font-size:17px;font-weight:900;line-height:1;cursor:pointer}',
      '.ht-x:hover{background:rgba(224,36,36,.14);color:#c0392b}',
      '.ht-card h3{margin:9px 0 11px;color:#1d1d2c;font-size:23px;line-height:1.22;letter-spacing:-.4px}',
      '.ht-cuerpo{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;min-height:0;touch-action:pan-y}',
      '.ht-frase{margin:0;color:#41424f;font-size:17.5px;line-height:1.55;font-weight:700}',
      '.ht-lista{margin:0;padding:0;list-style:none;display:grid;gap:9px}',
      '.ht-lista li{display:flex;align-items:center;gap:8px;padding:13px 14px;border-radius:14px;background:rgba(91,141,239,.08);color:#33343f;font-size:15px;font-weight:750;cursor:pointer;transition:background .14s}',
      '.ht-lista li:hover{background:rgba(91,141,239,.16)}',
      '.ht-lista li::after{content:"›";margin-left:auto;color:#3d63c9;font-weight:900;font-size:17px}',
      '.ht-lista li i{color:#c0392b;font-style:normal;font-size:12px;font-weight:900}',
      '.ht-nota{margin:12px 0 0;color:#8a8b98;font-size:13px;line-height:1.5}',
      '.ht-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}',
      '.ht-chips span{padding:7px 12px;border-radius:999px;background:rgba(91,141,239,.1);color:#3d63c9;font-size:12.5px;font-weight:900}',
      '.ht-cta{margin-top:12px;min-height:52px;border:0;border-radius:15px;background:linear-gradient(135deg,#5b8def,#8b63e8);color:#fff;font:inherit;font-size:15px;font-weight:900;cursor:pointer}',
      '.ht-espacio{flex:0 0 calc(10px + env(safe-area-inset-bottom,0px))}',
      '.ht-pasar{min-height:46px;padding:0 30px;border:0;border-radius:999px;background:rgba(255,255,255,.18);color:#fff;font:inherit;font-size:14px;font-weight:900;cursor:pointer}',
      '.ht-hint{text-align:center;color:#b9bac8;font-size:11px;font-weight:800}',
      /* botón del Home */
      '.ht-boton{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:50px;margin:0 0 12px;border:1px solid rgba(91,141,239,.2);border-radius:16px;background:rgba(255,255,255,.8);color:#3d63c9;font:inherit;font-size:13.5px;font-weight:900;cursor:pointer}',
      '.ht-boton b{min-width:24px;padding:3px 8px;border-radius:999px;background:#e02424;color:#fff;font-size:11px}',
      '.ht-boton.late{border-color:rgba(224,36,36,.4);animation:htLatido 1.1s ease-in-out infinite}',
      '@keyframes htLatido{0%,100%{box-shadow:0 0 0 0 rgba(224,36,36,.35);transform:scale(1)}50%{box-shadow:0 0 0 10px rgba(224,36,36,0);transform:scale(1.015)}}',
      'body.dark .ht-card{background:linear-gradient(160deg,#262838,#1f2130)}',
      'body.dark .ht-x{background:rgba(255,255,255,.1);color:#c9cad8}body.dark .ht-card h3{color:#f2f2f7}body.dark .ht-frase{color:#c9cad8}body.dark .ht-lista li{background:rgba(255,255,255,.07);color:#d4d5e2}',
      'body.dark .ht-boton{background:rgba(31,32,49,.8);border-color:rgba(255,255,255,.12);color:#9db7f5}'
    ].join('');
    document.head.appendChild(st);
  }

  function abrir(){
    if (!sesionDeDistribuidor()) return false;
    css();
    var tarjetas = armarTarjetas();
    if (!tarjetas.length) return false;
    cerrar();
    mazo = { tarjetas: tarjetas, i: 0 };
    var ov = document.createElement('div');
    ov.id = 'htOverlay';
    ov.innerHTML = '<div class="ht-top"><div><b>🔔 Notificaciones</b></div><span id="htPos"></span>' +
      '<button type="button" class="ht-cerrar" id="htCerrar" aria-label="Cerrar notificaciones">×</button></div>' +
      '<div class="ht-centro"><div class="ht-deck" id="htDeck"></div>' +
      '<button type="button" class="ht-pasar" id="htPasar">Pasar ›</button>' +
      '<div class="ht-hint">← Deslizá a la izquierda para pasar · a la derecha volvés →</div></div>' +
      '<div class="ht-espacio"></div>';
    document.body.appendChild(ov);
    document.getElementById('htPasar').onclick = function(){ pasar(); };
    document.getElementById('htCerrar').onclick = function(){ marcarVisto(); cerrar(); };
    ov.addEventListener('click', function(e){ if (e.target === ov) { marcarVisto(); cerrar(); } });
    pintar();
    return true;
  }

  function cerrar(){
    var ov = document.getElementById('htOverlay');
    if (ov) ov.remove();
    mazo = null;
    actualizarBoton();
  }

  function pintar(){
    if (!mazo) return;
    var deck = document.getElementById('htDeck');
    var pos = document.getElementById('htPos');
    if (!deck) return;
    deck.querySelectorAll('.ht-card').forEach(function(n){ n.remove(); });
    if (mazo.i >= mazo.tarjetas.length){ marcarVisto(); cerrar(); return; }
    if (pos) pos.textContent = (mazo.i + 1) + ' de ' + mazo.tarjetas.length;
    for (var k = Math.min(mazo.i + 2, mazo.tarjetas.length - 1); k >= mazo.i; k--){
      var t = mazo.tarjetas[k];
      var el = document.createElement('div');
      el.className = 'ht-card' + (k === mazo.i ? '' : k === mazo.i + 1 ? ' detras1' : ' detras2');
      el.innerHTML = '<div class="ht-cab"><span class="ht-ico">' + t.icono + '</span>' +
        '<span class="ht-kicker">' + esc(t.kicker) + '</span>' +
        '<button type="button" class="ht-x" aria-label="Descartar esta notificación" title="Descartar">×</button></div>' +
        '<h3>' + esc(t.titulo) + '</h3>' +
        '<div class="ht-cuerpo">' + t.html + '</div>' +
        (t.cta ? '<button type="button" class="ht-cta">' + esc(t.cta.label) + '</button>' : '');
      if (k === mazo.i){
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
    var x = el.querySelector('.ht-x');
    if (x) x.onclick = function(){ pasar(); };   // descarta esta tarjeta y sigue
    var irYCerrar = function(ir){ return function(){ marcarVisto(); cerrar(); try{ ir(); }catch(e){} }; };
    if (t && t.cta){
      var cta = el.querySelector('.ht-cta');
      if (cta) cta.onclick = irYCerrar(t.cta.go);
      // Cada renglón lleva directo: si la tarjeta trae una acción por ítem
      // (como saludar a ESA persona), se usa esa; si no, la general.
      el.querySelectorAll('.ht-lista li').forEach(function(li, i){
        var accion = (t.items && t.items[i]) || t.cta.go;
        li.onclick = irYCerrar(accion);
      });
    }
    activarArrastre(el);
  }

  function pasar(){
    if (!mazo) return;
    var deck = document.getElementById('htDeck');
    var top = deck && deck.querySelector('.ht-card:not(.detras1):not(.detras2)');
    if (top){
      top.classList.add('vuela');
      top.style.transform = 'translateX(-130vw) translateY(-4vh) rotate(-22deg)';
      // Las de atrás suben a su nuevo lugar mientras la de arriba vuela:
      // la transición base de .ht-card hace el resto.
      var d1 = deck.querySelector('.ht-card.detras1');
      var d2 = deck.querySelector('.ht-card.detras2');
      if (d1){ d1.classList.remove('detras1'); cablearTope(d1, mazo.tarjetas[mazo.i + 1]); }
      if (d2){ d2.classList.remove('detras2'); d2.classList.add('detras1'); }
      setTimeout(function(){ if (mazo){ mazo.i++; pintar(); } }, 330);
    } else {
      mazo.i++; pintar();
    }
  }

  // Deslizar a la derecha vuelve a la tarjeta anterior: entra volando desde
  // la izquierda, por donde se había ido.
  function volver(){
    if (!mazo || mazo.i === 0) return false;
    mazo.i--;
    pintar();
    var deck = document.getElementById('htDeck');
    var top = deck && deck.querySelector('.ht-card:not(.detras1):not(.detras2)');
    if (top){
      top.classList.add('arrastre');
      top.style.transform = 'translateX(-130vw) rotate(-22deg)';
      void top.offsetWidth;                    // forzar el punto de partida
      top.classList.remove('arrastre');
      top.style.transform = '';
    }
    return true;
  }

  function activarArrastre(el){
    // Se arrastra desde cualquier parte de la tarjeta, botones incluidos.
    // El dedo real tiembla unos píxeles al tocar: para que un toque nunca se
    // confunda con un arrastre, el gesto recién cuenta como arrastre cuando
    // el movimiento es claramente horizontal y amplio (y sobre un botón o un
    // renglón, más amplio todavía). Si fue toque, el click sale normal.
    var x0 = 0, y0 = 0, dx = 0, dy = 0, arrastrando = false, umbral = 14;
    el.addEventListener('pointerdown', function(e){
      el.classList.remove('demo');
      arrastrando = true; x0 = e.clientX; y0 = e.clientY; dx = 0; dy = 0; el.__arrastro = false;
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
      if (el.__arrastro) el.style.transform = 'translateX(' + dx + 'px) rotate(' + (dx / 20) + 'deg)';
    });
    function soltar(){
      if (!arrastrando) return;
      arrastrando = false;
      el.classList.remove('arrastre');
      if (el.__arrastro && dx < -80){ pasar(); }
      else if (el.__arrastro && dx > 80 && volver()){ /* volvió a la anterior */ }
      else if (el.__arrastro){ el.classList.add('volver'); el.style.transform = ''; setTimeout(function(){ el.classList.remove('volver'); }, 360); }
    }
    el.addEventListener('pointerup', soltar);
    el.addEventListener('pointercancel', soltar);
    el.addEventListener('click', function(e){
      if (el.__arrastro){ e.stopPropagation(); e.preventDefault(); }
    }, true);
  }

  /* ---------- el botón del Home ---------- */
  function actualizarBoton(){
    if (!sesionDeDistribuidor()) return;
    var home = document.getElementById('homeLimpio');
    if (!home) return;
    var boton = document.getElementById('htBoton');
    if (!boton){
      boton = document.createElement('button');
      boton.id = 'htBoton';
      boton.type = 'button';
      boton.className = 'ht-boton';
      boton.onclick = function(){ abrir(); };
      home.insertBefore(boton, home.firstChild);
    }
    var n = cuantasNovedades();
    var sinVer = hayNovedadesSinVer();
    boton.classList.toggle('late', sinVer);
    boton.innerHTML = '🔔 Notificaciones' + (n > 0 ? ' <b>' + n + '</b>' : '');
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
    actualizarBoton();
    if (autoAbierto) return;      // una apertura automática por entrada al Home
    autoAbierto = true;
    // La llave existe para las pruebas automatizadas y para depurar: apaga
    // solo la apertura automática; el botón 🔔 sigue funcionando igual.
    if (localStorage.getItem('appi_tarjetas_auto') === '0') return;
    var intentos = 0;
    (function esperar(){
      if (!esHome() || document.getElementById('htOverlay')) return;
      if (++intentos > 45) return;                     // ~18 s y desistimos por hoy
      if (!appTerminoDeCargar()){ setTimeout(esperar, 400); return; }
      // Un respiro final después de cargar, y recién ahí el mazo.
      setTimeout(function(){
        if (esHome() && appTerminoDeCargar() && !document.getElementById('htOverlay') && cuantasNovedades() > 0) abrir();
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
    // El contador del botón respira solo (los datos llegan de a poco).
    setInterval(function(){ if (esHome() && !document.getElementById('htOverlay')) actualizarBoton(); }, 4000);
  }

  window.APPIHomeTarjetas = {
    abrir: abrir,
    cerrar: cerrar,
    armarTarjetas: armarTarjetas,
    cuantasNovedades: cuantasNovedades,
    fraseDelDia: fraseDelDia,
    FRASES: FRASES
  };

  if (document.readyState === 'complete') envolver();
  else window.addEventListener('load', envolver);
  setTimeout(envolver, 1200);
})();
