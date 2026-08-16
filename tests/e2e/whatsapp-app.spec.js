const { test, expect } = require('@playwright/test');

const UA_ANDROID = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

// Carga solo el módulo, sin arrastrar toda la app.
async function cargarModulo(page, { android = true } = {}) {
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  if (android) {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'userAgent', { get: () => 'Mozilla/5.0 (Linux; Android 13; Pixel 7) Mobile' });
    });
  }
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.APPIWhatsApp);
}

test('sin preferencia y fuera de Android usa el wa.me de siempre', async ({ browser }) => {
  const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120' });
  const page = await ctx.newPage();
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.APPIWhatsApp);

  expect(await page.evaluate(() => window.APPIWhatsApp.esAndroid())).toBe(false);
  const url = await page.evaluate(() => window.APPIWhatsApp.construir('https://wa.me/5493511234567?text=Hola', 'normal'));
  expect(url).toBe('https://wa.me/5493511234567?text=Hola');
  await ctx.close();
});

test('en Android arma un intent con el paquete de cada WhatsApp', async ({ browser }) => {
  const ctx = await browser.newContext({ userAgent: UA_ANDROID });
  const page = await ctx.newPage();
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.APPIWhatsApp);

  expect(await page.evaluate(() => window.APPIWhatsApp.esAndroid())).toBe(true);

  const normal = await page.evaluate(() => window.APPIWhatsApp.construir('https://wa.me/5493511234567?text=Hola%20Ana', 'normal'));
  expect(normal).toContain('intent://send');
  expect(normal).toContain('phone=5493511234567');
  expect(normal).toContain('package=com.whatsapp;');
  expect(normal).not.toContain('com.whatsapp.w4b');
  expect(normal).toContain('S.browser_fallback_url=');
  expect(normal.endsWith(';end')).toBe(true);

  const business = await page.evaluate(() => window.APPIWhatsApp.construir('https://wa.me/5493511234567?text=Hola%20Ana', 'business'));
  expect(business).toContain('package=com.whatsapp.w4b;');

  // El texto sobrevive el ida y vuelta.
  const conTexto = await page.evaluate(() => window.APPIWhatsApp.construir('https://wa.me/?text=' + encodeURIComponent('Hola, ¿cómo estás? #1'), 'normal'));
  expect(decodeURIComponent(conTexto)).toContain('Hola, ¿cómo estás? #1');

  // Sin preferencia elegida seguimos con el enlace común.
  const sinPref = await page.evaluate(() => window.APPIWhatsApp.construir('https://wa.me/549351?text=Hola', ''));
  expect(sinPref).toBe('https://wa.me/549351?text=Hola');
  await ctx.close();
});

test('separa número y texto de los formatos que usa la app', async ({ browser }) => {
  const ctx = await browser.newContext({ userAgent: UA_ANDROID });
  const page = await ctx.newPage();
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.APPIWhatsApp);

  const casos = await page.evaluate(() => [
    window.APPIWhatsApp.partirEnlace('https://wa.me/5493511234567?text=Hola'),
    window.APPIWhatsApp.partirEnlace('https://wa.me/?text=Solo%20texto'),
    window.APPIWhatsApp.partirEnlace('https://api.whatsapp.com/send?phone=549351&text=Otro'),
    window.APPIWhatsApp.partirEnlace('https://wa.me/5493511234567')
  ]);
  expect(casos[0]).toEqual({ numero: '5493511234567', texto: 'Hola' });
  expect(casos[1]).toEqual({ numero: '', texto: 'Solo texto' });
  expect(casos[2]).toEqual({ numero: '549351', texto: 'Otro' });
  expect(casos[3]).toEqual({ numero: '5493511234567', texto: '' });
  await ctx.close();
});

test('la preferencia se recuerda y se puede cambiar', async ({ browser }) => {
  const ctx = await browser.newContext({ userAgent: UA_ANDROID });
  const page = await ctx.newPage();
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.APPIWhatsApp);

  expect(await page.evaluate(() => window.APPIWhatsApp.preferencia())).toBe('');
  await page.evaluate(() => window.APPIWhatsApp.setPreferencia('business'));
  expect(await page.evaluate(() => localStorage.getItem('appi_whatsapp_app'))).toBe('business');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.APPIWhatsApp);
  expect(await page.evaluate(() => window.APPIWhatsApp.preferencia())).toBe('business');
  expect(await page.evaluate(() => window.APPIWhatsApp.nombre())).toBe('WhatsApp Business');

  // Un valor inválido no se guarda.
  await page.evaluate(() => window.APPIWhatsApp.setPreferencia('cualquiera'));
  expect(await page.evaluate(() => window.APPIWhatsApp.preferencia())).toBe('');
  await ctx.close();
});

