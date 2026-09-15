import { test, expect } from '@playwright/test';

async function entrar(page, usuariosMock = []) {
  await page.goto('/index.html');
  await page.evaluate((users) => {
    localStorage.clear();
    sessionStorage.clear();
    const mockUser = {
      id: 'mock-user-pend',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'test@appi.local',
      user_metadata: { numero_distribuidor: '123456' },
      app_metadata: { provider: 'email' },
      created_at: new Date().toISOString()
    };
    const mockSession = {
      access_token: 'mock-token-pend',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-pend',
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
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('tutoVisto_v2', '1');
    sessionStorage.setItem('psaPopupYaMostrado', '1');

    if (users && users.length) {
      localStorage.setItem('usuarios_garantias', JSON.stringify(users));
    }
  }, usuariosMock);

  await page.reload();
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(() => {
    const lock = document.getElementById('lockScreen');
    if (lock) lock.classList.add('hidden');
    const boot = document.getElementById('bootScreen');
    if (boot) { boot.classList.add('gone'); boot.remove(); }
    document.body.classList.remove('appi-login-abierto');
  });
}

test.describe('Pendientes de canje: carga manual y sin botón Buscar en mis usuarios', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('la barra de búsqueda inline ya NO figura en la pantalla de Pendientes', async ({ page }) => {
    await entrar(page);
    await page.evaluate(() => window.openStock());
    await page.waitForTimeout(200);

    await page.locator('[data-st-tab="pendientes"]').click();
    await page.waitForTimeout(200);

    // La barra de búsqueda con el input #stPSerieBuscar y botón #stPBuscar NO debe estar en pantalla
    expect(await page.locator('#stPSerieBuscar').count()).toBe(0);
    expect(await page.locator('#stPBuscar').count()).toBe(0);

    // En su lugar, el FAB expandable está disponible sobre el dock
    await expect(page.locator('#stFabMainP')).toBeVisible();
  });

  test('el botón MANUAL del FAB pide la serie, busca en usuarios y autocompleta el popup sin el botón Buscar en mis usuarios', async ({ page }) => {
    const mockUsers = [
      {
        serie: 'IR5624',
        producto: 'PSA VERO',
        usuario: 'GÓMEZ, MARÍA',
        telf: '0351 455 2272',
        domicilio: 'Av. Colón 1234'
      }
    ];

    await entrar(page, mockUsers);
    await page.evaluate(() => window.openStock());
    await page.waitForTimeout(200);

    await page.locator('[data-st-tab="pendientes"]').click();
    await page.waitForTimeout(200);

    // Abrir FAB y presionar "Manual"
    await page.locator('#stFabMainP').click();
    await page.waitForTimeout(300);
    await page.locator('#stFabManualP').click();

    // Se abre el diálogo pidiendo el número de serie
    await expect(page.locator('#appiDialogInput')).toBeVisible();
    await page.locator('#appiDialogInput').fill('IR5624');
    await page.locator('#appiDialogOk').click();

    // Luego se abre el popup "Equipo canjeado"
    await expect(page.locator('#stSheet h3')).toHaveText('Equipo canjeado');
    await expect(page.locator('#stPSerie')).toHaveValue('IR5624');

    // Debe venir ya autocompletado con los datos de usuarios
    await expect(page.locator('#stPProducto')).toHaveValue('PSA Vero');
    await expect(page.locator('#stPQuien')).toHaveValue('GÓMEZ, MARÍA');
    await expect(page.locator('#stPTel')).toHaveValue('0351 455 2272');

    // El botón "Buscar en mis usuarios" NO debe existir
    expect(await page.locator('#stPMisUsuarios').count()).toBe(0);

    // Guardar pendiente
    await page.locator('#stSaveP').click();
    await page.waitForTimeout(200);

    // La fila queda guardada en Pendientes
    const fila = page.locator('#stockCont .st-row');
    await expect(fila).toHaveCount(1);
    await expect(fila).toContainText('PSA Vero');
    await expect(fila).toContainText('De: GÓMEZ, MARÍA');
    await expect(fila).toContainText('Serie IR5624');
  });

  test('si se tipea o modifica la serie en la ficha, autocompleta desde usuarios locales', async ({ page }) => {
    const mockUsers = [
      {
        serie: 'SEN9988',
        producto: 'PSA Senior 4',
        usuario: 'LÓPEZ, CARLOS',
        telf: '0351 987 6543'
      }
    ];

    await entrar(page, mockUsers);
    await page.evaluate(() => window.openStock());
    await page.waitForTimeout(200);

    await page.locator('[data-st-tab="pendientes"]').click();
    await page.waitForTimeout(200);

    // Abrir MANUAL sin poner serie en el prompt (o abriendo directo)
    await page.locator('#stFabMainP').click();
    await page.waitForTimeout(300);
    await page.locator('#stFabManualP').click();

    await expect(page.locator('#appiDialogInput')).toBeVisible();
    // Dejar vacío y aceptar abre la ficha en blanco
    await page.locator('#appiDialogOk').click();

    await expect(page.locator('#stSheet h3')).toHaveText('Equipo canjeado');
    expect(await page.locator('#stPMisUsuarios').count()).toBe(0);

    // Tipear la serie directamente en la ficha
    await page.locator('#stPSerie').fill('SEN9988');
    await page.locator('#stPSerie').dispatchEvent('change');
    await page.waitForTimeout(100);

    // Autocompleta automáticamente
    await expect(page.locator('#stPProducto')).toHaveValue('PSA Senior 4');
    await expect(page.locator('#stPQuien')).toHaveValue('LÓPEZ, CARLOS');
    await expect(page.locator('#stPTel')).toHaveValue('0351 987 6543');
  });

  test('el botón flotante incluye el tercer botón COMPARTIR en la parte superior con ícono de listado y abre WhatsApp detallado', async ({ page }) => {
    const mockUsers = [
      {
        serie: 'IR5624',
        producto: 'PSA VERO',
        usuario: 'GÓMEZ, MARÍA',
        telf: '0351 455 2272',
        domicilio: 'Av. Colón 1234'
      }
    ];

    await entrar(page, mockUsers);
    await page.evaluate(() => {
      const uid = (window.APPIAuth && window.APPIAuth.userId) ? window.APPIAuth.userId() : 'local';
      const data = [
        {
          serie: 'IR5624',
          producto: 'PSA Vero',
          quien: 'GÓMEZ, MARÍA',
          telefono: '0351 455 2272',
          domicilio: 'Av. Colón 1234',
          fecha: '2026-09-15'
        },
        {
          serie: 'SE8811',
          producto: 'PSA Senior 4',
          quien: 'PÉREZ, JUAN',
          telefono: '0351 111 2233',
          domicilio: '',
          fecha: '2026-09-10'
        }
      ];
      localStorage.setItem('appi_pendientes_v1_' + uid, JSON.stringify(data));
      localStorage.setItem('appi_pendientes_v1_local', JSON.stringify(data));
    });

    await page.evaluate(() => window.openStock());
    await page.waitForTimeout(200);

    await page.locator('[data-st-tab="pendientes"]').click();
    await page.waitForTimeout(200);

    // El botón #stFabShareP existe y tiene el label Compartir y el SVG de hoja/listado
    const shareBtn = page.locator('#stFabShareP');
    await expect(shareBtn).toBeAttached();
    await expect(shareBtn.locator('.st-fab-lbl')).toHaveText('Compartir');
    await expect(shareBtn.locator('svg line')).toHaveCount(3); // Las líneas del listado en el SVG

    // Abrir el FAB
    const mainBtn = page.locator('#stFabMainP');
    await mainBtn.click();
    await page.waitForTimeout(300);

    // Verificar que el grupo está expandido y el botón Compartir está arriba del botón central
    const grp = page.locator('#stFabGroupP');
    await expect(grp).toHaveClass(/expanded/);

    const shareBox = await shareBtn.boundingBox();
    const mainBox = await mainBtn.boundingBox();
    expect(shareBox).not.toBeNull();
    expect(mainBox).not.toBeNull();

    // shareBox está arriba del botón central (y menor) y centrado horizontalmente
    expect(shareBox.y).toBeLessThan(mainBox.y);
    const shareCenterX = shareBox.x + shareBox.width / 2;
    const mainCenterX = mainBox.x + mainBox.width / 2;
    expect(Math.abs(shareCenterX - mainCenterX)).toBeLessThan(15);

    // Mock de WhatsApp para interceptar el mensaje compartido
    await page.evaluate(() => {
      window._waOpenedUrl = null;
      if (!window.APPIWhatsApp) window.APPIWhatsApp = {};
      window.APPIWhatsApp.abrir = (url) => { window._waOpenedUrl = url; };
      window.open = (url) => { window._waOpenedUrl = url; };
    });

    // Clic en Compartir
    await shareBtn.click();
    await page.waitForTimeout(100);

    // FAB se cierra tras clic
    await expect(grp).not.toHaveClass(/expanded/);

    // Verificar la URL y el texto detallado para WhatsApp
    const openedUrl = await page.evaluate(() => window._waOpenedUrl);
    expect(openedUrl).not.toBeNull();
    expect(openedUrl).toContain('https://wa.me/?text=');

    const decoded = decodeURIComponent(openedUrl);
    expect(decoded).toContain('EQUIPOS CANJEADOS PENDIENTES DE ENTREGA');
    expect(decoded).toContain('2 equipos');
    expect(decoded).toContain('PSA Vero');
    expect(decoded).toContain('IR5624');
    expect(decoded).toContain('GÓMEZ, MARÍA');
    expect(decoded).toContain('0351 455 2272');
    expect(decoded).toContain('Av. Colón 1234');
    expect(decoded).toContain('PSA Senior 4');
    expect(decoded).toContain('SE8811');
    expect(decoded).toContain('PÉREZ, JUAN');
  });

  test('si no hay pendientes y se toca COMPARTIR, avisa que no hay equipos para compartir', async ({ page }) => {
    await entrar(page);
    await page.evaluate(() => {
      const uid = (window.APPIAuth && window.APPIAuth.userId) ? window.APPIAuth.userId() : 'local';
      localStorage.removeItem('appi_pendientes_v1_' + uid);
      localStorage.removeItem('appi_pendientes_v1_local');
    });

    await page.evaluate(() => window.openStock());
    await page.waitForTimeout(200);

    await page.locator('[data-st-tab="pendientes"]').click();
    await page.waitForTimeout(200);

    const mainBtn = page.locator('#stFabMainP');
    await mainBtn.click();
    await page.waitForTimeout(200);

    const shareBtn = page.locator('#stFabShareP');
    await shareBtn.click();

    // Diálogo de aviso
    await expect(page.locator('#appiDialogTitle')).toHaveText('Sin pendientes');
    await expect(page.locator('#appiDialogMessage')).toContainText('No tenés equipos pendientes de canje para compartir');
  });
});
