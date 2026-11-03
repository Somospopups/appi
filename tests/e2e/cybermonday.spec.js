const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { entrar, continuarLista } = require('./helpers/app-entrar.js');
const beneficios = require('../../psa-beneficios.json');

const ROOT = path.join(__dirname, '..', '..');

async function abrirListaEn(page, fecha) {
  await page.addInitScript(dia => { window.__APPI_FECHA_PROMO__ = dia; }, fecha);
  await entrar(page);
  await page.evaluate(() => window.abrirLista());
  await page.locator('#lpList .lp-item').first().waitFor({ state: 'visible', timeout: 15000 });
  await continuarLista(page);
}

async function producto(page, sku) {
  await page.locator('#lpSearch').fill(sku);
  const fila = page.locator('#lpList .lp-item').filter({ hasText: sku });
  await expect(fila).toHaveCount(1);
  return fila;
}

test('la campaña oficial declara vigencia, porcentajes, Normal y Canje sin acumulación', async () => {
  const campana = beneficios.campanas.find(x => x.id === 'cyber-monday-2026');
  expect(campana).toMatchObject({
    nombre: 'CyberMonday',
    desde: '2026-11-02',
    hasta: '2026-11-04',
    aplica: ['normal', 'canje'],
    no_acumulable: true
  });
  expect(Object.fromEntries(campana.productos.map(x => [x.familia, x.porcentaje]))).toEqual({
    'PSA Vero': 45,
    'PSA Iontrix 3': 25,
    'PSA Senior4': 10
  });
  expect(campana.productos.find(x => x.familia === 'PSA Senior4').skus).toEqual([
    '611010510', '611010530', '611010550', '611010560', '611010730'
  ]);

  const app = fs.readFileSync(path.join(ROOT, 'lista-precios.js'), 'utf8');
  const updater = fs.readFileSync(path.join(ROOT, 'scripts', 'actualizar-precios-psa.py'), 'utf8');
  expect(app).toContain('hoy < c.desde || hoy > c.hasta');
  expect(app).toContain('var pctDesc = beneficio ? 0 : getDesc(sku)');
  expect(updater).toContain('"precio": int(round(float(rg or pr or 0)))');
  expect(updater).toContain('validar_cyber_2026(productos)');
});

test('del 2 al 4/11 muestra y cobra los importes CyberMonday en Normal y Canje', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await abrirListaEn(page, '2026-11-03');

  const vero = await producto(page, '611030420');
  await expect(page.locator('.lp-promo-strip')).toContainText('CyberMonday · 2 al 4/11');
  await expect(page.locator('.lp-promo-strip')).toContainText('Precio normal y Plan Canje');
  await expect(vero).toContainText('CYBER · 45% OFF');
  const veroOps = vero.locator('.lp-price-choice');
  await expect(veroOps.nth(0)).toContainText('Precio de canje · −45%');
  await expect(veroOps.nth(0)).toContainText('$494.100');
  await expect(veroOps.nth(0)).toContainText('$271.755');
  await expect(veroOps.nth(1)).toContainText('Precio normal · −45%');
  await expect(veroOps.nth(1)).toContainText('$549.000');
  await expect(veroOps.nth(1)).toContainText('$301.950');

  await page.evaluate(() => {
    localStorage.setItem('appi_lista_desc_v1', JSON.stringify({
      '611030420': 20,
      '611030420::canje': 20
    }));
  });
  await veroOps.nth(0).click();
  await veroOps.nth(1).click();
  await expect(page.locator('#lpFab')).toContainText('$573.705');
  await page.locator('#lpFab').click();
  const sheet = page.locator('#lpSheet');
  await expect(sheet).toHaveClass(/open/);
  await expect(sheet.locator('.lp-line-block')).toHaveCount(2);
  await expect(sheet.locator('.lp-price-touch.auto-promo')).toHaveCount(2);
  await expect(sheet.locator('.lp-price-touch.auto-promo').nth(0)).toContainText('CyberMonday · −45%');
  await expect(sheet.locator('[data-toggle-desc]')).toHaveCount(0);
  await expect(sheet.locator('#lpSheetTot')).toContainText('$573.705');
});

