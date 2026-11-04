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
