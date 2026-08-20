const { test, expect } = require('@playwright/test');

// Plantillas de mensajes para los clientes de Garantías.
// Lo más delicado es a quién le corresponde cada cosa: vigentes reciben
// mantenimiento y cumpleaños, los vencidos hace menos de un año sólo
// renovación, y los vencidos hace más de un año quedan afuera de todo.

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

// Uno de cada grupo, para poder mirar las tres reglas.
const USUARIOS = [
  { id: 1, usuario: 'GOMEZ, ANA MARIA', telf: '3515551001', domicilio: 'San Martín 120', localidad: 'Alta Gracia',
    producto: 'PSA SENIOR 4', cp: '5186', fCompra: ddmmyyyy(-400), fVenceRaw: ddmmyyyy(200), fVence: dias(200), estado: 'vigente' },
  { id: 2, usuario: 'RUIZ, ROBERTO', telf: '3515551002', domicilio: 'Belgrano 45', localidad: 'Villa Allende',
    producto: 'PSA VERO', cp: '5105', fCompra: ddmmyyyy(-800), fVenceRaw: ddmmyyyy(-90), fVence: dias(-90), estado: 'vencida' },
  { id: 3, usuario: 'DIAZ, CAROLINA', telf: '3515551003', domicilio: 'Sarmiento 8', localidad: 'Centro',
    producto: 'SODA BURBY', cp: '5000', fCompra: ddmmyyyy(-1500), fVenceRaw: ddmmyyyy(-500), fVence: dias(-500), estado: 'vencida' }
];

async function entrar(page, users = USUARIOS) {
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
  await page.addInitScript(([u]) => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('tutoVisto_v2', '1');
    localStorage.setItem('usuarios_garantias', JSON.stringify(u));
  }, [users]);
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
  await page.evaluate(() => window.showView('view-usuarios'));
  await expect(page.locator('#usuariosBtnMapAll')).toBeVisible();
}

// Abre la ficha de un cliente por su posición en la lista.
async function abrirFicha(page, i) {
  await page.locator(`[data-u-toggle="${i}"]`).click();
  await expect(page.locator(`[data-u-toggle="${i}"]`)).toHaveClass(/expanded/);
}

test('el cumpleaños del Excel se detecta el día que corresponde', async ({ page }) => {
  await entrar(page);
  // La planilla real trae la columna Cumpleaños; la app la ignoraba.
  const r = await page.evaluate(() => {
    const M = window.APPIMensajes;
    const h = new Date();
    const dd = String(h.getDate()).padStart(2, '0');
    const mm = String(h.getMonth() + 1).padStart(2, '0');
    const otro = new Date(Date.now() + 5 * 86400000);
    return {
      hoy: M.cumpleHoy({ cumpleRaw: `${dd}/${mm}/1975` }),
      // El año no importa, sólo el día y el mes.
      hoyOtroAnio: M.cumpleHoy({ cumpleRaw: `${dd}/${mm}/1990` }),
      otroDia: M.cumpleHoy({ cumpleRaw: `${String(otro.getDate()).padStart(2,'0')}/${String(otro.getMonth()+1).padStart(2,'0')}/1980` }),
      sinDato: M.cumpleHoy({ cumpleRaw: '' })
    };
  });
  expect(r.hoy).toBe(true);
  expect(r.hoyOtroAnio).toBe(true);
  expect(r.otroDia).toBe(false);
  expect(r.sinDato).toBe(false);
});

test('cada ficha ofrece mandar un mensaje', async ({ page }) => {
  await entrar(page);
  await abrirFicha(page, 0);
  const boton = page.locator('[data-u-toggle="0"] + .tree-children [data-mu-btn]');
  await expect(boton).toBeVisible();
  await expect(boton).toContainText('Mensaje');

  await boton.click();
  await expect(page.locator('#muOverlay')).toHaveClass(/open/);
  await expect(page.locator('#muTitulo')).toContainText('Ana');
});

