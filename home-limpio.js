/* ============================================================
   APPI · Home limpio (v245)
   ------------------------------------------------------------
   La primera pantalla responde una sola pregunta: ¿qué hago
   hoy? Acciones claras, tres números grandes y tu porqué en
   una línea. Todo lo mensual vive en "Tu resumen", a un toque.
   ============================================================ */
(function(){
  'use strict';
  function $(id){ return document.getElementById(id); }
  function uid(){ return window.APPIAuth && window.APPIAuth.userId ? window.APPIAuth.userId() : ''; }
  function esc(s){ return String(s == null ? '' : s).replace(/</g, '&lt;'); }

  function contactos(){
    try{
      var c = JSON.parse(localStorage.getItem('appi_gestion_cache_v1_' + uid()) || 'null');
      return c && Array.isArray(c.contacts) ? c.contacts : [];
    }catch(e){ return []; }
  }
  function acciones(){
    var hoy = new Date().toISOString().slice(0, 10);
    return contactos()
      .filter(function(c){ return ['nuevo', 'seguimiento', 'presentacion'].indexOf(c.estado) >= 0; })
      .sort(function(a, b){ return String(a.proximo_contacto || hoy) <= String(b.proximo_contacto || hoy) ? -1 : 1; })
      .slice(0, 3);
  }
  function porQue(){
    try{
      var v = JSON.parse(localStorage.getItem('appi_porque_v1_' + uid()) || 'null');
      if (v && v.niveles && v.niveles.length) return v.niveles[v.niveles.length - 1];
      var s = JSON.parse(localStorage.getItem('appi_suenos_v1_' + uid()) || 'null');
      if (s && s.para_que) return s.para_que;
    }catch(e){}
    return '';
  }
  function datosMes(){
    var eq = null;
    try{ eq = JSON.parse(localStorage.getItem('equipoData') || 'null'); }catch(e){}
    var raiz = eq && Array.isArray(eq.personas) ? (eq.personas.find(function(p){ return p.nivel === 0; }) || eq.personas[0]) : null;
    return { A: raiz ? (Number(raiz.pnAct) || 0) : 0 };
  }
  function parqueVencidas(){
    var t = 0;
    function sumar(p){ t += Number((p.garantias || {}).vencidas) || 0; (p.hijos || []).forEach(sumar); }
    try{
      var eq = JSON.parse(localStorage.getItem('equipoData') || 'null');
      if (eq && Array.isArray(eq.personas)) eq.personas.forEach(sumar);
    }catch(e){}
    return t;
  }

  function css(){
    if ($('hlStyle')) return;
    var s = document.createElement('style');
    s.id = 'hlStyle';
    s.textContent = '' +
      '#homeLimpio{padding:2px 2px 30px}' +
      '.hl-porque{margin:0 4px 14px;font-size:12px;font-weight:800;color:#8b63e8;line-height:1.4}' +
      '.hl-titulo{margin:0 4px 10px;font-size:15px;font-weight:950;color:#343441}' +
      'body.dark .hl-titulo{color:#f2f2f7}' +
      '.hl-nums{display:flex;gap:9px;margin-bottom:14px}' +
      '.hl-num{flex:1;border:0;background:rgba(255,255,255,.8);border-radius:18px;padding:13px 6px;text-align:center;box-shadow:0 8px 22px rgba(50,60,120,.09);cursor:pointer;font:inherit}' +
      'body.dark .hl-num{background:#25273a}' +
      '.hl-num b{display:block;font-size:21px;color:#3d63c9}' +
      '.hl-num span{font-size:8.5px;font-weight:950;letter-spacing:.5px;color:#7a7f9a}' +
      '.hl-card{background:rgba(255,255,255,.85);border-radius:22px;padding:16px;box-shadow:0 12px 30px rgba(50,60,120,.10);margin-bottom:13px}' +
      'body.dark .hl-card{background:#25273a}' +
      '.hl-accion{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(80,90,130,.08)}' +
      '.hl-accion:last-child{border:0}' +
      '.hl-accion .hl-info{flex:1;min-width:0}' +
      '.hl-accion b{display:block;font-size:13px;color:#343441;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      'body.dark .hl-accion b{color:#f2f2f7}' +
      '.hl-accion small{font-size:10px;font-weight:800;color:#8a8fae}' +
      '.hl-wa{border:0;border-radius:12px;padding:9px 12px;background:linear-gradient(135deg,#3ad0a4,#25c46a);color:#fff;font:inherit;font-size:11.5px;font-weight:900;cursor:pointer;flex:none}' +
      '.hl-duo{display:flex;gap:10px;margin-bottom:13px}' +
      '.hl-duo button{flex:1;border:0;border-radius:18px;padding:15px 8px;font:inherit;font-size:13px;font-weight:950;cursor:pointer}' +
      '.hl-duo .hl-enc{background:linear-gradient(135deg,#5b8def,#8b63e8,#ff6bcf);color:#fff;box-shadow:0 10px 24px rgba(140,90,220,.30)}' +
      '.hl-duo .hl-add{background:rgba(255,255,255,.85);color:#6b4bb8;border:1.5px dashed #c9b7f5;box-shadow:0 8px 20px rgba(50,60,120,.08)}' +
      'body.dark .hl-duo .hl-add{background:#25273a}' +
      '.hl-resumen{width:100%;border:0;background:transparent;color:#7a7f9a;font:inherit;font-size:12.5px;font-weight:900;padding:10px;cursor:pointer}' +
      '.hl-vacio{text-align:center;padding:18px 10px;font-size:13px;font-weight:850;color:#168765}';
    document.head.appendChild(s);
  }

  function html(){
    var acts = acciones();
    var m = datosMes();
    var venc = parqueVencidas();
    var pq = porQue();

    var lista = acts.length
      ? acts.map(function(c){
          return '<div class="hl-accion"><div class="hl-info"><b>' + esc(c.nombre) + '</b><small>' +
            (c.estado === 'presentacion' ? '🎤 Presentación' : c.estado === 'nuevo' ? '✨ Nuevo, sin llamar' : '🔁 Seguimiento') +
            (c.proximo_contacto ? ' · ' + esc(c.proximo_contacto) : ' · hoy') + '</small></div>' +
            '<button type="button" class="hl-wa" data-wa="' + esc(c.telefono || '') + '">WhatsApp</button></div>';
        }).join('')
      : '<div class="hl-vacio">🎉 Todo al día. Buen momento para mandar una encuesta.</div>';

    return '<div id="homeLimpio">' +
      (pq ? '<p class="hl-porque">💙 ' + esc(pq) + '</p>' : '') +
      '<div class="hl-nums">' +
      '<button type="button" class="hl-num" onclick="openMiGestion()"><b>' + acts.length + '</b><span>PARA HOY</span></button>' +
      '<button type="button" class="hl-num" onclick="showView(\'view-negocio\')"><b>' + m.A + '/12</b><span>PB DEL MES</span></button>' +
      '<button type="button" class="hl-num" onclick="showView(\'view-usuarios\')"><b>' + venc + '</b><span>VISITAS RENACEN</span></button>' +
      '</div>' +
      '<div class="hl-titulo">¿Quién te espera hoy?</div>' +
      '<div class="hl-card">' + lista + '</div>' +
      '<div class="hl-duo">' +
      '<button type="button" class="hl-enc" id="hlEncuesta">📨 Enviar encuesta</button>' +
      '<button type="button" class="hl-add" id="hlAgregar">＋ Agregar contacto</button>' +
      '</div>' +
      '</div>';
  }

  function render(){
    var host = $('view-home');
    if (!host) return;
    css();
    var viejo = $('homeLimpio');
    if (viejo) viejo.remove();
    var header = host.querySelector('header');
    header.insertAdjacentHTML('afterend', html());
    function esperarYClicar(id){
      var t0 = Date.now();
      (function loop(){
        var b = $(id);
        if (b) { b.click(); return; }
        if (Date.now() - t0 < 2500) setTimeout(loop, 120);
      })();
    }
    $('hlEncuesta').onclick = function(){ window.openMiGestion(); esperarYClicar('surveyShareBtn'); };
    $('hlAgregar').onclick = function(){ window.openMiGestion(); esperarYClicar('genteNuevo'); };
    host.querySelectorAll('[data-wa]').forEach(function(b){
      b.onclick = function(){
        var tel = String(b.dataset.wa || '').replace(/\D/g, '');
        var url = 'https://wa.me/' + tel + '?text=' + encodeURIComponent('¡Hola! Soy ' + (window.APPIAuth && window.APPIAuth.currentProfile ? String(window.APPIAuth.currentProfile().nombre || '').split(/\s+/)[0] : '') + ' 😊 ¿Cómo estás? Quería retomarte, ¿te viene bien que charlemos hoy?');
        if (window.APPIWhatsApp && window.APPIWhatsApp.abrir) window.APPIWhatsApp.abrir(url);
        else window.open(url, '_blank', 'noopener');
      };
    });
  }

  /* -------- el home limpio no necesita el home viejo -------- */
  function mudar(){
    var host = $('view-home');
    if (!host) return;
    var head = host.querySelector('.home-section-head'); if (head) head.remove();
    var tools = $('toolsList'); if (tools) tools.remove();
    var backup = $('backupCollapsible');
    if (backup && $('view-herramientas')) $('view-herramientas').appendChild(backup);
  }

  function envolver(){
    if (window.__homeLimpioWrapped) return;
    if (typeof window.showView !== 'function') return;
    window.__homeLimpioWrapped = true;
    mudar();
    var orig = window.showView;
    window.showView = function(id){
      var r = orig.apply(this, arguments);
      try{
        if (id === 'view-home') render();
        if (['view-mes','view-negocio','view-herramientas'].indexOf(id) >= 0 && typeof window.renderHomeCompleto === 'function') window.renderHomeCompleto();
      }catch(e){}
      return r;
    };
    var origH = window.renderHomeCompleto;
    if (typeof origH === 'function') {
      window.renderHomeCompleto = function(){ var r = origH.apply(this, arguments); try{ if ($('view-home') && $('view-home').classList.contains('active')) render(); }catch(e){} return r; };
    }
    setTimeout(function(){ mudar(); if ($('view-home').classList.contains('active')) render(); }, 900);
  }
  if (document.readyState === 'complete') envolver();
  else window.addEventListener('load', envolver);
  setTimeout(envolver, 1300);
})();
