const { test, expect } = require('@playwright/test');

// En Usuarios hay dos botones: "Barrios" y "Tarjetas". Cada uno abre un popup
// con su listado; al elegir un ítem el popup se cierra y el listado grande de
// la pantalla queda filtrado por esa elección. Los dos filtros son excluyentes.

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
  { id: 5, usuario: 'Elsa Mota', telf: '3515551005', domicilio: 'Río Ceballos 91', localidad: 'Villa Allende', producto: 'PSA', cp: '5105', fVenceRaw: '17/12/2026', fVence: dias(120), estado: 'vigente' }
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
  await expect(page.locator('#ubBtnBarrios')).toBeVisible();
}

test('hay dos botones y ningún desplegable de zona', async ({ page }) => {
  await entrar(page);

  // Exactamente dos: Barrios y Tarjetas. Ni uno por barrio ni uno por tarjeta.
  await expect(page.locator('#usuariosFiltroBotones .ub-main')).toHaveCount(2);
  await expect(page.locator('#ubBtnBarrios')).toContainText('Barrios');
  await expect(page.locator('#ubBtnTarjetas')).toContainText('Tarjetas');
  await expect(page.locator('#usuariosSelectZona')).toHaveCount(0);

  // Van arriba del buscador.
  const orden = await page.evaluate(() => {
    const botones = document.getElementById('usuariosFiltroBotones');
    const buscador = document.querySelector('#view-usuarios .search-box');
    return botones.compareDocumentPosition(buscador) & Node.DOCUMENT_POSITION_FOLLOWING ? 'botones primero' : 'buscador primero';
  });
  expect(orden).toBe('botones primero');
});

test('el popup de Barrios lista cada barrio con su cantidad', async ({ page }) => {
  await entrar(page);
  await page.locator('#ubBtnBarrios').click();

  await expect(page.locator('#ubOverlay')).toHaveClass(/open/);
  await expect(page.locator('#ubTitulo')).toContainText('Barrios');
  await expect(page.locator('#ubSub')).toContainText('2 barrios');

  const items = page.locator('#ubCuerpo .ub-item');
  await expect(items).toHaveCount(2);
  await expect(items.nth(0)).toContainText('Alta Gracia');
  await expect(items.nth(0)).toContainText('3');
  await expect(items.nth(1)).toContainText('Villa Allende');
  await expect(items.nth(1)).toContainText('2');
  await expect(page.locator('[data-ub-todos]')).toContainText('Todos los barrios');
});

test('elegir un barrio cierra el popup y filtra el listado', async ({ page }) => {
  await entrar(page);
  await expect(page.locator('#usuariosList .tree-node')).toHaveCount(5);

  await page.locator('#ubBtnBarrios').click();
  await page.locator('[data-ub-zona="Villa Allende"]').click();

  // El popup se cierra solo y el listado grande queda recortado.
  await expect(page.locator('#ubOverlay')).not.toHaveClass(/open/);
  await expect(page.locator('#usuariosList .tree-node')).toHaveCount(2);
  await expect(page.locator('#usuariosList')).toContainText('Diego Paz');
  await expect(page.locator('#usuariosList')).not.toContainText('Ana Gómez');

  // El botón deja de decir "Barrios" y muestra el filtro puesto.
  await expect(page.locator('#ubBtnBarrios')).toContainText('Villa Allende');
  await expect(page.locator('#ubBtnBarrios')).toHaveClass(/on/);
});

test('"Todos los barrios" y la cruz del botón devuelven el listado completo', async ({ page }) => {
  await entrar(page);

  await page.locator('#ubBtnBarrios').click();
  await page.locator('[data-ub-zona="Alta Gracia"]').click();
  await expect(page.locator('#usuariosList .tree-node')).toHaveCount(3);

  // Desde adentro del popup.
  await page.locator('#ubBtnBarrios').click();
  await page.locator('[data-ub-todos]').click();
  await expect(page.locator('#usuariosList .tree-node')).toHaveCount(5);
  await expect(page.locator('#ubBtnBarrios')).toContainText('Barrios');

  // Y con la cruz del propio botón.
  await page.locator('#ubBtnBarrios').click();
  await page.locator('[data-ub-zona="Alta Gracia"]').click();
  await expect(page.locator('#usuariosList .tree-node')).toHaveCount(3);
  await page.locator('[data-ub-quitar="zona"]').click();
  await expect(page.locator('#usuariosList .tree-node')).toHaveCount(5);
});

test('el popup de Tarjetas filtra y reemplaza al filtro de barrio', async ({ page }) => {
  // Ana (Alta Gracia) y Diego (Villa Allende) comparten Visa Galicia.
  await entrar(page, {
    tarjetas: {
      byKey: {
        'tel:3515551001': [{ marca: 'visa', banco: 'galicia' }],
        'tel:3515551004': [{ marca: 'visa', banco: 'galicia' }],
        'tel:3515551002': [{ marca: 'mastercard', banco: 'macro' }]
      }
    }
  });

  await page.locator('#ubBtnBarrios').click();
  await page.locator('[data-ub-zona="Alta Gracia"]').click();
  await expect(page.locator('#usuariosList .tree-node')).toHaveCount(3);

  await page.locator('#ubBtnTarjetas').click();
  await expect(page.locator('#ubTitulo')).toContainText('Tarjetas');
  const items = page.locator('#ubCuerpo .ub-item');
  await expect(items.nth(0)).toContainText('Visa Galicia');
  await expect(items.nth(0)).toContainText('2');
  await page.locator('[data-ub-marca="visa"][data-ub-banco="galicia"]').click();

  // Los filtros no se acumulan: al poner la tarjeta, el barrio se suelta y
  // aparece Diego, que es de otro barrio.
  await expect(page.locator('#usuariosList .tree-node')).toHaveCount(2);
  await expect(page.locator('#usuariosList')).toContainText('Ana Gómez');
  await expect(page.locator('#usuariosList')).toContainText('Diego Paz');
  await expect(page.locator('#ubBtnTarjetas')).toContainText('Visa Galicia');
  await expect(page.locator('#ubBtnBarrios')).toContainText('Barrios');
  await expect(page.locator('#ubBtnBarrios')).not.toHaveClass(/on/);
});

