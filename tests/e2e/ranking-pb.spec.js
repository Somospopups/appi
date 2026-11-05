const { test, expect } = require('@playwright/test');

async function abrirApp(page) {
  await page.addInitScript(() => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('tutoVisto_v2', '1');
    localStorage.setItem('appi_tarjetas_auto', '0');
    localStorage.setItem('appi_aviso_psa_off', '1');
  });
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
}

function lineaConMiles() {
  return [
    ['DIP Nro : 02-9999999 Nombre y Apellido : TITULAR PRUEBA Socio : Sucursal : 02 Categoría : L País : Argentina'],
    ['Período Consultado: Octubre - 2026'],
    ['', '', '', 'Nombre', 'Cat.', 'Teléfono', 'Estado', 'PB Mes Actual', '1°Mes Ant.', '2°Mes Ant.', '3°Mes Ant.', 'Alta', 'Cumpleaños', 'Correo electrónico'],
    ['', '', '0', '[02-9999999] TITULAR PRUEBA [AR-B]', 'L', '', 'C', '1.500', '0', '0', '0', '', '', ''],
    ['', '', '1', '[02-1000001] RAIZ MIL [AR-B]', 'D', '', 'C', '1.234', '0', '0', '0', '', '', ''],
    ['', '', '2', '[02-1000002] HIJO DOS MIL [AR-B]', 'DJ', '', 'C', '2.345', '0', '0', '0', '', '', ''],
    ['', '', '1', '[02-1000003] RAIZ NOVECIENTOS [AR-B]', 'D', '', 'C', '950', '0', '0', '0', '', '', '']
  ];
}

const fuenteNormalizada = {
  par: [
    { n: 'TITULAR PRUEBA', pb: 1500 },
    { n: 'RAIZ MIL', pb: 1234 },
    { n: 'HIJO DOS MIL', pb: 2345 },
    { n: 'RAIZ NOVECIENTOS', pb: 950 }
  ],
  pb: 6029
};

test('conserva los miles de PSA en Mi negocio y en el cierre mensual', async ({ page }) => {
  await abrirApp(page);
  const rows = lineaConMiles();
  const result = await page.evaluate(async ({ rows, fuenteNormalizada }) => {
    const formats = ['950', '1.234', '1.234,50', '1234.50', '1 234,50', '1.234.567'];
    const parsedFormats = Object.fromEntries(formats.map(value => [value, parsePB(value)]));
    const numericDecimal = parsePB(1.234);
    const team = procesarExcel(rows);
    const integrity = validarIntegridadPBEquipo(team, fuenteNormalizada);
    const personal = [...team.personas]
      .sort((a, b) => b.pnAct - a.pnAct)
      .map(person => ({ nombre: person.nombre, value: person.pnAct }));
    const organization = team.personas
      .map(person => ({ nombre: person.nombre, value: calcularPBOrganizacion(person) }))
      .sort((a, b) => b.value - a.value);

    const api = window.__APPI_HISTORICO__;
    const response = {
      periodo: '2026-10', errores: [],
      linea: { filas: rows, ...fuenteNormalizada },
      garantiasOrg: { filas: [
        ['Nombre', 'DIP', 'Presentadas', 'Vencidas', '% Vencidas', 'Pendientes'],
        ['RAIZ MIL', '02-1000001', '1', '0', '0', '0'],
        ['HIJO DOS MIL', '02-1000002', '1', '0', '0', '0'],
        ['RAIZ NOVECIENTOS', '02-1000003', '1', '0', '0', '0']
      ] },
      ingresos: {
        filas: [['Período Consultado Octubre - 2026'], ['Total de 0 ingresos']],
        resumen: 'Período Consultado Octubre - 2026 · Total de 0 ingresos'
      }
    };
    await api.importPSAResponse(response, { period: '2026-10', deferCloud: true });
    const period = api.state.periods.find(item => item.id === '2026-10');
    // Simula un cierre v898 con exactamente los mismos archivos. La versión
    // del lector debe obligar a reconstruirlo aunque los hashes no cambien.
    period.pbDataVersion = 0;
    period.people[0].pnAct = 1.234;
    period.people[0].totalPB = 3.579;
    const migrated = await api.importPSAResponse(response, { period: '2026-10', deferCloud: true });
    const corrected = api.state.periods.find(item => item.id === '2026-10');
    return {
      parsedFormats, numericDecimal, integrity,
      titularPB: team.titular.pbPersonal,
      personal, organization,
      historical: {
        migrationStatus: migrated.status,
        pbDataVersion: corrected.pbDataVersion,
        summaryPB: corrected.summary.pbPersonal,
        people: corrected.people.map(person => ({ nombre: person.nombre, pnAct: person.pnAct, totalPB: person.totalPB }))
      }
    };
  }, { rows, fuenteNormalizada });

  expect(result.parsedFormats).toEqual({
    '950': 950,
    '1.234': 1234,
    '1.234,50': 1234.5,
    '1234.50': 1234.5,
    '1 234,50': 1234.5,
    '1.234.567': 1234567
  });
  expect(result.numericDecimal).toBe(1.234);
  expect(result.integrity).toMatchObject({ ok: true, count: 4, total: 6029 });
  expect(result.titularPB).toBe(1500);
  expect(result.personal).toEqual([
    { nombre: 'HIJO DOS MIL', value: 2345 },
    { nombre: 'RAIZ MIL', value: 1234 },
    { nombre: 'RAIZ NOVECIENTOS', value: 950 }
  ]);
  expect(result.organization).toEqual([
    { nombre: 'RAIZ MIL', value: 3579 },
    { nombre: 'HIJO DOS MIL', value: 2345 },
    { nombre: 'RAIZ NOVECIENTOS', value: 950 }
  ]);
  expect(result.historical.migrationStatus).toBe('updated');
  expect(result.historical.pbDataVersion).toBe(2);
  expect(result.historical.summaryPB).toBe(4529);
  expect(result.historical.people).toEqual([
    { nombre: 'RAIZ MIL', pnAct: 1234, totalPB: 3579 },
    { nombre: 'HIJO DOS MIL', pnAct: 2345, totalPB: 2345 },
    { nombre: 'RAIZ NOVECIENTOS', pnAct: 950, totalPB: 950 }
  ]);
});

