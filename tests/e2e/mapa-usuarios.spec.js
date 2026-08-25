const { test, expect } = require('@playwright/test');

// La función de mapa se eliminó por completo (v333) y en v334 el botón
// "Vecinos" vuelve con una función nueva: abre un LISTADO de las personas de
// la misma zona, sin mapa. Quedan: Vecinos (listado) y ¿Cómo llego? (Google
// Maps en pestaña nueva).

const USER_ID = '11111111-1111-4111-8111-111111111111';

function tokenFor(sub) {
  const h = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${h}.${p}.firma`;
}

const dias = n => new Date(Date.now() + n * 86400000).toISOString();
const USUARIOS = [
  { id: 1, usuario: 'Ana Gómez',  telf: '3515551001', domicilio: 'San Martín 120', localidad: 'Alta Gracia',   producto: 'PSA', cp: '5186', fVenceRaw: '30/07/2026', fVence: dias(-20), estado: 'vencida' },
  { id: 2, usuario: 'Beto Ruiz',  telf: '3515551002', domicilio: 'Belgrano 45',    localidad: 'Villa Allende', producto: 'PSA', cp: '5105', fVenceRaw: '03/09/2026', fVence: dias(15),  estado: 'porVencer' },
  { id: 3, usuario: 'Carla Díaz', telf: '3515551003', domicilio: '9 de Julio 800', localidad: 'Alta Gracia',   producto: 'PSA', cp: '5186', fVenceRaw: '10/02/2027', fVence: dias(180), estado: 'vigente' }
];

async function entrar(page) {
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
  await page.addInitScript(([users]) => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('appi_tarjetas_auto', '0');
    localStorage.setItem('tutoVisto_v2', '1');
    localStorage.setItem('usuarios_garantias', JSON.stringify(users));
  }, [USUARIOS]);
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
  await page.evaluate(() => window.showView('view-usuarios'));
  await expect(page.locator('#usuariosBtnZonas')).toBeVisible();
}

test('el mapa no existe, pero el botón Vecinos sí', async ({ page }) => {
  await entrar(page);

  // Barra: sin Mapa; contenedor del mapa eliminado.
  await expect(page.locator('#usuariosBtnMapAll')).toHaveCount(0);
  await expect(page.locator('#usuariosMap')).toHaveCount(0);

  // Ficha: sin Mapa, con Vecinos y ¿Cómo llego?.
  const ficha = page.locator('#usuariosList .tree-node').first();
  await ficha.click();
  const detalle = page.locator('#usuariosList .tree-children').first();
  await expect(detalle.locator('[data-u-action="map"]')).toHaveCount(0);
  await expect(detalle.locator('[data-u-action="neighbors"]')).toBeVisible();
  await expect(detalle.locator('[data-u-action="google"]')).toBeVisible();
});

test('Vecinos abre un listado con todas las personas de la zona', async ({ page }) => {
  await entrar(page);
  const ficha = page.locator('#usuariosList .tree-node').first(); // Ana, Alta Gracia
  await ficha.click();
  await page.locator('[data-u-action="neighbors"]').first().click();

  const panel = page.locator('#ubOverlay');
  await expect(panel).toHaveClass(/open/);
  await expect(page.locator('#ubTitulo')).toContainText('Alta Gracia');

  // Ana (la que abrió) y Carla están en Alta Gracia; Beto no.
  const cuerpo = page.locator('#ubCuerpo');
  await expect(cuerpo).toContainText('Ana Gómez');
  await expect(cuerpo).toContainText('Carla Díaz');
  await expect(cuerpo).not.toContainText('Beto Ruiz');
  await expect(page.locator('#ubSub')).toContainText('2 personas');
  await expect(cuerpo).toContainText('· esta persona');
});

test('ya no existen las funciones globales del mapa', async ({ page }) => {
  await entrar(page);
  const r = await page.evaluate(() => ({
    verVecinosU: typeof window.verVecinosU,
    abrirMapaU: typeof window.abrirMapaU,
    cerrarMapaU: typeof window.cerrarMapaU,
    mostrarEnMapaU: typeof window.mostrarEnMapaU,
    abrirVecinos: typeof (window.APPIUsuariosBotones && window.APPIUsuariosBotones.abrirVecinos)
  }));
  expect(r.verVecinosU).toBe('undefined');
  expect(r.abrirMapaU).toBe('undefined');
  expect(r.cerrarMapaU).toBe('undefined');
  expect(r.mostrarEnMapaU).toBe('undefined');
  expect(r.abrirVecinos).toBe('function');
});

test('con un filtro puesto, Limpiar es su propio botón', async ({ page }) => {
  await entrar(page);
  const limpiar = page.locator('#usuariosBtnLimpiar');

  await expect(limpiar).toBeHidden();

  await page.locator('#usuariosBtnZonas').click();
  await page.locator('[data-ub-zona="Alta Gracia"]').click();
  await expect(page.locator('#usuariosList .tree-name')).toHaveCount(2);
  await expect(limpiar).toBeVisible();

  await limpiar.click();
  await expect(page.locator('#usuariosList .tree-name')).toHaveCount(3);
  await expect(limpiar).toBeHidden();
});