test('la primera vez pregunta, después ya no', async ({ browser }) => {
  const ctx = await browser.newContext({ userAgent: UA_ANDROID });
  const page = await ctx.newPage();
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.APPIWhatsApp && !!window.APPIDialog);
  await page.evaluate(() => {
    localStorage.removeItem('appi_whatsapp_app');
    window.__destinos = [];
    window.open = url => { window.__destinos.push(String(url)); return { closed: false, close(){}, location: { set href(v){ window.__destinos.push(String(v)); } } }; };
  });

  // Primer envío: aparece el diálogo con las dos opciones.
  await page.evaluate(() => { window.__p = window.APPIWhatsApp.abrir('https://wa.me/549351?text=Hola'); });
  await expect(page.locator('#appiDialogChoices button')).toHaveCount(2);
  await expect(page.locator('#appiDialogChoices')).toContainText('WhatsApp Business');
  await page.locator('#appiDialogChoices button', { hasText: '💬 WhatsApp' }).first().click();
  await page.evaluate(() => window.__p);

  expect(await page.evaluate(() => window.APPIWhatsApp.preferencia())).toBe('normal');
  let destinos = await page.evaluate(() => window.__destinos);
  expect(destinos.join(' ')).toContain('package=com.whatsapp;');

  // Segundo envío: ya no pregunta y usa la app elegida.
  await page.evaluate(() => { window.__destinos = []; return window.APPIWhatsApp.abrir('https://wa.me/549352?text=Chau'); });
  await expect(page.locator('.appi-dialog-overlay')).toBeHidden();
  destinos = await page.evaluate(() => window.__destinos);
  expect(destinos).toHaveLength(1);
  expect(destinos[0]).toContain('package=com.whatsapp;');
  expect(destinos[0]).toContain('phone=549352');
  await ctx.close();
});

test('si cancela la elección, el mensaje se manda igual y vuelve a preguntar', async ({ browser }) => {
  const ctx = await browser.newContext({ userAgent: UA_ANDROID });
  const page = await ctx.newPage();
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.APPIWhatsApp && !!window.APPIDialog);
  await page.evaluate(() => {
    localStorage.removeItem('appi_whatsapp_app');
    window.__destinos = [];
    window.open = url => { window.__destinos.push(String(url)); return { closed:false, close(){}, location:{ set href(v){ window.__destinos.push(String(v)); } } }; };
    window.__p = window.APPIWhatsApp.abrir('https://wa.me/549351?text=Hola');
  });
  await page.locator('#appiDialogCancel').click();
  await page.evaluate(() => window.__p);

  // No queda trabado: se abrió el enlace común y no se guardó preferencia.
  const destinos = await page.evaluate(() => window.__destinos);
  expect(destinos.join(' ')).toContain('https://wa.me/549351');
  expect(await page.evaluate(() => window.APPIWhatsApp.preferencia())).toBe('');
  await ctx.close();
});

test('los enlaces de WhatsApp de la app se interceptan solos', async ({ browser }) => {
  const ctx = await browser.newContext({ userAgent: UA_ANDROID });
  const page = await ctx.newPage();
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.APPIWhatsApp);
  await page.evaluate(() => {
    window.APPIWhatsApp.setPreferencia('business');
    window.__destinos = [];
    window.open = url => { window.__destinos.push(String(url)); return { closed:false, close(){}, location:{ set href(v){ window.__destinos.push(String(v)); } } }; };
    const a = document.createElement('a');
    a.id = 'linkWa'; a.href = 'https://wa.me/5493511234567?text=Hola'; a.textContent = 'WhatsApp';
    a.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;background:#fff';
    document.body.appendChild(a);
    const otro = document.createElement('a');
    otro.id = 'linkOtro'; otro.href = 'https://example.com/'; otro.textContent = 'Otro';
    otro.style.cssText = 'position:fixed;top:40px;left:0;z-index:99999;background:#fff';
    document.body.appendChild(otro);
  });

  await page.locator('#linkWa').click();
  const destinos = await page.evaluate(() => window.__destinos);
  expect(destinos).toHaveLength(1);
  expect(destinos[0]).toContain('package=com.whatsapp.w4b;');
  expect(destinos[0]).toContain('phone=5493511234567');

  // Un enlace que no es de WhatsApp no se toca.
  expect(await page.evaluate(() => {
    const a = document.getElementById('linkOtro');
    const ev = new MouseEvent('click', { bubbles: true, cancelable: true });
    a.dispatchEvent(ev);
    return ev.defaultPrevented;
  })).toBe(false);
  await ctx.close();
});

test('fuera de Android no se intercepta nada', async ({ browser }) => {
  const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari' });
  const page = await ctx.newPage();
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.APPIWhatsApp);
  const prevented = await page.evaluate(() => {
    const a = document.createElement('a');
    a.href = 'https://wa.me/549351?text=Hola';
    document.body.appendChild(a);
    const ev = new MouseEvent('click', { bubbles: true, cancelable: true });
    a.dispatchEvent(ev);
    return ev.defaultPrevented;
  });
  expect(prevented).toBe(false);
  await ctx.close();
});
