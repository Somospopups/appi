const { test, expect } = require('@playwright/test');
const { entrar } = require('./helpers/app-entrar.js');

async function abrirMargarita(page) {
  await entrar(page);
  await page.evaluate(() => window.openMargarita());
  await expect(page.locator('#view-margarita')).toHaveClass(/active/);
  await expect(page.locator('#margaritaCont')).toContainText('Tu margarita de contactos');
}

test('Mi Margarita vive en Mi negocio, tiene ocho pétalos centrados y recuerda contactos', async ({ page }) => {
  await abrirMargarita(page);

  const petalos = page.locator('[data-mg-group]');
  await expect(petalos).toHaveCount(8);
  await expect(page.locator('.mg-stem')).toBeVisible();
  await expect(page.locator('.mg-leaf-l')).toBeVisible();
  await expect(page.locator('.mg-leaf-r')).toBeVisible();
  await expect(petalos.nth(0)).toContainText('Amigos');
  await expect(petalos.nth(7)).toContainText(/Clientes\s*PSA/);

  // Las etiquetas se leen como títulos normales, ubicados en la parte ancha
  // de cada pétalo: no se parte una palabra por línea ni se usan tonos tenues.
  const textosPetalos = await page.locator('.mg-petal-content b').evaluateAll(nodes => nodes.map(node => {
    const s = getComputedStyle(node);
    return { text: node.textContent.trim(), breaks: node.querySelectorAll('br').length, fontSize: s.fontSize, color: s.color };
  }));
  expect(textosPetalos).toHaveLength(8);
  textosPetalos.forEach(item => {
    expect(item.text.length).toBeGreaterThan(0);
    expect(item.breaks).toBe(0);
    expect(Number.parseFloat(item.fontSize)).toBeGreaterThanOrEqual(11.5);
    expect(item.color).toBe('rgb(21, 63, 82)');
  });

  // La vista no impone otro color de página: deja visible el fondo propio de
  // APPI, mientras la tarjeta usa un cielo suave que contrasta los pétalos.
  const fondos = await page.evaluate(() => ({
    view: getComputedStyle(document.querySelector('#view-margarita')).backgroundImage,
    garden: getComputedStyle(document.querySelector('.mg-garden')).backgroundImage
  }));
  expect(fondos.view).toBe('none');
  expect(fondos.garden).toContain('radial-gradient');

  await expect(page.locator('#margaritaCont')).toContainText('Demostración');
  await expect(page.locator('#margaritaCont')).toContainText('Presentación de negocio');
  await expect(page.locator('#margaritaCont')).toContainText('Pedir un referido');

  // Los ocho pétalos parten alineados desde el borde del círculo central,
  // sin cruzarlo; el contenido se conserva derecho con --counter.
  const geometria = await page.locator('[data-mg-group]').evaluateAll(nodes => nodes.map(node => {
    const style = getComputedStyle(node);
    return { origin: style.transformOrigin, angle: node.style.getPropertyValue('--angle'), counter: node.style.getPropertyValue('--counter'), outset: node.style.getPropertyValue('--petal-outset') };
  }));
  expect(geometria).toHaveLength(8);
  geometria.forEach((p, i) => {
    expect(p.origin).toMatch(/60px 208px/);
    expect(p.angle).toBe(`${i * 45}deg`);
    expect(p.counter).toBe(`-${i * 45}deg`);
    expect(p.outset).toBe('-78px');
  });

  // Los 8 pétalos tienen que ABRIRSE en círculo (una margarita), no
  // apilarse todos para el mismo lado. Cada uno ocupa un ángulo distinto.
  const cajas = await page.locator('[data-mg-group]').evaluateAll(nodes => nodes.map(n => {
    const r = n.getBoundingClientRect();
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
  }));
  const flower = await page.locator('.mg-flower').evaluate(n => {
    const r = n.getBoundingClientRect();
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
  });
  const angulos = cajas.map(c => {
    const a = Math.atan2(c.cy - flower.cy, c.cx - flower.cx) * 180 / Math.PI;
    return Math.round(((a + 360) % 360) / 45) * 45 % 360;
  });
  expect(new Set(angulos).size).toBe(8);

  await page.evaluate(() => {
    const estado = window.APPIMargarita.cargar();
    estado.nombre = 'María';
    estado.contactos.amigos = [{ id: 'laura-351', nombre: 'Laura Gómez', telefono: '3515551234' }];
    window.APPIMargarita.guardar(estado);
    window.APPIMargarita.render();
  });
  await expect(page.locator('.mg-center')).toContainText('María');
  await expect(page.locator('[data-mg-group="amigos"]')).toContainText('1 persona');

  const seSincroniza = await page.evaluate(() => window.APPIDataSync.isDataKey('appi_margarita_contactos_v1_' + window.APPIAuth.userId()));
  expect(seSincroniza).toBe(true);
});

