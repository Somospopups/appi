const { test, expect } = require('@playwright/test');
const { entrar } = require('./helpers/app-entrar.js');

test('las reuniones internas de otros equipos del contenido no se muestran en APPI (v652)', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.APPICampusPSA.cargarContenido());
  await page.evaluate(() => window.openCampusPSA());

  // El contenido real de MI PSA trae la agenda del Campus llena de
  // "Reunión de Equipo" de equipos ajenos: son datos internos que no se
  // publican. APPI no lista esa sección ni ofrece agendarlas.
  const agenda = await page.evaluate(() => (window.APPICampusPSA.contenido().vivo || []).length);
  expect(agenda).toBeGreaterThan(0);
  await expect(page.locator('#cpVivo')).toHaveCount(0);
  await expect(page.locator('#campusCont')).not.toContainText('Próximos en vivo');
  await expect(page.locator('#campusCont')).not.toContainText('Reunión de Equipo');
});

test('los audios se listan por playlist y la hoja de audio abre con su stream', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.APPICampusPSA.cargarContenido());
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
    const cont = await c.cargarContenido();
    const a = cont.playlists[0].audios[0];
    c.marcarVisto('audio:' + a.audioId, 100, 'audio');
    c.abrir();
    return { id: 'audio:' + a.audioId, visto: c.esVisto('audio:' + a.audioId) };
  });
  expect(marcado.visto).toBe(true);
  await expect(page.locator('#cpAudioLista .cp-audio-row').first()).toContainText('✓');
});
