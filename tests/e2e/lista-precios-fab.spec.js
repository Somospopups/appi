import { test, expect } from '@playwright/test';

async function entrar(page) {
  await page.goto('/index.html');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    // El clear borra las banderas del storageState global: re-ponerlas para
    // que el cartel "¿Recibís los avisos de APPI?" (appi-notif) no salte y
    // tape los clics (pasa cuando el arranque tarda y el popup gana la carrera).
    localStorage.setItem('appi_notif_listo_v1', '1');
    localStorage.setItem('appi_notif_popup_later', String(Date.now() + 400 * 24 * 3600 * 1000));
    const mockUser = {
      id: 'mock-user-fab',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'test@appi.local',
      user_metadata: { numero_distribuidor: '123456' },
      app_metadata: { provider: 'email' },
      created_at: new Date().toISOString()
    };
    const mockSession = {
      access_token: 'mock-token-fab',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-fab',
      user: mockUser,
      expires_at: Math.floor(Date.now() / 1000) + 3600
    };
    localStorage.setItem('sb-appsi-auth-token', JSON.stringify({
      currentSession: mockSession,
      expiresAt: mockSession.expires_at
    }));
    localStorage.setItem('appsi_psa_creds', JSON.stringify({
      center: '12',
      number: '123456',
      password: 'password123',
      name: 'Usuario Test'
    }));
    sessionStorage.setItem('psaPopupYaMostrado', '1');
  });
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(() => {
    const lock = document.getElementById('lockScreen');
    if (lock) lock.classList.add('hidden');
    document.body.classList.remove('appi-login-abierto');
  });
}

test('cada producto muestra la foto del Portal PCD en la lista de precios', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => {
    if (typeof openLista === 'function') openLista();
  });
  await page.waitForSelector('.lp-item', { timeout: 10000 });

  await page.fill('#lpSearch', 'SENIOR 4 BIANCO');
  await page.waitForTimeout(300);

  // El Senior 4 Bianco (SKU 611010510) tiene la foto del Portal PCD de
  // compras en catalogo-img/ (PNG 200x200, la misma que ve el distribuidor
  // al comprar en comprasonline.psa.com.ar).
  const img = page.locator('.lp-item .lp-item-foto').first();
  await expect(img).toBeVisible();
  await expect(img).toHaveAttribute('src', 'catalogo-img/611010510.png');
  // La miniatura debe CARGAR (el archivo vive en el repo → anda offline).
  await expect(async () => {
    const w = await img.evaluate(el => el.naturalWidth);
    expect(w).toBeGreaterThan(0);
  }).toPass({ timeout: 10000 });
  // El resto de la fila sigue intacto (nombre + precio).
  await expect(page.locator('.lp-item').first()).toContainText('PSA SENIOR 4 BIANCO');
  // En v834 TODOS los productos tienen foto, incluyendo adaptadores y ablandadores.
  await page.fill('#lpSearch', 'ABLANDADOR PSA DOMUS');
  await page.waitForTimeout(300);
  const domusImg = page.locator('.lp-item .lp-item-foto').first();
  await expect(domusImg).toBeVisible();
  await expect(async () => {
    const w = await domusImg.evaluate(el => el.naturalWidth);
    expect(w).toBeGreaterThan(0);
  }).toPass({ timeout: 10000 });
});

