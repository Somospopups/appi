const { test, expect } = require('@playwright/test');

const USER_ID='22222222-2222-4222-8222-222222222222';
const hoy=(()=>{const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)})();
const CONTACTOS=[
  {id:'a1',estado:'seguimiento',nombre:'Marta Solís',telefono:'3515551001',telefono_normalizado:'3515551001',tipo:'contacto',proximo_contacto:hoy,created_at:new Date().toISOString(),updated_at:new Date().toISOString()},
  {id:'a2',estado:'presentacion',nombre:'Juan Paz',telefono:'3515551002',telefono_normalizado:'3515551002',tipo:'contacto',proximo_contacto:hoy,created_at:new Date().toISOString(),updated_at:new Date().toISOString()}
];
function tokenFor(sub){const h=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');const p=Buffer.from(JSON.stringify({sub,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url');return `${h}.${p}.firma`}
async function entrar(page,{desktop=false}={}){
  await page.setViewportSize(desktop?{width:1280,height:800}:{width:390,height:840});
  const accessToken=tokenFor(USER_ID),now=new Date().toISOString();
  const profile={user_id:USER_ID,username:null,dip:'02-9802014',sucursal:'02',numero_distribuidor:'9802014',nombre:'María Pérez',socio_nombre:null,rol:'usuario',activo:true,debe_cambiar_password:false,membresia_meses:1,membresia_inicio:now,membresia_vence:new Date(Date.now()+30*86400000).toISOString()};
  await page.route('**/auth-config.js',route=>route.fulfill({contentType:'application/javascript',body:"window.APPI_AUTH={enabled:true,url:'https://mock.supabase.co',anonKey:'anon-key-publica-de-prueba',distributorEmailDomain:'distribuidores.appi.invalid',adminLogin:{username:'popups',email:'admin@appi.invalid'},loginAliases:{},offlineDays:7};"}));
  await page.route('https://mock.supabase.co/**',route=>{const url=new URL(route.request().url());const headers={'access-control-allow-origin':'*','content-type':'application/json'};if(url.pathname==='/auth/v1/token')return route.fulfill({status:200,headers,body:JSON.stringify({access_token:accessToken,refresh_token:'r',expires_in:3600,user:{id:USER_ID}})});if(url.pathname==='/rest/v1/appi_perfiles')return route.fulfill({status:200,headers,body:JSON.stringify([profile])});if(url.pathname==='/functions/v1/dispositivo-puente')return route.fulfill({status:200,headers,body:JSON.stringify({devices:[]})});if(url.pathname==='/rest/v1/appi_gestion_contactos'&&route.request().method()==='GET')return route.fulfill({status:200,headers,body:JSON.stringify(CONTACTOS)});return route.fulfill({status:200,headers,body:'[]'})});
  await page.addInitScript(([uid,contacts])=>{
    localStorage.setItem('welcomeSeen','1');localStorage.setItem('tutoVisto_v2','1');localStorage.setItem('appi_tarjetas_auto','0');localStorage.setItem('appi_notif_listo_v1','1');localStorage.setItem('appi_notif_popup_later',String(Date.now()+400*86400000));localStorage.setItem('appi_aviso_psa_off','1');localStorage.setItem('equipoData',JSON.stringify({titular:{dip:'02-9802014',nombre:'María Pérez',categoria:'DC'},personas:[]}));localStorage.setItem(`appi_gestion_cache_v1_${uid}`,JSON.stringify({contacts,surveys:[],activities:[],savedAt:Date.now()}));localStorage.setItem(`appi_porque_v1_${uid}`,JSON.stringify({niveles:['Ayudar a mi familia']}));localStorage.setItem(`appi_tour_parque_v1_${uid}`,'1');
  },[USER_ID,CONTACTOS]);
  await page.goto('/index.html',{waitUntil:'networkidle'});
  await page.locator('#distributorInput').fill('02-9802014');await page.locator('#distributorPassword').fill('Clave1234');await page.locator('#btnDistributorLogin').click();await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);await page.waitForFunction(()=>window.APPIAssistant&&document.getElementById('appiAssistant'));
}

