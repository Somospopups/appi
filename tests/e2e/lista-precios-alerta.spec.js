const { test, expect } = require('@playwright/test');
const { entrar } = require('./helpers/app-entrar.js');

async function abrirLista(page) {
  await page.evaluate(() => window.abrirLista());
  await page.locator('#lpList .lp-item').first().waitFor({ state: 'visible', timeout: 15000 });
}

test('la alerta roja aparece en cada ingreso y actualiza los precios directamente', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await entrar(page);

  let actualizaciones = 0;
  await page.route('https://mock.supabase.co/functions/v1/actualizar-precios', async route => {
    actualizaciones += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        yaActualizado: true,
        actualizado: '3-Nov-2026',
        mensaje: 'La lista ya está al día.'
      })
    });
  });

  await abrirLista(page);
  const alerta = page.locator('#lpPriceAlertOverlay');
  await expect(alerta).toBeVisible();
  await expect(alerta.getByRole('heading')).toHaveText('Verificá el precio antes de cada venta');
  await expect(alerta).toContainText('comprobá siempre el precio vigente');
  await expect(alerta).toContainText('evitar diferencias e inconvenientes con tus clientes');
  await expect(alerta.getByRole('button', { name: 'ACTUALIZAR Y VERIFICAR PRECIOS' })).toBeVisible();

  const colores = await alerta.evaluate(el => {
    const head = el.querySelector('.lp-price-alert-head');
    const button = el.querySelector('.lp-price-alert-primary');
    return {
      cabecera: getComputedStyle(head).backgroundImage,
      boton: getComputedStyle(button).backgroundColor,
      z: Number(getComputedStyle(el).zIndex)
    };
  });
  expect(colores.cabecera).toContain('rgb(189, 70, 59)');
  expect(colores.boton).toBe('rgb(169, 50, 50)');
  expect(colores.z).toBeGreaterThan(30000);

  await alerta.getByRole('button', { name: 'ACTUALIZAR Y VERIFICAR PRECIOS' }).click();
  await expect(alerta).toBeHidden();
  await expect.poll(() => actualizaciones).toBe(1);
  await expect(page.locator('#lpActualizar')).toContainText('Al día');

  // El usuario eligió verla en cada ingreso, no una vez por día o versión.
  await page.evaluate(() => window.showView('view-home'));
  await abrirLista(page);
  await expect(alerta).toBeVisible();
  await alerta.getByRole('button', { name: 'Continuar a la lista' }).click();
  await expect(alerta).toBeHidden();
  expect(actualizaciones).toBe(1);
});

test('la alerta usa el sistema global de animación 4 y sonido de gota', async ({ page }) => {
  await entrar(page);
  await abrirLista(page);
  const alerta = page.locator('#lpPriceAlertOverlay');
  await expect(alerta).toBeVisible();
  await expect(alerta.locator('[role="dialog"]')).toHaveAttribute('aria-modal', 'true');
  await expect(alerta.locator('[role="dialog"]')).toHaveAttribute('aria-labelledby', 'lpPriceAlertTitle');

  const soporte = await page.evaluate(() => {
    const scripts = Array.from(document.scripts).map(s => s.src);
    return {
      popupEffects: scripts.some(src => src.includes('appi-popup-effects.js')),
      overlayId: document.getElementById('lpPriceAlertOverlay').id
    };
  });
  expect(soporte.popupEffects).toBe(true);
  expect(soporte.overlayId).toMatch(/Overlay$/);
});
