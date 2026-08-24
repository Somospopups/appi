const CACHE_NAME = 'appi-v329-publicar-anuncio';
const CACHE_PREFIX = 'appi-';
const APP_SHELL = [
  './',
  './index.html',
  './encuesta.html',
  './formulario-equipo.html',
  './revisar-contactos.html',
  './auth-config.js',
  './appi-dialog.js',
  './telefono.js',
  './whatsapp-app.js',
  './auth-client.js',
  './prueba-banner.js',
  './data-sync.js',
  './js/membership-admin.js',
  './admin-panel.js',
  './account-request.js',
  './qr-code.js',
  './gestion-client.js',
  './panel-atras.js',
  './tarjetas-promos.js',
  './usuarios-botones.js',
  './mensajes-usuarios.js',
  './reactivacion.js',
  './escalera-suenos.js',
  './demo-guia.js',
  './tablero-negocio.js',
  './stock-personal.js',
  './porque-vivo.js',
  './home-limpio.js',
  './home-tarjetas.js',
  './device-bridge.js',
  './anuncios.js',
  './css/membership-admin.css',
  './historico.css',
  './historico.js',
  './vendor/xlsx.full.min.js',
  './vendor/leaflet.css',
  './vendor/leaflet.js',
  './vendor/html2canvas.min.js',
  './vendor/jspdf.umd.min.js',
  './vendor/svg2pdf.umd.min.js',
  './vendor/jszip.min.js',
  './vendor/transformers.min.js',
  './vendor/images/layers.png',
  './vendor/images/layers-2x.png',
  './vendor/images/marker-icon.png',
  './vendor/images/marker-icon-2x.png',
  './vendor/images/marker-shadow.png',
  './vendor/images/marker-icon-2x-red.png',
  './vendor/images/marker-icon-2x-green.png',
  './vendor/images/marker-icon-2x-yellow.png',
  './vendor/images/marker-shadow-0.7.7.png',
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


// Cada tipo de aviso se agrupa con su propia etiqueta para que un recordatorio
// nunca reemplace una solicitud de llamada en la bandeja del teléfono.
function notificationTag(data) {
  if (data.command_id) return 'appi-command-' + data.command_id;
  if (data.type === 'daily_summary') return 'appi-daily-summary';
  if (data.type === 'presentation_reminder') return 'appi-presentation-' + (data.contacto_id || 'proxima');
  return 'appi-device-command';
}

function notificationLabel(type) {
  if (type === 'call_request') return 'Abrir llamada';
  if (type === 'daily_summary') return 'Ver Mi Gestión';
  if (type === 'presentation_reminder') return 'Ver contacto';
  return 'Abrir APPI';
}

// Solicitudes de llamada desde una PC o tablet y recordatorios de Mi Gestión.
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (error) {}
  const type = data.type || '';
  // Una llamada exige atención inmediata; un recordatorio puede esperar en la
  // bandeja sin bloquear la pantalla.
  const urgent = type === 'call_request';
  const title = data.title || 'APPI';
  const options = {
    body: data.body || 'Tenés una nueva solicitud.',
    icon: './icon-192.png',
    badge: './notification-badge.png',
    tag: notificationTag(data),
    renotify: true,
    requireInteraction: urgent,
    silent: false,
    data: {
      url: data.url || './',
      command_id: data.command_id || '',
      contacto_id: data.contacto_id || '',
      type: type
    },
    actions: [
      { action: 'open', title: notificationLabel(type) },
      { action: 'dismiss', title: 'Ahora no' }
    ]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

function notificationTarget(data = {}) {
  const scope = self.registration.scope || new URL('./', self.location.href).href;
  const scopeUrl = new URL(scope);
  let target;
  try { target = new URL(data.url || './', scopeUrl); } catch (error) { target = new URL('./', scopeUrl); }
  if (target.origin !== scopeUrl.origin || !target.href.startsWith(scopeUrl.href)) target = new URL('./', scopeUrl);
  const commandId = String(data.command_id || '');
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(commandId) && !target.searchParams.get('bridge_call')) {
    target.searchParams.set('bridge_call', commandId);
  }
  return target.href;
}

async function focusOrOpenNotification(target, data = {}) {
  const commandId = String(data.command_id || '');
  const message = {
    type: 'APPI_OPEN_COMMAND',
    url: target,
    command_id: commandId,
    notification: String(data.type || ''),
    contacto_id: String(data.contacto_id || '')
  };
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  const scoped = windows.filter(client => String(client.url || '').startsWith(self.registration.scope));
  for (const client of scoped) {
    try {
      client.postMessage(message);
      const focused = await client.focus();
      if (focused) return focused;
    } catch (error) {}
  }
  const opened = await self.clients.openWindow(target);
  if (opened) {
    try { opened.postMessage(message); } catch (error) {}
    try { return await opened.focus(); } catch (error) { return opened; }
  }
  return null;
}

self.addEventListener('notificationclick', event => {
  const data = event.notification.data || {};
  if (event.action === 'dismiss') {
    event.notification.close();
    return;
  }
  const target = notificationTarget(data);
  event.waitUntil((async () => {
    try {
      const client = await focusOrOpenNotification(target, data);
      event.notification.close();
      return client;
    } catch (error) {
      event.notification.close();
      throw error;
    }
  })());
});
