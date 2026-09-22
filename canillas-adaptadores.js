
  function getPdfPageImg(num) {
    var p = String(num || 1);
    if (p.length === 1) p = '0' + p;
    return 'paginas-guia-pdf/page-' + p + '.jpg';
  }
(function(){
  'use strict';

  var CANILLAS = [
    {
      id: 1, marca: 'FV', modelo: 'Alerce', codFab: '0411.04/89',
      rosca: 'Rosca macho estándar / múltiple',
      adaptador: 'PSA 002 (o PSA 073)',
      obs: 'Lleva PSA 002. También es posible colocar el Adaptador Múltiple PSA 073.',
      pag: 5, adaptadoresImg: ['002', '073']
    },
    {
      id: 2, marca: 'FV', modelo: 'Arizona', codFab: '0411.01/B1',
      rosca: 'Rosca macho estándar / múltiple',
      adaptador: 'PSA 002 (o PSA 073)',
      obs: 'Lleva PSA 002. También es posible colocar el Adaptador Múltiple PSA 073.',
      pag: 6, adaptadoresImg: ['002', '073']
    },
    {
      id: 3, marca: 'FV', modelo: 'Chess', codFab: '0411.04/C2',
      rosca: 'Rosca macho estándar / múltiple',
      adaptador: 'PSA 002 (o PSA 073)',
      obs: 'Lleva PSA 002. Compatible con Adaptador Múltiple PSA 073.',
      pag: 7, adaptadoresImg: ['002', '073']
    },
    {
      id: 4, marca: 'FV', modelo: 'Cisne', codFab: '0413/15',
      rosca: 'Rosca hembra aireador M24x1',
      adaptador: 'PSA 003',
      obs: 'Lleva PSA 003 (Rosca corta) retirando el aireador original.',
      pag: 8, adaptadoresImg: ['003']
    },
    {
      id: 5, marca: 'FV', modelo: 'Denise', codFab: '0411.01/85',
      rosca: 'Rosca macho estándar',
      adaptador: 'PSA 002',
      obs: 'Lleva PSA 002 rosca Unimix.',
      pag: 9, adaptadoresImg: ['002']
    },
    {
      id: 6, marca: 'FV', modelo: 'Dominic New', codFab: '0412.01/85',
      rosca: 'Rosca hembra embutida M24',
      adaptador: 'PSA 004 (o PSA 027)',
      obs: 'Lleva PSA 004 (Rosca larga) por profundidad del pico.',
      pag: 10, adaptadoresImg: ['004']
    },
    {
      id: 7, marca: 'FV', modelo: 'Epuyén', codFab: '0411.01/L2',
      rosca: 'Rosca macho estándar / múltiple',
      adaptador: 'PSA 002 (o PSA 073)',
      obs: 'Lleva PSA 002. También es posible colocar el Adaptador Múltiple PSA 073.',
      pag: 11, adaptadoresImg: ['002', '073']
    },
    {
      id: 8, marca: 'FV', modelo: 'Libby', codFab: '0412/39',
      rosca: 'Rosca hembra 22x1',
      adaptador: 'PSA 010 (o PSA 039)',
      obs: 'Lleva PSA 010 hembra-hembra estándar.',
      pag: 12, adaptadoresImg: ['010']
    },
    {
      id: 9, marca: 'FV', modelo: 'Margot', codFab: '0411.04/B6',
      rosca: 'Rosca macho estándar',
      adaptador: 'PSA 002 (o PSA 073)',
      obs: 'Lleva PSA 002 con acople directo.',
      pag: 13, adaptadoresImg: ['002', '073']
    },
    {
      id: 10, marca: 'FV', modelo: 'Pampa', codFab: '0411.01/B6',
      rosca: 'Rosca macho estándar',
      adaptador: 'PSA 002',
      obs: 'Lleva PSA 002 estándar.',
      pag: 14, adaptadoresImg: ['002']
    },
    {
      id: 11, marca: 'FV', modelo: 'Smile', codFab: '0411.04/E2',
      rosca: 'Rosca macho estándar / múltiple',
      adaptador: 'PSA 002 (o PSA 073)',
      obs: 'Lleva PSA 002. También es posible colocar el Adaptador Múltiple PSA 073.',
      pag: 15, adaptadoresImg: ['002', '073']
    },
    {
      id: 12, marca: 'FV', modelo: 'Swing Plus', codFab: '0416/91',
      rosca: 'Rosca especial Swing Plus',
      adaptador: 'PSA 037 (o PSA 148)',
      obs: 'Lleva adaptador específico PSA 037 macho o PSA 148 según terminación.',
      pag: 16, adaptadoresImg: ['037', '148']
    },
    {
      id: 13, marca: 'FV', modelo: 'Temple', codFab: '0411.04/87',
      rosca: 'Rosca macho estándar / múltiple',
      adaptador: 'PSA 002 (o PSA 073)',
      obs: 'Lleva PSA 002. Compatible con Adaptador Múltiple PSA 073.',
      pag: 17, adaptadoresImg: ['002', '073']
    },
    {
      id: 14, marca: 'FV', modelo: 'Unimix Tradicional', codFab: '0411/24',
      rosca: 'Rosca Unimix original',
      adaptador: 'PSA 002',
      obs: 'Lleva PSA 002 (diseñado específicamente para el paso Unimix).',
      pag: 18, adaptadoresImg: ['002']
    },
    {
      id: 15, marca: 'FV', modelo: 'Vermont', codFab: '0411.04/90',
      rosca: 'Rosca macho estándar / múltiple',
      adaptador: 'PSA 002 (o PSA 073)',
      obs: 'Lleva PSA 002. También es posible en esta canilla colocar el Adaptador Múltiple PSA 073.',
      pag: 19, adaptadoresImg: ['002', '073']
    },
    {
      id: 16, marca: 'Peirano', modelo: 'Adagio', codFab: '60-120',
      rosca: 'Rosca macho estándar',
      adaptador: 'PSA 002 (o PSA 073)',
      obs: 'Lleva PSA 002. También es compatible con PSA 073.',
      pag: 21, adaptadoresImg: ['002', '073']
    },
    {
      id: 17, marca: 'Peirano', modelo: 'Capri', codFab: '20-110',
      rosca: 'Rosca macho estándar / múltiple',
      adaptador: 'PSA 002 (o PSA 073)',
      obs: 'Lleva PSA 002 estándar.',
      pag: 22, adaptadoresImg: ['002', '073']
    },
    {
      id: 41, marca: 'Piazza', modelo: 'Dot', codFab: '10112',
      rosca: 'Rosca macho estándar / múltiple',
      adaptador: 'PSA 002 (o PSA 073)',
      obs: 'Lleva PSA 002. También es posible en esta canilla colocar el Adaptador Múltiple PSA 073.',
      pag: 45, adaptadoresImg: ['002', '073']
    }
  ];

  var state = {
    idx: 2, // Empezar en FV Chess (3 de 53) como en la captura
    userImg: null
  };

  try {
    state.userImg = localStorage.getItem('appi_canilla_user_img') || null;
  } catch(e) {}

  function esc(s){
    if (s == null) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function inyectarEstilos(){
    if (document.getElementById('canillasEstilosCaptura')) return;
    var st = document.createElement('style');
    st.id = 'canillasEstilosCaptura';
    st.textContent = [
      '#view-canillas header.top h1{padding:0 85px 0 45px!important;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '#view-canillas{background:#f3eee3;min-height:100vh;padding:14px 14px 110px;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text","Helvetica Neue",sans-serif;-webkit-font-smoothing:antialiased}',
      'body.dark #view-canillas{background:#1c1e2a}',
      '.can-layout-wrap{max-width:500px;margin:0 auto;display:flex;flex-direction:column;gap:14px}',
      '.can-top-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}',
      '.can-box-panel{background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-radius:24px;border:1px solid rgba(0,0,0,0.06);box-shadow:0 8px 24px rgba(0,0,0,0.04);padding:14px 10px 14px;display:flex;flex-direction:column;align-items:center;min-height:360px;position:relative}',
      'body.dark .can-box-panel{background:rgba(35,37,54,0.9);border-color:rgba(255,255,255,0.08);box-shadow:0 8px 24px rgba(0,0,0,0.25)}',
      '.can-box-title{font-size:11px;font-weight:900;letter-spacing:0.8px;color:#71717a;text-transform:uppercase;margin-bottom:12px;text-align:center}',
      'body.dark .can-box-title{color:#a1a1aa}',
      '.can-photo-frame{width:100%;flex:1;background:#fafaf9;border-radius:18px;overflow:hidden;display:flex;align-items:center;justify-content:center;position:relative;min-height:245px;box-shadow:inset 0 0 0 1px rgba(0,0,0,0.04)}',
      'body.dark .can-photo-frame{background:#161722}',
      '.can-photo-frame img{width:100%;height:100%;object-fit:cover;display:block}',
      '.can-ios-icon-btns{display:flex;align-items:center;justify-content:center;gap:12px;width:100%;margin-top:12px}',
      '.can-ios-btn{width:46px;height:46px;border-radius:50%;border:none;background:#ffffff;box-shadow:0 4px 14px rgba(0,0,0,0.08);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:22px;transition:transform .14s cubic-bezier(0.34,1.56,0.64,1);color:#0b5878}',
      'body.dark .can-ios-btn{background:#2a2d3e;color:#38bdf8;box-shadow:0 4px 14px rgba(0,0,0,0.3)}',
      '.can-ios-btn:active{transform:scale(0.88)}',
      // Mazo animado de cartas idéntico al Home
      '.can-deck-stage{position:relative;width:100%;flex:1;min-height:245px;overflow:hidden!important;border-radius:18px}',
      '.can-card-sheet{position:absolute;inset:0;background:#fff;border-radius:20px;overflow:hidden;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none;box-shadow:0 12px 30px rgba(0,0,0,0.08);transition:transform .32s cubic-bezier(.25,.8,.25,1),opacity .32s ease}',
      '.can-card-sheet.arrastre{transition:none;cursor:grabbing}',
      '.can-card-sheet.vuela{transition:transform .18s cubic-bezier(.25,.8,.25,1),opacity .18s ease-out;opacity:0;pointer-events:none}',
      '.can-pdf-canvas-wrap{width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#fff;position:relative}',
      '.can-pdf-canvas-wrap canvas{width:100%!important;height:100%!important;object-fit:contain;display:block}',
      // Tarjeta inferior
      '.can-bottom-card{background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-radius:24px;border:1px solid rgba(0,0,0,0.06);box-shadow:0 10px 30px rgba(0,0,0,0.04);padding:18px 20px;display:flex;flex-direction:column;gap:6px}',
      'body.dark .can-bottom-card{background:rgba(35,37,54,0.9);border-color:rgba(255,255,255,0.08);box-shadow:0 10px 30px rgba(0,0,0,0.25)}',
      '.can-req-top{display:flex;align-items:center;justify-content:space-between}',
      '.can-req-label{font-size:11px;font-weight:900;letter-spacing:0.8px;color:#71717a;text-transform:uppercase}',
      'body.dark .can-req-label{color:#a1a1aa}',
      '.can-counter-badge{font-size:12.5px;font-weight:900;color:#71717a}',
      'body.dark .can-counter-badge{color:#a1a1aa}',
      '.can-main-title{font-size:26px;font-weight:900;color:#0b5878;letter-spacing:-0.5px;margin:2px 0 0}',
      'body.dark .can-main-title{color:#38bdf8}',
      '.can-model-name{font-size:16px;font-weight:850;color:#18181b;margin:0}',
      'body.dark .can-model-name{color:#f4f4f5}',
      '.can-thread-desc{font-size:13px;color:#71717a;font-weight:600;margin:0}',
      'body.dark .can-thread-desc{color:#a1a1aa}',
      '.can-alert-pill{margin-top:6px;background:rgba(11,88,120,0.05);border:1px solid rgba(11,88,120,0.12);border-radius:14px;padding:10px 14px;display:flex;align-items:flex-start;gap:8px;font-size:12.5px;color:#27272a;font-weight:650;line-height:1.4}',
      'body.dark .can-alert-pill{background:rgba(56,189,248,0.08);border-color:rgba(56,189,248,0.2);color:#e2e8f0}',
      // Botón WhatsApp flotante integrado
      '.can-btn-wa{margin-top:10px;width:100%;border:none;border-radius:14px;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;font:inherit;font-size:13.5px;font-weight:900;padding:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 14px rgba(34,197,94,0.3);transition:transform .12s ease}',
      '.can-btn-wa:active{transform:scale(0.97)}',
      // Modal popup para agrandar el PDF
      '#canPdfZoomModal{position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);z-index:999999;display:none;align-items:center;justify-content:center;padding:14px}',
      '#canPdfZoomModal.open{display:flex}',
      '#canPdfZoomModal{position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);z-index:999999;display:none;align-items:center;justify-content:center;padding:12px}',
      '#canPdfZoomModal.open{display:flex}',
      '.can-zoom-card{background:#ffffff;border-radius:24px;width:100%;max-width:480px;height:88vh;max-height:850px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,0.6);position:relative}',
      'body.dark .can-zoom-card{background:#18181b}',
      '.can-zoom-body{flex:1;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;display:flex;align-items:flex-start;justify-content:center;padding:6px;background:#f4f4f5}',
      'body.dark .can-zoom-body{background:#09090b}',
      '#canPdfZoomFallbackImg{width:100%;height:auto;object-fit:contain;display:block;border-radius:14px;box-shadow:0 4px 18px rgba(0,0,0,0.12)}',
      'body.dark .can-zoom-card{background:#1e202e}',
      '.can-zoom-close{position:absolute;top:12px;right:12px;width:34px;height:34px;border-radius:50%;border:none;background:rgba(0,0,0,0.6);color:#fff;font-size:18px;font-weight:900;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:10}'
    ].join('\n');
    document.head.appendChild(st);
  }

  function render(){
    var host = document.getElementById('canillasCont');
    if (!host) return;

    var cur = CANILLAS[state.idx] || CANILLAS[0];
    var numDisplay = (state.idx + 1) + ' de ' + CANILLAS.length;
    var imgUser = state.userImg || 'https://raw.githubusercontent.com/Somospopups/appi/main/catalogo-img/canilla_piazza_dot.png';

    var html = '<div class="can-layout-wrap">' +
      '<div class="can-top-grid">' +
        // Panel izquierdo: TU FOTO
        '<div class="can-box-panel">' +
          '<div class="can-box-title">TU FOTO</div>' +
          '<div class="can-photo-frame">' +
            '<img id="canUserPhotoImg" src="' + esc(imgUser) + '" alt="Tu foto">' +
          '</div>' +
          '<div class="can-ios-icon-btns">' +
            '<button type="button" class="can-ios-btn" id="canBtnGaleria" title="Galería" aria-label="Galería">📁</button>' +
            '<button type="button" class="can-ios-btn" id="canBtnCamara" title="Cámara" aria-label="Cámara">📷</button>' +
          '</div>' +
        '</div>' +

        // Panel derecho: CATÁLOGO PSA (DESLIZÁ) con física idéntica al Home
        '<div class="can-box-panel" style="overflow:hidden">' +
          '<div class="can-box-title">CATÁLOGO PSA (DESLIZÁ)</div>' +
          '<div class="can-deck-stage" style="width:100%;height:100%;position:relative;overflow:hidden;border-radius:18px">' +
            '<div class="can-card-sheet" id="canCardSwipe" style="width:100%;height:100%;position:absolute;inset:0;overflow:hidden;border-radius:18px;background:#fff;display:flex;align-items:center;justify-content:center" title="Tocá para agrandar la página">' +
              '<img id="canPdfFallbackImg" src="catalogo-adaptadores-img/img_' + cur.pag + '.jpg" style="width:100%;height:100%;object-fit:contain;display:block;user-select:none;-webkit-user-drag:none;pointer-events:none">' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // Tarjeta inferior: ADAPTADOR REQUERIDO
      '<div class="can-bottom-card">' +
        '<div class="can-req-top">' +
          '<span class="can-req-label">ADAPTADOR REQUERIDO</span>' +
          '<span class="can-counter-badge">' + numDisplay + '</span>' +
        '</div>' +
        '<h2 class="can-main-title">' + esc(cur.adaptador) + '</h2>' +
        '<h3 class="can-model-name">' + esc(cur.marca + ' ' + cur.modelo) + '</h3>' +
        '<p class="can-thread-desc">Rosca: ' + esc(cur.rosca) + '</p>' +
        '<div class="can-alert-pill">' +
          '<span>💡</span>' +
          '<div>' + esc(cur.obs) + '</div>' +
        '</div>' +
        '<button type="button" class="can-btn-wa" id="canBtnShareWA">' +
          '<span>💬</span> Compartir por WhatsApp' +
        '</button>' +
      '</div>' +

      // Modal Zoom
      '<div id="canPdfZoomModal">' +
        '<div class="can-zoom-card">' +
          '<button type="button" class="can-zoom-close" id="canZoomClose" title="Cerrar">×</button>' +
          '<div class="can-zoom-body">' +
            '<img id="canPdfZoomFallbackImg" src="' + getPdfPageImg(cur.pag) + '" alt="Guía Oficial PSA PDF">' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<input type="file" id="canFileGaleria" accept="image/*" style="display:none">' +
      '<input type="file" id="canFileCamara" accept="image/*" capture="environment" style="display:none">' +
    '</div>';

    host.innerHTML = html;

    renderPdfPage(cur.pag);

    // Cablear mazo con gestos exactos del Home
    cablearSwipe(document.getElementById('canCardSwipe'));

    // Click en la carta para agrandar
    var cardEl = document.getElementById('canCardSwipe');
    if (cardEl) {
      cardEl.onclick = function(e) {
        if (cardEl._hasSwiped) return;
        abrirZoom(cur.pag);
      };
    }

    var btnCloseZoom = document.getElementById('canZoomClose');
    if (btnCloseZoom) {
      btnCloseZoom.onclick = function() {
        document.getElementById('canPdfZoomModal').classList.remove('open');
      };
    }

    // Botón WhatsApp
    var btnWA = document.getElementById('canBtnShareWA');
    if (btnWA) {
      btnWA.onclick = function() {
        var msg = '¡Hola! Te comparto la compatibilidad oficial PSA para tu canilla:\n\n' +
          '*' + cur.marca + ' ' + cur.modelo + '*\n' +
          'Rosca: ' + cur.rosca + '\n\n' +
          '👉 *Adaptador requerido:* ' + cur.adaptador + '\n' +
          '💡 ' + cur.obs + '\n\n' +
          'Guía oficial PSA - Página ' + cur.pag;
        window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
      };
    }

    // Galería y Cámara
    var btnGaleria = document.getElementById('canBtnGaleria');
    var btnCamara = document.getElementById('canBtnCamara');
    var fileGaleria = document.getElementById('canFileGaleria');
    var fileCamara = document.getElementById('canFileCamara');

    function procesarArchivo(file) {
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(evt) {
        state.userImg = evt.target.result;
        try { localStorage.setItem('appi_canilla_user_img', state.userImg); } catch(err) {}
        render();
      };
      reader.readAsDataURL(file);
    }

    if (btnGaleria && fileGaleria) {
      btnGaleria.onclick = function() { fileGaleria.click(); };
      fileGaleria.onchange = function(e) { procesarArchivo(e.target.files && e.target.files[0]); };
    }
    if (btnCamara && fileCamara) {
      btnCamara.onclick = function() { fileCamara.click(); };
      fileCamara.onchange = function(e) { procesarArchivo(e.target.files && e.target.files[0]); };
    }
  }

  // Físicas y movimiento idénticos al mazo del Home pero confinados al marco
  function cablearSwipe(el) {
    if (!el) return;
    var arrastrando = false, x0 = 0, y0 = 0, dx = 0, dy = 0, modo = '';
    el._hasSwiped = false;

    el.addEventListener('pointerdown', function(e){
      if (e.button != null && e.button !== 0) return;
      arrastrando = true;
      modo = '';
      x0 = e.clientX;
      y0 = e.clientY;
      dx = 0;
      dy = 0;
      el._hasSwiped = false;
      el.style.transition = 'none';
      try { el.setPointerCapture(e.pointerId); } catch(err) {}
    }, true);

    el.addEventListener('pointermove', function(e){
      if (!arrastrando) return;
      dx = e.clientX - x0;
      dy = e.clientY - y0;
      if (!modo) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        if (Math.abs(dx) >= Math.abs(dy)) modo = 'swipe';
        else modo = 'vertical';
      }
      if (modo === 'swipe') {
        if (e.cancelable) e.preventDefault();
        el._hasSwiped = true;
        // Confinar movimiento dentro del marco
        var maxMove = 120;
        var clampedDx = Math.max(-maxMove, Math.min(maxMove, dx));
        el.style.transform = 'translateX(' + clampedDx + 'px) rotate(' + (clampedDx * 0.04) + 'deg)';
      }
    }, { capture: true, passive: false });

    function soltar(){
      if (!arrastrando) return;
      arrastrando = false;
      if (el._hasSwiped && Math.abs(dx) > 45) {
        // Pasar carta de inmediato
        var dir = dx < 0 ? 1 : -1;
        el.style.transition = 'transform 0.16s ease-out, opacity 0.16s ease-out';
        el.style.transform = 'translateX(' + (dir > 0 ? '-100%' : '100%') + ')';
        el.style.opacity = '0.3';
        setTimeout(function(){
          state.idx = (state.idx + dir + CANILLAS.length) % CANILLAS.length;
          render();
        }, 160);
      } else {
        // Volver suavemente
        el.style.transition = 'transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)';
        el.style.transform = 'translateX(0px) rotate(0deg)';
        setTimeout(function(){
          el._hasSwiped = false;
          el.style.transition = '';
        }, 220);
      }
    }

    el.addEventListener('pointerup', soltar, true);
    el.addEventListener('pointercancel', soltar, true);
  }

  // PDF.js render
  var _pdfDocPromise = null;
  function getPdfDoc() {
    if (!_pdfDocPromise && window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = './vendor/pdf.worker.min.js';
      _pdfDocPromise = window.pdfjsLib.getDocument('guia-adaptadores-psa.pdf').promise;
    }
    return _pdfDocPromise;
  }

    function renderPdfPage(pageNum) {
    var imgFallback = document.getElementById('canPdfFallbackImg');
    var canvas = document.getElementById('canPdfCanvas');
    var imgPath = getPdfPageImg(pageNum);
    
    // Renderizado instantáneo de la lámina del catálogo
    if (imgFallback) {
      imgFallback.src = imgPath;
      imgFallback.style.display = 'block';
    }
    if (canvas) {
      canvas.style.display = 'none';
    }
  }

  function abrirZoom(pageNum) {
    var modal = document.getElementById('canPdfZoomModal');
    if (!modal) return;
    modal.classList.add('open');
    var img = document.getElementById('canPdfZoomFallbackImg');
    if (img) {
      img.src = getPdfPageImg(pageNum);
    }
  }

  function openCanillas(){
    if (typeof showView === 'function') {
      showView('view-canillas');
    }
    inyectarEstilos();
    render();
  }

  window.openCanillas = openCanillas;

})();
