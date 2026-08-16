const { test, expect } = require('@playwright/test');

const USER_ID = '11111111-1111-4111-8111-111111111111';
const LINK_TOKEN = '77777777-7777-4777-8777-777777777777';

function tokenFor(sub) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${header}.${payload}.firma`;
}

async function abrirComoDistribuidor(page, invitaciones) {
  const now = new Date().toISOString();
  const accessToken = tokenFor(USER_ID);
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
    if (url.pathname === '/rest/v1/rpc/appi_crear_invitacion_encuesta') {
      invitaciones.push(request.postDataJSON());
      const token = `${LINK_TOKEN.slice(0, -1)}${invitaciones.length}`;
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([{ token, expires_at: new Date(Date.now() + 86400000).toISOString() }]) });
    }
    if (url.pathname === '/functions/v1/dispositivo-puente') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ devices: [] }) });
    return route.fulfill({ status: 200, headers: cors, body: '[]' });
  });

  await page.addInitScript(() => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('tutoVisto_v2', '1');
    // Sin agenda del navegador, el botón pide los datos directamente.
    delete navigator.contacts;
    window.__ventanas = [];
    window.open = url => { window.__ventanas.push(url); return null; };
  });
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
  await page.evaluate(() => openEncuestaTool());
  await expect(page.locator('#view-encuesta')).toHaveClass(/active/);
}

test('Mi Encuesta muestra un solo botón, sin datos técnicos', async ({ page }) => {
  await abrirComoDistribuidor(page, []);

  const boton = page.locator('#surveyShareBtn');
  await expect(boton).toBeVisible();
  await expect(boton).toContainText('Enviar encuesta');

  // Una sola acción principal en toda la pantalla.
  await expect(page.locator('#surveyToolContent button')).toHaveCount(1);

  // Nada de jerga interna a la vista del distribuidor.
  const texto = await page.locator('#surveyToolContent').innerText();
  for (const prohibido of ['token', 'http', '24 horas', 'dispositivo', 'vence', 'Copiar', 'cola']) {
    expect(texto.toLowerCase()).not.toContain(prohibido.toLowerCase());
  }
});

test('cada envío pide un destinatario nuevo y anima el viaje', async ({ page }) => {
  const invitaciones = [];
  await abrirComoDistribuidor(page, invitaciones);

  const boton = page.locator('#surveyShareBtn');
  await boton.click();

  // Primer paso: a quién.
  await expect(page.locator('#appiDialogTitle')).toHaveText('Enviar encuesta');
  await page.locator('#appiDialogInput').fill('Ana Gómez');
  await page.locator('#appiDialogOk').click();

  // Segundo paso: su teléfono.
  await page.locator('#appiDialogInput').fill('3515551001');
  await page.locator('#appiDialogOk').click();

  // La animación se dispara sólo después de crear la invitación real.
  await expect(boton).toHaveClass(/sending/, { timeout: 5000 });
  await expect(page.locator('.share-done b')).toHaveText('Para Ana');
  await expect(boton).not.toHaveClass(/sending/, { timeout: 5000 });

  // Se abrió WhatsApp con el enlace de esa invitación.
  const ventanas = await page.evaluate(() => window.__ventanas);
  expect(ventanas).toHaveLength(1);
  // APPI antepone el código de Argentina para que WhatsApp resuelva el número.
  expect(ventanas[0]).toContain('wa.me/5493515551001');
  expect(decodeURIComponent(ventanas[0])).toContain('encuesta.html?t=');
  expect(invitaciones).toHaveLength(1);

  // Queda registrado como enviado.
  await expect(page.locator('.share-row')).toHaveCount(1);
  await expect(page.locator('.share-row').first()).toContainText('Ana Gómez');
  await expect(page.locator('.share-row').first()).toContainText('Enviada');

  // Segundo envío: vuelve a preguntar, no reutiliza el destinatario anterior.
  await boton.click();
  await expect(page.locator('#appiDialogTitle')).toHaveText('Enviar encuesta');
  await expect(page.locator('#appiDialogInput')).toHaveValue('');
  await page.locator('#appiDialogInput').fill('Bruno Díaz');
  await page.locator('#appiDialogOk').click();
  await page.locator('#appiDialogInput').fill('3515552002');
  await page.locator('#appiDialogOk').click();

  await expect(page.locator('.share-row')).toHaveCount(2, { timeout: 6000 });
  await expect(page.locator('.share-row').first()).toContainText('Bruno Díaz');

  // Cada persona recibió una invitación distinta.
  expect(invitaciones).toHaveLength(2);
  const ventanasFinales = await page.evaluate(() => window.__ventanas);
  expect(ventanasFinales).toHaveLength(2);
  expect(ventanasFinales[0]).not.toBe(ventanasFinales[1]);
});

test('un número incompleto no genera invitación', async ({ page }) => {
  const invitaciones = [];
  await abrirComoDistribuidor(page, invitaciones);

  await page.locator('#surveyShareBtn').click();
  await page.locator('#appiDialogInput').fill('Carlos Corto');
  await page.locator('#appiDialogOk').click();
  await page.locator('#appiDialogInput').fill('351');
  await page.locator('#appiDialogOk').click();

  await expect(page.locator('#appiDialogTitle')).toHaveText('Número inválido');
  await page.locator('#appiDialogOk').click();

  expect(invitaciones).toHaveLength(0);
  await expect(page.locator('.share-row')).toHaveCount(0);
  const ventanas = await page.evaluate(() => window.__ventanas);
  expect(ventanas).toHaveLength(0);
});
