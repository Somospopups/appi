/* ============================================================
   APPI · Tu home, tu estilo (v244)
   ------------------------------------------------------------
   El home se vuelve un slider de estilos: deslizás a la
   izquierda o la derecha y cambia la filosofía (foco, puertas,
   agenda, charla, misiones, pestañas, carrusel, zen o clásico).

   - Cada persona habilita los estilos que le gustan.
   - El estilo elegido queda guardado.
   - El home clásico (con todo) sigue siendo un estilo más.
   ============================================================ */
(function(){
  'use strict';
  function $(id){ return document.getElementById(id); }
  function uid(){ return window.APPIAuth && window.APPIAuth.userId ? window.APPIAuth.userId() : ''; }
  function esc(s){ return String(s == null ? '' : s).replace(/</g, '&lt;'); }

  var ESTILOS = [
    ['foco', 'Foco'], ['puertas', 'Puertas'], ['agenda', 'Agenda'], ['charla', 'Charla'],
    ['misiones', 'Misiones'], ['pestanas', 'Pestañas'], ['carrusel', 'Carrusel'], ['zen', 'Zen'], ['clasico', 'Clásico']
  ];
  function claveActivos(){ return 'appi_estilos_activos_v1_' + uid(); }
  function claveActual(){ return 'appi_estilo_actual_v1_' + uid(); }
  function activos(){
    try{
      var v = JSON.parse(localStorage.getItem(claveActivos()) || 'null');
      if (Array.isArray(v) && v.length) return v;
    }catch(e){}
    return ESTILOS.map(function(x){ return x[0]; });
  }
  function actual(){
    var a = activos();
    var v = localStorage.getItem(claveActual());
    return a.indexOf(v) >= 0 ? v : a[0];
  }

  /* ---------------- datos reales ---------------- */
  function nombre(){
    try{
      var p = window.APPIAuth && window.APPIAuth.currentProfile ? window.APPIAuth.currentProfile() : null;
      return (p && p.nombre ? String(p.nombre).split(/\s+/)[0] : 'Hola');
    }catch(e){ return 'Hola'; }
  }
  function gps(){ return window.APPIGPS ? window.APPIGPS() : { A: 0, patrocinios9: 0, demos: 0, cierres: 0 }; }
  function parque(){ return window.APPIParque ? window.APPIParque() : { vendidas: 0, vencidas: 0, pendientes: 0 }; }
  function score(){ try{ return window.calcularScoreGeneral ? window.calcularScoreGeneral() : 0; }catch(e){ return 0; } }
  function porQue(){
    try{
      var v = JSON.parse(localStorage.getItem('appi_porque_v1_' + uid()) || 'null');
      if (v && v.niveles && v.niveles.length) return v.niveles[v.niveles.length - 1];
      var s = JSON.parse(localStorage.getItem('appi_suenos_v1_' + uid()) || 'null');
      if (s && s.para_que) return s.para_que;
    }catch(e){}
    return 'Tu porqué vive en la Escalera de Sueños.';
  }
  function proximaAccion(){
    try{
      var c = JSON.parse(localStorage.getItem('appi_gestion_cache_v1_' + uid()) || 'null');
      var lista = c && Array.isArray(c.contacts) ? c.contacts : [];
      var hoy = new Date(); hoy.setHours(23,59,59,999);
      var p = lista.filter(function(x){ return ['seguimiento','nuevo','presentacion'].indexOf(x.estado) >= 0; })
        .sort(function(a, b){ return (a.proximo_contacto || '9999') < (b.proximo_contacto || '9999') ? -1 : 1; })[0];
      if (p) return { texto: (p.estado === 'presentacion' ? 'Presentación: ' : 'Seguimiento: ') + p.nombre, detalle: p.proximo_contacto ? 'Programado para ' + p.proximo_contacto : 'Hoy es un buen día' };
    }catch(e){}
    return { texto: 'Mandá tu primera encuesta', detalle: 'Una encuesta = una puerta que se abre' };
  }

  /* ---------------- renderers ---------------- */
  function cab(){ return '<div class="es-hola">' + esc(nombre()) + ' 👋</div>'; }
  function accionCard(){
    var a = proximaAccion();
    return '<div class="es-card"><div class="es-kicker" style="color:#168765">TU PRÓXIMA ACCIÓN</div>' +
      '<h3>' + esc(a.texto) + '</h3><p>' + esc(a.detalle) + '</p><div class="es-fila">' +
      '<button type="button" class="es-btn es-verde" onclick="openMiGestion()">Abrir el Panel</button>' +
      '<button type="button" class="es-btn es-suave" onclick="openMiGestion()">Ver Hoy</button></div></div>';
  }
  function puertasHtml(){
    return '<div class="es-pregunta">¿Qué querés hacer hoy?</div>' +
      '<button type="button" class="es-puerta" style="background:linear-gradient(135deg,#3d6cde,#25d0a4)" onclick="openMiGestion()"><b>VENDER</b><span>Panel, encuestas y demos</span><em>›</em></button>' +
      '<button type="button" class="es-puerta" style="background:linear-gradient(135deg,#8b63e8,#e8588a)" onclick="showView(\'view-siete\')"><b>PLANIFICAR</b><span>7 P, presupuesto y ruedas</span><em>›</em></button>' +
      '<button type="button" class="es-puerta" style="background:linear-gradient(135deg,#f5b301,#ff6b9d)" onclick="openEquipo()"><b>CRECER</b><span>Equipo, carrera y parque</span><em>›</em></button>';
  }
  function agendaHtml(){
    var a = proximaAccion();
    return '<div class="es-card"><div class="es-kicker" style="color:#168765">TU JORNADA</div>' +
      '<div class="es-linea"><i style="background:#25d0a4"></i><div><b>Mañana · resumen en tu teléfono</b><p>Te llega solo a las 9:00.</p></div></div>' +
      '<div class="es-linea"><i style="background:#f5b301"></i><div><b>Ahora · ' + esc(a.texto) + '</b>' +
      '<div class="es-fila" style="margin-top:7px"><button type="button" class="es-btn es-verde" onclick="openMiGestion()">Resolver</button></div></div></div>' +
      '<div class="es-linea"><i style="background:#8b63e8"></i><div><b>Más tarde · tu demo</b><p>Llevá la comparativa de la botella.</p></div></div></div>';
  }
  function charlaHtml(){
    var a = proximaAccion();
    var g = gps();
    return '<div class="es-burb izq"><p>Buen día, ' + esc(nombre()) + ' ☀️ Te espero con 3 cosas chicas:</p></div>' +
      '<div class="es-burb der"><p>1️⃣ ' + esc(a.texto) + '.</p><button type="button" class="es-btn es-verde" onclick="openMiGestion()">Resolver ahora</button></div>' +
      '<div class="es-burb der"><p>2️⃣ Vas ' + g.A + ' de 12 PB. ¿Cargás los de hoy?</p><button type="button" class="es-btn es-suave" onclick="showView(\'view-home\');showToast(\'Cultura te espera arriba 🌱\',2200)">Cargar PB</button></div>' +
      '<div class="es-burb der"><p>3️⃣ Tu motor: <b>“' + esc(porQue()) + '”</b> 💙</p><button type="button" class="es-btn es-suave" onclick="openSuenos()">Ver mi escalera</button></div>';
  }
  function misionesHtml(){
    var g = gps();
    var sc = score();
    return '<div class="es-card" style="text-align:center"><div class="es-score">' + sc + '</div>' +
      '<div class="es-kicker" style="color:#8b63e8">SCORE DEL MES</div>' +
      '<p>Con una misión completa sumás estrellas. ⭐</p></div>' +
      '<div class="es-card" style="padding:4px 16px"><ul class="es-lista">' +
      '<li onclick="openMiGestion()"><i style="background:#25d0a4"></i>' + esc(proximaAccion().texto) + '<b>+10</b></li>' +
      '<li onclick="abrirBotella()"><i style="background:#3d6cde"></i>Repasá la botella para tu demo<b>+5</b></li>' +
      '<li onclick="showView(\'view-siete\')"><i style="background:#f5b301"></i>Completá una de las 7 P<b>+5</b></li>' +
      '</ul></div><div class="es-sub">Bonus: ' + g.A + '/12 PB · ' + g.patrocinios9 + '/2 patrocinios</div>';
  }
  function pestanasHtml(){
    return '<div class="es-card"><div class="es-tabs">' +
      '<button type="button" class="es-tab on" onclick="esTab(this,0)">Hoy</button>' +
      '<button type="button" class="es-tab" onclick="esTab(this,1)">Carrera</button>' +
      '<button type="button" class="es-tab" onclick="esTab(this,2)">Parque</button></div>' +
      '<div class="es-tabcont" id="esTabCont"></div></div>' +
      '<div class="es-chips">' +
      '<button type="button" class="es-chip" onclick="openMiGestion()"><i style="background:#3d6cde"></i>Panel</button>' +
      '<button type="button" class="es-chip" onclick="openEquipo()"><i style="background:#25d0a4"></i>Equipo</button>' +
      '<button type="button" class="es-chip" onclick="openPresu()"><i style="background:#f5b301"></i>Presup.</button>' +
      '<button type="button" class="es-chip" onclick="openHistorico()"><i style="background:#ff8f6b"></i>Hist.</button>' +
      '<button type="button" class="es-chip" onclick="openOcho()"><i style="background:#8b63e8"></i>8 Pasos</button>' +
      '<button type="button" class="es-chip" onclick="openSuenos()"><i style="background:#e8588a"></i>Sueños</button></div>';
  }
  function carruselHtml(){
    var p = parque(), g = gps();
    return '<div class="es-carrusel" id="esCarrusel">' +
      '<div class="es-card"><div class="es-kicker" style="color:#168765">HOY</div><h3>Tu panel te espera</h3><p>' + esc(proximaAccion().texto) + '.</p><button type="button" class="es-btn es-verde" onclick="openMiGestion()">Empezar por ahí</button></div>' +
      '<div class="es-card"><div class="es-kicker" style="color:#8b63e8">CARRERA</div><h3>' + g.A + '/12 PB este mes</h3><p>Bonus y ritmo 30/10, en el GPS.</p><button type="button" class="es-btn es-suave" onclick="window.scrollTo({top:0})">Ver el GPS arriba</button></div>' +
      '<div class="es-card"><div class="es-kicker" style="color:#168765">PARQUE</div><h3>' + p.vendidas + ' hogares 🏡</h3><p>' + p.vencidas + ' garantías vencidas = visitas que renacen.</p><button type="button" class="es-btn es-suave" onclick="showView(\'view-usuarios\')">Ver Usuarios</button></div>' +
      '<div class="es-card"><div class="es-kicker" style="color:#e8588a">MOTOR</div><h3>Tu porqué 🔥</h3><p>“' + esc(porQue()) + '”</p><button type="button" class="es-btn es-suave" onclick="openSuenos()">Mi escalera</button></div>' +
      '</div><div class="es-sub" style="text-align:center">Deslizá las tarjetas →</div>';
  }
  function zenHtml(){
    return '<div class="es-zen"><div class="es-kicker" style="letter-spacing:1.5px">TU PORQUÉ</div>' +
      '<div class="es-zen-frase">“' + esc(porQue()) + '”</div>' +
      '<button type="button" class="es-btn es-grad" onclick="openMiGestion()">Empezar hoy →</button>' +
      '<button type="button" class="es-link" onclick="openSuenos()">ver mi escalera</button></div>';
  }

  function renderContenido(id){
    if (id === 'foco') return cab() + accionCard() + '<button type="button" class="es-resumen" onclick="openMiGestion()">Ver mi resumen del mes ›</button>';
    if (id === 'puertas') return cab() + puertasHtml();
    if (id === 'agenda') return cab() + agendaHtml();
    if (id === 'charla') return charlaHtml();
    if (id === 'misiones') return cab() + misionesHtml();
    if (id === 'pestanas') return cab() + pestanasHtml();
    if (id === 'carrusel') return cab() + carruselHtml();
    if (id === 'zen') return zenHtml();
    return '';
  }

  /* ---------------- montaje en el home ---------------- */
  function estiloCss(){
    if ($('estilosStyle')) return;
    var s = document.createElement('style');
    s.id = 'estilosStyle';
    s.textContent = '' +
      '#estiloWrap{padding:4px 2px 90px;position:relative}' +
      '#estiloWrap .es-hola{font-size:21px;font-weight:950;color:#343441;margin:4px 0 12px}' +
      'body.dark #estiloWrap .es-hola{color:#f2f2f7}' +
      '.es-card{background:rgba(255,255,255,.75);border-radius:20px;padding:15px;box-shadow:0 10px 26px rgba(50,60,120,.09);margin-bottom:11px}' +
      'body.dark .es-card{background:#25273a}' +
      '.es-card h3{margin:0 0 4px;font-size:16px;color:#343441}body.dark .es-card h3{color:#f2f2f7}' +
      '.es-card p{margin:0 0 10px;font-size:11.5px;font-weight:650;color:#686977;line-height:1.5}body.dark .es-card p{color:#b8b9c5}' +
      '.es-kicker{font-size:9.5px;font-weight:950;letter-spacing:.8px;margin-bottom:5px}' +
      '.es-fila{display:flex;gap:8px}.es-btn{flex:1;border:0;border-radius:13px;padding:11px;font:inherit;font-size:12.5px;font-weight:900;cursor:pointer}' +
      '.es-verde{background:linear-gradient(135deg,#3ad0a4,#3aa7e0);color:#fff}.es-suave{background:rgba(91,141,239,.10);color:#3d63c9}' +
      '.es-grad{background:linear-gradient(135deg,#5b8def,#8b63e8,#ff6bcf);color:#fff;padding:15px;font-size:14.5px;width:100%}' +
      '.es-resumen{width:100%;border:0;background:rgba(255,255,255,.75);border-radius:16px;padding:14px;font:inherit;font-size:13px;font-weight:900;color:#556277;cursor:pointer}' +
      '.es-pregunta{font-size:15px;font-weight:950;color:#343441;margin:2px 2px 10px}body.dark .es-pregunta{color:#f2f2f7}' +
      '.es-puerta{display:block;width:100%;border:0;border-radius:20px;padding:17px;margin-bottom:10px;text-align:left;font:inherit;color:#fff;cursor:pointer}' +
      '.es-puerta b{font-size:16px}.es-puerta span{display:block;font-size:11px;font-weight:750;opacity:.9;margin-top:2px}.es-puerta em{float:right;font-style:normal;font-size:18px;opacity:.8}' +
      '.es-linea{display:flex;gap:10px;padding:8px 0}.es-linea i{width:10px;height:10px;border-radius:50%;margin-top:4px;flex:none}' +
      '.es-linea b{font-size:12.5px;color:#343441}body.dark .es-linea b{color:#f2f2f7}.es-linea p{margin:2px 0 0;font-size:11px;color:#686977}' +
      '.es-burb{max-width:85%;border-radius:18px;padding:11px 13px;margin:0 0 9px;font-size:12px;font-weight:700;color:#343441}' +
      '.es-burb p{margin:0 0 7px;line-height:1.45}' +
      '.es-burb.izq{background:rgba(255,255,255,.85);border-bottom-left-radius:5px;margin-right:auto}' +
      '.es-burb.der{background:rgba(91,141,239,.12);border-bottom-right-radius:5px;margin-left:auto}' +
      'body.dark .es-burb{color:#f2f2f7}body.dark .es-burb.izq{background:#25273a}' +
      '.es-score{font-size:34px;font-weight:950;color:#3d63c9}' +
      '.es-lista{margin:0;padding:0;list-style:none}.es-lista li{display:flex;align-items:center;gap:9px;padding:11px 2px;border-bottom:1px solid rgba(80,90,130,.08);font-size:12.5px;font-weight:800;color:#3c4160;cursor:pointer}' +
      'body.dark .es-lista li{color:#e6e6f0}.es-lista li:last-child{border:0}.es-lista i{width:26px;height:26px;border-radius:9px;flex:none}.es-lista b{margin-left:auto;color:#8b63e8}' +
      '.es-sub{font-size:10.5px;font-weight:800;color:#686977;margin:6px 2px}body.dark .es-sub{color:#b8b9c5}' +
      '.es-tabs{display:flex;background:rgba(91,141,239,.08);border-radius:12px;padding:4px;margin-bottom:10px}' +
      '.es-tab{flex:1;border:0;background:transparent;border-radius:9px;padding:8px;font:inherit;font-size:11.5px;font-weight:900;color:#7a7f9a;cursor:pointer}' +
      '.es-tab.on{background:linear-gradient(135deg,#5b8def,#8b63e8);color:#fff}' +
      '.es-chips{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}' +
      '.es-chip{border:0;background:rgba(255,255,255,.75);border-radius:15px;padding:10px 4px;font:inherit;font-size:10px;font-weight:900;color:#4a4f70;cursor:pointer}' +
      'body.dark .es-chip{background:#25273a;color:#e6e6f0}.es-chip i{display:block;width:26px;height:26px;border-radius:9px;margin:0 auto 6px}' +
      '.es-carrusel{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:10px;padding:2px 2px 8px}.es-carrusel::-webkit-scrollbar{display:none}.es-carrusel .es-card{min-width:82%;scroll-snap-align:center;margin:0}' +
      '.es-zen{text-align:center;padding:40px 10px}' +
      '.es-zen-frase{font-size:22px;font-weight:950;color:#343441;line-height:1.35;margin:12px 0 26px}body.dark .es-zen-frase{color:#f2f2f7}' +
      '.es-link{border:0;background:transparent;color:#7a7f9a;font:inherit;font-size:11px;font-weight:800;margin-top:12px;cursor:pointer}' +
      '.es-flechas{position:fixed;bottom:26px;left:0;right:0;display:flex;justify-content:center;gap:14px;z-index:40;pointer-events:none}' +
      '.es-flechas button{pointer-events:auto;width:44px;height:44px;border-radius:50%;border:0;background:rgba(255,255,255,.9);color:#556277;font-size:18px;font-weight:950;box-shadow:0 8px 22px rgba(40,50,110,.25);cursor:pointer}' +
      'body.dark .es-flechas button{background:#25273a;color:#e6e6f0}' +
      '.es-puntos{position:fixed;bottom:76px;left:0;right:0;display:flex;justify-content:center;gap:5px;z-index:40;flex-wrap:wrap}' +
      '.es-puntos i{width:7px;height:7px;border-radius:50%;background:rgba(90,100,150,.3)}' +
      '.es-puntos i.on{background:#8b63e8;width:18px;border-radius:5px}' +
      '.es-nombre{position:fixed;bottom:52px;left:0;right:0;text-align:center;font-size:10px;font-weight:950;letter-spacing:1px;color:#7a7f9a;z-index:40}' +
      '.es-config{position:fixed;bottom:24px;right:16px;z-index:41;width:38px;height:38px;border-radius:50%;border:0;background:rgba(255,255,255,.9);box-shadow:0 8px 22px rgba(40,50,110,.25);font-size:15px;cursor:pointer}' +
      'body.dark .es-config{background:#25273a}';
    document.head.appendChild(s);
  }

  function montar(){
    if (!$('view-home')) return;
    estiloCss();
    var id = actual();
    var tools = $('toolsList');
    var wrap = $('estiloWrap');
    if (id === 'clasico') {
      if (wrap) wrap.style.display = 'none';
      if (tools) tools.style.display = '';
      quitarCromo();
      return;
    }
    if (tools) tools.style.display = 'none';
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'estiloWrap';
      var home = $('view-home');
      home.insertBefore(wrap, home.firstChild);
    }
    wrap.style.display = '';
    wrap.innerHTML = renderContenido(id) + cromoHtml(id);
    bindSwipe(wrap);
    if (id === 'pestanas') esTabPintar(0);
  }
  function cromoHtml(id){
    var a = activos();
    var idx = a.indexOf(id);
    return '<div class="es-puntos">' + a.map(function(x){ return '<i class="' + (x === id ? 'on' : '') + '"></i>'; }).join('') + '</div>' +
      '<div class="es-nombre">HOME · ' + (ESTILOS.filter(function(x){ return x[0] === id; })[0] || [id, id])[1].toUpperCase() + '</div>' +
      '<div class="es-flechas"><button type="button" id="esPrev" aria-label="Estilo anterior">‹</button><button type="button" id="esNext" aria-label="Estilo siguiente">›</button></div>' +
      '<button type="button" class="es-config" id="esConfig" aria-label="Elegir mis estilos">🎨</button>';
  }
  function quitarCromo(){
    ['esPrev', 'esNext', 'esConfig'].forEach(function(i){ var e = $(i); if (e) e.remove(); });
    var p = document.querySelector('.es-puntos'); if (p) p.remove();
    var n = document.querySelector('.es-nombre'); if (n) n.remove();
  }
  function cambiar(dir){
    var a = activos();
    var i = a.indexOf(actual());
    var sig = a[(i + dir + a.length) % a.length];
    localStorage.setItem(claveActual(), sig);
    montar();
    var w = $('estiloWrap');
    if (w) { w.style.opacity = 0; setTimeout(function(){ w.style.transition = 'opacity .25s'; w.style.opacity = 1; }, 30); }
  }
  function bindSwipe(wrap){
    var x0 = null;
    wrap.ontouchstart = function(e){ x0 = e.touches[0].clientX; };
    wrap.ontouchend = function(e){
      if (x0 == null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 60) cambiar(dx < 0 ? 1 : -1);
      x0 = null;
    };
    var prev = $('esPrev'), next = $('esNext'), cfg = $('esConfig');
    if (prev) prev.onclick = function(){ cambiar(-1); };
    if (next) next.onclick = function(){ cambiar(1); };
    if (cfg) cfg.onclick = abrirConfig;
  }

  function abrirConfig(){
    var a = activos();
    var host = $('view-home');
    var viejo = $('esConfigPanel');
    if (viejo) { viejo.remove(); return; }
    var panel = document.createElement('div');
    panel.id = 'esConfigPanel';
    panel.style.cssText = 'position:fixed;inset:0;z-index:12000;background:rgba(15,18,35,.55);display:flex;align-items:center;justify-content:center;padding:20px';
    panel.innerHTML = '<div style="background:#fff;border-radius:22px;padding:20px;max-width:340px;width:100%;max-height:80vh;overflow:auto">' +
      '<h3 style="margin:0 0 4px;font-size:16px;color:#343441">🎨 Mis estilos de home</h3>' +
      '<p style="margin:0 0 12px;font-size:11.5px;color:#686977;font-weight:700">Tildá los que querés tener. Deslizás y vas pasando solo por esos.</p>' +
      ESTILOS.map(function(x){
        return '<label style="display:flex;gap:9px;align-items:center;padding:8px 2px;font-size:13px;font-weight:800;color:#3c4160">' +
          '<input type="checkbox" data-estilo="' + x[0] + '"' + (a.indexOf(x[0]) >= 0 ? ' checked' : '') + ' style="accent-color:#8b63e8"> ' + x[1] + '</label>';
      }).join('') +
      '<button type="button" id="esConfigOk" style="width:100%;border:0;border-radius:13px;padding:12px;background:linear-gradient(135deg,#5b8def,#8b63e8);color:#fff;font:inherit;font-weight:900;cursor:pointer;margin-top:8px">Listo 💙</button></div>';
    document.body.appendChild(panel);
    panel.querySelector('#esConfigOk').onclick = function(){
      var elegidos = [];
      panel.querySelectorAll('[data-estilo]').forEach(function(c){ if (c.checked) elegidos.push(c.dataset.estilo); });
      if (!elegidos.length) elegidos = ['clasico'];
      localStorage.setItem(claveActivos(), JSON.stringify(elegidos));
      if (elegidos.indexOf(actual()) < 0) localStorage.setItem(claveActual(), elegidos[0]);
      panel.remove();
      montar();
      try{ if (typeof renderHomeCompleto === 'function') renderHomeCompleto(); }catch(e){}
    };
  }

  /* pestañas del estilo B */
  window.esTab = function(btn, n){
    var tabs = btn.parentElement.querySelectorAll('.es-tab');
    tabs.forEach(function(t, i){ t.classList.toggle('on', i === n); });
    esTabPintar(n);
  };
  function esTabPintar(n){
    var c = $('esTabCont');
    if (!c) return;
    var g = gps(), p = parque();
    if (n === 0) c.innerHTML = '<h3 style="margin:0 0 4px;font-size:15px;color:#343441">Tu Panel te espera</h3><p style="margin:0 0 10px;font-size:11.5px;color:#686977;font-weight:650">' + esc(proximaAccion().texto) + '.</p><button type="button" class="es-btn es-verde" style="width:100%" onclick="openMiGestion()">Ver el Hoy</button>';
    if (n === 1) c.innerHTML = '<h3 style="margin:0 0 4px;font-size:15px;color:#343441">GPS: ' + g.A + '/12 PB</h3><p style="margin:0 0 10px;font-size:11.5px;color:#686977;font-weight:650">Patrocinios ' + g.patrocinios9 + '/2 · demos ' + g.demos + '/30.</p><button type="button" class="es-btn es-suave" style="width:100%" onclick="openEquipo()">Mi carrera y equipo</button>';
    if (n === 2) c.innerHTML = '<h3 style="margin:0 0 4px;font-size:15px;color:#343441">' + p.vendidas + ' hogares 🏡</h3><p style="margin:0 0 10px;font-size:11.5px;color:#686977;font-weight:650">' + p.vencidas + ' garantías vencidas: visitas que renacen.</p><button type="button" class="es-btn es-suave" style="width:100%" onclick="showView(\'view-usuarios\')">Ver Usuarios</button>';
  }

  /* hook al home */
  function envolver(){
    if (window.__estilosWrapped) return;
    if (typeof window.showView !== 'function') return;
    window.__estilosWrapped = true;
    var orig = window.showView;
    window.showView = function(id){ var r = orig.apply(this, arguments); try{ if (id === 'view-home') setTimeout(montar, 0); }catch(e){} return r; };
    var origH = window.renderHomeCompleto;
    if (typeof origH === 'function') {
      window.renderHomeCompleto = function(){ var r = origH.apply(this, arguments); try{ montar(); }catch(e){} return r; };
    }
    setTimeout(montar, 1000);
  }
  if (document.readyState === 'complete') envolver();
  else window.addEventListener('load', envolver);
  setTimeout(envolver, 1300);
})();
