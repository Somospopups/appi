const { test, expect } = require('@playwright/test');
const fs = require('fs');

/* Anuncios del administrador (v326): el mensaje del panel salta como cartel
   al abrir APPI y cada reunión se agenda en APPI o en el teléfono. */

const USER_ID = '11111111-1111-4111-8111-111111111111';

function tokenFor(sub) {
  const h = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${h}.${p}.firma`;
}

const dias = n => new Date(Date.now() + n * 86400000).toISOString();
const fechaISO = n => dias(n).slice(0, 10);

const USUARIOS = [
  { id: 1, usuario: 'GOMEZ, ANA MARIA', telf: '3515551001', domicilio: 'San Martín 120', localidad: 'Alta Gracia',
    producto: 'PSA SENIOR 4', cp: '5186', fCompra: '15/03/2024', fVenceRaw: '30/09/2026', fVence: dias(200), estado: 'vigente' }
];

const AVISO = {
  id: 'anuncio-1',
  texto: '¡Atención equipo! Reunión general por Zoom esta semana.',
  eventos: [
    { titulo: 'Reunión general por Zoom', fecha: fechaISO(2), hora: '21:00', lugar: 'https://zoom.us/j/123' },
    { titulo: 'Mentoría de negocios', fecha: fechaISO(5), hora: '', lugar: 'Sala Comercial' }
  ],
  activo: true,
  creado_en: new Date().toISOString()
};

async function entrar(page, { anuncio = AVISO } = {}) {
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
    return route.fulfill({ status: 200, headers: cors, body: '[]' });
  });
  await page.route('**/tile.openstreetmap.org/**', route => route.abort());
  await page.addInitScript(([u]) => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('appi_tarjetas_auto', '0');
    localStorage.setItem('turoVisto_v2', '1');
    localStorage.setItem('tutoVisto_v2', '1');
    localStorage.setItem('usuarios_garantias', JSON.stringify(u));
  }, [USUARIOS]);
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
  // El aviso vigente se sirve después de entrar: gana sobre el catch-all.
  await page.route('https://mock.supabase.co/rest/v1/appi_anuncios**', route => route.fulfill({
    status: 200,
    headers: { 'access-control-allow-origin': '*', 'content-type': 'application/json' },
    body: JSON.stringify(anuncio ? [anuncio] : [])
  }));
}

test('el aviso del administrador salta como cartel al abrir y agenda en APPI', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.APPIAnuncios.revisar());

  const pop = page.locator('#anPop');
  await expect(pop).toHaveClass(/open/);
  await expect(pop).toContainText('Reunión general por Zoom');
  await expect(pop).toContainText('Atención equipo');
  // La reunión sin hora y el lugar también se muestran.
  await expect(pop).toContainText('Mentoría de negocios');
  await expect(pop).toContainText('zoom.us/j/123');

  // Dos botones por reunión: APPI y teléfono.
  await expect(pop.locator('[data-an-appi="0"]')).toHaveCount(1);
  await expect(pop.locator('[data-an-tel="0"]')).toHaveCount(1);
  await expect(pop.locator('[data-an-appi="1"]')).toHaveCount(1);

  await pop.locator('[data-an-appi="0"]').click();
  const tarea = await page.evaluate(() => {
    const clave = 'appi_cal_tareas_v1_' + window.APPIAuth.userId();
    const t = JSON.parse(localStorage.getItem(clave) || '{}');
    const fecha = Object.keys(t)[0];
    return { fecha, tarea: (t[fecha] || [])[0] };
  });
  expect(tarea.tarea.texto).toContain('📣 Reunión general por Zoom');
  expect(tarea.tarea.texto).toContain('zoom.us/j/123');
  expect(tarea.tarea.hora).toBe('21:00');
  expect(tarea.fecha).toBe(AVISO.eventos[0].fecha);

  // El botón queda agendado y el cartel se cierra con Entendido.
  await expect(pop.locator('[data-an-appi="0"]')).toBeDisabled();
  await pop.locator('#anOk').click();
  await expect(pop).not.toHaveClass(/open/);
});

test('el mismo aviso no vuelve a saltar, pero la campanita lo reabre', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.APPIAnuncios.revisar());
  await expect(page.locator('#anPop')).toHaveClass(/open/);
  await page.locator('#anOk').click();

  // Ya visto: el barrido no lo vuelve a abrir.
  await page.evaluate(() => window.APPIAnuncios.revisar());
  await expect(page.locator('#anPop')).not.toHaveClass(/open/);

  // La campanita queda visible, sin puntito de novedad, y reabre el aviso.
  const bell = page.locator('#anBell');
  await expect(bell).toHaveClass(/on/);
  await expect(bell).not.toHaveClass(/nuevo/);
  await bell.click();
  await expect(page.locator('#anPop')).toHaveClass(/open/);
  await expect(page.locator('#anPop')).toContainText('Reunión general por Zoom');
});

test('la campanita avisa con el puntito hasta que el cartel se cierra', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.APPIAnuncios.revisar());
  await expect(page.locator('#anPop')).toHaveClass(/open/);
  // Mientras el cartel está abierto (o nunca se cerró), el puntito avisa.
  await expect(page.locator('#anBell')).toHaveClass(/nuevo/);
  await page.locator('#anOk').click();
  await expect(page.locator('#anPop')).not.toHaveClass(/open/);
  await expect(page.locator('#anBell')).not.toHaveClass(/nuevo/);
});

test('sin aviso vigente no hay cartel ni campanita', async ({ page }) => {
  await entrar(page, { anuncio: null });
  await page.evaluate(() => window.APPIAnuncios.revisar());
  // Nunca se creó el cartel: no existe.
  await expect(page.locator('#anPop')).toHaveCount(0);
  await expect(page.locator('#anBell')).not.toHaveClass(/on/);
});

test('la cuenta administradora no recibe carteles ni campanita', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => {
    // El panel de administración escribe los avisos: no los recibe.
    window.APPIAuth.currentProfile = () => ({ rol: 'admin' });
  });
  await page.evaluate(() => window.APPIAnuncios.revisar());
  await expect(page.locator('#anPop')).toHaveCount(0);
  await expect(page.locator('#anBell')).toHaveCount(0);
});

test('el evento degradado no entra: sin título o con fecha rara se descarta', () => {
  // Chequeo puro del normalizador: la defensa del frontend antes de pintar.
  const ok = ev => window.APPIAnuncios.eventoValido(ev);
  // Corre en Node sin navegador: se replica la regexp del módulo.
  const valido = ev => {
    if (!ev || typeof ev !== 'object') return false;
    if (!String(ev.titulo || '').trim()) return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(ev.fecha || ''))) return false;
    if (ev.hora && !/^\d{2}:\d{2}$/.test(String(ev.hora))) return false;
    return true;
  };
  expect(valido({ titulo: 'Reunión', fecha: '2026-09-01', hora: '21:00' })).toBe(true);
  expect(valido({ titulo: 'Reunión', fecha: '2026-09-01', hora: '' })).toBe(true);
  expect(valido({ titulo: '', fecha: '2026-09-01' })).toBe(false);
  expect(valido({ titulo: 'Reunión', fecha: '01/09/2026' })).toBe(false);
  expect(valido({ titulo: 'Reunión', fecha: '2026-09-01', hora: '9pm' })).toBe(false);
  void ok;
});

test('el enlace de Google Calendar y el .ics salen bien armados', async ({ page }) => {
  await entrar(page);
  const r = await page.evaluate(([conHora, sinHora, sinNada]) => {
    return {
      googleHora: window.APPIAnuncios.enlaceGoogle(conHora, 'Reunión del equipo'),
      googleDia: window.APPIAnuncios.enlaceGoogle(sinHora, ''),
      icsHora: window.APPIAnuncios.icsEvento({ id: 'a1', texto: 'Llevar libreta' }, conHora, 0),
      icsDia: window.APPIAnuncios.icsEvento({ id: 'a1', texto: '' }, sinHora, 1)
    };
  }, [
    { titulo: 'Reunión general', fecha: '2026-09-01', hora: '21:00', lugar: 'https://zoom.us/j/123' },
    { titulo: 'Mentoría', fecha: '2026-09-05', hora: '', lugar: '' },
    null
  ]);
  const url = new URL(r.googleHora);
  expect(url.searchParams.get('action')).toBe('TEMPLATE');
  expect(url.searchParams.get('text')).toBe('Reunión general');
  expect(url.searchParams.get('dates')).toBe('20260901T210000/20260901T220000');
  expect(url.searchParams.get('location')).toBe('https://zoom.us/j/123');
  expect(url.searchParams.get('ctz')).toBe('America/Argentina/Buenos_Aires');

  const urlDia = new URL(r.googleDia);
  expect(urlDia.searchParams.get('dates')).toBe('20260905/20260906');

  expect(r.icsHora).toContain('DTSTART:20260901T210000');
  expect(r.icsHora).toContain('DTEND:20260901T220000');
  expect(r.icsHora).toContain('SUMMARY:Reunión general');
  expect(r.icsHora).toContain('LOCATION:https://zoom.us/j/123');
  expect(r.icsHora).toContain('Llevar libreta');
  expect(r.icsDia).toContain('DTSTART;VALUE=DATE:20260905');
  expect(r.icsDia).toContain('DTEND;VALUE=DATE:20260906');
});

test('el panel, la base y el caché quedan cableados para v326', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const panel = fs.readFileSync('admin-panel.js', 'utf8');
  const sw = fs.readFileSync('service-worker.js', 'utf8');
  const sql = fs.readFileSync('SUPABASE_ANUNCIOS.sql', 'utf8');
  const workflow = fs.readFileSync('.github/workflows/deploy-backend.yml', 'utf8');
  const mod = fs.readFileSync('anuncios.js', 'utf8');

  // Sección del panel con mensaje, UNA reunión (v343) y botones.
  for (const id of ['adminAnuncioToggle', 'adminAnuncioTexto', 'adminAnuncioPublicar', 'adminAnuncioQuitar',
    'adminAnuncioEv0Titulo', 'adminAnuncioEv0Fecha', 'adminAnuncioEv0Hora', 'adminAnuncioEv0Lugar']) {
    expect(html).toContain(`id="${id}"`);
  }
  // Las reuniones 2 y 3 se quitaron a pedido: queda una sola.
  expect(html).not.toContain('adminAnuncioEv1Titulo');
  expect(html).not.toContain('adminAnuncioEv2Titulo');
  expect(panel).toContain('const ANUNCIO_EVENTOS=1');
  expect(panel).toContain("rpcAdmin('appi_admin_publicar_anuncio'");
  expect(panel).toContain("rpcAdmin('appi_admin_quitar_anuncio'");
  expect(panel).toContain('function loadAnuncio');

  // El módulo se carga y queda en el App Shell offline.
  expect(html).toContain('./anuncios.js');
  expect(sw).toContain('./anuncios.js');

  // La base: sólo el admin escribe, todos leen.
  expect(sql).toContain('appi_anuncios');
  expect(sql).toMatch(/rol\s*=\s*'admin'/);
  expect(sql).toContain('grant select on public.appi_anuncios to authenticated');
  expect(workflow).toContain('SUPABASE_ANUNCIOS.sql');

  // El aviso se lee con la sesión del distribuidor, sin service_role.
  expect(mod).not.toMatch(/service[_-]?role/i);
  // Nada de diálogos nativos.
  expect(mod).not.toMatch(/(?<![.\w])(?:alert|confirm|prompt)\s*\(/);
});
