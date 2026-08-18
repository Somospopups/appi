const { test, expect } = require('@playwright/test');

const USER_ID = '11111111-1111-4111-8111-111111111111';
const hoy = new Date().toISOString();

function tokenFor(sub) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${header}.${payload}.firma`;
}

const EQUIPO = {
  titular: { dip: '02-9802014', nombre: 'María Pérez', categoria: 'DC' },
  personas: [{
    id: 0, nivel: 0, codigo: '02-9802014', nombre: 'María Pérez', cat: 'DC', pnAct: 12,
    hijos: [
      { id: 1, nivel: 1, codigo: '111', nombre: 'Ana Gómez', cat: 'D', pnAct: 9, alta: hoy, hijos: [{ id: 9, nivel: 2, codigo: '999', nombre: 'Nieto', cat: 'DJ', pnAct: 1, hijos: [] }] },
      { id: 2, nivel: 1, codigo: '222', nombre: 'Pedro Díaz', cat: 'DJ', pnAct: 0, hijos: [] }
    ]
  }]
};
const CONTACTOS = [
  { id: 'c1', estado: 'presentacion', nombre: 'Lucía Vega', telefono: '1', telefono_normalizado: '3515550003', tipo: 'contacto', created_at: hoy, updated_at: hoy },
  { id: 'c2', estado: 'convertido', nombre: 'Raúl Paredes', telefono: '2', telefono_normalizado: '3515550004', tipo: 'contacto', created_at: hoy, updated_at: hoy }
];

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
  await page.addInitScript(([uid, equipo, contactos]) => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('tutoVisto_v2', '1');
    localStorage.setItem('equipoData', JSON.stringify(equipo));
    localStorage.setItem(`appi_gestion_cache_v1_${uid}`, JSON.stringify({ contacts: contactos, surveys: [], activities: [], savedAt: Date.now() }));
  }, [USER_ID, EQUIPO, CONTACTOS]);
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
  await page.evaluate(() => window.showView('view-negocio'));
}

test('el GPS del mes lee la Línea y el Panel', async ({ page }) => {
  await entrar(page);
  const gps = page.locator('#gpsBlock');
  await expect(gps).toBeVisible();
  await expect(gps).toContainText('12 / 12');   // PB personales
  await expect(gps).toContainText('1 / 2');     // patrocinios con 9 PB
  await expect(gps).toContainText('2 / 30');    // demos autoregistradas
  await expect(gps).toContainText('1 / 10');    // cierres
  await expect(gps).toContainText('Vas encaminado');
});

test('la botella calcula conciencia y se comparte', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.abrirBotella());
  await page.locator('#botPorDia').fill('3');
  await page.locator('#botPrecio').fill('1000');
  await expect(page.locator('#botResult')).toContainText('90.000');      // por mes
  await expect(page.locator('#botResult')).toContainText('3.240.000');   // en 3 años
  await expect(page.locator('#botShare')).toBeVisible();
});

test('el simulador suma comercialización y red', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.abrirSimulador());
  await expect(page.locator('#simResult')).toContainText('3.240.000');   // 10 cierres
  await expect(page.locator('#simResult')).toContainText('3.762.000');   // 100 de red
  await expect(page.locator('#simResult')).toContainText('7.002.000');   // total
});

test('demos y cierres se mueven con la regla 3 a 1', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.abrirSimulador());
  await page.locator('#simDemos').evaluate(el => { el.value = '15'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await expect(page.locator('#simDemosV')).toHaveText('15');
  await expect(page.locator('#simCierresV')).toHaveText('5');
  await page.locator('#simCierres').evaluate(el => { el.value = '8'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await expect(page.locator('#simCierresV')).toHaveText('8');
  await expect(page.locator('#simDemosV')).toHaveText('24');
});

test('el stock se carga y sobrevive el refresco', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.showView('view-presu'));
  await page.locator('#stockNombre').fill('Iontrix 2');
  await page.locator('#stockAdd').click();
  await expect(page.locator('#stockCard')).toContainText('Iontrix 2');
  await page.reload({ waitUntil: 'networkidle' });
  await page.evaluate(() => window.showView('view-presu'));
  await expect(page.locator('#stockCard')).toContainText('Iontrix 2');
});

test('la duplicación cuenta activos y duplicantes', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.showView('view-equipo'));
  const dup = page.locator('#dupCard');
  await expect(dup).toContainText('1 de 2 patrocinados directos activos');
  await expect(dup).toContainText('1 ya duplican');
  await expect(dup).toContainText('duplica');
  await expect(dup).toContainText('en pausa');
});
