const { test, expect } = require('@playwright/test');
const base = require('./helpers/app-entrar.js');

// El Reporte de Bonos (v809 · v810: en Mi negocio · v812: botón + popup):
// en la parte SUPERIOR de MI NEGOCIO hay un BOTÓN ALARGADO; al presionarlo
// se abre un POPUP (hoja inferior) con todos los datos (reemplaza al ojito
// de v811). Acá la función consulta-serial va mockeada.

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

test('el banner PERSONAS/ACTIVOS/TOTAL PB usa el renglón "Lider" del reporte (v826)', async ({ page }) => {
  // equipoData con sumatorio propio (15.5) DISTINTO del Lider (285.41):
  // el KPI debe mostrar el del reporte, no la suma del equipo.
  await page.addInitScript(() => {
    try {
      localStorage.setItem('equipoData', JSON.stringify({ personas: [ { pnAct: '10.00' }, { pnAct: '5.50' }, { pnAct: '0' } ] }));
    } catch (e) {}
  });
  await credsInit(page);
  await base.entrar(page);
  mockBonos(page);
  await page.evaluate(() => window.APBon.fetch());
  await page.waitForFunction(() => {
    const c = JSON.parse(localStorage.getItem('appi_bonos_v1') || 'null');
    return c && c.bonos;
  });
  await page.evaluate(() => window.showView('view-negocio'));
  await expect(page.locator('#embudoKpi')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('#embudoKpi')).toContainText('285.4 PB', { timeout: 15000 });
  await expect(page.locator('#embudoKpi')).toContainText('3');
  await expect(page.locator('#embudoKpi')).toContainText('67%');
  expect(await page.locator('#embudoKpi').innerText()).not.toContain('15.5');
});

