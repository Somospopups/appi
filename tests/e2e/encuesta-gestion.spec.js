const { test, expect } = require('@playwright/test');

const USER_ID = '11111111-1111-4111-8111-111111111111';
const LINK_TOKEN = '99999999-9999-4999-8999-999999999999';
const SURVEY_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const CONTACT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function tokenFor(sub) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${header}.${payload}.firma`;
}

function completeAnswers() {
  return {
    agua_tipo: ['Filtrada/Purificada'],
    agua_cantidad: ['2 a 3 litros'],
    agua_importancia: 10,
    agua_calidad: ['Buena'],
    agua_calidad_como: ['Buena'],
    agua_proviene: ['Sí'],
    agua_anomalias: ['Ninguna'],
    agua_turbidez: ['No'],
    agua_potabilizadores: ['Cloro'],
    evitar_sustancias: ['Sí'],
    alternativas_evitar: ['Purificadores de agua'],
    ambiente: ['Sí, mucho'],
    laboral_dedica: ['Independiente/Autónomo'],
    laboral_gusta: ['Horarios flexibles'],
    laboral_mejorar: ['Sueldo'],
    conoces: ['Sí, alguno'],
    oportunidad: ['Quiero más info']
  };
}

test('la encuesta pública se abre sin login y entrega la respuesta al enlace correcto', async ({ page }) => {
  let submitted = null;
  let claimed = null;
  await page.route('**/auth-config.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: "window.APPI_AUTH={url:'https://mock.supabase.co',anonKey:'anon-key-publica-de-prueba-1234567890'};"
  }));
  await page.route('https://mock.supabase.co/functions/v1/encuesta-publica**', route => {
    const request = route.request();
    if (request.method() === 'GET') {
      claimed = new URL(request.url()).searchParams.get('claim_id');
      return route.fulfill({
        status: 200,
        headers: { 'access-control-allow-origin': '*' },
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, distribuidor: 'Distribuidor A' })
      });
    }
    submitted = request.postDataJSON();
    return route.fulfill({
      status: 201,
      headers: { 'access-control-allow-origin': '*' },
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, recibida: true, encuesta_id: SURVEY_ID, referidos: 1 })
    });
  });

  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(`/encuesta.html?t=${LINK_TOKEN}`, { waitUntil: 'networkidle' });
  await expect(page.locator('#heroEyebrow')).toContainText('Distribuidor A');
  await expect(page.locator('.step-head h2')).toHaveText('Tus datos');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360);

  await page.evaluate(() => APPIEncuesta.setData({ step: 2, answers: {} }));
  const stableOption = page.locator('[data-field="agua_turbidez"][data-value="No"]');
  await stableOption.scrollIntoViewIfNeeded();
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await stableOption.click();
  const scrollAfter = await page.evaluate(() => window.scrollY);
  expect(Math.abs(scrollAfter - scrollBefore)).toBeLessThanOrEqual(2);

  await page.evaluate(({ answers }) => {
    APPIEncuesta.setData({
      step: 5,
      nombre: 'Persona Encuestada',
      telefono: '351 555 1234',
      answers,
      referidos: [{ nombre: 'Referido Uno', telefono: '351 555 9876', relacion: 'Amigo', zona: 'Córdoba' }],
      consentimiento: true,
      autorizacion_referidos: true
    });
  }, { answers: completeAnswers() });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360);
  await page.locator('#nextStep').click();

  await expect(page.locator('.success h2')).toHaveText('¡Gracias por responder!');
  expect(submitted).toMatchObject({
    token: LINK_TOKEN,
    nombre: 'Persona Encuestada',
    consentimiento: true,
    autorizacion_referidos: true
  });
  expect(submitted.claim_id).toBe(claimed);
  expect(submitted.claim_id).toMatch(/^[0-9a-f-]{36}$/i);
  expect(submitted.referidos).toHaveLength(1);
  expect(submitted.respuestas.oportunidad).toEqual(['Quiero más info']);
});

test('permite elegir varios referidos desde la agenda sin duplicarlos', async ({ page }) => {
  const nativeDialogs = [];
  page.on('dialog', dialog => { nativeDialogs.push(dialog.type()); dialog.dismiss(); });
  await page.addInitScript(() => {
    const picker = {
      select: async () => [
        { name: ['Ana Agenda'], tel: ['351 555 1001'] },
        { name: ['Bruno Agenda'], tel: ['351 555 1002'] },
        { name: ['Ana repetida'], tel: ['351 555 1001'] },
        { name: ['La persona encuestada'], tel: ['351 555 0000'] }
      ]
    };
    Object.defineProperty(Navigator.prototype, 'contacts', { configurable: true, get: () => picker });
  });
  await page.route('**/auth-config.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: "window.APPI_AUTH={url:'https://mock.supabase.co',anonKey:'anon-key-publica-de-prueba-1234567890'};"
  }));
  await page.route('https://mock.supabase.co/functions/v1/encuesta-publica**', route => route.fulfill({
    status: 200,
    headers: { 'access-control-allow-origin': '*' },
    contentType: 'application/json',
    body: JSON.stringify({ ok: true, distribuidor: 'Distribuidor A' })
  }));

  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(`/encuesta.html?t=${LINK_TOKEN}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => APPIEncuesta.setData({ step: 4, nombre: 'Persona Encuestada', telefono: '351 555 0000', referidos: [] }));
  await page.locator('#pickContacts').click();

  await expect(page.locator('.ref-card')).toHaveCount(2);
  await expect(page.locator('#appiDialogTitle')).toHaveText('Referidos agregados');
  const referrals = await page.evaluate(() => APPIEncuesta.getData().referidos);
  expect(referrals.map(item => item.nombre)).toEqual(['Ana Agenda', 'Bruno Agenda']);
  expect(new Set(referrals.map(item => item.telefono.replace(/\D/g, ''))).size).toBe(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360);
  expect(nativeDialogs).toEqual([]);
});

