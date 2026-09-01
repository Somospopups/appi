const { test, expect } = require('@playwright/test');

// Reactivación: los clientes con la garantía vencida hace más de un año.
// Están fuera del trabajo diario a propósito, así que esta pantalla es una
// campaña aparte: por antigüedad, por barrio, con tope diario y registro de
// qué contestó cada uno.

const USER_ID = '11111111-1111-4111-8111-111111111111';

function tokenFor(sub) {
  const h = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${h}.${p}.firma`;
}

const dias = n => new Date(Date.now() + n * 86400000).toISOString();
const ddmmyyyy = n => {
  const d = new Date(Date.now() + n * 86400000);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};
// Un cliente dormido, con la antigüedad que se le pida.
const dormido = (id, nombre, barrio, diasVencido, telf) => ({
  id, usuario: nombre, telf: telf || ('351555' + String(1000 + id)),
  domicilio: 'Calle ' + id, localidad: barrio, producto: 'PSA VERO', cp: '5000',
  fCompra: ddmmyyyy(-diasVencido - 365), fVenceRaw: ddmmyyyy(-diasVencido),
  fVence: dias(-diasVencido), estado: 'vencida'
});

const LISTA = [
  // vigente: no es un dormido
  { id: 1, usuario: 'ACTIVA, LAURA', telf: '3515551001', localidad: 'Centro', producto: 'PSA',
    fCompra: ddmmyyyy(-100), fVenceRaw: ddmmyyyy(200), fVence: dias(200), estado: 'vigente' },
  // vencido hace 6 meses: todavía no está dormido
  { id: 2, usuario: 'RECIENTE, MARIO', telf: '3515551002', localidad: 'Centro', producto: 'PSA',
    fCompra: ddmmyyyy(-500), fVenceRaw: ddmmyyyy(-180), fVence: dias(-180), estado: 'vencida' },
  // ola 1 (1-2 años), dos en el mismo barrio
  dormido(3, 'GOMEZ, ANA', 'Alta Gracia', 500),
  dormido(4, 'RUIZ, BETO', 'Alta Gracia', 600),
  dormido(5, 'DIAZ, CARLA', 'Villa Allende', 400),
  // ola 2 (3-5 años)
  dormido(6, 'LOPEZ, MARTA', 'Centro', 1500),
  // ola 3 (5-10 años)
  dormido(7, 'PEREZ, JUAN', 'Centro', 2500),
  // ola 4 (más de 10)
  dormido(8, 'SOSA, ELENA', 'Alta Gracia', 4000)
];

// El aviso de WhatsApp se muestra una sola vez y taparía todos los tests que
// van a la campaña. Se lo da por leído salvo que el test lo pida.
async function entrar(page, users = LISTA, { conAviso = false } = {}) {
  const accessToken = tokenFor(USER_ID);
  const profile = {
    user_id: USER_ID, username: null, dip: '02-9802014', sucursal: '02', numero_distribuidor: '9802014',
    nombre: 'María Pérez', socio_nombre: null, rol: 'usuario', activo: true, debe_cambiar_password: false,
    membresia_meses: 1, membresia_inicio: new Date().toISOString(),
    membresia_vence: new Date(Date.now() + 30 * 86400000).toISOString()
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
  await page.route('**/tile.openstreetmap.org/**', route => route.abort());
  await page.addInitScript(([u, aviso]) => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('appi_tarjetas_auto', '0');
    localStorage.setItem('tutoVisto_v2', '1');
    localStorage.setItem('usuarios_garantias', JSON.stringify(u));
    if (!aviso) {
      localStorage.setItem('appi_reactivacion_v1_11111111-1111-4111-8111-111111111111',
        JSON.stringify({ avisoVisto: new Date().toISOString() }));
    }
  }, [users, conAviso]);
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
  await page.evaluate(() => window.showView('view-usuarios'));
  await expect(page.locator('#usuariosBtnZonas')).toBeVisible();
}

// Atrapa la apertura de WhatsApp para leer qué se manda.
async function espiarWhatsApp(page) {
  await page.evaluate(() => {
    window.__wa = [];
    window.APPIWhatsApp.abrir = url => { window.__wa.push(url); };
  });
}

test('el botón Dormidos aparece sólo si hay dormidos', async ({ page }) => {
  await entrar(page);
  await expect(page.locator('#usuariosBtnDormidos')).toBeVisible();
  await expect(page.locator('#usuariosBtnDormidos')).toContainText('Dormidos');
});

test('sin dormidos la barra queda como estaba', async ({ page }) => {
  await entrar(page, [LISTA[0], LISTA[1]]);   // sólo vigente y vencido reciente
  await expect(page.locator('#usuariosBtnDormidos')).toHaveCount(0);
  // Seis de base (Mapa se quitó en v332; Depurados se sumó en v350; Plantillas en v412).
  await expect(page.locator('.u-tools button:visible')).toHaveCount(6);
});

test('se ven los dormidos separados en olas por antigüedad', async ({ page }) => {
  await entrar(page);
  await page.locator('#usuariosBtnDormidos').click();
  await expect(page.locator('#reOverlay')).toHaveClass(/open/);
  await expect(page.locator('#reSub')).toContainText('6 sin contacto');

  // Cuatro olas, cada una con su cuenta.
  await expect(page.locator('[data-re-ola]')).toHaveCount(4);
  await expect(page.locator('[data-re-ola="o1"]')).toContainText('3');
  await expect(page.locator('[data-re-ola="o2"]')).toContainText('1');
  await expect(page.locator('[data-re-ola="o3"]')).toContainText('1');
  await expect(page.locator('[data-re-ola="o4"]')).toContainText('1');
});

test('el vigente y el vencido hace poco no son dormidos', async ({ page }) => {
  await entrar(page);
  const nombres = await page.evaluate(() =>
    window.APPIReactivacion.dormidos().map(u => u.usuario));
  expect(nombres).not.toContain('ACTIVA, LAURA');
  expect(nombres).not.toContain('RECIENTE, MARIO');
  expect(nombres).toHaveLength(6);
});

test('cada ola se abre agrupada por barrio, del más cargado al menos', async ({ page }) => {
  await entrar(page);
  await page.locator('#usuariosBtnDormidos').click();
  await page.locator('[data-re-ola="o1"]').click();

  await expect(page.locator('#reTitulo')).toContainText('1 a 2 años');
  const barrios = page.locator('[data-re-barrio]');
  await expect(barrios).toHaveCount(2);
  // Alta Gracia tiene 2 y va primera; Villa Allende tiene 1.
  await expect(barrios.nth(0)).toContainText('Alta Gracia');
  await expect(barrios.nth(0)).toContainText('2 clientes');
  await expect(barrios.nth(1)).toContainText('Villa Allende');
});

test('la fila manda de a uno y avisa cuántos quedan del cupo', async ({ page }) => {
  await entrar(page);
  await espiarWhatsApp(page);
  await page.locator('#usuariosBtnDormidos').click();
  await page.locator('[data-re-ola="o1"]').click();
  await page.locator('[data-re-barrio="Alta Gracia"]').click();

  await expect(page.locator('#reSub')).toContainText('1 de 2');
  await expect(page.locator('#reSub')).toContainText('quedan 15 hoy');
  await expect(page.locator('.re-quien')).toContainText('GOMEZ, ANA');
  // Se ve cuánto hace que venció, que es el dato que ordena la conversación.
  await expect(page.locator('.re-quien')).toContainText('Venció hace 1 año');

  await page.locator('#reEnviar').click();
  await expect(page.locator('.re-quien')).toContainText('RUIZ, BETO');
  await expect(page.locator('#reSub')).toContainText('quedan 14 hoy');

  const urls = await page.evaluate(() => window.__wa);
  expect(urls).toHaveLength(1);
  const texto = decodeURIComponent(urls[0].split('text=')[1]);
  expect(texto).toContain('Hola Ana');
  expect(texto).toContain('seguís teniendo el equipo');
  // El mensaje se presenta: quien lo recibe no lo tiene agendado hace años.
  // La app no nombra ninguna marca: sirve para cualquier distribuidor.
  expect(texto).toContain('nuestros purificadores');
  expect(texto).not.toContain('PSA');
  expect(texto).not.toContain('{vos}');
});

test('el primer mensaje pregunta, sin ofrecer ni presionar', async ({ page }) => {
  await entrar(page);
  const texto = await page.evaluate(() => window.APPIReactivacion.plantilla());
  // Abre con una pregunta simple que da salida a las dos respuestas posibles.
  expect(texto).toContain('seguís teniendo el equipo');
  expect(texto).toContain('otro tipo de agua');
  // Nada de venta en el primer contacto.
  expect(texto.toLowerCase()).not.toContain('precio');
  expect(texto.toLowerCase()).not.toContain('promoción');
  expect(texto.toLowerCase()).not.toContain('oferta');
});

test('el mensaje se presenta con el nombre del distribuidor', async ({ page }) => {
  await entrar(page);
  // Quien lo recibe hace años que no habla con él: tiene que saber quién es.
  const r = await page.evaluate(() => ({
    plantilla: window.APPIReactivacion.plantilla(),
    armado: window.APPIReactivacion.completar(
      window.APPIReactivacion.plantilla(),
      { usuario: 'GOMEZ, ANA', localidad: 'Alta Gracia' })
  }));
  expect(r.plantilla).toContain('{vos}');
  // Al armarlo, la etiqueta se reemplaza por el nombre real del perfil.
  expect(r.armado).not.toContain('{vos}');
  expect(r.armado).toContain('María');
});

test('el tope diario corta la campaña y explica por qué', async ({ page }) => {
  await entrar(page);
  await espiarWhatsApp(page);
  // Se simula que ya se mandaron los 15 de hoy.
  await page.evaluate(() => {
    const k = 'appi_reactivacion_v1_' + window.APPIAuth.userId();
    const h = new Date();
    const dia = h.getFullYear() + '-' + String(h.getMonth()+1).padStart(2,'0') + '-' + String(h.getDate()).padStart(2,'0');
    const prev = JSON.parse(localStorage.getItem(k) || '{}');
    prev.porDia = { [dia]: 15 };
    localStorage.setItem(k, JSON.stringify(prev));
  });
  await page.locator('#usuariosBtnDormidos').click();
  await expect(page.locator('.re-cupo')).toContainText('Por hoy alcanza');
  await expect(page.locator('.re-cupo')).toContainText('bloquee el número');

  // Y no deja seguir mandando.
  await page.locator('[data-re-ola="o1"]').click();
  await page.locator('[data-re-barrio="Alta Gracia"]').click();
  await expect(page.locator('#reCuerpo')).toContainText('Llegaste al tope de hoy');
  await expect(page.locator('#reEnviar')).toHaveCount(0);
  expect(await page.evaluate(() => window.__wa)).toHaveLength(0);
});

test('se puede marcar qué contestó cada uno', async ({ page }) => {
  await entrar(page);
  await espiarWhatsApp(page);
  await page.locator('#usuariosBtnDormidos').click();
  await page.locator('[data-re-ola="o1"]').click();
  await page.locator('[data-re-barrio="Alta Gracia"]').click();

  await page.locator('[data-re-estado="interesado"]').click();
  await expect(page.locator('.re-estado')).toContainText('interesado');
  // Vuelve a tocarse y se destilda.
  await page.locator('[data-re-estado="interesado"]').click();
  await expect(page.locator('.re-estado')).toHaveCount(0);
});

test('el que pide no molestar desaparece de la campaña', async ({ page }) => {
  await entrar(page);
  await page.locator('#usuariosBtnDormidos').click();
  await page.locator('[data-re-ola="o1"]').click();
  await page.locator('[data-re-barrio="Alta Gracia"]').click();
  await page.locator('[data-re-estado="nomolestar"]').click();

  // Ya no se lo vuelve a listar nunca más.
  const quedan = await page.evaluate(() =>
    window.APPIReactivacion.dormidos().map(u => u.usuario));
  expect(quedan).not.toContain('GOMEZ, ANA');
  expect(quedan).toHaveLength(5);
});

test('el número equivocado también sale de la lista', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => {
    const u = window.APPIReactivacion.dormidos().find(x => x.usuario === 'DIAZ, CARLA');
    window.APPIReactivacion.marcar(u, 'equivocado');
  });
  const quedan = await page.evaluate(() =>
    window.APPIReactivacion.dormidos().map(u => u.usuario));
  expect(quedan).not.toContain('DIAZ, CARLA');
});

test('mandar deja anotado que se escribió, sin pisar lo ya marcado', async ({ page }) => {
  await entrar(page);
  await espiarWhatsApp(page);
  await page.locator('#usuariosBtnDormidos').click();
  await page.locator('[data-re-ola="o1"]').click();
  await page.locator('[data-re-barrio="Villa Allende"]').click();
  await page.locator('#reEnviar').click();

  const e = await page.evaluate(() => {
    const u = window.usuariosTodosActual().find(x => x.usuario === 'DIAZ, CARLA');
    return window.APPIReactivacion.estadoDe(u);
  });
  expect(e.estado).toBe('sinrespuesta');
});

test('el texto de la campaña se puede editar y vuelve al original', async ({ page }) => {
  await entrar(page);
  await page.locator('#usuariosBtnDormidos').click();
  await page.locator('#reEditar').click();
  await page.locator('[data-re-edit="primero"]').click();

  await page.locator('#reTexto').fill('Hola {nombre}, ¿seguís en {localidad}?');
  await expect(page.locator('#rePrev')).toContainText('Hola Ana, ¿seguís en Alta Gracia?');
  await page.locator('#reGuardar').click();

  // Sobrevive a cerrar y reabrir.
  await page.locator('#reCerrar').click();
  await page.locator('#usuariosBtnDormidos').click();
  await page.locator('#reEditar').click();
  await page.locator('[data-re-edit="primero"]').click();
  await expect(page.locator('#reTexto')).toHaveValue('Hola {nombre}, ¿seguís en {localidad}?');

  await page.locator('#reRestaurar').click();
  await expect(page.locator('#reTexto')).toContainText('seguís teniendo el equipo');
});

test('los dormidos siguen fuera de los pendientes del día', async ({ page }) => {
  await entrar(page);
  // La franja "Hoy" no puede llenarse con gente de hace 10 años.
  const nombres = await page.evaluate(() =>
    window.APPIMensajes.pendientes().flatMap(g => g.gente.map(u => u.usuario)));
  expect(nombres).not.toContain('SOSA, ELENA');
  expect(nombres).not.toContain('GOMEZ, ANA');
});

test('el gesto de atrás cierra la campaña', async ({ page }) => {
  await entrar(page);
  await page.locator('#usuariosBtnDormidos').click();
  await expect(page.locator('#reOverlay')).toHaveClass(/open/);
  await page.goBack();
  await expect(page.locator('#reOverlay')).not.toHaveClass(/open/);
  await expect(page.locator('#view-usuarios')).toBeVisible();
});

test('las olas parten la antigüedad donde corresponde', async ({ page }) => {
  await entrar(page);
  const r = await page.evaluate(() => {
    const R = window.APPIReactivacion;
    const f = n => ({ fVence: new Date(Date.now() - n * 86400000), telf: '3515550000' });
    return {
      justoUnAnio: R.olaDe(f(366)) && R.olaDe(f(366)).id,
      dosAnios: R.olaDe(f(700)) && R.olaDe(f(700)).id,
      cuatro: R.olaDe(f(1500)) && R.olaDe(f(1500)).id,
      siete: R.olaDe(f(2600)) && R.olaDe(f(2600)).id,
      quince: R.olaDe(f(5500)) && R.olaDe(f(5500)).id
    };
  });
  expect(r.justoUnAnio).toBe('o1');
  expect(r.dosAnios).toBe('o1');
  expect(r.cuatro).toBe('o2');
  expect(r.siete).toBe('o3');
  expect(r.quince).toBe('o4');
});

/* ---------- cerrar el círculo: contestaron → seguimiento → reactivado ---------- */

// Marca a alguien como que contestó, sin pasar por toda la interfaz.
async function marcarContesto(page, nombre) {
  await page.evaluate(n => {
    const u = window.usuariosTodosActual().find(x => x.usuario === n);
    window.APPIReactivacion.marcar(u, 'interesado');
  }, nombre);
}

test('los que contestaron aparecen primero, separados del resto', async ({ page }) => {
  await entrar(page);
  await marcarContesto(page, 'GOMEZ, ANA');
  await page.locator('#usuariosBtnDormidos').click();

  const destacado = page.locator('#reContestaron');
  await expect(destacado).toBeVisible();
  await expect(destacado).toContainText('1 te contestó');
  // Y sale de la lista de los que faltan contactar: la ola baja de 3 a 2.
  await expect(page.locator('[data-re-ola="o1"]')).toContainText('2');
});

test('el que contestó ofrece las respuestas típicas', async ({ page }) => {
  await entrar(page);
  await marcarContesto(page, 'GOMEZ, ANA');
  await page.locator('#usuariosBtnDormidos').click();
  await page.locator('#reContestaron').click();
  await expect(page.locator('#reTitulo')).toContainText('Te contestaron');

  await page.locator('[data-re-cont="0"]').click();
  // Las cinco salidas posibles de un "¿lo seguís usando?".
  await expect(page.locator('[data-re-seg]')).toHaveCount(5);
  await expect(page.locator('[data-re-seg="lo_usa"]')).toBeVisible();
  await expect(page.locator('[data-re-seg="no_lo_usa"]')).toBeVisible();
  await expect(page.locator('[data-re-seg="roto"]')).toBeVisible();
  await expect(page.locator('[data-re-seg="no_lo_tiene"]')).toBeVisible();
  await expect(page.locator('[data-re-seg="visita"]')).toBeVisible();
});

test('el seguimiento manda el texto que corresponde', async ({ page }) => {
  await entrar(page);
  await espiarWhatsApp(page);
  await marcarContesto(page, 'GOMEZ, ANA');
  await page.locator('#usuariosBtnDormidos').click();
  await page.locator('#reContestaron').click();
  await page.locator('[data-re-cont="0"]').click();
  await page.locator('[data-re-seg="lo_usa"]').click();

  const urls = await page.evaluate(() => window.__wa);
  expect(urls).toHaveLength(1);
  const texto = decodeURIComponent(urls[0].split('text=')[1]);
  expect(texto).toContain('Ana');
  expect(texto).toContain('canje');
  expect(texto).not.toContain('{nombre}');
});

test('responderle a alguien que ya contestó no gasta el cupo del día', async ({ page }) => {
  await entrar(page);
  await espiarWhatsApp(page);
  await marcarContesto(page, 'GOMEZ, ANA');
  await page.locator('#usuariosBtnDormidos').click();
  const antes = await page.evaluate(() => window.APPIReactivacion.quedanHoy());

  await page.locator('#reContestaron').click();
  await page.locator('[data-re-cont="0"]').click();
  await page.locator('[data-re-seg="visita"]').click();

  // El tope existe para no escribirle a desconocidos, no para responder.
  const despues = await page.evaluate(() => window.APPIReactivacion.quedanHoy());
  expect(despues).toBe(antes);
});

test('"Lo reactivé" lo saca de la campaña y lo devuelve al circuito normal', async ({ page }) => {
  await entrar(page);
  await marcarContesto(page, 'GOMEZ, ANA');
  await page.locator('#usuariosBtnDormidos').click();
  await page.locator('#reContestaron').click();
  await page.locator('[data-re-cont="0"]').click();
  await page.locator('#reReactivar').click();

  // Sale de los dormidos...
  const dormidos = await page.evaluate(() =>
    window.APPIReactivacion.dormidos().map(u => u.usuario));
  expect(dormidos).not.toContain('GOMEZ, ANA');

  // ...y vuelve a ser un cliente vigente para el resto de la app, aunque su
  // fecha de vencimiento en el Excel siga siendo vieja.
  const grupo = await page.evaluate(() => {
    const u = window.usuariosTodosActual().find(x => x.usuario === 'GOMEZ, ANA');
    return window.APPIMensajes.grupoDe(u);
  });
  expect(grupo).toBe('vigente');
});

test('el reactivado vuelve a recibir mensajes normales desde su ficha', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => {
    const u = window.usuariosTodosActual().find(x => x.usuario === 'GOMEZ, ANA');
    window.APPIReactivacion.reactivar(u);
  });
  const plantillas = await page.evaluate(() => {
    const u = window.usuariosTodosActual().find(x => x.usuario === 'GOMEZ, ANA');
    return window.APPIMensajes.plantillasPara(u).map(p => p.id);
  });
  // Antes no recibía nada por estar vencido hace años; ahora sí.
  expect(plantillas).toContain('retrolavado');
  expect(plantillas).toContain('cumple');
});

test('la campaña muestra cuántos se reactivaron', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => {
    const R = window.APPIReactivacion;
    ['GOMEZ, ANA', 'RUIZ, BETO'].forEach(n => {
      R.reactivar(window.usuariosTodosActual().find(x => x.usuario === n));
    });
  });
  await page.locator('#usuariosBtnDormidos').click();
  await expect(page.locator('.re-logro')).toContainText('2 clientes reactivados');
});

test('los textos de seguimiento se editan y vuelven al original', async ({ page }) => {
  await entrar(page);
  await page.locator('#usuariosBtnDormidos').click();
  await page.locator('#reEditar').click();
  // Ahora hay que elegir qué texto: el primero o alguno de seguimiento.
  await expect(page.locator('[data-re-edit]')).toHaveCount(6);

  await page.locator('[data-re-edit="roto"]').click();
  await page.locator('#reTexto').fill('Lo vemos, {nombre}!');
  await expect(page.locator('#rePrev')).toContainText('Lo vemos, Ana!');
  await page.locator('#reGuardar').click();
  await expect(page.locator('[data-re-edit="roto"]')).toContainText('✏️');

  await page.locator('[data-re-edit="roto"]').click();
  await page.locator('#reRestaurar').click();
  await expect(page.locator('#reTexto')).toContainText('cumplió la vida útil');
});

/* ---------- el aviso de WhatsApp ---------- */

test('la primera vez que se abre la campaña, aparece el aviso', async ({ page }) => {
  await entrar(page, LISTA, { conAviso: true });
  await page.locator('#usuariosBtnDormidos').click();

  // Antes de dejar mandar nada, las reglas.
  await expect(page.locator('.re-aviso')).toBeVisible();
  await expect(page.locator('#reTitulo')).toContainText('Cuidar tu número');
  await expect(page.locator('.re-aviso-bajada')).toContainText('bloquear el número');
  await expect(page.locator('.re-regla')).toHaveCount(5);
  // Y no se ven las olas hasta aceptarlo.
  await expect(page.locator('[data-re-ola]')).toHaveCount(0);

  await page.locator('#reAvisoOk').click();
  await expect(page.locator('[data-re-ola]')).not.toHaveCount(0);
});

test('el aviso no vuelve a molestar después de leerlo', async ({ page }) => {
  await entrar(page, LISTA, { conAviso: true });
  await page.locator('#usuariosBtnDormidos').click();
  await page.locator('#reAvisoOk').click();
  await page.locator('#reCerrar').click();

  // Segunda vez: derecho a las olas.
  await page.locator('#usuariosBtnDormidos').click();
  await expect(page.locator('.re-aviso')).toHaveCount(0);
  await expect(page.locator('[data-re-ola]')).not.toHaveCount(0);
});

test('el aviso queda a mano para releerlo cuando se quiera', async ({ page }) => {
  await entrar(page, LISTA, { conAviso: true });
  await page.locator('#usuariosBtnDormidos').click();
  await page.locator('#reAvisoOk').click();

  await page.locator('#reVerAviso').click();
  await expect(page.locator('.re-aviso')).toBeVisible();
  // Y se vuelve sin perder el lugar.
  await page.locator('#reAvisoOk').click();
  await expect(page.locator('[data-re-ola]')).not.toHaveCount(0);
});

test('el aviso nombra las reglas que de verdad protegen el número', async ({ page }) => {
  await entrar(page, LISTA, { conAviso: true });
  await page.locator('#usuariosBtnDormidos').click();
  const texto = (await page.locator('.re-aviso').innerText()).toLowerCase();
  expect(texto).toContain('15 por día');
  expect(texto).toContain('espaciados');
  expect(texto).toContain('no molestar');
  // La más importante: contestarle al que contesta.
  expect(texto).toContain('contestale');
});