test('el botón alargado vive arriba de Mi negocio y abre el popup con los datos (v812)', async ({ page }) => {
  await credsInit(page);
  await base.entrar(page);
  mockBonos(page);
  await page.evaluate(() => window.APBon.fetch());
  await page.evaluate(() => window.showView('view-negocio'));

  // Botón alargado visible, con título + período, SIN datos abiertos
  const btn = page.locator('#bonosCard #bonosBtn');
  await expect(btn).toBeVisible();
  await expect(btn).toContainText('Reporte de Bonos');
  await expect(btn).toContainText('Septiembre-2026');
  const ancho = await page.evaluate(() => {
    const b = document.querySelector('#bonosCard #bonosBtn');
    return b ? b.getBoundingClientRect().width : 0;
  });
  expect(ancho).toBeGreaterThanOrEqual(240);
  // Los datos NO están a la vista ni en el DOM abierto
  await expect(page.locator('#bonosCard')).not.toContainText('SILVIA DEL VALLE TOLEDO');
  await expect(page.locator('#bnsOverlay.bns-open')).toHaveCount(0);

  // Justo arriba de los botones (grilla #negGrid), no debajo ni en un modal
  const orden = await page.evaluate(() => {
    const bonos = document.querySelector('#bonosCard');
    const grid = document.querySelector('#negGrid');
    if (!bonos) return null;
    const rb = bonos.getBoundingClientRect();
    if (rb.height === 0) return false;
    if (!grid || !grid.offsetWidth) return true;
    return rb.top < grid.getBoundingClientRect().top && rb.bottom > 0;
  });
  expect(orden).toBe(true);

  // Al presionarlo se abre el popup (hoja inferior) con los datos
  await btn.click();
  const sheet = page.locator('#bnsOverlay.bns-open #bnsSheet');
  await expect(sheet).toBeVisible();
  await expect(sheet).toContainText('Septiembre-2026');
  await expect(sheet).toContainText('SILVIA DEL VALLE TOLEDO');
  await expect(sheet).toContainText('2-98020174');
  await expect(sheet).toContainText('Líder de Equipo Pionero');
  await expect(sheet).toContainText('285,41');
  await expect(sheet).toContainText('$ 50.445');
  await expect(sheet).toContainText('$ 466.488,01');
  await expect(page.locator('#bnsSheet .bns-b-est.falta')).toHaveText('faltan 431,64');

  // El ✕ lo cierra
  await page.locator('#bnsClose').click();
  await expect(page.locator('#bnsOverlay.bns-open')).toHaveCount(0);

  // Al salir de la vista, el popup se cierra solo
  await page.evaluate(() => window.APBon.abrir());
  await expect(page.locator('#bnsOverlay.bns-open')).toHaveCount(1);
  await page.evaluate(() => window.showView('view-home'));
  await expect(page.locator('#bnsOverlay.bns-open')).toHaveCount(0);
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

test('sin internet: el popup muestra la última copia guardada con aviso', async ({ page }) => {
  await credsInit(page);
  await base.entrar(page);
  mockBonos(page);
  await page.evaluate(() => window.APBon.fetch());
  await page.evaluate(() => window.showView('view-negocio'));
  await page.evaluate(() => window.APBon.abrir());
  const sheet = page.locator('#bnsSheet');
  await expect(sheet).toContainText('Septiembre-2026', { timeout: 15000 });

  // Ahora PSA cae y se intenta actualizar (con el popup abierto)
  mockBonos(page, { falla: true });
  await page.evaluate(() => window.APBon.fetch().catch(() => {}));
  await expect(page.locator('#bnsSheet .bns-aviso')).toContainText('PSA caído', { timeout: 15000 });
  // Los datos viejos siguen a la vista
  await expect(sheet).toContainText('Septiembre-2026');
  await expect(sheet).toContainText('$ 466.488,01');
  await expect(page.locator('#bnsSheet .bns-foot')).toContainText('Actualizado');
});

test('los estados amarillos (faltan…) quedan alineados a la derecha (v811)', async ({ page }) => {
  await credsInit(page);
  await base.entrar(page);
  mockBonos(page);
  await page.evaluate(() => window.APBon.fetch());
  await page.evaluate(() => window.showView('view-negocio'));
  await page.evaluate(() => window.APBon.abrir());
  await expect(page.locator('#bnsSheet')).toContainText('Septiembre-2026', { timeout: 15000 });
  const align = await page.evaluate(() => {
    const falta = document.querySelector('#bnsSheet .bns-b-est.falta');
    const total = document.querySelector('#bnsSheet .bns-total b');
    if (!falta || !total) return null;
    const r1 = falta.getBoundingClientRect().right;
    const r2 = total.getBoundingClientRect().right;
    return Math.abs(r1 - r2) <= 3;
  });
  expect(align).toBe(true);
});

test('el banner personas/activos/PB vive en Mi negocio, entre el reporte y los botones (v811)', async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('equipoData', JSON.stringify({ personas: [
        { nombre: 'Ana Perez', cat: 'L', pnAct: 12 },
        { nombre: 'Luis Gomez', cat: 'D', pnAct: 30 }
      ] }));
    } catch (e) {}
  });
  await base.entrar(page);
  // La inyección corre a los ~900 ms de cargar la app; la vista tiene que estar activa
  await page.evaluate(() => window.showView('view-negocio'));
  await expect(page.locator('#embudoKpi')).toBeVisible({ timeout: 20000 });
  await expect(page.locator('#embudoKpi')).toContainText('PERSONAS');
  await expect(page.locator('#embudoKpi')).toContainText('ACTIVOS');
  await expect(page.locator('#embudoKpi')).toContainText('TOTAL PB');
  const pos = await page.evaluate(() => {
    const kpi = document.getElementById('embudoKpi');
    const bonos = document.getElementById('bonosCard');
    const grid = document.getElementById('negGrid');
    const home = document.getElementById('view-home');
    if (!kpi || !bonos || !grid) return { ok: false, enNegocio: false, enHome: home ? home.contains(kpi) : null };
    const r1 = bonos.getBoundingClientRect(), r2 = kpi.getBoundingClientRect(), r3 = grid.getBoundingClientRect();
    return {
      ok: r2.top >= r1.bottom - 4 && r2.bottom <= r3.top + 4,
      enNegocio: !home.contains(kpi) && !!document.getElementById('view-negocio').contains(kpi),
      enHome: home.contains(kpi)
    };
  });
  expect(pos.enNegocio).toBe(true);
  expect(pos.enHome).toBe(false);
  expect(pos.ok).toBe(true);
});
