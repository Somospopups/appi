const { test, expect } = require('@playwright/test');
const fs = require('fs');

/* Modo PRUEBA de 5 días (v294): píldoras [1 mes] [PRUEBA] al crear cuentas,
   píldora 🧪 en cada carpeta para poner a prueba cuentas ya creadas, franja
   roja constante para quien la usa (días → horas el último día) y bloqueo
   con mensaje claro al vencer. */

test.describe('la franja roja de la versión de prueba', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/index.html'); });

  test('muestra los días que quedan', async ({ page }) => {
    const t = await page.evaluate(() => window.APPIPrueba.texto(Date.now() + 2.5 * 86400000));
    expect(t).toContain('VERSIÓN DE PRUEBA');
    expect(t).toContain('Te quedan 3 días de uso');
  });

  test('el último día pasa a horas', async ({ page }) => {
    const t = await page.evaluate(() => window.APPIPrueba.texto(Date.now() + 5 * 3600000));
    expect(t).toContain('Te quedan 5 horas de uso');
    const una = await page.evaluate(() => window.APPIPrueba.texto(Date.now() + 30 * 60000));
    expect(una).toContain('Te queda 1 hora de uso');
  });

  test('vencida lo dice sin vueltas', async ({ page }) => {
    const t = await page.evaluate(() => window.APPIPrueba.texto(Date.now() - 1000));
    expect(t).toContain('Tu prueba terminó');
  });

  test('la franja se dibuja fija, sin botón de cerrar, y empuja sin tapar', async ({ page }) => {
    await page.evaluate(() => window.APPIPrueba.pintar(Date.now() + 3 * 86400000));
    const bar = page.locator('#appiPruebaBar');
    await expect(bar).toBeVisible();
    await expect(bar).toContainText('VERSIÓN DE PRUEBA');
    // Sin controles adentro: no hay forma de eliminarla.
    expect(await bar.locator('button').count()).toBe(0);
    const body = page.locator('body');
    await expect(body).toHaveClass(/appi-prueba/);
    // No tapa: la pantalla se achica exactamente el alto real de la franja.
    const medidas = await page.evaluate(() => ({
      franja: Math.ceil(document.getElementById('appiPruebaBar').getBoundingClientRect().height),
      padding: parseFloat(getComputedStyle(document.body).paddingTop)
    }));
    expect(medidas.padding).toBeGreaterThanOrEqual(medidas.franja);
    // Se apaga sola cuando la cuenta deja el modo prueba, y devuelve el espacio.
    await page.evaluate(() => window.APPIPrueba.apagar());
    await expect(page.locator('#appiPruebaBar')).toHaveCount(0);
  });
});

test('las píldoras de creación quedaron en 1 mes y PRUEBA', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const pills = html.match(/id="adminCreateMembership">([\s\S]*?)<\/div>/)[1];
  expect(pills).toContain('1 mes');
  expect(pills).toContain('PRUEBA · 5 días');
  expect(pills).not.toContain('3 meses');
  expect(pills).not.toContain('6 meses');
  // La franja viaja con la app.
  expect(html).toContain('prueba-banner.js');
});

test('aprobar una solicitud ofrece 1 mes o PRUEBA, y la prueba se activa por RPC', () => {
  const js = fs.readFileSync('admin-panel.js', 'utf8');
  expect(js).toContain("{label:'1 mes',value:1},{label:'🧪 PRUEBA · 5 días',value:'prueba'}");
  expect(js).not.toContain("'3 meses'");
  expect(js).not.toContain("'6 meses'");
  expect(js).toContain('appi_admin_activar_prueba');
  expect(js).toContain('appi_admin_lista_pruebas');
  expect(js).toContain('data-admin-action="trial"');
  expect(js).toContain('loadPruebas');
});

test('la migración de la prueba cubre alta, control de rol, salida y listado', () => {
  const sql = fs.readFileSync('SUPABASE_PRUEBA.sql', 'utf8');
  expect(sql).toContain('add column if not exists membresia_prueba boolean not null default false');
  expect(sql).toContain('create or replace function public.appi_admin_activar_prueba');
  expect(sql).toContain('create or replace function public.appi_admin_lista_pruebas');
  expect(sql.match(/rol = 'admin'/g).length).toBeGreaterThanOrEqual(2);
  // 5 días calendario, con medianoche argentina.
  expect(sql).toContain("interval '5 days'");
  expect(sql).toContain('America/Argentina/Cordoba');
  // membresia_meses queda en null: el check (1,3,6) de la tabla no se toca.
  expect(sql).toContain('membresia_meses = null');
  // Pago o prórroga sacan del modo prueba sin pasos extra.
  expect(sql).toContain('appi_perfiles_salir_de_prueba');
  expect(sql).toContain('drop trigger if exists appi_perfiles_prueba_paga');
});

test('al vencer la prueba, el ingreso se bloquea con su propio mensaje', () => {
  const js = fs.readFileSync('auth-client.js', 'utf8');
  expect(js).toContain('Tu período de PRUEBA de APPI terminó');
  // La consulta del flag va protegida: sin la migración, el bloqueo genérico sigue.
  expect(js).toContain('select=membresia_prueba');
});

test('el panel de administración tiene su ayuda, como todas las pantallas', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  expect(html).toContain('id="btnHelpAdmin"');
  const js = fs.readFileSync('admin-panel.js', 'utf8');
  expect(js).toContain('btnHelpAdmin');
  expect(js).toContain('CUMPLIMIENTO DIARIO');
  expect(js).toContain('PRUEBA (5 días');
});
