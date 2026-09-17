const { test, expect } = require('@playwright/test');

// v831 · El Panel de Contactos NUNCA queda en blanco: ni con contactos
// malformados (la causa de las pantallas blancas en iOS con datos reales),
// ni con un error de script (la barra roja lo hace visible).
const USER_ID = '11111111-1111-4111-8111-111111111111';

function tokenFor(sub) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${header}.${payload}.firma`;
}

function contactoSucio() {
  const now = new Date().toISOString();
  return [
    { id: 'ok1', estado: 'nuevo', nombre: 'Cliente Normal', telefono: '3515550000', tipo: 'contacto', metadata: {}, notas: '', created_at: now, updated_at: now, user_id: USER_ID },
    // estado inexistente, nombre número, teléfono nulo, fecha basura y notas enormes
    { id: 'b1', estado: 'estado-inexistente', nombre: 12345, telefono: null, tipo: 'weird', metadata: { a: 1 }, notas: 'x'.repeat(10000), created_at: 'no-es-fecha', updated_at: 1735689600000, proximo_contacto: '16:00', user_id: USER_ID },
    // nombre = objeto, teléfono = número, metadata gigantesco
    { id: 'b2', estado: 'seguimiento', nombre: { obj: true }, telefono: 987654321, tipo: 'encuestado', metadata: Array.from({ length: 2000 }, (_, k) => ({ k, v: 'y'.repeat(100) })), notas: '', created_at: now, proximo_contacto: '', user_id: USER_ID }
  ];
}

async function abrirPanelConBasura(page) {
  await page.route('**/auth-config.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: "window.APPI_AUTH={enabled:true,url:'https://mock.supabase.co',anonKey:'anon-key-publica-de-prueba-1234567890',adminLogin:{username:'popups',email:'admin-popups@appi.invalid'}};"
  }));
  await page.route('https://mock.supabase.co/**', route => {
    const url = new URL(route.request().url());
    const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
    if (url.pathname === '/auth/v1/token') {
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ access_token: tokenFor(USER_ID), refresh_token: 'r', expires_in: 3600, user: { id: USER_ID } }) });
    }
    if (url.pathname === '/rest/v1/appi_perfiles') {
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([{ user_id: USER_ID, username: null, dip: '02-9802014', sucursal: '02', numero_distribuidor: '9802014', nombre: 'María Pérez', rol: 'usuario', activo: true, debe_cambiar_password: false, membresia_meses: 1, membresia_inicio: new Date().toISOString(), membresia_vence: new Date(Date.now() + 30 * 86400000).toISOString() }]) });
    }
    if (url.pathname === '/functions/v1/dispositivo-puente') {
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ devices: [] }) });
    }
    if (url.pathname === '/rest/v1/appi_gestion_contactos') {
      // La nube devuelve los mismos contactos (sucios): si devolviera [],
      // la merge del fetch borraría la semilla local antes de medir nada.
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify(contactoSucio()) });
    }
    return route.fulfill({ status: 200, headers: cors, body: '[]' });
  });
  const contactos = contactoSucio();
  await page.addInitScript(([uid, contacts]) => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('appi_tarjetas_auto', '0');
    localStorage.setItem('turoVisto_v2', '1');
    localStorage.setItem('tutoVisto_v2', '1');
    localStorage.setItem('appi_notif_listo_v1', '1');
    localStorage.setItem(`appi_gestion_cache_v1_${uid}`, JSON.stringify({ contacts, surveys: [], activities: [], savedAt: Date.now() }));
  }, [USER_ID, contactos]);
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
  await expect(page.locator('#bootScreen')).toHaveCount(0, { timeout: 3500 });
}

test('el Panel no se rompe con contactos malformados (la causa de la pantalla blanca en iOS)', async ({ page }) => {
  const errores = [];
  page.on('pageerror', e => errores.push(e.message));

  await abrirPanelConBasura(page);
  await page.evaluate(() => window.openMiGestion());
  await expect(page.locator('#view-gestion')).toHaveClass(/active/);

  // El panel debe dibujar contenido real (nada de pantalla en blanco).
  const texto = await page.locator('#gestionContent').innerText();
  expect(texto.length).toBeGreaterThan(50);
  expect(texto).not.toContain('No pudimos dibujar');

  // En "Todos" las tarjetas sucias se ven igual (con sus datos mínimos).
  await page.locator('[data-gestion-view="todos"]').click();
  await expect(page.locator('#gestionContent .gestion-contact')).not.toHaveCount(0);
  for (const id of ['ok1', 'b1', 'b2']) {
    await expect(page.locator(`.gestion-contact[data-contact-id="${id}"]`)).toHaveCount(1);
  }

  // Abrir la ficha de la fila más sucia no rompe el panel.
  await page.locator('.gestion-contact[data-contact-id="b2"] [data-open-contact]').click();
  await expect(page.locator('#gestionDetailOverlay')).toBeVisible();
  await expect(page.locator('#gestionDrawer')).not.toBeEmpty();
  await page.locator('#gestionDetailClose').click();

  expect(errores).toEqual([]);
});

test('un error de script se vuelve visible (barra roja + anillo), nunca pantalla en blanco', async ({ page }) => {
  await page.route('**/auth-config.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: "window.APPI_AUTH={enabled:false};"
  }));
  await page.addInitScript(() => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('appi_tarjetas_auto', '0');
    localStorage.setItem('turoVisto_v2', '1');
    localStorage.setItem('tutoVisto_v2', '1');
    localStorage.setItem('appi_notif_listo_v1', '1');
  });
  await page.goto('/index.html', { waitUntil: 'networkidle' });

  await page.evaluate(() => {
    window.dispatchEvent(new ErrorEvent('error', { message: 'panico de prueba v831' }));
  });
  await expect(page.locator('#appiErrBar')).toBeVisible();
  await expect(page.locator('#appiErrBar')).toContainText('panico de prueba v831');
  const ring = await page.evaluate(() => localStorage.getItem('appi_err_v1'));
  expect(ring).toContain('panico de prueba v831');
});
