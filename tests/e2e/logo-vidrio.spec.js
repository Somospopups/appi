const { test, expect } = require('@playwright/test');
const fs = require('fs');

const read = file => fs.readFileSync(file, 'utf8');

// Familias de dispositivos que deben arrancar con el logo de vidrio.
const APARATOS = [
  { nombre: 'iPhone SE', ancho: 320, alto: 568, dpr: 2 },
  { nombre: 'iPhone 8', ancho: 375, alto: 667, dpr: 2 },
  { nombre: 'iPhone 11', ancho: 414, alto: 896, dpr: 2 },
  { nombre: 'iPhone X / 11 Pro', ancho: 375, alto: 812, dpr: 3 },
  { nombre: 'iPhone 13 / 14', ancho: 390, alto: 844, dpr: 3 },
  { nombre: 'iPhone 15 / 16', ancho: 393, alto: 852, dpr: 3 },
  { nombre: 'iPhone 16 Pro', ancho: 402, alto: 874, dpr: 3 },
  { nombre: 'iPhone 14 Pro Max', ancho: 430, alto: 932, dpr: 3 },
  { nombre: 'iPhone 16 Pro Max', ancho: 440, alto: 956, dpr: 3 },
  { nombre: 'iPad mini', ancho: 744, alto: 1133, dpr: 2 },
  { nombre: 'iPad', ancho: 768, alto: 1024, dpr: 2 },
  { nombre: 'iPad 10.2', ancho: 810, alto: 1080, dpr: 2 },
  { nombre: 'iPad Air', ancho: 820, alto: 1180, dpr: 2 },
  { nombre: 'iPad Pro 11', ancho: 834, alto: 1194, dpr: 2 },
  { nombre: 'iPad Pro 12.9', ancho: 1024, alto: 1366, dpr: 2 }
];

function arranquesDeclarados(html) {
  return [...html.matchAll(/<link rel="apple-touch-startup-image" href="\.\/([^"]+)"(?:\s+media="([^"]*)")?\s*\/>/g)]
    .map(m => ({ archivo: m[1], media: m[2] || '' }));
}

test('cada arranque declarado apunta a una imagen de vidrio real', () => {
  const arranques = arranquesDeclarados(read('index.html'));
  expect(arranques.length).toBeGreaterThan(20);
  for (const { archivo } of arranques) {
    expect(fs.existsSync(archivo), `Falta la imagen de arranque ${archivo}`).toBe(true);
  }
  // Sin media: la red de seguridad para cualquier iPhone que no coincida con la lista.
  expect(arranques.filter(a => !a.media).length).toBe(1);
});

test('todos los dispositivos Apple tienen su imagen de arranque, vertical y las tablets también apaisada', () => {
  const arranques = arranquesDeclarados(read('index.html'));
  for (const aparato of APARATOS) {
    const vertical = arranques.find(a =>
      a.media.includes(`(device-width: ${aparato.ancho}px)`) &&
      a.media.includes(`(device-height: ${aparato.alto}px)`) &&
      a.media.includes(`(-webkit-device-pixel-ratio: ${aparato.dpr})`) &&
      a.media.includes('portrait'));
    expect(vertical, `${aparato.nombre} arrancaría sin el logo de vidrio`).toBeTruthy();
    const esperado = `splash/apple-splash-${aparato.ancho * aparato.dpr}x${aparato.alto * aparato.dpr}.png`;
    expect(vertical.archivo).toBe(esperado);

    if (aparato.ancho >= 744) {
      const apaisado = arranques.find(a =>
        a.media.includes(`(device-width: ${aparato.ancho}px)`) &&
        a.media.includes(`(device-height: ${aparato.alto}px)`) &&
        a.media.includes('landscape'));
      expect(apaisado, `${aparato.nombre} apaisado arrancaría en blanco`).toBeTruthy();
      expect(apaisado.archivo).toBe(`splash/apple-splash-${aparato.alto * aparato.dpr}x${aparato.ancho * aparato.dpr}.png`);
    }
  }
});

test('los íconos del manifiesto llevan el mismo logo de vidrio que usa Android al arrancar', () => {
  const manifest = JSON.parse(read('manifest.json'));
  const iconos = manifest.icons.filter(icono => icono.purpose !== 'monochrome');
  expect(iconos.length).toBeGreaterThanOrEqual(4);
  for (const icono of iconos) {
    const archivo = icono.src.replace('./', '');
    expect(fs.existsSync(archivo), `Falta el ícono ${archivo}`).toBe(true);
  }
  expect(manifest.background_color).toBe('#06172d');
  expect(manifest.theme_color).toBe('#06172d');
  // Splash de iPhone: logo de vidrio. Ícono de inicio: brand/icono-app.png
  // (vidrio oscuro, APPI en la zona que recortan Android e iOS).
  const generador = read('scripts/logo_vidrio.py');
  expect(generador).toContain('def paint_glass_wordmark');
  expect(read('scripts/make-icons.py')).toContain('icono-app.png');
  expect(read('scripts/make-splash.py')).toContain('from logo_vidrio import');
  expect(fs.existsSync('brand/icono-app.png')).toBe(true);
});

test('el arranque de la app muestra el logo de vidrio en celular, tablet y PC', async ({ page }) => {
  const pedidos = [];
  page.on('request', req => {
    if (/splash\/|\.(jpg|jpeg|webp)(\?|$)/i.test(req.url())) pedidos.push(req.url());
  });

  // El arranque no se retira mientras se mide: la app sólo lo oculta cuando termina de cubrir el inicio.
  await page.addInitScript(() => { window.__appiCubriendoInicio = true; });

  for (const tamano of [{ width: 360, height: 740 }, { width: 834, height: 1112 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(tamano);
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });

    const vidrio = page.locator('#bootScreen .boot-glass');
    const logo = page.locator('#bootScreen .boot-glass .boot-logo');
    await expect(vidrio).toBeVisible();
    await expect(logo).toHaveText('APPI');

    const estilo = await vidrio.evaluate(el => {
      const css = getComputedStyle(el);
      const caja = el.getBoundingClientRect();
      return {
        fondo: css.backgroundImage,
        borde: css.borderTopWidth,
        radio: parseFloat(css.borderTopLeftRadius),
        blur: css.backdropFilter || css.webkitBackdropFilter || '',
        ancho: caja.width,
        alto: caja.height,
        arriba: caja.top
      };
    });
    expect(estilo.fondo).toContain('gradient');
    expect(estilo.radio).toBeGreaterThan(10);
    expect(estilo.ancho).toBeGreaterThan(120);
    expect(estilo.alto).toBeGreaterThan(50);
    expect(estilo.arriba).toBeGreaterThan(0);
    expect(estilo.ancho).toBeLessThanOrEqual(tamano.width);
  }

  // El logo del arranque se dibuja con CSS: no descarga ninguna foto de splash.
  expect(pedidos, `El arranque pidió imágenes: ${pedidos.join(', ')}`).toEqual([]);
});
