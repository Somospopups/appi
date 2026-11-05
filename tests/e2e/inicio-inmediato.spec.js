const { test, expect, devices } = require('@playwright/test');
const fs = require('fs');

const USER_ID = '33333333-3333-4333-8333-333333333333';
const HEAVY = /vendor\/(?:tesseract\/|pdf(?:\.worker)?\.min\.js|zxing\.min\.js|xlsx\.full\.min\.js|html2canvas\.min\.js|jspdf\.umd\.min\.js|svg2pdf\.umd\.min\.js|jszip\.min\.js)/i;

function tokenFor(sub) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${header}.${payload}.firma`;
}

function profile(overrides = {}) {
  return {
    user_id: USER_ID,
    dip: '02-9802014', sucursal: '02', numero_distribuidor: '9802014',
    nombre: 'María Local', socio_nombre: null, rol: 'usuario', activo: true,
    debe_cambiar_password: false, membresia_meses: 1,
    membresia_inicio: new Date().toISOString(),
    membresia_vence: new Date(Date.now() + 30 * 86400000).toISOString(),
    ...overrides
  };
}

async function prepararSesionLocal(page, options = {}) {
  const accessToken = tokenFor(USER_ID);
  const localProfile = profile();
  await page.addInitScript(({ accessToken, localProfile, equipo }) => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('tutoVisto_v2', '1');
    localStorage.setItem('appi_tarjetas_auto', '0');
    localStorage.setItem('equipoData', JSON.stringify(equipo));
    localStorage.setItem('appi_cal_tareas_v1_' + localProfile.user_id, JSON.stringify({
      '2026-11-05': [{ id: 1, texto: 'Dato guardado en el teléfono', done: false, hora: '09:00' }]
    }));
    localStorage.setItem('appi_auth_session_v1', JSON.stringify({
      session: {
        access_token: accessToken, refresh_token: 'refresh-local', token_type: 'bearer',
        expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: { id: localProfile.user_id }
      },
      profile: localProfile,
      lastValidatedAt: Date.now(),
      offline: false
    }));
  }, {
    accessToken,
    localProfile,
    equipo: options.equipo || {
      titular: { dip: '02-9802014', nombre: 'María Local', categoria: 'DC' },
      personas: [{ id: 0, nombre: 'PLANILLA_DIFERIDA', codigo: '02-9802014', nivel: 0, cat: 'DC', hijos: [] }]
    }
  });
  await page.route('**/auth-config.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: "window.APPI_AUTH={enabled:true,url:'https://mock.supabase.co',anonKey:'anon-key-publica-de-prueba-1234567890',distributorEmailDomain:'distribuidores.appi.invalid',adminLogin:{username:'popups',email:'admin@appi.invalid'},loginAliases:{},offlineDays:7};"
  }));
  return { accessToken, localProfile };
}

function instalarMockRemoto(page, gate, remoteProfile) {
  const state = { profileRequested: false, profileFulfilled: false };
  page.route('https://mock.supabase.co/**', async route => {
    const url = new URL(route.request().url());
    const headers = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
    if (url.pathname === '/rest/v1/appi_perfiles') {
      state.profileRequested = true;
      if (gate) await gate;
      state.profileFulfilled = true;
      return route.fulfill({ status: 200, headers, body: JSON.stringify([remoteProfile]) });
    }
    return route.fulfill({ status: 200, headers, body: '[]' });
  });
  return state;
}

test('la sesión local dibuja Home antes de la validación remota y sin vendors pesados', async ({ page }) => {
  await prepararSesionLocal(page);
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const remote = instalarMockRemoto(page, gate, profile());
  const heavyRequests = [];
  page.on('request', request => { if (HEAVY.test(request.url())) heavyRequests.push(request.url()); });

  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#homeLimpio')).toBeVisible({ timeout: 2500 });
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
  await expect.poll(() => remote.profileRequested).toBe(true);
  expect(remote.profileFulfilled).toBe(false);
  expect(heavyRequests, `Vendor pesado antes de Home: ${heavyRequests.join(', ')}`).toEqual([]);
  await expect(page.locator('#homeLimpio')).toContainText('Dato guardado en el teléfono');

  release();
  await expect.poll(() => remote.profileFulfilled).toBe(true);
  await expect(page.locator('#homeLimpio')).toContainText('Dato guardado en el teléfono');
});

test('un bloqueo remoto tardío vuelve a cerrar la app aunque Home ya haya dibujado', async ({ page }) => {
  await prepararSesionLocal(page);
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const remote = instalarMockRemoto(page, gate, profile({ activo: false }));

  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#homeLimpio')).toBeVisible({ timeout: 2500 });
  await expect.poll(() => remote.profileRequested).toBe(true);
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);

  release();
  await expect(page.locator('#lockScreen')).not.toHaveClass(/hidden/, { timeout: 5000 });
  await expect(page.locator('#loginError')).toContainText('desactivada');
});

test('la planilla grande se analiza después del primer dibujo y no reconstruye Home', async ({ page }) => {
  await page.addInitScript(() => {
    const nativeParse = JSON.parse;
    JSON.parse = function(value, ...rest) {
      if (typeof value === 'string' && value.includes('PLANILLA_DIFERIDA')) {
        window.__appiPlanillaParse = {
          homeDibujado: !!document.getElementById('homeLimpio'),
          nodoHome: document.getElementById('homeLimpio') || null
        };
      }
      return nativeParse.call(this, value, ...rest);
    };
  });
  const personas = Array.from({ length: 3500 }, (_, i) => ({
    id: i, nivel: i ? 1 : 0, nombre: i ? `Persona ${i}` : 'PLANILLA_DIFERIDA',
    codigo: `02-${9802014 + i}`, cat: i % 2 ? 'D' : 'DC', hijos: []
  }));
  await prepararSesionLocal(page, { equipo: {
    titular: { dip: '02-9802014', nombre: 'María Local', categoria: 'DC' }, personas
  } });
  const remote = instalarMockRemoto(page, null, profile());

  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#homeLimpio')).toBeVisible({ timeout: 2500 });
  const original = await page.locator('#homeLimpio').evaluate(node => {
    window.__appiHomeOriginal = node;
    return true;
  });
  expect(original).toBe(true);
  await expect.poll(() => page.evaluate(() => !!window.__appiPlanillaParse)).toBe(true);
  await expect.poll(() => page.evaluate(() => window.__appiEquipoHydrationPending === false)).toBe(true);
  const result = await page.evaluate(() => ({
    homeDibujado: window.__appiPlanillaParse.homeDibujado,
    mismoNodo: window.__appiHomeOriginal === document.getElementById('homeLimpio'),
    pending: window.__appiEquipoHydrationPending
  }));
  expect(result.homeDibujado).toBe(true);
  expect(result.mismoNodo).toBe(true);
  expect(result.pending).toBe(false);
  await expect.poll(() => remote.profileFulfilled).toBe(true);
});

test('el shell crítico excluye OCR, Excel, PDF y escaneo; quedan bajo demanda', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const stock = fs.readFileSync('stock-personal.js', 'utf8');
  const sw = fs.readFileSync('service-worker.js', 'utf8');
  const appShell = sw.match(/const APP_SHELL = \[([\s\S]*?)\];/)[1];
  const optional = sw.match(/const OPTIONAL_SHELL = \[([\s\S]*?)\];/)[1];
  const heavyFiles = [
    'pdf.min.js', 'pdf.worker.min.js', 'zxing.min.js', 'xlsx.full.min.js',
    'html2canvas.min.js', 'jspdf.umd.min.js', 'svg2pdf.umd.min.js', 'jszip.min.js'
  ];
  for (const file of heavyFiles) {
    expect(appShell).not.toContain(file);
    expect(html).not.toMatch(new RegExp(`<script[^>]+${file.replace(/\./g, '\\.')}`, 'i'));
    expect(optional).toContain(file);
  }
  expect(appShell).not.toContain('tesseract');
  expect(html).not.toMatch(/<script[^>]+tesseract/i);
  expect(stock).toContain('function cargarMotorOCR()');
  expect(stock).toContain("s.src = base + 'tesseract.min.js'");
  expect(sw).toContain("if(event.data.type==='APPI_WARM_OPTIONAL')");
});

test.describe('PWA Android fría y caliente', () => {
  const android = { ...devices['Pixel 5'] };
  delete android.defaultBrowserType;
  test.use({ ...android, serviceWorkers: 'allow' });

  test('la instalación fría guarda el shell y la reapertura caliente funciona offline', async ({ page, context }) => {
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
      }
    });
    await expect.poll(() => page.evaluate(async () => {
      const cache = await caches.open('appi-v919-tarjetas-primero');
      return !!(await cache.match('./index.html')) && !!(await cache.match('./data-sync.js'));
    }), { timeout: 15000 }).toBe(true);
    const optionalBeforeWarm = await page.evaluate(async () => {
      const cache = await caches.open('appi-v919-tarjetas-primero');
      return !!(await cache.match('./vendor/xlsx.full.min.js')) || !!(await cache.match('./vendor/pdf.min.js'));
    });
    expect(optionalBeforeWarm).toBe(false);

    await context.setOffline(true);
    const started = Date.now();
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 7000 });
    expect(Date.now() - started).toBeLessThan(7000);
    await expect(page.locator('#bootScreen, #homeLimpio, #lockScreen').first()).toBeVisible();
  });
});
