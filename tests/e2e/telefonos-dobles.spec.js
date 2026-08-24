const { test, expect } = require('@playwright/test');

/* Campos de teléfono con más de un número (o con un "54" suelto) (v331).
   Antes parseTelefonos guardaba cualquier parte con 8+ dígitos y un "54"
   roto entraba al listado: el picker mostraba dos opciones, la segunda
   "54", y el enlace de WhatsApp quedaba inválido. */

async function parse(page, valor) {
  return page.evaluate(v => {
    window.__telSalida = window.parseTelefonos(v);
    return window.__telSalida.map(t => ({ display: t.display, digits: t.digits }));
  }, valor);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
});

test('un "54" suelto después de un número se descarta y queda un solo teléfono', async ({ page }) => {
  const tels = await parse(page, '351 766-9967 / 54');
  expect(tels).toHaveLength(1);
  expect(tels[0].display).toBe('351 766-9967');
  expect(tels[0].digits).toBe('3517669967');
});

test('dos números válidos dan dos teléfonos', async ({ page }) => {
  const tels = await parse(page, '54 351 766-9967 / 54 351 555-1234');
  expect(tels).toHaveLength(2);
  expect(tels[0].digits).toBe('543517669967');
  expect(tels[1].digits).toBe('543515551234');
});

test('un número partido por guiones con espacios se rescata entero', async ({ page }) => {
  const tels = await parse(page, '54 351 766 - 9967');
  expect(tels).toHaveLength(1);
  expect(tels[0].digits).toBe('543517669967');
});

test('una mitad de número (8 dígitos rotos) no entra al listado', async ({ page }) => {
  const tels = await parse(page, '54 351 766');
  expect(tels).toHaveLength(0);
});

test('el mismo número repetido no se duplica', async ({ page }) => {
  const tels = await parse(page, '351 766-9967 / 54 9 351 766-9967');
  expect(tels).toHaveLength(1);
});
