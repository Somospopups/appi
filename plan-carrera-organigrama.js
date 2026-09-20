/* ============================================================
   APPI · Organigrama Interactivo de Próxima Categoría PSA
   Ubicación: MI NEGOCIO
   1. Banner de datos (Personas, Activos, Total PB)
   2. Organigrama interactivo de siguiente categoría
   3. 4 Botones de Mi Negocio
   4. Botón de Reporte de Bonos
   ============================================================ */

(function(){
  if (window.APPIPlanCarrera) return;

  var LS_SAVED_PICKS = 'appi_carrera_picks_v1';
  var LS_TARGET_CAT = 'appi_carrera_target_cat_v1';

  // Configuración oficial según plan PSA (CDE 2026 / Flex Marketing Plan)
  var PLAN_REGLAS = {
    'D': {
      nombre: 'Distribuidor (D)',
      actualCat: 'DJ',
      tiempo: '1 mes calendario o arrastre',
      personalReq: 13,
      personalDesc: 'Volumen Personal (A) + DJ en 1ª Gen (B) = mín. 13 PB',
      slots: [
        { rol: 'DJ', pbMin: 0, desc: 'Línea 1 · DJ 1ª Generación' },
        { rol: 'DJ', pbMin: 0, desc: 'Línea 2 · DJ 1ª Generación' }
      ],
      equipoPbTotal: 13,
      nota: 'Alcanzar (A + B) = 13 PB acumulados. Confirmación con Capacitación Básica.'
    },
    'DC': {
      nombre: 'Distribuidor Calificado (DC)',
      actualCat: 'D',
      tiempo: '1 mes calendario',
      personalReq: 13,
      personalDesc: 'Volumen Personal (A + B) = mín. 13 PB',
      slots: [
        { rol: 'D', pbMin: 13, desc: '1ª Gen · Línea 1 (A+B mín. 13 PB)' },
        { rol: 'D', pbMin: 13, desc: '1ª Gen · Línea 2 (A+B mín. 13 PB)' },
        { rol: 'D', pbMin: 13, desc: '1ª Gen · Línea 3 (A+B mín. 13 PB)' }
      ],
      equipoPbTotal: 52, // 13 personal + 3x13
      nota: '3 Organizaciones de Distribuidor directas con (A + B) = 13 PB cada una en líneas diferentes.'
    },
    'CE': {
      nombre: 'Coordinador de Equipo (CE)',
      actualCat: 'DC',
      tiempo: '2 meses calendario consecutivos',
      personalReq: 50,
      personalDesc: 'Volumen Personal y Grupo (A + B + C) = mín. 50 PB',
      slots: [
        { rol: 'DC', pbMin: 50, desc: '1ª Gen · Organización DC 1 (mín. 50 PB)' },
        { rol: 'DC', pbMin: 50, desc: '1ª Gen · Organización DC 2 (mín. 50 PB)' },
        { rol: 'DC', pbMin: 50, desc: '1ª Gen · Organización DC 3 (mín. 50 PB)' }
      ],
      equipoPbTotal: 200, // 50 personal + 3x50
      nota: '3 Organizaciones de DC en 1ª Gen con (A + B + C) = 50 PB cada una + 5 Corazones en 12 meses.'
    },
    'L': {
      nombre: 'Líder de Equipo (L)',
      actualCat: 'CE',
      tiempo: '2 a 3 meses consecutivos',
      personalReq: 50,
      personalDesc: 'Volumen Personal y Grupo (A + B + C) = mín. 50 PB',
      slots: [
        { rol: 'CE', pbMin: 180, desc: 'Línea Coordinador Calificado (180+ PB)' },
        { rol: 'DC', pbMin: 50, desc: 'Línea Distribuidor Calificado (50+ PB)' },
        { rol: 'DC', pbMin: 50, desc: 'Línea Distribuidor Calificado (50+ PB)' },
        { rol: 'D', pbMin: 13, desc: 'Línea Distribuidor Activo (13+ PB)' }
      ],
      equipoPbTotal: 400,
      nota: 'Estructura multirama con Coordinadores y DCs activos alcanzando volumen organizacional de Liderazgo.'
    }
  };

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
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

  function obtenerTitularInfo(){
    var res = { nombre: 'Vos', cat: 'D', dip: '', pb: 0 };
    try {
      var r = JSON.parse(localStorage.getItem('equipoData') || 'null');
      if (r && r.titular) {
        if (r.titular.nombre) res.nombre = r.titular.nombre;
        if (r.titular.categoria) res.cat = r.titular.categoria.toUpperCase();
        if (r.titular.dip) res.dip = r.titular.dip;
        if (r.titular.pbPersonal != null) res.pb = Number(r.titular.pbPersonal) || 0;
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
    var c = (catActual || '').toUpperCase().trim();
    if (c.indexOf('DJ') >= 0 || c.indexOf('JUNIOR') >= 0) return 'D';
    if (c.indexOf('DC') >= 0 || c.indexOf('CALIFICADO') >= 0) return 'CE';
    if (c.indexOf('CE') >= 0 || c.indexOf('COORDINADOR') >= 0) return 'L';
    if (c.indexOf('L') >= 0) return 'L';
    return 'DC'; // Por defecto para Distribuidores (D)
  }

  function renderOrganigrama(){
    var wrap = document.getElementById('carreraOrganigramaCard');
    if (!wrap) return;

    var titular = obtenerTitularInfo();
    var targetCat = localStorage.getItem(LS_TARGET_CAT) || siguienteCatSugerida(titular.cat);
    if (!PLAN_REGLAS[targetCat]) targetCat = 'DC';

    var regla = PLAN_REGLAS[targetCat];
    var picks = leerPicks()[targetCat] || [];
    var padron = obtenerPadrón();

    // Sumatoria de PB proyectado
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

    var tabsHtml = ['D', 'DC', 'CE', 'L'].map(function(k){
      var active = k === targetCat ? 'active' : '';
      return '<button type="button" class="org-cat-tab ' + active + '" data-set-cat="' + k + '">' + k + '</button>';
    }).join('');

    var slotsHtml = regla.slots.map(function(slot, idx){
      var dipElegido = picks[idx];
      var persona = padron.find(function(p){ return (p.codigo || p.dip || p.id) === dipElegido; });
      if (persona) {
        var pbP = Number(persona.pnAct || persona.pbPersonal || persona.pb || 0);
        var cumpleMin = pbP >= slot.pbMin;
        var pColor = cumpleMin ? '#10b981' : '#f59e0b';
        var catBadge = persona.cat || slot.rol;
        return '<div class="org-slot-card filled" data-pick-slot="' + idx + '" title="Tocar para cambiar">' +
          '<div class="org-slot-badge-cat">' + esc(catBadge) + '</div>' +
          '<button type="button" class="org-slot-del" data-remove-slot="' + idx + '" title="Quitar">×</button>' +
          '<div class="org-slot-avatar">' + esc((persona.nombre || 'D').substring(0, 2).toUpperCase()) + '</div>' +
          '<div class="org-slot-name">' + esc(persona.nombre || 'Distribuidor') + '</div>' +
          '<div class="org-slot-dip">' + esc(persona.codigo || persona.dip || '') + '</div>' +
          '<div class="org-slot-pb" style="color:' + pColor + '"><b>' + pbP.toFixed(1) + ' PB</b> <small>/ mín ' + slot.pbMin + '</small></div>' +
        '</div>';
      } else {
        return '<div class="org-slot-card empty" data-pick-slot="' + idx + '">' +
          '<div class="org-slot-add-icon">+</div>' +
          '<div class="org-slot-empty-title">Elegir ' + esc(slot.rol) + '</div>' +
          '<div class="org-slot-empty-sub">Mínimo ' + slot.pbMin + ' PB</div>' +
        '</div>';
      }
    }).join('');

    wrap.innerHTML =
      '<div class="org-card">' +
        '<div class="org-header">' +
          '<div class="org-title-group">' +
            '<span class="org-kicker">🎯 PLAN DE CALIFICACIÓN PSA</span>' +
            '<h3 class="org-title">Pase a ' + esc(regla.nombre) + '</h3>' +
            '<p class="org-desc">' + esc(regla.nota) + '</p>' +
          '</div>' +
          '<div class="org-cat-switcher">' + tabsHtml + '</div>' +
        '</div>' +

        '<div class="org-tree-canvas">' +
          '<!-- NODO SUPERIOR VOS -->' +
          '<div class="org-node-vos">' +
            '<div class="org-vos-badge">VOS</div>' +
            '<div class="org-vos-avatar">👑</div>' +
            '<div class="org-vos-name">' + esc(titular.nombre) + '</div>' +
            '<div class="org-vos-pb"><b>' + pbVos.toFixed(1) + ' PB</b> <span class="org-badge-rule">Requisito: ' + regla.personalReq + ' PB</span></div>' +
          '</div>' +

          '<!-- LINEAS CONECTORAS -->' +
          '<div class="org-tree-stem"></div>' +
          '<div class="org-tree-branches"></div>' +

          '<!-- SLOTS DIRECTOS -->' +
          '<div class="org-slots-container count-' + regla.slots.length + '">' +
            slotsHtml +
          '</div>' +
        '</div>' +

        '<!-- BARRA DE PROGRESO DE CALIFICACIÓN -->' +
        '<div class="org-footer-summary">' +
          '<div class="org-summary-row">' +
            '<div><b>Líneas asignadas:</b> ' + lineasCompletas + ' de ' + regla.slots.length + ' con PB mínimo</div>' +
            '<div><b>Total Proyectado:</b> <span class="org-sum-highlight">' + pbTotalProyectado.toFixed(1) + ' / ' + regla.equipoPbTotal + ' PB</span></div>' +
          '</div>' +
          '<div class="org-progress-bar"><div class="org-progress-fill" style="width:' + pctTotal + '%"></div></div>' +
          '<div class="org-footer-note">⏱ <b>Período:</b> ' + esc(regla.tiempo) + ' · Tocá cualquier casillero para elegir a tu distribuidor.</div>' +
        '</div>' +
      '</div>';

    // Eventos del organigrama
    wrap.querySelectorAll('[data-set-cat]').forEach(function(btn){
      btn.onclick = function(){
        var c = btn.getAttribute('data-set-cat');
        localStorage.setItem(LS_TARGET_CAT, c);
        renderOrganigrama();
      };
    });

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

    // Modal interior
    m.innerHTML =
      '<div class="org-modal-card">' +
        '<div class="org-modal-header">' +
          '<div>' +
            '<h4>Elegir Distribuidor para Línea ' + (slotIndex + 1) + '</h4>' +
            '<p>Categoría sugerida: <b>' + esc(slotConfig.rol) + '</b> (mínimo ' + slotConfig.pbMin + ' PB)</p>' +
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
      var filtrados = padron.filter(function(p){
        var n = (p.nombre || '').toLowerCase();
        var d = (p.codigo || p.dip || '').toLowerCase();
        return (!q || n.indexOf(q) >= 0 || d.indexOf(q) >= 0);
      });

      // Ordenar: primero los que tienen PB y luego alfabético
      filtrados.sort(function(a, b){
        var pbA = Number(a.pnAct || a.pbPersonal || a.pb || 0);
        var pbB = Number(b.pnAct || b.pbPersonal || b.pb || 0);
        if (pbB !== pbA) return pbB - pbA;
        return (a.nombre || '').localeCompare(b.nombre || '');
      });

      if (!filtrados.length) {
        listEl.innerHTML = '<div class="org-empty-list">No se encontraron distribuidores en tu equipo.</div>';
        return;
      }

      listEl.innerHTML = filtrados.map(function(p){
        var dip = p.codigo || p.dip || p.id || '';
        var pbVal = Number(p.pnAct || p.pbPersonal || p.pb || 0);
        var cat = p.cat || 'D';
        return '<div class="org-dist-item" data-select-dip="' + esc(dip) + '">' +
          '<div class="org-dist-avatar">' + esc((p.nombre || 'D').substring(0, 2).toUpperCase()) + '</div>' +
          '<div class="org-dist-info">' +
            '<div class="org-dist-name">' + esc(p.nombre || 'Distribuidor') + '</div>' +
            '<div class="org-dist-sub"><span class="org-cat-pill">' + esc(cat) + '</span> DIP ' + esc(dip) + '</div>' +
          '</div>' +
          '<div class="org-dist-pb"><b>' + pbVal.toFixed(1) + ' PB</b></div>' +
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

  function inyectarEstilos(){
    if (document.getElementById('planCarreraEstilos')) return;
    var st = document.createElement('style');
    st.id = 'planCarreraEstilos';
    st.textContent =
      '#carreraOrganigramaCard{margin:12px 14px 14px;}' +
      '.org-card{background:linear-gradient(145deg,rgba(18,24,38,0.92),rgba(11,16,28,0.96));border:1px solid rgba(255,255,255,0.12);border-radius:22px;padding:16px 14px 14px;box-shadow:0 14px 34px rgba(0,0,0,0.35);backdrop-filter:blur(16px);color:#fff;font-family:inherit;position:relative;overflow:hidden;}' +
      '.org-card::before{content:"";position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#3ad0a4,#5b8def,#a855f7);}' +
      '.org-header{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:14px;flex-wrap:wrap;}' +
      '.org-title-group{flex:1;min-width:180px;}' +
      '.org-kicker{font-size:9.5px;font-weight:900;letter-spacing:1px;color:#3ad0a4;display:block;margin-bottom:3px;}' +
      '.org-title{margin:0;font-size:16px;font-weight:900;letter-spacing:-0.3px;color:#fff;}' +
      '.org-desc{margin:3px 0 0;font-size:11px;color:#94a3b8;line-height:1.35;}' +
      '.org-cat-switcher{display:flex;background:rgba(255,255,255,0.06);padding:3px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);gap:3px;}' +
      '.org-cat-tab{background:transparent;border:0;color:#94a3b8;font-size:11px;font-weight:800;padding:5px 9px;border-radius:9px;cursor:pointer;transition:all .18s;}' +
      '.org-cat-tab.active{background:#3ad0a4;color:#0b1926;box-shadow:0 2px 8px rgba(58,208,164,0.35);}' +
      '.org-tree-canvas{display:flex;flex-direction:column;align-items:center;margin:10px 0 14px;position:relative;}' +
      '.org-node-vos{background:linear-gradient(135deg,#1e293b,#0f172a);border:1.5px solid #3ad0a4;border-radius:16px;padding:8px 14px;display:flex;flex-direction:column;align-items:center;min-width:140px;box-shadow:0 0 18px rgba(58,208,164,0.22);position:relative;z-index:2;}' +
      '.org-vos-badge{position:absolute;top:-8px;background:#3ad0a4;color:#0b1926;font-size:8.5px;font-weight:900;padding:1px 6px;border-radius:6px;letter-spacing:0.5px;}' +
      '.org-vos-avatar{font-size:18px;margin-bottom:2px;}' +
      '.org-vos-name{font-size:12px;font-weight:800;color:#fff;}' +
      '.org-vos-pb{font-size:11px;color:#3ad0a4;margin-top:2px;display:flex;align-items:center;gap:6px;}' +
      '.org-badge-rule{font-size:9.5px;background:rgba(58,208,164,0.14);color:#6ee7b7;padding:1px 5px;border-radius:5px;}' +
      '.org-tree-stem{width:2px;height:14px;background:#3ad0a4;opacity:0.6;}' +
      '.org-tree-branches{width:75%;height:10px;border-top:2px solid rgba(58,208,164,0.6);border-left:2px solid rgba(58,208,164,0.6);border-right:2px solid rgba(58,208,164,0.6);margin-bottom:6px;}' +
      '.org-slots-container{display:grid;grid-template-columns:repeat(auto-fit,minmax(95px,1fr));gap:8px;width:100%;z-index:2;}' +
      '.org-slot-card{border-radius:14px;padding:10px 6px;text-align:center;cursor:pointer;transition:all .18s;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:92px;}' +
      '.org-slot-card.empty{border:1.5px dashed rgba(255,255,255,0.24);background:rgba(255,255,255,0.03);}' +
      '.org-slot-card.empty:hover{border-color:#3ad0a4;background:rgba(58,208,164,0.06);transform:translateY(-2px);}' +
      '.org-slot-card.filled{border:1px solid rgba(58,208,164,0.45);background:linear-gradient(135deg,rgba(30,41,59,0.9),rgba(15,23,42,0.95));box-shadow:0 6px 16px rgba(0,0,0,0.28);}' +
      '.org-slot-card.filled:hover{transform:translateY(-2px);border-color:#3ad0a4;}' +
      '.org-slot-badge-cat{position:absolute;top:4px;left:6px;font-size:8px;font-weight:900;background:rgba(255,255,255,0.14);padding:1px 5px;border-radius:4px;color:#e2e8f0;}' +
      '.org-slot-del{position:absolute;top:3px;right:5px;background:none;border:none;color:#94a3b8;font-size:14px;cursor:pointer;padding:2px 4px;line-height:1;}' +
      '.org-slot-del:hover{color:#ef4444;}' +
      '.org-slot-avatar{width:26px;height:26px;border-radius:50%;background:#3b82f6;color:#fff;font-size:10px;font-weight:900;display:flex;align-items:center;justify-content:center;margin-bottom:4px;}' +
      '.org-slot-name{font-size:11px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:90px;}' +
      '.org-slot-dip{font-size:9px;color:#64748b;margin-bottom:3px;}' +
      '.org-slot-pb{font-size:10px;font-weight:800;}' +
      '.org-slot-add-icon{font-size:20px;color:#3ad0a4;line-height:1;margin-bottom:3px;}' +
      '.org-slot-empty-title{font-size:11px;font-weight:800;color:#e2e8f0;}' +
      '.org-slot-empty-sub{font-size:9.5px;color:#64748b;margin-top:2px;}' +
      '.org-footer-summary{border-top:1px solid rgba(255,255,255,0.08);padding-top:10px;font-size:11px;color:#94a3b8;}' +
      '.org-summary-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;flex-wrap:wrap;gap:6px;font-size:11.5px;}' +
      '.org-sum-highlight{color:#3ad0a4;font-weight:900;}' +
      '.org-progress-bar{height:6px;background:rgba(255,255,255,0.08);border-radius:99px;overflow:hidden;margin-bottom:6px;}' +
      '.org-progress-fill{height:100%;background:linear-gradient(90deg,#3ad0a4,#38bdf8);border-radius:99px;transition:width .3s;}' +
      '.org-footer-note{font-size:10px;color:#64748b;line-height:1.35;}' +
      /* Modal Selector */
      '.org-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(6px);z-index:99999;display:none;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .2s;}' +
      '.org-modal-overlay.open{opacity:1;}' +
      '.org-modal-card{background:#0f172a;border:1px solid rgba(255,255,255,0.14);border-radius:24px 24px 0 0;width:100%;max-width:520px;max-height:85vh;padding:18px 16px 24px;display:flex;flex-direction:column;box-shadow:0 -10px 30px rgba(0,0,0,0.5);transform:translateY(20px);transition:transform .22s;}' +
      '.org-modal-overlay.open .org-modal-card{transform:translateY(0);}' +
      '.org-modal-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;}' +
      '.org-modal-header h4{margin:0;font-size:15px;font-weight:900;color:#fff;}' +
      '.org-modal-header p{margin:2px 0 0;font-size:11.5px;color:#94a3b8;}' +
      '.org-modal-close{background:rgba(255,255,255,0.1);border:0;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;}' +
      '.org-modal-search{margin-bottom:10px;}' +
      '.org-modal-search input{width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);border-radius:12px;padding:9px 12px;font:inherit;font-size:13px;color:#fff;outline:none;box-sizing:border-box;}' +
      '.org-modal-search input:focus{border-color:#3ad0a4;background:rgba(255,255,255,0.09);}' +
      '.org-modal-list{overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:6px;max-height:55vh;}' +
      '.org-dist-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);cursor:pointer;transition:background .15s;}' +
      '.org-dist-item:hover{background:rgba(58,208,164,0.12);border-color:rgba(58,208,164,0.3);}' +
      '.org-dist-avatar{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;font-size:11px;font-weight:900;display:flex;align-items:center;justify-content:center;}' +
      '.org-dist-info{flex:1;min-width:0;}' +
      '.org-dist-name{font-size:12.5px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
      '.org-dist-sub{font-size:10px;color:#94a3b8;display:flex;align-items:center;gap:6px;margin-top:1px;}' +
      '.org-cat-pill{background:rgba(255,255,255,0.12);color:#e2e8f0;padding:0 5px;border-radius:4px;font-weight:800;font-size:9px;}' +
      '.org-dist-pb{font-size:12px;color:#3ad0a4;font-weight:900;}' +
      '.org-empty-list{text-align:center;padding:30px 10px;font-size:12px;color:#64748b;}';
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

    // 1. Asegurar contenedor del organigrama
    var orgCard = document.getElementById('carreraOrganigramaCard');
    if (!orgCard) {
      orgCard = document.createElement('div');
      orgCard.id = 'carreraOrganigramaCard';
    }

    var banner = document.getElementById('embudoKpi');
    var grid = document.getElementById('negGrid');
    var bonos = document.getElementById('bonosCard');

    // 1) Banner arriba de todo (después del header)
    var header = view.querySelector('header');
    if (banner) {
      if (header && banner.previousElementSibling !== header) {
        header.insertAdjacentElement('afterend', banner);
      }
    }

    // 2) Organigrama interactivo debajo del banner (o del header si no hay banner)
    var anchor = banner || header;
    if (anchor && orgCard.previousElementSibling !== anchor) {
      anchor.insertAdjacentElement('afterend', orgCard);
    }

    // 3) Grilla con 4 botones debajo del organigrama
    if (grid && orgCard && grid.previousElementSibling !== orgCard) {
      orgCard.insertAdjacentElement('afterend', grid);
    }

    // 4) Botón Reporte de Bonos DEBAJO DE TODO (después de negGrid)
    if (bonos && grid) {
      if (bonos.previousElementSibling !== grid) {
        grid.insertAdjacentElement('afterend', bonos);
      }
    }

    renderOrganigrama();
  }

  // Inicialización y observador
  function init(){
    reordenarSeccionNegocio();

    // Re-evaluar cuando se abra la vista o cambien datos
    var observer = new MutationObserver(function(){
      reordenarSeccionNegocio();
    });
    var v = document.getElementById('view-negocio');
    if (v) observer.observe(v, { childList: true });

    window.addEventListener('appi-bonos-cambiaron', reordenarSeccionNegocio);
    window.addEventListener('storage', function(e){
      if (e.key === 'equipoData' || e.key === LS_SAVED_PICKS || e.key === LS_TARGET_CAT) {
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
