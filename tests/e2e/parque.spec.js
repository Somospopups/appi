const { test, expect } = require('@playwright/test');

const USER_ID = '11111111-1111-4111-8111-111111111111';

function tokenFor(sub) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${header}.${payload}.firma`;
}

const EQUIPO = {
  titular: { dip: '02-9802014', nombre: 'María Pérez', categoria: 'DC' },
  personas: [{
    id: 0, nivel: 0, codigo: '02-9802014', nombre: 'María Pérez', cat: 'DC', pnAct: 5,
    garantias: { vendidas: 12, vencidas: 3, pendientes: 2 },
    hijos: [{ id: 1, nivel: 1, codigo: '111', nombre: 'Ana', cat: 'D', pnAct: 4, garantias: { vendidas: 5, vencidas: 1, pendientes: 0 }, hijos: [] }]
  }]
};

async function entrar(page, { sinTour = false } = {}) {
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
  await page.addInitScript(([uid, equipo, noTour]) => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('tutoVisto_v2', '1');
    localStorage.setItem(`appi_estilo_actual_v1_${uid}`, 'clasico');
    localStorage.setItem('equipoData', JSON.stringify(equipo));
    if (noTour) localStorage.setItem(`appi_tour_parque_v1_${uid}`, '1');
  }, [USER_ID, EQUIPO, sinTour]);
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
}

test('la tarjeta del parque suma hogares y garantías de todo el equipo', async ({ page }) => {
  await entrar(page, { sinTour: true });
  const card = page.locator('#parqueBlock');
  await expect(card).toBeVisible();
  await expect(card).toContainText('17');  // 12 + 5 hogares
  await expect(card).toContainText('4');   // 3 + 1 vencidas
  await expect(card).toContainText('mejor excusa');
});

test('el mini tour arranca solo la primera vez y recorre los 3 pasos', async ({ page }) => {
  await entrar(page);  // sin visto: el tour arranca solo
  await expect(page.locator('.pq-bubble')).toContainText('PARQUE 1/3');
  await page.locator('.pq-bubble .pq-next').click();
  await expect(page.locator('.pq-bubble')).toContainText('PARQUE 2/3');
  await page.locator('.pq-bubble .pq-next').click();
  await expect(page.locator('.pq-bubble')).toContainText('PARQUE 3/3');
  await expect(page.locator('#view-usuarios')).toHaveClass(/active/);
  await page.locator('.pq-bubble .pq-next').click();
  await expect(page.locator('.pq-bubble')).toHaveCount(0);

  // Marcado como visto: recargar no lo relanza.
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await expect(page.locator('.pq-bubble')).toHaveCount(0);

  // Pero el botón lo relanza cuando la persona quiere.
  await page.locator('#pqTourBtn').click();
  await expect(page.locator('.pq-bubble')).toContainText('PARQUE 1/3');
});
