const { test, expect } = require('@playwright/test');
const { execFileSync } = require('child_process');
const path = require('path');

/* Ejecuta los tests de guarda del updater de precios (frescura de ganancias/
   ingreso y financiación auditada) con python3. Se integra al runner de
   Playwright para que un dato vencido o una edición de financiación sin
   auditar no se publique en silencio. */

test('guardias del updater de precios PSA pasan', async () => {
  const script = path.resolve(__dirname, '..', 'actualizar-precios-psa.test.py');
  let salida;
  try {
    salida = execFileSync('python3', [script], { encoding: 'utf8', timeout: 60000 });
  } catch (e) {
    const stderr = (e.stderr || '').toString();
    const stdout = (e.stdout || '').toString();
    throw new Error(`tests/actualizar-precios-psa.test.py falló:\n${stdout}\n${stderr}`);
  }
  expect(salida).toContain('ok: guardas de frescura y financiación auditada');
});
