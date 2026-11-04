const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { entrar, continuarLista } = require('./helpers/app-entrar.js');
const beneficios = require('../../psa-beneficios.json');
const catalogo = require('../../psa-catalogo.json');

const ROOT = path.join(__dirname, '..', '..');

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

test('la campaña oficial declara vigencia desde el 1/11 y distingue Normal de Canje', async () => {
  const campana = beneficios.campanas.find(x => x.id === 'cyber-monday-2026');
  expect(campana).toMatchObject({
    nombre: 'CyberMonday',
    desde: '2026-11-01',
    hasta: '2026-11-04',
    aplica: ['normal', 'canje'],
    no_acumulable: true
  });
  expect(Object.fromEntries(campana.productos.map(x => [x.familia, x.porcentaje]))).toEqual({
    'PSA Vero': 45,
    'PSA Iontrix 3': 25,
    'PSA Senior4': 10,
    'Productos seleccionados': 10
  });
  expect(campana.productos.find(x => x.familia === 'PSA Senior4')).toMatchObject({
    aplica: ['normal', 'canje'],
    skus: ['611010510', '611010530', '611010550', '611010560']
  });
  const soloCanje = campana.productos.find(x => x.familia === 'Productos seleccionados');
  expect(soloCanje.aplica).toEqual(['canje']);
  expect(soloCanje.skus).toHaveLength(22);
  expect(soloCanje.nombres).toEqual([
    'PSA OSMOSIS ROTECH BM UV', 'PSA OSMOSIS ROTECH SM UV', 'PSA AIRPURIFIER 220V'
  ]);

  const app = fs.readFileSync(path.join(ROOT, 'lista-precios.js'), 'utf8');
  const updater = fs.readFileSync(path.join(ROOT, 'scripts', 'actualizar-precios-psa.py'), 'utf8');
  expect(app).toContain("beneficioProducto(p, 'normal')");
  expect(app).toContain("beneficioProducto(p, 'canje')");
  expect(app).toContain('hoy < c.desde || hoy > c.hasta');
  expect(app).toContain('var pctDesc = beneficio ? 0 : getDesc(sku)');
  expect(updater).toContain('"normal" not in modalidades');
  expect(updater).toContain('validar_cyber_2026(productos)');
});

test('desde el 1/11 muestra y cobra Vero en Normal y Canje con 45% OFF', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await abrirListaEn(page, '2026-11-01');

  const vero = await producto(page, '611030420');
  await expect(page.locator('.lp-promo-strip')).toContainText('CyberMonday · 1 al 4/11');
  await expect(page.locator('.lp-promo-strip')).toContainText('Plan Canje: Productos seleccionados 10%');
  await expect(page.locator('.lp-promo-strip')).toContainText('modalidad indicada');
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
  await expect(sheet.locator('[data-toggle-desc]')).toHaveCount(0);
  await expect(sheet.locator('#lpSheetTot')).toContainText('$573.705');
});

test('aplica Iontrix y las cuatro variantes Senior4 del PDF, pero no inventa Terra', async ({ page }) => {
  await abrirListaEn(page, '2026-11-04');

  const iontrix = await producto(page, '611290050');
  await expect(iontrix).toContainText('25% OFF');
  await expect(iontrix.locator('.lp-price-choice').nth(0)).toContainText('$825.525');
  await expect(iontrix.locator('.lp-price-choice').nth(1)).toContainText('$917.250');

  const esperados = {
    '611010510': ['$769.500', '$855.000'],
    '611010530': ['$769.500', '$855.000'],
    '611010550': ['$680.400', '$756.000'],
    '611010560': ['$769.500', '$855.000']
  };
  for (const [sku, importes] of Object.entries(esperados)) {
    const fila = await producto(page, sku);
    await expect(fila).toContainText('10% OFF');
    const ops = fila.locator('.lp-price-choice');
    await expect(ops.nth(0)).toContainText(importes[0]);
    await expect(ops.nth(1)).toContainText(importes[1]);
  }

  const terra = await producto(page, '611010730');
  await expect(terra).not.toContainText('OFF');
  await expect(terra.locator('.lp-price-choice').nth(0)).toContainText('$855.000');
  await expect(terra.locator('.lp-price-choice').nth(1)).toContainText('$950.000');
});

