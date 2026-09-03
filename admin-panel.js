(function(){
'use strict';
const state={users:[],requests:[],filter:'',whatsapp:'',createMembership:1,bound:false,pruebas:new Map(),acciones:[],accionesFiltro:'',pagos:null,pagosMes:'',revenue:null,userAbierto:'',telefonos:new Map(),tab:'hoy',plataVisible:false,cuentaFiltro:''};
const $=id=>document.getElementById(id);
const esc=value=>String(value==null?'':value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const cfg=()=>window.APPIAuth.config();
function randomPassword(){const upper='ABCDEFGHJKLMNPQRSTUVWXYZ',lower='abcdefghijkmnopqrstuvwxyz',numbers='23456789',special='!@#$%',all=upper+lower+numbers+special,pick=set=>set[crypto.getRandomValues(new Uint32Array(1))[0]%set.length],chars=[pick(upper),pick(lower),pick(numbers),pick(special)];while(chars.length<14)chars.push(pick(all));for(let i=chars.length-1;i>0;i--){const j=crypto.getRandomValues(new Uint32Array(1))[0]%(i+1);[chars[i],chars[j]]=[chars[j],chars[i]]}return chars.join('')}
/* Los números de WhatsApp se arman en un solo lugar: telefono.js (window.APPITel).
   Acá vivía una función propia que agregaba dígitos sin validar (por ejemplo
   "+54 280 434264454" terminaba en 549280434264454, un número que no existe). */
function finMembresiaMs(vence){
  if(!vence) return 0;
  const s=String(vence).trim();
  const m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  let y,mo,d;
  if(m){ y=+m[1]; mo=+m[2]-1; d=+m[3]; }
  else {
    const dt=new Date(vence);
    if(isNaN(dt.getTime())) return 0;
    y=dt.getFullYear(); mo=dt.getMonth(); d=dt.getDate();
  }
  return new Date(y, mo, d, 23, 59, 59, 999).getTime();
}
function membershipInfo(user){
  const time=finMembresiaMs(user.membresia_vence);
  if(!time)return{label:'SIN MEMBRESÍA',cls:'expired',days:-1};
  const hoy=new Date();
  const a=new Date(hoy.getFullYear(),hoy.getMonth(),hoy.getDate());
  const fin=new Date(time);
  const b=new Date(fin.getFullYear(),fin.getMonth(),fin.getDate());
  const days=Math.round((b-a)/86400000);
  if(days>20000)return{label:'♾️ PARA SIEMPRE',cls:'forever',days};
  if(days<0)return{label:'VENCIDA',cls:'expired',days};
  if(days<=7)return{label:days===0?'VENCE HOY':`VENCE EN ${days}D`,cls:'soon',days};
  return{label:`${days} DÍAS`,cls:'',days};
}
async function callAdmin(body,retry=true){
  const configuration=cfg(),token=window.APPIAuth.accessToken();let response;
  try{response=await fetch(String(configuration.url).replace(/\/$/,'')+'/functions/v1/admin-distribuidores',{method:'POST',headers:{apikey:configuration.anonKey,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body)})}catch(error){throw new Error('No se pudo conectar con el panel administrador.')}
  const data=await response.json().catch(()=>({}));
  if(response.status===401&&retry){try{await window.APPIAuth.refresh();return callAdmin(body,false)}catch(error){await window.APPIDataSync.logoutAndLock({removeCache:false}).catch(()=>{});setTimeout(()=>location.reload(),100);throw new Error('La sesión anterior venció. Volvé a ingresar desde el candado.')}}
  if(response.status===404)throw new Error('Falta instalar la función admin-distribuidores en Supabase.');
  if(!response.ok)throw new Error(data.error||'No se pudo completar la operación.');return data;
}
function setStatus(id,message,error=false){const node=$(id);if(!node)return;node.textContent=message||'';node.className='admin-inline-status'+(message?' show':'')+(error?' error':'')}
/* Tablero (v301): la plata del mes como protagonista, con la tendencia anual
   y los chips del estado general. Reemplaza a las tarjetas sueltas. */
const MESES_ADMIN=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
function updateStats(){renderHero();renderAtencion()}
function renderHero(){
  const hero=$('adminHero');if(!hero)return;
  const users=state.users.filter(user=>user.rol!=='admin');
  const activos=users.filter(user=>user.activo).length;
  const enPrueba=state.pruebas.size;
  const porVencer=users.filter(user=>{if(state.pruebas.has(user.user_id)||!user.activo)return false;const d=membershipInfo(user).days;return d>=0&&d<=7}).length;
  const pend=state.requests.length;
  const hoy=new Date(),anio=hoy.getFullYear(),mesAct=`${anio}-${String(hoy.getMonth()+1).padStart(2,'0')}`;
  const pagos=Array.isArray(state.pagos)?state.pagos:[];
  const totalDe=clave=>pagos.filter(row=>String(row.fecha).slice(0,7)===clave).reduce((acc,row)=>acc+(Number(row.monto)||0),0);
  const mesTotal=totalDe(mesAct);
  const prev=new Date(anio,hoy.getMonth()-1,1),clavePrev=`${prev.getFullYear()}-${String(prev.getMonth()+1).padStart(2,'0')}`;
  const prevTotal=totalDe(clavePrev);
  const cmp=prevTotal>0?Math.round((mesTotal-prevTotal)*100/prevTotal):null;
  const historico=state.revenue&&typeof state.revenue.totalRevenue==='number'&&state.revenue.totalRevenue>0?state.revenue.totalRevenue:pagos.reduce((acc,row)=>acc+(Number(row.monto)||0),0);
  const totalesAnio=MESES_ADMIN.map((_,i)=>totalDe(`${anio}-${String(i+1).padStart(2,'0')}`));
  const maxBar=Math.max(...totalesAnio,1);
  const bars=MESES_ADMIN.map((nombre,i)=>{
    const clave=`${anio}-${String(i+1).padStart(2,'0')}`;
    const alto=Math.max(6,Math.round(totalesAnio[i]*100/maxBar));
    return `<button type="button" data-hero-mes="${clave}" class="${clave===mesAct?'on':''}" style="height:${totalesAnio[i]?alto:6}%" title="${nombre}: ${moneyAdmin(totalesAnio[i])}" aria-label="${nombre}"></button>`;
  }).join('');
  hero.innerHTML=`<div class="k">Recaudado en ${MESES_ADMIN[hoy.getMonth()].toLowerCase()}</div>
    <b class="big">${moneyAdmin(mesTotal)}</b>
    <div class="cmp">${cmp===null?'':`${cmp>=0?'↑':'↓'} ${Math.abs(cmp)}% vs. mes anterior · `}${moneyAdmin(historico)} histórico</div>
    <div class="bars">${bars}</div>
    <div class="chips">
      <i>👥 ${activos} activa${activos===1?'':'s'} de ${users.length}</i>
      <i>🧪 ${enPrueba} en prueba</i>
      <i>⏳ ${porVencer} vence${porVencer===1?'':'n'} esta semana</i>
      <i class="${pend?'alert':''}" id="adminChipSolicitudes">● ${pend} solicitud${pend===1?'':'es'}</i>
    </div>
    <button type="button" class="admin-ojo" id="adminOjoHero" aria-label="Mostrar montos">👁</button>`;
  hero.querySelectorAll('[data-hero-mes]').forEach(btn=>btn.onclick=()=>abrirIngresosEn(btn.dataset.heroMes));
  const chip=$('adminChipSolicitudes');
  if(chip&&pend)chip.onclick=()=>showAdminTab('solicitudes');
  const ojo=$('adminOjoHero'); if(ojo) ojo.onclick=togglePlata;
  pintarOjos();
}
function renderAtencion(){
  const list=$('adminAtencionList');if(!list)return;
  const items=[];
  state.requests.forEach(item=>items.push({ico:'📨',t:`${item.nombre} pidió acceso`,s:`${item.dip} · aprobar o rechazar`,go:'solicitudes'}));
  state.users.filter(user=>user.rol!=='admin'&&user.activo).forEach(user=>{
    const quien=user.nombre||user.dip;
    if(state.pruebas.has(user.user_id)){
      const dias=Math.max(0,Math.ceil((new Date(state.pruebas.get(user.user_id)).getTime()-Date.now())/86400000));
      if(dias<=2)items.push({ico:'🧪',t:`La prueba de ${quien} ${dias===0?'termina HOY':`termina en ${dias} día${dias===1?'':'s'}`}`,s:'¿le proponés el pase a 1 mes?',go:'usuarios'});
      return;
    }
    const info=membershipInfo(user);
    if(info.label==='VENCIDA')items.push({ico:'⛔',t:`${quien} está vencida`,s:'registrar pago, prórroga o bloquear',go:'usuarios'});
    else if(info.days===0)items.push({ico:'⏰',t:`${quien} vence HOY`,s:'registrar pago o prórroga',go:'usuarios'});
    else if(info.days>0&&info.days<=3)items.push({ico:'⏳',t:`${quien} vence en ${info.days} día${info.days===1?'':'s'}`,s:'anticipate al corte',go:'usuarios'});
  });
  if(!items.length){list.innerHTML='<div class="admin-pending-empty">✓ Todo en orden: nada urgente por ahora.</div>';return}
  list.innerHTML=items.slice(0,8).map(item=>`<button type="button" class="admin-atencion-row" data-aten-go="${item.go}"><span class="ico">${item.ico}</span><div><b>${esc(item.t)}</b><small>${esc(item.s)}</small></div><span class="chev">›</span></button>`).join('');
  list.querySelectorAll('[data-aten-go]').forEach(button=>button.onclick=()=>{
    if(button.dataset.atenGo==='solicitudes') showAdminTab('solicitudes');
    else showAdminTab('cuentas');
  });
}
function abrirIngresosEn(mes){
  showAdminTab('hoy');
  if(mes){state.pagosMes=mes;renderPagos()}
  const card=$('adminIngresosCard');
  if(card) card.scrollIntoView({behavior:'smooth',block:'start'});
}
function tipoCuenta(user){
  if(state.pruebas.has(user.user_id)) return 'prueba';
  const g=user.grace_period_until||user.prorroga_hasta||user.gracePeriodUntil||'';
  if(g && !isNaN(new Date(g).getTime()) && new Date(g).getTime()>=Date.now()) return 'prorroga';
  if(membershipInfo(user).days>20000) return 'siempre';
  return 'mes';
}
function filteredUsers(){
  const term=state.filter.toLowerCase().trim();
  return state.users.filter(user=>{
    if(user.rol==='admin') return false;
    if(state.cuentaFiltro && tipoCuenta(user)!==state.cuentaFiltro) return false;
    if(term && !`${user.nombre} ${user.socio_nombre||''} ${user.dip} ${user.sucursal} ${user.numero_distribuidor}`.toLowerCase().includes(term)) return false;
    return true;
  });
}
function pintarFiltrosCuentas(){
  const wrap=$('adminCuentasFiltros'); if(!wrap) return;
  const todos=state.users.filter(u=>u.rol!=='admin');
  const n={prueba:0,mes:0,siempre:0,prorroga:0};
  todos.forEach(u=>{ n[tipoCuenta(u)]=(n[tipoCuenta(u)]||0)+1; });
  const meta={
    prueba:{ico:'🧪',title:'Prueba',sub:'Cuentas de prueba'},
    mes:{ico:'📅',title:'1 mes',sub:'Membresía mensual'},
    siempre:{ico:'♾️',title:'Para siempre',sub:'Acceso permanente'},
    prorroga:{ico:'⏳',title:'Prórroga',sub:'Cuentas en prórroga'}
  };
  wrap.querySelectorAll('[data-cuenta-filtro]').forEach(b=>{
    const k=b.dataset.cuentaFiltro, m=meta[k], c=n[k]||0, on=state.cuentaFiltro===k;
    b.setAttribute('aria-selected', on?'true':'false');
    b.innerHTML=`<span class="cfi">${m.ico}</span><span class="cft"><b>${m.title}</b><strong>${c} cuenta${c===1?'':'s'}</strong><em>${m.sub}</em></span>${on?'<span class="cfok">✓</span>':''}`;
  });
}
function renderUsers(){
  const list=$('adminUserList'),users=filteredUsers();if(!list)return;if(!users.length){list.innerHTML='<div class="empty">'+ (state.cuentaFiltro?'Nadie en este filtro.':'No hay distribuidores para mostrar.') +'</div>';pintarFiltrosCuentas();return}
  const resumen=$('adminUsersResumen');
  if(resumen){
    const todos=state.users.filter(u=>u.rol!=='admin');
    const n=users.length;
    if(!todos.length) resumen.textContent='Todavía no hay cuentas.';
    else if(state.cuentaFiltro) resumen.textContent=`${n} cuenta${n===1?'':'s'} en este filtro`;
    else resumen.textContent=`${todos.length} cuenta${todos.length===1?'':'s'} · ${todos.filter(u=>u.activo).length} activas`;
  }
  pintarFiltrosCuentas();
  list.innerHTML=users.map(user=>{
    let membership=membershipInfo(user);
    const prueba=state.pruebas.get(user.user_id);
    if(prueba){const dias=Math.max(0,Math.ceil((new Date(prueba).getTime()-Date.now())/86400000));membership={label:dias===0?'🧪 PRUEBA · VENCE HOY':`🧪 PRUEBA · ${dias}D`,cls:'trial',days:dias}}
    const expires=user.membresia_vence?new Date(user.membresia_vence).toLocaleDateString('es-AR'):'—';
    const abierto=state.userAbierto===user.user_id;
    const acciones=abierto?`<div class="admin-user-acciones">
      <div class="admin-mem-label">Membresía</div>
      <button type="button" class="trial" data-admin-action="trial">🧪 Prueba 5 días</button>
      <button type="button" class="mes" data-admin-action="month">📅 1 mes completo</button>
      <button type="button" class="forever" data-admin-action="forever">♾️ Para siempre</button>
      <button type="button" class="prorroga" data-admin-action="grace_period">📅 Prórroga</button>
      <div class="admin-mem-label">Acciones</div>
      <button type="button" class="wa" data-admin-action="whatsapp_dist">💬 WhatsApp</button>
      <button type="button" class="ticket" data-admin-action="ticket">🎫 Ticket</button>
      <button type="button" class="pago" data-admin-action="payment">💳 Registrar pago</button>
      <button type="button" data-admin-action="password">🔑 Nueva contraseña</button>
      <button type="button" data-admin-action="people">👥 Personas</button>
      <button type="button" data-admin-action="phone">📱 Teléfono</button>
      <button type="button" class="${user.activo?'danger':'good'}" data-admin-action="active" data-active="${user.activo?'0':'1'}">${user.activo?'⛔ Bloquear':'✓ Activar'}</button>
      <button type="button" class="danger" data-admin-action="delete" style="grid-column:1/-1">🗑 Eliminar la cuenta</button>
    </div>`:'';
    return `<article class="admin-user-row" data-admin-user="${esc(user.user_id)}">
      <button type="button" class="admin-user-head" data-user-toggle="${esc(user.user_id)}">
        <div><h3>${esc(user.nombre||'Sin nombre')}${user.socio_nombre?` + ${esc(user.socio_nombre)}`:''}</h3>
        <p>${esc(user.dip||'Sin número')} · Vence ${esc(expires)}${state.telefonos.get(user.user_id)?` · 📱 ${esc(state.telefonos.get(user.user_id))}`:''}</p></div>
        <span class="admin-user-badges"><span class="admin-user-badge ${user.activo?'':'blocked'}">${user.activo?'ACTIVA':'BLOQUEADA'}</span><span class="membership-state ${membership.cls}">${membership.label}</span></span>
        <span class="admin-user-chev ${abierto?'open':''}">›</span>
      </button>${acciones}</article>`}).join('');
  list.querySelectorAll('[data-user-toggle]').forEach(head=>head.onclick=()=>{
    const id=head.dataset.userToggle;
    state.userAbierto=state.userAbierto===id?'':id;
    renderUsers();
  });
  list.querySelectorAll('[data-admin-action]').forEach(button=>button.onclick=()=>handleUserAction(button));
}
function renderRequests(){const list=$('adminPendingList');if(!list)return;
  // Parpadeo fuerte mientras haya solicitudes: que ninguna creación se pierda de vista.
  const title=$('adminPendingTitle'),badge=$('adminPendingBadge');
  if(title)title.classList.toggle('blinking',state.requests.length>0);
  if(badge){badge.hidden=!state.requests.length;badge.textContent=`● ${state.requests.length} NUEVA${state.requests.length===1?'':'S'}`}
  pintarBadgeSolic();
  if(!state.requests.length){list.innerHTML='<div class="admin-pending-empty">No hay solicitudes pendientes.</div>';return}list.innerHTML=state.requests.map(item=>`<article class="admin-user-row" data-request-id="${esc(item.id)}"><div><h3>${esc(item.nombre)}${item.socio_nombre?` + ${esc(item.socio_nombre)}`:''}</h3><p>${item.socio_nombre?`Socio/a: ${esc(item.socio_nombre)}<br>`:''}${esc(item.dip)} · ${esc(item.telefono)}<br>${new Date(item.created_at).toLocaleString('es-AR')}</p><span class="admin-user-badge blocked">PENDIENTE</span></div><div class="admin-row-actions"><button type="button" class="wa" data-request-action="whatsapp">WhatsApp</button><button type="button" class="good" data-request-action="approve">Aprobar</button><button type="button" class="danger" data-request-action="reject">Rechazar</button></div></article>`).join('');list.querySelectorAll('[data-request-action]').forEach(button=>button.onclick=()=>handleRequestAction(button))}
function notifyAdminMemberships(){const alerts=state.users.filter(user=>user.rol!=='admin'&&membershipInfo(user).days<=7);if(!alerts.length)return;const today=new Date().toISOString().slice(0,10),key=`appi_admin_membresias_${today}`;if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,'1');const names=alerts.slice(0,8).map(user=>`${user.nombre||user.dip}: ${membershipInfo(user).label}`).join('\n');window.APPIDialog.alert(`${alerts.length} membresía${alerts.length===1?'':'s'} requiere${alerts.length===1?'':'n'} atención.\n\n${names}`,{title:'Membresías por vencer',icon:'⏳',okText:'Revisar'})}
function render(){updateStats();renderUsers();renderRequests();if($('adminWhatsappNumber'))$('adminWhatsappNumber').value=state.whatsapp||''}
async function load(){const users=$('adminUserList'),requests=$('adminPendingList');if(users)users.innerHTML='<div class="empty">Cargando cuentas…</div>';if(requests)requests.innerHTML='<div class="admin-pending-empty">Cargando solicitudes…</div>';try{const [userData,requestData,settings]=await Promise.all([callAdmin({action:'list'}),callAdmin({action:'list_requests'}),callAdmin({action:'get_settings'})]);state.users=userData.users||[];state.requests=requestData.requests||[];state.whatsapp=settings.whatsapp||'';render();notifyAdminMemberships()}catch(error){if(users)users.innerHTML=`<div class="admin-inline-status show error">${esc(error.message)}</div>`;if(requests)requests.innerHTML=''}loadAcciones().catch(()=>{});loadPruebas().catch(()=>{});loadPagos().catch(()=>{});loadTelefonos().catch(()=>{});loadAnuncio().catch(()=>{});if(window.APPIAdminMembership&&window.APPIAdminMembership.loadRevenueStats)window.APPIAdminMembership.loadRevenueStats().then(r=>{state.revenue=r;renderHero()}).catch(()=>{})}
/* Teléfonos de los distribuidores (v313): el 💬 va directo cuando hay número.
   Si la migración no corrió, el panel sigue andando con el selector. */
async function loadTelefonos(){
  try{const rows=await rpcAdmin('appi_admin_telefonos',{});state.telefonos=new Map((Array.isArray(rows)?rows:[]).map(r=>[r.cuenta,r.telefono]))}catch(e){state.telefonos=new Map()}
  renderUsers();
}
async function guardarTelefono(userId,telefono){
  await rpcAdmin('appi_admin_set_telefono',{p_user_id:userId,p_telefono:String(telefono||'').trim()});
  await loadTelefonos();
}
/* Qué cuentas están en modo PRUEBA (v294). Si la migración no corrió, el
   panel sigue andando sin los badges. */
async function loadPruebas(){
  try{const rows=await rpcAdmin('appi_admin_lista_pruebas',{});state.pruebas=new Map((Array.isArray(rows)?rows:[]).map(r=>[r.cuenta,r.vence]))}catch(e){state.pruebas=new Map()}
  window.__appiPruebasCount=state.pruebas.size;
  renderUsers();renderHero();renderAtencion();
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
    const rows=await rpcAdmin('appi_admin_cumplimiento',{dias_atras:370});
    state.acciones=Array.isArray(rows)?rows:[];
    setStatus('adminAccionesStatus','');
  }catch(error){
    state.acciones=[];
    setStatus('adminAccionesStatus',error.message,true);
  }
  renderAcciones();
}
/* Credenciales en dos mensajes (v300): la bienvenida explica qué hacer y la
   contraseña viaja sola, para copiar y pegar sin borrar nada. */
function mensajeBienvenida({nombre,dip,socio,esPrueba}){
  return `Hola ${nombre}! 🎉 Te damos la bienvenida a APPI.\n\n${esPrueba?'Tu cuenta de PRUEBA (5 días) ya está lista.':'Tu cuenta ya está lista.'}\n\nDistribuidor: ${dip}\nTitular: ${nombre}${socio?`\nSocio/a: ${socio}`:''}\n\nPara empezar:\n1) Entrá a https://somospopups.github.io/appi/\n2) Ingresá tu número de distribuidor y la contraseña temporal (te la mando en un mensaje aparte, para que la copies fácil).\n3) APPI te va a pedir crear tu contraseña personal.\n\n¡Cualquier duda, escribime! 😊`;
}
function abrirWhatsAppCredencial(telefono,texto,nombre){
  const digits=String(telefono||'').replace(/\D/g,'');
  if(digits&&window.APPITel&&window.APPITel.esValido(telefono)){window.APPITel.abrir(telefono,texto,nombre);return}
  // Sin teléfono (o inválido): WhatsApp abre el selector de contactos.
  const url=`https://wa.me/?text=${encodeURIComponent(texto)}`;
  if(window.APPIWhatsApp&&window.APPIWhatsApp.abrir)window.APPIWhatsApp.abrir(url);else window.open(url,'_blank','noopener');
}
function popupCredenciales({nombre,dip,socio,password,telefono,esPrueba}){
  const overlay=document.createElement('div');
  overlay.className='modal-overlay membership-modal-overlay admin-create-overlay';
  overlay.innerHTML=`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="adminSendTitle">
    <div class="modal-header"><h2 id="adminSendTitle">📨 Enviar credenciales</h2><button type="button" class="modal-close" aria-label="Cerrar">×</button></div>
    <div class="modal-body">
      <p><strong>${esc(nombre)}</strong> · ${esc(dip)}${esPrueba?' · 🧪 PRUEBA 5 días':''}</p>
      <p style="color:#777887;font-size:11.5px;line-height:1.5">Las credenciales ya se copiaron al portapapeles. Mandá los dos mensajes: primero la bienvenida con los pasos, después la contraseña <b>sola</b>, para que la copien y peguen sin borrar nada.</p>
      <div class="admin-send-grid">
        <button type="button" class="bienvenida" id="adminSendWelcome">💬 Enviar bienvenida y pasos</button>
        <button type="button" class="clave" id="adminSendPassword">🔑 Enviar solo la contraseña</button>
        <button type="button" class="cerrar" id="adminSendClose">Listo</button>
      </div>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  const close=()=>overlay.remove();
  overlay.querySelector('.modal-close').onclick=close;
  overlay.querySelector('#adminSendClose').onclick=close;
  overlay.querySelector('#adminSendWelcome').onclick=()=>abrirWhatsAppCredencial(telefono,mensajeBienvenida({nombre,dip,socio,esPrueba}),nombre);
  overlay.querySelector('#adminSendPassword').onclick=()=>abrirWhatsAppCredencial(telefono,String(password),nombre);
}
function abrirCrearCuenta(){const ov=$('adminCreateOverlay');if(ov){ov.hidden=false;setTimeout(()=>{const f=$('adminSucursal');if(f)f.focus()},60)}}
function cerrarCrearCuenta(){const ov=$('adminCreateOverlay');if(ov)ov.hidden=true;setStatus('adminCreateStatus','')}
async function create(){
  const sucursal=String($('adminSucursal').value||'').replace(/\D/g,'').padStart(2,'0').slice(-2),numero=String($('adminNumero').value||'').replace(/\D/g,''),nombre=$('adminNombre').value.trim(),hasPartner=$('adminHasPartner').checked,socioNombre=hasPartner?$('adminPartnerName').value.trim():'',password=$('adminTempPassword').value;
  if(!/^\d{2}$/.test(sucursal)||!/^\d{1,12}$/.test(numero)){setStatus('adminCreateStatus','Completá sucursal y número de distribuidor.',true);return}
  if(nombre.length<2){setStatus('adminCreateStatus','Escribí el nombre del titular.',true);return}
  if(hasPartner&&socioNombre.length<2){setStatus('adminCreateStatus','Escribí el nombre del socio/a.',true);return}
  if(password.length<8||!/[A-Za-z]/.test(password)||!/[0-9]/.test(password)){setStatus('adminCreateStatus','La contraseña temporal necesita 8 caracteres, letras y números.',true);return}
  const button=$('adminCreateUser');button.disabled=true;button.textContent='Creando…';setStatus('adminCreateStatus','Creando cuenta…');
  try{
    const esPrueba=state.createMembership==='prueba',esSiempre=state.createMembership==='siempre';
    const data=await callAdmin({action:'create',dip:`${sucursal}-${numero}`,nombre,socio_nombre:socioNombre,password,membership_months:(esPrueba||esSiempre)?1:state.createMembership});
    if(esPrueba||esSiempre){
      if(!data.user||!data.user.user_id)throw new Error(`La cuenta se creó, pero falta el identificador para ${esPrueba?'activar la prueba':'el acceso permanente'}. Usá la píldora de su carpeta.`);
      try{await rpcAdmin(esPrueba?'appi_admin_activar_prueba':'appi_admin_para_siempre',{p_user_id:data.user.user_id})}
      catch(error){throw new Error(`La cuenta se creó, pero no se pudo completar: ${error.message} Usá la píldora de su carpeta.`)}
    }
    setStatus('adminCreateStatus',esPrueba?`Cuenta creada en modo PRUEBA (5 días): ${data.user.dip} · contraseña temporal lista.`:esSiempre?`Cuenta creada con acceso PARA SIEMPRE: ${data.user.dip} · contraseña temporal lista.`:`Cuenta creada: ${data.user.dip} · contraseña temporal lista.`);
    await navigator.clipboard.writeText(`APPI\nDistribuidor: ${data.user.dip}\nTitular: ${nombre}${socioNombre?`\nSocio/a: ${socioNombre}`:''}\nContraseña temporal: ${password}`).catch(()=>{});
    const telefonoNuevo=$('adminTelefono')?$('adminTelefono').value:'';
    if(data.user&&data.user.user_id&&String(telefonoNuevo||'').trim())guardarTelefono(data.user.user_id,telefonoNuevo).catch(()=>{});
    ['adminSucursal','adminNumero','adminNombre','adminPartnerName','adminTempPassword','adminTelefono'].forEach(id=>{const f=$(id);if(f)f.value=''});$('adminHasPartner').checked=false;$('adminPartnerField').hidden=true;
    cerrarCrearCuenta();
    popupCredenciales({nombre,dip:data.user.dip,socio:socioNombre,password,telefono:telefonoNuevo,esPrueba});
    await load();
    
    // Refrescar el tablero con la cuenta nueva
    loadPagos().catch(()=>{});
    
    if(typeof showToast==='function')showToast('Cuenta creada y datos copiados 📋',2800);
  }catch(error){setStatus('adminCreateStatus',error.message,true)}finally{button.disabled=false;button.textContent='Crear cuenta'}
}
function fechaTicketCorta(d){
  const meses=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
}
function fechaTicketDesdeVence(vence){
  const s=String(vence||'').trim();
  const m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if(m) return new Date(+m[1],+m[2]-1,+m[3]);
  const dt=new Date(vence);
  return isNaN(dt.getTime())?null:new Date(dt.getFullYear(),dt.getMonth(),dt.getDate());
}
function htmlTicketCine({nombre,dip,pagoTxt,hastaTxt}){
  return `<div class="appi-ticket" id="adminTicketCard">
    <div class="appi-ticket-stub">
      <span class="t-brand">APPI</span>
      <span class="t-vert">${esc(nombre||'APPI')} · ${esc(dip||'')}</span>
    </div>
    <div class="appi-ticket-body">
      <div class="t-top">APPI</div>
      <div class="t-name">${esc((nombre||'SIN NOMBRE').toUpperCase())}</div>
      <div class="t-dip">DIP ${esc(dip||'—')}</div>
      <div class="t-ico">🎫</div>
      <div class="appi-ticket-rows">
        <div><span>PAGÓ</span><b>${esc(pagoTxt)}</b></div>
        <div><span>MEMBRESÍA HASTA</span><b>${esc(hastaTxt)}</b></div>
      </div>
      <div class="appi-ticket-stamp">PAGADO</div>
      <div class="appi-ticket-foot">Comprobante de membresía</div>
    </div>
  </div>`;
}
async function capturarTicketCine(datos){
  const wrap=document.createElement('div');
  wrap.className='appi-ticket-shot';
  wrap.innerHTML=htmlTicketCine(datos);
  document.body.appendChild(wrap);
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  const card=wrap.querySelector('#adminTicketCard');
  const h2c=window.html2canvas;
  if(typeof h2c!=='function' || !card){ wrap.remove(); throw new Error('No se pudo armar el ticket.'); }
  try{
    const canvas=await h2c(card,{backgroundColor:'#f4ead4',scale:2,logging:false,useCORS:true});
    const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('No se pudo armar el ticket.')),'image/png',1));
    return blob;
  }finally{ wrap.remove(); }
}
async function compartirImagenWhatsApp(blob,titulo,fileName){
  const file=new File([blob],fileName,{type:'image/png'});
  if(navigator.canShare&&navigator.canShare({files:[file]})){
    try{ await navigator.share({files:[file],title:titulo,text:titulo}); return; }
    catch(e){ if(e&&e.name==='AbortError') return; }
  }
  try{
    if(navigator.clipboard&&window.ClipboardItem){
      await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);
    }
  }catch(e){}
  abrirWhatsAppCredencial('',titulo);
  descargarBlobCump(blob,fileName);
  if(typeof showToast==='function') showToast('WhatsApp abre el listado. Adjuntá la imagen.',3200);
}
async function enviarTicketWhatsApp(user){
  const hoy=new Date();
  const pagoTxt=fechaTicketCorta(hoy);
  const info=membershipInfo(user);
  let hastaTxt='';
  if(info.days>20000) hastaTxt='Para siempre';
  else {
    const dv=fechaTicketDesdeVence(user.membresia_vence);
    if(!dv){ await window.APPIDialog.alert('Esta cuenta no tiene fecha de membresía. Dale 1 mes y después mandá el ticket.',{title:'Ticket',icon:'🎫'}); return; }
    hastaTxt=fechaTicketCorta(dv);
  }
  const nombre=user.nombre||'Sin nombre';
  const dip=user.dip||'—';
  const titulo=`Comprobante APPI · ${nombre} · pagó ${pagoTxt} · membresía hasta ${hastaTxt}`;
  const fileName=`ticket-appi-${String(nombre).replace(/\s+/g,'-')}.png`;
  try{
    const blob=await capturarTicketCine({nombre,dip,pagoTxt,hastaTxt});
    await compartirImagenWhatsApp(blob,titulo,fileName);
  }catch(error){
    await window.APPIDialog.alert(error.message||'No se pudo armar el ticket.',{title:'Ticket',icon:'🎫'});
  }
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
    if(action==='whatsapp_dist'){
      const pilaDist=(user.nombre||'').trim().split(/\s+/)[0]||'';
      const mensaje=`Hola ${pilaDist}! 😊 ¿Cómo vas con APPI? ¿Necesitás ayuda con algo? Cualquier cosa estoy acá para darte una mano. 💪`;
      let telDist=state.telefonos.get(userId)||'';
      if(!(telDist&&window.APPITel&&window.APPITel.esValido(telDist))){
        // Sin número guardado: se ofrece cargarlo una vez y queda para siempre.
        const nuevoTel=await window.APPIDialog.prompt(`Cargá el WhatsApp de ${user.nombre||user.dip} para ir directo (con código de área, ej: 351 766-9967). Dejalo vacío para elegir el contacto a mano.`,telDist,{title:'WhatsApp del distribuidor',icon:'📱',inputType:'tel',okText:'Continuar'});
        if(nuevoTel===null)return;
        const limpio=String(nuevoTel||'').trim();
        if(limpio&&window.APPITel&&window.APPITel.esValido(limpio)){
          try{await guardarTelefono(userId,limpio);telDist=limpio}catch(error){await window.APPIDialog.alert(error.message,{title:'No se pudo guardar',icon:'!'});telDist=limpio}
        } else telDist='';
      }
      if(telDist&&window.APPITel&&window.APPITel.esValido(telDist))window.APPITel.abrir(telDist,mensaje,pilaDist);
      else abrirWhatsAppCredencial('',mensaje,pilaDist);
      return;
    }
    if(action==='phone'){
      const actual=state.telefonos.get(userId)||'';
      const nuevoTel=await window.APPIDialog.prompt('WhatsApp del distribuidor, con código de área (ej: 351 766-9967). Dejá vacío para borrarlo.',actual,{title:`📱 ${user.nombre||user.dip}`,icon:'📱',inputType:'tel',okText:'Guardar'});
      if(nuevoTel===null)return;
      const limpio=String(nuevoTel||'').trim();
      if(limpio&&!(window.APPITel&&window.APPITel.esValido(limpio))){await window.APPIDialog.alert('Ese número no parece un celular argentino válido. Revisá el código de área.',{title:'Número incompleto',icon:'📵'});return}
      await guardarTelefono(userId,limpio);
      if(typeof showToast==='function')showToast(limpio?'Teléfono guardado 📱':'Teléfono borrado');
      return;
    }
    if(action==='month'){
      const info=membershipInfo(user);
      if(info.days>20000){await window.APPIDialog.alert('Esta cuenta ya tiene acceso permanente.',{title:'1 mes completo',icon:'📅'});return}
      const baseMs=Math.max(Date.now(),user.membresia_vence?new Date(user.membresia_vence).getTime():0);
      const hasta=new Date(baseMs);const dia=hasta.getDate();hasta.setDate(1);hasta.setMonth(hasta.getMonth()+1);hasta.setDate(Math.min(dia,new Date(hasta.getFullYear(),hasta.getMonth()+1,0).getDate()));
      const fecha=hasta.toLocaleDateString('es-AR');
      const enPrueba=state.pruebas.has(user.user_id);
      const texto=enPrueba
        ?`La prueba de ${user.nombre||user.dip} pasa a 1 mes completo, hasta el ${fecha}. ¿Confirmás?`
        :(info.days<0
          ?`${user.nombre||user.dip} va a tener 1 mes completo de APPI, hasta el ${fecha}. ¿Confirmás?`
          :`${user.nombre||user.dip} va a tener 1 mes completo más de APPI, hasta el ${fecha}. Los días que le quedan se suman. ¿Confirmás?`);
      const okMes=await window.APPIDialog.confirm(texto,{title:'1 mes completo',icon:'📅',okText:'Dar 1 mes'});
      if(!okMes)return;
      const data=await callAdmin({action:'grant_month',user_id:userId});
      const fechaReal=data&&data.expires_at?new Date(data.expires_at).toLocaleDateString('es-AR'):fecha;
      await window.APPIDialog.alert(`Listo: ${user.nombre||user.dip} tiene APPI hasta el ${fechaReal}.`,{title:'1 mes completo',icon:'📅'});
      await load();return;
    }
    if(action==='forever'){
      const okSiempre=await window.APPIDialog.confirm(`${user.nombre||user.dip} tendrá acceso a APPI PARA SIEMPRE, sin vencimiento. ¿Confirmás?`,{title:'Membresía permanente',icon:'♾️',okText:'Dar acceso permanente'});
      if(!okSiempre)return;
      await rpcAdmin('appi_admin_para_siempre',{p_user_id:userId});
      await window.APPIDialog.alert('Listo: la cuenta quedó con acceso permanente.',{title:'Para siempre',icon:'♾️'});
      await load();return;
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
    if(action==='ticket'){
      await enviarTicketWhatsApp(user);
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
    const months=await window.APPIDialog.choose('Elegí la duración inicial para esta cuenta.',[{label:'1 mes',value:1},{label:'🧪 PRUEBA · 5 días',value:'prueba'},{label:'♾️ PARA SIEMPRE',value:'siempre'}],{title:'Membresía inicial',icon:'📅'});if(!months)return;
    const esPrueba=months==='prueba',esSiempre=months==='siempre';
    const password=await window.APPIDialog.prompt('La persona deberá cambiarla obligatoriamente en su primer ingreso.',randomPassword(),{title:'Contraseña temporal',icon:'🔐',inputType:'text',okText:'Crear cuenta'});if(!password)return;
    const result=await callAdmin({action:'approve_request',request_id:id,password,membership_months:(esPrueba||esSiempre)?1:months});
    if(esPrueba||esSiempre){
      if(!result.user||!result.user.user_id)throw new Error(`La cuenta se aprobó, pero falta el identificador para ${esPrueba?'activar la prueba':'el acceso permanente'}. Usá la píldora de su carpeta.`);
      try{await rpcAdmin(esPrueba?'appi_admin_activar_prueba':'appi_admin_para_siempre',{p_user_id:result.user.user_id})}
      catch(error){throw new Error(`La cuenta se aprobó, pero no se pudo completar: ${error.message} Usá la píldora de su carpeta.`)}
    }
    if(result.user&&result.user.user_id&&item.telefono)guardarTelefono(result.user.user_id,item.telefono).catch(()=>{});
    const text=`APPI\nDistribuidor: ${result.user.dip}\nTitular: ${result.user.nombre}${result.user.socio_nombre?`\nSocio/a: ${result.user.socio_nombre}`:''}\nContraseña temporal: ${password}`;await navigator.clipboard.writeText(text).catch(()=>{});
    popupCredenciales({nombre:result.user.nombre||item.nombre,dip:result.user.dip,socio:result.user.socio_nombre||'',password,telefono:item.telefono,esPrueba});
    await load();
  }catch(error){await window.APPIDialog.alert(error.message,{title:'No se pudo completar',icon:'!'})}finally{button.disabled=false}
}
async function saveWhatsapp(){const button=$('adminSaveWhatsapp'),crudo=String($('adminWhatsappNumber').value||''),numero=window.APPITel?window.APPITel.normalizar(crudo):crudo.replace(/\D/g,'');button.disabled=true;try{if(!numero)throw new Error('Ese número no parece un celular argentino válido. Cargalo con código de área, por ejemplo 351 766-9967.');const data=await callAdmin({action:'set_whatsapp',numero});state.whatsapp=data.whatsapp||numero;setStatus('adminWhatsappStatus','Número de WhatsApp actualizado.');await window.APPIAccountRequest.getConfig(true).catch(()=>{})}catch(error){setStatus('adminWhatsappStatus',error.message,true)}finally{button.disabled=false}}
async function logout(){const ok=await window.APPIDialog.confirm('Se cerrará la sesión administradora y se limpiarán los datos locales de este dispositivo.',{title:'Cerrar sesión',icon:'↪',okText:'Cerrar sesión'});if(!ok)return;const button=$('btnAdminPanelLogout');button.disabled=true;try{await window.APPIDataSync.logoutAndLock({removeCache:true});location.reload()}catch(error){
  // La salida no puede quedar rehén de un problema de sincronización o de
  // red: se explica qué pasó y se ofrece cerrar igual.
  const forzar=await window.APPIDialog.confirm(`${error.message}\n\n¿Querés cerrar la sesión igual?`,{title:'No se pudo cerrar prolijo',icon:'⚠️',okText:'Cerrar igual',danger:true});
  if(!forzar){button.disabled=false;return}
  try{await window.APPIAuth.logout()}catch(e){}
  location.reload();
}}

function inicialesCump(nombre){
  const partes=String(nombre||'').trim().split(/\s+/).filter(Boolean);
  if(!partes.length) return '—';
  const a=(partes[0][0]||'').toUpperCase();
  const b=partes.length>1?(partes[1][0]||'').toUpperCase():'';
  return a+b;
}
function fechaCumpISO(v){
  const m=String(v||'').match(/^(\d{4}-\d{2}-\d{2})/);
  return m?m[1]:'';
}
function isoDiaOffset(base,delta){
  const d=new Date(base.getFullYear(),base.getMonth(),base.getDate()+delta);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function tonoCumpDia(d){
  if(!d || !d.total) return 'vacio';
  const p=Math.round((d.hechas||0)*100/d.total);
  if(p>=80) return 'verde';
  if(p>=50) return 'naranja';
  return 'rojo';
}
function cuentasCump(){
  const hoy=new Date(),hoyISO=isoDiaOffset(hoy,0);
  const porCuenta=new Map();
  (state.acciones||[]).forEach(row=>{
    const key=`${row.cuenta}·${row.persona}`;
    if(!porCuenta.has(key)) porCuenta.set(key,{key,cuenta:row.cuenta,dip:row.dip,nombre:row.nombre,persona:row.persona,hoy:null,sem:{total:0,hechas:0,noHechas:0},dias:{}});
    const acc=porCuenta.get(key);
    const f=fechaCumpISO(row.fecha);
    const dia={total:row.total||0,hechas:row.hechas||0,noHechas:row.no_hechas||0};
    if(f) acc.dias[f]=dia;
    acc.sem.total+=dia.total;acc.sem.hechas+=dia.hechas;acc.sem.noHechas+=dia.noHechas;
    if(f===hoyISO) acc.hoy=dia;
  });
  return [...porCuenta.values()].sort((a,b)=>String(a.nombre||a.dip).localeCompare(String(b.nombre||b.dip),'es'));
}
function dotsSemana(acc){
  const hoy=new Date();
  const letras=['D','L','M','M','J','V','S'];
  return [6,5,4,3,2,1,0].map(i=>{
    const iso=isoDiaOffset(hoy,-i);
    const dt=new Date(hoy.getFullYear(),hoy.getMonth(),hoy.getDate()-i);
    const tono=tonoCumpDia(acc.dias[iso]);
    return `<span class="cump-dow"><b>${letras[dt.getDay()]}</b><i class="cump-dot ${tono}" title="${iso}"></i></span>`;
  }).join('');
}
function renderAcciones(){
  const list=$('adminAccionesList'),resumen=$('adminAccionesResumen');
  if(!list)return;
  const cuentas=cuentasCump();
  state.cumpCuentas=cuentas;
  const hoyTot=cuentas.reduce((acc,c)=>{if(c.hoy){acc.h+=c.hoy.hechas;acc.n+=c.hoy.noHechas}return acc},{h:0,n:0});
  if(resumen)resumen.textContent=cuentas.length?`${cuentas.length} cuenta${cuentas.length===1?'':'s'} · hoy ✓ ${hoyTot.h} · ✗ ${hoyTot.n} · tocá para ver el mes`:'Todavía no hay marcas sincronizadas.';
  const term=String(state.accionesFiltro||'').toLowerCase().trim();
  const visibles=term?cuentas.filter(acc=>`${acc.nombre} ${acc.dip}`.toLowerCase().includes(term)):cuentas;
  if(!visibles.length){list.innerHTML=`<div class="admin-pending-empty">${term?'Ninguna cuenta coincide con la búsqueda.':'Todavía no hay marcas sincronizadas.'}</div>`;return}
  list.innerHTML=visibles.map(acc=>{
    const socio=acc.persona==='socio'?'<em class="admin-cump-socio">socio/a</em>':'';
    return `<button type="button" class="admin-cump-row" data-cump-key="${esc(acc.key)}">
      <span class="admin-cump-ava">${esc(inicialesCump(acc.nombre))}</span>
      <div class="admin-cump-id"><strong>${esc(acc.nombre||'Sin nombre')}${socio}</strong><small>DIP ${esc(acc.dip||'—')}</small></div>
      <span class="cump-dots">${dotsSemana(acc)}</span>
    </button>`;
  }).join('');
  list.querySelectorAll('[data-cump-key]').forEach(btn=>btn.onclick=()=>abrirCumpFicha(btn.dataset.cumpKey));
}
function cerrarCumpFicha(){
  const ov=$('adminCumpOverlay'); if(ov) ov.hidden=true;
  state.cumpKey='';
}
function abrirCumpFicha(key){
  state.cumpKey=key;
  const hoy=new Date();
  state.cumpMes=`${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}`;
  const ov=$('adminCumpOverlay'); if(ov) ov.hidden=false;
  pintarCumpFicha();
}
function pintarCumpFicha(){
  const acc=(state.cumpCuentas||[]).find(c=>c.key===state.cumpKey);
  const box=$('adminCumpFicha'); if(!box) return;
  if(!acc){box.innerHTML='';return}
  const socio=acc.persona==='socio'?' · socio/a':'';
  const ley='<div class="cump-ley"><i class="rojo"></i>Rojo (&lt;50%) <i class="naranja"></i>Naranja (50–80%) <i class="verde"></i>Verde (&gt;80%)</div>';
  const hoy=new Date();
  const mesAct=`${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}`;
  let mesSel=state.cumpMes||mesAct;
  if(mesSel>mesAct) mesSel=mesAct;
  state.cumpMes=mesSel;
  const y=Number(mesSel.slice(0,4)), m=Number(mesSel.slice(5,7))-1;
  const nombres=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const first=new Date(y,m,1).getDay();
  const last=new Date(y,m+1,0).getDate();
  const dows=['D','L','M','M','J','V','S'].map(x=>`<span class="dow">${x}</span>`).join('');
  let cells='';
  for(let i=0;i<first;i++) cells+=`<span class="admin-cump-dia pad"></span>`;
  const hoyISO=isoDiaOffset(hoy,0);
  for(let d=1;d<=last;d++){
    const iso=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const tono=tonoCumpDia(acc.dias[iso]);
    const esHoy=iso===hoyISO;
    cells+=`<span class="admin-cump-dia ${tono}${esHoy?' hoy':''}">${d}</span>`;
  }
  const puedeNext=mesSel<mesAct;
  box.innerHTML=`
    <div class="cump-ficha-head">
      <span class="admin-cump-ava">${esc(inicialesCump(acc.nombre))}</span>
      <div><strong>${esc(acc.nombre||'Sin nombre')}</strong><small>DIP ${esc(acc.dip||'—')}${esc(socio)}</small></div>
    </div>
    ${ley}
    <div class="cump-mes-nav">
      <button type="button" id="cumpMesPrev" aria-label="Mes anterior">‹</button>
      <b>Actividad de ${nombres[m]} ${y}</b>
      <button type="button" id="cumpMesNext" aria-label="Mes siguiente"${puedeNext?'':' disabled'}>›</button>
    </div>
    <div class="admin-cump-cal">${dows}${cells}</div>`;
  const mover=paso=>{
    const dt=new Date(y,m+paso,1);
    const clave=`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`;
    if(clave>mesAct) return;
    state.cumpMes=clave;
    pintarCumpFicha();
  };
  const prev=$('cumpMesPrev'); if(prev) prev.onclick=()=>mover(-1);
  const next=$('cumpMesNext'); if(next) next.onclick=()=>mover(1);
}
function tituloCumpShare(){
  const acc=(state.cumpCuentas||[]).find(c=>c.key===state.cumpKey);
  const mes=state.cumpMes||'';
  const nombres=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const y=Number(mes.slice(0,4))||new Date().getFullYear();
  const m=Number(mes.slice(5,7))-1;
  const mesNom=m>=0&&m<12?nombres[m]:'';
  return {titulo:`Cumplimiento de ${acc&&acc.nombre||'APPI'} · ${mesNom} ${y}`.trim(), fileName:`cumplimiento-${String(acc&&acc.nombre||'appi').replace(/\s+/g,'-')}-${mes||'mes'}.png`};
}
function descargarBlobCump(blob,name){
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=name;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),4000);
}
async function capturarCumpImagen(){
  const el=$('adminCumpFicha');
  if(!el) throw new Error('No está el calendario.');
  const h2c=window.html2canvas;
  if(typeof h2c!=='function') throw new Error('No se pudo armar la imagen.');
  const canvas=await h2c(el,{backgroundColor:'#f4f4f8',scale:2,logging:false,useCORS:true});
  return new Promise((resolve,reject)=>{
    canvas.toBlob(b=>b?resolve(b):reject(new Error('No se pudo armar la imagen.')),'image/png',1);
  });
}
async function enviarCumpWhatsApp(){
  const btn=$('adminCumpWa');
  if(btn) btn.disabled=true;
  try{
    const blob=await capturarCumpImagen();
    const {titulo,fileName}=tituloCumpShare();
    const file=new File([blob],fileName,{type:'image/png'});
    // En el teléfono, compartir el archivo abre WhatsApp y el listado de contactos.
    if(navigator.canShare&&navigator.canShare({files:[file]})){
      try{
        await navigator.share({files:[file],title:titulo,text:titulo});
        return;
      }catch(e){ if(e&&e.name==='AbortError') return; }
    }
    try{
      if(navigator.clipboard&&window.ClipboardItem){
        await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);
      }
    }catch(e){}
    abrirWhatsAppCredencial('',titulo);
    descargarBlobCump(blob,fileName);
    if(typeof showToast==='function') showToast('WhatsApp abre el listado. Adjuntá la imagen.',3200);
  }catch(error){
    if(window.APPIDialog) window.APPIDialog.alert(error.message||'No se pudo armar la imagen.',{title:'WhatsApp',icon:'💬'});
  }finally{
    if(btn) btn.disabled=false;
  }
}

/* ---------- Ingresos por mes (v300) ---------- */
async function loadPagos(){
  const body=$('adminIngresosBody');if(!body)return;
  try{
    const rows=await rpcAdmin('appi_admin_pagos',{p_meses:24});
    state.pagos=Array.isArray(rows)?rows:[];
    if(!state.pagosMes){const d=new Date();state.pagosMes=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
  }catch(error){
    state.pagos=null;
    body.innerHTML=`<div class="admin-pending-empty">${esc(error.message)}</div>`;
    return;
  }
  renderPagos();
}
function moneyAdmin(v){
  if(!state.plataVisible) return '$ ••••';
  return new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(Number(v)||0);
}
function pintarOjos(){
  const ico=state.plataVisible?'🙈':'👁';
  const lab=state.plataVisible?'Ocultar montos':'Mostrar montos';
  ['adminOjoHero','adminOjoIngresos'].forEach(id=>{
    const b=$(id); if(!b)return;
    b.textContent=ico; b.setAttribute('aria-label',lab); b.title=lab;
    b.classList.toggle('on', state.plataVisible);
  });
}
function togglePlata(){
  state.plataVisible=!state.plataVisible;
  renderHero();
  if(Array.isArray(state.pagos)) renderPagos();
}
function moverIndicadorAdmin(){
  const nav=$('adminTabs'), ind=$('adminTabIndicator');
  if(!nav||!ind)return;
  const btn=nav.querySelector('[data-admin-tab].active');
  if(!btn){ind.style.width='0';return;}
  ind.style.width=btn.offsetWidth+'px';
  ind.style.transform='translateX('+btn.offsetLeft+'px)';
}
function showAdminTab(tab){
  state.tab=tab||'hoy';
  ['hoy','solicitudes','cuentas','mas'].forEach(t=>{
    const pan=$('adminPane-'+t);
    if(pan) pan.hidden = (t!==state.tab);
  });
  document.querySelectorAll('#adminTabs [data-admin-tab]').forEach(b=>b.classList.toggle('active', b.dataset.adminTab===state.tab));
  const fab=$('adminFabCreate');
  if(fab) fab.classList.toggle('hid', state.tab==='mas'||state.tab==='solicitudes');
  pintarBadgeSolic();
  requestAnimationFrame(moverIndicadorAdmin);
}
function pintarBadgeSolic(){
  const n=state.requests.length;
  const badge=$('adminTabSolicBadge');
  if(badge){badge.hidden=!n; badge.textContent=n;}
  const btn=document.querySelector('#adminTabs [data-admin-tab="solicitudes"]');
  if(btn) btn.classList.toggle('alerta', n>0);
  const quick=$('adminQuickPendBadge');
  if(quick){quick.hidden=!n; quick.textContent=n;}
}
/* ---------- Anuncio para todos (v326) ----------
   El administrador escribe un mensaje y hasta una reunión (v343); el
   aviso vigente les aparece a los distribuidores al abrir APPI. */
async function fetchAdmin(path){
  const configuration=cfg(),token=window.APPIAuth.accessToken();
  const response=await fetch(`${String(configuration.url).replace(/\/$/,'')}${path}`,{headers:{apikey:configuration.anonKey,Authorization:`Bearer ${token}`}});
  const data=await response.json().catch(()=>null);
  if(response.status===404)throw new Error('Falta correr SUPABASE_ANUNCIOS.sql en Supabase.');
  if(!response.ok)throw new Error((data&&(data.message||data.error))||'No se pudo leer el anuncio.');
  return data;
}
const ANUNCIO_EVENTOS=1;
function anuncioEventosDelForm(){
  const eventos=[];
  for(let i=0;i<ANUNCIO_EVENTOS;i++){
    const titulo=$(`adminAnuncioEv${i}Titulo`),fecha=$(`adminAnuncioEv${i}Fecha`),hora=$(`adminAnuncioEv${i}Hora`),lugar=$(`adminAnuncioEv${i}Lugar`);
    if(!titulo)continue;
    const t=titulo.value.trim();
    if(!t&&!fecha.value&&!hora.value&&!lugar.value.trim())continue;
    eventos.push({titulo:t,fecha:fecha.value||'',hora:/^\d{2}:\d{2}$/.test(hora.value||'')?hora.value:'',lugar:lugar.value.trim()});
  }
  return eventos;
}
function anuncioFormDesdeRow(row){
  const texto=$('adminAnuncioTexto');if(!texto)return;
  texto.value=row?String(row.texto||''):'';
  for(let i=0;i<ANUNCIO_EVENTOS;i++){
    const titulo=$(`adminAnuncioEv${i}Titulo`),fecha=$(`adminAnuncioEv${i}Fecha`),hora=$(`adminAnuncioEv${i}Hora`),lugar=$(`adminAnuncioEv${i}Lugar`);
    if(!titulo)continue;
    const ev=row&&Array.isArray(row.eventos)?row.eventos[i]:null;
    titulo.value=ev?String(ev.titulo||''):'';
    fecha.value=ev?String(ev.fecha||''):'';
    hora.value=ev&&/^\d{2}:\d{2}$/.test(String(ev.hora||''))?String(ev.hora):'';
    lugar.value=ev?String(ev.lugar||''):'';
  }
}
async function loadAnuncio(){
  const resumen=$('adminAnuncioResumen');
  if(!resumen)return;
  try{
    const rows=await fetchAdmin('/rest/v1/appi_anuncios?select=*&activo=eq.true&order=creado_en.desc&limit=1');
    state.anuncio=Array.isArray(rows)&&rows[0]?rows[0]:null;
  }catch(error){state.anuncio=null;resumen.textContent='No se pudo leer el aviso vigente.';return}
  // El formulario arranca con el aviso vigente puesto: cambiar una palabra
  // y volver a publicar es el caso más común.
  anuncioFormDesdeRow(state.anuncio);
  renderAnuncio();
}
function renderAnuncio(){
  const resumen=$('adminAnuncioResumen');if(!resumen)return;
  const row=state.anuncio;
  if(!row){resumen.textContent='Sin aviso publicado. Escribí uno y tocá Publicar.';return}
  const fecha=new Date(row.creado_en);
  const cuando=isNaN(fecha.getTime())?'':` · ${fecha.toLocaleDateString('es-AR')}`;
  const eventos=Array.isArray(row.eventos)?row.eventos.length:0;
  const extracto=String(row.texto||'').replace(/\s+/g,' ').slice(0,60);
  resumen.textContent=`Vigente${cuando}: “${extracto}${String(row.texto||'').length>60?'…':''}”${eventos?` · ${eventos} reunión${eventos===1?'':'es'}`:''}`;
}
async function publicarAnuncio(){
  const texto=$('adminAnuncioTexto');if(!texto)return;
  const mensaje=texto.value.trim();
  if(!mensaje){setStatus('adminAnuncioStatus','Escribí el mensaje del aviso.',true);texto.focus();return}
  if(mensaje.length>600){setStatus('adminAnuncioStatus','El mensaje no puede pasar de 600 caracteres.',true);return}
  const eventos=anuncioEventosDelForm();
  for(const ev of eventos){
    if(!ev.titulo){
      setStatus('adminAnuncioStatus','Toda reunión con fecha o lugar necesita un título.',true);
      window.APPIDialog.alert('Pusiste fecha en una reunión pero le falta el título.\n\nEscribilo (ej: "Reunión general por Zoom") o borrá la fecha para dejarla vacía.',{title:'Falta el título',icon:'✍️',okText:'Entendido'});
      return;
    }
    if(!/^\d{4}-\d{2}-\d{2}$/.test(ev.fecha)){
      setStatus('adminAnuncioStatus',`“${ev.titulo}”: falta la fecha.`,true);
      window.APPIDialog.alert(`La reunión “${ev.titulo}” tiene título pero le falta la fecha.\n\nElegí el día en el calendario de esa reunión, o borrá el título para dejarla vacía.`,{title:'Falta la fecha',icon:'📅',okText:'Entendido'});
      return;
    }
  }
  try{
    await rpcAdmin('appi_admin_publicar_anuncio',{p_texto:mensaje,p_eventos:eventos});
    setStatus('adminAnuncioStatus','Publicado ✓ Lo van a ver todos al abrir APPI.');
    await window.APPIDialog.alert('El aviso quedó publicado.\n\nTodos los distribuidores lo van a ver como cartel al abrir APPI, con los botones para agendar las reuniones en APPI o en el teléfono.',{title:'Aviso publicado ✓',icon:'📣',okText:'Listo'});
    await loadAnuncio();
  }catch(error){
    let msg=error.message||'No se pudo publicar el aviso.';
    // El 404 del RPC arrastraba un texto de otra función: ahora dice la verdad.
    if(/Falta correr SUPABASE_ACCIONES_DIA/.test(msg))msg='El backend todavía no conoce los anuncios. Corré el workflow "Publicar backend completo de APPI" en GitHub.';
    setStatus('adminAnuncioStatus',msg,true);
    await window.APPIDialog.alert(msg,{title:'No se pudo publicar',icon:'⚠️',okText:'Entendido'});
  }
}
async function quitarAnuncioVigente(){
  const ok=await window.APPIDialog.confirm('El aviso va a desaparecer de los teléfonos del equipo. Lo que ya se agendó en las agendas queda.',{title:'Quitar el aviso',icon:'📣',okText:'Quitar'});
  if(!ok)return;
  try{
    await rpcAdmin('appi_admin_quitar_anuncio',{});
    setStatus('adminAnuncioStatus','Aviso quitado. Nadie ve el cartel al abrir APPI.');
    await window.APPIDialog.alert('El aviso quedó quitado: nadie va a ver el cartel al abrir APPI. Lo que ya se agendó en las agendas queda.',{title:'Aviso quitado ✓',icon:'📣',okText:'Listo'});
    await loadAnuncio();
  }catch(error){setStatus('adminAnuncioStatus',error.message||'No se pudo quitar el aviso.',true)}
}
function renderPagos(){
  const body=$('adminIngresosBody');if(!body||!Array.isArray(state.pagos))return;
  const mesSel=state.pagosMes,anio=Number(mesSel.slice(0,4));
  const porMes=new Map();
  state.pagos.forEach(row=>{
    const mes=String(row.fecha).slice(0,7);
    if(!porMes.has(mes))porMes.set(mes,{total:0,pagos:[]});
    const m=porMes.get(mes);m.total+=Number(row.monto)||0;m.pagos.push(row);
  });
  const mesData=porMes.get(mesSel)||{total:0,pagos:[]};
  const MESES=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const label=`${MESES[Number(mesSel.slice(5,7))-1]} ${anio}`;
  const mover=paso=>{const d=new Date(Number(mesSel.slice(0,4)),Number(mesSel.slice(5,7))-1+paso,1);state.pagosMes=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;renderPagos()};
  // Resumen anual: los 12 meses del año elegido, para ver la tendencia de un vistazo.
  const strip=MESES.map((nombre,i)=>{
    const clave=`${anio}-${String(i+1).padStart(2,'0')}`,datos=porMes.get(clave);
    return `<button type="button" data-mes="${clave}" class="${clave===mesSel?'sel':''}">${nombre.slice(0,3)}<small>${datos?moneyAdmin(datos.total):'—'}</small></button>`;
  }).join('');
  const filas=mesData.pagos.map(row=>`<div class="admin-pago-row"><div><b>${esc(row.nombre||'Sin nombre')}</b><small>DIP ${esc(row.dip||'—')} · ${new Date(row.fecha).toLocaleDateString('es-AR')} · ${esc(row.metodo||'')}</small></div><span class="monto">${moneyAdmin(row.monto)}</span></div>`).join('');
  body.innerHTML=`
    <div class="admin-mes-nav"><button type="button" id="adminMesPrev">‹</button><b>${label}</b><button type="button" id="adminMesNext">›</button></div>
    <div class="admin-mes-tot">
      <div class="stat-card"><b>${moneyAdmin(mesData.total)}</b><span>Recaudado en el mes</span></div>
      <div class="stat-card"><b>${mesData.pagos.length}</b><span>Pago${mesData.pagos.length===1?'':'s'} registrado${mesData.pagos.length===1?'':'s'}</span></div>
    </div>
    <div class="admin-anio-strip">${strip}</div>
    ${filas||'<div class="admin-pending-empty">Sin pagos registrados en este mes.</div>'}`;
  $('adminMesPrev').onclick=()=>mover(-1);
  $('adminMesNext').onclick=()=>mover(1);
  body.querySelectorAll('[data-mes]').forEach(btn=>btn.onclick=()=>{state.pagosMes=btn.dataset.mes;renderPagos()});
  const resumen=$('adminIngresosResumen');
  if(resumen)resumen.textContent=state.plataVisible
    ? `${label}: ${moneyAdmin(mesData.total)} · ${mesData.pagos.length} pago${mesData.pagos.length===1?'':'s'}`
    : `${label}: ${mesData.pagos.length} pago${mesData.pagos.length===1?'':'s'} · montos ocultos`;
  const ojoIng=$('adminOjoIngresos'); if(ojoIng) ojoIng.onclick=togglePlata;
  pintarOjos();
  renderHero();
}
function bind(){if(state.bound)return;state.bound=true;['adminSucursal','adminNumero','adminNombre','adminPartnerName','adminTempPassword'].forEach(id=>{const input=$(id);if(input)input.value=''});document.querySelectorAll('[data-create-membership]').forEach(button=>button.onclick=()=>{state.createMembership=(button.dataset.createMembership==='prueba'||button.dataset.createMembership==='siempre')?button.dataset.createMembership:Number(button.dataset.createMembership);document.querySelectorAll('[data-create-membership]').forEach(item=>item.classList.toggle('active',item===button))});$('adminHasPartner').onchange=()=>{$('adminPartnerField').hidden=!$('adminHasPartner').checked;if($('adminHasPartner').checked)setTimeout(()=>$('adminPartnerName').focus(),40);else $('adminPartnerName').value=''};$('adminGeneratePassword').onclick=()=>$('adminTempPassword').value=randomPassword();$('adminCreateUser').onclick=create;$('adminRefreshUsers').onclick=load;$('adminRefreshRequests').onclick=load;
  const openCreate=$('adminOpenCreate');if(openCreate)openCreate.onclick=abrirCrearCuenta;
  const closeCreate=$('adminCreateClose');if(closeCreate)closeCreate.onclick=cerrarCrearCuenta;
  const cancelCreate=$('adminCreateCancel');if(cancelCreate)cancelCreate.onclick=cerrarCrearCuenta;
  const createOverlay=$('adminCreateOverlay');if(createOverlay)createOverlay.addEventListener('click',event=>{if(event.target===createOverlay)cerrarCrearCuenta()});
  const accionesToggle=$('adminAccionesToggle');if(accionesToggle)accionesToggle.onclick=()=>{const body=$('adminAccionesBody'),chev=$('adminAccionesChevron');const abrir=body.hidden;body.hidden=!abrir;accionesToggle.setAttribute('aria-expanded',abrir?'true':'false');if(chev)chev.classList.toggle('open',abrir)};
  const accionesSearch=$('adminAccionesSearch');if(accionesSearch)accionesSearch.oninput=event=>{state.accionesFiltro=event.target.value;renderAcciones()};
  const refreshPagos=$('adminRefreshPagos');if(refreshPagos)refreshPagos.onclick=()=>loadPagos();
  const goRequests=$('adminGoRequests');if(goRequests)goRequests.onclick=()=>showAdminTab('solicitudes');
  document.querySelectorAll('#adminTabs [data-admin-tab]').forEach(b=>b.onclick=()=>showAdminTab(b.dataset.adminTab));
  const fab=$('adminFabCreate'); if(fab) fab.onclick=abrirCrearCuenta;
  const ojoIngBind=$('adminOjoIngresos'); if(ojoIngBind) ojoIngBind.onclick=togglePlata;
  window.addEventListener('resize', moverIndicadorAdmin);
  const ingresosToggle=$('adminIngresosToggle');if(ingresosToggle)ingresosToggle.onclick=()=>{const wrap=$('adminIngresosWrap'),chev=$('adminIngresosChevron');const abrir=wrap.hidden;wrap.hidden=!abrir;ingresosToggle.setAttribute('aria-expanded',abrir?'true':'false');if(chev)chev.classList.toggle('open',abrir)};
  // Anuncio para todos (v326): mensaje + reuniones que el equipo agenda en un toque.
  const anuncioToggle=$('adminAnuncioToggle');if(anuncioToggle)anuncioToggle.onclick=()=>{const body=$('adminAnuncioBody'),chev=$('adminAnuncioChevron');const abrir=body.hidden;body.hidden=!abrir;anuncioToggle.setAttribute('aria-expanded',abrir?'true':'false');if(chev)chev.classList.toggle('open',abrir)};
  const anuncioPublicar=$('adminAnuncioPublicar');if(anuncioPublicar)anuncioPublicar.onclick=()=>publicarAnuncio();
  const anuncioQuitar=$('adminAnuncioQuitar');if(anuncioQuitar)anuncioQuitar.onclick=()=>quitarAnuncioVigente();
  // El WhatsApp con el que salen los envíos del panel (v303): sin preguntar.
  const waPref=$('adminWaPref');
  if(waPref&&window.APPIWhatsApp){
    const pintarPref=()=>{const actual=window.APPIWhatsApp.preferencia();waPref.querySelectorAll('[data-wa-pref]').forEach(b=>b.classList.toggle('active',b.dataset.waPref===actual))};
    pintarPref();
    waPref.querySelectorAll('[data-wa-pref]').forEach(b=>b.onclick=()=>{
      window.APPIWhatsApp.setPreferencia(b.dataset.waPref);
      pintarPref();
      setStatus('adminWaPrefStatus',`Listo: los envíos abren ${b.dataset.waPref==='business'?'WhatsApp Business':'WhatsApp normal'} en este dispositivo.`);
    });
  }
  const usersToggle=$('adminUsersToggle');if(usersToggle)usersToggle.onclick=()=>{const body=$('adminUsersBody'),chev=$('adminUsersChevron');const abrir=body.hidden;body.hidden=!abrir;usersToggle.setAttribute('aria-expanded',abrir?'true':'false');if(chev)chev.classList.toggle('open',abrir)};
  const configToggle=$('adminConfigToggle');if(configToggle)configToggle.onclick=()=>{const body=$('adminConfigBody'),chev=$('adminConfigChevron');const abrir=body.hidden;body.hidden=!abrir;configToggle.setAttribute('aria-expanded',abrir?'true':'false');if(chev)chev.classList.toggle('open',abrir)};
  const refreshAcciones=$('adminRefreshAcciones');if(refreshAcciones)refreshAcciones.onclick=()=>loadAcciones();
  const cumpOv=$('adminCumpOverlay');
  if(cumpOv){cumpOv.addEventListener('click',e=>{if(e.target===cumpOv)cerrarCumpFicha()});}
  const cumpClose=$('adminCumpClose'); if(cumpClose) cumpClose.onclick=cerrarCumpFicha;
  const cumpWa=$('adminCumpWa'); if(cumpWa) cumpWa.onclick=enviarCumpWhatsApp;
$('adminSaveWhatsapp').onclick=saveWhatsapp;$('btnAdminPanelLogout').onclick=logout;$('btnAdminPanelPassword').onclick=()=>window.abrirCambioPasswordAPPI();const helpAdmin=$('btnHelpAdmin');if(helpAdmin)helpAdmin.onclick=()=>window.APPIDialog.alert(
`Desde acá administrás las cuentas de APPI.

ABAJO
Hoy · Solicitudes · Cuentas · Más. En el teléfono y en la PC es lo mismo.

PLATA
Los montos arrancan tapados. Tocá el 👁 para verlos. Cuando volvés a entrar, otra vez ocultos.

TABLERO
Arriba está la plata del mes con la comparación contra el mes anterior y las 12 barras del año (tocá una y saltás a ese mes). Los chips resumen el estado: activas, en prueba, por vencer y solicitudes.

NECESITAN TU ATENCIÓN
Lo urgente en un solo lugar: solicitudes sin resolver, membresías que vencen y pruebas por terminar. Tocá un renglón y te lleva.

CREAR CUENTA
Tocá "➕ Crear cuenta nueva" y completá los datos en la ventana. Elegí la duración: 1 mes, 🧪 PRUEBA (5 días con franja roja; al vencer, el ingreso se bloquea) o ♾️ PARA SIEMPRE (sin vencimiento). Al crear, podés mandar por WhatsApp la bienvenida y la contraseña en dos mensajes separados: la contraseña viaja sola para copiar y pegar fácil.

SOLICITUDES PENDIENTES
Las personas que piden acceso desde la app aparecen acá. Al aprobar elegís 1 mes o PRUEBA, y podés mandar las credenciales por WhatsApp.

CUENTAS (Distribuidores)
La sección arranca minimizada con el resumen; tocala para abrir. Cada distribuidor es un renglón: tocalo y se despliegan todas sus acciones, cómodas y con nombre: 💬 WhatsApp (va directo si la cuenta tiene el número guardado — al aprobar una solicitud queda solo; con 📱 Teléfono lo cargás o corregís cuando quieras), 🎫 Ticket (manda el comprobante por WhatsApp, con fecha de pago y hasta cuándo vale), 💳 Registrar pago y 📅 Prórroga (ambos sacan del modo prueba solos), 🔑 Nueva contraseña, 👥 Personas, 🧪 Prueba 5 días, 📅 1 mes completo (suma un mes a lo que le queda, sin registrar un pago), ♾️ Para siempre (acceso permanente), Bloquear y Eliminar.

CUMPLIMIENTO DIARIO
Lo que cada cuenta marcó con ✓ y ✗ en sus acciones del día: hoy y últimos 7 días. La sección arranca minimizada con el resumen a la vista; tocala para abrir el detalle y usá el buscador por nombre o DIP.

INGRESOS POR MES
Los pagos registrados, mes por mes: total recaudado, cantidad de pagos y quién pagó. Con las flechas cambiás de mes y la tira anual muestra los 12 meses del año.

WHATSAPP DE SOPORTE
El número que ven quienes piden ayuda para entrar. Se valida antes de guardarse.

CON QUÉ WHATSAPP MANDÁS
En Configuración elegís si los envíos del panel abren WhatsApp normal o Business en tu teléfono, sin preguntar cada vez.`,
{title:'Panel de administración',icon:'🛡️'});$('adminUserSearch').oninput=event=>{state.filter=event.target.value;renderUsers()};
  const filtrosCuentas=$('adminCuentasFiltros');
  if(filtrosCuentas) filtrosCuentas.querySelectorAll('[data-cuenta-filtro]').forEach(b=>b.onclick=()=>{
    const k=b.dataset.cuentaFiltro;
    state.cuentaFiltro = state.cuentaFiltro===k ? '' : k;
    renderUsers();
  });$('adminSucursal').oninput=event=>event.target.value=event.target.value.replace(/\D/g,'').slice(0,2);$('adminNumero').oninput=event=>event.target.value=event.target.value.replace(/\D/g,'').slice(0,12);$('adminWhatsappNumber').oninput=event=>event.target.value=event.target.value.replace(/\D/g,'').slice(0,15)}
function open(){const profile=window.APPIAuth.currentProfile();if(!profile||profile.rol!=='admin')return;state.plataVisible=false;state.tab='hoy';bind();showAdminTab('hoy');$('adminPanelIdentity').textContent='Administración del equipo';load();
  // Cargar estadísticas de ganancias
  if(window.APPIAdminMembership&&window.APPIAdminMembership.renderRevenuePanel){
    setTimeout(()=>window.APPIAdminMembership.renderRevenuePanel(),500);
  }
}
window.APPIAdminPanel={open,load,money:moneyAdmin,togglePlata,showAdminTab};
})();
