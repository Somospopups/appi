const { test, expect } = require('@playwright/test');
const { entrar } = require('./helpers/app-entrar.js');

// v854 · La lista se armaba con el psa-catalogo.json del repo (que es el que
// refresca el workflow de precios dos veces por día) y después se PISABA con el
// del bucket catalogo-psa de Supabase, sin mirar fechas. Como ese bucket sólo
// lo toca el botón "🔄 Actualizar precios", todo el mundo terminaba viendo la
// lista vieja aunque la fresca ya estaba publicada.
// Ahora el Storage sólo manda si su `actualizado` es más nuevo.

const catalogoRepo = require('../../psa-catalogo.json');
const planesRepo = require('../../psa-planes.json');

const PRECIO_REPO = 1111111;
const PRECIO_STORAGE = 2222222;

const esGeneral = p => p.grupo !== 'packs' && p.grupo !== 'ingreso';

const clon = (base, actualizado, precio) => {
  const c = JSON.parse(JSON.stringify(base));
  c.actualizado = actualizado;
  if (precio !== undefined) {
    // El precio lo pisamos sobre un producto que se ve en "Todos": el
    // productos[0] del catálogo es un ingreso, que ahora está oculto.
    const p = c.productos.find(esGeneral) || c.productos[0];
    if (p) {
      p.precio = precio;
      p.lista = precio;
    }
  }
  return c;
};

// Las claves que la app les pone a las fichas (idéntico a `claveSku`).
const clavesDe = grupos => catalogoRepo.productos
  .filter(p => grupos.includes(p.grupo))
  .map(p => p.sku || ('n:' + String(p.nombre || '').toLowerCase().trim()));

const json = (route, body) => route.fulfill({
  status: 200,
  headers: { 'access-control-allow-origin': '*', 'content-type': 'application/json' },
  body: JSON.stringify(body)
});

const servirListas = async (page, repoActualizado, storageActualizado) => {
  await page.route('**/psa-catalogo.json*', route => json(route, clon(catalogoRepo, repoActualizado, PRECIO_REPO)));
  await page.route('**/psa-planes.json*', route => json(route, clon(planesRepo, repoActualizado)));
  await page.route('**/storage/v1/object/public/catalogo-psa/psa-catalogo.json*',
    route => json(route, clon(catalogoRepo, storageActualizado, PRECIO_STORAGE)));
  await page.route('**/storage/v1/object/public/catalogo-psa/psa-planes.json*',
    route => json(route, clon(planesRepo, storageActualizado)));
};

test('si el Storage tiene la lista más vieja no pisa los precios del repo', async ({ page }) => {
  await entrar(page);
  // Caso real de octubre: repo 25-Oct, Storage 15-Oct.
  await servirListas(page, '25-Oct-2026', '15-Oct-2026');

  await page.evaluate(() => window.abrirLista());

  await expect(page.locator('#lpCont'), 'se ve el precio fresco del repo').toContainText('$1.111.111');
  await expect(page.locator('#lpCont'), 'el precio viejo del Storage no aparece').not.toContainText('$2.222.222');
});

test('si el Storage tiene la lista más nueva sí se aplica encima', async ({ page }) => {
  await entrar(page);
  // El camino que el comentario del código prometía desde el principio.
  await servirListas(page, '15-Oct-2026', '25-Oct-2026');

  await page.evaluate(() => window.abrirLista());

  await expect(page.locator('#lpCont'), 'la lista más nueva del Storage manda').toContainText('$2.222.222');
  await expect(page.locator('#lpCont')).not.toContainText('$1.111.111');
});

test('una fuente sin fecha no pisa a una que sí la tiene', async ({ page }) => {
  await entrar(page);
  await servirListas(page, '25-Oct-2026', '');

  await page.evaluate(() => window.abrirLista());

  await expect(page.locator('#lpCont'), 'sin fecha no hay de qué saber si es más nueva').toContainText('$1.111.111');
  await expect(page.locator('#lpCont')).not.toContainText('$2.222.222');
});

