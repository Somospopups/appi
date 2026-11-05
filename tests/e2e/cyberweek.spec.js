const { test, expect } = require('@playwright/test');
const { entrar, continuarLista } = require('./helpers/app-entrar.js');
const beneficios = require('../../psa-beneficios.json');
const catalogo = require('../../psa-catalogo.json');

async function abrirListaEn(page, fecha) {
  await page.addInitScript(dia => { window.__APPI_FECHA_PROMO__ = dia; }, fecha);
  await entrar(page);
  await page.evaluate(() => window.abrirLista());
  await page.locator('#lpList .lp-item').first().waitFor({ state: 'visible', timeout: 15000 });
  await continuarLista(page);
}

async function producto(page, consulta) {
  await page.locator('#lpSearch').fill(consulta);
  const fila = page.locator('#lpList .lp-item').filter({ hasText: consulta });
  await expect(fila, `debe existir una única ficha para ${consulta}`).toHaveCount(1);
  return fila;
}

const money = n => '$' + Number(n).toLocaleString('es-AR');

test('CyberWeek conserva la campaña histórica y declara sólo la extensión aprobada', async () => {
  expect(beneficios.actualizado).toBe('5-Nov-2026');
  expect(beneficios.campanas.map(c => c.id)).toEqual(['cyber-monday-2026', 'cyberweek-2026']);

  const campana = beneficios.campanas.find(c => c.id === 'cyberweek-2026');
  expect(campana).toMatchObject({
    nombre: 'CyberWeek',
    desde: '2026-11-05',
    hasta: '2026-11-08',
    aplica: ['normal', 'canje'],
    no_acumulable: true
  });
  expect(campana.productos).toEqual([
    { familia: 'PSA Iontrix 3', porcentaje: 25, aplica: ['normal', 'canje'], skus: ['611290050'] },
    {
      familia: 'PSA Senior4', porcentaje: 10, aplica: ['normal', 'canje'],
      skus: ['611010510', '611010530', '611010550', '611010560', '611010730']
    },
    { familia: 'resto de productos', porcentaje: 10, aplica: ['canje'], todos_con_canje: true }
  ]);

  const preciosBase = Object.fromEntries(catalogo.productos
    .filter(p => ['611290050', '611010510', '611010550', '611010730'].includes(p.sku))
    .map(p => [p.sku, [p.precio, p.plan_canje]]));
  expect(preciosBase).toEqual({
    '611290050': [1223000, 1100700],
    '611010510': [950000, 855000],
    '611010550': [840000, 756000],
    '611010730': [950000, 855000]
  });
});

test('del 5 al 8/11 muestra Iontrix, las cinco Senior4 y el Plan Canje general', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await abrirListaEn(page, '2026-11-05');

  await expect(page.locator('.lp-promo-strip')).toContainText('CyberWeek · 5 al 8/11');
  await expect(page.locator('.lp-promo-strip')).toContainText('Iontrix 3 25%');
  await expect(page.locator('.lp-promo-strip')).toContainText('Senior4 10%');
  await expect(page.locator('.lp-promo-strip')).toContainText('Plan Canje: resto de productos 10%');

  const iontrix = await producto(page, '611290050');
  await expect(iontrix).toContainText('25% OFF');
  await expect(iontrix.locator('.lp-price-choice').nth(0)).toContainText('$1.100.700');
  await expect(iontrix.locator('.lp-price-choice').nth(0)).toContainText('$825.525');
  await expect(iontrix.locator('.lp-price-choice').nth(1)).toContainText('$1.223.000');
  await expect(iontrix.locator('.lp-price-choice').nth(1)).toContainText('$917.250');

  const senior4 = {
    '611010510': ['$769.500', '$855.000'],
    '611010530': ['$769.500', '$855.000'],
    '611010550': ['$680.400', '$756.000'],
    '611010560': ['$769.500', '$855.000'],
    '611010730': ['$769.500', '$855.000']
  };
  for (const [sku, finales] of Object.entries(senior4)) {
    const fila = await producto(page, sku);
    await expect(fila).toContainText('10% OFF');
    await expect(fila.locator('.lp-price-choice').nth(0)).toContainText(finales[0]);
    await expect(fila.locator('.lp-price-choice').nth(1)).toContainText(finales[1]);
  }

  const vero = await producto(page, '611030420');
  await expect(vero).not.toContainText('45% OFF');
  await expect(vero.locator('.lp-price-choice').nth(0)).toContainText('Precio de canje · −10%');
  await expect(vero.locator('.lp-price-choice').nth(0)).toContainText('$444.690');
  await expect(vero.locator('.lp-price-choice').nth(1)).toContainText('Precio normal');
  await expect(vero.locator('.lp-price-choice').nth(1)).not.toContainText('−10%');
  await expect(vero.locator('.lp-price-choice').nth(1)).toContainText('$549.000');
});

