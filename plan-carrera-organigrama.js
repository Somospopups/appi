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
    "D": {
      metaCat: "D",
      nombre: "Distribuidor (D)",
      metaBadge: "Subir a Distribuidor",
      personalReq: 13,
      slots: [
        { rol: "DJ", rolesPermitidos: ["DJ", "JUNIOR"], pbMin: 0, desc: "Línea 1 · Junior" },
        { rol: "DJ", rolesPermitidos: ["DJ", "JUNIOR"], pbMin: 0, desc: "Línea 2 · Junior" }
      ],
      equipoPbTotal: 13,
      premioPrincipal: "+3% de descuento en tus compras y 5% de comisión sobre tus directos.",
      claveMeta: "Tus 13 PB entre tus pedidos y tus directos (aprox. 1 Senior 4)."
    },
    "DC": {
      metaCat: "DC",
      nombre: "Distribuidor Calificado (DC)",
      metaBadge: "Subir a Calificado (DC)",
      personalReq: 13,
      slots: [
        { rol: "D", rolesPermitidos: ["D", "DISTRIBUIDOR"], pbMin: 13, desc: "Distribuidor 1" },
        { rol: "D", rolesPermitidos: ["D", "DISTRIBUIDOR"], pbMin: 13, desc: "Distribuidor 2" },
        { rol: "D", rolesPermitidos: ["D", "DISTRIBUIDOR"], pbMin: 13, desc: "Distribuidor 3" }
      ],
      equipoPbTotal: 52,
      premioPrincipal: "10% de comisión directa de tus 3 distribuidores + 7% de descuento permanente.",
      claveMeta: "Tus 13 PB personales y 3 distribuidores con 13 PB cada uno."
    },
    "CE": {
      metaCat: "CE",
      nombre: "Coordinador de Equipo (CE)",
      metaBadge: "Subir a Coordinador (CE)",
      personalReq: 50,
      slots: [
        { rol: "DC", rolesPermitidos: ["DC", "CALIFICADO", "DISTRIBUIDOR CALIFICADO"], pbMin: 50, desc: "Calificado 1" },
        { rol: "DC", rolesPermitidos: ["DC", "CALIFICADO", "DISTRIBUIDOR CALIFICADO"], pbMin: 50, desc: "Calificado 2" },
        { rol: "DC", rolesPermitidos: ["DC", "CALIFICADO", "DISTRIBUIDOR CALIFICADO"], pbMin: 50, desc: "Calificado 3" }
      ],
      equipoPbTotal: 200,
      premioPrincipal: "Cobrás hasta 18% de comisiones por toda tu red y bonos por volumen.",
      claveMeta: "3 Calificados con 50 PB cada uno durante 2 meses consecutivos."
    },
    "L": {
      metaCat: "L",
      nombre: "Líder de Equipo (L)",
      metaBadge: "Subir a Líder de Equipo (L)",
      personalReq: 50,
      slots: [
        { rol: "CE", rolesPermitidos: ["CE", "COORDINADOR"], pbMin: 180, desc: "Coordinador" },
        { rol: "DC", rolesPermitidos: ["DC", "CALIFICADO"], pbMin: 50, desc: "Calificado 1" },
        { rol: "DC", rolesPermitidos: ["DC", "CALIFICADO"], pbMin: 50, desc: "Calificado 2" },
        { rol: "D", rolesPermitidos: ["D", "DISTRIBUIDOR"], pbMin: 13, desc: "Distribuidor" }
      ],
      equipoPbTotal: 400,
      premioPrincipal: "Regalías mensuales de red, premios internacionales y Bonus 1 y 2 en efectivo.",
      claveMeta: "1 CE (180 PB), 2 DC (50 PB c/u) y 1 D (13 PB) sumando 400 PB totales."
    },
    "LE": {
      metaCat: "LE",
      nombre: "Líder Ejecutivo (LE)",
      metaBadge: "Subir a Líder Ejecutivo (LE)",
      personalReq: 50,
      slots: [
        { rol: "L", rolesPermitidos: ["L", "LIDER", "LÍDER", "LÍDER DE EQUIPO", "LÍDER PIONERO"], rolDesarrollo: ["CE", "COORDINADOR"], pbMin: 300, desc: "Líder 1" },
        { rol: "L", rolesPermitidos: ["L", "LIDER", "LÍDER", "LÍDER DE EQUIPO", "LÍDER PIONERO"], rolDesarrollo: ["CE", "COORDINADOR"], pbMin: 300, desc: "Líder 2" },
        { rol: "CE", rolesPermitidos: ["CE", "COORDINADOR"], rolDesarrollo: ["DC", "CALIFICADO"], pbMin: 180, desc: "Coordinador" },
        { rol: "DC", rolesPermitidos: ["DC", "CALIFICADO"], rolDesarrollo: ["D", "DISTRIBUIDOR"], pbMin: 50, desc: "Calificado" }
      ],
      equipoPbTotal: 850,
      premioPrincipal: "Bonos de Liderazgo Ejecutivo I, II y III todos los meses + Regalías ampliadas.",
      claveMeta: "2 Líderes calificados (300 PB c/u), 1 CE (180 PB) y 1 DC (50 PB)."
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
  
  
  function traducirPbaProductos(pb){
    if (pb <= 0) return '';
    var s4 = Math.ceil(pb / 14);
    if (pb < 14) return '≈ ' + pb.toFixed(1) + ' PB (ej. 1 Senior 4 o repuestos)';
    if (s4 === 1) return '≈ 1 Senior 4 (14 PB) o 1 Ducha Rinnova';
    if (s4 === 2) return '≈ 2 Senior 4 o 1 Pack Hogar';
    return '≈ ' + s4 + ' purificadores (Senior 4)';
  }

    function obtenerEnlaceWhatsApp(persona, textoMsg){
    if (!persona) return "";
    var raw = persona.tel || persona.telefono || persona.celular || "";
    if (!raw) return "";

    // Si APPITel está disponible en la app, usar primeroValido
    if (window.APPITel && typeof window.APPITel.primeroValido === "function") {
      var nVal = window.APPITel.primeroValido(raw);
      if (nVal) {
        return (window.APPITel.link ? window.APPITel.link(nVal, textoMsg) : ("https://wa.me/" + nVal + "?text=" + encodeURIComponent(textoMsg)));
      }
    }

    // Separar por barras, guiones, comas, espacios o saltos de línea
    var partes = String(raw).split(/[\/,;\n\r|]|\s{2,}|\s*-\s*/);
    for (var i = 0; i < partes.length; i++) {
      var p = partes[i].trim();
      if (!p) continue;
      var d = p.replace(/\D/g, "");
      if (d.length >= 8 && d.length <= 15) {
        if (d.slice(0, 2) === "00") d = d.slice(2);
        if (d.slice(0, 2) === "54") d = d.slice(2);
        if (d.charAt(0) === "9" && d.length >= 11) d = d.slice(1);
        if (d.charAt(0) === "0") d = d.slice(1);
        if (d.length === 12 && d.indexOf("15") > 0) d = d.replace("15", "");
        if (d.length === 10) return "https://wa.me/549" + d + "?text=" + encodeURIComponent(textoMsg);
      }
    }

    // Si los dos teléfonos se concatenaron sin espacio (ej. 20 dígitos)
    var soloD = String(raw).replace(/\D/g, "");
    if (soloD.length >= 20) {
      var d1 = soloD.substring(0, 10);
      if (d1.length === 10) return "https://wa.me/549" + d1 + "?text=" + encodeURIComponent(textoMsg);
    }
    return "";
  }

  function personaCalificaParaSlot(persona, slotConfig, permitirDesarrollo){
    if (!persona) return false;
    if (!persona) return false;
    var pCatCode = normalizarCodigoCat(persona.cat || persona.categoria || '');
    var rolTarget = normalizarCodigoCat(slotConfig.rol);

    if (pCatCode === rolTarget) return true;
    if (permitirDesarrollo && Array.isArray(slotConfig.rolDesarrollo)) {
      for (var j = 0; j < slotConfig.rolDesarrollo.length; j++) {
        var des = norm(slotConfig.rolDesarrollo[j]);
        var rawCat = norm(persona.cat || persona.categoria || '');
        if (rawCat === des || rawCat.indexOf(des) >= 0) return true;
      }
    }

    var raw = norm(persona.cat || persona.categoria || '');
    if (Array.isArray(slotConfig.rolesPermitidos)) {
      for (var i = 0; i < slotConfig.rolesPermitidos.length; i++) {
        var permit = norm(slotConfig.rolesPermitidos[i]);
        if (raw === permit || raw.indexOf(permit) >= 0) return true;
      }
    }
    return false;
  }

  
  function autocompletarMejores(targetCat){
    var regla = PLAN_REGLAS[targetCat];
    var padron = obtenerPadrón();
        var p = leerPicks();
    if (!p[targetCat]) p[targetCat] = [];
    var usados = {};

    regla.slots.forEach(function(slot, idx){
      var candidatos = padron.filter(function(cand){
        var dip = cand.codigo || cand.dip || cand.id;
        if (usados[dip]) return false;
        return personaCalificaParaSlot(cand, slot, false);
      });
      if (!candidatos.length) {
        candidatos = padron.filter(function(cand){
          var dip = cand.codigo || cand.dip || cand.id;
          if (usados[dip]) return false;
          return personaCalificaParaSlot(cand, slot, true);
        });
      }
      candidatos.sort(function(a, b){
        var pbA = Number(a.pnAct || a.pbPersonal || a.pb || 0);
        var pbB = Number(b.pnAct || b.pbPersonal || b.pb || 0);
        return pbB - pbA;
      });
      if (candidatos.length > 0) {
        var elegidoDip = candidatos[0].codigo || candidatos[0].dip || candidatos[0].id;
        p[targetCat][idx] = elegidoDip;
        usados[elegidoDip] = true;
      }
    });
    guardarPicks(p);
    renderOrganigrama();
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
        var pClass = cumpleMin ? "ok" : "falta";
        var catBadge = persona.cat || slot.rol;
        var pNombreCorto = (persona.nombre || "").split(" ")[0];
        var faltanP = Math.max(0, slot.pbMin - pbP);
        var textoMsg = cumpleMin
          ? ("¡Felicitaciones " + pNombreCorto + "! Ya tenés " + pbP.toFixed(1) + " PB este mes y tu línea está calificada 🎉. ¡Sigamos con todo!")
          : ("¡Hola " + pNombreCorto + "! Llevás " + pbP.toFixed(1) + " PB este mes, estás a solo " + faltanP.toFixed(1) + " PB de calificar tu línea. ¿Coordinamos unas demos esta semana para cerrarlo? 💪");

        var waUrl = obtenerEnlaceWhatsApp(persona, textoMsg);
        var waBtn = waUrl ? ('<a class="org-slot-wa-btn" href="' + waUrl + '" target="_blank" onclick="event.stopPropagation();" title="Escribir por WhatsApp">💬</a>') : "";

        return '<div class="org-slot-card filled ' + pClass + '" data-pick-slot="' + idx + '" title="Tocar para cambiar">' +
          '<div class="org-slot-top">' +
            '<span class="org-cat-tag">' + esc(catBadge) + '</span>' +
            '<div class="org-slot-actions-top">' +
              waBtn +
              '<button type="button" class="org-slot-remove-btn" data-remove-slot="' + idx + '" title="Quitar">×</button>' +
            '</div>' +
          '</div>' +
          '<div class="org-slot-avatar-wrap">' +
            '<div class="org-slot-avatar">' + esc((persona.nombre || "D").substring(0, 2).toUpperCase()) + '</div>' +
            (cumpleMin ? '<span class="org-slot-check">✓</span>' : "") +
          '</div>' +
          '<div class="org-slot-name">' + esc(persona.nombre || "Distribuidor") + '</div>' +
          '<div class="org-slot-pb-badge ' + pClass + '">' +
            '<b>' + pbP.toFixed(1) + ' PB</b>' +
            '<small>/ ' + slot.pbMin + ' mín</small>' +
          '</div>' +
        '</div>';
      } else {
        return '<div class="org-slot-card empty" data-pick-slot="' + idx + '">' +
          '<div class="org-slot-plus-circle">+</div>' +
          '<div class="org-slot-empty-title">' + esc(slot.desc || ("Línea " + slot.rol)) + '</div>' +
          '<div class="org-slot-empty-min">Mín. ' + slot.pbMin + ' PB</div>' +
        '</div>';
      }
    }).join("");

    // Diagnóstico claro y corto sin textos dando vueltas
    var pbFaltanVos = Math.max(0, regla.personalReq - pbVos);
    var lineasFaltan = Math.max(0, regla.slots.length - lineasCompletas);
    var pbFaltanTotal = Math.max(0, regla.equipoPbTotal - pbTotalProyectado);

    var queFaltaTexto = "";
    if (vosCumple && lineasFaltan === 0 && pbFaltanTotal === 0) {
      queFaltaTexto = "🎉 <b>¡Completaste todos los requisitos!</b> Mantené este volumen para cerrar el mes como " + esc(regla.nombre) + ".";
    } else {
      var partes = [];
      if (pbFaltanVos > 0) partes.push("<b>" + pbFaltanVos.toFixed(1) + " PB tuyos</b>");
      if (lineasFaltan > 0) partes.push("<b>" + lineasFaltan + " línea" + (lineasFaltan === 1 ? "" : "s") + " activa" + (lineasFaltan === 1 ? "" : "s") + "</b>");
      if (pbFaltanTotal > 0 && lineasFaltan === 0) partes.push("<b>" + pbFaltanTotal.toFixed(1) + " PB grupales</b>");
      queFaltaTexto = "Te falta: " + partes.join(" · ");
    }

    wrap.innerHTML =
      '<div class="org-card">' +
        '<!-- ENCABEZADO MINIMALISTA -->' +
        '<div class="org-head">' +
          '<div class="org-head-info">' +
            '<div class="org-eyebrow">🚀 TU PRÓXIMO RANGO</div>' +
            '<h2 class="org-title">' + esc(regla.metaBadge) + '</h2>' +
          '</div>' +
          '<div class="org-head-actions">' +
            '<button type="button" class="org-magic-btn" id="orgMagicSuggestBtn" title="Ubicar a tus mejores distribuidores automáticamente">⚡ Auto-ubicar</button>' +
          '</div>' +
        '</div>' +

        '<!-- BENEFICIO DIRECTO EN UNA LÍNEA -->' +
        '<div class="org-benefit-strip">' +
          '<span class="org-benefit-icon">🎁</span> ' +
          '<span class="org-benefit-txt"><b>Qué ganás al subir:</b> ' + esc(regla.premioPrincipal) + '</span>' +
        '</div>' +

        '<!-- ÁRBOL VISUAL COMPACTO Y CÓMODO -->' +
        '<div class="org-tree-stage">' +
          '<!-- NODO VOS -->' +
          '<div class="org-vos-card ' + (vosCumple ? "ok" : "") + '">' +
            '<span class="org-vos-pill">VOS · ' + esc(titular.cat || "L") + '</span>' +
            '<div class="org-vos-avatar-wrap">' +
              '<div class="org-vos-avatar">👑</div>' +
              (vosCumple ? '<span class="org-vos-check">✓</span>' : "") +
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

          '<!-- CASILLEROS INTERACTIVOS -->' +
          '<div class="org-slots-grid count-' + regla.slots.length + '">' +
            slotsHtml +
          '</div>' +
        '</div>' +

        '<!-- BARRA Y DIAGNÓSTICO EN 1 LÍNEA -->' +
        '<div class="org-status-box">' +
          '<div class="org-status-row">' +
            '<span class="org-status-label">Progreso hacia ' + esc(targetCat) + '</span>' +
            '<span class="org-status-val"><b>' + pbTotalProyectado.toFixed(1) + '</b> / ' + regla.equipoPbTotal + ' PB</span>' +
          '</div>' +
          '<div class="org-progress-track">' +
            '<div class="org-progress-bar" style="width:' + pctTotal + '%"></div>' +
          '</div>' +
          '<div class="org-status-hint">' + queFaltaTexto + '</div>' +
        '</div>' +
      '</div>';

    // Eventos de interacción
    var mBtn = wrap.querySelector('#orgMagicSuggestBtn'); if (mBtn) mBtn.onclick = function(){ autocompletarMejores(targetCat); };

    wrap.querySelectorAll('[data-pick-slot]').forEach(function(slotEl){
      slotEl.onclick = function(e){
        if (e.target.closest('[data-remove-slot]') || e.target.closest('.org-slot-wa-btn')) return;
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
    var tabActual = 'exacta';

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
        '<div class="org-modal-tabs">' +
          '<button type="button" class="org-m-tab active" data-tab="exacta">Solo ' + esc(slotConfig.rol) + '</button>' +
          (slotConfig.rolDesarrollo && slotConfig.rolDesarrollo.length ? '<button type="button" class="org-m-tab" data-tab="desarrollo">En desarrollo (' + slotConfig.rolDesarrollo.join('/') + ')</button>' : '') +
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
      var esDesarrollo = (tabActual === 'desarrollo');
      var filtrados = padron.filter(function(p){
        var califica = false;
        if (!esDesarrollo) { califica = personaCalificaParaSlot(p, slotConfig, false); }
        else { califica = !personaCalificaParaSlot(p, slotConfig, false) && personaCalificaParaSlot(p, slotConfig, true); }
        if (!califica) return false;
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

    m.querySelectorAll('.org-m-tab').forEach(function(tb){
        tb.onclick = function(){
          m.querySelectorAll('.org-m-tab').forEach(function(b){ b.classList.remove('active'); });
          tb.classList.add('active');
          tabActual = tb.getAttribute('data-tab');
          renderLista(searchInp.value);
        };
      });
      renderLista('');
    searchInp.oninput = function(){ renderLista(searchInp.value); };
    setTimeout(function(){ searchInp.focus(); }, 150);
  }

  /* ------------------------------------------------------------
     ESTILOS NATIVOS INTEGRADOS AL DISEÑO DE APPI
  ------------------------------------------------------------ */
  function inyectarEstilos(){
    if (document.getElementById("planCarreraEstilos")) return;
    var st = document.createElement("style");
    st.id = "planCarreraEstilos";
    st.textContent =
      "#carreraOrganigramaCard{margin:10px 14px 14px;}" +
      ".org-card{" +
        "background:rgba(255,255,255,0.85);" +
        "border:1px solid rgba(255,255,255,0.9);" +
        "border-radius:22px;" +
        "padding:16px 14px 14px;" +
        "box-shadow:0 8px 24px rgba(11,88,120,0.06),0 1px 3px rgba(0,0,0,0.02);" +
        "backdrop-filter:blur(20px);" +
        "-webkit-backdrop-filter:blur(20px);" +
        "color:#1c1c1e;" +
        "position:relative;" +
      "}" +
      "body.dark .org-card{background:rgba(28,28,30,0.9);border-color:rgba(255,255,255,0.12);color:#f4f4f6;box-shadow:0 10px 28px rgba(0,0,0,0.4);}" +
      ".org-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;}" +
      ".org-head-info{min-width:0;}" +
      ".org-eyebrow{font-size:9.5px;font-weight:900;letter-spacing:0.8px;color:#10b981;text-transform:uppercase;margin-bottom:2px;}" +
      "body.dark .org-eyebrow{color:#34d399;}" +
      ".org-title{margin:0;font-size:17px;font-weight:900;letter-spacing:-0.3px;color:#0b5878;line-height:1.2;}" +
      "body.dark .org-title{color:#7dd3fc;}" +
      ".org-magic-btn{background:linear-gradient(135deg,#e0f2fe,#bae6fd);border:1px solid #7dd3fc;color:#0369a1;font-size:11.5px;font-weight:800;padding:6px 12px;border-radius:12px;cursor:pointer;display:inline-flex;align-items:center;gap:4px;transition:all .18s;}" +
      "body.dark .org-magic-btn{background:rgba(56,189,248,0.18);border-color:#38bdf8;color:#7dd3fc;}" +
      ".org-magic-btn:active{transform:scale(.96);}" +
      /* Tira de beneficio limpia en 1 sola línea */
      ".org-benefit-strip{display:flex;align-items:center;gap:8px;background:rgba(16,185,129,0.09);border:1px solid rgba(16,185,129,0.22);border-radius:12px;padding:8px 12px;margin-bottom:12px;}" +
      "body.dark .org-benefit-strip{background:rgba(16,185,129,0.14);border-color:rgba(52,211,153,0.3);}" +
      ".org-benefit-icon{font-size:15px;line-height:1;}" +
      ".org-benefit-txt{font-size:11.5px;color:#065f46;line-height:1.35;}" +
      "body.dark .org-benefit-txt{color:#a7f3d0;}" +
      ".org-benefit-txt b{font-weight:850;}" +
      /* Árbol */
      ".org-tree-stage{display:flex;flex-direction:column;align-items:center;margin:6px 0 12px;position:relative;}" +
      ".org-vos-card{background:#ffffff;border:1.5px solid #0b5878;border-radius:16px;padding:8px 14px;display:flex;flex-direction:column;align-items:center;min-width:130px;max-width:180px;box-shadow:0 4px 14px rgba(11,88,120,0.08);position:relative;z-index:2;}" +
      "body.dark .org-vos-card{background:#1e293b;border-color:#38bdf8;box-shadow:0 6px 16px rgba(0,0,0,0.3);}" +
      ".org-vos-card.ok{border-color:#10b981;}" +
      ".org-vos-pill{position:absolute;top:-8px;background:#0b5878;color:#fff;font-size:8.5px;font-weight:900;padding:2px 7px;border-radius:6px;letter-spacing:0.4px;}" +
      ".org-vos-card.ok .org-vos-pill{background:#10b981;}" +
      ".org-vos-avatar-wrap{position:relative;margin:2px 0;}" +
      ".org-vos-avatar{width:30px;height:30px;border-radius:50%;background:#e0f2fe;display:flex;align-items:center;justify-content:center;font-size:16px;}" +
      ".org-vos-check{position:absolute;bottom:-2px;right:-4px;background:#10b981;color:#fff;font-size:9px;width:13px;height:13px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1px solid #fff;font-weight:900;}" +
      ".org-vos-name{font-size:12px;font-weight:850;color:#1c1c1e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px;}" +
      "body.dark .org-vos-name{color:#fff;}" +
      ".org-vos-pb{font-size:11px;color:#0b5878;margin-top:1px;display:flex;flex-direction:column;align-items:center;line-height:1.2;}" +
      "body.dark .org-vos-pb{color:#38bdf8;}" +
      ".org-vos-pb b{font-size:12px;font-weight:900;}" +
      ".org-vos-pb small{font-size:9px;color:#777887;font-weight:600;}" +
      "body.dark .org-vos-pb small{color:#94a3b8;}" +
      ".org-stem{width:2px;height:12px;background:#0b5878;opacity:0.25;}" +
      "body.dark .org-stem{background:#38bdf8;opacity:0.4;}" +
      ".org-branch-line{width:75%;height:8px;border-top:2px solid rgba(11,88,120,0.25);border-left:2px solid rgba(11,88,120,0.25);border-right:2px solid rgba(11,88,120,0.25);border-radius:4px 4px 0 0;margin-bottom:6px;}" +
      "body.dark .org-branch-line{border-color:rgba(56,189,248,0.4);}" +
      /* Slots de Distribuidores */
      ".org-slots-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(95px,1fr));gap:6px;width:100%;z-index:2;}" +
      ".org-slot-card{border-radius:14px;padding:8px 6px;text-align:center;cursor:pointer;transition:all .18s;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:95px;}" +
      ".org-slot-card.empty{border:1.5px dashed rgba(11,88,120,0.25);background:rgba(255,255,255,0.4);}" +
      "body.dark .org-slot-card.empty{border-color:rgba(255,255,255,0.18);background:rgba(255,255,255,0.03);}" +
      ".org-slot-card.empty:hover{border-color:#0b5878;background:rgba(11,88,120,0.05);}" +
      ".org-slot-card.filled{background:#ffffff;border:1px solid rgba(11,88,120,0.18);box-shadow:0 2px 8px rgba(0,0,0,0.04);}" +
      "body.dark .org-slot-card.filled{background:#1e293b;border-color:rgba(255,255,255,0.12);box-shadow:0 4px 12px rgba(0,0,0,0.25);}" +
      ".org-slot-card.filled.ok{border-color:#10b981;}" +
      ".org-slot-top{display:flex;justify-content:space-between;align-items:center;width:100%;margin-bottom:2px;}" +
      ".org-cat-tag{font-size:8.5px;font-weight:900;background:rgba(11,88,120,0.08);color:#0b5878;padding:1px 5px;border-radius:4px;}" +
      "body.dark .org-cat-tag{background:rgba(56,189,248,0.16);color:#7dd3fc;}" +
      ".org-slot-actions-top{display:flex;align-items:center;gap:3px;}" +
      ".org-slot-wa-btn{background:rgba(16,185,129,0.12);color:#059669;font-size:12px;padding:2px 5px;border-radius:6px;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;line-height:1;}" +
      ".org-slot-wa-btn:hover{background:#10b981;color:#fff;}" +
      ".org-slot-remove-btn{background:none;border:none;color:#94a3b8;font-size:14px;cursor:pointer;padding:0 2px;line-height:1;}" +
      ".org-slot-remove-btn:hover{color:#ef4444;}" +
      ".org-slot-avatar-wrap{position:relative;margin-bottom:3px;}" +
      ".org-slot-avatar{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#3d63c9,#5b8def);color:#fff;font-size:10px;font-weight:900;display:flex;align-items:center;justify-content:center;}" +
      ".org-slot-check{position:absolute;bottom:-2px;right:-3px;background:#10b981;color:#fff;font-size:8px;width:12px;height:12px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1px solid #fff;font-weight:900;}" +
      ".org-slot-name{font-size:11px;font-weight:800;color:#1c1c1e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:85px;line-height:1.2;}" +
      "body.dark .org-slot-name{color:#f1f5f9;}" +
      ".org-slot-pb-badge{font-size:9.5px;margin-top:2px;padding:2px 5px;border-radius:5px;line-height:1.2;}" +
      ".org-slot-pb-badge.ok{background:rgba(16,185,129,0.12);color:#059669;}" +
      "body.dark .org-slot-pb-badge.ok{background:rgba(16,185,129,0.2);color:#34d399;}" +
      ".org-slot-pb-badge.falta{background:rgba(245,158,11,0.12);color:#b45309;}" +
      "body.dark .org-slot-pb-badge.falta{background:rgba(245,158,11,0.2);color:#fbbf24;}" +
      ".org-slot-pb-badge b{font-size:10.5px;font-weight:900;}" +
      ".org-slot-pb-badge small{font-size:8.5px;opacity:0.85;}" +
      ".org-slot-plus-circle{width:26px;height:26px;border-radius:50%;background:rgba(11,88,120,0.08);color:#0b5878;font-size:16px;font-weight:800;display:flex;align-items:center;justify-content:center;margin-bottom:2px;}" +
      "body.dark .org-slot-plus-circle{background:rgba(56,189,248,0.12);color:#38bdf8;}" +
      ".org-slot-empty-title{font-size:10px;font-weight:800;color:#0b5878;line-height:1.2;}" +
      "body.dark .org-slot-empty-title{color:#7dd3fc;}" +
      ".org-slot-empty-min{font-size:8.5px;color:#10b981;font-weight:800;margin-top:2px;}" +
      "body.dark .org-slot-empty-min{color:#34d399;}" +
      /* Barra y Estado */
      ".org-status-box{background:rgba(255,255,255,0.7);border:1px solid rgba(11,88,120,0.1);border-radius:14px;padding:10px 12px;margin-top:6px;}" +
      "body.dark .org-status-box{background:rgba(15,23,42,0.5);border-color:rgba(255,255,255,0.08);}" +
      ".org-status-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;font-size:11.5px;font-weight:750;color:#1c1c1e;}" +
      "body.dark .org-status-row{color:#e2e8f0;}" +
      ".org-status-val b{color:#0b5878;font-weight:900;}" +
      "body.dark .org-status-val b{color:#38bdf8;}" +
      ".org-progress-track{height:6px;background:rgba(11,88,120,0.08);border-radius:99px;overflow:hidden;margin-bottom:6px;}" +
      "body.dark .org-progress-track{background:rgba(255,255,255,0.08);}" +
      ".org-progress-bar{height:100%;background:linear-gradient(90deg,#3ad0a4,#0b5878);border-radius:99px;transition:width .4s ease;}" +
      ".org-status-hint{font-size:11px;color:#475569;line-height:1.35;}" +
      "body.dark .org-status-hint{color:#cbd5e1;}" +
      ".org-status-hint b{color:#0b5878;}" +
      "body.dark .org-status-hint b{color:#7dd3fc;}" +
      /* Modal Selector */
      ".org-modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,0.55);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);z-index:99999;display:none;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .2s ease;}" +
      ".org-modal-overlay.open{opacity:1;}" +
      ".org-modal-card{background:#ffffff;border:1px solid rgba(255,255,255,0.9);border-radius:24px 24px 0 0;width:100%;max-width:520px;max-height:82vh;padding:16px 14px 22px;display:flex;flex-direction:column;box-shadow:0 -10px 30px rgba(0,0,0,0.18);transform:translateY(24px);transition:transform .22s ease;}" +
      "body.dark .org-modal-card{background:#1e293b;border-color:rgba(255,255,255,0.12);color:#fff;}" +
      ".org-modal-overlay.open .org-modal-card{transform:translateY(0);}" +
      ".org-modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;}" +
      ".org-modal-header h4{margin:0;font-size:15px;font-weight:900;color:#0b5878;}" +
      "body.dark .org-modal-header h4{color:#7dd3fc;}" +
      ".org-modal-close{background:rgba(11,88,120,0.08);border:0;color:#0b5878;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;font-weight:900;}" +
      "body.dark .org-modal-close{background:rgba(255,255,255,0.1);color:#fff;}" +
      ".org-modal-tabs{display:flex;gap:6px;margin-bottom:8px;}" +
      ".org-m-tab{flex:1;padding:6px 10px;border-radius:8px;border:1px solid rgba(11,88,120,0.12);background:#f1f5f9;color:#0b5878;font-size:11px;font-weight:800;cursor:pointer;transition:all .15s;}" +
      "body.dark .org-m-tab{background:rgba(255,255,255,0.06);border-color:rgba(255,255,255,0.1);color:#94a3b8;}" +
      ".org-m-tab.active{background:#0b5878;color:#fff;border-color:#0b5878;}" +
      "body.dark .org-m-tab.active{background:#38bdf8;color:#0f172a;border-color:#38bdf8;}" +
      ".org-modal-search{margin-bottom:8px;}" +
      ".org-modal-search input{width:100%;background:#f1f5f9;border:1px solid rgba(11,88,120,0.12);border-radius:12px;padding:9px 12px;font:inherit;font-size:12.5px;color:#1c1c1e;outline:none;box-sizing:border-box;}" +
      "body.dark .org-modal-search input{background:rgba(255,255,255,0.06);border-color:rgba(255,255,255,0.12);color:#fff;}" +
      ".org-modal-search input:focus{border-color:#0b5878;background:#fff;}" +
      ".org-modal-list{overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:5px;max-height:50vh;padding-right:2px;}" +
      ".org-dist-item{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:12px;background:#f8fafc;border:1px solid rgba(11,88,120,0.06);cursor:pointer;transition:all .15s;}" +
      "body.dark .org-dist-item{background:rgba(255,255,255,0.03);border-color:rgba(255,255,255,0.06);}" +
      ".org-dist-item:hover{background:rgba(11,88,120,0.05);border-color:#0b5878;}" +
      ".org-dist-avatar{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#0b5878,#3ad0a4);color:#fff;font-size:11px;font-weight:900;display:flex;align-items:center;justify-content:center;flex-shrink:0;}" +
      ".org-dist-info{flex:1;min-width:0;}" +
      ".org-dist-name{font-size:12.5px;font-weight:800;color:#1c1c1e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}" +
      "body.dark .org-dist-name{color:#fff;}" +
      ".org-dist-sub{font-size:10px;color:#777887;display:flex;align-items:center;gap:5px;margin-top:1px;font-weight:600;}" +
      "body.dark .org-dist-sub{color:#94a3b8;}" +
      ".org-cat-pill{background:#e2e8f0;color:#1e293b;padding:1px 5px;border-radius:4px;font-weight:800;font-size:9px;}" +
      ".org-dist-pb{display:flex;flex-direction:column;align-items:flex-end;font-size:12px;font-weight:900;}" +
      ".org-dist-pb.ok{color:#059669;}" +
      ".org-dist-pb.falta{color:#b45309;}" +
      "body.dark .org-dist-pb.ok{color:#34d399;}" +
      "body.dark .org-dist-pb.falta{color:#fbbf24;}" +
      ".org-dist-pb small{font-size:9px;font-weight:700;}" +
      ".org-empty-list{text-align:center;padding:28px 12px;font-size:12px;color:#777887;line-height:1.4;}";
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
    abrirSelector: abrirSelectorDistribuidor,
    autocompletar: autocompletarMejores
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 300);
  }

})();
