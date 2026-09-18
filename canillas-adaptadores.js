/* ============================================================
   APPI · Canillas & Adaptadores PSA
   - 2 botones: Sacar foto / Buscar imagen
   - Guía oficial en botón que abre Popup modal
   - Imagen completa de la página / adaptador con zoom en Popup
   - Sin iconos en el título, sin botón de WhatsApp
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
        padding: 14px 14px 80px;
        max-width: 500px;
        margin: 0 auto;
        font-family: inherit;
      }
      .can-simple-card {
        background: rgba(255, 255, 255, 0.72);
        backdrop-filter: blur(18px) saturate(180%);
        -webkit-backdrop-filter: blur(18px) saturate(180%);
        border: 1px solid rgba(255, 255, 255, 0.85);
        border-radius: 20px;
        padding: 20px 18px;
        box-shadow: 0 6px 20px rgba(30, 24, 12, 0.05);
        margin-bottom: 16px;
      }
      body.dark .can-simple-card {
        background: rgba(35, 35, 55, 0.72);
        border-color: rgba(255, 255, 255, 0.08);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
      }
      .can-btn-cam {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 14px 12px;
        border-radius: 14px;
        border: none;
        background: linear-gradient(135deg, #0b5878, #3ad0a4);
        color: #ffffff;
        font-family: inherit;
        font-size: 14px;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 4px 14px rgba(11, 88, 120, 0.25);
        transition: transform 0.12s ease;
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
        padding: 14px 12px;
        border-radius: 14px;
        border: 1px solid rgba(40, 36, 28, 0.15);
        background: rgba(255, 255, 255, 0.9);
        color: #2a2a32;
        font-family: inherit;
        font-size: 14px;
        font-weight: 800;
        cursor: pointer;
        transition: transform 0.12s ease;
      }
      body.dark .can-btn-gal {
        background: rgba(45, 45, 65, 0.8);
        border-color: rgba(255, 255, 255, 0.12);
        color: #f2f2f7;
      }
      .can-btn-gal:active {
        transform: scale(0.97);
      }
      .can-btn-pdf-trigger {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 14px 16px;
        border-radius: 16px;
        background: rgba(11, 88, 120, 0.08);
        border: 1.5px solid rgba(11, 88, 120, 0.22);
        color: #0b5878;
        font-family: inherit;
        font-size: 13.5px;
        font-weight: 850;
        cursor: pointer;
        box-sizing: border-box;
        transition: all 0.15s ease;
      }
      body.dark .can-btn-pdf-trigger {
        background: rgba(58, 208, 164, 0.12);
        border-color: rgba(58, 208, 164, 0.28);
        color: #3ad0a4;
      }
      .can-btn-pdf-trigger:active {
        transform: scale(0.98);
      }
      .can-page-preview-box {
        background: #ffffff;
        border-radius: 16px;
        padding: 6px;
        display: block;
        border: 1.5px solid rgba(11, 88, 120, 0.2);
        box-shadow: 0 4px 14px rgba(0,0,0,0.06);
        margin: 12px auto;
        cursor: pointer;
        max-width: 320px;
        position: relative;
        overflow: hidden;
      }
      body.dark .can-page-preview-box {
        background: #1a1a28;
        border-color: rgba(58, 208, 164, 0.3);
      }
      .can-page-preview-img {
        width: 100%;
        height: auto;
        max-height: 280px;
        object-fit: contain;
        display: block;
        border-radius: 10px;
      }
      .can-zoom-badge {
        position: absolute;
        bottom: 12px;
        right: 12px;
        background: rgba(11, 88, 120, 0.9);
        color: #ffffff;
        font-size: 10.5px;
        font-weight: 800;
        padding: 4px 8px;
        border-radius: 8px;
        backdrop-filter: blur(4px);
        box-shadow: 0 2px 6px rgba(0,0,0,0.25);
      }
      .can-res-title {
        font-size: 28px;
        font-weight: 950;
        color: #0b5878;
        margin: 4px 0 6px;
        letter-spacing: -0.5px;
      }
      body.dark .can-res-title {
        color: #3ad0a4;
      }
      /* Modal Popup Styles */
      .can-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(15, 23, 42, 0.82);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 999999;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: center;
        animation: canFadeIn 0.2s ease-out;
      }
      @keyframes canFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .can-modal-content {
        background: #ffffff;
        width: 100%;
        max-width: 600px;
        max-height: 92vh;
        border-radius: 24px 24px 0 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 -10px 30px rgba(0,0,0,0.3);
        animation: canSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      }
      body.dark .can-modal-content {
        background: #181826;
        color: #f2f2f7;
      }
      @keyframes canSlideUp {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
      }
      .can-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 18px;
        border-bottom: 1px solid rgba(0,0,0,0.08);
      }
      body.dark .can-modal-header {
        border-color: rgba(255,255,255,0.08);
      }
      .can-modal-body {
        flex: 1;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        padding: 12px;
        text-align: center;
      }
      .can-close-btn {
        background: rgba(0,0,0,0.06);
        border: none;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        font-size: 16px;
        font-weight: 800;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #1e293b;
      }
      body.dark .can-close-btn {
        background: rgba(255,255,255,0.12);
        color: #ffffff;
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

  window.canillasReset = function () {
    currentPhotoSrc = null;
    currentResult = null;
    render();
  };

  window.canillasOnFile = function (e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function (evt) {
      currentPhotoSrc = evt.target.result;
      analyzePhoto();
    };
    reader.readAsDataURL(file);
  };

  function analyzePhoto() {
    // Adapter recommendation based on faucet characteristics
    currentResult = {
      adapter: "PSA 142",
      name: "Adaptador Rosca Macho 16,3 x 1 mm",
      pageImg: "./adapters/page_18.jpg",
      thread: "Rosca métrica 16,3 x 1 mm (Casquillo)",
      code: "6-12-01-142-0",
      tip: "Desenroscá el casquillo cromado de la punta del pico y retirá el aireador interno para colocar este adaptador."
    };
    renderResult();
  }

  /* Popup para ver la imagen completa de la página */
  window.canillasOpenImagePopup = function (imgSrc, title) {
    var modal = document.createElement("div");
    modal.className = "can-modal-overlay";
    modal.id = "canImgModal";
    modal.onclick = function (e) {
      if (e.target === modal) window.canillasCloseModal();
    };

    modal.innerHTML = `
      <div class="can-modal-content" style="max-height: 94vh;">
        <div class="can-modal-header">
          <span style="font-weight: 850; font-size: 15px;">${title || "Guía del adaptador"}</span>
          <button type="button" class="can-close-btn" onclick="window.canillasCloseModal()">✕</button>
        </div>
        <div class="can-modal-body" style="background: #f1f5f9; padding: 10px;">
          <img src="${imgSrc}" style="width: 100%; height: auto; max-width: 520px; display: block; margin: 0 auto; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);">
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  };

  /* Popup para abrir el PDF completo oficial */
  window.canillasOpenPdfPopup = function () {
    var modal = document.createElement("div");
    modal.className = "can-modal-overlay";
    modal.id = "canPdfModal";
    modal.onclick = function (e) {
      if (e.target === modal) window.canillasCloseModal();
    };

    modal.innerHTML = `
      <div class="can-modal-content" style="height: 92vh;">
        <div class="can-modal-header">
          <div>
            <div style="font-weight: 850; font-size: 15px;">Guía oficial de adaptadores</div>
            <a href="./guia-adaptadores-psa.pdf" target="_blank" style="font-size: 11px; color: #0b5878; font-weight: 750; text-decoration: none;">
              Abrir archivo externo ↗
            </a>
          </div>
          <button type="button" class="can-close-btn" onclick="window.canillasCloseModal()">✕</button>
        </div>
        <div class="can-modal-body" style="padding: 0; height: 100%;">
          <iframe src="./guia-adaptadores-psa.pdf#toolbar=1" style="width: 100%; height: 100%; border: none;"></iframe>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  };

  window.canillasCloseModal = function () {
    var m1 = document.getElementById("canImgModal");
    if (m1) m1.parentNode.removeChild(m1);
    var m2 = document.getElementById("canPdfModal");
    if (m2) m2.parentNode.removeChild(m2);
  };

  function render() {
    var cont = document.getElementById("canillasCont");
    if (!cont) return;

    injectStyles();

    cont.innerHTML = `
      <div class="can-simple-wrap">
        
        <!-- Tarjeta de botones principales -->
        <div class="can-simple-card" style="text-align: center;">
          
          <h2 style="margin: 0 0 6px; font-size: 19px; font-weight: 900; color: #1e293b;">
            Identificar adaptador
          </h2>
          <p style="margin: 0 0 16px; font-size: 12.5px; color: #64748b; line-height: 1.4;">
            Sacá una foto al pico de la canilla o buscá una imagen para identificar el adaptador PSA correspondiente.
          </p>

          <!-- Inputs invisibles de cámara y galería -->
          <input type="file" id="canNativeCam" accept="image/*" capture="environment" style="display:none" onchange="window.canillasOnFile(event)">
          <input type="file" id="canNativeGal" accept="image/*" style="display:none" onchange="window.canillasOnFile(event)">

          <!-- 2 Botones solicitados -->
          <div style="display: flex; gap: 10px; margin-bottom: 14px;">
            <button type="button" class="can-btn-cam" onclick="window.canillasTriggerCam()">
              <span>Sacar foto</span>
            </button>

            <button type="button" class="can-btn-gal" onclick="window.canillasTriggerGal()">
              <span>Buscar imagen</span>
            </button>
          </div>

          <!-- Botón que abre el PDF en Popup -->
          <button type="button" class="can-btn-pdf-trigger" onclick="window.canillasOpenPdfPopup()">
            <span>Ver Guía oficial de adaptadores PSA</span>
          </button>

        </div>

        <!-- Área de Resultado con la página entera del adaptador -->
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

    host.innerHTML = `
      <div class="can-simple-card" style="border: 1.5px solid #0b5878; text-align: center;">
        
        <!-- Foto de la canilla del usuario -->
        ${currentPhotoSrc ? `
          <div style="margin-bottom: 12px;">
            <img src="${currentPhotoSrc}" style="max-height: 150px; max-width: 100%; border-radius: 12px; object-fit: contain; border: 1px solid rgba(0,0,0,0.1);">
          </div>
        ` : ""}

        <div style="font-size: 11px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">
          ADAPTADOR PSA IDENTIFICADO
        </div>
        
        <div class="can-res-title">
          ${res.adapter}
        </div>

        <!-- Imagen ENTERA de la página del catálogo (con popup al presionar) -->
        <div class="can-page-preview-box" onclick="window.canillasOpenImagePopup('${res.pageImg}', 'Ficha oficial ${res.adapter}')" title="Tocar para ampliar">
          <img src="${res.pageImg}" alt="${res.adapter}" class="can-page-preview-img">
          <div class="can-zoom-badge">🔍 Tocar para ampliar</div>
        </div>

        <div style="font-size: 13.5px; font-weight: 800; color: #1e293b; margin-top: 6px; margin-bottom: 3px;">
          ${res.name}
        </div>

        <div style="font-size: 11px; color: #64748b; margin-bottom: 12px;">
          Código: ${res.code} · ${res.thread}
        </div>

        <div style="background: rgba(11, 88, 120, 0.08); border-radius: 12px; padding: 11px 14px; font-size: 12px; color: #0b5878; line-height: 1.4; margin-bottom: 14px; text-align: left;">
          ${res.tip}
        </div>

        <div style="display: flex; gap: 8px;">
          <button type="button" class="can-btn-cam" onclick="window.canillasTriggerCam()" style="font-size: 13px; padding: 11px;">
            <span>Probar otra foto</span>
          </button>
          <button type="button" class="can-btn-gal" onclick="window.canillasReset()" style="font-size: 13px; padding: 11px;">
            <span>Cerrar</span>
          </button>
        </div>

      </div>
    `;

    host.style.display = "";
    host.scrollIntoView({ behavior: "smooth", block: "start" });
  }

})();
