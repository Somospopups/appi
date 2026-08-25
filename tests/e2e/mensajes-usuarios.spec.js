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
    localStorage.setItem('appi_tarjetas_auto', '0');
    localStorage.setItem('tutoVisto_v2', '1');
    localStorage.setItem('usuarios_garantias', JSON.stringify(u));
  }, [users]);
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
  await page.evaluate(() => window.showView('view-usuarios'));
  await expect(page.locator('#usuariosBtnZonas')).toBeVisible();
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

test('el botón de WhatsApp de la ficha abre las plantillas', async ({ page }) => {
  await entrar(page);
  await abrirFicha(page, 0);
  // Queda un solo botón: el de siempre, que ahora ofrece las plantillas en vez
  // de mandar un saludo fijo.
  const ficha = page.locator('[data-u-toggle="0"] + .tree-children');
  await expect(ficha.locator('[data-u-action="whatsapp"]')).toHaveCount(1);
  await expect(ficha.locator('[data-u-action="whatsapp"]')).toContainText('WhatsApp');

  await ficha.locator('[data-u-action="whatsapp"]').click();
  await expect(page.locator('#muOverlay')).toHaveClass(/open/);
  await expect(page.locator('#muTitulo')).toContainText('Ana');
});

test('tocar una plantilla abre WhatsApp derecho, sin pantalla intermedia', async ({ page }) => {
  await entrar(page);
  // Se atrapa la apertura de WhatsApp para leer el texto que se manda.
  await page.evaluate(() => {
    window.__wa = [];
    window.APPIWhatsApp.abrir = url => { window.__wa.push(url); };
  });
  await abrirFicha(page, 0);
  await page.locator('[data-u-toggle="0"] + .tree-children [data-u-action="whatsapp"]').click();
  await page.locator('[data-mu-plantilla="retrolavado"]').click();

  // Un solo toque: ni editor, ni confirmación.
  const urls = await page.evaluate(() => window.__wa);
  expect(urls).toHaveLength(1);
  const texto = decodeURIComponent(urls[0].split('text=')[1]);
  expect(texto).toContain('Hola Ana');
  expect(texto).toContain('tu equipo');
  expect(texto).toContain('qa6xkQQsyg8');
  expect(texto).not.toContain('{nombre}');
  // Y el popup se cierra solo.
  await expect(page.locator('#muOverlay')).not.toHaveClass(/open/);
});

test('el que elige mandar no ve ninguna llave', async ({ page }) => {
  await entrar(page);
  await abrirFicha(page, 0);
  await page.locator('[data-u-toggle="0"] + .tree-children [data-u-action="whatsapp"]').click();
  // Esto fue lo que confundió al usuario: llaves y etiquetas en la pantalla de
  // enviar. No tienen que aparecer por ningún lado.
  const cuerpo = await page.locator('#muCuerpo').innerText();
  expect(cuerpo).not.toContain('{');
  await expect(page.locator('#muCuerpo [data-mu-tag]')).toHaveCount(0);
  await expect(page.locator('#muCuerpo textarea')).toHaveCount(0);
  await expect(page.locator('#muSub')).toContainText('se abre WhatsApp');
});

test('a un cliente vigente le ofrece mantenimiento y cumpleaños', async ({ page }) => {
  await entrar(page);
  await abrirFicha(page, 0);
  await page.locator('[data-u-toggle="0"] + .tree-children [data-u-action="whatsapp"]').click();

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
  await page.locator('[data-u-toggle="1"] + .tree-children [data-u-action="whatsapp"]').click();

  await expect(page.locator('[data-mu-plantilla="renovacion"]')).toBeVisible();
  await expect(page.locator('[data-mu-plantilla="retrolavado"]')).toHaveCount(0);
  await expect(page.locator('[data-mu-plantilla="cumple"]')).toHaveCount(0);
});

test('al vencido hace más de un año no se le ofrece nada', async ({ page }) => {
  await entrar(page);
  await abrirFicha(page, 2);
  // Si se abre el popup igual, avisa antes de dejar seguir.
  await page.evaluate(() => {
    const u = window.usuariosFiltradosActual()[2];
    window.APPIMensajes.abrir(u);
  });
  await expect(page.locator('#muOverlay')).toHaveClass(/open/);
  await expect(page.locator('#muCuerpo')).toContainText('venció hace más de un año');
  // Nada de plantillas hasta que se lo pida a propósito.
  await expect(page.locator('[data-mu-plantilla]')).toHaveCount(0);
  await page.locator('#muIgual').click();
  await expect(page.locator('[data-mu-plantilla]')).toHaveCount(5);
});

