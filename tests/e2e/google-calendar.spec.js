const { test, expect } = require('@playwright/test');

// v819 — Calendario de Google: conexión OAuth+PKCE (mockeado), calendario
// "APPI", eventos de cumpleaños y garantías por vencer, resync idempotente.

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GAPI = 'https://www.googleapis.com/calendar/v3';

const p2 = (n) => String(n).padStart(2, '0');
function iso(d) { return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); }

// 2 usuarios: cumpleaños en +10 días y garantía que vence en +15 días.
function usuariosSeed() {
  const hoy = new Date();
  const c = new Date(hoy); c.setDate(c.getDate() + 10);
  const v = new Date(hoy); v.setDate(v.getDate() + 15);
  return {
    cIso: iso(c), vIso: iso(v),
    lista: [
      { id: 0, usuario: 'MARTA CUMPLE', telf: '1', domicilio: 'd', cp: '1', localidad: 'l', producto: 'PSA Senik', serie: '', fCompra: '', fVenceRaw: '', fVence: null, email: '', dipReasignado: '', reasignado: false, estado: 'vigente', nombreNorm: 'marta', cumpleRaw: p2(c.getDate()) + '/' + p2(c.getMonth() + 1) },
      { id: 1, usuario: 'JOSE VENCE', telf: '2', domicilio: 'd', cp: '1', localidad: 'l', producto: 'PSA Domus', serie: '', fCompra: '', fVenceRaw: '', fVence: new Date(v.getFullYear(), v.getMonth(), v.getDate()).toISOString(), email: '', dipReasignado: '', reasignado: false, estado: 'porVencer', nombreNorm: 'jose' }
    ]
  };
}

function mockGoogle({ page, cuentas }) {
  cuentas.auth = 0; cuentas.token = 0; cuentas.list = 0; cuentas.calCrear = 0; cuentas.evCrear = 0; cuentas.evBorrar = 0;
  page.route('https://accounts.google.com/o/oauth2/v2/auth*', (route) => {
    cuentas.auth++;
    const u = new URL(route.request().url());
    const state = u.searchParams.get('state');
    return route.fulfill({ status: 302, headers: { location: 'http://127.0.0.1:4174/?code=FAKECODE&state=' + (state || 'x') } });
  });
  page.route(TOKEN_URL, (route) => {
    cuentas.token++;
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ access_token: 'at-1', refresh_token: 'rt-1', expires_in: 3600 }) });
  });
  page.route('https://www.googleapis.com/calendar/v3/users/me/calendarList', (route) => {
    cuentas.list++;
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [] }) });
  });
  page.route('**/calendars', (route) => {
    if (route.request().method() === 'POST') {
      cuentas.calCrear++;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'cal-appi', summary: 'APPI' }) });
    }
    return route.fallback();
  });
  page.route(GAPI + '/calendars/cal-appi/events', (route) => {
    const req = route.request();
    if (req.method() === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [] }) });
    }
    if (req.method() === 'POST') {
      cuentas.evCrear++;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'ev-' + cuentas.evCrear }) });
    }
    if (req.method() === 'DELETE') {
      cuentas.evBorrar++;
      return route.fulfill({ status: 204, body: '' });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
}

test('conecta con Google, crea el calendario APPI y programa los eventos', async ({ page }) => {
  const s = usuariosSeed();
  await page.addInitScript((data) => {
    localStorage.setItem('usuarios_garantias', JSON.stringify(data.lista));
    localStorage.setItem('appi_google_v1', JSON.stringify({ clientId: 'abc123.apps.googleusercontent.com' }));
  }, s);
  const cuentas = {};
  mockGoogle({ page, cuentas });
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.APPIGoogle && window.usuariosU && window.usuariosU.length === 2, null, { timeout: 20000 });
  await page.evaluate(() => {
    const lock = document.getElementById('lockScreen');
    if (lock) lock.classList.add('hidden');
    const boot = document.getElementById('bootScreen');
    if (boot) { boot.classList.add('gone'); boot.remove(); }
    document.body.classList.remove('appi-login-abierto');
  });

  // El botón "Conectar mi Google" está en la vista de Notificaciones
  await page.evaluate(() => window.showView('view-recordatorios'));
  await page.waitForTimeout(900);
  await expect(page.locator('#recGoogleConnect')).toBeVisible({ timeout: 10000 });

  // Tocar Conectar → redirección a Google (mockeada) → vuelta con ?code=…
  await page.locator('#recGoogleConnect').click();

  // Redirección a Google (mockeada) → vuelta con ?code=… → intercambio → conectado
  await expect.poll(() => page.evaluate(() => window.APPIGoogle.estado().connected), { timeout: 30000 }).toBe(true);
  expect(cuentas.auth).toBe(1);
  expect(cuentas.token).toBe(1);
  // La URL queda limpia (sin ?code)
  expect(await page.evaluate(() => window.location.search)).not.toContain('code');

  // La sync automática crea el calendario APPI y los 2 eventos
  await expect.poll(() => page.evaluate(() => window.APPIGoogle.estado().total), { timeout: 30000 }).toBe(2);
  expect(cuentas.calCrear).toBe(1);
  expect(cuentas.evCrear).toBe(2);
  const st = await page.evaluate(() => JSON.parse(localStorage.getItem('appi_google_v1')));
  expect(st.calendar_id).toBe('cal-appi');
  expect(st.events.map((e) => e.tipo).sort()).toEqual(['cumple', 'vence']);
});

