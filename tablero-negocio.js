/* ============================================================
   APPI · Tablero de comando (v241)
   ------------------------------------------------------------
   Cuatro piezas que convierten los números oficiales del
   negocio en metas diarias:

   1. GPS del mes: bonus oficial (12 PB + patrocinios de 9 PB)
      y ritmo 30 demos → 10 cierres.
   2. Comparativa de la botella: conciencia interactiva.
   3. Simulador de ganancias del plan de negocio.
   4. (El stock personal vive en Mis herramientas.)
   ============================================================ */
(function(){
  'use strict';

  function uid(){ return window.APPIAuth && window.APPIAuth.userId ? window.APPIAuth.userId() : ''; }
  function $(id){ return document.getElementById(id); }
  function equipo(){ try{ return JSON.parse(localStorage.getItem('equipoData') || 'null'); }catch(e){ return null; } }
  function panel(){
    try{
      var c = JSON.parse(localStorage.getItem('appi_gestion_cache_v1_' + uid()) || 'null');
      return c && Array.isArray(c.contacts) ? c.contacts : [];
    }catch(e){ return []; }
  }
  function culturaMes(){
    try{
      var data = JSON.parse(localStorage.getItem('cultura_crecimiento_v1') || '{}');
      var now = new Date();
      var id = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0');
      var row = data[id] || {};
      var invitados = Array.isArray(row.invitados) ? row.invitados.length : Number(row.invitados) || 0;
      var pb = Number(row.pb) || 0;
      Object.keys(data).forEach(function(k){
        if(!/^\d{4}-\d{2}-\d{2}$/.test(k)) return;
        if(k.slice(0,7) !== id) return;
        var w = data[k] || {};
        pb = Math.max(pb, Number(w.pb) || 0);
        if(Array.isArray(w.invitados)) invitados = Math.max(invitados, w.invitados.length);
      });
      return { pb: pb, invitados: invitados };
    }catch(e){ return { pb: 0, invitados: 0 }; }
  }
  function mesActual(d){ var i = new Date(); i.setDate(1); i.setHours(0,0,0,0); return new Date(d) >= i; }
  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function estilo(){
    if ($('tableroStyle')) return;
    var s = document.createElement('style');
    s.id = 'tableroStyle';
    s.textContent = '' +
      '.tb-card{margin:8px 2px;padding:14px;border-radius:18px;background:rgba(255,255,255,.62);border:1px solid rgba(255,255,255,.78)}' +
      'body.dark .tb-card{background:#25273a;border-color:rgba(255,255,255,.08)}' +
      '.tb-title{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:950;color:#343441}' +
      'body.dark .tb-title{color:#f2f2f7}' +
      '.tb-sub{margin:3px 0 10px;font-size:10.5px;font-weight:750;color:#686977}' +
      'body.dark .tb-sub{color:#b8b9c5}' +
      '.tb-row{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:11px;font-weight:800;color:#556277;margin:5px 0}' +
      'body.dark .tb-row{color:#b8b9c5}' +
      '.tb-bar{height:7px;border-radius:99px;background:rgba(80,90,130,.12);overflow:hidden;margin:2px 0 8px}' +
      '.tb-bar i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#3ad0a4,#5b8def)}' +
      '.tb-ok{color:#1f9d61}.tb-no{color:#d9534f}' +
      '.tb-input{width:100%;min-height:42px;border:1px solid rgba(80,90,130,.2);border-radius:12px;padding:8px 10px;font:inherit;font-size:13px;background:rgba(255,255,255,.85);color:#292938}' +
      'body.dark .tb-input{background:#1d1f31;color:#f2f2f7}' +
      '.tb-big{font-size:20px;font-weight:950;color:#3d63c9}' +
      '.tb-btn{border:0;border-radius:12px;padding:10px 14px;background:linear-gradient(135deg,#3ad0a4,#5b8def);color:#fff;font:inherit;font-size:12px;font-weight:900;cursor:pointer}' +
      '.tb-mini{border:1px solid rgba(91,141,239,.25);border-radius:10px;padding:6px 10px;background:rgba(91,141,239,.08);color:#3d63c9;font:inherit;font-size:11px;font-weight:850;cursor:pointer}' +
      'body.dark .tb-mini{background:rgba(91,141,239,.15);color:#a8c0ff}' +
      '.bot-eco{margin-top:14px;padding:14px;border-radius:16px;background:linear-gradient(160deg,rgba(34,168,120,.12),rgba(91,141,239,.10) 55%,rgba(58,208,164,.08));border:1px solid rgba(34,168,120,.22)}' +
      'body.dark .bot-eco{background:linear-gradient(160deg,rgba(34,168,120,.16),rgba(91,141,239,.12));border-color:rgba(58,208,164,.22)}' +
      '.bot-eco-kicker{margin:0 0 4px;color:#168765;font-size:10px;font-weight:950;letter-spacing:.6px;text-transform:uppercase}' +
      'body.dark .bot-eco-kicker{color:#5ee0b0}' +
      '.bot-eco h3{margin:0 0 4px;color:#1c3d32;font-size:16px;font-weight:950}' +
      'body.dark .bot-eco h3{color:#e8fff6}' +
      '.bot-eco-lead{margin:0 0 12px;color:#4a675c;font-size:11.5px;font-weight:700;line-height:1.4}' +
      'body.dark .bot-eco-lead{color:#b7d4c8}' +
      '.bot-eco-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}' +
      '.bot-eco-item{min-height:92px;padding:10px;border-radius:14px;background:rgba(255,255,255,.72);border:1px solid rgba(255,255,255,.8)}' +
      'body.dark .bot-eco-item{background:rgba(20,28,32,.55);border-color:rgba(255,255,255,.08)}' +
      '.bot-eco-item span{display:block;font-size:16px;line-height:1}' +
      '.bot-eco-item b{display:block;margin-top:6px;color:#146b4d;font-size:18px;line-height:1.1}' +
      'body.dark .bot-eco-item b{color:#7ef0c2}' +
      '.bot-eco-item small{display:block;margin-top:4px;color:#5d7269;font-size:10px;font-weight:750;line-height:1.3}' +
      'body.dark .bot-eco-item small{color:#a9c4b8}' +
      '.bot-eco-nota{margin:12px 0 0;color:#2d4a3e;font-size:12px;font-weight:750;line-height:1.45}' +
      'body.dark .bot-eco-nota{color:#cfe8dc}' +
      '@media (min-width:1024px){.bot-eco-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}' +
      '.cmp-tabs{display:flex;gap:8px;margin:8px 0 12px}' +
      '.cmp-tab{flex:1;min-height:44px;border:0;border-radius:14px;background:#efe8d8;color:#2a2a32;font:inherit;font-size:13px;font-weight:850;cursor:pointer}' +
      '.cmp-tab.on{background:#0b5878;color:#fff}' +
      'body.dark .cmp-tab{background:#2a2d40;color:#e8e8f0}' +
      'body.dark .cmp-tab.on{background:#0b5878;color:#fff}' +
      '.cmp-pick{display:grid;gap:8px;margin:0 0 12px}' +
      '.cmp-pick .tb-input + .tb-input{margin-top:6px}' +
      '.cmp-pick label{display:block;margin:0 0 4px;font-size:10px;font-weight:850;letter-spacing:.4px;text-transform:uppercase;color:#686977}' +
      '.cmp-pick select + label{margin-top:8px}' +
      '.cmp-swap{width:100%;min-height:36px;border:0;border-radius:12px;background:#efe8d8;color:#0b5878;font:inherit;font-size:13px;font-weight:850;cursor:pointer}' +
      'body.dark .cmp-swap{background:#2a2d40;color:#8ec4d8}' +
      '.cmp-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 0 12px}' +
      '.cmp-card{padding:12px;border-radius:14px;background:#f7f3ea;border:1px solid rgba(11,88,120,.12)}' +
      'body.dark .cmp-card{background:#1d2130;border-color:rgba(255,255,255,.08)}' +
      '.cmp-card h3{margin:0 0 2px;font-size:15px;font-weight:950;color:#0b5878}' +
      'body.dark .cmp-card h3{color:#8ec4d8}' +
      '.cmp-card p{margin:0 0 8px;font-size:11px;font-weight:700;color:#686977;line-height:1.35}' +
      '.cmp-card .tb-input{margin-top:6px}' +
      '.cmp-table{width:100%;border-collapse:collapse;font-size:12px}' +
      '.cmp-table th{text-align:left;padding:8px 6px;color:#0b5878;font-size:11px}' +
      '.cmp-table td{padding:8px 6px;border-top:1px solid rgba(11,88,120,.12);vertical-align:top;font-weight:750;color:#343441}' +
      'body.dark .cmp-table td{color:#e8e8f0;border-color:rgba(255,255,255,.08)}' +
      '.cmp-win{color:#0b5878;font-weight:950}' +
      '.cmp-box{margin:10px 0 0;padding:12px;border-radius:14px;background:#f7f3ea;border:1px solid rgba(11,88,120,.12)}' +
      'body.dark .cmp-box{background:#1d2130}' +
      '.cmp-box b{display:block;margin:0 0 6px;color:#0b5878;font-size:12px}' +
      '.cmp-box p,.cmp-box li{margin:0 0 6px;font-size:12.5px;font-weight:700;color:#343441;line-height:1.4}' +
      'body.dark .cmp-box p,body.dark .cmp-box li{color:#e8e8f0}' +
      '.cmp-box ul{margin:0;padding-left:18px}' +
      '.cmp-btn{width:100%;margin-top:12px;border:0;border-radius:12px;padding:12px 14px;background:#0b5878;color:#fff;font:inherit;font-size:13px;font-weight:900;cursor:pointer}' +
      '.cmp-note{margin:8px 0 0;font-size:10.5px;font-weight:700;color:#686977;line-height:1.35}' +
      '@media (max-width:420px){.cmp-grid{grid-template-columns:1fr}}';
    document.head.appendChild(s);
  }

  /* ---------------- 1 · GPS DEL MES ---------------- */
  function datosGps(){
    var eq = equipo();
    var raiz = eq && Array.isArray(eq.personas) ? (eq.personas.find(function(p){ return p.nivel === 0 && !p.esTitular; }) || eq.personas.find(function(p){ return p.nivel === 0; }) || eq.personas[0]) : null;
    var cul = culturaMes();
    var off = (typeof window.culturaPbOficial === 'function') ? window.culturaPbOficial(eq) : null;
    var A = off ? (Number(off.pb) || 0) : (raiz ? (Number(raiz.pnAct) || 0) : cul.pb);
    var patrocinios9 = raiz ? (raiz.hijos || []).filter(function(h){
      return h.alta && mesActual(h.alta) && (Number(h.pnAct) || 0) >= 9;
    }).length : 0;
    var contactos = panel();
    var demos = contactos.filter(function(c){ return (c.estado === 'presentacion' || c.estado === 'convertido') && mesActual(c.updated_at || c.created_at); }).length;
    var cierres = contactos.filter(function(c){ return c.estado === 'convertido' && mesActual(c.updated_at || c.created_at); }).length;
    return { A: A, patrocinios9: patrocinios9, demos: demos, cierres: cierres, conLinea: !!raiz };
  }
  function htmlGps(){
    var g = datosGps();
    function barra(actual, meta){
      var pct = meta ? Math.min(100, Math.round(actual / meta * 100)) : 0;
      return '<div class="tb-bar"><i style="width:' + pct + '%"></i></div>';
    }
    var bonus = g.A >= 12 && g.patrocinios9 >= 1;
    var bonusFull = g.A >= 12 && g.patrocinios9 >= 2;
    return '<div class="tb-card" id="gpsBlock" style="margin:0 0 12px">' +
      '<div class="tb-title">🛰️ GPS del mes</div>' +
      '<div class="tb-sub">Las reglas oficiales, en metas de hoy' + (g.conLinea ? '' : ' · cargá tu Línea para leer tus PB') + '</div>' +
      '<div class="tb-row"><span>Bonus: 12 PB personales</span><span class="' + (g.A >= 12 ? 'tb-ok' : 'tb-no') + '">' + g.A + ' / 12</span></div>' + barra(g.A, 12) +
      '<div class="tb-row"><span>Patrocinios con 9 PB</span><span class="' + (g.patrocinios9 >= 1 ? 'tb-ok' : 'tb-no') + '">' + g.patrocinios9 + ' / 2</span></div>' + barra(g.patrocinios9, 2) +
      '<div class="tb-row"><span>Ritmo: demos del mes</span><span>' + g.demos + ' / 30</span></div>' + barra(g.demos, 30) +
      '<div class="tb-row"><span>Cierres del mes</span><span>' + g.cierres + ' / 10</span></div>' + barra(g.cierres, 10) +
      '<div class="tb-sub" style="margin:6px 0 0">' + (bonusFull ? '🎉 Bonus completo este mes.' : bonus ? 'Vas encaminado: te falta un patrocinio más para el bonus completo.' : 'Hoy es un buen día para sumar PB y escribirle a alguien.') + '</div>' +
      '</div>';
  }

  /* ---------------- 2 · COMPARATIVA DE LA BOTELLA ---------------- */
  // Promedios para la demo: botella PET 2 L vacía ~44 g; 450 años en
  // descomponerse (se cita 450 a 1.000); huella aplastada 18×10 cm;
  // ~1,9 L de petróleo y ~2,3 kg de CO2 por kilo de PET.
  var BOT_G = 44;
  var BOT_ANIOS = 450;
  var BOT_M2 = 0.018;
  var BOT_PETROLEO = 1.9;
  var BOT_CO2 = 2.3;
  var BOT_ARBOL = 21;
  function botFmt(n, dec){
    return Number(n).toLocaleString('es-AR', {minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0});
  }
  function botKgTxt(n){ return n >= 100 ? botFmt(Math.round(n)) : botFmt(n, 1); }
  function botEquivArea(m2){
    if (m2 < 2) return 'como una mesa de café';
    if (m2 < 10) return 'como una habitación chica';
    if (m2 < 16) return 'como una plaza de estacionamiento';
    if (m2 < 50) return 'como un living comedor';
    if (m2 < 261) return 'como un departamento de ' + Math.round(m2) + ' m²';
    if (m2 < 7140) return 'como ' + botFmt(m2 / 261, 1) + ' canchas de tenis';
    return 'como ' + botFmt(m2 / 7140, 1) + ' canchas de fútbol';
  }
  var CMP_LS_TAB = 'appi_cmp_tab_v1';
  var CMP_LS_SEL = 'appi_cmp_sel_v1';
  var CMP_LS_PRE = 'appi_cmp_precios_v1';
  var CMP = [
    {id:'mini', grupo:'Beber y cocinar', nombre:'Mini', precio:411000, litros:12000, meses:12, inst:'Sobre mesada',
      para:'Cocina chica u oficina, consumo bajo.',
      trata:'Cloro y sólidos en suspensión.',
      tiene:['CAG','CAG con plata','Fipor n.° 3','Casquete 360°','Kit posventa']},
    {id:'vero', grupo:'Beber y cocinar', nombre:'Vero', precio:528000, litros:15000, meses:18, inst:'Sobre mesada',
      para:'Beber, cocinar y lavar alimentos al menor precio con KDF.',
      trata:'Cloro (más del 90 %), THM (más del 60 %), hierro y plomo.',
      tiene:['CAG','CAG con plata','KDF','Resina mineral','Fipor n.° 3','Kit posventa']},
    {id:'senior', grupo:'Beber y cocinar', nombre:'Senior', precio:751000, litros:36000, meses:36, inst:'Sobre mesada',
      para:'Uso diario de una familia, 3 años.',
      trata:'Cloro (más del 90 %), THM (más del 60 %), hierro y plomo.',
      tiene:['CAG','CAG con plata','KDF','Fipor','Casquete 360°','Kit posventa']},
    {id:'senior4', grupo:'Beber y cocinar', nombre:'Senior4', precio:913000, litros:36000, meses:36, inst:'Sobre o bajo mesada',
      para:'La evolución del Senior: diseño, prefiltro y también bajo mesada.',
      trata:'Cloro (más del 90 %), THM (más del 60 %), hierro y plomo.',
      tiene:['CAG','CAG con plata','KDF','Prefiltro','Fipor','Casquete 360°','Cartucho de repuesto','Bajo mesada']},
    {id:'s1000', grupo:'Beber y cocinar', nombre:'S-1000 II', precio:1079000, litros:80000, meses:36, inst:'Sobre o bajo mesada',
      para:'Mucho volumen: oficinas, familias grandes, uso intenso.',
      trata:'Cloro (más del 90 %), THM (más del 60 %), hierro y plomo.',
      tiene:['CAG','CAG con plata','KDF','Cartucho bacteriostático','Alto volumen','Bajo mesada']},
    {id:'senik', grupo:'Beber y cocinar', nombre:'Senik', precio:1248000, litros:8000, meses:18, inst:'Sobre o bajo mesada',
      para:'Agua con arsénico. El rendimiento baja si hay más arsénico.',
      trata:'Arsénico, cloro, THM y metales.',
      tiene:['CAG','CAG con plata','KDF','Resina de arsénico','Cartucho bacteriostático','Bajo mesada']},
    {id:'quantum2', grupo:'Beber y cocinar', nombre:'Quantum·2', precio:1271000, litros:30000, meses:36, inst:'Sobre o bajo mesada',
      para:'Agua dura: menos sarro en cafeteras, termos y vajilla.',
      trata:'Dureza / sarro, cloro y THM.',
      tiene:['CAG','CAG con plata','Resina de dureza','Cartucho bacteriostático','Bajo mesada']},
    {id:'c3', grupo:'Baño', nombre:'C3', precio:208000, litros:2000, meses:6, inst:'Canilla del baño',
      para:'Cepillarse los dientes y lavarse la cara con menos cloro.',
      trata:'Cloro, THM y sólidos en suspensión.',
      tiene:['CAG','CAG con plata']},
    {id:'rinnova', grupo:'Baño', nombre:'Ducha Rinnova KDF', precio:296000, litros:150000, meses:6, inst:'Ducha',
      para:'Piel y pelo: menos cloro en la ducha. Cartucho a los 6 meses.',
      trata:'Cloro y metales (hierro, plomo).',
      tiene:['KDF','Ducha']},
    {id:'rinnova-poli', grupo:'Baño', nombre:'Ducha Rinnova KDF+Poli', precio:296000, litros:150000, meses:6, inst:'Ducha',
      para:'Lo mismo que KDF y además frena el sarro en la ducha.',
      trata:'Cloro, metales y sarro.',
      tiene:['KDF','Polifosfato','Ducha']},
    {id:'portatil', grupo:'Otros', nombre:'Portátil', precio:122000, litros:0, meses:0, inst:'Para llevar',
      para:'Viaje o la oficina, cuando no hay equipo fijo.',
      trata:'Cloro en agua de red, según el uso.',
      tiene:['CAG','Portátil']},
    {id:'stopper', grupo:'Otros', nombre:'Stopper', precio:240000, litros:0, meses:6, inst:'Cañería',
      para:'Retiene tierra y partículas gruesas antes de que lleguen a la casa.',
      trata:'Sedimentos y suciedad de tanque o cañerías.',
      tiene:['Sedimentos']},
    {id:'poli2', grupo:'Otros', nombre:'Poli 2', precio:280000, litros:0, meses:0, inst:'Cañería / entrada de agua',
      para:'Frena el sarro en cañerías, termotanque y electrodomésticos.',
      trata:'Sarro / cal en agua caliente.',
      tiene:['Polifosfato']},
    {id:'soda', grupo:'Otros', nombre:'SodaBurby', precio:438000, litros:0, meses:0, inst:'Mesada',
      para:'Soda en casa con agua ya purificada. No es un purificador.',
      trata:'No trata el agua: la gasifica.',
      tiene:['Soda']},
    {id:'iontrix', grupo:'Otros', nombre:'Iontrix 3', precio:1176000, litros:40000, meses:24, inst:'Piscina',
      para:'Piscina con menos cloro. Primera ionización ~40.000 L.',
      trata:'Bacterias en agua de piscina, por ionización.',
      tiene:['Ionización','Panel solar']}
  ];
  function cmpGet(id){
    for (var i = 0; i < CMP.length; i++) if (CMP[i].id === id) return CMP[i];
    return CMP[0];
  }
  function cmpPrecios(){
    try { return JSON.parse(localStorage.getItem(CMP_LS_PRE) || '{}') || {}; } catch (e) { return {}; }
  }
  function cmpPrecioDe(p){
    var n = Number(cmpPrecios()[p.id]);
    return n > 0 ? n : p.precio;
  }
  function cmpMoney(n){ return '$' + Math.round(n).toLocaleString('es-AR'); }
  function cmpL(n){ return Number(n).toLocaleString('es-AR'); }
  function cmpPorLitro(p){
    if (!p.litros) return null;
    return cmpPrecioDe(p) / p.litros;
  }
  function cmpSolo(a, b){
    return (a.tiene || []).filter(function(x){ return (b.tiene || []).indexOf(x) < 0; });
  }
  function cmpOpts(sel){
    var grupos = [];
    var seen = {};
    CMP.forEach(function(p){
      if (!seen[p.grupo]) { seen[p.grupo] = 1; grupos.push(p.grupo); }
    });
    return grupos.map(function(g){
      return '<optgroup label="' + esc(g) + '">' + CMP.filter(function(p){ return p.grupo === g; }).map(function(p){
        return '<option value="' + p.id + '"' + (p.id === sel ? ' selected' : '') + '>' + esc(p.nombre) + '</option>';
      }).join('') + '</optgroup>';
    }).join('');
  }
  function cmpSel(){
    var d = { a: 'vero', b: 'senior4' };
    try {
      var s = JSON.parse(localStorage.getItem(CMP_LS_SEL) || 'null');
      if (s && s.a && s.b) { d.a = s.a; d.b = s.b; }
    } catch (e) {}
    return d;
  }
  function cmpTab(){
    try { return localStorage.getItem(CMP_LS_TAB) === 'bot' ? 'bot' : 'prod'; } catch (e) { return 'prod'; }
  }
  function htmlCmpProd(){
    var s = cmpSel();
    var a = cmpGet(s.a), b = cmpGet(s.b);
    return '<div class="tb-sub">Elegí dos. APPI te dice qué cambia, los litros y cuál conviene en plata.</div>' +
      '<div class="cmp-pick">' +
        '<div><label>Producto 1</label><select class="tb-input" id="cmpA">' + cmpOpts(s.a) + '</select>' +
          '<label>Precio</label><input class="tb-input" id="cmpPa" type="number" min="0" step="1000" value="' + cmpPrecioDe(a) + '"></div>' +
        '<button type="button" class="cmp-swap" id="cmpSwap">⇄ Dar vuelta</button>' +
        '<div><label>Producto 2</label><select class="tb-input" id="cmpB">' + cmpOpts(s.b) + '</select>' +
          '<label>Precio</label><input class="tb-input" id="cmpPb" type="number" min="0" step="1000" value="' + cmpPrecioDe(b) + '"></div>' +
      '</div>' +
      '<div id="cmpOut"></div>' +
      '<button type="button" class="cmp-btn" id="cmpShare">📤 Mandarla por WhatsApp</button>' +
      '<p class="cmp-note">Fichas de catalogo.psa.com.ar. Precios de lista tienda 4-Sep-2026. Cambiá el precio si cotizás otro.</p>';
  }
  function htmlCmpBot(){
    return '<div class="tb-sub">Mostrala en la demo: la plata y el planeta despiertan conciencia</div>' +
      '<div class="tb-row"><span>Botellas de 2 L por día</span><input class="tb-input" style="max-width:90px" id="botPorDia" type="number" min="1" max="40" value="2"></div>' +
      '<div class="tb-row"><span>Precio por botella ($)</span><input class="tb-input" style="max-width:120px" id="botPrecio" type="number" min="0" step="50" value="1500"></div>' +
      '<div id="botResult"></div>' +
      '<div class="bot-eco" id="botEco"></div>' +
      '<button type="button" class="tb-btn" id="botShare" style="width:100%;margin-top:12px">📤 Compartirla por WhatsApp</button>';
  }
  function cmpCelda(val, win){
    return '<td class="' + (win ? 'cmp-win' : '') + '">' + val + '</td>';
  }
  function cmpPinta(){
    var aEl = $('cmpA'), bEl = $('cmpB'), out = $('cmpOut');
    if (!aEl || !bEl || !out) return;
    var a = cmpGet(aEl.value), b = cmpGet(bEl.value);
    try { localStorage.setItem(CMP_LS_SEL, JSON.stringify({ a: a.id, b: b.id })); } catch (e) {}
    if (a.id === b.id) {
      out.innerHTML = '<div class="cmp-box"><p>Elegí dos productos distintos.</p></div>';
      window.__cmpTexto = '';
      return;
    }
    var pa = $('cmpPa') ? Math.max(0, Number($('cmpPa').value) || 0) : cmpPrecioDe(a);
    var pb = $('cmpPb') ? Math.max(0, Number($('cmpPb').value) || 0) : cmpPrecioDe(b);
    var map = cmpPrecios();
    if ($('cmpPa')) map[a.id] = pa;
    if ($('cmpPb')) map[b.id] = pb;
    try { localStorage.setItem(CMP_LS_PRE, JSON.stringify(map)); } catch (e) {}
    function porL(p, precio){ return p.litros ? (precio / p.litros) : null; }
    var la = porL(a, pa), lb = porL(b, pb);
    var winL = (a.litros && b.litros) ? (a.litros === b.litros ? '' : (a.litros > b.litros ? 'a' : 'b')) : '';
    var winP = pa === pb ? '' : (pa < pb ? 'a' : 'b');
    var winU = (la != null && lb != null && Math.abs(la - lb) >= 0.5) ? (la < lb ? 'a' : 'b') : '';
    var winM = (a.meses && b.meses) ? (a.meses === b.meses ? '' : (a.meses > b.meses ? 'a' : 'b')) : '';
    function litrosTxt(p){ return p.litros ? (cmpL(p.litros) + ' L') : 'Según el uso'; }
    function mesesTxt(p){ return p.meses ? (p.meses + ' meses') : 'Según el agua'; }
    function litroTxt(n){ return n == null ? '—' : cmpMoney(n) + ' / L'; }
    var da = cmpSolo(a, b), db = cmpSolo(b, a);
    var relato = [];
    if (a.grupo !== b.grupo) {
      relato.push('No son del mismo uso: ' + a.nombre + ' es de ' + a.grupo.toLowerCase() + ' y ' + b.nombre + ' de ' + b.grupo.toLowerCase() + '. Sirve para ver plata y litros, no para reemplazar uno con el otro.');
    }
    if (a.litros && b.litros && a.litros !== b.litros) {
      var mas = a.litros > b.litros ? a : b;
      var menos = mas === a ? b : a;
      var veces = mas.litros / menos.litros;
      relato.push(mas.nombre + ' rinde ' + (veces >= 1.8 ? botFmt(veces, 1) + ' veces más litros' : cmpL(mas.litros - menos.litros) + ' litros más') + ' (' + cmpL(mas.litros) + ' vs ' + cmpL(menos.litros) + ').');
    } else if (a.litros && b.litros) {
      relato.push('Los dos rinden ' + cmpL(a.litros) + ' litros.');
    }
    if (winU === 'a') relato.push('El litro de ' + a.nombre + ' sale ' + cmpMoney(la) + '; el de ' + b.nombre + ', ' + cmpMoney(lb) + '.');
    if (winU === 'b') relato.push('El litro de ' + b.nombre + ' sale ' + cmpMoney(lb) + '; el de ' + a.nombre + ', ' + cmpMoney(la) + '.');
    if (da.length) relato.push(a.nombre + ' trae de distinto: ' + da.join(', ') + '.');
    if (db.length) relato.push(b.nombre + ' trae de distinto: ' + db.join(', ') + '.');
    if (!da.length && !db.length) relato.push('Los medios activos se parecen. La diferencia está en litros, meses o el precio.');
    var conv = '';
    if (a.grupo === b.grupo && winU) {
      var barato = winU === 'a' ? a : b;
      var caro = barato === a ? b : a;
      conv = barato.nombre + ' conviene más en el tiempo: cada litro sale menos. ' + caro.nombre + ' puede ganar si el presupuesto de entrada es el techo.';
    } else if (a.grupo === b.grupo && winP) {
      var baratoE = winP === 'a' ? a : b;
      conv = baratoE.nombre + ' pide menos plata de entrada (' + cmpMoney(baratoE === a ? pa : pb) + ').';
    } else if (a.grupo !== b.grupo) {
      conv = 'Cada uno cubre una necesidad distinta. La plata sirve para mostrar, no para elegir en lugar del otro.';
    } else {
      conv = 'En plata de entrada y en el litro quedan parejos. Ahí gana lo que la familia necesita (espacio, arsénico, sarro, volumen).';
    }
    out.innerHTML =
      '<div class="cmp-grid">' +
        '<div class="cmp-card"><h3>' + esc(a.nombre) + '</h3><p>' + esc(a.para) + '</p></div>' +
        '<div class="cmp-card"><h3>' + esc(b.nombre) + '</h3><p>' + esc(b.para) + '</p></div>' +
      '</div>' +
      '<table class="cmp-table">' +
        '<tr><th></th><th>' + esc(a.nombre) + '</th><th>' + esc(b.nombre) + '</th></tr>' +
        '<tr><td>Rendimiento</td>' + cmpCelda(litrosTxt(a), winL === 'a') + cmpCelda(litrosTxt(b), winL === 'b') + '</tr>' +
        '<tr><td>Vida útil</td>' + cmpCelda(mesesTxt(a), winM === 'a') + cmpCelda(mesesTxt(b), winM === 'b') + '</tr>' +
        '<tr><td>Precio</td>' + cmpCelda(cmpMoney(pa), winP === 'a') + cmpCelda(cmpMoney(pb), winP === 'b') + '</tr>' +
        '<tr><td>El litro</td>' + cmpCelda(litroTxt(la), winU === 'a') + cmpCelda(litroTxt(lb), winU === 'b') + '</tr>' +
        '<tr><td>Dónde va</td><td>' + esc(a.inst) + '</td><td>' + esc(b.inst) + '</td></tr>' +
        '<tr><td>Qué trata</td><td>' + esc(a.trata) + '</td><td>' + esc(b.trata) + '</td></tr>' +
      '</table>' +
      '<div class="cmp-box"><b>Qué trae distinto</b><ul>' + relato.map(function(x){ return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' +
      '<div class="cmp-box"><b>Conveniencia</b><p>' + esc(conv) + '</p></div>';
    window.__cmpTexto =
      '⚖️ ' + a.nombre + ' vs ' + b.nombre + '\n\n' +
      a.nombre + '\n• ' + litrosTxt(a) + ' · ' + mesesTxt(a) + '\n• ' + cmpMoney(pa) + (la != null ? ' · ' + cmpMoney(la) + ' el litro' : '') + '\n• ' + a.trata + '\n\n' +
      b.nombre + '\n• ' + litrosTxt(b) + ' · ' + mesesTxt(b) + '\n• ' + cmpMoney(pb) + (lb != null ? ' · ' + cmpMoney(lb) + ' el litro' : '') + '\n• ' + b.trata + '\n\n' +
      'Qué cambia\n' + relato.map(function(x){ return '• ' + x; }).join('\n') + '\n\n' +
      'Conveniencia\n' + conv;
  }
  function cmpMostrar(tab){
    try { localStorage.setItem(CMP_LS_TAB, tab); } catch (e) {}
    var prod = $('cmpPaneProd'), bot = $('cmpPaneBot');
    var tProd = $('cmpTabProd'), tBot = $('cmpTabBot');
    if (prod) prod.hidden = tab !== 'prod';
    if (bot) bot.hidden = tab !== 'bot';
    if (tProd) tProd.classList.toggle('on', tab === 'prod');
    if (tBot) tBot.classList.toggle('on', tab === 'bot');
    if (tab === 'bot') calcBotella();
    if (tab === 'prod') cmpPinta();
  }
  function bindCmp(){
    var tProd = $('cmpTabProd'), tBot = $('cmpTabBot');
    if (tProd) tProd.onclick = function(){ cmpMostrar('prod'); };
    if (tBot) tBot.onclick = function(){ cmpMostrar('bot'); };
    var aEl = $('cmpA'), bEl = $('cmpB'), sw = $('cmpSwap');
    var paEl = $('cmpPa'), pbEl = $('cmpPb');
    function loadPre(sel, pre){
      if (!sel || !pre) return;
      pre.value = cmpPrecioDe(cmpGet(sel.value));
    }
    if (aEl) aEl.onchange = function(){ loadPre(aEl, paEl); cmpPinta(); };
    if (bEl) bEl.onchange = function(){ loadPre(bEl, pbEl); cmpPinta(); };
    if (paEl) paEl.oninput = cmpPinta;
    if (pbEl) pbEl.oninput = cmpPinta;
    if (sw) sw.onclick = function(){
      if (!aEl || !bEl) return;
      var x = aEl.value; aEl.value = bEl.value; bEl.value = x;
      var y = paEl ? paEl.value : ''; if (paEl && pbEl) { paEl.value = pbEl.value; pbEl.value = y; }
      cmpPinta();
    };
    var sh = $('cmpShare');
    if (sh) sh.onclick = function(){
      var url = 'https://wa.me/?text=' + encodeURIComponent(window.__cmpTexto || '');
      if (window.APPIWhatsApp && window.APPIWhatsApp.abrir) window.APPIWhatsApp.abrir(url);
      else window.open(url, '_blank', 'noopener');
    };
    cmpMostrar(cmpTab());
  }

  function htmlBotella(){
    return '<div class="tb-card" style="margin:10px 2px">' +
      '<div class="tb-title">Comparativas</div>' +
      '<div class="cmp-tabs">' +
        '<button type="button" class="cmp-tab" id="cmpTabProd">Productos</button>' +
        '<button type="button" class="cmp-tab" id="cmpTabBot">Botellas</button>' +
      '</div>' +
      '<div id="cmpPaneProd"' + (cmpTab() === 'prod' ? '' : ' hidden') + '>' + htmlCmpProd() + '</div>' +
      '<div id="cmpPaneBot"' + (cmpTab() === 'bot' ? '' : ' hidden') + '>' + htmlCmpBot() + '</div></div>';
  }
  function calcBotella(){
    if (!$('botPorDia') || !$('botResult')) return;
    var d = Math.max(1, Number($('botPorDia').value) || 2);
    var p = Math.max(0, Number($('botPrecio').value) || 0);
    var dia = d * p, mes = dia * 30, anio = mes * 12, tres = anio * 3;
    var f = function(n){ return '$' + Math.round(n).toLocaleString('es-AR'); };
    var botellasAnio = d * 365;
    var botellasTres = botellasAnio * 3;
    var kgAnio = botellasAnio * BOT_G / 1000;
    var kgTres = kgAnio * 3;
    var m2Anio = botellasAnio * BOT_M2;
    var petroleo = kgAnio * BOT_PETROLEO;
    var arboles = (kgAnio * BOT_CO2) / BOT_ARBOL;
    var horizonte = new Date().getFullYear() + BOT_ANIOS;
    var areaTxt = botEquivArea(m2Anio);
    $('botResult').innerHTML =
      '<div class="tb-row"><span>Por día</span><span>' + f(dia) + '</span></div>' +
      '<div class="tb-row"><span>Por mes (30 días)</span><span>' + f(mes) + '</span></div>' +
      '<div class="tb-row"><span>Por año</span><span class="tb-big">' + f(anio) + '</span></div>' +
      '<div class="tb-row"><span>En 3 años</span><span class="tb-big tb-no">' + f(tres) + '</span></div>' +
      '<div class="tb-sub" style="margin-top:6px">Con el sistema, ese dinero vuelve a tu bolsillo: ' + f(anio) + ' por año que hoy se van en botellas.</div>';
    var eco = $('botEco');
    if (eco) eco.innerHTML =
      '<div class="bot-eco-kicker">Impacto ambiental</div>' +
      '<h3>Lo que le ahorrás al planeta</h3>' +
      '<p class="bot-eco-lead">Si esa familia deja las botellas, este plástico no se fabrica. Los números se mueven con lo que cargaste arriba.</p>' +
      '<div class="bot-eco-grid">' +
        '<div class="bot-eco-item"><span>♻️</span><b>' + botKgTxt(kgAnio) + ' kg</b><small>de plástico por año</small></div>' +
        '<div class="bot-eco-item"><span>📐</span><b>' + botFmt(m2Anio, 1) + ' m²</b><small>si las tirás al piso · ' + esc(areaTxt) + '</small></div>' +
        '<div class="bot-eco-item"><span>⏳</span><b>' + botFmt(BOT_ANIOS) + ' años</b><small>tarda cada botella en descomponerse</small></div>' +
        '<div class="bot-eco-item"><span>🛢️</span><b>' + botFmt(petroleo, 0) + ' L</b><small>de petróleo para fabricar ese plástico</small></div>' +
      '</div>' +
      '<p class="bot-eco-nota">La botella no crece en un árbol: el plástico PET se hace con petróleo. Evitar <b>' + botKgTxt(kgAnio) + ' kg</b> es no usar unos <b>' + botFmt(petroleo, 0) + ' litros</b> (más o menos un tanque de nafta). En 3 años son <b>' + botFmt(botellasTres) + ' botellas</b> y <b>' + botKgTxt(kgTres) + ' kg</b> de plástico, que seguirían en la Tierra en el <b>año ' + horizonte + '</b>. Dejarlas equivale a plantar unos <b>' + botFmt(arboles, 1) + ' árboles</b> en absorción de CO₂.</p>';
    window.__botTexto = '🍶 Comparativa de la botella (2 L):\n' + d + ' botellas por día a ' + f(p) + ' cada una.\nPor mes: ' + f(mes) + '\nPor año: ' + f(anio) + '\nEn 3 años: ' + f(tres) + '\nCon el sistema de purificación, ese dinero vuelve a tu bolsillo.\n\n🌍 Lo que le ahorrás al planeta:\n• ' + botKgTxt(kgAnio) + ' kg de plástico por año\n• ' + botFmt(m2Anio, 1) + ' m² si las tirás al piso (' + areaTxt + ')\n• Cada botella tarda ' + BOT_ANIOS + ' años en descomponerse\n• El PET se fabrica con petróleo: ' + botFmt(petroleo, 0) + ' litros para hacer ese plástico (un tanque de nafta)\nEn 3 años: ' + botKgTxt(kgTres) + ' kg. Ese plástico seguiría en la Tierra en el año ' + horizonte + '.';
  }

  /* ---------------- 3 · SIMULADOR DE GANANCIAS ---------------- */
  function htmlSimulador(){
    return '<div class="tb-card" style="margin:16px 8px; padding:20px 16px;">' +
      '<div class="tb-title" style="font-size:20px; margin-bottom:4px;">🧮 Simulador del negocio</div>' +
      '<div class="tb-sub" style="margin-bottom:20px; line-height:1.5;">Ajustá los números según tu realidad y mirá qué puede generar tu mes.</div>' +

      // SECCIÓN 1: VALORES DEL PLAN DE NEGOCIO
      '<div style="background:linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding:16px; border-radius:12px; margin-bottom:24px; border:2px solid #f59e0b;">' +
        '<div style="font-weight:700; font-size:16px; margin-bottom:12px; color:#92400e;">💰 Valores del Plan de Negocio</div>' +
        '<div style="font-size:13px; line-height:1.6; color:#78350f; margin-bottom:16px;">' +
          'Estos son los valores que paga la empresa según el plan de compensación. Podés ajustarlos si tenés otra condición fiscal o percepciones.' +
        '</div>' +

        '<div style="margin-bottom:12px;">' +
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">' +
            '<label style="font-weight:600; font-size:14px; color:#92400e;">Por cada cierre</label>' +
            '<div style="display:flex; align-items:center; gap:4px;">' +
              '<span style="font-weight:600; color:#92400e;">$</span>' +
              '<input type="number" id="simValorCierre" min="0" step="1000" value="324000" style="width:90px; padding:6px; font-size:14px; text-align:right; border:1px solid #f59e0b; border-radius:6px; background:white;">' +
            '</div>' +
          '</div>' +
          '<div style="font-size:11px; color:#78350f; line-height:1.5;">' +
            'Ganancia por cada producto comercializado.' +
          '</div>' +
        '</div>' +

        '<div>' +
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">' +
            '<label style="font-weight:600; font-size:14px; color:#92400e;">Por cada producto de red</label>' +
            '<div style="display:flex; align-items:center; gap:4px;">' +
              '<span style="font-weight:600; color:#92400e;">$</span>' +
              '<input type="number" id="simValorRed" min="0" step="100" value="37620" style="width:90px; padding:6px; font-size:14px; text-align:right; border:1px solid #f59e0b; border-radius:6px; background:white;">' +
            '</div>' +
          '</div>' +
          '<div style="font-size:11px; color:#78350f; line-height:1.5;">' +
            'Compensación económica asociada a las adquisiciones realizadas por la red de distribuidores.' +
          '</div>' +
        '</div>' +
      '</div>' +

      // SECCIÓN 2: EXPLICACIONES
      '<div style="background:#f9fafb; padding:16px; border-radius:12px; margin-bottom:24px; border:1px solid #e5e7eb;">' +
        '<div style="font-weight:700; font-size:16px; margin-bottom:16px; color:#111827;">📖 ¿Qué significa cada número?</div>' +

        '<div style="margin-bottom:16px;">' +
          '<div style="font-weight:600; font-size:14px; margin-bottom:6px;">🎯 Demos por mes</div>' +
          '<div style="background:#f5f5f5; padding:12px; border-radius:8px; font-size:13px; line-height:1.6; color:#666;">' +
            'Las presentaciones del sistema que hacés cada mes. Van atadas a los cierres: 3 demos = 1 cierre. Si movés esta barra, la de cierres se mueve sola.' +
          '</div>' +
        '</div>' +

        '<div style="margin-bottom:16px;">' +
          '<div style="font-weight:600; font-size:14px; margin-bottom:6px;">✅ Cierres</div>' +
          '<div style="background:#f5f5f5; padding:12px; border-radius:8px; font-size:13px; line-height:1.6; color:#666;">' +
            'Las ventas que concretás (sistemas instalados). Regla: 1 cierre = 3 demos. Si movés esta barra, la de demos se ajusta sola.' +
          '</div>' +
        '</div>' +

        '<div>' +
          '<div style="font-weight:600; font-size:14px; margin-bottom:6px;">🌳 Productos de tu red</div>' +
          '<div style="background:#f5f5f5; padding:12px; border-radius:8px; font-size:13px; line-height:1.6; color:#666;">' +
            'Compensación económica asociada a las adquisiciones realizadas por la red de distribuidores. En Mi Negocio → Mi Equipo, sumá los PB de toda tu organización.' +
          '</div>' +
        '</div>' +
      '</div>' +

      // SECCIÓN 3: SLIDERS + RESULTADO
      '<div style="background:linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding:16px; border-radius:12px; border:2px solid #3b82f6; margin-bottom:16px;">' +
        '<div style="font-weight:700; font-size:16px; margin-bottom:16px; color:#1e40af;">🎛️ Ajustá tus números</div>' +

        '<div style="margin-bottom:14px;">' +
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">' +
            '<span style="font-size:14px; font-weight:600; color:#374151;">Demos por mes: <b id="simDemosV" style="color:#1e40af;">30</b></span>' +
          '</div>' +
          '<input type="range" id="simDemos" min="0" max="90" step="3" value="30" style="width:100%; margin:0;">' +
        '</div>' +

        '<div style="margin-bottom:14px;">' +
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">' +
            '<span style="font-size:14px; font-weight:600; color:#374151;">Cierres: <b id="simCierresV" style="color:#1e40af;">10</b></span>' +
          '</div>' +
          '<input type="range" id="simCierres" min="0" max="30" step="1" value="10" style="width:100%; margin:0;">' +
        '</div>' +

        '<div style="margin-bottom:14px;">' +
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">' +
            '<span style="font-size:14px; font-weight:600; color:#374151;">Productos de tu red: <b id="simRedV" style="color:#1e40af;">100</b></span>' +
          '</div>' +
          '<input type="range" id="simRed" min="0" max="300" value="100" style="width:100%; margin:0;">' +
        '</div>' +

        '<div id="simResult" style="margin-top:16px; padding-top:16px; border-top:2px solid rgba(59,130,246,0.3);"></div>' +
      '</div>' +

      '<div class="tb-sub" style="font-size:12px; line-height:1.5;">💡 Los valores del plan pueden variar según tu condición fiscal y percepciones. Ajustalos arriba si es necesario.</div></div>';
  }
  function aplicarReglaDemosCierres(origen){
    var demosEl = $('simDemos');
    var cierresEl = $('simCierres');
    if (!demosEl || !cierresEl) return;
    if (origen === 'demos') {
      var demos = Math.max(0, Number(demosEl.value) || 0);
      demos = Math.round(demos / 3) * 3;
      if (demos > 90) demos = 90;
      if (demos < 0) demos = 0;
      var cierres = Math.floor(demos / 3);
      if (cierres > 30) cierres = 30;
      demosEl.value = String(demos);
      cierresEl.value = String(cierres);
    } else if (origen === 'cierres') {
      var cierres = Math.max(0, Math.round(Number(cierresEl.value) || 0));
      if (cierres > 30) cierres = 30;
      var demos = cierres * 3;
      if (demos > 90) { demos = 90; cierres = 30; }
      cierresEl.value = String(cierres);
      demosEl.value = String(demos);
    }
  }
  function calcSimulador(e){
    var origen = e && e.target ? e.target.id : '';
    if (origen === 'simDemos') aplicarReglaDemosCierres('demos');
    else if (origen === 'simCierres') aplicarReglaDemosCierres('cierres');
    var demos = Math.max(0, Number($('simDemos').value) || 0);
    var cierres = Math.max(0, Number($('simCierres').value) || 0);
    var red = Math.max(0, Number($('simRed').value) || 0);
    var valorCierre = Math.max(0, Number($('simValorCierre').value) || 324000);
    var valorRed = Math.max(0, Number($('simValorRed').value) || 37620);
    // Actualizar labels de los sliders
    var dv = $('simDemosV'); if(dv) dv.textContent = demos;
    var cv = $('simCierresV'); if(cv) cv.textContent = cierres;
    var rv = $('simRedV'); if(rv) rv.textContent = red;
    var com = cierres * valorCierre, net = red * valorRed;
    var f = function(n){ return '$' + Math.round(n).toLocaleString('es-AR'); };
    var conv = demos > 0 ? Math.round((cierres / demos) * 100) : 0;
    $('simResult').innerHTML =
      '<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid rgba(59,130,246,0.15);"><span style="font-size:13px;">Comercialización<br><small style="color:#666;">' + cierres + ' cierres × ' + f(valorCierre) + '</small></span><span style="font-weight:700; font-size:14px; color:#1e40af;">' + f(com) + '</span></div>' +
      '<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid rgba(59,130,246,0.15);"><span style="font-size:13px;">Red<br><small style="color:#666;">' + red + ' productos × ' + f(valorRed) + '</small></span><span style="font-weight:700; font-size:14px; color:#1e40af;">' + f(net) + '</span></div>' +
      '<div style="display:flex; justify-content:space-between; padding:12px 0 6px;"><span style="font-size:15px; font-weight:700;">Total del mes</span><span style="font-size:20px; font-weight:800; color:#059669;">' + f(com + net) + '</span></div>' +
      '<div style="text-align:center; font-size:11px; color:#666; padding-top:6px; border-top:1px solid rgba(59,130,246,0.1);">Conversión: ' + conv + '% (' + cierres + ' de ' + demos + ' demos)</div>';
  }

  /* ---------------- vistas y accesos ---------------- */
  function crearVistas(){
    if ($('view-botella')) return;
    var app = document.querySelector('.app');
    var s1 = document.createElement('section');
    s1.id = 'view-botella'; s1.className = 'view';
    s1.innerHTML = '<header class="top"><button class="back-btn" onclick="history.back()" aria-label="Volver">‹</button><button class="tools-btn" onclick="toggleToolsMenu(event)" aria-label="Herramientas" title="Herramientas">⚙️</button><h1>Comparativas</h1><div class="script">conciencia</div></header><div id="botellaCont"></div>';
    app.appendChild(s1);
    var s2 = document.createElement('section');
    s2.id = 'view-simulador'; s2.className = 'view';
    s2.innerHTML = '<header class="top"><button class="back-btn" onclick="history.back()" aria-label="Volver">‹</button><button class="tools-btn" onclick="toggleToolsMenu(event)" aria-label="Herramientas" title="Herramientas">⚙️</button><h1>Simulador</h1><div class="script">tu mes soñado</div></header><div id="simCont"></div>';
    app.appendChild(s2);
    window.__tableroSinTabs = true;
  }
  function abrirBotella(){
    crearVistas();
    showView('view-botella');
    var t1=$('tabs'); if(t1) t1.style.display='none';
    $('botellaCont').innerHTML = htmlBotella();
    var d=$('botPorDia'), p=$('botPrecio'), sh=$('botShare');
    if (d) d.oninput = calcBotella;
    if (p) p.oninput = calcBotella;
    if (sh) sh.onclick = function(){
      var url = 'https://wa.me/?text=' + encodeURIComponent(window.__botTexto || '');
      if (window.APPIWhatsApp && window.APPIWhatsApp.abrir) window.APPIWhatsApp.abrir(url);
      else window.open(url, '_blank', 'noopener');
    };
    bindCmp();
  }
  function abrirSimulador(){
    crearVistas();
    showView('view-simulador');
    var t2=$('tabs'); if(t2) t2.style.display='none';
    $('simCont').innerHTML = htmlSimulador();
    ['simDemos', 'simCierres', 'simRed', 'simValorCierre', 'simValorRed'].forEach(function(id){
      var el = $(id);
      if(el){ el.oninput = calcSimulador; el.onchange = calcSimulador; }
    });
    calcSimulador();
  }
  window.abrirBotella = abrirBotella;
  window.__inyectarHome = inyectarHome;
  window.abrirSimulador = abrirSimulador;

  /* ---------------- hooks ---------------- */
  function inyectarHome(){
    estilo();
    // Inyectar GPS en view-negocio
    var negocioView = $('view-negocio');
    if (negocioView && !$('gpsBlock')) {
      var header = negocioView.querySelector('header');
      if (header) header.insertAdjacentHTML('afterend', htmlGps());
    } else if ($('gpsBlock')) {
      var g = $('gpsBlock');
      g.outerHTML = htmlGps();
    }
    // La botella y el simulador viven en Herramientas. El Home ya no mantiene
    // la grilla antigua homeExtraKeep, eliminada con el timeline de v247.
  }

  // Enganches suaves: este script vive en el <head> y las funciones del
  // cuerpo se definen después, así que los envolvemos recién en load.
  function envolver(){
    if (window.__tableroWrapped) return;
    if (typeof window.showView !== 'function') return;
    window.__tableroWrapped = true;
    var origHome = window.renderHomeCompleto;
    if (typeof origHome === 'function') {
      window.renderHomeCompleto = function(){ var r = origHome.apply(this, arguments); try{ inyectarHome(); }catch(e){} return r; };
    }
    var origShow = window.showView;
    window.showView = function(id){ var r = origShow.apply(this, arguments); try{
      if (id === 'view-home') inyectarHome();
    }catch(e){} return r; };
    try{ inyectarHome(); }catch(e){}
  }
  if (document.readyState === 'complete') envolver();
  else window.addEventListener('load', envolver);
  setTimeout(function(){ try{ envolver(); inyectarHome(); }catch(e){} }, 1200);
})();
