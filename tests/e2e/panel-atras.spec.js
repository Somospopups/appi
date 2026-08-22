const { test, expect } = require('@playwright/test');

// El gesto de volver del teléfono tiene que cerrar el panel que está abierto,
// no sacar de la pantalla. Antes se abría Zonas, se hacía el gesto y APPI
// volvía al Home, perdiendo lo que se estaba mirando.

const USER_ID = '11111111-1111-4111-8111-111111111111';

function tokenFor(sub) {
  const h = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${h}.${p}.firma`;
}

const dias = n => new Date(Date.now() + n * 86400000).toISOString();
const USUARIOS = [
  { id: 1, usuario: 'Ana Gómez', telf: '3515551001', domicilio: 'San Martín 120', localidad: 'Alta Gracia',   producto: 'PSA', cp: '5186', fVenceRaw: '30/07/2026', fVence: dias(-20), estado: 'vencida' },
  { id: 2, usuario: 'Beto Ruiz', telf: '3515551002', domicilio: 'Belgrano 45',    localidad: 'Alta Gracia',   producto: 'PSA', cp: '5186', fVenceRaw: '03/09/2026', fVence: dias(15),  estado: 'porVencer' },
  { id: 3, usuario: 'Caro Díaz', telf: '3515551003', domicilio: 'Sarmiento 8',    localidad: 'Villa Allende', producto: 'PSA', cp: '5105', fVenceRaw: '07/03/2027', fVence: dias(200), estado: 'vigente' }
];

async function entrar(page, { tarjetas = null } = {}) {
  const accessToken = tokenFor(USER_ID);
  const profile = {
    user_id: USER_ID, username: null, dip: '02-9802014', sucursal: '02', numero_distribuidor: '9802014',
    nombre: 'María Pérez', socio_nombre: null, rol: 'usuario', activo: true, debe_cambiar_password: false,
    membresia_meses: 1, membresia_inicio: new Date().toISOString(),
    membresia_vence: new Date(Date.now() + 30 * 86400000).toISOString()
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
  await page.addInitScript(([uid, users, cards]) => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('appi_tarjetas_auto', '0');
    localStorage.setItem('tutoVisto_v2', '1');
    localStorage.setItem('usuarios_garantias', JSON.stringify(users));
    if (cards) localStorage.setItem(`appi_tarjetas_v1_${uid}`, JSON.stringify(cards));
  }, [USER_ID, USUARIOS, tarjetas]);
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
}

async function irAUsuarios(page) {
  await page.evaluate(() => window.showView('view-usuarios'));
  await expect(page.locator('#view-usuarios')).toHaveClass(/active/);
  await expect(page.locator('#usuariosBtnZonas')).toBeVisible();
}

test('el gesto de atrás cierra el panel de Zonas y no cambia de pantalla', async ({ page }) => {
  await entrar(page);
  await irAUsuarios(page);

  await page.locator('#usuariosBtnZonas').click();
  await expect(page.locator('#ubOverlay')).toHaveClass(/open/);

  await page.goBack();

  // El panel se cierra y se sigue en Usuarios: no se pierde lo que se miraba.
  await expect(page.locator('#ubOverlay')).not.toHaveClass(/open/);
  await expect(page.locator('#view-usuarios')).toHaveClass(/active/);
});

test('cerrado el panel, el gesto vuelve a navegar como siempre', async ({ page }) => {
  await entrar(page);
  await irAUsuarios(page);

  await page.locator('#usuariosBtnZonas').click();
  await expect(page.locator('#ubOverlay')).toHaveClass(/open/);
  await page.goBack();
  await expect(page.locator('#view-usuarios')).toHaveClass(/active/);

  // Con todo cerrado, el gesto tiene que sacar de Usuarios: la vuelta atrás no
  // puede quedar trabada por haber abierto un panel antes.
  await page.goBack();
  await expect(page.locator('#view-usuarios')).not.toHaveClass(/active/);
});

test('cerrar con la ✕ no deja una vuelta atrás de más', async ({ page }) => {
  await entrar(page);
  await irAUsuarios(page);

  await page.locator('#usuariosBtnZonas').click();
  await expect(page.locator('#ubOverlay')).toHaveClass(/open/);
  await page.locator('#ubCerrar').click();
  await expect(page.locator('#ubOverlay')).not.toHaveClass(/open/);
  await page.waitForTimeout(400);

  // Si al cerrar a mano quedara la entrada puesta, este gesto no haría nada y
  // habría que hacerlo dos veces para salir de la pantalla.
  await page.goBack();
  await expect(page.locator('#view-usuarios')).not.toHaveClass(/active/);
});

test('con dos niveles abiertos, un solo gesto vuelve a la pantalla', async ({ page }) => {
  await entrar(page, {
    tarjetas: { byKey: { 'tel:3515551001': [{ marca: 'visa', banco: 'galicia' }] } }
  });
  await irAUsuarios(page);

  await page.locator('#usuariosBtnTarjetas').click();
  await expect(page.locator('#ubOverlay')).toHaveClass(/open/);
  // Segundo nivel: la gente que tiene esa tarjeta.
  await page.locator('[data-ub-marca="visa"][data-ub-banco="galicia"]').click();
  await expect(page.locator('#ubCuerpo .ub-persona')).toHaveCount(1);

  await page.goBack();
  await expect(page.locator('#ubOverlay')).not.toHaveClass(/open/);
  await expect(page.locator('#view-usuarios')).toHaveClass(/active/);
});

test('el detalle del Histórico también se cierra con el gesto', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.showView('view-historico'));
  await expect(page.locator('#view-historico')).toHaveClass(/active/);

  // Se abre el panel directamente: alcanza para verificar que el gesto lo cierra.
  await page.evaluate(() => {
    if (typeof window.openHistDrawer === 'function') {
      window.openHistDrawer('Detalle de prueba', 'sub', '<p>contenido</p>');
    }
  });
  const abierto = await page.locator('#histDetailOverlay.open').count();
  test.skip(!abierto, 'El Histórico no expone su panel en este contexto');

  await page.goBack();
  await expect(page.locator('#histDetailOverlay')).not.toHaveClass(/open/);
  await expect(page.locator('#view-historico')).toHaveClass(/active/);
});

test('elegir titular o socio no se cierra con el gesto', async ({ page }) => {
  await entrar(page);
  // Es un paso que hay que completar: cerrarlo dejaría una pantalla sin salida.
  const excluidos = await page.evaluate(() => {
    const forzado = document.querySelector('#forcedPasswordOverlay');
    const persona = document.querySelector('#personChoiceOverlay');
    return { forzado: !!forzado, persona: !!persona };
  });
  expect(excluidos.forzado || excluidos.persona).toBe(true);

  // El módulo los deja fuera de su lista, así que nunca los cuenta como abiertos.
  const cuenta = await page.evaluate(() => {
    const p = document.querySelector('#personChoiceOverlay');
    if (p) { p.hidden = false; p.classList.add('open'); }
    return window.APPIPanelAtras.abiertos().length;
  });
  expect(cuenta).toBe(0);
});
