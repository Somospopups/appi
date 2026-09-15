const { test, expect } = require('@playwright/test');

/* Lector de Mi Stock (v733–v737): un solo escáner, con marco alargado,
   que lee en vivo el QR (serie) y el texto impreso (OCR local) y carga
   la unidad solo. En el entorno de pruebas no hay cámara: se simula
   "apuntar" decodificando frames de prueba con el mismo decodificador
   (ZXing) que usa la cámara y llamando a qrVivo/evaluarLectura, que es
   exactamente lo que hace el bucle en vivo. No existe la carga por foto
   manual: debe no haber botón ni input de archivos. */

const USER_ID = '11111111-1111-4111-8111-111111111112';

function tokenFor(sub) {
  const h = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return `${h}.${p}.firma`;
}

async function entrar(page) {
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
  await page.route('https://mock.supabase.co/**', async (route) => {
    const url = new URL(route.request().url());
    const cors = { 'access-control-allow-origin': '*', 'content-type': 'application/json' };
    if (url.pathname === '/auth/v1/token') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ access_token: accessToken, refresh_token: 'r', expires_in: 3600, user: { id: USER_ID } }) });
    if (url.pathname === '/rest/v1/appi_perfiles') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([profile]) });
    // Consulta de serie en la base de PSA (Pendientes de canje).
    if (url.pathname === '/functions/v1/consulta-serial') {
      let body = {};
      try { body = JSON.parse(route.request().postData() || '{}'); } catch (e) {}
      // La app baja la base completa UNA vez (al abrir la cámara) y busca
      // en el teléfono; 700 ms simula la demora real de la consulta.
      if (body.action === 'report') {
        await new Promise(r => setTimeout(r, 700));
        return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({
          ok: true, total: 1131,
          filas: [{ s: 'HTA69440', u: 'ALONSO, ARTURO ALONSO', t: '0351-4552272', d: 'ANDALUCIA 1936', c: 'X5014', l: 'BARRIO COLON', p: 'PSA VERO', c2: '17/04/2002', v: '17/10/2003' }]
        }) });
      }
      let serie = '';
      try { serie = String(body.serie || '').toUpperCase(); } catch (e) {}
      if (serie === 'HTA69440') {
        return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({
          ok: true, serie, encontrado: true, total: 1131,
          usuario: 'ALONSO, ARTURO ALONSO', telefono: '0351-4552272',
          domicilio: 'ANDALUCIA 1936', cp: 'X5014', localidad: 'BARRIO COLON',
          producto: 'PSA VERO', compra: '17/04/2002', vence: '17/10/2003'
        }) });
      }
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ ok: true, serie, encontrado: false, total: 1131, aviso: 'La serie no figura en tu base de garantías de PSA.' }) });
    }
    return route.fulfill({ status: 200, headers: cors, body: '[]' });
  });
  await page.route('**/tile.openstreetmap.org/**', route => route.abort());
  await page.addInitScript(() => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('appi_tarjetas_auto', '0');
    // Con cuenta PSA "conectada" no salta el popup obligatorio de PSA (v725).
    localStorage.setItem('appsi_psa_creds', JSON.stringify({ center: '02', number: '9802014', password: 'clave-de-prueba', remember: true, ts: Date.now() }));
    // Planilla de Usuarios (garantías) con N° de serie: el escáner de
    // Pendientes busca primero acá (al instante, sin internet).
    localStorage.setItem('usuarios_garantias', JSON.stringify([
      { usuario: 'GIMENEZ, CARLA', telf: '0351-555001', domicilio: 'MITRE 120', cp: 'X5000', localidad: 'CENTRO', producto: 'PSA SENIOR', serie: 'LCL12345', fVence: null, estado: 'vigente' }
    ]));
    // El tutorial de bienvenida (tutoVisto_v2) abre un modal ~1,2 s después
    // de cargar SI el login ya dio: en una máquina rápida tapa los clics del
    // test (el login del mock es casi instantáneo). Un usuario real ya lo vio.
    localStorage.setItem('tutoVisto_v2', '1');
  });
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  await page.locator('#distributorInput').fill('02-9802014');
  await page.locator('#distributorPassword').fill('Clave1234');
  await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
}

