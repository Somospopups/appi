const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4174',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // El cartel "¿Recibís los avisos de APPI?" (appi-notif.js) sale al entrar a
    // cualquier pantalla salvo que el usuario ya haya decidido. Ningún test
    // ejercita ese cartel: arrancamos con las claves de "ya decidió", como un
    // usuario que viene usando la app (v523+).
    storageState: {
      cookies: [],
      origins: [{
        origin: 'http://127.0.0.1:4174',
        localStorage: [
          { name: 'appi_notif_listo_v1', value: '1' },
          { name: 'appi_notif_popup_later', value: '4102444800000' }
        ]
      }]
    },
    ...devices['Desktop Chrome']
  },
  webServer: {
    command: 'python3 -m http.server 4174 --bind 127.0.0.1',
    url: 'http://127.0.0.1:4174/index.html',
    reuseExistingServer: false,
    timeout: 30_000
  }
});
