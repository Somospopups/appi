/* ============================================================
   APPI · Guía de Demostración (v230)
   ------------------------------------------------------------
   El paso 5 de la formación, con la estructura de la carpeta
   de demos del equipo: conciencia → comparativa → sistema →
   ficha del producto → cierre. Al terminar, la presentación
   queda para registrarse en el Panel de Contactos.
   ============================================================ */
(function(){
  'use strict';

  var PRODUCTOS = {
    'eco-D': 'Agua purificada fría o caliente al instante, para beber y cocinar. Protección especial para niños en la canilla de agua caliente y sensor antiderrame. Garantía 24 meses.',
    'eco-D Sobre Mesada': 'Compacto y de instalación fácil en cualquier mesada. Su Senior 4 BM interno reduce más del 90% del cloro y más del 60% de los trihalometanos, además de hierro, plomo y aluminio. Bandeja removible. Garantía 24 meses.',
    'Iontrix 2': 'Purificación de la línea PSA para el agua de tu hogar: reduce componentes perjudiciales y los causantes de mal sabor, color y olor. Garantía 24 meses.',
    'Poli 2': 'Solución PSA para cada necesidad: agua limpia y segura, devolviendo sus condiciones naturales. Garantía 24 meses.',
    'Senior 4': 'Mayor poder de purificación con carbón activado, KDF y zeolitas naturales: retiene cloro y metales como hierro y plomo. Garantía 24 meses.',
    'S-1000 II': 'Equipo de la línea PSA para problemas de agua exigentes: medios activos de alta retención. Garantía 24 meses.',
    'Senik': 'Agua purificada para toda la familia con la calidad internacional PSA. Garantía 24 meses.',
    'Quantum': 'Tecnología PSA de purificación: menos componentes perjudiciales, más condiciones naturales. Garantía 24 meses.',
    'C3': 'Solución PSA de triple etapa para el agua de todos los días. Garantía 24 meses.',
    'SodaBurby': 'Agua purificada y gasificada en casa: la demostración que sorprende. Garantía 24 meses.'
  };

  var PASOS_DEMO = [
    { t: 'Conciencia', d: 'Preguntá por el agua de todos los días: sabor, olor, sarro, hábitos. La encuesta es tu mejor aliada para empezar.' },
    { t: 'Comparativa', d: 'Mostrá la comparativa de la botella de 2 litros: por día, por mes, por año. Los números despiertan conciencia.' },
    { t: 'Sistema, no producto', d: 'Presentá el Sistema Integral de Purificación PSA. ¿Estás ofreciendo un sistema de purificación o sólo un purificador?' },
    { t: 'Ficha del equipo', d: 'Beneficios concretos, medios activos y garantía de 24 meses. Elegí el equipo según la problemática.' },
    { t: 'Cierre y seguimiento', d: 'Acordá el próximo paso y registrá la presentación: un seguimiento programado vale más que un "me lo voy a pensar".' }
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
      'body.dark .demo-paso p{color:#b8b9c5}' +
      '.demo-ficha{margin:12px 0;padding:13px;border-radius:16px;background:linear-gradient(135deg,rgba(58,208,164,.10),rgba(91,141,239,.12));border:1px solid rgba(58,208,164,.3)}' +
      '.demo-ficha select{width:100%;min-height:42px;border:1px solid rgba(80,90,130,.2);border-radius:12px;padding:8px;font:inherit;font-size:12.5px;background:#fff;color:#292938}' +
      '.demo-ficha p{margin:9px 0 0;font-size:11.5px;font-weight:650;color:#343441;line-height:1.5}' +
      'body.dark .demo-ficha p{color:#e6e6f0}' +
      '.demo-fin{width:100%;min-height:46px;border:0;border-radius:13px;background:linear-gradient(135deg,#3ad0a4,#5b8def);color:#fff;font:inherit;font-size:13px;font-weight:950;cursor:pointer}';
    document.head.appendChild(s);
  }

  function render(){
    var cont = document.getElementById('demoCont');
    if (!cont) return;
    estilo();
    var opciones = Object.keys(PRODUCTOS).map(function(k){ return '<option>' + k + '</option>'; }).join('');
    cont.innerHTML = '<div class="demo-wrap">' +
      PASOS_DEMO.map(function(p, i){
        return '<label class="demo-paso"><input type="checkbox" data-demo="' + i + '"><div><h4>' + (i + 1) + '. ' + p.t + '</h4><p>' + p.d + '</p></div></label>';
      }).join('') +
      '<div class="demo-ficha"><h3 style="margin:0 0 7px;font-size:13px;color:#168765">📄 Ficha del equipo</h3>' +
      '<select id="demoProducto">' + opciones + '</select><p id="demoFicha"></p></div>' +
      '<button type="button" class="demo-fin" id="demoFin">🎯 Registrar presentación en el Panel</button>' +
      '</div>';

    var sel = document.getElementById('demoProducto');
    var ficha = document.getElementById('demoFicha');
    var pintar = function(){ ficha.textContent = PRODUCTOS[sel.value] || ''; };
    sel.onchange = pintar; pintar();

    document.getElementById('demoFin').onclick = function(){
      if (typeof openMiGestion === 'function') openMiGestion();
    };
  }

  function openDemo(){
    showView('view-demo');
    render();
  }

  window.APPIDemoGuia = { productos: PRODUCTOS, pasos: PASOS_DEMO, render: render, open: openDemo };
})();
