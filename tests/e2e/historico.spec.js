const { test, expect } = require('@playwright/test');

// El Histórico guarda los cierres de cada mes y de ahí salen los números que
// se muestran, el informe y el Centro de Acción. Un error acá no se ve: sale
// un total mal y se toman decisiones con datos falsos. Estas pruebas fijan
// las cuentas que tienen que dar bien siempre.

const USER_ID = '11111111-1111-4111-8111-111111111111';

function tokenFor(sub) {
  const h = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${h}.${p}.firma`;
}

async function abrirHistorico(page) {
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
  await page.route('https://mock.supabase.co/**', route => {
    const url = new URL(route.request().url());
    const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
    if (url.pathname === '/auth/v1/token') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ access_token: tokenFor(USER_ID), refresh_token: 'r', expires_in: 3600, user: { id: USER_ID } }) });
    if (url.pathname === '/rest/v1/appi_perfiles') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([profile]) });
    return route.fulfill({ status: 200, headers: cors, body: '[]' });
  });
  await page.addInitScript(() => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('tutoVisto_v2', '1');
  });
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
  await page.waitForFunction(() => window.__APPI_HISTORICO__ && window.__APPI_HISTORICO__.state.ready, null, { timeout: 15000 });
}

// Guarda un cierre igual que si se hubieran cargado los tres archivos.
async function guardarCierre(page, cierre) {
  return page.evaluate(async datos => {
    const api = window.__APPI_HISTORICO__, H = api.state;
    const id = `${datos.year}-${String(datos.month + 1).padStart(2, '0')}`;
    H.uploads[id] = {
      id, year: datos.year, month: datos.month, changed: true,
      files: {
        equipo: new File([`equipo-${id}`], 'equipo.xlsx'),
        garantias: new File([`gar-${id}`], 'gar.xlsx'),
        ingresos: new File([`ing-${id}`], 'ing.xlsx')
      },
      parsed: {
        equipo: { result: { titular: datos.titular, personas: datos.personas } },
        garantias: { result: { garantiasMap: datos.garantias || {} } },
        ingresos: { result: { ingresos: datos.ingresos || [], subtotales: [], totalReportado: (datos.ingresos || []).length, periodo: id } }
      },
      status: {}
    };
    await api.saveMonth(id);
    return H.periods.find(p => p.id === id) || null;
  }, cierre);
}

const TITULAR = { dip: '02-9802014', nombre: 'María Pérez', categoria: 'L' };

// Tres niveles: la titular, una persona debajo y otra debajo de esa.
function equipoBase() {
  return [
    { id: 1, codigo: '02-9802014', nombre: 'María Pérez', cat: 'L', nivel: 0, padreId: null, pnAct: 20, tel: '3515550001' },
    { id: 2, codigo: '02-1000001', nombre: 'Juan Rama', cat: 'D', nivel: 1, padreId: 1, pnAct: 12, tel: '3515550002' },
    { id: 3, codigo: '02-1000002', nombre: 'Ana Hoja', cat: 'DJ', nivel: 2, padreId: 2, pnAct: 9, tel: '3515550003' }
  ];
}

test.describe('Histórico: las cuentas de un cierre', () => {
  test('los puntos de cada persona suben por la línea hasta el titular', async ({ page }) => {
    await abrirHistorico(page);
    const cierre = await guardarCierre(page, { year: 2025, month: 4, titular: TITULAR, personas: equipoBase() });

    const porNombre = Object.fromEntries(cierre.people.map(p => [p.nombre, p]));
    // Ana está sola abajo: sus 9 puntos son todos suyos.
    expect(porNombre['Ana Hoja'].totalPB).toBe(9);
    expect(porNombre['Ana Hoja'].teamPB).toBe(0);
    // Juan suma los suyos (12) más los de Ana (9).
    expect(porNombre['Juan Rama'].totalPB).toBe(21);
    expect(porNombre['Juan Rama'].teamPB).toBe(9);
    // La titular junta todo: 20 + 12 + 9.
    expect(porNombre['María Pérez'].totalPB).toBe(41);
    expect(porNombre['María Pérez'].teamPB).toBe(21);
    // Y todos cuelgan de la misma rama.
    expect(new Set(cierre.people.map(p => p.branchKey)).size).toBe(1);
  });

  test('el resumen del mes cuenta personas, activas, puntos y garantías', async ({ page }) => {
    await abrirHistorico(page);
    const personas = equipoBase();
    personas.push({ id: 4, codigo: '02-1000003', nombre: 'Luis Quieto', cat: 'D', nivel: 1, padreId: 1, pnAct: 0, tel: '3515550004' });
    const cierre = await guardarCierre(page, {
      year: 2025, month: 4, titular: TITULAR, personas,
      garantias: {
        '02-1000001': { presentadas: 4, vencidas: 1, porcVencidas: 25, pendientes: 2 },
        '02-1000002': { presentadas: 2, vencidas: 1, porcVencidas: 50, pendientes: 3 }
      }
    });

    const s = cierre.summary;
    expect(s.people).toBe(4);
    expect(s.active).toBe(3);            // Luis tiene 0 puntos: no cuenta como activo
    expect(s.inactive).toBe(1);
    expect(s.activePct).toBe(75);
    expect(s.pbPersonal).toBe(41);
    expect(s.presented).toBe(6);
    expect(s.expired).toBe(2);
    expect(s.pending).toBe(5);
    expect(s.expiredPct).toBe(33);       // 2 de 6, redondeado
    expect(s.categories).toEqual({ L: 1, D: 2, DJ: 1 });
  });

  test('las garantías se pegan a la persona por su código, no por el nombre', async ({ page }) => {
    await abrirHistorico(page);
    const cierre = await guardarCierre(page, {
      year: 2025, month: 4, titular: TITULAR, personas: equipoBase(),
      garantias: { '02-1000001': { presentadas: 4, vencidas: 1, porcVencidas: 25, pendientes: 2 } }
    });
    const juan = cierre.people.find(p => p.codigo === '02-1000001');
    const ana = cierre.people.find(p => p.codigo === '02-1000002');
    expect(juan.garantias).toEqual({ presentadas: 4, vencidas: 1, porcVencidas: 25, pendientes: 2 });
    // Quien no tiene garantías queda en cero, no hereda las del vecino.
    expect(ana.garantias).toEqual({ presentadas: 0, vencidas: 0, porcVencidas: 0, pendientes: 0 });
  });

  test('dos personas con el mismo nombre no se pisan entre sí', async ({ page }) => {
    await abrirHistorico(page);
    const personas = [
      { id: 1, codigo: '02-9802014', nombre: 'María Pérez', cat: 'L', nivel: 0, padreId: null, pnAct: 10 },
      { id: 2, codigo: '', nombre: 'Ana López', cat: 'D', nivel: 1, padreId: 1, pnAct: 7 },
      { id: 3, codigo: '', nombre: 'Ana López', cat: 'D', nivel: 1, padreId: 1, pnAct: 4 }
    ];
    const cierre = await guardarCierre(page, { year: 2025, month: 4, titular: TITULAR, personas });
    expect(cierre.people.length).toBe(3);
    expect(new Set(cierre.people.map(p => p.key)).size).toBe(3);
    expect(cierre.summary.pbPersonal).toBe(21);
  });

  test('los ingresos del mes se enlazan con la persona del equipo', async ({ page }) => {
    await abrirHistorico(page);
    const cierre = await guardarCierre(page, {
      year: 2025, month: 4, titular: TITULAR, personas: equipoBase(),
      ingresos: [
        { id: 1, dip: '02-1000002', nombre: 'Ana Hoja', cat: 'DJ', telefono: '3515550003', email: 'ana@test.com', fechaAlta: '2025-05-02', ultimaCompra: '2025-05-20', patrocinanteDip: '02-1000001', patrocinanteNombre: 'Juan Rama', patrocinanteCat: 'D', capacitacion: 1, diasHastaCompra: 18, compraPosterior: true, contactoCompleto: true },
        { id: 2, dip: '02-1000009', nombre: 'Nuevo Sin Compra', cat: 'DJ', telefono: '', email: '', fechaAlta: '2025-05-10', ultimaCompra: '', patrocinanteDip: '02-9802014', patrocinanteNombre: 'María Pérez', patrocinanteCat: 'L', capacitacion: 0, diasHastaCompra: null, compraPosterior: false, contactoCompleto: false }
      ]
    });

    const s = cierre.summary;
    expect(s.incomeCount).toBe(2);
    expect(s.incomeMatched).toBe(1);            // sólo Ana está en la línea descendente
    expect(s.incomeNoPurchase).toBe(1);
    expect(s.incomeContactIncomplete).toBe(1);
    expect(s.incomeAvgDays).toBe(18);
    expect(s.incomeTraining).toBe(1);
    // La persona enlazada queda marcada como ingreso del mes.
    expect(cierre.people.find(p => p.codigo === '02-1000002').isIncome).toBe(true);
  });
});

test.describe('Histórico: comparar dos meses', () => {
  test('detecta quién subió, quién bajó, quién entró y quién ya no está', async ({ page }) => {
    await abrirHistorico(page);
    await guardarCierre(page, { year: 2025, month: 3, titular: TITULAR, personas: equipoBase() });

    // Mayo: Juan sube, Ana baja, se va Luis (no estaba) y entra Sofía.
    const mayo = [
      { id: 1, codigo: '02-9802014', nombre: 'María Pérez', cat: 'L', nivel: 0, padreId: null, pnAct: 20 },
      { id: 2, codigo: '02-1000001', nombre: 'Juan Rama', cat: 'DC', nivel: 1, padreId: 1, pnAct: 25 },
      { id: 4, codigo: '02-1000004', nombre: 'Sofía Nueva', cat: 'DJ', nivel: 1, padreId: 1, pnAct: 6 }
    ];
    await guardarCierre(page, { year: 2025, month: 4, titular: TITULAR, personas: mayo });

    const analisis = await page.evaluate(() => {
      const api = window.__APPI_HISTORICO__;
      const a = api.analyze(api.state.periods);
      return {
        improved: a.improved, declined: a.declined, newPeople: a.newPeople, leftPeople: a.leftPeople,
        cambios: a.changes.map(c => ({ n: c.name, delta: c.delta, estado: c.status }))
      };
    });

    const porNombre = Object.fromEntries(analisis.cambios.map(c => [c.n, c]));
    expect(porNombre['Juan Rama']).toEqual({ n: 'Juan Rama', delta: 13, estado: 'same' });
    expect(porNombre['Sofía Nueva'].estado).toBe('new');
    expect(porNombre['Ana Hoja'].estado).toBe('left');
    expect(porNombre['Ana Hoja'].delta).toBe(-9);   // se fue con sus 9 puntos
    expect(analisis.improved).toBe(1);
    expect(analisis.declined).toBe(0);
    expect(analisis.newPeople).toBe(1);
    expect(analisis.leftPeople).toBe(1);
  });

  test('una caída fuerte de puntos aparece como prioridad Alta', async ({ page }) => {
    await abrirHistorico(page);
    await guardarCierre(page, { year: 2025, month: 3, titular: TITULAR, personas: equipoBase() });

    // Todos bajan a la mitad: 41 → 18 PB.
    const caida = equipoBase().map(p => ({ ...p, pnAct: Math.round(p.pnAct * 0.45) }));
    await guardarCierre(page, { year: 2025, month: 4, titular: TITULAR, personas: caida });

    const avisos = await page.evaluate(() => {
      const api = window.__APPI_HISTORICO__;
      return api.strategies(api.state.periods).map(s => ({ tipo: s.type, prioridad: s.priority, texto: s.evidence }));
    });

    const baja = avisos.find(a => a.tipo === 'pb_drop');
    expect(baja).toBeTruthy();
    expect(baja.prioridad).toBe('Alta');
    // Lo urgente va primero: nada de prioridad menor arriba de una Alta.
    expect(avisos[0].prioridad).toBe('Alta');
  });

  test('cuando una sola rama concentra el PB, lo avisa', async ({ page }) => {
    await abrirHistorico(page);
    // Todos cuelgan de la titular: una única rama con el 100% del volumen.
    await guardarCierre(page, { year: 2025, month: 4, titular: TITULAR, personas: equipoBase() });
    const avisos = await page.evaluate(() => {
      const api = window.__APPI_HISTORICO__;
      return api.strategies(api.state.periods).map(s => ({ tipo: s.type, texto: s.evidence }));
    });
    const rama = avisos.find(a => a.tipo === 'branch_balance');
    expect(rama).toBeTruthy();
    expect(rama.texto).toContain('100%');
  });

  test('un mes sano y equilibrado igual deja el aviso de control mensual', async ({ page }) => {
    await abrirHistorico(page);
    // Dos ramas parejas, todos activos, sin garantías ni ingresos con problemas:
    // no hay nada que corregir, pero el mes no puede quedar sin ninguna guía.
    const equilibrado = [
      { id: 1, codigo: '02-1000001', nombre: 'Rama Una', cat: 'D', nivel: 0, padreId: null, pnAct: 20 },
      { id: 2, codigo: '02-1000002', nombre: 'Rama Dos', cat: 'D', nivel: 0, padreId: null, pnAct: 20 }
    ];
    await guardarCierre(page, { year: 2025, month: 4, titular: TITULAR, personas: equilibrado });
    const avisos = await page.evaluate(() => {
      const api = window.__APPI_HISTORICO__;
      return api.strategies(api.state.periods).map(s => s.type);
    });
    expect(avisos).toEqual(['monthly_control']);
  });

  test('los ingresos sin compra posterior generan su propio aviso con las personas', async ({ page }) => {
    await abrirHistorico(page);
    await guardarCierre(page, {
      year: 2025, month: 4, titular: TITULAR, personas: equipoBase(),
      ingresos: [{ id: 1, dip: '02-1000002', nombre: 'Ana Hoja', cat: 'DJ', telefono: '3515550003', email: 'ana@test.com', fechaAlta: '2025-05-02', ultimaCompra: '', patrocinanteDip: '02-1000001', patrocinanteNombre: 'Juan Rama', patrocinanteCat: 'D', capacitacion: 0, diasHastaCompra: null, compraPosterior: false, contactoCompleto: true }]
    });

    const datos = await page.evaluate(() => {
      const api = window.__APPI_HISTORICO__;
      const estrategias = api.strategies(api.state.periods);
      const sinCompra = estrategias.find(s => s.type === 'income_no_purchase');
      if (!sinCompra) return { hay: false };
      return { hay: true, afectados: api.affectedForStrategy(sinCompra, api.state.periods).map(r => ({ nombre: r.name, tel: r.phone })) };
    });

    expect(datos.hay).toBe(true);
    expect(datos.afectados.length).toBe(1);
    expect(datos.afectados[0].nombre).toBe('Ana Hoja');
    // Sin teléfono no se puede llamar a nadie: es el dato que hace útil al aviso.
    expect(datos.afectados[0].tel).toBe('3515550003');
  });

  test('quien viene dos meses en cero aparece en el aviso de inactividad', async ({ page }) => {
    await abrirHistorico(page);
    const conParado = () => ([
      { id: 1, codigo: '02-9802014', nombre: 'María Pérez', cat: 'L', nivel: 0, padreId: null, pnAct: 20 },
      { id: 2, codigo: '02-1000005', nombre: 'Pedro Parado', cat: 'D', nivel: 1, padreId: 1, pnAct: 0, tel: '3515550055' }
    ]);
    await guardarCierre(page, { year: 2025, month: 3, titular: TITULAR, personas: conParado() });
    await guardarCierre(page, { year: 2025, month: 4, titular: TITULAR, personas: conParado() });

    const datos = await page.evaluate(() => {
      const api = window.__APPI_HISTORICO__;
      const s = api.strategies(api.state.periods).find(x => x.type === 'consecutive');
      return s ? api.affectedForStrategy(s, api.state.periods).map(r => r.name) : null;
    });
    expect(datos).toContain('Pedro Parado');
  });
});

test.describe('Histórico: guardar y volver a guardar', () => {
  test('el cierre queda guardado en el teléfono y se lee al volver', async ({ page }) => {
    await abrirHistorico(page);
    await guardarCierre(page, { year: 2025, month: 4, titular: TITULAR, personas: equipoBase() });

    // Se lee de la base del teléfono, no de lo que quedó en memoria.
    const guardados = await page.evaluate(() => window.__APPI_HISTORICO__.dbGetAll('periods'));
    expect(guardados.length).toBe(1);
    expect(guardados[0].id).toBe('2025-05');
    expect(guardados[0].label).toBe('Mayo 2025');
    expect(guardados[0].summary.pbPersonal).toBe(41);
    // Queda marcado como pendiente de subir a la nube.
    expect(guardados[0].syncStatus).toBe('pending');
    // Y guarda la huella de los tres archivos para saber si cambiaron.
    expect(guardados[0].filesMeta.map(f => f.type).sort()).toEqual(['equipo', 'garantias', 'ingresos']);
    for (const meta of guardados[0].filesMeta) expect(meta.hash).toMatch(/^[a-f0-9]{64}$/);
  });

  test('volver a guardar el mismo mes lo reemplaza y sube la versión', async ({ page }) => {
    await abrirHistorico(page);
    await guardarCierre(page, { year: 2025, month: 4, titular: TITULAR, personas: equipoBase() });

    // La segunda vez pregunta antes de pisar: se responde que sí.
    await page.evaluate(() => { window.APPIDialog.confirm = async () => true; });
    const corregido = equipoBase().map(p => ({ ...p, pnAct: p.pnAct + 5 }));
    await guardarCierre(page, { year: 2025, month: 4, titular: TITULAR, personas: corregido });

    const guardados = await page.evaluate(() => window.__APPI_HISTORICO__.dbGetAll('periods'));
    expect(guardados.length).toBe(1);            // no quedan dos mayos
    expect(guardados[0].version).toBe(2);
    expect(guardados[0].summary.pbPersonal).toBe(56);
  });

  test('si se cancela la confirmación, el cierre viejo queda intacto', async ({ page }) => {
    await abrirHistorico(page);
    await guardarCierre(page, { year: 2025, month: 4, titular: TITULAR, personas: equipoBase() });

    await page.evaluate(() => { window.APPIDialog.confirm = async () => false; });
    await guardarCierre(page, { year: 2025, month: 4, titular: TITULAR, personas: equipoBase().map(p => ({ ...p, pnAct: 1 })) });

    const guardados = await page.evaluate(() => window.__APPI_HISTORICO__.dbGetAll('periods'));
    expect(guardados.length).toBe(1);
    expect(guardados[0].version).toBe(1);
    expect(guardados[0].summary.pbPersonal).toBe(41);   // sigue el original
  });

  test('los meses se ordenan por fecha aunque se carguen desordenados', async ({ page }) => {
    await abrirHistorico(page);
    await guardarCierre(page, { year: 2025, month: 6, titular: TITULAR, personas: equipoBase() });
    await guardarCierre(page, { year: 2025, month: 2, titular: TITULAR, personas: equipoBase() });
    await guardarCierre(page, { year: 2025, month: 4, titular: TITULAR, personas: equipoBase() });

    const ids = await page.evaluate(() => window.__APPI_HISTORICO__.state.periods.map(p => p.id));
    expect(ids).toEqual(['2025-03', '2025-05', '2025-07']);
  });
});

test.describe('Histórico: el año en un vistazo', () => {
  test('cada mes cargado ocupa su lugar y los que faltan quedan vacíos', async ({ page }) => {
    await abrirHistorico(page);
    await guardarCierre(page, { year: 2025, month: 2, titular: TITULAR, personas: equipoBase() });
    await guardarCierre(page, { year: 2025, month: 4, titular: TITULAR, personas: equipoBase().map(p => ({ ...p, pnAct: p.pnAct * 2 })) });

    const anio = await page.evaluate(() => {
      const api = window.__APPI_HISTORICO__;
      const matriz = api.annualMatrix(2025);
      return {
        meses: matriz.periods.map(p => p.month),
        marzo: api.albumMonthStats(matriz, 2),
        mayo: api.albumMonthStats(matriz, 4),
        agosto: api.albumMonthStats(matriz, 7)
      };
    });

    expect(anio.meses).toEqual([2, 4]);
    expect(anio.marzo.period).not.toBeNull();
    expect(anio.mayo.period).not.toBeNull();
    // Agosto no se cargó: no inventa datos.
    expect(anio.agosto.period).toBeNull();
    expect(anio.agosto.pb).toBe(0);
    // Mayo duplica los puntos de marzo.
    expect(anio.mayo.pb).toBe(anio.marzo.pb * 2);
  });

  test('el año no mezcla los cierres de otro año', async ({ page }) => {
    await abrirHistorico(page);
    await guardarCierre(page, { year: 2024, month: 4, titular: TITULAR, personas: equipoBase() });
    await guardarCierre(page, { year: 2025, month: 4, titular: TITULAR, personas: equipoBase() });

    const conteos = await page.evaluate(() => {
      const api = window.__APPI_HISTORICO__;
      return { dosMilVeinticuatro: api.annualMatrix(2024).periods.length, dosMilVeinticinco: api.annualMatrix(2025).periods.length, dosMilVeintitres: api.annualMatrix(2023).periods.length };
    });
    expect(conteos.dosMilVeinticuatro).toBe(1);
    expect(conteos.dosMilVeinticinco).toBe(1);
    expect(conteos.dosMilVeintitres).toBe(0);
  });
});

test.describe('Histórico: los datos son de cada persona', () => {
  test('los cierres viven en una base propia por titular o socio', async ({ page }) => {
    await abrirHistorico(page);
    await guardarCierre(page, { year: 2025, month: 4, titular: TITULAR, personas: equipoBase() });

    const bases = await page.evaluate(async () => (await indexedDB.databases()).map(d => d.name).filter(Boolean));
    // Hay una base del Histórico y su nombre distingue de quién son los datos.
    expect(bases.some(n => n.includes('appi-historico'))).toBe(true);
  });

  test('el Histórico no se cae si todavía no hay ningún cierre', async ({ page }) => {
    await abrirHistorico(page);
    const sinDatos = await page.evaluate(() => {
      const api = window.__APPI_HISTORICO__;
      return {
        periodos: api.state.periods.length,
        estrategias: api.strategies([]).length,
        afectados: api.affectedForStrategy({ type: 'pb_drop' }, []).length,
        matriz: api.annualMatrix(new Date().getFullYear()).periods.length
      };
    });
    expect(sinDatos).toEqual({ periodos: 0, estrategias: 0, afectados: 0, matriz: 0 });
  });

  test('abrir el Histórico muestra la pantalla sin errores en la consola', async ({ page }) => {
    const errores = [];
    page.on('pageerror', e => errores.push(String(e)));
    page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });

    await abrirHistorico(page);
    await guardarCierre(page, { year: 2025, month: 4, titular: TITULAR, personas: equipoBase() });
    await page.evaluate(() => window.openHistorico());
    await page.waitForTimeout(800);

    await expect(page.locator('#view-historico')).toHaveClass(/active/);
    await expect(page.locator('#view-historico')).toContainText('Mayo');
    expect(errores.filter(e => !/favicon|manifest/i.test(e))).toEqual([]);
  });
});