test('a un cliente vigente le ofrece mantenimiento y cumpleaños', async ({ page }) => {
  await entrar(page);
  await abrirFicha(page, 0);
  await page.locator('[data-u-toggle="0"] + .tree-children [data-mu-btn]').click();

  const items = page.locator('[data-mu-plantilla]');
  await expect(items).toHaveCount(4);   // retrolavado, cumple, por vencer, saludo
  await expect(page.locator('[data-mu-plantilla="retrolavado"]')).toBeVisible();
  await expect(page.locator('[data-mu-plantilla="cumple"]')).toBeVisible();
  // La renovación es para los que ya vencieron.
  await expect(page.locator('[data-mu-plantilla="renovacion"]')).toHaveCount(0);
});

test('a un vencido hace menos de un año sólo le ofrece renovar', async ({ page }) => {
  await entrar(page);
  await abrirFicha(page, 1);
  await page.locator('[data-u-toggle="1"] + .tree-children [data-mu-btn]').click();

  await expect(page.locator('#muSub')).toContainText('vencida hace menos de un año');
  await expect(page.locator('[data-mu-plantilla="renovacion"]')).toBeVisible();
  await expect(page.locator('[data-mu-plantilla="retrolavado"]')).toHaveCount(0);
  await expect(page.locator('[data-mu-plantilla="cumple"]')).toHaveCount(0);
});

test('al vencido hace más de un año no se le ofrece nada', async ({ page }) => {
  await entrar(page);
  await abrirFicha(page, 2);
  // Ni siquiera aparece el botón: es la regla que pidió el usuario.
  await expect(page.locator('[data-u-toggle="2"] + .tree-children [data-mu-btn]')).toHaveCount(0);

  // Y si se lo fuerza desde el código, avisa antes de dejar seguir.
  await page.evaluate(() => {
    const u = window.usuariosFiltradosActual()[2];
    window.APPIMensajes.abrir(u);
  });
  await expect(page.locator('#muOverlay')).toHaveClass(/open/);
  await expect(page.locator('#muCuerpo')).toContainText('venció hace más de un año');
});

test('el texto se completa con los datos del cliente', async ({ page }) => {
  await entrar(page);
  await abrirFicha(page, 0);
  await page.locator('[data-u-toggle="0"] + .tree-children [data-mu-btn]').click();
  await page.locator('[data-mu-plantilla="retrolavado"]').click();

  // La vista previa muestra el mensaje ya armado, sin etiquetas sueltas.
  const prev = page.locator('#muPrevTxt');
  await expect(prev).toContainText('Hola Ana');
  await expect(prev).toContainText('PSA SENIOR 4');
  await expect(prev).toContainText('youtube.com/watch?v=qa6xkQQsyg8');
  await expect(prev).not.toContainText('{nombre}');
  await expect(prev).not.toContainText('{producto}');
});

test('editar una plantilla la deja guardada para la próxima', async ({ page }) => {
  await entrar(page);
  await abrirFicha(page, 0);
  await page.locator('[data-u-toggle="0"] + .tree-children [data-mu-btn]').click();
  await page.locator('[data-mu-plantilla="saludo"]').click();

  await page.locator('#muTexto').fill('Buenas {nombre}, ¿todo bien con el {producto}?');
  await expect(page.locator('#muPrevTxt')).toContainText('Buenas Ana, ¿todo bien con el PSA SENIOR 4?');
  await page.locator('#muGuardar').click();

  // Vuelve a la lista y el cambio sobrevive a reabrir el popup.
  await expect(page.locator('[data-mu-plantilla="saludo"]')).toContainText('Buenas Ana');
  await page.locator('#muCerrar').click();
  await page.locator('[data-u-toggle="0"] + .tree-children [data-mu-btn]').click();
  await page.locator('[data-mu-plantilla="saludo"]').click();
  await expect(page.locator('#muTexto')).toHaveValue('Buenas {nombre}, ¿todo bien con el {producto}?');

  // Y se puede volver atrás.
  await page.locator('#muRestaurar').click();
  await expect(page.locator('#muTexto')).toContainText('¿Cómo estás?');
});

