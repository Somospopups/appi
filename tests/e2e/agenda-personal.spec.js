const { test, expect } = require('@playwright/test');

// La solapa "📱 AGENDA PERSONAL" del Panel de Contactos: subir la
// agenda del teléfono (.vcf en cualquier equipo, selector nativo donde esté),
// listado sutil por letra (v366) — un puntito si falta pasar, y las
// acciones (WhatsApp / Llamar / Pasar / Quitar) al tocar el nombre.
// Selección múltiple y selección flotante (mantener presionado / "Elegir varios").

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

async function abrirPanel(page, { contactos = CONTACTOS_APPI, agendaRemota = [], agendaVista = '' } = {}) {
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

  await page.addInitScript(([uid, contacts, savedAgenda]) => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('appi_tarjetas_auto', '0');
    localStorage.setItem('tutoVisto_v2', '1');
    localStorage.setItem(`appi_gestion_cache_v1_${uid}`, JSON.stringify({ contacts, surveys: [], activities: [], savedAt: Date.now() }));
    if (savedAgenda) localStorage.setItem(`appi_gestion_agenda_vista_${uid}`, savedAgenda);
  }, [USER_ID, contactos, agendaVista]);

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

test('al abrir APPI con Agenda Personal guardada, primero pinta esa solapa y descarga la agenda remota', async ({ page }) => {
  const remota = [{
    nombre: 'Contacto desde el celular', telefono: '3515559090',
    telefono_normalizado: '3515559090', estado: 'nuevo', contacto_id: null,
    origen: 'telefono', created_at: HOY
  }];
  await abrirPanel(page, { contactos: [], agendaRemota: remota, agendaVista: 'personal' });
  await expect(page.locator('#apSubirVcf')).toBeVisible();
  await expect(page.locator('.ap-item').filter({ hasText: 'Contacto desde el celular' })).toBeVisible();
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
  // Los tres se suben juntos a la cuenta (un batch upsert, no una request
  // por contacto).
  await expect.poll(() => subidasAgenda.flat().length).toBeGreaterThanOrEqual(3);
  expect(subidasAgenda).toHaveLength(1);
  expect(Array.isArray(subidasAgenda[0])).toBe(true);
  expect(subidasAgenda[0]).toHaveLength(3);

  const filas = await page.evaluate(() => window.APPIAgendaPersonal.lista().length);
  expect(filas).toBe(3);
});

test('el listado va por letra y las acciones aparecen al tocar el nombre', async ({ page }) => {
  await abrirAgendaPersonal(page);
  await page.setInputFiles('#apVcfInput', { name: 'agenda.vcf', mimeType: 'text/vcard', buffer: Buffer.from(VCF, 'utf8') });

  await expect(page.locator('.ap-letra').first()).toBeVisible();
  const primerContacto = page.locator('.ap-item').first();
  await expect(primerContacto.locator('.ap-card-actions')).toHaveCount(0);
  await primerContacto.locator('.ap-quien').click();
  await expect(primerContacto.locator('.ap-card-actions [data-ap-wa]')).toBeVisible();
  await expect(primerContacto.locator('.ap-card-actions [data-appi-call-phone]')).toBeVisible();
  await expect(primerContacto.locator('.ap-card-actions [data-ap-pasar]')).toBeVisible();
  await expect(primerContacto.locator('.ap-card-actions [data-ap-quitar]')).toBeVisible();
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
  await expect(fila).toHaveAttribute('data-ap-estado', 'enappi');
  await expect(fila.locator('.ap-punto-off')).toHaveCount(0);
  await expect(fila.locator('.ap-punto')).toHaveCount(1);
  await fila.locator('.ap-quien').click();
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

  await page.locator('.ap-item').filter({ hasText: 'Nuevo Cliente' }).locator('.ap-quien').click();
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
  await expect(fila).toHaveAttribute('data-ap-estado', 'pasado');
  await expect(fila.locator('.ap-punto-off')).toHaveCount(0);
  await expect(page.locator('[data-ap-pasar]')).toHaveCount(0);
  await expect.poll(() => subidasAgenda.flat().some(p => p && p.estado === 'mergado')).toBe(true);
});

test('selección múltiple: pasar contactos seleccionados a APPI en bloque', async ({ page }) => {
  const { importados } = await abrirAgendaPersonal(page, { contactos: [] });
  await page.setInputFiles('#apVcfInput', { name: 'agenda.vcf', mimeType: 'text/vcard', buffer: Buffer.from(VCF, 'utf8') });

  // Seleccionamos "Seleccionar todos"
  await page.locator('#apSelectAll').check();
  await expect(page.locator('#apBulkBar')).toBeVisible();
  await expect(page.locator('#apBulkPasar')).toContainText('Pasar a APPI (3)');

  // Pasamos todos en bloque
  await page.locator('#apBulkPasar').click();
  await expect(page.locator('#appiDialogTitle')).toContainText('Pasar a Agenda APPI');
  await expect(page.locator('#appiDialogMessage')).toContainText('3 contactos');
  await page.locator('#appiDialogOk').click();

  // Se importaron los 3
  await expect.poll(() => importados.length).toBe(3);
  await expect(page.locator('#apBulkBar')).toHaveCount(0);
});

