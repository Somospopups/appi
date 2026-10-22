const { test, expect } = require('@playwright/test');
const { entrar } = require('./helpers/app-entrar.js');

test('el catálogo real carga, se busca y arma la ruta por contexto', async ({ page }) => {
  await entrar(page);

  const res = await page.evaluate(async () => {
    const c = window.APPICampusPSA;
    const cat = await c.cargarCatalogo();
    const clases = c.clases();
    return {
      kits: cat.kits.length,
      secciones: cat.kits.reduce((n, k) => n + (k.secciones || []).length, 0),
      clases: clases.length,
      conStream: clases.filter(cl => cl.stream).length,
      canje: c.buscar('canje').map(cl => ({ area: cl.area, titulo: cl.titulo })),
      canje2: (await c.cargarCatalogo()) ? c.buscar('canje').length : -1,
      rutaCanje: c.proximaClase('canje'),
      rutaVisita: c.proximaClase('visita'),
      avance: c.avanceResumen()
    };
  });

  expect(res.kits).toBeGreaterThanOrEqual(8);
  expect(res.secciones).toBeGreaterThanOrEqual(55);
  expect(res.clases).toBeGreaterThanOrEqual(190);
  expect(res.conStream).toBe(res.clases);
  expect(res.canje.length).toBeGreaterThan(0);
  expect(res.canje.every(c => /posventa/i.test(c.area))).toBe(true);
  expect(res.canje2).toBe(res.canje.length);
  expect(res.rutaCanje).toBeTruthy();
  expect(res.rutaCanje.area).toMatch(/Posventa/i);
  expect(res.rutaVisita).toBeTruthy();
  expect(res.rutaVisita.area).toMatch(/DIP/i);
  expect(res.avance.total).toBe(res.clases);

  const respaldo = await page.evaluate(() => {
    const guardado = JSON.parse(localStorage.getItem('appi_campus_catalogo_v1') || 'null');
    return guardado ? guardado.kits.length : 0;
  });
  expect(respaldo).toBe(res.kits);
});

test('la hoja Clase abre con título, chips y enlace al Campus', async ({ page }) => {
  await entrar(page);

  const clase = await page.evaluate(async () => {
    const c = window.APPICampusPSA;
    await c.cargarCatalogo();
    const lista = c.clases().filter(cl => /posventa/i.test(cl.area) && cl.stream);
    const cl = lista[0];
    c.abrirClase(cl);
    return { id: cl.id, titulo: cl.titulo, url: cl.url, duracion: cl.duracion };
  });

  await expect(page.locator('#campusPsaOverlay.open')).toBeVisible();
  await expect(page.locator('#cpClassTitle')).toHaveText(clase.titulo);
  await expect(page.locator('#cpClassState')).toContainText('por ver');
  await expect(page.locator('#cpClassVideo')).toBeVisible();
  await expect(page.locator('#cpClassVideo')).toHaveAttribute('data-stream', /\/HLS\/V_\d+\//);
  await expect(page.locator('#cpClassOpen')).toHaveAttribute('href', new RegExp(`^https://campus\\.psa\\.com\\.ar${clase.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  if (clase.duracion) await expect(page.locator('#cpClassState ~ .cp-chip').last()).toContainText(clase.duracion.slice(0, 2));

  await page.locator('#cpClassBack').click();
  await expect(page.locator('#campusPsaOverlay.open')).toHaveCount(0);
});

test('marcar vista cierra la hoja, guarda el avance y al reabrir queda "vista"', async ({ page }) => {
  await entrar(page);

  // Una clase SIN banco: marcarla a mano sólo guarda y cierra (v648).
  const id = await page.evaluate(async () => {
    const c = window.APPICampusPSA;
    await c.cargarCatalogo();
    const cl = c.clases().filter(x => x.stream && !c.preguntasDeClase(x.id))[0];
    c.abrirClase(cl);
    return cl.id;
  });

  await page.locator('#cpClassDone').click();
  await expect(page.locator('#campusPsaOverlay')).not.toHaveClass(/open/);

  const luego = await page.evaluate((idClase) => ({
    visto: window.APPICampusPSA.esVisto(idClase),
    pct: (window.APPICampusPSA.avanceDe(idClase) || {}).pct,
    clave: Object.keys(localStorage).filter(k => k.startsWith('appi_campus_psa_v1_')).length,
    blob: (() => {
      const k = Object.keys(localStorage).find(k => k.startsWith('appi_campus_psa_v1_'));
      if (!k) return null;
      const d = JSON.parse(localStorage.getItem(k) || '{}');
      return d.avance ? Object.keys(d.avance).length : 0;
    })()
  }), id);

  expect(luego.visto).toBe(true);
  expect(luego.pct).toBe(100);
  expect(luego.clave).toBeGreaterThan(0);
  expect(luego.blob).toBeGreaterThan(0);

  // Reabrir la misma clase: ya no aparece "por ver".
  await page.evaluate((idClase) => window.APPICampusPSA.abrirClase(
    window.APPICampusPSA.clases().find(x => x.id === idClase)), id);
  await expect(page.locator('#cpClassState')).toContainText('✓ vista');
  await expect(page.locator('#cpClassDone')).toBeDisabled();
});

test('marcar vista de una clase con banco reemplaza la hoja por el quiz (1/3)', async ({ page }) => {
  await entrar(page);

  // La hoja de clase está abierta cuando se marca: el quiz tiene que poder
  // tomar el popup igual (el guard viejo la frenaba y el quiz no se abría).
  await page.evaluate(async () => {
    const c = window.APPICampusPSA;
    await c.cargarCatalogo();
    const cl = c.clases().filter(x => x.stream && c.preguntasDeClase(x.id))[0];
    c.abrirClase(cl);
  });

  await page.locator('#cpClassDone').click();
  await expect(page.locator('#campusPsaOverlay')).toHaveClass(/open/);
  await expect(page.locator('#cpPvCount')).toContainText('1/3');
  await expect(page.locator('.cp-question')).toBeVisible();
});

test('el audio del Campus abre con su stream A_ y su estado', async ({ page }) => {
  await entrar(page);

  const audio = await page.evaluate(async () => {
    const c = window.APPICampusPSA;
    const cat = await c.cargarCatalogo();
    const lista = (cat.listas || cat.playlists || cat.audios || []).find(l => (l.audios || []).some(a => a.stream));
    if (!lista) return null;
    const a = (lista.audios || []).find(x => x.stream);
    c.abrirAudio(a, lista.titulo);
    return { titulo: a.titulo, stream: a.stream, audioId: a.audioId };
  });

  test.skip(!audio, 'el catálogo no trae audios con stream');
  await expect(page.locator('#campusPsaOverlay.open')).toBeVisible();
  await expect(page.locator('#cpClassTitle')).toHaveText(audio.titulo);
  await expect(page.locator('#cpClassState')).toContainText('por escuchar');
  await expect(page.locator('#cpClassAudio')).toHaveAttribute('data-stream', new RegExp(`/HLS/${audio.stream}/`));
  await expect(page.locator('#cpClassOpen')).toHaveAttribute('href', /campus\.psa\.com\.ar/);
});
