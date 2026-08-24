const { test, expect } = require('@playwright/test');

// En Usuarios el listado muestra los nombres de las personas. Las zonas se
// filtran desde el botón "Zonas", que despliega los barrios en un popup; las
// tarjetas, desde su botón en la barra de herramientas del pie.

const USER_ID = '11111111-1111-4111-8111-111111111111';

function tokenFor(sub) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${header}.${payload}.firma`;
}

const dias = n => new Date(Date.now() + n * 86400000).toISOString();

const USUARIOS = [
  { id: 1, usuario: 'Ana Gómez', telf: '3515551001', domicilio: 'San Martín 120',  localidad: 'Alta Gracia',   producto: 'PSA', cp: '5186', fVenceRaw: '30/07/2026', fVence: dias(-20), estado: 'vencida' },
  { id: 2, usuario: 'Beto Ruiz', telf: '3515551002', domicilio: 'Belgrano 45',     localidad: 'Alta Gracia',   producto: 'PSA', cp: '5186', fVenceRaw: '03/09/2026', fVence: dias(15),  estado: 'porVencer' },
  { id: 3, usuario: 'Caro Díaz', telf: '3515551003', domicilio: 'Sarmiento 8',     localidad: 'Alta Gracia',   producto: 'PSA', cp: '5186', fVenceRaw: '07/03/2027', fVence: dias(200), estado: 'vigente' },
  { id: 4, usuario: 'Diego Paz', telf: '3515551004', domicilio: 'Los Álamos 33',   localidad: 'Villa Allende', producto: 'PSA', cp: '5105', fVenceRaw: '14/08/2026', fVence: dias(-5),  estado: 'vencida' },
  { id: 5, usuario: 'Elsa Mota', telf: '3515551005', domicilio: 'Río Ceballos 91', localidad: 'Villa Allende', producto: 'PSA', cp: '5105', fVenceRaw: '17/12/2026', fVence: dias(120), estado: 'vigente' },
  { id: 6, usuario: 'Hugo Vera', telf: '3515551006', domicilio: 'Libertad 12',     localidad: '',              producto: 'PSA', cp: '5000', fVenceRaw: '18/10/2026', fVence: dias(60),  estado: 'vigente' }
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
  await page.evaluate(() => window.showView('view-usuarios'));
  await expect(page.locator('#view-usuarios')).toHaveClass(/active/);
  await expect(page.locator('#usuariosBtnZonas')).toBeVisible();
}

test('el listado muestra los nombres de las personas, no los barrios', async ({ page }) => {
  await entrar(page);

  // Una fila por persona, con su nombre.
  const nombres = page.locator('#usuariosList .tree-name');
  await expect(nombres).toHaveCount(6);
  await expect(nombres.nth(0)).toHaveText('Ana Gómez');
  await expect(nombres.nth(3)).toHaveText('Diego Paz');

  // Sin cabeceras de barrio: eso vive en el popup de Zonas.
  await expect(page.locator('.barrio-grupo')).toHaveCount(0);
  await expect(page.locator('#usuariosSelectZona')).toHaveCount(0);
});

test('el botón Zonas despliega los barrios con su cuenta', async ({ page }) => {
  await entrar(page);
  await expect(page.locator('#usuariosBtnZonas')).toContainText('Zonas');
  await page.locator('#usuariosBtnZonas').click();

  await expect(page.locator('#ubOverlay')).toHaveClass(/open/);
  await expect(page.locator('#ubTitulo')).toContainText('Zonas');
  const items = page.locator('#ubCuerpo .ub-item');
  await expect(items).toHaveCount(2);
  await expect(items.nth(0)).toContainText('Alta Gracia');
  await expect(items.nth(0)).toContainText('3');
  await expect(items.nth(1)).toContainText('Villa Allende');
  await expect(page.locator('[data-ub-todos]')).toContainText('Todos los barrios');
});

test('elegir una zona filtra el listado y el chip muestra cuál está puesta', async ({ page }) => {
  await entrar(page);
  await expect(page.locator('#usuariosList .tree-name')).toHaveCount(6);

  await page.locator('#usuariosBtnZonas').click();
  await page.locator('[data-ub-zona="Villa Allende"]').click();

  // El popup se cierra y quedan sólo los de esa zona, por nombre.
  await expect(page.locator('#ubOverlay')).not.toHaveClass(/open/);
  await expect(page.locator('#usuariosList .tree-name')).toHaveCount(2);
  await expect(page.locator('#usuariosList')).toContainText('Diego Paz');
  await expect(page.locator('#usuariosList')).not.toContainText('Ana Gómez');

  // El chip avisa qué zona está puesta.
  await expect(page.locator('#ubChipFiltro')).toContainText('Villa Allende');
});

test('"Todos los barrios" y la cruz del chip devuelven el listado completo', async ({ page }) => {
  await entrar(page);

  await page.locator('#usuariosBtnZonas').click();
  await page.locator('[data-ub-zona="Alta Gracia"]').click();
  await expect(page.locator('#usuariosList .tree-name')).toHaveCount(3);

  await page.locator('#usuariosBtnZonas').click();
  await page.locator('[data-ub-todos]').click();
  await expect(page.locator('#usuariosList .tree-name')).toHaveCount(6);
  await expect(page.locator('#ubChipFiltro')).toHaveCount(0);

  await page.locator('#usuariosBtnZonas').click();
  await page.locator('[data-ub-zona="Alta Gracia"]').click();
  await expect(page.locator('#usuariosList .tree-name')).toHaveCount(3);
  await page.locator('#ubChipFiltro [data-ub-quitar]').click();
  await expect(page.locator('#usuariosList .tree-name')).toHaveCount(6);
});

test('la ficha de cada persona conserva sus acciones', async ({ page }) => {
  await entrar(page);
  const ficha = page.locator('#usuariosList .tree-node').first();
  await ficha.click();
  await expect(ficha).toHaveClass(/expanded/);

  const detalle = page.locator('#usuariosList .tree-children').first();
  await expect(detalle).toContainText('3515551001');
  await expect(detalle).toContainText('San Martín 120');
  await expect(detalle.locator('[data-u-action="neighbors"]')).toBeVisible();
  await expect(detalle.locator('[data-u-action="whatsapp"]')).toBeVisible();
});

test('las herramientas viven arriba y Tarjetas abre su popup', async ({ page }) => {
  await entrar(page, {
    tarjetas: { byKey: { 'tel:3515551001': [{ marca: 'visa', banco: 'galicia' }] } }
  });

  // Cuatro a la vista (Mapa se quitó en v332); el quinto es Limpiar, que
  // aparece sólo con un filtro.
  const tools = page.locator('.u-tools button:visible');
  await expect(tools).toHaveCount(4);
  await expect(page.locator('#usuariosBtnLimpiar')).toBeHidden();
  await expect(page.locator('#usuariosBtnTarjetas')).toBeVisible();
  await expect(page.locator('#usuariosBtnZonas')).toBeVisible();
  // Exportar CSV se quitó a pedido.
  await expect(page.locator('#usuariosBtnExport')).toHaveCount(0);

  await page.locator('#usuariosBtnTarjetas').click();
  await expect(page.locator('#ubOverlay')).toHaveClass(/open/);
  await expect(page.locator('#ubTitulo')).toContainText('Tarjetas');
  // El mensaje de promo sigue viviendo arriba, dentro del popup.
  await expect(page.locator('#ubMsg')).toBeVisible();
  await expect(page.locator('#ubCuerpo .ub-item')).toContainText('Visa Galicia');
});

test('elegir una tarjeta filtra la lista y deja un chip para soltarlo', async ({ page }) => {
  await entrar(page, {
    tarjetas: {
      byKey: {
        'tel:3515551001': [{ marca: 'visa', banco: 'galicia' }],
        'tel:3515551004': [{ marca: 'visa', banco: 'galicia' }]
      }
    }
  });

  await page.locator('#usuariosBtnTarjetas').click();
  await page.locator('[data-ub-marca="visa"][data-ub-banco="galicia"]').click();

  // El popup pasa a mostrar la gente de esa tarjeta.
  await expect(page.locator('#ubCuerpo .ub-persona')).toHaveCount(2);
  await page.locator('#ubCerrar').click();

  // Detrás, la lista quedó recortada a esas dos personas.
  await expect(page.locator('#usuariosList .tree-name')).toHaveCount(2);

  // Y aparece el aviso del filtro, con su cruz para quitarlo.
  const chip = page.locator('#ubChipFiltro');
  await expect(chip).toContainText('Visa Galicia');
  await chip.locator('[data-ub-quitar]').click();
  await expect(page.locator('#usuariosList .tree-name')).toHaveCount(6);
});

test('sin tarjetas cargadas el popup lo explica en vez de quedar vacío', async ({ page }) => {
  await entrar(page);
  await page.locator('#usuariosBtnTarjetas').click();
  await expect(page.locator('#ubCuerpo')).toContainText('Todavía no hay tarjetas cargadas');
  await expect(page.locator('#ubCuerpo .ub-item')).toHaveCount(0);
});

test('el popup se cierra con Escape y tocando fuera', async ({ page }) => {
  await entrar(page);

  await page.locator('#usuariosBtnTarjetas').click();
  await expect(page.locator('#ubOverlay')).toHaveClass(/open/);
  await page.keyboard.press('Escape');
  await expect(page.locator('#ubOverlay')).not.toHaveClass(/open/);

  await page.locator('#usuariosBtnTarjetas').click();
  await expect(page.locator('#ubOverlay')).toHaveClass(/open/);
  await page.locator('#ubOverlay').click({ position: { x: 12, y: 300 } });
  await expect(page.locator('#ubOverlay')).not.toHaveClass(/open/);
});
