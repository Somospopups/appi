const { test, expect } = require('@playwright/test');

const USER_ID = '11111111-1111-4111-8111-111111111111';

function tokenFor(sub) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${header}.${payload}.firma`;
}

async function entrar(page) {
  const accessToken = tokenFor(USER_ID);
  const now = new Date().toISOString();
  const profile = {
    user_id: USER_ID, username: null, dip: '02-9802014', sucursal: '02', numero_distribuidor: '9802014',
    nombre: 'María Pérez', socio_nombre: null, rol: 'usuario', activo: true, debe_cambiar_password: false,
    membresia_meses: 1, membresia_inicio: now, membresia_vence: new Date(Date.now() + 30 * 86400000).toISOString()
  };
  await page.route('**/auth-config.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: "window.APPI_AUTH={enabled:true,url:'https://mock.supabase.co',anonKey:'anon-key-publica-de-prueba',distributorEmailDomain:'distribuidores.appi.invalid',adminLogin:{username:'popups',email:'admin-popups@appi.invalid'},loginAliases:{},offlineDays:7};"
  }));
  await page.route('https://mock.supabase.co/**', route => {
    const url = new URL(route.request().url());
    const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
    if (url.pathname === '/auth/v1/token') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ access_token: accessToken, refresh_token: 'r', expires_in: 3600, user: { id: USER_ID } }) });
    if (url.pathname === '/rest/v1/appi_perfiles') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([profile]) });
    if (url.pathname === '/functions/v1/dispositivo-puente') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ devices: [] }) });
    return route.fulfill({ status: 200, headers: cors, body: '[]' });
  });
  await page.addInitScript(() => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('tutoVisto_v2', '1');
  });
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
}

test('el home arranca como slider y las flechas cambian de estilo', async ({ page }) => {
  await entrar(page);

  const wrap = page.locator('#estiloWrap');
  await expect(wrap).toBeVisible();
  await expect(wrap).toContainText('TU PRÓXIMA ACCIÓN');          // Foco
  await expect(page.locator('.es-nombre')).toContainText('FOCO');

  await page.locator('#esNext').click();
  await expect(page.locator('#estiloWrap')).toContainText('¿Qué querés hacer hoy?');  // Puertas
  await expect(page.locator('.es-nombre')).toContainText('PUERTAS');

  // El estilo elegido sobrevive el refresco.
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('.es-nombre')).toContainText('PUERTAS');

  // Y el clásico sigue a un swipe de distancia.
  await page.locator('#esPrev').click();
  await expect(page.locator('.es-nombre')).toContainText('FOCO');
});

test('cada persona elige sus estilos con el boton de paleta', async ({ page }) => {
  await entrar(page);

  await page.locator('#esConfig').click();
  const panel = page.locator('#esConfigPanel');
  await expect(panel).toBeVisible();

  // Deja solamente Zen habilitado.
  await panel.locator('[data-estilo="foco"]').uncheck();
  await panel.locator('[data-estilo="puertas"]').uncheck();
  await panel.locator('[data-estilo="agenda"]').uncheck();
  await panel.locator('[data-estilo="charla"]').uncheck();
  await panel.locator('[data-estilo="misiones"]').uncheck();
  await panel.locator('[data-estilo="pestanas"]').uncheck();
  await panel.locator('[data-estilo="carrusel"]').uncheck();
  await panel.locator('[data-estilo="clasico"]').uncheck();
  await panel.locator('[data-estilo="zen"]').check();
  await panel.locator('#esConfigOk').click();

  await expect(page.locator('#estiloWrap')).toContainText('TU PORQUÉ');
  await expect(page.locator('.es-nombre')).toContainText('ZEN');
});
