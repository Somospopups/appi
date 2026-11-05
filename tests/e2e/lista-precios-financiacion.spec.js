const { test, expect } = require('@playwright/test');
const { entrar, continuarLista } = require('./helpers/app-entrar.js');
const fs = require('fs');
const path = require('path');
const planes = require('../../psa-planes.json');

const esperado = {
  'tarjeta-naranja': [6, 9, 12, 18],
  macro: [3, 6, 9, 12, 15, 18, 24],
  'banco-galicia': [3, 6, 9, 12],
  'banco-provincia': [3, 6, 9, 12, 15, 18],
  'american-express': [3, 6, 9, 12],
  bbva: [3, 6, 9, 12],
  'cuota-simple': [3, 6, 9, 12, 15, 18],
  'banco-nacion': [3, 6, 9, 12, 15, 18],
  santander: [3, 6, 9, 12],
  hipotecario: [9, 12],
  cabal: [3, 6, 9, 12, 18]
};

const cuotasVisibles = page => page.locator('#lpCuotas [data-cuotas]').evaluateAll(
  botones => botones.map(b => Number(b.getAttribute('data-cuotas')))
);

async function abrirPresupuestoEn(page, fecha, pagoGuardado) {
  await page.addInitScript(({ dia, pago }) => {
    window.__APPI_FECHA_PROMO__ = dia;
    if (pago) localStorage.setItem('appi_lista_pago_v1', JSON.stringify(pago));
  }, { dia: fecha, pago: pagoGuardado || null });
  await entrar(page);
  await page.evaluate(() => { if (typeof openLista === 'function') openLista(); });
  await page.waitForSelector('.lp-item', { timeout: 10000 });
  await continuarLista(page);
  await page.fill('#lpSearch', '611010510');
  await page.locator('#lpList .lp-price-choice').nth(1).click();
  await page.locator('#lpFab').click();
  const sheet = page.locator('#lpSheet');
  await expect(sheet).toHaveClass(/open/);
  return sheet;
}

test('la tabla CyberWeek contiene sólo las once entidades oficiales aprobadas', async () => {
  expect(planes.actualizado).toBe('5-Nov-2026');
  expect(planes.fuente_legal).toContain('legales-financiacion-vigencia_2-11-2026.pdf');
  expect(Object.fromEntries(planes.bancos.map(b => [b.id, b.cuotas]))).toEqual(esperado);
  expect(planes.cuotas).toEqual([3, 6, 9, 12, 15, 18, 24]);
  expect(planes.bancos.map(b => b.nombre)).toEqual([
    'Naranja X', 'Macro', 'Galicia', 'Banco Provincia', 'American Express', 'BBVA',
    'Cuota Simple', 'Nación', 'Santander', 'Hipotecario', 'Credicoop / Cabal'
  ]);
  expect(planes.bancos.find(b => b.id === 'tarjeta-naranja')).toMatchObject({
    desde: '2026-11-02', hasta: '2026-11-08'
  });
  expect(planes.bancos.find(b => b.id === 'banco-galicia')).toMatchObject({
    hasta: '2026-11-10'
  });
  expect(planes.bancos.find(b => b.id === 'banco-galicia').beneficio).toContain('10% de reintegro sin tope');
  expect(planes.bancos.find(b => b.id === 'banco-provincia').beneficio).toContain('18 cuotas sin interés + 10%');
  expect(planes.bancos.find(b => b.id === 'cabal')).toMatchObject({
    nombre: 'Credicoop / Cabal',
    cuotas: [3, 6, 9, 12, 18],
    desde: '2026-11-05',
    hasta: '2026-11-11',
    beneficio: '3, 6, 9, 12 y 18 cuotas sin interés'
  });
  expect(planes.bancos.find(b => b.id === 'cabal').beneficio).not.toContain('reintegro');

  const updater = fs.readFileSync(path.join(__dirname, '../../scripts/actualizar-precios-psa.py'), 'utf8');
  expect(updater).toContain('PLANES_VERIFICADOS');
  expect(updater).not.toContain('cuotas_de(bloque) or list(cuotas_tienda)');
});

