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
const state={link:null,enviando:false,contacts:[],surveys:new Map(),activities:new Map(),filter:'todos',search:'',view:'hoy',agenda:'appi',loading:false,lastError:'',currentId:'',lastLoaded:0,initialized:false,pollTimer:null,bulkQueue:[]};

function config(){return window.APPIAuth&&window.APPIAuth.config?window.APPIAuth.config():window.APPI_AUTH||{}}
function profile(){return window.APPIAuth&&window.APPIAuth.currentProfile?window.APPIAuth.currentProfile():null}
function userId(){return window.APPIAuth&&window.APPIAuth.userId?window.APPIAuth.userId():''}
function authorized(){return !!(window.APPIAuth&&window.APPIAuth.isEnabled&&window.APPIAuth.isEnabled()&&window.APPIAuth.isLocallyAuthorized&&window.APPIAuth.isLocallyAuthorized()&&userId())}
function api(path){return String(config().url||'').replace(/\/$/,'')+path}
function token(){return window.APPIAuth&&window.APPIAuth.accessToken?window.APPIAuth.accessToken():''}
function readJson(text){try{return text?JSON.parse(text):null}catch(e){return null}}
function uuidV4(){if(crypto.randomUUID)return crypto.randomUUID();const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;const h=[...bytes].map(v=>v.toString(16).padStart(2,'0')).join('');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`}

async function cloudFetch(path,options={},retry=true){
  if(!authorized())throw new Error('Iniciá sesión con tu cuenta de distribuidor.');
  let response;
  try{
    response=await fetch(api(path),{...options,cache:'no-store',headers:{apikey:config().anonKey,Authorization:`Bearer ${token()}`,...(options.headers||{})}});
  }catch(error){const e=new Error('Sin conexión. El panel mostrará la última copia guardada.');e.network=true;throw e}
  if(response.status===401&&retry&&window.APPIAuth&&window.APPIAuth.refresh){await window.APPIAuth.refresh();return cloudFetch(path,options,false)}
  const text=await response.text(),body=readJson(text);
  if(!response.ok){const e=new Error(body&&body.message||body&&body.error||text||`Error ${response.status}`);e.status=response.status;throw e}
  return body;
}

function cacheKey(){return `appi_gestion_cache_v1_${userId()}`}
/* El panel es privado (v295): aunque la base o una caché vieja devuelvan
   filas de otras cuentas (pasaba con la sesión admin), acá no entran. */
function soloMios(rows){const uid=userId();return (Array.isArray(rows)?rows:[]).filter(row=>row&&(!row.user_id||row.user_id===uid))}
function queueKey(){return `appi_gestion_queue_v1_${userId()}`}
function loadCache(){
  try{const value=JSON.parse(localStorage.getItem(cacheKey())||'null');if(value&&Array.isArray(value.contacts)){state.contacts=soloMios(value.contacts);state.surveys=new Map(soloMios(value.surveys||[]).map(row=>[row.id,row]));state.activities=new Map();for(const row of soloMios(value.activities||[])){const list=state.activities.get(row.contacto_id)||[];list.push(row);state.activities.set(row.contacto_id,list)}state.lastLoaded=Number(value.savedAt)||0;loadBulkQueue();return true}}catch(e){}
  return false;
}
function saveCache(){
  if(!userId())return;
  try{localStorage.setItem(cacheKey(),JSON.stringify({contacts:state.contacts,surveys:[...state.surveys.values()],activities:[...state.activities.values()].flat(),savedAt:Date.now()}))}catch(e){}
}
function loadQueue(){try{const q=JSON.parse(localStorage.getItem(queueKey())||'[]');return Array.isArray(q)?q:[]}catch(e){return []}}
function saveQueue(queue){try{localStorage.setItem(queueKey(),JSON.stringify(queue))}catch(e){}}
function queueMutation(id,method,payload){
  const queue=loadQueue().filter(item=>!(item.kind!=='activity'&&item.id===id));
  queue.push({kind:'contact',id,method,payload,queuedAt:Date.now()});saveQueue(queue);
}
function queueActivity(payload){const queue=loadQueue();queue.push({kind:'activity',id:payload.id,method:'POST',payload,queuedAt:Date.now()});saveQueue(queue)}
function queueHistoricoImport(tempId,payload){const queue=loadQueue();queue.push({kind:'historico_import',id:tempId,method:'POST',payload,queuedAt:Date.now()});saveQueue(queue)}
async function flushQueue(){
  if(!navigator.onLine||!authorized())return false;
  if(state.queueFlushing)return state.queueFlushing;
  state.queueFlushing=(async()=>{
    while(navigator.onLine&&authorized()){
      const queue=loadQueue();if(!queue.length)return true;const item=queue[0];
      try{
        if(item.kind==='activity')await cloudFetch('/rest/v1/appi_gestion_actividades',{method:'POST',headers:{'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(item.payload)});
        else if(item.kind==='historico_import'){
          const imported=await importarPersona(item.payload),realId=imported&&imported.id;
          if(realId){const tempId=item.id,local=state.contacts.find(contact=>contact.id===tempId);if(local){Object.assign(local,imported,{id:realId});delete local.pendiente_de_subir}const rewritten=loadQueue().map(current=>{if(current.id===tempId)current.id=realId;if(current.payload&&current.payload.contacto_id===tempId)current.payload.contacto_id=realId;return current});saveQueue(rewritten);item.id=realId;saveCache()}
        }else await cloudFetch(`/rest/v1/appi_gestion_contactos?id=eq.${encodeURIComponent(item.id)}`,{method:item.method,headers:{'Content-Type':'application/json',Prefer:'return=minimal'},body:item.method==='DELETE'?undefined:JSON.stringify(item.payload)});
        saveQueue(loadQueue().filter(current=>!(current.kind===item.kind&&current.id===item.id)));
      }catch(error){return false}
    }
    return false;
  })();
  try{return await state.queueFlushing}finally{state.queueFlushing=null}
}

function installStyles(){
  if($('appiGestionStyles'))return;
  const style=document.createElement('style');style.id='appiGestionStyles';style.textContent=`
  .gestion-shell{max-width:760px;margin:0 auto;padding-bottom:35px}.gestion-hero{position:relative;overflow:hidden;padding:19px;border-radius:23px;margin-bottom:12px;color:#fff;background:linear-gradient(135deg,#3c67ca 0%,#725bd6 64%,#a06bff 100%);box-shadow:0 14px 30px rgba(72,82,180,.22)}.gestion-hero:after{content:"";position:absolute;width:180px;height:180px;right:-72px;top:-90px;border-radius:50%;background:rgba(255,255,255,.12)}.gestion-hero>*{position:relative;z-index:1}.gestion-hero .eyebrow{font-size:9px;font-weight:950;letter-spacing:.9px;text-transform:uppercase;opacity:.78}.gestion-hero h2{font-size:21px;line-height:1.08;margin:6px 0 6px;letter-spacing:-.5px}.gestion-hero p{font-size:11px;line-height:1.45;margin:0;max-width:520px;opacity:.88}.gestion-card{padding:15px;border-radius:20px;background:rgba(255,255,255,.65);border:1px solid rgba(255,255,255,.84);box-shadow:0 8px 22px rgba(68,76,118,.07);margin-bottom:11px}.gestion-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:12px}.gestion-card-head h3{font-size:14px;margin:0;color:#282837}.gestion-card-head p{font-size:10.5px;color:#777887;margin:3px 0 0;line-height:1.35}.gestion-badge{padding:5px 9px;border-radius:999px;background:rgba(91,141,239,.12);color:#3d63c9;font-size:8.5px;font-weight:950;white-space:nowrap}.survey-link-box{padding:12px;border-radius:15px;background:rgba(91,141,239,.07);border:1px solid rgba(91,141,239,.13)}.survey-link-box label{display:block;color:#777887;font-size:8.5px;font-weight:950;text-transform:uppercase;letter-spacing:.4px}.survey-link-value{margin-top:5px;color:#3d63c9;font-size:10px;font-weight:800;line-height:1.35;overflow-wrap:anywhere;user-select:text}.survey-actions{display:grid;grid-template-columns:1.35fr 1fr;gap:7px;margin-top:10px}.survey-actions button{min-height:42px;border:0;border-radius:12px;font:inherit;font-size:9.5px;font-weight:950;cursor:pointer}.survey-actions .wa{color:#fff;background:linear-gradient(135deg,#25d366,#128c7e);box-shadow:0 6px 14px rgba(18,140,126,.2)}.survey-actions .copy{color:#3d63c9;background:rgba(91,141,239,.11)}.survey-actions .preview{color:#7650c8;background:rgba(160,107,255,.1)}.survey-flow{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.survey-flow>div{padding:12px 8px;border-radius:15px;background:rgba(255,255,255,.62);border:1px solid rgba(255,255,255,.78);text-align:center}.survey-flow b{width:29px;height:29px;margin:0 auto 6px;border-radius:10px;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,#5b8def,#a06bff);font-size:11px}.survey-flow strong{display:block;color:#383846;font-size:10px}.survey-flow small{display:block;margin-top:3px;color:#777887;font-size:8.5px;line-height:1.3}.gestion-notice{padding:13px;border-radius:16px;background:rgba(245,179,1,.08);border:1px solid rgba(245,179,1,.18);color:#795d20;font-size:10.5px;line-height:1.45}.gestion-empty{text-align:center;padding:31px 17px;border:1px dashed rgba(91,141,239,.28);border-radius:19px;background:rgba(255,255,255,.4)}.gestion-empty .ico{font-size:33px}.gestion-empty h3{margin:8px 0 5px;font-size:14px}.gestion-empty p{margin:0 auto;color:#777887;font-size:10.5px;line-height:1.45;max-width:430px}.gestion-primary,.gestion-secondary,.gestion-danger{min-height:39px;border:0;border-radius:12px;padding:9px 12px;font:inherit;font-size:10px;font-weight:950;cursor:pointer}.gestion-primary{color:#fff;background:linear-gradient(135deg,#5b8def,#875fdd);box-shadow:0 6px 15px rgba(91,112,210,.21)}.gestion-secondary{color:#3d63c9;background:rgba(91,141,239,.1)}.gestion-danger{color:#c3434c;background:rgba(217,83,89,.09)}.gestion-toolbar{padding:12px;border-radius:18px;background:rgba(255,255,255,.6);border:1px solid rgba(255,255,255,.78);box-shadow:0 8px 22px rgba(68,76,118,.06);margin-bottom:11px}.gestion-search{position:relative}.gestion-search input{width:100%;min-height:43px;padding:10px 38px 10px 12px;border:1px solid rgba(80,90,130,.12);border-radius:13px;background:rgba(255,255,255,.76);color:#292938;font:inherit;font-size:12px;outline:none}.gestion-search input:focus{border-color:#5b8def;box-shadow:0 0 0 3px rgba(91,141,239,.1)}.gestion-search span{position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:15px}.gestion-filters{display:flex;gap:5px;overflow-x:auto;margin-top:9px;padding-bottom:1px;scrollbar-width:none}.gestion-filters::-webkit-scrollbar{display:none}.gestion-filter{flex:0 0 auto;border:0;border-radius:10px;padding:8px 10px;background:rgba(80,90,130,.07);color:#6a6b78;font:inherit;font-size:9px;font-weight:900;white-space:nowrap;cursor:pointer}.gestion-filter.active{color:#fff;background:linear-gradient(135deg,#5b8def,#875fdd);box-shadow:0 4px 11px rgba(91,112,210,.2)}.gestion-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:11px}.gestion-stat{padding:11px 5px;border-radius:17px;background:rgba(255,255,255,.62);border:1px solid rgba(255,255,255,.78);box-shadow:0 7px 17px rgba(68,76,118,.06);text-align:center}.gestion-stat span{font-size:15px}.gestion-stat b{display:block;margin-top:2px;color:#3d63c9;font-size:20px;line-height:1}.gestion-stat small{display:block;margin-top:4px;color:#777887;font-size:7.5px;font-weight:950;text-transform:uppercase}.gestion-list{display:grid;gap:8px}.gestion-contact{padding:13px;border-radius:19px;background:rgba(255,255,255,.65);border:1px solid rgba(255,255,255,.82);box-shadow:0 8px 20px rgba(68,76,118,.065)}.gestion-contact-top{display:grid;grid-template-columns:40px minmax(0,1fr) auto;gap:10px;align-items:start}.gestion-avatar{width:40px;height:40px;border-radius:13px;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,#5b8def,#a06bff);font-size:17px}.gestion-contact h3{margin:1px 0 3px;color:#292938;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gestion-contact-line{color:#777887;font-size:9.5px;line-height:1.4}.gestion-status{padding:5px 8px;border-radius:999px;font-size:8px;font-weight:950;white-space:nowrap}.gestion-tags{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px}.gestion-tag{padding:4px 7px;border-radius:8px;background:rgba(80,90,130,.07);color:#686977;font-size:8px;font-weight:850}.gestion-tag.source{background:rgba(160,107,255,.09);color:#7750c7}.gestion-contact-actions{display:grid;grid-template-columns:1fr 1fr 1.15fr;gap:6px;margin-top:10px}.gestion-contact-actions a,.gestion-contact-actions button{min-height:35px;border:0;border-radius:10px;display:flex;align-items:center;justify-content:center;text-decoration:none;font:inherit;font-size:8.5px;font-weight:950;cursor:pointer}.gestion-contact-actions .wa{color:#197454;background:rgba(58,208,164,.14)}.gestion-contact-actions .call{color:#3d63c9;background:rgba(91,141,239,.12)}.gestion-contact-actions .detail{color:#714bc3;background:rgba(160,107,255,.1)}.gestion-offline{margin-bottom:9px;padding:8px 10px;border-radius:12px;background:rgba(233,154,32,.09);color:#8a6116;font-size:9.5px;font-weight:750}.gestion-offline[hidden]{display:none}.gestion-detail-overlay{position:fixed;inset:0;z-index:25000;display:flex;justify-content:flex-end;background:rgba(20,22,38,.46);backdrop-filter:blur(8px)}.gestion-detail-overlay[hidden]{display:none}.gestion-drawer{width:min(100%,510px);height:100%;overflow-y:auto;padding:18px 17px max(25px,env(safe-area-inset-bottom));background:linear-gradient(150deg,#eef4ff,#faf8ff 58%,#eef9f6);box-shadow:-15px 0 50px rgba(28,31,68,.25)}.gestion-drawer-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}.gestion-drawer-head h2{margin:0;color:#292938;font-size:20px;line-height:1.15}.gestion-drawer-head p{margin:4px 0 0;color:#777887;font-size:10px}.gestion-close{width:36px;height:36px;flex:none;border:0;border-radius:12px;background:rgba(80,90,130,.08);color:#666776;font-size:19px}.gestion-detail-section{padding:14px;border-radius:18px;background:rgba(255,255,255,.67);border:1px solid rgba(255,255,255,.82);box-shadow:0 7px 19px rgba(68,76,118,.06);margin-bottom:9px}.gestion-detail-section h3{margin:0 0 10px;color:#3d63c9;font-size:11px;text-transform:uppercase;letter-spacing:.35px}.gestion-detail-row{display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-bottom:1px solid rgba(80,90,130,.08);font-size:10px;line-height:1.35}.gestion-detail-row:last-child{border-bottom:0}.gestion-detail-row span:first-child{color:#777887}.gestion-detail-row span:last-child{max-width:62%;text-align:right;color:#333440;font-weight:850;overflow-wrap:anywhere}.gestion-status-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}.gestion-status-btn{min-height:39px;border:1px solid rgba(80,90,130,.1);border-radius:11px;background:rgba(247,248,255,.7);color:#626370;font:inherit;font-size:9px;font-weight:900}.gestion-status-btn.active{color:#fff;border-color:transparent;background:linear-gradient(135deg,#5b8def,#875fdd);box-shadow:0 4px 11px rgba(91,112,210,.19)}.gestion-field{display:grid;gap:5px;margin-top:9px}.gestion-field label{color:#686977;font-size:9px;font-weight:950;text-transform:uppercase;letter-spacing:.3px}.gestion-field input,.gestion-field textarea{width:100%;border:1px solid rgba(80,90,130,.13);border-radius:12px;background:rgba(255,255,255,.75);padding:10px 11px;color:#292938;font:inherit;font-size:12px;outline:none}.gestion-field textarea{min-height:105px;resize:vertical}.gestion-field input:focus,.gestion-field textarea:focus{border-color:#5b8def;box-shadow:0 0 0 3px rgba(91,141,239,.1)}.gestion-detail-actions{display:grid;grid-template-columns:1.3fr 1fr;gap:7px;margin-top:11px}.gestion-detail-actions button{min-height:43px;border:0;border-radius:12px;font:inherit;font-size:10px;font-weight:950}.gestion-answer{display:grid;grid-template-columns:44% 1fr;gap:9px;padding:7px 0;border-bottom:1px solid rgba(80,90,130,.08);font-size:9.5px;line-height:1.35}.gestion-answer:last-child{border-bottom:0}.gestion-answer span:first-child{color:#777887}.gestion-answer span:last-child{text-align:right;color:#333440;font-weight:850;overflow-wrap:anywhere}.gestion-refresh-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 2px 8px;color:#777887;font-size:8.5px}.gestion-refresh-row button{border:0;background:transparent;color:#3d63c9;font:inherit;font-size:8.5px;font-weight:950}.gestion-sidebar-badge{min-width:19px;height:19px;margin-left:auto;padding:0 5px;border-radius:999px;display:inline-grid!important;place-items:center;background:#e95757;color:#fff!important;font-size:8px!important;font-weight:950}.gestion-sidebar-badge[hidden]{display:none!important}.home-tool-badge{position:absolute;right:8px;top:7px;min-width:19px;height:19px;padding:0 5px;border-radius:999px;display:grid;place-items:center;background:#e95757;color:#fff;font-size:8px;font-weight:950;box-shadow:0 4px 9px rgba(217,83,89,.28)}
  body.dark .gestion-card,body.dark .gestion-toolbar,body.dark .gestion-stat,body.dark .gestion-contact,body.dark .gestion-detail-section{background:rgba(30,30,50,.58);border-color:rgba(255,255,255,.08)}body.dark .gestion-card-head h3,body.dark .gestion-contact h3,body.dark .gestion-drawer-head h2,body.dark .gestion-detail-row span:last-child,body.dark .gestion-answer span:last-child{color:#f0f0f5}body.dark .survey-link-box,body.dark .survey-flow>div{background:rgba(29,31,49,.58);border-color:rgba(255,255,255,.07)}body.dark .survey-flow strong{color:#e7e7ed}body.dark .gestion-search input,body.dark .gestion-field input,body.dark .gestion-field textarea,body.dark .gestion-status-btn{background:rgba(28,29,46,.72);border-color:rgba(255,255,255,.09);color:#f0f0f5}body.dark .gestion-drawer{background:linear-gradient(150deg,#171827,#25213a 58%,#162b2a)}
  @media(max-width:520px){.survey-actions{grid-template-columns:1fr}.survey-actions .wa{grid-column:auto}.survey-flow{grid-template-columns:1fr}.gestion-stats{grid-template-columns:repeat(2,1fr)}.gestion-contact-actions{grid-template-columns:1fr 1fr}.gestion-contact-actions .detail{grid-column:1/-1}.gestion-status-grid{grid-template-columns:1fr 1fr}.gestion-drawer{padding-left:12px;padding-right:12px}}
  `;document.head.appendChild(style);
}

// v217 · Mi Encuesta se reduce a un solo botón. La animación acompaña el envío
// real: el avión sale cuando la invitación ya se creó en el servidor.
function installShareStyles(){
  if($('appiShareStyles'))return;
  const style=document.createElement('style');style.id='appiShareStyles';style.textContent=`
  .share-stage{display:grid;place-items:center;padding:6px 0 2px}
  .share-btn{position:relative;width:min(100%,330px);min-height:130px;border:0;border-radius:28px;cursor:pointer;overflow:hidden;color:#fff;font:inherit;background:linear-gradient(135deg,#3c67ca 0%,#725bd6 62%,#a06bff 100%);box-shadow:0 16px 34px rgba(72,82,180,.3);transition:transform .18s ease,box-shadow .18s ease;-webkit-tap-highlight-color:transparent}
  .share-btn:hover{transform:translateY(-2px);box-shadow:0 20px 40px rgba(72,82,180,.36)}
  .share-btn:active{transform:scale(.975)}
  .share-btn:disabled{cursor:default}
  .share-btn:focus-visible{outline:3px solid #fff;outline-offset:3px}
  .share-btn .glow{position:absolute;width:210px;height:210px;right:-84px;top:-104px;border-radius:50%;background:rgba(255,255,255,.14)}
  .share-face{position:relative;z-index:2;display:grid;place-items:center;gap:7px;padding:20px 16px;transition:opacity .22s ease,transform .22s ease}
  .share-face .plane{font-size:34px;line-height:1;filter:drop-shadow(0 5px 10px rgba(20,24,70,.28))}
  .share-face strong{font-size:16.5px;letter-spacing:-.3px}
  .share-face small{font-size:10.5px;opacity:.9;font-weight:700}
  .share-btn.sending .share-face,.share-btn.done .share-face{opacity:0;transform:scale(.92)}
  /* El avión cruza la tarjeta: refuerza la idea de que la encuesta viaja. */
  .share-fly{position:absolute;z-index:3;left:50%;top:50%;font-size:32px;opacity:0;pointer-events:none;transform:translate(-50%,-50%)}
  .share-btn.sending .share-fly{animation:shareFly 1s cubic-bezier(.5,0,.75,.2) forwards}
  @keyframes shareFly{
    0%{opacity:0;transform:translate(-50%,-50%) scale(.6) rotate(-12deg)}
    22%{opacity:1;transform:translate(-50%,-50%) scale(1.06) rotate(-6deg)}
    100%{opacity:0;transform:translate(190%,-235%) scale(.5) rotate(16deg)}
  }
  /* Estela: tres puntos que persiguen al avión. */
  .share-trail{position:absolute;z-index:2;left:50%;top:50%;display:flex;gap:6px;opacity:0;transform:translate(-160%,-50%)}
  .share-trail i{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.85)}
  .share-btn.sending .share-trail{animation:shareTrail 1s ease-out forwards}
  .share-btn.sending .share-trail i:nth-child(2){animation:shareDot .5s .1s ease-out}
  .share-btn.sending .share-trail i:nth-child(3){animation:shareDot .5s .2s ease-out}
  @keyframes shareTrail{0%{opacity:0}30%{opacity:.9}100%{opacity:0;transform:translate(60%,-120%)}}
  @keyframes shareDot{0%{transform:scale(.4)}50%{transform:scale(1.25)}100%{transform:scale(.4)}}
  .share-done{position:absolute;z-index:4;inset:0;display:grid;place-items:center;gap:6px;align-content:center;opacity:0;transform:scale(.9);pointer-events:none}
  .share-btn.done .share-done{animation:shareDone .34s cubic-bezier(.2,1.5,.5,1) forwards}
  @keyframes shareDone{to{opacity:1;transform:scale(1)}}
  .share-done .tick{width:48px;height:48px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.2);font-size:25px}
  .share-done b{font-size:14px}
  .share-hint{margin:11px auto 0;max-width:330px;text-align:center;color:#777887;font-size:10.5px;line-height:1.5}
  .share-recent{margin-top:13px}
  .share-recent h3{margin:0 0 9px;color:#3d63c9;font-size:10px;text-transform:uppercase;letter-spacing:.4px}
  .share-row{display:flex;align-items:center;gap:10px;padding:9px 11px;border-radius:14px;background:rgba(255,255,255,.62);border:1px solid rgba(255,255,255,.8);margin-bottom:6px}
  .share-row .who{width:32px;height:32px;flex:none;border-radius:11px;display:grid;place-items:center;color:#fff;font-size:14px;background:linear-gradient(135deg,#5b8def,#a06bff)}
  .share-row .txt{min-width:0;flex:1}
  .share-row b{display:block;color:#292938;font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .share-row small{color:#777887;font-size:9px}
  .share-row a{flex:none;padding:7px 11px;border-radius:10px;text-decoration:none;color:#197454;background:rgba(58,208,164,.16);font-size:9px;font-weight:950}
  .share-row.sent a{color:#6a6b78;background:rgba(80,90,130,.08)}
  body.dark .share-row{background:rgba(30,30,50,.58);border-color:rgba(255,255,255,.08)}
  body.dark .share-row b{color:#f0f0f5}
  @media (prefers-reduced-motion:reduce){
    .share-btn,.share-face{transition:none}
    .share-btn.sending .share-fly,.share-btn.sending .share-trail,.share-btn.done .share-done{animation-duration:.01ms}
  }`;
  document.head.appendChild(style);
}

function installGenteStyles(){
  if(document.getElementById('appiGenteStyles'))return;
  const style=document.createElement('style');style.id='appiGenteStyles';style.textContent=`
  .gente-acciones{display:grid;gap:11px;margin:2px 0 14px}
  /* Los dos accesos principales, mismo ancho y misma altura. */
  .gente-par{display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:stretch}
  .gente-par>*{min-width:0}
  .gente-acciones .share-stage{margin:0;height:100%;padding:0;display:block}
  .gente-acciones .share-btn{width:100%;height:100%;min-height:118px}
  .gente-add{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;width:100%;min-height:118px;padding:14px 12px;border:1.5px dashed #c9b7f5;border-radius:22px;background:#faf7ff;color:#6b4bb8;cursor:pointer;text-align:center;transition:background .15s,border-color .15s}
  .gente-add .gente-add-ico{font-size:23px;line-height:1;font-weight:700}
  .gente-add strong{font-size:15px;font-weight:850}
  .gente-add small{font-size:11px;opacity:.75}
  .gente-add:hover,.gente-add:focus-visible{background:#f3ecff;border-color:#a06bff}
  .gente-add.abierto{background:#efe6ff;border-style:solid;border-color:#a06bff}
  .gente-add:active{transform:scale(.99)}
  .gente-nota{margin:0;padding:10px 13px;border-radius:13px;background:#f4f7ff;border:1px solid rgba(91,141,239,.16);color:#4b5573;font-size:12px;line-height:1.5}
  .gente-nota b{color:#3d63c9}
  /* Formulario de alta */
  .gente-form{display:grid;gap:9px;padding:15px 14px 16px;border-radius:19px;background:#fff;border:1px solid rgba(91,141,239,.17);box-shadow:0 10px 30px rgba(60,70,120,.09)}
  .gente-form[hidden]{display:none}
  .gente-form-head{display:flex;align-items:center;justify-content:space-between}
  .gente-form-head h3{margin:0;font-size:16px;color:#292938}
  .gente-form-x{border:0;background:rgba(80,90,130,.09);color:#666776;width:30px;height:30px;border-radius:50%;font-size:19px;line-height:1;cursor:pointer}
  .gente-campo{display:grid;gap:4px}
  .gente-campo span{font-size:11.5px;font-weight:800;color:#6a6b7a;letter-spacing:.2px}
  .gente-campo input,.gente-campo select,.gente-campo textarea{width:100%;padding:11px 12px;border:1px solid rgba(80,90,130,.16);border-radius:12px;background:#f8f9ff;color:#292938;font:inherit;font-size:14px;outline:none;box-sizing:border-box}
  .gente-campo input:focus,.gente-campo select:focus,.gente-campo textarea:focus{border-color:#5b8def;box-shadow:0 0 0 3px rgba(91,141,239,.12)}
  .gente-campo input.mal,.gente-campo textarea.mal{border-color:#d9534f;box-shadow:0 0 0 3px rgba(217,83,79,.13)}
  .gente-campo textarea{resize:vertical;min-height:52px}
  .gente-error{margin:0;padding:9px 11px;border-radius:11px;background:rgba(217,83,79,.09);color:#b8433f;font-size:12.5px;line-height:1.45;font-weight:600}
  .gente-error[hidden]{display:none}
  .gente-guardar{margin-top:2px;border:0;border-radius:13px;padding:13px;background:linear-gradient(135deg,#5b8def,#8b63e8);color:#fff;font-weight:850;font-size:15px;cursor:pointer}
  .gente-guardar:disabled{opacity:.6;cursor:default}
  @media(max-width:359px){.gente-par{grid-template-columns:1fr}}
  .gente-pendientes{margin:0 0 13px}
  .gente-completar{display:block;width:100%;margin:10px 0 0;border:0;border-radius:12px;padding:11px 12px;background:linear-gradient(135deg,#f59e0b,#f97316);color:#fff;font-weight:800;font-size:14px;cursor:pointer}
  .gente-completar:active{transform:scale(.99)}
  `;document.head.appendChild(style);
}
function installV204Styles(){
  if($('appiGestionV204Styles'))return;
  const style=document.createElement('style');style.id='appiGestionV204Styles';style.textContent=`
  .gestion-main-tabs{display:flex;justify-content:center;gap:5px;margin:0 0 11px;padding:5px;border-radius:17px;background:rgba(255,255,255,.62);border:1px solid rgba(255,255,255,.78);box-shadow:0 8px 22px rgba(68,76,118,.06)}.gestion-main-tabs>.gestion-main-tab{flex:1 1 0;min-width:0;max-width:170px}
  .gestion-main-tab{min-height:43px;border:0;border-radius:12px;background:transparent;color:#70717e;font:inherit;font-size:8.8px;font-weight:950;cursor:pointer;display:grid;place-items:center;gap:2px}.gestion-main-tab span{font-size:15px;line-height:1}.gestion-main-tab.active{color:#fff;background:linear-gradient(135deg,#5b8def,#875fdd);box-shadow:0 5px 13px rgba(91,112,210,.22)}
  .gestion-section-title{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:14px 3px 8px}.gestion-section-title h3{margin:0;color:#343441;font-size:13px}.gestion-section-title small{color:#858692;font-size:8.5px;font-weight:850}
  .gestion-contact.priority-high{border-left:4px solid #e05b78}.gestion-contact.priority-medium{border-left:4px solid #7b68df}.gestion-contact.overdue{box-shadow:0 9px 24px rgba(217,83,89,.11)}
  .gestion-priority-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:8px}.gestion-priority-pill{padding:4px 7px;border-radius:999px;font-size:7.8px;font-weight:950}.gestion-priority-pill.high{color:#c23f60;background:rgba(224,91,120,.11)}.gestion-priority-pill.medium{color:#654fc1;background:rgba(123,104,223,.11)}.gestion-priority-pill.low{color:#47776b;background:rgba(58,180,145,.1)}.gestion-priority-reason{color:#777887;font-size:8.5px;font-weight:750;line-height:1.3}
  .gestion-next-action{margin-top:8px;padding:7px 9px;border-radius:10px;background:rgba(91,141,239,.065);color:#556277;font-size:8.8px;font-weight:800;line-height:1.35}.gestion-next-action.due{background:rgba(217,83,89,.08);color:#a9444b}
  .gestion-funnel{display:grid;gap:8px}.gestion-funnel-stage{display:grid;grid-template-columns:42px minmax(0,1fr) auto;gap:10px;align-items:center;width:100%;padding:12px;border:1px solid rgba(255,255,255,.8);border-radius:17px;background:rgba(255,255,255,.62);font:inherit;text-align:left;cursor:pointer}.gestion-funnel-icon{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;color:#fff;font-size:18px}.gestion-funnel-stage strong{display:block;color:#30303d;font-size:11px}.gestion-funnel-stage small{display:block;margin-top:3px;color:#777887;font-size:8.5px}.gestion-funnel-stage b{color:#3d63c9;font-size:20px}.gestion-funnel-bar{height:5px;margin-top:6px;border-radius:99px;background:rgba(80,90,130,.08);overflow:hidden}.gestion-funnel-bar i{display:block;height:100%;border-radius:99px}
  .gestion-result-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.gestion-result{padding:14px;border-radius:18px;background:rgba(255,255,255,.64);border:1px solid rgba(255,255,255,.8);text-align:center}.gestion-result span{font-size:20px}.gestion-result b{display:block;margin-top:3px;color:#3d63c9;font-size:24px;line-height:1}.gestion-result small{display:block;margin-top:5px;color:#777887;font-size:8px;font-weight:900;line-height:1.2;text-transform:uppercase}.gestion-result.wide{grid-column:1/-1;text-align:left}.gestion-result.wide b{font-size:18px}
  .gestion-priority-detail{padding:12px;border-radius:15px;background:linear-gradient(135deg,rgba(91,141,239,.10),rgba(160,107,255,.08));border:1px solid rgba(91,141,239,.13)}.gestion-priority-detail b{display:block;color:#3d63c9;font-size:12px}.gestion-priority-detail p{margin:5px 0 0;color:#696a78;font-size:9.5px;line-height:1.4}
  .gestion-message-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}.gestion-message-link{min-height:40px;padding:8px;border:0;border-radius:11px;display:flex;align-items:center;justify-content:center;text-align:center;text-decoration:none;background:rgba(58,208,164,.12);color:#197454;font-size:8.5px;font-weight:950;line-height:1.2}.gestion-message-link:nth-child(even){background:rgba(91,141,239,.10);color:#3d63c9}
  .gestion-timeline{position:relative;display:grid;gap:0}.gestion-event{position:relative;padding:0 0 13px 27px}.gestion-event:before{content:"";position:absolute;left:7px;top:17px;bottom:-2px;width:2px;background:rgba(91,141,239,.13)}.gestion-event:last-child:before{display:none}.gestion-event-dot{position:absolute;left:0;top:1px;width:16px;height:16px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#5b8def,#875fdd);color:#fff;font-size:7px}.gestion-event b{display:block;color:#363642;font-size:9.5px}.gestion-event small{display:block;margin-top:2px;color:#858692;font-size:8px}.gestion-event p{margin:3px 0 0;color:#686976;font-size:9px;line-height:1.35}
  .survey-bulk-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:8px}.survey-bulk-actions button{min-height:40px;border:0;border-radius:12px;font:inherit;font-size:9px;font-weight:950}.survey-bulk-actions .agenda{color:#fff;background:linear-gradient(135deg,#3abf99,#5b8def)}.survey-bulk-actions .manual{color:#3d63c9;background:rgba(91,141,239,.10)}.survey-bulk-list{display:grid;gap:7px;margin-top:10px}.survey-bulk-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:9px;align-items:center;padding:10px;border-radius:14px;background:rgba(255,255,255,.58);border:1px solid rgba(255,255,255,.76)}.survey-bulk-item b{display:block;color:#343441;font-size:10px}.survey-bulk-item small{display:block;margin-top:2px;color:#777887;font-size:8px}.survey-bulk-item a{min-height:34px;padding:7px 10px;border-radius:10px;display:flex;align-items:center;text-decoration:none;background:linear-gradient(135deg,#25d366,#128c7e);color:#fff;font-size:8.5px;font-weight:950}.survey-bulk-item.sent{opacity:.62}.survey-bulk-item.sent a{background:rgba(80,90,130,.1);color:#686977}
  body.dark .gestion-main-tabs,body.dark .gestion-funnel-stage,body.dark .gestion-result,body.dark .survey-bulk-item{background:rgba(30,30,50,.58);border-color:rgba(255,255,255,.08)}body.dark .gestion-section-title h3,body.dark .gestion-funnel-stage strong,body.dark .gestion-event b,body.dark .survey-bulk-item b{color:#f0f0f5}
  @media(max-width:520px){.gestion-main-tab{font-size:7.8px}.gestion-message-grid{grid-template-columns:1fr}.survey-bulk-actions{grid-template-columns:1fr}.gestion-contact-top{grid-template-columns:38px minmax(0,1fr)}.gestion-contact-top>.gestion-status{grid-column:2;justify-self:start}.gestion-funnel-stage{grid-template-columns:38px minmax(0,1fr) auto}.gestion-funnel-icon{width:38px;height:38px}}
  `;document.head.appendChild(style)
}

function surveyUrl(invitation=state.link){
  if(!invitation||!invitation.token)return '';
  const base=new URL('./encuesta.html',location.href);base.search='';base.hash='';base.searchParams.set('t',invitation.token);return base.toString();
}
function distributorFirstName(){const active=window.APPIAuth&&window.APPIAuth.activePerson?window.APPIAuth.activePerson():null,full=String(active?.nombre||profile()?.nombre||'').trim();return full.split(/\s+/)[0]||''}
function shareMessage(url,recipientName=''){
  const name=distributorFirstName(),recipient=String(recipientName||'').trim().split(/\s+/)[0]||'';
  return `¡Hola${recipient?', '+recipient:''}! 😊 Soy ${name}.\n\nEstoy realizando una encuesta que es muy importante para mí. Gracias a esto puedo seguir acercando información a más familias sobre cómo cuidar su bienestar.\n\n¿Me ayudás completándola? Te va a llevar sólo unos minutos:\n${url}\n\n¡Muchas gracias por tu tiempo! 💙`;
}
function isAdmin(){return profile()&&profile().rol==='admin'}

async function createSurveyInvitation(renderAfter=true){
  if(!authorized())throw new Error('Iniciá sesión para compartir una encuesta.');
  if(isAdmin())throw new Error('Las invitaciones pertenecen a las cuentas distribuidoras.');
  const person=window.APPIAuth&&window.APPIAuth.activePerson?window.APPIAuth.activePerson():null,rows=await cloudFetch('/rest/v1/rpc/appi_crear_invitacion_encuesta',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({p_persona_tipo:person?.tipo==='socio'?'socio':'titular'})});
  const invitation=Array.isArray(rows)?rows[0]:rows;
  if(!invitation||!invitation.token)throw new Error('No pudimos crear la invitación privada.');
  state.link=invitation;if(renderAfter)renderSurveyTool();return invitation;
}

function bulkKey(){return `appi_encuesta_cola_v1_${userId()}`}
function loadBulkQueue(){try{const rows=JSON.parse(localStorage.getItem(bulkKey())||'[]');state.bulkQueue=Array.isArray(rows)?rows.filter(row=>new Date(row.expires_at||0).getTime()>Date.now()):[]}catch(e){state.bulkQueue=[]}}
function saveBulkQueue(){try{localStorage.setItem(bulkKey(),JSON.stringify(state.bulkQueue))}catch(e){}}
function contactPickerValue(value){return Array.isArray(value)?String(value.find(Boolean)||'').trim():String(value||'').trim()}
async function addBulkRecipients(recipients){
  const existing=new Set(state.bulkQueue.map(row=>phoneDigits(row.telefono)).filter(Boolean)),valid=[];
  for(const row of recipients||[]){const nombre=String(row.nombre||'').trim().slice(0,120),telefono=String(row.telefono||'').trim().slice(0,30),key=phoneDigits(telefono);if(nombre&&key.length>=8&&!existing.has(key)&&valid.length<20){existing.add(key);valid.push({nombre,telefono})}}
  if(!valid.length){await window.APPIDialog.alert('No encontramos contactos nuevos con nombre y teléfono.',{title:'Sin destinatarios nuevos',icon:'📇'});return}
  showToastSafe(`Preparando ${valid.length} invitación${valid.length===1?'':'es'}…`,2200);
  try{
    for(const person of valid){const invitation=await createSurveyInvitation(false);state.bulkQueue.push({id:uuidV4(),nombre:person.nombre,telefono:person.telefono,token:invitation.token,expires_at:invitation.expires_at,url:surveyUrl(invitation),sent:false,created_at:new Date().toISOString()})}
    saveBulkQueue();renderSurveyTool();await window.APPIDialog.alert(`${valid.length} invitación${valid.length===1?'':'es'} privada${valid.length===1?'':'s'} lista${valid.length===1?'':'s'} para enviar una por una.`,{title:'Envíos preparados',icon:'✓',okText:'Comenzar'});
  }catch(error){saveBulkQueue();renderSurveyTool();await window.APPIDialog.alert(error.message,{title:'No pudimos completar la cola',icon:'!'})}
}
function markBulkSent(id,rerender=true){const item=state.bulkQueue.find(row=>row.id===id);if(item){item.sent=true;item.sent_at=new Date().toISOString();saveBulkQueue();if(rerender)setTimeout(renderSurveyTool,400)}}
function renderSurveyTool(){
  const c=$('surveyToolContent');if(!c)return;
  if(isAdmin()){
    c.innerHTML=`<div class="gestion-empty"><div class="ico">🔒</div><h3>Herramienta para distribuidores</h3><p>Administración gestiona APPI, pero no tiene número de distribuidor. Cada persona genera sus propias invitaciones privadas.</p></div>`;return;
  }
  // Una sola acción visible. Los tokens, vencimientos y URLs son detalles de
  // implementación que el distribuidor no necesita ver.
  c.innerHTML=`
    <div class="share-stage">
      <button type="button" class="share-btn" id="surveyShareBtn">
        <span class="glow"></span>
        <span class="share-face"><span class="plane">📨</span><strong>Enviar encuesta</strong><small>Se abre WhatsApp para elegir el contacto</small></span>
        <span class="share-fly" aria-hidden="true">✈️</span>
        <span class="share-trail" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="share-done" aria-hidden="true"><span class="tick">✓</span><b>¡Lista para enviar!</b></span>
      </button>
    </div>
    <p class="share-hint">Cada envío crea una encuesta nueva. Las respuestas aparecen solas acá abajo.</p>`;
  if($('surveyShareBtn'))$('surveyShareBtn').onclick=startShareFlow;
}

// Un solo toque: se crea la invitación, vuela el avión y WhatsApp abre su
// propio selector de contactos. Elegir a la persona es tarea de WhatsApp.
async function startShareFlow(){
  const button=$('surveyShareBtn');
  if(!button||button.disabled)return;

  // En Android el envío viaja por un intent:// en la pestaña actual, así que no
  // hace falta (ni conviene) abrir una ventana: quedaría un about:blank vacío.
  // En el resto de las plataformas seguimos abriéndola dentro del gesto del
  // usuario, porque pedirla después de esperar al servidor la bloquearía.
  const usaIntent=!!(window.APPIWhatsApp&&window.APPIWhatsApp.esAndroid());
  const popup=usaIntent?null:window.open('about:blank','_blank');
  button.disabled=true;
  // Mientras vuela el avión, un refresco automático no puede borrar el botón.
  state.enviando=true;
  try{
    // La invitación se crea primero: la animación confirma un envío real.
    const invitation=await createSurveyInvitation(false),url=surveyUrl(invitation);
    await playShareAnimation(button);
    const wa=`https://wa.me/?text=${encodeURIComponent(shareMessage(url))}`;
    // El popup ya está abierto dentro del gesto; APPIWhatsApp lo redirige a la app elegida.
    if(window.APPIWhatsApp) await window.APPIWhatsApp.abrir(wa,{popup});
    else if(popup)popup.location.href=wa;else location.href=wa;
  }catch(error){
    if(popup)popup.close();
    button.classList.remove('sending','done');
    await window.APPIDialog.alert(error.message,{title:'No pudimos crear la invitación',icon:'!'});
  }finally{
    button.disabled=false;state.enviando=false;
    if(state.reRender){state.reRender=false;renderManagement()}
  }
}

// El avión cruza la tarjeta y deja el tilde de confirmación.
function playShareAnimation(button){
  return new Promise(resolve=>{
    const reducido=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    button.classList.remove('done');button.classList.add('sending');
    setTimeout(()=>{button.classList.add('done');setTimeout(()=>{button.classList.remove('sending','done');resolve()},reducido?60:620)},reducido?60:980);
  });
}

async function copyText(text){
  try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(text);else{const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();document.execCommand('copy');area.remove()}showToastSafe('Enlace copiado ✓')}catch(error){await window.APPIDialog.alert(text,{title:'Copiá tu enlace',icon:'🔗'})}
}
function showToastSafe(message,duration=1800){if(typeof window.showToast==='function')window.showToast(message,duration);else window.APPIDialog.alert(message,{title:'APPI',icon:'✓'})}

async function openEncuestaTool(){
  // Mi Encuesta se unificó en el Panel de Contactos: el botón vive arriba de todo.
  return openMiGestion();
}
function statusInfo(value){return STATUSES[value]||STATUSES.nuevo}
function phoneDigits(value){return String(value||'').replace(/\D/g,'').slice(0,15)}
function whatsappDigits(value){if(!window.APPITel)return '';if(window.APPITel.primeroValido)return window.APPITel.primeroValido(value);return window.APPITel.normalizar(value)}
function localISODate(value=new Date()){const d=value instanceof Date?value:new Date(value);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function addDaysISO(days){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+Number(days||0));return localISODate(d)}
function formatDate(value,withTime=false){if(!value)return '-';const raw=String(value),d=/^\d{4}-\d{2}-\d{2}$/.test(raw)?new Date(`${raw}T12:00:00`):new Date(value);if(Number.isNaN(d.getTime()))return raw;return new Intl.DateTimeFormat('es-AR',withTime?{dateStyle:'short',timeStyle:'short'}:{dateStyle:'medium'}).format(d)}
function formatAgo(value){const time=new Date(value||0).getTime();if(!time)return 'sin actividad';const diff=Math.max(0,Date.now()-time),mins=Math.floor(diff/60000),hours=Math.floor(diff/3600000),days=Math.floor(diff/86400000);if(mins<2)return 'recién';if(mins<60)return `hace ${mins} min`;if(hours<24)return `hace ${hours} h`;if(days===1)return 'ayer';return `hace ${days} días`}
function closedContact(c){return ['convertido','no_interesado'].includes(c.estado)}
function shortTime(value){const raw=String(value==null?'':value);return /^\d{2}:\d{2}/.test(raw)?raw.slice(0,5):''}
function isTodayContact(c){return !!c.proximo_contacto&&c.proximo_contacto===localISODate()&&!closedContact(c)}
function isOverdueContact(c){return !!c.proximo_contacto&&c.proximo_contacto<localISODate()&&!closedContact(c)}
function surveyFor(c){return c&&c.encuesta_id?state.surveys.get(c.encuesta_id)||null:null}
function answerValues(survey,key){const value=survey&&survey.respuestas&&survey.respuestas[key];return Array.isArray(value)?value.map(String):value==null?[]:[String(value)]}
function answerHas(survey,key,matcher){return answerValues(survey,key).some(value=>typeof matcher==='string'?value===matcher:matcher.test(value))}
function priorityFor(c){
  if(closedContact(c))return {score:0,level:'low',label:'Cerrado',reasons:[statusInfo(c.estado).label]};
  let score=5;const reasons=[];const ageHours=Math.max(0,(Date.now()-new Date(c.created_at||Date.now()).getTime())/3600000),survey=c.tipo==='encuestado'?surveyFor(c):null;
  if(c.estado==='nuevo'){score+=25;reasons.push(ageHours>24?'Nuevo hace más de 24 h':'Todavía sin contactar')}
  if(isOverdueContact(c)){score+=38;reasons.unshift('Seguimiento vencido')}
  else if(isTodayContact(c)){score+=32;reasons.unshift('Seguimiento para hoy')}
  if(c.estado==='presentacion'){score+=24;reasons.push('Presentación en curso')}
  if(c.estado==='seguimiento'&&!c.proximo_contacto){score+=15;reasons.push('Seguimiento sin fecha')}
  if(c.tipo==='referido'){score+=10;reasons.push(c.referido_por?`Referido por ${c.referido_por}`:'Referido nuevo')}
  if(survey){
    if(answerHas(survey,'oportunidad','Sí, mucho')){score+=32;reasons.push('Muy interesado en la oportunidad')}
    else if(answerHas(survey,'oportunidad','Quiero más info')){score+=29;reasons.push('Pidió más información')}
    else if(answerHas(survey,'oportunidad','Sí, algo')){score+=18;reasons.push('Tiene interés')}
    if(answerHas(survey,'evitar_sustancias','Sí')){score+=9;reasons.push('Quiere cuidar el agua familiar')}
    if(answerHas(survey,'alternativas_evitar',/Filtro|Purificador/i)){score+=7;reasons.push('Conoce alternativas de purificación')}
    if(answerHas(survey,'conoces',/varios|alguno/i)){score+=6;reasons.push('Conoce personas buscando cambios')}
    const referrals=Array.isArray(survey.referidos)?survey.referidos.filter(row=>row&&row.nombre).length:0;if(referrals){score+=Math.min(12,referrals*3);reasons.push(`${referrals} referido${referrals===1?'':'s'} aportado${referrals===1?'':'s'}`)}
  }
  const level=score>=60?'high':score>=34?'medium':'low';return {score,level,label:level==='high'?'Prioridad alta':level==='medium'?'Prioridad media':'Prioridad normal',reasons:[...new Set(reasons)].slice(0,3)}
}
function actionableContacts(){return state.contacts.filter(c=>!closedContact(c)&&(c.estado==='nuevo'||isTodayContact(c)||isOverdueContact(c)||c.estado==='presentacion'||(c.estado==='seguimiento'&&!c.proximo_contacto))).sort((a,b)=>priorityFor(b).score-priorityFor(a).score||new Date(a.created_at)-new Date(b.created_at))}
function actionCount(){return new Set(actionableContacts().map(c=>c.id)).size}
function filteredContacts(){const query=state.search.trim().toLowerCase();let list=state.contacts.filter(c=>{const matchFilter=state.filter==='todos'||c.estado===state.filter,haystack=`${c.nombre||''} ${c.telefono||''} ${c.zona||''} ${c.referido_por||''}`.toLowerCase();return matchFilter&&(!query||haystack.includes(query))}).sort((a,b)=>priorityFor(b).score-priorityFor(a).score||new Date(b.updated_at||b.created_at||0)-new Date(a.updated_at||a.created_at||0));if(window.APPITarjetas&&window.APPITarjetas.filterPersonas)list=window.APPITarjetas.filterPersonas(list);return list}
function countStatus(status){return state.contacts.filter(c=>c.estado===status).length}
function updateBadges(){const count=actionCount();for(const id of ['gestionSidebarBadge','homeGestionBadge']){const el=$(id);if(!el)continue;el.textContent=count>99?'99+':String(count);el.hidden=count===0}}
function contactFirstName(c){return String(c&&c.nombre||'').trim().split(/\s+/)[0]||'¿cómo estás?'}
function messageFor(c,type='recommended'){
  const first=contactFirstName(c),sender=distributorFirstName(),survey=surveyFor(c),opportunity=answerValues(survey,'oportunidad').join(', '),date=c.proximo_contacto?formatDate(c.proximo_contacto):'';
  if(type==='recommended')type=c.estado==='nuevo'?'first':c.estado==='presentacion'?'presentation':c.tipo==='encuestado'&&Array.isArray(survey?.referidos)&&survey.referidos.length?'thanks':'followup';
  if(type==='first'&&c.tipo==='referido')return `Hola ${first}, ¿cómo estás? 😊\n\nSoy ${sender}. ${c.referido_por?`${c.referido_por} me pasó tu contacto`:'Me pasaron tu contacto'} porque pensó${c.referido_por?'':'n'} que lo que hago te podía interesar.\n\nTe escribo para presentarme, nada más. Si en algún momento tenés ganas de que charlemos, avisame.`;
  if(type==='first')return `Hola ${first}! ¿Cómo andás? 😊\n\nSoy ${sender}, gracias por responder la encuesta.\n\n${opportunity?'Vi tu respuesta sobre la oportunidad y quería':'Quería'} presentarme por si querés que lo charlemos.`;
  if(type==='presentation')return `Hola ${first}! ¿Cómo andás? 😊\n\nSoy ${sender}, te escribo para confirmar que nos vemos${date?` el ${date}`:''}.\n\nSi te surgió algo y necesitás cambiarlo, decime tranquilo que lo movemos.`;
  if(type==='thanks')return `Hola ${first}! 😊\n\nQuería agradecerte por los contactos que me pasaste. Gracias por la confianza!`;
  return `Hola ${first}! ¿Cómo va? 😊\n\nSoy ${sender}, pasaba a saludarte y a ver cómo venías con lo que habíamos hablado.`
}
function recommendedTemplate(c){return c.estado==='nuevo'?'first':c.estado==='presentacion'?'presentation':c.tipo==='encuestado'&&Array.isArray(surveyFor(c)?.referidos)&&surveyFor(c).referidos.length?'thanks':'followup'}
function whatsappUrlFor(c,type='recommended'){const num=whatsappDigits(c.telefono);return num?`https://wa.me/${num}?text=${encodeURIComponent(messageFor(c,type))}`:''}
function nextActionFor(c){if(isOverdueContact(c))return {text:`Seguimiento vencido · ${formatDate(c.proximo_contacto)}`,due:true};if(isTodayContact(c))return {text:'Seguimiento programado para hoy',due:true};if(c.estado==='nuevo')return {text:`Primer contacto pendiente · ingresó ${formatAgo(c.created_at)}`,due:false};if(c.estado==='seguimiento'&&!c.proximo_contacto)return {text:'Falta programar el próximo contacto',due:true};if(c.estado==='presentacion')return {text:c.proximo_contacto?`Presentación · ${formatDate(c.proximo_contacto)}${shortTime(c.proximo_contacto_hora)?` · ${shortTime(c.proximo_contacto_hora)}`:''}`:'Definir fecha de presentación',due:false};return {text:`Última actualización ${formatAgo(c.updated_at||c.created_at)}`,due:false}}
function activitiesFor(contactId){return (state.activities.get(contactId)||[]).slice().sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))}
function addActivityLocal(activity){const list=state.activities.get(activity.contacto_id)||[];if(!list.some(row=>row.id===activity.id))list.unshift(activity);state.activities.set(activity.contacto_id,list);saveCache()}
function logActivity(contactId,type,detail='',metadata={}){if(!contactId||!userId())return;const owner=state.contacts.find(contact=>contact.id===contactId)?.user_id||userId(),activity={id:uuidV4(),user_id:owner,contacto_id:contactId,tipo:type,detalle:String(detail||'').slice(0,1000),metadata:metadata||{},created_at:new Date().toISOString()};addActivityLocal(activity);queueActivity(activity);if(navigator.onLine)flushQueue().catch(()=>{});return activity}
async function persistContact(contact,payload){Object.assign(contact,payload,{updated_at:new Date().toISOString()});saveCache();updateBadges();try{if(!navigator.onLine)throw Object.assign(new Error('offline'),{network:true});await cloudFetch(`/rest/v1/appi_gestion_contactos?id=eq.${encodeURIComponent(contact.id)}`,{method:'PATCH',headers:{'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(payload)});return true}catch(error){if(error.network){queueMutation(contact.id,'PATCH',payload);return false}throw error}}
function contactCard(c){const s=statusInfo(c.estado),telDigits=phoneDigits(c.telefono),priority=priorityFor(c),next=nextActionFor(c),type=c.tipo==='referido'?'Referido':c.tipo==='encuestado'?'Encuestado':'Manual',wa=whatsappUrlFor(c),overdue=isOverdueContact(c);return `<article class="gestion-contact priority-${priority.level} ${overdue?'overdue':''}" data-contact-id="${esc(c.id)}"><div class="gestion-contact-top"><div class="gestion-avatar">${c.tipo==='referido'?'👥':'👤'}</div><div><h3>${esc(c.nombre||'Sin nombre')}</h3><div class="gestion-contact-line">📱 ${esc(c.telefono||'Sin teléfono')}</div>${c.zona?`<div class="gestion-contact-line">📍 ${esc(c.zona)}</div>`:''}</div><span class="gestion-status" style="color:${s.color};background:${s.color}18">${s.icon} ${esc(s.label)}</span></div><div class="gestion-priority-row"><span class="gestion-priority-pill ${priority.level}">${esc(priority.label)}</span><span class="gestion-priority-reason">${esc(priority.reasons.join(' · ')||type)}</span></div><div class="gestion-tags"><span class="gestion-tag source">${esc(type)}</span>${c.referido_por?`<span class="gestion-tag">Referido por ${esc(c.referido_por)}</span>`:''}${Number(c.cantidad_origenes)>1?`<span class="gestion-tag">${Number(c.cantidad_origenes)} orígenes</span>`:''}</div><div class="gestion-next-action ${next.due?'due':''}">${esc(next.text)}</div><div class="gestion-contact-actions"><a class="wa" href="${esc(wa)}" target="_blank" rel="noopener" data-contact-channel="whatsapp" data-contact-id="${esc(c.id)}">💬 WhatsApp</a><a class="call" href="tel:${telDigits}" data-contact-channel="llamada" data-contact-id="${esc(c.id)}">📞 Llamar</a><button type="button" class="detail" data-open-contact="${esc(c.id)}">Ver y gestionar</button></div></article>`}

// ── Panel de Contactos: alta manual e importación de los Contactos viejos ──
// Las dos pasan por la misma función de la base (appi_gente_importar_contacto),
// así que un teléfono repetido nunca genera dos fichas.
// Alta sin internet: se guarda igual en el teléfono y se sube sola después.
// Devuelve el contacto que ya se puede mostrar, con un id provisorio que
// flushQueue reemplaza por el real cuando vuelve la conexión.
function altaLocalPendiente(datos){
  const now=new Date().toISOString();
  const contact={
    id:`local-alta-${uuidV4()}`,
    user_id:userId(),
    tipo:'manual',
    nombre:String(datos.nombre||'').trim(),
    telefono:String(datos.telefono||''),
    telefono_normalizado:phoneDigits(datos.telefono),
    interes:String(datos.interes||''),
    estado:String(datos.estado||'nuevo'),
    notas:String(datos.notas||''),
    proximo_contacto:datos.proximo||null,
    origen_local_id:String(datos.localId||''),
    metadata:{origen:'alta_offline'},
    cantidad_origenes:1,
    pendiente_de_subir:true,
    created_at:now,
    updated_at:now
  };
  // Si ya está en el teléfono con el mismo número, no se agrega dos veces.
  const repetido=contact.telefono_normalizado&&state.contacts.find(c=>phoneDigits(c.telefono)===contact.telefono_normalizado);
  if(repetido)return repetido;
  state.contacts.unshift(contact);
  saveCache();
  updateBadges();
  queueHistoricoImport(contact.id,{...datos,localId:datos.localId||contact.id});
  return contact;
}

async function importarPersona(datos){
  // Sin conexión no se pierde el contacto: entra a la cola y se sube al volver.
  if(!navigator.onLine)return altaLocalPendiente(datos);
  const filas=await cloudFetch('/rest/v1/rpc/appi_gente_importar_contacto',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
    p_nombre:String(datos.nombre||'').trim(),
    p_telefono:String(datos.telefono||''),
    p_interes:String(datos.interes||''),
    p_estado:String(datos.estado||'nuevo'),
    p_notas:String(datos.notas||''),
    p_proximo:datos.proximo||null,
    p_local_id:String(datos.localId||''),
    p_zona:String(datos.zona||'')
  })}).catch(error=>{
    // Se cortó justo al enviar: mismo camino que si nunca hubo internet.
    if(error&&(error.network||!navigator.onLine))return null;
    throw error;
  });
  if(filas===null)return altaLocalPendiente(datos);
  // La función de la base devuelve sólo el id (un uuid suelto). Quien llama
  // espera un contacto con .id, así que se normaliza acá una sola vez.
  const cruda=Array.isArray(filas)?filas[0]:filas;
  if(cruda&&typeof cruda==='object')return cruda;
  if(typeof cruda==='string'&&cruda)return {id:cruda,nombre:String(datos.nombre||'').trim(),telefono:String(datos.telefono||''),telefono_normalizado:phoneDigits(datos.telefono)};
  return cruda;
}

function telefonoValido(valor){const d=phoneDigits(valor);return d.length>=8&&d.length<=15}

function genteFormError(mensaje,foco){
  const caja=$('genteError');
  if(caja){caja.textContent=mensaje||'';caja.hidden=!mensaje}
  if(foco&&$(foco)){$(foco).focus();$(foco).classList.add('mal');setTimeout(()=>$(foco)&&$(foco).classList.remove('mal'),1800)}
}
function abrirFormularioGente(abrir){
  const form=$('genteForm'),boton=$('genteNuevo');
  if(!form)return;
  form.hidden=!abrir;
  if(boton)boton.classList.toggle('abierto',!!abrir);
  if(!abrir&&state.reRender){state.reRender=false;setTimeout(renderManagement,0);return}
  if(abrir){genteFormError('');if($('genteNombre'))setTimeout(()=>$('genteNombre').focus(),60)}
}
async function nuevaPersonaManual(){
  if(!authorized()){await window.APPIDialog.alert('Necesitás iniciar sesión con tu cuenta de distribuidor para agregar contactos.',{title:'Panel de Contactos',icon:'🔒'});return}
  abrirFormularioGente($('genteForm')&&$('genteForm').hidden);
}
async function guardarPersonaManual(){
  if(!authorized()){genteFormError('Necesitás iniciar sesión para guardar.');return}
  const nombre=String($('genteNombre')?$('genteNombre').value:'').trim();
  const telefono=String($('genteTelefono')?$('genteTelefono').value:'').trim();
  const interes=String($('genteInteres')?$('genteInteres').value:'');
  const notas=String($('genteNotas')?$('genteNotas').value:'').trim();
  if(nombre.length<2){genteFormError('Escribí el nombre (al menos 2 letras).','genteNombre');return}
  if(!telefonoValido(telefono)){genteFormError('El teléfono necesita entre 8 y 15 números, con característica y sin el 0 ni el 15.','genteTelefono');return}
  const boton=$('genteGuardar');
  if(boton){boton.disabled=true;boton.textContent='Guardando…'}
  genteFormError('');
  try{
    const guardado=await importarPersona({nombre,telefono,interes,estado:'nuevo',notas});
    // Se limpia recién cuando quedó guardado: si falla, no se pierde lo escrito.
    for(const id of ['genteNombre','genteTelefono','genteNotas'])if($(id))$(id).value='';
    if($('genteInteres'))$('genteInteres').value='';
    abrirFormularioGente(false);
    const primerNombre=nombre.split(/\s+/)[0];
    if(guardado&&guardado.pendiente_de_subir)showToastSafe(`${primerNombre} quedó guardado. Se sube solo al volver internet ✓`,3000);
    else showToastSafe(`${primerNombre} ya está en tu panel ✓`);
    if(navigator.onLine)await refreshManagement(false);
    else renderManagement();
  }catch(error){
    genteFormError(mensajeDeAlta(error,nombre));
  }finally{if($('genteGuardar')){$('genteGuardar').disabled=false;$('genteGuardar').textContent='Guardar contacto'}}
}
// La base habla en técnico; acá se traduce a algo accionable.
function mensajeDeAlta(error,nombre){
  const crudo=String(error&&error.message||'');
  if(error&&error.network)return 'Sin internet. Conectate y probá de nuevo.';
  if(/duplicate key|already exists|uidx/i.test(crudo))return 'Ya tenés a alguien con ese teléfono. Buscalo en la solapa Todos.';
  if(/teléfono válido|telefono/i.test(crudo))return 'Revisá el teléfono: necesita entre 8 y 15 números.';
  if(/iniciar sesión|JWT|401/i.test(crudo))return 'Se cerró la sesión. Volvé a entrar y probá otra vez.';
  if(/function .*does not exist|PGRST202|404/i.test(crudo))return 'Falta correr la migración de la base (SUPABASE_MI_GENTE.sql) en Supabase.';
  return crudo||`No pudimos guardar a ${nombre}. Probá de nuevo.`;
}

// Los Contactos viejos vivían solo en este teléfono (localStorage). Se suben
// una vez y queda la marca para no volver a preguntar.
const SEG_KEY_LOCAL='seguimientoPersonas';
function migradoKey(){return `appi_gente_migrado_v1_${userId()}`}
function leerContactosLocales(){try{const filas=JSON.parse(localStorage.getItem(SEG_KEY_LOCAL)||'[]');return Array.isArray(filas)?filas:[]}catch(e){return []}}
function contactosPendientes(){
  const filas=leerContactosLocales(),conTel=[],sinTel=[],yaMigro=!!localStorage.getItem(migradoKey());
  for(const fila of filas){
    if(!fila||!String(fila.nombre||'').trim())continue;
    if(telefonoValido(fila.telefono)){if(!yaMigro)conTel.push(fila)}
    else sinTel.push(fila);
  }
  return {conTel,sinTel,total:filas.length};
}
async function migrarContactosLocales(){
  const {conTel,sinTel}=contactosPendientes();
  // Sin nada para subir no se molesta al usuario: los que no tienen teléfono ya
  // se avisan con un cartel fijo en la pantalla, no con una pregunta cada vez.
  if(!conTel.length)return false;
  const detalle=sinTel.length?`\n\nOjo: ${sinTel.length} no tienen teléfono cargado (${sinTel.slice(0,3).map(f=>f.nombre).join(', ')}${sinTel.length>3?'…':''}). Esas quedan en este teléfono hasta que les pongas el número.`:'';
  const ok=await window.APPIDialog.confirm(`Encontramos ${conTel.length} contacto${conTel.length===1?'':'s'} guardado${conTel.length===1?'':'s'} en este teléfono. ¿Los subimos a tu Panel de Contactos para que no se pierdan?${detalle}`,{title:'Traer mis Contactos',icon:'📥',okText:'Sí, subirlos'});
  if(!ok)return false;
  let subidos=0,fallados=[];
  for(const fila of conTel){
    try{
      await importarPersona({nombre:fila.nombre,telefono:fila.telefono,interes:fila.interes||'',estado:fila.estado||'',notas:fila.notas||'',proximo:fila.fecha||null,localId:String(fila.id||'')});
      subidos++;
    }catch(error){fallados.push(fila.nombre)}
  }
  if(subidos&&!fallados.length)localStorage.setItem(migradoKey(),new Date().toISOString());
  await refreshManagement(false);
  const resto=fallados.length?`\n\nNo pudimos subir: ${fallados.join(', ')}. Probá de nuevo más tarde.`:'';
  const pendiente=sinTel.length?`\n\nQuedaron ${sinTel.length} sin teléfono. Cargales el número y volvé a entrar para subirlas.`:'';
  await window.APPIDialog.alert(`Subimos ${subidos} contacto${subidos===1?'':'s'} a tu panel.${pendiente}${resto}`,{title:'Listo',icon:'✓'});
  return true;
}

function gentePendientesHTML(){
  const {sinTel}=contactosPendientes();
  if(!sinTel.length)return '';
  const nombres=sinTel.slice(0,3).map(f=>String(f.nombre||'').trim()).filter(Boolean).join(', ');
  return `<div class="gestion-notice gente-pendientes"><b>📱 ${sinTel.length} contacto${sinTel.length===1?'':'s'} sin teléfono.</b> ${esc(nombres)}${sinTel.length>3?'…':''} ${sinTel.length===1?'quedó':'quedaron'} en este teléfono porque sin número no se le puede escribir ni llamar. Cargales el número y se suben solos.<button type="button" class="gente-completar" id="genteCompletar">Completar los que faltan</button></div>`;
}
function gentePrimaryActionsHTML(){
  if(isAdmin())return '';
  return `<div class="gente-acciones">
    <div class="gente-par">
      <div class="share-stage">
        <button type="button" class="share-btn" id="surveyShareBtn">
          <span class="glow"></span>
          <span class="share-face"><span class="plane">📨</span><strong>Enviar encuesta</strong><small>Se abre WhatsApp</small></span>
          <span class="share-fly" aria-hidden="true">✈️</span>
          <span class="share-trail" aria-hidden="true"><i></i><i></i><i></i></span>
          <span class="share-done" aria-hidden="true"><span class="tick">✓</span><b>¡Lista!</b></span>
        </button>
      </div>
      <button type="button" class="gente-add" id="genteNuevo">
        <span class="gente-add-ico">＋</span>
        <strong>Agregar contacto</strong>
        <small>Cargalo a mano</small>
      </button>
    </div>
    <p class="gente-nota">💡 <b>La encuesta es una herramienta de retorno</b>, no reemplaza el trabajo cara a cara: el contacto de verdad se genera en la demostración.</p>
    ${genteFormHTML()}
  </div>`;
}

// Un formulario a la vista, sin ventanitas encadenadas: se ve lo que se carga
// y el error aparece al lado del campo que lo causó.
function genteFormHTML(){
  return `<form class="gente-form" id="genteForm" hidden autocomplete="off">
    <div class="gente-form-head"><h3>Nuevo contacto</h3><button type="button" class="gente-form-x" id="genteFormCerrar" aria-label="Cerrar">×</button></div>
    <label class="gente-campo"><span>Nombre y apellido</span><input id="genteNombre" type="text" placeholder="Ej: María López" autocomplete="name" maxlength="120"></label>
    <label class="gente-campo"><span>Teléfono</span><input id="genteTelefono" type="tel" inputmode="tel" placeholder="Ej: 351 555 1234" autocomplete="tel" maxlength="25"></label>
    <label class="gente-campo"><span>¿Por qué lo contactamos? (opcional)</span><select id="genteInteres"><option value="">Sin definir</option><option>Producto</option><option>Negocio</option><option>Canjes</option><option>Ambas cosas</option></select></label>
    <label class="gente-campo"><span>Notas (opcional)</span><textarea id="genteNotas" rows="2" maxlength="1000" placeholder="¿Dónde lo conociste? ¿Qué le interesó?"></textarea></label>
    <p class="gente-error" id="genteError" hidden></p>
    <button type="submit" class="gente-guardar" id="genteGuardar">Guardar contacto</button>
  </form>`;
}
function managementTabsHTML(){return `<div class="gestion-main-tabs">${[{id:'hoy',icon:'☀️',label:'Hoy'},{id:'todos',icon:'👥',label:'Todos'},{id:'resultados',icon:'📈',label:'Resultados'}].map(tab=>`<button type="button" class="gestion-main-tab ${state.view===tab.id?'active':''}" data-gestion-view="${tab.id}"><span>${tab.icon}</span>${tab.label}</button>`).join('')}</div>`}
function emptyManagement(icon,title,text,button=''){return `<div class="gestion-empty"><div class="ico">${icon}</div><h3>${esc(title)}</h3><p>${esc(text)}</p>${button}</div>`}
function renderTodayView(){const actions=actionableContacts(),newCount=countStatus('nuevo'),today=state.contacts.filter(isTodayContact).length,overdue=state.contacts.filter(isOverdueContact).length,presentations=countStatus('presentacion'),withoutDate=state.contacts.filter(c=>c.estado==='seguimiento'&&!c.proximo_contacto).length;return `<div class="gestion-stats"><div class="gestion-stat"><span>✨</span><b>${newCount}</b><small>Nuevos</small></div><div class="gestion-stat"><span>☀️</span><b>${today}</b><small>Para hoy</small></div><div class="gestion-stat"><span>⚠️</span><b>${overdue}</b><small>Vencidos</small></div><div class="gestion-stat"><span>🎯</span><b>${presentations}</b><small>Presentaciones</small></div></div><div class="gestion-section-title"><h3>Prioridad de hoy</h3><small>${actions.length} acción${actions.length===1?'':'es'}</small></div><div class="gestion-list">${actions.length?actions.map(contactCard).join(''):emptyManagement('🎉','Todo al día','No tenés contactos pendientes para hoy.')}</div>${withoutDate?`<div class="gestion-notice" style="margin-top:11px"><b>📅 ${withoutDate} seguimiento${withoutDate===1?'':'s'} sin fecha.</b> Abrí cada contacto y programá el próximo paso para que no quede olvidado.</div>`:''}`}
function renderFunnelView(){const stages=['nuevo','contactado','seguimiento','presentacion','convertido'],total=Math.max(1,state.contacts.filter(c=>c.estado!=='no_interesado').length),max=Math.max(1,...stages.map(countStatus)),converted=countStatus('convertido'),rate=Math.round(converted/total*100);return `<section class="gestion-card"><div class="gestion-card-head"><div><h3>Embudo comercial</h3><p>Tocá una etapa para ver sus contactos.</p></div><span class="gestion-badge">${rate}% conversión</span></div><div class="gestion-funnel">${stages.map(id=>{const info=statusInfo(id),count=countStatus(id),pct=Math.max(5,Math.round(count/max*100));return `<button type="button" class="gestion-funnel-stage" data-funnel-status="${id}"><span class="gestion-funnel-icon" style="background:${info.color}">${info.icon}</span><span><strong>${esc(info.label)}</strong><small>${Math.round(count/total*100)}% de los contactos activos</small><span class="gestion-funnel-bar"><i style="width:${pct}%;background:${info.color}"></i></span></span><b>${count}</b></button>`}).join('')}</div></section><div class="gestion-notice"><b>${countStatus('no_interesado')} no interesado${countStatus('no_interesado')===1?'':'s'}.</b> Se conserva el historial pero no aparece entre las prioridades diarias.</div>`}
function renderAllView(){const list=filteredContacts();return `<div class="gestion-toolbar"><div class="gestion-search"><input id="gestionSearch" type="search" autocomplete="off" placeholder="Buscar por nombre, teléfono, zona…" value="${esc(state.search)}"><span>⌕</span></div><div class="gestion-filters">${[{id:'todos',label:'Todos'},...Object.entries(STATUSES).map(([id,v])=>({id,label:v.label}))].map(item=>`<button type="button" class="gestion-filter ${state.filter===item.id?'active':''}" data-gestion-filter="${item.id}">${esc(item.label)}${item.id==='todos'?` · ${state.contacts.length}`:` · ${countStatus(item.id)}`}</button>`).join('')}</div></div><div class="gestion-refresh-row"><span>${state.lastLoaded?`Actualizado ${esc(formatDate(state.lastLoaded,true))}`:'Sin actualizar'}${loadQueue().length?` · ${loadQueue().length} pendiente${loadQueue().length===1?'':'s'}`:''}</span><div><button type="button" id="gestionExport">Exportar CSV</button><button type="button" id="gestionRefresh">Actualizar</button></div></div><div class="gestion-list">${list.length?list.map(contactCard).join(''):emptyManagement('📭',state.contacts.length?'No hay coincidencias':'Todavía no hay contactos',state.contacts.length?'Probá otro nombre o estado.':'Compartí una invitación desde Mi Encuesta.')}</div>`}
function firstContactHours(){const values=[];for(const c of state.contacts){const action=activitiesFor(c.id).filter(a=>['whatsapp_abierto','llamada_iniciada'].includes(a.tipo)).sort((a,b)=>new Date(a.created_at)-new Date(b.created_at))[0];if(action){const diff=(new Date(action.created_at)-new Date(c.created_at))/3600000;if(diff>=0&&diff<720)values.push(diff)}}return values.length?values.reduce((a,b)=>a+b,0)/values.length:null}
function renderResultsView(){const now=new Date(),monthStart=new Date(now.getFullYear(),now.getMonth(),1),surveys=[...state.surveys.values()].filter(row=>new Date(row.created_at)>=monthStart),newContacts=state.contacts.filter(row=>new Date(row.created_at)>=monthStart),refs=newContacts.filter(row=>row.tipo==='referido').length,converted=newContacts.filter(row=>row.estado==='convertido').length,presentations=newContacts.filter(row=>['presentacion','convertido'].includes(row.estado)).length,rate=newContacts.length?Math.round(converted/newContacts.length*100):0,avgRefs=surveys.length?(surveys.reduce((sum,row)=>sum+(Array.isArray(row.referidos)?row.referidos.length:0),0)/surveys.length).toFixed(1):'0',hours=firstContactHours();return `<section class="gestion-card"><div class="gestion-card-head"><div><h3>Resultados del mes</h3><p>${new Intl.DateTimeFormat('es-AR',{month:'long',year:'numeric'}).format(now)}</p></div><button type="button" class="gestion-secondary" id="gestionExport">Exportar CSV</button></div><div class="gestion-result-grid"><div class="gestion-result"><span>📋</span><b>${surveys.length}</b><small>Encuestas</small></div><div class="gestion-result"><span>👥</span><b>${refs}</b><small>Referidos</small></div><div class="gestion-result"><span>🎯</span><b>${presentations}</b><small>Presentaciones</small></div><div class="gestion-result"><span>✓</span><b>${converted}</b><small>Conversiones</small></div><div class="gestion-result"><span>📈</span><b>${rate}%</b><small>Conversión mensual</small></div><div class="gestion-result"><span>🤝</span><b>${avgRefs}</b><small>Referidos por encuesta</small></div><div class="gestion-result wide"><span>⏱️</span><b>${hours==null?'Sin datos':hours<1?`${Math.round(hours*60)} minutos`:hours<24?`${hours.toFixed(1)} horas`:`${(hours/24).toFixed(1)} días`}</b><small>Tiempo promedio hasta el primer intento de contacto</small></div></div></section>${renderFunnelView()}`}
function renderManagement(){const c=$('gestionContent');if(!c)return;const abierto=$('gestionDetailOverlay'),form=$('genteForm');if(state.enviando||(abierto&&!abierto.hidden)||(form&&!form.hidden)){state.reRender=true;return}// La Agenda Personal tiene su propia caché y no debe ser reemplazada
// por el estado de carga de la Agenda APPI durante una sincronización.
if(state.loading&&!state.contacts.length&&state.agenda!=='personal'){c.innerHTML=emptyManagement('⏳','Cargando tus contactos','Estamos recuperando tus contactos, encuestas y actividades.');return}if(state.view==='embudo')state.view='resultados';
// v358: el panel tiene dos agendas (APPI y personal del teléfono). El switch
// vive arriba; si está activa, el cuerpo lo dibuja su módulo.
const agendaSwitch=window.APPIAgendaPersonal?window.APPIAgendaPersonal.switchHTML():'';
const agendaPersonalOn=state.agenda==='personal'&&!!window.APPIAgendaPersonal;
const cuerpoAppi=`${gentePrimaryActionsHTML()}${gentePendientesHTML()}<div class="gestion-offline" id="gestionOffline" ${navigator.onLine?'hidden':''}>Sin conexión: estás viendo la última copia guardada. Los cambios se sincronizarán al reconectar.</div>${managementTabsHTML()}${state.view==='hoy'?renderTodayView():state.view==='embudo'?renderFunnelView():state.view==='resultados'?renderResultsView():renderAllView()}`;
c.innerHTML=`${agendaSwitch}${agendaPersonalOn&&window.APPIAgendaPersonal.html?window.APPIAgendaPersonal.html():cuerpoAppi}<div class="gestion-detail-overlay" id="gestionDetailOverlay" hidden><aside class="gestion-drawer" id="gestionDrawer" role="dialog" aria-modal="true" aria-label="Detalle del contacto"></aside></div>`;bindManagement();updateBadges();if(state.currentId)openContactDetail(state.currentId,false)}
function setManagementView(view){state.view=view;state.currentId='';renderManagement();window.scrollTo({top:0,behavior:'smooth'})}
function pendingOutcomeKey(){return `appi_gestion_resultado_pendiente_${userId()}`}
function setPendingOutcome(contactId,channel){try{localStorage.setItem(pendingOutcomeKey(),JSON.stringify({contactId,channel,at:Date.now()}))}catch(e){}}
function bindExternalActions(){document.querySelectorAll('[data-contact-channel]').forEach(link=>link.onclick=event=>{const id=link.dataset.contactId,channel=link.dataset.contactChannel,contact=state.contacts.find(item=>item.id===id);if(channel==='llamada'&&window.APPIDeviceBridge&&window.APPIDeviceBridge.shouldBridge()){event.preventDefault();window.APPIDeviceBridge.handleCall(contact);return}setPendingOutcome(id,channel);logActivity(id,channel==='whatsapp'?'whatsapp_abierto':'llamada_iniciada',channel==='whatsapp'?'Se abrió WhatsApp.':'Se inició una llamada.',{canal:channel})});if(window.APPIDeviceBridge)window.APPIDeviceBridge.decorateCallButtons()}
function bindManagement(){/* v358: la barra de tarjetas de crédito se quitó del panel (sigue en Usuarios); el switch de agendas se bindea siempre */try{if(window.APPIAgendaPersonal&&window.APPIAgendaPersonal.bind)window.APPIAgendaPersonal.bind()}catch(e){}document.querySelectorAll('[data-gestion-view]').forEach(button=>button.onclick=()=>setManagementView(button.dataset.gestionView));if($('gestionSearch'))$('gestionSearch').oninput=e=>{state.search=e.target.value;const pos=e.target.selectionStart;renderManagement();const input=$('gestionSearch');if(input){input.focus();try{input.setSelectionRange(pos,pos)}catch(err){}}};document.querySelectorAll('[data-gestion-filter]').forEach(button=>button.onclick=()=>{state.filter=button.dataset.gestionFilter;renderManagement()});document.querySelectorAll('[data-funnel-status]').forEach(button=>button.onclick=()=>{state.filter=button.dataset.funnelStatus;setManagementView('todos')});document.querySelectorAll('[data-open-contact]').forEach(button=>button.onclick=()=>openContactDetail(button.dataset.openContact));if($('gestionRefresh'))$('gestionRefresh').onclick=()=>refreshManagement(true);if($('gestionExport'))$('gestionExport').onclick=exportCsv;if($('gestionGoSurvey'))$('gestionGoSurvey').onclick=openEncuestaTool;if($('surveyShareBtn'))$('surveyShareBtn').onclick=startShareFlow;if($('genteNuevo'))$('genteNuevo').onclick=nuevaPersonaManual;
  if($('genteForm'))$('genteForm').onsubmit=e=>{e.preventDefault();guardarPersonaManual()};
  if($('genteFormCerrar'))$('genteFormCerrar').onclick=()=>abrirFormularioGente(false);if($('genteCompletar'))$('genteCompletar').onclick=()=>{if(typeof window.openSeguimiento==='function')window.openSeguimiento()};const overlay=$('gestionDetailOverlay');if(overlay)overlay.onclick=e=>{if(e.target===overlay)closeContactDetail()};bindExternalActions()}
function answerValue(value){if(Array.isArray(value))return value.length?value.join(', '):'-';if(value===undefined||value===null||value==='')return '-';return String(value)}
function surveyDetails(survey){if(!survey)return '<div class="gestion-notice">La respuesta completa no está disponible en esta copia.</div>';const answers=survey.respuestas||{};return Object.entries(ANSWER_LABELS).map(([key,label])=>{let value=answers[key];if(Array.isArray(value)&&value.includes('Otros')&&answers[key+'_otros'])value=value.map(item=>item==='Otros'?answers[key+'_otros']:item);return `<div class="gestion-answer"><span>${esc(label)}</span><span>${esc(answerValue(value))}${key==='agua_importancia'&&value!=='-'?'/10':''}</span></div>`}).join('')}
function activityInfo(type){return ({encuesta_recibida:['📋','Encuesta recibida'],referido_recibido:['👥','Referido recibido'],contacto_creado:['＋','Contacto creado'],whatsapp_abierto:['💬','WhatsApp abierto'],llamada_iniciada:['📞','Llamada iniciada'],resultado_contacto:['✓','Resultado del contacto'],estado_cambiado:['↻','Estado actualizado'],nota:['📝','Nota guardada'],seguimiento_programado:['📅','Seguimiento programado'],presentacion_programada:['🎯','Presentación programada']})[type]||['•','Actividad']}
function timelineHTML(contact){const rows=activitiesFor(contact.id);const created={id:'created',tipo:contact.tipo==='referido'?'referido_recibido':'contacto_creado',detalle:contact.tipo==='referido'&&contact.referido_por?`Referido por ${contact.referido_por}.`:'Se incorporó a Mi Gestión.',created_at:contact.created_at};const all=[...rows];if(!all.some(row=>Math.abs(new Date(row.created_at)-new Date(contact.created_at))<2000))all.push(created);all.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));return `<div class="gestion-timeline">${all.slice(0,30).map(row=>{const info=activityInfo(row.tipo);return `<div class="gestion-event"><span class="gestion-event-dot">${info[0]}</span><b>${esc(info[1])}</b><small>${esc(formatDate(row.created_at,true))}</small>${row.detalle?`<p>${esc(row.detalle)}</p>`:''}</div>`}).join('')}</div>`}
function messageLinksHTML(contact){return `<div class="gestion-message-grid">${[['first','Primer contacto'],['followup','Retomar conversación'],['presentation','Confirmar presentación'],['thanks','Agradecer referidos']].map(([type,label])=>`<a class="gestion-message-link" href="${esc(whatsappUrlFor(contact,type))}" target="_blank" rel="noopener" data-contact-channel="whatsapp" data-contact-id="${esc(contact.id)}">${esc(label)}</a>`).join('')}</div>`}
function openContactDetail(id,rerender=true){const contact=state.contacts.find(c=>c.id===id);if(!contact)return;state.currentId=id;const overlay=$('gestionDetailOverlay'),drawer=$('gestionDrawer');if(!overlay||!drawer){if(rerender){renderManagement();openContactDetail(id,false)}return}const survey=surveyFor(contact),s=statusInfo(contact.estado),telDigits=phoneDigits(contact.telefono),priority=priorityFor(contact);drawer.innerHTML=`<div class="gestion-drawer-head"><div><h2>${esc(contact.nombre)}</h2><p>${contact.tipo==='referido'?'Referido':contact.tipo==='encuestado'?'Respondió la encuesta':'Contacto manual'} · ${s.icon} ${esc(s.label)}</p></div><button type="button" class="gestion-close" id="gestionDetailClose" aria-label="Cerrar">×</button></div><section class="gestion-detail-section"><div class="gestion-priority-detail"><b>${esc(priority.label)} · ${priority.score} puntos</b><p>${esc(priority.reasons.join(' · ')||'Sin acciones urgentes.')}</p></div></section><section class="gestion-detail-section"><h3>Información de contacto</h3><div class="gestion-detail-row"><span>Teléfono</span><span>${esc(contact.telefono)}</span></div>${contact.referido_por?`<div class="gestion-detail-row"><span>Referido por</span><span>${esc(contact.referido_por)}</span></div>`:''}${contact.relacion?`<div class="gestion-detail-row"><span>Relación</span><span>${esc(contact.relacion)}</span></div>`:''}${contact.zona?`<div class="gestion-detail-row"><span>Zona</span><span>${esc(contact.zona)}</span></div>`:''}<div class="gestion-detail-row"><span>Ingresó</span><span>${esc(formatDate(contact.created_at,true))}</span></div><div class="gestion-contact-actions"><a class="wa" href="${esc(whatsappUrlFor(contact))}" target="_blank" rel="noopener" data-contact-channel="whatsapp" data-contact-id="${esc(contact.id)}">💬 WhatsApp</a><a class="call" href="tel:${telDigits}" data-contact-channel="llamada" data-contact-id="${esc(contact.id)}">📞 Llamar</a><button type="button" class="detail" id="gestionCopyPhone">Copiar teléfono</button></div></section><section class="gestion-detail-section"><h3>Mensajes preparados</h3>${messageLinksHTML(contact)}</section><section class="gestion-detail-section"><h3>Etapa comercial</h3><div class="gestion-status-grid">${Object.entries(STATUSES).map(([sid,v])=>`<button type="button" class="gestion-status-btn ${contact.estado===sid?'active':''}" data-detail-status="${sid}">${v.icon} ${esc(v.label)}</button>`).join('')}</div><div class="gestion-field"><label>Próximo contacto</label><input type="date" id="gestionNextDate" value="${esc(contact.proximo_contacto||'')}"></div><div class="gestion-field"><label>Hora de la presentación (opcional)</label><input type="time" id="gestionNextTime" value="${esc(shortTime(contact.proximo_contacto_hora))}"><small style="color:#777887;font-size:9px;line-height:1.35">Si cargás la hora, APPI te avisa 30 minutos antes en el teléfono vinculado.</small></div><div class="gestion-field"><label>Notas</label><textarea id="gestionNotes" maxlength="5000" placeholder="¿Qué hablaron? ¿Qué tenés que recordar?">${esc(contact.notas||'')}</textarea></div><div class="gestion-detail-actions"><button type="button" class="gestion-primary" id="gestionSaveContact">Guardar cambios</button><button type="button" class="gestion-danger" id="gestionDeleteContact">Eliminar</button></div></section>${contact.tipo==='encuestado'?`<section class="gestion-detail-section"><h3>Respuestas de Mi Encuesta</h3>${surveyDetails(survey)}</section>`:''}<section class="gestion-detail-section"><h3>Historial de actividades</h3>${timelineHTML(contact)}</section>`;overlay.hidden=false;if(window.bloquearScrollCuerpo)window.bloquearScrollCuerpo();else document.body.style.overflow='hidden';$('gestionDetailClose').onclick=closeContactDetail;$('gestionCopyPhone').onclick=()=>copyText(contact.telefono);document.querySelectorAll('[data-detail-status]').forEach(button=>button.onclick=()=>{document.querySelectorAll('[data-detail-status]').forEach(b=>b.classList.remove('active'));button.classList.add('active')});$('gestionSaveContact').onclick=saveCurrentContact;$('gestionDeleteContact').onclick=deleteCurrentContact;bindExternalActions()/* v358: sin tarjetas de crédito en el cajón del panel */}
function closeContactDetail(){const overlay=$('gestionDetailOverlay');if(overlay)overlay.hidden=true;if(window.liberarScrollCuerpo)window.liberarScrollCuerpo();else document.body.style.overflow='';state.currentId='';if(state.reRender){state.reRender=false;renderManagement()}}
async function saveCurrentContact(){const contact=state.contacts.find(c=>c.id===state.currentId);if(!contact)return;const old={estado:contact.estado,notas:contact.notas||'',fecha:contact.proximo_contacto||'',hora:shortTime(contact.proximo_contacto_hora)},selected=document.querySelector('[data-detail-status].active'),payload={estado:selected?selected.dataset.detailStatus:contact.estado,notas:$('gestionNotes').value.trim().slice(0,5000),proximo_contacto:$('gestionNextDate').value||null};payload.proximo_contacto_hora=payload.proximo_contacto?(shortTime($('gestionNextTime')&&$('gestionNextTime').value)||null):null;if(payload.estado!==old.estado&&payload.estado!=='nuevo')payload.ultimo_contacto=new Date().toISOString();const button=$('gestionSaveContact');if(button){button.disabled=true;button.textContent='Guardando…'};try{const online=await persistContact(contact,payload);if(payload.estado!==old.estado)logActivity(contact.id,'estado_cambiado',`Pasó de ${statusInfo(old.estado).label} a ${statusInfo(payload.estado).label}.`,{anterior:old.estado,nuevo:payload.estado});if(payload.notas&&payload.notas!==old.notas)logActivity(contact.id,'nota',payload.notas.slice(0,240));if(((payload.proximo_contacto||'')!==old.fecha||(payload.proximo_contacto_hora||'')!==old.hora)&&payload.proximo_contacto)logActivity(contact.id,payload.estado==='presentacion'?'presentacion_programada':'seguimiento_programado',`Próximo contacto: ${formatDate(payload.proximo_contacto)}${payload.proximo_contacto_hora?` a las ${payload.proximo_contacto_hora}`:''}.`,{fecha:payload.proximo_contacto,hora:payload.proximo_contacto_hora||''});showToastSafe(online?'Cambios guardados ✓':'Guardado en este dispositivo. Se sincronizará al volver internet.',online?1800:3000);closeContactDetail();renderManagement()}catch(error){if(button){button.disabled=false;button.textContent='Guardar cambios'}await window.APPIDialog.alert(error.message,{title:'No pudimos guardar',icon:'!'})}}
async function deleteCurrentContact(){const contact=state.contacts.find(c=>c.id===state.currentId);if(!contact)return;const ok=await window.APPIDialog.confirm(`Se eliminará a ${contact.nombre} de tu Panel de Contactos.`,{title:'Eliminar contacto',icon:'🗑️',okText:'Eliminar',danger:true});if(!ok)return;try{const segs=JSON.parse(localStorage.getItem(SEG_KEY_LOCAL)||'[]');if(Array.isArray(segs)){const tel=phoneDigits(contact.telefono),nom=String(contact.nombre||'').trim().toLowerCase();const next=segs.filter(p=>{const pTel=phoneDigits(p.telefono),pNom=String(p.nombre||'').trim().toLowerCase();if(contact.local_id&&String(p.id)===String(contact.local_id))return false;if(tel&&pTel&&tel===pTel)return false;if(nom&&pNom&&(nom===pNom||nom.includes(pNom)||pNom.includes(nom)))return false;return true});localStorage.setItem(SEG_KEY_LOCAL,JSON.stringify(next))}}catch(e){}if(window.culturaQuitarPorContacto)window.culturaQuitarPorContacto({id:contact.id,agendaId:contact.local_id||contact.localId||'',telefono:contact.telefono,nombre:contact.nombre});if(typeof window.renderCulturaCrecimiento==='function')window.renderCulturaCrecimiento();state.contacts=state.contacts.filter(c=>c.id!==contact.id);state.activities.delete(contact.id);saveCache();updateBadges();closeContactDetail();renderManagement();try{if(!navigator.onLine)throw Object.assign(new Error('offline'),{network:true});await cloudFetch(`/rest/v1/appi_gestion_contactos?id=eq.${encodeURIComponent(contact.id)}`,{method:'DELETE',headers:{Prefer:'return=minimal'}});showToastSafe('Contacto eliminado')}catch(error){if(error.network){queueMutation(contact.id,'DELETE',null);showToastSafe('Se eliminará de la nube al volver internet.',2600)}else await window.APPIDialog.alert(error.message,{title:'No pudimos eliminar',icon:'!'})}}
async function chooseFollowupDate(title='Próximo contacto'){const choice=await window.APPIDialog.choose('¿Cuándo querés retomarlo?',[{label:'Mañana',value:1},{label:'En 2 días',value:2},{label:'En una semana',value:7},{label:'Sin fecha',value:0}],{title,icon:'📅'});return choice?addDaysISO(choice):null}
async function applyContactOutcome(contact,result,channel){const oldStatus=contact.estado;let payload={ultimo_contacto:new Date().toISOString()},detail='';if(result==='no_response'){payload.estado='seguimiento';payload.proximo_contacto=await chooseFollowupDate('No respondió');detail='No respondió; quedó en seguimiento.'}else if(result==='talked'){payload.estado='contactado';detail='Conversación realizada.';const note=await window.APPIDialog.prompt('¿Querés dejar una nota breve?','',{title:'Conversación realizada',icon:'📝',placeholder:'Qué hablaron o qué acordaron…',okText:'Guardar'});if(note)payload.notas=[contact.notas,note.trim()].filter(Boolean).join('\n').slice(0,5000)}else if(result==='presentation'){payload.estado='presentacion';payload.proximo_contacto=await chooseFollowupDate('Programar presentación');detail='Presentación acordada.'}else if(result==='followup'){payload.estado='seguimiento';payload.proximo_contacto=await chooseFollowupDate('Programar seguimiento');detail='Necesita seguimiento.'}else if(result==='converted'){payload.estado='convertido';payload.proximo_contacto=null;detail='Marcado como convertido.'}else if(result==='not_interested'){payload.estado='no_interesado';payload.proximo_contacto=null;detail='Indicó que no está interesado.'}try{await persistContact(contact,payload);logActivity(contact.id,'resultado_contacto',detail,{resultado:result,canal:channel});if(payload.estado!==oldStatus)logActivity(contact.id,'estado_cambiado',`Pasó de ${statusInfo(oldStatus).label} a ${statusInfo(payload.estado).label}.`,{anterior:oldStatus,nuevo:payload.estado});renderManagement();showToastSafe('Resultado guardado ✓')}catch(error){await window.APPIDialog.alert(error.message,{title:'No pudimos guardar el resultado',icon:'!'})}}
async function maybeAskPendingOutcome(){if(state.outcomeOpen||!authorized())return;let pending;try{pending=JSON.parse(localStorage.getItem(pendingOutcomeKey())||'null')}catch(e){}if(!pending||Date.now()-Number(pending.at)<1200||Date.now()-Number(pending.at)>48*3600000)return;const contact=state.contacts.find(c=>c.id===pending.contactId);localStorage.removeItem(pendingOutcomeKey());if(!contact)return;state.outcomeOpen=true;try{const result=await window.APPIDialog.choose(`¿Qué pasó con ${contact.nombre}?`,[{label:'No respondió',value:'no_response'},{label:'Conversamos',value:'talked'},{label:'Presentación',value:'presentation'},{label:'Seguimiento',value:'followup'},{label:'Convertido',value:'converted'},{label:'No interesado',value:'not_interested'}],{title:pending.channel==='whatsapp'?'Resultado de WhatsApp':'Resultado de la llamada',icon:pending.channel==='whatsapp'?'💬':'📞'});if(result)await applyContactOutcome(contact,result,pending.channel)}finally{state.outcomeOpen=false}}
// Lo que todavía no subió no está en la nube: si se copiara tal cual la
// respuesta del servidor, un contacto cargado sin internet desaparecería de
// la pantalla aunque siga esperando en la cola.
function conservarPendientes(desdeLaNube){
  const pendientes=state.contacts.filter(c=>c&&c.pendiente_de_subir);
  if(!pendientes.length)return desdeLaNube;
  const enLaNube=new Set(desdeLaNube.map(c=>c.telefono_normalizado).filter(Boolean));
  const siguenFaltando=pendientes.filter(c=>!enLaNube.has(c.telefono_normalizado));
  return [...siguenFaltando,...desdeLaNube];
}

async function fetchManagement(){const contacts=await cloudFetch('/rest/v1/appi_gestion_contactos?select=id,user_id,encuesta_id,tipo,nombre,telefono,telefono_normalizado,relacion,zona,referido_por,estado,notas,proximo_contacto,proximo_contacto_hora,ultimo_contacto,cantidad_origenes,metadata,created_at,updated_at&order=updated_at.desc&limit=2000'),surveys=await cloudFetch('/rest/v1/appi_encuestas?select=id,user_id,nombre,telefono,respuestas,referidos,created_at&order=created_at.desc&limit=1000'),activities=await cloudFetch('/rest/v1/appi_gestion_actividades?select=id,user_id,contacto_id,tipo,detalle,metadata,created_at&order=created_at.desc&limit=5000');state.contacts=conservarPendientes(soloMios(contacts));state.surveys=new Map(soloMios(surveys).map(row=>[row.id,row]));state.activities=new Map();for(const row of soloMios(activities)){const list=state.activities.get(row.contacto_id)||[];list.push(row);state.activities.set(row.contacto_id,list)}state.lastLoaded=Date.now();state.lastError='';saveCache();updateBadges();notifyDueOnce()}
// Una notificación tocada en el teléfono debe llevar a la pantalla correcta,
// incluso si APPI todavía está cargando o pidiendo quién es la persona activa.
function pendingNotificationKey(){return 'appi_gestion_notificacion_pendiente'}
function rememberNotification(intent){try{localStorage.setItem(pendingNotificationKey(),JSON.stringify({...intent,at:Date.now()}))}catch(e){}}
function readNotification(){try{const raw=JSON.parse(localStorage.getItem(pendingNotificationKey())||'null');if(!raw||Date.now()-Number(raw.at)>6*3600000)return null;return raw}catch(e){return null}}
function clearNotificationIntent(){try{localStorage.removeItem(pendingNotificationKey())}catch(e){}const url=new URL(location.href);if(url.searchParams.has('gestion')||url.searchParams.has('contacto')){url.searchParams.delete('gestion');url.searchParams.delete('contacto');history.replaceState(history.state,'',url.pathname+url.search+url.hash)}}
async function applyNotificationIntent(intent){if(!intent||!authorized())return false;
  // Sin la persona activa elegida, el aviso espera: cada espacio tiene sus contactos.
  if(window.APPIAuth&&window.APPIAuth.needsPersonChoice&&window.APPIAuth.needsPersonChoice())return false;
  clearNotificationIntent();await openMiGestion();
  if(intent.contacto){if(!state.contacts.length)await refreshManagement(false);const contact=state.contacts.find(c=>c.id===intent.contacto);if(contact){openContactDetail(intent.contacto);return true}showToastSafe('Ese contacto ya no está disponible',2600)}
  setManagementView('hoy');return true}
function handleNotificationMessage(event){const data=event&&event.data||{};if(data.type!=='APPI_OPEN_COMMAND')return;const kind=String(data.notification||'');if(kind!=='daily_summary'&&kind!=='presentation_reminder')return;const intent={view:'hoy',contacto:String(data.contacto_id||'')};rememberNotification(intent);setTimeout(()=>{applyNotificationIntent(intent)},60)}
function handleNotificationLink(){const params=new URLSearchParams(location.search),view=params.get('gestion');if(!view)return;const intent={view:'hoy',contacto:String(params.get('contacto')||'')};rememberNotification(intent);setTimeout(()=>{applyNotificationIntent(intent)},60)}
function resumePendingNotification(){const intent=readNotification();if(intent)setTimeout(()=>{applyNotificationIntent(intent)},80)}
function notifyDueOnce(){const count=actionCount();if(!count)return;const key=`appi_gestion_aviso_${userId()}_${localISODate()}`;if(localStorage.getItem(key))return;localStorage.setItem(key,'1');if(!$('view-gestion')?.classList.contains('active'))showToastSafe(`Panel de Contactos: tenés ${count} acción${count===1?'':'es'} para hoy`,3000)}
async function refreshManagement(showLoading=false){if(state.loading)return;state.loading=true;if(showLoading)renderManagement();try{await flushQueue();await fetchManagement()}catch(error){state.lastError=error.message;if(!state.contacts.length)loadCache();if(showLoading&&!state.contacts.length){const c=$('gestionContent');if(c)c.innerHTML=`${emptyManagement('⚠️','No pudimos cargar Mi Gestión',error.message,'<button type="button" class="gestion-primary" id="gestionRetry" style="margin-top:12px">Reintentar</button>')}`;if($('gestionRetry'))$('gestionRetry').onclick=()=>refreshManagement(true);state.loading=false;return}}state.loading=false;renderManagement()}
async function openMiGestion(){
  // Preparar la solapa guardada mientras el Panel todavía está oculto evita
  // que se vea durante un frame la Agenda APPI anterior. La caché local es
  // inmediata; la nube se actualiza después sin bloquear el primer dibujo.
  if(!authorized()){
    const c=$('gestionContent');
    if(c)c.innerHTML=emptyManagement('🔒','Iniciá sesión','El Panel de Contactos necesita una cuenta para identificar tus contactos.');
    if(typeof window.showView==='function')window.showView('view-gestion');
    return;
  }
  try{state.agenda=localStorage.getItem('appi_gestion_agenda_vista_'+userId())==='personal'?'personal':'appi'}catch(e){state.agenda='appi'}
  if(!state.contacts.length)loadCache();
  // renderManagement escribe en el contenedor aún oculto: al mostrar la vista
  // ya contiene la Agenda Personal o la Agenda APPI elegida por la persona.
  renderManagement();
  if(typeof window.showView==='function')window.showView('view-gestion');

  // La PC sincroniza la agenda personal al abrir el panel, incluso si la
  // solapa guardada es Agenda APPI. Así, al cambiar a Personal, la descarga
  // desde el celular ya está disponible en la caché local.
  const agendaSync=window.APPIAgendaPersonal&&navigator.onLine&&authorized()
    ?window.APPIAgendaPersonal.sincronizar():Promise.resolve(false);
  const agendaCuenta=window.APPIAgendaPersonal&&window.APPIAgendaPersonal.traerDeLaNube
    ?window.APPIAgendaPersonal.traerDeLaNube():Promise.resolve(false);
  await refreshManagement(!state.contacts.length);
  await agendaSync;
  await agendaCuenta;
  if(navigator.onLine)setTimeout(()=>{migrarContactosLocales().catch(()=>{})},700);
}

/* Enlace auto-dirigible (v308): abre el Panel y deja la ficha de la persona
   a la vista. Lo usa el mazo de notificaciones del Home. */
async function abrirContacto(id){
  state.currentId=id;
  await openMiGestion();
  try{openContactDetail(id)}catch(e){}
}

function csvCell(value){const text=String(value==null?'':value).replace(/"/g,'""');return `"${text}"`}
function exportCsv(){
  if(!state.contacts.length){showToastSafe('No hay contactos para exportar');return}
  const rows=[['Nombre','Teléfono','Tipo','Estado','Prioridad','Motivos','Referido por','Relación','Zona','Próximo contacto','Notas','Fecha de ingreso'],...state.contacts.map(c=>{const priority=priorityFor(c);return [c.nombre,c.telefono,c.tipo,statusInfo(c.estado).label,priority.label,priority.reasons.join(' · '),c.referido_por,c.relacion,c.zona,c.proximo_contacto,c.notas,c.created_at]})];
  const csv='\ufeff'+rows.map(row=>row.map(csvCell).join(';')).join('\r\n'),blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`appi-mi-gestion-${new Date().toISOString().slice(0,10)}.csv`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);showToastSafe('Reporte descargado ✓')
}

function injectSections(){
  const grab=$('view-grabadora');if(!grab||$('view-encuesta'))return;
  const wrapper=document.createElement('div');wrapper.innerHTML=`
  <section id="view-encuesta" class="view"><header class="top"><button class="back-btn" id="btnBackEncuesta" aria-label="Volver">‹</button><button class="help-btn" id="btnHelpEncuesta" aria-label="Ayuda">?</button><button class="tools-btn" onclick="toggleToolsMenu(event)" aria-label="Herramientas" title="Herramientas">⚙️</button><h1>Mi</h1><div class="script">Encuesta</div><p>Enviala y seguí las respuestas</p></header><div class="gestion-shell" id="surveyToolContent"></div></section>
  <section id="view-gestion" class="view"><header class="top"><button class="back-btn" id="btnBackGestion" aria-label="Volver">‹</button><button class="help-btn" id="btnHelpGestion" aria-label="Ayuda">?</button><button class="tools-btn" onclick="toggleToolsMenu(event)" aria-label="Herramientas" title="Herramientas">⚙️</button><h1>Panel de</h1><div class="script">Contactos</div><p>Enviá encuestas y seguí a cada persona</p></header><div class="gestion-shell" id="gestionContent"></div></section>`;
  const sections=[...wrapper.children];sections.forEach(section=>grab.parentNode.insertBefore(section,grab));
  $('btnBackEncuesta').onclick=()=>{window.showView('view-home');if(window.renderHomeCompleto)window.renderHomeCompleto()};$('btnBackGestion').onclick=()=>{closeContactDetail();window.showView('view-home');if(window.renderHomeCompleto)window.renderHomeCompleto()};
  $('btnHelpEncuesta').onclick=()=>window.APPIDialog.alert('Tocá Enviar encuesta y elegí a quién se la mandás. Se abre WhatsApp con el mensaje listo. Cuando la persona responde, aparece sola en tu Panel de Contactos.',{title:'Cómo usar Mi Encuesta',icon:'📨'});
  $('btnHelpGestion').onclick=()=>window.APPIDialog.alert('Acá están todos tus contactos en un solo lugar. Arriba mandás la encuesta por WhatsApp o cargás a alguien a mano. Recordá que la encuesta es una herramienta de retorno: el contacto de verdad se genera en la demostración. En Hoy ves lo que necesita una acción, en Todos buscás a cualquiera, y en Resultados mirás cómo venís.',{title:'Cómo usar el Panel de Contactos',icon:'📇'});
}

function startPolling(){clearInterval(state.pollTimer);state.pollTimer=setInterval(()=>{const active=document.getElementById('view-gestion')?.classList.contains('active');if(active&&authorized()&&navigator.onLine&&!state.loading)refreshManagement(false)},30000)}
function resetForAccount(){state.link=null;state.contacts=[];state.surveys=new Map();state.activities=new Map();state.filter='todos';state.search='';state.view='hoy';state.currentId='';state.lastLoaded=0;state.bulkQueue=[];updateBadges()}
function init(){
  if(state.initialized)return;state.initialized=true;installStyles();installV204Styles();installShareStyles();installGenteStyles();injectSections();startPolling();
  window.addEventListener('online',()=>{const bar=$('gestionOffline');if(bar)bar.hidden=true;flushQueue().then(()=>refreshManagement(false))});
  window.addEventListener('offline',()=>{const bar=$('gestionOffline');if(bar)bar.hidden=false});
  window.addEventListener('focus',()=>setTimeout(maybeAskPendingOutcome,350));
  if('serviceWorker'in navigator)navigator.serviceWorker.addEventListener('message',handleNotificationMessage);
  window.addEventListener('appi-person-change',()=>setTimeout(resumePendingNotification,140));
  window.addEventListener('appi-auth-change',()=>{resetForAccount();setTimeout(()=>{if(authorized()){loadCache();loadBulkQueue();updateBadges();resumePendingNotification();if(navigator.onLine)setTimeout(()=>refreshManagement(false),900)}},120)});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){if($('view-gestion')?.classList.contains('active')&&navigator.onLine)refreshManagement(false);setTimeout(maybeAskPendingOutcome,400)}});
  if(authorized()){loadCache();loadBulkQueue();updateBadges();if(navigator.onLine)setTimeout(()=>refreshManagement(false),1400)}
  handleNotificationLink();setTimeout(resumePendingNotification,900);
}

function guardarMetadata(contact, extra){
  if(!contact) return Promise.resolve(false);
  const base = contact.metadata && typeof contact.metadata === 'object' && !Array.isArray(contact.metadata) ? contact.metadata : {};
  const metadata = Object.assign({}, base, extra || {});
  return persistContact(contact, {metadata});
}

function normalizarHistorico(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function contactoDesdeHistorico(contactId,action={}){
  const id=String(contactId||''),dip=String(action.dip||'').trim().toUpperCase(),phone=phoneDigits(action.telefono),name=normalizarHistorico(action.nombre||action.person);
  return state.contacts.find(contact=>id&&contact.id===id)||state.contacts.find(contact=>dip&&String(contact.metadata&&contact.metadata.dip||'').trim().toUpperCase()===dip)||state.contacts.find(contact=>phone&&phoneDigits(contact.telefono)===phone)||state.contacts.find(contact=>name&&normalizarHistorico(contact.nombre)===name)||null;
}
function estadoDesdeResultado(result,current='seguimiento'){
  if(result==='no_followup')return 'no_interesado';
  if(result==='contacted'||result==='reactivated')return 'contactado';
  if(['no_response','conversation_pending','goal_agreed','referred'].includes(result))return 'seguimiento';
  return current==='nuevo'?'seguimiento':current||'seguimiento';
}
async function importarDesdeHistorico(action){
  const data={nombre:String(action.nombre||action.person||'Sin nombre').trim(),telefono:String(action.telefono||''),interes:'Negocio',estado:'seguimiento',notas:String(action.nota||`Plan del Histórico: ${action.plan_title||action.alerta||'Centro de Acción'}`).slice(0,5000),proximo:action.proximo_contacto||null,localId:`historico:${action.dip||phoneDigits(action.telefono)}`};
  if(authorized()&&navigator.onLine){const imported=await importarPersona(data);if(imported&&imported.id){const contact={tipo:'manual',cantidad_origenes:1,created_at:new Date().toISOString(),updated_at:new Date().toISOString(),...data,...imported};state.contacts=state.contacts.filter(item=>item.id!==contact.id);state.contacts.unshift(contact);saveCache();return contact}}
  const now=new Date().toISOString(),contact={id:`local-historico-${uuidV4()}`,user_id:userId(),tipo:'manual',nombre:data.nombre,telefono:data.telefono,telefono_normalizado:phoneDigits(data.telefono),estado:'seguimiento',notas:data.notas,proximo_contacto:data.proximo,metadata:{dip:action.dip||'',origen:'historico'},cantidad_origenes:1,created_at:now,updated_at:now};state.contacts.unshift(contact);saveCache();queueHistoricoImport(contact.id,data);return contact;
}
async function programarDesdeHistorico(contactId,action={}){
  let contact=contactoDesdeHistorico(contactId,action);
  if(!contact){if(!telefonoValido(action.telefono))throw new Error('La persona del Histórico no tiene un teléfono válido.');contact=await importarDesdeHistorico(action)}
  const now=new Date().toISOString(),base=contact.metadata&&typeof contact.metadata==='object'&&!Array.isArray(contact.metadata)?contact.metadata:{},previousHistory=Array.isArray(base.centro_accion_historial)?base.centro_accion_historial:[],entry={plan_id:String(action.plan_id||''),alerta:String(action.alerta||''),resultado:String(action.resultado||''),nota:String(action.nota||''),proximo_contacto:action.proximo_contacto||null,fecha_actualizacion:now},metadata={...base,dip:action.dip||base.dip||'',plan_id:entry.plan_id,alerta:entry.alerta,resultado:entry.resultado,nota:entry.nota,proximo_contacto:entry.proximo_contacto,fecha_actualizacion:now,centro_accion:entry,centro_accion_historial:[...previousHistory,entry].slice(-80)};
  const payload={estado:estadoDesdeResultado(action.resultado,contact.estado),proximo_contacto:action.proximo_contacto||null,metadata};if(action.nota)payload.notas=[contact.notas,String(action.nota).trim()].filter(Boolean).join('\n').slice(0,5000);if(action.resultado)payload.ultimo_contacto=now;
  try{await persistContact(contact,payload)}catch(error){queueMutation(contact.id,'PATCH',payload)}
  const allowed=new Set(['historico_accion','historico_plan_actualizado','whatsapp_abierto','llamada_iniciada']),activity=allowed.has(action.activity)?action.activity:'historico_accion';logActivity(contact.id,activity,action.nota||`${action.plan_title||'Centro de Acción'} · ${action.alerta||'seguimiento'}`,entry);saveCache();updateBadges();renderManagement();return contact;
}

window.openEncuestaTool=openEncuestaTool;
window.openMiGestion=openMiGestion;
window.closeGestionDetail=closeContactDetail;
window.APPIGestion={state,cloudFetch,soloMios,open:openMiGestion,abrirContacto,importarPersona,guardarPersonaManual,migrarContactosLocales,contactosPendientes,telefonoValido,nuevaPersonaManual,refresh:refreshManagement,createInvitation:createSurveyInvitation,surveyUrl,shareMessage,flushQueue,updateBadges,priorityFor,messageFor,actionableContacts,logActivity,setView:setManagementView,prepareBulk:addBulkRecipients,processPendingOutcome:maybeAskPendingOutcome,guardarMetadata,programarDesdeHistorico,render:renderManagement};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

