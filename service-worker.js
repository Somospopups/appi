const CACHE_NAME = 'appi-v186-icono';
const ARCHIVOS = [
  './',
  './index.html',
  './historico.css',
  './historico.js',
  './manifest.json'
];

self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(ARCHIVOS.map((u) =>
        fetch(u, { cache: 'no-store' }).then((res) => {
          if (res && res.ok) return cache.put(u, res);
        }).catch(() => null)
      ))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
    .then(() => self.clients.matchAll({ type: 'window', includeUncontrolled: true }))
    .then((clients) => {
      clients.forEach((c) => {
        try { c.navigate(c.url); } catch (e) {
          try { c.postMessage({ type: 'appi-reload', v: CACHE_NAME }); } catch (e2) {}
        }
      });
    })
  );
});

self.addEventListener('fetch', (evt) => {
  if (evt.request.method !== 'GET') return;
  const url = new URL(evt.request.url);
  const sameOrigin = url.origin === self.location.origin;
  evt.respondWith(
    fetch(evt.request, { cache: 'no-store' })
      .then((res) => {
        if (sameOrigin && res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(evt.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(evt.request).then((r) => r || caches.match('./index.html')))
  );
});
