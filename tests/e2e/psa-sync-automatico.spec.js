const { test, expect } = require('@playwright/test');

const USER_ID = '11111111-1111-4111-8111-111111111111';

function tokenFor(sub) {
  const h = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${h}.${p}.firma`;
}

test.describe('Sincronización automática de MI PSA y tareas garantizadas', () => {

  test('sincronizarGarantiasPSA descarga garantías desde la edge function y puebla usuarios_garantias', async ({ page }) => {
    const accessToken = tokenFor(USER_ID);
    let edgeFunctionCalled = false;

    await page.route('**/auth-config.js', route => route.fulfill({
      contentType: 'application/javascript',
      body: "window.APPI_AUTH={enabled:true,url:'https://mock.supabase.co',anonKey:'anon-key-publica-de-prueba',distributorEmailDomain:'distribuidores.appi.invalid',adminLogin:{username:'popups',email:'admin-popups@appi.invalid'},loginAliases:{},offlineDays:7};"
    }));

    await page.route('https://mock.supabase.co/**', route => {
      const url = new URL(route.request().url());
      const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
      if (url.pathname === '/auth/v1/token') {
        return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ access_token: accessToken, refresh_token: 'r', expires_in: 3600, user: { id: USER_ID } }) });
      }
      if (url.pathname === '/functions/v1/consulta-serial') {
        const body = route.request().postDataJSON() || {};
        if (body.action === 'report') {
          edgeFunctionCalled = true;
          return route.fulfill({
            status: 200,
            headers: cors,
            body: JSON.stringify({
              ok: true,
              total: 2,
              filas: [
                {
                  s: 'HTA69440',
                  u: 'ALONSO, ARTURO ALONSO',
                  t: '0351-4552272',
                  d: 'ANDALUCIA 1936',
                  c: 'X5014',
                  l: 'BARRIO COLON',
                  p: 'PSA VERO',
                  c2: '17/04/2022',
                  v: '17/10/2025'
                },
                {
                  s: 'HTA69441',
                  u: 'GARCIA, MARTA ELENA',
                  t: '3515551001',
                  d: 'COLON 1200',
                  c: '5000',
                  l: 'CENTRO',
                  p: 'PSA SENIOR',
                  c2: '10/01/2023',
                  v: '10/01/2026'
                }
              ]
            })
          });
        }
      }
      return route.fulfill({ status: 200, headers: cors, body: '[]' });
    });

    await page.addInitScript(() => {
      localStorage.setItem('welcomeSeen', '1');
      localStorage.setItem('appi_tarjetas_auto', '0');
      localStorage.setItem('tutoVisto_v2', '1');
      // Credenciales de prueba
      localStorage.setItem('appsi_psa_creds', JSON.stringify({
        center: '02',
        number: '9802014',
        password: 'clave-secreta',
        remember: true
      }));
      // Garantías inicialmente vacías
      localStorage.removeItem('usuarios_garantias');
    });

    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      const lock = document.getElementById('lockScreen');
      if (lock) lock.classList.add('hidden');
      const boot = document.getElementById('bootScreen');
      if (boot) { boot.classList.add('gone'); boot.remove(); }
      document.body.classList.remove('appi-login-abierto');
      window.showView('view-usuarios');
    });

    // Ejecutar sincronizarGarantiasPSA
    const res = await page.evaluate(async () => {
      return new Promise(resolve => {
        window.sincronizarGarantiasPSA(success => {
          resolve({
            success,
            count: (window.usuariosU || []).length,
            stored: JSON.parse(localStorage.getItem('usuarios_garantias') || '[]')
          });
        });
      });
    });

    expect(edgeFunctionCalled).toBe(true);
    expect(res.success).toBe(true);
    expect(res.count).toBe(2);
    expect(res.stored.length).toBe(2);
    expect(res.stored[0].serie).toBe('HTA69440');
    expect(res.stored[0].usuario).toBe('ALONSO, ARTURO ALONSO');

    // Verificar que el dashboard se muestra y el upload card se oculta
    await expect(page.locator('#usuariosDashboard')).toBeVisible();
    await expect(page.locator('#usuariosStTotal')).toContainText('2');
  });

  test('sincronizarTodoPSA baja los 3 archivos en una sola llamada sync y los aplica', async ({ page }) => {
    const accessToken = tokenFor(USER_ID);
    let syncBody = null;

    await page.route('**/auth-config.js', route => route.fulfill({
      contentType: 'application/javascript',
      body: "window.APPI_AUTH={enabled:true,url:'https://mock.supabase.co',anonKey:'anon-key-publica-de-prueba',distributorEmailDomain:'distribuidores.appi.invalid',adminLogin:{username:'popups',email:'admin-popups@appi.invalid'},loginAliases:{},offlineDays:7};"
    }));

    await page.route('https://mock.supabase.co/**', route => {
      const url = new URL(route.request().url());
      const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
      if (url.pathname === '/auth/v1/token') {
        return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ access_token: accessToken, refresh_token: 'r', expires_in: 3600, user: { id: USER_ID } }) });
      }
      if (url.pathname === '/functions/v1/consulta-serial') {
        syncBody = route.request().postDataJSON() || {};
        return route.fulfill({
          status: 200,
          headers: cors,
          body: JSON.stringify({
            ok: true,
            periodo: '2026-09',
            idx: { linea: '100', garantiasOrg: '101', garantias: '88' },
            errores: [],
            menu: {},
            linea: {
              filas: [
                ['Nivel', 'Nombre y Apellido', 'Cat.', 'Tel.', 'Estado', 'PB Mes', '1°Mes', '2°Mes', '3°Mes', 'Alta', 'Cumple'],
                ['1', '[3515551001] GARCIA, MARTA', 'PLA', '3515551001', 'Activo', '30', '28', '25', '22', '01/02/2020', '20/03'],
                ['2', '[3515551002] LOPEZ, CARLOS', 'EMP', '3515551002', 'Activo', '12', '15', '10', '8', '05/06/2021', '11/09']
              ],
              par: [
                { n: 'GARCIA, MARTA', pb: 30 },
                { n: 'LOPEZ, CARLOS', pb: 12 }
              ],
              pb: 42
            },
            garantiasOrg: {
              filas: [
                ['Nombre', 'Dip', 'Presentadas', 'Vencidas', '% Vencidas', 'Pendientes'],
                ['GARCIA, MARTA', '3515551001', '5', '1', '20', '2'],
                ['LOPEZ, CARLOS', '3515551002', '3', '0', '0', '1']
              ]
            },
            garantias: {
              filas: [
                { s: 'HTA69440', u: 'ALONSO, ARTURO ALONSO', t: '0351-4552272', d: 'ANDALUCIA 1936', c: 'X5014', l: 'BARRIO COLON', p: 'PSA VERO', c2: '17/04/2022', v: '17/10/2025', e: '', cn: '' },
                { s: 'HTA69441', u: 'GARCIA, MARTA ELENA', t: '3515551001', d: 'COLON 1200', c: '5000', l: 'CENTRO', p: 'PSA SENIOR', c2: '10/01/2023', v: '10/01/2026', e: 'marta@correo.com', cn: '20/03' }
              ]
            }
          })
        });
      }
      return route.fulfill({ status: 200, headers: cors, body: '[]' });
    });

    await page.addInitScript(() => {
      localStorage.setItem('welcomeSeen', '1');
      localStorage.setItem('appi_tarjetas_auto', '0');
      localStorage.setItem('tutoVisto_v2', '1');
      localStorage.setItem('appsi_psa_creds', JSON.stringify({
        center: '02',
        number: '9802014',
        password: 'clave-secreta',
        remember: false
      }));
      localStorage.removeItem('usuarios_garantias');
      localStorage.removeItem('equipoData');
      localStorage.removeItem('appsi_psa_idx');
      localStorage.removeItem('appi_linea_v1');
    });

    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      const lock = document.getElementById('lockScreen');
      if (lock) lock.classList.add('hidden');
      const boot = document.getElementById('bootScreen');
      if (boot) { boot.classList.add('gone'); boot.remove(); }
      document.body.classList.remove('appi-login-abierto');
      window.showView('view-equipo');
    });

    const res = await page.evaluate(async () => {
      return new Promise(resolve => {
        window.sincronizarTodoPSA(null, { done: (success, info) => {
          const eq = JSON.parse(localStorage.getItem('equipoData') || 'null');
          const garcia = eq && eq.personas.find(p => p.codigo === '3515551001');
          resolve({
            success,
            info,
            accion: (localStorage.getItem('appi_last_sync') || '') ,
            personas: eq ? eq.personas.length : 0,
            garcia: garcia ? garcia.garantias || null : null,
            stored: JSON.parse(localStorage.getItem('usuarios_garantias') || '[]'),
            idx: JSON.parse(localStorage.getItem('appsi_psa_idx') || 'null'),
            lineaDias: JSON.parse(localStorage.getItem('appi_linea_v1') || 'null')
          });
        } });
      });
    });

    expect(syncBody).not.toBeNull();
    expect(syncBody.action).toBe('sync');
    expect(syncBody.datasets).toEqual(['linea', 'garantiasOrg', 'garantias']);
    expect(res.success).toBe(true);
    expect(res.personas).toBe(2);
    expect(res.garcia).toEqual({ presentadas: 5, vencidas: 1, porcVencidas: 20, pendientes: 2 });
    expect(res.stored.length).toBe(2);
    expect(res.stored[0].serie).toBe('HTA69440');
    expect(res.stored[1].email).toBe('marta@correo.com');
    expect(res.idx).toEqual({ linea: '100', garantiasOrg: '101', garantias: '88' });
    expect(res.lineaDias && res.lineaDias.dias).toBeTruthy();
  });

  test('sin garantías se pide conectar MI PSA y no hay zona para subir Excel', async ({ page }) => {
    await page.route('**/auth-config.js', route => route.fulfill({
      contentType: 'application/javascript',
      body: "window.APPI_AUTH={enabled:true,url:'https://mock.supabase.co',anonKey:'anon-key-publica-de-prueba',distributorEmailDomain:'distribuidores.appi.invalid',adminLogin:{username:'popups',email:'admin-popups@appi.invalid'},loginAliases:{},offlineDays:7};"
    }));

    await page.addInitScript(() => {
      localStorage.setItem('welcomeSeen', '1');
      localStorage.setItem('appi_tarjetas_auto', '0');
      localStorage.setItem('tutoVisto_v2', '1');
      localStorage.removeItem('usuarios_garantias');
    });

    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      const lock = document.getElementById('lockScreen');
      if (lock) lock.classList.add('hidden');
      const boot = document.getElementById('bootScreen');
      if (boot) { boot.classList.add('gone'); boot.remove(); }
      document.body.classList.remove('appi-login-abierto');
      window.showView('view-usuarios');
    });

    const uploadCard = page.locator('#usuariosUploadCard');
    await expect(uploadCard).toBeVisible();
    await expect(uploadCard).toContainText('Garantías y Usuarios');
    await expect(uploadCard).toContainText('conectar tu cuenta');
    await expect(uploadCard.locator('#btnSyncPSAAuto')).toBeVisible();
    await expect(page.locator('#usuariosDropZone')).toHaveCount(0);
    await expect(uploadCard).not.toContainText('Excel');
    await expect(uploadCard).not.toContainText('Elegir archivo');
  });

  test('el botón ↻ en usuariosMetaBar dispara la sincronización automática de PSA', async ({ page }) => {
    let syncCallCount = 0;

    await page.route('**/auth-config.js', route => route.fulfill({
      contentType: 'application/javascript',
      body: "window.APPI_AUTH={enabled:true,url:'https://mock.supabase.co',anonKey:'anon-key-publica-de-prueba',distributorEmailDomain:'distribuidores.appi.invalid',adminLogin:{username:'popups',email:'admin-popups@appi.invalid'},loginAliases:{},offlineDays:7};"
    }));

    await page.route('https://mock.supabase.co/**', route => {
      const url = new URL(route.request().url());
      const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
      if (url.pathname === '/functions/v1/consulta-serial') {
        syncCallCount++;
        return route.fulfill({
          status: 200,
          headers: cors,
          body: JSON.stringify({
            ok: true,
            total: 1,
            filas: [{
              s: 'PSA999',
              u: 'LOPEZ, CARLOS',
              t: '3515559999',
              d: 'SAN MARTIN 100',
              c: '5000',
              l: 'CENTRO',
              p: 'PSA VERO',
              c2: '01/01/2023',
              v: '01/01/2026'
            }]
          })
        });
      }
      return route.fulfill({ status: 200, headers: cors, body: '[]' });
    });

    await page.addInitScript(() => {
      localStorage.setItem('welcomeSeen', '1');
      localStorage.setItem('appi_tarjetas_auto', '0');
      localStorage.setItem('tutoVisto_v2', '1');
      localStorage.setItem('appsi_psa_creds', JSON.stringify({
        center: '02',
        number: '9802014',
        password: 'clave-secreta',
        remember: true
      }));
      localStorage.setItem('lastUpdate_garantias', Date.now().toString());
    });

    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      const lock = document.getElementById('lockScreen');
      if (lock) lock.classList.add('hidden');
      const boot = document.getElementById('bootScreen');
      if (boot) { boot.classList.add('gone'); boot.remove(); }
      document.body.classList.remove('appi-login-abierto');
      window.showView('view-usuarios');
    });

    const btnActualizar = page.locator('#btnUsuariosActualizar');
    await expect(btnActualizar).toBeVisible();
    const prevCalls = syncCallCount;
    await btnActualizar.click();

    // Esperar a que la sincronización termine y haya incrementado la llamada
    await expect.poll(() => syncCallCount).toBeGreaterThan(prevCalls);
  });
});
