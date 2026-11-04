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
  await page.locator('#distributorInput').fill('02-9802014');await page.locator('#distributorPassword').fill('Clave1234');await page.locator('#btnDistributorLogin').click();await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);await page.waitForFunction(()=>window.APPIAssistant&&document.getElementById('appiAssistant')&&document.getElementById('appiAssistant').dataset.ready==='true');
}

// Appi está asomada en el borde derecho: tocarla la saca y abre el panel.
async function sacarAppi(page){
  await page.locator('#appiAvatarHit').click();
  await expect(page.locator('#appiAssistant')).toHaveClass(/appi-open/);
}
// Con el panel cerrado vuelve a asomarse; se la vuelve a tocar a ella.
async function abrirPanelDeAppi(page){
  await page.locator('#appiAvatarHit').click();
  await expect(page.locator('#appiAssistant')).toHaveClass(/appi-open/);
}

test('Appi se asoma desde el borde derecho y no achica el dock',async({page})=>{
  await entrar(page);
  const asist=page.locator('#appiAssistant');
  // El dock vuelve a tener cuatro botones: no hay quinto botón de Appi.
  await expect(page.locator('#pageTabs button')).toHaveCount(4);
  await expect(page.locator('#ptAppi')).toHaveCount(0);
  // Sus cuatro botones conservan el tamaño de siempre.
  const anchos=await page.locator('#pageTabs button').evaluateAll(ns=>ns.map(n=>n.getBoundingClientRect().width));
  anchos.forEach(w=>expect(w).toBeGreaterThan(80));
  await expect(asist).toHaveAttribute('data-dock','asomada');
  // Se la ve asomada: pegada al borde derecho y cortada por la pantalla.
  const m=await page.evaluate(()=>{const s=document.querySelector('.appi-avatar-shell').getBoundingClientRect(),d=document.querySelector('#pageTabs').getBoundingClientRect();
    return{left:s.left,right:s.right,vw:innerWidth,shellBottom:s.bottom,dockTop:d.top,opacity:getComputedStyle(document.querySelector('.appi-avatar-shell')).opacity}});
  expect(m.opacity).toBe('1');
  expect(m.right).toBeGreaterThan(m.vw);
  expect(m.left).toBeGreaterThan(m.vw-110);
  expect(m.shellBottom).toBeLessThan(m.dockTop+2);
  // Un toque: sale de su escondite, se para sobre el dock y abre el panel.
  await page.locator('#appiAvatarHit').click();
  await expect(asist).toHaveAttribute('data-dock','afuera');
  await expect(asist).toHaveClass(/appi-open/);
  await expect(page.locator('#appiGotita svg.go')).toHaveCount(1);
  await expect(page.locator('#appiAssistant img')).toHaveCount(0);
  const n=await page.evaluate(()=>{const s=document.querySelector('.appi-avatar-shell').getBoundingClientRect(),d=document.querySelector('#pageTabs').getBoundingClientRect();return{shellBottom:s.bottom,dockTop:d.top}});
  expect(Math.abs(n.shellBottom-n.dockTop)).toBeLessThan(16);
  // Al cerrar, vuelve sola al borde: no queda en el medio de la pantalla.
  await page.locator('#appiClose').click();
  await expect(asist).toHaveAttribute('data-dock','asomada',{timeout:4000});
  await expect(asist).not.toHaveClass(/appi-open/);
});

test('cuando saluda levanta la mano hacia la pantalla',async({page})=>{
  await entrar(page);
  await page.evaluate(()=>window.APPIAssistant.saludar(4200));
  await expect(page.locator('#appiAssistant')).toHaveClass(/appi-greeting/);
  const brazo=page.locator('#appiGotita .go-arm-l');
  await expect(brazo).toHaveCount(1);
  expect(await brazo.evaluate(el=>getComputedStyle(el).animationName)).toBe('goWaveArmL');
  await expect(page.locator('#appiMiniBubble')).toBeVisible();
  // Con el panel abierto no saluda: sería molesto.
  await page.locator('#appiAvatarHit').click();
  await expect(page.locator('#appiAssistant')).toHaveClass(/appi-open/);
  expect(await page.locator('#appiAssistant').evaluate(el=>el.classList.contains('appi-greeting'))).toBe(false);
});

test('el mensaje abre hacia la izquierda, arriba del dock, sin tapar la navegación',async({page})=>{
  await entrar(page);await sacarAppi(page);await expect(page.locator('#appiPanel')).toBeVisible();await page.waitForTimeout(420);
  const m=await page.evaluate(()=>{const p=document.querySelector('#appiPanel').getBoundingClientRect(),s=document.querySelector('.appi-avatar-shell').getBoundingClientRect(),d=document.querySelector('#pageTabs').getBoundingClientRect();return{panelRight:p.right,shellLeft:s.left,panelBottom:p.bottom,dockTop:d.top}});
  expect(m.panelRight).toBeLessThanOrEqual(m.shellLeft+24);expect(m.panelBottom).toBeLessThanOrEqual(m.dockTop+1);
});

