/* ============================================================
   APPI · Calendario de Google (v819)
   ------------------------------------------------------------
   Conecta la app con el Calendario de Google del usuario
   (OAuth 2.0 + PKCE, sin backend ni secret):

     1. El usuario pega su Client ID de Google Cloud (una vez).
     2. "Conectar mi Google" → Google pide permiso (una vez).
     3. La app crea (si no existe) un calendario "APPI" y escribe
        los eventos con alarmas:
          🎂 cumpleaños en los próximos 60 días
          📅 garantías que vencen en los próximos 60 días
        Los avisos los manda el propio Google Calendar (celu,
        compu, reloj, en todos lados).
     4. Cada vez que cambia la base de usuarios se resincroniza
        (borra lo que ya no aplica, crea lo nuevo, adopta los
        eventos existentes para no duplicar).

   Todo el estado queda en el dispositivo (localStorage), como
   el resto de los datos de la app.
   ============================================================ */
(function () {
  'use strict';
  var LS = 'appi_google_v1';
  var LS_PENDING = 'appi_google_pending_v1';
  var API = 'https://www.googleapis.com/calendar/v3';
  var TOKEN_URL = 'https://oauth2.googleapis.com/token';
  var AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
  var SCOPE = 'https://www.googleapis.com/auth/calendar';
  var SYNC_DAYS = 60;
  var THROTTLE_LOAD = 6 * 60 * 60 * 1000;   // al abrir la app: máx. 1 sync cada 6 h
  var THROTTLE_DATA = 10 * 60 * 1000;       // al cambiar la base: máx. 1 sync cada 10 min

  function pad(n) { return String(n).padStart(2, '0'); }
  function isoDate(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function sumDay(iso, days) {
    var p = iso.split('-');
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    d.setDate(d.getDate() + (days || 1));
    return isoDate(d);
  }
  function load() {
    try { return JSON.parse(localStorage.getItem(LS) || 'null') || null; } catch (e) { return null; }
  }
  function save(st) { try { localStorage.setItem(LS, JSON.stringify(st)); } catch (e) {} }
  function redirectUri() { try { return new URL('./', document.baseURI).href; } catch (e) { return document.baseURI; } }
  function b64url(buf) {
    var bytes = new Uint8Array(buf);
    var s = '';
    for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  async function generarPKCE() {
    var arr = new Uint8Array(64);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(arr);
    else for (var i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    var verifier = '';
    for (var j = 0; j < arr.length; j++) verifier += chars[arr[j] % chars.length];
    var challenge = '';
    try {
      challenge = b64url(await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
    } catch (e) { challenge = verifier.slice(0, 43); }
    return { verifier: verifier, challenge: challenge };
  }

  /* ---------------- Conectar (OAuth + PKCE, redirección total) ------- */
  function iniciarConexion() {
    var st = load();
    if (!st || !st.clientId) return 'sin_client_id';
    generarPKCE().then(function (pkce) {
      var state = Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
      try { localStorage.setItem(LS_PENDING, JSON.stringify({ state: state, verifier: pkce.verifier })); } catch (e) {}
      var p = new URLSearchParams({
        client_id: st.clientId,
        redirect_uri: redirectUri(),
        response_type: 'code',
        scope: SCOPE,
        code_challenge: pkce.challenge,
        code_challenge_method: 'S256',
        state: state,
        access_type: 'offline',
        prompt: 'consent'
      });
      window.location.href = AUTH_URL + '?' + p.toString();
    });
    return 'redirigiendo';
  }

  function guardarClientId(id) {
    var st = load() || {};
    st.clientId = String(id || '').trim();
    save(st);
  }

  function desconectar() {
    var st = load() || {};
    st.connected = false;
    st.access_token = '';
    st.refresh_token = '';
    st.expires_at = 0;
    st.calendar_id = '';
    st.events = [];
    save(st);
  }

  /* Al volver de Google llega ?code=...&state=... (o ?error=...) */
  function procesarRedireccion() {
    var q = new URLSearchParams(location.search);
    var code = q.get('code'), err = q.get('error'), state = q.get('state');
    if (!code && !err) return;
    try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) {}
    var st = load() || {};
    if (err) { st.connected = false; save(st); return 'error:' + err; }
    var pend = null;
    try { pend = JSON.parse(localStorage.getItem(LS_PENDING) || 'null'); } catch (e) {}
    try { localStorage.removeItem(LS_PENDING); } catch (e) {}
    if (!pend || !state || pend.state !== state) { st.connected = false; save(st); return 'state_mismatch'; }
    var body = new URLSearchParams({
      code: code,
      client_id: st.clientId,
      code_verifier: pend.verifier,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri()
    });
    return fetch(TOKEN_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j.access_token) throw new Error((j && (j.error_description || j.error)) || 'token');
        st.access_token = j.access_token;
        if (j.refresh_token) st.refresh_token = j.refresh_token;
        st.expires_at = Date.now() + (j.expires_in || 3600) * 1000;
        st.connected = true;
        st.events = [];
        save(st);
        return 'ok';
      })
      .catch(function (e) { st.connected = false; save(st); return 'error:' + (e && e.message); });
  }

  /* ---------------- Token (con refresh automático) ------------------- */
  async function tokenVivo() {
    var st = load();
    if (!st || !st.connected) return null;
    if (st.access_token && st.expires_at > Date.now() + 60000) return st.access_token;
    if (!st.refresh_token) { st.connected = false; save(st); return null; }
    var body = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: st.refresh_token, client_id: st.clientId });
    var r = await fetch(TOKEN_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
    var j = null; try { j = await r.json(); } catch (e) {}
    if (!j || !j.access_token) { st.connected = false; save(st); return null; }
    st.access_token = j.access_token;
    if (j.refresh_token) st.refresh_token = j.refresh_token;
    st.expires_at = Date.now() + (j.expires_in || 3600) * 1000;
    save(st);
    return st.access_token;
  }

  async function api(token, method, path, bodyObj) {
    var r = await fetch(API + path, {
      method: method,
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: bodyObj ? JSON.stringify(bodyObj) : undefined
    });
    var j = null; try { j = await r.json(); } catch (e) {}
    if (!r.ok) {
      var e2 = new Error((j && j.error && j.error.message) || ('HTTP ' + r.status));
      e2.status = r.status;
      e2.reason = j && j.error && j.error.errors && j.error.errors[0] && j.error.errors[0].reason;
      throw e2;
    }
    return j;
  }

  async function calendarioAPPI(token) {
    var list = await api(token, 'GET', '/users/me/calendarList');
    var cal = (list.items || []).find(function (c) { return String(c.summary || '').toLowerCase() === 'appi'; });
    if (cal) return cal.id;
    var created = await api(token, 'POST', '/calendars', {
      summary: 'APPI',
      description: 'Eventos de APPI: cumpleaños y garantías por vencer. Se actualiza sola.'
    });
    return created.id;
  }

  /* ---------------- Qué eventos debe tener el calendario ------------- */
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
    try { if (typeof window.nombreDePila === 'function') { var n = window.nombreDePila(u.usuario); if (n) return n; } } catch (e) {}
    return String(u.usuario || '').split(',')[0].trim();
  }

  function eventosDeseados() {
    var out = [];
    var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    var max = new Date(hoy); max.setDate(max.getDate() + SYNC_DAYS);
    var lista = Array.isArray(window.usuariosU) ? window.usuariosU : [];
    lista.forEach(function (u) {
      var nombre = nombreDe(u);
      if (!nombre) return;
      // Cumpleaños: próxima ocurrencia dentro de la ventana
      var dm = dmCumple(u);
      if (dm) {
        var f = new Date(hoy.getFullYear(), dm.m - 1, dm.d);
        if (f < hoy) f.setFullYear(f.getFullYear() + 1);
        if (f <= max) {
          out.push({
            key: 'cumple:' + u.id + ':' + pad(dm.d) + '-' + pad(dm.m),
            tipo: 'cumple',
            fecha: isoDate(f),
            titulo: '🎂 ' + nombre,
            detalle: 'Cumpleaños · creado por APPI'
          });
        }
      }
      // Garantía por vencer dentro de la ventana
      var fv = u.fVence ? (u.fVence instanceof Date ? u.fVence : new Date(u.fVence)) : null;
      if (fv && !isNaN(fv.getTime())) {
        var d0 = new Date(fv); d0.setHours(0, 0, 0, 0);
        if (d0 >= hoy && d0 <= max) {
          out.push({
            key: 'vence:' + u.id + ':' + isoDate(d0),
            tipo: 'vence',
            fecha: isoDate(d0),
            titulo: '📅 Vence: ' + nombre + (u.producto ? ' (' + u.producto + ')' : ''),
            detalle: 'Garantía por vencer · creado por APPI'
          });
        }
      }
    });
    return out;
  }

  /* ---------------- Sincronización idempotente ----------------------- */
  var syncEnCurso = null;
  async function sincronizar() {
    if (syncEnCurso) return syncEnCurso;
    syncEnCurso = (async () => {
      try {
        var token = await tokenVivo();
        if (!token) return { ok: false, err: 'no_token' };
        var st = load() || {};
        // Calendario APPI (revalidar si cambió de nombre/eliminaron)
        try {
          st.calendar_id = await calendarioAPPI(token);
        } catch (e) {
          if (e.status !== 404) return { ok: false, err: e.message };
          st.calendar_id = await calendarioAPPI(token);
        }
        var calId = st.calendar_id;
        var prev = (st.events || []).slice();
        var nuevos = eventosDeseados();
        // Lo que ya no aplica: se borra
        var porBorrar = prev.filter(function (p) { return !nuevos.some(function (n) { return n.key === p.key; }); });
        for (var i = 0; i < porBorrar.length; i++) {
          try { await api(token, 'DELETE', '/calendars/' + encodeURIComponent(calId) + '/events/' + encodeURIComponent(porBorrar[i].id)); } catch (e) {}
        }
        // Adoptar eventos existentes (misma fecha y título) para no duplicar
        var adoptar = nuevos.filter(function (n) { return !prev.some(function (p) { return p.key === n.key; }); });
        var porFecha = {};
        try {
          var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
          var max2 = new Date(hoy); max2.setDate(max2.getDate() + SYNC_DAYS + 2);
          var existentes = await api(token, 'GET', '/calendars/' + encodeURIComponent(calId) + '/events?timeMin=' + hoy.toISOString() + '&timeMax=' + max2.toISOString() + '&singleEvents=true');
          (existentes.items || []).forEach(function (ev) {
            var s = ev.start && ev.start.date;
            if (!s) return;
            porFecha[s + '|' + String(ev.summary || '').trim()] = ev.id;
          });
        } catch (e) { /* sin adopción: se crean de todos modos */ }
        var eventos = [];
        for (var k = 0; k < adoptar.length; k++) {
          var n = adoptar[k];
          var idExistente = porFecha[n.fecha + '|' + n.titulo.trim()];
          if (idExistente) { eventos.push({ id: idExistente, key: n.key, tipo: n.tipo }); continue; }
          var body = {
            start: { date: n.fecha },
            end: { date: sumDay(n.fecha) },
            summary: n.titulo.slice(0, 150),
            description: n.detalle,
            reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 1440 }] }
          };
          var resp = await api(token, 'POST', '/calendars/' + encodeURIComponent(calId) + '/events', body);
          eventos.push({ id: resp.id, key: n.key, tipo: n.tipo });
        }
        st.events = prev.filter(function (p) { return !porBorrar.some(function (b) { return b.id === p.id; }); }).concat(eventos);
        st.last_sync = Date.now();
        save(st);
        return { ok: true, total: st.events.length, creados: adoptar.length, borrados: porBorrar.length };
      } catch (e) {
        return { ok: false, err: (e && e.message) || String(e) };
      } finally {
        syncEnCurso = null;
      }
    })();
    return syncEnCurso;
  }

  function estado() {
    var st = load() || {};
    var res = { connected: !!st.connected, clientId: st.clientId || '', last_sync: st.last_sync || 0, total: (st.events || []).length, calendar_id: st.calendar_id || '' };
    if (res.last_sync && Date.now() - res.last_sync > 30 * 24 * 3600 * 1000) res.expired = true;
    return res;
  }

  /* ---------------- UI (sección Calendario de Google) ---------------- */
  function renderGoogle() {
    var box = document.getElementById('recGoogle');
    if (!box) return;
    var es = estado();
    var html = '';
    if (!es.clientId) {
      html +=
        '<div style="font-size:11.5px;color:#777887;font-weight:600;line-height:1.5;margin-bottom:8px">Pegá el <b>Client ID</b> de tu proyecto de Google Cloud (lo creás una sola vez en console.cloud.google.com: activar "Google Calendar API", credencial OAuth tipo "Aplicación web" con origen somospopups.github.io).</div>' +
        '<div style="display:flex;gap:8px">' +
          '<input type="text" id="recGoogleClientId" placeholder="xxxx.apps.googleusercontent.com" style="flex:1;min-width:0;padding:9px 11px;border-radius:11px;border:1px solid rgba(80,90,130,0.18);background:#fff;color:#292938;font:inherit;font-size:12px;outline:none">' +
          '<button type="button" id="recGoogleSave" style="padding:9px 14px;border-radius:11px;border:1px solid rgba(80,90,130,0.2);background:#0b5878;color:#fff;font:inherit;font-size:11.5px;font-weight:800;cursor:pointer">Guardar</button>' +
        '</div>';
    } else if (!es.connected) {
      html +=
        '<div style="font-size:11.5px;color:#777887;font-weight:600;line-height:1.5;margin-bottom:8px">Conectá tu cuenta de Google y la app creará el calendario <b>APPI</b> con los cumpleaños y las garantías por vencer (con sus avisos).</div>' +
        '<button type="button" id="recGoogleConnect" style="width:100%;padding:11px;border-radius:12px;border:0;background:linear-gradient(135deg,#0b5878,#3ad0a4);color:#fff;font:inherit;font-size:13px;font-weight:800;cursor:pointer"> Conectar mi Google</button>' +
        '<div style="text-align:right;margin-top:6px"><button type="button" id="recGoogleQuitar" style="background:none;border:0;color:#777887;font:inherit;font-size:10.5px;font-weight:700;cursor:pointer">Quitar Client ID</button></div>';
    } else {
      var fecha = es.last_sync ? new Date(es.last_sync).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
      html +=
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">' +
          '<span style="width:9px;height:9px;border-radius:50%;background:#34c759;flex:none"></span>' +
          '<span style="font-size:12.5px;font-weight:800;color:#1b7a3d">Conectado · calendario APPI</span>' +
        '</div>' +
        '<div style="font-size:11px;color:#777887;font-weight:600;margin-bottom:8px">' + es.total + ' evento' + (es.total === 1 ? '' : 's') + ' programado' + (es.total === 1 ? '' : 's') + ' · última sync ' + fecha + '</div>' +
        '<div style="display:flex;gap:8px">' +
          '<button type="button" id="recGoogleSync" style="flex:1;padding:10px;border-radius:11px;border:0;background:#0b5878;color:#fff;font:inherit;font-size:12px;font-weight:800;cursor:pointer">↻ Sincronizar ahora</button>' +
          '<button type="button" id="recGoogleDesconectar" style="padding:10px 14px;border-radius:11px;border:1px solid rgba(217,83,79,0.35);background:none;color:#d9534f;font:inherit;font-size:12px;font-weight:800;cursor:pointer">Desconectar</button>' +
        '</div>';
    }
    box.innerHTML = html;

    var inp = document.getElementById('recGoogleClientId');
    var btnSave = document.getElementById('recGoogleSave');
    if (inp && btnSave) btnSave.onclick = function () {
      var v = inp.value.trim();
      if (!v) { try { if (window.APPIDialog) window.APPIDialog.alert('Pegá el Client ID primero.', { title: 'Google Calendar', icon: '📅' }); } catch (e) {} return; }
      guardarClientId(v);
      renderGoogle();
    };
    var btnConnect = document.getElementById('recGoogleConnect');
    if (btnConnect) btnConnect.onclick = function () {
      btnConnect.disabled = true;
      btnConnect.textContent = 'Abriendo Google…';
      iniciarConexion();
    };
    var btnQuitar = document.getElementById('recGoogleQuitar');
    if (btnQuitar) btnQuitar.onclick = function () {
      guardarClientId('');
      renderGoogle();
    };
    var btnSync = document.getElementById('recGoogleSync');
    if (btnSync) btnSync.onclick = async function () {
      btnSync.disabled = true;
      btnSync.textContent = 'Sincronizando…';
      var r = await sincronizar();
      btnSync.disabled = false;
      btnSync.textContent = '↻ Sincronizar ahora';
      renderGoogle();
      try {
        if (window.showToast) {
          if (r && r.ok) window.showToast('📅 Calendario APPI actualizado (' + r.total + ' eventos)', 2600);
          else window.showToast('No se pudo sincronizar: ' + ((r && r.err) || 'error'), 3500);
        }
      } catch (e) {}
    };
    var btnDes = document.getElementById('recGoogleDesconectar');
    if (btnDes) btnDes.onclick = async function () {
      var ok = true;
      try { ok = await window.APPIDialog.confirm('Se cortará el vínculo con Google (los eventos creados quedan en el calendario).', { title: 'Desconectar Google', icon: '📅', okText: 'Desconectar', danger: true }); } catch (e) {}
      if (!ok) return;
      desconectar();
      renderGoogle();
    };
  }

  /* ---------------- Arranque y hooks ---------------------------------- */
  function arrancar() {
    try {
      var redir = procesarRedireccion();
      if (redir === 'ok' || typeof redir === 'string' && redir.indexOf('error') === 0) {
        setTimeout(renderGoogle, 400);
      }
    } catch (e) {}
    // Sync al abrir la app (si ya estaba conectado), con tope de 6 h.
    setTimeout(function () {
      try {
        var es = estado();
        if (es.connected && (!es.last_sync || Date.now() - es.last_sync > THROTTLE_LOAD)) sincronizar();
      } catch (e) {}
    }, 2500);
    // Cuando cambia la base de usuarios (sync PSA, planilla nueva…), repasar.
    try {
      window.addEventListener('appi-usuarios-cambiaron', function () {
        setTimeout(function () {
          try {
            var es = estado();
            if (es.connected && (!es.last_sync || Date.now() - es.last_sync > THROTTLE_DATA)) sincronizar();
          } catch (e) {}
        }, 1500);
      });
    } catch (e) {}
    // Pintar la sección cuando se abre la vista (mismo patrón que recordatorios).
    if (!window.__recGoogleShowWrapped && typeof window.showView === 'function') {
      window.__recGoogleShowWrapped = true;
      var origSV = window.showView;
      window.showView = function (id, opts) {
        var r = origSV.apply(this, arguments);
        try { if (id === 'view-recordatorios') setTimeout(renderGoogle, 60); } catch (e) {}
        return r;
      };
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar);
  else arrancar();
  setTimeout(function () { try { if (!window.__recGoogleShowWrapped) arrancar(); } catch (e) {} }, 2200);

  window.APPIGoogle = {
    iniciarConexion: iniciarConexion,
    procesarRedireccion: procesarRedireccion,
    sincronizar: sincronizar,
    estado: estado,
    guardarClientId: guardarClientId,
    desconectar: desconectar,
    render: renderGoogle,
    eventosDeseados: eventosDeseados
  };
})();
