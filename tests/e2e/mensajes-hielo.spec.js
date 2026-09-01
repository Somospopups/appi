const { test, expect } = require('@playwright/test');
const fs = require('fs');

test('el módulo de hielo declara la firma por persona y las 8 frases', () => {
  const js = fs.readFileSync('mensajes-hielo.js', 'utf8');
  expect(js).toContain("FIRMA_KEY = 'appi_firma_wa_v1'");
  expect(js).toContain('h >= 6 && h < 12');
  expect(js).toContain('h >= 12 && h < 20');
  expect((js.match(/function\(s, f\)/g) || []).length).toBe(8);
  expect(js).not.toMatch(/(?<![.\w])(?:window\.)?(?:alert|confirm|prompt)\s*\(/);
});

test('la firma y los envíos entran al sync: firma por persona, envíos de la casa', () => {
  const js = fs.readFileSync('data-sync.js', 'utf8');
  expect(js).toContain("'appi_firma_wa_v1'");
  expect(js).toContain("'appi_mensajes_v1_'");
  expect(js).toContain('isMensajesKey');
  expect(js).toContain('isAccionesKey(key)||isMensajesKey(key)');
});
