// APPI · Popup sutil de compromiso de pago (días 12 y 22)
// El admin elige 12 o 22 por usuario; el usuario ve un popup sutil 2 días antes y el mismo día
// v1.0 - 2026-09-14

(function(){
  'use strict';

  function getDiaPago(){
    try{
      const p = window.APPIAuth && window.APPIAuth.currentProfile ? window.APPIAuth.currentProfile() : null;
      if(!p) return null;
      if(p.rol === 'admin') return null;
      const d = Number(p.dia_pago);
      if(d===12 || d===22) return d;
      return null;
    }catch(e){ return null; }
  }

  function debeMostrarHoy(diaPago){
    const hoy = new Date();
    const diaHoy = hoy.getDate();
    // Mostrar 2 días antes + el mismo día: 10,11,12 para 12 y 20,21,22 para 22
    const diasMostrar = diaPago===12 ? [10,11,12] : [20,21,22];
    return diasMostrar.includes(diaHoy);
  }

  function yaVistoHoy(userId, diaPago){
    const hoyStr = new Date().toISOString().slice(0,10);
    const key = `appi_compromiso_${userId}_${hoyStr}_${diaPago}`;
    return localStorage.getItem(key) === '1';
  }

  function marcarVistoHoy(userId, diaPago){
    const hoyStr = new Date().toISOString().slice(0,10);
    const key = `appi_compromiso_${userId}_${hoyStr}_${diaPago}`;
    localStorage.setItem(key, '1');
  }

  function crearPopup(diaPago){
    // Si ya existe, no duplicar
    if(document.getElementById('popupCompromisoPago')) return;
    
    const overlay = document.createElement('div');
    overlay.id = 'popupCompromisoPago';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9998;background:rgba(21,22,37,.18);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;transition:opacity .25s';
    
    const esAntes = new Date().getDate() < diaPago;
    const titulo = esAntes ? 'Recordatorio de compromiso' : 'Hoy es tu compromiso de pago';
    const texto = diaPago===12
      ? (esAntes ? 'Tu compromiso de pago es el <b>día 12</b> de cada mes. Te avisamos 2 días antes para que lo tengas presente.' : 'Hoy <b>12</b> es tu día de compromiso de pago con APPI.')
      : (esAntes ? 'Tu compromiso de pago es el <b>día 22</b> de cada mes. Te avisamos 2 días antes para que lo tengas presente.' : 'Hoy <b>22</b> es tu día de compromiso de pago con APPI.');
    
    const card = document.createElement('div');
    card.style.cssText = 'width:min(100%,380px);background:rgba(255,255,255,.98);border-radius:22px;box-shadow:0 18px 50px rgba(24,26,55,.18);padding:22px 20px 18px;text-align:center;transform:translateY(10px) scale(.98);transition:transform .28s cubic-bezier(.34,1.56,.64,1)';
    
    card.innerHTML = `
      <div style="width:52px;height:52px;margin:0 auto 12px;border-radius:16px;background:linear-gradient(135deg,#0b5878,#3ad0a4);display:grid;place-items:center;color:#fff;font-size:22px;box-shadow:0 8px 18px rgba(91,112,210,.25)">💳</div>
      <h3 style="margin:0 0 8px;font-size:18px;color:#252633;line-height:1.2">${titulo}</h3>
      <p style="margin:0 0 14px;color:#5c5c66;font-size:13.5px;line-height:1.45">${texto}<br><span style="color:#8e8e93;font-size:12px">Día <b>${diaPago}</b> de cada mes · APPI</span></p>
      <div style="display:flex;gap:10px;margin-top:14px">
        <button id="btnCompromisoEntendido" style="flex:1;min-height:44px;border-radius:12px;border:0;background:linear-gradient(135deg,#0b5878,#3ad0a4);color:#fff;font-weight:800;font-size:14px;cursor:pointer;box-shadow:0 8px 18px rgba(91,112,210,.22)">Entendido</button>
      </div>
      <div style="margin-top:10px;color:#9a9aab;font-size:11px">Te volverá a aparecer mañana si sigue dentro del aviso</div>
    `;
    
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    
    // Animar entrada
    requestAnimationFrame(()=>{
      overlay.style.opacity='1';
      card.style.transform='translateY(0) scale(1)';
    });
    
    function cerrar(){
      overlay.style.opacity='0';
      card.style.transform='translateY(8px) scale(.98)';
      setTimeout(()=>overlay.remove(), 260);
    }
    
    // Cerrar al tocar Entendido o el fondo
    card.querySelector('#btnCompromisoEntendido').onclick = ()=>{
      const p = window.APPIAuth && window.APPIAuth.currentProfile ? window.APPIAuth.currentProfile() : null;
      const uid = p && p.user_id ? p.user_id : 'anon';
      marcarVistoHoy(uid, diaPago);
      cerrar();
    };
    overlay.onclick = (e)=>{
      if(e.target===overlay){
        const p = window.APPIAuth && window.APPIAuth.currentProfile ? window.APPIAuth.currentProfile() : null;
        const uid = p && p.user_id ? p.user_id : 'anon';
        marcarVistoHoy(uid, diaPago);
        cerrar();
      }
    };
    // Cerrar con Escape
    const esc = (e)=>{ if(e.key==='Escape'){ document.removeEventListener('keydown', esc); const p2 = window.APPIAuth && window.APPIAuth.currentProfile ? window.APPIAuth.currentProfile() : null; const uid2 = p2 && p2.user_id ? p2.user_id : 'anon'; marcarVistoHoy(uid2, diaPago); cerrar(); } };
    document.addEventListener('keydown', esc, {once:true});
  }

  function intentarMostrar(){
    const diaPago = getDiaPago();
    if(!diaPago) return;
    if(!debeMostrarHoy(diaPago)) return;
    const p = window.APPIAuth && window.APPIAuth.currentProfile ? window.APPIAuth.currentProfile() : null;
    if(!p || !p.user_id) return;
    if(yaVistoHoy(p.user_id, diaPago)) return;
    // No mostrar si hay otro modal importante abierto (ej: PSA, login)
    if(document.querySelector('.modal-overlay:not([hidden])') || document.querySelector('#forcedPasswordOverlay:not([hidden])')) {
      // Reintentar en 4s
      setTimeout(intentarMostrar, 4000);
      return;
    }
    crearPopup(diaPago);
  }

  // Exponer para debug y para que el admin pueda previsualizar
  window.APPICompromisoPago = {
    debeMostrarHoy,
    getDiaPago,
    mostrar: crearPopup,
    intentarMostrar
  };

  // Intentar mostrar al cargar y cada vez que se abre la app
  function init(){
    // Esperar a que el perfil esté cargado
    let intentos = 0;
    const timer = setInterval(()=>{
      intentos++;
      const p = window.APPIAuth && window.APPIAuth.currentProfile ? window.APPIAuth.currentProfile() : null;
      if(p && p.dia_pago){
        clearInterval(timer);
        setTimeout(intentarMostrar, 1200);
      }
      if(intentos>20) clearInterval(timer); // 10s max
    }, 500);
    // También intentar al volver a la pestaña
    document.addEventListener('visibilitychange', ()=>{
      if(!document.hidden) setTimeout(intentarMostrar, 800);
    });
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{
    init();
  }
})();
