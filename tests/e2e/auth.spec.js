const { test, expect } = require('@playwright/test');

const USER_A = '11111111-1111-4111-8111-111111111111';
const USER_B = '22222222-2222-4222-8222-222222222222';
const USER_ADMIN = '33333333-3333-4333-8333-333333333333';

function tokenFor(sub) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600, email: `${sub}@test` })).toString('base64url');
  return `${header}.${payload}.firma`;
}

async function mockSupabase(page) {
  const cloud = new Map([[USER_A, new Map()], [USER_B, new Map()], [USER_ADMIN, new Map()]]);
  const passwordChanges = [];
  const pendingRequests = [];
  let whatsapp = '5493515551234';
  let offline = false;
  const profiles = {
    [USER_A]: { user_id: USER_A, username: null, dip: '02-9802014', sucursal: '02', numero_distribuidor: '9802014', nombre: 'Distribuidor A', rol: 'usuario', activo: true },
    [USER_B]: { user_id: USER_B, username: null, dip: '03-1234567', sucursal: '03', numero_distribuidor: '1234567', nombre: 'Distribuidor B', rol: 'usuario', activo: true },
    [USER_ADMIN]: { user_id: USER_ADMIN, username: 'popups', dip: null, sucursal: null, numero_distribuidor: null, nombre: 'POPUPS', rol: 'admin', activo: true }
  };
  const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };

  await page.route('**/auth-config.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: `window.APPI_AUTH={enabled:true,url:'https://mock.supabase.co',anonKey:'anon-key-publica-de-prueba-1234567890',distributorEmailDomain:'distribuidores.appi.invalid',adminLogin:{username:'popups',email:'admin-popups@appi.invalid'},loginAliases:{},offlineDays:7};`
  }));

  await page.route('https://mock.supabase.co/**', async route => {
    const request = route.request();
    if (offline) return route.abort('internetdisconnected');
    const url = new URL(request.url());
    const authorization = request.headers().authorization || '';
    const access = authorization.replace(/^Bearer\s+/i, '');
    let sub = '';
    try { sub = JSON.parse(Buffer.from(access.split('.')[1] || '', 'base64url').toString()).sub || ''; } catch (_) {}

    if (url.pathname === '/auth/v1/token' && url.searchParams.get('grant_type') === 'password') {
      const body = request.postDataJSON();
      const target = body.email.startsWith('dip-02-9802014@') ? USER_A : body.email.startsWith('dip-03-1234567@') ? USER_B : body.email === 'admin-popups@appi.invalid' ? USER_ADMIN : '';
      if (!target || body.password !== 'Clave1234') return route.fulfill({ status: 400, headers: cors, body: JSON.stringify({ error: 'Credenciales incorrectas' }) });
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ access_token: tokenFor(target), refresh_token: `refresh-${target}`, expires_in: 3600, token_type: 'bearer', user: { id: target } }) });
    }

    if (url.pathname === '/auth/v1/user' && request.method() === 'PUT') {
      passwordChanges.push(request.postDataJSON().password);
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ id: sub }) });
    }
    if (url.pathname === '/auth/v1/logout') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' }, body: '' });

    if (url.pathname === '/functions/v1/solicitud-cuenta') {
      const body = request.postDataJSON();
      if (body.action === 'config') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ whatsapp }) });
      const created = { id: `request-${pendingRequests.length+1}`, nombre: body.nombre, dip: '04-7654321', sucursal: '04', numero_distribuidor: '7654321', telefono: String(body.telefono).replace(/\D/g,''), estado: 'pendiente', created_at: new Date().toISOString() };
      pendingRequests.push(created);
      return route.fulfill({ status: 201, headers: cors, body: JSON.stringify({ ok: true, request_id: created.id, whatsapp_url: `https://wa.me/${whatsapp}?text=solicitud` }) });
    }

    if (url.pathname === '/functions/v1/admin-distribuidores') {
      const body = request.postDataJSON();
      if (sub !== USER_ADMIN) return route.fulfill({ status: 403, headers: cors, body: JSON.stringify({ error: 'Se requiere una cuenta administradora.' }) });
      if (body.action === 'list') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ users: Object.values(profiles) }) });
      if (body.action === 'list_requests') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ requests: pendingRequests }) });
      if (body.action === 'get_settings') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ whatsapp }) });
      if (body.action === 'set_whatsapp') { whatsapp=body.numero; return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ whatsapp }) }); }
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ ok: true }) });
    }

    if (url.pathname === '/rest/v1/appi_perfiles') {
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify(profiles[sub] ? [profiles[sub]] : []) });
    }

    if (url.pathname === '/rest/v1/appi_datos' && request.method() === 'GET') {
      const rows = [...(cloud.get(sub) || new Map()).entries()].map(([data_key, data]) => ({ data_key, data, updated_at: new Date().toISOString() }));
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify(rows) });
    }

    if (url.pathname === '/rest/v1/appi_datos' && request.method() === 'POST') {
      const rows = request.postDataJSON();
      for (const row of rows) cloud.get(row.user_id).set(row.data_key, row.data);
      return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' }, body: '' });
    }

    if (url.pathname === '/rest/v1/appi_datos' && request.method() === 'DELETE') {
      cloud.get(sub)?.delete(url.searchParams.get('data_key')?.replace(/^eq\./, ''));
      return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' }, body: '' });
    }

    return route.fulfill({ status: 404, headers: cors, body: JSON.stringify({ error: 'Ruta simulada no encontrada' }) });
  });
  return { cloud, passwordChanges, pendingRequests, setOffline(value) { offline = value; } };
}

