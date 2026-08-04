// APPI Service Worker - v89 (FIX: caché sin duplicados + precache completo)
const CACHE_NAME = 'appi-v91';
const ARCHIVOS = [
  './',
  './index.html',
  './manifest.json',
  './precios.json',
  './blocklist.json',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
  'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
  'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'
];

// Instalar: guardar archivos en caché (si uno falla, no aborta la instalación)
self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.allSettled(ARCHIVOS.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

// Activar: limpiar cachés viejos
self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: red primero, caché como fallback.
// FIX: la clave de caché IGNORA el query string (?t=...), así:
//  - precios.json y blocklist.json no llenan la caché con copias duplicadas
//  - el fallback offline SÍ encuentra los archivos precacheados
self.addEventListener('fetch', (evt) => {
  if (evt.request.method !== 'GET') return;

  // Normalizar: misma clave para la misma URL, sin importar el query string
  const url = new URL(evt.request.url);
  const clave = url.origin + url.pathname;

  // Navegaciones: red primero, si falla → index.html cacheado (modo offline)
  if (evt.request.mode === 'navigate') {
    evt.respondWith(
      fetch(evt.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(clave, clone));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Resto (JS, JSON, CDN): red primero, caché como fallback
  evt.respondWith(
    fetch(evt.request)
      .then((res) => {
        // Solo cachear respuestas válidas
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(clave, clone));
        }
        return res;
      })
      .catch(() => caches.match(clave))
  );
});
