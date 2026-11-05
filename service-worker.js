const CACHE_NAME = 'appi-v918-inicio-inmediato';
const CACHE_PREFIX = 'appi-';
// Donde el SW aparta una compartición hasta que la app la consume. No
// empieza con el prefijo de la app para que el prune del activate no la borre.
const SHARE_QUEUE_CACHE = 'share-queue-v627';
function shareTargetPath(){ return new URL('./', self.registration.scope).pathname; }
function shareQueueUrl(){ return new URL('./.compartir/cola-v627.json', self.registration.scope); }
const APP_SHELL = [
  './',
  './index.html',
  './encuesta.html',
  './formulario-equipo.html',
  './revisar-contactos.html',
  './auth-config.js',
  './appi-vendors.js',
  './appi-dialog.js',
  './appi-popup-effects.js',
  './appi-notif.js',
  './recordatorios-app.js',
  './appi-onboarding.js',
  './reporte-bonos.js',
  './telefono.js',
  './whatsapp-app.js',
  './auth-client.js',
  './prueba-banner.js',
  './data-sync.js',
  './js/membership-admin.js',
  './admin-panel.js',
  './js/compromiso-pago.js',
  './account-request.js',
  './qr-code.js',
  './gestion-client.js',
  './appi-assistant.css',
  './appi-assistant.js',
  './appi-buscar.js',
  './appi-tour.js',
  './appi-tour.css',
  './appi-gotita.css',
  './appi-gotita.js',
  './appi-progreso.css',
  './appi-progreso.js',
  './agenda-personal.js',
  './margarita-contactos.js',
  './panel-atras.js',
  './tarjetas-promos.js',
  './usuarios-botones.js',
  './mensajes-hielo.js',
  './mensajes-usuarios.js',
  './campus-preguntas.js',
  './campus-psa.js',
  './reactivacion.js',
  './escalera-suenos.js',
  './demo-guia.js',
  './tablero-negocio.js',
  './lista-precios.js',
  './canillas-adaptadores.js',
  './stock-personal.js',
  './porque-vivo.js',
  './home-limpio.js',
  './home-tarjetas.js',
  './appi-eventos.js',
  './tu-mes.js',
  './device-bridge.js',
  './anuncios.js',
  './reuniones.js',
  './aviso-telegram.js',
  './appi-teclado.js',
  './css/membership-admin.css',
  './appi-tema.css',
  './historico.css',
  './historico.js',
  './manifest.json',
  './icon-192.png',
  './notification-badge.png',
  './icon-512.png',
  './icon-192-maskable.png',
  './icon-512-maskable.png',
  './apple-touch-icon.png',
  './img/rinnova-ducha.jpg',
  './promo-botella-psa-500ml.jpg',
  './psa-beneficios.json',
  './psa-comparativas.json',
  './comparativas-img/senior4.jpg',
  './comparativas-img/senior.jpg',
  './comparativas-img/s1000.jpg',
  './comparativas-img/senik.jpg',
  './comparativas-img/burby.jpg'
];

// No compiten con el primer dibujo ni con la instalación crítica. APPI los
// guarda más tarde, de a uno, y también quedan cacheados cuando una herramienta
// los pide mediante appi-vendors.js.
const OPTIONAL_SHELL = [
  './vendor/hls.min.js',
  './vendor/pdf.min.js',
  './vendor/pdf.worker.min.js',
  './vendor/zxing.min.js',
  './vendor/xlsx.full.min.js',
  './vendor/html2canvas.min.js',
  './vendor/jspdf.umd.min.js',
  './vendor/svg2pdf.umd.min.js',
  './vendor/jszip.min.js',
  './vendor/transformers.min.js'
];