test.describe('Bandeja desplegable de presupuesto sobre el dock', () => {
  test.use({ viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' });

  test('MOBILE: la bandeja confirma lo agregado, muestra fotos y queda fija sobre el dock', async ({ page }) => {
    await entrar(page);
    await page.evaluate(() => {
      if (typeof openLista === 'function') openLista();
    });
    await page.waitForSelector('.lp-item', { timeout: 10000 });

    const fab = page.locator('#lpFab');
    await expect(fab).toBeHidden();

    // Agregar un producto a cotizar
    const plusBtn = page.locator('.lp-qty button[data-act="mas"]').first();
    await plusBtn.click();
    // La foto sale de la ficha y vuela hasta el carrito de la bandeja.
    const fly = page.locator('.lp-fly-product');
    await expect(fly).toHaveCount(1, { timeout: 500 });
    await page.waitForTimeout(300);

    await expect(fab).toBeVisible();
    await expect(fab).toHaveClass(/is-feedback/);
    await expect(fab.locator('.lp-tray-title-text')).toContainText('agregado');
    await expect(fab.locator('.lp-fab-badge')).toHaveText('1');
    await expect(fab.locator('.lp-fab-tot')).not.toBeEmpty();
    await expect(fab.locator('.lp-tray-face')).toHaveCount(1);
    await expect(fab.locator('.lp-tray-open')).toBeVisible();
    await expect(fab.locator('.lp-tray-open svg')).toHaveCount(1);
    await expect(fab).toHaveCSS('background-color', 'rgb(239, 106, 31)');
    await expect.poll(() => fab.evaluate(el => getComputedStyle(el).backgroundImage)).toContain('linear-gradient');

    await expect(fly).toHaveCount(0, { timeout: 2000 });

    await page.evaluate(() => document.body.classList.add('dark'));
    await expect(fab).toHaveCSS('background-color', 'rgb(180, 70, 18)');
    await page.evaluate(() => document.body.classList.remove('dark'));

    const mBefore = await page.evaluate(() => {
      const f = document.getElementById('lpFab');
      const dock = document.getElementById('pageTabs');
      const fRect = f.getBoundingClientRect();
      const dRect = dock.getBoundingClientRect();
      return {
        fTop: fRect.top,
        fBottom: fRect.bottom,
        dTop: dRect.top,
        clearance: dRect.top - fRect.bottom,
        dockVisible: window.getComputedStyle(dock).display !== 'none'
      };
    });

    // La bandeja debe quedar visible sobre el dock, sin taparlo.
    expect(mBefore.dockVisible).toBe(true);
    expect(mBefore.fBottom).toBeLessThan(mBefore.dTop);
    expect(mBefore.clearance).toBeGreaterThanOrEqual(8);
    expect(mBefore.clearance).toBeLessThanOrEqual(25);

    // Scrollear la lista de precios 800px hacia abajo
    await page.evaluate(() => {
      window.scrollTo(0, 800);
      document.body.scrollTop = 800;
    });
    await page.waitForTimeout(300);

    const mAfter = await page.evaluate(() => {
      const f = document.getElementById('lpFab');
      const dock = document.getElementById('pageTabs');
      const fRect = f.getBoundingClientRect();
      const dRect = dock.getBoundingClientRect();
      return {
        fTop: fRect.top,
        fBottom: fRect.bottom,
        dTop: dRect.top,
        clearance: dRect.top - fRect.bottom
      };
    });

    // La posición de la bandeja NO debe cambiar al scrollear.
    expect(Math.abs(mAfter.fTop - mBefore.fTop)).toBeLessThanOrEqual(1);
    expect(Math.abs(mAfter.fBottom - mBefore.fBottom)).toBeLessThanOrEqual(1);
    expect(mAfter.clearance).toBeGreaterThanOrEqual(8);
  });

  test('MOBILE: tocar la bandeja abre correctamente el presupuesto completo', async ({ page }) => {
    await entrar(page);
    await page.evaluate(() => {
      if (typeof openLista === 'function') openLista();
    });
    await page.waitForSelector('.lp-item', { timeout: 10000 });

    const plusBtn = page.locator('.lp-qty button[data-act="mas"]').first();
    await plusBtn.click();
    await page.waitForTimeout(300);

    const fab = page.locator('#lpFab');
    await expect(fab).toBeVisible();

    // Clic en la bandeja
    await fab.click();
    await page.waitForTimeout(300);

    const sheet = page.locator('#lpSheet');
    await expect(sheet).toHaveClass(/open/);

    // Cerrar el sheet
    const closeBtn = page.locator('#lpSheet [data-cerrar]');
    await closeBtn.click();
    await page.waitForTimeout(300);
    await expect(sheet).not.toHaveClass(/open/);
  });

  test('DESKTOP: en pantalla ancha queda centrada abajo, sin dock', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await entrar(page);
    await page.evaluate(() => {
      if (typeof openLista === 'function') openLista();
    });
    await page.waitForSelector('.lp-item', { timeout: 10000 });

    const plusBtn = page.locator('.lp-qty button[data-act="mas"]').first();
    await plusBtn.click();
    await page.waitForTimeout(300);

    const metrics = await page.evaluate(() => {
      const f = document.getElementById('lpFab');
      const dock = document.getElementById('pageTabs');
      const fRect = f.getBoundingClientRect();
      return {
        fBottom: fRect.bottom,
        fCenter: fRect.left + fRect.width / 2,
        winWidth: window.innerWidth,
        winHeight: window.innerHeight,
        dockDisplay: window.getComputedStyle(dock).display
      };
    });

    expect(metrics.dockDisplay).toBe('none');
    expect(metrics.winHeight - metrics.fBottom).toBeLessThanOrEqual(36);
    // En pantalla ancha, la bandeja queda centrada sobre el eje del viewport.
    expect(Math.abs(metrics.winWidth / 2 - metrics.fCenter)).toBeLessThanOrEqual(4);
  });
});

test('producto con plan canje aparece en un renglón y conserva su foto', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await entrar(page);
  await page.evaluate(() => {
    if (typeof openLista === "function") openLista();
  });
  await page.waitForSelector(".lp-item", { timeout: 10000 });

  await page.fill("#lpSearch", "611010510");
  await page.waitForTimeout(300);

  const rows = page.locator("#lpList .lp-item");
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).not.toContainText('PLAN CANJE');
  await expect(rows.first().locator('.lp-price-choice')).toHaveCount(2);
  const opciones = rows.first().locator('.lp-price-choice');
  await expect(opciones.nth(0)).toContainText('Precio de canje');
  await expect(opciones.nth(1)).toContainText('Precio normal');
  const alineacion = await rows.first().evaluate((row) => {
    const box = (el) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    };
    return {
      item: box(row),
      texto: box(row.querySelector('.lp-item-txt')),
      canje: box(row.querySelectorAll('.lp-price-choice')[0]),
      normal: box(row.querySelectorAll('.lp-price-choice')[1]),
      overflow: row.scrollWidth > row.clientWidth
    };
  });
  expect(alineacion.texto.right).toBeLessThanOrEqual(alineacion.canje.left + 1);
  expect(alineacion.canje.right).toBeLessThanOrEqual(alineacion.normal.left + 1);
  expect(Math.abs(alineacion.canje.right - alineacion.canje.left - (alineacion.normal.right - alineacion.normal.left))).toBeLessThanOrEqual(1);
  expect(Math.min(alineacion.texto.bottom, alineacion.canje.bottom) - Math.max(alineacion.texto.top, alineacion.canje.top)).toBeGreaterThan(0);
  expect(alineacion.overflow).toBe(false);

  // También conserva la misma distribución cuando una miniatura no existe.
  await page.fill("#lpSearch", "611010730");
  const sinFoto = page.locator("#lpList .lp-item").first();
  await expect(sinFoto).toHaveCount(1);
  // Simular una imagen rota: el producto ahora sí tiene una foto disponible.
  await sinFoto.locator('.lp-item-foto').evaluate(img => { img.src = '/imagen-inexistente-test.png'; });
  await expect(sinFoto).toHaveClass(/lp-item-no-photo/);
  const alineacionSinFoto = await sinFoto.evaluate((row) => {
    const r = (el) => el.getBoundingClientRect();
    const texto = r(row.querySelector('.lp-item-txt'));
    const opciones = [...row.querySelectorAll('.lp-price-choice')].map(r);
    return {
      textoAntesDeBotones: texto.right <= opciones[0].left + 1,
      ordenDeBotones: opciones[0].right <= opciones[1].left + 1,
      mismoAncho: Math.abs((opciones[0].right - opciones[0].left) - (opciones[1].right - opciones[1].left)) <= 1,
      anchoCanje: opciones[0].right - opciones[0].left,
      mismaFila: Math.min(texto.bottom, opciones[0].bottom) > Math.max(texto.top, opciones[0].top),
      overflow: row.scrollWidth > row.clientWidth
    };
  });
  expect(alineacionSinFoto).toMatchObject({ textoAntesDeBotones: true, ordenDeBotones: true, mismoAncho: true, mismaFila: true, overflow: false });
  expect(Math.abs(alineacionSinFoto.anchoCanje - (alineacion.canje.right - alineacion.canje.left))).toBeLessThanOrEqual(1);

  await page.fill("#lpSearch", "611010510");
  await expect(rows).toHaveCount(1);
  await opciones.nth(0).click();
  await expect(rows.first()).toHaveClass(/lp-item-selected/);
  await expect(opciones.nth(0)).toHaveClass(/is-in-cart/);
  await expect(opciones.nth(1)).not.toHaveClass(/is-in-cart/);

  const foto = rows.first().locator(".lp-item-foto");
  await expect(foto).toBeVisible();
  await expect(foto).toHaveAttribute("src", "catalogo-img/611010510.png");
  await foto.click();
  await page.waitForTimeout(300);

  const modal = page.locator("#lpFotoModal");
  await expect(modal).toHaveClass(/open/);
  const modalImg = page.locator("#lpFotoModalImg");
  await expect(modalImg).toBeVisible();
  await expect(modalImg).toHaveAttribute("src", "catalogo-img/611010510.png");

  await page.locator("#lpFotoModalClose").click();
  await page.waitForTimeout(300);
  await expect(modal).not.toHaveClass(/open/);
});

