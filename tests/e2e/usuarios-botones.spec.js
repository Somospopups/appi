const { test, expect } = require('@playwright/test');

// Los barrios y las tarjetas se eligen con botones a la vista, no con
// desplegables. Cada botón abre el listado de su grupo en un popup y deja el
// listado grande de la pantalla como estaba.

const USER_ID = '11111111-1111-4111-8111-111111111111';

function tokenFor(sub) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${header}.${payload}.firma`;
}

const dias = n => new Date(Date.now() + n * 86400000).toISOString();

// Tres barrios con estados mezclados y uno sin barrio, para ver el orden y el
// botón aparte de "Sin barrio".
const USUARIOS = [
  { id: 1, usuario: 'Ana Gómez',  telf: '3515551001', domicilio: 'San Martín 120', localidad: 'Alta Gracia',   fVenceRaw: '30/07/2026', fVence: dias(-20), estado: 'vencida' },
  { id: 2, usuario: 'Beto Ruiz',  telf: '3515551002', domicilio: 'Belgrano 45',    localidad: 'Alta Gracia',   fVenceRaw: '03/09/2026', fVence: dias(15),  estado: 'porVencer' },
  { id: 3, usuario: 'Caro Díaz',  telf: '3515551003', domicilio: 'Sarmiento 8',    localidad: 'Alta Gracia',   fVenceRaw: '07/03/2027', fVence: dias(200), estado: 'vigente' },
  { id: 4, usuario: 'Diego Paz',  telf: '3515551004', domicilio: 'Los Álamos 33',  localidad: 'Villa Allende', fVenceRaw: '14/08/2026', fVence: dias(-5),  estado: 'vencida' },
  { id: 5, usuario: 'Elsa Mota',  telf: '3515551005', domicilio: 'Río Ceballos 91', localidad: 'Villa Allende', fVenceRaw: '17/12/2026', fVence: dias(120), estado: 'vigente' },
  { id: 6, usuario: 'Hugo Vera',  telf: '',           domicilio: 'Libertad 12',    localidad: '',              fVenceRaw: '18/10/2026', fVence: dias(60),  estado: 'vigente' }
];

async function entrar(page, { tarjetas = null } = {}) {
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
    if (url.pathname === '/auth/v1/token') {
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ access_token: accessToken, refresh_token: 'r', expires_in: 3600, user: { id: USER_ID } }) });
    }
    if (url.pathname === '/rest/v1/appi_perfiles') {
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([profile]) });
    }
    if (url.pathname === '/functions/v1/dispositivo-puente') {
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ devices: [] }) });
    }
    return route.fulfill({ status: 200, headers: cors, body: '[]' });
  });
  await page.addInitScript(([uid, users, cards]) => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('tutoVisto_v2', '1');
    localStorage.setItem('usuarios_garantias', JSON.stringify(users));
    if (cards) localStorage.setItem(`appi_tarjetas_v1_${uid}`, JSON.stringify(cards));
  }, [USER_ID, USUARIOS, tarjetas]);
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
  await page.evaluate(() => window.showView('view-usuarios'));
  await expect(page.locator('#view-usuarios')).toHaveClass(/active/);
  await expect(page.locator('#usuariosZonasBotones .ub-btn').first()).toBeVisible();
}

test('los barrios son botones con su cuenta y ya no un desplegable', async ({ page }) => {
  await entrar(page);

  // El desplegable de zonas no debe volver por la ventana.
  await expect(page.locator('#usuariosSelectZona')).toHaveCount(0);

  const botones = page.locator('#usuariosZonasBotones .ub-btn');
  await expect(botones).toHaveCount(3); // Alta Gracia, Villa Allende y Sin barrio
  await expect(botones.nth(0)).toContainText('Alta Gracia');
  await expect(botones.nth(0)).toContainText('3');
  await expect(botones.nth(1)).toContainText('Villa Allende');
  await expect(botones.nth(1)).toContainText('2');
  // Quien no tiene barrio no se pierde: tiene su propio botón.
  await expect(botones.nth(2)).toContainText('Sin barrio');

  // Los barrios con alguna garantía vencida se marcan con un punto rojo.
  await expect(page.locator('[data-ub-zona="Alta Gracia"] .ub-dot')).toHaveCount(1);
});

test('tocar un barrio abre el popup con su gente y las vencidas primero', async ({ page }) => {
  await entrar(page);
  await page.locator('[data-ub-zona="Alta Gracia"]').click();

  const popup = page.locator('#ubOverlay');
  await expect(popup).toHaveClass(/open/);
  await expect(page.locator('#ubTitulo')).toHaveText('Alta Gracia');
  await expect(page.locator('#ubSub')).toContainText('3 usuarios');
  await expect(page.locator('#ubSub')).toContainText('1 vencida');

  const filas = page.locator('#ubCuerpo .ub-row');
  await expect(filas).toHaveCount(3);
  // Lo que urge va arriba: vencida, por vencer y recién después vigente.
  await expect(page.locator('#ubCuerpo .ub-badge').nth(0)).toHaveText('VENC');
  await expect(page.locator('#ubCuerpo .ub-badge').nth(1)).toHaveText('POR VENC');
  await expect(page.locator('#ubCuerpo .ub-badge').nth(2)).toHaveText('VIG');
  await expect(filas.nth(0)).toContainText('Ana Gómez');

  // Cada fila ofrece WhatsApp y llamada con el teléfono real.
  await expect(filas.nth(0).locator('a.wa')).toHaveAttribute('href', /wa\.me\/3515551001/);
  await expect(filas.nth(0).locator('a.tel')).toHaveAttribute('href', 'tel:3515551001');

  // Nadie de otro barrio se cuela.
  await expect(page.locator('#ubCuerpo')).not.toContainText('Diego Paz');
});

test('el popup no altera el listado grande de la pantalla', async ({ page }) => {
  await entrar(page);
  const antes = await page.locator('#usuariosList .tree-node').count();

  await page.locator('[data-ub-zona="Villa Allende"]').click();
  await expect(page.locator('#ubOverlay')).toHaveClass(/open/);
  await expect(page.locator('#ubCuerpo .ub-row')).toHaveCount(2);

  // El listado de abajo sigue completo mientras el popup está abierto.
  await expect(page.locator('#usuariosList .tree-node')).toHaveCount(antes);

  await page.locator('#ubCerrar').click();
  await expect(page.locator('#ubOverlay')).not.toHaveClass(/open/);
  await expect(page.locator('#usuariosList .tree-node')).toHaveCount(antes);
});

test('el popup se cierra con Escape y tocando fuera', async ({ page }) => {
  await entrar(page);

  await page.locator('[data-ub-zona="Alta Gracia"]').click();
  await expect(page.locator('#ubOverlay')).toHaveClass(/open/);
  await page.keyboard.press('Escape');
  await expect(page.locator('#ubOverlay')).not.toHaveClass(/open/);

  await page.locator('[data-ub-zona="Alta Gracia"]').click();
  await expect(page.locator('#ubOverlay')).toHaveClass(/open/);
  await page.locator('#ubOverlay').click({ position: { x: 12, y: 300 } });
  await expect(page.locator('#ubOverlay')).not.toHaveClass(/open/);
});

test('las tarjetas son botones por combinación real y abren su listado', async ({ page }) => {
  // Ana y Diego con Visa Galicia; Beto con Mastercard Macro.
  await entrar(page, {
    tarjetas: {
      byKey: {
        'tel:3515551001': [{ marca: 'visa', banco: 'galicia' }],
        'tel:3515551004': [{ marca: 'visa', banco: 'galicia' }],
        'tel:3515551002': [{ marca: 'mastercard', banco: 'macro' }]
      }
    }
  });

  // Los desplegables de marca y banco quedan fuera de la vista.
  await expect(page.locator('#tpUMarca')).toBeHidden();
  await expect(page.locator('#tpUBanco')).toBeHidden();

  const botones = page.locator('#usuariosTarjetasBotones .ub-btn');
  // Sólo las combinaciones que alguien tiene, ordenadas por cuántos son.
  await expect(botones.nth(0)).toContainText('Visa Galicia');
  await expect(botones.nth(0)).toContainText('2');
  await expect(botones.nth(1)).toContainText('Mastercard Macro');
  await expect(page.locator('#usuariosTarjetasBotones')).not.toContainText('Amex');

  await page.locator('[data-ub-marca="visa"][data-ub-banco="galicia"]').click();
  await expect(page.locator('#ubTitulo')).toContainText('Visa Galicia');
  await expect(page.locator('#ubCuerpo .ub-row')).toHaveCount(2);
  await expect(page.locator('#ubCuerpo')).toContainText('Ana Gómez');
  await expect(page.locator('#ubCuerpo')).toContainText('Diego Paz');
  await expect(page.locator('#ubCuerpo')).not.toContainText('Beto Ruiz');

  // Los que no tienen ninguna tarjeta también se pueden mirar.
  await page.locator('#ubCerrar').click();
  await page.locator('[data-ub-sin]').click();
  await expect(page.locator('#ubTitulo')).toHaveText('Sin tarjeta cargada');
  await expect(page.locator('#ubCuerpo')).toContainText('Caro Díaz');
});

test('sin tarjetas cargadas lo dice en vez de mostrar botones vacíos', async ({ page }) => {
  await entrar(page);
  await expect(page.locator('#usuariosTarjetasBotones .ub-btn')).toHaveCount(0);
  await expect(page.locator('#usuariosTarjetasBotones')).toContainText('Todavía no hay tarjetas cargadas');
});
