/* ================================================================
   SKIN POPUPS para APPI — se activa solo con ?skin=popups
   (lo usa la Consola POPUPS cuando abre el panel de administración).
   No altera la app para los distribuidores: sin el parámetro no hace nada.
   ================================================================ */
(function () {
  'use strict';
  try {
    if (new URLSearchParams(location.search).get('skin') !== 'popups') return;
  } catch (e) { return; }

  var CSS = [
    /* canvas POPUPS */
    'html.skin-popups, html.skin-popups body{background:#0e100d!important}',
    'html.skin-popups body{color:#f2efe7!important}',
    'html.skin-popups ::selection{background:rgba(183,224,120,.35)}',

    /* login y candado admin */
    'html.skin-popups .admin-login-overlay{background:rgba(8,9,7,.78)!important}',
    'html.skin-popups .admin-login-card,html.skin-popups .lock-card{background:#161a14!important;border:1px solid rgba(242,239,231,.14)!important;color:#f2efe7!important}',
    'html.skin-popups .admin-login-card h2,html.skin-popups .lock-card h2{color:#f2efe7!important}',
    'html.skin-popups .admin-login-card p,html.skin-popups .lock-card p,html.skin-popups .admin-login-card small,html.skin-popups .lock-card small{color:#9aa091!important}',
    'html.skin-popups .admin-login-icon{background:linear-gradient(135deg,#8fb84f,#b7e078)!important;color:#10130e!important}',
    'html.skin-popups .admin-login-lock{background:rgba(183,224,120,.14)!important;color:#b7e078!important;border-color:rgba(183,224,120,.25)!important}',
    'html.skin-popups input,html.skin-popups select,html.skin-popups textarea{background:#fff!important;color:#1c1f26!important}',
    'html.skin-popups input::placeholder,html.skin-popups textarea::placeholder{color:#8b909a!important}',

    /* navegación del admin (Hoy · Solicitudes · Cuentas · Más) */
    'html.skin-popups .dark #adminTabs{background:#161a14!important;border-color:rgba(242,239,231,.1)!important;box-shadow:none!important}',
    'html.skin-popups .dark #adminTabs button{color:#9aa091!important}',
    'html.skin-popups .dark #adminTabs button.active{color:#b7e078!important}',
    'html.skin-popups .dark #adminTabs button.active span{font-weight:850}',
    'html.skin-popups #adminTabIndicator{background:linear-gradient(90deg,#8fb84f,#b7e078)!important}',
    'html.skin-popups .admin-tab-badge{background:#b7e078!important;color:#10130e!important}',

    /* acciones y ojos de admin */
    'html.skin-popups .admin-ojo{background:rgba(183,224,120,.14)!important;color:#b7e078!important}',
    'html.skin-popups .admin-ojo.on{background:rgba(58,208,164,.2)!important;color:#3ad0a4!important}',
    'html.skin-popups button.acc,html.skin-popups .btn-acc,html.skin-popups .acc-btn{background:#b7e078!important;color:#10130e!important;border-color:#b7e078!important}',

    /* enlaces y acentos textuales */
    'html.skin-popups a{color:#b7e078!important}',
    'html.skin-popups .dark .sub,html.skin-popups .dark small{color:#9aa091!important}',

    /* superficie general tipo panel POPUPS */
    'html.skin-popups .dark .card,html.skin-popups .dark .panel,html.skin-popups .dark .item{background:#161a14!important;border-color:rgba(242,239,231,.09)!important}'
  ].join('\n');

  function apply() {
    var h = document.documentElement, b = document.body;
    h.classList.add('skin-popups');
    h.classList.add('dark');
    if (b) b.classList.add('dark');
    if (!document.getElementById('skinPopupsCss')) {
      var s = document.createElement('style');
      s.id = 'skinPopupsCss';
      s.textContent = CSS;
      (document.head || h).appendChild(s);
    }
    try {
      var m = document.querySelector('meta[name="theme-color"]');
      if (m) m.setAttribute('content', '#0e100d');
    } catch (e) {}
  }

  apply();
  if (document.body) {
    try {
      new MutationObserver(apply).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    } catch (e) {}
  }
  window.addEventListener('load', function () { setTimeout(apply, 250); });
})();
