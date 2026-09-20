/* ============================================================
   APPI · Organigrama Interactivo de Próxima Categoría PSA
   Estética visual nativa de APPI:
   - Fondos suaves con glassmorphism claro (rgba(255,255,255,0.78))
   - Tipografía del sistema (#1c1c1e, #777887), bordes sutiles y curvas suaves
   - Acentos turquesa esmeralda (#3ad0a4), azul APPI (#5b8def), y tonos oficiales
   - Enfoque directo: Qué tenés, qué te falta exactamente para subir a la próxima categoría
   - Filtro ESTRICTO por rol/categoría al elegir personas para cada casillero
   - Ubicación en MI NEGOCIO:
     1. Banner de datos (#embudoKpi)
     2. Organigrama interactivo de próxima categoría
     3. 4 Botones de Mi Negocio (#negGrid)
     4. Botón de Reporte de Bonos (#bonosCard) debajo de todo
   ============================================================ */

(function(){
  if (window.APPIPlanCarrera) return;

  var LS_SAVED_PICKS = 'appi_carrera_picks_v1';

  /*
   Jerarquía Oficial PSA (CDE / Flex Marketing Plan):
   DJ (Distribuidor Junior) -> D (Distribuidor)
   D (Distribuidor) -> DC (Distribuidor Calificado)
   DC (Distribuidor Calificado) -> CE (Coordinador de Equipo)
   CE (Coordinador) -> L (Líder de Equipo)
   L (Líder / Líder Pionero) -> LE (Líder Ejecutivo)
   LE (Líder Ejecutivo) -> EJ (Ejecutivo)
  */

  var PLAN_REGLAS = {
    'D': {
      metaCat: 'D',
      nombre: 'Distribuidor (D)',
      metaBadge: 'Pase a Distribuidor',
      tiempo: '1 mes calendario o arrastre',
      personalReq: 13,
      personalDesc: 'Tu volumen personal + DJ directos',
      slots: [
        { rol: 'DJ', rolesPermitidos: ['DJ', 'JUNIOR'], pbMin: 0, desc: 'Línea 1 · DJ directo' },
        { rol: 'DJ', rolesPermitidos: ['DJ', 'JUNIOR'], pbMin: 0, desc: 'Línea 2 · DJ directo' }
      ],
      equipoPbTotal: 13,
      beneficios: 'Descuento 3% en compras con PB + 5% sobre DJ directos + categoría confirmada.',
      queFalta: 'Alcanzar 13 PB entre tus ventas y tus DJ directos, y completar la Capacitación Básica.'
    },
    'DC': {
      metaCat: 'DC',
      nombre: 'Distribuidor Calificado (DC)',
      metaBadge: 'Pase a Distribuidor Calificado',
      tiempo: '1 mes calendario',
      personalReq: 13,
      personalDesc: 'Tus PB personales (mín. 13 PB)',
      slots: [
        { rol: 'D', rolesPermitidos: ['D', 'DISTRIBUIDOR'], pbMin: 13, desc: 'Línea 1 · Distribuidor (mín. 13 PB)' },
        { rol: 'D', rolesPermitidos: ['D', 'DISTRIBUIDOR'], pbMin: 13, desc: 'Línea 2 · Distribuidor (mín. 13 PB)' },
        { rol: 'D', rolesPermitidos: ['D', 'DISTRIBUIDOR'], pbMin: 13, desc: 'Línea 3 · Distribuidor (mín. 13 PB)' }
      ],
      equipoPbTotal: 52, // 13 personal + 3x13 líneas
      beneficios: 'Descuento 7% con PB, 15% sobre DJ, 10% sobre Distribuidores directos y 5% de asistencia.',
      queFalta: 'Tener tus 13 PB personales y 3 Distribuidores directos con al menos 13 PB cada uno en el mes.'
    },
    'CE': {
      metaCat: 'CE',
      nombre: 'Coordinador de Equipo (CE)',
      metaBadge: 'Pase a Coordinador de Equipo',
      tiempo: '2 meses calendario consecutivos',
      personalReq: 50,
      personalDesc: 'Volumen personal y grupo base (mín. 50 PB)',
      slots: [
        { rol: 'DC', rolesPermitidos: ['DC', 'CALIFICADO', 'DISTRIBUIDOR CALIFICADO'], pbMin: 50, desc: 'Línea 1 · Distribuidor Calificado (mín. 50 PB)' },
        { rol: 'DC', rolesPermitidos: ['DC', 'CALIFICADO', 'DISTRIBUIDOR CALIFICADO'], pbMin: 50, desc: 'Línea 2 · Distribuidor Calificado (mín. 50 PB)' },
        { rol: 'DC', rolesPermitidos: ['DC', 'CALIFICADO', 'DISTRIBUIDOR CALIFICADO'], pbMin: 50, desc: 'Línea 3 · Distribuidor Calificado (mín. 50 PB)' }
      ],
      equipoPbTotal: 200,
      beneficios: 'Compensaciones Flex del 18% sobre DJ, 13% sobre D y hasta 8% sobre organizaciones DC.',
      queFalta: '3 Organizaciones de DC con 50 PB cada una durante 2 meses consecutivos + 5 Corazones en el año.'
    },
    'L': {
      metaCat: 'L',
      nombre: 'Líder de Equipo (L)',
      metaBadge: 'Pase a Líder de Equipo',
      tiempo: '2 a 3 meses consecutivos',
      personalReq: 50,
      personalDesc: 'Volumen personal de calificación',
      slots: [
        { rol: 'CE', rolesPermitidos: ['CE', 'COORDINADOR'], pbMin: 180, desc: 'Línea Coordinador (180+ PB)' },
        { rol: 'DC', rolesPermitidos: ['DC', 'CALIFICADO'], pbMin: 50, desc: 'Línea 1 · Distribuidor Calificado (50+ PB)' },
        { rol: 'DC', rolesPermitidos: ['DC', 'CALIFICADO'], pbMin: 50, desc: 'Línea 2 · Distribuidor Calificado (50+ PB)' },
        { rol: 'D', rolesPermitidos: ['D', 'DISTRIBUIDOR'], pbMin: 13, desc: 'Línea Distribuidor Activo (13+ PB)' }
      ],
      equipoPbTotal: 400,
      beneficios: 'Máximo nivel de liderazgo, regalías de organización, Bonus 1 y Bonus 2 de red.',
      queFalta: 'Desarrollar Coordinadores y DCs activos alcanzando 400 PB totales de red.'
    },
    'LE': {
      metaCat: 'LE',
      nombre: 'Líder Ejecutivo (LE)',
      metaBadge: 'Pase a Líder Ejecutivo',
      tiempo: 'Calificación con Líderes calificados y volumen de grupo',
      personalReq: 50,
      personalDesc: 'Volumen personal y grupo base (mín. 50 PB)',
      slots: [
        { rol: 'L', rolesPermitidos: ['L', 'LIDER', 'LÍDER', 'LÍDER DE EQUIPO', 'LÍDER PIONERO'], pbMin: 300, desc: 'Línea 1 · Líder calificado directo' },
        { rol: 'L', rolesPermitidos: ['L', 'LIDER', 'LÍDER', 'LÍDER DE EQUIPO', 'LÍDER PIONERO'], pbMin: 300, desc: 'Línea 2 · Líder calificado directo' },
        { rol: 'CE', rolesPermitidos: ['CE', 'COORDINADOR'], pbMin: 180, desc: 'Línea Coordinador activo' },
        { rol: 'DC', rolesPermitidos: ['DC', 'CALIFICADO'], pbMin: 50, desc: 'Línea Distribuidor Calificado' }
      ],
      equipoPbTotal: 850,
      beneficios: 'Regalías ampliadas, Asistencia LE Promovidos (1%), Bono Organizacional Liderazgo I, II y III.',
      queFalta: 'Desarrollar y trabajar a tus Líderes directos calificados, Coordinadores y DCs con volumen organizacional calificado.'
    }
  };

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function norm(str){
    return (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  function leerPicks(){
    try { return JSON.parse(localStorage.getItem(LS_SAVED_PICKS) || '{}'); } catch(e){ return {}; }
  }
  function guardarPicks(p){
    try { localStorage.setItem(LS_SAVED_PICKS, JSON.stringify(p)); } catch(e){}
  }

  function obtenerPadrón(){
    try {
      var r = JSON.parse(localStorage.getItem('equipoData') || 'null');
      if (r && Array.isArray(r.personas)) return r.personas;
    } catch(e){}
    return [];
  }

  function normalizarCodigoCat(raw){
    var s = norm(raw);
    if (!s) return 'D';
    if (s.indexOf('lider ejecutivo') >= 0 || s === 'le') return 'LE';
    if (s.indexOf('lider') >= 0 || s === 'l') return 'L';
    if (s.indexOf('coordinador') >= 0 || s === 'ce') return 'CE';
    if (s.indexOf('calificado') >= 0 || s === 'dc') return 'DC';
    if (s.indexOf('junior') >= 0 || s === 'dj') return 'DJ';
    if (s.indexOf('distribuidor') >= 0 || s === 'd') return 'D';
    return 'D';
  }

  function obtenerTitularInfo(){
    var res = { nombre: 'Silvia Toledo', cat: 'L', dip: '', pb: 0 };
    try {
      var r = JSON.parse(localStorage.getItem('equipoData') || 'null');
      if (r && r.titular) {
        if (r.titular.nombre) res.nombre = r.titular.nombre;
        if (r.titular.categoria || r.titular.cat) {
          res.cat = normalizarCodigoCat(r.titular.categoria || r.titular.cat);
        }
        if (r.titular.dip) res.dip = r.titular.dip;
        if (r.titular.pbPersonal != null) res.pb = Number(r.titular.pbPersonal) || 0;
      }
    } catch(e){}

    try {
      var bonosData = JSON.parse(localStorage.getItem('appi_bonos_cache') || 'null');
      if (bonosData && bonosData.categoria) {
        res.cat = normalizarCodigoCat(bonosData.categoria);
      }
    } catch(e){}

    try {
      if (typeof window.embudoKpiLiderPB === 'function') {
        var pbL = window.embudoKpiLiderPB();
        if (pbL != null && !isNaN(pbL)) res.pb = pbL;
      }
    } catch(e){}
    return res;
  }

  function siguienteCatSugerida(catActual){
    var code = normalizarCodigoCat(catActual);
    if (code === 'DJ') return 'D';
    if (code === 'D') return 'DC';
    if (code === 'DC') return 'CE';
    if (code === 'CE') return 'L';
    if (code === 'L') return 'LE'; // Silvia Toledo es Líder -> próximo rango Líder Ejecutivo (LE)
    if (code === 'LE') return 'LE';
    return 'DC';
  }

  // Verifica si una persona califica según la categoría requerida por el casillero
  function personaCalificaParaSlot(persona, slotConfig){
    if (!persona) return false;
    var pCatCode = normalizarCodigoCat(persona.cat || persona.categoria || '');
    var rolTarget = normalizarCodigoCat(slotConfig.rol);

    if (pCatCode === rolTarget) return true;

    var raw = norm(persona.cat || persona.categoria || '');
    if (Array.isArray(slotConfig.rolesPermitidos)) {
      for (var i = 0; i < slotConfig.rolesPermitidos.length; i++) {
        var permit = norm(slotConfig.rolesPermitidos[i]);
        if (raw === permit || raw.indexOf(permit) >= 0) return true;
      }
    }
    return false;
  }

  function renderOrganigrama(){
    var wrap = document.getElementById('carreraOrganigramaCard');
    if (!wrap) return;

    var titular = obtenerTitularInfo();
    var targetCat = siguienteCatSugerida(titular.cat);
    if (!PLAN_REGLAS[targetCat]) targetCat = 'LE';

    var regla = PLAN_REGLAS[targetCat];
    var picks = leerPicks()[targetCat] || [];
    var padron = obtenerPadrón();

    var pbVos = titular.pb || 0;
    var pbEquipoSum = 0;
    var lineasCompletas = 0;

    regla.slots.forEach(function(slot, idx){
      var dipElegido = picks[idx];
      var persona = padron.find(function(p){ return (p.codigo || p.dip || p.id) === dipElegido; });
      if (persona) {
        var pbP = Number(persona.pnAct || persona.pbPersonal || persona.pb || 0);
        pbEquipoSum += pbP;
        if (pbP >= slot.pbMin) lineasCompletas++;
      }
    });

    var pbTotalProyectado = pbVos + pbEquipoSum;
    var pctTotal = Math.min(100, Math.round((pbTotalProyectado / (regla.equipoPbTotal || 1)) * 100));
    var vosCumple = pbVos >= regla.personalReq;

    // Slots de distribuidores interactivos con roles específicos
    var slotsHtml = regla.slots.map(function(slot, idx){
      var dipElegido = picks[idx];
      var persona = padron.find(function(p){ return (p.codigo || p.dip || p.id) === dipElegido; });
      if (persona) {
        var pbP = Number(persona.pnAct || persona.pbPersonal || persona.pb || 0);
        var cumpleMin = pbP >= slot.pbMin;
        var pClass = cumpleMin ? 'ok' : 'falta';
        var catBadge = persona.cat || slot.rol;
        return '<div class="org-slot-card filled ' + pClass + '" data-pick-slot="' + idx + '" title="Tocar para cambiar">' +
          '<div class="org-slot-top">' +
            '<span class="org-cat-tag">' + esc(catBadge) + '</span>' +
            '<button type="button" class="org-slot-remove-btn" data-remove-slot="' + idx + '" title="Quitar">×</button>' +
          '</div>' +
          '<div class="org-slot-avatar-wrap">' +
            '<div class="org-slot-avatar">' + esc((persona.nombre || 'D').substring(0, 2).toUpperCase()) + '</div>' +
            (cumpleMin ? '<span class="org-slot-check">✓</span>' : '') +
          '</div>' +
          '<div class="org-slot-name">' + esc(persona.nombre || 'Distribuidor') + '</div>' +
          '<div class="org-slot-pb-badge ' + pClass + '">' +
            '<b>' + pbP.toFixed(1) + ' PB</b>' +
            '<small>/ ' + slot.pbMin + ' mín</small>' +
          '</div>' +
        '</div>';
      } else {
        return '<div class="org-slot-card empty" data-pick-slot="' + idx + '">' +
          '<div class="org-slot-plus-circle">+</div>' +
          '<div class="org-slot-empty-title">Elegir ' + esc(slot.rol) + '</div>' +
          '<div class="org-slot-empty-sub">Solo categoría ' + esc(slot.rol) + '</div>' +
          '<div class="org-slot-empty-min">Mín. ' + slot.pbMin + ' PB</div>' +
        '</div>';
      }
    }).join('');

    // Diagnóstico claro: qué te falta para subir a la próxima categoría
    var pbFaltanVos = Math.max(0, regla.personalReq - pbVos);
    var lineasFaltan = Math.max(0, regla.slots.length - lineasCompletas);
    var pbFaltanTotal = Math.max(0, regla.equipoPbTotal - pbTotalProyectado);

    var queFaltaTexto = '';
    if (vosCumple && lineasFaltan === 0 && pbFaltanTotal === 0) {
      queFaltaTexto = '🎉 <b>¡Estructura completa para calificar!</b> Mantené el ritmo del mes para asegurar el pase a ' + esc(regla.nombre) + '.';
    } else {
      var partes = [];
      if (pbFaltanVos > 0) partes.push('<b>' + pbFaltanVos.toFixed(1) + ' PB personales</b>');
      if (lineasFaltan > 0) partes.push('<b>' + lineasFaltan + ' línea' + (lineasFaltan === 1 ? '' : 's') + ' calificada' + (lineasFaltan === 1 ? '' : 's') + '</b>');
      if (pbFaltanTotal > 0 && lineasFaltan === 0) partes.push('<b>' + pbFaltanTotal.toFixed(1) + ' PB de equipo</b>');
      queFaltaTexto = 'Para ser <b>' + esc(regla.nombre) + '</b> necesitás: ' + partes.join(' y ') + '.';
    }

    wrap.innerHTML =
      '<div class="org-card">' +
        '<!-- ENCABEZADO TIPO APPI -->' +
        '<div class="org-head">' +
          '<div class="org-head-info">' +
            '<div class="org-eyebrow">🚀 TU PRÓXIMO PASO EN LA CARRERA PSA</div>' +
            '<h2 class="org-title">' + esc(regla.metaBadge) + '</h2>' +
            '<p class="org-subtitle">' + esc(titular.nombre) + ' (actual: ' + esc(titular.cat) + ') ➔ <b>' + esc(regla.nombre) + '</b></p>' +
          '</div>' +
          '<div class="org-head-badge">' +
            '<span class="org-target-badge">' + esc(targetCat) + '</span>' +
          '</div>' +
        '</div>' +

        '<!-- ÁRBOL VISUAL INTERACTIVO -->' +
        '<div class="org-tree-stage">' +
          '<!-- NODO VOS -->' +
          '<div class="org-vos-card ' + (vosCumple ? 'ok' : '') + '">' +
            '<span class="org-vos-pill">VOS · ' + esc(titular.cat || 'L') + '</span>' +
            '<div class="org-vos-avatar-wrap">' +
              '<div class="org-vos-avatar">👑</div>' +
              (vosCumple ? '<span class="org-vos-check">✓</span>' : '') +
            '</div>' +
            '<div class="org-vos-name">' + esc(titular.nombre) + '</div>' +
            '<div class="org-vos-pb">' +
              '<b>' + pbVos.toFixed(1) + ' PB</b>' +
              '<small>/ mín. ' + regla.personalReq + ' PB</small>' +
            '</div>' +
          '</div>' +

          '<!-- LÍNEAS CONECTORAS -->' +
          '<div class="org-stem"></div>' +
          '<div class="org-branch-line"></div>' +

          '<!-- CASILLEROS DE LÍNEAS FILTRADAS POR ROL -->' +
          '<div class="org-slots-grid count-' + regla.slots.length + '">' +
            slotsHtml +
          '</div>' +
        '</div>' +

        '<!-- DIAGNÓSTICO DE PROGRESO -->' +
        '<div class="org-status-box">' +
          '<div class="org-status-row">' +
            '<span class="org-status-label">Volumen hacia ' + esc(targetCat) + '</span>' +
            '<span class="org-status-val"><b>' + pbTotalProyectado.toFixed(1) + '</b> / ' + regla.equipoPbTotal + ' PB</span>' +
          '</div>' +
          '<div class="org-progress-track">' +
            '<div class="org-progress-bar" style="width:' + pctTotal + '%"></div>' +
          '</div>' +
          '<div class="org-status-hint">' + queFaltaTexto + '</div>' +
        '</div>' +

        '<!-- REQUISITOS OFICIALES Y BENEFICIOS -->' +
        '<div class="org-rule-note">' +
          '📌 <b>Requisitos para calificar:</b> ' + esc(regla.queFalta) + '<br>' +
          '🎁 <b>Beneficios al alcanzar ' + esc(targetCat) + ':</b> ' + esc(regla.beneficios) +
        '</div>' +
      '</div>';

    // Eventos de interacción
    wrap.querySelectorAll('[data-pick-slot]').forEach(function(slotEl){
      slotEl.onclick = function(e){
        if (e.target.closest('[data-remove-slot]')) return;
        var idx = parseInt(slotEl.getAttribute('data-pick-slot'), 10);
        abrirSelectorDistribuidor(targetCat, idx);
      };
    });

    wrap.querySelectorAll('[data-remove-slot]').forEach(function(btn){
      btn.onclick = function(e){
        e.stopPropagation();
        var idx = parseInt(btn.getAttribute('data-remove-slot'), 10);
        var p = leerPicks();
        if (p[targetCat]) {
          p[targetCat][idx] = null;
          guardarPicks(p);
          renderOrganigrama();
        }
      };
    });
  }

  // Modal para seleccionar a personas del padrón filtradas EXCLUSIVAMENTE por su categoría
  function abrirSelectorDistribuidor(targetCat, slotIndex){
    var regla = PLAN_REGLAS[targetCat];
    var slotConfig = regla.slots[slotIndex];
    var padron = obtenerPadrón();

    var m = document.getElementById('orgSelectorModal');
    if (!m) {
      m = document.createElement('div');
      m.id = 'orgSelectorModal';
      m.className = 'org-modal-overlay';
      document.body.appendChild(m);
    }

    m.innerHTML =
      '<div class="org-modal-card">' +
        '<div class="org-modal-header">' +
          '<div>' +
            '<h4>Elegir ' + esc(slotConfig.rol) + ' para Línea ' + (slotIndex + 1) + '</h4>' +
            '<p>Solo personas con categoría <b>' + esc(slotConfig.rol) + '</b> en tu equipo</p>' +
          '</div>' +
          '<button type="button" class="org-modal-close" id="orgModalClose">✕</button>' +
        '</div>' +
        '<div class="org-modal-search">' +
          '<input type="text" id="orgSearchInp" placeholder="Buscar por nombre o DIP..." autocomplete="off">' +
        '</div>' +
        '<div class="org-modal-list" id="orgDistList"></div>' +
      '</div>';

    m.style.display = 'flex';
    requestAnimationFrame(function(){ m.classList.add('open'); });

    var closeFn = function(){
      m.classList.remove('open');
      setTimeout(function(){ m.style.display = 'none'; }, 220);
    };
    m.querySelector('#orgModalClose').onclick = closeFn;
    m.onclick = function(e){ if (e.target === m) closeFn(); };

    var listEl = m.querySelector('#orgDistList');
    var searchInp = m.querySelector('#orgSearchInp');

    function renderLista(query){
      var q = (query || '').toLowerCase().trim();

      // FILTRAR ESTRICTAMENTE por la categoría que corresponde al casillero
      var filtrados = padron.filter(function(p){
        if (!personaCalificaParaSlot(p, slotConfig)) return false;
        var n = (p.nombre || '').toLowerCase();
        var d = (p.codigo || p.dip || '').toLowerCase();
        return (!q || n.indexOf(q) >= 0 || d.indexOf(q) >= 0);
      });

      filtrados.sort(function(a, b){
        var pbA = Number(a.pnAct || a.pbPersonal || a.pb || 0);
        var pbB = Number(b.pnAct || b.pbPersonal || b.pb || 0);
        if (pbB !== pbA) return pbB - pbA;
        return (a.nombre || '').localeCompare(b.nombre || '');
      });

      if (!filtrados.length) {
        listEl.innerHTML =
          '<div class="org-empty-list">' +
            '<b>No se encontraron ' + esc(slotConfig.rol) + ' en tu equipo.</b><br>' +
            '<small>Este casillero requiere a alguien con categoría ' + esc(slotConfig.rol) + ' para trabajar su volumen hacia la calificación.</small>' +
          '</div>';
        return;
      }

      listEl.innerHTML = filtrados.map(function(p){
        var dip = p.codigo || p.dip || p.id || '';
        var pbVal = Number(p.pnAct || p.pbPersonal || p.pb || 0);
        var cat = p.cat || slotConfig.rol;
        var cumpleMin = pbVal >= slotConfig.pbMin;
        return '<div class="org-dist-item" data-select-dip="' + esc(dip) + '">' +
          '<div class="org-dist-avatar">' + esc((p.nombre || 'D').substring(0, 2).toUpperCase()) + '</div>' +
          '<div class="org-dist-info">' +
            '<div class="org-dist-name">' + esc(p.nombre || 'Distribuidor') + '</div>' +
            '<div class="org-dist-sub">' +
              '<span class="org-cat-pill">' + esc(cat) + '</span> ' +
              'DIP ' + esc(dip) +
            '</div>' +
          '</div>' +
          '<div class="org-dist-pb ' + (cumpleMin ? 'ok' : 'falta') + '">' +
            '<b>' + pbVal.toFixed(1) + ' PB</b>' +
            '<small>' + (cumpleMin ? '✓ Califica' : 'Faltan ' + (slotConfig.pbMin - pbVal).toFixed(1)) + '</small>' +
          '</div>' +
        '</div>';
      }).join('');

      listEl.querySelectorAll('[data-select-dip]').forEach(function(item){
        item.onclick = function(){
          var dip = item.getAttribute('data-select-dip');
          var p = leerPicks();
          if (!p[targetCat]) p[targetCat] = [];
          p[targetCat][slotIndex] = dip;
          guardarPicks(p);
          closeFn();
          renderOrganigrama();
        };
      });
    }

    renderLista('');
    searchInp.oninput = function(){ renderLista(searchInp.value); };
    setTimeout(function(){ searchInp.focus(); }, 150);
  }

  /* ------------------------------------------------------------
     ESTILOS NATIVOS INTEGRADOS AL DISEÑO DE APPI
  ------------------------------------------------------------ */
  function inyectarEstilos(){
    if (document.getElementById('planCarreraEstilos')) return;
    var st = document.createElement('style');
    st.id = 'planCarreraEstilos';
    st.textContent =
      '#carreraOrganigramaCard{margin:10px 14px 14px;}' +
      '.org-card{' +
        'background:rgba(255,255,255,0.78);' +
        'border:1px solid rgba(255,255,255,0.85);' +
        'border-radius:24px;' +
        'padding:16px 14px 14px;' +
        'box-shadow:0 10px 28px rgba(11,88,120,0.07),0 1px 3px rgba(0,0,0,0.03);' +
        'backdrop-filter:blur(20px);' +
        '-webkit-backdrop-filter:blur(20px);' +
        'color:#1c1c1e;' +
        'position:relative;' +
        'transition:all .25s ease;' +
      '}' +
      'body.dark .org-card{background:rgba(28,28,30,0.85);border-color:rgba(255,255,255,0.12);color:#f4f4f6;box-shadow:0 12px 32px rgba(0,0,0,0.35);}' +
      '.org-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:14px;}' +
      '.org-head-info{flex:1;min-width:0;}' +
      '.org-eyebrow{font-size:10px;font-weight:900;letter-spacing:0.8px;color:#1d7a5c;text-transform:uppercase;margin-bottom:2px;}' +
      'body.dark .org-eyebrow{color:#3ad0a4;}' +
      '.org-title{margin:0;font-size:18px;font-weight:900;letter-spacing:-0.4px;color:#0b5878;line-height:1.2;}' +
      'body.dark .org-title{color:#7dd3fc;}' +
      '.org-subtitle{margin:3px 0 0;font-size:11.5px;color:#777887;font-weight:600;line-height:1.35;}' +
      'body.dark .org-subtitle{color:#94a3b8;}' +
      '.org-target-badge{background:linear-gradient(135deg,#0b5878,#3ad0a4);color:#fff;font-size:13px;font-weight:900;padding:6px 12px;border-radius:12px;box-shadow:0 4px 12px rgba(11,88,120,0.22);display:inline-block;letter-spacing:0.3px;}' +
      '.org-tree-stage{display:flex;flex-direction:column;align-items:center;margin:10px 0 14px;position:relative;}' +
      /* Nodo Vos */
      '.org-vos-card{' +
        'background:linear-gradient(135deg,#ffffff,#f8fafc);' +
        'border:1.5px solid #0b5878;' +
        'border-radius:18px;' +
        'padding:10px 16px;' +
        'display:flex;flex-direction:column;align-items:center;' +
        'min-width:145px;max-width:200px;' +
        'box-shadow:0 6px 18px rgba(11,88,120,0.12);' +
        'position:relative;z-index:2;transition:all .2s;' +
      '}' +
      'body.dark .org-vos-card{background:linear-gradient(135deg,#1e293b,#0f172a);border-color:#38bdf8;box-shadow:0 6px 20px rgba(0,0,0,0.4);}' +
      '.org-vos-card.ok{border-color:#10b981;box-shadow:0 6px 18px rgba(16,185,129,0.18);}' +
      '.org-vos-pill{position:absolute;top:-9px;background:#0b5878;color:#fff;font-size:9px;font-weight:900;padding:2px 8px;border-radius:8px;letter-spacing:0.5px;box-shadow:0 2px 6px rgba(11,88,120,0.25);}' +
      '.org-vos-card.ok .org-vos-pill{background:#10b981;}' +
      '.org-vos-avatar-wrap{position:relative;margin-top:2px;margin-bottom:3px;}' +
      '.org-vos-avatar{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#e0f2fe,#bae6fd);display:flex;align-items:center;justify-content:center;font-size:18px;}' +
      '.org-vos-check{position:absolute;bottom:-2px;right:-4px;background:#10b981;color:#fff;font-size:10px;width:15px;height:15px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1.5px solid #fff;font-weight:900;}' +
      '.org-vos-name{font-size:13px;font-weight:850;color:#1c1c1e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px;}' +
      'body.dark .org-vos-name{color:#fff;}' +
      '.org-vos-pb{font-size:11.5px;color:#0b5878;margin-top:2px;display:flex;flex-direction:column;align-items:center;line-height:1.2;}' +
      'body.dark .org-vos-pb{color:#38bdf8;}' +
      '.org-vos-pb b{font-size:13px;font-weight:900;}' +
      '.org-vos-pb small{font-size:10px;color:#777887;font-weight:600;}' +
      'body.dark .org-vos-pb small{color:#94a3b8;}' +
      /* Líneas conectoras */
      '.org-stem{width:2px;height:16px;background:#0b5878;opacity:0.3;}' +
      'body.dark .org-stem{background:#38bdf8;opacity:0.5;}' +
      '.org-branch-line{width:80%;height:10px;border-top:2px solid rgba(11,88,120,0.3);border-left:2px solid rgba(11,88,120,0.3);border-right:2px solid rgba(11,88,120,0.3);border-radius:4px 4px 0 0;margin-bottom:8px;}' +
      'body.dark .org-branch-line{border-color:rgba(56,189,248,0.45);}' +
      /* Casilleros */
      '.org-slots-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(105px,1fr));gap:8px;width:100%;z-index:2;}' +
      '.org-slot-card{' +
        'border-radius:18px;' +
        'padding:10px 8px;' +
        'text-align:center;' +
        'cursor:pointer;' +
        'transition:all .2s cubic-bezier(.22,1,.36,1);' +
        'position:relative;' +
        'display:flex;flex-direction:column;align-items:center;justify-content:center;' +
        'min-height:110px;' +
      '}' +
      '.org-slot-card.empty{' +
        'border:1.5px dashed rgba(11,88,120,0.3);' +
        'background:rgba(255,255,255,0.45);' +
      '}' +
      'body.dark .org-slot-card.empty{border-color:rgba(255,255,255,0.22);background:rgba(255,255,255,0.03);}' +
      '.org-slot-card.empty:hover{border-color:#0b5878;background:rgba(11,88,120,0.06);transform:translateY(-2px);}' +
      '.org-slot-card.empty:active{transform:scale(.97);}' +
      '.org-slot-card.filled{' +
        'background:#ffffff;' +
        'border:1.5px solid rgba(11,88,120,0.22);' +
        'box-shadow:0 4px 14px rgba(11,88,120,0.06);' +
      '}' +
      'body.dark .org-slot-card.filled{background:#1e293b;border-color:rgba(255,255,255,0.14);box-shadow:0 6px 16px rgba(0,0,0,0.3);}' +
      '.org-slot-card.filled.ok{border-color:#10b981;box-shadow:0 4px 14px rgba(16,185,129,0.12);}' +
      '.org-slot-card.filled:hover{transform:translateY(-2px);}' +
      '.org-slot-card.filled:active{transform:scale(.97);}' +
      '.org-slot-top{display:flex;justify-content:space-between;align-items:center;width:100%;margin-bottom:4px;}' +
      '.org-cat-tag{font-size:9px;font-weight:900;background:rgba(11,88,120,0.1);color:#0b5878;padding:1px 6px;border-radius:6px;}' +
      'body.dark .org-cat-tag{background:rgba(56,189,248,0.2);color:#7dd3fc;}' +
      '.org-slot-remove-btn{background:none;border:none;color:#94a3b8;font-size:16px;cursor:pointer;padding:0 2px;line-height:1;border-radius:4px;}' +
      '.org-slot-remove-btn:hover{color:#ef4444;background:rgba(239,68,68,0.1);}' +
      '.org-slot-avatar-wrap{position:relative;margin-bottom:4px;}' +
      '.org-slot-avatar{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#3d63c9,#5b8def);color:#fff;font-size:11px;font-weight:900;display:flex;align-items:center;justify-content:center;}' +
      '.org-slot-check{position:absolute;bottom:-2px;right:-4px;background:#10b981;color:#fff;font-size:9px;width:13px;height:13px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1.5px solid #fff;font-weight:900;}' +
      '.org-slot-name{font-size:11.5px;font-weight:800;color:#1c1c1e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:92px;line-height:1.2;}' +
      'body.dark .org-slot-name{color:#f1f5f9;}' +
      '.org-slot-pb-badge{font-size:10px;margin-top:3px;padding:2px 6px;border-radius:6px;line-height:1.2;}' +
      '.org-slot-pb-badge.ok{background:rgba(16,185,129,0.12);color:#059669;}' +
      'body.dark .org-slot-pb-badge.ok{background:rgba(16,185,129,0.2);color:#34d399;}' +
      '.org-slot-pb-badge.falta{background:rgba(245,158,11,0.12);color:#b45309;}' +
      'body.dark .org-slot-pb-badge.falta{background:rgba(245,158,11,0.2);color:#fbbf24;}' +
      '.org-slot-pb-badge b{font-size:11.5px;font-weight:900;}' +
      '.org-slot-pb-badge small{font-size:9px;opacity:0.85;}' +
      '.org-slot-plus-circle{width:30px;height:30px;border-radius:50%;background:rgba(11,88,120,0.1);color:#0b5878;font-size:18px;font-weight:800;display:flex;align-items:center;justify-content:center;margin-bottom:3px;transition:transform .2s;}' +
      'body.dark .org-slot-plus-circle{background:rgba(56,189,248,0.15);color:#38bdf8;}' +
      '.org-slot-card.empty:hover .org-slot-plus-circle{transform:scale(1.1);background:#0b5878;color:#fff;}' +
      '.org-slot-empty-title{font-size:11px;font-weight:800;color:#0b5878;}' +
      'body.dark .org-slot-empty-title{color:#7dd3fc;}' +
      '.org-slot-empty-sub{font-size:9.5px;color:#777887;font-weight:600;margin-top:1px;}' +
      'body.dark .org-slot-empty-sub{color:#94a3b8;}' +
      '.org-slot-empty-min{font-size:9px;color:#10b981;font-weight:800;margin-top:2px;}' +
      'body.dark .org-slot-empty-min{color:#34d399;}' +
      /* Diagnóstico & Barra */
      '.org-status-box{background:rgba(255,255,255,0.65);border:1px solid rgba(11,88,120,0.12);border-radius:16px;padding:12px 14px;margin-top:10px;}' +
      'body.dark .org-status-box{background:rgba(15,23,42,0.6);border-color:rgba(255,255,255,0.1);}' +
      '.org-status-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-size:12px;font-weight:700;color:#1c1c1e;}' +
      'body.dark .org-status-row{color:#e2e8f0;}' +
      '.org-status-val b{color:#0b5878;font-weight:900;font-size:13.5px;}' +
      'body.dark .org-status-val b{color:#38bdf8;}' +
      '.org-progress-track{height:7px;background:rgba(11,88,120,0.1);border-radius:99px;overflow:hidden;margin-bottom:8px;}' +
      'body.dark .org-progress-track{background:rgba(255,255,255,0.1);}' +
      '.org-progress-bar{height:100%;background:linear-gradient(90deg,#3ad0a4,#0b5878);border-radius:99px;transition:width .4s ease;}' +
      '.org-status-hint{font-size:11.5px;color:#1c1c1e;line-height:1.4;}' +
      'body.dark .org-status-hint{color:#e2e8f0;}' +
      '.org-rule-note{font-size:11px;color:#777887;margin-top:8px;line-height:1.45;padding:0 4px;}' +
      'body.dark .org-rule-note{color:#94a3b8;}' +
      /* Modal Selector Estilo APPI */
      '.org-modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,0.6);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);z-index:99999;display:none;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .22s cubic-bezier(.22,1,.36,1);}' +
      '.org-modal-overlay.open{opacity:1;}' +
      '.org-modal-card{background:#ffffff;border:1px solid rgba(255,255,255,0.9);border-radius:26px 26px 0 0;width:100%;max-width:540px;max-height:85vh;padding:18px 16px 26px;display:flex;flex-direction:column;box-shadow:0 -12px 36px rgba(0,0,0,0.2);transform:translateY(30px);transition:transform .24s cubic-bezier(.22,1,.36,1);}' +
      'body.dark .org-modal-card{background:#1e293b;border-color:rgba(255,255,255,0.12);color:#fff;}' +
      '.org-modal-overlay.open .org-modal-card{transform:translateY(0);}' +
      '.org-modal-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;}' +
      '.org-modal-header h4{margin:0;font-size:16px;font-weight:900;color:#0b5878;letter-spacing:-0.2px;}' +
      'body.dark .org-modal-header h4{color:#7dd3fc;}' +
      '.org-modal-header p{margin:2px 0 0;font-size:12px;color:#777887;font-weight:600;}' +
      'body.dark .org-modal-header p{color:#94a3b8;}' +
      '.org-modal-close{background:rgba(11,88,120,0.08);border:0;color:#0b5878;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;font-weight:900;}' +
      'body.dark .org-modal-close{background:rgba(255,255,255,0.1);color:#fff;}' +
      '.org-modal-search{margin-bottom:10px;}' +
      '.org-modal-search input{width:100%;background:#f1f5f9;border:1px solid rgba(11,88,120,0.14);border-radius:14px;padding:10px 14px;font:inherit;font-size:13px;color:#1c1c1e;outline:none;box-sizing:border-box;}' +
      'body.dark .org-modal-search input{background:rgba(255,255,255,0.06);border-color:rgba(255,255,255,0.14);color:#fff;}' +
      '.org-modal-search input:focus{border-color:#0b5878;background:#fff;box-shadow:0 0 0 3px rgba(11,88,120,0.1);}' +
      '.org-modal-list{overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:6px;max-height:55vh;padding-right:2px;}' +
      '.org-dist-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:14px;background:#f8fafc;border:1px solid rgba(11,88,120,0.08);cursor:pointer;transition:all .18s;}' +
      'body.dark .org-dist-item{background:rgba(255,255,255,0.04);border-color:rgba(255,255,255,0.08);}' +
      '.org-dist-item:hover{background:rgba(11,88,120,0.06);border-color:#0b5878;transform:translateX(2px);}' +
      'body.dark .org-dist-item:hover{background:rgba(56,189,248,0.12);border-color:#38bdf8;}' +
      '.org-dist-avatar{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#0b5878,#3ad0a4);color:#fff;font-size:11px;font-weight:900;display:flex;align-items:center;justify-content:center;flex-shrink:0;}' +
      '.org-dist-info{flex:1;min-width:0;}' +
      '.org-dist-name{font-size:13px;font-weight:850;color:#1c1c1e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
      'body.dark .org-dist-name{color:#fff;}' +
      '.org-dist-sub{font-size:10.5px;color:#777887;display:flex;align-items:center;gap:6px;margin-top:1px;font-weight:600;}' +
      'body.dark .org-dist-sub{color:#94a3b8;}' +
      '.org-cat-pill{background:#e2e8f0;color:#1e293b;padding:1px 6px;border-radius:4px;font-weight:800;font-size:9.5px;}' +
      '.org-dist-pb{display:flex;flex-direction:column;align-items:flex-end;font-size:13px;font-weight:900;}' +
      '.org-dist-pb.ok{color:#059669;}' +
      '.org-dist-pb.falta{color:#b45309;}' +
      'body.dark .org-dist-pb.ok{color:#34d399;}' +
      'body.dark .org-dist-pb.falta{color:#fbbf24;}' +
      '.org-dist-pb small{font-size:9.5px;font-weight:700;}' +
      '.org-empty-list{text-align:center;padding:36px 12px;font-size:12.5px;color:#777887;line-height:1.45;}';
    document.head.appendChild(st);
  }

  /* ------------------------------------------------------------
     ACOMODAR ELEMENTOS EN MI NEGOCIO SEGÚN LA SECUENCIA EXACTA:
     1. Banner de datos (#embudoKpi)
     2. Organigrama interactivo (#carreraOrganigramaCard)
     3. 4 Botones de Mi Negocio (#negGrid)
     4. Botón de Reporte de Bonos (#bonosCard) debajo de todo
  ------------------------------------------------------------ */
  function reordenarSeccionNegocio(){
    var view = document.getElementById('view-negocio');
    if (!view) return;

    inyectarEstilos();

    var orgCard = document.getElementById('carreraOrganigramaCard');
    if (!orgCard) {
      orgCard = document.createElement('div');
      orgCard.id = 'carreraOrganigramaCard';
    }

    var banner = document.getElementById('embudoKpi');
    var grid = document.getElementById('negGrid');
    var bonos = document.getElementById('bonosCard');

    // 1) Banner arriba de todo
    var header = view.querySelector('header');
    if (banner) {
      if (header && banner.previousElementSibling !== header) {
        header.insertAdjacentElement('afterend', banner);
      }
    }

    // 2) Organigrama interactivo debajo del banner
    var anchor = banner || header;
    if (anchor && orgCard.previousElementSibling !== anchor) {
      anchor.insertAdjacentElement('afterend', orgCard);
    }

    // 3) Grilla con 4 botones (#negGrid) debajo del organigrama
    if (grid && orgCard && grid.previousElementSibling !== orgCard) {
      orgCard.insertAdjacentElement('afterend', grid);
    }

    // 4) Botón Reporte de Bonos DEBAJO DE TODO
    if (bonos && grid) {
      if (bonos.previousElementSibling !== grid) {
        grid.insertAdjacentElement('afterend', bonos);
      }
    }

    renderOrganigrama();
  }

  function init(){
    reordenarSeccionNegocio();

    var observer = new MutationObserver(function(){
      reordenarSeccionNegocio();
    });
    var v = document.getElementById('view-negocio');
    if (v) observer.observe(v, { childList: true });

    window.addEventListener('appi-bonos-cambiaron', reordenarSeccionNegocio);

    // Enganche al router de vistas de APPI
    var origShowView = window.showView;
    if (typeof origShowView === 'function') {
      window.showView = function(id, opts) {
        var res = origShowView.apply(this, arguments);
        if (id === 'view-negocio') {
          setTimeout(function() { reordenarSeccionNegocio(); renderOrganigrama(); }, 50);
        }
        return res;
      };
    }

    window.addEventListener('pageshow', function() { setTimeout(reordenarSeccionNegocio, 100); });
    document.addEventListener('visibilitychange', function() { if (!document.hidden) reordenarSeccionNegocio(); });

    window.addEventListener('storage', function(e){
      if (e.key === 'equipoData' || e.key === LS_SAVED_PICKS || e.key === 'appi_bonos_cache') {
        renderOrganigrama();
      }
    });
  }

  window.APPIPlanCarrera = {
    render: renderOrganigrama,
    reordenar: reordenarSeccionNegocio,
    abrirSelector: abrirSelectorDistribuidor
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 300);
  }

})();