test('el resumen de cada plantilla ya viene con los datos puestos', async ({ page }) => {
  await entrar(page);
  await abrirFicha(page, 0);
  await page.locator('[data-u-toggle="0"] + .tree-children [data-u-action="whatsapp"]').click();
  // Se elige mirando el mensaje real, no una receta con huecos.
  const item = page.locator('[data-mu-plantilla="retrolavado"]');
  await expect(item).toContainText('Hola Ana');
  await expect(item).toContainText('tu equipo');
  await expect(item).not.toContainText('{');
});

test('editar una plantilla la deja guardada para la próxima', async ({ page }) => {
  await entrar(page);
  await abrirFicha(page, 0);
  await page.locator('[data-u-toggle="0"] + .tree-children [data-u-action="whatsapp"]').click();
  // Ahora editar es un desvío explícito, no el camino principal.
  await page.locator('#muIrEditar').click();
  await page.locator('[data-mu-editar="saludo"]').click();

  await page.locator('#muTexto').fill('Buenas {nombre}, ¿todo bien con el {producto}?');
  await expect(page.locator('#muPrevTxt')).toContainText('Buenas Ana, ¿todo bien con el PSA SENIOR 4?');
  await page.locator('#muGuardar').click();
  // Desde v356 el alcance se elige con APPIDialog (los confirm nativos
  // están prohibidos por convención). Guardar para todos.
  await expect(page.locator('#appiDialogOk')).toContainText('Todos los clientes');
  await page.locator('#appiDialogOk').click();

  // Vuelve a la lista de edición y el cambio sobrevive a reabrir el popup.
  await expect(page.locator('[data-mu-editar="saludo"]')).toContainText('Buenas Ana');
  await page.locator('#muCerrar').click();
  await page.locator('[data-u-toggle="0"] + .tree-children [data-u-action="whatsapp"]').click();
  await expect(page.locator('[data-mu-plantilla="saludo"]')).toContainText('Buenas Ana');

  await page.locator('#muIrEditar').click();
  await page.locator('[data-mu-editar="saludo"]').click();
  await expect(page.locator('#muTexto')).toHaveValue('Buenas {nombre}, ¿todo bien con el {producto}?');
  await page.locator('#muRestaurar').click();
  await expect(page.locator('#muTexto')).toContainText('Pasaba a saludarte');
});

test('los botones de datos dicen el nombre, no la llave', async ({ page }) => {
  await entrar(page);
  await abrirFicha(page, 0);
  await page.locator('[data-u-toggle="0"] + .tree-children [data-u-action="whatsapp"]').click();
  await page.locator('#muIrEditar').click();
  await page.locator('[data-mu-editar="saludo"]').click();

  // En el editor el botón se lee "+ Barrio", no "{localidad}".
  const tag = page.locator('[data-mu-tag="{localidad}"]');
  await expect(tag).toContainText('Barrio');
  await expect(tag).not.toContainText('{');

  await page.locator('#muTexto').fill('Hola ');
  await page.locator('#muTexto').click();
  await page.keyboard.press('End');
  await tag.click();
  await expect(page.locator('#muTexto')).toHaveValue('Hola {localidad}');
  await expect(page.locator('#muPrevTxt')).toContainText('Hola Alta Gracia');
});

test('la barra no tiene botón de Mensajes: se escribe desde la ficha', async ({ page }) => {
  await entrar(page);
  await expect(page.locator('#usuariosBtnMensajes')).toHaveCount(0);
  // Los cinco de siempre (Mapa se quitó en v332; Depurados se sumó en v350);
  // "Dormidos" se suma sólo si hay clientes dormidos, y esta lista tiene uno
  // vencido hace más de un año.
  await expect(page.locator('.u-tools button:visible')).toHaveCount(6);
  await expect(page.locator('#usuariosBtnDormidos')).toBeVisible();
});

