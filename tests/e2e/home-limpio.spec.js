const { test, expect } = require('@playwright/test');

const USER_ID = '11111111-1111-4111-8111-111111111111';
const hoy = new Date().toISOString();

function tokenFor(sub) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${header}.${payload}.firma`;
}

const EQUIPO = {
  titular: { dip: '02-9802014', nombre: 'María Pérez', categoria: 'DC' },
  personas: [{
    id: 0, nivel: 0, codigo: '02-9802014', nombre: 'María Pérez', cat: 'DC', pnAct: 9,
    garantias: { vendidas: 12, vencidas: 4, pendientes: 1 }, hijos: []
  }]
};
const CONTACTOS = [
  { id: 'c1', estado: 'seguimiento', nombre: 'Jorge Salas', telefono: '3515550002', telefono_normalizado: '3515550002', tipo: 'contacto', proximo_contacto: hoy.slice(0, 10), created_at: hoy, updated_at: hoy },
  { id: 'c2', estado: 'presentacion', nombre: 'Lucía Vega', telefono: '3515550003', telefono_normalizado: '3515550003', tipo: 'encuestado', proximo_contacto: hoy.slice(0, 10), created_at: hoy, updated_at: hoy },
  { id: 'c3', estado: 'nuevo', nombre: 'Carla Muñoz', telefono: '3515550001', telefono_normalizado: '3515550001', tipo: 'contacto', created_at: hoy, updated_at: hoy }
];

async function entrar(page) {
  const accessToken = tokenFor(USER_ID);
  const now = new Date().toISOString();
  const profile = {
    user_id: USER_ID, username: null, dip: '02-9802014', sucursal: '02', numero_distribuidor: '9802014',
    nombre: 'María Pérez', socio_nombre: null, rol: 'usuario', activo: true, debe_cambiar_password: false,
    membresia_meses: 1, membresia_inicio: now, membresia_vence: new Date(Date.now() + 30 * 86400000).toISOString()
  };
  await page.route('**/auth-config.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: "window.APPI_AUTH={enabled:true,url:'https://mock.supabase.co',anonKey:'anon-key-publica-de-prueba',distributorEmailDomain:'distribuidores.appi.invalid',adminLogin:{username:'popups',email:'admin-popups@appi.invalid'},loginAliases:{},offlineDays:7};"
  }));
  await page.route('https://mock.supabase.co/**', route => {
    const url = new URL(route.request().url());
    const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
    if (url.pathname === '/auth/v1/token') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ access_token: accessToken, refresh_token: 'r', expires_in: 3600, user: { id: USER_ID } }) });
    if (url.pathname === '/rest/v1/appi_perfiles') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([profile]) });
    if (url.pathname === '/functions/v1/dispositivo-puente') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ devices: [] }) });
    return route.fulfill({ status: 200, headers: cors, body: '[]' });
  });
  await page.addInitScript(([uid, equipo, contactos]) => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('appi_tarjetas_auto', '0');
    localStorage.setItem('tutoVisto_v2', '1');
    localStorage.setItem('equipoData', JSON.stringify(equipo));
    localStorage.setItem(`appi_gestion_cache_v1_${uid}`, JSON.stringify({ contacts: contactos, surveys: [], activities: [], savedAt: Date.now() }));
    localStorage.setItem(`appi_porque_v1_${uid}`, JSON.stringify({ niveles: ['Ganar dinero', 'Que mi familia viva tranquila'] }));
    localStorage.setItem(`appi_tour_parque_v1_${uid}`, '1');
  }, [USER_ID, EQUIPO, CONTACTOS]);
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
}

test('el home muestra el porqué y prioriza la jornada de hoy', async ({ page }) => {
  await entrar(page);

  const home = page.locator('#homeLimpio');
  await expect(home).toBeVisible();
  await expect(home).toContainText('Que mi familia viva tranquila');
  await expect(home).not.toContainText('Tu impulso');
  await expect(home).toContainText('Tu jornada');
  await expect(home).toContainText('Jorge Salas');
  await expect(home).toContainText('Lucía Vega');
  await expect(home.locator('[data-wa]')).toHaveCount(1);
  await expect(home).toContainText('Ver todo el Panel');

  const spacing=await page.evaluate(()=>({
    heroTop:parseFloat(getComputedStyle(document.querySelector('.home-hero-card')).marginTop),
    greetingBottom:parseFloat(getComputedStyle(document.querySelector('.home-greeting-row')).marginBottom)
  }));
  expect(spacing.heroTop).toBeGreaterThanOrEqual(12);
  expect(spacing.greetingBottom).toBeGreaterThanOrEqual(10);
});

test('el selector de páginas navega y cada página tiene lo suyo', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 840 });
  await entrar(page);

  await expect(page.locator('#pageTabs')).toBeVisible();

  await page.locator('#pageTabs button[data-view="view-negocio"]').click();
  await expect(page.locator('#view-negocio')).toHaveClass(/active/);
  await expect(page.locator('#gpsBlock')).toBeVisible();
  await expect(page.locator('#negGrid')).toContainText('Panel de Contactos');

  await page.locator('#pageTabs button[data-view="view-mes"]').click();
  await expect(page.locator('#mesGrid')).toContainText('Las 7 P');
  await expect(page.locator('#mesGrid')).toContainText('Presupuesto');

  await page.locator('#pageTabs button[data-view="view-herramientas"]').click();
  await expect(page.locator('#view-herramientas')).toContainText('Grabadora');
  await expect(page.locator('#view-herramientas')).toContainText('Los 8 Pasos');

  await page.locator('#pageTabs button[data-view="view-home"]').click();
  await expect(page.locator('#homeLimpio')).toBeVisible();
});

test('en pantalla de PC el selector se esconde y manda la sidebar', async ({ page }) => {
  await entrar(page);
  await expect(page.locator('#pageTabs')).toBeHidden();
  await expect(page.locator('#deskSidebar')).toBeVisible();
});

test('en PC la barra trae las mismas herramientas que el celular', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await entrar(page);
  const sidebar = page.locator('#deskSidebar');
  await expect(sidebar).toBeVisible();
  for (const nombre of ['Los 8 Pasos', 'Escalera de Sueños', 'Coach de Demo', 'Botella', 'Simulador', 'Mi stock', 'Grabadora', 'Notas Keep']) {
    await expect(sidebar).toContainText(nombre);
  }
  await page.locator('#deskSidebar [data-ds="view-stock"]').click();
  await expect(page.locator('#view-stock')).toHaveClass(/active/);
  await expect(page.locator('#stockCont')).toBeVisible();
  await expect(page.locator('#stockCont')).toContainText('En casa');
  await expect(page.locator('#stockCont')).toContainText('Prestados');
  await page.locator('#deskSidebar [data-ds="view-demo"]').click();
  await expect(page.locator('#view-demo')).toHaveClass(/active/);
  await page.locator('#deskSidebar [data-ds="view-botella"]').click();
  await expect(page.locator('#view-botella')).toHaveClass(/active/);
  await page.locator('#deskSidebar [data-ds="view-simulador"]').click();
  await expect(page.locator('#view-simulador')).toHaveClass(/active/);
  await expect(page.locator('#deskSidebar [data-ds="view-simulador"]')).toHaveClass(/active/);

  await page.setViewportSize({ width: 1366, height: 768 });
  await page.locator('#deskSidebar [data-ds="view-notas"]').scrollIntoViewIfNeeded();
  await expect(page.locator('#deskSidebar [data-ds="view-notas"]')).toBeVisible();
  await expect(page.locator('#deskSidebar [data-ds="view-grabadora"]')).toBeVisible();
  const leaked = await page.evaluate(() => {
    return [...document.body.childNodes]
      .filter(n => n.nodeType === 3)
      .map(n => n.textContent || '')
      .join(' ');
  });
  expect(leaked).not.toMatch(/limpiarRestos|initHistorico|<\/html>/);
});

test('la tarjeta de la jornada abre el calendario y guarda tareas', async ({ page }) => {
  await entrar(page);
  await page.locator('#hlCardOpen').click();
  await expect(page.locator('#calOverlay')).toHaveClass(/open/);
  await page.locator('#calNewTask').fill('Preparar demostración');
  await page.locator('#calAddBtn').click();
  await expect(page.locator('#calModal')).toContainText('Preparar demostración');
  await page.locator('#calClose').click();
  await expect(page.locator('#calOverlay')).not.toHaveClass(/open/);
  await expect(page.locator('#homeLimpio')).toContainText('Preparar demostración');
});

test('el indicador glass del selector sigue a la pagina activa', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 840 });
  await entrar(page);
  const ind = page.locator('#ptIndicator');
  expect(await ind.evaluate(e => e.offsetWidth)).toBeGreaterThan(0);
  const l0 = await ind.evaluate(e => e.offsetLeft);
  await page.locator('#pageTabs button[data-view="view-negocio"]').click();
  await page.waitForTimeout(550);
  const l1 = await ind.evaluate(e => e.offsetLeft);
  expect(l1).toBeGreaterThan(l0);
});

test('los titulos entran animados desde arriba al cambiar de pantalla', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.showView('view-negocio'));
  const name = await page.evaluate(() => getComputedStyle(document.querySelector('#view-negocio header h1')).animationName);
  expect(name).toContain('titleSlideDown');
});

/* ---------- el mazo de notificaciones (v304) ---------- */

test('el mazo abre con la tarjeta especial primero y se pasa con el botón', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.APPIHomeTarjetas.abrir());
  const overlay = page.locator('#htOverlay');
  await expect(overlay).toBeVisible();
  // La primera es siempre la especial, con el aliento y el progreso real.
  await expect(overlay).toContainText('Tu impulso de hoy');
  await expect(overlay).toContainText('Para vos, María');
  await expect(page.locator('#htPos')).toContainText('1 de');
  // Pasar avanza a la siguiente categoría con contenido: Tu jornada.
  await page.locator('#htPasar').click();
  await expect(overlay).toContainText('Tu jornada');
  await expect(overlay).toContainText('Jorge Salas');
});

test('las tarjetas son inteligentes: solo aparecen las categorías con novedades', async ({ page }) => {
  await entrar(page);
  const cats = await page.evaluate(() => window.APPIHomeTarjetas.armarTarjetas().map(t => t.cat));
  expect(cats[0]).toBe('especial');
  expect(cats).toContain('jornada');   // Jorge y Lucía tienen fecha para hoy
  expect(cats).toContain('panel');         // Carla está nueva sin contactar
  expect(cats).toContain('oportunidades'); // María (DC) está en 9 PB: bonus cerca
  expect(cats).not.toContain('cumples');   // nadie cumple años en los datos
  expect(cats).not.toContain('usuarios');  // sin planilla de garantías cargada
});

test('el botón Notificaciones late con el contador y reabre el mazo', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.APPIHomeTarjetas.abrir());
  // Cerrar el mazo lo marca como visto: el botón queda quieto.
  await page.locator('#htCerrar').click();
  const boton = page.locator('#htBoton');
  await expect(boton).toBeVisible();
  await expect(boton).not.toHaveClass(/late/);
  await expect(boton).toContainText('Notificaciones');
  // Reabre al tocarlo.
  await boton.click();
  await expect(page.locator('#htOverlay')).toBeVisible();
  await expect(page.locator('#htOverlay')).toContainText('Tu impulso de hoy');
});

test('deslizar la tarjeta la pasa, como corresponde a un mazo', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.APPIHomeTarjetas.abrir());
  const card = page.locator('.ht-card:not(.detras1):not(.detras2)');
  await expect(card).toContainText('Tu impulso de hoy');
  const box = await card.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + 60);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 160, box.y + 70, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator('#htOverlay')).toContainText('Tu jornada');
});

test('hay frases de sobra y la del día no cambia dentro del mismo día', async ({ page }) => {
  await entrar(page);
  const r = await page.evaluate(() => ({
    total: window.APPIHomeTarjetas.FRASES.length,
    una: window.APPIHomeTarjetas.fraseDelDia(),
    dos: window.APPIHomeTarjetas.fraseDelDia()
  }));
  expect(r.total).toBeGreaterThanOrEqual(80);
  expect(r.una).toBe(r.dos);
});

test('todas las tarjetas miden lo mismo y cada una lleva su X en la punta', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.APPIHomeTarjetas.abrir());
  const r = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.ht-card')];
    return {
      alturas: cards.map(c => c.offsetHeight),
      anchos: cards.map(c => c.offsetWidth),
      equis: cards.map(c => c.querySelectorAll('.ht-x').length),
      xALaDerecha: (() => {
        const top = cards.find(c => !c.classList.contains('detras1') && !c.classList.contains('detras2'));
        const x = top.querySelector('.ht-x').getBoundingClientRect();
        const card = top.getBoundingClientRect();
        return x.right > card.left + card.width * 0.8 && x.top < card.top + 70;
      })()
    };
  });
  expect(new Set(r.alturas).size).toBe(1);   // mismo alto para todas
  expect(new Set(r.anchos).size).toBe(1);    // mismo ancho para todas
  r.equis.forEach(n => expect(n).toBe(1));   // una X por tarjeta
  expect(r.xALaDerecha).toBe(true);          // en la punta derecha
});

test('tocar un renglón de la tarjeta te lleva directo, y la primera se hamaca', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.APPIHomeTarjetas.abrir());
  // La primera tarjeta hace el vaivén de demostración.
  await expect(page.locator('.ht-card.demo')).toHaveCount(1);
  // Pasamos a Tu jornada y tocamos a Jorge: tiene que abrir el Panel ya.
  await page.locator('#htPasar').click();
  await expect(page.locator('#htOverlay')).toContainText('Tu jornada');
  await page.locator('.ht-lista li', { hasText: 'Jorge Salas' }).click();
  await expect(page.locator('#htOverlay')).toHaveCount(0);
  await expect(page.locator('#view-gestion')).toHaveClass(/active/);
});