/* Genera el SVG de un QR con el generador local del repo (qr-code.js). */
async function svgQR(page, texto) {
  return page.evaluate((t) => {
    const q = qrcode(3, 'M');
    q.addData(t);
    q.make();
    return q.createSvgTag({ cellSize: 8, margin: 4 });
  }, texto);
}

/* Simula "apuntar la cámara" a un QR: dibuja el código en un canvas,
   lo decodifica con el mismo ZXing que el bucle en vivo y lo pasa a
   qrVivo (lo que haría el bucle con el frame). */
async function escanearQR(page, texto) {
  const svg = await svgQR(page, texto);
  await page.evaluate(async (svg) => {
    const c = document.createElement('canvas');
    const img = new Image();
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
    });
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    const t = window.APPIStock.decodificarFrame(d, c.width, c.height);
    if (!t) throw new Error('el QR de prueba no decodificó');
    window.APPIStock.qrVivo(t);
  }, svg);
}

test('parseQR entiende la etiqueta, delimitadores y URL', async ({ page }) => {
  await entrar(page);
  const r = await page.evaluate(() => {
    const p = window.APPIStock.parseQR;
    return {
      etiqueta: p('PSA SENIOR 4 NERO + KIT POSV. CAD09803'),
      delimitado: p('SENIOR 4 NERO | CAD09803'),
      url: p('https://tienda.example.com/equipo?producto=Senior-4&color=Nero&serie=CAD09803'),
      simple: p('Iontrix 2'),
      vacio: p(''),
      ruido: p('PSA VERO BIANCO + K. POSV. JZA31021 OF AO) AE'),
      ruidoSinColor: p('PSA VERO JZA31021 6 VASOS FILTRANTES FIPOR 3')
    };
  });
  expect(r.etiqueta).toEqual({ producto: 'PSA Senior 4 + KIT Posv', color: 'Nero', serie: 'CAD09803' });
  expect(r.delimitado).toEqual({ producto: 'Senior 4', color: 'Nero', serie: 'CAD09803' });
  expect(r.url).toEqual({ producto: 'Senior-4', color: 'Nero', serie: 'CAD09803' });
  expect(r.simple).toEqual({ producto: 'Iontrix 2', color: '', serie: '' });
  expect(r.vacio).toBeNull();
  // Ruido de otras etiquetas/caja después del color o de la serie: se descarta.
  expect(r.ruido).toEqual({ producto: 'PSA Vero + K Posv', color: 'Bianco', serie: 'JZA31021' });
  expect(r.ruidoSinColor).toEqual({ producto: 'PSA Vero', color: '', serie: 'JZA31021' });
});

test('escáner único y alargado: sin subir fotos ni botón de etiqueta', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.openStock());
  expect(await page.locator('#stQr').count()).toBe(1);
  expect(await page.locator('#stEtiqueta').count()).toBe(0);
  expect(await page.locator('#stqrCapturar').count()).toBe(0);
  expect(await page.locator('#stqrFoto').count()).toBe(0);
  expect(await page.locator('#stqrFile').count()).toBe(0);
  // En Stock el cuadro queda alargado (etiqueta completa), no el cuadradito.
  await page.evaluate(() => window.APPIStock.abrirEscan());
  expect(await page.evaluate(() => document.getElementById('stQROv').className)).not.toContain('stqr-square');
  await page.evaluate(() => window.APPIStock.cerrarEscan());
});

