const { test, expect } = require('@playwright/test');

const USER_ID = '11111111-1111-4111-8111-111111111111';

function tokenFor(sub) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${header}.${payload}.firma`;
}

async function mockBase(page, profile, { profileDelay = 0, profileGate = null } = {}) {
  const accessToken = tokenFor(USER_ID);
  await page.route('**/auth-config.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: "window.APPI_AUTH={enabled:true,url:'https://mock.supabase.co',anonKey:'anon-key-publica-de-prueba',distributorEmailDomain:'distribuidores.appi.invalid',adminLogin:{username:'popups',email:'admin-popups@appi.invalid'},loginAliases:{},offlineDays:7};"
  }));
  await page.route('https://mock.supabase.co/**', async route => {
    const url = new URL(route.request().url());
    const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
    if (url.pathname === '/auth/v1/token') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ access_token: accessToken, refresh_token: 'r', expires_in: 3600, user: { id: USER_ID } }) });
    if (url.pathname === '/rest/v1/appi_perfiles') {
      if (profileGate) await profileGate;
      if (profileDelay) await new Promise(resolve => setTimeout(resolve, profileDelay));
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([profile]) });
    }
    if (url.pathname === '/functions/v1/dispositivo-puente') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ devices: [] }) });
    return route.fulfill({ status: 200, headers: cors, body: '[]' });
  });
}

test('el arranque completa una secuencia fluida antes de mostrar el acceso', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const now = new Date().toISOString();
  await mockBase(page, {
    user_id: USER_ID, username: null, dip: '02-9802014', sucursal: '02', numero_distribuidor: '9802014',
    nombre: 'María Pérez', socio_nombre: null, rol: 'usuario', activo: true, debe_cambiar_password: false,
    membresia_meses: 1, membresia_inicio: now, membresia_vence: new Date(Date.now() + 30 * 86400000).toISOString()
  });
  await page.addInitScript(() => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('appi_tarjetas_auto', '0');
    localStorage.setItem('tutoVisto_v2', '1');
  });

  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  const boot = page.locator('#bootScreen');
  await expect(boot).toBeVisible();
  const firstTop = await page.locator('.boot-water').evaluate(el => el.getBoundingClientRect().top);

  await page.waitForTimeout(650);
  await expect(boot).toBeVisible();
  await expect(boot).not.toHaveClass(/leaving/);
  await expect(page.locator('.boot-message-label')).toHaveText('Preparando tu negocio');
  const secondTop = await page.locator('.boot-water').evaluate(el => el.getBoundingClientRect().top);
  expect(secondTop).toBeLessThan(firstTop - 40);

  await expect.poll(
    () => page.evaluate(() => document.getElementById('bootScreen')?.dataset.phase || 'removed'),
    { timeout: 2500, intervals: [30, 50, 80] }
  ).toBe('ready');
  await expect(page.locator('.boot-message-label')).toHaveText('Todo listo');
  await expect(page.locator('.boot-ready-mark')).toBeVisible();
  await expect(boot).toHaveCount(0, { timeout: 1600 });
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#eef4ff');

  const timing = await page.evaluate(() => ({
    start: window.__appiBootStartedAt,
    exit: window.__appiBootRemovedAt
  }));
  expect(timing.exit - timing.start).toBeGreaterThanOrEqual(1850);
  expect(timing.exit - timing.start).toBeLessThan(3000);
});

test('con una conexión lenta el arranque espera sin cortarse', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const now = new Date().toISOString();
  const profile = {
    user_id: USER_ID, username: null, dip: '02-9802014', sucursal: '02', numero_distribuidor: '9802014',
    nombre: 'María Pérez', socio_nombre: null, rol: 'usuario', activo: true, debe_cambiar_password: false,
    membresia_meses: 1, membresia_inicio: now, membresia_vence: new Date(Date.now() + 30 * 86400000).toISOString()
  };
  let releaseProfile;
  const profileGate = new Promise(resolve => { releaseProfile = resolve; });
  await mockBase(page, profile, { profileGate });
  await page.addInitScript(([uid, perf]) => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('appi_tarjetas_auto', '0');
    localStorage.setItem('tutoVisto_v2', '1');
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const payload = btoa(JSON.stringify({ sub: uid, exp: Math.floor(Date.now() / 1000) + 3600 })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    localStorage.setItem('appi_auth_session_v1', JSON.stringify({ session: { access_token: header + '.' + payload + '.firma', expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'r' }, profile: perf, lastValidatedAt: Date.now() }));
  }, [USER_ID, profile]);

  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => performance.now() - window.__appiBootStartedAt >= 1750);
  await expect(page.locator('#bootScreen')).toBeVisible();
  await expect(page.locator('#bootScreen')).toHaveAttribute('data-phase', 'loading');
  await expect(page.locator('#bootScreen')).not.toHaveClass(/leaving/);

  releaseProfile();
  await expect(page.locator('#view-home')).toHaveClass(/active/, { timeout: 5000 });
  await expect(page.locator('#bootScreen')).toHaveCount(0, { timeout: 2000 });
  const duration = await page.evaluate(() => window.__appiBootRemovedAt - window.__appiBootStartedAt);
  expect(duration).toBeGreaterThan(1750);
});

test('sin pantallazos: boot mientras elegís persona, y directo al home', async ({ page }) => {
  const now = new Date().toISOString();
  const profile = {
    user_id: USER_ID, username: null, dip: '02-9802014', sucursal: '02', numero_distribuidor: '9802014',
    nombre: 'María Pérez', socio_nombre: 'Juan Pérez', rol: 'usuario', activo: true, debe_cambiar_password: false,
    membresia_meses: 1, membresia_inicio: now, membresia_vence: new Date(Date.now() + 30 * 86400000).toISOString()
  };
  await mockBase(page, profile);
  await page.addInitScript(([uid, perf]) => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('appi_tarjetas_auto', '0');
    localStorage.setItem('tutoVisto_v2', '1');
    // Sesión guardada: el arranque real que antes flasheaba home y login.
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const payload = btoa(JSON.stringify({ sub: uid, exp: Math.floor(Date.now() / 1000) + 3600 })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    localStorage.setItem('appi_auth_session_v1', JSON.stringify({ session: { access_token: header + '.' + payload + '.firma', expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'r' }, profile: perf, lastValidatedAt: Date.now() }));
  }, [USER_ID, profile]);

  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });

  // Mientras se elige la persona: el login NO se ve, el boot tapa todo.
  await expect(page.locator('#personChoiceOverlay')).toBeVisible();
  await expect(page.locator('#lockScreen')).toBeHidden();

  await page.locator('[data-person-type="titular"]').click();

  // Después de elegir: sin boot y directo al home listo, sin pasar por el login.
  await expect(page.locator('#view-home')).toHaveClass(/active/);
  await expect(page.locator('#homeLimpio')).toBeVisible();
  await expect(page.locator('#homeGreeting')).toHaveText('Hola María 👋');
  await expect(page.locator('#personChoiceOverlay')).toBeHidden();
  await expect(page.locator('#bootScreen')).toHaveCount(0, { timeout: 3000 });
  await expect(page.locator('#lockScreen')).toBeHidden();
});

test('en el celular pageshow no saltea titular/socio ni deja un home a medias', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const now = new Date().toISOString();
  const profile = {
    user_id: USER_ID, username: null, dip: '02-9802014', sucursal: '02', numero_distribuidor: '9802014',
    nombre: 'María Pérez', socio_nombre: 'Juan Pérez', rol: 'usuario', activo: true, debe_cambiar_password: false,
    membresia_meses: 1, membresia_inicio: now, membresia_vence: new Date(Date.now() + 30 * 86400000).toISOString()
  };
  await mockBase(page, profile);
  await page.route('https://mock.supabase.co/**', async route => {
    await new Promise(resolve => setTimeout(resolve, 500));
    await route.fallback();
  });
  await page.addInitScript(([uid, perf]) => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('appi_tarjetas_auto', '0');
    localStorage.setItem('tutoVisto_v2', '1');
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const payload = btoa(JSON.stringify({ sub: uid, exp: Math.floor(Date.now() / 1000) + 3600 })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    localStorage.setItem('appi_auth_session_v1', JSON.stringify({ session: { access_token: header + '.' + payload + '.firma', expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'r' }, profile: perf, lastValidatedAt: Date.now() }));
  }, [USER_ID, profile]);

  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#personChoiceOverlay')).toBeVisible();
  await expect(page.locator('#personChoiceOverlay')).toContainText('¿Quién sos?');
  await expect(page.locator('[data-person-type="titular"]')).toContainText('María Pérez');
  await expect(page.locator('[data-person-type="socio"]')).toContainText('Juan Pérez');
  await expect(page.locator('#lockScreen')).toBeHidden();
  expect(await page.evaluate(() => APPIAuth.needsPersonChoice())).toBe(true);

  await page.evaluate(() => {
    try { window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })); }
    catch (e) { window.dispatchEvent(new Event('pageshow')); }
    if (typeof forzarScrollLibre === 'function') forzarScrollLibre();
    document.dispatchEvent(new Event('visibilitychange'));
  });

  await expect(page.locator('#personChoiceOverlay')).toBeVisible();
  await expect(page.locator('[data-person-type="socio"]')).toBeVisible();
  expect(await page.evaluate(() => {
    const overlay = document.getElementById('personChoiceOverlay');
    return {
      parent: overlay && overlay.parentElement && overlay.parentElement.tagName,
      hidden: overlay && overlay.hidden,
      display: overlay ? getComputedStyle(overlay).display : 'none',
      needs: window.APPIAuth.needsPersonChoice()
    };
  })).toEqual({ parent: 'BODY', hidden: false, display: 'flex', needs: true });

  await page.locator('[data-person-type="socio"]').click();
  expect(await page.evaluate(() => {
    const overlay = document.getElementById('personChoiceOverlay');
    const home = document.getElementById('homeLimpio');
    const greeting = document.getElementById('homeGreeting');
    const covered = !!(overlay && !overlay.hidden);
    const listo = !!(home && greeting && /Hola Juan/.test(greeting.textContent || ''));
    return { covered, listo, title: overlay && overlay.querySelector('h2') && overlay.querySelector('h2').textContent };
  })).toEqual({ covered: true, listo: false, title: 'Entrando…' });
  await expect(page.locator('#personChoiceOverlay')).toBeHidden();
  await expect(page.locator('#view-home')).toHaveClass(/active/);
  await expect(page.locator('#homeGreeting')).toHaveText('Hola Juan 👋');
  await expect(page.locator('#homeLimpio')).toBeVisible();
  await expect(page.locator('#lockScreen')).toBeHidden();
});

test('las pantallas nuevas tienen su ayuda y abre al tocarla', async ({ page }) => {
  const now = new Date().toISOString();
  await mockBase(page, {
    user_id: USER_ID, username: null, dip: '02-9802014', sucursal: '02', numero_distribuidor: '9802014',
    nombre: 'María Pérez', socio_nombre: null, rol: 'usuario', activo: true, debe_cambiar_password: false,
    membresia_meses: 1, membresia_inicio: now, membresia_vence: new Date(Date.now() + 30 * 86400000).toISOString()
  });
  await page.addInitScript(() => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('appi_tarjetas_auto', '0');
    localStorage.setItem('tutoVisto_v2', '1');
  });
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);

  for (const [abrir, boton, titulo] of [
    ['openOcho()', '#btnHelpOcho', 'Los 8 Pasos'],
    ['openSuenos()', '#btnHelpSuenos', 'Escalera de Sueños'],
    ['openDemo()', '#btnHelpDemo', 'Coach Comercial de Demo']
  ]) {
    await page.evaluate(a => window[a.replace('()', '')](), abrir);
    await page.locator(boton).click();
    await expect(page.locator('#modalOverlay')).toBeVisible();
    await expect(page.locator('#modalTitle')).toHaveText(titulo);
    await page.locator('#modalOverlay .btn-ok').click({ force: true });
    await page.waitForTimeout(400);
  }
});
