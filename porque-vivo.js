/* ============================================================
   APPI · Porqué vivo (v243)
   ------------------------------------------------------------
   El "para qué" es el combustible del negocio, y el material lo
   enseña con una cadena de preguntas: ¿para qué? → ¿y eso, para
   qué? Ahora ese ejercicio vive en la Escalera de Sueños:

   - Guía interactiva que excava hasta 5 niveles.
   - La cadena queda guardada y se muestra como raíces: la última
     respuesta es el motor.
   - Dos burbujas amenas la primera vez, y botón para compartirla.
   ============================================================ */
(function(){
  'use strict';
  function $(id){ return document.getElementById(id); }
  function uid(){ return window.APPIAuth && window.APPIAuth.userId ? window.APPIAuth.userId() : ''; }
  function clave(){ return 'appi_porque_v1_' + uid(); }
  function leer(){ try{ return JSON.parse(localStorage.getItem(clave()) || 'null'); }catch(e){ return null; } }
  function guardar(v){ try{ localStorage.setItem(clave(), JSON.stringify(v)); }catch(e){} }
  function esc(s){ return String(s == null ? '' : s).replace(/</g, '&lt;'); }

  var PREGUNTAS = [
    '¿Qué querés lograr con esta actividad?',
    'Y eso… ¿para qué?',
    'Un paso más adentro: ¿para qué?',
    '¿Y por qué eso es importante para vos?',
    'Última pala: ¿qué te da eso que hoy no tenés?'
  ];

  function estilo(){
    if ($('porqueStyle')) return;
    var s = document.createElement('style');
    s.id = 'porqueStyle';
    s.textContent = '' +
      '.pk-card{margin:12px 2px;padding:14px;border-radius:18px;background:linear-gradient(135deg,rgba(255,107,159,.10),rgba(139,99,232,.12));border:1px solid rgba(255,107,159,.3)}' +
      '.pk-title{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:950;color:#c2417a}' +
      '.pk-sub{margin:4px 0 10px;font-size:11px;font-weight:750;color:#686977;line-height:1.5}' +
      'body.dark .pk-sub{color:#b8b9c5}' +
      '.pk-input{width:100%;min-height:46px;border:1px solid rgba(80,90,130,.2);border-radius:12px;padding:9px 11px;font:inherit;font-size:13px;background:rgba(255,255,255,.85);color:#292938}' +
      'body.dark .pk-input{background:#1d1f31;color:#f2f2f7}' +
      '.pk-actions{display:flex;gap:8px;margin-top:9px}' +
      '.pk-next{flex:1;border:0;border-radius:12px;padding:10px;background:linear-gradient(135deg,#ff6b9d,#8b63e8);color:#fff;font:inherit;font-size:12.5px;font-weight:900;cursor:pointer}' +
      '.pk-fondo{border:0;border-radius:12px;padding:10px 12px;background:rgba(80,90,130,.1);color:#666776;font:inherit;font-size:11px;font-weight:850;cursor:pointer}' +
      '.pk-nivel{display:flex;gap:9px;align-items:flex-start;margin:7px 0}' +
      '.pk-nivel .pk-flecha{color:#c2417a;font-weight:950}' +
      '.pk-nivel p{margin:0;font-size:12px;font-weight:750;color:#343441;line-height:1.45}' +
      'body.dark .pk-nivel p{color:#e6e6f0}' +
      '.pk-nivel.final p{font-size:13.5px;font-weight:950;color:#c2417a}' +
      '.pk-motor{margin-top:9px;padding:10px 12px;border-radius:12px;background:rgba(194,65,122,.08);font-size:11.5px;font-weight:800;color:#c2417a;line-height:1.5}' +
      '.pk-mini{margin-top:9px;border:1px solid rgba(194,65,122,.3);border-radius:10px;padding:7px 11px;background:rgba(194,65,122,.08);color:#c2417a;font:inherit;font-size:11px;font-weight:850;cursor:pointer}';
    document.head.appendChild(s);
  }

  function htmlCard(){
    var v = leer();
    var cadena = '';
    if (v && v.niveles && v.niveles.length) {
      cadena = v.niveles.map(function(n, i){
        var fin = i === v.niveles.length - 1;
        return '<div class="pk-nivel' + (fin ? ' final' : '') + '"><span class="pk-flecha">' + (i === 0 ? '🌱' : '↓') + '</span><p>' + esc(n) + '</p></div>';
      }).join('') +
      '<div class="pk-motor">🔥 Este último “para qué” es tu motor. Cuando el día se ponga difícil, releelo: ahí está tu combustible.</div>' +
      '<div class="pk-actions"><button type="button" class="pk-mini" id="pkShare">📤 Compartirlo</button><button type="button" class="pk-mini" id="pkRedo">⛏️ Excavar de nuevo</button></div>';
    }
    return '<div class="pk-card" id="porqueCard">' +
      '<div class="pk-title">🔥 Excavá tu porqué</div>' +
      '<div class="pk-sub">El material te lo enseña así: cada respuesta esconde una más profunda. Contestá y dejá que la app excave contigo.</div>' +
      (cadena || '') +
      '<div id="pkForm"><label class="pk-sub" id="pkPregunta" style="display:block">' + PREGUNTAS[0] + '</label>' +
      '<input class="pk-input" id="pkRespuesta" maxlength="140" placeholder="Tu respuesta, con tus palabras…">' +
      '<div class="pk-actions"><button type="button" class="pk-next" id="pkNext">⛏️ Excavar</button>' +
      '<button type="button" class="pk-fondo" id="pkStop" hidden>Llegué al fondo 💙</button></div></div></div>';
  }

  var estado = null;
  function montar(){
    var host = $('view-suenos');
    if (!host) return;
    estilo();
    var viejo = $('porqueWrap');
    if (viejo) viejo.remove();
    var wrap = document.createElement('div');
    wrap.id = 'porqueWrap';
    wrap.innerHTML = htmlCard();
    host.appendChild(wrap);
    estado = { niveles: (leer() && leer().niveles) || [], nivel: 0 };

    var pregunta = $('pkPregunta'), input = $('pkRespuesta'), next = $('pkNext'), stop = $('pkStop');
    var form = $('pkForm');
    if (leer() && leer().niveles && leer().niveles.length) form.style.display = 'none';

    function avanzar(){
      var r = input.value.trim();
      if (r.length < 3) { input.focus(); return; }
      estado.niveles.push(r);
      estado.nivel++;
      input.value = '';
      if (estado.nivel >= PREGUNTAS.length) return terminar();
      pregunta.textContent = PREGUNTAS[estado.nivel];
      stop.hidden = estado.nivel < 2;
      input.focus();
    }
    function terminar(){
      var r = input.value.trim();
      if (r.length >= 3) estado.niveles.push(r);
      if (!estado.niveles.length) { input.focus(); return; }
      guardar({ niveles: estado.niveles, fecha: Date.now() });
      montar();
    }
    next.onclick = avanzar;
    input.onkeydown = function(e){ if (e.key === 'Enter') avanzar(); };
    stop.onclick = terminar;
    var share = $('pkShare');
    if (share) share.onclick = function(){
      var v = leer();
      var msg = '🔥 Mi porqué, excavado con APPI:\n' + v.niveles.map(function(n, i){ return (i === 0 ? '🌱 ' : '↓ ') + n; }).join('\n') + '\n\nEste último es mi motor. 💙';
      var url = 'https://wa.me/?text=' + encodeURIComponent(msg);
      if (window.APPIWhatsApp && window.APPIWhatsApp.abrir) window.APPIWhatsApp.abrir(url);
      else window.open(url, '_blank', 'noopener');
    };
    var redo = $('pkRedo');
    if (redo) redo.onclick = function(){ guardar({ niveles: [], fecha: Date.now() }); montar(); };
  }
  window.montarPorque = montar;

  function envolver(){
    if (window.__porqueWrapped) return;
    if (typeof window.showView !== 'function') return;
    window.__porqueWrapped = true;
    var orig = window.showView;
    window.showView = function(id){ var r = orig.apply(this, arguments); try{ if (id === 'view-suenos') montar(); }catch(e){} return r; };
    if (typeof window.openSuenos === 'function') {
      var origS = window.openSuenos;
      window.openSuenos = function(){ var r = origS.apply(this, arguments); try{ montar(); }catch(e){} return r; };
    }
  }
  if (document.readyState === 'complete') envolver();
  else window.addEventListener('load', envolver);
  setTimeout(envolver, 1200);
})();