async function warmOptionalShell(){
  const cache=await caches.open(CACHE_NAME);
  for(const url of OPTIONAL_SHELL){
    if(await cache.match(url,{ignoreSearch:true}))continue;
    try{
      const response=await fetchWithTimeout(url,12000);
      if(response.ok)await cache.put(url,response);
    }catch(error){}
  }
}
self.addEventListener('message', event=>{
  if(!event.data)return;
  if(event.data.type==='SKIP_WAITING')self.skipWaiting();
  if(event.data.type==='APPI_WARM_OPTIONAL')event.waitUntil(warmOptionalShell());
});
const CORE_SHELL = ['./', './index.html', './manifest.json'];

async function fetchWithTimeout(request, timeoutMs = 7000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(request, { cache: 'no-store', signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // El HTML es obligatorio: una actualización incompleta nunca debe borrar la
    // última versión que sí arrancaba. Los demás recursos se pueden completar
    // en segundo plano o durante el uso.
    for (const url of CORE_SHELL) {
      const response = await fetchWithTimeout(url, 10000);
      if (!response.ok) throw new Error(`No se pudo guardar el inicio: ${url}`);
      await cache.put(url, response);
    }
    await Promise.allSettled(APP_SHELL.filter(url => !CORE_SHELL.includes(url)).map(async url => {
      const response = await fetchWithTimeout(url, 10000);
      if (response.ok) await cache.put(url, response);
    }));
    await self.skipWaiting();
  })());
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
  const url = new URL(event.request.url);

  // "Compartir contacto → APPI" (share_target de Android): el sistema hace
  // un POST multipart a la app instalada. El SW lo atrapa, aparta lo
  // compartido para que la página lo importe y redirige a la app normal.
  // iOS no ofrece esto; ahí se usa "Subir agenda (.vcf)".
  if (event.request.method === 'POST' && url.origin === self.location.origin && url.pathname === shareTargetPath()) {
    event.respondWith((async () => {
      let form;
      try { form = await event.request.formData(); } catch (error) { return Response.redirect(new URL('./', self.registration.scope).href, 303); }
      const file = form.get('file');
      let texto = '';
      if (file && file.size){ try { texto = await file.text(); } catch (error) {} }
      if (!texto) texto = form.get('text') || form.get('title') || '';
      const items = texto ? [{ texto: String(texto), origen: String((file && file.name) || 'contacto'), ts: Date.now() }] : [];
      // Respaldo: queda en una cola por si la página no está lista aún.
      try {
        const cache = await caches.open(SHARE_QUEUE_CACHE);
        let prev = [];
        try { const prevRes = await cache.match(shareQueueUrl()); prev = prevRes ? await prevRes.json() : []; } catch (e) {}
        await cache.put(shareQueueUrl(), new Response(JSON.stringify(prev.concat(items).slice(-20)), {
          headers: { 'Content-Type': 'application/json' }
        }));
      } catch (e) {}
      // Aviso a la página abierta (o a la que está por abrirse).
      if (items.length) {
        const message = { type: 'APPI_SHARE_RECEIVED', items: items };
        try {
          const client = await self.clients.get(event.resultingClientId);
          if (client) client.postMessage(message);
        } catch (e) {}
        try {
          const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
          for (const win of windows) { try { win.postMessage(message); } catch (e) {} }
        } catch (e) {}
      }
      return Response.redirect(new URL('./', self.registration.scope).href, 303);
    })());
    return;
  }

  // Drenaje de la cola de compartición: le entrega a la página lo que quedó
  // y lo saca de una (un solo GET lo consume entero).
  if (event.request.method === 'GET' && url.origin === self.location.origin && url.pathname === shareQueueUrl().pathname) {
    event.respondWith((async () => {
      try {
        const cache = await caches.open(SHARE_QUEUE_CACHE);
        const hit = await cache.match(shareQueueUrl());
        if (hit) { await cache.delete(shareQueueUrl()); return hit; }
      } catch (e) {}
      return new Response('[]', { headers: { 'Content-Type': 'application/json' } });
    })());
    return;
  }

  if (event.request.method !== 'GET') return;

  // Los CDN, Supabase, mapas y APIs conservan su comportamiento de red normal.
  if (url.origin !== self.location.origin) return;

  // Precios y beneficios: se busca siempre la fuente más nueva. Si no hay
  // conexión, se usa la copia instalada; las campañas igual vencen por fecha.
  if (/\/psa-(precios|catalogo|planes|ganancias|beneficios)\.json$/.test(url.pathname)) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(function(){
        return caches.match(event.request, { ignoreSearch: true }).then(function (hit) {
          return hit || new Response('{}', { status: 503, headers: { 'Content-Type': 'application/json' } });
        });
      })
    );
    return;
  }

  if (event.request.mode === 'navigate') {
    // La pantalla nativa de Android no puede quedar esperando una red móvil que
    // parece conectada pero no responde. Servimos el HTML guardado de inmediato
    // y lo renovamos detrás; sin copia, la red tiene un límite estricto.
    const fresh = (async () => {
      const response = await fetchWithTimeout(event.request, 7000);
      if (!response.ok) throw new Error(`Navegación ${response.status}`);
      const cache = await caches.open(CACHE_NAME);
      await Promise.all([
        cache.put('./index.html', response.clone()),
        cache.put('./', response.clone())
      ]);
      return response;
    })();
    event.waitUntil(fresh.then(() => undefined, () => undefined));
    event.respondWith((async () => {
      const cached = await caches.match('./index.html') || await caches.match('./');
      if (cached) return cached;
      try { return await fresh; }
      catch (error) {
        return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{margin:0;background:#06172d;color:#fff;font:600 16px system-ui;display:grid;place-items:center;min-height:100vh;text-align:center;padding:24px;box-sizing:border-box}</style><div><b>APPI</b><p>No pudimos abrir la copia guardada.<br>Revisá la conexión y volvé a intentar.</p></div>', {
          status: 503,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }
    })());
    return;
  }

  // Scripts y estilos guardados se entregan primero. Esto evita que cuatro
  // hojas de estilo bloqueen el primer dibujo y dejen visible para siempre el
  // splash nativo de Android. La red los actualiza sin frenar la apertura.
  const fresh = (async () => {
    const response = await fetchWithTimeout(event.request, 7000);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(event.request, response.clone());
    }
    return response;
  })();
  event.waitUntil(fresh.then(() => undefined, () => undefined));
  event.respondWith((async () => {
    const cached = await caches.match(event.request, { ignoreSearch: true });
    if (cached) return cached;
    try { return await fresh; }
    catch (error) {
      return new Response('Recurso no disponible sin conexión.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
  })());
});


