const { test, expect } = require('@playwright/test');

/* Los números de WhatsApp se arman en un solo lugar: telefono.js.
   Antes había seis versiones distintas y varias mandaban a WhatsApp
   números que no existen (sobre todo Buenos Aires y las áreas de 4
   dígitos, donde el 15 no está en la misma posición que en Córdoba). */

async function cargar(page){
  await page.goto('/telefono.js');
  const codigo = await page.evaluate(() => document.body.innerText);
  await page.goto('about:blank');
  await page.evaluate(src => { eval(src); }, codigo);
}

test.describe('APPITel · armado de números argentinos', () => {
  test.beforeEach(async ({ page }) => { await cargar(page); });

  const validos = [
    ['Córdoba plano',                  '3517669967',            '5493517669967'],
    ['Córdoba con 0 y 15',             '0351 15-766-9967',      '5493517669967'],
    ['Córdoba con 15 sin 0',           '351 15 766 9967',       '5493517669967'],
    ['Córdoba internacional',          '+54 9 351 766 9967',    '5493517669967'],
    ['Córdoba internacional con 15',   '+54 9 351 15 766 9967', '5493517669967'],
    ['Córdoba sin el 9',               '54 351 766 9967',       '5493517669967'],
    ['Córdoba con 0054',               '0054 9 3517669967',     '5493517669967'],
    ['Córdoba fijo (planilla real)',   '0351-4552272',          '5493514552272'],
    ['Buenos Aires con 0 y 15',        '011 15-4766-9967',      '5491147669967'],
    ['Buenos Aires plano',             '1147669967',            '5491147669967'],
    ['Buenos Aires internacional',     '+5491147669967',        '5491147669967'],
    ['Carlos Paz (área de 4) con 15',  '03541 15-44-4444',      '5493541444444'],
    ['Carlos Paz plano',               '3541444444',            '5493541444444'],
    ['Bell Ville (área de 4) con 15',  '03537 15-41-2345',      '5493537412345'],
    ['Jesús María (área de 4) con 15', '03525 15-44-5566',      '5493525445566'],
    ['Villa María con 15',             '0353 15-456-7890',      '5493534567890'],
    ['Río Cuarto con 15',              '0358 15-412-3456',      '5493584123456'],
    ['Rosario con 15',                 '0341 15-666-7777',      '5493416667777'],
    ['Mendoza con 15',                 '0261 15-444-5555',      '5492614445555'],
    ['Rawson/Trelew (área 280)',       '0280 434-2644',         '5492804342644'],
    ['Rawson/Trelew con 15',           '0280 15-434-2644',      '5492804342644'],
    ['con texto alrededor',            'Tel: 351-766-9967 (cel)','5493517669967'],
  ];

  for (const [caso, entrada, esperado] of validos) {
    test(`normaliza ${caso}`, async ({ page }) => {
      const salida = await page.evaluate(v => window.APPITel.normalizar(v), entrada);
      expect(salida).toBe(esperado);
    });
  }

  const invalidos = [
    ['vacío',                  ''],
    ['nulo',                   null],
    ['sin dígitos',            'no tiene'],
    ['demasiado corto',        '0351-999888'],
    ['dos números pegados',    '3517669967 / 3514552272'],
    ['solo el código de área', '0351'],
    /* Caso real (v290): el panel de administración agregaba dígitos sin
       validar y WhatsApp respondía "no es un número de teléfono válido".
       Un número con dígitos de más tiene que rechazarse, no completarse. */
    ['con dígitos de más (caso real del panel)', '+54 280 434264454'],
    ['con 54 pero sin el 9 y con dígitos de más', '54 2804 3426445 4'],
    ['internacional con 14 dígitos',              '+54 9 280 43426 4454'],
  ];

  for (const [caso, entrada] of invalidos) {
    test(`rechaza ${caso}`, async ({ page }) => {
      const salida = await page.evaluate(v => window.APPITel.normalizar(v), entrada);
      expect(salida).toBe('');
      const valido = await page.evaluate(v => window.APPITel.esValido(v), entrada);
      expect(valido).toBe(false);
    });
  }

  test('todos los números válidos quedan con 13 dígitos y arrancan en 549', async ({ page }) => {
    const entradas = validos.map(v => v[1]);
    const salidas = await page.evaluate(list => list.map(v => window.APPITel.normalizar(v)), entradas);
    for (const s of salidas) {
      expect(s).toMatch(/^549\d{10}$/);
    }
  });

  test('link arma el enlace de WhatsApp con el texto', async ({ page }) => {
    const url = await page.evaluate(() => window.APPITel.link('0351 15-766-9967', 'Hola Juan'));
    expect(url).toBe('https://wa.me/5493517669967?text=Hola%20Juan');
  });

  test('link devuelve vacío si el número no sirve', async ({ page }) => {
    const url = await page.evaluate(() => window.APPITel.link('0351-999888', 'Hola'));
    expect(url).toBe('');
  });

  test('abrir avisa y no abre WhatsApp cuando el número es inválido', async ({ page }) => {
    const r = await page.evaluate(() => {
      const abiertos = [];
      window.APPIWhatsApp = { abrir: u => abiertos.push(u) };
      let aviso = null;
      window.APPIDialog = { alert: (msg, opts) => { aviso = { msg, opts }; } };
      const devuelto = window.APPITel.abrir('0351-999888', 'Hola', 'Juan');
      return { devuelto, abiertos, aviso };
    });
    expect(r.devuelto).toBe(false);
    expect(r.abiertos).toHaveLength(0);
    expect(r.aviso).not.toBeNull();
    expect(r.aviso.msg).toContain('Juan');
    expect(r.aviso.msg.toLowerCase()).toContain('no se puede abrir whatsapp');
  });

  test('abrir manda a WhatsApp cuando el número sirve', async ({ page }) => {
    const r = await page.evaluate(() => {
      const abiertos = [];
      window.APPIWhatsApp = { abrir: u => abiertos.push(u) };
      window.APPIDialog = { alert: () => { throw new Error('no debería avisar'); } };
      const devuelto = window.APPITel.abrir('011 15-4766-9967', 'Hola');
      return { devuelto, abiertos };
    });
    expect(r.devuelto).toBe(true);
    expect(r.abiertos).toHaveLength(1);
    expect(r.abiertos[0]).toContain('wa.me/5491147669967');
  });

  test('bonito muestra el número legible según el código de área', async ({ page }) => {
    const r = await page.evaluate(() => [
      window.APPITel.bonito('0351 15-766-9967'),
      window.APPITel.bonito('011 15-4766-9967'),
      window.APPITel.bonito('03541 15-44-4444'),
      window.APPITel.bonito('0351-999888'),
    ]);
    expect(r[0]).toBe('+54 9 351 766-9967');
    expect(r[1]).toBe('+54 9 11 4766-9967');
    expect(r[2]).toBe('+54 9 3541 44-4444');
    expect(r[3]).toBe('');
  });

  test('normalizar es idempotente: aplicarlo dos veces da lo mismo', async ({ page }) => {
    const entradas = validos.map(v => v[1]);
    const r = await page.evaluate(list => list.map(v => {
      const una = window.APPITel.normalizar(v);
      return { una, dos: window.APPITel.normalizar(una) };
    }), entradas);
    for (const { una, dos } of r) expect(dos).toBe(una);
  });
});

/* Convención (v290): nadie más que telefono.js arma números. En v289 quedó
   afuera admin-panel.js, que concatenaba '549' a mano y mandaba a WhatsApp
   números con dígitos de más. Este test evita que vuelva a pasar. */
test('solo telefono.js concatena el prefijo 549', () => {
  const fs = require('fs');
  const problemas = [];
  const patron = /['"`]549['"`]\s*\+|\+\s*['"`]549['"`]/;
  const archivos = fs.readdirSync('.')
    .filter(f => f.endsWith('.js') && f !== 'telefono.js')
    .concat(['index.html', 'encuesta.html', 'revisar-contactos.html'].filter(f => fs.existsSync(f)));
  for (const archivo of archivos) {
    const lineas = fs.readFileSync(archivo, 'utf8').split('\n');
    lineas.forEach((linea, i) => {
      if (patron.test(linea)) problemas.push(`${archivo}:${i + 1}: ${linea.trim().slice(0, 90)}`);
    });
  }
  expect(problemas, `Números armados a mano (usar window.APPITel):\n${problemas.join('\n')}`).toEqual([]);
});
