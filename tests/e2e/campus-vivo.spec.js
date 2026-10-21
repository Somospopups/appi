const { test, expect } = require('@playwright/test');
const { entrar } = require('./helpers/app-entrar.js');

// v645 · El Vivo PSA se transmite todos los miércoles a las 15:00 (ART) en el
// Campus. APPI lo ubica por fecha en la agenda, avisa en el mazo el miércoles
// con su previa y, cuando ya pasó, muestra la sección de replay.
// v648 · El último vivo queda en la sección "Vivos anteriores" del Campus
// toda la semana (hasta el próximo miércoles), no sólo la noche del vivo.

const MIERCOLES_14 = new Date(2026, 9, 21, 14, 0, 0); // mié 21/10 14:00 (antes del vivo)
const MIERCOLES_1530 = new Date(2026, 9, 21, 15, 30, 0); // en vivo
const MIERCOLES_17 = new Date(2026, 9, 21, 17, 0, 0); // vivo terminado → replay
const JUEVES = new Date(2026, 9, 22, 10, 0, 0); // día siguiente → próximo
const MARTES_20 = new Date(2026, 9, 27, 20, 0, 0); // mar 27/10: último día antes del próximo vivo
const MIERCOLES28_1530 = new Date(2026, 9, 28, 15, 30, 0); // mié 28/10: vivo siguiente en curso

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
    { titulo: 'LA PREVIA DEL VIVO 21/10 | Tema de prueba', audioId: 999, stream: 'A_99999' },
    { titulo: 'LA PREVIA DEL VIVO 28/10 | Tema siguiente', audioId: 1000, stream: 'A_88888' }
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

// Con copia local el refresco es en 2º plano: se limpia y se reintenta para
// que el catálogo mock (con las previas del 21/10 y 28/10) sea el activo.
const activarCatalogoMock = async page => {
  await page.route('https://mock.supabase.co/functions/v1/campus-catalogo', route => json(route, 200, { cat: CAT_MOCK }));
  await catalogoCargado(page);
  await page.evaluate(() => {
    localStorage.removeItem('appi_campus_catalogo_v1');
    return window.APPICampusPSA.reintentarCatalogo().then(c => !!(c && c.kits), () => false);
  });
};

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

test('v648: el último vivo es el miércoles ya terminado y dura toda la semana', async ({ page }) => {
  await entrar(page);
  await catalogoCargado(page);

  const ultimos = await page.evaluate((fechas) => {
    const f = s => new Date(s);
    const clave = ref => ({
      dia: ref.ini.getDate(), mes: ref.ini.getMonth() + 1, dow: ref.ini.getDay(),
      hora: ref.ini.getHours(), terminado: ref.terminado
    });
    const u = window.APPICampusPSA.ultimoVivoPsa;
    return {
      miercoles14: clave(u(f(fechas.antes))),
      enVivo: clave(u(f(fechas.enVivo))),
      miercoles17: clave(u(f(fechas.pasado))),
      jueves: clave(u(f(fechas.jueves))),
      martes: clave(u(f(fechas.martes))),
      miercoles28: clave(u(f(fechas.siguiente)))
    };
  }, {
    antes: MIERCOLES_14.toISOString(),
    enVivo: MIERCOLES_1530.toISOString(),
    pasado: MIERCOLES_17.toISOString(),
    jueves: JUEVES.toISOString(),
    martes: MARTES_20.toISOString(),
    siguiente: MIERCOLES28_1530.toISOString()
  });

  // El miércoles a la mañana, el último terminado es el de la semana pasada.
  expect(ultimos.miercoles14).toEqual({ dia: 14, mes: 10, dow: 3, hora: 15, terminado: true });
  // Durante la transmisión, el de hoy todavía no terminó.
  expect(ultimos.enVivo).toEqual({ dia: 21, mes: 10, dow: 3, hora: 15, terminado: false });
  // Desde que termina y hasta el martes siguiente, el último vivo es el 21/10.
  expect(ultimos.miercoles17).toEqual({ dia: 21, mes: 10, dow: 3, hora: 15, terminado: true });
  expect(ultimos.jueves).toEqual({ dia: 21, mes: 10, dow: 3, hora: 15, terminado: true });
  expect(ultimos.martes).toEqual({ dia: 21, mes: 10, dow: 3, hora: 15, terminado: true });
  // Recién con el vivo siguiente en curso, el "último" pasa a ser el 28/10.
  expect(ultimos.miercoles28).toEqual({ dia: 28, mes: 10, dow: 3, hora: 15, terminado: false });
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
    const exactaEstricta = c.audioPreviaVivo(miercoles, true);
    return {
      exactaTitulo: exacta && exacta.titulo,
      exactaStream: exacta && exacta.stream,
      fallbackStream: fallback && fallback.stream,
      exactaEstrictaStream: exactaEstricta && exactaEstricta.stream,
      sinExactaEstricta: c.audioPreviaVivo(otroDia, true) === null
    };
  });

  expect(r.exactaTitulo).toContain('21/10');
  expect(r.exactaStream).toBe('A_99999');
  expect(r.fallbackStream, 'sin previa exacta usa la más reciente').toBe('A_88888');
  // v648: el vivo anterior usa sólo su previa exacta, nunca la del próximo.
  expect(r.exactaEstrictaStream).toBe('A_99999');
  expect(r.sinExactaEstricta, 'sin previa de esa fecha no inventa otra').toBe(true);
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

  // v648: el vivo anterior (14/10) sigue a mano en Vivos anteriores. Como el
  // mock no trae la previa del 14/10, no le inventa la de hoy: va sin ▶.
  const anterior = page.locator('#campusCont [data-cp-vpsa="ultimo"]');
  await expect(anterior).toBeVisible();
  await expect(anterior).toHaveAttribute('data-cp-ultimo-vivo', '2026-10-14');
  await expect(anterior).toContainText('Último Vivo PSA');
  await expect(anterior.locator('.cp-vpsa-play')).toHaveCount(0);
  await expect(anterior.locator('.cp-vpsa-go')).toContainText('Ver en Campus');
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

