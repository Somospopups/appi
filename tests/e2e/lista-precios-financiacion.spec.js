const { test, expect } = require('@playwright/test');
const { entrar, continuarLista } = require('./helpers/app-entrar.js');
const fs = require('fs');
const path = require('path');
const planes = require('../../psa-planes.json');

const esperado = {
  'cuota-simple': [3, 6, 9, 12, 15, 18],
  'tarjeta-naranja': [6, 9, 12, 18],
  macro: [3, 6, 9, 12, 15, 18, 24],
  'banco-galicia': [3, 6, 9, 12],
  'banco-provincia': [3, 6, 9, 12, 15, 18],
  'american-express': [3, 6, 9, 12],
  bbva: [3, 6, 9, 12],
  cabal: [3, 6, 9, 12, 18],
  'banco-nacion': [3, 6, 9, 12, 15, 18],
  santander: [3, 6, 9, 12],
  hipotecario: [9, 12],
  'tarjeta-patagonia-365': [3, 6, 12],
  'tarjeta-tuya': [3, 5, 9],
  'tarjeta-data': [2, 3, 6],
  'banco-del-sol': [15, 18],
  'tarjeta-sol': [3, 6, 9, 12]
};

const cuotasVisibles = page => page.locator('#lpCuotas [data-cuotas]').evaluateAll(
  botones => botones.map(b => Number(b.getAttribute('data-cuotas')))
);

test('la tabla publicada coincide con la financiación oficial vigente desde el 2 de noviembre', async () => {
  // `actualizado` refleja el último control automático y puede avanzar cada
  // día; la vigencia y el PDF legal son los que identifican la promoción.
  expect(planes.actualizado).toMatch(/^\d{1,2}-Nov-2026$/);
  expect(planes.fuente_legal).toContain('legales-financiacion-vigencia_2-11-2026.pdf');
  expect(Object.fromEntries(planes.bancos.map(b => [b.id, b.cuotas]))).toEqual(esperado);
  expect(planes.bancos.find(b => b.id === 'tarjeta-naranja')).toMatchObject({
    nombre: 'Naranja X', hasta: '2026-11-08'
  });
  expect(planes.bancos.find(b => b.id === 'banco-galicia').beneficio).toContain('10% de reintegro sin tope');
  expect(planes.bancos.find(b => b.id === 'banco-provincia').beneficio).toContain('18 cuotas sin interés + 10%');
  expect(planes.bancos.find(b => b.id === 'cabal')).toMatchObject({ hasta: '2026-11-04' });

  const updater = fs.readFileSync(path.join(__dirname, '../../scripts/actualizar-precios-psa.py'), 'utf8');
  expect(updater).toContain('PLANES_VERIFICADOS');
  expect(updater).not.toContain('cuotas_de(bloque) or list(cuotas_tienda)');
});

test('Presupuesto ofrece las cuotas exactas y explica beneficio, canal y vigencia', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await entrar(page);
  await page.evaluate(() => { if (typeof openLista === 'function') openLista(); });
  await page.waitForSelector('.lp-item', { timeout: 10000 });
  await continuarLista(page);
  await page.fill('#lpSearch', '611010510');
  await page.locator('#lpList .lp-price-choice').nth(1).click();
  await page.locator('#lpFab').click();
  const sheet = page.locator('#lpSheet');
  await expect(sheet).toHaveClass(/open/);

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

  await sheet.getByRole('button', { name: 'Hipotecario', exact: true }).click();
  expect(await cuotasVisibles(page)).toEqual([9, 12]);

  await sheet.getByRole('button', { name: 'Data', exact: true }).click();
  expect(await cuotasVisibles(page)).toEqual([2, 3, 6]);

  await sheet.getByRole('button', { name: 'Banco del Sol', exact: true }).click();
  expect(await cuotasVisibles(page)).toEqual([15, 18]);
  await expect(sheet.locator('#lpPlanInfo')).toContainText('Vigencia: 2 al 11 de noviembre de 2026');
});