test('el 5/11 ofrece las cuotas exactas y explica beneficio, canal y vigencia', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const sheet = await abrirPresupuestoEn(page, '2026-11-05');

  await sheet.getByRole('button', { name: 'Naranja X', exact: true }).click();
  expect(await cuotasVisibles(page)).toEqual([6, 9, 12, 18]);
  await expect(sheet.locator('#lpPlanInfo')).toContainText('Plan Z');
  await expect(sheet.locator('#lpPlanInfo')).toContainText('2 al 8 de noviembre de 2026');
  await expect(sheet.locator('#lpPlanInfo')).toContainText('ATM > Link de Pago');

  await sheet.getByRole('button', { name: 'Macro', exact: true }).click();
  expect(await cuotasVisibles(page)).toEqual([3, 6, 9, 12, 15, 18, 24]);

  await sheet.getByRole('button', { name: 'Galicia', exact: true }).click();
  expect(await cuotasVisibles(page)).toEqual([3, 6, 9, 12]);
  await expect(sheet.locator('#lpPlanInfo')).toContainText('10% de reintegro sin tope');

  await sheet.getByRole('button', { name: 'Banco Provincia', exact: true }).click();
  expect(await cuotasVisibles(page)).toEqual([3, 6, 9, 12, 15, 18]);
  await expect(sheet.locator('#lpPlanInfo')).toContainText('18 cuotas sin interés + 10%');

  await sheet.getByRole('button', { name: 'Credicoop / Cabal', exact: true }).click();
  expect(await cuotasVisibles(page)).toEqual([3, 6, 9, 12, 18]);
  await expect(sheet.locator('#lpPlanInfo')).toContainText('5 al 11 de noviembre de 2026');
  await expect(sheet.locator('#lpPlanInfo')).toContainText('Exclusivo a través de MODO');
  await expect(sheet.locator('#lpPlanInfo')).not.toContainText('10% de reintegro');
});

test('oculta cada plan automáticamente cuando vence y descarta una selección expirada', async ({ page }) => {
  const sheet = await abrirPresupuestoEn(page, '2026-11-09', { cuotas: 18, banco: 'tarjeta-naranja' });

  await expect(sheet.getByRole('button', { name: 'Naranja X', exact: true })).toHaveCount(0);
  await expect(sheet.getByRole('button', { name: 'Macro', exact: true })).toHaveCount(0);
  await expect(sheet.getByRole('button', { name: 'Galicia', exact: true })).toHaveCount(1);
  await expect(sheet.getByRole('button', { name: 'Credicoop / Cabal', exact: true })).toHaveCount(1);
  await expect(sheet.locator('#lpSheetTot')).toContainText('Contado');
  await expect(sheet.locator('#lpCuotas [data-cuotas]')).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('appi_lista_pago_v1') || '{}')))
    .toEqual({ cuotas: 1, banco: '' });
});

test('respeta los comienzos y deja sólo contado después del 11/11', async ({ page }) => {
  let sheet = await abrirPresupuestoEn(page, '2026-11-04');
  await expect(sheet.getByRole('button', { name: 'Credicoop / Cabal', exact: true })).toHaveCount(0);

  const browser = page.context().browser();
  await page.close();
  const contexto = await browser.newContext();
  const otra = await contexto.newPage();
  sheet = await abrirPresupuestoEn(otra, '2026-11-12');
  await expect(sheet.locator('#lpBancos [data-banco]')).toHaveCount(1);
  await expect(sheet.getByRole('button', { name: 'Contado', exact: true })).toHaveCount(1);
  await expect(sheet.locator('#lpCuotas [data-cuotas]')).toHaveCount(0);
  await contexto.close();
});
