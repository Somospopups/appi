/* ============================================
   APPI · Panel de Administración de Membresías
   ============================================ */

(function(){
  'use strict';

  console.log('🔍 membership-admin.js cargado');

  // ============================================
  // Helper para hacer requests a Supabase
  // ============================================
  async function supabaseRequest(endpoint, options = {}) {
    const url = `${window.APPI_AUTH.url}/rest/v1/${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'apikey': window.APPI_AUTH.anonKey,
      'Authorization': `Bearer ${window.APPI_AUTH.anonKey}`,
      'Prefer': 'return=representation',
      ...options.headers
    };

    console.log(`🔍 Request: ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error ${response.status}:`, errorText);
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ Response:`, data);
    return data;
  }

  // ============================================
  // Cargar estadísticas de ganancias
  // ============================================
  async function loadRevenueStats() {
    try {
      console.log('🔍 Cargando estadísticas de ganancias...');
      
      // Obtener todos los pagos
      const payments = await supabaseRequest('membership_payments?select=amount,payment_date');
      
      // Calcular estadísticas
      const totalRevenue = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyRevenue = payments
        .filter(p => new Date(p.payment_date) >= startOfMonth)
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);
      
      // Obtener membresías
      const memberships = await supabaseRequest('user_memberships?select=status');
      
      const activeUsers = memberships.filter(m => m.status === 'active').length;
      const gracePeriodUsers = memberships.filter(m => m.status === 'grace_period').length;
      const expiredUsers = memberships.filter(m => m.status === 'expired').length;
      
      const stats = {
        totalRevenue,
        monthlyRevenue,
        activeUsers,
        gracePeriodUsers,
        expiredUsers
      };
      
      console.log('✅ Estadísticas cargadas:', stats);
      return stats;
      
    } catch (error) {
      console.error('❌ Error cargando estadísticas:', error);
      return null;
    }
  }

  // ============================================
  // Renderizar panel de estadísticas
  // ============================================
  async function renderRevenuePanel() {
    const container = document.getElementById('revenueStatsContainer');
    if (!container) return;

    container.innerHTML = '<div class="loading">Cargando estadísticas...</div>';
    
    const stats = await loadRevenueStats();
    
    if (!stats) {
      container.innerHTML = '<div class="error">Error cargando estadísticas</div>';
      return;
    }

    container.innerHTML = `
      <div class="revenue-stats">
        <h2>💰 Estadísticas de Ganancias</h2>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Ganancias Totales</div>
            <div class="stat-value">$${stats.totalRevenue.toLocaleString('es-AR')}</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-label">Ganancias del Mes</div>
            <div class="stat-value">$${stats.monthlyRevenue.toLocaleString('es-AR')}</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-label">Usuarios Activos</div>
            <div class="stat-value">${stats.activeUsers}</div>
          </div>
          
          <div class="stat-card warning">
            <div class="stat-label">En Prórroga</div>
            <div class="stat-value">${stats.gracePeriodUsers}</div>
          </div>
          
          <div class="stat-card danger">
            <div class="stat-label">Vencidos</div>
            <div class="stat-value">${stats.expiredUsers}</div>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================
  // Crear membresía para nuevo usuario
  // ============================================
  async function createMembershipForUser(userId, monthlyFee = 5000) {
    try {
      console.log(`🔍 Creando membresía para usuario ${userId}...`);
      
      const now = new Date();
      const expiresAt = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      
      const membership = {
        user_id: userId,
        status: 'active',
        starts_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        monthly_fee: monthlyFee
      };
      
      const result = await supabaseRequest('user_memberships', {
        method: 'POST',
        body: JSON.stringify(membership)
      });
      
      console.log('✅ Membresía creada:', result);
      return result[0];
      
    } catch (error) {
      console.error('❌ Error creando membresía:', error);
      return null;
    }
  }

  // ============================================
  // Configurar prórroga
  // ============================================
  async function setGracePeriod(userId, gracePeriodUntil, notes) {
    try {
      console.log(`🔍 Configurando prórroga para usuario ${userId}...`);
      
      const update = {
        status: 'grace_period',
        grace_period_until: gracePeriodUntil,
        grace_period_notes: notes
      };
      
      const result = await supabaseRequest(`user_memberships?user_id=eq.${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(update)
      });
      
      console.log('✅ Prórroga configurada:', result);
      return result[0];
      
    } catch (error) {
      console.error('❌ Error configurando prórroga:', error);
      return null;
    }
  }

  // ============================================
  // Registrar pago
  // ============================================
  async function registerPayment(userId, amount, paymentMethod, notes) {
    try {
      console.log(`🔍 Registrando pago para usuario ${userId}...`);
      
      // Obtener membresía actual
      const memberships = await supabaseRequest(`user_memberships?user_id=eq.${userId}&select=id`);
      if (!memberships || memberships.length === 0) {
        throw new Error('No se encontró membresía para el usuario');
      }
      
      const membershipId = memberships[0].id;
      
      // Registrar pago
      const payment = {
        user_id: userId,
        membership_id: membershipId,
        amount: amount,
        payment_method: paymentMethod,
        notes: notes
      };
      
      const paymentResult = await supabaseRequest('membership_payments', {
        method: 'POST',
        body: JSON.stringify(payment)
      });
      
      // Actualizar membresía a activa y extender fecha
      const now = new Date();
      const expiresAt = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      
      const membershipUpdate = {
        status: 'active',
        starts_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        grace_period_until: null,
        grace_period_notes: null
      };
      
      await supabaseRequest(`user_memberships?user_id=eq.${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(membershipUpdate)
      });
      
      console.log('✅ Pago registrado:', paymentResult);
      return paymentResult[0];
      
    } catch (error) {
      console.error('❌ Error registrando pago:', error);
      return null;
    }
  }

  // ============================================
  // Mostrar modal de prórroga
  // ============================================
  function showGracePeriodModal(userId, userName) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal grace-period-modal">
        <div class="modal-header">
          <h2>📅 Configurar Prórroga</h2>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        
        <div class="modal-body">
          <p>Configurar prórroga de pago para <strong>${userName}</strong></p>
          
          <div class="form-group">
            <label>Fecha límite de prórroga:</label>
            <input type="date" id="gracePeriodDate" class="form-input" />
          </div>
          
          <div class="form-group">
            <label>Notas del acuerdo:</label>
            <textarea id="gracePeriodNotes" class="form-input" rows="3" placeholder="Ej: Acordó pagar el 15/09"></textarea>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
          <button class="btn btn-primary" id="btnSaveGracePeriod">Guardar Prórroga</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Configurar fecha mínima (hoy)
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('gracePeriodDate').min = today;
    
    // Event listener para guardar
    document.getElementById('btnSaveGracePeriod').onclick = async () => {
      const date = document.getElementById('gracePeriodDate').value;
      const notes = document.getElementById('gracePeriodNotes').value;
      
      if (!date) {
        alert('Por favor seleccioná una fecha');
        return;
      }
      
      const result = await setGracePeriod(userId, date, notes);
      
      if (result) {
        alert('✅ Prórroga configurada correctamente');
        modal.remove();
        renderRevenuePanel(); // Actualizar estadísticas
      } else {
        alert('❌ Error configurando prórroga');
      }
    };
  }

  // ============================================
  // Mostrar modal de pago
  // ============================================
  function showPaymentModal(userId, userName) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal payment-modal">
        <div class="modal-header">
          <h2>💳 Registrar Pago</h2>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        
        <div class="modal-body">
          <p>Registrar pago de <strong>${userName}</strong></p>
          
          <div class="form-group">
            <label>Monto ($):</label>
            <input type="number" id="paymentAmount" class="form-input" value="5000" min="0" step="100" />
          </div>
          
          <div class="form-group">
            <label>Método de pago:</label>
            <select id="paymentMethod" class="form-input">
              <option value="transferencia">Transferencia</option>
              <option value="efectivo">Efectivo</option>
              <option value="mercadopago">Mercado Pago</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Notas:</label>
            <textarea id="paymentNotes" class="form-input" rows="2" placeholder="Notas opcionales"></textarea>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
          <button class="btn btn-primary" id="btnSavePayment">Registrar Pago</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listener para guardar
    document.getElementById('btnSavePayment').onclick = async () => {
      const amount = parseFloat(document.getElementById('paymentAmount').value);
      const method = document.getElementById('paymentMethod').value;
      const notes = document.getElementById('paymentNotes').value;
      
      if (!amount || amount <= 0) {
        alert('Por favor ingresá un monto válido');
        return;
      }
      
      const result = await registerPayment(userId, amount, method, notes);
      
      if (result) {
        alert('✅ Pago registrado correctamente');
        modal.remove();
        renderRevenuePanel(); // Actualizar estadísticas
      } else {
        alert('❌ Error registrando pago');
      }
    };
  }

  // ============================================
  // Exponer funciones globales
  // ============================================
  window.APPIAdminMembership = {
    renderRevenuePanel,
    createMembershipForUser,
    showGracePeriodModal,
    showPaymentModal
  };

  // ============================================
  // Inicializar cuando el DOM esté listo
  // ============================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('🔍 DOM listo, inicializando membership-admin');
    });
  }

})();