test('las etiquetas se insertan donde está el cursor', async ({ page }) => {
  await entrar(page);
  await abrirFicha(page, 0);
  await page.locator('[data-u-toggle="0"] + .tree-children [data-mu-btn]').click();
  await page.locator('[data-mu-plantilla="saludo"]').click();

  await page.locator('#muTexto').fill('Hola ');
  await page.locator('#muTexto').click();
  await page.keyboard.press('End');
  await page.locator('[data-mu-tag="{localidad}"]').click();
  await expect(page.locator('#muTexto')).toHaveValue('Hola {localidad}');
  await expect(page.locator('#muPrevTxt')).toContainText('Hola Alta Gracia');
});

test('el botón Mensajes de la barra abre la biblioteca completa', async ({ page }) => {
  await entrar(page);
  const boton = page.locator('#usuariosBtnMensajes');
  await expect(boton).toBeVisible();
  await boton.click();
  // Sin cliente elegido se ven las cinco, para poder editarlas con calma.
  await expect(page.locator('[data-mu-plantilla]')).toHaveCount(5);
  await expect(page.locator('#muTitulo')).toContainText('Plantillas');
});

test('el gesto de atrás cierra el popup de mensajes', async ({ page }) => {
  await entrar(page);
  await page.locator('#usuariosBtnMensajes').click();
  await expect(page.locator('#muOverlay')).toHaveClass(/open/);

  await page.goBack();
  await expect(page.locator('#muOverlay')).not.toHaveClass(/open/);
  // Y sigue en la misma pantalla, no se fue a otro lado.
  await expect(page.locator('#view-usuarios')).toBeVisible();
});

test('el ciclo de mantenimiento se cuenta desde la compra, cada 6 meses', async ({ page }) => {
  await entrar(page);
  const r = await page.evaluate(() => {
    const M = window.APPIMensajes;
    const d = n => {
      const x = new Date(Date.now() + n * 86400000);
      return `${String(x.getDate()).padStart(2,'0')}/${String(x.getMonth()+1).padStart(2,'0')}/${x.getFullYear()}`;
    };
    return {
      // Comprado hace 6 meses justos: le toca ahora.
      justo: M.mantenimiento({ fCompra: d(-182) }),
      // Comprado hace un mes: falta bastante.
      nuevo: M.mantenimiento({ fCompra: d(-30) }),
      // Comprado hace años, el último aviso quedó lejos: no se muestra, para
      // no llenar la pantalla de pendientes viejos el primer día.
      viejo: M.mantenimiento({ fCompra: d(-1000) }),
      sinFecha: M.mantenimiento({ fCompra: '' })
    };
  });
  expect(r.justo.vencido).toBe(true);
  expect(r.nuevo.vencido).toBe(false);
  expect(r.nuevo.dias).toBeGreaterThan(100);
  expect(r.viejo.vencido).toBe(false);
  expect(r.sinFecha).toBeNull();
});

test('la regla de vigencia clasifica bien los tres grupos', async ({ page }) => {
  await entrar(page);
  const r = await page.evaluate(() => {
    const M = window.APPIMensajes;
    const f = n => new Date(Date.now() + n * 86400000);
    return {
      vigente: M.grupoDe({ fVence: f(100) }),
      venceHoy: M.grupoDe({ fVence: f(0) }),
      recien: M.grupoDe({ fVence: f(-30) }),
      casiAnio: M.grupoDe({ fVence: f(-360) }),
      pasadoAnio: M.grupoDe({ fVence: f(-400) }),
      sinFecha: M.grupoDe({ fVence: null })
    };
  });
  expect(r.vigente).toBe('vigente');
  expect(r.venceHoy).toBe('vigente');
  expect(r.recien).toBe('vencido');
  expect(r.casiAnio).toBe('vencido');
  expect(r.pasadoAnio).toBe('inactivo');
  expect(r.sinFecha).toBe('vigente');
});
