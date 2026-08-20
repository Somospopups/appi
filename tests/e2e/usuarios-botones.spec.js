const { test, expect } = require('@playwright/test');

// En Usuarios la lista se agrupa por barrio: cada barrio es una sección que se
// abre en el lugar. Las tarjetas siguen viviendo en su popup, que se abre desde
// la barra de herramientas del pie.

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
  await expect(page.locator('.barrio-grupo').first()).toBeVisible();
}

test('la lista se agrupa por barrio, con su cuenta y las vencidas a la vista', async ({ page }) => {
  await entrar(page);

  // Un grupo por barrio, alfabético, y "Sin barrio" al final.
  const grupos = page.locator('.barrio-grupo');
  await expect(grupos).toHaveCount(3);
  await expect(grupos.nth(0)).toContainText('Alta Gracia');
  await expect(grupos.nth(1)).toContainText('Villa Allende');
  await expect(grupos.nth(2)).toContainText('Sin barrio');

  // Cada cabecera dice cuántos hay y cuántas vencidas.
  await expect(grupos.nth(0).locator('.barrio-cuenta')).toHaveText('3');
  await expect(grupos.nth(0).locator('.barrio-alerta')).toHaveText('1 vencida');
  await expect(grupos.nth(1).locator('.barrio-cuenta')).toHaveText('2');
  // Sin vencidas no se muestra la alerta: no hay por qué alarmar de más.
  await expect(grupos.nth(2).locator('.barrio-alerta')).toHaveCount(0);

  // Ya no hay desplegable de zona ni botón de Barrios: el barrio es la lista.
  await expect(page.locator('#usuariosSelectZona')).toHaveCount(0);
  await expect(page.locator('#ubBtnBarrios')).toHaveCount(0);
});

test('los barrios arrancan cerrados y se abren en el lugar', async ({ page }) => {
  await entrar(page);
  await expect(page.locator('.barrio-grupo.abierto')).toHaveCount(0);

  const altaGracia = page.locator('.barrio-grupo', { hasText: 'Alta Gracia' });
  await altaGracia.locator('.barrio-cab').click();
  await expect(altaGracia).toHaveClass(/abierto/);
  await expect(altaGracia.locator('.tree-node')).toHaveCount(3);
  await expect(altaGracia).toContainText('Ana Gómez');

  // Se puede abrir un segundo barrio sin que se cierre el primero: comparar
  // dos zonas es habitual.
  const villaAllende = page.locator('.barrio-grupo', { hasText: 'Villa Allende' });
  await villaAllende.locator('.barrio-cab').click();
  await expect(villaAllende).toHaveClass(/abierto/);
  await expect(altaGracia).toHaveClass(/abierto/);

  // Y se cierra volviendo a tocarlo.
  await altaGracia.locator('.barrio-cab').click();
  await expect(altaGracia).not.toHaveClass(/abierto/);
  await expect(villaAllende).toHaveClass(/abierto/);
});

test('dentro de un barrio la ficha de cada persona conserva sus acciones', async ({ page }) => {
  await entrar(page);
  const altaGracia = page.locator('.barrio-grupo', { hasText: 'Alta Gracia' });
  await altaGracia.locator('.barrio-cab').click();

  const ficha = altaGracia.locator('.tree-node').first();
  await ficha.click();
  await expect(ficha).toHaveClass(/expanded/);

  const detalle = altaGracia.locator('.tree-children').first();
  await expect(detalle).toContainText('3515551001');
  await expect(detalle).toContainText('San Martín 120');
  await expect(detalle.locator('[data-u-action="map"]')).toBeVisible();
  await expect(detalle.locator('[data-u-action="whatsapp"]')).toBeVisible();
  await expect(detalle.locator('[data-u-action="neighbors"]')).toBeVisible();
});

test('el barrio abierto sigue abierto después de buscar', async ({ page }) => {
  await entrar(page);
  const altaGracia = page.locator('.barrio-grupo', { hasText: 'Alta Gracia' });
  await altaGracia.locator('.barrio-cab').click();
  await expect(altaGracia).toHaveClass(/abierto/);

  // Buscar rehace la lista; el barrio que se estaba mirando no debe cerrarse.
  await page.locator('#usuariosSearch').fill('Gómez');
  await expect(page.locator('.barrio-grupo')).toHaveCount(1);
  await expect(page.locator('.barrio-grupo')).toHaveClass(/abierto/);
  await expect(page.locator('.barrio-grupo')).toContainText('Ana Gómez');
});

test('con un solo barrio en pantalla se abre solo', async ({ page }) => {
  await entrar(page);
  // La búsqueda deja un único barrio: obligar a un toque más sería de más.
  await page.locator('#usuariosSearch').fill('Villa Allende');
  await expect(page.locator('.barrio-grupo')).toHaveCount(1);
  await expect(page.locator('.barrio-grupo')).toHaveClass(/abierto/);
  await expect(page.locator('.tree-node')).toHaveCount(2);
});

test('las herramientas viven al pie y Tarjetas abre su popup', async ({ page }) => {
  await entrar(page, {
    tarjetas: { byKey: { 'tel:3515551001': [{ marca: 'visa', banco: 'galicia' }] } }
  });

  const tools = page.locator('.u-tools button');
  await expect(tools).toHaveCount(5);
  await expect(page.locator('#usuariosBtnTarjetas')).toBeVisible();
  await expect(page.locator('#usuariosBtnMapAll')).toBeVisible();
  await expect(page.locator('#usuariosBtnExport')).toBeVisible();

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

  // Detrás, la lista quedó recortada a esas dos personas, cada una en su barrio.
  await expect(page.locator('.barrio-grupo')).toHaveCount(2);
  await expect(page.locator('.tree-node')).toHaveCount(2);

  // Y aparece el chip que avisa del filtro, con su cruz para quitarlo.
  const chip = page.locator('#usuariosFiltroBotones .ub-chip');
  await expect(chip).toContainText('Visa Galicia');
  await chip.locator('[data-ub-quitar]').click();
  await expect(page.locator('.tree-node')).toHaveCount(6);
  await expect(page.locator('#usuariosFiltroBotones .ub-chip')).toHaveCount(0);
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