test('selección múltiple: eliminar contactos seleccionados en bloque', async ({ page }) => {
  await abrirAgendaPersonal(page);
  await page.setInputFiles('#apVcfInput', { name: 'agenda.vcf', mimeType: 'text/vcard', buffer: Buffer.from(VCF, 'utf8') });
  await expect(page.locator('.ap-item')).toHaveCount(3);

  await page.locator('#apElegirVarios').click();
  await page.locator('.ap-item').nth(0).locator('.ap-quien').click();
  await page.locator('.ap-item').nth(1).locator('.ap-quien').click();

  await expect(page.locator('#apBulkBar')).toBeVisible();
  await expect(page.locator('#apBulkQuitar')).toContainText('Quitar (2)');

  await page.locator('#apBulkQuitar').click();
  await expect(page.locator('#appiDialogTitle')).toContainText('Quitar de la agenda');
  await page.locator('#appiDialogOk').click();

  await expect(page.locator('.ap-item')).toHaveCount(1);
});

/* ---------- selección flotante (v360) ---------- */

// El gesto del teléfono: apoyar el puntero medio segundo sobre la fila. El
// click con el que termina el gesto no tiene que soltar lo que se eligió.
async function mantenerPresionado(page, locator) {
  const caja = await locator.boundingBox();
  const x = caja.x + caja.width / 2;
  const y = caja.y + caja.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.waitForTimeout(650);
  await page.mouse.up();
}

async function subirAgendaDePrueba(page) {
  const mocks = await abrirAgendaPersonal(page, { contactos: [] });
  await page.setInputFiles('#apVcfInput', { name: 'agenda.vcf', mimeType: 'text/vcard', buffer: Buffer.from(VCF, 'utf8') });
  await expect(page.locator('.ap-item')).toHaveCount(3);
  return mocks;
}

test('mantener presionado un contacto abre la barra flotante con ese contacto elegido', async ({ page }) => {
  await subirAgendaDePrueba(page);

  // Sin elegir nada no hay barra: la lista queda limpia.
  await expect(page.locator('#apBulkBar')).toHaveCount(0);

  await mantenerPresionado(page, page.locator('.ap-item').filter({ hasText: 'Juan Pérez' }).locator('.ap-quien'));

  // Queda elegido exactamente uno: el gesto no arrastra a los vecinos.
  await expect(page.locator('#apBulkBar')).toBeVisible();
  await expect(page.locator('#apBulkPasar')).toContainText('Pasar a APPI (1)');
  await expect(page.locator('.ap-item.seleccionado')).toHaveCount(1);
  await expect(page.locator('.ap-item').filter({ hasText: 'Juan Pérez' })).toHaveClass(/seleccionado/);

  // Y el gesto largo encendió el modo: la fila se puede seguir tocando.
  expect(await page.evaluate(() => window.APPIAgendaPersonal.modoSeleccion())).toBe(true);
});

test('el botón "Elegir varios" abre la barra y deja elegir tocando las filas', async ({ page }) => {
  await subirAgendaDePrueba(page);

  const boton = page.locator('#apElegirVarios');
  await expect(boton).toBeVisible();
  await expect(boton).toContainText('Elegir varios');
  await expect(page.locator('#apBulkBar')).toHaveCount(0);

  await boton.click();
  // Abre la barra aunque todavía no haya nada marcado, con las acciones
  // apagadas hasta que se elija algo.
  await expect(page.locator('#apBulkBar')).toBeVisible();
  await expect(page.locator('#apBulkPasar')).toBeDisabled();
  await expect(page.locator('#apBulkQuitar')).toBeDisabled();
  await expect(boton).toContainText('Listo');

  // Con el modo abierto alcanza un toque sobre la fila.
  await page.locator('.ap-item').filter({ hasText: 'María Gómez' }).locator('.ap-quien').click();
  await page.locator('.ap-item').filter({ hasText: 'José Pérez' }).locator('.ap-quien').click();
  await expect(page.locator('#apBulkQuitar')).toContainText('Quitar (2)');
  await expect(page.locator('#apBulkPasar')).toBeEnabled();

  // Y el mismo toque suelta: de dos elegidos vuelve a uno.
  await page.locator('.ap-item').filter({ hasText: 'José Pérez' }).locator('.ap-quien').click();
  await expect(page.locator('#apBulkQuitar')).toContainText('Quitar (1)');

  // "✓ Listo" cierra el modo y suelta todo.
  await page.locator('#apElegirVarios').click();
  await expect(page.locator('#apBulkBar')).toHaveCount(0);
  await expect(page.locator('.ap-item.seleccionado')).toHaveCount(0);
});

