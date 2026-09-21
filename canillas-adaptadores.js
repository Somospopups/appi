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
    idx: CANILLAS.findIndex(function(c){ return c.id === 41; }) !== -1 ? CANILLAS.findIndex(function(c){ return c.id === 41; }) : 0,
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
      '#view-canillas{background:#f3eee3;min-height:100vh;padding:14px 14px 100px;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text","Helvetica Neue",sans-serif;-webkit-font-smoothing:antialiased}',
      'body.dark #view-canillas{background:#1c1e2a}',
      '.can-layout-wrap{max-width:500px;margin:0 auto;display:flex;flex-direction:column;gap:14px}',
      '.can-top-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}',
      '.can-box-panel{background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-radius:22px;border:1px solid rgba(0,0,0,0.06);box-shadow:0 8px 24px rgba(0,0,0,0.04);padding:14px 10px 12px;display:flex;flex-direction:column;align-items:center;min-height:350px;position:relative}',
      'body.dark .can-box-panel{background:rgba(35,37,54,0.9);border-color:rgba(255,255,255,0.08);box-shadow:0 8px 24px rgba(0,0,0,0.25)}',
      '.can-box-title{font-size:11px;font-weight:800;letter-spacing:0.6px;color:#71717a;text-transform:uppercase;margin-bottom:10px;text-align:center}',
      'body.dark .can-box-title{color:#a1a1aa}',
      '.can-photo-frame{width:100%;flex:1;background:#fafaf9;border-radius:18px;overflow:hidden;display:flex;align-items:center;justify-content:center;position:relative;min-height:240px;box-shadow:inset 0 0 0 1px rgba(0,0,0,0.04)}',
      'body.dark .can-photo-frame{background:#161722;box-shadow:inset 0 0 0 1px rgba(255,255,255,0.05)}',
      '.can-photo-frame img{width:100%;height:100%;object-fit:cover;display:block}',
      '.can-ios-icon-btns{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;margin-top:10px}',
      '.can-ios-btn{width:46px;height:46px;border-radius:50%;border:none;background:#ffffff;box-shadow:0 4px 12px rgba(0,0,0,0.08);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:20px;transition:transform .12s cubic-bezier(0.34,1.56,0.64,1);color:#0b5878}',
      'body.dark .can-ios-btn{background:#2a2d3e;color:#38bdf8;box-shadow:0 4px 14px rgba(0,0,0,0.3)}',
      '.can-ios-btn:active{transform:scale(0.9)}',
      '.can-card-sheet{width:100%;flex:1;background:#fff;border-radius:18px;overflow:hidden;position:relative;display:flex;flex-direction:column;box-shadow:inset 0 0 0 1px rgba(0,0,0,0.05)}',
      'body.dark .can-card-sheet{background:#242738}',
      '.can-pdf-canvas-wrap{width:100%;height:100%;min-height:240px;display:flex;align-items:center;justify-content:center;position:relative;background:#fff}',
      'body.dark .can-pdf-canvas-wrap{background:#1e202e}',
      '.can-pdf-canvas-wrap canvas{width:100%!important;height:100%!important;object-fit:contain;display:block;border-radius:16px}',
      '.can-bottom-card{background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-radius:24px;border:1px solid rgba(0,0,0,0.06);box-shadow:0 10px 30px rgba(0,0,0,0.05);padding:18px 20px;display:flex;flex-direction:column;gap:6px}',
      'body.dark .can-bottom-card{background:rgba(35,37,54,0.9);border-color:rgba(255,255,255,0.08);box-shadow:0 10px 30px rgba(0,0,0,0.25)}',
      '.can-req-top{display:flex;align-items:center;justify-content:space-between}',
      '.can-req-label{font-size:11px;font-weight:800;letter-spacing:0.8px;color:#71717a;text-transform:uppercase}',
      'body.dark .can-req-label{color:#a1a1aa}',
      '.can-nav-link-btn{background:none;border:none;color:#0b5878;font:inherit;font-size:13.5px;font-weight:900;cursor:pointer;display:flex;align-items:center;gap:3px;padding:0}',
      'body.dark .can-nav-link-btn{color:#38bdf8}',
      '.can-main-title{font-size:26px;font-weight:900;color:#0b5878;letter-spacing:-0.5px;margin:2px 0 0}',
      'body.dark .can-main-title{color:#38bdf8}',
      '.can-model-name{font-size:16px;font-weight:850;color:#18181b;margin:0}',
      'body.dark .can-model-name{color:#f4f4f5}',
      '.can-thread-desc{font-size:13px;color:#71717a;font-weight:600;margin:0}',
      'body.dark .can-thread-desc{color:#a1a1aa}',
      '.can-alert-pill{margin-top:8px;background:rgba(11,88,120,0.05);border:1px solid rgba(11,88,120,0.12);border-radius:14px;padding:10px 14px;display:flex;align-items:flex-start;gap:8px;font-size:12.5px;color:#27272a;font-weight:650;line-height:1.4}',
      'body.dark .can-alert-pill{background:rgba(56,189,248,0.08);border-color:rgba(56,189,248,0.2);color:#e2e8f0}',
      '.can-alert-pill span{font-size:15px;flex-shrink:0}'
    ].join('\n');
    document.head.appendChild(st);
  }

  function render(){
    var host = document.getElementById('canillasCont');
    if (!host) return;

    var cur = CANILLAS[state.idx] || CANILLAS[0];
    var numDisplay = (cur.id || (state.idx + 1)) + ' de 53';
    var imgUser = state.userImg || 'https://raw.githubusercontent.com/Somospopups/appi/main/catalogo-img/canilla_piazza_dot.png';

    var html = '<div class="can-layout-wrap">' +
      '<div class="can-top-grid">' +
        // Panel izquierdo: TU FOTO con botones SOLO ICONOS estilo iOS
        '<div class="can-box-panel">' +
          '<div class="can-box-title">TU FOTO</div>' +
          '<div class="can-photo-frame">' +
            '<img id="canUserPhotoImg" src="' + esc(imgUser) + '" alt="Tu foto">' +
          '</div>' +
          '<div class="can-ios-icon-btns">' +
            '<button type="button" class="can-ios-btn" id="canBtnGaleria" title="Subir desde galería" aria-label="Galería">📁</button>' +
            '<button type="button" class="can-ios-btn" id="canBtnCamara" title="Sacar foto" aria-label="Cámara">📷</button>' +
          '</div>' +
        '</div>' +

        // Panel derecho: CATÁLOGO PSA (DESLIZÁ) con Renderizador Canvas del PDF
        '<div class="can-box-panel" id="canCatalogCard">' +
          '<div class="can-box-title">CATÁLOGO PSA (DESLIZÁ)</div>' +
          '<div class="can-card-sheet">' +
            '<div class="can-pdf-canvas-wrap" id="canPdfWrap">' +
              '<canvas id="canPdfCanvas"></canvas>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // Tarjeta inferior: ADAPTADOR REQUERIDO
      '<div class="can-bottom-card">' +
        '<div class="can-req-top">' +
          '<span class="can-req-label">ADAPTADOR REQUERIDO</span>' +
          '<button type="button" class="can-nav-link-btn" id="canBtnPasar">Pasar carta ›</button>' +
        '</div>' +
        '<div style="text-align:right;font-size:12px;font-weight:800;color:#71717a;margin-top:-4px">' + numDisplay + '</div>' +
        '<h2 class="can-main-title">' + esc(cur.adaptador) + '</h2>' +
        '<h3 class="can-model-name">' + esc(cur.marca + ' ' + cur.modelo) + '</h3>' +
        '<p class="can-thread-desc">Rosca: ' + esc(cur.rosca) + '</p>' +
        '<div class="can-alert-pill">' +
          '<span>💡</span>' +
          '<div>' + esc(cur.obs) + '</div>' +
        '</div>' +
      '</div>' +

      '<input type="file" id="canFileGaleria" accept="image/*" style="display:none">' +
      '<input type="file" id="canFileCamara" accept="image/*" capture="environment" style="display:none">' +
    '</div>';

    host.innerHTML = html;

    renderPdfPage(cur.pag);

    var btnPasar = document.getElementById('canBtnPasar');
    if (btnPasar) {
      btnPasar.onclick = function() {
        state.idx = (state.idx + 1) % CANILLAS.length;
        render();
      };
    }

    var cardEl = document.getElementById('canCatalogCard');
    if (cardEl) {
      var startX = 0;
      cardEl.addEventListener('touchstart', function(e){
        startX = e.touches[0].clientX;
      }, {passive:true});
      cardEl.addEventListener('touchend', function(e){
        var endX = e.changedTouches[0].clientX;
        var diff = endX - startX;
        if (Math.abs(diff) > 40) {
          if (diff < 0) {
            state.idx = (state.idx + 1) % CANILLAS.length;
          } else {
            state.idx = (state.idx - 1 + CANILLAS.length) % CANILLAS.length;
          }
          render();
        }
      }, {passive:true});
    }

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

  var _pdfDocPromise = null;
  function getPdfDoc() {
    if (!_pdfDocPromise && window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = './vendor/pdf.worker.min.js';
      _pdfDocPromise = window.pdfjsLib.getDocument('guia-para-la-seleccion-de-adaptadores-psa.pdf').promise;
    }
    return _pdfDocPromise;
  }

  function renderPdfPage(pageNum) {
    if (!window.pdfjsLib) return;
    getPdfDoc().then(function(pdf) {
      return pdf.getPage(pageNum);
    }).then(function(page) {
      var canvas = document.getElementById('canPdfCanvas');
      if (!canvas) return;
      var ctx = canvas.getContext('2d');
      var viewport = page.getViewport({ scale: 1.5 });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      page.render({ canvasContext: ctx, viewport: viewport });
    }).catch(function(err) {
      console.warn('PDF render error:', err);
    });
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