test('los productos con canje aparecen primero', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => { if (typeof openLista === 'function') openLista(); });
  await page.waitForSelector('.lp-item', { timeout: 10000 });
  const verify = async () => {
    const filas = await page.locator('#lpList .lp-item').evaluateAll(items => items.map(el => ({
      canje: el.classList.contains('lp-item-has-canje'), clave: el.dataset.sku
    })));
    expect(filas.some(x => x.canje)).toBe(true);
    expect(filas.some(x => !x.canje)).toBe(true);
    const primeroSinCanje = filas.findIndex(x => !x.canje);
    expect(filas.slice(primeroSinCanje).every(x => !x.canje)).toBe(true);
  };
  await verify();
  await expect(page.locator('#lpList .lp-sec').first()).toHaveText('Productos con plan canje');
  await page.fill('#lpSearch', 'senior');
  await expect(page.locator('#lpList .lp-item').first()).toContainText(/senior/i);
  await verify();
});

test('Iontrix respeta lista oficial y los botones centran su contenido', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/storage/v1/object/public/catalogo-psa/psa-catalogo.json*', route => route.fulfill({ json: {
    actualizado: '31-Dec-2099', productos: [{ sku: '611290050', nombre: 'PSA IONTRIX 3', precio: 917250, plan_canje: 1100700 }]
  }}));
  await entrar(page);
  await page.evaluate(() => { if (typeof openLista === 'function') openLista(); });
  await page.waitForSelector('.lp-item', { timeout: 10000 });
  await page.fill('#lpSearch', '611290050');
  const row = page.locator('#lpList .lp-item').first();
  await expect(row.locator('.lp-price-choice').nth(0)).toContainText('1.100.700');
  await expect(row.locator('.lp-price-choice').nth(1)).toContainText('1.223.000');
  for (const btn of await row.locator('.lp-price-choice').all()) {
    expect(await btn.evaluate(el => getComputedStyle(el).textAlign)).toBe('center');
    expect(await btn.evaluate(el => getComputedStyle(el).alignItems)).toBe('center');
  }
});