test('QR con datos completos: lo carga solo y suena el bip', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.openStock());
  // Espiar Web Audio: cada nota del bip crea un oscilador.
  await page.evaluate(() => {
    window.__bips = 0;
    const orig = window.AudioContext.prototype.createOscillator;
    window.AudioContext.prototype.createOscillator = function() { window.__bips++; return orig.call(this); };
  });
  await escanearQR(page, 'PSA SENIOR 4 NERO + KIT POSV. CAD09803');
  await expect(page.locator('#stockCont')).toContainText('PSA Senior 4 + KIT Posv');
  await expect(page.locator('#stockCont')).toContainText('Nero · Serie CAD09803');
  const items = await page.evaluate(() => window.APPIStock.leerStock());
  expect(items).toHaveLength(1);
  expect(items[0]).toEqual({ nombre: 'PSA Senior 4 + KIT Posv', color: 'Nero', serie: 'CAD09803', cant: 1 });
  // El bip de confirmación sonó (2 notas = 2 osciladores).
  expect(await page.evaluate(() => window.__bips)).toBeGreaterThanOrEqual(2);
});

test('escanear dos veces la misma caja no duplica la serie', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.openStock());
  await escanearQR(page, 'SENIOR 4 NERO | CAD09803');
  await expect(page.locator('#stockCont')).toContainText('Serie CAD09803');
  // segunda vez: mismo código
  await escanearQR(page, 'SENIOR 4 NERO | CAD09803');
  await expect(page.locator('#appiDialogTitle')).toHaveText('Serie repetida');
  await expect(page.locator('#appiDialogMessage')).toContainText('ya está en tu stock');
  await page.locator('#appiDialogOk').click();
  const items = await page.evaluate(() => window.APPIStock.leerStock());
  expect(items).toHaveLength(1);
  expect(items[0].cant).toBe(1);
});

test('lectura en vivo: QR da la serie + OCR da nombre y color → carga al toque', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.openStock());
  // Simula el bucle en vivo: el QR (serie) y UNA pasada del texto.
  // La lectura es completa (nombre + color + serie): carga sin esperar
  // confirmaciones (v737 "super rapido").
  await page.evaluate(() => {
    const e = window.APPIStock;
    e.qrVivo('JZA31021');
    e.evaluarLectura({ producto: 'PSA Vero', color: 'Bianco', serie: '' }, 80);
  });
  await expect(page.locator('#stockCont')).toContainText('PSA Vero');
  await expect(page.locator('#stockCont')).toContainText('Serie JZA31021');
  const items = await page.evaluate(() => window.APPIStock.leerStock());
  expect(items).toHaveLength(1);
  expect(items[0]).toEqual({ nombre: 'PSA Vero', color: 'Bianco', serie: 'JZA31021', cant: 1 });
});

test('lectura en vivo sin serie legible: pide la serie una vez', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.openStock());
  await page.evaluate(() => {
    const e = window.APPIStock;
    e.evaluarLectura({ producto: 'PSA Vero', color: 'Bianco', serie: '' }, 80);
    e.evaluarLectura({ producto: 'PSA Vero', color: 'Bianco', serie: '' }, 80);
  });
  await expect(page.locator('#appiDialogTitle')).toHaveText('Falta la serie');
  await page.locator('#appiDialogInput').fill('JZA31021');
  await page.locator('#appiDialogOk').click();
  await expect(page.locator('#stockCont')).toContainText('Serie JZA31021');
  const items = await page.evaluate(() => window.APPIStock.leerStock());
  expect(items).toHaveLength(1);
  expect(items[0].serie).toBe('JZA31021');
});

test('el OCR local lee una etiqueta sintética (motor Tesseract fijo)', async ({ page }) => {
  await entrar(page);
  // Etiqueta sintética con el mismo formato que la real (texto impreso +
  // QR de la serie). El OCR debe leer nombre y color del texto.
  const r = await page.evaluate(async () => {
    const c = document.createElement('canvas');
    c.width = 960; c.height = 420;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#f5efe0';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#1c1c1e';
    ctx.font = 'bold 72px Arial';
    ctx.fillText('PSA VERO BIANCO +', 40, 170);
    ctx.fillText('K. POSV. JZA31021', 40, 320);
    const res = await window.APPIStock.ocrCanvas(c, 0);
    return res;
  });
  expect(r.parsed.color).toBe('Bianco');
  expect(r.parsed.producto).toContain('PSA Vero');
});