test('los 25 importes promocionales exclusivos de Plan Canje coinciden con el PDF', async ({ page }) => {
  await abrirListaEn(page, '2026-11-04');
  const casos = [
    ['611010580', 702900, 632610, 781000],
    ['611030430', 194400, 174960, 216000],
    ['613030480', 1520000, 1368000, 1600000],
    ['613030470', 1520000, 1368000, 1600000],
    ['611030410', 384300, 345870, 427000],
    ['611030400', 384300, 345870, 427000],
    ['611030610', 1189800, 1070820, 1322000],
    ['611030620', 1189800, 1070820, 1322000],
    ['611100240', 266400, 239760, 296000],
    ['611100250', 266400, 239760, 296000],
    ['611100280', 266400, 239760, 296000],
    ['611100290', 266400, 239760, 296000],
    ['611100320', 266400, 239760, 296000],
    ['611100330', 266400, 239760, 296000],
    ['611120220', 990000, 891000, 1100000],
    ['611120200', 990000, 891000, 1100000],
    ['611120210', 990000, 891000, 1100000],
    ['611030560', 1168200, 1051380, 1298000],
    ['611030540', 1168200, 1051380, 1298000],
    ['617110040', 399600, 359640, 444000],
    ['617110050', 399600, 359640, 444000],
    ['611310070', 1777500, 1599750, 1975000],
    ['PSA OSMOSIS ROTECH BM UV', 2250000, 2025000, 2500000],
    ['PSA OSMOSIS ROTECH SM UV', 2250000, 2025000, 2500000],
    ['PSA AIRPURIFIER 220V', 1439100, 1295190, 1599000]
  ];
  for (const [consulta, canjeBase, canjeFinal, normal] of casos) {
    const fila = await producto(page, consulta);
    await expect(fila).toContainText('CYBER · CANJE 10% OFF');
    const ops = fila.locator('.lp-price-choice');
    await expect(ops.nth(0)).toContainText('Precio de canje · −10%');
    await expect(ops.nth(0)).toContainText(money(canjeBase));
    await expect(ops.nth(0)).toContainText(money(canjeFinal));
    await expect(ops.nth(1)).toContainText('Precio normal');
    await expect(ops.nth(1)).not.toContainText('−10%');
    await expect(ops.nth(1)).toContainText(money(normal));
  }
});

test('muestra los productos que el PDF oficial trae y antes faltaban u ocultaba', async ({ page }) => {
  await abrirListaEn(page, '2026-11-05');
  const esperados = [
    ['611030560', 1298000],
    ['611030540', 1298000],
    ['617110040', 444000],
    ['617110050', 444000],
    ['PROMO CILINDRO + PACK RENDIMIENTO II', 116000],
    ['PSA UV LED', 285000],
    ['REPUESTO N°1 SEDIMENTOS PSA ROTECH UV', 101100],
    ['REPUESTO N°2 CARBON BLOQUE PSA ROTECH UV', 56800],
    ['REPUESTO N°3 MEMBRANA PSA ROTECH UV', 164300],
    ['REPUESTO N°4 POST. MEMBRANA PSA ROTECH UV', 57800],
    ['INSTALACION ROTECH', 175500]
  ];
  for (const [consulta, precio] of esperados) {
    const fila = await producto(page, consulta);
    await expect(fila).toContainText(money(precio));
  }
  const promoS4 = catalogo.productos.find(p => p.sku === '630139850');
  expect(promoS4.lista_oficial).not.toBe(true);
});

test('el PDF de presupuesto informa modalidad, porcentaje y final de CyberMonday', async ({ page }) => {
  await abrirListaEn(page, '2026-11-03');
  const senior = await producto(page, '611010580');
  await senior.locator('.lp-price-choice').nth(0).click();
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
  expect(textos).toContain('SENIOR BIANCO + KIT POSV. (PLAN CANJE) *CYBERMONDAY 10% OFF*');
  expect(textos).toContain('Antes $702.900 · −10% · Final $632.610');
  expect(textos).toContain('modalidad indicada');
});

test('fuera de la vigencia deja de aplicar la promoción y conserva los precios base', async ({ page }) => {
  await abrirListaEn(page, '2026-11-05');
  const vero = await producto(page, '611030420');
  await expect(vero).not.toContainText('CyberMonday');
  await expect(vero.locator('.lp-price-choice').nth(0)).toContainText('$494.100');
  await expect(vero.locator('.lp-price-choice').nth(0)).not.toContainText('$271.755');
  await expect(vero.locator('.lp-price-choice').nth(1)).toContainText('$549.000');
  await expect(vero.locator('.lp-price-choice').nth(1)).not.toContainText('$301.950');

  const senior = await producto(page, '611010580');
  await expect(senior).not.toContainText('OFF');
  await expect(senior.locator('.lp-price-choice').nth(0)).toContainText('$702.900');
  await expect(senior.locator('.lp-price-choice').nth(0)).not.toContainText('$632.610');
});
