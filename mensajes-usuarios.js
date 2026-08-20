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
   ============================================================ */
(function(){
  'use strict';

  var LINK_RETROLAVADO = 'https://www.youtube.com/watch?v=qa6xkQQsyg8';
  var MESES_MANTENIMIENTO = 6;   // el ciclo que pidió el usuario
  var DIAS_ANIO = 365;

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
        'Te escribo para recordarte que a tu {producto} le toca un retrolavado. Es un mantenimiento simple, de 5 minutos, que mantiene el equipo funcionando como el primer día.',
        '',
        'Te dejo el video paso a paso:',
        '{link_retrolavado}',
        '',
        'Cualquier duda escribime que te ayudo. 😊'
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
        'Que tengas un día hermoso rodeado de la gente que querés.',
        '',
        'Un abrazo grande 🤗'
      ].join('\n')
    },
    {
      id: 'porvencer',
      icono: '⏰',
      nombre: 'Garantía por vencer',
      grupo: 'vigente',
      texto: [
        'Hola {nombre}! 👋',
        '',
        'Te paso el dato de que la garantía de tu {producto} vence el {vence}.',
        '',
        'Si querés la renovamos y seguís con el servicio técnico y el mantenimiento cubierto. Avisame y lo vemos juntos. 😊'
      ].join('\n')
    },
    {
      id: 'renovacion',
      icono: '🔄',
      nombre: 'Renovación',
      grupo: 'vencido',
      texto: [
        'Hola {nombre}! 👋',
        '',
        'Te cuento que la garantía de tu {producto} venció el {vence}.',
        '',
        'Renovarla es simple y te deja tranquilo con el servicio técnico y el mantenimiento cubierto. ¿Querés que te pase los detalles?'
      ].join('\n')
    },
    {
      id: 'saludo',
      icono: '👋',
      nombre: 'Saludo suelto',
      grupo: 'todos',
      texto: [
        'Hola {nombre}! 👋 ¿Cómo estás?',
        '',
        'Te escribo para saber cómo viene funcionando tu {producto}. Cualquier cosa que necesites, quedo a disposición. 😊'
      ].join('\n')
    }
  ];

  var ETIQUETAS = [
    { tag:'{nombre}', que:'Nombre de pila' },
    { tag:'{producto}', que:'Equipo que compró' },
    { tag:'{domicilio}', que:'Dirección' },
    { tag:'{localidad}', que:'Barrio o localidad' },
    { tag:'{vence}', que:'Fecha de vencimiento' },
    { tag:'{compra}', que:'Fecha de compra' },
    { tag:'{link_retrolavado}', que:'Video de mantenimiento' }
  ];

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
    return BASE.map(function(p){
      var copia = {};
      for (var k in p) copia[k] = p[k];
      if (typeof g[p.id] === 'string') copia.texto = g[p.id];
      copia.editada = typeof g[p.id] === 'string' && g[p.id] !== p.texto;
      return copia;
    });
  }
  function plantilla(id){
    var todas = plantillas();
    for (var i=0;i<todas.length;i++) if (todas[i].id === id) return todas[i];
    return null;
  }
  function guardarTexto(id, texto){
    var data = leerGuardado();
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
    if (data.textos) delete data.textos[id];
    guardar(data);
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

  /* Grupo del cliente según su vencimiento.
     'vigente' | 'vencido' (menos de un año) | 'inactivo' (más de un año) */
  function grupoDe(u){
    if (!u) return 'inactivo';
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
      '{link_retrolavado}': LINK_RETROLAVADO
    };
    return String(texto || '').replace(/\{[a-z_]+\}/g, function(m){
      return mapa[m] !== undefined ? mapa[m] : m;
    });
  }

  function telefonoDe(u){
    if (typeof window.formatWhatsAppNumberU === 'function') return window.formatWhatsAppNumberU(u && u.telf || '');
    return String(u && u.telf || '').replace(/\D/g, '');
  }

  function enviar(u, texto){
    var num = telefonoDe(u);
    var url = 'https://wa.me/' + num + '?text=' + encodeURIComponent(texto);
    if (window.APPIWhatsApp && window.APPIWhatsApp.abrir) window.APPIWhatsApp.abrir(url);
    else window.open(url, '_blank', 'noopener');
    registrar(u, texto);
  }

  // Se anota a quién y cuándo se le escribió, para no repetir el aviso al día
  // siguiente y para el panel de la etapa 2.
  function registrar(u, texto){
    var key = telefonoDe(u);
    if (!key) return;
    var data = leerGuardado();
    if (!data.envios) data.envios = {};
    data.envios[key] = { at: new Date().toISOString(), texto: String(texto || '').slice(0, 400) };
    guardar(data);
  }
  function ultimoEnvio(u){
    var key = telefonoDe(u);
    if (!key) return null;
    var e = leerGuardado().envios || {};
    return e[key] || null;
  }

  /* ---------- estilos ---------- */
  function css(){
    if (document.getElementById('muEstilos')) return;
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
      '.mu-prev b{display:block;margin-bottom:6px;color:#178a6c;font-size:10.5px;font-weight:900;text-transform:uppercase;letter-spacing:.4px}',
      '.mu-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:11px}',
      '.mu-tag{border:1px dashed rgba(91,141,239,.4);border-radius:9px;background:rgba(91,141,239,.07);color:#3d63c9;',
      'font:inherit;font-size:10.5px;font-weight:800;padding:6px 9px;cursor:pointer}',
      '.mu-tag:hover{background:rgba(91,141,239,.16)}',
      '.mu-acciones{display:grid;grid-template-columns:1fr;gap:9px;margin-top:15px}',
      '.mu-enviar{min-height:52px;border:0;border-radius:15px;background:linear-gradient(135deg,#25d366,#128C7E);color:#fff;',
      'font:inherit;font-size:14px;font-weight:850;cursor:pointer;box-shadow:0 7px 18px rgba(18,140,126,.26)}',
      '.mu-sec{min-height:44px;border:0;border-radius:13px;background:rgba(91,141,239,.11);color:#3d63c9;font:inherit;font-size:12.5px;font-weight:850;cursor:pointer}',
      '.mu-sec:hover{background:rgba(91,141,239,.2)}',
      '.mu-nota{margin-top:13px;padding:11px 13px;border-radius:13px;background:rgba(245,179,1,.1);color:#8a6100;font-size:11.5px;line-height:1.5}',
      '.mu-vacio{margin-top:16px;padding:18px 14px;border-radius:15px;background:rgba(255,255,255,.7);color:#777887;font-size:12.5px;text-align:center;line-height:1.55}',
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

  // Pantalla 1: elegir plantilla.
  function abrir(u){
    var ov = overlay();
    ctx.persona = u || null;
    ctx.plantilla = null;
    var nombre = u ? ((typeof window.nombreDePila === 'function' ? window.nombreDePila(u.usuario) : '') || u.usuario) : '';
    ov.querySelector('#muTitulo').textContent = u ? ('Mensaje para ' + nombre) : 'Plantillas de mensajes';
    var cuerpo = ov.querySelector('#muCuerpo');
    var lista = u ? plantillasPara(u) : plantillas();
    var sub = ov.querySelector('#muSub');

    if (u && !recibeMensajes(u)){
      sub.textContent = 'Sin acciones para este cliente';
      cuerpo.innerHTML = '<div class="mu-vacio">La garantía de este cliente venció hace más de un año.<br>' +
        'Acordamos no hacer acciones sobre estos casos.</div>' +
        '<button type="button" class="mu-sec" id="muIgual" style="margin-top:12px;width:100%">Escribirle igual</button>';
      cuerpo.querySelector('#muIgual').onclick = function(){
        cuerpo.innerHTML = '';
        pintarLista(cuerpo, plantillas(), u);
      };
      ov.classList.add('open');
      return;
    }

    var g = u ? grupoDe(u) : null;
    sub.textContent = u
      ? (g === 'vencido' ? 'Garantía vencida hace menos de un año' : 'Elegí qué querés mandarle')
      : 'Tocá una para verla y editarla';
    cuerpo.innerHTML = '';
    pintarLista(cuerpo, lista, u);
    ov.classList.add('open');
  }

  function pintarLista(cuerpo, lista, u){
    var html = '<div class="mu-list">';
    lista.forEach(function(p){
      var resumen = completar(p.texto, u || {}).replace(/\n+/g, ' ').slice(0, 70);
      html += '<button type="button" class="mu-item" data-mu-plantilla="' + esc(p.id) + '">' +
        '<span class="mu-ico">' + p.icono + '</span>' +
        '<span><strong>' + esc(p.nombre) + (p.editada ? ' ✏️' : '') + '</strong><small>' + esc(resumen) + '…</small></span>' +
        '<span class="mu-go">›</span></button>';
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
    }
    cuerpo.innerHTML += html;
    cuerpo.querySelectorAll('[data-mu-plantilla]').forEach(function(b){
      b.onclick = function(){ verPlantilla(b.getAttribute('data-mu-plantilla'), u); };
    });
  }

  // Pantalla 2: ver, editar y mandar.
  function verPlantilla(id, u){
    var p = plantilla(id);
    if (!p) return;
    ctx.plantilla = id;
    var ov = overlay();
    var cuerpo = ov.querySelector('#muCuerpo');
    ov.querySelector('#muTitulo').textContent = p.icono + ' ' + p.nombre;
    ov.querySelector('#muSub').textContent = u ? 'Se manda a ' + esc(u.usuario || '') : 'Editar plantilla';

    var html = '<div class="mu-caja"><textarea id="muTexto" spellcheck="true">' + esc(p.texto) + '</textarea></div>';
    html += '<div class="mu-tags">';
    ETIQUETAS.forEach(function(e){
      html += '<button type="button" class="mu-tag" data-mu-tag="' + esc(e.tag) + '" title="' + esc(e.que) + '">' + esc(e.tag) + '</button>';
    });
    html += '</div>';
    if (u) html += '<div class="mu-prev" id="muPrev"><b>Así lo va a recibir</b><span id="muPrevTxt"></span></div>';
    html += '<div class="mu-acciones">';
    if (u && telefonoDe(u)) html += '<button type="button" class="mu-enviar" id="muEnviar">💬 Abrir WhatsApp</button>';
    else if (u) html += '<div class="mu-nota">Este cliente no tiene un teléfono válido cargado.</div>';
    html += '<button type="button" class="mu-sec" id="muGuardar">Guardar cambios</button>';
    if (p.editada) html += '<button type="button" class="mu-sec" id="muRestaurar">Volver al texto original</button>';
    html += '</div>';
    html += '<button type="button" class="mu-volver" id="muVolver">‹ Volver a las plantillas</button>';
    cuerpo.innerHTML = html;

    var ta = cuerpo.querySelector('#muTexto');
    var prev = cuerpo.querySelector('#muPrevTxt');
    function repintar(){ if (prev) prev.textContent = completar(ta.value, u || {}); }
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

    cuerpo.querySelector('#muVolver').onclick = function(){ abrir(u); };
    cuerpo.querySelector('#muGuardar').onclick = function(){
      guardarTexto(id, ta.value);
      if (typeof window.showToast === 'function') window.showToast('Plantilla guardada ✓');
      abrir(u);
    };
    var rest = cuerpo.querySelector('#muRestaurar');
    if (rest) rest.onclick = function(){
      restaurar(id);
      if (typeof window.showToast === 'function') window.showToast('Texto original restaurado ✓');
      verPlantilla(id, u);
    };
    var env = cuerpo.querySelector('#muEnviar');
    if (env) env.onclick = function(){
      guardarTexto(id, ta.value);
      enviar(u, completar(ta.value, u));
      cerrar();
    };
  }

  /* ---------- integración con la lista de Garantías ---------- */
  // Se agrega un botón 💬 Mensaje a cada ficha abierta, sin tocar el HTML que
  // arma la lista: si esa función cambia, esto sigue funcionando igual.
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
      var fila = hijo.querySelector('div[style*="display:flex"]');
      if (!fila || fila.querySelector('[data-mu-btn]')) return;
      if (!recibeMensajes(u)) return;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'action-btn msg';
      b.setAttribute('data-mu-btn', '1');
      b.textContent = '💬 Mensaje';
      b.onclick = function(e){ e.stopPropagation(); abrir(u); };
      fila.appendChild(b);
    });
  }

  // La lista se rehace sola con cada filtro; se observa el contenedor en vez de
  // engancharse a cada función que la repinta.
  function observar(){
    var cont = document.getElementById('usuariosList');
    if (!cont || cont.__muObs) return;
    cont.__muObs = true;
    var mo = new MutationObserver(function(){ pintarFichas(); });
    mo.observe(cont, { childList:true, subtree:true });
    pintarFichas();
  }

  function montarBoton(){
    var barra = document.querySelector('#view-usuarios .u-tools');
    if (!barra || document.getElementById('usuariosBtnMensajes')) return;
    css();
    var b = document.createElement('button');
    b.type = 'button';
    b.id = 'usuariosBtnMensajes';
    b.innerHTML = '<span>💬</span>Mensajes';
    b.onclick = function(){ abrir(null); };
    var limpiar = document.getElementById('usuariosBtnLimpiar');
    if (limpiar) barra.insertBefore(b, limpiar);
    else barra.appendChild(b);
  }

  function montar(){
    montarBoton();
    observar();
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
    plantillas: plantillas,
    plantilla: plantilla,
    guardarTexto: guardarTexto,
    restaurar: restaurar,
    completar: completar,
    grupoDe: grupoDe,
    recibeMensajes: recibeMensajes,
    plantillasPara: plantillasPara,
    mantenimiento: mantenimiento,
    cumpleHoy: cumpleHoy,
    ultimoEnvio: ultimoEnvio,
    registrar: registrar,
    abrir: abrir,
    cerrar: cerrar,
    montar: montar,
    pintarFichas: pintarFichas
  };

  if (document.readyState === 'complete') envolver();
  else window.addEventListener('load', envolver);
  setTimeout(envolver, 900);
})();
