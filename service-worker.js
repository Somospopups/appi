const CACHE_NAME = 'appi-v214-notificaciones-appi';
const CACHE_PREFIX = 'appi-';
const APP_SHELL = [
  './',
  './index.html',
  './auth-config.js',
  './appi-dialog.js',
  './auth-client.js',
  './data-sync.js',
  './admin-panel.js',
  './account-request.js',
  './qr-code.js',
  './gestion-client.js',
  './device-bridge.js',
  './encuesta.html',
  './historico.css',
  './historico.js',
  './manifest.json',
  './icon-192.png',
  './notification-badge.png',
  './icon-512.png',
  './icon-192-maskable.png',
  './icon-512-maskable.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.all(APP_SHELL.map(async url => {
        try {
          const response = await fetch(url, { cache: 'no-store' });
          if (response.ok) await cache.put(url, response);
        } catch (error) {
          // Un recurso opcional no debe impedir instalar el resto de la app.
        }
      })))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Los CDN, Supabase, mapas y APIs conservan su comportamiento de red normal.
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
          }
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // La lista de revocación anterior nunca se sirve desde una caché persistente.
  if (url.pathname.endsWith('/blocklist.json')) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }));
    return;
  }

  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        return cached || new Response('Recurso no disponible sin conexión.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      })
  );
});


// Solicitudes enviadas desde una PC o tablet a un teléfono vinculado.
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (error) {}
  const title = data.title || 'APPI';
  const options = {
    body: data.body || 'Tenés una nueva solicitud.',
    icon: './icon-192.png',
    badge: './notification-badge.png',
    tag: data.command_id ? `appi-command-${data.command_id}` : 'appi-device-command',
    renotify: true,
    requireInteraction: true,
    data: { url: data.url || './', command_id: data.command_id || '', type: data.type || '' },
    actions: [
      { action: 'open', title: data.type === 'call_request' ? 'Abrir llamada' : 'Abrir APPI' },
      { action: 'dismiss', title: 'Ahora no' }
    ]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const target = new URL(event.notification.data?.url || './', self.location.href).href;
  event.waitUntil((async () => {
    const windows = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      try {
        if ('navigate' in client) await client.navigate(target);
        return client.focus();
      } catch (error) {}
    }
    return clients.openWindow(target);
  })());
});
