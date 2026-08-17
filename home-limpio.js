/* ============================================================
   APPI · Home limpio (v247) — Agenda + Calendario
   ------------------------------------------------------------
   La primera pantalla muestra tu jornada como timeline.
   Al tocar la card se abre un calendario mensual donde
   podés agregar tareas a cualquier día.
   ============================================================ */
(function(){
  'use strict';
  function $(id){ return document.getElementById(id); }
  function uid(){ return window.APPIAuth && window.APPIAuth.userId ? window.APPIAuth.userId() : ''; }
  function esc(s){ return String(s == null ? '' : s).replace(/</g, '&lt;'); }

  var MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  var DAYS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

  /* ---- Tareas del calendario ---- */
  function tareasKey(){ return 'appi_cal_tareas_v1_' + uid(); }
  function leerTareas(){
    try{ return JSON.parse(localStorage.getItem(tareasKey()) || '{}'); }catch(e){ return {}; }
  }
  function guardarTareas(t){ localStorage.setItem(tareasKey(), JSON.stringify(t)); }
  function tareasDe(fecha){
    var t = leerTareas();
    return t[fecha] || [];
  }
  function agregarTarea(fecha, texto){
    if(!texto || !texto.trim()) return;
    var t = leerTareas();
    if(!t[fecha]) t[fecha] = [];
    t[fecha].push({ id: Date.now(), texto: texto.trim(), done: false });
    guardarTareas(t);
  }
  function eliminarTarea(fecha, id){
    var t = leerTareas();
    if(!t[fecha]) return;
    t[fecha] = t[fecha].filter(function(x){ return x.id !== id; });
    if(t[fecha].length === 0) delete t[fecha];
    guardarTareas(t);
  }
  function toggleTarea(fecha, id){
    var t = leerTareas();
    if(!t[fecha]) return;
    t[fecha].forEach(function(x){ if(x.id === id) x.done = !x.done; });
    guardarTareas(t);
  }

  /* ---- Contactos del panel ---- */
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

  /* ---- CSS ---- */
  function css(){
    if ($('hlStyle')) return;
    var s = document.createElement('style');
    s.id = 'hlStyle';
    s.textContent = '' +
      '#homeLimpio{padding:2px 2px 12px}' +
      '.hl-porque{margin:0 4px 12px;font-size:12px;font-weight:800;color:#8b63e8;line-height:1.4}' +
      '.hl-card{background:rgba(255,255,255,.85);border-radius:22px;padding:16px;box-shadow:0 12px 30px rgba(50,60,120,.10);margin-bottom:0;cursor:pointer;transition:transform .12s}' +
      '.hl-card:active{transform:scale(.98)}' +
      'body.dark .hl-card{background:#25273a}' +
      '.hl-vacio{text-align:center;padding:18px 10px;font-size:13px;font-weight:850;color:#168765}' +
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
      '.hl-link{width:100%;border:0;background:rgba(255,255,255,.85);border-radius:18px;padding:14px;font:inherit;font-size:13px;font-weight:900;color:#5a6082;box-shadow:0 8px 20px rgba(50,60,120,.08);cursor:pointer;text-align:center;margin-top:12px}' +
      'body.dark .hl-link{background:#25273a;color:#c6cbea}' +

      /* Calendario modal */
      '.cal-overlay{position:fixed;inset:0;z-index:200;background:rgba(20,20,30,.55);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);display:flex;align-items:flex-end;justify-content:center;padding:20px;opacity:0;pointer-events:none;transition:opacity .25s ease}' +
      '.cal-overlay.open{opacity:1;pointer-events:auto}' +
      '.cal-modal{background:rgba(255,255,255,.98);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);border-radius:24px 24px 0 0;width:100%;max-width:480px;max-height:85vh;overflow-y:auto;box-shadow:0 -10px 40px rgba(0,0,0,.2);transform:translateY(20px);transition:transform .3s cubic-bezier(.34,1.56,.64,1);padding-bottom:calc(env(safe-area-inset-bottom) + 12px)}' +
      '.cal-overlay.open .cal-modal{transform:translateY(0)}' +
      'body.dark .cal-modal{background:rgba(30,30,50,.98)}' +
      '.cal-head{padding:18px 18px 8px;display:flex;align-items:center;gap:8px;position:sticky;top:0;background:rgba(255,255,255,.98);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);border-radius:24px 24px 0 0;z-index:2}' +
      'body.dark .cal-head{background:rgba(30,30,50,.98)}' +
      '.cal-head h2{margin:0;font-size:18px;font-weight:900;color:#23263a;letter-spacing:-.3px;flex:1;min-width:0}' +
      'body.dark .cal-head h2{color:#f2f2f7}' +
      '.cal-nav{display:flex;gap:6px;flex:none}' +
      '.cal-nav button{width:34px;height:34px;border-radius:10px;border:0;background:rgba(91,141,239,.1);color:#3d63c9;font-size:16px;font-weight:900;cursor:pointer;display:flex;align-items:center;justify-content:center}' +
      '.cal-nav button:active{transform:scale(.9)}' +
      'body.dark .cal-nav button{background:rgba(91,141,239,.2);color:#a8b8ff}' +
      '.cal-close{width:30px;height:30px;border-radius:50%;background:rgba(0,0,0,.06);border:0;font-size:16px;font-weight:700;color:#6b6b76;cursor:pointer;display:flex;align-items:center;justify-content:center;flex:none}' +
      'body.dark .cal-close{background:rgba(255,255,255,.1);color:#a0a0b0}' +

      '.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;padding:4px 14px 8px}' +
      '.cal-day-name{text-align:center;font-size:9px;font-weight:900;color:#8a8fae;letter-spacing:.5px;text-transform:uppercase;padding:6px 0}' +
      '.cal-day{position:relative;min-height:40px;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;font-size:13px;font-weight:700;color:#343441;transition:all .12s}' +
      '.cal-day:active{transform:scale(.92)}' +
      '.cal-day.empty{color:transparent;cursor:default;pointer-events:none}' +
      '.cal-day.today{background:linear-gradient(135deg,#5b8def,#8b63e8);color:#fff;box-shadow:0 4px 12px rgba(91,141,239,.3)}' +
      '.cal-day.selected{background:rgba(91,141,239,.12);color:#3d63c9;box-shadow:inset 0 0 0 2px #5b8def}' +
      '.cal-day.today.selected{background:linear-gradient(135deg,#5b8def,#8b63e8);color:#fff;box-shadow:0 4px 12px rgba(91,141,239,.3),inset 0 0 0 2px rgba(255,255,255,.5)}' +
      '.cal-day.has-tasks::after{content:"";position:absolute;bottom:4px;width:5px;height:5px;border-radius:50%;background:#f5b301}' +
      '.cal-day.today.has-tasks::after{background:#fff}' +
      'body.dark .cal-day{color:#c6cbea}' +
      'body.dark .cal-day.selected{background:rgba(91,141,239,.25);color:#a8b8ff}' +

      '.cal-tasks{padding:8px 18px 14px;border-top:1px solid rgba(80,90,130,.08)}' +
      '.cal-tasks-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}' +
      '.cal-tasks-head h3{margin:0;font-size:14px;font-weight:900;color:#23263a}' +
      'body.dark .cal-tasks-head h3{color:#f2f2f7}' +
      '.cal-tasks-head .cal-date{font-size:11px;color:#8a8fae;font-weight:700}' +
      '.cal-task{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(80,90,130,.06)}' +
      '.cal-task:last-child{border:0}' +
      '.cal-task-check{width:22px;height:22px;border-radius:6px;border:2px solid rgba(80,90,130,.25);background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;flex:none;font-size:12px;color:transparent;transition:all .15s}' +
      '.cal-task-check.done{background:#3ad0a4;border-color:#3ad0a4;color:#fff}' +
      'body.dark .cal-task-check{background:rgba(40,40,60,.7);border-color:rgba(255,255,255,.15)}' +
      '.cal-task-text{flex:1;font-size:13px;color:#343441;font-weight:600;min-width:0}' +
      '.cal-task-text.done{text-decoration:line-through;opacity:.5}' +
      'body.dark .cal-task-text{color:#e0e0e8}' +
      '.cal-task-del{border:0;background:none;color:#d9534f;font-size:16px;cursor:pointer;padding:0 4px;opacity:.6}' +
      '.cal-task-del:hover{opacity:1}' +
      '.cal-add{display:flex;gap:8px;margin-top:8px}' +
      '.cal-add input{flex:1;border:1px dashed rgba(80,90,130,.25);border-radius:12px;padding:10px 12px;font:inherit;font-size:13px;background:rgba(255,255,255,.6);color:#23263a;outline:none}' +
      '.cal-add input:focus{border-color:#5b8def;border-style:solid}' +
      'body.dark .cal-add input{background:rgba(40,40,60,.5);color:#f2f2f7;border-color:rgba(255,255,255,.15)}' +
      '.cal-add button{border:0;border-radius:12px;padding:10px 16px;background:linear-gradient(135deg,#5b8def,#8b63e8);color:#fff;font:inherit;font-size:13px;font-weight:900;cursor:pointer}' +
      '.cal-add button:active{transform:scale(.94)}' +
      '.cal-empty{text-align:center;padding:14px;font-size:12px;color:#8a8fae;font-weight:700}';
    document.head.appendChild(s);
  }

  /* ---- HTML de la timeline ---- */
  function html(){
    var acts = acciones();
    var pq = porQue();
    var hoy = new Date().toISOString().slice(0,10);
    var tareasHoy = tareasDe(hoy);

    var eventos = [];

    // Tareas del calendario para hoy
    tareasHoy.filter(function(t){ return !t.done; }).forEach(function(t){
      eventos.push({
        hora: '📌',
        titulo: t.texto,
        desc: 'Tarea de hoy',
        color: '#5b8def',
        acciones: []
      });
    });

    // Evento: Resumen de la mañana
    eventos.push({
      hora: '9:00',
      titulo: 'Resumen en tu teléfono',
      desc: 'Ya enviado: tus acciones del día.',
      color: '#25d0a4',
      acciones: []
    });

    // Contactos pendientes
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
      '<div class="hl-card" id="hlCardOpen">' +
        '<div class="hl-kicker">Tu jornada</div>' +
        timelineHtml +
      '</div>' +
      (acts.length > 0 ? '<button class="hl-link" onclick="openMiGestion()">Ver todo el Panel ›</button>' : '') +
      '</div>';
  }

  /* ---- Calendario modal ---- */
  var calState = { year: 0, month: 0, selected: '' };

  function initCalState(){
    var now = new Date();
    calState.year = now.getFullYear();
    calState.month = now.getMonth();
    calState.selected = now.toISOString().slice(0,10);
  }

  function ensureCalOverlay(){
    if($('calOverlay')) return;
    var ov = document.createElement('div');
    ov.id = 'calOverlay';
    ov.className = 'cal-overlay';
    ov.innerHTML = '<div class="cal-modal" id="calModal"></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function(e){ if(e.target === ov) closeCal(); });
  }

  function openCal(){
    css();
    initCalState();
    ensureCalOverlay();
    renderCal();
    setTimeout(function(){ $('calOverlay').classList.add('open'); }, 10);
  }
  function closeCal(){
    var ov = $('calOverlay');
    if(ov) ov.classList.remove('open');
    render(); // re-render home to show updated tasks
  }

  function renderCal(){
    var modal = $('calModal');
    if(!modal) return;
    var y = calState.year, m = calState.month;
    var firstDay = new Date(y, m, 1).getDay();
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    var today = new Date().toISOString().slice(0,10);
    var tareas = leerTareas();

    var html = '<div class="cal-head">' +
      '<h2>' + MONTHS[m] + ' ' + y + '</h2>' +
      '<div class="cal-nav">' +
        '<button id="calPrev">‹</button>' +
        '<button id="calNext">›</button>' +
      '</div>' +
      '<button class="cal-close" id="calClose">×</button>' +
    '</div>';

    html += '<div class="cal-grid">';
    DAYS.forEach(function(d){ html += '<div class="cal-day-name">' + d + '</div>'; });
    for(var i = 0; i < firstDay; i++) html += '<div class="cal-day empty"></div>';
    for(var d = 1; d <= daysInMonth; d++){
      var fecha = y + '-' + String(m+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
      var cls = 'cal-day';
      if(fecha === today) cls += ' today';
      if(fecha === calState.selected) cls += ' selected';
      if(tareas[fecha] && tareas[fecha].length > 0) cls += ' has-tasks';
      html += '<div class="' + cls + '" data-date="' + fecha + '">' + d + '</div>';
    }
    html += '</div>';

    // Tareas del día seleccionado
    var sel = calState.selected;
    var selDate = new Date(sel + 'T12:00:00');
    var selLabel = selDate.getDate() + ' de ' + MONTHS[selDate.getMonth()];
    var tareasSel = tareasDe(sel);

    html += '<div class="cal-tasks">';
    html += '<div class="cal-tasks-head"><h3>Tareas del día</h3><span class="cal-date">' + selLabel + '</span></div>';

    if(tareasSel.length > 0){
      tareasSel.forEach(function(t){
        html += '<div class="cal-task">' +
          '<div class="cal-task-check' + (t.done ? ' done' : '') + '" data-task-id="' + t.id + '" data-task-date="' + sel + '">' + (t.done ? '✓' : '') + '</div>' +
          '<span class="cal-task-text' + (t.done ? ' done' : '') + '">' + esc(t.texto) + '</span>' +
          '<button class="cal-task-del" data-task-del="' + t.id + '" data-task-date="' + sel + '">✕</button>' +
        '</div>';
      });
    } else {
      html += '<div class="cal-empty">Sin tareas para este día</div>';
    }

    html += '<div class="cal-add">' +
      '<input type="text" id="calNewTask" placeholder="Nueva tarea…">' +
      '<button id="calAddBtn">＋</button>' +
    '</div>';
    html += '</div>';

    modal.innerHTML = html;

    // Bind events
    $('calPrev').onclick = function(){ calState.month--; if(calState.month < 0){ calState.month = 11; calState.year--; } renderCal(); };
    $('calNext').onclick = function(){ calState.month++; if(calState.month > 11){ calState.month = 0; calState.year++; } renderCal(); };
    $('calClose').onclick = closeCal;

    modal.querySelectorAll('.cal-day:not(.empty)').forEach(function(el){
      el.onclick = function(){ calState.selected = el.dataset.date; renderCal(); };
    });

    modal.querySelectorAll('.cal-task-check').forEach(function(el){
      el.onclick = function(){ toggleTarea(el.dataset.taskDate, Number(el.dataset.taskId)); renderCal(); };
    });

    modal.querySelectorAll('.cal-task-del').forEach(function(el){
      el.onclick = function(){ eliminarTarea(el.dataset.taskDate, Number(el.dataset.taskDel)); renderCal(); };
    });

    var addBtn = $('calAddBtn');
    var addInput = $('calNewTask');
    function doAdd(){
      var txt = addInput.value.trim();
      if(!txt) return;
      agregarTarea(calState.selected, txt);
      addInput.value = '';
      renderCal();
    }
    addBtn.onclick = doAdd;
    addInput.onkeydown = function(e){ if(e.key === 'Enter') doAdd(); };
  }

  /* ---- Render principal ---- */
  function render(){
    var host = $('view-home');
    if (!host) return;
    css();
    var viejo = $('homeLimpio');
    if (viejo) viejo.remove();
    var header = host.querySelector('header');
    header.insertAdjacentHTML('afterend', html());

    // Abrir calendario al tocar la card
    var cardOpen = $('hlCardOpen');
    if(cardOpen) cardOpen.onclick = function(e){
      if(e.target.closest('.hl-ev-btn')) return; // no abrir si tocó un botón de acción
      openCal();
    };

    // WhatsApp buttons
    host.querySelectorAll('[data-wa]').forEach(function(b){
      b.onclick = function(e){
        e.stopPropagation();
        var tel = String(b.dataset.wa || '').replace(/\D/g, '');
        var url = 'https://wa.me/' + tel + '?text=' + encodeURIComponent('¡Hola! Soy ' + (window.APPIAuth && window.APPIAuth.currentProfile ? String(window.APPIAuth.currentProfile().nombre || '').split(/\s+/)[0] : '') + ' 😊 ¿Cómo estás? Quería retomarte, ¿te viene bien que charlemos hoy?');
        if (window.APPIWhatsApp && window.APPIWhatsApp.abrir) window.APPIWhatsApp.abrir(url);
        else window.open(url, '_blank', 'noopener');
      };
    });
    // Llamar buttons
    host.querySelectorAll('[data-tel]').forEach(function(b){
      b.onclick = function(e){
        e.stopPropagation();
        var tel = String(b.dataset.tel || '').replace(/\D/g, '');
        if (tel) window.open('tel:' + tel, '_self');
      };
    });
  }

  /* ---- Limpiar home viejo ---- */
  function mudar(){
    var host = $('view-home');
    if (!host) return;
    var head = host.querySelector('.home-section-head'); if (head) head.remove();
    var tools = $('toolsList'); if (tools) tools.remove();
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

  // Exponer para uso global
  window.APPICalendario = { open: openCal, close: closeCal, tareas: leerTareas, agregar: agregarTarea };
})();
