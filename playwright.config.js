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
    baseURL: 'http://127.0.0.1:8123',
    // La app ya trae su hoja prefers-reduced-motion completa: correr las
    // pruebas con esa preferencia las hace deterministas (los overlays
    // con animaciones infinitas dejan de moverse y los clics son estables)
    // y además cubren el camino real de los usuarios que la activan.
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
    // La app calcula "hoy" por Buenos Aires (appiFechaBA, v631) pero los
    // tests escribían fechas con la zona del sistema. En tu máquina eso es
    // Argentina y en CI es UTC: entre las 00:00 y las 03:00 UTC eran días
    // distintos y los tests que comparan "hoy" se caían sólo en CI.
    // Fijamos la zona para que CI corra igual que las corridas locales.
    timezoneId: 'America/Argentina/Buenos_Aires',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // El cartel "¿Recibís los avisos de APPI?" (appi-notif.js) sale al entrar a
    // cualquier pantalla salvo que el usuario ya haya decidido. Ningún test
    // ejercita ese cartel: arrancamos con las claves de "ya decidió", como un
    // usuario que viene usando la app (v523+).
    storageState: {
      cookies: [],
      origins: [{
        origin: 'http://127.0.0.1:8123',
        localStorage: [
          { name: 'appi_notif_listo_v1', value: '1' },
          { name: 'appi_notif_popup_later', value: '4102444800000' },
          // Cuenta PSA "conectada": sin esto el popup obligatorio de PSA
          // (v725) abre sobre el modal compartido y le roba los clics a
          // cualquier prueba que entre al panel.
          { name: 'appsi_psa_creds', value: '{"center":"02","number":"9802014","password":"clave-de-prueba","remember":true,"ts":0}' },
          // Aviso "no se pudieron actualizar los datos de PSA" (v854): como
          // las credenciales de arriba están inventadas, la edge falla siempre
          // y el pop-up se abriría solo y le robaría los clics al resto de la
          // suite. Las pruebas que lo quieren ejercitar lo encienden a mano.
          { name: 'appi_aviso_psa_off', value: '1' }
        ]
      }]
    },
    ...devices['Desktop Chrome']
  },
  webServer: {
    // En Windows no existe `python3` (es un alias de la Microsoft Store que
    // sólo abre la tienda): ahí se usa el launcher `py`. En CI (Linux) se
    // mantiene `python3` tal cual.
    command: process.platform === 'win32'
      ? 'py -m http.server 8123 --bind 127.0.0.1'
      : 'python3 -m http.server 8123 --bind 127.0.0.1',
    url: 'http://127.0.0.1:8123/index.html',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000
  }
});
