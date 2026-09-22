const { test, expect } = require('@playwright/test');
const { entrar, ddmmyyyy, dias } = require('./helpers/app-entrar.js');

function usuariosParaImpulso() {
  return Array.from({ length: 13 }, (_, i) => ({
    id: i + 1,
    usuario: `CLIENTE CAMPUS ${String(i + 1).padStart(2, '0')}`,
    telf: `351555${String(2200 + i)}`,
    localidad: 'Córdoba', producto: 'PSA Vero',
    fCompra: ddmmyyyy(-400), fVenceRaw: ddmmyyyy(i + 1), fVence: dias(i + 1), estado: 'vigente'
  }));
}

test('Campus PSA para Líder de Equipo celebra las 10 acciones y habilita 3 más con 5 aciertos', async ({ page }) => {
  await entrar(page, { usuarios: usuariosParaImpulso() });

  // El perfil del distribuidor determina el itinerario: no se consulta Campus
  // ni se guardan credenciales externas; el desafío es contenido APPI local.
  await page.evaluate(() => {
    localStorage.setItem('appi_dip_perfil_v1', JSON.stringify({
      ts: Date.now(), perfil: { categoria: 'LÍDER DE EQUIPO' }
    }));
    window.openCampusPSA();
  });
  await expect(page.locator('#view-campus')).toHaveClass(/active/);
  await expect(page.locator('#campusCont')).toContainText('Líder de Equipo');
  await expect(page.locator('#campusCont')).toContainText('Construcción de equipos sólidos');

  const before = await page.evaluate(() => ({
    base: window.APPIMensajes.resumenBaseHoy(),
    today: window.APPIMensajes.resumenHoy(),
    cupo: window.APPIMensajes.cupoHoy()
  }));
  expect(before.base.total).toBe(10);
  expect(before.today.total).toBe(10);
  expect(before.cupo).toBe(10);

  // Se completan únicamente las diez de la lista base: eso debe abrir la
  // celebración, pero todavía no puede ampliar el cupo por sí solo.
  await page.evaluate(() => {
    const m = window.APPIMensajes;
    m.deHoy(10).forEach(g => g.gente.forEach(u => m.marcarAccion(g.motivo.id, u, 'hecha', true)));
  });
  await expect(page.locator('#campusPsaOverlay.open')).toBeVisible();
  await expect(page.locator('#campusPsaOverlay')).toContainText('¡Día cumplido!');
  await page.locator('#cpStartQuiz').click();

  // Respuestas correctas del itinerario original de Líder de Equipo.
  for (const answer of [1, 2, 1, 1, 2]) {
    await page.locator(`[data-cp-answer="${answer}"]`).click();
    await expect(page.locator('#cpFeedback')).toContainText('¡Muy bien!');
    await page.locator('#cpNext').click();
  }

  await expect(page.locator('#campusPsaOverlay')).toContainText('¡Impulso');
  await expect(page.locator('#campusPsaOverlay')).toContainText('10 → hasta 13 acciones');
  const after = await page.evaluate(() => ({
    unlocked: window.APPICampusPSA.retoDesbloqueado(),
    base: window.APPIMensajes.resumenBaseHoy(),
    today: window.APPIMensajes.resumenHoy(),
    cupo: window.APPIMensajes.cupoHoy()
  }));
  expect(after.unlocked).toBe(true);
  expect(after.base.total).toBe(10);
  expect(after.base.hechas).toBe(10);
  expect(after.cupo).toBe(13);
  expect(after.today.total).toBe(13);
  expect(after.today.hechas).toBe(10);
});

test('un error no regala un acierto: permite reintentar la misma pregunta', async ({ page }) => {
  await entrar(page, { usuarios: usuariosParaImpulso() });
  await page.evaluate(() => {
    localStorage.setItem('appi_dip_perfil_v1', JSON.stringify({ ts: Date.now(), perfil: { categoria: 'LÍDER DE EQUIPO' } }));
    const m = window.APPIMensajes;
    m.deHoy(10).forEach(g => g.gente.forEach(u => m.marcarAccion(g.motivo.id, u, 'hecha', true)));
  });
  await expect(page.locator('#cpStartQuiz')).toBeVisible();
  await page.locator('#cpStartQuiz').click();
  await page.locator('[data-cp-answer="0"]').click();
  await expect(page.locator('#cpFeedback')).toContainText('Casi, mirá esto:');
  await expect(page.locator('#cpNext')).toHaveText('Reintentar esta pregunta');
  await page.locator('#cpNext').click();
  await expect(page.locator('.cp-q-count')).toHaveText('0 / 5');
  await expect(page.locator('[data-cp-answer="1"]')).toBeEnabled();
});
