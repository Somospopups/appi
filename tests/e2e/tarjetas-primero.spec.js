// v919 · Las tarjetas inteligentes son la función estrella: tienen que ser lo
// primero que aparece en el Home, no lo último.
//
// Antes el mazo quedaba colgado de `appTerminoDeCargar()`, que exigía la sesión
// autorizada contra la nube, y la espera se rendía a los 6,4 s (400 × 16 ms) sin
// volver a intentarlo en toda la visita. Medido con la sesión de más de 7 días
// —lo habitual en quien abre la app cada tanto—:
//   * red lenta de 9 s  => el mazo salía a los 9,4 s,
//   * red que no contesta => el mazo NO salía nunca.
// Acá queda clavado que el mazo se arma con lo que hay en el teléfono y se
// completa solo cuando llega la sincronización.
const { test, expect } = require('@playwright/test');

const USER_ID = '11111111-1111-4111-8111-111111111131';
// Umbral holgado frente a los ~650 ms medidos, y muy por debajo de los 9,4 s que
// tardaba antes: si vuelve a engancharse a la red, esto falla.
const TOPE_MS = 3000;

const b64url = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const tokenFor = sub => `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })}.firma`;
const TOKEN = 'function(sub){const b=o=>btoa(JSON.stringify(o)).replace(/\\+/g,"-").replace(/\\//g,"_").replace(/=+$/,"");return b({alg:"HS256",typ:"JWT"})+"."+b({sub:sub,exp:Math.floor(Date.now()/1000)+3600})+"."+"firma"}';
const AUTH_CONFIG = "window.APPI_AUTH={enabled:true,url:'https://mock.supabase.co',anonKey:'anon-key-publica-de-prueba',distributorEmailDomain:'distribuidores.appi.invalid',adminLogin:{username:'popups',email:'admin-popups@appi.invalid'},loginAliases:{},offlineDays:7};";

const perfil = extra => Object.assign({
  user_id: USER_ID, username: null, dip: '02-9802014', sucursal: '02', numero_distribuidor: '9802014',
  nombre: 'María Pérez', socio_nombre: null, rol: 'usuario', activo: true, debe_cambiar_password: false,
  membresia_meses: 1, membresia_inicio: new Date().toISOString(),
  membresia_vence: new Date(Date.now() + 30 * 86400000).toISOString(), membresia_dias_restantes: 30
}, extra || {});

const EQUIPO = { titular: { dip: '02-9802014', nombre: 'María Pérez', categoria: 'DC' },
  personas: [{ id: 0, nivel: 0, codigo: '02-9802014', nombre: 'María Pérez', cat: 'DC', pnAct: 9, garantias: { vendidas: 12, vencidas: 4, pendientes: 1 }, hijos: [] }] };

