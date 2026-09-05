/* APPI · Lista de precios tienda PSA + presupuesto PDF */
(function () {
  'use strict';

  var LS = 'appi_lista_carrito_v1';
  var LS_FAB = 'appi_lista_fab_v1';
  var LS_PAGO = 'appi_lista_pago_v1';
  var LS_BOT = 'appi_lista_bot_v1';
  var CAT = null;
  var BOT_G = 44;
  var BOT_ANIOS = 450;
  var BOT_M2 = 0.018;
  var BOT_PETROLEO = 1.9;
  var VIDA = [
    { k: ['SENIOR4', 'SENIOR 4'], litros: 36000, meses: 36, kit: 1 },
    { k: ['S-1000', 'S·1000', 'S•1000'], litros: 80000, meses: 36, kit: 1 },
    { k: ['QUANTUM'], litros: 30000, meses: 36 },
    { k: ['IONTRIX'], litros: 40000, meses: 24 },
    { k: ['SENIK'], litros: 8000, meses: 18 },
    { k: ['VERO'], litros: 15000, meses: 18, kit: 1 },
    { k: ['MINI'], litros: 12000, meses: 12, kit: 1 },
    { k: ['RINNOVA', 'DUCHA'], litros: 150000, meses: 6 },
    { k: ['C3'], litros: 2000, meses: 6 },
    { k: ['SENIOR'], litros: 36000, meses: 36, kit: 1 },
    { k: ['STOPPER'], litros: 0, meses: 6 }
  ];
  var ENV_L = 1371;
  var ENV_G = 45;
  var ENV_ESC = [
    { l: 2, t: '2 litros diarios', s: 'hogar soltero' },
    { l: 4, t: '4 litros diarios', s: 'hogar con o sin bebé' },
    { l: 8, t: '8 litros diarios', s: 'hogar familia tipo' }
  ];
  var PLANES = { cuotas: [3, 6, 9, 12, 15, 18], bancos: [], vigencia: '' };
  var filtro = 'todos';
  var busca = '';
  var GRUPOS = [
    { id: 'todos', t: 'Todos' },
    { id: 'equipos', t: 'Equipos' },
    { id: 'recargas', t: 'Recargas' },
    { id: 'griferia', t: 'Grifería' },
    { id: 'botellas', t: 'Botellas' },
    { id: 'otros', t: 'Otros' }
  ];
  var GRUPO_TIT = { equipos: 'Equipos', recargas: 'Recargas y adaptadores', griferia: 'Grifería', botellas: 'Botellas y mates', otros: 'Otros' };

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(n) { return '$' + Math.round(Number(n) || 0).toLocaleString('es-AR'); }
  function sinMarca(s) {
    return String(s || '')
      .replace(/\bAPPI\b/gi, '')
      .replace(/\bPSA\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/\s+([·\-,])/g, '$1')
      .replace(/^[\s·\-—]+|[\s·\-—]+$/g, '')
      .trim();
  }

  function carrito() {
    try { return JSON.parse(localStorage.getItem(LS) || '{}') || {}; } catch (e) { return {}; }
  }
  function guardarCarrito(c) {
    try { localStorage.setItem(LS, JSON.stringify(c)); } catch (e) {}
  }
  function qty(sku) { return Math.max(0, Number(carrito()[sku]) || 0); }
  function setQty(sku, n) {
    var c = carrito();
    n = Math.max(0, Math.round(Number(n) || 0));
    if (n <= 0) delete c[sku];
    else c[sku] = n;
    guardarCarrito(c);
  }

  function productos() { return (CAT && CAT.productos) ? CAT.productos : []; }
  function porSku(sku) {
    var list = productos();
    for (var i = 0; i < list.length; i++) if (list[i].sku === sku) return list[i];
    return null;
  }
  function filtrados() {
    var q = busca.trim().toLowerCase();
    return productos().filter(function (p) {
      if (filtro !== 'todos' && p.grupo !== filtro) return false;
      if (!q) return true;
      return (p.nombre || '').toLowerCase().indexOf(q) >= 0 || String(p.sku).indexOf(q) >= 0;
    });
  }
  function resumen() {
    var c = carrito(), n = 0, tot = 0, lineas = [];
    Object.keys(c).forEach(function (sku) {
      var p = porSku(sku);
      var q = Number(c[sku]) || 0;
      if (!p || q <= 0) return;
      n += q;
      tot += q * (Number(p.precio) || 0);
      lineas.push({ p: p, q: q });
    });
    return { n: n, tot: tot, lineas: lineas };
  }

  function estilo() {
    var css = '' +
      '#view-lista{background:#f3eee3}' +
      '.lp-wrap{padding:10px 12px calc(env(safe-area-inset-bottom) + 168px)}' +
      '.lp-note{margin:0 0 10px;font-size:11px;font-weight:750;color:#686977;line-height:1.35}' +
      '.lp-search{width:100%;min-height:44px;border:1px solid rgba(196,164,92,.45);border-radius:14px;padding:10px 12px;font:inherit;font-size:14px;background:#faf6ee;color:#2a2a32;margin:0 0 10px}' +
      '.lp-chips{display:flex;gap:6px;overflow-x:auto;padding:0 0 10px;-webkit-overflow-scrolling:touch}' +
      '.lp-chip{flex:0 0 auto;border:0;border-radius:999px;padding:7px 12px;font:inherit;font-size:12px;font-weight:850;background:rgba(255,255,255,.7);color:#2a2a32;cursor:pointer}' +
      '.lp-chip.on{background:#0b5878;color:#fff}' +
      '.lp-sec{margin:12px 0 6px;font-size:11px;font-weight:900;color:#0b5878;letter-spacing:.4px;text-transform:uppercase}' +
      '.lp-item{display:flex;align-items:center;gap:10px;padding:10px 12px;margin:0 0 8px;border-radius:16px;background:rgba(255,255,255,.72);border:1px solid rgba(255,255,255,.8)}' +
      '.lp-item-txt{flex:1;min-width:0}' +
      '.lp-item-txt b{display:block;font-size:13px;font-weight:900;color:#2a2a32;line-height:1.25}' +
      '.lp-item-txt span{display:block;margin-top:2px;font-size:11px;font-weight:750;color:#686977}' +
      '.lp-item-txt em{display:block;margin-top:2px;font-size:13px;font-weight:950;color:#0b5878;font-style:normal}' +
      '.lp-qty{display:flex;align-items:center;gap:6px;flex-shrink:0}' +
      '.lp-qty button{width:32px;height:32px;border:0;border-radius:10px;background:#0b5878;color:#fff;font:inherit;font-size:18px;font-weight:900;line-height:1;cursor:pointer}' +
      '.lp-qty button.ghost{background:rgba(11,88,120,.12);color:#0b5878}' +
      '.lp-qty i{min-width:18px;text-align:center;font-style:normal;font-size:13px;font-weight:900;color:#2a2a32}' +
      '.lp-empty{padding:28px 8px;text-align:center;font-size:13px;font-weight:750;color:#686977}' +
      '.lp-fab{display:none;position:fixed;right:14px;bottom:calc(env(safe-area-inset-bottom) + 108px);z-index:55;align-items:center;gap:8px;border:0;border-radius:999px;padding:12px 16px;background:#0b5878;color:#fff;font:inherit;font-size:13px;font-weight:900;box-shadow:0 8px 24px rgba(11,88,120,.38);cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none}' +
      '.lp-fab.on{display:flex}' +
      '.lp-fab.arrastre{cursor:grabbing;opacity:.92}' +
      '.lp-fab i{min-width:22px;height:22px;padding:0 6px;border-radius:99px;background:#fff;color:#0b5878;font-style:normal;font-size:12px;font-weight:950;display:flex;align-items:center;justify-content:center;pointer-events:none}' +
      '.lp-fab span{pointer-events:none}' +
      '@media (min-width:1024px){.lp-fab{bottom:24px;right:28px}.lp-wrap{padding-bottom:88px}}' +
      '#lpSheet{display:none;position:fixed;inset:0;z-index:80;background:rgba(20,24,32,.45);align-items:flex-end}' +
      '#lpSheet.open{display:flex}' +
      '.lp-sheet{width:100%;max-height:86%;overflow:auto;background:#f3eee3;border-radius:22px 22px 0 0;padding:14px 14px calc(18px + env(safe-area-inset-bottom))}' +
      '.lp-sheet h2{margin:0;font-size:16px;font-weight:950;color:#2a2a32}' +
      '.lp-sheet-top{display:flex;align-items:center;justify-content:space-between;margin:0 0 10px}' +
      '.lp-sheet-top button{border:0;background:transparent;font-size:22px;line-height:1;color:#2a2a32;cursor:pointer}' +
      '.lp-para{width:100%;min-height:42px;border:1px solid rgba(196,164,92,.45);border-radius:12px;padding:8px 10px;font:inherit;font-size:14px;background:#faf6ee;margin:0 0 10px}' +
      '.lp-line{display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid rgba(42,42,50,.08)}' +
      '.lp-line b{flex:1;font-size:13px;font-weight:850;color:#2a2a32}' +
      '.lp-line span{font-size:12px;font-weight:900;color:#0b5878;white-space:nowrap}' +
      '.lp-tot{margin:12px 0;font-size:18px;font-weight:950;color:#0b5878}' +
      '.lp-eco{margin:8px 0 12px}' +
      '.lp-cmp-h{font-size:13px;font-weight:950;color:#0b5878;letter-spacing:.2px}' +
      '.lp-cmp-sub{margin:2px 0 8px;font-size:12px;font-weight:750;color:#2a2a32}' +
      '.lp-cmp-sub b{color:#0b5878}' +
      '.lp-cmp-litro{display:block;margin:0 0 8px;font-size:11px;font-weight:800;color:#686977}' +
      '.lp-cmp-litro input{width:110px;min-height:36px;margin-left:6px;border:1px solid rgba(196,164,92,.45);border-radius:10px;padding:6px 8px;font:inherit;font-size:14px;background:#faf6ee}' +
      '.lp-cmp-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}' +
      '.lp-cmp-tb{width:100%;border-collapse:collapse;font-size:11px;min-width:520px}' +
      '.lp-cmp-tb th{background:#0b5878;color:#fff;font-weight:850;padding:7px 6px;text-align:right}' +
      '.lp-cmp-tb th:first-child{text-align:left}' +
      '.lp-cmp-tb td{padding:7px 6px;border-bottom:1px solid rgba(42,42,50,.08);text-align:right;font-weight:800;color:#2a2a32;vertical-align:top}' +
      '.lp-cmp-tb td:first-child{text-align:left;font-weight:750}' +
      '.lp-cmp-tb td small{display:block;font-size:10px;font-weight:700;color:#686977}' +
      '.lp-cmp-eq td{background:rgba(11,88,120,.06)}' +
      '.lp-cmp-ag td{background:#eef3f6;text-align:left;font-weight:900;color:#0b5878;letter-spacing:.3px;text-transform:uppercase;font-size:10px}' +
      '.lp-aho{color:#e56a17!important;font-weight:950!important}' +
      '.lp-cmp-pl{margin-top:8px;min-width:0}' +
      '.lp-actions{display:flex;gap:8px}' +
      '.lp-actions button{flex:1;border:0;border-radius:12px;padding:12px;font:inherit;font-size:13px;font-weight:900;cursor:pointer}' +
      '.lp-actions .lp-pdf{background:#0b5878;color:#fff}' +
      '.lp-actions .lp-clear{background:rgba(42,42,50,.08);color:#2a2a32}' +
      'body.dark #view-lista,.dark .lp-sheet{background:#1c1e2a}' +
      'body.dark .lp-item{background:#25273a;border-color:rgba(255,255,255,.08)}' +
      'body.dark .lp-item-txt b,body.dark .lp-sheet h2,body.dark .lp-line b{color:#f2f2f7}' +
      'body.dark .lp-search,body.dark .lp-para{background:#25273a;color:#f2f2f7}';
    var s = $('lpStyle');
    if (!s) { s = document.createElement('style'); s.id = 'lpStyle'; document.head.appendChild(s); }
    s.textContent = css;
  }

  function crearVista() {
    var app = document.querySelector('.app') || document.body;
    if (!$('view-lista')) {
      var s = document.createElement('section');
      s.id = 'view-lista';
      s.className = 'view';
      s.innerHTML = '<header class="top"><button class="back-btn" onclick="history.back()" aria-label="Volver">‹</button><button class="tools-btn" onclick="toggleToolsMenu(event)" aria-label="Herramientas" title="Herramientas">⚙️</button><h1>Lista de precios</h1><div class="script">tienda PSA</div></header><div id="lpCont"></div><button type="button" class="lp-fab" id="lpFab" hidden aria-label="Ver presupuesto"></button>';
      app.appendChild(s);
    }
    if (!$('lpSheet')) {
      var sh = document.createElement('div');
      sh.id = 'lpSheet';
      sh.setAttribute('aria-hidden', 'true');
      sh.innerHTML = '<div class="lp-sheet" role="dialog" aria-label="Presupuesto">' +
        '<div class="lp-sheet-top"><h2>Presupuesto</h2><button type="button" data-cerrar aria-label="Cerrar">×</button></div>' +
        '<div id="lpSheetLines"></div>' +
        '<div class="lp-tot" id="lpSheetTot"></div>' +
        '<div class="lp-sec">Pago</div>' +
        '<div class="lp-chips" id="lpCuotas"></div>' +
        '<div class="lp-chips" id="lpBancos"></div>' +
        '<p class="lp-note" id="lpPagoDet"></p>' +
        '<div id="lpEco"></div>' +
        '<div class="lp-actions"><button type="button" class="lp-pdf" id="lpSheetPdf">PDF</button>' +
        '<button type="button" class="lp-clear" id="lpSheetClear">Vaciar</button></div></div>';
      document.body.appendChild(sh);
      sh.addEventListener('click', function (e) { if (e.target === sh) cerrarSheet(); });
      var x = sh.querySelector('[data-cerrar]');
      if (x) x.onclick = cerrarSheet;
    }
  }

  function htmlLista() {
    var fecha = (CAT && CAT.actualizado) ? CAT.actualizado : '';
    var chips = GRUPOS.map(function (g) {
      return '<button type="button" class="lp-chip' + (filtro === g.id ? ' on' : '') + '" data-g="' + g.id + '">' + esc(g.t) + '</button>';
    }).join('');
    return '<div class="lp-wrap">' +
      '<p class="lp-note">Lista de tienda.psa.com.ar' + (fecha ? ' · ' + esc(fecha) : '') + '. Armá el presupuesto y descargá el PDF.</p>' +
      '<input class="lp-search" id="lpSearch" type="search" placeholder="Buscar modelo, recarga o SKU" value="' + esc(busca) + '">' +
      '<div class="lp-chips" id="lpChips">' + chips + '</div>' +
      '<div id="lpList"></div></div>';
  }

  function pintarItems() {
    var host = $('lpList');
    if (!host) return;
    var list = filtrados();
    if (!list.length) {
      host.innerHTML = '<div class="lp-empty">Nada con esa búsqueda.</div>';
      return;
    }
    var html = '';
    var last = '';
    list.forEach(function (p) {
      if (filtro === 'todos' && p.grupo !== last) {
        last = p.grupo;
        html += '<div class="lp-sec">' + esc(GRUPO_TIT[p.grupo] || p.grupo) + '</div>';
      }
      var q = qty(p.sku);
      html += '<div class="lp-item" data-sku="' + esc(p.sku) + '">' +
        '<div class="lp-item-txt"><b>' + esc(p.nombre) + '</b><span>SKU ' + esc(p.sku) + '</span><em>' + money(p.precio) + '</em></div>' +
        '<div class="lp-qty">' +
          (q ? '<button type="button" class="ghost" data-act="menos" aria-label="Quitar">−</button><i>' + q + '</i>' : '') +
          '<button type="button" data-act="mas" aria-label="Agregar">+</button>' +
        '</div></div>';
    });
    host.innerHTML = html;
  }

  function fabGuardado() {
    try { return JSON.parse(localStorage.getItem(LS_FAB) || 'null'); } catch (e) { return null; }
  }
  function aplicarFabPos(fab) {
    var pos = fabGuardado();
    if (!pos || pos.x == null || pos.y == null) return;
    var w = fab.offsetWidth || 120;
    var h = fab.offsetHeight || 48;
    var x = Math.round(pos.x * (window.innerWidth - w));
    var y = Math.round(pos.y * (window.innerHeight - h));
    x = Math.max(8, Math.min(window.innerWidth - w - 8, x));
    y = Math.max(8, Math.min(window.innerHeight - h - 8, y));
    fab.style.left = x + 'px';
    fab.style.top = y + 'px';
    fab.style.right = 'auto';
    fab.style.bottom = 'auto';
  }
  function bindFab(fab) {
    if (!fab || fab._lpDrag) return;
    fab._lpDrag = true;
    var sx = 0, sy = 0, sl = 0, st = 0, moved = false, activo = false;
    function punto(e) {
      var t = (e.touches && e.touches[0]) || e;
      return { x: t.clientX, y: t.clientY };
    }
    function down(e) {
      var p = punto(e);
      var r = fab.getBoundingClientRect();
      sx = p.x; sy = p.y; sl = r.left; st = r.top; moved = false; activo = true;
      fab.classList.add('arrastre');
      try { fab.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
    }
    function move(e) {
      if (!activo) return;
      var p = punto(e);
      var dx = p.x - sx, dy = p.y - sy;
      if (!moved && (dx * dx + dy * dy) < 64) return;
      moved = true;
      var w = fab.offsetWidth, h = fab.offsetHeight;
      var x = Math.max(8, Math.min(window.innerWidth - w - 8, sl + dx));
      var y = Math.max(8, Math.min(window.innerHeight - h - 8, st + dy));
      fab.style.left = x + 'px';
      fab.style.top = y + 'px';
      fab.style.right = 'auto';
      fab.style.bottom = 'auto';
      e.preventDefault();
    }
    function up() {
      if (!activo) return;
      activo = false;
      fab.classList.remove('arrastre');
      if (!moved) { abrirSheet(); return; }
      var r = fab.getBoundingClientRect();
      var maxX = Math.max(1, window.innerWidth - r.width);
      var maxY = Math.max(1, window.innerHeight - r.height);
      try { localStorage.setItem(LS_FAB, JSON.stringify({ x: r.left / maxX, y: r.top / maxY })); } catch (err) {}
    }
    fab.addEventListener('pointerdown', down);
    fab.addEventListener('pointermove', move);
    fab.addEventListener('pointerup', up);
    fab.addEventListener('pointercancel', up);
  }

  function pintarFab() {
    var fab = $('lpFab');
    if (!fab) return;
    var r = resumen();
    if (!r.n) {
      fab.classList.remove('on');
      fab.hidden = true;
      return;
    }
    fab.hidden = false;
    fab.classList.add('on');
    fab.innerHTML = '<i>' + r.n + '</i><span>' + money(r.tot) + '</span>';
    bindFab(fab);
    aplicarFabPos(fab);
  }


  function pagoGet() {
    try { return JSON.parse(localStorage.getItem(LS_PAGO) || '{}') || {}; } catch (e) { return {}; }
  }
  function pagoSet(cuotas, banco) {
    try { localStorage.setItem(LS_PAGO, JSON.stringify({ cuotas: cuotas, banco: banco || '' })); } catch (e) {}
  }
  function pagoActual() {
    var g = pagoGet();
    var c = Number(g.cuotas) || 1;
    var banco = g.banco || '';
    var bancos = PLANES.bancos || [];
    var b = null;
    for (var i = 0; i < bancos.length; i++) if (bancos[i].id === banco) b = bancos[i];
    if (b && b.cuotas && b.cuotas.indexOf(c) < 0) b = null;
    return { cuotas: c, banco: b };
  }
  function pintarPago() {
    var hostC = $('lpCuotas'), hostB = $('lpBancos'), det = $('lpPagoDet');
    if (!hostC) return;
    var g = pagoGet();
    var cAct = Number(g.cuotas) || 1;
    var ops = [1].concat(PLANES.cuotas || [3, 6, 9, 12, 15, 18]);
    var seen = {};
    ops = ops.filter(function (n) { if (seen[n]) return false; seen[n] = 1; return true; });
    hostC.innerHTML = ops.map(function (n) {
      var lab = n === 1 ? 'Contado' : (n + ' cuotas');
      return '<button type="button" class="lp-chip' + (cAct === n ? ' on' : '') + '" data-cuotas="' + n + '">' + lab + '</button>';
    }).join('');
    var bancos = (PLANES.bancos || []).filter(function (b) {
      return cAct > 1 && (!b.cuotas || b.cuotas.indexOf(cAct) >= 0);
    });
    if (hostB) {
      hostB.style.display = bancos.length ? '' : 'none';
      hostB.innerHTML = bancos.map(function (b) {
        return '<button type="button" class="lp-chip' + (g.banco === b.id ? ' on' : '') + '" data-banco="' + b.id + '">' + esc(b.nombre) + '</button>';
      }).join('');
    }
    if (det) {
      var p = pagoActual();
      if (p.cuotas <= 1) det.textContent = 'Contado.';
      else {
        var tot = resumen().tot;
        var txt = p.cuotas + ' cuotas de ' + money(tot / p.cuotas);
        if (p.banco) txt += ' · ' + p.banco.nombre + (p.banco.tarjetas ? ' (' + p.banco.tarjetas + ')' : '');
        if (PLANES.vigencia) txt += ' · vigencia ' + PLANES.vigencia;
        det.textContent = txt;
      }
    }
    if (hostC && !hostC._lpBound) {
      hostC._lpBound = true;
      hostC.onclick = function (e) {
        var b = e.target.closest('[data-cuotas]');
        if (!b) return;
        var n = Number(b.getAttribute('data-cuotas')) || 1;
        var cur = pagoGet();
        pagoSet(n, n === 1 ? '' : (cur.banco || ''));
        pintarPago();
      };
    }
    if (hostB && !hostB._lpBound) {
      hostB._lpBound = true;
      hostB.onclick = function (e) {
        var b = e.target.closest('[data-banco]');
        if (!b) return;
        var id = b.getAttribute('data-banco') || '';
        var cur = pagoGet();
        pagoSet(cur.cuotas || 1, cur.banco === id ? '' : id);
        pintarPago();
      };
    }
  }


  function botGet() {
    try { return JSON.parse(localStorage.getItem(LS_BOT) || '{}') || {}; } catch (e) { return {}; }
  }
  function botSet(litro) {
    try { localStorage.setItem(LS_BOT, JSON.stringify({ litro: litro })); } catch (e) {}
  }
  function vidaDe(p) {
    var n = String((p && p.nombre) || '').toUpperCase();
    if (!n) return null;
    for (var i = 0; i < VIDA.length; i++) {
      for (var j = 0; j < VIDA[i].k.length; j++) {
        if (n.indexOf(VIDA[i].k[j]) >= 0) return VIDA[i];
      }
    }
    return null;
  }
  function botFmt(n, d) {
    return Number(n).toLocaleString('es-AR', { maximumFractionDigits: d || 0, minimumFractionDigits: 0 });
  }
  function money2(n) {
    return '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function celAnio(n) {
    return n > 0 ? money(n) : '—';
  }
  function costosAnios(precio, meses, qty) {
    var y = [0, 0, 0];
    var life = ((meses > 0 ? meses : 36) / 12);
    var t = 0, g = 0;
    while (t < 2.999 && g++ < 24) {
      y[Math.min(2, Math.floor(t))] += precio * qty;
      t += life;
    }
    return y;
  }
  function cmpCostos() {
    var r = resumen();
    var litroEnv = Math.max(1, Number(botGet().litro) || ENV_L);
    var yEq = [0, 0, 0];
    var litros3 = 0;
    var ref = null;
    r.lineas.forEach(function (ln) {
      var v = vidaDe(ln.p);
      var meses = v && v.meses ? v.meses : 0;
      var add = costosAnios(Number(ln.p.precio) || 0, meses, ln.q);
      yEq[0] += add[0]; yEq[1] += add[1]; yEq[2] += add[2];
      if (v && v.litros && v.meses) litros3 += ln.q * v.litros * (36 / v.meses);
      if (!ref && v && v.litros) ref = { p: ln.p, v: v };
    });
    var totEq = yEq[0] + yEq[1] + yEq[2];
    var litroEq = litros3 > 0 ? totEq / litros3 : 0;
    var kg3 = litros3 * ENV_G / 1000;
    var tit = 'Este presupuesto';
    if (ref) {
      tit = sinMarca(ref.p.nombre) || ref.p.nombre;
      if (ref.v.kit) tit += ' + Kit posventa';
    }
    var filas = ENV_ESC.map(function (esc) {
      var anual = esc.l * 365 * litroEnv;
      var tot = anual * 3;
      return { esc: esc, anual: anual, tot: tot, ahorro: Math.max(0, tot - totEq) };
    });
    return {
      litroEnv: litroEnv, yEq: yEq, totEq: totEq, litroEq: litroEq,
      kgY: kg3 / 3, kg3: kg3, tit: tit, filas: filas, litros3: litros3
    };
  }
  function pintarEco() {
    var host = $('lpEco');
    if (!host) return;
    var r = resumen();
    if (!r.n) { host.innerHTML = ''; return; }
    var c = cmpCostos();
    var filas = c.filas.map(function (f) {
      return '<tr><td><b>' + esc(f.esc.t) + '</b><small>' + esc(f.esc.s) + '</small></td>' +
        '<td>' + money(f.anual) + '</td><td>' + money(f.anual) + '</td><td>' + money(f.anual) + '</td>' +
        '<td>' + money(f.tot) + '</td><td class="lp-aho">' + money(f.ahorro) + '</td></tr>';
    }).join('');
    var plast = '';
    if (c.kg3 > 0) {
      plast = '<table class="lp-cmp-tb lp-cmp-pl"><thead><tr><th>Consumo de plástico</th><th>1er año</th><th>2do año</th><th>3er año</th><th>Ahorro ecológico</th></tr></thead><tbody>' +
        '<tr><td>Botellas de 1 L (' + ENV_G + ' g)</td><td>' + botFmt(c.kgY, 0) + ' kg</td><td>' + botFmt(c.kgY, 0) + ' kg</td><td>' + botFmt(c.kgY, 0) + ' kg</td>' +
        '<td class="lp-aho">' + botFmt(c.kg3, 0) + ' kg</td></tr></tbody></table>';
    }
    host.innerHTML =
      '<div class="lp-cmp-h">Comparativa de costos</div>' +
      '<p class="lp-cmp-sub"><b>' + esc(c.tit) + '</b> vs. agua envasada</p>' +
      '<label class="lp-cmp-litro">Litro de agua envasada $ <input id="lpLitroEnv" type="number" min="1" step="1" value="' + Math.round(c.litroEnv) + '"></label>' +
      '<div class="lp-cmp-scroll"><table class="lp-cmp-tb"><thead><tr><th></th><th>1er año</th><th>2do año</th><th>3er año</th><th>Gasto total</th><th>Ahorro</th></tr></thead><tbody>' +
        '<tr class="lp-cmp-eq"><td><b>' + esc(c.tit) + '</b>' + (c.litroEq ? '<small>Costo litro ' + money2(c.litroEq) + '</small>' : '') + '</td>' +
          '<td>' + celAnio(c.yEq[0]) + '</td><td>' + celAnio(c.yEq[1]) + '</td><td>' + celAnio(c.yEq[2]) + '</td>' +
          '<td>' + money(c.totEq) + '</td><td></td></tr>' +
        '<tr class="lp-cmp-ag"><td colspan="6">agua envasada</td></tr>' +
        filas +
      '</tbody></table></div>' + plast;
    var inp = $('lpLitroEnv');
    if (inp) inp.onchange = function () {
      botSet(Math.max(1, Number(inp.value) || ENV_L));
      pintarEco();
    };
  }

  function pintarSheet() {
    var host = $('lpSheetLines');
    var tot = $('lpSheetTot');
    if (!host) return;
    var r = resumen();
    if (!r.lineas.length) {
      host.innerHTML = '<div class="lp-empty">El carrito está vacío.</div>';
      if (tot) tot.textContent = '';
      return;
    }
    host.innerHTML = r.lineas.map(function (ln) {
      return '<div class="lp-line" data-sku="' + esc(ln.p.sku) + '">' +
        '<div class="lp-qty"><button type="button" class="ghost" data-act="menos">−</button><i>' + ln.q + '</i>' +
        '<button type="button" data-act="mas">+</button></div>' +
        '<b>' + esc(ln.p.nombre) + '</b><span>' + money(ln.q * ln.p.precio) + '</span></div>';
    }).join('');
    if (tot) tot.textContent = 'Total ' + money(r.tot);
    pintarPago();
    pintarEco();
  }

  function abrirSheet() {
    var sh = $('lpSheet');
    if (!sh) return;
    pintarSheet();
    sh.classList.add('open');
    sh.setAttribute('aria-hidden', 'false');
    var clr = $('lpSheetClear');
    if (clr) clr.onclick = function () {
      guardarCarrito({});
      cerrarSheet();
      pintarTodo();
    };
    var pdfBtn = $('lpSheetPdf');
    if (pdfBtn) pdfBtn.onclick = armarPdf;
  }
  function cerrarSheet() {
    var sh = $('lpSheet');
    if (!sh) return;
    sh.classList.remove('open');
    sh.setAttribute('aria-hidden', 'true');
  }

  function qrDataUrl(text) {
    try {
      var qr = window.qrcode(0, 'M');
      qr.addData(String(text || ''));
      qr.make();
      return qr.createDataURL(3, 1);
    } catch (e) { return ''; }
  }

  function aviso(msg) {
    if (typeof showToast === 'function') showToast(msg, 2600);
    else if (window.APPIDialog && window.APPIDialog.alert) window.APPIDialog.alert(msg, { title: 'Lista de precios' });
  }


  function loadFoto(p) {
    var src = p && p.foto ? String(p.foto) : '';
    if (!src) return Promise.resolve('');
    if (src.indexOf('./') !== 0 && src.indexOf('http') !== 0) src = './' + src;
    return fetch(src, { cache: 'force-cache' })
      .then(function (r) { return r.ok ? r.blob() : null; })
      .then(function (blob) {
        if (!blob) return '';
        return new Promise(function (res) {
          var fr = new FileReader();
          fr.onload = function () { res(fr.result); };
          fr.onerror = function () { res(''); };
          fr.readAsDataURL(blob);
        });
      })
      .catch(function () { return ''; });
  }

  function armarPdf() {
    var r = resumen();
    if (!r.n) return;
    var JsPDF = window.jspdf && window.jspdf.jsPDF;
    if (!JsPDF) { aviso('No se pudo cargar el PDF.'); return; }
    var pedir = (window.APPIDialog && window.APPIDialog.prompt)
      ? window.APPIDialog.prompt('¿A quién va dirigido el presupuesto?', '', { title: 'Presupuesto', placeholder: 'Nombre (opcional)', okText: 'Continuar', cancelText: 'Volver', icon: '✎' })
      : Promise.resolve('');
    pedir.then(function (para) {
    if (para === null) return;
    para = String(para || '').trim();
    var btn = $('lpSheetPdf');
    if (btn) { btn.disabled = true; btn.textContent = 'Armando…'; }
    Promise.all(r.lineas.map(function (ln) { return loadFoto(ln.p); })).then(function (fotos) {
    try {
      var pdf = new JsPDF({ unit: 'mm', format: 'a4', compress: true });
      var W = pdf.internal.pageSize.getWidth();
      var H = pdf.internal.pageSize.getHeight();
      var azul = [11, 88, 120];
      var crema = [243, 238, 227];
      var oscuro = [42, 42, 50];
      var gris = [104, 105, 119];
      var fecha = (CAT && CAT.actualizado) ? CAT.actualizado : '';
      var hoy = fecha;
      var m = 16;

      function encabezado(subtitulo) {
        pdf.setFillColor.apply(pdf, azul);
        pdf.rect(0, 0, W, 22, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(16);
        pdf.text(subtitulo, m, 14);
        pdf.setFillColor.apply(pdf, crema);
        pdf.rect(0, 22, W, 5, 'F');
      }
      function pie(n, tot) {
        pdf.setDrawColor(210, 200, 180);
        pdf.line(m, H - 12, W - m, H - 12);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor.apply(pdf, gris);
        pdf.text('Precios de lista. No incluye instalación.' + (fecha ? '  ·  ' + fecha : ''), m, H - 7);
        pdf.text(n + ' / ' + tot, W - m, H - 7, { align: 'right' });
      }
      function botonVideo(x, y, w, h, url) {
        pdf.setFillColor.apply(pdf, azul);
        pdf.roundedRect(x, y, w, h, 3, 3, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text('Ver video', x + w / 2, y + h / 2 + 1.3, { align: 'center' });
        pdf.link(x, y, w, h, { url: url });
      }

      encabezado('Presupuesto');
      pdf.setTextColor.apply(pdf, oscuro);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      var y = 36;
      if (para) { pdf.setFont('helvetica', 'bold'); pdf.text('Para:  ' + para, m, y); y += 7; pdf.setFont('helvetica', 'normal'); }
      pdf.setFontSize(9);
      pdf.setTextColor.apply(pdf, gris);
      pdf.text('Fecha de lista: ' + (hoy || '—'), m, y);
      y += 8;

      pdf.setFillColor.apply(pdf, azul);
      pdf.rect(m, y, W - 2 * m, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.text('Cant.', m + 2, y + 5.5);
      pdf.text('Producto', m + 16, y + 5.5);
      pdf.text('SKU', W - 78, y + 5.5);
      pdf.text('P. unitario', W - 52, y + 5.5);
      pdf.text('Subtotal', W - m - 2, y + 5.5, { align: 'right' });
      y += 8;

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor.apply(pdf, oscuro);
      r.lineas.forEach(function (ln, i) {
        if (y > H - 28) {
          pie(pdf.internal.getNumberOfPages(), '?');
          pdf.addPage();
          encabezado('Presupuesto');
          y = 40;
        }
        if (i % 2 === 0) {
          pdf.setFillColor(252, 249, 242);
          pdf.rect(m, y, W - 2 * m, 8, 'F');
        }
        pdf.setFontSize(8);
        pdf.text(String(ln.q), m + 2, y + 5.5);
        var nom = pdf.splitTextToSize(sinMarca(ln.p.nombre) || ln.p.nombre || '', 70);
        pdf.text(nom[0] || '', m + 16, y + 5.5);
        pdf.setTextColor.apply(pdf, gris);
        pdf.text(String(ln.p.sku || ''), W - 78, y + 5.5);
        pdf.setTextColor.apply(pdf, oscuro);
        pdf.text(money(ln.p.precio), W - 52, y + 5.5);
        pdf.setFont('helvetica', 'bold');
        pdf.text(money(ln.q * ln.p.precio), W - m - 2, y + 5.5, { align: 'right' });
        pdf.setFont('helvetica', 'normal');
        y += 8;
      });

      y += 4;
      pdf.setFillColor.apply(pdf, azul);
      pdf.roundedRect(W - 78, y, 62, 12, 2, 2, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('Total  ' + money(r.tot), W - 47, y + 8, { align: 'center' });

      var pago = pagoActual();
      if (pago.cuotas > 1) {
        y += 18;
        pdf.setTextColor.apply(pdf, oscuro);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.text(pago.cuotas + ' cuotas de ' + money(r.tot / pago.cuotas), m, y);
        y += 6;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor.apply(pdf, gris);
        var det = [];
        if (pago.banco) {
          det.push(pago.banco.nombre);
          if (pago.banco.tarjetas) det.push(pago.banco.tarjetas);
        }
        if (PLANES.vigencia) det.push('Vigencia ' + PLANES.vigencia);
        if (det.length) pdf.text(det.join('  ·  '), m, y);
      }

      pdf.addPage();
      encabezado('Comparativa de costos');
      var c = cmpCostos();
      var yy = 36;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor.apply(pdf, azul);
      pdf.text(c.tit + ' vs. agua envasada', m, yy);
      yy += 7;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor.apply(pdf, gris);
      if (c.litroEq) pdf.text('Costo litro del equipo ' + money2(c.litroEq) + '   ·   litro envasada ' + money(c.litroEnv), m, yy);
      yy += 6;
      var cols = [m, m + 52, m + 78, m + 104, m + 132, m + 162];
      var heads = ['', '1er año', '2do año', '3er año', 'Gasto total', 'Ahorro'];
      pdf.setFillColor.apply(pdf, azul);
      pdf.rect(m, yy, W - 2 * m, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      heads.forEach(function (h, i) {
        pdf.text(h, i === 0 ? cols[i] + 2 : cols[i] + 22, yy + 5.5, i === 0 ? undefined : { align: 'right' });
      });
      yy += 8;
      function filaPdf(label, sub, a1, a2, a3, tot, aho, eq) {
        if (eq) { pdf.setFillColor(232, 240, 244); pdf.rect(m, yy, W - 2 * m, 10, 'F'); }
        pdf.setTextColor.apply(pdf, oscuro);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.text(label, m + 2, yy + (sub ? 4 : 6.5));
        if (sub) {
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(7);
          pdf.setTextColor.apply(pdf, gris);
          pdf.text(sub, m + 2, yy + 8);
        }
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor.apply(pdf, oscuro);
        pdf.text(celAnio(a1), cols[1] + 22, yy + 6.5, { align: 'right' });
        pdf.text(celAnio(a2), cols[2] + 22, yy + 6.5, { align: 'right' });
        pdf.text(celAnio(a3), cols[3] + 22, yy + 6.5, { align: 'right' });
        pdf.text(tot ? money(tot) : '', cols[4] + 22, yy + 6.5, { align: 'right' });
        if (aho) {
          pdf.setTextColor(229, 106, 23);
          pdf.text(money(aho), cols[5] + 22, yy + 6.5, { align: 'right' });
        }
        yy += 10;
      }
      filaPdf(c.tit, c.litroEq ? 'Costo litro ' + money2(c.litroEq) : '', c.yEq[0], c.yEq[1], c.yEq[2], c.totEq, 0, true);
      pdf.setFillColor(238, 243, 246);
      pdf.rect(m, yy, W - 2 * m, 7, 'F');
      pdf.setTextColor.apply(pdf, azul);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.text('AGUA ENVASADA', m + 2, yy + 5);
      yy += 7;
      c.filas.forEach(function (f) {
        filaPdf(f.esc.t, f.esc.s, f.anual, f.anual, f.anual, f.tot, f.ahorro, false);
      });
      if (c.kg3 > 0) {
        yy += 4;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor.apply(pdf, azul);
        pdf.text('Consumo de plástico', m, yy);
        yy += 5;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor.apply(pdf, oscuro);
        pdf.text('Botellas de 1 L (' + ENV_G + ' g):  ' + botFmt(c.kgY, 0) + ' kg por año   ·   ahorro ecológico ' + botFmt(c.kg3, 0) + ' kg en 3 años', m, yy);
      }

      r.lineas.forEach(function (ln, ix) {
        pdf.addPage();
        encabezado('Ficha de producto');
        var p = ln.p;
        var yy = 36;
        var foto = fotos[ix] || '';
        var imgW = 48;
        var tx = m;
        var tw = W - 2 * m;
        if (foto) {
          pdf.setFillColor(255, 255, 255);
          pdf.roundedRect(m, yy, imgW + 2, imgW + 2, 2, 2, 'F');
          try { pdf.addImage(foto, 'JPEG', m + 1, yy + 1, imgW, imgW); } catch (e1) {
            try { pdf.addImage(foto, 'PNG', m + 1, yy + 1, imgW, imgW); } catch (e2) {}
          }
          tx = m + imgW + 8;
          tw = W - m - tx;
        }
        pdf.setTextColor.apply(pdf, oscuro);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        var tit = pdf.splitTextToSize(sinMarca(p.nombre) || p.nombre || '', tw);
        pdf.text(tit, tx, yy + 8);
        var yTit = yy + 8 + tit.length * 6;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor.apply(pdf, gris);
        pdf.text('SKU ' + (p.sku || ''), tx, yTit + 4);
        pdf.setTextColor.apply(pdf, oscuro);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.text(ln.q + ' × ' + money(p.precio) + '   ·   ' + money(ln.q * p.precio), tx, yTit + 12);
        var vd = vidaDe(p);
        var extra = 0;
        if (vd && vd.meses) {
          extra = 8;
          var diaP = (ln.q * p.precio) / (vd.meses * 30);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8);
          pdf.setTextColor.apply(pdf, gris);
          var litroTxt = vd.litros ? ('  ·  ' + money((ln.q * p.precio) / vd.litros) + ' por litro') : '';
          pdf.text('Por día de uso: ' + money(diaP) + litroTxt, tx, yTit + 18);
        }
        yy = Math.max(yy + (foto ? imgW + 6 : 0), yTit + 18 + extra);
        pdf.setDrawColor(11, 88, 120);
        pdf.setLineWidth(0.4);
        pdf.line(m, yy, W - m, yy);
        yy += 8;

        pdf.setTextColor.apply(pdf, azul);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text('Para qué sirve', m, yy);
        yy += 6;
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor.apply(pdf, oscuro);
        pdf.setFontSize(10);
        var cuerpo = sinMarca(p.desc || p.para || 'Sin descripción cargada.').replace(/\n+/g, '\n');
        var lineasTxt = pdf.splitTextToSize(cuerpo, W - 2 * m);
        if (lineasTxt.length > 18) lineasTxt = lineasTxt.slice(0, 18);
        pdf.text(lineasTxt, m, yy);
        yy += lineasTxt.length * 5 + 10;

        if (p.video) {
          var data = qrDataUrl(p.video);
          if (data) {
            try { pdf.addImage(data, 'GIF', m, yy, 28, 28); } catch (e) {}
            pdf.link(m, yy, 28, 28, { url: p.video });
          }
          botonVideo(m + 36, yy + 7, 46, 14, p.video);
          yy += 32;
        }
      });

      var pages = pdf.internal.getNumberOfPages();
      for (var i = 1; i <= pages; i++) {
        pdf.setPage(i);
        pie(i, pages);
      }

      var nombre = 'Presupuesto' + (para ? '-' + para.replace(/[^\wáéíóúñüÁÉÍÓÚÑ ]+/g, '').trim().replace(/\s+/g, '-') : '') + '.pdf';
      var blob = pdf.output('blob');
      var file = new File([blob], nombre, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: 'Presupuesto', text: para ? ('Presupuesto para ' + para) : 'Presupuesto' }).catch(function () {
          pdf.save(nombre);
        });
      } else {
        pdf.save(nombre);
      }
    } catch (e) {
      aviso('No se pudo armar el PDF.');
    }
    if (btn) { btn.disabled = false; btn.textContent = 'PDF'; }
    }).catch(function () {
      aviso('No se pudo armar el PDF.');
      if (btn) { btn.disabled = false; btn.textContent = 'PDF'; }
    });
    });
  }

  function pintarTodo() {
    pintarItems();
    pintarFab();
    if ($('lpSheet') && $('lpSheet').classList.contains('open')) pintarSheet();
  }

  function bind() {
    var s = $('lpSearch');
    if (s) s.oninput = function () { busca = s.value || ''; pintarItems(); };
    var chips = $('lpChips');
    if (chips) chips.onclick = function (e) {
      var b = e.target.closest('[data-g]');
      if (!b) return;
      filtro = b.getAttribute('data-g') || 'todos';
      var wrap = $('lpCont');
      if (wrap) {
        wrap.innerHTML = htmlLista();
        bind();
        pintarTodo();
        var ns = $('lpSearch');
        if (ns) { ns.value = busca; ns.focus(); }
      }
    };
    var list = $('lpList');
    if (list) list.onclick = function (e) {
      var btn = e.target.closest('[data-act]');
      var row = e.target.closest('[data-sku]');
      if (!row) return;
      var sku = row.getAttribute('data-sku');
      var act = btn ? btn.getAttribute('data-act') : 'mas';
      var n = qty(sku);
      setQty(sku, act === 'menos' ? n - 1 : n + 1);
      pintarTodo();
    };
    var sheet = $('lpSheetLines');
    if (sheet && !sheet._lpBound) {
      sheet._lpBound = true;
      sheet.onclick = function (e) {
        var btn = e.target.closest('[data-act]');
        var row = e.target.closest('[data-sku]');
        if (!btn || !row) return;
        var sku = row.getAttribute('data-sku');
        var n = qty(sku);
        setQty(sku, btn.getAttribute('data-act') === 'menos' ? n - 1 : n + 1);
        pintarTodo();
      };
    }
  }

  function cargar(done) {
    Promise.all([
      fetch('./psa-catalogo.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }),
      fetch('./psa-planes.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
    ]).then(function (arr) {
      if (arr[0] && arr[0].productos) CAT = arr[0];
      if (arr[1] && (arr[1].cuotas || arr[1].bancos)) PLANES = arr[1];
      if (done) done();
    }).catch(function () { if (done) done(); });
  }

  function abrirLista() {
    estilo();
    crearVista();
    if (typeof showView === 'function') showView('view-lista');
    var cont = $('lpCont');
    if (cont) cont.innerHTML = htmlLista();
    bind();
    pintarTodo();
    cargar(function () {
      var cont2 = $('lpCont');
      if (cont2) cont2.innerHTML = htmlLista();
      bind();
      pintarTodo();
    });
  }

  window.abrirLista = abrirLista;
})();
