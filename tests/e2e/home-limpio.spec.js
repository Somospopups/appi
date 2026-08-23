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
    if (url.pathname === '/rest/v1/appi_gestion_contactos' && route.request().method() === 'GET') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify(CONTACTOS) });
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

test('el mazo abre con la tarjeta especial primero y se pasa deslizando', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.APPIHomeTarjetas.abrir());
  const overlay = page.locator('#htOverlay');
  await expect(overlay).toBeVisible();
  // La primera es siempre la especial, con el aliento y el progreso real.
  await expect(overlay).toContainText('Tu impulso de hoy');
  await expect(overlay).toContainText('Para vos, María');
  await expect(page.locator('#htPos')).toContainText('1 de');
  // Pasar avanza a la siguiente categoría con contenido: Tu jornada.
  await page.evaluate(() => window.APPIHomeTarjetas.pasar());
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

test('el mazo queda a la vista: sin botón 🔔, sin ✕ de cierre, sin ✗ y sin Pasar (v318)', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.APPIHomeTarjetas.abrir());
  await expect(page.locator('#htOverlay')).toBeVisible();
  // Nada de cerrarlo ni descartarlo: las tarjetas viven siempre en el Home.
  await expect(page.locator('#htBoton')).toHaveCount(0);
  await expect(page.locator('#htCerrar')).toHaveCount(0);
  await expect(page.locator('.ht-x')).toHaveCount(0);
  await expect(page.locator('#htPasar')).toHaveCount(0);
  // Y el texto de abajo explica el bucle, no el viejo "volvés".
  await expect(page.locator('.ht-hint')).toContainText('dan la vuelta');
});

test('las tarjetas dan la vuelta en bucle para los dos lados (v318)', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.APPIHomeTarjetas.abrir());
  const total = await page.evaluate(() => window.APPIHomeTarjetas.armarTarjetas().length);
  expect(total).toBeGreaterThan(1);
  // Hacia adelante: pasar N veces da la vuelta completa y cae en la primera.
  for (let i = 0; i < total; i++) {
    await page.evaluate(() => window.APPIHomeTarjetas.pasar());
    await page.waitForTimeout(400);
  }
  await expect(page.locator('#htPos')).toContainText('1 de');
  await expect(page.locator('#htOverlay')).toContainText('Tu impulso de hoy');
  // Hacia atrás desde la primera: aparece la última, no rebota.
  await page.evaluate(() => window.APPIHomeTarjetas.volver());
  await page.waitForTimeout(400);
  await expect(page.locator('#htPos')).toContainText(`${total} de ${total}`);
  // Y el mazo sigue abierto: dar la vuelta nunca lo cierra.
  await expect(page.locator('#htOverlay')).toBeVisible();
});

test('deslizar a la izquierda pasa y a la derecha vuelve a la anterior', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.APPIHomeTarjetas.abrir());
  const top = () => page.locator('.ht-card:not(.detras1):not(.detras2):not(.ht-fantasma)');
  await expect(top()).toContainText('Tu impulso de hoy');
  // El mazo vive dentro del Home: lo traemos a la vista antes de arrastrar.
  await top().scrollIntoViewIfNeeded();
  // Izquierda: pasa a la siguiente.
  let box = await top().boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 - 170, box.y + box.height / 2 + 8, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator('#htPos')).toContainText('2 de');
  // Derecha: vuelve a la anterior.
  await page.waitForTimeout(450);
  await top().scrollIntoViewIfNeeded();
  box = await top().boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 170, box.y + box.height / 2 + 8, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator('#htPos')).toContainText('1 de');
  await expect(top()).toContainText('Tu impulso de hoy');
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

test('todas las tarjetas miden lo mismo', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.APPIHomeTarjetas.abrir());
  const r = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.ht-card')];
    return {
      alturas: cards.map(c => c.offsetHeight),
      anchos: cards.map(c => c.offsetWidth)
    };
  });
  expect(new Set(r.alturas).size).toBe(1);   // mismo alto para todas
  expect(new Set(r.anchos).size).toBe(1);    // mismo ancho para todas
});