function planilla(n) {
  const raw = k => { const d = new Date(Date.now() + k * 86400000); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`; };
  const out = [];
  for (let i = 0; i < n; i++) {
    const porVencer = i % 4 === 0;
    out.push({ id: i, usuario: `CLIENTE ${String(i).padStart(4, '0')}, TEST`, telf: `35155${String(10000 + i).slice(-5)}`,
      domicilio: `Calle ${i} ${100 + i}`, cp: '5000', localidad: 'Córdoba', producto: 'PSA SENIOR 4', serie: `S${i}`,
      fCompra: raw(-400 - i), fVenceRaw: porVencer ? raw(12 + (i % 20)) : raw(300 + i), fVence: porVencer ? raw(12 + (i % 20)) : raw(300 + i),
      email: '', dipReasignado: '', reasignado: false, estado: porVencer ? 'porVencer' : 'vigente',
      nombreNorm: `cliente ${String(i).padStart(4, '0')} test` });
  }
  return out;
}

// Marca el instante en que aparece la primera tarjeta, para poder afirmarlo.
const MARCAS = () => {
  window.__marcas = {};
  const marcar = k => { if (!(k in window.__marcas)) window.__marcas[k] = Math.round(performance.now()); };
  new MutationObserver(() => {
    if (document.querySelector('#view-home.active')) marcar('homeActivo');
    const ov = document.getElementById('htOverlay');
    if (ov && ov.querySelector('.ht-card')) marcar('primeraTarjeta');
  }).observe(document, { childList: true, subtree: true, attributes: true });
};

// `nube`: 'rapida' | 'lenta' (9 s) | 'colgada' (no contesta nunca).
// `sesionFresca`: false simula a la distribuidora que abre la app después de
// `offlineDays` y por lo tanto no entra por el camino rápido de v918.
async function entrar(page, { nube = 'rapida', sesionFresca = false, prof = null, usuarios = 200, cubrirHastaMs = 0 } = {}) {
  await page.setViewportSize({ width: 390, height: 840 });
  const perfilGuardado = prof || perfil();
  await page.route('**/auth-config.js', route => route.fulfill({ contentType: 'application/javascript', body: AUTH_CONFIG }));
  await page.route('https://mock.supabase.co/**', async route => {
    const url = new URL(route.request().url());
    const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
    // La demora pega justo en lo que el arranque espera antes de autorizar.
    if (url.pathname === '/rest/v1/appi_perfiles' || url.pathname === '/auth/v1/token') {
      if (nube === 'colgada') return new Promise(() => {});
      if (nube === 'lenta') await new Promise(r => setTimeout(r, 9000));
    }
    if (url.pathname === '/auth/v1/token') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ access_token: tokenFor(USER_ID), refresh_token: 'r', expires_in: 3600, user: { id: USER_ID } }) });
    if (url.pathname === '/rest/v1/appi_perfiles') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([perfilGuardado]) });
    if (url.pathname === '/functions/v1/dispositivo-puente') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ devices: [] }) });
    return route.fulfill({ status: 200, headers: cors, body: '[]' });
  });
  await page.addInitScript(([uid, equipo, plan, p, fresca, tokenForSrc]) => {
    const tokenFor = eval('(' + tokenForSrc + ')');
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('tutoVisto_v2', '1');
    localStorage.setItem('appi_notif_listo_v1', '1');
    localStorage.setItem('appi_notif_popup_later', String(Date.now() + 400 * 24 * 3600 * 1000));
    localStorage.setItem('equipoData', JSON.stringify(equipo));
    localStorage.setItem('usuarios_garantias', JSON.stringify(plan));
    localStorage.setItem(`appi_gestion_cache_v1_${uid}`, JSON.stringify({ contacts: [], surveys: [], activities: [], savedAt: Date.now() }));
    localStorage.setItem('appi_auth_session_v1', JSON.stringify({
      // El token tiene que ser un JWT con `sub` legible: si no, `userId()` da
      // vacío y la app muestra la pantalla de bloqueo, que tapa el Home.
      session: { access_token: tokenFor(uid), expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'r' },
      profile: p,
      // vencida => `offlineEligible` false => el arranque valida contra la nube.
      lastValidatedAt: fresca ? Date.now() : Date.now() - 8 * 24 * 3600 * 1000
    }));
  }, [USER_ID, EQUIPO, planilla(usuarios), perfilGuardado, sesionFresca, TOKEN]);
  await page.addInitScript(MARCAS);
  if (cubrirHastaMs) {
    // Simula un arranque que se queda con el Home cubierto un rato largo (red
    // lenta, actualización del Service Worker, agua de la marca). Se libera con
    // `revelarAppLista()`, la rutina real de la app.
    await page.addInitScript(ms => {
      // Se sujeta la bandera con un getter propio: si sólo se reescribiera en un
      // intervalo, la app la pondría en false entre tick y tick y el mazo se
      // colaría por esa ventana.
      let liberado = false;
      Object.defineProperty(window, '__appiCubriendoInicio', {
        configurable: true,
        get() { return !liberado; },
        set() { /* mientras el test no libere, el Home sigue cubierto */ }
      });
      setTimeout(() => {
        liberado = true;
        const b = document.getElementById('bootScreen'); if (b) b.classList.add('gone');
        const p = document.getElementById('personChoiceOverlay'); if (p) p.hidden = true;
        if (typeof window.liberarScrollCuerpo === 'function') window.liberarScrollCuerpo();
      }, ms);
    }, cubrirHastaMs);
  }
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
}

async function esperarTarjetas(page, tope = TOPE_MS) {
  const ok = await page.waitForFunction(
    () => !!(document.getElementById('htOverlay') && document.querySelector('#htOverlay .ht-card')),
    null, { timeout: tope, polling: 50 }
  ).then(() => true).catch(() => false);
  return ok;
}

test.describe('las tarjetas inteligentes aparecen primero', () => {

  test('sesión vencida y nube que no contesta: el mazo aparece igual, con los datos del teléfono', async ({ page }) => {
    await entrar(page, { nube: 'colgada', sesionFresca: false });
    expect(await esperarTarjetas(page), 'las tarjetas no aparecieron con la nube colgada').toBe(true);
    const marcas = await page.evaluate(() => window.__marcas);
    expect(marcas.primeraTarjeta, 'el mazo tardó más que el tope').toBeLessThan(TOPE_MS);
    // La sesión sigue sin autorizarse (la nube no contestó) y el mazo igual
    // tiene tarjetas: se armó con lo que había guardado en el teléfono.
    expect(await page.evaluate(() => window.APPIAuth.isLocallyAuthorized()),
      'con la nube colgada la sesión no debería figurar autorizada').toBe(false);
    expect(await page.locator('#htOverlay .ht-card').count()).toBeGreaterThan(0);
  });

  test('sesión vencida y red lenta de 9 s: el mazo no la espera', async ({ page }) => {
    await entrar(page, { nube: 'lenta', sesionFresca: false });
    expect(await esperarTarjetas(page), 'las tarjetas esperaron a la red lenta').toBe(true);
    const marcas = await page.evaluate(() => window.__marcas);
    expect(marcas.primeraTarjeta).toBeLessThan(TOPE_MS);
    // Y salió mucho antes de que la nube contestara.
    expect(marcas.primeraTarjeta).toBeLessThan(9000);
  });

  test('cuenta grande de 1500 clientes con red lenta: el mazo no se demora', async ({ page }) => {
    await entrar(page, { nube: 'lenta', sesionFresca: false, usuarios: 1500 });
    expect(await esperarTarjetas(page), 'con 1500 clientes el mazo se demoró').toBe(true);
    const marcas = await page.evaluate(() => window.__marcas);
    expect(marcas.primeraTarjeta).toBeLessThan(TOPE_MS);
  });

  test('sesión fresca y red rápida: el camino normal sigue abriendo el mazo enseguida', async ({ page }) => {
    await entrar(page, { nube: 'rapida', sesionFresca: true });
    expect(await esperarTarjetas(page)).toBe(true);
    const marcas = await page.evaluate(() => window.__marcas);
    expect(marcas.primeraTarjeta).toBeLessThan(TOPE_MS);
  });

  test('la espera no se rinde: si el Home queda cubierto más de 6,4 s, el mazo abre igual después', async ({ page }) => {
    // El tope viejo era 400 intentos de 16 ms = 6,4 s, y `autoAbierto` quedaba en
    // true: pasado ese punto el mazo no volvía a abrirse en toda la visita.
    await entrar(page, { nube: 'rapida', sesionFresca: true, cubrirHastaMs: 8000 });
    // A los 7,2 s el Home sigue cubierto y ya se pasó el tope viejo de 6,4 s.
    await page.waitForTimeout(7200);
    expect(await page.locator('#htOverlay').count(), 'el mazo se abrió con el Home cubierto').toBe(0);
    // Con el tope viejo acá ya no había vuelta atrás: `autoAbierto` quedaba en
    // true y el mazo no se abría en toda la visita. Ahora la espera sigue viva y
    // abre en cuanto el arranque libera el Home.
    expect(await esperarTarjetas(page, 8000), 'después de 6,4 s la espera ya se había rendido').toBe(true);
    expect(await page.locator('#htOverlay .ht-card').count()).toBeGreaterThan(0);
  });

  test('la elección de titular/socio sigue bloqueando el mazo hasta elegir', async ({ page }) => {
    // Con socio en el perfil y ninguna persona activa hay que elegir primero:
    // si no, las tarjetas mostrarían los números de otra persona.
    await entrar(page, { nube: 'rapida', sesionFresca: true, prof: perfil({ socio_nombre: 'Juan Pérez' }) });
    const elegir = page.locator('#personChoiceOverlay:not([hidden]) [data-person-type]');
    await expect(elegir.first()).toBeVisible({ timeout: 10000 });
    expect(await page.evaluate(() => !!(window.APPIAuth && window.APPIAuth.needsPersonChoice()))).toBe(true);
    expect(await page.locator('#htOverlay').count(), 'el mazo se abrió antes de elegir persona').toBe(0);

    await page.locator('[data-person-type="titular"]').click();
    expect(await esperarTarjetas(page, 10000), 'después de elegir persona el mazo no abrió').toBe(true);
  });

});
