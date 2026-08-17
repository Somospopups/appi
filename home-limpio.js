/* ============================================================
   APPI · Home limpio (v247)
   ------------------------------------------------------------
   La primera pantalla muestra las notificaciones y acciones
   del día. Sin números grandes, sin ruido. Solo lo que importa.
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

  function css(){
    if ($('hlStyle')) return;
    var s = document.createElement('style');
    s.id = 'hlStyle';
    s.textContent = '' +
      '#homeLimpio{padding:2px 2px 30px}' +
      '.hl-porque{margin:0 4px 14px;font-size:12px;font-weight:800;color:#8b63e8;line-height:1.4}' +
      '.hl-titulo{margin:0 4px 10px;font-size:15px;font-weight:950;color:#343441}' +
      'body.dark .hl-titulo{color:#f2f2f7}' +
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
      '.hl-vacio{text-align:center;padding:18px 10px;font-size:13px;font-weight:850;color:#168765}' +
      /* Timeline / Agenda de hoy */
      '.hl-kicker{font-size:9.5px;font-weight:900;letter-spacing:.8px;color:#168765;margin-bottom:10px;text-transform:uppercase}' +
      '.hl-timeline{position:relative;padding-left:24px}' +
      '.hl-timeline::before{content:"";position:absolute;left:8px;top:8px;bottom:8px;width:2px;background:#e8ebf7;border-radius:2px}' +
      'body.dark .hl-timeline::before{background:rgba(255,255,255,.1)}' +
      '.hl-ev{position:relative;padding:10px 0}' +
      '.hl-ev-dot{position:absolute;left:-20px;top:14px;width:12px;height:12px;border-radius:50%;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.12)}' +
      'body.dark .hl-ev-dot{border-color:#25273a}' +
      '.hl-ev-time{font-size:12.5px;font-weight:800;color:#23263a;margin-bottom:2px}' +
      'body.dark .hl-ev-time{color:#f2f2f7}' +
      '.hl-ev-desc{font-size:11.5px;color:#7a7f9a;font-weight:600;margin:0;line-height:1.4}' +
      '.hl-ev-actions{display:flex;gap:8px;margin-top:8px}' +
      '.hl-ev-btn{border:0;border-radius:12px;padding:9px 14px;font:inherit;font-size:11.5px;font-weight:900;cursor:pointer}' +
      '.hl-ev-btn.verde{background:linear-gradient(135deg,#3ad0a4,#25c46a);color:#fff;box-shadow:0 6px 14px rgba(37,208,164,.3)}' +
      '.hl-ev-btn.suave{background:#eef1fa;color:#5a6082}' +
      'body.dark .hl-ev-btn.suave{background:rgba(255,255,255,.1);color:#c6cbea}' +
      '.hl-link{width:100%;border:0;background:rgba(255,255,255,.85);border-radius:18px;padding:14px;font:inherit;font-size:13px;font-weight:900;color:#5a6082;box-shadow:0 8px 20px rgba(50,60,120,.08);cursor:pointer;text-align:center}' +
      'body.dark .hl-link{background:#25273a;color:#c6cbea}';
    document.head.appendChild(s);
  }

  function html(){
    var acts = acciones();
    var pq = porQue();
    var hoy = new Date();
    var hora = hoy.getHours();
    var minutos = hoy.getMinutes();
    var horaStr = hora + ':' + (minutos < 10 ? '0' : '') + minutos;

    // Construir eventos de la timeline
    var eventos = [];

    // Evento 1: Resumen de la mañana (siempre visible)
    eventos.push({
      hora: '9:00',
      titulo: 'Resumen en tu teléfono',
      desc: 'Ya enviado: tus acciones del día.',
      color: '#25d0a4',
      acciones: []
    });

    // Evento 2: Contactos pendientes (si hay)
    if (acts.length > 0) {
      var primer = acts[0];
      eventos.push({
        hora: 'Ahora',
        titulo: primer.nombre + ' espera tu mensaje',
        desc: primer.estado === 'presentacion' ? '🎤 Presentación programada' : primer.estado === 'nuevo' ? '✨ Contacto nuevo sin llamar' : '🔁 Seguimiento pendiente',
        color: '#f5b301',
        acciones: [
          { texto: 'Escribir', clase: 'verde', wa: primer.telefono },
          { texto: 'Llamar', clase: 'suave', tel: primer.telefono }
        ]
      });
    }

    // Evento 3: Si hay más contactos, mostrar el siguiente
    if (acts.length > 1) {
      var segundo = acts[1];
      eventos.push({
        hora: '20:00',
        titulo: segundo.nombre,
        desc: segundo.estado === 'presentacion' ? '🎤 Demo programada' : '📇 Seguimiento programado',
        color: '#8b63e8',
        acciones: []
      });
    }

    // Renderizar timeline
    var timelineHtml = '<div class="hl-timeline">';
    eventos.forEach(function(ev) {
      timelineHtml += '<div class="hl-ev">' +
        '<div class="hl-ev-dot" style="background:' + ev.color + '"></div>' +
        '<div class="hl-ev-time">' + ev.hora + ' · ' + esc(ev.titulo) + '</div>' +
        '<p class="hl-ev-desc">' + esc(ev.desc) + '</p>';
      if (ev.acciones.length > 0) {
        timelineHtml += '<div class="hl-ev-actions">';
        ev.acciones.forEach(function(acc) {
          if (acc.wa) {
            timelineHtml += '<button class="hl-ev-btn ' + acc.clase + '" data-wa="' + esc(acc.wa) + '">' + esc(acc.texto) + '</button>';
          } else if (acc.tel) {
            timelineHtml += '<button class="hl-ev-btn ' + acc.clase + '" data-tel="' + esc(acc.tel) + '">' + esc(acc.texto) + '</button>';
          }
        });
        timelineHtml += '</div>';
      }
      timelineHtml += '</div>';
    });
    timelineHtml += '</div>';

    return '<div id="homeLimpio">' +
      (pq ? '<p class="hl-porque">💙 ' + esc(pq) + '</p>' : '') +
      '<div class="hl-card">' +
        '<div class="hl-kicker">Tu jornada</div>' +
        timelineHtml +
      '</div>' +
      (acts.length > 0 ? '<button class="hl-link" onclick="openMiGestion()">Ver todo el Panel ›</button>' : '') +
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
    // WhatsApp buttons
    host.querySelectorAll('[data-wa]').forEach(function(b){
      b.onclick = function(){
        var tel = String(b.dataset.wa || '').replace(/\D/g, '');
        var url = 'https://wa.me/' + tel + '?text=' + encodeURIComponent('¡Hola! Soy ' + (window.APPIAuth && window.APPIAuth.currentProfile ? String(window.APPIAuth.currentProfile().nombre || '').split(/\s+/)[0] : '') + ' 😊 ¿Cómo estás? Quería retomarte, ¿te viene bien que charlemos hoy?');
        if (window.APPIWhatsApp && window.APPIWhatsApp.abrir) window.APPIWhatsApp.abrir(url);
        else window.open(url, '_blank', 'noopener');
      };
    });
    // Llamar buttons
    host.querySelectorAll('[data-tel]').forEach(function(b){
      b.onclick = function(){
        var tel = String(b.dataset.tel || '').replace(/\D/g, '');
        if (tel) window.open('tel:' + tel, '_self');
      };
    });
  }

  /* -------- el home limpio no necesita el home viejo -------- */
  function mudar(){
    var host = $('view-home');
    if (!host) return;
    var head = host.querySelector('.home-section-head'); if (head) head.remove();
    var tools = $('toolsList'); if (tools) tools.remove();
    // v247: el backup ya no se mueve a herramientas, queda oculto en el home
    var backup = $('backupCollapsible');
    if (backup) backup.style.display = 'none';
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