test('re-sincronizar no duplica: adopta los eventos existentes', async ({ page }) => {
  const s = usuarioSeedConIds();
  await page.addInitScript((data) => {
    localStorage.setItem('usuarios_garantias', JSON.stringify(data.lista));
    localStorage.setItem('appi_google_v1', JSON.stringify({
      clientId: 'abc123.apps.googleusercontent.com',
      connected: true,
      access_token: 'at-x',
      refresh_token: 'rt-x',
      expires_at: Date.now() + 3600 * 1000,
      calendar_id: 'cal-appi',
      last_sync: Date.now(),
      events: [
        { id: 'ev-1', key: data.keys.cumple, tipo: 'cumple' },
        { id: 'ev-2', key: data.keys.vence, tipo: 'vence' }
      ]
    }));
  }, s);
  const cuentas = { list: 0, calCrear: 0, evCrear: 0, evBorrar: 0, evListar: 0 };
  page.route('https://www.googleapis.com/calendar/v3/users/me/calendarList', (route) => {
    cuentas.list++;
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [{ summary: 'APPI', id: 'cal-appi' }] }) });
  });
  page.route(GAPI + '/calendars/cal-appi/events', (route) => {
    if (route.request().method() === 'GET') {
      cuentas.evListar++;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        items: [
          { id: 'ev-1', start: { date: s.cIso }, summary: '🎂 Marta' },
          { id: 'ev-2', start: { date: s.vIso }, summary: '📅 Vence: Jose (PSA Domus)' }
        ]
      }) });
    }
    if (route.request().method() === 'POST') { cuentas.evCrear++; return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'ev-x' }) }); }
    return route.fulfill({ status: 204, body: '' });
  });
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.APPIGoogle && window.usuariosU && window.usuariosU.length === 2, null, { timeout: 20000 });
  const r = await page.evaluate(async () => window.APPIGoogle.sincronizar());
  expect(r.ok).toBe(true);
  expect(r.creados).toBe(0);
  expect(r.total).toBe(2);
  expect(cuentas.evCrear).toBe(0);
  expect(cuentas.calCrear).toBe(0);
});

function usuarioSeedConIds() {
  const s = usuariosSeed();
  return {
    cIso: s.cIso, vIso: s.vIso, lista: s.lista,
    keys: {
      cumple: 'cumple:0:' + p2(new Date(s.cIso).getDate()) + '-' + p2(new Date(s.cIso).getMonth() + 1),
      vence: 'vence:1:' + s.vIso
    }
  };
}

test('la UI es de un toque: Client ID quemado, sin input, botón directo', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem('appi_google_v1');
    localStorage.setItem('usuarios_garantias', '[]');
  });
  const vistos = {};
  page.route('https://accounts.google.com/o/oauth2/v2/auth*', (route) => {
    const u = new URL(route.request().url());
    vistos.clientId = u.searchParams.get('client_id');
    const state = u.searchParams.get('state');
    return route.fulfill({ status: 302, headers: { location: 'http://127.0.0.1:4174/?code=FAKECODE&state=' + (state || 'x') } });
  });
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.APPIGoogle, null, { timeout: 20000 });
  await page.evaluate(() => {
    const lock = document.getElementById('lockScreen');
    if (lock) lock.classList.add('hidden');
    const boot = document.getElementById('bootScreen');
    if (boot) { boot.classList.add('gone'); boot.remove(); }
    document.body.classList.remove('appi-login-abierto');
  });
  await page.waitForTimeout(2400);
  await page.evaluate(() => window.showView('view-recordatorios'));
  await page.waitForTimeout(900);

  // v820: ya NO hay input de Client ID ni botones Guardar/Quitar
  await expect(page.locator('#recGoogleClientId')).toHaveCount(0);
  await expect(page.locator('#recGoogleSave')).toHaveCount(0);
  await expect(page.locator('#recGoogleQuitar')).toHaveCount(0);

  // El Client ID quemado está presente en el estado, sin tocar nada
  const es = await page.evaluate(() => window.APPIGoogle.estado());
  expect(es.clientId).toMatch(/\.apps\.googleusercontent\.com$/);
  expect(es.clientId).toBe(await page.evaluate(() => window.APPIGoogle.clientIdDefault));
  expect(es.connected).toBe(false);

  // El botón de un toque salta directo a Google con el ID quemado
  await expect(page.locator('#recGoogleConnect')).toBeVisible({ timeout: 10000 });
  await page.locator('#recGoogleConnect').click();
  await expect(async () => { expect(vistos.clientId).toBeTruthy(); }, { timeout: 15000 }).toPass();
  expect(vistos.clientId).toBe(es.clientId);
});