test('no guarda una Línea Descendente con un DIP repetido', async ({ page }) => {
  await abrirApp(page);
  const rows = lineaConMiles();
  rows.splice(6, 0, ['', '', '1', '[02-1000001] RAIZ REPETIDA [AR-B]', 'D', '', 'C', '10', '0', '0', '0', '', '', '']);
  const message = await page.evaluate(rows => {
    try {
      validarIntegridadPBEquipo(procesarExcel(rows));
      return '';
    } catch (error) {
      return String(error && error.message || error);
    }
  }, rows);
  expect(message).toContain('repite el DIP');
  expect(message).toContain('02-1000001');
  expect(message).toContain('evitar sumar puntos dos veces');
});

test('marca para recuperación automática los cierres PSA guardados con el lector anterior', async ({ page }) => {
  await abrirApp(page);
  const result = await page.evaluate(() => {
    const api = window.__APPI_HISTORICO__;
    const expected = api.expectedHistoricalPeriodIds();
    const stale = expected[Math.max(0, expected.length - 3)];
    api.state.uploads = {};
    api.state.periods = expected.map(id => ({
      id,
      year: Number(id.slice(0, 4)),
      month: Number(id.slice(5)) - 1,
      source: 'psa-auto',
      pbDataVersion: id === stale ? 0 : 2,
      people: [], incomes: [], summary: {}
    }));
    const before = api.missingHistoricalPeriodIds();
    api.state.periods.find(period => period.id === stale).pbDataVersion = 2;
    const after = api.missingHistoricalPeriodIds();
    return { stale, before, after };
  });
  expect(result.before).toEqual([result.stale]);
  expect(result.after).toEqual([]);
});

// El titular (nivel 0 del reporte) no forma parte del árbol de personas: su PB
// personal vive en period.titular.pbPersonal, el mismo "Volumen personal" que
// muestra el reporte de bonos. Antes quedaba afuera de los rankings.
function respuestaPSA(rows, periodo = '2026-10') {
  return {
    periodo, errores: [],
    linea: { filas: rows, par: [{ n: 'TITULAR PRUEBA', pb: 1500 }], pb: 6029 },
    garantiasOrg: { filas: [
      ['Nombre', 'DIP', 'Presentadas', 'Vencidas', '% Vencidas', 'Pendientes'],
      ['RAIZ MIL', '02-1000001', '1', '0', '0', '0'],
      ['HIJO DOS MIL', '02-1000002', '1', '0', '0', '0'],
      ['RAIZ NOVECIENTOS', '02-1000003', '1', '0', '0', '0']
    ] },
    ingresos: {
      filas: [['Período Consultado Octubre - 2026'], ['Total de 0 ingresos']],
      resumen: 'Período Consultado Octubre - 2026 · Total de 0 ingresos'
    }
  };
}

