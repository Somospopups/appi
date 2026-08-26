const { test, expect } = require('@playwright/test');
const fs = require('fs');

test('el video de Rinnova está en los mensajes de la ducha', () => {
  const js = fs.readFileSync('mensajes-usuarios.js', 'utf8');
  expect(js).toContain("mant_ducha_rinnova");
  expect(js).toContain('lM2XjEVCPFI');
  expect(js).toContain('PSA Rinnova · DUCHA II');
});

test('la tarjeta de Rinnova vive 4 días y solo para quien tiene ducha', () => {
  const js = fs.readFileSync('home-tarjetas.js', 'utf8');
  expect(js).toContain("RINNOVA_DESDE = '2026-08-26'");
  expect(js).toContain("RINNOVA_HASTA = '2026-08-30'");
  expect(js).toContain('tarjetaDuchaRinnova()');
  expect(js).toContain('/duch/i');
  expect(js).toContain('rinnova-ducha.jpg');
  expect(js).toContain('lM2XjEVCPFI');
  expect(js).toContain('Ahora nos renovamos');
});

test('a quién ya se le mandó viaja en la nube de la cuenta', () => {
  const js = fs.readFileSync('data-sync.js', 'utf8');
  expect(js).toContain("'appi_ducha_rinnova_v1_'");
});

test('el video del Plan Canje está en el listado y en el mensaje de renovación', () => {
  const js = fs.readFileSync('mensajes-usuarios.js', 'utf8');
  expect(js).toContain('mant_canje');
  expect(js).toContain('evwYO9-o5MY');
  expect(js).toContain('{link_canje}');
});
