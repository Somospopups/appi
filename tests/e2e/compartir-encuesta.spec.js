const { test, expect } = require('@playwright/test');

const USER_ID = '11111111-1111-4111-8111-111111111111';
const LINK_TOKEN = '77777777-7777-4777-8777-777777777777';

function tokenFor(sub) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${header}.${payload}.firma`;
}

async function abrirComoDistribuidor(page, invitaciones) {
  const now = new Date().toISOString();
  const accessToken = tokenFor(USER_ID);
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
    if (url.pathname === '/auth/v1/token') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ access_token: accessToken, refresh_token: 'r', expires_in: 3600, user: { id: USER_ID } }) });
    if (url.pathname === '/rest/v1/appi_perfiles') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([profile]) });
    if (url.pathname === '/rest/v1/rpc/appi_crear_invitacion_encuesta') {
      invitaciones.push(request.postDataJSON());
      const token = `${LINK_TOKEN.slice(0, -1)}${invitaciones.length}`;
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([{ token, expires_at: new Date(Date.now() + 86400000).toISOString() }]) });
    }
    if (url.pathname === '/functions/v1/dispositivo-puente') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ devices: [] }) });
    return route.fulfill({ status: 200, headers: cors, body: '[]' });
  });

  await page.addInitScript(() => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('appi_tarjetas_auto', '0');
    localStorage.setItem('tutoVisto_v2', '1');
    // Se registra la pestaña que APPI abre y a dónde termina navegando,
    // sin dejar que el navegador de pruebas salga hacia WhatsApp.
    window.__destinos = [];
    window.open = () => {
      const ventana = {
        closed: false,
        close() { this.closed = true; },
        // APPI asigna `popup.location.href`: se registra sin navegar.
        location: {
          set href(valor) { window.__destinos.push(String(valor)); },
          get href() { return ''; }
        }
      };
      window.__ultimaVentana = ventana;
      return ventana;
    };
  });
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
  await page.evaluate(() => openEncuestaTool());
  await expect(page.locator('#view-gestion')).toHaveClass(/active/);
  await expect(page.locator('#surveyShareBtn')).toBeVisible();
}

test('el Panel de Contactos muestra el botón de enviar arriba, sin datos técnicos', async ({ page }) => {
  await abrirComoDistribuidor(page, []);

  const boton = page.locator('#surveyShareBtn');
  await expect(boton).toBeVisible();
  await expect(boton).toContainText('Enviar encuesta');
  await expect(boton).toContainText('Se abre WhatsApp');

  // Un solo botón para enviar: nada de controles duplicados.
  await expect(page.locator('#surveyShareBtn')).toHaveCount(1);

  // Nada de jerga interna ni enlaces a la vista del distribuidor.
  const texto = await page.locator('.gente-acciones').innerText();
  for (const prohibido of ['token', 'http', '24 horas', 'dispositivo', 'vence', 'Copiar', 'cola']) {
    expect(texto.toLowerCase()).not.toContain(prohibido.toLowerCase());
  }
  await expect(page.locator('.survey-link-value')).toHaveCount(0);
});

test('el botón crea la encuesta, la anima y deja elegir el contacto en WhatsApp', async ({ page }) => {
  const invitaciones = [];
  await abrirComoDistribuidor(page, invitaciones);

  const boton = page.locator('#surveyShareBtn');
  await boton.click();

  // No se pide destinatario dentro de APPI: eso lo resuelve WhatsApp.
  await expect(page.locator('#appiDialogTitle')).not.toBeVisible();

  // La animación se dispara sólo después de crear la invitación real.
  await expect(boton).toHaveClass(/sending/, { timeout: 5000 });
  await expect(boton).not.toHaveClass(/sending/, { timeout: 5000 });

  const destinos = await page.evaluate(() => window.__destinos);
  expect(destinos).toHaveLength(1);
  // Sin número: WhatsApp abre su propio selector de contactos.
  expect(destinos[0].startsWith('https://wa.me/?text=')).toBe(true);
  expect(decodeURIComponent(destinos[0])).toContain('encuesta.html?t=');
  expect(invitaciones).toHaveLength(1);

  // Segundo toque: otra encuesta distinta, mismo flujo.
  await boton.click();
  await expect(boton).toHaveClass(/sending/, { timeout: 5000 });
  await expect(boton).not.toHaveClass(/sending/, { timeout: 5000 });

  const finales = await page.evaluate(() => window.__destinos);
  expect(finales).toHaveLength(2);
  expect(invitaciones).toHaveLength(2);
  expect(finales[0]).not.toBe(finales[1]);
});

test('si falla la creación se avisa y se cierra la pestaña abierta', async ({ page }) => {
  const invitaciones = [];
  await abrirComoDistribuidor(page, invitaciones);

  // La siguiente creación falla en el servidor.
  await page.route('https://mock.supabase.co/rest/v1/rpc/appi_crear_invitacion_encuesta', route => route.fulfill({
    status: 500,
    headers: { 'access-control-allow-origin': '*', 'content-type': 'application/json' },
    body: JSON.stringify({ message: 'Servidor no disponible' })
  }));

  await page.locator('#surveyShareBtn').click();
  await expect(page.locator('#appiDialogTitle')).toHaveText('No pudimos crear la invitación');
  await page.locator('#appiDialogOk').click();

  // No se navega a WhatsApp y la pestaña en blanco se cierra.
  const destinos = await page.evaluate(() => window.__destinos);
  expect(destinos).toHaveLength(0);
  expect(await page.evaluate(() => window.__ultimaVentana.closed)).toBe(true);

  // El botón vuelve a quedar utilizable.
  await expect(page.locator('#surveyShareBtn')).toBeEnabled();
  await expect(page.locator('#surveyShareBtn')).not.toHaveClass(/sending/);
});

test('en Android el envío no deja una pestaña en blanco', async ({ browser }) => {
  // El intent:// se navega en la pestaña actual, así que Mi Encuesta no debe
  // abrir un about:blank que quedaría vacío detrás de WhatsApp.
  const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) Chrome/120 Mobile' });
  const page = await ctx.newPage();
  const intentos = [];
  // Se registra antes que los mocks del helper para no pisarlos.
  await page.route('intent:**', route => { intentos.push(route.request().url()); return route.abort(); });
  page.on('request', req => { if (req.url().startsWith('intent:') && !intentos.includes(req.url())) intentos.push(req.url()); });
  await abrirComoDistribuidor(page, [{ id: 'inv-1', token: 'tok-1' }]);
  await page.evaluate(() => {
    window.APPIWhatsApp.setPreferencia('normal');
    window.__aperturas = [];
    window.open = url => { window.__aperturas.push(String(url)); return { closed:false, close(){}, location:{ set href(v){} } }; };
  });

  await page.locator('#surveyShareBtn').click();

  await expect.poll(() => intentos.length).toBe(1);
  expect(intentos[0]).toContain('intent://send');
  // Ni about:blank ni ninguna otra pestaña.
  expect(await page.evaluate(() => window.__aperturas)).toHaveLength(0);
  expect(ctx.pages()).toHaveLength(1);
  await ctx.close();
});
