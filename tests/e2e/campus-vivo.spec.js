const { test, expect } = require('@playwright/test');
const { entrar } = require('./helpers/app-entrar.js');

// v645 · El Vivo PSA se transmite todos los miércoles a las 15:00 (ART) en el
// Campus. APPI lo ubica por fecha: avisa con su previa antes del directo y,
// mientras dura la transmisión, ofrece verlo acá mismo.
// v654 · El player de la transmisión viene en el contenido (vivoPlayer) y el
// vivo se reproduce adentro de APPI: los links al sitio dejaron de existir.
// v655 · El Vivo PSA existe sólo el miércoles: en cuanto termina el directo —
// y el resto de la semana — no queda tarjeta, ni replay, ni "Vivos
// anteriores": la grabación publicada no siempre existe.

const MIERCOLES_14 = new Date(2026, 9, 21, 14, 0, 0); // mié 21/10 14:00 (antes del vivo)
const MIERCOLES_1530 = new Date(2026, 9, 21, 15, 30, 0); // en vivo
const MIERCOLES_17 = new Date(2026, 9, 21, 17, 0, 0); // vivo terminado → ya no existe
const JUEVES = new Date(2026, 9, 22, 10, 0, 0); // día siguiente → nada
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
  vivo: [{ equipo: 'Equipo Mock', titulo: 'Reunión de Equipo', inicio: '30-06 15:00', fin: '30-06 16:00' }],
  vivoPlayer: { embed: 'https://www.youtube-nocookie.com/embed/live_MOCK21?rel=0' }
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

// Con copia local el refresco es en 2º plano: se limpia y se reintenta para
// que el contenido mock (con las previas del 21/10 y 28/10) sea el activo.
const activarContenidoMock = async page => {
  await page.route('https://mock.supabase.co/functions/v1/campus-contenido', route => json(route, 200, { cont: CAT_MOCK }));
  await contenidoCargado(page);
  await page.evaluate(() => {
    localStorage.removeItem('appi_campus_contenido_v1');
    return window.APPICampusPSA.reintentarContenido().then(c => !!(c && c.kits), () => false);
  });
};

