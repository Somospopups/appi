const { test, expect } = require('@playwright/test');
const base = require('./hoy-lista-10.spec.js');

// v813 — Usuarios reasignados:
// La planilla trae una columna "DIP reasignado" con el nombre del ex
// distribuidor cuando la empresa reasigna un usuario. La app debe:
// 1) detectar la columna al parsear,
// 2) marcar a esos usuarios en el listado (pildora ↻ + "Reasignado de: X"),
// 3) ofrecer el filtro "solo reasignados",
// 4) al tocarles 💬 WhatsApp, abrir el mensaje de recontacto (garantías +
//    ex distribuidor fuera del sistema + mi nombre del campo de Mi Perfil).

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

  // Contador del botón de filtro
  await expect(page.locator('#usuariosStReasig')).toHaveText('1');

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