test('el gesto de atrás cierra el popup de mensajes', async ({ page }) => {
  await entrar(page);
  await abrirFicha(page, 0);
  await page.locator('[data-u-toggle="0"] + .tree-children [data-u-action="whatsapp"]').click();
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

/* ---------- etapa 2: la franja del día y la fila de trabajo ---------- */

// Clientes armados para que cada uno caiga en un motivo distinto.
const hoyDDMM = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
};
const PENDIENTES = [
  // cumple años hoy
  { id: 1, usuario: 'GOMEZ, ANA MARIA', telf: '3515551001', localidad: 'Alta Gracia', producto: 'PSA SENIOR 4',
    cumpleRaw: `${hoyDDMM()}/1975`, fCompra: ddmmyyyy(-30), fVenceRaw: ddmmyyyy(300), fVence: dias(300), estado: 'vigente' },
  // compró hace 6 meses justos: le toca retrolavado
  { id: 2, usuario: 'RUIZ, ROBERTO', telf: '3515551002', localidad: 'Villa Allende', producto: 'PSA VERO',
    fCompra: ddmmyyyy(-182), fVenceRaw: ddmmyyyy(400), fVence: dias(400), estado: 'vigente' },
  // la garantía le vence en 10 días
  { id: 3, usuario: 'DIAZ, CAROLINA', telf: '3515551003', localidad: 'Centro', producto: 'SODA BURBY',
    fCompra: ddmmyyyy(-60), fVenceRaw: ddmmyyyy(10), fVence: dias(10), estado: 'porVencer' },
  // vencido hace años: no tiene que aparecer en ningún lado
  { id: 4, usuario: 'PEREZ, JUAN', telf: '3515551004', localidad: 'Centro', producto: 'PSA VERO',
    fCompra: ddmmyyyy(-1500), fVenceRaw: ddmmyyyy(-500), fVence: dias(-500), estado: 'vencida' }
];

test('la franja del día junta los pendientes y no inventa ninguno', async ({ page }) => {
  await entrar(page, PENDIENTES);
  const hoy = page.locator('#muHoy');
  await expect(hoy).toBeVisible();
  await expect(hoy).toContainText('3 mensajes');

  // Un renglón por motivo, con su cuenta.
  await expect(page.locator('[data-mu-hoy]')).toHaveCount(3);
  await expect(page.locator('[data-mu-hoy="cumple"]')).toContainText('1');
  await expect(page.locator('[data-mu-hoy="retro"]')).toContainText('1');
  await expect(page.locator('[data-mu-hoy="porvencer"]')).toContainText('1');
});

test('sin pendientes la franja no se dibuja y la pantalla queda igual', async ({ page }) => {
  // Todos vigentes, recién comprados y sin cumpleaños cargado.
  await entrar(page, [
    { id: 1, usuario: 'GOMEZ, ANA MARIA', telf: '3515551001', localidad: 'Alta Gracia', producto: 'PSA',
      fCompra: ddmmyyyy(-20), fVenceRaw: ddmmyyyy(300), fVence: dias(300), estado: 'vigente' }
  ]);
  await expect(page.locator('#muHoy')).toHaveCount(0);
});

test('la franja muestra la fecha de la agenda y de cada accion', async ({ page }) => {
  await entrar(page, PENDIENTES);
  const hoy = new Date();
  const fecha = `${String(hoy.getDate()).padStart(2, '0')}/${String(hoy.getMonth() + 1).padStart(2, '0')}/${hoy.getFullYear()}`;
  await expect(page.locator('.mu-hoy-fecha')).toContainText(fecha);
  await expect(page.locator('[data-mu-hoy="cumple"]')).toContainText('Cumple:');
  await expect(page.locator('[data-mu-hoy="retro"]')).toContainText('Pendiente desde:');
  await expect(page.locator('[data-mu-hoy="porvencer"]')).toContainText('Vence:');
});

test('una accion hecha queda guardada y no reaparece al dia siguiente', async ({ page }) => {
  await entrar(page, PENDIENTES);
  const estado = await page.evaluate(() => {
    const M = window.APPIMensajes;
    const u = window.usuariosTodosActual().find(x => x.usuario === 'RUIZ, ROBERTO');
    const clave = M.claveAccion('retro', u);
    M.marcarAccion('retro', u, 'hecha');
    const accionesKey = Object.keys(localStorage).find(k => k.startsWith('appi_acciones_v1_'));
    const guardado = JSON.parse(localStorage.getItem(accionesKey) || '{}');
    const completadaHoy = guardado.completadas && guardado.completadas[clave];

    // Simula volver a abrir APPI mañana: la marca diaria queda en el pasado,
    // pero la resolución del ciclo es la que decide que no vuelva a entrar.
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    const ayerKey = `${ayer.getFullYear()}-${String(ayer.getMonth() + 1).padStart(2, '0')}-${String(ayer.getDate()).padStart(2, '0')}`;
    guardado.completadas[clave].dia = ayerKey;
    localStorage.setItem(accionesKey, JSON.stringify(guardado));
    M.pintarHoy();

    return {
      guardada: completadaHoy && completadaHoy.e === 'hecha',
      sigueHoy: M.deHoy().some(g => g.motivo.id === 'retro' && g.gente.some(x => x.usuario === 'RUIZ, ROBERTO')),
      siguePendiente: M.pendientes().some(g => g.motivo.id === 'retro')
    };
  });
  expect(estado.guardada).toBe(true);
  expect(estado.sigueHoy).toBe(false);
  expect(estado.siguePendiente).toBe(false);
});

test('la fila de trabajo va de a uno y avisa cuántos quedan', async ({ page }) => {
  await entrar(page, PENDIENTES);
  await page.evaluate(() => {
    window.__wa = [];
    window.APPIWhatsApp.abrir = url => { window.__wa.push(url); };
  });

  await page.locator('[data-mu-hoy="cumple"]').click();
  await expect(page.locator('#muOverlay')).toHaveClass(/open/);
  // Desde v353 el "cuántos quedan" no va en el subtítulo: la pastilla de
  // fecha ocupa #muSub y el avance se lee en la posición de la fila.
  await expect(page.locator('#muSub')).toContainText('Cumple');
  await expect(page.locator('.mu-fila-pos')).toContainText('1 de 1');
  await expect(page.locator('.mu-fila-quien')).toContainText('GOMEZ, ANA MARIA');
  // Se ve el mensaje final, no la receta.
  await expect(page.locator('.mu-prev')).toContainText('Feliz cumpleaños, Ana');

  await page.locator('#muFilaEnviar').click();
  // Mandar NO avanza solo (v330): la misma persona queda a la vista, ya
  // marcada ✓, para marcar qué pasó en ese contacto.
  await expect(page.locator('.mu-fila-quien')).toContainText('GOMEZ, ANA MARIA');
  await expect(page.locator('.mu-marca-actual')).toContainText('✓ Marcada como hecha');
  const urls = await page.evaluate(() => window.__wa);
  expect(urls).toHaveLength(1);
  expect(decodeURIComponent(urls[0])).toContain('Feliz cumpleaños, Ana');
  // Al confirmar con el ✓, recién ahí cierra con el resumen.
  await page.locator('#muFilaHecha').click();
  await expect(page.locator('.mu-fin')).toContainText('1 acción hecha');
});

test('la ficha del carrusel muestra domicilio, teléfono, compra y vencimiento', async ({ page }) => {
  const una = [
    { id: 1, usuario: 'GOMEZ, ANA MARIA', telf: '3515551001', domicilio: 'San Martín 120', localidad: 'Alta Gracia',
      producto: 'PSA SENIOR 4', cp: '5186', fCompra: '15/03/2024', fVenceRaw: '30/09/2026', fVence: dias(200), estado: 'vigente',
      cumpleRaw: `${hoyDDMM()}/1975` }
  ];
  await entrar(page, una);
  await page.locator('[data-mu-hoy="cumple"]').click();
  const quien = page.locator('.mu-fila-quien');
  await expect(quien).toContainText('GOMEZ, ANA MARIA');

  // Dos columnas: izquierda (ubicación), derecha (equipo y fechas).
  const cols = quien.locator('.mu-col');
  await expect(cols).toHaveCount(2);
  await expect(cols.nth(0)).toContainText('📍 Alta Gracia');
  await expect(cols.nth(0)).toContainText('🏠 San Martín 120');
  await expect(cols.nth(0)).toContainText('📞 3515551001');
  await expect(cols.nth(1)).toContainText('📦 PSA SENIOR 4');
  await expect(cols.nth(1)).toContainText('Compra: 15/03/2024');
  await expect(cols.nth(1)).toContainText('Vence: 30/09/2026');

  // El vencimiento va en negrita y se pinta según el estado: vigente → verde.
  const vence = quien.locator('.mu-vence');
  await expect(vence).toContainText('Vence: 30/09/2026');
  await expect(vence).toHaveClass(/mu-vigente/);
  const color = await vence.evaluate(el => getComputedStyle(el).color);
  expect(color).toBe('rgb(22, 135, 101)'); // #168765 vigente
  const peso = await vence.evaluate(el => getComputedStyle(el).fontWeight);
  expect(Number(peso)).toBeGreaterThanOrEqual(700);
});

test('el vencimiento se pinta en ámbar cuando está por vencer', async ({ page }) => {
  const porVencer = [
    { id: 2, usuario: 'POR VENCER, BETO', telf: '3515551002', domicilio: 'Calle 2 200', localidad: 'Centro',
      producto: 'PSA VERO', cp: '5000', fCompra: ddmmyyyy(-10), fVenceRaw: ddmmyyyy(10), fVence: dias(10), estado: 'porVencer' }
  ];
  await entrar(page, porVencer);
  await page.locator('[data-mu-hoy="porvencer"]').click();
  const vence = page.locator('.mu-vence');
  await expect(vence).toHaveClass(/mu-porvencer/);
  const color = await vence.evaluate(el => getComputedStyle(el).color);
  expect(color).toBe('rgb(163, 103, 11)'); // #a3670b por vencer
  const peso = await vence.evaluate(el => getComputedStyle(el).fontWeight);
  expect(Number(peso)).toBeGreaterThanOrEqual(700);
});

test('la regla roja de vencida existe en los estilos', async ({ page }) => {
  // Los vencidos no entran al carrusel (van a Reactivación), así que el rojo
  // se cuida por la regla de estilo: si desaparece, el test avisa.
  const porVencer = [
    { id: 2, usuario: 'POR VENCER, BETO', telf: '3515551002', domicilio: 'Calle 2 200', localidad: 'Centro',
      producto: 'PSA VERO', cp: '5000', fCompra: ddmmyyyy(-10), fVenceRaw: ddmmyyyy(10), fVence: dias(10), estado: 'porVencer' }
  ];
  await entrar(page, porVencer);
  await page.locator('[data-mu-hoy="porvencer"]').click();
  const css = await page.evaluate(() => {
    const st = document.getElementById('muEstilos');
    return st ? st.textContent : '';
  });
  expect(css).toContain('.mu-col .mu-vence.mu-vencida{color:#d9534f}');
  expect(css).toContain('.mu-col .mu-vence.mu-vigente{color:#168765}');
  expect(css).toContain('.mu-col .mu-vence.mu-porvencer{color:#a3670b}');
});

test('el contactado no desaparece: queda marcado ✓ y la franja dura todo el día', async ({ page }) => {
  await entrar(page, PENDIENTES);
  await page.evaluate(() => { window.APPIWhatsApp.abrir = () => {}; });
  await expect(page.locator('#muHoy')).toContainText('3 mensajes');

  await page.locator('[data-mu-hoy="cumple"]').click();
  await page.locator('#muFilaEnviar').click();
  // Tras mandar, la persona queda en pantalla: se confirma con el ✓.
  await page.locator('#muFilaHecha').click();
  await page.locator('#muFinCerrar').click();

  // La franja no se achica: la acción hecha queda a la vista con su ✓.
  await expect(page.locator('#muHoy')).toContainText('3 mensajes');
  await expect(page.locator('#muHoy .mu-hoy-res')).toContainText('✓ 1');
  // El motivo completado deja de ser un botón: ya no hay nada para abrir ahí.
  await expect(page.locator('[data-mu-hoy="cumple"]')).toHaveCount(0);
  await expect(page.locator('.mu-hoy-item.done')).toContainText('completado');
});

test('la ✗ registra que no se hizo y obliga a dejar constancia: no hay saltear', async ({ page }) => {
  const dos = [
    { id: 1, usuario: 'GOMEZ, ANA MARIA', telf: '3515551001', localidad: 'Alta Gracia', producto: 'PSA',
      fCompra: ddmmyyyy(-182), fVenceRaw: ddmmyyyy(400), fVence: dias(400), estado: 'vigente' },
    { id: 2, usuario: 'RUIZ, ROBERTO', telf: '3515551002', localidad: 'Villa Allende', producto: 'PSA VERO',
      fCompra: ddmmyyyy(-182), fVenceRaw: ddmmyyyy(400), fVence: dias(400), estado: 'vigente' }
  ];
  await entrar(page, dos);
  await page.evaluate(() => { window.__wa = []; window.APPIWhatsApp.abrir = u => window.__wa.push(u); });

  await page.locator('[data-mu-hoy="retro"]').click();
  await expect(page.locator('.mu-fila-pos')).toContainText('1 de 2');
  await expect(page.locator('.mu-fila-quien')).toContainText('GOMEZ');
  // El botón de saltear no existe más: se marca sí o sí.
  await expect(page.locator('#muFilaSaltar')).toHaveCount(0);
  // Y los dos botones vienen con su explicación, para que se entiendan solos.
  await expect(page.locator('.mu-marcar-ayuda')).toBeVisible();
  await expect(page.locator('.mu-marcar-ayuda')).toContainText('Tocá el verde si ya hiciste esta acción');
  await expect(page.locator('.mu-marcar-ayuda')).toContainText('Tocá el rojo si hoy no se va a hacer');

  await page.locator('#muFilaNoHecha').click();
  await expect(page.locator('.mu-fila-quien')).toContainText('RUIZ');
  await expect(page.locator('.mu-fila-pos')).toContainText('2 de 2');

  await page.locator('#muFilaEnviar').click();
  // Mandar no avanza solo: RUIZ sigue a la vista, marcado ✓, para confirmar
  // o corregir qué pasó en el contacto (v330).
  await expect(page.locator('.mu-fila-quien')).toContainText('RUIZ');
  await expect(page.locator('.mu-marca-actual')).toContainText('✓ Marcada como hecha');
  // La no hecha no recibió nada, pero quedó registrada.
  const urls = await page.evaluate(() => window.__wa);
  expect(urls).toHaveLength(1);
  expect(decodeURIComponent(urls[0])).toContain('Roberto');

  await page.locator('#muFilaHecha').click();
  await expect(page.locator('.mu-fin')).toContainText('1 acción hecha · 1 sin hacer');
  await page.locator('#muFinCerrar').click();
  await expect(page.locator('#muHoy')).toContainText('Día completo');
  await expect(page.locator('#muHoy .mu-hoy-res')).toContainText('✓ 1');
  await expect(page.locator('#muHoy .mu-hoy-res')).toContainText('✗ 1');

  // El cómputo del día queda guardado para la nube y el panel del admin.
  const dia = await page.evaluate(() => {
    const clave = Object.keys(localStorage).find(k => k.startsWith('appi_acciones_v1_'));
    const dias = JSON.parse(localStorage.getItem(clave) || '{}').dias || {};
    return dias[Object.keys(dias)[0]] || null;
  });
  expect(dia.total).toBe(2);
  expect(dia.hechas).toBe(1);
  expect(dia.noHechas).toBe(1);
});

test('mandar no pasa solo a la siguiente: la misma persona queda para marcar', async ({ page }) => {
  const dos = [
    { id: 1, usuario: 'GOMEZ, ANA MARIA', telf: '3515551001', localidad: 'Alta Gracia', producto: 'PSA',
      fCompra: ddmmyyyy(-182), fVenceRaw: ddmmyyyy(400), fVence: dias(400), estado: 'vigente' },
    { id: 2, usuario: 'RUIZ, ROBERTO', telf: '3515551002', localidad: 'Villa Allende', producto: 'PSA VERO',
      fCompra: ddmmyyyy(-182), fVenceRaw: ddmmyyyy(400), fVence: dias(400), estado: 'vigente' }
  ];
  await entrar(page, dos);
  await page.evaluate(() => { window.__wa = []; window.APPIWhatsApp.abrir = u => window.__wa.push(u); });

  await page.locator('[data-mu-hoy="retro"]').click();
  await expect(page.locator('.mu-fila-quien')).toContainText('GOMEZ');
  await expect(page.locator('.mu-fila-pos')).toContainText('1 de 2');

  // Mandar a GOMEZ no avanza: la tarjeta se queda en la misma persona, lista
  // para marcar qué pasó en ese contacto (v330).
  await page.locator('#muFilaEnviar').click();
  await expect(page.locator('.mu-fila-quien')).toContainText('GOMEZ');
  await expect(page.locator('.mu-fila-pos')).toContainText('1 de 2');
  await expect(page.locator('.mu-marca-actual')).toContainText('✓ Marcada como hecha');

  // Recién al marcar con el ✓ se pasa a la siguiente.
  await page.locator('#muFilaHecha').click();
  await expect(page.locator('.mu-fila-quien')).toContainText('RUIZ');
  await expect(page.locator('.mu-fila-pos')).toContainText('2 de 2');
});

test('la ✓ marca hecha sin abrir WhatsApp', async ({ page }) => {
  const uno = [
    { id: 1, usuario: 'GOMEZ, ANA MARIA', telf: '3515551001', localidad: 'Alta Gracia', producto: 'PSA',
      fCompra: ddmmyyyy(-182), fVenceRaw: ddmmyyyy(400), fVence: dias(400), estado: 'vigente' }
  ];
  await entrar(page, uno);
  await page.evaluate(() => { window.__wa = []; window.APPIWhatsApp.abrir = u => window.__wa.push(u); });

  await page.locator('[data-mu-hoy="retro"]').click();
  await page.locator('#muFilaHecha').click();
  await expect(page.locator('.mu-fin')).toContainText('1 acción hecha');

  // No se abrió WhatsApp: la acción se hizo por otro medio (llamada, visita).
  const urls = await page.evaluate(() => window.__wa);
  expect(urls).toHaveLength(0);

  await page.locator('#muFinCerrar').click();
  await expect(page.locator('#muHoy')).toContainText('Día completo');
});

const TRES = [
  { id: 1, usuario: 'GOMEZ, ANA MARIA', telf: '3515551001', localidad: 'Alta Gracia', producto: 'PSA',
    fCompra: ddmmyyyy(-182), fVenceRaw: ddmmyyyy(400), fVence: dias(400), estado: 'vigente' },
  { id: 2, usuario: 'RUIZ, ROBERTO', telf: '3515551002', localidad: 'Villa Allende', producto: 'PSA VERO',
    fCompra: ddmmyyyy(-182), fVenceRaw: ddmmyyyy(400), fVence: dias(400), estado: 'vigente' },
  { id: 3, usuario: 'DIAZ, CAROLINA', telf: '3515551003', localidad: 'Centro', producto: 'SODA BURBY',
    fCompra: ddmmyyyy(-182), fVenceRaw: ddmmyyyy(400), fVence: dias(400), estado: 'vigente' }
];

test('las flechitas pasan y vuelven entre tareas sin marcar nada', async ({ page }) => {
  await entrar(page, TRES);
  await page.locator('[data-mu-hoy="retro"]').click();

  // Arranca en la primera, con la flecha de volver apagada.
  await expect(page.locator('.mu-fila-quien')).toContainText('GOMEZ');
  await expect(page.locator('.mu-fila-pos')).toContainText('1 de 3');
  await expect(page.locator('#muFilaPrev')).toBeDisabled();

  await page.locator('#muFilaNext').click();
  await expect(page.locator('.mu-fila-quien')).toContainText('RUIZ');
  await expect(page.locator('.mu-fila-pos')).toContainText('2 de 3');

  await page.locator('#muFilaNext').click();
  await expect(page.locator('.mu-fila-quien')).toContainText('DIAZ');
  // En la última, la flecha de avanzar se apaga: al final se llega marcando.
  await expect(page.locator('#muFilaNext')).toBeDisabled();

  await page.locator('#muFilaPrev').click();
  await expect(page.locator('.mu-fila-quien')).toContainText('RUIZ');

  // Pasear no es marcar: las tres siguen pendientes.
  const res = await page.evaluate(() => window.APPIMensajes.resumenHoy());
  expect(res.pendientes).toBe(3);
  expect(res.hechas).toBe(0);
  expect(res.noHechas).toBe(0);
});

test('volver con la flechita muestra la marca y deja corregirla', async ({ page }) => {
  await entrar(page, TRES.slice(0, 2));
  await page.evaluate(() => { window.__wa = []; window.APPIWhatsApp.abrir = u => window.__wa.push(u); });
  await page.locator('[data-mu-hoy="retro"]').click();

  // Se marca la primera como no hecha y avanza solo.
  await page.locator('#muFilaNoHecha').click();
  await expect(page.locator('.mu-fila-quien')).toContainText('RUIZ');

  // Con la flechita se vuelve: la marca está a la vista.
  await page.locator('#muFilaPrev').click();
  await expect(page.locator('.mu-fila-quien')).toContainText('GOMEZ');
  await expect(page.locator('.mu-marca-actual')).toContainText('✗ Marcada como no hecha');

  // Se corrige a hecha: la marca se pisa, no se duplica.
  await page.locator('#muFilaHecha').click();
  await expect(page.locator('.mu-fila-quien')).toContainText('RUIZ');
  await page.locator('#muFilaHecha').click();

  await expect(page.locator('.mu-fin')).toContainText('2 acciones hechas');
  await expect(page.locator('.mu-fin')).not.toContainText('sin hacer');

  const res = await page.evaluate(() => window.APPIMensajes.resumenHoy());
  expect(res.hechas).toBe(2);
  expect(res.noHechas).toBe(0);
  expect(res.pendientes).toBe(0);
});


test('el vencido hace más de un año nunca entra en los pendientes', async ({ page }) => {
  await entrar(page, PENDIENTES);
  const nombres = await page.evaluate(() =>
    window.APPIMensajes.pendientes().flatMap(g => g.gente.map(u => u.usuario)));
  expect(nombres).not.toContain('PEREZ, JUAN');
  expect(nombres).toHaveLength(3);
});

/* ---------- retoques: el texto habla de "tu equipo" y la ficha se ordena ---------- */

test('los mensajes hablan de "tu equipo", no del modelo del purificador', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => { window.__wa = []; window.APPIWhatsApp.abrir = u => window.__wa.push(u); });
  await abrirFicha(page, 0);
  await page.locator('[data-u-toggle="0"] + .tree-children [data-u-action="whatsapp"]').click();
  await page.locator('[data-mu-plantilla="retrolavado"]').click();

  const texto = decodeURIComponent((await page.evaluate(() => window.__wa))[0].split('text=')[1]);
  expect(texto).toContain('tu equipo');
  // El cliente no tiene por qué leer el código del modelo.
  expect(texto).not.toContain('PSA SENIOR 4');
});

