const { test, expect } = require('@playwright/test');

const USER_ID = '11111111-1111-4111-8111-111111111111';
const hoy = new Date().toISOString();

function tokenFor(sub) {
  const h = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${h}.${p}.firma`;
}

async function entrar(page, { contactos = [], usuarios = [] } = {}) {
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
    if (url.pathname === '/auth/v1/token') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ access_token: tokenFor(USER_ID), refresh_token: 'r', expires_in: 3600, user: { id: USER_ID } }) });
    if (url.pathname === '/rest/v1/appi_perfiles') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([profile]) });
    if (url.pathname === '/rest/v1/appi_gestion_contactos') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify(contactos) });
    return route.fulfill({ status: 200, headers: cors, body: '[]' });
  });
  await page.addInitScript(([uid, contacts, users]) => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('appi_tarjetas_auto', '0');
    localStorage.setItem('tutoVisto_v2', '1');
    localStorage.setItem(`appi_gestion_cache_v1_${uid}`, JSON.stringify({ contacts, surveys: [], activities: [], savedAt: Date.now() }));
    if (users && users.length) localStorage.setItem('usuarios_garantias', JSON.stringify(users));
  }, [USER_ID, contactos, usuarios]);
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
}

test('Hoy te conviene prioriza la presentación de hoy', async ({ page }) => {
  await entrar(page, {
    contactos: [
      { id: 'c1', estado: 'nuevo', nombre: 'Carla Nueva', telefono: '3515550001', created_at: hoy, updated_at: hoy },
      { id: 'c2', estado: 'presentacion', nombre: 'Lucía Vega', telefono: '3515550003', proximo_contacto: hoy.slice(0, 10), created_at: hoy, updated_at: hoy }
    ]
  });
  const r = await page.evaluate(() => {
    const t = window.APPIHomeTarjetas.armarTarjetas();
    const hoyCard = t.find(x => x.cat === 'hoy');
    const acc = window.APPIHomeTarjetas.mejorAccionHoy();
    return { cats: t.map(x => x.cat), titulo: hoyCard && hoyCard.titulo, tipo: acc && acc.tipo };
  });
  expect(r.cats[1]).toBe('hoy');
  expect(r.tipo).toBe('presentacion');
  expect(r.titulo).toContain('Lucía');
});

test('si no hay venta, el canje entra al mazo y a Hoy te conviene', async ({ page }) => {
  const vence = new Date(Date.now() - 40 * 86400000).toISOString();
  await entrar(page, {
    usuarios: [{
      id: 7, usuario: 'Carlos Ruiz', telf: '3515559876', domicilio: 'Belgrano 50',
      localidad: 'Córdoba', producto: 'SENIOR 4', fVence: vence, estado: 'vencido'
    }]
  });
  const r = await page.evaluate(() => {
    const t = window.APPIHomeTarjetas.armarTarjetas();
    const acc = window.APPIHomeTarjetas.mejorAccionHoy();
    return {
      cats: t.map(x => x.cat),
      tipo: acc && acc.tipo,
      titulo: acc && acc.titulo,
      canje: (t.find(x => x.cat === 'canje') || {}).titulo || ''
    };
  });
  expect(r.cats).toContain('canje');
  expect(r.tipo).toBe('canje');
  expect(r.titulo).toMatch(/Carlos/i);
  expect(r.canje).toContain('1 equipo');
});

test('sin trabajo real no se inventa la carta de Hoy ni la de Canje', async ({ page }) => {
  await entrar(page, { contactos: [], usuarios: [] });
  const cats = await page.evaluate(() => window.APPIHomeTarjetas.armarTarjetas().map(t => t.cat));
  expect(cats).not.toContain('hoy');
  expect(cats).not.toContain('canje');
  expect(cats[0]).toBe('especial');
});
