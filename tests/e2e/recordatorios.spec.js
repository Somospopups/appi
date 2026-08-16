const { test, expect } = require('@playwright/test');
const fs = require('fs');
const vm = require('vm');

const USER_ID = '11111111-1111-4111-8111-111111111111';
const CONTACT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function tokenFor(sub) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${header}.${payload}.firma`;
}

// Ejecuta el Service Worker real dentro de un contexto controlado.
function workerHandlers(extraSelf = {}) {
  const source = fs.readFileSync('service-worker.js', 'utf8');
  const handlers = {};
  const shown = [];
  const context = {
    URL,
    Promise,
    console,
    self: {
      location: { href: 'https://somospopups.github.io/appi/service-worker.js?v=216' },
      registration: {
        scope: 'https://somospopups.github.io/appi/',
        showNotification: async (title, options) => { shown.push({ title, options }); }
      },
      addEventListener: (type, handler) => { handlers[type] = handler; },
      ...extraSelf
    }
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  return { handlers, shown };
}

function pushEvent(payload) {
  let work;
  return {
    event: {
      data: { json: () => payload },
      waitUntil: promise => { work = promise; }
    },
    done: () => work
  };
}

test('el resumen diario y la presentación generan notificaciones propias', async () => {
  const { handlers, shown } = workerHandlers();

  const summary = pushEvent({
    type: 'daily_summary',
    title: 'Buen día, María',
    body: 'Tenés 2 seguimientos vencidos y 1 presentación.',
    url: './?gestion=hoy'
  });
  handlers.push(summary.event);
  await summary.done();

  const presentation = pushEvent({
    type: 'presentation_reminder',
    title: 'Presentación en 30 minutos',
    body: 'Carolina Martínez · 15:30',
    url: `./?gestion=contacto&contacto=${CONTACT_ID}`,
    contacto_id: CONTACT_ID
  });
  handlers.push(presentation.event);
  await presentation.done();

  const call = pushEvent({
    type: 'call_request',
    title: 'Llamada desde APPI',
    body: 'Llamar a Carolina · 3515551234',
    command_id: '34343434-3434-4434-8434-343434343434'
  });
  handlers.push(call.event);
  await call.done();

  expect(shown).toHaveLength(3);

  // Cada aviso usa su propia etiqueta: un recordatorio nunca pisa una llamada.
  const tags = shown.map(item => item.options.tag);
  expect(new Set(tags).size).toBe(3);
  expect(tags[0]).toBe('appi-daily-summary');
  expect(tags[1]).toBe(`appi-presentation-${CONTACT_ID}`);

  // Solo la llamada bloquea la pantalla hasta que la persona responde.
  expect(shown[0].options.requireInteraction).toBe(false);
  expect(shown[1].options.requireInteraction).toBe(false);
  expect(shown[2].options.requireInteraction).toBe(true);

  // Todos conservan la identidad visual de APPI.
  for (const item of shown) {
    expect(item.options.icon).toBe('./icon-192.png');
    expect(item.options.badge).toBe('./notification-badge.png');
  }

  expect(shown[0].options.actions[0].title).toBe('Ver Mi Gestión');
  expect(shown[1].options.actions[0].title).toBe('Ver contacto');
  expect(shown[2].options.actions[0].title).toBe('Abrir llamada');
  expect(shown[1].options.data.contacto_id).toBe(CONTACT_ID);
});

test('al tocar un recordatorio la ventana existente recibe el destino', async () => {
  const messages = [];
  const existingClient = {
    url: 'https://somospopups.github.io/appi/',
    postMessage: message => messages.push(message),
    focus: async function () { this.focused = true; return this; }
  };
  const { handlers } = workerHandlers({
    clients: {
      matchAll: async () => [existingClient],
      openWindow: async () => null
    }
  });

  let work;
  handlers.notificationclick({
    action: 'open',
    notification: {
      data: {
        type: 'presentation_reminder',
        contacto_id: CONTACT_ID,
        url: `./?gestion=contacto&contacto=${CONTACT_ID}`
      },
      close: () => {}
    },
    waitUntil: promise => { work = promise; }
  });
  await work;

  expect(existingClient.focused).toBe(true);
  expect(messages[0]).toMatchObject({
    type: 'APPI_OPEN_COMMAND',
    notification: 'presentation_reminder',
    contacto_id: CONTACT_ID
  });
  expect(messages[0].url).toBe(`https://somospopups.github.io/appi/?gestion=contacto&contacto=${CONTACT_ID}`);
});