test('prestar y devolver una unidad con serie la vuelve a su fila', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.openStock());
  await escanearQR(page, 'SENIOR 4 NERO | CAD09803');
  await expect(page.locator('#stockCont')).toContainText('Serie CAD09803');
  // prestar la unidad
  await page.locator('[data-st-prestar="0"]').click();
  await expect(page.locator('#stSheet')).toContainText('¿A quién se lo prestás?');
  await page.locator('#stQuien').fill('Laura Gómez');
  await page.locator('#stTel').fill('3515551234');
  await page.locator('#stSavePrestamo').click();
  // queda prestada: la fila no aparece en el stock
  await expect(page.locator('#stockCont')).not.toContainText('Serie CAD09803');
  // devolver
  await page.locator('[data-st-dev]').first().click();
  await expect(page.locator('#stockCont')).toContainText('Serie CAD09803');
  const items = await page.evaluate(() => window.APPIStock.leerStock());
  expect(items).toHaveLength(1);
  expect(items[0]).toMatchObject({ nombre: 'Senior 4', serie: 'CAD09803', cant: 1 });
  const sinSerie = await page.evaluate(() => window.APPIStock.leerStock().filter(i => !i.serie));
  expect(sinSerie).toHaveLength(0);
});

test('alta manual con color: se suma por producto Y color', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.openStock());
  await page.locator('#stNombre').fill('PSA Vero');
  await page.locator('#stColor').fill('nero');
  await page.locator('#stAdd').click();
  await page.locator('#stNombre').fill('PSA Vero');
  await page.locator('#stColor').fill('NERO');
  await page.locator('#stCant').fill('2');
  await page.locator('#stAdd').click();
  // Mismo producto + mismo color: una sola fila, cant 1 + 2 = 3.
  await page.locator('#stNombre').fill('PSA Vero');
  await page.locator('#stColor').fill('Bianco');
  await page.locator('#stAdd').click();
  // Mismo producto con otro color: otra fila.
  const items = await page.evaluate(() => window.APPIStock.leerStock());
  expect(items).toHaveLength(2);
  expect(items.find(i => i.color === 'Nero')).toEqual({ nombre: 'PSA Vero', color: 'Nero', serie: '', cant: 3 });
  expect(items.find(i => i.color === 'Bianco')).toEqual({ nombre: 'PSA Vero', color: 'Bianco', serie: '', cant: 1 });
});

test('alta manual con serie: fila propia y no duplica la serie', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.openStock());
  await page.locator('#stNombre').fill('Senior 4');
  await page.locator('#stColor').fill('negro');
  await page.locator('#stSerie').fill('cad09803');
  await page.locator('#stAdd').click();
  await expect(page.locator('#stockCont')).toContainText('Serie CAD09803');
  let items = await page.evaluate(() => window.APPIStock.leerStock());
  expect(items).toHaveLength(1);
  expect(items[0]).toEqual({ nombre: 'Senior 4', color: 'Nero', serie: 'CAD09803', cant: 1 });
  // la misma serie de nuevo → avisa y no duplica
  await page.locator('#stNombre').fill('Senior 4');
  await page.locator('#stSerie').fill('CAD09803');
  await page.locator('#stAdd').click();
  await expect(page.locator('#appiDialogTitle')).toHaveText('Serie repetida');
  await page.locator('#appiDialogOk').click();
  items = await page.evaluate(() => window.APPIStock.leerStock());
  expect(items).toHaveLength(1);
  expect(items[0].cant).toBe(1);
});

