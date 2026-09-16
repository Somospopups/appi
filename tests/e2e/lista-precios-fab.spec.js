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

test.describe('Píldora de Lista de Precios sobre el dock', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('MOBILE: la píldora aparece fija sobre el dock al agregar productos y no se mueve al scrollear', async ({ page }) => {
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
    await page.waitForTimeout(300);

    await expect(fab).toBeVisible();

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

    // Debe estar visible sobre el dock (clearance positivo entre 5 y 25px)
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

    // La posición de la píldora NO debe cambiar al scrollear (debe permanecer fija)
    expect(Math.abs(mAfter.fTop - mBefore.fTop)).toBeLessThanOrEqual(1);
    expect(Math.abs(mAfter.fBottom - mBefore.fBottom)).toBeLessThanOrEqual(1);
    expect(mAfter.clearance).toBeGreaterThanOrEqual(8);
  });

  test('MOBILE: tocar la píldora fija abre correctamente el presupuesto (modal sheet)', async ({ page }) => {
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

    // Clic en la píldora
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

  test('DESKTOP: en pantalla ancha se posiciona en esquina inferior sin dock', async ({ page }) => {
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
        fRight: fRect.right,
        winWidth: window.innerWidth,
        winHeight: window.innerHeight,
        dockDisplay: window.getComputedStyle(dock).display
      };
    });

    expect(metrics.dockDisplay).toBe('none');
    expect(metrics.winHeight - metrics.fBottom).toBeLessThanOrEqual(36);
    expect(metrics.winWidth - metrics.fRight).toBeLessThanOrEqual(40);
  });
});
