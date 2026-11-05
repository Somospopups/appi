const { test, expect } = require('@playwright/test');

const USER_ID='11111111-1111-4111-8111-111111111111';
const today=()=>{const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)};
const now=new Date().toISOString();
const CONTACTS=[
  {id:'c-follow',user_id:USER_ID,estado:'seguimiento',nombre:'Jorge Salas',telefono:'3515550001',telefono_normalizado:'3515550001',tipo:'contacto',proximo_contacto:null,created_at:now,updated_at:now},
  {id:'c-demo',user_id:USER_ID,estado:'contactado',nombre:'Lucía Vega',telefono:'3515550002',telefono_normalizado:'3515550002',tipo:'contacto',interes:'Hogar',proximo_contacto:today(),created_at:now,updated_at:now},
  {id:'c-result',user_id:USER_ID,estado:'convertido',nombre:'Carla Muñoz',telefono:'3515550003',telefono_normalizado:'3515550003',tipo:'contacto',proximo_contacto:null,created_at:now,updated_at:now}
];
function tokenFor(sub){
  const h=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
  const p=Buffer.from(JSON.stringify({sub,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url');
  return `${h}.${p}.firma`;
}
async function login(page){
  const token=tokenFor(USER_ID),created=[];
  const profile={user_id:USER_ID,username:null,dip:'02-9802014',sucursal:'02',numero_distribuidor:'9802014',nombre:'María Pérez',socio_nombre:null,rol:'usuario',activo:true,debe_cambiar_password:false,membresia_meses:1,membresia_inicio:now,membresia_vence:new Date(Date.now()+30*86400000).toISOString()};
  await page.route('**/auth-config.js',route=>route.fulfill({contentType:'application/javascript',body:"window.APPI_AUTH={enabled:true,url:'https://mock.supabase.co',anonKey:'anon-key-publica-de-prueba',distributorEmailDomain:'distribuidores.appi.invalid',adminLogin:{username:'popups',email:'admin-popups@appi.invalid'},loginAliases:{},offlineDays:7};"}));
  await page.route('https://mock.supabase.co/**',route=>{
    const req=route.request(),url=new URL(req.url());
    const headers={'access-control-allow-origin':'*','content-type':'application/json'};
    if(url.pathname==='/auth/v1/token')return route.fulfill({status:200,headers,body:JSON.stringify({access_token:token,refresh_token:'r',expires_in:3600,user:{id:USER_ID}})});
    if(url.pathname==='/rest/v1/appi_perfiles')return route.fulfill({status:200,headers,body:JSON.stringify([profile])});
    if(url.pathname==='/functions/v1/dispositivo-puente')return route.fulfill({status:200,headers,body:JSON.stringify({devices:[]})});
    if(url.pathname==='/rest/v1/appi_gestion_contactos'&&req.method()==='GET')return route.fulfill({status:200,headers,body:JSON.stringify(CONTACTS.concat(created))});
    if(url.pathname==='/rest/v1/appi_gestion_actividades'&&req.method()==='GET')return route.fulfill({status:200,headers,body:'[]'});
    if(url.pathname==='/rest/v1/appi_encuestas'&&req.method()==='GET')return route.fulfill({status:200,headers,body:'[]'});
    if(url.pathname==='/rest/v1/rpc/appi_gente_importar_contacto'){
      const body=req.postDataJSON();const saved={id:'c-visit',user_id:USER_ID,nombre:body.p_nombre,telefono:body.p_telefono,telefono_normalizado:String(body.p_telefono||'').replace(/\D/g,''),estado:body.p_estado,proximo_contacto:body.p_proximo,created_at:now,updated_at:now};created.push(saved);return route.fulfill({status:200,headers,body:JSON.stringify(saved.id)});
    }
    return route.fulfill({status:200,headers,body:'[]'});
  });
  await page.addInitScript(([uid,contacts,day])=>{
    localStorage.setItem('welcomeSeen','1');localStorage.setItem('tutoVisto_v2','1');localStorage.setItem('appi_tarjetas_auto','0');
    localStorage.setItem('appi_notif_listo_v1','1');localStorage.setItem('appi_notif_popup_later',String(Date.now()+86400000*400));
    localStorage.setItem(`appi_gestion_cache_v1_${uid}`,JSON.stringify({contacts,surveys:[],activities:[],savedAt:Date.now()}));
    localStorage.setItem(`appi_acciones_v1_${uid}`,JSON.stringify({dias:{[day]:{total:5,hechos:3,marcas:{}}},completadas:{},asignadas:{}}));
    localStorage.setItem(`appi_progreso_v1_${uid}`,JSON.stringify({version:1,createdAt:new Date().toISOString(),baseline:null,snapshots:{},events:{['presupuesto:'+day+':uno']:{id:'presupuesto:'+day+':uno',type:'presupuesto',at:new Date().toISOString(),meta:{total:1000}}},plans:{}}));
  },[USER_ID,CONTACTS,today()]);
  await page.goto('/index.html',{waitUntil:'networkidle'});
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
  await expect(page.locator('#appiProgresoHomeCard')).toBeVisible();
  return {created};
}

test('Mi avance aparece debajo del calendario y abre la experiencia completa con evidencia real',async({page})=>{
  await page.setViewportSize({width:390,height:840});await login(page);
  const order=await page.evaluate(()=>{
    const month=document.querySelector('.home-hero-card').getBoundingClientRect();
    const progress=document.querySelector('#appiProgresoHomeWrap').getBoundingClientRect();
    return {monthBottom:month.bottom,progressTop:progress.top,parent:document.querySelector('#appiProgresoHomeWrap').parentElement.tagName};
  });
  expect(order.progressTop).toBeGreaterThanOrEqual(order.monthBottom-1);
  await expect(page.locator('#appiProgresoHomeCard')).toContainText('4 de 4 áreas');
  const mobileLayout=await page.evaluate(()=>{
    const rect=selector=>document.querySelector(selector).getBoundingClientRect();
    const card=rect('#appiProgresoHomeCard'),orb=rect('.apg-home-orb'),next=rect('.apg-next-mini');
    return {orbTop:orb.top,orbBottom:orb.bottom,orbLeft:orb.left,cardTop:card.top,nextTop:next.top,nextLeft:next.left};
  });
  expect(mobileLayout.orbTop-mobileLayout.cardTop).toBeLessThan(45);
  expect(mobileLayout.orbBottom).toBeLessThanOrEqual(mobileLayout.nextTop-4);
  expect(Math.abs(mobileLayout.orbLeft-mobileLayout.nextLeft)).toBeLessThanOrEqual(1);
  await page.locator('#appiProgresoHomeCard').click();
  await expect(page.locator('#view-progreso')).toHaveClass(/active/);
  await expect(page.locator('.apg-areas')).toContainText('Orden');
  await expect(page.locator('.apg-areas')).toContainText('Constancia');
  await expect(page.locator('.apg-areas')).toContainText('Movimiento comercial');
  await expect(page.locator('.apg-areas')).toContainText('Resultados');
  await expect(page.locator('.apg-source-note')).toContainText('Las ventas sólo cuentan cuando quedaron confirmadas');
  const baseline=await page.evaluate(uid=>JSON.parse(localStorage.getItem(`appi_progreso_v1_${uid}`)).baseline,USER_ID);
  expect(baseline.metrics.contactCount).toBe(3);
  expect(baseline.metrics.done7).toBe(3);
});

test('abre el contacto correcto sin completar el seguimiento por su cuenta',async({page})=>{
  await login(page);await page.locator('#appiProgresoHomeCard').click();
  await page.evaluate(()=>{window.__opened=[];window.APPIGestion.abrirContacto=id=>window.__opened.push(id)});
  const button=page.locator('[data-apg-action="seguimientos"]').first();
  await expect(button).toBeVisible();await button.click();
  expect(await page.evaluate(()=>window.__opened)).toEqual(['c-follow']);
  const contact=await page.evaluate(()=>window.APPIGestion.state.contacts.find(c=>c.id==='c-follow'));
  expect(contact.proximo_contacto).toBeFalsy();
});

test('prepara una visita sólo después de dos confirmaciones explícitas',async({page})=>{
  await login(page);
  await page.evaluate(uid=>{
    delete JSON.parse(localStorage.getItem(`appi_progreso_v1_${uid}`)).plans;
    const raw=JSON.parse(localStorage.getItem(`appi_progreso_v1_${uid}`));raw.plans={};localStorage.setItem(`appi_progreso_v1_${uid}`,JSON.stringify(raw));
    const person={usuario:'Ana Torres',telf:'3515998877',fVence:'2022-01-01'};
    APPIReactivacion.dormidos=()=>[person];APPIReactivacion.porContactar=()=>[person];APPIReactivacion.revividos=()=>[];
    APPIProgreso.refresh();APPIProgreso.abrir();
  },USER_ID);
  const visit=page.locator('[data-apg-action="visitas"]').first();await expect(visit).toBeVisible();await visit.click();
  await expect(page.locator('#appiDialogTitle')).toHaveText('Preparar visita');
  await page.locator('#appiDialogCancel').click();
  expect(await page.evaluate(()=>APPIProgreso.analizar().metrics.visitCount7)).toBe(0);
  await visit.click();await page.locator('#appiDialogOk').click();
  await expect(page.locator('#appiDialogTitle')).toHaveText('Fecha del seguimiento');
  await page.locator('#appiDialogOk').click();
  await expect.poll(()=>page.evaluate(()=>APPIProgreso.analizar().metrics.visitCount7)).toBe(1);
  const newContact=await page.evaluate(()=>APPIGestion.state.contacts.find(c=>c.id==='c-visit'));
  expect(newContact.estado).toBe('seguimiento');expect(newContact.proximo_contacto).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});

test('una planilla grande no bloquea el arranque ni repite miles de lecturas',async({page})=>{
  await login(page);
  const result=await page.evaluate(uid=>{
    const users=Array.from({length:4000},(_,i)=>({usuario:'Usuario '+i,telf:'351'+String(5000000+i),fVence:'2020-01-01'}));
    const revived={};for(let i=0;i<1000;i++)revived[APPITel.primeroValido(users[i].telf)]={at:'2025-01-01T00:00:00.000Z'};
    localStorage.setItem(`appi_reactivacion_v1_${uid}`,JSON.stringify({revividos:revived,estados:{}}));
    window.usuariosTodosActual=()=>users;
    const start=performance.now(),analysis=APPIProgreso.refresh({force:true});
    return {elapsed:performance.now()-start,contactable:analysis.metrics.contactableOld.length,revived:analysis.metrics.revivedCount};
  },USER_ID);
  expect(result.contactable).toBe(3000);
  expect(result.revived).toBe(1000);
  expect(result.elapsed).toBeLessThan(1500);
});

test('no duplica un presupuesto y la sincronización une evidencias de dos dispositivos',async({page})=>{
  await login(page);
  const result=await page.evaluate(()=>{
    const data={para:'Pedro',total:12345,lineas:[{p:{sku:'PSA-1',precio:12345},q:1}]};
    const first=APPIProgreso.registrarPresupuesto(data),second=APPIProgreso.registrarPresupuesto(data);
    const progress=JSON.parse(localStorage.getItem(APPIProgreso.clave()));
    const left={version:1,createdAt:'2026-01-01T00:00:00Z',baseline:{at:'2026-01-01T00:00:00Z',metrics:{contactCount:1}},snapshots:{},events:{a:{id:'a',type:'presupuesto',at:'2026-01-02T00:00:00Z'}},plans:{'2026-01-02':{date:'2026-01-02',createdAt:'2026-01-02T00:00:00Z',updatedAt:'2026-01-02T00:00:00Z',items:[{id:'x',type:'contactos',baseline:{capturedAt:'2026-01-02T00:00:00Z'}}]}}};
    const right={version:1,createdAt:'2026-01-02T00:00:00Z',baseline:{at:'2026-01-02T00:00:00Z',metrics:{contactCount:9}},snapshots:{},events:{b:{id:'b',type:'visita_programada',at:'2026-01-03T00:00:00Z'}},plans:{'2026-01-02':{date:'2026-01-02',createdAt:'2026-01-02T00:00:00Z',updatedAt:'2026-01-03T00:00:00Z',items:[{id:'y',type:'visitas',baseline:{capturedAt:'2026-01-03T00:00:00Z'}}]}}};
    const merged=JSON.parse(APPIDataSync.mergeProgresoValue(JSON.stringify(left),JSON.stringify(right)));
    return {first,second,budgets:Object.values(progress.events).filter(x=>x.type==='presupuesto'&&x.meta&&x.meta.para==='Pedro').length,shared:APPIDataSync.isSharedKey(APPIProgreso.clave()),baseline:merged.baseline.metrics.contactCount,events:Object.keys(merged.events).sort(),items:merged.plans['2026-01-02'].items.map(x=>x.id).sort()};
  });
  expect(result).toEqual({first:true,second:false,budgets:1,shared:true,baseline:1,events:['a','b'],items:['x','y']});
});
