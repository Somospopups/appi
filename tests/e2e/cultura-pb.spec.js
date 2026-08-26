const { test, expect } = require('@playwright/test');

const USER_ID = '11111111-1111-4111-8111-111111111111';

function tokenFor(sub) {
  const h = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${h}.${p}.firma`;
}

async function abrirApp(page, equipo) {
  const now = new Date().toISOString();
  const profile = {
    user_id: USER_ID, username: null, dip: '02-9802014', sucursal: '02', numero_distribuidor: '9802014',
    nombre: 'Boulard, Valeria', socio_nombre: 'Toledo, Silvia', rol: 'usuario', activo: true, debe_cambiar_password: false,
    membresia_meses: 1, membresia_inicio: now, membresia_vence: new Date(Date.now() + 30 * 86400000).toISOString()
  };
  await page.route('**/auth-config.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: "window.APPI_AUTH={enabled:true,url:'https://mock.supabase.co',anonKey:'anon-key-publica-de-prueba-1234567890',distributorEmailDomain:'distribuidores.appi.invalid',adminLogin:{username:'popups',email:'admin-popups@appi.invalid'},loginAliases:{},offlineDays:7};"
  }));
  await page.route('https://mock.supabase.co/**', route => {
    const url = new URL(route.request().url());
    const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
    if (url.pathname === '/auth/v1/token') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ access_token: tokenFor(USER_ID), refresh_token: 'r', expires_in: 3600, user: { id: USER_ID } }) });
    if (url.pathname === '/rest/v1/appi_perfiles') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([profile]) });
    if (url.pathname === '/functions/v1/dispositivo-puente') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ devices: [] }) });
    return route.fulfill({ status: 200, headers: cors, body: '[]' });
  });
  await page.addInitScript(data => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('appi_tarjetas_auto', '0');
    localStorage.setItem('tutoVisto_v2', '1');
    if (data) localStorage.setItem('equipoData', JSON.stringify(data));
  }, equipo || null);
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
}

function mesId() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

test('Cultura toma el PB del titular, no el del socio', async ({ page }) => {
  await abrirApp(page, {
    titular: { dip: '02-9802014', nombre: 'Boulard, Valeria', socio: 'Toledo, Silvia' },
    personas: [
      { id: 1, nivel: 1, nombre: 'TOLEDO, SILVIA', codigo: '02-7777777', pnAct: 22, hijos: [] },
      { id: 2, nivel: 0, nombre: 'BOULARD, VALERIA', codigo: '02-9802014', pnAct: 8.5, hijos: [] },
      { id: 3, nivel: 1, nombre: 'RAMA, JUAN', codigo: '02-1000001', pnAct: 40, hijos: [] }
    ]
  });
  await page.evaluate(() => window.renderCulturaCrecimiento && window.renderCulturaCrecimiento());
  const campo = page.locator('#culturaWrap [data-cultura-pb]').first();
  await expect(campo).toHaveAttribute('data-cultura-pb', '8.5');
  await expect(campo.locator('b')).toHaveText('8,5');
  await expect(page.locator('#culturaWrap [data-cultura-pb-src]').first()).toContainText('Desde tu Línea');
  expect(await page.locator('#culturaWrap input[data-cultura-pb]').count()).toBe(0);
  const guardado = await page.evaluate(id => {
    const raw = JSON.parse(localStorage.getItem('cultura_crecimiento_v1') || '{}');
    const meses = raw && raw.meses ? raw.meses : raw;
    return (meses[id] || {}).pb;
  }, mesId());
  expect(guardado).toBe(8.5);
});

test('si el titular no está en la planilla, no inventa ni deja tipear', async ({ page }) => {
  await abrirApp(page, {
    titular: { dip: '02-9802014', nombre: 'Boulard, Valeria', socio: 'Toledo, Silvia' },
    personas: [
      { id: 1, nivel: 1, nombre: 'TOLEDO, SILVIA', codigo: '02-7777777', pnAct: 22, hijos: [] },
      { id: 3, nivel: 1, nombre: 'RAMA, JUAN', codigo: '02-1000001', pnAct: 40, hijos: [] }
    ]
  });
  await page.evaluate(() => window.renderCulturaCrecimiento && window.renderCulturaCrecimiento());
  const campo = page.locator('#culturaWrap [data-cultura-pb]').first();
  await expect(campo.locator('b')).toHaveText('—');
  await expect(campo).toContainText('Cargá tu Línea');
  expect(await page.locator('#culturaWrap input[data-cultura-pb]').count()).toBe(0);
  const guardado = await page.evaluate(id => {
    const raw = JSON.parse(localStorage.getItem('cultura_crecimiento_v1') || '{}');
    const meses = raw && raw.meses ? raw.meses : raw;
    return (meses[id] || {}).pb || 0;
  }, mesId());
  expect(guardado).toBe(0);
});
