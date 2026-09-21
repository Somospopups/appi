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

  var ESTILOS_ID = 'canillasEstilosV941';
  var GIA_PDF = './guia-adaptadores-psa.pdf';
  var CAT = null;
  var DECK = { items: [], idx: 0, q: '', aiSku: null };
  var ID = { dataUrl: null, nombre: '', buscando: false, res: null, refs: null };
  var TESE_OPTS = {
    workerPath: './vendor/tesseract/worker.min.js',
    corePath: './vendor/tesseract/tesseract-core-simd-lstm.wasm.js',
    langPath: './vendor/tesseract/',
    gzip: false
  };

  function inyectarEstilos(){
    if (document.getElementById(ESTILOS_ID)) return;
    var css = '' +
      '#canillasCont{display:flex;flex-direction:column;gap:14px;padding:14px;padding-bottom:34px;max-width:980px;margin:0 auto}' +
      '.can-cols{display:flex;flex-direction:column;gap:14px}' +
      '@media(min-width:820px){.can-cols{flex-direction:row;align-items:flex-start}.can-idpanel{flex:0 0 300px;position:sticky;top:10px}.can-deckcol{flex:1;min-width:0}}' +
      '.can-idpanel{display:flex;flex-direction:column;gap:12px;background:rgba(255,255,255,.82);border:1px solid rgba(80,90,130,.13);border-radius:20px;padding:16px;box-shadow:0 8px 24px rgba(30,40,90,.06);min-height:320px}' +
      '.can-idhead{display:flex;align-items:center;justify-content:space-between;gap:8px}' +
      '.can-idtag{font-size:10px;font-weight:900;letter-spacing:1.2px;color:#0b5878;text-transform:uppercase}' +
      '.can-cambia{border:none;background:none;font:inherit;font-size:11.5px;font-weight:800;color:#0284c7;cursor:pointer;text-decoration:underline;display:none}' +
      '.can-cambia.on{display:inline-block}' +
      '.can-idhero{display:flex;flex-direction:column;gap:8px;align-items:center;text-align:center}' +
      '.can-idi{width:64px;height:64px;border-radius:20px;background:linear-gradient(135deg,#0284c7,#38bdf8);display:grid;place-items:center;font-size:30px;color:#fff;box-shadow:0 10px 22px rgba(2,132,199,.30)}' +
      '.can-idhero strong{font-size:15px;color:#23233a}' +
      '.can-idhero p{margin:0;font-size:12px;color:#5a5b6b;line-height:1.5}' +
      '.can-idacc{display:flex;flex-direction:column;gap:8px;width:100%}' +
      '.can-idacc button{border:none;border-radius:12px;padding:11px 12px;font:inherit;font-size:13px;font-weight:800;cursor:pointer;color:#fff;background:linear-gradient(135deg,#0284c7,#38bdf8);display:flex;align-items:center;justify-content:center;gap:8px}' +
      '.can-idacc button.sec{background:#fff;color:#0b5878;border:1px solid rgba(2,132,199,.32)}' +
      '.can-idpre{position:relative;border-radius:16px;overflow:hidden;border:1px solid rgba(80,90,130,.14);background:#fff;box-shadow:0 8px 20px rgba(30,40,90,.10)}' +
      '.can-idpre img{width:100%;max-height:170px;object-fit:contain;display:block}' +
      '.can-idest{display:flex;flex-direction:column;gap:9px;align-items:center;text-align:center}' +
      '.can-idest strong{color:#23233a;font-size:14px}' +
      '.can-msg{margin:0;font-size:12px;color:#7a7b8b;line-height:1.45}' +
      '.can-spin{width:24px;height:24px;border:3px solid rgba(91,141,239,.25);border-top-color:#5b8def;border-radius:50%;animation:canSpin .8s linear infinite}' +
      '@keyframes canSpin{to{transform:rotate(360deg)}}' +
      '.can-match{background:linear-gradient(135deg,rgba(22,135,101,.10),rgba(58,208,164,.14));border:1px solid rgba(22,135,101,.35);border-radius:16px;padding:12px;display:flex;flex-direction:column;gap:6px;align-items:center;text-align:center}' +
      '.can-match .can-mlabel{font-size:10px;font-weight:900;letter-spacing:1px;color:#168765;text-transform:uppercase}' +
      '.can-match b{color:#23233a;font-size:14px;line-height:1.35}' +
      '.can-match .can-mnum{font-size:11px;font-weight:900;color:#fff;background:#168765;border-radius:8px;padding:3px 9px}' +
      '.can-match .can-mpct{font-size:11px;font-weight:800;color:#168765}' +
      '.can-nomatch{background:rgba(195,76,83,.08);border:1px solid rgba(195,76,83,.30);border-radius:16px;padding:12px;display:flex;flex-direction:column;gap:6px;align-items:center;text-align:center}' +
      '.can-nomatch strong{color:#c34c53;font-size:13.5px}' +
      '.can-deckhead{display:flex;align-items:center;justify-content:space-between;gap:8px}' +
      '.can-decktitle{font-size:13px;font-weight:900;color:#0b5878;letter-spacing:.4px;text-transform:uppercase}' +
      '.can-decktitle small{font-weight:700;color:#8a8a99;letter-spacing:.2px}' +
      '.can-guialink{border:none;background:none;font:inherit;font-size:12px;font-weight:800;color:#0284c7;cursor:pointer;text-decoration:underline}' +
      '.can-deckbar{display:flex;gap:8px;align-items:center}' +
      '.can-decksearch{flex:1;min-width:0;padding:9px 12px;border-radius:12px;border:1px solid rgba(80,90,130,.18);background:rgba(255,255,255,.85);font:inherit;font-size:13px;outline:none}' +
      '.can-deckwrap{position:relative;min-height:400px;margin-top:10px}' +
      '.can-deck{position:absolute;inset:0;touch-action:pan-y;user-select:none;-webkit-user-select:none;transform-origin:50% 100%}' +
      '.can-carta{position:absolute;inset:0;border-radius:24px;overflow:hidden;display:flex;flex-direction:column;background:#fff;border:1px solid rgba(80,90,130,.16);box-shadow:0 18px 44px rgba(20,30,70,.14)}' +
      '.can-carta .can-cfoto{flex:1;min-height:0;display:grid;place-items:center;padding:18px;background:linear-gradient(160deg,#f6f9ff,#eef2fb)}' +
      '.can-carta .can-cfoto img{max-width:100%;max-height:100%;object-fit:contain}' +
      '.can-carta .can-cfoto .can-sinfoto{font-size:34px;opacity:.45}' +
      '.can-carta .can-cdato{display:flex;flex-direction:column;gap:7px;padding:14px 16px 16px}' +
      '.can-carta h3{margin:0;font-size:15px;font-weight:800;color:#23233a;line-height:1.3}' +
      '.can-csoku{font-size:11px;color:#8a8a99;font-weight:700}' +
      '.can-tags{display:flex;gap:5px;flex-wrap:wrap}' +
      '.can-tags i{font-style:normal;font-size:10.5px;font-weight:800;color:#0b5878;background:rgba(91,141,239,.10);border-radius:6px;padding:2px 6px}' +
      '.can-psa{font-size:12px;font-weight:900;color:#0284c7}' +
      '.can-ai{display:flex;align-items:center;gap:6px;font-size:11.5px;font-weight:900;color:#fff;background:linear-gradient(135deg,#4f7df9,#168765);border-radius:999px;padding:6px 12px;align-self:center;margin-top:12px;box-shadow:0 6px 16px rgba(79,125,249,.35)}' +
      '.can-acciones{display:flex;gap:6px;margin-top:2px}' +
      '.can-acciones button,.can-acciones a{flex:1;border:none;border-radius:10px;padding:9px 6px;font:inherit;font-size:11.5px;font-weight:800;cursor:pointer;color:#fff;background:linear-gradient(135deg,#0b5878,#3ad0a4);text-decoration:none;text-align:center}' +
      '.can-acciones button.ghost{background:#fff;color:#0284c7;border:1px solid rgba(2,132,199,.35)}' +
      '.can-peek{transform:translateY(16px) scale(.96);opacity:.45;filter:blur(1.4px);pointer-events:none}' +
      '.can-deckvacio{padding:34px 14px;text-align:center;color:#8a8a99;font-size:13px;background:rgba(255,255,255,.6);border-radius:16px}' +
      '.can-deckvacio button{border:none;background:none;color:#0284c7;font:inherit;font-size:12px;font-weight:800;cursor:pointer;text-decoration:underline}' +
      '.can-decknav{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:12px;padding:0 4px}' +
      '.can-decknav button{border:none;border-radius:50%;width:40px;height:40px;font-size:16px;cursor:pointer;color:#fff;background:linear-gradient(135deg,#0284c7,#38bdf8);display:grid;place-items:center}' +
      '.can-decknav span{font-size:13px;font-weight:900;color:#0b5878}' +
      '.can-modal-overlay{position:fixed;inset:0;background:rgba(10,16,34,.62);z-index:260;display:flex;align-items:center;justify-content:center;padding:18px;backdrop-filter:blur(3px)}' +
      '.can-modal-overlay[hidden]{display:none}' +
      '.can-modal{position:relative;background:#fff;border-radius:18px;max-width:640px;width:100%;max-height:88vh;overflow:auto;padding:16px;box-shadow:0 22px 60px rgba(0,0,0,.35)}' +
      '.can-modal .can-close{position:absolute;top:10px;right:10px;border:none;background:rgba(120,130,170,.14);color:#3a3a48;width:32px;height:32px;border-radius:50%;font-size:15px;cursor:pointer;z-index:2}' +
      '.can-modal img.rel{width:100%;max-height:62vh;object-fit:contain}' +
      '.can-modal .cap{font-size:12px;color:#5a5b6b;font-weight:700;margin-top:8px;text-align:center}' +
      '.can-pdf-tool{margin-bottom:9px;display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:12px;font-weight:900;color:#0b5878}' +
      '.can-pdf-tool a{font-size:12px;font-weight:800;color:#0284c7;text-decoration:none}' +
      '#canPdfFrame{width:100%;height:68vh;border:1px solid rgba(80,90,130,.14);border-radius:10px;background:#fff}' +
      'body.dark .can-idpanel{background:rgba(31,32,49,.82);border-color:rgba(255,255,255,.09)}' +
      'body.dark .can-idtag{color:#3ad0a4}' +
      'body.dark .can-idhero strong{color:#f0f0f5}' +
      'body.dark .can-idhero p{color:#a0a0b0}' +
      'body.dark .can-idest strong{color:#f0f0f5}' +
      'body.dark .can-msg{color:#9a9aaa}' +
      'body.dark .can-idpre{background:#2a2c42}' +
      'body.dark .can-idacc button.sec{background:#2a2c42;color:#a0e6d0;border-color:rgba(255,255,255,.16)}' +
      'body.dark .can-carta{background:#1f2031;border-color:rgba(255,255,255,.09)}' +
      'body.dark .can-carta .can-cfoto{background:linear-gradient(160deg,#23243a,#2a2c42)}' +
      'body.dark .can-carta h3{color:#e6e7f0}' +
      'body.dark .can-csoku{color:#9a9bae}' +
      'body.dark .can-decksearch{background:#2a2c42;color:#e6e7f0;border-color:rgba(255,255,255,.10)}' +
      'body.dark .can-decktitle{color:#b8c8ff}' +
      'body.dark .can-decknav span{color:#b8c8ff}' +
      'body.dark .can-deckvacio{background:rgba(31,32,49,.6);color:#9a9bae}' +
      'body.dark .can-match b{color:#f0f0f5}' +
      'body.dark .can-modal{background:#1f2031}' +
      'body.dark .can-modal .cap{color:#c9cad6}' +
      'body.dark .can-pdf-tool{color:#b8c8ff}' +
      'body.dark .can-guialink{color:#8ab4f8}';
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
    return String(s || '').replace(/^\(?\s*(?:•\s*)?\d+\)?\s*/, '').replace(/ADAPT\.\s*/i,'').replace(/ADAPTADOR\s+/i,'').trim();
  }

  function tipoLabel(t){
    var map = { hembra:'Hembra', macho:'Macho', 'h-h':'Hembra-hembra', 'm-m':'Macho-macho', 'h-m':'Hembra-macho', 'm-h':'Macho-hembra', presion:'A presión' };
    return map[t] || '';
  }

  function tagsDe(it){
    var tags = [];
    if (it.num) tags.push('Nº ' + esc(it.num));
    var tl = tipoLabel(it.t);
    if (tl) tags.push(tl);
    if (it.m) tags.push(esc(it.m));
    (it.nt || []).forEach(function(t){ tags.push(esc(t)); });
    return tags;
  }

  function dHashBits(im){
    var cw = 9, ch = 8;
    var c = document.createElement('canvas');
    c.width = cw; c.height = ch;
    var x = c.getContext('2d');
    x.drawImage(im, 0, 0, cw, ch);
    var d = x.getImageData(0, 0, cw, ch).data;
    var gris = [];
    for (var y = 0; y < ch; y++){
      for (var x2 = 0; x2 < cw; x2++){
        var i = (y * cw + x2) * 4;
        gris.push((d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) | 0);
      }
    }
    var bits = '';
    for (var y2 = 0; y2 < ch; y2++){
      for (var x3 = 1; x3 < cw; x3++){
        bits += gris[y2 * cw + x3] >= gris[y2 * cw + x3 - 1] ? '1' : '0';
      }
    }
    return bits;
  }

  function hamming(a, b){
    var d = 0;
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
    return d;
  }

  function cargarImagen(src){
    return new Promise(function(res, rej){
      var im = new Image();
      im.onload = function(){ res(im); };
      im.onerror = function(){ rej(new Error('img')); };
      im.src = src;
    });
  }

  function obtenerRefHashes(){
    if (ID.refs) return Promise.resolve(ID.refs);
    var pendientes = (CAT || []).filter(function(it){ return it.sku; }).map(function(it){ return it.sku; });
    var refs = {};
    var next = function(){
      if (!pendientes.length){
        ID.refs = refs;
        return Promise.resolve(ID.refs);
      }
      var sku = pendientes.shift();
      return cargarImagen(fotoDe(sku)).then(function(im){
        refs[sku] = dHashBits(im);
      }, function(){ return null; }).then(next);
    };
    return next();
  }

  function ocrDe(dataUrl){
    if (!window.Tesseract || typeof window.Tesseract.recognize !== 'function') return Promise.resolve('');
    return Promise.race([
      window.Tesseract.recognize(dataUrl, 'eng', TESE_OPTS).then(function(r){
        return (r && (r.text || (r.data && r.data.text))) ? String(r.text || r.data.text) : '';
      }),
      new Promise(function(res){ setTimeout(function(){ res(''); }, 30000); })
    ]).catch(function(){ return ''; });
  }

  function puntuarTexto(txt, it){
    var s = 0;
    if (!txt) return s;
    var up = ' ' + txt.toUpperCase().replace(/\s+/g, ' ') + ' ';
    if (it.num && up.indexOf(it.num) !== -1) s += 50;
    if (it.sku && up.indexOf(it.sku) !== -1) s += 50;
    if (it.sku && it.sku.length >= 6 && up.indexOf(it.sku.slice(0, 6)) !== -1) s += 20;
    (normQuitar(it.n).split(' ') || []).forEach(function(w){
      if (w.length >= 4 && up.indexOf(w.toUpperCase()) !== -1) s += 5;
    });
    if (s > 100) s = 100;
    return s;
  }

  function compararConGuia(txt){
    var items = CAT || [];
    var mapa = {};
    items.forEach(function(it){
      mapa[it.sku || ('k' + it.n)] = { it: it, ocr: puntuarTexto(txt, it), img: 0, s: 0 };
    });
    return obtenerRefHashes().then(function(hashes){
      return cargarImagen(ID.dataUrl).then(function(im){
        var bits = dHashBits(im);
        Object.keys(mapa).forEach(function(k){
          var e = mapa[k];
          var ref = e.it.sku && hashes[e.it.sku] !== undefined ? hashes[e.it.sku] : null;
          e.img = ref === null ? 0 : Math.max(0, Math.round(100 * (1 - hamming(bits, ref) / 64)));
          e.s = e.ocr + e.img;
        });
      }, function(){
        Object.keys(mapa).forEach(function(k){
          var e = mapa[k];
          e.img = 0;
          e.s = e.ocr;
        });
      });
    }).then(function(){
      return Object.keys(mapa).map(function(k){ return mapa[k]; })
        .filter(function(e){ return e.s > 0; })
        .sort(function(a, b){ return b.s - a.s; });
    });
  }

  function asegurarCatalogo(){ return cargar().catch(function(){ return CAT; }); }

  function elegirFoto(file){
    var r = new FileReader();
    r.onload = function(){
      ID.dataUrl = r.result;
      ID.nombre = file && file.name ? file.name : '';
      ID.res = null;
      renderPanel();
      identificar();
    };
    r.onerror = function(){
      ID.res = null;
      renderPanel();
    };
    r.readAsDataURL(file);
  }

  function resetIdent(){
    ID.dataUrl = null;
    ID.nombre = '';
    ID.buscando = false;
    ID.res = null;
    DECK.aiSku = null;
    renderPanel();
    if (CAT) renderDeck();
  }

  function identificar(){
    if (!ID.dataUrl || ID.buscando) return;
    ID.buscando = true;
    ID.res = null;
    DECK.aiSku = null;
    renderPanel();
    if (CAT) renderDeck();
    asegurarCatalogo().then(function(){
      return ocrDe(ID.dataUrl);
    }).then(function(txt){
      return compararConGuia(txt);
    }).then(function(res){
      ID.res = res || [];
      ID.buscando = false;
      if (res.length){
        var topSku = res[0].it.sku;
        var encontrada = -1;
        (CAT || []).forEach(function(it, i){
          if (it.sku && it.sku === topSku) encontrada = i;
        });
        if (encontrada !== -1){
          DECK.idx = encontrada;
          DECK.aiSku = topSku;
        }
      }
      renderPanel();
      renderDeck();
    }).catch(function(){
      ID.res = null;
      ID.buscando = false;
      renderPanel();
      renderDeck();
    });
  }

  function itemsDeck(){
    var base = (CAT || []).filter(function(it){ return it.sku; });
    var q = (DECK.q || '').trim().toLowerCase();
    if (!q) return base;
    return base.filter(function(it){
      if (it.num && String(it.num).toLowerCase().indexOf(q) !== -1) return true;
      if (it.n && String(it.n).toLowerCase().indexOf(q) !== -1) return true;
      if (it.sku && String(it.sku).toLowerCase().indexOf(q) !== -1) return true;
      return false;
    });
  }

  function cartaDatoHtml(it){
    var nombre = normQuitar(it.n);
    var tags = tagsDe(it);
    return '<div class="can-cdato">' +
      (it.num ? '<span class="can-psa">Cód. adaptador PSA: <b>Nº ' + esc(it.num) + '</b></span>' : '') +
      '<div class="can-tags">' + tags.map(function(t){ return '<i>' + t + '</i>'; }).join('') + '</div>' +
      '<h3>' + esc(nombre) + '</h3>' +
      (it.sku ? '<div class="can-csoku">SKU ' + esc(it.sku) + '</div>' : '') +
      '</div>';
  }

  function cartaFotoHtml(it){
    var foto = fotoDe(it.sku);
    return foto
      ? '<img loading="lazy" src="' + esc(foto) + '" alt="' + esc(normQuitar(it.n)) + '">'
      : '<span class="can-sinfoto">🔩</span>';
  }

  function renderDeck(){
    var sec = document.getElementById('canDeckSec');
    if (!sec) return;
    DECK.items = itemsDeck();
    if (DECK.idx >= DECK.items.length && DECK.items.length) DECK.idx = 0;
    var n = DECK.items.length;
    var h;
if (!n){
      h = '<div class="can-deckvacio">No encontré modelos con ese dato.<br/><button type="button" data-can-reset-deck>Mostrar todo el catálogo</button></div>' +
        '<div class="can-decknav"><button type="button" data-can-prev disabled aria-label="Carta anterior"><</button><span>Pasar carta 0 de 0</span><button type="button" data-can-next disabled aria-label="Carta siguiente">></button></div>';
      sec.innerHTML = h;
      deckNav();
      return;
    }
    var act = DECK.items[DECK.idx];
    var nxt = DECK.items[(DECK.idx + 1) % n];
    var ai = (act.sku && act.sku === DECK.aiSku)
      ? '<div class="can-ai">✨ La IA encontró esta · mira si coincide con tu foto</div>'
      : '';
    h = '<div class="can-deckwrap" id="canDeckWrap">' +
      '<div class="can-deck can-peek"><div class="can-carta">' + cartaFotoHtml(nxt) + cartaDatoHtml(nxt) + '</div></div>' +
      '<div class="can-deck" id="canDeckTop"><div class="can-carta">' +
      (ai || '') +
      cartaFotoHtml(act) + cartaDatoHtml(act) +
      '<div class="can-acciones" style="padding:0 16px 16px">' +
      '<button type="button" data-can-foto="' + esc(fotoDe(act.sku)) + '" data-can-cap="' + esc(normQuitar(act.n) + (act.num ? ' · Nº ' + act.num : '')) + '">🔍 Foto</button>' +
      '<button type="button" class="ghost" data-can-guia>📖 En la guía</button>' +
      '<a href="https://wa.me/?text=' + encodeURIComponent('APPI · ¿Me pasás el ' + act.n + (act.num ? ' (Nº ' + act.num + ')' : '') + '? SKU ' + act.sku) + '" target="_blank" rel="noopener">💬 WhatsApp</a>' +
      '</div>' +
      '</div></div>' +
      '</div>' +
      '<div class="can-decknav">' +
      '<button type="button" data-can-prev aria-label="Carta anterior">‹</button>' +
      '<span id="canDeckCounter">Pasar carta ' + (DECK.idx + 1) + ' de ' + n + '</span>' +
      '<button type="button" data-can-next aria-label="Pasar carta">›</button>' +
      '</div>';
    sec.innerHTML = h;
    deckDrag();
    deckNav();
  }

  function deckDrag(){
    var el = document.getElementById('canDeckTop');
    if (!el || el._canDrag) return;
    el._canDrag = true;
    var activo = false, ix = 0, iy = 0, cur = 0;
    el.addEventListener('pointerdown', function(e){
      if (e.target.closest && e.target.closest('button, a, input, textarea')) return;
      activo = true;
      ix = e.clientX;
      iy = e.clientY;
      cur = 0;
      try { el.setPointerCapture(e.pointerId); } catch (err) {}
    });
    el.addEventListener('pointermove', function(e){
      if (!activo) return;
      var dx = e.clientX - ix;
      var dy = Math.abs(e.clientY - iy);
      if (dy > Math.abs(dx) * 1.6 && dy > 8){
        activo = false;
        el.style.transform = '';
        return;
      }
      cur = dx;
      el.style.transition = 'none';
      el.style.transform = 'translateX(' + dx + 'px) rotate(' + (dx * 0.06) + 'deg)';
    });
    function soltar(){
      if (!activo) return;
      activo = false;
      el.style.transition = '';
      el.style.transform = '';
      if (Math.abs(cur) > 70) pasar(cur < 0 ? 1 : -1);
    }
    el.addEventListener('pointerup', soltar);
    el.addEventListener('pointercancel', soltar);
  }

  function pasar(dir){
    var n = itemsDeck().length;
    if (!n) return;
    DECK.aiSku = null;
    if (dir > 0) DECK.idx = (DECK.idx + 1) % n;
    else DECK.idx = (DECK.idx - 1 + n) % n;
    renderDeck();
  }

  function renderPanel(){
    var sec = document.getElementById('canIDPanel');
    if (!sec) return;
    var h = '<div class="can-idhead">' +
      '<span class="can-idtag">Tu foto</span>' +
      '<button type="button" class="can-cambia' + (ID.dataUrl ? ' on' : '') + '" data-can-cambiar>Cambiar foto</button>' +
      '</div>';
    if (!ID.dataUrl){
      h += '<div class="can-idhero">' +
        '<div class="can-idi">📷</div>' +
        '<strong>Sacale una foto a la pieza</strong>' +
        '<p>La IA busca en el <b>catálogo PSA</b> y deja arriba la carta que se parece a tu canilla. Después podés deslizar para revisar todas.</p>' +
        '<div class="can-idacc">' +
        '<button type="button" data-can-cam>📷 Sacar foto</button>' +
        '<button type="button" class="sec" data-can-sube>⬆️ Subir imagen</button>' +
        '</div>' +
        '</div>';
    } else if (ID.buscando){
      h += '<div class="can-idest">' +
        '<div class="can-idpre"><img src="' + esc(ID.dataUrl) + '" alt="Tu foto"></div>' +
        '<div class="can-spin"></div>' +
        '<strong>Buscando en el catálogo…</strong>' +
        '<p class="can-msg">Leyendo el número y comparando la forma con las fotos de la guía.</p>' +
        '</div>';
    } else if (ID.res && ID.res.length){
      var pc = Math.max(0, Math.min(100, Math.round(ID.res[0].s)));
      h += '<div class="can-match">' +
        '<span class="can-mlabel">Adaptador requerido</span>' +
        '<b>' + esc(normQuitar(ID.res[0].it.n)) + '</b>' +
        '<span class="can-mnum">Nº ' + esc(ID.res[0].it.num || '—') + '</span>' +
        '<span class="can-mpct">Coincidencia ' + pc + '% · dejé arriba la carta más parecida</span>' +
        '</div>' +
        '<p class="can-msg">Si no es exactamente tu pieza, deslizá las cartas hasta encontrar la que más se le parezca.</p>';
    } else {
      h += '<div class="can-nomatch">' +
        '<strong>No pude compararla</strong>' +
        '<p class="can-msg">Probá con otra foto, más de cerca y con buena luz.</p>' +
        '</div>';
    }
    h += '<div class="can-idacc">' +
      '<button type="button" data-can-cam>📷 ' + (ID.dataUrl ? 'Sacar otra foto' : 'Sacar foto') + '</button>' +
      '<button type="button" class="sec" data-can-sube>⬆️ Subir imagen</button>' +
      '</div>';
    sec.innerHTML = h;
  }

  function render(){
    var cont = document.getElementById('canillasCont');
    if (!cont) return;
    cont.innerHTML =
      '<div class="can-cols">' +
      '<aside class="can-idpanel" id="canIDPanel"></aside>' +
      '<div class="can-deckcol">' +
      '<div class="can-deckhead">' +
      '<span class="can-decktitle">Catálogo PSA <small>· deslizá las cartas</small></span>' +
      '<button type="button" class="can-guialink" data-can-guia>📖 Abrir la guía</button>' +
      '</div>' +
      '<div class="can-deckbar">' +
      '<input id="canDeckSearch" class="can-decksearch" type="search" placeholder="Buscar por nombre, ítem o SKU…" value="' + esc(DECK.q) + '">' +
      '</div>' +
      '<div id="canDeckSec"></div>' +
      '</div>' +
      '</div>' +
      '<input id="canFotoCam" type="file" accept="image/*" capture="environment" hidden>' +
      '<input id="canFotoSube" type="file" accept="image/*" hidden>';
    renderPanel();
    renderDeck();
    var q = document.getElementById('canDeckSearch');
    if (q) q.addEventListener('input', function(){ DECK.q = q.value; DECK.idx = 0; DECK.aiSku = null; renderDeck(); });
    var cam = document.getElementById('canFotoCam');
    var sube = document.getElementById('canFotoSube');
    if (cam) cam.onchange = function(){ if (cam.files && cam.files[0]) elegirFoto(cam.files[0]); };
    if (sube) sube.onchange = function(){ if (sube.files && sube.files[0]) elegirFoto(sube.files[0]); };
  }

  function deckNav(){
    var sec = document.getElementById('canDeckSec');
    if (!sec) return;
    var prev = sec.querySelector('[data-can-prev]');
    var nxt = sec.querySelector('[data-can-next]');
    if (prev) prev.onclick = function(){ pasar(-1); };
    if (nxt) nxt.onclick = function(){ pasar(1); };
    var reset = sec.querySelector('[data-can-reset-deck]');
    if (reset) reset.onclick = function(){
      DECK.q = '';
      var qs = document.getElementById('canDeckSearch');
      if (qs) qs.value = '';
      DECK.idx = 0;
      DECK.aiSku = null;
      renderDeck();
    };
  }

  function enganchar(){
    var cont = document.getElementById('canillasCont');
    if (!cont || cont._canillasEnganchado) return;
    cont._canillasEnganchado = true;
    cont.addEventListener('click', function(e){
      var cam = e.target.closest('[data-can-cam]');
      if (cam){
        var inp = document.getElementById('canFotoCam');
        if (inp) inp.click();
        return;
      }
      var sube = e.target.closest('[data-can-sube]');
      if (sube){
        var inp2 = document.getElementById('canFotoSube');
        if (inp2) inp2.click();
        return;
      }
      var cambiar = e.target.closest('[data-can-cambiar]');
      if (cambiar){
        var inp3 = document.getElementById('canFotoSube');
        if (inp3) inp3.click();
        return;
      }
      var guia = e.target.closest('[data-can-guia]');
      if (guia){
        openCanillasGuia();
        return;
      }
      var foto = e.target.closest('[data-can-foto]');
      if (foto){
        openCanillasFoto(foto.getAttribute('data-can-foto'), foto.getAttribute('data-can-cap') || '');
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
      '<div class="can-pdf-tool"><b>Guía V02-21 · Canillas y adaptadores</b><a id="canPdfAbrir" target="_blank" rel="noopener">Abrir en una pestaña ↗</a></div>' +
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
      cont.innerHTML = '<div class="can-deckvacio">Cargando catálogo…</div>';
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