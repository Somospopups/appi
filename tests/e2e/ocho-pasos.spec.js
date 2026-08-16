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
    localStorage.setItem('seguimientoPersonas', '[]');
    window.open = () => ({ closed: false, close() {}, location: { set href(v) {}, get href() { return ''; } } });
  });

  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
}

test('los 8 pasos del material están todos, en orden y con su herramienta', async ({ page }) => {
  await entrar(page);

  await page.evaluate(() => window.openOcho());
  const titulos = await page.locator('#ochoSteps .ocho-head h3').allTextContents();
  expect(titulos).toEqual([
    'Propósito, sueños y metas', 'Compromiso', 'Banco de datos', 'Contacto e invitación',
    'Presentación', 'Seguimiento', 'Chequeo de resultados', 'Evolución y duplicación'
  ]);
  // El paso 3 lleva al Panel de Contactos.
  await page.locator('#ochoSteps .ocho-card').nth(2).getByText('Abrir el Panel de Contactos').click();
  await expect(page.locator('#view-gestion')).toHaveClass(/active/);
});

test('el ciclo se avisa cíclico y convive con Las 7 P', async ({ page }) => {
  await entrar(page);

  await page.evaluate(() => window.openOcho());
  await expect(page.locator('#view-ocho .ocho-intro')).toContainText('cíclico');

  // Las 7 P siguen vivas y separadas.
  await page.evaluate(() => window.openSiete());
  await expect(page.locator('#view-siete')).toHaveClass(/active/);
  await expect(page.locator('#sieteSteps')).toContainText('PARAR');
});

test('el home y el menú ofrecen el acceso a Los 8 Pasos', async ({ page }) => {
  await entrar(page);

  await expect(page.locator('#homeExtraKeep')).toContainText('Los 8 Pasos');
  await expect(page.locator('#deskSidebar')).toContainText('Los 8 Pasos');
});
