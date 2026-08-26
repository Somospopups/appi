(function(){
'use strict';

const DB_NAME='appi-account-cache-v1';
const STORE='snapshots';
const ACTIVE_USER_KEY='appi_active_user_v1';
const AUDIO_META_KEY='grabadora_reuniones_light';
const PERSON_PREFIX='persona_socio__';
const SHARED_KEYS=new Set(['equipoData','usuarios_garantias','lastUpdate_equipo']);
const audioMetaKey=workspaceId=>`appi_local_audio_meta_${workspaceId}`;
const EXACT_KEYS=new Set([
  'equipoData','usuarios_garantias','seguimientoPersonas','cultura_crecimiento_v1','appi_keep_notas',
  'themeDark','home_sec_mes','home_sec_neg'
]);
// Los módulos nuevos también forman parte del espacio personal de la cuenta.
// Mantenerlos en esta lista garantiza nube, backup y separación titular/socio.
const PREFIXES=[
  'rueda','siete_','presu_','lastUpdate_','bonus_notif_',
  'appi_suenos_v1_','appi_porque_v1_','appi_stock_v1_','appi_prestamos_v1_','appi_cal_tareas_v1_','appi_tarjetas_v1_',
  'appi_acciones_v1_','appi_agenda_personal_v1_','appi_wa_cuidado_','appi_ducha_rinnova_v1_'
];
const state={ready:false,userId:'',workspaceId:'',personType:'titular',values:{},changedAt:{},dirty:new Set(),deleted:new Set(),cacheTimer:null,syncTimer:null,syncing:false,lastError:''};
const nativeSet=Storage.prototype.setItem;
const nativeRemove=Storage.prototype.removeItem;

function isDataKey(key){
  key=String(key||'');
  if(EXACT_KEYS.has(key))return true;
  return PREFIXES.some(prefix=>key.startsWith(prefix));
}
function activePersonType(){const person=window.APPIAuth&&window.APPIAuth.activePerson?window.APPIAuth.activePerson():null;return person&&person.tipo==='socio'?'socio':'titular'}
function isSharedKey(key){return SHARED_KEYS.has(String(key||''))}
function cloudDataKey(key,personType=state.personType){return personType==='socio'&&!isSharedKey(key)?PERSON_PREFIX+key:key}
function localDataKey(cloudKey,personType=state.personType){
  const key=String(cloudKey||'');
  if(isSharedKey(key))return key;
  if(personType==='socio')return key.startsWith(PERSON_PREFIX)&&isDataKey(key.slice(PERSON_PREFIX.length))?key.slice(PERSON_PREFIX.length):'';
  return !key.startsWith(PERSON_PREFIX)&&isDataKey(key)?key:'';
}
function collect(){
  const values={};
  for(let i=0;i<localStorage.length;i++){
    const key=localStorage.key(i);
    if(isDataKey(key))values[key]=localStorage.getItem(key);
  }
  return values;
}
function hasMeaningfulData(values){return Object.keys(values||{}).some(key=>!['themeDark','home_sec_mes','home_sec_neg'].includes(key))}
function openDB(){
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(DB_NAME,1);
    request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE,{keyPath:'userId'})};
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error||new Error('No se pudo abrir el caché de la cuenta'));
  });
}
async function cacheGet(userId){
  const db=await openDB();
  return new Promise((resolve,reject)=>{const request=db.transaction(STORE,'readonly').objectStore(STORE).get(userId);request.onsuccess=()=>{db.close();resolve(request.result||null)};request.onerror=()=>{db.close();reject(request.error)}});
}
async function cachePut(record){
  const db=await openDB();
  return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(record);tx.oncomplete=()=>{db.close();resolve(record)};tx.onerror=()=>{db.close();reject(tx.error)}});
}
async function cacheDelete(userId){
  const db=await openDB();
  return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(userId);tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)}});
}
function cacheRecord(){return {userId:state.workspaceId,values:{...state.values},changedAt:{...state.changedAt},savedAt:Date.now()}}
function saveCacheSoon(){
  clearTimeout(state.cacheTimer);
  state.cacheTimer=setTimeout(()=>{if(state.ready&&state.userId)cachePut(cacheRecord()).catch(error=>console.warn('Caché de cuenta',error))},120);
}
function scheduleSync(){
  saveCacheSoon();
  clearTimeout(state.syncTimer);
  state.syncTimer=setTimeout(()=>syncNow(false).catch(error=>console.warn('Sincronización APPI',error)),800);
}
function markSet(key,value){
  if(!state.ready)return;
  if(key===AUDIO_META_KEY&&state.userId){nativeSet.call(localStorage,audioMetaKey(state.workspaceId),String(value));return}
  if(!isDataKey(key))return;
  state.values[key]=String(value);state.changedAt[key]=Date.now();state.deleted.delete(key);state.dirty.add(key);scheduleSync();
}
function markRemove(key){
  if(!state.ready)return;
  if(key===AUDIO_META_KEY&&state.userId){nativeRemove.call(localStorage,audioMetaKey(state.workspaceId));return}
  if(!isDataKey(key))return;
  delete state.values[key];state.changedAt[key]=Date.now();state.dirty.delete(key);state.deleted.add(key);scheduleSync();
}
Storage.prototype.setItem=function(key,value){nativeSet.call(this,key,value);if(this===localStorage)markSet(String(key),value)};
Storage.prototype.removeItem=function(key){nativeRemove.call(this,key);if(this===localStorage)markRemove(String(key))};

