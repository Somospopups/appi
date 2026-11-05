const { test, expect } = require('@playwright/test');

const USER_ID='22222222-2222-4222-8222-222222222222';
// La fecha de "hoy" se toma en Buenos Aires, igual que APPI: con la fecha UTC
// el fixture se adelantaba un día a la tarde/noche y los pendientes no aparecían.
const hoy=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Buenos_Aires'}).format(new Date());
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

// El círculo de Appi es la única puerta: un toque abre la caja.
async function abrirCaja(page){
  await page.locator('.appi-help-btn:visible').first().click();
  await expect(page.locator('#appiAssistant')).toHaveClass(/appi-open/);
}
async function empezarRecorrido(page){
  await abrirCaja(page);
  await page.locator('#appiTourRow').click();
  await expect(page.locator('#appiTour')).toHaveClass(/tour-on/);
}

test('la caja de Appi tiene la opción «¿Qué hay en mi pantalla?»', async ({page})=>{
  await entrar(page);
  await abrirCaja(page);
  const fila=page.locator('#appiTourRow');
  await expect(fila).toBeVisible();
  await expect(fila).toContainText('¿Qué hay en mi pantalla?');
  // Es la primera opción de la caja: aparece antes que los accesos de siempre.
  const primera=page.locator('#appiAssistant .appi-row').first();
  await expect(primera).toHaveAttribute('id','appiTourRow');
});

test('el recorrido se abre, oscurece el resto e ilumina una cosa por vez', async ({page})=>{
  await entrar(page);
  await empezarRecorrido(page);
  // la caja de Appi se cierra para dejar ver la pantalla
  await expect(page.locator('#appiAssistant')).not.toHaveClass(/appi-open/);
  const datos=await page.evaluate(()=>({paso:APPITour.paso,total:APPITour.total,vista:APPITour.vista,titulo:APPITour.titulo}));
  expect(datos.total).toBeGreaterThanOrEqual(3);
  expect(datos.paso).toBe(1);
  await expect(page.locator('#tourPaso')).toHaveText(`1 de ${datos.total}`);
  await expect(page.locator('#tourTitulo')).not.toBeEmpty();
  await expect(page.locator('#tourTexto')).not.toBeEmpty();
  // el nido iluminado tiene tamaño y la capa oscurece el resto
  const nido=await page.locator('.tour-nido').boundingBox();
  expect(nido.width).toBeGreaterThan(20);expect(nido.height).toBeGreaterThan(20);
  const sombra=await page.locator('.tour-nido').evaluate(el=>getComputedStyle(el).boxShadow);
  expect(sombra).toContain('9999px');
});

test('Siguiente avanza, Atrás vuelve y Terminar cierra', async ({page})=>{
  await entrar(page);
  await empezarRecorrido(page);
  const total=await page.evaluate(()=>APPITour.total);
  await page.locator('#tourNext').click();
  await expect(page.locator('#tourPaso')).toHaveText(`2 de ${total}`);
  await page.locator('#tourPrev').click();
  await expect(page.locator('#tourPaso')).toHaveText(`1 de ${total}`);
  await expect(page.locator('#tourPrev')).toBeDisabled();
  // hasta el final: el último botón dice Terminar y cierra
  for(let i=1;i<total;i++) await page.locator('#tourNext').click();
  await expect(page.locator('#tourPaso')).toHaveText(`${total} de ${total}`);
  await expect(page.locator('#tourNext')).toContainText('Terminar');
  await page.locator('#tourNext').click();
  await expect(page.locator('#appiTour')).not.toHaveClass(/tour-on/);
  expect(await page.evaluate(()=>APPITour.activo)).toBe(false);
});

test('Escape cierra el recorrido y las flechas lo recorren', async ({page})=>{
  await entrar(page);
  await empezarRecorrido(page);
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#tourPaso')).toHaveText(new RegExp('^2 de '));
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#tourPaso')).toHaveText(new RegExp('^1 de '));
  await page.keyboard.press('Escape');
  await expect(page.locator('#appiTour')).not.toHaveClass(/tour-on/);
});

test('el recorrido funciona en todas las pantallas', async ({page})=>{
  await entrar(page);
  const errs=[];page.on('pageerror',e=>errs.push(String(e)));
  // las pantallas se abren como en la vida real (Stock, Lista y Histórico
  // tienen su propia función de apertura)
  const vistas=[['view-mes','showView'],['view-negocio','showView'],['view-herramientas','showView'],
                ['view-gestion','showView'],['view-usuarios','showView'],['view-stock','openStock'],
                ['view-lista','openLista']];
  for(const [v,abrir] of vistas){
    await page.evaluate(a=>{ if(typeof window[a]==='function') window[a](); },abrir);
    await page.waitForTimeout(700);
    const r=await page.evaluate(()=>{const em=APPITour.empezar();const titulos=[];
      if(em&&em.pasos){for(let i=0;i<APPITour.total;i++){titulos.push(APPITour.titulo);APPITour.siguiente()}}
      APPITour.parar();return {pasos:em&&em.pasos,titulos}});
    expect(r.pasos,`la pantalla ${v} tiene recorrido`).toBeGreaterThanOrEqual(2);
    r.titulos.forEach(t=>expect(t.length).toBeGreaterThan(2));
  }
  expect(errs).toEqual([]);
});

test('después del recorrido, Appi y el dock siguen funcionando', async ({page})=>{
  await entrar(page);
  await empezarRecorrido(page);
  await page.locator('#tourCerrar').click();
  await expect(page.locator('#appiTour')).not.toHaveClass(/tour-on/);
  // el dock queda con sus cuatro botones y se puede navegar
  await expect(page.locator('#pageTabs button')).toHaveCount(4);
  await page.locator('#pageTabs button[data-view="view-herramientas"]').click();
  await expect(page.locator('#view-herramientas')).toBeVisible();
  // y la caja de Appi vuelve a abrirse con el círculo
  await abrirCaja(page);
  await expect(page.locator('#appiTourRow')).toBeVisible();
});
