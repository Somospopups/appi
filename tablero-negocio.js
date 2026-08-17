/* ============================================================
   APPI · Tablero de comando (v241)
   ------------------------------------------------------------
   Cinco piezas que convierten los números oficiales del
   negocio en metas diarias:

   1. GPS del mes: bonus oficial (12 PB + patrocinios de 9 PB)
      y ritmo 30 demos → 10 cierres.
   2. Comparativa de la botella: conciencia interactiva.
   3. Simulador de ganancias del plan de negocio.
   4. Stock personal dentro del presupuesto.
   5. Duplicación del equipo leída de la Línea.
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
      var inicio = new Date(); inicio.setDate(1); inicio.setHours(0,0,0,0);
      var pb = 0, invitados = 0;
      Object.keys(data).forEach(function(k){
        var w = data[k] || {};
        var f = w.fecha ? new Date(w.fecha) : null;
        if (f && f >= inicio) { pb += Number(w.pb) || 0; invitados += Number(w.invitados) || 0; }
      });
      return { pb: pb, invitados: invitados };
    }catch(e){ return { pb: 0, invitados: 0 }; }
  }
  function mesActual(d){ var i = new Date(); i.setDate(1); i.setHours(0,0,0,0); return new Date(d) >= i; }
  function esc(s){ return String(s == null ? '' : s).replace(/</g, '&lt;'); }

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
      'body.dark .tb-mini{background:rgba(91,141,239,.15);color:#a8c0ff}';
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
    return '<details class="home-section-block" id="gpsBlock" open><summary class="mini-section-label"><span>🛰️</span> GPS del mes<em>⌄</em></summary><div class="tb-card">' +
      '<div class="tb-title">🛰️ GPS del mes</div>' +
      '<div class="tb-sub">Las reglas oficiales, en metas de hoy' + (g.conLinea ? '' : ' · cargá tu Línea para leer tus PB') + '</div>' +
      '<div class="tb-row"><span>Bonus: 12 PB personales</span><span class="' + (g.A >= 12 ? 'tb-ok' : 'tb-no') + '">' + g.A + ' / 12</span></div>' + barra(g.A, 12) +
      '<div class="tb-row"><span>Patrocinios con 9 PB</span><span class="' + (g.patrocinios9 >= 1 ? 'tb-ok' : 'tb-no') + '">' + g.patrocinios9 + ' / 2</span></div>' + barra(g.patrocinios9, 2) +
      '<div class="tb-row"><span>Ritmo: demos del mes</span><span>' + g.demos + ' / 30</span></div>' + barra(g.demos, 30) +
      '<div class="tb-row"><span>Cierres del mes</span><span>' + g.cierres + ' / 10</span></div>' + barra(g.cierres, 10) +
      '<div class="tb-sub" style="margin:6px 0 0">' + (bonusFull ? '🎉 Bonus completo este mes.' : bonus ? 'Vas encaminado: te falta un patrocinio más para el bonus completo.' : 'Hoy es un buen día para sumar PB y escribirle a alguien.') + '</div>' +
      '</div></details>';
  }

  /* ---------------- 2 · COMPARATIVA DE LA BOTELLA ---------------- */
  function htmlBotella(){
    return '<div class="tb-card" style="margin:10px 2px">' +
      '<div class="tb-title"> La comparativa de la botella</div>' +
      '<div class="tb-sub">Mostrala en la demo: los números despiertan conciencia</div>' +
      '<div class="tb-row"><span>Botellas de 2 L por día</span><input class="tb-input" style="max-width:90px" id="botPorDia" type="number" min="1" max="40" value="2"></div>' +
      '<div class="tb-row"><span>Precio por botella ($)</span><input class="tb-input" style="max-width:120px" id="botPrecio" type="number" min="0" step="50" value="1500"></div>' +
      '<div id="botResult"></div>' +
      '<button type="button" class="tb-btn" id="botShare" style="width:100%;margin-top:8px">📤 Compartirla por WhatsApp</button></div>';
  }
  function calcBotella(){
    var d = Math.max(1, Number($('botPorDia').value) || 2);
    var p = Math.max(0, Number($('botPrecio').value) || 0);
    var dia = d * p, mes = dia * 30, anio = mes * 12, tres = anio * 3;
    var f = function(n){ return '$' + Math.round(n).toLocaleString('es-AR'); };
    $('botResult').innerHTML =
      '<div class="tb-row"><span>Por día</span><span>' + f(dia) + '</span></div>' +
      '<div class="tb-row"><span>Por mes (30 días)</span><span>' + f(mes) + '</span></div>' +
      '<div class="tb-row"><span>Por año</span><span class="tb-big">' + f(anio) + '</span></div>' +
      '<div class="tb-row"><span>En 3 años</span><span class="tb-big tb-no">' + f(tres) + '</span></div>' +
      '<div class="tb-sub" style="margin-top:6px">Con el sistema, ese dinero vuelve a tu bolsillo: ' + f(anio) + ' por año que hoy se van en botellas.</div>';
    window.__botTexto = '🍶 Comparativa de la botella (2 L):\n' + d + ' botellas por día a ' + f(p) + ' cada una.\nPor mes: ' + f(mes) + '\nPor año: ' + f(anio) + '\nEn 3 años: ' + f(tres) + '\nCon el sistema de purificación, ese dinero vuelve a tu bolsillo.';
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
            'Comisión por cada sistema vendido. Incluye bono de comercialización + bono de instalación.' +
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
            'Bono mensual por cada producto que compra tu red de clientes y distribuidores.' +
          '</div>' +
        '</div>' +
      '</div>' +

      // SECCIÓN 2: TUS NÚMEROS
      '<div style="background:#f9fafb; padding:16px; border-radius:12px; margin-bottom:24px; border:1px solid #e5e7eb;">' +
        '<div style="font-weight:700; font-size:16px; margin-bottom:16px; color:#111827;">📊 Tus números del mes</div>' +

        '<div style="margin-bottom:20px;">' +
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">' +
            '<label style="font-weight:600; font-size:15px;">Demos por mes</label>' +
            '<input type="number" id="simDemos" min="0" max="60" value="30" style="width:70px; padding:8px; font-size:16px; text-align:center; border:1px solid #ddd; border-radius:8px;">' +
          '</div>' +
          '<div style="background:#f5f5f5; padding:12px; border-radius:8px; font-size:13px; line-height:1.6; color:#666;">' +
            '<b>¿Qué son?</b> Las presentaciones del sistema que hacés cada mes.<br>' +
            '<b>¿Cómo contarlos?</b> Sumá todas las demos que mostrás: en casas, por Zoom, en eventos. Si hacés 1 demo por día hábil, son ~22 al mes.' +
          '</div>' +
        '</div>' +

        '<div style="margin-bottom:20px;">' +
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">' +
            '<label style="font-weight:600; font-size:15px;">Cierres</label>' +
            '<input type="number" id="simCierres" min="0" max="30" value="10" style="width:70px; padding:8px; font-size:16px; text-align:center; border:1px solid #ddd; border-radius:8px;">' +
          '</div>' +
          '<div style="background:#f5f5f5; padding:12px; border-radius:8px; font-size:13px; line-height:1.6; color:#666;">' +
            '<b>¿Qué son?</b> Las ventas que concretás (sistemas instalados).<br>' +
            '<b>Referencia:</b> En promedio, de cada 3 demos se cierra 1 venta (33% de conversión). Si hacés 30 demos, esperarías ~10 cierres.' +
          '</div>' +
        '</div>' +

        '<div>' +
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">' +
            '<label style="font-weight:600; font-size:15px;">Productos de tu red</label>' +
            '<input type="number" id="simRed" min="0" max="300" value="100" style="width:70px; padding:8px; font-size:16px; text-align:center; border:1px solid #ddd; border-radius:8px;">' +
          '</div>' +
          '<div style="background:#f5f5f5; padding:12px; border-radius:8px; font-size:13px; line-height:1.6; color:#666;">' +
            '<b>¿Qué son?</b> Los productos que compra toda tu red de clientes y distribuidores cada mes.<br>' +
            '<b>¿Dónde verlo?</b> En Mi Negocio → Mi Equipo, sumá los PB (Puntos de Bonificación) de toda tu organización. Cada PB equivale aproximadamente a 1 producto.' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div id="simResult" style="margin-top:24px; padding:16px; background:linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius:12px; border:2px solid #3b82f6;"></div>' +
      '<div class="tb-sub" style="margin-top:16px; font-size:12px; line-height:1.5;">💡 Los valores del plan pueden variar según tu condición fiscal y percepciones. Ajustalos arriba si es necesario.</div></div>';
  }
  function calcSimulador(){
    var demos = Math.max(0, Number($('simDemos').value) || 0);
    var cierres = Math.min(demos, Math.max(0, Number($('simCierres').value) || 0));
    var red = Math.max(0, Number($('simRed').value) || 0);
    var valorCierre = Math.max(0, Number($('simValorCierre').value) || 324000);
    var valorRed = Math.max(0, Number($('simValorRed').value) || 37620);
    var com = cierres * valorCierre, net = red * valorRed;
    var f = function(n){ return '$' + Math.round(n).toLocaleString('es-AR'); };
    var conv = demos > 0 ? Math.round((cierres / demos) * 100) : 0;
    $('simResult').innerHTML =
      '<div style="font-weight:700; font-size:16px; margin-bottom:12px; color:#1e40af;">📈 Resultado del mes</div>' +
      '<div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid rgba(59,130,246,0.2);"><span style="font-size:14px;">Comercialización<br><small style="color:#666;">' + cierres + ' cierres × ' + f(valorCierre) + '</small></span><span style="font-weight:700; font-size:15px; color:#1e40af;">' + f(com) + '</span></div>' +
      '<div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid rgba(59,130,246,0.2);"><span style="font-size:14px;">Red<br><small style="color:#666;">' + red + ' productos × ' + f(valorRed) + '</small></span><span style="font-weight:700; font-size:15px; color:#1e40af;">' + f(net) + '</span></div>' +
      '<div style="display:flex; justify-content:space-between; padding:14px 0 8px;"><span style="font-size:16px; font-weight:700;">Total del mes</span><span style="font-size:22px; font-weight:800; color:#059669;">' + f(com + net) + '</span></div>' +
      '<div style="text-align:center; font-size:12px; color:#666; padding-top:8px; border-top:1px solid rgba(59,130,246,0.15);">Conversión: ' + conv + '% (' + cierres + ' de ' + demos + ' demos)</div>';
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

  /* ---------------- 5 · DUPLICACIÓN DEL EQUIPO ---------------- */
  function htmlDuplicacion(){
    var eq = equipo();
    if (!eq || !Array.isArray(eq.personas)) return '';
    var raiz = eq.personas.find(function(p){ return p.nivel === 0; }) || eq.personas[0];
    var hijos = raiz ? (raiz.hijos || []) : [];
    if (!hijos.length) return '';
    var activos = hijos.filter(function(h){ return (Number(h.pnAct) || 0) > 0; });
    var duplican = hijos.filter(function(h){ return (h.hijos || []).length > 0 && (Number(h.pnAct) || 0) > 0; });
    var filas = hijos.map(function(h){
      var pb = Number(h.pnAct) || 0;
      var tag = pb > 0 && (h.hijos || []).length ? '🌱 duplica' : pb > 0 ? '⚡ activo' : '💤 en pausa';
      return '<div class="tb-row"><span>' + esc(h.nombre) + ' · ' + esc(h.cat || '') + '</span><span>' + pb + ' PB · ' + tag + '</span></div>';
    }).join('');
    return '<div class="tb-card" id="dupCard" style="margin:12px"><div class="tb-title">🌱 Duplicación de este mes</div>' +
      '<div class="tb-sub">' + activos.length + ' de ' + hijos.length + ' patrocinados directos activos · ' + duplican.length + ' ya duplican</div>' + filas + '</div>';
  }
  function renderDuplicacion(){
    var host = $('view-equipo');
    if (!host) return;
    var viejo = $('dupCardWrap');
    if (viejo) viejo.remove();
    var html = htmlDuplicacion();
    if (!html) return;
    var wrap = document.createElement('div');
    wrap.id = 'dupCardWrap';
    wrap.innerHTML = html;
    var first = host.querySelector('.tb-card') || host.firstElementChild;
    host.insertBefore(wrap, host.children[1] || null);
  }

  /* ---------------- vistas y accesos ---------------- */
  function crearVistas(){
    if ($('view-botella')) return;
    var s1 = document.createElement('section');
    s1.id = 'view-botella'; s1.className = 'view';
    s1.innerHTML = '<header class="top"><button class="back-btn" onclick="history.back()" aria-label="Volver">‹</button><button class="tools-btn" onclick="toggleToolsMenu(event)" aria-label="Herramientas" title="Herramientas">⚙️</button><h1>La botella</h1><div class="script">conciencia</div></header><div id="botellaCont"></div>';
    document.body.appendChild(s1);
    var s2 = document.createElement('section');
    s2.id = 'view-simulador'; s2.className = 'view';
    s2.innerHTML = '<header class="top"><button class="back-btn" onclick="history.back()" aria-label="Volver">‹</button><button class="tools-btn" onclick="toggleToolsMenu(event)" aria-label="Herramientas" title="Herramientas">⚙️</button><h1>Simulador</h1><div class="script">tu mes soñado</div></header><div id="simCont"></div>';
    document.body.appendChild(s2);
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
    if (!$('gpsBlock') && $('carreraBlock')) $('carreraBlock').insertAdjacentHTML('afterend', htmlGps());
    else if ($('gpsBlock')) { var g = $('gpsBlock'); g.outerHTML = htmlGps(); }
    var extra = $('homeExtraKeep');
    if (extra && !$('miniBotella')) {
      var grid = extra.querySelector('.home-mini-tools');
      if (grid) grid.insertAdjacentHTML('beforeend',
        '<button type="button" class="home-mini-tool" id="miniBotella" onclick="abrirBotella()"><div class="home-mini-ico" style="background:linear-gradient(135deg,#5b8def,#3ad0a4)">🍶</div><div class="home-mini-txt"><strong>La botella</strong><small>Conciencia en la demo</small></div></button>' +
        '<button type="button" class="home-mini-tool" id="miniSim" onclick="abrirSimulador()"><div class="home-mini-ico" style="background:linear-gradient(135deg,#f5b301,#ff8f6b)">🧮</div><div class="home-mini-txt"><strong>Simulador</strong><small>Tu mes soñado</small></div></button>');
    }
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
      if (id === 'view-equipo') renderDuplicacion();
      if (id === 'view-home') inyectarHome();
    }catch(e){} return r; };
    try{ inyectarHome(); }catch(e){}
  }
  if (document.readyState === 'complete') envolver();
  else window.addEventListener('load', envolver);
  setTimeout(function(){ try{ envolver(); inyectarHome(); }catch(e){} }, 1200);
})();
