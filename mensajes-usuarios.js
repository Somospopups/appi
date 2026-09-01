/* ============================================================
   APPI · Mensajes para usuarios de Garantías
   ------------------------------------------------------------
   Plantillas amigables listas para mandar por WhatsApp, con los
   datos del cliente ya puestos: nombre, producto, domicilio,
   fechas. Se escribe el texto una vez y la app lo completa.

   Etapa 1: la biblioteca de plantillas y el botón de cada ficha.
   El panel "Hoy" con los pendientes viene en la etapa 2, y se
   apoya en las reglas de vigencia que ya viven acá abajo.

   Quién recibe qué (decidido con el usuario):
     - vigente ................. mantenimiento + cumpleaños
     - vencido hace < 1 año .... sólo renovación
     - vencido hace > 1 año .... nada

   Jornada de usuarios (v397): las 10 de hoy, mismo tope que WhatsApp.
   Partido del día (v398): ganar es hacer las que hay (✓). La ✗ no suma.
   Lista de la cuenta (v399): titular y socio ven las mismas 10. Si uno
   ya la hizo, al otro no le queda pendiente. El partido es de la casa.
   Sin tareas no hay partido y la racha no se corta.
   Cada día se arman hasta CUPO_DIA acciones, en este orden:
     1. cumpleaños de hoy (entran primero y cuentan)
     2. garantía a 0–30 días, las más cercanas primero
     3. mantenimiento caído, los más viejos primero
     4. canje (vencido < 1 año), los más antiguos primero
     5. check-in a vigentes sin escribirles en 90 días
   Si el calendario está flojo, los usuarios rellenan. Si hay 20
   vencimientos, se reparte: hoy salen 10, mañana los que siguen.
   Una persona no aparece dos veces el mismo día. El mazo del Home
   no ofrece a nadie que no esté en estas 10.
   ============================================================ */
