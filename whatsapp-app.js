/* ============================================================
   APPI · Elegir con qué WhatsApp se envía
   ------------------------------------------------------------
   Problema: los enlaces wa.me son enlaces web comunes. Cuando el
   teléfono tiene WhatsApp y WhatsApp Business, Android se los
   entrega a la app marcada como predeterminada para esos links,
   y no siempre es la que el distribuidor quiere usar.

   Solución: en Android usamos un enlace intent:// que nombra el
   paquete exacto (com.whatsapp o com.whatsapp.w4b). En el resto
   de las plataformas se mantiene wa.me, que funciona bien.
   ============================================================ */
(function(){
  'use strict';

  var LS_KEY = 'appi_whatsapp_app';       // 'normal' | 'business' | 'preguntar'
  var PKG = { normal: 'com.whatsapp', business: 'com.whatsapp.w4b' };
  var NOMBRE = { normal: 'WhatsApp', business: 'WhatsApp Business' };

  function esAndroid(){
    return /android/i.test(navigator.userAgent || '');
  }

  function preferencia(){
    try{
      var v = localStorage.getItem(LS_KEY);
      return (v === 'normal' || v === 'business') ? v : '';
    }catch(e){ return ''; }
  }

  function setPreferencia(valor){
    try{
      if(valor === 'normal' || valor === 'business') localStorage.setItem(LS_KEY, valor);
      else localStorage.removeItem(LS_KEY);
    }catch(e){}
    return valor;
  }

  // Separa un enlace wa.me / api.whatsapp.com en número y texto.
  function partirEnlace(url){
    var out = { numero: '', texto: '' };
    var s = String(url || '');
    try{
      var u = new URL(s, location.href);
      if(/^\/(\d+)/.test(u.pathname)) out.numero = u.pathname.replace(/[^\d]/g, '');
      if(u.searchParams.get('phone')) out.numero = String(u.searchParams.get('phone')).replace(/[^\d]/g, '');
      out.texto = u.searchParams.get('text') || '';
    }catch(e){
      var m = s.match(/wa\.me\/(\d+)/);       if(m) out.numero = m[1];
      var p = s.match(/[?&]phone=(\d+)/);     if(p) out.numero = p[1];
      var t = s.match(/[?&]text=([^&]*)/);    if(t){ try{ out.texto = decodeURIComponent(t[1].replace(/\+/g,' ')); }catch(e2){ out.texto = t[1]; } }
    }
    return out;
  }

  // Construye el enlace final según la app elegida.
  // Sin preferencia o fuera de Android: wa.me de siempre.
  function construir(url, app){
    var d = partirEnlace(url);
    var pkg = PKG[app];
    if(!pkg || !esAndroid()){
      var base = 'https://wa.me/' + (d.numero || '');
      return d.texto ? base + '?text=' + encodeURIComponent(d.texto) : base;
    }
    // intent://send?phone=...&text=...  con el paquete explícito.
    var q = [];
    if(d.numero) q.push('phone=' + d.numero);
    if(d.texto)  q.push('text='  + encodeURIComponent(d.texto));
    var fallback = 'https://wa.me/' + (d.numero || '') + (d.texto ? '?text=' + encodeURIComponent(d.texto) : '');
    return 'intent://send' + (q.length ? '?' + q.join('&') : '') +
           '#Intent;scheme=whatsapp;package=' + pkg +
           ';S.browser_fallback_url=' + encodeURIComponent(fallback) + ';end';
  }

  // Diálogo de elección. Devuelve 'normal' | 'business' | '' (cancelado).
  function preguntar(opts){
    opts = opts || {};
    var titulo = opts.titulo || '¿Con cuál WhatsApp?';
    var mensaje = opts.mensaje || 'Tenés WhatsApp y WhatsApp Business en este teléfono. Elegí con cuál querés enviar los mensajes de APPI.';
    if(window.APPIDialog && typeof window.APPIDialog.choose === 'function'){
      return window.APPIDialog.choose(mensaje, [
        { value: 'normal',   label: '💬 WhatsApp' },
        { value: 'business', label: '💼 WhatsApp Business' }
      ], { title: titulo, icon: '📱', cancelText: 'Cancelar' }).then(function(r){
        return (r === 'normal' || r === 'business') ? r : '';
      });
    }
    return Promise.resolve('');
  }

  /* Abre WhatsApp respetando la preferencia del distribuidor.
     - url: cualquier enlace wa.me / api.whatsapp.com de la app.
     - opts.popup: pestaña ya abierta dentro del gesto del usuario
       (para no perder el permiso de ventana emergente).
     Nunca lanza: si algo falla, cae al wa.me original. */
  function abrir(url, opts){
    opts = opts || {};
    var popup = opts.popup || null;

    function ir(destino){
      try{
        if(popup && !popup.closed){ popup.location.href = destino; return true; }
      }catch(e){}
      try{
        var w = window.open(destino, '_blank');
        if(w) return true;
      }catch(e){}
      try{ window.location.href = destino; }catch(e){}
      return true;
    }

    var pref = preferencia();

    // Sin Android no hay ambigüedad de paquetes: enlace de siempre.
    if(!esAndroid()) return Promise.resolve(ir(construir(url, '')));
    if(pref) return Promise.resolve(ir(construir(url, pref)));

    // Primera vez en Android: preguntamos una sola vez y recordamos.
    return preguntar().then(function(elegida){
      if(!elegida){
        // Si no eligió, no lo trabamos: abrimos como siempre y volvemos a preguntar la próxima.
        return ir(construir(url, ''));
      }
      setPreferencia(elegida);
      return ir(construir(url, elegida));
    }).catch(function(){
      return ir(construir(url, ''));
    });
  }

  // Cambiar la preferencia desde el menú de herramientas.
  function elegirDesdeAjustes(){
    var actual = preferencia();
    var mensaje = actual
      ? 'Ahora los mensajes de APPI se abren en ' + NOMBRE[actual] + '. ¿Con cuál querés enviarlos?'
      : 'Elegí con qué aplicación querés que APPI abra los mensajes de WhatsApp.';
    return preguntar({ titulo: 'WhatsApp para enviar', mensaje: mensaje }).then(function(elegida){
      if(!elegida) return actual;
      setPreferencia(elegida);
      if(typeof window.showToast === 'function') window.showToast('Se enviará por ' + NOMBRE[elegida]);
      if(typeof window.actualizarWhatsAppMenuUI === 'function') window.actualizarWhatsAppMenuUI();
      return elegida;
    });
  }

  /* Interceptor global: cualquier enlace <a> a wa.me / api.whatsapp.com
     pasa por la preferencia, sin tener que tocar cada pantalla.
     Se salta si el enlace pide explícitamente no ser interceptado. */
  function esEnlaceWhatsApp(href){
    return /^https?:\/\/(?:www\.)?(?:wa\.me|api\.whatsapp\.com)\//i.test(String(href || ''));
  }

  document.addEventListener('click', function(ev){
    try{
      if(ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey) return;
      if(!esAndroid()) return;                       // fuera de Android, wa.me anda bien
      var a = ev.target && ev.target.closest ? ev.target.closest('a[href]') : null;
      if(!a || a.hasAttribute('data-no-wa-intent')) return;
      if(!esEnlaceWhatsApp(a.getAttribute('href'))) return;
      ev.preventDefault();
      abrir(a.href);
    }catch(e){}
  }, true);

  window.APPIWhatsApp = {
    esEnlaceWhatsApp: esEnlaceWhatsApp,
    abrir: abrir,
    construir: construir,
    partirEnlace: partirEnlace,
    preferencia: preferencia,
    setPreferencia: setPreferencia,
    elegirDesdeAjustes: elegirDesdeAjustes,
    esAndroid: esAndroid,
    nombre: function(v){ return NOMBRE[v || preferencia()] || ''; },
    LS_KEY: LS_KEY
  };
})();
