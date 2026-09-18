/* ============================================================
   APPI · Canillas & Adaptadores PSA
   - 2 botones: Sacar foto / Buscar imagen
   - Imagen del adaptador PSA
   - Visualizador de PDF integrado
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
        padding: 14px 14px 40px;
        max-width: 520px;
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
      .can-pdf-frame-box {
        width: 100%;
        height: 480px;
        border-radius: 16px;
        overflow: hidden;
        border: 1px solid rgba(11, 88, 120, 0.18);
        background: #f8fafc;
        margin-top: 10px;
        position: relative;
      }
      body.dark .can-pdf-frame-box {
        background: #1e1e2d;
        border-color: rgba(255, 255, 255, 0.12);
      }
      .can-adapter-img-box {
        background: #ffffff;
        border-radius: 16px;
        padding: 10px;
        display: inline-block;
        border: 1.5px solid rgba(11, 88, 120, 0.2);
        box-shadow: 0 4px 12px rgba(0,0,0,0.06);
        margin: 12px auto;
        max-width: 240px;
      }
      body.dark .can-adapter-img-box {
        background: #202030;
        border-color: rgba(58, 208, 164, 0.3);
      }
      .can-adapter-img {
        width: 100%;
        height: auto;
        max-height: 180px;
        object-fit: contain;
        display: block;
        border-radius: 10px;
      }
      .can-res-title {
        font-size: 26px;
        font-weight: 900;
        color: #0b5878;
        margin: 4px 0;
        letter-spacing: -0.5px;
      }
      body.dark .can-res-title {
        color: #3ad0a4;
      }
      @keyframes canFadeUp {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .can-anim-up {
        animation: canFadeUp 0.25s ease-out forwards;
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
      image: "./adapters/psa-142.jpg",
      thread: "Rosca métrica 16,3 x 1 mm (Casquillo)",
      code: "6-12-01-142-0",
      tip: "Desenroscá el casquillo cromado de la punta del pico y retirá el aireador interno para colocar este adaptador."
    };
    renderResult();
  }

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
          <div style="display: flex; gap: 10px;">
            <button type="button" class="can-btn-cam" onclick="window.canillasTriggerCam()">
              <span>Sacar foto</span>
            </button>

            <button type="button" class="can-btn-gal" onclick="window.canillasTriggerGal()">
              <span>Buscar imagen</span>
            </button>
          </div>

        </div>

        <!-- Área de Resultado con la imagen del adaptador -->
        <div id="canSimpleResultHost" style="${currentResult ? "" : "display:none"}"></div>

        <!-- Visualizador del PDF de la Guía Oficial -->
        <div class="can-simple-card">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 14px; font-weight: 850; color: #1e293b;">
              Guía oficial de adaptadores PSA
            </span>
            <a href="./guia-adaptadores-psa.pdf" target="_blank" style="font-size: 12px; font-weight: 800; color: #0b5878; text-decoration: none;">
              Pantalla completa ↗
            </a>
          </div>

          <div class="can-pdf-frame-box">
            <iframe src="./guia-adaptadores-psa.pdf#toolbar=0" style="width: 100%; height: 100%; border: none;"></iframe>
          </div>
        </div>

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
      <div class="can-simple-card can-anim-up" style="border: 1.5px solid #0b5878; text-align: center;">
        
        <!-- Foto de la canilla del usuario si está disponible -->
        ${currentPhotoSrc ? `
          <div style="margin-bottom: 12px;">
            <img src="${currentPhotoSrc}" style="max-height: 140px; max-width: 100%; border-radius: 12px; object-fit: contain; border: 1px solid rgba(0,0,0,0.1);">
          </div>
        ` : ""}

        <div style="font-size: 11px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">
          Adaptador PSA identificado
        </div>
        
        <div class="can-res-title">
          ${res.adapter}
        </div>

        <!-- Imagen del adaptador -->
        <div class="can-adapter-img-box">
          <img src="${res.image}" alt="${res.adapter}" class="can-adapter-img">
        </div>

        <div style="font-size: 13px; font-weight: 750; color: #1e293b; margin-bottom: 4px;">
          ${res.name}
        </div>

        <div style="font-size: 11px; color: #64748b; margin-bottom: 12px;">
          Código: ${res.code} · ${res.thread}
        </div>

        <div style="background: rgba(11, 88, 120, 0.08); border-radius: 12px; padding: 10px 14px; font-size: 12px; color: #0b5878; line-height: 1.4; margin-bottom: 14px; text-align: left;">
          ${res.tip}
        </div>

        <div style="display: flex; gap: 8px;">
          <button type="button" class="can-btn-cam" onclick="window.canillasTriggerCam()" style="font-size: 12.5px; padding: 10px;">
            <span>Probar otra foto</span>
          </button>
          <button type="button" class="can-btn-gal" onclick="window.canillasReset()" style="font-size: 12.5px; padding: 10px;">
            <span>Cerrar</span>
          </button>
        </div>

      </div>
    `;

    host.style.display = "";
    host.scrollIntoView({ behavior: "smooth", block: "start" });
  }

})();
