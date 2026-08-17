/* ============================================
   APPI · Sistema de Planes y Pagos
   ============================================ */

(function(){
  'use strict';

  // ============================================
  // Estado global
  // ============================================
  let currentPlan = null;
  let currentPayment = null;
  let subscriptionStatus = 'inactive';

  // ============================================
  // Inicialización
  // ============================================
  async function init() {
    await checkSubscription();
    renderPlansScreen();
  }

  // ============================================
  // Verificar estado de suscripción
  // ============================================
  async function checkSubscription() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Verificar si tiene suscripción activa en user_subscriptions
      const { data: userSubscription } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (userSubscription && 
          userSubscription.subscription_status === 'active' && 
          new Date(userSubscription.subscription_expires_at) > new Date()) {
        subscriptionStatus = 'active';
        const expiresAt = new Date(userSubscription.subscription_expires_at);
        const daysRemaining = Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24));
        
        console.log(`✅ Suscripción activa. Vence en ${daysRemaining} días`);
        
        // Si quedan menos de 7 días, mostrar aviso
        if (daysRemaining <= 7) {
          showRenewalWarning(daysRemaining);
        }
      } else {
        subscriptionStatus = 'inactive';
        console.log('❌ Sin suscripción activa');
      }

    } catch (error) {
      console.error('Error verificando suscripción:', error);
      subscriptionStatus = 'inactive';
    }
  }

  // ============================================
  // Renderizar pantalla de planes
  // ============================================
  function renderPlansScreen() {
    const container = document.getElementById('plansContainer');
    if (!container) return;

    if (subscriptionStatus === 'active') {
      renderActiveSubscription(container);
    } else {
      renderPlansList(container);
    }
  }

  // ============================================
  // Renderizar suscripción activa
  // ============================================
  async function renderActiveSubscription(container) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plan:plans(*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('expires_at', { ascending: false })
      .limit(1)
      .single();

    if (!subscription) {
      renderPlansList(container);
      return;
    }

    const expiresAt = new Date(subscription.expires_at);
    const daysRemaining = Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24));
    const expiresFormatted = expiresAt.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    container.innerHTML = `
      <div class="plans-active">
        <div class="plans-active-header">
          <div class="plans-active-icon">✅</div>
          <h2>Tu suscripción está activa</h2>
        </div>
        
        <div class="plans-active-card">
          <div class="plans-active-plan">
            <h3>${subscription.plan.name}</h3>
            <p>${subscription.plan.description}</p>
          </div>
          
          <div class="plans-active-details">
            <div class="plans-active-detail">
              <span class="plans-active-label">Estado</span>
              <span class="plans-active-value plans-active-status">Activo</span>
            </div>
            
            <div class="plans-active-detail">
              <span class="plans-active-label">Vence</span>
              <span class="plans-active-value">${expiresFormatted}</span>
            </div>
            
            <div class="plans-active-detail">
              <span class="plans-active-label">Días restantes</span>
              <span class="plans-active-value ${daysRemaining <= 7 ? 'plans-active-warning' : ''}">
                ${daysRemaining} día${daysRemaining !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          
          <div class="plans-active-features">
            <h4>Incluye:</h4>
            <ul>
              ${subscription.plan.features.map(f => `<li>✓ ${f}</li>`).join('')}
            </ul>
          </div>
        </div>
        
        ${daysRemaining <= 7 ? `
          <div class="plans-renewal-notice">
            <p>⚠️ Tu suscripción vence pronto. Renová para no perder el acceso.</p>
            <button class="btn btn-primary" onclick="APPIPlans.showRenewalOptions()">
              Renovar ahora
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  // ============================================
  // Renderizar lista de planes
  // ============================================
  async function renderPlansList(container) {
    // Cargar precios desde pricing_config
    const { data: pricingData, error: pricingError } = await supabase
      .from('pricing_config')
      .select('*')
      .eq('active', true);

    if (pricingError || !pricingData || pricingData.length === 0) {
      container.innerHTML = `
        <div class="plans-error">
          <p>Error cargando planes. Por favor, recargá la página.</p>
        </div>
      `;
      return;
    }

    // Convertir pricing_config a formato de planes
    const plans = pricingData.map(item => ({
      id: item.id,
      name: item.plan_type === 'monthly' ? 'Plan Mensual' : 'Plan Anual',
      description: item.description,
      price_monthly: item.plan_type === 'monthly' ? item.price : 0,
      price_yearly: item.plan_type === 'yearly' ? item.price : 0,
      features: item.features
    }));

    // Agrupar por tipo
    const monthlyPlan = plans.find(p => p.name === 'Plan Mensual');
    const yearlyPlan = plans.find(p => p.name === 'Plan Anual');
    
    const finalPlans = [monthlyPlan, yearlyPlan].filter(p => p);

    container.innerHTML = `
      <div class="plans-list">
        <div class="plans-header">
          <h1>Elegí tu plan</h1>
          <p>Accedé a todas las funcionalidades de APPI y potenciá tu negocio</p>
        </div>
        
        <div class="plans-grid">
          ${finalPlans.map(plan => renderPlanCard(plan)).join('')}
        </div>
        
        <div class="plans-faq">
          <h2>Preguntas frecuentes</h2>
          
          <details class="plans-faq-item">
            <summary>¿Cómo pago?</summary>
            <p>Aceptamos transferencia bancaria. Una vez que elegís el plan, te damos los datos bancarios y un código único. Hacés la transferencia incluyendo ese código en el concepto, y en 24-48 horas hábiles te habilitamos el acceso.</p>
          </details>
          
          <details class="plans-faq-item">
            <summary>¿Cuánto tarda en activarse?</summary>
            <p>Una vez que validamos tu transferencia (24-48 horas hábiles), el acceso se habilita automáticamente.</p>
          </details>
          
          <details class="plans-faq-item">
            <summary>¿Puedo cancelar cuando quiera?</summary>
            <p>Sí, no hay permanencia mínima. Cuando venza tu suscripción, simplemente no renuevas y el acceso se deshabilita automáticamente.</p>
          </details>
          
          <details class="plans-faq-item">
            <summary>¿Qué pasa si no renuevo?</summary>
            <p>Tu acceso se deshabilita automáticamente al vencer la suscripción. Tus datos se guardan por 90 días, así que si renuevas dentro de ese período, recuperás todo.</p>
          </details>
        </div>
      </div>
    `;

    // Agregar event listeners
    container.querySelectorAll('.plan-card-button').forEach(button => {
      button.addEventListener('click', (e) => {
        const planType = e.target.dataset.planType;
        selectPlan(planType);
      });
    });
  }

  // ============================================
  // Renderizar tarjeta de plan
  // ============================================
  function renderPlanCard(plan) {
    const isYearly = plan.name.toLowerCase().includes('anual');
    const price = isYearly ? plan.price_yearly : plan.price_monthly;
    const period = isYearly ? 'año' : 'mes';
    const savings = isYearly ? Math.round((plan.price_monthly * 12 - plan.price_yearly)) : 0;

    return `
      <div class="plan-card ${isYearly ? 'plan-card-featured' : ''}">
        ${isYearly ? '<div class="plan-card-badge">Más elegido</div>' : ''}
        
        <div class="plan-card-header">
          <h3>${plan.name}</h3>
          <p>${plan.description}</p>
        </div>
        
        <div class="plan-card-price">
          <div class="plan-card-amount">
            <span class="plan-card-currency">$</span>
            <span class="plan-card-value">${price.toLocaleString('es-AR')}</span>
          </div>
          <div class="plan-card-period">ARS / ${period}</div>
          ${savings > 0 ? `<div class="plan-card-savings">Ahorrás $${savings.toLocaleString('es-AR')}</div>` : ''}
        </div>
        
        <div class="plan-card-features">
          <ul>
            ${plan.features.map(f => `<li>✓ ${f}</li>`).join('')}
          </ul>
        </div>
        
        <button class="btn btn-primary plan-card-button" data-plan-type="${isYearly ? 'yearly' : 'monthly'}">
          Elegir plan
        </button>
      </div>
    `;
  }

  // ============================================
  // Seleccionar plan y mostrar instrucciones de pago
  // ============================================
  async function selectPlan(planType) {
    try {
      // Mostrar loading
      showLoading('Generando código de pago...');

      // Llamar a Edge Function
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/create-payment`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ planType })
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error creando pago');
      }

      hideLoading();
      currentPayment = result.payment;
      showPaymentInstructions(result);

    } catch (error) {
      hideLoading();
      console.error('Error seleccionando plan:', error);
      alert('Error: ' + error.message);
    }
  }

  // ============================================
  // Mostrar instrucciones de pago
  // ============================================
  function showPaymentInstructions(data) {
    const container = document.getElementById('plansContainer');
    if (!container) return;

    const { payment, bank_details, instructions } = data;

    container.innerHTML = `
      <div class="payment-instructions">
        <div class="payment-instructions-header">
          <div class="payment-instructions-icon">🏦</div>
          <h1>Instrucciones de pago</h1>
          <p>Seguí estos pasos para completar tu suscripción</p>
        </div>
        
        <div class="payment-code-card">
          <div class="payment-code-label">Tu código de pago</div>
          <div class="payment-code-value">${payment.code}</div>
          <div class="payment-code-help">
            ⚠️ Es MUY IMPORTANTE que incluyas este código en el concepto de la transferencia
          </div>
        </div>
        
        <div class="payment-amount-card">
          <div class="payment-amount-label">Monto a transferir</div>
          <div class="payment-amount-value">$${payment.amount.toLocaleString('es-AR')} ARS</div>
        </div>
        
        <div class="payment-bank-card">
          <h3>Datos bancarios</h3>
          
          <div class="payment-bank-detail">
            <span class="payment-bank-label">Alias</span>
            <span class="payment-bank-value">${bank_details.alias}</span>
            <button class="payment-bank-copy" onclick="APPIPlans.copyToClipboard('${bank_details.alias}')">
              📋 Copiar
            </button>
          </div>
          
          <div class="payment-bank-detail">
            <span class="payment-bank-label">CBU</span>
            <span class="payment-bank-value">${bank_details.cbu}</span>
            <button class="payment-bank-copy" onclick="APPIPlans.copyToClipboard('${bank_details.cbu}')">
              📋 Copiar
            </button>
          </div>
          
          <div class="payment-bank-detail">
            <span class="payment-bank-label">Banco</span>
            <span class="payment-bank-value">${bank_details.bank}</span>
          </div>
          
          <div class="payment-bank-detail">
            <span class="payment-bank-label">Titular</span>
            <span class="payment-bank-value">${bank_details.holder}</span>
          </div>
          
          <div class="payment-bank-detail">
            <span class="payment-bank-label">CUIT</span>
            <span class="payment-bank-value">${bank_details.cuit}</span>
          </div>
        </div>
        
        <div class="payment-steps-card">
          <h3>Pasos a seguir</h3>
          <ol>
            ${instructions.map((instruction, i) => `<li>${instruction}</li>`).join('')}
          </ol>
        </div>
        
        <div class="payment-status-card">
          <div class="payment-status-icon">⏳</div>
          <h3>Estado: Pendiente de pago</h3>
          <p>Una vez que hagas la transferencia, validaremos el pago en 24-48 horas hábiles y te habilitaremos el acceso automáticamente.</p>
          <p>Te enviaremos un email cuando tu suscripción esté activa.</p>
        </div>
        
        <div class="payment-actions">
          <button class="btn btn-secondary" onclick="APPIPlans.goBackToPlans()">
            ← Volver a planes
          </button>
          <button class="btn btn-primary" onclick="APPIPlans.checkPaymentStatus()">
            Verificar estado
          </button>
        </div>
      </div>
    `;
  }

  // ============================================
  // Verificar estado del pago
  // ============================================
  async function checkPaymentStatus() {
    if (!currentPayment) {
      alert('No hay pago pendiente');
      return;
    }

    try {
      showLoading('Verificando estado...');

      const { data: payment, error } = await supabase
        .from('payments')
        .select('*')
        .eq('payment_code', currentPayment.code)
        .single();

      hideLoading();

      if (error) {
        throw new Error('Error verificando pago');
      }

      if (payment.status === 'validated') {
        alert('✅ ¡Tu pago fue validado! Tu suscripción ya está activa. Recargando...');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else if (payment.status === 'rejected') {
        alert('❌ Tu pago fue rechazado. Por favor, contactá a soporte.');
      } else {
        alert('⏳ Tu pago aún está pendiente de validación. Te avisaremos por email cuando esté listo.');
      }

    } catch (error) {
      hideLoading();
      console.error('Error verificando pago:', error);
      alert('Error: ' + error.message);
    }
  }

  // ============================================
  // Mostrar aviso de renovación
  // ============================================
  function showRenewalWarning(daysRemaining) {
    // Crear banner de aviso
    const banner = document.createElement('div');
    banner.className = 'renewal-banner';
    banner.innerHTML = `
      <div class="renewal-banner-content">
        <span class="renewal-banner-icon">⚠️</span>
        <span class="renewal-banner-text">
          Tu suscripción vence en ${daysRemaining} día${daysRemaining !== 1 ? 's' : ''}. 
          <a href="#" onclick="APPIPlans.showRenewalOptions(); return false;">Renová ahora</a>
        </span>
        <button class="renewal-banner-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    // Insertar al inicio del body
    document.body.insertBefore(banner, document.body.firstChild);
  }

  // ============================================
  // Mostrar opciones de renovación
  // ============================================
  function showRenewalOptions() {
    subscriptionStatus = 'inactive';
    renderPlansScreen();
  }

  // ============================================
  // Volver a lista de planes
  // ============================================
  function goBackToPlans() {
    currentPayment = null;
    renderPlansScreen();
  }

  // ============================================
  // Copiar al portapapeles
  // ============================================
  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      alert('✅ Copiado al portapapeles');
    }).catch(() => {
      alert('❌ Error copiando al portapapeles');
    });
  }

  // ============================================
  // Loading helpers
  // ============================================
  function showLoading(message) {
    let loader = document.getElementById('plansLoader');
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'plansLoader';
      loader.className = 'plans-loader';
      loader.innerHTML = `
        <div class="plans-loader-spinner"></div>
        <div class="plans-loader-message"></div>
      `;
      document.body.appendChild(loader);
    }
    
    loader.querySelector('.plans-loader-message').textContent = message;
    loader.style.display = 'flex';
  }

  function hideLoading() {
    const loader = document.getElementById('plansLoader');
    if (loader) {
      loader.style.display = 'none';
    }
  }

  // ============================================
  // Exponer API global
  // ============================================
  window.APPIPlans = {
    init,
    selectPlan,
    checkPaymentStatus,
    showRenewalOptions,
    goBackToPlans,
    copyToClipboard
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
