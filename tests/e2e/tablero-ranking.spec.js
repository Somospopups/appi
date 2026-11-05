const { test, expect } = require('@playwright/test');

// El ranking de ventas del Tablero (Mi negocio) se arma con la Línea
// Descendente, donde la fila del titular (nivel 0) no viene. Estas pruebas
// cuidan que el titular igual figure, con su volumen personal, y una sola vez.

const PERSONAS = [
  { codigo: '02-1000010', nombre: 'ROSALES, PETRONA DEL VALLE', cat: 'DC', pb: 252 },
  { codigo: '02-1000011', nombre: 'DIAZ, GERARDO DANIEL', cat: 'D', pb: 196 },
  { codigo: '02-1000001', nombre: 'LODEIRO, ENRIQUE MARIANO', cat: 'D', pb: 24.8 },
  { codigo: '02-1000002', nombre: 'MARTTOCCIA, VERONICA ISABEL', cat: 'D', pb: 22.35 },
  { codigo: '02-1000003', nombre: 'CONTRERAS, YULIANA EDITH', cat: 'D', pb: 12.8 }
];

function equipo({ pbTitular = 0, filaTitular = false } = {}) {
  const personas = PERSONAS.map((p, i) => ({
    id: i + 2, nivel: 1, codigo: p.codigo, nombre: p.nombre, cat: p.cat, tel: '', estado: 'C',
    pnAct: p.pb, m1: 0, m2: 0, m3: 0, alta: '', cumple: '', email: '', hijos: []
  }));
  if (filaTitular) {
    personas.push({
      id: 99, nivel: 0, codigo: '02-98020174', nombre: 'SILVIA DEL VALLE TOLEDO', cat: 'L', tel: '', estado: 'C',
      pnAct: pbTitular, m1: 0, m2: 0, m3: 0, alta: '', cumple: '', email: '', hijos: []
    });
  }
  return {
    titular: { dip: '02-98020174', nombre: 'SILVIA DEL VALLE TOLEDO', categoria: 'L', pbPersonal: pbTitular || undefined },
    raices: personas.map(p => ({ ...p })),
    personas
  };
}

const BONOS = {
  ts: Date.now(),
  bonos: {
    dip: '02-98020174', nombre: 'SILVIA DEL VALLE TOLEDO', periodo: 'Noviembre-2026',
    acumulacion: [
      { c: '1', r: 'Volumen Personal', pb: '47.65', pi: '0.00' },
      { c: '8', r: 'Lider', pb: '321.75', pi: '0.00' }
    ]
  }
};

async function abrirTablero(page, { equipoData, bonos = BONOS } = {}) {
  await page.addInitScript(({ equipoData, bonos }) => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('tutoVisto_v2', '1');
    localStorage.setItem('appi_tarjetas_auto', '0');
    localStorage.setItem('appi_aviso_psa_off', '1');
    localStorage.setItem('appi_notif_listo_v1', '1');
    localStorage.setItem('appi_avisos_ok', '1');
    localStorage.setItem('equipoData', JSON.stringify(equipoData));
    if (bonos) localStorage.setItem('appi_bonos_v1', JSON.stringify(bonos));
    else localStorage.removeItem('appi_bonos_v1');
  }, { equipoData, bonos });
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await page.evaluate(() => { if (typeof openEquipo === 'function') openEquipo(); });
  await page.waitForTimeout(900);
}

async function filasDelRanking(page) {
  return page.locator('.top-list .top-item').allInnerTexts();
}

test('el titular figura en el ranking personal del Tablero con su volumen personal', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  // La Línea Descendente no trae su fila; sí el "Volumen Personal" de Bonos.
  await abrirTablero(page, { equipoData: equipo() });
  const filas = await filasDelRanking(page);
  const suya = filas.find(f => f.includes('SILVIA DEL VALLE TOLEDO'));
  expect(suya).toBeTruthy();
  expect(suya).toContain('47.65');
  // Sin duplicarse y dentro del top.
  expect(filas.filter(f => f.includes('SILVIA DEL VALLE TOLEDO'))).toHaveLength(1);
  expect(filas[0]).toContain('ROSALES');
});

test('en Organización el titular aparece con lo suyo más toda su red', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await abrirTablero(page, { equipoData: equipo() });
  await page.evaluate(() => {
    const boton = document.querySelector('[data-topmode="organizacion"]');
    if (boton) boton.click();
  });
  await page.waitForTimeout(700);
  const filas = await filasDelRanking(page);
  const suya = filas.find(f => f.includes('SILVIA DEL VALLE TOLEDO'));
  expect(suya).toBeTruthy();
  // 47,65 propios + 507,95 de la red = 555,60.
  expect(suya.replace(/,/g, '.')).toContain('555.6');
  expect(filas[0]).toContain('SILVIA DEL VALLE TOLEDO');
});

test('si el cierre trae su PB, el reporte de bonos no lo pisa ni lo duplica', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  // Su fila llega dentro del equipo con PB 30: vale 30, no 47,65, y aparece una vez.
  await abrirTablero(page, { equipoData: equipo({ pbTitular: 30, filaTitular: true }) });
  const filas = await filasDelRanking(page);
  const suyas = filas.filter(f => f.includes('SILVIA DEL VALLE TOLEDO'));
  expect(suyas).toHaveLength(1);
  expect(suyas[0]).toContain('30');
  expect(suyas[0]).not.toContain('47.65');
});

test('sin volumen personal no se inventa un puesto', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await abrirTablero(page, { equipoData: equipo(), bonos: null });
  const filas = await filasDelRanking(page);
  expect(filas.some(f => f.includes('SILVIA DEL VALLE TOLEDO'))).toBe(false);
  expect(filas[0]).toContain('ROSALES');
});
