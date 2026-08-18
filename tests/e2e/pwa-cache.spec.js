const { test, expect } = require('@playwright/test');
const fs = require('fs');

const read = file => fs.readFileSync(file, 'utf8');

test('la versión visible, el paquete y el Service Worker están alineados', () => {
  const html=read('index.html'),sw=read('service-worker.js'),pkg=JSON.parse(read('package.json'));
  expect(pkg.version).toBe('256.0.0');
  expect(html).toContain('APPI · v256 · Segura');
  expect(html).toContain("const swVersion='256'");
  expect(html).toContain("{updateViaCache:'none'}");
  expect(html).toContain('await registration.update()');
  expect(sw).toContain("CACHE_NAME = 'appi-v256-");
  const manifest=JSON.parse(read('manifest.json'));
  expect(manifest.background_color).toBe('#eef4ff');
  expect(manifest.theme_color).toBe('#eef4ff');
  expect(html).toContain('theme-color" content="#eef4ff"');
  expect(html).toContain('apple-touch-startup-image');
  expect(html).toContain('class="boot-water"');
  expect(html).toContain('class="boot-water-caustic"');
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
  await expect(page.locator('#bootScreen .boot-water-caustic')).toBeVisible();
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
