const { test, expect } = require('@playwright/test');

// El identificador de canillas y adaptadores compara una foto subida contra
// las imágenes de la Guía V02-21 (número + forma), con flujo guiado de
// respaldo anclado al mismo catálogo.

const USER_ID = '11111111-1111-4111-8111-111111111111';

function tokenFor(sub) {
  const h = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${h}.${p}.firma`;
}

async function entrar(page) {
  const accessToken = tokenFor(USER_ID);
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
  await page.route('https://mock.supabase.co/**', route => {
    const url = new URL(route.request().url());
    const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
    if (url.pathname === '/auth/v1/token') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ access_token: accessToken, refresh_token: 'r', expires_in: 3600, user: { id: USER_ID } }) });
    if (url.pathname === '/rest/v1/appi_perfiles') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([profile]) });
    if (url.pathname === '/functions/v1/dispositivo-puente') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ devices: [] }) });
    return route.fulfill({ status: 200, headers: cors, body: '[]' });
  });
  await page.route('**/psa-catalogo.json*', route => route.fulfill({ status: 404 }));
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

async function abrirCanillas(page) {
  await page.evaluate(() => window.openCanillas());
  await expect(page.locator('#view-canillas')).toHaveClass(/active/);
  await expect(page.locator('#canillasCont')).toContainText('Qué vas a conectar');
  await expect(page.locator('#canillasCont .can-count')).toContainText('/ 84');
}

test('la tarjeta del Home abre el identificador asistido', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.showView('view-herramientas'));
  await expect(page.locator('#view-herramientas')).toHaveClass(/active/);
  await page.locator('#herrGrid').getByRole('button', { name: /Canillas y adaptadores/ }).click();
  await expect(page.locator('#view-canillas')).toHaveClass(/active/);
  await expect(page.locator('#canillasCont')).toContainText('Guía V02-21');
});

test('paso 1: elegir Ducha estrecha los resultados', async ({ page }) => {
  await entrar(page);
  await abrirCanillas(page);
  await page.locator('#canillasPasos').getByRole('button', { name: /Ducha/ }).click();
  await expect(page.locator('#canillasCont .can-count')).toContainText('/ 84');
  await expect(page.locator('#canillasPasos')).toContainText('La boca es');
});

test('paso 2 y 3: tipo + medida dejan el modelo justo', async ({ page }) => {
  await entrar(page);
  await abrirCanillas(page);
  await page.locator('#canillasPasos').getByRole('button', { name: /Lavarropas/ }).click();
  await page.locator('#canillasPasos').getByRole('button', { name: /En la guía/ }).first().click();
  await expect(page.locator('#canPdfModal')).toBeVisible();
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

test('la tarjeta de resultado abre la foto en el modal', async ({ page }) => {
  await entrar(page);
  await abrirCanillas(page);
  await page.locator('#canillasSearch').fill('mariposa');
  const tarjeta = page.locator('.can-card').first();
  await tarjeta.locator('button', { hasText: 'Foto' }).click();
  await expect(page.locator('#canImgModal')).toBeVisible();
  await expect(page.locator('#canImgModal img')).toHaveAttribute('src', /catalogo-img\//);
});

test('subir una foto la compara contra la guía y muestra coincidencias', async ({ page }) => {
  await entrar(page);
  await abrirCanillas(page);
  await page.evaluate(() => {
    window.Tesseract = { recognize: async () => ({ text: '006 ADAPT UNIVERSAL MARIPOSA' }) };
  });
  await page.setInputFiles('#canFotoSube', {
    name: 'pieza.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
  });
  await expect(page.locator('#canillasId .can-prev')).toBeVisible();
  await expect(page.locator('#canillasId')).toContainText('Coincidencias', { timeout: 30000 });
  await expect(page.locator('#canillasId')).toContainText('MARIPOSA');
});

test('una imagen inválida avisa para probar otra foto', async ({ page }) => {
  await entrar(page);
  await abrirCanillas(page);
  await page.evaluate(() => {
    window.Tesseract = { recognize: async () => ({ text: '' }) };
  });
  await page.setInputFiles('#canFotoSube', {
    name: 'nota.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('esto no es una foto', 'utf8')
  });
  await expect(page.locator('#canillasId')).toContainText('No pude compararla', { timeout: 30000 });
});