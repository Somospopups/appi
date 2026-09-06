/* ============================================================
   APPI · Reuniones (adentro de la app)
   ------------------------------------------------------------
   Cualquiera crea una reunión, pasa el código, y se entra
   acá mismo: video, reloj de inicio y fin, compartir pantalla.
   ============================================================ */
(function () {
  'use strict';
  var KEY = 'appi_reuniones_v1';
  var ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var meetAbierto = null;
  var tick = null;

  function $(id) { return document.getElementById(id); }
  function uid() {
    try { return crypto.randomUUID(); } catch (e) {
      return 'r' + Date.now().toString(16) + Math.random().toString(16).slice(2);
    }
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function nombre() {
    try {
      if (window.APPIHielo && window.APPIHielo.firma) return window.APPIHielo.firma();
    } catch (e) {}
    try {
      var p = window.APPIAuth && window.APPIAuth.activePerson && window.APPIAuth.activePerson();
      if (p && p.nombre) return String(p.nombre).trim().split(/\s+/)[0];
    } catch (e) {}
    return 'APPI';
  }
  function leer() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(raw) ? raw : [];
    } catch (e) { return []; }
  }
  function guardar(lista) {
    try { localStorage.setItem(KEY, JSON.stringify(lista.slice(0, 80))); } catch (e) {}
  }
  function codigoNuevo() {
    var s = '';
    for (var i = 0; i < 6; i++) s += ABC.charAt(Math.floor(Math.random() * ABC.length));
    return s;
  }
  function salaDe(codigo) { return 'APPI-' + String(codigo || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
  function hoyISO() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function horaDefault() {
    var d = new Date();
    d.setMinutes(d.getMinutes() + 10);
    return String(d.getHours()).padStart(2, '0') + ':' + String(Math.floor(d.getMinutes() / 5) * 5).padStart(2, '0');
  }
  function inicioMs(r) {
    var f = String(r.fecha || ''), h = String(r.hora || '00:00');
    var t = Date.parse(f + 'T' + h + ':00');
    return isNaN(t) ? 0 : t;
  }
  function finMs(r) { return inicioMs(r) + (Number(r.minutos) || 30) * 60000; }
  function fmtDur(ms) {
    if (ms < 0) ms = 0;
    var s = Math.floor(ms / 1000);
    var m = Math.floor(s / 60), h = Math.floor(m / 60);
    s = s % 60; m = m % 60;
    if (h) return h + ' h ' + String(m).padStart(2, '0') + ' min';
    if (m) return m + ' min ' + String(s).padStart(2, '0') + ' s';
    return s + ' s';
  }
  function reloj(r, now) {
    now = now || Date.now();
    var a = inicioMs(r), b = finMs(r);
    if (!a) return { fase: 'curso', txt: 'En curso' };
    if (now < a) return { fase: 'antes', txt: 'Empieza en ' + fmtDur(a - now) };
    if (now < b) return { fase: 'durante', txt: 'Termina en ' + fmtDur(b - now) };
    return { fase: 'fin', txt: 'Terminó' };
  }
  function lindaFecha(f, h) {
    if (!f) return '';
    var p = f.split('-');
    if (p.length !== 3) return f;
    var meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return Number(p[2]) + ' ' + meses[Number(p[1]) - 1] + (h ? ' · ' + h : '');
  }

  function estilos() {
    if ($('reuEstilos')) return;
    var s = document.createElement('style');
    s.id = 'reuEstilos';
    s.textContent =
      '.reu-wrap{padding:12px 14px 28px;display:grid;gap:12px}' +
      '.reu-card{background:#fffef8;border:1px solid rgba(40,36,28,.10);border-radius:18px;padding:14px}' +
      '.reu-card h3{margin:0 0 10px;font-size:15px;font-weight:950;color:#2a2a32}' +
      '.reu-card label{display:block;font-size:12px;font-weight:800;color:#686977;margin:8px 0 4px}' +
      '.reu-card input,.reu-card select{width:100%;min-height:44px;border:1px solid rgba(11,88,120,.22);border-radius:12px;padding:8px 12px;font:inherit;font-size:15px;background:#fff;box-sizing:border-box}' +
      '.reu-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}' +
      '.reu-btn{min-height:46px;border:0;border-radius:13px;font:inherit;font-size:14px;font-weight:900;cursor:pointer}' +
      '.reu-btn.si{background:#0b5878;color:#fff;width:100%;margin-top:10px}' +
      '.reu-btn.sec{background:rgba(11,88,120,.10);color:#0b5878}' +
      '.reu-item{display:grid;gap:6px;padding:12px 0;border-top:1px solid rgba(40,36,28,.08)}' +
      '.reu-item:first-child{border-top:0;padding-top:0}' +
      '.reu-item b{font-size:15px;color:#2a2a32}' +
      '.reu-item span{font-size:13px;color:#686977}' +
      '.reu-code{font-size:22px;letter-spacing:3px;font-weight:950;color:#0b5878}' +
      '.reu-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}' +
      '.reu-actions button{flex:1;min-height:42px;border:0;border-radius:12px;font:inherit;font-weight:900;cursor:pointer}' +
      '.reu-empty{text-align:center;color:#8a8fae;font-size:13px;font-weight:700;padding:8px}' +
      '.reu-meet{position:fixed;inset:0;z-index:42000;background:#071018;display:flex;flex-direction:column}' +
      '.reu-meet-top{flex:0 0 auto;display:flex;align-items:center;gap:10px;padding:10px 12px calc(10px + env(safe-area-inset-top));background:#0b5878;color:#fff}' +
      '.reu-meet-top .clk{flex:1;font-size:15px;font-weight:900}' +
      '.reu-meet-top .tit{font-size:12px;opacity:.85;font-weight:700}' +
      '.reu-meet-top button{min-height:40px;padding:0 14px;border:0;border-radius:12px;background:#fff;color:#0b5878;font:inherit;font-weight:950;cursor:pointer}' +
      '.reu-meet iframe{flex:1;width:100%;border:0;background:#000}' +
      '.reu-note{font-size:12px;color:#686977;line-height:1.4;margin-top:8px}' +
      'body.dark .reu-card{background:#25273a;border-color:rgba(255,255,255,.08)}' +
      'body.dark .reu-card h3,body.dark .reu-item b{color:#f2f2f7}' +
      'body.dark .reu-card input,body.dark .reu-card select{background:#1c1e2c;color:#f2f2f7;border-color:rgba(255,255,255,.12)}';
    document.head.appendChild(s);
  }

  function pintar() {
    estilos();
    var host = $('reuCont');
    if (!host) return;
    var lista = leer().slice().sort(function (a, b) { return inicioMs(a) - inicioMs(b); });
    var now = Date.now();
    var vivas = lista.filter(function (r) { return finMs(r) + 3600000 > now; });
    var html = '';
    html += '<div class="reu-wrap">';
    html += '<div class="reu-card"><h3>Unirse con código</h3>' +
      '<input id="reuJoin" type="text" maxlength="8" autocapitalize="characters" placeholder="ABC234" style="text-transform:uppercase;letter-spacing:2px;font-weight:900">' +
      '<button type="button" class="reu-btn si" id="reuJoinBtn">Entrar</button>' +
      '<p class="reu-note">Te lo pasa quien armó la reunión. Solo gente de APPI.</p></div>';
    html += '<div class="reu-card"><h3>Crear reunión</h3>' +
      '<label>Título</label><input id="reuTitulo" type="text" maxlength="60" placeholder="Reunión de equipo">' +
      '<div class="reu-row"><div><label>Fecha</label><input id="reuFecha" type="date" value="' + hoyISO() + '"></div>' +
      '<div><label>Hora</label><input id="reuHora" type="time" value="' + horaDefault() + '"></div></div>' +
      '<label>Duración</label><select id="reuMin"><option value="30" selected>30 minutos</option><option value="45">45 minutos</option><option value="60">1 hora</option></select>' +
      '<button type="button" class="reu-btn si" id="reuCrear">Crear y dar código</button>' +
      '<p class="reu-note">En computadora se puede compartir pantalla. En iPhone, se ve; compartir la tuya casi no se puede.</p></div>';
    html += '<div class="reu-card"><h3>Tus reuniones</h3>';
    if (!vivas.length) html += '<div class="reu-empty">Todavía no hay. Creá una o entrá con un código.</div>';
    vivas.forEach(function (r) {
      var rel = reloj(r, now);
      html += '<div class="reu-item" data-id="' + esc(r.id) + '">' +
        '<b>' + esc(r.titulo || 'Reunión') + '</b>' +
        '<span>' + esc(lindaFecha(r.fecha, r.hora)) + ' · ' + (r.minutos || 30) + ' min</span>' +
        '<span class="reu-code">' + esc(r.codigo) + '</span>' +
        '<span>' + esc(rel.txt) + '</span>' +
        '<div class="reu-actions">' +
        '<button type="button" class="si" data-entrar="' + esc(r.id) + '" style="background:#0b5878;color:#fff">Entrar</button>' +
        '<button type="button" class="sec" data-copiar="' + esc(r.codigo) + '" style="background:rgba(11,88,120,.10);color:#0b5878">Copiar código</button>' +
        '</div></div>';
    });
    html += '</div></div>';
    host.innerHTML = html;
    var jb = $('reuJoinBtn');
    if (jb) jb.onclick = function () { unir(($('reuJoin') && $('reuJoin').value) || ''); };
    var cb = $('reuCrear');
    if (cb) cb.onclick = crear;
    host.onclick = function (e) {
      var t = e.target;
      if (!t) return;
      if (t.getAttribute('data-entrar')) entrarId(t.getAttribute('data-entrar'));
      if (t.getAttribute('data-copiar')) copiar(t.getAttribute('data-copiar'));
    };
  }

  function crear() {
    var titulo = (($('reuTitulo') && $('reuTitulo').value) || '').trim() || 'Reunión APPI';
    var fecha = ($('reuFecha') && $('reuFecha').value) || hoyISO();
    var hora = ($('reuHora') && $('reuHora').value) || horaDefault();
    var minutos = Number($('reuMin') && $('reuMin').value) || 30;
    var codigo = codigoNuevo();
    var r = { id: uid(), codigo: codigo, titulo: titulo, fecha: fecha, hora: hora, minutos: minutos, creada: Date.now(), rol: 'host' };
    var lista = leer();
    lista.unshift(r);
    guardar(lista);
    try {
      if (window.APPICalendario && window.APPICalendario.agregar) {
        window.APPICalendario.agregar(fecha, 'Reunión: ' + titulo + ' · código ' + codigo, hora);
      }
    } catch (e) {}
    pintar();
    if (typeof showToast === 'function') showToast('Código ' + codigo, 2800);
    programarAviso(r);
  }

  function unir(raw) {
    var codigo = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (codigo.length < 4) {
      if (window.APPIDialog) window.APPIDialog.alert('Ingresá el código de la reunión.', { title: 'Reuniones', icon: '🎥' });
      return;
    }
    var lista = leer();
    var r = null;
    for (var i = 0; i < lista.length; i++) if (lista[i].codigo === codigo) r = lista[i];
    if (!r) {
      r = { id: uid(), codigo: codigo, titulo: 'Reunión ' + codigo, fecha: hoyISO(), hora: horaDefault(), minutos: 30, creada: Date.now(), rol: 'invitado' };
      lista.unshift(r);
      guardar(lista);
    }
    entrar(r);
  }

  function entrarId(id) {
    var lista = leer();
    for (var i = 0; i < lista.length; i++) if (lista[i].id === id) return entrar(lista[i]);
  }

  function copiar(codigo) {
    var t = String(codigo || '');
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t);
    } catch (e) {}
    if (typeof showToast === 'function') showToast('Código ' + t, 2000);
  }

  function jitsiUrl(r) {
    var sala = salaDe(r.codigo);
    var nom = encodeURIComponent(nombre());
    return 'https://meet.jit.si/' + encodeURIComponent(sala) +
      '#userInfo.displayName="' + nom + '"&config.prejoinPageEnabled=false&config.disableDeepLinking=true&interfaceConfig.DISABLE_JOIN_LEAVE_NOTIFICATIONS=true';
  }

  function entrar(r) {
    if (!r || !r.codigo) return;
    cerrarMeet();
    var wrap = document.createElement('div');
    wrap.className = 'reu-meet';
    wrap.id = 'reuMeet';
    wrap.innerHTML = '<div class="reu-meet-top"><div><div class="tit"></div><div class="clk"></div></div>' +
      '<button type="button" id="reuSalir">Salir</button></div>' +
      '<iframe allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write" allowfullscreen></iframe>';
    document.body.appendChild(wrap);
    wrap.querySelector('.tit').textContent = r.titulo || 'Reunión APPI';
    wrap.querySelector('iframe').src = jitsiUrl(r);
    wrap.querySelector('#reuSalir').onclick = cerrarMeet;
    meetAbierto = r;
    function tickFn() {
      if (!meetAbierto) return;
      var rel = reloj(meetAbierto);
      var clk = wrap.querySelector('.clk');
      if (clk) clk.textContent = rel.txt;
    }
    tickFn();
    tick = setInterval(tickFn, 1000);
  }

  function cerrarMeet() {
    if (tick) { clearInterval(tick); tick = null; }
    meetAbierto = null;
    var el = $('reuMeet');
    if (el) {
      var ifr = el.querySelector('iframe');
      if (ifr) ifr.src = 'about:blank';
      el.remove();
    }
  }

  function programarAviso(r) {
    var cuando = inicioMs(r) - 5 * 60000;
    var espera = cuando - Date.now();
    if (espera < 0 || espera > 12 * 3600000) return;
    setTimeout(function () {
      if (!window.APPINotif || !window.APPINotif.mostrar) return;
      window.APPINotif.mostrar({
        title: 'APPI',
        body: (r.titulo || 'Reunión') + ' empieza en 5 minutos. Código ' + r.codigo,
        tag: 'appi-reu-' + r.codigo,
        type: 'aviso',
        url: './',
        actionTitle: 'Abrir APPI'
      });
    }, espera);
  }

  function open() {
    estilos();
    if (typeof showView === 'function') showView('view-reuniones');
    pintar();
    leer().forEach(programarAviso);
  }

  window.openReuniones = open;
  window.APPIReuniones = { open: open, pintar: pintar, cerrar: cerrarMeet };
})();