(function(){
  'use strict';

  var LINK_RETROLAVADO = 'https://www.youtube.com/watch?v=qa6xkQQsyg8';
  var LINK_CANJE = 'https://www.youtube.com/watch?v=evwYO9-o5MY';
  var MESES_MANTENIMIENTO = 6;   // el ciclo que pidió el usuario
  var DIAS_ANIO = 365;
  var CUPO_DIA = 10;             // las 10 de hoy: mismo tope que WhatsApp
  var DIAS_CHECKIN = 90;         // vigentes sin contacto: vuelven a la cola

  /* ---------- plantillas de fábrica ----------
     El usuario las edita desde la app; estas son el punto de partida.
     `grupo` marca a quién le corresponde según la vigencia. */
  var BASE = [
    {
      id: 'retrolavado',
      icono: '🔧',
      nombre: 'Retrolavado',
      grupo: 'vigente',
      texto: [
        'Hola {nombre}! 👋',
        '',
        'Me acordé de tu equipo: ya pasaron unos meses y le vendría bien un retrolavado.',
        '',
        'Te dejo el video con el paso a paso:',
        '{link_retrolavado}',
        '',
        'Es simple, en 5 minutos lo tenés listo.'
      ].join('\n')
    },
    {
      id: 'cumple',
      icono: '🎂',
      nombre: 'Cumpleaños',
      grupo: 'vigente',
      texto: [
        '¡Feliz cumpleaños, {nombre}! 🎂🎉',
        '',
        'Te mando un saludo grande en tu día. Que lo disfrutes mucho.',
        '',
        '¡Un abrazo!'
      ].join('\n')
    },
    {
      id: 'porvencer',
      icono: '⏰',
      nombre: 'Vida útil por cumplirse',
      grupo: 'vigente',
      texto: [
        'Hola {nombre}! ¿Cómo andás? 😊',
        '',
        'Te escribo porque el {vence} tu equipo cumple su vida útil. A partir de ahí ya no puede garantizar que no se desarrollen microorganismos adentro, que es justamente lo que lo hace seguro.',
        '',
        'Esta semana voy a estar por {localidad}. ¿Querés que pase, lo revisemos y te explico cómo es el canje? ¿Qué día te queda mejor?'
      ].join('\n')
    },
    {
      id: 'renovacion',
      icono: '🔄',
      nombre: 'Equipo vencido',
      grupo: 'vencido',
      texto: [
        'Hola {nombre}! ¿Cómo estás? 😊',
        '',
        'Vi que tu equipo cumplió la vida útil el {vence}.',
        '',
        'Cuando eso pasa hay tres motivos para el canje: ya no se garantiza que no crezcan microorganismos adentro, el carbón activado se satura (deja de retener bien el sabor y el color) y los otros medios (KDF, resinas) también se agotan.',
        '',
        'Por eso existe el canje. No es un trámite: es para que el agua siga estando bien.',
        '',
        'Te dejo este video, es un minutito y lo explica re claro:',
        '{link_canje}',
        '',
        'Cuando puedas lo mirás. Si querés paso un día de estos y lo charlamos tranquilos.'
      ].join('\n')
    },
    {
      id: 'saludo',
      icono: '👋',
      nombre: 'Saludo suelto',
      grupo: 'todos',
      texto: [
        'Hola {nombre}! ¿Cómo andás? 😊',
        '',
        'Pasaba a saludarte y a preguntarte cómo viene funcionando el equipo.'
      ].join('\n')
    },
    {
      id: 'visita',
      icono: '📅',
      nombre: 'Coordinar una visita',
      grupo: 'todos',
      texto: [
        '{nombre}, ¿qué día te viene bien que pase? Yo me acomodo.'
      ].join('\n')
    },
    {
      id: 'referido',
      icono: '👋',
      nombre: 'Pedir un nombre',
      grupo: 'todos',
      texto: [
        '{nombre}, ¿se te ocurre alguien a quien le vendría bien que le cuente? Con un nombre y un teléfono me alcanza. ¡Gracias!'
      ].join('\n')
    }
  ];

  /* ---------- mensajes de mantenimiento e instalación por producto (v342) ----------
     Predefinidos con el video de cada equipo. El distribuidor elige el que
     corresponde según el producto del cliente, desde el carrusel (🔁 Cambiar
     mensaje) o desde el editor. `grupo` separa Mantenimiento (cada 6 meses)
     de Instalación y puesta en marcha. */
  function _mm(id, icono, grupo, nombre, texto){
    return { id: id, icono: icono, grupo: grupo, nombre: nombre, texto: texto };
  }
  var MANTENIMIENTOS = [
    // — Grupo 1: Mantenimiento (lo que se hace cada 6 meses)
    _mm('mant_senik', '🔧', 'mantenimiento', 'Mantenimiento · PSA Senik',
      'Hola {nombre}! 😊\n\nTu PSA Senik ya está listo para su mantenimiento. Te dejo el video con el paso a paso:\nhttps://www.youtube.com/watch?v=RxnqnLtDjis\n\nEs simple y en 5 minutos lo tenés listo. Cualquier duda me escribís.'),
    _mm('mant_senik_bm', '🔧', 'mantenimiento', 'Mantenimiento · PSA Senik Bajo Mesada',
      'Hola {nombre}! 😊\n\nTu PSA Senik Bajo Mesada ya está listo para su mantenimiento. Te dejo el video con el paso a paso:\nhttps://www.youtube.com/watch?v=t9QRKohc-30\n\nEs simple y en 5 minutos lo tenés listo. Cualquier duda me escribís.'),
    _mm('mant_domus', '🔧', 'mantenimiento', 'Mantenimiento · PSA Domus',
      'Hola {nombre}! 😊\n\nTu PSA Domus ya está listo para su mantenimiento. Te dejo el video con el paso a paso:\nhttps://www.youtube.com/watch?v=5nEBNeL0k5A\n\nEs simple y en 5 minutos lo tenés listo. Cualquier duda me escribís.'),
    _mm('mant_griferia', '🔧', 'mantenimiento', 'Mantenimiento · Grifería bicomando',
      'Hola {nombre}! 😊\n\nTu grifería bicomando ya está lista para su mantenimiento. Te dejo el video con el paso a paso:\nhttps://www.youtube.com/watch?v=0qBeaiFAckA\n\nEs simple y en 5 minutos lo tenés listo. Cualquier duda me escribís.'),
    _mm('mant_iontrix', '🔧', 'mantenimiento', 'Mantenimiento · PSA Iontrix 3',
      'Hola {nombre}! 😊\n\nTu PSA Iontrix 3 ya está listo para su mantenimiento. Te dejo el video con el paso a paso:\nhttps://www.youtube.com/watch?v=UdEL7fdUy5I\n\nEs simple y en 5 minutos lo tenés listo. Cualquier duda me escribís.'),
    _mm('mant_ropot', '🔧', 'mantenimiento', 'Mantenimiento · PSA ROPOT',
      'Hola {nombre}! 😊\n\nTu PSA ROPOT ya está listo para su mantenimiento. Te dejo el video con el paso a paso:\nhttps://www.youtube.com/watch?v=gRtTiI32ciY\n\nEs simple y en 5 minutos lo tenés listo. Cualquier duda me escribís.'),
    _mm('mant_aire', '🔧', 'mantenimiento', 'Mantenimiento · Purificador de Aire',
      'Hola {nombre}! 😊\n\nTu Purificador de Aire PSA ya está listo para su mantenimiento y limpieza. Te dejo el video con el paso a paso:\nhttps://www.youtube.com/watch?v=IXrVLYZajKs\n\nEs simple y en unos minutos lo tenés listo. Cualquier duda me escribís.'),
    _mm('mant_ducha_retro', '🔧', 'mantenimiento', 'Retrolavado · PSA DUCHA II',
      'Hola {nombre}! 😊\n\nYa pasaron unos meses y tu PSA DUCHA II está listo para un retrolavado. Te dejo el video con el paso a paso:\nhttps://www.youtube.com/watch?v=7t6gQ1z5DPk\n\nEs simple y en 5 minutos lo tenés listo. Cualquier duda me escribís.'),
    _mm('mant_ducha_cartucho', '🔧', 'mantenimiento', 'Cambio de cartucho · PSA DUCHA II',
      'Hola {nombre}! 😊\n\nLlegó el momento de cambiarle el cartucho a tu PSA DUCHA II. Te dejo el video con el paso a paso:\nhttps://www.youtube.com/watch?v=63NClblK0sQ\n\nEs simple y en unos minutos lo tenés listo. Cualquier duda me escribís.'),
    _mm('mant_ducha', '🔧', 'mantenimiento', 'Mantenimiento · PSA DUCHA II',
      'Hola {nombre}! 😊\n\nTu PSA DUCHA II ya está listo para su mantenimiento. Te dejo el video con el paso a paso:\nhttps://www.youtube.com/watch?v=C3IiaANlDTg\n\nEs simple y en 5 minutos lo tenés listo. Cualquier duda me escribís.'),
    _mm('mant_ducha_rinnova', '💧', 'mantenimiento', 'PSA Rinnova · DUCHA II',
      'Hola {nombre}! 😊\n\nAhora nos renovamos y salió Rinnova.\n\nhttps://www.youtube.com/watch?v=lM2XjEVCPFI'),
    _mm('mant_canje', '🔄', 'mantenimiento', 'Plan Canje',
      'Hola {nombre}! 😊\n\nCuando el equipo cumple su vida útil pasan tres cosas: ya no se puede garantizar que no crezcan microorganismos adentro, el carbón activado se satura (deja de retener bien el sabor y el color) y los otros medios (KDF, resinas) también se agotan.\n\nPor eso existe el canje. No es un trámite: es para que el agua siga estando bien.\n\nTe dejo este video, es un minutito y lo explica re claro:\n\nhttps://www.youtube.com/watch?v=evwYO9-o5MY\n\nCuando puedas lo mirás. Después lo charlamos.'),
    _mm('mant_s1000', '🔧', 'mantenimiento', 'Mantenimiento · PSA S•1000 II Bajo Mesada',
      'Hola {nombre}! 😊\n\nTu PSA S•1000 II Bajo Mesada ya está listo para su mantenimiento. Te dejo el video con el paso a paso:\nhttps://www.youtube.com/watch?v=bRwJoC0YZ2Q\n\nEs simple y en 5 minutos lo tenés listo. Cualquier duda me escribís.'),
    _mm('mant_quantum', '🔧', 'mantenimiento', 'Mantenimiento · PSA Quantum',
      'Hola {nombre}! 😊\n\nTu PSA Quantum ya está listo para su mantenimiento. Te dejo el video con el paso a paso:\nhttps://www.youtube.com/watch?v=E9w3szPfIIk\n\nEs simple y en 5 minutos lo tenés listo. Cualquier duda me escribís.'),
    _mm('mant_sodaburby', '🔧', 'mantenimiento', 'Uso y mantenimiento · SodaBurby',
      'Hola {nombre}! 💧\n\nTe dejo el video con el uso y mantenimiento de tu SodaBurby:\nhttps://www.youtube.com/watch?v=xz6AATkZkOc\n\nEs simple y lo tenés listo en minutos. Cualquier duda me escribís.'),
    // — Grupo 2: Instalación y puesta en marcha
    _mm('inst_domus', '🛠️', 'instalacion', 'Instalación · PSA Domus',
      'Hola {nombre}! 👋\n\nTe dejo el video con la instalación de tu PSA Domus, paso a paso:\nhttps://www.youtube.com/watch?v=w_hJ3wQad1U\n\nCualquier duda me escribís.'),
    _mm('inst_domus_puesta', '🛠️', 'instalacion', 'Puesta en funcionamiento · PSA Domus',
      'Hola {nombre}! 👋\n\nTe dejo el video para dejar tu PSA Domus en funcionamiento, paso a paso:\nhttps://www.youtube.com/watch?v=fdc1ZQC8m_4\n\nCualquier duda me escribís.'),
    _mm('inst_griferia_puesta', '🛠️', 'instalacion', 'Puesta a punto · Grifería bicomando',
      'Hola {nombre}! 👋\n\nTe dejo el video con la puesta a punto de tu grifería bicomando:\nhttps://www.youtube.com/watch?v=wZmeE_rQBjY\n\nCualquier duda me escribís.'),
    _mm('inst_iontrix', '🛠️', 'instalacion', 'Instalación · PSA Iontrix 3',
      'Hola {nombre}! 👋\n\nTe dejo el video con la instalación de tu PSA Iontrix 3, paso a paso:\nhttps://www.youtube.com/watch?v=y6HwBdpRCuo\n\nCualquier duda me escribís.'),
    _mm('inst_iontrix_acond', '🛠️', 'instalacion', 'Acondicionamiento del agua · PSA Iontrix 3',
      'Hola {nombre}! 💧\n\nTe dejo el video con el acondicionamiento del agua de tu PSA Iontrix 3:\nhttps://www.youtube.com/watch?v=mzstQD7Ul_Q\n\nCualquier duda me escribís.'),
    _mm('inst_ropot', '🛠️', 'instalacion', 'Instalación y puesta en marcha · PSA ROPOT',
      'Hola {nombre}! 👋\n\nTe dejo el video con la instalación y puesta en marcha de tu PSA ROPOT:\nhttps://www.youtube.com/watch?v=8uSXLqFDXh0\n\nCualquier duda me escribís.'),
    _mm('inst_ropot_modulos', '🛠️', 'instalacion', 'Reemplazo de módulos · PSA ROPOT',
      'Hola {nombre}! 🔧\n\nCuando los módulos de tu PSA ROPOT se agotan hay que reemplazarlos. Te dejo el video con el paso a paso:\nhttps://www.youtube.com/watch?v=yh4dwgb21Xc\n\nCualquier duda me escribís.'),
    _mm('inst_aire_presentacion', '🛠️', 'instalacion', 'Presentación y puesta en marcha · Purificador de Aire',
      'Hola {nombre}! 👋\n\nTe dejo el video con la presentación y puesta en marcha de tu Purificador de Aire PSA:\nhttps://www.youtube.com/watch?v=OXQP2qWHt5g\n\nCualquier duda me escribís.'),
    _mm('inst_aire_funcionamiento', '🛠️', 'instalacion', 'Funcionamiento · Purificador de Aire',
      'Hola {nombre}! 👋\n\nTe dejo el video para que veas cómo funciona tu Purificador de Aire PSA:\nhttps://www.youtube.com/watch?v=YV271hKc66g\n\nCualquier duda me escribís.')
  ];
  function mensajeMantenimientoBase(id){
    for (var i=0;i<MANTENIMIENTOS.length;i++) if (MANTENIMIENTOS[i].id === id) return MANTENIMIENTOS[i];
    return null;
  }
  function mensajeMantenimiento(id){
    var base = mensajeMantenimientoBase(id);
    if (!base) return null;
    var g = leerGuardado().mantenimientos || {};
    var copia = {};
    for (var k in base) copia[k] = base[k];
    if (typeof g[id] === 'string') copia.texto = g[id];
    copia.editada = typeof g[id] === 'string' && g[id] !== base.texto;
    return copia;
  }
  function mensajesMantenimiento(){
    return MANTENIMIENTOS.map(function(m){ return mensajeMantenimiento(m.id); });
  }

  // `corto` es lo que se ve en pantalla: el usuario nunca lee las llaves.
  var ETIQUETAS = [
    { tag:'{nombre}', corto:'Nombre', que:'Nombre de pila' },
    { tag:'{producto}', corto:'Producto', que:'Equipo que compró' },
    { tag:'{domicilio}', corto:'Domicilio', que:'Dirección' },
    { tag:'{localidad}', corto:'Barrio', que:'Barrio o localidad' },
    { tag:'{vence}', corto:'Vence', que:'Fecha de vencimiento' },
    { tag:'{compra}', corto:'Compra', que:'Fecha de compra' },
    { tag:'{link_retrolavado}', corto:'Video', que:'Video de mantenimiento' },
    { tag:'{link_canje}', corto:'Canje', que:'Video del Plan Canje' }
  ];
  function etiquetaPorTag(tag){
    for (var i=0;i<ETIQUETAS.length;i++) if (ETIQUETAS[i].tag === tag) return ETIQUETAS[i];
    return null;
  }

  // Cliente inventado para mostrar cómo queda un texto cuando se lo edita sin
  // tener a nadie elegido.
  var EJEMPLO = {
    usuario: 'GOMEZ, ANA MARIA', producto: 'PSA SENIOR 4', domicilio: 'San Martín 120',
    localidad: 'Alta Gracia', fVenceRaw: '30/09/2026', fCompra: '15/03/2024'
  };

  /* ---------- utilidades ---------- */
  function uid(){ return window.APPIAuth && window.APPIAuth.userId ? window.APPIAuth.userId() : 'local'; }
  function storeKey(){ return 'appi_mensajes_v1_' + uid(); }
  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  // Los textos editados se guardan aparte de la planilla: recargar el Excel
  // no puede borrar lo que el usuario escribió.
  function leerGuardado(){
    try{
      var raw = JSON.parse(localStorage.getItem(storeKey()) || '{}');
      return raw && typeof raw === 'object' ? raw : {};
    }catch(e){ return {}; }
  }
  function guardar(data){
    try{ localStorage.setItem(storeKey(), JSON.stringify(data)); }catch(e){}
  }

  function plantillas(){
    var g = leerGuardado().textos || {};
    var todas = BASE.map(function(p){
      var copia = {};
      for (var k in p) copia[k] = p[k];
      if (typeof g[p.id] === 'string') copia.texto = g[p.id];
      copia.editada = typeof g[p.id] === 'string' && g[p.id] !== p.texto;
      return copia;
    });
    // Las propias van al final del mazo y valen para cualquier cliente.
    leerPropias().forEach(function(p){
      todas.push({ id: p.id, icono: p.icono, nombre: p.nombre, texto: p.texto, grupo: 'todos', propio: true, editada: false });
    });
    return todas;
  }
  function plantilla(id){
    var todas = plantillas();
    for (var i=0;i<todas.length;i++) if (todas[i].id === id) return todas[i];
    return mensajeMantenimiento(id) || null;
  }
  function guardarTexto(id, texto){
    var data = leerGuardado();
    // Mensajes de mantenimiento/instalación (v342): se editan igual, aparte.
    var mb = mensajeMantenimientoBase(id);
    if (mb){
      if (!data.mantenimientos) data.mantenimientos = {};
      if (String(texto) === mb.texto) delete data.mantenimientos[id];
      else data.mantenimientos[id] = String(texto == null ? '' : texto);
      guardar(data);
      return;
    }
    if (!data.textos) data.textos = {};
    var base = null;
    for (var i=0;i<BASE.length;i++) if (BASE[i].id === id) base = BASE[i];
    // Si vuelve a quedar igual que la de fábrica, se olvida la copia.
    if (base && String(texto) === base.texto) delete data.textos[id];
    else data.textos[id] = String(texto == null ? '' : texto);
    guardar(data);
  }
  function restaurar(id){
    var data = leerGuardado();
    if (mensajeMantenimientoBase(id)){
      if (data.mantenimientos) delete data.mantenimientos[id];
      guardar(data);
      return;
    }
    if (data.textos) delete data.textos[id];
    guardar(data);
  }

  /* ---------- mensajes propios (v326) ----------
     El distribuidor suma los mensajes que quiera: viven junto a las
     ediciones, en el mismo lugar del dispositivo, y valen para todos
     sus clientes. Si recarga el Excel, no se pierden tampoco. */
  function leerPropias(){
    var d = leerGuardado().propias;
    return Array.isArray(d) ? d.filter(function(p){ return p && p.id && p.texto; }) : [];
  }
  function guardarPropias(lista){
    var data = leerGuardado();
    data.propias = lista || [];
    guardar(data);
  }
  function crearPropia(icono, nombre, texto){
    var lista = leerPropias();
    var id = 'propia_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    lista.push({ id: id, icono: icono || '💬', nombre: nombre, texto: texto });
    guardarPropias(lista);
    return id;
  }
  function guardarPropia(id, cambios){
    var lista = leerPropias();
    for (var i = 0; i < lista.length; i++){
      if (lista[i].id !== id) continue;
      if (typeof cambios.icono === 'string' && cambios.icono.trim()) lista[i].icono = cambios.icono.trim().slice(0, 3);
      if (typeof cambios.nombre === 'string' && cambios.nombre.trim()) lista[i].nombre = cambios.nombre.trim().slice(0, 30);
      if (typeof cambios.texto === 'string') lista[i].texto = cambios.texto;
    }
    guardarPropias(lista);
  }
  function eliminarPropia(id){
    guardarPropias(leerPropias().filter(function(p){ return p.id !== id; }));
  }

  /* ---------- fechas y vigencia ---------- */
  function hoy(){
    var d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
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
  function dias(a, b){ return Math.round((a - b) / 86400000); }
  function fmtFecha(d){
    if (!d) return '';
    return String(d.getDate()).padStart(2,'0') + '/' +
           String(d.getMonth()+1).padStart(2,'0') + '/' + d.getFullYear();
  }
  function claveFecha(d){
    if (!d || isNaN(d.getTime())) return '';
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }
  /* Ventana de 90 días del año: un check-in hecho en esta ventana no vuelve
     a entrar hasta la siguiente. Así el cupo diario no recicla a la misma
     persona apenas cambia el día. */
  function ventanaCheckin(d){
    d = d || hoy();
    var start = new Date(d.getFullYear(), 0, 1);
    var n = Math.floor(Math.max(0, dias(d, start)) / DIAS_CHECKIN);
    return d.getFullYear() + '-v' + n;
  }

  /* Grupo del cliente según su vencimiento.
     'vigente' | 'vencido' (menos de un año) | 'inactivo' (más de un año) */
  function grupoDe(u){
    if (!u) return 'inactivo';
    // Al que se rescató de la campaña de dormidos se lo trata como cliente
    // otra vez: su fecha de vencimiento vive en el Excel y no cambia, así que
    // sin esto seguiría figurando como perdido para siempre.
    if (window.APPIReactivacion && window.APPIReactivacion.esRevivido && window.APPIReactivacion.esRevivido(u)) return 'vigente';
    var v = aFecha(u.fVence);
    if (!v) return 'vigente';           // sin fecha, se lo trata como activo
    var d = dias(hoy(), v);             // positivo = ya venció
    if (d <= 0) return 'vigente';
    return d > DIAS_ANIO ? 'inactivo' : 'vencido';
  }
  function recibeMensajes(u){ return grupoDe(u) !== 'inactivo'; }

  // Plantillas que tienen sentido para este cliente.
  function plantillasPara(u){
    var g = grupoDe(u);
    if (g === 'inactivo') return [];
    return plantillas().filter(function(p){
      return p.grupo === 'todos' || p.grupo === g;
    });
  }

  /* Próximo mantenimiento: cada 6 meses contados desde la compra.
     Devuelve { vencido, fecha, dias } o null si no hay fecha de compra. */
  function mantenimiento(u){
    var compra = aFecha(u && u.fCompra);
    if (!compra) return null;
    var h = hoy();
    var f = new Date(compra.getFullYear(), compra.getMonth(), compra.getDate());
    var guard = 0;
    while (f <= h && guard < 200){
      f.setMonth(f.getMonth() + MESES_MANTENIMIENTO);
      guard++;
    }
    // `f` quedó en el próximo aviso; el anterior es un ciclo atrás.
    var previo = new Date(f);
    previo.setMonth(previo.getMonth() - MESES_MANTENIMIENTO);
    // Ojo: para alguien que compró hace poco, ese "anterior" es el día de la
    // compra, que no es un aviso. El primero real cae recién a los 6 meses.
    var hubo = previo > compra;
    var desde = dias(h, previo);
    return {
      fecha: f,
      previo: hubo ? previo : null,
      dias: dias(f, h),
      // Sólo cuenta como pendiente si el aviso cayó hace poco: si no, al
      // abrir la app por primera vez aparecerían cientos de avisos viejos.
      vencido: hubo && desde >= 0 && desde <= 30
    };
  }

  function cumpleHoy(u){
    var c = aFecha(u && (u.cumpleRaw || u.cumple));
    if (!c) return false;
    var h = hoy();
    return c.getDate() === h.getDate() && c.getMonth() === h.getMonth();
  }

  /* ---------- armar el texto ---------- */
  function completar(texto, u){
    u = u || {};
    var nombre = (typeof window.nombreDePila === 'function' ? window.nombreDePila(u.usuario) : '') ||
                 String(u.usuario || '').split(',')[0].trim();
    var vence = aFecha(u.fVence);
    var mapa = {
      '{nombre}': nombre,
      '{producto}': u.producto || 'equipo',
      '{domicilio}': u.domicilio || '',
      '{localidad}': u.localidad || '',
      '{vence}': u.fVenceRaw || (vence ? fmtFecha(vence) : ''),
      '{compra}': u.fCompra || '',
      '{link_retrolavado}': LINK_RETROLAVADO,
      '{link_canje}': LINK_CANJE
    };
    return String(texto || '').replace(/\{[a-z_]+\}/g, function(m){
      return mapa[m] !== undefined ? mapa[m] : m;
    });
  }

  function telefonoDe(u){
    if(!window.APPITel) return '';
    if(window.APPITel.primeroValido) return window.APPITel.primeroValido(u && u.telf || '');
    return window.APPITel.normalizar(u && u.telf || '');
  }

  function enviar(u, texto, opts){
    var nombre = (u && (u.usuario || u.nombre) || '').split(',')[0].trim();
    // Si el campo trae más de un número (o un "54" suelto), se manda al
    // primer número válido y no se rompe la redirección (v331).
    var tel = (window.APPITel && window.APPITel.primeroValido) ? window.APPITel.primeroValido(u && u.telf || '') : (u && u.telf || '');
    if (!window.APPITel.abrir(tel, texto, nombre, u)) return;
    registrar(u, texto, opts);
  }

  // Se anota a quién y cuándo se le escribió, para no repetir el aviso al día
  // siguiente y para el panel de la etapa 2.
  function registrar(u, texto, opts){
    var key = telefonoDe(u);
    if (!key) return;
    var data = leerGuardado();
    if (!data.envios) data.envios = {};
    data.envios[key] = { at: new Date().toISOString(), texto: String(texto || '').slice(0, 400) };
    guardar(data);
    // El hielo no cierra la acción del día: sólo saluda. El cuerpo (video,
    // canje, visita) es el que deja la ✓.
    if (!(opts && opts.sinMarcar)){
      MOTIVOS.forEach(function(m){
        try{ if (m.aplica(u)) marcarAccion(m.id, u, 'hecha', true); }catch(e){}
      });
    }
    try{ pintarHoy(); }catch(e){}
  }
  function ultimoEnvio(u){
    var key = telefonoDe(u);
    if (!key) return null;
    var e = leerGuardado().envios || {};
    return e[key] || null;
  }

  /* ---------- marcas del día y progreso (v292/v352) ----------
     Cada acción del día se marca con ✓ (hecha) o ✗ (no se hizo). Las marcas
     viven por día y por usuario en su propia clave, que data-sync sube a la
     nube: así el administrador puede ver el cumplimiento de cada cuenta.
     Las ✓ también se guardan por ciclo en `completadas`: al cambiar el día
     vuelven sólo las acciones que todavía no fueron resueltas. */
  function accionesKey(){ return 'appi_acciones_v1_' + uid(); }
  function leerAcciones(){
    try{
      var raw = JSON.parse(localStorage.getItem(accionesKey()) || '{}');
      return raw && typeof raw === 'object' ? raw : {};
    }catch(e){ return {}; }
  }
  function guardarAcciones(d){
    try{ localStorage.setItem(accionesKey(), JSON.stringify(d)); }catch(e){}
  }
  function hoyKey(){
    var h = hoy();
    return h.getFullYear() + '-' + String(h.getMonth()+1).padStart(2,'0') + '-' + String(h.getDate()).padStart(2,'0');
  }

  /* La marca diaria responde "qué pasó hoy"; esta clave responde "qué ciclo
     ya quedó resuelto". Así una acción hecha ayer no vuelve a entrar mañana,
     pero sí puede volver cuando llegue el próximo mantenimiento, cumpleaños o
     vencimiento. */
  function claveAccion(motivoId, u){
    var tel = telefonoDe(u);
    if (!tel) return '';
    var base = motivoId + ':' + tel;
    if (motivoId === 'retro'){
      var m = mantenimiento(u);
      return base + ':mantenimiento:' + (m && m.previo ? claveFecha(m.previo) : 'sin-fecha');
    }
    if (motivoId === 'porvencer'){
      var vence = aFecha(u && u.fVence);
      return base + ':garantia:' + (vence ? claveFecha(vence) : 'sin-fecha');
    }
    if (motivoId === 'renovacion'){
      var venceR = aFecha(u && u.fVence);
      return base + ':renovacion:' + (venceR ? claveFecha(venceR) : 'sin-fecha');
    }
    if (motivoId === 'checkin'){
      return base + ':checkin:' + ventanaCheckin();
    }
    if (motivoId === 'cumple'){
      var cumple = aFecha(u && (u.cumpleRaw || u.cumple));
      var h = hoy();
      return base + ':cumple:' + h.getFullYear() + '-' +
        (cumple ? String(cumple.getMonth()+1).padStart(2,'0') + '-' + String(cumple.getDate()).padStart(2,'0') : 'sin-fecha');
    }
    return base;
  }

  function fechaDeMotivo(motivoId, u){
    if (motivoId === 'retro'){
      var m = mantenimiento(u);
      return m && m.previo ? m.previo : null;
    }
    if (motivoId === 'porvencer' || motivoId === 'renovacion') return aFecha(u && u.fVence);
    if (motivoId === 'checkin'){
      var ult = ultimoEnvio(u);
      if (ult && ult.at){
        var d = new Date(ult.at);
        if (!isNaN(d.getTime())) return new Date(d.getFullYear(), d.getMonth(), d.getDate());
      }
      return aFecha(u && u.fCompra);
    }
    if (motivoId === 'cumple'){
      var c = aFecha(u && (u.cumpleRaw || u.cumple));
      if (!c) return null;
      var h = hoy();
      return new Date(h.getFullYear(), c.getMonth(), c.getDate());
    }
    return null;
  }

  function textoFechaAccion(motivoId, u){
    var fecha = fechaDeMotivo(motivoId, u);
    if (!fecha) return '';
    if (motivoId === 'retro') return 'Pendiente desde: ' + fmtFecha(fecha);
    if (motivoId === 'porvencer') return 'Vence: ' + fmtFecha(fecha);
    if (motivoId === 'renovacion') return 'Venció: ' + fmtFecha(fecha);
    if (motivoId === 'checkin'){
      var ultC = ultimoEnvio(u);
      if (ultC && ultC.at) return 'Sin escribirle desde: ' + fmtFecha(fecha);
      return fecha ? 'Cliente desde: ' + fmtFecha(fecha) : 'Hace rato que no le escribís';
    }
    if (motivoId === 'cumple') return 'Cumple: ' + fmtFecha(fecha);
    return fmtFecha(fecha);
  }

  function textoFechaGrupo(g){
    var fechas = {};
    (g.gente || []).forEach(function(u){
      var texto = textoFechaAccion(g.motivo.id, u);
      if (texto) fechas[texto] = true;
    });
    var lista = Object.keys(fechas);
    if (!lista.length) return '';
    return lista.length === 1 ? lista[0] : 'Fechas individuales';
  }

  function marcasDeHoy(){
    var d = leerAcciones();
    return (d.dias && d.dias[hoyKey()] && d.dias[hoyKey()].marcas) || {};
  }

  function completadaDe(motivoId, u){
    var tel = telefonoDe(u);
    if (!tel) return null;
    var d = leerAcciones();
    var clave = claveAccion(motivoId, u);
    var guardada = d.completadas && clave && d.completadas[clave];
    if (guardada && guardada.e === 'hecha') return guardada;

    /* Compatibilidad con v292-v351: antes de existir `completadas`, una ✓
       quedaba solamente dentro del día. Una marca histórica reciente se toma
       como completada para este mismo ciclo; no se inventa una nueva marca ni
       se pierde el progreso ya guardado en el teléfono o en la nube. */
    var marcaVieja = motivoId + ':' + tel;
    var hoyActual = hoyKey();
    var inicioCiclo = null;
    if (motivoId === 'retro'){
      var mantenimientoActual = mantenimiento(u);
      inicioCiclo = mantenimientoActual && mantenimientoActual.previo;
    } else if (motivoId === 'porvencer'){
      var vencimientoActual = aFecha(u && u.fVence);
      if (vencimientoActual){
        inicioCiclo = new Date(vencimientoActual);
        inicioCiclo.setDate(inicioCiclo.getDate() - 30);
      }
    } else if (motivoId === 'renovacion'){
      inicioCiclo = aFecha(u && u.fVence);
    } else if (motivoId === 'checkin'){
      var h = hoy();
      inicioCiclo = new Date(h.getFullYear(), 0, 1);
      var nVentana = Math.floor(Math.max(0, dias(h, inicioCiclo)) / DIAS_CHECKIN);
      inicioCiclo.setDate(inicioCiclo.getDate() + (nVentana * DIAS_CHECKIN));
    }
    var inicioCicloKey = inicioCiclo ? claveFecha(inicioCiclo) : '';
    var diasGuardados = Object.keys(d.dias || {}).sort().reverse();
    for (var i = 0; i < diasGuardados.length; i++){
      var dia = diasGuardados[i];
      if (dia >= hoyActual || (inicioCicloKey && dia < inicioCicloKey)) continue;
      // Cumpleaños sólo puede resolverse en el día exacto: no se migra una
      // marca vieja sin fecha de ciclo para no tapar un cumpleaños modificado.
      if (!inicioCicloKey) continue;
      var marcas = d.dias[dia] && d.dias[dia].marcas;
      var m = marcas && marcas[marcaVieja];
      if (!m) continue;
      // Se respeta la última corrección histórica: una ✗ posterior a una ✓
      // no puede quedar anulada por una marca vieja.
      if (m.e === 'hecha') return { e:'hecha', dia:dia, at:m.at || '', n:m.n || '', legado:true };
      if (m.e === 'no_hecha') return null;
    }
    return null;
  }

  function completadaAntesDeHoy(motivoId, u){
    var c = completadaDe(motivoId, u);
    return !!(c && c.dia && c.dia < hoyKey());
  }

  function marcaDe(motivoId, u){
    var tel = telefonoDe(u);
    if (!tel) return null;
    return marcasDeHoy()[motivoId + ':' + tel] || null;
  }
  // Sólo se guardan los últimos 60 días: alcanza para el resumen y no crece sin fin.
  function limpiarViejos(d){
    var claves = Object.keys(d.dias || {});
    claves.forEach(function(k){
      var f = aFecha(k);
      if (!f || dias(hoy(), f) > 60) delete d.dias[k];
    });
  }
  function marcarAccion(motivoId, u, estado, silencioso){
    var tel = telefonoDe(u);
    if (!tel) return;
    var d = leerAcciones();
    if (!d.dias) d.dias = {};
    var k = hoyKey();
    if (!d.dias[k]) d.dias[k] = { marcas: {} };
    var ahora = new Date().toISOString();
    d.dias[k].marcas[motivoId + ':' + tel] = {
      e: estado === 'hecha' ? 'hecha' : 'no_hecha',
      at: ahora,
      n: String(u.usuario || '').slice(0, 60)
    };

    /* La ✓ resuelve el ciclo, no solamente el día. Se conserva separada del
       historial diario para que el progreso sobreviva a medianoches, recargas
       y sincronizaciones. La ✗ permite corregir una ✓ hecha por error. */
    var accion = claveAccion(motivoId, u);
    if (accion){
      if (!d.completadas) d.completadas = {};
      if (estado === 'hecha'){
        d.completadas[accion] = {
          e:'hecha', dia:k, at:ahora, n:String(u.usuario || '').slice(0, 60)
        };
      } else {
        delete d.completadas[accion];
      }
    }

    // El resumen queda escrito en el día: es lo que lee el panel del admin.
    var r = resumenCon(d);
    d.dias[k].total = r.total; d.dias[k].hechas = r.hechas; d.dias[k].noHechas = r.noHechas;
    d.dias[k].ganado = !!(r.total && r.hechas === r.total);
    limpiarViejos(d);
    guardarAcciones(d);
    invalidarJornada();
    if (!silencioso){ try{ pintarHoy(); }catch(e){} }
  }
  function resumenCon(d){
    var marcas = (d.dias && d.dias[hoyKey()] && d.dias[hoyKey()].marcas) || {};
    var total = 0, hechas = 0, noHechas = 0, pendientes = 0;
    deHoy().forEach(function(g){
      g.gente.forEach(function(u){
        total++;
        var m = marcas[g.motivo.id + ':' + telefonoDe(u)];
        if (m && m.e === 'hecha') hechas++;
        else if (m && m.e === 'no_hecha') noHechas++;
        else pendientes++;
      });
    });
    return { total: total, hechas: hechas, noHechas: noHechas, pendientes: pendientes };
  }
  function resumenHoy(){ return resumenCon(leerAcciones()); }
  /* deHoy() recorre toda la planilla. Sin memo, el mazo lo llamaba
     una vez por cliente (enJornada) y el Home se clavaba. */
  var jornadaMemo = { gen: 0, genHecho: -1, deHoy: null, tels: null };

  /* Partido del día (v398): el marcador es hechas / las que hay.
     Ganar es hacerlas todas (✓). La ✗ no cuenta. Un día sin tareas
     no es partido y no corta la racha. */
  function partidoHoy(){
    var r = resumenHoy();
    return {
      total: r.total,
      hechas: r.hechas,
      noHechas: r.noHechas,
      pendientes: r.pendientes,
      hay: r.total > 0,
      ganado: r.total > 0 && r.hechas === r.total,
      enCurso: r.total > 0 && r.pendientes > 0 && r.hechas < r.total
    };
  }
  function invalidarJornada(){
    jornadaMemo.gen++;
    jornadaMemo.deHoy = null;
    jornadaMemo.tels = null;
  }
  function registrarPartido(){
    var r = resumenHoy();
    if (!r.total) return;
    var d = leerAcciones();
    if (!d.dias) d.dias = {};
    var k = hoyKey();
    if (!d.dias[k]) d.dias[k] = { marcas: {} };
    d.dias[k].total = r.total;
    d.dias[k].hechas = r.hechas;
    d.dias[k].noHechas = r.noHechas;
    d.dias[k].ganado = !!(r.total && r.hechas === r.total);
    guardarAcciones(d);
  }
  function rachaGanados(){
    var d = leerAcciones();
    var n = 0;
    var fecha = hoy();
    for (var i = 0; i < 60; i++){
      var k = claveFecha(fecha);
      var dia = d.dias && d.dias[k];
      var esHoy = i === 0;
      if (!dia || !dia.total){
        fecha.setDate(fecha.getDate() - 1);
        continue;
      }
      var ganado = dia.hechas === dia.total && dia.total > 0;
      var pend = Math.max(0, (dia.total || 0) - (dia.hechas || 0) - (dia.noHechas || 0));
      if (ganado) n++;
      else if (esHoy && pend > 0) { /* partido en curso: no suma, no corta */ }
      else break;
      fecha.setDate(fecha.getDate() - 1);
    }
    return n;
  }
  function textoRacha(n){
    n = n == null ? rachaGanados() : n;
    if (!n) return '';
    return n === 1 ? '1 día ganado' : n + ' días ganados';
  }


  /* ---------- pendientes del día ---------- */
  /* Motivos en orden de urgencia. El calendario (cumple / mantenimiento /
     garantía) sigue primero; si no llenan el cupo, los usuarios rellenan con
     canjes y check-ins. El vencido hace más de un año sigue afuera. */
  function aplicaCheckin(u){
    if (grupoDe(u) !== 'vigente') return false;
    var compra = aFecha(u && u.fCompra);
    if (compra && dias(hoy(), compra) < DIAS_CHECKIN) return false;
    var ult = ultimoEnvio(u);
    if (ult && ult.at){
      var d = new Date(ult.at);
      if (!isNaN(d.getTime()) && dias(hoy(), d) < DIAS_CHECKIN) return false;
    }
    return true;
  }
  var MOTIVOS = [
    {
      id: 'cumple', icono: '🎂', plantilla: 'cumple', nombre: 'Cumpleaños',
      uno: 'cumple años', varios: 'cumplen años', capa: 1, cupo: true,
      aplica: function(u){ return grupoDe(u) === 'vigente' && cumpleHoy(u); }
    },
    {
      id: 'porvencer', icono: '⏰', plantilla: 'porvencer', nombre: 'Vida útil por cumplirse',
      uno: 'vence la garantía', varios: 'vencen la garantía', capa: 1, cupo: true,
      aplica: function(u){
        if (grupoDe(u) !== 'vigente') return false;
        var v = aFecha(u.fVence);
        if (!v) return false;
        var d = dias(v, hoy());
        return d >= 0 && d <= 30;
      }
    },
    {
      id: 'retro', icono: '🔧', plantilla: 'retrolavado', nombre: 'Retrolavado',
      uno: 'debe retrolavar', varios: 'deben retrolavar', capa: 1, cupo: true,
      aplica: function(u){
        if (grupoDe(u) !== 'vigente') return false;
        var m = mantenimiento(u);
        return !!(m && m.vencido);
      }
    },
    {
      id: 'renovacion', icono: '🔄', plantilla: 'renovacion', nombre: 'Equipo para canjear',
      uno: 'tiene el equipo vencido', varios: 'tienen el equipo vencido', capa: 2, cupo: true,
      aplica: function(u){ return grupoDe(u) === 'vencido'; }
    },
    {
      id: 'checkin', icono: '👋', plantilla: 'saludo', nombre: '¿Cómo viene el equipo?',
      uno: 'hace rato que no le escribís', varios: 'hace rato que no les escribís', capa: 3, cupo: true,
      aplica: aplicaCheckin
    }
  ];
  function motivoPorId(id){
    for (var i = 0; i < MOTIVOS.length; i++) if (MOTIVOS[i].id === id) return MOTIVOS[i];
    return null;
  }
  function listaUsuarios(){
    if (typeof window.usuariosTodosActual === 'function'){
      var vivos = window.usuariosTodosActual() || [];
      if (vivos.length) return vivos;
    }
    if (Array.isArray(window.usuariosU) && window.usuariosU.length) return window.usuariosU;
    try{
      var raw = JSON.parse(localStorage.getItem('usuarios_garantias') || '[]');
      return Array.isArray(raw) ? raw : [];
    }catch(e){ return []; }
  }
  function colaMotivo(id){
    var m = motivoPorId(id);
    if (!m) return [];
    return ordenarPorUrgencia(m, candidatosDe(m));
  }
  function candidatosDe(motivo){
    return listaUsuarios().filter(function(u){
      return telefonoDe(u) && motivo.aplica(u) && !completadaAntesDeHoy(motivo.id, u);
    });
  }
  function ordenarPorUrgencia(motivo, gente){
    return gente.slice().sort(function(a, b){
      if (motivo.id === 'checkin'){
        var ea = ultimoEnvio(a), eb = ultimoEnvio(b);
        var ta = ea && ea.at ? new Date(ea.at).getTime() : 0;
        var tb = eb && eb.at ? new Date(eb.at).getTime() : 0;
        if (ta !== tb) return ta - tb;
      }
      var fa = fechaDeMotivo(motivo.id, a);
      var fb = fechaDeMotivo(motivo.id, b);
      if (!fa && !fb) return 0;
      if (!fa) return 1;
      if (!fb) return -1;
      return fa - fb;
    });
  }

  // A un cliente ya contactado hoy no se lo vuelve a mostrar: si no, el panel
  // no baja nunca y deja de significar algo.
  function escritoHoy(u){
    var ult = ultimoEnvio(u);
    if (!ult || !ult.at) return false;
    var d = new Date(ult.at);
    if (isNaN(d.getTime())) return false;
    return dias(hoy(), new Date(d.getFullYear(), d.getMonth(), d.getDate())) === 0;
  }

  // Las 10 de hoy: ni una más. Los cumpleaños entran primero y cuentan.
  // El resto se reparte por urgencia. Mismo tope que WhatsApp.
  function deHoy(){
    if (jornadaMemo.genHecho === jornadaMemo.gen && jornadaMemo.deHoy) return jornadaMemo.deHoy;
    var usados = {};
    var grupos = [];
    function tomar(motivo, max){
      if (!motivo || max === 0) return 0;
      var gente = ordenarPorUrgencia(motivo, candidatosDe(motivo)).filter(function(u){
        var t = telefonoDe(u);
        return t && !usados[t];
      });
      if (max != null && max >= 0) gente = gente.slice(0, max);
      if (!gente.length) return 0;
      gente.forEach(function(u){ usados[telefonoDe(u)] = true; });
      grupos.push({ motivo: motivo, gente: gente });
      return gente.length;
    }
    var faltan = CUPO_DIA;
    ['cumple', 'porvencer', 'retro', 'renovacion', 'checkin'].forEach(function(id){
      if (faltan <= 0) return;
      faltan -= tomar(motivoPorId(id), faltan);
    });
    jornadaMemo.deHoy = grupos;
    jornadaMemo.tels = null;
    jornadaMemo.genHecho = jornadaMemo.gen;
    return grupos;
  }
  function telsJornada(){
    if (jornadaMemo.genHecho === jornadaMemo.gen && jornadaMemo.tels) return jornadaMemo.tels;
    var s = {};
    deHoy().forEach(function(g){
      g.gente.forEach(function(u){
        var t = telefonoDe(u);
        if (t) s[t] = true;
      });
    });
    jornadaMemo.tels = s;
    jornadaMemo.genHecho = jornadaMemo.gen;
    return s;
  }
  function enJornada(u){
    var t = telefonoDe(u);
    if (!t) return false;
    return !!telsJornada()[t];
  }

  // Para el carrusel: sólo los que todavía no tienen ✓ ni ✗.
  function pendientes(){
    var out = [];
    deHoy().forEach(function(g){
      var gente = g.gente.filter(function(u){ return !marcaDe(g.motivo.id, u); });
      if (gente.length) out.push({ motivo: g.motivo, gente: gente });
    });
    return out;
  }

  /* ---------- franja del día ---------- */
  /* La franja dura todo el día: las acciones marcadas no desaparecen, cambian
     de estado. No hay forma de cerrarla; recién al cambiar el día se arma la
     lista nueva. */
  var diaPintado = '';
  function pintarHoy(){
    var vista = document.getElementById('view-usuarios');
    if (!vista) return;
    var stats = vista.querySelector('.stats');
    if (!stats) return;
    css();
    var host = document.getElementById('muHoy');
    var grupos = deHoy();
    var res = resumenHoy();
    diaPintado = hoyKey();
    try{ registrarPartido(); }catch(e){}

    if (!res.total){
      if (host) host.remove();
      return;
    }
    if (!host){
      host = document.createElement('div');
      host.id = 'muHoy';
      stats.parentNode.insertBefore(host, stats);
    }
    var p = partidoHoy();
    var rachaTxt = textoRacha();
    var titulo = p.ganado
      ? 'Hoy ganaste · ' + p.hechas + ' / ' + p.total
      : 'Hoy ' + p.hechas + ' / ' + p.total;
    var subRacha = rachaTxt ? ' · ' + rachaTxt : '';
    var html = '<div class="mu-hoy-top"><span class="mu-hoy-ico">📋</span>' +
      '<div class="mu-hoy-heading"><b>' + titulo + '</b>' +
      '<span class="mu-hoy-fecha">📅 ' + esc(fmtFecha(hoy())) + esc(subRacha) + '</span></div>' +
      '<span class="mu-hoy-res"><i class="ok">✓ ' + res.hechas + '</i><i class="no">✗ ' + res.noHechas + '</i>' +
      (res.pendientes ? '<i>quedan ' + res.pendientes + '</i>' : '') + '</span></div>' +
      '<div class="mu-hoy-list">';
    grupos.forEach(function(g){
      var sinMarca = g.gente.filter(function(u){ return !marcaDe(g.motivo.id, u); }).length;
      var hechas = g.gente.filter(function(u){ var m = marcaDe(g.motivo.id, u); return m && m.e === 'hecha'; }).length;
      var noHechas = g.gente.length - sinMarca - hechas;
      var fechaGrupo = textoFechaGrupo(g);
      var fechaHTML = fechaGrupo ? '<small class="mu-hoy-fecha-accion">📅 ' + esc(fechaGrupo) + '</small>' : '';
      var estado = '<span class="mu-hoy-est">' + (hechas ? '<i class="ok">✓' + hechas + '</i>' : '') +
                   (noHechas ? '<i class="no">✗' + noHechas + '</i>' : '') + '</span>';
      if (sinMarca){
        html += '<button type="button" class="mu-hoy-item" data-mu-hoy="' + esc(g.motivo.id) + '">' +
          '<span class="mu-hoy-n">' + g.motivo.icono + '</span>' +
          '<span class="mu-hoy-txt"><span style="display:flex;justify-content:space-between;align-items:center;font-weight:700">' +
            '<span>' + esc(g.motivo.nombre || '') + '</span>' +
            '<span>Quedan ' + sinMarca + '</span>' +
          '</span>' + fechaHTML + '</span>' +
          estado + '<span class="mu-hoy-go">›</span></button>';
      } else {
        html += '<div class="mu-hoy-item done">' +
          '<span class="mu-hoy-n">' + g.motivo.icono + '</span>' +
          '<span class="mu-hoy-txt"><span style="display:flex;justify-content:space-between;align-items:center;font-weight:700">' +
            '<span>' + esc(g.motivo.nombre || '') + ' · completado</span>' +
            '<span>' + g.gente.length + '</span>' +
          '</span>' + fechaHTML + '</span>' +
          estado + '<span class="mu-hoy-go">✓</span></div>';
      }
    });
    html += '</div>';
    host.innerHTML = html;
    host.querySelectorAll('[data-mu-hoy]').forEach(function(b){
      b.onclick = function(){ abrirFila(b.getAttribute('data-mu-hoy')); };
    });
  }

  // Al cambiar el día, la franja se rearma sola con las acciones nuevas.
  setInterval(function(){
    if (diaPintado && diaPintado !== hoyKey()){
      try{ pintarHoy(); }catch(e){}
    }
  }, 60000);

  /* ---------- fila de trabajo ---------- */
  /* Un cliente por vez: se manda y pasa al siguiente. WhatsApp no deja enviar
     en lote desde la web, así que lo que se puede ahorrar son los toques. */
  var fila = null;

  function abrirFila(motivoId){
    var grupos = pendientes();
    var g = null;
    grupos.forEach(function(x){ if (x.motivo.id === motivoId) g = x; });
    if (!g) { pintarHoy(); return; }
    fila = { motivo: g.motivo, gente: g.gente.slice(), i: 0, textoActual: null };
    pintarFila();
  }

  function pintarFila(){
    var ov = overlay();
    var cuerpo = ov.querySelector('#muCuerpo');
    if (!fila) return;

    if (fila.i >= fila.gente.length){
      // El resumen se cuenta de las marcas reales: navegar o corregir no lo infla.
      var hechas = 0, noHechas = 0;
      fila.gente.forEach(function(x){
        var m = marcaDe(fila.motivo.id, x);
        if (m && m.e === 'hecha') hechas++;
        else if (m && m.e === 'no_hecha') noHechas++;
      });
      ov.querySelector('#muTitulo').textContent = '¡Listo!';
      ov.querySelector('#muSub').textContent = '';
      cuerpo.innerHTML = '<div class="mu-fin"><div class="mu-fin-ico">✅</div>' +
        '<b>' + hechas + (hechas === 1 ? ' acción hecha' : ' acciones hechas') +
        (noHechas ? ' · ' + noHechas + ' sin hacer' : '') + '</b>' +
        '<p>No queda nadie sin marcar en esta lista por hoy.</p></div>' +
        '<button type="button" class="mu-enviar" id="muFinCerrar">Cerrar</button>';
      cuerpo.querySelector('#muFinCerrar').onclick = function(){ cerrar(); pintarHoy(); };
      ov.classList.add('open');
      return;
    }

    var u = fila.gente[fila.i];
    var p = plantilla(fila.motivo.plantilla) || plantilla('saludo');
    var primer = !ultimoEnvio(u);
    var textoBase = primer ? textoHielo() : completar(p.texto, u);
    if (primer && !fila.textoActual) fila.textoActual = textoBase;
    var texto = fila.textoActual || textoBase;
    var nombre = (typeof window.nombreDePila === 'function' ? window.nombreDePila(u.usuario) : '') || u.usuario;

    ov.querySelector('#muTitulo').textContent = (fila.motivo.icono || p.icono) + ' ' + (fila.motivo.nombre || p.nombre);
    var fechaAccion = textoFechaAccion(fila.motivo.id, u);
    var sub = ov.querySelector('#muSub');
    if (primer){
      sub.textContent = 'Primero un hola. El resto, cuando contesten.';
    } else if (fechaAccion){
      sub.innerHTML = '<span class="mu-fecha-pill">📅 ' + esc(fechaAccion) + '</span>';
    } else {
      sub.textContent = '';
    }

    var estadoClase = u.estado === 'vencida' ? 'mu-vencida' : (u.estado === 'porVencer' ? 'mu-porvencer' : 'mu-vigente');
    var html = '<div class="mu-fila-quien"><b>' + esc(u.usuario || '') + '</b>' +
      '<div class="mu-fila-datos">' +
        '<div class="mu-col">' +
          (u.localidad ? '<span>📍 ' + esc(u.localidad) + '</span>' : '') +
          (u.domicilio ? '<span>🏠 ' + esc(u.domicilio) + '</span>' : '') +
          (function(){ var lindo = (window.APPITel && window.APPITel.bonito) ? window.APPITel.bonito(u.telf) : ''; return (lindo || u.telf) ? '<span>📞 ' + esc(lindo || u.telf) + '</span>' : ''; })() +
        '</div>' +
        '<div class="mu-col">' +
          (u.producto ? '<span>📦 ' + esc(u.producto) + '</span>' : '') +
          (u.fCompra ? '<span>🛒 Compra: ' + esc(u.fCompra) + '</span>' : '') +
          (u.fVenceRaw ? '<span class="mu-vence ' + estadoClase + '">📅 Vence: ' + esc(u.fVenceRaw) + '</span>' : '') +
        '</div>' +
      '</div></div>';
    // Si esta tarea ya tiene marca (se volvió con las flechitas), se muestra
    // y se puede corregir tocando la otra.
    var marcaActual = marcaDe(fila.motivo.id, u);
    if (marcaActual){
      html += '<div class="mu-marca-actual ' + (marcaActual.e === 'hecha' ? 'ok' : 'no') + '">' +
        (marcaActual.e === 'hecha' ? '✓ Marcada como hecha' : '✗ Marcada como no hecha') +
        ' · si te confundiste, tocá la otra</div>';
    }
    html += '<div class="mu-prev">';
    html += '<div class="mu-prev-head"><b>Así lo va a recibir</b><div class="mu-prev-tools">';
    if (primer){
      html += '<button type="button" class="mu-prev-btn" id="muOtroHielo" title="Otro saludo">🔁</button>';
    } else {
      html += '<button type="button" class="mu-prev-btn" id="muCambiarMensaje" title="Cambiar mensaje según el equipo">🔁</button>';
      html += '<button type="button" class="mu-prev-btn" id="muEditarMsg" title="Editar mensaje">✏️</button>';
      html += '<button type="button" class="mu-prev-btn" id="muBibliotecaMsg" title="Biblioteca de mensajes">💬</button>';
    }
    html += '</div></div>';
    html += '<span id="muPrevTxt">' + esc(texto) + '</span></div>';
    html += '<div class="mu-acciones">';
    html += '<button type="button" class="mu-enviar" id="muFilaEnviar">💬 Mandar a ' + esc(nombre) + '</button>';
    html += '<div class="mu-otro-msg-row"><button type="button" class="mu-otro-msg" id="muFilaMensajes">Elegir otro mensaje</button></div>';
    // Cada acción se marca sí o sí: ✓ la hice (aunque sea por otro medio) o
    // ✗ no se hizo. No hay forma de pasar de largo sin dejar constancia.
    html += '<div class="mu-marcar" style="grid-template-columns:1fr 44px 1fr;">' +
      '<button type="button" class="mu-marca ok" id="muFilaHecha"><i>✓</i>Ya lo hice</button>' +
      '<button type="button" class="mu-marca dep" id="muFilaDepurar" title="Depurar contacto" style="border-radius:50%;width:44px;height:44px;padding:0;flex-shrink:0;">🧹</button>' +
      '<button type="button" class="mu-marca no" id="muFilaNoHecha"><i>✗</i>No se hizo</button></div>';
    html += '<div class="mu-marcar-ayuda">' +
      '<span><i class="ok">✓</i> Tocá el verde si ya hiciste esta acción, aunque haya sido por llamada o en persona.</span>' +
      '<span><i class="no">✗</i> Tocá el rojo si hoy no se va a hacer: queda anotado y mañana empezás con la lista nueva.</span>' +
      '</div>';
    html += '</div>';
    // Las flechitas van y vuelven entre tareas sin marcar nada.
    html += '<div class="mu-fila-nav">' +
      '<button type="button" class="mu-nav" id="muFilaPrev" aria-label="Tarea anterior"' + (fila.i === 0 ? ' disabled' : '') + '>‹</button>' +
      '<span class="mu-fila-pos">' + (fila.i + 1) + ' de ' + fila.gente.length + '</span>' +
      '<button type="button" class="mu-nav" id="muFilaNext" aria-label="Tarea siguiente"' + (fila.i >= fila.gente.length - 1 ? ' disabled' : '') + '>›</button>' +
      '</div>';
    cuerpo.innerHTML = html;

    cuerpo.querySelector('#muFilaEnviar').onclick = function(){
      enviar(u, fila.textoActual || textoBase, primer ? { sinMarcar: true } : null);
      fila.textoActual = null;
      // No se avanza solo: al volver de WhatsApp la misma persona sigue a la
      // vista, lista para marcar qué pasó en ese contacto (✓ ya lo hice /
      // ✗ no se hizo). Mandar ya deja la ✓ puesta; si no se concretó, se
      // corrige con la ✗ y se avanza desde ahí (v330).
      pintarFila();
    };
    cuerpo.querySelector('#muFilaMensajes').onclick = function(){ pintarGrupos(u); };
    var otroHielo = cuerpo.querySelector('#muOtroHielo');
    if (otroHielo) otroHielo.onclick = function(){
      fila.textoActual = textoHielo();
      pintarFila();
    };
    var cambiar = cuerpo.querySelector('#muCambiarMensaje');
    if (cambiar) cambiar.onclick = function(){ pintarSelectorMensaje(u); };
    var editarMsg = cuerpo.querySelector('#muEditarMsg');
    if (editarMsg) editarMsg.onclick = function(){ verPlantilla(fila.motivo.plantilla, u, true); };
    var bibliotecaMsg = cuerpo.querySelector('#muBibliotecaMsg');
    if (bibliotecaMsg) bibliotecaMsg.onclick = function(){
      var c = overlay().querySelector('#muCuerpo');
      c.innerHTML = '';
      overlay().querySelector('#muTitulo').textContent = '💬 Biblioteca de mensajes';
      overlay().querySelector('#muSub').textContent = 'Generales, propios, mantenimiento e instalación';
      pintarListaEdicion(c, plantillas(), u);
    };
    cuerpo.querySelector('#muFilaHecha').onclick = function(){
      marcarAccion(fila.motivo.id, u, 'hecha');
      fila.textoActual = null;
      fila.i++;
      pintarFila();
    };
    cuerpo.querySelector('#muFilaDepurar').onclick = function(){
      if (typeof window.confirmarAccion === 'function'){
        window.confirmarAccion({
          title: 'Depurar contacto',
          sub: 'El contacto saldrá de la lista y se ignorará en las futuras cargas.',
          html: '<p style="margin:0;color:#30303d;font-size:13px"><b>'+esc(u.usuario||'Sin nombre')+'</b> · '+esc(u.telf||'Sin teléfono')+'</p><p style="margin:8px 0 0;color:#777887;font-size:11.5px;line-height:1.5">Motivo: Teléfono no corresponde. Queda registrado en la planilla de depurados, lista para descargar y pasársela a la empresa.</p>',
          okText: 'Depurar', cancelText: 'Cancelar', danger: true,
          onConfirm: function(){
            if (typeof window.depurarUsuario === 'function') window.depurarUsuario(u);
            fila.textoActual = null;
            fila.i++;
            pintarFila();
          }
        });
      } else {
        if (typeof window.depurarUsuario === 'function') window.depurarUsuario(u);
        fila.textoActual = null;
        fila.i++;
        pintarFila();
      }
    };
    cuerpo.querySelector('#muFilaNoHecha').onclick = function(){
      marcarAccion(fila.motivo.id, u, 'no_hecha');
      fila.textoActual = null;
      fila.i++;
      pintarFila();
    };
    cuerpo.querySelector('#muFilaPrev').onclick = function(){
      if (fila.i > 0){ fila.textoActual = null; fila.i--; pintarFila(); }
    };
    cuerpo.querySelector('#muFilaNext').onclick = function(){
      if (fila.i < fila.gente.length - 1){ fila.textoActual = null; fila.i++; pintarFila(); }
    };
    ov.classList.add('open');
  }

  // Lista para elegir el mensaje correcto según el equipo del cliente (v342):
  // Mantenimiento primero, Instalación después. Al elegir, el carrusel vuelve
  // con ese texto puesto para mandar.
  function pintarSelectorMensaje(u){
    var ov = overlay();
    var cuerpo = ov.querySelector('#muCuerpo');
    ov.querySelector('#muTitulo').textContent = '🔁 Elegir mensaje';
    ov.querySelector('#muSub').textContent = 'Según el equipo del cliente';
    var mant = mensajesMantenimiento();
    var grupos = [
      { titulo: '🔧 Mantenimiento', lista: mant.filter(function(m){ return m.grupo === 'mantenimiento'; }) },
      { titulo: '🛠️ Instalación y puesta en marcha', lista: mant.filter(function(m){ return m.grupo === 'instalacion'; }) }
    ];
    var html = '';
    grupos.forEach(function(g){
      if (!g.lista.length) return;
      html += '<div class="mu-sec-titulo">' + g.titulo + '</div><div class="mu-list">';
      g.lista.forEach(function(m){
        var resumen = completar(m.texto, u || EJEMPLO).replace(/\n+/g, ' ').slice(0, 68);
        html += '<button type="button" class="mu-item" data-mu-sel-mant="' + esc(m.id) + '">' +
          '<span class="mu-ico">' + m.icono + '</span>' +
          '<span><strong>' + esc(m.nombre) + '</strong><small>' + esc(resumen) + '…</small></span>' +
          '<span class="mu-go">💬</span></button>';
      });
      html += '</div>';
    });
    html += '<button type="button" class="mu-volver" id="muSelVolver">‹ Volver</button>';
    cuerpo.innerHTML = html;
    cuerpo.querySelectorAll('[data-mu-sel-mant]').forEach(function(b){
      b.onclick = function(){
        var m = mensajeMantenimiento(b.getAttribute('data-mu-sel-mant'));
        if (!m || !fila) return;
        fila.textoActual = completar(m.texto, u);
        pintarFila();
      };
    });
    var volver = cuerpo.querySelector('#muSelVolver');
    if (volver) volver.onclick = function(){ pintarFila(); };
  }
  function css(){
    var viejo = document.getElementById('muEstilos');
    if (viejo) viejo.remove();
    var st = document.createElement('style');
    st.id = 'muEstilos';
    st.textContent = [
      '.mu-ov{position:fixed;inset:0;z-index:10060;display:none;background:rgba(24,26,42,.46);backdrop-filter:blur(5px)}',
      '.mu-ov.open{display:block}',
      '.mu-panel{position:absolute;top:0;right:0;bottom:0;width:min(520px,100%);padding:20px;overflow:auto;',
      'background:linear-gradient(160deg,#f5f8ff,#fff3f9);box-shadow:-18px 0 55px rgba(30,35,75,.22);',
      'animation:muIn .32s cubic-bezier(.4,0,.2,1);box-sizing:border-box}',
      '@keyframes muIn{from{transform:translateX(28px);opacity:.4}to{transform:none;opacity:1}}',
      '.mu-top{display:flex;align-items:start;justify-content:space-between;gap:12px;padding-bottom:14px;border-bottom:1px solid rgba(80,90,130,.11)}',
      '.mu-top h2{margin:0;color:#292938;font-size:21px}',
      '.mu-top p{margin:5px 0 0;color:#777887;font-size:12px}',
      '.mu-close{width:48px;height:48px;flex:0 0 auto;border:0;border-radius:50%;background:rgba(91,141,239,.11);color:#3d63c9;font-size:22px;font-weight:900;cursor:pointer}',
      '.mu-list{display:grid;gap:8px;margin-top:14px}',
      '.mu-sec-titulo{margin:16px 0 8px;color:#3d63c9;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.5px}',
      'body.dark .mu-sec-titulo{color:#a8b8ff}',
      '.mu-item{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:11px;align-items:center;width:100%;min-height:58px;',
      'padding:12px 14px;border:1px solid rgba(80,90,130,.1);border-radius:15px;background:#fff;font:inherit;',
      'text-align:left;cursor:pointer;transition:background .14s,border-color .14s}',
      '.mu-item:hover{background:rgba(91,141,239,.07);border-color:rgba(91,141,239,.2)}',
      '.mu-item .mu-ico{font-size:20px}',
      '.mu-item strong{display:block;color:#30303d;font-size:13.5px;font-weight:750}',
      '.mu-item small{display:block;margin-top:2px;color:#777887;font-size:10.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.mu-item .mu-go{color:#3d63c9;font-size:17px;font-weight:900}',
      '.mu-edit{border:0;border-radius:9px;background:rgba(91,141,239,.11);color:#3d63c9;font:inherit;font-size:11px;font-weight:850;padding:7px 10px;cursor:pointer}',
      '.mu-edit:hover{background:rgba(91,141,239,.2)}',
      '.mu-caja{margin-top:14px}',
      '.mu-caja textarea{width:100%;min-height:190px;padding:12px 13px;border:1px solid rgba(80,90,130,.16);border-radius:14px;',
      'background:rgba(255,255,255,.94);color:#292938;font:inherit;font-size:13px;line-height:1.5;resize:vertical;box-sizing:border-box}',
      '.mu-caja textarea:focus{outline:none;border-color:#5b8def;box-shadow:0 0 0 3px rgba(91,141,239,.12)}',
      '.mu-prev{margin-top:12px;padding:13px 14px;border:1px solid rgba(58,208,164,.22);border-radius:14px;background:rgba(58,208,164,.08);',
      'color:#20705c;font-size:12.5px;line-height:1.55;white-space:pre-wrap;word-break:break-word}',
      '.mu-prev-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}',
      '.mu-prev b{display:block;margin:0;color:#178a6c;font-size:10.5px;font-weight:900;text-transform:uppercase;letter-spacing:.4px}',
      '.mu-prev-tools{display:flex;justify-content:flex-end;gap:6px;margin:0;flex:0 0 auto}',
      '.mu-prev-btn{width:34px;height:34px;border-radius:50%;font-size:14px;border:1px solid rgba(80,90,130,.14);background:#fff;cursor:pointer}',
      '.mu-prev-btn:hover{background:rgba(91,141,239,.08)}',
      'body.dark .mu-prev-btn{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.14)}',
      '.mu-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:11px}',
      '.mu-tag{border:1px dashed rgba(91,141,239,.4);border-radius:9px;background:rgba(91,141,239,.07);color:#3d63c9;',
      'font:inherit;font-size:10.5px;font-weight:800;padding:6px 9px;cursor:pointer}',
      '.mu-tag:hover{background:rgba(91,141,239,.16)}',
      '.mu-ayuda{margin-top:14px;padding:11px 13px;border-radius:13px;background:rgba(91,141,239,.08);',
      'color:#3d63c9;font-size:11.5px;line-height:1.5}',
      '.mu-acciones{display:grid;grid-template-columns:1fr;gap:9px;margin-top:15px}',
      '.mu-enviar{min-height:52px;border:0;border-radius:15px;background:linear-gradient(135deg,#25d366,#128C7E);color:#fff;',
      'font:inherit;font-size:14px;font-weight:850;cursor:pointer;box-shadow:0 7px 18px rgba(18,140,126,.26)}',
      '.mu-otro-msg-row{display:flex;justify-content:flex-end}',
      '.mu-otro-msg{border:0;background:transparent;color:#128C7E;font:inherit;font-size:13px;font-weight:800;',
      'text-decoration:underline;text-underline-offset:3px;cursor:pointer;padding:4px 8px;min-height:36px}',
      '.mu-otro-msg:hover{color:#0b6b4a}',
      '.mu-wa-ico{display:inline-flex;line-height:0;flex:0 0 auto}',
      '.mu-wa-ico svg{display:block}',
      'body.dark .mu-otro-msg{color:#3ad0a4}',
      '.mu-sec{min-height:44px;border:0;border-radius:13px;background:rgba(91,141,239,.11);color:#3d63c9;font:inherit;font-size:12.5px;font-weight:850;cursor:pointer}',
      '.mu-sec:hover{background:rgba(91,141,239,.2)}',
      '.mu-sec.mu-grande{min-height:50px;font-size:14px}',
      /* marcas ✓ / ✗ */
      '.mu-marcar{display:grid;grid-template-columns:1fr 1fr;gap:9px}',
      '.mu-marca{display:flex;align-items:center;justify-content:center;gap:7px;min-height:46px;border:0;border-radius:13px;',
      'font:inherit;font-size:12.5px;font-weight:850;cursor:pointer;transition:transform .12s,filter .12s}',
      '.mu-marca:hover{transform:translateY(-1px);filter:brightness(1.04)}',
      '.mu-marca i{display:inline-grid;place-items:center;width:22px;height:22px;border-radius:50%;font-style:normal;font-size:12px;font-weight:900;color:#fff}',
      '.mu-marca.ok{background:rgba(58,208,164,.14);color:#178a6c}',
      '.mu-marca.ok i{background:linear-gradient(135deg,#3ad0a4,#128C7E)}',
      '.mu-marca.no{background:rgba(255,107,107,.12);color:#c0392b}',
      '.mu-marca.no i{background:linear-gradient(135deg,#ff6b6b,#e74c3c)}',
      '.mu-marcar-ayuda{display:grid;gap:5px;padding:10px 12px;border-radius:12px;background:rgba(120,120,140,.07)}',
      '.mu-marcar-ayuda span{display:flex;align-items:flex-start;gap:7px;color:#696a78;font-size:10.5px;line-height:1.45}',
      '.mu-marcar-ayuda i{flex:0 0 auto;display:inline-grid;place-items:center;width:16px;height:16px;margin-top:1px;border-radius:50%;font-style:normal;font-size:9px;font-weight:900;color:#fff}',
      '.mu-marcar-ayuda i.ok{background:linear-gradient(135deg,#3ad0a4,#128C7E)}',
      '.mu-marcar-ayuda i.no{background:linear-gradient(135deg,#ff6b6b,#e74c3c)}',
      'body.dark .mu-marcar-ayuda{background:rgba(255,255,255,.06)}',
      'body.dark .mu-marcar-ayuda span{color:#a9a9b8}',
      '.mu-hoy-res{display:inline-flex;gap:6px;margin-left:auto;align-items:center}',
      '.mu-hoy-res i,.mu-hoy-est i{font-style:normal;font-size:10.5px;font-weight:900;padding:3px 8px;border-radius:999px;background:rgba(120,120,140,.12);color:#63636f;white-space:nowrap}',
      '.mu-hoy-res i.ok,.mu-hoy-est i.ok{background:rgba(58,208,164,.16);color:#178a6c}',
      '.mu-hoy-res i.no,.mu-hoy-est i.no{background:rgba(255,107,107,.14);color:#c0392b}',
      '.mu-hoy-est{display:inline-flex;gap:4px}',
      '.mu-hoy-item.done{opacity:.72;cursor:default;grid-template-columns:auto minmax(0,1fr) auto auto}',
      '.mu-hoy-item.done .mu-hoy-go{color:#178a6c}',
      '.mu-hoy-item:not(.done){grid-template-columns:auto minmax(0,1fr) auto auto}',
      'body.dark .mu-marca.ok{background:rgba(58,208,164,.18)}',
      'body.dark .mu-marca.no{background:rgba(255,107,107,.16)}',
      '.mu-nota{margin-top:13px;padding:11px 13px;border-radius:13px;background:rgba(245,179,1,.1);color:#8a6100;font-size:11.;color:#8a6100;font-size:11.5px;line-height:1.5}',
      '.mu-vacio{margin-top:16px;padding:18px 14px;border-radius:15px;background:rgba(255,255,255,.7);color:#777887;font-size:12.5px;text-align:center;line-height:1.55}',
      /* franja del día */
      '#muHoy{margin:0 0 12px;padding:13px 14px;border-radius:16px;border:1px solid rgba(91,141,239,.2);',
      'background:linear-gradient(135deg,rgba(91,141,239,.11),rgba(160,107,255,.1))}',
      '.mu-hoy-top{display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap}',
      '.mu-hoy-heading{display:grid;gap:2px;min-width:0}',
      '.mu-hoy-top b{color:#3a3a48;font-size:13px}',
      '.mu-hoy-fecha{color:#68697a;font-size:10.5px;font-weight:750}',
      '.mu-hoy-ico{font-size:16px}',
      '.mu-hoy-list{display:grid;gap:6px}',
      '.mu-hoy-item{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center;width:100%;',
      'min-height:46px;padding:9px 12px;border:1px solid rgba(80,90,130,.1);border-radius:13px;background:rgba(255,255,255,.85);',
      'font:inherit;text-align:left;cursor:pointer;transition:background .14s,transform .14s}',
      '.mu-hoy-item:hover{background:#fff;transform:translateY(-1px)}',
      '.mu-hoy-n{display:inline-grid;place-items:center;min-width:44px;padding:4px 9px;border-radius:999px;',
      'background:linear-gradient(135deg,#5b8def,#a06bff);color:#fff;font-size:12px;font-weight:900;white-space:nowrap}',
      '.mu-hoy-txt{display:grid;gap:2px;min-width:0;color:#3a3a48;font-size:12.5px;font-weight:700}',
      '.mu-hoy-fecha-accion{color:#68697a;font-size:10.5px;font-weight:750;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.mu-accion-fecha{color:#a3670b;font-size:11px;font-weight:850}',
      '.mu-hoy-go{color:#3d63c9;font-size:17px;font-weight:900}',
      /* fila de trabajo */
      '.mu-fila-quien{margin-top:14px;padding:13px 14px;border-radius:14px;background:rgba(255,255,255,.9);border:1px solid rgba(80,90,130,.1)}',
      '.mu-fila-quien b{display:block;color:#30303d;font-size:14.5px}',
      '.mu-fila-quien small{display:block;margin-top:3px;color:#777887;font-size:11px}',
      '.mu-fila-datos{display:grid;grid-template-columns:1fr 1fr;gap:5px 14px;margin-top:9px}',
      '.mu-col{display:grid;gap:5px;align-content:start;min-width:0}',
      '.mu-col span{color:#5b5f74;font-size:11.5px;line-height:1.4;min-width:0;word-break:break-word}',
      '.mu-col .mu-vence{font-weight:800}',
      '.mu-col .mu-vence.mu-vencida{color:#d9534f}',
      '.mu-col .mu-vence.mu-porvencer{color:#a3670b}',
      '.mu-col .mu-vence.mu-vigente{color:#168765}',
      '.mu-fila-pos{color:#777887;font-size:11px;text-align:center;font-weight:700}',
      '.mu-fila-nav{display:flex;align-items:center;justify-content:center;gap:16px;margin-top:12px}',
      '.mu-nav{width:44px;height:44px;border:1px solid rgba(80,90,130,.14);border-radius:50%;background:#fff;',
      'color:#3d63c9;font-size:22px;font-weight:900;line-height:1;cursor:pointer;transition:background .14s,transform .14s}',
      '.mu-nav:hover:not(:disabled){background:rgba(91,141,239,.1);transform:translateY(-1px)}',
      '.mu-nav:disabled{opacity:.3;cursor:default}',
      '.mu-marca-actual{margin-top:10px;padding:9px 12px;border-radius:12px;font-size:11.5px;font-weight:800;line-height:1.45}',
      '.mu-marca-actual.ok{background:rgba(58,208,164,.12);color:#178a6c;border:1px solid rgba(58,208,164,.25)}',
      '.mu-marca-actual.no{background:rgba(255,107,107,.1);color:#c0392b;border:1px solid rgba(255,107,107,.25)}',
      'body.dark .mu-nav{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.14);color:#9db7f5}',
      '.mu-fin{margin-top:18px;padding:26px 16px;border-radius:16px;background:rgba(58,208,164,.1);text-align:center}',
      '.mu-fin-ico{font-size:40px}',
      '.mu-fin b{display:block;margin-top:10px;color:#20705c;font-size:16px}',
      '.mu-fin p{margin:6px 0 0;color:#59897c;font-size:12.5px}',
      'body.dark #muHoy{background:linear-gradient(135deg,rgba(91,141,239,.16),rgba(160,107,255,.14));border-color:rgba(255,255,255,.1)}',
      'body.dark .mu-hoy-top b,body.dark .mu-hoy-txt{color:#f2f2f7}',
      'body.dark .mu-hoy-fecha{color:#b4b6c4}',
      'body.dark .mu-hoy-fecha-accion{color:#b4b6c4}',
      'body.dark .mu-accion-fecha{color:#e0b23c}',
      'body.dark .mu-hoy-item{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.1)}',
      'body.dark .mu-fila-quien{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.1)}',
      'body.dark .mu-fila-quien b{color:#f2f2f7}',
      'body.dark .mu-fila-datos span{color:#b4b6c4}',
      'body.dark .mu-col .mu-vence.mu-vencida{color:#ff7a76}',
      'body.dark .mu-col .mu-vence.mu-porvencer{color:#e0b23c}',
      'body.dark .mu-col .mu-vence.mu-vigente{color:#3ad0a4}',
      '.mu-volver{margin-top:14px;min-height:40px;padding:9px 14px;border:0;border-radius:12px;background:rgba(91,141,239,.11);',
      'color:#3d63c9;font:inherit;font-size:12px;font-weight:850;cursor:pointer}',
      '.mu-volver:hover{background:rgba(91,141,239,.2)}',
      '.action-btn.msg{background:rgba(160,107,255,.14);color:#6f3fd0;border-color:rgba(160,107,255,.22)}',
      'body.dark .mu-panel{background:linear-gradient(160deg,#20222e,#262232)}',
      'body.dark .mu-top h2{color:#f2f2f7}',
      'body.dark .mu-item{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.1)}',
      'body.dark .mu-item strong{color:#f2f2f7}',
      'body.dark .mu-caja textarea{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.12);color:#f2f2f7}',
      'body.dark .mu-vacio{background:rgba(255,255,255,.06);color:#a9a9b8}'
    ].join('');
    document.head.appendChild(st);
  }

  /* ---------- popup ---------- */
  var ctx = { persona:null, plantilla:null };

  function overlay(){
    var ov = document.getElementById('muOverlay');
    if (ov) return ov;
    css();
    ov = document.createElement('div');
    ov.className = 'mu-ov';
    ov.id = 'muOverlay';
    ov.innerHTML = '<div class="mu-panel" role="dialog" aria-modal="true" aria-labelledby="muTitulo">' +
      '<div class="mu-top"><div><h2 id="muTitulo">Mensajes</h2><p id="muSub"></p></div>' +
      '<button type="button" class="mu-close" id="muCerrar" aria-label="Cerrar">×</button></div>' +
      '<div id="muCuerpo"></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function(e){ if (e.target === ov) cerrar(); });
    ov.querySelector('#muCerrar').onclick = cerrar;
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && ov.classList.contains('open')) cerrar();
    });
    return ov;
  }

  function cerrar(){
    var ov = document.getElementById('muOverlay');
    if (ov) ov.classList.remove('open');
    ctx = { persona:null, plantilla:null };
  }

  /* ---------- hielo y plantillas por para qué (v412) ---------- */
  function icoWa(){
    return '<span class="mu-wa-ico" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="#25D366" d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.39-4.19-1.15l-.3-.17-3.12.82.83-3.04-.2-.32a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24z"/><path fill="#25D366" d="M9.79 7.54c-.2 0-.52.07-.79.37-.26.3-1.02 1-1.02 2.43s1.04 2.82 1.19 3.01c.15.2 2.03 3.25 5.01 4.43 2.48.98 2.98.79 3.52.74.54-.05 1.73-.7 1.97-1.38.24-.67.24-1.25.17-1.37-.07-.12-.26-.2-.54-.35-.28-.15-1.73-.85-2-.95-.27-.1-.46-.15-.66.15s-.76.95-.93 1.14c-.17.2-.34.22-.63.07-.28-.14-1.2-.44-2.29-1.4-.85-.75-1.42-1.69-1.58-1.97-.17-.28-.02-.43.13-.58.13-.13.28-.34.43-.51.14-.17.19-.29.28-.48.1-.2.05-.36-.02-.51-.08-.14-.65-1.57-.9-2.15-.23-.55-.48-.48-.66-.48z"/></svg></span>';
  }
  function nombreCortoDe(u){
    return (u ? ((typeof window.nombreDePila === 'function' ? window.nombreDePila(u.usuario) : '') || u.usuario) : '') || '';
  }
  function textoHielo(){
    if (window.APPIHielo && typeof window.APPIHielo.hielo === 'function') return window.APPIHielo.hielo();
    var f = window.APPIHielo && window.APPIHielo.firma ? window.APPIHielo.firma() : 'yo';
    return '¡Hola! 😊 Soy ' + f + ', ¿cómo estás?';
  }
  function textoSeguimiento(plantillaTexto, u){
    var t = completar(plantillaTexto, u);
    if (window.APPIHielo && typeof window.APPIHielo.sinHolaInicial === 'function') return window.APPIHielo.sinHolaInicial(t);
    return t;
  }
  /* Texto para mandar a cualquiera: sin nombre de ficha, sin “Hola ,”. */
  function completarLibre(texto){
    var t = completar(texto, {});
    t = t.replace(/,\s*([¡!¿?])/g, '$1');
    t = t.replace(/¡Hola\s+!/g, '¡Hola!');
    t = t.replace(/Hola\s+!/g, 'Hola!');
    t = t.replace(/^[ \t]*,[ \t]*/gm, '');
    t = t.replace(/[ \t]{2,}/g, ' ');
    t = t.replace(/[ \t]+\n/g, '\n');
    t = t.replace(/\n{3,}/g, '\n\n');
    return t.replace(/^\s+|\s+$/g, '');
  }
  function textoParaEnviar(id, u){
    var p = plantilla(id);
    if (!p) return '';
    return u ? completar(p.texto, u) : completarLibre(p.texto);
  }
  function dispararEnvio(texto, u){
    if (u){
      enviar(u, texto);
      return;
    }
    var url = 'https://wa.me/?text=' + encodeURIComponent(texto);
    if (window.APPIWhatsApp && window.APPIWhatsApp.abrir) window.APPIWhatsApp.abrir(url);
    else window.open(url, '_blank', 'noopener');
  }
  function pintarEnvio(id, u, volver){
    var p = plantilla(id);
    if (!p) return;
    var ov = overlay();
    var texto = textoParaEnviar(id, u);
    var nombre = nombreCortoDe(u);
    ov.querySelector('#muTitulo').textContent = (p.icono || '💬') + ' ' + p.nombre;
    ov.querySelector('#muSub').textContent = u ? ('Para ' + nombre) : 'Revisá el texto y tocá Enviar';
    var cuerpo = ov.querySelector('#muCuerpo');
    cuerpo.innerHTML = '<div class="mu-prev"><b>Así lo va a recibir</b><span id="muPrevTxt">' + esc(texto) + '</span></div>' +
      '<div class="mu-acciones"><button type="button" class="mu-enviar" id="muEnviar">Enviar</button></div>' +
      '<button type="button" class="mu-volver" id="muVolverEnvio">‹ Volver</button>';
    cuerpo.querySelector('#muEnviar').onclick = function(){
      dispararEnvio(cuerpo.querySelector('#muPrevTxt').textContent, u);
      if (fila){ fila.textoActual = null; pintarFila(); }
      else cerrar();
    };
    cuerpo.querySelector('#muVolverEnvio').onclick = function(){
      if (typeof volver === 'function') volver();
      else pintarGrupos(u);
    };
    ov.classList.add('open');
  }
  function normProd(s){
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  }
  function filtrarPorProducto(lista, u){
    var prod = normProd(u && u.producto);
    if (!prod) return lista;
    var tokens = prod.split(' ').filter(function(w){ return w.length > 2 && w !== 'psa'; });
    if (!tokens.length) return lista;
    var hits = lista.filter(function(m){
      var n = normProd(m.nombre);
      return tokens.some(function(w){ return n.indexOf(w) !== -1; });
    });
    return hits.length ? hits : lista;
  }
  function gruposPlantilla(){
    return [
      { id:'mant', icono:'💧', nombre:'Mantenimiento', pista:'El video sale del equipo de esa persona', fuente:'mantenimiento' },
      { id:'canje', icono:'🔄', nombre:'Vida útil o canje', pista:'Cuando el equipo ya cumplió', ids:['porvencer','renovacion','mant_canje'] },
      { id:'visita', icono:'📅', nombre:'Coordinar una visita', pista:'Día y horario', ids:['visita'] },
      { id:'cumple', icono:'🎂', nombre:'Cumpleaños', pista:'Saludo del día', ids:['cumple'] },
      { id:'nombre', icono:'👋', nombre:'Pedir un nombre', pista:'Un referido, nada más', ids:['referido'] },
      { id:'inst', icono:'🛠️', nombre:'Instalación', pista:'El video sale del equipo de esa persona', fuente:'instalacion' },
      { id:'mios', icono:'✍️', nombre:'Los míos', pista:'Los que armás vos', fuente:'propias' }
    ];
  }
  function itemsDeGrupo(g, u){
    if (!g) return [];
    if (g.fuente === 'mantenimiento'){
      var gen = plantilla('retrolavado');
      var mant = mensajesMantenimiento().filter(function(m){ return m.grupo === 'mantenimiento' && m.id !== 'mant_canje'; });
      var lista = gen ? [gen].concat(mant) : mant;
      return u ? filtrarPorProducto(lista, u) : lista;
    }
    if (g.fuente === 'instalacion'){
      var inst = mensajesMantenimiento().filter(function(m){ return m.grupo === 'instalacion'; });
      return u ? filtrarPorProducto(inst, u) : inst;
    }
    if (g.fuente === 'propias'){
      return leerPropias().map(function(p){
        return { id:p.id, icono:p.icono, nombre:p.nombre, texto:p.texto, grupo:'todos', propio:true };
      });
    }
    return (g.ids || []).map(function(id){ return plantilla(id); }).filter(Boolean);
  }
  function pintarHielo(u){
    var ov = overlay();
    ctx.persona = u || null;
    ctx.plantilla = null;
    var nombre = nombreCortoDe(u);
    var texto = textoHielo();
    ov.querySelector('#muTitulo').textContent = u ? ('Saludo para ' + nombre) : 'Saludo';
    ov.querySelector('#muSub').textContent = 'Primero un hola, nada más';
    var cuerpo = ov.querySelector('#muCuerpo');
    cuerpo.innerHTML = '<div class="mu-ayuda">El primer mensaje es sólo para saludar. El resto (equipo, video, visita) va después, cuando contesten.</div>' +
      '<div class="mu-prev"><div class="mu-prev-head"><b>Así lo va a recibir</b><div class="mu-prev-tools">' +
      '<button type="button" class="mu-prev-btn" id="muOtroHielo" title="Otro saludo">🔁</button></div></div>' +
      '<span id="muPrevTxt">' + esc(texto) + '</span></div>' +
      '<div class="mu-acciones"><button type="button" class="mu-enviar" id="muMandarHielo">💬 Mandar el saludo</button></div>';
    cuerpo.querySelector('#muOtroHielo').onclick = function(){
      cuerpo.querySelector('#muPrevTxt').textContent = textoHielo();
    };
    cuerpo.querySelector('#muMandarHielo').onclick = function(){
      enviar(u, cuerpo.querySelector('#muPrevTxt').textContent);
      pintarGrupos(u);
    };
    ov.classList.add('open');
  }
  function pintarGrupos(u){
    var ov = overlay();
    ctx.persona = u || null;
    ctx.plantilla = null;
    var nombre = nombreCortoDe(u);
    ov.querySelector('#muTitulo').textContent = u ? ('Mensaje para ' + nombre) : '💬 Mensajes';
    ov.querySelector('#muSub').textContent = u ? 'Elegí para qué escribís' : 'Elegí uno, miralo y enviá';
    var cuerpo = ov.querySelector('#muCuerpo');
    var html = '<div class="mu-list">';
    gruposPlantilla().forEach(function(g){
      html += '<button type="button" class="mu-item" data-mu-grupo="' + esc(g.id) + '">' +
        '<span class="mu-ico">' + g.icono + '</span>' +
        '<span><strong>' + esc(g.nombre) + '</strong><small>' + esc(g.pista) + '</small></span>' +
        '<span class="mu-go">›</span></button>';
    });
    html += '</div>';
    html += '<button type="button" class="mu-volver" id="muIrEditar">✏️ Editar los textos</button>';
    if (fila) html += '<button type="button" class="mu-volver" id="muVolverFila">‹ Volver</button>';
    cuerpo.innerHTML = html;
    cuerpo.querySelectorAll('[data-mu-grupo]').forEach(function(b){
      b.onclick = function(){
        var id = b.getAttribute('data-mu-grupo');
        var g = null;
        gruposPlantilla().forEach(function(x){ if (x.id === id) g = x; });
        if (g) alElegirGrupo(g, u);
      };
    });
    var ed = cuerpo.querySelector('#muIrEditar');
    if (ed) ed.onclick = function(){
      cuerpo.innerHTML = '';
      ov.querySelector('#muTitulo').textContent = 'Editar los textos';
      ov.querySelector('#muSub').textContent = 'Elegí cuál querés cambiar';
      pintarListaEdicion(cuerpo, u ? plantillasPara(u) : plantillas(), u);
    };
    var vf = cuerpo.querySelector('#muVolverFila');
    if (vf) vf.onclick = function(){ pintarFila(); };
    ov.classList.add('open');
  }
  function alElegirGrupo(g, u){
    var items = itemsDeGrupo(g, u);
    if (items.length === 1 && g.fuente !== 'propias'){
      pintarEnvio(items[0].id, u, function(){ pintarGrupos(u); });
      return;
    }
    pintarItemsGrupo(g, u, items);
  }
  function pintarItemsGrupo(g, u, items){
    var ov = overlay();
    var cuerpo = ov.querySelector('#muCuerpo');
    ov.querySelector('#muTitulo').textContent = g.icono + ' ' + g.nombre;
    ov.querySelector('#muSub').textContent = 'Tocá una y se abre WhatsApp';
    var lista = items || [];
    var html = '';
    if (!lista.length && g.fuente === 'propias'){
      html += '<div class="mu-vacio">Todavía no armaste ninguno.<br>Creá el primero y queda en tu lista.</div>';
    } else {
      html += '<div class="mu-list">';
      lista.forEach(function(p){
        var resumen = completar(p.texto, u || EJEMPLO).replace(/\n+/g, ' ').slice(0, 68);
        html += '<button type="button" class="mu-item" data-mu-plantilla="' + esc(p.id) + '">' +
          '<span class="mu-ico">' + (p.icono || g.icono) + '</span>' +
          '<span><strong>' + esc(p.nombre) + (p.editada ? ' ✏️' : '') + '</strong><small>' + esc(resumen) + '…</small></span>' +
          '<span class="mu-go">💬</span></button>';
      });
      html += '</div>';
    }
    if (g.fuente === 'propias') html += '<button type="button" class="mu-sec mu-grande" id="muNuevo" style="margin-top:12px">✍️ Crear un mensaje nuevo</button>';
    html += '<button type="button" class="mu-volver" id="muVolverGrupos">‹ Volver</button>';
    cuerpo.innerHTML = html;
    cuerpo.querySelectorAll('[data-mu-plantilla]').forEach(function(b){
      var id = b.getAttribute('data-mu-plantilla');
      b.onclick = function(){
        pintarEnvio(id, u, function(){ pintarItemsGrupo(g, u, items); });
      };
    });
    var neu = cuerpo.querySelector('#muNuevo');
    if (neu) neu.onclick = function(){ verPlantillaNueva(u); };
    cuerpo.querySelector('#muVolverGrupos').onclick = function(){ pintarGrupos(u); };
  }
  function abrirPlantillas(){
    abrir(null);
  }

  /* Elegir plantilla y mandar. El primer toque es un hielo; después, las
     plantillas agrupadas por para qué. Nada de llaves ni de edición acá. */
  function abrir(u){
    var ov = overlay();
    ctx.persona = u || null;
    ctx.plantilla = null;
    var nombre = u ? ((typeof window.nombreDePila === 'function' ? window.nombreDePila(u.usuario) : '') || u.usuario) : '';
    ov.querySelector('#muTitulo').textContent = u ? ('Mensaje para ' + nombre) : 'Mensajes';
    var cuerpo = ov.querySelector('#muCuerpo');
    var sub = ov.querySelector('#muSub');

    if (u && !recibeMensajes(u)){
      sub.textContent = 'Sin acciones para este cliente';
      cuerpo.innerHTML = '<div class="mu-vacio">La garantía de este cliente venció hace más de un año.<br>' +
        'Acordamos no hacer acciones sobre estos casos.</div>' +
        '<button type="button" class="mu-sec" id="muIgual" style="margin-top:12px;width:100%">Escribirle igual</button>';
      cuerpo.querySelector('#muIgual').onclick = function(){
        if (!ultimoEnvio(u)) pintarHielo(u);
        else pintarGrupos(u);
      };
      ov.classList.add('open');
      return;
    }

    if (u && !telefonoDe(u)){
      sub.textContent = 'Sin teléfono';
      cuerpo.innerHTML = '<div class="mu-vacio">Este cliente no tiene un teléfono válido cargado,<br>' +
        'así que no se le puede escribir por WhatsApp.</div>';
      ov.classList.add('open');
      return;
    }

    if (u && !ultimoEnvio(u)){
      pintarHielo(u);
      return;
    }
    pintarGrupos(u);
  }

  function pintarLista(cuerpo, lista, u){
    var html = '<div class="mu-list">';
    lista.forEach(function(p){
      // El resumen ya viene con los datos puestos: se ve lo que va a recibir.
      var resumen = completar(p.texto, u || EJEMPLO).replace(/\n+/g, ' ').slice(0, 68);
      html += '<button type="button" class="mu-item" data-mu-plantilla="' + esc(p.id) + '">' +
        '<span class="mu-ico">' + p.icono + '</span>' +
        '<span><strong>' + esc(p.nombre) + (p.editada ? ' ✏️' : '') + '</strong><small>' + esc(resumen) + '…</small></span>' +
        '<span class="mu-go">' + (u ? '💬' : '›') + '</span></button>';
    });
    html += '</div>';
    if (u){
      var ult = ultimoEnvio(u);
      if (ult && ult.at){
        var d = new Date(ult.at);
        if (!isNaN(d.getTime())){
          var dd = dias(hoy(), new Date(d.getFullYear(), d.getMonth(), d.getDate()));
          html += '<div class="mu-nota">Último mensaje: ' +
            (dd === 0 ? 'hoy' : dd === 1 ? 'ayer' : 'hace ' + dd + ' días') + '.</div>';
        }
      }
      // Editar existe, pero corrido a un costado: no es lo que se viene a hacer.
      html += '<button type="button" class="mu-volver" id="muIrEditar">✏️ Editar los textos</button>';
    }
    cuerpo.innerHTML += html;
    cuerpo.querySelectorAll('[data-mu-plantilla]').forEach(function(b){
      var id = b.getAttribute('data-mu-plantilla');
      b.onclick = function(){
        // Con cliente elegido se manda derecho; sin cliente, se edita.
        if (u) mandar(id, u);
        else verPlantilla(id, null);
      };
    });
    var ed = cuerpo.querySelector('#muIrEditar');
    if (ed) ed.onclick = function(){
      cuerpo.innerHTML = '';
      var ov = overlay();
      ov.querySelector('#muTitulo').textContent = 'Editar los textos';
      ov.querySelector('#muSub').textContent = 'Elegí cuál querés cambiar';
      pintarListaEdicion(cuerpo, plantillasPara(u), u);
    };
  }

  function pintarListaEdicion(cuerpo, lista, u){
    var html = '<div class="mu-list">';
    lista.forEach(function(p){
      var resumen = completar(p.texto, u || EJEMPLO).replace(/\n+/g, ' ').slice(0, 68);
      html += '<button type="button" class="mu-item" data-mu-editar="' + esc(p.id) + '">' +
        '<span class="mu-ico">' + p.icono + '</span>' +
        '<span><strong>' + esc(p.nombre) + (p.editada ? ' ✏️' : '') + '</strong><small>' + esc(resumen) + '…</small></span>' +
        '<span class="mu-go">›</span></button>';
    });
    html += '</div>';
    // Mensajes de mantenimiento e instalación por producto (v342): agrupados y
    // editables como las plantillas de fábrica.
    var mant = mensajesMantenimiento();
    [['mantenimiento', '🔧 Mantenimiento'], ['instalacion', '🛠️ Instalación y puesta en marcha']].forEach(function(g){
      var grupo = g[0], titulo = g[1];
      var delGrupo = mant.filter(function(m){ return m.grupo === grupo; });
      if (!delGrupo.length) return;
      html += '<div class="mu-sec-titulo">' + titulo + '</div><div class="mu-list">';
      delGrupo.forEach(function(m){
        var resumen = completar(m.texto, u || EJEMPLO).replace(/\n+/g, ' ').slice(0, 68);
        html += '<button type="button" class="mu-item" data-mu-editar="' + esc(m.id) + '">' +
          '<span class="mu-ico">' + m.icono + '</span>' +
          '<span><strong>' + esc(m.nombre) + (m.editada ? ' ✏️' : '') + '</strong><small>' + esc(resumen) + '…</small></span>' +
          '<span class="mu-go">›</span></button>';
      });
      html += '</div>';
    });
    // Crear mensajes propios (v326): el distribuidor arma su propia biblioteca.
    html += '<button type="button" class="mu-sec mu-grande" id="muNuevo" style="margin-top:12px">✍️ Crear un mensaje nuevo</button>';
    html += '<button type="button" class="mu-volver" id="muVolverEnviar">‹ Volver a enviar</button>';
    cuerpo.innerHTML = html;
    cuerpo.querySelectorAll('[data-mu-editar]').forEach(function(b){
      b.onclick = function(){ verPlantilla(b.getAttribute('data-mu-editar'), u, true); };
    });
    cuerpo.querySelector('#muNuevo').onclick = function(){ verPlantillaNueva(u); };
    cuerpo.querySelector('#muVolverEnviar').onclick = function(){ abrir(u); };
  }

  // Manda sin más vueltas: se abre WhatsApp con el texto ya completo.
  function mandar(id, u){
    var p = plantilla(id);
    if (!p) return;
    enviar(u, completar(p.texto, u));
    cerrar();
  }

  /* Pantalla de edición. Sólo se llega a propósito. Acá sí se ven las llaves,
     porque son la herramienta: los botones dicen "Nombre", no "{nombre}". */
  function verPlantilla(id, u, volverAEditar){
    var p = plantilla(id);
    if (!p) return;
    ctx.plantilla = id;
    var ov = overlay();
    var cuerpo = ov.querySelector('#muCuerpo');
    ov.querySelector('#muTitulo').textContent = p.icono + ' ' + p.nombre;
    ov.querySelector('#muSub').textContent = 'Editar el texto';

    var html = '<div class="mu-ayuda">Los botones de abajo meten datos que se completan solos con los de cada cliente.</div>';
    if (p.propio){
      // Los mensajes propios también pueden cambiar de emoji y nombre.
      html += '<div class="mu-propios" style="display:grid;grid-template-columns:64px 1fr;gap:8px;margin-top:11px">' +
        '<input id="muIcono" maxlength="3" value="' + esc(p.icono) + '" aria-label="Emoji" style="text-align:center;font-size:17px">' +
        '<input id="muNombre" maxlength="30" value="' + esc(p.nombre) + '" placeholder="Nombre del mensaje" aria-label="Nombre"></div>';
    }
    html += '<div class="mu-caja"><textarea id="muTexto" spellcheck="true">' + esc(p.texto) + '</textarea></div>';
    html += '<div class="mu-tags">';
    ETIQUETAS.forEach(function(e){
      html += '<button type="button" class="mu-tag" data-mu-tag="' + esc(e.tag) + '" title="' + esc(e.que) + '">+ ' + esc(e.corto) + '</button>';
    });
    html += '</div>';
    html += '<div class="mu-prev" id="muPrev"><b>' + (u ? 'Así lo va a recibir' : 'Ejemplo con un cliente') +
            '</b><span id="muPrevTxt"></span></div>';
    html += '<div class="mu-acciones">';
    // Guardar no es enviar: el verde queda reservado para WhatsApp.
    html += '<button type="button" class="mu-sec mu-grande" id="muGuardar">Guardar</button>';
    if (p.editada && !p.propio) html += '<button type="button" class="mu-sec" id="muRestaurar">Volver al texto original</button>';
    if (p.propio) html += '<button type="button" class="mu-sec" id="muEliminar" style="background:rgba(255,107,107,.12);color:#c0392b">Eliminar este mensaje</button>';
    html += '</div>';
    html += '<button type="button" class="mu-volver" id="muVolver">‹ Volver</button>';
    cuerpo.innerHTML = html;

    var ta = cuerpo.querySelector('#muTexto');
    var prev = cuerpo.querySelector('#muPrevTxt');
    var quien = u || EJEMPLO;
    function repintar(){ prev.textContent = completar(ta.value, quien); }
    repintar();
    ta.oninput = repintar;

    cuerpo.querySelectorAll('[data-mu-tag]').forEach(function(b){
      b.onclick = function(){
        var tag = b.getAttribute('data-mu-tag');
        var i = ta.selectionStart == null ? ta.value.length : ta.selectionStart;
        var f = ta.selectionEnd == null ? i : ta.selectionEnd;
        ta.value = ta.value.slice(0, i) + tag + ta.value.slice(f);
        ta.focus();
        ta.selectionStart = ta.selectionEnd = i + tag.length;
        repintar();
      };
    });

    function volver(){
      if (u && volverAEditar){
        var c = overlay().querySelector('#muCuerpo');
        c.innerHTML = '';
        overlay().querySelector('#muTitulo').textContent = 'Editar los textos';
        overlay().querySelector('#muSub').textContent = 'Elegí cuál querés cambiar';
        pintarListaEdicion(c, plantillasPara(u), u);
      } else {
        abrir(u);
      }
    }
    cuerpo.querySelector('#muVolver').onclick = volver;
    cuerpo.querySelector('#muGuardar').onclick = function(){
      var inIco = cuerpo.querySelector('#muIcono');
      var inNom = cuerpo.querySelector('#muNombre');
      // Los mensajes propios ya son personales: se guardan sin preguntar
      // (v356; antes la opción "sólo esta persona" creaba un duplicado en
      // la lista en vez de editar el existente).
      if (p.propio){
        var nombre = inNom ? inNom.value.trim() : '';
        if (!nombre){
          if (typeof window.showToast === 'function') window.showToast('Ponle un nombre al mensaje');
          if (inNom) inNom.focus();
          return;
        }
        if (!ta.value.trim()){
          if (typeof window.showToast === 'function') window.showToast('Escribí el texto del mensaje');
          return;
        }
        guardarPropia(id, { icono: inIco ? inIco.value : p.icono, nombre: nombre, texto: ta.value });
        if (typeof window.showToast === 'function') window.showToast('Guardado ✓');
        volver();
        return;
      }
      // Plantillas de fábrica: el alcance se elige con el diálogo propio de
      // la app (v356; antes era un confirm nativo, prohibido por convención
      // del README y riesgoso en la PWA instalada de iOS).
      var confirmar = (window.APPIDialog && typeof window.APPIDialog.confirm === 'function')
        ? window.APPIDialog.confirm(
            '¿Guardar para todos los clientes?\n\nTodos conserva los comodines ({nombre}, {vence}, {producto}…). "Sólo esta persona" deja este texto apenas para el cliente abierto.',
            { title: 'Guardar mensaje', icon: '💬', okText: 'Todos los clientes', cancelText: 'Sólo esta persona' }
          )
        : Promise.resolve(true);
      confirmar.then(function(todos){
        if (todos){
          guardarTexto(id, ta.value);
        } else {
          var data = leerGuardado();
          if (!data.personales) data.personales = {};
          var clavePersonal = id + ':' + (telefonoDe(u) || 'sin-tel');
          data.personales[clavePersonal] = ta.value;
          guardar(data);
        }
        if (typeof window.showToast === 'function') window.showToast('Guardado ✓');
        volver();
      });
    };
    var rest = cuerpo.querySelector('#muRestaurar');
    if (rest) rest.onclick = function(){
      restaurar(id);
      if (typeof window.showToast === 'function') window.showToast('Texto original restaurado ✓');
      verPlantilla(id, u, volverAEditar);
    };
    var del = cuerpo.querySelector('#muEliminar');
    if (del) del.onclick = function(){
      var ok = window.APPIDialog && window.APPIDialog.confirm;
      var quitar = function(){
        eliminarPropia(id);
        if (typeof window.showToast === 'function') window.showToast('Mensaje eliminado');
        volver();
      };
      if (typeof ok === 'function'){
        window.APPIDialog.confirm('El mensaje se borra de tu lista. Los enviados ya hechos no cambian.', { title: 'Eliminar mensaje', icon: '🗑️', okText: 'Eliminar' })
          .then(function(si){ if (si) quitar(); });
      } else quitar();
    };
  }

  /* Mensaje propio nuevo (v326): mismo editor, pero arranca vacío y
     pide nombre antes de guardar. */
  function verPlantillaNueva(u){
    ctx.plantilla = null;
    var ov = overlay();
    var cuerpo = ov.querySelector('#muCuerpo');
    ov.querySelector('#muTitulo').textContent = '✍️ Nuevo mensaje';
    ov.querySelector('#muSub').textContent = 'Tuyo, para cualquier cliente';

    var html = '<div class="mu-ayuda">Escribí el texto una vez y queda en tu lista para siempre. Los botones de abajo meten datos que se completan solos con los de cada cliente.</div>';
    html += '<div class="mu-propios" style="display:grid;grid-template-columns:64px 1fr;gap:8px;margin-top:11px">' +
      '<input id="muIcono" maxlength="3" value="💬" aria-label="Emoji" style="text-align:center;font-size:17px">' +
      '<input id="muNombre" maxlength="30" placeholder="Nombre del mensaje" aria-label="Nombre"></div>';
    html += '<div class="mu-caja" style="margin-top:9px"><textarea id="muTexto" spellcheck="true" placeholder="Hola {nombre}! 😊"></textarea></div>';
    html += '<div class="mu-tags">';
    ETIQUETAS.forEach(function(e){
      html += '<button type="button" class="mu-tag" data-mu-tag="' + esc(e.tag) + '" title="' + esc(e.que) + '">+ ' + esc(e.corto) + '</button>';
    });
    html += '</div>';
    html += '<div class="mu-prev" id="muPrev"><b>Ejemplo con un cliente</b><span id="muPrevTxt"></span></div>';
    html += '<div class="mu-acciones">';
    html += '<button type="button" class="mu-sec mu-grande" id="muCrear">Crear mensaje</button>';
    html += '</div>';
    html += '<button type="button" class="mu-volver" id="muVolver">‹ Volver</button>';
    cuerpo.innerHTML = html;

    var ta = cuerpo.querySelector('#muTexto');
    var prev = cuerpo.querySelector('#muPrevTxt');
    function repintar(){ prev.textContent = completar(ta.value, EJEMPLO); }
    repintar();
    ta.oninput = repintar;
    cuerpo.querySelectorAll('[data-mu-tag]').forEach(function(b){
      b.onclick = function(){
        var tag = b.getAttribute('data-mu-tag');
        var i = ta.selectionStart == null ? ta.value.length : ta.selectionStart;
        var f = ta.selectionEnd == null ? i : ta.selectionEnd;
        ta.value = ta.value.slice(0, i) + tag + ta.value.slice(f);
        ta.focus();
        ta.selectionStart = ta.selectionEnd = i + tag.length;
        repintar();
      };
    });

    function volver(){
      var c = overlay().querySelector('#muCuerpo');
      c.innerHTML = '';
      overlay().querySelector('#muTitulo').textContent = 'Editar los textos';
      overlay().querySelector('#muSub').textContent = 'Elegí cuál querés cambiar';
      pintarListaEdicion(c, u ? plantillasPara(u) : plantillas(), u);
    }
    cuerpo.querySelector('#muVolver').onclick = volver;
    cuerpo.querySelector('#muCrear').onclick = function(){
      var nombre = cuerpo.querySelector('#muNombre').value.trim();
      var icono = cuerpo.querySelector('#muIcono').value.trim();
      if (!nombre){
        if (typeof window.showToast === 'function') window.showToast('Ponle un nombre al mensaje');
        cuerpo.querySelector('#muNombre').focus();
        return;
      }
      if (!ta.value.trim()){
        if (typeof window.showToast === 'function') window.showToast('Escribí el texto del mensaje');
        ta.focus();
        return;
      }
      crearPropia(icono || '💬', nombre, ta.value);
      if (typeof window.showToast === 'function') window.showToast('Mensaje creado ✓');
      volver();
    };
  }

  /* ---------- integración con la lista de Garantías ---------- */
  /* El botón de WhatsApp que ya existía pasa a abrir las plantillas, en vez de
     mandar un saludo fijo. Queda uno solo: es el mismo gesto de siempre, con
     más opciones adentro. El saludo de antes sobrevive como plantilla. */
  function pintarFichas(){
    var cont = document.getElementById('usuariosList');
    if (!cont) return;
    var lista = [];
    if (typeof window.usuariosFiltradosActual === 'function') lista = window.usuariosFiltradosActual() || [];
    else if (Array.isArray(window.filtradosU)) lista = window.filtradosU;
    cont.querySelectorAll('.tree-children').forEach(function(hijo){
      var nodo = hijo.previousElementSibling;
      if (!nodo) return;
      var idx = Number(nodo.getAttribute('data-u-toggle'));
      var u = lista[idx];
      if (!u) return;
      var wa = hijo.querySelector('[data-u-action="whatsapp"]');
      if (!wa || wa.getAttribute('data-mu-btn')) return;
      wa.setAttribute('data-mu-btn', '1');
      wa.onclick = function(e){
        e.stopPropagation();
        abrir(u);
      };
    });
  }

  // La lista se rehace sola con cada filtro; se observa el contenedor en vez de
  // engancharse a cada función que la repinta.
  function observar(){
    var cont = document.getElementById('usuariosList');
    if (!cont || cont.__muObs) return;
    cont.__muObs = true;
    var mo = new MutationObserver(function(){
      pintarFichas();
      // Cambiar de archivo o de filtro cambia quién está pendiente.
      pintarHoy();
    });
    mo.observe(cont, { childList:true, subtree:true });
    pintarFichas();
  }

  // Plantillas en la barra: se hojean y editan sin elegir a nadie. El
  // primer WhatsApp de cada ficha es un hielo; después, las plantillas.
  function montar(){
    css();
    observar();
    pintarHoy();
    var btnP = document.getElementById('usuariosBtnMensajes');
    if (btnP && !btnP.__muBound){
      btnP.__muBound = true;
      btnP.onclick = function(){ abrirPlantillas(); };
    }
  }

  function envolver(){
    if (window.__muWrapped) return;
    if (typeof window.showView !== 'function') return;
    window.__muWrapped = true;
    var orig = window.showView;
    window.showView = function(id){
      var r = orig.apply(this, arguments);
      try{ if (id === 'view-usuarios') setTimeout(montar, 60); }catch(e){}
      return r;
    };
  }

  window.APPIMensajes = {
    BASE: BASE,
    ETIQUETAS: ETIQUETAS,
    LINK_RETROLAVADO: LINK_RETROLAVADO,
    LINK_CANJE: LINK_CANJE,
    plantillas: plantillas,
    plantilla: plantilla,
    guardarTexto: guardarTexto,
    restaurar: restaurar,
    leerPropias: leerPropias,
    crearPropia: crearPropia,
    guardarPropia: guardarPropia,
    eliminarPropia: eliminarPropia,
    verPlantillaNueva: verPlantillaNueva,
    completar: completar,
    grupoDe: grupoDe,
    recibeMensajes: recibeMensajes,
    plantillasPara: plantillasPara,
    mantenimiento: mantenimiento,
    mensajesMantenimiento: mensajesMantenimiento,
    mensajeMantenimiento: mensajeMantenimiento,
    cumpleHoy: cumpleHoy,
    ultimoEnvio: ultimoEnvio,
    registrar: registrar,
    abrir: abrir,
    abrirPlantillas: abrirPlantillas,
    gruposPlantilla: gruposPlantilla,
    pintarGrupos: pintarGrupos,
    pintarHielo: pintarHielo,
    pintarEnvio: pintarEnvio,
    completarLibre: completarLibre,
    mandar: mandar,
    pendientes: pendientes,
    deHoy: deHoy,
    enJornada: enJornada,
    telsJornada: telsJornada,
    invalidarJornada: invalidarJornada,
    colaMotivo: colaMotivo,
    CUPO_DIA: CUPO_DIA,
    DIAS_CHECKIN: DIAS_CHECKIN,
    aplicaCheckin: aplicaCheckin,
    motivoPorId: motivoPorId,
    marcarAccion: marcarAccion,
    marcaDe: marcaDe,
    claveAccion: claveAccion,
    completadaDe: completadaDe,
    resumenHoy: resumenHoy,
    partidoHoy: partidoHoy,
    registrarPartido: registrarPartido,
    rachaGanados: rachaGanados,
    textoRacha: textoRacha,
    pintarHoy: pintarHoy,
    abrirFila: abrirFila,
    escritoHoy: escritoHoy,
    cerrar: cerrar,
    montar: montar,
    pintarFichas: pintarFichas
  };

  window.addEventListener('appi-datasync-applied', function(){
    try{ invalidarJornada(); pintarHoy(); pintarFichas(); }catch(e){}
  });

  if (document.readyState === 'complete') envolver();
  else window.addEventListener('load', envolver);
  setTimeout(envolver, 900);
})();
