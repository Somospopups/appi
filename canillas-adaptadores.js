
  function asegurarModalZoom() {
    var modal = document.getElementById('canPdfZoomModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'canPdfZoomModal';
      modal.innerHTML = '<div class="can-zoom-card">' +
        '<button type="button" class="can-zoom-close" id="canZoomClose" title="Cerrar" aria-label="Cerrar">✕</button>' +
        '<div class="can-zoom-body" id="canZoomBody">' +
          '<img id="canPdfZoomFallbackImg" alt="Guía Oficial PSA PDF">' +
        '</div>' +
      '</div>';
      document.body.appendChild(modal);

      modal.addEventListener('click', function(e){
        if (e.target === modal || e.target.id === 'canZoomClose') {
          modal.classList.remove('open');
        }
      });
    }
  }

  function getPdfPageImg(num) {
    var p = String(num || 1);
    if (p.length === 1) p = '0' + p;
    return 'paginas-guia-pdf/page-' + p + '.jpg';
  }
(function(){
  'use strict';

  var CANILLAS = [
  {
    "id": 1,
    "marca": "FV",
    "modelo": "Alabama",
    "codFab": "411.04/27",
    "rosca": "(102) Adapt. Rosca macho",
    "adaptador": "PSA 102",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 3
  },
  {
    "id": 2,
    "marca": "FV",
    "modelo": "Allegro",
    "codFab": "0434.01/15-B-CR",
    "rosca": "(018) Adapt. Rosca Canilla",
    "adaptador": "PSA 018",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 4
  },
  {
    "id": 3,
    "marca": "FV",
    "modelo": "Areco",
    "codFab": "424/99",
    "rosca": "(002) Adapt. Rosca FV Unimix",
    "adaptador": "PSA 002",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 5
  },
  {
    "id": 4,
    "marca": "FV",
    "modelo": "Arizona",
    "codFab": "406/B1",
    "rosca": "(002) Adapt. Rosca FV Unimix",
    "adaptador": "PSA 002",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 6
  },
  {
    "id": 5,
    "marca": "FV",
    "modelo": "Chess",
    "codFab": "418/84",
    "rosca": "(002) Adapt. Rosca FV Unimix",
    "adaptador": "PSA 002",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 7
  },
  {
    "id": 6,
    "marca": "FV",
    "modelo": "Cibeles",
    "codFab": "0411/97",
    "rosca": "(073) Adapt. Múltiple",
    "adaptador": "PSA 073",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 8
  },
  {
    "id": 7,
    "marca": "FV",
    "modelo": "C7 Radal",
    "codFab": "0410/C7",
    "rosca": "(039) Adapt. Rosca Hembra",
    "adaptador": "PSA 039",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 9
  },
  {
    "id": 8,
    "marca": "FV",
    "modelo": "D7 Alerce",
    "codFab": "428/D7",
    "rosca": "(144) Adapt. Rosca Macho",
    "adaptador": "PSA 144",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 10
  },
  {
    "id": 9,
    "marca": "FV",
    "modelo": "Denisse",
    "codFab": "0416/64",
    "rosca": "(002) Adapt. Rosca FV Unimix",
    "adaptador": "PSA 002",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 11
  },
  {
    "id": 10,
    "marca": "FV",
    "modelo": "Eclipse",
    "codFab": "411.01/94",
    "rosca": "(002) Adapt. Rosca",
    "adaptador": "PSA 002",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 12
  },
  {
    "id": 11,
    "marca": "FV",
    "modelo": "Epuyen Negra",
    "codFab": "411.04/L2",
    "rosca": "(073) Adapt. Múltiple",
    "adaptador": "PSA 073",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 13
  },
  {
    "id": 12,
    "marca": "FV",
    "modelo": "Flow",
    "codFab": "411/01/B3",
    "rosca": "(002) Adapt. Rosca FV Unimix",
    "adaptador": "PSA 002",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 14
  },
  {
    "id": 13,
    "marca": "FV",
    "modelo": "Gran Gala",
    "codFab": "418/72",
    "rosca": "(002) Adapt. Rosca FV Unimix",
    "adaptador": "PSA 002",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 15
  },
  {
    "id": 14,
    "marca": "FV",
    "modelo": "Kansas",
    "codFab": "411.04/24",
    "rosca": "(102) Adapt. Rosca macho",
    "adaptador": "PSA 102",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 16
  },
  {
    "id": 15,
    "marca": "FV",
    "modelo": "Libby",
    "codFab": "411.04/39",
    "rosca": "(135) Adapt. Rosca Macho",
    "adaptador": "PSA 135",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 17
  },
  {
    "id": 16,
    "marca": "FV",
    "modelo": "Libby",
    "codFab": "0426/39",
    "rosca": "(142) Adapt. Rosca Macho",
    "adaptador": "PSA 142",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 18
  },
  {
    "id": 17,
    "marca": "FV",
    "modelo": "Libby",
    "codFab": "0428/39",
    "rosca": "(144) Adapt. Rosca Macho",
    "adaptador": "PSA 144",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 19
  },
  {
    "id": 18,
    "marca": "FV",
    "modelo": "Libby Pared monocomando",
    "codFab": "406.03/39-CR",
    "rosca": "(002) Adapt. Rosca FV Unimix",
    "adaptador": "PSA 002",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 20
  },
  {
    "id": 19,
    "marca": "FV",
    "modelo": "Melody",
    "codFab": "0203/28",
    "rosca": "(142) Adapt. Rosca Macho",
    "adaptador": "PSA 142",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 21
  },
  {
    "id": 20,
    "marca": "FV",
    "modelo": "Nerea Lever",
    "codFab": "0426/59L",
    "rosca": "(142) Adapt. Rosca Macho",
    "adaptador": "PSA 142",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 22
  },
  {
    "id": 21,
    "marca": "FV",
    "modelo": "Newport",
    "codFab": "0411.01/B2",
    "rosca": "(002) Adapt. Rosca FV Unimix",
    "adaptador": "PSA 002",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 23
  },
  {
    "id": 22,
    "marca": "FV",
    "modelo": "Oregon",
    "codFab": "0428/18",
    "rosca": "(144) Adapt. Rosca Macho",
    "adaptador": "PSA 144",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 24
  },
  {
    "id": 23,
    "marca": "FV",
    "modelo": "Puelo",
    "codFab": "411.04/B5",
    "rosca": "(144) Adapt. Rosca Macho",
    "adaptador": "PSA 144",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 25
  },
  {
    "id": 24,
    "marca": "FV",
    "modelo": "Puelo",
    "codFab": "423/B5",
    "rosca": "(002) Adapt. Rosca FV Unimix",
    "adaptador": "PSA 002",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 26
  },
  {
    "id": 25,
    "marca": "FV",
    "modelo": "Swing",
    "codFab": "411.01/90",
    "rosca": "(002) Adapt. Rosca FV Unimix",
    "adaptador": "PSA 002",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 27
  },
  {
    "id": 26,
    "marca": "FV",
    "modelo": "Swing Duo",
    "codFab": "411.03/94",
    "rosca": "(002) Adapt. Rosca FV Unimix",
    "adaptador": "PSA 002",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 28
  },
  {
    "id": 27,
    "marca": "FV",
    "modelo": "Swing Plus",
    "codFab": "",
    "rosca": "(073) Adapt. Múltiple",
    "adaptador": "PSA 073",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 29
  },
  {
    "id": 28,
    "marca": "FV",
    "modelo": "Swing Plus",
    "codFab": "",
    "rosca": "(148) Adapt. Rosca Hembra",
    "adaptador": "PSA 148",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 30
  },
  {
    "id": 29,
    "marca": "FV",
    "modelo": "Swing Plus",
    "codFab": "",
    "rosca": "Conexión con adapt. Swing Plus",
    "adaptador": "Consultar Guía",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 31
  },
  {
    "id": 30,
    "marca": "FV",
    "modelo": "Swing Plus",
    "codFab": "",
    "rosca": "Conexión con adapt. múltiple",
    "adaptador": "Consultar Guía",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 32
  },
  {
    "id": 31,
    "marca": "FV",
    "modelo": "Temple",
    "codFab": "0412/87",
    "rosca": "(073) Adapt. Múltiple",
    "adaptador": "PSA 073",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 33
  },
  {
    "id": 32,
    "marca": "FV",
    "modelo": "Temple",
    "codFab": "0412/87",
    "rosca": "(037) Adapt. Rosca Macho",
    "adaptador": "PSA 037",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 34
  },
  {
    "id": 33,
    "marca": "FV",
    "modelo": "Temple",
    "codFab": "0411/87",
    "rosca": "(073) Adapt. Múltiple",
    "adaptador": "PSA 073",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 35
  },
  {
    "id": 34,
    "marca": "FV",
    "modelo": "Tronic",
    "codFab": "0363.05P",
    "rosca": "(142) Adapt. Rosca Macho",
    "adaptador": "PSA 142",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 36
  },
  {
    "id": 35,
    "marca": "FV",
    "modelo": "Unimix Dos",
    "codFab": "411/91",
    "rosca": "(002) Adapt. Rosca FV Unimix",
    "adaptador": "PSA 002",
    "obs": "También es posible en esta",
    "pag": 37
  },
  {
    "id": 36,
    "marca": "Duke",
    "modelo": "(100) Adapt. Rosca Hembra",
    "codFab": "",
    "rosca": "(100) Adapt. Rosca Hembra",
    "adaptador": "PSA 100",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 38
  },
  {
    "id": 37,
    "marca": "FGR",
    "modelo": "Monocomando",
    "codFab": "905",
    "rosca": "(144) Adapt. Rosca Macho",
    "adaptador": "PSA 144",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 39
  },
  {
    "id": 38,
    "marca": "FGR",
    "modelo": "Monocomando",
    "codFab": "910",
    "rosca": "(144) Adapt. Rosca Macho",
    "adaptador": "PSA 144",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 40
  },
  {
    "id": 39,
    "marca": "FGR",
    "modelo": "Monocomando",
    "codFab": "6380",
    "rosca": "(144) Adapt. Rosca Macho",
    "adaptador": "PSA 144",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 41
  },
  {
    "id": 40,
    "marca": "FGR",
    "modelo": "Monocomando",
    "codFab": "6370",
    "rosca": "(144) Adapt. Rosca Macho",
    "adaptador": "PSA 144",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 42
  },
  {
    "id": 41,
    "marca": "FGR",
    "modelo": "Unicontrol",
    "codFab": "4001/4015/4070/4075",
    "rosca": "(142) Adapt. Rosca Macho",
    "adaptador": "PSA 142",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 43
  },
  {
    "id": 42,
    "marca": "FGR",
    "modelo": "Unicontrol",
    "codFab": "3001/3015/3070",
    "rosca": "(142) Adapt. Rosca Macho",
    "adaptador": "PSA 142",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 44
  },
  {
    "id": 43,
    "marca": "Piazza",
    "modelo": "Piazza",
    "codFab": "10112",
    "rosca": "(002) Adapt. Rosca FV Unimix",
    "adaptador": "PSA 002",
    "obs": "También es posible en esta",
    "pag": 45
  },
  {
    "id": 44,
    "marca": "Piazza",
    "modelo": "Piazza",
    "codFab": "10014",
    "rosca": "(142) Adapt. Rosca Macho",
    "adaptador": "PSA 142",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 46
  },
  {
    "id": 45,
    "marca": "Piazza",
    "modelo": "Piazza",
    "codFab": "10016NE",
    "rosca": "(039) Adapt. Rosca Hembra",
    "adaptador": "PSA 039",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 47
  },
  {
    "id": 46,
    "marca": "Piazza",
    "modelo": "Página 42",
    "codFab": "400.28",
    "rosca": "(019) Adapt. Rosca M-H 18,1",
    "adaptador": "PSA 019",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 48
  },
  {
    "id": 47,
    "marca": "Radisson",
    "modelo": "RADISSON",
    "codFab": "GB4C",
    "rosca": "(177) Adapt. Rectangular",
    "adaptador": "PSA 177",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 49
  },
  {
    "id": 48,
    "marca": "Robinet",
    "modelo": "Betis",
    "codFab": "20-134",
    "rosca": "(142) Adapt. Rosca Macho",
    "adaptador": "PSA 142",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 50
  },
  {
    "id": 49,
    "marca": "Robinet",
    "modelo": "Mallorca",
    "codFab": "60-131",
    "rosca": "(164) Adapt. rosca macho 20 x 1",
    "adaptador": "PSA 164",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 51
  },
  {
    "id": 50,
    "marca": "Robinet",
    "modelo": "Santander",
    "codFab": "20-135",
    "rosca": "(164) Adapt. rosca macho 20 x 1",
    "adaptador": "PSA 164",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 52
  },
  {
    "id": 51,
    "marca": "Clever",
    "modelo": "Saona Infinity",
    "codFab": "97856",
    "rosca": "(177) Adapt. Rectangular",
    "adaptador": "PSA 177",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 53
  },
  {
    "id": 52,
    "marca": "Peirano",
    "modelo": "Perugia",
    "codFab": "",
    "rosca": "(002) Adapt. Rosca FV Unimix",
    "adaptador": "PSA 002",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 54
  },
  {
    "id": 53,
    "marca": "Ginyplas",
    "modelo": "Modern",
    "codFab": "08510F",
    "rosca": "(002) Adapt. Rosca FV Unimix",
    "adaptador": "PSA 002",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 55
  },
  {
    "id": 54,
    "marca": "Otras canillas",
    "modelo": "Otras canillas De patio 1/2”",
    "codFab": "",
    "rosca": "(100) Adapt. Rosca Hembra",
    "adaptador": "PSA 100",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 56
  },
  {
    "id": 55,
    "marca": "Otras canillas",
    "modelo": "Otras canillas De patio 3/4”",
    "codFab": "",
    "rosca": "(018) Adapt. Rosca Canilla",
    "adaptador": "PSA 018",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 57
  },
  {
    "id": 56,
    "marca": "Otras canillas",
    "modelo": "Otras canillas De patio 1/2”",
    "codFab": "",
    "rosca": "(100) Adapt. Rosca Hembra",
    "adaptador": "PSA 100",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 58
  },
  {
    "id": 57,
    "marca": "Otras canillas",
    "modelo": "Otras canillas De patio 3/4”",
    "codFab": "",
    "rosca": "(018) Adapt. Rosca Canilla",
    "adaptador": "PSA 018",
    "obs": "Verificar ficha de la Guía Oficial PSA",
    "pag": 59
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
            '#canPdfZoomModal{position:fixed!important;inset:0!important;background:rgba(10,12,20,0.88)!important;backdrop-filter:blur(16px)!important;-webkit-backdrop-filter:blur(16px)!important;z-index:9999999!important;display:none;align-items:center;justify-content:center;padding:12px;box-sizing:border-box}',
      '#canPdfZoomModal.open{display:flex!important}',
      '.can-zoom-card{background:#ffffff!important;border-radius:24px!important;width:100%!important;max-width:540px!important;height:90vh!important;max-height:860px!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;box-shadow:0 30px 80px rgba(0,0,0,0.6)!important;position:relative!important}',
      'body.dark .can-zoom-card{background:#18181b!important}',
      '.can-zoom-close{position:absolute!important;top:14px!important;right:14px!important;width:38px!important;height:38px!important;border-radius:50%!important;border:none!important;background:rgba(0,0,0,0.7)!important;color:#ffffff!important;font-size:18px!important;font-weight:900!important;display:flex!important;align-items:center!important;justify-content:center!important;cursor:pointer!important;z-index:100!important;box-shadow:0 4px 14px rgba(0,0,0,0.4)!important}',
      '.can-zoom-body{flex:1!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;display:flex!important;justify-content:center!important;align-items:flex-start!important;padding:12px!important;background:#f1f3f8!important}',
      'body.dark .can-zoom-body{background:#09090b!important}',
      '#canPdfZoomFallbackImg{width:100%!important;height:auto!important;max-width:100%!important;display:block!important;border-radius:14px!important;box-shadow:0 6px 24px rgba(0,0,0,0.15)!important}',
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
        '<button type="button" id="canBtnVer3D" style="width:100%;margin-top:10px;margin-bottom:6px;border:none;border-radius:14px;background:linear-gradient(135deg,#0284c7,#0369a1);color:#fff;font:inherit;font-size:13.5px;font-weight:900;padding:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 14px rgba(2,132,199,0.3)">' +
          '<span>🔄</span> Girar Canilla en 3D (360°)' +
        '</button>' +
        '<button type="button" class="can-btn-wa" id="canBtnShareWA">' +
          '<span>💬</span> Compartir por WhatsApp' +
        '</button>' +
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
    var btn3D = document.getElementById('canBtnVer3D');
    if (btn3D) {
      btn3D.onclick = function() {
        abrirVisor3D(cur.marca + ' ' + cur.modelo);
      };
    }
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

    var clickStartT = 0;
    el.addEventListener('pointerdown', function(e){
      if (e.button != null && e.button !== 0) return;
      arrastrando = true;
      modo = '';
      x0 = e.clientX;
      y0 = e.clientY;
      dx = 0;
      dy = 0;
      clickStartT = Date.now();
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
      var elapsed = Date.now() - clickStartT;
      if (!el._hasSwiped || (Math.abs(dx) < 10 && elapsed < 350)) {
        // TAP directo sobre la carta -> ABRIR ZOOM POPUP INMEDIATO
        el.style.transform = 'translateX(0px) rotate(0deg)';
        el._hasSwiped = false;
        var curCanilla = CANILLAS[state.idx] || CANILLAS[0];
        abrirZoom(curCanilla.pag);
        return;
      }
      if (el._hasSwiped && Math.abs(dx) > 40) {
        // Pasar carta de inmediato dentro de la caja
        var dir = dx < 0 ? 1 : -1;
        el.style.transition = 'transform 0.15s ease-out, opacity 0.15s ease-out';
        el.style.transform = 'translateX(' + (dir > 0 ? '-105%' : '105%') + ')';
        el.style.opacity = '0.2';
        setTimeout(function(){
          state.idx = (state.idx + dir + CANILLAS.length) % CANILLAS.length;
          render();
        }, 150);
      } else {
        // Volver suavemente al centro
        el.style.transition = 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)';
        el.style.transform = 'translateX(0px) rotate(0deg)';
        setTimeout(function(){
          el._hasSwiped = false;
          el.style.transition = '';
        }, 210);
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
    asegurarModalZoom();
    var modal = document.getElementById('canPdfZoomModal');
    if (!modal) return;
    var img = document.getElementById('canPdfZoomFallbackImg');
    if (img) {
      img.src = getPdfPageImg(pageNum);
    }
    modal.classList.add('open');
  }

  function openCanillas(){
    if (typeof showView === 'function') {
      showView('view-canillas');
    }
    inyectarEstilos();
    render();
  }

  
  // Visor 3D Interactivo Three.js
  var _scene3D, _camera3D, _renderer3D, _controls3D, _faucetGroup3D, _animFrame3D;

  function abrirVisor3D(modeloNombre) {
    var modal = document.getElementById('canModal3D');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'canModal3D';
      modal.style.cssText = 'position:fixed;inset:0;background:rgba(10,12,20,0.94);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);z-index:99999999;display:none;flex-direction:column;align-items:center;justify-content:center;touch-action:none';
      modal.innerHTML = '<header style="position:absolute;top:0;left:0;right:0;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;z-index:10;background:rgba(0,0,0,0.5)">' +
        '<div>' +
          '<h3 id="can3DTitle" style="margin:0;font-size:16px;font-weight:800;color:#fff">Canilla 3D Interactiva</h3>' +
          '<p style="margin:2px 0 0;font-size:11.5px;color:#94a3b8">Arrastrá para girar 360° · Pellizcá para hacer zoom al pico</p>' +
        '</div>' +
        '<button type="button" id="canClose3D" style="width:38px;height:38px;border-radius:50%;border:none;background:rgba(255,255,255,0.18);color:#fff;font-size:20px;font-weight:900;cursor:pointer;display:flex;align-items:center;justify-content:center">✕</button>' +
      '</header>' +
      '<div id="can3DCanvasHost" style="width:100%;height:100%;flex:1;cursor:grab"></div>' +
      '<div style="position:absolute;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(15,23,42,0.85);border:1px solid rgba(255,255,255,0.15);border-radius:99px;padding:8px 18px;display:flex;align-items:center;gap:10px;font-size:12px;color:#cbd5e1;pointer-events:none">' +
        '<span style="background:#0284c7;color:#fff;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:800">3D REAL</span>' +
        '<span>Inspección 360° de pico y rosca PSA</span>' +
      '</div>';
      document.body.appendChild(modal);

      document.getElementById('canClose3D').onclick = function() {
        modal.style.display = 'none';
        if (_animFrame3D) cancelAnimationFrame(_animFrame3D);
      };
    }

    document.getElementById('can3DTitle').textContent = modeloNombre || 'Canilla 3D Interactiva';
    modal.style.display = 'flex';

    initThree3D();
  }

  function initThree3D() {
    var host = document.getElementById('can3DCanvasHost');
    if (!host || !window.THREE) return;
    host.innerHTML = '';

    _scene3D = new THREE.Scene();
    _camera3D = new THREE.PerspectiveCamera(45, host.clientWidth / host.clientHeight, 0.1, 100);
    _camera3D.position.set(2.8, 2.2, 3.8);

    _renderer3D = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    _renderer3D.setSize(host.clientWidth, host.clientHeight);
    _renderer3D.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    _renderer3D.toneMapping = THREE.ACESFilmicToneMapping;
    _renderer3D.toneMappingExposure = 1.25;
    host.appendChild(_renderer3D.domElement);

    _controls3D = new THREE.OrbitControls(_camera3D, _renderer3D.domElement);
    _controls3D.enableDamping = true;
    _controls3D.dampingFactor = 0.05;
    _controls3D.minDistance = 1.2;
    _controls3D.maxDistance = 6.0;
    _controls3D.target.set(0, 0.8, 0);

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    _scene3D.add(ambientLight);

    var dirLight1 = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight1.position.set(4, 8, 4);
    _scene3D.add(dirLight1);

    var dirLight2 = new THREE.DirectionalLight(0x7dd3fc, 1.2);
    dirLight2.position.set(-4, 3, -3);
    _scene3D.add(dirLight2);

    var chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.95,
      roughness: 0.12,
    });

    var brassGoldMaterial = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.85,
      roughness: 0.25,
    });

    var rubberMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.1,
      roughness: 0.7,
    });

    _faucetGroup3D = new THREE.Group();

    // 1. Base
    var baseGeo = new THREE.CylinderGeometry(0.38, 0.44, 0.18, 48);
    var baseMesh = new THREE.Mesh(baseGeo, chromeMaterial);
    baseMesh.position.y = 0.09;
    _faucetGroup3D.add(baseMesh);

    var ringGeo = new THREE.CylinderGeometry(0.44, 0.45, 0.03, 48);
    var ringMesh = new THREE.Mesh(ringGeo, rubberMaterial);
    ringMesh.position.y = 0.015;
    _faucetGroup3D.add(ringMesh);

    // 2. Columna
    var columnGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.8, 48);
    var columnMesh = new THREE.Mesh(columnGeo, chromeMaterial);
    columnMesh.position.y = 0.55;
    _faucetGroup3D.add(columnMesh);

    // 3. Pico de cisne
    var curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.85, 0),
      new THREE.Vector3(0, 1.45, 0),
      new THREE.Vector3(0.08, 1.95, 0),
      new THREE.Vector3(0.45, 2.15, 0),
      new THREE.Vector3(0.95, 1.85, 0),
      new THREE.Vector3(1.15, 1.35, 0),
      new THREE.Vector3(1.18, 0.95, 0)
    ]);
    var tubeGeo = new THREE.TubeGeometry(curve, 64, 0.13, 32, false);
    var tubeMesh = new THREE.Mesh(tubeGeo, chromeMaterial);
    _faucetGroup3D.add(tubeMesh);

    // 4. Pico extremo y rosca para adaptador PSA
    var spoutTipGeo = new THREE.CylinderGeometry(0.155, 0.145, 0.22, 36);
    var spoutTip = new THREE.Mesh(spoutTipGeo, chromeMaterial);
    spoutTip.position.set(1.18, 0.86, 0);
    _faucetGroup3D.add(spoutTip);

    var threadGeo = new THREE.CylinderGeometry(0.125, 0.125, 0.08, 36);
    var threadMesh = new THREE.Mesh(threadGeo, brassGoldMaterial);
    threadMesh.position.set(1.18, 0.72, 0);
    _faucetGroup3D.add(threadMesh);

    // 5. Monocomando
    var leverJointGeo = new THREE.SphereGeometry(0.17, 32, 32);
    var leverJoint = new THREE.Mesh(leverJointGeo, chromeMaterial);
    leverJoint.position.set(-0.25, 0.65, 0);
    _faucetGroup3D.add(leverJoint);

    var leverArmGeo = new THREE.CylinderGeometry(0.05, 0.07, 0.55, 32);
    var leverArm = new THREE.Mesh(leverArmGeo, chromeMaterial);
    leverArm.position.set(-0.45, 0.85, 0);
    leverArm.rotation.z = Math.PI / 4;
    _faucetGroup3D.add(leverArm);

    var plateGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.04, 64);
    var plateMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.1 });
    var plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.y = -0.02;
    _scene3D.add(plate);

    _scene3D.add(_faucetGroup3D);

    var userInteracted = false;
    _controls3D.addEventListener('start', function(){ userInteracted = true; });

    function anim() {
      _animFrame3D = requestAnimationFrame(anim);
      if (!userInteracted) {
        _faucetGroup3D.rotation.y += 0.006;
      }
      _controls3D.update();
      _renderer3D.render(_scene3D, _camera3D);
    }
    anim();
  }

  window.openCanillas = openCanillas;
  window.abrirVisor3D = abrirVisor3D;

})();
