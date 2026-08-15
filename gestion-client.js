(function(){
'use strict';

const $=id=>document.getElementById(id);
const esc=value=>String(value==null?'':value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const STATUSES={
  nuevo:{label:'Nuevo',icon:'✨',color:'#5b8def'},
  contactado:{label:'Contactado',icon:'💬',color:'#3d63c9'},
  seguimiento:{label:'Seguimiento',icon:'📅',color:'#e99a20'},
  presentacion:{label:'Presentación',icon:'🎯',color:'#a06bff'},
  convertido:{label:'Convertido',icon:'✓',color:'#25a87f'},
  no_interesado:{label:'No interesado',icon:'×',color:'#d95359'}
};
const ANSWER_LABELS={
  agua_tipo:'Tipo de agua',agua_cantidad:'Cantidad recomendada',agua_importancia:'Importancia del agua',
  agua_calidad:'Agua de la canilla',agua_calidad_como:'Calidad general',agua_proviene:'Conoce su origen',
  agua_anomalias:'Anomalías percibidas',agua_turbidez:'Turbidez',agua_potabilizadores:'Elementos potabilizadores',
  evitar_sustancias:'Evitar sustancias',alternativas_evitar:'Alternativas conocidas',ambiente:'Cuidado ambiental',
  laboral_dedica:'Actividad laboral',laboral_gusta:'Qué valora',laboral_mejorar:'Qué cambiaría',
  conoces:'Conoce personas buscando cambio',oportunidad:'Interés en una oportunidad'
};
const state={link:null,contacts:[],surveys:new Map(),filter:'todos',search:'',loading:false,lastError:'',currentId:'',lastLoaded:0,initialized:false,pollTimer:null};

function config(){return window.APPIAuth&&window.APPIAuth.config?window.APPIAuth.config():window.APPI_AUTH||{}}
function profile(){return window.APPIAuth&&window.APPIAuth.currentProfile?window.APPIAuth.currentProfile():null}
function userId(){return window.APPIAuth&&window.APPIAuth.userId?window.APPIAuth.userId():''}
function authorized(){return !!(window.APPIAuth&&window.APPIAuth.isEnabled&&window.APPIAuth.isEnabled()&&window.APPIAuth.isLocallyAuthorized&&window.APPIAuth.isLocallyAuthorized()&&userId())}
function api(path){return String(config().url||'').replace(/\/$/,'')+path}
function token(){return window.APPIAuth&&window.APPIAuth.accessToken?window.APPIAuth.accessToken():''}
function readJson(text){try{return text?JSON.parse(text):null}catch(e){return null}}

async function cloudFetch(path,options={},retry=true){
  if(!authorized())throw new Error('Iniciá sesión con tu cuenta de distribuidor.');
  let response;
  try{
    response=await fetch(api(path),{...options,cache:'no-store',headers:{apikey:config().anonKey,Authorization:`Bearer ${token()}`,...(options.headers||{})}});
  }catch(error){const e=new Error('Sin conexión. Mi Gestión mostrará la última copia guardada.');e.network=true;throw e}
  if(response.status===401&&retry&&window.APPIAuth&&window.APPIAuth.refresh){await window.APPIAuth.refresh();return cloudFetch(path,options,false)}
  const text=await response.text(),body=readJson(text);
  if(!response.ok){const e=new Error(body&&body.message||body&&body.error||text||`Error ${response.status}`);e.status=response.status;throw e}
  return body;
}

function cacheKey(){return `appi_gestion_cache_v1_${userId()}`}
function queueKey(){return `appi_gestion_queue_v1_${userId()}`}
function loadCache(){
  try{const value=JSON.parse(localStorage.getItem(cacheKey())||'null');if(value&&Array.isArray(value.contacts)){state.contacts=value.contacts;state.surveys=new Map((value.surveys||[]).map(row=>[row.id,row]));state.lastLoaded=Number(value.savedAt)||0;return true}}catch(e){}
  return false;
}
function saveCache(){
  if(!userId())return;
  try{localStorage.setItem(cacheKey(),JSON.stringify({contacts:state.contacts,surveys:[...state.surveys.values()],savedAt:Date.now()}))}catch(e){}
}
function loadQueue(){try{const q=JSON.parse(localStorage.getItem(queueKey())||'[]');return Array.isArray(q)?q:[]}catch(e){return []}}
function saveQueue(queue){try{localStorage.setItem(queueKey(),JSON.stringify(queue))}catch(e){}}
function queueMutation(id,method,payload){
  const queue=loadQueue().filter(item=>item.id!==id);
  queue.push({id,method,payload,queuedAt:Date.now()});saveQueue(queue);
}
async function flushQueue(){
  if(!navigator.onLine||!authorized())return false;
  const queue=loadQueue();if(!queue.length)return true;const remaining=[];
  for(const item of queue){
    try{await cloudFetch(`/rest/v1/appi_gestion_contactos?id=eq.${encodeURIComponent(item.id)}`,{method:item.method,headers:{'Content-Type':'application/json',Prefer:'return=minimal'},body:item.method==='DELETE'?undefined:JSON.stringify(item.payload)})}catch(error){remaining.push(item);if(error.network)break}
  }
  saveQueue(remaining);return remaining.length===0;
}

function installStyles(){
  if($('appiGestionStyles'))return;
  const style=document.createElement('style');style.id='appiGestionStyles';style.textContent=`
  .gestion-shell{max-width:760px;margin:0 auto;padding-bottom:35px}.gestion-hero{position:relative;overflow:hidden;padding:19px;border-radius:23px;margin-bottom:12px;color:#fff;background:linear-gradient(135deg,#3c67ca 0%,#725bd6 64%,#a06bff 100%);box-shadow:0 14px 30px rgba(72,82,180,.22)}.gestion-hero:after{content:"";position:absolute;width:180px;height:180px;right:-72px;top:-90px;border-radius:50%;background:rgba(255,255,255,.12)}.gestion-hero>*{position:relative;z-index:1}.gestion-hero .eyebrow{font-size:9px;font-weight:950;letter-spacing:.9px;text-transform:uppercase;opacity:.78}.gestion-hero h2{font-size:21px;line-height:1.08;margin:6px 0 6px;letter-spacing:-.5px}.gestion-hero p{font-size:11px;line-height:1.45;margin:0;max-width:520px;opacity:.88}.gestion-card{padding:15px;border-radius:20px;background:rgba(255,255,255,.65);border:1px solid rgba(255,255,255,.84);box-shadow:0 8px 22px rgba(68,76,118,.07);margin-bottom:11px}.gestion-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:12px}.gestion-card-head h3{font-size:14px;margin:0;color:#282837}.gestion-card-head p{font-size:10.5px;color:#777887;margin:3px 0 0;line-height:1.35}.gestion-badge{padding:5px 9px;border-radius:999px;background:rgba(91,141,239,.12);color:#3d63c9;font-size:8.5px;font-weight:950;white-space:nowrap}.survey-link-box{padding:12px;border-radius:15px;background:rgba(91,141,239,.07);border:1px solid rgba(91,141,239,.13)}.survey-link-box label{display:block;color:#777887;font-size:8.5px;font-weight:950;text-transform:uppercase;letter-spacing:.4px}.survey-link-value{margin-top:5px;color:#3d63c9;font-size:10px;font-weight:800;line-height:1.35;overflow-wrap:anywhere;user-select:text}.survey-actions{display:grid;grid-template-columns:1.35fr 1fr;gap:7px;margin-top:10px}.survey-actions button{min-height:42px;border:0;border-radius:12px;font:inherit;font-size:9.5px;font-weight:950;cursor:pointer}.survey-actions .wa{color:#fff;background:linear-gradient(135deg,#25d366,#128c7e);box-shadow:0 6px 14px rgba(18,140,126,.2)}.survey-actions .copy{color:#3d63c9;background:rgba(91,141,239,.11)}.survey-actions .preview{color:#7650c8;background:rgba(160,107,255,.1)}.survey-flow{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.survey-flow>div{padding:12px 8px;border-radius:15px;background:rgba(255,255,255,.62);border:1px solid rgba(255,255,255,.78);text-align:center}.survey-flow b{width:29px;height:29px;margin:0 auto 6px;border-radius:10px;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,#5b8def,#a06bff);font-size:11px}.survey-flow strong{display:block;color:#383846;font-size:10px}.survey-flow small{display:block;margin-top:3px;color:#777887;font-size:8.5px;line-height:1.3}.gestion-notice{padding:13px;border-radius:16px;background:rgba(245,179,1,.08);border:1px solid rgba(245,179,1,.18);color:#795d20;font-size:10.5px;line-height:1.45}.gestion-empty{text-align:center;padding:31px 17px;border:1px dashed rgba(91,141,239,.28);border-radius:19px;background:rgba(255,255,255,.4)}.gestion-empty .ico{font-size:33px}.gestion-empty h3{margin:8px 0 5px;font-size:14px}.gestion-empty p{margin:0 auto;color:#777887;font-size:10.5px;line-height:1.45;max-width:430px}.gestion-primary,.gestion-secondary,.gestion-danger{min-height:39px;border:0;border-radius:12px;padding:9px 12px;font:inherit;font-size:10px;font-weight:950;cursor:pointer}.gestion-primary{color:#fff;background:linear-gradient(135deg,#5b8def,#875fdd);box-shadow:0 6px 15px rgba(91,112,210,.21)}.gestion-secondary{color:#3d63c9;background:rgba(91,141,239,.1)}.gestion-danger{color:#c3434c;background:rgba(217,83,89,.09)}.gestion-toolbar{padding:12px;border-radius:18px;background:rgba(255,255,255,.6);border:1px solid rgba(255,255,255,.78);box-shadow:0 8px 22px rgba(68,76,118,.06);margin-bottom:11px}.gestion-search{position:relative}.gestion-search input{width:100%;min-height:43px;padding:10px 38px 10px 12px;border:1px solid rgba(80,90,130,.12);border-radius:13px;background:rgba(255,255,255,.76);color:#292938;font:inherit;font-size:12px;outline:none}.gestion-search input:focus{border-color:#5b8def;box-shadow:0 0 0 3px rgba(91,141,239,.1)}.gestion-search span{position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:15px}.gestion-filters{display:flex;gap:5px;overflow-x:auto;margin-top:9px;padding-bottom:1px;scrollbar-width:none}.gestion-filters::-webkit-scrollbar{display:none}.gestion-filter{flex:0 0 auto;border:0;border-radius:10px;padding:8px 10px;background:rgba(80,90,130,.07);color:#6a6b78;font:inherit;font-size:9px;font-weight:900;white-space:nowrap;cursor:pointer}.gestion-filter.active{color:#fff;background:linear-gradient(135deg,#5b8def,#875fdd);box-shadow:0 4px 11px rgba(91,112,210,.2)}.gestion-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:11px}.gestion-stat{padding:11px 5px;border-radius:17px;background:rgba(255,255,255,.62);border:1px solid rgba(255,255,255,.78);box-shadow:0 7px 17px rgba(68,76,118,.06);text-align:center}.gestion-stat span{font-size:15px}.gestion-stat b{display:block;margin-top:2px;color:#3d63c9;font-size:20px;line-height:1}.gestion-stat small{display:block;margin-top:4px;color:#777887;font-size:7.5px;font-weight:950;text-transform:uppercase}.gestion-list{display:grid;gap:8px}.gestion-contact{padding:13px;border-radius:19px;background:rgba(255,255,255,.65);border:1px solid rgba(255,255,255,.82);box-shadow:0 8px 20px rgba(68,76,118,.065)}.gestion-contact-top{display:grid;grid-template-columns:40px minmax(0,1fr) auto;gap:10px;align-items:start}.gestion-avatar{width:40px;height:40px;border-radius:13px;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,#5b8def,#a06bff);font-size:17px}.gestion-contact h3{margin:1px 0 3px;color:#292938;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gestion-contact-line{color:#777887;font-size:9.5px;line-height:1.4}.gestion-status{padding:5px 8px;border-radius:999px;font-size:8px;font-weight:950;white-space:nowrap}.gestion-tags{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px}.gestion-tag{padding:4px 7px;border-radius:8px;background:rgba(80,90,130,.07);color:#686977;font-size:8px;font-weight:850}.gestion-tag.source{background:rgba(160,107,255,.09);color:#7750c7}.gestion-contact-actions{display:grid;grid-template-columns:1fr 1fr 1.15fr;gap:6px;margin-top:10px}.gestion-contact-actions a,.gestion-contact-actions button{min-height:35px;border:0;border-radius:10px;display:flex;align-items:center;justify-content:center;text-decoration:none;font:inherit;font-size:8.5px;font-weight:950;cursor:pointer}.gestion-contact-actions .wa{color:#197454;background:rgba(58,208,164,.14)}.gestion-contact-actions .call{color:#3d63c9;background:rgba(91,141,239,.12)}.gestion-contact-actions .detail{color:#714bc3;background:rgba(160,107,255,.1)}.gestion-offline{margin-bottom:9px;padding:8px 10px;border-radius:12px;background:rgba(233,154,32,.09);color:#8a6116;font-size:9.5px;font-weight:750}.gestion-offline[hidden]{display:none}.gestion-detail-overlay{position:fixed;inset:0;z-index:25000;display:flex;justify-content:flex-end;background:rgba(20,22,38,.46);backdrop-filter:blur(8px)}.gestion-detail-overlay[hidden]{display:none}.gestion-drawer{width:min(100%,510px);height:100%;overflow-y:auto;padding:18px 17px max(25px,env(safe-area-inset-bottom));background:linear-gradient(150deg,#eef4ff,#faf8ff 58%,#eef9f6);box-shadow:-15px 0 50px rgba(28,31,68,.25)}.gestion-drawer-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}.gestion-drawer-head h2{margin:0;color:#292938;font-size:20px;line-height:1.15}.gestion-drawer-head p{margin:4px 0 0;color:#777887;font-size:10px}.gestion-close{width:36px;height:36px;flex:none;border:0;border-radius:12px;background:rgba(80,90,130,.08);color:#666776;font-size:19px}.gestion-detail-section{padding:14px;border-radius:18px;background:rgba(255,255,255,.67);border:1px solid rgba(255,255,255,.82);box-shadow:0 7px 19px rgba(68,76,118,.06);margin-bottom:9px}.gestion-detail-section h3{margin:0 0 10px;color:#3d63c9;font-size:11px;text-transform:uppercase;letter-spacing:.35px}.gestion-detail-row{display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-bottom:1px solid rgba(80,90,130,.08);font-size:10px;line-height:1.35}.gestion-detail-row:last-child{border-bottom:0}.gestion-detail-row span:first-child{color:#777887}.gestion-detail-row span:last-child{max-width:62%;text-align:right;color:#333440;font-weight:850;overflow-wrap:anywhere}.gestion-status-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}.gestion-status-btn{min-height:39px;border:1px solid rgba(80,90,130,.1);border-radius:11px;background:rgba(247,248,255,.7);color:#626370;font:inherit;font-size:9px;font-weight:900}.gestion-status-btn.active{color:#fff;border-color:transparent;background:linear-gradient(135deg,#5b8def,#875fdd);box-shadow:0 4px 11px rgba(91,112,210,.19)}.gestion-field{display:grid;gap:5px;margin-top:9px}.gestion-field label{color:#686977;font-size:9px;font-weight:950;text-transform:uppercase;letter-spacing:.3px}.gestion-field input,.gestion-field textarea{width:100%;border:1px solid rgba(80,90,130,.13);border-radius:12px;background:rgba(255,255,255,.75);padding:10px 11px;color:#292938;font:inherit;font-size:12px;outline:none}.gestion-field textarea{min-height:105px;resize:vertical}.gestion-field input:focus,.gestion-field textarea:focus{border-color:#5b8def;box-shadow:0 0 0 3px rgba(91,141,239,.1)}.gestion-detail-actions{display:grid;grid-template-columns:1.3fr 1fr;gap:7px;margin-top:11px}.gestion-detail-actions button{min-height:43px;border:0;border-radius:12px;font:inherit;font-size:10px;font-weight:950}.gestion-answer{display:grid;grid-template-columns:44% 1fr;gap:9px;padding:7px 0;border-bottom:1px solid rgba(80,90,130,.08);font-size:9.5px;line-height:1.35}.gestion-answer:last-child{border-bottom:0}.gestion-answer span:first-child{color:#777887}.gestion-answer span:last-child{text-align:right;color:#333440;font-weight:850;overflow-wrap:anywhere}.gestion-refresh-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 2px 8px;color:#777887;font-size:8.5px}.gestion-refresh-row button{border:0;background:transparent;color:#3d63c9;font:inherit;font-size:8.5px;font-weight:950}.gestion-sidebar-badge{min-width:19px;height:19px;margin-left:auto;padding:0 5px;border-radius:999px;display:inline-grid!important;place-items:center;background:#e95757;color:#fff!important;font-size:8px!important;font-weight:950}.gestion-sidebar-badge[hidden]{display:none!important}.home-tool-badge{position:absolute;right:8px;top:7px;min-width:19px;height:19px;padding:0 5px;border-radius:999px;display:grid;place-items:center;background:#e95757;color:#fff;font-size:8px;font-weight:950;box-shadow:0 4px 9px rgba(217,83,89,.28)}
  body.dark .gestion-card,body.dark .gestion-toolbar,body.dark .gestion-stat,body.dark .gestion-contact,body.dark .gestion-detail-section{background:rgba(30,30,50,.58);border-color:rgba(255,255,255,.08)}body.dark .gestion-card-head h3,body.dark .gestion-contact h3,body.dark .gestion-drawer-head h2,body.dark .gestion-detail-row span:last-child,body.dark .gestion-answer span:last-child{color:#f0f0f5}body.dark .survey-link-box,body.dark .survey-flow>div{background:rgba(29,31,49,.58);border-color:rgba(255,255,255,.07)}body.dark .survey-flow strong{color:#e7e7ed}body.dark .gestion-search input,body.dark .gestion-field input,body.dark .gestion-field textarea,body.dark .gestion-status-btn{background:rgba(28,29,46,.72);border-color:rgba(255,255,255,.09);color:#f0f0f5}body.dark .gestion-drawer{background:linear-gradient(150deg,#171827,#25213a 58%,#162b2a)}
  @media(max-width:520px){.survey-actions{grid-template-columns:1fr}.survey-actions .wa{grid-column:auto}.survey-flow{grid-template-columns:1fr}.gestion-stats{grid-template-columns:repeat(2,1fr)}.gestion-contact-actions{grid-template-columns:1fr 1fr}.gestion-contact-actions .detail{grid-column:1/-1}.gestion-status-grid{grid-template-columns:1fr 1fr}.gestion-drawer{padding-left:12px;padding-right:12px}}
  `;document.head.appendChild(style);
}

function surveyUrl(invitation=state.link){
  if(!invitation||!invitation.token)return '';
  const base=new URL('./encuesta.html',location.href);base.search='';base.hash='';base.searchParams.set('t',invitation.token);return base.toString();
}
function distributorFirstName(){const full=String(profile()?.nombre||'').trim();return full.split(/\s+/)[0]||''}
function shareMessage(url){
  const name=distributorFirstName();
  return `¡Hola! 😊 Soy ${name}.\n\nQuería contarte que estoy realizando una pequeña encuesta que es muy importante para mí. Gracias a tu apoyo puedo seguir concientizando a más familias a través de demostraciones y compartiendo información que puede ayudarlas a cuidar su bienestar.\n\nCuando llegues al final, si te nace, podés regalarles esta misma oportunidad a algunos de tus seres queridos. Tus referidos son muy importantes para mí porque me permiten continuar con esta tarea. Puede ser una persona, dos o diez: la cantidad no es lo importante; lo valioso es poder acercarles la posibilidad de cuidarse y cuidar a toda su familia.\n\n¿Me ayudás completándola? Te va a llevar sólo unos minutos:\n${url}\n\n¡Muchas gracias por tu tiempo y por acompañarme! 💙`;
}
function isAdmin(){return profile()&&profile().rol==='admin'}

async function createSurveyInvitation(){
  if(!authorized())throw new Error('Iniciá sesión para compartir una encuesta.');
  if(isAdmin())throw new Error('Las invitaciones pertenecen a las cuentas distribuidoras.');
  const rows=await cloudFetch('/rest/v1/rpc/appi_crear_invitacion_encuesta',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
  const invitation=Array.isArray(rows)?rows[0]:rows;
  if(!invitation||!invitation.token)throw new Error('No pudimos crear la invitación privada.');
  state.link=invitation;renderSurveyTool();return invitation;
}

async function sharePrivateSurvey(){
  const popup=window.open('about:blank','_blank');
  try{const invitation=await createSurveyInvitation(),url=surveyUrl(invitation),wa=`https://wa.me/?text=${encodeURIComponent(shareMessage(url))}`;if(popup)popup.location.href=wa;else location.href=wa}
  catch(error){if(popup)popup.close();await window.APPIDialog.alert(error.message,{title:'No pudimos crear la invitación',icon:'!'})}
}
async function copyPrivateSurvey(){
  try{const invitation=await createSurveyInvitation();await copyText(surveyUrl(invitation));await window.APPIDialog.alert('Creaste una invitación privada válida por 24 horas y para una sola respuesta.',{title:'Invitación copiada',icon:'🔒',okText:'Entendido'})}
  catch(error){await window.APPIDialog.alert(error.message,{title:'No pudimos crear la invitación',icon:'!'})}
}

function renderSurveyTool(){
  const c=$('surveyToolContent');if(!c)return;
  if(isAdmin()){
    c.innerHTML=`<div class="gestion-empty"><div class="ico">🔒</div><h3>Herramienta para distribuidores</h3><p>POPUPS administra APPI, pero no tiene número de distribuidor. Cada distribuidor genera sus propias invitaciones privadas.</p></div>`;return;
  }
  const lastUrl=surveyUrl(),lastExpiry=state.link?.expires_at?formatDate(state.link.expires_at,true):'';
  c.innerHTML=`
    <div class="gestion-hero"><div class="eyebrow">Invitaciones privadas</div><h2>Compartí. Recibí. Gestioná.</h2><p>Cada envío crea una invitación nueva que vence en 24 horas y se cierra después de una sola respuesta.</p></div>
    <section class="gestion-card"><div class="gestion-card-head"><div><h3>Crear una invitación</h3><p>No existe un enlace permanente para reenviar. Cada persona recibe uno diferente.</p></div><span class="gestion-badge">🔒 24 horas</span></div>${lastUrl?`<div class="survey-link-box"><label>Última invitación generada · vence ${esc(lastExpiry)}</label><div class="survey-link-value">${esc(lastUrl)}</div></div>`:'<div class="survey-link-box"><label>Privacidad</label><div class="survey-link-value">Un dispositivo · una respuesta · vencimiento automático</div></div>'}<div class="survey-actions"><button type="button" class="wa" id="surveyShareWa">💬 Compartir por WhatsApp</button><button type="button" class="copy" id="surveyCopy">🔗 Copiar invitación</button></div></section>
    <section class="gestion-card"><div class="gestion-card-head"><div><h3>Así funciona</h3><p>No necesitás importar mensajes ni copiar respuestas.</p></div></div><div class="survey-flow"><div><b>1</b><strong>Generás</strong><small>Se crea una invitación privada.</small></div><div><b>2</b><strong>Responden</strong><small>Queda ligada al primer dispositivo.</small></div><div><b>3</b><strong>Se cierra</strong><small>No admite una segunda respuesta.</small></div></div></section>
    <div class="gestion-notice"><b>Privacidad:</b> la invitación vence a las 24 horas, queda ligada al primer dispositivo que la abre y deja de funcionar al enviar la encuesta. Si vence, generá una nueva desde este mismo botón.</div>`;
  if($('surveyShareWa'))$('surveyShareWa').onclick=sharePrivateSurvey;
  if($('surveyCopy'))$('surveyCopy').onclick=copyPrivateSurvey;
}

async function copyText(text){
  try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(text);else{const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();document.execCommand('copy');area.remove()}showToastSafe('Enlace copiado ✓')}catch(error){await window.APPIDialog.alert(text,{title:'Copiá tu enlace',icon:'🔗'})}
}
function showToastSafe(message,duration=1800){if(typeof window.showToast==='function')window.showToast(message,duration);else window.APPIDialog.alert(message,{title:'APPI',icon:'✓'})}

async function openEncuestaTool(){
  if(typeof window.showView==='function')window.showView('view-encuesta');
  renderSurveyTool();
}

function statusInfo(value){return STATUSES[value]||STATUSES.nuevo}
function phoneDigits(value){return String(value||'').replace(/\D/g,'').slice(0,15)}
function whatsappDigits(value){let digits=phoneDigits(value);if(digits.startsWith('00'))digits=digits.slice(2);if(digits.length===10&&!digits.startsWith('54'))return `549${digits}`;if(digits.startsWith('54')&&digits.length===12&&!digits.startsWith('549'))return `549${digits.slice(2)}`;return digits}
function formatDate(value,withTime=false){if(!value)return '-';const d=new Date(value);if(Number.isNaN(d.getTime()))return value;return new Intl.DateTimeFormat('es-AR',withTime?{dateStyle:'short',timeStyle:'short'}:{dateStyle:'medium'}).format(d)}
function filteredContacts(){
  const query=state.search.trim().toLowerCase();return state.contacts.filter(c=>{
    const matchFilter=state.filter==='todos'||c.estado===state.filter;
    const haystack=`${c.nombre||''} ${c.telefono||''} ${c.zona||''} ${c.referido_por||''}`.toLowerCase();return matchFilter&&(!query||haystack.includes(query));
  }).sort((a,b)=>new Date(b.updated_at||b.created_at||0)-new Date(a.updated_at||a.created_at||0));
}
function countStatus(status){return state.contacts.filter(c=>c.estado===status).length}
function updateBadges(){
  const count=countStatus('nuevo');for(const id of ['gestionSidebarBadge','homeGestionBadge']){const el=$(id);if(!el)continue;el.textContent=count>99?'99+':String(count);el.hidden=count===0}
}
function contactCard(c){
  const s=statusInfo(c.estado),telDigits=phoneDigits(c.telefono),waDigits=whatsappDigits(c.telefono),type=c.tipo==='referido'?'Referido':c.tipo==='encuestado'?'Encuestado':'Manual';
  return `<article class="gestion-contact" data-contact-id="${esc(c.id)}"><div class="gestion-contact-top"><div class="gestion-avatar">${c.tipo==='referido'?'👥':'👤'}</div><div><h3>${esc(c.nombre||'Sin nombre')}</h3><div class="gestion-contact-line">📱 ${esc(c.telefono||'Sin teléfono')}</div>${c.zona?`<div class="gestion-contact-line">📍 ${esc(c.zona)}</div>`:''}</div><span class="gestion-status" style="color:${s.color};background:${s.color}18">${s.icon} ${esc(s.label)}</span></div><div class="gestion-tags"><span class="gestion-tag source">${esc(type)}</span>${c.referido_por?`<span class="gestion-tag">Referido por ${esc(c.referido_por)}</span>`:''}${c.proximo_contacto?`<span class="gestion-tag">Próximo: ${esc(formatDate(c.proximo_contacto))}</span>`:''}${Number(c.cantidad_origenes)>1?`<span class="gestion-tag">${Number(c.cantidad_origenes)} orígenes</span>`:''}</div><div class="gestion-contact-actions"><a class="wa" href="https://wa.me/${waDigits}" target="_blank" rel="noopener">💬 WhatsApp</a><a class="call" href="tel:${telDigits}">📞 Llamar</a><button type="button" class="detail" data-open-contact="${esc(c.id)}">Ver y gestionar</button></div></article>`;
}

function renderManagement(){
  const c=$('gestionContent');if(!c)return;
  const cached=state.lastLoaded&&!navigator.onLine;
  if(state.loading&&!state.contacts.length){c.innerHTML='<div class="gestion-empty"><div class="spinner"></div><h3>Cargando Mi Gestión</h3><p>Estamos recuperando tus encuestas y referidos.</p></div>';return}
  const list=filteredContacts();
  c.innerHTML=`
    <div class="gestion-hero"><div class="eyebrow">Prospección y seguimiento</div><h2>Todos tus contactos en un solo lugar.</h2><p>Las encuestas y los referidos nuevos aparecen automáticamente. Cambiá su estado, anotá lo hablado y programá el próximo contacto.</p></div>
    <div class="gestion-offline" id="gestionOffline" ${navigator.onLine?'hidden':''}>Sin conexión: estás viendo la última copia guardada. Los cambios quedarán pendientes y se sincronizarán al reconectar.</div>
    <div class="gestion-stats"><div class="gestion-stat"><span>👥</span><b>${state.contacts.length}</b><small>Total</small></div><div class="gestion-stat"><span>✨</span><b>${countStatus('nuevo')}</b><small>Nuevos</small></div><div class="gestion-stat"><span>📅</span><b>${countStatus('seguimiento')}</b><small>Seguimiento</small></div><div class="gestion-stat"><span>✓</span><b>${countStatus('convertido')}</b><small>Convertidos</small></div></div>
    <div class="gestion-toolbar"><div class="gestion-search"><input id="gestionSearch" type="search" autocomplete="off" placeholder="Buscar por nombre, teléfono, zona…" value="${esc(state.search)}"><span>⌕</span></div><div class="gestion-filters">${[{id:'todos',label:'Todos'},...Object.entries(STATUSES).map(([id,v])=>({id,label:v.label}))].map(item=>`<button type="button" class="gestion-filter ${state.filter===item.id?'active':''}" data-gestion-filter="${item.id}">${esc(item.label)}${item.id==='todos'?` · ${state.contacts.length}`:` · ${countStatus(item.id)}`}</button>`).join('')}</div></div>
    <div class="gestion-refresh-row"><span>${state.lastLoaded?`Actualizado ${esc(formatDate(state.lastLoaded,true))}`:'Sin actualizar'}${loadQueue().length?` · ${loadQueue().length} cambio${loadQueue().length===1?'':'s'} pendiente${loadQueue().length===1?'':'s'}`:''}</span><div><button type="button" id="gestionExport">Exportar CSV</button><button type="button" id="gestionRefresh">Actualizar</button></div></div>
    <div class="gestion-list">${list.length?list.map(contactCard).join(''):`<div class="gestion-empty"><div class="ico">📭</div><h3>${state.contacts.length?'No hay coincidencias':'Todavía no hay contactos'}</h3><p>${state.contacts.length?'Probá otro nombre o estado.':'Compartí tu enlace desde Mi Encuesta. La primera respuesta aparecerá acá automáticamente.'}</p>${!state.contacts.length?'<button type="button" class="gestion-primary" id="gestionGoSurvey" style="margin-top:12px">Abrir Mi Encuesta</button>':''}</div>`}</div>
    <div class="gestion-detail-overlay" id="gestionDetailOverlay" hidden><aside class="gestion-drawer" id="gestionDrawer" role="dialog" aria-modal="true" aria-label="Detalle del contacto"></aside></div>`;
  bindManagement();updateBadges();
  if(state.currentId)openContactDetail(state.currentId,false);
}

function bindManagement(){
  if($('gestionSearch'))$('gestionSearch').oninput=e=>{state.search=e.target.value;const pos=e.target.selectionStart;renderManagement();const input=$('gestionSearch');if(input){input.focus();try{input.setSelectionRange(pos,pos)}catch(err){}}};
  document.querySelectorAll('[data-gestion-filter]').forEach(button=>button.onclick=()=>{state.filter=button.dataset.gestionFilter;renderManagement()});
  document.querySelectorAll('[data-open-contact]').forEach(button=>button.onclick=()=>openContactDetail(button.dataset.openContact));
  if($('gestionRefresh'))$('gestionRefresh').onclick=()=>refreshManagement(true);
  if($('gestionExport'))$('gestionExport').onclick=exportCsv;
  if($('gestionGoSurvey'))$('gestionGoSurvey').onclick=openEncuestaTool;
  const overlay=$('gestionDetailOverlay');if(overlay)overlay.onclick=e=>{if(e.target===overlay)closeContactDetail()};
}

function answerValue(value){if(Array.isArray(value))return value.length?value.join(', '):'-';if(value===undefined||value===null||value==='')return '-';return String(value)}
function surveyDetails(survey){
  if(!survey)return '<div class="gestion-notice">La respuesta completa no está disponible en esta copia.</div>';
  const answers=survey.respuestas||{};
  return Object.entries(ANSWER_LABELS).map(([key,label])=>{let value=answers[key];if(Array.isArray(value)&&value.includes('Otros')&&answers[key+'_otros'])value=value.map(item=>item==='Otros'?answers[key+'_otros']:item);return `<div class="gestion-answer"><span>${esc(label)}</span><span>${esc(answerValue(value))}${key==='agua_importancia'&&value!=='-'?'/10':''}</span></div>`}).join('');
}
function openContactDetail(id,rerender=true){
  const contact=state.contacts.find(c=>c.id===id);if(!contact)return;state.currentId=id;
  const overlay=$('gestionDetailOverlay'),drawer=$('gestionDrawer');if(!overlay||!drawer){if(rerender){renderManagement();openContactDetail(id,false)}return}
  const survey=contact.encuesta_id?state.surveys.get(contact.encuesta_id):null,s=statusInfo(contact.estado),telDigits=phoneDigits(contact.telefono),waDigits=whatsappDigits(contact.telefono);
  drawer.innerHTML=`<div class="gestion-drawer-head"><div><h2>${esc(contact.nombre)}</h2><p>${contact.tipo==='referido'?'Referido':contact.tipo==='encuestado'?'Respondió la encuesta':'Contacto manual'} · ${s.icon} ${esc(s.label)}</p></div><button type="button" class="gestion-close" id="gestionDetailClose" aria-label="Cerrar">×</button></div>
  <section class="gestion-detail-section"><h3>Información de contacto</h3><div class="gestion-detail-row"><span>Teléfono</span><span>${esc(contact.telefono)}</span></div>${contact.referido_por?`<div class="gestion-detail-row"><span>Referido por</span><span>${esc(contact.referido_por)}</span></div>`:''}${contact.relacion?`<div class="gestion-detail-row"><span>Relación</span><span>${esc(contact.relacion)}</span></div>`:''}${contact.zona?`<div class="gestion-detail-row"><span>Zona</span><span>${esc(contact.zona)}</span></div>`:''}<div class="gestion-detail-row"><span>Ingresó</span><span>${esc(formatDate(contact.created_at,true))}</span></div><div class="gestion-contact-actions"><a class="wa" href="https://wa.me/${waDigits}" target="_blank" rel="noopener">💬 WhatsApp</a><a class="call" href="tel:${telDigits}">📞 Llamar</a><button type="button" class="detail" id="gestionCopyPhone">Copiar teléfono</button></div></section>
  <section class="gestion-detail-section"><h3>Etapa comercial</h3><div class="gestion-status-grid">${Object.entries(STATUSES).map(([id,v])=>`<button type="button" class="gestion-status-btn ${contact.estado===id?'active':''}" data-detail-status="${id}">${v.icon} ${esc(v.label)}</button>`).join('')}</div><div class="gestion-field"><label>Próximo contacto</label><input type="date" id="gestionNextDate" value="${esc(contact.proximo_contacto||'')}"></div><div class="gestion-field"><label>Notas</label><textarea id="gestionNotes" maxlength="5000" placeholder="¿Qué hablaron? ¿Qué tenés que recordar?">${esc(contact.notas||'')}</textarea></div><div class="gestion-detail-actions"><button type="button" class="gestion-primary" id="gestionSaveContact">Guardar cambios</button><button type="button" class="gestion-danger" id="gestionDeleteContact">Eliminar</button></div></section>
  ${contact.tipo==='encuestado'?`<section class="gestion-detail-section"><h3>Respuestas de Mi Encuesta</h3>${surveyDetails(survey)}</section>`:''}`;
  overlay.hidden=false;document.body.style.overflow='hidden';
  $('gestionDetailClose').onclick=closeContactDetail;$('gestionCopyPhone').onclick=()=>copyText(contact.telefono);
  document.querySelectorAll('[data-detail-status]').forEach(button=>button.onclick=()=>{document.querySelectorAll('[data-detail-status]').forEach(b=>b.classList.remove('active'));button.classList.add('active')});
  $('gestionSaveContact').onclick=saveCurrentContact;$('gestionDeleteContact').onclick=deleteCurrentContact;
}
function closeContactDetail(){const overlay=$('gestionDetailOverlay');if(overlay)overlay.hidden=true;document.body.style.overflow='';state.currentId=''}
async function saveCurrentContact(){
  const contact=state.contacts.find(c=>c.id===state.currentId);if(!contact)return;
  const selected=document.querySelector('[data-detail-status].active'),payload={estado:selected?selected.dataset.detailStatus:contact.estado,notas:$('gestionNotes').value.trim().slice(0,5000),proximo_contacto:$('gestionNextDate').value||null};
  if(payload.estado!==contact.estado&&payload.estado!=='nuevo')payload.ultimo_contacto=new Date().toISOString();
  Object.assign(contact,payload,{updated_at:new Date().toISOString()});saveCache();updateBadges();
  const button=$('gestionSaveContact');if(button){button.disabled=true;button.textContent='Guardando…'}
  try{if(!navigator.onLine)throw Object.assign(new Error('offline'),{network:true});await cloudFetch(`/rest/v1/appi_gestion_contactos?id=eq.${encodeURIComponent(contact.id)}`,{method:'PATCH',headers:{'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(payload)});showToastSafe('Cambios guardados ✓');closeContactDetail();renderManagement()}catch(error){if(error.network){queueMutation(contact.id,'PATCH',payload);showToastSafe('Guardado en este dispositivo. Se sincronizará al volver internet.',3000);closeContactDetail();renderManagement()}else{if(button){button.disabled=false;button.textContent='Guardar cambios'}await window.APPIDialog.alert(error.message,{title:'No pudimos guardar',icon:'!'})}}
}
async function deleteCurrentContact(){
  const contact=state.contacts.find(c=>c.id===state.currentId);if(!contact)return;
  const ok=await window.APPIDialog.confirm(`Se eliminará a ${contact.nombre} de Mi Gestión.`,{title:'Eliminar contacto',icon:'🗑️',okText:'Eliminar',danger:true});if(!ok)return;
  state.contacts=state.contacts.filter(c=>c.id!==contact.id);saveCache();updateBadges();closeContactDetail();renderManagement();
  try{if(!navigator.onLine)throw Object.assign(new Error('offline'),{network:true});await cloudFetch(`/rest/v1/appi_gestion_contactos?id=eq.${encodeURIComponent(contact.id)}`,{method:'DELETE',headers:{Prefer:'return=minimal'}});showToastSafe('Contacto eliminado')}catch(error){if(error.network){queueMutation(contact.id,'DELETE',null);showToastSafe('Se eliminará de la nube al volver internet.',2600)}else await window.APPIDialog.alert(error.message,{title:'No pudimos eliminar',icon:'!'})}
}

async function fetchManagement(){
  const contacts=await cloudFetch('/rest/v1/appi_gestion_contactos?select=id,user_id,encuesta_id,tipo,nombre,telefono,telefono_normalizado,relacion,zona,referido_por,estado,notas,proximo_contacto,ultimo_contacto,cantidad_origenes,metadata,created_at,updated_at&order=updated_at.desc&limit=2000');
  const surveys=await cloudFetch('/rest/v1/appi_encuestas?select=id,user_id,nombre,telefono,respuestas,referidos,created_at&order=created_at.desc&limit=1000');
  state.contacts=Array.isArray(contacts)?contacts:[];state.surveys=new Map((Array.isArray(surveys)?surveys:[]).map(row=>[row.id,row]));state.lastLoaded=Date.now();state.lastError='';saveCache();updateBadges();
}
async function refreshManagement(showLoading=false){
  if(state.loading)return;state.loading=true;if(showLoading)renderManagement();
  try{await flushQueue();await fetchManagement()}catch(error){state.lastError=error.message;if(!state.contacts.length)loadCache();if(showLoading&&!state.contacts.length){const c=$('gestionContent');if(c)c.innerHTML=`<div class="gestion-empty"><div class="ico">⚠️</div><h3>No pudimos cargar Mi Gestión</h3><p>${esc(error.message)}</p><button type="button" class="gestion-primary" id="gestionRetry" style="margin-top:12px">Reintentar</button></div>`;if($('gestionRetry'))$('gestionRetry').onclick=()=>refreshManagement(true);state.loading=false;return}}
  state.loading=false;renderManagement();
}
async function openMiGestion(){
  if(typeof window.showView==='function')window.showView('view-gestion');
  if(!authorized()){const c=$('gestionContent');if(c)c.innerHTML='<div class="gestion-empty"><div class="ico">🔒</div><h3>Iniciá sesión</h3><p>Mi Gestión necesita una cuenta de APPI para identificar a qué distribuidor pertenecen las respuestas.</p></div>';return}
  if(!state.contacts.length)loadCache();renderManagement();await refreshManagement(!state.contacts.length);const current=document.querySelector('.view.active')?.id;if(current==='view-home'&&typeof window.showView==='function')window.showView('view-gestion');
}

function csvCell(value){const text=String(value==null?'':value).replace(/"/g,'""');return `"${text}"`}
function exportCsv(){
  if(!state.contacts.length){showToastSafe('No hay contactos para exportar');return}
  const rows=[['Nombre','Teléfono','Tipo','Estado','Referido por','Relación','Zona','Próximo contacto','Notas','Fecha de ingreso'],...state.contacts.map(c=>[c.nombre,c.telefono,c.tipo,statusInfo(c.estado).label,c.referido_por,c.relacion,c.zona,c.proximo_contacto,c.notas,c.created_at])];
  const csv='\ufeff'+rows.map(row=>row.map(csvCell).join(';')).join('\r\n'),blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`appi-mi-gestion-${new Date().toISOString().slice(0,10)}.csv`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);showToastSafe('Reporte descargado ✓')
}

function injectSections(){
  const grab=$('view-grabadora');if(!grab||$('view-encuesta'))return;
  const wrapper=document.createElement('div');wrapper.innerHTML=`
  <section id="view-encuesta" class="view"><header class="top"><button class="back-btn" id="btnBackEncuesta" aria-label="Volver">‹</button><button class="help-btn" id="btnHelpEncuesta" aria-label="Ayuda">?</button><button class="tools-btn" onclick="toggleToolsMenu(event)" aria-label="Herramientas" title="Herramientas">⚙️</button><h1>Mi</h1><div class="script">Encuesta</div><p>Compartí invitaciones privadas</p></header><div class="gestion-shell" id="surveyToolContent"></div></section>
  <section id="view-gestion" class="view"><header class="top"><button class="back-btn" id="btnBackGestion" aria-label="Volver">‹</button><button class="help-btn" id="btnHelpGestion" aria-label="Ayuda">?</button><button class="tools-btn" onclick="toggleToolsMenu(event)" aria-label="Herramientas" title="Herramientas">⚙️</button><h1>Mi</h1><div class="script">Gestión</div><p>Encuestados, referidos y seguimiento</p></header><div class="gestion-shell" id="gestionContent"></div></section>`;
  const sections=[...wrapper.children];sections.forEach(section=>grab.parentNode.insertBefore(section,grab));
  $('btnBackEncuesta').onclick=()=>{window.showView('view-home');if(window.renderHomeCompleto)window.renderHomeCompleto()};$('btnBackGestion').onclick=()=>{closeContactDetail();window.showView('view-home');if(window.renderHomeCompleto)window.renderHomeCompleto()};
  $('btnHelpEncuesta').onclick=()=>window.APPIDialog.alert('Compartí tu enlace personal por WhatsApp. Cada respuesta llegará automáticamente a Mi Gestión y sólo será visible para tu cuenta.',{title:'Cómo usar Mi Encuesta',icon:'📋'});
  $('btnHelpGestion').onclick=()=>window.APPIDialog.alert('Usá los estados para avanzar cada oportunidad. Podés llamar, abrir WhatsApp, guardar notas y programar el próximo contacto. Todo se sincroniza con tu cuenta.',{title:'Cómo usar Mi Gestión',icon:'🤝'});
}

function startPolling(){clearInterval(state.pollTimer);state.pollTimer=setInterval(()=>{const active=document.getElementById('view-gestion')?.classList.contains('active');if(active&&authorized()&&navigator.onLine&&!state.loading)refreshManagement(false)},30000)}
function resetForAccount(){state.link=null;state.contacts=[];state.surveys=new Map();state.filter='todos';state.search='';state.currentId='';state.lastLoaded=0;updateBadges()}
function init(){
  if(state.initialized)return;state.initialized=true;installStyles();injectSections();startPolling();
  window.addEventListener('online',()=>{const bar=$('gestionOffline');if(bar)bar.hidden=true;flushQueue().then(()=>{if($('view-gestion')?.classList.contains('active'))refreshManagement(false)})});
  window.addEventListener('offline',()=>{const bar=$('gestionOffline');if(bar)bar.hidden=false});
  window.addEventListener('appi-auth-change',()=>{resetForAccount();setTimeout(()=>{if(authorized()){loadCache();updateBadges()}},100)});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&$('view-gestion')?.classList.contains('active')&&navigator.onLine)refreshManagement(false)});
  if(authorized()){loadCache();updateBadges()}
}

window.openEncuestaTool=openEncuestaTool;
window.openMiGestion=openMiGestion;
window.closeGestionDetail=closeContactDetail;
window.APPIGestion={state,open:openMiGestion,refresh:refreshManagement,createInvitation:createSurveyInvitation,surveyUrl,shareMessage,flushQueue,updateBadges};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
