const { test, expect } = require('@playwright/test');
const fs = require('fs');

/* Solo la planilla del titular (v291): el reporte de Garantías por
   Organización no trae el DIP del titular, así que se valida por contenido.
   Una planilla ajena (sus DIP no están en la Línea Descendente) se rechaza
   entera, en vez de ignorar sus filas en silencio. */

test.describe('garantiasPlanillaAjena · la planilla tiene que ser del titular', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/index.html'); });

  const evaluar = (page, personas, mapa) => page.evaluate(
    ([p, m]) => window.garantiasPlanillaAjena(p, m), [personas, mapa]
  );

  test('rechaza una planilla de otro distribuidor: ningún DIP coincide', async ({ page }) => {
    const personas = [{ codigo: '11111' }, { codigo: '22222' }, { codigo: '33333' }];
    const mapa = { '90001': {}, '90002': {}, '90003': {}, '90004': {}, '90005': {} };
    expect(await evaluar(page, personas, mapa)).toBe(true);
  });

  test('rechaza cuando casi ningún DIP coincide (menos del 20%)', async ({ page }) => {
    const personas = [{ codigo: '11111' }];
    const mapa = Object.fromEntries(
      ['11111', '90001', '90002', '90003', '90004', '90005', '90006', '90007', '90008', '90009']
        .map(d => [d, {}])
    );
    expect(await evaluar(page, personas, mapa)).toBe(true);
  });

  test('acepta la planilla propia aunque no coincida al 100%', async ({ page }) => {
    const personas = [{ codigo: '11111' }, { codigo: '22222' }, { codigo: '33333' }, { codigo: '44444' }];
    const mapa = { '11111': {}, '22222': {}, '33333': {}, '55555': {} };
    expect(await evaluar(page, personas, mapa)).toBe(false);
  });

  test('acepta una planilla chica si al menos un DIP es del equipo', async ({ page }) => {
    const personas = [{ codigo: '11111' }, { codigo: '22222' }];
    const mapa = { '11111': {}, '99999': {} };
    expect(await evaluar(page, personas, mapa)).toBe(false);
  });

  test('una planilla sin registros no se marca como ajena: ya la frena el parser', async ({ page }) => {
    expect(await evaluar(page, [{ codigo: '11111' }], {})).toBe(false);
  });
});

test('la pantalla principal rechaza la planilla ajena antes de mezclar datos', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  expect(html).toContain('function garantiasPlanillaAjena');
  expect(html).toContain('Planilla de otro distribuidor');
  // El rechazo ocurre antes del cruce: primero se pregunta si es ajena.
  const handler = html.indexOf('garantiasPlanillaAjena(equipoData.personas');
  const cruce = html.indexOf('// Cruzar con el equipo existente');
  expect(handler).toBeGreaterThan(-1);
  expect(cruce).toBeGreaterThan(handler);
});

test('el Histórico valida las Garantías contra la Línea del mes en carga y cierre', () => {
  const js = fs.readFileSync('historico.js', 'utf8');
  expect(js).toContain('function validarGarantiasDelTitular');
  // Definición + dos controles en handleFile + el respaldo en normalizePeriod.
  expect(js.match(/validarGarantiasDelTitular\(/g).length).toBeGreaterThanOrEqual(4);
  expect(js).toMatch(/function normalizePeriod\([^)]*\)\{\n\s*validarGarantiasDelTitular/);
});