test('el alta manual sigue sin serie y no se mezcla con la escaneada', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.openStock());
  await page.locator('#stNombre').fill('Iontrix 2');
  await page.locator('#stAdd').click();
  let items = await page.evaluate(() => window.APPIStock.leerStock());
  expect(items).toHaveLength(1);
  expect(items[0]).toEqual({ nombre: 'Iontrix 2', color: '', serie: '', cant: 1 });
  // escanear una caja del mismo nombre no se suma a la fila manual
  await escanearQR(page, 'IONTRIX 2 NERO | CAD55667');
  items = await page.evaluate(() => window.APPIStock.leerStock());
  expect(items).toHaveLength(2);
  const qr = items.find(i => i.serie);
  expect(qr).toMatchObject({ nombre: 'Iontrix 2', color: 'Nero', serie: 'CAD55667', cant: 1 });
  const manual = items.find(i => !i.serie);
  expect(manual).toEqual({ nombre: 'Iontrix 2', color: '', serie: '', cant: 1 });
});

/* v741 · El escáner lee "de memoria": contrasta el OCR contra el
   catálogo oficial de PSA (psa-catalogo.json, la lista de precios de la
   tienda). Con la referencia, una sola pasada basta y el nombre que se
   escribe es el oficial. */

test('catálogo oficial: el match corrige el ruido del OCR y no inventa variantes', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.openStock());
  const r = await page.evaluate(async () => {
    const cat = await window.APPIStock.cargarCatalogo();
    const m = window.APPIStock.matchCatalogo;
    return {
      n: cat.length,
      limpio: m('PSA VERO BIANCO + K. POSV. JZA31021'),
      ruido: m('PSA VER0 B1ANCO + K POSV JZA31021 OF AO) AE'),
      sinCuatro: m('PSA SENIOR NER0'),
      senior: m('PSA SENIOR BIANCO'),
      s1000: m('PSA S1000 2 SM BIANCO'),
      nada: m('HELADO DE FRUTILLA'),
      inexistente: m('PSA VERO NERO')
    };
  });
  expect(r.n).toBeGreaterThanOrEqual(300);
  expect(r.limpio).toMatchObject({ nombre: 'PSA VERO', color: 'Bianco', ambiguo: false });
  // Ruido típico de OCR (0 por o, 1 por l, palabras sueltas): mismo resultado.
  expect(r.ruido).toMatchObject({ nombre: 'PSA VERO', color: 'Bianco', ambiguo: false });
  // El "4" se perdió en la lectura: el catálogo lo restaura (no existe Senior-Nero).
  expect(r.sinCuatro).toMatchObject({ nombre: 'PSA SENIOR 4', color: 'Nero', ambiguo: false });
  expect(r.senior).toMatchObject({ nombre: 'PSA SENIOR', color: 'Bianco', ambiguo: false });
  expect(r.s1000).toMatchObject({ nombre: 'PSA S-1000 2 SM', color: 'Bianco', ambiguo: false });
  // Sin coincidencia clara → null (no inventa): cae a la lectura estructural.
  expect(r.nada).toBeNull();
  expect(r.inexistente).toBeNull();
});

test('lectura en vivo con catálogo: una pasada de texto ruidosa + serie → carga al toque', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.openStock());
  await page.evaluate(async () => { await window.APPIStock.cargarCatalogo(); });
  await page.evaluate(() => {
    const e = window.APPIStock;
    // El QR aparece primero (la serie), y UNA pasada de OCR con ruido real.
    e.qrVivo('JZB99999');
    e.evaluarLectura(e.parseQR('PSA VER0 B1ANCO + K POSV'), 70, 'PSA VER0 B1ANCO + K POSV');
  });
  await expect(page.locator('#stockCont')).toContainText('PSA VERO');
  await expect(page.locator('#stockCont')).toContainText('Bianco · Serie JZB99999');
  const items = await page.evaluate(() => window.APPIStock.leerStock());
  expect(items).toHaveLength(1);
  expect(items[0]).toEqual({ nombre: 'PSA VERO', color: 'Bianco', serie: 'JZB99999', cant: 1 });
});

