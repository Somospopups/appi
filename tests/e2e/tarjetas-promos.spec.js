const { test, expect } = require('@playwright/test');

const USER_ID = '11111111-1111-4111-8111-111111111111';
const HOY = new Date().toISOString();

function tokenFor(sub) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${header}.${payload}.firma`;
}

const USUARIOS = [
  {
    id: 1, usuario: 'Laura Gómez', telf: '3515551234', domicilio: 'Colón 100',
    cp: '5000', localidad: 'Córdoba', producto: 'PSA VERO', fVenceRaw: '1/1/2027',
    fVence: '2027-01-01T12:00:00.000Z', estado: 'vigente'
  },
  {
    id: 2, usuario: 'Carlos Ruiz', telf: '3515559876', domicilio: 'Belgrano 50',
    cp: '5000', localidad: 'Córdoba', producto: 'SENIOR 4', fVenceRaw: '1/1/2027',
    fVence: '2027-01-01T12:00:00.000Z', estado: 'vigente'
  }
];

const CONTACTOS = [
  {
    id: 'c-laura', user_id: USER_ID, estado: 'nuevo', nombre: 'Laura Gómez',
    telefono: '3515551234', telefono_normalizado: '3515551234', tipo: 'contacto',
    zona: 'Centro', created_at: HOY, updated_at: HOY, metadata: {}
  },
  {
    id: 'c-pedro', user_id: USER_ID, estado: 'contactado', nombre: 'Pedro Díaz',
    telefono: '3515550001', telefono_normalizado: '3515550001', tipo: 'contacto',
    created_at: HOY, updated_at: HOY, metadata: {}
  }
];

async function entrar(page, { usuarios = USUARIOS, contactos = CONTACTOS, tarjetas = null } = {}) {
  const accessToken = tokenFor(USER_ID);
  const now = new Date().toISOString();
  const profile = {
    user_id: USER_ID, username: null, dip: '02-9802014', sucursal: '02', numero_distribuidor: '9802014',
    nombre: 'María Pérez', socio_nombre: null, rol: 'usuario', activo: true, debe_cambiar_password: false,
    membresia_meses: 1, membresia_inicio: now, membresia_vence: new Date(Date.now() + 30 * 86400000).toISOString()
  };
  const patches = [];
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
    if (url.pathname === '/rest/v1/appi_gestion_contactos') {
      if (route.request().method() === 'PATCH') {
        patches.push(route.request().postDataJSON());
        return route.fulfill({ status: 204, headers: cors, body: '' });
      }
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify(contactos) });
    }
    if (url.pathname === '/functions/v1/dispositivo-puente') {
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ devices: [] }) });
    }
    return route.fulfill({ status: 200, headers: cors, body: '[]' });
  });
  await page.addInitScript(([uid, users, contacts, cards]) => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('appi_tarjetas_auto', '0');
    localStorage.setItem('tutoVisto_v2', '1');
    localStorage.setItem('usuarios_garantias', JSON.stringify(users));
    localStorage.setItem(`appi_gestion_cache_v1_${uid}`, JSON.stringify({ contacts, surveys: [], activities: [], savedAt: Date.now() }));
    if (cards) localStorage.setItem(`appi_tarjetas_v1_${uid}`, JSON.stringify(cards));
  }, [USER_ID, usuarios, contactos, tarjetas]);
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
  await page.evaluate(() => {
    window.__appiLastOpen = null;
    window.open = (...args) => { window.__appiLastOpen = args[0]; return { closed: false, close() {}, location: {} }; };
    if (window.APPIWhatsApp) {
      window.APPIWhatsApp.abrir = url => { window.__appiLastOpen = url; return Promise.resolve(true); };
    }
  });
  return { patches };
}

async function abrirUsuarios(page) {
  await page.evaluate(() => window.showView('view-usuarios'));
  await expect(page.locator('#view-usuarios')).toHaveClass(/active/);
  // La barra de promos se sigue montando, pero fuera de la vista: el mensaje se
  // escribe dentro del popup del botón "Tarjetas".
  await expect(page.locator('#usuariosTarjetasBar')).toBeHidden();
  await expect(page.locator('#usuariosBtnTarjetas')).toBeVisible();
  await expect(page.locator('#usuariosList .tree-node')).toHaveCount(2);
}

test('en Usuarios se carga Visa Galicia, se filtra y se arma el WhatsApp', async ({ page }) => {
  await entrar(page);
  await abrirUsuarios(page);

  await page.locator('#usuariosList .tree-node').first().click();
  const slot = page.locator('.tp-slot[data-tp-scope="usuarios"]').first();
  await expect(slot).toBeVisible();
  await slot.locator('[data-tp-add]').click();
  await expect(page.locator('#tpOverlay')).toHaveClass(/open/);
  await page.locator('[data-tp-marca="visa"]').click();
  await page.locator('[data-tp-banco="galicia"]').click();
  await page.locator('#tpSave').click();
  await expect(page.locator('#tpOverlay')).not.toHaveClass(/open/);
  await expect(slot).toContainText('Visa Galicia');

  const store = await page.evaluate(uid => JSON.parse(localStorage.getItem('appi_tarjetas_v1_' + uid) || '{}'), USER_ID);
  expect(store.byKey['tel:3515551234']).toEqual([{ marca: 'visa', banco: 'galicia' }]);

  // En Usuarios se filtra por tarjeta desde el botón "Tarjetas": abre un popup
  // con las combinaciones y al elegir una recorta el listado.
  await page.locator('#usuariosBtnTarjetas').click();
  const itemVisa = page.locator('[data-ub-marca="visa"][data-ub-banco="galicia"]');
  await expect(itemVisa).toBeVisible();
  await expect(itemVisa).toContainText('Visa Galicia');
  await itemVisa.click();
  // El popup pasa a mostrar la gente de esa tarjeta y el listado grande queda
  // filtrado por detrás.
  await expect(page.locator('#ubCuerpo .ub-persona')).toHaveCount(1);
  await page.locator('#ubCerrar').click();
  await expect(page.locator('#usuariosList .tree-node')).toHaveCount(1);
  await expect(page.locator('#usuariosList')).toContainText('Laura Gómez');
  await expect(page.locator('#usuariosList')).not.toContainText('Carlos Ruiz');

  // El mensaje se escribe en el popup de Tarjetas y el aviso sale desde ahí:
  // la ficha ya no trae "Avisar promo" (v335), se manda desde Mensajes.
  await page.locator('#usuariosBtnTarjetas').click();
  await page.locator('#ubMsg').fill('Hola {nombre}, hay una promo con {tarjeta}');
  await page.locator('[data-ub-marca="visa"][data-ub-banco="galicia"]').click();
  await page.locator('#ubCuerpo [data-ub-wa]').first().click();
  const opened = await page.evaluate(() => window.__appiLastOpen);
  expect(opened).toMatch(/^https:\/\/wa\.me\/5493515551234\?text=/);
  const text = decodeURIComponent(opened.split('text=')[1]);
  expect(text).toContain('Laura');
  expect(text).toContain('Visa Galicia');
});

test('recargar el Excel no borra las tarjetas guardadas', async ({ page }) => {
  await entrar(page, {
    tarjetas: { byKey: { 'tel:3511234567': [{ marca: 'naranja', banco: 'naranja_x' }] } }
  });
  await abrirUsuarios(page);
  await page.setInputFiles('#usuariosFileInput', 'test_garantias.xlsx');
  await expect(page.locator('#usuariosStTotal')).toHaveText('4');
  await expect(page.locator('#usuariosList .tree-node')).toHaveCount(4);

  const keep = await page.evaluate(uid => {
    const raw = JSON.parse(localStorage.getItem('appi_tarjetas_v1_' + uid) || '{}');
    return raw.byKey && raw.byKey['tel:3511234567'];
  }, USER_ID);
  expect(keep).toEqual([{ marca: 'naranja', banco: 'naranja_x' }]);

  const gomez = page.locator('#usuariosList .tree-node', { hasText: 'GOMEZ, JUAN PEREZ' });
  await gomez.click();
  const slot = page.locator('.tp-slot[data-tp-scope="usuarios"]').nth(
    await page.locator('#usuariosList .tree-node').evaluateAll((nodes, name) =>
      nodes.findIndex(n => n.textContent.includes(name)), 'GOMEZ, JUAN PEREZ')
  );
  await expect(slot).toContainText('Naranja');
});

// v357: la barra de tarjetas de crédito se quitó del Panel de Contactos
// (se sigue usando desde la sección Usuarios). El panel queda enfocado en la
// agenda: sin barra de promos, sin chips en las fichas y sin tarjetas en el
// cajón del contacto.
test('el Panel de Contactos ya no muestra las tarjetas (v357)', async ({ page }) => {
  await entrar(page, {
    tarjetas: { byKey: { 'tel:3515551234': [{ marca: 'visa', banco: 'galicia' }] } }
  });
  await page.evaluate(() => window.openMiGestion());
  await expect(page.locator('#view-gestion')).toHaveClass(/active/);
  await page.locator('[data-gestion-view="todos"]').click();
  await expect(page.locator('#gestionTarjetasBar')).toHaveCount(0);
  const ficha = page.locator('.gestion-contact').filter({ hasText: 'Laura Gómez' });
  await expect(ficha).toBeVisible();
  await expect(ficha).not.toContainText('Visa Galicia');

  await page.locator('[data-open-contact="c-laura"]').click();
  await expect(page.locator('#gestionDrawer')).toBeVisible();
  await expect(page.locator('#gestionDrawer #tpContactSlot')).toHaveCount(0);
  await page.locator('#gestionDetailClose').click();
});

test('el módulo queda expuesto y no pisa la planilla de usuarios', async ({ page }) => {
  await entrar(page);
  const api = await page.evaluate(() => {
    const T = window.APPITarjetas;
    return {
      hay: !!T,
      marcas: (T.MARCAS || []).map(m => m.id),
      bancos: (T.BANCOS || []).map(b => b.id),
      key: T.personKey({ telf: '351-555-1234' }),
      sync: window.APPIDataSync && window.APPIDataSync.isDataKey('appi_tarjetas_v1_x')
    };
  });
  expect(api.hay).toBe(true);
  expect(api.marcas).toEqual(expect.arrayContaining(['visa', 'mastercard', 'naranja', 'cabal']));
  expect(api.bancos).toEqual(expect.arrayContaining(['galicia', 'cordoba', 'naranja_x', 'uala']));
  expect(api.key).toBe('tel:3515551234');
  expect(api.sync).toBe(true);
});
