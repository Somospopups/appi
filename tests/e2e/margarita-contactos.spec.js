const { test, expect } = require('@playwright/test');
const { entrar } = require('./helpers/app-entrar.js');

async function abrirMargarita(page) {
  await entrar(page);
  await page.evaluate(() => window.openMargarita());
  await expect(page.locator('#view-margarita')).toHaveClass(/active/);
  await expect(page.locator('#margaritaCont')).toContainText('Tu margarita de contactos');
}

test('Mi Margarita vive en Mi negocio, tiene ocho pétalos centrados y recuerda contactos', async ({ page }) => {
  await abrirMargarita(page);

  const petalos = page.locator('[data-mg-group]');
  await expect(petalos).toHaveCount(8);
  await expect(petalos.nth(0)).toContainText('Amigos');
  await expect(petalos.nth(7)).toContainText(/Clientes\s*PSA/);
  await expect(page.locator('#margaritaCont')).toContainText('Demostración');
  await expect(page.locator('#margaritaCont')).toContainText('Presentación de negocio');
  await expect(page.locator('#margaritaCont')).toContainText('Pedir un referido');

  // Los ocho pétalos parten alineados desde el borde del círculo central,
  // sin cruzarlo; el contenido se conserva derecho con --counter.
  const geometria = await page.locator('[data-mg-group]').evaluateAll(nodes => nodes.map(node => {
    const style = getComputedStyle(node);
    return { origin: style.transformOrigin, angle: node.style.getPropertyValue('--angle'), counter: node.style.getPropertyValue('--counter'), outset: node.style.getPropertyValue('--petal-outset') };
  }));
  expect(geometria).toHaveLength(8);
  geometria.forEach((p, i) => {
    expect(p.origin).toMatch(/57px 180px/);
    expect(p.angle).toBe(`${i * 45}deg`);
    expect(p.counter).toBe(`-${i * 45}deg`);
    expect(p.outset).toBe('-78px');
  });

  await page.evaluate(() => {
    const estado = window.APPIMargarita.cargar();
    estado.nombre = 'María';
    estado.contactos.amigos = [{ id: 'laura-351', nombre: 'Laura Gómez', telefono: '3515551234' }];
    window.APPIMargarita.guardar(estado);
    window.APPIMargarita.render();
  });
  await expect(page.locator('.mg-center')).toContainText('María');
  await expect(page.locator('[data-mg-group="amigos"]')).toContainText('1 persona');

  const seSincroniza = await page.evaluate(() => window.APPIDataSync.isDataKey('appi_margarita_contactos_v1_' + window.APPIAuth.userId()));
  expect(seSincroniza).toBe(true);
});

test('en móvil mantiene la flor centrada y abre un pétalo al tocarlo', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await abrirMargarita(page);
  await expect(page.locator('.mg-stage')).toBeVisible();
  await expect(page.locator('[data-mg-group="amigos"]')).toBeVisible();

  // Android puede informar safe-area 0 aun con la barra de estado superpuesta:
  // la cabecera completa debe reservar espacio real y el pie no tapar Familia.
  const movil = await page.evaluate(() => {
    const app = document.querySelector('.app').getBoundingClientRect();
    const header = document.querySelector('#view-margarita > header.top').getBoundingClientRect();
    const family = document.querySelector('[data-mg-group="familia"]').getBoundingClientRect();
    const foot = document.querySelector('.mg-garden-foot').getBoundingClientRect();
    return {
      appTop: Number(getComputedStyle(document.querySelector('.app')).paddingTop.replace('px','')),
      headerTop: header.top - app.top,
      familyBottom: family.bottom,
      footTop: foot.top
    };
  });
  expect(movil.appTop).toBeGreaterThanOrEqual(48);
  expect(movil.headerTop).toBeGreaterThanOrEqual(0);
  expect(movil.footTop).toBeGreaterThanOrEqual(movil.familyBottom);

  await page.locator('[data-mg-group="amigos"] .mg-petal-content').click();
  await expect(page.locator('#mgSheet')).toContainText('Elegí personas para este pétalo');
});

test('los pétalos y el nombre del centro se pueden editar sin diálogos nativos', async ({ page }) => {
  await abrirMargarita(page);

  await page.locator('#mgEditGroups').click();
  await expect(page.locator('#mgSheet')).toContainText('Editar pétalos');
  await page.locator('[data-mg-label="amigos"]').fill('Círculo cercano');
  await page.locator('[data-mg-icon="amigos"]').selectOption({ label: '☕' });
  await page.locator('#mgSaveEdit').click();
  await expect(page.locator('[data-mg-group="amigos"]')).toContainText(/Círculo\s*cercano/);
  await expect(page.locator('[data-mg-group="amigos"]')).toContainText('☕');

  await page.evaluate(() => { window.APPIDialog.prompt = () => Promise.resolve('Sofía'); });
  await page.locator('#mgEditName').click();
  await expect(page.locator('.mg-center')).toContainText('Sofía');
});

test('usa el Contact Picker cuando el teléfono lo ofrece y guarda la selección', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'contacts', {
      configurable: true,
      value: { select: async () => [{ name: ['Lucía Contacto'], tel: ['3515557788'] }] }
    });
  });
  await abrirMargarita(page);

  await page.locator('[data-mg-group="amigos"] .mg-petal-content').click();
  await expect(page.locator('#mgPhone')).toBeVisible();
  await page.locator('#mgPhone').click();
  await page.locator('#mgSavePick').click();
  await expect(page.locator('[data-mg-group="amigos"]')).toContainText('1 persona');

  const guardado = await page.evaluate(() => window.APPIMargarita.cargar().contactos.amigos);
  expect(guardado).toEqual(expect.arrayContaining([expect.objectContaining({ nombre: 'Lucía Contacto', telefono: '3515557788' })]));
});
