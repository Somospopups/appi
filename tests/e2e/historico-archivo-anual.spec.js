const { test, expect } = require('@playwright/test');

const USER_ID = '11111111-1111-4111-8111-111111111111';
const TITULAR = { dip: '02-9802014', nombre: 'María Pérez', categoria: 'L' };

function tokenFor(sub) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${header}.${payload}.firma`;
}

async function abrirApp(page, options = {}) {
  const cloudRows = new Map();
  const storage = new Map();
  const deletedRows = [];
  const deletedFiles = [];
  const now = new Date().toISOString();
  const profile = {
    user_id: USER_ID, username: null, dip: '02-9802014', sucursal: '02', numero_distribuidor: '9802014',
    nombre: 'María Pérez', socio_nombre: null, rol: 'usuario', activo: true, debe_cambiar_password: false,
    membresia_meses: 1, membresia_inicio: now, membresia_vence: new Date(Date.now() + 30 * 86400000).toISOString()
  };

  await page.route('**/auth-config.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: "window.APPI_AUTH={enabled:true,url:'https://mock.supabase.co',anonKey:'anon-key-publica-de-prueba-1234567890',distributorEmailDomain:'distribuidores.appi.invalid',adminLogin:{username:'popups',email:'admin-popups@appi.invalid'},loginAliases:{},offlineDays:7};"
  }));
  await page.route('https://mock.supabase.co/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const jsonHeaders = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };

    if (url.pathname === '/auth/v1/token') {
      return route.fulfill({ status: 200, headers: jsonHeaders, body: JSON.stringify({ access_token: tokenFor(USER_ID), refresh_token: 'r', expires_in: 3600, user: { id: USER_ID } }) });
    }
    if (url.pathname === '/rest/v1/appi_perfiles') {
      return route.fulfill({ status: 200, headers: jsonHeaders, body: JSON.stringify([profile]) });
    }
    if (url.pathname === '/rest/v1/historico_periodos' && method === 'GET') {
      return route.fulfill({ status: 200, headers: jsonHeaders, body: JSON.stringify([...cloudRows.values()]) });
    }
    if (url.pathname === '/rest/v1/historico_periodos' && method === 'POST') {
      for (const item of JSON.parse(request.postData() || '[]')) {
        cloudRows.set(item.period_id, { period_id: item.period_id, data: item.data, updated_at: item.updated_at });
      }
      return route.fulfill({ status: 201, headers: jsonHeaders, body: '' });
    }
    if (url.pathname === '/rest/v1/historico_periodos' && method === 'DELETE') {
      const filter = decodeURIComponent(url.searchParams.get('period_id') || '');
      const id = filter.replace(/^eq\./, '');
      deletedRows.push(id);
      cloudRows.delete(id);
      return route.fulfill({ status: 204, headers: jsonHeaders, body: '' });
    }

    const uploadPrefix = '/storage/v1/object/historico-files/';
    const downloadPrefix = '/storage/v1/object/authenticated/historico-files/';
    if (url.pathname.startsWith(uploadPrefix) && method === 'POST') {
      const path = decodeURIComponent(url.pathname.slice(uploadPrefix.length));
      storage.set(path, request.postDataBuffer() || Buffer.alloc(0));
      return route.fulfill({ status: 200, headers: jsonHeaders, body: JSON.stringify({ Key: path }) });
    }
    if (url.pathname.startsWith(downloadPrefix) && method === 'GET') {
      const path = decodeURIComponent(url.pathname.slice(downloadPrefix.length));
      if (options.failArchiveVerification && path.includes('/archives/')) {
        return route.fulfill({ status: 500, headers: jsonHeaders, body: JSON.stringify({ message: 'verificación simulada fallida' }) });
      }
      const body = storage.get(path);
      if (!body) return route.fulfill({ status: 404, headers: jsonHeaders, body: JSON.stringify({ message: 'not found' }) });
      return route.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*', 'content-type': 'application/pdf' }, body });
    }
    if (url.pathname === '/storage/v1/object/historico-files' && method === 'DELETE') {
      const body = JSON.parse(request.postData() || '{}');
      for (const path of body.prefixes || []) {
        deletedFiles.push(path);
        storage.delete(path);
      }
      return route.fulfill({ status: 200, headers: jsonHeaders, body: JSON.stringify([]) });
    }
    return route.fulfill({ status: 200, headers: jsonHeaders, body: '[]' });
  });

  await page.addInitScript(() => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('appi_tarjetas_auto', '0');
    localStorage.setItem('tutoVisto_v2', '1');
  });
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
  await page.waitForFunction(() => window.__APPI_HISTORICO__ && window.__APPI_HISTORICO__.state.ready, null, { timeout: 15000 });

  return { cloudRows, storage, deletedRows, deletedFiles };
}

async function guardarCierreViejo(page, month) {
  await page.evaluate(async ({ month, titular }) => {
    const api = window.__APPI_HISTORICO__, H = api.state;
    const id = `2024-${String(month + 1).padStart(2, '0')}`;
    H.uploads[id] = {
      id, year: 2024, month, changed: true,
      files: {
        equipo: new File([`equipo-${id}`], `equipo-${id}.xlsx`),
        garantias: new File([`garantias-${id}`], `garantias-${id}.xlsx`),
        ingresos: new File([`ingresos-${id}`], `ingresos-${id}.xlsx`)
      },
      parsed: {
        equipo: { result: { titular, personas: [
          { id: 1, codigo: titular.dip, nombre: titular.nombre, cat: 'L', nivel: 0, padreId: null, pnAct: 20 + month },
          { id: 2, codigo: '02-1000001', nombre: 'Juan Rama', cat: 'D', nivel: 1, padreId: 1, pnAct: 10 + month }
        ] } },
        garantias: { result: { garantiasMap: { '02-1000001': { presentadas: 3, vencidas: 1, porcVencidas: 33, pendientes: 2 } } } },
        ingresos: { result: { ingresos: [], subtotales: [], totalReportado: 0, periodo: id } }
      },
      status: {}
    };
    await api.saveMonth(id);
  }, { month, titular: TITULAR });
}

test('sólo permite navegar e importar automáticamente el año actual y el anterior', async ({ page }) => {
  await abrirApp(page);
  await page.evaluate(() => window.__APPI_HISTORICO__.open());
  await page.locator('[data-hs-manage]').click();

  await expect(page.locator('#histAnnualYear option')).toHaveCount(2);
  await expect(page.locator('#histAnnualYear option').nth(0)).toHaveAttribute('value', '2026');
  await expect(page.locator('#histAnnualYear option').nth(1)).toHaveAttribute('value', '2025');

  const oldImport = await page.evaluate(async () => {
    const result = await window.__APPI_HISTORICO__.syncPSAPeriod('2024-12');
    return { status: result.status, message: result.error && result.error.message };
  });
  expect(oldImport.status).toBe('error');
  expect(oldImport.message).toContain('año actual y el anterior');
});

test('verifica el PDF anual en la nube antes de retirar cierres y planillas', async ({ page }) => {
  const cloud = await abrirApp(page);
  await page.context().setOffline(true);
  await guardarCierreViejo(page, 0);
  await guardarCierreViejo(page, 1);

  expect(await page.evaluate(() => window.__APPI_HISTORICO__.navigablePeriods().map(item => item.id))).toEqual([]);
  expect(await page.evaluate(() => window.__APPI_HISTORICO__.state.periods.map(item => item.id))).toEqual(['2024-01', '2024-02']);

  await page.context().setOffline(false);
  await expect.poll(async () => page.evaluate(() => ({
    syncing: window.__APPI_HISTORICO__.state.syncing,
    periods: window.__APPI_HISTORICO__.state.periods.length,
    archives: window.__APPI_HISTORICO__.state.archives.map(item => item.year)
  })), { timeout: 20000 }).toEqual({ syncing: false, periods: 0, archives: [2024] });

  const archiveRow = cloud.cloudRows.get('archive__2024');
  expect(archiveRow.data.kind).toBe('annual-pdf');
  expect(archiveRow.data.months).toBe(2);
  expect(archiveRow.data.hash).toMatch(/^[a-f0-9]{64}$/);
  expect(cloud.cloudRows.has('2024-01')).toBe(false);
  expect(cloud.cloudRows.has('2024-02')).toBe(false);
  expect(cloud.deletedRows).toEqual(expect.arrayContaining(['2024-01', '2024-02']));
  expect(cloud.deletedFiles).toHaveLength(6);

  const pdfEntry = [...cloud.storage.entries()].find(([path]) => path.includes('/archives/2024/'));
  expect(pdfEntry).toBeTruthy();
  expect(pdfEntry[1].subarray(0, 4).toString()).toBe('%PDF');

  await page.evaluate(() => window.__APPI_HISTORICO__.open());
  await page.locator('[data-hs-go="archivos"]').click();
  await expect(page.locator('.hs-archive-list')).toContainText('Resumen anual 2024');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-hist-archive="2024"]').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('APPI-Resumen-Anual-2024.pdf');
});

test('la nueva pantalla legible muestra informes, planillas y las cinco gráficas sin desborde', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await abrirApp(page);
  await page.context().setOffline(true);
  await page.evaluate(async titular => {
    const api=window.__APPI_HISTORICO__,H=api.state,id='2026-10';
    H.uploads[id]={id,year:2026,month:9,changed:true,files:{equipo:new File(['e'],'equipo.xlsx'),garantias:new File(['g'],'garantias.xlsx'),ingresos:new File(['i'],'ingresos.xlsx')},parsed:{equipo:{result:{titular,personas:[{id:1,codigo:titular.dip,nombre:titular.nombre,cat:'L',nivel:0,padreId:null,pnAct:50},{id:2,codigo:'02-1000001',nombre:'Juan Rama',cat:'D',nivel:1,padreId:1,pnAct:20}]}},garantias:{result:{garantiasMap:{'02-1000001':{presentadas:4,vencidas:1,porcVencidas:25,pendientes:2}}}},ingresos:{result:{ingresos:[{id:1,dip:'02-1000001',nombre:'Juan Rama',cat:'D',fechaAlta:'2026-10-02',ultimaCompra:'2026-10-08',patrocinanteNombre:titular.nombre,patrocinanteDip:titular.dip,capacitacion:1,diasHastaCompra:6,compraPosterior:true}],subtotales:[],totalReportado:1,periodo:id}}},status:{}};await api.saveMonth(id);
  }, TITULAR);
  await page.evaluate(() => window.__APPI_HISTORICO__.open());
  await expect(page.locator('.hs-report-list > button')).toHaveCount(3);
  await expect(page.locator('.hs-analysis > button')).toHaveCount(2);
  await page.locator('[data-hs-go="pb"]').click();
  await expect(page.locator('.hs-person')).toHaveCount(2);
  await page.locator('[data-hs-go="home"]').last().click();
  await page.locator('[data-hs-go="comparar"]').click();
  await expect(page.locator('.hs-compare-card tbody tr')).toHaveCount(12);
  await page.locator('[data-hs-go="home"]').last().click();
  await page.locator('[data-hs-go="graficas"]').click();
  await expect(page.locator('[data-hs-graph]')).toHaveCount(5);
  await expect(page.locator('.hs-chart svg')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test('si la nube no puede verificar el PDF conserva todos los originales', async ({ page }) => {
  const cloud = await abrirApp(page, { failArchiveVerification: true });
  await page.context().setOffline(true);
  await guardarCierreViejo(page, 0);
  await page.context().setOffline(false);

  await expect.poll(async () => page.evaluate(() => window.__APPI_HISTORICO__.state.syncLog.join('\n')), { timeout: 20000 }).toContain('verificación simulada fallida');
  await expect.poll(async () => page.evaluate(() => window.__APPI_HISTORICO__.state.syncing)).toBe(false);

  expect(await page.evaluate(() => window.__APPI_HISTORICO__.state.periods.map(item => item.id))).toEqual(['2024-01']);
  expect(await page.evaluate(() => window.__APPI_HISTORICO__.dbGetAll('files').then(items => items.length))).toBe(3);
  expect(cloud.cloudRows.has('2024-01')).toBe(true);
  expect(cloud.deletedRows).toEqual([]);
  expect(cloud.deletedFiles).toEqual([]);
});
