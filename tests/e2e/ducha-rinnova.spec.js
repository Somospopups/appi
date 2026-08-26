const { test, expect } = require('@playwright/test');
const fs = require('fs');

test('el video de Rinnova está en los mensajes de la ducha', () => {
  const js = fs.readFileSync('mensajes-usuarios.js', 'utf8');
  expect(js).toContain("id: 'mant_ducha_rinnova'");
  expect(js).toContain('lM2XjEVCPFI');
  expect(js).toContain('PSA Rinnova · DUCHA II');
});

test('la tarjeta de Rinnova vive 4 días y solo para quien tiene ducha', () => {
  const js = fs.readFileSync('home-tarjetas.js', 'utf8');
  expect(js).toContain("RINNOVA_DESDE = '2026-08-26'");
  expect(js).toContain("RINNOVA_HASTA = '2026-08-29'");
  expect(js).toContain('tarjetaDuchaRinnova()');
  expect(js).toContain('/ducha/i');
  expect(js).toContain('lM2XjEVCPFI');
});

test('a quién ya se le mandó viaja en la nube de la cuenta', () => {
  const js = fs.readFileSync('data-sync.js', 'utf8');
  expect(js).toContain("'appi_ducha_rinnova_v1_'");
});
