(function(){
'use strict';

const state={users:[],filter:'',bound:false};
const $=id=>document.getElementById(id);
const esc=value=>String(value==null?'':value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function cfg(){return window.APPIAuth.config()}
function randomPassword(){
  const upper='ABCDEFGHJKLMNPQRSTUVWXYZ',lower='abcdefghijkmnopqrstuvwxyz',numbers='23456789',special='!@#$%',all=upper+lower+numbers+special;
  const pick=set=>set[crypto.getRandomValues(new Uint32Array(1))[0]%set.length],chars=[pick(upper),pick(lower),pick(numbers),pick(special)];
  while(chars.length<14)chars.push(pick(all));
  for(let index=chars.length-1;index>0;index--){const target=crypto.getRandomValues(new Uint32Array(1))[0]%(index+1);[chars[index],chars[target]]=[chars[target],chars[index]]}
  return chars.join('');
}
async function callAdmin(body,retry=true){
  const configuration=cfg(),token=window.APPIAuth.accessToken();
  let response;
  try{response=await fetch(String(configuration.url).replace(/\/$/,'')+'/functions/v1/admin-distribuidores',{method:'POST',headers:{apikey:configuration.anonKey,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body)})}
  catch(error){throw new Error('No se pudo conectar con el panel administrador.')}
  const data=await response.json().catch(()=>({}));
  if(response.status===401&&retry){
    try{await window.APPIAuth.refresh();return callAdmin(body,false)}
    catch(error){await window.APPIDataSync.logoutAndLock({removeCache:false}).catch(()=>{});setTimeout(()=>location.reload(),100);throw new Error('La sesión anterior venció. Volvé a ingresar desde el candado.')}
  }
  if(response.status===404)throw new Error('Falta instalar la función admin-distribuidores en Supabase.');
  if(!response.ok)throw new Error(data.error||'No se pudo completar la operación.');
  return data;
}
function status(message,error=false){const node=$('adminCreateStatus');if(!node)return;node.textContent=message||'';node.className='admin-inline-status'+(message?' show':'')+(error?' error':'')}
function updateStats(){const users=state.users.filter(user=>user.rol!=='admin');$('adminStatTotal').textContent=users.length;$('adminStatActive').textContent=users.filter(user=>user.activo).length;$('adminStatBlocked').textContent=users.filter(user=>!user.activo).length}
function filteredUsers(){const term=state.filter.toLowerCase().trim();return state.users.filter(user=>user.rol!=='admin'&&(!term||`${user.nombre} ${user.dip} ${user.sucursal} ${user.numero_distribuidor}`.toLowerCase().includes(term)))}
function render(){
  updateStats();const list=$('adminUserList'),users=filteredUsers();if(!list)return;
  if(!users.length){list.innerHTML='<div class="empty">No hay distribuidores para mostrar.</div>';return}
  list.innerHTML=users.map(user=>`<article class="admin-user-row" data-admin-user="${esc(user.user_id)}"><div><h3>${esc(user.nombre||'Sin nombre')}</h3><p>${esc(user.dip||'Sin número')}</p><span class="admin-user-badge ${user.activo?'':'blocked'}">${user.activo?'ACTIVA':'BLOQUEADA'}</span></div><div class="admin-row-actions"><button type="button" data-admin-action="password">Nueva contraseña</button><button type="button" class="${user.activo?'danger':'good'}" data-admin-action="active" data-active="${user.activo?'0':'1'}">${user.activo?'Bloquear':'Activar'}</button></div></article>`).join('');
  list.querySelectorAll('[data-admin-action]').forEach(button=>button.onclick=()=>handleAction(button));
}
async function load(){const list=$('adminUserList');if(list)list.innerHTML='<div class="empty">Cargando cuentas…</div>';try{const data=await callAdmin({action:'list'});state.users=data.users||[];render()}catch(error){if(list)list.innerHTML=`<div class="admin-inline-status show error">${esc(error.message)}</div>`}}
async function create(){
  const sucursal=String($('adminSucursal').value||'').replace(/\D/g,'').padStart(2,'0').slice(-2),numero=String($('adminNumero').value||'').replace(/\D/g,''),nombre=$('adminNombre').value.trim(),password=$('adminTempPassword').value;
  if(!/^\d{2}$/.test(sucursal)||!/^\d{1,12}$/.test(numero)){status('Completá sucursal y número de distribuidor.',true);return}
  if(nombre.length<2){status('Escribí el nombre del distribuidor.',true);return}
  if(password.length<8||!/[A-Za-z]/.test(password)||!/[0-9]/.test(password)){status('La contraseña temporal necesita al menos 8 caracteres, letras y números.',true);return}
  const button=$('adminCreateUser');button.disabled=true;button.textContent='Creando…';status('Creando cuenta…');
  try{
    const data=await callAdmin({action:'create',dip:`${sucursal}-${numero}`,nombre,password});
    status(`Cuenta creada: ${data.user.dip} · contraseña temporal lista.`);await navigator.clipboard.writeText(`APPI\nDistribuidor: ${data.user.dip}\nContraseña temporal: ${password}`).catch(()=>{});
    $('adminSucursal').value='';$('adminNumero').value='';$('adminNombre').value='';$('adminTempPassword').value='';await load();
    if(typeof showToast==='function')showToast('Cuenta creada y datos copiados 📋',2800);
  }catch(error){status(error.message,true)}finally{button.disabled=false;button.textContent='Crear cuenta'}
}
async function handleAction(button){
  const row=button.closest('[data-admin-user]'),userId=row&&row.dataset.adminUser;if(!userId)return;button.disabled=true;
  try{
    if(button.dataset.adminAction==='password'){
      const generated=randomPassword(),password=prompt('Nueva contraseña temporal:',generated);if(!password)return;
      await callAdmin({action:'set_password',user_id:userId,password});await navigator.clipboard.writeText(password).catch(()=>{});alert('Contraseña actualizada y copiada. El distribuidor debe cambiarla al ingresar.');
    }else{
      const activo=button.dataset.active==='1';if(!confirm(activo?'¿Activar esta cuenta?':'¿Bloquear esta cuenta?'))return;
      await callAdmin({action:'set_active',user_id:userId,activo});await load();
    }
  }catch(error){alert(error.message)}finally{button.disabled=false}
}
async function logout(){
  if(!confirm('¿Cerrar la sesión administradora y limpiar este dispositivo?'))return;
  const button=$('btnAdminPanelLogout');button.disabled=true;
  try{await window.APPIDataSync.logoutAndLock({removeCache:true});location.reload()}catch(error){button.disabled=false;alert(error.message)}
}
function bind(){
  if(state.bound)return;state.bound=true;
  $('adminGeneratePassword').onclick=()=>$('adminTempPassword').value=randomPassword();
  $('adminCreateUser').onclick=create;$('adminRefreshUsers').onclick=load;$('btnAdminPanelLogout').onclick=logout;$('btnAdminPanelPassword').onclick=()=>window.abrirCambioPasswordAPPI();
  $('adminUserSearch').oninput=event=>{state.filter=event.target.value;render()};
  $('adminSucursal').oninput=event=>event.target.value=event.target.value.replace(/\D/g,'').slice(0,2);
  $('adminNumero').oninput=event=>event.target.value=event.target.value.replace(/\D/g,'').slice(0,12);
}
function open(){
  const profile=window.APPIAuth.currentProfile();if(!profile||profile.rol!=='admin')return;
  bind();$('adminPanelIdentity').textContent=`Administrador · ${profile.username||'POPUPS'}`;load();
}
window.APPIAdminPanel={open,load};
})();
