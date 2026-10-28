const { test, expect } = require('@playwright/test');
const { entrar } = require('./helpers/app-entrar.js');

// v870 · La carga del Home puede comprobar MI PSA en segundo plano, pero un
// fallo general de red o de PSA no debe interrumpir la entrada. Sólo cuando la
// respuesta identifica credenciales inválidas se abre el formulario directo
// para corregir Sucursal, Distribuidor y Contraseña.

const json = (route, status, body) => route.fulfill({
  status,
  headers: { 'access-control-allow-origin': '*', 'content-type': 'application/json' },
  body: JSON.stringify(body)
});

const contenidoCargado = page => page.waitForFunction(
  () => !!(window.APPICampusPSA && typeof window.APPICampusPSA.contenido === 'function' && window.APPICampusPSA.contenido()),
  null, { timeout: 15000 }
);

const modalPSA = page => page.locator('#modalOverlay.open');
const dialogoGenerico = page => page.locator('.appi-dialog-overlay:not([hidden])');

async function fallarCampus(page, status, body) {
  await page.route('https://mock.supabase.co/functions/v1/campus-contenido', route => json(route, status, body));
  await page.evaluate(() => {
    sessionStorage.removeItem('psaCredsErrorMostrado');
    return window.APPICampusPSA.reintentarContenido().then(() => true, () => true);
  });
}

test('un fallo general de PSA usa la copia guardada y no abre un popup al entrar', async ({ page }) => {
  await entrar(page);
  await contenidoCargado(page);
  await expect.poll(() => page.evaluate(() => window.APPICampusPSA.estadoContenido())).toBe('ok');
  await page.evaluate(() => {
    const copia = JSON.parse(localStorage.getItem('appi_campus_contenido_v1') || '{}');
    copia.generado = new Date().toISOString();
    localStorage.setItem('appi_campus_contenido_v1', JSON.stringify(copia));
  });

  await fallarCampus(page, 503, { error: 'PSA temporalmente fuera de servicio' });
  await expect.poll(() => page.evaluate(() => window.APPICampusPSA.estadoContenido())).toBe('error');

  await expect(dialogoGenerico(page), 'no aparece el aviso genérico que bloqueaba el inicio').toHaveCount(0);
  await expect(modalPSA(page), 'una caída de red no se confunde con una clave incorrecta').toHaveCount(0);
  await expect(page.evaluate(() => !!window.APPICampusPSA.contenido())).resolves.toBe(true);
});

test('credenciales inválidas abren el formulario directo con los datos actuales', async ({ page }) => {
  await entrar(page);
  await contenidoCargado(page);

  await fallarCampus(page, 401, {
    code: 'psa_credentials',
    error: 'No se pudo entrar a mi.psa.com.ar con esos datos (¿clave correcta?).'
  });

  await expect(modalPSA(page)).toBeVisible();
  await expect(page.locator('#modalTitle')).toHaveText('Verificá tus datos de MI PSA');
  await expect(page.locator('#modalSub')).toHaveText('No pudimos validar la cuenta');
  await expect(page.locator('#psaPopupCentro')).toHaveValue('02');
  await expect(page.locator('#psaPopupNumero')).toHaveValue('9802014');
  await expect(page.locator('#psaPopupClave')).not.toHaveValue('');
  await expect(page.locator('#modalConfirmBtn')).toHaveText('Guardar y volver a probar');
  await expect(dialogoGenerico(page)).toHaveCount(0);

  await page.locator('#modalCancelBtn').click();
  await expect(modalPSA(page)).toHaveCount(0);
});

test('la sincronización principal también abre el formulario si MI PSA rechaza la cuenta', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => sessionStorage.removeItem('psaCredsErrorMostrado'));
  await page.route('https://mock.supabase.co/functions/v1/consulta-serial', route => json(route, 401, {
    code: 'psa_credentials',
    error: 'No se pudo entrar a mi.psa.com.ar con esos datos (¿clave correcta?).'
  }));

  await page.evaluate(() => window.sincronizarTodoPSA());
  await expect(modalPSA(page)).toBeVisible();
  await expect(page.locator('#modalTitle')).toHaveText('Verificá tus datos de MI PSA');
  await expect(page.locator('#psaPopupCentro')).toHaveValue('02');
  await expect(page.locator('#psaPopupNumero')).toHaveValue('9802014');
  await page.locator('#modalCancelBtn').click();
});

test('el aviso de credenciales no insiste más de una vez en la misma sesión', async ({ page }) => {
  await entrar(page);
  await contenidoCargado(page);

  await fallarCampus(page, 401, { code: 'psa_credentials', error: 'Credenciales de MI PSA inválidas.' });
  await expect(modalPSA(page)).toBeVisible();
  await page.locator('#modalCancelBtn').click();
  await expect(modalPSA(page)).toHaveCount(0);

  await page.evaluate(() => window.APPICampusPSA.reintentarContenido().then(() => true, () => true));
  await page.waitForTimeout(500);
  await expect(modalPSA(page), 'no vuelve a interrumpir durante la sesión').toHaveCount(0);
});

test('sin cuenta MI PSA no hay popup de error: el Home ofrece cargarla por separado', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => {
    sessionStorage.removeItem('psaCredsErrorMostrado');
    localStorage.removeItem('appsi_psa_creds');
    localStorage.removeItem('appi_campus_contenido_v1');
  });
  await page.evaluate(() => window.APPICampusPSA.reintentarContenido().then(() => true, () => true));
  await expect(page.evaluate(() => window.APPICampusPSA.estadoContenido())).resolves.toBe('sinCuenta');
  await expect(modalPSA(page)).toHaveCount(0);
  await expect(dialogoGenerico(page)).toHaveCount(0);
});
