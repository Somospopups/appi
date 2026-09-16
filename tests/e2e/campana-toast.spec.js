const { test, expect } = require('@playwright/test');

const USER_ID = '11111111-1111-4111-8111-111111111111';
function tokenFor(sub) {
  const h = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${h}.${p}.firma`;
}

const dias = n => new Date(Date.now() + n * 86400000).toISOString();
const fechaISO = n => dias(n).slice(0, 10);

const AVISO = {
  id: 'anuncio-test-campana',
  texto: 'Reunión de equipo este jueves.',
  eventos: [
    { titulo: 'Reunión semanal', fecha: fechaISO(2), hora: '20:00', lugar: 'Zoom' }
  ],
  activo: true,
  creado_en: new Date().toISOString()
};

async function loginConAviso(page) {
  const accessToken = tokenFor(USER_ID);
  const profile = {
    user_id: USER_ID, username: null, dip: '02-9802014', sucursal: '02', numero_distribuidor: '9802014',
    nombre: 'Distribuidor Prueba', socio_nombre: null, rol: 'usuario', activo: true, debe_cambiar_password: false,
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
    if (url.pathname === '/rest/v1/appi_anuncios') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([AVISO]) });
    return route.fulfill({ status: 200, headers: cors, body: '[]' });
  });
  await page.route('**/tile.openstreetmap.org/**', route => route.abort());
  await page.addInitScript(() => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('appi_tarjetas_auto', '0');
    localStorage.setItem('turoVisto_v2', '1');
    localStorage.setItem('tutoVisto_v2', '1');
  });

  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
  await page.evaluate(() => {
    const b = document.getElementById('bootScreen');
    if (b) { b.classList.add('gone'); b.remove(); }
  });

  await page.evaluate(() => window.APPIAnuncios.revisar());
  await page.waitForTimeout(400);

  // Cerrar el popup de aviso si saltó para ver la campanita en el header
  const anPop = page.locator('#anPop');
  if (await anPop.isVisible()) {
    await page.locator('#anOk').click();
  }
}

test.describe('Campana de anuncios fija en header y toast sobre modals', () => {

  test('la campanita se ubica en el header junto a herramientas y ayuda en mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginConAviso(page);

    const bell = page.locator('#anBell');
    await expect(bell).toBeVisible();

    const bellBox = await bell.boundingBox();
    const toolsBox = await page.locator('.home-header .tools-btn').boundingBox();
    const helpBox = await page.locator('#btnHelpHome').boundingBox();

    expect(bellBox).not.toBeNull();
    expect(toolsBox).not.toBeNull();
    expect(helpBox).not.toBeNull();

    // La campanita está a la izquierda de engranaje (right: 88px vs right: 44px)
    expect(bellBox.x + bellBox.width).toBeLessThanOrEqual(toolsBox.x + 2);
    // Engranaje a la izquierda de ayuda (right: 44px vs right: 0px)
    expect(toolsBox.x + toolsBox.width).toBeLessThanOrEqual(helpBox.x + 2);
    // Todos tienen dimensiones consistentes (38x38 aprox)
    expect(bellBox.width).toBeGreaterThanOrEqual(36);
    expect(bellBox.height).toBeGreaterThanOrEqual(36);
  });

  test('la campanita acompaña el scroll del header y no se desplaza independientemente', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginConAviso(page);

    const bellBefore = await page.locator('#anBell').boundingBox();
    const toolsBefore = await page.locator('.home-header .tools-btn').boundingBox();

    // Scroll vertical en la página
    await page.evaluate(() => {
      document.getElementById('view-home').style.minHeight = '2500px';
      window.scrollTo(0, 300);
    });
    await page.waitForTimeout(150);

    const bellAfter = await page.locator('#anBell').boundingBox();
    const toolsAfter = await page.locator('.home-header .tools-btn').boundingBox();

    // La relación vertical entre la campanita y las herramientas se mantiene
    const diffBefore = Math.abs(bellBefore.y - toolsBefore.y);
    const diffAfter = Math.abs(bellAfter.y - toolsAfter.y);
    expect(Math.abs(diffBefore - diffAfter)).toBeLessThan(2);
  });

  test('el toast de actualización se ubica por debajo de la versión y por encima de modals', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginConAviso(page);

    await page.evaluate(() => {
      window.showToast('Actualizado ✓ 12:00', 10000);
    });

    const toast = page.locator('#toast');
    await expect(toast).toBeVisible();
    const brandBox = await page.locator('.home-brand-mark').boundingBox();
    // El toast entra deslizándose (translateY -100px → 0 en 350 ms): esperar
    // a que se asiente antes de medir, o en máquinas lentas se lo muestra a
    // mitad de vuelo (y negativo, fuera de la pantalla).
    await expect.poll(async () => (await toast.boundingBox()).y)
      .toBeGreaterThanOrEqual(brandBox.y + brandBox.height);
    const toastBox = await toast.boundingBox();

    // El toast no tapa el texto de versión APPI
    expect(toastBox.y).toBeGreaterThanOrEqual(brandBox.y + brandBox.height);

    // z-index es 100000 (superior a cualquier modal de z-index 9999)
    const zIndex = await page.evaluate(() => {
      return parseInt(window.getComputedStyle(document.getElementById('toast')).zIndex, 10);
    });
    expect(zIndex).toBeGreaterThanOrEqual(100000);
  });

  test('en escritorio la campanita también se alinea en la barra superior', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await loginConAviso(page);

    const bell = page.locator('#anBell');
    await expect(bell).toBeVisible();

    const bellBox = await bell.boundingBox();
    const toolsBox = await page.locator('.home-header .tools-btn').boundingBox();
    const helpBox = await page.locator('#btnHelpHome').boundingBox();

    expect(bellBox.x + bellBox.width).toBeLessThanOrEqual(toolsBox.x + 2);
    expect(toolsBox.x + toolsBox.width).toBeLessThanOrEqual(helpBox.x + 2);
  });

});