test('catálogo salva una lectura que la estructura rechazaría (sin segunda pasada)', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.openStock());
  await page.evaluate(async () => { await window.APPIStock.cargarCatalogo(); });
  await page.evaluate(() => {
    const e = window.APPIStock;
    // "NER0" (cero): parseQR no encuentra el color → score 54 < 60 → la
    // lectura estructural la descarta y probaría otra orientación. El
    // catálogo la reconoce y queda lista para la serie.
    e.evaluarLectura(e.parseQR('PSA SENIOR NER0'), 40, 'PSA SENIOR NER0');
    e.qrVivo('CAD12345');
  });
  await expect(page.locator('#stockCont')).toContainText('PSA SENIOR 4');
  await expect(page.locator('#stockCont')).toContainText('Nero · Serie CAD12345');
  const items = await page.evaluate(() => window.APPIStock.leerStock());
  expect(items).toHaveLength(1);
  expect(items[0]).toEqual({ nombre: 'PSA SENIOR 4', color: 'Nero', serie: 'CAD12345', cant: 1 });
});

test('el PRODUCTO manual sugiere los nombres del catálogo', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.openStock());
  await page.evaluate(async () => { await window.APPIStock.cargarCatalogo(); });
  await page.waitForFunction(() => {
    const d = document.getElementById('stCatDl');
    return d && d.options.length >= 60;
  });
  const input = await page.locator('#stNombre').getAttribute('list');
  expect(input).toBe('stCatDl');
});

/* v744 · La lista "Precios Sugeridos con Acuerdo" imprime "Plan canje"
   como sublínea del producto, con su propio precio en la primera
   columna. En la Lista de precios esas sublíneas figuran como línea
   propia (buscá "canje"), con el precio de canje, para poder cotizar
   con canje o sin canje. */
test('lista de precios: plan canje figura como línea propia con su precio', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.abrirLista());
  const items = page.locator('#lpList .lp-item');
  await expect(items.first()).toBeVisible({ timeout: 15000 });
  const total = await items.count();
  // 312 productos + 21 sublíneas canje del PDF.
  expect(total).toBe(333);
  await page.locator('#lpSearch').fill('canje');
  const canjes = page.locator('#lpList .lp-item');
  await expect(canjes.first()).toContainText('PLAN CANJE');
  expect(await canjes.count()).toBe(21);
  // La sublínea del Senior 4 Bianco cotiza al precio de canje.
  const senior4 = canjes.filter({ hasText: 'PSA SENIOR 4 BIANCO + KIT POSV. (PLAN CANJE)' }).first();
  await expect(senior4).toContainText('$855.000');
  await senior4.locator('[data-act="mas"]').click();
  await expect(page.locator('#lpFab')).toContainText('$855.000');
});

/* v745 · Tocar un producto cargado en Mi Stock abre el editor: se
   corrigen nombre, color, serie y cantidad. Una serie ya cargada no
   puede repetirse en otra fila (cada serie es un equipo). */
test('mi stock: tocar una fila abre el editor y corrige los datos', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.openStock());
  await page.locator('#stNombre').fill('PSA Vero');
  await page.locator('#stSerie').fill('jza31021');
  await page.locator('#stAdd').click();
  const fila = page.locator('#stockCont .st-row').first();
  await expect(fila).toContainText('Serie JZA31021');
  await fila.locator('.st-name').click();
  await expect(page.locator('#stEdNombre')).toBeVisible();
  expect(await page.locator('#stEdNombre').inputValue()).toBe('PSA Vero');
  expect(await page.locator('#stEdSerie').inputValue()).toBe('JZA31021');
  await page.locator('#stEdNombre').fill('PSA Vero Kit');
  await page.locator('#stEdColor').fill('bianco');
  await page.locator('#stEdCant').fill('3');
  await page.locator('#stSaveEdit').click();
  const items = await page.evaluate(() => window.APPIStock.leerStock());
  expect(items).toHaveLength(1);
  expect(items[0]).toMatchObject({ nombre: 'PSA Vero Kit', color: 'Bianco', serie: 'JZA31021', cant: 3 });
  await expect(page.locator('#stockCont')).toContainText('PSA Vero Kit');
});

