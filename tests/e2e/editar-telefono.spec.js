const { test, expect } = require('@playwright/test');

/* v633 — El número de teléfono de una persona se puede corregir desde las
   tres pantallas donde se usa:
     · Panel de Contactos (Mi Gestión): el campo vive en la ficha y se guarda
       con el mismo "Guardar cambios" de siempre, con cola si no hay internet.
     · Usuarios/Garantías: la planilla de PSA se vuelve a bajar siempre, así
       que la corrección se guarda aparte y se aplica encima en cada carga.
     · Agenda Personal: en la nube la fila es el teléfono, así que el cambio
       se manda como "borrar el viejo" + "cargar el nuevo". */

const USER_ID = '11111111-1111-4111-8111-111111111111';
const HOY = new Date().toISOString();

function tokenFor(sub) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${header}.${payload}.firma`;
}

const CONTACTOS = [
  { id: 'a1', user_id: USER_ID, estado: 'nuevo', nombre: 'Ana Gómez', telefono: '3515550000', telefono_normalizado: '3515550000', tipo: 'manual', zona: '', notas: '', metadata: {}, created_at: HOY, updated_at: HOY },
  { id: 'b1', user_id: USER_ID, estado: 'seguimiento', nombre: 'Beto Ruiz', telefono: '3515551111', telefono_normalizado: '3515551111', tipo: 'manual', zona: '', notas: '', metadata: {}, created_at: HOY, updated_at: HOY }
];

const USUARIOS = [
  { id: 1, usuario: 'Ana Gómez', serie: 'PSA-000123', telf: '3515551001', domicilio: 'San Martín 120', localidad: 'Alta Gracia', producto: 'PSA', cp: '5186', fVenceRaw: '30/07/2027', fVence: new Date(Date.now() + 200 * 86400000).toISOString(), estado: 'vigente' }
];

// Login de prueba con la nube mockeada. devolviendo registra los PATCH del
// Panel y las subidas de la agenda, que es lo que se afirma en cada test.
async function entrar(page, { contactos = [], agenda = [], usuarios = [] } = {}) {
  const parches = [];
  const subidasAgenda = [];
  const bajasAgenda = [];

  await page.route('**/auth-config.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: "window.APPI_AUTH={enabled:true,url:'https://mock.supabase.co',anonKey:'anon-key-publica-de-prueba-1234567890',adminLogin:{username:'popups',email:'admin-popups@appi.invalid'},offlineDays:7};"
  }));

  await page.route('https://mock.supabase.co/**', route => {
    const request = route.request();
    const url = new URL(request.url());
    const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };

    if (url.pathname === '/auth/v1/token') {
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ access_token: tokenFor(USER_ID), refresh_token: 'r', expires_in: 3600, user: { id: USER_ID } }) });
    }
    if (url.pathname === '/rest/v1/appi_perfiles') {
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([{ user_id: USER_ID, username: null, dip: '02-9802014', sucursal: '02', numero_distribuidor: '9802014', nombre: 'María Pérez', rol: 'usuario', activo: true, debe_cambiar_password: false, membresia_meses: 1, membresia_inicio: HOY, membresia_vence: new Date(Date.now() + 30 * 86400000).toISOString() }]) });
    }
    if (url.pathname === '/functions/v1/dispositivo-puente') {
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ devices: [] }) });
    }
    if (url.pathname === '/rest/v1/appi_gestion_contactos') {
      if (request.method() === 'PATCH') {
        const cambio = JSON.parse(request.postData() || '{}');
        const id = String(url.search.match(/id=eq\.([^&]+)/) ? RegExp.$1 : '');
        parches.push(cambio);
        // La base queda como quedó el cambio: si algo vuelve a leer, ve lo mismo.
        const fila = contactos.find(c => String(c.id) === id);
        if (fila) Object.assign(fila, cambio);
        return route.fulfill({ status: 204, headers: cors, body: '' });
      }
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify(contactos) });
    }
    if (url.pathname === '/rest/v1/appi_agenda_personal') {
      if (request.method() === 'POST') { subidasAgenda.push(request.postDataJSON()); return route.fulfill({ status: 201, headers: cors, body: '[]' }); }
      if (request.method() === 'DELETE') { bajasAgenda.push(url.search); return route.fulfill({ status: 204, headers: cors, body: '' }); }
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify(agenda) });
    }
    return route.fulfill({ status: 200, headers: cors, body: '[]' });
  });

  await page.addInitScript(([uid, contacts, agendaPropia, listaUsuarios]) => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('appi_tarjetas_auto', '0');
    localStorage.setItem('tutoVisto_v2', '1');
    localStorage.setItem(`appi_gestion_cache_v1_${uid}`, JSON.stringify({ contacts, surveys: [], activities: [], savedAt: Date.now() }));
    if (agendaPropia.length) localStorage.setItem(`appi_agenda_personal_v1_${uid}`, JSON.stringify(agendaPropia));
    if (listaUsuarios.length) localStorage.setItem('usuarios_garantias', JSON.stringify(listaUsuarios));
  }, [USER_ID, contactos, agenda, usuarios]);

  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
  await expect(page.locator('#bootScreen')).toHaveCount(0, { timeout: 3500 });

  return { parches, subidasAgenda, bajasAgenda };
}

async function abrirFicha(page, id) {
  await page.evaluate(() => window.openMiGestion());
  await expect(page.locator('#view-gestion')).toHaveClass(/active/);
  await page.locator('[data-gestion-view="todos"]').click();
  await page.locator(`.gestion-contact[data-contact-id="${id}"] [data-open-contact]`).click();
  await expect(page.locator('#gestionDetailOverlay')).toBeVisible();
  await expect(page.locator('#gestionTel')).toBeVisible();
}

test('el teléfono del Panel de Contactos se edita y viaja normalizado en el guardado', async ({ page }) => {
  const { parches } = await entrar(page, { contactos: CONTACTOS.map(c => ({ ...c })) });
  await abrirFicha(page, 'a1');

  // El número está a la vista y se puede cambiar ahí mismo.
  await expect(page.locator('#gestionTel')).toHaveValue('3515550000');
  await page.locator('#gestionTel').fill('351 555 7788');
  await page.locator('#gestionSaveContact').click();

  await expect.poll(() => parches.length).toBe(1);
  // Junto con los demás datos va el número tal cual y su versión de dígitos,
  // que es la que la base usa para no repetir personas en la misma cuenta.
  expect(parches[0].telefono).toBe('351 555 7788');
  expect(parches[0].telefono_normalizado).toBe('3515557788');
  expect(parches[0]).toHaveProperty('notas');

  // La ficha se cierra y la tarjeta muestra el número nuevo.
  await expect(page.locator('#gestionDetailOverlay')).toBeHidden();
  await expect(page.locator('.gestion-contact[data-contact-id="a1"]')).toContainText('351 555 7788');
});

test('un teléfono corto no se guarda: se explica en criollo y la ficha sigue abierta', async ({ page }) => {
  const { parches } = await entrar(page, { contactos: CONTACTOS.map(c => ({ ...c })) });
  await abrirFicha(page, 'a1');

  await page.locator('#gestionTel').fill('123');
  await page.locator('#gestionSaveContact').click();

  await expect(page.locator('#appiDialogTitle')).toHaveText('Teléfono no válido');
  await expect(page.locator('#appiDialogMessage')).toContainText('entre 8 y 15');
  await page.locator('#appiDialogOk').click();

  // No se mandó nada y lo escrito sigue ahí para corregirlo.
  expect(parches).toHaveLength(0);
  await expect(page.locator('#gestionDetailOverlay')).toBeVisible();
  await expect(page.locator('#gestionTel')).toHaveValue('123');
});

test('un teléfono que ya tiene otra persona no se guarda y se avisa sin jerga de base', async ({ page }) => {
  const { parches } = await entrar(page, { contactos: CONTACTOS.map(c => ({ ...c })) });
  await abrirFicha(page, 'a1');

  await page.locator('#gestionTel').fill('3515551111');
  await page.locator('#gestionSaveContact').click();

  await expect(page.locator('#appiDialogTitle')).toHaveText('Teléfono repetido');
  await expect(page.locator('#appiDialogMessage')).toContainText('Ya tenés a alguien con ese teléfono');
  await expect(page.locator('#appiDialogMessage')).not.toContainText('constraint');
  await page.locator('#appiDialogOk').click();

  expect(parches).toHaveLength(0);
  await expect(page.locator('#gestionDetailOverlay')).toBeVisible();
});

test('un contacto sin teléfono en la caché no bloquea guardar las notas', async ({ page }) => {
  // Datos sucios de verdad (iOS guardó filas con teléfono nulo): el Panel
  // tiene que seguir funcionando igual, sin que el campo nuevo frene el guardado.
  const sinTelefono = [{ id: 'c1', user_id: USER_ID, estado: 'nuevo', nombre: 'Sin Teléfono Todavía', telefono: '', telefono_normalizado: '', tipo: 'manual', zona: '', notas: '', metadata: {}, created_at: HOY, updated_at: HOY }];
  const { parches } = await entrar(page, { contactos: sinTelefono });

  await abrirFicha(page, 'c1');
  await expect(page.locator('#gestionTel')).toHaveValue('');

  await page.locator('#gestionNotes').fill('Dejé el mensaje con el vecino.');
  await page.locator('#gestionSaveContact').click();

  // Nada reclama por el teléfono: las notas se guardan y el número sigue vacío.
  await expect.poll(() => parches.length).toBe(1);
  expect(parches[0].notas).toContain('Dejé el mensaje con el vecino.');
  expect(parches[0]).not.toHaveProperty('telefono');
  await expect(page.locator('#gestionDetailOverlay')).toBeHidden();
});

test('el teléfono corregido en Usuarios/Garantías se ve marcado y sobrevive a una bajada nueva de la planilla', async ({ page }) => {
  await entrar(page, { usuarios: USUARIOS.map(u => ({ ...u })) });
  await page.evaluate(() => window.showView('view-usuarios'));
  await expect(page.locator('#usuariosList .tree-name')).toHaveCount(1);

  await page.locator('#usuariosList [data-u-toggle="0"]').click();
  await expect(page.locator('#usuariosList [data-u-action="editartel"]')).toBeVisible();
  await page.locator('#usuariosList [data-u-action="editartel"]').click();

  await expect(page.locator('#appiDialogTitle')).toHaveText('Editar teléfono');
  await page.locator('#appiDialogInput').fill('351 555 4444');
  await page.locator('#appiDialogOk').click();

  await expect(page.locator('#usuariosList')).toContainText('351 555 4444');
  // La corrección queda marcada en la ficha y guardada por cuenta.
  await expect(page.locator('#usuariosList .tree-children')).toContainText('✏️');
  const correccion = await page.evaluate(uid => localStorage.getItem('appi_telf_editados_v1_' + uid), USER_ID);
  expect(correccion).toContain('351 555 4444');
  // Y es una clave de datos de la cuenta: viaja con la sincronización, así
  // que sobrevive a otro dispositivo y a borrar los datos del navegador.
  const viajaConLaCuenta = await page.evaluate(() =>
    window.APPIDataSync.isDataKey('appi_telf_editados_v1_' + window.APPIAuth.userId()));
  expect(viajaConLaCuenta).toBe(true);

  // La planilla de PSA se vuelve a bajar con el número viejo de siempre…
  // y encima trae escrito distinto el nombre y el domicilio de la persona.
  await page.evaluate(() => {
    const crudo = JSON.parse(localStorage.getItem('usuarios_garantias') || '[]');
    crudo.forEach(u => {
      u.telf = '3515551001';
      u.usuario = 'ANA M. GOMEZ';
      u.domicilio = 'Otra Calle 999';
      delete u.telfEditado;
      delete u.nombreNorm;
    });
    localStorage.setItem('usuarios_garantias', JSON.stringify(crudo));
    window.recargarUsuariosDeStorage();
  });
  // La clave por nombre ya no matchea: manda la serie del equipo.
  await expect(page.locator('#usuariosList')).toContainText('351 555 4444');
  await expect(page.locator('#usuariosList .tree-children')).toContainText('✏️');
});

test('editar el teléfono en la Agenda Personal cambia el contacto y se sube como baja + alta', async ({ page }) => {
  const agenda = [{ id: 'ap-1', nombre: 'Juan Pérez', telefono: '3515551111', tel_norm: '3515551111', estado: 'nuevo', contacto_id: null, origen: 'manual', created_at: HOY }];
  const { subidasAgenda, bajasAgenda } = await entrar(page, { agenda });

  await page.evaluate(() => window.openMiGestion());
  await expect(page.locator('#view-gestion')).toHaveClass(/active/);
  await page.locator('[data-agenda-vista="personal"]').click();
  await expect(page.locator('#apSubirVcf')).toBeVisible();

  const fila = page.locator('.ap-item').first();
  await fila.locator('.ap-quien').click();
  await fila.locator('[data-ap-editar]').click();

  await expect(page.locator('#appiDialogTitle')).toHaveText('Editar teléfono');
  await expect(page.locator('#appiDialogInput')).toHaveValue('3515551111');
  await page.locator('#appiDialogInput').fill('351 555 9999');
  await page.locator('#appiDialogOk').click();

  // La fila local ya quedó con el número nuevo.
  await expect(fila).toContainText('351 555 9999');
  const lista = await page.evaluate(() => window.APPIAgendaPersonal.lista().map(c => ({ tel: c.telefono, norm: c.tel_norm })));
  expect(lista).toEqual([{ tel: '351 555 9999', norm: '3515559999' }]);

  // Y en la nube se fue el viejo y entró el nuevo (la fila se identifica por
  // el teléfono, por eso son dos movimientos).
  await expect.poll(() => bajasAgenda.length).toBeGreaterThan(0);
  expect(bajasAgenda.join(' ')).toContain('telefono_normalizado=eq.3515551111');
  await expect.poll(() => subidasAgenda.flat().length).toBeGreaterThan(0);
  const subido = JSON.stringify(subidasAgenda);
  expect(subido).toContain('3515559999');
});