test('v648: del jueves al martes el Campus conserva el último vivo para verlo cuando quieras', async ({ page }) => {
  await entrar(page);
  await activarCatalogoMock(page);

  await page.clock.setFixedTime(JUEVES);
  await page.evaluate(() => window.openCampusPSA());
  await expect(page.locator('#view-campus')).toHaveClass(/active/);

  // El anuncio del próximo vivo sigue estando...
  await expect(page.locator('#campusCont [data-cp-vpsa="proximo"]')).toBeVisible();
  // ...y la sección Vivos anteriores conserva el vivo del 21/10.
  await expect(page.locator('#campusCont')).toContainText('Vivos anteriores');
  const ultimo = page.locator('#campusCont [data-cp-vpsa="ultimo"]');
  await expect(ultimo).toBeVisible();
  await expect(ultimo).toHaveAttribute('data-cp-ultimo-vivo', '2026-10-21');
  await expect(ultimo).toContainText('Último Vivo PSA');
  await expect(ultimo).toContainText('mirala cuando quieras');
  await expect(ultimo).toHaveAttribute('data-cp-replay-stream', 'A_99999');
  await expect(ultimo.locator('.cp-vpsa-go')).toContainText('Ver en Campus');
  await expect(ultimo.locator('.cp-vpsa-go')).toHaveAttribute('href', 'https://campus.psa.com.ar/clases-en-vivo');

  // El ▶ del último vivo abre SU previa (21/10), no la del próximo (28/10):
  // cada botón se cablea con los datos de su propia tarjeta.
  await ultimo.locator('.cp-vpsa-play').click();
  await expect(page.locator('#cpClassTitle')).toBeVisible();
  await expect(page.locator('#cpClassTitle')).toContainText('21/10');
  await page.locator('#cpClassBack').click();

  // El martes a la noche sigue ahí: queda hasta el próximo vivo.
  await page.clock.setFixedTime(MARTES_20);
  await page.evaluate(() => window.APPICampusPSA.render());
  const sigue = page.locator('#campusCont [data-cp-vpsa="ultimo"]');
  await expect(sigue).toBeVisible();
  await expect(sigue).toHaveAttribute('data-cp-ultimo-vivo', '2026-10-21');

  // Con el vivo siguiente en curso manda el directo: sin duplicar replay.
  await page.clock.setFixedTime(MIERCOLES28_1530);
  await page.evaluate(() => window.APPICampusPSA.render());
  await expect(page.locator('#campusCont [data-cp-vpsa="ultimo"]')).toHaveCount(0);
  await expect(page.locator('#campusCont [data-cp-vpsa="vivo"]')).toBeVisible();
});
