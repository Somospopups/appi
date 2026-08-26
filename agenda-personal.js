/* ============================================================
   APPI · Agenda personal (v366)
   ------------------------------------------------------------
   Solapa del Panel de Contactos con dos agendas:

     📇 AGENDA APPI      · la que ya existía (Hoy / Todos /
                          Resultados), sin cambios.
     📱 AGENDA PERSONAL  · los contactos del teléfono del
                          distribuidor, subidos con el selector
                          nativo (Android) o un archivo .vcf
                          (Android e iPhone). Cada contacto se
                          puede "pasar a APPI" uno por uno o en
                          bloque: entra como contacto nuevo del
                          embudo.

   Listado sutil (v366/v367): agrupado por letra. Un puntito marca
   a quien ya está en la Agenda APPI. Las acciones (WhatsApp,
   llamar, pasar, quitar) aparecen al tocar el nombre. Selección
   flotante: mantener presionado o "Elegir varios".

   La agenda vive en este teléfono y se sincroniza con la tabla
   appi_agenda_personal de la cuenta (SUPABASE_AGENDA_PERSONAL.sql).
   Si la tabla todavía no existe, todo funciona igual en local y
   se avisa que falta el paso de la base.
   ============================================================ */
(function(){
'use strict';

  var MAX_IMPORT = 1500;
  // Supabase/PostgREST acepta un array JSON en un solo upsert. Mantener los
  // lotes acotados evita requests enormes y permite subir agendas grandes en
  // paralelo, sin volver a caer en un POST por contacto.
  var UPSERT_BATCH_SIZE = 500;

  function $(id){ return document.getElementById(id); }
  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function uuid(){
    if (crypto.randomUUID) return crypto.randomUUID();
    return 'ap-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }
  function uid(){
    return window.APPIAuth && window.APPIAuth.userId ? window.APPIAuth.userId() : '';
  }
  function autorizado(){
    return !!(window.APPIAuth && window.APPIAuth.isEnabled && window.APPIAuth.isEnabled() &&
      window.APPIAuth.isLocallyAuthorized && window.APPIAuth.isLocallyAuthorized() && uid());
  }
  function digitos(valor){
    return String(valor || '').replace(/\D/g, '').slice(0, 15);
  }
  function telValido(valor){
    var d = digitos(valor);
    return d.length >= 8 && d.length <= 15;
  }
  function toast(mensaje, duracion){
    if (typeof window.showToast === 'function') window.showToast(mensaje, duracion);
  }
  function cloudFetch(path, opciones){
    if (window.APPIGestion && typeof window.APPIGestion.cloudFetch === 'function'){
      return window.APPIGestion.cloudFetch(path, opciones);
    }
    return Promise.reject(new Error('Panel no disponible.'));
  }

  /* ---------- estado ---------- */

  var mios = []; // {id, nombre, telefono, tel_norm, estado:'nuevo'|'mergado', contacto_id, origen, created_at, updated_at}
  var seleccionados = new Set();
  // Selección flotante (v360): el modo se abre al mantener presionado un
  // contacto o con el botón "Elegir varios". Mientras está abierto la barra
  // queda a la vista aunque todavía no haya nada marcado, y tocar una fila la
  // elige o la suelta.
  var abiertoId = null; // fila cuya ficha de acciones está abierta
  var modoSeleccion = false;
  // Cuánto hay que dejar el dedo apoyado para que cuente como selección.
  var PRESION_MS = 500;
  // Si el dedo se corre más que esto, el gesto era un desplazamiento de la
  // lista y no una selección: se cancela sin marcar nada.
  var MARGEN_MOVIMIENTO = 10;
  // El gesto largo repinta el panel; el click que lo sigue cae sobre el nodo
  // nuevo y volvería a soltar lo que recién se eligió. Este sello se consume
  // en el primer click posterior y evita ese ida y vuelta.
  var gestoPresionado = null;
  var busqueda = '';
  var sinTabla = false;   // falta correr SUPABASE_AGENDA_PERSONAL.sql
  var cargado = false;
  var uidVisto = '';
  var sincronizando = false;
  var sincronizacionActiva = null;

  function cacheKey(){ return 'appi_agenda_personal_v1_' + uid(); }
  function colaKey(){ return 'appi_agenda_personal_queue_v1_' + uid(); }

  function leerCache(){
    try{
      var filas = JSON.parse(localStorage.getItem(cacheKey()) || '[]');
      return Array.isArray(filas) ? filas : [];
    }catch(e){ return []; }
  }
  function guardar(){
    if (!uid()) return;
    try{ localStorage.setItem(cacheKey(), JSON.stringify(mios)); }catch(e){}
  }
  function leerCola(){
    try{
      var cola = JSON.parse(localStorage.getItem(colaKey()) || '[]');
      return Array.isArray(cola) ? cola : [];
    }catch(e){ return []; }
  }
  function guardarCola(cola){
    try{ localStorage.setItem(colaKey(), JSON.stringify(cola)); }catch(e){}
  }
  // La última operación por teléfono gana: si se sube y se borra antes de
  // sincronizar, no se mandan las dos. q permite quitar sólo la operación que
  // terminó, aunque el usuario haya generado otra mientras subía el lote.
  function encolar(accion){
    var entrada = Object.assign({ q: uuid() }, accion);
    var cola = leerCola().filter(function(it){ return it.t !== entrada.t; });
    cola.push(entrada);
    guardarCola(cola);
  }

  function quitarDeCola(procesadas){
    var ids = new Set(procesadas.map(function(it){ return it.q; }).filter(Boolean));
    var restantes = leerCola().filter(function(actual){
      if (actual.q) return !ids.has(actual.q);
      // Compatibilidad con colas creadas antes de v358, que no tenían q.
      return !procesadas.some(function(it){
        return !it.q && actual.a === it.a && actual.t === it.t &&
          JSON.stringify(actual.p || null) === JSON.stringify(it.p || null);
      });
    });
    guardarCola(restantes);
  }

  function cargar(){
    var id = uid();
    if (!id) return mios;
    if (!cargado || uidVisto !== id){
      uidVisto = id;
      mios = leerCache();
      cargado = true;
    }
    return mios;
  }
  function recargarDesdeCache(){
    cargado = false;
    cargar();
    repintarSiVisible();
  }
  function pedirNubeCuenta(){
    if (!window.APPIDataSync || typeof window.APPIDataSync.syncNow !== 'function') return Promise.resolve(false);
    return window.APPIDataSync.syncNow(true).then(function(){
      recargarDesdeCache();
      return true;
    }).catch(function(){ return false; });
  }

  var CUENTA_KEY = 'agenda_personal';

  function contactoDeCuenta(f){
    var tel = String((f && (f.telefono || f.telf)) || '').trim();
    var norm = String((f && (f.tel_norm || f.telefono_normalizado)) || '').replace(/\D/g, '') || digitos(tel);
    if (!norm) return null;
    return {
      id: (f && f.id) || ('ap-' + uuid()),
      nombre: String((f && f.nombre) || 'Sin nombre').slice(0, 120),
      telefono: tel.slice(0, 30) || norm,
      tel_norm: norm.slice(0, 15),
      estado: (f && f.estado) === 'mergado' ? 'mergado' : 'nuevo',
      contacto_id: (f && f.contacto_id) || null,
      origen: (f && f.origen) || 'vcf',
      created_at: (f && f.created_at) || new Date().toISOString()
    };
  }
  function mezclarDeCuenta(filas){
    cargar();
    var porTel = {};
    mios.forEach(function(c){ if (c.tel_norm) porTel[c.tel_norm] = c; });
    (filas || []).forEach(function(bruto){
      var f = contactoDeCuenta(bruto);
      if (!f) return;
      var local = porTel[f.tel_norm];
      if (!local){
        mios.push(f);
        porTel[f.tel_norm] = f;
      } else {
        if (f.estado === 'mergado') local.estado = 'mergado';
        if (f.contacto_id) local.contacto_id = f.contacto_id;
        if (f.nombre && (!local.nombre || local.nombre.indexOf('Sin nombre') === 0)) local.nombre = f.nombre;
      }
    });
    guardar();
  }
  async function verEnOtroDispositivo(){
    if (!autorizado()){
      await window.APPIDialog.alert('Iniciá sesión con tu cuenta de distribuidor para sincronizar la agenda.', { title: 'Sincronizar dispositivo', icon: '📱' });
      return;
    }
    if (!navigator.onLine){
      await window.APPIDialog.alert('Sin internet no se puede sincronizar el dispositivo.', { title: 'Sin conexión', icon: '📡' });
      return;
    }
    cargar();
    var boton = $('apOtroDispositivo');
    if (boton){ boton.disabled = true; boton.textContent = 'Sincronizando…'; }
    try{
      var subi = false;
      if (mios.length){
        await cloudFetch('/rest/v1/appi_datos?on_conflict=user_id,data_key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify([{
            user_id: uid(),
            data_key: CUENTA_KEY,
            data: { value: JSON.stringify(mios) },
            updated_at: new Date().toISOString()
          }])
        });
        subi = true;
      }
      var rows = await cloudFetch('/rest/v1/appi_datos?select=data,updated_at&data_key=eq.' + encodeURIComponent(CUENTA_KEY) + '&limit=1');
      var remoto = [];
      (Array.isArray(rows) ? rows : []).forEach(function(row){
        var crudo = row && row.data && (row.data.value != null ? row.data.value : row.data);
        if (typeof crudo === 'string'){
          try{ crudo = JSON.parse(crudo); }catch(e){ crudo = []; }
        }
        if (Array.isArray(crudo)) remoto = remoto.concat(crudo);
      });
      mezclarDeCuenta(remoto);
      repintarSiVisible();
      if (subi && mios.length){
        toast('Listo: ya está en tu cuenta. En el otro dispositivo tocá Sincronizar dispositivo.', 4200);
      } else if (mios.length){
        toast('Trajimos tu agenda: ' + mios.length + (mios.length === 1 ? ' contacto' : ' contactos'), 3200);
      } else {
        await window.APPIDialog.alert(
          'No hay agenda en este teléfono ni en tu cuenta.\n\nSubila acá primero (Subir agenda) y después tocá de nuevo Sincronizar dispositivo.',
          { title: 'Todavía no hay agenda', icon: '📱' }
        );
      }
    }catch(error){
      await window.APPIDialog.alert(String(error && error.message || 'No se pudo pasar la agenda.'), { title: 'No se pudo pasar', icon: '!' });
    }finally{
      var b = $('apOtroDispositivo');
      if (b){ b.disabled = false; b.textContent = 'Sincronizar dispositivo'; }
    }
  }

  /* ---------- sincronización (espejo de la tabla) ---------- */

  function filaDe(c){
    return {
      user_id: uid(),
      nombre: String(c.nombre || '').slice(0, 120),
      telefono: String(c.telefono || '').slice(0, 30),
      telefono_normalizado: c.tel_norm,
      estado: c.estado === 'mergado' ? 'mergado' : 'nuevo',
      contacto_id: c.contacto_id || null,
      origen: c.origen || 'manual'
    };
  }
  async function subirLote(filas){
    if (!filas.length) return;
    await cloudFetch('/rest/v1/appi_agenda_personal?on_conflict=user_id,telefono_normalizado', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal'
      },
      // Un array es un batch upsert real de PostgREST: todos los contactos
      // llegan juntos, en lugar de abrir una request por cada teléfono.
      body: JSON.stringify(filas)
    });
  }
  async function borrarFila(telNorm){
    await cloudFetch('/rest/v1/appi_agenda_personal?telefono_normalizado=eq.' + encodeURIComponent(telNorm), {
      method: 'DELETE',
      headers: { Prefer: 'return=minimal' }
    });
  }
  async function vaciarCola(){
    var subidas = [];
    while (true){
      var cola = leerCola();
      if (!cola.length) return subidas;

      if (cola[0].a === 'up'){
        // Tomar todos los upserts consecutivos y partirlos en paquetes. Los
        // paquetes se envían en paralelo para que una agenda completa quede
        // disponible apenas termina la importación.
        var lotes = [], indice = 0;
        while (indice < cola.length && cola[indice].a === 'up'){
          lotes.push(cola.slice(indice, indice + UPSERT_BATCH_SIZE));
          indice += UPSERT_BATCH_SIZE;
        }
        await Promise.all(lotes.map(function(lote){
          return subirLote(lote.map(function(it){
            var p = it.p || {};
            if (!p.user_id) p = Object.assign({}, p, { user_id: uid() });
            return p;
          }));
        }));
        [].concat.apply([], lotes).forEach(function(it){ subidas.push(it.t); });
        quitarDeCola([].concat.apply([], lotes));
      } else {
        var it = cola[0];
        await borrarFila(it.t);
        quitarDeCola([it]);
      }
    }
  }
  function falloDeTabla(error){
    var texto = String(error && error.message || '') + ' ' + String(error && error.status || '');
    return /appi_agenda_personal|42P01|PGRST204|does not exist|Could not find|404/.test(texto);
  }
  function sincronizar(){
    if (!autorizado()) return Promise.resolve(false);
    if (sincronizacionActiva) return sincronizacionActiva;

    sincronizando = true;
    sincronizacionActiva = (async function(){
      try{
        var subidasEnEstaVuelta = new Set(await vaciarCola());
        sinTabla = false;
        var filas = await cloudFetch('/rest/v1/appi_agenda_personal?select=nombre,telefono,telefono_normalizado,estado,contacto_id,origen,created_at&user_id=eq.' + encodeURIComponent(uid()) + '&order=created_at.asc&limit=5000');
        var locales = {};
        cargar().forEach(function(c){ locales[c.tel_norm] = c; });
        (Array.isArray(filas) ? filas : []).forEach(function(f){
          if (!f || !f.telefono_normalizado) return;
          var local = locales[f.telefono_normalizado];
          if (local){
            local.estado = f.estado === 'mergado' || local.estado === 'mergado' ? 'mergado' : 'nuevo';
            if (f.contacto_id) local.contacto_id = f.contacto_id;
          } else {
            mios.push({
              id: 'ap-' + uuid(), nombre: f.nombre || '', telefono: f.telefono || '',
              tel_norm: f.telefono_normalizado, estado: f.estado || 'nuevo',
              contacto_id: f.contacto_id || null, origen: f.origen || 'vcf',
              created_at: f.created_at || new Date().toISOString()
            });
            locales[f.telefono_normalizado] = mios[mios.length - 1];
          }
        });
        // Lo que quedó sólo en este teléfono se sube (se creó en otra ocasión
        // sin conexión o se importó mientras la tabla todavía no existía).
        var enLaNube = {};
        (Array.isArray(filas) ? filas : []).forEach(function(f){ if (f && f.telefono_normalizado) enLaNube[f.telefono_normalizado] = true; });
        for (var i = 0; i < mios.length; i++){
          if (!enLaNube[mios[i].tel_norm] && !subidasEnEstaVuelta.has(mios[i].tel_norm)){
            encolar({ a: 'up', t: mios[i].tel_norm, p: filaDe(mios[i]) });
          }
        }
        guardar();
        await vaciarCola();
        return true;
      }catch(error){
        if (falloDeTabla(error)) sinTabla = true;
        else if (!(error && error.network)) console.warn('Agenda personal: no se pudo sincronizar', error);
        return false;
      }finally{
        sincronizando = false;
        sincronizacionActiva = null;
        repintarSiVisible();
      }
    })();
    return sincronizacionActiva;
  }

  /* ---------- importar ---------- */

  function agregar(nombre, telefono, origen){
    var tel = String(telefono || '').trim();
    var d = digitos(tel);
    if (!telValido(tel)) return 'sin_tel';
    if (!String(nombre || '').trim()) nombre = 'Sin nombre ' + tel.slice(-4);
    var existente = mios.some(function(c){ return c.tel_norm === d; });
    if (existente) return 'repetido';
    if (mios.length >= MAX_IMPORT) return 'lleno';
    mios.push({
      id: 'ap-' + uuid(),
      nombre: String(nombre).trim().slice(0, 120),
      telefono: tel.slice(0, 30),
      tel_norm: d,
      estado: 'nuevo',
      contacto_id: null,
      origen: origen || 'manual',
      created_at: new Date().toISOString()
    });
    return 'ok';
  }
  async function importarLista(lista, origen){
    cargar();
    var agregados = 0, repetidos = 0, sinTel = 0, nuevos = [];
    lista.forEach(function(p){
      var r = agregar(p.nombre, p.telefono, origen);
      if (r === 'ok'){ agregados++; nuevos.push(mios[mios.length - 1]); }
      else if (r === 'repetido') repetidos++;
      else if (r === 'sin_tel') sinTel++;
    });
    if (agregados){
      guardar();
      nuevos.forEach(function(c){ encolar({ a: 'up', t: c.tel_norm, p: filaDe(c) }); });
      // La cola ya quedó ordenada; si hay internet sale ahora mismo en uno o
      // varios batches. Esperar acá deja la importación lista al volver del
      // selector, sin bloquear cuando el dispositivo está offline. Si había
      // otra sincronización en vuelo, una segunda pasada recoge una cola que
      // se haya agregado entre sus dos lecturas.
      if (navigator.onLine){
        await sincronizar();
        if (leerCola().length) await sincronizar();
      }
    }
    return { agregados: agregados, repetidos: repetidos, sinTel: sinTel };
  }

  // El selector nativo del teléfono (Android: Chrome lo trae; iPhone no
  // permite elegir contactos desde una web, ahí se usa el .vcf).
  async function elegirDelTelefono(){
    var picker = navigator.contacts;
    if (!picker || typeof picker.select !== 'function'){
      await window.APPIDialog.alert(
        'Este teléfono no deja elegir contactos directo desde APPI.\n\nUsá "Subir agenda (.vcf)": en iPhone se exporta una sola vez desde iCloud y después queda para siempre.',
        { title: 'Elegir del teléfono', icon: '📱' }
      );
      return;
    }
    var sel;
    try{
      sel = await picker.select(['name', 'tel'], { multiple: true });
    }catch(error){
      // Cancelar el selector es lo más normal del mundo: no se molesta a nadie.
      if (error && /Abort/i.test(String(error.name || ''))) return;
      // Si Android no dejó abrir la agenda, se explica cómo salir en criollo
      // (v358: antes fallaba en silencio y parecía que el botón no hacía nada).
      var que = String(error && error.name || '') + ' ' + String(error && error.message || '');
      if (/NotAllowed|Security|Permission|NotEnabled/i.test(que)){
        await window.APPIDialog.alert(
          'Android no dejó abrir tu agenda desde acá. Casi siempre es el permiso de contactos bloqueado:\n\n' +
          '1. Si estás en Chrome: tocá los tres puntitos ⋮ (o el candado 🔒) → Permisos → activá Contactos para APPI y volvé a probar.\n' +
          '2. Si APPI está instalada como app: andá a Ajustes del teléfono → Apps → APPI (o Chrome) → Permisos → Contactos → Permitir.\n\n' +
          'Si sigue sin dejar, usá "Subir agenda (.vcf)": funciona igual en cualquier teléfono.',
          { title: 'Falta el permiso', icon: '🔐' }
        );
      } else {
        await window.APPIDialog.alert(
          'No pudimos abrir la agenda del teléfono (' + String(error && error.name || 'error desconocido') + ').\n\n' +
          'Probá de nuevo en un rato, o usá "Subir agenda (.vcf)": funciona en cualquier teléfono y trae todos los contactos de una.',
          { title: 'No se pudo abrir', icon: '📱' }
        );
      }
      return;
    }
    var lista = (Array.isArray(sel) ? sel : []).map(function(c){
      var nombre = Array.isArray(c.name) && c.name.length ? c.name[0] : (c.name || '');
      var tels = Array.isArray(c.tel) ? c.tel : (c.tel ? [c.tel] : []);
      return { nombre: nombre, telefono: mejorTelefono(tels) };
    });
    if (lista.length){
      var res = await importarLista(lista, 'telefono');
      resumenDeImportacion(res);
    } else {
      await window.APPIDialog.alert('No elegiste ningún contacto. Tocá de nuevo "Elegir del teléfono" y marcá los que quieras pasar.', { title: 'Nadie elegido', icon: '👆' });
    }
  }

  // De todos los números del contacto queda el mejor: primero el celular,
  // después el marcado como preferido, al final el primero válido.
  function mejorTelefono(tels){
    var validos = tels.filter(telValido);
    if (!validos.length) return '';
    var celular = validos.find(function(t, i, arr){ return /15|m[oó]vil|cel/i.test(t); });
    if (celular) return celular;
    return validos[0];
  }

  async function leerArchivoVcf(archivo){
    var texto = await archivo.text();
    var lista = parsearVcard(texto);
    var res = await importarLista(lista, 'vcf');
    resumenDeImportacion(res);
  }

  function resumenDeImportacion(res){
    if (!res.agregados && !res.repetidos){
      window.APPIDialog.alert(
        'No encontramos contactos con teléfono válido en el archivo.\n\nRevisá que sea una agenda exportada (.vcf).',
        { title: 'No se pudo importar', icon: '📂' }
      );
      return;
    }
    var partes = [];
    partes.push(res.agregados + (res.agregados === 1 ? ' contacto agregado' : ' contactos agregados'));
    if (res.repetidos) partes.push(res.repetidos + (res.repetidos === 1 ? ' ya estaba' : ' ya estaban'));
    toast('📥 ' + partes.join(' · '), 3200);
  }

  /* ---------- vCard (.vcf) ----------
     Soporta los formatos que exportan Android (3.0/4.0 UTF-8) e
     iPhone/iCloud (3.0), más el 2.1 con QUOTED-PRINTABLE de las
     agendas viejas. Se expone como APPIAgendaPersonal.parsearVcard
     para probarlo con casos reales. */

  function decodificarQuotedPrintable(valor){
    var bytes = [];
    for (var i = 0; i < valor.length; i++){
      if (valor[i] === '=' && /^[0-9A-Fa-f]{2}$/.test(valor.substr(i + 1, 2))){
        bytes.push(parseInt(valor.substr(i + 1, 2), 16));
        i += 2;
      } else bytes.push(valor.charCodeAt(i) & 0xFF);
    }
    try{
      return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
    }catch(e){
      return valor;
    }
  }
  function limpiarValor(valor, params){
    var v = String(valor || '');
    if (/QUOTED-PRINTABLE/i.test(params)) v = decodificarQuotedPrintable(v);
    v = v.replace(/\\n/gi, ' ').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
    return v.trim();
  }
  function nombreDeN(valor){
    var partes = String(valor || '').split(';').map(function(p){ return limpiarValor(p, ''); });
    // N = Apellido;Nombre;Medio;Prefijo;Sufijo
    var apellido = partes[0] || '', nombre = partes[1] || '';
    return (nombre + ' ' + apellido).replace(/\s+/g, ' ').trim();
  }
  function parsearVcard(texto){
    var plano = String(texto || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    // Desplegar líneas continuadas (empiezan con espacio o tab) y los
    // soft-breaks de QUOTED-PRINTABLE (= al final).
    plano = plano.replace(/\n[ \t]/g, '').replace(/=\n/g, '');
    var lineas = plano.split('\n');
    var cartas = [], actual = null;
    lineas.forEach(function(linea){
      if (/^BEGIN:VCARD/i.test(linea)) actual = { tels: [], paramsDe: [] };
      else if (actual && /^END:VCARD/i.test(linea)){ cartas.push(actual); actual = null; }
      else if (actual){
        var corte = linea.indexOf(':');
        if (corte < 0) return;
        var campo = linea.slice(0, corte), valor = linea.slice(corte + 1);
        var m = campo.match(/^([A-Za-z-]+)(?:;(.*))?$/);
        if (!m) return;
        var prop = m[1].toUpperCase(), params = m[2] || '';
        if (prop === 'FN') actual.fn = limpiarValor(valor, params);
        else if (prop === 'N') actual.n = valor;
        else if (prop === 'TEL'){
          actual.tels.push(limpiarValor(valor, params));
          actual.paramsDe.push(params);
        }
      }
    });
    var salida = [];
    cartas.forEach(function(c){
      var nombre = c.fn || (c.n ? nombreDeN(c.n) : '');
      // El mejor teléfono: celular o preferido primero, igual que el picker.
      var indizado = c.tels.map(function(t, i){ return { t: t, params: c.paramsDe[i] || '' }; });
      var ordenados = indizado.slice().sort(function(a, b){
        function puntos(x){
          var p = 0;
          if (/CELL|MOBILE|M[ÓO]VIL/i.test(x.params)) p += 2;
          if (/PREF/i.test(x.params)) p += 1;
          return p;
        }
        return puntos(b) - puntos(a);
      });
      var telefono = '';
      for (var i = 0; i < ordenados.length; i++){
        if (telValido(ordenados[i].t)){ telefono = ordenados[i].t; break; }
      }
      if (!nombre && !telefono) return;
      salida.push({ nombre: nombre, telefono: telefono });
    });
    return salida;
  }

  /* ---------- relación con la Agenda APPI ---------- */

  function contactosAppi(){
    return (window.APPIGestion && window.APPIGestion.state && Array.isArray(window.APPIGestion.state.contacts))
      ? window.APPIGestion.state.contacts : [];
  }
  function enAppi(telNorm){
    if (!telNorm) return null;
    return contactosAppi().find(function(g){ return digitos(g.telefono) === telNorm; }) || null;
  }

  function abrirWa(id){
    cargar();
    var c = mios.find(function(x){ return x.id === id; });
    if (!c) return;
    if (window.APPITel && typeof window.APPITel.abrir === 'function'){
      window.APPITel.abrir(c.telefono, '', c.nombre);
    } else {
      var d = digitos(c.telefono);
      if (d) window.open('https://wa.me/' + d, '_blank', 'noopener');
    }
  }

  async function pasarApapi(id){
    cargar();
    var c = mios.find(function(x){ return x.id === id; });
    if (!c) return;
    var yaEsta = enAppi(c.tel_norm);
    if (yaEsta){
      // Ya existe en el panel: se marca como pasado y se ofrece verlo.
      var ver = await window.APPIDialog.confirm(
        c.nombre + ' ya está en tu Agenda APPI.\n\n¿Lo marcamos como pasado para no volver a ofrecerlo?',
        { title: 'Ya está en APPI', icon: '📇', okText: 'Marcar y ver', cancelText: 'Cancelar' }
      );
      if (ver){ marcarMerlado(c, yaEsta.id); verEnAppi(yaEsta.id); }
      return;
    }
    var ok = await window.APPIDialog.confirm(
      '¿Pasás a ' + c.nombre + ' · ' + c.telefono + ' a tu Agenda APPI?\n\nEntra como contacto Nuevo para que empieces a trabajarlo (encuesta, seguimiento…).',
      { title: 'Pasar a Agenda APPI', icon: '📇', okText: 'Pasar a APPI', cancelText: 'Cancelar' }
    );
    if (!ok) return;
    try{
      var guardado = await window.APPIGestion.importarPersona({
        nombre: c.nombre, telefono: c.telefono, estado: 'nuevo',
        notas: 'Traído de la agenda del teléfono (v358).'
      });
      marcarMerlado(c, guardado && guardado.id);
      var primer = c.nombre.split(/\s+/)[0];
      toast((guardado && guardado.pendiente_de_subir)
        ? primer + ' quedó en tu panel. Se sube solo al volver internet ✓'
        : primer + ' ya está en tu Agenda APPI ✓', 3000);
      if (navigator.onLine && window.APPIGestion.refresh) await window.APPIGestion.refresh(false);
      else repintarSiVisible();
    }catch(error){
      await window.APPIDialog.alert(String(error && error.message || 'No se pudo pasar el contacto.'), { title: 'No pudimos pasarlo', icon: '!' });
    }
  }

  async function pasarSeleccionados(){
    cargar();
    var elegidos = mios.filter(function(c){ return seleccionados.has(c.id); });
    if (!elegidos.length) return;

    var paraPasar = elegidos.filter(function(c){ return c.estado !== 'mergado' && !enAppi(c.tel_norm); });
    var yaEstan = elegidos.length - paraPasar.length;

    if (!paraPasar.length){
      await window.APPIDialog.alert(
        'Todos los contactos seleccionados (' + elegidos.length + ') ya están en tu Agenda APPI.',
        { title: 'Ya están en APPI', icon: '📇' }
      );
      return;
    }

    var mensaje = '¿Pasás ' + paraPasar.length + (paraPasar.length === 1 ? ' contacto' : ' contactos') + ' a tu Agenda APPI?\n\nEntrarán como contactos Nuevos en el embudo.';
    if (yaEstan > 0){
      mensaje += '\n\n(' + yaEstan + (yaEstan === 1 ? ' ya estaba en APPI y no se duplicará).' : ' ya estaban en APPI y no se duplicarán).');
    }

    var ok = await window.APPIDialog.confirm(mensaje, {
      title: 'Pasar a Agenda APPI',
      icon: '📇',
      okText: 'Pasar a APPI',
      cancelText: 'Cancelar'
    });
    if (!ok) return;

    var exitosos = 0;
    for (var i = 0; i < paraPasar.length; i++){
      var c = paraPasar[i];
      try{
        var guardado = await window.APPIGestion.importarPersona({
          nombre: c.nombre,
          telefono: c.telefono,
          estado: 'nuevo',
          notas: 'Traído de la agenda del teléfono (v358).'
        });
        // En el pase masivo se difiere la sincronización para que todos los
        // cambios de estado viajen juntos en un batch upsert.
        marcarMerlado(c, guardado && guardado.id, false);
        exitosos++;
      }catch(err){
        console.warn('Agenda personal: error importando', c.nombre, err);
      }
    }

    elegidos.forEach(function(c){
      var ya = enAppi(c.tel_norm);
      if (ya && c.estado !== 'mergado') marcarMerlado(c, ya.id, false);
    });

    seleccionados.clear();
    modoSeleccion = false;
    toast('📥 ' + exitosos + (exitosos === 1 ? ' contacto pasado a Agenda APPI ✓' : ' contactos pasados a Agenda APPI ✓'), 3500);

    if (navigator.onLine) await sincronizar();
    if (navigator.onLine && window.APPIGestion.refresh) await window.APPIGestion.refresh(false);
    else repintarSiVisible();
  }

  function marcarMerlado(c, contactoId, sincronizarAhora){
    c.estado = 'mergado';
    c.contacto_id = contactoId || c.contacto_id || null;
    guardar();
    encolar({ a: 'up', t: c.tel_norm, p: filaDe(c) });
    if (sincronizarAhora !== false && navigator.onLine) sincronizar();
    repintarSiVisible();
  }

  function verEnAppi(contactoId){
    if (window.APPIGestion && window.APPIGestion.state){
      window.APPIGestion.state.agenda = 'appi';
      try{ localStorage.setItem('appi_gestion_agenda_vista_' + uid(), 'appi'); }catch(e){}
    }
    if (window.APPIGestion && window.APPIGestion.setView) window.APPIGestion.setView('todos');
    if (contactoId && window.APPIGestion && window.APPIGestion.abrirContacto) window.APPIGestion.abrirContacto(contactoId);
  }

  async function quitar(id){
    cargar();
    var c = mios.find(function(x){ return x.id === id; });
    if (!c) return;
    var ok = await window.APPIDialog.confirm(
      'Se quita a ' + c.nombre + ' de tu Agenda Personal (la de APPI no se toca).',
      { title: 'Quitar de la agenda', icon: '🗑️', okText: 'Quitar', danger: true }
    );
    if (!ok) return;
    mios = mios.filter(function(x){ return x.id !== id; });
    seleccionados.delete(id);
    guardar();
    encolar({ a: 'del', t: c.tel_norm });
    if (navigator.onLine) sincronizar(); else repintarSiVisible();
    toast('Contacto quitado de tu agenda personal');
  }

  async function quitarSeleccionados(){
    cargar();
    var elegidos = mios.filter(function(c){ return seleccionados.has(c.id); });
    if (!elegidos.length) return;

    var ok = await window.APPIDialog.confirm(
      'Se quitarán ' + elegidos.length + (elegidos.length === 1 ? ' contacto' : ' contactos') + ' de tu Agenda Personal.\n\n(La Agenda APPI no se toca).',
      { title: 'Quitar de la agenda', icon: '🗑️', okText: 'Quitar seleccionados', danger: true }
    );
    if (!ok) return;

    var selIds = new Set(elegidos.map(function(c){ return c.id; }));
    elegidos.forEach(function(c){ encolar({ a: 'del', t: c.tel_norm }); });
    mios = mios.filter(function(x){ return !selIds.has(x.id); });
    seleccionados.clear();
    modoSeleccion = false;
    guardar();

    if (navigator.onLine) sincronizar(); else repintarSiVisible();
    toast(elegidos.length + (elegidos.length === 1 ? ' contacto quitado de tu agenda personal' : ' contactos quitados de tu agenda personal'));
  }

  /* ---------- selección flotante (v360) ---------- */

  // Elige o suelta un contacto y repinta. Elegir siempre abre la barra, así el
  // gesto largo y el toque sobre la fila terminan en el mismo lugar.
  function alternarSeleccion(id){
    if (!id) return;
    if (seleccionados.has(id)) seleccionados.delete(id);
    else {
      seleccionados.add(id);
      modoSeleccion = true;
      abiertoId = null;
    }
    repintarSiVisible();
  }

  // Suelta todo y cierra la barra. Es lo que hacen el ✕ de la barra y el
  // botón "Listo" cuando el modo ya estaba abierto.
  function cerrarSeleccion(){
    seleccionados.clear();
    modoSeleccion = false;
    abiertoId = null;
    repintarSiVisible();
  }

  // Al soltar el dedo después de un gesto largo el navegador manda un click.
  // Ese click cae sobre la fila recién repintada y la volvería a soltar, así
  // que se descarta el primer click que llegue después del gesto. Se registra
  // una sola vez por página: bind() corre en cada repintada.
  var gestoProtegido = false;
  function protegerDelGestoLargo(){
    if (gestoProtegido) return;
    gestoProtegido = true;
    document.addEventListener('click', function(e){
      if (!gestoPresionado) return;
      // Si pasó mucho tiempo el gesto quedó colgado (el dedo se fue de la
      // ventana sin click): se descarta el sello y el click vale.
      if (Date.now() - gestoPresionado.hasta > 5000){ gestoPresionado = null; return; }
      gestoPresionado = null;
      e.preventDefault();
      e.stopPropagation();
    }, true);
    // Un gesto nuevo deja sin efecto cualquier sello anterior.
    document.addEventListener('pointerdown', function(){ gestoPresionado = null; }, true);
  }

  /* ---------- vista ---------- */

  function letraDe(nombre){
    var n = String(nombre || '').trim();
    if (!n) return '#';
    var ch = n.charAt(0).toUpperCase();
    try{ ch = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }catch(e){}
    if (ch === 'Ñ' || n.charAt(0).toUpperCase() === 'Ñ') return 'Ñ';
    if (ch >= 'A' && ch <= 'Z') return ch;
    return '#';
  }

  function css(){
    if (document.getElementById('apEstilos')) return;
    var st = document.createElement('style');
    st.id = 'apEstilos';
    st.textContent = [
      '.agenda-switch{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:13px 0 3px}',
      '.agenda-switch button{min-height:44px;border:1px solid rgba(80,90,130,.14);border-radius:13px;background:#fff;font:inherit;font-size:12px;font-weight:800;color:#5c5c68;cursor:pointer;padding:6px 8px}',
      '.agenda-switch button.activo{background:linear-gradient(135deg,#5b8def,#8b63e8);border-color:transparent;color:#fff;box-shadow:0 6px 16px rgba(91,112,210,.25)}',
      'body.dark .agenda-switch button{background:rgba(30,30,50,.58);border-color:rgba(255,255,255,.08);color:#c9c9d6}',
      'body.dark .agenda-switch button.activo{color:#fff}',
      '.ap-cabeza{margin:18px 0 4px}',
      '.ap-cabeza h3{margin:0;font-size:28px;font-weight:500;letter-spacing:-.03em;color:#2c2c34;font-family:Georgia,"Times New Roman",serif}',
      'body.dark .ap-cabeza h3{color:#f2f0ea}',
      '.ap-cabeza small{display:block;margin-top:4px;color:#9a9aa8;font-size:13px;font-weight:500}',
      '.ap-import{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 6px}',
      '.ap-import button{flex:0 0 auto;width:auto;min-height:32px;border:0;border-radius:8px;font:inherit;font-size:12px;font-weight:700;cursor:pointer;padding:6px 11px;line-height:1.2}',
      '.ap-import button:disabled{opacity:.55;cursor:default}',
      '.ap-import .ppal{background:rgba(91,141,239,.14);color:#3d63c9;box-shadow:none}',
      '.ap-import .otro{background:rgba(91,141,239,.14);color:#3d63c9}',
      '.ap-import .guia{background:rgba(80,90,130,.07);border:0;color:#6b6e82}',
      'body.dark .ap-import .ppal{background:rgba(91,141,239,.22);color:#9db9f7}',
      'body.dark .ap-import .guia{background:rgba(255,255,255,.06);color:#b7b3c9}',
      '.ap-buscar{width:100%;min-height:36px;margin:14px 0 2px;padding:6px 0 8px;border:0;border-bottom:1px solid rgba(80,90,130,.16);border-radius:0;background:transparent;font:inherit;font-size:15px;outline:none;box-sizing:border-box;color:#30303d}',
      '.ap-buscar:focus{border-bottom-color:#b7a8d9}',
      'body.dark .ap-buscar{background:transparent;border-bottom-color:rgba(255,255,255,.14);color:#f2f2f7}',
      '.ap-toolbar{display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap;margin:6px 0 8px;padding:0;font-size:12.5px;color:#8a8a98;font-weight:600;user-select:none}',
      'body.dark .ap-toolbar{color:#9d9fb5}',
      '.ap-select-all{display:inline-flex;align-items:center;gap:7px;cursor:pointer}',
      '.ap-select-all input{width:15px;height:15px;cursor:pointer;accent-color:#b7a8d9}',
      '.ap-count-tag{font-size:12px;color:#b0aab8;font-weight:500}',
      '.ap-elegir{flex:0 0 auto;min-height:0;padding:0;border:0;background:none;color:#8a82a8;font:inherit;font-size:12.5px;font-weight:600;cursor:pointer;white-space:nowrap}',
      '.ap-elegir.activa{color:#6b63a0}',
      'body.dark .ap-elegir{background:none;color:#b7b3c9}',
      '.ap-letra{margin:22px 0 4px;padding:0;font-family:Georgia,"Times New Roman",serif;font-size:20px;font-weight:500;color:#b7a8d9;letter-spacing:.04em}',
      'body.dark .ap-letra{color:#9b8ec4}',
      '.ap-item{margin:0}',
      '.ap-row{display:flex;align-items:center;gap:12px;width:100%;box-sizing:border-box;padding:11px 0 12px;border:0;border-bottom:1px solid rgba(80,90,130,.08);border-radius:0;background:transparent;text-align:left;cursor:pointer}',
      'body.dark .ap-row{background:transparent;border-bottom-color:rgba(255,255,255,.06)}',
      '.ap-item.seleccionado .ap-row{background:transparent;border-bottom-color:rgba(183,168,217,.55)}',
      '.ap-item.abierto .ap-row{border-bottom-color:transparent}',
      '.ap-punto{width:7px;height:7px;margin-left:auto;flex:0 0 auto;border-radius:50%;background:#d4a017;box-shadow:0 0 0 3px rgba(212,160,23,.12)}',
      '.ap-punto.ap-punto-off{background:transparent;box-shadow:none}',
      '.ap-check-label{display:none;align-items:center;cursor:pointer;flex:0 0 auto;margin:6px 0 0;padding:0}',
      '.ap-modo .ap-check-label{display:inline-flex}',
      '.ap-check{width:16px;height:16px;cursor:pointer;accent-color:#b7a8d9}',
      '.ap-row .ap-quien{flex:1;min-width:0}',
      '.ap-row .ap-quien b{display:block;color:#2c2c34;font-size:16px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      'body.dark .ap-row .ap-quien b{color:#f0f0f5}',
      '.ap-row .ap-quien small{color:#9a9aa8;font-size:13px;font-weight:400;display:block;margin-top:2px}',
      '.ap-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}',
      '.ap-card-actions{display:flex;flex-wrap:wrap;align-items:center;gap:4px 16px;padding:0 0 14px 19px;border-bottom:1px solid rgba(80,90,130,.08)}',
      'body.dark .ap-card-actions{border-bottom-color:rgba(255,255,255,.06)}',
      '.ap-link{background:none;border:0;padding:0;font:inherit;font-size:13px;font-weight:500;cursor:pointer;color:#8a82a8;text-decoration:none}',
      '.ap-link.wa{color:#3d8f6a}',
      '.ap-link.pasar{color:#6b63a0}',
      '.ap-link.ver{color:#6b63a0}',
      '.ap-link.borrar{color:#c07878}',
      '.ap-link.call{color:#8a82a8}',
      '.ap-bulk-bar{position:sticky;bottom:14px;z-index:99;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 4px 10px 0;margin:18px 0 6px;border:0;border-top:1px solid rgba(80,90,130,.12);border-radius:0;background:rgba(252,250,247,.92);color:#2c2c34;backdrop-filter:blur(8px)}',
      'body.dark .ap-bulk-bar{background:rgba(18,16,28,.92);border-top-color:rgba(255,255,255,.1);color:#f2f0ea}',
      '.ap-bulk-info{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:500}',
      '.ap-bulk-badge{display:inline-grid;place-items:center;min-width:18px;height:18px;padding:0;border-radius:999px;background:#d4a017;color:#fff;font-size:11px;font-weight:700}',
      '.ap-bulk-actions{display:flex;align-items:center;gap:14px}',
      '.ap-bulk-btn{height:auto;padding:0;border:0;border-radius:0;background:none;font:inherit;font-size:13px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;color:#6b63a0}',
      '.ap-bulk-btn.pasar{background:none;color:#6b63a0;box-shadow:none}',
      '.ap-bulk-btn.borrar{background:none;color:#c07878;border:0}',
      '.ap-bulk-btn.cancelar{background:none;color:#9a9aa8;width:auto;padding:0;justify-content:center;font-size:13px}',
      '.ap-bulk-btn:disabled{opacity:.38;cursor:default;box-shadow:none}',
      '.ap-modo .ap-row{cursor:pointer;touch-action:manipulation}',
      '.ap-modo .ap-row,.ap-row.presionado{user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}',
      '.ap-row.presionado{opacity:.55}',
      '.ap-vacio{padding:28px 4px;border:0;text-align:left;color:#9a9aa8;font-size:14px;line-height:1.6}',
      '.ap-vacio .ico{display:none}',
      '.ap-aviso{margin:10px 0;padding:0;border:0;background:none;color:#8a5a08;font-size:12px;line-height:1.5}'
    ].join('\n');
    document.head.appendChild(st);
  }

  function switchHTML(){
    css();
    cargar();
    var nAppi = contactosAppi().length;
    var nMios = mios.filter(function(c){ return c.estado !== 'mergado'; }).length;
    var actual = (window.APPIGestion && window.APPIGestion.state && window.APPIGestion.state.agenda === 'personal') ? 'personal' : 'appi';
    return '<div class="agenda-switch" role="tablist">' +
      '<button type="button" role="tab" aria-selected="' + (actual === 'appi') + '" class="' + (actual === 'appi' ? 'activo' : '') + '" data-agenda-vista="appi">📇 AGENDA APPI (' + nAppi + ')</button>' +
      '<button type="button" role="tab" aria-selected="' + (actual === 'personal') + '" class="' + (actual === 'personal' ? 'activo' : '') + '" data-agenda-vista="personal">📱 AGENDA PERSONAL' + (nMios ? ' (' + nMios + ')' : '') + '</button>' +
      '</div>';
  }

  function filaHTML(c){
    var enPanel = enAppi(c.tel_norm);
    var telLlamar = digitos(c.telefono);
    var estaSeleccionado = seleccionados.has(c.id);
    var paraPasar = c.estado !== 'mergado' && !enPanel;
    var estado = c.estado === 'mergado' ? 'pasado' : (enPanel ? 'enappi' : 'nuevo');
    var sr = estado === 'pasado' ? 'En tu Agenda APPI' : (estado === 'enappi' ? 'Ya está en APPI' : 'Para pasar');
    var abierto = abiertoId === c.id && !modoSeleccion;
    var btnAppi = paraPasar
      ? '<button type="button" class="ap-link pasar" data-ap-pasar="' + esc(c.id) + '">Pasar a APPI</button>'
      : '<button type="button" class="ap-link ver" data-ap-ver="' + esc(c.id) + '">Ver en APPI</button>';
    var acciones = abierto
      ? ('<div class="ap-card-actions">' +
          '<button type="button" class="ap-link wa" data-ap-wa="' + esc(c.id) + '">WhatsApp</button>' +
          '<a href="tel:' + esc(telLlamar) + '" class="ap-link call" data-appi-call-phone="' + esc(telLlamar) + '" data-appi-call-name="' + esc(c.nombre) + '">Llamar</a>' +
          btnAppi +
          '<button type="button" class="ap-link borrar" data-ap-quitar="' + esc(c.id) + '">Quitar</button>' +
        '</div>')
      : '';
    return '<div class="ap-item' + (estaSeleccionado ? ' seleccionado' : '') + (abierto ? ' abierto' : '') + '" data-ap-id="' + esc(c.id) + '" data-ap-estado="' + estado + '">' +
      '<div class="ap-row">' +
        '<label class="ap-check-label" title="Seleccionar ' + esc(c.nombre || 'contacto') + '">' +
          '<input type="checkbox" class="ap-check" data-ap-select="' + esc(c.id) + '"' + (estaSeleccionado ? ' checked' : '') + ' aria-label="Seleccionar ' + esc(c.nombre) + '">' +
        '</label>' +
        '<div class="ap-quien"><b>' + esc(c.nombre || 'Sin nombre') + '</b><small>' + esc(c.telefono) + '</small><span class="ap-sr">' + sr + '</span></div>' +
        '<span class="ap-punto' + (paraPasar ? ' ap-punto-off' : '') + '" title="' + (paraPasar ? '' : 'Ya está en APPI') + '" aria-hidden="true"></span>' +
      '</div>' +
      acciones +
    '</div>';
  }

  function bulkBarHTML(){
    var n = seleccionados.size;
    // La barra también aparece con cero elegidos mientras el modo está
    // abierto: es la señal de que se puede seguir tocando filas.
    if (!n && !modoSeleccion) return '';
    var sinElegir = n === 0;
    var resumen = sinElegir
      ? 'Tocá los contactos que quieras'
      : (n === 1 ? 'elegido' : 'elegidos');
    return '<div class="ap-bulk-bar" id="apBulkBar">' +
      '<div class="ap-bulk-info"><span class="ap-bulk-badge">' + n + '</span><span>' + resumen + '</span></div>' +
      '<div class="ap-bulk-actions">' +
        '<button type="button" class="ap-bulk-btn pasar" id="apBulkPasar"' + (sinElegir ? ' disabled' : '') + '>Pasar a APPI (' + n + ')</button>' +
        '<button type="button" class="ap-bulk-btn borrar" id="apBulkQuitar"' + (sinElegir ? ' disabled' : '') + '>Quitar (' + n + ')</button>' +
        '<button type="button" class="ap-bulk-btn cancelar" id="apBulkCancelar" title="Cancelar selección" aria-label="Cancelar selección">✕</button>' +
      '</div>' +
    '</div>';
  }

  function html(){
    css();
    cargar();
    var q = busqueda.trim().toLowerCase();
    var listado = mios.filter(function(c){
      if (!q) return true;
      return (c.nombre || '').toLowerCase().includes(q) || (c.telefono || '').includes(q);
    });
    listado.sort(function(a, b){
      return String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es');
    });
    var paraPasar = mios.filter(function(c){ return c.estado !== 'mergado' && !enAppi(c.tel_norm); }).length;

    var todosVisiblesSeleccionados = listado.length > 0 && listado.every(function(c){ return seleccionados.has(c.id); });

    var salida = '';
    salida += '<input type="file" id="apVcfInput" accept=".vcf,text/vcard,text/directory" hidden>';
    var cuenta = mios.length + (mios.length === 1 ? ' contacto' : ' contactos');
    if (mios.length && paraPasar) cuenta += ' · ' + paraPasar + ' para pasar';
    salida += '<div class="ap-cabeza"><h3>Agenda personal</h3><small>' + cuenta + '</small></div>';
    if (!mios.length){
      salida += '<div class="ap-aviso">Si la subiste en el celular, tocá <b>Sincronizar dispositivo</b> acá (con internet).</div>';
    }
    salida += '<div class="ap-import">';
    salida += '<button type="button" class="otro" id="apOtroDispositivo">Sincronizar dispositivo</button>';
    salida += '<button type="button" class="ppal" id="apSubirVcf">Subir agenda</button>';
    salida += '<button type="button" class="guia" id="apGuia">Cómo saco la agenda</button>';
    salida += '</div>';
    if (mios.length){
      salida += '<input type="search" id="apBuscar" class="ap-buscar" placeholder="Buscar" value="' + esc(busqueda) + '">';
      salida += '<div class="ap-toolbar">' +
        '<label class="ap-select-all" title="Seleccionar todos los contactos">' +
          '<input type="checkbox" id="apSelectAll"' + (todosVisiblesSeleccionados ? ' checked' : '') + '> ' +
          '<span>' + (todosVisiblesSeleccionados ? 'Deseleccionar todos' : 'Seleccionar todos') + '</span>' +
        '</label>' +
        '<button type="button" id="apElegirVarios" class="ap-elegir' + (modoSeleccion ? ' activa' : '') + '"' +
          ' aria-pressed="' + (modoSeleccion ? 'true' : 'false') + '"' +
          ' title="Elegir varios contactos (o mantené presionado uno)">' +
          (modoSeleccion ? 'Listo' : 'Elegir varios') +
        '</button>' +
        '<span class="ap-count-tag">' + listado.length + (listado.length === 1 ? ' contacto' : ' contactos') + '</span>' +
      '</div>';
    }
    if (!mios.length){
      salida += '<div class="ap-vacio">Tu agenda personal todavía está vacía.<br>Subila una sola vez y queda guardada en tu cuenta.</div>';
    } else if (!listado.length){
      salida += '<div class="ap-vacio"><span class="ico">🔍</span>No hay contactos que coincidan con la búsqueda.</div>';
    } else {
      var grupos = '';
      var letraAnt = '';
      listado.forEach(function(c){
        var L = letraDe(c.nombre);
        if (L !== letraAnt){
          grupos += '<div class="ap-letra">' + L + '</div>';
          letraAnt = L;
        }
        grupos += filaHTML(c);
      });
      salida += '<div id="apLista"' + (modoSeleccion ? ' class="ap-modo"' : '') + '>' + grupos + '</div>';
      salida += bulkBarHTML();
    }
    return salida;
  }

  function repintarSiVisible(){
    if (window.APPIGestion && window.APPIGestion.state && window.APPIGestion.state.agenda === 'personal' &&
        window.APPIGestion.render && document.getElementById('gestionContent')){
      window.APPIGestion.render();
    }
  }

  function sincronizarSiPanelVisible(){
    var panel = document.getElementById('view-gestion');
    if (panel && panel.classList.contains('active') && navigator.onLine && autorizado()) sincronizar();
  }
  // También se revalida al volver a la PC: el teléfono puede haber subido
  // contactos mientras esta pestaña estaba en segundo plano.
  window.addEventListener('appi-auth-change', function(){
    if (uid() !== uidVisto) cargado = false;
    setTimeout(function(){
      if (navigator.onLine && autorizado()){
        sincronizar();
        pedirNubeCuenta();
      }
    }, 0);
  });
  window.addEventListener('appi-datasync-applied', function(){
    recargarDesdeCache();
  });
  window.addEventListener('focus', function(){ setTimeout(sincronizarSiPanelVisible, 0); });
  window.addEventListener('online', sincronizarSiPanelVisible);
  document.addEventListener('visibilitychange', function(){
    if (document.visibilityState === 'visible') sincronizarSiPanelVisible();
  });

  function bind(){
    // El switch de agendas (los botones viven arriba del panel).
    document.querySelectorAll('[data-agenda-vista]').forEach(function(b){
      b.onclick = function(){
        if (!window.APPIGestion || !window.APPIGestion.state) return;
        var vista = b.getAttribute('data-agenda-vista');
        window.APPIGestion.state.agenda = vista;
        try{ localStorage.setItem('appi_gestion_agenda_vista_' + uid(), vista); }catch(e){}
        // El cambio de solapa también es un punto de sincronización: la PC
        // descarga lo que se subió desde el celular aunque la agenda personal
        // haya quedado guardada en otra pestaña.
        if (vista === 'personal') cargar();
        window.APPIGestion.render();
        if (navigator.onLine && autorizado()) sincronizar();
      };
    });
    var otro = $('apOtroDispositivo');
    if (otro) otro.onclick = function(){ verEnOtroDispositivo(); };
    var subir = $('apSubirVcf');
    if (subir) subir.onclick = function(){ var inp = $('apVcfInput'); if (inp) inp.click(); };
    var guia = $('apGuia');
    if (guia) guia.onclick = function(){
      window.APPIDialog.alert(
        '📱 ANDROID\n' +
        'En contactos.google.com → Exportar → "vCard de iOS". Después volvé acá y tocá Subir agenda.\n\n' +
        '🍎 IPHONE (una sola vez, 2 minutos)\n' +
        '1. Abrí icloud.com en Safari y entrá a Contactos.\n' +
        '2. Tocá ⚙️ (abajo a la izquierda) → "Seleccionar todo".\n' +
        '3. ⚙️ de nuevo → "Exportar vCard": baja un archivo .vcf.\n' +
        '4. Volvé a APPI → Subir agenda → elegí ese archivo.\n\n' +
        'Después de la primera vez, la agenda queda en APPI: sólo subís de nuevo si cambiaron muchos números.',
        { title: 'Cómo pasar tu agenda', icon: '📥' }
      );
    };
    var input = $('apVcfInput');
    if (input){
      input.onchange = function(){
        var archivo = input.files && input.files[0];
        if (!archivo) return;
        leerArchivoVcf(archivo);
        input.value = '';
      };
    }
    var buscar = $('apBuscar');
    if (buscar){
      buscar.oninput = function(e){
        busqueda = e.target.value;
        var pos = e.target.selectionStart;
        repintarSiVisible();
        var nuevo = $('apBuscar');
        if (nuevo){ nuevo.focus(); try{ nuevo.setSelectionRange(pos, pos); }catch(err){} }
      };
    }

    // Seleccionar todos
    var selectAll = $('apSelectAll');
    if (selectAll){
      selectAll.onchange = function(){
        var q = busqueda.trim().toLowerCase();
        var visibles = mios.filter(function(c){
          if (!q) return true;
          return (c.nombre || '').toLowerCase().includes(q) || (c.telefono || '').includes(q);
        });
        if (selectAll.checked){
          visibles.forEach(function(c){ seleccionados.add(c.id); });
          modoSeleccion = true;
          abiertoId = null;
        } else {
          visibles.forEach(function(c){ seleccionados.delete(c.id); });
        }
        repintarSiVisible();
      };
    }

    // "Elegir varios" (v360): abre la barra flotante para elegir tocando las
    // filas. Si ya estaba abierta, la cierra y suelta todo.
    var elegirVarios = $('apElegirVarios');
    if (elegirVarios){
      elegirVarios.onclick = function(){
        if (modoSeleccion) cerrarSeleccion();
        else { modoSeleccion = true; abiertoId = null; repintarSiVisible(); }
      };
    }

    // Mantener presionado un contacto (medio segundo) lo elige y abre la
    // barra. Con el modo abierto alcanza con tocar la fila para elegir o
    // soltar. Los botones y el checkbox de la fila siguen haciendo lo suyo.
    protegerDelGestoLargo();
    document.querySelectorAll('#apLista .ap-item').forEach(function(item){
      var temporizador = null;
      var origen = null;

      function esControl(nodo){
        return !!(nodo && nodo.closest && nodo.closest('button, a, input, label, select, textarea'));
      }
      function cancelar(){
        if (temporizador){ clearTimeout(temporizador); temporizador = null; }
        origen = null;
      }

      item.addEventListener('pointerdown', function(e){
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (esControl(e.target)) return;
        origen = { x: e.clientX, y: e.clientY };
        temporizador = setTimeout(function(){
          temporizador = null;
          // cancelar() por movimiento o por soltar el dedo deja origen en null.
          if (!origen) return;
          var id = item.getAttribute('data-ap-id');
          var fila = item.querySelector('.ap-row');
          if (fila) fila.classList.add('presionado');
          gestoPresionado = { id: id, hasta: Date.now() };
          if (navigator.vibrate){ try{ navigator.vibrate(12); }catch(err){} }
          alternarSeleccion(id);
        }, PRESION_MS);
      });
      // Recorrer la lista no elige nada: si el dedo se corrió, no era un gesto.
      item.addEventListener('pointermove', function(e){
        if (!origen) return;
        if (Math.abs(e.clientX - origen.x) > MARGEN_MOVIMIENTO ||
            Math.abs(e.clientY - origen.y) > MARGEN_MOVIMIENTO) cancelar();
      });
      item.addEventListener('pointerup', cancelar);
      item.addEventListener('pointercancel', cancelar);
      item.addEventListener('pointerleave', cancelar);
      item.addEventListener('click', function(e){
        if (esControl(e.target)) return;
        var id = item.getAttribute('data-ap-id');
        if (modoSeleccion){
          alternarSeleccion(id);
          return;
        }
        abiertoId = abiertoId === id ? null : id;
        repintarSiVisible();
      });
    });

    // Selección individual
    document.querySelectorAll('[data-ap-select]').forEach(function(chk){
      chk.onchange = function(e){
        e.stopPropagation();
        var id = chk.getAttribute('data-ap-select');
        if (chk.checked) seleccionados.add(id);
        else seleccionados.delete(id);
        repintarSiVisible();
      };
    });

    // WhatsApp individual
    document.querySelectorAll('[data-ap-wa]').forEach(function(b){
      b.onclick = function(e){
        e.stopPropagation();
        abrirWa(b.getAttribute('data-ap-wa'));
      };
    });

    // Pasar a APPI individual
    document.querySelectorAll('[data-ap-pasar]').forEach(function(b){
      b.onclick = function(e){
        e.stopPropagation();
        pasarApapi(b.getAttribute('data-ap-pasar'));
      };
    });

    // Quitar individual
    document.querySelectorAll('[data-ap-quitar]').forEach(function(b){
      b.onclick = function(e){
        e.stopPropagation();
        quitar(b.getAttribute('data-ap-quitar'));
      };
    });

    // Ver en APPI
    document.querySelectorAll('[data-ap-ver]').forEach(function(b){
      b.onclick = function(e){
        e.stopPropagation();
        cargar();
        var c = mios.find(function(x){ return x.id === b.getAttribute('data-ap-ver'); });
        var destino = c ? (c.contacto_id || (enAppi(c.tel_norm) || {}).id) : null;
        if (c && c.estado !== 'mergado') marcarMerlado(c, destino);
        verEnAppi(destino);
      };
    });

    // Acciones masivas
    var bulkPasar = $('apBulkPasar');
    if (bulkPasar) bulkPasar.onclick = function(){ pasarSeleccionados(); };

    var bulkQuitar = $('apBulkQuitar');
    if (bulkQuitar) bulkQuitar.onclick = function(){ quitarSeleccionados(); };

    var bulkCancelar = $('apBulkCancelar');
    if (bulkCancelar) bulkCancelar.onclick = function(){ cerrarSeleccion(); };
  }

  window.APPIAgendaPersonal = {
    switchHTML: switchHTML,
    html: html,
    bind: bind,
    sincronizar: sincronizar,
    traerDeLaNube: pedirNubeCuenta,
    parsearVcard: parsearVcard,
    importarLista: importarLista,
    lista: function(){ cargar(); return mios; },
    pasarApapi: pasarApapi,
    pasarSeleccionados: pasarSeleccionados,
    quitar: quitar,
    quitarSeleccionados: quitarSeleccionados,
    abrirWa: abrirWa,
    seleccionados: function(){ return Array.from(seleccionados); },
    alternarSeleccion: alternarSeleccion,
    modoSeleccion: function(){ return modoSeleccion; },
    _mejorTelefono: mejorTelefono
  };
})();
