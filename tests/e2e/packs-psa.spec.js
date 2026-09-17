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
    await expect(fab.locator('i')).toHaveText('1');
    await expect(fab.locator('span')).toHaveText('$1.376.000');

    // Abrir el sheet del presupuesto haciendo click en el FAB
    await fab.click();
    const sheet = page.locator('#lpSheet');
    await expect(sheet).toHaveClass(/open/);

    // Verificar la línea en el presupuesto
    const sheetLine = page.locator('.lp-line[data-sku="PACK-BASICO"]');
    await expect(sheetLine).toBeVisible();
    await expect(sheetLine.locator('b')).toHaveText('PACK BÁSICO');
    await expect(sheetLine.locator('span')).toHaveText('$1.376.000');
  });
});