function applyValues(values){
  const previousReady=state.ready;state.ready=false;
  try{
    for(let i=localStorage.length-1;i>=0;i--){const key=localStorage.key(i);if(isDataKey(key))nativeRemove.call(localStorage,key)}
    Object.entries(values||{}).forEach(([key,value])=>{if(isDataKey(key)&&value!=null)nativeSet.call(localStorage,key,String(value))});
  }finally{state.ready=previousReady}
}
function cfg(){return window.APPIAuth&&window.APPIAuth.config?window.APPIAuth.config():{}}
async function cloudFetch(path,options={}){
  const configuration=cfg(),token=window.APPIAuth.accessToken();
  if(!configuration.url||!configuration.anonKey||!token)throw new Error('La nube de la cuenta no está disponible.');
  let response;
  try{
    response=await fetch(String(configuration.url).replace(/\/$/,'')+path,{...options,cache:'no-store',headers:{apikey:configuration.anonKey,Authorization:`Bearer ${token}`,...(options.headers||{})}});
  }catch(error){const e=new Error('Sin conexión para sincronizar.');e.network=true;throw e}
  if(response.status===401){
    await window.APPIAuth.refresh();
    return cloudFetch(path,options);
  }
  if(!response.ok){const text=await response.text();throw new Error(text||`Error de sincronización ${response.status}`)}
  if(response.status===204)return null;
  const text=await response.text();try{return text?JSON.parse(text):null}catch(e){return null}
}
async function pullCloud(personType=state.personType){
  const rows=await cloudFetch('/rest/v1/appi_datos?select=data_key,data,updated_at&order=data_key.asc');
  const values={},changedAt={};
  for(const row of rows||[]){
    const key=localDataKey(row.data_key,personType);if(!key)continue;
    const value=row.data&&Object.prototype.hasOwnProperty.call(row.data,'value')?row.data.value:null;
    if(value!=null)values[key]=String(value);
    changedAt[key]=new Date(row.updated_at||0).getTime()||0;
  }
  return {values,changedAt};
}
function merge(local,remote,preferLocal=false){
  const values={},changedAt={},dirty=[];
  const keys=new Set([...Object.keys(local.values||{}),...Object.keys(remote.values||{})]);
  for(const key of keys){
    const localHas=Object.prototype.hasOwnProperty.call(local.values||{},key),remoteHas=Object.prototype.hasOwnProperty.call(remote.values||{},key);
    const lt=Number(local.changedAt&&local.changedAt[key])||0,rt=Number(remote.changedAt&&remote.changedAt[key])||0;
    const useLocal=localHas&&(!remoteHas||preferLocal||lt>rt);
    if(useLocal){values[key]=local.values[key];changedAt[key]=lt||Date.now();if(!remoteHas||local.values[key]!==remote.values[key])dirty.push(key)}
    else if(remoteHas){values[key]=remote.values[key];changedAt[key]=rt}
  }
  return {values,changedAt,dirty};
}
async function pullLatest(){
  const remote=await pullCloud(state.personType),merged=merge({values:state.values,changedAt:state.changedAt},remote,false);
  state.values={...(merged.values||{})};state.changedAt={...(merged.changedAt||{})};merged.dirty.forEach(key=>state.dirty.add(key));
  applyValues(state.values);await cachePut(cacheRecord()).catch(()=>{});
  try{window.dispatchEvent(new CustomEvent('appi-datasync-applied'))}catch(e){}
  return true;
}
async function start({claimLegacy=true}={}){
  if(!window.APPIAuth||!window.APPIAuth.isEnabled()||!window.APPIAuth.isLocallyAuthorized())return {ready:false};
  const userId=window.APPIAuth.userId();if(!userId)throw new Error('La cuenta no tiene un identificador válido.');
  const personType=activePersonType(),workspaceId=`${userId}:${personType}`;
  const working=collect(),previousWorkspace=localStorage.getItem(ACTIVE_USER_KEY)||'',workingAudio=localStorage.getItem(AUDIO_META_KEY);
  if(workingAudio!=null&&previousWorkspace)nativeSet.call(localStorage,audioMetaKey(previousWorkspace),workingAudio);
  else if(workingAudio!=null&&!previousWorkspace&&claimLegacy&&personType==='titular'&&localStorage.getItem(audioMetaKey(workspaceId))==null)nativeSet.call(localStorage,audioMetaKey(workspaceId),workingAudio);
  let cache=await cacheGet(workspaceId).catch(()=>null);
  if(!cache&&personType==='titular')cache=await cacheGet(userId).catch(()=>null);
  let local={values:cache&&cache.values||{},changedAt:cache&&cache.changedAt||{}};
  const sameWorkspace=previousWorkspace===workspaceId||(personType==='titular'&&previousWorkspace===userId);
  if(sameWorkspace&&hasMeaningfulData(working)){
    const now=Date.now();local={values:working,changedAt:{...local.changedAt}};Object.keys(working).forEach(key=>{if(!local.changedAt[key])local.changedAt[key]=now});
  }else if(!previousWorkspace&&claimLegacy&&personType==='titular'&&hasMeaningfulData(working)&&!hasMeaningfulData(local.values)){
    const now=Date.now();local={values:working,changedAt:{}};Object.keys(working).forEach(key=>local.changedAt[key]=now);
  }
  let remote={values:{},changedAt:{}},online=true;
  state.userId=userId;state.workspaceId=workspaceId;state.personType=personType;state.lastError='';
  try{remote=await pullCloud(personType)}catch(error){online=false;state.lastError=error.message}
  const preferLocal=hasMeaningfulData(local.values)&&!hasMeaningfulData(remote.values);
  const merged=online?merge(local,remote,preferLocal):local;
  state.values={...(merged.values||{})};state.changedAt={...(merged.changedAt||{})};state.dirty=new Set(merged.dirty||[]);state.deleted=new Set();
  applyValues(state.values);
  nativeRemove.call(localStorage,AUDIO_META_KEY);
  const userAudio=localStorage.getItem(audioMetaKey(workspaceId));if(userAudio!=null)nativeSet.call(localStorage,AUDIO_META_KEY,userAudio);
  nativeSet.call(localStorage,ACTIVE_USER_KEY,workspaceId);state.ready=true;
  await cachePut(cacheRecord()).catch(()=>{});
  try{window.dispatchEvent(new CustomEvent('appi-datasync-applied'))}catch(e){}
  if(online&&state.dirty.size)await syncNow(false);
  return {ready:true,online,claimedLegacy:preferLocal,keys:Object.keys(state.values).length,personType};
}
async function syncNow(force=false){
  if(!state.ready||state.syncing||!navigator.onLine)return false;
  const userId=state.userId||window.APPIAuth.userId();if(!userId)return false;
  const keys=[...state.dirty];
  const deleted=[...state.deleted];
  if(!keys.length&&!deleted.length){if(force)await pullLatest();return true;}
  state.syncing=true;
  try{
    if(keys.length){
      const now=new Date().toISOString();
      const rows=keys.filter(key=>Object.prototype.hasOwnProperty.call(state.values,key)).map(key=>({user_id:userId,data_key:cloudDataKey(key),data:{value:state.values[key]},updated_at:now}));
      if(rows.length)await cloudFetch('/rest/v1/appi_datos?on_conflict=user_id,data_key',{method:'POST',headers:{'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(rows)});
    }
    for(const key of deleted)await cloudFetch(`/rest/v1/appi_datos?user_id=eq.${encodeURIComponent(userId)}&data_key=eq.${encodeURIComponent(cloudDataKey(key))}` ,{method:'DELETE'});
    keys.forEach(key=>state.dirty.delete(key));deleted.forEach(key=>state.deleted.delete(key));state.lastError='';if(force)await pullLatest();else await cachePut(cacheRecord()).catch(()=>{});return true;
  }catch(error){state.lastError=error.message;throw error}
  finally{state.syncing=false}
}
async function logoutAndLock({removeCache=false}={}){
  let synced=true;
  try{await syncNow(true)}catch(error){synced=false;await cachePut(cacheRecord()).catch(()=>{});if(removeCache)throw new Error('No se pudo sincronizar. Conectate antes de borrar la copia de este dispositivo.')}
  const userId=state.userId,workspaceId=state.workspaceId,audio=localStorage.getItem(AUDIO_META_KEY);
  if(removeCache&&typeof window.clearGrabadoraAudios==='function')await window.clearGrabadoraAudios();
  if(workspaceId&&audio!=null)nativeSet.call(localStorage,audioMetaKey(workspaceId),audio);
  applyValues({});nativeRemove.call(localStorage,AUDIO_META_KEY);nativeRemove.call(localStorage,ACTIVE_USER_KEY);state.ready=false;state.userId='';state.workspaceId='';state.personType='titular';state.values={};state.changedAt={};state.dirty.clear();state.deleted.clear();
  if(removeCache&&workspaceId){await cacheDelete(workspaceId).catch(()=>{});nativeRemove.call(localStorage,audioMetaKey(workspaceId))}
  await window.APPIAuth.logout();
  return {synced,cacheRemoved:removeCache};
}
function status(){return {ready:state.ready,userId:state.userId,workspaceId:state.workspaceId,personType:state.personType,dirty:state.dirty.size,deleted:state.deleted.size,syncing:state.syncing,lastError:state.lastError,audioLocalOnly:true}}

window.addEventListener('online',()=>{if(state.ready)syncNow(false).catch(error=>console.warn('Sincronización al reconectar',error))});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&state.ready)syncNow(false).catch(()=>{})});
window.addEventListener('pagehide',()=>{if(state.ready)syncNow(false).catch(()=>{})});
setInterval(()=>{if(state.ready&&navigator.onLine&&(state.dirty.size||state.deleted.size))syncNow(false).catch(()=>{})},30000);

window.APPIDataSync={isDataKey,isSharedKey,cloudDataKey,localDataKey,collect,start,syncNow,logoutAndLock,status,cacheDelete};
})();