test('un enlace de recordatorio abre Mi Gestión y el contacto avisado', async ({ page }) => {
  const now = new Date().toISOString();
  const accessToken = tokenFor(USER_ID);
  const profile = {
    user_id: USER_ID, username: null, dip: '02-9802014', sucursal: '02', numero_distribuidor: '9802014',
    nombre: 'María Pérez', socio_nombre: null, rol: 'usuario', activo: true, debe_cambiar_password: false,
    membresia_meses: 1, membresia_inicio: now, membresia_vence: new Date(Date.now() + 30 * 86400000).toISOString()
  };
  const contact = {
    id: CONTACT_ID, user_id: USER_ID, encuesta_id: null, tipo: 'manual',
    nombre: 'Carolina Martínez', telefono: '351 555 1234', telefono_normalizado: '3515551234',
    relacion: '', zona: 'Córdoba', referido_por: '', estado: 'presentacion', notas: '',
    proximo_contacto: new Date().toISOString().slice(0, 10), proximo_contacto_hora: '15:30:00',
    ultimo_contacto: null, cantidad_origenes: 1, metadata: {}, created_at: now, updated_at: now
  };

  const nativeDialogs = [];
  page.on('dialog', dialog => { nativeDialogs.push(dialog.type()); dialog.dismiss(); });

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
    if (url.pathname === '/rest/v1/appi_gestion_contactos') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([contact]) });
    if (url.pathname === '/rest/v1/appi_gestion_actividades') return route.fulfill({ status: request.method() === 'GET' ? 200 : 204, headers: cors, body: request.method() === 'GET' ? '[]' : '' });
    if (url.pathname === '/functions/v1/dispositivo-puente') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ devices: [] }) });
    return route.fulfill({ status: 200, headers: cors, body: '[]' });
  });

  await page.setViewportSize({ width: 1280, height: 820 });
  await page.addInitScript(() => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('tutoVisto_v2', '1');
  });

  // El enlace equivale a tocar la notificación con APPI cerrada.
  await page.goto(`/index.html?gestion=contacto&contacto=${CONTACT_ID}`, { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);

  await expect(page.locator('#view-gestion')).toHaveClass(/active/, { timeout: 15000 });
  await expect(page.locator('#gestionDrawer h2')).toHaveText('Carolina Martínez', { timeout: 15000 });

  // La hora cargada se ofrece para editar y viaja al backend.
  await expect(page.locator('#gestionNextTime')).toHaveValue('15:30');

  // El destino consumido no queda pegado en la URL ni se repite al recargar.
  await expect.poll(() => page.evaluate(() => new URL(location.href).searchParams.get('gestion'))).toBeNull();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('appi_gestion_notificacion_pendiente'))).toBeNull();

  expect(nativeDialogs).toEqual([]);
});

test('el backend de recordatorios protege el envío masivo', async ({ request }) => {
  const source = fs.readFileSync('supabase/functions/recordatorios-gestion/index.ts', 'utf8');

  // Solo el cron con la clave de servicio puede disparar envíos.
  expect(source).toContain('token !== serviceRole');
  expect(source).toContain("json({ error: 'No autorizado.' }, 401)");

  // El aviso se reserva antes de enviarse: nunca se duplica.
  expect(source).toContain('appi_recordatorios_enviados');
  expect(source).toContain("error.code !== '23505'");

  // Endpoints muertos se limpian igual que en el puente de llamadas.
  expect(source).toContain('status === 404 || status === 410');
  expect(source).toContain('America/Argentina/Buenos_Aires');

  const sql = fs.readFileSync('SUPABASE_RECORDATORIOS.sql', 'utf8');
  expect(sql).toContain('proximo_contacto_hora');
  expect(sql).toContain('appi_pendientes_resumen');
  expect(sql).toContain('appi_presentaciones_proximas');
  expect(sql).toContain("cron.schedule(\n  'appi-resumen-diario',\n  '0 12 * * *'");
  // La clave de servicio se lee desde Vault, nunca queda escrita en el repo.
  expect(sql).toContain('vault.decrypted_secrets');
  expect(sql).not.toMatch(/eyJ[A-Za-z0-9_-]{20,}/);

  // El cliente pide la hora nueva al sincronizar.
  const client = await request.get('/gestion-client.js');
  expect(client.ok()).toBe(true);
  const clientSource = await client.text();
  expect(clientSource).toContain('proximo_contacto_hora');
  expect(clientSource).toContain('applyNotificationIntent');
  expect(clientSource).toContain('needsPersonChoice');
});
