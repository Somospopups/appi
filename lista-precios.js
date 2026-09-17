/* APPI · Lista de precios tienda PSA + presupuesto PDF */
(function () {
  'use strict';

  var LS = 'appi_lista_carrito_v1';
  var LS_FAB = 'appi_lista_fab_v1';
  try { localStorage.removeItem(LS_FAB); } catch (e) {}
  var LS_PAGO = 'appi_lista_pago_v1';
  var LS_BOT = 'appi_lista_bot_v1';
  var CAT = null;
  var BOT_G = 44;
  var BOT_ANIOS = 450;
  var BOT_M2 = 0.018;
  var BOT_PETROLEO = 1.9;
  var VIDA = [
    { k: ['SENIOR4', 'SENIOR 4'], litros: 36000, meses: 36, kit: 1, purif: 1 },
    { k: ['S-1000', 'S·1000', 'S•1000'], litros: 80000, meses: 36, kit: 1, purif: 1 },
    { k: ['QUANTUM'], litros: 30000, meses: 36, purif: 1 },
    { k: ['IONTRIX'], litros: 40000, meses: 24 },
    { k: ['SENIK'], litros: 8000, meses: 18, purif: 1 },
    { k: ['VERO'], litros: 15000, meses: 18, kit: 1, purif: 1 },
    { k: ['MINI'], litros: 12000, meses: 12, kit: 1, purif: 1 },
    { k: ['RINNOVA', 'DUCHA'], litros: 150000, meses: 6 },
    { k: ['C3'], litros: 2000, meses: 6 },
    { k: ['SENIOR'], litros: 36000, meses: 36, kit: 1, purif: 1 },
    { k: ['STOPPER'], litros: 0, meses: 6 }
  ];
  var ENV_L = 1371;
  var ENV_G = 45;
  var ENV_ESC = [
    { l: 2, t: '2 litros diarios', s: 'hogar soltero' },
    { l: 4, t: '4 litros diarios', s: 'hogar con o sin bebé' },
    { l: 8, t: '8 litros diarios', s: 'hogar familia tipo' }
  ];
  var TRATA_INTRO = 'Hoy esa familia toma lo que sale de la canilla. Mañana puede tomar lo que el equipo deja pasar. La diferencia no se juega en un vaso: se juega en años, mate a mate.';
  var TRATA = {
    cloro: { nom: 'Cloro', txt: 'La red lo pone para que el agua viaje sin microbios. En casa ya no hace falta: queda gusto a pileta, reseca piel, pelo y mucosas, irrita ojos en la ducha y, al calentar (mate, té, comida), forma THM. Tomarlo todos los días es tragar el desinfectante y sus derivados. Bajarlo es el primer paso entre el agua que venís tomando y el agua que vas a tomar.' },
    thm: { nom: 'THM (trihalometanos)', txt: 'Se forman solos cuando el cloro se junta con materia orgánica. No se ven ni se huelen. En cada vaso, cada mate y cada comida entran al cuerpo. Con el consumo de años se los relaciona con más riesgo en vejiga e hígado. No es un susto de un día: es lo invisible de la canilla, todos los días.' },
    hierro: { nom: 'Hierro', txt: 'Sale de caños viejos o de agua de pozo. Da gusto metálico, mancha ropa y sanitarios, y en exceso puede sentar mal el estómago. No es el más grave, pero es la señal de que el agua arrastra lo que hay en las cañerías. Sacarlo es paladar limpio y menos óxido en lo que tomás.' },
    plomo: { nom: 'Plomo', txt: 'Puede salir de caños o soldaduras antiguas. No se ve, no se siente, no tiene gusto. El cuerpo no lo elimina bien: se acumula. En chicos afecta el desarrollo y el aprendizaje; en grandes, tensión y riñón. No hay una dosis “segura” para crecer. Por eso conviene no pasarlo en el agua de todos los días.' },
    solidos: { nom: 'Sólidos en suspensión', txt: 'Tierra, óxido y partículas del tanque o de la red. El agua se ve turbia o deja poso: eso también se toma. Pueden llevar microbios y tapan los medios de adentro. Si se ve sucia, no es “solo tierra”: es lo que está entrando al vaso.' },
    dureza: { nom: 'Sarro / dureza', txt: 'Calcio y magnesio. No es un veneno, pero el consumo constante deja sarro en el cuerpo de la casa: cafetera, termo, flor de ducha, caños, y la piel queda áspera. Tratarlo es otra agua al tacto y menos incrustación. El estudio dice si esa casa la tiene dura.' },
    arsenico: { nom: 'Arsénico', txt: 'En varias zonas de Argentina (también Córdoba) está en el agua de pozo, de origen natural. No se ve ni se siente. Tomarlo años se asocia a lesiones en la piel y a más riesgo de cáncer de piel, pulmón y vejiga. No es un maybe de un vaso: es el agua de esa casa, todos los días.' },
    algas: { nom: 'Bacterias y algas (pileta)', txt: 'En la pileta se reproducen con el calor y el uso. Tragar esa agua o bañarse con exceso de cloro irrita ojos, piel y puede sentar mal la panza. Ionizar es otra agua para el cuerpo que se mete a nadar, con menos químico.' }
  };
  var TRATA_ORDEN = ['cloro', 'thm', 'hierro', 'plomo', 'solidos', 'dureza', 'arsenico', 'algas'];
  var TRATA_EQ = [
    { k: ['SENIOR4', 'SENIOR 4'], keys: ['cloro', 'thm', 'hierro', 'plomo'] },
    { k: ['S-1000', 'S·1000', 'S•1000'], keys: ['cloro', 'thm', 'hierro', 'plomo'] },
    { k: ['SENIK'], keys: ['arsenico', 'cloro', 'thm', 'hierro', 'plomo'] },
    { k: ['QUANTUM'], keys: ['dureza', 'cloro', 'thm'] },
    { k: ['IONTRIX'], keys: ['algas'] },
    { k: ['VERO'], keys: ['cloro', 'thm', 'hierro', 'plomo'] },
    { k: ['MINI'], keys: ['cloro', 'solidos'] },
    { k: ['POLI'], keys: ['cloro', 'hierro', 'plomo', 'dureza'] },
    { k: ['RINNOVA', 'DUCHA'], keys: ['cloro', 'hierro', 'plomo'] },
    { k: ['C3'], keys: ['cloro', 'thm', 'solidos'] },
    { k: ['SENIOR'], keys: ['cloro', 'thm', 'hierro', 'plomo'] },
    { k: ['STOPPER'], keys: ['solidos'] },
    { k: ['PORTÁTIL', 'PORTATIL'], keys: ['cloro'] },
    { k: ['POLI 2', 'POLI2'], keys: ['dureza'] }
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
  // Clave de carrito: el sku; para los productos que solo figuran en la
  // lista con acuerdo (sin sku de tienda) se usa el nombre, para que cada
  // uno tenga su propia línea en el presupuesto.
  function claveSku(p) {
    if (p && p.sku) return p.sku;
    return 'n:' + String((p && p.nombre) || '').toLowerCase().trim();
  }
  // Líneas "Plan canje" de la lista con acuerdo: sublínea del mismo
  // producto al precio de canje (el PDF las imprime debajo del producto).
  // En la Lista de precios figuran como línea propia para poder cotizar
  // al precio de canje (buscá "canje" y aparecen todas).
  var CANJE_SUF = '::canje';
  function esClaveCanje(key) { return String(key || '').slice(-CANJE_SUF.length) === CANJE_SUF; }
  function lineaCanje(p) {
    return {
      clave: claveSku(p) + CANJE_SUF, sku: p.sku || '',
      nombre: p.nombre + ' (PLAN CANJE)', precio: p.plan_canje,
      foto: p.foto, grupo: p.grupo, seccion: p.seccion, canje: true
    };
  }
  function lineasLista() {
    var out = [];
    productos().forEach(function (p) {
      out.push({ clave: claveSku(p), sku: p.sku || '', nombre: p.nombre, precio: p.precio, foto: p.foto, grupo: p.grupo, seccion: p.seccion });
      if (p.plan_canje) out.push(lineaCanje(p));
    });
    return out;
  }
  function porSku(sku) {
    var list = productos();
    if (esClaveCanje(sku)) {
      var base = String(sku).slice(0, -CANJE_SUF.length);
      for (var j = 0; j < list.length; j++) {
        if (list[j].plan_canje && claveSku(list[j]) === base) return lineaCanje(list[j]);
      }
      return null;
    }
    for (var i = 0; i < list.length; i++) if (claveSku(list[i]) === sku) return list[i];
    return null;
  }
  function filtrados() {
    var q = busca.trim().toLowerCase();
    var list = lineasLista();
    return list.filter(function (L) {
      if (filtro !== 'todos' && L.grupo !== filtro) return false;
      if (!q) return true;
      return (L.nombre || '').toLowerCase().indexOf(q) >= 0 || String(L.sku).indexOf(q) >= 0;
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


  function cerrarFotoModal() {
    var m = $('lpFotoModal');
    if (!m) return;
    m.classList.remove('open');
    setTimeout(function () { m.style.display = 'none'; }, 200);
  }

  function abrirFotoModal(src, tit, sub) {
    var m = $('lpFotoModal');
    if (!m) {
      m = document.createElement('div');
      m.id = 'lpFotoModal';
      m.innerHTML = '<div class="lp-foto-card">' +
        '<img class="lp-foto-card-img" id="lpFotoModalImg" src="" alt="">' +
        '<div class="lp-foto-card-tit" id="lpFotoModalTit"></div>' +
        '<div class="lp-foto-card-sub" id="lpFotoModalSub"></div>' +
        '<button type="button" class="lp-foto-card-close" id="lpFotoModalClose">Cerrar</button>' +
        '</div>';
      document.body.appendChild(m);
      m.addEventListener('click', function (e) {
        if (e.target === m || e.target.id === 'lpFotoModalClose') cerrarFotoModal();
      });
    }
    var img = $('lpFotoModalImg');
    var t = $('lpFotoModalTit');
    var s = $('lpFotoModalSub');
    if (img) img.src = src || '';
    if (t) t.textContent = tit || '';
    if (s) s.textContent = sub || '';
    m.style.display = 'flex';
    requestAnimationFrame(function () { m.classList.add('open'); });
  }

  function estilo() {
    var css = '' +
      '#view-lista{background:#f3eee3}' +
      '.lp-wrap{padding:10px 12px calc(env(safe-area-inset-bottom) + 168px)}' +
      '.lp-note{margin:0 0 10px;font-size:11px;font-weight:750;color:#686977;line-height:1.35;display:flex;align-items:center;gap:8px;flex-wrap:wrap}' +
      '.lp-actualizar{flex:0 0 auto;border:1px solid rgba(11,88,120,.22);border-radius:999px;padding:6px 10px;background:#fff;color:#0b5878;font:inherit;font-size:11px;font-weight:850;cursor:pointer}' +
      '.lp-actualizar:disabled{opacity:.55;cursor:wait}' +
      '.lp-actualizar.ok{background:#e6f4ee;color:#1a6b4a;border-color:rgba(26,107,74,.18)}' +
      '.lp-note small{font-size:10px;font-weight:700;color:#8a8d9e}' +
      '.lp-search{width:100%;min-height:44px;border:1px solid rgba(196,164,92,.45);border-radius:14px;padding:10px 12px;font:inherit;font-size:14px;background:#faf6ee;color:#2a2a32;margin:0 0 10px}' +
      '.lp-chips-wrap{position:relative;margin:0 0 6px}' +
      '.lp-chips-wrap.lp-more:after{content:"";position:absolute;right:0;top:0;bottom:10px;width:52px;pointer-events:none;background:linear-gradient(90deg,rgba(243,238,227,0),#f3eee3 70%)}' +
      '.lp-chips{display:flex;gap:8px;overflow-x:auto;overflow-y:hidden;padding:0 36px 10px 0;-webkit-overflow-scrolling:touch;scrollbar-width:none;-ms-overflow-style:none;overscroll-behavior-x:contain}' +
      '.lp-chips::-webkit-scrollbar{display:none;height:0;width:0}' +
      '.lp-chips-in{display:flex;gap:8px;width:max-content;padding-right:8px}' +
      '.lp-chip{flex:0 0 auto;border:0;border-radius:999px;padding:8px 14px;font:inherit;font-size:12px;font-weight:850;background:rgba(255,255,255,.7);color:#2a2a32;cursor:pointer}' +
      '.lp-chip.on{background:#0b5878;color:#fff}' +
      '@keyframes lpIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}' +
      '.lp-cuotas-in{animation:lpIn .35s ease}' +
      'body.dark .lp-chips-wrap.lp-more:after{background:linear-gradient(90deg,rgba(28,30,42,0),#1c1e2a)}' +
      '.lp-sec{margin:12px 0 6px;font-size:11px;font-weight:900;color:#0b5878;letter-spacing:.4px;text-transform:uppercase}' +
      '.lp-canje{ background:rgba(91,141,239,0.06); border-left:3px solid #5b8def; } .lp-canje .lp-item-txt b{ color:#3d63c9; } .lp-item{display:flex;align-items:center;gap:10px;padding:10px 12px;margin:0 0 8px;border-radius:16px;background:rgba(255,255,255,.72);border:1px solid rgba(255,255,255,.8)}' +
      '.lp-item-txt{flex:1;min-width:0}' +
      '.lp-item-txt b{display:block;font-size:13px;font-weight:900;color:#2a2a32;line-height:1.25}' +
      '.lp-item-txt span{display:block;margin-top:2px;font-size:11px;font-weight:750;color:#686977}' +
      '.lp-item-txt em{display:block;margin-top:2px;font-size:13px;font-weight:950;color:#0b5878;font-style:normal}' +
      '.lp-qty{display:flex;align-items:center;gap:6px;flex-shrink:0}' +
      '.lp-qty button{width:32px;height:32px;border:0;border-radius:10px;background:#0b5878;color:#fff;font:inherit;font-size:18px;font-weight:900;line-height:1;cursor:pointer}' +
      '.lp-qty button.ghost{background:rgba(11,88,120,.12);color:#0b5878}' +
      '.lp-qty i{min-width:18px;text-align:center;font-style:normal;font-size:13px;font-weight:900;color:#2a2a32}' +
      '.lp-empty{padding:28px 8px;text-align:center;font-size:13px;font-weight:750;color:#686977}' +
      '.lp-fab{display:none;position:fixed;right:14px;left:auto;top:auto;bottom:98px;bottom:calc(env(safe-area-inset-bottom) + 98px);z-index:70;align-items:center;gap:8px;border:0;border-radius:999px;padding:12px 16px;background:#0b5878;color:#fff;font:inherit;font-size:13px;font-weight:900;box-shadow:0 8px 24px rgba(11,88,120,.38);cursor:pointer;touch-action:manipulation;user-select:none;-webkit-user-select:none}' +
      '.lp-fab.on{display:flex}' +
      '.lp-fab i{min-width:22px;height:22px;padding:0 6px;border-radius:99px;background:#fff;color:#0b5878;font-style:normal;font-size:12px;font-weight:950;display:flex;align-items:center;justify-content:center;pointer-events:none}' +
      '.lp-fab span{pointer-events:none}' +
      '@media (min-width:1024px){.lp-fab{bottom:24px;right:28px;left:auto}.lp-wrap{padding-bottom:88px}}' +
      '#lpSheet{display:none;position:fixed;inset:0;z-index:80;background:rgba(20,24,32,.45);align-items:flex-end}' +
      '#lpSheet.open{display:flex}' +
      '.lp-sheet{width:100%;max-height:86%;overflow:auto;background:#f3eee3;border-radius:22px 22px 0 0;padding:14px 14px calc(18px + env(safe-area-inset-bottom))}' +
      '.lp-sheet h2{margin:0;font-size:16px;font-weight:950;color:#2a2a32}' +
      '.lp-sheet-top{display:flex;align-items:center;justify-content:space-between;margin:0 0 10px}' +
      '.lp-sheet-top button{border:0;background:transparent;font-size:22px;line-height:1;color:#2a2a32;cursor:pointer}' +
      '.lp-gan{margin:0 0 12px;border:1px solid rgba(11,88,120,.22);border-radius:14px;background:linear-gradient(135deg,rgba(11,88,120,.07),rgba(58,208,164,.10));padding:10px 12px}' +
      '.lp-gan-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px}' +
      '.lp-gan-head b{font-size:11px;font-weight:950;color:#0b5878;letter-spacing:.4px}' +
      '.lp-gan-head span{font-size:10px;color:#686977}' +
      '.lp-gan-num{font-size:24px;font-weight:950;color:#0b5878;margin:2px 0 6px}' +
      '.lp-gan-num i{font-style:normal;font-size:11px;font-weight:850;color:#23826b;margin-left:8px}' +
      '.lp-gan-detalle{display:flex;flex-direction:column;gap:2px;margin-bottom:6px;max-height:96px;overflow:auto}' +
      '.lp-gan-detalle span{font-size:11px;color:#4a4b57}' +
      '.lp-gan-detalle b{color:#0b5878}' +
      '.lp-gan-detalle em{font-style:normal;font-size:9px;background:#fff3cd;color:#8a6d1a;padding:1px 5px;border-radius:6px;font-weight:850}' +
      '.lp-gan-foot{font-size:10px;color:#85889a;margin-bottom:8px;line-height:1.4}' +
      '.lp-gan-saldo{font-size:10px;font-weight:800;color:#23826b;margin-bottom:8px}' +
      '.lp-gan-wa{width:100%;border:0;border-radius:12px;background:#23826b;color:#fff;font-size:13px;font-weight:950;padding:10px 0;cursor:pointer}' +
      'body.dark .lp-gan{background:rgba(11,88,120,.18);border-color:rgba(58,208,164,.35)}' +
      'body.dark .lp-gan-head b,body.dark .lp-gan-num,body.dark .lp-gan-num i{color:#3ad0a4}' +
      'body.dark .lp-gan-detalle span{color:#c9cbdb}' +
      'body.dark .lp-gan-detalle b{color:#3ad0a4}' +
      '.lp-para{width:100%;min-height:42px;border:1px solid rgba(196,164,92,.45);border-radius:12px;padding:8px 10px;font:inherit;font-size:14px;background:#faf6ee;margin:0 0 10px}' +
      '.lp-line{display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid rgba(42,42,50,.08)}' +
      '.lp-line b{flex:1;font-size:13px;font-weight:850;color:#2a2a32}' +
      '.lp-line span{font-size:12px;font-weight:900;color:#0b5878;white-space:nowrap}' +
      '.lp-tot{margin:12px 0;font-size:18px;font-weight:950;color:#0b5878}' +

      '.lp-eco{margin:8px 0 12px}' +
      '.lp-cmp-litro{display:block;margin:0 0 10px;font-size:11px;font-weight:800;color:#686977}' +
      '.lp-cmp-litro input{width:110px;min-height:36px;margin-left:6px;border:1px solid rgba(196,164,92,.45);border-radius:10px;padding:6px 8px;font:inherit;font-size:14px;background:#faf6ee}' +
      '.lp-cmp{background:#fff;border:1px solid rgba(11,88,120,.14);border-radius:18px;overflow:hidden;margin:0 0 12px;box-shadow:0 10px 28px rgba(11,88,120,.08)}' +
      '.lp-cmp-h{background:#0b5878;color:#fff;padding:11px 14px;font-size:13px;font-weight:950;letter-spacing:.2px}' +
      '.lp-cmp-pay{margin:0;padding:12px 14px;background:#fff4e8;color:#7a3b10;font-size:13px;font-weight:750;line-height:1.4}' +
      '.lp-cmp-pay b{color:#e56a17;font-size:15px}' +
      '.lp-cmp-sub{margin:0;padding:10px 14px 6px;font-size:12px;font-weight:750;color:#2a2a32}' +
      '.lp-cmp-sub b{color:#0b5878}' +
      '.lp-cmp-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;padding:0 8px 8px}' +
      '.lp-cmp-tb{width:100%;border-collapse:collapse;font-size:11px;min-width:500px}' +
      '.lp-cmp-tb th{background:#0b5878;color:#fff;font-weight:850;padding:8px 7px;text-align:right}' +
      '.lp-cmp-tb th:first-child{text-align:left;border-radius:8px 0 0 0}' +
      '.lp-cmp-tb th:last-child{border-radius:0 8px 0 0}' +
      '.lp-cmp-tb td{padding:8px 7px;border-bottom:1px solid rgba(42,42,50,.07);text-align:right;font-weight:800;color:#2a2a32;vertical-align:top}' +
      '.lp-cmp-tb td:first-child{text-align:left;font-weight:750}' +
      '.lp-cmp-tb td small{display:block;font-size:10px;font-weight:700;color:#686977;margin-top:1px}' +
      '.lp-cmp-eq td{background:rgba(11,88,120,.07)}' +
      '.lp-cmp-ag td{background:#eef3f6;text-align:left;font-weight:900;color:#0b5878;letter-spacing:.35px;text-transform:uppercase;font-size:10px}' +
      '.lp-aho{color:#e56a17!important;font-weight:950!important}' +
      '.lp-cmp-plst{margin:0;padding:8px 14px 12px;font-size:12px;font-weight:750;color:#2a2a32;background:#f3eee3}' +
      '.lp-cmp-plst b{color:#0b5878}' +
      '.lp-eco-bolsa{margin:0;padding:10px 14px;font-size:12px;font-weight:750;color:#2a2a32;line-height:1.4;border-top:1px solid rgba(11,88,120,.08)}' +
      '.lp-eco-bolsa b{color:#0b5878}' +
      '.lp-eco-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0 14px 12px}' +
      '.lp-eco-item{background:#f3eee3;border-radius:12px;padding:10px 10px 8px}' +
      '.lp-eco-item b{display:block;color:#0b5878;font-size:16px;font-weight:950;line-height:1.15}' +
      '.lp-eco-item small{display:block;margin-top:3px;color:#686977;font-size:11px;font-weight:700;line-height:1.3}' +
      'body.dark .lp-eco-bolsa,body.dark .lp-eco-item small{color:#d0d0d8}' +
      'body.dark .lp-eco-item{background:#1c1e2a}' +
      'body.dark .lp-cmp{background:#25273a;border-color:rgba(255,255,255,.08)}' +
      'body.dark .lp-cmp-sub,body.dark .lp-cmp-tb td,body.dark .lp-cmp-plst{color:#f2f2f7}' +
      '.lp-actions{display:flex;gap:8px}' +
      '.lp-actions button{flex:1;border:0;border-radius:12px;padding:12px;font:inherit;font-size:13px;font-weight:900;cursor:pointer}' +
      '.lp-actions .lp-pdf{background:#0b5878;color:#fff}' +
      '.lp-actions .lp-clear{background:rgba(42,42,50,.08);color:#2a2a32}' +
      'body.dark #view-lista,.dark .lp-sheet{background:#1c1e2a}' +
      'body.dark .lp-item{background:#25273a;border-color:rgba(255,255,255,.08)}' +
      '.lp-item-foto-wrap{position:relative;width:44px;height:44px;flex:none;cursor:pointer}' +
      '.lp-item-foto{width:44px;height:44px;border-radius:10px;object-fit:contain;background:#fff;border:1px solid rgba(0,0,0,.07);padding:3px;display:block;transition:transform .15s ease}' +
      '.lp-item-foto-wrap:active .lp-item-foto{transform:scale(0.95)}' +
      '.lp-badge-canje{position:absolute;bottom:-3px;right:-3px;background:#0b5878;color:#fff;font-size:10px;font-weight:900;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1.5px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.25);pointer-events:none}' +
      'body.dark .lp-badge-canje{background:#1680aa;border-color:#1c1e2e}' +
      '#lpFotoModal{position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(6px);z-index:9999;display:none;align-items:center;justify-content:center;padding:20px;opacity:0;transition:opacity .2s ease}' +
      '#lpFotoModal.open{display:flex;opacity:1}' +
      '.lp-foto-card{background:#fff;border-radius:20px;padding:20px;max-width:340px;width:100%;text-align:center;box-shadow:0 20px 40px rgba(0,0,0,.4);position:relative;transform:scale(0.92);transition:transform .2s ease}' +
      '#lpFotoModal.open .lp-foto-card{transform:scale(1)}' +
      'body.dark .lp-foto-card{background:#232536;color:#f2f2f7}' +
      '.lp-foto-card-img{width:220px;height:220px;object-fit:contain;margin:0 auto 14px;display:block;background:#fff;border-radius:14px;padding:8px;border:1px solid rgba(0,0,0,.06)}' +
      '.lp-foto-card-tit{font-size:14px;font-weight:800;margin-bottom:6px;line-height:1.3}' +
      '.lp-foto-card-sub{font-size:12px;color:#70707a;margin-bottom:16px}' +
      'body.dark .lp-foto-card-sub{color:#a0a0aa}' +
      '.lp-foto-card-close{width:100%;padding:11px;border-radius:12px;border:0;background:#0b5878;color:#fff;font-weight:700;font-size:13px;cursor:pointer}' + '.lp-item-foto{width:44px;height:44px;flex:none;border-radius:10px;object-fit:contain;background:#fff;border:1px solid rgba(0,0,0,.07);padding:3px}' +
      'body.dark .lp-item-foto{background:#1c1e2e;border-color:rgba(255,255,255,.09)}' +
      'body.dark .lp-item-txt b,body.dark .lp-sheet h2,body.dark .lp-line b{color:#f2f2f7}' +
      'body.dark .lp-search,body.dark .lp-para{background:#25273a;color:#f2f2f7}' +
      '@media (min-width:1024px){' +
        '.lp-fab{bottom:24px;right:28px}' +
        '.lp-wrap{padding-bottom:88px}' +
        '#lpSheet{left:280px;align-items:center;justify-content:center;padding:28px;z-index:200}' +
        'body.sidebar-cerrada #lpSheet{left:0}' +
        '.lp-sheet{width:min(720px,100%);max-height:92%;border-radius:22px;box-shadow:0 24px 64px rgba(20,24,32,.28)}' +
        '.lp-cmp-tb{min-width:0}' +
      '}';
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
      s.innerHTML = '<header class="top"><button class="back-btn" onclick="history.back()" aria-label="Volver">‹</button><button class="help-btn" id="btnHelpLista" aria-label="Ayuda">?</button><button class="tools-btn" onclick="toggleToolsMenu(event)" aria-label="Herramientas" title="Herramientas">⚙️</button><h1>Lista de precios</h1><div class="script">tienda PSA</div></header><div id="lpCont"></div><button type="button" class="lp-fab" id="lpFab" hidden aria-label="Ver presupuesto"></button>';
      app.appendChild(s);
      var hl = $('btnHelpLista');
      if (hl) hl.onclick = function () { if (typeof showHelp === 'function') showHelp('lista'); };
    }
    if (!$('lpSheet')) {
      var sh = document.createElement('div');
      sh.id = 'lpSheet';
      sh.setAttribute('aria-hidden', 'true');
      sh.innerHTML = '<div class="lp-sheet" role="dialog" aria-label="Presupuesto">' +
        '<div class="lp-sheet-top"><h2>Presupuesto</h2><button type="button" data-cerrar aria-label="Cerrar">×</button></div>' +
        '<div id="lpSheetGanancia"></div>' +
        '<div id="lpSheetLines"></div>' +
        '<div class="lp-tot" id="lpSheetTot"></div>' +
        '<div class="lp-sec">Pago</div>' +
        '<div class="lp-chips-wrap"><div class="lp-chips" id="lpBancos"></div></div>' +
        '<div class="lp-sec" id="lpCuotasLab" hidden>Cuotas</div>' +
        '<div class="lp-chips-wrap" id="lpCuotasWrap" hidden><div class="lp-chips" id="lpCuotas"></div></div>' +
        '<div class="lp-actions"><button type="button" class="lp-pdf" id="lpSheetPdf">Cotizar</button>' +
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
      '<p class="lp-note"><span>Lista \'Precios Sugeridos con Acuerdo\' de PSA' + (fecha ? ' · ' + esc(fecha) : '') + '. Elegí productos y cotizá.</span>' +
      '<button type="button" class="lp-actualizar" id="lpActualizar" title="Actualizar precios desde la lista de PSA">🔄 Actualizar precios</button></p>' +
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
    list.forEach(function (L) {
      if (filtro === 'todos' && L.grupo !== last) {
        last = L.grupo;
        html += '<div class="lp-sec">' + esc(GRUPO_TIT[L.grupo] || L.grupo) + '</div>';
      }
      var q = qty(L.clave);
      var esCanje = !!L.canje;
      var fotoHtml = '';
      if (L.foto) {
        fotoHtml = '<div class="lp-item-foto-wrap" data-foto-popup="' + esc(L.foto) + '" data-foto-tit="' + esc(L.nombre) + '" data-foto-sub="' + esc((L.sku ? 'SKU ' + L.sku : (L.seccion || '')) + (esCanje ? ' · Plan canje' : '')) + '">' +
          '<img class="lp-item-foto" loading="lazy" src="' + esc(L.foto) + '" alt="" onerror="this.parentElement.remove()">' +
          (esCanje ? '<span class="lp-badge-canje" title="Plan Canje">🔄</span>' : '') +
          '</div>';
      }
      html += '<div class="lp-item' + (esCanje ? ' lp-canje' : '') + '" data-sku="' + esc(L.clave) + '">' +
        fotoHtml +
        '<div class="lp-item-txt"><b>' + esc(L.nombre) + '</b><span>' + (L.sku ? 'SKU ' + esc(L.sku) : esc(L.seccion || 'Lista con acuerdo')) + (esCanje ? ' · Plan canje' : '') + '</span><em>' + money(L.precio) + '</em></div>' +
        '<div class="lp-qty">' +
          (q ? '<button type="button" class="ghost" data-act="menos" aria-label="Quitar">−</button><i>' + q + '</i>' : '') +
          '<button type="button" data-act="mas" aria-label="Agregar">+</button>' +
        '</div></div>';
    });
    host.innerHTML = html;
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
    if (!fab._lpBound) {
      fab._lpBound = true;
      fab.onclick = abrirSheet;
    }
  }


  function pagoGet() {
    try { return JSON.parse(localStorage.getItem(LS_PAGO) || '{}') || {}; } catch (e) { return {}; }
  }
  function pagoSet(cuotas, banco) {
    try { localStorage.setItem(LS_PAGO, JSON.stringify({ cuotas: cuotas, banco: banco || '' })); } catch (e) {}
  }
  function pagoActual() {
    var g = pagoGet();
    var banco = g.banco || '';
    var bancos = PLANES.bancos || [];
    var b = null;
    for (var i = 0; i < bancos.length; i++) if (bancos[i].id === banco) b = bancos[i];
    if (!b) return { cuotas: 1, banco: null };
    var c = Number(g.cuotas) || 1;
    if (b.cuotas && b.cuotas.indexOf(c) < 0) c = b.cuotas[b.cuotas.length - 1] || 1;
    return { cuotas: c, banco: b };
  }
  function opsCuotas(banco) {
    if (banco && banco.cuotas && banco.cuotas.length) return banco.cuotas.slice();
    return (PLANES.cuotas && PLANES.cuotas.length) ? PLANES.cuotas.slice() : [3, 6, 9, 12, 15, 18];
  }

  function markOverflow(el) {
    if (!el) return;
    var wrap = el.parentElement;
    if (!wrap || !wrap.classList.contains('lp-chips-wrap')) return;
    var more = el.scrollWidth > el.clientWidth + 6;
    var end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
    wrap.classList.toggle('lp-more', more && !end);
  }
  function hintChips(el) {
    if (!el || el._lpHint) return;
    var max = el.scrollWidth - el.clientWidth;
    if (max < 20) { markOverflow(el); return; }
    el._lpHint = true;
    var t0 = 0;
    function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
    function frame(now) {
      if (!t0) t0 = now;
      var p = (now - t0) / 1900;
      if (p >= 1) {
        el.scrollLeft = 0;
        el._lpHint = false;
        markOverflow(el);
        return;
      }
      var u = p < 0.55 ? ease(p / 0.55) : ease((1 - p) / 0.45);
      el.scrollLeft = max * 0.72 * u;
      markOverflow(el);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  function pintarPago() {
    var hostC = $('lpCuotas'), hostB = $('lpBancos');
    var lab = $('lpCuotasLab'), wrapC = $('lpCuotasWrap');
    if (!hostB) return;
    var g = pagoGet();
    var bancos = PLANES.bancos || [];
    var bancoId = g.banco || '';
    var bAct = null;
    for (var i = 0; i < bancos.length; i++) if (bancos[i].id === bancoId) bAct = bancos[i];
    var cAct = Number(g.cuotas) || 1;
    if (!bAct) cAct = 1;
    else if (bAct.cuotas && bAct.cuotas.indexOf(cAct) < 0) {
      cAct = bAct.cuotas[bAct.cuotas.length - 1] || 1;
      pagoSet(cAct, bancoId);
    }
    hostB.innerHTML = '<div class="lp-chips-in">' +
      '<button type="button" class="lp-chip' + (!bAct ? ' on' : '') + '" data-banco="">Contado</button>' +
      bancos.map(function (b) {
        return '<button type="button" class="lp-chip' + (bancoId === b.id ? ' on' : '') + '" data-banco="' + esc(b.id) + '">' + esc(b.nombre) + '</button>';
      }).join('') + '</div>';
    if (lab) lab.hidden = !bAct;
    if (wrapC) wrapC.hidden = !bAct;
    if (hostC) {
      if (!bAct) hostC.innerHTML = '';
      else {
        var ops = (bAct.cuotas && bAct.cuotas.length) ? bAct.cuotas : (PLANES.cuotas || [3, 6, 9, 12, 15, 18]);
        hostC.innerHTML = '<div class="lp-chips-in lp-cuotas-in">' + ops.map(function (n) {
          return '<button type="button" class="lp-chip' + (cAct === n ? ' on' : '') + '" data-cuotas="' + n + '">' + n + ' cuotas</button>';
        }).join('') + '</div>';
      }
    }
    markOverflow(hostB);
    markOverflow(hostC);
    if (hostB && !hostB._lpBound) {
      hostB._lpBound = true;
      hostB.onclick = function (e) {
        var b = e.target.closest('[data-banco]');
        if (!b) return;
        var id = b.getAttribute('data-banco') || '';
        if (!id) { pagoSet(1, ''); pintarPago(); return; }
        var lista = PLANES.bancos || [];
        var ent = null;
        for (var i = 0; i < lista.length; i++) if (lista[i].id === id) ent = lista[i];
        var ops = (ent && ent.cuotas && ent.cuotas.length) ? ent.cuotas : (PLANES.cuotas || [3, 6, 9, 12]);
        var cur = Number(pagoGet().cuotas) || 0;
        var c = ops.indexOf(cur) >= 0 ? cur : ops[ops.length - 1];
        pagoSet(c, id);
        pintarPago();
        hintChips($('lpCuotas'));
      };
      hostB.addEventListener('scroll', function () { markOverflow(hostB); }, { passive: true });
    }
    if (hostC && !hostC._lpBound) {
      hostC._lpBound = true;
      hostC.onclick = function (e) {
        var b = e.target.closest('[data-cuotas]');
        if (!b) return;
        var n = Number(b.getAttribute('data-cuotas')) || 1;
        var cur = pagoGet();
        pagoSet(n, cur.banco || '');
        pintarPago();
      };
      hostC.addEventListener('scroll', function () { markOverflow(hostC); }, { passive: true });
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
  function videoDe(p) {
    // El catálogo manda: si trae el campo video (aunque sea '' = sin video
    // oficial, como la Válvula By Pass de la C3), se respeta tal cual.
    // Los pares de abajo son solo un espejo de emergencia para filas viejas
    // que no tengan el campo.
    if (p && p.video !== undefined && p.video !== null) return String(p.video);
    var n = String((p && p.nombre) || '').toUpperCase();
    var pares = [
      // Espejo del catálogo (scripts/actualizar-precios-psa.py): videos
      // oficiales del canal de PSA. Sin match no se inventa un video: la
      // ficha queda sin botón "Ver video" antes que mostrar otro producto.
      ['SENIOR4', 'https://www.youtube.com/watch?v=ZGPO3UHxzE0'],
      ['SENIOR 4', 'https://www.youtube.com/watch?v=ZGPO3UHxzE0'],
      ['SENIK', 'https://www.youtube.com/watch?v=ucPCBNzhCMk'],
      ['S-1000', 'https://www.youtube.com/watch?v=BS7UWVGkyXY'],
      ['S·1000', 'https://www.youtube.com/watch?v=BS7UWVGkyXY'],
      ['S•1000', 'https://www.youtube.com/watch?v=BS7UWVGkyXY'],
      ['QUANTUM', 'https://www.youtube.com/watch?v=HfTdeEr2V6E'],
      ['VERO', 'https://www.youtube.com/watch?v=EEXBGZNXAYg'],
      ['MINI', 'https://www.youtube.com/watch?v=kRXtseGEA8M'],
      ['RINNOVA', 'https://www.youtube.com/watch?v=tQV4c9p9TBQ'],
      ['DUCHA II', 'https://www.youtube.com/watch?v=wII81hqX9MU'],
      ['DUCHA', 'https://www.youtube.com/watch?v=tQV4c9p9TBQ'],
      ['IONTRIX 2', 'https://www.youtube.com/watch?v=kgeNCoHLCL0'],
      ['IONTRIX2', 'https://www.youtube.com/watch?v=kgeNCoHLCL0'],
      ['IONTRIX', 'https://www.youtube.com/watch?v=LUyjCSVjF_c'],
      ['BICO', 'https://www.youtube.com/watch?v=2qL60kBDUlU'],
      ['GRIFER', 'https://www.youtube.com/watch?v=2qL60kBDUlU'],
      ['BY PASS', 'https://www.youtube.com/watch?v=2qL60kBDUlU'],
      ['BURBY', 'https://www.youtube.com/watch?v=f8Jb7wtu0tw'],
      ['SODA', 'https://www.youtube.com/watch?v=f8Jb7wtu0tw'],
      ['GASIFICADOR', 'https://www.youtube.com/watch?v=f8Jb7wtu0tw'],
      ['TÉRMICA', 'https://www.youtube.com/watch?v=lMJQB3PGIeI'],
      ['TERMICA', 'https://www.youtube.com/watch?v=lMJQB3PGIeI'],
      ['NEO', 'https://www.youtube.com/watch?v=s566uSsra_w'],
      ['VIDRIO', 'https://www.youtube.com/watch?v=UOTr9jI26Og'],
      ['MATE', 'https://www.youtube.com/watch?v=gg_xh3VwuUI'],
      ['TERMO', 'https://www.youtube.com/watch?v=gg_xh3VwuUI'],
      ['SENIOR', 'https://www.youtube.com/watch?v=__ISvWioYow'],
      ['AIRE', 'https://www.youtube.com/watch?v=VV3CgvUgD78'],
      ['ROPOT', 'https://www.youtube.com/watch?v=yh4dwgb21Xc'],
      ['OSMOSIS', 'https://www.youtube.com/watch?v=yh4dwgb21Xc'],
      ['ÓSMOSIS', 'https://www.youtube.com/watch?v=yh4dwgb21Xc'],
      ['MEMBRANA', 'https://www.youtube.com/watch?v=yh4dwgb21Xc'],
      ['BACTERIO', 'https://www.youtube.com/watch?v=kz31j16L_cQ']
    ];
    for (var i = 0; i < pares.length; i++) {
      if (n.indexOf(pares[i][0]) >= 0) return pares[i][1];
    }
    return '';
  }
  function trataDe(p) {
    var n = String((p && p.nombre) || '').toUpperCase();
    if (!n || (p && p.grupo && p.grupo !== 'equipos')) return [];
    if (/BURBY|SODA/.test(n) && n.indexOf('DUCHA') < 0) return [];
    // Poli 2 (cañerías) vs ducha con poli
    if (/POLI\s*2|POLI2/.test(n) && n.indexOf('DUCHA') < 0 && n.indexOf('RINNOVA') < 0) return ['dureza'];
    for (var i = 0; i < TRATA_EQ.length; i++) {
      for (var j = 0; j < TRATA_EQ[i].k.length; j++) {
        if (n.indexOf(TRATA_EQ[i].k[j]) >= 0) return TRATA_EQ[i].keys.slice();
      }
    }
    return [];
  }
  function botFmt(n, d) {
    return Number(n).toLocaleString('es-AR', { maximumFractionDigits: d || 0, minimumFractionDigits: 0 });
  }
  function botEquivArea(m2) {
    if (m2 < 2) return 'como una mesa de café';
    if (m2 < 10) return 'como una habitación chica';
    if (m2 < 16) return 'como una plaza de estacionamiento';
    if (m2 < 50) return 'como un living comedor';
    if (m2 < 261) return 'como un departamento de ' + Math.round(m2) + ' m²';
    return 'como ' + botFmt(m2 / 261, 1) + ' canchas de tenis';
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
  function cmpDe(p, qty) {
    qty = qty || 1;
    var litroEnv = Math.max(1, Number(botGet().litro) || ENV_L);
    var v = vidaDe(p);
    if (!v || !v.litros || !v.purif) return null;
    var nomU = String((p && p.nombre) || '').toUpperCase();
    if (/RINNOVA|DUCHA|BURBY|SODA|STOPPER|POLI\s*2|AIRE|IONTRIX/.test(nomU)) return null;
    if (p && p.grupo && p.grupo !== 'equipos') return null;
    var unit = Number(p.precio) || 0;
    var yEq = costosAnios(unit, v.meses || 0, qty);
    var totEq = yEq[0] + yEq[1] + yEq[2];
    var litros3 = qty * v.litros * (36 / (v.meses || 36));
    var litroEq = litros3 > 0 ? totEq / litros3 : 0;
    var kg3 = litros3 * ENV_G / 1000;
    var tit = sinMarca(p.nombre) || p.nombre || '';
    if (v.kit) tit += ' + Kit posventa';
    var compra = unit * qty;
    function mesesPago(lDia) {
      var mesEnv = lDia * (365 / 12) * litroEnv;
      return mesEnv > 0 ? compra / mesEnv : 0;
    }
    var filas = ENV_ESC.map(function (esc) {
      var anual = esc.l * 365 * litroEnv;
      var tot = anual * 3;
      return { esc: esc, anual: anual, tot: tot, ahorro: Math.max(0, tot - totEq), meses: mesesPago(esc.l) };
    });
    var botDia = 2;
    var botAnioN = botDia * 365;
    var kgBot = botAnioN * BOT_G / 1000;
    var m2 = botAnioN * BOT_M2;
    var dia4 = 4 * litroEnv;
    return {
      litroEnv: litroEnv, yEq: yEq, totEq: totEq, litroEq: litroEq,
      kgY: kg3 / 3, kg3: kg3, tit: tit, filas: filas, litros3: litros3,
      compra: compra, meses: v.meses || 0, m4: mesesPago(4),
      dia4: dia4, mes4: dia4 * 30, anio4: 4 * 365 * litroEnv, tres4: 4 * 365 * litroEnv * 3,
      kgBot: kgBot, m2: m2, petro: kgBot * BOT_PETROLEO, area: botEquivArea(m2), aniosBot: BOT_ANIOS
    };
  }
  function txtMeses(n) {
    if (!n || n <= 0) return '';
    var m = Math.ceil(n);
    if (m <= 1) return '1 mes';
    if (m < 24) return m + ' meses';
    var a = Math.round(n / 12);
    return a <= 1 ? '1 año' : (a + ' años');
  }
  function htmlCmp(c) {
    if (!c) return '';
    var filas = c.filas.map(function (f) {
      return '<tr><td><b>' + esc(f.esc.t) + '</b><small>' + esc(f.esc.s) + '</small></td>' +
        '<td>' + money(f.anual) + '</td><td>' + money(f.anual) + '</td><td>' + money(f.anual) + '</td>' +
        '<td>' + money(f.tot) + '</td><td class="lp-aho">' + money(f.ahorro) + '</td></tr>';
    }).join('');
    var pay = c.m4 > 0
      ? ('Se paga solo en <b>' + esc(txtMeses(c.m4)) + '</b>. Lo que un hogar de 4 litros diarios gasta en agua envasada cubre el equipo; después el litro sale ' + money2(c.litroEq) + ' en vez de ' + money(c.litroEnv) + '.')
      : ('Cada litro del equipo sale ' + money2(c.litroEq) + ' contra ' + money(c.litroEnv) + ' el litro envasado.');
    var plast =
      '<div class="lp-eco-bolsa">Hogar de 4 L/día: <b>' + money(c.dia4) + ' por día</b> · ' + money(c.mes4) + ' al mes · ' + money(c.anio4) + ' al año · ' + money(c.tres4) + ' en 3 años. Con el equipo, esa plata vuelve al bolsillo.</div>' +
      '<div class="lp-eco-grid">' +
        '<div class="lp-eco-item"><b>' + botFmt(c.kgBot, 1) + ' kg</b><small>de plástico por año (2 botellas de 2 L/día)</small></div>' +
        '<div class="lp-eco-item"><b>' + botFmt(c.m2, 1) + ' m²</b><small>si las tirás al piso · ' + esc(c.area) + '</small></div>' +
        '<div class="lp-eco-item"><b>' + botFmt(c.petro, 0) + ' L</b><small>de petróleo para fabricar ese plástico</small></div>' +
        '<div class="lp-eco-item"><b>' + c.aniosBot + ' años</b><small>tarda cada botella en descomponerse</small></div>' +
      '</div>' +
      (c.kg3 > 0 ? ('<p class="lp-cmp-plst">Si se usa el rendimiento del equipo: <b>' + botFmt(c.kg3, 0) + ' kg</b> menos de plástico en 3 años.</p>') : '');
    return '<div class="lp-cmp">' +
      '<div class="lp-cmp-h">Comparativa de costos</div>' +
      '<p class="lp-cmp-pay">' + pay + '</p>' +
      '<p class="lp-cmp-sub"><b>' + esc(c.tit) + '</b> vs. agua envasada</p>' +
      '<div class="lp-cmp-scroll"><table class="lp-cmp-tb"><thead><tr><th></th><th>1er año</th><th>2do año</th><th>3er año</th><th>Gasto total</th><th>Ahorro</th></tr></thead><tbody>' +
        '<tr class="lp-cmp-eq"><td><b>' + esc(c.tit) + '</b>' + (c.litroEq ? '<small>Costo litro ' + money2(c.litroEq) + '</small>' : '') + '</td>' +
          '<td>' + celAnio(c.yEq[0]) + '</td><td>' + celAnio(c.yEq[1]) + '</td><td>' + celAnio(c.yEq[2]) + '</td>' +
          '<td>' + money(c.totEq) + '</td><td></td></tr>' +
        '<tr class="lp-cmp-ag"><td colspan="6">agua envasada</td></tr>' +
        filas +
      '</tbody></table></div>' + plast + '</div>';
  }
  function pintarEco() {
    var host = $('lpEco');
    if (!host) return;
    var r = resumen();
    if (!r.n) { host.innerHTML = ''; return; }
    var bloques = r.lineas.map(function (ln) { return cmpDe(ln.p, ln.q); }).filter(Boolean);
    if (!bloques.length) { host.innerHTML = ''; return; }
    var litroEnv = Math.round(bloques[0].litroEnv);
    host.innerHTML =
      '<label class="lp-cmp-litro">Litro de agua envasada $ <input id="lpLitroEnv" type="number" min="1" step="1" value="' + litroEnv + '"></label>' +
      bloques.map(htmlCmp).join('');
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
      return '<div class="lp-line" data-sku="' + esc(ln.p.clave || claveSku(ln.p)) + '">' +
        '<div class="lp-qty"><button type="button" class="ghost" data-act="menos">−</button><i>' + ln.q + '</i>' +
        '<button type="button" data-act="mas">+</button></div>' +
        '<b>' + esc(ln.p.nombre) + '</b><span>' + money(ln.q * ln.p.precio) + '</span></div>';
    }).join('');
    if (tot) tot.textContent = 'Total ' + money(r.tot);
    pintarGanancia();
    pintarPago();
    var eco = $('lpEco'); if (eco) eco.innerHTML = '';
    var pdfBtn = $('lpSheetPdf'); if (pdfBtn && !pdfBtn.disabled) pdfBtn.textContent = 'Cotizar';
  }

  function abrirSheet() {
    var sh = $('lpSheet');
    if (!sh) return;
    pintarSheet();
    sh.classList.add('open');
    cargarPerfil();
    sh.setAttribute('aria-hidden', 'false');
    setTimeout(function () { hintChips($('lpBancos')); }, 280);
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
  function datosDistribuidor() {
    var perfil = (window.APPIAuth && window.APPIAuth.currentProfile) ? (window.APPIAuth.currentProfile() || {}) : {};
    var persona = (window.APPIAuth && window.APPIAuth.activePerson) ? window.APPIAuth.activePerson() : null;
    return {
      nombre: String((persona && persona.nombre) || perfil.nombre || '').trim(),
      dip: String(perfil.dip || perfil.numero_distribuidor || '').trim(),
      sucursal: String(perfil.sucursal || '').trim()
    };
  }
  function loadFotoCirculo(src) {
    if (!src) return Promise.resolve('');
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        var s = 360, c = document.createElement('canvas');
        c.width = c.height = s;
        var ctx = c.getContext('2d');
        ctx.fillStyle = '#f3eee3';
        ctx.fillRect(0, 0, s, s);
        ctx.beginPath();
        ctx.arc(s / 2, s / 2, s / 2 - 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        var sc = Math.max(s / img.width, s / img.height);
        var w = img.width * sc, h = img.height * sc;
        ctx.drawImage(img, (s - w) / 2, (s - h) / 2, w, h);
        resolve(c.toDataURL('image/jpeg', 0.88));
      };
      img.onerror = function () { resolve(''); };
      img.src = src;
    });
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
    var fotoRaw = '';
    try { fotoRaw = localStorage.getItem('appi_foto_perfil_v1') || ''; } catch (e) {}
    if (fotoRaw && fotoRaw.charAt(0) === '{') {
      try {
        var fo = JSON.parse(fotoRaw);
        fotoRaw = (fo && (fo.preview || fo.img)) || '';
      } catch (e2) { fotoRaw = ''; }
    }
    Promise.all([
      Promise.all(r.lineas.map(function (ln) { return loadFoto(ln.p); })),
      loadFotoCirculo(fotoRaw)
    ]).then(function (pack) {
    var fotos = pack[0];
    var fotoCirculo = pack[1];
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
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor.apply(pdf, gris);
        pdf.text(n + ' / ' + tot, W - m, H - 7, { align: 'right' });
      }
      function botonVideo(x, y, w, h, url) {
        pdf.setFillColor.apply(pdf, azul);
        pdf.roundedRect(x, y, w, h, 2.2, 2.2, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(Math.max(7, Math.min(10, h - 2)));
        pdf.text('Ver video', x + w / 2, y + h / 2 + 1.1, { align: 'center' });
        pdf.link(x, y, w, h, { url: url });
      }

      pdf.setFillColor.apply(pdf, crema);
      pdf.rect(0, 0, W, H, 'F');
      var dist = datosDistribuidor();
      var fotoOk = false;
      var dFoto = 24;
      if (fotoCirculo) {
        try { pdf.addImage(fotoCirculo, 'JPEG', m, 8, dFoto, dFoto); fotoOk = true; } catch (e) { fotoOk = false; }
      }
      if (fotoOk) {
        pdf.setDrawColor.apply(pdf, azul);
        pdf.setLineWidth(0.45);
        pdf.circle(m + dFoto / 2, 8 + dFoto / 2, dFoto / 2);
      }
      var xTxt = fotoOk ? m + dFoto + 5 : m;
      var yTxt = 15;
      if (dist.nombre) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(13);
        pdf.setTextColor.apply(pdf, oscuro);
        pdf.text(dist.nombre, xTxt, yTxt);
        yTxt += 6;
      }
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor.apply(pdf, gris);
      if (dist.dip) { pdf.text('Distribuidor ' + dist.dip, xTxt, yTxt); yTxt += 5; }
      if (dist.sucursal) { pdf.text('Sucursal ' + dist.sucursal, xTxt, yTxt); yTxt += 5; }
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.setTextColor.apply(pdf, azul);
      pdf.text('PRESUPUESTO', W - m, 16, { align: 'right' });
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor.apply(pdf, gris);
      pdf.text(hoy || fecha || '', W - m, 22, { align: 'right' });
      pdf.text('Precios de lista', W - m, 27, { align: 'right' });
      var yLinea = Math.max(fotoOk ? 36 : 32, yTxt + 3);
      pdf.setDrawColor.apply(pdf, azul);
      pdf.setLineWidth(1.15);
      pdf.line(m, yLinea, W - m, yLinea);
      pdf.setLineWidth(0.28);
      pdf.line(m, yLinea + 2.2, W - m, yLinea + 2.2);

      var y = yLinea + 12;
      if (para) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor.apply(pdf, gris);
        pdf.text('PARA', m, y);
        pdf.setFontSize(13);
        pdf.setTextColor.apply(pdf, oscuro);
        pdf.text(para, m, y + 7);
        y += 16;
      }

      var usable = W - 2 * m;
      var xCant = m + 118;
      var xPre = m + 140;
      var rowH = 9;
      pdf.setFillColor.apply(pdf, azul);
      pdf.rect(m, y, usable, 9, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.text('Descripción', m + 3, y + 6);
      pdf.text('Cant.', xCant, y + 6);
      pdf.text('P. unitario', xPre, y + 6);
      pdf.text('Subtotal', W - m - 3, y + 6, { align: 'right' });
      y += 9;
      var yTable = y;
      r.lineas.forEach(function (ln, i) {
        if (y > H - 56) {
          pdf.setDrawColor.apply(pdf, azul);
          pdf.setLineWidth(0.35);
          pdf.rect(m, yTable - 9, usable, y - (yTable - 9));
          pie(pdf.internal.getNumberOfPages(), '?');
          pdf.addPage();
          pdf.setFillColor.apply(pdf, crema);
          pdf.rect(0, 0, W, H, 'F');
          y = 36;
          yTable = y + 9;
          pdf.setFillColor.apply(pdf, azul);
          pdf.rect(m, y, usable, 9, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8);
          pdf.text('Descripción', m + 3, y + 6);
          pdf.text('Cant.', xCant, y + 6);
          pdf.text('P. unitario', xPre, y + 6);
          pdf.text('Subtotal', W - m - 3, y + 6, { align: 'right' });
          y += 9;
        }
        if (i % 2 === 0) {
          pdf.setFillColor(252, 249, 242);
          pdf.rect(m, y, usable, rowH, 'F');
        }
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.5);
        pdf.setTextColor.apply(pdf, oscuro);
        var nom = pdf.splitTextToSize(sinMarca(ln.p.nombre) || ln.p.nombre || '', xCant - m - 6);
        pdf.text(nom[0] || '', m + 3, y + 6);
        pdf.text(String(ln.q), xCant + 8, y + 6);
        pdf.text(money(ln.p.precio), xPre, y + 6);
        pdf.setFont('helvetica', 'bold');
        pdf.text(money(ln.q * ln.p.precio), W - m - 3, y + 6, { align: 'right' });
        y += rowH;
      });
      pdf.setDrawColor.apply(pdf, azul);
      pdf.setLineWidth(0.4);
      pdf.rect(m, yTable - 9, usable, y - (yTable - 9));
      pdf.line(xCant - 2, yTable - 9, xCant - 2, y);
      pdf.line(xPre - 2, yTable - 9, xPre - 2, y);

      y += 8;
      var totW = 72;
      var totX = W - m - totW;
      pdf.setFillColor.apply(pdf, azul);
      pdf.rect(totX, y, totW, 12, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('TOTAL', totX + 4, y + 8);
      pdf.text(money(r.tot), totX + totW - 4, y + 8, { align: 'right' });
      y += 18;

      var pago = pagoActual();
      var ops = pago.banco ? opsCuotas(pago.banco) : [];
      var filasFin = 1 + ops.length;
      var altoFin = 10 + filasFin * 7.2 + 6;
      if (y + altoFin > H - 28) {
        pie(pdf.internal.getNumberOfPages(), '?');
        pdf.addPage();
        pdf.setFillColor.apply(pdf, crema);
        pdf.rect(0, 0, W, H, 'F');
        y = 28;
      }
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor.apply(pdf, oscuro);
      pdf.text('FINANCIACIÓN', m, y);
      y += 8;
      function lineaFin(pref, monto, extra) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(11);
        pdf.setTextColor.apply(pdf, oscuro);
        pdf.text(pref, m, y);
        var w1 = pdf.getTextWidth(pref);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12.5);
        var mon = money(monto);
        pdf.text(mon, m + w1, y);
        if (extra) {
          var w2 = pdf.getTextWidth(mon);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(11);
          pdf.text(extra, m + w1 + w2, y);
        }
        y += 7.2;
      }
      lineaFin('1 pago de ', r.tot, '');
      ops.forEach(function (n) {
        lineaFin(n + ' pagos de ', r.tot / n, ' sin interés');
      });
      y += 4;
      if (pago.banco) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor.apply(pdf, gris);
        var det = [pago.banco.nombre];
        if (pago.banco.tarjetas) det.push(pago.banco.tarjetas);
        if (PLANES.vigencia) det.push('Vigencia ' + PLANES.vigencia);
        pdf.text(det.join('  ·  '), m, y);
        y += 8;
      }

      pdf.setDrawColor.apply(pdf, azul);
      pdf.setLineWidth(0.28);
      pdf.line(m, H - 22, W - m, H - 22);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor.apply(pdf, azul);
      pdf.text('Condiciones', m, H - 22);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor.apply(pdf, gris);
      var cond = 'Los precios de lista pueden variar según las promociones vigentes de cada tarjeta y el criterio de la empresa.';
      if (fecha) cond += '  ·  ' + fecha;
      pdf.text(pdf.splitTextToSize(cond, W - 2 * m), m, H - 17);

      var naranja = [229, 106, 23];
      var usable = W - 2 * m;
      var colW = [52, 20, 20, 20, 32, 34];
      function colX(i) {
        var x = m;
        for (var k = 0; k < i; k++) x += colW[k];
        return x;
      }
      function colR(i) { return colX(i) + colW[i] - 1.8; }

      function dibujarTabla(c, yy) {
        pdf.setFillColor.apply(pdf, azul);
        pdf.roundedRect(m, yy, usable, 8, 1.5, 1.5, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.5);
        var heads = ['', '1er año', '2do año', '3er año', 'Gasto total', 'Ahorro'];
        heads.forEach(function (h, i) {
          if (!h) return;
          pdf.text(h, colR(i), yy + 5.4, { align: 'right' });
        });
        yy += 8;
        function fila(label, sub, a1, a2, a3, tot, aho, eq) {
          if (eq) { pdf.setFillColor(232, 240, 244); pdf.rect(m, yy, usable, 8, 'F'); }
          pdf.setTextColor.apply(pdf, oscuro);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(7);
          var lab = pdf.splitTextToSize(label, colW[0] - 4);
          pdf.text(lab[0] || '', m + 2, yy + (sub ? 3.3 : 5.3));
          if (sub) {
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(6);
            pdf.setTextColor.apply(pdf, gris);
            pdf.text(sub, m + 2, yy + 6.8);
          }
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(7);
          pdf.setTextColor.apply(pdf, oscuro);
          pdf.text(celAnio(a1), colR(1), yy + 5.3, { align: 'right' });
          pdf.text(celAnio(a2), colR(2), yy + 5.3, { align: 'right' });
          pdf.text(celAnio(a3), colR(3), yy + 5.3, { align: 'right' });
          pdf.text(tot ? money(tot) : '', colR(4), yy + 5.3, { align: 'right' });
          if (aho) {
            pdf.setTextColor.apply(pdf, naranja);
            pdf.text(money(aho), colR(5), yy + 5.3, { align: 'right' });
          }
          yy += 8;
        }
        fila(c.tit, c.litroEq ? 'Costo litro ' + money2(c.litroEq) : '', c.yEq[0], c.yEq[1], c.yEq[2], c.totEq, 0, true);
        pdf.setFillColor(238, 243, 246);
        pdf.rect(m, yy, usable, 6.2, 'F');
        pdf.setTextColor.apply(pdf, azul);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.5);
        pdf.text('AGUA ENVASADA', m + 2, yy + 4.3);
        yy += 6.2;
        c.filas.forEach(function (f) {
          fila(f.esc.t, f.esc.s, f.anual, f.anual, f.anual, f.tot, f.ahorro, false);
        });
        return yy;
      }

      function dibujarPlaneta(c, yy) {
        pdf.setFillColor(255, 244, 232);
        pdf.roundedRect(m, yy, usable, 11, 1.8, 1.8, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.5);
        pdf.setTextColor.apply(pdf, oscuro);
        pdf.text('4 L/día envasada:  ' + money(c.dia4) + '/día  ·  ' + money(c.mes4) + '/mes  ·  ' + money(c.anio4) + '/año  ·  ' + money(c.tres4) + ' en 3 años', m + 3, yy + 7);
        yy += 13;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor.apply(pdf, azul);
        pdf.text('Al planeta', m, yy);
        yy += 3.2;
        var boxW = (usable - 9) / 4;
        var kpis = [
          [botFmt(c.kgBot, 1) + ' kg', 'plástico / año'],
          [botFmt(c.m2, 1) + ' m²', c.area],
          [botFmt(c.petro, 0) + ' L', 'petróleo'],
          [String(c.aniosBot) + ' años', 'en descomponerse']
        ];
        kpis.forEach(function (k, i) {
          var bx = m + i * (boxW + 3);
          pdf.setFillColor(243, 238, 227);
          pdf.roundedRect(bx, yy, boxW, 14, 1.6, 1.6, 'F');
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8);
          pdf.setTextColor.apply(pdf, azul);
          pdf.text(k[0], bx + boxW / 2, yy + 5.5, { align: 'center' });
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(5.8);
          pdf.setTextColor.apply(pdf, gris);
          var sub = pdf.splitTextToSize(k[1], boxW - 3);
          pdf.text(sub[0] || '', bx + boxW / 2, yy + 10.5, { align: 'center' });
        });
        return yy + 16;
      }

      function dibujarCmp(c, yy) {
        if (!c) return yy;
        pdf.setFillColor(255, 244, 232);
        pdf.roundedRect(m, yy, usable, 13, 1.8, 1.8, 'F');
        pdf.setTextColor.apply(pdf, naranja);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        var pay1 = c.m4 > 0 ? ('Se paga solo en ' + txtMeses(c.m4) + '.') : 'Compará el litro contra el agua envasada.';
        pdf.text(pay1, m + 3, yy + 5);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.setTextColor.apply(pdf, oscuro);
        var pay2 = c.litroEq
          ? ('Con 4 L/día el ahorro cubre el equipo. Después el litro sale ' + money2(c.litroEq) + ' en vez de ' + money(c.litroEnv) + '.')
          : '';
        if (pay2) pdf.text(pay2, m + 3, yy + 10.5);
        yy += 17;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor.apply(pdf, azul);
        pdf.text('Comparativa de costos  ·  vs. agua envasada', m, yy);
        yy += 4.2;
        yy = dibujarTabla(c, yy);
        yy += 3.5;
        yy = dibujarPlaneta(c, yy);
        return yy;
      }

      function nuevaFicha() {
        pdf.addPage();
        encabezado('Ficha de producto');
        return 36;
      }
      function cabe(yy, h) {
        if (yy + h < H - 16) return yy;
        return nuevaFicha();
      }

      r.lineas.forEach(function (ln, ix) {
        var yy = nuevaFicha();
        var p = ln.p;
        var foto = fotos[ix] || '';
        var imgW = 36;
        var c = cmpDe(p, ln.q);
        var keys = trataDe(p);
        var hasVid = !!videoDe(p);
        var qrW = hasVid ? 24 : 0;
        var tx = m;
        var tw = usable;
        if (foto) {
          pdf.setFillColor(255, 255, 255);
          pdf.roundedRect(m, yy, imgW + 2, imgW + 2, 1.8, 1.8, 'F');
          try { pdf.addImage(foto, 'JPEG', m + 1, yy + 1, imgW, imgW); } catch (e1) {
            try { pdf.addImage(foto, 'PNG', m + 1, yy + 1, imgW, imgW); } catch (e2) {}
          }
          tx = m + imgW + 7;
          tw = W - m - tx - (hasVid ? qrW + 8 : 0);
        } else if (hasVid) {
          tw = usable - qrW - 8;
        }
        pdf.setTextColor.apply(pdf, oscuro);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        var tit = pdf.splitTextToSize(sinMarca(p.nombre) || p.nombre || '', Math.max(40, tw));
        if (tit.length > 2) tit = tit.slice(0, 2);
        pdf.text(tit, tx, yy + 6);
        var yTit = yy + 6 + tit.length * 5.2;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor.apply(pdf, gris);
        pdf.text('SKU ' + (p.sku || ''), tx, yTit + 3);
        pdf.setTextColor.apply(pdf, oscuro);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text(ln.q + ' × ' + money(p.precio) + '   ·   ' + money(ln.q * p.precio), tx, yTit + 10);
        if (c && c.litroEq) {
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(7.5);
          pdf.setTextColor.apply(pdf, gris);
          pdf.text('Costo litro ' + money2(c.litroEq) + '   ·   envasada ' + money(c.litroEnv), tx, yTit + 16);
        }
        if (hasVid) {
          var qx = W - m - qrW;
          var data = qrDataUrl(videoDe(p));
          if (data) {
            try { pdf.addImage(data, 'GIF', qx, yy, qrW, qrW); } catch (e) {}
            pdf.link(qx, yy, qrW, qrW, { url: videoDe(p) });
          }
          botonVideo(qx - 8, yy + qrW + 2, qrW + 8, 11, videoDe(p));
        }
        var yHead = Math.max(yy + (foto ? imgW + 4 : 0), yTit + (c ? 20 : 14), hasVid ? yy + qrW + 16 : 0);
        yy = yHead + 2;
        pdf.setDrawColor(11, 88, 120);
        pdf.setLineWidth(0.3);
        pdf.line(m, yy, W - m, yy);
        yy += 5.5;
        pdf.setTextColor.apply(pdf, azul);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.text('Para qué sirve', m, yy);
        yy += 4.5;
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor.apply(pdf, oscuro);
        pdf.setFontSize(8);
        var cuerpo = sinMarca(p.desc || p.para || 'Sin descripción cargada.').replace(/\n+/g, ' ');
        var lineasTxt = pdf.splitTextToSize(cuerpo, usable);
        if (lineasTxt.length > 2) lineasTxt = lineasTxt.slice(0, 2);
        pdf.text(lineasTxt, m, yy);
        yy += lineasTxt.length * 3.8 + 7;
        if (keys.length) {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(9);
          pdf.setTextColor.apply(pdf, azul);
          pdf.text('Qué trata y por qué sacarlo', m, yy);
          yy += 5.5;
          pdf.setFont('helvetica', 'italic');
          pdf.setFontSize(7.2);
          pdf.setTextColor.apply(pdf, oscuro);
          var intro = pdf.splitTextToSize(TRATA_INTRO, usable);
          if (intro.length > 2) intro = intro.slice(0, 2);
          pdf.text(intro, m, yy);
          yy += intro.length * 3.45 + 5;
          var col = keys.length >= 3;
          var gapC = 10;
          var colWtrata = col ? (usable - gapC) / 2 : usable;
          var yCol = [yy, yy];
          var ci = 0;
          keys.forEach(function (k) {
            var info = TRATA[k];
            if (!info) return;
            var x = col ? (m + (ci % 2) * (colWtrata + gapC)) : m;
            var yk = col ? yCol[ci % 2] : yy;
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(8);
            pdf.setTextColor.apply(pdf, azul);
            pdf.text(info.nom + '.', x, yk);
            yk += 4.4;
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(6.8);
            pdf.setTextColor.apply(pdf, oscuro);
            var body = pdf.splitTextToSize(info.txt, colWtrata);
            var maxB = col ? 6 : 4;
            if (body.length > maxB) body = body.slice(0, maxB);
            pdf.text(body, x, yk);
            yk += body.length * 3.3 + 5.2;
            if (col) { yCol[ci % 2] = yk; ci += 1; }
            else yy = yk;
          });
          yy = (col ? Math.max(yCol[0], yCol[1]) : yy) + 4;
        }
        if (c) yy = dibujarCmp(c, yy);
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
    if (btn) { btn.disabled = false; btn.textContent = 'Cotizar'; }
    }).catch(function () {
      aviso('No se pudo armar el PDF.');
      if (btn) { btn.disabled = false; btn.textContent = 'Cotizar'; }
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
    var actBtn=$('lpActualizar'); if(actBtn && !actBtn._lpBound){ actBtn._lpBound=true; actBtn.onclick=actualizarPrecios; }
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
      var fotoBtn = e.target.closest('[data-foto-popup]');
      if (fotoBtn) {
        e.stopPropagation();
        abrirFotoModal(fotoBtn.getAttribute('data-foto-popup'), fotoBtn.getAttribute('data-foto-tit'), fotoBtn.getAttribute('data-foto-sub'));
        return;
      }
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

  var _lpActualizando = false;
  function supabaseCfg(){ try{ return (window.APPI_AUTH && window.APPI_AUTH.url && window.APPI_AUTH.anonKey) ? window.APPI_AUTH : null; }catch(e){ return null; } }
  function tokenActual(){ try{ var v=JSON.parse(localStorage.getItem('appi_auth_session_v1')||'null'); return v&&v.session&&v.session.access_token||''; }catch(e){ return ''; } }
  function actualizarPrecios(){
    if(_lpActualizando) return;
    var btn=$('lpActualizar');
    var cfg=supabaseCfg();
    if(!cfg){ aviso('No se pudo conectar para actualizar.'); return; }
    _lpActualizando=true;
    if(btn){ btn.disabled=true; btn.textContent='⏳ Actualizando…'; btn.classList.remove('ok'); }
    var token=tokenActual();
    fetch(cfg.url + '/functions/v1/actualizar-precios', { method:'POST', headers: { 'Content-Type':'application/json', 'apikey': cfg.anonKey, 'Authorization': token ? 'Bearer ' + token : 'Bearer ' + cfg.anonKey } })
      .then(function(r){ return r.json().then(function(j){ return { ok:r.ok, j:j }; }); })
      .then(function(res){
        var j=res.j||{};
        if(!res.ok){ throw new Error(j.error||'No se pudo actualizar.'); }
        if(j.yaActualizado){ if(btn){ btn.textContent='✓ Al día (' + (j.actualizado||'') + ')'; btn.classList.add('ok'); } aviso(j.mensaje||'Ya está al día.'); }
        else { if(btn){ btn.textContent='✓ Actualizado (' + (j.actualizado||'') + ')'; btn.classList.add('ok'); } aviso('Precios actualizados: ' + (j.cambiados||0) + ' productos.'); cargar(function(){ var c=$('lpCont'); if(c) c.innerHTML=htmlLista(); bind(); pintarTodo(); }); }
      })
      .catch(function(e){ aviso(String(e.message||e)); if(btn){ btn.textContent='🔄 Actualizar precios'; } })
      .finally(function(){ _lpActualizando=false; if(btn) btn.disabled=false; setTimeout(function(){ if(btn && btn.classList.contains('ok')){ btn.textContent='🔄 Actualizar precios'; btn.classList.remove('ok'); } }, 3500); });
  }
  function cargar(done) {
    var bust = '?t=' + Date.now();
    var cfg=supabaseCfg();
    var supaCat = cfg ? cfg.url + '/storage/v1/object/public/catalogo-psa/psa-catalogo.json' + bust : null;
    var supaPlan = cfg ? cfg.url + '/storage/v1/object/public/catalogo-psa/psa-planes.json' + bust : null;
    var pCat = supaCat ? fetch(supaCat, { cache:'no-store' }).then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; }) : Promise.resolve(null);
    var pPlanS = supaPlan ? fetch(supaPlan, { cache:'no-store' }).then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; }) : Promise.resolve(null);
    var pGan = fetch('./psa-ganancias.json' + bust, { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    Promise.all([ pCat,
      pPlanS,
      pGan,
      fetch('./psa-catalogo.json' + bust, { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }),
      fetch('./psa-planes.json' + bust, { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
    ]).then(function (arr) {
      var supaCatJ = arr[0], supaPlanJ = arr[1], ganJ = arr[2], fileCat = arr[3], filePlan = arr[4];
      var catElegido = null;
      if(supaCatJ && supaCatJ.productos) catElegido = supaCatJ;
      else if(fileCat && fileCat.productos) catElegido = fileCat;
      var planElegido = null;
      if(supaPlanJ && (supaPlanJ.cuotas || supaPlanJ.bancos)) planElegido = supaPlanJ;
      else if(filePlan && (filePlan.cuotas || filePlan.bancos)) planElegido = filePlan;
      if (catElegido) {
        // Las fotos viven en el repo de la app (catalogo-img/). Si el catálogo
        // de Supabase es el elegido y no lleva la foto, se recupera por SKU
        // desde el catálogo local: la foto nunca queda atrás por la copia.
        if (fileCat && fileCat.productos && catElegido !== fileCat) {
          var fotoPorSku = {}, skuPorNombre = {}, fotoPorNombre = {};
          fileCat.productos.forEach(function (p) {
            if (p && p.foto) {
              if (p.sku) fotoPorSku[p.sku] = p.foto;
              if (p.nombre) {
                fotoPorNombre[p.nombre.trim().toUpperCase()] = p.foto;
                if (p.sku) skuPorNombre[p.nombre.trim().toUpperCase()] = p.sku;
              }
            }
          });
          catElegido.productos.forEach(function (p) {
            if (!p) return;
            var nom = (p.nombre || "").trim().toUpperCase();
            if (!p.sku && skuPorNombre[nom]) p.sku = skuPorNombre[nom];
            if (!p.foto) {
              if (p.sku && fotoPorSku[p.sku]) p.foto = fotoPorSku[p.sku];
              else if (nom && fotoPorNombre[nom]) p.foto = fotoPorNombre[nom];
            }
          });
        }
        CAT = catElegido;
      }
      if (planElegido) PLANES = planElegido;
      if (ganJ && ganJ.productos) GAN = ganJ;
      GAN_STATE = GAN ? 'ok' : 'fail';
      if (done) done();
    }).catch(function () { GAN_STATE = 'fail'; if (done) done(); });
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

  /* ===== v827 · Tu ganancia (SOLO para el distribuidor): margen real del
     presupuesto con las listas oficiales de PSA (psa-ganancias.json) + la
     columna de costo de SU cuenta (perfil sincronizado desde PSA).
     NUNCA se imprime en el PDF que ve el cliente. ===== */
  var LS_PERFIL = 'appi_dip_perfil_v1';
  var GAN = null;
  var GAN_STATE = 'loading';
  var PERFIL = null;
  function perfilLoad() {
    try {
      var j = JSON.parse(localStorage.getItem(LS_PERFIL) || 'null');
      if (j && j.perfil && j.ts) PERFIL = j.perfil;
    } catch (e) {}
  }
  function perfilSave(perfil) {
    try { localStorage.setItem(LS_PERFIL, JSON.stringify({ ts: Date.now(), perfil: perfil })); } catch (e) {}
    PERFIL = perfil;
  }
  function perfilFresco() {
    try {
      var j = JSON.parse(localStorage.getItem(LS_PERFIL) || 'null');
      return !!(j && j.ts && (Date.now() - j.ts) < 24 * 3600 * 1000 && j.perfil);
    } catch (e) { return false; }
  }
  function cargarPerfil(force) {
    perfilLoad();
    if (!force && perfilFresco()) { pintarGanancia(); return; }
    var cfg = supabaseCfg();
    var creds = null;
    try { creds = JSON.parse(localStorage.getItem('appsi_psa_creds') || 'null'); } catch (e) {}
    if (!cfg || !creds || !creds.center || !creds.number || !creds.password) { pintarGanancia(); return; }
    fetch(cfg.url + '/functions/v1/consulta-serial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': cfg.anonKey, 'Authorization': 'Bearer ' + (tokenActual() || cfg.anonKey) },
      body: JSON.stringify({ action: 'perfil', center: creds.center, number: creds.number, password: creds.password })
    }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) { if (res.ok && res.j && res.j.ok && res.j.perfil) perfilSave(res.j.perfil); pintarGanancia(); })
      .catch(function () { pintarGanancia(); });
  }
  function columnaPerfil() {
    var f = PERFIL || {};
    var trib = String(f.tributaria || '').toLowerCase();
    var cat = String(f.categoria || '').toLowerCase();
    var t = (trib.indexOf('no cat') >= 0 || trib.indexOf('no insc') >= 0) ? 'nc' : 'ri';
    var c = !cat ? 'c'
      : (cat.indexOf('lider') >= 0 || cat.indexOf('coordinador') >= 0 || cat.indexOf('calificado') >= 0) ? 'c'
      : (cat.indexOf('junior') >= 0) ? 'j' : 'd';
    return t + '_' + c;
  }
  function entradaGanancia(p) {
    if (!GAN || !GAN.productos) return null;
    var keys = [];
    if (p.sku) keys.push(p.sku);
    var base = String(p.nombre || '').replace(/\s*\(PLAN CANJE\)\s*$/i, '').trim();
    keys.push('n:' + base.toLowerCase());
    for (var i = 0; i < keys.length; i++) { var e = GAN.productos[keys[i]]; if (e) return e; }
    return null;
  }
  function gananciaResumen() {
    var r = resumen();
    var col = columnaPerfil();
    var colLab = (GAN && GAN.columnas && GAN.columnas[col]) || col;
    var total = 0, cobro = 0, lineas = [], faltan = 0;
    r.lineas.forEach(function (ln) {
      var p = ln.p, q = ln.q;
      var e = entradaGanancia(p);
      var fuentes = e ? (p.canje ? (e.costos_canje || e.costos) : e.costos) : null;
      var costo = fuentes ? Number(fuentes[col]) || 0 : 0;
      var estimado = !fuentes || !costo;
      if (estimado) { costo = Number(p.precio) * 0.70; faltan++; }
      var ganU = Number(p.precio) - costo;
      var g = ganU * q;
      total += g; cobro += Number(p.precio) * q;
      lineas.push({ nombre: p.nombre, q: q, gan: g, ganU: ganU, costo: costo, estimado: estimado });
    });
    return {
      total: total, cobro: cobro, margen: cobro > 0 ? (total / cobro) : 0,
      lineas: lineas, faltan: faltan, col: col, colLab: colLab, perfil: !!PERFIL,
      saldo: (PERFIL || {}).saldo || 0, dev: (PERFIL || {}).ultimaDevolucion || null,
      vigencia: (GAN && GAN.vigencia) || ''
    };
  }
  function msgGanancia(g) {
    var L = ['🔒 *Tu ganancia (presupuesto)* — solo para vos'];
    L.push('Cobro total: $' + Math.round(g.cobro).toLocaleString('es-AR'));
    L.push('*Ganancia: $' + Math.round(g.total).toLocaleString('es-AR') + ' (' + Math.round(g.margen * 100) + '%)*');
    g.lineas.forEach(function (l) {
      L.push('• ' + l.q + '× ' + String(l.nombre).replace(/\s*\(PLAN CANJE\)\s*$/i, '') + ': $' + Math.round(l.ganU).toLocaleString('es-AR') + '/u' + (l.estimado ? ' (est. 30%)' : ''));
    });
    L.push('Costo: ' + g.colLab + (g.vigencia ? ' · Lista PSA ' + g.vigencia : ''));
    L.push(new Date().toLocaleDateString('es-AR'));
    return L.join('\n');
  }
  function enviarGananciaWa() {
    var g = gananciaResumen();
    if (!g.lineas.length) return;
    // Convención de la app: solo telefono.js arma números (APPITel.link).
    var f = PERFIL || {};
    var url = (window.APPITel && window.APPITel.link) ? window.APPITel.link(f.telefono || '', msgGanancia(g)) : '';
    if (url) window.open(url, '_blank', 'noopener');
  }
  function pintarGanancia() {
    var host = $('lpSheetGanancia');
    if (!host) return;
    var r = resumen();
    if (!r.lineas.length) { host.innerHTML = ''; return; }
    if (GAN_STATE === 'loading') {
      host.innerHTML = '<div class="lp-gan"><div class="lp-gan-foot">🔒 Calculando tu ganancia con las listas de PSA…</div></div>';
      return;
    }
    var g = gananciaResumen();
    var pct = Math.round(g.margen * 100);
    var html = '<div class="lp-gan">' +
      '<div class="lp-gan-head"><b>🔒 SOLO PARA VOS</b><span>tú nunca ves esto · solo el distribuidor</span></div>' +
      '<div class="lp-gan-num">$' + Math.round(g.total).toLocaleString('es-AR') + '<i>≈ ' + pct + '% del total</i></div>' +
      '<div class="lp-gan-detalle">' + g.lineas.map(function (l) {
        return '<span>' + l.q + '× ' + esc(String(l.nombre).replace(/\s*\(PLAN CANJE\)\s*$/i, '')) + ' <b>$' + Math.round(l.ganU).toLocaleString('es-AR') + '/u</b>' + (l.estimado ? ' <em>est. 30%</em>' : '') + '</span>';
      }).join('') + '</div>' +
      '<div class="lp-gan-foot">Costo: ' + esc(g.colLab) + (g.vigencia ? ' · Lista PSA ' + esc(g.vigencia) : '') + (g.faltan ? ' · ' + g.faltan + ' ítem(s) sin lista (estimados al 30%)' : '') + '</div>' +
      (g.saldo ? '<div class="lp-gan-saldo">💳 Saldo en tu cuenta PSA: $' + Math.round(g.saldo).toLocaleString('es-AR') + (g.dev ? ' · última devolución ' + esc(g.dev.fecha) : '') + ' · la pedís del 1° al 5 (se acredita el 12)</div>' : '') +
      '<button type="button" class="lp-gan-wa" data-wa>📲 Enviarme a WhatsApp</button>' +
      '</div>';
    host.innerHTML = html;
    var wa = host.querySelector('[data-wa]');
    if (wa) wa.onclick = enviarGananciaWa;
  }

  window.abrirLista = abrirLista;
})();
