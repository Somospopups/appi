/* APPI · Lista de precios tienda PSA + carrito de presupuesto */
(function () {
  'use strict';

  var LS = 'appi_lista_carrito_v1';
  var CAT = null;
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
    if ($('lpStyle')) return;
    var s = document.createElement('style');
    s.id = 'lpStyle';
    s.textContent = '' +
      '#view-lista{background:#f3eee3}' +
      '.lp-wrap{padding:10px 12px 118px}' +
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
      '.lp-bar{position:fixed;left:0;right:0;bottom:0;z-index:40;padding:10px 12px calc(12px + env(safe-area-inset-bottom));background:#f3eee3;border-top:1px solid rgba(42,42,50,.08);display:flex;align-items:center;gap:8px}' +
      '.lp-bar b{flex:1;font-size:13px;font-weight:900;color:#2a2a32}' +
      '.lp-bar b small{display:block;font-size:11px;font-weight:750;color:#686977}' +
      '.lp-bar button{border:0;border-radius:12px;padding:10px 12px;font:inherit;font-size:12px;font-weight:900;cursor:pointer}' +
      '.lp-bar .lp-wa{background:#25d366;color:#fff}' +
      '.lp-bar .lp-ver{background:#0b5878;color:#fff}' +
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
      '.lp-actions{display:flex;gap:8px}' +
      '.lp-actions button{flex:1;border:0;border-radius:12px;padding:12px;font:inherit;font-size:13px;font-weight:900;cursor:pointer}' +
      '.lp-actions .lp-wa{background:#25d366;color:#fff}' +
      '.lp-actions .lp-clear{background:rgba(42,42,50,.08);color:#2a2a32}' +
      'body.dark #view-lista,.dark .lp-bar,.dark .lp-sheet{background:#1c1e2a}' +
      'body.dark .lp-item{background:#25273a;border-color:rgba(255,255,255,.08)}' +
      'body.dark .lp-item-txt b,body.dark .lp-bar b,body.dark .lp-sheet h2,body.dark .lp-line b{color:#f2f2f7}' +
      'body.dark .lp-search,body.dark .lp-para{background:#25273a;color:#f2f2f7}';
    document.head.appendChild(s);
  }

  function crearVista() {
    var app = document.querySelector('.app') || document.body;
    if ($('view-lista')) return;
    var s = document.createElement('section');
    s.id = 'view-lista';
    s.className = 'view';
    s.innerHTML = '<header class="top"><button class="back-btn" onclick="history.back()" aria-label="Volver">‹</button><button class="tools-btn" onclick="toggleToolsMenu(event)" aria-label="Herramientas" title="Herramientas">⚙️</button><h1>Lista de precios</h1><div class="script">tienda PSA</div></header><div id="lpCont"></div>';
    app.appendChild(s);
    if ($('lpSheet')) return;
    var sh = document.createElement('div');
    sh.id = 'lpSheet';
    sh.setAttribute('aria-hidden', 'true');
    sh.innerHTML = '<div class="lp-sheet" role="dialog" aria-label="Presupuesto">' +
      '<div class="lp-sheet-top"><h2>Presupuesto</h2><button type="button" data-cerrar aria-label="Cerrar">×</button></div>' +
      '<input class="lp-para" id="lpPara" type="text" placeholder="Para (nombre, opcional)" maxlength="80">' +
      '<div id="lpSheetLines"></div>' +
      '<div class="lp-tot" id="lpSheetTot"></div>' +
      '<div class="lp-actions"><button type="button" class="lp-wa" id="lpSheetWa">WhatsApp</button>' +
      '<button type="button" class="lp-clear" id="lpSheetClear">Vaciar</button></div></div>';
    document.body.appendChild(sh);
    sh.addEventListener('click', function (e) {
      if (e.target === sh) cerrarSheet();
    });
    var x = sh.querySelector('[data-cerrar]');
    if (x) x.onclick = cerrarSheet;
  }

  function htmlLista() {
    var fecha = (CAT && CAT.actualizado) ? CAT.actualizado : '';
    var chips = GRUPOS.map(function (g) {
      return '<button type="button" class="lp-chip' + (filtro === g.id ? ' on' : '') + '" data-g="' + g.id + '">' + esc(g.t) + '</button>';
    }).join('');
    return '<div class="lp-wrap">' +
      '<p class="lp-note">Lista de tienda.psa.com.ar' + (fecha ? ' · ' + esc(fecha) : '') + '. Armá el presupuesto y mandalo por WhatsApp.</p>' +
      '<input class="lp-search" id="lpSearch" type="search" placeholder="Buscar modelo, recarga o SKU" value="' + esc(busca) + '">' +
      '<div class="lp-chips" id="lpChips">' + chips + '</div>' +
      '<div id="lpList"></div></div>' +
      '<div class="lp-bar" id="lpBar"></div>';
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

  function pintarBarra() {
    var bar = $('lpBar');
    if (!bar) return;
    var r = resumen();
    if (!r.n) {
      bar.innerHTML = '<b>Carrito vacío<small>Sumá equipos, recargas o adaptadores</small></b>';
      return;
    }
    bar.innerHTML = '<b>' + r.n + ' ítem' + (r.n === 1 ? '' : 's') + '<small>' + money(r.tot) + '</small></b>' +
      '<button type="button" class="lp-ver" id="lpVer">Ver</button>' +
      '<button type="button" class="lp-wa" id="lpWaBar">WhatsApp</button>';
    var ver = $('lpVer');
    if (ver) ver.onclick = abrirSheet;
    var wa = $('lpWaBar');
    if (wa) wa.onclick = enviarWA;
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
      pintarTodo();
    };
    var wa = $('lpSheetWa');
    if (wa) wa.onclick = enviarWA;
  }
  function cerrarSheet() {
    var sh = $('lpSheet');
    if (!sh) return;
    sh.classList.remove('open');
    sh.setAttribute('aria-hidden', 'true');
  }

  function textoWA() {
    var r = resumen();
    var para = ($('lpPara') && $('lpPara').value || '').trim();
    var fecha = (CAT && CAT.actualizado) ? CAT.actualizado : '';
    var lineas = ['Presupuesto PSA' + (fecha ? ' · ' + fecha : '')];
    if (para) lineas.push('Para: ' + para);
    lineas.push('');
    r.lineas.forEach(function (ln) {
      lineas.push(ln.q + ' × ' + ln.p.nombre + ' — ' + money(ln.q * ln.p.precio));
    });
    lineas.push('');
    lineas.push('Total: ' + money(r.tot));
    lineas.push('Lista tienda PSA');
    return lineas.join('\n');
  }
  function enviarWA() {
    var r = resumen();
    if (!r.n) return;
    var url = 'https://wa.me/?text=' + encodeURIComponent(textoWA());
    if (window.APPIWhatsApp && window.APPIWhatsApp.abrir) window.APPIWhatsApp.abrir(url);
    else window.open(url, '_blank', 'noopener');
  }

  function pintarTodo() {
    pintarItems();
    pintarBarra();
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
        var html = htmlLista();
        wrap.innerHTML = html;
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
    fetch('./psa-catalogo.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (d && d.productos) CAT = d;
        if (done) done();
      })
      .catch(function () { if (done) done(); });
  }

  function abrirLista() {
    estilo();
    crearVista();
    if (typeof showView === 'function') showView('view-lista');
    var t = $('tabs');
    if (t) t.style.display = 'none';
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
