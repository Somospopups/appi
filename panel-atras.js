/* APPI · El gesto de "atrás" cierra el panel abierto, no la pantalla
 *
 * En el teléfono, el gesto de volver es lo primero que se usa para descartar
 * algo que se abrió encima. Antes ese gesto sacaba de la pantalla entera: se
 * abría Zonas, se hacía el gesto y APPI volvía al Home, perdiendo el trabajo.
 *
 * Este módulo vigila los paneles de toda la app. Cuando uno se abre, agrega una
 * entrada al historial; cuando llega el gesto de volver, la consume cerrando el
 * panel y corta ahí, sin dejar que la app navegue.
 *
 * Se carga antes que el resto para que su escucha de `popstate` corra primera:
 * si había un panel abierto, los demás no se enteran del gesto.
 */
(function(){
  'use strict';

  // Cada panel que se abre encima de la pantalla. Se listan por id o por clase
  // porque conviven varias formas de armarlos (algunos nacen con el HTML, otros
  // los crea el JS la primera vez que se usan).
  var PANELES = [
    '#ubOverlay',              // Zonas y Tarjetas de Usuarios
    '#muOverlay',              // plantillas de mensajes
    '#tpOverlay',              // elegir marca y banco de una tarjeta
    '#histDetailOverlay',      // detalle del Histórico
    '#histActionOverlay',      // Centro de Acción del Histórico
    '#gestionDetailOverlay',   // ficha de un contacto del Panel
    '#stOverlay',              // Mi stock
    '#appiDeviceOverlay',      // teléfonos vinculados
    '#calModal',               // calendario
    '#demoObjectionSheet',     // objeciones del Coach de Demo
    '#orgCanvas',              // organización del equipo
    '#adminLoginOverlay',      // ingreso de administración
    '.appi-dialog-overlay',    // avisos y confirmaciones
    '#appiDialogOverlay'
  ];

  // Estos no: son pasos que hay que completar, no paneles que se descartan.
  // Cerrarlos con el gesto dejaría a la persona en una pantalla sin salida.
  var NUNCA = ['#forcedPasswordOverlay', '#personChoiceOverlay'];

  var MARCA = 'appiPanel';   // marca de nuestras entradas en el historial
  var pendiente = false;     // ya hay una entrada puesta por un panel abierto
  var devolviendo = false;   // estamos sacando nuestra entrada, no navegando
  var urlAlDevolver = '';    // dirección vigente al momento de devolverla

  function esVisible(el){
    if (!el) return false;
    if (el.hidden) return false;
    var cs = window.getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    // Muchos paneles existen siempre en el DOM y se muestran con la clase open.
    if (el.classList.contains('open')) return true;
    // Otros se muestran quitando `hidden` o poniendo display en línea.
    if (el.getAttribute('aria-hidden') === 'true') return false;
    return cs.display !== 'none';
  }

  function excluido(el){
    for (var i = 0; i < NUNCA.length; i++){
      if (el.matches && el.matches(NUNCA[i])) return true;
    }
    return false;
  }

  function abiertos(){
    var out = [];
    PANELES.forEach(function(sel){
      var nodos = document.querySelectorAll(sel);
      for (var i = 0; i < nodos.length; i++){
        if (!excluido(nodos[i]) && esVisible(nodos[i])) out.push(nodos[i]);
      }
    });
    return out;
  }

  // Cierra un panel por la puerta que tenga: primero su propio botón de cerrar,
  // que además desengancha lo que haga falta; si no hay, se le quita la clase.
  function cerrar(el){
    var botones = [
      '#ubCerrar', '#tpCancel', '#histDetailClose', '#histActionClose',
      '[data-cerrar]', '.ub-close', '.hist-detail-head button',
      '[aria-label="Cerrar"]', '.appi-dialog-cancel'
    ];
    for (var i = 0; i < botones.length; i++){
      var b = el.querySelector(botones[i]);
      if (b && typeof b.click === 'function'){
        try { b.click(); } catch (e) {}
        if (!esVisible(el)) return true;
      }
    }
    el.classList.remove('open');
    if (el.hasAttribute('aria-hidden')) el.setAttribute('aria-hidden', 'true');
    if (!esVisible(el)) return true;
    el.hidden = true;
    return true;
  }

  // El gesto cierra todo lo que esté abierto de una vez: si un panel llevó a
  // otro, volver debería devolver a la pantalla, no hacer el camino al revés.
  function cerrarTodos(){
    var lista = abiertos();
    for (var i = lista.length - 1; i >= 0; i--) cerrar(lista[i]);
    return lista.length > 0;
  }

  // Escucha registrada antes que ninguna otra: si había un panel abierto, el
  // gesto se gasta acá y la app no llega a cambiar de pantalla.
  window.addEventListener('popstate', function(e){
    // Cuando el panel se cerró con la ✕ devolvemos nuestra entrada del
    // historial. Ese popstate es de limpieza: la app no debe leerlo como un
    // pedido de volver, o saltaría a la pantalla anterior sola.
    if (devolviendo){
      devolviendo = false;
      // Volver atrás también restaura la dirección que había cuando se abrió el
      // panel. Si mientras tanto la app la cambió (el puente de teléfonos, por
      // ejemplo, limpia su parámetro al cerrar), se conserva la de ahora.
      try {
        if (urlAlDevolver && location.href !== urlAlDevolver){
          history.replaceState(history.state, '', urlAlDevolver);
        }
      } catch (err) {}
      urlAlDevolver = '';
      e.stopImmediatePropagation();
      return;
    }
    if (!pendiente) return;
    pendiente = false;
    if (cerrarTodos()){
      e.stopImmediatePropagation();
    }
  }, true);

  // Vigila la aparición de paneles sin tener que tocar el código de cada uno:
  // los hay que nacen con el HTML y otros que el JS crea al vuelo.
  function revisar(){
    var hay = abiertos().length > 0;
    if (hay && !pendiente){
      pendiente = true;
      try { history.pushState({ appiPanel: true, marca: MARCA }, ''); } catch (err) { pendiente = false; }
    } else if (!hay && pendiente){
      // Se cerró con la ✕, con Escape o tocando afuera: se devuelve la entrada
      // que habíamos agregado, si no quedaría uno de más en el historial.
      pendiente = false;
      try {
        if (history.state && history.state.appiPanel){
          devolviendo = true;
          urlAlDevolver = location.href;
          history.back();
        }
      } catch (err) { devolviendo = false; }
    }
  }

  // Sin espera: entre que se abre un panel y que se registra la entrada hay una
  // ventana en la que el gesto todavía navegaría. Con datos de verdad esa
  // ventana se nota, así que se revisa apenas cambia el DOM.
  function revisarPronto(){ revisar(); }

  function arrancar(){
    var obs = new MutationObserver(revisarPronto);
    obs.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class', 'hidden', 'style', 'aria-hidden']
    });
    revisar();
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', arrancar);
  } else {
    arrancar();
  }

  window.APPIPanelAtras = {
    abiertos: abiertos,
    cerrarTodos: cerrarTodos,
    hayPendiente: function(){ return pendiente; }
  };
})();
