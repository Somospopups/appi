/* ============================================================
   APPI · Mi stock
   ------------------------------------------------------------
   Lo que tenés en casa y lo que prestaste. PRESTAR saca 1
   unidad, pide a quién y la fecha de hoy. Devolver la vuelve
   al stock. Eliminar el préstamo no toca el stock.
   ============================================================ */
(function(){
  'use strict';

  var tab = 'stock';
  var prestarIdx = -1;
  var bound = false;

  function esEscritorio(){
    return !!(window.matchMedia && window.matchMedia('(min-width: 1024px)').matches);
  }

  function uid(){ return window.APPIAuth && window.APPIAuth.userId ? window.APPIAuth.userId() : 'local'; }
  function $(id){ return document.getElementById(id); }
  function stockKey(){ return 'appi_stock_v1_' + uid(); }
  function prestamosKey(){ return 'appi_prestamos_v1_' + uid(); }
  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function norm(s){
    return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  }
  function last10(tel){
    var d = String(tel || '').replace(/\D/g,'');
    if (d.startsWith('54') && d.length >= 12) d = d.slice(-10);
    else if (d.length > 10) d = d.slice(-10);
    return d.length >= 8 ? d : '';
  }
  function hoyISO(){
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }
  function fechaTxt(iso){
    if (!iso) return '';
    var p = String(iso).split('-');
    if (p.length !== 3) return iso;
    return p[2] + '/' + p[1] + '/' + p[0];
  }
  function toast(msg, ms){
    if (typeof showToast === 'function') showToast(msg, ms || 1800);
  }
  function leerStock(){
    try{
      var raw = JSON.parse(localStorage.getItem(stockKey()) || '[]');
      return Array.isArray(raw) ? raw.filter(function(it){ return it && it.nombre && Number(it.cant) > 0; }) : [];
    }catch(e){ return []; }
  }
  function guardarStock(items){
    try{ localStorage.setItem(stockKey(), JSON.stringify(items.filter(function(it){ return Number(it.cant) > 0; }))); }catch(e){}
  }
  function leerPrestamos(){
    try{
      var raw = JSON.parse(localStorage.getItem(prestamosKey()) || '[]');
      return Array.isArray(raw) ? raw : [];
    }catch(e){ return []; }
  }
  function guardarPrestamos(rows){
    try{ localStorage.setItem(prestamosKey(), JSON.stringify(rows)); }catch(e){}
  }
  function sumarStock(nombre, cant){
    var items = leerStock();
    var n = norm(nombre);
    var hit = items.find(function(it){ return norm(it.nombre) === n; });
    if (hit) hit.cant = (Number(hit.cant) || 0) + cant;
    else items.push({ nombre: nombre, cant: cant });
    guardarStock(items);
  }

  function css(){
    if ($('stStyle')) return;
    var s = document.createElement('style');
    s.id = 'stStyle';
    s.textContent = '' +
      '.st-wrap{padding:4px 2px 20px}' +
      '.st-tabs{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:0 0 14px;padding:5px;border-radius:16px;background:rgba(69,78,120,.07)}' +
      '.st-tab{border:0;border-radius:12px;min-height:44px;background:transparent;color:#70717e;font:inherit;font-size:12px;font-weight:900;cursor:pointer}' +
      '.st-tab.active{color:#fff;background:linear-gradient(135deg,#5b8def,#875fdd);box-shadow:0 5px 13px rgba(91,112,210,.22)}' +
      '.st-card{padding:14px;border-radius:18px;background:rgba(255,255,255,.62);border:1px solid rgba(255,255,255,.8);box-shadow:0 8px 22px rgba(80,90,130,.07);margin-bottom:10px}' +
      'body.dark .st-card{background:rgba(30,30,50,.55);border-color:rgba(255,255,255,.08)}' +
      '.st-row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 0;border-bottom:1px dashed rgba(80,90,130,.12)}' +
      '.st-row:last-child{border-bottom:0}' +
      '.st-name{font-size:14px;font-weight:850;color:#292938}' +
      'body.dark .st-name{color:#f2f2f7}' +
      '.st-meta{display:block;margin-top:3px;font-size:11px;font-weight:700;color:#777887}' +
      '.st-qty{display:flex;align-items:center;gap:6px}' +
      '.st-mini{border:1px solid rgba(91,141,239,.25);border-radius:10px;min-width:34px;min-height:34px;background:rgba(91,141,239,.08);color:#3d63c9;font:inherit;font-size:14px;font-weight:900;cursor:pointer}' +
      '.st-prestar{border:0;border-radius:11px;padding:8px 11px;background:linear-gradient(135deg,#f5b301,#ff8f6b);color:#fff;font:inherit;font-size:11px;font-weight:950;cursor:pointer}' +
      '.st-add{display:flex;gap:8px;margin-top:10px}' +
      '.st-add input{flex:1;min-height:42px;border:1px solid rgba(80,90,130,.16);border-radius:12px;padding:8px 10px;font:inherit;font-size:13px;background:rgba(255,255,255,.88)}' +
      'body.dark .st-add input{background:#1d1f31;color:#f2f2f7;border-color:rgba(255,255,255,.1)}' +
      '.st-add button{border:0;border-radius:12px;padding:0 14px;background:linear-gradient(135deg,#5b8def,#875fdd);color:#fff;font:inherit;font-size:18px;font-weight:900;cursor:pointer}' +
      '.st-empty{padding:28px 16px;text-align:center;color:#777887;font-size:13px;font-weight:700}' +
      '.st-loan-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}' +
      '.st-loan-actions button{border:0;border-radius:10px;padding:8px 10px;font:inherit;font-size:11px;font-weight:900;cursor:pointer}' +
      '.st-ok{background:rgba(58,208,164,.16);color:#1d7a5c}' +
      '.st-del{background:rgba(217,83,79,.12);color:#b94440}' +
      '.st-wa{background:linear-gradient(135deg,#25D366,#128C7E);color:#fff}' +
      '.st-desk{display:grid;gap:14px;align-items:start}' +
      '@media(min-width:1024px){.st-desk{grid-template-columns:1fr 1fr;gap:18px}.st-wrap{max-width:1100px;margin:0 auto;padding:4px 8px 28px}.st-ov{align-items:center!important}.st-sheet{border-radius:22px!important;width:min(440px,100%)}}' +
      '.st-ov{position:fixed;inset:0;z-index:26000;display:none;align-items:flex-end;justify-content:center;background:rgba(20,22,38,.5);padding:16px}' +
      '.st-ov.open{display:flex}' +
      '.st-sheet{width:min(520px,100%);border-radius:22px 22px 16px 16px;background:#fff;padding:16px 16px 20px}' +
      'body.dark .st-sheet{background:#1d1f31;color:#f2f2f7}' +
      '.st-sheet h3{margin:0 0 4px;font-size:17px}' +
      '.st-sheet p{margin:0 0 12px;font-size:12px;color:#686977}' +
      '.st-field{display:grid;gap:4px;margin-bottom:10px}' +
      '.st-field span{font-size:10px;font-weight:900;color:#3d63c9;text-transform:uppercase}' +
      '.st-field input{width:100%;min-height:44px;border:1px solid rgba(80,90,130,.16);border-radius:12px;padding:10px;font:inherit;font-size:14px}' +
      'body.dark .st-field input{background:#161827;color:#f2f2f7;border-color:rgba(255,255,255,.1)}' +
      '.st-save{width:100%;min-height:46px;border:0;border-radius:13px;background:linear-gradient(135deg,#5b8def,#875fdd);color:#fff;font:inherit;font-size:14px;font-weight:950;cursor:pointer}' +
      '.st-cancel{width:100%;margin-top:8px;border:0;background:transparent;color:#686977;font:inherit;font-size:12px;font-weight:800;cursor:pointer}';
    document.head.appendChild(s);
  }

  function crearVista(){
    var sec = $('view-stock');
    if (!sec) {
      var app = document.querySelector('.app');
      if (!app) return;
      sec = document.createElement('section');
      sec.id = 'view-stock';
      sec.className = 'view';
      sec.innerHTML = '<header class="top"><button class="back-btn" id="btnBackStock" aria-label="Volver">‹</button><button class="help-btn" id="btnHelpStock" aria-label="Ayuda">?</button><button class="tools-btn" onclick="toggleToolsMenu(event)" aria-label="Herramientas" title="Herramientas">⚙️</button><h1>Mi</h1><div class="script">stock</div><p>Lo que tenés y lo que prestaste</p></header><div class="st-wrap" id="stockCont"></div>';
      app.appendChild(sec);
    }
    if (bound) return;
    bound = true;
    var back = $('btnBackStock');
    if (back) back.onclick = function(){
      if (typeof showView === 'function') showView(esEscritorio() ? 'view-home' : 'view-herramientas');
      if (typeof renderHomeCompleto === 'function') renderHomeCompleto();
    };
    var help = $('btnHelpStock');
    if (help) help.onclick = function(){
      if (window.APPIDialog) window.APPIDialog.alert('En Stock personal cargás lo que tenés en casa. PRESTAR saca 1 unidad, te pregunta a quién y pone la fecha de hoy. En Prestados: YA ME LO DEVOLVIÓ vuelve esa unidad al stock. ELIMINAR borra el préstamo y no toca el stock (por si se perdió o se lo regalaste).', { title:'Cómo usar Mi stock', icon:'📦' });
    };
  }

  function htmlStock(){
    var items = leerStock();
    var total = items.reduce(function(s, it){ return s + (Number(it.cant) || 0); }, 0);
    var filas = items.map(function(it, i){
      return '<div class="st-row">' +
        '<div><span class="st-name">' + esc(it.nombre) + '</span><span class="st-meta">' + it.cant + ' unidad' + (it.cant === 1 ? '' : 'es') + '</span></div>' +
        '<div class="st-qty">' +
          '<button type="button" class="st-mini" data-st-menos="' + i + '">−</button>' +
          '<b>' + it.cant + '</b>' +
          '<button type="button" class="st-mini" data-st-mas="' + i + '">+</button>' +
          '<button type="button" class="st-mini" data-st-del="' + i + '" aria-label="Quitar">✕</button>' +
          '<button type="button" class="st-prestar" data-st-prestar="' + i + '">PRESTAR</button>' +
        '</div></div>';
    }).join('');
    return '<div class="st-card"><div class="st-name">📦 En casa</div><div class="st-meta" style="margin:4px 0 8px">' + total + ' unidad' + (total === 1 ? '' : 'es') + ' disponibles</div>' +
      (filas || '<div class="st-empty">Todavía no cargaste productos.</div>') +
      '<div class="st-add"><input id="stNombre" placeholder="Producto (ej: Iontrix 2)"><input id="stCant" type="number" min="1" value="1" style="max-width:72px"><button type="button" id="stAdd">＋</button></div></div>';
  }

  function htmlPrestamos(){
    var rows = leerPrestamos().slice().sort(function(a,b){ return String(b.fecha||'').localeCompare(String(a.fecha||'')); });
    var cabeza = '<div class="st-card"><div class="st-name">🤝 Prestados</div><div class="st-meta" style="margin:4px 0 0">' + rows.length + ' préstamo' + (rows.length === 1 ? '' : 's') + '</div></div>';
    if (!rows.length) return cabeza + '<div class="st-card"><div class="st-empty">Nada prestado. En Stock personal tocá PRESTAR.</div></div>';
    return cabeza + rows.map(function(p){
      var tel = last10(p.telefono);
      return '<div class="st-card" data-st-loan="' + esc(p.id) + '">' +
        '<div class="st-name">' + esc(p.producto) + '</div>' +
        '<span class="st-meta">Prestado a ' + esc(p.quien) + (p.telefono ? ' · ' + esc(p.telefono) : '') + '</span>' +
        '<span class="st-meta">Fecha: ' + esc(fechaTxt(p.fecha)) + '</span>' +
        '<div class="st-loan-actions">' +
          (tel ? '<button type="button" class="st-wa" data-st-wa="' + esc(p.id) + '">💬 WhatsApp</button>' : '') +
          '<button type="button" class="st-ok" data-st-dev="' + esc(p.id) + '">YA ME LO DEVOLVIÓ</button>' +
          '<button type="button" class="st-del" data-st-kill="' + esc(p.id) + '">ELIMINAR</button>' +
        '</div></div>';
    }).join('');
  }

  function pintar(){
    css();
    crearVista();
    var host = $('stockCont');
    if (!host) return;
    var prestados = leerPrestamos().length;
    if (esEscritorio()) {
      host.innerHTML = '<div class="st-desk"><div>' + htmlStock() + '</div><div>' + htmlPrestamos() + '</div></div>';
    } else {
      host.innerHTML =
        '<div class="st-tabs">' +
          '<button type="button" class="st-tab' + (tab === 'stock' ? ' active' : '') + '" data-st-tab="stock">Stock personal</button>' +
          '<button type="button" class="st-tab' + (tab === 'prestados' ? ' active' : '') + '" data-st-tab="prestados">Prestados' + (prestados ? ' · ' + prestados : '') + '</button>' +
        '</div>' +
        (tab === 'prestados' ? htmlPrestamos() : htmlStock());
    }
    bind();
  }

  function bind(){
    document.querySelectorAll('[data-st-tab]').forEach(function(b){
      b.onclick = function(){ tab = b.getAttribute('data-st-tab'); pintar(); };
    });
    var add = $('stAdd');
    if (add) add.onclick = function(){
      var nombre = ($('stNombre').value || '').trim();
      var cant = Math.max(1, Number($('stCant').value) || 1);
      if (!nombre){ if (window.APPIDialog) window.APPIDialog.alert('Escribí el nombre del producto.', { title:'Falta el producto', icon:'📦' }); return; }
      sumarStock(nombre, cant);
      pintar();
      toast('Producto cargado 📦');
    };
    document.querySelectorAll('[data-st-mas]').forEach(function(b){
      b.onclick = function(){ var it = leerStock(); it[+b.getAttribute('data-st-mas')].cant++; guardarStock(it); pintar(); };
    });
    document.querySelectorAll('[data-st-menos]').forEach(function(b){
      b.onclick = function(){
        var it = leerStock();
        var i = +b.getAttribute('data-st-menos');
        it[i].cant = Math.max(0, (Number(it[i].cant) || 0) - 1);
        guardarStock(it);
        pintar();
      };
    });
    document.querySelectorAll('[data-st-del]').forEach(function(b){
      b.onclick = function(){ var it = leerStock(); it.splice(+b.getAttribute('data-st-del'), 1); guardarStock(it); pintar(); };
    });
    document.querySelectorAll('[data-st-prestar]').forEach(function(b){
      b.onclick = function(){ abrirPrestar(+b.getAttribute('data-st-prestar')); };
    });
    document.querySelectorAll('[data-st-dev]').forEach(function(b){
      b.onclick = function(){ devolver(b.getAttribute('data-st-dev')); };
    });
    document.querySelectorAll('[data-st-kill]').forEach(function(b){
      b.onclick = function(){ eliminarPrestamo(b.getAttribute('data-st-kill')); };
    });
    document.querySelectorAll('[data-st-wa]').forEach(function(b){
      b.onclick = function(){ avisar(b.getAttribute('data-st-wa')); };
    });
  }

  function ensureOverlay(){
    if ($('stOverlay')) return;
    var ov = document.createElement('div');
    ov.id = 'stOverlay';
    ov.className = 'st-ov';
    ov.innerHTML = '<div class="st-sheet" id="stSheet"></div>';
    ov.addEventListener('click', function(e){ if (e.target === ov) cerrarPrestar(); });
    document.body.appendChild(ov);
  }
  function abrirPrestar(i){
    var items = leerStock();
    var it = items[i];
    if (!it || Number(it.cant) < 1){ toast('No hay unidades para prestar'); return; }
    prestarIdx = i;
    css();
    ensureOverlay();
    $('stSheet').innerHTML =
      '<h3>¿A quién se lo prestás?</h3>' +
      '<p>Se presta 1 ' + esc(it.nombre) + '. La fecha queda en hoy, ' + esc(fechaTxt(hoyISO())) + '.</p>' +
      '<label class="st-field"><span>Nombre</span><input id="stQuien" autocomplete="name" placeholder="Ej: Laura Gómez"></label>' +
      '<label class="st-field"><span>Teléfono</span><input id="stTel" type="tel" inputmode="tel" autocomplete="tel" placeholder="351 555 1234"></label>' +
      '<button type="button" class="st-save" id="stSavePrestamo">Prestar</button>' +
      '<button type="button" class="st-cancel" id="stCancelPrestamo">Cancelar</button>';
    $('stOverlay').classList.add('open');
    if (window.bloquearScrollCuerpo) window.bloquearScrollCuerpo();
    $('stCancelPrestamo').onclick = cerrarPrestar;
    $('stSavePrestamo').onclick = confirmarPrestar;
    setTimeout(function(){ var el = $('stQuien'); if (el) el.focus(); }, 40);
  }
  function cerrarPrestar(){
    var ov = $('stOverlay');
    if (ov) ov.classList.remove('open');
    if (window.liberarScrollCuerpo) window.liberarScrollCuerpo();
    prestarIdx = -1;
  }
  function confirmarPrestar(){
    var items = leerStock();
    var it = items[prestarIdx];
    if (!it || Number(it.cant) < 1){ cerrarPrestar(); pintar(); return; }
    var quien = (($('stQuien') && $('stQuien').value) || '').trim();
    var telefono = (($('stTel') && $('stTel').value) || '').trim();
    if (quien.length < 2){
      if (window.APPIDialog) window.APPIDialog.alert('Escribí el nombre de a quién se lo prestás.', { title:'Falta el nombre', icon:'📦' });
      return;
    }
    it.cant = Number(it.cant) - 1;
    guardarStock(items);
    var rows = leerPrestamos();
    rows.unshift({
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      producto: it.nombre,
      quien: quien,
      telefono: telefono,
      fecha: hoyISO(),
      cant: 1
    });
    guardarPrestamos(rows);
    cerrarPrestar();
    tab = 'prestados';
    pintar();
    toast('Prestado a ' + quien.split(/\s+/)[0] + ' 📦');
  }

  function devolver(id){
    var rows = leerPrestamos();
    var i = rows.findIndex(function(r){ return r.id === id; });
    if (i < 0) return;
    var row = rows[i];
    rows.splice(i, 1);
    guardarPrestamos(rows);
    sumarStock(row.producto, 1);
    tab = 'stock';
    pintar();
    toast('Volvió al stock ✓');
  }

  async function eliminarPrestamo(id){
    var rows = leerPrestamos();
    var row = rows.find(function(r){ return r.id === id; });
    if (!row) return;
    var ok = true;
    if (window.APPIDialog) {
      ok = await window.APPIDialog.confirm('Se borra el préstamo de ' + row.producto + ' a ' + row.quien + '. No vuelve al stock personal.', { title:'Eliminar préstamo', icon:'🗑️', okText:'Eliminar', danger:true });
    }
    if (!ok) return;
    guardarPrestamos(rows.filter(function(r){ return r.id !== id; }));
    pintar();
    toast('Préstamo eliminado');
  }

  function avisar(id){
    var row = leerPrestamos().find(function(r){ return r.id === id; });
    if (!row) return;
    var digits = last10(row.telefono);
    if (!digits){
      if (window.APPIDialog) window.APPIDialog.alert('Este préstamo no tiene un teléfono válido.', { title:'Sin teléfono', icon:'📵' });
      return;
    }
    var num = digits.length === 10 ? '549' + digits : '54' + digits;
    var texto = 'Hola ' + (row.quien.split(/\s+/)[0] || '') + ', te consulto por el ' + row.producto + ' que te presté el ' + fechaTxt(row.fecha) + '.';
    var url = 'https://wa.me/' + num + '?text=' + encodeURIComponent(texto);
    if (window.APPIWhatsApp && window.APPIWhatsApp.abrir) window.APPIWhatsApp.abrir(url);
    else window.open(url, '_blank', 'noopener');
  }

  function abrir(){
    css();
    crearVista();
    tab = 'stock';
    if (typeof showView === 'function') showView('view-stock');
    var tabs = $('tabs');
    if (tabs) tabs.style.display = 'none';
    pintar();
  }

  window.openStock = abrir;
  window.APPIStock = { open: abrir, render: pintar, leerStock: leerStock, leerPrestamos: leerPrestamos };
})();
