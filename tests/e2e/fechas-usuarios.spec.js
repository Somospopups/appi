const { test, expect } = require('@playwright/test');

/* Fechas de compra/vencimiento en Usuarios (v335). Antes las fechas
   imposibles se "acomodaban" solas (mes 13 -> enero del año siguiente,
   31/02 -> marzo) y las fechas reales de Excel (número de serie) se
   mostraban como números tipo "44663". */

test.beforeEach(async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
});

test('las fechas imposibles se rechazan en vez de acomodarse solas', async ({ page }) => {
  const r = await page.evaluate(() => [
    window.parseFechaU('17/13/2022'),   // mes 13 → null
    window.parseFechaU('32/01/2022'),   // día 32 → null
    window.parseFechaU('31/02/2022'),   // febrero no tiene 31 → null
    window.parseFechaU('4/17/2022'),    // mes 17 (día/mes invertidos) → null
    window.parseFechaU('17/4/2002'),    // válida
    window.parseFechaU('17/04/2022'),   // válida
    window.parseFechaU('17/04/22'),     // año corto → 2022
  ].map(d => (d && !isNaN(d) ? d.toISOString().slice(0, 10) : null)));
  expect(r).toEqual([null, null, null, null, '2002-04-17', '2022-04-17', '2022-04-17']);
});

test('una fecha real de Excel (número de serie) se convierte a DD/MM/YYYY', async ({ page }) => {
  // El serial de Excel para el 17/04/2022 es 44668.
  const r = await page.evaluate(() => window.fechaDeCeldaU(44668));
  expect(r).toBe('17/04/2022');
});

test('una celda de fecha en texto queda igual', async ({ page }) => {
  const r = await page.evaluate(() => window.fechaDeCeldaU('17/4/2002'));
  expect(r).toBe('17/4/2002');
});