test('los cinco estados mueven el dibujo de formas realmente diferentes',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});await entrar(page);await sacarAppi(page);
  const states=['normal','thinking','happy','surprise','alert'],animations={};
  for(const state of states){await page.evaluate(s=>window.APPIAssistant.setState(s),state);await page.waitForTimeout(360);animations[state]=await page.locator('#appiGotita svg.go').evaluate((go,s)=>({state:go.dataset.state,body:getComputedStyle(go.querySelector('.go-body')).animationName,arm:getComputedStyle(go.querySelector('.go-arm-r')).animationName}),state);expect(animations[state].state).toBe(state);expect(animations[state].body).not.toBe('none')}
  expect(new Set(Object.values(animations).map(x=>x.body)).size).toBe(5);
  expect(new Set(Object.values(animations).map(x=>x.arm)).size).toBe(5);
});

test('Appi entiende la jornada, piensa y muestra una acción útil',async({page})=>{
  await entrar(page);await page.evaluate(()=>window.APPIAssistant.ask('¿Qué tengo que hacer hoy?'));
  await expect(page.locator('#appiAssistant')).toHaveAttribute('data-state','surprise');await expect(page.locator('#appiMessage')).toContainText('2 contactos');await expect(page.locator('#appiAction')).toBeVisible();await expect(page.locator('#appiAction')).toContainText('Ver mis contactos');
});

test('un comando escrito abre Mi Encuesta y Appi vuelve al dock',async({page})=>{
  await entrar(page);await sacarAppi(page);await page.locator('#appiInput').fill('Abrí Mi Encuesta');await page.locator('#appiForm').evaluate(form=>form.requestSubmit());
  await expect(page.locator('#view-encuesta')).toHaveClass(/active/);await expect(page.locator('#appiAssistant')).not.toHaveClass(/appi-open/);
});

test('explica la pantalla actual con palabras simples',async({page})=>{
  await entrar(page);await page.evaluate(()=>window.showView('view-herramientas'));await page.evaluate(()=>window.APPIAssistant.ask('Explicame esta pantalla'));
  await expect(page.locator('#appiPanelTitle')).toHaveText('Te explico esta pantalla');await expect(page.locator('#appiMessage')).toContainText('En Herramientas');
});

test('el micrófono convierte voz en comando sin quedar escuchando',async({page})=>{
  await page.addInitScript(()=>{const FakeSpeechRecognition=class{start(){this.onstart&&this.onstart();setTimeout(()=>{this.onresult&&this.onresult({resultIndex:0,results:[Object.assign([{transcript:'Mostrame mis cierres anteriores'}],{isFinal:true})]});this.onend&&this.onend()},30)}abort(){}};window.SpeechRecognition=FakeSpeechRecognition;window.webkitSpeechRecognition=FakeSpeechRecognition;});
  await entrar(page);await sacarAppi(page);await page.locator('#appiMic').click();await expect(page.locator('#view-historico')).toHaveClass(/active/);await expect(page.locator('#appiAssistant')).not.toHaveClass(/appi-listening/);
});

test('en escritorio no invade la barra lateral',async({page})=>{
  await entrar(page,{desktop:true});await expect(page.locator('#deskSidebar')).toBeVisible();await expect(page.locator('#appiAssistant')).toBeHidden();
});

test('si nombra un lugar, Appi la lleva ahí sin pedir confirmación',async({page})=>{
  await entrar(page);await page.evaluate(()=>window.APPIAssistant.ask('lista de precios'));
  await expect(page.locator('#view-lista')).toHaveClass(/active/);
  await expect(page.locator('#appiAssistant')).not.toHaveClass(/appi-open/);
  await expect(page.locator('#appiAction')).toBeHidden();
});

test('los atajos del panel abren la pantalla de verdad, en un solo toque',async({page})=>{
  await entrar(page);await sacarAppi(page);
  await page.locator('.appi-row',{hasText:'Mis contactos'}).click();
  await expect(page.locator('#view-gestion')).toHaveClass(/active/);await expect(page.locator('#appiAssistant')).not.toHaveClass(/appi-open/);
  // Vuelve sola a asomarse al borde: se la vuelve a tocar a ella.
  await expect(page.locator('#appiAssistant')).toHaveAttribute('data-dock','asomada',{timeout:4000});
  await abrirPanelDeAppi(page);await page.locator('.appi-row',{hasText:'Histórico'}).click();
  await expect(page.locator('#view-historico')).toHaveClass(/active/);
  await abrirPanelDeAppi(page);await page.locator('.appi-row',{hasText:'Mi Encuesta'}).click();
  await expect(page.locator('#view-encuesta')).toHaveClass(/active/);
});

test('el panel muestra las cuatro pantallas que más se usan',async({page})=>{
  await entrar(page);
  // La primera vez ofrece las cuatro de arranque.
  await sacarAppi(page);
  expect(await page.locator('.appi-row b').allTextContents()).toEqual(['Lista de precios','Mis contactos','Histórico','Mi Encuesta']);
  await page.locator('#appiClose').click();
  // Se usa Mi stock tres veces: pasa a encabezar la lista.
  for(let i=0;i<3;i++){await page.evaluate(()=>window.showView('view-home'));await page.evaluate(()=>window.showView('view-stock'))}
  await abrirPanelDeAppi(page);
  expect(await page.locator('.appi-row b').first().textContent()).toBe('Mi stock');
  expect((await page.locator('.appi-row b').allTextContents()).length).toBe(4);
});

test('cuando no entiende, propone lugares con palabras simples',async({page})=>{
  await entrar(page);await page.evaluate(()=>window.APPIAssistant.ask('quiero pintar la casa'));
  await expect(page.locator('#appiMessage')).toContainText('lista de precios');
  await expect(page.locator('#appiAssistant')).toHaveClass(/appi-open/);
});