test('ya no existe el apartado Novedades ni la etiqueta NUEVO', async ({ page }) => {
  await entrar(page);

  // El catálogo trae un producto marcado como novedad: ni la pestaña del
  // filtro ni la etiqueta de la ficha tienen que aparecer.
  const conNovedad = clon(catalogoRepo, '25-Oct-2026');
  conNovedad.productos[0].novedad = true;
  conNovedad.productos[0].novedad_tag = 'NUEVO';
  conNovedad.productos[0].novedad_desc = 'Lanzamiento de prueba';
  conNovedad.productos[0].fecha_novedad = new Date().toISOString().slice(0, 10);

  await page.route('**/psa-catalogo.json*', route => json(route, conNovedad));
  await page.route('**/psa-planes.json*', route => json(route, clon(planesRepo, '25-Oct-2026')));
  await page.route('**/storage/v1/object/public/catalogo-psa/**', route => json(route, {}));

  await page.evaluate(() => window.abrirLista());

  await expect(page.locator('#lpCont'), 'no queda la pestaña Novedades').not.toContainText('Novedades');
  await expect(page.locator('#lpCont'), 'no queda la etiqueta NUEVO').not.toContainText('NUEVO');
  await expect(page.locator('.lp-novedad-card'), 'ni la clase de la tarjeta').toHaveCount(0);
  await expect(page.locator('.lp-novedad-badge'), 'ni el badge').toHaveCount(0);
  // Las demás categorías siguen intactas.
  await expect(page.locator('#lpCont')).toContainText('Opciones de ingreso');
});

// v856 · Packs y Opciones de ingreso se colaban en "Todos" junto con el
// catálogo general: 33 productos caros tapaban el listado habitual. Ahora
// sólo aparecen cuando se pica su píldora, y ni siquiera el buscador los
// trae en "Todos" (decisión explícita de Germán: estricto).
const skusEn = page => page.locator('#lpList .lp-item')
  .evaluateAll(els => els.map(e => e.getAttribute('data-sku') || ''));

const CLAVES_PACKS = clavesDe(['packs']);
const CLAVES_INGRESO = clavesDe(['ingreso']);
const CLAVES_OCULTAS = new Set([...CLAVES_PACKS, ...CLAVES_INGRESO]);

test('en "Todos" no aparecen ni Packs ni Opciones de ingreso', async ({ page }) => {
  await entrar(page);
  await servirListas(page, '25-Oct-2026', '');

  await page.evaluate(() => window.abrirLista());

  const skus = await skusEn(page);
  expect(skus.length, 'sigue mostrando el catálogo general').toBeGreaterThan(0);
  expect(skus.filter(s => CLAVES_OCULTAS.has(s)),
    'ningún pack ni ingreso en Todos').toEqual([]);
  await expect(page.locator('.lp-item-is-pack'), 'ni la clase que las marca').toHaveCount(0);
  await expect(page.locator('#lpList'), 'no aparecen los títulos de esos grupos')
    .not.toContainText('Packs PSA');
});

test('la píldora Packs PSA muestra sólo los packs', async ({ page }) => {
  await entrar(page);
  await servirListas(page, '25-Oct-2026', '');

  await page.evaluate(() => window.abrirLista());
  await page.getByRole('button', { name: 'Packs PSA', exact: true }).click();

  // Equivalencia exacta: ni falta ni sobra. No sirve mirar prefijos porque
  // hay un SUPER-PACK, que no arranca con "PACK-".
  const skus = new Set(await skusEn(page));
  expect([...skus].sort(), 'exactamente los packs del catálogo')
    .toEqual([...CLAVES_PACKS].sort());
  await expect(page.locator('.lp-item-is-pack'), 'cada ficha es de pack')
    .toHaveCount(await page.locator('#lpList .lp-item').count());
});

test('la píldora Opciones de ingreso muestra sólo los ingresos', async ({ page }) => {
  await entrar(page);
  await servirListas(page, '25-Oct-2026', '');

  await page.evaluate(() => window.abrirLista());
  await page.getByRole('button', { name: 'Opciones de ingreso', exact: true }).click();

  const skus = new Set(await skusEn(page));
  expect([...skus].sort(), 'exactamente los ingresos del catálogo')
    .toEqual([...CLAVES_INGRESO].sort());
  await expect(page.locator('.lp-item-is-pack'), 'cada ficha es de ingreso')
    .toHaveCount(await page.locator('#lpList .lp-item').count());
});

test('ni el buscador trae packs ni ingresos en "Todos"', async ({ page }) => {
  await entrar(page);
  await servirListas(page, '25-Oct-2026', '');

  await page.evaluate(() => window.abrirLista());

  // "PACK BELLEZA" sólo existe como pack: si aparece es que se coló.
  await page.fill('#lpSearch', 'PACK BELLEZA');
  await expect(page.locator('.lp-empty'), 'en Todos no lo encuentra').toBeVisible();
  await expect(page.locator('#lpList .lp-item')).toHaveCount(0);

  // Y la píldora sí lo recupera, con el buscador activo.
  await page.getByRole('button', { name: 'Packs PSA', exact: true }).click();
  expect([...new Set(await skusEn(page))]).toEqual(['PACK-BELLEZA']);
});
