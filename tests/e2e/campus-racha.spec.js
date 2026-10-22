const { test, expect } = require('@playwright/test');
const { entrar } = require('./helpers/app-entrar.js');

// v646 · Al terminar una clase con banco se abren 3 preguntas originales de
// APPI (sin regalar el acierto: si errás no se revela la correcta). La racha
// cuenta días seguidos con al menos una clase completada.

const CAT_MOCK = {
  version: 1,
  generado: new Date().toISOString(),
  stats: { kits: 1, clases: 2, audios: 0, playlists: 0 },
  kits: [{
    slug: 'mock-racha', titulo: 'Programa de Capacitación Básica',
    secciones: [{
      titulo: 'M1 · Esencia PSA', url: '/listadoclases/9001',
      clases: [
        { titulo: 'M1 - Bloque 1: Misión, Visión y Valores',
          url: '/curso/modulo-1-esencia-psa/video/m1-bloque-1-mision-vision-y-valores',
          stream: 'V_11111', duracion: '05:10' },
        { titulo: 'Clase sin banco', url: '/tematica/mock/sin-banco', stream: 'V_11112', duracion: '04:00' }
      ]
    }]
  }],
  playlists: [],
  vivo: []
};

const json = (route, status, body) => route.fulfill({
  status,
  headers: { 'access-control-allow-origin': '*', 'content-type': 'application/json' },
  body: JSON.stringify(body)
});

const contenidoCargado = page => page.waitForFunction(
  () => !!(window.APPICampusPSA && typeof window.APPICampusPSA.contenido === 'function' && window.APPICampusPSA.contenido()),
  null, { timeout: 15000 }
);

const cargarMock = async page => {
  await page.route('https://mock.supabase.co/functions/v1/campus-contenido', route => json(route, 200, { cont: CAT_MOCK }));
  await contenidoCargado(page);
  await page.evaluate(() => {
    localStorage.removeItem('appi_campus_contenido_v1');
    return window.APPICampusPSA.reintentarContenido().then(c => !!(c && c.kits), () => false);
  });
};

test('el banco cubre 50 clases y da 3 preguntas por clase con opciones válidas', async ({ page }) => {
  await entrar(page);
  const r = await page.evaluate(() => {
    const w = window.APPICampusPreguntas;
    const claves = Object.keys(w.banco);
    let preguntas = 0, malas = 0;
    claves.forEach(k => w.banco[k].forEach(p => {
      preguntas++;
      if (!Array.isArray(p[1]) || p[1].length !== 4) malas++;
      if (typeof p[2] !== 'number' || p[2] < 0 || p[2] > 3) malas++;
    }));
    const primera = w.preguntasDeClase('/curso/modulo-1-esencia-psa/video/m1-bloque-1-mision-vision-y-valores');
    const sinBanco = w.preguntasDeClase('/tematica/mock/que-no-existe');
    return { claves: claves.length, preguntas, malas,
      primeraLen: primera && primera.length, primeraOpciones: primera && primera[0].opciones.length,
      sinBanco: sinBanco };
  });

  expect(r.claves, 'el banco cubre ~50 clases de la ruta').toBeGreaterThanOrEqual(40);
  expect(r.preguntas, 'hay 3 preguntas por clase').toBeGreaterThanOrEqual(120);
  expect(r.malas, 'ninguna pregunta malformada').toBe(0);
  expect(r.primeraLen, '3 preguntas por clase').toBe(3);
  expect(r.primeraOpciones, '4 opciones').toBe(4);
  expect(r.sinBanco, 'clase sin banco → null (queda vista ✓) ').toBeNull();
});

