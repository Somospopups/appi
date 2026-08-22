const { test, expect } = require('@playwright/test');

// Cargar un contacto es lo que más se hace en la calle, justo donde peor anda
// internet. Antes, sin señal, el alta fallaba y se perdía lo escrito.
// Ahora se guarda en el teléfono y sube sola cuando vuelve la conexión.

const USER_ID = '11111111-1111-4111-8111-111111111111';

function tokenFor(sub) {
  const h = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${h}.${p}.firma`;
}

async function abrirPanel(page) {
  const altas = [];
  const enLaNube = [];
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
    const request = route.request();
    const url = new URL(request.url());
    const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
    if (url.pathname === '/auth/v1/token') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ access_token: tokenFor(USER_ID), refresh_token: 'r', expires_in: 3600, user: { id: USER_ID } }) });
    if (url.pathname === '/rest/v1/appi_perfiles') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([profile]) });
    if (url.pathname === '/rest/v1/rpc/appi_gente_importar_contacto') {
      const cuerpo = request.postDataJSON();
      altas.push(cuerpo);
      // La base guarda de verdad: si no, el GET siguiente devolvería vacío y
      // la prueba no distinguiría "se subió" de "se perdió".
      const id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
      enLaNube.push({
        id, user_id: USER_ID, tipo: 'manual', nombre: cuerpo.p_nombre, telefono: cuerpo.p_telefono,
        telefono_normalizado: String(cuerpo.p_telefono || '').replace(/\D/g, ''), estado: cuerpo.p_estado || 'nuevo',
        notas: cuerpo.p_notas || '', proximo_contacto: cuerpo.p_proximo || null, cantidad_origenes: 1,
        metadata: {}, created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      });
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([id]) });
    }
    if (url.pathname === '/rest/v1/appi_gestion_contactos') {
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify(enLaNube) });
    }
    if (url.pathname === '/functions/v1/dispositivo-puente') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ devices: [] }) });
    return route.fulfill({ status: 200, headers: cors, body: '[]' });
  });

  await page.addInitScript(() => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('appi_tarjetas_auto', '0');
    localStorage.setItem('tutoVisto_v2', '1');
    localStorage.setItem('seguimientoPersonas', '[]');
  });

  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
  await expect(page.locator('#bootScreen')).toHaveCount(0, { timeout: 3500 });
  await page.evaluate(() => openMiGestion());
  await expect(page.locator('#view-gestion')).toHaveClass(/active/);
  return altas;
}

// Corta la conexión como la ve el navegador: navigator.onLine en false.
async function cortarInternet(page) {
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false });
    window.dispatchEvent(new Event('offline'));
  });
}

async function volverInternet(page) {
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => true });
    window.dispatchEvent(new Event('online'));
  });
}

async function cargarContacto(page, nombre, telefono, notas = '') {
  await page.locator('#genteNuevo').click();
  await page.locator('#genteNombre').fill(nombre);
  await page.locator('#genteTelefono').fill(telefono);
  if (notas) await page.locator('#genteNotas').fill(notas);
  await page.locator('#genteGuardar').click();
}

test('sin internet, el contacto se guarda igual y queda a la vista', async ({ page }) => {
  await abrirPanel(page);
  await cortarInternet(page);

  await cargarContacto(page, 'Ana Sin Señal', '3515551234', 'La conocí en la feria');
  await page.waitForTimeout(600);

  // Nada de error: el formulario se cierra como en un alta normal.
  await expect(page.locator('#genteError')).toBeHidden();

  const guardado = await page.evaluate(() =>
    window.APPIGestion.state.contacts.find(c => c.nombre === 'Ana Sin Señal') || null);
  expect(guardado).not.toBeNull();
  expect(guardado.pendiente_de_subir).toBe(true);
  expect(guardado.telefono_normalizado).toBe('3515551234');
  expect(guardado.notas).toBe('La conocí en la feria');

  // Y aparece en el panel, no sólo en memoria.
  await expect(page.locator('#view-gestion')).toContainText('Ana Sin Señal');
});

test('el contacto cargado sin internet sobrevive a cerrar y abrir la app', async ({ page }) => {
  await abrirPanel(page);
  await cortarInternet(page);
  await cargarContacto(page, 'Beto Guardado', '3515559876');
  await page.waitForTimeout(600);

  const cache = await page.evaluate(uid => localStorage.getItem(`appi_gestion_cache_v1_${uid}`), USER_ID);
  expect(cache).toContain('Beto Guardado');

  const cola = await page.evaluate(uid => JSON.parse(localStorage.getItem(`appi_gestion_queue_v1_${uid}`) || '[]'), USER_ID);
  const pendiente = cola.find(i => i.payload && i.payload.nombre === 'Beto Guardado');
  expect(pendiente).toBeTruthy();
  expect(pendiente.kind).toBe('historico_import');
  // Lleva su propio identificador para que un reintento no lo cargue dos veces.
  expect(pendiente.payload.localId).toBe(pendiente.id);
});

test('cuando vuelve internet el contacto se sube solo y toma su id de la nube', async ({ page }) => {
  const altas = await abrirPanel(page);
  await cortarInternet(page);
  await cargarContacto(page, 'Carla Pendiente', '3515550000');
  await page.waitForTimeout(600);
  expect(altas.length).toBe(0); // todavía no viajó nada

  await volverInternet(page);
  await page.evaluate(() => window.APPIGestion.flushQueue());
  await page.waitForTimeout(900);

  // Ahora sí llegó a la base, con los datos completos.
  expect(altas.length).toBe(1);
  expect(altas[0].p_nombre).toBe('Carla Pendiente');
  expect(altas[0].p_telefono).toBe('3515550000');

  // La cola quedó vacía y el contacto perdió la marca de pendiente.
  const cola = await page.evaluate(uid => JSON.parse(localStorage.getItem(`appi_gestion_queue_v1_${uid}`) || '[]'), USER_ID);
  expect(cola.filter(i => i.kind === 'historico_import').length).toBe(0);

  const subido = await page.evaluate(() =>
    window.APPIGestion.state.contacts.find(c => c.nombre === 'Carla Pendiente') || null);
  expect(subido).not.toBeNull();
  expect(subido.pendiente_de_subir).toBeFalsy();
  expect(subido.id).toBe('cccccccc-cccc-4ccc-8ccc-cccccccccccc');
});

test('sin internet no se cargan dos veces la misma persona', async ({ page }) => {
  await abrirPanel(page);
  await cortarInternet(page);

  await cargarContacto(page, 'Dora Repetida', '3515557777');
  await page.waitForTimeout(500);
  await cargarContacto(page, 'Dora Repetida', '3515557777');
  await page.waitForTimeout(500);

  const cuantas = await page.evaluate(() =>
    window.APPIGestion.state.contacts.filter(c => c.telefono_normalizado === '3515557777').length);
  expect(cuantas).toBe(1);
});

test('sin internet siguen valiendo las reglas: nombre y teléfono de verdad', async ({ page }) => {
  await abrirPanel(page);
  await cortarInternet(page);

  await cargarContacto(page, 'X', '3515551111');
  await expect(page.locator('#genteError')).toBeVisible();
  await expect(page.locator('#genteError')).toContainText(/nombre/i);

  await page.locator('#genteNombre').fill('Elsa Corta');
  await page.locator('#genteTelefono').fill('123');
  await page.locator('#genteGuardar').click();
  await expect(page.locator('#genteError')).toBeVisible();
  await expect(page.locator('#genteError')).toContainText(/tel/i);

  const guardados = await page.evaluate(() => window.APPIGestion.state.contacts.length);
  expect(guardados).toBe(0);
});
