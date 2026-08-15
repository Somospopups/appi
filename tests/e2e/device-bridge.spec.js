const { test, expect } = require('@playwright/test');

const USER_ID = '11111111-1111-4111-8111-111111111111';
const DEVICE_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const DEVICE_KEY = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const CONTACT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const PAIR_TOKEN = '99999999-9999-4999-8999-999999999999';

function tokenFor(sub) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${header}.${payload}.firma`;
}

test('el Service Worker escucha notificaciones y su apertura', async ({ request }) => {
  const response = await request.get('/service-worker.js');
  expect(response.ok()).toBe(true);
  const source = await response.text();
  expect(source).toContain("addEventListener('push'");
  expect(source).toContain("addEventListener('notificationclick'");
  expect(source).toContain('call_request');
});

test('vincula por QR y envía una llamada de la PC al teléfono', async ({ page }) => {
  const nativeDialogs = [];
  const bridgeCalls = [];
  page.on('dialog', dialog => { nativeDialogs.push(dialog.type()); dialog.dismiss(); });
  const now = new Date().toISOString();
  const accessToken = tokenFor(USER_ID);
  const profile = {
    user_id: USER_ID, username: null, dip: '02-9802014', sucursal: '02', numero_distribuidor: '9802014',
    nombre: 'María Pérez', rol: 'usuario', activo: true, debe_cambiar_password: false,
    membresia_meses: 1, membresia_inicio: now, membresia_vence: new Date(Date.now() + 30 * 86400000).toISOString()
  };
  const device = {
    id: DEVICE_ID, device_key: DEVICE_KEY, nombre: 'Mi teléfono Android', plataforma: 'android',
    notificaciones: true, activo: true, last_seen: now, created_at: now
  };
  let deviceLinked = true;
  const contact = {
    id: CONTACT_ID, user_id: USER_ID, encuesta_id: null, tipo: 'referido', nombre: 'Carolina Martínez',
    telefono: '351 555 1234', telefono_normalizado: '3515551234', relacion: 'Amiga', zona: 'Córdoba', referido_por: 'Persona Encuestada',
    estado: 'nuevo', notas: '', proximo_contacto: null, ultimo_contacto: null, cantidad_origenes: 1,
    metadata: {}, created_at: now, updated_at: now
  };

  await page.route('**/auth-config.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: "window.APPI_AUTH={enabled:true,url:'https://mock.supabase.co',anonKey:'anon-key-publica-de-prueba-1234567890',distributorEmailDomain:'distribuidores.appi.invalid',adminLogin:{username:'popups',email:'admin-popups@appi.invalid'},loginAliases:{},offlineDays:7};"
  }));
  await page.route('https://mock.supabase.co/**', route => {
    const request = route.request();
    const url = new URL(request.url());
    const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
    if (url.pathname === '/auth/v1/token') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ access_token: accessToken, refresh_token: 'refresh', expires_in: 3600, user: { id: USER_ID } }) });
    if (url.pathname === '/rest/v1/appi_perfiles') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([profile]) });
    if (url.pathname === '/rest/v1/appi_datos') return route.fulfill({ status: 200, headers: cors, body: '[]' });
    if (url.pathname === '/rest/v1/appi_gestion_contactos') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([contact]) });
    if (url.pathname === '/rest/v1/appi_encuestas') return route.fulfill({ status: 200, headers: cors, body: '[]' });
    if (url.pathname === '/rest/v1/appi_gestion_actividades') return route.fulfill({ status: request.method() === 'GET' ? 200 : 204, headers: cors, body: request.method() === 'GET' ? '[]' : '' });
    if (url.pathname === '/functions/v1/dispositivo-puente') {
      const body = request.postDataJSON();
      bridgeCalls.push(body);
      if (body.action === 'list_devices') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ devices: deviceLinked ? [device] : [] }) });
      if (body.action === 'remove_device') {
        deviceLinked = false;
        return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ ok: true, device_id: DEVICE_ID }) });
      }
      if (body.action === 'create_pairing') return route.fulfill({ status: 201, headers: cors, body: JSON.stringify({ pairing: { id: '12121212-1212-4212-8212-121212121212', token: PAIR_TOKEN, codigo: '321654', expires_at: new Date(Date.now() + 300000).toISOString() } }) });
      if (body.action === 'pair_status') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ claimed: false, expired: false, cancelled: false, device: null }) });
      if (body.action === 'send_call') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ ok: true, command_id: '34343434-3434-4434-8434-343434343434', device, expires_at: new Date(Date.now() + 120000).toISOString() }) });
      if (body.action === 'ping') return route.fulfill({ status: 200, headers: cors, body: '{"ok":true}' });
      return route.fulfill({ status: 400, headers: cors, body: JSON.stringify({ error: 'Acción simulada no disponible' }) });
    }
    return route.fulfill({ status: 404, headers: cors, body: JSON.stringify({ error: 'Ruta simulada no encontrada' }) });
  });

  await page.setViewportSize({ width: 1280, height: 820 });
  await page.addInitScript(() => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('tutoVisto_v2', '1');
  });
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
  await expect.poll(() => page.evaluate(() => APPIAuth.currentProfile()?.dip || '')).toBe('02-9802014');

  await page.evaluate(() => APPIDeviceBridge.openManager());
  await expect(page.locator('#appiDeviceOverlay')).toBeVisible();
  await expect(page.locator('#appiDeviceList')).toContainText('Mi teléfono Android');
  await expect(page.locator('[data-remove-device]')).toHaveText('Desvincular dispositivo');
  await page.locator('#appiCreatePair').click();
  await expect(page.locator('.appi-pair-qr svg')).toBeVisible();
  await expect(page.locator('.appi-pair-code')).toContainText('321 654');
  await page.locator('#appiDeviceClose').click();

  await page.evaluate(() => openMiGestion());
  await expect(page.locator('.gestion-contact')).toHaveCount(1);
  const callButton = page.locator(`[data-contact-channel="llamada"][data-contact-id="${CONTACT_ID}"]`).first();
  await expect(callButton).toContainText('Llamar en teléfono');
  await callButton.click();
  await expect(page.locator('#appiDialogTitle')).toHaveText('Llamada enviada');

  const sent = bridgeCalls.find(item => item.action === 'send_call');
  expect(sent).toMatchObject({
    device_id: DEVICE_ID,
    contact_id: CONTACT_ID,
    nombre: 'Carolina Martínez',
    telefono: '351 555 1234'
  });
  await page.locator('#appiDialogOk').click();

  await page.evaluate(() => APPIDeviceBridge.openManager());
  const unlink = page.locator('[data-remove-device]');
  await expect(unlink).toHaveText('Desvincular dispositivo');
  await unlink.click();
  await expect(page.locator('#appiDialogTitle')).toHaveText('Desvincular dispositivo');
  const layerOrder = await page.evaluate(() => ({
    manager: Number(getComputedStyle(document.getElementById('appiDeviceOverlay')).zIndex),
    dialog: Number(getComputedStyle(document.querySelector('.appi-dialog-overlay')).zIndex)
  }));
  expect(layerOrder.dialog).toBeGreaterThan(layerOrder.manager);
  await page.locator('#appiDialogOk').click();
  await expect(page.locator('#appiDialogTitle')).toHaveText('Dispositivo desvinculado');
  await expect(page.locator('[data-remove-device]')).toHaveCount(0);
  await page.locator('#appiDialogOk').click();
  expect(bridgeCalls.find(item => item.action === 'remove_device')).toMatchObject({ device_id: DEVICE_ID });
  expect(nativeDialogs).toEqual([]);
});