test('todas las acciones de la ficha van en un solo renglón', async ({ page }) => {
  await entrar(page);
  await abrirFicha(page, 0);
  const ficha = page.locator('[data-u-toggle="0"] + .tree-children');
  const fila = ficha.locator('.u-fila');
  await expect(fila).toHaveCount(1);

  // Tarjetas, contacto y cómo llegar, todo en el mismo renglón (v335).
  await expect(fila).toContainText('Agregar tarjeta');
  await expect(fila).toContainText('WhatsApp');
  await expect(fila.locator('[data-u-action="call"]')).toBeVisible();
  await expect(fila).toContainText('Vecinos');
  await expect(fila).toContainText('¿Cómo llego?');
  // "Avisar promo" se quitó: la promo sale desde Mensajes.
  await expect(fila).not.toContainText('Avisar promo');
  await expect(fila).not.toContainText('Mapa');
  // El viejo "Google" ya no se nombra.
  await expect(ficha).not.toContainText('🗺️ Google');
});

test('sin teléfono no aparece el grupo de contacto, pero sí el de ubicación', async ({ page }) => {
  await entrar(page, [
    { id: 1, usuario: 'SIN TEL, PEDRO', telf: '', localidad: 'Centro', producto: 'PSA',
      fCompra: ddmmyyyy(-30), fVenceRaw: ddmmyyyy(300), fVence: dias(300), estado: 'vigente' }
  ]);
  await abrirFicha(page, 0);
  const ficha = page.locator('[data-u-toggle="0"] + .tree-children');
  await expect(ficha.locator('[data-u-action="whatsapp"]')).toHaveCount(0);
  await expect(ficha.locator('[data-u-action="call"]')).toHaveCount(0);
  await expect(ficha.locator('[data-u-action="google"]')).toBeVisible();
});