test('aplica los importes exactos de Iontrix 3 y todas las variantes Senior4', async ({ page }) => {
  await abrirListaEn(page, '2026-11-04');

  const iontrix = await producto(page, '611290050');
  await expect(iontrix).toContainText('25% OFF');
  await expect(iontrix.locator('.lp-price-choice').nth(0)).toContainText('$1.100.700');
  await expect(iontrix.locator('.lp-price-choice').nth(0)).toContainText('$825.525');
  await expect(iontrix.locator('.lp-price-choice').nth(1)).toContainText('$1.223.000');
  await expect(iontrix.locator('.lp-price-choice').nth(1)).toContainText('$917.250');

  const esperados = {
    '611010510': ['$855.000', '$769.500', '$950.000', '$855.000'],
    '611010530': ['$855.000', '$769.500', '$950.000', '$855.000'],
    '611010550': ['$756.000', '$680.400', '$840.000', '$756.000'],
    '611010560': ['$855.000', '$769.500', '$950.000', '$855.000'],
    '611010730': ['$855.000', '$769.500', '$950.000', '$855.000']
  };
  for (const [sku, importes] of Object.entries(esperados)) {
    const fila = await producto(page, sku);
    await expect(fila).toContainText('10% OFF');
    const ops = fila.locator('.lp-price-choice');
    await expect(ops.nth(0)).toContainText(importes[0]);
    await expect(ops.nth(0)).toContainText(importes[1]);
    await expect(ops.nth(1)).toContainText(importes[2]);
    await expect(ops.nth(1)).toContainText(importes[3]);
  }
});

test('el PDF informa precio anterior, porcentaje y final de CyberMonday', async ({ page }) => {
  await abrirListaEn(page, '2026-11-03');
  const vero = await producto(page, '611030420');
  await vero.locator('.lp-price-choice').nth(1).click();
  await page.locator('#lpFab').click();

  await page.evaluate(() => {
    window._cyberPdf = null;
    window.navigator.canShare = null;
    if (!window.APPIDialog) window.APPIDialog = {};
    window.APPIDialog.prompt = () => Promise.resolve('Cliente Cyber');
    const Orig = window.jspdf.jsPDF;
    window.jspdf.jsPDF = function(...args) {
      const pdf = new Orig(...args);
      const originalText = pdf.text.bind(pdf);
      const textos = [];
      pdf.text = function(...textArgs) {
        textos.push(Array.isArray(textArgs[0]) ? textArgs[0].join(' ') : String(textArgs[0] || ''));
        return originalText(...textArgs);
      };
      pdf.save = function(name) { window._cyberPdf = { name, textos }; };
      return pdf;
    };
  });
  await page.locator('#lpSheetPdf').click();
  await page.waitForFunction(() => !!window._cyberPdf, { timeout: 20000 });
  const textos = await page.evaluate(() => window._cyberPdf.textos.join('\n'));
  expect(textos).toContain('VERO BIANCO + KIT POSV. *CYBERMONDAY 45% OFF*');
  expect(textos).toContain('Antes $549.000 · −45% · Final $301.950');
  expect(textos).toContain('no acumulable con otras promociones de producto');
});

test('fuera de la vigencia deja de aplicar la promoción y conserva los precios base', async ({ page }) => {
  await abrirListaEn(page, '2026-11-05');
  const vero = await producto(page, '611030420');
  await expect(vero).not.toContainText('CyberMonday');
  await expect(vero.locator('.lp-price-choice').nth(0)).toContainText('$494.100');
  await expect(vero.locator('.lp-price-choice').nth(0)).not.toContainText('$271.755');
  await expect(vero.locator('.lp-price-choice').nth(1)).toContainText('$549.000');
  await expect(vero.locator('.lp-price-choice').nth(1)).not.toContainText('$301.950');
});