test('Mi Encuesta y Mi Gestión usan la cuenta autenticada y guardan el seguimiento', async ({ page }) => {
  const nativeDialogs = [];
  const patches = [];
  const activities = [];
  page.on('dialog', dialog => { nativeDialogs.push(dialog.type()); dialog.dismiss(); });

  const accessToken = tokenFor(USER_ID);
  const now = new Date().toISOString();
  const invitationTokens = [LINK_TOKEN, '88888888-8888-4888-8888-888888888888', '77777777-7777-4777-8777-777777777777'];
  let invitationIndex = 0;
  const profile = {
    user_id: USER_ID, username: null, dip: '02-9802014', sucursal: '02', numero_distribuidor: '9802014',
    nombre: 'María Pérez', rol: 'usuario', activo: true, debe_cambiar_password: false,
    membresia_meses: 1, membresia_inicio: now, membresia_vence: new Date(Date.now() + 30 * 86400000).toISOString()
  };
  const contacts = [
    {
      id: CONTACT_ID, user_id: USER_ID, encuesta_id: SURVEY_ID, tipo: 'encuestado', nombre: 'Persona Encuestada',
      telefono: '351 555 1234', telefono_normalizado: '3515551234', relacion: '', zona: 'Córdoba', referido_por: '',
      estado: 'nuevo', notas: '', proximo_contacto: null, ultimo_contacto: null, cantidad_origenes: 1,
      metadata: {}, created_at: now, updated_at: now
    },
    {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', user_id: USER_ID, encuesta_id: SURVEY_ID, tipo: 'referido', nombre: 'Referido Uno',
      telefono: '351 555 9876', telefono_normalizado: '3515559876', relacion: 'Amigo', zona: 'Córdoba', referido_por: 'Persona Encuestada',
      estado: 'seguimiento', notas: '', proximo_contacto: null, ultimo_contacto: null, cantidad_origenes: 1,
      metadata: {}, created_at: now, updated_at: now
    }
  ];

  await page.route('**/auth-config.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: "window.APPI_AUTH={enabled:true,url:'https://mock.supabase.co',anonKey:'anon-key-publica-de-prueba-1234567890',distributorEmailDomain:'distribuidores.appi.invalid',adminLogin:{username:'popups',email:'admin-popups@appi.invalid'},loginAliases:{},offlineDays:7};"
  }));
  await page.route('https://mock.supabase.co/**', route => {
    const request = route.request();
    const url = new URL(request.url());
    const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
    if (url.pathname === '/auth/v1/token') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ access_token: accessToken, refresh_token: 'refresh', expires_in: 3600, user: { id: USER_ID } }) });
    if (url.pathname === '/rest/v1/appi_perfiles') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([profile]) });
    if (url.pathname === '/rest/v1/appi_datos' && request.method() === 'GET') return route.fulfill({ status: 200, headers: cors, body: '[]' });
    if (url.pathname === '/rest/v1/rpc/appi_crear_invitacion_encuesta') {
      const issued = invitationTokens[Math.min(invitationIndex++, invitationTokens.length - 1)];
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([{ token: issued, expires_at: new Date(Date.now() + 86400000).toISOString() }]) });
    }
    if (url.pathname === '/rest/v1/appi_gestion_contactos' && request.method() === 'GET') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify(contacts) });
    if (url.pathname === '/rest/v1/appi_gestion_contactos' && request.method() === 'PATCH') {
      patches.push(request.postDataJSON());
      return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' }, body: '' });
    }
    if (url.pathname === '/rest/v1/appi_gestion_actividades' && request.method() === 'GET') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify(activities) });
    if (url.pathname === '/rest/v1/appi_gestion_actividades' && request.method() === 'POST') {
      activities.push(request.postDataJSON());
      return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' }, body: '' });
    }
    if (url.pathname === '/rest/v1/appi_encuestas') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([{ id: SURVEY_ID, user_id: USER_ID, nombre: 'Persona Encuestada', telefono: '351 555 1234', respuestas: completeAnswers(), referidos: [], created_at: now }]) });
    return route.fulfill({ status: 404, headers: cors, body: JSON.stringify({ error: 'Ruta simulada no encontrada' }) });
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('tutoVisto_v2', '1');
  });
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
  await expect.poll(() => page.evaluate(() => APPIAuth.currentProfile()?.dip || '')).toBe('02-9802014');
  await expect(page.locator('#view-home')).toHaveClass(/active/);

  await page.evaluate(() => openEncuestaTool());
  await expect(page.locator('#view-encuesta')).toHaveClass(/active/);
  await expect(page.locator('#surveyToolContent')).toContainText('vence en 24 horas');
  await page.evaluate(() => APPIGestion.createInvitation());
  await expect(page.locator('.survey-link-value')).toContainText(LINK_TOKEN);
  const friendlyMessage = await page.evaluate(() => APPIGestion.shareMessage(APPIGestion.surveyUrl()));
  expect(friendlyMessage).toContain('Soy María');
  expect(friendlyMessage).not.toContain('Pérez');
  expect(friendlyMessage).not.toContain('APPI');
  expect(friendlyMessage).toContain(LINK_TOKEN);
  await page.evaluate(() => { void APPIGestion.prepareBulk([{ nombre: 'Ana Uno', telefono: '3515551001' }, { nombre: 'Bruno Dos', telefono: '3515551002' }]); });
  await expect(page.locator('.survey-bulk-item')).toHaveCount(2);
  await expect(page.locator('.survey-bulk-item').first()).toContainText('Ana Uno');
  await expect(page.locator('#appiDialogTitle')).toHaveText('Envíos preparados');
  await page.locator('#appiDialogOk').click();

  await page.evaluate(() => openMiGestion());
  await expect(page.locator('#view-gestion')).toHaveClass(/active/);
  await expect(page.locator('.gestion-main-tab')).toHaveCount(4);
  await expect(page.locator('.gestion-contact')).toHaveCount(2);
  await expect(page.locator(`.gestion-contact[data-contact-id="${CONTACT_ID}"]`)).toHaveClass(/priority-high/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await expect(page.locator('.gestion-stat').first().locator('b')).toHaveText('1');
  await expect(page.locator('#gestionSidebarBadge')).toHaveText('2');
  await page.locator('[data-gestion-view="embudo"]').click();
  await expect(page.locator('.gestion-funnel-stage')).toHaveCount(5);
  await page.locator('[data-gestion-view="resultados"]').click();
  await expect(page.locator('.gestion-result')).toHaveCount(7);
  await page.locator('[data-gestion-view="hoy"]').click();

  await page.locator(`[data-open-contact="${CONTACT_ID}"]`).click();
  await expect(page.locator('#gestionDetailOverlay')).toBeVisible();
  await expect(page.locator('.gestion-message-link')).toHaveCount(4);
  await expect(page.locator('.gestion-timeline')).toContainText('Contacto creado');
  await page.locator('[data-detail-status="convertido"]').click();
  await page.locator('#gestionNotes').fill('Presentación realizada. Quiere avanzar.');
  await page.locator('#gestionNextDate').fill('2026-08-20');
  await page.locator('#gestionSaveContact').click();

  await expect.poll(() => patches.length).toBeGreaterThanOrEqual(1);
  const convertedPatch = patches.find(item => item.estado === 'convertido');
  expect(convertedPatch).toMatchObject({
    estado: 'convertido',
    notas: 'Presentación realizada. Quiere avanzar.',
    proximo_contacto: '2026-08-20'
  });
  await expect.poll(() => activities.length).toBeGreaterThanOrEqual(2);
  expect(activities.map(item => item.tipo)).toContain('estado_cambiado');
  expect(activities.map(item => item.tipo)).toContain('nota');

  await page.evaluate(() => {
    localStorage.setItem(`appi_gestion_resultado_pendiente_${APPIAuth.userId()}`, JSON.stringify({ contactId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', channel: 'whatsapp', at: Date.now() - 3000 }));
    void APPIGestion.processPendingOutcome();
  });
  await expect(page.locator('#appiDialogTitle')).toHaveText('Resultado de WhatsApp');
  await page.locator('#appiDialogChoices button', { hasText: 'No respondió' }).click();
  await expect(page.locator('#appiDialogTitle')).toHaveText('No respondió');
  await page.locator('#appiDialogChoices button', { hasText: 'Mañana' }).click();
  await expect.poll(() => patches.some(item => item.estado === 'seguimiento' && item.proximo_contacto)).toBe(true);
  await expect.poll(() => activities.some(item => item.tipo === 'resultado_contacto')).toBe(true);
  expect(nativeDialogs).toEqual([]);
});
