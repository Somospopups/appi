/* ============================================================
   APPI · Escalera de Sueños (v230)
   ------------------------------------------------------------
   El ejercicio del paso 1 de la formación, digitalizado:
   el "para qué" del negocio y la escalera de 7 sueños
   (del primero al séptimo), editable y compartible.
   ============================================================ */
(function(){
  'use strict';

  function uid(){
    return window.APPIAuth && window.APPIAuth.userId ? window.APPIAuth.userId() : '';
  }
  function clave(){ return 'appi_suenos_v1_' + uid(); }

  function leer(){
    try{
      var v = JSON.parse(localStorage.getItem(clave()) || 'null');
      if (v && Array.isArray(v.suenos)) return v;
    }catch(e){}
    return { para_que: '', suenos: [ '', '', '', '', '', '', '' ] };
  }
  function guardar(v){
    try{ localStorage.setItem(clave(), JSON.stringify(v)); }catch(e){}
  }

  function estilo(){
    if (document.getElementById('suenosStyle')) return;
    var s = document.createElement('style');
    s.id = 'suenosStyle';
    s.textContent = '.suenos-wrap{padding:14px}' +
      '.suenos-pq{margin:0 0 14px;padding:13px;border-radius:16px;background:linear-gradient(135deg,rgba(91,141,239,.12),rgba(139,99,232,.12));border:1px solid rgba(91,141,239,.25)}' +
      '.suenos-pq h3{margin:0 0 6px;font-size:13px;color:#3d63c9}' +
      '.suenos-pq textarea{width:100%;min-height:64px;border:1px solid rgba(80,90,130,.2);border-radius:12px;padding:9px;font:inherit;font-size:12px;background:rgba(255,255,255,.8);color:#292938}' +
      'body.dark .suenos-pq textarea{background:#1d1f31;color:#f2f2f7}' +
      '.sueno-item{display:flex;align-items:center;gap:9px;margin:0 0 8px}' +
      '.sueno-num{min-width:30px;height:30px;border-radius:10px;display:grid;place-items:center;background:linear-gradient(135deg,#5b8def,#8b63e8);color:#fff;font-size:12px;font-weight:950}' +
      '.sueno-item input{flex:1;min-width:0;border:1px solid rgba(80,90,130,.2);border-radius:12px;padding:10px;font:inherit;font-size:12.5px;background:rgba(255,255,255,.8);color:#292938}' +
      'body.dark .sueno-item input{background:#1d1f31;color:#f2f2f7}' +
      '.suenos-acciones{display:flex;gap:8px;margin-top:12px}' +
      '.suenos-acciones button{flex:1;min-height:44px;border:0;border-radius:13px;font:inherit;font-size:12.5px;font-weight:900;cursor:pointer}' +
      '.suenos-share{background:linear-gradient(135deg,#3ad0a4,#5b8def);color:#fff}';
    document.head.appendChild(s);
  }

  function render(){
    var cont = document.getElementById('suenosCont');
    if (!cont) return;
    estilo();
    var v = leer();
    var filas = '';
    // El sueño 1 va abajo, como en la escalera de papel.
    for (var i = 6; i >= 0; i--) {
      filas += '<div class="sueno-item"><span class="sueno-num">' + (i + 1) + '</span>' +
        '<input data-sueno="' + i + '" maxlength="90" placeholder="' + (i === 0 ? 'Tu primer sueño, el más cercano' : 'Sueño ' + (i + 1)) + '" value="' + String(v.suenos[i] || '').replace(/"/g, '&quot;') + '"></div>';
    }
    cont.innerHTML = '<div class="suenos-wrap">' +
      '<div class="suenos-pq"><h3>💙 Tu “para qué”</h3><textarea id="suenosParaQue" maxlength="400" placeholder="Para qué hacés esta actividad…">' + String(v.para_que || '').replace(/</g, '&lt;') + '</textarea></div>' +
      '<h3 style="margin:0 0 10px;font-size:13px;color:#343441">🪜 La escalera (1 = el más cercano)</h3>' + filas +
      '<div class="suenos-acciones"><button type="button" class="suenos-share" id="suenosShare">📤 Compartir por WhatsApp</button></div>' +
      '</div>';

    cont.querySelectorAll('[data-sueno]').forEach(function(inp){
      inp.oninput = function(){
        var d = leer();
        d.suenos[Number(inp.dataset.sueno)] = inp.value;
        guardar(d);
      };
    });
    var pq = document.getElementById('suenosParaQue');
    pq.oninput = function(){
      var d = leer();
      d.para_que = pq.value;
      guardar(d);
    };
    document.getElementById('suenosShare').onclick = function(){
      var d = leer();
      var msg = 'Mi escalera de sueños en APPI 💙\nPara qué: ' + (d.para_que || '—');
      d.suenos.forEach(function(s, i){
        if (s) msg += '\n' + (i + 1) + '. ' + s;
      });
      var url = 'https://wa.me/?text=' + encodeURIComponent(msg);
      if (window.APPIWhatsApp && window.APPIWhatsApp.abrir) window.APPIWhatsApp.abrir(url);
      else window.open(url, '_blank', 'noopener');
    };
  }

  function openSuenos(){
    showView('view-suenos');
    render();
  }

  window.APPIEscaleraSuenos = { leer: leer, guardar: guardar, render: render, open: openSuenos };
})();
