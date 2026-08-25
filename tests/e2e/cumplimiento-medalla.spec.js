const { test, expect } = require('@playwright/test');

/* Medalla del día (v345): el mazo del distribuidor trae la tarjeta
   "Cumplimiento del día" y muestra su lugar en el podio de "primero en
   completar", consultado al backend. */

const USER_ID = '11111111-1111-4111-8111-111111111111';

function tokenFor(sub) {
  const h = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${h}.${p}.firma`;
}

const dias = n => new Date(Date.now() + n * 86400000).toISOString();
const ddmmyyyy = n => {
  const d = new Date(Date.now() + n * 86400000);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

// Compró hace 6 meses justos: le toca retrolavado hoy → hay acciones hoy.
const USUARIOS = [
  { id: 1, usuario: 'TABORDA, JULIAN', telf: '3515551001', domicilio: 'Ancona 4231', localidad: 'Córdoba',
    producto: 'SEN4BLAC', cp: '5000', fCompra: ddmmyyyy(-182), fVenceRaw: ddmmyyyy(400), fVence: dias(400), estado: 'vigente' }
];

async function entrar(page, { posicion = { completo: false, posicion: 0, total_completos: 3, total_cuentas: 5 } } = {}) {
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
    if (url.pathname === '/rest/v1/rpc/appi_mi_posicion_cumplimiento') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([posicion]) });
    return route.fulfill({ status: 200, headers: cors, body: '[]' });
  });
  await page.route('**/tile.openstreetmap.org/**', route => route.abort());
  await page.addInitScript(([u]) => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('appi_tarjetas_auto', '0');
    localStorage.setItem('tutoVisto_v2', '1');
    localStorage.setItem('usuarios_garantias', JSON.stringify(u));
  }, [USUARIOS]);
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
}

test('el mazo trae la tarjeta de cumplimiento cuando hay acciones hoy', async ({ page }) => {
  await entrar(page);
  const cats = await page.evaluate(() => window.APPIHomeTarjetas.armarTarjetas().map(t => t.cat));
  expect(cats).toContain('cumplimiento');
  const card = await page.evaluate(() => window.APPIHomeTarjetas.armarTarjetas().find(t => t.cat === 'cumplimiento'));
  expect(card.titulo).toBe('Cumplimiento del día');
  expect(card.html).toContain('ht-cump-pos');
});

test('la tarjeta muestra el podio consultado al backend', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.APPIHomeTarjetas.abrir());
  await expect(page.locator('.ht-cump-pos')).toContainText('Ya completaron 3 personas', { timeout: 10000 });
  await expect(page.locator('.ht-cump-pos')).toContainText('todavía estás a tiempo');
});

test('cuando ya completaste y vas primero, se ve la medalla de oro', async ({ page }) => {
  await entrar(page, { posicion: { completo: true, posicion: 1, total_completos: 4, total_cuentas: 6 } });
  // Marcar la única acción del día como hecha para quedar completado.
  await page.evaluate(() => window.APPIMensajes.marcarAccion('retro', window.usuariosTodosActual()[0], 'hecha', true));
  await page.evaluate(() => window.APPIHomeTarjetas.abrir());
  await expect(page.locator('.ht-cump-pos')).toContainText('🥇 Completaste en el puesto #1 de 4', { timeout: 10000 });
});