test('la lógica del Vivo PSA ubica hoy, en vivo, replay y próximo según el día y la hora', async ({ page }) => {
  await entrar(page);
  await contenidoCargado(page);

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
  await page.route('https://mock.supabase.co/functions/v1/campus-contenido', route => json(route, 200, { cont: CAT_MOCK }));
  await contenidoCargado(page);
  await page.evaluate(() => {
    localStorage.removeItem('appi_campus_contenido_v1');
    return window.APPICampusPSA.reintentarContenido().then(c => !!(c && c.kits), () => false);
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
  expect(r.fallbackStream, 'sin previa exacta usa la más reciente').toBe('A_88888');
});

test('el miércoles antes del vivo: tarjeta en el mazo, sección con previa y sin link al sitio', async ({ page }) => {
  await entrar(page);
  await page.route('https://mock.supabase.co/functions/v1/campus-contenido', route => json(route, 200, { cont: CAT_MOCK }));
  await contenidoCargado(page);
  // Con copia local el refresco es en 2º plano: se limpia y se reintenta para
  // que el contenido de la nube (con la previa del 21/10) pase a ser el activo.
  await page.evaluate(() => {
    localStorage.removeItem('appi_campus_contenido_v1');
    return window.APPICampusPSA.reintentarContenido().then(c => !!(c && c.kits), () => false);
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
  await expect(seccion, 'antes del vivo sólo avisa: sin link al sitio').toContainText('El vivo arranca a las 15:00');
  await expect(seccion.locator('.cp-vpsa-go')).toHaveCount(0);

  // El▶ de la previa abre SU audio (21/10) directo, sin pasar por el sitio.
  await seccion.locator('.cp-vpsa-play').click();
  await expect(page.locator('#cpClassTitle')).toBeVisible();
  await expect(page.locator('#cpClassTitle')).toContainText('21/10');
  await page.locator('#cpClassBack').click();

  // v655: no hay "Vivos anteriores" ni replay de la semana pasada.
  await expect(page.locator('#campusCont [data-cp-vpsa="ultimo"]')).toHaveCount(0);
  await expect(page.locator('#campusCont')).not.toContainText('Vivos anteriores');
});

test('en vivo ahora la sección invita a entrar en directo; al terminar, la tarjeta desaparece', async ({ page }) => {
  await entrar(page);
  await page.route('https://mock.supabase.co/functions/v1/campus-contenido', route => json(route, 200, { cont: CAT_MOCK }));
  await contenidoCargado(page);
  await page.evaluate(() => {
    localStorage.removeItem('appi_campus_contenido_v1');
    return window.APPICampusPSA.reintentarContenido().then(c => !!(c && c.kits), () => false);
  });

  await page.clock.setFixedTime(MIERCOLES_1530);
  await page.evaluate(() => window.openCampusPSA());
  const enVivo = page.locator('#campusCont [data-cp-vpsa="vivo"]');
  await expect(enVivo).toBeVisible();
  await expect(enVivo).toContainText('En vivo ahora');
  // v654: en directo el▶ abre el player acá mismo; el link al sitio no existe.
  await expect(enVivo.locator('.cp-vpsa-play')).toContainText('Ver el vivo ahora');
  await expect(enVivo.locator('.cp-vpsa-go')).toHaveCount(0);
  await page.route('**/*youtube*', r => r.abort());
  await enVivo.locator('.cp-vpsa-play').click();
  await expect(page.locator('.cp-vivo-frame iframe')).toBeVisible();
  await page.locator('#cpVivoClose').click();
  await expect(page.locator('#campusPsaOverlay')).not.toHaveClass(/open/);
  await expect(page.locator('.cp-vivo-frame iframe')).not.toBeVisible();

  // v655: terminó el directo → ya no hay nada de vivo en la vista.
  await page.clock.setFixedTime(MIERCOLES_17);
  await page.evaluate(() => window.APPICampusPSA.render());
  await expect(page.locator('#campusCont [data-cp-vpsa="pasado"]')).toHaveCount(0);
  await expect(page.locator('#campusCont [data-cp-vpsa]'), 'sin replay: la tarjeta desaparece').toHaveCount(0);
  await expect(page.locator('#campusCont')).not.toContainText('Vivo PSA');
});

test('v655: del jueves al martes no queda nada de vivo; el miércoles siguiente vuelve el directo', async ({ page }) => {
  await entrar(page);
  await activarContenidoMock(page);

  await page.clock.setFixedTime(JUEVES);
  await page.evaluate(() => window.openCampusPSA());
  await expect(page.locator('#view-campus')).toHaveClass(/active/);

  // Ni anuncio del próximo vivo, ni replay, ni Vivos anteriores.
  await expect(page.locator('#campusCont [data-cp-vpsa]')).toHaveCount(0);
  await expect(page.locator('#campusCont [data-cp-vpsa="proximo"]')).toHaveCount(0);
  await expect(page.locator('#campusCont')).not.toContainText('Vivo PSA');
  await expect(page.locator('#campusCont')).not.toContainText('Vivos anteriores');

  // El martes a la noche sigue sin nada: recién el miércoles vuelve.
  await page.clock.setFixedTime(MARTES_20);
  await page.evaluate(() => window.APPICampusPSA.render());
  await expect(page.locator('#campusCont [data-cp-vpsa]')).toHaveCount(0);

  // Con el vivo siguiente en curso manda el directo.
  await page.clock.setFixedTime(MIERCOLES28_1530);
  await page.evaluate(() => window.APPICampusPSA.render());
  await expect(page.locator('#campusCont [data-cp-vpsa="vivo"]')).toBeVisible();
  await expect(page.locator('#campusCont [data-cp-vpsa="ultimo"]')).toHaveCount(0);
});

test('v649: repintar el Campus sin cambios no reemplaza el DOM (sin parpadeo)', async ({ page }) => {
  await entrar(page);
  await activarContenidoMock(page);

  await page.clock.setFixedTime(JUEVES);
  await page.evaluate(() => window.openCampusPSA());
  const fila = page.locator('#campusCont .cp-audio-row').first();
  await expect(fila).toBeVisible();

  // Se marca el nodo pintado: si el DOM se reconstruye, la marca se pierde.
  await page.evaluate(() => {
    const el = document.querySelector('#campusCont .cp-audio-row');
    el.setAttribute('data-marca649', 'queda');
    window.__nodo649 = el;
  });

  // La rafaga de eventos que en una cuenta real llega seguido (sync, estado,
  // render directo) ya no puede hacer titilar la pantalla: mismo nodo.
  await page.evaluate(() => {
    for (let i = 0; i < 5; i++) window.dispatchEvent(new CustomEvent('appi-datasync-applied'));
    window.APPICampusPSA.render();
    window.APPICampusPSA.render();
  });
  await page.waitForTimeout(400);
  const intacto = await page.evaluate(() => {
    const el = document.querySelector('#campusCont .cp-audio-row');
    return el === window.__nodo649 && el.getAttribute('data-marca649') === 'queda';
  });
  expect(intacto, 'el DOM del Campus no se reemplaza si nada cambio').toBe(true);

  // Un cambio real (avance nuevo) SI repinta: el nodo es otro y la fila del
  // audio 21/10 queda con su tilde de escuchado.
  await page.evaluate(() => window.APPICampusPSA.marcarVisto('audio:999', 100, 'audio'));
  await expect.poll(() => page.evaluate(() => {
    const el = document.querySelector('#campusCont .cp-audio-row');
    return !!el && el !== window.__nodo649;
  })).toBe(true);
  await expect(page.locator('#cpAudioLista')).toContainText('✓');
});
