const { test, expect } = require('@playwright/test');

// El Home se partió en "Mi mes" y "Mi negocio", y los avisos quedaron con el
// mismo id en dos lugares. Como el código los llenaba con getElementById —que
// devuelve sólo el primero— la copia de la pantalla nueva quedaba vacía.
// Estas pruebas fijan que los tres avisos lleguen a TODAS sus ubicaciones.

const USER_ID = '11111111-1111-4111-8111-111111111111';

function tokenFor(sub) {
  const h = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${h}.${p}.firma`;
}

// Un equipo con una persona que cumple hoy y otra a un paso del Bonus.
function equipoDePrueba() {
  const hoy = new Date();
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd = String(hoy.getDate()).padStart(2, '0');
  return {
    titular: { dip: '02-9802014', nombre: 'María Pérez' },
    personas: [
      { id: 1, nombre: 'Cumple Hoy', cumple: `1990-${mm}-${dd}`, cat: 'D', pnAct: 3, tel: '3515550001', codigo: '02-1111111' },
      { id: 2, nombre: 'Casi Bonus', cumple: '1985-01-15', cat: 'D', pnAct: 10, tel: '3515550002', codigo: '02-2222222' }
    ]
  };
}

async function abrirApp(page) {
  const now = new Date().toISOString();
  const profile = {
    user_id: USER_ID, username: null, dip: '02-9802014', sucursal: '02', numero_distribuidor: '9802014',
    nombre: 'María Pérez', socio_nombre: null, rol: 'usuario', activo: true, debe_cambiar_password: false,
    membresia_meses: 1, membresia_inicio: now, membresia_vence: new Date(Date.now() + 30 * 86400000).toISOString()
  };

  await page.route('**/auth-config.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: "window.APPI_AUTH={enabled:true,url:'https://mock.supabase.co',anonKey:'anon-key-publica-de-prueba-1234567890',distributorEmailDomain:'distribuidores.appi.invalid',adminLogin:{username:'popups',email:'admin-popups@appi.invalid'},loginAliases:{},offlineDays:7};"
  }));
  await page.route('https://mock.supabase.co/**', route => {
    const url = new URL(route.request().url());
    const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
    if (url.pathname === '/auth/v1/token') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ access_token: tokenFor(USER_ID), refresh_token: 'r', expires_in: 3600, user: { id: USER_ID } }) });
    if (url.pathname === '/rest/v1/appi_perfiles') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([profile]) });
    if (url.pathname === '/functions/v1/dispositivo-puente') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ devices: [] }) });
    return route.fulfill({ status: 200, headers: cors, body: '[]' });
  });

  await page.addInitScript(equipo => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('appi_tarjetas_auto', '0');
    localStorage.setItem('tutoVisto_v2', '1');
    localStorage.setItem('equipoData', JSON.stringify(equipo));
  }, equipoDePrueba());

  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
}

// Cuenta, para un id repetido, cuántas copias hay y cuántas tienen contenido.
async function copias(page, id) {
  return page.evaluate(elId => {
    const nodos = Array.from(document.querySelectorAll('#' + elId));
    return {
      total: nodos.length,
      llenas: nodos.filter(n => n.innerHTML.trim().length > 0).length,
      secciones: nodos.map(n => (n.closest('section') || {}).id || '?')
    };
  }, id);
}

test('los tres avisos viven sólo en el inicio', async ({ page }) => {
  await abrirApp(page);
  await page.evaluate(() => {
    if (window.renderBdayBanner) window.renderBdayBanner();
    if (window.renderBonusNotifs) window.renderBonusNotifs();
    if (window.renderCulturaCrecimiento) window.renderCulturaCrecimiento();
  });
  await page.waitForTimeout(300);

  // Se quitaron de Mi mes y de Mi negocio a pedido: esas pantallas quedan para
  // planificar y para los números, sin avisos encima. Y desde v315 el aviso
  // de Bonus vive en Mi Equipo, después del título.
  for (const id of ['bdayBannerWrap', 'culturaWrap']) {
    const r = await copias(page, id);
    expect(r.total, `${id} debe existir una sola vez`).toBe(1);
    expect(r.secciones[0], `${id} sólo va en el inicio`).toBe('view-home');
  }
  const bonus = await copias(page, 'bonusNotifWrap');
  expect(bonus.total, 'bonusNotifWrap debe existir una sola vez').toBe(1);
  expect(bonus.secciones[0], 'el aviso de Bonus vive en Mi Equipo').toBe('view-equipo');
  await expect(page.locator('#view-home #bonusNotifWrap')).toHaveCount(0);

  await expect(page.locator('#view-mes #culturaWrap')).toHaveCount(0);
  await expect(page.locator('#view-negocio #bonusNotifWrap')).toHaveCount(0);
  await expect(page.locator('#view-negocio #bdayBannerWrap')).toHaveCount(0);
});

test('el saludo de cumpleaños se pinta en el inicio y el Bonus en Mi Equipo', async ({ page }) => {
  await abrirApp(page);
  await page.evaluate(() => {
    if (window.renderBdayBanner) window.renderBdayBanner();
    if (window.renderBonusNotifs) window.renderBonusNotifs();
  });
  await page.waitForTimeout(300);

  await expect(page.locator('#bdayBannerWrap .bday-banner')).toHaveCount(1);
  await expect(page.locator('#bdayBannerWrap')).toContainText('Cumple Hoy');

  const tarjetas = await page.locator('#bonusNotifWrap [data-bonus-id]').count();
  expect(tarjetas).toBeGreaterThan(0);
  expect(await page.locator('#bonusNotifWrap [data-bonus-act="wa"]').count()).toBe(tarjetas);
});

test('Cultura de Crecimiento sigue guardando los PB desde el inicio', async ({ page }) => {
  await abrirApp(page);
  await page.evaluate(() => window.renderCulturaCrecimiento && window.renderCulturaCrecimiento());
  await page.waitForTimeout(300);

  // Los campos se enganchan por data-*, no por id repetido.
  expect(await page.locator('#culturaWrap [data-cultura-pb]').count()).toBe(1);
  expect(await page.evaluate(() => document.querySelectorAll('#culturaPbInput').length)).toBe(0);

  const campo = page.locator('#culturaWrap [data-cultura-pb]').first();
  await expect(campo).toBeVisible();
  await campo.fill('7,5');
  await campo.blur();
  await page.waitForTimeout(400);
  const guardado = await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('cultura_crecimiento_v1') || '{}');
    const meses = raw && raw.meses ? raw.meses : raw;
    const claves = Object.keys(meses || {});
    return claves.length ? (meses[claves[claves.length - 1]] || {}).pb : null;
  });
  expect(guardado).toBe(7.5);
});

test('sin datos que mostrar, el aviso no queda con contenido viejo', async ({ page }) => {
  await abrirApp(page);
  await page.evaluate(() => window.renderBdayBanner && window.renderBdayBanner());
  await page.waitForTimeout(200);
  expect((await copias(page, 'bdayBannerWrap')).llenas).toBeGreaterThan(0);

  // Se va la persona que cumplía: el aviso tiene que borrarse.
  await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('equipoData'));
    d.personas = d.personas.filter(p => p.nombre !== 'Cumple Hoy');
    localStorage.setItem('equipoData', JSON.stringify(d));
    if (window.loadEquipoFromStorage) window.loadEquipoFromStorage();
    if (window.renderBdayBanner) window.renderBdayBanner();
  });
  await page.waitForTimeout(300);
  expect((await copias(page, 'bdayBannerWrap')).llenas).toBe(0);
});
