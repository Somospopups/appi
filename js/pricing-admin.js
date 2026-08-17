/* ============================================
   APPI · Panel de Administración de Precios
   ============================================ */

(function(){
  'use strict';

  // ============================================
  // Estado global
  // ============================================
  let pricingConfig = {
    monthly: { price: 5000, description: '', features: [] },
    yearly: { price: 50000, description: '', features: [] }
  };

  // ============================================
  // Inicialización
  // ============================================
  async function init() {
    await loadPricingConfig();
    renderPricingPanel();
  }

  // ============================================
  // Cargar configuración de precios
  // ============================================
  async function loadPricingConfig() {
    try {
      const { data, error } = await supabase
        .from('pricing_config')
        .select('*')
        .eq('active', true);

      if (error) {
        console.error('Error cargando configuración de precios:', error);
        return;
      }

      if (data && data.length > 0) {
        data.forEach(item => {
          if (item.plan_type === 'monthly') {
            pricingConfig.monthly = {
              price: parseFloat(item.price),
              description: item.description || '',
              features: item.features || []
            };
          } else if (item.plan_type === 'yearly') {
            pricingConfig.yearly = {
              price: parseFloat(item.price),
              description: item.description || '',
              features: item.features || []
            };
          }
        });
      }

      console.log('✅ Configuración de precios cargada:', pricingConfig);

    } catch (error) {
      console.error('Error cargando configuración de precios:', error);
    }
  }

  // ============================================
  // Renderizar panel de administración
  // ============================================
  function renderPricingPanel() {
    const container = document.getElementById('pricingAdminContainer');
    if (!container) return;

    const monthlySavings = (pricingConfig.monthly.price * 12) - pricingConfig.yearly.price;

    container.innerHTML = `
      <div class="pricing-admin">
        <div class="pricing-admin-header">
          <h2>Configuración de Precios</h2>
          <p>Editá los precios de las membresías. Los cambios se aplican inmediatamente.</p>
        </div>

        <div class="pricing-admin-grid">
          <!-- Plan Mensual -->
          <div class="pricing-admin-card">
            <div class="pricing-admin-card-header">
              <h3>📅 Plan Mensual</h3>
            </div>

            <div class="pricing-admin-field">
              <label for="monthlyPrice">Precio (ARS)</label>
              <input 
                type="number" 
                id="monthlyPrice" 
                value="${pricingConfig.monthly.price}" 
                min="0" 
                step="100"
                class="pricing-admin-input"
              />
            </div>

            <div class="pricing-admin-field">
              <label for="monthlyDescription">Descripción</label>
              <textarea 
                id="monthlyDescription" 
                rows="2"
                class="pricing-admin-textarea"
              >${pricingConfig.monthly.description}</textarea>
            </div>

            <div class="pricing-admin-field">
              <label>Características (una por línea)</label>
              <textarea 
                id="monthlyFeatures" 
                rows="4"
                class="pricing-admin-textarea"
                placeholder="Acceso completo a todas las funcionalidades&#10;Soporte por WhatsApp&#10;Actualizaciones incluidas"
              >${pricingConfig.monthly.features.join('\n')}</textarea>
            </div>

            <button 
              class="btn btn-primary pricing-admin-save" 
              onclick="APPIPricingAdmin.savePricing('monthly')"
            >
              Guardar Plan Mensual
            </button>
          </div>

          <!-- Plan Anual -->
          <div class="pricing-admin-card">
            <div class="pricing-admin-card-header">
              <h3>📆 Plan Anual</h3>
              ${monthlySavings > 0 ? `
                <div class="pricing-admin-savings">
                  Ahorro: $${monthlySavings.toLocaleString('es-AR')} vs mensual
                </div>
              ` : ''}
            </div>

            <div class="pricing-admin-field">
              <label for="yearlyPrice">Precio (ARS)</label>
              <input 
                type="number" 
                id="yearlyPrice" 
                value="${pricingConfig.yearly.price}" 
                min="0" 
                step="100"
                class="pricing-admin-input"
              />
            </div>

            <div class="pricing-admin-field">
              <label for="yearlyDescription">Descripción</label>
              <textarea 
                id="yearlyDescription" 
                rows="2"
                class="pricing-admin-textarea"
              >${pricingConfig.yearly.description}</textarea>
            </div>

            <div class="pricing-admin-field">
              <label>Características (una por línea)</label>
              <textarea 
                id="yearlyFeatures" 
                rows="4"
                class="pricing-admin-textarea"
                placeholder="Todo lo del Plan Mensual&#10;Ahorrás $10.000&#10;Precio congelado por 1 año"
              >${pricingConfig.yearly.features.join('\n')}</textarea>
            </div>

            <button 
              class="btn btn-primary pricing-admin-save" 
              onclick="APPIPricingAdmin.savePricing('yearly')"
            >
              Guardar Plan Anual
            </button>
          </div>
        </div>

        <div class="pricing-admin-preview">
          <h3>Vista previa</h3>
          <p>Así van a ver los usuarios los precios en la pantalla de planes:</p>
          <div class="pricing-admin-preview-grid">
            <div class="pricing-admin-preview-card">
              <div class="preview-plan-name">Plan Mensual</div>
              <div class="preview-plan-price">$${pricingConfig.monthly.price.toLocaleString('es-AR')}</div>
              <div class="preview-plan-period">ARS / mes</div>
            </div>
            <div class="pricing-admin-preview-card">
              <div class="preview-plan-name">Plan Anual</div>
              <div class="preview-plan-price">$${pricingConfig.yearly.price.toLocaleString('es-AR')}</div>
              <div class="preview-plan-period">ARS / año</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================
  // Guardar configuración de precios
  // ============================================
  async function savePricing(planType) {
    try {
      const priceInput = document.getElementById(`${planType}Price`);
      const descriptionInput = document.getElementById(`${planType}Description`);
      const featuresInput = document.getElementById(`${planType}Features`);

      if (!priceInput || !descriptionInput || !featuresInput) {
        alert('Error: No se encontraron los campos del formulario');
        return;
      }

      const price = parseFloat(priceInput.value);
      const description = descriptionInput.value.trim();
      const features = featuresInput.value.split('\n').map(f => f.trim()).filter(f => f.length > 0);

      if (isNaN(price) || price < 0) {
        alert('Error: El precio debe ser un número positivo');
        return;
      }

      // Mostrar loading
      const saveButton = event.target;
      const originalText = saveButton.textContent;
      saveButton.textContent = 'Guardando...';
      saveButton.disabled = true;

      // Actualizar en Supabase
      const { error } = await supabase
        .from('pricing_config')
        .upsert({
          plan_type: planType,
          price: price,
          description: description,
          features: features,
          active: true
        }, {
          onConflict: 'plan_type'
        });

      if (error) {
        throw new Error(error.message);
      }

      // Actualizar estado local
      pricingConfig[planType] = {
        price: price,
        description: description,
        features: features
      };

      // Restaurar botón
      saveButton.textContent = originalText;
      saveButton.disabled = false;

      // Mostrar éxito
      alert(`✅ ${planType === 'monthly' ? 'Plan Mensual' : 'Plan Anual'} actualizado correctamente`);

      // Re-renderizar panel
      renderPricingPanel();

      console.log('✅ Configuración guardada:', pricingConfig[planType]);

    } catch (error) {
      console.error('Error guardando configuración:', error);
      alert('Error guardando configuración: ' + error.message);

      // Restaurar botón
      const saveButton = event.target;
      saveButton.textContent = saveButton.textContent.replace('Guardando...', 'Guardar');
      saveButton.disabled = false;
    }
  }

  // ============================================
  // Obtener configuración actual (para uso externo)
  // ============================================
  function getPricingConfig() {
    return pricingConfig;
  }

  // ============================================
  // Exponer API global
  // ============================================
  window.APPIPricingAdmin = {
    init,
    savePricing,
    getPricingConfig
  };

  // ============================================
  // Auto-inicializar cuando el DOM esté listo
  // ============================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
