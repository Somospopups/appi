const { test, expect } = require('@playwright/test');
const base = require('./hoy-lista-10.spec.js');

// El Reporte de Bonos (v809, v810: en Mi negocio): la info del tablero PSA
// "Bonos y Bonus" vive SIEMPRE VISIBLE en la parte superior de MI NEGOCIO
// (los botones quedan abajo) y se actualiza al ingresar a la app.
// Acá la función consulta-serial va mockeada.

const BONOS = {
  dip: '2-98020174', nombre: 'SILVIA DEL VALLE TOLEDO', socio: 'DIAZ,GERMAN EZEQUIEL',
  sucursal: '2 - CORDOBA', categoria: '5 - Líder de Equipo Pionero', pais: 'Argentina',
  periodo: 'Septiembre-2026',
  acumulacion: [
    { c: '1', r: 'Volumen Personal', pb: '2.95', pi: '0.00' },
    { c: '3', r: 'Org. de Dist. Junior', pb: '2.95', pi: '0.00' },
    { c: '8', r: 'Lider', pb: '285.41', pi: '0.00' }
  ],
  bonos: [
    { d: 'Capacitaciones básicas', pct: '0.00', total: '0.00', mov: '0.00', estado: 'Calificó', imp: '0.01' },
    { d: 'Sobre Org. Distribuidor Junior', pct: '15.00', total: '2.95', mov: '0.00', estado: 'Calificó', imp: '50445.00' },
    { d: 'Asist. Org. DC (A+B+C)', pct: '5.00', total: '36.74', mov: '23.65', estado: 'Calificó', imp: '212343.00' },
    { d: 'Org.Lider I', pct: '2.00', total: '0.00', mov: '288.36', estado: 'Faltan 431.64', imp: '0.00' }
  ],
  total: '466488.01',
  aviso: ''
};

function credsInit() {
  return (page) => page.addInitScript(() => {
    try {
      localStorage.setItem('appsi_psa_creds', JSON.stringify({ center: '02', number: '98020174', password: 'Nico2026', remember: true }));
    } catch (e) {}
  });
}

function mockBonos(page, { falla = false } = {}) {
  // Registrado DESPUÉS de entrar() → gana por ser el último en registrarse.
  page.route('**/functions/v1/consulta-serial', (route) => {
    let body = {};
    try { body = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
    if (body.action === 'bonos') {
      if (falla) return route.fulfill({ status: 502, contentType: 'application/json', body: JSON.stringify({ error: 'PSA caído' }) });
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, bonos: BONOS }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, total: 0, filas: [] }) });
  });
}

test('el reporte de bonos vive arriba de Mi negocio, no oculto', async ({ page }) => {
  await credsInit(page);
  await base.entrar(page);
  mockBonos(page);
  await page.evaluate(() => window.APBon.fetch());
  await expect(page.locator('#bonosCard')).toContainText('Reporte de Bonos', { timeout: 15000 });

  await page.evaluate(() => window.showView('view-negocio'));
  await expect(page.locator('#bonosCard .bns-card')).toBeVisible();

  // Datos del tablero PSA con formato argentino
  await expect(page.locator('#bonosCard')).toContainText('Septiembre-2026');
  await expect(page.locator('#bonosCard')).toContainText('SILVIA DEL VALLE TOLEDO');
  await expect(page.locator('#bonosCard')).toContainText('2-98020174');
  await expect(page.locator('#bonosCard')).toContainText('Líder de Equipo Pionero');
  await expect(page.locator('#bonosCard')).toContainText('285,41');
  await expect(page.locator('#bonosCard')).toContainText('$ 50.445');
  await expect(page.locator('#bonosCard')).toContainText('$ 466.488,01');
  await expect(page.locator('#bonosCard .bns-b-est.falta')).toHaveText('faltan 431,64');

  // Justo arriba de los botones (grilla #negGrid), no debajo ni en un modal
  const orden = await page.evaluate(() => {
    const bonos = document.querySelector('#bonosCard .bns-card');
    const grid = document.querySelector('#negGrid');
    if (!bonos) return null;
    const rb = bonos.getBoundingClientRect();
    if (rb.height === 0) return false;
    if (!grid || !grid.offsetWidth) return true;
    return rb.top < grid.getBoundingClientRect().top && rb.bottom > 0;
  });
  expect(orden).toBe(true);
  // Sin overlay/modal: el card es hijo directo de la vista
  expect(await page.locator('#calOverlay.open, .cal-overlay.open').count()).toBe(0);
});

test('al entrar a la app se dispara la consulta de bonos (action bonos)', async ({ page }) => {
  const peticiones = [];
  page.on('request', (r) => {
    if (!r.url().includes('/functions/v1/consulta-serial')) return;
    try { peticiones.push(JSON.parse(r.postData() || '{}')); } catch (e) {}
  });
  await credsInit(page);
  await base.entrar(page);
  // El arranque lo pide solo a los ~1,5 s (con o sin "recordar").
  await page.waitForTimeout(5000);
  expect(peticiones.some((b) => b && b.action === 'bonos')).toBe(true);
});

test('sin internet: muestra la última copia guardada con aviso', async ({ page }) => {
  await credsInit(page);
  await base.entrar(page);
  mockBonos(page);
  await page.evaluate(() => window.APBon.fetch());
  await expect(page.locator('#bonosCard')).toContainText('Septiembre-2026', { timeout: 15000 });

  // Ahora PSA cae y se intenta actualizar
  mockBonos(page, { falla: true });
  await page.evaluate(() => window.APBon.fetch().catch(() => {}));
  await expect(page.locator('#bonosCard .bns-aviso')).toContainText('PSA caído', { timeout: 15000 });
  // Los datos viejos siguen a la vista
  await expect(page.locator('#bonosCard')).toContainText('Septiembre-2026');
  await expect(page.locator('#bonosCard')).toContainText('$ 466.488,01');
  await expect(page.locator('#bonosCard .bns-foot')).toContainText('Actualizado');
});
