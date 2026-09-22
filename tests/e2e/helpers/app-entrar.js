// Helpers de autenticación para specs E2E. No es un archivo .spec.js: puede
// compartirse sin que Playwright intente cargar pruebas dentro de otras pruebas.
const USER_ID = '11111111-1111-4111-8111-111111111113';

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

const USUARIOS = [
  { id: 1, usuario: 'GOMEZ, ANA MARIA', telf: '3515551001', localidad: 'Alta Gracia', producto: 'PSA SENIOR 4',
    fCompra: ddmmyyyy(-300), fVenceRaw: ddmmyyyy(15), fVence: dias(15), estado: 'vigente' },
  { id: 2, usuario: 'RUIZ, ROBERTO', telf: '3515551002', localidad: 'Villa Allende', producto: 'PSA VERO',
    fCompra: ddmmyyyy(-800), fVenceRaw: ddmmyyyy(-40), fVence: dias(-40), estado: 'vencida' },
  { id: 3, usuario: 'DIAZ, CAROLINA', telf: '3515551003', localidad: 'Centro', producto: 'SODA BURBY',
    fCompra: ddmmyyyy(-700), fVenceRaw: ddmmyyyy(-200), fVence: dias(-200), estado: 'vencida' }
];

async function entrar(page, { usuarios = USUARIOS } = {}) {
  const accessToken = tokenFor(USER_ID);
  const profile = {
    user_id: USER_ID, username: null, dip: '02-9802014', sucursal: '02', numero_distribuidor: '9802014',
    nombre: 'María Pérez', socio_nombre: null, rol: 'usuario', activo: true, debe_cambiar_password: false,
    membresia_meses: 1, membresia_inicio: new Date().toISOString(), membresia_vence: new Date(Date.now() + 30 * 86400000).toISOString()
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
  await page.addInitScript((items) => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('appi_tarjetas_auto', '0');
    localStorage.setItem('tutoVisto_v2', '1');
    localStorage.setItem('usuarios_garantias', JSON.stringify(items));
  }, usuarios);
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await page.locator('#lockScreen').waitFor({ state: 'hidden' });
  await page.evaluate(() => window.showView('view-home'));
}

module.exports = { USER_ID, dias, ddmmyyyy, USUARIOS, entrar };
