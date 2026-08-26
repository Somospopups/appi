const { test, expect } = require('@playwright/test');
const fs = require('fs');

test('la tarjeta del método de envío existe y se puede cerrar', () => {
  const js = fs.readFileSync('home-tarjetas.js', 'utf8');
  expect(js).toContain('tarjetaMetodoEnvio()');
  expect(js).toContain('WhatsApp te puede cortar el número');
  expect(js).toContain('Ya le pasó a una distribuidora');
  expect(js).toContain('Entendido, cuido mi línea');
  expect(js).toContain('ht-alerta');
});

test('el visto del método viaja en la nube de la cuenta', () => {
  const js = fs.readFileSync('data-sync.js', 'utf8');
  expect(js).toContain("'appi_metodo_envio_v2_'");
  const tel = fs.readFileSync('telefono.js', 'utf8');
  expect(tel).toContain('appi_metodo_envio_v2_');
  expect(tel).toContain('marcarMetodoVisto');
  expect(tel).toContain('Hoy llegamos');
});
