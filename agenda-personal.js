/* ============================================================
   APPI · Agenda personal (v357)
   ------------------------------------------------------------
   Solapa del Panel de Contactos con dos agendas:

     📇 AGENDA APPI      · la que ya existía (Hoy / Todos /
                          Resultados), sin cambios.
     📱 AGENDA PERSONAL  · los contactos del teléfono del
                          distribuidor, subidos con el selector
                          nativo (Android) o un archivo .vcf
                          (Android e iPhone). Cada contacto se
                          puede "pasar a APPI" uno por uno: entra
                          como contacto nuevo del embudo.

   La agenda vive en este teléfono y se sincroniza con la tabla
   appi_agenda_personal de la cuenta (SUPABASE_AGENDA_PERSONAL.sql).
   Si la tabla todavía no existe, todo funciona igual en local y
   se avisa que falta el paso de la base.
   ============================================================ */
(function(){
'use strict';

  var MAX_IMPORT = 1500;

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

  var mios = [];          // {id, nombre, telefono, tel_norm, estado:'nuevo'|'mergado', contacto_id, origen, created_at, updated_at}
  var busqueda = '';
  var sinTabla = false;   // falta correr SUPABASE_AGENDA_PERSONAL.sql
  var cargado = false;
  var sincronizando = false;

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
  // sincronizar, no se mandan las dos.
  function encolar(accion){
    var cola = leerCola().filter(function(it){ return it.t !== accion.t; });
    cola.push(accion);
    guardarCola(cola);
  }

  function cargar(){
    if (!cargado && uid()){
      mios = leerCache();
      cargado = true;
    }
    return mios;
  }

  /* ---------- sincronización (espejo de la tabla) ---------- */

  function filaDe(c){
    return {
      nombre: String(c.nombre || '').slice(0, 120),
      telefono: String(c.telefono || '').slice(0, 30),
      telefono_normalizado: c.tel_norm,
      estado: c.estado === 'mergado' ? 'mergado' : 'nuevo',
      contacto_id: c.contacto_id || null,
      origen: c.origen || 'manual'
    };
  }
  async function subirFila(c){
    await cloudFetch('/rest/v1/appi_agenda_personal?on_conflict=user_id,telefono_normalizado', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(filaDe(c))
    });
  }
  async function borrarFila(telNorm){
    await cloudFetch('/rest/v1/appi_agenda_personal?telefono_normalizado=eq.' + encodeURIComponent(telNorm), {
      method: 'DELETE',
      headers: { Prefer: 'return=minimal' }
    });
  }
  async function vaciarCola(){
    var cola = leerCola();
    while (cola.length){
      var it = cola[0];
      if (it.a === 'up') await subirFila(it.p);
      else await borrarFila(it.t);
      cola.shift();
      guardarCola(cola);
    }
  }
  function falloDeTabla(error){
    var texto = String(error && error.message || '') + ' ' + String(error && error.status || '');
    return /appi_agenda_personal|42P01|PGRST204|does not exist|Could not find|404/.test(texto);
  }
  async function sincronizar(){
    if (!autorizado() || sincronizando) return;
    sincronizando = true;
    try{
      await vaciarCola();
      sinTabla = false;
      var filas = await cloudFetch('/rest/v1/appi_agenda_personal?select=nombre,telefono,telefono_normalizado,estado,contacto_id,origen,created_at&order=created_at.asc&limit=5000');
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
        if (!enLaNube[mios[i].tel_norm]) encolar({ a: 'up', t: mios[i].tel_norm, p: filaDe(mios[i]) });
      }
      guardar();
      await vaciarCola();
    }catch(error){
      if (falloDeTabla(error)) sinTabla = true;
      else if (!(error && error.network)) console.warn('Agenda personal: no se pudo sincronizar', error);
    }finally{
      sincronizando = false;
      repintarSiVisible();
    }
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
      // La cola ya quedó ordenada; si hay internet sale ahora mismo.
      if (navigator.onLine) sincronizar();
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
        notas: 'Traído de la agenda del teléfono (v357).'
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

  function marcarMerlado(c, contactoId){
    c.estado = 'mergado';
    c.contacto_id = contactoId || c.contacto_id || null;
    guardar();
    encolar({ a: 'up', t: c.tel_norm, p: filaDe(c) });
    if (navigator.onLine) sincronizar();
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
    guardar();
    encolar({ a: 'del', t: c.tel_norm });
    if (navigator.onLine) sincronizar(); else repintarSiVisible();
    toast('Contacto quitado de tu agenda personal');
  }

  /* ---------- vista ---------- */

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
      '.ap-import{display:grid;gap:8px;margin:12px 0}',
      '.ap-import button{width:100%;min-height:46px;border:0;border-radius:13px;font:inherit;font-size:13px;font-weight:850;cursor:pointer}',
      '.ap-import .ppal{background:linear-gradient(135deg,#25d366,#128c7e);color:#fff}',
      '.ap-import .sec{background:rgba(91,141,239,.1);color:#3d63c9}',
      '.ap-import .guia{background:none;border:1px dashed rgba(80,90,130,.3);border-radius:13px;color:#858692;font-weight:700;font-size:12px}',
      '.ap-buscar{width:100%;min-height:42px;margin:10px 0;padding:8px 13px;border:1px solid rgba(80,90,130,.15);border-radius:12px;background:#f8f9ff;font:inherit;font-size:13px;outline:none;box-sizing:border-box}',
      'body.dark .ap-buscar{background:#1d1f31;border-color:rgba(255,255,255,.1);color:#f2f2f7}',
      '.ap-item{margin-bottom:8px}',
      '.ap-row{display:flex;align-items:center;gap:11px;width:100%;box-sizing:border-box;padding:12px 13px;border:1px solid rgba(80,90,130,.1);border-radius:15px;background:#fff;text-align:left}',
      'body.dark .ap-row{background:rgba(30,30,50,.58);border-color:rgba(255,255,255,.08)}',
      '.ap-row .ap-ava{width:38px;height:38px;flex:0 0 auto;border-radius:50%;display:grid;place-items:center;background:rgba(91,141,239,.12);color:#3d63c9;font-weight:900;font-size:15px}',
      '.ap-row .ap-quien{flex:1;min-width:0}',
      '.ap-row .ap-quien b{display:block;color:#30303d;font-size:13.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      'body.dark .ap-row .ap-quien b{color:#f0f0f5}',
      '.ap-row .ap-quien small{color:#858692;font-size:11.5px;display:block;margin-top:2px}',
      '.ap-chip{flex:0 0 auto;font-size:10.5px;font-weight:850;padding:5px 9px;border-radius:999px;white-space:nowrap}',
      '.ap-chip.nuevo{background:rgba(37,211,102,.14);color:#128c55}',
      '.ap-chip.enappi{background:rgba(91,141,239,.14);color:#3d63c9}',
      '.ap-chip.pasado{background:rgba(58,208,164,.16);color:#1f8f70}',
      '.ap-acciones{display:grid;grid-template-columns:1fr 44px;gap:8px;margin-top:9px}',
      '.ap-acciones .pasar{min-height:40px;border:0;border-radius:11px;background:linear-gradient(135deg,#25d366,#128c7e);color:#fff;font:inherit;font-size:12.5px;font-weight:850;cursor:pointer}',
      '.ap-acciones .ver{min-height:40px;border:0;border-radius:11px;background:rgba(91,141,239,.12);color:#3d63c9;font:inherit;font-size:12.5px;font-weight:850;cursor:pointer}',
      '.ap-acciones .borrar{min-height:40px;border:0;border-radius:11px;background:rgba(80,90,130,.08);color:#858692;font-size:15px;cursor:pointer}',
      '.ap-vacio{padding:26px 14px;border:1px dashed rgba(80,90,130,.25);border-radius:16px;text-align:center;color:#858692;font-size:12.5px;line-height:1.6}',
      '.ap-vacio .ico{font-size:30px;display:block;margin-bottom:8px}',
      '.ap-aviso{margin:10px 0;padding:10px 12px;border-radius:12px;background:rgba(245,166,35,.12);color:#8a5a08;font-size:11.5px;line-height:1.5}'
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
    var inicial = (c.nombre || '?').trim().charAt(0).toUpperCase() || '?';
    var enPanel = enAppi(c.tel_norm);
    var chip, acciones;
    if (c.estado === 'mergado'){
      chip = '<span class="ap-chip pasado">✓ En tu Agenda APPI</span>';
      acciones = '<div class="ap-acciones"><button type="button" class="ver" data-ap-ver="' + esc(c.id) + '">Ver en APPI</button><button type="button" class="borrar" data-ap-quitar="' + esc(c.id) + '" aria-label="Quitar">🗑️</button></div>';
    } else if (enPanel){
      chip = '<span class="ap-chip enappi">📇 Ya está en APPI</span>';
      acciones = '<div class="ap-acciones"><button type="button" class="ver" data-ap-ver="' + esc(c.id) + '">Ver en APPI</button><button type="button" class="borrar" data-ap-quitar="' + esc(c.id) + '" aria-label="Quitar">🗑️</button></div>';
    } else {
      chip = '<span class="ap-chip nuevo">🆕 Para pasar</span>';
      acciones = '<div class="ap-acciones"><button type="button" class="pasar" data-ap-pasar="' + esc(c.id) + '">→ Pasar a Agenda APPI</button><button type="button" class="borrar" data-ap-quitar="' + esc(c.id) + '" aria-label="Quitar">🗑️</button></div>';
    }
    return '<div class="ap-item" data-ap-id="' + esc(c.id) + '">' +
      '<div class="ap-row">' +
      '<span class="ap-ava">' + esc(inicial) + '</span>' +
      '<span class="ap-quien"><b>' + esc(c.nombre || 'Sin nombre') + '</b><small>📱 ' + esc(c.telefono) + '</small></span>' +
      chip + '</div>' + acciones + '</div>';
  }

  function html(){
    css();
    cargar();
    var q = busqueda.trim().toLowerCase();
    var listado = mios.filter(function(c){
      if (!q) return true;
      return (c.nombre || '').toLowerCase().includes(q) || (c.telefono || '').includes(q);
    });
    // Para pasar primero, después los que ya están vinculados.
    listado.sort(function(a, b){
      var pa = a.estado === 'mergado' || enAppi(a.tel_norm) ? 1 : 0;
      var pb = b.estado === 'mergado' || enAppi(b.tel_norm) ? 1 : 0;
      if (pa !== pb) return pa - pb;
      return String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es');
    });
    var paraPasar = mios.filter(function(c){ return c.estado !== 'mergado' && !enAppi(c.tel_norm); }).length;
    var pickerDisponible = !!(navigator.contacts && typeof navigator.contacts.select === 'function');

    var salida = '';
    salida += '<input type="file" id="apVcfInput" accept=".vcf,text/vcard,text/directory" hidden>';
    salida += '<div class="gestion-section-title" style="margin-top:8px"><h3>Tu agenda del teléfono</h3><small>' + mios.length + ' contacto' + (mios.length === 1 ? '' : 's') + '</small></div>';
    if (sinTabla){
      salida += '<div class="ap-aviso"><b>La sincronización está esperando un paso en la base.</b> Tu agenda vive segura en este teléfono; para que también viva en tu cuenta (y no se pierda al cambiar de celular) hay que ejecutar <b>SUPABASE_AGENDA_PERSONAL.sql</b> una sola vez en Supabase.</div>';
    }
    salida += '<div class="ap-import">';
    if (pickerDisponible) salida += '<button type="button" class="ppal" id="apElegirTel">📱 Elegir del teléfono</button>';
    salida += '<button type="button" class="' + (pickerDisponible ? 'sec' : 'ppal') + '" id="apSubirVcf">📂 Subir agenda (.vcf)</button>';
    salida += '<button type="button" class="guia" id="apGuia">❓ ¿Cómo saco la agenda de mi teléfono?</button>';
    salida += '</div>';
    if (mios.length){
      salida += '<div class="gestion-stats"><div class="gestion-stat"><span>🆕</span><b>' + paraPasar + '</b><small>Para pasar</small></div><div class="gestion-stat"><span>📇</span><b>' + (mios.length - paraPasar) + '</b><small>En APPI</small></div><div class="gestion-stat"><span>📱</span><b>' + mios.length + '</b><small>Total</small></div></div>';
      salida += '<input type="search" id="apBuscar" class="ap-buscar" placeholder="Buscar por nombre o teléfono…" value="' + esc(busqueda) + '">';
    }
    if (!mios.length){
      salida += '<div class="ap-vacio"><span class="ico">📱</span><b>Tu agenda personal todavía está vacía.</b><br>Subila una sola vez y queda guardada en tu cuenta: después vas pasando de a uno los que quieras trabajar con APPI.</div>';
    } else if (!listado.length){
      salida += '<div class="ap-vacio"><span class="ico">🔍</span>No hay contactos que coincidan con la búsqueda.</div>';
    } else {
      salida += '<div id="apLista">' + listado.map(filaHTML).join('') + '</div>';
    }
    return salida;
  }

  function repintarSiVisible(){
    if (window.APPIGestion && window.APPIGestion.state && window.APPIGestion.state.agenda === 'personal' &&
        window.APPIGestion.render && document.getElementById('gestionContent')){
      window.APPIGestion.render();
    }
  }

  function bind(){
    // El switch de agendas (los botones viven arriba del panel).
    document.querySelectorAll('[data-agenda-vista]').forEach(function(b){
      b.onclick = function(){
        if (!window.APPIGestion || !window.APPIGestion.state) return;
        var vista = b.getAttribute('data-agenda-vista');
        window.APPIGestion.state.agenda = vista;
        try{ localStorage.setItem('appi_gestion_agenda_vista_' + uid(), vista); }catch(e){}
        if (vista === 'personal'){
          cargar();
          if (navigator.onLine && autorizado()) sincronizar();
        }
        window.APPIGestion.render();
      };
    });
    var elegir = $('apElegirTel');
    if (elegir) elegir.onclick = function(){ elegirDelTelefono(); };
    var subir = $('apSubirVcf');
    if (subir) subir.onclick = function(){ var inp = $('apVcfInput'); if (inp) inp.click(); };
    var guia = $('apGuia');
    if (guia) guia.onclick = function(){
      window.APPIDialog.alert(
        '📱 ANDROID (la vía corta)\n' +
        '1. Elegí "Elegir del teléfono" y marcá los contactos: no hace falta archivo.\n' +
        '2. Si preferís el archivo: contactos.google.com → Exportar → "vCard de iOS" → volvé acá y subilo.\n\n' +
        '🍎 IPHONE (una sola vez, 2 minutos)\n' +
        '1. Abrí icloud.com en Safari y entrá a Contactos.\n' +
        '2. Tocá ⚙️ (abajo a la izquierda) → "Seleccionar todo".\n' +
        '3. ⚙️ de nuevo → "Exportar vCard": baja un archivo .vcf.\n' +
        '4. Volvé a APPI → "Subir agenda (.vcf)" → elegí ese archivo.\n\n' +
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
    document.querySelectorAll('[data-ap-pasar]').forEach(function(b){
      b.onclick = function(){ pasarApapi(b.getAttribute('data-ap-pasar')); };
    });
    document.querySelectorAll('[data-ap-quitar]').forEach(function(b){
      b.onclick = function(){ quitar(b.getAttribute('data-ap-quitar')); };
    });
    document.querySelectorAll('[data-ap-ver]').forEach(function(b){
      b.onclick = function(){
        cargar();
        var c = mios.find(function(x){ return x.id === b.getAttribute('data-ap-ver'); });
        var destino = c ? (c.contacto_id || (enAppi(c.tel_norm) || {}).id) : null;
        if (c && c.estado !== 'mergado') marcarMerlado(c, destino);
        verEnAppi(destino);
      };
    });
  }

  window.APPIAgendaPersonal = {
    switchHTML: switchHTML,
    html: html,
    bind: bind,
    sincronizar: sincronizar,
    parsearVcard: parsearVcard,
    importarLista: importarLista,
    lista: function(){ cargar(); return mios; },
    pasarApapi: pasarApapi,
    quitar: quitar,
    _mejorTelefono: mejorTelefono
  };
})();
