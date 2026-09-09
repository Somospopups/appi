/* ============================================================
   APPI · v544 · Avisos por Telegram
   ------------------------------------------------------------
   Vincula el chat de Telegram del distribuidor para que el
   resumen diario (8:00) y los avisos de presentación lleguen
   como mensaje, aunque APPI esté cerrada o sin instalar.
   Patrón: la app pide un código (edge function telegram-canal),
   abre t.me/<bot>?start=CODIGO y el bot confirma el vínculo.
   ============================================================ */
(function () {
  'use strict';

  var OVERLAY = 'avisoTgOv';
  var CSS = 'avisoTgCss';
  var POLL_MS = 2500;
  var estadoActual = '';
  var timer = null;

  function config() {
    try {
      return (window.APPIAuth && window.APPIAuth.config) ? window.APPIAuth.config() : (window.APPI_AUTH || {});
    } catch (e) { return window.APPI_AUTH || {}; }
  }
  function token() {
    try { return (window.APPIAuth && window.APPIAuth.accessToken) ? window.APPIAuth.accessToken() : ''; } catch (e) { return ''; }
  }
  function tipoPersona() {
    try {
      var p = (window.APPIAuth && window.APPIAuth.activePerson) ? window.APPIAuth.activePerson() : null;
      return p && p.tipo === 'socio' ? 'socio' : 'titular';
    } catch (e) { return 'titular'; }
  }
  function urlFuncion() {
    return String(config().url || '').replace(/\/$/, '') + '/functions/v1/telegram-canal';
  }
  function llamar(accion) {
    return fetch(urlFuncion(), {
      method: 'POST',
      cache: 'no-store',
      headers: {
        apikey: String(config().anonKey || ''),
        Authorization: 'Bearer ' + token(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ accion: accion, persona_tipo: tipoPersona() })
    }).then(function (r) { return r.json().catch(function () { return {}; }); });
  }
  function toast(msg) {
    try { if (typeof showToast === 'function') showToast(msg, 2800); } catch (e) {}
  }
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ---------- estilos ----------
  function estilos() {
    if (document.getElementById(CSS)) return;
    var s = document.createElement('style');
    s.id = CSS;
    s.textContent =
      '#avisoTgOv{position:fixed;inset:0;z-index:40200;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(15,18,34,.55);backdrop-filter:blur(8px)}' +
      '#avisoTgOv[hidden]{display:none!important}' +
      '.aviso-tg-card{width:min(100%,430px);max-height:min(92vh,760px);overflow:auto;border-radius:24px;background:linear-gradient(160deg,#f4f8ff,#ffffff 55%,#eef9f6);color:#26263a;font:15px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:20px;box-shadow:0 26px 80px rgba(10,14,40,.4)}' +
      '.aviso-tg-head{display:flex;align-items:flex-start;gap:12px;margin-bottom:14px}' +
      '.aviso-tg-head .ico{width:46px;height:46px;flex:0 0 46px;border-radius:15px;display:grid;place-items:center;font-size:24px;background:linear-gradient(135deg,#2aabee,#5b8def);box-shadow:0 8px 18px rgba(42,120,220,.3)}' +
      '.aviso-tg-head h2{margin:2px 0 0;font-size:19px;line-height:1.2}' +
      '.aviso-tg-head p{margin:4px 0 0;color:#667;font-size:12.5px}' +
      '.aviso-tg-x{margin-left:auto;width:34px;height:34px;flex:0 0 34px;border:0;border-radius:11px;background:rgba(70,80,120,.08);color:#556;font-size:18px;cursor:pointer}' +
      '.aviso-tg-box{border-radius:16px;padding:14px;background:#fff;border:1px solid rgba(30,60,120,.1)}' +
      '.aviso-tg-hero{border-radius:16px;padding:16px;margin-bottom:12px;color:#fff;background:linear-gradient(135deg,#2aabee,#7a5bf0)}' +
      '.aviso-tg-hero b{font-size:16px;display:block;margin-bottom:4px}' +
      '.aviso-tg-hero p{margin:0;opacity:.94;font-size:13px;line-height:1.5}' +
      '.aviso-tg-hero ul{margin:8px 0 0;padding-left:18px;font-size:13px;opacity:.96}' +
      '.aviso-tg-btn{display:block;width:100%;min-height:50px;margin:12px 0 0;border:0;border-radius:15px;font:inherit;font-size:15px;font-weight:800;cursor:pointer}' +
      '.aviso-tg-btn.primary{color:#fff;background:linear-gradient(135deg,#2aabee,#5b8def);box-shadow:0 10px 22px rgba(42,140,220,.3)}' +
      '.aviso-tg-btn.ghost{color:#3d5fc0;background:rgba(80,110,220,.09)}' +
      '.aviso-tg-btn.danger{color:#c2454e;background:rgba(220,80,90,.09)}' +
      '.aviso-tg-btn:disabled{opacity:.55;cursor:default}' +
      '.aviso-tg-ok{display:flex;gap:12px;align-items:flex-start;border-radius:16px;padding:14px;background:#e9f9ef;border:1px solid #b7e7c9}' +
      '.aviso-tg-ok .chk{width:38px;height:38px;flex:0 0 38px;border-radius:50%;display:grid;place-items:center;background:#22b06a;color:#fff;font-size:20px}' +
      '.aviso-tg-ok b{display:block;margin-bottom:2px;color:#14693e}' +
      '.aviso-tg-ok p{margin:0;color:#3c6c50;font-size:12.5px}' +
      '.aviso-tg-qr{display:flex;justify-content:center;padding:6px 0 2px}' +
      '.aviso-tg-qr img,.aviso-tg-qr svg{width:196px;height:196px;border-radius:14px;background:#fff;padding:8px;box-shadow:0 6px 18px rgba(20,40,90,.12);border:1px solid #e6ecf5}' +
      '.aviso-tg-cod{text-align:center;margin:10px 0 2px;color:#889;font-size:11.5px;letter-spacing:.3px}' +
      '.aviso-tg-cod b{display:block;color:#2a5cae;font-size:27px;letter-spacing:9px;font-variant-numeric:tabular-nums;margin-top:2px}' +
      '.aviso-tg-note{color:#7a7b8a;font-size:12px;margin-top:10px;text-align:center}' +
      '.aviso-tg-carga{padding:34px 10px;text-align:center;color:#5a6b8a}' +
      '.aviso-tg-err{border-radius:14px;padding:12px;margin-top:10px;background:#fdeceb;border:1px solid #f3c6c2;color:#9c3a3a;font-size:13px}';
    document.head.appendChild(s);
  }

  // ---------- diálogo ----------
  function ov() { return document.getElementById(OVERLAY); }
  function abrir() {
    estilos();
    var d = ov();
    if (!d) {
      d = document.createElement('div');
      d.id = OVERLAY;
      d.setAttribute('role', 'dialog');
      d.setAttribute('aria-modal', 'true');
      d.addEventListener('click', function (e) { if (e.target === d) cerrar(); });
      document.body.appendChild(d);
    }
    d.hidden = false;
    document.body.classList.add('appi-overlay-abierto');
    renderCarga();
    refrescarEstado(true);
  }
  function cerrar() {
    if (timer) { clearInterval(timer); timer = null; }
    var d = ov();
    if (d) d.hidden = true;
    try { document.body.classList.remove('appi-overlay-abierto'); } catch (e) {}
  }

  function pintar(html) {
    var d = ov();
    if (d) d.innerHTML = '<div class="aviso-tg-card">' + html + '</div>';
  }
  function renderCarga() {
    pintar(
      '<div class="aviso-tg-head"><div class="ico">📲</div><div><h2>Avisos por Telegram</h2><p>Conectá tu chat y recibí tus tareas</p></div>' +
      '<button class="aviso-tg-x" onclick="window.__avisoTgCerrar()" aria-label="Cerrar">✕</button></div>' +
      '<div class="aviso-tg-carga">Consultando el estado…</div>'
    );
  }
  function renderError(msg) {
    pintar(
      '<div class="aviso-tg-head"><div class="ico">📲</div><div><h2>Avisos por Telegram</h2><p>Conectá tu chat y recibí tus tareas</p></div>' +
      '<button class="aviso-tg-x" onclick="window.__avisoTgCerrar()" aria-label="Cerrar">✕</button></div>' +
      '<div class="aviso-tg-err">' + esc(msg || 'No se pudo conectar. Probá de nuevo en unos minutos.') + '</div>' +
      '<button class="aviso-tg-btn ghost" onclick="window.__avisoTgAbrir()">Reintentar</button>'
    );
  }

  function qrImg(texto) {
    try {
      if (!window.qrcode) return '';
      var qr = window.qrcode(0, 'M');
      qr.addData(String(texto));
      qr.make();
      var url = qr.createDataURL(3, 1);
      return '<img src="' + url + '" alt="Código QR">';
    } catch (e) { return ''; }
  }

  function renderConectado(r) {
    var link = r.link || '';
    var chat = String(r.chat || '');
    var chatCorto = chat.length > 6 ? chat.slice(0, 3) + '…' + chat.slice(-3) : chat;
    pintar(
      '<div class="aviso-tg-head"><div class="ico">📲</div><div><h2>Avisos por Telegram</h2><p>Conectado para ' + esc(tipoPersona() === 'socio' ? 'el socio' : 'tu cuenta') + '</p></div>' +
      '<button class="aviso-tg-x" onclick="window.__avisoTgCerrar()" aria-label="Cerrar">✕</button></div>' +
      '<div class="aviso-tg-ok"><div class="chk">✓</div><div><b>Chat vinculado</b>' +
      '<p>Recibís el resumen de cada día a las 8:00 y los avisos de presentaciones. Si el mensaje no llega, abrí el chat y tocá <b>Iniciar</b> una vez.</p></div></div>' +
      (link ? '<a class="aviso-tg-btn primary" style="text-align:center;text-decoration:none;color:#fff" href="' + esc(link) + '" target="_blank" rel="noopener">Abrir chat de Telegram</a>' : '') +
      '<button class="aviso-tg-btn danger" onclick="window.__avisoTgDesvincular()">Desconectar este chat</button>' +
      '<div class="aviso-tg-note">Chat: ' + esc(chatCorto) + ' · Podés pausar con /pausa desde el propio chat</div>'
    );
  }

  function renderPendiente(r) {
    var url = String(r.url || '');
    var codigo = String(r.codigo || '');
    var qr = qrImg(url);
    pintar(
      '<div class="aviso-tg-head"><div class="ico">📲</div><div><h2>Casi listo</h2><p>Un paso más y quedás conectado</p></div>' +
      '<button class="aviso-tg-x" onclick="window.__avisoTgCerrar()" aria-label="Cerrar">✕</button></div>' +
      '<div class="aviso-tg-hero"><b>1 · Abrí Telegram</b><p>Con el botón de acá abajo (o escaneá el código con el celular).</p>' +
      '<b style="margin-top:8px;display:block">2 · Tocá «Iniciar»</b><p>Se vincula solo y te confirmamos acá.</p></div>' +
      (qr ? '<div class="aviso-tg-qr">' + qr + '</div>' : '') +
      '<div class="aviso-tg-cod">Si no abre el chat, usá este código en el bot<b>' + esc(codigo) + '</b></div>' +
      '<a class="aviso-tg-btn primary" style="text-align:center;text-decoration:none;color:#fff" href="' + esc(url) + '" target="_blank" rel="noopener">Abrir Telegram →</a>' +
      '<button class="aviso-tg-btn ghost" onclick="window.__avisoTgRefrescar()">Ya toqué «Iniciar» — verificar</button>' +
      '<div class="aviso-tg-note">El código vence a los ' + esc(r.vence || 15) + ' minutos. Esperamos tu toque…</div>'
    );
  }

  function renderDesconectado(r) {
    pintar(
      '<div class="aviso-tg-head"><div class="ico">📲</div><div><h2>Avisos por Telegram</h2><p>Las notificaciones de APPI, donde siempre llegan</p></div>' +
      '<button class="aviso-tg-x" onclick="window.__avisoTgCerrar()" aria-label="Cerrar">✕</button></div>' +
      '<div class="aviso-tg-hero"><b>📲 Tus tareas, en tu chat</b><p>Conectá tu Telegram y cada mañana a las 8:00 vas a recibir el resumen de tu día:</p>' +
      '<ul><li>seguimientos vencidos y de hoy</li><li>presentaciones agendadas</li><li>contactos nuevos</li></ul>' +
      '<p style="margin-top:8px">También llegan los avisos de presentaciones próximas. Sin instalar nada: tu WhatsApp y Telegram ya están siempre abiertos.</p></div>' +
      '<button class="aviso-tg-btn primary" onclick="window.__avisoTgConectar()">Conectar Telegram</button>' +
      '<div class="aviso-tg-note">Sin costo y sin permisos raros: solo se envía lo que APPI ya te muestra adentro.</div>'
    );
  }

  // ---------- estado y acciones ----------
  function refrescarEstado(automatico) {
    if (timer) { clearInterval(timer); timer = null; }
    llamar('estado').then(function (r) {
      if (r && r.estado) {
        estadoActual = r.estado;
        if (r.estado === 'conectado') {
          renderConectado(r);
          return;
        }
        if (r.estado === 'pendiente') {
          renderPendiente(r);
          timer = setInterval(function () { refrescarEstado(true); }, POLL_MS);
          return;
        }
        renderDesconectado(r);
        return;
      }
      if (automatico && !ov()) return;
      renderError(r && r.error ? r.error : 'No se pudo consultar el estado.');
    }).catch(function () {
      renderError('Sin conexión. Revisá internet y probá de nuevo.');
    });
  }

  function conectar() {
    var b = ov() && ov().querySelector('.aviso-tg-btn.primary');
    if (b) b.disabled = true;
    llamar('vincular').then(function (r) {
      if (r && r.estado === 'pendiente') {
        renderPendiente(r);
        if (timer) clearInterval(timer);
        timer = setInterval(function () { refrescarEstado(true); }, POLL_MS);
      } else if (r && r.estado === 'conectado') {
        renderConectado(r);
      } else {
        renderError(r && r.error ? r.error : 'Todavía no está habilitado. Probá más tarde.');
      }
    }).catch(function () {
      renderError('Sin conexión. Revisá internet y probá de nuevo.');
    });
  }

  function desvincular() {
    llamar('desvincular').then(function (r) {
      toast('Avisos por Telegram desactivados');
      refrescarEstado(false);
    }).catch(function () {
      renderError('Sin conexión. Revisá internet y probá de nuevo.');
    });
  }

  // ---------- API global ----------
  window.abrirAvisosTelegram = abrir;
  window.openAvisosTelegram = abrir; // onclick desde el menú de herramientas
  window.__avisoTgAbrir = abrir;
  window.__avisoTgCerrar = cerrar;
  window.__avisoTgRefrescar = function () { refrescarEstado(false); };
  window.__avisoTgConectar = conectar;
  window.__avisoTgDesvincular = desvincular;
})();
