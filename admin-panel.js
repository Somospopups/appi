(function(){
'use strict';
const state={users:[],requests:[],filter:'',whatsapp:'',createMembership:1,bound:false,pruebas:new Map()};
const $=id=>document.getElementById(id);
const esc=value=>String(value==null?'':value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const cfg=()=>window.APPIAuth.config();
function randomPassword(){const upper='ABCDEFGHJKLMNPQRSTUVWXYZ',lower='abcdefghijkmnopqrstuvwxyz',numbers='23456789',special='!@#$%',all=upper+lower+numbers+special,pick=set=>set[crypto.getRandomValues(new Uint32Array(1))[0]%set.length],chars=[pick(upper),pick(lower),pick(numbers),pick(special)];while(chars.length<14)chars.push(pick(all));for(let i=chars.length-1;i>0;i--){const j=crypto.getRandomValues(new Uint32Array(1))[0]%(i+1);[chars[i],chars[j]]=[chars[j],chars[i]]}return chars.join('')}
/* Los números de WhatsApp se arman en un solo lugar: telefono.js (window.APPITel).
   Acá vivía una función propia que agregaba dígitos sin validar (por ejemplo
   "+54 280 434264454" terminaba en 549280434264454, un número que no existe). */
function membershipInfo(user){const time=user.membresia_vence?new Date(user.membresia_vence).getTime():0,days=time?Math.ceil((time-Date.now())/86400000):-1;if(!time)return{label:'SIN MEMBRESÍA',cls:'expired',days};if(days<0)return{label:'VENCIDA',cls:'expired',days};if(days<=7)return{label:days===0?'VENCE HOY':`VENCE EN ${days}D`,cls:'soon',days};return{label:`${days} DÍAS`,cls:'',days}}
async function callAdmin(body,retry=true){
  const configuration=cfg(),token=window.APPIAuth.accessToken();let response;
  try{response=await fetch(String(configuration.url).replace(/\/$/,'')+'/functions/v1/admin-distribuidores',{method:'POST',headers:{apikey:configuration.anonKey,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body)})}catch(error){throw new Error('No se pudo conectar con el panel administrador.')}
  const data=await response.json().catch(()=>({}));
  if(response.status===401&&retry){try{await window.APPIAuth.refresh();return callAdmin(body,false)}catch(error){await window.APPIDataSync.logoutAndLock({removeCache:false}).catch(()=>{});setTimeout(()=>location.reload(),100);throw new Error('La sesión anterior venció. Volvé a ingresar desde el candado.')}}
  if(response.status===404)throw new Error('Falta instalar la función admin-distribuidores en Supabase.');
  if(!response.ok)throw new Error(data.error||'No se pudo completar la operación.');return data;
}
function setStatus(id,message,error=false){const node=$(id);if(!node)return;node.textContent=message||'';node.className='admin-inline-status'+(message?' show':'')+(error?' error':'')}
function updateStats(){const users=state.users.filter(user=>user.rol!=='admin');$('adminStatTotal').textContent=users.length;$('adminStatActive').textContent=users.filter(user=>user.activo).length;$('adminStatBlocked').textContent=users.filter(user=>!user.activo).length;$('adminStatPending').textContent=state.requests.length}
function filteredUsers(){const term=state.filter.toLowerCase().trim();return state.users.filter(user=>user.rol!=='admin'&&(!term||`${user.nombre} ${user.socio_nombre||''} ${user.dip} ${user.sucursal} ${user.numero_distribuidor}`.toLowerCase().includes(term)))}
function renderUsers(){
  const list=$('adminUserList'),users=filteredUsers();if(!list)return;if(!users.length){list.innerHTML='<div class="empty">No hay distribuidores para mostrar.</div>';return}
  list.innerHTML=users.map(user=>{let membership=membershipInfo(user);const prueba=state.pruebas.get(user.user_id);if(prueba){const dias=Math.max(0,Math.ceil((new Date(prueba).getTime()-Date.now())/86400000));membership={label:dias===0?'🧪 PRUEBA · VENCE HOY':`🧪 PRUEBA · ${dias}D`,cls:'trial',days:dias}}const expires=user.membresia_vence?new Date(user.membresia_vence).toLocaleDateString('es-AR'):'—';return `<article class="admin-user-row" data-admin-user="${esc(user.user_id)}"><div><h3>${esc(user.nombre||'Sin nombre')}${user.socio_nombre?` + ${esc(user.socio_nombre)}`:''}</h3><p>${esc(user.dip||'Sin número')} · Vence ${esc(expires)}<br>Titular: ${esc(user.nombre||'—')}${user.socio_nombre?` · Socio/a: ${esc(user.socio_nombre)}`:' · Sin socio/a'}</p><span class="admin-user-badge ${user.activo?'':'blocked'}">${user.activo?'ACTIVA':'BLOQUEADA'}</span><span class="membership-state ${membership.cls}">${membership.label}</span></div><div class="admin-row-actions"><button type="button" data-admin-action="people">Personas</button><button type="button" data-admin-action="password">Nueva contraseña</button><button type="button" class="btn-grace-period" data-admin-action="grace_period">📅 Prórroga</button><button type="button" class="btn-payment" data-admin-action="payment">💳 Registrar Pago</button><button type="button" class="btn-trial" data-admin-action="trial">🧪 Prueba 5 días</button><button type="button" class="${user.activo?'danger':'good'}" data-admin-action="active" data-active="${user.activo?'0':'1'}">${user.activo?'Bloquear':'Activar'}</button><button type="button" class="danger" data-admin-action="delete">Eliminar</button></div></article>`}).join('');
  list.querySelectorAll('[data-admin-action]').forEach(button=>button.onclick=()=>handleUserAction(button));
}
function renderRequests(){const list=$('adminPendingList');if(!list)return;if(!state.requests.length){list.innerHTML='<div class="admin-pending-empty">No hay solicitudes pendientes.</div>';return}list.innerHTML=state.requests.map(item=>`<article class="admin-user-row" data-request-id="${esc(item.id)}"><div><h3>${esc(item.nombre)}${item.socio_nombre?` + ${esc(item.socio_nombre)}`:''}</h3><p>${item.socio_nombre?`Socio/a: ${esc(item.socio_nombre)}<br>`:''}${esc(item.dip)} · ${esc(item.telefono)}<br>${new Date(item.created_at).toLocaleString('es-AR')}</p><span class="admin-user-badge blocked">PENDIENTE</span></div><div class="admin-row-actions"><button type="button" class="wa" data-request-action="whatsapp">WhatsApp</button><button type="button" class="good" data-request-action="approve">Aprobar</button><button type="button" class="danger" data-request-action="reject">Rechazar</button></div></article>`).join('');list.querySelectorAll('[data-request-action]').forEach(button=>button.onclick=()=>handleRequestAction(button))}
function notifyAdminMemberships(){const alerts=state.users.filter(user=>user.rol!=='admin'&&membershipInfo(user).days<=7);if(!alerts.length)return;const today=new Date().toISOString().slice(0,10),key=`appi_admin_membresias_${today}`;if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,'1');const names=alerts.slice(0,8).map(user=>`${user.nombre||user.dip}: ${membershipInfo(user).label}`).join('\n');window.APPIDialog.alert(`${alerts.length} membresía${alerts.length===1?'':'s'} requiere${alerts.length===1?'':'n'} atención.\n\n${names}`,{title:'Membresías por vencer',icon:'⏳',okText:'Revisar'})}
function render(){updateStats();renderUsers();renderRequests();if($('adminWhatsappNumber'))$('adminWhatsappNumber').value=state.whatsapp||''}
async function load(){const users=$('adminUserList'),requests=$('adminPendingList');if(users)users.innerHTML='<div class="empty">Cargando cuentas…</div>';if(requests)requests.innerHTML='<div class="admin-pending-empty">Cargando solicitudes…</div>';try{const [userData,requestData,settings]=await Promise.all([callAdmin({action:'list'}),callAdmin({action:'list_requests'}),callAdmin({action:'get_settings'})]);state.users=userData.users||[];state.requests=requestData.requests||[];state.whatsapp=settings.whatsapp||'';render();notifyAdminMemberships()}catch(error){if(users)users.innerHTML=`<div class="admin-inline-status show error">${esc(error.message)}</div>`;if(requests)requests.innerHTML=''}loadAcciones().catch(()=>{});loadPruebas().catch(()=>{})}
/* Qué cuentas están en modo PRUEBA (v294). Si la migración no corrió, el
   panel sigue andando sin los badges. */
async function loadPruebas(){
  try{const rows=await rpcAdmin('appi_admin_lista_pruebas',{});state.pruebas=new Map((Array.isArray(rows)?rows:[]).map(r=>[r.cuenta,r.vence]))}catch(e){state.pruebas=new Map()}
  renderUsers();
}
/* Cumplimiento diario (v292): resumen de las acciones que cada cuenta marcó
   con ✓ o ✗. Se lee con una función RPC que sólo responde al rol admin. */
async function rpcAdmin(fn,body){
  const configuration=cfg(),token=window.APPIAuth.accessToken();
  const response=await fetch(`${String(configuration.url).replace(/\/$/,'')}/rest/v1/rpc/${fn}`,{method:'POST',headers:{apikey:configuration.anonKey,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body||{})});
  const data=await response.json().catch(()=>null);
  if(response.status===404)throw new Error('Falta correr SUPABASE_ACCIONES_DIA.sql en Supabase.');
  if(!response.ok)throw new Error((data&&(data.message||data.error))||'No se pudo leer el cumplimiento.');
  return data;
}
async function loadAcciones(){
  const list=$('adminAccionesList');if(!list)return;
  try{
    const rows=await rpcAdmin('appi_admin_cumplimiento',{dias_atras:7});
    if(!Array.isArray(rows)||!rows.length){list.innerHTML='<div class="admin-pending-empty">Todavía no hay marcas sincronizadas.</div>';return}
    const hoy=new Date(),hoyISO=`${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}-${String(hoy.getDate()).padStart(2,'0')}`;
    const porCuenta=new Map();
    rows.forEach(row=>{
      const key=`${row.cuenta}·${row.persona}`;
      if(!porCuenta.has(key))porCuenta.set(key,{dip:row.dip,nombre:row.nombre,persona:row.persona,hoy:null,sem:{total:0,hechas:0,noHechas:0}});
      const acc=porCuenta.get(key);
      acc.sem.total+=row.total||0;acc.sem.hechas+=row.hechas||0;acc.sem.noHechas+=row.no_hechas||0;
      if(String(row.fecha)===hoyISO)acc.hoy={total:row.total||0,hechas:row.hechas||0,noHechas:row.no_hechas||0};
    });
    const pct=(hechas,total)=>total?Math.round(hechas*100/total):0;
    list.innerHTML=[...porCuenta.values()].sort((a,b)=>String(a.dip).localeCompare(String(b.dip))).map(acc=>{
      const hoyTxt=acc.hoy?`Hoy: ✓ ${acc.hoy.hechas} · ✗ ${acc.hoy.noHechas} de ${acc.hoy.total}`:'Hoy: sin marcas todavía';
      const semTxt=`Últimos 7 días: ✓ ${acc.sem.hechas} · ✗ ${acc.sem.noHechas} de ${acc.sem.total} (${pct(acc.sem.hechas,acc.sem.total)}% hecho)`;
      return `<div class="admin-pending-item"><div><strong>${esc(acc.nombre||'Sin nombre')}${acc.persona==='socio'?' · socio/a':''}</strong><span>DIP ${esc(acc.dip||'—')}</span></div><div><span>${esc(hoyTxt)}</span><span>${esc(semTxt)}</span></div></div>`;
    }).join('');
    setStatus('adminAccionesStatus','');
  }catch(error){
    list.innerHTML='<div class="admin-pending-empty">No se pudo leer el cumplimiento.</div>';
    setStatus('adminAccionesStatus',error.message,true);
  }
}
async function create(){
  const sucursal=String($('adminSucursal').value||'').replace(/\D/g,'').padStart(2,'0').slice(-2),numero=String($('adminNumero').value||'').replace(/\D/g,''),nombre=$('adminNombre').value.trim(),hasPartner=$('adminHasPartner').checked,socioNombre=hasPartner?$('adminPartnerName').value.trim():'',password=$('adminTempPassword').value;
  if(!/^\d{2}$/.test(sucursal)||!/^\d{1,12}$/.test(numero)){setStatus('adminCreateStatus','Completá sucursal y número de distribuidor.',true);return}
  if(nombre.length<2){setStatus('adminCreateStatus','Escribí el nombre del titular.',true);return}
  if(hasPartner&&socioNombre.length<2){setStatus('adminCreateStatus','Escribí el nombre del socio/a.',true);return}
  if(password.length<8||!/[A-Za-z]/.test(password)||!/[0-9]/.test(password)){setStatus('adminCreateStatus','La contraseña temporal necesita 8 caracteres, letras y números.',true);return}
  const button=$('adminCreateUser');button.disabled=true;button.textContent='Creando…';setStatus('adminCreateStatus','Creando cuenta…');
  try{
    const esPrueba=state.createMembership==='prueba';
    const data=await callAdmin({action:'create',dip:`${sucursal}-${numero}`,nombre,socio_nombre:socioNombre,password,membership_months:esPrueba?1:state.createMembership});
    if(esPrueba){
      if(!data.user||!data.user.user_id)throw new Error('La cuenta se creó, pero no se pudo activar la prueba: falta el identificador. Usá la píldora 🧪 de su carpeta.');
      try{await rpcAdmin('appi_admin_activar_prueba',{p_user_id:data.user.user_id})}
      catch(error){throw new Error(`La cuenta se creó, pero no se pudo activar la prueba: ${error.message} Usá la píldora 🧪 de su carpeta.`)}
    }
    setStatus('adminCreateStatus',esPrueba?`Cuenta creada en modo PRUEBA (5 días): ${data.user.dip} · contraseña temporal lista.`:`Cuenta creada: ${data.user.dip} · contraseña temporal lista.`);
    await navigator.clipboard.writeText(`APPI\nDistribuidor: ${data.user.dip}\nTitular: ${nombre}${socioNombre?`\nSocio/a: ${socioNombre}`:''}\nContraseña temporal: ${password}`).catch(()=>{});
    ['adminSucursal','adminNumero','adminNombre','adminPartnerName','adminTempPassword'].forEach(id=>$(id).value='');$('adminHasPartner').checked=false;$('adminPartnerField').hidden=true;
    await load();
    
    // Actualizar estadísticas de ganancias
    if(window.APPIAdminMembership&&window.APPIAdminMembership.renderRevenuePanel){
      window.APPIAdminMembership.renderRevenuePanel();
    }
    
    if(typeof showToast==='function')showToast('Cuenta creada y datos copiados 📋',2800);
  }catch(error){setStatus('adminCreateStatus',error.message,true)}finally{button.disabled=false;button.textContent='Crear cuenta'}
}
async function handleUserAction(button){
  const row=button.closest('[data-admin-user]'),userId=row&&row.dataset.adminUser,user=state.users.find(item=>item.user_id===userId);if(!userId||!user)return;button.disabled=true;
  try{
    const action=button.dataset.adminAction;
    if(action==='people'){
      const titular=await window.APPIDialog.prompt('Nombre y apellido del titular.',user.nombre||'',{title:'Editar personas',icon:'👥',placeholder:'Nombre del titular',okText:'Continuar'});if(titular===null)return;
      const socio=await window.APPIDialog.prompt('Nombre y apellido del socio/a. Dejá el campo vacío si la cuenta no tiene socio.',user.socio_nombre||'',{title:'Socio/a de la cuenta',icon:'🤝',placeholder:'Sin socio/a',okText:'Guardar'});if(socio===null)return;
      await callAdmin({action:'update_people',user_id:userId,nombre:String(titular).trim(),socio_nombre:String(socio).trim()});await load();return;
    }
    if(action==='trial'){
      const prueba=state.pruebas.get(user.user_id);
      if(prueba){await window.APPIDialog.alert('Esta cuenta ya está en modo PRUEBA.',{title:'Modo PRUEBA',icon:'🧪'});return}
      const ok=await window.APPIDialog.confirm(`${user.nombre||user.dip} pasará a modo PRUEBA por 5 días. Su membresía actual se pisa y verá la franja roja de versión de prueba. ¿Seguimos?`,{title:'Poner a prueba',icon:'🧪',okText:'Activar prueba'});
      if(!ok)return;
      await rpcAdmin('appi_admin_activar_prueba',{p_user_id:userId});
      await window.APPIDialog.alert('Listo: la cuenta quedó en modo PRUEBA por 5 días calendario.',{title:'Prueba activada',icon:'🧪'});
      await load();return;
    }
    if(action==='password'){
      const password=await window.APPIDialog.prompt('Se copiará al portapapeles y el distribuidor deberá cambiarla al ingresar.',randomPassword(),{title:'Nueva contraseña temporal',icon:'🔐',inputType:'text',okText:'Actualizar'});if(!password)return;
      await callAdmin({action:'set_password',user_id:userId,password});await navigator.clipboard.writeText(password).catch(()=>{});await window.APPIDialog.alert('Contraseña actualizada y copiada.',{title:'Listo',icon:'✓'});return;
    }
    if(action==='grace_period'){
      if(window.APPIAdminMembership&&window.APPIAdminMembership.showGracePeriodModal){
        window.APPIAdminMembership.showGracePeriodModal(userId,user.nombre||user.dip);
      }else{
        await window.APPIDialog.alert('El sistema de membresías no está disponible.',{title:'Error',icon:'!'});
      }
      return;
    }
    if(action==='payment'){
      if(window.APPIAdminMembership&&window.APPIAdminMembership.showPaymentModal){
        window.APPIAdminMembership.showPaymentModal(userId,user.nombre||user.dip);
      }else{
        await window.APPIDialog.alert('El sistema de membresías no está disponible.',{title:'Error',icon:'!'});
      }
      return;
    }
    if(action==='delete'){
      const ok=await window.APPIDialog.confirm(`Se eliminará definitivamente la cuenta de ${user.nombre||user.dip} y sus datos asociados.`,{title:'Eliminar cuenta',icon:'🗑️',okText:'Eliminar',danger:true});if(!ok)return;
      await callAdmin({action:'delete_user',user_id:userId});await load();return;
    }
    const activo=button.dataset.active==='1',ok=await window.APPIDialog.confirm(activo?'¿Activar esta cuenta?':'¿Bloquear esta cuenta?',{title:activo?'Activar cuenta':'Bloquear cuenta',icon:activo?'✓':'!',okText:activo?'Activar':'Bloquear',danger:!activo});if(!ok)return;
    await callAdmin({action:'set_active',user_id:userId,activo});await load();
  }catch(error){await window.APPIDialog.alert(error.message,{title:'No se pudo completar',icon:'!'})}finally{button.disabled=false}
}
async function handleRequestAction(button){
  const row=button.closest('[data-request-id]'),id=row&&row.dataset.requestId,item=state.requests.find(request=>request.id===id);if(!item)return;const action=button.dataset.requestAction;
  if(action==='whatsapp'){window.APPITel.abrir(item.telefono,`Hola ${item.nombre}, recibimos tu solicitud de acceso a APPI para el distribuidor ${item.dip}.`,item.nombre);return}
  button.disabled=true;
  try{
    if(action==='reject'){
      const ok=await window.APPIDialog.confirm(`La solicitud de ${item.nombre} quedará rechazada.`,{title:'Rechazar solicitud',icon:'×',okText:'Rechazar',danger:true});if(!ok)return;
      await callAdmin({action:'reject_request',request_id:id});await load();return;
    }
    const months=await window.APPIDialog.choose('Elegí la duración inicial para esta cuenta.',[{label:'1 mes',value:1},{label:'🧪 PRUEBA · 5 días',value:'prueba'}],{title:'Membresía inicial',icon:'📅'});if(!months)return;
    const esPrueba=months==='prueba';
    const password=await window.APPIDialog.prompt('La persona deberá cambiarla obligatoriamente en su primer ingreso.',randomPassword(),{title:'Contraseña temporal',icon:'🔐',inputType:'text',okText:'Crear cuenta'});if(!password)return;
    const result=await callAdmin({action:'approve_request',request_id:id,password,membership_months:esPrueba?1:months});
    if(esPrueba){
      if(!result.user||!result.user.user_id)throw new Error('La cuenta se aprobó, pero no se pudo activar la prueba: falta el identificador. Usá la píldora 🧪 de su carpeta.');
      try{await rpcAdmin('appi_admin_activar_prueba',{p_user_id:result.user.user_id})}
      catch(error){throw new Error(`La cuenta se aprobó, pero no se pudo activar la prueba: ${error.message} Usá la píldora 🧪 de su carpeta.`)}
    }
    const text=`APPI\nDistribuidor: ${result.user.dip}\nTitular: ${result.user.nombre}${result.user.socio_nombre?`\nSocio/a: ${result.user.socio_nombre}`:''}\nContraseña temporal: ${password}`;await navigator.clipboard.writeText(text).catch(()=>{});
    const send=await window.APPIDialog.confirm('La cuenta fue creada y las credenciales se copiaron. ¿Querés enviarlas por WhatsApp?',{title:'Cuenta aprobada',icon:'✓',okText:'Abrir WhatsApp'});
    if(send){window.APPITel.abrir(item.telefono,`Hola ${item.nombre}, ${esPrueba?'tu cuenta de APPI fue activada en modo PRUEBA por 5 días':`tu cuenta de APPI fue aprobada por ${months} mes${months===1?'':'es'}`}.\n\nDistribuidor: ${result.user.dip}\nTitular: ${result.user.nombre}${result.user.socio_nombre?`\nSocio/a: ${result.user.socio_nombre}`:''}\nContraseña temporal: ${password}\n\nAl ingresar, APPI te pedirá crear tu contraseña personal.`,item.nombre)}
    await load();
  }catch(error){await window.APPIDialog.alert(error.message,{title:'No se pudo completar',icon:'!'})}finally{button.disabled=false}
}
async function saveWhatsapp(){const button=$('adminSaveWhatsapp'),crudo=String($('adminWhatsappNumber').value||''),numero=window.APPITel?window.APPITel.normalizar(crudo):crudo.replace(/\D/g,'');button.disabled=true;try{if(!numero)throw new Error('Ese número no parece un celular argentino válido. Cargalo con código de área, por ejemplo 351 766-9967.');const data=await callAdmin({action:'set_whatsapp',numero});state.whatsapp=data.whatsapp||numero;setStatus('adminWhatsappStatus','Número de WhatsApp actualizado.');await window.APPIAccountRequest.getConfig(true).catch(()=>{})}catch(error){setStatus('adminWhatsappStatus',error.message,true)}finally{button.disabled=false}}
async function logout(){const ok=await window.APPIDialog.confirm('Se cerrará la sesión administradora y se limpiarán los datos locales de este dispositivo.',{title:'Cerrar sesión',icon:'↪',okText:'Cerrar sesión'});if(!ok)return;const button=$('btnAdminPanelLogout');button.disabled=true;try{await window.APPIDataSync.logoutAndLock({removeCache:true});location.reload()}catch(error){button.disabled=false;await window.APPIDialog.alert(error.message,{title:'No se pudo cerrar',icon:'!'})}}
function bind(){if(state.bound)return;state.bound=true;['adminSucursal','adminNumero','adminNombre','adminPartnerName','adminTempPassword'].forEach(id=>{const input=$(id);if(input)input.value=''});document.querySelectorAll('[data-create-membership]').forEach(button=>button.onclick=()=>{state.createMembership=button.dataset.createMembership==='prueba'?'prueba':Number(button.dataset.createMembership);document.querySelectorAll('[data-create-membership]').forEach(item=>item.classList.toggle('active',item===button))});$('adminHasPartner').onchange=()=>{$('adminPartnerField').hidden=!$('adminHasPartner').checked;if($('adminHasPartner').checked)setTimeout(()=>$('adminPartnerName').focus(),40);else $('adminPartnerName').value=''};$('adminGeneratePassword').onclick=()=>$('adminTempPassword').value=randomPassword();$('adminCreateUser').onclick=create;$('adminRefreshUsers').onclick=load;$('adminRefreshRequests').onclick=load;const refreshAcciones=$('adminRefreshAcciones');if(refreshAcciones)refreshAcciones.onclick=()=>loadAcciones();$('adminSaveWhatsapp').onclick=saveWhatsapp;$('btnAdminPanelLogout').onclick=logout;$('btnAdminPanelPassword').onclick=()=>window.abrirCambioPasswordAPPI();$('adminUserSearch').oninput=event=>{state.filter=event.target.value;renderUsers()};$('adminSucursal').oninput=event=>event.target.value=event.target.value.replace(/\D/g,'').slice(0,2);$('adminNumero').oninput=event=>event.target.value=event.target.value.replace(/\D/g,'').slice(0,12);$('adminWhatsappNumber').oninput=event=>event.target.value=event.target.value.replace(/\D/g,'').slice(0,15)}
function open(){const profile=window.APPIAuth.currentProfile();if(!profile||profile.rol!=='admin')return;bind();$('adminPanelIdentity').textContent='Administración del equipo';load();
  // Cargar estadísticas de ganancias
  if(window.APPIAdminMembership&&window.APPIAdminMembership.renderRevenuePanel){
    setTimeout(()=>window.APPIAdminMembership.renderRevenuePanel(),500);
  }
}
window.APPIAdminPanel={open,load};
})();
