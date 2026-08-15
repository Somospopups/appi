(function(){
'use strict';

const $=id=>document.getElementById(id);
const esc=value=>String(value==null?'':value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state={devices:[],loading:false,lastError:'',overlay:null,pairTimer:null,managerVersion:0,initialized:false};
const DEVICE_KEY='appi_bridge_device_key_v1';

function config(){return window.APPIAuth&&window.APPIAuth.config?window.APPIAuth.config():window.APPI_AUTH||{}}
function authorized(){return !!(window.APPIAuth&&window.APPIAuth.isEnabled&&window.APPIAuth.isEnabled()&&window.APPIAuth.isLocallyAuthorized&&window.APPIAuth.isLocallyAuthorized()&&window.APPIAuth.userId())}
function accessToken(){return window.APPIAuth&&window.APPIAuth.accessToken?window.APPIAuth.accessToken():''}
function deviceKey(){let value=localStorage.getItem(DEVICE_KEY)||'';if(!/^[0-9a-f-]{36}$/i.test(value)){value=crypto.randomUUID?crypto.randomUUID():`${Date.now().toString(16).padStart(8,'0')}-4000-8000-${Math.random().toString(16).slice(2,14).padEnd(12,'0')}`;localStorage.setItem(DEVICE_KEY,value)}return value}
function platform(){const ua=navigator.userAgent||'';if(/Android/i.test(ua))return'android';if(/iPhone|iPod|iPad/i.test(ua))return'ios';return'otro'}
function isPhone(){const ua=navigator.userAgent||'';return /iPhone|iPod/i.test(ua)||(/Android/i.test(ua)&&/Mobile/i.test(ua))}
function isIOSStandalone(){return platform()!=='ios'||window.navigator.standalone===true||window.matchMedia('(display-mode: standalone)').matches}
function defaultDeviceName(){return platform()==='ios'?'Mi iPhone':platform()==='android'?'Mi teléfono Android':'Mi teléfono'}
function functionUrl(){return String(config().url||'').replace(/\/$/,'')+'/functions/v1/dispositivo-puente'}
function readJson(text){try{return text?JSON.parse(text):{}}catch(e){return {}}}
async function callBridge(body,retry=true){
  if(!authorized())throw new Error('Iniciá sesión para continuar.');
  let response;try{response=await fetch(functionUrl(),{method:'POST',cache:'no-store',headers:{apikey:config().anonKey,Authorization:`Bearer ${accessToken()}`,'Content-Type':'application/json'},body:JSON.stringify(body)})}catch(e){const error=new Error('No pudimos conectar con el teléfono. Revisá internet.');error.network=true;throw error}
  if(response.status===401&&retry&&window.APPIAuth&&window.APPIAuth.refresh){await window.APPIAuth.refresh();return callBridge(body,false)}
  const text=await response.text(),data=readJson(text);if(!response.ok)throw new Error(data.error||data.message||`Error ${response.status}`);return data
}
function installStyles(){if($('appiDeviceBridgeStyles'))return;const style=document.createElement('style');style.id='appiDeviceBridgeStyles';style.textContent=`
.appi-device-overlay{position:fixed;inset:0;z-index:29000;display:flex;align-items:center;justify-content:center;padding:15px;background:rgba(20,22,38,.56);backdrop-filter:blur(11px)}
.appi-device-overlay[hidden]{display:none!important}
.appi-device-card{width:min(100%,640px);max-height:min(94vh,820px);overflow-y:auto;padding:20px;border-radius:26px;background:linear-gradient(150deg,#eff5ff,#faf8ff 58%,#eef9f6);box-shadow:0 28px 90px rgba(24,27,61,.38);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#292938}
.appi-device-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:16px}
.appi-device-head h2{margin:0;font-size:24px;line-height:1.15}
.appi-device-head p{margin:6px 0 0;color:#666776;font-size:14px;line-height:1.45}
.appi-device-close{width:42px;height:42px;flex:0 0 42px;border:0;border-radius:13px;background:rgba(80,90,130,.09);color:#5d5e6c;font-size:24px;cursor:pointer}
.appi-device-close:focus-visible,.appi-device-btn:focus-visible,.appi-device-remove:focus-visible,.appi-device-refresh:focus-visible{outline:3px solid rgba(61,99,201,.35);outline-offset:2px}
.appi-device-hero{padding:17px;border-radius:20px;color:#fff;background:linear-gradient(135deg,#4d78dd,#785bd9 65%,#a06bff);box-shadow:0 12px 28px rgba(76,82,184,.2);margin-bottom:12px}
.appi-device-hero b{display:block;font-size:17px}.appi-device-hero p{margin:6px 0 0;font-size:13px;line-height:1.45;opacity:.9}
.appi-device-actions{display:grid;grid-template-columns:1fr;gap:8px;margin:8px 0 13px}
.appi-device-btn{min-height:48px;border:0;border-radius:14px;padding:11px 14px;font:inherit;font-size:14px;font-weight:850;cursor:pointer}
.appi-device-btn.primary{color:#fff;background:linear-gradient(135deg,#5b8def,#875fdd);box-shadow:0 8px 20px rgba(91,112,210,.24)}
.appi-device-btn.secondary{color:#3d63c9;background:rgba(91,141,239,.1)}
.appi-device-btn.success{min-height:58px;color:#fff;background:linear-gradient(135deg,#159d77,#397ed7);box-shadow:0 11px 25px rgba(35,137,139,.28);font-size:17px;letter-spacing:.1px}
.appi-device-btn.danger{color:#bd4149;background:rgba(217,83,89,.09)}
.appi-device-btn:disabled{opacity:.48;box-shadow:none}
.appi-pair-box{padding:17px;border-radius:21px;background:rgba(255,255,255,.76);border:1px solid rgba(255,255,255,.9);text-align:center;box-shadow:0 8px 24px rgba(50,58,100,.07)}
.appi-pair-loading{display:grid;place-items:center;min-height:210px;color:#666776;font-size:14px;font-weight:750}
.appi-pair-kicker{display:inline-block;margin-bottom:7px;padding:5px 9px;border-radius:999px;color:#3d63c9;background:rgba(91,141,239,.11);font-size:11px;font-weight:900;letter-spacing:.5px}
.appi-pair-title{max-width:390px;margin:0 auto 11px;font-size:18px;font-weight:850;line-height:1.3}
.appi-pair-content{display:grid;grid-template-columns:180px minmax(0,1fr);align-items:center;gap:22px;max-width:520px;margin:0 auto}.appi-pair-details{min-width:0}.appi-pair-qr{width:180px;margin:0 auto}
.appi-pair-qr svg{display:block;width:100%;height:auto;border-radius:13px;background:#fff}
.appi-pair-code-label{margin-top:0;color:#666776;font-size:13px;font-weight:700}
.appi-pair-code{margin:5px 0 4px;color:#315dbd;font-size:34px;line-height:1.1;font-weight:950;letter-spacing:6px;font-variant-numeric:tabular-nums}
.appi-pair-expire{color:#777887;font-size:12px}
.appi-main-prompt{margin:12px 2px 0;text-align:center}
.appi-main-prompt .appi-pair-kicker{display:inline-block;margin-bottom:6px}
.appi-main-prompt b{display:block;font-size:15px;line-height:1.35}
.appi-main-prompt span{display:block;margin-top:4px;color:#666776;font-size:12.5px;line-height:1.4}
.appi-device-list{display:grid;gap:9px}
.appi-device-list-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:14px 2px 8px}
.appi-device-list-head b{font-size:15px}
.appi-device-auto{color:#667085;font-size:11px;font-weight:750}
.appi-device-refresh{border:0;border-radius:10px;padding:8px 11px;background:rgba(91,141,239,.1);color:#3d63c9;font:inherit;font-size:12px;font-weight:850;cursor:pointer}
.appi-device-item{display:grid;grid-template-columns:46px minmax(0,1fr) auto;gap:8px 11px;align-items:center;padding:12px;border-radius:18px;background:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.88)}
.appi-device-icon{width:42px;height:42px;grid-row:1 / span 2;border-radius:14px;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,#3ad0a4,#5b8def);font-size:20px}
.appi-device-item b{display:block;font-size:14px;line-height:1.25}
.appi-device-item small{display:block;margin-top:4px;color:#6e7080;font-size:11px;line-height:1.35}
.appi-device-state{padding:6px 9px;border-radius:999px;background:rgba(58,208,164,.12);color:#207659;font-size:10px;font-weight:900;white-space:nowrap}
.appi-device-state.off{background:rgba(217,83,89,.09);color:#a83d45}
.appi-device-remove{grid-column:2 / -1;justify-self:start;min-height:36px;width:auto;border:0;padding:7px 2px;background:transparent;color:#ad3942;font:inherit;font-size:13px;font-weight:800;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.appi-device-remove:disabled,.appi-device-refresh:disabled{opacity:.5;cursor:wait}
.appi-device-error{padding:14px;border-radius:14px;background:rgba(217,83,89,.08);border:1px solid rgba(217,83,89,.16);color:#a83d45;font-size:13px;line-height:1.45;text-align:center}
.appi-device-field{display:grid;gap:6px;margin:11px 0}.appi-device-field label{color:#666776;font-size:12px;font-weight:900;text-transform:uppercase}.appi-device-field input{width:100%;min-height:48px;border:1px solid rgba(80,90,130,.14);border-radius:13px;background:rgba(255,255,255,.78);padding:10px 12px;color:#292938;font:inherit;font-size:16px;outline:none}.appi-device-field input:focus{border-color:#5b8def;box-shadow:0 0 0 3px rgba(91,141,239,.1)}
.appi-device-note{padding:10px 12px;border-radius:14px;background:rgba(245,179,1,.08);border:1px solid rgba(245,179,1,.17);color:#71561d;font-size:12px;line-height:1.45;margin-top:9px}
.appi-device-status{min-height:21px;margin-top:10px;color:#5f6170;font-size:13px;font-weight:750;text-align:center}
.appi-device-status.success{color:#177656;font-weight:900}
.appi-call-request{text-align:center}.appi-call-icon{width:78px;height:78px;margin:4px auto 12px;border-radius:25px;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,#25d366,#128c7e);font-size:34px;box-shadow:0 14px 34px rgba(18,140,126,.25)}.appi-call-request h2{margin:0 0 6px;font-size:22px}.appi-call-number{margin:9px 0 17px;color:#3d63c9;font-size:18px;font-weight:900}.appi-call-actions{display:grid;grid-template-columns:1.4fr 1fr;gap:8px}.appi-call-actions a,.appi-call-actions button{min-height:50px;border:0;border-radius:14px;display:flex;align-items:center;justify-content:center;text-decoration:none;font:inherit;font-size:12px;font-weight:900}.appi-call-actions a{color:#fff;background:linear-gradient(135deg,#25d366,#128c7e)}.appi-call-actions button{color:#666776;background:rgba(80,90,130,.08)}
body.dark .appi-device-card{background:linear-gradient(150deg,#171827,#25213a 58%,#162b2a);color:#f0f0f5}body.dark .appi-device-item,body.dark .appi-pair-box{background:rgba(30,30,50,.72);border-color:rgba(255,255,255,.08)}body.dark .appi-device-field input{background:#1d1f31;color:#f0f0f5;border-color:rgba(255,255,255,.1)}body.dark .appi-main-prompt span,body.dark .appi-device-head p,body.dark .appi-pair-code-label,body.dark .appi-device-auto{color:#bbbcca}
@media(max-width:480px){.appi-device-overlay{padding:8px}.appi-device-card{padding:17px;border-radius:21px;max-height:96vh}.appi-device-head{margin-bottom:13px}.appi-device-head h2{font-size:21px}.appi-device-head p{font-size:12.5px}.appi-device-close{width:40px;height:40px;flex-basis:40px}.appi-pair-box{padding:15px}.appi-pair-loading{min-height:220px}.appi-pair-content{grid-template-columns:1fr;gap:12px}.appi-pair-qr{width:min(100%,210px)}.appi-pair-title{font-size:16px}.appi-pair-code{font-size:31px;letter-spacing:5px}.appi-device-btn.success{min-height:58px;font-size:16px}.appi-call-actions{grid-template-columns:1fr}.appi-device-item{grid-template-columns:42px minmax(0,1fr)}.appi-device-icon{width:42px;height:42px}.appi-device-state{grid-column:2;justify-self:start}.appi-device-remove{grid-column:1 / -1}.appi-device-list-head{align-items:flex-end}.appi-device-auto{max-width:120px;text-align:right}}
`;document.head.appendChild(style)}
function ensureOverlay(){if(state.overlay)return state.overlay;state.overlay=document.createElement('div');state.overlay.className='appi-device-overlay';state.overlay.id='appiDeviceOverlay';state.overlay.hidden=true;state.overlay.innerHTML='<section class="appi-device-card" id="appiDeviceCard" role="dialog" aria-modal="true"></section>';document.body.appendChild(state.overlay);state.overlay.onclick=e=>{if(e.target===state.overlay)closeOverlay()};return state.overlay}
function stopPairTimer(){if(state.pairTimer){clearInterval(state.pairTimer);state.pairTimer=null}}
function openOverlay(html){stopPairTimer();state.managerVersion++;ensureOverlay();$('appiDeviceCard').innerHTML=html;state.overlay.hidden=false;document.body.style.overflow='hidden';const close=$('appiDeviceClose');if(close)close.onclick=closeOverlay;return state.managerVersion}
function closeOverlay(){stopPairTimer();state.managerVersion++;if(state.overlay)state.overlay.hidden=true;document.body.style.overflow=''}
function head(title,sub){return `<div class="appi-device-head"><div><h2>${esc(title)}</h2><p>${esc(sub)}</p></div><button type="button" class="appi-device-close" id="appiDeviceClose" aria-label="Cerrar">×</button></div>`}
function subscriptionJSON(subscription){const data=subscription.toJSON();return {endpoint:data.endpoint,keys:{p256dh:data.keys&&data.keys.p256dh||'',auth:data.keys&&data.keys.auth||''}}}
function applicationServerKey(value){const padding='='.repeat((4-value.length%4)%4),base64=(value+padding).replace(/-/g,'+').replace(/_/g,'/'),raw=atob(base64),array=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)array[i]=raw.charCodeAt(i);return array}
async function enablePush(){
  if(!('serviceWorker'in navigator)||!('PushManager'in window)||!('Notification'in window))throw new Error('Este navegador no admite notificaciones en segundo plano.');
  if(platform()==='ios'&&!isIOSStandalone())throw new Error('En iPhone, primero agregá APPI a la pantalla de inicio y abrila desde su ícono. Después ingresá el código de seis dígitos.');
  const permission=await Notification.requestPermission();if(permission!=='granted')throw new Error('Necesitamos que autorices las notificaciones para recibir llamadas desde la PC.');
  const cfg=await callBridge({action:'config'});if(!cfg.push_ready||!cfg.public_key)throw new Error('Las notificaciones del servidor todavía no están listas.');
  const registration=await navigator.serviceWorker.ready;let subscription=await registration.pushManager.getSubscription();if(!subscription)subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:applicationServerKey(cfg.public_key)});return subscriptionJSON(subscription)
}
async function loadDevices(){
  if(!authorized())return[];
  state.loading=true;state.lastError='';
  try{
    const result=await callBridge({action:'list_devices'});
    state.devices=Array.isArray(result.devices)?result.devices:[];
    decorateCallButtons();
    return state.devices;
  }catch(error){
    state.lastError=error.message||'No pudimos cargar los dispositivos vinculados.';
    return state.devices;
  }finally{state.loading=false}
}
function deviceRows(){
  if(state.loading)return '<div class="appi-device-status">Cargando teléfonos…</div>';
  if(state.lastError)return `<div class="appi-device-error">${esc(state.lastError)}<br><button type="button" class="appi-device-refresh" data-refresh-devices style="margin-top:9px">Reintentar</button></div>`;
  if(!state.devices.length)return '<div class="appi-device-note">Todavía no hay teléfonos vinculados.</div>';
  return `<div class="appi-device-list">${state.devices.map(device=>`<article class="appi-device-item" data-device-id="${esc(device.id)}"><span class="appi-device-icon">${device.plataforma==='ios'?'📱':'📲'}</span><span><b>${esc(device.nombre)}</b><small>${device.plataforma==='ios'?'iPhone':device.plataforma==='android'?'Android':'Teléfono'} · visto ${esc(new Date(device.last_seen).toLocaleString('es-AR'))}</small></span><span class="appi-device-state ${device.notificaciones?'':'off'}">${device.notificaciones?'Notificaciones activas':'Sin notificaciones'}</span><button type="button" class="appi-device-remove" data-remove-device="${esc(device.id)}">Desvincular dispositivo</button></article>`).join('')}</div>`;
}
function renderDeviceList(){const list=$('appiDeviceList');if(list)list.innerHTML=deviceRows()}
function bindManagerActions(){
  const claim=$('appiClaimCode');
  if(claim)claim.onclick=claimByCode;
  const list=$('appiDeviceList');
  if(list)list.onclick=event=>{
    const remove=event.target.closest('[data-remove-device]');
    if(remove){removeDevice(remove.dataset.removeDevice,remove);return}
    if(event.target.closest('[data-refresh-devices]'))refreshDevices();
  };
}
async function refreshDevices(){state.loading=true;renderDeviceList();await loadDevices();renderDeviceList()}
function closeAccountModal(){
  const accountModal=document.getElementById('modalOverlay');
  if(accountModal&&accountModal.classList.contains('open'))accountModal.classList.remove('open');
  document.body.style.overflow='';
}
async function openManager(){
  closeAccountModal();
  let version=openOverlay(`${head('Teléfonos vinculados','Comprobando el estado de tu cuenta…')}<div class="appi-pair-loading"><span><span class="spinner"></span><br><br>Cargando teléfono…</span></div>`);
  await loadDevices();
  if(version!==state.managerVersion)return;
  if(state.lastError){
    version=openOverlay(`${head('Teléfonos vinculados','No pudimos comprobar el estado de tu cuenta.')}<div class="appi-device-error">${esc(state.lastError)}<br><button type="button" class="appi-device-refresh" id="appiRetryManager" style="margin-top:9px">Reintentar</button></div>`);
    const retry=$('appiRetryManager');if(retry)retry.onclick=openManager;
    return;
  }
  const active=state.devices.filter(device=>device.activo!==false);
  if(active.length){
    openOverlay(`${head('Teléfono vinculado','Esta cuenta admite un solo teléfono a la vez.')}<section aria-label="Teléfono de tu cuenta"><div class="appi-device-list-head"><b>Teléfono de tu cuenta</b><span class="appi-device-auto">Actualizado</span></div><div id="appiDeviceList">${deviceRows()}</div></section><div class="appi-device-note">Para vincular otro teléfono, primero desvinculá el actual.</div>`);
    bindManagerActions();
    return;
  }
  version=openOverlay(`${head('Vincular teléfono','Conectá un teléfono para hacer llamadas desde APPI en tu PC o tablet.')}<div class="appi-pair-box" id="appiPairArea" aria-live="polite"><div class="appi-pair-loading"><span><span class="spinner"></span><br><br>Preparando el QR y el código…</span></div></div><div class="appi-main-prompt"><span class="appi-pair-kicker">OPCIÓN 2</span><b>¿Estás usando el teléfono que querés vincular?</b><span>Tocá el botón e ingresá el código que aparece en tu PC.</span></div><div class="appi-device-actions"><button type="button" class="appi-device-btn success" id="appiClaimCode" data-primary-action>Vincular este teléfono</button></div><div class="appi-device-note">Permití las notificaciones. En iPhone, abrí APPI desde el ícono de la pantalla de inicio.</div>`);
  bindManagerActions();
  await createPairing(version);
}
function pairUrl(token){const url=new URL('./',location.href);url.search='';url.hash='';url.searchParams.set('pair',token);return url.toString()}
function qrSvg(value){try{const qr=window.qrcode(0,'M');qr.addData(value);qr.make();return qr.createSvgTag({cellSize:5,margin:2,scalable:true})}catch(e){return '<div class="appi-device-note">No se pudo dibujar el QR. Usá el código de seis dígitos.</div>'}}
async function createPairing(version=state.managerVersion){
  try{
    const result=await callBridge({action:'create_pairing',source_device_key:deviceKey()}),pair=result.pairing,url=pairUrl(pair.token);
    if(version!==state.managerVersion||!state.overlay||state.overlay.hidden)return;
    const area=$('appiPairArea');if(!area)return;
    area.innerHTML=`<span class="appi-pair-kicker">OPCIÓN 1</span><div class="appi-pair-title">Escaneá este QR con el teléfono que querés vincular</div><div class="appi-pair-content"><div class="appi-pair-qr">${qrSvg(url)}</div><div class="appi-pair-details"><div class="appi-pair-code-label">O ingresá este código en el teléfono</div><div class="appi-pair-code" aria-label="Código ${esc(pair.codigo)}">${esc(pair.codigo.slice(0,3))} ${esc(pair.codigo.slice(3))}</div><div class="appi-pair-expire">El código vence en cinco minutos.</div><div class="appi-device-status" id="appiPairStatus">Esperando al teléfono…</div></div></div>`;
    let checks=0;
    state.pairTimer=setInterval(async()=>{
      if(version!==state.managerVersion){stopPairTimer();return}
      if(++checks>125){stopPairTimer();const status=$('appiPairStatus');if(status)status.textContent='El código venció. Cerrá esta pantalla y volvé a abrirla.';return}
      try{
        const pairState=await callBridge({action:'pair_status',token:pair.token});
        if(version!==state.managerVersion)return;
        if(pairState.claimed&&pairState.device){
          stopPairTimer();state.devices=[pairState.device,...state.devices.filter(d=>d.id!==pairState.device.id)];renderDeviceList();decorateCallButtons();
          const status=$('appiPairStatus');if(status){status.classList.add('success');status.textContent=`¡${pairState.device.nombre} quedó vinculado correctamente!`}
        }else if(pairState.expired){stopPairTimer();const status=$('appiPairStatus');if(status)status.textContent='El código venció. Cerrá esta pantalla y volvé a abrirla.'}
      }catch(e){}
    },2400);
  }catch(error){
    if(version!==state.managerVersion||!state.overlay||state.overlay.hidden)return;
    const area=$('appiPairArea');if(area)area.innerHTML=`<div class="appi-device-error">No pudimos preparar el QR.<br>${esc(error.message)}<br><button type="button" class="appi-device-refresh" id="appiRetryPair" style="margin-top:9px">Reintentar</button></div>`;
    const retry=$('appiRetryPair');if(retry)retry.onclick=()=>{const current=$('appiPairArea');if(current)current.innerHTML='<div class="appi-pair-loading"><span><span class="spinner"></span><br><br>Preparando el QR y el código…</span></div>';createPairing(version)};
  }
}
async function ensureSinglePhoneAvailable(){
  await loadDevices();
  if(state.lastError){await window.APPIDialog.alert('No pudimos comprobar si ya existe un teléfono vinculado. Revisá internet e intentá nuevamente.',{title:'No pudimos verificar la cuenta',icon:'!'});return false}
  if(state.devices.some(device=>device.activo!==false)){
    await window.APPIDialog.alert('Esta cuenta ya tiene un teléfono vinculado. Para usar otro, primero desvinculá el actual.',{title:'Ya hay un teléfono vinculado',icon:'📲',okText:'Entendido'});
    clearPairQuery();return false;
  }
  return true;
}
async function claimByCode(){if(!await ensureSinglePhoneAvailable())return;const code=await window.APPIDialog.prompt('Ingresá el código de seis dígitos que aparece en la PC.','',{title:'Vincular este teléfono',icon:'📲',placeholder:'000000',okText:'Continuar'});if(!code)return;return claimPairing({codigo:String(code).replace(/\D/g,'').slice(0,6)},true)}
async function claimPairing({token='',codigo=''}={},availabilityChecked=false){if(!availabilityChecked&&!await ensureSinglePhoneAvailable())return;if(!isPhone()&&platform()==='otro'){const ok=await window.APPIDialog.confirm('Este dispositivo no parece ser un teléfono. ¿Querés vincularlo de todos modos?',{title:'Confirmar dispositivo',icon:'📲',okText:'Continuar'});if(!ok)return}const nombre=await window.APPIDialog.prompt('¿Qué nombre querés darle a este teléfono?',defaultDeviceName(),{title:'Nombre del dispositivo',icon:'📱',placeholder:'Mi teléfono',okText:'Activar notificaciones'});if(!nombre)return;openOverlay(`${head('Activando teléfono','Autorizá las notificaciones cuando el sistema lo solicite.')}<div class="appi-device-status"><span class="spinner"></span><br>Preparando notificaciones…</div><div class="appi-device-note">APPI sólo enviará solicitudes de llamada de tu propia cuenta.</div>`);try{const subscription=await enablePush(),result=await callBridge({action:'claim_pairing',token,codigo,device_key:deviceKey(),nombre,plataforma:platform(),user_agent:navigator.userAgent,subscription});state.devices=[result.device];openOverlay(`${head('Teléfono vinculado','La conexión quedó lista.')}<div class="appi-call-request"><div class="appi-call-icon">✓</div><h2>${esc(result.device.nombre)}</h2><p>Ya puede recibir llamadas enviadas desde APPI en una PC o tablet.</p><button type="button" class="appi-device-btn primary" id="appiPairDone" style="width:100%;margin-top:14px">Listo</button></div>`);$('appiPairDone').onclick=()=>{closeOverlay();clearPairQuery()}}catch(error){openOverlay(`${head('No pudimos activar','Revisá los requisitos e intentá nuevamente.')}<div class="appi-device-note">${esc(error.message)}</div><button type="button" class="appi-device-btn primary" id="appiPairRetry" style="width:100%;margin-top:12px">Reintentar</button>`);$('appiPairRetry').onclick=()=>claimPairing({token,codigo})}}

