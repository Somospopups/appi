/* ============================================================
   APPI · Tablero de comando (v241)
   ------------------------------------------------------------
   Cuatro piezas que convierten los números oficiales del
   negocio en metas diarias:

   1. GPS del mes: bonus oficial (12 PB + patrocinios de 9 PB)
      y ritmo 30 demos → 10 cierres.
   2. Comparativa de la botella: conciencia interactiva.
   3. Simulador de ganancias del plan de negocio.
   4. Stock personal dentro del presupuesto.
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
      '@media (min-width:1024px){.bot-eco-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}';
    document.head.appendChild(s);
  }

  /* ---------------- 1 · GPS DEL MES ---------------- */
  function datosGps(){
    var eq = equipo();
    var raiz = eq && Array.isArray(eq.personas) ? (eq.personas.find(function(p){ return p.nivel === 0; }) || eq.personas[0]) : null;
    var cul = culturaMes();
    var A = raiz ? (Number(raiz.pnAct) || 0) : cul.pb;
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
  function htmlBotella(){
    return '<div class="tb-card" style="margin:10px 2px">' +
      '<div class="tb-title"> La comparativa de la botella</div>' +
      '<div class="tb-sub">Mostrala en la demo: la plata y el planeta despiertan conciencia</div>' +
      '<div class="tb-row"><span>Botellas de 2 L por día</span><input class="tb-input" style="max-width:90px" id="botPorDia" type="number" min="1" max="40" value="2"></div>' +
      '<div class="tb-row"><span>Precio por botella ($)</span><input class="tb-input" style="max-width:120px" id="botPrecio" type="number" min="0" step="50" value="1500"></div>' +
      '<div id="botResult"></div>' +
      '<div class="bot-eco" id="botEco"></div>' +
      '<button type="button" class="tb-btn" id="botShare" style="width:100%;margin-top:12px">📤 Compartirla por WhatsApp</button></div>';
  }
  function calcBotella(){
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

  /* ---------------- 4 · STOCK PERSONAL ---------------- */
  function stockKey(){ return 'appi_stock_v1_' + uid(); }
  function leerStock(){ try{ return JSON.parse(localStorage.getItem(stockKey()) || '[]'); }catch(e){ return []; } }
  function htmlStock(){
    var items = leerStock();
    var filas = items.map(function(it, i){
      return '<div class="tb-row"><span>' + esc(it.nombre) + '</span><span style="display:flex;gap:6px;align-items:center">' +
        '<button type="button" class="tb-mini" data-stock-menos="' + i + '">−</button><b>' + it.cant + '</b>' +
        '<button type="button" class="tb-mini" data-stock-mas="' + i + '">+</button>' +
        '<button type="button" class="tb-mini" data-stock-del="' + i + '">✕</button></span></div>';
    }).join('');
    var total = items.reduce(function(s, it){ return s + (Number(it.cant) || 0); }, 0);
    return '<div class="tb-card" id="stockCard" style="margin:12px"><div class="tb-title">📦 Stock personal</div>' +
      '<div class="tb-sub">Lo que tenés en casa, a la vista · ' + total + ' unidad' + (total === 1 ? '' : 'es') + '</div>' +
      (filas || '<div class="tb-sub">Sin stock cargado.</div>') +
      '<div style="display:flex;gap:8px;margin-top:8px"><input class="tb-input" id="stockNombre" placeholder="Producto (ej: Iontrix 2)">' +
      '<input class="tb-input" id="stockCant" type="number" min="1" value="1" style="max-width:70px">' +
      '<button type="button" class="tb-btn" id="stockAdd">＋</button></div></div>';
  }
  function renderStock(){
    var host = document.querySelector('#view-presu .view-content') || $('view-presu');
    if (!host) return;
    var viejo = $('stockCardWrap');
    if (viejo) viejo.remove();
    var wrap = document.createElement('div');
    wrap.id = 'stockCardWrap';
    wrap.innerHTML = htmlStock();
    host.appendChild(wrap);
    wrap.querySelector('#stockAdd').onclick = function(){
      var nombre = $('stockNombre').value.trim();
      if (!nombre) return;
      var items = leerStock();
      items.push({ nombre: nombre, cant: Math.max(1, Number($('stockCant').value) || 1) });
      localStorage.setItem(stockKey(), JSON.stringify(items));
      renderStock();
    };
    wrap.querySelectorAll('[data-stock-mas]').forEach(function(b){ b.onclick = function(){ var it = leerStock(); it[+b.dataset.stockMas].cant++; localStorage.setItem(stockKey(), JSON.stringify(it)); renderStock(); }; });
    wrap.querySelectorAll('[data-stock-menos]').forEach(function(b){ b.onclick = function(){ var it = leerStock(); it[+b.dataset.stockMenos].cant = Math.max(0, it[+b.dataset.stockMenos].cant - 1); localStorage.setItem(stockKey(), JSON.stringify(it)); renderStock(); }; });
    wrap.querySelectorAll('[data-stock-del]').forEach(function(b){ b.onclick = function(){ var it = leerStock(); it.splice(+b.dataset.stockDel, 1); localStorage.setItem(stockKey(), JSON.stringify(it)); renderStock(); }; });
  }

  /* ---------------- vistas y accesos ---------------- */
  function crearVistas(){
    if ($('view-botella')) return;
    var app = document.querySelector('.app');
    var s1 = document.createElement('section');
    s1.id = 'view-botella'; s1.className = 'view';
    s1.innerHTML = '<header class="top"><button class="back-btn" onclick="history.back()" aria-label="Volver">‹</button><button class="tools-btn" onclick="toggleToolsMenu(event)" aria-label="Herramientas" title="Herramientas">⚙️</button><h1>La botella</h1><div class="script">conciencia</div></header><div id="botellaCont"></div>';
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
    $('botPorDia').oninput = calcBotella;
    $('botPrecio').oninput = calcBotella;
    calcBotella();
    $('botShare').onclick = function(){
      var url = 'https://wa.me/?text=' + encodeURIComponent(window.__botTexto || '');
      if (window.APPIWhatsApp && window.APPIWhatsApp.abrir) window.APPIWhatsApp.abrir(url);
      else window.open(url, '_blank', 'noopener');
    };
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
      if (id === 'view-presu') renderStock();
      if (id === 'view-home') inyectarHome();
    }catch(e){} return r; };
    try{ inyectarHome(); }catch(e){}
  }
  if (document.readyState === 'complete') envolver();
  else window.addEventListener('load', envolver);
  setTimeout(function(){ try{ envolver(); inyectarHome(); }catch(e){} }, 1200);
})();
