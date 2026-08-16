const { test, expect } = require('@playwright/test');

const USER_ID = '11111111-1111-4111-8111-111111111111';

function tokenFor(sub) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${header}.${payload}.firma`;
}

// Titular D con PB de los últimos 3 meses y 5 personas abajo
// (una dada de alta este mes) para mantenimiento, anchura y Pareto.
const EQUIPO = {
  titular: { dip: '02-9802014', nombre: 'María Pérez', categoria: 'D' },
  personas: []
};
EQUIPO.personas.push({
  id: 0, nivel: 0, codigo: '02-9802014', nombre: 'María Pérez', cat: 'D',
  pnAct: 1, m1: 3, m2: 0,
  hijos: [
    { id: 1, nivel: 1, codigo: '111', nombre: 'Ana', cat: 'DJ', pnAct: 10, hijos: [] },
    { id: 2, nivel: 1, codigo: '222', nombre: 'Luis', cat: 'DJ', pnAct: 8, hijos: [] },
    { id: 3, nivel: 1, codigo: '333', nombre: 'Sofi', cat: 'DJ', pnAct: 4, hijos: [] },
    { id: 4, nivel: 1, codigo: '444', nombre: 'Pedro', cat: 'DJ', pnAct: 2, hijos: [] },
    { id: 5, nivel: 1, codigo: '555', nombre: 'Lua', cat: 'DJ', pnAct: 1, alta: new Date().toISOString(), hijos: [] }
  ]
});

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
}

test('la escalera de sueños se guarda y se puede compartir', async ({ page }) => {
  await entrar(page);

  await page.evaluate(() => window.APPIEscaleraSuenos.open());
  await page.locator('#suenosParaQue').fill('Para que mis hijos vivan sin miedo al agua.');
  await page.locator('[data-sueno="0"]').fill('Terminar la casa');
  await page.locator('[data-sueno="6"]').fill('Empresa propia');

  await page.reload({ waitUntil: 'networkidle' });
  await page.evaluate(() => window.APPIEscaleraSuenos.open());
  await expect(page.locator('#suenosParaQue')).toHaveValue('Para que mis hijos vivan sin miedo al agua.');
  await expect(page.locator('[data-sueno="0"]')).toHaveValue('Terminar la casa');
  await expect(page.locator('#suenosShare')).toBeVisible();
});

test('la guía de demo tiene los 5 pasos y las fichas de producto', async ({ page }) => {
  await entrar(page);

  await page.evaluate(() => window.APPIDemoGuia.open());
  await expect(page.locator('#demoCont .demo-paso')).toHaveCount(5);
  await expect(page.locator('#demoProducto option')).toHaveCount(10);

  await page.locator('#demoProducto').selectOption('SodaBurby');
  await expect(page.locator('#demoFicha')).toContainText('gasificada');

  await page.locator('#demoFin').click();
  await expect(page.locator('#view-gestion')).toHaveClass(/active/);
});

test('la carrera avisa mantenimiento, anchura y Pareto', async ({ page }) => {
  await entrar(page);

  const card = page.locator('#carreraBlock');
  // Meses [0, 3, 1] contra el mínimo de 2 PB: uno cumplido.
  await expect(card).toContainText('Mantenimiento');
  await expect(card).toContainText('Te falta un mes cumplido más');
  // Anchura: un patrocinio nuevo este mes. Pareto: 10/25 = 40%.
  await expect(card).toContainText('anchura 1 patrocinio nuevo');
  await expect(card).toContainText('el 20% más fuerte genera el 40% del PB');
});

test('el formulario del equipo arma el lead por WhatsApp con todos los datos', async ({ page }) => {
  await page.goto('/formulario-equipo.html');
  await page.fill('#f-nombre', 'Carla');
  await page.fill('#f-negocio', 'Panadería El Sol');
  await page.check('input[name="motivo_principal"][value="Recuperar tiempo y energía"]');
  await page.fill('#f-proyecto', 'Delegar el salón de té.');
  await page.fill('#f-email', 'carla@elsol.com');

  await page.evaluate(() => {
    window.__abiertos = [];
    window.open = url => { window.__abiertos.push(String(url)); return { closed: false, close() {}, location: { set href(v) { window.__abiertos.push(String(v)); } } }; };
  });
  await page.click('.send');
  const url = (await page.evaluate(() => window.__abiertos))[0] || '';
  expect(url).toContain('wa.me/5493515638843');
  expect(decodeURIComponent(url)).toContain('Nuevo lead');
  expect(decodeURIComponent(url)).toContain('Panadería El Sol');
  expect(decodeURIComponent(url)).toContain('Recuperar tiempo y energía');
});
