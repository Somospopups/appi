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
    id: 0, nivel: 0, codigo: '02-9802014', nombre: 'María Pérez', cat: 'DC', pnAct: 9,
    garantias: { vendidas: 12, vencidas: 4, pendientes: 1 }, hijos: []
  }]
};
const CONTACTOS = [
  { id: 'c1', estado: 'seguimiento', nombre: 'Jorge Salas', telefono: '3515550002', telefono_normalizado: '3515550002', tipo: 'contacto', proximo_contacto: hoy.slice(0, 10), created_at: hoy, updated_at: hoy },
  { id: 'c2', estado: 'presentacion', nombre: 'Lucía Vega', telefono: '3515550003', telefono_normalizado: '3515550003', tipo: 'encuestado', proximo_contacto: hoy.slice(0, 10), created_at: hoy, updated_at: hoy },
  { id: 'c3', estado: 'nuevo', nombre: 'Carla Muñoz', telefono: '3515550001', telefono_normalizado: '3515550001', tipo: 'contacto', created_at: hoy, updated_at: hoy }
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
    localStorage.setItem(`appi_porque_v1_${uid}`, JSON.stringify({ niveles: ['Ganar dinero', 'Que mi familia viva tranquila'] }));
    localStorage.setItem(`appi_tour_parque_v1_${uid}`, '1');
  }, [USER_ID, EQUIPO, CONTACTOS]);
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
}

test('el home muestra el porqué y prioriza la jornada de hoy', async ({ page }) => {
  await entrar(page);

  const home = page.locator('#homeLimpio');
  await expect(home).toBeVisible();
  await expect(home).toContainText('Que mi familia viva tranquila');
  await expect(home).toContainText('Tu impulso');
  await expect(home).toContainText('Tu jornada');
  await expect(home).toContainText('Jorge Salas');
  await expect(home).toContainText('Lucía Vega');
  await expect(home.locator('[data-wa]')).toHaveCount(1);
  await expect(home).toContainText('Ver todo el Panel');

  const spacing=await page.evaluate(()=>({
    heroTop:parseFloat(getComputedStyle(document.querySelector('.home-hero-card')).marginTop),
    greetingBottom:parseFloat(getComputedStyle(document.querySelector('.home-greeting-row')).marginBottom)
  }));
  expect(spacing.heroTop).toBeGreaterThanOrEqual(12);
  expect(spacing.greetingBottom).toBeGreaterThanOrEqual(10);
});

test('el selector de páginas navega y cada página tiene lo suyo', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 840 });
  await entrar(page);

  await expect(page.locator('#pageTabs')).toBeVisible();

  await page.locator('#pageTabs button[data-view="view-negocio"]').click();
  await expect(page.locator('#view-negocio')).toHaveClass(/active/);
  await expect(page.locator('#gpsBlock')).toBeVisible();
  await expect(page.locator('#negGrid')).toContainText('Panel de Contactos');

  await page.locator('#pageTabs button[data-view="view-mes"]').click();
  await expect(page.locator('#mesGrid')).toContainText('Las 7 P');
  await expect(page.locator('#mesGrid')).toContainText('Presupuesto');

  await page.locator('#pageTabs button[data-view="view-herramientas"]').click();
  await expect(page.locator('#view-herramientas')).toContainText('Grabadora');
  await expect(page.locator('#view-herramientas')).toContainText('Los 8 Pasos');

  await page.locator('#pageTabs button[data-view="view-home"]').click();
  await expect(page.locator('#homeLimpio')).toBeVisible();
});

test('en pantalla de PC el selector se esconde y manda la sidebar', async ({ page }) => {
  await entrar(page);
  await expect(page.locator('#pageTabs')).toBeHidden();
  await expect(page.locator('#deskSidebar')).toBeVisible();
});

test('en PC la barra trae las mismas herramientas que el celular', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await entrar(page);
  const sidebar = page.locator('#deskSidebar');
  await expect(sidebar).toBeVisible();
  for (const nombre of ['Los 8 Pasos', 'Escalera de Sueños', 'Coach de Demo', 'Botella', 'Simulador', 'Mi stock', 'Grabadora', 'Notas Keep']) {
    await expect(sidebar).toContainText(nombre);
  }
  await page.locator('#deskSidebar [data-ds="view-demo"]').click();
  await expect(page.locator('#view-demo')).toHaveClass(/active/);
  await page.locator('#deskSidebar [data-ds="view-botella"]').click();
  await expect(page.locator('#view-botella')).toHaveClass(/active/);
  await page.locator('#deskSidebar [data-ds="view-simulador"]').click();
  await expect(page.locator('#view-simulador')).toHaveClass(/active/);
  await expect(page.locator('#deskSidebar [data-ds="view-simulador"]')).toHaveClass(/active/);

  await page.setViewportSize({ width: 1366, height: 768 });
  await page.locator('#deskSidebar [data-ds="view-notas"]').scrollIntoViewIfNeeded();
  await expect(page.locator('#deskSidebar [data-ds="view-notas"]')).toBeVisible();
  await expect(page.locator('#deskSidebar [data-ds="view-grabadora"]')).toBeVisible();
  const leaked = await page.evaluate(() => {
    return [...document.body.childNodes]
      .filter(n => n.nodeType === 3)
      .map(n => n.textContent || '')
      .join(' ');
  });
  expect(leaked).not.toMatch(/limpiarRestos|initHistorico|<\/html>/);
});

test('la tarjeta de la jornada abre el calendario y guarda tareas', async ({ page }) => {
  await entrar(page);
  await page.locator('#hlCardOpen').click();
  await expect(page.locator('#calOverlay')).toHaveClass(/open/);
  await page.locator('#calNewTask').fill('Preparar demostración');
  await page.locator('#calAddBtn').click();
  await expect(page.locator('#calModal')).toContainText('Preparar demostración');
  await page.locator('#calClose').click();
  await expect(page.locator('#calOverlay')).not.toHaveClass(/open/);
  await expect(page.locator('#homeLimpio')).toContainText('Preparar demostración');
});

test('el indicador glass del selector sigue a la pagina activa', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 840 });
  await entrar(page);
  const ind = page.locator('#ptIndicator');
  expect(await ind.evaluate(e => e.offsetWidth)).toBeGreaterThan(0);
  const l0 = await ind.evaluate(e => e.offsetLeft);
  await page.locator('#pageTabs button[data-view="view-negocio"]').click();
  await page.waitForTimeout(550);
  const l1 = await ind.evaluate(e => e.offsetLeft);
  expect(l1).toBeGreaterThan(l0);
});

test('los titulos entran animados desde arriba al cambiar de pantalla', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.showView('view-negocio'));
  const name = await page.evaluate(() => getComputedStyle(document.querySelector('#view-negocio header h1')).animationName);
  expect(name).toContain('titleSlideDown');
});
