const { test, expect } = require('@playwright/test');

const USER_ID = '11111111-1111-4111-8111-111111111111';

function tokenFor(sub) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${header}.${payload}.firma`;
}

// Login mínimo con Supabase simulado; el cupo de fundador lo define el test.
async function entrar(page, { fundador = null, seed = null } = {}) {
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
    if (url.pathname === '/rest/v1/rpc/appi_reclamar_fundador') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify(fundador == null ? null : [fundador]) });
    if (url.pathname === '/functions/v1/dispositivo-puente') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ devices: [] }) });
    return route.fulfill({ status: 200, headers: cors, body: '[]' });
  });

  await page.addInitScript(([uid, semilla]) => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('tutoVisto_v2', '1');
    localStorage.setItem('seguimientoPersonas', '[]');
    if (semilla) {
      localStorage.setItem('equipoData', JSON.stringify(semilla.equipo));
      localStorage.setItem(`appi_gestion_cache_v1_${uid}`, JSON.stringify(semilla.cache));
    }
    window.open = () => ({ closed: false, close() {}, location: { set href(v) {}, get href() { return ''; } } });
  }, [USER_ID, seed]);

  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
}

test('las categorías se calculan con los datos del equipo y del panel', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.APPILineaAscendente);

  const casos = await page.evaluate(() => {
    const f = window.APPILineaAscendente.calcularCategoria;
    return {
      vacio: f({ equipo: 0, conversiones: 0 }).actual.id,
      porEquipo: f({ equipo: 3, conversiones: 0 }).actual.id,
      porVentas: f({ equipo: 0, conversiones: 2 }).actual.id,
      equipoGrandeSinVentas: f({ equipo: 7, conversiones: 9 }).actual.id,
      lider: f({ equipo: 8, conversiones: 4 }).actual.id,
      director: f({ equipo: 20, conversiones: 8 }).actual.id,
      faltantes: f({ equipo: 5, conversiones: 2 }).faltantes
    };
  });

  expect(casos.vacio).toBe('arranque');
  expect(casos.porEquipo).toBe('constructor');
  expect(casos.porVentas).toBe('constructor');
  // 7 personas no alcanzan para Líder aunque sobre venta: queda Constructor.
  expect(casos.equipoGrandeSinVentas).toBe('constructor');
  expect(casos.lider).toBe('lider');
  expect(casos.director).toBe('director');
  expect(casos.faltantes).toEqual(['3 personas más en el equipo', '2 conversiones más este mes']);
});

test('los primeros diez reclaman su cupo de Fundador y lo ven en el home', async ({ page }) => {
  await entrar(page, { fundador: 3 });

  const panel = page.locator('#lineaAscendenteBlock');
  await expect(panel).toContainText('Fundador #3');
  await expect(panel).toContainText('precio congelado');
  expect(await page.evaluate(() => localStorage.getItem(`appi_fundador_v1_${'11111111-1111-4111-8111-111111111111'}`))).toBe('3');
});

test('con los cupos llenos, el que llega tarde no ve insignia', async ({ page }) => {
  await entrar(page, { fundador: null });

  const panel = page.locator('#lineaAscendenteBlock');
  await expect(panel).toBeVisible();
  await expect(panel).not.toContainText('Fundador');
});

test('el panel muestra la categoría y lo que falta para la próxima', async ({ page }) => {
  const hoy = new Date().toISOString();
  await entrar(page, {
    fundador: null,
    seed: {
      // El titular debe coincidir con la cuenta: la app rechaza planillas ajenas.
      equipo: { titular: { dip: '02-9802014', nombre: 'María Pérez' }, personas: [{}, {}, {}, {}, {}] },
      cache: {
        contacts: [
          { estado: 'convertido', updated_at: hoy },
          { estado: 'convertido', updated_at: hoy },
          { estado: 'nuevo', updated_at: hoy }
        ],
        surveys: [], activities: [], savedAt: Date.now()
      }
    }
  });

  const panel = page.locator('#lineaAscendenteBlock');
  await expect(panel).toContainText('Constructor');
  await expect(panel).toContainText('5 en el equipo');
  await expect(panel).toContainText('2 conversiones este mes');
  await expect(panel).toContainText('Líder');
  await expect(panel).toContainText('3 personas más en el equipo');
  await expect(panel).toContainText('2 conversiones más este mes');
});
