/* ============================================================
   APPI · v550 · Avisos por Telegram
   ------------------------------------------------------------
   Vincula el chat de Telegram del distribuidor para que el
   resumen diario (8:00) y los avisos de presentación lleguen
   como mensaje, aunque APPI esté cerrada o sin instalar.

   Entrada: engranaje ⚙️ → «Avisos por Telegram».
   Apertura del chat sin reiniciar la app: mismo criterio que el
   WhatsApp de APPI (whatsapp-app.js). En Android la PWA
   instalada no resuelve un tg:// pelado — el botón navega un
   intent:// que nombra el paquete org.telegram.messenger y
   Chrome lanza la app dejando APPI intacta atrás. Si Telegram
   no está instalado, Chrome abre el respaldo t.me; fuera de
   Android el botón abre t.me en otra ventana. La ventana de
   APPI nunca navega.
   ============================================================ */
(function () {
  'use strict';

  var OVERLAY = 'avisoTgOv';
  var CSS = 'avisoTgCss';
  var POLL_MS = 2500;
  var BOT_FIJO = 'APPI_Avisos_bot';
  var timer = null;
  var urlActual = ''; // https://t.me/<bot>... vigente
  var botNombre = BOT_FIJO;
  var peticionSeq = 0; // descarta respuestas viejas (evita pisar la UI)


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
      '.aviso-tg-card{width:min(100%,400px);max-height:min(92vh,720px);overflow:auto;border-radius:24px;background:linear-gradient(160deg,#f4f8ff,#ffffff 55%,#eef9f6);color:#26263a;font:15px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:20px;box-shadow:0 26px 80px rgba(10,14,40,.4)}' +
      '.aviso-tg-head{display:flex;align-items:flex-start;gap:12px;margin-bottom:14px}' +
      '.aviso-tg-head .ico{width:44px;height:44px;flex:0 0 44px;border-radius:14px;display:grid;place-items:center;font-size:22px;background:linear-gradient(135deg,#2aabee,#5b8def);box-shadow:0 8px 18px rgba(42,120,220,.3)}' +
      '.aviso-tg-head h2{margin:1px 0 0;font-size:18px;line-height:1.25}' +
      '.aviso-tg-head p{margin:3px 0 0;color:#667;font-size:12.5px;line-height:1.4}' +
      '.aviso-tg-x{margin-left:auto;width:34px;height:34px;flex:0 0 34px;border:0;border-radius:11px;background:rgba(70,80,120,.08);color:#556;font-size:18px;cursor:pointer;line-height:1}' +
      '.aviso-tg-hero{border-radius:16px;padding:14px 16px;margin-bottom:12px;color:#fff;background:linear-gradient(135deg,#2aabee,#7a5bf0)}' +
      '.aviso-tg-hero b{display:block;font-size:15.5px;margin-bottom:3px}' +
      '.aviso-tg-hero p{margin:0;opacity:.95;font-size:13px;line-height:1.5}' +
      '.aviso-tg-btn{display:flex;align-items:center;justify-content:center;width:100%;min-height:50px;margin-top:10px;padding:12px 16px;border:0;border-radius:15px;font:inherit;font-size:15px;font-weight:800;cursor:pointer;text-align:center;text-decoration:none;box-sizing:border-box;line-height:1.35}' +
      '.aviso-tg-btn.primary{color:#fff;background:linear-gradient(135deg,#2aabee,#5b8def);box-shadow:0 10px 22px rgba(42,140,220,.3)}' +
      '.aviso-tg-btn.ghost{color:#3d5fc0;background:rgba(80,110,220,.09)}' +
      '.aviso-tg-btn.danger{color:#c2454e;background:rgba(220,80,90,.09)}' +
      '.aviso-tg-btn:disabled{opacity:.55;cursor:default}' +
      '.aviso-tg-ok{display:flex;gap:11px;align-items:flex-start;border-radius:16px;padding:14px;background:#e9f9ef;border:1px solid #b7e7c9}' +
      '.aviso-tg-ok .chk{width:36px;height:36px;flex:0 0 36px;border-radius:50%;display:grid;place-items:center;background:#22b06a;color:#fff;font-size:18px}' +
      '.aviso-tg-ok b{display:block;margin-bottom:2px;color:#14693e;font-size:14.5px}' +
      '.aviso-tg-ok p{margin:0;color:#3c6c50;font-size:12.5px;line-height:1.45}' +
      '.aviso-tg-note{color:#7a7b8a;font-size:12px;margin-top:12px;text-align:center;line-height:1.5}' +
      '.aviso-tg-cod{display:block;margin:10px auto 0;width:fit-content;max-width:100%;padding:7px 14px;border:1px dashed #9db8e8;border-radius:11px;background:#f2f6ff;color:#2a5cae;font-size:20px;font-weight:800;letter-spacing:4px;text-align:center;cursor:pointer;user-select:all}' +
      '.aviso-tg-carga{padding:34px 10px;text-align:center;color:#5a6b8a}' +
      '.aviso-tg-err{border-radius:14px;padding:12px;margin-top:10px;background:#fdeceb;border:1px solid #f3c6c2;color:#9c3a3a;font-size:13px;line-height:1.5}';
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
  function head() {
    return '<div class="aviso-tg-head"><div class="ico">📲</div><div><h2>Avisos por Telegram</h2><p>Tu resumen del día, a las 8:00</p></div>' +
      '<button class="aviso-tg-x" onclick="window.__avisoTgCerrar()" aria-label="Cerrar">✕</button></div>';
  }
  function renderCarga() {
    pintar(head() + '<div class="aviso-tg-carga">Consultando el estado…</div>');
  }
  function renderError(msg) {
    pintar(head() + '<div class="aviso-tg-err">' + esc(msg || 'No se pudo conectar. Probá de nuevo en unos minutos.') + '</div>' +
      '<button class="aviso-tg-btn ghost" onclick="window.__avisoTgAbrirOv()">Reintentar</button>');
  }

  // ---------- apertura (intent:// de Android, sin navegar la PWA) ----------
  // En la PWA instalada (Android) los enlaces t.me navegan la ventana y un
  // tg:// pelado no abre nada: el sistema lo recibe recién envuelto en un
  // intent:// con el paquete de Telegram (igual que whatsapp-app.js con
  // com.whatsapp). Chrome lanza la app y APPI queda intacta atrás; si la app
  // no está instalada, Chrome sigue el browser_fallback_url (t.me).
  function esAndroid() {
    return /android/i.test(navigator.userAgent || '');
  }
  function botDe(r) {
    var b = String((r && r.bot) || botNombre || BOT_FIJO).replace(/^@/, '').trim();
    return b || BOT_FIJO;
  }
  function urlDe(r) {
    var bot = botDe(r);
    var codigo = String((r && r.codigo) || '').trim();
    var dada = String((r && (r.url || r.link)) || '').trim();
    if (dada && /^https?:\/\/t(?:elegram)?\.me\//i.test(dada)) return dada;
    if (codigo) return 'https://t.me/' + bot + '?start=' + encodeURIComponent(codigo);
    return 'https://t.me/' + bot;
  }
  function parsearTme(url) {
    try {
      var u = new URL(String(url || ''));
      if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
      if (u.hostname !== 't.me' && u.hostname !== 'telegram.me') return null;
      var domain = decodeURIComponent(u.pathname.replace(/^\//, '').split('/')[0] || '');
      if (!domain) return null;
      var start = (u.searchParams && u.searchParams.get('start')) ? String(u.searchParams.get('start')) : '';
      return { tme: String(url), domain: domain, start: start };
    } catch (e) { return null; }
  }
  // Destino según plataforma: intent:// con el paquete (Android) o t.me.
  function destinoTelegram() {
    var p = parsearTme(urlActual);
    if (!p) return '';
    var params = 'domain=' + encodeURIComponent(p.domain) +
      (p.start ? '&start=' + encodeURIComponent(p.start) : '');
    if (esAndroid()) {
      return 'intent://resolve?' + params +
        '#Intent;scheme=tg;package=org.telegram.messenger;S.browser_fallback_url=' +
        encodeURIComponent(p.tme) + ';end';
    }
    return p.tme;
  }
  function abrirTelegram() {
    if (!urlActual) urlActual = 'https://t.me/' + (botNombre || BOT_FIJO);
    var destino = destinoTelegram();
    if (!destino) destino = urlActual;
    if (!destino) return;
    try {
      // Hook de navegación (lo usa el e2e; en producción no existe y se ignora).
      if (typeof window.__avisoTgNav === 'function') { window.__avisoTgNav(destino); return; }
    } catch (e) {}
    if (esAndroid()) {
      // Un intent:// no se abre en ventana nueva (quedaría en blanco): va en
      // la pestaña actual, como el WhatsApp de APPI. APPI nunca navega.
      try { window.location.href = destino; } catch (e) {}
      return;
    }
    try {
      var w = window.open(destino, '_blank', 'noopener,noreferrer');
      if (w) return;
    } catch (e) {}
    try { window.location.href = destino; } catch (e) {}
  }

  function copiarCodigo() {
    var d = ov();
    if (!d) return;
    var codigo = d.getAttribute('data-codigo') || '';
    if (!codigo) return;
    function ok() { toast('Código copiado: ' + codigo); }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(codigo).then(ok, function () { fallbackCopiar(codigo, ok); });
      } else fallbackCopiar(codigo, ok);
    } catch (e) { fallbackCopiar(codigo, ok); }
  }
  function fallbackCopiar(texto, ok) {
    try {
      var ta = document.createElement('textarea');
      ta.value = texto;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      ok();
    } catch (e) {}
  }

  // ---------- estados ----------
  function botonAbrir(texto) {
    return '<a class="aviso-tg-btn primary" href="' + esc(urlActual) + '" target="_blank" rel="noopener noreferrer" onclick="return window.__avisoTgClick(event)">' + esc(texto) + '</a>';
  }

  function renderConectado(r) {
    botNombre = botDe(r);
    urlActual = urlDe(r);
    pintar(head() +
      '<div class="aviso-tg-ok"><div class="chk">✓</div><div><b>Chat vinculado</b>' +
      '<p>Recibís el resumen de cada día a las 8:00 y los avisos de presentaciones en este chat.</p></div></div>' +
      botonAbrir('Abrir chat de Telegram') +
      '<a class="aviso-tg-btn ghost" href="' + esc(urlActual) + '" target="_blank" rel="noopener noreferrer">¿No abre? Abrir en el navegador</a>' +
      '<button class="aviso-tg-btn danger" onclick="window.__avisoTgDesvincular()">Desconectar este chat</button>' +
      '<div class="aviso-tg-note">Si algún día no te llega, abrí el chat y tocá «Iniciar» una vez.</div>'
    );
  }

  function renderPendiente(r) {
    botNombre = botDe(r);
    urlActual = urlDe(r);
    var bot = botNombre;
    var codigo = String(r.codigo || '');
    pintar(head() +
      '<div class="aviso-tg-hero"><b>Casi listo</b><p>Dos pasos y quedás conectado:</p>' +
      '<p><b>1.</b> Tocá «Abrir Telegram» y entrá al chat del bot.</p>' +
      '<p><b>2.</b> Tocá «Iniciar» y volvé acá.</p></div>' +
      botonAbrir('Abrir Telegram') +
      '<a class="aviso-tg-btn ghost" href="' + esc(urlActual) + '" target="_blank" rel="noopener noreferrer">¿No abre? Abrir en el navegador</a>' +
      '<button class="aviso-tg-btn ghost" onclick="window.__avisoTgRefrescar()">Ya toqué «Iniciar» — verificar</button>' +
      (codigo ? '<span class="aviso-tg-cod" onclick="window.__avisoTgCopiar()" title="Tocá para copiar">' + esc(codigo) + '</span>' : '') +
      '<div class="aviso-tg-note">' + (bot ? '¿No abre el chat? Tocá el código para copiarlo, entrá al bot @' + esc(bot.replace(/^@/, '')) + ' y pegalo ahí. ' : '') +
      'Vence en ' + esc(r.vence || 15) + ' minutos.</div>'
    );
    if (ov()) ov().setAttribute('data-codigo', codigo);
    if (timer) clearInterval(timer);
    timer = setInterval(function () { refrescarEstado(true); }, POLL_MS);
  }

  function renderDesconectado(r) {
    pintar(head() +
      '<div class="aviso-tg-hero"><b>Tu día, donde siempre lo ves</b>' +
      '<p>Cada mañana a las 8:00 recibís tu resumen de Mi Gestión: seguimientos vencidos, presentaciones y contactos nuevos. También avisos 30 minutos antes de cada presentación.</p>' +
      '<p style="margin-top:6px">Llega aunque APPI esté cerrada o sin instalar.</p></div>' +
      '<button class="aviso-tg-btn primary" onclick="window.__avisoTgConectar()">Conectar Telegram</button>' +
      '<div class="aviso-tg-note">Sin costo. Solo te avisamos por mensaje lo que APPI ya te muestra adentro.</div>'
    );
  }

  // ---------- estado y acciones ----------
  function refrescarEstado(automatico) {
    if (timer) { clearInterval(timer); timer = null; }
    var mi = ++peticionSeq;
    llamar('estado').then(function (r) {
        if (mi !== peticionSeq) return; // llegó una petición más nueva
      if (r && r.estado) {
        if (r.estado === 'conectado') { renderConectado(r); return; }
        if (r.estado === 'pendiente') { renderPendiente(r); return; }
        renderDesconectado(r);
        return;
      }
      if (automatico && ov() && ov().hidden) return;
      renderError(r && r.error ? r.error : 'No se pudo consultar el estado.');
    }).catch(function (e) {
        if (mi !== peticionSeq) return;
      if (automatico) return;
      renderError('Sin conexión. Revisá internet y probá de nuevo.');
    });
  }

  function conectar() {
    var mi = ++peticionSeq;
    llamar('vincular').then(function (r) {
        if (mi !== peticionSeq) return;
      if (r && r.estado === 'pendiente') { renderPendiente(r); return; }
      if (r && r.estado === 'conectado') { renderConectado(r); return; }
      renderError(r && r.error ? r.error : 'Todavía no está habilitado. Probá más tarde.');
    }).catch(function (e) {
        if (mi !== peticionSeq) return;
      renderError('Sin conexión. Revisá internet y probá de nuevo.');
    });
  }

  function desvincular() {
    var mi = ++peticionSeq;
    llamar('desvincular').then(function () {
      if (mi !== peticionSeq) return;
      toast('Avisos por Telegram desactivados');
      refrescarEstado(false);
    }).catch(function () {
      if (mi !== peticionSeq) return;
      renderError('Sin conexión. Revisá internet y probá de nuevo.');
    });
  }

  // ---------- API global ----------
  window.abrirAvisosTelegram = abrir;
  window.openAvisosTelegram = abrir;
  window.__avisoTgAbrirOv = abrir;
  window.__avisoTgCerrar = cerrar;
  window.__avisoTgCopiar = copiarCodigo;
  window.__avisoTgRefrescar = function () {
    if (timer) { clearInterval(timer); timer = null; }
    renderCarga();
    var mi = ++peticionSeq;
    llamar('estado').then(function (r) {
      if (mi !== peticionSeq) return;
      if (r && r.estado === 'conectado') {
        renderConectado(r);
        toast('Listo: Telegram quedó vinculado');
        return;
      }
      if (r && r.estado === 'pendiente' && r.codigo) {
        renderPendiente(r);
        toast('Todavía no. En Telegram tocá Iniciar o mandá el código ' + r.codigo);
        return;
      }
      if (r && r.error) { renderError(r.error); return; }
      conectar();
    }).catch(function () {
      if (mi !== peticionSeq) return;
      renderError('Sin conexión. Revisá internet y probá de nuevo.');
    });
  };
  window.__avisoTgAbrirTg = abrirTelegram;
  window.__avisoTgClick = function (e) {
    if (!esAndroid()) return true;
    try { if (e && e.preventDefault) e.preventDefault(); } catch (err) {}
    abrirTelegram();
    return false;
  };
  window.__avisoTgConectar = conectar;
  window.__avisoTgDesvincular = desvincular;
})();
