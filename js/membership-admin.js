/* ============================================
   APPI · Panel de Administración de Membresías
   Todas las escrituras pasan por la Edge Function administradora.
   Nunca se usa la anon key como si fuera una sesión de administrador.
   ============================================ */
(function(){
  'use strict';

  const $=id=>document.getElementById(id);
  const esc=value=>String(value==null?'':value).replace(/[&<>"']/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[char]));

  function config(){
    return window.APPIAuth&&window.APPIAuth.config?window.APPIAuth.config():(window.APPI_AUTH||{});
  }

  async function callAdmin(body,retry=true){
    const cfg=config();
    const token=window.APPIAuth&&window.APPIAuth.accessToken?window.APPIAuth.accessToken():'';
    if(!cfg.url||!cfg.anonKey||!token)throw new Error('La sesión administradora no está disponible.');
    let response;
    try{
      response=await fetch(String(cfg.url).replace(/\/$/,'')+'/functions/v1/admin-distribuidores',{
        method:'POST',
        cache:'no-store',
        headers:{apikey:cfg.anonKey,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
        body:JSON.stringify(body||{})
      });
    }catch(error){
      throw new Error('No se pudo conectar con la administración de membresías.');
    }
    if(response.status===401&&retry&&window.APPIAuth&&window.APPIAuth.refresh){
      await window.APPIAuth.refresh();
      return callAdmin(body,false);
    }
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||'No se pudo completar la operación.');
    return data;
  }

  function money(value){
    if(window.APPIAdminPanel&&typeof window.APPIAdminPanel.money==='function') return window.APPIAdminPanel.money(value);
    return '$'+Number(value||0).toLocaleString('es-AR',{maximumFractionDigits:2});
  }

  async function loadRevenueStats(){
    const data=await callAdmin({action:'membership_stats'});
    return {
      totalRevenue:Number(data.total_revenue)||0,
      monthlyRevenue:Number(data.monthly_revenue)||0,
      activeUsers:Number(data.active_users)||0,
      gracePeriodUsers:Number(data.grace_period_users)||0,
      expiredUsers:Number(data.expired_users)||0
    };
  }

  async function renderRevenuePanel(){
    const container=$('revenueStatsContainer');
    if(!container)return;
    container.innerHTML='<div class="loading">Cargando estadísticas…</div>';
    try{
      const stats=await loadRevenueStats();
      container.innerHTML=`
        <div class="revenue-stats">
          <h2>💰 Estadísticas de membresías</h2>
          <div class="stats-grid">
            <div class="stat-card"><div class="stat-label">Ingresos registrados</div><div class="stat-value">${money(stats.totalRevenue)}</div></div>
            <div class="stat-card"><div class="stat-label">Ingresos del mes</div><div class="stat-value">${money(stats.monthlyRevenue)}</div></div>
            <div class="stat-card"><div class="stat-label">Usuarios activos</div><div class="stat-value">${stats.activeUsers}</div></div>
            <div class="stat-card warning"><div class="stat-label">En prórroga</div><div class="stat-value">${stats.gracePeriodUsers}</div></div>
            <div class="stat-card"><div class="stat-label">🧪 En prueba</div><div class="stat-value">${typeof window.__appiPruebasCount==='number'?window.__appiPruebasCount:'—'}</div></div>
            <div class="stat-card danger"><div class="stat-label">Vencidos</div><div class="stat-value">${stats.expiredUsers}</div></div>
          </div>
        </div>`;
    }catch(error){
      container.innerHTML=`<div class="error">${esc(error.message)}</div>`;
    }
  }

  async function createMembershipForUser(userId,monthlyFee=5000){
    const data=await callAdmin({action:'ensure_membership',user_id:userId,monthly_fee:Number(monthlyFee)||5000});
    return data.membership||null;
  }

  async function setGracePeriod(userId,gracePeriodUntil,notes=''){
    const data=await callAdmin({
      action:'set_grace_period',
      user_id:userId,
      grace_period_until:gracePeriodUntil,
      notes:String(notes||'').trim().slice(0,1000)
    });
    return data.membership||null;
  }

  async function registerPayment(userId,amount,paymentMethod,notes=''){
    const data=await callAdmin({
      action:'register_membership_payment',
      user_id:userId,
      amount:Number(amount),
      payment_method:String(paymentMethod||''),
      notes:String(notes||'').trim().slice(0,1000)
    });
    return data;
  }

  function closeModal(modal){if(modal&&modal.remove)modal.remove()}

  function showGracePeriodModal(userId,userName){
    const modal=document.createElement('div');
    modal.className='modal-overlay membership-modal-overlay';
    modal.innerHTML=`
      <div class="modal grace-period-modal" role="dialog" aria-modal="true" aria-labelledby="membershipGraceTitle">
        <div class="modal-header"><h2 id="membershipGraceTitle">📅 Configurar prórroga</h2><button type="button" class="modal-close" aria-label="Cerrar">×</button></div>
        <div class="modal-body">
          <p>Configurar prórroga de pago para <strong>${esc(userName)}</strong></p>
          <div class="form-group"><label for="gracePeriodDate">Fecha límite de prórroga</label><input type="date" id="gracePeriodDate" class="form-input"></div>
          <div class="form-group"><label for="gracePeriodNotes">Notas del acuerdo</label><textarea id="gracePeriodNotes" class="form-input" rows="3" maxlength="1000" placeholder="Ej: Acordó pagar el 15/09"></textarea></div>
          <div class="admin-inline-status" id="gracePeriodStatus" role="status"></div>
        </div>
        <div class="modal-footer"><button type="button" class="btn btn-secondary" data-membership-cancel>Cancelar</button><button type="button" class="btn btn-primary" id="btnSaveGracePeriod">Guardar prórroga</button></div>
      </div>`;
    document.body.appendChild(modal);
    const date=$('gracePeriodDate');
    date.min=new Date().toISOString().slice(0,10);
    const suggested=new Date();suggested.setDate(suggested.getDate()+7);date.value=suggested.toISOString().slice(0,10);
    modal.querySelector('.modal-close').onclick=()=>closeModal(modal);
    modal.querySelector('[data-membership-cancel]').onclick=()=>closeModal(modal);
    $('btnSaveGracePeriod').onclick=async()=>{
      const button=$('btnSaveGracePeriod'),status=$('gracePeriodStatus');
      if(!date.value){status.textContent='Seleccioná una fecha.';status.className='admin-inline-status show error';date.focus();return}
      button.disabled=true;button.textContent='Guardando…';status.className='admin-inline-status';status.textContent='';
      try{
        await setGracePeriod(userId,date.value,$('gracePeriodNotes').value);
        closeModal(modal);
        await renderRevenuePanel();
        if(window.APPIAdminPanel&&window.APPIAdminPanel.load)await window.APPIAdminPanel.load();
        if(typeof window.showToast==='function')window.showToast('Prórroga actualizada ✓',2200);
      }catch(error){status.textContent=error.message;status.className='admin-inline-status show error';button.disabled=false;button.textContent='Guardar prórroga'}
    };
  }

  function showPaymentModal(userId,userName){
    const modal=document.createElement('div');
    modal.className='modal-overlay membership-modal-overlay';
    modal.innerHTML=`
      <div class="modal payment-modal" role="dialog" aria-modal="true" aria-labelledby="membershipPaymentTitle">
        <div class="modal-header"><h2 id="membershipPaymentTitle">💳 Registrar pago</h2><button type="button" class="modal-close" aria-label="Cerrar">×</button></div>
        <div class="modal-body">
          <p>Registrar pago de <strong>${esc(userName)}</strong></p>
          <div class="form-group"><label for="paymentAmount">Monto ($)</label><input type="number" id="paymentAmount" class="form-input" value="5000" min="1" max="1000000000" step="100"></div>
          <div class="form-group"><label for="paymentMethod">Método de pago</label><select id="paymentMethod" class="form-input"><option value="transferencia">Transferencia</option><option value="efectivo">Efectivo</option><option value="mercadopago">Mercado Pago</option><option value="otro">Otro</option></select></div>
          <div class="form-group"><label for="paymentNotes">Notas</label><textarea id="paymentNotes" class="form-input" rows="2" maxlength="1000" placeholder="Notas opcionales"></textarea></div>
          <div class="admin-inline-status" id="paymentStatus" role="status"></div>
        </div>
        <div class="modal-footer"><button type="button" class="btn btn-secondary" data-membership-cancel>Cancelar</button><button type="button" class="btn btn-primary" id="btnSavePayment">Registrar pago</button></div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector('.modal-close').onclick=()=>closeModal(modal);
    modal.querySelector('[data-membership-cancel]').onclick=()=>closeModal(modal);
    $('btnSavePayment').onclick=async()=>{
      const amount=Number($('paymentAmount').value),button=$('btnSavePayment'),status=$('paymentStatus');
      if(!Number.isFinite(amount)||amount<=0){status.textContent='Ingresá un monto válido.';status.className='admin-inline-status show error';$('paymentAmount').focus();return}
      button.disabled=true;button.textContent='Registrando…';status.className='admin-inline-status';status.textContent='';
      try{
        await registerPayment(userId,amount,$('paymentMethod').value,$('paymentNotes').value);
        closeModal(modal);
        await renderRevenuePanel();
        if(window.APPIAdminPanel&&window.APPIAdminPanel.load)await window.APPIAdminPanel.load();
        if(typeof window.showToast==='function')window.showToast('Pago registrado y membresía extendida ✓',2600);
      }catch(error){status.textContent=error.message;status.className='admin-inline-status show error';button.disabled=false;button.textContent='Registrar pago'}
    };
  }

  window.APPIAdminMembership={
    renderRevenuePanel,
    loadRevenueStats,
    createMembershipForUser,
    setGracePeriod,
    registerPayment,
    showGracePeriodModal,
    showPaymentModal
  };
})();