test('el titular figura en el ranking de PB personales con su volumen personal', async ({ page }) => {
  await abrirApp(page);
  const rows = lineaConMiles();
  const result = await page.evaluate(async rows => {
    const api = window.__APPI_HISTORICO__;
    await api.importPSAResponse({
      periodo: '2026-10', errores: [],
      linea: { filas: rows, par: [
        { n: 'TITULAR PRUEBA', pb: 1500 }, { n: 'RAIZ MIL', pb: 1234 },
        { n: 'HIJO DOS MIL', pb: 2345 }, { n: 'RAIZ NOVECIENTOS', pb: 950 }
      ], pb: 6029 },
      garantiasOrg: { filas: [
        ['Nombre', 'DIP', 'Presentadas', 'Vencidas', '% Vencidas', 'Pendientes'],
        ['RAIZ MIL', '02-1000001', '1', '0', '0', '0'],
        ['HIJO DOS MIL', '02-1000002', '1', '0', '0', '0'],
        ['RAIZ NOVECIENTOS', '02-1000003', '1', '0', '0', '0']
      ] },
      ingresos: { filas: [['Período Consultado Octubre - 2026'], ['Total de 0 ingresos']], resumen: '' }
    }, { period: '2026-10', deferCloud: true });
    const period = api.state.periods.find(item => item.id === '2026-10');
    const aplanar = list => list.map(item => ({ nombre: item.person.nombre, pb: item.value, key: item.person.key }));
    return {
      volumenDelReporte: period.titular.pbPersonal,
      enElArbol: period.people.some(person => /TITULAR PRUEBA/i.test(person.nombre)),
      personal: aplanar(api.simpleRankingList(period, 'personal')),
      organizacion: aplanar(api.simpleRankingList(period, 'organizacion')),
      pbPersonalVista: api.simpleScopeStats(period, 'personal').pb
    };
  }, rows);

  // Su fila no está en el árbol: por eso había que sumarlo aparte.
  expect(result.enElArbol).toBe(false);
  expect(result.volumenDelReporte).toBe(1500);
  // El ranking personal lo incluye con su volumen personal, en el puesto que le toca.
  expect(result.personal).toEqual([
    { nombre: 'HIJO DOS MIL', pb: 2345, key: 'c:02-1000002' },
    { nombre: 'TITULAR PRUEBA', pb: 1500, key: 'titular' },
    { nombre: 'RAIZ MIL', pb: 1234, key: 'c:02-1000001' },
    { nombre: 'RAIZ NOVECIENTOS', pb: 950, key: 'c:02-1000003' }
  ]);
  // En organización aparece con su red completa (1500 propios + 4529 del equipo).
  expect(result.organizacion[0]).toEqual({ nombre: 'TITULAR PRUEBA', pb: 6029, key: 'titular' });
  // Y el "PB personal" del resumen ya no queda vacío.
  expect(result.pbPersonalVista).toBe(1500);
});

test('el titular no se duplica si su fila viene dentro de las personas', async ({ page }) => {
  await abrirApp(page);
  // Mismo reporte, pero con la fila del titular dentro del árbol (nivel 1).
  const rows = lineaConMiles().map(row => row[2] === '0' ? Object.assign([], row, {2: '1'}) : row);
  const result = await page.evaluate(async rows => {
    const api = window.__APPI_HISTORICO__;
    await api.importPSAResponse({
      periodo: '2026-10', errores: [],
      linea: { filas: rows, par: [
        { n: 'TITULAR PRUEBA', pb: 1500 }, { n: 'RAIZ MIL', pb: 1234 },
        { n: 'HIJO DOS MIL', pb: 2345 }, { n: 'RAIZ NOVECIENTOS', pb: 950 }
      ], pb: 6029 },
      garantiasOrg: { filas: [
        ['Nombre', 'DIP', 'Presentadas', 'Vencidas', '% Vencidas', 'Pendientes'],
        ['RAIZ MIL', '02-1000001', '1', '0', '0', '0']
      ] },
      ingresos: { filas: [['Período Consultado Octubre - 2026'], ['Total de 0 ingresos']], resumen: '' }
    }, { period: '2026-10', deferCloud: true });
    const period = api.state.periods.find(item => item.id === '2026-10');
    const personal = api.simpleRankingList(period, 'personal').map(item => item.person.nombre);
    return { personal, titulares: personal.filter(nombre => /TITULAR PRUEBA/i.test(nombre)).length };
  }, rows);
  expect(result.titulares).toBe(1);
});

