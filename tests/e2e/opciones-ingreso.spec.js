import { test, expect } from '@playwright/test';

async function entrar(page) {
  await page.goto('/index.html');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('appi_notif_listo_v1', '1');
    localStorage.setItem('appi_notif_popup_later', String(Date.now() + 400 * 24 * 3600 * 1000));
    const mockUser = {
      id: 'mock-user-ingreso',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'test@appi.local',
      user_metadata: { numero_distribuidor: '123456' },
      app_metadata: { provider: 'email' },
      created_at: new Date().toISOString()
    };
    const mockSession = {
      access_token: 'mock-token-ingreso',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-ingreso',
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

test('la lista de precios muestra Opciones de ingreso con foto y precio oficial', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => {
    if (typeof openLista === 'function') openLista();
  });
  await page.waitForSelector('.lp-item', { timeout: 15000 });

  const chip = page.locator('#lpChips [data-g="ingreso"]');
  await expect(chip).toBeVisible();
  await expect(chip).toHaveText('Opciones de ingreso');
  await chip.click();

  await expect(page.locator('.lp-item')).toHaveCount(25);
  await expect(page.locator('#lpList')).toContainText('KIT DE ACCESO C/MINI BIANCO');
  await expect(page.locator('#lpList')).toContainText('KIT DE ACCESO C/PORTATIL');
  await expect(page.locator('#lpList')).toContainText('9.90 PB');
  await expect(page.locator('#lpList')).toContainText('3.30 PB');
  await expect(page.locator('#lpList')).toContainText('Senior4 Nero');
  await expect(page.locator('#lpList')).toContainText('Kit de Acceso Mini');
  await expect(page.locator('#lpList')).toContainText('Kit de Acceso Portátil');
  await expect(page.locator('#lpList')).toContainText('$2.440.570');
  await expect(page.locator('#lpList')).toContainText('$1.216.050');

  const img = page.locator('.lp-item .lp-item-foto').first();
  await expect(img).toBeVisible();
  await expect(img).toHaveAttribute('src', /catalogo-img\/ingreso\//);
  await expect(async () => {
    const w = await img.evaluate(el => el.naturalWidth);
    expect(w).toBeGreaterThan(0);
  }).toPass({ timeout: 10000 });

  await img.click();
  await expect(page.locator('#lpFotoModal.open')).toBeVisible();
  await expect(page.locator('#lpFotoModalTit')).toContainText('KIT DE ACCESO');
});
