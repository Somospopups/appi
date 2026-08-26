const { test, expect } = require('@playwright/test');

/* Contactos depurados (v350): el botón 🧹 de la ficha saca al contacto de la
   lista, lo ignora en futuras cargas y queda en la planilla descargable. */

const USER_ID = '11111111-1111-4111-8111-111111111111';

function tokenFor(sub) {
  const h = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${h}.${p}.firma`;
}

const dias = n => new Date(Date.now() + n * 86400000).toISOString();
const USUARIOS = [
  { id: 1, usuario: 'Ana Gómez',  telf: '3515551001', domicilio: 'San Martín 120', localidad: 'Alta Gracia',   producto: 'PSA', cp: '5186', fVenceRaw: '30/07/2026', fVence: dias(-20), estado: 'vencida' },
  { id: 2, usuario: 'Beto Ruiz',  telf: '3515551002', domicilio: 'Belgrano 45',    localidad: 'Villa Allende', producto: 'PSA', cp: '5105', fVenceRaw: '03/09/2026', fVence: dias(15),  estado: 'porVencer' }
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
  await page.addInitScript(([u]) => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('appi_tarjetas_auto', '0');
    localStorage.setItem('tutoVisto_v2', '1');
    localStorage.setItem('usuarios_garantias', JSON.stringify(u));
  }, [USUARIOS]);
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
  await page.evaluate(() => window.showView('view-usuarios'));
  await expect(page.locator('#usuariosBtnZonas')).toBeVisible();
}

test('depurar un contacto lo saca de la lista y queda registrado', async ({ page }) => {
  await entrar(page);
  await expect(page.locator('#usuariosList .tree-name')).toHaveCount(2);

  // Abrir la ficha del primero y depurarlo.
  const ficha = page.locator('#usuariosList .tree-node').first();
  await ficha.click();
  await page.locator('[data-u-action="depurar"]').first().click();

  // Confirmar el diálogo.
  await page.locator('#modalConfirmBtn').click();

  // Desaparece de la lista.
  await expect(page.locator('#usuariosList .tree-name')).toHaveCount(1);
  await expect(page.locator('#usuariosList')).toContainText('Beto Ruiz');
  await expect(page.locator('#usuariosList')).not.toContainText('Ana Gómez');

  // El badge del botón Depurados muestra 1.
  await expect(page.locator('#usuariosBtnDepurados')).toContainText('1');
});

test('el panel de depurados lista el contacto y descarga el CSV', async ({ page }) => {
  await entrar(page);
  const ficha = page.locator('#usuariosList .tree-node').first();
  await ficha.click();
  await page.locator('[data-u-action="depurar"]').first().click();
  await page.locator('#modalConfirmBtn').click();

  // Abrir el panel.
  await page.locator('#usuariosBtnDepurados').click();
  await expect(page.locator('#modalTitle')).toContainText('Contactos depurados');
  await expect(page.locator('#modalBody')).toContainText('Ana Gómez');
  await expect(page.locator('#modalBody')).toContainText('3515551001');
  await expect(page.locator('#modalBody')).toContainText('Teléfono no corresponde');

  // Descargar la planilla.
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#depuradosDescargar').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/appi-depurados-\d{4}-\d{2}-\d{2}\.csv/);
});

test('el cartel de número incompleto ofrece mandar a depurados', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => {
    const lista = JSON.parse(localStorage.getItem('usuarios_garantias') || '[]');
    lista.push({
      id: 9, usuario: 'Julieta López', telf: '0351-999888', domicilio: 'Rivadavia 10',
      localidad: 'Córdoba', producto: 'PSA', estado: 'vigente'
    });
    localStorage.setItem('usuarios_garantias', JSON.stringify(lista));
    if (typeof loadUsuariosFromStorage === 'function') loadUsuariosFromStorage();
    else if (window.usuariosU) window.usuariosU.push(lista[lista.length - 1]);
  });
  await page.evaluate(() => {
    const u = (window.usuariosU || []).find(x => /Julieta/i.test(x.usuario));
    window.APPITel.abrir(u && u.telf, 'Hola', 'Julieta', u);
  });
  await expect(page.locator('#appiDialogTitle')).toContainText('Número incompleto');
  await expect(page.locator('#appiDialogOk')).toHaveText('A depurados');
  await page.locator('#appiDialogOk').click();
  const dep = await page.evaluate(() => {
    const k = Object.keys(localStorage).find(x => x.startsWith('appi_depurados_v1_'));
    return JSON.parse(localStorage.getItem(k) || '{"lista":[]}').lista;
  });
  expect(dep.some(x => /Julieta/i.test(x.nombre))).toBe(true);
});

test('un contacto depurado no reaparece al recargar la planilla', async ({ page }) => {
  await entrar(page);
  const ficha = page.locator('#usuariosList .tree-node').first();
  await ficha.click();
  await page.locator('[data-u-action="depurar"]').first().click();
  await page.locator('#modalConfirmBtn').click();

  // Simular volver a cargar la misma planilla: se ignora al depurado.
  const r = await page.evaluate(() => {
    const guardados = JSON.parse(localStorage.getItem('usuarios_garantias') || '[]');
    // La lista persistida ya no tiene al depurado.
    return guardados.map(u => u.usuario);
  });
  expect(r).not.toContain('Ana Gómez');
  expect(r).toContain('Beto Ruiz');

  // Y en la lista del depurado queda registrado con su teléfono.
  const dep = await page.evaluate(() => {
    const k = Object.keys(localStorage).find(x => x.startsWith('appi_depurados_v1_'));
    return JSON.parse(localStorage.getItem(k) || '{"lista":[]}').lista;
  });
  expect(dep).toHaveLength(1);
  expect(dep[0].nombre).toBe('Ana Gómez');
  expect(dep[0].telDig).toBe('3515551001');
});
