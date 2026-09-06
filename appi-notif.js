/* ============================================================
   APPI · Avisos también en el panel del celular
   ------------------------------------------------------------
   Adentro de APPI no cambia nada. El mismo aviso sale en el
   panel, con el logo de APPI, como WhatsApp. Al tocarlo, abre
   lo que hay que hacer. Sin pasos extra para el distribuidor.
   ============================================================ */
(function () {
  'use strict';
  var pendiente = null;

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
    var title = 'APPI';
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
          await reg.showNotification(title, options);
          return true;
        }
      }
    } catch (e) {}
    try { new Notification(title, options); return true; } catch (e) { return false; }
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

  async function alTocar() {
    var ok = await pedirSiHaceFalta();
    if (ok && pendiente) {
      var p = pendiente;
      pendiente = null;
      await mostrar(p);
    }
  }
  function escucharToque() {
    if (document.documentElement.dataset.appiNotifAuto) return;
    document.documentElement.dataset.appiNotifAuto = '1';
    document.addEventListener('pointerdown', function once() {
      document.removeEventListener('pointerdown', once, true);
      alTocar();
    }, true);
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
  async function probar() {
    try { if (typeof cerrarToolsMenu === 'function') cerrarToolsMenu(); } catch (e) {}
    var ok = await pedirSiHaceFalta();
    if (!ok && permiso() !== 'granted') {
      if (window.APPIDialog) window.APPIDialog.alert('El celular no dejó mostrar avisos en el panel.', { title: 'APPI', icon: '🔔' });
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

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', function (event) {
      var d = event && event.data || {};
      if (d.type === 'APPI_OPEN_COMMAND') abrir(d);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { escucharToque(); aplicarQuery(); });
  } else {
    escucharToque(); aplicarQuery();
  }

  window.APPINotif = { permiso: permiso, mostrar: mostrar, probar: probar, abrir: abrir };
})();
