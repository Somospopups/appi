const { test, expect } = require('@playwright/test');
const { entrar } = require('./helpers/app-entrar.js');

// v645 · El Vivo PSA se transmite todos los miércoles a las 15:00 (ART) en el
// Campus. APPI lo ubica por fecha en la agenda, avisa en el mazo el miércoles
// con su previa y, cuando ya pasó, muestra la sección de replay.

const MIERCOLES_14 = new Date(2026, 9, 21, 14, 0, 0); // mié 21/10 14:00 (antes del vivo)
const MIERCOLES_1530 = new Date(2026, 9, 21, 15, 30, 0); // en vivo
const MIERCOLES_17 = new Date(2026, 9, 21, 17, 0, 0); // vivo terminado → replay
const JUEVES = new Date(2026, 9, 22, 10, 0, 0); // día siguiente → próximo

const CAT_MOCK = {
  version: 1,
  generado: new Date().toISOString(),
  stats: { kits: 1, clases: 1, audios: 1, playlists: 1 },
  kits: [{
    slug: 'mock-vivo', titulo: 'Kit Mock Vivo',
    secciones: [{ titulo: 'Sección Mock', url: '/tematica/mock', clases: [
      { titulo: 'Clase Mock', url: '/tematica/mock/1', stream: 'V_11111', duracion: '05:10' }
    ] }]
  }],
  playlists: [{ slug: 'la-previa-del-vivo', titulo: 'La Previa del Vivo', descripcion: 'Previas', audios: [
    { titulo: 'LA PREVIA DEL VIVO 21/10 | Tema de prueba', audioId: 999, stream: 'A_99999' }
  ] }],
  vivo: [{ equipo: 'Equipo Mock', titulo: 'Reunión de Equipo', inicio: '30-06 15:00', fin: '30-06 16:00' }]
};

const json = (route, status, body) => route.fulfill({
  status,
  headers: { 'access-control-allow-origin': '*', 'content-type': 'application/json' },
  body: JSON.stringify(body)
});

const catalogoCargado = page => page.waitForFunction(
  () => !!(window.APPICampusPSA && typeof window.APPICampusPSA.catalogo === 'function' && window.APPICampusPSA.catalogo()),
  null, { timeout: 15000 }
);

test('la lógica del Vivo PSA ubica hoy, en vivo, replay y próximo según el día y la hora', async ({ page }) => {
  await entrar(page);
  await catalogoCargado(page);

  const estados = await page.evaluate((fechas) => {
    const f = s => new Date(s);
    return {
      antes: window.APPICampusPSA.proximoVivoPsa(f(fechas.antes)).estado,
      enVivo: window.APPICampusPSA.proximoVivoPsa(f(fechas.enVivo)).estado,
      pasado: window.APPICampusPSA.proximoVivoPsa(f(fechas.pasado)).estado,
      jueves: window.APPICampusPSA.proximoVivoPsa(f(fechas.jueves)).estado,
      iniEsMiercoles: window.APPICampusPSA.proximoVivoPsa(f(fechas.jueves)).ini.getDay() === 3
    };
  }, {
    antes: MIERCOLES_14.toISOString(),
    enVivo: MIERCOLES_1530.toISOString(),
    pasado: MIERCOLES_17.toISOString(),
    jueves: JUEVES.toISOString()
  });

  expect(estados.antes).toBe('hoy');
  expect(estados.enVivo).toBe('vivo');
  expect(estados.pasado).toBe('pasado');
  expect(estados.jueves).toBe('proximo');
  expect(estados.iniEsMiercoles, 'el próximo vivo cae siempre un miércoles').toBe(true);
});

