/* ============================================================
   APPI · Carrera Empresarial PSA (v228)
   ------------------------------------------------------------
   Muestra la categoría oficial del distribuidor y lo que falta
   para el próximo pase, con las reglas reales del Flex
   Marketing Plan: volúmenes (A) personal, (B) organizaciones
   de DJ y (C) organizaciones de D, calculados sobre la Línea
   Descendente cargada en Mi Equipo.

   Todo se calcula con datos que la app ya tiene: no agrega
   tablas ni migraciones.
   ============================================================ */
(function(){
  'use strict';

  var CATEGORIAS = ['DJ', 'D', 'DC', 'CE', 'L', 'LE', 'EJ', 'E'];
  var NOMBRES = {
    DJ: 'Distribuidor Junior', D: 'Distribuidor', DC: 'Distribuidor Calificado',
    CE: 'Coordinador de Equipo', L: 'Líder', LE: 'Líder Ejecutivo',
    EJ: 'Ejecutivo', E: 'Empresa'
  };
  var ICONOS = {
    DJ: '🌱', D: '💧', DC: '⭐', CE: '🤝', L: '🏅', LE: '🌟', EJ: '💼', E: '🏆'
  };
  // Volúmenes de referencia para categorías altas (El Gran Negocio).
  var VOLUMEN_REF = { CE: 120, L: 400, LE: 2000, EJ: 10000 };
  // Ejemplos de ganancias del material oficial (solo referencia).
  var GANANCIAS_REF = [
    'DC de 52 PB: ≈ $302.515 por mes',
    'CE de 300 PB: ≈ $3.250.000 por mes',
    'Coordinación (120 PB): ≈ $118.000 por mes de asistencia',
    'Liderazgo (2.000 PB): ≈ $990.000 por mes',
    'Ejecutivo (10.000 PB): ≈ $5.445.000 por mes'
  ];

  function uid(){
    return window.APPIAuth && window.APPIAuth.userId ? window.APPIAuth.userId() : '';
  }

  function normalizarCat(valor){
    var c = String(valor || '').replace(/[^A-Za-z]/g, '').toUpperCase();
    if (CATEGORIAS.indexOf(c) >= 0) return c;
    if (c === 'DISTRIBUIDORJUNIOR') return 'DJ';
    if (c === 'DISTRIBUIDOR') return 'D';
    if (c === 'DISTRIBUIDORCALIFICADO') return 'DC';
    if (c === 'COORDINADOR' || c === 'COORDINADORDEEQUIPO') return 'CE';
    if (c === 'LIDER') return 'L';
    if (c === 'LIDEREJECUTIVO') return 'LE';
    return '';
  }

  function equipo(){
    try{
      return JSON.parse(localStorage.getItem('equipoData') || 'null');
    }catch(e){ return null; }
  }

  // Volumen de una persona = su PB personal + el de toda su línea.
  function volumen(p, memo){
    if (memo.has(p)) return memo.get(p);
    var total = Number(p.pnAct) || 0;
    (p.hijos || []).forEach(function(h){ total += volumen(h, memo); });
    memo.set(p, total);
    return total;
  }

  // (A) personal, (B) orgs. de DJ directas, (C) orgs. de D directas,
  // y conteo de organizaciones que cumplen el mínimo del próximo pase.
  function metricas(){
    var eq = equipo();
    if (!eq || !Array.isArray(eq.personas) || !eq.personas.length) return null;
    var memo = new Map();
    var raiz = eq.personas.find(function(p){ return p.nivel === 0; }) || eq.personas[0];
    var A = Number(raiz.pnAct) || 0;
    var B = 0, C = 0, Dvol = 0;
    var orgsD13 = 0, orgsDC50 = 0;
    (raiz.hijos || []).forEach(function(h){
      var v = volumen(h, memo);
      var cat = normalizarCat(h.cat);
      if (cat === 'DJ') B += v;
      if (cat === 'D') { C += v; if (v >= 13) orgsD13++; }
      if (cat === 'DC') { Dvol += v; if (v >= 50) orgsDC50++; }
    });
    // Mantenimiento: PB personales de los últimos 3 meses (planilla).
    var meses = [Number(raiz.m2) || 0, Number(raiz.m1) || 0, A];
    // Anchura: patrocinios directos dados de alta este mes.
    var inicio = new Date(); inicio.setDate(1); inicio.setHours(0, 0, 0, 0);
    var anchura = (raiz.hijos || []).filter(function(h){
      return h.alta && new Date(h.alta) >= inicio;
    }).length;
    // Pareto: cuánto aporta el 20% más fuerte de la organización.
    var todas = [];
    (function juntar(p){ (p.hijos || []).forEach(function(h){ todas.push(h); juntar(h); }); })(raiz);
    var suma = todas.reduce(function(s, p){ return s + (Number(p.pnAct) || 0); }, 0);
    var orden = todas.slice().sort(function(a, b){ return (Number(b.pnAct) || 0) - (Number(a.pnAct) || 0); });
    var top = orden.slice(0, Math.max(1, Math.ceil(orden.length * 0.2)));
    var sumaTop = top.reduce(function(s, p){ return s + (Number(p.pnAct) || 0); }, 0);
    return {
      A: A, B: B, C: C,
      orgsD13: orgsD13, orgsDC50: orgsDC50,
      categoria: normalizarCat(eq.titular && eq.titular.categoria) || normalizarCat(raiz.cat) || 'DJ',
      meses: meses, anchura: anchura,
      pareto: suma ? Math.round(sumaTop / suma * 100) : 0,
      gente: todas.length
    };
  }

  // Lo que falta para el próximo pase, en criollo.
  function progreso(m){
    if (!m) return null;
    var cat = m.categoria;
    var idx = CATEGORIAS.indexOf(cat);
    if (idx < 0 || idx >= CATEGORIAS.length - 1) {
      return { cat: cat, siguiente: null };
    }
    var sig = CATEGORIAS[idx + 1];
    var r = { cat: cat, siguiente: sig, barras: [], checklist: [] };

    if (cat === 'DJ') {
      r.texto = 'Para Distribuidor: (A) tu volumen personal + (B) tus DJ directos = 13 PB como mínimo.';
      r.barras.push({ etiqueta: '(A)+(B) PB', actual: m.A + m.B, meta: 13 });
      r.checklist.push({ id: 'kit', texto: 'Kit de acceso y primer purificador' });
    } else if (cat === 'D') {
      r.texto = 'Para Distribuidor Calificado: (A)+(B) = 13 PB en primera generación, con 3 organizaciones de Distribuidor en líneas distintas.';
      r.barras.push({ etiqueta: '(A)+(B) PB', actual: m.A + m.B, meta: 13 });
      r.barras.push({ etiqueta: 'Organizaciones de D con 13 PB', actual: m.orgsD13, meta: 3 });
      r.checklist.push({ id: 'capacitacion', texto: 'Programa de Capacitación Básica completo' });
    } else if (cat === 'DC') {
      r.texto = 'Para Coordinador de Equipo: (A+B+C) = 50 PB con 3 organizaciones de DC, 5 corazones en 12 meses y carta de intención.';
      r.barras.push({ etiqueta: '(A+B+C) PB', actual: m.A + m.B + m.C, meta: 50 });
      r.barras.push({ etiqueta: 'Organizaciones de DC con 50 PB', actual: m.orgsDC50, meta: 3 });
      r.checklist.push({ id: 'corazones', texto: 'Corazones en 12 meses', contador: 5 });
      r.checklist.push({ id: 'carta', texto: 'Carta de intención presentada' });
    } else {
      var ref = VOLUMEN_REF[cat] || VOLUMEN_REF[sig];
      r.texto = 'Para ' + NOMBRES[sig] + ': volumen de referencia ' + (VOLUMEN_REF[sig] || ref) + ' PB de organización (según El Gran Negocio). Seguimos sumando los requisitos exactos de esta etapa.';
      r.barras.push({ etiqueta: 'Volumen de organización (ref.)', actual: m.A + m.B + m.C, meta: VOLUMEN_REF[sig] || 0 });
    }
    return r;
  }

  // ---------------- checklist guardada en el dispositivo ----------------
  function claveCheck(){ return 'appi_carrera_check_v1_' + uid(); }
  function leerCheck(){
    try{ return JSON.parse(localStorage.getItem(claveCheck()) || '{}'); }catch(e){ return {}; }
  }
  function guardarCheck(v){
    try{ localStorage.setItem(claveCheck(), JSON.stringify(v)); }catch(e){}
  }

  function estilo(){
    if (document.getElementById('carreraStyle')) return;
    var s = document.createElement('style');
    s.id = 'carreraStyle';
    s.textContent = '.carrera-card{margin:8px 2px;padding:14px;border-radius:18px;background:linear-gradient(135deg,rgba(58,208,164,.10),rgba(91,141,239,.12));border:1px solid rgba(58,208,164,.3)}' +
      '.carrera-top{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:950;color:#168765}' +
      '.carrera-top .ico{font-size:21px}' +
      '.carrera-vol{margin-top:6px;font-size:11px;font-weight:800;color:#556277}' +
      'body.dark .carrera-vol{color:#b8b9c5}' +
      '.carrera-bar{margin-top:8px}' +
      '.carrera-bar small{display:flex;justify-content:space-between;font-size:10px;font-weight:850;color:#556277}' +
      'body.dark .carrera-bar small{color:#b8b9c5}' +
      '.carrera-bar .track{height:7px;border-radius:99px;background:rgba(80,90,130,.12);overflow:hidden}' +
      '.carrera-bar .fill{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#3ad0a4,#5b8def)}' +
      '.carrera-texto{margin-top:9px;font-size:11px;font-weight:700;color:#343441;line-height:1.5}' +
      'body.dark .carrera-texto{color:#e6e6f0}' +
      '.carrera-check{margin-top:8px;display:grid;gap:6px}' +
      '.carrera-check label{display:flex;align-items:center;gap:7px;font-size:11px;font-weight:750;color:#343441}' +
      'body.dark .carrera-check label{color:#e6e6f0}' +
      '.carrera-check input{accent-color:#168765}' +
      '.carrera-corazones button{border:0;background:none;font-size:15px;cursor:pointer;padding:1px}' +
      '.carrera-det{margin-top:9px;font-size:10.5px;color:#556277}' +
      '.carrera-det ul{margin:5px 0 0;padding-left:16px}';
    document.head.appendChild(s);
  }

  // Mantenimiento de categoría: 2 de 3 meses con el PB mínimo.
  function htmlMantenimiento(m){
    var umbral = m.categoria === 'D' ? 2 : (m.categoria === 'DC' ? 17 : 0);
    if (!umbral) return '';
    var nombres = ['hace 2 meses', 'mes pasado', 'este mes'];
    var cumples = m.meses.filter(function(v){ return v >= umbral; }).length;
    var detalle = m.meses.map(function(v, i){
      return nombres[i] + ' ' + (v >= umbral ? '✓' : '·') + ' ' + v + ' PB';
    }).join(' · ');
    var alerta = (cumples === 0)
      ? ' ⚠️ Todavía no cumpliste ningún mes: este mes es clave para conservar la categoría.'
      : (cumples === 1 ? ' Te falta un mes cumplido más.' : ' ¡Mantenimiento asegurado!');
    return '<div class="carrera-texto" style="margin-top:7px"><b>Mantenimiento (' +
      (m.categoria === 'D' ? '(A+B) ≥ 2 PB' : '(A+B+C) ≥ 17 PB') +
      ', 2 de 3 meses):</b> ' + detalle + '.' + alerta + '</div>';
  }

  function htmlCard(){
    estilo();
    var m = metricas();
    if (!m) return '';   // sin Línea Descendente no hay carrera que medir
    var p = progreso(m);
    var check = leerCheck();

    var barras = (p.barras || []).map(function(b){
      var pct = b.meta ? Math.min(100, Math.round(b.actual / b.meta * 100)) : 0;
      return '<div class="carrera-bar"><small><span>' + b.etiqueta + '</span><span>' + b.actual + ' / ' + b.meta + '</span></small>' +
        '<span class="track"><span class="fill" style="width:' + pct + '%"></span></span></div>';
    }).join('');

    var checklist = (p.checklist || []).map(function(c){
      if (c.contador) {
        var n = Number(check[c.id]) || 0;
        var botones = '';
        for (var i = 1; i <= c.contador; i++) {
          botones += '<button type="button" data-corazon="' + i + '">' + (i <= n ? '❤️' : '🤍') + '</button>';
        }
        return '<label class="carrera-corazones">' + c.texto + ' (' + n + '/' + c.contador + ') ' + botones + '</label>';
      }
      return '<label><input type="checkbox" data-check="' + c.id + '"' + (check[c.id] ? ' checked' : '') + '> ' + c.texto + '</label>';
    }).join('');

    var detalle = '<details class="carrera-det"><summary>Ver la carrera completa y ganancias de referencia</summary><ul>' +
      CATEGORIAS.map(function(c){
        return '<li>' + ICONOS[c] + ' <b>' + NOMBRES[c] + '</b>' + (VOLUMEN_REF[c] ? ' · ' + VOLUMEN_REF[c] + ' PB ref.' : '') + '</li>';
      }).join('') +
      '</ul><ul>' + GANANCIAS_REF.map(function(g){ return '<li>' + g + '</li>'; }).join('') + '</ul>' +
      '<p>Valores del material oficial PSA; pueden variar por condición fiscal.</p></details>';

    return '<details class="home-section-block" id="carreraBlock" open>' +
      '<summary class="mini-section-label"><span>🏅</span> Mi carrera<em>⌄</em></summary>' +
      '<div class="carrera-card">' +
        '<div class="carrera-top"><span class="ico">' + (ICONOS[p.cat] || '🌱') + '</span>' + (NOMBRES[p.cat] || p.cat) + '</div>' +
        '<div class="carrera-vol">(A) ' + m.A + ' PB personal · (B) ' + m.B + ' · (C) ' + m.C + '</div>' +
        '<div class="carrera-texto" style="margin-top:9px"><b>Lectura de tu organización:</b> ' +
          (m.gente
            ? 'anchura ' + m.anchura + ' patrocinio' + (m.anchura === 1 ? '' : 's') + ' nuevo' + (m.anchura === 1 ? '' : 's') + ' este mes · el 20% más fuerte genera el ' + m.pareto + '% del PB.'
            : 'cargá tu Línea Descendente para ver anchura y Pareto.') + '</div>' +
        htmlMantenimiento(m) +
        (p.siguiente
          ? '<div class="carrera-texto"><b>Próximo pase: ' + NOMBRES[p.siguiente] + '.</b> ' + p.texto + '</div>' + barras +
            (checklist ? '<div class="carrera-check">' + checklist + '</div>' : '')
          : '<div class="carrera-texto">🏆 Categoría máxima de la carrera. ¡A duplicar líderes!</div>') +
        detalle +
      '</div>' +
    '</details>';
  }

  function vincular(){
    var block = document.getElementById('carreraBlock');
    if (!block) return;
    block.querySelectorAll('[data-check]').forEach(function(inp){
      inp.onchange = function(){
        var v = leerCheck();
        v[inp.dataset.check] = inp.checked;
        guardarCheck(v);
      };
    });
    block.querySelectorAll('[data-corazon]').forEach(function(b){
      b.onclick = function(){
        var v = leerCheck();
        var n = Number(v.corazones) || 0;
        var elegido = Number(b.dataset.corazon);
        v.corazones = (n === elegido) ? elegido - 1 : elegido;
        guardarCheck(v);
        render();
      };
    });
  }

  function render(){
    var list = document.getElementById('negWrap') || document.getElementById('toolsList');
    if (!list || !uid()) return;
    var viejo = document.getElementById('carreraBlock');
    if (viejo) viejo.remove();
    var html = htmlCard();
    if (html) list.insertAdjacentHTML('afterbegin', html);
    vincular();
  }

  window.APPICarrera = {
    categorias: CATEGORIAS,
    nombres: NOMBRES,
    metricas: metricas,
    progreso: progreso,
    normalizarCat: normalizarCat,
    render: render
  };
})();
