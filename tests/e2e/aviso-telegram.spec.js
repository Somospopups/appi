const { test, expect } = require('@playwright/test');
const USER_ID = '11111111-1111-4111-8111-111111111111';
function tokenFor(sub) {
  const h = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${h}.${p}.firma`;
}

test.describe('Avisos por Telegram', () => {
  test('vincular chat, detectar el vínculo y desconectar', async ({ page }) => {
    // Mock del backend: appi_perfiles + la edge function telegram-canal.
    const mock = { estado: 'desconectado', bot: 'appi_avisos_bot' };
    const profile = { user_id: USER_ID, username: null, dip: '02-9802014', sucursal: '02', numero_distribuidor: '9802014', nombre: 'María Pérez', socio_nombre: null, rol: 'usuario', activo: true, debe_cambiar_password: false, membresia_meses: 1, membresia_inicio: new Date().toISOString(), membresia_vence: new Date(Date.now() + 30 * 86400000).toISOString() };
    await page.route('**/auth-config.js', r => r.fulfill({ contentType: 'application/javascript', body: "window.APPI_AUTH={enabled:true,url:'https://mock.supabase.co',anonKey:'anon-key-publica-de-prueba',distributorEmailDomain:'distribuidores.appi.invalid',adminLogin:{username:'popups',email:'admin-popups@appi.invalid'},loginAliases:{},offlineDays:7};" }));
    await page.route('https://mock.supabase.co/**', route => {
      const u = new URL(route.request().url());
      const c = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
      if (u.pathname === '/auth/v1/token') return route.fulfill({ status: 200, headers: c, body: JSON.stringify({ access_token: tokenFor(USER_ID), refresh_token: 'r', expires_in: 3600, user: { id: USER_ID } }) });
      if (u.pathname === '/rest/v1/appi_perfiles') return route.fulfill({ status: 200, headers: c, body: JSON.stringify([profile]) });
      if (u.pathname === '/functions/v1/dispositivo-puente') return route.fulfill({ status: 200, headers: c, body: JSON.stringify({ devices: [] }) });
      if (u.pathname === '/functions/v1/telegram-canal') {
        const accion = (route.request().postDataJSON() || {}).accion || 'estado';
        if (accion === 'estado') return route.fulfill({ status: 200, headers: c, body: JSON.stringify(mock) });
        if (accion === 'vincular') {
          Object.assign(mock, { estado: 'pendiente', codigo: 'ABCD1234', url: 'https://t.me/' + mock.bot + '?start=ABCD1234', vence: 15 });
          return route.fulfill({ status: 200, headers: c, body: JSON.stringify(mock) });
        }
        if (accion === 'desvincular') {
          Object.assign(mock, { estado: 'desconectado', codigo: undefined, url: undefined });
          return route.fulfill({ status: 200, headers: c, body: JSON.stringify(mock) });
        }
        return route.fulfill({ status: 200, headers: c, body: JSON.stringify({ error: 'Acción desconocida.' }) });
      }
      return route.fulfill({ status: 200, headers: c, body: '[]' });
    });
    await page.addInitScript(() => {
      localStorage.setItem('welcomeSeen', '1');
      localStorage.setItem('appi_tarjetas_auto', '0');
      localStorage.setItem('tutoVisto_v2', '1');
    });
    page.on('console', m => console.log('ZZCON', m.type(), m.text().slice(0,220)));
    page.on('pageerror', e => console.log('ZZPERR', String(e).slice(0,220)));
    page.on('framenavigated', f => console.log('ZZNAV', f.url().slice(0,120)));

    const errs = [];
    page.on('pageerror', e => errs.push('pageerror: ' + e.message));
    await page.goto('/index.html', { waitUntil: 'networkidle' });
    await page.locator('#distributorInput').fill('02-9802014');
    await page.locator('#distributorPassword').fill('Clave1234');
    await page.locator('#btnDistributorLogin').click();
    await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);

    // Entrada visible: el engranaje ⚙️ del Home abre el menú con el item.
    await page.locator('#view-home .tools-btn').click();
    await expect(page.locator('#toolsMenu')).toHaveClass(/open/);
    await expect(page.locator('#btnToolsTelegram')).toContainText('Avisos por Telegram');

    // Abrir el panel desde el engranaje, como lo haría el usuario.
    await page.locator('#btnToolsTelegram').click();
    await expect(page.locator('#avisoTgOv')).toBeVisible();
    await expect(page.locator('#avisoTgOv')).toContainText('Conectar Telegram');

    // Conectar → muestra el botón Abrir Telegram (JS) y el código de vínculo.
    await page.locator('#avisoTgOv .aviso-tg-btn.primary').click();
    await expect(page.locator('#avisoTgOv')).toContainText('ABCD1234');
    await expect(page.locator('#avisoTgOv .aviso-tg-cod')).toBeVisible();
    await expect(page.locator('#avisoTgOv img')).toHaveCount(0); // sin QR

    // El botón Abrir Telegram dispara el deep link nativo tg:// (abre la app
    // instalada) y, si la app no lo tomó, abre la web t.me en otra ventana.
    // La ventana de APPI nunca navega (no se reinicia).
    await page.evaluate(() => {
      window.__tgNav = [];
      window.__avisoTgNav = u => { window.__tgNav.push(u); };
      window.open = u => { (window.__tgOpen = window.__tgOpen || []).push(u); return { closed: false }; };
    });
    await page.locator('#avisoTgOv').getByRole('button', { name: 'Abrir Telegram' }).click();
    await page.waitForTimeout(1100); // deja correr el fallback de 700ms
    const nav = await page.evaluate(() => window.__tgNav || []);
    expect(nav).toEqual(['tg://resolve?domain=appi_avisos_bot&start=ABCD1234']);
    const abiertas = await page.evaluate(() => window.__tgOpen || []);
    expect(abiertas).toEqual(['https://t.me/appi_avisos_bot?start=ABCD1234']);
    // APPI sigue viva (no navegó, no se reinició).
    await expect(page.locator('#avisoTgOv')).toBeVisible();
    await expect(page.locator('#avisoTgOv')).toContainText('ABCD1234');
    // Respaldo visible: abrir en el navegador.
    const webLink = page.locator('#avisoTgOv a.aviso-tg-btn.ghost');
    await expect(webLink).toHaveAttribute('href', 'https://t.me/appi_avisos_bot?start=ABCD1234');

    // Simular que el usuario tocó «Iniciar» en Telegram: el canal pasa a
    // conectado y el panel lo detecta al verificar.
    Object.assign(mock, { estado: 'conectado', chat: '987654321', link: 'https://t.me/appi_avisos_bot' });
    await page.locator('#avisoTgOv').getByText('verificar').click();
    await expect(page.locator('#avisoTgOv')).toContainText('Chat vinculado');
    await expect(page.locator('#avisoTgOv')).toContainText('Desconectar este chat');

    // Desconectar → vuelve al estado inicial.
    await page.locator('#avisoTgOv').getByText('Desconectar este chat').click();
    await expect(page.locator('#avisoTgOv')).toContainText('Conectar Telegram');

    // Cerrar el panel.
    await page.locator('#avisoTgOv .aviso-tg-x').click();
    await expect(page.locator('#avisoTgOv')).toBeHidden();
    expect(errs).toEqual([]);
  });
});
