const { test, expect } = require('@playwright/test');

// Ruleta PSA (v801): ruleta animada con sonido que entrega tareas del
// día con los contactos reales de la base. En tests se fuerza el
// segmento de caída (girar(idx, {dur})) para que sea determinista.

const USER_ID = '11111111-1111-4111-8111-111111111112';

function tokenFor(sub) {
  const h = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${h}.${p}.firma`;
}
const dias = n => new Date(Date.now() + n * 86400000).toISOString();

const BASE = [
  { id: 1, usuario: 'GOMEZ, ANA MARIA', telf: '3515551001', localidad: 'Alta Gracia', producto: 'PSA SENIOR 4',
    fCompra: dias(-400), fVenceRaw: '01/01/2026', fVence: dias(200), estado: 'vigente' },
  { id: 2, usuario: 'RUIZ, ROBERTO', telf: '3515551002', localidad: 'Villa Allende', producto: 'PSA VERO',
    fCompra: dias(-800), fVenceRaw: '01/01/2026', fVence: dias(90), estado: 'vigente' },
  { id: 3, usuario: 'DIAZ, CAROLINA', telf: '3515551003', localidad: 'Centro', producto: 'SODA BURBY',
    fCompra: dias(-100), fVenceRaw: '01/01/2026', fVence: dias(120), estado: 'vigente' },
  { id: 4, usuario: 'LOPEZ, SUSENA', telf: '3515551004', localidad: 'Centro', producto: 'PSA VERO',
    fCompra: dias(-50), fVenceRaw: '01/01/2026', fVence: dias(300), estado: 'vigente' }
];

async function entrar(page, users = BASE) {
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
  await page.route('**/tile.openstreetmap.org/**', route => route.abort());
  await page.addInitScript(([u]) => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('appi_tarjetas_auto', '0');
    localStorage.setItem('tutoVisto_v2', '1');
    localStorage.setItem('usuarios_garantias', JSON.stringify(u));
  }, [users]);
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
  await page.evaluate(() => window.showView('view-usuarios'));
  await expect(page.locator('#usuariosBtnZonas')).toBeVisible();
}

test('la ruleta aparece en el panel Hoy y abre la rueda', async ({ page }) => {
  await entrar(page);
  const cta = page.locator('.ruleta-cta');
  await expect(cta).toBeVisible({ timeout: 10000 });
  await expect(cta).toContainText('Ruleta PSA');
  await cta.click();
  await expect(page.locator('#ruletaOv')).toHaveClass(/open/);
  await expect(page.locator('#ruletaCanvas')).toBeVisible();
});

test('girar cae en el segmento forzado (premio "ya fue mucho")', async ({ page }) => {
  await entrar(page);
  const idx = await page.evaluate(() => window.APPIRuleta.armarSegmentos().findIndex(s => s.kind === 'mucho'));
  expect(idx).toBeGreaterThanOrEqual(0);
  await page.evaluate((i) => { window.APPIRuleta.abrir(); window.APPIRuleta.girar(i, { dur: 500 }); }, idx);
  await expect(page.locator('#ruletaCard')).toHaveClass(/show/, { timeout: 15000 });
  await expect(page.locator('#ruletaCard')).toContainText('Ya fue mucho por hoy');
  await expect(page.locator('#ruletaCard')).toContainText('ya hiciste lo suficiente');
});

test('el premio de 3 mensajes elige 3 contactos con su botón de WhatsApp', async ({ page }) => {
  await entrar(page);
  const idx = await page.evaluate(() => window.APPIRuleta.armarSegmentos().findIndex(s => s.kind === 'msg3'));
  await page.evaluate((i) => { window.APPIRuleta.abrir(); window.APPIRuleta.girar(i, { dur: 500 }); }, idx);
  await expect(page.locator('#ruletaCard')).toHaveClass(/show/, { timeout: 15000 });
  await expect(page.locator('#ruletaCard')).toContainText('3 mensajes');
  const personas = page.locator('#ruletaCard .ruleta-persona');
  await expect(personas).toHaveCount(3);
  const was = page.locator('#ruletaCard [data-ruleta-wa]');
  expect(await was.count()).toBeGreaterThanOrEqual(3);
  // Cada botón armó un wa.me con el saludo.
  const url = await was.first().getAttribute('data-ruleta-wa');
  expect(decodeURIComponent(url)).toMatch(/Hola/);
});

test('"Ya la hice" suma una ⭐ al día y persiste', async ({ page }) => {
  await entrar(page);
  const idx = await page.evaluate(() => window.APPIRuleta.armarSegmentos().findIndex(s => s.kind === 'stock'));
  await page.evaluate((i) => { window.APPIRuleta.abrir(); window.APPIRuleta.girar(i, { dur: 500 }); }, idx);
  await expect(page.locator('#ruletaCard')).toHaveClass(/show/, { timeout: 15000 });
  await page.locator('[data-ruleta-ok]').click();
  await expect(page.locator('#ruletaOv')).not.toHaveClass(/open/);
  const st = await page.evaluate(() => window.APPIRuleta.estadoHoy());
  expect(st.tareas).toBe(1);
  // La CTA lo refleja.
  await expect(page.locator('.ruleta-cta')).toContainText('Hoy: 1 ⭐', { timeout: 5000 });
  // Persistió en localStorage.
  const raw = await page.evaluate(() => {
    const k = Object.keys(localStorage).find(x => x.startsWith('appi_ruleta_v1_'));
    return k ? JSON.parse(localStorage.getItem(k)) : null;
  });
  expect(raw).toBeTruthy();
  const hoy = Object.values(raw)[0];
  expect(hoy.tareas).toBe(1);
});

test('con una base chica la ruleta sigue funcionando (tareas genéricas)', async ({ page }) => {
  // Un solo cliente: los segmentos de demo no encuentran a nadie y
  // ofrecen la tarea genérica, sin romperse.
  await entrar(page, BASE.slice(0, 1));
  const idx = await page.evaluate(() => window.APPIRuleta.armarSegmentos().findIndex(s => s.kind === 'demo'));
  await page.evaluate((i) => { window.APPIRuleta.abrir(); window.APPIRuleta.girar(i, { dur: 500 }); }, idx);
  await expect(page.locator('#ruletaCard')).toHaveClass(/show/, { timeout: 15000 });
  await expect(page.locator('#ruletaCard')).toContainText('un cliente');
  expect(await page.locator('#ruletaCard .ruleta-persona').count()).toBe(0);
});