test('en móvil mantiene la flor centrada y abre un pétalo al tocarlo', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await abrirMargarita(page);
  await expect(page.locator('.mg-stage')).toBeVisible();
  await expect(page.locator('[data-mg-group="amigos"]')).toBeVisible();

  // Android puede informar safe-area 0 aun con la barra de estado superpuesta:
  // la cabecera no debe superponerse a los pétalos y el pie no debe tapar Familia.
  const movil = await page.evaluate(() => {
    const app = document.querySelector('.app').getBoundingClientRect();
    const header = document.querySelector('#view-margarita > header.top').getBoundingClientRect();
    const stage = document.querySelector('.mg-stage').getBoundingClientRect();
    const family = document.querySelector('[data-mg-group="familia"]').getBoundingClientRect();
    const foot = document.querySelector('.mg-garden-foot').getBoundingClientRect();
    return {
      headerBottomRel: header.bottom - app.top,
      stageTopRel: stage.top - app.top,
      familyBottom: family.bottom,
      footTop: foot.top
    };
  });
  expect(movil.stageTopRel).toBeGreaterThanOrEqual(movil.headerBottomRel);
  expect(movil.footTop).toBeGreaterThanOrEqual(movil.familyBottom);

  await page.locator('[data-mg-group="amigos"] .mg-petal-content').click();
  await expect(page.locator('#mgSheet')).toContainText('Elegí personas para este pétalo');
});

test('los pétalos y el nombre del centro se pueden editar sin diálogos nativos', async ({ page }) => {
  await abrirMargarita(page);

  await page.locator('#mgEditGroups').click();
  await expect(page.locator('#mgSheet')).toContainText('Editar pétalos');
  await page.locator('[data-mg-label="amigos"]').fill('Círculo cercano');
  await page.locator('[data-mg-icon="amigos"]').selectOption({ label: '☕' });
  await page.locator('#mgSaveEdit').click();
  await expect(page.locator('[data-mg-group="amigos"]')).toContainText(/Círculo\s*cercano/);
  await expect(page.locator('[data-mg-group="amigos"]')).toContainText('☕');

  await page.evaluate(() => { window.APPIDialog.prompt = () => Promise.resolve('Sofía'); });
  await page.locator('#mgEditName').click();
  await expect(page.locator('.mg-center')).toContainText('Sofía');
});

test('el pétalo vacío abre la hoja y "Elegir del teléfono" trae los contactos al pétalo', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'contacts', {
      configurable: true,
      value: { getProperties: async () => ['name', 'tel'], select: async () => [{ name: ['Lucía Contacto'], tel: ['3515557788'] }] }
    });
  });
  await abrirMargarita(page);

  // El pétalo abre la hoja (nunca dispara el picker del sistema solo); el
  // Contact Picker vive dentro de la hoja como una opción más.
  await page.locator('[data-mg-group="amigos"] .mg-petal-content').click();
  await expect(page.locator('#mgSheet')).toContainText('Elegí personas para este pétalo');
  await expect(page.locator('#mgPhone')).toBeVisible();

  await page.locator('#mgPhone').click();
  await expect(page.locator('#mgCandidateList')).toContainText('Lucía Contacto');
  await page.locator('#mgSavePick').click();
  await expect(page.locator('[data-mg-group="amigos"]')).toContainText('1 persona');

  const guardado = await page.evaluate(() => window.APPIMargarita.cargar().contactos.amigos);
  expect(guardado).toEqual(expect.arrayContaining([expect.objectContaining({ nombre: 'Lucía Contacto', telefono: '3515557788' })]));
});

test('"Subir agenda" mete una agenda .vcf entera en el pétalo', async ({ page }) => {
  await abrirMargarita(page);

  await page.locator('[data-mg-group="amigos"] .mg-petal-content').click();
  await expect(page.locator('#mgSheet')).toContainText('Elegí personas para este pétalo');
  await expect(page.locator('#mgSubirAgenda')).toBeVisible();

  // Una agenda exportada (Android/iCloud). Las personas sin teléfono válido
  // también entran: siguen siendo gente del círculo del distribuidor.
  const vcf = [
    'BEGIN:VCARD', 'VERSION:3.0', 'FN:Rodrigo García', 'TEL;TYPE=CELL:3515553333', 'END:VCARD',
    'BEGIN:VCARD', 'VERSION:3.0', 'FN:Martina Ruiz', 'TEL;TYPE=CELL:3515554444', 'END:VCARD',
    'BEGIN:VCARD', 'VERSION:3.0', 'FN:Perro Sin Tel', 'TEL;TYPE=HOME:', 'END:VCARD'
  ].join('\r\n');
  await page.setInputFiles('#mgVcfInput', { name: 'agenda.vcf', mimeType: 'text/vcard', buffer: Buffer.from(vcf, 'utf8') });

  await expect(page.locator('#mgCandidateList')).toContainText('Rodrigo García');
  await expect(page.locator('#mgCandidateList')).toContainText('Martina Ruiz');
  await page.locator('#mgSavePick').click();
  await expect(page.locator('[data-mg-group="amigos"]')).toContainText('3 personas');

  const guardado = await page.evaluate(() => window.APPIMargarita.cargar().contactos.amigos);
  expect(guardado).toHaveLength(3);
  expect(guardado).toEqual(expect.arrayContaining([
    expect.objectContaining({ nombre: 'Rodrigo García', telefono: '3515553333' }),
    expect.objectContaining({ nombre: 'Martina Ruiz', telefono: '3515554444' })
  ]));
});

