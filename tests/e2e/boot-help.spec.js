const { test, expect } = require('@playwright/test');

const USER_ID = '11111111-1111-4111-8111-111111111111';

function tokenFor(sub) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${header}.${payload}.firma`;
}

async function mockBase(page, profile) {
  const accessToken = tokenFor(USER_ID);
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
}

test('sin pantallazos: boot mientras elegís persona, y directo al home', async ({ page }) => {
  const now = new Date().toISOString();
  const profile = {
    user_id: USER_ID, username: null, dip: '02-9802014', sucursal: '02', numero_distribuidor: '9802014',
    nombre: 'María Pérez', socio_nombre: 'Juan Pérez', rol: 'usuario', activo: true, debe_cambiar_password: false,
    membresia_meses: 1, membresia_inicio: now, membresia_vence: new Date(Date.now() + 30 * 86400000).toISOString()
  };
  await mockBase(page, profile);
  await page.addInitScript(([uid, perf]) => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('tutoVisto_v2', '1');
    // Sesión guardada: el arranque real que antes flasheaba home y login.
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const payload = btoa(JSON.stringify({ sub: uid, exp: Math.floor(Date.now() / 1000) + 3600 })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    localStorage.setItem('appi_auth_session_v1', JSON.stringify({ session: { access_token: header + '.' + payload + '.firma', expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'r' }, profile: perf, lastValidatedAt: Date.now() }));
  }, [USER_ID, profile]);

  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });

  // Mientras se elige la persona: el login NO se ve, el boot tapa todo.
  await expect(page.locator('#personChoiceOverlay')).toBeVisible();
  await expect(page.locator('#lockScreen')).toBeHidden();

  await page.locator('[data-person-type="titular"]').click();

  // Después de elegir: sin boot y directo al home, sin pasar por el login.
  await expect(page.locator('#view-home')).toHaveClass(/active/);
  await expect(page.locator('#bootScreen')).toHaveCount(0, { timeout: 3000 });
  await expect(page.locator('#lockScreen')).toBeHidden();
});

test('las pantallas nuevas tienen su ayuda y abre al tocarla', async ({ page }) => {
  const now = new Date().toISOString();
  await mockBase(page, {
    user_id: USER_ID, username: null, dip: '02-9802014', sucursal: '02', numero_distribuidor: '9802014',
    nombre: 'María Pérez', socio_nombre: null, rol: 'usuario', activo: true, debe_cambiar_password: false,
    membresia_meses: 1, membresia_inicio: now, membresia_vence: new Date(Date.now() + 30 * 86400000).toISOString()
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

  for (const [abrir, boton, titulo] of [
    ['openOcho()', '#btnHelpOcho', 'Los 8 Pasos'],
    ['openSuenos()', '#btnHelpSuenos', 'Escalera de Sueños'],
    ['openDemo()', '#btnHelpDemo', 'Guía de Demostración']
  ]) {
    await page.evaluate(a => window[a.replace('()', '')](), abrir);
    await page.locator(boton).click();
    await expect(page.locator('#modalOverlay')).toBeVisible();
    await expect(page.locator('#modalTitle')).toHaveText(titulo);
    await page.locator('#modalOverlay .btn-ok').click({ force: true });
    await page.waitForTimeout(400);
  }
});
