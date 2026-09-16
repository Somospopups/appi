const { test, expect } = require('@playwright/test');
const base = require('./hoy-lista-10.spec.js');
const fs = require('fs');
const path = require('path');

// v827 · TARJETA "TU GANANCIA" (SOLO PARA EL DISTRIBUIDOR):
// al abrir el Presupuesto (sheet de la Lista de precios), ARRIBA de las líneas
// aparece un bloque PRIVADO con la ganancia del presupuesto usando la columna
// de costo de SU cuenta (perfil sincronizado desde PSA) y las listas oficiales
// (psa-ganancias.json). Botón para enviársela a SU WhatsApp. NUNCA va al PDF
// del cliente. La función consulta-serial (action 'perfil') va mockeada.

const GAN = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'psa-ganancias.json'), 'utf8'));

const PERFIL = {
  categoria: 'LIDER DE EQUIO',
  tributaria: 'Responsable inscripto',
  telefono: '+543513102865',
  saldo: 2728.01,
  ultimaDevolucion: { fecha: '01/08/2026', importe: 431532.92 },
  ts: new Date().toISOString()
};

function initComun(cart, perfil) {
  return (page) => page.addInitScript((a) => {
    try {
      localStorage.setItem('appsi_psa_creds', JSON.stringify({ center: '02', number: '98020174', password: 'Nico2026', remember: true }));
      localStorage.setItem('appi_lista_carrito_v1', JSON.stringify(a.cart));
      if (a.perfil) localStorage.setItem('appi_dip_perfil_v1', JSON.stringify({ ts: Date.now(), perfil: a.perfil }));
    } catch (e) {}
  }, { cart, perfil });
}

function mockGan(page) {
  page.route('**/psa-ganancias.json*', (route) => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify(GAN)
  }));
}

async function abrirSheetCon(page, cart, perfil) {
  await initComun(cart, perfil)(page);
  await base.entrar(page);
  mockGan(page);
  await page.evaluate(() => window.abrirLista());
  await expect(page.locator('#lpFab')).toBeVisible({ timeout: 15000 });
  await page.locator('#lpFab').click();
  await expect(page.locator('#lpSheet')).toHaveClass(/open/);
  await expect(page.locator('#lpSheetGanancia')).toContainText('SOLO PARA VOS', { timeout: 15000 });
}

test('tarjeta privada: ganancia real con la columna del perfil (RI · DC-CE-LE)', async ({ page }) => {
  // 1× Senior a 781.000 (RI×DC-CE-LE = 466.999,50) → 314.000,50 ≈ 40%.
  await abrirSheetCon(page, { '611010580': 1 }, PERFIL);
  const gan = page.locator('#lpSheetGanancia');
  await expect(gan).toContainText('$314.001');
  await expect(gan).toContainText('40%');
  await expect(gan).toContainText('RI/Mono · DC/CE/LE');
  await expect(gan).toContainText('Lista PSA 9-SEP-2026');
  // Línea de saldo PSA (datos de la cuenta en tiempo real).
  await expect(gan).toContainText('Saldo en tu cuenta PSA: $2.728');
  await expect(gan).toContainText('última devolución 01/08/2026');
  await expect(gan).toContainText('pedís del 1° al 5');
  // El PDF del cliente sigue siendo el mismo (botón Cotizar intacto).
  await expect(page.locator('#lpSheetPdf')).toBeVisible();
});

test('línea Plan canje: usa el costo de la lista canje', async ({ page }) => {
  // 1× Senior (PLAN CANJE) a 702.900, costo canje RI×DC-CE-LE 420.299,55 → 282.600,45 ≈ 40%.
  await abrirSheetCon(page, { '611010580::canje': 1 }, PERFIL);
  const gan = page.locator('#lpSheetGanancia');
  await expect(gan).toContainText('$282.600');
  await expect(gan).toContainText('40%');
});

test('ítem sin lista: estimación 30% marcada y columna por defecto', async ({ page }) => {
  // Ducha Rinnova (no figura en las listas) a 296.000 → 30% = 88.800, marcada "est. 30%".
  // Sin perfil → columna por defecto RI/Mono · DC/CE/LE.
  await abrirSheetCon(page, { '611100240': 1 }, null);
  const gan = page.locator('#lpSheetGanancia');
  await expect(gan).toContainText('$88.800');
  await expect(gan).toContainText('est. 30%');
  await expect(gan).toContainText('ítem(s) sin lista');
  await expect(gan).toContainText('RI/Mono · DC/CE/LE');
});

test('botón WhatsApp: abre wa.me al número del distribuidor con el mensaje', async ({ page }) => {
  await abrirSheetCon(page, { '611010580': 2, '611030420': 1 }, PERFIL);
  // 2× Senior (628.001) + 1× Vero (245.169) → 873.170 ≈ 40%.
  const gan = page.locator('#lpSheetGanancia');
  await expect(gan).toContainText('$873.170');
  await page.evaluate(() => {
    window.__waUrl = null;
    window.open = (u) => { window.__waUrl = u; return null; };
  });
  await gan.locator('[data-wa]').click();
  const url = await page.evaluate(() => window.__waUrl);
  expect(url).toBeTruthy();
  expect(url).toContain('wa.me/5493513102865?text=');
  const texto = decodeURIComponent(url.split('text=')[1]);
  expect(texto).toContain('Tu ganancia');
  expect(texto).toContain('873.170');
  expect(texto).toContain('2×');
  expect(texto).toContain('RI/Mono · DC/CE/LE');
});

test('sync de perfil: perfil viejo → se refresca solo con action "perfil"', async ({ page }) => {
  // Perfil guardado hace 2 días (vencido) + función mockeada que responde.
  await page.addInitScript(() => {
    try {
      localStorage.setItem('appsi_psa_creds', JSON.stringify({ center: '02', number: '98020174', password: 'Nico2026', remember: true }));
      localStorage.setItem('appi_lista_carrito_v1', JSON.stringify({ '611010580': 1 }));
      localStorage.setItem('appi_dip_perfil_v1', JSON.stringify({ ts: Date.now() - 2 * 86400000, perfil: PERFIL }));
    } catch (e) {}
  });
  await base.entrar(page);
  mockGan(page);
  let pidioPerfil = false;
  page.route('**/functions/v1/consulta-serial', (route) => {
    let body = {};
    try { body = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
    if (body.action === 'perfil') {
      pidioPerfil = true;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, perfil: { categoria: 'LIDER DE EQUIPO', tributaria: 'Responsable inscripto', telefono: '+543513102865', saldo: 9999.99, ultimaDevolucion: { fecha: '12/08/2026', importe: 431532.92 } } }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, total: 0, filas: [] }) });
  });
  await page.evaluate(() => window.abrirLista());
  await expect(page.locator('#lpFab')).toBeVisible({ timeout: 15000 });
  await page.locator('#lpFab').click();
  await expect(page.locator('#lpSheet')).toHaveClass(/open/);
  await page.waitForFunction(() => {
    const j = JSON.parse(localStorage.getItem('appi_dip_perfil_v1') || 'null');
    return j && j.perfil && j.perfil.saldo === 9999.99 && Date.now() - j.ts < 60000;
  }, null, { timeout: 15000 });
  expect(pidioPerfil).toBe(true);
  const gan = page.locator('#lpSheetGanancia');
  await expect(gan).toContainText('Saldo en tu cuenta PSA: $10.000', { timeout: 10000 });
});