test('tocar un renglón de la tarjeta te lleva directo, y la primera se hamaca', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.APPIHomeTarjetas.abrir());
  // La primera tarjeta hace el vaivén de demostración.
  await expect(page.locator('.ht-card.demo')).toHaveCount(1);
  // Pasamos a Tu jornada y tocamos a Jorge: tiene que abrir el Panel ya.
  await page.evaluate(() => window.APPIHomeTarjetas.pasar());
  await expect(page.locator('#htOverlay')).toContainText('Tu jornada');
  await page.locator('.ht-lista li', { hasText: 'Jorge Salas' }).click();
  await expect(page.locator('#htOverlay')).toHaveCount(0);
  await expect(page.locator('#view-gestion')).toHaveClass(/active/);
  // Auto-dirigible de verdad: la ficha de Jorge queda abierta, lista para actuar.
  await expect(page.locator('#gestionDrawer')).toContainText('Jorge Salas');
  await expect(page.locator('#gestionDrawer')).toContainText('WhatsApp');
});

test('tocar un cumpleaños saluda por WhatsApp directamente', async ({ page }) => {
  await entrar(page);
  const hoyLocal = new Date();
  const cumpleHoy = `1980-${String(hoyLocal.getMonth() + 1).padStart(2, '0')}-${String(hoyLocal.getDate()).padStart(2, '0')}`;
  await page.evaluate((cumple) => {
    // Ana cumple años hoy y tiene teléfono válido, en el campo REAL que
    // arma el lector de la planilla: `tel` (v320: antes el test sembraba
    // `telefono`, un campo que la planilla no genera, y eso tapaba el bug).
    const data = JSON.parse(localStorage.getItem('equipoData'));
    data.personas.push({ id: 9, nivel: 1, codigo: '02-111', nombre: 'LOPEZ, ANA', cat: 'D', pnAct: 2, cumple, tel: '351 766-9967', hijos: [] });
    localStorage.setItem('equipoData', JSON.stringify(data));
    if (typeof loadEquipoFromStorage === 'function') loadEquipoFromStorage();
    window.__saludos = [];
    window.APPITel.abrir = (tel, texto, nombre) => { window.__saludos.push({ tel, texto, nombre }); return true; };
  }, cumpleHoy);
  await page.evaluate(() => window.APPIHomeTarjetas.abrir());
  // La tarjeta de cumpleaños existe y tiene a Ana.
  const cats = await page.evaluate(() => window.APPIHomeTarjetas.armarTarjetas().map(t => t.cat));
  expect(cats).toContain('cumples');
  // Avanzamos hasta la tarjeta de cumpleaños y tocamos a Ana.
  while (!(await page.locator('.ht-card:not(.detras1):not(.detras2)').textContent()).includes('cumpleaños')) {
    await page.evaluate(() => window.APPIHomeTarjetas.pasar());
    await page.waitForTimeout(400);
  }
  await page.locator('.ht-lista li', { hasText: 'LOPEZ' }).click();
  const saludos = await page.evaluate(() => window.__saludos);
  expect(saludos).toHaveLength(1);
  expect(saludos[0].texto).toContain('Feliz cumpleaños, Ana');
  expect(saludos[0].tel).toContain('351');
  // El mazo se cerró en el camino.
  await expect(page.locator('#htOverlay')).toHaveCount(0);
});

test('el mazo espera a que la app cargue: nunca sobre la elección de persona', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => {
    localStorage.removeItem('appi_tarjetas_auto');
    // Como si el usuario estuviera eligiendo titular o socio.
    window.__pcOriginal = window.APPIAuth.needsPersonChoice;
    window.APPIAuth.needsPersonChoice = () => true;
    showView('view-mes');
    showView('view-home');
  });
  // Mientras la elección está abierta, el mazo NO aparece.
  await page.waitForTimeout(1800);
  await expect(page.locator('#htOverlay')).toHaveCount(0);
  // Al cerrarse la elección, la app quedó lista y el mazo recién ahí sale.
  await page.evaluate(() => { window.APPIAuth.needsPersonChoice = window.__pcOriginal || (() => false); });
  await expect(page.locator('#htOverlay')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('#htOverlay')).toContainText('Tu impulso de hoy');
});

