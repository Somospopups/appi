const { test, expect } = require('@playwright/test');

// El catálogo del Campus PSA es el insumo de la ruta diaria de capacitación:
// si el workflow publica un JSON a medias, esta prueba lo frena antes de que
// la app proponga clases rotas.

test('campus-catalogo.json existe y trae el catálogo completo del Campus', async ({ request }) => {
  const response = await request.get('/campus-catalogo.json');
  expect(response.ok(), 'campus-catalogo.json debe publicarse en la raíz').toBe(true);
  const cat = await response.json();

  expect(cat.version).toBe(1);
  expect(new Date(cat.generado).toString()).not.toBe('Invalid Date');

  // Salvaguarda mínima (la misma que exige el script antes de escribir).
  expect(cat.stats.kits).toBe(9);
  expect(cat.stats.clases).toBeGreaterThanOrEqual(50);
  expect(cat.stats.audios).toBeGreaterThanOrEqual(10);
  expect(cat.stats.playlists).toBeGreaterThanOrEqual(5);
  expect(cat.kits.length).toBe(9);
  expect(cat.playlists.length).toBeGreaterThanOrEqual(5);

  const streams = new Set();
  const urls = new Set();
  for (const kit of cat.kits) {
    expect(kit.slug, 'cada kit tiene slug').toBeTruthy();
    expect(kit.titulo, 'cada kit tiene título').toBeTruthy();
    expect(kit.secciones.length, `kit ${kit.slug} sin secciones`).toBeGreaterThan(0);
    for (const sec of kit.secciones) {
      expect(sec.titulo, `sección sin título en ${kit.slug}: ${sec.url}`).toBeTruthy();
      expect(sec.clases.length, `sección vacía: ${sec.url}`).toBeGreaterThan(0);
      for (const clase of sec.clases) {
        expect(clase.titulo, `clase sin título en ${sec.url}`).toBeTruthy();
        expect(clase.url).toMatch(/^\/(tematica|curso)\//);
        // Toda clase reproducible necesita su stream HLS público (V_XXXXX).
        expect(clase.stream, `clase sin stream: ${clase.url}`).toMatch(/^V_\d+$/);
        if (clase.duracion) expect(clase.duracion).toMatch(/^\d{1,2}:\d{2}$/);
        expect(urls.has(clase.url), `URL repetida: ${clase.url}`).toBe(false);
        urls.add(clase.url);
        streams.add(clase.stream);
      }
    }
  }
  // Sin duplicados: dos clases no pueden apuntar al mismo video.
  expect(streams.size).toBe(cat.stats.clases);

  for (const lista of cat.playlists) {
    expect(lista.slug).toBeTruthy();
    expect(lista.titulo).toBeTruthy();
    for (const audio of lista.audios) {
      expect(audio.titulo, `audio sin título en ${lista.slug}`).toBeTruthy();
      expect(audio.audioId, 'el audio necesita el id numérico del Campus (avance)').toBeGreaterThan(0);
      expect(audio.stream).toMatch(/^A_\d+$/);
    }
  }

  for (const vivo of cat.vivo) {
    expect(vivo.equipo, 'la agenda de vivo trae el equipo').toBeTruthy();
    expect(vivo.inicio).toMatch(/^\d{2}-\d{2}\s+\d{2}:\d{2}$/);
    expect(vivo.fin).toMatch(/^\d{2}-\d{2}\s+\d{2}:\d{2}$/);
  }
});

test('el buscador propio encuentra por lo que el Campus no encuentra (canje)', async ({ request }) => {
  const cat = await (await request.get('/campus-catalogo.json')).json();
  const buscar = (q) => {
    const texto = q.toLowerCase();
    const hits = [];
    for (const kit of cat.kits) for (const sec of kit.secciones) for (const c of sec.clases) {
      if ((c.titulo + ' ' + sec.titulo + ' ' + kit.titulo).toLowerCase().includes(texto)) {
        hits.push({ area: kit.titulo, seccion: sec.titulo, clase: c.titulo });
      }
    }
    return hits;
  };
  // El buscador del Campus para "canje" devuelve 0 cursos; el nuestro no.
  const canjes = buscar('canje');
  expect(canjes.length, 'debe haber al menos una clase de canjes').toBeGreaterThan(0);
  expect(canjes[0].area).toMatch(/Posventa/i);

  // Secciones esperadas por la ruta diaria (reglas de contexto del Home).
  expect(buscar('demostración').length + buscar('demostracion').length).toBeGreaterThan(0);
  expect(buscar('patrocinio').length).toBeGreaterThan(0);
});
