/* ============================================================
   APPI · Reactivación de clientes dormidos
   ------------------------------------------------------------
   Los vencidos hace más de un año están fuera del trabajo diario
   a propósito: si aparecieran en los pendientes, taparían lo que
   hay que hacer hoy. Pero son una lista enorme de gente que ya
   compró, y el equipo probablemente sigue en su cocina.

   Esto es una campaña, no una rutina. Vive aparte:
     - se ven separados por antigüedad, porque no es lo mismo un
       cliente de hace 2 años que uno de hace 10;
     - se trabaja por barrio, para salir a recorrer con sentido;
     - hay un tope por día, porque mandar 200 mensajes seguidos a
       gente que no te tiene agendado es la forma más rápida de
       que WhatsApp te bloquee el número;
     - se anota qué contestó cada uno, si no a la semana no se
       sabe por dónde se iba.
   ============================================================ */
(function(){
  'use strict';

  var TOPE_DIARIO = 15;      // mensajes por día; más que esto es jugar con fuego
  var DIA = 86400000;

  // Olas por antigüedad. El orden importa: se arranca por los más
  // fáciles, que son los que más chances tienen de contestar.
  var OLAS = [
    { id:'o1', icono:'🌤️', nombre:'Hace 1 a 2 años',   desde:365,  hasta:730,   pista:'Los más fáciles: arrancá por acá' },
    { id:'o2', icono:'⛅', nombre:'Hace 3 a 5 años',   desde:730,  hasta:1825,  pista:'Todavía se acuerdan de vos' },
    { id:'o3', icono:'🌥️', nombre:'Hace 5 a 10 años',  desde:1825, hasta:3650,  pista:'Respuesta baja, pero valen los referidos' },
    { id:'o4', icono:'🌑', nombre:'Hace más de 10 años', desde:3650, hasta:1e9,  pista:'Acá se busca el referido, no la venta' }
  ];

  // Cómo terminó cada contacto. Sin esto la campaña se vuelve un
  // despelote a los tres días.
  var ESTADOS = [
    { id:'interesado', icono:'✅', nombre:'Contestó / interesado', color:'#3ad0a4' },
    { id:'sinrespuesta', icono:'⏳', nombre:'Le escribí, no contestó', color:'#f5b301' },
    { id:'equivocado', icono:'📵', nombre:'Número equivocado', color:'#8e8e99' },
    { id:'nomolestar', icono:'🚫', nombre:'No molestar', color:'#d9534f' }
  ];

  /* Respuestas típicas al "¿lo seguís usando?". El primer mensaje lo manda la
     app, pero la conversación la escribe el distribuidor: sin estos textos
     hay que responder a mano cada vez, que es donde está el trabajo real. */
  var SEGUIMIENTOS = [
    {
      id: 'lo_usa',
      icono: '💧',
      nombre: 'Dijo que SÍ lo usa',
      pista: 'Ofrecele la revisión, sin vender nada todavía',
      texto: [
        '¡Qué bueno, {nombre}! 😊',
        '',
        'Te cuento algo importante entonces: tu equipo ya pasó su vida útil, y cuando eso ocurre el purificador deja de poder frenar el desarrollo de microorganismos en su interior.',
        '',
        'Me gustaría pasar a verlo y explicarte bien de qué se trata el canje.'
      ].join('\n')
    },
    {
      id: 'no_lo_usa',
      icono: '📦',
      nombre: 'Lo tiene guardado / no lo usa',
      pista: 'Casi siempre es sólo el filtro',
      texto: [
        'Te entiendo, {nombre}, pasa muchísimo. 😊',
        '',
        'Igual te cuento: cuando un equipo queda mucho tiempo sin usarse es cuando más importa la protección interna, y la del tuyo ya venció.',
        '',
        'Si querés paso a verlo y te explico cómo es el canje.'
      ].join('\n')
    },
    {
      id: 'roto',
      icono: '🔧',
      nombre: 'Dijo que se rompió',
      pista: 'Casi nunca está roto de verdad',
      texto: [
        '¿Qué le pasó, {nombre}?',
        '',
        'Te pregunto porque a veces es algo simple y se resuelve, pero si ya cumplió la vida útil lo que corresponde es el canje. Prefiero verlo antes de decirte cualquier cosa.'
      ].join('\n')
    },
    {
      id: 'no_lo_tiene',
      icono: '🤝',
      nombre: 'Ya no lo tiene',
      pista: 'Acá se busca el referido',
      texto: [
        'Ah, entiendo. Gracias por avisarme, {nombre}! 😊',
        '',
        '¿Y ahora qué están tomando en casa? Te pregunto por curiosidad, y por si en algún momento querés volver a tener el purificador.'
      ].join('\n')
    },
    {
      id: 'visita',
      icono: '📅',
      nombre: 'Coordinar la visita',
      pista: 'Para cerrar el día y la hora',
      texto: [
        'Perfecto, {nombre}! 😊',
        '',
        '¿Qué días y en qué horario te viene bien? Yo me acomodo a lo que te quede más cómodo.'
      ].join('\n')
    }
  ];

  var PLANTILLA_BASE = [
    'Hola {nombre}, ¿cómo estás? 😊',
    '',
    'Soy {vos}. Te escribo porque figurás como usuario de nuestros purificadores y estamos retomando el contacto con personas que alguna vez confiaron en nosotros.',
    '',
    'Como pasó bastante tiempo, quería consultarte algo muy simple: *¿seguís teniendo el equipo, o actualmente estás tomando otro tipo de agua?*',
    '',
    'La idea es simplemente volver a tomar contacto, saber cómo estás y qué fue lo que sucedió en todo este tiempo, para poder acompañarte nuevamente como distribuidor.',
    '',
    '¡Espero que estés muy bien! 😊'
  ].join('\n');

  /* ---------- guardado ---------- */
  function uid(){ return window.APPIAuth && window.APPIAuth.userId ? window.APPIAuth.userId() : 'local'; }
  function storeKey(){ return 'appi_reactivacion_v1_' + uid(); }
  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }
  function leer(){
    try{
      var raw = JSON.parse(localStorage.getItem(storeKey()) || '{}');
      return raw && typeof raw === 'object' ? raw : {};
    }catch(e){ return {}; }
  }
  function guardar(d){
    try{ localStorage.setItem(storeKey(), JSON.stringify(d)); }catch(e){}
  }

  function hoy(){
    var d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  function claveDia(){
    var h = hoy();
    return h.getFullYear() + '-' + String(h.getMonth()+1).padStart(2,'0') + '-' + String(h.getDate()).padStart(2,'0');
  }
  function dias(a, b){ return Math.round((a - b) / DIA); }

  function tel(u){
    return window.APPITel ? window.APPITel.normalizar(u && u.telf || '') : '';
  }

  /* ---------- contador del día ---------- */
  function mandadosHoy(){
    var d = leer();
    return (d.porDia && d.porDia[claveDia()]) || 0;
  }
  function quedanHoy(){ return Math.max(0, TOPE_DIARIO - mandadosHoy()); }
  function sumarEnvio(){
    var d = leer();
    if (!d.porDia) d.porDia = {};
    var k = claveDia();
    d.porDia[k] = (d.porDia[k] || 0) + 1;
    // No hace falta guardar el historial entero de todos los días.
    var keys = Object.keys(d.porDia).sort();
    while (keys.length > 40) { delete d.porDia[keys.shift()]; }
    guardar(d);
  }

  /* ---------- estado de cada cliente ---------- */
  function estadoDe(u){
    var k = tel(u);
    if (!k) return null;
    var d = leer();
    return (d.estados && d.estados[k]) || null;
  }
  function marcar(u, estadoId){
    var k = tel(u);
    if (!k) return;
    var d = leer();
    if (!d.estados) d.estados = {};
    if (estadoId) d.estados[k] = { estado: estadoId, at: new Date().toISOString() };
    else delete d.estados[k];
    guardar(d);
  }
  function estadoInfo(id){
    for (var i=0;i<ESTADOS.length;i++) if (ESTADOS[i].id === id) return ESTADOS[i];
    return null;
  }

  /* Reactivado: volvió a ser cliente. Sale de la campaña y vuelve al circuito
     normal de mantenimiento. Hace falta anotarlo aparte porque la fecha de
     vencimiento vive en el Excel y no cambia: sin esto, el que revivió
     seguiría figurando como dormido para siempre. */
  function reactivar(u){
    var k = tel(u);
    if (!k) return;
    var d = leer();
    if (!d.revividos) d.revividos = {};
    d.revividos[k] = { at: new Date().toISOString() };
    if (d.estados) delete d.estados[k];
    guardar(d);
  }
  function esRevivido(u){
    var k = tel(u);
    if (!k) return false;
    var d = leer();
    return !!(d.revividos && d.revividos[k]);
  }
  function deshacerReactivar(u){
    var k = tel(u);
    if (!k) return;
    var d = leer();
    if (d.revividos) delete d.revividos[k];
    guardar(d);
  }
  function revividos(){
    return todos().filter(esRevivido);
  }

  // Los que contestaron y todavía no se cerraron: es la lista que hay que
  // seguir, y la que justifica toda la campaña.
  function contestaron(){
    return todos().filter(function(u){
      if (!esDormido(u) || esRevivido(u)) return false;
      var e = estadoDe(u);
      return !!(e && e.estado === 'interesado');
    });
  }

  /* ---------- textos de seguimiento ---------- */
  function seguimientos(){
    var g = leer().seguimientos || {};
    return SEGUIMIENTOS.map(function(s){
      var copia = {};
      for (var k in s) copia[k] = s[k];
      if (typeof g[s.id] === 'string') copia.texto = g[s.id];
      copia.editada = typeof g[s.id] === 'string' && g[s.id] !== s.texto;
      return copia;
    });
  }
  function seguimiento(id){
    var todas = seguimientos();
    for (var i=0;i<todas.length;i++) if (todas[i].id === id) return todas[i];
    return null;
  }
  function guardarSeguimiento(id, texto){
    var d = leer();
    if (!d.seguimientos) d.seguimientos = {};
    var base = null;
    for (var i=0;i<SEGUIMIENTOS.length;i++) if (SEGUIMIENTOS[i].id === id) base = SEGUIMIENTOS[i];
    if (base && String(texto) === base.texto) delete d.seguimientos[id];
    else d.seguimientos[id] = String(texto == null ? '' : texto);
    guardar(d);
  }

  /* ---------- quiénes son los dormidos ---------- */
  function aFecha(v){
    if (!v) return null;
    if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
    if (typeof window.parseFechaU === 'function'){
      var p = window.parseFechaU(v);
      if (p && !isNaN(p.getTime())) return p;
    }
    var d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }

  // Días desde que se le venció la garantía. Es la medida de cuánto
  // hace que este cliente no tiene relación con vos.
  // Se compara a medianoche: si la fecha guardada arrastra la hora, el
  // redondeo puede correr un día entero y cambiarle la ola al cliente.
  function antiguedad(u){
    var v = aFecha(u && u.fVence);
    if (!v) return null;
    return dias(hoy(), new Date(v.getFullYear(), v.getMonth(), v.getDate()));
  }

  function esDormido(u){
    var d = antiguedad(u);
    return d !== null && d > 365 && !!tel(u);
  }

  function todos(){
    if (typeof window.usuariosTodosActual === 'function') return window.usuariosTodosActual() || [];
    if (Array.isArray(window.usuariosU)) return window.usuariosU;
    return [];
  }

  // Los dormidos, sin los que ya dijeron que no, sin los números caídos y sin
  // los que ya volvieron a ser clientes.
  function dormidos(){
    return todos().filter(function(u){
      if (!esDormido(u) || esRevivido(u)) return false;
      var e = estadoDe(u);
      if (e && (e.estado === 'nomolestar' || e.estado === 'equivocado')) return false;
      return true;
    });
  }

  // Los que todavía hay que contactar por primera vez: sin los que ya
  // contestaron, que tienen su propia lista.
  function porContactar(){
    return dormidos().filter(function(u){
      var e = estadoDe(u);
      return !(e && e.estado === 'interesado');
    });
  }

  function olaDe(u){
    var d = antiguedad(u);
    if (d === null) return null;
    for (var i=0;i<OLAS.length;i++){
      if (d > OLAS[i].desde && d <= OLAS[i].hasta) return OLAS[i];
    }
    return null;
  }

  function porOla(){
    var mapa = {};
    OLAS.forEach(function(o){ mapa[o.id] = { ola:o, gente:[] }; });
    porContactar().forEach(function(u){
      var o = olaDe(u);
      if (o) mapa[o.id].gente.push(u);
    });
    return OLAS.map(function(o){ return mapa[o.id]; }).filter(function(x){ return x.gente.length; });
  }

  function porBarrio(gente){
    var mapa = {};
    gente.forEach(function(u){
      var b = (u.localidad || 'Sin barrio').toString().trim() || 'Sin barrio';
      if (!mapa[b]) mapa[b] = [];
      mapa[b].push(u);
    });
    return Object.keys(mapa).sort(function(a,b){ return mapa[b].length - mapa[a].length; })
      .map(function(b){ return { barrio:b, gente:mapa[b] }; });
  }

  /* ---------- el texto ---------- */
  function plantilla(){
    var d = leer();
    return typeof d.texto === 'string' ? d.texto : PLANTILLA_BASE;
  }
  function guardarTexto(t){
    var d = leer();
    if (String(t) === PLANTILLA_BASE) delete d.texto;
    else d.texto = String(t == null ? '' : t);
    guardar(d);
  }
  // Nombre de pila del distribuidor, para que el mensaje diga quién escribe.
  function nombreDistribuidor(){
    var activa = window.APPIAuth && window.APPIAuth.activePerson ? window.APPIAuth.activePerson() : null;
    var perfil = window.APPIAuth && window.APPIAuth.currentProfile ? window.APPIAuth.currentProfile() : null;
    var full = String((activa && activa.nombre) || (perfil && perfil.nombre) || '').trim();
    return full.split(/\s+/)[0] || '';
  }

  function completar(texto, u){
    u = u || {};
    var nombre = (typeof window.nombreDePila === 'function' ? window.nombreDePila(u.usuario) : '') ||
                 String(u.usuario || '').split(',')[0].trim();
    var mapa = {
      '{nombre}': nombre,
      '{vos}': nombreDistribuidor(),
      '{localidad}': u.localidad || 'la zona',
      '{domicilio}': u.domicilio || '',
      '{compra}': u.fCompra || '',
      '{vence}': u.fVenceRaw || ''
    };
    return String(texto || '').replace(/\{[a-z_]+\}/g, function(m){
      return mapa[m] !== undefined ? mapa[m] : m;
    });
  }

  /* `respuesta` marca los mensajes de seguimiento: son contestaciones dentro
     de una conversación que la persona ya empezó, no mensajes en frío. No
     gastan cupo ni pisan el estado, porque el riesgo que el tope evita es
     escribirle a desconocidos, no responderle a alguien que te habló. */
  function enviar(u, texto, respuesta){
    var url = 'https://wa.me/' + tel(u) + '?text=' + encodeURIComponent(texto);
    if (window.APPIWhatsApp && window.APPIWhatsApp.abrir) window.APPIWhatsApp.abrir(url);
    else window.open(url, '_blank', 'noopener');
    if (respuesta) return;
    sumarEnvio();
    // Se da por escrito; si contesta se cambia a mano.
    if (!estadoDe(u)) marcar(u, 'sinrespuesta');
  }

  /* ---------- estilos ---------- */
  function css(){
    if (document.getElementById('reEstilos')) return;
    var st = document.createElement('style');
    st.id = 'reEstilos';
    st.textContent = [
      '.re-ov{position:fixed;inset:0;z-index:10070;display:none;background:rgba(24,26,42,.46);backdrop-filter:blur(5px)}',
      '.re-ov.open{display:block}',
      '.re-panel{position:absolute;top:0;right:0;bottom:0;width:min(520px,100%);padding:20px;overflow:auto;',
      'background:linear-gradient(160deg,#f5f8ff,#fff3f9);box-shadow:-18px 0 55px rgba(30,35,75,.22);',
      'animation:reIn .32s cubic-bezier(.4,0,.2,1);box-sizing:border-box}',
      '@keyframes reIn{from{transform:translateX(28px);opacity:.4}to{transform:none;opacity:1}}',
      '.re-top{display:flex;align-items:start;justify-content:space-between;gap:12px;padding-bottom:14px;border-bottom:1px solid rgba(80,90,130,.11)}',
      '.re-top h2{margin:0;color:#292938;font-size:21px}',
      '.re-top p{margin:5px 0 0;color:#777887;font-size:12px}',
      '.re-close{width:48px;height:48px;flex:0 0 auto;border:0;border-radius:50%;background:rgba(91,141,239,.11);color:#3d63c9;font-size:22px;font-weight:900;cursor:pointer}',
      /* contador del día */
      '.re-cupo{margin-top:14px;padding:13px 15px;border-radius:15px;border:1px solid rgba(91,141,239,.2);',
      'background:linear-gradient(135deg,rgba(91,141,239,.1),rgba(160,107,255,.09))}',
      '.re-cupo b{display:block;color:#3a3a48;font-size:14px}',
      '.re-cupo small{display:block;margin-top:4px;color:#777887;font-size:11px;line-height:1.45}',
      '.re-barra{margin-top:9px;height:8px;border-radius:999px;background:rgba(91,141,239,.16);overflow:hidden}',
      '.re-barra i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#5b8def,#a06bff);transition:width .3s}',
      '.re-cupo.lleno{border-color:rgba(58,208,164,.3);background:rgba(58,208,164,.1)}',
      '.re-cupo.lleno b{color:#20705c}',
      /* listas */
      '.re-list{display:grid;gap:8px;margin-top:14px}',
      '.re-item{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:11px;align-items:center;width:100%;min-height:60px;',
      'padding:12px 14px;border:1px solid rgba(80,90,130,.1);border-radius:15px;background:#fff;font:inherit;',
      'text-align:left;cursor:pointer;transition:background .14s,border-color .14s}',
      '.re-item:hover{background:rgba(91,141,239,.07);border-color:rgba(91,141,239,.2)}',
      '.re-item .re-ico{font-size:20px}',
      '.re-item strong{display:block;color:#30303d;font-size:13.5px;font-weight:750}',
      '.re-item small{display:block;margin-top:2px;color:#777887;font-size:10.5px;line-height:1.4}',
      '.re-n{display:inline-grid;place-items:center;min-width:32px;height:28px;padding:0 9px;border-radius:999px;',
      'background:linear-gradient(135deg,#5b8def,#a06bff);color:#fff;font-size:12px;font-weight:900}',
      '.re-go{color:#3d63c9;font-size:17px;font-weight:900}',
      /* fila */
      '.re-quien{margin-top:14px;padding:14px 15px;border-radius:15px;background:#fff;border:1px solid rgba(80,90,130,.1)}',
      '.re-quien b{display:block;color:#30303d;font-size:15px}',
      '.re-quien small{display:block;margin-top:4px;color:#777887;font-size:11.5px;line-height:1.5}',
      '.re-prev{margin-top:12px;padding:13px 14px;border:1px solid rgba(58,208,164,.22);border-radius:14px;background:rgba(58,208,164,.08);',
      'color:#20705c;font-size:12.5px;line-height:1.55;white-space:pre-wrap;word-break:break-word}',
      '.re-prev b{display:block;margin-bottom:6px;color:#178a6c;font-size:10.5px;font-weight:900;text-transform:uppercase;letter-spacing:.4px}',
      '.re-enviar{width:100%;min-height:52px;margin-top:13px;border:0;border-radius:15px;background:linear-gradient(135deg,#25d366,#128C7E);',
      'color:#fff;font:inherit;font-size:14px;font-weight:850;cursor:pointer;box-shadow:0 7px 18px rgba(18,140,126,.26)}',
      '.re-sec{width:100%;min-height:44px;margin-top:9px;border:0;border-radius:13px;background:rgba(91,141,239,.11);color:#3d63c9;',
      'font:inherit;font-size:12.5px;font-weight:850;cursor:pointer}',
      '.re-sec:hover{background:rgba(91,141,239,.2)}',
      '.re-pos{margin-top:12px;color:#777887;font-size:11px;text-align:center;font-weight:700}',
      /* marcar respuesta */
      '.re-marcar{margin-top:14px;padding-top:13px;border-top:1px solid rgba(80,90,130,.12)}',
      '.re-marcar>span{display:block;margin-bottom:9px;color:#777887;font-size:10.5px;font-weight:900;text-transform:uppercase;letter-spacing:.4px}',
      '.re-chips{display:grid;grid-template-columns:1fr 1fr;gap:7px}',
      '.re-chip{display:flex;align-items:center;gap:7px;min-height:44px;padding:9px 11px;border:1px solid rgba(80,90,130,.14);',
      'border-radius:13px;background:#fff;color:#4a4a58;font:inherit;font-size:11.5px;font-weight:800;text-align:left;cursor:pointer}',
      '.re-chip:hover{background:rgba(91,141,239,.08)}',
      '.re-chip.on{border-color:transparent;color:#fff}',
      '.re-estado{display:inline-flex;align-items:center;gap:5px;margin-top:7px;padding:4px 10px;border-radius:999px;',
      'font-size:10.5px;font-weight:900;color:#fff}',
      /* varios */
      /* los que contestaron: es el resultado de la campaña, tiene que gritar */
      '.re-item.re-destacado{border-color:rgba(58,208,164,.4);background:linear-gradient(135deg,rgba(58,208,164,.12),rgba(91,141,239,.08))}',
      '.re-item.re-destacado strong{color:#20705c}',
      '.re-item.re-destacado .re-n{background:linear-gradient(135deg,#3ad0a4,#25b88f)}',
      '.re-logro{margin-top:12px;padding:12px 14px;border-radius:14px;background:rgba(58,208,164,.1);color:#20705c;font-size:12.5px;font-weight:800}',
      '.re-logro small{display:block;margin-top:3px;color:#59897c;font-size:10.5px;font-weight:600}',
      '.re-logro-btn{width:100%;min-height:50px;border:0;border-radius:14px;background:linear-gradient(135deg,#3ad0a4,#25b88f);',
      'color:#fff;font:inherit;font-size:13.5px;font-weight:850;cursor:pointer;box-shadow:0 6px 16px rgba(37,184,143,.26)}',
      '.re-hint{display:block;margin-top:8px;color:#777887;font-size:10.5px;line-height:1.45;text-align:center}',
      /* el aviso de WhatsApp: es serio, así que se ve serio */
      '.re-aviso{margin-top:14px}',
      '.re-aviso-ico{width:56px;height:56px;margin:0 auto 12px;border-radius:18px;display:grid;place-items:center;',
      'background:linear-gradient(135deg,#f5b301,#ff8f6b);font-size:27px;box-shadow:0 8px 20px rgba(245,179,1,.28)}',
      '.re-aviso h3{margin:0 0 8px;color:#292938;font-size:18px;text-align:center}',
      '.re-aviso-bajada{margin:0 0 16px;padding:13px 14px;border-radius:14px;background:rgba(217,83,79,.09);',
      'border:1px solid rgba(217,83,79,.18);color:#a33b37;font-size:12.5px;line-height:1.55;text-align:center}',
      '.re-aviso-bajada b{color:#8d2b28}',
      '.re-regla{display:grid;grid-template-columns:auto minmax(0,1fr);gap:11px;align-items:start;',
      'padding:12px 13px;margin-bottom:8px;border-radius:14px;background:#fff;border:1px solid rgba(80,90,130,.1)}',
      '.re-regla-n{display:grid;place-items:center;width:26px;height:26px;border-radius:50%;',
      'background:linear-gradient(135deg,#5b8def,#a06bff);color:#fff;font-size:12.5px;font-weight:900}',
      '.re-regla b{display:block;color:#30303d;font-size:13px;font-weight:800}',
      '.re-regla small{display:block;margin-top:3px;color:#777887;font-size:11px;line-height:1.5}',
      '.re-aviso-pie{margin-top:13px;padding:12px 14px;border-radius:14px;background:rgba(91,141,239,.09);',
      'color:#3d63c9;font-size:11.5px;line-height:1.55;text-align:center}',
      '.re-aviso-ok{margin-top:16px}',
      'body.dark .re-aviso h3{color:#f2f2f7}',
      'body.dark .re-regla{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.1)}',
      'body.dark .re-regla b{color:#f2f2f7}',
      '.re-nota{margin-top:14px;padding:12px 14px;border-radius:14px;background:rgba(245,179,1,.11);color:#8a6100;font-size:11.5px;line-height:1.55}',
      '.re-vacio{margin-top:16px;padding:22px 16px;border-radius:15px;background:rgba(255,255,255,.7);color:#777887;',
      'font-size:12.5px;text-align:center;line-height:1.6}',
      '.re-volver{margin-top:14px;min-height:40px;padding:9px 14px;border:0;border-radius:12px;background:rgba(91,141,239,.11);',
      'color:#3d63c9;font:inherit;font-size:12px;font-weight:850;cursor:pointer}',
      '.re-volver:hover{background:rgba(91,141,239,.2)}',
      '.re-caja textarea{width:100%;min-height:150px;margin-top:12px;padding:12px 13px;border:1px solid rgba(80,90,130,.16);',
      'border-radius:14px;background:#fff;color:#292938;font:inherit;font-size:13px;line-height:1.5;resize:vertical;box-sizing:border-box}',
      '.re-fin{margin-top:18px;padding:26px 16px;border-radius:16px;background:rgba(58,208,164,.1);text-align:center}',
      '.re-fin-ico{font-size:40px}',
      '.re-fin b{display:block;margin-top:10px;color:#20705c;font-size:16px}',
      '.re-fin p{margin:6px 0 0;color:#59897c;font-size:12.5px;line-height:1.5}',
      'body.dark .re-panel{background:linear-gradient(160deg,#20222e,#262232)}',
      'body.dark .re-top h2{color:#f2f2f7}',
      'body.dark .re-item,body.dark .re-quien,body.dark .re-chip{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.1)}',
      'body.dark .re-item strong,body.dark .re-quien b{color:#f2f2f7}',
      'body.dark .re-cupo b{color:#f2f2f7}',
      'body.dark .re-caja textarea{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.12);color:#f2f2f7}'
    ].join('');
    document.head.appendChild(st);
  }

  /* ---------- el aviso de WhatsApp ---------- */
  /* Se muestra la primera vez que se abre la campaña. Es lo único de la app
     que puede costarle al distribuidor su herramienta de trabajo: WhatsApp no
     avisa antes de restringir una cuenta, y recuperarla no siempre se puede. */
  function vioElAviso(){ return !!leer().avisoVisto; }
  function marcarAvisoVisto(){
    var d = leer();
    d.avisoVisto = new Date().toISOString();
    guardar(d);
  }

  function avisoHtml(){
    return '<div class="re-aviso">' +
      '<div class="re-aviso-ico">⚠️</div>' +
      '<h3>Antes de empezar, leé esto</h3>' +
      '<p class="re-aviso-bajada">Vas a escribirle a gente que hace años no te habla. ' +
      'Para WhatsApp eso se parece bastante al spam, y si se pasa de la raya ' +
      '<b>te puede restringir o bloquear el número</b>. Casi nunca se recupera.</p>' +

      '<div class="re-regla"><span class="re-regla-n">1</span><div>' +
      '<b>Máximo ' + TOPE_DIARIO + ' por día</b>' +
      '<small>La app te frena sola cuando llegás. No busques la vuelta: es el límite que hace que esto sea seguro.</small>' +
      '</div></div>' +

      '<div class="re-regla"><span class="re-regla-n">2</span><div>' +
      '<b>Espaciados, no todos juntos</b>' +
      '<small>Quince mensajes en cinco minutos es una señal clarísima. Repartilos a lo largo del día.</small>' +
      '</div></div>' +

      '<div class="re-regla"><span class="re-regla-n">3</span><div>' +
      '<b>Cambiá algo en cada uno</b>' +
      '<small>El mensaje ya lleva el nombre y el barrio de cada persona. Si además le agregás una línea propia, mejor todavía.</small>' +
      '</div></div>' +

      '<div class="re-regla"><span class="re-regla-n">4</span><div>' +
      '<b>Respetá el “no molestar”</b>' +
      '<small>Al que te pide que no le escribas más, marcalo. Si insistís, te reporta — y varios reportes es lo que dispara el bloqueo.</small>' +
      '</div></div>' +

      '<div class="re-regla"><span class="re-regla-n">5</span><div>' +
      '<b>Al que contesta, contestale</b>' +
      '<small>Una conversación de ida y vuelta le dice a WhatsApp que sos una persona, no un robot. Es lo que mejor protege tu número.</small>' +
      '</div></div>' +

      '<div class="re-aviso-pie">Si te llega un aviso de WhatsApp, parate unos días. ' +
      'Más vale tardar tres meses en recorrer la lista que quedarte sin el número.</div>' +
      '</div>';
  }

  function verAviso(despues){
    var ov = overlay();
    var cuerpo = ov.querySelector('#reCuerpo');
    ov.querySelector('#reTitulo').textContent = 'Cuidar tu número';
    ov.querySelector('#reSub').textContent = 'Cinco reglas, una sola vez';
    cuerpo.innerHTML = avisoHtml() +
      '<button type="button" class="re-enviar re-aviso-ok" id="reAvisoOk">Entendido, arranquemos</button>';
    cuerpo.querySelector('#reAvisoOk').onclick = function(){
      marcarAvisoVisto();
      if (typeof despues === 'function') despues();
      else abrir();
    };
    ov.classList.add('open');
  }

  /* ---------- popup ---------- */
  var fila = null;

  function overlay(){
    var ov = document.getElementById('reOverlay');
    if (ov) return ov;
    css();
    ov = document.createElement('div');
    ov.className = 're-ov';
    ov.id = 'reOverlay';
    ov.innerHTML = '<div class="re-panel" role="dialog" aria-modal="true" aria-labelledby="reTitulo">' +
      '<div class="re-top"><div><h2 id="reTitulo">Dormidos</h2><p id="reSub"></p></div>' +
      '<button type="button" class="re-close" id="reCerrar" aria-label="Cerrar">×</button></div>' +
      '<div id="reCuerpo"></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function(e){ if (e.target === ov) cerrar(); });
    ov.querySelector('#reCerrar').onclick = cerrar;
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && ov.classList.contains('open')) cerrar();
    });
    return ov;
  }
  function cerrar(){
    var ov = document.getElementById('reOverlay');
    if (ov) ov.classList.remove('open');
    fila = null;
  }

  function cupoHtml(){
    var usados = mandadosHoy();
    var quedan = quedanHoy();
    var pct = Math.min(100, Math.round(usados / TOPE_DIARIO * 100));
    if (!quedan){
      return '<div class="re-cupo lleno"><b>✅ Por hoy alcanza</b>' +
        '<small>Mandaste los ' + TOPE_DIARIO + ' de hoy. Mañana seguís: es a propósito, ' +
        'mandar de más hace que WhatsApp te bloquee el número.</small>' +
        '<div class="re-barra"><i style="width:100%"></i></div></div>';
    }
    return '<div class="re-cupo"><b>Te quedan ' + quedan + ' de los ' + TOPE_DIARIO + ' de hoy</b>' +
      '<small>El tope protege tu número: son mensajes a gente que hace años no te escribe. ' +
      'Mandalos espaciados, no todos juntos.</small>' +
      '<div class="re-barra"><i style="width:' + pct + '%"></i></div></div>';
  }

  /* Pantalla 1: las olas */
  function abrir(){
    var ov = overlay();
    fila = null;
    // La primera vez, las reglas antes que nada.
    if (!vioElAviso()){ verAviso(); return; }
    var cuerpo = ov.querySelector('#reCuerpo');
    ov.querySelector('#reTitulo').textContent = '😴 Clientes dormidos';
    var grupos = porOla();
    var total = 0;
    grupos.forEach(function(g){ total += g.gente.length; });
    ov.querySelector('#reSub').textContent = total ? total + ' sin contacto hace más de un año' : '';

    if (!total){
      cuerpo.innerHTML = '<div class="re-vacio">No hay clientes dormidos en esta lista.<br>' +
        'Aparecen acá los que tienen la garantía vencida hace más de un año.</div>';
      ov.classList.add('open');
      return;
    }

    var html = cupoHtml();

    // Lo primero de todo: los que ya contestaron. Es el resultado de la
    // campaña, y si queda enterrado abajo se pierde la venta que ya ganaste.
    var conts = contestaron();
    if (conts.length){
      html += '<div class="re-list"><button type="button" class="re-item re-destacado" id="reContestaron">' +
        '<span class="re-ico">🔥</span>' +
        '<span><strong>' + conts.length + (conts.length === 1 ? ' te contestó' : ' te contestaron') + '</strong>' +
        '<small>Seguilos ahora, es lo que vale de toda la campaña</small></span>' +
        '<span class="re-n">' + conts.length + '</span></button></div>';
    }

    html += '<div class="re-list">';
    grupos.forEach(function(g){
      html += '<button type="button" class="re-item" data-re-ola="' + esc(g.ola.id) + '">' +
        '<span class="re-ico">' + g.ola.icono + '</span>' +
        '<span><strong>' + esc(g.ola.nombre) + '</strong><small>' + esc(g.ola.pista) + '</small></span>' +
        '<span class="re-n">' + g.gente.length + '</span></button>';
    });
    html += '</div>';
    var revs = revividos();
    if (revs.length){
      html += '<div class="re-logro">🎉 ' + revs.length +
        (revs.length === 1 ? ' cliente reactivado' : ' clientes reactivados') +
        '<small>Volvieron al circuito normal de mantenimiento</small></div>';
    }
    html += '<div class="re-nota">Empezá por un solo barrio de la primera ola. Con esa tanda vas a ' +
      'aprender qué contestan, y te queda el resto de la lista intacta para hacerlo mejor.</div>';
    html += '<button type="button" class="re-volver" id="reEditar">✏️ Editar los mensajes</button>';
    html += '<button type="button" class="re-volver" id="reVerAviso">⚠️ Cómo cuidar tu número</button>';
    cuerpo.innerHTML = html;

    cuerpo.querySelectorAll('[data-re-ola]').forEach(function(b){
      b.onclick = function(){ verBarrios(b.getAttribute('data-re-ola')); };
    });
    var bc = cuerpo.querySelector('#reContestaron');
    if (bc) bc.onclick = verContestaron;
    cuerpo.querySelector('#reEditar').onclick = elegirQueEditar;
    cuerpo.querySelector('#reVerAviso').onclick = function(){ verAviso(abrir); };
    ov.classList.add('open');
  }

  /* Los que contestaron: la lista que hay que trabajar. */
  function verContestaron(){
    var ov = overlay();
    var cuerpo = ov.querySelector('#reCuerpo');
    var gente = contestaron();
    ov.querySelector('#reTitulo').textContent = '🔥 Te contestaron';
    ov.querySelector('#reSub').textContent = gente.length ? 'Elegí a quién seguirle la conversación' : '';

    if (!gente.length){
      cuerpo.innerHTML = '<div class="re-vacio">Todavía no marcaste a nadie como “contestó”.<br>' +
        'Cuando alguien te responda, marcalo y va a aparecer acá.</div>' +
        '<button type="button" class="re-volver" id="reVolverC">‹ Volver</button>';
      cuerpo.querySelector('#reVolverC').onclick = abrir;
      ov.classList.add('open');
      return;
    }

    var html = '<div class="re-list">';
    gente.forEach(function(u, i){
      var ant = antiguedad(u);
      var anios = ant ? Math.floor(ant / 365) : 0;
      html += '<button type="button" class="re-item" data-re-cont="' + i + '">' +
        '<span class="re-ico">💬</span>' +
        '<span><strong>' + esc(u.usuario || '') + '</strong><small>' +
        esc(u.localidad || '') + ' · venció hace ' + anios + (anios === 1 ? ' año' : ' años') +
        '</small></span><span class="re-go">›</span></button>';
    });
    html += '</div>';
    html += '<button type="button" class="re-volver" id="reVolverC">‹ Volver</button>';
    cuerpo.innerHTML = html;
    cuerpo.querySelectorAll('[data-re-cont]').forEach(function(b){
      b.onclick = function(){ verSeguimiento(gente[Number(b.getAttribute('data-re-cont'))]); };
    });
    cuerpo.querySelector('#reVolverC').onclick = abrir;
    ov.classList.add('open');
  }

  /* La ficha del que contestó: qué respondió y cómo se le sigue. */
  function verSeguimiento(u){
    var ov = overlay();
    var cuerpo = ov.querySelector('#reCuerpo');
    var nombre = (typeof window.nombreDePila === 'function' ? window.nombreDePila(u.usuario) : '') || u.usuario;
    ov.querySelector('#reTitulo').textContent = '💬 ' + nombre;
    ov.querySelector('#reSub').textContent = '¿Qué te contestó?';

    var html = '<div class="re-quien"><b>' + esc(u.usuario || '') + '</b><small>' +
      esc([u.domicilio, u.localidad, u.producto].filter(Boolean).join(' · ')) + '</small></div>';
    html += '<div class="re-list">';
    seguimientos().forEach(function(s){
      var resumen = completar(s.texto, u).replace(/\n+/g, ' ').slice(0, 64);
      html += '<button type="button" class="re-item" data-re-seg="' + esc(s.id) + '">' +
        '<span class="re-ico">' + s.icono + '</span>' +
        '<span><strong>' + esc(s.nombre) + (s.editada ? ' ✏️' : '') + '</strong>' +
        '<small>' + esc(resumen) + '…</small></span>' +
        '<span class="re-go">💬</span></button>';
    });
    html += '</div>';
    html += '<div class="re-marcar"><span>¿Ya volvió a ser cliente?</span>' +
      '<button type="button" class="re-logro-btn" id="reReactivar">🎉 Lo reactivé</button>' +
      '<small class="re-hint">Sale de esta campaña y vuelve al circuito normal de mantenimiento.</small></div>';
    html += '<button type="button" class="re-volver" id="reVolverS">‹ Volver</button>';
    cuerpo.innerHTML = html;

    cuerpo.querySelectorAll('[data-re-seg]').forEach(function(b){
      b.onclick = function(){
        var s = seguimiento(b.getAttribute('data-re-seg'));
        if (!s) return;
        enviar(u, completar(s.texto, u), true);
        cerrar();
      };
    });
    cuerpo.querySelector('#reReactivar').onclick = function(){
      reactivar(u);
      if (typeof window.showToast === 'function') window.showToast('¡Cliente reactivado! 🎉');
      montar();
      // Vuelve al circuito normal: los pendientes del día lo toman de nuevo.
      if (window.APPIMensajes && window.APPIMensajes.pintarHoy) window.APPIMensajes.pintarHoy();
      verContestaron();
    };
    cuerpo.querySelector('#reVolverS').onclick = verContestaron;
    ov.classList.add('open');
  }

  /* Elegir qué texto editar: el primero o los de seguimiento. */
  function elegirQueEditar(){
    var ov = overlay();
    var cuerpo = ov.querySelector('#reCuerpo');
    ov.querySelector('#reTitulo').textContent = '✏️ Los mensajes';
    ov.querySelector('#reSub').textContent = 'Elegí cuál querés cambiar';

    var html = '<div class="re-list">';
    html += '<button type="button" class="re-item" data-re-edit="primero">' +
      '<span class="re-ico">👋</span><span><strong>El primer mensaje</strong>' +
      '<small>El que abre la conversación</small></span><span class="re-go">›</span></button>';
    seguimientos().forEach(function(s){
      html += '<button type="button" class="re-item" data-re-edit="' + esc(s.id) + '">' +
        '<span class="re-ico">' + s.icono + '</span>' +
        '<span><strong>' + esc(s.nombre) + (s.editada ? ' ✏️' : '') + '</strong>' +
        '<small>' + esc(s.pista) + '</small></span><span class="re-go">›</span></button>';
    });
    html += '</div>';
    html += '<button type="button" class="re-volver" id="reVolverE">‹ Volver</button>';
    cuerpo.innerHTML = html;
    cuerpo.querySelectorAll('[data-re-edit]').forEach(function(b){
      b.onclick = function(){
        var id = b.getAttribute('data-re-edit');
        if (id === 'primero') editarTexto();
        else editarSeguimiento(id);
      };
    });
    cuerpo.querySelector('#reVolverE').onclick = abrir;
    ov.classList.add('open');
  }

  function editarSeguimiento(id){
    var s = seguimiento(id);
    if (!s) return;
    var ov = overlay();
    var cuerpo = ov.querySelector('#reCuerpo');
    ov.querySelector('#reTitulo').textContent = s.icono + ' ' + s.nombre;
    ov.querySelector('#reSub').textContent = s.pista;

    var ejemplo = { usuario:'GOMEZ, ANA MARIA', localidad:'Alta Gracia', domicilio:'San Martín 120', fCompra:'15/03/2014' };
    var html = '<div class="re-caja"><textarea id="reTexto" spellcheck="true">' + esc(s.texto) + '</textarea></div>';
    html += '<div class="re-prev"><b>Ejemplo</b><span id="rePrev"></span></div>';
    html += '<button type="button" class="re-sec" id="reGuardar">Guardar</button>';
    if (s.editada) html += '<button type="button" class="re-sec" id="reRestaurar">Volver al texto original</button>';
    html += '<button type="button" class="re-volver" id="reVolver3">‹ Volver</button>';
    cuerpo.innerHTML = html;

    var ta = cuerpo.querySelector('#reTexto');
    var prev = cuerpo.querySelector('#rePrev');
    function repintar(){ prev.textContent = completar(ta.value, ejemplo); }
    repintar();
    ta.oninput = repintar;
    cuerpo.querySelector('#reGuardar').onclick = function(){
      guardarSeguimiento(id, ta.value);
      if (typeof window.showToast === 'function') window.showToast('Guardado ✓');
      elegirQueEditar();
    };
    var r = cuerpo.querySelector('#reRestaurar');
    if (r) r.onclick = function(){
      var base = null;
      for (var i=0;i<SEGUIMIENTOS.length;i++) if (SEGUIMIENTOS[i].id === id) base = SEGUIMIENTOS[i];
      if (base) guardarSeguimiento(id, base.texto);
      editarSeguimiento(id);
    };
    cuerpo.querySelector('#reVolver3').onclick = elegirQueEditar;
    ov.classList.add('open');
  }

  /* Pantalla 2: los barrios de esa ola */
  function verBarrios(olaId){
    var ov = overlay();
    var grupo = null;
    porOla().forEach(function(g){ if (g.ola.id === olaId) grupo = g; });
    if (!grupo) { abrir(); return; }

    var cuerpo = ov.querySelector('#reCuerpo');
    ov.querySelector('#reTitulo').textContent = grupo.ola.icono + ' ' + grupo.ola.nombre;
    ov.querySelector('#reSub').textContent = 'Elegí un barrio y recorrelo entero';

    var barrios = porBarrio(grupo.gente);
    var html = cupoHtml();
    html += '<div class="re-list">';
    barrios.forEach(function(b){
      html += '<button type="button" class="re-item" data-re-barrio="' + esc(b.barrio) + '">' +
        '<span class="re-ico">📍</span>' +
        '<span><strong>' + esc(b.barrio) + '</strong><small>' +
        (b.gente.length === 1 ? '1 cliente' : b.gente.length + ' clientes') + '</small></span>' +
        '<span class="re-n">' + b.gente.length + '</span></button>';
    });
    html += '</div>';
    html += '<div class="re-nota">Trabajar por barrio te deja decir “el jueves voy a estar por la zona”. ' +
      'Es el mensaje que mejor funciona, y te ordena las visitas.</div>';
    html += '<button type="button" class="re-volver" id="reVolver">‹ Volver</button>';
    cuerpo.innerHTML = html;

    cuerpo.querySelectorAll('[data-re-barrio]').forEach(function(btn){
      btn.onclick = function(){
        var nombre = btn.getAttribute('data-re-barrio');
        var elegido = null;
        barrios.forEach(function(b){ if (b.barrio === nombre) elegido = b; });
        if (elegido) arrancarFila(grupo.ola, elegido);
      };
    });
    cuerpo.querySelector('#reVolver').onclick = abrir;
    ov.classList.add('open');
  }

  /* Pantalla 3: la fila, de a uno */
  function arrancarFila(ola, barrio){
    fila = { ola:ola, barrio:barrio.barrio, gente:barrio.gente.slice(), i:0, hechos:0 };
    pintarFila();
  }

  function pintarFila(){
    if (!fila) return;
    var ov = overlay();
    var cuerpo = ov.querySelector('#reCuerpo');

    if (!quedanHoy()){
      ov.querySelector('#reTitulo').textContent = 'Por hoy alcanza';
      ov.querySelector('#reSub').textContent = '';
      cuerpo.innerHTML = cupoHtml() +
        '<div class="re-vacio">Llegaste al tope de hoy.<br>Mañana seguís donde quedaste.</div>' +
        '<button type="button" class="re-sec" id="reFinCerrar">Cerrar</button>';
      cuerpo.querySelector('#reFinCerrar').onclick = cerrar;
      ov.classList.add('open');
      return;
    }

    if (fila.i >= fila.gente.length){
      ov.querySelector('#reTitulo').textContent = '¡Listo!';
      ov.querySelector('#reSub').textContent = '';
      cuerpo.innerHTML = '<div class="re-fin"><div class="re-fin-ico">✅</div>' +
        '<b>' + fila.hechos + (fila.hechos === 1 ? ' mensaje enviado' : ' mensajes enviados') + '</b>' +
        '<p>Terminaste ' + esc(fila.barrio) + '. Los que contesten los vas marcando desde acá.</p></div>' +
        '<button type="button" class="re-sec" id="reFinVolver">Volver a la lista</button>';
      cuerpo.querySelector('#reFinVolver').onclick = abrir;
      ov.classList.add('open');
      return;
    }

    var u = fila.gente[fila.i];
    var texto = completar(plantilla(), u);
    var nombre = (typeof window.nombreDePila === 'function' ? window.nombreDePila(u.usuario) : '') || u.usuario;
    var ant = antiguedad(u);
    var anios = ant ? Math.floor(ant / 365) : 0;
    var e = estadoDe(u);

    ov.querySelector('#reTitulo').textContent = '📍 ' + fila.barrio;
    ov.querySelector('#reSub').textContent = (fila.i + 1) + ' de ' + fila.gente.length +
      ' · quedan ' + quedanHoy() + ' hoy';

    var html = '<div class="re-quien"><b>' + esc(u.usuario || '') + '</b><small>' +
      esc([u.domicilio, u.producto].filter(Boolean).join(' · ')) + '<br>' +
      'Venció hace ' + (anios >= 1 ? anios + (anios === 1 ? ' año' : ' años') : ant + ' días') +
      (u.fVenceRaw ? ' · ' + esc(u.fVenceRaw) : '') + '</small>';
    if (e){
      var info = estadoInfo(e.estado);
      if (info) html += '<span class="re-estado" style="background:' + info.color + '">' + info.icono + ' ' + esc(info.nombre) + '</span>';
    }
    html += '</div>';
    html += '<div class="re-prev"><b>Así lo va a recibir</b>' + esc(texto) + '</div>';
    html += '<button type="button" class="re-enviar" id="reEnviar">💬 Mandar a ' + esc(nombre) + '</button>';
    html += '<button type="button" class="re-sec" id="reSaltar">Saltear</button>';

    html += '<div class="re-marcar"><span>¿Qué pasó con este contacto?</span><div class="re-chips">';
    ESTADOS.forEach(function(s){
      var on = e && e.estado === s.id;
      html += '<button type="button" class="re-chip' + (on ? ' on' : '') + '" data-re-estado="' + esc(s.id) + '"' +
        (on ? ' style="background:' + s.color + '"' : '') + '>' +
        '<span>' + s.icono + '</span>' + esc(s.nombre) + '</button>';
    });
    html += '</div></div>';
    html += '<button type="button" class="re-volver" id="reVolverBarrios">‹ Volver a los barrios</button>';
    cuerpo.innerHTML = html;

    cuerpo.querySelector('#reEnviar').onclick = function(){
      enviar(u, texto);
      fila.hechos++;
      fila.i++;
      pintarFila();
    };
    cuerpo.querySelector('#reSaltar').onclick = function(){ fila.i++; pintarFila(); };
    cuerpo.querySelectorAll('[data-re-estado]').forEach(function(b){
      b.onclick = function(){
        var id = b.getAttribute('data-re-estado');
        var actual = estadoDe(u);
        marcar(u, actual && actual.estado === id ? null : id);
        pintarFila();
      };
    });
    cuerpo.querySelector('#reVolverBarrios').onclick = function(){ verBarrios(fila.ola.id); };
    ov.classList.add('open');
  }

  /* Editar el mensaje de la campaña */
  function editarTexto(){
    var ov = overlay();
    var cuerpo = ov.querySelector('#reCuerpo');
    ov.querySelector('#reTitulo').textContent = '✏️ El mensaje';
    ov.querySelector('#reSub').textContent = 'Corto y con una pregunta fácil de contestar';

    var ejemplo = { usuario:'GOMEZ, ANA MARIA', localidad:'Alta Gracia', domicilio:'San Martín 120', fCompra:'15/03/2014' };
    var html = '<div class="re-nota">Este primer mensaje no vende nada: sólo pregunta. ' +
      'Cuanto más corto, más gente contesta.</div>';
    html += '<div class="re-caja"><textarea id="reTexto" spellcheck="true">' + esc(plantilla()) + '</textarea></div>';
    html += '<div class="re-prev"><b>Ejemplo</b><span id="rePrev"></span></div>';
    html += '<button type="button" class="re-sec" id="reGuardar">Guardar</button>';
    if (plantilla() !== PLANTILLA_BASE) html += '<button type="button" class="re-sec" id="reRestaurar">Volver al texto original</button>';
    html += '<button type="button" class="re-volver" id="reVolver2">‹ Volver</button>';
    cuerpo.innerHTML = html;

    var ta = cuerpo.querySelector('#reTexto');
    var prev = cuerpo.querySelector('#rePrev');
    function repintar(){ prev.textContent = completar(ta.value, ejemplo); }
    repintar();
    ta.oninput = repintar;
    cuerpo.querySelector('#reGuardar').onclick = function(){
      guardarTexto(ta.value);
      if (typeof window.showToast === 'function') window.showToast('Guardado ✓');
      abrir();
    };
    var r = cuerpo.querySelector('#reRestaurar');
    if (r) r.onclick = function(){ guardarTexto(PLANTILLA_BASE); editarTexto(); };
    cuerpo.querySelector('#reVolver2').onclick = abrir;
    ov.classList.add('open');
  }

  /* ---------- botón en la barra ---------- */
  function montar(){
    var barra = document.querySelector('#view-usuarios .u-tools');
    if (!barra) return;
    css();
    var b = document.getElementById('usuariosBtnDormidos');
    var n = dormidos().length;
    if (!n){
      // Sin dormidos no hay botón: la pantalla queda como estaba.
      if (b) b.remove();
      return;
    }
    if (!b){
      b = document.createElement('button');
      b.type = 'button';
      b.id = 'usuariosBtnDormidos';
      b.onclick = abrir;
      var limpiar = document.getElementById('usuariosBtnLimpiar');
      if (limpiar) barra.insertBefore(b, limpiar);
      else barra.appendChild(b);
    }
    b.innerHTML = '<span>😴</span>Dormidos';
  }

  function observar(){
    var cont = document.getElementById('usuariosList');
    if (!cont || cont.__reObs) return;
    cont.__reObs = true;
    new MutationObserver(function(){ montar(); }).observe(cont, { childList:true, subtree:true });
  }

  function envolver(){
    if (window.__reWrapped) return;
    if (typeof window.showView !== 'function') return;
    window.__reWrapped = true;
    var orig = window.showView;
    window.showView = function(id){
      var r = orig.apply(this, arguments);
      try{ if (id === 'view-usuarios') setTimeout(function(){ montar(); observar(); }, 70); }catch(e){}
      return r;
    };
  }

  window.APPIReactivacion = {
    OLAS: OLAS,
    ESTADOS: ESTADOS,
    SEGUIMIENTOS: SEGUIMIENTOS,
    TOPE_DIARIO: TOPE_DIARIO,
    PLANTILLA_BASE: PLANTILLA_BASE,
    contestaron: contestaron,
    porContactar: porContactar,
    reactivar: reactivar,
    deshacerReactivar: deshacerReactivar,
    esRevivido: esRevivido,
    revividos: revividos,
    seguimientos: seguimientos,
    seguimiento: seguimiento,
    guardarSeguimiento: guardarSeguimiento,
    verContestaron: verContestaron,
    verAviso: verAviso,
    vioElAviso: vioElAviso,
    dormidos: dormidos,
    porOla: porOla,
    porBarrio: porBarrio,
    olaDe: olaDe,
    antiguedad: antiguedad,
    estadoDe: estadoDe,
    marcar: marcar,
    mandadosHoy: mandadosHoy,
    quedanHoy: quedanHoy,
    plantilla: plantilla,
    guardarTexto: guardarTexto,
    completar: completar,
    abrir: abrir,
    cerrar: cerrar,
    montar: montar
  };

  if (document.readyState === 'complete') envolver();
  else window.addEventListener('load', envolver);
  setTimeout(envolver, 900);
})();