function clearPairQuery(){const url=new URL(location.href);url.searchParams.delete('pair');history.replaceState(history.state,'',url.pathname+url.search+url.hash)}
async function confirmAndRemoveDevice(device,button=null,{closeAfter=false}={}){
  const confirmed=await window.APPIDialog.confirm('¿Deseás desvincular tu teléfono de la cuenta?\n\nPodrás volver a vincularlo en cualquier momento.',{title:'Desvincular teléfono',icon:'📲',okText:'Sí',cancelText:'No',danger:true,dismissible:false});
  if(!confirmed)return false;
  if(button){button.disabled=true;button.textContent='Desvinculando…'}
  try{
    await callBridge({action:'remove_device',device_id:device.id});
    state.devices=state.devices.filter(item=>item.id!==device.id);state.lastError='';renderDeviceList();decorateCallButtons();
    if(closeAfter)closeOverlay();
    return true;
  }catch(error){
    if(button){button.disabled=false;button.textContent='Desvincular dispositivo'}
    await window.APPIDialog.alert(error.message,{title:'No pudimos desvincular',icon:'!'});return false;
  }
}
async function removeDevice(id,button=null){
  const device=state.devices.find(item=>item.id===id);if(!device)return false;
  return confirmAndRemoveDevice(device,button,{closeAfter:state.devices.length<=1});
}
async function unlinkFromMenu(){
  await loadDevices();
  if(state.lastError){await window.APPIDialog.alert('No pudimos comprobar el teléfono vinculado. Revisá internet e intentá nuevamente.',{title:'No pudimos verificar la cuenta',icon:'!'});return false}
  const active=state.devices.filter(device=>device.activo!==false);
  if(!active.length){openManager();return false}
  if(active.length>1){openManager();return false}
  return confirmAndRemoveDevice(active[0]);
}
function shouldBridge(){return !isPhone()}
function decorateCallButtons(){
  document.querySelectorAll('[data-contact-channel="llamada"]').forEach(link=>{if(!isPhone())link.textContent=state.devices.some(d=>d.activo&&d.notificaciones)?'📲 Llamar en teléfono':'📲 Vincular teléfono'});
  document.querySelectorAll('[data-appi-call-label]').forEach(button=>{if(!isPhone())button.textContent=state.devices.some(d=>d.activo&&d.notificaciones)?'📲 Llamar en teléfono':'📲 Vincular teléfono'});
}
async function handleCall(contact){if(isPhone())return false;if(!state.devices.length)await loadDevices();const devices=state.devices.filter(d=>d.activo&&d.notificaciones);if(!devices.length){const open=await window.APPIDialog.confirm('No hay un teléfono con notificaciones activas. ¿Querés vincular uno ahora?',{title:'Vincular teléfono',icon:'📲',okText:'Vincular'});if(open)openManager();return true}let device=devices[0];if(devices.length>1){const selected=await window.APPIDialog.choose('¿En qué teléfono querés llamar?',devices.map(d=>({label:d.nombre,value:d.id})),{title:'Elegir teléfono',icon:'📲'});if(!selected)return true;device=devices.find(d=>d.id===selected)||device}try{const result=await callBridge({action:'send_call',device_id:device.id,source_device_key:deviceKey(),contact_id:contact.id,nombre:contact.nombre,telefono:contact.telefono});await window.APPIDialog.alert(`La solicitud llegó a ${device.nombre}. Tenés dos minutos para aceptarla desde el teléfono.`,{title:'Llamada enviada',icon:'📲',okText:'Entendido'});return Boolean(result.ok)}catch(error){await window.APPIDialog.alert(error.message,{title:'No pudimos enviar la llamada',icon:'!' });return true}}
async function callPhone(contact={}){
  const telefono=String(contact.telefono||contact.phone||'').replace(/\D/g,'').slice(0,15);
  const nombre=String(contact.nombre||contact.name||'Contacto').trim().slice(0,120)||'Contacto';
  if(telefono.length<8){await window.APPIDialog.alert('El contacto no tiene un número válido.',{title:'No se puede llamar',icon:'!'});return false}
  if(isPhone()){location.href=`tel:${telefono}`;return true}
  return handleCall({id:contact.id||'',nombre,telefono});
}
function installUniversalCallHandler(){
  if(window.__appiUniversalCallBridge)return;window.__appiUniversalCallBridge=true;
  document.addEventListener('click',event=>{
    const trigger=event.target.closest('[data-appi-call-phone],a[href^="tel:"]');
    if(!trigger||trigger.closest('#appiDeviceOverlay')||trigger.matches('[data-contact-channel]'))return;
    const href=trigger.getAttribute('href')||'';
    const telefono=trigger.dataset.appiCallPhone||href.replace(/^tel:/i,'');
    if(!telefono)return;
    if(isPhone()&&trigger.tagName==='A'&&!trigger.dataset.appiCallPhone)return;
    event.preventDefault();event.stopImmediatePropagation();
    const nombre=trigger.dataset.appiCallName||document.getElementById('histDetailTitle')?.textContent||document.getElementById('modalTitle')?.textContent||'Contacto';
    void callPhone({id:trigger.dataset.appiCallId||'',nombre,telefono});
  },true);
}
async function showCommand(commandId){try{const result=await callBridge({action:'get_command',command_id:commandId}),command=result.command,payload=command.payload||{},phone=String(payload.telefono||'').replace(/\D/g,'');openOverlay(`<div class="appi-call-request"><button type="button" class="appi-device-close" id="appiDeviceClose" aria-label="Cerrar" style="float:right">×</button><div style="clear:both"></div><div class="appi-call-icon">📞</div><h2>${esc(payload.nombre||'Contacto')}</h2><div class="appi-call-number">${esc(payload.telefono||phone)}</div><p>Solicitud enviada desde tu PC o tablet.</p><div class="appi-call-actions"><a href="tel:${esc(phone)}" id="appiAcceptCall">📞 Llamar ahora</a><button type="button" id="appiCancelCall">Cancelar</button></div><div class="appi-device-note">El teléfono siempre te pide confirmar antes de abrir el marcador.</div></div>`);$('appiDeviceClose').onclick=()=>cancelCommand(commandId);$('appiCancelCall').onclick=()=>cancelCommand(commandId);$('appiAcceptCall').onclick=async event=>{event.preventDefault();try{const accepted=await callBridge({action:'accept_call',command_id:commandId});if(accepted.contact_id){localStorage.setItem(`appi_gestion_resultado_pendiente_${window.APPIAuth.userId()}`,JSON.stringify({contactId:accepted.contact_id,channel:'llamada',at:Date.now()}))}clearCommandQuery();closeOverlay();location.href=`tel:${accepted.telefono}`}catch(error){await window.APPIDialog.alert(error.message,{title:'No pudimos iniciar la llamada',icon:'!'})}}}catch(error){openOverlay(`${head('Solicitud no disponible','La llamada no puede iniciarse.')}<div class="appi-device-note">${esc(error.message)}</div><button type="button" class="appi-device-btn primary" id="appiCommandDone" style="width:100%;margin-top:12px">Cerrar</button>`);$('appiCommandDone').onclick=()=>{clearCommandQuery();closeOverlay()}}}
async function cancelCommand(id){try{await callBridge({action:'cancel_command',command_id:id})}catch(e){}clearCommandQuery();closeOverlay()}
function clearCommandQuery(){const url=new URL(location.href);url.searchParams.delete('bridge_call');history.replaceState(history.state,'',url.pathname+url.search+url.hash)}
function handlePendingLinks(){if(!authorized())return;const params=new URLSearchParams(location.search),pair=params.get('pair'),command=params.get('bridge_call');if(pair&&validUuid(pair))claimPairing({token:pair});else if(command&&validUuid(command))showCommand(command)}
function validUuid(value){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value||''))}
function init(){if(state.initialized)return;state.initialized=true;installStyles();ensureOverlay();installUniversalCallHandler();deviceKey();window.addEventListener('appi-auth-change',()=>setTimeout(()=>{if(authorized()){loadDevices();handlePendingLinks()}},180));if(authorized()){setTimeout(loadDevices,1500);setTimeout(handlePendingLinks,500)}setInterval(()=>{if(authorized()&&isPhone())callBridge({action:'ping',device_key:deviceKey()}).catch(()=>{})},120000)}
window.APPIDeviceBridge={openManager,unlinkFromMenu,loadDevices,shouldBridge,handleCall,callPhone,decorateCallButtons,isPhone,claimByCode,deviceKey,state};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
