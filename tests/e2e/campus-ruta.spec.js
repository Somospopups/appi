const { test, expect } = require('@playwright/test');
const { entrar } = require('./helpers/app-entrar.js');

test('la tarjeta de capacitación llena UN hueco del mazo, nunca antes que el negocio', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.APPICampusPSA.cargarContenido());

  const r = await page.evaluate(() => {
    const ctx = window.APPIHomeTarjetas.contextoCapacitacion();
    const tarjetas = window.APPIHomeTarjetas.armarTarjetas();
    const cap = tarjetas.find(t => t.cat === 'capacitacion') || null;
    const prox = window.APPICampusPSA.proximaClase(ctx);
    return {
      cats: tarjetas.map(t => t.cat),
      capCount: tarjetas.filter(t => t.cat === 'capacitacion').length,
      cap,
      esperado: prox && prox.titulo,
      ctx
    };
  });

  // Regla del mazo: la especial sigue primera y la capacitación llena 1 hueco.
  expect(r.cats[0]).toBe('especial');
  expect(r.capCount).toBe(1);
  expect(r.cats.indexOf('capacitacion')).toBeGreaterThan(0);
  expect(r.cap).toBeTruthy();
  expect(r.cap.titulo).toBeTruthy();
  expect(r.cap.html).toContain('de');
  expect(r.cap.cta.label).toContain('Ver clase');

  // La tarjeta propone exactamente la próxima clase de la ruta por contexto.
  expect(r.cap.titulo).toBe(r.esperado);

  // El CTA abre la hoja Clase sin salir del Home.
  await page.evaluate(() => {
    const t = window.APPIHomeTarjetas.armarTarjetas().find(x => x.cat === 'capacitacion');
    t.cta.go();
  });
  await expect(page.locator('#campusPsaOverlay.open')).toBeVisible();
  await expect(page.locator('#cpClassTitle')).toHaveText(r.cap.titulo);
});

test('Mi capacitación en Mi negocio muestra el avance y continúa en la clase', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.APPICampusPSA.cargarContenido());
  await page.evaluate(() => window.showView('view-negocio'));

  await expect(page.locator('#cpNeg')).toBeVisible();
  await expect(page.locator('#cpNeg')).toContainText('Mi capacitación');
  const sub = await page.locator('#cpNegSub').textContent();
  expect(sub).toMatch(/0 de \d+ clases vistas · 0%/);
  await expect(page.locator('#cpNegGo')).toContainText('Continuar clase');
  await expect(page.locator('#cpNegRuta')).toContainText('Ver ruta');

  // Marcar una vista actualiza la sección al instante.
  await page.evaluate(() => {
    const c = window.APPICampusPSA;
    const cl = c.clases().filter(x => x.stream)[0];
    c.marcarVisto(cl.id, 100, 'video');
  });
  await expect(page.locator('#cpNegSub')).toContainText(/1 de \d+ clases vistas · \d+%/);

  // El CTA de la sección abre la próxima clase pendiente.
  await page.locator('#cpNegGo').click();
  await expect(page.locator('#campusPsaOverlay.open')).toBeVisible();
  const tituloSeccion = await page.locator('#cpNegTit').textContent();
  await expect(page.locator('#cpClassTitle')).toHaveText(tituloSeccion);
});

test('sin contenido el mazo no se rompe: la capacitación espera su turno', async ({ page }) => {
  await entrar(page);
  const r = await page.evaluate(() => {
    // Sin contenido en memoria ni respaldo: la tarjeta no puede existir.
    localStorage.removeItem('appi_campus_contenido_v1');
    window.APPICampusPSA.contenido = () => null;
    const cats = window.APPIHomeTarjetas.armarTarjetas().map(t => t.cat);
    return { primero: cats[0], conCap: cats.includes('capacitacion') };
  });
  expect(r.primero).toBe('especial');
  expect(r.conCap).toBe(false);
});
