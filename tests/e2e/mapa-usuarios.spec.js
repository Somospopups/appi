const { test, expect } = require('@playwright/test');

// El botón Mapa es uno solo, así que tiene que hacer el camino de ida y el de
// vuelta: tocarlo abre el mapa y volver a tocarlo lo cierra.

const USER_ID = '11111111-1111-4111-8111-111111111111';

function tokenFor(sub) {
  const h = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${h}.${p}.firma`;
}

const dias = n => new Date(Date.now() + n * 86400000).toISOString();
const USUARIOS = [
  { id: 1, usuario: 'Ana Gómez', telf: '3515551001', domicilio: 'San Martín 120', localidad: 'Alta Gracia',   producto: 'PSA', cp: '5186', fVenceRaw: '30/07/2026', fVence: dias(-20), estado: 'vencida' },
  { id: 2, usuario: 'Beto Ruiz', telf: '3515551002', domicilio: 'Belgrano 45',    localidad: 'Villa Allende', producto: 'PSA', cp: '5105', fVenceRaw: '03/09/2026', fVence: dias(15),  estado: 'porVencer' }
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
  // Los tiles salen a internet: se cortan para que la prueba no dependa de eso.
  await page.route('**/tile.openstreetmap.org/**', route => route.abort());
  await page.addInitScript(([users]) => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('tutoVisto_v2', '1');
    localStorage.setItem('usuarios_garantias', JSON.stringify(users));
  }, [USUARIOS]);
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
  await page.evaluate(() => window.showView('view-usuarios'));
  await expect(page.locator('#usuariosBtnMapAll')).toBeVisible();
}

test('el botón Mapa abre y vuelve a cerrar el mapa', async ({ page }) => {
  await entrar(page);
  const mapa = page.locator('#usuariosMap');
  const boton = page.locator('#usuariosBtnMapAll');

  await expect(mapa).toBeHidden();

  await boton.click();
  await expect(mapa).toBeVisible();
  // El botón queda marcado: así se sabe que ese mismo toque lo cierra.
  await expect(boton).toHaveClass(/activo/);

  await boton.click();
  await expect(mapa).toBeHidden();
  await expect(boton).not.toHaveClass(/activo/);

  // Y se puede volver a abrir: cerrar no debe dejarlo trabado.
  await boton.click();
  await expect(mapa).toBeVisible();
});

test('cerrar no deja estilos pegados que impidan reabrirlo', async ({ page }) => {
  await entrar(page);
  const boton = page.locator('#usuariosBtnMapAll');

  await boton.click();
  await boton.click();

  // El bug de origen: al abrir se ponía display:block en el elemento y ese
  // estilo le ganaba al CSS, así que quitar la clase no alcanzaba para cerrar.
  const estilo = await page.locator('#usuariosMap').evaluate(el => el.style.display);
  expect(estilo).toBe('');
});

test('el mapa de una ficha lo abre aunque estuviera cerrado', async ({ page }) => {
  await entrar(page);
  const mapa = page.locator('#usuariosMap');
  await expect(mapa).toBeHidden();

  // "Vecinos" y el "Mapa" de cada ficha reutilizan el mismo mapa de la pantalla.
  await page.evaluate(() => window.verVecinosU('Alta Gracia'));
  await expect(mapa).toBeVisible();
  await expect(page.locator('#usuariosBtnMapAll')).toHaveClass(/activo/);

  // Y el botón lo cierra igual, aunque lo haya abierto otro camino.
  await page.locator('#usuariosBtnMapAll').click();
  await expect(mapa).toBeHidden();
});

test('con un filtro puesto, Limpiar es su propio botón y Mapa sigue siendo Mapa', async ({ page }) => {
  await entrar(page);
  const limpiar = page.locator('#usuariosBtnLimpiar');
  const boton = page.locator('#usuariosBtnMapAll');
  const mapa = page.locator('#usuariosMap');

  // Sin filtro no hay por qué ofrecer limpiar nada.
  await expect(limpiar).toBeHidden();

  await page.locator('#usuariosBtnZonas').click();
  await page.locator('[data-ub-zona="Alta Gracia"]').click();
  await expect(page.locator('#usuariosList .tree-name')).toHaveCount(1);
  await expect(limpiar).toBeVisible();

  // Antes Mapa se transformaba en Limpiar y con un filtro puesto el mapa
  // quedaba sin forma de cerrarse. Ahora sigue abriendo y cerrando.
  await expect(boton).toContainText('Mapa');
  await boton.click();
  await expect(mapa).toBeVisible();
  await boton.click();
  await expect(mapa).toBeHidden();

  await limpiar.click();
  await expect(page.locator('#usuariosList .tree-name')).toHaveCount(2);
  await expect(limpiar).toBeHidden();
});

test('cambiar de archivo cierra el mapa y lo deja reutilizable', async ({ page }) => {
  await entrar(page);
  const mapa = page.locator('#usuariosMap');

  await page.locator('#usuariosBtnMapAll').click();
  await expect(mapa).toBeVisible();

  await page.evaluate(() => window.cerrarMapaU());
  await expect(mapa).toBeHidden();
  expect(await mapa.evaluate(el => el.style.display)).toBe('');

  await page.locator('#usuariosBtnMapAll').click();
  await expect(mapa).toBeVisible();
});
