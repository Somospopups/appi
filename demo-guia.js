/* ============================================================
   APPI · Guía de Demostración
   ------------------------------------------------------------
   El paso 5 de la formación, simplificado en cuatro momentos:
   conciencia → comparativa → sistema → cierre y seguimiento.
   ============================================================ */
(function(){
  'use strict';

  var PASOS_DEMO = [
    { t: 'Conciencia', d: 'Preguntá por el agua de todos los días: sabor, olor, sarro y hábitos. La encuesta es tu mejor aliada para empezar.' },
    { t: 'Comparativa', d: 'Mostrá la comparativa de la botella de 2 litros: por día, por mes y por año. Los números despiertan conciencia.' },
    { t: 'Sistema, no producto', d: 'Presentá el Sistema Integral de Purificación PSA. ¿Estás ofreciendo un sistema de purificación o sólo un purificador?' },
    { t: 'Cierre y seguimiento', d: 'Acordá con la persona cuál será el próximo paso y cuándo volverán a conversar.' }
  ];

  function estilo(){
    if (document.getElementById('demoStyle')) return;
    var s = document.createElement('style');
    s.id = 'demoStyle';
    s.textContent = '.demo-wrap{padding:14px}' +
      '.demo-paso{display:flex;gap:10px;margin:0 0 9px;padding:12px;border-radius:16px;background:rgba(255,255,255,.62);border:1px solid rgba(255,255,255,.78)}' +
      'body.dark .demo-paso{background:#25273a;border-color:rgba(255,255,255,.08)}' +
      '.demo-paso input{accent-color:#168765;margin-top:2px}' +
      '.demo-paso h4{margin:0;font-size:12.5px;color:#343441}' +
      'body.dark .demo-paso h4{color:#f2f2f7}' +
      '.demo-paso p{margin:4px 0 0;font-size:11px;font-weight:650;color:#556277;line-height:1.45}' +
      'body.dark .demo-paso p{color:#b8b9c5}';
    document.head.appendChild(s);
  }

  function render(){
    var cont = document.getElementById('demoCont');
    if (!cont) return;
    estilo();
    cont.innerHTML = '<div class="demo-wrap">' +
      PASOS_DEMO.map(function(p, i){
        return '<label class="demo-paso"><input type="checkbox" data-demo="' + i + '"><div><h4>' + (i + 1) + '. ' + p.t + '</h4><p>' + p.d + '</p></div></label>';
      }).join('') +
      '</div>';
  }

  function openDemo(){
    showView('view-demo');
    render();
  }

  window.openDemo = openDemo;
  window.APPIDemoGuia = { pasos: PASOS_DEMO, render: render, open: openDemo };
})();
