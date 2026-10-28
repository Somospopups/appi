/* ============================================================
   APPI · Campus PSA
   ------------------------------------------------------------
   Microentrenamiento original inspirado en los temas de Campus PSA.
   Al completar las 10 acciones reales del día, 5 respuestas correctas
   habilitan hasta 3 prioridades adicionales de la jornada.
   ============================================================ */
(function(){
  'use strict';

  var BASE_ACCIONES = 10;
  var BONUS_ACCIONES = 3;
  var VERSION = 1;
  var session = { index:0, correctas:0, esperandoReintento:false, preguntas:[] };

  function uid(){
    try { return (window.APPIAuth && window.APPIAuth.userId && window.APPIAuth.userId()) || 'local'; }
    catch(e){ return 'local'; }
  }
  function key(){ return 'appi_campus_psa_v1_' + uid(); }
  function hoyKey(){
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }
  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }
  function leer(){
    try {
      var data = JSON.parse(localStorage.getItem(key()) || '{}');
      return data && typeof data === 'object' ? data : {};
    } catch(e){ return {}; }
  }
  function guardar(data){
    try { localStorage.setItem(key(), JSON.stringify(data)); } catch(e){}
  }
  function estadoHoy(){
    var data = leer();
    if (!data.v) data.v = VERSION;
    if (!data.dias || typeof data.dias !== 'object') data.dias = {};
    var today = hoyKey();
    if (!data.dias[today]) data.dias[today] = {};
    // Un año alcanza para progreso y evita que la clave crezca sin límite.
    Object.keys(data.dias).forEach(function(d){
      if (Object.keys(data.dias).length > 380 && d < today.slice(0,4) + '-01-01') delete data.dias[d];
    });
    return { data:data, day:data.dias[today], today:today };
  }
  function bonusAccionesHoy(){
    var e = estadoHoy();
    return e.day && e.day.desbloqueado ? BONUS_ACCIONES : 0;
  }
  function retoDesbloqueado(){ return bonusAccionesHoy() > 0; }

  function perfilPSA(){
    try {
      var raw = JSON.parse(localStorage.getItem('appi_dip_perfil_v1') || 'null');
      if (raw && raw.perfil && typeof raw.perfil === 'object') return raw.perfil;
      // El Reporte de Bonos también trae la categoría comercial y suele
      // cargarse antes que la Lista de precios. Es una copia local de APPI,
      // no una consulta ni una credencial de PSA Campus.
      var bonos = JSON.parse(localStorage.getItem('appi_bonos_v1') || 'null');
      var categoriaBonos = bonos && bonos.bonos && bonos.bonos.categoria;
      if (!categoriaBonos && bonos) categoriaBonos = bonos.categoria;
      return categoriaBonos ? { categoria:categoriaBonos } : {};
    } catch(e){ return {}; }
  }
  function categoriaNormalizada(){
    return String(perfilPSA().categoria || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-AR');
  }
  function categoria(){
    var value = String(perfilPSA().categoria || '').trim();
    if (!value) return 'Tu categoría PSA';
    var nombre = value.toLocaleLowerCase('es-AR').replace(/(^|\s)([a-záéíóúüñ])/g, function(_,sp,l){ return sp + l.toLocaleUpperCase('es-AR'); });
    return nombre.replace(/\b(De|Del|La|El|Y)\b/g, function(w){ return w.toLocaleLowerCase('es-AR'); });
  }
  function esLider(){ return /lider|coordinador/.test(categoriaNormalizada()); }
  function esJunior(){ return /junior|inicial|distribuidor junior/.test(categoriaNormalizada()); }

  // Preguntas originales: no son evaluaciones oficiales ni copian textos del Campus.
  function preguntasParaCategoria(){
    if (esLider()) return [
      { area:'Crecimiento empresarial', tema:'Guiar al nuevo', pregunta:'Una persona nueva se incorpora a tu equipo con entusiasmo, pero todavía no organizó sus primeras acciones. ¿Cuál es tu mejor primer paso como líder?', opciones:['Esperar a que encuentre su propio ritmo.','Ayudarla a definir un plan simple de primeros días y acompañar sus avances.','Enviarle muchos materiales y dejarla estudiar sola.','Pedirle que invite gente antes de explicarle el proceso.'], correcta:1, explicacion:'Guiar los primeros pasos con claridad, acción y seguimiento construye confianza y continuidad.' },
      { area:'Comercialización', tema:'Seguimiento de invitados', pregunta:'Después de presentar el Negocio PSA a una persona interesada, ¿qué seguimiento es más profesional?', opciones:['Escribirle todos los días hasta que responda.','Esperar a que vuelva a escribir cuando esté lista.','Acordar un próximo contacto concreto para resolver dudas o avanzar.','Mandarle una lista de precios sin contexto.'], correcta:2, explicacion:'Un seguimiento con fecha y propósito evita que una buena conversación quede librada a la casualidad.' },
      { area:'Crecimiento empresarial', tema:'Equipos sólidos', pregunta:'¿Qué ayuda más a construir una organización sólida y sostenible?', opciones:['Que el líder haga todo por cada integrante.','Enseñar un sistema simple y repetible para que cada persona pueda avanzar.','Sumar personas sin acompañamiento posterior.','Concentrarse sólo en quienes ya tienen resultados altos.'], correcta:1, explicacion:'El equipo crece cuando el aprendizaje y las acciones se pueden repetir con acompañamiento.' },
      { area:'Posventa', tema:'Canje y fidelización', pregunta:'Un usuario se acerca al vencimiento de su equipo. ¿Cuál es la primera oportunidad que conviene revisar?', opciones:['No hacer nada hasta que reclame.','Contactarlo, conocer su situación y evaluar mantenimiento, renovación o Plan Canje.','Ofrecer cualquier producto sin consultar qué equipo tiene.','Mandar un mensaje genérico sin datos de su equipo.'], correcta:1, explicacion:'La posventa empieza por comprender al usuario y ofrecer una solución adecuada a su situación.' },
      { area:'Liderazgo y foco', tema:'Estrategia 80/20', pregunta:'Tenés muchas tareas posibles para tu negocio y tu equipo. ¿Qué enfoque representa mejor una estrategia de prioridad?', opciones:['Hacer un poco de todo, sin definir impacto.','Cambiar de método todos los días.','Elegir las acciones de mayor impacto y sostenerlas con seguimiento.','Postergar los contactos hasta tener tiempo libre.'], correcta:2, explicacion:'El crecimiento requiere foco: elegir lo que mueve resultados, hacerlo y darle continuidad.' }
    ];
    if (esJunior()) return [
      { area:'Programa de capacitación básica', tema:'Primeros pasos', pregunta:'Al comenzar tu negocio, ¿qué ayuda más a sostener la acción durante la primera semana?', opciones:['Esperar a saberlo todo antes de contactar a alguien.','Definir acciones simples, hacerlas y revisar qué aprendiste.','Cambiar de objetivo cada día.','Dejar los contactos para el fin de mes.'], correcta:1, explicacion:'Los primeros avances llegan al combinar una meta simple con acción y revisión.' },
      { area:'Comercialización', tema:'Demostración', pregunta:'¿Qué buscás primero en una demostración con un posible usuario?', opciones:['Hablar rápido de todos los productos.','Comprender su necesidad y mostrar una solución relevante.','Dar un precio sin hacer preguntas.','Terminar la conversación lo antes posible.'], correcta:1, explicacion:'Una buena demostración comienza escuchando; así la solución tiene sentido para esa persona.' },
      { area:'Comercialización', tema:'Referidos', pregunta:'Un cliente satisfecho te puede recomendar. ¿Cuál es una forma simple y respetuosa de pedir un referido?', opciones:['Pedirle una lista completa de contactos.','Preguntarle si conoce a una persona a quien le serviría conocer la propuesta.','Insistir hasta que entregue varios números.','Esperar un año para volver a hablarle.'], correcta:1, explicacion:'Un pedido claro, concreto y sin presión cuida la relación con el cliente.' },
      { area:'Productos PSA', tema:'Necesidad antes que producto', pregunta:'Antes de sugerir un equipo PSA, ¿qué dato es más útil conocer?', opciones:['El color favorito del usuario.','Cómo usa el agua, qué necesidad tiene y dónde irá instalado.','Qué producto vendiste ayer.','Cuántos contactos tenés pendientes.'], correcta:1, explicacion:'La recomendación mejora cuando parte de la necesidad y del contexto de uso.' },
      { area:'Posventa', tema:'Servicio', pregunta:'¿Por qué es importante mantener contacto luego de una venta?', opciones:['Sólo para volver a vender rápido.','Para acompañar al usuario, resolver necesidades y construir confianza.','Porque reemplaza la demostración inicial.','Para evitar registrar datos del cliente.'], correcta:1, explicacion:'La posventa fortalece la experiencia del usuario y abre oportunidades de servicio genuinas.' }
    ];
    return [
      { area:'Programa de capacitación básica', tema:'Acción diaria', pregunta:'¿Qué hábito ayuda más a que un negocio avance de manera sostenida?', opciones:['Esperar el momento perfecto.','Hacer acciones simples y medibles todos los días.','Trabajar sólo cuando aparece una urgencia.','Cambiar de plan antes de medirlo.'], correcta:1, explicacion:'La constancia transforma acciones pequeñas en resultados acumulados.' },
      { area:'Comercialización', tema:'Escuchar primero', pregunta:'Cuando una persona consulta por un producto PSA, ¿cuál es un buen primer paso?', opciones:['Recomendar el producto más caro.','Preguntar por su necesidad, uso y contexto.','Mandar toda la lista sin explicación.','Hablar solamente de precios.'], correcta:1, explicacion:'Escuchar permite orientar la conversación hacia una solución útil y honesta.' },
      { area:'Posventa', tema:'Vínculo con usuarios', pregunta:'¿Qué acción fortalece la relación con un usuario PSA?', opciones:['Contactarlo sólo si hay una venta inmediata.','Acompañarlo con información útil sobre uso, mantenimiento o vencimiento.','No registrar nunca sus datos.','Cambiarle el producto sin consultarle.'], correcta:1, explicacion:'El servicio después de la venta es parte central de una relación de confianza.' },
      { area:'Crecimiento empresarial', tema:'Invitación', pregunta:'¿Qué hace más clara una invitación al Negocio PSA?', opciones:['Prometer resultados sin conocer a la persona.','Compartir la oportunidad con claridad y dejar espacio para preguntas.','Evitar explicar cómo es el proceso.','Presionar para obtener una respuesta inmediata.'], correcta:1, explicacion:'Una invitación profesional informa, escucha y respeta el tiempo de la otra persona.' },
      { area:'Autoliderazgo', tema:'Foco', pregunta:'Si el día se complica y sólo podés hacer una acción importante, ¿qué conviene elegir?', opciones:['Una tarea que acerque una conversación, seguimiento o demo real.','Ordenar íconos del teléfono.','Esperar al día siguiente.','Cambiar de objetivo sin mirar prioridades.'], correcta:0, explicacion:'Cuando el tiempo es limitado, conviene priorizar la acción que mueve una relación o una oportunidad real.' }
    ];
  }

  function resumenBase(){
    try {
      if (window.APPIMensajes && typeof window.APPIMensajes.resumenBaseHoy === 'function') return window.APPIMensajes.resumenBaseHoy();
    } catch(e){}
    return { total:0, hechas:0, noHechas:0, pendientes:0 };
  }
  function desafioDisponible(){
    var r = resumenBase();
    return r.total >= BASE_ACCIONES && r.hechas >= BASE_ACCIONES && r.noHechas === 0;
  }
  function resumenJornada(){
    try { if (window.APPIMensajes && window.APPIMensajes.resumenHoy) return window.APPIMensajes.resumenHoy(); }catch(e){}
    return { total:BASE_ACCIONES, hechas:0, noHechas:0, pendientes:BASE_ACCIONES };
  }

  /* ---------- Contenido real del Campus (v640 · v644) ----------
     El contenido del Campus sale de la edge campus-contenido con las credenciales MI PSA
     de CADA usuario (caché compartida en la nube, refrescada por quien
     primero la pida). Sin cuenta MI PSA no hay rastreo propio: se usa la
     última copia (respaldo local) y aparece el aviso para cargarla. La
     clave del respaldo NO sincroniza: es artefacto de red, no dato. */
  var CONTENIDO_LOCAL = 'appi_campus_contenido_v1';
  // v654: la clave se renombró (antes se llamaba como el término que ya no
  // usamos). Si el dispositivo todavía tiene la copia vieja, se migra acá
  // mismo: nadie pierde su contenido guardado del Campus.
  try {
    var _claveVieja = localStorage.getItem('appi_campus_catalogo_v1');
    if (_claveVieja && !localStorage.getItem(CONTENIDO_LOCAL)){
      localStorage.setItem(CONTENIDO_LOCAL, _claveVieja);
    }
    if (_claveVieja) localStorage.removeItem('appi_campus_catalogo_v1');
  } catch(e){}
  var contenidoMem = null;
  var contenidoPidiendo = null;
  var contenidoEstado = null; // null | 'cargando' | 'ok' | 'sinCuenta' | 'error'

  function credsCampus(){
    try { return (typeof window.psaGetCreds === 'function') ? window.psaGetCreds() : null; } catch(e){ return null; }
  }
  function tieneCuentaCampus(){
    var c = credsCampus();
    return !!(c && c.center && c.number && c.password);
  }
  function nubeCfg(){
    var cfg = (window.APPI_AUTH && window.APPI_AUTH.url && window.APPI_AUTH.anonKey) ? window.APPI_AUTH : null;
    if (!cfg) return null;
    var token = '';
    try {
      if (window.APPIAuth && typeof window.APPIAuth.accessToken === 'function') token = window.APPIAuth.accessToken();
      if (!token){
        var v = JSON.parse(localStorage.getItem('appi_auth_session_v1') || 'null');
        token = v && v.session && v.session.access_token || '';
      }
    } catch(e){}
    return { url: cfg.url, anonKey: cfg.anonKey, token: token };
  }
  function contenidoValido(cont){ return !!(cont && cont.kits && cont.kits.length); }
  function respaldoContenido(maxDias){
    try {
      var prev = JSON.parse(localStorage.getItem(CONTENIDO_LOCAL) || 'null');
      if (!contenidoValido(prev)) return null;
      if (maxDias && prev.generado){
        var t = Date.parse(prev.generado);
        if (t && Date.now() - t > maxDias * 86400000) return null;
      }
      return prev;
    } catch(e){ return null; }
  }
  function guardarContenido(cont){
    contenidoMem = cont;
    try { localStorage.setItem(CONTENIDO_LOCAL, JSON.stringify(cont)); } catch(e){}
  }
  function fijarEstado(estado){
    if (contenidoEstado === estado) return;
    contenidoEstado = estado;
    try {
      window.dispatchEvent(new CustomEvent('appi-campus-estado', { detail: { estado: estado } }));
    } catch(e){}
  }
  // Los fallos generales de red o de PSA no deben interrumpir la entrada a
  // APPI: si hay copia local se usa en silencio y, si no, la vista muestra su
  // estado. Sólo una respuesta inequívoca de credenciales inválidas abre el
  // formulario de MI PSA para corregir los datos directamente.
  function esErrorCredencialesPSA(error){
    var codigo = String((error && (error.code || error.codigo)) || '');
    var mensaje = String((error && error.message) || error || '');
    return codigo === 'psa_credentials' ||
      /mi\.psa\.com\.ar.*(?:esos datos|clave correcta)|credenciales?\s+(?:de\s+)?(?:mi\s+)?psa\s+(?:inv[aá]lidas?|incorrectas?)/i.test(mensaje);
  }
  function avisarCredencialesCampus(error){
    if (!esErrorCredencialesPSA(error)) return false;
    var mensaje = String((error && error.message) || 'No pudimos ingresar a MI PSA con los datos guardados.');
    try{
      if (typeof window.mostrarPopupPSAVerificar === 'function'){
        return !!window.mostrarPopupPSAVerificar(mensaje);
      }
      // El formulario vive al final de index.html. Si el chequeo terminó antes
      // de que ese bloque se cargara, se le da una única oportunidad más.
      setTimeout(function(){
        try{ if (typeof window.mostrarPopupPSAVerificar === 'function') window.mostrarPopupPSAVerificar(mensaje); }catch(e){}
      }, 500);
    }catch(e){}
    return false;
  }
  function pedirContenidoNube(){
    var cfg = nubeCfg();
    var c = credsCampus();
    if (!cfg || !c) return Promise.reject(new Error('sin cuenta MI PSA'));
    return fetch(cfg.url + '/functions/v1/campus-contenido', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'apikey': cfg.anonKey, 'Authorization': 'Bearer ' + (cfg.token || cfg.anonKey) },
      body: JSON.stringify({ center: c.center, number: c.number, password: c.password })
    }).then(function(r){
      return r.json().catch(function(){ return {}; }).then(function(j){
        if (!r.ok || !j || j.error || !contenidoValido(j.cont)){
          var error = new Error((j && j.error) || 'No se pudo actualizar el contenido del Campus.');
          error.code = (j && j.code) || '';
          // Compatibilidad con una función anterior al código explícito.
          if (!error.code && r.status === 401 && /mi\.psa\.com\.ar.*(?:esos datos|clave correcta)/i.test(error.message)) error.code = 'psa_credentials';
          throw error;
        }
        return j.cont;
      });
    });
  }
  /** Refresco en segundo plano: la pantalla ya muestra la última copia. */
  function refrescarNube(){
    pedirContenidoNube().then(function(cont){
      guardarContenido(cont);
      fijarEstado('ok');
      try { window.dispatchEvent(new Event('appi-campus-contenido')); } catch(e){}
    }).catch(function(error){
      fijarEstado('error');
      avisarCredencialesCampus(error);
    });
  }
  function cargarContenido(){
    if (contenidoMem) return Promise.resolve(contenidoMem);
    if (contenidoPidiendo) return contenidoPidiendo;
    // v644: este módulo se carga en el <head> y el script de credenciales
    // (psaGetCreds) es inline, más abajo en el body. Si se decide "sin cuenta"
    // antes de que exista, el estado queda mentido para toda la sesión:
    // se espera al load y recién ahí se pregunta por las credenciales.
    if (typeof window.psaGetCreds !== 'function' && document.readyState !== 'complete'){
      return new Promise(function(res, rej){
        window.addEventListener('load', function(){
          setTimeout(function(){ cargarContenido().then(res, rej); }, 0);
        });
      });
    }
    var conCuenta = tieneCuentaCampus();
    if (!conCuenta) fijarEstado('sinCuenta');
    else fijarEstado('cargando');
    var local = respaldoContenido(7);
    if (local){
      guardarContenido(local);
      if (conCuenta) refrescarNube();
      contenidoPidiendo = Promise.resolve(local);
      return contenidoPidiendo;
    }
    // Sin copia local: la nube de tu cuenta MI PSA es el único camino.
    // v647: se retiró el JSON de respaldo del repo (volcado de una cuenta fija).
    contenidoPidiendo = (conCuenta ? pedirContenidoNube() : Promise.reject(new Error('sin cuenta MI PSA')))
      .then(function(cont){
        guardarContenido(cont);
        fijarEstado('ok');
        return cont;
      })
      .catch(function(error){
        fijarEstado(conCuenta ? 'error' : 'sinCuenta');
        if (conCuenta) avisarCredencialesCampus(error);
        throw error || new Error('No hay contenido del Campus disponible.');
      })
      .then(function(cont){ contenidoPidiendo = null; return cont; },
            function(e){ contenidoPidiendo = null; throw e; });
    return contenidoPidiendo;
  }
  function reintentarContenido(){
    contenidoMem = null;
    contenidoPidiendo = null;
    contenidoEstado = null;
    return cargarContenido();
  }
  function contenido(){ return contenidoMem; }
  function norm(s){
    return String(s == null ? '' : s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-AR');
  }
  function segs(d){
    var m = /(\d{1,2}):(\d{2})/.exec(String(d || ''));
    return m ? (+m[1]) * 60 + (+m[2]) : 9999;
  }

  /** Todas las clases del contenido del Campus aplanadas, con su área y sección. */
  function aplanarClases(){
    var out = [];
    var cont = contenidoMem;
    if (!cont) return out;
    (cont.kits || []).forEach(function(kit){
      (kit.secciones || []).forEach(function(sec){
        (sec.clases || []).forEach(function(clase){
          out.push({
            id: clase.url,
            titulo: clase.titulo,
            autor: clase.autor || '',
            duracion: clase.duracion || '',
            stream: clase.stream || '',
            url: clase.url,
            area: kit.titulo,
            areaSlug: kit.slug,
            seccion: sec.titulo
          });
        });
      });
    });
    return out;
  }

  function buscar(q){
    var nq = norm(q).trim();
    if (!nq) return [];
    return aplanarClases().filter(function(c){
      return norm(c.titulo + ' ' + c.seccion + ' ' + c.area + ' ' + c.autor).indexOf(nq) >= 0;
    });
  }

  /* ---------- Avance propio (v641) ----------
     Vive dentro del mismo estado que ya sincroniza data-sync con la cuenta
     (prefijo appi_campus_psa_v1_): nube, backup y titular/socio compartido,
     sin tabla nueva. */
  function avanceDe(id){
    try {
      var data = leer();
      return (data.avance && data.avance[id]) || null;
    } catch(e){ return null; }
  }
  function esVisto(id){
    var a = avanceDe(id);
    return !!(a && Number(a.pct) >= 90);
  }
  function marcarVisto(id, pct, tipo){
    try {
      var data = leer();
      if (!data.avance || typeof data.avance !== 'object') data.avance = {};
      var prev = data.avance[id] || {};
      var nuevo = Math.max(Number(prev.pct) || 0, Number(pct) || 0);
      if (nuevo > 100) nuevo = 100;
      data.avance[id] = {
        pct: Math.round(nuevo),
        estado: nuevo >= 90 ? 'visto' : (prev.estado || ''),
        tipo: tipo || prev.tipo || 'video',
        ts: Date.now(),
        dia: hoyKey()
      };
      guardar(data);
      try {
        window.dispatchEvent(new CustomEvent('appi-campus-avance', {
          detail: { id: id, pct: data.avance[id].pct, visto: nuevo >= 90 }
        }));
      } catch(e){}
      return data.avance[id];
    } catch(e){ return null; }
  }
  function avanceResumen(){
    var todas = aplanarClases();
    var vistas = todas.filter(function(c){ return esVisto(c.id); }).length;
    return { total: todas.length, vistas: vistas, pct: todas.length ? Math.round((vistas / todas.length) * 100) : 0 };
  }

  /* ---------- Preguntas post-video (v646) ----------
     Al terminar una clase con banco se abren 3 preguntas originales de
     APPI. Si la errás no se revela cuál era la correcta: se reintenta
     hasta acertar. Las clases sin banco siguen marcándose "vista ✓". */
  function bancoDe(url){
    try {
      if (window.APPICampusPreguntas && typeof window.APPICampusPreguntas.preguntasDeClase === 'function'){
        return window.APPICampusPreguntas.preguntasDeClase(url);
      }
    } catch(e){}
    return null;
  }
  function clasePorId(id){
    var all = aplanarClases();
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
    return null;
  }
  function quizPasado(url){
    try {
      var data = leer();
      return !!(data.quiz && data.quiz[url] && data.quiz[url].ok);
    } catch(e){ return false; }
  }

  /* ---------- Racha de días con clase (v646) ----------
     Días seguidos con al menos una clase completada. Vive en el mismo
     estado que ya sincroniza data-sync (prefijo appi_campus_psa_v1_). */
  function diaClave(d){
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function rachaDeClases(){
    try {
      var data = leer();
      var dias = (data.racha && data.racha.dias) || {};
      var d = new Date();
      if (!dias[diaClave(d)]) d.setDate(d.getDate() - 1); // hoy aún sin clase: la racha se mantiene desde ayer
      var n = 0;
      while (dias[diaClave(d)]){ n++; d.setDate(d.getDate() - 1); }
      return { actual: n, max: (data.racha && data.racha.max) || 0, hoyHecha: !!dias[hoyKey()] };
    } catch(e){ return { actual:0, max:0, hoyHecha:false }; }
  }
  function registrarClaseCompleta(){
    try {
      var data = leer();
      if (!data.racha || typeof data.racha !== 'object') data.racha = { dias:{}, max:0 };
      if (!data.racha.dias || typeof data.racha.dias !== 'object') data.racha.dias = {};
      var hoy = hoyKey();
      data.racha.dias[hoy] = (Number(data.racha.dias[hoy]) || 0) + 1;
      var claves = Object.keys(data.racha.dias);
      if (claves.length > 150){
        claves.sort();
        for (var i = 0; i < claves.length - 150; i++) delete data.racha.dias[claves[i]];
      }
      guardar(data);
      var r = rachaDeClases();
      if (r.actual > (data.racha.max || 0)){
        data.racha.max = r.actual;
        guardar(data);
      }
      return r;
    } catch(e){ return { actual:0, max:0, hoyHecha:false }; }
  }
  function chipRacha(){
    try {
      var r = rachaDeClases();
      if (r.actual <= 0) return '';
      return '<span class="cp-racha' + (r.hoyHecha ? ' on' : '') + '" data-cp-racha="' + r.actual + '">🔥 ' + r.actual + ' día' + (r.actual === 1 ? '' : 's') + ' seguido' + (r.actual === 1 ? '' : 's') + (r.hoyHecha ? ' ✓' : '') + '</span>';
    } catch(e){ return ''; }
  }

  var pvSession = null;
  function iniciarQuizPostVideo(clase, preguntas){
    pvSession = { id: clase.id, titulo: clase.titulo, area: clase.area, seccion: clase.seccion, index:0, correctas:0, preguntas:preguntas, esperando:false };
    pintarPreguntaPV();
  }
  function pintarPreguntaPV(){
    var p = pvSession.preguntas[pvSession.index];
    if (!p){ finalizarQuizPV(); return; }
    var opciones = p.opciones.map(function(txt, i){
      return '<button type="button" class="cp-option" data-pv-answer="' + i + '"><b>' + String.fromCharCode(65 + i) + '.</b>&nbsp; ' + esc(txt) + '</button>';
    }).join('');
    abrirModal(
      '<div class="cp-quiz-top"><button type="button" class="cp-back" id="cpPvBack" aria-label="Volver">‹</button><span class="cp-question-label" style="flex:1">🎓 Revisá lo que viste</span><span class="cp-q-count" id="cpPvCount">' + (pvSession.index + 1) + '/' + pvSession.preguntas.length + '</span></div>' +
      '<div class="cp-quiz-body"><span class="cp-question-label">' + esc(pvSession.area) + '</span><span class="cp-question-topic">' + esc(pvSession.seccion || pvSession.titulo) + '</span><h2 class="cp-question">' + esc(p.pregunta) + '</h2><div class="cp-options">' + opciones + '</div><div class="cp-feedback" id="cpPvFeedback"></div><button type="button" class="cp-primary cp-next" id="cpPvNext"></button></div>'
    );
    document.getElementById('cpPvBack').onclick = cerrarModal;
    document.querySelectorAll('[data-pv-answer]').forEach(function(btn){
      btn.onclick = function(){ responderPV(Number(btn.getAttribute('data-pv-answer'))); };
    });
  }
  function responderPV(indice){
    if (!pvSession || pvSession.esperando) return;
    var p = pvSession.preguntas[pvSession.index];
    var ok = indice === p.correcta;
    var all = Array.prototype.slice.call(document.querySelectorAll('[data-pv-answer]'));
    all.forEach(function(btn, i){
      btn.disabled = true;
      // Sin regalar el acierto: al errar sólo se marca la opción elegida.
      if (i === indice) btn.classList.add(ok ? 'correct' : 'wrong');
    });
    var feed = document.getElementById('cpPvFeedback');
    var next = document.getElementById('cpPvNext');
    feed.innerHTML = ok
      ? '<b>¡Bien!</b>' + esc(p.explicacion || 'Buena respuesta.')
      : '<b>Casi: revisá esa opción otra vez.</b>' + esc(p.explicacion || 'Volvé a intentarlo.');
    feed.classList.add('show');
    if (ok){
      pvSession.correctas++;
      next.textContent = pvSession.index === pvSession.preguntas.length - 1 ? 'Terminar' : 'Seguir';
      next.onclick = function(){ pvSession.index++; pintarPreguntaPV(); };
    } else {
      next.textContent = 'Reintentar esta pregunta';
      next.onclick = function(){ pintarPreguntaPV(); };
    }
    next.classList.add('show');
  }
  function finalizarQuizPV(){
    try {
      var data = leer();
      if (!data.quiz || typeof data.quiz !== 'object') data.quiz = {};
      data.quiz[pvSession.id] = { ok:true, ts:Date.now(), dia:hoyKey() };
      guardar(data);
    } catch(e){}
    var r = { actual:0 };
    try { r = registrarClaseCompleta(); } catch(e){}
    var sub = r.actual >= 3
      ? '<b>¡' + r.actual + ' días seguidos! 🔥</b> Tu constancia en el Campus se nota: mañana sumás uno más.'
      : (r.actual > 1 ? '<b>' + r.actual + ' días seguidos.</b> Mañana tenés una clase para sostener la racha.' : '<b>Clase completada.</b> Mañana sumá otra para encadenar días.');
    try { window.dispatchEvent(new CustomEvent('appi-campus-avance', { detail:{ id: pvSession.id, pct:100, visto:true, racha: r.actual } })); } catch(e){}
    pvSession = null;
    abrirModal(
      '<section class="cp-celebrate"><div class="cp-trophy">🎓</div><h2>¡Clase<br>completa!</h2><p>' + sub + '</p></section>' +
      '<div class="cp-modal-foot"><button type="button" class="cp-primary" id="cpPvDone">Seguir aprendiendo</button></div>'
    );
    document.getElementById('cpPvDone').onclick = cerrarModal;
  }
  /** Se dispara al llegar al 90%, al terminar o al marcar a mano una clase.
      Devuelve true si tomó el popup con el quiz (la hoja de clase queda
      reemplazada); si no hay banco —o ya está aprobado— sólo registra la
      racha y devuelve false para que el llamador cierre la hoja. */
  function ofrecerPostVideo(id, tipo){
    try {
      if (tipo && tipo !== 'video') return false;
      if (pvSession) return false; // ya hay un quiz abierto
      if (quizPasado(id)) { registrarClaseCompleta(); return false; }
      var preg = bancoDe(id);
      if (!preg || preg.length < 3) { registrarClaseCompleta(); return false; }
      var clase = clasePorId(id);
      if (!clase) { registrarClaseCompleta(); return false; }
      soltarReproductor(); // el quiz reemplaza la hoja: corta el stream antes
      iniciarQuizPostVideo(clase, preg);
      return true;
    } catch(e){ return false; }
  }

  /** La próxima clase de la ruta: según el contexto del negocio y siempre la
      más corta entre las pendientes (3 a 10 minutos, para el hueco del día). */
  function proximaClase(contexto){
    var pend = aplanarClases().filter(function(c){ return !esVisto(c.id); });
    if (!pend.length) return null;
    var por = {
      canje: function(c){ return /posventa/.test(norm(c.area)) && /canje/.test(norm(c.titulo + ' ' + c.seccion)); },
      equipo: function(c){ return /capacitacion basica/.test(norm(c.area)) && /(demostracion|patrocinio|contactos)/.test(norm(c.seccion + ' ' + c.titulo)); },
      visita: function(c){ return /dip tecnico/.test(norm(c.area)); },
      pb: function(c){ return /comercializacion/.test(norm(c.area)); }
    }[norm(contexto)];
    var elegidas = por ? pend.filter(por) : pend;
    if (!elegidas.length) elegidas = pend;
    elegidas.sort(function(a, b){ return segs(a.duracion) - segs(b.duracion); });
    return elegidas[0];
  }

  /* ---------- Reproductor de la hoja Clase ---------- */
  var reproductor = { hls: null, media: null, id: null };
  function soltarReproductor(){
    try { if (reproductor.hls) reproductor.hls.destroy(); } catch(e){}
    try {
      if (reproductor.media) {
        reproductor.media.pause();
        reproductor.media.removeAttribute('src');
        reproductor.media.load();
      }
    } catch(e){}
    reproductor = { hls: null, media: null, id: null };
  }
  function cargarHls(cb){
    if (window.Hls) return cb(null);
    var existente = document.querySelector('script[data-appi-hls]');
    if (existente){
      existente.addEventListener('load', function(){ cb(window.Hls ? null : new Error('sin hls')); });
      existente.addEventListener('error', function(){ cb(new Error('sin hls')); });
      return;
    }
    var s = document.createElement('script');
    s.src = './vendor/hls.min.js';
    s.setAttribute('data-appi-hls', '1');
    s.onload = function(){ cb(window.Hls ? null : new Error('sin hls')); };
    s.onerror = function(){ cb(new Error('sin hls')); };
    document.head.appendChild(s);
  }
  function notaReproductor(txt){
    var el = document.getElementById('cpClassNote');
    if (el) el.textContent = txt;
  }
  function marcarHechoUI(){
    var btn = document.getElementById('cpClassDone');
    if (btn){ btn.disabled = true; btn.textContent = 'Vista ✓'; }
    var chip = document.getElementById('cpClassState');
    if (chip){ chip.classList.add('ok'); chip.textContent = '✓ vista'; }
  }
  function cablearReproductor(mediaEl, url, id, tipo, libre){
    soltarReproductor();
    reproductor.media = mediaEl;
    reproductor.id = id;
    try { mediaEl.setAttribute('data-stream', url); } catch(e){}
    var ultimoGuardado = 0;
    mediaEl.addEventListener('timeupdate', function(){
      try {
        // v654: el Vivo se reproduce libre — no se guarda avance ni se marca.
        if (libre) return;
        if (!mediaEl.duration || !isFinite(mediaEl.duration)) return;
        var pct = (mediaEl.currentTime / mediaEl.duration) * 100;
        if (pct >= 90 && ultimoGuardado < 90){
          ultimoGuardado = 100;
          marcarVisto(id, 100, tipo);
          marcarHechoUI();
          ofrecerPostVideo(id, tipo);
        } else {
          var decena = Math.floor(pct / 10) * 10;
          if (decena > ultimoGuardado){
            ultimoGuardado = decena;
            marcarVisto(id, decena, tipo);
          }
        }
      } catch(e){}
    });
    mediaEl.addEventListener('ended', function(){
      if (libre) return;
      try { marcarVisto(id, 100, tipo); } catch(e){}
      marcarHechoUI();
      ofrecerPostVideo(id, tipo);
    });
    var nativo = mediaEl.canPlayType && mediaEl.canPlayType('application/vnd.apple.mpegurl');
    if (nativo){ mediaEl.src = url; return; }
    cargarHls(function(err){
      if (err || !window.Hls || !window.Hls.isSupported()){
        notaReproductor('Este navegador no puede reproducir el stream. Abrilo en Campus con el botón de abajo.');
        return;
      }
      try {
        var hls = new window.Hls();
        reproductor.hls = hls;
        hls.loadSource(url);
        hls.attachMedia(mediaEl);
        hls.on(window.Hls.Events.ERROR, function(ev, data){
          if (data && data.fatal) notaReproductor('No se pudo cargar el video ahora. Probá “Abrir en Campus” o dejalo para más tarde.');
        });
      } catch(e){
        notaReproductor('No se pudo iniciar el reproductor. Abrilo en Campus.');
      }
    });
  }

  /** Hoja Clase: video HLS inline (o audio), avance propio y salida al Campus. */
  function abrirClase(clase){
    if (!clase || !clase.id) return;
    var av = avanceDe(clase.id);
    var hecho = av && Number(av.pct) >= 90;
    var parcial = av && Number(av.pct) > 0 && !hecho;
    abrirModal(
      '<div class="cp-quiz-top"><button type="button" class="cp-back" id="cpClassBack" aria-label="Volver">‹</button><span class="cp-question-label" style="flex:1">🎓 ' + esc(clase.area) + '</span></div>' +
      '<div class="cp-quiz-body"><span class="cp-question-topic">' + esc(clase.seccion) + '</span><h2 class="cp-question" id="cpClassTitle">' + esc(clase.titulo) + '</h2>' +
      '<div class="cp-class-chips">' +
        '<span class="cp-chip' + (hecho ? ' ok' : '') + '" id="cpClassState">' + (hecho ? '✓ vista' : (parcial ? Math.round(av.pct) + '% vista' : 'por ver')) + '</span>' +
        (clase.autor ? '<span class="cp-chip">' + esc(clase.autor) + '</span>' : '') +
        (clase.duracion ? '<span class="cp-chip">⏱ ' + esc(clase.duracion) + '</span>' : '') +
      '</div>' +
      '<div class="cp-repro" id="cpClassMedia"><video controls playsinline preload="metadata" id="cpClassVideo"></video></div>' +
      '<div class="cp-repro-note" id="cpClassNote">Se reproduce desde el Campus PSA (no se copia el video). Al llegar al 90% se marca solo.</div></div>' +
      '<div class="cp-modal-foot"><button type="button" class="cp-primary" id="cpClassDone"' + (hecho ? ' disabled' : '') + '>' + (hecho ? 'Vista ✓' : 'Marcar como vista') + '</button>' +
      '<a class="cp-secondary" id="cpClassOpen" href="https://campus.psa.com.ar' + esc(clase.url) + '" target="_blank" rel="noopener">Abrir en Campus ↗</a></div>'
    );
    document.getElementById('cpClassBack').onclick = cerrarModal;
    document.getElementById('cpClassDone').onclick = function(){
      marcarVisto(clase.id, 100, 'video');
      // Marcar a mano cierra la hoja: si la clase tiene banco sin aprobar,
      // el quiz de verificación toma el popup en su lugar.
      if (!ofrecerPostVideo(clase.id, 'video')) cerrarModal();
    };
    var media = document.getElementById('cpClassVideo');
    if (media && clase.stream){
      cablearReproductor(media,
        'https://psavod-ns.akamaized.net/delivery/Campus/Videos/HLS/' + clase.stream + '/playlist.m3u8',
        clase.id, 'video');
    } else if (media){
      notaReproductor('Esta clase no tiene stream disponible. Abrila en Campus.');
    }
  }

  /** Hoja de audio (playlists del Campus): mismo avance, sin video. */
  function abrirAudio(audio, listaTitulo){
    if (!audio || !audio.stream) return;
    var id = 'audio:' + audio.audioId;
    var av = avanceDe(id);
    var hecho = av && Number(av.pct) >= 90;
    abrirModal(
      '<div class="cp-quiz-top"><button type="button" class="cp-back" id="cpClassBack" aria-label="Volver">‹</button><span class="cp-question-label" style="flex:1">🎧 ' + esc(listaTitulo || 'Audios del Campus') + '</span></div>' +
      '<div class="cp-quiz-body"><h2 class="cp-question" id="cpClassTitle">' + esc(audio.titulo) + '</h2>' +
      '<div class="cp-class-chips"><span class="cp-chip' + (hecho ? ' ok' : '') + '" id="cpClassState">' + (hecho ? '✓ escuchado' : 'por escuchar') + '</span><span class="cp-chip">audio</span></div>' +
      '<div class="cp-repro" id="cpClassMedia"><audio controls preload="metadata" id="cpClassAudio"></audio></div>' +
      '<div class="cp-repro-note" id="cpClassNote">Se reproduce desde el Campus PSA. Tu avance queda guardado en APPI.</div></div>' +
      '<div class="cp-modal-foot"><button type="button" class="cp-primary" id="cpClassDone"' + (hecho ? ' disabled' : '') + '>' + (hecho ? 'Escuchado ✓' : 'Marcar como escuchado') + '</button>' +
      '<a class="cp-secondary" id="cpClassOpen" href="https://campus.psa.com.ar/audio/transmitidos" target="_blank" rel="noopener">Abrir en Campus ↗</a></div>'
    );
    document.getElementById('cpClassBack').onclick = cerrarModal;
    document.getElementById('cpClassDone').onclick = function(){
      marcarVisto(id, 100, 'audio');
      cerrarModal(); // los audios no tienen banco de preguntas
    };
    var media = document.getElementById('cpClassAudio');
    if (media){
      cablearReproductor(media,
        'https://psavod-ns.akamaized.net/delivery/Campus/Audios/HLS/' + audio.stream + '/playlist.m3u8',
        id, 'audio');
    }
  }

  function css(){
    if (document.getElementById('campusPsaStyle')) return;
    var st = document.createElement('style');
    st.id = 'campusPsaStyle';
    st.textContent = [
      '#view-campus{background:#f3eee3}',
      '.cp-wrap{max-width:780px;margin:0 auto;padding:2px 14px calc(108px + env(safe-area-inset-bottom))}',
      '.cp-hero{padding:17px 4px 15px;display:flex;justify-content:space-between;align-items:flex-start;gap:12px}',
      '.cp-kicker{display:inline-flex;align-items:center;gap:5px;padding:5px 9px;border-radius:999px;background:#e5fbf5;color:#147a68;font-size:9px;font-weight:950;letter-spacing:.75px}',
      '.cp-hero h2{margin:8px 0 5px;font-size:27px;line-height:1.05;letter-spacing:-1.1px;color:#152c43}',
      '.cp-hero p{margin:0;color:#70809a;font-size:12px;line-height:1.45;max-width:440px;font-weight:650}',
      '.cp-category{flex:0 0 auto;max-width:150px;padding:8px 10px;border:1px solid #caebe2;border-radius:13px;background:rgba(240,255,250,.86);color:#177b69;font-size:9px;line-height:1.25;font-weight:900;text-align:center}',
      '.cp-category span{display:block;margin-top:2px;font-size:11px}',
      '.cp-progress{position:relative;overflow:hidden;padding:18px;border-radius:21px;background:linear-gradient(130deg,#073d5d,#087e89 55%,#2ac8c4);box-shadow:0 14px 28px rgba(7,106,127,.19);color:#fff}',
      '.cp-progress:after{content:"";position:absolute;width:220px;height:220px;right:-86px;top:-150px;border:34px solid rgba(217,255,249,.17);border-radius:50%}',
      '.cp-progress-row{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:10px}',
      '.cp-progress h3{margin:0 0 4px;font-size:16px;letter-spacing:-.4px}.cp-progress p{margin:0;color:#cef8f3;font-size:11px;line-height:1.35}.cp-score{font-size:25px;font-weight:950;letter-spacing:-1px;white-space:nowrap}',
      '.cp-meter{position:relative;z-index:1;height:10px;margin:15px 0 6px;border-radius:999px;background:rgba(255,255,255,.23);overflow:hidden}.cp-meter i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#baf57e,#efffd1);transition:width .35s}.cp-progress small{position:relative;z-index:1;font-size:10px;color:#e0fffa;font-weight:800}',
      '.cp-section-head{display:flex;align-items:end;justify-content:space-between;gap:10px;margin:25px 3px 10px}.cp-section-head h3{margin:0;font-size:18px;color:#1c3149;letter-spacing:-.5px}.cp-section-head span{font-size:10px;color:#77879d;font-weight:800}',
      '.cp-path{position:relative;display:grid;grid-template-columns:repeat(5,1fr);gap:5px;padding:6px 0 3px}.cp-path:before{content:"";position:absolute;left:9%;right:9%;top:36px;height:5px;border-radius:99px;background:#d9e8eb}.cp-step{position:relative;z-index:1;text-align:center}.cp-step i{width:59px;height:59px;display:grid;place-items:center;margin:auto;border:4px solid #f7fcfd;border-radius:21px;background:#e4ecef;color:#7790a2;font-style:normal;font-size:22px;box-shadow:0 7px 14px rgba(40,83,101,.12)}.cp-step b{display:block;margin-top:6px;color:#344b64;font-size:9px;line-height:1.15}.cp-step small{display:block;margin-top:2px;color:#8391a4;font-size:8px;font-weight:800}.cp-step.done i{background:linear-gradient(135deg,#5edfb0,#27b8c5);color:#fff}.cp-step.live i{background:linear-gradient(135deg,#8a7ce9,#645bd5);color:#fff;animation:cpFloat 2.7s ease-in-out infinite}@keyframes cpFloat{50%{transform:translateY(-4px)}}',
      '.cp-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:11px;margin-top:25px}.cp-card{padding:15px;border:1px solid #dce8ed;border-radius:18px;background:#fff;box-shadow:0 6px 17px rgba(27,64,84,.04)}.cp-card.featured{border-color:#ddd7fb;background:linear-gradient(135deg,#f4f0ff,#f5fcff)}.cp-card .cp-eyebrow{font-size:9px;letter-spacing:.7px;font-weight:950;text-transform:uppercase;color:#7465db}.cp-card:not(.featured) .cp-eyebrow{color:#b57816}.cp-card h4{margin:6px 0;color:#273d56;font-size:14px;letter-spacing:-.25px}.cp-card p{margin:0;color:#738299;font-size:11px;line-height:1.4}.cp-card button,.cp-main-btn{margin-top:12px;border:0;border-radius:11px;padding:9px 12px;background:#7566dc;color:#fff;font:inherit;font-size:10.5px;font-weight:950;cursor:pointer}.cp-card:not(.featured) button{background:#efa840}',
      '.cp-main-btn{width:100%;min-height:49px;margin-top:19px;font-size:13px;background:linear-gradient(135deg,#7566dc,#9582f0);box-shadow:0 6px 0 #5547b7}.cp-main-btn:active{transform:translateY(3px);box-shadow:0 3px 0 #5547b7}.cp-main-btn.ready{background:linear-gradient(135deg,#0d8b84,#38cda4);box-shadow:0 6px 0 #087064}.cp-main-btn[disabled]{cursor:default;background:#cbd7dd;box-shadow:none;color:#6c8090}',
      '.cp-note{margin:11px 5px 0;color:#718099;font-size:10.5px;text-align:center;font-weight:650;line-height:1.4}',
      '.cp-aviso{margin:13px 0 5px;padding:14px 15px;border-radius:17px;border:1.5px solid #ffe08a;background:linear-gradient(150deg,#fff9e8,#fffdf6);box-shadow:0 6px 16px rgba(214,166,44,.13);text-align:left}',
      '.cp-aviso.err{border-color:#bcd7ff;background:linear-gradient(150deg,#eff5ff,#f8fbff);box-shadow:0 6px 16px rgba(58,110,206,.1)}',
      '.cp-aviso-t{font-size:13px;font-weight:1000;color:#7a5b06;letter-spacing:-.2px}',
      '.cp-aviso.err .cp-aviso-t{color:#1d4fa8}',
      '.cp-aviso p{margin:6px 0 0;color:#6b6553;font-size:11px;line-height:1.45;font-weight:650}',
      '.cp-aviso.err p{color:#5a6b83}',
      '.cp-aviso button{margin-top:10px;width:100%;min-height:42px;border:0;border-radius:13px;background:linear-gradient(135deg,#f0b429,#f5cd62);color:#3d2e00;font:inherit;font-size:12.5px;font-weight:1000;cursor:pointer;box-shadow:0 4px 0 #c99514}',
      '.cp-aviso button:active{transform:translateY(2px);box-shadow:0 2px 0 #c99514}',
      '.cp-aviso.err button{background:linear-gradient(135deg,#4f7fe8,#6f9dff);color:#fff;box-shadow:0 4px 0 #3a62bd}',
      '.cp-aviso small{display:block;margin-top:8px;color:#8a8168;font-size:9.5px;font-weight:750}',
      '.dark .cp-aviso{background:linear-gradient(150deg,#3a331d,#2a2c26);border-color:#8a7534}.dark .cp-aviso p{color:#cfc7ae}.dark .cp-aviso-t{color:#ffd977}.dark .cp-aviso.err{background:linear-gradient(150deg,#22304a,#232a38);border-color:#4a6aa8}.dark .cp-aviso.err .cp-aviso-t{color:#9fc1ff}.dark .cp-aviso.err p{color:#aebed4}',
      '.cp-aviso.mini{display:flex;align-items:center;gap:10px;padding:9px 12px;margin:10px 0 4px}',
      '.cp-aviso.mini .cp-aviso-t{font-size:11.5px}',
      '.cp-aviso.mini p{margin:2px 0 0;font-size:10px}',
      '.cp-aviso.mini button{margin-top:0;width:auto;min-height:32px;padding:0 14px;flex:none;font-size:11.5px;border-radius:11px}',
      '.cp-vpsa{margin:13px 0 5px;padding:14px 15px;border-radius:17px;border:1.5px solid #ffd0d0;background:linear-gradient(150deg,#fff2f2,#fff8f5);box-shadow:0 6px 16px rgba(180,40,40,.08)}',
      '.cp-vpsa-live{border-color:#ffbcbc;background:linear-gradient(150deg,#ffecec,#fff4f0)}',
      '.cp-vpsa-t{font-size:13px;font-weight:1000;color:#a3261d;letter-spacing:-.2px}',
      '.cp-vpsa p{margin:6px 0 0;color:#6b6553;font-size:11px;line-height:1.45;font-weight:650}',
      '.cp-vpsa-previa{margin-top:10px}',
      '.cp-vpsa-play{width:100%;min-height:40px;border:0;border-radius:12px;background:linear-gradient(135deg,#e14b3a,#c2372a);color:#fff;font:inherit;font-size:12px;font-weight:1000;cursor:pointer;box-shadow:0 3px 0 #9c2b20}',
      '.cp-vpsa-play:active{transform:translateY(2px);box-shadow:0 1px 0 #9c2b20}',
      '.cp-vivo-frame{position:relative;width:100%;padding-top:56.25%;border-radius:14px;overflow:hidden;background:#000;margin-top:6px}',
      '.cp-vivo-frame iframe{position:absolute;top:0;left:0;width:100%;height:100%;border:0}',
      '.cp-vpsa-btns{display:flex;gap:8px;margin-top:11px;flex-wrap:wrap}',
      '.cp-vpsa-go{flex:1;min-width:120px;min-height:40px;display:grid;place-items:center;padding:0 12px;border-radius:12px;background:linear-gradient(135deg,#5b8def,#3ad0a4);color:#062033;font-size:12px;font-weight:1000;text-decoration:none;box-shadow:0 3px 0 #2f8f7a}',
      '.dark .cp-vpsa{background:linear-gradient(150deg,#3a2626,#2a2326);border-color:#8a4a44}.dark .cp-vpsa p{color:#d8c4c2}.dark .cp-vpsa-t{color:#ffb0a8}',
      '.cp-overlay{position:fixed;z-index:46000;inset:0;display:none;place-items:center;padding:18px;background:rgba(3,25,45,.63);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}.cp-overlay.open{display:grid}.cp-modal{width:min(100%,440px);max-height:calc(100vh - 36px);overflow:auto;border-radius:29px;background:#fff;box-shadow:0 30px 85px rgba(0,0,0,.38);animation:cpPop .4s cubic-bezier(.2,1.28,.3,1)}@keyframes cpPop{from{opacity:0;transform:translateY(22px) scale(.88)}to{opacity:1;transform:none}}',
      '.cp-celebrate{position:relative;overflow:hidden;padding:31px 25px 27px;background:linear-gradient(150deg,#083c5e,#0c7e89 54%,#2ac5bf);color:#fff;text-align:center}.cp-celebrate:after{content:"";position:absolute;left:-8%;right:-8%;bottom:-43px;height:100px;opacity:.26;background:radial-gradient(ellipse at 20% 0,transparent 49%,#d6ffff 50% 63%,transparent 64%),radial-gradient(ellipse at 77% 8%,transparent 49%,#d6ffff 50% 63%,transparent 64%)}.cp-trophy{position:relative;z-index:1;width:84px;height:84px;display:grid;place-items:center;margin:0 auto 14px;border-radius:29px;background:linear-gradient(145deg,#d7fff8,#7ae4ca);color:#0a5c69;font-size:41px;box-shadow:0 12px 0 rgba(0,0,0,.1),inset 0 2px 3px rgba(255,255,255,.85);transform:rotate(-7deg)}.cp-celebrate h2{position:relative;z-index:1;margin:0;font-size:26px;letter-spacing:-1px}.cp-celebrate p{position:relative;z-index:1;max-width:320px;margin:9px auto 0;color:#dcffff;font-size:13px;line-height:1.43}.cp-reward{position:relative;z-index:1;display:inline-flex;margin-top:15px;padding:8px 13px;border:1px solid rgba(255,255,255,.26);border-radius:999px;background:rgba(0,37,55,.24);font-size:11px;font-weight:950}',
      '.cp-modal-foot{padding:18px 22px 21px}.cp-hint{margin:0 0 14px;color:#708099;text-align:center;font-size:11px;line-height:1.4;font-weight:700}.cp-primary,.cp-secondary{width:100%;min-height:48px;border:0;border-radius:15px;font:inherit;font-size:13px;font-weight:950;cursor:pointer}.cp-primary{background:linear-gradient(135deg,#7566dc,#8d7bed);color:#fff;box-shadow:0 6px 0 #5547b7}.cp-primary:active{transform:translateY(3px);box-shadow:0 3px 0 #5547b7}.cp-secondary{margin-top:11px;background:#eef5f7;color:#58708a}',
      '.cp-quiz-top{display:flex;align-items:center;gap:10px;padding:17px 19px 12px}.cp-back{width:30px;height:30px;border:0;border-radius:10px;background:#edf4f6;color:#506780;font-size:18px;cursor:pointer}.cp-q-progress{height:10px;flex:1;border-radius:999px;background:#e2eef0;overflow:hidden}.cp-q-progress i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#2ac9b7,#79dfa7);transition:width .3s}.cp-q-count{color:#73829b;font-size:10px;font-weight:950;white-space:nowrap}.cp-quiz-body{padding:9px 23px 23px}.cp-question-label{color:#218e81;font-size:9px;font-weight:1000;letter-spacing:.75px;text-transform:uppercase}.cp-question-topic{display:block;margin-top:3px;color:#8291a6;font-size:10px;font-weight:750}.cp-question{margin:8px 0 17px;color:#223950;font-size:20px;line-height:1.19;letter-spacing:-.55px}.cp-options{display:grid;gap:9px}.cp-option{border:2px solid #dfe9ed;border-bottom-width:5px;border-radius:15px;padding:12px;text-align:left;background:#fff;color:#30465f;font:inherit;font-size:11.5px;line-height:1.33;font-weight:800;cursor:pointer}.cp-option:hover{background:#f6fffd;border-color:#a4d9d5}.cp-option:disabled{cursor:default}.cp-option.correct{border-color:#35bc91;background:#edfff6;color:#117356}.cp-option.wrong{border-color:#ffaaa4;background:#fff4f3;color:#af5653}.cp-feedback{display:none;margin-top:14px;padding:11px 12px;border-radius:13px;background:#ecfff6;color:#17745b;font-size:11px;line-height:1.4;font-weight:700}.cp-feedback.show{display:block}.cp-feedback b{display:block;margin-bottom:3px;font-size:12px}.cp-next{display:none;margin-top:13px}.cp-next.show{display:block}',
      '.cp-unlock{text-align:center;padding:32px 25px 5px}.cp-unlock-icon{width:88px;height:88px;display:grid;place-items:center;margin:auto;border-radius:30px;background:linear-gradient(135deg,#ffe48b,#f4b94f);font-size:42px;box-shadow:0 12px 0 #e59b2f,0 21px 31px rgba(242,183,77,.27);transform:rotate(5deg)}.cp-unlock h2{margin:22px 0 8px;color:#233950;font-size:26px;line-height:1.05;letter-spacing:-1px}.cp-unlock p{margin:0;color:#728199;font-size:12.5px;line-height:1.45}.cp-unlock-big{margin:14px 0;color:#167b69;font-size:22px;font-weight:1000;letter-spacing:-.8px}.cp-extra-list{margin:16px 22px 0;padding:11px 12px;border:1px solid #cdeee4;border-radius:14px;background:#f1fcf8;color:#48716c;text-align:left;font-size:10.5px;line-height:1.55}.cp-extra-list b{color:#147b68}',
      '.cp-class-chips{display:flex;flex-wrap:wrap;gap:6px;margin:2px 0 12px}.cp-chip{padding:4px 9px;border-radius:999px;background:#eef4f7;color:#5b7186;font-size:9.5px;font-weight:900}.cp-chip.ok{background:#e6fbf2;color:#12855f}',
      '.cp-repro{position:relative;margin:4px 0 12px;border-radius:16px;overflow:hidden;background:#0b1620;box-shadow:0 8px 20px rgba(9,25,40,.22)}',
      '.cp-repro video,.cp-repro audio{display:block;width:100%;background:#0b1620}.cp-repro video{aspect-ratio:16/9;object-fit:contain}.cp-repro audio{height:44px}',
      '.cp-repro-note{padding:9px 12px;color:#7e8fa3;font-size:10px;line-height:1.4;font-weight:700;text-align:center}',
      'a.cp-secondary{display:block;box-sizing:border-box;text-decoration:none;text-align:center;line-height:46px;padding:0}',
      '.cp-lista,.cp-audios{margin:-4px 0 14px;display:flex;flex-direction:column;gap:8px}',
      '.cp-vivo-row{display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid #d7e3ec;border-radius:14px;background:#fff}',
      '.cp-vivo-txt{flex:1;min-width:0}.cp-vivo-txt b{display:block;font-size:12px;color:#233950}.cp-vivo-txt small{display:block;margin-top:2px;font-size:9.5px;color:#728199;font-weight:800}',
      '.cp-vivo-go{flex:none;padding:8px 12px;border-radius:999px;background:linear-gradient(135deg,#5b8def,#3ad0a4);color:#062033;font-size:10.5px;font-weight:1000;text-decoration:none;white-space:nowrap}',
      '.cp-audio-chips{display:flex;flex-wrap:wrap;gap:6px}.cp-audio-chip{border:0;cursor:pointer;font:inherit}.cp-audio-chip.on{background:#0e2a3d;color:#8fd6ff}',
      '.cp-audio-list{display:flex;flex-direction:column;gap:6px}',
      '.cp-audio-row{display:flex;align-items:center;gap:9px;width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #d7e3ec;border-radius:13px;background:#fff;font:inherit;font-size:11.5px;font-weight:800;color:#2e3a4a;text-align:left;cursor:pointer}',
      '.cp-audio-row i{flex:none;width:22px;height:22px;display:grid;place-items:center;border-radius:50%;background:#eef4f7;color:#3d63c9;font-style:normal;font-size:10px}',
      'body.dark #view-campus{background:radial-gradient(circle at 4% 0,rgba(64,208,201,.12),transparent 28%),#191d2b}.dark .cp-hero h2,.dark .cp-section-head h3{color:#edf5f6}.dark .cp-hero p,.dark .cp-section-head span,.dark .cp-note{color:#aab9ca}.dark .cp-card{background:#252b3a;border-color:rgba(255,255,255,.1)}.dark .cp-card.featured{background:linear-gradient(135deg,#302957,#252b3a)}.dark .cp-card h4{color:#eef5f6}.dark .cp-card p{color:#afbed0}.dark .cp-step b{color:#d8e6ed}.dark .cp-step i{border-color:#1b202d;background:#34404b}.dark .cp-path:before{background:#34454d}',
      '@media(max-width:520px){.cp-hero h2{font-size:25px}.cp-category{max-width:120px}.cp-grid{grid-template-columns:1fr}.cp-step i{width:51px;height:51px;border-radius:18px;font-size:20px}.cp-path:before{top:32px}.cp-step b{font-size:8px}.cp-step small{font-size:7px}.cp-question{font-size:18px}.cp-quiz-body{padding:8px 18px 21px}}'
    ].join('');
    document.head.appendChild(st);
  }

  function overlay(){
    var ov = document.getElementById('campusPsaOverlay');
    if (ov) return ov;
    css();
    ov = document.createElement('div');
    ov.id = 'campusPsaOverlay';
    ov.className = 'cp-overlay';
    ov.innerHTML = '<div class="cp-modal" id="campusPsaModal" role="dialog" aria-modal="true"></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function(e){ if (e.target === ov) cerrarModal(); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && ov.classList.contains('open')) cerrarModal(); });
    return ov;
  }
  function abrirModal(html){
    var ov = overlay();
    var box = document.getElementById('campusPsaModal');
    box.innerHTML = html;
    ov.classList.add('open');
  }
  function cerrarModal(){
    var ov = document.getElementById('campusPsaOverlay');
    if (ov) ov.classList.remove('open');
    pvSession = null;
    soltarReproductor();
    render();
  }

  function mostrarCelebracion(){
    var e = estadoHoy();
    e.day.vioCelebracion = true;
    guardar(e.data);
    abrirModal(
      '<section class="cp-celebrate"><div class="cp-trophy">🏆</div><h2>¡Día cumplido!</h2><p>Hiciste las 10 acciones que movían tu negocio hoy. Eso merece celebrarse.</p><div class="cp-reward">⚡ Podés ganar 3 oportunidades más</div></section>' +
      '<div class="cp-modal-foot"><p class="cp-hint">Respondé 5 preguntas de tu nivel, basadas en los temas de Campus Appi, y activá tu Impulso del día.</p><button type="button" class="cp-primary" id="cpStartQuiz">🎓 Ganar 3 más</button><button type="button" class="cp-secondary" id="cpCloseCelebrate">Terminé por hoy</button></div>'
    );
    document.getElementById('cpStartQuiz').onclick = iniciarDesafio;
    document.getElementById('cpCloseCelebrate').onclick = cerrarModal;
  }

  function iniciarDesafio(){
    session = { index:0, correctas:0, esperandoReintento:false, preguntas:preguntasParaCategoria() };
    pintarPregunta();
  }
  function pintarPregunta(){
    var p = session.preguntas[session.index];
    if (!p) { desbloquear(); return; }
    var opciones = p.opciones.map(function(txt, i){
      return '<button type="button" class="cp-option" data-cp-answer="' + i + '"><b>' + String.fromCharCode(65+i) + '.</b>&nbsp; ' + esc(txt) + '</button>';
    }).join('');
    abrirModal(
      '<div class="cp-quiz-top"><button type="button" class="cp-back" id="cpQuitQuiz" aria-label="Volver">‹</button><div class="cp-q-progress"><i style="width:' + ((session.correctas / 5) * 100) + '%"></i></div><span class="cp-q-count">' + session.correctas + ' / 5</span></div>' +
      '<div class="cp-quiz-body"><span class="cp-question-label">' + esc(p.area) + '</span><span class="cp-question-topic">' + esc(p.tema) + '</span><h2 class="cp-question">' + esc(p.pregunta) + '</h2><div class="cp-options">' + opciones + '</div><div class="cp-feedback" id="cpFeedback"></div><button type="button" class="cp-primary cp-next" id="cpNext"></button></div>'
    );
    document.querySelectorAll('[data-cp-answer]').forEach(function(btn){
      btn.onclick = function(){ responder(Number(btn.getAttribute('data-cp-answer'))); };
    });
    document.getElementById('cpQuitQuiz').onclick = mostrarCelebracion;
  }
  function responder(indice){
    if (session.esperandoReintento) return;
    var p = session.preguntas[session.index];
    var ok = indice === p.correcta;
    var all = Array.prototype.slice.call(document.querySelectorAll('[data-cp-answer]'));
    all.forEach(function(btn, i){
      btn.disabled = true;
      if (i === p.correcta) btn.classList.add('correct');
      if (!ok && i === indice) btn.classList.add('wrong');
    });
    var feed = document.getElementById('cpFeedback');
    var next = document.getElementById('cpNext');
    feed.innerHTML = '<b>' + (ok ? '¡Muy bien!' : 'Casi, mirá esto:') + '</b>' + esc(p.explicacion);
    feed.classList.add('show');
    if (ok){
      session.correctas++;
      next.textContent = session.correctas === 5 ? 'Activar mi Impulso' : 'Continuar';
      next.onclick = function(){ session.index++; pintarPregunta(); };
    } else {
      next.textContent = 'Reintentar esta pregunta';
      next.onclick = function(){ pintarPregunta(); };
    }
    next.classList.add('show');
  }
  function desbloquear(){
    var e = estadoHoy();
    e.day.desbloqueado = true;
    e.day.desbloqueadoEn = new Date().toISOString();
    e.day.categoria = String(perfilPSA().categoria || '');
    guardar(e.data);
    try{
      if (window.APPIMensajes && window.APPIMensajes.invalidarJornada) window.APPIMensajes.invalidarJornada();
      if (window.APPIMensajes && window.APPIMensajes.registrarPartido) window.APPIMensajes.registrarPartido();
      if (window.APPIMensajes && window.APPIMensajes.pintarHoy) window.APPIMensajes.pintarHoy();
    }catch(err){}
    try{ window.dispatchEvent(new Event('appi-campus-unlocked')); }catch(err){}
    var resumen = resumenJornada();
    var nuevas = Math.max(0, Number(resumen.total || 0) - BASE_ACCIONES);
    var detalle = nuevas
      ? '<b>' + nuevas + ' oportunidad' + (nuevas === 1 ? '' : 'es') + ' extra para hoy</b><br>APPI sumó las próximas prioridades reales de tu jornada.'
      : '<b>Tu Impulso quedó activado</b><br>Cuando haya nuevas prioridades reales, APPI las sumará hasta el máximo de 3.';
    abrirModal(
      '<section class="cp-unlock"><div class="cp-unlock-icon">⚡</div><h2>¡Impulso<br>desbloqueado!</h2><p>Convertiste aprendizaje en acción. Tus próximas prioridades reales ya están listas.</p><div class="cp-unlock-big">10 → hasta 13 acciones</div></section>' +
      '<div class="cp-extra-list">' + detalle + '</div><div class="cp-modal-foot"><button type="button" class="cp-primary" id="cpSeeActions">Ver mis acciones extra</button><button type="button" class="cp-secondary" id="cpLater">Las veo después</button></div>'
    );
    document.getElementById('cpSeeActions').onclick = function(){
      cerrarModal();
      if (typeof window.showView === 'function') window.showView('view-usuarios');
      setTimeout(function(){ try{ if (window.APPIMensajes && window.APPIMensajes.pintarHoy) window.APPIMensajes.pintarHoy(); }catch(e){} }, 80);
    };
    document.getElementById('cpLater').onclick = cerrarModal;
  }

  function revisarJornada(){
    setTimeout(function(){
      try{
        if (!desafioDisponible() || retoDesbloqueado()) return;
        var e = estadoHoy();
        if (e.day.vioCelebracion) return;
        if (document.getElementById('campusPsaOverlay') && document.getElementById('campusPsaOverlay').classList.contains('open')) return;
        mostrarCelebracion();
      }catch(err){}
    }, 40);
  }

  /* ---------- Agenda de vivo (v643) ----------
     v652: la agenda rastreada (/proximas-clases-en-vivo) traía SÓLO las
     reuniones internas de los equipos del Campus — datos de otros equipos que
     no corresponden publicar en APPI—, nunca el vivo general. Se dejó de
     mostrar y de rastrear; el Vivo PSA se ubica por fecha (v645). */
  /* ---------- Vivo PSA semanal (v645) ----------
     El Vivo PSA se transmite los miércoles a las 15:00 (ART), con una
     excepción: el 28/10/2026 empieza a las 13:00. La agenda de reuniones
     trae las de equipo, no el vivo general, así que APPI lo ubica por fecha.
     La previa se publica como audio con la fecha del vivo. v655: la tarjeta
     sólo existe el miércoles y desaparece cuando termina el directo. */
  function horaVivoPsa(fecha){
    var h = String(fecha.getHours());
    var m = String(fecha.getMinutes());
    return (h.length < 2 ? '0' : '') + h + ':' + (m.length < 2 ? '0' : '') + m;
  }
  function proximoVivoPsaRef(now){
    now = now || new Date();
    var diasHasta = (3 - now.getDay() + 7) % 7; // 3 = miércoles
    var fecha = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diasHasta);
    var hora = fechaClaveVivo(fecha) === '2026-10-28' ? 13 : 15;
    var ini = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), hora, 0, 0, 0);
    var fin = new Date(ini.getTime() + 95 * 60000);
    var estado = diasHasta > 0 ? 'proximo' : (now < ini ? 'hoy' : (now <= fin ? 'vivo' : 'pasado'));
    return { ini: ini, fin: fin, estado: estado, hora: horaVivoPsa(ini) };
  }
  function fechaClaveVivo(d){
    function p(n){ return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }
  function audioPreviaVivo(fecha){
    try {
      var listas = (contenidoMem && contenidoMem.playlists) || [];
      var mejor = null, maxId = -1;
      for (var i = 0; i < listas.length; i++){
        var audios = listas[i].audios || [];
        for (var j = 0; j < audios.length; j++){
          var a = audios[j];
          if (!a || !a.stream) continue;
          var m = /LA PREVIA DEL VIVO\s*(\d{1,2})\/(\d{1,2})/i.exec(a.titulo || '');
          if (!m) continue;
          var id = Number(a.audioId || 0);
          if (id > maxId){ maxId = id; mejor = a; }
          if (+m[1] === fecha.getDate() && +m[2] === fecha.getMonth() + 1) return a;
        }
      }
      return mejor;
    } catch(e){ return null; }
  }
  /* ---------- Vivo dentro de APPI (v654) ----------
     El contenido del Campus trae el player de la transmisión (embed de la
     plataforma o stream HLS del propio Campus). APPI lo reproduce acá mismo
     el miércoles, mientras dura el directo (v655: fuera del miércoles el
     Vivo PSA no existe). Nunca link al sitio del Campus: si no hay player,
     sólo queda el texto. */
  function vivoPlayerDe(){
    try {
      var vp = contenidoMem && contenidoMem.vivoPlayer;
      if (!vp || typeof vp !== 'object') return null;
      var embed = vp.embed ? String(vp.embed) : '';
      var hls = vp.hls ? String(vp.hls) : '';
      if (embed){
        if (embed.indexOf('//') === 0) embed = 'https:' + embed;
        return { url: embed, tipo: 'embed' };
      }
      if (hls){
        if (hls.indexOf('//') === 0) hls = 'https:' + hls;
        return { url: hls, tipo: 'hls' };
      }
      return null;
    } catch(e){ return null; }
  }
  function abrirVivo(url, tipo){
    if (!url) return;
    if (tipo === 'hls'){
      abrirModal(
        '<div class="cp-quiz-top"><button type="button" class="cp-back" id="cpVivoBack" aria-label="Volver">‹</button><span class="cp-question-label" style="flex:1">🔴 Vivo PSA</span></div>' +
        '<div class="cp-quiz-body"><h2 class="cp-question">Vivo PSA</h2>' +
        '<div class="cp-repro" id="cpClassMedia"><video controls playsinline preload="metadata" id="cpClassVideo"></video></div>' +
        '<div class="cp-repro-note">Se reproduce acá mismo, sin registrar avance: miralo cuando quieras.</div></div>' +
        '<div class="cp-modal-foot"><button type="button" class="cp-secondary" id="cpVivoClose">Cerrar</button></div>'
      );
      document.getElementById('cpVivoBack').onclick = cerrarModal;
      document.getElementById('cpVivoClose').onclick = cerrarModal;
      var media = document.getElementById('cpClassVideo');
      if (media) cablearReproductor(media, url, 'vivo:' + (fechaClaveVivo(new Date()) || 'libre'), 'video', true);
      return;
    }
    abrirModal(
      '<div class="cp-quiz-top"><button type="button" class="cp-back" id="cpVivoBack" aria-label="Volver">‹</button><span class="cp-question-label" style="flex:1">🔴 Vivo PSA</span></div>' +
      '<div class="cp-quiz-body"><h2 class="cp-question">Vivo PSA</h2>' +
      '<div class="cp-vivo-frame"><iframe src="' + esc(url) + '" title="Vivo PSA" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>' +
      '<div class="cp-repro-note">Se reproduce acá mismo: miralo cuando quieras.</div></div>' +
      '<div class="cp-modal-foot"><button type="button" class="cp-secondary" id="cpVivoClose">Cerrar</button></div>'
    );
    document.getElementById('cpVivoBack').onclick = cerrarModal;
    document.getElementById('cpVivoClose').onclick = cerrarModal;
  }
  /* v655: el Vivo PSA existe sólo el miércoles — el aviso con su previa
     antes del inicio programado y, mientras dura el directo, el ▶ para verlo
     acá mismo. En cuanto termina desaparece hasta el próximo miércoles. */
  function seccionVivoPsa(){
    try {
      if (!contenidoMem) return '';
      var ref = proximoVivoPsaRef();
      var hora = ref.hora || horaVivoPsa(ref.ini);
      if (ref.estado === 'vivo'){
        var vpHoy = vivoPlayerDe();
        return '<div class="cp-vpsa cp-vpsa-live" data-cp-vpsa="vivo">' +
          '<div class="cp-vpsa-t">🔴 En vivo ahora · Vivo PSA</div>' +
          '<p>' + (vpHoy ? 'La transmisión está en curso: reproducila acá mismo, sin salir de APPI.' : 'El vivo está en curso y el video todavía no está disponible acá.') + '</p>' +
          (vpHoy ? '<div class="cp-vpsa-btns"><button type="button" class="cp-vpsa-play" data-cp-vivo="' + esc(vpHoy.url) + '" data-cp-vivo-tipo="' + vpHoy.tipo + '">▶ Ver el vivo ahora</button></div>' : '') +
        '</div>';
      }
      if (ref.estado !== 'hoy') return '';
      var previa = audioPreviaVivo(ref.ini);
      return '<div class="cp-vpsa" data-cp-vpsa="hoy">' +
        '<div class="cp-vpsa-t">Hoy ' + hora + ' · Vivo PSA</div>' +
        '<p>El vivo arranca a las ' + hora + '. Escuchá la previa mientras tanto.</p>' +
        (previa ? '<div class="cp-vpsa-previa"><button type="button" class="cp-vpsa-play" data-cp-vpsa-play="previa" data-cp-previa-id="audio:' + previa.audioId + '">▶ ' + esc(previa.titulo) + '</button></div>' : '') +
      '</div>';
    } catch(e){ return ''; }
  }
  /* Cablea los ▶ de la tarjeta del vivo: la previa (audio del contenido) y
     el ▶ del directo, que reproduce el player acá mismo (v655). */
  function cablearVivoPsa(host){
    if (!host) return;
    var plays = host.querySelectorAll('[data-cp-vpsa-play]');
    for (var b = 0; b < plays.length; b++) cablearPlayVivo(plays[b]);
    // v654: los▶ del Vivo reproducen acá mismo (embed o HLS), sin salir.
    var vivos = host.querySelectorAll('[data-cp-vivo]');
    for (var v = 0; v < vivos.length; v++) (function(btn){
      btn.onclick = function(){
        try { abrirVivo(btn.getAttribute('data-cp-vivo'), btn.getAttribute('data-cp-vivo-tipo')); } catch(e){}
      };
    })(vivos[v]);
  }
  function cablearPlayVivo(play){
    play.onclick = function(){
      try {
        var pid = play.getAttribute('data-cp-previa-id') || '';
        var aid = Number(String(pid).replace(/^audio:/, ''));
        var listas = (contenidoMem && contenidoMem.playlists) || [];
        var audio = null;
        for (var i = 0; i < listas.length && !audio; i++){
          var l = listas[i];
          for (var j = 0; j < (l.audios || []).length; j++){
            if (Number(l.audios[j].audioId) === aid){ audio = l.audios[j]; break; }
          }
        }
        if (audio && audio.stream) abrirAudio(audio, 'La Previa del Vivo');
      } catch(e){}
    };
  }

  /* ---------- Audios del Campus (v643) ---------- */
  function seccionAudios(){
    var listas = (contenidoMem && contenidoMem.playlists) || [];
    if (!listas.length) return '';
    var chips = listas.map(function(l, i){
      return '<button type="button" class="cp-chip cp-audio-chip' + (i === 0 ? ' on' : '') + '" data-cp-lista="' + i + '">' + esc(l.titulo) + '</button>';
    }).join('');
    var totalAudios = (contenidoMem.stats && contenidoMem.stats.audios) || '';
    return '<div class="cp-section-head"><h3>🎧 Audios del Campus</h3><span>' + (totalAudios ? totalAudios + ' audios' : listas.length + ' listas') + '</span></div>' +
      '<section class="cp-audios"><div class="cp-audio-chips" id="cpAudioChips">' + chips + '</div><div class="cp-audio-list" id="cpAudioLista" data-i="0"></div></section>';
  }
  function pintarAudios(i){
    var host = document.getElementById('cpAudioLista');
    if (!host || !contenidoMem) return;
    var listas = contenidoMem.playlists || [];
    var l = listas[i] || listas[0];
    if (!l){ host.innerHTML = ''; return; }
    var audios = (l.audios || []).slice(0, 8);
    host.innerHTML = audios.map(function(a, k){
      var visto = esVisto('audio:' + a.audioId);
      return '<button type="button" class="cp-audio-row" data-cp-audio="' + k + '">' +
        '<i>' + (visto ? '✓' : '▶') + '</i><span>' + esc(a.titulo) + '</span></button>';
    }).join('');
    host.setAttribute('data-i', String(i));
    host.querySelectorAll('[data-cp-audio]').forEach(function(btn){
      btn.onclick = function(){
        var a = audios[+btn.getAttribute('data-cp-audio')];
        if (a) abrirAudio(a, l.titulo);
      };
    });
  }
  function cablearAudios(){
    var chips = document.querySelectorAll('#cpAudioChips [data-cp-lista]');
    chips.forEach(function(ch){
      ch.onclick = function(){
        chips.forEach(function(x){ x.classList.remove('on'); });
        ch.classList.add('on');
        pintarAudios(+ch.getAttribute('data-cp-lista'));
      };
    });
    if (chips.length) pintarAudios(0);
  }

  /* ---------- Aviso de cuenta MI PSA (v644) ----------
     Sin credenciales de MI PSA no hay rastreo propio del Campus: el aviso
     invita a cargarla (una sola vez, en el dispositivo) y deja ver la
     última copia mientras tanto. Si la nube falló con cuenta cargada,
     muestra el error con reintento. */
  function avisoCuentaHTML(){
    if (contenidoEstado === 'sinCuenta'){
      return '<div class="cp-aviso" data-cp-aviso="cuenta">' +
        '<div class="cp-aviso-t">🔑 Cargá tu cuenta MI PSA</div>' +
        '<p>Tu Campus en APPI se arma con tus propios datos de distribuidor: clases, audios y vivos siempre al día. Se guarda una sola vez y sólo en este dispositivo.</p>' +
        '<button type="button" data-cp-cuenta>Cargar mi cuenta MI PSA</button>' +
        (contenidoMem ? '' : '<small>Con tu cuenta cargada vas a tener todo el Campus acá mismo.</small>') +
      '</div>';
    }
    if (contenidoEstado === 'error'){
      // v651: si hay una copia guardada, la nube caída se banca en silencio —
      // el recuadro de error sólo aparece cuando no hay NADA que mostrar.
      if (contenidoMem) return '';
      return '<div class="cp-aviso err mini" data-cp-aviso="error">' +
        '<div><div class="cp-aviso-t">📡 Sin copia del Campus todavía</div>' +
        '<p>La nube no respondió y en este dispositivo todavía no hay una copia guardada.</p></div>' +
        '<button type="button" data-cp-reintentar>Reintentar</button>' +
      '</div>';
    }
    return '';
  }
  function pintarAvisos(host){
    if (!host) return;
    var c = host.querySelector('[data-cp-cuenta]');
    if (c) c.onclick = abrirCuentaPSA;
    var r = host.querySelector('[data-cp-reintentar]');
    if (r) r.onclick = function(){
      r.disabled = true;
      reintentarContenido().then(function(){ render(); }, function(){ render(); });
    };
  }
  function abrirCuentaPSA(){
    try {
      if (typeof window.mostrarPopupPSA === 'function') window.mostrarPopupPSA();
      else if (typeof window.psaAbrirPopup === 'function') window.psaAbrirPopup();
      else if (typeof window.psaProbar === 'function') window.psaProbar();
    } catch(e){}
  }

  /* v649: firma del último HTML pintado. El Campus escucha eventos de sync,
     de persona y del contenido que en una cuenta real pueden llegar seguido;
     repintar el innerHTML entero ante cada uno —aunque no haya cambiado
     nada— se ve como un parpadeo constante de toda la pantalla. Si la firma
     coincide, el DOM (y el scroll, y la playlist elegida) quedan como están. */
  var ultimoHtmlCampus = '';
  function firmaRenderCampus(html){
    var firma = html;
    try { firma += '\n' + JSON.stringify(leer().avance || {}); } catch(e){}
    try { firma += '\n' + (contenidoMem ? String(contenidoMem.generado || '') : ''); } catch(e){}
    return firma;
  }
  function render(){
    css();
    var host = document.getElementById('campusCont');
    if (!host) return;
    var base = resumenBase();
    var jornada = resumenJornada();
    var unlocked = retoDesbloqueado();
    var disponibles = Math.max(0, Number(jornada.total || 0) - BASE_ACCIONES);
    var hechas = Math.max(0, Number(jornada.hechas || 0));
    var totalVista = Math.max(BASE_ACCIONES + (unlocked ? BONUS_ACCIONES : 0), Number(jornada.total || 0));
    var pct = Math.min(100, Math.round((hechas / Math.max(1,totalVista)) * 100));
    var ready = desafioDisponible() && !unlocked;
    var progressText = unlocked
      ? (hechas + ' hechas · ' + (jornada.pendientes || 0) + ' pendientes')
      : (Math.min(base.hechas || 0, BASE_ACCIONES) + ' de 10 acciones hechas');
    var actionLabel = unlocked ? '⚡ Ver mi Impulso activado' : ready ? '🎓 Ganar 3 acciones más' : 'Completá tus 10 acciones para activar el desafío';
    var htmlCampus =
      '<div class="cp-wrap"><section class="cp-hero"><div><span class="cp-kicker">✦ CAMPUS PSA × APPI</span><h2>Tu Campus,<br>en movimiento.</h2><p>Aprendé, aplicá y ganá oportunidades reales para hacer crecer tu negocio.</p></div><div class="cp-category">🎓 TU CATEGORÍA<span>' + esc(categoria()) + '</span></div></section>' + avisoCuentaHTML() +
      '<section class="cp-progress"><div class="cp-progress-row"><div><h3>' + (unlocked ? 'Impulso del día activado' : 'Impulso del día') + '</h3><p>' + (unlocked ? 'Tu aprendizaje abrió nuevas prioridades de la jornada.' : 'Terminá tus acciones y desbloqueá una nueva oportunidad.') + '</p></div><b class="cp-score">' + hechas + '/' + totalVista + '</b></div><div class="cp-meter"><i style="width:' + pct + '%"></i></div><small>' + esc(progressText) + (unlocked && disponibles ? ' · ' + disponibles + ' extra disponibles' : '') + '</small></section>' +
      '<div class="cp-section-head"><h3>Tu camino de hoy</h3><span>5 aciertos activan el impulso</span></div>' +
      '<section class="cp-path"><div class="cp-step done"><i>✓</i><b>Tu día</b><small>completo</small></div><div class="cp-step ' + (ready ? 'live' : '') + '"><i>✦</i><b>Desafío</b><small>5 aciertos</small></div><div class="cp-step ' + (unlocked ? 'done' : '') + '"><i>⚡</i><b>+3 acciones</b><small>' + (unlocked ? 'activado' : 'por ganar') + '</small></div><div class="cp-step ' + (unlocked ? 'live' : '') + '"><i>↗</i><b>Aplicar</b><small>en tu negocio</small></div><div class="cp-step"><i>★</i><b>Tu logro</b><small>del día</small></div></section>' +
      '<section class="cp-grid"><article class="cp-card featured"><span class="cp-eyebrow">RECOMENDADO PARA TU CATEGORÍA</span><h4>' + (esLider() ? 'Construcción de equipos sólidos' : esJunior() ? 'Tus primeros pasos comerciales' : 'Acciones que hacen crecer tu negocio') + '</h4><p>' + (esLider() ? 'Practicá decisiones sobre acompañamiento, permanencia y crecimiento del equipo.' : 'Preguntas breves para llevar el aprendizaje del Campus a conversaciones reales.') + '</p><button type="button" id="cpTopicGo">Empezar desafío</button></article><article class="cp-card"><span class="cp-eyebrow">APLICACIÓN DE HOY</span><h4>Posventa que genera vínculo</h4><p>Canje, fidelización y oportunidades reales con tus usuarios.</p><button type="button" id="cpTopicInfo">Ver tema</button></article></section>' +
      seccionVivoPsa() + seccionAudios() +
      '<button type="button" class="cp-main-btn ' + (ready ? 'ready' : '') + '" id="cpMainAction" ' + (!ready && !unlocked ? 'disabled' : '') + '>' + esc(actionLabel) + '</button><p class="cp-note">Las preguntas son originales de APPI, organizadas por los temas de formación de Campus Appi. No reemplazan sus capacitaciones oficiales.</p></div>';
    // v649: mismo contenido = cero repintado (nada de parpadeo).
    var firmaCampus = firmaRenderCampus(htmlCampus);
    if (firmaCampus === ultimoHtmlCampus && host.firstChild) return;
    ultimoHtmlCampus = firmaCampus;
    host.innerHTML = htmlCampus;
    document.getElementById('cpTopicGo').onclick = function(){ if (ready) iniciarDesafio(); else if (unlocked) abrir(); else avisoFaltante(); };
    document.getElementById('cpTopicInfo').onclick = function(){
      if (window.APPIDialog && window.APPIDialog.alert) window.APPIDialog.alert('Posventa combina servicio y crecimiento: fidelización, vencimientos, mantenimiento y Plan Canje. Estos temas entrarán en tus próximos desafíos.', { title:'Posventa que genera vínculo', icon:'💧', okText:'Entendido' });
    };
    document.getElementById('cpMainAction').onclick = function(){ if (unlocked) abrir(); else if (ready) iniciarDesafio(); };
    cablearAudios();
    cablearVivoPsa(host);
    pintarAvisos(host);
  }
  function avisoFaltante(){
    if (window.APPIDialog && window.APPIDialog.alert) window.APPIDialog.alert('El desafío se activa cuando las 10 acciones base del día están hechas. No cuenta marcar una acción como no realizada: el Impulso celebra trabajo concreto.', { title:'Todavía falta un paso', icon:'🎯', okText:'Entendido' });
  }
  function abrir(){
    if (typeof window.showView === 'function') window.showView('view-campus');
    setTimeout(render, 0);
  }

  /** Sección "Mi capacitación" dentro de Mi negocio (v642):
      progreso real + la próxima clase con un toque para continuar. */
  function pintarNegocio(){
    var host = document.getElementById('negWrap');
    if (!host) return;
    if (!contenidoMem){
      cargarContenido().then(function(){ pintarNegocio(); })
        .catch(function(){ try{ host.innerHTML = avisoCuentaHTML(); pintarAvisos(host); }catch(e){} });
      return;
    }
    var res = avanceResumen();
    if (!res.total){ try{ host.innerHTML = avisoCuentaHTML(); pintarAvisos(host); }catch(e){} return; }
    var prox = proximaClase('');
    var st = document.getElementById('cpNegEstilos');
    if (!st){
      st = document.createElement('style');
      st.id = 'cpNegEstilos';
      st.textContent = [
        '.cp-neg{margin:4px 14px 18px;padding:14px;border-radius:18px;background:linear-gradient(160deg,#0e2a3d,#123b52);color:#e8f4fa;box-shadow:0 10px 24px rgba(9,25,40,.18)}',
        '.cp-neg-k{font-size:9.5px;font-weight:1000;letter-spacing:1.4px;text-transform:uppercase;color:#8fd6ff}',
        '.cp-neg-titlerow{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}',
        '.cp-racha{flex:none;padding:5px 9px;border-radius:999px;background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.18);color:#ffd9a0;font-size:10px;font-weight:1000;letter-spacing:.2px}',
        '.cp-racha.on{background:rgba(58,208,164,.22);border-color:rgba(58,208,164,.5);color:#a9ffe8}',
        '.cp-neg h3{margin:6px 0 2px;font-size:17px;letter-spacing:-.5px}',
        '.cp-neg-sub{font-size:10.5px;color:#a9c4d6;font-weight:700}',
        '.cp-neg-bar{height:9px;border-radius:99px;background:rgba(255,255,255,.14);margin:11px 0 5px;overflow:hidden}',
        '.cp-neg-bar i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#3ad0a4,#5b8def)}',
        '.cp-neg-prox{margin-top:11px;padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12)}',
        '.cp-neg-prox b{display:block;font-size:12.5px;line-height:1.3}',
        '.cp-neg-prox span{display:block;margin-top:3px;font-size:10px;color:#a9c4d6;font-weight:800}',
        '.cp-neg-btns{display:flex;gap:8px;margin-top:11px}',
        '.cp-neg-btn{flex:1;padding:11px 8px;border:0;border-radius:13px;font:inherit;font-size:11.5px;font-weight:1000;cursor:pointer}',
        '.cp-neg-go{background:linear-gradient(135deg,#3ad0a4,#5b8def);color:#062033}',
        '.cp-neg-ruta{background:rgba(255,255,255,.12);color:#e8f4fa}'
      ].join('');
      document.head.appendChild(st);
    }
    host.innerHTML =
      avisoCuentaHTML() +
      '<div class="cp-neg" id="cpNeg">' +
        '<span class="cp-neg-k">Campus PSA · tu capacitación</span>' +
        '<div class="cp-neg-titlerow"><h3>Mi capacitación</h3>' + chipRacha() + '</div>' +
        '<div class="cp-neg-sub" id="cpNegSub">' + res.vistas + ' de ' + res.total + ' clases vistas · ' + res.pct + '%</div>' +
        '<div class="cp-neg-bar"><i style="width:' + res.pct + '%"></i></div>' +
        (prox ?
          '<div class="cp-neg-prox"><b id="cpNegTit">' + esc(prox.titulo) + '</b><span id="cpNegMeta">' + esc(prox.area) + (prox.duracion ? ' · ⏱ ' + esc(prox.duracion) : '') + '</span></div>' +
          '<div class="cp-neg-btns"><button type="button" class="cp-neg-btn cp-neg-go" id="cpNegGo">Continuar clase ▶</button><button type="button" class="cp-neg-btn cp-neg-ruta" id="cpNegRuta">Ver ruta</button></div>'
          :
          '<div class="cp-neg-prox"><b>¡Ruta completa!</b><span>Ya viste todas las clases del Campus.</span></div>') +
      '</div>';
    if (prox){
      var go = document.getElementById('cpNegGo');
      if (go) go.onclick = function(){ abrirClase(prox); };
    }
    var ruta = document.getElementById('cpNegRuta');
    if (ruta) ruta.onclick = function(){ abrir(); };
    pintarAvisos(host);
  }

  window.openCampusPSA = abrir;
  window.APPICampusPSA = {
    abrir: abrir,
    render: render,
    revisarJornada: revisarJornada,
    iniciarDesafio: iniciarDesafio,
    bonusAccionesHoy: bonusAccionesHoy,
    retoDesbloqueado: retoDesbloqueado,
    desafioDisponible: desafioDisponible,
    categoria: categoria,
    preguntasParaCategoria: preguntasParaCategoria,
    // Contenido real y avance (v641)
    cargarContenido: cargarContenido,
    contenido: contenido,
    clases: aplanarClases,
    buscar: buscar,
    proximaClase: proximaClase,
    avanceDe: avanceDe,
    esVisto: esVisto,
    marcarVisto: marcarVisto,
    avanceResumen: avanceResumen,
    abrirClase: abrirClase,
    abrirAudio: abrirAudio,
    pintarNegocio: pintarNegocio,
    // Estado del contenido por cuenta (v644)
    estadoContenido: function(){ return contenidoEstado; },
    reintentarContenido: reintentarContenido,
    abrirCuentaPSA: abrirCuentaPSA,
    // Vivo PSA semanal (v645): v655 — sólo existe el miércoles
    proximoVivoPsa: proximoVivoPsaRef,
    horaVivoPsa: horaVivoPsa,
    audioPreviaVivo: audioPreviaVivo,
    // Preguntas post-video y racha (v646)
    bancoPreguntas: function(){ return (window.APPICampusPreguntas && window.APPICampusPreguntas.totalClases) || 0; },
    preguntasDeClase: bancoDe,
    quizPasado: quizPasado,
    rachaDeClases: rachaDeClases,
    registrarClaseCompleta: registrarClaseCompleta,
    chipRacha: chipRacha,
    ofrecerPostVideo: ofrecerPostVideo
  };

  window.addEventListener('appi-datasync-applied', function(){ try{ render(); revisarJornada(); }catch(e){} });
  window.addEventListener('appi-person-change', function(){ setTimeout(function(){ render(); revisarJornada(); }, 60); });
  window.addEventListener('appi-campus-avance', function(){
    try{
      render();
      var v = document.querySelector('.view.active');
      if (v && v.id === 'view-negocio') pintarNegocio();
    }catch(e){}
  });
  // v644: el estado del contenido (cuenta MI PSA / nube) repinta la vista y
  // Mi negocio, así el aviso aparece o desaparece sin recargar.
  function repintarEstadoCampus(){
    try{
      render();
      var v = document.querySelector('.view.active');
      if (v && v.id === 'view-negocio') pintarNegocio();
    }catch(e){}
  }
  window.addEventListener('appi-campus-estado', repintarEstadoCampus);
  window.addEventListener('appi-campus-contenido', repintarEstadoCampus);
  if (document.readyState === 'complete') setTimeout(revisarJornada, 800);
  else window.addEventListener('load', function(){ setTimeout(revisarJornada, 900); });
  // La primera comprobación de MI PSA la inicia home-tarjetas.js al armar las
  // tarjetas. No se hace otro chequeo autónomo al entrar a APPI: así un fallo
  // general de red nunca abre una ventana durante el arranque.
})();