test('recorrer la lista con el dedo no selecciona nada', async ({ page }) => {
  await subirAgendaDePrueba(page);

  const caja = await page.locator('.ap-item').first().locator('.ap-quien').boundingBox();
  await page.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2);
  await page.mouse.down();
  // El dedo se corre más que el margen: era un desplazamiento de la lista.
  await page.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2 + 40, { steps: 6 });
  await page.waitForTimeout(650);
  await page.mouse.up();

  await expect(page.locator('#apBulkBar')).toHaveCount(0);
  await expect(page.locator('.ap-item.seleccionado')).toHaveCount(0);
});

test('con el modo de selección abierto, tocar el nombre elige y no abre acciones', async ({ page }) => {
  await subirAgendaDePrueba(page);

  await page.locator('#apElegirVarios').click();
  await expect(page.locator('#apBulkBar')).toBeVisible();

  await page.locator('.ap-item').filter({ hasText: 'Juan Pérez' }).locator('.ap-quien').click();
  await expect(page.locator('#apBulkPasar')).toContainText('Pasar a APPI (1)');
  await expect(page.locator('[data-ap-pasar]')).toHaveCount(0);

  await page.locator('.ap-item').filter({ hasText: 'María Gómez' }).locator('[data-ap-select]').check();
  await expect(page.locator('#apBulkPasar')).toContainText('Pasar a APPI (2)');
});

test('la ✕ de la barra suelta todo y cierra la selección flotante', async ({ page }) => {
  await subirAgendaDePrueba(page);

  await page.locator('#apElegirVarios').click();
  await page.locator('.ap-item').nth(0).locator('.ap-quien').click();
  await expect(page.locator('#apBulkBar')).toBeVisible();

  await page.locator('#apBulkCancelar').click();
  await expect(page.locator('#apBulkBar')).toHaveCount(0);
  await expect(page.locator('.ap-item.seleccionado')).toHaveCount(0);
  expect(await page.evaluate(() => window.APPIAgendaPersonal.modoSeleccion())).toBe(false);
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

// El selector nativo (Android) mockeado: la API no existe en Chromium de
// escritorio, así que se inyecta para probar los tres caminos reales.
async function abrirConPicker(page, contactoMock) {
  await page.addInitScript(mock => {
    Object.defineProperty(navigator, 'contacts', {
      configurable: true,
      value: { select: async () => {
        if (mock === 'permiso') { const e = new Error('Permission denied'); e.name = 'NotAllowedError'; throw e; }
        if (mock === 'cancela') { const e = new Error('The user cancelled'); e.name = 'AbortError'; throw e; }
        return mock;
      } }
    });
  }, contactoMock);
  return abrirAgendaPersonal(page);
}

test('con selector nativo (Android): elegir del teléfono importa los contactos', async ({ page }) => {
  await abrirConPicker(page, [
    { name: ['Juan Picker'], tel: ['3515557777'] },
    { name: ['Ana Picker'], tel: ['+54 9 351 555 8888', '0351 422 9999'] }
  ]);
  await expect(page.locator('#apElegirTel')).toBeVisible();
  await page.locator('#apElegirTel').click();
  await expect(page.locator('.ap-item')).toHaveCount(2);
  await expect(page.locator('.ap-item').filter({ hasText: 'Juan Picker' })).toContainText('3515557777');
  // Del doble número de Ana queda el celular (15/móvil), no el fijo.
  await expect(page.locator('.ap-item').filter({ hasText: 'Ana Picker' })).toContainText('351 555 8888');
});

test('si Android bloquea el permiso, se explica cómo habilitarlo (v358)', async ({ page }) => {
  await abrirConPicker(page, 'permiso');
  await page.locator('#apElegirTel').click();
  await expect(page.locator('#appiDialogTitle')).toContainText('Falta el permiso');
  await expect(page.locator('#appiDialogMessage')).toContainText('Permisos');
  await expect(page.locator('#appiDialogMessage')).toContainText('.vcf');
  await page.locator('#appiDialogOk').click();
  await expect(page.locator('.ap-item')).toHaveCount(0);
});

test('cancelar el selector no molesta con ningún cartel', async ({ page }) => {
  await abrirConPicker(page, 'cancela');
  await page.locator('#apElegirTel').click();
  await page.waitForTimeout(250);
  await expect(page.locator('.appi-dialog-overlay')).toBeHidden();
  await expect(page.locator('.ap-item')).toHaveCount(0);
});
