const { test, expect } = require('@playwright/test');
const fs = require('fs');

const read = file => fs.readFileSync(file, 'utf8');

test('la versión visible, el paquete y el Service Worker están alineados', () => {
  const html=read('index.html'),sw=read('service-worker.js'),pkg=JSON.parse(read('package.json'));
  expect(pkg.version).toBe('251.0.0');
  expect(html).toContain('APPI · v251 · Segura');
  expect(html).toContain("service-worker.js?v=251");
  expect(sw).toContain("CACHE_NAME = 'appi-v251-");
  const manifest=JSON.parse(read('manifest.json'));
  expect(manifest.background_color).toBe('#eef4ff');
  expect(manifest.theme_color).toBe('#eef4ff');
  expect(html).toContain('theme-color" content="#eef4ff"');
  expect(html).toContain('apple-touch-startup-image');
  expect(fs.existsSync('splash/apple-splash-1170x2532.png')).toBe(true);
  expect(fs.existsSync('icon-512.png')).toBe(true);
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
