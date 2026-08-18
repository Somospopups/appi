const { test, expect } = require('@playwright/test');

const USER_ID='11111111-1111-4111-8111-111111111111';
function tokenFor(sub){
  const header=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
  const payload=Buffer.from(JSON.stringify({sub,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url');
  return `${header}.${payload}.firma`;
}

async function abrirAppActivada(page) {
  const now=new Date().toISOString(),accessToken=tokenFor(USER_ID);
  const profile={
    user_id:USER_ID,username:null,dip:'02-9802014',sucursal:'02',numero_distribuidor:'9802014',
    nombre:'Distribuidor de prueba',socio_nombre:null,rol:'usuario',activo:true,debe_cambiar_password:false,
    membresia_meses:1,membresia_inicio:now,membresia_vence:new Date(Date.now()+30*86400000).toISOString()
  };
  await page.route('**/auth-config.js', route => route.fulfill({
    contentType:'application/javascript',
    body:"window.APPI_AUTH={enabled:true,url:'https://mock.supabase.co',anonKey:'anon-key-publica-de-prueba-1234567890',distributorEmailDomain:'distribuidores.appi.invalid',adminLogin:{username:'popups',email:'admin-popups@appi.invalid'},loginAliases:{},offlineDays:7};"
  }));
  await page.route('https://mock.supabase.co/**', route => {
    const url=new URL(route.request().url());
    const cors={'access-control-allow-origin':'*','content-type':'application/json'};
    if(url.pathname==='/rest/v1/appi_perfiles')return route.fulfill({status:200,headers:cors,body:JSON.stringify([profile])});
    if(url.pathname==='/rest/v1/appi_datos')return route.fulfill({status:200,headers:cors,body:'[]'});
    if(url.pathname==='/functions/v1/dispositivo-puente')return route.fulfill({status:200,headers:cors,body:JSON.stringify({devices:[]})});
    return route.fulfill({status:200,headers:cors,body:'[]'});
  });
  await page.addInitScript(([userId,token,profileValue]) => {
    localStorage.setItem('appi_cache_v186','1');
    localStorage.setItem('tutoVisto_v2','1');
    localStorage.setItem('welcomeSeen','1');
    localStorage.setItem('appi_auth_session_v1',JSON.stringify({
      session:{access_token:token,refresh_token:'refresh-test',token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,user:{id:userId}},
      profile:profileValue,lastValidatedAt:Date.now(),offline:false
    }));
  },[USER_ID,accessToken,profile]);
  await page.goto('/index.html',{waitUntil:'networkidle'});
  await expect(page.locator('#view-home')).toHaveClass(/active/);
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
}

test('arranca, navega e importa Garantías una sola vez', async ({ page }) => {
  const pageErrors = [];
  const importLogs = [];
  page.on('pageerror', error => pageErrors.push(String(error)));
  page.on('console', message => {
    if (message.text().includes('📂 Archivo seleccionado:')) importLogs.push(message.text());
  });

  await abrirAppActivada(page);
  const sidebarLabels=await page.locator('#deskSidebar .ds-section-label').allTextContents();
  expect(sidebarLabels.map(text=>text.trim())).toEqual(['Mi mes','Mi negocio','Mis herramientas']);
  const sidebarButtons=await page.locator('#deskSidebar .ds-btn').allTextContents();
  expect(sidebarButtons.map(text=>text.replace(/^[^\p{L}]+/u,'').trim())).toEqual([
    'Home','Las 7 P','Presupuesto','Rueda de la Vida','Rueda del Negocio','Mi Equipo','Histórico','Usuarios','Panel de Contactos 0','Los 8 Pasos','Escalera de Sueños','Coach de Demo','Botella','Simulador','Grabadora','Notas Keep'
  ]);

  for (const [expression, expectedView] of [
    ["openSiete()", 'view-siete'],
    ["openOcho()", 'view-ocho'],
    ["openPresu()", 'view-presu'],
    ["openRueda('vida')", 'view-wheel'],
    ["openEquipo()", 'view-equipo'],
    ["openSeguimiento()", 'view-seguimiento'],
    // Mi Encuesta se unificó en Mi Gente: el atajo viejo debe caer en la pantalla nueva.
    ["openEncuestaTool()", 'view-gestion'],
    ["openMiGestion()", 'view-gestion'],
    ["openGrabadora()", 'view-grabadora'],
    ["showView('view-notas')", 'view-notas'],
    ["showView('view-usuarios')", 'view-usuarios']
  ]) {
    await page.evaluate(expression);
    await expect(page.locator(`#${expectedView}`)).toHaveClass(/active/);
  }

  await page.evaluate(() => { showView('view-planning'); renderPlanningTools(); });
  await expect(page.locator('#planningToolsList .tool-title-block h3')).toHaveText([
    'Las 7 P',
    'Presupuesto Mensual',
    'Rueda de la Vida',
    'Rueda del Negocio'
  ]);
  await page.evaluate(() => showView('view-usuarios'));

  // Un solo selector de archivo a la vista: el de emergencia quedó eliminado.
  await expect(page.locator('#usuariosUploadCard input[type="file"]')).toHaveCount(1);
  await expect(page.locator('#usuariosUploadCard')).not.toContainText('emergencia');

  await page.setInputFiles('#usuariosFileInput', 'test_garantias.xlsx');
  await expect(page.locator('#usuariosStTotal')).toHaveText('4');
  await expect(page.locator('#usuariosList .tree-node')).toHaveCount(4);
  expect(importLogs).toHaveLength(1);

  await page.evaluate(() => {
    window.__appiLastOpen = null;
    window.open = (...args) => { window.__appiLastOpen = args; return null; };
    showView('view-usuarios');
  });
  await expect(page.locator('#view-usuarios')).toBeVisible();
  await page.locator('#usuariosList .tree-node').first().click();
  await page.locator('#usuariosList [data-u-action="whatsapp"]').first().click();
  const opened = await page.evaluate(() => window.__appiLastOpen);
  expect(opened[0]).toMatch(/^https:\/\/wa\.me\//);
  expect(pageErrors).toEqual([]);
});

test('trata el contenido importado como texto y no ejecuta HTML', async ({ page }) => {
  await abrirAppActivada(page);
  await page.evaluate(() => showView('view-usuarios'));

  const csv = [
    'Usuario,Teléf.,Domicilio,C.P.,Localidad,Producto,F.Compra,F.Vence',
    '"<img src=x onerror=""window.__xssProof=\'executed\'"">",3515555555,Calle 123,X5000,Centro,PSA VERO,1/1/2026,1/1/2027'
  ].join('\n');

  await page.setInputFiles('#usuariosFileInput', {
    name: 'usuarios-seguridad.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csv, 'utf8')
  });

  await expect(page.locator('#usuariosStTotal')).toHaveText('1');
  await expect(page.locator('#usuariosList img')).toHaveCount(0);
  await expect(page.locator('#usuariosList .tree-name')).toContainText('<img src=x');
  expect(await page.evaluate(() => window.__xssProof || null)).toBeNull();
});

test('el backup excluye credenciales y restaura solo claves permitidas', async ({ page }) => {
  await abrirAppActivada(page);
  const result = await page.evaluate(() => {
    localStorage.setItem('equipoData', JSON.stringify({ personas: [{ nombre: 'Equipo seguro' }] }));
    localStorage.setItem('appi_auth_session_v1', 'NO-DEBE-SALIR');
    localStorage.setItem('appi_device_id', 'NO-DEBE-SALIR');
    const backup = crearBackupLocalAPPI();
    localStorage.removeItem('equipoData');
    const count = aplicarBackupLocalAPPI({
      format: 'APPI-BACKUP',
      schema: 2,
      data: { ...backup.data, appi_auth_session_v1: 'ATAQUE', appi_device_id: 'ATAQUE' }
    });
    return {
      count,
      exportedKeys: Object.keys(backup.data),
      equipo: JSON.parse(localStorage.getItem('equipoData')),
      auth: localStorage.getItem('appi_auth_session_v1'),
      device: localStorage.getItem('appi_device_id')
    };
  });
  expect(result.exportedKeys).toContain('equipoData');
  expect(result.exportedKeys).not.toContain('appi_auth_session_v1');
  expect(result.exportedKeys).not.toContain('appi_device_id');
  expect(result.equipo.personas[0].nombre).toBe('Equipo seguro');
  expect(result.auth).toBe('NO-DEBE-SALIR');
  expect(result.device).not.toBe('ATAQUE');
});

test('las notas Keep se muestran sujetas con un pin', async ({ page }) => {
  await abrirAppActivada(page);
  await page.evaluate(()=>{
    localStorage.setItem('appi_keep_notas',JSON.stringify([{id:String(Date.now()),title:'Nota con pin',text:'Contenido',color:'#fff475',pinned:false}]));
    window.renderKeep();showView('view-notas');
  });
  await expect(page.locator('#view-notas')).toBeVisible();
  await expect(page.locator('#keepGrid .keep-note')).toHaveCount(1);
  await expect(page.locator('#keepGrid .keep-pin')).toHaveCount(1);
  await page.locator('#keepTitle').fill('Nueva nota');
  await page.locator('#keepText').fill('Texto');
  await page.evaluate(()=>window.addKeep());
  await expect(page.locator('#colorPickerPopup .create-color-dot')).toHaveCount(10);
  await expect(page.locator('#modalFooter button')).toHaveCount(0);
  await page.setViewportSize({width:390,height:844});
  const columns=await page.locator('#colorPickerPopup').evaluate(node=>getComputedStyle(node).gridTemplateColumns.split(' ').filter(Boolean).length);
  expect(columns).toBe(5);
});

test('Contactos distingue pendientes de cerrados', async ({ page }) => {
  await abrirAppActivada(page);
  const result = await page.evaluate(() => {
    const ayer = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const contactos = [
      { id: 1, nombre: 'Terminado', estado: 'Contactado', fecha: ayer },
      { id: 2, nombre: 'Pendiente', estado: 'Seguimiento', fecha: ayer },
      { id: 3, nombre: 'Descartado', estado: 'No le interesa', fecha: ayer }
    ];
    localStorage.setItem('seguimientoPersonas', JSON.stringify(contactos));
    return {
      pendientes: seguimientoPendientes(),
      progreso: seguimientoProgreso(),
      terminadoVencido: seguimientoVencido(contactos[0]),
      pendienteVencido: seguimientoVencido(contactos[1])
    };
  });

  expect(result).toEqual({
    pendientes: 1,
    progreso: 67,
    terminadoVencido: false,
    pendienteVencido: true
  });
});
