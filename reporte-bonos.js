/* APPI · Reporte de Bonos (v809 · v810: en Mi negocio · v811: ojo · v812: botón + popup)
   La información del tablero de PSA → "Bonos y Bonus" → Reporte de Bonos,
   en la parte SUPERIOR de Mi negocio.
   - v812: el reporte NO se muestra a texto abierto. En su lugar hay un
     BOTÓN ALARGADO ("💰 Reporte de Bonos · <período>"); al presionarlo se
     abre un POPUP (hoja inferior) con todos los datos. Al salir de Mi
     negocio el popup se cierra solo. (Reemplaza al ojito de v811.)
   - Se actualiza SOLO al entrar a la app (función consulta-serial, action:'bonos').
   - Queda cacheada en el teléfono: si no hay internet se ve la última copia
     con su fecha, y un botón ↻ para reintentar.
   - Abajo del botón siguen el banner de personas/activos/PB y los botones. */
(function(){
  if (window.APBon) return;

  var LS_KEY = 'appi_bonos_v1';
  var EN_VUELO_MS = 30 * 60 * 1000; // refresco al abrir la vista si pasaron 30 min
  var enVuelo = null;
  var ultimoError = '';
  var popupAbierto = false;

  function supabaseCfg(){ try{ return (window.APPI_AUTH && window.APPI_AUTH.url && window.APPI_AUTH.anonKey) ? window.APPI_AUTH : null; }catch(e){ return null; } }
  function tokenActual(){ try{ var v = JSON.parse(localStorage.getItem('appi_auth_session_v1') || 'null'); return v && v.session && v.session.access_token || ''; }catch(e){ return ''; } }
  function psaCreds(){ try{ var c = JSON.parse(localStorage.getItem('appsi_psa_creds') || 'null'); return (c && c.center && c.number && c.password) ? c : null; }catch(e){ return null; } }
  function periodoActual(){ var z = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' })); return z.getFullYear() + '-' + String(z.getMonth() + 1).padStart(2, '0'); }
  function esc(t){ return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  /* '50445.00' → '50.445' · '1,431.64' → '1.431,64' (formato argentino) */
  function fmtNum(s){
    var t = String(s == null ? '' : s).replace(/[^\d,.-]/g, '');
    if (!t) return '0';
    t = t.replace(/,/g, '');
    var partes = t.split('.');
    var int = partes[0] || '0';
    var dec = partes[1];
    int = String(int).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return int + (dec && dec !== '00' ? ',' + dec : '');
  }
  function fechaCorta(iso){
    var d = new Date(iso);
    var h = String(d.getHours()).padStart(2, '0'), m = String(d.getMinutes()).padStart(2, '0');
    var hoy = new Date();
    var esHoy = d.getDate() === hoy.getDate() && d.getMonth() === hoy.getMonth() && d.getFullYear() === hoy.getFullYear();
    return (esHoy ? 'hoy a las ' : 'el ') + d.getDate() + '/' + String(d.getMonth() + 1).padStart(2, '0') + (esHoy ? ' ' + h + ':' + m : '');
  }

  function leerCache(){ try{ var c = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); return (c && c.bonos) ? c : null; }catch(e){ return null; } }
  function guardarCache(b){ try{ localStorage.setItem(LS_KEY, JSON.stringify({ ts: Date.now(), bonos: b })); }catch(e){} }

  function fetchBonos(){
    if (enVuelo) return enVuelo;
    var cfg = supabaseCfg(), c = psaCreds();
    if (!cfg || !c){
      ultimoError = 'Faltan tus datos de MI PSA (Ajustes → MI PSA).';
      render();
      return Promise.reject(new Error(ultimoError));
    }
    var p = fetch(cfg.url + '/functions/v1/consulta-serial', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': cfg.anonKey,
        'Authorization': 'Bearer ' + (tokenActual() || cfg.anonKey)
      },
      body: JSON.stringify({ action: 'bonos', center: c.center, number: c.number, password: c.password, periodo: periodoActual() })
    }).then(function(r){ return r.json().then(function(j){ return { http: r.ok, j: j || {} }; }); })
      .then(function(rr){
        if (rr.http && rr.j.ok && rr.j.bonos){
          ultimoError = '';
          guardarCache(rr.j.bonos);
          return rr.j.bonos;
        }
        throw new Error((rr.j && rr.j.error) || 'Sin respuesta de PSA.');
      }).then(function(b){
        enVuelo = null;
        render();
        return b;
      }).catch(function(e){
        enVuelo = null;
        ultimoError = (e && e.message) ? e.message : 'Sin conexión con PSA.';
        render();
        throw e;
      });
    enVuelo = p;
    return p;
  }

  function refrescarSiEsNecesario(){
    var cache = leerCache();
    var vencida = !cache || (Date.now() - cache.ts) > EN_VUELO_MS;
    if (vencida && !enVuelo){ fetchBonos().catch(function(){}); }
  }

  /* ---------- vista: botón alargado ---------- */
  function asegurarHost(){
    var view = document.getElementById('view-negocio');
    if (!view) return null;
    var host = document.getElementById('bonosCard');
    if (host) return host;
    host = document.createElement('div');
    host.id = 'bonosCard';
    var header = view.querySelector('header');
    if (header) header.insertAdjacentElement('afterend', host);
    else view.insertBefore(host, view.firstChild);
    return host;
  }

  function asegurarOverlay(){
    var ov = document.getElementById('bnsOverlay');
    if (ov) return ov;
    ov = document.createElement('div');
    ov.id = 'bnsOverlay';
    ov.className = 'bns-overlay';
    ov.innerHTML = '<div class="bns-backdrop"></div><div class="bns-sheet" id="bnsSheet"></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function(e){ if (e.target === ov || e.target.className === 'bns-backdrop') cerrar(); });
    return ov;
  }

  function estadoBono(b){
    var e = String(b.estado || '');
    if (/^Califico|^Calificó/i.test(e)) return { cls: 'ok', txt: '✓' };
    var m = e.match(/Faltan\s+([\d.,]+)/i);
    if (m) return { cls: 'falta', txt: 'faltan ' + fmtNum(m[1]) };
    if (/No Califico|No Calificó/i.test(e)) return { cls: 'no', txt: '—' };
    return { cls: '', txt: e };
  }

  /* El botón alargado: nunca muestra datos, solo título + período. */
  function htmlBoton(){
    var cache = leerCache();
    var b = cache && cache.bonos;
    var cargando = !!enVuelo;
    var right;
    if (b){
      right = '<span class="bns-btn-per">' + esc(b.periodo || '') + '</span><span class="bns-btn-chev">›</span>';
    } else if (cargando){
      right = '<span class="bns-btn-per bns-btn-busy">consultando PSA…</span>';
    } else if (psaCreds()){
      right = '<span class="bns-btn-per">ver</span><span class="bns-btn-chev">›</span>';
    } else {
      right = '<span class="bns-btn-per">vincular MI PSA</span><span class="bns-btn-chev">›</span>';
    }
    return '<button type="button" class="bns-btn" id="bonosBtn" aria-label="Abrir Reporte de Bonos">' +
      '<span class="bns-btn-ico">💰</span>' +
      '<span class="bns-btn-titulo">Reporte de Bonos</span>' +
      right +
    '</button>';
  }

  /* El contenido del popup (cuerpo completo del reporte). */
  function htmlCuerpo(){
    var cache = leerCache();
    var b = cache && cache.bonos;
    var cargando = !!enVuelo;

    if (!b){
      if (cargando){
        return '<div class="bns-bloque"><div class="bns-spinner"></div>' +
          '<div class="bns-txt">Consultando PSA…</div>' +
          '<div class="bns-sub">Reporte de Bonos del mes</div></div>';
      }
      if (psaCreds()){
        return '<div class="bns-bloque"><div class="bns-ico">⚠️</div>' +
          '<div class="bns-txt">' + esc(ultimoError || 'Sin datos todavía.') + '</div>' +
          '<button type="button" class="bns-retry" id="bnsRetry">Reintentar</button></div>';
      }
      return '<div class="bns-bloque"><div class="bns-ico">🔑</div>' +
        '<div class="bns-txt">Vinculá MI PSA para ver tus bonos del mes.</div>' +
        '<button type="button" class="bns-retry" id="bnsCreds">Vincular MI PSA</button></div>';
    }

    var html = '<div class="bns-cab">' +
      '<div class="bns-titulo">💰 Reporte de Bonos</div>' +
      '<div class="bns-per"><span>' + esc(b.periodo || '') + '</span>' + (cargando ? ' <span class="bns-mini">actualizando…</span>' : '') +
      '<button type="button" class="bns-refresh" id="bnsRefresh" title="Actualizar desde MI PSA">↻</button>' +
      '<button type="button" class="bns-close" id="bnsClose" title="Cerrar" aria-label="Cerrar">✕</button></div>' +
    '</div>';

    if (ultimoError && !cargando){
      html += '<div class="bns-aviso">⚠️ ' + esc(ultimoError) + ' — mostrando la última copia (' + fechaCorta(cache.ts) + ').</div>';
    }

    html += '<div class="bns-meta">' +
      'DIP ' + esc(b.dip || '—') + ' · ' + esc(b.nombre || '—') + '<br>' +
      'Socio: ' + esc(b.socio || '—') + ' · Sucursal: ' + esc(b.sucursal || '—') + '<br>' +
      'Categoría: ' + esc(b.categoria || '—') +
    '</div>';

    if (b.acumulacion && b.acumulacion.length){
      html += '<div class="bns-seccion">Acumulación del mes</div><div class="bns-acum">';
      b.acumulacion.forEach(function(a){
        html += '<div class="bns-acum-f"><span class="bns-acum-n">' + esc(a.r) + '</span><span class="bns-acum-v">' + fmtNum(a.pb) + '</span></div>';
      });
      html += '</div>';
    }

    if (b.bonos && b.bonos.length){
      html += '<div class="bns-seccion">Detalle de bonos</div><div class="bns-bonos">';
      b.bonos.forEach(function(x){
        var est = estadoBono(x);
        var imp = (x.imp && x.imp !== '0.00') ? '$ ' + fmtNum(x.imp) : (est.cls === 'ok' ? '$ 0' : '');
        // v811: estado + importe van juntos, alineados a la derecha
        html += '<div class="bns-b"><span class="bns-b-n" title="' + esc(x.d) + '">' + esc(x.d) + '</span>' +
          '<span class="bns-b-derecha"><span class="bns-b-est ' + est.cls + '">' + esc(est.txt) + '</span>' +
          (imp ? '<span class="bns-b-imp">' + esc(imp) + '</span>' : '') + '</span></div>';
      });
      html += '</div>';
      if (b.total){
        html += '<div class="bns-total"><span>Total del período</span><b>$ ' + fmtNum(b.total) + '</b></div>';
      }
    }

    if (b.aviso){
      html += '<div class="bns-aviso">⚠️ ' + esc(b.aviso) + '</div>';
    }

    html += '<div class="bns-foot">Actualizado ' + fechaCorta(cache.ts) + ' · MI PSA</div>';
    return html;
  }

  function alambreSheet(){
    var retry = document.getElementById('bnsRetry');
    if (retry) retry.onclick = function(){ fetchBonos().catch(function(){}); };
    var creds = document.getElementById('bnsCreds');
    if (creds) creds.onclick = function(){ try{ if (typeof window.psaAbrirPopup === 'function') window.psaAbrirPopup(); }catch(e){} };
    var ref = document.getElementById('bnsRefresh');
    if (ref) ref.onclick = function(){ try{ haptic(8); }catch(e){} fetchBonos().catch(function(){}); };
    var close = document.getElementById('bnsClose');
    if (close) close.onclick = function(){ cerrar(); };
  }

  function abrir(){
    var ov = asegurarOverlay();
    var sheet = document.getElementById('bnsSheet');
    sheet.innerHTML = htmlCuerpo();
    alambreSheet();
    ov.classList.add('bns-open');
    popupAbierto = true;
  }
  function cerrar(){
    if (!popupAbierto) return;
    var ov = document.getElementById('bnsOverlay');
    if (ov) ov.classList.remove('bns-open');
    popupAbierto = false;
  }

  function render(){
    var host = asegurarHost();
    if (!host) return;
    host.innerHTML = htmlBoton();
    var btn = document.getElementById('bonosBtn');
    if (btn) btn.onclick = function(){ try{ haptic(6); }catch(e){} abrir(); };
    // Si el popup está abierto, refrescar su contenido con los nuevos datos.
    if (popupAbierto){
      var sheet = document.getElementById('bnsSheet');
      if (sheet){ sheet.innerHTML = htmlCuerpo(); alambreSheet(); }
    }
  }

  function css(){
    if (document.getElementById('bonosEstilos')) return;
    var st = document.createElement('style');
    st.id = 'bonosEstilos';
    st.textContent =
      '#bonosCard{margin:10px 10px 0}' +
      /* v812: botón alargado (sin datos, solo título + período) */
      '.bns-btn{width:100%;display:flex;align-items:center;gap:10px;padding:14px 16px;border:0;border-radius:18px;background:linear-gradient(135deg,#0b5878,#12708f);color:#fff;font:inherit;cursor:pointer;box-shadow:0 10px 26px rgba(11,88,120,.28);text-align:left}' +
      '.bns-btn:active{transform:scale(.985)}' +
      '.bns-btn-ico{font-size:19px}' +
      '.bns-btn-titulo{font-size:14.5px;font-weight:900;letter-spacing:-.2px;flex:1}' +
      '.bns-btn-per{font-size:11.5px;font-weight:700;color:rgba(255,255,255,.85);white-space:nowrap}' +
      '.bns-btn-busy{color:rgba(255,255,255,.65);font-weight:600}' +
      '.bns-btn-chev{font-size:18px;font-weight:900;color:rgba(255,255,255,.75);line-height:1}' +
      /* v812: popup (hoja inferior) con los datos */
      '.bns-overlay{position:fixed;inset:0;z-index:999;display:none}' +
      '.bns-overlay.bns-open{display:block}' +
      '.bns-backdrop{position:absolute;inset:0;background:rgba(15,16,26,.5)}' +
      '.bns-sheet{position:absolute;left:0;right:0;bottom:0;max-height:88vh;overflow-y:auto;background:#f3eee3;border-radius:22px 22px 0 0;padding:16px 14px calc(14px + env(safe-area-inset-bottom));box-shadow:0 -14px 44px rgba(0,0,0,.30)}' +
      'body.dark .bns-sheet{background:#25273a}' +
      '.bns-cab{display:flex;align-items:center;justify-content:space-between;gap:8px}' +
      '.bns-titulo{font-size:15px;font-weight:900;color:#23263a;letter-spacing:-.2px}' +
      'body.dark .bns-titulo{color:#f2f2f7}' +
      '.bns-per{display:flex;align-items:center;gap:6px;font-size:11.5px;font-weight:700;color:#0b5878;white-space:nowrap}' +
      'body.dark .bns-per{color:#7fc3dd}' +
      '.bns-mini{font-size:9.5px;font-weight:600;color:#8a8a94}' +
      '.bns-refresh{width:28px;height:28px;border-radius:50%;border:0;background:rgba(11,88,120,.10);color:#0b5878;font-size:14px;font-weight:900;cursor:pointer;display:flex;align-items:center;justify-content:center}' +
      'body.dark .bns-refresh{background:rgba(11,88,120,.3);color:#d7e8f0}' +
      '.bns-close{width:28px;height:28px;border-radius:50%;border:0;background:rgba(40,36,28,.08);color:#5c5c68;font-size:13px;font-weight:900;cursor:pointer;display:flex;align-items:center;justify-content:center}' +
      'body.dark .bns-close{background:rgba(255,255,255,.1);color:#c6cbea}' +
      '.bns-meta{margin-top:10px;font-size:11px;line-height:1.55;color:#5c5c68}' +
      'body.dark .bns-meta{color:#a8adc8}' +
      '.bns-seccion{margin:11px 0 5px;font-size:10px;font-weight:800;letter-spacing:.9px;text-transform:uppercase;color:#8a8a94}' +
      'body.dark .bns-seccion{color:#7d8298}' +
      '.bns-acum-f{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:4px 0;border-bottom:1px dashed rgba(40,36,28,.12);font-size:12.5px}' +
      'body.dark .bns-acum-f{border-bottom-color:rgba(255,255,255,.10)}' +
      '.bns-acum-n{color:#343441;font-weight:600}' +
      'body.dark .bns-acum-n{color:#c6cbea}' +
      '.bns-acum-v{font-weight:800;color:#23263a;font-variant-numeric:tabular-nums}' +
      'body.dark .bns-acum-v{color:#f2f2f7}' +
      '.bns-b{display:grid;grid-template-columns:1fr auto;align-items:center;gap:8px;padding:4.5px 0;font-size:12px;border-bottom:1px dashed rgba(40,36,28,.10)}' +
      'body.dark .bns-b{border-bottom-color:rgba(255,255,255,.09)}' +
      '.bns-b-n{font-weight:600;color:#343441;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
      'body.dark .bns-b-n{color:#c6cbea}' +
      /* v811: grupo derecha (estado + importe) siempre en el borde derecho */
      '.bns-b-derecha{display:flex;align-items:center;justify-content:flex-end;gap:8px;min-width:86px}' +
      '.bns-b-est{font-size:10.5px;font-weight:800;padding:2px 7px;border-radius:999px;white-space:nowrap}' +
      '.bns-b-est.ok{background:rgba(37,208,164,.14);color:#0f8f6d}' +
      'body.dark .bns-b-est.ok{background:rgba(37,208,164,.2);color:#25d0a4}' +
      '.bns-b-est.falta{background:rgba(245,179,1,.14);color:#a06a00}' +
      'body.dark .bns-b-est.falta{background:rgba(245,179,1,.18);color:#f5b301}' +
      '.bns-b-est.no{background:rgba(120,120,135,.14);color:#6b6b76}' +
      'body.dark .bns-b-est.no{background:rgba(255,255,255,.1);color:#a0a0b0}' +
      '.bns-b-imp{font-weight:800;font-size:12px;color:#23263a;font-variant-numeric:tabular-nums;text-align:right}' +
      'body.dark .bns-b-imp{color:#f2f2f7}' +
      '.bns-total{display:flex;align-items:center;justify-content:space-between;margin-top:8px;padding-top:8px;border-top:2px solid rgba(11,88,120,.25);font-size:13px;font-weight:800;color:#23263a}' +
      'body.dark .bns-total{border-top-color:rgba(11,88,120,.5);color:#f2f2f7}' +
      '.bns-aviso{margin-top:9px;padding:8px 10px;border-radius:10px;background:rgba(245,179,1,.13);border:1px solid rgba(245,179,1,.35);font-size:11px;font-weight:600;color:#8a5b00;line-height:1.4}' +
      'body.dark .bns-aviso{background:rgba(245,179,1,.12);border-color:rgba(245,179,1,.3);color:#f5b301}' +
      '.bns-foot{margin-top:8px;font-size:10px;color:#8a8a94;text-align:right}' +
      'body.dark .bns-foot{color:#7d8298}' +
      '.bns-bloque{padding:22px 10px;text-align:center}' +
      '.bns-txt{font-size:13px;font-weight:700;color:#343441;margin-top:8px;line-height:1.4}' +
      'body.dark .bns-txt{color:#e6e8f5}' +
      '.bns-sub{font-size:11px;color:#8a8a94;margin-top:3px}' +
      '.bns-ico{font-size:26px}' +
      '.bns-retry{margin-top:10px;padding:9px 18px;border-radius:999px;border:0;background:#0b5878;color:#fff;font-size:12px;font-weight:800;cursor:pointer;box-shadow:0 8px 18px rgba(11,88,120,.28)}' +
      '.bns-retry:active{transform:scale(.96)}' +
      '.bns-spinner{width:26px;height:26px;margin:0 auto;border-radius:50%;border:3px solid rgba(11,88,120,.18);border-top-color:#0b5878;animation:bnsGira .8s linear infinite}' +
      '@keyframes bnsGira{to{transform:rotate(360deg)}}';
    document.head.appendChild(st);
  }

  function init(){
    css();
    render();
    if (psaCreds()){
      // Al entrar a la app se actualiza solo (no depende de "recordar").
      setTimeout(function(){ fetchBonos().catch(function(){}); }, 1500);
    }
    // Al abrir Mi negocio: refresco (tope 30 min). En cualquier cambio de
    // vista: el popup se cierra (los datos nunca quedan a la vista).
    try{
      var orig = window.showView;
      if (typeof orig === 'function' && !window.__apBonViewWrapped){
        window.__apBonViewWrapped = true;
        window.showView = function(id){
          var r = orig.apply(this, arguments);
          try{
            cerrar();
            if (id === 'view-negocio') refrescarSiEsNecesario();
          }catch(e){}
          return r;
        };
      }
    }catch(e){}
    // Esc también cierra el popup
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') cerrar(); });
  }

  window.APBon = {
    fetch: fetchBonos,
    render: render,
    refrescarSiEsNecesario: refrescarSiEsNecesario,
    cache: leerCache,
    // v812: control del popup (también lo usan los tests)
    abrir: abrir,
    cerrar: cerrar,
    estaAbierto: function(){ return popupAbierto; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
