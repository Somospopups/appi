const { test, expect } = require('@playwright/test');
const { entrar } = require('./helpers/app-entrar.js');

const USER_ID = '22222222-2222-4222-8222-222222222222';
function tokenFor(sub) {
  const h = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${h}.${p}.firma`;
}

async function prepararPrimerIngreso(page) {
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
    const headers = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
    if (url.pathname === '/auth/v1/token') return route.fulfill({ status: 200, headers, body: JSON.stringify({ access_token: accessToken, refresh_token: 'r', expires_in: 3600, user: { id: USER_ID } }) });
    if (url.pathname === '/rest/v1/appi_perfiles') return route.fulfill({ status: 200, headers, body: JSON.stringify([profile]) });
    if (url.pathname === '/functions/v1/dispositivo-puente') return route.fulfill({ status: 200, headers, body: JSON.stringify({ devices: [] }) });
    return route.fulfill({ status: 200, headers, body: '[]' });
  });
  await page.route('**/tile.openstreetmap.org/**', route => route.abort());
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('__primer_ingreso_preparado')) {
      [
        'tutoVisto_v2', 'welcomeSeen', 'appi_onboarding_v1', 'appsi_psa_creds',
        'appi_notif_listo_v1', 'appi_notif_popup_later', 'appi_avisos_ok'
      ].forEach(key => localStorage.removeItem(key));
      sessionStorage.setItem('__primer_ingreso_preparado', '1');
    }
    localStorage.setItem('appi_tarjetas_auto', '0');
    let currentPermission = 'default';
    class FakeNotification {
      constructor(title, options) { window.__ultimaNotificacionAPPI = { title, options }; }
      static get permission() { return currentPermission; }
      static async requestPermission() { currentPermission = 'granted'; return currentPermission; }
    }
    window.Notification = FakeNotification;
  });
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await page.locator('#lockScreen').waitFor({ state: 'hidden' });
  await page.locator('#appiOnboardingOverlay').waitFor({ state: 'visible' });
}

async function llegarHastaEleccion(page) {
  const overlay = page.locator('#appiOnboardingOverlay');
  await expect(overlay.getByRole('heading', { name: /Bienvenida a APPI/ })).toBeVisible();
  await overlay.getByRole('button', { name: 'Empezar paso a paso' }).click();
  await expect(overlay.getByRole('heading', { name: 'Primero, dejemos APPI a mano' })).toBeVisible();
  return overlay;
}

test.describe('Primer ingreso acompañado v898', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('recorre iPhone, guarda MI PSA y activa avisos reales sin popups superpuestos', async ({ page }) => {
    await prepararPrimerIngreso(page);
    const overlay = await llegarHastaEleccion(page);

    await overlay.locator('[data-aob="iphone"]').click();
    await expect(overlay.getByRole('heading', { name: 'Cómo crear el acceso directo en iPhone' })).toBeVisible();
    await expect(overlay.getByText('Agregar a pantalla de inicio')).toBeVisible();
    await overlay.locator('[data-aob="iphone-done"]').click();

    await expect(overlay.getByRole('heading', { name: 'Ahora, conectemos tu cuenta de MI PSA' })).toBeVisible();
    await expect(page.locator('#aobCenter')).toHaveValue('02');
    await expect(page.locator('#aobNumber')).toHaveValue('9802014');
    await page.locator('#aobPassword').fill('ClavePSA-segura');
    await overlay.getByRole('button', { name: 'Guardar y continuar' }).click();

    await expect(overlay.getByRole('heading', { name: 'Elegí si querés recibir avisos' })).toBeVisible();
    await expect(page.locator('#aobTasks')).toBeChecked();
    await expect(page.locator('#aobWarranty')).toBeChecked();
    await overlay.getByRole('button', { name: 'Continuar y activar avisos' }).click();

    await expect(overlay.getByRole('heading', { name: '¡Listo, María!' })).toBeVisible();
    await expect(overlay.getByText('Acceso directo creado')).toBeVisible();
    await expect(overlay.getByText('MI PSA conectada')).toBeVisible();
    await expect(overlay.getByText('Avisos activados')).toBeVisible();
    await overlay.getByRole('button', { name: 'Entrar a APPI' }).click();
    await expect(overlay).toBeHidden();

    const stored = await page.evaluate(() => ({
      onboarding: JSON.parse(localStorage.getItem('appi_onboarding_v1')),
      psa: JSON.parse(localStorage.getItem('appsi_psa_creds')),
      rec: JSON.parse(localStorage.getItem('appi_recordatorios_v1')),
      notif: localStorage.getItem('appi_notif_listo_v1'),
      tuto: localStorage.getItem('tutoVisto_v2')
    }));
    expect(stored.onboarding).toMatchObject({ done: true, shortcut: true, psa: true, notifications: true });
    expect(stored.psa).toMatchObject({ center: '02', number: '9802014', password: 'ClavePSA-segura', remember: true });
    expect(stored.rec.hab).toMatchObject({ manana: true, vence: true, pb_mov: false });
    expect(stored.notif).toBe('1');
    expect(stored.tuto).toBe('1');
    await expect(page.locator('#appiNotifPop')).toHaveCount(0);
    await expect(page.locator('#modalOverlay')).not.toHaveClass(/open/);
  });

  test('al tocar Android abre inmediatamente la instalación y evita la guía si el navegador lo permite', async ({ page }) => {
    await prepararPrimerIngreso(page);
    const overlay = await llegarHastaEleccion(page);

    await page.evaluate(() => {
      window.__instalacionAndroidAbierta = 0;
      const event = new Event('beforeinstallprompt', { cancelable: true });
      event.prompt = async () => { window.__instalacionAndroidAbierta += 1; };
      event.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' });
      window.dispatchEvent(event);
    });

    await overlay.locator('[data-aob="android"]').click();
    await expect(overlay.getByRole('heading', { name: 'Ahora, conectemos tu cuenta de MI PSA' })).toBeVisible();
    await expect(overlay.getByRole('heading', { name: 'Cómo crear el acceso directo en Android' })).toHaveCount(0);
    expect(await page.evaluate(() => window.__instalacionAndroidAbierta)).toBe(1);
  });

  test('muestra la guía Android y deja lo pendiente en una sola tarjeta del Home', async ({ page }) => {
    await prepararPrimerIngreso(page);
    const overlay = await llegarHastaEleccion(page);

    await overlay.locator('[data-aob="android"]').click();
    await expect(overlay.getByRole('heading', { name: 'Cómo crear el acceso directo en Android' })).toBeVisible();
    await expect(overlay.getByText('Instalar aplicación')).toBeVisible();
    await overlay.getByRole('button', { name: 'No pude hacerlo; continuar por ahora' }).click();

    await overlay.getByRole('button', { name: 'Continuar sin conectar por ahora' }).click();
    await overlay.getByRole('button', { name: 'Continuar sin avisos por ahora' }).click();
    await expect(overlay.getByText('Acceso directo pendiente')).toBeVisible();
    await expect(overlay.getByText('MI PSA pendiente')).toBeVisible();
    await expect(overlay.getByText('Avisos pendientes')).toBeVisible();
    await overlay.getByRole('button', { name: 'Entrar a APPI' }).click();

    const card = page.locator('#appiOnboardingPending');
    await expect(card).toBeVisible();
    await expect(card).toContainText('crear el acceso directo');
    await expect(card).toContainText('conectar MI PSA');
    await expect(card).toContainText('activar los avisos');
    await expect(page.locator('#appiNotifPop')).toHaveCount(0);
    await expect(page.locator('#modalOverlay')).not.toHaveClass(/open/);

    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('#lockScreen').waitFor({ state: 'hidden' });
    await expect(page.locator('#appiOnboardingOverlay')).toHaveCount(0);
    await expect(page.locator('#appiOnboardingPending')).toBeVisible();
    await page.locator('#appiOnboardingPending button').click();
    await expect(page.locator('#appiOnboardingOverlay')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Primero, dejemos APPI a mano' })).toBeVisible();
  });

  test('Mi perfil permite volver a revisar todos los primeros pasos desde la bienvenida', async ({ page }) => {
    await entrar(page);
    await page.evaluate(() => window.abrirCuentaDesdeMenu());

    const button = page.locator('#btnAccountPrimerosPasos');
    await expect(button).toBeVisible();
    await expect(button).toContainText('Revisar primeros pasos');
    await button.click();

    const overlay = page.locator('#appiOnboardingOverlay');
    await expect(overlay).toBeVisible();
    await expect(overlay.getByRole('heading', { name: /Bienvenida a APPI/ })).toBeVisible();
    await expect(page.locator('#modalOverlay')).not.toHaveClass(/open/);
  });

  test('una cuenta suspendida o vencida recibe los primeros pasos una sola vez cuando vuelve a activarse', async ({ page }) => {
    let bloqueo = 'disabled';
    const accessToken = tokenFor(USER_ID);
    const perfil = () => ({
      user_id: USER_ID, username: null, dip: '02-9802014', sucursal: '02', numero_distribuidor: '9802014',
      nombre: 'María Pérez', socio_nombre: null, rol: 'usuario', activo: bloqueo !== 'disabled', debe_cambiar_password: false,
      membresia_meses: 1,
      membresia_inicio: new Date().toISOString(),
      membresia_vence: bloqueo === 'missing' ? null : new Date(Date.now() + (bloqueo === 'expired' ? -30 : 30) * 86400000).toISOString()
    });

    await page.route('**/auth-config.js', route => route.fulfill({
      contentType: 'application/javascript',
      body: "window.APPI_AUTH={enabled:true,url:'https://mock.supabase.co',anonKey:'anon-key-publica-de-prueba',distributorEmailDomain:'distribuidores.appi.invalid',adminLogin:{username:'popups',email:'admin-popups@appi.invalid'},loginAliases:{},offlineDays:7};"
    }));
    await page.route('https://mock.supabase.co/**', route => {
      const url = new URL(route.request().url());
      const headers = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
      if (url.pathname === '/auth/v1/token') return route.fulfill({ status: 200, headers, body: JSON.stringify({ access_token: accessToken, refresh_token: 'r', expires_in: 3600, user: { id: USER_ID } }) });
      if (url.pathname === '/rest/v1/appi_perfiles') return route.fulfill({ status: 200, headers, body: JSON.stringify([perfil()]) });
      return route.fulfill({ status: 200, headers, body: '[]' });
    });
    await page.addInitScript(() => {
      localStorage.setItem('tutoVisto_v2', '1');
      localStorage.setItem('welcomeSeen', '1');
      localStorage.setItem('appi_onboarding_v1', JSON.stringify({ done: true, shortcut: true, psa: true, notifications: true, ts: 1 }));
    });

    await page.goto('/index.html', { waitUntil: 'networkidle' });
    await page.locator('#distributorInput').fill('02-9802014');
    const intentarIngreso = async (mensaje, motivo) => {
      await page.locator('#distributorPassword').fill('Clave1234');
      await page.locator('#btnDistributorLogin').click();
      await expect(page.locator('#loginError')).toContainText(mensaje);
      expect(await page.evaluate(({ userId, expectedReason }) => {
        const raw = localStorage.getItem('appi_onboarding_reactivar_v1_' + userId);
        const marker = raw ? JSON.parse(raw) : null;
        return {
          correct: !!marker && marker.reason === expectedReason,
          other: window.APPIAuth.needsReactivationReview('otro-usuario')
        };
      }, { userId: USER_ID, expectedReason: motivo })).toEqual({ correct: true, other: false });
    };

    await intentarIngreso(/desactivada/i, 'account_disabled');
    await page.evaluate(userId => window.APPIAuth.completeReactivationReview(userId), USER_ID);

    bloqueo = 'missing';
    await intentarIngreso(/todavía no tiene una membresía activa/i, 'membership_missing');
    await page.evaluate(userId => window.APPIAuth.completeReactivationReview(userId), USER_ID);

    bloqueo = 'expired';
    await intentarIngreso(/membresía de APPI venció/i, 'membership_expired');

    bloqueo = 'active';
    await page.locator('#distributorPassword').fill('Clave1234');
    await page.locator('#btnDistributorLogin').click();
    await page.locator('#lockScreen').waitFor({ state: 'hidden' });

    const overlay = page.locator('#appiOnboardingOverlay');
    await expect(overlay).toBeVisible();
    await expect(overlay.getByRole('heading', { name: /Bienvenida a APPI/ })).toBeVisible();
    await overlay.getByRole('button', { name: 'Cerrar y continuar después' }).click();
    await expect(overlay).toBeHidden();
    expect(await page.evaluate(() => Object.keys(localStorage).some(key => key.startsWith('appi_onboarding_reactivar_v1_')))).toBe(false);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('#lockScreen').waitFor({ state: 'hidden' });
    await expect(page.locator('#appiOnboardingOverlay')).toHaveCount(0);
  });
});
