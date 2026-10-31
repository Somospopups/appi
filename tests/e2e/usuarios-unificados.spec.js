const { test, expect } = require('@playwright/test');

const USER_ID = '11111111-1111-4111-8111-111111111111';
function tokenFor(sub) {
  const h = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${h}.${p}.firma`;
}

const REPETIDOS = [
  { id: 1, usuario: 'GONZALEZ, MARIA', telf: '3515551001', domicilio: 'San Martín 120', localidad: 'Alta Gracia', producto: 'PSA SENIOR 4', serie: 'SERIE-ANTERIOR', fCompra: '10/03/2021', fVenceRaw: '10/03/2024', fVence: '2024-03-10T03:00:00.000Z', estado: 'vencida', email: 'maria@example.com', cumpleRaw: '12/05/1970' },
  { id: 2, usuario: 'GONZALEZ, MARIA', telf: '3515551001', domicilio: 'San Martín 120', localidad: 'Alta Gracia', producto: 'PSA SENIOR 4', serie: 'SERIE-ACTUAL', fCompra: '18/05/2024', fVenceRaw: '18/05/2027', fVence: '2027-05-18T03:00:00.000Z', estado: 'vigente', email: 'maria@example.com', cumpleRaw: '12/05/1970' },
  // La misma garantía repetida por PSA: la serie física es la misma y no suma otra compra.
  { id: 3, usuario: 'GONZALEZ, MARIA', telf: '3515551001', domicilio: 'San Martín 120', localidad: 'Alta Gracia', producto: 'PSA SENIOR 4', serie: 'SERIE-ACTUAL', fCompra: '18/05/2024', fVenceRaw: '18/05/2027', fVence: '2027-05-18T03:00:00.000Z', estado: 'vigente', email: 'maria@example.com', cumpleRaw: '12/05/1970' },
  { id: 4, usuario: 'PEREZ, JUAN', telf: '3515551002', domicilio: 'Belgrano 45', localidad: 'Córdoba', producto: 'PSA VERO', serie: 'SERIE-JUAN', fCompra: '01/06/2025', fVenceRaw: '01/06/2028', fVence: '2028-06-01T03:00:00.000Z', estado: 'vigente' }
];

const AMBIGUOS = [
  { id: 10, usuario: 'LOPEZ, CARLOS', telf: '3515552001', domicilio: 'Primera 10', localidad: 'Córdoba', producto: 'PSA VERO', serie: 'CARLOS-A', fCompra: '01/02/2022', fVenceRaw: '01/02/2025', fVence: '2025-02-01T03:00:00.000Z', estado: 'vencida' },
  { id: 11, usuario: 'LOPEZ, CARLOS', telf: '3515552999', domicilio: 'Segunda 20', localidad: 'Córdoba', producto: 'PSA SENIOR 4', serie: 'CARLOS-B', fCompra: '01/08/2025', fVenceRaw: '01/08/2028', fVence: '2028-08-01T03:00:00.000Z', estado: 'vigente' }
];

async function entrar(page, users) {
  const accessToken = tokenFor(USER_ID);
  const now = new Date().toISOString();
  const profile = { user_id: USER_ID, dip: '02-9802014', sucursal: '02', numero_distribuidor: '9802014', nombre: 'María Pérez', rol: 'usuario', activo: true, debe_cambiar_password: false, membresia_meses: 1, membresia_inicio: now, membresia_vence: new Date(Date.now() + 30 * 86400000).toISOString() };
  await page.route('**/auth-config.js', route => route.fulfill({ contentType: 'application/javascript', body: "window.APPI_AUTH={enabled:true,url:'https://mock.supabase.co',anonKey:'anon-key-publica-de-prueba',distributorEmailDomain:'distribuidores.appi.invalid',adminLogin:{username:'popups',email:'admin-popups@appi.invalid'},loginAliases:{},offlineDays:7};" }));
  await page.route('https://mock.supabase.co/**', route => {
    const url = new URL(route.request().url());
    const headers = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
    if (url.pathname === '/auth/v1/token') return route.fulfill({ status: 200, headers, body: JSON.stringify({ access_token: accessToken, refresh_token: 'r', expires_in: 3600, user: { id: USER_ID } }) });
    if (url.pathname === '/rest/v1/appi_perfiles') return route.fulfill({ status: 200, headers, body: JSON.stringify([profile]) });
    if (url.pathname === '/functions/v1/dispositivo-puente') return route.fulfill({ status: 200, headers, body: JSON.stringify({ devices: [] }) });
    return route.fulfill({ status: 200, headers, body: '[]' });
  });
  await page.addInitScript(([uid, list]) => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('appi_tarjetas_auto', '0');
    localStorage.setItem('tutoVisto_v2', '1');
    localStorage.setItem('usuarios_garantias', JSON.stringify(list));
    localStorage.removeItem(`appi_usuarios_identidad_v882_${uid}`);
  }, [USER_ID, users]);
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
  await page.evaluate(() => window.showView('view-usuarios'));
  await expect(page.locator('#usuariosDashboard')).toBeVisible();
}

test('agrupa a la persona, cuenta modelos iguales y deduplica sólo la misma serie', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  const r = await page.evaluate(list => {
    const personas = window.agruparUsuariosU(list);
    const maria = personas.find(u => /maria/i.test(u.usuario));
    return {
      personas: personas.length,
      productos: maria.productos.length,
      series: maria.productos.map(p => p.serie),
      productoActual: maria.producto,
      compraActual: maria.fCompra,
      vencimientoActual: maria.fVenceRaw,
      estado: maria.estado,
      estrella: maria.esEstrella,
      grupoMensajes: window.APPIMensajes.grupoDe(maria)
    };
  }, REPETIDOS);
  expect(r).toEqual({ personas: 2, productos: 2, series: ['SERIE-ACTUAL', 'SERIE-ANTERIOR'], productoActual: 'PSA SENIOR 4', compraActual: '18/05/2024', vencimientoActual: '18/05/2027', estado: 'vigente', estrella: true, grupoMensajes: 'vigente' });
});

test('muestra una persona con todos sus productos, fechas y sólo la última compra como vigente', async ({ page }) => {
  await entrar(page, REPETIDOS);
  await expect(page.locator('#usuariosStTotal')).toHaveText('2');
  await expect(page.locator('#usuariosStEstrella')).toHaveText('1');
  await expect(page.locator('#usuariosList .tree-name')).toHaveCount(2);
  await expect(page.locator('#usuariosList .tree-name').first()).toContainText('GONZALEZ, MARIA');
  await expect(page.locator('#usuariosList .u-product-count').first()).toHaveText('2 productos');

  await page.locator('#usuariosList .tree-node').first().click();
  const detalle = page.locator('#usuariosList .tree-children').first();
  await expect(detalle.locator('.u-product')).toHaveCount(2);
  await expect(detalle).toContainText('Fecha de compra: 18/05/2024');
  await expect(detalle).toContainText('Vencimiento: 18/05/2027');
  await expect(detalle).toContainText('Fecha de compra: 10/03/2021');
  await expect(detalle).toContainText('Vencimiento: 10/03/2024');
  await expect(detalle.locator('.u-product-state')).toHaveText(['Vigente', 'Equipo anterior renovado']);
  await expect(detalle).toContainText('La renovación o el Plan Canje se gestiona únicamente sobre este producto.');

  await page.locator('#usuariosBtnEstrella').click();
  await expect(page.locator('#usuariosBtnEstrella')).toHaveClass(/activo/);
  await expect(page.locator('#usuariosList .tree-name')).toHaveCount(1);
  await expect(page.locator('#usuariosList')).toContainText('GONZALEZ, MARIA');
});

test('Usuarios estrella prepara mensajes editables y no los envía automáticamente', async ({ page }) => {
  await entrar(page, REPETIDOS);
  await page.evaluate(() => { window.__waEstrella = []; window.APPIWhatsApp.abrir = url => { window.__waEstrella.push(url); }; });
  await page.locator('#usuariosList .tree-node').first().click();
  await page.locator('[data-u-action="star"]').click();
  await expect(page.locator('#modalOverlay')).toHaveClass(/open/);
  await expect(page.locator('#modalTitle')).toHaveText('Contactar Usuario estrella');
  await expect(page.locator('[data-star-template]')).toHaveCount(5);
  expect(await page.evaluate(() => window.__waEstrella.length)).toBe(0);
  await page.locator('[data-star-template="obsequio"]').click();
  await expect(page.locator('#uStarTexto')).toHaveValue(/obsequio/);
  await page.locator('#uStarTexto').fill('Hola María, mensaje especial de prueba.');
  await page.locator('#uStarEnviar').click();
  const urls = await page.evaluate(() => window.__waEstrella);
  expect(urls).toHaveLength(1);
  expect(decodeURIComponent(urls[0])).toContain('mensaje especial de prueba');
});

test('si sólo coincide el nombre pide revisión y recuerda la unión manual', async ({ page }) => {
  await entrar(page, AMBIGUOS);
  await expect(page.locator('#usuariosList .tree-name')).toHaveCount(2);
  await expect(page.locator('#usuariosBtnCoincidencias')).toBeVisible();
  await expect(page.locator('#usuariosStCoincidencias')).toHaveText('1');
  await page.locator('#usuariosBtnCoincidencias').click();
  await expect(page.locator('#modalTitle')).toHaveText('¿Es la misma persona?');
  await page.locator('#uIdentidadUnir').click();
  await expect(page.locator('#usuariosList .tree-name')).toHaveCount(1);
  await expect(page.locator('#usuariosList .u-product-count')).toHaveText('2 productos');
  await expect(page.locator('#usuariosBtnCoincidencias')).toBeHidden();
  await page.evaluate(() => window.recargarUsuariosDeStorage());
  await expect(page.locator('#usuariosList .tree-name')).toHaveCount(1);
  await expect(page.locator('#usuariosStEstrella')).toHaveText('1');
});
