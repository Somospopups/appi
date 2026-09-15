const { test, expect } = require('@playwright/test');

// El listado del día (v804): la tarjeta Usuarios del mazo del Home muestra
// SIEMPRE a la gente del día, persona por persona (como la tarjeta de
// reempadronamiento: sin botones por fila). El color refleja la marca de la
// tarea: verde = ya la hice, roja = no la hice. Al volver al Home el listado
// se re-arma y los colores quedan a punto.

const USER_ID = '11111111-1111-4111-8111-111111111113';

function tokenFor(sub) {
  const h = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${h}.${p}.firma`;
}
const dias = n => new Date(Date.now() + n * 86400000).toISOString();
const ddmmyyyy = n => {
  const d = new Date(Date.now() + n * 86400000);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

// Uno porvenciendo (vida útil) + dos con equipo vencido (renovación).
const USUARIOS = [
  { id: 1, usuario: 'GOMEZ, ANA MARIA', telf: '3515551001', localidad: 'Alta Gracia', producto: 'PSA SENIOR 4',
    fCompra: ddmmyyyy(-300), fVenceRaw: ddmmyyyy(15), fVence: dias(15), estado: 'vigente' },
  { id: 2, usuario: 'RUIZ, ROBERTO', telf: '3515551002', localidad: 'Villa Allende', producto: 'PSA VERO',
    fCompra: ddmmyyyy(-800), fVenceRaw: ddmmyyyy(-40), fVence: dias(-40), estado: 'vencida' },
  { id: 3, usuario: 'DIAZ, CAROLINA', telf: '3515551003', localidad: 'Centro', producto: 'SODA BURBY',
    fCompra: ddmmyyyy(-700), fVenceRaw: ddmmyyyy(-200), fVence: dias(-200), estado: 'vencida' }
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
  await page.route('**/tile.openstreetmap.org/**', route => route.abort());
  await page.addInitScript((u) => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('appi_tarjetas_auto', '0');
    localStorage.setItem('tutoVisto_v2', '1');
    localStorage.setItem('usuarios_garantias', JSON.stringify(u));
  }, USUARIOS);
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
  await page.evaluate(() => window.showView('view-home'));
}

// Abre el mazo y avanza hasta que la tarjeta del listado del día quede en
// la cima. En PC (cover) solo la tarjeta frontal (ht-front) queda cableada;
// en celular la de arriba es la que no lleva detras1/detras2.
async function irATarjetaHoy(page) {
  await page.evaluate(() => window.APPIHomeTarjetas.abrir());
  await expect(page.locator('#htOverlay')).toBeVisible({ timeout: 10000 });
  const frontEsUsuarios = () => page.evaluate(() => {
    const f = document.querySelector('#htDeck .ht-card.ht-front') ||
              document.querySelector('#htDeck .ht-card:not(.detras1):not(.detras2)');
    return !!f && f.classList.contains('ht-cat-usuarios');
  });
  for (let i = 0; i < 14; i++) {
    if (await frontEsUsuarios()) return;
    await page.evaluate(() => window.APPIHomeTarjetas.pasar());
    await page.waitForTimeout(420);
  }
  throw new Error('no se encontró la tarjeta del listado del día');
}

const topCard = (page) => page.locator('#htDeck .ht-card.ht-cat-usuarios').first();
const fila = (page, i) => topCard(page).locator('.ht-lista li').nth(i);

// Marca a la gente del día como lo hace la propia tarea (APPIMensajes) y
// simula el regreso al Home: el Home se reconstruye y el mazo vuelve a
// armarse con tarjetas nuevas (colores a punto), como para el usuario real.
// Se marca por teléfono para no depender del orden de los grupos.
async function marcarYVolver(page, marcas) {
  await page.evaluate((marcas) => {
    const M = window.APPIMensajes;
    const grupos = M.deHoy();
    marcas.forEach(({ telf, estado }) => {
      let ok = false;
      for (const g of grupos) {
        const u = g.gente.find(x => String(x.telf || '').replace(/\D/g, '') === telf);
        if (u) { M.marcarAccion(g.motivo.id, u, estado); ok = true; break; }
      }
      if (!ok) throw new Error('no se encontró al usuario ' + telf);
    });
  }, marcas);
  await page.evaluate(() => {
    window.showView('view-usuarios');
    window.showView('view-home');
  });
  await page.waitForTimeout(300);
  await irATarjetaHoy(page); // re-abre el mazo reconstruido con lo nuevo
}

test('el listado se muestra completo, sin botones, y la ✓ de la tarea lo pinta verde', async ({ page }) => {
  await entrar(page);
  const total = await page.evaluate(() => window.APPIMensajes.resumenHoy().total);
  expect(total).toBe(3);
  await irATarjetaHoy(page);
  // Las 3 personas del día, persona por persona, siempre visibles.
  await expect(topCard(page).locator('.ht-lista li')).toHaveCount(3);
  await expect(topCard(page)).toContainText('Gomez');
  await expect(topCard(page)).toContainText('Ruiz');
  await expect(topCard(page)).toContainText('Diaz');
  // Sin botones ✓/✗ por fila (como la tarjeta de reempadronamiento).
  expect(await topCard(page).locator('button[data-mu-ok]').count()).toBe(0);
  expect(await topCard(page).locator('button[data-mu-no]').count()).toBe(0);
  expect(await topCard(page).locator('[data-mu-marcas]').count()).toBe(0);
  // La tarea marca a la primera persona…
  await marcarYVolver(page, [{ telf: '3515551001', estado: 'hecha' }]); // Gomez (fila 0)
  // …y la fila se colorea verde.
  await expect(fila(page, 0)).toHaveClass(/ht-hecho/, { timeout: 5000 });
  await expect(topCard(page).locator('.ht-chips')).toContainText('✓ 1');
  const st = await page.evaluate(() => window.APPIMensajes.resumenHoy());
  expect(st.hechas).toBe(1);
  expect(st.pendientes).toBe(2);
});

test('la ✗ de la tarea pinta la fila roja y tocarla abre el carrusel', async ({ page }) => {
  await entrar(page);
  await irATarjetaHoy(page);
  // Ruiz (fila 1) la marca sin hacer.
  await marcarYVolver(page, [{ telf: '3515551002', estado: 'no_hecha' }]);
  await expect(fila(page, 1)).toHaveClass(/ht-no-hecha/, { timeout: 5000 });
  await expect(topCard(page).locator('.ht-chips')).toContainText('✗ 1');
  const st = await page.evaluate(() => window.APPIMensajes.resumenHoy());
  expect(st.noHechas).toBe(1);
  // Tocar la fila abre el carrusel de Usuarios (la marca se hace ahí).
  await fila(page, 1).click();
  await expect(page.locator('#view-usuarios')).toHaveClass(/active/, { timeout: 5000 });
});

test('los colores persisten al volver a armar la tarjeta', async ({ page }) => {
  await entrar(page);
  await irATarjetaHoy(page);
  await marcarYVolver(page, [
    { telf: '3515551001', estado: 'hecha' },    // Gomez (fila 0)
    { telf: '3515551003', estado: 'no_hecha' }  // Diaz (fila 2)
  ]);
  await expect(fila(page, 0)).toHaveClass(/ht-hecho/);
  await expect(fila(page, 2)).toHaveClass(/ht-no-hecha/);
  // Se cierra el mazo y se vuelve a armar: los colores siguen.
  await page.evaluate(() => window.APPIHomeTarjetas.cerrar());
  const html = await page.evaluate(() => {
    const t = window.APPIHomeTarjetas.armarTarjetas().find(x => x.cat === 'usuarios');
    return t ? t.html : '';
  });
  expect(html).toContain('ht-hecho');
  expect(html).toContain('ht-no-hecha');
  expect(html).not.toContain('data-mu-ok');
  expect(html).not.toContain('data-mu-no');
});


module.exports = { entrar, irATarjetaHoy };
