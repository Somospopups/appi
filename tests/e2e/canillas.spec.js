const { test, expect } = require('@playwright/test');

// Canillas y adaptadores: mazo deslizable (estilo Tinder) del catálogo PSA;
// a la izquierda se saca o sube la foto de la pieza y la IA deja arriba la
// carta que más se parece, con la posibilidad de pasar carta por carta.

const USER_ID = '11111111-1111-4111-8111-111111111111';

function tokenFor(sub) {
  const h = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${h}.${p}.firma`;
}

async function entrar(page) {
  const profile = {
    user_id: USER_ID, username: null, dip: '02-9802014', sucursal: '02', numero_distribuidor: '9802014',
    nombre: 'María Pérez', socio_nombre: null, rol: 'usuario', activo: true, debe_cambiar_password: false,
    membresia_meses: 1, membresia_inicio: new Date().toISOString(),
    membresia_vence: new Date(Date.now() + 30 * 86400000).toISOString()
  };
  await page.route('**/auth-config.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: "window.APPI_AUTH={enabled:true,url:'https://mock.supabase.co',anonKey:'anon-key-publica-de-prueba',distributorEmailDomain:'distribuidores.appi.invalid',adminLogin:{username:'popups',email:'admin-popups@appi.invalid'},loginAliases:{},offlineDays:7};"
  }));
  await page.route('https://mock.supabase.co/**', async route => {
    const url = new URL(route.request().url());
    const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
    if (url.pathname === '/auth/v1/token' && url.searchParams.get('grant_type') === 'password') {
      const body = route.request().postDataJSON();
      const target = body.email && body.email.startsWith('dip-02-9802014@') ? USER_ID : '';
      if (!target || body.password !== 'Clave1234') return route.fulfill({ status: 400, headers: cors, body: JSON.stringify({ error: 'Credenciales incorrectas' }) });
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ access_token: tokenFor(target), refresh_token: 'refresh-' + target, expires_in: 3600, token_type: 'bearer', user: { id: target } }) });
    }
    if (url.pathname === '/auth/v1/token') return route.fulfill({ status: 400, headers: cors, body: JSON.stringify({ error: 'grant inválido' }) });
    if (url.pathname === '/rest/v1/appi_perfiles') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([profile]) });
    if (url.pathname === '/functions/v1/dispositivo-puente') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ devices: [] }) });
    return route.fulfill({ status: 200, headers: cors, body: '[]' });
  });
  await page.route('**/psa-catalogo.json*', route => route.fulfill({ status: 404 }));
  await page.route('**/vendor/tesseract/tesseract.min.js', route => route.abort());
  await page.addInitScript(() => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('appi_tarjetas_auto', '0');
    localStorage.setItem('tutoVisto_v2', '1');
    window.Tesseract = { recognize: async () => ({ text: '006 ADAPT UNIVERSAL MARIPOSA' }) };
  });
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
}

const PNG_1X1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

async function abrirCanillas(page) {
  await page.evaluate(() => window.openCanillas());
  await expect(page.locator('#view-canillas')).toHaveClass(/active/);
  await expect(page.locator('#canIDPanel')).toContainText('Tu foto');
  await expect(page.locator('#canDeckSec')).toContainText('Pasar carta 1 de ');
  await expect(page.locator('#canDeckCounter')).toContainText(/de \d+/);
}

test('la tarjeta del Home abre el identificador por foto con el mazo', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.showView('view-herramientas'));
  await expect(page.locator('#view-herramientas')).toHaveClass(/active/);
  await page.locator('#herrGrid').getByRole('button', { name: /Canillas y adaptadores/ }).click();
  await expect(page.locator('#view-canillas')).toHaveClass(/active/);
  await expect(page.locator('#canillasCont')).toContainText('deslizá las cartas');
  await expect(page.locator('#canIDPanel')).toContainText('Sacale una foto');
});

test('se pasa de carta con el botón y se vuelve atrás', async ({ page }) => {
  await entrar(page);
  await abrirCanillas(page);
  const primera = await page.locator('#canDeckTop h3').innerText();
  await page.locator('[data-can-next]').click();
  await expect(page.locator('#canDeckCounter')).toContainText('Pasar carta 2 de ');
  const segunda = await page.locator('#canDeckTop h3').innerText();
  expect(segunda).not.toBe(primera);
  await page.locator('[data-can-prev]').click();
  await expect(page.locator('#canDeckCounter')).toContainText('Pasar carta 1 de ');
});

test('la búsqueda filtra el mazo y deja la carta del modelo', async ({ page }) => {
  await entrar(page);
  await abrirCanillas(page);
  await page.locator('#canDeckSearch').fill('mariposa');
  await expect(page.locator('#canDeckCounter')).toContainText('Pasar carta 1 de 5');
  await expect(page.locator('#canDeckTop')).toContainText('MARIPOSA');
  await page.locator('#canDeckSearch').fill('zzz');
  await expect(page.locator('#canDeckSec')).toContainText('No encontré modelos');
  await page.locator('[data-can-reset-deck]').click();
  await expect(page.locator('#canDeckCounter')).toContainText('Pasar carta 1 de 82');
});

test('subir la foto: la IA deja arriba la carta y avisa el adaptador', async ({ page }) => {
  await entrar(page);
  await abrirCanillas(page);
  await page.locator('#canFotoSube').setInputFiles({ name: 'mariposa.png', mimeType: 'image/png', buffer: PNG_1X1 });
  await expect(page.locator('.can-match')).toContainText('Adaptador requerido', { timeout: 20000 });
  await expect(page.locator('.can-match')).toContainText('MARIPOSA', { timeout: 20000 });
  await expect(page.locator('#canDeckTop .can-ai')).toContainText('La IA encontró esta', { timeout: 20000 });
});

test('una imagen inválida avisa que no pudo compararla', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => { window.Tesseract.recognize = async () => ({ text: '' }); });
  await abrirCanillas(page);
  await page.locator('#canFotoSube').setInputFiles({ name: 'malo.txt', mimeType: 'text/plain', buffer: Buffer.from('no es una imagen') });
  await expect(page.locator('.can-nomatch')).toContainText('No pude compararla', { timeout: 20000 });
});

test('el botón de ayuda abre la guía en el modal', async ({ page }) => {
  await entrar(page);
  await abrirCanillas(page);
  await page.locator('#btnHelpCanillas').click();
  await expect(page.locator('#canPdfModal')).toBeVisible();
  await page.locator('#canPdfModal .can-close').click();
  await expect(page.locator('#canPdfModal')).not.toBeVisible();
});

test('el gesto de atrás cierra el modal de la guía y no sale de Canillas', async ({ page }) => {
  await entrar(page);
  await abrirCanillas(page);
  await page.locator('#btnHelpCanillas').click();
  await expect(page.locator('#canPdfModal')).toBeVisible();
  await page.goBack();
  await expect(page.locator('#canPdfModal')).not.toBeVisible();
  await expect(page.locator('#view-canillas')).toHaveClass(/active/);
});

test('la carta del mazo abre la foto en el modal', async ({ page }) => {
  await entrar(page);
  await abrirCanillas(page);
  const tarjeta = page.locator('#canDeckTop');
  await tarjeta.locator('button', { hasText: 'Foto' }).click();
  await expect(page.locator('#canImgModal')).toBeVisible();
  await expect(page.locator('#canImgModal img')).toHaveAttribute('src', /catalogo-img\//);
});