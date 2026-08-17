const { test, expect } = require('@playwright/test');
const fs = require('fs');

const read = file => fs.readFileSync(file, 'utf8');

test('la versión visible, el paquete y el Service Worker están alineados', () => {
  const html=read('index.html'),sw=read('service-worker.js'),pkg=JSON.parse(read('package.json'));
  expect(pkg.version).toBe('250.0.0');
  expect(html).toContain('APPI · v250 · Pre-publicación');
  expect(html).toContain("service-worker.js?v=250");
  expect(sw).toContain("CACHE_NAME = 'appi-v250-");
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
