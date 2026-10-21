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

  /* ---------- Catálogo real del Campus (v640 · v644) ----------
     El catálogo sale de la edge campus-catalogo con las credenciales MI PSA
     de CADA usuario (caché compartida en la nube, refrescada por quien
     primero la pida). Sin cuenta MI PSA no hay rastreo propio: se usa la
     última copia (respaldo local) y aparece el aviso para cargarla. La
     clave del respaldo NO sincroniza: es artefacto de red, no dato. */
  var CATALOGO_LOCAL = 'appi_campus_catalogo_v1';
  var catalogoMem = null;
  var catalogoPidiendo = null;
  var catalogoEstado = null; // null | 'cargando' | 'ok' | 'sinCuenta' | 'error'

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
  function catalogoValido(cat){ return !!(cat && cat.kits && cat.kits.length); }
  function respaldoCatalogo(maxDias){
    try {
      var prev = JSON.parse(localStorage.getItem(CATALOGO_LOCAL) || 'null');
      if (!catalogoValido(prev)) return null;
      if (maxDias && prev.generado){
        var t = Date.parse(prev.generado);
        if (t && Date.now() - t > maxDias * 86400000) return null;
      }
      return prev;
    } catch(e){ return null; }
  }
  function guardarCatalogo(cat){
    catalogoMem = cat;
    try { localStorage.setItem(CATALOGO_LOCAL, JSON.stringify(cat)); } catch(e){}
  }
  function fijarEstado(estado){
    if (catalogoEstado === estado) return;
    catalogoEstado = estado;
    try {
      window.dispatchEvent(new CustomEvent('appi-campus-estado', { detail: { estado: estado } }));
    } catch(e){}
  }
  function pedirCatalogoNube(){
    var cfg = nubeCfg();
    var c = credsCampus();
    if (!cfg || !c) return Promise.reject(new Error('sin cuenta MI PSA'));
    return fetch(cfg.url + '/functions/v1/campus-catalogo', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'apikey': cfg.anonKey, 'Authorization': 'Bearer ' + (cfg.token || cfg.anonKey) },
      body: JSON.stringify({ center: c.center, number: c.number, password: c.password })
    }).then(function(r){ return r.json(); }).then(function(j){
      if (!j || j.error || !catalogoValido(j.cat)) throw new Error((j && j.error) || 'catálogo inválido');
      return j.cat;
    });
  }
  function pedirRepoJson(){
    return fetch('./campus-catalogo.json', { cache: 'no-store' })
      .then(function(r){ if (!r.ok) throw new Error('catálogo HTTP ' + r.status); return r.json(); })
      .then(function(cat){ if (!catalogoValido(cat)) throw new Error('catálogo vacío'); return cat; });
  }
  /** Refresco en segundo plano: la pantalla ya muestra la última copia. */
  function refrescarNube(){
    pedirCatalogoNube().then(function(cat){
      guardarCatalogo(cat);
      fijarEstado('ok');
      try { window.dispatchEvent(new Event('appi-campus-catalogo')); } catch(e){}
    }).catch(function(){
      fijarEstado('error');
    });
  }
  function cargarCatalogo(){
    if (catalogoMem) return Promise.resolve(catalogoMem);
    if (catalogoPidiendo) return catalogoPidiendo;
    // v644: este módulo se carga en el <head> y el script de credenciales
    // (psaGetCreds) es inline, más abajo en el body. Si se decide "sin cuenta"
    // antes de que exista, el estado queda mentido para toda la sesión:
    // se espera al load y recién ahí se pregunta por las credenciales.
    if (typeof window.psaGetCreds !== 'function' && document.readyState !== 'complete'){
      return new Promise(function(res, rej){
        window.addEventListener('load', function(){
          setTimeout(function(){ cargarCatalogo().then(res, rej); }, 0);
        });
      });
    }
    var conCuenta = tieneCuentaCampus();
    if (!conCuenta) fijarEstado('sinCuenta');
    else fijarEstado('cargando');
    var local = respaldoCatalogo(7);
    if (local){
      guardarCatalogo(local);
      if (conCuenta) refrescarNube();
      catalogoPidiendo = Promise.resolve(local);
      return catalogoPidiendo;
    }
    // Sin copia local: la nube (o el JSON del repo, mientras exista) es el único camino.
    catalogoPidiendo = (conCuenta ? pedirCatalogoNube() : Promise.reject(new Error('sin cuenta MI PSA')))
      .then(function(cat){
        guardarCatalogo(cat);
        fijarEstado('ok');
        return cat;
      })
      .catch(function(){
        return pedirRepoJson().then(function(cat){
          guardarCatalogo(cat);
          fijarEstado(conCuenta ? 'error' : 'sinCuenta');
          return cat;
        }).catch(function(){
          fijarEstado(conCuenta ? 'error' : 'sinCuenta');
          throw new Error('No hay catálogo del Campus disponible.');
        });
      })
      .then(function(cat){ catalogoPidiendo = null; return cat; },
            function(e){ catalogoPidiendo = null; throw e; });
    return catalogoPidiendo;
  }
  function reintentarCatalogo(){
    catalogoMem = null;
    catalogoPidiendo = null;
    catalogoEstado = null;
    return cargarCatalogo();
  }
  function catalogo(){ return catalogoMem; }
  function norm(s){
    return String(s == null ? '' : s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-AR');
  }
  function segs(d){
    var m = /(\d{1,2}):(\d{2})/.exec(String(d || ''));
    return m ? (+m[1]) * 60 + (+m[2]) : 9999;
  }

  /** Todas las clases del catálogo aplanadas, con su área y sección. */
  function aplanarClases(){
    var out = [];
    var cat = catalogoMem;
    if (!cat) return out;
    (cat.kits || []).forEach(function(kit){
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
  function cablearReproductor(mediaEl, url, id, tipo){
    soltarReproductor();
    reproductor.media = mediaEl;
    reproductor.id = id;
    try { mediaEl.setAttribute('data-stream', url); } catch(e){}
    var ultimoGuardado = 0;
    mediaEl.addEventListener('timeupdate', function(){
      try {
        if (!mediaEl.duration || !isFinite(mediaEl.duration)) return;
        var pct = (mediaEl.currentTime / mediaEl.duration) * 100;
        if (pct >= 90 && ultimoGuardado < 90){
          ultimoGuardado = 100;
          marcarVisto(id, 100, tipo);
          marcarHechoUI();
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
      try { marcarVisto(id, 100, tipo); } catch(e){}
      marcarHechoUI();
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
      marcarHechoUI();
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
      marcarHechoUI();
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

  /* ---------- Agenda de vivo (v643) ---------- */
  function fechaVivo(txt){
    var m = /^(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/.exec(String(txt || '').trim());
    if (!m) return null;
    var anio = new Date().getFullYear();
    var d = new Date(anio, +m[2] - 1, +m[1], +m[3], +m[4], 0, 0);
    if (isNaN(d.getTime())) return null;
    // Un vivo del año que ya pasó es del próximo ciclo.
    if (d.getTime() < Date.now() - 86400000) d = new Date(anio + 1, +m[2] - 1, +m[1], +m[3], +m[4], 0, 0);
    return d;
  }
  function listaVivo(){
    if (!catalogoMem || !catalogoMem.vivo) return [];
    return (catalogoMem.vivo || []).map(function(v){
      var ini = fechaVivo(v.inicio);
      var fin = fechaVivo(v.fin) || (ini ? new Date(ini.getTime() + 3600000) : null);
      return { equipo: v.equipo, titulo: v.titulo, ini: ini, fin: fin };
    }).filter(function(v){ return !!v.ini; })
      .sort(function(a, b){ return a.ini - b.ini; })
      .slice(0, 4);
  }
  function gcalLink(titulo, ini, fin, detalle){
    function f(d){ return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z'); }
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      '&text=' + encodeURIComponent(titulo) +
      '&dates=' + f(ini) + '/' + f(fin || new Date(ini.getTime() + 3600000)) +
      '&details=' + encodeURIComponent(detalle || '');
  }
  function fechaLindaVivo(d){
    try {
      return d.toLocaleDateString('es-AR', { weekday:'short', day:'2-digit', month:'short' }) +
        ' · ' + d.toLocaleTimeString('es-AR', { hour:'2-digit', minute:'2-digit' });
    } catch(e){ return ''; }
  }
  function seccionVivo(){
    var items = listaVivo();
    if (!items.length) return '';
    var filas = items.map(function(v, i){
      var desc = v.titulo + ' · ' + v.equipo + ' — transmisión en vivo de Campus PSA (vista desde APPI).';
      return '<div class="cp-vivo-row">' +
        '<div class="cp-vivo-txt"><b>' + esc(v.titulo) + '</b><small>' + esc(v.equipo) + ' · ' + esc(fechaLindaVivo(v.ini)) + '</small></div>' +
        '<a class="cp-vivo-go" data-cp-agendar="' + i + '" href="' + esc(gcalLink(v.titulo + ' · ' + v.equipo, v.ini, v.fin, desc)) + '" target="_blank" rel="noopener">Agendar</a>' +
      '</div>';
    }).join('');
    return '<div class="cp-section-head"><h3>📅 Próximos en vivo</h3><span>' + items.length + ' transmisiones</span></div>' +
      '<section class="cp-lista" id="cpVivo" data-cp-vivo="' + items.length + '">' + filas + '</section>';
  }

  /* ---------- Audios del Campus (v643) ---------- */
  function seccionAudios(){
    var listas = (catalogoMem && catalogoMem.playlists) || [];
    if (!listas.length) return '';
    var chips = listas.map(function(l, i){
      return '<button type="button" class="cp-chip cp-audio-chip' + (i === 0 ? ' on' : '') + '" data-cp-lista="' + i + '">' + esc(l.titulo) + '</button>';
    }).join('');
    var totalAudios = (catalogoMem.stats && catalogoMem.stats.audios) || '';
    return '<div class="cp-section-head"><h3>🎧 Audios del Campus</h3><span>' + (totalAudios ? totalAudios + ' audios' : listas.length + ' listas') + '</span></div>' +
      '<section class="cp-audios"><div class="cp-audio-chips" id="cpAudioChips">' + chips + '</div><div class="cp-audio-list" id="cpAudioLista" data-i="0"></div></section>';
  }
  function pintarAudios(i){
    var host = document.getElementById('cpAudioLista');
    if (!host || !catalogoMem) return;
    var listas = catalogoMem.playlists || [];
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
    if (catalogoEstado === 'sinCuenta'){
      return '<div class="cp-aviso" data-cp-aviso="cuenta">' +
        '<div class="cp-aviso-t">🔑 Cargá tu cuenta MI PSA</div>' +
        '<p>Tu Campus en APPI se arma con tus propios datos de distribuidor: clases, audios y vivos siempre al día. Se guarda una sola vez y sólo en este dispositivo.</p>' +
        '<button type="button" data-cp-cuenta>Cargar mi cuenta MI PSA</button>' +
        (catalogoMem ? '' : '<small>Con tu cuenta cargada vas a tener el catálogo completo acá mismo.</small>') +
      '</div>';
    }
    if (catalogoEstado === 'error'){
      return '<div class="cp-aviso err" data-cp-aviso="error">' +
        '<div class="cp-aviso-t">📡 No pudimos actualizar el catálogo</div>' +
        '<p>La nube de APPI no respondió ahora. Se muestra la última copia guardada.</p>' +
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
      reintentarCatalogo().then(function(){ render(); }, function(){ render(); });
    };
  }
  function abrirCuentaPSA(){
    try {
      if (typeof window.mostrarPopupPSA === 'function') window.mostrarPopupPSA();
      else if (typeof window.psaAbrirPopup === 'function') window.psaAbrirPopup();
      else if (typeof window.psaProbar === 'function') window.psaProbar();
    } catch(e){}
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
    host.innerHTML =
      '<div class="cp-wrap"><section class="cp-hero"><div><span class="cp-kicker">✦ CAMPUS PSA × APPI</span><h2>Tu Campus,<br>en movimiento.</h2><p>Aprendé, aplicá y ganá oportunidades reales para hacer crecer tu negocio.</p></div><div class="cp-category">🎓 TU CATEGORÍA<span>' + esc(categoria()) + '</span></div></section>' + avisoCuentaHTML() +
      '<section class="cp-progress"><div class="cp-progress-row"><div><h3>' + (unlocked ? 'Impulso del día activado' : 'Impulso del día') + '</h3><p>' + (unlocked ? 'Tu aprendizaje abrió nuevas prioridades de la jornada.' : 'Terminá tus acciones y desbloqueá una nueva oportunidad.') + '</p></div><b class="cp-score">' + hechas + '/' + totalVista + '</b></div><div class="cp-meter"><i style="width:' + pct + '%"></i></div><small>' + esc(progressText) + (unlocked && disponibles ? ' · ' + disponibles + ' extra disponibles' : '') + '</small></section>' +
      '<div class="cp-section-head"><h3>Tu camino de hoy</h3><span>5 aciertos activan el impulso</span></div>' +
      '<section class="cp-path"><div class="cp-step done"><i>✓</i><b>Tu día</b><small>completo</small></div><div class="cp-step ' + (ready ? 'live' : '') + '"><i>✦</i><b>Desafío</b><small>5 aciertos</small></div><div class="cp-step ' + (unlocked ? 'done' : '') + '"><i>⚡</i><b>+3 acciones</b><small>' + (unlocked ? 'activado' : 'por ganar') + '</small></div><div class="cp-step ' + (unlocked ? 'live' : '') + '"><i>↗</i><b>Aplicar</b><small>en tu negocio</small></div><div class="cp-step"><i>★</i><b>Tu logro</b><small>del día</small></div></section>' +
      '<section class="cp-grid"><article class="cp-card featured"><span class="cp-eyebrow">RECOMENDADO PARA TU CATEGORÍA</span><h4>' + (esLider() ? 'Construcción de equipos sólidos' : esJunior() ? 'Tus primeros pasos comerciales' : 'Acciones que hacen crecer tu negocio') + '</h4><p>' + (esLider() ? 'Practicá decisiones sobre acompañamiento, permanencia y crecimiento del equipo.' : 'Preguntas breves para llevar el aprendizaje del Campus a conversaciones reales.') + '</p><button type="button" id="cpTopicGo">Empezar desafío</button></article><article class="cp-card"><span class="cp-eyebrow">APLICACIÓN DE HOY</span><h4>Posventa que genera vínculo</h4><p>Canje, fidelización y oportunidades reales con tus usuarios.</p><button type="button" id="cpTopicInfo">Ver tema</button></article></section>' +
      seccionVivo() + seccionAudios() +
      '<button type="button" class="cp-main-btn ' + (ready ? 'ready' : '') + '" id="cpMainAction" ' + (!ready && !unlocked ? 'disabled' : '') + '>' + esc(actionLabel) + '</button><p class="cp-note">Las preguntas son originales de APPI, organizadas por los temas de formación de Campus Appi. No reemplazan sus capacitaciones oficiales.</p></div>';
    document.getElementById('cpTopicGo').onclick = function(){ if (ready) iniciarDesafio(); else if (unlocked) abrir(); else avisoFaltante(); };
    document.getElementById('cpTopicInfo').onclick = function(){
      if (window.APPIDialog && window.APPIDialog.alert) window.APPIDialog.alert('Posventa combina servicio y crecimiento: fidelización, vencimientos, mantenimiento y Plan Canje. Estos temas entrarán en tus próximos desafíos.', { title:'Posventa que genera vínculo', icon:'💧', okText:'Entendido' });
    };
    document.getElementById('cpMainAction').onclick = function(){ if (unlocked) abrir(); else if (ready) iniciarDesafio(); };
    cablearAudios();
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
    if (!catalogoMem){
      cargarCatalogo().then(function(){ pintarNegocio(); })
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
        '<h3>Mi capacitación</h3>' +
        '<div class="cp-neg-sub" id="cpNegSub">' + res.vistas + ' de ' + res.total + ' clases vistas · ' + res.pct + '%</div>' +
        '<div class="cp-neg-bar"><i style="width:' + res.pct + '%"></i></div>' +
        (prox ?
          '<div class="cp-neg-prox"><b id="cpNegTit">' + esc(prox.titulo) + '</b><span id="cpNegMeta">' + esc(prox.area) + (prox.duracion ? ' · ⏱ ' + esc(prox.duracion) : '') + '</span></div>' +
          '<div class="cp-neg-btns"><button type="button" class="cp-neg-btn cp-neg-go" id="cpNegGo">Continuar clase ▶</button><button type="button" class="cp-neg-btn cp-neg-ruta" id="cpNegRuta">Ver ruta</button></div>'
          :
          '<div class="cp-neg-prox"><b>¡Ruta completa!</b><span>Ya viste todas las clases del catálogo.</span></div>') +
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
    // Catálogo real y avance (v641)
    cargarCatalogo: cargarCatalogo,
    catalogo: catalogo,
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
    // Estado del catálogo por cuenta (v644)
    estadoCatalogo: function(){ return catalogoEstado; },
    reintentarCatalogo: reintentarCatalogo,
    abrirCuentaPSA: abrirCuentaPSA
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
  // v644: el estado del catálogo (cuenta MI PSA / nube) repinta la vista y
  // Mi negocio, así el aviso aparece o desaparece sin recargar.
  function repintarEstadoCampus(){
    try{
      render();
      var v = document.querySelector('.view.active');
      if (v && v.id === 'view-negocio') pintarNegocio();
    }catch(e){}
  }
  window.addEventListener('appi-campus-estado', repintarEstadoCampus);
  window.addEventListener('appi-campus-catalogo', repintarEstadoCampus);
  if (document.readyState === 'complete') setTimeout(revisarJornada, 800);
  else window.addEventListener('load', function(){ setTimeout(revisarJornada, 900); });
  // El catálogo se adelanta en segundo plano: la ruta diaria, la vista
  // y las secciones de vivo/audios encuentran las clases listas sin clic.
  setTimeout(function(){
    cargarCatalogo().then(function(){
      try {
        var v = document.querySelector('.view.active');
        if (v && v.id === 'view-campus') render();
        if (v && v.id === 'view-negocio') pintarNegocio();
      }catch(e){}
    }).catch(function(){});
  }, 1200);
})();