test('la clase con banco abre el quiz al terminar y no regala el acierto', async ({ page }) => {
  await entrar(page);
  await cargarMock(page);

  const clase = await page.evaluate(() =>
    window.APPICampusPSA.clases().find(c => c.url.indexOf('m1-bloque-1') >= 0));

  // Simula llegar al 90% de la clase (mismo disparador del reproductor).
  await page.evaluate(cl => window.APPICampusPSA.marcarVisto(cl.id, 90, 'video'), clase);
  await page.evaluate(cl => window.APPICampusPSA.ofrecerPostVideo(cl.id, 'video'), clase);

  await expect(page.locator('#campusPsaOverlay')).toHaveClass(/open/);
  await expect(page.locator('.cp-question')).toBeVisible();
  await expect(page.locator('#cpPvCount')).toContainText('1/3');

  // Errar la primera no revela cuál era la correcta: sólo la elegida queda mal.
  const correcta = await page.evaluate(() =>
    window.APPICampusPreguntas.preguntasDeClase('/curso/modulo-1-esencia-psa/video/m1-bloque-1-mision-vision-y-valores')[0].correcta);
  const mala = correcta === 0 ? 1 : 0;
  await page.locator(`[data-pv-answer="${mala}"]`).click();
  await expect(page.locator('[data-pv-answer].wrong')).toHaveCount(1);
  await expect(page.locator('[data-pv-answer].correct'), 'no se regala la correcta').toHaveCount(0);
  await expect(page.locator('#cpPvNext')).toContainText('Reintentar');

  // Reintentar y acertar avanza de pregunta.
  await page.locator('#cpPvNext').click();
  await page.locator(`[data-pv-answer="${correcta}"]`).click();
  await expect(page.locator('[data-pv-answer].correct')).toHaveCount(1);
  await expect(page.locator('#cpPvNext')).toContainText('Seguir');
});

test('al terminar las 3 preguntas se registra la clase, la racha y la felicitación', async ({ page }) => {
  await entrar(page);
  await cargarMock(page);

  const r = await page.evaluate(() => {
    const c = window.APPICampusPSA;
    const hoy = new Date();
    const ayer = new Date(hoy.getTime() - 86400000);
    const key = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    // Simula que ayer ya había clase: hoy encadena el 2° día.
    const store = JSON.parse(localStorage.getItem('appi_campus_psa_v1_' + ((window.APPIAuth && window.APPIAuth.userId && window.APPIAuth.userId()) || 'local')) || '{}');
    store.racha = { dias: { [key(ayer)]: 1 }, max: 1 };
    localStorage.setItem('appi_campus_psa_v1_' + ((window.APPIAuth && window.APPIAuth.userId && window.APPIAuth.userId()) || 'local'), JSON.stringify(store));

    const antes = c.rachaDeClases();
    const reg = c.registrarClaseCompleta();
    const despues = c.rachaDeClases();
    return { antesAntes: antes.actual, reg: reg.actual, despues: despues.actual, hoyHecha: despues.hoyHecha, max: despues.max, chip: c.chipRacha() };
  });

  expect(r.antesAntes, 'ayer había 1 día').toBe(1);
  expect(r.reg, 'hoy encadena el 2° día').toBe(2);
  expect(r.despues).toBe(2);
  expect(r.hoyHecha, 'hoy queda marcada').toBe(true);
  expect(r.max).toBe(2);
  expect(r.chip, 'el chip de Mi capacitación muestra la racha').toContain('2 días seguidos');
});

test('la racha se corta si falto un día, y la tarjeta del mazo avisa falta 1 clase', async ({ page }) => {
  await entrar(page);
  await cargarMock(page);

  const cortada = await page.evaluate(() => {
    const c = window.APPICampusPSA;
    const uid = (window.APPIAuth && window.APPIAuth.userId && window.APPIAuth.userId()) || 'local';
    const k = 'appi_campus_psa_v1_' + uid;
    const hace3 = new Date(Date.now() - 3 * 86400000);
    const key = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const store = JSON.parse(localStorage.getItem(k) || '{}');
    store.racha = { dias: { [key(hace3)]: 4 }, max: 4 };
    localStorage.setItem(k, JSON.stringify(store));
    return c.rachaDeClases().actual;
  });
  expect(cortada, 'sin días consecutivos recientes la racha queda en 0').toBe(0);

  // Con racha viva y HOY sin clase, el mazo avisa que falta 1.
  const tarjeta = await page.evaluate(() => {
    const c = window.APPICampusPSA;
    const uid = (window.APPIAuth && window.APPIAuth.userId && window.APPIAuth.userId()) || 'local';
    const k = 'appi_campus_psa_v1_' + uid;
    const ayer = new Date(Date.now() - 86400000);
    const key = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const store = JSON.parse(localStorage.getItem(k) || '{}');
    store.racha = { dias: { [key(ayer)]: 1 }, max: 1 };
    localStorage.setItem(k, JSON.stringify(store));
    return window.APPIHomeTarjetas.tarjetaRacha();
  });

  expect(tarjeta, 'la tarjeta aparece con racha viva').not.toBeNull();
  expect(tarjeta.cat).toBe('racha');
  expect(tarjeta.titulo).toBe('Te falta 1 clase para mantener la racha');
  expect(tarjeta.html).toContain('1 día seguido');
});