test('el Plan Canje general alcanza cualquier línea habilitada y no se acumula con Iontrix', async ({ page }) => {
  await abrirListaEn(page, '2026-11-08');

  const conCanje = catalogo.productos.filter(p => Number(p.plan_canje) > 0);
  expect(conCanje.length).toBeGreaterThan(20);

  for (const consulta of ['611010580', '611030430', '611100240', '611120200', '617110040']) {
    const base = catalogo.productos.find(p => p.sku === consulta);
    const fila = await producto(page, consulta);
    const canje = fila.locator('.lp-price-choice').nth(0);
    await expect(canje).toContainText('Precio de canje · −10%');
    await expect(canje).toContainText(money(base.plan_canje));
    await expect(canje).toContainText(money(Math.round(base.plan_canje * 0.9)));
    await expect(fila.locator('.lp-price-choice').nth(1)).not.toContainText('−10%');
  }

  await page.evaluate(() => {
    localStorage.setItem('appi_lista_desc_v1', JSON.stringify({
      '611290050': 40,
      '611290050::canje': 40
    }));
  });
  const iontrix = await producto(page, '611290050');
  await iontrix.locator('.lp-price-choice').nth(0).click();
  await iontrix.locator('.lp-price-choice').nth(1).click();
  await page.locator('#lpFab').click();
  const sheet = page.locator('#lpSheet');
  await expect(sheet.locator('.lp-price-touch.auto-promo')).toHaveCount(2);
  await expect(sheet.locator('[data-toggle-desc]')).toHaveCount(0);
  await expect(sheet.locator('#lpSheetTot')).toContainText('$1.742.775');
});

test('el PDF repite CyberWeek y el plan vigente sin descontar el reintegro', async ({ page }) => {
  await abrirListaEn(page, '2026-11-05');
  const iontrix = await producto(page, '611290050');
  await iontrix.locator('.lp-price-choice').nth(1).click();
  await page.locator('#lpFab').click();

  const sheet = page.locator('#lpSheet');
  await sheet.getByRole('button', { name: 'Credicoop / Cabal', exact: true }).click();
  await sheet.getByRole('button', { name: '18 cuotas', exact: true }).click();
  await expect(sheet.locator('#lpSheetTot')).toContainText('$917.250');
  await expect(sheet.locator('#lpPlanInfo')).toContainText('3, 6, 9, 12 y 18 cuotas sin interés');
  await expect(sheet.locator('#lpPlanInfo')).not.toContainText('reintegro sin tope');

  await page.evaluate(() => {
    window._cyberweekPdf = null;
    window.navigator.canShare = null;
    if (!window.APPIDialog) window.APPIDialog = {};
    window.APPIDialog.prompt = () => Promise.resolve('Cliente CyberWeek');
    const Orig = window.jspdf.jsPDF;
    window.jspdf.jsPDF = function(...args) {
      const pdf = new Orig(...args);
      const originalText = pdf.text.bind(pdf);
      const textos = [];
      pdf.text = function(...textArgs) {
        textos.push(Array.isArray(textArgs[0]) ? textArgs[0].join(' ') : String(textArgs[0] || ''));
        return originalText(...textArgs);
      };
      pdf.save = function(name) { window._cyberweekPdf = { name, textos }; };
      return pdf;
    };
  });
  await sheet.locator('#lpSheetPdf').click();
  await page.waitForFunction(() => !!window._cyberweekPdf, { timeout: 20000 });
  const textos = await page.evaluate(() => window._cyberweekPdf.textos.join('\n'));
  expect(textos).toContain('IONTRIX 3 *CYBERWEEK 25% OFF*');
  expect(textos).toContain('Antes $1.223.000 · −25% · Final $917.250');
  expect(textos).toContain('18 pagos de ');
  expect(textos).toContain('Credicoop / Cabal');
  expect(textos).toContain('Cabal emitida por Banco Credicoop');
  expect(textos).toContain('Exclusivo a través de MODO');
  expect(textos).toContain('Vigencia 5 al 11 de noviembre de 2026');
  expect(textos).toContain('CyberWeek válida del 5 al 8/11/2026');
});

test('desde el 9/11 todos los productos vuelven solos a sus precios base', async ({ page }) => {
  await abrirListaEn(page, '2026-11-09');
  await expect(page.locator('.lp-promo-strip')).toHaveCount(0);

  const iontrix = await producto(page, '611290050');
  await expect(iontrix).not.toContainText('OFF');
  await expect(iontrix.locator('.lp-price-choice').nth(0)).toContainText('$1.100.700');
  await expect(iontrix.locator('.lp-price-choice').nth(0)).not.toContainText('$825.525');
  await expect(iontrix.locator('.lp-price-choice').nth(1)).toContainText('$1.223.000');
  await expect(iontrix.locator('.lp-price-choice').nth(1)).not.toContainText('$917.250');

  const terra = await producto(page, '611010730');
  await expect(terra).not.toContainText('OFF');
  await expect(terra.locator('.lp-price-choice').nth(0)).toContainText('$855.000');
  await expect(terra.locator('.lp-price-choice').nth(1)).toContainText('$950.000');
});
