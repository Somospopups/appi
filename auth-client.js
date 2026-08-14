(function(){
'use strict';

const SESSION_KEY='appi_auth_session_v1';
const DEFAULTS={
  enabled:false,
  url:'',
  anonKey:'',
  distributorEmailDomain:'distribuidores.appi.invalid',
  offlineDays:7
};

function config(){
  return {...DEFAULTS,...(window.APPI_AUTH||{})};
}
function isEnabled(){return config().enabled===true}
function isConfigured(){
  const cfg=config();
  return isEnabled()&&/^https:\/\//i.test(cfg.url||'')&&String(cfg.anonKey||'').length>20;
}
function dipDigits(value){return String(value||'').replace(/\D/g,'').slice(0,14)}
function normalizeDip(value){
  const digits=dipDigits(value);
  return digits.length>2?`${digits.slice(0,2)}-${digits.slice(2)}`:digits;
}
function parseDip(value){
  const digits=dipDigits(value);
  if(digits.length<3||digits.length>14)throw authError('Ingresá la sucursal de 2 dígitos y el número de distribuidor.','invalid_dip');
  return {canonical:`${digits.slice(0,2)}-${digits.slice(2)}`,sucursal:digits.slice(0,2),numero:digits.slice(2),compact:digits};
}
function emailForDip(value){
  const dip=parseDip(value).canonical;
  return `dip-${dip}@${config().distributorEmailDomain}`;
}
function jwtPayload(token){
  try{
    const part=String(token||'').split('.')[1];
    if(!part)return null;
    const base=part.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(part.length/4)*4,'=');
    return JSON.parse(decodeURIComponent(escape(atob(base))));
  }catch(e){return null}
}
function authError(message,code='auth_error',status=0){
  const error=new Error(message);error.code=code;error.status=status;return error;
}
function readJson(text){try{return text?JSON.parse(text):{}}catch(e){return {}}}
function load(){
  try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(e){return null}
}
function save(value){
  if(value)localStorage.setItem(SESSION_KEY,JSON.stringify(value));
  else localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new CustomEvent('appi-auth-change',{detail:value}));
  return value;
}
function clear(){save(null)}
function offlineLimitMs(){return Math.max(1,Number(config().offlineDays)||7)*86400000}
function offlineEligible(value=load()){
  return !!(value&&value.profile&&value.profile.activo!==false&&value.lastValidatedAt&&Date.now()-Number(value.lastValidatedAt)<=offlineLimitMs());
}
function isLocallyAuthorized(){return !isEnabled()||offlineEligible()}
function apiUrl(path){return String(config().url||'').replace(/\/$/,'')+path}
function baseHeaders(token){
  const headers={apikey:config().anonKey};
  if(token)headers.Authorization=`Bearer ${token}`;
  return headers;
}
async function request(path,options={},token=''){
  if(!isConfigured())throw authError('El acceso por distribuidor todavía no está configurado.','not_configured');
  let response;
  try{
    response=await fetch(apiUrl(path),{
      ...options,
      cache:'no-store',
      headers:{...baseHeaders(token),...(options.headers||{})}
    });
  }catch(error){
    throw authError('No se pudo conectar con APPI. Revisá tu conexión.','network_error');
  }
  const text=await response.text(),data=readJson(text);
  if(!response.ok){
    const message=data.msg||data.message||data.error_description||data.error||(
      response.status===400?'Número de distribuidor o contraseña incorrectos.':
      response.status===401?'La sesión dejó de ser válida.':
      response.status===403?'Esta cuenta está bloqueada.':
      'No se pudo completar el acceso.'
    );
    throw authError(String(message),response.status===400?'invalid_credentials':'server_error',response.status);
  }
  return data;
}
async function fetchProfile(session){
  const payload=jwtPayload(session&&session.access_token);
  if(!payload||!payload.sub)throw authError('La sesión recibida no es válida.','invalid_session');
  const query=`/rest/v1/appi_perfiles?select=user_id,dip,sucursal,numero_distribuidor,nombre,rol,activo&user_id=eq.${encodeURIComponent(payload.sub)}&limit=1`;
  const rows=await request(query,{headers:{Accept:'application/json'}},session.access_token);
  const profile=Array.isArray(rows)?rows[0]:null;
  if(!profile)throw authError('La cuenta no tiene un perfil de distribuidor.','profile_missing',403);
  if(profile.activo===false)throw authError('Esta cuenta está desactivada. Contactá al administrador.','account_disabled',403);
  return profile;
}
function normalizeSession(data){
  const payload=jwtPayload(data&&data.access_token)||{};
  return {
    access_token:data.access_token,
    refresh_token:data.refresh_token,
    token_type:data.token_type||'bearer',
    expires_in:Number(data.expires_in)||3600,
    expires_at:Number(data.expires_at)||payload.exp||Math.floor(Date.now()/1000)+3600,
    user:data.user||null
  };
}
async function login(dip,password){
  const parsed=parseDip(dip),normalized=parsed.canonical;
  if(String(password||'').length<6)throw authError('La contraseña debe tener al menos 6 caracteres.','invalid_password');
  const data=await request('/auth/v1/token?grant_type=password',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({email:emailForDip(normalized),password:String(password)})
  });
  const session=normalizeSession(data),profile=await fetchProfile(session);
  if(parseDip(profile.dip).canonical!==normalized)throw authError('La cuenta no coincide con el distribuidor ingresado.','profile_mismatch',403);
  return save({session,profile,lastValidatedAt:Date.now(),offline:false});
}
async function refresh(saved=load()){
  if(!saved||!saved.session||!saved.session.refresh_token)throw authError('No hay una sesión para renovar.','no_session',401);
  const data=await request('/auth/v1/token?grant_type=refresh_token',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({refresh_token:saved.session.refresh_token})
  });
  const session=normalizeSession(data),profile=await fetchProfile(session);
  return save({session,profile,lastValidatedAt:Date.now(),offline:false});
}
async function validate(saved=load()){
  if(!saved||!saved.session||!saved.session.access_token)throw authError('Iniciá sesión para usar APPI.','no_session',401);
  const now=Math.floor(Date.now()/1000);
  if(Number(saved.session.expires_at||0)<now+120)return refresh(saved);
  const profile=await fetchProfile(saved.session);
  return save({...saved,profile,lastValidatedAt:Date.now(),offline:false});
}
async function authorize(){
  if(!isEnabled())return {ok:true,legacy:true};
  if(!isConfigured())return {ok:false,reason:'not_configured'};
  const saved=load();
  if(!saved)return {ok:false,reason:'no_session'};
  try{
    const current=await validate(saved);
    return {ok:true,value:current,offline:false};
  }catch(error){
    if((error.status===0||error.code==='network_error')&&offlineEligible(saved)){
      const offline={...saved,offline:true};save(offline);
      return {ok:true,value:offline,offline:true};
    }
    if(error.status===401||error.status===403||error.code==='profile_missing'||error.code==='account_disabled')clear();
    return {ok:false,reason:error.code||'auth_error',error};
  }
}
async function logout(){
  const saved=load();
  if(saved&&saved.session&&saved.session.access_token&&isConfigured()){
    try{await request('/auth/v1/logout',{method:'POST'},saved.session.access_token)}catch(e){}
  }
  clear();
}
function accessToken(){const value=load();return value&&value.session&&value.session.access_token||''}
function userId(){const value=load(),payload=jwtPayload(value&&value.session&&value.session.access_token);return payload&&payload.sub||''}
function currentProfile(){const value=load();return value&&value.profile||null}
function status(){
  const saved=load();
  return {enabled:isEnabled(),configured:isConfigured(),authorized:isLocallyAuthorized(),offline:!!(saved&&saved.offline),profile:saved&&saved.profile||null,lastValidatedAt:saved&&saved.lastValidatedAt||0};
}

window.APPIAuth={
  SESSION_KEY,config,isEnabled,isConfigured,normalizeDip,parseDip,emailForDip,login,authorize,refresh,validate,logout,
  load,clear,offlineEligible,isLocallyAuthorized,accessToken,userId,currentProfile,status
};
})();
