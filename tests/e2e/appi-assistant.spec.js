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

// El botón de ayuda de la pantalla es el círculo de Appi: un toque abre la caja.
async function sacarAppi(page){
  await abrirConElCirculo(page);
}
async function abrirPanelDeAppi(page){
  await abrirConElCirculo(page);
}
async function abrirConElCirculo(page){
  const circulo=page.locator('.appi-help-btn:visible').first();
  await circulo.click();
  await expect(page.locator('#appiAssistant')).toHaveClass(/appi-open/);
}

test('el «?» de cada pantalla es el círculo de Appi',async({page})=>{
  await entrar(page);
  // Ninguna pantalla tiene ya un signo de pregunta suelto: todos son Appi.
  const botones=page.locator('.help-btn');
  expect(await botones.count()).toBeGreaterThan(10);
  await expect(page.locator('.help-btn.appi-help-btn')).toHaveCount(await botones.count());
  await expect(page.locator('.appi-help-btn svg.appi-btn-face').first()).toBeVisible();
  const primero=page.locator('.appi-help-btn').first();
  await expect(primero).toHaveAttribute('aria-label','Appi, tu asistente');
  expect(await primero.innerText()).not.toContain('?');
  // Tiene que moverse solo: el cuerpo y los ojos están animados.
  const anima=await primero.evaluate(el=>{
    const cuerpo=el.querySelector('.bf-body'),ojo=el.querySelector('.bf-eye');
    return{cuerpo:getComputedStyle(cuerpo).animationName,ojo:getComputedStyle(ojo).animationName,halo:getComputedStyle(el,'::after').animationName};
  });
  expect(anima.cuerpo).not.toBe('none');
  expect(anima.ojo).not.toBe('none');
  expect(anima.halo).not.toBe('none');
  // El dock queda con sus cuatro botones, sin Appi adentro.
  await expect(page.locator('#pageTabs button')).toHaveCount(4);
  await expect(page.locator('#ptAppi')).toHaveCount(0);
  // Un toque abre la caja con la gotita entera adentro y su nombre.
  await abrirConElCirculo(page);
  await expect(page.locator('#appiPanel')).toBeVisible();
  await expect(page.locator('#appiGotita svg.go')).toHaveCount(1);
  await expect(page.locator('.appi-chip')).toHaveText('Appi');
  const caja=await page.evaluate(()=>{const p=document.querySelector('#appiPanel').getBoundingClientRect();return{top:p.top,right:p.right,vw:innerWidth}});
  expect(caja.top).toBeLessThan(90);              // pegada arriba, debajo del círculo
  expect(Math.abs(caja.right-(caja.vw-8))).toBeLessThan(3);
  // Y se cierra con la ×.
  await page.locator('#appiClose').click();
  await expect(page.locator('#appiAssistant')).not.toHaveClass(/appi-open/);
});

test('la ayuda de la pantalla sigue disponible adentro de Appi',async({page})=>{
  await entrar(page);
  await abrirConElCirculo(page);
  const fila=page.locator('#appiHelpRow');
  await expect(fila).toContainText('¿Cómo funciona esta pantalla?');
  await fila.click();
  // Se cierra Appi y aparece la explicación de la pantalla en la que estaba.
  await expect(page.locator('#appiAssistant')).not.toHaveClass(/appi-open/);
  await expect(page.locator('.modal-overlay.open')).toBeVisible();
  await expect(page.locator('.modal-overlay.open')).toContainText('Pantalla principal');
});

test('la caja abre arriba a la derecha y no tapa el dock',async({page})=>{
  await entrar(page);await sacarAppi(page);await expect(page.locator('#appiPanel')).toBeVisible();await page.waitForTimeout(420);
  const m=await page.evaluate(()=>{const p=document.querySelector('#appiPanel').getBoundingClientRect(),d=document.querySelector('#pageTabs').getBoundingClientRect();return{panelRight:p.right,panelTop:p.top,panelBottom:p.bottom,dockTop:d.top,vw:innerWidth}});
  expect(Math.abs(m.panelRight-(m.vw-8))).toBeLessThan(3);
  expect(m.panelTop).toBeLessThan(90);
  expect(m.panelBottom).toBeLessThanOrEqual(m.dockTop);
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

test('en escritorio la caja abre a la derecha y no tapa la barra lateral',async({page})=>{
  await entrar(page,{desktop:true});
  await expect(page.locator('#deskSidebar')).toBeVisible();
  const circulo=page.locator('.appi-help-btn:visible').first();
  if(await circulo.count()){await circulo.click();await expect(page.locator('#appiPanel')).toBeVisible();
    const m=await page.evaluate(()=>{const p=document.querySelector('#appiPanel').getBoundingClientRect(),s=document.querySelector('#deskSidebar').getBoundingClientRect();return{panelLeft:p.left,sidebarRight:s.right}});
    expect(m.panelLeft).toBeGreaterThan(m.sidebarRight);}
});

test('si nombra un lugar, Appi la lleva ahí sin pedir confirmación',async({page})=>{
  await entrar(page);await page.evaluate(()=>window.APPIAssistant.ask('lista de precios'));
  await expect(page.locator('#view-lista')).toHaveClass(/active/);
  await expect(page.locator('#appiAssistant')).not.toHaveClass(/appi-open/);
  await expect(page.locator('#appiAction')).toBeHidden();
});

test('los atajos del panel abren la pantalla de verdad, en un solo toque',async({page})=>{
  await entrar(page);await sacarAppi(page);
  await page.locator('#appiRows .appi-row',{hasText:'Mis contactos'}).click();
  await expect(page.locator('#view-gestion')).toHaveClass(/active/);await expect(page.locator('#appiAssistant')).not.toHaveClass(/appi-open/);
  // Vuelve sola a asomarse al borde: se la vuelve a tocar a ella.
  await expect(page.locator('#appiAssistant')).toHaveAttribute('data-dock','asomada',{timeout:4000});
  await abrirPanelDeAppi(page);await page.locator('#appiRows .appi-row',{hasText:'Histórico'}).click();
  await expect(page.locator('#view-historico')).toHaveClass(/active/);
  await abrirPanelDeAppi(page);await page.locator('#appiRows .appi-row',{hasText:'Mi Encuesta'}).click();
  await expect(page.locator('#view-encuesta')).toHaveClass(/active/);
});

test('el panel muestra las cuatro pantallas que más se usan',async({page})=>{
  await entrar(page);
  // La primera vez ofrece las cuatro de arranque.
  await sacarAppi(page);
  expect(await page.locator('#appiRows .appi-row b').allTextContents()).toEqual(['Lista de precios','Mis contactos','Histórico','Mi Encuesta']);
  await page.locator('#appiClose').click();
  // Se usa Mi stock tres veces: pasa a encabezar la lista.
  for(let i=0;i<3;i++){await page.evaluate(()=>window.showView('view-home'));await page.evaluate(()=>window.showView('view-stock'))}
  await abrirPanelDeAppi(page);
  expect(await page.locator('#appiRows .appi-row b').first().textContent()).toBe('Mi stock');
  expect((await page.locator('#appiRows .appi-row b').allTextContents()).length).toBe(4);
});

test('cuando no entiende, propone lugares con palabras simples',async({page})=>{
  await entrar(page);await page.evaluate(()=>window.APPIAssistant.ask('quiero pintar la casa'));
  await expect(page.locator('#appiMessage')).toContainText('lista de precios');
  await expect(page.locator('#appiAssistant')).toHaveClass(/appi-open/);
});
