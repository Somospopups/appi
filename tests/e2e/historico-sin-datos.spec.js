const { test, expect } = require('@playwright/test');

const USER_ID = '88888888-8888-4888-8888-888888888888';

function tokenFor(sub) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${header}.${payload}.firma`;
}

async function abrir(page) {
  const now = new Date().toISOString();
  const profile = {
    user_id: USER_ID, dip: '02-9802014', sucursal: '02', numero_distribuidor: '9802014',
    nombre: 'María Pérez', rol: 'usuario', activo: true, debe_cambiar_password: false,
    membresia_meses: 1, membresia_inicio: now, membresia_vence: new Date(Date.now() + 30 * 86400000).toISOString()
  };
  await page.route('**/auth-config.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: "window.APPI_AUTH={enabled:true,url:'https://mock.supabase.co',anonKey:'anon-key-publica-de-prueba-1234567890',distributorEmailDomain:'distribuidores.appi.invalid',adminLogin:{username:'popups',email:'admin-popups@appi.invalid'},loginAliases:{},offlineDays:7};"
  }));
  await page.route('https://mock.supabase.co/**', route => {
    const url = new URL(route.request().url());
    const headers = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
    if (url.pathname === '/auth/v1/token') return route.fulfill({ status: 200, headers, body: JSON.stringify({ access_token: tokenFor(USER_ID), refresh_token: 'r', expires_in: 3600, user: { id: USER_ID } }) });
    if (url.pathname === '/rest/v1/appi_perfiles') return route.fulfill({ status: 200, headers, body: JSON.stringify([profile]) });
    return route.fulfill({ status: 200, headers, body: '[]' });
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
  await page.waitForFunction(() => window.__APPI_HISTORICO__ && window.__APPI_HISTORICO__.state.ready, null, { timeout: 15000 });
  await page.evaluate(() => window.openHistorico());
}

test('si faltan los datos de MI PSA, Histórico explica el motivo y abre los campos editables', async ({ page }) => {
  await abrir(page);
  const status = await page.evaluate(async () => {
    window.psaTieneCredenciales = () => false;
    window.__formularioPSA = null;
    window.mostrarPopupPSAFormulario = options => { window.__formularioPSA = options; return true; };
    return (await window.__APPI_HISTORICO__.syncMissingPSAPeriods()).status;
  });
  expect(status).toBe('missing-credentials');
  await expect(page.locator('.hs-no-data-state h2')).toHaveText('Todavía no hay cierres para mostrar');
  await expect(page.locator('.hs-no-data-reason')).toContainText('Faltan los datos de MI PSA');
  await expect(page.getByRole('button', { name: 'Reintentar ahora' })).toBeVisible();
  await page.getByRole('button', { name: 'Verificar datos de MI PSA' }).click();
  await expect.poll(() => page.evaluate(() => window.__formularioPSA && window.__formularioPSA.verificar)).toBe(true);
});

test('Reintentar ahora salta la espera automática y deja visible el error real', async ({ page }) => {
  await abrir(page);
  const automatic = await page.evaluate(async () => {
    const api = window.__APPI_HISTORICO__;
    api.state.periods = [];
    api.expectedHistoricalPeriodIds().forEach(id => localStorage.setItem(`hist_psa_auto_error_${id}`, String(Date.now())));
    window.__histCalls = [];
    window.psaTieneCredenciales = () => true;
    window.psaSincronizarHistorico = async id => { window.__histCalls.push({ id, at: Date.now(), stack: new Error().stack }); throw new Error('PSA rechazó la consulta de prueba'); };
    const result = await api.syncMissingPSAPeriods();
    return { status: result.status, calls: window.__histCalls.length };
  });
  expect(automatic).toEqual({ status: 'waiting-retry', calls: 0 });
  await expect(page.locator('.hs-no-data-reason')).toContainText('esperando para reintentarse');
  await page.getByRole('button', { name: 'Reintentar ahora' }).click();
  await expect.poll(() => page.evaluate(() => {
    const year = new Date().getFullYear();
    return window.__histCalls.filter(call => Number(call.id.slice(0, 4)) >= year - 1).length;
  }), { timeout: 10000 }).toBe(3);
  await expect(page.locator('.hs-no-data-reason')).toContainText('PSA rechazó la consulta de prueba');
  await expect(page.getByRole('button', { name: 'Reintentar ahora' })).toBeVisible();
});
