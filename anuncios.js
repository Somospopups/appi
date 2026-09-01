/* ============================================================
   APPI · Anuncios del administrador (v326)
   ------------------------------------------------------------
   El administrador escribe un mensaje en el panel (reuniones
   por Zoom, avisos del equipo) y les aparece a todos los
   distribuidores como cartel al abrir APPI.

   - El aviso vigente vive en la tabla appi_anuncios (Supabase)
     y se lee con la sesión de cada distribuidor.
   - Si no hay conexión, se usa el último aviso guardado en el
     dispositivo: el mensaje no se pierde en la calle.
   - Cada reunión del aviso trae dos botones: agendarla en el
     calendario de APPI (offline, al instante) o en la agenda
     del teléfono (Google Calendar / archivo .ics en iPhone).
   - La 🔔 de la esquina vuelve a mostrar el aviso vigente; el
     puntito avisa cuando hay uno nuevo sin leer.
   - La cuenta administradora no recibe carteles ni campanita:
     el aviso lo escribe ella.
   ============================================================ */
(function(){
  'use strict';

  var MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  var DIAS = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];

  var ACTUAL = null;      // aviso vigente ya normalizado
  var ABierto = false;

  /* ---------- utilidades ---------- */
  function uid(){
    return window.APPIAuth && window.APPIAuth.userId ? window.APPIAuth.userId() : '';
  }
  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function p2(n){ return String(n).padStart(2, '0'); }

  function vistoKey(){ return 'appi_anuncio_visto_' + uid(); }
  function cacheKey(){ return 'appi_anuncio_cache_' + uid(); }
  function agendadoKey(){ return 'appi_anuncio_agendado_' + uid(); }

  function vistoId(){
    try{ return localStorage.getItem(vistoKey()) || ''; }catch(e){ return ''; }
  }
  function marcarVisto(id){
    try{ localStorage.setItem(vistoKey(), String(id || '')); }catch(e){}
  }
  function leerCache(){
    try{
      var raw = JSON.parse(localStorage.getItem(cacheKey()) || 'null');
      return raw && typeof raw === 'object' ? raw : null;
    }catch(e){ return null; }
  }
  function guardarCache(a){
    try{ localStorage.setItem(cacheKey(), JSON.stringify(a)); }catch(e){}
  }
  function limpiarCache(){
    try{ localStorage.removeItem(cacheKey()); }catch(e){}
  }

  function agendados(){
    try{ return JSON.parse(localStorage.getItem(agendadoKey()) || '{}'); }catch(e){ return {}; }
  }
  function marcarAgendado(anuncioId, indice){
    var d = agendados();
    if (!Array.isArray(d[anuncioId])) d[anuncioId] = [];
    if (d[anuncioId].indexOf(indice) === -1) d[anuncioId].push(indice);
    try{ localStorage.setItem(agendadoKey(), JSON.stringify(d)); }catch(e){}
  }

  function toast(msg){
    if (typeof window.showToast === 'function') window.showToast(msg);
  }

  /* ---------- sesión ---------- */
  function sesion(){
    var A = window.APPIAuth;
    if (!A || typeof A.userId !== 'function' || !A.userId()) return null;
    var p = typeof A.currentProfile === 'function' ? A.currentProfile() : null;
    return p || {};
  }
  function esAdmin(){
    var p = sesion();
    return !!(p && p.rol === 'admin');
  }

  /* ---------- datos ---------- */
  function cfg(){ return window.APPI_AUTH || {}; }

  function eventoValido(ev){
    if (!ev || typeof ev !== 'object') return false;
    if (!String(ev.titulo || '').trim()) return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(ev.fecha || ''))) return false;
    if (ev.hora && !/^\d{2}:\d{2}$/.test(String(ev.hora))) return false;
    return true;
  }

  function normalizar(row){
    if (!row || typeof row !== 'object') return null;
    var evs = [];
    if (Array.isArray(row.eventos)){
      row.eventos.forEach(function(ev){
        if (eventoValido(ev)){
          evs.push({
            titulo: String(ev.titulo).trim().slice(0, 80),
            fecha: String(ev.fecha),
            hora: /^\d{2}:\d{2}$/.test(String(ev.hora || '')) ? String(ev.hora) : '',
            lugar: String(ev.lugar || '').trim().slice(0, 200)
          });
        }
      });
    }
    return {
      id: String(row.id || ''),
      texto: String(row.texto || '').trim(),
      eventos: evs.slice(0, 4),
      creado_en: String(row.creado_en || '')
    };
  }

  async function pedirAnuncio(){
    var c = cfg();
    if (!c.url || !c.anonKey) return null;
    var token = '';
    try{ token = window.APPIAuth.accessToken() || c.anonKey; }catch(e){ token = c.anonKey; }
    var url = String(c.url).replace(/\/$/, '') +
      '/rest/v1/appi_anuncios?select=*&activo=eq.true&order=creado_en.desc&limit=1';
    var res = await fetch(url, {
      headers: { apikey: c.anonKey, Authorization: 'Bearer ' + token }
    });
    if (!res.ok) throw new Error('anuncio_no_disponible');
    var rows = await res.json();
    return Array.isArray(rows) && rows.length ? normalizar(rows[0]) : null;
  }

  /* ---------- fechas lindas ---------- */
  function fechaLinda(iso){
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
    if (!m) return '';
    var d = new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
    if (isNaN(d.getTime())) return '';
    return DIAS[d.getDay()] + ' ' + d.getDate() + ' de ' + MESES[d.getMonth()];
  }
  function fechaCorta(iso){
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
    if (!m) return '';
    var d = new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
    if (isNaN(d.getTime())) return '';
    return DIAS[d.getDay()].slice(0, 3) + ' ' + d.getDate() + '/' + p2(d.getMonth() + 1);
  }

  /* ---------- agenda del teléfono ---------- */
  function fechasGoogle(ev){
    var d = String(ev.fecha || '').replace(/-/g, '');
    if (/^\d{2}:\d{2}$/.test(ev.hora || '')){
      var hm = ev.hora.split(':');
      var h = Math.min(23, parseInt(hm[0], 10));
      var m = parseInt(hm[1], 10);
      var hFin = h + 1; // una hora de reunión, como mínimo razonable
      var fin = hFin > 23 ? '235900' : p2(hFin) + p2(m) + '00';
      return d + 'T' + p2(h) + p2(m) + '00/' + d + 'T' + fin;
    }
    // Sin hora: día completo. Google pide el día siguiente como fin.
    var base = new Date(ev.fecha + 'T12:00:00');
    var manana = new Date(base.getTime() + 86400000);
    return d + '/' +
      manana.getFullYear() + p2(manana.getMonth() + 1) + p2(manana.getDate());
  }

  function enlaceGoogle(ev, textoAnuncio){
    var u = 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      '&text=' + encodeURIComponent(ev.titulo) +
      '&dates=' + fechasGoogle(ev);
    if (ev.lugar) u += '&location=' + encodeURIComponent(ev.lugar);
    var detalle = 'Anuncio de administración · APPI';
    if (textoAnuncio) detalle += ':\n' + textoAnuncio.slice(0, 300);
    u += '&details=' + encodeURIComponent(detalle);
    u += '&ctz=America/Argentina/Buenos_Aires';
    return u;
  }

  function icsEvento(an, ev, indice){
    var d = String(ev.fecha || '').replace(/-/g, '');
    var lineas = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//APPI//Anuncios//ES',
      'BEGIN:VEVENT',
      'UID:appi-anuncio-' + String(an && an.id || 'x') + '-' + indice + '@somospopups',
      'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z'
    ];
    if (/^\d{2}:\d{2}$/.test(ev.hora || '')){
      var hm = ev.hora.split(':');
      var h = Math.min(23, parseInt(hm[0], 10));
      var m = parseInt(hm[1], 10);
      var hFin = h + 1; // una hora de reunión
      var fin = hFin > 23 ? d + 'T235900' : d + 'T' + p2(hFin) + p2(m) + '00';
      lineas.push('DTSTART:' + d + 'T' + p2(h) + p2(m) + '00');
      lineas.push('DTEND:' + fin);
    } else {
      // Día completo: el fin es el día siguiente.
      var base = new Date(ev.fecha + 'T12:00:00');
      var manana = new Date(base.getTime() + 86400000);
      var dSig = manana.getFullYear() + p2(manana.getMonth() + 1) + p2(manana.getDate());
      lineas.push('DTSTART;VALUE=DATE:' + d);
      lineas.push('DTEND;VALUE=DATE:' + dSig);
    }
    lineas.push('SUMMARY:' + ev.titulo);
    if (ev.lugar) lineas.push('LOCATION:' + ev.lugar.replace(/\r?\n/g, ' '));
    if (an && an.texto) lineas.push('DESCRIPTION:' + an.texto.slice(0, 300).replace(/\r?\n/g, '\\n'));
    lineas.push('END:VEVENT', 'END:VCALENDAR');
    return lineas.join('\r\n');
  }

  function descargarIcs(an, ev, indice){
    try{
      var blob = new Blob([icsEvento(an, ev, indice)], { type: 'text/calendar;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'reunion-appi.ics';
      document.body.appendChild(a);
      a.click();
      setTimeout(function(){
        a.remove();
        URL.revokeObjectURL(url);
      }, 800);
      toast('Se abrió la agenda del teléfono 📲');
    }catch(e){ toast('No se pudo abrir la agenda del teléfono'); }
  }

  function enTelefono(an, ev, indice){
    var ua = navigator.userAgent || '';
    if (/iPad|iPhone|iPod/.test(ua)){
      descargarIcs(an, ev, indice);
    } else if (typeof window.open === 'function'){
      // En Android abre Google Calendar (o la app que esté); en PC, la web.
      window.open(enlaceGoogle(ev, an && an.texto), '_blank');
    }
  }

  /* ---------- agendar en APPI ---------- */
  function enAppi(an, ev, indice, btn){
    if (!window.APPICalendario || typeof window.APPICalendario.agregar !== 'function'){
      toast('El calendario todavía no está disponible');
      return;
    }
    var texto = '📣 ' + ev.titulo + (ev.lugar ? ' · ' + ev.lugar : '');
    window.APPICalendario.agregar(ev.fecha, texto, ev.hora || '');
    marcarAgendado(an.id, indice);
    if (btn){ btn.textContent = '✓ Agendado en APPI'; btn.disabled = true; }
    toast('Agendado en el calendario de APPI ✓');
  }

  /* ---------- estilos y cartel ---------- */
  function estilos(){
    var viejo = document.getElementById('anEstilos');
    if (viejo) viejo.remove();
    var st = document.createElement('style');
    st.id = 'anEstilos';
    st.textContent = [
      '.an-ov{position:fixed;inset:0;z-index:32000;display:none;align-items:center;justify-content:center;',
      'padding:18px;background:rgba(13,18,42,.52);backdrop-filter:blur(6px)}',
      '.an-ov.open{display:flex}',
      '.an-pop{width:min(430px,100%);max-height:86vh;overflow:auto;border-radius:22px;padding:18px 18px 16px;',
      'background:linear-gradient(160deg,#eff5ff,#fff6f9);box-shadow:0 24px 60px rgba(24,29,71,.35)}',
      '.an-head{display:flex;align-items:center;gap:11px}',
      '.an-head .an-ico{width:44px;height:44px;flex:0 0 auto;display:grid;place-items:center;border-radius:14px;',
      'font-size:22px;background:linear-gradient(135deg,#5b8def,#a06bff);box-shadow:0 8px 20px rgba(91,141,239,.35)}',
      '.an-head b{display:block;color:#292938;font-size:16px;line-height:1.2}',
      '.an-head small{display:block;margin-top:3px;color:#777887;font-size:11px}',
      '.an-x{margin-left:auto;width:40px;height:40px;border:0;border-radius:13px;background:rgba(91,141,239,.11);',
      'color:#3d63c9;font-size:16px;font-weight:900;cursor:pointer}',
      '.an-txt{margin-top:14px;padding:14px 15px;border-radius:16px;background:rgba(255,255,255,.85);',
      'color:#33333f;font-size:14px;line-height:1.6;white-space:pre-wrap;word-break:break-word}',
      '.an-ev{margin-top:11px;padding:13px 14px;border:1px solid rgba(91,141,239,.22);border-radius:16px;',
      'background:rgba(91,141,239,.07)}',
      '.an-ev b{display:block;color:#2e3040;font-size:13.5px;line-height:1.35}',
      '.an-ev-meta{display:flex;flex-wrap:wrap;gap:6px;margin-top:7px}',
      '.an-ev-meta i{font-style:normal;font-size:10.5px;font-weight:850;padding:4px 9px;border-radius:999px;',
      'background:rgba(91,141,239,.13);color:#3d63c9;word-break:break-all}',
      '.an-ev-meta i.a{background:rgba(58,208,164,.15);color:#178a6c}',
      '.an-ev-b{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:11px}',
      '.an-b{min-height:46px;border:0;border-radius:13px;font:inherit;font-size:11.5px;font-weight:850;cursor:pointer;',
      'line-height:1.25;padding:6px}',
      '.an-b:disabled{cursor:default;opacity:.85}',
      '.an-b-appi{background:linear-gradient(135deg,#5b8def,#a06bff);color:#fff;box-shadow:0 7px 16px rgba(91,141,239,.3)}',
      '.an-b-tel{background:rgba(255,255,255,.9);color:#3d63c9;border:1.5px solid rgba(91,141,239,.35)}',
      '.an-ok{width:100%;min-height:52px;margin-top:14px;border:0;border-radius:15px;font:inherit;font-size:14px;',
      'font-weight:850;cursor:pointer;color:#178a6c;background:rgba(58,208,164,.16);box-shadow:0 7px 18px rgba(58,208,164,.2)}',
      '.an-tip{margin-top:10px;text-align:center;color:#8d8fa0;font-size:10.5px}',
      'body.dark .an-pop{background:linear-gradient(160deg,#141b33,#231a35)}',
      'body.dark .an-head b{color:#f0f1f8}',
      'body.dark .an-head small,body.dark .an-tip{color:#a9a9b8}',
      'body.dark .an-txt{background:rgba(255,255,255,.07);color:#e8e9f2}',
      'body.dark .an-ev{background:rgba(91,141,239,.13);border-color:rgba(91,141,239,.3)}',
      'body.dark .an-ev b{color:#f0f1f8}',
      'body.dark .an-b-tel{background:rgba(255,255,255,.08);color:#bcd0ff}',
      /* campanita */
      '#anBell{position:fixed;top:calc(12px + env(safe-area-inset-top));right:104px;z-index:9000;width:42px;height:42px;',
      'border:0;border-radius:50%;background:linear-gradient(135deg,#5b8def,#a06bff);color:#fff;font-size:18px;',
      'cursor:pointer;box-shadow:0 8px 20px rgba(91,141,239,.4);display:none;place-items:center}',
      '#anBell.on{display:grid}',
      '#anBell i{position:absolute;top:-2px;right:-2px;width:12px;height:12px;border-radius:50%;display:none;',
      'background:#ff5b5b;box-shadow:0 0 0 2.5px #fff;font-style:normal}',
      '#anBell.nuevo i{display:block;animation:anPulse 1.6s infinite}',
      '@keyframes anPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.35)}}',
      'body.dark #anBell i{box-shadow:0 0 0 2.5px #1b2238}'
    ].join('');
    document.head.appendChild(st);
  }

  function overlayCartel(){
    var ov = document.getElementById('anPop');
    if (ov) return ov;
    ov = document.createElement('div');
    ov.id = 'anPop';
    ov.className = 'an-ov';
    ov.addEventListener('click', function(e){ if (e.target === ov) cerrar(); });
    document.body.appendChild(ov);
    return ov;
  }

  function pintarCartel(an){
    var ov = overlayCartel();
    var hechos = agendados()[an.id] || [];
    var html = '<div class="an-pop">';
    html += '<div class="an-head"><span class="an-ico">📣</span><div><b>Anuncio de administración</b>' +
            '<small>' + (fechaLinda(an.creado_en) || 'APPI') + '</small></div>' +
            '<button type="button" class="an-x" id="anCerrar" aria-label="Cerrar">✕</button></div>';
    if (an.texto) html += '<div class="an-txt">' + esc(an.texto) + '</div>';
    if (an.eventos.length){
      html += '<div class="an-evs">';
      an.eventos.forEach(function(ev, i){
        var hecho = hechos.indexOf(i) !== -1;
        html += '<div class="an-ev"><b>' + esc(ev.titulo) + '</b><div class="an-ev-meta">';
        html += '<i class="a">📅 ' + esc(fechaCorta(ev.fecha)) + '</i>';
        if (ev.hora) html += '<i class="a">⏰ ' + esc(ev.hora) + '</i>';
        if (ev.lugar) html += '<i>📍 ' + esc(ev.lugar) + '</i>';
        html += '</div><div class="an-ev-b">';
        html += '<button type="button" class="an-b an-b-appi" data-an-appi="' + i + '"' + (hecho ? ' disabled' : '') + '>' +
                (hecho ? '✓ Agendado en APPI' : '📅 En el calendario de APPI') + '</button>';
        html += '<button type="button" class="an-b an-b-tel" data-an-tel="' + i + '">📲 En la agenda del teléfono</button>';
        html += '</div></div>';
      });
      html += '</div>';
    }
    html += '<button type="button" class="an-ok" id="anOk">Entendido ✓</button>';
    html += '<div class="an-tip">La 🔔 de la esquina te vuelve a mostrar este aviso.</div>';
    html += '</div>';
    ov.innerHTML = html;

    ov.querySelector('#anCerrar').onclick = cerrar;
    ov.querySelector('#anOk').onclick = cerrar;
    ov.querySelectorAll('[data-an-appi]').forEach(function(b){
      b.onclick = function(){ enAppi(an, an.eventos[parseInt(b.getAttribute('data-an-appi'), 10)], parseInt(b.getAttribute('data-an-appi'), 10), b); };
    });
    ov.querySelectorAll('[data-an-tel]').forEach(function(b){
      var i = parseInt(b.getAttribute('data-an-tel'), 10);
      b.onclick = function(){ enTelefono(an, an.eventos[i], i); };
    });
  }

  function mostrar(an){
    if (!an || ABierto) return;
    estilos();
    pintarCartel(an);
    overlayCartel().classList.add('open');
    ABierto = true;
    // El aviso queda "sin leer" (puntito en la 🔔) hasta que se cierra:
    // leer de verdad es llegar al final del cartel.
    pintarBell();
  }
  function cerrar(){
    var ov = document.getElementById('anPop');
    if (ov) ov.classList.remove('open');
    ABierto = false;
    if (ACTUAL){ marcarVisto(ACTUAL.id); pintarBell(); }
  }

  /* ---------- campanita ---------- */
  function bell(){
    var b = document.getElementById('anBell');
    if (b) return b;
    b = document.createElement('button');
    b.id = 'anBell';
    b.type = 'button';
    b.setAttribute('aria-label', 'Anuncio de administración');
    b.innerHTML = '🔔<i></i>';
    b.onclick = function(){ if (ACTUAL) mostrar(ACTUAL); };
    document.body.appendChild(b);
    return b;
  }
  function pintarBell(){
    estilos();
    var b = bell();
    if (!ACTUAL){ b.classList.remove('on', 'nuevo'); return; }
    b.classList.add('on');
    b.classList.toggle('nuevo', ACTUAL.id !== vistoId());
    // Si está la franja de versión de prueba, la campanita baja un escalón.
    var franja = document.getElementById('appiPruebaBar');
    b.style.top = franja ? 'calc(52px + env(safe-area-inset-top))' : '';
  }
  function quitarBell(){
    var b = document.getElementById('anBell');
    if (b) b.classList.remove('on', 'nuevo');
  }

  /* ---------- ciclo ---------- */
  async function revisar(){
    if (!sesion()){ quitarBell(); return; }
    if (esAdmin()){ quitarBell(); ACTUAL = null; return; }
    var an = null;
    try{
      an = await pedirAnuncio();
      if (an) guardarCache(an); else limpiarCache();
    }catch(e){
      // Sin conexión (o migración sin correr): queda el último aviso conocido.
      an = leerCache();
    }
    ACTUAL = an;
    pintarBell();
    if (an && an.id !== vistoId()) mostrar(an);
  }

  function iniciar(){
    estilos();
    setTimeout(revisar, 1800);
    setInterval(revisar, 120000);
    // Cuando el distribuidor inicia sesión, el aviso salta al toque,
    // sin esperar el próximo barrido.
    if (window.APPIAuth && typeof window.APPIAuth.login === 'function' && !window.__anLoginWrap){
      window.__anLoginWrap = true;
      var orig = window.APPIAuth.login;
      window.APPIAuth.login = function(){
        var r = orig.apply(this, arguments);
        Promise.resolve(r).then(function(){ setTimeout(revisar, 900); }).catch(function(){});
        return r;
      };
    }
  }
  if (document.readyState === 'complete') iniciar();
  else window.addEventListener('load', iniciar);

  window.APPIAnuncios = {
    revisar: revisar,
    mostrar: mostrar,
    cerrar: cerrar,
    actual: function(){ return ACTUAL; },
    normalizar: normalizar,
    eventoValido: eventoValido,
    enlaceGoogle: enlaceGoogle,
    icsEvento: icsEvento,
    fechaLinda: fechaLinda,
    pintarBell: pintarBell
  };
})();