test('un toque con temblor de dedo sobre el botón dispara la acción igual', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.APPIHomeTarjetas.abrir());
  await page.evaluate(() => window.APPIHomeTarjetas.pasar());
  await expect(page.locator('#htOverlay')).toContainText('Tu jornada');
  // El dedo real no baja quieto: baja, tiembla ~9px y suelta. Eso es un TOQUE.
  await page.evaluate(() => {
    const cta = document.querySelector('.ht-card:not(.detras1):not(.detras2) .ht-cta');
    const r = cta.getBoundingClientRect();
    const x = r.x + r.width / 2, y = r.y + r.height / 2;
    const fire = (type, cx) => cta.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: cx, clientY: y, pointerId: 1, pointerType: 'touch' }));
    fire('pointerdown', x);
    fire('pointermove', x + 5);
    fire('pointermove', x + 9);
    fire('pointerup', x + 9);
    cta.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: x + 9, clientY: y }));
  });
  await expect(page.locator('#htOverlay')).toHaveCount(0, { timeout: 3000 });
  await expect(page.locator('#gestionDrawer')).toContainText('Jorge Salas');
});

test('las tareas del calendario aceptan hora y se ordenan por ella', async ({ page }) => {
  await entrar(page);
  await page.locator('#hlCardOpen').click();
  await expect(page.locator('.cal-overlay')).toBeVisible();
  // Una tarea a las 18:30…
  await page.locator('#calNewHora').fill('18:30');
  await page.locator('#calNewTask').fill('Demo con Marta');
  await page.locator('#calAddBtn').click();
  // …otra más temprano, a las 09:15…
  await page.locator('#calNewHora').fill('09:15');
  await page.locator('#calNewTask').fill('Llamar a Pedro');
  await page.locator('#calAddBtn').click();
  // …y una sin hora.
  await page.locator('#calNewTask').fill('Ordenar el stock');
  await page.locator('#calAddBtn').click();
  // Se muestran con su hora, ordenadas: 09:15, 18:30 y al final la suelta.
  const tareas = page.locator('.cal-task');
  await expect(tareas).toHaveCount(3);
  await expect(tareas.nth(0)).toContainText('09:15');
  await expect(tareas.nth(0)).toContainText('Llamar a Pedro');
  await expect(tareas.nth(1)).toContainText('18:30');
  await expect(tareas.nth(2)).toContainText('Ordenar el stock');
  // Y en Tu jornada, la tarea sale con su hora en la línea de tiempo.
  await page.locator('#calClose').click();
  await expect(page.locator('#homeLimpio')).toContainText('09:15');
  await expect(page.locator('#homeLimpio')).toContainText('Llamar a Pedro');
});

test('cerrar el calendario devuelve el scroll en toda la app (regresión v300)', async ({ page }) => {
  await entrar(page);
  // Abrir y cerrar el calendario bloqueaba el scroll para siempre: el guard
  // de overlays veía el popup oculto de Crear cuenta y nunca liberaba.
  await page.locator('#hlCardOpen').click();
  await expect(page.locator('.cal-overlay')).toBeVisible();
  await page.locator('#calClose').click();
  const overflow = await page.evaluate(() => document.body.style.overflow);
  expect(overflow).not.toBe('hidden');
  // Y en Mi Equipo se scrollea normal.
  await page.evaluate(() => {
    window.openEquipo();
    const sp = document.createElement('div');
    sp.style.height = '2000px';
    document.getElementById('view-equipo').appendChild(sp);
  });
  await page.mouse.move(640, 400);
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(300);
  const top = await page.evaluate(() => document.body.scrollTop || window.scrollY);
  expect(top).toBeGreaterThan(100);
});

