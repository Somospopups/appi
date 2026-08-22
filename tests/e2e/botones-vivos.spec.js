const { test, expect } = require('@playwright/test');

const USER_ID = '11111111-1111-4111-8111-111111111111';

function tokenFor(sub) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${header}.${payload}.firma`;
}

async function entrar(page) {
  const accessToken = tokenFor(USER_ID);
  const now = new Date().toISOString();
  const profile = {
    user_id: USER_ID, username: null, dip: '02-9802014', sucursal: '02', numero_distribuidor: '9802014',
    nombre: 'María Pérez', socio_nombre: null, rol: 'usuario', activo: true, debe_cambiar_password: false,
    membresia_meses: 1, membresia_inicio: now, membresia_vence: new Date(Date.now() + 30 * 86400000).toISOString()
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

  await page.addInitScript(() => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('appi_tarjetas_auto', '0');
    localStorage.setItem('tutoVisto_v2', '1');
    localStorage.setItem('seguimientoPersonas', '[]');
    window.open = () => ({ closed: false, close() {}, location: { set href(v) {}, get href() { return ''; } } });
  });

  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
}

// Recorre las pantallas nuevas y aprieta cada botón visible: si alguno
// muere con "is not defined / is not function", el test lo señala.
test('ningún botón visible muere en silencio', async ({ page }) => {
  await entrar(page);

  const errores = [];
  page.on('pageerror', e => errores.push(String(e.message)));

  const vistas = [
    () => window.showView('view-home'),
    () => window.openOcho(),
    () => window.openSuenos(),
    () => window.openDemo()
  ];

  for (const abrir of vistas) {
    await page.evaluate(abrir);
    await page.waitForTimeout(300);
    const botones = page.locator('section.view.active button:visible');
    const total = await botones.count();
    for (let i = 0; i < total; i++) {
      const boton = botones.nth(i);
      if (!(await boton.isVisible().catch(() => false))) continue;
      const texto = ((await boton.textContent().catch(() => '')) || '').trim();
      if (/salir|eliminar|cerrar sesión/i.test(texto)) continue;
      await boton.click({ timeout: 1500, trial: false }).catch(() => {});
      await page.waitForTimeout(150);
      // Si se abrió un diálogo o el modal de ayuda, se cierra para seguir recorriendo.
      await page.evaluate(() => {
        const o = document.querySelector('.appi-dialog-overlay');
        if (o) o.hidden = true;
        const m = document.getElementById('modalOverlay');
        if (m) m.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
    }
  }

  const muertos = errores.filter(m => /is not a function|is not defined/.test(m));
  expect(muertos, `Botones que murieron:\n${muertos.join('\n')}`).toEqual([]);
});

test('los accesos de los 8 pasos abren su herramienta', async ({ page }) => {
  await entrar(page);

  await page.evaluate(() => window.openOcho());
  const esperas = [
    ['Abrir la Rueda de la Vida', 'view-wheel'],
    ['Trabajarlo en Las 7 P', 'view-siete'],
    ['Abrir el Panel de Contactos', 'view-gestion'],
    ['Ir a Mi Encuesta', 'view-encuesta'],
    ['Guía de demostración', 'view-demo'],
    ['Escalera de Sueños', 'view-suenos'],
    ['Abrir Mi Equipo', 'view-equipo']
  ];
  for (const [texto, vista] of esperas) {
    await page.evaluate(() => window.openOcho());
    await page.locator('#ochoSteps button', { hasText: texto }).first().click();
    await expect(page.locator('#' + vista)).toHaveClass(/active/);
  }
});
