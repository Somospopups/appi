(function(){
'use strict';
let cachedConfig=null;
function cfg(){return window.APPIAuth.config()}
async function call(body){
  const configuration=cfg();let response;
  try{response=await fetch(String(configuration.url).replace(/\/$/,'')+'/functions/v1/solicitud-cuenta',{method:'POST',headers:{apikey:configuration.anonKey,'Content-Type':'application/json'},body:JSON.stringify(body)})}
  catch(error){throw new Error('No se pudo conectar. Revisá tu conexión.')}
  const data=await response.json().catch(()=>({}));
  if(response.status===404)throw new Error('El registro de solicitudes todavía no está habilitado.');
  if(!response.ok)throw new Error(data.error||'No se pudo enviar la solicitud.');
  return data;
}
async function getConfig(force=false){if(cachedConfig&&!force)return cachedConfig;cachedConfig=await call({action:'config'});return cachedConfig}
async function submit({nombre,socio_nombre='',dip,telefono,website=''}){return call({action:'create',nombre,socio_nombre,dip,telefono,website})}
async function openSupport(message){
  const config=await getConfig(),number=String(config.whatsapp||'').replace(/\D/g,'');
  if(!number)throw new Error('El WhatsApp de soporte todavía no está configurado.');
  window.APPIWhatsApp.abrir(`https://wa.me/${number}?text=${encodeURIComponent(message||'Hola, necesito ayuda para ingresar a APPI.')}`);
}
window.APPIAccountRequest={getConfig,submit,openSupport};
})();
