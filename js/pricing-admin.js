/* ============================================
   APPI · Panel de Administración de Precios
   (Usa REST API de Supabase directamente)
   Versión: 2.0 - Con console.log para debugging
   ============================================ */

(function(){
  'use strict';

  console.log('🔍 pricing-admin.js cargado - Versión 2.0');
  console.log('🔍 window.APPI_AUTH:', window.APPI_AUTH);

  // ============================================
  // Estado global
  // ============================================
  let pricingConfig = {
    monthly: 5000
  };

  // ============================================
  // Helper para hacer requests a Supabase
  // ============================================
  async function supabaseRequest(endpoint, options = {}) {
    const url = `${window.APPI_AUTH.url}/rest/v1/${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'apikey': window.APPI_AUTH.anonKey,
      'Authorization': `Bearer ${window.APPI_AUTH.anonKey}`,
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error en la request');
    }

    return response.json();
  }

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
      const data = await supabaseRequest(
        'pricing_config?select=*&active=eq.true&plan_type=eq.monthly'
      );

      if (data && data.length > 0) {
        pricingConfig.monthly = parseFloat(data[0].price);
      }

      console.log('✅ Configuración de precios cargada:', pricingConfig);

    } catch (error) {
      console.error('Error cargando configuración de precios:', error);
    }
  }

  // ============================================
  // Calcular precios automáticamente
  // ============================================
  function calculatePrices(monthlyPrice) {
    const halfYearly = Math.round(monthlyPrice * 6 * 0.90); // 10% descuento
    const yearly = Math.round(monthlyPrice * 12 * 0.80); // 20% descuento
    
    const halfYearlySavings = (monthlyPrice * 6) - halfYearly;
    const yearlySavings = (monthlyPrice * 12) - yearly;

    return {
      monthly: monthlyPrice,
      halfYearly: halfYearly,
      yearly: yearly,
      halfYearlySavings: halfYearlySavings,
      yearlySavings: yearlySavings
    };
  }

  // ============================================
  // Renderizar panel de administración
  // ============================================
  function renderPricingPanel() {
    const container = document.getElementById('pricingAdminContainer');
    if (!container) return;

    const prices = calculatePrices(pricingConfig.monthly);

    container.innerHTML = `
      <div class="pricing-admin">
        <div class="pricing-admin-header">
          <h2>💰 Configuración de Precios</h2>
          <p>Configurá el precio mensual y los otros planes se calculan automáticamente con descuentos atractivos.</p>
        </div>

        <div class="pricing-admin-main">
          <!-- Campo de entrada -->
          <div class="pricing-admin-input-section">
            <div class="pricing-admin-card">
              <h3>📅 Precio Base (Mensual)</h3>
              <div class="pricing-admin-field">
                <label for="monthlyPrice">Precio mensual (ARS)</label>
                <input 
                  type="number" 
                  id="monthlyPrice" 
                  value="${pricingConfig.monthly}" 
                  min="0" 
                  step="100"
                  class="pricing-admin-input"
                />
                <p class="pricing-admin-help">
                  Este es el precio base. Los otros planes se calculan automáticamente.
                </p>
              </div>

              <button 
                class="btn btn-primary pricing-admin-save" 
                onclick="APPIPricingAdmin.savePricing()"
              >
                Guardar Precios
              </button>
            </div>

            <div class="pricing-admin-info">
              <h4>ℹ️ Cómo se calculan los descuentos:</h4>
              <ul>
                <li><strong>6 meses:</strong> 10% de descuento (ahorra casi 1 mes)</li>
                <li><strong>Anual:</strong> 20% de descuento (ahorra casi 2.5 meses)</li>
              </ul>
              <p>Esta estrategia incentiva pagos más largos (mejor para vos) y da descuentos atractivos (mejor para el distribuidor).</p>
            </div>
          </div>

          <!-- Vista previa -->
          <div class="pricing-admin-preview">
            <h3>Vista previa de planes</h3>
            <p>Así van a ver los usuarios los precios:</p>
            
            <div class="pricing-admin-plans">
              <!-- Plan Mensual -->
              <div class="pricing-admin-plan">
                <div class="plan-name">Mensual</div>
                <div class="plan-price" id="previewMonthly">$${prices.monthly.toLocaleString('es-AR')}</div>
                <div class="plan-period">por mes</div>
              </div>

              <!-- Plan 6 Meses -->
              <div class="pricing-admin-plan">
                <div class="plan-name">6 Meses</div>
                <div class="plan-price" id="previewHalfYearly">$${prices.halfYearly.toLocaleString('es-AR')}</div>
                <div class="plan-period">por 6 meses</div>
                <div class="plan-savings" id="previewHalfYearlySavings">Ahorrás $${prices.halfYearlySavings.toLocaleString('es-AR')}</div>
              </div>

              <!-- Plan Anual -->
              <div class="pricing-admin-plan featured">
                <div class="plan-badge">Más elegido</div>
                <div class="plan-name">Anual</div>
                <div class="plan-price" id="previewYearly">$${prices.yearly.toLocaleString('es-AR')}</div>
                <div class="plan-period">por año</div>
                <div class="plan-savings" id="previewYearlySavings">Ahorrás $${prices.yearlySavings.toLocaleString('es-AR')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Agregar event listener para actualizar preview en tiempo real
    const monthlyInput = document.getElementById('monthlyPrice');
    if (monthlyInput) {
      monthlyInput.addEventListener('input', updatePreview);
    }
  }

  // ============================================
  // Actualizar vista previa en tiempo real
  // ============================================
  function updatePreview() {
    const monthlyInput = document.getElementById('monthlyPrice');
    if (!monthlyInput) return;

    const newMonthly = parseInt(monthlyInput.value) || 0;
    const prices = calculatePrices(newMonthly);

    // Actualizar preview
    const previewMonthly = document.getElementById('previewMonthly');
    const previewHalfYearly = document.getElementById('previewHalfYearly');
    const previewYearly = document.getElementById('previewYearly');
    const previewHalfYearlySavings = document.getElementById('previewHalfYearlySavings');
    const previewYearlySavings = document.getElementById('previewYearlySavings');

    if (previewMonthly) previewMonthly.textContent = `$${prices.monthly.toLocaleString('es-AR')}`;
    if (previewHalfYearly) previewHalfYearly.textContent = `$${prices.halfYearly.toLocaleString('es-AR')}`;
    if (previewYearly) previewYearly.textContent = `$${prices.yearly.toLocaleString('es-AR')}`;
    if (previewHalfYearlySavings) previewHalfYearlySavings.textContent = `Ahorrás $${prices.halfYearlySavings.toLocaleString('es-AR')}`;
    if (previewYearlySavings) previewYearlySavings.textContent = `Ahorrás $${prices.yearlySavings.toLocaleString('es-AR')}`;
  }

  // ============================================
  // Guardar configuración de precios
  // ============================================
  async function savePricing() {
    try {
      const monthlyInput = document.getElementById('monthlyPrice');
      if (!monthlyInput) {
        alert('Error: No se encontró el campo de precio');
        return;
      }

      const monthlyPrice = parseFloat(monthlyInput.value);
      if (isNaN(monthlyPrice) || monthlyPrice < 0) {
        alert('Error: El precio debe ser un número positivo');
        return;
      }

      // Calcular todos los precios
      const prices = calculatePrices(monthlyPrice);

      // Mostrar loading
      const saveButton = event.target;
      const originalText = saveButton.textContent;
      saveButton.textContent = 'Guardando...';
      saveButton.disabled = true;

      // Preparar datos para guardar
      const plansToSave = [
        {
          plan_type: 'monthly',
          price: prices.monthly,
          description: 'Acceso completo a APPI por 30 días',
          features: ['Acceso completo a todas las funcionalidades', 'Soporte por WhatsApp', 'Actualizaciones incluidas', 'Cancelás cuando quieras'],
          active: true
        },
        {
          plan_type: 'half-yearly',
          price: prices.halfYearly,
          description: 'Acceso completo a APPI por 6 meses (10% descuento)',
          features: ['Todo lo del Plan Mensual', `Ahorrás $${prices.halfYearlySavings.toLocaleString('es-AR')}`, 'Precio congelado por 6 meses', 'Soporte prioritario'],
          active: true
        },
        {
          plan_type: 'yearly',
          price: prices.yearly,
          description: 'Acceso completo a APPI por 12 meses (20% descuento)',
          features: ['Todo lo del Plan Mensual', `Ahorrás $${prices.yearlySavings.toLocaleString('es-AR')}`, 'Precio congelado por 1 año', 'Soporte VIP'],
          active: true
        }
      ];

      // Guardar cada plan usando PATCH (UPDATE)
      for (const plan of plansToSave) {
        console.log(`🔍 Actualizando plan: ${plan.plan_type}`, plan);
        
        await supabaseRequest(`pricing_config?plan_type=eq.${plan.plan_type}`, {
          method: 'PATCH',
          body: JSON.stringify({
            price: plan.price,
            description: plan.description,
            features: plan.features,
            active: plan.active
          })
        });
        
        console.log(`✅ Plan ${plan.plan_type} actualizado`);
      }

      // Actualizar estado local
      pricingConfig.monthly = monthlyPrice;

      // Restaurar botón
      saveButton.textContent = originalText;
      saveButton.disabled = false;

      // Mostrar éxito
      alert('✅ Precios actualizados correctamente:\n\n' +
            `• Mensual: $${prices.monthly.toLocaleString('es-AR')}\n` +
            `• 6 Meses: $${prices.halfYearly.toLocaleString('es-AR')} (ahorrás $${prices.halfYearlySavings.toLocaleString('es-AR')})\n` +
            `• Anual: $${prices.yearly.toLocaleString('es-AR')} (ahorrás $${prices.yearlySavings.toLocaleString('es-AR')})`);

      console.log('✅ Configuración guardada:', pricingConfig);

    } catch (error) {
      console.error('Error guardando configuración:', error);
      alert('Error guardando configuración: ' + error.message);

      // Restaurar botón
      const saveButton = event.target;
      saveButton.textContent = saveButton.textContent.replace('Guardando...', 'Guardar Precios');
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