// Caso real reportado: el "Volumen Personal" del Reporte de Bonos (47,65) no
// llegaba al ranking porque la Línea Descendente no trae el PB del titular.
function lineaSinTitular() {
  return [
    ['DIP Nro : 2-98020174  Nombre y Apellido : SILVIA DEL VALLE TOLEDO  Socio : DIAZ,GERMAN EZEQUIEL  Sucursal : 2  Categoría : L  País : Argentina'],
    ['Período Consultado: Octubre - 2026'],
    ['', '', '', 'Nombre', 'Cat.', 'Teléfono', 'Estado', 'PB Mes Actual', '1°Mes Ant.', '2°Mes Ant.', '3°Mes Ant.', 'Alta', 'Cumpleaños', 'Correo'],
    ['', '', '1', '[2-1100001] LODEIRO, ENRIQUE MARIANO [AR-B]', 'D', '', 'C', '24,80', '0', '0', '0', '', '', ''],
    ['', '', '1', '[2-1100002] MARTTOCCIA, VERONICA ISABEL [AR-B]', 'D', '', 'C', '22,35', '0', '0', '0', '', '', ''],
    ['', '', '2', '[2-1100003] CONTRERAS, YULIANA EDITH [AR-B]', 'D', '', 'C', '12,80', '0', '0', '0', '', '', '']
  ];
}
const PAR_SIN_TITULAR = [
  { n: 'LODEIRO, ENRIQUE MARIANO', pb: 24.8 },
  { n: 'MARTTOCCIA, VERONICA ISABEL', pb: 22.35 },
  { n: 'CONTRERAS, YULIANA EDITH', pb: 12.8 }
];

async function importarConBonos(page, { periodoBonos, volumen }) {
  return page.evaluate(async ({ rows, par, periodoBonos, volumen }) => {
    if (volumen == null) localStorage.removeItem('appi_bonos_v1');
    else localStorage.setItem('appi_bonos_v1', JSON.stringify({ ts: Date.now(), bonos: {
      dip: '2-98020174', nombre: 'SILVIA DEL VALLE TOLEDO', periodo: periodoBonos,
      acumulacion: [
        { c: '1', r: 'Volumen Personal', pb: String(volumen), pi: '0.00' },
        { c: '8', r: 'Lider', pb: '321.75', pi: '0.00' }
      ]
    } }));
    const api = window.__APPI_HISTORICO__;
    await api.importPSAResponse({
      periodo: '2026-10', errores: [],
      linea: { filas: rows, par, pb: par.reduce((sum, item) => sum + item.pb, 0) },
      garantiasOrg: { filas: [
        ['Nombre', 'DIP', 'Presentadas', 'Vencidas', '% Vencidas', 'Pendientes'],
        ['LODEIRO, ENRIQUE MARIANO', '2-1100001', '1', '0', '0', '0']
      ] },
      ingresos: { filas: [['Período Consultado Octubre - 2026'], ['Total de 0 ingresos']], resumen: '' }
    }, { period: '2026-10', deferCloud: true });
    const period = api.state.periods.find(item => item.id === '2026-10');
    return {
      volumenDelCierre: period.titular.pbPersonal,
      personal: api.simpleRankingList(period, 'personal').map(item => ({ nombre: item.person.nombre, pb: item.value })),
      pbPersonalVista: api.simpleScopeStats(period, 'personal').pb,
      fuente: api.fuenteVolumenPersonalTitular(period)
    };
  }, { rows: lineaSinTitular(), par: PAR_SIN_TITULAR, periodoBonos, volumen });
}

test('el titular aparece en el ranking aunque su PB venga sólo del Reporte de Bonos', async ({ page }) => {
  await abrirApp(page);
  const r = await importarConBonos(page, { periodoBonos: 'Octubre-2026', volumen: '47.65' });
  // La Línea Descendente no trae su PB...
  expect(r.volumenDelCierre == null || Number(r.volumenDelCierre) === 0).toBe(true);
  // ...pero el volumen personal del reporte de bonos sí, y encabeza el ranking.
  expect(r.personal[0]).toEqual({ nombre: 'SILVIA DEL VALLE TOLEDO', pb: 47.65 });
  expect(r.personal.map(item => item.nombre)).toContain('LODEIRO, ENRIQUE MARIANO');
  expect(r.pbPersonalVista).toBe(47.65);
});