async function login(page, dip) {
  await page.locator('#distributorInput').fill(dip);
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#view-home')).toHaveClass(/active/);
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
}

test('cada distribuidor sincroniza y ve únicamente sus datos', async ({ page }) => {
  const backend = await mockSupabase(page);
  const { cloud } = backend;
  await page.goto('/index.html', { waitUntil: 'networkidle' });

  await expect(page.locator('#distributorLoginPanel')).toBeVisible();
  await expect(page.locator('#legacyActivationPanel')).toBeHidden();
  await login(page, '029802014');
  await page.evaluate(() => APPIAuth.changePassword('NuevaClave2026!'));
  expect(backend.passwordChanges).toEqual(['NuevaClave2026!']);

  await page.evaluate(() => {
    localStorage.setItem('presu_2026_7', JSON.stringify({ ingresos: 1000, propietario: 'A' }));
  });
  await page.evaluate(() => APPIDataSync.syncNow(true));
  expect(cloud.get(USER_A).has('presu_2026_7')).toBe(true);

  backend.setOffline(true);
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('#view-home')).toHaveClass(/active/);
  await expect(page.locator('#distributorLoginPanel')).toBeHidden();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('presu_2026_7')).propietario)).toBe('A');
  backend.setOffline(false);

  await page.evaluate(() => APPIDataSync.logoutAndLock({ removeCache: false }));
  expect(await page.evaluate(() => localStorage.getItem('presu_2026_7'))).toBeNull();
  await page.reload({ waitUntil: 'networkidle' });
  await login(page, '03-1234567');

  expect(await page.evaluate(() => localStorage.getItem('presu_2026_7'))).toBeNull();
  expect(cloud.get(USER_B).has('presu_2026_7')).toBe(false);
  expect(await page.evaluate(() => APPIAuth.currentProfile().dip)).toBe('03-1234567');
});

test('una solicitud nueva abre WhatsApp y queda pendiente', async ({ page }) => {
  const backend=await mockSupabase(page);
  await page.goto('/index.html',{waitUntil:'networkidle'});
  await page.evaluate(()=>{window.__lastOpen='';window.open=url=>{window.__lastOpen=url;return null}});
  await page.locator('#loginTabCreate').click();
  await page.locator('#requestFullName').fill('Persona Nueva');
  await page.locator('#requestDip').fill('04-7654321');
  await page.locator('#requestPhone').fill('3515551234');
  await page.locator('#btnRequestAccount').click();
  await expect(page.locator('#requestAccountSuccess')).toContainText('pendiente');
  expect(backend.pendingRequests).toHaveLength(1);
  expect(await page.evaluate(()=>window.__lastOpen)).toContain('wa.me');
});

test('POPUPS ingresa por el candado y no tiene distribuidor asociado', async ({ page }) => {
  await mockSupabase(page);
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.evaluate(()=>{window.open=()=>null});
  await page.locator('#loginTabCreate').click();
  await page.locator('#requestFullName').fill('Solicitud Pendiente');
  await page.locator('#requestDip').fill('04-7654321');
  await page.locator('#requestPhone').fill('3515551234');
  await page.locator('#btnRequestAccount').click();
  await expect(page.locator('#requestAccountSuccess')).toContainText('pendiente');
  await page.locator('#btnAdminLoginOpen').click();
  await expect(page.locator('#adminLoginOverlay')).toBeVisible();
  await page.locator('#adminLoginPassword').fill('Clave1234');
  await page.locator('#btnAdminLoginSubmit').click();
  await expect(page.locator('#view-admin')).toHaveClass(/active/);
  await expect(page.locator('#adminPanelIdentity')).toContainText('popups');
  await expect(page.locator('#adminUserList')).toContainText('Distribuidor A');
  await expect(page.locator('#adminPendingList')).toContainText('Solicitud Pendiente');
  await expect(page.locator('#adminStatPending')).toHaveText('1');
  const profile=await page.evaluate(()=>APPIAuth.currentProfile());
  expect(profile).toMatchObject({username:'popups',dip:null,rol:'admin'});
  await expect(page.locator('#btnAdminPanelLogout')).toBeVisible();
  await page.locator('#btnAdminPanelPassword').click();
  await expect(page.locator('#accountNewPassword')).toBeVisible();
});
