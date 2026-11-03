/* ============================================================
   APPI · Primer ingreso acompañado (v894)
   Un único recorrido amable: acceso directo, MI PSA y avisos.
   Evita que los popups anteriores se superpongan y deja lo
   pendiente como una tarjeta tranquila en el Home.
   ============================================================ */
(function () {
  'use strict';

  var KEY = 'appi_onboarding_v1';
  var TUTO_KEY = 'tutoVisto_v2';
  var active = false;
  var step = 'welcome';
  var deferredInstall = null;
  var state = { shortcut: false, psa: false, notifications: false };

  function $(id) { return document.getElementById(id); }
  function esc(v) {
    return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function read() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  function hasOldTutorial() { try { return localStorage.getItem(TUTO_KEY) === '1'; } catch (e) { return false; } }
  function firstTimePending() { return !read() && !hasOldTutorial(); }
  function managesFirstEntry() { return active || firstTimePending(); }
  function suppressAutomaticPopups() { return managesFirstEntry() || !!read(); }
  function isStandalone() {
    try {
      return window.navigator.standalone === true ||
        (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
    } catch (e) { return false; }
  }
  function hasPsa() {
    try {
      var c = JSON.parse(localStorage.getItem('appsi_psa_creds') || 'null');
      return !!(c && c.center && c.number && c.password);
    } catch (e) { return false; }
  }
  function hasNotifications() {
    try { return 'Notification' in window && Notification.permission === 'granted'; } catch (e) { return false; }
  }
  function profile() {
    try { return window.APPIAuth && window.APPIAuth.currentProfile ? window.APPIAuth.currentProfile() : null; } catch (e) { return null; }
  }
  function firstName() {
    var p = profile() || {};
    var full = String(p.nombre || '').trim();
    return full ? full.split(/\s+/)[0] : 'Hola';
  }
  function authorized() {
    try {
      if (document.body.classList.contains('appi-login-abierto') || document.body.classList.contains('appi-admin')) return false;
      var lock = $('lockScreen');
      if (lock && !lock.classList.contains('hidden') && lock.getAttribute('hidden') == null) {
        var cs = getComputedStyle(lock);
        if (cs.display !== 'none' && cs.visibility !== 'hidden') return false;
      }
      if (window.APPIAuth && window.APPIAuth.isEnabled && window.APPIAuth.isEnabled()) {
        if (window.APPIAuth.isLocallyAuthorized && !window.APPIAuth.isLocallyAuthorized()) return false;
        var p = profile();
        if (!p || p.rol === 'admin') return false;
      }
      var choice = $('personChoiceOverlay');
      if (choice && !choice.hidden) return false;
      return true;
    } catch (e) { return false; }
  }

  function injectStyles() {
    if ($('appiOnboardingCss')) return;
    var style = document.createElement('style');
    style.id = 'appiOnboardingCss';
    style.textContent =
      '#appiOnboardingOverlay{position:fixed;inset:0;z-index:40500;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(5,19,30,.64);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}' +
      '#appiOnboardingOverlay[hidden]{display:none!important}' +
      '.appi-onboarding-card{position:relative;width:min(100%,410px);max-height:min(92vh,92dvh);overflow:auto;border-radius:27px;background:#fffdf8;box-shadow:0 28px 90px rgba(2,18,32,.35);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#252a34;scrollbar-width:thin}' +
      '.aob-top{padding:17px 19px 0;display:flex;align-items:center;justify-content:space-between}.aob-step{font-size:11px;color:#737983;font-weight:900;letter-spacing:.07em;text-transform:uppercase}.aob-close{width:36px;height:36px;border:0;border-radius:50%;background:#f0ece4;color:#666d75;font-size:20px;cursor:pointer}' +
      '.aob-progress{display:flex;gap:5px;padding:12px 19px 0}.aob-progress i{height:4px;flex:1;border-radius:99px;background:#e5e0d8}.aob-progress i.on{background:#0b5878}' +
      '.aob-body{padding:14px 20px 20px}.aob-icon{width:62px;height:62px;margin:1px auto 10px;border-radius:19px;background:linear-gradient(145deg,#0b5878,#3ec6a1);display:grid;place-items:center;color:#fff;font-size:27px;font-style:normal;box-shadow:0 10px 24px rgba(11,88,120,.23)}' +
      '.aob-body h2{margin:0 auto 10px;max-width:330px;font-size:24px;line-height:1.2;text-align:center;letter-spacing:-.02em;color:#252a34}.aob-lead{margin:0 auto;color:#5d6570;font-size:15px;line-height:1.55;text-align:center;max-width:335px}' +
      '.aob-features{display:grid;gap:8px;margin:17px 0}.aob-feature{display:flex;gap:10px;align-items:center;padding:11px 12px;border:1px solid #e5dfd5;border-radius:14px;background:#faf7f1}.aob-feature>i{width:34px;height:34px;flex:none;border-radius:10px;background:#e5f2f0;display:grid;place-items:center;font-style:normal;font-size:17px}.aob-feature b{display:block;font-size:14px;line-height:1.25}.aob-feature small{display:block;margin-top:3px;color:#666d77;font-size:12px;line-height:1.4}' +
      '.aob-primary{width:100%;min-height:54px;border:0;border-radius:14px;background:#0b5878;color:#fff;font-size:14px;font-weight:900;box-shadow:0 8px 18px rgba(11,88,120,.22);cursor:pointer}.aob-primary:disabled{opacity:.64;cursor:wait}.aob-secondary{width:100%;min-height:44px;border:0;background:transparent;color:#606873;font-size:13px;font-weight:800;padding:11px 5px 0;cursor:pointer}.aob-actions{display:grid;grid-template-columns:92px 1fr;gap:8px;margin-top:15px}.aob-actions .aob-secondary{border:1px solid #ddd7cc;border-radius:14px;padding:0}' +
      '.aob-note{display:flex;gap:10px;margin:14px 0;padding:12px 13px;border:1px solid #c5dcde;border-radius:13px;background:#edf7f6;color:#294f58;font-size:12px;line-height:1.5}.aob-note>i{font-style:normal;font-size:17px}.aob-warning{background:#fff5e8;border-color:#efd1a9;color:#6d4c22}' +
      '.aob-devices{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:17px 0 12px}.aob-device{min-height:120px;border:2px solid #ded8cd;border-radius:18px;background:#fff;padding:14px 9px;color:#30353d;text-align:center;cursor:pointer}.aob-device:focus,.aob-device:hover{outline:none;border-color:#0b5878;background:#eef7f7}.aob-device i{display:grid;place-items:center;width:48px;height:48px;margin:0 auto 8px;border-radius:15px;background:#e8f3f3;font-style:normal;font-size:24px}.aob-device b{display:block;font-size:15px}.aob-device small{display:block;margin-top:4px;color:#68707a;font-size:11px;line-height:1.35}' +
      '.aob-install{display:grid;gap:7px;margin:12px 0}.aob-install-row{display:grid;grid-template-columns:38px 1fr;gap:10px;align-items:center;padding:9px 11px;border:1px solid #e2dcd1;border-radius:15px;background:#fbf8f2;text-align:left}.aob-install-row>i{width:36px;height:36px;border-radius:12px;background:#e4f2f2;color:#0b5878;display:grid;place-items:center;font-style:normal;font-size:16px;font-weight:950}.aob-install-row b{display:block;font-size:13px;line-height:1.3}.aob-install-row small{display:block;margin-top:3px;color:#626a74;font-size:11px;line-height:1.4}' +
      '.aob-form{margin-top:14px;border:1px solid #e2dcd1;border-radius:15px;overflow:hidden;background:#fff}.aob-field{display:grid;grid-template-columns:142px 1fr;align-items:center;min-height:50px;padding:0 12px;border-bottom:1px solid #eee8de}.aob-field:last-child{border:0}.aob-field label{font-size:13px;font-weight:850;color:#363b43}.aob-field input{width:100%;border:0;outline:0;text-align:right;color:#242830;font-size:15px;background:transparent;min-width:0}.aob-pass{display:flex;align-items:center}.aob-pass input{flex:1}.aob-eye{width:32px;height:32px;border:0;background:transparent;color:#59626c;cursor:pointer}.aob-privacy{display:flex;align-items:flex-start;justify-content:center;gap:6px;margin-top:10px;color:#626a73;font-size:11px;line-height:1.4;text-align:center}.aob-status{min-height:18px;margin:8px 0 -3px;text-align:center;font-size:11px;font-weight:850;color:#17835f}' +
      '.aob-options{display:grid;gap:8px;margin:15px 0}.aob-option{display:grid;grid-template-columns:38px 1fr auto;gap:9px;align-items:center;padding:11px;border:1px solid #e4ded4;border-radius:14px;background:#fbf8f2}.aob-option>i{display:grid;place-items:center;width:36px;height:36px;border-radius:11px;background:#e9f2f5;font-style:normal}.aob-option b{display:block;font-size:13px;line-height:1.25}.aob-option small{display:block;color:#68707a;font-size:11px;line-height:1.35;margin-top:3px}.aob-toggle{position:relative;width:42px;height:25px}.aob-toggle input{opacity:0;width:0;height:0}.aob-toggle span{position:absolute;inset:0;border-radius:99px;background:#cbd0d3}.aob-toggle span:after{content:"";position:absolute;width:21px;height:21px;left:2px;top:2px;border-radius:50%;background:#fff;box-shadow:0 2px 4px rgba(0,0,0,.18);transition:.2s}.aob-toggle input:checked+span{background:#38b993}.aob-toggle input:checked+span:after{transform:translateX(17px)}' +
      '.aob-done{width:72px;height:72px;margin:3px auto 12px;border-radius:50%;display:grid;place-items:center;background:#e2f5ed;color:#17835f;font-size:34px;font-weight:950}.aob-checks{display:grid;gap:7px;margin:15px 0}.aob-check{display:grid;grid-template-columns:32px 1fr auto;gap:9px;align-items:center;padding:10px 11px;border-radius:13px;border:1px solid #e4ded4;background:#faf7f1}.aob-check>i{font-style:normal;width:30px;height:30px;border-radius:9px;background:#e2f4ed;color:#17835f;display:grid;place-items:center;font-weight:950}.aob-check b{display:block;font-size:13px}.aob-check small{display:block;color:#68707a;font-size:11px;line-height:1.35;margin-top:3px}.aob-check em{font-style:normal;font-size:9px;font-weight:900;color:#17835f}.aob-check.pending>i{background:#fff0df;color:#a96825}.aob-check.pending em{color:#a96825}' +
      '.appi-onboarding-pending{margin:0 14px 15px;padding:14px;border:1px solid #bed8da;border-radius:17px;background:#edf7f6;color:#284e58;box-shadow:0 7px 18px rgba(11,88,120,.08)}.appi-onboarding-pending b{display:block;font-size:14px;color:#26333a}.appi-onboarding-pending p{margin:5px 0 11px;font-size:12px;line-height:1.45}.appi-onboarding-pending button{width:100%;min-height:44px;border:0;border-radius:12px;background:#0b5878;color:#fff;font-size:12px;font-weight:900;cursor:pointer}' +
      'body.dark .appi-onboarding-card{background:#28262c;color:#f4f2f5}body.dark .aob-body h2{color:#fff}body.dark .aob-lead,body.dark .aob-feature small,body.dark .aob-option small,body.dark .aob-check small{color:#c9c5cc}body.dark .aob-feature,body.dark .aob-install-row,body.dark .aob-option,body.dark .aob-check,body.dark .aob-form,body.dark .aob-device{background:#343138;border-color:#4b4750}body.dark .aob-field label,body.dark .aob-field input,body.dark .aob-device{color:#f4f2f5}body.dark .aob-field{border-color:#4b4750}' +
      '@media(max-width:430px){#appiOnboardingOverlay{padding:14px}.appi-onboarding-card{max-height:94dvh}.aob-body{padding:12px 17px 17px}.aob-body h2{font-size:22px}.aob-lead{font-size:14px}.aob-field{grid-template-columns:132px 1fr}}' +
      '@media(prefers-reduced-motion:reduce){.appi-onboarding-card{animation:none!important}}';
    document.head.appendChild(style);
  }

  function shell(label, index, body) {
    var parts = '';
    for (var i = 0; i < 5; i++) parts += '<i class="' + (i <= index ? 'on' : '') + '"></i>';
    return '<div class="aob-top"><span class="aob-step">' + esc(label) + '</span><button type="button" class="aob-close" data-aob="close" aria-label="Cerrar y continuar después">×</button></div>' +
      '<div class="aob-progress" aria-hidden="true">' + parts + '</div><div class="aob-body">' + body + '</div>';
  }
  function welcomeHtml() {
    return shell('Primer ingreso', 0,
      '<i class="aob-icon">A</i><h2>Hola, ' + esc(firstName()) + '. Bienvenida a APPI</h2>' +
      '<p class="aob-lead">Te vamos a acompañar para dejar todo preparado. Vamos paso a paso, sin apuro, y podés volver atrás cuando quieras.</p>' +
      '<div class="aob-features">' +
        '<div class="aob-feature"><i>⌂</i><div><b>Crear un acceso directo</b><small>APPI quedará como un ícono en la pantalla de tu teléfono.</small></div></div>' +
        '<div class="aob-feature"><i>🔗</i><div><b>Conectar tu cuenta de MI PSA</b><small>Así APPI podrá traer tu equipo, tus garantías y tus cierres.</small></div></div>' +
        '<div class="aob-feature"><i>🔔</i><div><b>Elegir si querés recibir avisos</b><small>Te explicaremos cuáles son y vos decidirás cuáles activar.</small></div></div>' +
      '</div><button type="button" class="aob-primary" data-aob="device">Empezar paso a paso</button>' +
      '<button type="button" class="aob-secondary" data-aob="skip-all">Prefiero hacerlo en otro momento</button>');
  }
  function deviceHtml() {
    return shell('Paso 1 de 3', 1,
      '<i class="aob-icon">⌂</i><h2>Primero, dejemos APPI a mano</h2>' +
      '<p class="aob-lead">Podemos crear un acceso directo para que APPI aparezca como un ícono en la pantalla de tu teléfono, igual que las demás aplicaciones.</p>' +
      (isStandalone() ? '<div class="aob-note"><i>✓</i><span>APPI ya está abierta desde su propio ícono. Este paso está listo.</span></div>' : '<div class="aob-note"><i>ℹ</i><span>Para mostrarte las indicaciones correctas, elegí el tipo de teléfono que estás usando.</span></div>') +
      '<div class="aob-devices"><button type="button" class="aob-device" data-aob="iphone"><i>🍎</i><b>Tengo iPhone</b><small>Teléfono de Apple</small></button>' +
      '<button type="button" class="aob-device" data-aob="android"><i>🤖</i><b>Tengo Android</b><small>Samsung, Motorola, Xiaomi y otros</small></button></div>' +
      '<button type="button" class="aob-primary" data-aob="shortcut-done">Ya tengo el ícono de APPI</button>' +
      '<button type="button" class="aob-secondary" data-aob="shortcut-later">Prefiero crear el acceso directo más tarde</button>' +
      '<button type="button" class="aob-secondary" data-aob="welcome">Volver a la bienvenida</button>');
  }
  function guideHtml(type) {
    var iphone = type === 'iphone';
    var title = iphone ? 'Cómo crear el acceso directo en iPhone' : 'Cómo crear el acceso directo en Android';
    var lead = iphone ? 'Estas indicaciones funcionan usando Safari. Al terminar, vas a ver el ícono de APPI en la pantalla de inicio.' : 'Hacelo con calma. Al terminar, vas a encontrar el ícono de APPI junto a las demás aplicaciones.';
    var rows = iphone ?
      [['Tocá el botón Compartir', 'Es el cuadrado con una flecha hacia arriba. Puede estar abajo o arriba de la pantalla.'], ['Elegí “Agregar a pantalla de inicio”', 'Si no aparece a simple vista, deslizá el menú hacia arriba con el dedo.'], ['Tocá “Agregar”', 'Está arriba, a la derecha. El ícono de APPI aparecerá en tu pantalla.']] :
      [['Abrí el menú del navegador', 'Tocá los tres puntos ⋮ que aparecen arriba, a la derecha.'], ['Elegí la opción para agregar APPI', 'Puede decir “Instalar aplicación” o “Agregar a pantalla principal”.'], ['Confirmá la instalación', 'Tocá “Instalar” o “Agregar”. El acceso directo se creará automáticamente.']];
    var list = rows.map(function (r, i) { return '<div class="aob-install-row"><i>' + (i + 1) + '</i><div><b>' + r[0] + '</b><small>' + r[1] + '</small></div></div>'; }).join('');
    var help = iphone ? '<b>Importante:</b> después abrí APPI tocando ese nuevo ícono. Así el iPhone podrá mostrarte las notificaciones.' : '<b>¿Apareció un cartel que dice “Instalar APPI”?</b> Podés tocar ese botón directamente. Es el camino más sencillo.';
    return shell('Acceso directo · ' + (iphone ? 'iPhone' : 'Android'), 1,
      '<i class="aob-icon">' + (iphone ? '🍎' : '🤖') + '</i><h2>' + title + '</h2><p class="aob-lead">' + lead + '</p>' +
      '<div class="aob-install">' + list + '</div><div class="aob-note aob-warning"><i>ℹ</i><span>' + help + '</span></div>' +
      '<button type="button" class="aob-primary" data-aob="' + (iphone ? 'iphone-done' : 'android-done') + '">' + (deferredInstall && !iphone ? 'Instalar APPI ahora' : 'Ya veo el ícono de APPI') + '</button>' +
      '<button type="button" class="aob-secondary" data-aob="shortcut-later">No pude hacerlo; continuar por ahora</button>' +
      '<button type="button" class="aob-secondary" data-aob="device">Volver a elegir el teléfono</button>');
  }
  function psaDefaults() {
    var c = null;
    try { c = JSON.parse(localStorage.getItem('appsi_psa_creds') || 'null'); } catch (e) {}
    var p = profile() || {};
    return {
      center: c && c.center || p.sucursal || String(p.dip || '').split('-')[0] || '',
      number: c && c.number || p.numero_distribuidor || String(p.dip || '').split('-')[1] || '',
      password: c && c.password || ''
    };
  }
  function psaHtml() {
    var c = psaDefaults();
    return shell('Paso 2 de 3', 2,
      '<i class="aob-icon">🔗</i><h2>Ahora, conectemos tu cuenta de MI PSA</h2>' +
      '<p class="aob-lead">Necesitás los mismos datos que usás para entrar a MI PSA. Esta configuración se realiza una sola vez.</p>' +
      '<div class="aob-note"><i>✓</i><span>APPI podrá consultar tu equipo, tus garantías, tus usuarios y tus cierres. <b>APPI no modifica ninguna información de MI PSA.</b></span></div>' +
      '<div class="aob-form"><div class="aob-field"><label for="aobCenter">Centro o sucursal</label><input id="aobCenter" inputmode="numeric" value="' + esc(c.center) + '" placeholder="02"></div>' +
      '<div class="aob-field"><label for="aobNumber">Número de distribuidor</label><input id="aobNumber" inputmode="numeric" value="' + esc(c.number) + '" placeholder="98020174"></div>' +
      '<div class="aob-field"><label for="aobPassword">Clave de MI PSA</label><span class="aob-pass"><input id="aobPassword" type="password" value="' + esc(c.password) + '" placeholder="Tu clave"><button type="button" class="aob-eye" data-aob="eye" aria-label="Mostrar u ocultar la clave">◉</button></span></div></div>' +
      '<div class="aob-privacy">🔒 Tu clave queda guardada solamente en este dispositivo. Nadie de APPI puede verla.</div><div class="aob-status" id="aobStatus"></div>' +
      '<div class="aob-actions"><button type="button" class="aob-secondary" data-aob="device">Atrás</button><button type="button" class="aob-primary" data-aob="save-psa">Guardar y continuar</button></div>' +
      '<button type="button" class="aob-secondary" data-aob="psa-later">Continuar sin conectar por ahora</button>');
  }
  function notificationHtml() {
    return shell('Paso 3 de 3', 3,
      '<i class="aob-icon">🔔</i><h2>Elegí si querés recibir avisos</h2>' +
      '<p class="aob-lead">Los avisos son pequeños recordatorios que pueden ayudarte. No son obligatorios y podés cambiarlos cuando quieras.</p>' +
      '<div class="aob-options">' +
      option('📅', 'Tareas y recordatorios', 'Te recuerda lo que tenés anotado para el día.', 'aobTasks', true) +
      option('🛡', 'Garantías próximas a vencer', 'Te avisa con tiempo para contactar al cliente.', 'aobWarranty', true) +
      option('⚡', 'Cambios de puntos en tu equipo', 'Te informa cuando haya un movimiento importante de PB.', 'aobPb', false) + '</div>' +
      '<div class="aob-note"><i>ℹ</i><span>Cuando toques el botón, tu teléfono preguntará si permitís las notificaciones. Elegí <b>Permitir</b> para recibir los avisos.</span></div>' +
      '<div class="aob-status" id="aobStatus"></div><div class="aob-actions"><button type="button" class="aob-secondary" data-aob="psa">Atrás</button><button type="button" class="aob-primary" data-aob="activate-notifications">Continuar y activar avisos</button></div>' +
      '<button type="button" class="aob-secondary" data-aob="notifications-later">Continuar sin avisos por ahora</button>');
  }
  function option(icon, title, text, id, checked) {
    return '<div class="aob-option"><i>' + icon + '</i><div><b>' + title + '</b><small>' + text + '</small></div><label class="aob-toggle"><input id="' + id + '" type="checkbox"' + (checked ? ' checked' : '') + '><span></span></label></div>';
  }
  function check(icon, title, text, ok) {
    return '<div class="aob-check' + (ok ? '' : ' pending') + '"><i>' + (ok ? '✓' : '!') + '</i><div><b>' + title + '</b><small>' + text + '</small></div><em>' + (ok ? 'LISTO' : 'PENDIENTE') + '</em></div>';
  }
  function readyHtml() {
    var name = firstName();
    return shell('Configuración completa', 4,
      '<div class="aob-done">✓</div><h2>¡Listo, ' + esc(name) + '!</h2>' +
      '<p class="aob-lead">Terminamos la preparación. Podés ver qué quedó listo y qué elegiste dejar para otro momento.</p>' +
      '<div class="aob-checks">' +
      check('⌂', state.shortcut ? 'Acceso directo creado' : 'Acceso directo pendiente', state.shortcut ? 'APPI está disponible desde la pantalla del teléfono.' : 'Podés crear el ícono más adelante.', state.shortcut) +
      check('🔗', state.psa ? 'MI PSA conectada' : 'MI PSA pendiente', state.psa ? 'APPI podrá mantener tu información actualizada.' : 'Podés conectarla más adelante.', state.psa) +
      check('🔔', state.notifications ? 'Avisos activados' : 'Avisos pendientes', state.notifications ? 'Recibirás los avisos que elegiste.' : 'Podés activarlos cuando quieras.', state.notifications) +
      check('✍', 'Tu nombre en los mensajes', 'Los mensajes podrán firmarse como ' + esc(name) + '.', true) + '</div>' +
      '<button type="button" class="aob-primary" data-aob="finish">Entrar a APPI</button>' +
      '<button type="button" class="aob-secondary" data-aob="welcome">Revisar los pasos nuevamente</button>');
  }

  function render() {
    var card = document.querySelector('#appiOnboardingOverlay .appi-onboarding-card');
    if (!card) return;
    if (step === 'welcome') card.innerHTML = welcomeHtml();
    else if (step === 'device') card.innerHTML = deviceHtml();
    else if (step === 'iphone' || step === 'android') card.innerHTML = guideHtml(step);
    else if (step === 'psa') card.innerHTML = psaHtml();
    else if (step === 'notifications') card.innerHTML = notificationHtml();
    else card.innerHTML = readyHtml();
    card.scrollTop = 0;
    bind(card);
    setTimeout(function () {
      var focus = card.querySelector('.aob-primary, .aob-device, input');
      if (focus) focus.focus({ preventScroll: true });
    }, 80);
  }
  function go(next) { step = next; render(); }
  function setStatus(text, error) {
    var el = $('aobStatus');
    if (!el) return;
    el.textContent = text || '';
    el.style.color = error ? '#a33b34' : '#17835f';
  }
  function savePsa() {
    var center = String(($('aobCenter') || {}).value || '').trim();
    var number = String(($('aobNumber') || {}).value || '').trim();
    var password = String(($('aobPassword') || {}).value || '');
    if (!center || !number || !password) {
      setStatus('Por favor, completá los tres datos para poder continuar.', true);
      var first = !center ? $('aobCenter') : !number ? $('aobNumber') : $('aobPassword');
      if (first) first.focus();
      return;
    }
    try {
      localStorage.setItem('appsi_psa_creds', JSON.stringify({ center: center, number: number, password: password, remember: true, ts: Date.now() }));
      localStorage.setItem('appsi_psa_lastSync', new Date().toISOString());
      localStorage.removeItem('appsi_psa_desconectado');
      state.psa = true;
      setStatus('Los datos quedaron guardados correctamente ✓', false);
      setTimeout(function () { go('notifications'); }, 500);
    } catch (e) { setStatus('No pudimos guardar los datos en este dispositivo.', true); }
  }
  function saveNotificationChoices() {
    try {
      if (window.APPIRecordatorios && window.APPIRecordatorios.guardar) {
        var tasks = !!($('aobTasks') && $('aobTasks').checked);
        window.APPIRecordatorios.guardar({ hab: {
          manana: tasks, cumples: tasks, reasig: tasks, cierre: tasks,
          vence: !!($('aobWarranty') && $('aobWarranty').checked),
          pb_mov: !!($('aobPb') && $('aobPb').checked)
        } });
      }
    } catch (e) {}
  }
  async function activateNotifications(button) {
    saveNotificationChoices();
    if (button) { button.disabled = true; button.textContent = 'Esperando la respuesta del teléfono…'; }
    setStatus('Tu teléfono mostrará ahora la pregunta para permitir los avisos.', false);
    var ok = false;
    try {
      if (window.APPINotif && typeof window.APPINotif.activar === 'function') ok = await window.APPINotif.activar();
      else if ('Notification' in window) ok = (Notification.permission === 'granted' || await Notification.requestPermission() === 'granted');
    } catch (e) { ok = false; }
    if (ok) {
      state.notifications = true;
      try { if (window.APPIRecordatorios && window.APPIRecordatorios.planear) window.APPIRecordatorios.planear(); } catch (e) {}
      setStatus('Los avisos quedaron activados correctamente ✓', false);
      setTimeout(function () { go('ready'); }, 450);
    } else {
      state.notifications = false;
      if (button) { button.disabled = false; button.textContent = 'Volver a intentar activar los avisos'; }
      setStatus('El teléfono no activó los avisos. Podés volver a intentar o continuar sin ellos.', true);
    }
  }
  async function installAndroid() {
    if (!deferredInstall) { state.shortcut = true; go('psa'); return; }
    try {
      deferredInstall.prompt();
      var result = await deferredInstall.userChoice;
      deferredInstall = null;
      state.shortcut = !!(result && result.outcome === 'accepted');
      if (state.shortcut) go('psa'); else render();
    } catch (e) { state.shortcut = false; render(); }
  }

  function bind(card) {
    card.onclick = function (event) {
      var button = event.target.closest('[data-aob]');
      if (!button) return;
      var action = button.getAttribute('data-aob');
      if (action === 'close') return finish();
      if (action === 'skip-all') { state.shortcut = false; state.psa = hasPsa(); state.notifications = hasNotifications(); return finish(); }
      if (action === 'shortcut-done' || action === 'iphone-done') { state.shortcut = true; return go('psa'); }
      if (action === 'android-done') return installAndroid();
      if (action === 'shortcut-later') { state.shortcut = false; return go('psa'); }
      if (action === 'save-psa') return savePsa();
      if (action === 'psa-later') { state.psa = false; return go('notifications'); }
      if (action === 'activate-notifications') return activateNotifications(button);
      if (action === 'notifications-later') { state.notifications = false; return go('ready'); }
      if (action === 'eye') {
        var pass = $('aobPassword'); if (pass) pass.type = pass.type === 'password' ? 'text' : 'password'; return;
      }
      if (action === 'finish') return finish();
      go(action);
    };
  }

  function open(start) {
    injectStyles();
    var overlay = $('appiOnboardingOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'appiOnboardingOverlay';
      overlay.innerHTML = '<article class="appi-onboarding-card" role="dialog" aria-modal="true" aria-label="Preparar APPI por primera vez"></article>';
      document.body.appendChild(overlay);
    }
    state.shortcut = isStandalone() || !!(read() && read().shortcut);
    state.psa = hasPsa() || !!(read() && read().psa);
    state.notifications = hasNotifications() || !!(read() && read().notifications);
    active = true;
    overlay.hidden = false;
    step = start || 'welcome';
    render();
  }
  function finish() {
    try {
      localStorage.setItem(KEY, JSON.stringify({ done: true, shortcut: !!state.shortcut, psa: !!state.psa, notifications: !!state.notifications, ts: Date.now() }));
      localStorage.setItem(TUTO_KEY, '1');
      localStorage.setItem('welcomeSeen', '1');
      if (!state.notifications) {
        localStorage.setItem('appi_notif_listo_v1', '1');
        localStorage.setItem('appi_notif_popup_later', String(Date.now() + 400 * 24 * 3600 * 1000));
      }
    } catch (e) {}
    var overlay = $('appiOnboardingOverlay');
    if (overlay) overlay.hidden = true;
    active = false;
    renderPendingCard();
    if (state.psa) setTimeout(function () { try { if (typeof window.psaProbar === 'function') window.psaProbar(); } catch (e) {} }, 900);
    try { if (typeof showToast === 'function') showToast('APPI quedó preparada ✓', 2300); } catch (e) {}
  }
  function firstPending(record) {
    if (!record || !record.shortcut) return 'device';
    if (!record.psa) return 'psa';
    if (!record.notifications) return 'notifications';
    return 'ready';
  }
  function renderPendingCard() {
    var home = $('view-home');
    if (!home) return;
    var old = $('appiOnboardingPending');
    var record = read();
    if (!record || !record.done || (record.shortcut && record.psa && record.notifications)) { if (old) old.remove(); return; }
    if (!old) {
      old = document.createElement('div');
      old.id = 'appiOnboardingPending';
      old.className = 'appi-onboarding-pending';
      var head = home.querySelector('.home-section-head');
      if (head) home.insertBefore(old, head); else home.appendChild(old);
    }
    var pending = [];
    if (!record.shortcut) pending.push('crear el acceso directo');
    if (!record.psa) pending.push('conectar MI PSA');
    if (!record.notifications) pending.push('activar los avisos');
    old.innerHTML = '<b>Podés terminar de preparar APPI cuando quieras</b><p>Quedó pendiente ' + esc(pending.join(', ').replace(/, ([^,]*)$/, ' y $1')) + '.</p><button type="button">Continuar la configuración</button>';
    old.querySelector('button').onclick = function () { open(firstPending(record)); };
  }

  function tryOpen() {
    if (!firstTimePending() || active || !authorized()) { renderPendingCard(); return false; }
    var home = $('view-home');
    if (!home || !home.classList.contains('active')) return false;
    var modal = $('modalOverlay');
    if (modal && modal.classList.contains('open')) return false;
    open('welcome');
    return true;
  }
  function start() {
    injectStyles();
    renderPendingCard();
    var attempts = 0;
    var timer = setInterval(function () {
      if (tryOpen() || ++attempts > 80 || !firstTimePending()) clearInterval(timer);
    }, 500);
    window.addEventListener('appi-auth-change', function () { setTimeout(tryOpen, 350); });
    window.addEventListener('appi-person-change', function () { setTimeout(tryOpen, 350); });
  }

  window.addEventListener('beforeinstallprompt', function (event) { event.preventDefault(); deferredInstall = event; });
  window.addEventListener('appinstalled', function () { state.shortcut = true; if (active && step === 'android') go('psa'); });
  window.APPIOnboarding = {
    abrir: open,
    activo: function () { return active; },
    gestionaPrimerIngreso: managesFirstEntry,
    suprimeAutomaticos: suppressAutomaticPopups,
    estado: read,
    pendiente: function (key) { var r = read(); return !!(r && r.done && !r[key]); },
    mostrarPendiente: renderPendingCard
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
