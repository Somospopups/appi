/* ============================================================
   APPI · Home en tres pilares + tarea de hoy (usuarios)
   ------------------------------------------------------------
   v1: no saca Mi mes / Mi negocio / herramientas.
   En el Home: una tarea de usuarios (la jornada que ya existe)
   y las cartas agrupadas en Usuarios / Equipo / Desarrollo.
   ============================================================ */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function card(cfg) {
    if (typeof window.renderHomeQuickCard === 'function') return window.renderHomeQuickCard(cfg);
    return '';
  }
  function css() {
    if (document.getElementById('pilarCss')) return;
    var s = document.createElement('style');
    s.id = 'pilarCss';
    s.textContent =
      '#hoyUsuarios{margin:0 0 14px}' +
      '.pilar-hoy{position:relative;overflow:hidden;padding:16px 16px 14px;border-radius:22px;background:linear-gradient(145deg,#0b5878,#1a7aa0 62%,#5b8def);color:#fff;box-shadow:0 14px 32px rgba(11,88,120,.28)}' +
      '.pilar-hoy:after{content:\"\";position:absolute;right:-40px;top:-50px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,.1)}' +
      '.pilar-hoy>*{position:relative;z-index:1}' +
      '.pilar-hoy .k{display:block;font-size:10px;font-weight:950;letter-spacing:.8px;text-transform:uppercase;opacity:.78}' +
      '.pilar-hoy h3{margin:4px 0 6px;font-size:18px;line-height:1.2;font-weight:900}' +
      '.pilar-hoy p{margin:0;font-size:13px;line-height:1.45;opacity:.92}' +
      '.pilar-hoy .bar{height:6px;margin:12px 0 10px;border-radius:999px;background:rgba(255,255,255,.22);overflow:hidden}' +
      '.pilar-hoy .bar i{display:block;height:100%;border-radius:inherit;background:#f3eee3}' +
      '.pilar-hoy .go{display:flex;align-items:center;justify-content:center;width:100%;min-height:46px;margin-top:4px;border:0;border-radius:14px;background:#f3eee3;color:#0b5878;font:inherit;font-size:14px;font-weight:900;cursor:pointer}' +
      '.pilar-hoy.ok{background:linear-gradient(145deg,#178a6c,#3ad0a4)}' +
      '.pilar-hoy.vacio{background:linear-gradient(145deg,#5a6278,#7a849c)}' +
      '.pilar-bloque{margin:0 0 16px}' +
      '.pilar-bloque .pilar-h{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin:2px 2px 8px}' +
      '.pilar-bloque .pilar-h span{display:block;color:#8a8a94;font-size:10.5px;font-weight:950;letter-spacing:.7px;text-transform:uppercase}' +
      '.pilar-bloque .pilar-h h2{margin:2px 0 0;color:#1c1c27;font-size:18px;font-weight:950;letter-spacing:-.4px}' +
      '.pilar-bloque .pilar-h em{font-style:normal;padding:5px 9px;border-radius:999px;background:rgba(11,88,120,.1);color:#0b5878;font-size:10px;font-weight:900}' +
      'body.dark .pilar-bloque .pilar-h h2{color:#f0f0f5}' +
      'body.dark .pilar-bloque .pilar-h em{background:rgba(91,141,239,.18);color:#c5d4ff}';
    document.head.appendChild(s);
  }

  function pintarHoy() {
    var host = document.getElementById('hoyUsuarios');
    if (!host) return;
    var M = window.APPIMensajes;
    var irUsuarios = function () {
      if (typeof window.showView === 'function') window.showView('view-usuarios');
    };

    if (!M || typeof M.resumenHoy !== 'function') {
      host.innerHTML = '<div class="pilar-hoy vacio"><span class="k">Hoy · usuarios</span><h3>Tu jornada</h3><p>Cuando esté la planilla de usuarios, acá aparece qué hacer hoy.</p><button type="button" class="go" id="pilarHoyGo">Ir a Usuarios</button></div>';
      var g0 = document.getElementById('pilarHoyGo');
      if (g0) g0.onclick = irUsuarios;
      return;
    }

    var r = M.resumenHoy() || {};
    var p = (M.partidoHoy && M.partidoHoy()) || {};
    var pend = (M.pendientes && M.pendientes()) || [];
    var primero = pend[0];
    var pct = r.total ? Math.round((r.hechas || 0) / r.total * 100) : 0;
    var html = '';
    var goTxt = 'Empezar';
    var goFn = irUsuarios;
    var cls = '';

    if (!r.total) {
      cls = 'vacio';
      html = '<span class="k">Hoy · usuarios</span><h3>Sin urgencias</h3><p>Hoy no hay una lista armada. Entrá a Usuarios cuando quieras revisar la cartera.</p>';
      goTxt = 'Ir a Usuarios';
    } else if (p.ganado) {
      cls = 'ok';
      html = '<span class="k">Hoy · usuarios</span><h3>Hoy ya está</h3><p>' + (r.hechas || 0) + ' de ' + r.total + ' hechas. Mañana se arma una lista nueva.</p>';
      goTxt = 'Ver Usuarios';
    } else {
      var mot = primero && primero.motivo;
      var quedan = primero && primero.gente ? primero.gente.length : (r.pendientes || 0);
      var que = mot ? (mot.icono + ' ' + mot.nombre) : 'Tu jornada';
      html = '<span class="k">Hoy · usuarios · ' + (r.hechas || 0) + ' / ' + r.total + '</span>' +
        '<h3>' + esc(que) + '</h3>' +
        '<p>' + (quedan === 1 ? 'Queda 1 persona.' : 'Quedan ' + quedan + '.') + ' Tocá y se abre lista para escribirle.</p>' +
        '<div class="bar"><i style="width:' + pct + '%"></i></div>';
      goTxt = mot ? ('Empezar · ' + mot.nombre) : 'Empezar';
      if (mot && typeof M.abrirFila === 'function') {
        goFn = function () { M.abrirFila(mot.id); };
      }
    }
    host.innerHTML = '<div class="pilar-hoy ' + cls + '">' + html + '<button type="button" class="go" id="pilarHoyGo">' + esc(goTxt) + '</button></div>';
    var g = document.getElementById('pilarHoyGo');
    if (g) g.onclick = goFn;
  }

  function pintarPilares() {
    var host = document.getElementById('toolsList');
    if (!host) return;
    var eq = typeof window.obtenerDatosEquipo === 'function' ? window.obtenerDatosEquipo() : {};
    var equipoCargado = !!(eq && eq.existe && (eq.total || 0) > 0);
    var nSeg = typeof window.seguimientoPendientes === 'function' ? window.seguimientoPendientes() : 0;

    var usuarios = [
      card({ icon: '💧', title: 'Usuarios', sub: 'Garantías y vencimientos', statusVal: 'Cartera', statusClass: 'pending', progressPct: 100, timeAgo: 'La jornada del día', onClick: "showView('view-usuarios')", accent: '#3ad0a4', gradient: 'linear-gradient(135deg,#3ad0a4,#5b8def)' }),
      card({ icon: '📇', title: 'Panel de Contactos', sub: 'Encuestas y seguimiento', statusVal: String(nSeg || '—'), statusClass: nSeg ? 'pending' : 'empty', progressPct: nSeg ? 100 : 0, timeAgo: nSeg ? (nSeg + ' pend.') : 'Al día', onClick: 'openMiGestion()', accent: '#a06bff', gradient: 'linear-gradient(135deg,#a06bff,#5b8def)' }),
      card({ icon: '📋', title: 'Lista de precios', sub: 'Presupuesto y ficha', statusVal: 'Lista', statusClass: 'pending', progressPct: 100, timeAgo: 'Equipos y recargas', onClick: 'openLista()', accent: '#0b5878', gradient: 'linear-gradient(135deg,#0b5878,#3ad0a4)' }),
      card({ icon: '🍾', title: 'Comparativas', sub: 'Solo purificadores', statusVal: 'Demo', statusClass: 'pending', progressPct: 100, timeAgo: 'El agua primero', onClick: 'openBotella()', accent: '#3ad0a4', gradient: 'linear-gradient(135deg,#3ad0a4,#5b8def)' })
    ].join('');

    var equipo = [
      card({ icon: '🌳', title: 'Mi Equipo', sub: equipoCargado ? ((eq.activos || 0) + ' activos de ' + eq.total) : 'Importá tu equipo', statusVal: equipoCargado ? String(eq.total) : 'Sin cargar', statusClass: equipoCargado ? 'pending' : 'empty', progressPct: equipoCargado ? (eq.pctActivos || 0) : 0, timeAgo: equipoCargado ? ((eq.pctActivos || 0) + '% activos') : '', onClick: 'openEquipo()', accent: '#3ad0a4', gradient: 'linear-gradient(135deg,#3ad0a4,#a06bff)' }),
      card({ icon: '🎥', title: 'Reuniones', sub: 'Meet, un botón', statusVal: 'Live', statusClass: 'pending', progressPct: 100, timeAgo: 'Nuevo o unirse', onClick: 'openReuniones()', accent: '#0b5878', gradient: 'linear-gradient(135deg,#0b5878,#5b8def)' }),
      card({ icon: '📦', title: 'Mi stock', sub: 'Casa y préstamos', statusVal: 'Stock', statusClass: 'pending', progressPct: 100, timeAgo: 'Lo que hay', onClick: 'openStock()', accent: '#3d63c9', gradient: 'linear-gradient(135deg,#5b8def,#3ad0a4)' }),
      card({ icon: '📈', title: 'Histórico', sub: 'Cierres del mes', statusVal: 'Año', statusClass: 'pending', progressPct: 100, timeAgo: 'Tu red en números', onClick: 'openHistorico()', accent: '#5b8def', gradient: 'linear-gradient(135deg,#3d63c9,#a06bff)' })
    ].join('');

    var desa = [
      card({ icon: '🧭', title: 'Los 8 Pasos', sub: 'El ciclo del negocio', statusVal: 'Guía', statusClass: 'pending', progressPct: 100, timeAgo: 'De a un paso', onClick: 'openOcho()', accent: '#5b8def', gradient: 'linear-gradient(135deg,#5b8def,#3ad0a4)' }),
      card({ icon: '🪜', title: 'Escalera de Sueños', sub: 'Del sueño a la acción', statusVal: 'Metas', statusClass: 'pending', progressPct: 100, timeAgo: 'Plan de vida', onClick: 'openSuenos()', accent: '#a06bff', gradient: 'linear-gradient(135deg,#a06bff,#ff6bcf)' }),
      card({ icon: '🎯', title: 'Coach de Demo', sub: 'Guiones y objeciones', statusVal: 'Coach', statusClass: 'pending', progressPct: 100, timeAgo: 'Practicá', onClick: 'openDemo()', accent: '#ff6b9d', gradient: 'linear-gradient(135deg,#ff8f6b,#ff6b9d)' }),
      card({ icon: '🧮', title: 'Simulador', sub: 'Calculá tu negocio', statusVal: 'Calc', statusClass: 'pending', progressPct: 100, timeAgo: 'Números claros', onClick: 'openCalculadora()', accent: '#f5b301', gradient: 'linear-gradient(135deg,#f5b301,#ff8f6b)' })
    ].join('');

    host.innerHTML =
      '<section class="pilar-bloque" data-pilar="usuarios"><div class="pilar-h"><div><span>Pilar 1</span><h2>Usuarios</h2></div><em>Lo primero</em></div><div class="home-tool-grid">' + usuarios + '</div></section>' +
      '<section class="pilar-bloque" data-pilar="equipo"><div class="pilar-h"><div><span>Pilar 2</span><h2>Equipo</h2></div><em>La red</em></div><div class="home-tool-grid">' + equipo + '</div></section>' +
      '<section class="pilar-bloque" data-pilar="desarrollo"><div class="pilar-h"><div><span>Pilar 3</span><h2>Desarrollo</h2></div><em>Vos</em></div><div class="home-tool-grid">' + desa + '</div></section>';
  }

  function pintar() {
    css();
    pintarHoy();
    pintarPilares();
  }

  window.APPIPilares = { pintar: pintar };
})();
