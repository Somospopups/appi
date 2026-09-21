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
      '#view-canillas{background:#edf4f2;min-height:100vh;padding:12px 14px 90px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}',
      'body.dark #view-canillas{background:#121820}',
      '.can-layout-wrap{max-width:540px;margin:0 auto;display:flex;flex-direction:column;gap:14px}',
      '.can-top-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}',
      '.can-box-panel{background:#fff;border-radius:24px;border:1.5px solid rgba(160,185,175,.35);padding:14px 10px 14px;display:flex;flex-direction:column;align-items:center;box-shadow:0 6px 18px rgba(0,0,0,.03);min-height:360px;position:relative}',
      'body.dark .can-box-panel{background:#1c232d;border-color:rgba(255,255,255,.08)}',
      '.can-box-title{font-size:11.5px;font-weight:900;letter-spacing:0.8px;color:#5a6e75;text-transform:uppercase;margin-bottom:12px;text-align:center}',
      'body.dark .can-box-title{color:#94a3b8}',
      '.can-photo-frame{width:100%;flex:1;background:#f3f6f5;border-radius:18px;overflow:hidden;display:flex;align-items:center;justify-content:center;position:relative;min-height:240px}',
      'body.dark .can-photo-frame{background:#151b22}',
      '.can-photo-frame img{width:100%;height:100%;object-fit:cover;display:block}',
      '.can-btn-cambiar{margin-top:12px;width:100%;border:none;border-radius:14px;background:#0d7a82;color:#fff;font:inherit;font-size:13px;font-weight:850;padding:11px 8px;cursor:pointer;transition:transform .12s ease;box-shadow:0 3px 8px rgba(13,122,130,.25)}',
      '.can-btn-cambiar:active{transform:scale(0.97)}',
      '.can-card-sheet{width:100%;flex:1;background:#fff;border-radius:18px;overflow:hidden;position:relative;display:flex;flex-direction:column;box-shadow:inset 0 0 0 1px rgba(0,0,0,.04)}',
      'body.dark .can-card-sheet{background:#232d3a}',
      '.can-psa-wave-top{position:relative;background:#074a66;height:65px;border-radius:0 0 50% 50% / 0 0 24px 24px;display:flex;align-items:center;justify-content:center;margin-bottom:8px}',
      '.can-psa-logo-badge{width:34px;height:34px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.2);border:2px solid #074a66;position:absolute;bottom:-12px;left:50%;transform:translateX(-50%)}',
      '.can-sheet-head{display:flex;align-items:center;justify-content:space-between;padding:12px 10px 4px;margin-top:4px}',
      '.can-pill-brand{background:#0a4866;color:#fff;font-size:10px;font-weight:950;padding:2px 8px;border-radius:6px;letter-spacing:0.3px}',
      '.can-fab-code{font-size:8.5px;color:#7a8e95;font-weight:700;line-height:1.1;text-align:right}',
      '.can-faucet-draw{flex:1;display:flex;align-items:center;justify-content:center;padding:10px;position:relative}',
      '.can-faucet-draw img{max-width:100%;max-height:140px;object-fit:contain;filter:drop-shadow(0 4px 6px rgba(0,0,0,.08))}',
      '.can-rings-group{position:absolute;right:10px;bottom:24px;display:flex;gap:3px;background:rgba(255,255,255,.9);padding:2px;border-radius:999px;border:1px solid rgba(0,0,0,.08)}',
      '.can-ring-item{width:24px;height:24px;border-radius:50%;border:1.5px solid #0d7a82;display:flex;align-items:center;justify-content:center;font-size:7.5px;font-weight:950;color:#0d7a82;background:#eef6f5}',
      '.can-sheet-footer-wave{height:46px;background:#0d7a82;border-radius:60% 0 0 0 / 28px 0 0 0;margin-top:auto;position:relative;display:flex;align-items:flex-end;justify-content:flex-end;padding:4px 8px}',
      '.can-sheet-page-lbl{font-size:8.5px;font-weight:900;color:rgba(255,255,255,.95)}',
      '.can-bottom-card{background:#fff;border-radius:24px;border:1.5px solid rgba(160,185,175,.35);padding:18px 20px;box-shadow:0 6px 18px rgba(0,0,0,.03);display:flex;flex-direction:column;gap:6px}',
      'body.dark .can-bottom-card{background:#1c232d;border-color:rgba(255,255,255,.08)}',
      '.can-req-top{display:flex;align-items:center;justify-content:space-between}',
      '.can-req-label{font-size:11.5px;font-weight:900;letter-spacing:0.8px;color:#5a6e75;text-transform:uppercase}',
      'body.dark .can-req-label{color:#94a3b8}',
      '.can-nav-link-btn{background:none;border:none;color:#074a66;font:inherit;font-size:13.5px;font-weight:950;cursor:pointer;display:flex;align-items:center;gap:3px;padding:0}',
      'body.dark .can-nav-link-btn{color:#38bdf8}',
      '.can-main-title{font-size:26px;font-weight:950;color:#074a66;letter-spacing:-0.4px;margin:2px 0 0}',
      'body.dark .can-main-title{color:#38bdf8}',
      '.can-model-name{font-size:16px;font-weight:900;color:#2a363b;margin:0}',
      'body.dark .can-model-name{color:#f1f5f9}',
      '.can-thread-desc{font-size:13.5px;color:#71828a;font-weight:600;margin:0}',
      'body.dark .can-thread-desc{color:#94a3b8}',
      '.can-alert-pill{margin-top:8px;background:#f8faf9;border:1px solid rgba(13,122,130,.15);border-radius:14px;padding:10px 14px;display:flex;align-items:flex-start;gap:8px;font-size:13px;color:#2c4046;font-weight:650;line-height:1.4}',
      'body.dark .can-alert-pill{background:#151b22;border-color:rgba(255,255,255,.08);color:#cbd5e1}',
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
        '<div class="can-box-panel">' +
          '<div class="can-box-title">TU FOTO</div>' +
          '<div class="can-photo-frame">' +
            '<img id="canUserPhotoImg" src="' + esc(imgUser) + '" alt="Tu foto">' +
          '</div>' +
          '<button type="button" class="can-btn-cambiar" id="canBtnCambiar">Cambiar foto</button>' +
        '</div>' +

        '<div class="can-box-panel" id="canCatalogCard">' +
          '<div class="can-box-title">CATÁLOGO PSA (DESLIZÁ)</div>' +
          '<div class="can-card-sheet">' +
            '<div class="can-psa-wave-top">' +
              '<div class="can-psa-logo-badge">' +
                '<span style="font-weight:950;font-size:9px;color:#074a66">PSA</span>' +
              '</div>' +
            '</div>' +
            '<div class="can-sheet-head">' +
              '<span class="can-pill-brand">' + esc(cur.marca) + '</span>' +
              '<div class="can-fab-code">' + esc(cur.modelo) + '<br/>Cod. Fabricante: ' + esc(cur.codFab) + '</div>' +
            '</div>' +
            '<div class="can-faucet-draw">' +
              '<img src="https://raw.githubusercontent.com/Somospopups/appi/main/catalogo-img/canilla_piazza_dot.png" alt="' + esc(cur.modelo) + '">' +
              '<div class="can-rings-group">' +
                (cur.adaptadoresImg || ['002','073']).map(function(num){
                  return '<div class="can-ring-item">' + esc(num) + '</div>';
                }).join('') +
              '</div>' +
            '</div>' +
            '<div class="can-sheet-footer-wave">' +
              '<span class="can-sheet-page-lbl">Página ' + esc(cur.pag) + '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="can-bottom-card">' +
        '<div class="can-req-top">' +
          '<span class="can-req-label">ADAPTADOR REQUERIDO</span>' +
          '<button type="button" class="can-nav-link-btn" id="canBtnPasar">Pasar carta ›</button>' +
        '</div>' +
        '<div style="text-align:right;font-size:12.5px;font-weight:850;color:#71828a;margin-top:-4px">' + numDisplay + '</div>' +
        '<h2 class="can-main-title">' + esc(cur.adaptador) + '</h2>' +
        '<h3 class="can-model-name">' + esc(cur.marca + ' ' + cur.modelo) + '</h3>' +
        '<p class="can-thread-desc">Rosca: ' + esc(cur.rosca) + '</p>' +
        '<div class="can-alert-pill">' +
          '<span>💡</span>' +
          '<div>' + esc(cur.obs) + '</div>' +
        '</div>' +
      '</div>' +

      '<input type="file" id="canFileInputHidden" accept="image/*" capture="environment" style="display:none">' +
    '</div>';

    host.innerHTML = html;

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

    var btnCambiar = document.getElementById('canBtnCambiar');
    var fileInp = document.getElementById('canFileInputHidden');
    if (btnCambiar && fileInp) {
      btnCambiar.onclick = function() {
        fileInp.click();
      };
      fileInp.onchange = function(e) {
        var file = e.target.files && e.target.files[0];
        if (file) {
          var reader = new FileReader();
          reader.onload = function(evt) {
            state.userImg = evt.target.result;
            try { localStorage.setItem('appi_canilla_user_img', state.userImg); } catch(err) {}
            render();
          };
          reader.readAsDataURL(file);
        }
      };
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
