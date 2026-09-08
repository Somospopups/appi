const { test, expect } = require('@playwright/test');

/* Cumplimiento diario (v344): el panel administrador muestra cada cuenta con
   su marca de hoy (verde/naranja/rojo) y, al tocar la fila, el calendario
   mensual con el tono de cada día. */

test('el cumplimiento se pinta con filas, marca de hoy y calendario mensual', async ({ page }) => {
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

  // El Cumplimiento diario vive en la pestaña "Más": entrar y abrir la sección.
  await page.click('#adminTabs [data-admin-tab="mas"]');
  await page.waitForTimeout(400);
  await expect(page.locator('#adminPane-mas')).toBeVisible();
  await page.click('#adminAccionesToggle');
  await page.waitForTimeout(300);

  const hoyISO = new Date().toISOString().slice(0, 10);
  const filas = page.locator('.admin-cump-row');
  await expect(filas).toHaveCount(2);

  // Resumen del día sobre las dos cuentas (51+9 hechas, 1+5 sin hacer).
  await expect(page.locator('#adminAccionesResumen')).toContainText('2 cuentas · hoy ✓ 60 · ✗ 6');

  // La primera: Boulard con su marca de hoy en verde (51/52).
  const primera = filas.first();
  await expect(primera).toContainText('Boulard, Valeria');
  await expect(primera).toContainText('DIP 02-11000134');
  await expect(primera.locator('.admin-cump-ava')).toHaveText('BV');
  await expect(primera.locator(`.cump-dot[title="${hoyISO}"]`)).toHaveClass(/verde/);

  // La segunda es socio/a y hoy le faltaron marcas (9/14 = naranja).
  const segunda = filas.nth(1);
  await expect(segunda).toContainText('Toledo, Silvia');
  await expect(segunda.locator('.admin-cump-socio')).toHaveText('socio/a');
  await expect(segunda).toContainText('DIP 02-98020174');
  await expect(segunda.locator('.admin-cump-ava')).toHaveText('TS');
  await expect(segunda.locator(`.cump-dot[title="${hoyISO}"]`)).toHaveClass(/naranja/);

  // Tocar una fila abre el calendario mensual de esa cuenta, con el día de
  // hoy marcado en su color.
  await primera.click();
  await expect(page.locator('#adminCumpOverlay')).toBeVisible();
  const ficha = page.locator('#adminCumpFicha');
  await expect(ficha).toContainText('Boulard, Valeria');
  await expect(ficha).toContainText('DIP 02-11000134');
  await expect(ficha).toContainText('Actividad de');
  await expect(ficha.locator('.admin-cump-dia.hoy')).toHaveClass(/verde/);
  await expect(page.locator('#adminCumpClose')).toBeVisible();
  await page.locator('#adminCumpClose').click();
  await expect(page.locator('#adminCumpOverlay')).toBeHidden();
});
