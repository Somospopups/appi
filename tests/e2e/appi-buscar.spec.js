const { test, expect } = require('@playwright/test');

const USER_ID='22222222-2222-4222-8222-222222222222';
function tokenFor(sub){const h=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');const p=Buffer.from(JSON.stringify({sub,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url');return `${h}.${p}.firma`}

const USUARIOS=[
  {usuario:'Juan Pérez',telf:'3515552001',domicilio:'Av. Colón 123',localidad:'Córdoba',producto:'AP-500',serie:'AP5-2024-0117',fCompra:'12/03/2025',fVenceRaw:'12/03/2027'},
  {usuario:'Juan Manuel Ortiz',telf:'3515552002',domicilio:'San Martín 88',localidad:'Villa María',producto:'Iontrix',serie:'ION-2023-8842',fCompra:'02/07/2024',fVenceRaw:'02/07/2026'},
  {usuario:'Marta Solís',telf:'3515551001',domicilio:'Belgrano 45',localidad:'Córdoba',producto:'AP-700',serie:'AP7-2025-4451',fCompra:'20/01/2026',fVenceRaw:'20/01/2028'},
  {usuario:'Lucía Fernández',telf:'3515552003',domicilio:'Rivadavia 900',localidad:'Río Cuarto',producto:'AP-500',serie:'AP5-2024-0118',fCompra:'15/05/2025',fVenceRaw:'15/05/2027'}
];
const EQUIPO={titular:{dip:'02-9802014',nombre:'MARÍA PÉREZ',categoria:'DC',tel:'3515551000'},personas:[
  {id:1,nivel:1,codigo:'02-9802015',nombre:'JUAN RÍOS',cat:'DC',tel:'3515553001',estado:'activo',pnAct:120},
  {id:2,nivel:1,codigo:'02-9802016',nombre:'LUCÍA GÓMEZ',cat:'DC',tel:'3515553002',estado:'activo',pnAct:90}
]};
const CONTACTOS=[
  {id:'c1',estado:'seguimiento',nombre:'Juan Paz',telefono:'3515559001',telefono_normalizado:'3515559001',tipo:'contacto',created_at:new Date().toISOString(),updated_at:new Date().toISOString()},
  {id:'c2',estado:'presentacion',nombre:'Ana Ruiz',telefono:'3515559002',telefono_normalizado:'3515559002',tipo:'contacto',created_at:new Date().toISOString(),updated_at:new Date().toISOString()}
];

async function entrar(page){
  await page.setViewportSize({width:390,height:840});
  const accessToken=tokenFor(USER_ID),now=new Date().toISOString();
  const profile={user_id:USER_ID,username:null,dip:'02-9802014',sucursal:'02',numero_distribuidor:'9802014',nombre:'María Pérez',socio_nombre:null,rol:'usuario',activo:true,debe_cambiar_password:false,membresia_meses:1,membresia_inicio:now,membresia_vence:new Date(Date.now()+30*86400000).toISOString()};
  await page.route('**/auth-config.js',route=>route.fulfill({contentType:'application/javascript',body:"window.APPI_AUTH={enabled:true,url:'https://mock.supabase.co',anonKey:'anon-key-publica-de-prueba',distributorEmailDomain:'distribuidores.appi.invalid',adminLogin:{username:'popups',email:'admin@appi.invalid'},loginAliases:{},offlineDays:7};"}));
  await page.route('https://mock.supabase.co/**',route=>{const url=new URL(route.request().url());const headers={'access-control-allow-origin':'*','content-type':'application/json'};if(url.pathname==='/auth/v1/token')return route.fulfill({status:200,headers,body:JSON.stringify({access_token:accessToken,refresh_token:'r',expires_in:3600,user:{id:USER_ID}})});if(url.pathname==='/rest/v1/appi_perfiles')return route.fulfill({status:200,headers,body:JSON.stringify([profile])});if(url.pathname==='/functions/v1/dispositivo-puente')return route.fulfill({status:200,headers,body:JSON.stringify({devices:[]})});if(url.pathname==='/rest/v1/appi_gestion_contactos'&&route.request().method()==='GET')return route.fulfill({status:200,headers,body:JSON.stringify(CONTACTOS)});return route.fulfill({status:200,headers,body:'[]'})});
  await page.addInitScript(([uid,contactos,usuarios,equipo])=>{
    localStorage.setItem('welcomeSeen','1');localStorage.setItem('tutoVisto_v2','1');localStorage.setItem('appi_tarjetas_auto','0');localStorage.setItem('appi_notif_listo_v1','1');localStorage.setItem('appi_notif_popup_later',String(Date.now()+400*86400000));localStorage.setItem('appi_aviso_psa_off','1');
    localStorage.setItem('equipoData',JSON.stringify(equipo));
    localStorage.setItem('usuarios_garantias',JSON.stringify(usuarios));
    localStorage.setItem(`appi_gestion_cache_v1_${uid}`,JSON.stringify({contacts:contactos,surveys:[],activities:[],savedAt:Date.now()}));
    localStorage.setItem(`appi_porque_v1_${uid}`,JSON.stringify({niveles:['Ayudar a mi familia']}));
    localStorage.setItem(`appi_tour_parque_v1_${uid}`,'1');
  },[USER_ID,CONTACTOS,USUARIOS,EQUIPO]);
  await page.goto('/index.html',{waitUntil:'networkidle'});
  await page.locator('#distributorInput').fill('02-9802014');await page.locator('#distributorPassword').fill('Clave1234');await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
  await page.waitForFunction(()=>window.APPIAssistant&&document.getElementById('appiAssistant')&&document.getElementById('appiAssistant').dataset.ready==='true'&&window.APPIBuscar);
}
async function abrirAppi(page){
  await page.locator('#appiAvatarHit').click();
  await expect(page.locator('#appiAssistant')).toHaveClass(/appi-open/);
}
async function buscar(page,texto){
  await abrirAppi(page);
  await page.locator('#appiInput').fill(texto);
  await expect(page.locator('.appi-sec').first()).toBeVisible();
}