/* ================== Mensajes propios (v326) ==================
   El distribuidor arma su propia biblioteca: crea, edita y borra, y
   los mensajes propios salen igual que los de fábrica. */

async function irAEditar(page) {
  await abrirFicha(page, 0);
  await page.locator('[data-u-toggle="0"] + .tree-children [data-u-action="whatsapp"]').click();
  await expect(page.locator('#muOverlay')).toHaveClass(/open/);
  await page.locator('#muIrEditar').click();
  await expect(page.locator('#muNuevo')).toBeVisible();
}

test('se puede crear un mensaje propio y mandarlo a un cliente', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => {
    window.__wa = [];
    window.APPIWhatsApp.abrir = url => { window.__wa.push(url); };
  });
  await irAEditar(page);

  await page.locator('#muNuevo').click();
  await expect(page.locator('#muTitulo')).toContainText('Nuevo mensaje');
  await page.locator('#muIcono').fill('🛠️');
  await page.locator('#muNombre').fill('Control de agua');
  await page.locator('#muTexto').fill('Hola {nombre}! Te paso el control de agua del mes. Queda perfecto ✅');
  await page.locator('#muCrear').click();

  // Vuelve a la lista de edición y el mensaje propio queda arriba de todo.
  await expect(page.locator('[data-mu-editar^="propia_"]')).toHaveCount(1);
  await page.locator('#muVolverEnviar').click();

  // En la lista para enviar aparece al final y manda en un toque.
  const item = page.locator('[data-mu-plantilla^="propia_"]');
  await expect(item).toContainText('Control de agua');
  await item.click();
  const urls = await page.evaluate(() => window.__wa);
  expect(urls).toHaveLength(1);
  const texto = decodeURIComponent(urls[0].split('text=')[1]);
  expect(texto).toContain('Hola Ana');
  expect(texto).toContain('control de agua');
  expect(texto).not.toContain('{nombre}');
  await expect(page.locator('#muOverlay')).not.toHaveClass(/open/);
});

