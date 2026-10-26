const { test, expect } = require('@playwright/test');
const { entrar } = require('./helpers/app-entrar.js');

// v854 · Cuando PSA no responde, el usuario tenía que adivinar que lo que veía
// estaba viejo. Ahora aparece un pop-up que lo dice con la fecha de la copia
// guardada y las causas más probables. Se muestra una sola vez por día.
// El helper de la suite deja el aviso apagado (appi_aviso_psa_off) así los
// tests viejos siguen igual; acá se enciende a propósito.

const CAT_MOCK = {
  version: 1,
  generado: new Date().toISOString(),
  stats: { kits: 1, clases: 2, audios: 0, playlists: 0 },
  kits: [{
    slug: 'mock-aviso',
    titulo: 'Kit Mock Aviso',
    secciones: [{
      titulo: 'Sección Mock',
      url: '/tematica/mock',
      clases: [{ titulo: 'Clase Mock', url: '/tematica/mock/1', stream: 'V_99999', duracion: '05:00' }]
    }]
  }],
  playlists: [],
  vivo: []
};

const json = (route, status, body) => route.fulfill({
  status,
  headers: { 'access-control-allow-origin': '*', 'content-type': 'application/json' },
  body: JSON.stringify(body)
});

const contenidoCargado = page => page.waitForFunction(
  () => !!(window.APPICampusPSA && typeof window.APPICampusPSA.contenido === 'function' && window.APPICampusPSA.contenido()),
  null, { timeout: 15000 }
);

const encenderAviso = page => page.evaluate(() => {
  localStorage.setItem('appi_aviso_psa_off', '0');
  localStorage.removeItem('appi_campus_aviso_fallo');
});

const popup = page => page.locator('.appi-dialog-overlay:not([hidden])');

test('si la nube falla aparece el pop-up explicando que los datos no se actualizaron', async ({ page }) => {
  await entrar(page);
  await page.route('https://mock.supabase.co/functions/v1/campus-contenido', route => json(route, 200, { cont: CAT_MOCK }));
  await contenidoCargado(page);
  await expect.poll(() => page.evaluate(() => window.APPICampusPSA.estadoContenido())).toBe('ok');

  await encenderAviso(page);
  await page.route('https://mock.supabase.co/functions/v1/campus-contenido', route => json(route, 500, { error: 'nube caída' }));
  await page.evaluate(() => window.APPICampusPSA.reintentarContenido().then(() => true, () => true));

  await expect(popup(page), 'se abre el pop-up de datos sin actualizar').toBeVisible();
  await expect(page.locator('#appiDialogTitle')).toHaveText('No se pudieron actualizar los datos de PSA');
  await expect(page.locator('#appiDialogMessage')).toContainText('copia guardada del');
  await expect(page.locator('#appiDialogMessage')).toContainText('PSA esté caído');
  await expect(page.locator('#appiDialogMessage')).toContainText('Ajustes → MI PSA');

  await page.locator('#appiDialogOk').click();
  await expect(popup(page), 'se cierra al aceptar').toHaveCount(0);
});

test('una vez cerrado no vuelve a aparecer el mismo día', async ({ page }) => {
  await entrar(page);
  await page.route('https://mock.supabase.co/functions/v1/campus-contenido', route => json(route, 200, { cont: CAT_MOCK }));
  await contenidoCargado(page);
  await encenderAviso(page);

  await page.route('https://mock.supabase.co/functions/v1/campus-contenido', route => json(route, 500, { error: 'nube caída' }));
  await page.evaluate(() => window.APPICampusPSA.reintentarContenido().then(() => true, () => true));
  await expect(popup(page)).toBeVisible();
  await page.locator('#appiDialogOk').click();

  // Segundo intento fallido en el mismo día: ya se avisó, no se insiste.
  await page.evaluate(() => window.APPICampusPSA.reintentarContenido().then(() => true, () => true));
  await page.waitForTimeout(400);
  await expect(popup(page), 'no se repite el aviso el mismo día').toHaveCount(0);
});

test('sin cuenta MI PSA no hay pop-up de datos viejos (es otro estado)', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => {
    localStorage.setItem('appi_aviso_psa_off', '0');
    localStorage.removeItem('appi_campus_aviso_fallo');
    localStorage.removeItem('appsi_psa_creds');
  });
  await page.route('https://mock.supabase.co/functions/v1/campus-contenido', route => json(route, 500, { error: 'nube caída' }));
  await page.evaluate(() => window.APPICampusPSA.reintentarContenido().then(() => true, () => true));
  await expect(page.evaluate(() => window.APPICampusPSA.estadoContenido())).resolves.toBe('sinCuenta');
  await expect(popup(page), 'sin credenciales no hay aviso de datos desactualizados').toHaveCount(0);
});