test('mi stock: el editor no deja una serie repetida', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.openStock());
  await page.locator('#stNombre').fill('PSA Vero');
  await page.locator('#stSerie').fill('AAA1111');
  await page.locator('#stAdd').click();
  await page.locator('#stNombre').fill('PSA Senior');
  await page.locator('#stSerie').fill('BBB2222');
  await page.locator('#stAdd').click();
  const filas = page.locator('#stockCont .st-row');
  expect(await filas.count()).toBe(2);
  await filas.nth(1).locator('.st-name').click();
  await page.locator('#stEdSerie').fill('aaa1111');
  await page.locator('#stSaveEdit').click();
  await expect(page.locator('#appiDialogTitle')).toHaveText('Serie repetida');
  await page.locator('#appiDialogOk').click();
  const stock = await page.evaluate(() => window.APPIStock.leerStock());
  expect(stock).toHaveLength(2);
  expect(stock[1].serie).toBe('BBB2222');
});

/* v746 · PENDIENTES DE CANJE: los equipos viejos que nos quedamos al
   hacer un plan canje y hay que entregar a la empresa. El QR de la BASE
   del purificador trae el N° de serie; la app lo consulta en la base de
   PSA (función consulta-serial → reporte de Garantías) y carga sola a
   quién pertenecía. ENTREGADO baja la fila. En los tres tabs las filas
   van agrupadas por producto (todos los Senior juntos, etc.). */
test.use({ viewport: { width: 390, height: 844 } });
test('pendientes: escanear la base del equipo viejo lo carga solo con el dueño', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.openStock());
  await page.locator('[data-st-tab="pendientes"]').click();
  await expect(page.locator('#stockCont')).toContainText('Pendientes de canje');
  await page.evaluate(() => window.APPIStock.abrirEscan());
  // En Pendientes el cuadro vuelve a ser el cuadradito de siempre.
  expect(await page.evaluate(() => document.getElementById('stQROv').className)).toContain('stqr-square');
  await escanearQR(page, 'HTA69440');
  // Lupa: "el teléfono está pensando" (lente sobre ficheros) mientras
  // busca la serie en la base, y check verde cuando la encuentra.
  await expect(page.locator('.lupa-ov')).toBeVisible();
  await expect(page.locator('.lupa-ov .lupa-serie')).toHaveText('HTA69440');
  await expect(page.locator('.lupa-ov')).toHaveClass(/ok/);
  const fila = page.locator('#stockCont .st-row');
  await expect(fila).toContainText('PSA Vero');
  await expect(fila).toContainText('ALONSO, ARTURO ALONSO');
  await expect(fila).toContainText('Serie HTA69440');
  await expect(fila).toContainText('0351-4552272');
  const items = await page.evaluate(() => window.APPIStock.leerPendientes());
  expect(items).toHaveLength(1);
  expect(items[0]).toMatchObject({ serie: 'HTA69440', producto: 'PSA Vero', quien: 'ALONSO, ARTURO ALONSO', telefono: '0351-4552272' });
});

test.use({ viewport: { width: 390, height: 844 } });
test('pendientes: la misma serie no se duplica y ENTREGADO baja la fila', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.openStock());
  await page.locator('[data-st-tab="pendientes"]').click();
  await page.evaluate(() => window.APPIStock.abrirEscan());
  await escanearQR(page, 'HTA69440');
  await expect(page.locator('#stockCont .st-row')).toHaveCount(1);
  // Volver a escanear la misma serie: avisa y no se duplica.
  await page.evaluate(() => window.APPIStock.abrirEscan());
  await escanearQR(page, 'HTA69440');
  await expect(page.locator('#stockCont .st-row')).toHaveCount(1);
  // Marcar entregado → confirma → se elimina.
  await page.locator('[data-st-entregado]').click();
  await expect(page.locator('#appiDialogTitle')).toHaveText('Marcar entregado');
  await page.locator('#appiDialogOk').click();
  await expect(page.locator('#stockCont .st-row')).toHaveCount(0);
  expect(await page.evaluate(() => window.APPIStock.leerPendientes())).toHaveLength(0);
});