test('Appi se asoma desde atrás del dock y el área visible se puede tocar',async({page})=>{
  await entrar(page);
  const assistant=page.locator('#appiAssistant'),dock=page.locator('#pageTabs'),shell=page.locator('.appi-avatar-shell'),hit=page.locator('#appiAvatarHit');
  await expect(assistant).toBeVisible();await expect(dock).toBeVisible();
  await expect(page.locator('#appiAvatarImage')).toHaveJSProperty('naturalWidth',480);
  const m=await page.evaluate(()=>{const s=document.querySelector('.appi-avatar-shell').getBoundingClientRect(),d=document.querySelector('#pageTabs').getBoundingClientRect(),h=document.querySelector('#appiAvatarHit').getBoundingClientRect();return{shellTop:s.top,shellBottom:s.bottom,dockTop:d.top,hitCenter:h.top+h.height/2}});
  expect(m.shellTop).toBeLessThan(m.dockTop);expect(m.shellBottom).toBeGreaterThan(m.dockTop);expect(m.hitCenter).toBeLessThan(m.dockTop);
  await hit.click();await expect(assistant).toHaveClass(/appi-open/);await expect(page.locator('#appiPanel')).toBeVisible();
});

test('el mensaje abre hacia la izquierda, arriba del dock, sin tapar la navegación',async({page})=>{
  await entrar(page);await page.locator('#appiAvatarHit').click();await expect(page.locator('#appiPanel')).toBeVisible();await page.waitForTimeout(120);
  const m=await page.evaluate(()=>{const p=document.querySelector('#appiPanel').getBoundingClientRect(),s=document.querySelector('.appi-avatar-shell').getBoundingClientRect(),d=document.querySelector('#pageTabs').getBoundingClientRect();return{panelRight:p.right,shellLeft:s.left,panelBottom:p.bottom,dockTop:d.top}});
  expect(m.panelRight).toBeLessThanOrEqual(m.shellLeft+24);expect(m.panelBottom).toBeLessThanOrEqual(m.dockTop+1);
});

test('los cinco estados usan imágenes y movimientos realmente diferentes',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});await entrar(page);await page.locator('#appiAvatarHit').click();
  const states=['normal','thinking','happy','surprise','alert'],animations={};
  for(const state of states){await page.evaluate(s=>window.APPIAssistant.setState(s),state);animations[state]=await page.locator('#appiAvatarImage').evaluate(e=>({src:e.getAttribute('src'),animation:getComputedStyle(e).animationName}));expect(animations[state].src).toContain(`/appi/${state}.webp`);expect(animations[state].animation).not.toBe('none')}
  expect(new Set(Object.values(animations).map(x=>x.animation)).size).toBe(5);
});

test('Appi entiende la jornada, piensa y muestra una acción útil',async({page})=>{
  await entrar(page);await page.evaluate(()=>window.APPIAssistant.ask('¿Qué tengo que hacer hoy?'));
  await expect(page.locator('#appiAssistant')).toHaveAttribute('data-state','surprise');await expect(page.locator('#appiMessage')).toContainText('2 contactos');await expect(page.locator('#appiAction')).toBeVisible();await expect(page.locator('#appiAction')).toContainText('Ver contactos');
});

test('un comando escrito abre Mi Encuesta y Appi vuelve al dock',async({page})=>{
  await entrar(page);await page.locator('#appiAvatarHit').click();await page.locator('#appiInput').fill('Abrí Mi Encuesta');await page.locator('#appiForm').evaluate(form=>form.requestSubmit());
  await expect(page.locator('#view-encuesta')).toHaveClass(/active/);await expect(page.locator('#appiAssistant')).not.toHaveClass(/appi-open/);
});

test('explica la pantalla actual con palabras simples',async({page})=>{
  await entrar(page);await page.evaluate(()=>window.showView('view-herramientas'));await page.evaluate(()=>window.APPIAssistant.ask('Explicame esta pantalla'));
  await expect(page.locator('#appiPanelTitle')).toHaveText('Te explico esta pantalla');await expect(page.locator('#appiMessage')).toContainText('En Herramientas');
});

test('el micrófono convierte voz en comando sin quedar escuchando',async({page})=>{
  await page.addInitScript(()=>{const FakeSpeechRecognition=class{start(){this.onstart&&this.onstart();setTimeout(()=>{this.onresult&&this.onresult({resultIndex:0,results:[Object.assign([{transcript:'Mostrame mis cierres anteriores'}],{isFinal:true})]});this.onend&&this.onend()},30)}abort(){}};window.SpeechRecognition=FakeSpeechRecognition;window.webkitSpeechRecognition=FakeSpeechRecognition;});
  await entrar(page);await page.locator('#appiAvatarHit').click();await page.locator('#appiMic').click();await expect(page.locator('#view-historico')).toHaveClass(/active/);await expect(page.locator('#appiAssistant')).not.toHaveClass(/appi-listening/);
});

test('en escritorio no invade la barra lateral',async({page})=>{
  await entrar(page,{desktop:true});await expect(page.locator('#deskSidebar')).toBeVisible();await expect(page.locator('#appiAssistant')).toBeHidden();
});
