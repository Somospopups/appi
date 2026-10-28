import { test, expect } from '@playwright/test';

async function entrar(page) {
  await page.goto('/index.html');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
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

test.describe('Packs PSA en Lista de Precios', () => {
  test('muestra chip de Packs PSA, productos con composición, fotos y agrega al presupuesto', async ({ page }) => {
    await entrar(page);
    await page.evaluate(() => {
      if (typeof openLista === 'function') openLista();
    });

    // Esperar a que la lista cargue
    const hostList = page.locator('#lpList');
    await expect(hostList).toBeVisible({ timeout: 10000 });
    await page.waitForSelector('.lp-item', { timeout: 10000 });

    // Verificar que existe el chip de Packs PSA
    const chipPacks = page.locator('.lp-chip[data-g="packs"]');
    await expect(chipPacks).toBeVisible();
    await expect(chipPacks).toHaveText('Packs PSA');

    // Click en el chip de Packs PSA
    await chipPacks.click();
    await page.waitForTimeout(300);

    // Verificar que se listan los packs
    const packItems = page.locator('.lp-item.lp-item-is-pack');
    const count = await packItems.count();
    expect(count).toBeGreaterThanOrEqual(11);

    // Verificar Pack Básico específicamente
    const packBasico = page.locator('.lp-item[data-sku="PACK-BASICO"]');
    await expect(packBasico).toBeVisible();
    await expect(packBasico.locator('b')).toHaveText('PACK BÁSICO');
    await expect(packBasico.locator('em')).toHaveText('$1.376.000');
    await expect(packBasico.locator('.lp-item-pack-desc')).toContainText('Senior4');

    // Verificar que la foto del pack existe y carga
    const imgFoto = packBasico.locator('.lp-item-foto');
    await expect(imgFoto).toBeVisible();
    const src = await imgFoto.getAttribute('src');
    expect(src).toBe('catalogo-img/packs/pack_basico.png');

    // Comprobar que la imagen carga correctamente
    await expect(async () => {
      const w = await imgFoto.evaluate(el => el.naturalWidth);
      expect(w).toBeGreaterThan(0);
    }).toPass({ timeout: 10000 });

    // Agregar el pack al presupuesto
    const btnMas = packBasico.locator('button[data-act="mas"]');
    await btnMas.click();

    // Comprobar que la píldora FAB aparece con 1 ítem y $1.376.000
    const fab = page.locator('#lpFab');
    await expect(fab).toBeVisible();
    // El FAB dibuja badge + etiqueta + total (ya no usa <i>).
    await expect(fab.locator('.lp-fab-badge')).toHaveText('1');
    await expect(fab.locator('.lp-fab-tot')).toHaveText('$1.376.000');

    // Abrir el sheet del presupuesto haciendo click en el FAB
    await fab.click();
    const sheet = page.locator('#lpSheet');
    await expect(sheet).toHaveClass(/open/);

    // Verificar la línea en el presupuesto (el atributo data-sku vive en el
    // bloque contenedor .lp-line-block; la línea es su primer hijo).
    const sheetLine = page.locator('.lp-line-block[data-sku="PACK-BASICO"]');
    await expect(sheetLine).toBeVisible();
    await expect(sheetLine.locator('b')).toHaveText('PACK BÁSICO');
    await expect(sheetLine.locator('span')).toHaveText('$1.376.000');
  });

  test('generación de PDF de Pack desglosa componentes en tabla sin precios y genera fichas individuales', async ({ page }) => {
    await entrar(page);
    await page.evaluate(() => {
      if (typeof openLista === 'function') openLista();
    });
    await page.waitForSelector('.lp-item', { timeout: 10000 });

    const chipPacks = page.locator('.lp-chip[data-g="packs"]');
    await chipPacks.click();

    const packBasico = page.locator('.lp-item[data-sku="PACK-BASICO"]');
    await expect(packBasico).toBeVisible();
    await packBasico.locator('button[data-act="mas"]').click();

    const fab = page.locator('#lpFab');
    await expect(fab).toBeVisible();
    await fab.click();
    await expect(page.locator('#lpSheet')).toHaveClass(/open/);

    await page.evaluate(() => {
      window._pdfResult = null;
      window.navigator.canShare = null;
      if (!window.APPIDialog) window.APPIDialog = {};
      window.APPIDialog.prompt = function() { return Promise.resolve('Cliente Test'); };

      const Orig = window.jspdf.jsPDF;
      window.jspdf.jsPDF = function(...args) {
        const inst = new Orig(...args);
        const origSave = inst.save.bind(inst);
        const origSetFill = inst.setFillColor.bind(inst);
        const origRect = inst.rect.bind(inst);
        const origAddImage = inst.addImage.bind(inst);
        const origText = inst.text.bind(inst);
        let fill = [];
        const backgrounds = [];
        const officialComparisons = [];
        const officialLabels = [];
        inst.setFillColor = function(...colors) { fill = colors; return origSetFill(...colors); };
        inst.rect = function(x, y, w, h, style) {
          if (x === 0 && y === 0 && Math.abs(w - inst.internal.pageSize.getWidth()) < .01 && Math.abs(h - inst.internal.pageSize.getHeight()) < .01 && style === 'F') {
            backgrounds.push({page: inst.internal.getCurrentPageInfo().pageNumber, color: [...fill]});
          }
          return origRect(x, y, w, h, style);
        };
        inst.addImage = function(...args) {
          const width = Number(args[4]) || 0;
          const height = Number(args[5]) || 0;
          if (width > 100 && height > 70) {
            officialComparisons.push({
              page: inst.internal.getCurrentPageInfo().pageNumber,
              format: String(args[1] || ''),
              width: Math.round(width),
              height: Math.round(height)
            });
          }
          return origAddImage(...args);
        };
        inst.text = function(...args) {
          const value = Array.isArray(args[0]) ? args[0].join(' ') : String(args[0] || '');
          if (value.indexOf('Comparativa oficial de costos PSA') >= 0) {
            officialLabels.push({ page: inst.internal.getCurrentPageInfo().pageNumber, value });
          }
          return origText(...args);
        };
        inst.save = function(name) {
          window._pdfResult = {
            totalPages: inst.internal.getNumberOfPages(),
            backgrounds,
            officialComparisons,
            officialLabels,
            name: name
          };
          return origSave(name);
        };
        return inst;
      };
    });

    await page.locator('#lpSheetPdf').click();

    await page.waitForFunction(() => !!window._pdfResult, { timeout: 15000 });
    const res = await page.evaluate(() => window._pdfResult);

    expect(res).toBeDefined();
    // PACK BÁSICO tiene 3 componentes: Senior 4, 1-P Portatil, Ducha Rinnova.
    // Con la página 1 de presupuesto + 3 páginas de fichas individuales = 4 páginas.
    expect(res.totalPages).toBe(4);
    expect(res.backgrounds).toEqual([1, 2, 3, 4].map(page => ({page, color: [243, 238, 227]})));
    // La ficha de Senior4 (página 2) lleva la página oficial de PSA como una
    // imagen grande en esa misma hoja. Portátil y Rinnova no tienen una de
    // las cinco comparativas oficiales aprobadas.
    expect(res.officialComparisons).toHaveLength(1);
    expect(res.officialComparisons[0]).toMatchObject({ page: 2, format: 'JPEG' });
    expect(res.officialComparisons[0].width).toBeGreaterThan(160);
    expect(res.officialComparisons[0].height).toBeGreaterThan(100);
    expect(res.officialLabels).toEqual([{ page: 2, value: 'Comparativa oficial de costos PSA' }]);
  });

  test('incorpora las cinco comparativas oficiales en la misma hoja de cada ficha', async ({ page }) => {
    const comparativaSkus = new Set(['611010510', '611010580', '611120200', '611030560', '617110040']);
    // La fixture puede traer promociones temporales ya vencidas; para esta
    // prueba de ficha se usan los productos base a precio normal.
    await page.route('**/psa-catalogo.json*', async route => {
      const response = await route.fetch();
      const data = await response.json();
      (data.productos || []).forEach(p => { if (comparativaSkus.has(String(p.sku || ''))) p.promo = false; });
      await route.fulfill({ response, json: data });
    });
    await entrar(page);
    await page.evaluate(() => { if (typeof openLista === 'function') openLista(); });
    await page.waitForSelector('.lp-item', { timeout: 10000 });

    const skus = ['611010510', '611010580', '611120200', '611030560', '617110040'];
    for (const sku of skus) {
      const normal = page.locator(`.lp-item[data-sku="${sku}"] button[data-price-sku="${sku}"]`);
      await expect(normal).toBeVisible();
      await normal.click();
    }

    await page.locator('#lpFab').click();
    await expect(page.locator('#lpSheet')).toHaveClass(/open/);
    await page.evaluate(() => {
      window._pdfResult = null;
      window.navigator.canShare = null;
      if (!window.APPIDialog) window.APPIDialog = {};
      window.APPIDialog.prompt = function() { return Promise.resolve('Cliente Comparativas'); };
      const Orig = window.jspdf.jsPDF;
      window.jspdf.jsPDF = function(...args) {
        const inst = new Orig(...args);
        const origSave = inst.save.bind(inst);
        const origAddImage = inst.addImage.bind(inst);
        const origText = inst.text.bind(inst);
        const comparisons = [];
        const labels = [];
        inst.addImage = function(...imageArgs) {
          const width = Number(imageArgs[4]) || 0;
          const height = Number(imageArgs[5]) || 0;
          if (width > 100 && height > 70) {
            comparisons.push({
              page: inst.internal.getCurrentPageInfo().pageNumber,
              format: String(imageArgs[1] || ''),
              width: Math.round(width),
              height: Math.round(height)
            });
          }
          return origAddImage(...imageArgs);
        };
        inst.text = function(...textArgs) {
          const value = Array.isArray(textArgs[0]) ? textArgs[0].join(' ') : String(textArgs[0] || '');
          if (value.indexOf('Comparativa oficial de costos PSA') >= 0) {
            labels.push(inst.internal.getCurrentPageInfo().pageNumber);
          }
          return origText(...textArgs);
        };
        inst.save = function(name) {
          window._pdfResult = {
            totalPages: inst.internal.getNumberOfPages(),
            comparisons,
            labels,
            name
          };
          return origSave(name);
        };
        return inst;
      };
    });

    await page.locator('#lpSheetPdf').click();
    await page.waitForFunction(() => !!window._pdfResult, { timeout: 30000 });
    const res = await page.evaluate(() => window._pdfResult);

    expect(res.totalPages).toBe(6);
    expect(res.comparisons).toHaveLength(5);
    expect(res.comparisons.map(x => x.page)).toEqual([2, 3, 4, 5, 6]);
    expect(res.comparisons.every(x => x.format === 'JPEG' && x.width > 100 && x.height > 70)).toBe(true);
    expect(res.labels).toEqual([2, 3, 4, 5, 6]);
  });
});