// Cada tipo de aviso se agrupa con su propia etiqueta para que un recordatorio
// nunca reemplace una solicitud de llamada en la bandeja del teléfono.
function notificationTag(data) {
  if (data.command_id) return 'appi-command-' + data.command_id;
  if (data.type === 'daily_summary') return 'appi-daily-summary';
  if (data.type === 'presentation_reminder') return 'appi-presentation-' + (data.contacto_id || 'proxima');
  if (data.type === 'anuncio') return 'appi-anuncio-' + (data.id || 'aviso');
  if (data.type === 'accion') return 'appi-actions';
  if (data.tag) return data.tag;
  return 'appi-device-command';
}

function notificationLabel(type) {
  if (type === 'call_request') return 'Abrir llamada';
  if (type === 'daily_summary') return 'Ver Mi Gestión';
  if (type === 'presentation_reminder') return 'Ver contacto';
  if (type === 'anuncio') return 'Ver aviso';
  if (type === 'accion') return 'Ver acciones';
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
  const iconAbs = new URL('./icon-192.png', self.registration.scope).href;
  const badgeAbs = new URL('./notification-badge.png', self.registration.scope).href;
  const options = {
    body: data.body || 'Tenés una nueva solicitud.',
    icon: iconAbs,
    badge: badgeAbs,
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