test('el mensaje de promo se escribe dentro del popup y no en la pantalla', async ({ page }) => {
  await entrar(page, {
    tarjetas: { byKey: { 'tel:3515551001': [{ marca: 'visa', banco: 'galicia' }] } }
  });

  // El bloque "Promos con tarjeta" ya no ocupa lugar en la pantalla.
  await expect(page.locator('#usuariosTarjetasBar')).toBeHidden();

  await page.locator('#ubBtnTarjetas').click();
  const caja = page.locator('#ubMsg');
  await expect(caja).toBeVisible();

  // Va arriba de la lista de tarjetas.
  const orden = await page.evaluate(() => {
    const msg = document.querySelector('.ub-msg');
    const lista = document.querySelector('#ubCuerpo .ub-list');
    return msg.compareDocumentPosition(lista) & Node.DOCUMENT_POSITION_FOLLOWING ? 'mensaje primero' : 'lista primero';
  });
  expect(orden).toBe('mensaje primero');

  await caja.fill('Hola {nombre}, promo con {tarjeta} este mes');
  // El texto queda guardado en el módulo, que es quien arma cada WhatsApp.
  expect(await page.evaluate(() => window.APPITarjetas.mensajeActual()))
    .toBe('Hola {nombre}, promo con {tarjeta} este mes');

  // Y sigue ahí al reabrir el popup.
  await page.locator('#ubCerrar').click();
  await page.locator('#ubBtnTarjetas').click();
  await expect(page.locator('#ubMsg')).toHaveValue('Hola {nombre}, promo con {tarjeta} este mes');
});

test('al elegir una tarjeta el popup muestra su gente con el botón de avisar', async ({ page }) => {
  await entrar(page, {
    tarjetas: {
      byKey: {
        'tel:3515551001': [{ marca: 'visa', banco: 'galicia' }],
        'tel:3515551004': [{ marca: 'visa', banco: 'galicia' }]
      }
    }
  });
  await page.evaluate(() => {
    window.__appiLastOpen = null;
    window.open = url => { window.__appiLastOpen = url; return { closed:false, close(){}, location:{} }; };
    if (window.APPIWhatsApp) window.APPIWhatsApp.abrir = url => { window.__appiLastOpen = url; return Promise.resolve(true); };
  });

  await page.locator('#ubBtnTarjetas').click();
  await page.locator('#ubMsg').fill('Hola {nombre}, promo con {tarjeta}');
  await page.locator('[data-ub-marca="visa"][data-ub-banco="galicia"]').click();

  // El popup sigue abierto y ahora muestra a las dos personas.
  await expect(page.locator('#ubOverlay')).toHaveClass(/open/);
  await expect(page.locator('#ubTitulo')).toContainText('Visa Galicia');
  await expect(page.locator('#ubCuerpo .ub-persona')).toHaveCount(2);
  await expect(page.locator('#ubCuerpo')).toContainText('Ana Gómez');
  await expect(page.locator('#ubCuerpo')).toContainText('Diego Paz');

  // Y el listado grande quedó filtrado por detrás.
  await expect(page.locator('#usuariosList .tree-node')).toHaveCount(2);

  // Avisar arma el WhatsApp con el mensaje escrito arriba.
  await page.locator('[data-ub-wa="0"]').click();
  const url = await page.evaluate(() => window.__appiLastOpen);
  expect(url).toMatch(/^https:\/\/wa\.me\/5493515551001\?text=/);
  const texto = decodeURIComponent(url.split('text=')[1]);
  expect(texto).toContain('Ana');
  expect(texto).toContain('Visa Galicia');

  // Se puede volver a la lista de tarjetas.
  await page.locator('[data-ub-volver]').click();
  await expect(page.locator('#ubCuerpo .ub-item')).toHaveCount(1);
  await expect(page.locator('#ubMsg')).toBeVisible();
});

test('sin tarjetas cargadas el popup lo explica en vez de quedar vacío', async ({ page }) => {
  await entrar(page);
  await page.locator('#ubBtnTarjetas').click();
  await expect(page.locator('#ubCuerpo')).toContainText('Todavía no hay tarjetas cargadas');
  await expect(page.locator('#ubCuerpo .ub-item')).toHaveCount(0);
});

test('el popup se cierra con Escape y tocando fuera', async ({ page }) => {
  await entrar(page);

  await page.locator('#ubBtnBarrios').click();
  await expect(page.locator('#ubOverlay')).toHaveClass(/open/);
  await page.keyboard.press('Escape');
  await expect(page.locator('#ubOverlay')).not.toHaveClass(/open/);

  await page.locator('#ubBtnBarrios').click();
  await expect(page.locator('#ubOverlay')).toHaveClass(/open/);
  await page.locator('#ubOverlay').click({ position: { x: 12, y: 300 } });
  await expect(page.locator('#ubOverlay')).not.toHaveClass(/open/);
});
