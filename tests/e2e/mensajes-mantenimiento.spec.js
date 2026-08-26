const { test, expect } = require('@playwright/test');

/* Mensajes de mantenimiento e instalación por producto (v342).
   Predefinidos con el video de cada equipo; el distribuidor elige el
   correcto desde el carrusel (🔁 Cambiar mensaje) o desde el editor. */

const USER_ID = '11111111-1111-4111-8111-111111111111';

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

// Compró hace 6 meses justos: le toca retrolavado hoy.
const USUARIOS = [
  { id: 1, usuario: 'TABORDA, JULIAN', telf: '3515551001', domicilio: 'Ancona 4231', localidad: 'Córdoba',
    producto: 'SEN4BLAC', cp: '5000', fCompra: ddmmyyyy(-182), fVenceRaw: ddmmyyyy(400), fVence: dias(400), estado: 'vigente' }
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
  await page.addInitScript(([users]) => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('appi_tarjetas_auto', '0');
    localStorage.setItem('tutoVisto_v2', '1');
    localStorage.setItem('usuarios_garantias', JSON.stringify(users));
  }, [USUARIOS]);
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
  await page.evaluate(() => window.showView('view-usuarios'));
  await expect(page.locator('#usuariosBtnZonas')).toBeVisible();
}

test('la biblioteca trae 24 mensajes en dos grupos', async ({ page }) => {
  await entrar(page);
  const r = await page.evaluate(() => {
    const todos = window.APPIMensajes.mensajesMantenimiento();
    return {
      total: todos.length,
      mantenimiento: todos.filter(m => m.grupo === 'mantenimiento').length,
      instalacion: todos.filter(m => m.grupo === 'instalacion').length,
      senik: todos.find(m => m.id === 'mant_senik') || null
    };
  });
  expect(r.total).toBe(24);
  expect(r.mantenimiento).toBe(15);
  expect(r.instalacion).toBe(9);
  expect(r.senik).not.toBeNull();
  expect(r.senik.nombre).toBe('Mantenimiento · PSA Senik');
  expect(r.senik.texto).toContain('watch?v=RxnqnLtDjis');
});

test('el botón Cambiar mensaje reemplaza el texto del carrusel', async ({ page }) => {
  await entrar(page);
  await page.locator('[data-mu-hoy="retro"]').click();

  // El aviso por defecto habla de retrolavado genérico.
  await expect(page.locator('#muPrevTxt')).toContainText('retrolavado');
  await expect(page.locator('#muCambiarMensaje')).toBeVisible();

  await page.locator('#muCambiarMensaje').click();
  await expect(page.locator('#muTitulo')).toContainText('Elegir mensaje');
  await expect(page.locator('[data-mu-sel-mant]')).toHaveCount(24);
  // El selector muestra los dos títulos de grupo.
  await expect(page.locator('.mu-sec-titulo').first()).toContainText('Mantenimiento');
  await expect(page.locator('.mu-sec-titulo').nth(1)).toContainText('Instalación');

  // Elegir el de PSA Senik: el texto del carrusel cambia a ese mensaje.
  await page.locator('[data-mu-sel-mant="mant_senik"]').click();
  await expect(page.locator('#muPrevTxt')).toContainText('PSA Senik');
  await expect(page.locator('#muPrevTxt')).toContainText('RxnqnLtDjis');
  await expect(page.locator('#muPrevTxt')).not.toContainText('retrolavado');
});

test('los mensajes aparecen en el editor, agrupados', async ({ page }) => {
  await entrar(page);
  // Ficha → WhatsApp → Editar los textos.
  await page.locator('[data-u-toggle="0"]').click();
  await page.locator('[data-u-toggle="0"] + .tree-children [data-u-action="whatsapp"]').click();
  await page.locator('#muIrEditar').click();
  const titulos = page.locator('.mu-sec-titulo');
  await expect(titulos.first()).toContainText('Mantenimiento');
  await expect(titulos.nth(1)).toContainText('Instalación');
  // Los 24 mensajes están disponibles para editar.
  await expect(page.locator('[data-mu-editar="mant_senik"]')).toHaveCount(1);
  await expect(page.locator('[data-mu-editar="inst_ropot"]')).toHaveCount(1);
  await expect(page.locator('[data-mu-editar="mant_sodaburby"]')).toHaveCount(1);
});
