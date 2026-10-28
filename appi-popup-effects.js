/* APPI · Apertura suave para diálogos y paneles emergentes. */
(function () {
  'use strict';
  var overlaySelector = '.appi-dialog-overlay,.modal-overlay,.admin-login-overlay,.hist-detail-overlay,.hist-action-overlay,.gestion-detail-overlay,.appi-device-overlay,.demo-sheet,.st-ov,.tp-ov,.mg-modal,.bns-overlay,.cp-overlay,#lpFotoModal,#popupCompromisoPago,#lpSheet,#globalSearchOverlay,#canPdfZoomModal,[id$="Overlay"],[role="dialog"][aria-modal="true"],dialog[open]';
  var cardSelector = '[role="dialog"],.appi-dialog-card,.modal,.lp-sheet,.hist-detail-drawer,.hist-action-drawer,.gestion-drawer,.appi-device-card,.demo-sheet-card,.st-sheet,.tp-sheet,.mg-sheet,.bns-sheet,.cp-modal,.lp-foto-card,.gs-box';
  var known = new WeakMap();
  var audio = null;
  var hasGesture = false;
  var lastSound = 0;
  var queued = false;
  var reduced = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

  function gota() {
    if (!hasGesture || Date.now() - lastSound < 180) return;
    try {
      var Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return;
      if (!audio) audio = new Context();
      if (audio.state === 'suspended') audio.resume().catch(function () {});
      var t = audio.currentTime, oscillator = audio.createOscillator(), gain = audio.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(650, t);
      oscillator.frequency.exponentialRampToValueAtTime(1450, t + 0.08);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.14, t + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      oscillator.connect(gain); gain.connect(audio.destination);
      oscillator.start(t); oscillator.stop(t + 0.15);
      lastSound = Date.now();
    } catch (_) { /* El navegador puede restringir el audio. */ }
  }
  function desbloquear() {
    hasGesture = true;
    try {
      var Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return;
      if (!audio) audio = new Context();
      if (audio.state === 'suspended') audio.resume().catch(function () {});
    } catch (_) {}
  }
  document.addEventListener('pointerdown', desbloquear, { once: true, capture: true });
  document.addEventListener('keydown', desbloquear, { once: true, capture: true });

  function visible(el) {
    if (!el.isConnected || el.hidden || !el.getClientRects().length) return false;
    var s = getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden';
  }
  function animar(el) {
    var card = el.matches('dialog[open],[role="dialog"]') ? el : el.querySelector(cardSelector);
    if (!card) card = el.firstElementChild;
    if (!card || !card.animate || (reduced && reduced.matches)) return;
    try {
      card.animate([
        { opacity: 0, scale: '.84', offset: 0 },
        { opacity: 1, scale: '1.045', offset: .7 },
        { opacity: 1, scale: '1', offset: 1 }
      ], { duration: 520, easing: 'cubic-bezier(.2,.8,.25,1)' });
    } catch (_) { /* La apertura nunca depende de la animación. */ }
  }
  function scan(inicial) {
    queued = false;
    document.querySelectorAll(overlaySelector).forEach(function (el) {
      // No duplicar efectos en overlays anidados que se abren simultáneamente.
      var parent = el.parentElement && el.parentElement.closest(overlaySelector);
      if (parent && visible(parent)) return;
      var now = visible(el), previous = known.get(el);
      known.set(el, now);
      if (!inicial && now && previous !== true) { animar(el); gota(); }
    });
  }
  function requestScan() {
    if (!queued) { queued = true; requestAnimationFrame(function () { scan(false); }); }
  }
  function start() {
    scan(true);
    var observer = new MutationObserver(function (records) {
      for (var i = 0; i < records.length; i++) {
        var r = records[i], el = r.target.nodeType === 1 ? r.target : r.target.parentElement;
        if (el && (el.matches(overlaySelector) || el.closest(overlaySelector))) { requestScan(); return; }
        if (r.type === 'childList') {
          for (var j = 0; j < r.addedNodes.length; j++) {
            var node = r.addedNodes[j];
            if (node.nodeType === 1 && (node.matches(overlaySelector) || node.querySelector(overlaySelector))) { requestScan(); return; }
          }
        }
      }
    });
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style', 'hidden', 'open'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
