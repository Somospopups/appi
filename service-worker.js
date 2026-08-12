const CACHE_NAME = 'appi-v125';
const ARCHIVOS = [
  './',
  './index.html',
  './manifest.json'
];

// Instalar: guardar archivos en caché
self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ARCHIVOS))
  );
  self.skipWaiting();
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

// Fetch: servir desde caché si no hay internet
self.addEventListener('fetch', (evt) => {
  if (evt.request.method !== 'GET') return;
  evt.respondWith(
    fetch(evt.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(evt.request, clone));
        return res;
      })
      .catch(() => caches.match(evt.request).then((r) => r || caches.match('./index.html')))
  );
});