// v319 · El vuelo al volver era distinto: la tarjeta anterior "entraba desde
// el costado" en vez de que la de arriba volara. Ahora los dos lados usan el
// mismo gesto, espejado: a la izquierda vuela girando a la izquierda, a la
// derecha vuela girando a la derecha, y la que sigue sube desde atrás.
test('deslizar a la derecha vuela con el mismo gesto que a la izquierda, espejado (v319)', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.APPIHomeTarjetas.abrir());
  await page.evaluate(() => window.APPIHomeTarjetas.pasar());
  await page.waitForTimeout(450);
  await expect(page.locator('#htPos')).toContainText('2 de');
  // Al volver, la tarjeta de arriba vuela hacia la derecha girando: espejo
  // exacto del vuelo de pasar. Ninguna entra desde el costado.
  const vuelo = await page.evaluate(() => {
    window.APPIHomeTarjetas.volver();
    const f = document.querySelector('.ht-card.ht-fantasma.vuela');
    return f ? f.style.transform : '(sin fantasma volando)';
  });
  expect(vuelo).toContain('translateX(130vw)');
  expect(vuelo).not.toContain('-130vw');
  expect(vuelo).toContain('rotate(22deg)');
  // Termina el vuelo: el fantasma desaparece y la primera quedó arriba.
  await page.waitForTimeout(600);
  await expect(page.locator('.ht-fantasma')).toHaveCount(0);
  await expect(page.locator('#htPos')).toContainText('1 de');
  await expect(page.locator('.ht-card:not(.detras1):not(.detras2)')).toContainText('Tu impulso de hoy');
});

// v320 · Los cumpleañeros y las oportunidades de bonus del equipo salen de la
// planilla de Línea Descendente, donde el teléfono se llama `tel`. Las
// tarjetas buscaban `telefono`/`telf` (campos que la planilla no genera), así
// que con datos reales nunca encontraban el número y en vez de abrir el
// WhatsApp del cumpleañero mandaban a Mi Equipo.
test('proponer el bonus abre el WhatsApp de la persona con el teléfono real de la planilla (v320)', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => {
    // María viene de la planilla con su teléfono en `tel`, como en la vida real.
    const data = JSON.parse(localStorage.getItem('equipoData'));
    data.personas[0].tel = '351 766-9967';
    localStorage.setItem('equipoData', JSON.stringify(data));
    if (typeof loadEquipoFromStorage === 'function') loadEquipoFromStorage();
    window.__saludos = [];
    window.APPITel.abrir = (tel, texto, nombre) => { window.__saludos.push({ tel, texto, nombre }); return true; };
  });
  await page.evaluate(() => window.APPIHomeTarjetas.abrir());
  // Avanzamos hasta la tarjeta de Oportunidades y tocamos a María.
  while (!(await page.locator('.ht-card:not(.detras1):not(.detras2):not(.ht-fantasma)').textContent()).includes('Oportunidades')) {
    await page.evaluate(() => window.APPIHomeTarjetas.pasar());
    await page.waitForTimeout(400);
  }
  await page.locator('.ht-lista li', { hasText: 'María' }).click();
  const saludos = await page.evaluate(() => window.__saludos);
  expect(saludos).toHaveLength(1);
  expect(saludos[0].texto).toContain('Bonus');
  expect(saludos[0].tel).toContain('351');
});

