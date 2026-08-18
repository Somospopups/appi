const { test, expect } = require('@playwright/test');

const USER_ID = '11111111-1111-4111-8111-111111111111';
const hoy = new Date().toISOString();

function tokenFor(sub) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${header}.${payload}.firma`;
}

const EQUIPO = {
  titular: { dip: '02-9802014', nombre: 'María Pérez', categoria: 'DC' },
  personas: [{
    id: 0, nivel: 0, codigo: '02-9802014', nombre: 'María Pérez', cat: 'DC', pnAct: 12,
    hijos: [
      { id: 1, nivel: 1, codigo: '111', nombre: 'Ana Gómez', cat: 'D', pnAct: 9, alta: hoy, hijos: [{ id: 9, nivel: 2, codigo: '999', nombre: 'Nieto', cat: 'DJ', pnAct: 1, hijos: [] }] },
      { id: 2, nivel: 1, codigo: '222', nombre: 'Pedro Díaz', cat: 'DJ', pnAct: 0, hijos: [] }
    ]
  }]
};
EQUIPO.raices = EQUIPO.personas;
const CONTACTOS = [
  { id: 'c1', estado: 'presentacion', nombre: 'Lucía Vega', telefono: '1', telefono_normalizado: '3515550003', tipo: 'contacto', created_at: hoy, updated_at: hoy },
  { id: 'c2', estado: 'convertido', nombre: 'Raúl Paredes', telefono: '2', telefono_normalizado: '3515550004', tipo: 'contacto', created_at: hoy, updated_at: hoy }
];

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
  await page.addInitScript(([uid, equipo, contactos]) => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('tutoVisto_v2', '1');
    localStorage.setItem('equipoData', JSON.stringify(equipo));
    localStorage.setItem(`appi_gestion_cache_v1_${uid}`, JSON.stringify({ contacts: contactos, surveys: [], activities: [], savedAt: Date.now() }));
  }, [USER_ID, EQUIPO, CONTACTOS]);
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
  await page.evaluate(() => window.showView('view-negocio'));
}

test('el GPS del mes lee la Línea y el Panel', async ({ page }) => {
  await entrar(page);
  const gps = page.locator('#gpsBlock');
  await expect(gps).toBeVisible();
  await expect(gps).toContainText('12 / 12');   // PB personales
  await expect(gps).toContainText('1 / 2');     // patrocinios con 9 PB
  await expect(gps).toContainText('2 / 30');    // demos autoregistradas
  await expect(gps).toContainText('1 / 10');    // cierres
  await expect(gps).toContainText('Vas encaminado');
});

test('la botella calcula conciencia y se comparte', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.abrirBotella());
  await page.locator('#botPorDia').fill('3');
  await page.locator('#botPrecio').fill('1000');
  await expect(page.locator('#botResult')).toContainText('90.000');      // por mes
  await expect(page.locator('#botResult')).toContainText('3.240.000');   // en 3 años
  await expect(page.locator('#botEco')).toContainText('plástico');
  await expect(page.locator('#botEco')).toContainText('kg');
  await expect(page.locator('#botEco')).toContainText('m²');
  await expect(page.locator('#botEco')).toContainText('450 años');
  await expect(page.locator('#botEco')).toContainText('petróleo');
  const kg3 = await page.locator('#botEco').innerText();
  expect(kg3).toMatch(/48[.,]2/); // 3 botellas × 365 × 44 g
  await page.locator('#botPorDia').fill('2');
  await expect(page.locator('#botEco')).toContainText(/32[.,]1/);
  await expect(page.locator('#botShare')).toBeVisible();
});

test('el simulador suma comercialización y red', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.abrirSimulador());
  await expect(page.locator('#simResult')).toContainText('3.240.000');   // 10 cierres
  await expect(page.locator('#simResult')).toContainText('3.762.000');   // 100 de red
  await expect(page.locator('#simResult')).toContainText('7.002.000');   // total
});

test('demos y cierres se mueven con la regla 3 a 1', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.abrirSimulador());
  await expect(page.locator('#simDemos')).toHaveValue('30');
  await expect(page.locator('#simCierres')).toHaveValue('10');

  await page.locator('#simDemos').evaluate(el => { el.value = '15'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await expect(page.locator('#simDemos')).toHaveValue('15');
  await expect(page.locator('#simCierres')).toHaveValue('5');
  await expect(page.locator('#simDemosV')).toHaveText('15');
  await expect(page.locator('#simCierresV')).toHaveText('5');
  await expect(page.locator('#simResult')).toContainText('1.620.000');

  await page.locator('#simCierres').evaluate(el => { el.value = '8'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await expect(page.locator('#simCierres')).toHaveValue('8');
  await expect(page.locator('#simDemos')).toHaveValue('24');
  await expect(page.locator('#simCierresV')).toHaveText('8');
  await expect(page.locator('#simDemosV')).toHaveText('24');
  await expect(page.locator('#simResult')).toContainText('2.592.000');

  await page.locator('#simCierres').evaluate(el => { el.value = '0'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await expect(page.locator('#simDemos')).toHaveValue('0');
  await expect(page.locator('#simCierres')).toHaveValue('0');
});

test('el stock se carga en Mis herramientas y sobrevive el refresco', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.openStock());
  await expect(page.locator('#view-stock')).toHaveClass(/active/);
  await expect(page.locator('#view-presu #stockCard')).toHaveCount(0);
  await page.locator('#stNombre').fill('Iontrix 2');
  await page.locator('#stAdd').click();
  await expect(page.locator('#stockCont')).toContainText('Iontrix 2');
  await page.reload({ waitUntil: 'networkidle' });
  await page.evaluate(() => window.openStock());
  await expect(page.locator('#stockCont')).toContainText('Iontrix 2');
});

test('prestar saca una unidad y devolverla la vuelve al stock', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.openStock());
  await page.locator('#stNombre').fill('Senior 4');
  await page.locator('#stCant').fill('2');
  await page.locator('#stAdd').click();
  await expect(page.locator('#stockCont')).toContainText('2 unidades');
  await page.locator('[data-st-prestar]').click();
  await expect(page.locator('#stOverlay')).toHaveClass(/open/);
  await page.locator('#stQuien').fill('Laura Gómez');
  await page.locator('#stTel').fill('3515551234');
  await page.locator('#stSavePrestamo').click();
  await expect(page.locator('#stockCont')).toContainText('Prestado a Laura Gómez');
  await expect(page.locator('#stockCont')).toContainText('Senior 4');
  await page.locator('[data-st-tab="stock"]').click();
  await expect(page.locator('#stockCont')).toContainText('1 unidad');
  await page.locator('[data-st-tab="prestados"]').click();
  await page.locator('[data-st-dev]').click();
  await expect(page.locator('#stockCont')).toContainText('2 unidades');
});

test('eliminar un préstamo no devuelve la unidad al stock', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.openStock());
  await page.locator('#stNombre').fill('Iontrix 2');
  await page.locator('#stAdd').click();
  await page.locator('[data-st-prestar]').click();
  await page.locator('#stQuien').fill('Pedro');
  await page.locator('#stSavePrestamo').click();
  await page.evaluate(() => { window.APPIDialog.confirm = async () => true; });
  await page.locator('[data-st-kill]').click();
  await expect(page.locator('#stockCont')).toContainText('Nada prestado');
  await page.locator('[data-st-tab="stock"]').click();
  await expect(page.locator('#stockCont')).toContainText('Todavía no cargaste productos');
});

test('en el Árbol el nombre abre la ficha y la categoría abre la organización', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.openEquipo());
  await page.locator('.equipo-tab[data-eqtab="arbol"]').click();
  const raiz = page.locator('#treeContainer .tree-node').first();
  await expect(raiz).toBeVisible();
  await expect(page.locator('#treeContainer .tree-children').first()).not.toHaveClass(/open/);

  await raiz.locator('.tree-name').click();
  await expect(page.locator('#modalOverlay')).toHaveClass(/open/);
  await expect(page.locator('#modalTitle')).toContainText('María Pérez');
  await page.evaluate(() => {
    const el = document.getElementById('modalOverlay');
    el.classList.remove('open');
    if (window.liberarScrollCuerpo) window.liberarScrollCuerpo();
  });
  await expect(page.locator('#modalOverlay')).not.toHaveClass(/open/);

  await page.locator('#treeContainer .tree-expand').first().click();
  await expect(page.locator('#treeContainer .tree-node').first()).toHaveClass(/expanded/);
  await expect(page.locator('#treeContainer .tree-children').first()).toHaveClass(/open/);
  await expect(page.locator('#treeContainer')).toContainText('Ana Gómez');
  await expect(page.locator('#modalOverlay')).not.toHaveClass(/open/);
});

test('Mi Equipo ya no muestra la tarjeta de Duplicación de este mes', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.showView('view-equipo'));
  await expect(page.locator('#dupCard')).toHaveCount(0);
  await expect(page.locator('#dupCardWrap')).toHaveCount(0);
  await expect(page.locator('#view-equipo')).not.toContainText('Duplicación de este mes');
});
