const { test, expect } = require('@playwright/test');
const fs = require('fs');

test('la tarjeta del método de envío existe y se puede cerrar', () => {
  const js = fs.readFileSync('home-tarjetas.js', 'utf8');
  expect(js).toContain('tarjetaMetodoEnvio()');
  expect(js).toContain('Sé que querés escribirle a todos');
  expect(js).toContain('Tranqui. Esto es un proceso');
  expect(js).toContain('Entendido, vamos');
});

test('el visto del método viaja en la nube de la cuenta', () => {
  const js = fs.readFileSync('data-sync.js', 'utf8');
  expect(js).toContain("'appi_metodo_envio_v1_'");
  const tel = fs.readFileSync('telefono.js', 'utf8');
  expect(tel).toContain('appi_metodo_envio_v1_');
  expect(tel).toContain('marcarMetodoVisto');
  expect(tel).toContain('Hoy llegamos');
});
