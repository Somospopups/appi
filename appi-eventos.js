/* APPI · appi-eventos.js v599
   Bus central de eventos para TU MES (cerebro).
   Guarda 1 evento por movimiento esencial:
   mensaje | accion (✓/✗) | contacto (Panel) | cultura (PB/invitados)
   Store: appi_tu_mes_eventos_v1_<uid>  — array JSON, máx 2000, ~400 días.
   No rompe nada si falta: todo es try/catch + silencioso.
*/
(function(){
  'use strict';

  var PREFIX = 'appi_tu_mes_eventos_v1_';
  var CAP = 2000;
  var RETENCION_DIAS = 400;

  function uid(){ try{ return window.APPIAuth && window.APPIAuth.userId ? String(window.APPIAuth.userId()||'') : ''; }catch(e){ return ''; } }
  function storeKey(){ var u = uid(); return u ? (PREFIX + u) : ''; }
  function hoyKey(d){ var x = d ? new Date(d) : new Date(); var y=x.getFullYear(), m=String(x.getMonth()+1).padStart(2,'0'), day=String(x.getDate()).padStart(2,'0'); return y+'-'+m+'-'+day; }
  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function uidShort(){ return Math.random().toString(36).slice(2,9); }

  function leer(){
    var k = storeKey(); if(!k) return {v:1, eventos:[]};
    try{
      var raw = localStorage.getItem(k);
      if(!raw) return {v:1, eventos:[]};
      var o = JSON.parse(raw);
      if(!o || !Array.isArray(o.eventos)) return {v:1, eventos:[]};
      return o;
    }catch(e){ return {v:1, eventos:[]}; }
  }
  function guardar(obj){
    var k = storeKey(); if(!k) return;
    try{ localStorage.setItem(k, JSON.stringify(obj)); }catch(e){}
  }
  function podar(arr){
    if(arr.length > CAP) arr = arr.slice(arr.length - CAP);
    var limite = Date.now() - RETENCION_DIAS*24*60*60*1000;
    var filtrado = arr.filter(function(ev){ return (ev.ts||0) >= limite; });
    // Si filtrado deja <50, mantener al menos 80 últimos por si hay pocos recientes
    if(filtrado.length < 50 && arr.length) return arr.slice(-80);
    return filtrado;
  }
  function emit(tipo, data){
    try{
      data = data || {};
      var k = storeKey(); if(!k) return null;
      var now = Date.now();
      var dia = data.dia || hoyKey(now);
      var ev = {
        id: (now.toString(36)+'-'+uidShort()),
        ts: now,
        dia: dia,
        tipo: String(tipo||'otro'),
        origen: String(data.origen||''),
        titulo: String(data.titulo||'').slice(0,120),
        detalle: String(data.detalle||'').slice(0,280),
        meta: (data.meta && typeof data.meta==='object') ? data.meta : {}
      };
      if(!ev.titulo && !ev.detalle) return null;
      var store = leer();
      store.eventos.push(ev);
      store.eventos = podar(store.eventos);
      store.v = 1;
      guardar(store);
      try{ window.dispatchEvent(new CustomEvent('appi-evento', {detail: ev})); }catch(e){}
      // Avisar a TU MES si está cargado para refrescar métricas
      try{ if(window.APPIEventos && window.APPIEventos._onEmit) window.APPIEventos._onEmit(ev); }catch(e){}
      return ev;
    }catch(e){ return null; }
  }

  function listar(opts){
    opts = opts || {};
    var store = leer();
    var arr = store.eventos.slice();
    if(opts.tipo) arr = arr.filter(function(ev){ return ev.tipo===opts.tipo; });
    if(opts.dia) arr = arr.filter(function(ev){ return ev.dia===opts.dia; });
    if(opts.desde) arr = arr.filter(function(ev){ return ev.dia >= opts.desde; });
    if(opts.hasta) arr = arr.filter(function(ev){ return ev.dia <= opts.hasta; });
    if(opts.anio && opts.mes!=null){
      var pref = opts.anio+'-'+String(opts.mes+1).padStart(2,'0');
      arr = arr.filter(function(ev){ return String(ev.dia).slice(0,7)===pref; });
    }
    arr.sort(function(a,b){ return (a.ts||0)-(b.ts||0); });
    if(opts.limite) arr = arr.slice(-opts.limite);
    return arr;
  }
  function listarHoy(){ return listar({dia: hoyKey()}); }
  function listarMes(anio, mesIdx0){ return listar({anio: anio, mes: mesIdx0}); }
  function resumenDia(diaKey){
    var evs = listar({dia: diaKey});
    var r = {total: evs.length, mensajes:0, acciones:0, contactos:0, cultura:0, promos:0};
    evs.forEach(function(ev){
      if(ev.tipo==='mensaje') r.mensajes++;
      else if(ev.tipo==='accion') r.acciones++;
      else if(ev.tipo==='contacto') r.contactos++;
      else if(ev.tipo==='cultura') r.cultura++;
      else if(ev.tipo==='promo') r.promos++;
    });
    return r;
  }
  function resumenMes(anio, mesIdx0){
    var evs = listarMes(anio, mesIdx0);
    var r = {total: evs.length, mensajes:0, acciones:0, contactos:0, cultura:0, promos:0};
    evs.forEach(function(ev){
      if(ev.tipo==='mensaje') r.mensajes++;
      else if(ev.tipo==='accion') r.acciones++;
      else if(ev.tipo==='contacto') r.contactos++;
      else if(ev.tipo==='cultura') r.cultura++;
      else if(ev.tipo==='promo') r.promos++;
    });
    return r;
  }

  // —— Hook: cultura (diff PB / invitados) —— //
  var _ultimoCulturaRaw = '';
  function onCulturaSet(nuevoRaw){
    try{
      if(nuevoRaw === _ultimoCulturaRaw) return;
      var prev = {};
      try{ prev = _ultimoCulturaRaw ? JSON.parse(_ultimoCulturaRaw) : {}; }catch(e){ prev={}; }
      var curr = {};
      try{ curr = JSON.parse(nuevoRaw||'{}'); }catch(e){ _ultimoCulturaRaw = nuevoRaw; return; }
      _ultimoCulturaRaw = nuevoRaw;
      if(!curr || typeof curr!=='object') return;
      // Detectar cambios mes/día/semana relevantes y emitir
      // Estrategia simple: comparar PB e invitados globales; emitir por cada slot nuevo o incremento
      // Para no spamear, emitimos 1 evento si hay delta PB>0 o invitados nuevos
      var fechaKey = hoyKey();
      // Buscar cambios en estructura conocida: puede ser { '2026-09': {pb, invitados:[]}, '2026-09-10': {pb, invitados:[]}}
      // Recorremos claves y vemos deltas
      var deltas=[];
      Object.keys(curr).forEach(function(k){
        var a = prev[k], b = curr[k];
        if(!b || typeof b!=='object') return;
        if(!a || typeof a!=='object'){ a={}; }
        var pbA = Number(a.pb)||0, pbB = Number(b.pb)||0;
        var invA = Array.isArray(a.invitados)?a.invitados: (Array.isArray(a.invitados)?a.invitados:[]),
            invB = Array.isArray(b.invitados)?b.invitados: [];
        // caso invitados como prop directa vs fila
        if(!Array.isArray(invA) && Array.isArray(a.invitados)) invA=a.invitados; // redundante
        // pb delta
        if(pbB > pbA){
          deltas.push({tipo:'cultura', subtipo:'pb', clave:k, delta: pbB - pbA, nuevo: pbB});
        }
        // invitados nuevos (comparar longitud y contenido)
        var lenA = invA.length, lenB = invB.length;
        if(lenB > lenA){
          // encontrar nombres nuevos
          var prevSet = new Set((invA||[]).map(function(x){ return String((x&&x.nombre)||x||'').trim().toLowerCase(); }));
          var nuevos = (invB||[]).filter(function(x){ var n=String((x&&x.nombre)||x||'').trim().toLowerCase(); return n && !prevSet.has(n); });
          deltas.push({tipo:'cultura', subtipo:'invitado', clave:k, cantidad: lenB - lenA, nuevos: nuevos.slice(0,3).map(function(x){ return x.nombre||String(x); })});
        }
      });
      if(!deltas.length) return;
      // Emitir máximo 2 eventos combinados para no inundar
      // Unificar: si hay pb e invitados, un solo evento cultura con detalle combinado
      var detalles=[], metas={};
      var pbDelta=0, invNuevos=[];
      deltas.forEach(function(d){
        if(d.subtipo==='pb'){ pbDelta += d.delta; metas.pbNuevo = d.nuevo; metas.pbDelta = (metas.pbDelta||0)+d.delta; }
        if(d.subtipo==='invitado'){ invNuevos = invNuevos.concat(d.nuevos||[]); metas.invitadosNuevos = invNuevos.length; if(d.cantidad) metas.invitadosDelta = (metas.invitadosDelta||0)+d.cantidad; }
      });
      if(pbDelta>0) detalles.push('+' + pbDelta + ' PB');
      if(invNuevos.length) detalles.push(invNuevos.join(', ') + (invNuevos.length===1?' se suma':' se suman'));
      else if(metas.invitadosDelta) detalles.push('+' + metas.invitadosDelta + ' invitado' + (metas.invitadosDelta>1?'s':''));
      var titulo = 'Cultura de crecimiento';
      if(pbDelta>0 && invNuevos.length) titulo = 'PB + invitado · cultura';
      else if(pbDelta>0) titulo = 'PB registrados';
      else titulo = 'Invitado registrado';
      emit('cultura', {titulo: titulo, detalle: detalles.join(' · ') || 'Actualización de cultura', origen:'cultura', meta: metas, dia: fechaKey});
    }catch(e){}
  }
  // Inicializar snapshot cultura
  try{ _ultimoCulturaRaw = localStorage.getItem('cultura_crecimiento_v1')||''; }catch(e){}

  // Parchear localStorage DESPUÉS de data-sync (si ya envolvió, lo envolvemos de nuevo conservando dirty)
  try{
    var origSet = Storage.prototype.setItem;
    // Evitar doble parche si ya estamos
    if(!origSet.__appiEventosWrapped){
      var newSet = function(k, v){
        var res = origSet.call(this, k, v);
        try{
          if(String(k)==='cultura_crecimiento_v1' && this===localStorage){
            onCulturaSet(String(v));
          }
        }catch(e){}
        return res;
      };
      newSet.__appiEventosWrapped = true;
      newSet.__orig = origSet;
      Storage.prototype.setItem = newSet;
    }
  }catch(e){}

  // —— Hooks: APPITel (mensajes) —— //
  var _telHooked=false;
  function hookTel(){
    if(_telHooked) return true;
    try{
      if(!window.APPITel || typeof window.APPITel.abrir!=='function') return false;
      var orig = window.APPITel.abrir;
      if(orig.__appiEventos) return true;
      var wrapped = function(tel, texto, nombre, u){
        var out;
        try{ out = orig.apply(this, arguments); }catch(e){ out = false; }
        try{
          var n = String(nombre||'').trim();
          var t = String(texto||'').slice(0,80);
          var telS = String(tel||'').trim();
          emit('mensaje', {
            titulo: n ? ('Mensaje a ' + n) : 'Mensaje enviado',
            detalle: t ? t : (telS ? telS : 'WhatsApp abierto'),
            origen: 'whatsapp',
            meta: {telefono: telS, nombre: n, texto: String(texto||'').slice(0,220)}
          });
        }catch(e){}
        return out;
      };
      wrapped.__appiEventos = true;
      wrapped.__orig = orig;
      window.APPITel.abrir = wrapped;
      _telHooked = true;
      return true;
    }catch(e){ return false; }
  }

  // —— Hooks: APPIMensajes —— //
  var _msgHooked=false;
  function hookMensajes(){
    if(_msgHooked) return true;
    try{
      if(!window.APPIMensajes) return false;
      var target = window.APPIMensajes;
      // marcarAccion (útil para ✓/✗)
      if(typeof target.marcarAccion==='function' && !target.marcarAccion.__appiEventos){
        var origM = target.marcarAccion;
        var wM = function(key, estado, meta){
          var res; try{ res = origM.apply(this, arguments); }catch(e){ res=null; }
          try{
            var es = String(estado||'');
            var emoji = es==='hecha' ? '✓' : (es==='no_hecha' ? '✗' : '·');
            var tit = key ? String(key).slice(0,60) : 'Acción';
            // Buscar texto humano del mensaje si disponible
            var detalleTxt = '';
            try{
              if(window.APPIMensajes && typeof window.APPIMensajes.templatesMensaje==='function'){
                // no llamar templates si no es trivial
              }
            }catch(e){}
            emit('accion', {
              titulo: emoji + ' ' + tit,
              detalle: es==='hecha' ? 'Marcada como hecha' : (es==='no_hecha' ? 'Marcada como no hecha' : String(estado||'')),
              origen: 'acciones',
              meta: {key: String(key||''), estado: es, extra: (meta||null)}
            });
          }catch(e){}
          return res;
        };
        wM.__appiEventos=true; wM.__orig=origM;
        target.marcarAccion = wM;
      }
      // Enviar / registrar si existen (no siempre expuestos)
      ['enviar','registrar','guardarEnvio'].forEach(function(fn){
        if(typeof target[fn]==='function' && !target[fn].__appiEventos){
          var o = target[fn];
          var w = function(){
            var r; try{ r = o.apply(this, arguments); }catch(e){ r=null; }
            try{
              // Emit genérico solo si no pasó por APPITel (evitar duplicado: usamos flag temporal)
              // Si el primer arg parece teléfono/texto, asumimos mensaje
              var a0 = arguments[0];
              if(a0 && typeof a0==='object'){
                // forma objeto
              }
            }catch(e){}
            return r;
          };
          w.__appiEventos=true; w.__orig=o;
          target[fn]=w;
        }
      });
      _msgHooked = true;
      return true;
    }catch(e){ return false; }
  }

  // —— Hooks: APPIGestion (Panel) —— //
  var _gestionHooked=false;
  function hookGestion(){
    if(_gestionHooked) return true;
    try{
      if(!window.APPIGestion) return false;
      var g = window.APPIGestion;
      var funcs = ['guardarPersonaManual','importarPersona','guardarMetadata','logActivity','programarDesdeHistorico','abrirContacto'];
      var hookedAny=false;
      funcs.forEach(function(name){
        if(typeof g[name]==='function' && !g[name].__appiEventos){
          (function(n, orig){
            var w = function(){
              var res;
              try{ res = orig.apply(this, arguments); }catch(e){ res=null; }
              try{
                // Solo emitir en funciones de escritura, no en abrirContacto
                if(n==='abrirContacto') return res;
                // Determinar nombre/tel si vienen en args
                var arg0 = arguments[0];
                var nombre='', tel='', estado='';
                if(arg0 && typeof arg0==='object'){
                  nombre = arg0.nombre || arg0.name || '';
                  tel = arg0.telefono || arg0.tel || '';
                  estado = arg0.estado || '';
                } else if(typeof arg0==='string'){
                  nombre = arg0;
                }
                // Para guardarPersonaManual, tomar del estado actual si no hay args
                if(!nombre && g.state && g.state.currentId){
                  try{ var c = (g.state.contacts||[]).find(function(x){return String(x.id)===String(g.state.currentId)}); if(c){ nombre=c.nombre||''; tel=c.telefono||''; estado=c.estado||''; } }catch(e){}
                }
                var prom = res && typeof res.then==='function' ? res : null;
                var doEmit = function(){
                  var tit = 'Contacto';
                  if(n==='guardarPersonaManual') tit = nombre ? ('Contacto: ' + nombre) : 'Contacto guardado';
                  else if(n==='importarPersona') tit = nombre ? ('Contacto importado: '+nombre) : 'Contacto importado';
                  else if(n==='logActivity') tit = 'Actividad registrada';
                  else if(n==='programarDesdeHistorico') tit = nombre ? ('Seguimiento: '+nombre) : 'Seguimiento programado';
                  else tit = 'Contacto · ' + n;
                  emit('contacto', {titulo: tit.slice(0,80), detalle: tel ? String(tel) : (estado ? 'Estado: '+estado : ''), origen:'panel', meta:{func:n, nombre:String(nombre||'').slice(0,80), telefono:String(tel||'').slice(0,30), estado:String(estado||'')}});
                };
                if(prom){
                  prom.then(function(v){ try{ doEmit(); }catch(e){} return v; }, function(err){ try{ doEmit(); }catch(e){} throw err; });
                } else {
                  doEmit();
                }
              }catch(e){}
              return res;
            };
            w.__appiEventos=true; w.__orig=orig;
            g[n]=w;
            hookedAny=true;
          })(name, g[name]);
        }
      });
      // También detectar creación directa vía cloudFetch success: hacemos poll suave de contactos count
      _gestionHooked = hookedAny || true;
      return true;
    }catch(e){ return false; }
  }

  // —— Hook genérico: ventana.open wa.me (fallback si APPITel no se usa) —— //
  var _openHooked=false;
  function hookWindowOpen(){
    if(_openHooked) return true;
    try{
      var origOpen = window.open;
      if(!origOpen || origOpen.__appiEventos) return true;
      var wOpen = function(url, target, feats){
        var ret; try{ ret = origOpen.apply(this, arguments); }catch(e){ ret=null; }
        try{
          var u = String(url||'');
          if(/wa\.me|api\.whatsapp\.com|whatsapp:/i.test(u)){
            // Intentar extraer teléfono/nombre si están en url
            var telMatch = u.match(/wa\.me\/(\d+)|phone=([^&]+)/i);
            var tel = telMatch ? decodeURIComponent(telMatch[1]||telMatch[2]||'') : '';
            var textMatch = u.match(/[?&]text=([^&]+)/i);
            var txt = textMatch ? decodeURIComponent(textMatch[1]||'') : '';
            // Evitar duplicado si ya emitimos por APPITel hace < 1200ms (usar timestamp guardado)
            var last = hookWindowOpen._lastWa || 0;
            if(Date.now() - last > 1200){
              emit('mensaje', {titulo: tel ? ('WhatsApp a '+tel.slice(-6)) : 'WhatsApp abierto', detalle: txt.slice(0,120) || u.slice(0,120), origen:'whatsapp', meta:{url: u.slice(0,320), telefono: tel}});
              hookWindowOpen._lastWa = Date.now();
            }
          }
        }catch(e){}
        return ret;
      };
      wOpen.__appiEventos=true; wOpen.__orig=origOpen;
      window.open = wOpen;
      _openHooked=true;
      return true;
    }catch(e){ return false; }
  }
  hookWindowOpen._lastWa=0;

  // —— Instalación con reintentos silenciosos —— //
  function tryAll(){
    try{ hookTel(); }catch(e){}
    try{ hookMensajes(); }catch(e){}
    try{ hookGestion(); }catch(e){}
    try{ hookWindowOpen(); }catch(e){}
  }
  var intentos=0;
  function loop(){
    tryAll();
    intentos++;
    if(intentos < 80){
      setTimeout(loop, 900);
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentListener', loop);
  // Arrancar
  setTimeout(loop, 400);
  setTimeout(tryAll, 1200);
  window.addEventListener('load', function(){ setTimeout(tryAll, 600); setTimeout(loop, 1200); });
  // También re-hook cuando cambia login/persona
  window.addEventListener('appi-datasync-applied', function(){ setTimeout(tryAll, 500); });

  // —— API pública —— //
  window.APPIEventos = {
    emit: emit,
    listar: listar,
    listarHoy: listarHoy,
    listarMes: listarMes,
    resumenDia: resumenDia,
    resumenMes: resumenMes,
    hoyKey: hoyKey,
    storeKey: storeKey,
    __onCulturaSet: onCulturaSet,
    _onEmit: null,
    version: 599
  };

  // Detectar promociones u otros (ej: botella) si algún código dispara evento promo, ya está listo el tipo 'promo'
})();
