const { test, expect } = require('@playwright/test');
const { entrar } = require('./helpers/app-entrar.js');

// v644 · El catálogo del Campus dentro de APPI se arma con las credenciales
// MI PSA de CADA usuario (edge campus-catalogo + caché compartida en la nube).
// Sin cuenta no hay rastreo propio: aparece el aviso para cargarla (en Campus
// y como tarjeta del Home) con el popup de carga existente.

const CAT_MOCK = {
  version: 1,
  generado: new Date().toISOString(),
  stats: { kits: 1, clases: 2, audios: 0, playlists: 0 },
  kits: [{
    slug: 'mock-usuario',
    titulo: 'Kit Mock Usuario',
    secciones: [{
      titulo: 'Sección Mock',
      url: '/tematica/mock',
      clases: [
        { titulo: 'Clase Mock Uno', url: '/tematica/mock/1', stream: 'V_11111', duracion: '05:10' },
        { titulo: 'Clase Mock Dos', url: '/tematica/mock/2', stream: 'V_11112', duracion: '06:20' }
      ]
    }]
  }],
  playlists: [],
  vivo: [{ equipo: 'Equipo Mock', titulo: 'Vivo Mock Usuario', inicio: '30-06 15:00', fin: '30-06 16:00' }]
};

const json = (route, status, body) => route.fulfill({
  status,
  headers: { 'access-control-allow-origin': '*', 'content-type': 'application/json' },
  body: JSON.stringify(body)
});

const catalogoCargado = page => page.waitForFunction(
  () => !!(window.APPICampusPSA && typeof window.APPICampusPSA.catalogo === 'function' && window.APPICampusPSA.catalogo()),
  null, { timeout: 15000 }
);
const estado = page => page.evaluate(() => window.APPICampusPSA.estadoCatalogo());

test('la nube responde con el catálogo de la cuenta MI PSA del usuario (no un JSON fijo)', async ({ page }) => {
  await entrar(page);

  let enviado = null;
  // Se registra DESPUÉS del catch-all del helper: la ruta más nueva gana.
  await page.route('https://mock.supabase.co/functions/v1/campus-catalogo', route => {
    enviado = route.request().postDataJSON();
    return json(route, 200, { cat: CAT_MOCK });
  });

  await catalogoCargado(page);
  // Con respaldo local la app muestra ya y refresca en 2º plano: para pedir
  // de nuevo a la nube se limpia la copia y se reintenta.
  await page.evaluate(() => {
    localStorage.removeItem('appi_campus_catalogo_v1');
    return window.APPICampusPSA.reintentarCatalogo().then(c => !!(c && c.kits), () => false);
  });

  await expect.poll(() => estado(page)).toBe('ok');
  expect(enviado, 'la edge recibe las credenciales MI PSA del usuario').toEqual({
    center: '02', number: '9802014', password: 'clave-de-prueba'
  });

  const resumen = await page.evaluate(() => ({
    kit: window.APPICampusPSA.catalogo().kits[0].titulo,
    clase: window.APPICampusPSA.clases()[0].titulo,
    guardado: (JSON.parse(localStorage.getItem('appi_campus_catalogo_v1') || 'null') || {}).kits?.[0]?.titulo
  }));
  expect(resumen.kit).toBe('Kit Mock Usuario');
  expect(resumen.clase).toBe('Clase Mock Uno');
  expect(resumen.guardado, 'el respaldo local guarda el catálogo de la nube').toBe('Kit Mock Usuario');

  // Con cuenta conectada y nube OK no hay ningún aviso en la vista y lo que
  // se ve viene del catálogo que devolvió la nube.
  await page.evaluate(() => window.openCampusPSA());
  await expect(page.locator('#view-campus')).toHaveClass(/active/);
  await expect(page.locator('#campusCont')).toContainText('Vivo Mock Usuario');
  await expect(page.locator('#view-campus [data-cp-aviso]')).toHaveCount(0);
  await expect(page.locator('.ht-card.ht-cat-campusCuenta')).toHaveCount(0);
});