test('escribir «juan» separa usuarios, distribuidores y purificadores',async({page})=>{
  await entrar(page);
  await buscar(page,'juan');
  const secciones=await page.locator('.appi-sec-title').allTextContents();
  expect(secciones.join(' | ')).toContain('Usuarios');
  expect(secciones.join(' | ')).toContain('Distribuidores');
  expect(secciones.join(' | ')).toContain('Purificadores');
  // Los dos Juan usuarios y el distribuidor Juan, en su propia sección.
  const usuarios=await page.locator('.appi-sec',{hasText:'USUARIOS'}).locator('.appi-row b').allTextContents();
  expect(usuarios).toContain('Juan Pérez');
  expect(usuarios).toContain('Juan Manuel Ortiz');
  expect(usuarios).not.toContain('JUAN RÍOS');
  const distribuidores=await page.locator('.appi-sec',{hasText:'DISTRIBUIDORES'}).locator('.appi-row b').allTextContents();
  expect(distribuidores).toContain('JUAN RÍOS');
  expect(distribuidores).not.toContain('Juan Pérez');
});

test('el número de serie del purificador encuentra el equipo y su dueño',async({page})=>{
  await entrar(page);
  await buscar(page,'0117');
  await expect(page.locator('.appi-sec-title',{hasText:'Purificadores'})).toBeVisible();
  const filas=await page.locator('.appi-results .appi-row b').allTextContents();
  expect(filas).toContain('Serie AP5-2024-0117');
  // El detalle muestra de quién es y el vencimiento.
  const sub=await page.locator('.appi-results .appi-row i').first().textContent();
  expect(sub).toContain('Juan Pérez');
  expect(sub).toContain('2027');
});

test('tocar un resultado lleva a la persona ya filtrada',async({page})=>{
  await entrar(page);
  await buscar(page,'juan pérez');
  await page.locator('.appi-results .appi-row',{hasText:'Juan Pérez'}).first().click();
  await expect(page.locator('#view-usuarios')).toHaveClass(/active/);
  await expect(page.locator('#appiAssistant')).not.toHaveClass(/appi-open/);
  await expect(page.locator('#usuariosSearch')).toHaveValue(/juan pérez/i);
});

test('tocar un distribuidor abre Mi Equipo con la búsqueda puesta',async({page})=>{
  await entrar(page);
  await buscar(page,'juan ríos');
  await page.locator('.appi-results .appi-row',{hasText:'JUAN RÍOS'}).first().click();
  await expect(page.locator('#view-equipo')).toHaveClass(/active/);
  await expect(page.locator('#equipoSearchInput')).toHaveValue(/02-9802015|JUAN RÍOS/i);
});

test('un contacto del panel se abre desde el buscador',async({page})=>{
  await entrar(page);
  await buscar(page,'juan paz');
  await page.locator('.appi-results .appi-row',{hasText:'Juan Paz'}).first().click();
  await expect(page.locator('#view-gestion')).toHaveClass(/active/);
  // Se abre la ficha del contacto, no una lista para volver a buscar.
  await expect(page.locator('#gestionDrawer')).toContainText('Juan Paz');
});

test('si no hay nada, lo dice claro y sugiere qué probar',async({page})=>{
  await entrar(page);
  await abrirAppi(page);
  await page.locator('#appiInput').fill('zzzzzz');
  await expect(page.locator('.appi-empty')).toContainText('No encontré');
  await expect(page.locator('.appi-empty')).toContainText('serie');
});

test('escribir una pantalla y tocar Enter la abre directo',async({page})=>{
  await entrar(page);
  await abrirAppi(page);
  await page.locator('#appiInput').fill('lista de precios');
  await page.locator('#appiForm').evaluate(f=>f.requestSubmit());
  await expect(page.locator('#view-lista')).toHaveClass(/active/);
});

test('busca productos de la lista de precios y abre la lista filtrada',async({page})=>{
  await entrar(page);
  await abrirAppi(page);
  await page.evaluate(()=>window.APPILista&&window.APPILista.pedir&&window.APPILista.pedir());
  await page.locator('#appiInput').fill('senior4');
  await expect(page.locator('.appi-sec-title',{hasText:'Productos'})).toBeVisible();
  const filas=await page.locator('.appi-sec',{hasText:'PRODUCTOS'}).locator('.appi-row b').allTextContents();
  expect(filas.join(' ')).toContain('Senior4');
  await page.locator('.appi-sec',{hasText:'PRODUCTOS'}).locator('.appi-row').first().click();
  await expect(page.locator('#view-lista')).toHaveClass(/active/);
  // La lista queda abierta y filtrada por ese producto (SKU real del catálogo).
  await expect(page.locator('#lpSearch')).not.toHaveValue('');
});

test('resalta en amarillo la parte que coincide',async({page})=>{
  await entrar(page);
  await buscar(page,'juan');
  await expect(page.locator('.appi-mark').first()).toBeVisible();
  const marcas=await page.locator('.appi-mark').allTextContents();
  expect(marcas.length).toBeGreaterThan(0);
  expect(marcas.every(m=>/juan/i.test(m))).toBe(true);
});
