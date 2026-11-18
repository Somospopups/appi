const { test, expect } = require('@playwright/test');
const { entrar, continuarLista } = require('./helpers/app-entrar.js');
const fs = require('fs');
const path = require('path');
const planes = require('../../psa-planes.json');

/* Edición auditada 16-Nov-2026 (vigencia 12 al 23 de noviembre de 2026).
   Los cuotas son las que expone EXCLUSIVAMENTE el PDF legal oficial de esa
   edición. Los bancos cuya cantidad de cuotas no aparece explícitamente en
   la pieza legal (BBVA, Nación, Macro, Santander, Hipotecario, American
   Express) NO se anuncian con cuotas inventadas: quedan fuera hasta que se
   audite la pieza bancaria específica. */
const esperado = {
  'cuota-simple': [3, 6, 9, 12, 15, 18],
  'tarjeta-naranja': [6, 9, 12],
  'banco-galicia': [3, 6, 9, 12],
  'banco-provincia': [3, 6, 9, 12, 15, 18],
  'cabal': [3, 6, 9, 12, 18]
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

test('la tabla de financiación contiene sólo las entidades oficiales aprobadas', async () => {
  expect(planes.fuente_legal).toContain('legales-financiacion-vigencia_16-11-2026.pdf');
  expect(planes.vigencia).toBe('12-Nov-2026 al 23-Nov-2026');
  expect(Object.fromEntries(planes.bancos.map(b => [b.id, b.cuotas]))).toEqual(esperado);
  expect(planes.cuotas).toEqual([3, 6, 9, 12, 15, 18]);
  expect(planes.bancos.map(b => b.nombre)).toEqual([
    'Cuota Simple', 'Naranja X', 'Galicia', 'Banco Provincia', 'Credicoop / Cabal'
  ]);
  expect(planes.bancos.find(b => b.id === 'tarjeta-naranja')).toMatchObject({
    desde: '2026-11-16', hasta: '2026-11-18'
  });
  expect(planes.bancos.find(b => b.id === 'banco-galicia')).toMatchObject({
    desde: '2026-11-12', hasta: '2026-11-23'
  });
  expect(planes.bancos.find(b => b.id === 'banco-galicia').beneficio).toContain('3, 6, 9 y 12 cuotas sin interés');
  expect(planes.bancos.find(b => b.id === 'banco-provincia').beneficio).toContain('18 cuotas sin interés');
  expect(planes.bancos.find(b => b.id === 'cabal')).toMatchObject({
    nombre: 'Credicoop / Cabal',
    cuotas: [3, 6, 9, 12, 18],
    desde: '2026-11-12',
    hasta: '2026-11-23',
    beneficio: '3, 6, 9, 12 y 18 cuotas sin interés'
  });
  expect(planes.bancos.find(b => b.id === 'cabal').beneficio).not.toContain('reintegro');

  const updater = fs.readFileSync(path.join(__dirname, '../../scripts/actualizar-precios-psa.py'), 'utf8');
  expect(updater).toContain('PLANES_VERIFICADOS');
  // El updater no debe publicar un plan nuevo no auditado en silencio: debe
  // fallar de calle cuando la edición no está en el archivo verificado.
  expect(updater).toContain('financiación no auditable');
  expect(updater).not.toContain('cuotas_de(bloque) or list(cuotas_tienda)');
});

test('el 17/11 ofrece las cuotas exactas y explica beneficio, canal y vigencia', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const sheet = await abrirPresupuestoEn(page, '2026-11-17');

  await sheet.getByRole('button', { name: 'Naranja X', exact: true }).click();
  expect(await cuotasVisibles(page)).toEqual([6, 9, 12]);
  await expect(sheet.locator('#lpPlanInfo')).toContainText('12 cuotas sin interés + 10% off sin tope');
  await expect(sheet.locator('#lpPlanInfo')).toContainText('16 al 18 de noviembre de 2026');
  await expect(sheet.locator('#lpPlanInfo')).toContainText('ATM > Link de Pago');

  await sheet.getByRole('button', { name: 'Cuota Simple', exact: true }).click();
  expect(await cuotasVisibles(page)).toEqual([3, 6, 9, 12, 15, 18]);
  await expect(sheet.locator('#lpPlanInfo')).toContainText('Exclusivo a través de MODO');

  await sheet.getByRole('button', { name: 'Galicia', exact: true }).click();
  expect(await cuotasVisibles(page)).toEqual([3, 6, 9, 12]);

  await sheet.getByRole('button', { name: 'Banco Provincia', exact: true }).click();
  expect(await cuotasVisibles(page)).toEqual([3, 6, 9, 12, 15, 18]);

  await sheet.getByRole('button', { name: 'Credicoop / Cabal', exact: true }).click();
  expect(await cuotasVisibles(page)).toEqual([3, 6, 9, 12, 18]);
  await expect(sheet.locator('#lpPlanInfo')).toContainText('12 al 23 de noviembre de 2026');
  await expect(sheet.locator('#lpPlanInfo')).toContainText('Exclusivo a través de MODO');
  await expect(sheet.locator('#lpPlanInfo')).not.toContainText('10% de reintegro');
});

test('oculta cada plan automáticamente cuando vence y descarta una selección expirada', async ({ page }) => {
  // 24/11: toda la campaña (12 al 23/11) ya venció; queda solo Contado.
  const sheet = await abrirPresupuestoEn(page, '2026-11-24', { cuotas: 18, banco: 'tarjeta-naranja' });

  await expect(sheet.getByRole('button', { name: 'Naranja X', exact: true })).toHaveCount(0);
  await expect(sheet.getByRole('button', { name: 'Cuota Simple', exact: true })).toHaveCount(0);
  await expect(sheet.getByRole('button', { name: 'Galicia', exact: true })).toHaveCount(0);
  await expect(sheet.getByRole('button', { name: 'Credicoop / Cabal', exact: true })).toHaveCount(0);
  await expect(sheet.locator('#lpSheetTot')).toContainText('Contado');
  await expect(sheet.locator('#lpCuotas [data-cuotas]')).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('appi_lista_pago_v1') || '{}')))
    .toEqual({ cuotas: 1, banco: '' });
});

test('respeta los comienzos: Naranja empieza el 16/11 y el 12/11 ya hay planes', async ({ page }) => {
  // 15/11: Naranja (16-18/11) aún no empezó; los demás ya están vigentes.
  let sheet = await abrirPresupuestoEn(page, '2026-11-15');
  await expect(sheet.getByRole('button', { name: 'Naranja X', exact: true })).toHaveCount(0);
  await expect(sheet.getByRole('button', { name: 'Cuota Simple', exact: true })).toHaveCount(1);
  await expect(sheet.getByRole('button', { name: 'Credicoop / Cabal', exact: true })).toHaveCount(1);

  // 12/11: la campaña nacional ya empezó.
  const browser = page.context().browser();
  await page.close();
  const contexto = await browser.newContext();
  const otra = await contexto.newPage();
  sheet = await abrirPresupuestoEn(otra, '2026-11-12');
  await expect(sheet.getByRole('button', { name: 'Cuota Simple', exact: true })).toHaveCount(1);
  await expect(sheet.getByRole('button', { name: 'Naranja X', exact: true })).toHaveCount(0);
  await contexto.close();
});
