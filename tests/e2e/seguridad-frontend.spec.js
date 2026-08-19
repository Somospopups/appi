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
    'xlsx.full.min.js','leaflet.js','html2canvas.min.js','jspdf.umd.min.js',
    'svg2pdf.umd.min.js','jszip.min.js','transformers.min.js'
  ];

  expect(html).not.toMatch(/<script[^>]+src="https?:\/\//i);
  for (const file of required) {
    expect(fs.existsSync(`vendor/${file}`), `Falta vendor/${file}`).toBe(true);
    expect(html).toContain(`./vendor/${file}`);
    expect(sw).toContain(`./vendor/${file}`);
  }
});

test('los pines del mapa salen del repositorio y no de un CDN', () => {
  // El mapa de garantías se usa en la calle, con mala señal. Si los pines
  // vinieran de internet, el distribuidor abriría el mapa y no vería ninguno:
  // justo el dato que el mapa existe para mostrar (rojo vencida, amarillo por
  // vencer, verde vigente).
  const html = read('index.html');
  const sw = read('service-worker.js');
  const pines = [
    'marker-icon-2x-red.png','marker-icon-2x-green.png',
    'marker-icon-2x-yellow.png','marker-shadow-0.7.7.png'
  ];

  for (const pin of pines) {
    expect(fs.existsSync(`vendor/images/${pin}`), `Falta vendor/images/${pin}`).toBe(true);
    expect(html).toContain(`./vendor/images/${pin}`);
    expect(sw, `${pin} debe estar cacheado para el primer uso offline`).toContain(`./vendor/images/${pin}`);
  }

  // Ningún ícono de Leaflet puede volver a colgarse de un servidor ajeno.
  expect(html).not.toMatch(/iconUrl:\s*['"]https?:\/\//i);
  expect(html).not.toMatch(/shadowUrl:\s*['"]https?:\/\//i);
  expect(html).not.toContain('raw.githubusercontent.com');
  expect(html).not.toContain('cdnjs.cloudflare.com');
});
