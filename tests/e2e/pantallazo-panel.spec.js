const { test, expect, devices } = require('@playwright/test');

// v359 · El pantallazo al entrar al Panel de Contactos
// ----------------------------------------------------------------
// Al presionar el botón del Panel, tarjetas-promos.js inyectaba la barra
// "💳 Promos con tarjeta" 80 ms después de que la pantalla ya era visible
// (todo el contenido saltaba ~250 px hacia abajo) y el renderManagement que
// seguía a la sincronización la borraba (todo saltaba de vuelta). Durante
// ese intervalo el panel mostraba la barra que v357 había quitado: era "el
// pantallazo de la versión anterior" antes de la pantalla que corresponde.
//
// La regresión se verifica en dos capas:
//   1. La barra de promos nunca aparece en el Panel (ni siquiera un frame).
//   2. El contenido del panel no salta: la posición vertical del primer
//      elemento queda estable durante toda la apertura.

const USER_ID = '11111111-1111-4111-8111-111111111111';
const HOY = new Date().toISOString();

function tokenFor(sub) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${header}.${payload}.firma`;
}

const CONTACTOS = [
  { id: 'c-1', user_id: USER_ID, estado: 'nuevo', nombre: 'Laura Gómez', telefono: '3515551234', telefono_normalizado: '3515551234', tipo: 'contacto', zona: 'Centro', created_at: HOY, updated_at: HOY, metadata: {} },
  { id: 'c-2', user_id: USER_ID, estado: 'seguimiento', nombre: 'Mario Ruiz', telefono: '3515552222', telefono_normalizado: '3515552222', tipo: 'contacto', zona: 'Norte', created_at: HOY, updated_at: HOY, metadata: {} }
];

// Latencia realista: el renderManagement posterior a la sincronización llega
// bastante después del primer dibujo, como en un teléfono real.
const RETARDO_NUBE_MS = 800;

async function preparar(page) {
  const accessToken = tokenFor(USER_ID);
  const profile = {
    user_id: USER_ID, username: null, dip: '02-9802014', sucursal: '02', numero_distribuidor: '9802014',
    nombre: 'María Pérez', socio_nombre: null, rol: 'usuario', activo: true, debe_cambiar_password: false,
    membresia_meses: 1, membresia_inicio: HOY, membresia_vence: new Date(Date.now() + 30 * 86400000).toISOString()
  };
  await page.route('**/auth-config.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: "window.APPI_AUTH={enabled:true,url:'https://mock.supabase.co',anonKey:'anon-key-publica-de-prueba',distributorEmailDomain:'distribuidores.appi.invalid',adminLogin:{username:'popups',email:'admin-popups@appi.invalid'},loginAliases:{},offlineDays:7};"
  }));
  await page.route('https://mock.supabase.co/**', route => {
    const request = route.request();
    const url = new URL(request.url());
    const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
    const demora = ms => new Promise(r => setTimeout(r, ms));
    if (url.pathname === '/auth/v1/token') {
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ access_token: accessToken, refresh_token: 'r', expires_in: 3600, user: { id: USER_ID } }) });
    }
    if (url.pathname === '/rest/v1/appi_perfiles') {
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([profile]) });
    }
    if (url.pathname === '/rest/v1/appi_gestion_contactos') {
      if (request.method() === 'PATCH') return route.fulfill({ status: 204, headers: cors, body: '' });
      return demora(RETARDO_NUBE_MS).then(() => route.fulfill({ status: 200, headers: cors, body: JSON.stringify(CONTACTOS) }));
    }
    if (url.pathname === '/rest/v1/appi_encuestas' || url.pathname === '/rest/v1/appi_gestion_actividades') {
      return demora(RETARDO_NUBE_MS).then(() => route.fulfill({ status: 200, headers: cors, body: '[]' }));
    }
    if (url.pathname === '/rest/v1/appi_agenda_personal') {
      if (request.method() === 'POST') return route.fulfill({ status: 201, headers: cors, body: '[]' });
      if (request.method() === 'DELETE') return route.fulfill({ status: 204, headers: cors, body: '' });
      return demora(RETARDO_NUBE_MS).then(() => route.fulfill({ status: 200, headers: cors, body: '[]' }));
    }
    if (url.pathname === '/functions/v1/dispositivo-puente') {
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ devices: [] }) });
    }
    return route.fulfill({ status: 200, headers: cors, body: '[]' });
  });

  // La caché local hace que el primer dibujo del panel ya tenga contactos,
  // como en un dispositivo que ya usó el Panel.
  await page.addInitScript(({ uid, contacts }) => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('appi_tarjetas_auto', '0');
    localStorage.setItem('tutoVisto_v2', '1');
    localStorage.setItem(`appi_gestion_cache_v1_${uid}`, JSON.stringify({ contacts, surveys: [], activities: [], savedAt: Date.now() }));
  }, { uid: USER_ID, contacts: CONTACTOS });

  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
  await expect(page.locator('#bootScreen')).toHaveCount(0, { timeout: 3500 });
  await page.evaluate(() => window.showView('view-home'));
  // Dejar terminar la sincronización del arranque antes de medir.
  await page.waitForTimeout(2600);
}

// Grabadora: cada fotograma toma una trama de lo visible en el panel y
// guarda sólo las transiciones (tiempo en ms desde el click).
async function instalarGrabadora(page) {
  await page.evaluate(() => {
    window.__tramas = { t0: null, lista: [] };
    const trama = () => {
      const g = document.getElementById('view-gestion');
      if (!g || !g.classList.contains('active')) return null;
      const c = document.getElementById('gestionContent');
      if (!c) return { sinContenido: true };
      const barra = document.getElementById('gestionTarjetasBar');
      const primero = c.querySelector('.agenda-switch') || c.querySelector('.gestion-section-title') || c.firstElementChild;
      return {
        barraPromos: barra ? Math.round(barra.getBoundingClientRect().height) : 0,
        yPrimero: primero ? Math.round(primero.getBoundingClientRect().top) : -1
      };
    };
    const tick = () => {
      try {
        const f = trama();
        const arr = window.__tramas.lista;
        const prev = arr.length ? arr[arr.length - 1].f : null;
        if (JSON.stringify(f) !== JSON.stringify(prev)) {
          arr.push({ t: Math.round(performance.now() - window.__tramas.t0), f });
        }
      } catch (e) { /* sin interrumpir la grabación */ }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

// El primer fotograma con panel visible no puede traer la barra de promos,
// ninguna trama posterior puede mover el contenido más de 4 px (redondeos y
// scrollbar) y la barra no puede aparecer en ningún momento.
function revisarTramas(tramas, titulo) {
  const visibles = tramas.filter(t => t.f && !t.f.sinContenido);
  expect(visibles.length, `${titulo}: el panel debía hacerse visible`).toBeGreaterThan(0);
  const y0 = visibles[0].f.yPrimero;
  for (const t of visibles) {
    expect(t.f.barraPromos, `${titulo}: la barra de promos no debe aparecer en el Panel (${t.t} ms)`).toBe(0);
    expect(Math.abs(t.f.yPrimero - y0), `${titulo}: el contenido saltó de ${y0} a ${t.f.yPrimero} px (${t.t} ms)`).toBeLessThanOrEqual(4);
  }
  return visibles;
}

test('escritorio: entrar al Panel no muestra pantallazo ni barra de promos', async ({ page }) => {
  await preparar(page);
  await instalarGrabadora(page);
  await page.evaluate(() => { window.__tramas.t0 = performance.now(); });
  await page.locator('#deskSidebar [data-ds="view-gestion"]').click();
  await page.waitForTimeout(3500);

  await expect(page.locator('#view-gestion')).toHaveClass(/active/);
  await expect(page.locator('#gestionTarjetasBar')).toHaveCount(0);
  const tramas = await page.evaluate(() => window.__tramas.lista);
  const visibles = revisarTramas(tramas, 'escritorio');
  // Y la pantalla que corresponde: la solapa APPI con los contactos.
  await expect(page.locator('[data-gestion-view="hoy"]')).toBeVisible();
  expect(visibles[0].t).toBeLessThan(600);
});

const pixel7 = devices['Pixel 7'];
delete pixel7.defaultBrowserType;

test.describe('teléfono', () => {
  test.use(pixel7);

  test('teléfono: entrar al Panel desde Mis herramientas no muestra pantallazo', async ({ page }) => {
    await preparar(page);
    await instalarGrabadora(page);
    await page.evaluate(() => {
      window.__tramas.t0 = performance.now();
      window.showView('view-herramientas');
      if (window.renderHomeCompleto) window.renderHomeCompleto();
    });
    await page.waitForTimeout(300);
    const card = page.locator('.quick-tool-card').filter({ hasText: 'Panel de Contactos' }).first();
    if (await card.isVisible()) await card.click();
    else await page.evaluate(() => window.openMiGestion());
    await page.waitForTimeout(3500);

    await expect(page.locator('#view-gestion')).toHaveClass(/active/);
    await expect(page.locator('#gestionTarjetasBar')).toHaveCount(0);
    const tramas = await page.evaluate(() => window.__tramas.lista);
    revisarTramas(tramas, 'teléfono');
    await expect(page.locator('[data-gestion-view="hoy"]')).toBeVisible();
  });
});
