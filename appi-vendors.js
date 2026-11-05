/* APPI v918 · bibliotecas pesadas bajo demanda
   El inicio no descarga ni ejecuta Excel, PDF, escaneo o captura. Cada
   herramienta pide únicamente el motor que necesita cuando la persona la usa. */
(function(){
  'use strict';

  var defs={
    pdfjs:{src:'./vendor/pdf.min.js',ready:function(){return !!window.pdfjsLib}},
    zxing:{src:'./vendor/zxing.min.js',ready:function(){return !!window.ZXing}},
    xlsx:{src:'./vendor/xlsx.full.min.js',ready:function(){return !!window.XLSX}},
    html2canvas:{src:'./vendor/html2canvas.min.js',ready:function(){return typeof window.html2canvas==='function'}},
    jspdf:{src:'./vendor/jspdf.umd.min.js',ready:function(){return !!(window.jspdf&&window.jspdf.jsPDF)}},
    svg2pdf:{src:'./vendor/svg2pdf.umd.min.js',depends:['jspdf'],ready:function(){return !!(window.jspdf&&window.jspdf.jsPDF&&window.jspdf.jsPDF.API&&window.jspdf.jsPDF.API.svg)}},
    jszip:{src:'./vendor/jszip.min.js',ready:function(){return typeof window.JSZip==='function'}}
  };
  var pending={};

  function loadOne(name){
    var def=defs[name];
    if(!def)return Promise.reject(new Error('Biblioteca desconocida: '+name));
    if(def.ready())return Promise.resolve(true);
    if(pending[name])return pending[name];
    pending[name]=Promise.resolve().then(function(){
      var dependencies=def.depends||[];
      return dependencies.reduce(function(chain,dependency){
        return chain.then(function(){return loadOne(dependency)});
      },Promise.resolve());
    }).then(function(){
      if(def.ready())return true;
      return new Promise(function(resolve,reject){
        var script=document.createElement('script');
        script.src=def.src;
        script.async=true;
        script.dataset.appiVendor=name;
        script.onload=function(){
          if(def.ready())resolve(true);
          else reject(new Error('La biblioteca '+name+' no quedó disponible.'));
        };
        script.onerror=function(){reject(new Error('No se pudo cargar '+name+'.'))};
        document.head.appendChild(script);
      });
    }).catch(function(error){delete pending[name];throw error});
    return pending[name];
  }

  function ensure(names){
    var list=Array.isArray(names)?names:[names];
    return list.reduce(function(chain,name){
      return chain.then(function(){return loadOne(name)});
    },Promise.resolve()).then(function(){return true});
  }

  function available(name){return !!(defs[name]&&defs[name].ready())}
  window.APPIVendors={ensure:ensure,available:available};
})();
