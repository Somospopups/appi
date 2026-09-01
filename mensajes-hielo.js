/* APPI · Hielo de WhatsApp (v412)
   Primer mensaje: un saludo al azar, con la hora y el nombre que eligió
   titular o socio. Las plantillas vienen después, cuando ya contestaron. */
(function(){
  'use strict';

  var FIRMA_KEY = 'appi_firma_wa_v1';
  var LAST_I = -1;

  var FRASES = [
    function(s, f){ return '¡Hola, ' + s.corto + '! 😊 Soy ' + f + ', ¿cómo estás?'; },
    function(s, f){ return '¡Hola! ¿Cómo va? Espero que estés muy bien. Te escribe ' + f + '.'; },
    function(s, f){ return '¡Hola! 😊 Soy ' + f + ', ¿cómo estás tanto tiempo?'; },
    function(s, f){ return '¡Hola! ¿Qué tal? Espero que estés teniendo un lindo ' + s.momento + '. ' + f + ' por acá.'; },
    function(s, f){ return '¡Muy ' + s.largo + '! 😊 Te escribe ' + f + ', ¿cómo andás?'; },
    function(s, f){ return '¡Hola! Paso a saludarte 😊 Soy ' + f + ', ¿cómo estás?'; },
    function(s, f){ return '¡' + s.titulo + '! ¿Cómo va todo? Te escribe ' + f + '.'; },
    function(s, f){ return '¡Hola! 😊 Espero que estés bien, ¿cómo andás? Soy ' + f + '.'; }
  ];

  function nombreCuenta(){
    var p = window.APPIAuth && window.APPIAuth.activePerson ? window.APPIAuth.activePerson() : null;
    var perfil = window.APPIAuth && window.APPIAuth.currentProfile ? window.APPIAuth.currentProfile() : null;
    var full = String((p && p.nombre) || (perfil && perfil.nombre) || '').trim();
    return full.split(/\s+/)[0] || '';
  }
  function firma(){
    try{
      var raw = String(localStorage.getItem(FIRMA_KEY) || '').trim();
      if (raw) return raw.slice(0, 40);
    }catch(e){}
    return nombreCuenta() || 'yo';
  }
  function guardarFirma(valor){
    var v = String(valor == null ? '' : valor).trim().replace(/\s+/g, ' ').slice(0, 40);
    try{
      if (!v) localStorage.removeItem(FIRMA_KEY);
      else localStorage.setItem(FIRMA_KEY, v);
    }catch(e){}
    return firma();
  }
  function saludoHora(ahora){
    var d = ahora instanceof Date ? ahora : new Date();
    var h = d.getHours();
    if (h >= 6 && h < 12) return { corto:'buen día', largo:'buenos días', titulo:'Buen día', momento:'día' };
    if (h >= 12 && h < 20) return { corto:'buenas tardes', largo:'buenas tardes', titulo:'Buenas tardes', momento:'tarde' };
    return { corto:'buenas noches', largo:'buenas noches', titulo:'Buenas noches', momento:'noche' };
  }
  function hielo(ahora){
    var i = Math.floor(Math.random() * FRASES.length);
    if (FRASES.length > 1 && i === LAST_I) i = (i + 1) % FRASES.length;
    LAST_I = i;
    return FRASES[i](saludoHora(ahora), firma());
  }
  function sinHolaInicial(texto){
    var t = String(texto || '').replace(/^\uFEFF/, '');
    var lineas = t.split('\n');
    if (!lineas.length) return t;
    if (/^\s*¡?hola\b/i.test(lineas[0])){
      lineas.shift();
      while (lineas.length && !lineas[0].trim()) lineas.shift();
    }
    return lineas.join('\n');
  }

  window.APPIHielo = {
    FIRMA_KEY: FIRMA_KEY,
    FRASES: FRASES,
    firma: firma,
    guardarFirma: guardarFirma,
    nombreCuenta: nombreCuenta,
    saludoHora: saludoHora,
    hielo: hielo,
    sinHolaInicial: sinHolaInicial
  };
})();