// v322 · Con dos cumpleañeros en la tarjeta, el primero saludaba por WhatsApp
// pero el segundo no. Este test toca el SEGUNDO renglón y exige su saludo.
test('con dos cumpleañeros, el segundo renglón también saluda por WhatsApp (v322)', async ({ page }) => {
  await entrar(page);
  const hoyLocal = new Date();
  const cumpleHoy = `1980-${String(hoyLocal.getMonth() + 1).padStart(2, '0')}-${String(hoyLocal.getDate()).padStart(2, '0')}`;
  await page.evaluate((cumple) => {
    // Dos del equipo cumplen hoy, ambos con teléfono real de planilla (tel).
    const data = JSON.parse(localStorage.getItem('equipoData'));
    data.personas.push({ id: 9, nivel: 1, codigo: '02-111', nombre: 'TRONCOSO, SEBASTIAN', cat: 'D', pnAct: 2, cumple, tel: '351 766-9967', hijos: [] });
    data.personas.push({ id: 10, nivel: 1, codigo: '02-222', nombre: 'OVIEDO, MARCELA', cat: 'D', pnAct: 1, cumple, tel: '3515 55-1002', hijos: [] });
    localStorage.setItem('equipoData', JSON.stringify(data));
    if (typeof loadEquipoFromStorage === 'function') loadEquipoFromStorage();
    window.__saludos = [];
    window.APPITel.abrir = (tel, texto, nombre) => { window.__saludos.push({ tel, texto, nombre }); return true; };
  }, cumpleHoy);
  await page.evaluate(() => window.APPIHomeTarjetas.abrir());
  while (!(await page.locator('.ht-card:not(.detras1):not(.detras2):not(.ht-fantasma)').textContent()).includes('cumpleaños')) {
    await page.evaluate(() => window.APPIHomeTarjetas.pasar());
    await page.waitForTimeout(400);
  }
  await page.locator('.ht-lista li', { hasText: 'OVIEDO' }).click();
  const saludos = await page.evaluate(() => window.__saludos);
  expect(saludos).toHaveLength(1);
  expect(saludos[0].texto).toContain('Feliz cumpleaños, Marcela');
  expect(saludos[0].tel).toContain('351');
});

// v322 · El caso real del reporte: el segundo cumpleañero no tenía teléfono
// válido en la planilla y el toque abría Mi Equipo en silencio — parecía roto.
// Ahora el renglón avisa "sin teléfono" y el toque lo explica con un diálogo.
test('el cumpleañero sin teléfono lo dice en el renglón y el toque lo explica (v322)', async ({ page }) => {
  await entrar(page);
  const hoyLocal = new Date();
  const cumpleHoy = `1980-${String(hoyLocal.getMonth() + 1).padStart(2, '0')}-${String(hoyLocal.getDate()).padStart(2, '0')}`;
  await page.evaluate((cumple) => {
    const data = JSON.parse(localStorage.getItem('equipoData'));
    data.personas.push({ id: 9, nivel: 1, codigo: '02-111', nombre: 'TRONCOSO, SEBASTIAN', cat: 'D', pnAct: 2, cumple, tel: '351 766-9967', hijos: [] });
    data.personas.push({ id: 10, nivel: 1, codigo: '02-222', nombre: 'OVIEDO, MARCELA', cat: 'D', pnAct: 1, cumple, tel: '', hijos: [] });
    localStorage.setItem('equipoData', JSON.stringify(data));
    if (typeof loadEquipoFromStorage === 'function') loadEquipoFromStorage();
    window.__saludos = [];
    window.APPITel.abrir = (tel, texto, nombre) => { window.__saludos.push({ tel, texto, nombre }); return true; };
  }, cumpleHoy);
  await page.evaluate(() => window.APPIHomeTarjetas.abrir());
  while (!(await page.locator('.ht-card:not(.detras1):not(.detras2):not(.ht-fantasma)').textContent()).includes('cumpleaños')) {
    await page.evaluate(() => window.APPIHomeTarjetas.pasar());
    await page.waitForTimeout(400);
  }
  // El renglón de Marcela avisa que no hay número; el de Sebastián no.
  const fila = page.locator('.ht-lista li', { hasText: 'OVIEDO' });
  await expect(fila).toContainText('sin teléfono');
  await expect(page.locator('.ht-lista li', { hasText: 'TRONCOSO' })).not.toContainText('sin teléfono');
  // Tocarla no abre WhatsApp ni manda a otra pantalla en silencio: explica.
  await fila.click();
  await expect(page.locator('.appi-dialog-overlay:not([hidden])')).toBeVisible();
  await expect(page.locator('.appi-dialog-overlay')).toContainText('planilla');
  const saludos = await page.evaluate(() => window.__saludos);
  expect(saludos).toHaveLength(0);
});
