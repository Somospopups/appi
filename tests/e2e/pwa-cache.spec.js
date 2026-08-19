const { test, expect } = require('@playwright/test');
const fs = require('fs');

const read = file => fs.readFileSync(file, 'utf8');

test('la versión visible, el paquete y el Service Worker están alineados', () => {
  const html=read('index.html'),sw=read('service-worker.js'),pkg=JSON.parse(read('package.json'));
  // La versión se lee del paquete en vez de anotarse acá: lo que importa es
  // que los cuatro lugares digan lo mismo, no cuál es el número de hoy.
  // Si quedaran desalineados, el teléfono seguiría mostrando la versión vieja.
  const v = pkg.version.split('.')[0];
  expect(pkg.version).toBe(`${v}.0.0`);
  expect(html).toContain(`APPI · v${v} · Segura`);
  expect(html).toContain(`const swVersion='${v}'`);
  expect(html).toContain("{updateViaCache:'none'}");
  expect(html).toContain('await registration.update()');
  expect(sw).toContain(`CACHE_NAME = 'appi-v${v}-`);
  const manifest=JSON.parse(read('manifest.json'));
  expect(manifest.background_color).toBe('#06172d');
  expect(manifest.theme_color).toBe('#06172d');
  expect(html).toContain('theme-color" content="#06172d"');
  // El nombre del caché tiene que cambiar en cada versión: si se repite, el
  // navegador se queda con los archivos viejos.
  expect(sw).toMatch(new RegExp(`CACHE_NAME = 'appi-v${v}-[a-z0-9-]+'`));
  expect(html).toContain('apple-touch-startup-image');
  expect(html).toContain('class="boot-water"');
  expect(html).not.toContain('boot-water-caustic');
  expect(html).not.toContain('boot-water-light');
  expect(html).not.toContain('repeating-linear-gradient');
  expect(html).not.toMatch(/splash\/agua-(textura|llena)\.(jpg|jpeg|png|webp)/);
  expect(html).not.toMatch(/url\(['\"]?splash\/[^)'\"]+\.(jpg|jpeg|png|webp)/);
  expect(sw).not.toMatch(/splash\/agua-/);
  expect(fs.existsSync('splash/agua-textura.jpg')).toBe(false);
  expect(fs.existsSync('splash/agua-llena.jpg')).toBe(false);
  expect(fs.existsSync('splash/apple-splash-1170x2532.png')).toBe(true);
  expect(fs.existsSync('icon-512.png')).toBe(true);
});

test('el agua de carga se anima con CSS y no pide fotos estáticas', async ({ page }) => {
  const fotos = [];
  page.on('request', req => {
    if (/splash\/agua-|\.(jpg|jpeg|webp)(\?|$)/i.test(req.url())) fotos.push(req.url());
  });
  // El arranque no se retira mientras se mide, aunque la app inicie muy rápido.
  await page.addInitScript(() => { window.__appiCubriendoInicio = true; });
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  const water = page.locator('#bootScreen .boot-water');
  await expect(water).toBeVisible();
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#06172d');
  await expect(page.locator('#bootScreen .boot-wave')).toHaveCount(2);
  await expect(page.locator('#bootScreen .boot-bubble')).toHaveCount(6);
  const fondo = await water.evaluate(el => getComputedStyle(el).backgroundImage);
  expect(fondo).not.toMatch(/url\(/);
  await expect.poll(() => page.locator('#bootScreen').evaluate(el => el.classList.contains('fill'))).toBe(true);
  expect(fotos, `El arranque pidió fotos: ${fotos.join(', ')}`).toEqual([]);
});

test('el App Shell sólo referencia archivos existentes e incluye los módulos activos', () => {
  const html=read('index.html'),sw=read('service-worker.js');
  const shellBlock=sw.match(/const APP_SHELL = \[([\s\S]*?)\];/);
  expect(shellBlock).not.toBeNull();
  const shell=[...shellBlock[1].matchAll(/'\.\/([^']*)'/g)].map(match=>match[1]).filter(Boolean);
  for(const file of shell)expect(fs.existsSync(file),`Falta el recurso de App Shell: ${file}`).toBe(true);

  const localScripts=[...html.matchAll(/<script[^>]+src="\.\/([^"]+)"/g)].map(match=>match[1]);
  const localStyles=[...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="\.\/([^"]+)"/g)].map(match=>match[1]);
  for(const resource of [...localScripts,...localStyles]){
    expect(shell,`${resource} debe estar precargado para el primer uso offline`).toContain(resource);
  }
});
