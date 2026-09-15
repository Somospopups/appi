/* ============================================================
   APPI · Mi stock
   ------------------------------------------------------------
   Lo que tenés en casa y lo que prestaste. PRESTAR saca 1
   unidad, pide a quién y la fecha de hoy. Devolver la vuelve
   al stock. Eliminar el préstamo no toca el stock.
   v741: el escáner lee "de memoria" — contrasta cada OCR con el
   catálogo oficial de PSA (psa-catalogo.json, la lista de
   precios de la tienda) y carga el equipo con el nombre exacto,
   en una sola pasada, apenas aparece la serie.
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
  function genStockId(){ return 'st_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
  // --- Undo: borrar con vuelta atrás (stock y pendientes) ---
  var undoState = null;
  var undoTimer = null;
  function asegurarUndoBar(){
    if ($('stUndoBar')) return $('stUndoBar');
    var b = document.createElement('div');
    b.id='stUndoBar';
    b.className='st-undo';
    b.innerHTML='<span id="stUndoMsg"></span><button type="button" id="stUndoBtn">↩ Deshacer</button><button type="button" id="stUndoClose" class="st-undo-close">✕</button>';
    document.body.appendChild(b);
    $('stUndoBtn').onclick = ejecutarUndo;
    $('stUndoClose').onclick = ocultarUndo;
    return b;
  }
  function mostrarUndo(tipo, data, msg){
    clearTimeout(undoTimer);
    undoState={tipo:tipo, data:data};
    var bar=asegurarUndoBar();
    $('stUndoMsg').textContent=msg;
    bar.classList.add('show');
    bar.style.display='flex';
    undoTimer=setTimeout(ocultarUndo, 8500);
  }
  function ocultarUndo(){
    var bar=$('stUndoBar');
    if(bar){ bar.classList.remove('show'); bar.style.display='none'; }
    undoState=null;
    clearTimeout(undoTimer);
  }
  function ejecutarUndo(){
    if(!undoState) return;
    if(undoState.tipo==='stock'){
      var items=leerStock();
      var idx=Math.min(undoState.data.idx, items.length);
      items.splice(idx,0, undoState.data.item);
      guardarStock(items);
      pintar();
      toast('Producto restaurado ✓');
    } else if(undoState.tipo==='pendiente'){
      var items2=leerPendientes();
      var idx2=Math.min(undoState.data.idx, items2.length);
      items2.splice(idx2,0, undoState.data.item);
      guardarPendientes(items2);
      pintar();
      toast('Pendiente restaurado ✓');
    }
    ocultarUndo();
  }
  function leerStock(){
    try{
      var raw = JSON.parse(localStorage.getItem(stockKey()) || '[]');
      if(!Array.isArray(raw)) return [];
      var list = raw.filter(function(it){ return it && it.nombre && Number(it.cant) > 0; });
      var changed = false;
      list.forEach(function(it){ if(!it.id){ it.id = genStockId(); changed=true; } });
      if(changed){ try{ localStorage.setItem(stockKey(), JSON.stringify(list)); }catch(e){} }
      return list;
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
  // Colores reconocidos → nombre canónico (mismo mapa que el QR).
  function colorLimpio(s){
    var w = String(s || '').trim();
    if (!w) return '';
    var n = COLORES_QR[norm(w)];
    if (n) return n;
    return nombreLimpio(w);
  }

  // Alta manual (PRODUCTO / COLOR / N° DE SERIE / cantidad).
  //  - Con serie: fila propia (igual que la escaneada); serie repetida → no se duplica.
  //  - Con color (sin serie): se suma a la fila del mismo producto Y color.
  //  - Sin color: se suma a la fila del mismo producto (comportamiento de siempre).
  // Nunca se suma a una fila que tenga serie: cada serie es un equipo.
  function agregarManual(d){
    var items = leerStock();
    if (d.serie) {
      if (items.some(function(it){ return it.serie && norm(it.serie) === norm(d.serie); })) return 'duplicada';
      items.push({ id: genStockId(), nombre: d.nombre, color: d.color || '', serie: d.serie, cant: 1 });
      guardarStock(items);
      return 'agregado';
    }
    var n = norm(d.nombre);
    var c = norm(d.color);
    var hit = items.find(function(it){
      if (it.serie) return false;
      if (norm(it.nombre) !== n) return false;
      return c ? norm(it.color || '') === c : !it.color;
    });
    if (hit) hit.cant = (Number(hit.cant) || 0) + d.cant;
    else items.push({ id: genStockId(), nombre: d.nombre, color: d.color || '', serie: '', cant: d.cant });
    guardarStock(items);
    return 'agregado';
  }

  /* ---------- Lector QR de la caja (v733) ----------
     Escanea el QR impreso en la caja y carga el equipo al stock con
     nombre + color + número de serie, sin tipear nada. */

  var COLORES_QR = {
    'nero': 'Nero', 'negro': 'Nero', 'black': 'Nero',
    'bianco': 'Bianco', 'blanco': 'Bianco', 'white': 'Bianco',
    'grigio': 'Grigio', 'gris': 'Grigio', 'gray': 'Grigio'
  };

  function serieLike(s){
    var w = String(s || '').trim();
    return /^cad\d{4,}$/i.test(w) || /^[a-z]{0,3}\d{5,}$/i.test(w);
  }

  function nombreLimpio(s){
    var w = String(s || '').replace(/\s+/g, ' ').trim();
    if (!w) return '';
    return w.split(' ').map(function(p){
      p = p.replace(/[.,;:]+$/, '');
      if (!p) return '';
      if (p === p.toUpperCase() && p.length <= 3 && /[a-z]/i.test(p)) return p;
      return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
    }).filter(Boolean).join(' ');
  }

  // Lee el contenido del QR y devuelve { producto, color, serie }
  // (o null si no hay nada reconocible). Acepta texto plano del estilo de la
  // etiqueta ("PSA SENIOR 4 NERO + KIT POSV. CAD09803"), delimitadores
  // (|, ;, ,) y URLs con parámetros (producto, color, serie/serial).
  function parseQR(texto){
    var bruto = String(texto || '').trim();
    if (!bruto) return null;
    var t = { producto: '', color: '', serie: '' };
    var esURL = /^https?:\/\//i.test(bruto);
    if (esURL) {
      try {
        var u = new URL(bruto);
        var params = {};
        u.searchParams.forEach(function(v, k){ params[String(k).toLowerCase()] = String(v).trim(); });
        var path = u.pathname.split('/').filter(Boolean).map(function(s){
          try { return decodeURIComponent(s); } catch (e) { return s; }
        });
        t.serie = params.serie || params.serial || params.cad || params.sn || '';
        t.color = params.color || params.colour || '';
        t.producto = params.producto || params.product || params.nombre || params.modelo || params.model || '';
        if (!t.serie) t.serie = (path.find(function(s){ return serieLike(s); }) || '');
        if (!t.color) t.color = (path.find(function(s){ return COLORES_QR[norm(s)]; }) || '');
        if (!t.producto) t.producto = (path.filter(function(s){ return !serieLike(s) && !COLORES_QR[norm(s)]; }).pop() || '');
      } catch (e) { /* sin parámetros: no se fuerza nada */ }
    }
    if (!esURL && (!t.producto || !t.serie)) {
      var limpio = bruto.replace(/[|;,\u00b7]+/g, ' ');
      var palabras = limpio.split(/\s+/).filter(Boolean);
      var quitados = [];
      var iS = -1, iC = -1;
      if (!t.serie) {
        iS = palabras.findIndex(serieLike);
        if (iS >= 0) { t.serie = palabras[iS]; quitados.push(iS); }
      }
      if (!t.color) {
        iC = palabras.findIndex(function(p, i){ return quitados.indexOf(i) < 0 && !!COLORES_QR[norm(p)]; });
        if (iC >= 0) { t.color = COLORES_QR[norm(palabras[iC])]; quitados.push(iC); }
      }
      if (!t.producto) {
        // Estructura de la etiqueta: "PSA <NOMBRE> <COLOR> + K. POSV." + SERIE.
        // El nombre es TODO lo que va antes del color (o antes de la serie,
        // si el color no se leyó), más el kit tal como figura cuando aparece.
        // Lo que venga después —ruido de la caja o de otra etiqueta— se
        // descarta: la carga tiene que ser EXACTA.
        var limite = (iC >= 0) ? iC : ((iS >= 0) ? iS : palabras.length);
        var base = palabras.slice(0, limite).join(' ');
        var resto = palabras.slice(limite).map(norm);
        var posv = resto.indexOf('posv');
        var kitIdx = resto.indexOf('kit');
        if (posv >= 0) {
          var kitTxt = (kitIdx >= 0 && kitIdx <= posv) ? 'KIT Posv' : 'K Posv';
          base = base ? (base + ' + ' + kitTxt) : kitTxt;
        }
        t.producto = base;
      }
    }
    t.producto = nombreLimpio(t.producto);
    t.serie = String(t.serie || '').toUpperCase();
    if (t.color) t.color = COLORES_QR[norm(t.color)] || nombreLimpio(t.color);
    if (!t.producto) return null;
    return t;
  }

  // Agrega el equipo escaneado al stock. La serie no se duplica nunca.
  function agregarQR(datos){
    var items = leerStock();
    if (datos.serie) {
      var s = norm(datos.serie);
      if (items.some(function(it){ return it.serie && norm(it.serie) === s; })) return 'duplicada';
    }
    items.push({ id: genStockId(), nombre: datos.producto, color: datos.color || '', serie: datos.serie || '', cant: 1 });
    guardarStock(items);
    return 'agregado';
  }

  function procesarQR(texto){
    var datos = parseQR(texto);
    if (datos && datos.producto) {
      var r = agregarQR(datos);
      pintar();
      var etiqueta = datos.producto + (datos.color ? ' ' + datos.color : '') + (datos.serie ? ' · ' + datos.serie : '');
      if (r === 'duplicada') {
        if (window.APPIDialog) window.APPIDialog.alert('Esa serie ya está en tu stock (' + etiqueta + '). No se duplica.', { title:'Serie repetida', icon:'📦' });
        return;
      }
      toast(etiqueta + ' agregado al stock ✓');
      return;
    }
    // Código que no reconoce: pregunta el nombre y lo suma igual.
    if (!window.APPIDialog) return;
    window.APPIDialog.prompt('El código dice: "' + String(texto).slice(0, 80) + '". No lo reconozco: ¿con qué nombre lo sumo al stock?', '', { title:'Producto no reconocido', icon:'📷', okText:'Agregar' }).then(function(nombre){
      if (nombre == null) return;
      nombre = String(nombre).trim();
      if (!nombre) return;
      var items = leerStock();
      items.push({ id: genStockId(), nombre: nombreLimpio(nombre), color: '', serie: serieLike(String(texto).trim()) ? String(texto).trim().toUpperCase() : '', cant: 1 });
      guardarStock(items);
      pintar();
      toast('Producto agregado 📦');
    });
  }

  // Decodifica un QR (o no) a partir de los pixels RGBA de un frame.
  function decodificarFrame(rgba, w, h){
    if (!window.ZXing) return null;
    var n = w * h, out = new Int32Array(n), i, j;
    for (i = 0; i < n; i++) { j = i * 4; out[i] = (rgba[j + 3] << 24) | (rgba[j] << 16) | (rgba[j + 1] << 8) | rgba[j + 2]; }
    try {
      var src = new window.ZXing.RGBLuminanceSource(out, w, h);
      var bm = new window.ZXing.BinaryBitmap(new window.ZXing.GlobalHistogramBinarizer(src));
      var reader = new window.ZXing.MultiFormatReader();
      reader.setHints(new Map([[window.ZXing.DecodeHintType.POSSIBLE_FORMATS, [window.ZXing.BarcodeFormat.QR_CODE]]]));
      return reader.decode(bm).getText();
    } catch (e) { return null; }
  }

  var escan = { abierto: false, timer: null, stream: null, track: null, linterna: false };
  var vivo = { serieQR: '', ultimoNombre: '', ultimaLectura: null, seguidas: 0, giro: 0, ocrCarrera: false, ocrProxima: 0, motor: 'esperando' };
  var canvasFrame = null;
  var canvasOCR = null;

  /* ---------- Lectura en vivo de la etiqueta (v740) ----------
     Un solo escáner, con marco alargado (forma de etiqueta): al
     apuntar a la caja se lee solo, sin fotos ni pasos: el QR da la
     serie (confiable) y el texto impreso se transcribe con OCR local
     (Tesseract, offline). SOLO se lee lo que está DENTRO del cuadro
     (v740): el texto se recorta exacto al campo y el QR se lee con
     margen de silencio (18%) — lo que quede afuera, bloqueado.
     Velocidad: el motor OCR se calienta al abrir Mi Stock, el OCR
     agranda el recorte (~1000 px) en grises con contraste, la
     confirmación sale a los ~0,9 s de una lectura buena y, cuando
     hay nombre + color + serie, la unidad se carga al toque. El
     motor se descarga una sola vez (~8 MB) y queda en caché
     (service worker + IndexedDB): después funciona sin internet. */

  var ocrWorker = null;
  var ocrPromise = null;

  // v761: lector ultra-rápido con BarcodeDetector nativo (Chrome/Edge) + fallback ZXing
  var barcodeDetector = null;
  try{ if('BarcodeDetector' in window){ barcodeDetector = new window.BarcodeDetector({formats:['qr_code']}); } }catch(e){}
  // Pre-calentar OCR y catálogo al cargar la página (no al abrir la cámara)
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', function(){ cargarMotorOCR().catch(function(){}); cargarCatalogo().catch(function(){}); });
  else { setTimeout(function(){ cargarMotorOCR().catch(function(){}); cargarCatalogo().catch(function(){}); }, 800); }
  function cargarMotorOCR(){
    if (ocrPromise) return ocrPromise;
    ocrPromise = new Promise(function(resolve, reject){
      // El worker de tesseract usa importScripts con la URL que le
      // pasamos: tiene que ser absoluta (relativa rompería el blob
      // worker) y gzip: false porque fijamos el traineddata sin
      // comprimir.
      var base = new URL('vendor/tesseract/', location.href).href;
      function listo(){
        window.Tesseract.createWorker('eng', 1, {
          workerPath: base + 'worker.min.js',
          corePath: base,
          langPath: base,
          gzip: false
        }).then(function(w){
          // v742: OCR más rápido y menos ruidoso. Las etiquetas PSA solo
          // traen MAYÚSCULAS, números, "+", "." y "-" (whitelist): el
          // motor reconoce más rápido y ya no inventa "OF AO) AE". PSM 6
          // = bloque de texto corto (las etiquetas son 1-2 líneas).
          w.setParameters({
            tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+.- ',
            tessedit_pageseg_mode: '6'
          }).then(function(){ ocrWorker = w; resolve(w); }, function(){ ocrWorker = w; resolve(w); });
        }, function(e){ ocrPromise = null; reject(e); });
      }
      if (window.Tesseract) { listo(); return; }
      var s = document.createElement('script');
      s.src = base + 'tesseract.min.js';
      s.onload = listo;
      s.onerror = function(){ ocrPromise = null; reject(new Error('No pude cargar el motor OCR.')); };
      document.head.appendChild(s);
    });
    return ocrPromise;
  }

  function rotarCanvas(src, grados){
    var c = document.createElement('canvas');
    if (grados === 90 || grados === 270) { c.width = src.height; c.height = src.width; }
    else { c.width = src.width; c.height = src.height; }
    var ctx = c.getContext('2d');
    ctx.translate(c.width / 2, c.height / 2);
    ctx.rotate(grados * Math.PI / 180);
    ctx.drawImage(src, -src.width / 2, -src.height / 2);
    return c;
  }

  // Grises + estirado de contraste: Tesseract lee mucho mejor una
  // imagen monocromática con el texto bien separado del fondo crema.
  function preprocesoOCR(ctx, w, h){
    try {
      var img = ctx.getImageData(0, 0, w, h);
      var d = img.data, n = w * h;
      var min = 255, max = 0, i, g;
      var lum = new Uint8ClampedArray(n);
      for (i = 0; i < n; i++) {
        g = (d[i * 4] * 299 + d[i * 4 + 1] * 587 + d[i * 4 + 2] * 114) / 1000;
        lum[i] = g;
        if (g < min) min = g;
        if (g > max) max = g;
      }
      var range = Math.max(1, max - min);
      for (i = 0; i < n; i++) {
        g = ((lum[i] - min) * 255) / range | 0;
        d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = g;
      }
      ctx.putImageData(img, 0, 0);
    } catch (e) { /* sin preproceso igual se intenta el OCR */ }
  }

  // ---------------------------------------------------------------------------
  // v743 · Referencia del catálogo oficial: la lista "Precios Sugeridos
  // con Acuerdo" de PSA (psa-catalogo.json, 312 productos = TODOS los de
  // la lista + los que solo vende la tienda; también se publica en
  // Supabase). El escáner contrasta CADA lectura de OCR contra los
  // productos reales: si el texto (aunque traiga ruido de OCR) coincide
  // con un producto conocido, se sabe exacto lo que dice la etiqueta.
  // Resultado: más rápido (no hace falta una segunda lectura estable ni
  // probar orientaciones de a ciegas) y más exacto (el nombre y el color
  // se escriben como figuran en el catálogo oficial).
  // ---------------------------------------------------------------------------
  var catalogo = [];
  var catalogoCarga = null;

  // "14-SEP-2026" / "13-Sep-2026" → número comparable (o 0 si no se puede).
  function fechaCatalogoNum(f){
    var MESES = { ene:1, feb:2, mar:3, abr:4, may:5, jun:6, jul:7, ago:8, sep:9, oct:10, nov:11, dic:12 };
    var m = String(f || '').match(/^(\d{1,2})-([A-Za-záéíóú]{3})-(\d{4})$/);
    if (!m) return 0;
    var mes = MESES[m[2].toLowerCase()];
    if (!mes) return 0;
    return parseInt(m[3], 10) * 10000 + mes * 100 + parseInt(m[1], 10);
  }

  function cargarCatalogo(){
    if (catalogo.length) return Promise.resolve(catalogo);
    if (catalogoCarga) return catalogoCarga;
    catalogoCarga = new Promise(function(resolve){
      var urls = [];
      try {
        var cfg = window.APPI_AUTH;
        if (cfg && cfg.url && cfg.anonKey) urls.push(cfg.url + '/storage/v1/object/public/catalogo-psa/psa-catalogo.json');
      } catch (e) { /* sin config: se usa el archivo local */ }
      urls.push('psa-catalogo.json');
      // Se traen las DOS fuentes y se usa la MÁS RECIENTE (actualizado):
      // la de Supabase se renueva con el botón "Actualizar" (lee la lista
      // "Precios Sugeridos con Acuerdo" de PSA); el archivo local viaja
      // con la versión de la app y es el respaldo offline.
      var candidatas = urls.map(function(u){
        return fetch(u + '?t=' + Date.now(), { cache: 'no-store' })
          .then(function(r){ return r.ok ? r.json() : null; })
          .catch(function(){ return null; });
      });
      Promise.all(candidatas).then(function(js){
        var mejor = null;
        for (var i = 0; i < js.length; i++) {
          var j = js[i];
          if (!j || !j.productos || !j.productos.length) continue;
          if (!mejor) { mejor = j; continue; }
          var fm = fechaCatalogoNum(meJOR.actualizado), fn = fechaCatalogoNum(j.actualizado);
          if (fn > fm) mejor = j;
          else if (fn === fm && j.productos.length > mejor.productos.length) mejor = j;
        }
        catalogo = mejor ? mejor.productos.filter(function(p){ return p && p.nombre; }) : [];
        resolve(catalogo);
      }).catch(function(){ resolve([]); });
    }).then(function(c){ catalogoCarga = null; return c; });
    return catalogoCarga;
  }

  var ROMANOS_CATALOGO = { ii: '2', iii: '3', iv: '4', vi: '6', ix: '9' };
  var COLORES_CATALOGO = {
    'bianco': 'Bianco', 'blanco': 'Bianco', 'blanca': 'Bianco',
    'nero': 'Nero', 'negro': 'Nero', 'negra': 'Nero',
    'grigio': 'Grigio', 'gris': 'Grigio'
  };
  // Sufijos de kit/posventa: figuran en el nombre de la lista con acuerdo
  // ("… + KIT POSV.") y en la etiqueta, pero el OCR a veces los lee y a
  // veces no: en el match no puntúan ni obligan.
  var OPCIONALES_CATALOGO = { kit: 1, posv: 1, k: 1 };

  function tokenCat(t){
    t = String(t || '').replace(/[^a-z0-9]/g, '');
    return ROMANOS_CATALOGO[t] || t;
  }

  function palabrasCat(t){
    var raw = String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ').split(/\s+/).filter(Boolean).map(tokenCat);
    // "S-1000" se escribe "S 1000" y "SENIOR 4" a veces "SENIOR4": un
    // número pegado al modelo viaja con la palabra previa (s+1000 → s1000,
    // senior+4 → senior4). Catálogo y etiqueta se normalizan igual.
    var out = [];
    for (var i = 0; i < raw.length; i++) {
      var tk = raw[i];
      if (out.length && /[a-z]$/.test(out[out.length - 1]) && /^[0-9]+$/.test(tk)) {
        out[out.length - 1] += tk;
      } else {
        out.push(tk);
      }
    }
    return out;
  }

  // Distancia de edición (para leer "VER0" como "vero", "B1ANCO" como "bianco").
  function distEdit(a, b){
    var m = a.length, n = b.length;
    if (Math.abs(m - n) > 2) return 99;
    var prev = [], cur = [];
    for (var j = 0; j <= n; j++) prev[j] = j;
    for (var i = 1; i <= m; i++) {
      cur[0] = i;
      for (var k = 1; k <= n; k++) {
        cur[k] = Math.min(prev[k] + 1, cur[k - 1] + 1, prev[k - 1] + (a.charAt(i - 1) === b.charAt(k - 1) ? 0 : 1));
      }
      var tmp = prev; prev = cur; cur = tmp;
    }
    return prev[n];
  }

  function puntosToken(cat, ocr){
    if (cat === ocr) return 2;
    var d = distEdit(cat, ocr);
    if (d === 1 && Math.min(cat.length, ocr.length) >= 3) return 1.5;
    if (d === 2 && Math.min(cat.length, ocr.length) >= 7) return 1;
    if (cat.length >= 4 && ocr.length >= 4 && (cat.indexOf(ocr) === 0 || ocr.indexOf(cat) === 0)) return 1;
    return 0;
  }

  // Nombre "base" para la fila: sin el sufijo de kit/posventa y sin el
  // color (que vive en su propio campo). "PSA SENIOR 4 BIANCO + KIT POSV."
  // → "PSA SENIOR 4" · "Ducha PSA Rinnova - Bianco con KDF" → "Ducha PSA Rinnova".
  function baseDeNombre(nombreCompleto, color){
    var n = String(nombreCompleto || '').trim();
    n = n.replace(/\s*\+\s*(?:KIT\s+)?K?\.?\s*POSV\.?(?:\s+PLAN\s+CANJE)?\.?$/i, '').trim();
    n = n.replace(/\s+PLAN\s+CANJE\.?$/i, '').trim();
    if (color) {
      var esc = color.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // forma "… - Color …": cortar en el guion (queda la base limpia)
      var mDash = n.match(new RegExp('^(.*?)(\\s*-\\s*' + esc + '\\b.*)$', 'i'));
      if (mDash && mDash[1]) return mDash[1].trim();
      // forma "… Color …": quitar solo la palabra del color
      var mPal = n.match(new RegExp('\\s*' + esc + '\\b', 'i'));
      if (mPal) n = (n.slice(0, mPal.index) + ' ' + n.slice(mPal.index + mPal[0].length)).replace(/\s+/g, ' ').trim();
    }
    return n;
  }

  // Contrastar el texto OCR contra el catálogo. Devuelve
  // { nombre, color, nombreCompleto, score, ambiguo } o null cuando no hay
  // coincidencia clara. "ambiguo" = dos productos empatados (ej. Senior vs
  // Senior4): en ese caso no se decide solo.
  function matchCatalogo(textoOCR){
    if (!catalogo.length) return null;
    var palabras = palabrasCat(textoOCR);
    if (palabras.length < 2) return null;
    var colorOCR = '';
    for (var w = 0; w < palabras.length; w++) {
      if (COLORES_CATALOGO[palabras[w]]) { colorOCR = COLORES_CATALOGO[palabras[w]]; break; }
    }
    var candidatas = [];
    for (var i = 0; i < catalogo.length; i++) {
      var nombreCompleto = String(catalogo[i].nombre || '');
      var cat = palabrasCat(nombreCompleto);
      if (cat.length < 2) continue;
      // Cada palabra del producto debe encontrar eco en lo leído (los
      // sufijos de kit/posventa no obligan: el OCR a veces no los ve).
      var puntos = 0, req = 0, ok = true;
      for (var k = 0; k < cat.length; k++) {
        if (OPCIONALES_CATALOGO[cat[k]]) continue;
        var mejor = 0;
        for (var p = 0; p < palabras.length; p++) mejor = Math.max(mejor, puntosToken(cat[k], palabras[p]));
        if (mejor === 0) { ok = false; break; }
        puntos += mejor;
        req++;
      }
      if (!ok || !req) continue;
      // El color: primera palabra-color del nombre, en cualquier posición.
      // Si el nombre no trae color, se respeta el que leyó el OCR. Si el
      // OCR leyó OTRO color, es otra variante y se descarta.
      var color = '';
      for (var c2 = 0; c2 < cat.length; c2++) {
        if (COLORES_CATALOGO[cat[c2]]) { color = COLORES_CATALOGO[cat[c2]]; break; }
      }
      if (!color) color = colorOCR;
      if (colorOCR && color !== colorOCR) continue;
      var base = baseDeNombre(nombreCompleto, color);
      if (base) candidatas.push({ nombre: base, color: color, nombreCompleto: nombreCompleto, score: puntos / req });
    }
    if (!candidatas.length) return null;
    candidatas.sort(function(a, b){ return b.score - a.score; });
    var top = candidatas[0];
    var ambiguo = candidatas.length > 1 && (top.score - candidatas[1].score) < 0.1;
    return { nombre: top.nombre, color: top.color, nombreCompleto: top.nombreCompleto, score: top.score, ambiguo: ambiguo };
  }

  // El PRODUCTO manual sugiere los nombres oficiales del catálogo.
  function datalistCatalogo(){
    if (!catalogo.length || $('stCatDl')) return;
    var dl = document.createElement('datalist');
    dl.id = 'stCatDl';
    dl.innerHTML = catalogo.map(function(p){ return '<option value="' + esc(p.nombre) + '"></option>'; }).join('');
    document.body.appendChild(dl);
  }

  // Puntúa qué lectura OCR se parece a una etiqueta real.
  function scoreEtiqueta(parsed, conf){
    if (!parsed) return 0;
    var s = 0;
    if (parsed.producto) s += 30;
    if (parsed.color) s += 30;
    if (parsed.serie && serieLike(parsed.serie)) s += 40;
    var p = norm(parsed.producto);
    if (/(psa|senior|vero|mini|senik|quantum|1000|bm)/.test(p)) s += 20;
    s += Math.min(10, Math.round((conf || 0) / 10));
    return s;
  }

  // OCR simple de un canvas (mismo motor que la cámara). Expuesto para
  // las pruebas: verifica que el motor local siga leyendo etiquetas.
  function ocrCanvas(canvas, grados){
    return (async function(){
      var motor = await cargarMotorOCR();
      var g = grados || 0;
      var cv = (g === 0) ? canvas : rotarCanvas(canvas, g);
      var r = await motor.recognize(cv);
      var texto = (r.data.text || '').trim();
      return { texto: texto, confidence: r.data.confidence || 0, parsed: parseQR(texto) };
    })();
  }

  /* Bip de confirmación al leer el QR. Se sintetiza con Web Audio (sin
     archivos): suena la primera vez que decodifica y no toca nada más. */
  var audioCtx = null;

  function prepararAudio(){
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!audioCtx) audioCtx = new AC();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (e) { /* sin audio no pasa nada */ }
  }

  function bipNotas(notas, vol){
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!audioCtx) audioCtx = new AC();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      (notas || []).forEach(function(nota){
        var t0 = audioCtx.currentTime + nota[1];
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = nota[0];
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(vol || 0.35, t0 + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.11);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.14);
      });
    } catch (e) { /* el sonido nunca rompe el escaneo */ }
  }

  // Doble pitido ascendente (D6 → G6): el clásico "cargado" — la acción
  // se realizó.
  function sonidoQR(){ bipNotas([[1175, 0], [1568, 0.09]]); }
  // Pitido único: "leí el QR" (feedback inmediato al enfocar).
  function bipUno(){ bipNotas([[1568, 0]]); }

  function overlayEscan(){
    if ($('stQROv')) return;
    var ov = document.createElement('div');
    ov.id = 'stQROv';
    ov.className = 'stqrov';
    ov.innerHTML =
      '<div class="stqr-top"><button type="button" id="stqrCerrar" aria-label="Cerrar escáner">✕</button><div class="stqr-titulo">📷 Cargar equipo</div><span></span></div>' +
      '<div class="stqr-marco"><video id="stqrVideo" playsinline muted autoplay></video><canvas id="stqrFotoCanvas" style="display:none;width:100%;height:100%;object-fit:cover;background:#000"></canvas><div class="stqr-cuadro"></div><div class="stqr-linea"></div></div>' +
      '<p class="stqr-ayuda" id="stqrEstado">Abriendo cámara…</p>' +
      '<div class="stqr-acciones" style="display:flex;gap:10px;justify-content:center;align-items:center;padding:10px 16px 14px"><button type="button" id="stqrTorchBtn" style="display:none;flex:0 0 54px;width:54px;height:54px;border-radius:14px;border:0;background:rgba(255,255,255,.14);color:#fff;font-size:22px;cursor:pointer;backdrop-filter:blur(8px)" aria-label="Linterna" aria-pressed="false">🔦</button><button type="button" id="stqrFotoBtn" style="flex:1;max-width:360px;padding:14px 18px;border-radius:14px;border:0;background:linear-gradient(135deg,#0b5878,#3ad0a4);color:#fff;font-weight:900;font-size:15px;cursor:pointer;box-shadow:0 4px 16px rgba(91,141,239,.4)">📸 Capturar</button></div>';
    document.body.appendChild(ov);
    $('stqrCerrar').onclick = cerrarEscan;
    var fb = $('stqrFotoBtn');
    if(fb) fb.onclick = capturarFoto;
    var tb = $('stqrTorchBtn');
    if(tb) tb.onclick = toggleLinterna;
  }
  function toggleLinterna(){
    var track = escan.track || (escan.stream && escan.stream.getVideoTracks()[0]) || null;
    if (!track){ estado('Linterna no disponible'); return; }
    var caps = {};
    try{ caps = track.getCapabilities ? track.getCapabilities() : {}; }catch(e){}
    if (!caps.torch){ estado('Este dispositivo no tiene linterna'); return; }
    var encender = !escan.linterna;
    track.applyConstraints({ advanced: [{ torch: encender }] }).then(function(){
      escan.linterna = encender;
      var b = $('stqrTorchBtn');
      if (b){
        b.textContent = encender ? '💡' : '🔦';
        b.style.background = encender ? '#ffd400' : 'rgba(255,255,255,.14)';
        b.style.color = encender ? '#1a1a2e' : '#fff';
        b.setAttribute('aria-pressed', encender ? 'true' : 'false');
      }
      estado(encender ? 'Linterna encendida 💡 — tocá de nuevo para apagar' : 'Linterna apagada');
    }).catch(function(){ estado('No pude controlar la linterna en este navegador'); });
  }

  function estado(msg){
    var est = $('stqrEstado');
    if (est) est.textContent = msg;
  }

  function abrirEscan(modo){
    css();
    overlayEscan();
    prepararAudio();
    escan.abierto = true;
    // Modo: el que le pasa el botón que lo abrió (en escritorio conviven
    // las dos cámaras); si no, el del tab activo. stock = etiqueta
    // completa (QR+OCR); pendientes = base del equipo canjeado (solo el
    // QR con la serie).
    vivo.modo = modo || (tab === 'pendientes' ? 'pendientes' : 'stock');
    vivo.serieQR = '';
    vivo.ultimoNombre = '';
    vivo.ultimaLectura = null;
    vivo.seguidas = 0;
    vivo.giro = 0;
    vivo.ocrCarrera = false;
    vivo.ocrProxima = 0;
    vivo.motor = 'esperando';
    var ov = $('stQROv');
    if (ov) {
      ov.classList.add('open');
      // En Pendientes el cuadro vuelve a ser el cuadradito de siempre
      // (solo hay que enmarcar el QR de la base, no la etiqueta completa).
      ov.classList.toggle('stqr-square', vivo.modo === 'pendientes');
      var tit = ov.querySelector('.stqr-titulo');
      if (tit) tit.textContent = vivo.modo === 'pendientes' ? '📷 Base del equipo viejo' : '📷 Cargar equipo';
    }
    if (window.bloquearScrollCuerpo) window.bloquearScrollCuerpo();
    if (vivo.modo === 'pendientes') {
      // Solo hace falta el QR de la base: no se carga el motor OCR ni el
      // catálogo (ni banda ni CPU).
      vivo.motor = 'pendientes';
      // Pre-carga: mientras apuntás, la base de garantías ya se está
      // bajando en segundo plano; el escaneo no espera internet.
      cargarBasePSA().then(function(ok){
        if (escan.abierto && vivo.modo === 'pendientes')
          estado(ok ? 'Base de PSA lista ✓ — apuntá al QR de la base' : 'La base no cargó todavía; al escanear consulto de todos modos…');
      });
    } else {
      // El motor OCR se prepara AHORA (no al primer frame): la primera
      // pasada de texto sale lo antes posible.
      vivo.motor = 'cargando';
      cargarMotorOCR().then(function(){
        vivo.motor = 'listo';
      }, function(){
        vivo.motor = 'error';
        if (escan.abierto) estado('El lector de texto no cargó (la primera vez hay que tener internet). El QR sigue leyendo igual.');
      });
    }
    // v762: botón 📸: texto según modo y asegurar vista video
    try{
      var fb2 = $('stqrFotoBtn');
      var v2 = $('stqrVideo');
      var fc2 = $('stqrFotoCanvas');
      if (v2) v2.style.display='block';
      if (fc2) fc2.style.display='none';
      if (fb2){ fb2.style.display=''; fb2.disabled=false; fb2.textContent = vivo.modo === 'pendientes' ? '📸 Capturar QR' : '📸 Capturar'; }
    }catch(e){}
    // v741: la referencia del catálogo también lista antes del primer
    // frame (si no hay, el escáner sigue igual: lectura estructural).
    cargarCatalogo().then(datalistCatalogo, function(){});
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      estado('Este navegador no da acceso a la cámara.');
      return;
    }
    var conCamara = false;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false })
      .then(function(stream){
        if (!escan.abierto) { stream.getTracks().forEach(function(tr){ tr.stop(); }); return; }
        escan.stream = stream;
        escan.track = (stream.getVideoTracks && stream.getVideoTracks()[0]) || null;
        escan.linterna = false;
        // Mostrar botón linterna solo si el dispositivo la soporta
        setTimeout(function(){
          try{
            var tr = escan.track;
            var bt = $('stqrTorchBtn');
            if (!bt) return;
            var caps = tr && tr.getCapabilities ? tr.getCapabilities() : {};
            if (caps.torch){
              bt.style.display = 'flex';
              bt.style.alignItems='center';
              bt.style.justifyContent='center';
              bt.textContent='🔦';
              bt.style.background='rgba(255,255,255,.14)';
              bt.style.color='#fff';
              bt.setAttribute('aria-pressed','false');
            } else {
              bt.style.display='none';
            }
          }catch(e){}
        }, 450);
        var video = $('stqrVideo');
        video.srcObject = stream;
        return video.play().then(function(){
          conCamara = true;
          if (vivo.modo === 'pendientes') estado('Apuntá al QR de la BASE del purificador (abajo, con el N° de serie) y quedate ahí…');
          else estado('Apuntá a la etiqueta completa (con su QR) dentro del cuadro y quedate ahí…');
        });
      })
      .catch(function(err){
        estado('No pude abrir la cámara. Permití el acceso en el navegador y tocá 📷 otra vez.' + (err && err.name ? ' (' + err.name + ')' : ''));
      })
      .then(function(){ if (escan.abierto && conCamara) bucleVivo(); });
  }

  // Bucle en vivo v762: estable y rápido. QR ZXing cada 180ms (antes 450) + willReadFrequently.
  // También queda el botón 📸 Capturar para foto sin guardar (mucho más nítida para OCR).
  function bucleVivo(){
    if (!escan.abierto) return;
    escan.timer = setTimeout(bucleVivo, 180);
    var video = $('stqrVideo');
    if (!video || !video.videoWidth) return;
    try {
      var cf = recorteEnVideo(video, 0.18, 720);
      var ctx = cf.getContext('2d', {willReadFrequently:true});
      var txtQR = decodificarFrame(ctx.getImageData(0, 0, cf.width, cf.height).data, cf.width, cf.height);
      if (txtQR) qrVivo(txtQR);
      if (vivo.modo === 'pendientes') return;
      if (!vivo.ocrCarrera && Date.now() >= vivo.ocrProxima) {
        vivo.ocrCarrera = true;
        vivo.ocrProxima = Date.now() + 1000;
        pasadaOCR();
      }
    } catch (e) {}
  }
  // Helper para foto: recorta la foto capturada usando la geometría del cuadro actual
  function recorteEnVideoFoto(fotoCanvas, video, margen, maxAncho){
    var rc = recorteCuadro(video, margen) || {x:0,y:0,w:fotoCanvas.width,h:fotoCanvas.height};
    var c = document.createElement('canvas');
    var w = rc.w, h = rc.h;
    if(maxAncho && w>maxAncho){ h = Math.round(h*maxAncho/w); w = maxAncho; }
    c.width = w; c.height = h;
    c.getContext('2d').drawImage(fotoCanvas, rc.x, rc.y, rc.w, rc.h, 0,0,w,h);
    return c;
  }
  // 📸 Foto sin guardar: congela el frame actual en alta resolución y lo lee con QR+OCR
  function capturarFoto(){
    var video = $('stqrVideo');
    if (!escan.abierto || !video || !video.videoWidth) return;
    var btn = $('stqrFotoBtn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Leyendo…'; }
    estado('📸 Foto tomada — leyendo…');
    var w = video.videoWidth, h = video.videoHeight;
    var foto = document.createElement('canvas');
    foto.width = w; foto.height = h;
    try{ foto.getContext('2d').drawImage(video, 0, 0, w, h); }catch(e){}
    // Mostrar freeze
    try{
      var v = $('stqrVideo');
      var fc = $('stqrFotoCanvas');
      if (fc && v){
        fc.width = w; fc.height = h;
        // dibujar con object-fit cover simulado: ya es full, solo copiar
        fc.getContext('2d').drawImage(foto, 0, 0);
        fc.style.display='block';
        v.style.display='none';
      }
    }catch(e){}
    (async function(){
      var qrText = '';
      // 1) Intentar BarcodeDetector nativo sobre la foto recortada al cuadro
      if (barcodeDetector){
        try{
          var rc = recorteCuadro(video, 0.12) || {x:0,y:0,w:w,h:h};
          var qc = document.createElement('canvas');
          var qw = Math.min(rc.w, 900);
          var qh = Math.round(rc.h * qw / rc.w);
          qc.width = qw; qc.height = qh;
          qc.getContext('2d').drawImage(foto, rc.x, rc.y, rc.w, rc.h, 0, 0, qw, qh);
          var codes = await barcodeDetector.detect(qc);
          if (codes && codes[0] && codes[0].rawValue) qrText = String(codes[0].rawValue).trim();
        }catch(e){}
      }
      if (!qrText){
        try{
          var cf = recorteEnVideoFoto(foto, video, 0.12, 900);
          var ctx = cf.getContext('2d', {willReadFrequently:true});
          qrText = decodificarFrame(ctx.getImageData(0,0,cf.width,cf.height).data, cf.width, cf.height) || '';
        }catch(e){}
      }
      if (qrText) { try{ qrVivo(qrText); }catch(e){} }
      // 2) OCR de la foto en alta (960px) - solo en modo stock
      if (vivo.modo === 'pendientes'){
        // En pendientes solo importa el QR
        if (!qrText) estado('No vi el QR en la foto. Acercate a la base, sin brillo, y tocá 📸 de nuevo.');
        restaurarPreview();
        return;
      }
      try{
        var motor = await cargarMotorOCR();
        vivo.motor = 'listo';
        var rc2 = recorteCuadro(video, 0) || {x:0,y:Math.floor(h*0.18),w:w,h:Math.floor(h*0.64)};
        var c = document.createElement('canvas');
        var W = 960;
        var H = Math.max(40, Math.round(rc2.h * W / rc2.w));
        c.width = W; c.height = H;
        var ctxO = c.getContext('2d');
        ctxO.drawImage(foto, rc2.x, rc2.y, rc2.w, rc2.h, 0, 0, W, H);
        preprocesoOCR(ctxO, W, H);
        var best = null;
        for(var gi=0; gi<4; gi++){
          var g = [0,90,180,270][gi];
          var cv = (g===0)? c : rotarCanvas(c,g);
          try{
            var r = await motor.recognize(cv);
            var tx = (r.data.text||'').trim();
            if(!tx) continue;
            var parsed = parseQR(tx);
            var match = null;
            try{ if(catalogo.length) match = matchCatalogo(tx); }catch(e){}
            var sc = parsed && parsed.producto ?  (parsed.color?80:60) : 0;
            var cand = {text:tx, conf:r.data.confidence||0, parsed:parsed, match:match, score: sc};
            if(!best || cand.score > best.score) best = cand;
            if(parsed && parsed.producto && parsed.color) break;
          }catch(e){}
        }
        if (best && best.parsed && best.parsed.producto){
          // v774 literal: se usa el texto tal cual se ve, no el nombre del catálogo
          evaluarLectura(best.parsed, best.conf, best.text);
          if (!vivo.serieQR && !qrText && !best.parsed.serie) {
            var lbl = best.parsed.producto + (best.parsed.color?' '+best.parsed.color:'');
            estado('Leí “'+lbl+'” (literal) ✓ — buscando QR de la serie…');
          }
        } else {
          if (!qrText) estado('No pude leer la etiqueta en esta foto. Acercate, sin sombra ni brillo, y tocá 📸 otra vez.');
          else estado('QR leído ✓ — acercate un poco más a la etiqueta y tocá 📸 para el texto');
        }
      }catch(e){
        if(!qrText) estado('Error leyendo foto. Probá de nuevo con más luz.');
      } finally {
        restaurarPreview();
        vivo.ocrCarrera = false;
      }
      function restaurarPreview(){
        setTimeout(function(){
          var v2 = $('stqrVideo');
          var fc2 = $('stqrFotoCanvas');
          if(fc2) fc2.style.display='none';
          if(v2) v2.style.display='block';
          var b2 = $('stqrFotoBtn');
          if(b2){ b2.disabled=false; b2.textContent='📸 Capturar'; }
        }, 1200);
      }
    })();
  }

  // Recorta el video a la región del cuadro (donde el usuario enmarca la
  // etiqueta): menos fondo y el texto sale mucho más grande para el OCR.
  // Devuelve el rect en coordenadas del video (o null si no se puede).
  // Región visible del escáner: lo que está DENTRO del cuadro (con un
  // margen opcional, en fracción del cuadro). Todo lo que queda afuera
  // queda bloqueado: el lector solo ve lo que el usuario enmarca.
  function recorteCuadro(video, margen){
    var marco = $('stqr-marco'), cuadro = $('stqr-cuadro');
    var vw = video.videoWidth, vh = video.videoHeight;
    if (marco && cuadro && vw) {
      try {
        var mr = marco.getBoundingClientRect();
        var cr = cuadro.getBoundingClientRect();
        if (cr.width > 4 && cr.height > 4 && mr.width > 4 && mr.height > 4) {
          // El video se muestra con object-fit:cover dentro del marco.
          var escala = Math.max(mr.width / vw, mr.height / vh);
          var dw = vw * escala, dh = vh * escala;
          var ox = (mr.width - dw) / 2, oy = (mr.height - dh) / 2;
          var x = (cr.left - mr.left - ox) / escala;
          var y = (cr.top - mr.top - oy) / escala;
          var w = cr.width / escala, h = cr.height / escala;
          var m = margen || 0;
          if (m > 0) { x -= w * m; y -= h * m; w += w * m * 2; h += h * m * 2; }
          x = Math.max(0, x); y = Math.max(0, y);
          w = Math.min(vw - x, w); h = Math.min(vh - y, h);
          if (w > 8 && h > 8) return { x: x | 0, y: y | 0, w: w | 0, h: h | 0 };
        }
      } catch (e) { /* se usa la banda central */ }
    }
    return null;
  }

  // Dibuja la región en un canvas reutilizable (escalada a maxAncho) y
  // la devuelve lista para leer. Sin recorte: el frame entero.
  function recorteEnVideo(video, margen, maxAncho){
    var rc = recorteCuadro(video, margen) || { x: 0, y: 0, w: video.videoWidth, h: video.videoHeight };
    var c = canvasFrame;
    if (!c) c = canvasFrame = document.createElement('canvas');
    var w = rc.w, h = rc.h;
    if (maxAncho && w > maxAncho) { h = Math.round(h * maxAncho / w); w = maxAncho; }
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    c.getContext('2d', {willReadFrequently:true}).drawImage(video, rc.x, rc.y, rc.w, rc.h, 0, 0, w, h);
    return c;
  }

  // Una pasada de OCR: recorta la región de la etiqueta, la agranda a
  // ~1100 px y la transcribe en la orientación actual.
  function pasadaOCR(){
    (async function(){
      try {
        var motor = await cargarMotorOCR();
        vivo.motor = 'listo';
        if (!escan.abierto) return;
        var video = $('stqrVideo');
        if (!video || !video.videoWidth) return;
        var rc = recorteCuadro(video) || { x: 0, y: Math.floor(video.videoHeight * 0.18), w: video.videoWidth, h: Math.floor(video.videoHeight * 0.64) };
        var c = canvasOCR;
        if (!c) c = canvasOCR = document.createElement('canvas');
        // v774: precisión — 760px para que el texto se vea nítido y el OCR no invente. Ligeramente más lento pero mucho más fiel a lo que dice la etiqueta.
        var W = 760;
        var H = Math.max(40, Math.round(rc.h * W / rc.w));
        if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
        var ctxO = c.getContext('2d', {willReadFrequently:true});
        ctxO.drawImage(video, rc.x, rc.y, rc.w, rc.h, 0, 0, W, H);
        preprocesoOCR(ctxO, W, H);
        var g = [0, 90, 180, 270][vivo.giro % 4];
        var cv = (g === 0) ? c : rotarCanvas(c, g);
        var r = await motor.recognize(cv);
        if (!escan.abierto) return;
        evaluarLectura(parseQR(r.data.text || ''), r.data.confidence || 0, (r.data.text || '').trim());
      } catch (e) {
        vivo.motor = 'error';
        if (escan.abierto) estado('El lector de texto no cargó (la primera vez hay que tener internet). El QR sigue leyendo igual.');
      } finally {
        vivo.ocrCarrera = false;
      }
    })();
  }

  // QR leído en vivo: el de las cajas trae solo la serie (la más
  // confiable) y se guarda; si ya habíamos leído el texto (nombre +
  // color), completamos con la serie y cargamos al toque.
  function qrVivo(texto){
    if (vivo.modo === 'pendientes') { qrVivoPendiente(texto); return; }
    var p = parseQR(texto);
    if (p && p.producto) { agregarYCerrar(p); return; }
    var serie = (p && p.serie) || (serieLike(String(texto).trim()) ? String(texto).trim().toUpperCase() : '');
    if (!serie || serie === vivo.serieQR) return;
    vivo.serieQR = serie;
    if (vivo.ultimaLectura && vivo.ultimaLectura.producto) {
      agregarYCerrar({ producto: vivo.ultimaLectura.producto, color: vivo.ultimaLectura.color, serie: serie });
      return;
    }
    estado('Serie ' + serie + ' ✓ — leyendo el texto de la etiqueta…');
    // Ya sabemos dónde está: la siguiente pasada de OCR sale antes.
    vivo.ocrProxima = Math.min(vivo.ocrProxima, Date.now() + 300);
  }

  // Una pasada de OCR transcribió el texto (textoBruto = lo que dice el
  // motor, antes de interpretar). v774: PRECISIÓN LITERAL — se escribe LO QUE SE VE en la etiqueta, no lo que el catálogo sugiere.
  // Antes se forzaba el nombre del catálogo (ej. si OCR decía "SENIOR" lo cambiaba a "SENIOR 4"); ahora se respeta el texto literal leído.
  // El catálogo queda solo como referencia para el buscador, no para corregir automático. Esto evita que se cargue un producto que no está en la caja.
  function evaluarLectura(parsed, conf, textoBruto){
    // Log para depurar: qué vio realmente el OCR
    try{ if(textoBruto) console.log('[OCR literal]', JSON.stringify(textoBruto).slice(0,120), '->', parsed); }catch(e){}
    // Si el motor leyó algo pero parseQR no reconoció producto, mostrar el texto bruto para que el usuario vea qué se intentó
    if(!parsed || !parsed.producto){
      // No se pudo interpretar como producto — probar siguiente orientación, pero avisar qué se vio si hay confianza media
      if(textoBruto && textoBruto.length>3 && conf>35){
        vivo.giro = (vivo.giro + 1) % 4;
        // estado('Vi "' + textoBruto.slice(0,40) + '" — reintentando otra orientación…');
      } else {
        vivo.seguidas = 0;
        vivo.ultimoNombre = '';
        vivo.ultimaLectura = null;
        vivo.giro = (vivo.giro + 1) % 4;
      }
      return;
    }
    // Mantener compat: si hay match de catálogo solo lo usamos para validar color, no para sobreescribir el nombre
    var match = null;
    try { if (textoBruto && catalogo.length) match = matchCatalogo(textoBruto); } catch (e) { match = null; }
    // Si el OCR literal coincide con un producto del catálogo, lo dejamos igual (ya es literal). Si no coincide, IGUAL se usa el literal (no se fuerza).
    // No hacemos return temprano con match.nombre — seguimos con parsed literal.
    var sc = (parsed && parsed.producto) ? scoreEtiqueta(parsed, conf) : 0;
    var buena = !!(parsed && parsed.producto && ((parsed.color && sc >= 50) || sc >= 60));
    if (!buena) {
      vivo.seguidas = 0;
      vivo.ultimoNombre = '';
      vivo.ultimaLectura = null;
      // Esta orientación no dio nada: se prueba la siguiente.
      vivo.giro = (vivo.giro + 1) % 4;
      return;
    }
    if (parsed.serie && serieLike(parsed.serie) && !vivo.serieQR) vivo.serieQR = parsed.serie;
    var clave = norm(parsed.producto);
    if (clave === vivo.ultimoNombre) vivo.seguidas++;
    else { vivo.ultimoNombre = clave; vivo.seguidas = 1; }
    vivo.ultimaLectura = { producto: parsed.producto, color: parsed.color || '', serie: (parsed.serie && serieLike(parsed.serie)) ? parsed.serie : '' };
    // Lectura buena: se queda en esta orientación (se confirma antes).
    vivo.ocrProxima = Math.min(vivo.ocrProxima, Date.now() + 900);
    var serie = vivo.serieQR || vivo.ultimaLectura.serie || '';
    if (serie && parsed.color) {
      // Todo leído: nombre + color + serie. Carga al toque.
      agregarYCerrar({ producto: parsed.producto, color: parsed.color, serie: serie });
      return;
    }
    if (serie && !parsed.color && vivo.seguidas >= 2) {
      // Dos lecturas iguales sin color: se carga con lo que hay.
      agregarYCerrar({ producto: parsed.producto, color: '', serie: serie });
      return;
    }
    if (!serie && vivo.seguidas >= 2) {
      // Texto estable dos veces pero sin serie: se pide una vez.
      if (window.APPIDialog) {
        cerrarEscan();
        window.APPIDialog.prompt('Leí “' + parsed.producto + (parsed.color ? ' ' + parsed.color : '') + '” pero no logré leer el número de serie. ¿Cuál es el de la caja?', '', { title:'Falta la serie', icon:'📷', okText:'Agregar' }).then(function(s){
          s = String(s || '').trim().toUpperCase();
          if (!s) return;
          var d = { producto: parsed.producto, color: parsed.color || '', serie: s };
          var r2 = agregarQR(d);
          pintar();
          if (r2 === 'duplicada') {
            if (window.APPIDialog) window.APPIDialog.alert('Esa serie ya está en tu stock. No se duplica.', { title:'Serie repetida', icon:'📦' });
            return;
          }
          sonidoQR();
          toast(d.producto + ' ' + d.serie + ' agregado al stock ✓');
        });
      }
      return;
    }
    estado('Leí “' + parsed.producto + (parsed.color ? ' ' + parsed.color : '') + '” — ' + (serie ? 'listo, confirmando…' : 'buscando el QR de la serie…'));
  }

  function agregarYCerrar(datos){
    if (!datos || !datos.producto) return;
    var r = agregarQR(datos);
    pintar();
    var etiqueta = datos.producto + (datos.color ? ' ' + datos.color : '') + (datos.serie ? ' · ' + datos.serie : '');
    if (r === 'duplicada') {
      cerrarEscan();
      if (window.APPIDialog) window.APPIDialog.alert('Esa serie ya está en tu stock (' + etiqueta + '). No se duplica.', { title:'Serie repetida', icon:'📦' });
      return;
    }
    sonidoQR();
    cerrarEscan();
    toast(etiqueta + ' agregado al stock ✓');
  }

  function cerrarEscan(){
    escan.abierto = false;
    vivo.ocrCarrera = false;
    if (escan.linterna && escan.track){ try{ escan.track.applyConstraints({ advanced: [{ torch: false }] }); }catch(e){} }
    escan.linterna = false;
    if (escan.timer) { try{ clearTimeout(escan.timer); }catch(e){} try{ cancelAnimationFrame(escan.timer); }catch(e){} escan.timer = null; }
    if (escan.stream) { escan.stream.getTracks().forEach(function(t){ t.stop(); }); escan.stream = null; }
    escan.track = null;
    var video = $('stqrVideo');
    if (video) { video.style.display='block'; video.srcObject = null; }
    var fc = $('stqrFotoCanvas');
    if (fc) fc.style.display='none';
    var ov = $('stQROv');
    if (ov) ov.classList.remove('open');
    if (window.liberarScrollCuerpo) window.liberarScrollCuerpo();
  }

  function css(){
    if ($('stStyle')) return;
    var s = document.createElement('style');
    s.id = 'stStyle';
    s.textContent = '' +
      '.st-wrap{padding:4px 2px calc(env(safe-area-inset-bottom) + 180px)}' +
      '.st-scan-foot{position:fixed !important;left:50% !important;transform:translateX(-50%) !important;top:auto !important;bottom:98px !important;bottom:calc(env(safe-area-inset-bottom) + 98px) !important;z-index:80 !important;pointer-events:none !important;display:flex !important;justify-content:center !important;align-items:center !important;width:auto !important;height:68px !important;}' +
      '.st-scan-foot .st-fab-group{position:relative;width:68px;height:68px;pointer-events:auto}' +
      '@media(min-width:1024px){.st-wrap{padding:4px 8px 40px}.st-scan-foot{position:sticky;bottom:28px;left:auto;transform:none;width:100%;max-width:520px;margin:14px auto 0;pointer-events:auto}}' +
      '.st-fab-backdrop{position:fixed;inset:0;z-index:69;background:rgba(18,19,49,.22);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);opacity:0;pointer-events:none;transition:opacity .3s ease}' +
      '.st-fab-backdrop.on{opacity:1;pointer-events:auto}' +
      '.st-tabs{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin:0 0 14px;padding:5px;border-radius:16px;background:rgba(69,78,120,.07)}' +
      '.st-tab{border:0;border-radius:12px;min-height:44px;background:transparent;color:#70717e;font:inherit;font-size:12px;font-weight:900;cursor:pointer}' +
      '.st-tab.active{color:#fff;background:linear-gradient(135deg,#0b5878,#3ad0a4);box-shadow:0 5px 13px rgba(91,112,210,.22)}' +
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
      '.st-add{display:flex;flex-direction:column;gap:8px;margin-top:10px}' +
      '.st-add-row{display:flex;gap:8px}' +
      '.st-add input{flex:1;min-width:0;min-height:42px;border:1px solid rgba(80,90,130,.16);border-radius:12px;padding:8px 10px;font:inherit;font-size:13px;background:rgba(255,255,255,.88)}' +
      'body.dark .st-add input{background:#1d1f31;color:#f2f2f7;border-color:rgba(255,255,255,.1)}' +
      '.st-add .st-cant{flex:0 0 56px;text-align:center}' +
      '.st-add button{border:0;border-radius:12px;padding:0 14px;background:linear-gradient(135deg,#0b5878,#3ad0a4);color:#fff;font:inherit;font-size:18px;font-weight:900;cursor:pointer}' +
      '.st-add .st-qr-full{width:100%;min-height:46px;font-size:14px}' +
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
      '.st-save{width:100%;min-height:46px;border:0;border-radius:13px;background:linear-gradient(135deg,#0b5878,#3ad0a4);color:#fff;font:inherit;font-size:14px;font-weight:950;cursor:pointer}' +
      '.st-cancel{width:100%;margin-top:8px;border:0;background:transparent;color:#686977;font:inherit;font-size:12px;font-weight:800;cursor:pointer}' +
      '.st-qr{border:0;border-radius:12px;min-width:46px;min-height:42px;background:linear-gradient(135deg,#0b5878,#3ad0a4);color:#fff;font:inherit;font-size:18px;cursor:pointer}' +
      '.st-scan-foot{animation:stFabEnter .72s var(--ease-appi) both}' +
      '@keyframes stFabEnter{0%{transform:translateX(-50%) translateY(42px);opacity:0}100%{transform:translateX(-50%) translateY(0);opacity:1}}' +
      '@media(min-width:1024px){.st-scan-foot{animation:none}}' +
      '.st-fab{width:68px;height:68px;border-radius:50%;border:0;background:linear-gradient(135deg,#0b5878,#3ad0a4);color:#fff;display:grid;place-items:center;cursor:pointer;box-shadow:0 14px 32px rgba(91,112,210,.32),0 6px 14px rgba(0,0,0,.14);position:absolute;left:0;top:0;transition:transform .35s var(--ease-appi),box-shadow .25s ease}' +
      '.st-fab:active{transform:scale(.96);box-shadow:0 8px 18px rgba(91,112,210,.22)}' +
      '.st-fab-main{z-index:3}' +
      '.st-fab-main .st-fab-plus{position:relative;width:22px;height:22px;display:block;transition:transform .45s var(--ease-appi)}' +
      '.st-fab-main .st-fab-plus:before,.st-fab-main .st-fab-plus:after{content:"";position:absolute;background:#fff;border-radius:2px;left:50%;top:50%;transform:translate(-50%,-50%)}' +
      '.st-fab-main .st-fab-plus:before{width:22px;height:2.5px}' +
      '.st-fab-main .st-fab-plus:after{width:2.5px;height:22px}' +
      '.st-fab-child{width:56px;height:56px;left:6px;top:6px;z-index:1;opacity:0;transform:translateX(0) scale(.72);pointer-events:none;transition:transform .55s var(--ease-appi),opacity .30s ease,box-shadow .25s;background:linear-gradient(135deg,#0b5878,#3ad0a4);box-shadow:0 10px 24px rgba(91,112,210,.28)}' +
      '.st-fab-child svg{width:26px;height:26px;display:block}' +
      '.st-fab-child .st-fab-lbl{position:absolute;left:50%;transform:translateX(-50%) translateY(6px);top:-36px;bottom:auto;background:#121331;color:#fff;font-size:11px;font-weight:700;padding:6px 10px;border-radius:99px;white-space:nowrap;opacity:0;transition:all .38s var(--ease-appi);pointer-events:none;box-shadow:0 8px 20px rgba(0,0,0,.18)}' +
      '.st-fab-child .st-fab-lbl:after{content:"";position:absolute;left:50%;bottom:-3px;top:auto;transform:translateX(-50%) rotate(45deg);width:7px;height:7px;background:#121331}' +
      '.st-fab-group.expanded .st-fab-child{opacity:1;pointer-events:auto}' +
      '.st-fab-group.expanded .st-fab-child .st-fab-lbl{opacity:1;transform:translateX(-50%) translateY(0)}' +
      '.st-fab-group.expanded .fab-scan{transform:translateX(-84px) translateY(-6px) scale(1);transition-delay:.06s}' +
      '.st-fab-group.expanded .fab-scan .st-fab-lbl{transition-delay:.14s}' +
      '.st-fab-group.expanded .fab-manual{transform:translateX(84px) translateY(-6px) scale(1);transition-delay:.11s}' +
      '.st-fab-group.expanded .fab-manual .st-fab-lbl{transition-delay:.19s}' +
      '.st-fab-group.expanded .st-fab-main{box-shadow:0 16px 36px rgba(80,90,130,.22)}' +
      '.st-fab-group.expanded .st-fab-main .st-fab-plus{transform:rotate(135deg)}' +
      '.st-fab svg{display:block;width:44px;height:44px;animation:stLordIn .65s cubic-bezier(.22,.9,.28,1),stLordFloat 3.2s ease-in-out infinite .65s}' +
      '.st-fab-child svg{animation:none}' +
      '@keyframes stLordIn{0%{transform:scale(.82) translateY(4px);opacity:0}100%{transform:scale(1) translateY(0);opacity:1}}' +
      '@keyframes stLordFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.5px)}}' +
      '.st-fab.pendientes{background:#fff;box-shadow:0 12px 28px rgba(80,90,130,.18),0 4px 12px rgba(0,0,0,.14),0 0 0 1px rgba(0,0,0,.04)}' +
      '@media(prefers-reduced-motion:reduce){.st-fab svg{animation:none}.st-fab-child{transition:none}}' +
      '.stqrov{position:fixed;inset:0;z-index:26500;background:#0b0d18;display:none;flex-direction:column;color:#fff}' +
      '.stqrov.open{display:flex}' +
      '.stqr-top{display:flex;align-items:center;justify-content:space-between;padding:14px 16px}' +
      '.stqr-top .stqr-titulo{font-size:14px;font-weight:900}' +
      '.stqr-top button{border:0;background:rgba(255,255,255,.14);color:#fff;border-radius:50%;width:40px;height:40px;font:inherit;font-size:16px;font-weight:900;cursor:pointer}' +
      '.stqr-marco{flex:1;position:relative;display:flex;align-items:center;justify-content:center;min-height:0}' +
      '.stqr-marco video{width:100%;height:100%;object-fit:cover;background:#000}' +
      '.stqr-cuadro{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:min(88vw,560px);height:min(40vw,235px);border:2.5px solid rgba(255,255,255,.9);border-radius:14px;box-shadow:0 0 0 9999px rgba(11,13,24,.58)}' +
      '.stqrov.stqr-square .stqr-cuadro{width:min(64vw,300px);height:min(64vw,300px);border-radius:18px}' +
      '.stqrov.stqr-square .stqr-linea{width:min(64vw,300px);height:min(64vw,300px)}' +
      '.stqr-linea{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:min(84vw,545px);height:min(38vw,225px);background-color:transparent;background-image:linear-gradient(180deg,transparent,#5b8def,transparent);background-repeat:no-repeat;background-size:3px 100%;background-position:100% 0;animation:stqrlinea 1.8s linear infinite}' +
      '@keyframes stqrlinea{0%{background-position:100% 0}100%{background-position:0 0}}' +
      '.stqr-ayuda{margin:10px 16px 6px;text-align:center;font-size:13px;font-weight:700;color:rgba(255,255,255,.85);min-height:20px}' +
      '.st-undo{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);z-index:27000;background:#1c1c1e;color:#fff;border-radius:14px;padding:12px 14px;display:none;align-items:center;gap:12px;box-shadow:0 10px 30px rgba(0,0,0,.25);font-size:13px;font-weight:700;min-width:280px;max-width:92vw}' +
      '.st-undo.show{display:flex}' +
      '.st-undo button{border:0;border-radius:10px;padding:8px 12px;background:#5b8def;color:#fff;font-weight:900;cursor:pointer;white-space:nowrap}' +
      '.st-undo .st-undo-close{background:rgba(255,255,255,.14);color:#fff;padding:6px 10px}' +
      '.st-undo span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}';
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
      if (window.APPIDialog) window.APPIDialog.alert('En Stock personal cargás lo que tenés en casa. Con 📄 fotografiás la ETIQUETA COMPLETA de la caja (la que trae el QR) y el equipo se carga solo: nombre, color y número de serie, de una vez. Con 📷 escaneás solo el QR (la serie) y después completás con la foto de la etiqueta. Si no andan la cámara ni la luz, podés subir una foto con 📁. PRESTAR saca 1 unidad, te pregunta a quién y pone la fecha de hoy. En Prestados: YA ME LO DEVOLVIÓ vuelve esa unidad al stock. ELIMINAR borra el préstamo y no toca el stock (por si se perdió o se lo regalaste).', { title:'Cómo usar Mi stock', icon:'📦' });
    };
  }

  // ------------------------------------------------------------------
  // Agrupado por producto (v746): en Stock personal, Prestados y
  // Pendientes las filas van ordenadas por PRODUCTO (todos los Senior
  // juntos, los Senior 4 por otro lado, los Quantum por otro…), y dentro
  // de cada producto por color y luego por serie.
  // ------------------------------------------------------------------
  var COLORES_ORDEN = { '': 0, 'bianco': 1, 'blanco': 1, 'nero': 2, 'negro': 2, 'grigio': 3, 'gris': 3 };
  function claveGrupo(nombre){
    var t = String(nombre || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ').split(/\s+/).filter(Boolean);
    t = t.filter(function(w){
      return w !== 'bianco' && w !== 'blanco' && w !== 'nero' && w !== 'negro' && w !== 'grigio' && w !== 'gris' &&
             w !== 'kit' && w !== 'posv' && w !== 'k' && w !== 'plan' && w !== 'canje' && w !== 'psa';
    });
    if (!t.length) t = String(nombre || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean);
    return t.join(' ');
  }
  function colorRango(it){
    var c = norm(it.color || '');
    return COLORES_ORDEN[c] != null ? COLORES_ORDEN[c] : (c ? 4 : 0);
  }
  function cmpProducto(a, b){
    var ga = claveGrupo(a.nombre || a.producto || ''), gb = claveGrupo(b.nombre || b.producto || '');
    if (ga !== gb) return ga < gb ? -1 : 1;
    var ca = colorRango(a), cb = colorRango(b);
    if (ca !== cb) return ca - cb;
    var sa = String(a.serie || ''), sb = String(b.serie || '');
    if (sa !== sb) return sa < sb ? -1 : 1;
    var fa = String(a.fecha || ''), fb = String(b.fecha || '');
    return fa < fb ? -1 : (fa > fb ? 1 : 0);
  }

  function htmlStock(){
    var items = leerStock().slice().sort(cmpProducto);
    var total = items.reduce(function(s, it){ return s + (Number(it.cant) || 0); }, 0);
    var filas = items.map(function(it){
      var meta = [];
      if (it.color) meta.push(it.color);
      if (it.serie) meta.push('Serie ' + it.serie);
      meta.push(it.cant + ' unidad' + (it.cant === 1 ? '' : 'es'));
      var sid = esc(it.id);
      return '<div class="st-row" data-st-edit="' + sid + '" title="Tocá para corregir">' +
        '<div><span class="st-name">' + esc(it.nombre) + '</span><span class="st-meta">' + esc(meta.join(' · ')) + '</span></div>' +
        '<div class="st-qty">' +
          (it.serie ? '<span class="st-unico" title="Equipo único con serie" style="font-size:11px;color:#8e8e93;font-weight:700;margin-right:6px">ÚNICO</span>' : '<button type="button" class="st-mini" data-st-menos="' + sid + '">−</button>') +
          '<b>' + it.cant + '</b>' +
          (it.serie ? '' : '<button type="button" class="st-mini" data-st-mas="' + sid + '">+</button>') +
          '<button type="button" class="st-mini" data-st-del="' + sid + '" aria-label="Quitar">✕</button>' +
          '<button type="button" class="st-prestar" data-st-prestar="' + sid + '">PRESTAR</button>' +
        '</div></div>';
    }).join('');
    return '<div class="st-card"><div class="st-name">📦 En casa</div><div class="st-meta" style="margin:4px 0 8px">' + total + ' unidad' + (total === 1 ? '' : 'es') + ' disponibles</div>' +
      (filas || '<div class="st-empty">Todavía no cargaste productos.</div>') +
      '</div><div class="st-scan-foot"><div class="st-fab-group" id="stFabGroup"><button type="button" id="stQr" class="st-fab st-fab-child fab-scan" aria-label="Escanear" title="Apuntá a la etiqueta: lee QR"><span class="st-fab-lbl">Escanear</span><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:26px;height:26px;display:block"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="4" height="4" rx="1"/><rect x="18" y="14" width="3" height="3" rx="1"/><rect x="15.5" y="18.5" width="2.5" height="2.5" rx="0.7"/><path d="M7 7h1v1H7zM17 7h1v1h-1zM7 17h1v1H7z"/><path d="M14 8.5h2M8.5 14v2M14 16.2h.8M18 18.5h-2"/></svg></button><button type="button" id="stFabManual" class="st-fab st-fab-child fab-manual" aria-label="Carga manual" title="Cargar manual"><span class="st-fab-lbl">Manual</span><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="width:26px;height:26px;display:block"><path d="M12 20H21"/><path d="M16.5 3.5a2.22 2.22 0 0 1 3.14 3.14L7 19.3 3.5 20.5 4.7 17 16.5 3.5z"/><path d="M13.5 6.5L17.5 10.5"/></svg></button><button type="button" id="stFabMain" class="st-fab st-fab-main" aria-label="Acciones" title="Agregar producto"><span class="st-fab-plus"></span></button></div></div><div class="st-fab-backdrop" id="stFabBackdrop"></div>' +
      '';
  }

  function htmlPrestamos(){
    var rows = leerPrestamos().slice().sort(cmpProducto);
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
    var pendientes = leerPendientes().length;
    if (esEscritorio()) {
      host.innerHTML = '<div class="st-desk"><div>' + htmlStock() + '</div><div>' + htmlPrestamos() + '</div><div>' + htmlPendientes() + '</div></div>';
    } else {
      host.innerHTML =
        '<div class="st-tabs">' +
          '<button type="button" class="st-tab' + (tab === 'stock' ? ' active' : '') + '" data-st-tab="stock">Stock personal</button>' +
          '<button type="button" class="st-tab' + (tab === 'prestados' ? ' active' : '') + '" data-st-tab="prestados">Prestados' + (prestados ? ' · ' + prestados : '') + '</button>' +
          '<button type="button" class="st-tab' + (tab === 'pendientes' ? ' active' : '') + '" data-st-tab="pendientes">Pendientes' + (pendientes ? ' · ' + pendientes : '') + '</button>' +
        '</div>' +
        (tab === 'pendientes' ? htmlPendientes() : (tab === 'prestados' ? htmlPrestamos() : htmlStock()));
    }
    bind();
  }

  function bind(){
    document.querySelectorAll('[data-st-tab]').forEach(function(b){
      b.onclick = function(){ tab = b.getAttribute('data-st-tab'); pintar(); };
    });
    // FAB expandable horizontal — Stock
    (function(){
      var grp=$('stFabGroup'), main=$('stFabMain'), qr=$('stQr'), man=$('stFabManual'), back=$('stFabBackdrop');
      function setFab(open){
        if(grp) grp.classList.toggle('expanded', !!open);
        if(back) back.classList.toggle('on', !!open);
        if(main) main.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
      function toggleFab(){ if(!grp) return; var isOpen=grp.classList.contains('expanded'); setFab(!isOpen); if(navigator.vibrate) try{navigator.vibrate(isOpen?10:18);}catch(e){} }
      function closeFab(){ setFab(false); }
      if(main) main.onclick=function(e){ e.stopPropagation(); toggleFab(); };
      if(qr) qr.onclick=function(e){ e.stopPropagation(); closeFab(); abrirEscan(); };
      if(man) man.onclick=function(e){
        e.stopPropagation(); closeFab();
        abrirManualStock();
      };
      if(back) back.onclick=closeFab;
      document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeFab(); });
      // cerrar al cambiar tab
      var _pintarOrig = window._stFabClose || null;
      window._stFabCloseStock = closeFab;
    })();
    var add = $('stAdd');
    if (add) add.onclick = function(){
      var nombre = nombreLimpio($('stNombre').value || '');
      var color = colorLimpio($('stColor').value || '');
      var serie = String($('stSerie').value || '').trim().toUpperCase();
      var cant = Math.max(1, Number($('stCant').value) || 1);
      if (!nombre){ if (window.APPIDialog) window.APPIDialog.alert('Escribí el nombre del producto.', { title:'Falta el producto', icon:'📦' }); return; }
      var r = agregarManual({ nombre: nombre, color: color, serie: serie, cant: cant });
      if (r === 'duplicada') {
        if (window.APPIDialog) window.APPIDialog.alert('Esa serie ya está en tu stock (' + nombre + (color ? ' ' + color : '') + ' · ' + serie + '). No se duplica.', { title:'Serie repetida', icon:'📦' });
        return;
      }
      $('stNombre').value = ''; $('stColor').value = ''; $('stSerie').value = ''; $('stCant').value = '1';
      pintar();
      toast('Producto cargado 📦');
    };
    document.querySelectorAll('[data-st-mas]').forEach(function(b){
      b.onclick = function(){ var it = leerStock(); var id=b.getAttribute('data-st-mas'); var idx=it.findIndex(function(o){return String(o.id)===String(id);}); if(idx>=0){ it[idx].cant++; guardarStock(it); pintar(); } };
    });
    document.querySelectorAll('[data-st-menos]').forEach(function(b){
      b.onclick = function(){
        var it = leerStock(); var id=b.getAttribute('data-st-menos'); var idx=it.findIndex(function(o){return String(o.id)===String(id);}); if(idx>=0){ it[idx].cant = Math.max(0, (Number(it[idx].cant) || 0) - 1); guardarStock(it); pintar(); }
      };
    });
    document.querySelectorAll('[data-st-del]').forEach(function(b){
      b.onclick = function(){
        var it = leerStock(); var id=b.getAttribute('data-st-del'); var idx=it.findIndex(function(o){return String(o.id)===String(id);}); if(idx<0) return;
        var prod=it[idx]; var label=prod.nombre + (prod.color?' '+prod.color:'') + (prod.serie?' · '+prod.serie:'');
        function doBorrar(){ var borrado=it.splice(idx,1)[0]; guardarStock(it); pintar(); mostrarUndo('stock', {item:borrado, idx:idx}, '"'+label+'" borrado'); }
        if(window.APPIDialog && window.APPIDialog.confirm){
          window.APPIDialog.confirm('¿Borrar "'+label+'" de tu stock? Podés deshacer después.', {title:'Borrar producto', icon:'🗑️', okText:'Borrar', danger:true}).then(function(ok){ if(ok) doBorrar(); });
        } else { if(confirm('¿Borrar "'+label+'"?')) doBorrar(); }
      };
    });
    document.querySelectorAll('[data-st-prestar]').forEach(function(b){
      b.onclick = function(){ abrirPrestar(b.getAttribute('data-st-prestar')); };
    });
    // Tocar una fila del stock abre el editor (para corregir cualquier campo).
    // Los botones de la fila (−, +, ✕, PRESTAR) mantienen su acción propia.
    document.querySelectorAll('[data-st-edit]').forEach(function(r){
      r.style.cursor = 'pointer';
      r.onclick = function(e){
        if (e.target.closest('button')) return;
        abrirEditar(r.getAttribute('data-st-edit'));
      };
    });
    // Pendientes de canje: cámara, búsqueda por serie, edición y entrega.
    // FAB expandable horizontal — Pendientes
    (function(){
      var grpP=$('stFabGroupP'), mainP=$('stFabMainP'), qrP=$('stQrP'), manP=$('stFabManualP'), backP=$('stFabBackdropP');
      function setFabP(open){
        if(grpP) grpP.classList.toggle('expanded', !!open);
        if(backP) backP.classList.toggle('on', !!open);
        if(mainP) mainP.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
      function toggleFabP(){ if(!grpP) return; var isOpen=grpP.classList.contains('expanded'); setFabP(!isOpen); if(navigator.vibrate) try{navigator.vibrate(isOpen?10:18);}catch(e){} }
      function closeFabP(){ setFabP(false); }
      if(mainP) mainP.onclick=function(e){ e.stopPropagation(); toggleFabP(); };
      if(qrP) qrP.onclick=function(e){ e.stopPropagation(); closeFabP(); abrirEscan('pendientes'); };
      if(manP) manP.onclick=function(e){
        e.stopPropagation();
        closeFabP();
        iniciarCargaManualPendiente();
      };
      if(backP) backP.onclick=closeFabP;
      document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeFabP(); });
      window._stFabClosePend = closeFabP;
    })();
    // cerrar ambos FAB al cambiar de tab / pintar
    try{ if(window._stFabCloseStock) window._stFabCloseStock(); if(window._stFabClosePend) window._stFabClosePend(); }catch(e){}
    document.querySelectorAll('[data-st-pedit]').forEach(function(r){
      r.style.cursor = 'pointer';
      r.onclick = function(e){
        if (e.target.closest('button')) return;
        var serie=r.getAttribute('data-st-pedit'); var items=leerPendientes(); var idx=items.findIndex(function(o){return norm(o.serie)===norm(serie);}); abrirFichaPendiente(idx);
      };
    });
    document.querySelectorAll('[data-st-entregado]').forEach(function(b){
      b.onclick = function(){ var serie=b.getAttribute('data-st-entregado'); var items=leerPendientes(); var idx=items.findIndex(function(o){return norm(o.serie)===norm(serie);}); if(idx>=0) marcarEntregado(idx); };
    });
    document.querySelectorAll('[data-st-pdel]').forEach(function(b){
      b.onclick = function(){ var serie=b.getAttribute('data-st-pdel'); var items=leerPendientes(); var idx=items.findIndex(function(o){return norm(o.serie)===norm(serie);}); if(idx>=0) eliminarPendiente(idx); };
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
  function obtenerEquipoDistribuidores(){
    try{
      var data = null;
      if(window.equipoData && Array.isArray(window.equipoData.personas)) data = window.equipoData;
      else data = JSON.parse(localStorage.getItem('equipoData')||'null');
      if(!data || !Array.isArray(data.personas)) return [];
      return data.personas.filter(function(p){ return p && (p.nombre || p.dip); }).map(function(p){
        return { nombre: String(p.nombre||p.dip||'').trim(), dip: String(p.dip||''), telefono: String(p.telefono||p.tel||'') };
      }).filter(function(p){ return p.nombre; });
    }catch(e){ return []; }
  }
  function buscarDistribuidorEquipo(){ var it=leerStock()[prestarIdx]; if(!it) return; return buscarDistribuidorEquipoConProducto(it); }
  function buscarDistribuidorEquipoConProducto(it){
    var lista = obtenerEquipoDistribuidores();
    var producto = it;
    var doManual = function(){ abrirPrestarManualConProducto(producto); };
    if(!lista.length){
      doManual();
      return;
    }
    // Selector igual al del organigrama: modal con buscador y lista de person-picker-item
    var modal = window.modal;
    if(!modal || typeof modal.open!=='function'){
      // Fallback al choose simple
      var opciones = lista.slice(0,40).map(function(d){ return { label: d.nombre + (d.dip ? ' · ' + d.dip : '') + (d.telefono ? ' · ' + d.telefono : ''), value: d }; });
      opciones.push({ label: '✏️ Carga manual (otro equipo)', value: null });
      if(window.APPIDialog && window.APPIDialog.choose){
        window.APPIDialog.choose('Elegí a quién se lo prestás:', opciones, {title:'Mi equipo',icon:'👥'}).then(function(sel){
          if(sel===undefined) return;
          if(sel===null || !sel){ return; }
          var quien=document.getElementById('stQuien'), tel=document.getElementById('stTel');
          if(quien) quien.value = sel.nombre;
          if(tel && sel.telefono) tel.value = sel.telefono;
        });
      }
      return;
    }
    var normalizar = function(v){ return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim(); };
    var renderLista = function(filtro){
      var term = normalizar(filtro);
      var filtrada = lista.filter(function(d){ return !term || normalizar(d.nombre).includes(term) || normalizar(d.dip).includes(term); }).slice(0,120);
      if(!filtrada.length) return '<div class="empty" style="padding:20px">🔍 Sin coincidencias</div>';
      var htmlManual = '<div class="person-picker-item" data-prestamo-manual="1" style="border:1.5px dashed rgba(91,141,239,.35);background:rgba(91,141,239,.06)"><span class="pp-cat" style="background:#fff;border:1px solid rgba(91,141,239,.25);color:#5b8def">✏️</span><div class="pp-info"><div class="pp-name">Carga manual (otro equipo)</div><div class="pp-meta">Escribí el nombre a mano</div></div><span class="pp-count">MANUAL</span></div>';
      return htmlManual + filtrada.map(function(d){
        var dipTxt = d.dip || 'Sin N°';
        return '<div class="person-picker-item" data-prestamo-dip="' + esc(d.dip||'') + '" data-prestamo-nombre="' + esc(d.nombre) + '" data-prestamo-tel="' + esc(d.telefono||'') + '">'
          + '<span class="pp-cat" style="background:linear-gradient(135deg,#0b5878,#3ad0a4);color:#fff">' + esc(dipTxt) + '</span>'
          + '<div class="pp-info"><div class="pp-name">' + esc(d.nombre) + '</div><div class="pp-meta">' + esc(d.telefono||'Sin teléfono') + '</div></div>'
          + '<span class="pp-count">ELEGIR</span></div>';
      }).join('');
    };
    modal.open({
      icon:'👥', iconBg:'linear-gradient(135deg,#0b5878,#3ad0a4)',
      title:'Elegí a quién se lo prestás', sub:'De tu equipo (buscá por nombre o N°)',
      html:'<p style="margin:0 0 12px;font-size:13px;color:#5c5c66">Tocá un distribuidor y se autocompleta. Si es de otro equipo, usá carga manual.</p>'
        + '<div class="person-picker-search"><span style="color:#8a8a94">🔍</span><input type="text" id="prestamoPickerSearch" placeholder="Buscar por nombre o N° de Distribuidor…" autocomplete="off" /></div>'
        + '<div class="person-picker-list" id="prestamoPickerList">' + renderLista('') + '</div>'
    });
    setTimeout(function(){
      var inp=document.getElementById('prestamoPickerSearch'), cont=document.getElementById('prestamoPickerList');
      if(!inp||!cont) return;
      inp.oninput=function(){ cont.innerHTML=renderLista(inp.value); };
      cont.onclick=function(e){
        var manual=e.target.closest('[data-prestamo-manual]');
        if(manual){ modal.close(); doManual(); return; }
        var item=e.target.closest('[data-prestamo-dip]');
        if(!item) return;
        var nombre=item.getAttribute('data-prestamo-nombre')||'', tel=item.getAttribute('data-prestamo-tel')||'';
        modal.close();
        try{ if(window.haptic) window.haptic(12); }catch(e){}
        // Crear préstamo directo sin pasar por el form intermedio
        var items=leerStock();
        var idx=prestarIdx;
        var it2=items[idx];
        if(!it2 || Number(it2.cant)<1){ if(window.APPIDialog) window.APPIDialog.alert('No hay unidades para prestar',{title:'Sin stock',icon:'📦'}); return; }
        it2.cant=Number(it2.cant)-1;
        guardarStock(items);
        var rows=leerPrestamos();
        rows.unshift({ id: Date.now()+'-'+Math.random().toString(36).slice(2,7), producto: it2.nombre, quien: nombre, telefono: tel, fecha: hoyISO(), serie: it2.serie||'' });
        guardarPrestamos(rows);
        pintar();
        toast('Prestado a ' + nombre + ' ✓');
      };
      // sin autofocus: el teclado abre solo si toca el buscador
    },60);
  }
  function abrirPrestar(id){
    var items = leerStock();
    var idx = items.findIndex(function(o){ return String(o.id)===String(id); });
    if (idx < 0) return;
    var it = items[idx];
    if (!it || Number(it.cant) < 1){ toast('No hay unidades para prestar'); return; }
    prestarIdx = idx;
    // Abrir directo el selector estilo organigrama (sin sheet detrás para no solapar)
    buscarDistribuidorEquipoConProducto(it);
  }
  function abrirPrestarManualConProducto(it){
    // Fallback manual directo (cuando elige Carga manual)
    prestarIdx = leerStock().findIndex(function(o){ return o===it; });
    // Si no lo encuentra por referencia, buscar por serie+nombre
    if(prestarIdx<0) prestarIdx = leerStock().findIndex(function(o){ return o.serie===it.serie && o.nombre===it.nombre; });
    css(); ensureOverlay();
    $('stSheet').innerHTML =
      '<h3>¿A quién se lo prestás?</h3>' +
      '<p>Se presta 1 ' + esc(it.nombre) + '. La fecha queda en hoy, ' + esc(fechaTxt(hoyISO())) + '.</p>' +
      '<label class="st-field"><span>Nombre</span><input id="stQuien" autocomplete="name" placeholder="Ej: Laura Gómez"></label>' +
      '<label class="st-field"><span>Teléfono</span><input id="stTel" type="tel" inputmode="tel" autocomplete="tel" placeholder="351 555 1234"></label>' +
      '<button type="button" class="st-save" id="stSavePrestamo">Prestar</button>' +
      '<button type="button" class="st-cancel" id="stCancelPrestamo">Cancelar</button>';
    $('stOverlay').classList.add('open');
    if(window.bloquearScrollCuerpo) window.bloquearScrollCuerpo();
    $('stCancelPrestamo').onclick = cerrarPrestar;
    $('stSavePrestamo').onclick = confirmarPrestar;
    // teclado solo si el usuario toca el campo (sin autofocus automático)
  }
  function cerrarPrestar(){
    var ov = $('stOverlay');
    if (ov) ov.classList.remove('open');
    if (window.liberarScrollCuerpo) window.liberarScrollCuerpo();
    prestarIdx = -1;
  }

  // ------------------------------------------------------------------
  // Editor de fila: tocar un producto cargado abre estos campos para
  // corregir cualquier dato (nombre, color, serie o cantidad).
  // ------------------------------------------------------------------
  var editIdx = -1;
  function abrirEditar(id){
    var items = leerStock();
    var idx = items.findIndex(function(o){ return String(o.id)===String(id); });
    if (idx < 0) return;
    var it = items[idx];
    if (!it) return;
    editIdx = idx;
    css();
    ensureOverlay();
    $('stSheet').innerHTML =
      '<h3>Corregir producto</h3>' +
      '<p>Modificá lo que haya que corregir y guardá. Si no cambiás nada, dejalo como está.</p>' +
      '<label class="st-field"><span>Producto</span><input id="stEdNombre" list="stCatDl" autocomplete="off" value="' + esc(it.nombre) + '"></label>' +
      '<label class="st-field"><span>Color</span><input id="stEdColor" autocomplete="off" placeholder="Ej: Bianco" value="' + esc(it.color || '') + '"></label>' +
      '<label class="st-field"><span>N° de serie</span><input id="stEdSerie" autocomplete="off" placeholder="Ej: JZA31021" value="' + esc(it.serie || '') + '"></label>' +
      (it.serie ? '<div class="st-meta" style="margin:8px 0;color:#8e8e93;font-size:12px">Equipo con serie única — cantidad siempre 1</div>' : '<label class="st-field"><span>Cantidad</span><input id="stEdCant" type="number" min="1" value="' + (Number(it.cant) || 1) + '"></label>') +
      '<button type="button" class="st-save" id="stSaveEdit">Guardar cambios</button>' +
      '<button type="button" class="st-cancel" id="stCancelEdit">Cancelar</button>';
    $('stOverlay').classList.add('open');
    if (window.bloquearScrollCuerpo) window.bloquearScrollCuerpo();
    $('stCancelEdit').onclick = cerrarEditar;
    $('stSaveEdit').onclick = guardarEditar;
    setTimeout(function(){ var el = $('stEdNombre'); if (el) el.focus(); }, 40);
  }
  function cerrarEditar(){
    var ov = $('stOverlay');
    if (ov) ov.classList.remove('open');
    if (window.liberarScrollCuerpo) window.liberarScrollCuerpo();
    editIdx = -1;
  }
  function guardarEditar(){
    var items = leerStock();
    var it = items[editIdx];
    if (!it){ cerrarEditar(); pintar(); return; }
    var nombre = nombreLimpio(($('stEdNombre') && $('stEdNombre').value) || '');
    var color = colorLimpio(($('stEdColor') && $('stEdColor').value) || '');
    var serie = String(($('stEdSerie') && $('stEdSerie').value) || '').trim().toUpperCase();
    var cant = serie ? 1 : Math.max(1, Math.round(Number(($('stEdCant') && $('stEdCant').value) || 1)));
    if (!nombre){
      if (window.APPIDialog) window.APPIDialog.alert('Escribí el nombre del producto.', { title:'Falta el producto', icon:'📦' });
      return;
    }
    if (serie && items.some(function(o, j){ return j !== editIdx && o.serie && norm(o.serie) === norm(serie); })){
      if (window.APPIDialog) window.APPIDialog.alert('Esa serie ya está en tu stock: cada serie es un equipo distinto.', { title:'Serie repetida', icon:'📦' });
      return;
    }
    it.nombre = nombre; it.color = color; it.serie = serie; it.cant = cant;
    guardarStock(items);
    cerrarEditar();
    pintar();
    toast('Producto corregido ✓');
  }

  // Manual stock via popup (pantalla limpia: sin formulario inline)
  function abrirManualStock(){
    css(); ensureOverlay();
    var ov=$('stOverlay'), sh=$('stSheet');
    if(!ov||!sh) return;
    sh.innerHTML = '<h3>➕ Carga manual</h3><p>Ingresá los datos del equipo tal como figura en la caja.</p>' +
      '<label class="st-field"><span>Producto</span><input id="stManNombre" list="stCatDl" autocomplete="off" placeholder="Ej: PSA Senior 4"></label>' +
      '<label class="st-field"><span>Color</span><input id="stManColor" autocomplete="off" placeholder="Ej: Bianco"></label>' +
      '<label class="st-field"><span>N° de serie</span><input id="stManSerie" autocomplete="off" placeholder="Ej: JZA31021"></label>' +
      '<label class="st-field"><span>Cantidad</span><input id="stManCant" type="number" min="1" value="1"></label>' +
      '<button type="button" class="st-save" id="stManSave">Guardar en stock</button>' +
      '<button type="button" class="st-cancel" id="stManCancel">Cancelar</button>';
    ov.classList.add('open');
    if(window.bloquearScrollCuerpo) window.bloquearScrollCuerpo();
    var cancel=$('stManCancel'); if(cancel) cancel.onclick=function(){ ov.classList.remove('open'); if(window.liberarScrollCuerpo) window.liberarScrollCuerpo(); };
    var save=$('stManSave'); if(save) save.onclick=function(){
      var nombre=nombreLimpio(($('stManNombre')&&$('stManNombre').value)||'');
      var color=colorLimpio(($('stManColor')&&$('stManColor').value)||'');
      var serie=String(($('stManSerie')&&$('stManSerie').value)||'').trim().toUpperCase();
      var cant=Math.max(1, Math.round(Number(($('stManCant')&&$('stManCant').value)||1)));
      if(!nombre){ if(window.APPIDialog) window.APPIDialog.alert('Escribí el nombre del producto.',{title:'Falta el producto',icon:'📦'}); return; }
      var r=agregarManual({nombre:nombre,color:color,serie:serie,cant:serie?1:cant});
      if(r==='duplicada'){ if(window.APPIDialog) window.APPIDialog.alert('Esa serie ya está en tu stock.',{title:'Serie repetida',icon:'📦'}); return; }
      ov.classList.remove('open'); if(window.liberarScrollCuerpo) window.liberarScrollCuerpo();
      pintar(); toast('Producto cargado 📦');
    };
    setTimeout(function(){ var el=$('stManNombre'); if(el) el.focus(); }, 80);
  }

  // ------------------------------------------------------------------
  // PENDIENTES DE CANJE: equipos viejos que nos quedamos al hacer un
  // plan canje y que todavía no entregamos a la empresa. Al escanear la
  // BASE (QR con el N° de serie) se consulta la base de PSA (reporte de
  // Garantías) y se carga solo a quién pertenecía (nombre, teléfono y
  // producto). El botón ENTREGADO lo baja de la lista al entregarlo.
  // ------------------------------------------------------------------
  function pendientesKey(){ return 'appi_pendientes_v1_' + uid(); }
  function leerPendientes(){
    try{
      var raw = JSON.parse(localStorage.getItem(pendientesKey()) || '[]');
      return Array.isArray(raw) ? raw.filter(function(p){ return p && p.serie; }) : [];
    }catch(e){ return []; }
  }
  function guardarPendientes(rows){
    try{ localStorage.setItem(pendientesKey(), JSON.stringify(rows || [])); }catch(e){}
  }
  function supabaseCfg(){ try{ return (window.APPI_AUTH && window.APPI_AUTH.url && window.APPI_AUTH.anonKey) ? window.APPI_AUTH : null; }catch(e){ return null; } }
  function tokenActual(){ try{ var v=JSON.parse(localStorage.getItem('appi_auth_session_v1')||'null'); return v&&v.session&&v.session.access_token||''; }catch(e){ return ''; } }

  // Consulta la base de PSA por serie (función Supabase consulta-serial).
  // Devuelve { encontrado, usuario, telefono, domicilio, cp, localidad, producto }
  // o null si no hay appi/credenciales o falla la red.
  /* ── Lupa: "el teléfono está pensando". Lente recorriendo ficheros
     hasta dar con la serie en la base de PSA; check verde si la
     encuentra, marca ámbar si no figura. ── */
  var lupaEl = null;
  function cssLupa(){
    if ($('lupaCss')) return;
    var s = document.createElement('style');
    s.id = 'lupaCss';
    s.textContent =
      '.lupa-ov{position:fixed;inset:0;z-index:27000;background:rgba(9,11,20,.94);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-align:center;padding:24px}' +
      '.lupa-escena{position:relative;width:min(82vw,330px);height:170px;margin-bottom:18px}' +
      '.lupa-doc{position:absolute;top:38px;width:74px;height:104px;border-radius:10px;background:linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,.07));border:1px solid rgba(255,255,255,.22);overflow:hidden}' +
      '.lupa-doc::after{content:"";position:absolute;left:10px;right:10px;top:14px;bottom:14px;background:repeating-linear-gradient(180deg,rgba(255,255,255,.35) 0 3px,transparent 3px 13px);border-radius:3px}' +
      '.lupa-d1{left:0}.lupa-d2{left:78px}.lupa-d3{left:156px}' +
      '.lupa-icon{position:absolute;top:4px;left:0;width:88px;height:88px;filter:drop-shadow(0 4px 14px rgba(91,141,239,.55));animation:lupaMove 1.5s ease-in-out infinite alternate}' +
      '@keyframes lupaMove{0%{left:0;transform:rotate(-8deg)}50%{transform:rotate(0deg)}100%{left:calc(100% - 88px);transform:rotate(8deg)}}' +
      '.lupa-tit{font-size:15px;font-weight:800;max-width:86vw}' +
      '.lupa-serie{margin-top:6px;font-size:22px;font-weight:900;letter-spacing:1px;color:#9ec1ff}' +
      '.lupa-sub{margin-top:8px;font-size:12.5px;color:rgba(255,255,255,.65);max-width:86vw}' +
      '.lupa-res{display:none;flex-direction:column;align-items:center}' +
      '.lupa-ov.ok .lupa-escena,.lupa-ov.ok .lupa-tit,.lupa-ov.ok .lupa-serie,.lupa-ov.ok .lupa-sub{display:none}' +
      '.lupa-ov.ok .lupa-res{display:flex}' +
      '.lupa-mark{width:96px;height:96px}' +
      '.lupa-mark circle{stroke:#34c759;stroke-width:5;fill:none;stroke-dasharray:283;stroke-dashoffset:283;animation:lupaDraw .45s ease-out forwards}' +
      '.lupa-mark path{stroke:#34c759;stroke-width:7;fill:none;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:80;stroke-dashoffset:80;animation:lupaDraw .35s .3s ease-out forwards}' +
      '.lupa-ov.warn .lupa-mark circle,.lupa-ov.warn .lupa-mark path{stroke:#ff9f0a}' +
      '.lupa-ov.warn .lupa-mark path{stroke-dasharray:96;stroke-dashoffset:96}' +
      '@keyframes lupaDraw{to{stroke-dashoffset:0}}' +
      '.lupa-dato{margin-top:14px;font-size:15px;font-weight:800;max-width:86vw}' +
      '.lupa-dato2{margin-top:6px;font-size:13px;color:rgba(255,255,255,.7);max-width:86vw}';
    document.head.appendChild(s);
  }
  function lupaPSA(serie){
    cssLupa();
    if (lupaEl) lupaEl.remove();
    var ov = document.createElement('div');
    ov.className = 'lupa-ov';
    ov.innerHTML =
      '<div class="lupa-escena">' +
        '<div class="lupa-doc lupa-d1"></div><div class="lupa-doc lupa-d2"></div><div class="lupa-doc lupa-d3"></div>' +
        '<svg class="lupa-icon" viewBox="0 0 100 100" aria-hidden="true">' +
          '<circle cx="42" cy="42" r="30" fill="rgba(158,193,255,.15)" stroke="#fff" stroke-width="7"/>' +
          '<line x1="64" y1="64" x2="92" y2="92" stroke="#fff" stroke-width="11" stroke-linecap="round"/>' +
        '</svg>' +
      '</div>' +
      '<div class="lupa-tit">Buscando en la base de garantías de PSA…</div>' +
      '<div class="lupa-serie">' + esc(serie || '') + '</div>' +
      '<div class="lupa-sub">El teléfono está revisando la base completa (unos 1.100 equipos) y te avisa enseguida.</div>' +
      '<div class="lupa-res">' +
        '<svg class="lupa-mark" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45"/><path d="M30 52 L45 66 L72 36"/></svg>' +
        '<div class="lupa-dato" id="lupaDato"></div>' +
        '<div class="lupa-dato2" id="lupaDato2"></div>' +
      '</div>';
    document.body.appendChild(ov);
    lupaEl = ov;
    function poner(ok, t1, t2){
      ov.classList.add('ok');
      if (!ok) ov.classList.add('warn');
      var mark = ov.querySelector('.lupa-mark');
      if (mark && !ok) mark.querySelector('path').setAttribute('d', 'M36 36 L64 64 M64 36 L36 64');
      var a = $('lupaDato'), b = $('lupaDato2');
      if (a) a.textContent = t1 || '';
      if (b) b.textContent = t2 || '';
    }
    return {
      el: ov,
      ok: function(t1, t2){ poner(true, t1, t2); },
      warn: function(t1, t2){ poner(false, t1, t2); },
      close: function(){ if (lupaEl) { lupaEl.remove(); lupaEl = null; } }
    };
  }

  /* ── Base de garantías de PSA, pre-cargada ──
     Al abrir la cámara de Pendientes se baja UNA vez la base completa
     (reporte Garantías, ~1.100 equipos) y queda en memoria; cada
     escaneo busca en el teléfono al instante (sin esperar internet). */
  var basePSA = { estado: 'idle', promesa: null, filas: [], mapa: {}, total: 0, error: '' };
  function cargarBasePSA(){
    if (basePSA.estado === 'ok') return Promise.resolve(true);
    if (basePSA.promesa) return basePSA.promesa;
    basePSA.promesa = new Promise(function(res){
      var cfg = supabaseCfg();
      if (!cfg){ basePSA.promesa = null; basePSA.estado = 'fallo'; basePSA.error = 'Sin conexión con la base de PSA.'; res(false); return; }
      var creds = (typeof window.psaGetCreds === 'function') ? window.psaGetCreds() : null;
      if (!creds || !creds.center || !creds.number || !creds.password){
        basePSA.promesa = null; basePSA.estado = 'fallo';
        basePSA.error = 'Faltan tus datos de MI PSA (Ajustes → MI PSA).';
        res(false); return;
      }
      fetch(cfg.url + '/functions/v1/consulta-serial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': cfg.anonKey, 'Authorization': 'Bearer ' + (tokenActual() || cfg.anonKey) },
        body: JSON.stringify({ action: 'report', center: creds.center, number: creds.number, password: creds.password })
      }).then(function(r){ return r.json().then(function(j){ return { ok: r.ok, j: j }; }); })
        .then(function(rr){
          var j = rr.j || {};
          if (rr.ok && j.ok && Array.isArray(j.filas) && j.filas.length){
            basePSA.filas = j.filas;
            basePSA.total = j.total || j.filas.length;
            basePSA.mapa = {};
            j.filas.forEach(function(f){ basePSA.mapa[String(f.s || '').replace(/\s+/g, '').toUpperCase()] = f; });
            basePSA.estado = 'ok';
          } else {
            basePSA.promesa = null;
            basePSA.estado = 'fallo';
            basePSA.error = (j && j.error) || 'No se pudo bajar la base de garantías de PSA.';
          }
          res(basePSA.estado === 'ok');
        }).catch(function(){
          basePSA.promesa = null; basePSA.estado = 'fallo';
          basePSA.error = 'Sin conexión con la base de PSA.';
          res(false);
        });
    });
    return basePSA.promesa;
  }
  function buscarEnBasePSA(serie){
    var s = String(serie || '').replace(/\s+/g, '').toUpperCase();
    if (basePSA.estado !== 'ok' || !s) return null;
    var hit = basePSA.mapa[s] || null;
    if (hit) return { fila: hit, serieReal: s };
    if (s.length >= 6){
      var fuzzy = basePSA.filas.filter(function(f){
        var fs = String(f.s || '').replace(/\s+/g, '').toUpperCase();
        return fs.indexOf(s) === 0 || s.indexOf(fs) === 0;
      });
      if (fuzzy.length === 1) return { fila: fuzzy[0], serieReal: String(fuzzy[0].s || '').toUpperCase() };
    }
    return null;
  }
  /* La base de usuarios del teléfono (la planilla de garantías que
     cargaste en Usuarios) trae el N° de serie: si la serie figura ahí,
     no hace falta ninguna consulta — es al instante y sin internet. */
  function buscarSerieLocal(serie){
    var s = String(serie || '').replace(/\s+/g, '').toUpperCase();
    if (!s || s.length < 4) return null;
    var lista = null;
    try {
      if (typeof window.usuariosTodosActual === 'function') lista = window.usuariosTodosActual();
      if (!lista || !lista.length){
        var raw = JSON.parse(localStorage.getItem('usuarios_garantias') || '[]');
        if (Array.isArray(raw) && raw.length) lista = raw;
      }
    } catch (e) { return null; }
    if (!lista || !lista.length) return null;
    var fuzzy = null, fuzzySerie = '', nFuzzy = 0;
    for (var i = 0; i < lista.length; i++){
      var u = lista[i] || {};
      var fs = String(u.serie || '').replace(/\s+/g, '').toUpperCase();
      if (!fs) continue;
      if (fs === s) return { encontrado: true, serieReal: fs, u: u };
      if (s.length >= 5 && (fs.indexOf(s) === 0 || s.indexOf(fs) === 0)){
        if (!fuzzy) { fuzzy = u; fuzzySerie = fs; }
        nFuzzy++;
      }
    }
    if (fuzzy && nFuzzy === 1) return { encontrado: true, serieReal: fuzzySerie, u: fuzzy };
    return null;
  }

  function consultBasePSA(serie, done){
    cargarBasePSA().then(function(ok){
      if (!ok){ done({ encontrado: false, error: basePSA.error || 'No se pudo consultar la base de PSA.' }); return; }
      var r = buscarEnBasePSA(serie);
      if (r){
        var f = r.fila;
        done({ ok: true, serie: String(serie).toUpperCase(), serieReal: r.serieReal, encontrado: true, total: basePSA.total,
          usuario: f.u || '', telefono: f.t || '', domicilio: f.d || '', cp: f.c || '', localidad: f.l || '',
          producto: f.p || '', compra: f.c2 || '', vence: f.v || '' });
      } else {
        done({ ok: true, serie: String(serie).toUpperCase(), encontrado: false, total: basePSA.total, aviso: 'La serie no figura en tu base de garantías de PSA.' });
      }
    });
  }

  function hoyISO(){
    try{ return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }); }
    catch(e){ return new Date().toISOString().slice(0, 10); }
  }
  function fechaTxtCorta(iso){
    if (!iso) return '';
    var p = String(iso).slice(0, 10).split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso;
  }

  function buscarSeriePendiente(s){
    s = String(s || '').trim().toUpperCase();
    if (!s){
      abrirFichaPendiente(-1);
      return;
    }
    if (s.length < 4){
      if (window.APPIDialog) window.APPIDialog.alert('Escribí el N° de serie (el del QR de la base).', { title:'Falta la serie', icon:'🔄' });
      return;
    }
    // Primero la base del teléfono: al instante, sin internet.
    var localB = buscarSerieLocal(s);
    if (localB && localB.encontrado){
      abrirFichaPendiente(-1, localB.serieReal || s, {
        producto: nombreLimpio(localB.u.producto || ''),
        quien: String(localB.u.usuario || '').trim(),
        telefono: String(localB.u.telf || '').trim(),
        domicilio: String(localB.u.domicilio || '').trim()
      });
      toast('Encontrado en tu base de usuarios ✓');
      return;
    }
    var lupa = lupaPSA(s);
    consultBasePSA(s, function(res){
      if (res && res.encontrado){
        var prod = nombreLimpio(res.producto || ''), q = String(res.usuario || '').trim(), t = String(res.telefono || '').trim();
        var dPSA = {
          producto: prod,
          quien: q,
          telefono: t,
          domicilio: res.domicilio || ''
        };
        lupa.ok((prod || 'Equipo') + (q ? ' · ' + q : ''), [t, res.domicilio].filter(Boolean).join(' · '));
        setTimeout(function(){
          lupa.close();
          abrirFichaPendiente(-1, res.serieReal || s, dPSA);
          toast('Encontrado en PSA ✓');
        }, 1500);
      } else {
        if (res && res.error) lupa.warn('Sin conexión con la base de PSA', String(res.error));
        else lupa.warn('No figura en la base de PSA', 'Se guarda igual: lo completas cuando hables con la empresa.');
        setTimeout(function(){
          lupa.close();
          abrirFichaPendiente(-1, s);
          if (window.APPIDialog) window.APPIDialog.alert((res && res.error) || 'No encontré esa serie en la base de PSA. Te dejo la serie cargada en la ficha: guardala sin datos y, cuando hables con la empresa, completas a quién era.', { title:'Consulta PSA', icon:'🔄' });
        }, 1400);
      }
    });
  }

  function iniciarCargaManualPendiente(){
    if (window.APPIDialog && window.APPIDialog.prompt){
      window.APPIDialog.prompt('Ingresá el N° de serie de la base (o purificador) para buscar los datos.', '', {
        title: 'Carga manual de canje',
        icon: '🔄',
        placeholder: 'Ej: IR5624',
        okText: 'Buscar',
        cancelText: 'Cancelar'
      }).then(function(s){
        if (s === null) return;
        buscarSeriePendiente(s);
      });
    } else {
      var s = prompt('Ingresá el N° de serie de la base:');
      if (s === null) return;
      buscarSeriePendiente(s);
    }
  }

  function htmlPendientes(){
    var items = leerPendientes().slice().sort(cmpProducto);
    var total = items.length;
    var filas = items.map(function(p){
      var meta = [];
      if (p.quien) meta.push('De: ' + p.quien);
      if (p.telefono) meta.push(p.telefono);
      meta.push('Serie ' + p.serie);
      if (p.fecha) meta.push('Recibido ' + fechaTxtCorta(p.fecha));
      var sid = esc(p.serie);
      return '<div class="st-row" data-st-pedit="' + sid + '" title="Tocá para corregir">' +
        '<div><span class="st-name">' + esc(p.producto || 'Equipo canje') + '</span><span class="st-meta">' + esc(meta.join(' · ')) + '</span></div>' +
        '<div class="st-qty">' +
          '<button type="button" class="st-mini" data-st-entregado="' + sid + '" aria-label="Marcar entregado">🚚</button>' +
          '<button type="button" class="st-mini" data-st-pdel="' + sid + '" aria-label="Quitar">✕</button>' +
        '</div></div>';
    }).join('');
    return '<div class="st-card"><div class="st-name">🔄 Pendientes de canje</div>' +
      '<div class="st-meta" style="margin:4px 0 8px">' + total + ' equipo' + (total === 1 ? '' : 's') + ' para entregar a la empresa</div>' +
      (filas || '<div class="st-empty">Nada pendiente. Al hacer un canje, cargá la base del equipo viejo con la cámara o con Carga manual.</div>') +
      '</div><div class="st-scan-foot"><div class="st-fab-group" id="stFabGroupP"><button type="button" id="stQrP" class="st-fab st-fab-child fab-scan" aria-label="Escanear base" title="Apuntá al QR de la base"><span class="st-fab-lbl">Escanear</span><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:26px;height:26px;display:block"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="4" height="4" rx="1"/><rect x="18" y="14" width="3" height="3" rx="1"/><rect x="15.5" y="18.5" width="2.5" height="2.5" rx="0.7"/><path d="M7 7h1v1H7zM17 7h1v1h-1zM7 17h1v1H7z"/><path d="M14 8.5h2M8.5 14v2M14 16.2h.8M18 18.5h-2"/></svg></button><button type="button" id="stFabManualP" class="st-fab st-fab-child fab-manual" aria-label="Carga manual" title="Cargar manual"><span class="st-fab-lbl">Manual</span><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="width:26px;height:26px;display:block"><path d="M12 20H21"/><path d="M16.5 3.5a2.22 2.22 0 0 1 3.14 3.14L7 19.3 3.5 20.5 4.7 17 16.5 3.5z"/><path d="M13.5 6.5L17.5 10.5"/></svg></button><button type="button" id="stFabMainP" class="st-fab st-fab-main" aria-label="Acciones" title="Opciones"><span class="st-fab-plus"></span></button></div></div><div class="st-fab-backdrop" id="stFabBackdropP"></div>';
  }

  // Abre el formulario para una pendiente (i = -1 → nueva).
  function abrirFichaPendiente(i, serieInicial, prefill){
    var items = leerPendientes();
    var p = (i >= 0) ? items[i] : {
      serie: serieInicial || '',
      producto: (prefill && prefill.producto) || '',
      quien: (prefill && prefill.quien) || '',
      telefono: (prefill && prefill.telefono) || '',
      domicilio: (prefill && prefill.domicilio) || '',
      fecha: hoyISO()
    };
    editPIdx = i;
    css();
    ensureOverlay();
    $('stSheet').innerHTML =
      '<h3>' + (i >= 0 ? 'Corregir equipo canjeado' : 'Equipo canjeado') + '</h3>' +
      '<p>Al hacer un plan canje te quedás con el equipo viejo: acá se anota para entregárselo a la empresa. Si la serie no figura en la base de PSA, guardala solo con la serie y completá a quién era cuando hables con la empresa.</p>' +
      '<label class="st-field"><span>N° de serie (base)</span><input id="stPSerie" autocomplete="off" value="' + esc(p.serie) + '"></label>' +
      '<label class="st-field"><span>Producto</span><input id="stPProducto" list="stCatDl" autocomplete="off" placeholder="Ej: PSA VERO" value="' + esc(p.producto || '') + '"></label>' +
      '<label class="st-field"><span>De quién era (nombre)</span><input id="stPQuien" autocomplete="name" placeholder="Ej: GÓMEZ, MARÍA" value="' + esc(p.quien || '') + '"></label>' +
      '<label class="st-field"><span>Teléfono del dueño</span><input id="stPTel" type="tel" inputmode="tel" autocomplete="tel" placeholder="Ej: 0351 455 2272" value="' + esc(p.telefono || '') + '"></label>' +
      (p.domicilio ? '<label class="st-field" id="stRowDom"><span>Domicilio (según PSA)</span><input id="stPDomicilio" autocomplete="street-address" value="' + esc(p.domicilio) + '" style="opacity:.7"></label>' : '<span id="stRowDom"></span>') +
      '<label class="st-field"><span>FECHA DE FABRICACION</span><input id="stPFecha" type="date" value="' + esc(p.fecha || '') + '"></label>' +
      '<button type="button" class="st-save" id="stSaveP">Guardar pendiente</button>' +
      '<button type="button" class="st-cancel" id="stCancelP">Cancelar</button>';
    $('stOverlay').classList.add('open');
    if (window.bloquearScrollCuerpo) window.bloquearScrollCuerpo();
    $('stCancelP').onclick = cerrarFichaPendiente;
    $('stSaveP').onclick = guardarFichaPendiente;

    var inpSerie = $('stPSerie');
    if (inpSerie){
      inpSerie.addEventListener('change', function(){
        var val = String(inpSerie.value || '').trim().toUpperCase();
        if (val.length >= 4){
          var loc = buscarSerieLocal(val);
          if (loc && loc.encontrado){
            var pr = $('stPProducto'), qu = $('stPQuien'), tt = $('stPTel');
            if (pr && (!pr.value || pr.value === 'Equipo canje')) pr.value = nombreLimpio(loc.u.producto || '');
            if (qu && !qu.value) qu.value = String(loc.u.usuario || '').trim();
            if (tt && !tt.value) tt.value = String(loc.u.telf || '').trim();
            toast('Encontrado en tus usuarios ✓');
          }
        }
      });
    }

    setTimeout(function(){ var el = $('stPSerie'); if (el) el.focus(); }, 40);
  }
  var editPIdx = -1;
  function cerrarFichaPendiente(){
    var ov = $('stOverlay');
    if (ov) ov.classList.remove('open');
    if (window.liberarScrollCuerpo) window.liberarScrollCuerpo();
    editPIdx = -1;
  }
  function guardarFichaPendiente(){
    var items = leerPendientes();
    var serie = String(($('stPSerie') && $('stPSerie').value) || '').trim().toUpperCase();
    var producto = nombreLimpio(($('stPProducto') && $('stPProducto').value) || '');
    var quien = String(($('stPQuien') && $('stPQuien').value) || '').trim();
    var telefono = String(($('stPTel') && $('stPTel').value) || '').trim();
    var domicilio = String(($('stPDomicilio') && $('stPDomicilio').value) || '').trim();
    var fecha = ($('stPFecha') && $('stPFecha').value) || hoyISO();
    if (!serie){
      if (window.APPIDialog) window.APPIDialog.alert('Escribí el N° de serie (el del QR de la base).', { title:'Falta la serie', icon:'🔄' });
      return;
    }
    var p = { serie: serie, producto: producto || 'Equipo canje', quien: quien, telefono: telefono, domicilio: domicilio, fecha: fecha };
    if (editPIdx >= 0) items[editPIdx] = p;
    else {
      if (items.some(function(o){ return norm(o.serie) === norm(serie); })){
        if (window.APPIDialog) window.APPIDialog.alert('Esa serie ya está en Pendientes. No se duplica.', { title:'Serie repetida', icon:'🔄' });
        return;
      }
      items.push(p);
    }
    guardarPendientes(items);
    cerrarFichaPendiente();
    pintar();
    toast('Pendiente guardado 🔄');
  }
  function marcarEntregado(i){
    var items = leerPendientes();
    var p = items[i];
    if (!p) return;
    var msg = (p.producto || 'El equipo') + ' · serie ' + p.serie + (p.quien ? ' · de ' + p.quien : '') + '. ¿Ya lo entregaste a la empresa? Se elimina de Pendientes.';
    window.APPIDialog.confirm(msg, { title:'Marcar entregado', icon:'🚚', okText:'Sí, entregado' }).then(function(s){
      if (!s) return;
      var borrado = items.splice(i, 1)[0];
      guardarPendientes(items);
      pintar();
      toast('Entregado ✓ — quedaste al día');
      mostrarUndo('pendiente', {item:borrado, idx:i}, 'Entregado "'+(borrado.producto||'equipo')+'" — deshacer?');
    });
  }
  function eliminarPendiente(i){
    var items = leerPendientes();
    var p = items[i];
    if (!p) return;
    window.APPIDialog.confirm('Quitar "' + (p.producto || 'equipo') + '" (serie ' + p.serie + ') de Pendientes.', { title:'Quitar', icon:'🔄', danger:true, okText:'Quitar' }).then(function(s){
      if (!s) return;
      var borrado = items.splice(i, 1)[0];
      guardarPendientes(items);
      pintar();
      mostrarUndo('pendiente', {item:borrado, idx:i}, 'Pendiente "'+(borrado.producto||'equipo')+'" quitado');
    });
  }

  // Busca en la base de usuarios de APPI (nombre/telefono) y deja elegir.
  function buscarMisUsuarios(q){
    var cfg = supabaseCfg();
    if (!cfg){ if (window.APPIDialog) window.APPIDialog.alert('Necesitás la nube para buscar en tus usuarios.'); return; }
    if (window.APPIDialog) window.APPIDialog.alert('Buscando en tus usuarios…', { title:'Un momento', icon:'📇', cancel:false });
    fetch(cfg.url + '/rest/v1/appi_gestion_contactos?select=nombre,telefono&limit=2000&order=updated_at.desc', {
      headers: { 'apikey': cfg.anonKey, 'Authorization': 'Bearer ' + (tokenActual() || cfg.anonKey) }
    }).then(function(r){ return r.ok ? r.json() : []; })
      .then(function(rows){
        var list = (Array.isArray(rows) ? rows : []).filter(function(c){
          var hay = ((c.nombre || '') + ' ' + (c.telefono || '')).toLowerCase();
          return !q || hay.indexOf(String(q).toLowerCase()) >= 0;
        }).slice(0, 30);
        if (!list.length){ if (window.APPIDialog) window.APPIDialog.alert('No encontré usuarios' + (q ? ' con "' + q + '"' : '') + '.', { title:'Sin resultados', icon:'📇' }); return; }
        var opciones = list.map(function(c){ return { label: c.nombre + (c.telefono ? ' · ' + c.telefono : ''), value: c }; });
        window.APPIDialog.choose('Elegí a quién pertenece:', opciones, { title:'Tus usuarios', icon:'📇' }).then(function(sel){
          if (!sel) return;
          var quien = $('stPQuien'), tel = $('stPTel');
          if (quien) quien.value = sel.nombre;
          if (tel && sel.telefono) tel.value = sel.telefono;
        });
      }).catch(function(){ if (window.APPIDialog) window.APPIDialog.alert('No se pudo buscar en tus usuarios.'); });
  }

  // Flujo de cámara en el tab Pendientes: el QR de la base da la serie;
  // se consulta la base de PSA y se arma la fila sola.
  function qrVivoPendiente(texto){
    var p = parseQR(texto);
    var serie = (p && p.serie) || (serieLike(String(texto).trim()) ? String(texto).trim().toUpperCase() : '');
    if (!serie || serie === vivo.serieQR) return;
    vivo.serieQR = serie;
    // Si ya figura en Pendientes no se vuelve a cargar.
    if (leerPendientes().some(function(o){ return norm(o.serie) === norm(serie); })){
      bipUno();
      estado('La serie ' + serie + ' ya está en Pendientes.');
      setTimeout(cerrarEscan, 400);
      return;
    }
    bipUno(); // "leí el QR": feedback inmediato al enfocar
    // Primero la base del teléfono (la planilla de Usuarios): si la
    // serie figura ahí, carga al instante y sin internet.
    var local = buscarSerieLocal(serie);
    if (local && local.encontrado){
      cerrarEscan();
      var itemsL = leerPendientes();
      var filaL = {
        serie: (local.serieReal || serie),
        producto: nombreLimpio(local.u.producto || '') || 'Equipo canje',
        quien: String(local.u.usuario || '').trim(),
        telefono: String(local.u.telf || '').trim(),
        domicilio: String(local.u.domicilio || '').trim(),
        fecha: hoyISO()
      };
      itemsL.push(filaL);
      guardarPendientes(itemsL);
      pintar();
      sonidoQR(); // doble bip: la acción se realizó
      toast('Cargado de tu base de usuarios: ' + filaL.producto + (filaL.quien ? ' · de ' + filaL.quien : '') + ' 🔄');
      return;
    }
    cerrarEscan();
    // Lupa: "el teléfono está pensando" hasta que aparecen los datos.
    var lupa = lupaPSA(serie);
    consultBasePSA(serie, function(res){
      if (res && res.encontrado){
        var items = leerPendientes();
        var fila = {
          serie: (res.serieReal || serie),
          producto: nombreLimpio(res.producto || '') || 'Equipo canje',
          quien: String(res.usuario || '').trim(),
          telefono: String(res.telefono || '').trim(),
          domicilio: String(res.domicilio || '').trim(),
          fecha: hoyISO()
        };
        items.push(fila);
        guardarPendientes(items);
        lupa.ok(fila.producto + ' · ' + (fila.quien || 'dueño en la base'), [fila.telefono, fila.domicilio].filter(Boolean).join(' · '));
        sonidoQR(); // doble bip: la acción se realizó
        setTimeout(function(){
          lupa.close();
          pintar();
          toast('Cargado: ' + fila.producto + (fila.quien ? ' · de ' + fila.quien : '') + ' 🔄');
        }, 1500);
      } else {
        if (res && res.error) lupa.warn('Sin conexión con la base de PSA', String(res.error));
        else lupa.warn('No figura en la base de PSA', 'Se guarda igual: lo completas cuando hables con la empresa.');
        setTimeout(function(){
          lupa.close();
          abrirFichaPendiente(-1, serie);
          if (window.APPIDialog) window.APPIDialog.alert((res && res.error) || 'No encontré esa serie en la base de PSA. Te dejo la serie cargada en la ficha: guardala sin datos y, cuando hables con la empresa, completas a quién era (o buscá en tus usuarios).', { title:'Serie no encontrada', icon:'🔄' });
        }, 1400);
      }
    });
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
      cant: 1,
      serie: it.serie || '',
      color: it.color || ''
    });
    guardarPrestamos(rows);
    cerrarPrestar();
    tab = 'prestados';
    pintar();
    toast('Prestado a ' + quien.split(/\s+/)[0] + ' 📦');
  }

  // Al volver, la unidad regresa a SU fila (por serie) y no crea una
  // fila manual nueva sin serie.
  function devolverAlStock(row){
    var items = leerStock();
    if (row.serie) {
      var s = norm(row.serie);
      var hit = items.find(function(it){ return it.serie && norm(it.serie) === s; });
      if (hit) { hit.cant = (Number(hit.cant) || 0) + 1; guardarStock(items); return; }
      // La fila no estaba en el stock (todas sus unidades andaban
      // prestadas y la lectura la filtra con cant 0): se reconstruye
      // con los datos que quedaron en el préstamo.
      items.push({ id: genStockId(), nombre: row.producto, color: row.color || '', serie: row.serie, cant: 1 });
      guardarStock(items);
      return;
    }
    agregarManual({ nombre: row.producto, color: row.color || '', serie: '', cant: 1 });
  }

  function devolver(id){
    var rows = leerPrestamos();
    var i = rows.findIndex(function(r){ return r.id === id; });
    if (i < 0) return;
    var row = rows[i];
    var serieActual = row.serie || '';
    function finalizarConSerie(serieFinal){
      // borrar el préstamo y devolver con la serie elegida
      rows.splice(i, 1);
      guardarPrestamos(rows);
      if (serieFinal) {
        var s = norm(serieFinal);
        var items = leerStock();
        var hit = items.find(function(it){ return it.serie && norm(it.serie) === s; });
        if (hit) { hit.cant = (Number(hit.cant)||0)+1; guardarStock(items); }
        else { items.push({ id: genStockId(), nombre: row.producto, color: row.color||'', serie: serieFinal, cant:1 }); guardarStock(items); }
      } else {
        devolverAlStock({ producto: row.producto, color: row.color||'', serie: '', cant:1 });
      }
      tab = 'stock';
      pintar();
      toast('Volvió al stock ✓');
    }
    var msg = '¿Es el mismo número de serie' + (serieActual ? ' ('+serieActual+')' : '') + '?';
    if (window.APPIDialog && window.APPIDialog.choose){
      window.APPIDialog.choose(msg, [{label:'✅ Sí, el mismo', value:'si'}, {label:'✏️ No, es otro', value:'no'}], {title:'Devolución', icon:'📦'}).then(function(sel){
        if(!sel) return;
        if(sel==='si'){
          finalizarConSerie(serieActual);
        } else {
          if(window.APPIDialog && window.APPIDialog.prompt){
            window.APPIDialog.prompt('Ingresá el nuevo N° de serie', '', {title:'Nuevo número de serie', icon:'🔢', okText:'Guardar'}).then(function(nuevo){
              if(nuevo==null) return;
              var ns = String(nuevo).trim().toUpperCase();
              if(!ns){ if(window.APPIDialog) window.APPIDialog.alert('Tenés que poner el nuevo número de serie', {title:'Falta serie', icon:'🔢'}); return; }
              if(leerStock().some(function(it){ return it.serie && norm(it.serie)===norm(ns); })){
                if(window.APPIDialog) window.APPIDialog.alert('Esa serie ya está en tu stock. Usá otra.', {title:'Serie repetida', icon:'📦'}); return;
              }
              finalizarConSerie(ns);
            });
          } else {
            var ns2 = prompt('Nuevo N° de serie:', '');
            if(ns2!=null) { var t=String(ns2).trim().toUpperCase(); if(t) finalizarConSerie(t); }
          }
        }
      });
    } else if(window.APPIDialog && window.APPIDialog.confirm){
      window.APPIDialog.confirm(msg, {title:'Devolución', icon:'📦', okText:'Sí, mismo', cancelText:'No, otro'}).then(function(ok){
        if(ok){ finalizarConSerie(serieActual); }
        else {
          if(window.APPIDialog && window.APPIDialog.prompt){
            window.APPIDialog.prompt('Ingresá el nuevo N° de serie', '', {title:'Nuevo número de serie', icon:'🔢', okText:'Guardar'}).then(function(nuevo){
              if(nuevo==null) return;
              var ns = String(nuevo).trim().toUpperCase();
              if(!ns) return;
              finalizarConSerie(ns);
            });
          }
        }
      });
    } else {
      var ok2 = confirm(msg);
      if(ok2) finalizarConSerie(serieActual);
      else { var ns3 = prompt('Nuevo N° de serie:', ''); if(ns3!=null) finalizarConSerie(String(ns3).trim().toUpperCase()); }
    }
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
    var texto = 'Hola ' + (row.quien.split(/\s+/)[0] || '') + '! ¿Cómo andás? 😊\n\n¿Cómo te fue con el ' + row.producto + ' que te presté? Te consulto porque lo estoy necesitando.';
    window.APPITel.abrir(row.telefono, texto, row.quien);
  }

  function abrir(){
    css();
    crearVista();
    tab = 'stock';
    if (typeof showView === 'function') showView('view-stock');
    var tabs = $('tabs');
    if (tabs) tabs.style.display = 'none';
    pintar();
    // Calienta el lector de texto (solo si aún no arrancó): cuando el
    // usuario toque 📷 ya viene listo y la primera lectura sale al
    // instante. La descarga (~8 MB) solo ocurre la primera vez.
    if (!ocrPromise) {
      cargarMotorOCR().catch(function(){ /* sin internet: se reintenta al abrir el escáner */ });
    }
    // v741: carga la referencia del catálogo oficial (63 productos) para
    // que el escáner "lea de memoria" los nombres. Es un JSON chico y
    // queda en caché; si no hay internet se usa el archivo local de la app.
    cargarCatalogo().then(datalistCatalogo, function(){});
  }

  window.openStock = abrir;
  window.APPIStock = {
    open: abrir, render: pintar,
    leerStock: leerStock, leerPrestamos: leerPrestamos, leerPendientes: leerPendientes,
    parseQR: parseQR, procesarQR: procesarQR,
    agregarQR: agregarQR, decodificarFrame: decodificarFrame,
    abrirEscan: abrirEscan, cerrarEscan: cerrarEscan, sonidoQR: sonidoQR,
    ocrCanvas: ocrCanvas, cargarMotorOCR: cargarMotorOCR,
    qrVivo: qrVivo, evaluarLectura: evaluarLectura,
    matchCatalogo: matchCatalogo, cargarCatalogo: cargarCatalogo,
    buscarSeriePendiente: buscarSeriePendiente,
    iniciarCargaManualPendiente: iniciarCargaManualPendiente
  };
})();