test.use({ viewport: { width: 390, height: 844 } });
test('pendientes: serie que está en la planilla del teléfono carga al instante (sin internet)', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.openStock());
  await page.locator('[data-st-tab="pendientes"]').click();
  await page.evaluate(() => window.APPIStock.abrirEscan());
  await escanearQR(page, 'LCL12345');
  // LCL12345 solo existe en la base del teléfono (no en el mock de PSA):
  // si apareció con estos datos, la búsqueda local ganó y fue al instante.
  const fila = page.locator('#stockCont .st-row');
  await expect(fila).toContainText('PSA Senior');
  await expect(fila).toContainText('De: GIMENEZ, CARLA');
  await expect(fila).toContainText('Serie LCL12345');
  await expect(fila).toContainText('0351-555001');
  expect(await page.locator('.lupa-ov').count()).toBe(0);
  const items = await page.evaluate(() => window.APPIStock.leerPendientes());
  expect(items).toHaveLength(1);
  expect(items[0]).toMatchObject({ serie: 'LCL12345', producto: 'PSA Senior', quien: 'GIMENEZ, CARLA' });
});

test('pendientes: serie no encontrada se guarda sin datos y se completa después', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.openStock());
  await page.locator('[data-st-tab="pendientes"]').click();
  await page.locator('#stPSerieBuscar').fill('ZZZ9999');
  await page.locator('#stPBuscar').click();
  await expect(page.locator('#appiDialogTitle')).toHaveText('Consulta PSA');
  await page.locator('#appiDialogOk').click();
  await expect(page.locator('#stPSerie')).toBeVisible();
  expect(await page.locator('#stPSerie').inputValue()).toBe('ZZZ9999');
  // Se guarda SOLO con la serie (sin producto ni dueño): igual queda anotado.
  await page.locator('#stSaveP').click();
  const fila = page.locator('#stockCont .st-row');
  await expect(fila).toHaveCount(1);
  await expect(fila).toContainText('Equipo canje');
  await expect(fila).toContainText('Serie ZZZ9999');
  expect(await page.evaluate(() => window.APPIStock.leerPendientes())).toHaveLength(1);
  // Más tarde, cuando se habló con la empresa: tocar la fila y completar.
  await fila.click();
  await page.locator('#stPProducto').fill('PSA Senior');
  await page.locator('#stPQuien').fill('PEREZ, LUJAN');
  await page.locator('#stSaveP').click();
  await expect(fila).toContainText('PSA Senior');
  await expect(fila).toContainText('De: PEREZ, LUJAN');
  const items = await page.evaluate(() => window.APPIStock.leerPendientes());
  expect(items).toHaveLength(1);
  expect(items[0]).toMatchObject({ serie: 'ZZZ9999', producto: 'PSA Senior', quien: 'PEREZ, LUJAN' });
});

test('stock: las filas se agrupan por producto, luego color y serie', async ({ page }) => {
  await entrar(page);
  await page.evaluate(() => window.openStock());
  await page.locator('#stNombre').fill('PSA Vero');
  await page.locator('#stAdd').click();
  await page.locator('#stNombre').fill('PSA Senior 4');
  await page.locator('#stColor').fill('negro');
  await page.locator('#stAdd').click();
  await page.locator('#stNombre').fill('PSA Senior 4');
  await page.locator('#stColor').fill('bianco');
  await page.locator('#stAdd').click();
  const filas = page.locator('#stockCont .st-row');
  expect(await filas.count()).toBe(3);
  // Senior 4 (Bianco) y (Nero) van juntos, antes que Vero: S < V alfabético.
  await expect(filas.nth(0)).toContainText('PSA Senior 4');
  await expect(filas.nth(0)).toContainText('Bianco');
  await expect(filas.nth(1)).toContainText('PSA Senior 4');
  await expect(filas.nth(1)).toContainText('Nero');
  await expect(filas.nth(2)).toContainText('PSA Vero');
});