test('sin cuenta MI PSA: aviso en Campus, tarjeta de aviso en el Home y popup de carga', async ({ page }) => {
  await entrar(page);
  // Sin cuenta, cualquier evento periódico (persona/auth) puede autoabrir el
  // popup de PSA. Se marca como ya visto para ejercer a propósito el clic
  // del aviso: el camino que interesa es aviso → popup → formulario.
  await page.evaluate(() => sessionStorage.setItem('psaPopupYaMostrado', '1'));
  await catalogoCargado(page);

  // El mazo abierto muestra la capacitación (hay catálogo de respaldo).
  await page.evaluate(() => window.APPIHomeTarjetas.abrir());
  await expect(page.locator('#htOverlay')).toBeVisible();
  await expect(page.locator('.ht-card.ht-cat-capacitacion')).toHaveCount(1);

  await page.evaluate(() => {
    localStorage.removeItem('appsi_psa_creds');
    return window.APPICampusPSA.reintentarCatalogo().then(() => true, () => true);
  });
  await expect.poll(() => estado(page)).toBe('sinCuenta');

  // La capacitación se apaga (no hay catálogo propio) y entra la tarjeta de
  // cuenta en su hueco, repintando el mazo abierto.
  await expect(page.locator('.ht-card.ht-cat-capacitacion')).toHaveCount(0);
  await expect(page.locator('.ht-card.ht-cat-campusCuenta')).toHaveCount(1);

  // La vista de Campus muestra el aviso y sigue mostrando el contenido de respaldo.
  await page.evaluate(() => window.openCampusPSA());
  await expect(page.locator('#view-campus')).toHaveClass(/active/);
  await expect(page.locator('[data-cp-aviso="cuenta"]')).toBeVisible();
  await expect(page.locator('[data-cp-aviso="cuenta"]')).toContainText('Cargá tu cuenta MI PSA');
  await expect(page.locator('#campusCont')).toContainText('Próximos en vivo');

  // El aviso abre el popup existente de carga de cuenta MI PSA.
  await page.locator('[data-cp-cuenta]').click();
  await expect(page.locator('#modalOverlay')).toContainText('APPI lo hace por vos');
  await page.locator('#modalConfirmBtn').click();
  await expect(page.locator('#psaPopupCentro')).toBeVisible();
  await expect(page.locator('#psaPopupNumero')).toBeVisible();
});

test('si la nube falla con cuenta cargada: aviso de error, reintento y no se pierde el respaldo', async ({ page }) => {
  await entrar(page);
  // Primera carga normal: guarda la copia en el dispositivo.
  await catalogoCargado(page);
  await expect.poll(() => estado(page)).toBe('ok');

  // La nube se cae: el campus usa la última copia guardada y avisa.
  await page.route('https://mock.supabase.co/functions/v1/campus-catalogo', route => json(route, 500, { error: 'nube caída' }));
  await page.evaluate(() => window.APPICampusPSA.reintentarCatalogo().then(c => !!(c && c.kits), () => false));
  await expect.poll(() => estado(page)).toBe('error');

  await page.evaluate(() => window.openCampusPSA());
  await expect(page.locator('[data-cp-aviso="error"]')).toBeVisible();
  await expect(page.locator('[data-cp-aviso="error"]')).toContainText('No pudimos actualizar el catálogo');
  await expect(page.locator('#campusCont')).toContainText('Próximos en vivo');

  // Reintentar vuelve a consultar la nube y, si sigue caída, no se pierde
  // el contenido: el aviso queda con el error.
  await page.locator('[data-cp-reintentar]').click();
  await expect.poll(() => estado(page)).toBe('error');
  await expect(page.locator('[data-cp-aviso="error"]')).toBeVisible();
  await expect(page.locator('#campusCont')).toContainText('Próximos en vivo');

  // Sin respaldo local no hay de dónde recatar: v647 retiró el JSON del repo.
  await page.evaluate(() => {
    localStorage.removeItem('appi_campus_catalogo_v1');
    return window.APPICampusPSA.reintentarCatalogo().then(() => true, () => true);
  });
  await expect.poll(() => estado(page)).toBe('error');
  await page.evaluate(() => window.openCampusPSA());
  await expect(page.locator('[data-cp-aviso="error"]')).toBeVisible();
  await expect(page.locator('[data-cp-aviso="error"]')).toContainText('todavía no hay una copia guardada');
  await expect(page.locator('#campusCont')).not.toContainText('Próximos en vivo');
});
