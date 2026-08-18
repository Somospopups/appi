const { test, expect } = require('@playwright/test');

const USER_ID = '11111111-1111-4111-8111-111111111111';

function tokenFor(sub) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${header}.${payload}.firma`;
}

async function mockAuth(page, { socio = false } = {}) {
  const accessToken = tokenFor(USER_ID);
  const now = new Date().toISOString();
  const profile = {
    user_id: USER_ID, username: null, dip: '02-9802014', sucursal: '02', numero_distribuidor: '9802014',
    nombre: 'María Pérez', socio_nombre: socio ? 'Juan Pérez' : null, rol: 'usuario', activo: true,
    debe_cambiar_password: false, membresia_meses: 1, membresia_inicio: now,
    membresia_vence: new Date(Date.now() + 30 * 86400000).toISOString()
  };
  await page.route('**/auth-config.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: "window.APPI_AUTH={enabled:true,url:'https://mock.supabase.co',anonKey:'anon-key-publica-de-prueba-1234567890',distributorEmailDomain:'distribuidores.appi.invalid',adminLogin:{username:'popups',email:'admin-popups@appi.invalid'},loginAliases:{},offlineDays:7};"
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
}

async function login(page) {
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
}

async function scrollMetrics(page) {
  return page.evaluate(() => {
    const root = document.getElementById('appScroll');
    const modal = document.getElementById('modalOverlay');
    return {
      modalDisplay: modal ? getComputedStyle(modal).display : 'none',
      rootOverflowY: root ? getComputedStyle(root).overflowY : '',
      locked: document.body.classList.contains('appi-scroll-lock'),
      rootScrollHeight: root ? root.scrollHeight : 0,
      rootClientHeight: root ? root.clientHeight : 0
    };
  });
}

async function scrolledAmount(page) {
  return page.evaluate(() => {
    const root = document.getElementById('appScroll');
    if (root && getComputedStyle(root).overflowY === 'scroll') return root.scrollTop;
    return window.scrollY || document.documentElement.scrollTop || 0;
  });
}

test('después de ingresar el body no queda trabado y la página scrollea', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 640 });
  await mockAuth(page);
  await login(page);
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
  await expect(page.locator('#view-home')).toHaveClass(/active/);

  const state = await scrollMetrics(page);
  expect(state.modalDisplay).toBe('none');
  expect(state.locked).toBe(false);
  expect(state.rootOverflowY).toBe('scroll');

  await page.evaluate(() => {
    const marker = document.createElement('div');
    marker.id = 'scrollProbe';
    marker.style.height = '2400px';
    marker.textContent = 'probe';
    document.querySelector('#view-home').appendChild(marker);
    const root = document.getElementById('appScroll');
    if (root) root.scrollTop = 1400;
    else window.scrollTo(0, 1400);
  });
  await expect.poll(() => scrolledAmount(page)).toBeGreaterThan(400);
});

test('elegir titular o socio no deja overflow hidden', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 640 });
  await mockAuth(page, { socio: true });
  await login(page);
  await expect(page.locator('#personChoiceOverlay')).toBeVisible();
  await page.locator('[data-person-type="titular"]').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
  await expect(page.locator('#view-home')).toHaveClass(/active/);
  const state = await scrollMetrics(page);
  expect(state.modalDisplay).toBe('none');
  expect(state.locked).toBe(false);
  expect(state.overflowY).not.toBe('hidden');
});
