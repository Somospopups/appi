const { test, expect } = require('@playwright/test');

const USER_ID = '11111111-1111-4111-8111-111111111111';

// Línea descendente de prueba: titular D con 6 PB personales,
// un DJ directo de 4 PB y una D directa de 5 PB con su propio DJ de 3 PB.
const EQUIPO = {
  titular: { dip: '02-9802014', nombre: 'María Pérez', categoria: 'D' },
  personas: []
};
EQUIPO.personas.push({
  id: 0, nivel: 0, codigo: '02-9802014', nombre: 'María Pérez', cat: 'D', pnAct: 6,
  hijos: [
    { id: 1, nivel: 1, codigo: '111', nombre: 'Ana DJ', cat: 'DJ', pnAct: 4, hijos: [] },
    { id: 2, nivel: 1, codigo: '222', nombre: 'Luis D', cat: 'D', pnAct: 5, hijos: [
      { id: 3, nivel: 2, codigo: '333', nombre: 'Sofi DJ', cat: 'DJ', pnAct: 3, hijos: [] }
    ] }
  ]
});

function tokenFor(sub) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${header}.${payload}.firma`;
}

async function entrar(page, { conEquipo = true } = {}) {
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

  await page.addInitScript(([uid, equipo]) => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('tutoVisto_v2', '1');
    localStorage.setItem('seguimientoPersonas', '[]');
    if (equipo) localStorage.setItem('equipoData', JSON.stringify(equipo));
    window.open = () => ({ closed: false, close() {}, location: { set href(v) {}, get href() { return ''; } } });
  }, [USER_ID, conEquipo ? EQUIPO : null]);

  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
  await page.evaluate(() => window.showView('view-negocio'));
}

test('los volúmenes A, B y C respetan el lenguaje del Flex', async ({ page }) => {
  await page.addInitScript(equipo => {
    localStorage.setItem('equipoData', JSON.stringify(equipo));
  }, EQUIPO);
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.APPICarrera);

  const m = await page.evaluate(() => window.APPICarrera.metricas());
  expect(m.categoria).toBe('D');
  expect(m.A).toBe(6);           // volumen personal del titular
  expect(m.B).toBe(4);           // organización de DJ directa
  expect(m.C).toBe(8);           // la D directa (5) + su línea (3)

  const p = await page.evaluate(() => window.APPICarrera.progreso(window.APPICarrera.metricas()));
  expect(p.siguiente).toBe('DC');
  expect(p.barras[0]).toMatchObject({ actual: 10, meta: 13 });   // (A)+(B)
  expect(p.barras[1]).toMatchObject({ actual: 0, meta: 3 });     // orgs. de D con 13 PB
});

test('el inicio muestra la categoría oficial y lo que falta para el pase', async ({ page }) => {
  await entrar(page);

  const card = page.locator('#carreraBlock');
  await expect(card).toContainText('Distribuidor');
  await expect(card).toContainText('Próximo pase: Distribuidor Calificado');
  await expect(card).toContainText('10 / 13');
  await expect(card).toContainText('0 / 3');
  await expect(card).toContainText('Capacitación Básica');
});

test('la checklist humana se guarda en el dispositivo', async ({ page }) => {
  await entrar(page);

  await page.locator('#carreraBlock [data-check="capacitacion"]').check();
  await page.reload({ waitUntil: 'networkidle' });

  await expect(page.locator('#carreraBlock [data-check="capacitacion"]')).toBeChecked();
});

test('sin Línea Descendente no se inventa ninguna categoría', async ({ page }) => {
  await entrar(page, { conEquipo: false });
  await expect(page.locator('#carreraBlock')).toHaveCount(0);
});
