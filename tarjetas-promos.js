/* ============================================================
   APPI · Tarjetas y promos
   ------------------------------------------------------------
   Marca + banco, varias por persona. Se guardan aparte de la
   planilla (por teléfono) para no perderse al recargar Excel.
   Filtro + WhatsApp de a uno con el texto que escribas.
   ============================================================ */
(function(){
  'use strict';

  var MARCAS = [
    { id:'visa', label:'Visa' },
    { id:'mastercard', label:'Mastercard' },
    { id:'amex', label:'American Express' },
    { id:'cabal', label:'Cabal' },
    { id:'naranja', label:'Naranja' },
    { id:'maestro', label:'Maestro' },
    { id:'otra', label:'Otra' }
  ];
  var BANCOS = [
    { id:'galicia', label:'Galicia' },
    { id:'santander', label:'Santander' },
    { id:'macro', label:'Macro' },
    { id:'nacion', label:'Nación' },
    { id:'provincia', label:'Provincia' },
    { id:'cordoba', label:'Córdoba (Bancor)' },
    { id:'bbva', label:'BBVA' },
    { id:'icbc', label:'ICBC' },
    { id:'hsbc', label:'HSBC' },
    { id:'supervielle', label:'Supervielle' },
    { id:'credicoop', label:'Credicoop' },
    { id:'patagonia', label:'Patagonia' },
    { id:'ciudad', label:'Ciudad' },
    { id:'hipotecario', label:'Hipotecario' },
    { id:'itau', label:'Itaú' },
    { id:'comafi', label:'Comafi' },
    { id:'bind', label:'Bind' },
    { id:'naranja_x', label:'Naranja X' },
    { id:'uala', label:'Ualá' },
    { id:'mercado_pago', label:'Mercado Pago' },
    { id:'brubank', label:'Brubank' },
    { id:'personal_pay', label:'Personal Pay' },
    { id:'otro', label:'Otro' }
  ];

  var filtro = { marca:'', banco:'', sin:false };
  var mensajePromo = '';
  var picker = { person:null, marca:'', banco:'' };

  function uid(){ return window.APPIAuth && window.APPIAuth.userId ? window.APPIAuth.userId() : 'local'; }
  function storeKey(){ return 'appi_tarjetas_v1_' + uid(); }
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
  function personKey(p){
    if (!p) return '';
    var tel = last10(p.telf || p.telefono || p.tel);
    if (tel) return 'tel:' + tel;
    var name = norm(p.usuario || p.nombre || '');
    var extra = norm(p.domicilio || p.zona || '');
    if (!name) return '';
    return 'n:' + name + '|' + extra;
  }
  function leer(){
    try{
      var raw = JSON.parse(localStorage.getItem(storeKey()) || '{}');
      return raw && typeof raw === 'object' && raw.byKey ? raw : { byKey:{} };
    }catch(e){ return { byKey:{} }; }
  }
  function guardar(data){
    try{ localStorage.setItem(storeKey(), JSON.stringify(data)); }catch(e){}
  }
  function labelOf(list, id){
    var row = list.find(function(x){ return x.id === id; });
    return row ? row.label : id;
  }
  function labelCard(c){
    if (!c) return '';
    var m = labelOf(MARCAS, c.marca);
    var b = labelOf(BANCOS, c.banco);
    if (c.marca === 'naranja' && (c.banco === 'naranja_x' || c.banco === 'otro')) return b === 'Otro' ? 'Naranja' : b;
    if (m && b && norm(m) === norm(b)) return m;
    return (m + ' ' + b).trim();
  }
  function cardsOf(p){
    var key = personKey(p);
    var data = leer();
    var local = key && data.byKey[key] ? data.byKey[key].slice() : [];
    var meta = p && p.metadata && Array.isArray(p.metadata.tarjetas) ? p.metadata.tarjetas : [];
    if (!local.length && meta.length){
      if (key){
        data.byKey[key] = meta.slice();
        guardar(data);
      }
      return meta.slice();
    }
    return local;
  }
  function setCards(p, cards){
    var key = personKey(p);
    if (!key) return;
    var data = leer();
    data.byKey[key] = cards.slice();
    guardar(data);
    // Los botones de tarjeta de Usuarios se arman con lo que la gente tiene
    // cargado. Se rehacen acá, en el momento del guardado, porque los repintados
    // de la lista pueden correr antes de que el dato exista.
    if (window.APPIUsuariosBotones) {
      try { window.APPIUsuariosBotones.pintar(); } catch (e) {}
    }
    if (p && typeof p.id === 'string' && window.APPIGestion && typeof window.APPIGestion.guardarMetadata === 'function'){
      try{ window.APPIGestion.guardarMetadata(p, { tarjetas: cards }); }catch(e){}
    }
  }
  function coincide(p){
    var cards = cardsOf(p);
    if (filtro.sin) return cards.length === 0;
    if (!filtro.marca && !filtro.banco) return true;
    return cards.some(function(c){
      if (filtro.marca && c.marca !== filtro.marca) return false;
      if (filtro.banco && c.banco !== filtro.banco) return false;
      return true;
    });
  }
  function filtroActivo(){ return !!(filtro.marca || filtro.banco || filtro.sin); }
  function filterPersonas(list){
    if (!filtroActivo()) return list;
    return list.filter(coincide);
  }
  function textoDe(p){ return cardsOf(p).map(labelCard).join(' · '); }
  function pila(p){
    var raw = String((p && (p.usuario || p.nombre)) || '').trim();
    if (typeof window.nombreDePila === 'function'){
      try{ var n = window.nombreDePila(raw); if (n) return n; }catch(e){}
    }
    if (raw.indexOf(',') >= 0) raw = raw.split(',')[1] || raw.split(',')[0];
    return raw.split(/\s+/)[0] || 'hola';
  }
  function telefonoDe(p){ return last10(p && (p.telf || p.telefono || p.tel)); }
  function armarMensaje(p){
    var cards = cardsOf(p);
    var nombre = pila(p);
    var tarjeta = cards.map(labelCard).join(', ') || 'tu tarjeta';
    var base = String(mensajePromo || '').trim();
    // El saludo lo pone siempre la app; abajo va la promo que escribió el
    // usuario. Si él ya saluda en su texto, no se le agrega nada.
    var saludo = 'Hola ' + nombre + '! ¿Cómo va? 😊 Te paso una promo que puede interesarte:\n\n';
    if (!base) return saludo;
    var texto = base.replace(/\{nombre\}/gi, nombre).replace(/\{tarjeta\}/gi, tarjeta);
    return /^\s*(hola|buen)/i.test(texto) ? texto : saludo + texto;
  }
  function abrirWhatsApp(p){
    var digits = telefonoDe(p);
    if (!digits){
      if (window.APPIDialog) window.APPIDialog.alert('Esta persona no tiene un teléfono válido.', { title:'Sin teléfono', icon:'📵' });
      return;
    }
    var num = digits.length === 10 ? '549' + digits : '54' + digits;
    var url = 'https://wa.me/' + num + '?text=' + encodeURIComponent(armarMensaje(p));
    if (window.APPIWhatsApp && window.APPIWhatsApp.abrir) window.APPIWhatsApp.abrir(url);
    else window.open(url, '_blank', 'noopener');
  }

  function css(){
    if (document.getElementById('tpStyle')) return;
    var s = document.createElement('style');
    s.id = 'tpStyle';
    s.textContent = '' +
      '.tp-bar{margin:14px 0 0;padding:14px;border-radius:16px;background:linear-gradient(160deg,rgba(61,99,201,.10),rgba(160,107,255,.10));border:1px solid rgba(91,141,239,.18)}' +
      'body.dark .tp-bar{background:linear-gradient(160deg,rgba(61,99,201,.16),rgba(160,107,255,.14));border-color:rgba(255,255,255,.08)}' +
      '.tp-bar h3{margin:0 0 4px;font-size:14px;font-weight:950;color:#2b2c3a}' +
      'body.dark .tp-bar h3{color:#f2f2f7}' +
      '.tp-bar p{margin:0 0 10px;font-size:11px;font-weight:700;color:#686977;line-height:1.4}' +
      'body.dark .tp-bar p{color:#b8b9c5}' +
      '.tp-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}' +
      // display:grid le gana al atributo hidden, así que hay que decirlo aparte.
      '.tp-bar [hidden]{display:none!important}' +
      '.tp-row select,.tp-msg{width:100%;min-height:40px;border:1px solid rgba(80,90,130,.16);border-radius:12px;padding:8px 10px;font:inherit;font-size:12px;background:rgba(255,255,255,.88);color:#292938}' +
      'body.dark .tp-row select,body.dark .tp-msg{background:#1d1f31;color:#f2f2f7;border-color:rgba(255,255,255,.1)}' +
      '.tp-msg{min-height:72px;resize:vertical;margin-top:8px}' +
      '.tp-tools{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px}' +
      '.tp-chip{border:0;border-radius:999px;padding:7px 10px;font:inherit;font-size:11px;font-weight:900;cursor:pointer;background:rgba(91,141,239,.12);color:#3d63c9}' +
      '.tp-chip.on{background:linear-gradient(135deg,#5b8def,#875fdd);color:#fff}' +
      '.tp-count{margin-left:auto;font-size:11px;font-weight:900;color:#3d63c9}' +
      /* En la ficha de Usuarios el separador lo pone .u-grupo: acá sólo se
         mantiene el aire para el resto de las pantallas. */
      '.tp-slot{margin-top:10px}' +
      '.tp-pills{display:flex;flex-wrap:wrap;gap:6px;align-items:center}' +
      '.tp-pill{display:inline-flex;align-items:center;gap:6px;padding:5px 8px;border-radius:999px;background:rgba(91,141,239,.12);color:#3d63c9;font-size:11px;font-weight:850}' +
      'body.dark .tp-pill{background:rgba(91,141,239,.2);color:#c5d4ff}' +
      '.tp-pill button{border:0;background:none;color:inherit;font:inherit;font-size:13px;cursor:pointer;padding:0}' +
      '.tp-add{border:1px dashed rgba(91,141,239,.35);border-radius:999px;padding:5px 10px;background:transparent;color:#3d63c9;font:inherit;font-size:11px;font-weight:900;cursor:pointer}' +
      '.tp-wa{border:0;border-radius:10px;padding:8px 10px;background:linear-gradient(135deg,#25D366,#128C7E);color:#fff;font:inherit;font-size:11px;font-weight:900;cursor:pointer}' +
      '.tp-ov{position:fixed;inset:0;z-index:26000;display:none;align-items:flex-end;justify-content:center;background:rgba(20,22,38,.5);padding:16px}' +
      '.tp-ov.open{display:flex}' +
      '.tp-sheet{width:min(520px,100%);max-height:86vh;overflow:auto;border-radius:22px 22px 16px 16px;background:#fff;padding:16px 16px 20px}' +
      'body.dark .tp-sheet{background:#1d1f31;color:#f2f2f7}' +
      '.tp-sheet h3{margin:0 0 6px;font-size:17px}' +
      '.tp-opts{display:flex;flex-wrap:wrap;gap:7px;margin:8px 0 14px}' +
      '.tp-opt{border:1px solid rgba(80,90,130,.14);border-radius:12px;padding:8px 10px;background:rgba(255,255,255,.8);font:inherit;font-size:12px;font-weight:850;cursor:pointer}' +
      '.tp-opt.on{border-color:transparent;background:linear-gradient(135deg,#5b8def,#875fdd);color:#fff}' +
      'body.dark .tp-opt{background:rgba(255,255,255,.06);color:#e8e8ec;border-color:rgba(255,255,255,.1)}' +
      '.tp-save{width:100%;min-height:44px;border:0;border-radius:13px;background:linear-gradient(135deg,#5b8def,#875fdd);color:#fff;font:inherit;font-size:13px;font-weight:950;cursor:pointer}' +
      '.tp-cancel{width:100%;margin-top:8px;border:0;background:transparent;color:#686977;font:inherit;font-size:12px;font-weight:800;cursor:pointer}';
    document.head.appendChild(s);
  }

  function optionsHtml(list, selected, extra){
    var html = extra || '';
    list.forEach(function(item){
      html += '<option value="' + item.id + '"' + (selected === item.id ? ' selected' : '') + '>' + esc(item.label) + '</option>';
    });
    return html;
  }
  // `sinFiltros` deja los controles de filtrado fuera de la vista sin quitarlos
  // del DOM. Se usa en Usuarios, donde filtrar es tarea de los botones de
  // barrio y tarjeta (cada uno abre su listado en un popup). El mensaje y el
  // envío por WhatsApp siguen a la vista, que es lo que se usa ahí.
  function barraHtml(idPrefix, opciones){
    var sinFiltros = !!(opciones && opciones.sinFiltros);
    var oculto = sinFiltros ? ' hidden' : '';
    return '<div class="tp-bar" id="' + idPrefix + 'Bar">' +
      '<h3>💳 Promos con tarjeta</h3>' +
      '<p>' + (sinFiltros
        ? 'Elegí una tarjeta arriba para ver quiénes la tienen. Escribí el mensaje (podés usar {nombre} y {tarjeta}) y avisá de a uno por WhatsApp.'
        : 'Filtrá por marca y banco. Escribí el mensaje (podés usar {nombre} y {tarjeta}) y avisá de a uno por WhatsApp.') + '</p>' +
      '<div class="tp-row"' + oculto + '>' +
        '<select id="' + idPrefix + 'Marca"><option value="">Todas las marcas</option>' + optionsHtml(MARCAS, filtro.marca) + '</select>' +
        '<select id="' + idPrefix + 'Banco"><option value="">Todos los bancos</option>' + optionsHtml(BANCOS, filtro.banco) + '</select>' +
      '</div>' +
      '<textarea class="tp-msg" id="' + idPrefix + 'Msg" placeholder="Hola {nombre}, hay una promo con {tarjeta}…">' + esc(mensajePromo) + '</textarea>' +
      '<div class="tp-tools">' +
        '<button type="button" class="tp-chip' + (filtro.sin ? ' on' : '') + '" id="' + idPrefix + 'Sin"' + oculto + '>Sin tarjeta cargada</button>' +
        '<button type="button" class="tp-chip" id="' + idPrefix + 'Clear"' + oculto + '>Limpiar filtro</button>' +
        '<span class="tp-count" id="' + idPrefix + 'Count"></span>' +
      '</div></div>';
  }
  function bindBarra(prefix, onChange){
    var marca = document.getElementById(prefix + 'Marca');
    var banco = document.getElementById(prefix + 'Banco');
    var msg = document.getElementById(prefix + 'Msg');
    var sin = document.getElementById(prefix + 'Sin');
    var clear = document.getElementById(prefix + 'Clear');
    if (marca) marca.onchange = function(){ filtro.marca = marca.value; filtro.sin = false; onChange(); };
    if (banco) banco.onchange = function(){ filtro.banco = banco.value; filtro.sin = false; onChange(); };
    if (msg) msg.oninput = function(){ mensajePromo = msg.value; };
    if (sin) sin.onclick = function(){ filtro.sin = !filtro.sin; if (filtro.sin){ filtro.marca = ''; filtro.banco = ''; } onChange(); };
    if (clear) clear.onclick = function(){ resetFiltro(); onChange(); };
  }
  function actualizarConteo(prefix, n){
    var el = document.getElementById(prefix + 'Count');
    if (el) el.textContent = filtroActivo() ? (n + ' persona' + (n === 1 ? '' : 's')) : '';
  }

  function pillsHtml(p){
    var cards = cardsOf(p);
    var html = '<div class="tp-pills">';
    cards.forEach(function(c, i){
      html += '<span class="tp-pill">' + esc(labelCard(c)) + '<button type="button" data-tp-del="' + i + '" aria-label="Quitar">×</button></span>';
    });
    html += '<button type="button" class="tp-add" data-tp-add>+ Agregar tarjeta</button>';
    if (telefonoDe(p)){
      html += '<button type="button" class="tp-wa" data-tp-wa>💬 Avisar promo</button>';
    }
    html += '</div>';
    return html;
  }
  function bindPills(host, p, after){
    if (!host) return;
    host.querySelectorAll('[data-tp-del]').forEach(function(btn){
      btn.onclick = function(e){
        e.stopPropagation();
        var cards = cardsOf(p);
        cards.splice(Number(btn.getAttribute('data-tp-del')), 1);
        setCards(p, cards);
        after();
      };
    });
    var add = host.querySelector('[data-tp-add]');
    if (add) add.onclick = function(e){ e.stopPropagation(); abrirPicker(p, after); };
    var wa = host.querySelector('[data-tp-wa]');
    if (wa) wa.onclick = function(e){ e.stopPropagation(); abrirWhatsApp(p); };
  }

  function ensureOverlay(){
    if (document.getElementById('tpOverlay')) return;
    var ov = document.createElement('div');
    ov.id = 'tpOverlay';
    ov.className = 'tp-ov';
    ov.innerHTML = '<div class="tp-sheet" id="tpSheet"></div>';
    ov.addEventListener('click', function(e){ if (e.target === ov) cerrarPicker(); });
    document.body.appendChild(ov);
  }
  function abrirPicker(person, after){
    css();
    ensureOverlay();
    picker = { person: person, marca: '', banco: '', after: after };
    pintarPicker();
    document.getElementById('tpOverlay').classList.add('open');
    if (window.bloquearScrollCuerpo) window.bloquearScrollCuerpo();
  }
  function cerrarPicker(){
    var ov = document.getElementById('tpOverlay');
    if (ov) ov.classList.remove('open');
    if (window.liberarScrollCuerpo) window.liberarScrollCuerpo();
  }
  function pintarPicker(){
    var sheet = document.getElementById('tpSheet');
    if (!sheet) return;
    var html = '<h3>Agregar tarjeta</h3><p style="margin:0 0 8px;font-size:12px;color:#686977">Elegí la marca y el banco.</p>';
    html += '<div style="font-size:11px;font-weight:900;color:#3d63c9;text-transform:uppercase">Marca</div><div class="tp-opts">';
    MARCAS.forEach(function(m){
      html += '<button type="button" class="tp-opt' + (picker.marca === m.id ? ' on' : '') + '" data-tp-marca="' + m.id + '">' + esc(m.label) + '</button>';
    });
    html += '</div><div style="font-size:11px;font-weight:900;color:#3d63c9;text-transform:uppercase">Banco o emisor</div><div class="tp-opts">';
    BANCOS.forEach(function(b){
      html += '<button type="button" class="tp-opt' + (picker.banco === b.id ? ' on' : '') + '" data-tp-banco="' + b.id + '">' + esc(b.label) + '</button>';
    });
    html += '</div><button type="button" class="tp-save" id="tpSave">Guardar</button><button type="button" class="tp-cancel" id="tpCancel">Cancelar</button>';
    sheet.innerHTML = html;
    sheet.querySelectorAll('[data-tp-marca]').forEach(function(btn){
      btn.onclick = function(){
        picker.marca = btn.getAttribute('data-tp-marca');
        if (picker.marca === 'naranja' && !picker.banco) picker.banco = 'naranja_x';
        pintarPicker();
      };
    });
    sheet.querySelectorAll('[data-tp-banco]').forEach(function(btn){
      btn.onclick = function(){ picker.banco = btn.getAttribute('data-tp-banco'); pintarPicker(); };
    });
    document.getElementById('tpCancel').onclick = cerrarPicker;
    document.getElementById('tpSave').onclick = function(){
      if (!picker.marca || !picker.banco){
        if (window.APPIDialog) window.APPIDialog.alert('Elegí marca y banco.', { title:'Falta un dato', icon:'💳' });
        return;
      }
      var cards = cardsOf(picker.person);
      var dup = cards.some(function(c){ return c.marca === picker.marca && c.banco === picker.banco; });
      if (!dup){
        cards.push({ marca: picker.marca, banco: picker.banco });
        setCards(picker.person, cards);
      }
      var after = picker.after;
      cerrarPicker();
      if (after) after();
      if (typeof showToast === 'function') showToast(dup ? 'Esa tarjeta ya estaba' : 'Tarjeta guardada 💳', 1800);
    };
  }

  function montarBarraUsuarios(){
    css();
    var host = document.getElementById('usuariosTarjetasBar');
    if (!host) return;
    // En Usuarios la barra queda fuera de la vista: el mensaje se escribe en el
    // popup del botón "Tarjetas". Se sigue montando porque el textarea es el
    // que guarda el texto que arma cada WhatsApp.
    host.hidden = true;
    host.innerHTML = barraHtml('tpU', { sinFiltros: true });
    bindBarra('tpU', function(){
      if (typeof window.aplicarFiltrosU === 'function') window.aplicarFiltrosU();
      montarBarraUsuarios();
    });
    var lista = window.usuariosFiltradosActual ? window.usuariosFiltradosActual() : [];
    actualizarConteo('tpU', lista.length);
    // Los botones de tarjeta salen de lo que la gente tiene cargado: si se
    // agrega o se quita una, tienen que reflejarlo en el momento.
    if (window.APPIUsuariosBotones) window.APPIUsuariosBotones.pintar();
  }
  function pintarListaUsuarios(cont, lista){
    css();
    if (!cont) return;
    cont.querySelectorAll('.tp-slot[data-tp-scope="usuarios"]').forEach(function(slot){
      var i = Number(slot.getAttribute('data-tp-index'));
      var p = lista[i];
      if (!p) return;
      slot.innerHTML = pillsHtml(p);
      bindPills(slot, p, function(){
        var openIdx = [];
        cont.querySelectorAll('.tree-node.expanded').forEach(function(n){
          openIdx.push(n.getAttribute('data-u-toggle'));
        });
        if (typeof window.aplicarFiltrosU === 'function') window.aplicarFiltrosU();
        else pintarListaUsuarios(cont, lista);
        openIdx.forEach(function(i){
          var node = document.querySelector('#usuariosList [data-u-toggle="'+i+'"]');
          if (!node) return;
          node.classList.add('expanded');
          node.setAttribute('aria-expanded', 'true');
          if (node.nextElementSibling) node.nextElementSibling.classList.add('open');
        });
      });
    });
    actualizarConteo('tpU', lista.length);
    // Agregar o quitar una tarjeta cambia las combinaciones que existen, así
    // que los botones se rehacen junto con la lista.
    if (window.APPIUsuariosBotones) window.APPIUsuariosBotones.pintar();
  }

  function montarBarraGestion(){
    css();
    var root = document.getElementById('gestionContent');
    if (!root) return;
    var host = document.getElementById('gestionTarjetasBar');
    if (!host){
      host = document.createElement('div');
      host.id = 'gestionTarjetasBar';
      var toolbar = root.querySelector('.gestion-toolbar');
      if (toolbar) toolbar.parentNode.insertBefore(host, toolbar);
      else root.insertBefore(host, root.firstChild);
    }
    host.innerHTML = barraHtml('tpG');
    bindBarra('tpG', function(){
      if (window.APPIGestion && typeof window.APPIGestion.render === 'function') window.APPIGestion.render();
      else if (window.APPIGestion && window.APPIGestion.setView) window.APPIGestion.setView('todos');
    });
    var n = 0;
    try{
      if (window.APPIGestion && window.APPIGestion.state && Array.isArray(window.APPIGestion.state.contacts)){
        n = filterPersonas(window.APPIGestion.state.contacts).length;
      }
    }catch(e){}
    actualizarConteo('tpG', n);
    root.querySelectorAll('.gestion-contact').forEach(function(card){
      var id = card.getAttribute('data-contact-id');
      var c = window.APPIGestion && window.APPIGestion.state.contacts.find(function(x){ return x.id === id; });
      if (!c) return;
      var tags = card.querySelector('.gestion-tags');
      if (tags && textoDe(c) && !tags.querySelector('[data-tp-tag]')){
        var pill = document.createElement('span');
        pill.className = 'gestion-tag';
        pill.setAttribute('data-tp-tag', '1');
        pill.textContent = '💳 ' + textoDe(c);
        tags.appendChild(pill);
      }
      if (filtroActivo() || mensajePromo.trim()){
        var actions = card.querySelector('.gestion-contact-actions');
        if (actions && !actions.querySelector('[data-tp-wa-card]')){
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'tp-wa';
          b.setAttribute('data-tp-wa-card', '1');
          b.textContent = '💬 Promo';
          b.onclick = function(e){ e.stopPropagation(); abrirWhatsApp(c); };
          actions.appendChild(b);
        }
      }
    });
  }
  function pintarContacto(drawer, contact){
    css();
    if (!drawer || !contact) return;
    var slot = drawer.querySelector('#tpContactSlot');
    if (!slot){
      slot = document.createElement('section');
      slot.className = 'gestion-detail-section';
      slot.id = 'tpContactSlot';
      var info = drawer.querySelector('.gestion-detail-section');
      if (info && info.nextSibling) info.parentNode.insertBefore(slot, info.nextSibling);
      else drawer.appendChild(slot);
    }
    slot.innerHTML = '<h3>Tarjetas</h3>' + pillsHtml(contact);
    bindPills(slot, contact, function(){ pintarContacto(drawer, contact); });
  }

  function resetFiltro(){
    filtro = { marca:'', banco:'', sin:false };
  }
  // El mensaje de promo ahora se escribe dentro del popup de Tarjetas, que vive
  // en otro archivo: se comparte el mismo texto para no tener dos copias.
  function mensajeActual(){ return mensajePromo; }
  function guardarMensaje(texto){
    mensajePromo = String(texto == null ? '' : texto);
    var caja = document.getElementById('tpUMsg');
    if (caja && caja.value !== mensajePromo) caja.value = mensajePromo;
  }
  // Los botones de Tarjetas de Usuarios eligen una combinación entera desde su
  // popup, en vez de marca y banco por separado.
  function aplicarFiltro(marca, banco){
    filtro = { marca: marca || '', banco: banco || '', sin: false };
  }

  function envolver(){
    if (window.__tpWrapped) return;
    if (typeof window.showView !== 'function') return;
    window.__tpWrapped = true;
    var orig = window.showView;
    window.showView = function(id){
      var r = orig.apply(this, arguments);
      try{
        if (id === 'view-usuarios') setTimeout(montarBarraUsuarios, 40);
        if (id === 'view-gestion') setTimeout(montarBarraGestion, 80);
      }catch(e){}
      return r;
    };
    if (window.APPIGestion && typeof window.APPIGestion.open === 'function'){
      var origOpen = window.APPIGestion.open;
      window.APPIGestion.open = function(){
        var r = origOpen.apply(this, arguments);
        setTimeout(montarBarraGestion, 120);
        return r;
      };
    }
  }

  window.APPITarjetas = {
    MARCAS: MARCAS,
    BANCOS: BANCOS,
    personKey: personKey,
    cardsOf: cardsOf,
    setCards: setCards,
    textoDe: textoDe,
    filtroActivo: filtroActivo,
    filterPersonas: filterPersonas,
    resetFiltro: resetFiltro,
    aplicarFiltro: aplicarFiltro,
    mensajeActual: mensajeActual,
    guardarMensaje: guardarMensaje,
    armarMensaje: armarMensaje,
    abrirWhatsApp: abrirWhatsApp,
    montarBarraUsuarios: montarBarraUsuarios,
    pintarListaUsuarios: pintarListaUsuarios,
    montarBarraGestion: montarBarraGestion,
    pintarContacto: pintarContacto
  };

  if (document.readyState === 'complete') envolver();
  else window.addEventListener('load', envolver);
  setTimeout(envolver, 900);
})();
