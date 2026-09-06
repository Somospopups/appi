/* ============================================================
   APPI · Reuniones con Google Meet
   ------------------------------------------------------------
   Se arman acá, el video es Meet. El reloj (inicio / fin)
   se ve en APPI. El link de esa reunión se comparte desde acá.
   ============================================================ */
(function () {
  'use strict';
  var KEY = 'appi_reuniones_v1';

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
  function leer() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(raw) ? raw : [];
    } catch (e) { return []; }
  }
  function guardar(lista) {
    try { localStorage.setItem(KEY, JSON.stringify(lista.slice(0, 80))); } catch (e) {}
  }
  function hoyISO() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function horaDefault() {
    var d = new Date();
    d.setMinutes(d.getMinutes() + 10);
    var m = Math.floor(d.getMinutes() / 5) * 5;
    d.setMinutes(m);
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  function parseMeet(raw) {
    var t = String(raw || '').trim();
    if (!t) return '';
    var m = t.match(/meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/i);
    if (m) return 'https://meet.google.com/' + m[1].toLowerCase();
    m = t.match(/^([a-z]{3}-[a-z]{4}-[a-z]{3})$/i);
    if (m) return 'https://meet.google.com/' + m[1].toLowerCase();
    if (/^https?:\/\/meet\.google\.com\//i.test(t)) return t.split('?')[0].replace(/\/$/, '');
    return '';
  }
  function codigoMeet(url) {
    var m = String(url || '').match(/meet\.google\.com\/([a-z0-9-]+)/i);
    return m ? m[1].toLowerCase() : '';
  }
  function inicioMs(r) {
    var t = Date.parse(String(r.fecha || '') + 'T' + String(r.hora || '00:00') + ':00');
    return isNaN(t) ? 0 : t;
  }
  function finMs(r) { return inicioMs(r) + (Number(r.minutos) || 30) * 60000; }
  function fmtDur(ms) {
    if (ms < 0) ms = 0;
    var s = Math.floor(ms / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60);
    s %= 60; m %= 60;
    if (h) return h + ' h ' + String(m).padStart(2, '0') + ' min';
    if (m) return m + ' min';
    return s + ' s';
  }
  function reloj(r, now) {
    now = now || Date.now();
    var a = inicioMs(r), b = finMs(r);
    if (!a) return { fase: 'curso', txt: 'Meet listo' };
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
      '.reu-item{display:grid;gap:6px;padding:12px 0;border-top:1px solid rgba(40,36,28,.08)}' +
      '.reu-item:first-child{border-top:0;padding-top:0}' +
      '.reu-item b{font-size:15px;color:#2a2a32}' +
      '.reu-item span{font-size:13px;color:#686977}' +
      '.reu-code{font-size:15px;font-weight:950;color:#0b5878;word-break:break-all}' +
      '.reu-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}' +
      '.reu-actions button{flex:1;min-height:42px;border:0;border-radius:12px;font:inherit;font-weight:900;cursor:pointer}' +
      '.reu-empty{text-align:center;color:#8a8fae;font-size:13px;font-weight:700;padding:8px}' +
      '.reu-note{font-size:12px;color:#686977;line-height:1.4;margin-top:8px}' +
      '.reu-clk{font-size:16px;font-weight:950;color:#0b5878}' +
      'body.dark .reu-card{background:#25273a;border-color:rgba(255,255,255,.08)}' +
      'body.dark .reu-card h3,body.dark .reu-item b{color:#f2f2f7}' +
      'body.dark .reu-card input,body.dark .reu-card select{background:#1c1e2c;color:#f2f2f7;border-color:rgba(255,255,255,.12)}' +
      'body.dark .reu-clk{color:#8fd3ef}';
    document.head.appendChild(s);
  }

  var tickPintar = null;

  function pintar() {
    estilos();
    var host = $('reuCont');
    if (!host) return;
    var lista = leer().slice().sort(function (a, b) { return inicioMs(a) - inicioMs(b); });
    var now = Date.now();
    var vivas = lista.filter(function (r) { return finMs(r) + 2 * 3600000 > now; });
    var html = '';
    html += '<div class="reu-wrap">';
    html += '<div class="reu-card"><h3>Unirse a un Meet</h3>' +
      '<input id="reuJoin" type="text" placeholder="xxx-yyyy-zzz o pegá el link">' +
      '<button type="button" class="reu-btn si" id="reuJoinBtn">Entrar a Meet</button>' +
      '<p class="reu-note">El código o el link te lo pasa quien armó la reunión.</p></div>';
    html += '<div class="reu-card"><h3>Crear reunión</h3>' +
      '<label>Título</label><input id="reuTitulo" type="text" maxlength="60" placeholder="Reunión de equipo">' +
      '<div class="reu-row"><div><label>Fecha</label><input id="reuFecha" type="date" value="' + hoyISO() + '"></div>' +
      '<div><label>Hora</label><input id="reuHora" type="time" value="' + horaDefault() + '"></div></div>' +
      '<label>Duración</label><select id="reuMin"><option value="30" selected>30 minutos</option><option value="45">45 minutos</option><option value="60">1 hora</option></select>' +
      '<label>Link de Google Meet</label><input id="reuLink" type="url" placeholder="https://meet.google.com/xxx-yyyy-zzz">' +
      '<button type="button" class="reu-btn si" id="reuAbrirMeet" style="background:#1a73e8;margin-top:8px">Abrir Meet para crear el link</button>' +
      '<button type="button" class="reu-btn si" id="reuCrear">Guardar reunión</button>' +
      '<p class="reu-note">1) Abrí Meet y copiá el link que te da Google. 2) Pegalo acá y guardá. 3) Pasale ese link a la gente de APPI.</p></div>';
    html += '<div class="reu-card"><h3>Tus reuniones</h3>';
    if (!vivas.length) html += '<div class="reu-empty">Todavía no hay. Creá una o entrá con el link.</div>';
    vivas.forEach(function (r) {
      var rel = reloj(r, now);
      html += '<div class="reu-item">' +
        '<b>' + esc(r.titulo || 'Reunión') + '</b>' +
        '<span>' + esc(lindaFecha(r.fecha, r.hora)) + ' · ' + (r.minutos || 30) + ' min</span>' +
        '<span class="reu-clk">' + esc(rel.txt) + '</span>' +
        (r.meet ? '<span class="reu-code">' + esc(codigoMeet(r.meet) || r.meet) + '</span>' : '<span>Falta el link de Meet</span>') +
        '<div class="reu-actions">' +
        '<button type="button" data-entrar="' + esc(r.id) + '" style="background:#1a73e8;color:#fff">Entrar a Meet</button>' +
        (r.meet ? '<button type="button" data-copiar="' + esc(r.meet) + '" style="background:rgba(11,88,120,.10);color:#0b5878">Copiar link</button>' : '') +
        '</div></div>';
    });
    html += '</div></div>';
    host.innerHTML = html;
    var jb = $('reuJoinBtn');
    if (jb) jb.onclick = function () { unir(($('reuJoin') && $('reuJoin').value) || ''); };
    var ab = $('reuAbrirMeet');
    if (ab) ab.onclick = function () { window.open('https://meet.google.com/new', '_blank', 'noopener'); };
    var cb = $('reuCrear');
    if (cb) cb.onclick = crear;
    host.onclick = function (e) {
      var t = e.target;
      if (!t) return;
      if (t.getAttribute('data-entrar')) entrarId(t.getAttribute('data-entrar'));
      if (t.getAttribute('data-copiar')) copiar(t.getAttribute('data-copiar'));
    };
    if (tickPintar) clearInterval(tickPintar);
    tickPintar = setInterval(function () {
      if (!$('reuCont') || !document.getElementById('view-reuniones') || !document.getElementById('view-reuniones').classList.contains('active')) {
        clearInterval(tickPintar); tickPintar = null; return;
      }
      var lista = leer();
      var clocks = document.querySelectorAll('.reu-item .reu-clk');
      var vivas = lista.slice().sort(function (a, b) { return inicioMs(a) - inicioMs(b); }).filter(function (r) { return finMs(r) + 2 * 3600000 > Date.now(); });
      for (var i = 0; i < clocks.length && i < vivas.length; i++) clocks[i].textContent = reloj(vivas[i]).txt;
    }, 1000);
  }

  function crear() {
    var meet = parseMeet(($('reuLink') && $('reuLink').value) || '');
    if (!meet) {
      if (window.APPIDialog) window.APPIDialog.alert('Pegá el link de Google Meet. Tocá “Abrir Meet para crear el link”, copialo y pegalo acá.', { title: 'Reuniones', icon: '🎥' });
      return;
    }
    var titulo = (($('reuTitulo') && $('reuTitulo').value) || '').trim() || 'Reunión APPI';
    var fecha = ($('reuFecha') && $('reuFecha').value) || hoyISO();
    var hora = ($('reuHora') && $('reuHora').value) || horaDefault();
    var minutos = Number($('reuMin') && $('reuMin').value) || 30;
    var r = { id: uid(), meet: meet, titulo: titulo, fecha: fecha, hora: hora, minutos: minutos, creada: Date.now(), rol: 'host' };
    var lista = leer();
    lista.unshift(r);
    guardar(lista);
    try {
      if (window.APPICalendario && window.APPICalendario.agregar) {
        window.APPICalendario.agregar(fecha, 'Meet: ' + titulo, hora);
      }
    } catch (e) {}
    pintar();
    if (typeof showToast === 'function') showToast('Reunión guardada', 2200);
    programarAviso(r);
  }

  function unir(raw) {
    var meet = parseMeet(raw);
    if (!meet) {
      if (window.APPIDialog) window.APPIDialog.alert('Pegá el link o el código de Meet (xxx-yyyy-zzz).', { title: 'Reuniones', icon: '🎥' });
      return;
    }
    var lista = leer();
    var r = null;
    for (var i = 0; i < lista.length; i++) if (lista[i].meet === meet) r = lista[i];
    if (!r) {
      r = { id: uid(), meet: meet, titulo: 'Meet', fecha: hoyISO(), hora: horaDefault(), minutos: 30, creada: Date.now(), rol: 'invitado' };
      lista.unshift(r);
      guardar(lista);
    }
    abrirMeet(meet);
    pintar();
  }

  function entrarId(id) {
    var lista = leer();
    for (var i = 0; i < lista.length; i++) {
      if (lista[i].id === id) {
        if (!lista[i].meet) {
          if (window.APPIDialog) window.APPIDialog.alert('A esta reunión le falta el link de Meet.', { title: 'Reuniones', icon: '🎥' });
          return;
        }
        abrirMeet(lista[i].meet);
        return;
      }
    }
  }

  function abrirMeet(url) {
    try { window.open(url, '_blank', 'noopener'); } catch (e) { location.href = url; }
  }

  function copiar(texto) {
    var t = String(texto || '');
    try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t); } catch (e) {}
    if (typeof showToast === 'function') showToast('Link copiado', 2000);
  }

  function programarAviso(r) {
    var espera = inicioMs(r) - 5 * 60000 - Date.now();
    if (espera < 0 || espera > 12 * 3600000) return;
    setTimeout(function () {
      if (!window.APPINotif || !window.APPINotif.mostrar) return;
      window.APPINotif.mostrar({
        title: 'APPI',
        body: (r.titulo || 'Meet') + ' empieza en 5 minutos.',
        tag: 'appi-reu-' + (r.id || ''),
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
  window.APPIReuniones = { open: open, pintar: pintar };
})();