test('la previa del vivo se elige por la fecha del vivo, con respaldo al audio más reciente', async ({ page }) => {
  await entrar(page);
  await page.route('https://mock.supabase.co/functions/v1/campus-catalogo', route => json(route, 200, { cat: CAT_MOCK }));
  await catalogoCargado(page);
  await page.evaluate(() => {
    localStorage.removeItem('appi_campus_catalogo_v1');
    return window.APPICampusPSA.reintentarCatalogo().then(c => !!(c && c.kits), () => false);
  });

  const r = await page.evaluate(() => {
    const c = window.APPICampusPSA;
    const miercoles = new Date(2026, 9, 21, 15, 0, 0); // 21/10
    const otroDia = new Date(2026, 10, 4, 15, 0, 0);  // 04/11, sin previa exacta
    const exacta = c.audioPreviaVivo(miercoles);
    const fallback = c.audioPreviaVivo(otroDia);
    return {
      exactaTitulo: exacta && exacta.titulo,
      exactaStream: exacta && exacta.stream,
      fallbackStream: fallback && fallback.stream
    };
  });

  expect(r.exactaTitulo).toContain('21/10');
  expect(r.exactaStream).toBe('A_99999');
  expect(r.fallbackStream, 'sin previa exacta usa la más reciente').toBe('A_99999');
});

test('el miércoles antes del vivo: tarjeta en el mazo y sección en Campus con previa y Entrar al vivo', async ({ page }) => {
  await entrar(page);
  await page.route('https://mock.supabase.co/functions/v1/campus-catalogo', route => json(route, 200, { cat: CAT_MOCK }));
  await catalogoCargado(page);
  // Con copia local el refresco es en 2º plano: se limpia y se reintenta para
  // que el catálogo de la nube (con la previa del 21/10) pase a ser el activo.
  await page.evaluate(() => {
    localStorage.removeItem('appi_campus_catalogo_v1');
    return window.APPICampusPSA.reintentarCatalogo().then(c => !!(c && c.kits), () => false);
  });

  await page.clock.setFixedTime(MIERCOLES_14);

  // El mazo vive en la vista Home: se abre con Home activo.
  await page.evaluate(() => window.APPIHomeTarjetas.abrir());
  await expect(page.locator('#htOverlay')).toBeVisible();
  const card = page.locator('.ht-card.ht-cat-vivoPsa');
  await expect(card).toHaveCount(1);
  await expect(card).toContainText('Hoy 15:00 · Vivo PSA');
  await expect(card).toContainText('21/10');

  // La vista de Campus muestra la sección del vivo con la misma previa.
  await page.evaluate(() => window.openCampusPSA());
  await expect(page.locator('#view-campus')).toHaveClass(/active/);
  const seccion = page.locator('#campusCont [data-cp-vpsa="hoy"]');
  await expect(seccion).toBeVisible();
  await expect(seccion).toContainText('Hoy 15:00 · Vivo PSA');
  await expect(seccion.locator('.cp-vpsa-play')).toContainText('21/10');
  await expect(seccion.locator('.cp-vpsa-go')).toContainText('Entrar al vivo');
});

test('en vivo ahora la sección invita a entrar en directo; al pasar el vivo muestra el replay', async ({ page }) => {
  await entrar(page);
  await page.route('https://mock.supabase.co/functions/v1/campus-catalogo', route => json(route, 200, { cat: CAT_MOCK }));
  await catalogoCargado(page);
  await page.evaluate(() => {
    localStorage.removeItem('appi_campus_catalogo_v1');
    return window.APPICampusPSA.reintentarCatalogo().then(c => !!(c && c.kits), () => false);
  });

  await page.clock.setFixedTime(MIERCOLES_1530);
  await page.evaluate(() => window.openCampusPSA());
  const enVivo = page.locator('#campusCont [data-cp-vpsa="vivo"]');
  await expect(enVivo).toBeVisible();
  await expect(enVivo).toContainText('En vivo ahora');
  await expect(enVivo.locator('.cp-vpsa-go')).toContainText('Entrar al vivo');

  await page.clock.setFixedTime(MIERCOLES_17);
  await page.evaluate(() => window.APPICampusPSA.render());
  const replay = page.locator('#campusCont [data-cp-vpsa="pasado"]');
  await expect(replay).toBeVisible();
  await expect(replay).toContainText('El Vivo de hoy ya está disponible');
  await expect(replay.locator('.cp-vpsa-go')).toContainText('Ver en Campus');
});
