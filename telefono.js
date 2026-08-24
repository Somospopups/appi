/* ==========================================================================
   APPI · Teléfonos argentinos para WhatsApp
   --------------------------------------------------------------------------
   Antes cada pantalla armaba el número a su manera (había seis versiones
   distintas) y varias mandaban a WhatsApp números que no existen. Este
   módulo es el único lugar donde se decide cómo se arma un número.

   La regla en Argentina:
     - WhatsApp quiere  54 + 9 + código de área + abonado   (13 dígitos)
     - Hay que sacar el 0 de larga distancia y el 15 del celular
     - El código de área mide 2 (Buenos Aires), 3 o 4 dígitos, así que
       el 15 NO está siempre en el mismo lugar. Ese era el bug.

   Ejemplos:
     0351 15-766-9967   ->  5493517669967   (Córdoba)
     011 15-4766-9967   ->  5491147669967   (Buenos Aires)
     03541 15-44-4444   ->  5493541444444   (Carlos Paz)
     0351-999888        ->  ''              (corto: no es válido)
   ========================================================================== */
(function(){
  'use strict';

  /* Códigos de área de 3 dígitos. El 11 es de 2. Todo el resto es de 4.
     Fuente: plan de numeración nacional (ENACOM). */
  var AREA3 = {
    '220':1,'221':1,'223':1,'230':1,'236':1,'237':1,'249':1,'260':1,'261':1,
    '263':1,'264':1,'266':1,'280':1,'291':1,'294':1,'297':1,'298':1,'299':1,
    '336':1,'341':1,'342':1,'343':1,'345':1,'348':1,'351':1,'353':1,'358':1,
    '362':1,'364':1,'370':1,'376':1,'379':1,'380':1,'381':1,'383':1,'385':1,
    '387':1,'388':1
  };

  /* Los dígitos de un número nacional (sin país, sin 0, sin 15) son
     siempre 10: área + abonado. Según el área, el 15 iría en otro lugar,
     así que probamos las posiciones posibles en orden de probabilidad. */
  function posicionesDel15(d){
    if (d.slice(0,2) === '11') return [2,3,4];
    if (AREA3[d.slice(0,3)])   return [3,4,2];
    return [4,3,2];
  }

  function quitar15(d){
    if (d.length !== 12) return d;          // solo sobra el 15 si hay 2 de más
    var pos = posicionesDel15(d);
    for (var i = 0; i < pos.length; i++){
      var a = pos[i];
      if (d.slice(a, a + 2) === '15') return d.slice(0, a) + d.slice(a + 2);
    }
    return d;
  }

  /* Devuelve el número listo para wa.me, o '' si no es un número argentino
     válido. Devolver '' es a propósito: es preferible avisar que abrir un
     chat con un número que no existe. */
  function normalizar(valor){
    var d = String(valor == null ? '' : valor).replace(/\D/g, '');
    if (!d) return '';
    if (d.slice(0,2) === '00') d = d.slice(2);                    // 0054...
    if (d.slice(0,2) === '54') d = d.slice(2);                    // país
    if (d.charAt(0) === '9' && d.length >= 11) d = d.slice(1);    // 9 de móvil
    if (d.charAt(0) === '0') d = d.slice(1);                      // 0 larga distancia
    d = quitar15(d);
    if (d.length !== 10) return '';                               // no es válido
    return '549' + d;
  }

  function esValido(valor){ return !!normalizar(valor); }

  /* Un campo puede traer varios números pegados (ej. "351 766-9967 / 54" o
     "54 351 766 - 9967"). Devuelve el PRIMER número válido, listo para wa.me,
     o '' si no hay ninguno. Así un "54" suelto o un segundo número nunca
     rompe la redirección de WhatsApp. */
  function primeroValido(valor){
    var partes = String(valor == null ? '' : valor).split(/\s*[\/,;|\n\r]+\s*|\s+-\s+/);
    for (var i = 0; i < partes.length; i++){
      var n = normalizar(partes[i]);
      if (n) return n;
    }
    // Si los separadores partieron un número único (guiones con espacios),
    // la cadena entera puede seguir siendo un número válido.
    return normalizar(valor);
  }

  /* Para mostrarlo en pantalla: +54 9 351 766-9967 */
  function bonito(valor){
    var n = normalizar(valor);
    if (!n) return '';
    var nac = n.slice(3);                                  // 10 dígitos
    var a = nac.slice(0,2) === '11' ? 2 : (AREA3[nac.slice(0,3)] ? 3 : 4);
    var area = nac.slice(0, a), resto = nac.slice(a);
    var corte = resto.length - 4;
    return '+54 9 ' + area + ' ' + resto.slice(0, corte) + '-' + resto.slice(corte);
  }

  /* Arma el enlace de WhatsApp. Devuelve '' si el número no sirve. */
  function link(valor, texto){
    var n = normalizar(valor);
    if (!n) return '';
    return 'https://wa.me/' + n + (texto ? '?text=' + encodeURIComponent(texto) : '');
  }

  /* Abre WhatsApp. Si el número no sirve, avisa y no abre nada.
     Devuelve true si abrió, false si el número era inválido. */
  function abrir(valor, texto, nombre){
    var url = link(valor, texto);
    if (!url){
      var quien = nombre ? ('"' + nombre + '"') : 'Este contacto';
      var msg = quien + ' no tiene un número de teléfono válido, así que no se puede abrir WhatsApp.\n\n' +
                'Revisá que esté completo: código de área y número, por ejemplo 351 766-9967.';
      if (window.APPIDialog && window.APPIDialog.alert){
        window.APPIDialog.alert(msg, { title: 'Número incompleto', icon: '📵' });
      } else {
        alert(msg);
      }
      return false;
    }
    if (window.APPIWhatsApp && window.APPIWhatsApp.abrir) window.APPIWhatsApp.abrir(url);
    else window.open(url, '_blank', 'noopener');
    return true;
  }

  window.APPITel = {
    normalizar: normalizar,
    esValido:   esValido,
    primeroValido: primeroValido,
    bonito:     bonito,
    link:       link,
    abrir:      abrir
  };
})();
