import { test, expect } from '@playwright/test';

async function entrar(page) {
  await page.goto('/index.html');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
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

test.describe('Botón flotante en Mi Stock y Pendientes sobre el dock', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('MI STOCK: el botón flotante (+) reposa limpiamente sobre el dock en la parte inferior', async ({ page }) => {
    await entrar(page);
    await page.evaluate(() => window.openStock());
    await page.waitForTimeout(300);

    const metrics = await page.evaluate(() => {
      const foot = document.querySelector('.st-scan-foot');
      const footRect = foot.getBoundingClientRect().toJSON();
      const dock = document.getElementById('pageTabs');
      const dockRect = dock.getBoundingClientRect().toJSON();
      const card = document.querySelector('.st-card');
      const cardRect = card.getBoundingClientRect().toJSON();
      const stWrap = document.getElementById('stockCont');
      const wrapStyle = window.getComputedStyle(stWrap);
      const footStyle = window.getComputedStyle(foot);

      return {
        footRect,
        dockRect,
        cardRect,
        paddingBottom: wrapStyle.paddingBottom,
        position: footStyle.position,
        vh: window.innerHeight,
        vw: window.innerWidth
      };
    });

    // 1. Debe tener posición fija
    expect(metrics.position).toBe('fixed');

    // 2. El botón debe estar en la mitad inferior de la pantalla (y > 600 en viewport de 844)
    expect(metrics.footRect.top).toBeGreaterThan(600);
    expect(metrics.footRect.bottom).toBeLessThan(metrics.dockRect.top + 20);

    // 3. El botón debe reposar limpiamente SOBRE el dock (con una separación de ~10px)
    const gap = metrics.dockRect.top - metrics.footRect.bottom;
    expect(gap).toBeGreaterThanOrEqual(4);
    expect(gap).toBeLessThanOrEqual(20);

    // 4. Centrado horizontal
    const centerX = metrics.footRect.left + metrics.footRect.width / 2;
    expect(Math.abs(centerX - metrics.vw / 2)).toBeLessThan(5);

    // 5. No debe superponerse con la tarjeta "En casa" en la parte superior
    expect(metrics.footRect.top).toBeGreaterThan(metrics.cardRect.bottom);

    // 6. El contenedor tiene padding inferior suficiente para scroll sin tapar productos
    const pb = parseInt(metrics.paddingBottom, 10);
    expect(pb).toBeGreaterThanOrEqual(160);
  });

  test('PENDIENTES: el botón flotante (+) reposa limpiamente sobre el dock en la parte inferior', async ({ page }) => {
    await entrar(page);
    await page.evaluate(() => window.openStock());
    await page.waitForTimeout(200);

    // Cambiar a la pestaña "Pendientes"
    await page.locator('[data-st-tab="pendientes"]').click();
    await page.waitForTimeout(300);

    const metrics = await page.evaluate(() => {
      const foot = document.querySelector('.st-scan-foot');
      const footRect = foot.getBoundingClientRect().toJSON();
      const dock = document.getElementById('pageTabs');
      const dockRect = dock.getBoundingClientRect().toJSON();
      const card = document.querySelector('.st-card');
      const cardRect = card.getBoundingClientRect().toJSON();
      const footStyle = window.getComputedStyle(foot);

      return {
        footRect,
        dockRect,
        cardRect,
        position: footStyle.position,
        vh: window.innerHeight,
        vw: window.innerWidth
      };
    });

    // 1. Posición fija
    expect(metrics.position).toBe('fixed');

    // 2. En la parte inferior, no en el medio ni arriba
    expect(metrics.footRect.top).toBeGreaterThan(600);

    // 3. Sobre el dock con margen limpio
    const gap = metrics.dockRect.top - metrics.footRect.bottom;
    expect(gap).toBeGreaterThanOrEqual(4);
    expect(gap).toBeLessThanOrEqual(20);

    // 4. No se monta sobre la tarjeta de Pendientes
    expect(metrics.footRect.top).toBeGreaterThan(metrics.cardRect.bottom);
  });

  test('PENDIENTES: al expandir el FAB, las opciones (Escanear y Manual) quedan sobre el dock', async ({ page }) => {
    await entrar(page);
    await page.evaluate(() => window.openStock());
    await page.waitForTimeout(200);

    await page.locator('[data-st-tab="pendientes"]').click();
    await page.waitForTimeout(300);

    // Abrir FAB
    await page.locator('#stFabMainP').click();
    await page.waitForTimeout(500);

    const expMetrics = await page.evaluate(() => {
      const qrBtn = document.getElementById('stQrP');
      const manBtn = document.getElementById('stFabManualP');
      const dock = document.getElementById('pageTabs');
      const dockRect = dock.getBoundingClientRect().toJSON();
      const qrRect = qrBtn.getBoundingClientRect().toJSON();
      const manRect = manBtn.getBoundingClientRect().toJSON();

      return { qrRect, manRect, dockRect };
    });

    // Ambas opciones quedan por encima del dock
    expect(expMetrics.qrRect.bottom).toBeLessThan(expMetrics.dockRect.top);
    expect(expMetrics.manRect.bottom).toBeLessThan(expMetrics.dockRect.top);

    // Escanear a la izquierda, Manual a la derecha
    expect(expMetrics.qrRect.left).toBeLessThan(expMetrics.manRect.left);

    // Cerrar tocando de nuevo o el backdrop
    await page.locator('#stFabMainP').click();
    await page.waitForTimeout(400);
    const isExpanded = await page.evaluate(() => {
      return document.getElementById('stFabGroupP').classList.contains('expanded');
    });
    expect(isExpanded).toBe(false);
  });

  test('MI STOCK: con lista de productos, el contenido es limpio y legible con espacio para scrollear', async ({ page }) => {
    await entrar(page);
    await page.evaluate(() => {
      // Cargar varios productos para simular lista larga
      const uid = window.APPIAuth && window.APPIAuth.userId ? window.APPIAuth.userId() : 'local';
      const items = [
        { id: 'st_1', nombre: 'PSA Senior 4', color: 'Nero', serie: 'CAD10001', cant: 1 },
        { id: 'st_2', nombre: 'PSA Vero', color: 'Bianco', serie: 'CAD10002', cant: 1 },
        { id: 'st_3', nombre: 'PSA Quantum', color: '', serie: '', cant: 3 },
        { id: 'st_4', nombre: 'PSA Rincón', color: 'Grigio', serie: 'CAD10003', cant: 1 }
      ];
      localStorage.setItem('appi_stock_v1_' + uid, JSON.stringify(items));
      window.openStock();
    });
    await page.waitForTimeout(300);

    // Verificar que todas las filas son visibles y legibles
    const rows = page.locator('#stockCont .st-row');
    await expect(rows).toHaveCount(4);

    // El botón flotante no tapa el título ni la cabecera
    const headerRect = await page.locator('#view-stock header.top').boundingBox();
    const fabRect = await page.locator('.st-scan-foot').boundingBox();
    expect(fabRect.y).toBeGreaterThan(headerRect.y + headerRect.height);
  });

  test('ESCRITORIO: en pantalla grande no hay dock y las columnas se muestran prolijas', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await entrar(page);
    await page.evaluate(() => window.openStock());
    await page.waitForTimeout(300);

    const deskMetrics = await page.evaluate(() => {
      const dock = document.getElementById('pageTabs');
      const dockDisplay = dock ? window.getComputedStyle(dock).display : 'none';
      const feet = Array.from(document.querySelectorAll('.st-scan-foot')).map(f => {
        const s = window.getComputedStyle(f);
        return { position: s.position, bottom: s.bottom };
      });
      return { dockDisplay, feet };
    });

    expect(deskMetrics.dockDisplay).toBe('none');
    expect(deskMetrics.feet.length).toBeGreaterThanOrEqual(1);
    expect(deskMetrics.feet[0].position).toBe('sticky');
  });
});
