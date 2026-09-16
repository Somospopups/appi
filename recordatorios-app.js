/* ============================================================
   APPI · Recordatorios del teléfono (v818)
   ------------------------------------------------------------
   Programar los avisos diarios del día directamente en el
   teléfono (Android e iPhone), sin "conectar" nada:

     🎂 08:00  Cumpleaños de hoy (si hay usuarios)
     ☀️ 09:00  Tus acciones del día
     📅 09:30  Garantías por vencer (si hay)
     ↻  10:00  Reasignados para recontactar (si hay)
     🌙 18:00  Cierre del día

   Cómo funciona:
   - Al abrir la app (y cada vez que cambia la base de usuarios)
     se programa cada aviso habilitado para la próxima
     ocurrencia de su hora. En navegadores que soportan
     showTrigger (Chrome, Safari 16.4+) el aviso sale a la hora
     aunque la app esté cerrada. Si no, sale cuando la app esté
     abierta y se pasó la hora (atrasado, una vez por día).
   - Se pide permiso una vez (el mismo flujo de appi-notif.js).
   - Las horas y switches se cambian en Mi Perfil →
     "Notificaciones y recordatorios".
   ============================================================ */
(function () {
  'use strict';
  var LS_CONF = 'appi_recordatorios_v1';
  var LS_PLAN = 'appi_rec_plan_v1';
  var LS_SENT = 'appi_rec_enviados_v1';

  var DEFAULTS = {
    hab: { cumples: true, manana: true, vence: true, reasig: true, cierre: true },
    hora: { cumples: '08:00', manana: '09:00', vence: '09:30', reasig: '10:00', cierre: '18:00' }
  };

  function hoyLocal() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function leer(key, fallback) {
    try { var v = JSON.parse(localStorage.getItem(key) || 'null'); return v || fallback; } catch (e) { return fallback; }
  }
  function conf() {
    var c = leer(LS_CONF, {});
    return {
      hab: Object.assign({}, DEFAULTS.hab, c.hab || {}),
      hora: Object.assign({}, DEFAULTS.hora, c.hora || {})
    };
  }
  function saveConf(c) { try { localStorage.setItem(LS_CONF, JSON.stringify(c)); } catch (e) {} }
  function esAdmin() {
    try {
      var p = window.APPIAuth && window.APPIAuth.currentProfile && window.APPIAuth.currentProfile();
      return !!(p && p.rol === 'admin');
    } catch (e) { return false; }
  }
  function usuarios() {
    try { return Array.isArray(window.usuariosU) ? window.usuariosU : []; } catch (e) { return []; }
  }
  /* Día/mes argentino desde la celda de cumpleaños ("08/03", "8 mar", Excel…). */
  function dmCumple(u) {
    var v = (u && (u.cumpleRaw || u.cumple)) || '';
    if (!v) return null;
    if (typeof window.ymdDesdeCelda === 'function') {
      var ymd = window.ymdDesdeCelda(v);
      if (ymd) return { m: ymd.m, d: ymd.d };
    }
    var s = String(v).trim();
    var m = s.match(/^(\d{1,2})[/\-.](\d{1,2})$/);
    if (m) { var d = +m[1], mo = +m[2]; if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) return { m: mo, d: d }; }
    return null;
  }
  function nombreDe(u) {
    try {
      if (typeof window.nombreDePila === 'function') { var n = window.nombreDePila(u.usuario); if (n) return n; }
    } catch (e) {}
    return String(u.usuario || '').split(',')[0].trim();
  }
  function miNombre() {
    try {
      if (window.APPIHielo && window.APPIHielo.firma && window.APPIHielo.firma()) return window.APPIHielo.firma();
    } catch (e) {}
    try {
      var p = window.APPIAuth && window.APPIAuth.currentProfile && window.APPIAuth.currentProfile();
      if (p && p.nombre) return String(p.nombre).trim().split(' ')[0];
    } catch (e) {}
    return '';
  }

  /* Cada avisador devuelve el texto del cuerpo o null (hoy no hay nada). */
  var META = {
    cumples: {
      titulo: 'Cumpleaños de hoy', vista: 'view-usuarios',
      build: function () {
        var hoy = new Date(), lista = [];
        usuarios().forEach(function (u) {
          var dm = dmCumple(u);
          if (dm && dm.m === hoy.getMonth() + 1 && dm.d === hoy.getDate()) lista.push(nombreDe(u));
        });
        if (!lista.length) return null;
        if (lista.length === 1) return '🎂 Hoy cumple años ' + lista[0] + '. No olvides el mensaje.';
        return '🎂 Hoy cumplen años ' + lista.slice(0, 3).join(' y ') + (lista.length > 3 ? ' y ' + (lista.length - 3) + ' más' : '') + '.';
      }
    },
    manana: {
      titulo: 'Tus acciones del día', vista: 'view-home',
      build: function () {
        var n = miNombre();
        return n
          ? '☀️ Buen día, ' + n + '! Tenés tus acciones del día listas. Vamos.'
          : '☀️ Buen día! Tenés tus acciones del día listas. Vamos.';
      }
    },
    vence: {
      titulo: 'Garantías por vencer', vista: 'view-usuarios',
      build: function () {
        var n = usuarios().filter(function (u) { return u.estado === 'porVencer'; }).length;
        if (!n) return null;
        return '📅 Tenés ' + n + ' garantía' + (n === 1 ? '' : 's') + ' por vencer en los próximos 30 días. Es el momento de hablarlas.';
      }
    },
    reasig: {
      titulo: 'Reasignados para recontactar', vista: 'view-usuarios',
      build: function () {
        var n = usuarios().filter(function (u) { return u.reasignado; }).length;
        if (!n) return null;
        return '↻ Tenés ' + n + ' usuario' + (n === 1 ? '' : 's') + ' reasignado' + (n === 1 ? '' : 's') + ' listos para recontactar.';
      }
    },
    cierre: {
      titulo: 'Cierre del día', vista: 'view-home',
      build: function () {
        var extra = '';
        try {
          if (typeof window.actionDueTasks === 'function') {
            var n = window.actionDueTasks().length;
            if (n > 0) extra = ' Te quedan ' + n + ' accion' + (n === 1 ? '' : 'es') + ' pendiente' + (n === 1 ? '' : 's') + '.';
          }
        } catch (e) {}
        return '🌙 Cierre del día: revisá cómo te fue antes de descansar.' + extra;
      }
    }
  };

  function opciones(key, body) {
    var meta = META[key];
    return {
      body: String(body).replace(/\s+/g, ' ').trim().slice(0, 180),
      icon: (function () { try { return new URL('./icon-192.png', document.baseURI).href; } catch (e) { return './icon-192.png'; } })(),
      badge: (function () { try { return new URL('./notification-badge.png', document.baseURI).href; } catch (e) { return './notification-badge.png'; } })(),
      tag: 'appi-rec-' + key + '-' + hoyLocal(),
      renotify: true,
      silent: false,
      lang: 'es',
      data: { url: './?rec=' + meta.vista, type: 'recordatorio', rec_view: meta.vista, rec_key: key },
      actions: [
        { action: 'open', title: 'Abrir APPI' },
        { action: 'dismiss', title: 'Ahora no' }
      ]
    };
  }
  function marcarEnviado(key) {
    var sent = leer(LS_SENT, {});
    sent[hoyLocal()] = sent[hoyLocal()] || {};
    sent[hoyLocal()][key] = Date.now();
    try { localStorage.setItem(LS_SENT, JSON.stringify(sent)); } catch (e) {}
  }

  /* Suelta el aviso: programado (showTrigger del SW, o setTimeout con la app
     abierta) o inmediato. Si el SW no puede, se intenta el respaldo y el
     catch-up de planear() garantiza que no se pierda ese día. */
  function soltar(key, body, when) {
    var opts = opciones(key, body);
    var inmediata = when.getTime() <= new Date().getTime();
    function disparar() {
      var sent = leer(LS_SENT, {});
      if (sent[hoyLocal()] && sent[hoyLocal()][key]) return; // ya emitió hoy
      try {
        // new Notification() (sin SW) no acepta "actions": el constructor
        // lanza y se pierde el aviso. En esta vía se omiten.
        var optsLocal = Object.assign({}, opts);
        delete optsLocal.actions;
        new Notification('APPI', optsLocal);
      } catch (e) {
        try { new Notification('APPI', { body: opts.body }); } catch (e2) {}
      }
      marcarEnviado(key);
    }
    function fallback() {
      if (inmediata) disparar();
      else setTimeout(disparar, Math.max(0, when.getTime() - Date.now()));
    }
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
        // getRegistrations() resuelve al instante (a diferencia de ready(),
        // que queda pendiente si el SW nunca se registró).
        Promise.resolve(navigator.serviceWorker.getRegistrations()).then(function (regs) {
          var reg = regs && regs[0];
          if (reg && reg.showNotification) {
            var o = inmediata ? opts : Object.assign({}, opts, { showTrigger: when.getTime() });
            return reg.showNotification('APPI', o).then(function () { marcarEnviado(key); });
          }
          fallback();
        }).catch(fallback);
        return;
      }
    } catch (e) {}
    fallback();
  }

  /* Programa (o actualiza) todos los avisos del día. Idempotente. */
  function planear() {
    if (!permisoOk()) return;
    if (esAdmin()) return;
    var c = conf(), now = new Date();
    var plan = leer(LS_PLAN, {});
    if (plan.fecha !== hoyLocal()) plan = { fecha: hoyLocal(), items: {} };
    var sent = leer(LS_SENT, {});
    var sentHoy = sent[hoyLocal()] || {};
    var cambio = false;
    Object.keys(META).forEach(function (key) {
      if (!c.hab[key]) return;
      var cuerpo = META[key].build();
      var p = plan.items[key];
      if (cuerpo === null) {
        // Hoy no hay nada que avisar (sin cumpleaños / vencimientos / reasignados).
        if (p && !p.skip) { plan.items[key] = { skip: true }; cambio = true; }
        return;
      }
      if (sentHoy[key]) return; // ya salió hoy (showTrigger, catch-up o manual)
      // Solo se mantiene el plan si la hora configurada NO cambió y sigue a futuro.
      if (p && !p.skip && p.hora === c.hora[key] && p.when > now.getTime()) return;
      // La hora de HOY aún no pasó → programar; ya pasó y no se emitió → catch-up inmediato.
      var hoyA = new Date(now);
      var hm = String(c.hora[key] || '').match(/^(\d{1,2}):(\d{2})$/);
      if (hm) { hoyA.setHours(+hm[1], +hm[2], 0, 0); } else { hoyA.setHours(9, 0, 0, 0); }
      var when = hoyA.getTime() > now.getTime() ? hoyA : new Date(0);
      plan.items[key] = { when: when.getTime(), hora: c.hora[key] };
      cambio = true;
      soltar(key, cuerpo, when);
    });
    if (cambio) { try { localStorage.setItem(LS_PLAN, JSON.stringify(plan)); } catch (e) {} }
  }

  window.APPIRecordatorios = {
    planear: planear,
    conf: conf,
    guardar: function (nuevo) {
      var c = conf();
      if (nuevo.hab) c.hab = Object.assign({}, c.hab, nuevo.hab);
      if (nuevo.hora) c.hora = Object.assign({}, c.hora, nuevo.hora);
      saveConf(c);
      planear();
    },
    probar: function (key) {
      if (!permisoOk()) return false;
      var cuerpo = META[key] && META[key].build();
      if (cuerpo == null) cuerpo = META[key] ? META[key].titulo : 'APPI';
      // "Probar" siempre emite (acción explícita del usuario), sin dedupe.
      try {
        var o = opciones(key, cuerpo);
        var o2 = Object.assign({}, o);
        delete o2.actions;
        new Notification('APPI', o2);
        return true;
      } catch (e) {
        try { new Notification('APPI', { body: String(cuerpo).slice(0, 180) }); return true; } catch (e2) { return false; }
      }
    },
    META: META,
    hoyLocal: hoyLocal
  };

  /* ---------------- Pantalla de configuración (view-recordatorios) ------- */
  var LABELS = {
    cumples: ['🎂', 'Cumpleaños de hoy'],
    manana: ['☀️', 'Acciones del día'],
    vence: ['📅', 'Garantías por vencer'],
    reasig: ['↻', 'Reasignados para recontactar'],
    cierre: ['🌙', 'Cierre del día']
  };

  function permisoOk() {
    try { if (window.__REC_PERM_OVERRIDE) return window.__REC_PERM_OVERRIDE === 'granted'; } catch (e) {}
    return typeof Notification !== 'undefined' && Notification.permission === 'granted';
  }

  function render() {
    var list = document.getElementById('recList');
    if (!list) return;
    var c = conf();
    var html = '';
    Object.keys(META).forEach(function (key) {
      var lab = LABELS[key] || [key, key];
      html +=
        '<div style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:14px;background:rgba(255,255,255,0.72);border:1px solid rgba(80,90,130,0.12);box-shadow:0 4px 14px rgba(65,75,120,0.05)">' +
          '<div style="flex:1;min-width:0">' +
            '<div style="font-size:13px;font-weight:700;color:#292938">' + lab[0] + ' ' + lab[1] + '</div>' +
            '<button type="button" class="rec-probar" data-key="' + key + '" style="margin-top:4px;padding:4px 10px;border-radius:8px;border:1px solid rgba(80,90,130,0.18);background:none;color:#3d63c9;font:inherit;font-size:10.5px;font-weight:800;cursor:pointer">Probar</button>' +
          '</div>' +
          '<input type="time" class="rec-hora" data-key="' + key + '" value="' + c.hora[key] + '" aria-label="Hora de ' + lab[1] + '" style="width:86px;padding:8px 6px;border-radius:10px;border:1px solid rgba(80,90,130,0.16);background:#fff;color:#292938;font:inherit;font-size:12px;font-weight:700;text-align:center;outline:none">' +
          '<label class="ios-switch" style="flex:none"><input type="checkbox" class="rec-hab" data-key="' + key + '"' + (c.hab[key] ? ' checked' : '') + ' aria-label="Activar ' + lab[1] + '"><span class="ios-switch-slider"></span></label>' +
        '</div>';
    });
    list.innerHTML = html;
    list.querySelectorAll('.rec-hora').forEach(function (inp) {
      inp.addEventListener('change', function () {
        var c2 = conf(); c2.hora[inp.dataset.key] = inp.value; saveConf(c2); planear();
      });
    });
    list.querySelectorAll('.rec-hab').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var c2 = conf(); c2.hab[cb.dataset.key] = cb.checked; saveConf(c2); planear();
      });
    });
    list.querySelectorAll('.rec-probar').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var ok = permisoOk();
        if (!ok) {
          try { if (window.APPIDialog) window.APPIDialog.alert('Primero activá los avisos (botón de arriba) para poder probar.', { title: 'Avisos', icon: '🔔' }); } catch (e) {}
          return;
        }
        window.APPIRecordatorios.probar(btn.dataset.key);
      });
    });
    var hint = document.getElementById('recPermisosHint');
    if (hint) hint.style.display = permisoOk() ? 'none' : 'block';
  }
  window.APPIRecordatorios.render = render;
  window.APPIRecordatorios.pedirPermiso = function () {
    if (typeof Notification === 'undefined') return Promise.resolve('unsupported');
    if (Notification.permission === 'granted') { render(); return Promise.resolve('granted'); }
    return Notification.requestPermission().then(function (p) {
      render();
      if (p === 'granted') planear();
      return p;
    });
  };

  /* Pinta la pantalla cada vez que se abre (mismo patrón de wrap que la app). */
  function wrapShowView() {
    if (window.__recShowWrapped || typeof window.showView !== 'function') return;
    window.__recShowWrapped = true;
    var origSV = window.showView;
    window.showView = function (id, opts) {
      var r = origSV.apply(this, arguments);
      try { if (id === 'view-recordatorios') setTimeout(render, 50); } catch (e) {}
      return r;
    };
  }

  /* Al arrancar y cuando cambia la base de usuarios. */
  function arrancar() {
    try { planear(); } catch (e) {}
    try {
      if (typeof window.setInterval === 'function') {
        // Repasa cada 30 min mientras la app esté abierta (respaldo para
        // navegadores sin showTrigger).
        setInterval(function () { try { planear(); } catch (e) {} }, 30 * 60 * 1000);
      }
    } catch (e) {}
    try {
      var b = document.getElementById('recBtnPermiso');
      if (b && !b.__recBound) { b.__recBound = true; b.addEventListener('click', function () { window.APPIRecordatorios.pedirPermiso(); }); }
    } catch (e) {}
    try { wrapShowView(); } catch (e) {}
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arrancar);
  } else {
    arrancar();
  }
  // showView se define más tarde en la página: reintentos breves.
  setTimeout(function () { try { wrapShowView(); } catch (e) {} }, 800);
  setTimeout(function () { try { wrapShowView(); } catch (e) {} }, 2000);
  /* La base de usuarios se recarga en varios momentos (sync PSA, subida de
     planilla, arranque): ahí también repasamos los recordatorios. */
  if (typeof window.addEventListener === 'function') {
    window.addEventListener('appi-usuarios-cambiaron', function () { try { planear(); } catch (e) {} });
  }
})();
