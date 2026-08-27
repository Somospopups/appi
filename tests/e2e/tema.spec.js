const { test, expect } = require('@playwright/test');
const fs = require('fs');

test('el idioma visual único está enganchado', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  expect(html).toContain('appi-tema.css');
  const css = fs.readFileSync('appi-tema.css', 'utf8');
  expect(css).toContain('--appi-grad');
  expect(css).toContain('un solo idioma visual');
  const sw = fs.readFileSync('service-worker.js', 'utf8');
  expect(sw).toContain('./appi-tema.css');
});
