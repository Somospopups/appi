const { test, expect } = require('@playwright/test');
const base = require('./helpers/app-entrar.js');

// v813 — Usuarios reasignados:
// La planilla trae una columna "DIP reasignado" con el nombre del ex
// distribuidor cuando la empresa reasigna un usuario. La app debe:
// 1) detectar la columna al parsear,
// 2) marcar a esos usuarios en el listado (pildora ↻ + "Reasignado de: X"),
// 3) ofrecer el filtro "solo reasignados",
// 4) al tocarles 💬 WhatsApp, abrir el mensaje de recontacto (garantías +
//    ex distribuidor fuera del sistema + mi nombre del campo de Mi Perfil).

const USER_ID = '22222222-2222-4222-8222-222222222222';
function tokenFor(sub) {
  const h = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${h}.${p}.firma`;
}

const USUARIOS = [
  {
    id: 0, usuario: 'MARIA GONZALEZ', telf: '3515550123', domicilio: 'Calle 1 123',
    cp: '5000', localidad: 'Centro', producto: 'PSA Senik', serie: 'SN123',
    fCompra: '01/03/2024', fVenceRaw: '30/12/2026', fVence: '2026-12-30T00:00:00.000Z',
    email: '', dipReasignado: 'JUAN CARLOS PEREZ', reasignado: true,
    estado: 'vigente', nombreNorm: 'maria gonzalez'
  },
  {
    id: 1, usuario: 'PEDRO LUIZ', telf: '3515550456', domicilio: 'Av. 2 456',
    cp: '5000', localidad: 'Centro', producto: 'PSA Domus', serie: '',
    fCompra: '01/05/2025', fVenceRaw: '15/01/2027', fVence: '2027-01-15T00:00:00.000Z',
    email: '', dipReasignado: '', reasignado: false,
    estado: 'vigente', nombreNorm: 'pedro luiz'
  }
];

// La base entrar() siembra sus propios usuarios; los reemplazamos a
// RUNTIME (después del login) para que gane este fixture.
async function abrirUsuarios(page) {
  await base.entrar(page);
  await page.evaluate((data) => {
    localStorage.setItem('usuarios_garantias', JSON.stringify(data));
    localStorage.setItem('lastUpdate_usuarios', String(Date.now()));
    localStorage.setItem('lastUpdate_garantias', String(Date.now()));
    localStorage.setItem('appi_firma_wa_v1', 'Nico');
    if (typeof window.recargarUsuariosDeStorage === 'function') window.recargarUsuariosDeStorage();
    window.showView('view-usuarios');
  }, USUARIOS);
  await expect(page.locator('#usuariosList .tree-node')).toHaveCount(2, { timeout: 15000 });
}

test('la columna "DIP reasignado" de la planilla se detecta y marca al usuario', async ({ page }) => {
  await base.entrar(page);
  const res = await page.evaluate(() => {
    const rows = [
      ['Usuario', 'Domicilio', 'Localidad', 'F. Vence', 'Tel', 'DIP reasignado'],
      ['MARIA GONZALEZ', 'Calle 1 123', 'Centro', '30/12/2026', '3515550123', 'JUAN CARLOS PEREZ'],
      ['PEDRO LUIZ', 'Av. 2 456', 'Centro', '15/01/2027', '3515550456', '']
    ];
    const r = window.parseRowsU(rows);
    return r.data.map((u) => ({ u: u.usuario, dr: u.dipReasignado, re: u.reasignado }));
  });
  expect(res).toHaveLength(2);
  expect(res[0].dr).toBe('JUAN CARLOS PEREZ');
  expect(res[0].re).toBe(true);
  expect(res[1].re).toBe(false);
});

test('el reasignado lleva pildora ↻ y al abrirlo dice de quién es (v813)', async ({ page }) => {
  await abrirUsuarios(page);

  const filaMaria = page.locator('#usuariosList .tree-node', { hasText: 'MARIA GONZALEZ' });
  await expect(filaMaria).toContainText('↻');
  // El usuario normal no la lleva
  const filaPedro = page.locator('#usuariosList .tree-node', { hasText: 'PEDRO LUIZ' });
  await expect(filaPedro).not.toContainText('↻');

  // Contador del botón de filtro (badge con la cantidad)
  await expect(page.locator('#usuariosStReasig')).toHaveText('1');
  await expect(page.locator('#usuariosStReasig')).toHaveClass(/on/);
  // La etiqueta del botón no lleva los paréntesis: solo "Reasignados"
  await expect(page.locator('#usuariosBtnReasig')).not.toContainText('(');
  // La planilla trae el campo → no hay aviso de planilla vieja (v816)
  await expect(page.locator('#usuariosAvisoReasig')).toBeHidden();

  // Al expandir la fila aparece "Reasignado de: JUAN CARLOS PEREZ"
  await filaMaria.click();
  await expect(page.locator('#usuariosList')).toContainText('Reasignado de: JUAN CARLOS PEREZ');
});

test('el filtro "solo reasignados" muestra únicamente esos usuarios (v813)', async ({ page }) => {
  await abrirUsuarios(page);

  const btn = page.locator('#usuariosBtnReasig');
  await expect(btn).toBeVisible();
  await btn.click();
  await expect(btn).toHaveClass(/activo/);
  await expect(page.locator('#usuariosList .tree-node', { hasText: 'MARIA GONZALEZ' })).toBeVisible();
  await expect(page.locator('#usuariosList .tree-node', { hasText: 'PEDRO LUIZ' })).toHaveCount(0);
  // El banner de filtros lo declara
  await expect(page.locator('#usuariosActiveFilters')).toContainText('Solo reasignados');

  // Tocar de nuevo vuelve al listado completo
  await btn.click();
  await expect(page.locator('#usuariosList .tree-node')).toHaveCount(2);
});

test('el filtro Reasignados está siempre visible, aunque no haya ninguno (v814)', async ({ page }) => {
  await base.entrar(page);
  await page.evaluate(() => {
    const sinReasig = [
      { id: 0, usuario: 'PEDRO LUIZ', telf: '3515550456', domicilio: 'Av. 2 456', cp: '5000', localidad: 'Centro', producto: 'PSA Domus', serie: '', fCompra: '01/05/2025', fVenceRaw: '15/01/2027', fVence: '2027-01-15T00:00:00.000Z', email: '', dipReasignado: '', reasignado: false, estado: 'vigente', nombreNorm: 'pedro luiz' }
    ];
    localStorage.setItem('usuarios_garantias', JSON.stringify(sinReasig));
    if (typeof window.recargarUsuariosDeStorage === 'function') window.recargarUsuariosDeStorage();
    window.showView('view-usuarios');
  });
  const btn = page.locator('#usuariosBtnReasig');
  await expect(btn).toBeVisible();
  await expect(page.locator('#usuariosStReasig')).toHaveText('0');
  await expect(page.locator('#usuariosStReasig')).not.toHaveClass(/on/);
  // Filtrar con 0 reasignados muestra el estado vacío y se puede volver
  await btn.click();
  await expect(page.locator('#usuariosList')).toContainText('Sin usuarios con esos filtros');
  await btn.click();
  await expect(page.locator('#usuariosList .tree-node')).toHaveCount(1);
});

test('💬 WhatsApp de un reasignado ofrece el mensaje de recontacto primero (v813)', async ({ page }) => {
  await abrirUsuarios(page);

  // Capturar lo que abriría en WhatsApp. Devolver un objeto "ventana" para
  // que APPIWhatsApp no haga el fallback a location.href (navegaría la app).
  await page.evaluate(() => {
    window.__waUrls = [];
    window.open = (u) => { window.__waUrls.push(u); return { closed: false, location: { href: u } }; };
  });

  const filaMaria = page.locator('#usuariosList .tree-node', { hasText: 'MARIA GONZALEZ' });
  await filaMaria.click();
  await page.locator('#usuariosList .tree-children .action-btn.wa').first().click();

  // Se abre la hoja de mensajes con la pantalla de RECONTACTO (no el hielo)
  await expect(page.locator('#muOverlay.open #muTitulo')).toHaveText(/Recontacto para/);
  const prev = page.locator('#muOverlay.open #muPrevTxt');
  await expect(prev).toContainText('Hola MARIA GONZALEZ!');
  await expect(prev).toContainText('La empresa tiene un sistema de garantías cargado');
  await expect(prev).toContainText('JUAN CARLOS PEREZ');
  await expect(prev).toContainText('ya no está más en el sistema');
  await expect(prev).toContainText('Mi nombre es Nico');

  // Mandarlo abre WhatsApp con ese mensaje
  await page.locator('#muMandarReasig').click();
  const urls = await page.evaluate(() => window.__waUrls);
  expect(urls).toHaveLength(1);
  const texto = decodeURIComponent(urls[0].split('text=')[1] || '');
  expect(texto).toContain('ya no está más en el sistema');
  expect(texto).toContain('Mi nombre es Nico');
  expect(urls[0]).toContain('wa.me/');

  // El usuario normal sigue con el saludo-hielo de siempre
  await page.locator('#muCerrar').click();
  await expect(page.locator('#muOverlay.open')).toHaveCount(0);
  await page.locator('#usuariosList .tree-node', { hasText: 'PEDRO LUIZ' }).click();
  await page.locator('#usuariosList .tree-children .action-btn.wa').nth(1).click();
  await expect(page.locator('#muOverlay.open #muTitulo')).toHaveText(/Saludo para/);
});

test('planilla anterior a la v813: la app migra los campos sola, sin pedir nada (v824)', async ({ page }) => {
  await base.entrar(page);
  await page.evaluate(() => {
    // Objetos SIN los campos nuevos (planilla cargada con app vieja).
    const viejos = [
      { id: 0, usuario: 'PEDRO LUIZ', telf: '3515550456', domicilio: 'Av. 2 456', cp: '5000', localidad: 'Centro', producto: 'PSA Domus', serie: '', fCompra: '01/05/2025', fVenceRaw: '15/01/2027', fVence: '2027-01-15T00:00:00.000Z', estado: 'vigente', nombreNorm: 'pedro luiz' }
    ];
    localStorage.setItem('usuarios_garantias', JSON.stringify(viejos));
    if (typeof window.recargarUsuariosDeStorage === 'function') window.recargarUsuariosDeStorage();
    window.showView('view-usuarios');
  });
  // v824: NADA de aviso ni botón pidiendo recargar a mano
  const aviso = page.locator('#usuariosAvisoReasig');
  await expect(aviso).toBeHidden();
  await expect(page.locator('#usuariosBtnReasigRecargar')).toBeHidden();
  // El badge de Reasignados queda en 0 (no hay datos para contar, sin drama)
  await expect(page.locator('#usuariosStReasig')).toHaveText('0');
  // Los campos se migraron y persistieron en localStorage
  const st = await page.evaluate(() => {
    const u = JSON.parse(localStorage.getItem('usuarios_garantias'))[0];
    return { dr: 'dipReasignado' in u, val: u.dipReasignado, reasig: 'reasignado' in u, mail: 'email' in u, cn: 'cumpleRaw' in u };
  });
  expect(st.dr).toBe(true);
  expect(st.val).toBe('');
  expect(st.reasig).toBe(true);
  expect(st.mail).toBe(true);
  expect(st.cn).toBe(true);
});

test('la sync automática de PSA trae los reasignados sola, sin carga manual (v817)', async ({ page }) => {
  // Mock de la nube: auth-config + edge function consulta-serial (action:'report')
  // devolviendo filas CON los campos nuevos: dr = Dip reasignado, e = mail, cn = cumpleaños.
  await page.route('**/auth-config.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: "window.APPI_AUTH={enabled:true,url:'https://mock.supabase.co',anonKey:'anon-key-publica-de-prueba',distributorEmailDomain:'distribuidores.appi.invalid',adminLogin:{username:'popups',email:'admin-popups@appi.invalid'},loginAliases:{},offlineDays:7};"
  }));
  await page.route('https://mock.supabase.co/**', route => {
    const url = new URL(route.request().url());
    const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
    if (url.pathname === '/auth/v1/token') {
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ access_token: tokenFor(USER_ID), refresh_token: 'r', expires_in: 3600, user: { id: USER_ID } }) });
    }
    if (url.pathname === '/functions/v1/consulta-serial') {
      const body = route.request().postDataJSON() || {};
      if (body.action === 'report') {
        return route.fulfill({
          status: 200, headers: cors,
          body: JSON.stringify({
            ok: true, total: 2,
            filas: [
              { s: 'HTA69440', u: 'ALONSO, ARTURO ALONSO', t: '0351-4552272', d: 'ANDALUCIA 1936', c: 'X5014', l: 'BARRIO COLON', p: 'PSA VERO', c2: '17/04/2022', v: '17/10/2025', dr: 'PECORA, NORMA BEATRIZ', e: 'alonso@mail.com', cn: '08/03' },
              { s: 'HTA69441', u: 'GARCIA, MARTA ELENA', t: '3515551001', d: 'COLON 1200', c: '5000', l: 'CENTRO', p: 'PSA SENIOR', c2: '10/01/2023', v: '10/01/2026', dr: '', e: '', cn: '' }
            ]
          })
        });
      }
    }
    return route.fulfill({ status: 200, headers: cors, body: '[]' });
  });
  await page.addInitScript(() => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('appi_tarjetas_auto', '0');
    localStorage.setItem('tutoVisto_v2', '1');
    localStorage.setItem('appsi_psa_creds', JSON.stringify({ center: '02', number: '9802014', password: 'clave-secreta', remember: true }));
    localStorage.removeItem('usuarios_garantias');
  });
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    const lock = document.getElementById('lockScreen');
    if (lock) lock.classList.add('hidden');
    const boot = document.getElementById('bootScreen');
    if (boot) { boot.classList.add('gone'); boot.remove(); }
    document.body.classList.remove('appi-login-abierto');
    window.showView('view-usuarios');
  });

  // La sync (la misma que corre sola al abrir la app) puebla la base
  const res = await page.evaluate(async () => new Promise(resolve => {
    window.sincronizarGarantiasPSA(success => {
      resolve({ success, count: (window.usuariosU || []).length, stored: JSON.parse(localStorage.getItem('usuarios_garantias') || '[]') });
    });
  }));
  expect(res.success).toBe(true);
  expect(res.count).toBe(2);
  // Los campos nuevos quedan guardados en la base (y en la nube, vía saveKey)
  expect(res.stored[0].dipReasignado).toBe('PECORA, NORMA BEATRIZ');
  expect(res.stored[0].reasignado).toBe(true);
  expect(res.stored[0].email).toBe('alonso@mail.com');
  expect(res.stored[0].cumpleRaw).toBe('08/03');
  expect(res.stored[1].reasignado).toBe(false);

  // El badge del botón Reasignados muestra 1 y la fila lleva la pildora ↻
  await expect(page.locator('#usuariosStReasig')).toHaveText('1');
  await expect(page.locator('#usuariosStReasig')).toHaveClass(/on/);
  await expect(page.locator('#usuariosList .tree-node', { hasText: 'ALONSO, ARTURO ALONSO' })).toContainText('↻');
  // La base es "nueva" (trae el campo) → no aparece el aviso de planilla vieja
  await expect(page.locator('#usuariosAvisoReasig')).toBeHidden();
});
