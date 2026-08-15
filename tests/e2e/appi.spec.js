const { test, expect } = require('@playwright/test');

async function abrirAppActivada(page) {
  await page.route('**/auth-config.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: "window.APPI_AUTH={enabled:false,url:'',anonKey:'',distributorEmailDomain:'distribuidores.appi.invalid',loginAliases:{},offlineDays:7};"
  }));
  await page.addInitScript(() => {
    localStorage.setItem('appi_cache_v186', '1');
    localStorage.setItem('tutoVisto_v2', '1');
    localStorage.setItem('welcomeSeen', '1');
  });
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    const deviceId = generarDeviceId();
    const codigo = generarCodigoActivacion(deviceId);
    localStorage.setItem('appi_activada', JSON.stringify({ codigo, deviceId, fecha: Date.now() }));
  });
  await page.reload({ waitUntil: 'networkidle' });
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
    'Home','Las 7 P','Presupuesto','Rueda de la Vida','Rueda del Negocio','Mi Equipo','Histórico','Usuarios','Contactos','Mi Encuesta','Mi Gestión 0','Grabadora','Notas Keep'
  ]);

  for (const [expression, expectedView] of [
    ["openSiete()", 'view-siete'],
    ["openPresu()", 'view-presu'],
    ["openRueda('vida')", 'view-wheel'],
    ["openEquipo()", 'view-equipo'],
    ["openSeguimiento()", 'view-seguimiento'],
    ["openEncuestaTool()", 'view-encuesta'],
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

  await page.setInputFiles('#usuariosFileInput', 'test_garantias.xlsx');
  await expect(page.locator('#usuariosStTotal')).toHaveText('4');
  await expect(page.locator('#usuariosList .tree-node')).toHaveCount(4);
  expect(importLogs).toHaveLength(1);

  await page.evaluate(() => {
    window.__appiLastOpen = null;
    window.open = (...args) => { window.__appiLastOpen = args; return null; };
  });
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
    showView('view-notas');window.renderKeep();
  });
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
