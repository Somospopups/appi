const { test, expect } = require('@playwright/test');
const { entrar } = require('./helpers/app-entrar.js');

test('la agenda de vivo muestra las transmisiones y cada Agendar arma el evento de Google', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.APPICampusPSA.cargarCatalogo());
  await page.evaluate(() => window.openCampusPSA());

  await expect(page.locator('#cpVivo')).toBeVisible();
  const n = await page.locator('#cpVivo .cp-vivo-row').count();
  expect(n).toBeGreaterThan(0);
  expect(n).toBeLessThanOrEqual(4);
  await expect(page.locator('#cpVivo .cp-vivo-row').first()).toContainText('Equipo');

  const href = await page.locator('#cpVivo a[data-cp-agendar]').first().getAttribute('href');
  expect(href).toContain('https://calendar.google.com/calendar/render?action=TEMPLATE');
  expect(href).toContain('text=');
  expect(href).toContain('dates=');
  // Cada fila agenda su propio evento (no un link repetido genérico).
  const hrefs = await page.locator('#cpVivo a[data-cp-agendar]').evaluateAll(as => as.map(a => a.href));
  expect(new Set(hrefs).size).toBe(hrefs.length);
});

test('los audios se listan por playlist y la hoja de audio abre con su stream', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.APPICampusPSA.cargarCatalogo());
  await page.evaluate(() => window.openCampusPSA());

  await expect(page.locator('#cpAudioChips')).toBeVisible();
  const chips = await page.locator('#cpAudioChips .cp-audio-chip').count();
  expect(chips).toBe(10);
  await expect(page.locator('#cpAudioChips .cp-audio-chip.on')).toHaveCount(1);

  // La primera lista ya se listó sola.
  const filas = await page.locator('#cpAudioLista .cp-audio-row').count();
  expect(filas).toBeGreaterThan(0);

  // Cambiar de chip reescribe la lista.
  const segundoTitulo = await page.locator('#cpAudioChips .cp-audio-chip').nth(1).textContent();
  await page.locator('#cpAudioChips .cp-audio-chip').nth(1).click();
  await expect(page.locator('#cpAudioChips .cp-audio-chip').nth(1)).toHaveClass(/on/);
  const primero = await page.locator('#cpAudioLista .cp-audio-row').first().textContent();
  expect(primero.length).toBeGreaterThan(0);

  // El ▶ abre la hoja de audio con título y stream A_.
  const tituloEsperado = await page.locator('#cpAudioLista .cp-audio-row span').first().textContent();
  await page.locator('#cpAudioLista .cp-audio-row').first().click();
  await expect(page.locator('#campusPsaOverlay.open')).toBeVisible();
  await expect(page.locator('#cpClassTitle')).toHaveText(tituloEsperado.trim());
  await expect(page.locator('#cpClassAudio')).toHaveAttribute('data-stream', /\/HLS\/A_\d+\//);
});

test('un audio escuchado queda marcado con ✓ en la lista', async ({ page }) => {
  await entrar(page);
  const marcado = await page.evaluate(async () => {
    const c = window.APPICampusPSA;
    const cat = await c.cargarCatalogo();
    const a = cat.playlists[0].audios[0];
    c.marcarVisto('audio:' + a.audioId, 100, 'audio');
    c.abrir();
    return { id: 'audio:' + a.audioId, visto: c.esVisto('audio:' + a.audioId) };
  });
  expect(marcado.visto).toBe(true);
  await expect(page.locator('#cpAudioLista .cp-audio-row').first()).toContainText('✓');
});
