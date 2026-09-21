(function(){
  'use strict';

  var FALLBACK = [
  { num:'001', n:'ADAPT. UNIVERSAL C/MANGUERA', sku:'612010010', f:["universal"], t:'presion', m:'', nt:[] },
  { num:'002', n:'ADAPT. ROSCA (FV TIPO UNIMIX)', sku:'612010020', f:["unimix"], t:'', m:'', nt:["fv"] },
  { num:'003', n:'ADAPT. ROSCA CORTA', sku:'612010030', f:[], t:'', m:'', nt:[] },
  { num:'004', n:'ADAPT. ROSCA LARGA', sku:'612010040', f:[], t:'', m:'', nt:[] },
  { num:'005', n:'ADAPT. UNIV.MARIPOSA DIAM.11-12', sku:'612010050', f:["mariposa"], t:'presion', m:'diam 11', nt:[] },
  { num:'006', n:'ADAPT. UNIV.MARIPOSA DIAM.14', sku:'612010060', f:["mariposa"], t:'presion', m:'diam 14', nt:[] },
  { num:'007', n:'ADAPT. UNIV.MARIPOSA DIAM.16', sku:'612010070', f:["mariposa"], t:'presion', m:'diam 16', nt:[] },
  { num:'008', n:'ADAPT. UNIV.MARIPOSA DIAM.18', sku:'612010080', f:["mariposa"], t:'presion', m:'diam 18', nt:[] },
  { num:'009', n:'ADAPT. UNIV.MARIPOSA DIAM.20', sku:'612010090', f:["mariposa"], t:'presion', m:'diam 20', nt:[] },
  { num:'010', n:'ADAPT. ROSCA HEMBRA-HEMBRA', sku:'612010100', f:[], t:'h-h', m:'', nt:[] },
  { num:'016', n:'ADAPT. ROSCA HEMBRA O.N.', sku:'612010160', f:[], t:'hembra', m:'', nt:[] },
  { num:'017', n:'ADAPT. ROSCA 3/4 POLI 2', sku:'612280170', f:[], t:'', m:'3/4', nt:["poli","3/4"] },
  { num:'018', n:'ADAPT. ROSCA CANILLA TIPO PATIO', sku:'612010180', f:["patio"], t:'', m:'', nt:[] },
  { num:'019', n:'ADAPT. ROSCA MACHO 18.1', sku:'612010190', f:[], t:'macho', m:'', nt:[] },
  { num:'19', n:'ADAPT. M-M BG 3/4 P/DUCHA CR', sku:'612100190', f:["ducha"], t:'m-m', m:'3/4', nt:["bg","3/4"] },
  { num:'020', n:'ADAPT. ROSCA ESPECIAL', sku:'612010200', f:["especial"], t:'', m:'', nt:[] },
  { num:'20', n:'ADAPT. M-H BG 3/4 P/ DUCHA CR', sku:'612100200', f:["ducha"], t:'m-h', m:'3/4', nt:["bg","3/4"] },
  { num:'024', n:'ADAPT. ROSCA HEMBRA 20.1', sku:'612010240', f:[], t:'hembra', m:'', nt:[] },
  { num:'025', n:'ADAPT. M-M 1/2 DUCHA CR C/ORING', sku:'', f:["ducha"], t:'m-m', m:'', nt:["con oring","1/2"] },
  { num:'027', n:'ADAPT. ROSCA LARGA PASO FINO', sku:'612010270', f:["pasoFino"], t:'', m:'', nt:[] },
  { num:'030', n:'ADAPT. H-M 1/2 C/TUERCA DUCHA II', sku:'612100300', f:["ducha"], t:'h-m', m:'', nt:["con tuerca","1/2"] },
  { num:'032', n:'ADAPT. H-M 1/2 DUCHA II SALIDA', sku:'612100320', f:["ducha"], t:'h-m', m:'', nt:["1/2"] },
  { num:'033', n:'ADAPT. M-M 3/4 BG DUCHA II C/TUERCA', sku:'612100330', f:["ducha"], t:'m-m', m:'3/4', nt:["con tuerca","bg","3/4"] },
  { num:'036', n:'ADAPT. M-M 3/4 BG DUCHA II', sku:'612100360', f:["ducha"], t:'m-m', m:'3/4', nt:["bg","3/4"] },
  { num:'037', n:'ADAPT. ROSCA MACHO (FV SWING PLUS)', sku:'612010370', f:["swingPlus"], t:'macho', m:'', nt:["fv"] },
  { num:'039', n:'ADAPT. ROSCA HEMBRA-HEMBRA DIÁM.22', sku:'612010390', f:[], t:'h-h', m:'diam 22', nt:[] },
  { num:'041', n:'ADAPT. ROSCA CANILLA PIAZZA', sku:'612010410', f:["piazza"], t:'', m:'', nt:[] },
  { num:'051', n:'ADAPT. SIN ROSCA DIAM. 17', sku:'612010510', f:[], t:'', m:'diam 17', nt:[] },
  { num:'053', n:'ADAPT. ROSCA BSP 3/4 X 14 HILOS', sku:'612010530', f:[], t:'', m:'14 hilos', nt:["3/4"] },
  { num:'073', n:'ADAPT. ROSCA MÚLTIPLE', sku:'612010730', f:["multiple"], t:'', m:'', nt:[] },
  { num:'078', n:'ADAPT. ROSCA DIAM. 23.5', sku:'612010780', f:[], t:'', m:'diam 23.5', nt:[] },
  { num:'083', n:'ADAPT. ROSCA MACHO 22 X 1', sku:'612010830', f:[], t:'macho', m:'22x1', nt:[] },
  { num:'100', n:'ADAPT. ROSCA HEMBRA BSP 1/2', sku:'612011000', f:[], t:'hembra', m:'', nt:[] },
  { num:'102', n:'ADAPT. ROSCA MACHO FV DIÁM 18.6', sku:'612011020', f:[], t:'macho', m:'diam 18.6', nt:["fv"] },
  { num:'103', n:'ADAPT. ROSCA HEMBRA P/HIDROMET', sku:'612011030', f:["hidrometro"], t:'hembra', m:'', nt:[] },
  { num:'135', n:'ADAPT. ROSCA MACHO 21 X 1', sku:'612011350', f:[], t:'macho', m:'21x1', nt:[] },
  { num:'142', n:'ADAPT. ROSCA MACHO 16.3 X 1', sku:'612011420', f:[], t:'macho', m:'16.3x1', nt:[] },
  { num:'144', n:'ADAPT. ROSCA MACHO 18.2 X 1', sku:'612011440', f:[], t:'macho', m:'18.2x1', nt:[] },
  { num:'147', n:'ADAPT. ROSCA TIPO RACOR M. 24 X 1', sku:'612011470', f:["racor"], t:'', m:'24x1', nt:[] },
  { num:'148', n:'ADAPT. ROSCA HEMBRA (SWING PLUS) M. 24X1', sku:'612011480', f:["swingPlus"], t:'hembra', m:'24x1', nt:[] },
  { num:'149', n:'ADAPT. ROSCA P/LAVARROPA M 24 X 1', sku:'612011490', f:["lavarropas"], t:'', m:'M24x1', nt:[] },
  { num:'155', n:'ADAPT. S-1000 C/ORING. P/MANOMETRO', sku:'612011550', f:["manometro"], t:'', m:'', nt:["con oring","s-1000"] },
  { num:'164', n:'ADAPT. ROSCA MACHO 20 X 1', sku:'612011640', f:[], t:'macho', m:'20x1', nt:[] },
  { num:'174', n:'ADAPT. ROSCA AIREADOR M 24 X 1', sku:'612011740', f:["aireador"], t:'', m:'M24x1', nt:[] },
  { num:'177', n:'ADAPT. RECTANGULAR P/PEGAR', sku:'612011770', f:["rectangular"], t:'presion', m:'', nt:[] },
  { num:'179', n:'ADAPT. ROSCA MACHO DIAM 18 X 1 LARGO', sku:'612011790', f:[], t:'macho', m:'18x1', nt:["largo"] },
  { num:'180', n:'ADAPT. ROSCA HEMBRA DIAM 22 X 1 CORTO', sku:'612011800', f:[], t:'hembra', m:'22x1', nt:["corto"] },
  { num:'181', n:'ADAPT. H-M 1/2 DUCHA SALIDA', sku:'612011810', f:["ducha"], t:'h-m', m:'', nt:["1/2"] },
  { num:'228', n:'ADAPT. OVALADO', sku:'612012280', f:["ovalado"], t:'presion', m:'', nt:[] },
  { num:'229', n:'ADAPT. ROSCA H-H 22 X 1 LARGO', sku:'612012290', f:[], t:'h-h', m:'22x1', nt:["largo"] },
  { num:'232', n:'ADAPT. ROSCA H-H 22 X 1 CORTO', sku:'612012320', f:[], t:'h-h', m:'22x1', nt:["corto"] },
  { num:'239', n:'ADAPT. ROSCA H-M 18 X 1 CORTO', sku:'612012390', f:[], t:'h-m', m:'18x1', nt:["corto"] },
  { num:'245', n:'ADAPT. ROSCA H-M 23 X 1', sku:'612012450', f:[], t:'h-m', m:'23x1', nt:[] },
  { num:'246', n:'ADAPT. ROSCA MACHO 23 X 1', sku:'612012460', f:[], t:'macho', m:'23x1', nt:[] },
  { num:'537', n:'ADAPT. ROSCA H 22,4 X 1', sku:'612015370', f:[], t:'', m:'22.4x1', nt:[] },
  { num:'550', n:'ADAPT. ROSCA H 22 X 1 LARGO 36 CROMADO', sku:'612015500', f:[], t:'', m:'22x1', nt:["largo","cromado"] },
  { num:'553', n:'ADAPT. ESP. H-M 16,3 X 1 LARGO', sku:'612015530', f:[], t:'h-m', m:'16.3x1', nt:["largo"] },
  { num:'573', n:'ADAPT. UNIVERSAL C/MANGUERA NERO', sku:'612015730', f:["universal"], t:'presion', m:'', nt:["nero"] },
  { num:'', n:'( • 448) ADAPT. ROSCA H-M M24X1 X M16X1 CROMADO', sku:'', f:[], t:'h-m', m:'M24x1', nt:["cromado"] },
  { num:'', n:'ADAPT. ESPECIAL KIT 90°', sku:'612012470', f:["especial"], t:'', m:'', nt:[] },
  { num:'', n:'ARANDELA ADAPTADOR DIÁM. 19 X 5', sku:'612010760', f:[], t:'', m:'diam 19', nt:[] },
  { num:'', n:'ARANDELA ADAPTADOR DIÁM. 21 X 5', sku:'612010770', f:[], t:'', m:'diam 21', nt:[] },
  { num:'', n:'BUJE DE CONEXION P/CANILLA DISPENSER', sku:'612030350', f:["dispenser"], t:'', m:'', nt:[] },
  { num:'', n:'BUJE DE DERIVACIÓN CANILLA BM', sku:'612011150', f:[], t:'', m:'', nt:[] },
  { num:'', n:'CONECTOR RAPIDO DE SALIDA PSA 10KD', sku:'612011140', f:[], t:'', m:'', nt:[] },
  { num:'', n:'KIT ADAPT.P/CANILLA NO TRADICIONAL DUCHA II', sku:'612100350', f:["ducha"], t:'', m:'', nt:[] },
  { num:'', n:'KIT ADAPT.RECTOS P/CANILLAS PSA DUCHA II', sku:'612100310', f:["ducha"], t:'', m:'', nt:[] },
  { num:'', n:'KIT PARA BAJA PRESION UNIVERSAL', sku:'612011340', f:["universal"], t:'presion', m:'', nt:[] },
  { num:'', n:'LAP BM 8 X 8', sku:'612011670', f:[], t:'', m:'', nt:[] },
  { num:'', n:'LAP DUCHA II HEMBRA-MACHO 1/2 X 1/2', sku:'612011880', f:["ducha"], t:'hembra', m:'2x1', nt:[] },
  { num:'', n:'LAP DUCHA II MACHO-MACHO 1/2 X 1/2', sku:'612011710', f:["ducha"], t:'macho', m:'2x1', nt:[] },
  { num:'', n:'LAP SM 24 X 1', sku:'612011650', f:[], t:'', m:'M24x1', nt:[] },
  { num:'', n:'LAP SM P/ MANGUERA BY PASS', sku:'612012540', f:[], t:'', m:'', nt:[] },
  { num:'', n:'LLAVE DE AJUSTE P/TAPA PREFILTRO 40K-D', sku:'612011320', f:[], t:'', m:'', nt:[] },
  { num:'', n:'LLAVE DE CORTE S-1000 MACHO/HEMBRA', sku:'612010840', f:[], t:'hembra', m:'', nt:["s-1000"] },
  { num:'', n:'LLAVE DE CORTE S-1000 MACHO/MACHO', sku:'612010360', f:[], t:'macho', m:'', nt:["s-1000"] },
  { num:'', n:'PROLONGADOR DE 3/4 PSA POLI', sku:'612280090', f:[], t:'', m:'3/4', nt:["poli","3/4"] },
  { num:'', n:'PROLONGADOR P/ PICO PSA SENIOR 3', sku:'612012500', f:[], t:'', m:'', nt:[] },
  { num:'', n:'PROLONGADOR P/PICO PSA SENIOR', sku:'612011390', f:[], t:'', m:'', nt:[] },
  { num:'', n:'PROLONGADOR PSA DUCHA II', sku:'612100270', f:["ducha"], t:'', m:'', nt:[] },
  { num:'', n:'REGULADOR DE CAUDAL', sku:'612010540', f:[], t:'', m:'', nt:[] },
  { num:'', n:'SET ADAPTACION RETRO P/KIT CANILLA', sku:'612030620', f:[], t:'', m:'', nt:[] },
  { num:'', n:'TE C/LLAVE DE CORTE P/GRIFERÍA PSA Y ECO-D', sku:'621010100', f:["griferia","ecod"], t:'', m:'', nt:[] },
  { num:'', n:'VARILLA INST. ECO-D SM', sku:'621010090', f:["ecod"], t:'', m:'', nt:[] }
  ];

  var ESTILOS_ID = 'canillasEstilosV938';
  var GIA_PDF = './guia-adaptadores-psa.pdf';
  var CAT = null;
  var estado = { uso: null, tipo: null, medida: null, q: '' };

  function inyectarEstilos(){
    if (document.getElementById(ESTILOS_ID)) return;
    var css = '' +
      '#canillasCont{display:flex;flex-direction:column;gap:14px;padding:14px;padding-bottom:34px;max-width:760px;margin:0 auto}' +
      '.can-intro{background:rgba(255,255,255,.72);border:1px solid rgba(80,90,130,.12);border-radius:16px;padding:14px;font-size:13px;line-height:1.5;color:#3a3a48}' +
      '.can-intro b{color:#0b5878}' +
      '.can-barra{display:flex;gap:8px;flex-wrap:wrap;align-items:center}' +
      '.can-count{font-size:12px;font-weight:800;color:#0b5878;background:rgba(91,141,239,.12);padding:6px 10px;border-radius:999px}' +
      '.can-search{flex:1;min-width:180px;padding:9px 12px;border-radius:12px;border:1px solid rgba(80,90,130,.18);background:rgba(255,255,255,.85);font:inherit;font-size:13px;outline:none}' +
      '.can-paso{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:900;color:#0b5878;text-transform:uppercase;letter-spacing:.3px}' +
      '.can-paso em{font-style:normal;font-weight:800;color:#fff;background:#3ad0a4;border-radius:8px;padding:2px 7px;font-size:11px}' +
      '.can-chips{display:flex;gap:8px;flex-wrap:wrap}' +
      '.can-chip{border:1px solid rgba(80,90,130,.16);background:#fff;color:#3a3a48;border-radius:12px;padding:9px 12px;font:inherit;font-size:13px;font-weight:700;cursor:pointer;transition:all .12s}' +
      '.can-chip:hover{transform:translateY(-1px);border-color:#5b8def}' +
      '.can-chip.sel{background:linear-gradient(135deg,#0b5878,#3ad0a4);color:#fff;border-color:transparent}' +
      '.can-chip.saltar{background:none;color:#5b8def;border-style:dashed}' +
      '.can-selecs{display:flex;gap:6px;flex-wrap:wrap;align-items:center;font-size:12px}' +
      '.can-selecs span{background:rgba(11,88,120,.08);color:#0b5878;border-radius:999px;padding:4px 9px;font-weight:800;cursor:pointer}' +
      '.can-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}' +
      '@media(min-width:600px){.can-cards{grid-template-columns:repeat(auto-fill,minmax(280px,1fr))}}' +
      '.can-card{background:#fff;border:1px solid rgba(80,90,130,.14);border-radius:16px;padding:12px;display:flex;flex-direction:column;gap:8px;box-shadow:0 2px 6px rgba(30,40,90,.04)}' +
      '.can-card .can-foto{display:block;width:100%;height:120px;object-fit:contain;background:#fff;border-radius:12px;border:1px solid rgba(80,90,130,.10);cursor:pointer}' +
      '.can-card .can-num{font-size:10px;font-weight:900;color:#fff;background:#0284c7;border-radius:6px;padding:2px 7px;align-self:flex-start}' +
      '.can-card h3{margin:0;font-size:13.5px;font-weight:800;color:#23233a;line-height:1.3}' +
      '.can-card .can-sku{font-size:11px;color:#8a8a99;font-weight:700}' +
      '.can-tags{display:flex;gap:5px;flex-wrap:wrap}' +
      '.can-tags i{font-style:normal;font-size:10.5px;font-weight:800;color:#0b5878;background:rgba(91,141,239,.10);border-radius:6px;padding:2px 6px}' +
      '.can-actions{display:flex;gap:6px;margin-top:auto}' +
      '.can-actions button{flex:1;border:none;border-radius:9px;padding:8px 6px;font:inherit;font-size:11.5px;font-weight:800;cursor:pointer;color:#fff;background:linear-gradient(135deg,#0b5878,#3ad0a4)}' +
      '.can-actions button.ghost{background:#fff;color:#0284c7;border:1px solid rgba(2,132,199,.35)}' +
      '.can-actions a{flex:1;text-align:center;text-decoration:none;border-radius:9px;padding:8px 6px;font-size:11.5px;font-weight:800;color:#fff;background:linear-gradient(135deg,#25d366,#128c7e)}' +
      '.can-vacio{padding:26px 12px;text-align:center;color:#8a8a99;font-size:13px;background:rgba(255,255,255,.6);border-radius:14px}' +
      '.can-reiniciar{border:none;background:none;color:#0284c7;font:inherit;font-size:12px;font-weight:800;cursor:pointer;text-decoration:underline}' +
      '.can-modal-overlay{position:fixed;inset:0;background:rgba(10,16,34,.62);z-index:260;display:flex;align-items:center;justify-content:center;padding:18px;backdrop-filter:blur(3px)}' +
      '.can-modal-overlay[hidden]{display:none}' +
      '.can-modal{position:relative;background:#fff;border-radius:18px;max-width:640px;width:100%;max-height:88vh;overflow:auto;padding:16px;box-shadow:0 22px 60px rgba(0,0,0,.35)}' +
      '.can-modal .can-close{position:absolute;top:10px;right:10px;border:none;background:rgba(120,130,170,.14);color:#3a3a48;width:32px;height:32px;border-radius:50%;font-size:15px;cursor:pointer;z-index:2}' +
      '.can-modal img.rel{width:100%;max-height:62vh;object-fit:contain}' +
      '.can-modal .cap{font-size:12px;color:#5a5b6b;font-weight:700;margin-top:8px;text-align:center}' +
      '.can-pdf-tool{margin-bottom:9px;display:flex;justify-content:flex-end}' +
      '.can-pdf-tool a{font-size:12px;font-weight:800;color:#0284c7;text-decoration:none}' +
      '#canPdfFrame{width:100%;height:68vh;border:1px solid rgba(80,90,130,.14);border-radius:10px;background:#fff}' +
      'body.dark .can-card{background:#1f2031;border-color:rgba(255,255,255,.09)}' +
      'body.dark .can-card h3{color:#e6e7f0}' +
      'body.dark .can-chip{background:#2a2c42;color:#cfd0dd;border-color:rgba(255,255,255,.10)}' +
      'body.dark .can-intro{background:rgba(31,32,49,.74);color:#c9cad6;border-color:rgba(255,255,255,.08)}' +
      'body.dark .can-search{background:#2a2c42;color:#e6e7f0;border-color:rgba(255,255,255,.10)}' +
      'body.dark .can-vacio{background:rgba(31,32,49,.6);color:#9a9bae}' +
      'body.dark .can-modal{background:#1f2031}' +
      'body.dark .can-modal .cap{color:#c9cad6}' +
      'body.dark .can-sku{color:#9a9bae}';
    var st = document.createElement('style');
    st.id = ESTILOS_ID;
    st.textContent = css;
    document.head.appendChild(st);
  }

  function esc(s){
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function fotoDe(sku){
    return sku ? ('catalogo-img/' + sku + '.png') : '';
  }

  function normQuitar(s){
    return String(s || '').replace(/^\(?\s*(?:•\s*)?\d+\)?\s*/, '').replace(/ADAPT\.\s*/i,'').trim();
  }

  function tipoLabel(t){
    var map = { hembra:'Hembra', macho:'Macho', 'h-h':'Hembra-hembra', 'm-m':'Macho-macho', 'h-m':'Hembra-macho', 'm-h':'Macho-hembra', presion:'A presión' };
    return map[t] || '';
  }

  function clasificarUso(item){
    var f = item.f || [];
    if (f.indexOf('ducha') !== -1) return 'ducha';
    if (f.indexOf('lavarropas') !== -1) return 'lavarropas';
    if (f.indexOf('hidrometro') !== -1 || f.indexOf('manometro') !== -1) return 'medidores';
    if (item.t === 'presion' || f.indexOf('mariposa') !== -1 || f.indexOf('universal') !== -1 || f.indexOf('rectangular') !== -1 || f.indexOf('ovalado') !== -1) return 'presion';
    if (item.t === '' && f.indexOf('especial') === -1 && f.indexOf('racor') === -1 && f.indexOf('aireador') === -1 && f.indexOf('multiple') === -1 && f.indexOf('pasoFino') === -1 && f.indexOf('unimix') === -1 && f.indexOf('swingPlus') === -1) return 'canilla';
    return 'especial';
  }

  var USOS = [
    { id:'canilla', ico:'🚰', label:'Canilla / grifería' },
    { id:'ducha', ico:'🚿', label:'Ducha' },
    { id:'presion', ico:'🤏', label:'A presión, sin rosca' },
    { id:'lavarropas', ico:'🧺', label:'Lavarropas' },
    { id:'medidores', ico:'📟', label:'Hidrómetro / manómetro' },
    { id:'especial', ico:'🔧', label:'Otros / especiales' }
  ];

  function pasar(item, k){
    if (k === 'uso') return !estado.uso || clasificarUso(item) === estado.uso;
    if (k === 'tipo') return !estado.tipo || (item.t || '') === estado.tipo;
    if (k === 'medida') return !estado.medida || (item.m || 'sin medida') === estado.medida;
    return true;
  }

  function filtrados(){
    var q = (estado.q || '').trim().toLowerCase();
    return (CAT || []).filter(function(it){
      if (!pasar(it, 'uso')) return false;
      if (!pasar(it, 'tipo')) return false;
      if (!pasar(it, 'medida')) return false;
      if (q){
        var hay = false;
        if (it.num && it.num.toLowerCase().indexOf(q) !== -1) hay = true;
        if (it.n && String(it.n).toLowerCase().indexOf(q) !== -1) hay = true;
        if (it.sku && String(it.sku).indexOf(q) !== -1) hay = true;
        if (!hay) return false;
      }
      return true;
    });
  }

  function unicos(items, k){
    var out = [];
    items.forEach(function(it){
      var v = k === 'tipo' ? (it.t || '') : (it.m || 'sin medida');
      if (v && out.indexOf(v) === -1) out.push(v);
    });
    var orden = [];
    if (k === 'tipo') orden = ['hembra','macho','h-h','m-m','h-m','m-h','presion'];
    if (k === 'medida'){
      orden = out.slice().sort(function(a,b){ return a.localeCompare(b, 'es', {numeric:true}); });
    }
    return orden.filter(function(v){ return out.indexOf(v) !== -1; }).concat(out.filter(function(v){ return orden.indexOf(v) === -1; }));
  }

  function chipHtml(val, label, key, activo){
    return '<button type="button" class="can-chip' + (activo ? ' sel' : '') + '" data-can-f="' + key + '" data-can-v="' + esc(val) + '">' + esc(label) + '</button>';
  }

  function tarjetaHtml(it){
    var tags = [];
    if (it.num) tags.push('Nº ' + esc(it.num));
    var tl = tipoLabel(it.t);
    if (tl) tags.push(tl);
    if (it.m) tags.push(esc(it.m));
    (it.nt || []).forEach(function(t){ tags.push(esc(t)); });
    var foto = fotoDe(it.sku);
    var nombre = normQuitar(it.n);
    var actions = '';
    if (foto) actions += '<button type="button" data-can-foto="' + esc(foto) + '" data-can-cap="' + esc(nombre + (it.num ? ' · Nº ' + it.num : '')) + '">🔍 Foto</button>';
    if (it.sku) actions += '<button type="button" class="ghost" data-can-guia>📖 En la guía</button>';
    actions += '<a href="https://wa.me/?text=' + encodeURIComponent('APPI · ¿Me pasás el ' + it.n + (it.num ? ' (Nº ' + it.num + ')' : '') + '? SKU ' + it.sku) + '" target="_blank" rel="noopener">💬 WhatsApp</a>';
    return '<article class="can-card">' +
      (foto ? '<img class="can-foto" loading="lazy" src="' + esc(foto) + '" alt="' + esc(nombre) + '" data-can-foto="' + esc(foto) + '" data-can-cap="' + esc(nombre + (it.num ? ' · Nº ' + it.num : '')) + '">' : '') +
      '<div class="can-tags">' + tags.map(function(t){ return '<i>' + t + '</i>'; }).join('') + '</div>' +
      '<h3>' + esc(nombre) + '</h3>' +
      (it.sku ? '<div class="can-sku">SKU ' + esc(it.sku) + '</div>' : '') +
      '<div class="can-actions">' + actions + '</div>' +
      '</article>';
  }

  function pasoUsoHTML(){
    return '<div class="can-paso"><em>1</em> ¿Qué vas a conectar?</div>' +
      '<div class="can-chips">' +
      USOS.map(function(u){
        return chipHtml(u.id, u.ico + ' ' + u.label, 'uso', estado.uso === u.id);
      }).join('') +
      '</div>';
  }

  function pasoComunHTML(app){
    var restantes = filtrados();
    var vals = unicos(restantes, app);
    if (vals.length <= 1 && !estado[app]) return '';
    var label = app === 'tipo' ? '¿La boca es?' : '¿Medida?';
    var n = app === 'tipo' ? 2 : 3;
    var chips = vals.map(function(v){
      var lb = app === 'tipo' ? tipoLabel(v) : v;
      if (!lb) lb = v;
      return chipHtml(v, lb, app, estado[app] === v);
    }).join('');
    chips += '<button type="button" class="can-chip saltar" data-can-f="' + app + '" data-can-v="__skip__">No la sé · ver todo</button>';
    return '<div class="can-paso"><em>' + n + '</em> ' + label + '</div><div class="can-chips">' + chips + '</div>';
  }

  function render(){
    var cont = document.getElementById('canillasCont');
    if (!cont) return;
    var lista = filtrados();
    var aplicados = [];
    if (estado.uso) aplicados.push({ k:'uso', v:estado.uso, lb:(USOS.filter(function(u){return u.id===estado.uso;})[0]||{}).label || estado.uso });
    if (estado.tipo) aplicados.push({ k:'tipo', v:estado.tipo, lb:tipoLabel(estado.tipo) || estado.tipo });
    if (estado.medida) aplicados.push({ k:'medida', v:estado.medida, lb:estado.medida });
    var selHtml = aplicados.length
      ? '<div class="can-selecs">' + aplicados.map(function(a){ return '<span data-can-f="' + a.k + '" data-can-v="">✕ ' + esc(a.lb) + '</span>'; }).join('') +
        ' <button type="button" class="can-reiniciar" data-can-reset>Reiniciar</button></div>'
      : '';
    var resultado;
    if (lista.length === 0){
      resultado = '<div class="can-vacio">No encontré un modelo con esos datos.<br/><button type="button" class="can-reiniciar" data-can-reset>Empecemos de nuevo</button></div>';
    } else if (lista.length <= 14){
      resultado = '<div class="can-paso"><em>✔</em> Resultado · ' + lista.length + ' pieza' + (lista.length === 1 ? '' : 's') + '</div>' +
        '<div class="can-cards">' + lista.map(tarjetaHtml).join('') + '</div>';
    } else {
      resultado = '<div class="can-vacio">Seguí afinando las opciones: ' + lista.length + ' piezas coinciden.</div>';
    }
    cont.innerHTML =
      '<div class="can-intro">Identificá la pieza por sus características: boca(<b>hembra/macho</b>) y <b>medida</b> te dejan en el modelo justo de la <b>Guía V02-21</b>. Con el número de ítem o el nombre podés buscarlo directo.</div>' +
      '<div class="can-barra">' +
      (aplicados.length ? '<button type="button" class="can-reiniciar" data-can-reset>↺ Reiniciar</button>' : '') +
      '<input id="canillasSearch" class="can-search" type="search" placeholder="Buscar por nombre, ítem o SKU…" value="' + esc(estado.q) + '">' +
      '<span class="can-count">' + lista.length + ' / ' + (CAT ? CAT.length : 0) + '</span>' +
      '</div>' +
      selHtml +
      '<div id="canillasPasos">' +
      pasoUsoHTML() + pasoComunHTML('tipo') + pasoComunHTML('medida') +
      resultado +
      '</div>';
    var q = document.getElementById('canillasSearch');
    if (q) q.addEventListener('input', function(){ estado.q = q.value; render(); });
  }

  function enganchar(){
    var cont = document.getElementById('canillasCont');
    if (!cont || cont._canillasEnganchado) return;
    cont._canillasEnganchado = true;
    cont.addEventListener('click', function(e){
      var chip = e.target.closest('[data-can-f]');
      if (chip){
        var k = chip.getAttribute('data-can-f');
        var v = chip.getAttribute('data-can-v');
        estado[k] = (v === '__skip__' || v === '') ? null : v;
        render();
        return;
      }
      var reset = e.target.closest('[data-can-reset]');
      if (reset){
        estado.uso = estado.tipo = estado.medida = null; estado.q = '';
        render();
        return;
      }
      var foto = e.target.closest('[data-can-foto]');
      if (foto){
        openCanillasFoto(foto.getAttribute('data-can-foto'), foto.getAttribute('data-can-cap') || '');
        return;
      }
      var guia = e.target.closest('[data-can-guia]');
      if (guia){
        openCanillasGuia();
      }
    });
  }

  function montarModales(){
    if (document.getElementById('canImgModal')) return;
    var body = document.body;
    var img = document.createElement('div');
    img.className = 'can-modal-overlay';
    img.id = 'canImgModal';
    img.hidden = true;
    img.setAttribute('aria-hidden', 'true');
    img.innerHTML = '<div class="can-modal">' +
      '<button type="button" class="can-close" data-can-close aria-label="Cerrar">✕</button>' +
      '<img id="canImgModalImg" class="rel" alt="Foto del modelo">' +
      '<div id="canImgModalCap" class="cap"></div>' +
      '</div>';
    var pdf = document.createElement('div');
    pdf.className = 'can-modal-overlay';
    pdf.id = 'canPdfModal';
    pdf.hidden = true;
    pdf.setAttribute('aria-hidden', 'true');
    pdf.innerHTML = '<div class="can-modal">' +
      '<button type="button" class="can-close" data-can-close aria-label="Cerrar">✕</button>' +
      '<div class="can-pdf-tool"><a id="canPdfAbrir" target="_blank" rel="noopener">Abrir la guía en una pestaña ↗</a></div>' +
      '<iframe id="canPdfFrame" src="' + esc(GIA_PDF) + '" title="Guía de canillas y adaptadores"></iframe>' +
      '</div>';
    body.appendChild(img);
    body.appendChild(pdf);
    img.addEventListener('click', function(e){
      if (!e.target.closest('.can-modal') || e.target.closest('[data-can-close]')) canillasCloseModal();
    });
    pdf.addEventListener('click', function(e){
      if (!e.target.closest('.can-modal') || e.target.closest('[data-can-close]')) canillasCloseModal();
    });
    var pa = document.getElementById('canPdfAbrir');
    if (pa) pa.href = GIA_PDF;
  }

  function canillasCloseModal(){
    var abiertos = document.querySelectorAll('.can-modal-overlay:not([hidden])');
    abiertos.forEach(function(m){ m.hidden = true; m.setAttribute('aria-hidden', 'true'); });
    if (abiertos.length){
      try { document.body.style.overflow = ''; } catch (e) {}
      if (window.liberarScrollCuerpo){ try { window.liberarScrollCuerpo(); } catch (e) {} }
    }
  }

  function bloquearScroll(){
    try { document.body.style.overflow = 'hidden'; } catch (e) {}
  }

  function openCanillasFoto(src, cap){
    montarModales();
    var m = document.getElementById('canImgModal');
    var img = document.getElementById('canImgModalImg');
    if (img) img.src = src;
    var c = document.getElementById('canImgModalCap');
    if (c) c.textContent = cap || '';
    if (m){ m.hidden = false; m.setAttribute('aria-hidden', 'false'); bloquearScroll(); }
  }

  function openCanillasGuia(){
    montarModales();
    var m = document.getElementById('canPdfModal');
    var pa = document.getElementById('canPdfAbrir');
    if (pa) pa.href = GIA_PDF;
    if (m){ m.hidden = false; m.setAttribute('aria-hidden', 'false'); bloquearScroll(); }
  }

  window.canillasCloseModal = canillasCloseModal;
  window.openCanillasFoto = openCanillasFoto;
  window.openCanillasGuia = openCanillasGuia;

  function desdeCatalogo(j){
    var prods = (j && j.productos) || [];
    var interes = /ADAPT\.|KIT ADAPT|ARANDELA ADAPTADOR|BUJE|PROLONGADOR|SET ADAPTACION|LAP |LLAVE DE CORTE|LLAVE DE AJUSTE|REGULADOR DE CAUDAL|VARILLA INST|CONECTOR RAPIDO|TE C\/LLAVE DE CORTE/i;
    var out = [];
    prods.forEach(function(p){
      if (!p || !p.nombre || !interes.test(p.nombre)) return;
      var n = String(p.nombre).replace(/\s+/g, ' ').trim();
      var num = (n.match(/^\(?\s*(?:•\s*)?(\d+)\)?\s/) || [])[1] || '';
      var up = n.toUpperCase();
      var f = [];
      if (/DUCHA/.test(up)) f.push('ducha');
      if (/LAVARROPA|LAVARROPAS/.test(up)) f.push('lavarropas');
      if (/HIDROMET/.test(up)) f.push('hidrometro');
      if (/MANOMETRO/.test(up)) f.push('manometro');
      if (/TIPO PATIO/.test(up)) f.push('patio');
      if (/PIAZZA/.test(up)) f.push('piazza');
      if (/UNIMIX/.test(up)) f.push('unimix');
      if (/UNIVERSAL/.test(up)) f.push('universal');
      if (/MARIPOSA/.test(up)) f.push('mariposa');
      if (/SWING PLUS/.test(up)) f.push('swingPlus');
      if (/RACOR/.test(up)) f.push('racor');
      if (/AIREADOR/.test(up)) f.push('aireador');
      if (/RECTANGULAR/.test(up)) f.push('rectangular');
      if (/OVALADO/.test(up)) f.push('ovalado');
      if (/BAJO MESADA/.test(up)) f.push('bajoMesada');
      if (/GRIFER|BICOMANDO/.test(up)) f.push('griferia');
      if (/DISPENSER/.test(up)) f.push('dispenser');
      if (/ECO-D/.test(up)) f.push('ecod');
      if (/COCODRILO|CROCODILO/.test(up)) f.push('cocodrilo');
      if (/PASO FINO/.test(up)) f.push('pasoFino');
      if (/MULTIPLE|MÚLTIPLE/.test(up)) f.push('multiple');
      if (/ESPECIAL/.test(up)) f.push('especial');
      var t = '';
      if (/\bH-M\b/.test(up)) t = 'h-m';
      else if (/\bM-H\b/.test(up)) t = 'm-h';
      else if (/\bM-M\b/.test(up)) t = 'm-m';
      else if (/\bH-H\b/.test(up) || /HEMBRA-HEMBRA/.test(up)) t = 'h-h';
      else if (/HEMBRA/.test(up)) t = 'hembra';
      else if (/MACHO/.test(up)) t = 'macho';
      else if (up.indexOf('ROSCA H ') === 0 || /(^|\s)H\s?\d{1,2}[,.]\d\s*X/.test(up)) t = 'hembra';
      if (/MARIPOSA|UNIVERSAL|RECTANGULAR|OVALADO|BAJA PRESION/.test(up) && !t) t = 'presion';
      var m = '';
      var x1 = up.match(/(\d+(?:[,.]\d+)?)\s*[Xx]\s*1\b/);
      if (x1) m = x1[1].replace(',', '.') + 'x1';
      else {
        var di = up.match(/DI(?:Á|A|É)?M\.?\s*(\d+(?:[,.]\d+)?)/);
        if (di) m = 'diam ' + di[1].replace(',', '.');
      }
      if (/\b3\/4\b/.test(up)) m = '3/4';
      if (/14 HILOS/.test(up)) m = '14 hilos';
      if (/M\s*24\s*[Xx]\s*1/.test(up)) m = 'M24x1';
      var nt = [];
      if (/LARGO/.test(up)) nt.push('largo');
      if (/CORTO/.test(up)) nt.push('corto');
      if (/CROMADO/.test(up)) nt.push('cromado');
      if (/TUERCA/.test(up)) nt.push('con tuerca');
      if (/ORING/.test(up)) nt.push('con oring');
      if (/POLI/.test(up)) nt.push('poli');
      if (/NERO/.test(up)) nt.push('nero');
      if (/S-1000/.test(up)) nt.push('s-1000');
      if (/F\.?V/.test(up)) nt.push('fv');
      if (/BG\b/.test(up)) nt.push('bg');
      out.push({
        num: num,
        n: n.replace(/^\(?\s*(?:•\s*)?\d+\)?\s*/, '').trim(),
        sku: String(p.sku || ''),
        f: f,
        t: t,
        m: m,
        nt: nt
      });
    });
    if (!out.length) return null;
    return out;
  }

  function cargar(){
    if (CAT) return Promise.resolve(CAT);
    if (!window.fetch) { CAT = FALLBACK; return Promise.resolve(CAT); }
    return fetch('./psa-catalogo.json?can=' + Date.now()).then(function(r){
      if (!r.ok) return Promise.reject(new Error('http ' + r.status));
      return r.json();
    }).then(function(j){
      var d = desdeCatalogo(j);
      CAT = d || FALLBACK;
      return CAT;
    }).catch(function(){
      CAT = FALLBACK;
      return CAT;
    });
  }

  function openCanillas(){
    if (typeof showView === 'function') showView('view-canillas');
    inyectarEstilos();
    montarModales();
    enganchar();
    var cont = document.getElementById('canillasCont');
    if (cont && !cont.innerHTML){
      cont.innerHTML = '<div class="can-vacio">Cargando catálogo…</div>';
    }
    var btnHelp = document.getElementById('btnHelpCanillas');
    if (btnHelp) btnHelp.onclick = function(){ openCanillasGuia(); };
    cargar().then(render);
  }

  window.openCanillas = openCanillas;

  if (document.readyState !== 'loading'){
    var btn2 = document.getElementById('btnHelpCanillas');
    if (btn2) btn2.onclick = function(){ openCanillasGuia(); };
  } else {
    document.addEventListener('DOMContentLoaded', function(){
      var btn3 = document.getElementById('btnHelpCanillas');
      if (btn3) btn3.onclick = function(){ openCanillasGuia(); };
    });
  }
})();