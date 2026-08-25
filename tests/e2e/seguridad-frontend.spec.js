const { test, expect } = require('@playwright/test');
const fs = require('fs');

const read = file => fs.readFileSync(file, 'utf8');

test('el frontend no almacena claves privadas ni sube grabaciones a proveedores', () => {
  const html = read('index.html');
  const config = read('auth-config.js');

  expect(html).not.toContain('openai_api_key');
  expect(html).not.toContain('api.openai.com/v1/audio/transcriptions');
  expect(config).not.toMatch(/service[_-]?role/i);
  expect(html).toContain('Analizando el audio completo en este dispositivo');
});

test('sin autenticación configurada la aplicación permanece cerrada', async ({ page }) => {
  await page.route('**/auth-config.js', route => route.fulfill({
    contentType:'application/javascript',
    body:"window.APPI_AUTH={enabled:false,url:'',anonKey:'',offlineDays:7};"
  }));
  await page.goto('/index.html',{waitUntil:'networkidle'});
  await expect(page.locator('#lockScreen')).not.toHaveClass(/hidden/);
  await expect(page.locator('#distributorLoginPanel')).toBeVisible();
  await expect(page.locator('#btnDistributorLogin')).toBeDisabled();
  await expect(page.locator('#legacyActivationPanel')).toHaveCount(0);
});

test('las bibliotecas de ejecución están fijadas dentro del repositorio', () => {
  const html = read('index.html');
  const sw = read('service-worker.js');
  const required = [
    'xlsx.full.min.js','html2canvas.min.js','jspdf.umd.min.js',
    'svg2pdf.umd.min.js','jszip.min.js','transformers.min.js'
  ];

  expect(html).not.toMatch(/<script[^>]+src="https?:\/\//i);
  for (const file of required) {
    expect(fs.existsSync(`vendor/${file}`), `Falta vendor/${file}`).toBe(true);
    expect(html).toContain(`./vendor/${file}`);
    expect(sw).toContain(`./vendor/${file}`);
  }
});

test('el mapa y Leaflet quedaron eliminados de la app (v333)', () => {
  // A pedido del equipo, la función de mapa (Leaflet + geocodificación) se
  // eliminó por completo: no queda ni el botón, ni el contenedor, ni la
  // librería, ni los pines. "¿Cómo llego?" abre Google Maps en una pestaña
  // nueva, que es lo único que se conserva.
  const html = read('index.html');
  const sw = read('service-worker.js');

  expect(html).not.toContain('leaflet');
  expect(html).not.toContain('usuariosMap');
  expect(html).not.toContain('verVecinosU');
  expect(html).not.toContain('marker-icon');
  expect(sw).not.toContain('leaflet');
  expect(sw).not.toContain('marker-icon');
  expect(fs.existsSync('vendor/leaflet.js')).toBe(false);
  expect(fs.existsSync('vendor/leaflet.css')).toBe(false);

  // Sigue prohibido colgarse de servidores ajenos para íconos.
  expect(html).not.toMatch(/iconUrl:\s*['"]https?:\/\//i);
  expect(html).not.toMatch(/shadowUrl:\s*['"]https?:\/\//i);
  expect(html).not.toContain('raw.githubusercontent.com');
  expect(html).not.toContain('cdnjs.cloudflare.com');
});