test('presupuesto renovado muestra total grande, fotos, tarjetas y permite deslizar para eliminar', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await entrar(page);
  await page.evaluate(() => { if (typeof openLista === 'function') openLista(); });
  await page.waitForSelector('.lp-item', { timeout: 10000 });
  await page.fill('#lpSearch', '611010510');
  await page.locator('#lpList .lp-price-choice').nth(1).click();
  await page.locator('#lpFab').click();

  const sheet = page.locator('#lpSheet');
  await expect(sheet).toHaveClass(/open/);
  await expect(sheet.locator('.lp-sheet-top')).toContainText('Presupuesto');
  await expect.poll(() => sheet.locator('.lp-sheet-top').evaluate(el => getComputedStyle(el).backgroundImage)).toContain('linear-gradient');
  await expect(sheet.locator('.lp-total-card')).toContainText('TOTAL DEL PRESUPUESTO');
  await expect(sheet.locator('.lp-total-card')).toContainText('$950.000');

  const lineBlock = sheet.locator('.lp-line-block').first();
  const line = lineBlock.locator('.lp-line');
  await expect(line.locator('.lp-line-photo')).toBeVisible();
  await expect(line.locator('.lp-line-name')).toHaveCSS('white-space', 'nowrap');
  expect(await line.evaluate(el => getComputedStyle(el).display)).toBe('grid');
  expect((await line.boundingBox()).height).toBeLessThanOrEqual(64);
  await expect(lineBlock.locator('.lp-desc-toggle')).toHaveCount(0);

  const payOptions = sheet.locator('.lp-pay-option');
  expect(await payOptions.count()).toBeGreaterThanOrEqual(5);
  await expect(sheet.getByRole('button', { name: 'Contado', exact: true }).locator('.lp-pay-art')).toBeVisible();
  await expect(sheet.getByRole('button', { name: 'Cuota Simple', exact: true }).locator('.lp-pay-art')).toBeVisible();
  await expect(sheet.getByRole('button', { name: 'Naranja', exact: true }).locator('.lp-pay-art')).toBeVisible();
  await expect(sheet.getByRole('button', { name: 'Galicia', exact: true }).locator('.lp-pay-art')).toBeVisible();
  await expect(sheet.getByRole('button', { name: 'BBVA', exact: true }).locator('.lp-pay-art')).toBeVisible();

  // Sólo las cuatro marcas auditadas usan paleta corporativa; el resto queda
  // deliberadamente neutro y sigue identificado con sigla + nombre visible.
  const paletas = await sheet.locator('.lp-pay-options').evaluate((host) => {
    const colores = (id) => {
      const el = host.querySelector('[data-banco="' + id + '"] .lp-pay-art');
      const cs = getComputedStyle(el);
      return { clase: el.className, a: cs.getPropertyValue('--pay-a').trim().toLowerCase(), b: cs.getPropertyValue('--pay-b').trim().toLowerCase(), sigla: el.textContent.trim() };
    };
    return {
      simple: colores('cuota-simple'),
      naranja: colores('tarjeta-naranja'),
      galicia: colores('banco-galicia'),
      bbva: colores('bbva'),
      macro: colores('macro'),
      tonosArbitrarios: host.querySelectorAll('.tone-0,.tone-1,.tone-2,.tone-3,.tone-4').length
    };
  });
  expect(paletas.simple).toMatchObject({ a: '#547ea8', b: '#1b2d51', sigla: 'CS' });
  expect(paletas.naranja).toMatchObject({ a: '#f75000', b: '#f75000', sigla: 'N×' });
  expect(paletas.galicia).toMatchObject({ a: '#fa6400', b: '#fa6400', sigla: 'G' });
  expect(paletas.bbva).toMatchObject({ a: '#004481', b: '#072146', sigla: 'BBVA' });
  expect(paletas.macro.clase).toContain('neutral');
  expect(paletas.macro).toMatchObject({ a: '#69727b', b: '#343b43', sigla: 'M' });
  expect(paletas.tonosArbitrarios).toBe(0);

  const price = line.locator('.lp-price-touch');
  await price.click();
  await lineBlock.locator('[data-set-desc="10"]').click();
  await expect(lineBlock.locator('.lp-price-touch')).toContainText('10%');

  const product = lineBlock.locator('.lp-line-product');
  const box = await product.boundingBox();
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x - 110, box.y + box.height / 2, { steps: 8 });
  await page.mouse.up();

  // La fila se desprende, baja hacia el cesto y entra reducida/rotada.
  const flyToTrash = page.locator('body > .lp-trash-fly');
  await expect(flyToTrash).toHaveCount(1, { timeout: 500 });
  const keyframes = await flyToTrash.evaluate(el => el.getAnimations()[0].effect.getKeyframes().map(k => k.transform));
  expect(keyframes).toHaveLength(4);
  expect(keyframes[1]).toContain('translate3d');
  expect(keyframes[3]).toContain('scale(0.08)');
  expect(keyframes[3]).toContain('rotate(22deg)');
  await expect(sheet.locator('#lpSheetClear')).toHaveClass(/is-receiving/, { timeout: 1200 });
  await expect(flyToTrash).toHaveCount(0, { timeout: 2000 });
  await expect(sheet.locator('#lpUndoToast')).toBeVisible({ timeout: 2500 });
  await expect(sheet.locator('.lp-empty')).toContainText('vacío');
  await sheet.getByRole('button', { name: 'Deshacer', exact: true }).click();
  await expect(sheet.locator('.lp-line-block')).toHaveCount(1);
  await expect(sheet.locator('.lp-price-touch')).toContainText('10%');
});

