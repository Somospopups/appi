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

const clon = (base, actualizado, precio) => {
  const c = JSON.parse(JSON.stringify(base));
  c.actualizado = actualizado;
  if (precio !== undefined && c.productos && c.productos[0]) {
    c.productos[0].precio = precio;
    c.productos[0].lista = precio;
  }
  return c;
};

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