test('si el Contact Picker falla, la hoja sigue viva sin carteles ni guías de configuración', async ({ page }) => {
  let dialogos = 0;
  page.on('dialog', async function(d){ dialogos++; await d.dismiss(); });
  await page.addInitScript(() => {
    window.__mgPickerIntentos = [];
    Object.defineProperty(navigator, 'contacts', {
      configurable: true,
      value: {
        select: async () => {
          window.__mgPickerIntentos.push(1);
          const err = new Error('Contact picker not supported');
          err.name = 'NotSupportedError';
          throw err;
        }
      }
    });
  });
  await abrirMargarita(page);

  // El botón del teléfono está dentro de la hoja; al fallar (Chromium de
  // fabricante, contexto no top-level), la hoja se queda ahí: ni alert nativo,
  // ni modal de APPI, ni texto que pida permisos o configurar el dispositivo.
  await page.locator('[data-mg-group="amigos"] .mg-petal-content').click();
  await expect(page.locator('#mgSheet')).toContainText('Elegí personas para este pétalo');
  await expect(page.locator('#mgSubirAgenda')).toBeVisible();
  await expect(page.locator('#mgCandidateList')).toContainText('Todavía no hay personas para mostrar');

  await page.locator('#mgPhone').click();
  await expect(page.locator('#mgSheet')).toContainText('Elegí personas para este pétalo');
  await expect(page.locator('#mgSubirAgenda')).toBeVisible();
  await expect(page.locator('#mgCandidateList')).toContainText('Todavía no hay personas para mostrar');

  const sinCartel = await page.evaluate(() => {
    const overlay = document.querySelector('.appi-dialog-overlay');
    return { modalVisible: !!overlay && !overlay.hasAttribute('hidden'), pickerIntentos: window.__mgPickerIntentos.length };
  });
  expect(sinCartel.modalVisible).toBe(false);
  expect(dialogos).toBe(0);
  expect(sinCartel.pickerIntentos).toBe(3);

  const texto = await page.locator('#mgSheet').innerText();
  expect(texto).not.toMatch(/permiso|ajustes|configura|permitir|puntitos|chrome/i);
});

test('sin Contact Picker la hoja lista las personas de APPI y permite elegir en el pétalo', async ({ page }) => {
  await abrirMargarita(page);

  // El Panel de Contactos (Mi Gestión) alimenta la hoja: se intercepta la
  // red para que cualquier refresco posterior de la sync devuelva el mismo
  // contacto, en vez de vaciar la lista a mitad de prueba.
  const contacto = {
    id: 'c-ana', nombre: 'Ana Panel', telefono: '3515550001',
    telefono_normalizado: '3515550001', estado: 'nuevo', tipo: 'encuestado',
    user_id: '11111111-1111-4111-8111-111111111113',
    created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  };
  await page.route('https://mock.supabase.co/rest/v1/appi_gestion_contactos*', route => route.fulfill({
    status: 200,
    headers: { 'access-control-allow-origin': '*', 'content-type': 'application/json' },
    body: JSON.stringify([contacto])
  }));
  await page.evaluate((persona) => {
    const g = window.APPIGestion && window.APPIGestion.state;
    if (g) { g.contacts = [persona]; g.lastLoaded = Date.now(); }
  }, contacto);

  await page.locator('[data-mg-group="amigos"] .mg-petal-content').click();
  await expect(page.locator('#mgSheet')).toContainText('Elegí personas para este pétalo');
  await expect(page.locator('#mgCandidateList')).toContainText('Ana Panel');
  await expect(page.locator('#mgCandidateList')).toContainText('Panel APPI');

  await page.locator('[data-mg-key]').first().click();
  await page.locator('#mgSavePick').click();
  await expect(page.locator('[data-mg-group="amigos"]')).toContainText('1 persona');

  const guardado = await page.evaluate(() => window.APPIMargarita.cargar().contactos.amigos);
  expect(guardado).toEqual(expect.arrayContaining([expect.objectContaining({ nombre: 'Ana Panel' })]));
});
