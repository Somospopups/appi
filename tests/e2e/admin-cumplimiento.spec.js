const { test, expect } = require('@playwright/test');

/* Cumplimiento diario (v344): el panel administrador lo muestra como
   tarjetas con avatar, chips de hoy y barra de progreso semanal. */

test('el cumplimiento se pinta con tarjetas, chips y barra de progreso', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });

  await page.evaluate(() => {
    const hoy = new Date();
    const iso = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    // Supabase mockeado para que el panel cargue sin red.
    window.fetch = async (url, opts = {}) => {
      const u = String(url);
      const body = opts.body ? JSON.parse(opts.body) : {};
      let data = {};
      if (u.includes('/functions/v1/admin-distribuidores')) {
        if (body.action === 'list') data = { users: [] };
        else if (body.action === 'list_requests') data = { requests: [] };
        else if (body.action === 'get_settings') data = { whatsapp: '' };
      } else if (u.includes('/rest/v1/rpc/appi_admin_cumplimiento')) {
        data = [
          { cuenta: 'c1', persona: 'titular', dip: '02-11000134', nombre: 'Boulard, Valeria', fecha: iso, total: 52, hechas: 51, no_hechas: 1 },
          { cuenta: 'c2', persona: 'socio', dip: '02-98020174', nombre: 'Toledo, Silvia', fecha: iso, total: 14, hechas: 9, no_hechas: 5 }
        ];
      } else if (u.includes('/rest/v1/rpc/')) {
        data = [];
      } else if (u.includes('/rest/v1/appi_anuncios')) {
        data = [];
      }
      return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
    };
    window.APPIAuth = Object.assign({}, window.APPIAuth, {
      currentProfile: () => ({ rol: 'admin', user_id: 'admin-1', nombre: 'Admin' }),
      accessToken: () => 'fake-token'
    });
    document.body.classList.add('appi-admin');
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-admin').classList.add('active');
    document.getElementById('bootScreen').classList.add('gone');
    document.getElementById('lockScreen').classList.add('hidden');
  });

  await page.evaluate(() => window.APPIAdminPanel.open());
  await page.waitForTimeout(600);

  // Abrir la sección Cumplimiento diario.
  await page.click('#adminAccionesToggle');
  await page.waitForTimeout(300);

  const items = page.locator('.admin-cump-item');
  await expect(items).toHaveCount(2);

  const primera = items.first();
  await expect(primera).toContainText('Boulard, Valeria');
  await expect(primera).toContainText('DIP 02-11000134');
  // Avatar con iniciales.
  await expect(primera.locator('.admin-cump-ava')).toHaveText('BV');
  // Chips del día.
  await expect(primera.locator('.admin-cump-hoychips .ok')).toContainText('✓ 51');
  await expect(primera.locator('.admin-cump-hoychips .no')).toContainText('✗ 1');
  // Semana: barra y porcentaje.
  await expect(primera.locator('.admin-cump-bar i')).toBeVisible();
  await expect(primera.locator('.admin-cump-pct')).toHaveText('98%');
  await expect(primera.locator('.admin-cump-pct')).toHaveClass(/alta/);

  // Medallas del podio (v349): la primera es 🥇 con estrellas, la segunda 🥈.
  await expect(primera).toHaveClass(/top1/);
  await expect(primera.locator('.admin-cump-trofeo')).toHaveText('🥇');
  await expect(primera.locator('.admin-cump-stars')).toHaveText('★★★');

  // La segunda es socio/a y con porcentaje medio (9/14 = 64%).
  const segunda = items.nth(1);
  await expect(segunda).toContainText('Toledo, Silvia');
  await expect(segunda.locator('.admin-cump-socio')).toHaveText('socio/a');
  await expect(segunda.locator('.admin-cump-pct')).toHaveText('64%');
  await expect(segunda.locator('.admin-cump-pct')).toHaveClass(/media/);
  await expect(segunda).toHaveClass(/top2/);
  await expect(segunda.locator('.admin-cump-trofeo')).toHaveText('🥈');
  await expect(segunda.locator('.admin-cump-stars')).toHaveText('★');
});
