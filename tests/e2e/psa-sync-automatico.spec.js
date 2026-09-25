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
                ['', '', ''],
                ['Línea Descendente'],
                [''],
                ['DIP Nro : 2-98020174 Nombre y Apellido : SILVIA DEL VALLE TOLEDO Socio : TEST SOCIO Sucursal : 2 - CORDOBA Categoría : 5 - Líder de Equipo Pionero País : Argentina'],
                [''],
                ['Período Consult'],
                ['', '', '', 'Nombre', 'Cat.', 'Teléfono', 'Estado', 'PB Mes Actual', '1°Mes Ant.', '2°Mes Ant.', '3°Mes Ant.', 'Alta', 'Cumpleaños', 'Correo electrónico'],
                ['', '(1)', '1', '[3515551001] GARCIA, MARTA', 'PLA', '3515551001', 'C', '30', '28', '25', '22', '01/02/2020', '20/03', 'marta@correo.com'],
                ['', '(2)', '2', '[3515551002] LOPEZ, CARLOS', 'EMP', '3515551002', 'C', '12', '15', '10', '8', '05/06/2021', '11/09', 'carlos@correo.com']
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
            garcia: garcia ? { ...garcia, garantias: garcia.garantias || null } : null,
            stored: JSON.parse(localStorage.getItem('usuarios_garantias') || '[]'),
            idx: JSON.parse(localStorage.getItem('appsi_psa_idx') || 'null'),
            lineaDias: JSON.parse(localStorage.getItem('appi_linea_v1') || 'null')
          });
        } });
      });
    });

    expect(res.success).toBe(true);
    expect(res.personas).toBe(2);
    expect(res.garcia).toEqual(expect.objectContaining({
      nivel: 1, codigo: '3515551001', nombre: 'GARCIA, MARTA', cat: 'PLA', tel: '3515551001', estado: 'C',
      pnAct: 30, m1: 28, m2: 25, m3: 22,
      email: 'marta@correo.com',
      garantias: { presentadas: 5, vencidas: 1, porcVencidas: 20, pendientes: 2 }
    }));
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

  test('el desglose semanal/diario muestra delta y acumulado por día', async ({ page }) => {
    await page.route('**/auth-config.js', route => route.fulfill({
      contentType: 'application/javascript',
      body: "window.APPI_AUTH={enabled:true,url:'https://mock.supabase.co',anonKey:'anon-key-publica-de-prueba',distributorEmailDomain:'distribuidores.appi.invalid',adminLogin:{username:'popups',email:'admin-popups@appi.invalid'},loginAliases:{},offlineDays:7};"
    }));

    await page.route('https://mock.supabase.co/**', route => {
      const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
      return route.fulfill({ status: 200, headers: cors, body: '[]' });
    });

    await page.addInitScript(() => {
      localStorage.setItem('welcomeSeen', '1');
      localStorage.setItem('appi_tarjetas_auto', '0');
      localStorage.setItem('tutoVisto_v2', '1');
      localStorage.removeItem('equipoData');
      localStorage.removeItem('usuarios_garantias');
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

    const res = await page.evaluate(() => {
      const y = new Date();
      const anio = y.getFullYear();
      const mes = String(y.getMonth() + 1).padStart(2, '0');
      const clave = d => anio + '-' + mes + '-' + String(d).padStart(2, '0');
      const hoy = y.getDate();
      const ayer = hoy === 1 ? 1 : hoy - 1;
      const store = {
        periodo: anio + '-' + mes,
        dias: {}
      };
      if (ayer !== hoy) {
        store.dias[clave(ayer)] = {
          total: 20,
          porD: { 'GARCIA, MARTA': 12, 'LOPEZ, CARLOS': 8 },
          cambios: [],
          esInicial: true,
          ultima: new Date().toISOString()
        };
      }
      store.dias[clave(hoy)] = {
        total: 28,
        porD: { 'GARCIA, MARTA': 17, 'LOPEZ, CARLOS': 11 },
        cambios: [
          { n: 'GARCIA, MARTA', pb: 5 },
          { n: 'LOPEZ, CARLOS', pb: 3 }
        ],
        ultima: new Date().toISOString()
      };
      localStorage.setItem('appi_linea_v1', JSON.stringify(store));
      window.abrirModalDetallePB();
      const modalBody = document.getElementById('modalBody');
      const texto = modalBody ? modalBody.innerText : '';
      return {
        texto,
        tieneAcumuladoHoy: /acum\. 28\.0/.test(texto),
        tieneDeltaHoy: /8\.0 PB/.test(texto)
      };
    });

    expect(res.tieneDeltaHoy).toBe(true);
    expect(res.tieneAcumuladoHoy).toBe(true);
  });

  test('un movimiento de PB detectado (como el que avisa el teléfono) queda en el registro diario del desglose', async ({ page }) => {
    await page.route('**/auth-config.js', route => route.fulfill({
      contentType: 'application/javascript',
      body: "window.APPI_AUTH={enabled:true,url:'https://mock.supabase.co',anonKey:'anon-key-publica-de-prueba',distributorEmailDomain:'distribuidores.appi.invalid',adminLogin:{username:'popups',email:'admin-popups@appi.invalid'},loginAliases:{},offlineDays:7};"
    }));

    await page.route('https://mock.supabase.co/**', route => {
      const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
      return route.fulfill({ status: 200, headers: cors, body: '[]' });
    });

    await page.addInitScript(() => {
      localStorage.setItem('welcomeSeen', '1');
      localStorage.setItem('appi_tarjetas_auto', '0');
      localStorage.setItem('tutoVisto_v2', '1');
      localStorage.removeItem('equipoData');
      localStorage.removeItem('usuarios_garantias');
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

    const res = await page.evaluate(() => {
      // Avisos APAGADOS: el registro diario igual tiene que quedar guardado.
      localStorage.setItem('appi_recordatorios_v1', JSON.stringify({ hab: { pb_mov: false } }));
      // Snapshot anterior del equipo (el detector avisa cuando alguien sube).
      localStorage.setItem('appi_pb_snapshot_distribuidores', JSON.stringify({ '01-1': 8.2 }));
      // Llega el equipo nuevo: JUAN GARCIA subió de 8,2 a 11,4 PB (+3,2).
      window.APPIRecordatorios.detectarMovimientosPB({
        personas: [{ codigo: '01-1', nombre: 'GARCIA, JUAN', pnAct: 11.4 }]
      });
      let claveDia = null;
      const movStore = JSON.parse(localStorage.getItem('appi_pb_mov_v1') || 'null');
      if (movStore && movStore.dias) {
        const claves = Object.keys(movStore.dias);
        if (claves.length) claveDia = claves[claves.length - 1];
      }
      const guardado = !!(claveDia && movStore.dias[claveDia].some(m => /GARCIA/.test(m.n) && Math.abs(m.pb - 3.2) < 0.01 && Math.abs(m.total - 11.4) < 0.01));
      const dayNum = claveDia ? parseInt(claveDia.slice(8, 10), 10) : 1;
      window.abrirModalDetallePB(0);
      const cuerpo = (document.getElementById('modalBody') || { innerText: '' }).innerText;
      const tieneTarjetaDia = new RegExp('3\\.2 PB').test(cuerpo);
      window.abrirDetalleDiaPB(dayNum, 0);
      const detalle = (document.getElementById('modalBody') || { innerText: '' }).innerText;
return {
        guardado,
        tieneTarjetaDia,
        detalleTieneNombre: /GARCIA/.test(detalle),
        detalleTieneDelta: /\+3\.2 PB/.test(detalle),
        detalleTieneTotal: /Total: 11\.4 PB/.test(detalle),
        detalleTieneAcum: /acum\. 11\.4/.test(detalle)
      };
    });

    expect(res.guardado).toBe(true);
    expect(res.tieneTarjetaDia).toBe(true);
    expect(res.detalleTieneNombre).toBe(true);
    expect(res.detalleTieneDelta).toBe(true);
    expect(res.detalleTieneTotal).toBe(true);
    expect(res.detalleTieneAcum).toBe(true);
  });

  test('hoy sin movimientos muestra "Todavía no hay movimientos de PB hoy" y no culpa al usuario', async ({ page }) => {
    await page.route('**/auth-config.js', route => route.fulfill({
      contentType: 'application/javascript',
      body: "window.APPI_AUTH={enabled:true,url:'https://mock.supabase.co',anonKey:'anon-key-publica-de-prueba',distributorEmailDomain:'distribuidores.appi.invalid',adminLogin:{username:'popups',email:'admin-popups@appi.invalid'},loginAliases:{},offlineDays:7};"
    }));

    await page.route('https://mock.supabase.co/**', route => {
      const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
      return route.fulfill({ status: 200, headers: cors, body: '[]' });
    });

    await page.addInitScript(() => {
      localStorage.setItem('welcomeSeen', '1');
      localStorage.setItem('appi_tarjetas_auto', '0');
      localStorage.setItem('tutoVisto_v2', '1');
      localStorage.removeItem('equipoData');
      localStorage.removeItem('usuarios_garantias');
      localStorage.removeItem('appi_linea_v1');
      localStorage.removeItem('appi_pb_mov_v1');
      localStorage.removeItem('appi_pb_snapshot_distribuidores');
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

    const res = await page.evaluate(() => {
      const hoy = new Date().getDate();
      window.abrirModalDetallePB(0);
      const cuerpo = (document.getElementById('modalBody') || { innerText: '' }).innerText;
      window.abrirDetalleDiaPB(hoy, 0);
      const detalle = (document.getElementById('modalBody') || { innerText: '' }).innerText;
      return {
        cuerpoTieneNeutral: /Todavía no hay movimientos de PB hoy/.test(cuerpo),
        cuerpoNoCulpa: !/No ingresaste este día/.test(cuerpo),
        detalleTieneNeutral: /Todavía no hay movimientos de PB hoy/.test(detalle),
        detalleNoCulpa: !/No ingresaste este día/.test(detalle)
      };
    });

    expect(res.cuerpoTieneNeutral).toBe(true);
    expect(res.cuerpoNoCulpa).toBe(true);
    expect(res.detalleTieneNeutral).toBe(true);
    expect(res.detalleNoCulpa).toBe(true);
  });

  test('volver a traer la línea el mismo día no borra los cambios del día', async ({ page }) => {
    await page.route('**/auth-config.js', route => route.fulfill({
      contentType: 'application/javascript',
      body: "window.APPI_AUTH={enabled:true,url:'https://mock.supabase.co',anonKey:'anon-key-publica-de-prueba',distributorEmailDomain:'distribuidores.appi.invalid',adminLogin:{username:'popups',email:'admin-popups@appi.invalid'},loginAliases:{},offlineDays:7};"
    }));

    await page.route('https://mock.supabase.co/**', route => {
      const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
      return route.fulfill({ status: 200, headers: cors, body: '[]' });
    });

    await page.addInitScript(() => {
      localStorage.setItem('welcomeSeen', '1');
      localStorage.setItem('appi_tarjetas_auto', '0');
      localStorage.setItem('tutoVisto_v2', '1');
      localStorage.removeItem('equipoData');
      localStorage.removeItem('usuarios_garantias');
      localStorage.removeItem('appi_linea_v1');
      localStorage.removeItem('appi_pb_mov_v1');
      localStorage.removeItem('appi_pb_snapshot_distribuidores');
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

    const res = await page.evaluate(() => {
      window.appiFechaBA = function(){ return '2026-03-15'; };
      window.appiPeriodoBA = function(){ return '2026-03'; };
      // Día anterior: GARCIA con 10 PB.
      localStorage.setItem('appi_linea_v1', JSON.stringify({
        periodo: '2026-03',
        dias: { '2026-03-14': { total: 10, porD: { 'GARCIA': 10 }, cambios: [], esInicial: true } }
      }));
      const leer = () => JSON.parse(localStorage.getItem('appi_linea_v1') || 'null').dias['2026-03-15'];
      // Primer traído del día: GARCIA 15 (+5).
      window.appiGuardarLinea([{ n: 'GARCIA', pb: 15 }]);
      const primer = leer();
      // Segundo traído del MISMO día: GARCIA 18 (+8 vs el 14). Antes se borraba.
      window.appiGuardarLinea([{ n: 'GARCIA', pb: 18 }]);
      const segundo = leer();
      return {
        primerCambios: (primer && Array.isArray(primer.cambios) ? primer.cambios : []).length,
        segundoCambios: (segundo && Array.isArray(segundo.cambios) ? segundo.cambios : []).length,
        segundoTotal: segundo && typeof segundo.total === 'number' ? segundo.total : -1,
        garcia8: !!(segundo && Array.isArray(segundo.cambios) && segundo.cambios.some(c => c.n === 'GARCIA' && Math.abs(c.pb - 8) < 0.01))
      };
    });

    expect(res.primerCambios).toBe(1);
    expect(res.segundoCambios).toBe(1);
    expect(res.garcia8).toBe(true);
    expect(res.segundoTotal).toBe(18);
  });

  test('la línea manda: un movimiento detectado no duplica el PB del día', async ({ page }) => {
    await page.route('**/auth-config.js', route => route.fulfill({
      contentType: 'application/javascript',
      body: "window.APPI_AUTH={enabled:true,url:'https://mock.supabase.co',anonKey:'anon-key-publica-de-prueba',distributorEmailDomain:'distribuidores.appi.invalid',adminLogin:{username:'popups',email:'admin-popups@appi.invalid'},loginAliases:{},offlineDays:7};"
    }));

    await page.route('https://mock.supabase.co/**', route => {
      const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
      return route.fulfill({ status: 200, headers: cors, body: '[]' });
    });

    await page.addInitScript(() => {
      localStorage.setItem('welcomeSeen', '1');
      localStorage.setItem('appi_tarjetas_auto', '0');
      localStorage.setItem('tutoVisto_v2', '1');
      localStorage.removeItem('equipoData');
      localStorage.removeItem('usuarios_garantias');
      localStorage.removeItem('appi_linea_v1');
      localStorage.removeItem('appi_pb_mov_v1');
      localStorage.removeItem('appi_pb_snapshot_distribuidores');
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

    const res = await page.evaluate(() => {
      localStorage.setItem('appi_recordatorios_v1', JSON.stringify({ hab: { pb_mov: false } }));
      localStorage.setItem('appi_pb_snapshot_distribuidores', JSON.stringify({ '01-1': 8.2 }));
      // La detección ve a GARCIA subir +3,2 (11,4 PB) → quedará en el registro.
      window.APPIRecordatorios.detectarMovimientosPB({
        personas: [
          { codigo: '01-1', nombre: 'GARCIA', pnAct: 11.4 },
          { codigo: '01-2', nombre: 'LOPEZ', pnAct: 20 }
        ]
      });
      const movStore = JSON.parse(localStorage.getItem('appi_pb_mov_v1') || 'null');
      const clave = Object.keys(movStore.dias)[0];
      const anio = clave.slice(0, 4), mes = clave.slice(5, 7);
      // La línea del día ya tiene a GARCIA con +5 (total día 40): manda ella.
      localStorage.setItem('appi_linea_v1', JSON.stringify({
        periodo: anio + '-' + mes,
        dias: {
          [clave]: {
            total: 40,
            porD: { 'GARCIA': 20, 'LOPEZ': 20 },
            cambios: [{ n: 'GARCIA', pb: 5 }],
            ultima: new Date().toISOString()
          }
        }
      }));
      const dayNum = parseInt(clave.slice(8, 10), 10);
      window.abrirModalDetallePB(0);
      const cuerpo = (document.getElementById('modalBody') || { innerText: '' }).innerText;
      window.abrirDetalleDiaPB(dayNum, 0);
      const detalle = (document.getElementById('modalBody') || { innerText: '' }).innerText;
      return {
        tarjetaLinea: /5\.0 PB/.test(cuerpo),
        noDoble: !/8\.2 PB/.test(cuerpo),
        filaLinea: /\+5\.0 PB/.test(detalle),
        unaSolaFila: (detalle.match(/\+5\.0 PB/g) || []).length === 1,
        sinTotalMov: !/Total: 11\.4 PB/.test(detalle),
        acumLinea: /acum\. 40\.0/.test(cuerpo)
      };
    });

    expect(res.tarjetaLinea).toBe(true);
    expect(res.noDoble).toBe(true);
    expect(res.filaLinea).toBe(true);
    expect(res.unaSolaFila).toBe(true);
    expect(res.sinTotalMov).toBe(true);
    expect(res.acumLinea).toBe(true);
  });
});
