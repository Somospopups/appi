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

  function listaUsuariosTel(){
    try{
      if (typeof window.usuariosTodosActual === 'function'){
        var vivos = window.usuariosTodosActual() || [];
        if (vivos.length) return vivos;
      }
    }catch(e){}
    return Array.isArray(window.usuariosU) ? window.usuariosU : [];
  }
  function aUsuarioDep(p, valor, nombre){
    if (!p) p = {};
    return {
      usuario: p.usuario || p.nombre || nombre || 'Sin nombre',
      telf: p.telf || p.tel || p.telefono || valor || '',
      domicilio: p.domicilio || '',
      localidad: p.localidad || '',
      producto: p.producto || '',
      dip: p.dip || p.codigo || ''
    };
  }
  function buscarPersonaTel(valor, nombre, persona){
    if (persona && (persona.usuario || persona.nombre || persona.telf || persona.tel || persona.telefono)) return persona;
    var tel = String(valor == null ? '' : valor).replace(/\D/g, '');
    var nom = String(nombre == null ? '' : nombre).trim().toLowerCase();
    var lista = listaUsuariosTel();
    var hit = null;
    for (var i = 0; i < lista.length; i++){
      var u = lista[i];
      var t = String(u.telf || u.tel || u.telefono || '').replace(/\D/g, '');
      if (tel && t && (t === tel || t.endsWith(tel) || tel.endsWith(t))){ hit = u; break; }
      var n = String(u.usuario || u.nombre || '').trim().toLowerCase();
      if (nom && n && (n === nom || n.indexOf(nom) >= 0 || nom.indexOf(n) >= 0)){ hit = u; break; }
    }
    return hit || { usuario: nombre || 'Sin nombre', telf: valor || '' };
  }
  function mandarADepurados(valor, nombre, persona){
    var dest = aUsuarioDep(buscarPersonaTel(valor, nombre, persona), valor, nombre);
    if (typeof window.depurarUsuario === 'function'){
      window.depurarUsuario(dest);
      if (window.showToast) window.showToast('Listo: quedó en Depurados 🧹', 2200);
      return true;
    }
    if (typeof window.abrirPanelDepurados === 'function'){
      window.abrirPanelDepurados();
      return true;
    }
    return false;
  }

  /* Si el número no sirve, el mismo cartel ofrece mandarlo a Depurados. */
  function avisarInvalido(valor, nombre, persona){
    var quien = nombre ? ('"' + nombre + '"') : 'Este contacto';
    var msg = quien + ' no tiene un número de teléfono válido, así que no se puede abrir WhatsApp.\n\n' +
              'Revisá que esté completo: código de área y número, por ejemplo 351 766-9967.';
    var opts = { title: 'Número incompleto', icon: '📵', okText: 'A depurados', cancelText: 'Aceptar', danger: true };
    if (window.APPIDialog && window.APPIDialog.confirm){
      Promise.resolve(window.APPIDialog.confirm(msg, opts)).then(function(ok){
        if (ok) mandarADepurados(valor, nombre, persona);
      });
    } else if (window.APPIDialog && window.APPIDialog.alert){
      window.APPIDialog.alert(msg, { title: 'Número incompleto', icon: '📵' });
    } else {
      alert(msg);
    }
  }

  /* Cuidado de la línea (v377).
     WhatsApp no publica un tope, pero 15 mensajes iguales seguidos ya
     suspendieron a una distribuidora. APPI abre el chat: acá se cuenta
     cada persona NUEVA del día (la misma no suma) y se obliga a esperar
     un minuto entre una y otra. El tope es 10 personas distintas.
     La jornada sigue siendo 8 acciones: acá se cuida la línea, no el día.
     Se guarda en la cuenta, no en el aparato: celular y PC comparten. */
  var TOPE_PERSONAS = 10;
  var PAUSA_MS = 60 * 1000;
  function topeCuidado(){ return TOPE_PERSONAS; }
  function uidCuidado(){
    try{
      if (window.APPIAuth && typeof window.APPIAuth.userId === 'function'){
        return window.APPIAuth.userId() || 'local';
      }
    }catch(e){}
    return 'local';
  }
  function diaCuidado(){
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function storeCuidadoKey(){ return 'appi_wa_cuidado_' + uidCuidado(); }
  function leerCuidado(){
    try{
      var raw = JSON.parse(localStorage.getItem(storeCuidadoKey()) || '{}');
      if (!raw || raw.dia !== diaCuidado()) return { dia: diaCuidado(), tels: [], ultimoNuevoAt: 0 };
      if (!Array.isArray(raw.tels)) raw.tels = [];
      return raw;
    }catch(e){ return { dia: diaCuidado(), tels: [], ultimoNuevoAt: 0 }; }
  }
  function guardarCuidado(d){
    try{ localStorage.setItem(storeCuidadoKey(), JSON.stringify(d)); }catch(e){}
  }
  function estadoCuidado(valor){
    var n = normalizar(valor);
    var st = leerCuidado();
    var ya = !!(n && st.tels.indexOf(n) >= 0);
    var tope = topeCuidado();
    var usados = st.tels.length;
    var quedan = Math.max(0, tope - usados);
    var espera = 0;
    if (!ya && st.ultimoNuevoAt){
      var falta = PAUSA_MS - (Date.now() - Number(st.ultimoNuevoAt || 0));
      if (falta > 0) espera = Math.ceil(falta / 1000);
    }
    return {
      tel: n,
      yaHoy: ya,
      usados: usados,
      tope: tope,
      quedan: quedan,
      esperaSeg: ya ? 0 : espera,
      puede: !!n && (ya || (quedan > 0 && espera <= 0))
    };
  }
  function evaluarCuidado(valor){
    var e = estadoCuidado(valor);
    if (!e.tel) return { ok: true, motivo: 'sin-tel', estado: e };
    if (e.yaHoy) return { ok: true, motivo: 'mismo', estado: e };
    if (e.quedan <= 0) return { ok: false, motivo: 'tope', estado: e };
    if (e.esperaSeg > 0) return { ok: false, motivo: 'pausa', estado: e };
    return { ok: true, motivo: 'nuevo', estado: e };
  }
  function registrarCuidado(valor){
    var n = normalizar(valor);
    if (!n) return { nuevo: false, estado: estadoCuidado(valor) };
    var st = leerCuidado();
    if (st.tels.indexOf(n) >= 0) return { nuevo: false, estado: estadoCuidado(valor) };
    st.tels.push(n);
    st.ultimoNuevoAt = Date.now();
    guardarCuidado(st);
    return { nuevo: true, estado: estadoCuidado(valor) };
  }
  function resetCuidado(){
    try{ localStorage.removeItem(storeCuidadoKey()); }catch(e){}
  }
  function avisarCuidado(motivo, estado){
    estado = estado || estadoCuidado('');
    var titulo, msg, icono;
    if (motivo === 'tope'){
      titulo = 'Hoy ya está';
      icono = '🛡️';
      msg = 'Ya escribiste a ' + estado.usados + ' personas distintas desde APPI. Ese es el tope del día: así WhatsApp no te suspende la línea.\n\nA la misma persona podés escribirle de nuevo. Mañana se reinicia.';
    } else {
      titulo = 'Un minuto';
      icono = '⏳';
      var seg = estado.esperaSeg || 1;
      var cuanto = seg < 60 ? (seg + (seg === 1 ? ' segundo' : ' segundos')) : '1 minuto';
      msg = 'Mandar muchos mensajes seguidos es lo que más suspende la línea.\n\nEsperá ' + cuanto + ' y después el siguiente. Te quedan ' + estado.quedan + ' para hoy.';
    }
    if (window.APPIDialog && window.APPIDialog.alert){
      window.APPIDialog.alert(msg, { title: titulo, icon: icono, okText: 'Entendido' });
    } else if (typeof window.showToast === 'function'){
      window.showToast(titulo + '. ' + msg.replace(/\n+/g, ' '), 4200);
    } else {
      alert(titulo + '\n\n' + msg);
    }
  }
  function avisarToqueHecho(estado){
    if (!estado || typeof window.showToast !== 'function') return;
    if (estado.usados >= estado.tope){
      window.showToast('Ese fue el último del día. Mañana de nuevo, para cuidar tu línea.', 3200);
      return;
    }
    window.showToast('Van ' + estado.usados + ' de ' + estado.tope + ' hoy. Esperá un minuto antes de escribirle a otra persona.', 2800);
  }

  /* Abre WhatsApp. Si el número no sirve, avisa y no abre nada.
     persona (opcional) es el contacto/usuario para poder depurarlo.
     Devuelve true si abrió, false si el número era inválido o si
     el cuidado de la línea frenó el envío. */
  function abrir(valor, texto, nombre, persona){
    var url = link(valor, texto);
    if (!url){
      avisarInvalido(valor, nombre, persona);
      return false;
    }
    var gate = evaluarCuidado(valor);
    if (!gate.ok){
      avisarCuidado(gate.motivo, gate.estado);
      return false;
    }
    var reg = registrarCuidado(valor);
    if (window.APPIWhatsApp && window.APPIWhatsApp.abrir) window.APPIWhatsApp.abrir(url);
    else window.open(url, '_blank', 'noopener');
    if (reg.nuevo) avisarToqueHecho(reg.estado);
    return true;
  }

  window.APPITel = {
    normalizar: normalizar,
    esValido:   esValido,
    primeroValido: primeroValido,
    bonito:     bonito,
    link:       link,
    abrir:      abrir,
    avisarInvalido: avisarInvalido,
    cuidado: {
      TOPE: TOPE_PERSONAS,
      PAUSA_MS: PAUSA_MS,
      estado: estadoCuidado,
      evaluar: evaluarCuidado,
      reset: resetCuidado
    }
  };
})();
