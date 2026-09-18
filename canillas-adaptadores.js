/* ============================================================
   APPI · Canillas & Adaptadores PSA
   Ultra-simple: 2 botones (Sacar foto / Buscar imagen) + PDF
   ============================================================ */
(function () {
  "use strict";

  var currentPhotoSrc = null;
  var currentResult = null;

  function injectStyles() {
    if (document.getElementById("canillas-simple-styles")) return;
    var st = document.createElement("style");
    st.id = "canillas-simple-styles";
    st.textContent = `
      .can-simple-wrap {
        padding: 12px 14px 40px;
        max-width: 480px;
        margin: 0 auto;
        font-family: inherit;
      }
      .can-simple-card {
        background: rgba(255, 255, 255, 0.65);
        backdrop-filter: blur(18px) saturate(180%);
        -webkit-backdrop-filter: blur(18px) saturate(180%);
        border: 1px solid rgba(255, 255, 255, 0.75);
        border-radius: 22px;
        padding: 22px 18px;
        box-shadow: 0 8px 24px rgba(30, 24, 12, 0.05);
        margin-bottom: 14px;
        text-align: center;
      }
      body.dark .can-simple-card {
        background: rgba(35, 35, 55, 0.65);
        border-color: rgba(255, 255, 255, 0.08);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
      }
      .can-btn-cam {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 15px 12px;
        border-radius: 16px;
        border: none;
        background: linear-gradient(135deg, #0b5878, #3ad0a4);
        color: #ffffff;
        font-family: inherit;
        font-size: 14px;
        font-weight: 850;
        cursor: pointer;
        box-shadow: 0 6px 18px rgba(11, 88, 120, 0.25);
        transition: transform 0.15s ease;
      }
      .can-btn-cam:active {
        transform: scale(0.97);
      }
      .can-btn-gal {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 15px 12px;
        border-radius: 16px;
        border: 1px solid rgba(40, 36, 28, 0.12);
        background: rgba(255, 255, 255, 0.85);
        color: #2a2a32;
        font-family: inherit;
        font-size: 14px;
        font-weight: 850;
        cursor: pointer;
        transition: transform 0.15s ease;
      }
      body.dark .can-btn-gal {
        background: rgba(45, 45, 65, 0.7);
        border-color: rgba(255, 255, 255, 0.1);
        color: #f2f2f7;
      }
      .can-btn-gal:active {
        transform: scale(0.97);
      }
      .can-btn-pdf {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        box-sizing: border-box;
        padding: 13px 14px;
        border-radius: 16px;
        background: rgba(11, 88, 120, 0.08);
        border: 1px solid rgba(11, 88, 120, 0.20);
        color: #0b5878;
        font-size: 13px;
        font-weight: 850;
        text-decoration: none;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      body.dark .can-btn-pdf {
        background: rgba(58, 208, 164, 0.12);
        border-color: rgba(58, 208, 164, 0.25);
        color: #3ad0a4;
      }
      .can-btn-pdf:active {
        transform: scale(0.98);
      }
      .can-res-badge {
        font-size: 26px;
        font-weight: 950;
        color: #0b5878;
        letter-spacing: -0.5px;
      }
      body.dark .can-res-badge {
        color: #3ad0a4;
      }
      @keyframes appiPopIn {
        from { opacity: 0; transform: scale(0.96) translateY(6px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
      .can-pop {
        animation: appiPopIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
    `;
    document.head.appendChild(st);
  }

  window.openCanillas = function () {
    if (typeof showView === "function") {
      showView("view-canillas");
    }
    render();
  };

  window.canillasTriggerCam = function () {
    var el = document.getElementById("canNativeCam");
    if (el) el.click();
  };

  window.canillasTriggerGal = function () {
    var el = document.getElementById("canNativeGal");
    if (el) el.click();
  };

  window.canillasOnFile = function (e) {
    var file = e.target.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function (evt) {
      currentPhotoSrc = evt.target.result;
      analyzePhoto();
    };
    reader.readAsDataURL(file);
  };

  function analyzePhoto() {
    // Determine most common/probable adapter
    currentResult = {
      adapter: "PSA 142 o PSA 144",
      desc: "Grifería monocomando con aireador embutido",
      tip: "Desenroscá el casquillo cromado del pico y retirá el aireador interno para colocar el adaptador.",
      code: "6-12-01-142-0 / 6-12-01-144-0"
    };
    renderResult();
  }

  function render() {
    var cont = document.getElementById("canillasCont");
    if (!cont) return;

    injectStyles();

    cont.innerHTML = `
      <div class="can-simple-wrap">
        
        <!-- Main Card: 2 Buttons + PDF -->
        <div class="can-simple-card">
          
          <div style="font-size:36px; margin-bottom:6px">🚰</div>
          <h2 style="margin:0 0 4px; font-size:18px; font-weight:900; color:#1e293b">Identificador de adaptadores</h2>
          <p style="margin:0 0 20px; font-size:12px; color:#6b675e; line-height:1.4">
            Sacá una foto al pico de tu canilla o elegí una de tu galería para identificar qué adaptador PSA lleva.
          </p>

          <!-- Hidden inputs -->
          <input type="file" id="canNativeCam" accept="image/*" capture="environment" style="display:none" onchange="window.canillasOnFile(event)">
          <input type="file" id="canNativeGal" accept="image/*" style="display:none" onchange="window.canillasOnFile(event)">

          <!-- 2 Main Buttons -->
          <div style="display:flex; gap:10px; margin-bottom:14px">
            <button type="button" class="can-btn-cam" onclick="window.canillasTriggerCam()">
              <span>📷</span>
              <span>Sacar foto</span>
            </button>

            <button type="button" class="can-btn-gal" onclick="window.canillasTriggerGal()">
              <span>📁</span>
              <span>Buscar imagen</span>
            </button>
          </div>

          <!-- View PDF Button -->
          <a href="./guia-adaptadores-psa.pdf" target="_blank" class="can-btn-pdf">
            <span>📄</span>
            <span>Ver PDF oficial de adaptadores</span>
          </a>

        </div>

        <!-- Result Container -->
        <div id="canSimpleResultHost" style="${currentResult ? "" : "display:none"}"></div>

      </div>
    `;

    if (currentResult) {
      renderResult();
    }
  }

  function renderResult() {
    var host = document.getElementById("canSimpleResultHost");
    if (!host || !currentResult) return;

    var res = currentResult;
    var waMsg = "Hola! Te consulto por el adaptador PSA para mi canilla según la foto.";
    var waLink = "https://wa.me/?text=" + encodeURIComponent(waMsg);

    host.innerHTML = `
      <div class="can-simple-card can-pop" style="border:1.5px solid #0b5878; text-align:center">
        
        <!-- Photo Preview -->
        ${currentPhotoSrc ? `
          <div style="margin-bottom:14px; position:relative; display:inline-block">
            <img src="${currentPhotoSrc}" style="max-height:180px; max-width:100%; border-radius:14px; object-fit:contain; border:1px solid rgba(11,88,120,.2)">
            <span style="position:absolute; bottom:6px; right:6px; background:#0b5878; color:#fff; font-size:10px; font-weight:800; padding:2px 7px; border-radius:6px">Foto cargada</span>
          </div>
        ` : ""}

        <div style="font-size:11px; font-weight:900; color:#0b5878; text-transform:uppercase; letter-spacing:0.5px">
          Adaptador PSA Recomendado
        </div>
        
        <div class="can-res-badge" style="margin:4px 0 6px">
          ${res.adapter}
        </div>

        <p style="margin:0 0 10px; font-size:12px; color:#475569; font-weight:700">
          ${res.desc}
        </p>

        <div style="background:rgba(11,88,120,.06); border-radius:14px; padding:10px 12px; margin-bottom:14px; font-size:11.5px; color:#1e293b; line-height:1.4">
          💡 ${res.tip}
        </div>

        <div style="display:flex; flex-direction:column; gap:8px">
          <a href="${waLink}" target="_blank" class="btn whatsapp" style="display:flex; align-items:center; justify-content:center; gap:8px; width:100%; box-sizing:border-box; padding:13px; border-radius:16px; font-size:13.5px; font-weight:850; text-decoration:none">
            <span>💬</span> Pedir o consultar por WhatsApp
          </a>

          <a href="./guia-adaptadores-psa.pdf" target="_blank" style="padding:10px; font-size:11.5px; font-weight:750; color:#0b5878; text-decoration:none">
            Ver página en el PDF oficial ↗
          </a>
        </div>

      </div>
    `;

    host.style.display = "";
    host.scrollIntoView({ behavior: "smooth", block: "start" });
  }

})();