test('el mensaje propio se edita (emoji, nombre y texto) y se borra con confirmación', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => {
    const M = window.APPIMensajes;
    M.crearPropia('💧', 'Cambio de filtro', 'Hola {nombre}, hay que cambiar el filtro.');
  });
  await irAEditar(page);

  const item = page.locator('[data-mu-editar^="propia_"]');
  await expect(item).toContainText('Cambio de filtro');
  await item.click();

  // El editor propio deja cambiar emoji, nombre y texto.
  await page.locator('#muIcono').fill('🚰');
  await page.locator('#muNombre').fill('Cambio de filtro y valvula');
  await page.locator('#muTexto').fill('Hola {nombre}! Cambiamos filtro y válvula en la misma visita.');
  await page.locator('#muGuardar').click();
  await expect(page.locator('[data-mu-editar^="propia_"]')).toContainText('Cambio de filtro y valvula');

  // Y se elimina con confirmación de APPIDialog.
  await page.locator('[data-mu-editar^="propia_"]').click();
  await page.evaluate(() => { window.APPIDialog.confirm = () => Promise.resolve(true); });
  await page.locator('#muEliminar').click();
  await expect(page.locator('[data-mu-editar^="propia_"]')).toHaveCount(0);
  const propias = await page.evaluate(() => window.APPIMensajes.leerPropias());
  expect(propias).toHaveLength(0);
});

test('los mensajes propios valen para cualquier cliente y no se pierden al recargar', async ({ page }) => {
  await entrar(page);
  const idCreado = await page.evaluate(() => {
    const M = window.APPIMensajes;
    const id = M.crearPropia('🎯', 'Seguimiento', 'Hola {nombre}! ¿Cómo veniste esta semana?');
    // El cliente vencido hace menos de un año sólo recibe renovación de
    // fábrica… pero los propios son del distribuidor: van con todos.
    const paraVencido = M.plantillasPara({ fVence: new Date(Date.now() - 90 * 86400000).toISOString(), estado: 'vencida' });
    return { id, saleParaVencido: paraVencido.some(p => p.id === id) };
  });
  expect(idCreado.saleParaVencido).toBe(true);

  // Sobrevive a una recarga de la planilla: vive aparte del Excel.
  const viven = await page.evaluate(() => {
    window.usuarios_garantias = [];
    return window.APPIMensajes.leerPropias().length;
  });
  expect(viven).toBe(1);
});