test('swipe respeta movimiento reducido sin crear el vuelo al cesto', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await entrar(page);
  await page.evaluate(() => { if (typeof openLista === 'function') openLista(); });
  await page.waitForSelector('.lp-item', { timeout: 10000 });
  await page.fill('#lpSearch', '611010510');
  await page.locator('#lpList .lp-price-choice').nth(1).click();
  await page.locator('#lpFab').click();

  const sheet = page.locator('#lpSheet');
  const lineBlock = sheet.locator('.lp-line-block').first();
  const product = lineBlock.locator('.lp-line-product');
  const box = await product.boundingBox();
  await page.mouse.move(box.x + box.width * .8, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x - 110, box.y + box.height / 2, { steps: 8 });
  await page.mouse.up();

  await expect(page.locator('body > .lp-trash-fly')).toHaveCount(0);
  await expect(sheet.locator('#lpUndoToast')).toBeVisible({ timeout: 1200 });
  await expect(sheet.locator('.lp-empty')).toContainText('vacío');
});

test('presupuesto compacto despliega ganancias y descuentos por producto', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await entrar(page);
  await page.evaluate(() => { if (typeof openLista === 'function') openLista(); });
  await page.waitForSelector('.lp-item', { timeout: 10000 });
  await page.fill('#lpSearch', '611010510');
  await page.locator('#lpList .lp-price-choice').nth(1).click();
  await page.locator('#lpFab').click();
  const sheet = page.locator('#lpSheet');
  const gain = sheet.locator('#lpSheetGanancia');
  const toggle = sheet.getByRole('button', { name: /Ver ganancias/ });
  await expect(gain).toBeHidden();
  await toggle.click();
  await expect(gain).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  const line = sheet.locator('.lp-line-block').first();
  await expect(line.locator('[data-set-desc="10"]')).toBeHidden();
  await line.locator('[data-toggle-desc]').click();
  await line.locator('[data-set-desc="10"]').click();
  await expect(line.locator('[data-toggle-desc]')).toContainText('10%');
  await expect(line.locator('[data-set-desc="10"]')).toBeHidden();
  await expect(sheet.locator('#lpSheetTot')).toContainText('$855.000');
  await expect(gain).toBeVisible();
  await sheet.getByRole('button', { name: 'Cerrar', exact: true }).click();
  await page.locator('#lpFab').click();
  await expect(gain).toBeHidden();
  await expect(line.locator('[data-toggle-desc]')).toContainText('10%');
});
