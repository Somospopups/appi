const { test, expect } = require('@playwright/test');

// v818 — Recordatorios del teléfono: avisos locales programados
// (cumpleaños, acciones del día, garantías por vencer, reasignados y cierre)
// sin "conectar" nada. En los tests el SW está bloqueado (config), así que
// se prueba la vía in-proceso (setTimeout + new Notification) y el catch-up.

const ORIGIN = 'http://127.0.0.1:4174';

function seedScript() {
  // Spy de notificaciones + permiso simulado + base de 3 usuarios (cumple hoy, por vencer, reasignado).
  window.__REC_PERM_OVERRIDE = 'granted';
  window.__notifs = [];
  const Orig = window.Notification;
  window.Notification = class extends Orig {
    constructor(t, o) { super(t, o); window.__notifs.push({ t: t, body: o && o.body }); }
  };
  const p = (n) => String(n).padStart(2, '0');
  const hoy = new Date();
  const usuarios = [
    { id: 0, usuario: 'MARTA CUMPLE', telf: '3511110001', domicilio: 'Calle 1 100', cp: '5000', localidad: 'Centro', producto: 'PSA Senik', serie: '', fCompra: '01/01/2024', fVenceRaw: '30/12/2026', fVence: '2026-12-30T00:00:00.000Z', email: '', dipReasignado: '', reasignado: false, estado: 'vigente', nombreNorm: 'marta cumple', cumpleRaw: p(hoy.getDate()) + '/' + p(hoy.getMonth() + 1) },
    { id: 1, usuario: 'JOSE VENCE', telf: '3511110002', domicilio: 'Calle 2 200', cp: '5000', localidad: 'Centro', producto: 'PSA Domus', serie: '', fCompra: '01/05/2025', fVenceRaw: '10/10/2026', fVence: '2026-10-10T00:00:00.000Z', email: '', dipReasignado: '', reasignado: false, estado: 'porVencer', nombreNorm: 'jose vence' },
    { id: 2, usuario: 'ANA REASIG', telf: '3511110003', domicilio: 'Calle 3 300', cp: '5000', localidad: 'Centro', producto: 'PSA Vero', serie: '', fCompra: '01/03/2024', fVenceRaw: '30/12/2026', fVence: '2026-12-30T00:00:00.000Z', email: '', dipReasignado: 'PECORA, NORMA BEATRIZ', reasignado: true, estado: 'vigente', nombreNorm: 'ana reasig' }
  ];
  localStorage.setItem('usuarios_garantias', JSON.stringify(usuarios));
}

test('programa los recordatorios a futuro y los suelta a la hora exacta', async ({ page, context }) => {
  await context.grantPermissions(['notifications'], { origin: ORIGIN });
  // Reloj fijo a las 07:00 de hoy
  const base = new Date();
  const fake = new Date(base); fake.setHours(7, 0, 0, 0);
  await page.clock.install({ time: fake });
  await page.addInitScript(seedScript);
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.APPIRecordatorios && window.usuariosU && window.usuariosU.length === 3, null, { timeout: 20000 });

  // Horas todas a futuro (07:02–07:06)
  await page.evaluate(() => {
    window.APPIRecordatorios.guardar({ hora: { cumples: '07:02', manana: '07:03', vence: '07:04', reasig: '07:05', cierre: '07:06' } });
  });
  const plan = await page.evaluate(() => JSON.parse(localStorage.getItem('appi_rec_plan_v1') || 'null'));
  expect(plan).not.toBeNull();
  expect(Object.keys(plan.items).length).toBe(5);
  // A las 07:00 aún no salió ninguno
  expect(await page.evaluate(() => window.__notifs.length)).toBe(0);

  // Adelantar el reloj 6 minutos: los cinco avisos salen
  await page.clock.runFor('06:00');
  await expect.poll(() => page.evaluate(() => window.__notifs.length)).toBe(5);
  const bodies = (await page.evaluate(() => window.__notifs.map((n) => String(n.body)))).map((b) => b.toLowerCase());
  expect(bodies.some((b) => b.includes('cumple años marta'))).toBe(true);
  expect(bodies.some((b) => b.includes('por vencer') && b.includes('30 días'))).toBe(true);
  expect(bodies.some((b) => b.includes('recontactar'))).toBe(true);
  expect(bodies.some((b) => b.includes('acciones del día'))).toBe(true);
  expect(bodies.some((b) => b.includes('cierre del día'))).toBe(true);
});

test('si abrió la app tarde, emite el catch-up del día una sola vez', async ({ page, context }) => {
  await context.grantPermissions(['notifications'], { origin: ORIGIN });
  // Reloj fijo a las 18:30: todas las horas por defecto ya pasaron
  const base = new Date();
  const fake = new Date(base); fake.setHours(18, 30, 0, 0);
  await page.clock.install({ time: fake });
  await page.addInitScript(seedScript);
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__notifs.length >= 5, null, { timeout: 20000 });
  // Vuelve a repasar (navegación dentro de la app): no duplica
  await page.evaluate(() => window.APPIRecordatorios.planear());
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.__notifs.length)).toBe(5);
  const bodies = (await page.evaluate(() => window.__notifs.map((n) => String(n.body)))).map((b) => b.toLowerCase());
  expect(bodies.filter((b) => b.includes('cumple años marta')).length).toBe(1);
});

test('la pantalla Notificaciones muestra los 5 avisos y guarda cambios', async ({ page, context }) => {
  await context.grantPermissions(['notifications'], { origin: ORIGIN });
  await page.addInitScript(seedScript);
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.APPIRecordatorios && typeof window.showView === 'function', null, { timeout: 20000 });
  await page.evaluate(() => {
    const lock = document.getElementById('lockScreen');
    if (lock) lock.classList.add('hidden');
    const boot = document.getElementById('bootScreen');
    if (boot) { boot.classList.add('gone'); boot.remove(); }
    document.body.classList.remove('appi-login-abierto');
  });
  // Espera el wrap de showView (reintentos a los 800/2000 ms)
  await page.waitForTimeout(2400);

  await page.evaluate(() => window.showView('view-recordatorios'));
  await expect(page.locator('#recList .rec-hab')).toHaveCount(5, { timeout: 10000 });
  await expect(page.locator('#recList .rec-hora')).toHaveCount(5);

  // Toggle de reasignados a OFF
  await page.evaluate(() => document.querySelector('#recList .rec-hab[data-key="reasig"]').click());
  let conf = await page.evaluate(() => JSON.parse(localStorage.getItem('appi_recordatorios_v1') || '{}'));
  expect(conf.hab.reasig).toBe(false);

  // Cambio de hora del cierre
  await page.locator('#recList .rec-hora[data-key="cierre"]').fill('20:15');
  await page.locator('#recList .rec-hora[data-key="cierre"]').dispatchEvent('change');
  conf = await page.evaluate(() => JSON.parse(localStorage.getItem('appi_recordatorios_v1') || '{}'));
  expect(conf.hora.cierre).toBe('20:15');

  // "Probar" emite el aviso al instante
  const antes = await page.evaluate(() => window.__notifs.length);
  await page.locator('#recList .rec-probar[data-key="manana"]').click();
  await expect.poll(() => page.evaluate(() => window.__notifs.length)).toBe(antes + 1);
});
