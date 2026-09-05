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
    { k: ['SENIOR4', 'SENIOR 4'], litros: 36000, meses: 36 },
    { k: ['S-1000', 'S·1000', 'S•1000'], litros: 80000, meses: 36 },
    { k: ['QUANTUM'], litros: 30000, meses: 36 },
    { k: ['IONTRIX'], litros: 40000, meses: 24 },
    { k: ['SENIK'], litros: 8000, meses: 18 },
    { k: ['VERO'], litros: 15000, meses: 18 },
    { k: ['MINI'], litros: 12000, meses: 12 },
    { k: ['RINNOVA', 'DUCHA'], litros: 150000, meses: 6 },
    { k: ['C3'], litros: 2000, meses: 6 },
    { k: ['SENIOR'], litros: 36000, meses: 36 },
    { k: ['STOPPER'], litros: 0, meses: 6 }
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
      '.lp-eco{margin:8px 0 12px;padding:12px;border-radius:16px;background:rgba(11,88,120,.06)}' +
      '.lp-eco-in{display:flex;gap:8px;margin:0 0 8px}' +
      '.lp-eco-in label{flex:1;font-size:11px;font-weight:800;color:#686977}' +
      '.lp-eco-in input{width:100%;min-height:38px;margin-top:4px;border:1px solid rgba(196,164,92,.45);border-radius:10px;padding:6px 8px;font:inherit;font-size:14px;background:#faf6ee}' +
      '.lp-eco-row{display:flex;justify-content:space-between;gap:8px;font-size:12px;font-weight:800;color:#2a2a32;margin:4px 0}' +
      '.lp-eco-ok{color:#0b5878}' +
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
  function botSet(dia, precio) {
    try { localStorage.setItem(LS_BOT, JSON.stringify({ dia: dia, precio: precio })); } catch (e) {}
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
  function ecoNums() {
    var r = resumen();
    var b = botGet();
    var botDia = Math.max(1, Number(b.dia) || 2);
    var botPre = Math.max(0, Number(b.precio) || 1500);
    var gastoBotDia = botDia * botPre;
    var costoEq = 0, hay = false, litros = 0, meses = 0;
    r.lineas.forEach(function (ln) {
      var v = vidaDe(ln.p);
      if (!v || !v.meses) return;
      hay = true;
      costoEq += (ln.q * (Number(ln.p.precio) || 0)) / (v.meses * 30);
      litros += ln.q * (Number(v.litros) || 0);
      meses = Math.max(meses, v.meses);
    });
    if (!hay && r.tot) {
      costoEq = r.tot / 365;
      meses = 12;
    }
    var ahorroDia = Math.max(0, gastoBotDia - costoEq);
    var botellasAnio = botDia * 365;
    var kgAnio = botellasAnio * BOT_G / 1000;
    var m2Anio = botellasAnio * BOT_M2;
    var petroleo = kgAnio * BOT_PETROLEO;
    var area = m2Anio < 2 ? 'como una mesa de café' : m2Anio < 10 ? 'como una habitación chica' : m2Anio < 16 ? 'como una plaza de estacionamiento' : m2Anio < 50 ? 'como un living comedor' : 'como un depto de ' + Math.round(m2Anio) + ' m²';
    return {
      botDia: botDia, botPre: botPre, gastoBotDia: gastoBotDia,
      costoEq: costoEq, ahorroDia: ahorroDia, hay: hay, litros: litros, meses: meses,
      kgAnio: kgAnio, m2Anio: m2Anio, petroleo: petroleo, area: area,
      anioBot: gastoBotDia * 365, anioEq: costoEq * 365, anioAho: ahorroDia * 365
    };
  }
  function pintarEco() {
    var host = $('lpEco');
    if (!host) return;
    var r = resumen();
    if (!r.n) { host.innerHTML = ''; return; }
    var e = ecoNums();
    host.innerHTML =
      '<div class="lp-sec">Vs botella</div>' +
      '<div class="lp-eco-in">' +
        '<label>Botellas 2 L / día <input id="lpBotDia" type="number" min="1" max="40" value="' + e.botDia + '"></label>' +
        '<label>Precio c/u $ <input id="lpBotPre" type="number" min="0" step="50" value="' + e.botPre + '"></label>' +
      '</div>' +
      '<div class="lp-eco-row"><span>Hoy, en botellas</span><b>' + money(e.gastoBotDia) + ' / día</b></div>' +
      '<div class="lp-eco-row"><span>Este presupuesto</span><b>' + money(e.costoEq) + ' / día</b></div>' +
      '<div class="lp-eco-row lp-eco-ok"><span>Ahorro</span><b>' + money(e.ahorroDia) + ' / día · ' + money(e.anioAho) + ' al año</b></div>' +
      '<p class="lp-note">Al planeta: ' + botFmt(e.kgAnio, 1) + ' kg de plástico por año · ' + botFmt(e.m2Anio, 1) + ' m² (' + esc(e.area) + ') · ' + botFmt(e.petroleo, 0) + ' L de petróleo. Cada botella tarda ' + BOT_ANIOS + ' años en descomponerse.</p>';
    var d = $('lpBotDia'), pr = $('lpBotPre');
    function save() {
      botSet(Math.max(1, Number(d && d.value) || 2), Math.max(0, Number(pr && pr.value) || 1500));
      pintarEco();
    }
    if (d) d.onchange = save;
    if (pr) pr.onchange = save;
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

      var eco = ecoNums();
      y += 12;
      if (y > 230) { pie(pdf.internal.getNumberOfPages(), '?'); pdf.addPage(); encabezado('Presupuesto'); y = 36; }
      pdf.setTextColor.apply(pdf, azul);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text('Si hoy compran agua embotellada', m, y);
      y += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor.apply(pdf, oscuro);
      pdf.setFontSize(9);
      pdf.text(eco.botDia + ' botellas de 2 L por día a ' + money(eco.botPre) + '  ·  ' + money(eco.gastoBotDia) + ' por día  ·  ' + money(eco.anioBot) + ' al año', m, y);
      y += 5;
      pdf.text('Este presupuesto: ' + money(eco.costoEq) + ' por día  ·  ' + money(eco.anioEq) + ' al año', m, y);
      y += 5;
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor.apply(pdf, azul);
      pdf.text('Ahorro: ' + money(eco.ahorroDia) + ' por día  ·  ' + money(eco.anioAho) + ' al año', m, y);
      y += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor.apply(pdf, gris);
      var ecoTxt = pdf.splitTextToSize('Al planeta: ' + botFmt(eco.kgAnio, 1) + ' kg de plástico por año, ' + botFmt(eco.m2Anio, 1) + ' m² (' + eco.area + '), ' + botFmt(eco.petroleo, 0) + ' L de petróleo. Cada botella tarda ' + BOT_ANIOS + ' años en descomponerse.', W - 2 * m);
      pdf.text(ecoTxt, m, y);

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
