const { test, expect } = require('@playwright/test');

const USER_ID = '11111111-1111-4111-8111-111111111111';

function tokenFor(sub) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${header}.${payload}.firma`;
}

function isoDate(delta = 0) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

function sampleContacts() {
  const now = new Date().toISOString();
  return [
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', user_id: USER_ID, encuesta_id: null,
      tipo: 'manual', nombre: 'Marta García', telefono: '351 555 1042', telefono_normalizado: '3515551042',
      relacion: '', zona: 'Córdoba', referido_por: '', estado: 'seguimiento', notas: '',
      proximo_contacto: isoDate(-1), proximo_contacto_hora: null, ultimo_contacto: null,
      cantidad_origenes: 1, metadata: {}, created_at: now, updated_at: now
    },
    {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', user_id: USER_ID, encuesta_id: null,
      tipo: 'encuestado', nombre: 'Carlos López', telefono: '351 555 8081', telefono_normalizado: '3515558081',
      relacion: '', zona: '', referido_por: '', estado: 'nuevo', notas: '',
      proximo_contacto: null, proximo_contacto_hora: null, ultimo_contacto: null,
      cantidad_origenes: 1, metadata: {}, created_at: now, updated_at: now
    },
    {
      id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', user_id: USER_ID, encuesta_id: null,
      tipo: 'referido', nombre: 'Ana Pereyra', telefono: '351 555 2236', telefono_normalizado: '3515552236',
      relacion: 'Amiga', zona: '', referido_por: 'Carlos López', estado: 'presentacion', notas: '',
      proximo_contacto: isoDate(0), proximo_contacto_hora: '17:00:00', ultimo_contacto: now,
      cantidad_origenes: 1, metadata: {}, created_at: now, updated_at: now
    },
    {
      id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', user_id: USER_ID, encuesta_id: null,
      tipo: 'manual', nombre: 'Diego Ruiz', telefono: '351 555 9007', telefono_normalizado: '3515559007',
      relacion: '', zona: '', referido_por: '', estado: 'convertido', notas: 'Cierre realizado.',
      proximo_contacto: null, proximo_contacto_hora: null, ultimo_contacto: now,
      cantidad_origenes: 1, metadata: {}, created_at: now, updated_at: now
    }
  ];
}

async function enter(page, contacts = sampleContacts()) {
  const accessToken = tokenFor(USER_ID);
  const now = new Date().toISOString();
  const profile = {
    user_id: USER_ID, dip: '02-9802014', sucursal: '02', numero_distribuidor: '9802014',
    nombre: 'María Pérez', rol: 'usuario', activo: true, debe_cambiar_password: false,
    membresia_meses: 1, membresia_inicio: now,
    membresia_vence: new Date(Date.now() + 30 * 86400000).toISOString()
  };

  await page.route('**/auth-config.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: "window.APPI_AUTH={enabled:true,url:'https://mock.supabase.co',anonKey:'anon-key-publica-de-prueba',distributorEmailDomain:'distribuidores.appi.invalid',adminLogin:{username:'popups',email:'admin-popups@appi.invalid'},loginAliases:{},offlineDays:7};"
  }));
  await page.route('https://mock.supabase.co/**', route => {
    const request = route.request();
    const url = new URL(request.url());
    const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
    if (url.pathname === '/auth/v1/token') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ access_token: accessToken, refresh_token: 'r', expires_in: 3600, user: { id: USER_ID } }) });
    if (url.pathname === '/rest/v1/appi_perfiles') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([profile]) });
    if (url.pathname === '/rest/v1/appi_gestion_contactos') return route.fulfill({ status: 200, headers: cors, body: request.method() === 'GET' ? JSON.stringify(contacts) : '' });
    if (url.pathname === '/rest/v1/rpc/appi_crear_invitacion_encuesta') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([{ token: '77777777-7777-4777-8777-777777777777', expires_at: new Date(Date.now() + 86400000).toISOString() }]) });
    if (url.pathname === '/functions/v1/dispositivo-puente') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ devices: [] }) });
    return route.fulfill({ status: 200, headers: cors, body: '[]' });
  });

  await page.addInitScript(([uid, rows]) => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('appi_tarjetas_auto', '0');
    localStorage.setItem('tutoVisto_v2', '1');
    localStorage.setItem(`appi_gestion_cache_v1_${uid}`, JSON.stringify({ contacts: rows, surveys: [], activities: [], savedAt: Date.now() }));
    window.open = () => ({ closed: false, close() {}, location: { set href(v) {}, get href() { return ''; } } });
  }, [USER_ID, contacts]);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
  await expect(page.locator('#bootScreen')).toHaveCount(0, { timeout: 5000 });
}

test('Mi Encuesta es la primera herramienta y abre su propia pantalla', async ({ page }) => {
  await enter(page);
  await page.evaluate(() => { window.renderHomeCompleto(); window.showView('view-herramientas'); });

  const firstTool = page.locator('#herrGrid .quick-tool-card').first();
  await expect(firstTool).toContainText('Mi Encuesta');
  await expect(firstTool).toContainText('Compartila por WhatsApp');
  await firstTool.click();

  await expect(page.locator('#view-encuesta')).toHaveClass(/active/);
  await expect(page.locator('#surveyShareBtn')).toBeVisible();
  await expect(page.locator('#surveyToolContent')).toContainText('Las respuestas y los referidos aparecerán automáticamente');
  await expect(page.locator('#view-gestion')).not.toHaveClass(/active/);

  await page.locator('#btnBackEncuesta').click();
  await expect(page.locator('#view-herramientas')).toHaveClass(/active/);
});

test('el Panel queda dedicado al seguimiento y ya no mezcla encuesta ni dos agendas', async ({ page }) => {
  await enter(page);
  await page.evaluate(() => window.openMiGestion());

  await expect(page.locator('#view-gestion')).toHaveClass(/active/);
  await expect(page.locator('#surveyShareBtn')).toHaveCount(0);
  await expect(page.locator('.gente-nota')).toHaveCount(0);
  await expect(page.locator('#genteNuevo')).toBeVisible();
  await expect(page.locator('[data-agenda-vista="personal"]')).toContainText('Contactos del teléfono');
  await expect(page.locator('[data-agenda-vista="appi"]')).toHaveCount(0);
  await expect(page.locator('.gestion-main-tab')).toHaveText([/Hoy/, /Todos/, /Resultados/]);

  await expect(page.locator('.gestion-today-summary')).toContainText('Tenés 3 personas para atender');
  await expect(page.locator('.gestion-stats')).toHaveCount(0);
  await expect(page.locator('.gestion-priority-pill')).toHaveCount(0);
  await expect(page.locator('.gestion-contact').first()).toContainText('Seguimiento vencido');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);

  await page.locator('[data-agenda-vista="personal"]').click();
  await expect(page.locator('.gestion-back-contacts')).toBeVisible();
  await expect(page.locator('.gestion-main-tab')).toHaveCount(0);
  await page.locator('.gestion-back-contacts').click();
  await expect(page.locator('[data-gestion-view="hoy"]')).toBeVisible();
});

test('Todos usa cuatro filtros simples y Resultados muestra primero sólo tres números', async ({ page }) => {
  await enter(page);
  await page.evaluate(() => window.openMiGestion());

  await page.locator('[data-gestion-view="todos"]').click();
  await expect(page.locator('.gestion-filter')).toHaveText([
    /Todos · 4/, /Por contactar · 1/, /En seguimiento · 2/, /Cerrados · 1/
  ]);
  await expect(page.locator('.gestion-list-options')).not.toHaveAttribute('open', '');

  await page.locator('[data-gestion-view="resultados"]').click();
  await expect(page.locator('.gestion-result-main .gestion-result')).toHaveCount(3);
  await expect(page.locator('.gestion-result-main')).toContainText('Contactos nuevos');
  await expect(page.locator('.gestion-result-main')).toContainText('Presentaciones');
  await expect(page.locator('.gestion-result-main')).toContainText('Cierres');
  await expect(page.locator('.gestion-funnel-stage').first()).toBeHidden();

  await page.locator('.gestion-results-more > summary').click();
  await expect(page.locator('.gestion-funnel-stage').first()).toBeVisible();
});

test('la ficha no muestra puntos y deja mensajes e historial plegados', async ({ page }) => {
  await enter(page);
  await page.evaluate(() => window.openMiGestion());
  await page.locator('[data-open-contact="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"]').click();

  const drawer = page.locator('#gestionDrawer');
  await expect(drawer).toBeVisible();
  await expect(drawer).not.toContainText('puntos');
  await expect(drawer).toContainText('Próximo paso');
  await expect(page.locator('.gestion-fold').filter({ hasText: 'Mensajes preparados' })).not.toHaveAttribute('open', '');
  await expect(page.locator('.gestion-fold').filter({ hasText: 'Historial de actividades' })).not.toHaveAttribute('open', '');
});

test('después de contactar muestra cuatro resultados claros y abre el cierre sólo si hace falta', async ({ page }) => {
  await enter(page);
  await page.evaluate(() => window.openMiGestion());
  await page.evaluate(() => {
    localStorage.setItem(`appi_gestion_resultado_pendiente_${APPIAuth.userId()}`, JSON.stringify({
      contactId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', channel: 'whatsapp', at: Date.now() - 3000
    }));
    void APPIGestion.processPendingOutcome();
  });

  await expect(page.locator('#appiDialogChoices button')).toHaveText([
    'No respondió', 'Conversamos', 'Acordamos una presentación', 'Cerrado'
  ]);
  await page.locator('#appiDialogChoices button', { hasText: 'Cerrado' }).click();
  await expect(page.locator('#appiDialogTitle')).toHaveText('Cerrar contacto');
  await expect(page.locator('#appiDialogChoices button')).toHaveText(['Se convirtió', 'No está interesado']);
});

test('sin contactos ofrece ir a Mi Encuesta, pero no la mezcla con la lista', async ({ page }) => {
  await enter(page, []);
  await page.evaluate(() => window.openMiGestion());

  await expect(page.locator('#gestionGoSurvey')).toBeVisible();
  await expect(page.locator('#surveyShareBtn')).toHaveCount(0);
  await page.locator('#gestionGoSurvey').click();
  await expect(page.locator('#view-encuesta')).toHaveClass(/active/);
  await expect(page.locator('#surveyShareBtn')).toBeVisible();
});
