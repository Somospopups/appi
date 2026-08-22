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
    localStorage.setItem('appi_tarjetas_auto', '0');
    localStorage.setItem('tutoVisto_v2', '1');
  });
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
}

test('el porqué se excava, se guarda y se muestra como motor', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.openSuenos());

  const card = page.locator('#porqueCard');
  await expect(card).toContainText('¿Qué querés lograr con esta actividad?');

  await page.locator('#pkRespuesta').fill('Ganar dinero');
  await page.locator('#pkNext').click();
  await expect(card).toContainText('Y eso… ¿para qué?');

  await page.locator('#pkRespuesta').fill('Terminar mi casa');
  await page.locator('#pkNext').click();
  await expect(page.locator('#pkStop')).toBeVisible();

  await page.locator('#pkRespuesta').fill('Que mi familia viva tranquila');
  await page.locator('#pkStop').click();

  // La cadena queda como raíces y la última es el motor.
  await expect(card).toContainText('Ganar dinero');
  await expect(card).toContainText('Terminar mi casa');
  await expect(card).toContainText('Que mi familia viva tranquila');
  await expect(card).toContainText('tu motor');

  // Sobrevive el refresco.
  await page.reload({ waitUntil: 'networkidle' });
  await page.evaluate(() => window.openSuenos());
  await expect(page.locator('#porqueCard')).toContainText('Que mi familia viva tranquila');

  // Y se puede excavar de nuevo.
  await page.locator('#pkRedo').click();
  await expect(page.locator('#porqueCard')).toContainText('¿Qué querés lograr con esta actividad?');
});
