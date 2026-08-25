const { test, expect } = require('@playwright/test');

/* Nombre lindo del equipo (v339): la planilla trae códigos cortos (SEN4BLAC,
   SEN4) y la app los muestra con su nombre completo. */

test.beforeEach(async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
});

const casos = [
  ['SEN4BLAC',       'Senior 4 Black'],
  ['sen4blac',       'Senior 4 Black'],
  ['SEN4BLACK',      'Senior 4 Black'],
  ['SENIOR4BLAC',    'Senior 4 Black'],
  ['SEN4',           'Senior 4'],
  ['SENIOR4',        'Senior 4'],
  ['SENIOR 4',       'Senior 4'],
  ['PSA SENIOR 4',   'Senior 4'],
  ['PSA VERO',       'Vero'],
  ['VERO',           'Vero'],
  ['SODA BURBY',     'Soda Burby'],
  ['BURBY',          'Soda Burby'],
  ['PSA',            'PSA'],
  ['',               ''],
  [null,             ''],
];

for (const [entrada, esperado] of casos) {
  test(`nombreProducto(${JSON.stringify(entrada)}) → ${JSON.stringify(esperado)}`, async ({ page }) => {
    const r = await page.evaluate(v => window.nombreProducto(v), entrada);
    expect(r).toBe(esperado);
  });
}

test('un código desconocido se escribe como título', async ({ page }) => {
  const r = await page.evaluate(() => window.nombreProducto('psa otro modelo'));
  expect(r).toBe('Otro Modelo');
});
