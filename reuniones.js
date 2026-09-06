/* ============================================================
   APPI · Reuniones = Google Meet, simple
   Un botón Nuevo. Un código para unirse.
   ============================================================ */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
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
  function fechaLinda() {
    var d = new Date();
    var dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    var meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return dias[d.getDay()] + ', ' + d.getDate() + ' ' + meses[d.getMonth()];
  }
  function abrir(url) {
    try { window.open(url, '_blank', 'noopener'); } catch (e) { location.href = url; }
  }

  function estilos() {
    if ($('reuEstilos')) return;
    var s = document.createElement('style');
    s.id = 'reuEstilos';
    s.textContent =
      '.reu-home{min-height:62vh;display:flex;flex-direction:column;align-items:center;padding:18px 16px 40px;text-align:center}' +
      '.reu-join{display:flex;gap:8px;width:min(100%,440px);margin:8px 0 28px}' +
      '.reu-join input{flex:1;min-height:46px;border:1px solid rgba(11,88,120,.22);border-radius:24px;padding:0 16px;font:inherit;font-size:14px;background:#fff;box-sizing:border-box}' +
      '.reu-join button{min-height:46px;padding:0 16px;border:0;border-radius:24px;background:rgba(11,88,120,.12);color:#0b5878;font:inherit;font-weight:900;cursor:pointer}' +
      '.reu-fecha{font-size:15px;font-weight:800;color:#686977;margin:8px 0 18px}' +
      '.reu-ilustra{width:min(220px,70vw);margin:8px auto 12px}' +
      '.reu-home h2{margin:0 0 8px;font-size:22px;font-weight:950;color:#2a2a32}' +
      '.reu-home p{margin:0 0 22px;font-size:14px;color:#686977}' +
      '.reu-nuevo{min-height:52px;padding:0 28px;border:0;border-radius:28px;background:#0b5878;color:#fff;font:inherit;font-size:16px;font-weight:950;cursor:pointer;box-shadow:0 10px 24px rgba(11,88,120,.28)}' +
      'body.dark .reu-join input{background:#1c1e2c;color:#f2f2f7;border-color:rgba(255,255,255,.12)}' +
      'body.dark .reu-home h2{color:#f2f2f7}' +
      'body.dark .reu-join button{background:rgba(255,255,255,.08);color:#8fd3ef}';
    document.head.appendChild(s);
  }

  function pintar() {
    estilos();
    var host = $('reuCont');
    if (!host) return;
    host.innerHTML =
      '<div class="reu-home">' +
        '<div class="reu-join">' +
          '<input id="reuJoin" type="text" placeholder="Ingresá un código o vínculo" autocomplete="off">' +
          '<button type="button" id="reuJoinBtn">Unirse</button>' +
        '</div>' +
        '<div class="reu-fecha">' + esc(fechaLinda()) + '</div>' +
        '<svg class="reu-ilustra" viewBox="0 0 200 120" aria-hidden="true">' +
          '<rect x="20" y="28" width="160" height="72" rx="16" fill="#e8f2f6"/>' +
          '<circle cx="70" cy="64" r="18" fill="#0b5878"/>' +
          '<circle cx="130" cy="64" r="18" fill="#5b8def"/>' +
          '<path d="M55 100h90" stroke="#c5d5dc" stroke-width="6" stroke-linecap="round"/>' +
        '</svg>' +
        '<h2>No hay reuniones programadas para hoy</h2>' +
        '<p>Creá una reunión o uníte con el código.</p>' +
        '<button type="button" class="reu-nuevo" id="reuNuevo">＋  Nuevo</button>' +
      '</div>';
    var jb = $('reuJoinBtn');
    if (jb) jb.onclick = unirse;
    var inp = $('reuJoin');
    if (inp) inp.onkeydown = function (e) { if (e.key === 'Enter') unirse(); };
    var nv = $('reuNuevo');
    if (nv) nv.onclick = function () { abrir('https://meet.google.com/new'); };
  }

  function unirse() {
    var meet = parseMeet(($('reuJoin') && $('reuJoin').value) || '');
    if (!meet) {
      if (window.APPIDialog) window.APPIDialog.alert('Ingresá el código de Meet (xxx-yyyy-zzz) o pegá el link.', { title: 'Reuniones', icon: '🎥' });
      return;
    }
    abrir(meet);
  }

  function open() {
    estilos();
    if (typeof showView === 'function') showView('view-reuniones');
    pintar();
  }

  window.openReuniones = open;
  window.APPIReuniones = { open: open, pintar: pintar };
})();
