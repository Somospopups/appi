const { test, expect } = require('@playwright/test');

// La solapa "📱 AGENDA PERSONAL" del Panel de Contactos (v357): subir la
// agenda del teléfono (.vcf en cualquier equipo, selector nativo donde esté)
// y pasar cada contacto a la Agenda APPI de a uno, con confirmación.

const USER_ID = '11111111-1111-4111-8111-111111111111';
const HOY = new Date().toISOString();

function tokenFor(sub) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${header}.${payload}.firma`;
}

const CONTACTOS_APPI = [
  {
    id: 'c-laura', user_id: USER_ID, estado: 'nuevo', nombre: 'Laura Gómez',
    telefono: '3515551234', telefono_normalizado: '3515551234', tipo: 'contacto',
    zona: 'Centro', created_at: HOY, updated_at: HOY, metadata: {}
  }
];

// Una agenda mixta: formato Android 3.0, iPhone (iCloud) 3.0, una 2.1 vieja
// con QUOTED-PRINTABLE, un teléfono repetido y uno sin número.
const VCF = [
  'BEGIN:VCARD',
  'VERSION:3.0',
  'FN:Juan Pérez',
  'N:Pérez;Juan;;;',
  'TEL;TYPE=CELL:3515551111',
  'TEL;TYPE=HOME,VOICE:03543123456',
  'END:VCARD',
  'BEGIN:VCARD',
  'VERSION:3.0',
  'N:Gómez;María;;;',
  'FN:María Gómez',
  'TEL;TYPE=CELL,VOICE,pref=1:+54 9 351 555 2222',
  'END:VCARD',
  // 2.1 con QUOTED-PRINTABLE: el valor sigue en la línea de abajo
  // (soft break: '=' al final, la próxima línea continúa el texto).
  'BEGIN:VCARD',
  'VERSION:2.1',
  'N;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:P=C3=A9rez;Jos=C3=A9',
  'FN;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:Jos=C3=A9 P=C3=A9=',
  'rez',
  'TEL;CELL:3515553333',
  'END:VCARD',
  'BEGIN:VCARD',
  'VERSION:3.0',
  'FN:Duplicado Pérez',
  'N:Pérez;Duplicado;;;',
  'TEL;TYPE=CELL:3515551111',
  'END:VCARD',
  'BEGIN:VCARD',
  'VERSION:3.0',
  'FN:Sin Teléfono',
  'N:Teléfono;Sin;;;',
  'EMAIL:sin@telefono.com',
  'END:VCARD'
].join('\r\n');

async function abrirPanel(page, { contactos = CONTACTOS_APPI, agendaRemota = [] } = {}) {
  const accessToken = tokenFor(USER_ID);
  const profile = {
    user_id: USER_ID, username: null, dip: '02-9802014', sucursal: '02', numero_distribuidor: '9802014',
    nombre: 'María Pérez', socio_nombre: null, rol: 'usuario', activo: true, debe_cambiar_password: false,
    membresia_meses: 1, membresia_inicio: HOY, membresia_vence: new Date(Date.now() + 30 * 86400000).toISOString()
  };
  const importados = [];
  const subidasAgenda = [];

  await page.route('**/auth-config.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: "window.APPI_AUTH={enabled:true,url:'https://mock.supabase.co',anonKey:'anon-key-publica-de-prueba',distributorEmailDomain:'distribuidores.appi.invalid',adminLogin:{username:'popups',email:'admin-popups@appi.invalid'},loginAliases:{},offlineDays:7};"
  }));
  await page.route('https://mock.supabase.co/**', route => {
    const request = route.request();
    const url = new URL(request.url());
    const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
    if (url.pathname === '/auth/v1/token') {
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ access_token: accessToken, refresh_token: 'r', expires_in: 3600, user: { id: USER_ID } }) });
    }
    if (url.pathname === '/rest/v1/appi_perfiles') {
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([profile]) });
    }
    if (url.pathname === '/rest/v1/appi_gestion_contactos') {
      if (request.method() === 'PATCH') return route.fulfill({ status: 204, headers: cors, body: '' });
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify(contactos) });
    }
    if (url.pathname === '/rest/v1/rpc/appi_gente_importar_contacto') {
      importados.push(request.postDataJSON());
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify(['cccccccc-cccc-4ccc-8ccc-cccccccccccc']) });
    }
    if (url.pathname === '/rest/v1/appi_agenda_personal') {
      if (request.method() === 'POST') {
        subidasAgenda.push(request.postDataJSON());
        return route.fulfill({ status: 201, headers: cors, body: '[]' });
      }
      if (request.method() === 'DELETE') return route.fulfill({ status: 204, headers: cors, body: '' });
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify(agendaRemota) });
    }
    if (url.pathname === '/functions/v1/dispositivo-puente') {
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ devices: [] }) });
    }
    return route.fulfill({ status: 200, headers: cors, body: '[]' });
  });

  await page.addInitScript(([uid, contacts]) => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('appi_tarjetas_auto', '0');
    localStorage.setItem('tutoVisto_v2', '1');
    localStorage.setItem(`appi_gestion_cache_v1_${uid}`, JSON.stringify({ contacts, surveys: [], activities: [], savedAt: Date.now() }));
  }, [USER_ID, contactos]);

  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
  await expect(page.locator('#bootScreen')).toHaveCount(0, { timeout: 3500 });

  await page.evaluate(() => window.openMiGestion());
  await expect(page.locator('#view-gestion')).toHaveClass(/active/);
  return { importados, subidasAgenda };
}

async function abrirAgendaPersonal(page, opciones) {
  const mocks = await abrirPanel(page, opciones);
  await page.locator('[data-agenda-vista="personal"]').click();
  await expect(page.locator('#apSubirVcf')).toBeVisible();
  return mocks;
}

test('el switch AGENDA APPI / AGENDA PERSONAL está arriba del panel y cambia de vista', async ({ page }) => {
  await abrirPanel(page);
  const appi = page.locator('[data-agenda-vista="appi"]');
  const personal = page.locator('[data-agenda-vista="personal"]');
  await expect(appi).toBeVisible();
  await expect(appi).toContainText('AGENDA APPI (1)');
  await expect(personal).toContainText('AGENDA PERSONAL');

  await personal.click();
  await expect(page.locator('#apSubirVcf')).toBeVisible();
  await expect(page.locator('[data-gestion-view="hoy"]')).toHaveCount(0);

  await appi.click();
  await expect(page.locator('[data-gestion-view="hoy"]')).toBeVisible();
  await expect(page.locator('#apSubirVcf')).toHaveCount(0);
});

test('el vCard de Android, iPhone y las agendas viejas 2.1 se leen bien', async ({ page }) => {
  await abrirPanel(page);
  const salida = await page.evaluate(texto => window.APPIAgendaPersonal.parsearVcard(texto), VCF);
  const porNombre = Object.fromEntries(salida.map(c => [c.nombre, c.telefono]));

  expect(porNombre['Juan Pérez']).toBe('3515551111');            // CELL gana sobre HOME
  expect(porNombre['María Gómez']).toContain('351 555 2222');    // iPhone con +54 9
  expect(porNombre['José Pérez']).toBe('3515553333');            // 2.1 QUOTED-PRINTABLE con tildes
  // El que no tiene teléfono viene con el número vacío: el importador lo
  // deja afuera y lo cuenta para avisar; el repetido sí (dedupe al importar).
  expect(salida.find(c => c.nombre === 'Sin Teléfono').telefono).toBe('');
  expect(salida.filter(c => c.telefono === '3515551111')).toHaveLength(2);
});

test('subir un .vcf llena la agenda personal y no duplica al repetir', async ({ page }) => {
  const { subidasAgenda } = await abrirAgendaPersonal(page);
  await page.setInputFiles('#apVcfInput', { name: 'agenda.vcf', mimeType: 'text/vcard', buffer: Buffer.from(VCF, 'utf8') });

  await expect(page.locator('.ap-item')).toHaveCount(3); // el repetido quedó en uno solo
  await expect(page.locator('.ap-item').filter({ hasText: 'Juan Pérez' })).toContainText('3515551111');
  await expect(page.locator('.ap-item').filter({ hasText: 'José Pérez' })).toBeVisible();
  // Los tres se suben a la cuenta (cola de sincronización).
  await expect.poll(() => subidasAgenda.length).toBeGreaterThanOrEqual(3);

  const filas = await page.evaluate(() => window.APPIAgendaPersonal.lista().length);
  expect(filas).toBe(3);
});

test('un contacto que ya está en la Agenda APPI se marca y no ofrece pasarlo', async ({ page }) => {
  const yaEnAppi = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'FN:Laura Gómez',
    'N:Gómez;Laura;;;',
    'TEL;TYPE=CELL:3515551234',
    'END:VCARD'
  ].join('\r\n');
  await abrirAgendaPersonal(page);
  await page.setInputFiles('#apVcfInput', { name: 'agenda.vcf', mimeType: 'text/vcard', buffer: Buffer.from(yaEnAppi, 'utf8') });

  const fila = page.locator('.ap-item').filter({ hasText: 'Laura Gómez' });
  await expect(fila).toBeVisible();
  await expect(fila).toContainText('Ya está en APPI');
  await expect(page.locator('[data-ap-pasar]')).toHaveCount(0);
  await expect(page.locator('[data-ap-ver]')).toHaveCount(1);
});

test('pasar a APPI pide confirmación, crea el contacto y queda marcado', async ({ page }) => {
  const unSolo = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'FN:Nuevo Cliente',
    'N:Cliente;Nuevo;;;',
    'TEL;TYPE=CELL:3515554444',
    'END:VCARD'
  ].join('\r\n');
  const { importados, subidasAgenda } = await abrirAgendaPersonal(page, { contactos: [] });
  await page.setInputFiles('#apVcfInput', { name: 'agenda.vcf', mimeType: 'text/vcard', buffer: Buffer.from(unSolo, 'utf8') });
  await expect(page.locator('.ap-item')).toHaveCount(1);

  await page.locator('[data-ap-pasar]').click();
  await expect(page.locator('#appiDialogTitle')).toContainText('Pasar a Agenda APPI');
  await expect(page.locator('#appiDialogMessage')).toContainText('Nuevo Cliente');
  await page.locator('#appiDialogOk').click();

  // Se creó el contacto en la Agenda APPI por la única puerta que hay.
  await expect.poll(() => importados.length).toBe(1);
  expect(importados[0].p_nombre).toBe('Nuevo Cliente');
  expect(importados[0].p_telefono).toBe('3515554444');

  // Y el personal quedó marcado como pasado, sincronizado con estado mergado.
  const fila = page.locator('.ap-item').filter({ hasText: 'Nuevo Cliente' });
  await expect(fila).toContainText('En tu Agenda APPI');
  await expect(page.locator('[data-ap-pasar]')).toHaveCount(0);
  await expect.poll(() => subidasAgenda.some(p => p && p.estado === 'mergado')).toBe(true);
});

test('sin selector nativo (iPhone) la entrada es el .vcf y no aparece el botón del teléfono', async ({ page }) => {
  await abrirAgendaPersonal(page);
  // Chromium de escritorio no tiene navigator.contacts: mismo caso que iPhone.
  const picker = await page.evaluate(() => !!(navigator.contacts && navigator.contacts.select));
  expect(picker).toBe(false);
  await expect(page.locator('#apElegirTel')).toHaveCount(0);
  const subir = page.locator('#apSubirVcf');
  await expect(subir).toBeVisible();
  await expect(subir).toHaveClass(/ppal/);
});

test('quitar un contacto de la agenda personal pide confirmación y lo saca de la lista', async ({ page }) => {
  await abrirAgendaPersonal(page);
  await page.setInputFiles('#apVcfInput', { name: 'agenda.vcf', mimeType: 'text/vcard', buffer: Buffer.from(VCF, 'utf8') });
  await expect(page.locator('.ap-item')).toHaveCount(3);

  await page.locator('.ap-item').filter({ hasText: 'María Gómez' }).locator('[data-ap-quitar]').click();
  await expect(page.locator('#appiDialogTitle')).toContainText('Quitar de la agenda');
  await page.locator('#appiDialogOk').click();

  await expect(page.locator('.ap-item')).toHaveCount(2);
  await expect(page.locator('.ap-item').filter({ hasText: 'María Gómez' })).toHaveCount(0);
});