test('el volumen de bonos de otro mes se usa sólo si el cierre no trae tu PB', async ({ page }) => {
  await abrirApp(page);
  // El caso real: cierre de octubre, Reporte de Bonos de noviembre y la Línea
  // Descendente sin el PB del titular. Tiene que aparecer igual.
  const r = await importarConBonos(page, { periodoBonos: 'Noviembre-2026', volumen: '47.65' });
  expect(r.volumenDelCierre == null || Number(r.volumenDelCierre) === 0).toBe(true);
  expect(r.personal[0]).toEqual({ nombre: 'SILVIA DEL VALLE TOLEDO', pb: 47.65 });
  expect(r.pbPersonalVista).toBe(47.65);
  // ...y la app explica de dónde salió el número, sin ocultarlo.
  expect(r.fuente).toEqual({ origen: 'bonos', etiqueta: 'Noviembre-2026', mismoMes: false });
});

test('si el cierre ya trae el PB del titular, el reporte de bonos no lo pisa', async ({ page }) => {
  await abrirApp(page);
  const r = await page.evaluate(async () => {
    localStorage.setItem('appi_bonos_v1', JSON.stringify({ ts: Date.now(), bonos: {
      dip: '2-98020174', nombre: 'SILVIA DEL VALLE TOLEDO', periodo: 'Noviembre-2026',
      acumulacion: [{ c: '1', r: 'Volumen Personal', pb: '99.90', pi: '0.00' }]
    } }));
    const api = window.__APPI_HISTORICO__;
    const rows = [
      ['DIP Nro : 2-98020174  Nombre y Apellido : SILVIA DEL VALLE TOLEDO  Socio : DIAZ,GERMAN EZEQUIEL  Sucursal : 2  Categoría : L  País : Argentina'],
      ['Período Consultado: Octubre - 2026'],
      ['', '', '', 'Nombre', 'Cat.', 'Teléfono', 'Estado', 'PB Mes Actual', '1°Mes Ant.', '2°Mes Ant.', '3°Mes Ant.', 'Alta', 'Cumpleaños', 'Correo'],
      ['', '', '0', '[2-98020174] SILVIA DEL VALLE TOLEDO [AR-B]', 'L', '', 'C', '30,00', '0', '0', '0', '', '', ''],
      ['', '', '1', '[2-1100001] LODEIRO, ENRIQUE MARIANO [AR-B]', 'D', '', 'C', '24,80', '0', '0', '0', '', '', '']
    ];
    const par = [{ n: 'SILVIA DEL VALLE TOLEDO', pb: 30 }, { n: 'LODEIRO, ENRIQUE MARIANO', pb: 24.8 }];
    await api.importPSAResponse({
      periodo: '2026-10', errores: [],
      linea: { filas: rows, par, pb: 54.8 },
      garantiasOrg: { filas: [
        ['Nombre', 'DIP', 'Presentadas', 'Vencidas', '% Vencidas', 'Pendientes'],
        ['LODEIRO, ENRIQUE MARIANO', '2-1100001', '1', '0', '0', '0']
      ] },
      ingresos: { filas: [['Período Consultado Octubre - 2026'], ['Total de 0 ingresos']], resumen: '' }
    }, { period: '2026-10', deferCloud: true });
    const period = api.state.periods.find(item => item.id === '2026-10');
    return {
      personal: api.simpleRankingList(period, 'personal').map(item => ({ nombre: item.person.nombre, pb: item.value })),
      fuente: api.fuenteVolumenPersonalTitular(period)
    };
  });
  // Vale lo del cierre (30), no los 99,90 de un reporte de otro mes.
  expect(r.personal[0]).toEqual({ nombre: 'SILVIA DEL VALLE TOLEDO', pb: 30 });
  expect(r.fuente.origen).toBe('cierre');
});

test('aunque el cierre no tenga bloque de titular, aparece con los datos de Bonos', async ({ page }) => {
  await abrirApp(page);
  const r = await importarConBonos(page, { periodoBonos: 'Noviembre-2026', volumen: '47.65' });
  const sinTitular = await page.evaluate(async () => {
    const api = window.__APPI_HISTORICO__;
    const period = api.state.periods.find(item => item.id === '2026-10');
    period.titular = {};                     // cierre viejo, guardado sin titular
    const lista = api.simpleRankingList(period, 'personal');
    return lista.map(item => ({ nombre: item.person.nombre, pb: item.value }));
  });
  expect(r.personal[0].nombre).toBe('SILVIA DEL VALLE TOLEDO');
  expect(sinTitular[0]).toEqual({ nombre: 'SILVIA DEL VALLE TOLEDO', pb: 47.65 });
});
