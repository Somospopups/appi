const { test, expect } = require('@playwright/test');

const USER_ID = '11111111-1111-4111-8111-111111111111';

function tokenFor(sub) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${header}.${payload}.firma`;
}

// Abre APPI con la cuenta de prueba y devuelve las llamadas que llegaron a la
// función de importar, que es la única puerta de entrada a Mi Gente.
async function abrirMiGente(page, { contactosLocales = [], yaMigrado = false } = {}) {
  const importados = [];
  const accessToken = tokenFor(USER_ID);
  const now = new Date().toISOString();
  const profile = {
    user_id: USER_ID, username: null, dip: '02-9802014', sucursal: '02', numero_distribuidor: '9802014',
    nombre: 'María Pérez', socio_nombre: null, rol: 'usuario', activo: true, debe_cambiar_password: false,
    membresia_meses: 1, membresia_inicio: now, membresia_vence: new Date(Date.now() + 30 * 86400000).toISOString()
  };

  await page.route('**/auth-config.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: "window.APPI_AUTH={enabled:true,url:'https://mock.supabase.co',anonKey:'anon-key-publica-de-prueba-1234567890',distributorEmailDomain:'distribuidores.appi.invalid',adminLogin:{username:'popups',email:'admin-popups@appi.invalid'},loginAliases:{},offlineDays:7};"
  }));
  await page.route('https://mock.supabase.co/**', route => {
    const request = route.request();
    const url = new URL(request.url());
    const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
    if (url.pathname === '/auth/v1/token') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ access_token: accessToken, refresh_token: 'r', expires_in: 3600, user: { id: USER_ID } }) });
    if (url.pathname === '/rest/v1/appi_perfiles') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([profile]) });
    if (url.pathname === '/rest/v1/rpc/appi_gente_importar_contacto') {
      const cuerpo = request.postDataJSON();
      importados.push(cuerpo);
      // La base rechaza los teléfonos que no tienen entre 8 y 15 números.
      const digitos = String(cuerpo.p_telefono || '').replace(/\D/g, '');
      if (digitos.length < 8 || digitos.length > 15) {
        return route.fulfill({ status: 400, headers: cors, body: JSON.stringify({ message: `El contacto ${cuerpo.p_nombre} necesita un teléfono válido` }) });
      }
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify(['cccccccc-cccc-4ccc-8ccc-cccccccccccc']) });
    }
    if (url.pathname === '/functions/v1/dispositivo-puente') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ devices: [] }) });
    return route.fulfill({ status: 200, headers: cors, body: '[]' });
  });

  await page.addInitScript(([locales, migrado, uid]) => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('tutoVisto_v2', '1');
    localStorage.setItem('seguimientoPersonas', JSON.stringify(locales));
    if (migrado) localStorage.setItem(`appi_gente_migrado_v1_${uid}`, new Date().toISOString());
    window.open = () => ({ closed: false, close() {}, location: { set href(v) {}, get href() { return ''; } } });
  }, [contactosLocales, yaMigrado, USER_ID]);

  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
  return importados;
}

test('Mi Gente reúne el envío de encuestas y los contactos en una sola pantalla', async ({ page }) => {
  await abrirMiGente(page);
  await page.evaluate(() => openMiGestion());
  await expect(page.locator('#view-gestion')).toHaveClass(/active/);

  // Enviar la encuesta y agregar a alguien están arriba de todo, antes de las solapas.
  await expect(page.locator('#surveyShareBtn')).toBeVisible();
  await expect(page.locator('#genteNuevo')).toBeVisible();

  // Tres solapas, no siete pantallas sueltas.
  await expect(page.locator('.gestion-main-tab')).toHaveText([/Hoy/, /Todos/, /Resultados/]);

  // El menú lateral ya no ofrece las tres entradas viejas.
  const menu = await page.locator('#deskSidebar').innerText();
  expect(menu).toContain('Mi Gente');
  expect(menu).not.toContain('Mi Gestión');
  expect(menu).not.toContain('Mi Encuesta');
});

test('los Contactos guardados en el teléfono se ofrecen para subir una sola vez', async ({ page }) => {
  const locales = [
    { id: 1, nombre: 'Ana López', telefono: '3515551234', interes: 'Producto', estado: 'No contactado', fecha: '2026-09-01', notas: 'Le interesa' },
    { id: 2, nombre: 'Dani Ok', telefono: '351 555 9999', interes: 'Negocio', estado: 'Más adelante', fecha: '', notas: '' }
  ];
  const importados = await abrirMiGente(page, { contactosLocales: locales });

  await page.evaluate(() => openMiGestion());
  await expect(page.locator('#appiDialogTitle')).toHaveText('Traer mis Contactos');
  await expect(page.locator('#appiDialogMessage')).toContainText('2 contactos');
  await page.locator('#appiDialogOk').click();

  await expect(page.locator('#appiDialogTitle')).toHaveText('Listo', { timeout: 10000 });
  expect(importados).toHaveLength(2);
  // Cada dato local viaja a su lugar en la nube, incluido el id de origen.
  expect(importados[0]).toMatchObject({ p_nombre: 'Ana López', p_telefono: '3515551234', p_interes: 'Producto', p_estado: 'No contactado', p_proximo: '2026-09-01', p_local_id: '1' });
  await page.locator('#appiDialogOk').click();

  // Queda la marca: al volver a entrar no se vuelve a preguntar.
  const marcado = await page.evaluate(uid => !!localStorage.getItem(`appi_gente_migrado_v1_${uid}`), USER_ID);
  expect(marcado).toBe(true);
  await page.evaluate(() => APPIGestion.state.contacts = []);
  const pendientes = await page.evaluate(() => APPIGestion.contactosPendientes());
  expect(pendientes.conTel).toHaveLength(0);
});

test('un contacto sin teléfono no se pierde en silencio: se avisa y se lo deja para completar', async ({ page }) => {
  const locales = [
    { id: 1, nombre: 'Ana López', telefono: '3515551234', interes: '', estado: '', fecha: '', notas: '' },
    { id: 2, nombre: 'Beto Sin Tel', telefono: '', interes: '', estado: '', fecha: '', notas: '' },
    { id: 3, nombre: 'Caro Corta', telefono: '123', interes: '', estado: '', fecha: '', notas: '' }
  ];
  const importados = await abrirMiGente(page, { contactosLocales: locales });

  await page.evaluate(() => openMiGestion());
  // El aviso nombra a los que quedan afuera antes de tocar nada.
  await expect(page.locator('#appiDialogMessage')).toContainText('2 no tienen teléfono cargado');
  await expect(page.locator('#appiDialogMessage')).toContainText('Beto Sin Tel');
  await page.locator('#appiDialogOk').click();

  await expect(page.locator('#appiDialogTitle')).toHaveText('Listo', { timeout: 10000 });
  await expect(page.locator('#appiDialogMessage')).toContainText('Quedaron 2 sin teléfono');
  // Sólo se sube el que tiene número válido: los otros dos siguen en el teléfono.
  expect(importados).toHaveLength(1);
  expect(importados[0].p_nombre).toBe('Ana López');
  await page.locator('#appiDialogOk').click();
  const guardados = await page.evaluate(() => JSON.parse(localStorage.getItem('seguimientoPersonas') || '[]'));
  expect(guardados).toHaveLength(3);
});

test('agregar a mano exige un teléfono usable antes de guardar', async ({ page }) => {
  const importados = await abrirMiGente(page, { yaMigrado: true });
  await page.evaluate(() => openMiGestion());
  await expect(page.locator('#genteNuevo')).toBeVisible();

  // Primer intento: teléfono demasiado corto, no se guarda nada.
  await page.locator('#genteNuevo').click();
  await page.locator('#appiDialogInput').fill('Carla Prueba');
  await page.locator('#appiDialogOk').click();
  await page.locator('#appiDialogInput').fill('123');
  await page.locator('#appiDialogOk').click();
  await expect(page.locator('#appiDialogTitle')).toHaveText('Revisá el teléfono');
  await expect(page.locator('#appiDialogMessage')).toContainText('entre 8 y 15');
  await page.locator('#appiDialogOk').click();
  expect(importados).toHaveLength(0);

  // Segundo intento con un número real: ahora sí viaja a la nube.
  await page.locator('#genteNuevo').click();
  await page.locator('#appiDialogInput').fill('Carla Prueba');
  await page.locator('#appiDialogOk').click();
  await page.locator('#appiDialogInput').fill('351 555 4321');
  await page.locator('#appiDialogOk').click();
  await expect.poll(() => importados.length).toBe(1);
  expect(importados[0]).toMatchObject({ p_nombre: 'Carla Prueba', p_telefono: '351 555 4321', p_estado: 'nuevo' });
});

test('los que quedaron sin teléfono se avisan en pantalla y no se pregunta de nuevo', async ({ page }) => {
  const locales = [
    { id: 1, nombre: 'Ana López', telefono: '3515551234', interes: '', estado: '', fecha: '', notas: '' },
    { id: 2, nombre: 'Beto Sin Tel', telefono: '', interes: '', estado: '', fecha: '', notas: '' }
  ];
  // La migración ya se hizo: sólo queda el que no tiene número.
  await abrirMiGente(page, { contactosLocales: locales, yaMigrado: true });
  await page.evaluate(() => openMiGestion());
  await page.waitForTimeout(1500);

  // No vuelve a preguntar: ya no hay nada que subir.
  await expect(page.locator('.appi-dialog-overlay')).toBeHidden();

  // Pero el pendiente queda a la vista, con nombre y una salida para arreglarlo.
  const aviso = page.locator('.gente-pendientes');
  await expect(aviso).toBeVisible();
  await expect(aviso).toContainText('1 contacto sin teléfono');
  await expect(aviso).toContainText('Beto Sin Tel');
  await page.locator('#genteCompletar').click();
  await expect(page.locator('#view-seguimiento')).toHaveClass(/active/);
});

test('un refresco automático no borra lo que se está escribiendo en una ficha', async ({ page }) => {
  await abrirMiGente(page, { yaMigrado: true });
  await page.evaluate(() => openMiGestion());
  await expect(page.locator('#view-gestion')).toHaveClass(/active/);

  // Se siembra un contacto y se abre su ficha.
  await page.evaluate(() => {
    APPIGestion.state.contacts = [{
      id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', user_id: '11111111-1111-4111-8111-111111111111',
      encuesta_id: null, tipo: 'contacto', nombre: 'Elena Prueba', telefono: '3515550001',
      telefono_normalizado: '3515550001', relacion: '', zona: '', referido_por: '', estado: 'nuevo',
      notas: '', proximo_contacto: null, ultimo_contacto: null, cantidad_origenes: 1, metadata: {},
      created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    }];
    APPIGestion.setView('todos');
  });
  await page.locator('[data-open-contact="dddddddd-dddd-4ddd-8ddd-dddddddddddd"]').click();
  await expect(page.locator('#gestionDetailOverlay')).toBeVisible();

  // La persona escribe una nota larga y elige una etapa.
  await page.locator('[data-detail-status="seguimiento"]').click();
  await page.locator('#gestionNotes').fill('Quedamos en hablar el jueves a la tarde.');

  // Justo entonces entra un refresco de la nube, como pasa cada 30 segundos.
  await page.evaluate(() => APPIGestion.refresh(false));
  await page.waitForTimeout(600);

  // La ficha sigue abierta y no se perdió nada de lo escrito.
  await expect(page.locator('#gestionDetailOverlay')).toBeVisible();
  await expect(page.locator('#gestionNotes')).toHaveValue('Quedamos en hablar el jueves a la tarde.');
  await expect(page.locator('[data-detail-status="seguimiento"]')).toHaveClass(/active/);
});
