/* ============================================================
   APPI · Avisos en el panel del celular
   ------------------------------------------------------------
   Al entrar al Home, un popup simple pide Activar. Ese toque
   es el permiso del teléfono. Adentro de APPI no cambia nada.
   Al tocar el aviso, abre lo que hay que hacer.
   ============================================================ */
(function () {
  'use strict';
  var pendiente = null;
  var popAbierto = false;
  var LATER = 'appi_notif_popup_later';

  function permiso() {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  }
  function esIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent || '') ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }
  function standaloneOk() {
    if (!esIOS()) return true;
    return window.navigator.standalone === true ||
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  }
  function asset(file) {
    try { return new URL(file, document.baseURI).href; } catch (e) { return file; }
  }
  function autorizado() {
    try {
      if (window.APPIAuth && window.APPIAuth.needsPersonChoice && window.APPIAuth.needsPersonChoice()) return false;
      var p = window.APPIAuth && window.APPIAuth.currentProfile && window.APPIAuth.currentProfile();
      if (p && p.rol === 'admin') return false;
    } catch (e) {}
    return true;
  }
  function yaListo() {
    try { return localStorage.getItem('appi_notif_listo_v1') === '1'; } catch (e) { return false; }
  }
  function homeActivo() {
    var v = document.getElementById('view-home');
    return !!(v && v.classList.contains('active'));
  }
  function hayOtroOverlay() {
    if (document.body.classList.contains('appi-login-abierto')) return true;
    var per = document.getElementById('personChoiceOverlay');
    if (per && !per.hidden) return true;
    var mo = document.getElementById('modalOverlay');
    if (mo && mo.classList.contains('open')) return true;
    if (document.getElementById('appiFotoEdit')) return true;
    var dlg = document.querySelector('.appi-dialog-overlay');
    if (dlg && !dlg.hidden) return true;
    return false;
  }
  function masTarde(ms) {
    try { localStorage.setItem(LATER, String(Date.now() + ms)); } catch (e) {}
  }
  function enEspera() {
    try {
      var t = Number(localStorage.getItem(LATER) || 0);
      return t && Date.now() < t;
    } catch (e) { return false; }
  }

  async function pedirSiHaceFalta() {
    if (permiso() === 'granted') return true;
    if (permiso() !== 'default' || !standaloneOk()) return false;
    try { return (await Notification.requestPermission()) === 'granted'; } catch (e) { return false; }
  }

  async function mostrar(opts) {
    opts = opts || {};
    if (!('Notification' in window)) return false;
    if (permiso() !== 'granted') {
      pendiente = opts;
      return false;
    }
    pendiente = null;
    var options = {
      body: String(opts.body || '').replace(/\s+/g, ' ').trim().slice(0, 180),
      icon: asset('./icon-192.png'),
      badge: asset('./notification-badge.png'),
      tag: opts.tag || ('appi-' + (opts.type || 'aviso')),
      renotify: opts.renotify !== false,
      requireInteraction: !!opts.requireInteraction,
      silent: false,
      lang: 'es',
      data: {
        url: opts.url || './',
        type: opts.type || 'aviso',
        contacto_id: opts.contacto_id || '',
        command_id: opts.command_id || ''
      },
      actions: [
        { action: 'open', title: opts.actionTitle || 'Abrir APPI' },
        { action: 'dismiss', title: 'Ahora no' }
      ]
    };
    try { if (navigator.vibrate) navigator.vibrate([80, 40, 80]); } catch (e) {}
    try {
      if ('serviceWorker' in navigator) {
        var reg = await navigator.serviceWorker.ready;
        if (reg && reg.showNotification) {
          await reg.showNotification('APPI', options);
          return true;
        }
      }
    } catch (e) {}
    try { new Notification('APPI', options); return true; } catch (e) { return false; }
  }

  function abrir(d) {
    d = d || {};
    var tipo = String(d.notification || d.type || '');
    var url = String(d.url || '');
    if (tipo === 'anuncio' || /[?&]aviso=/.test(url)) {
      if (window.APPIAnuncios) {
        var an = window.APPIAnuncios.actual && window.APPIAnuncios.actual();
        if (an) window.APPIAnuncios.mostrar(an);
        else if (window.APPIAnuncios.revisar) window.APPIAnuncios.revisar();
      }
      return;
    }
    if (tipo === 'accion' || /[?&]accion=/.test(url)) {
      try { if (typeof showView === 'function') showView('view-historico'); } catch (e) {}
      try {
        var H = window.__APPI_HISTORICO__;
        if (H && H.openActionCenter) H.openActionCenter('today');
        else if (typeof window.openHistorico === 'function') window.openHistorico();
      } catch (e) {}
    }
  }

  function estilosPopup() {
    if (document.getElementById('appiNotifCss')) return;
    var s = document.createElement('style');
    s.id = 'appiNotifCss';
    s.textContent =
      '#appiNotifPop{position:fixed;inset:0;z-index:40000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(20,22,38,.54);backdrop-filter:blur(10px)}' +
      '#appiNotifPop[hidden]{display:none!important}' +
      '#appiNotifPop .card{width:min(100%,400px);padding:26px 22px 20px;border-radius:25px;background:#f3eee3;box-shadow:0 25px 80px rgba(30,24,12,.22);text-align:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}' +
      '#appiNotifPop .ico{width:58px;height:58px;margin:0 auto 10px;border-radius:18px;display:grid;place-items:center;background:#0b5878;color:#fff;font-size:26px;box-shadow:0 9px 23px rgba(11,88,120,.24)}' +
      '#appiNotifPop h2{margin:0 0 8px;color:#292938;font-size:20px}' +
      '#appiNotifPop p{margin:0 0 18px;color:#686977;font-size:14px;line-height:1.5}' +
      '#appiNotifPop .row{display:grid;grid-template-columns:1fr 1fr;gap:8px}' +
      '#appiNotifPop .row.one{grid-template-columns:1fr}' +
      '#appiNotifPop button{min-height:48px;border:0;border-radius:13px;font:inherit;font-size:15px;font-weight:900;cursor:pointer}' +
      '#appiNotifPop .no{background:rgba(80,90,130,.09);color:#666776}' +
      '#appiNotifPop .si{background:#0b5878;color:#fff}' +
      'body.dark #appiNotifPop .card{background:#25273a}' +
      'body.dark #appiNotifPop h2{color:#f2f2f7}' +
      'body.dark #appiNotifPop p{color:#c5c7d4}' +
      'body.dark #appiNotifPop .no{background:rgba(255,255,255,.08);color:#c5c7d4}';
    document.head.appendChild(s);
  }

  function cerrarPopup() {
    var el = document.getElementById('appiNotifPop');
    if (el) el.remove();
    popAbierto = false;
  }

  function pintarPopup() {
    if (popAbierto) return;
    estilosPopup();
    var ios = esIOS() && !standaloneOk();
    var denied = permiso() === 'denied';
    var wrap = document.createElement('div');
    wrap.id = 'appiNotifPop';
    wrap.innerHTML = '<div class="card">' +
      '<div class="ico">🔔</div>' +
      '<h2></h2><p></p><div class="row"></div></div>';
    var h = wrap.querySelector('h2');
    var p = wrap.querySelector('p');
    var row = wrap.querySelector('.row');
    if (ios) {
      h.textContent = 'Un paso en el iPhone';
      p.textContent = 'Agregá APPI a la pantalla de inicio y abrila desde su ícono. Después, al entrar, vas a poder activar los avisos del panel.';
      row.classList.add('one');
      row.innerHTML = '<button type="button" class="si" data-acc="ok">Entendido</button>';
    } else if (denied) {
      h.textContent = 'Los avisos están bloqueados';
      p.textContent = 'En Ajustes del celular → Notificaciones → APPI, poné Permitir. Así llegan al panel, como WhatsApp.';
      row.classList.add('one');
      row.innerHTML = '<button type="button" class="si" data-acc="ok">Entendido</button>';
    } else {
      h.textContent = 'Recibí los avisos de APPI';
      p.textContent = 'Tocá Activar. Si el teléfono pregunta, Permitir. Listo: los avisos van al panel, con el logo, también a la mañana.';
      row.innerHTML = '<button type="button" class="no" data-acc="no">Ahora no</button><button type="button" class="si" data-acc="si">Activar</button>';
    }
    wrap.addEventListener('click', function (e) {
      var acc = e.target && e.target.getAttribute && e.target.getAttribute('data-acc');
      if (!acc) return;
      if (acc === 'no') { masTarde(7 * 24 * 3600 * 1000); cerrarPopup(); return; }
      if (acc === 'ok') { masTarde(ios ? 3 * 24 * 3600 * 1000 : 30 * 24 * 3600 * 1000); cerrarPopup(); return; }
      if (acc === 'si') activarDesdePopup();
    });
    document.body.appendChild(wrap);
    popAbierto = true;
  }

  async function activarDesdePopup() {
    var btn = document.querySelector('#appiNotifPop .si');
    if (btn) { btn.disabled = true; btn.textContent = 'Activando…'; }
    var ok = await pedirSiHaceFalta();
    if (!ok) {
      if (btn) { btn.disabled = false; btn.textContent = 'Activar'; }
      if (permiso() === 'denied') {
        cerrarPopup();
        pintarPopup();
      }
      return;
    }
    try { localStorage.setItem('appi_avisos_ok', '1'); localStorage.setItem('appi_notif_listo_v1', '1'); } catch (e) {}
    masTarde(400 * 24 * 3600 * 1000);
    try {
      if (window.APPIDeviceBridge && window.APPIDeviceBridge.activarEsteTelefono) {
        await window.APPIDeviceBridge.activarEsteTelefono();
      }
    } catch (e) {}
    await mostrar({
      title: 'APPI',
      body: 'Listo. Así vas a ver los avisos de APPI, también a la mañana.',
      tag: 'appi-prueba',
      type: 'aviso',
      url: './',
      actionTitle: 'Abrir APPI'
    });
    if (pendiente) {
      var p = pendiente;
      pendiente = null;
      await mostrar(p);
    }
    cerrarPopup();
    if (typeof showToast === 'function') showToast('Avisos activados 🔔', 2400);
  }

  function maybePopup() {
    if (popAbierto || yaListo()) return;
    if (enEspera()) return;
    if (permiso() === 'unsupported') return;
    if (!homeActivo() || !autorizado() || hayOtroOverlay()) return;
    pintarPopup();
  }

  function hookShowView() {
    if (typeof window.showView !== 'function' || window.showView.__appiNotif) return;
    var orig = window.showView;
    function wrapped(id, opts) {
      var r = orig.apply(this, arguments);
      if (id === 'view-home') setTimeout(maybePopup, 900);
      return r;
    }
    wrapped.__appiNotif = true;
    window.showView = wrapped;
  }

  async function probar() {
    try { if (typeof cerrarToolsMenu === 'function') cerrarToolsMenu(); } catch (e) {}
    var ok = await pedirSiHaceFalta();
    if (!ok && permiso() !== 'granted') {
      if (window.APPIDialog) window.APPIDialog.alert(
        permiso() === 'denied'
          ? 'Están bloqueadas. Activalas en Ajustes del celular → Notificaciones → APPI.'
          : (esIOS() && !standaloneOk()
            ? 'En iPhone, agregá APPI a la pantalla de inicio y abrila desde su ícono.'
            : 'El celular no dejó mostrar avisos en el panel.'),
        { title: 'APPI', icon: '🔔' }
      );
      return;
    }
    await mostrar({
      title: 'APPI',
      body: 'Así se ven los avisos. Tocá para abrir APPI.',
      tag: 'appi-prueba',
      type: 'aviso',
      url: './',
      actionTitle: 'Abrir APPI'
    });
  }

  function aplicarQuery() {
    try {
      var u = new URL(location.href);
      var aviso = u.searchParams.get('aviso');
      var accion = u.searchParams.get('accion');
      if (!aviso && !accion) return;
      u.searchParams.delete('aviso');
      u.searchParams.delete('accion');
      if (history.replaceState) history.replaceState(history.state, '', u.pathname + u.search + u.hash);
      if (aviso) setTimeout(function () { abrir({ notification: 'anuncio' }); }, 1400);
      if (accion) setTimeout(function () { abrir({ notification: 'accion' }); }, 1600);
    } catch (e) {}
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', function (event) {
      var d = event && event.data || {};
      if (d.type === 'APPI_OPEN_COMMAND') abrir(d);
    });
  }

  function arranque() {
    hookShowView();
    aplicarQuery();
    var n = 0;
    var t = setInterval(function () {
      hookShowView();
      maybePopup();
      if (popAbierto || yaListo() || ++n > 60) clearInterval(t);
    }, 1200);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arranque);
  else arranque();

  window.APPINotif = { permiso: permiso, mostrar: mostrar, probar: probar, abrir: abrir };
})();
