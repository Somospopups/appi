/* APPI · Botones de barrios y tarjetas en Usuarios / Garantías
 *
 * Reemplaza los dos desplegables (zona y marca/banco) por botones a la vista.
 * Al tocar uno se abre un popup con el listado de esa zona o de esa tarjeta.
 *
 * El popup es el resultado: muestra la gente y se cierra. El listado grande de
 * la pantalla no se toca, así el distribuidor puede mirar un barrio sin perder
 * lo que tenía filtrado abajo.
 *
 * Solo se dibujan los botones que tienen gente detrás: un botón que abre una
 * lista vacía es una promesa incumplida.
 */
(function(){
  'use strict';

  var ID_ZONAS = 'usuariosZonasBotones';
  var ID_TARJETAS = 'usuariosTarjetasBotones';

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }
  function digits(s){ return String(s || '').replace(/\D/g, ''); }
  function lista(){
    if (typeof window.usuariosTodosActual === 'function') return window.usuariosTodosActual();
    if (Array.isArray(window.usuariosU)) return window.usuariosU;
    return [];
  }

  /* ---------- estilos ---------- */
  function css(){
    if (document.getElementById('ubEstilos')) return;
    var st = document.createElement('style');
    st.id = 'ubEstilos';
    st.textContent = [
      '.ub-wrap{margin-top:14px}',
      '.ub-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:8px}',
      '.ub-head h4{margin:0;font-size:10.5px;font-weight:800;color:#6b6b76;text-transform:uppercase;letter-spacing:.5px}',
      '.ub-head span{font-size:10.5px;color:#8a8a99;font-weight:700}',
      '.ub-grid{display:flex;flex-wrap:wrap;gap:7px}',
      '.ub-btn{display:inline-flex;align-items:center;gap:7px;min-height:40px;padding:9px 13px;border:1px solid rgba(80,90,130,.14);',
      'border-radius:14px;background:rgba(255,255,255,.78);backdrop-filter:blur(14px);color:#3a3a48;font:inherit;font-size:12.5px;',
      'font-weight:750;cursor:pointer;transition:transform .16s cubic-bezier(.4,0,.2,1),box-shadow .16s,background .16s}',
      '.ub-btn:hover{background:rgba(91,141,239,.10);border-color:rgba(91,141,239,.24);transform:translateY(-1px);box-shadow:0 6px 16px rgba(91,112,210,.14)}',
      '.ub-btn:active{transform:translateY(0)}',
      '.ub-btn b{display:inline-grid;place-items:center;min-width:22px;height:22px;padding:0 6px;border-radius:999px;',
      'background:linear-gradient(135deg,#5b8def,#a06bff);color:#fff;font-size:10.5px;font-weight:900}',
      '.ub-btn .ub-dot{width:9px;height:9px;border-radius:50%;flex:0 0 auto}',
      '.ub-empty{padding:12px 14px;border-radius:13px;background:rgba(0,0,0,.04);color:#777887;font-size:11.5px}',
      /* popup */
      '.ub-ov{position:fixed;inset:0;z-index:10050;display:none;background:rgba(24,26,42,.46);backdrop-filter:blur(5px)}',
      '.ub-ov.open{display:block}',
      '.ub-panel{position:absolute;top:0;right:0;bottom:0;width:min(580px,100%);padding:20px;overflow:auto;',
      'background:linear-gradient(160deg,#f5f8ff,#fff3f9);box-shadow:-18px 0 55px rgba(30,35,75,.22);',
      'animation:ubIn .32s cubic-bezier(.4,0,.2,1)}',
      '@keyframes ubIn{from{transform:translateX(28px);opacity:.4}to{transform:none;opacity:1}}',
      '.ub-top{display:flex;align-items:start;justify-content:space-between;gap:12px;padding-bottom:14px;border-bottom:1px solid rgba(80,90,130,.11)}',
      '.ub-top h2{margin:0;color:#292938;font-size:21px}',
      '.ub-top p{margin:5px 0 0;color:#777887;font-size:12px}',
      '.ub-close{width:48px;height:48px;flex:0 0 auto;border:0;border-radius:50%;background:rgba(91,141,239,.11);color:#3d63c9;font-size:22px;font-weight:900;cursor:pointer}',
      '.ub-list{display:grid;gap:7px;margin-top:14px}',
      '.ub-row{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center;padding:11px;',
      'border:1px solid rgba(80,90,130,.1);border-radius:15px;background:#fff}',
      '.ub-badge{display:grid;place-items:center;min-width:52px;padding:5px 7px;border-radius:9px;color:#fff;font-size:8.5px;font-weight:900}',
      '.ub-row strong{display:block;color:#30303d;font-size:13px}',
      '.ub-row small{display:block;margin-top:3px;color:#777887;font-size:10px}',
      '.ub-acts{display:flex;gap:5px}',
      '.ub-acts a{width:38px;height:38px;display:grid;place-items:center;border-radius:11px;text-decoration:none;font-size:15px}',
      '.ub-acts .wa{background:rgba(37,211,102,.14)}',
      '.ub-acts .tel{background:rgba(91,141,239,.13)}',
      'body.dark .ub-btn{background:rgba(31,32,49,.74);border-color:rgba(255,255,255,.09);color:#e8e8f0}',
      'body.dark .ub-panel{background:linear-gradient(160deg,#1b1c2b,#241c2b)}',
      'body.dark .ub-top h2{color:#f1f1f6}',
      'body.dark .ub-row{background:rgba(31,32,49,.8);border-color:rgba(255,255,255,.08)}',
      'body.dark .ub-row strong{color:#f1f1f6}',
      '@media(max-width:600px){.ub-panel{width:100%;padding:16px}.ub-btn{font-size:12px}}'
    ].join('');
    document.head.appendChild(st);
  }

  /* ---------- popup ---------- */
  function overlay(){
    var ov = document.getElementById('ubOverlay');
    if (ov) return ov;
    css();
    ov = document.createElement('div');
    ov.id = 'ubOverlay';
    ov.className = 'ub-ov';
    ov.innerHTML =
      '<aside class="ub-panel" role="dialog" aria-modal="true" aria-labelledby="ubTitulo">' +
        '<div class="ub-top">' +
          '<div><h2 id="ubTitulo">Listado</h2><p id="ubSub"></p></div>' +
          '<button type="button" class="ub-close" id="ubCerrar" aria-label="Cerrar">×</button>' +
        '</div>' +
        '<div id="ubCuerpo"></div>' +
      '</aside>';
    document.body.appendChild(ov);
    ov.onclick = function(e){ if (e.target === ov) cerrar(); };
    ov.querySelector('#ubCerrar').onclick = cerrar;
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape') cerrar();
    });
    return ov;
  }
  function cerrar(){
    var ov = document.getElementById('ubOverlay');
    if (ov) ov.classList.remove('open');
  }
  function abrir(titulo, sub, html){
    var ov = overlay();
    ov.querySelector('#ubTitulo').textContent = titulo;
    ov.querySelector('#ubSub').textContent = sub || '';
    ov.querySelector('#ubCuerpo').innerHTML = html;
    ov.classList.add('open');
    ov.querySelector('#ubCerrar').focus();
    if (typeof window.haptic === 'function') window.haptic(10);
  }

  /* ---------- fila de persona ---------- */
  function color(estado){
    if (estado === 'vencida') return '#d9534f';
    if (estado === 'porVencer') return '#f5b301';
    return '#3ad0a4';
  }
  function texto(estado){
    if (estado === 'vencida') return 'VENC';
    if (estado === 'porVencer') return 'POR VENC';
    return 'VIG';
  }
  function fila(u){
    var tel = digits(u.telf || u.telefono);
    var vence = u.fVenceRaw || '—';
    var donde = [u.localidad, u.domicilio].filter(Boolean).join(' · ') || 'Sin domicilio';
    return '<div class="ub-row">' +
      '<span class="ub-badge" style="background:' + color(u.estado) + '">' + texto(u.estado) + '</span>' +
      '<span><strong>' + esc(u.usuario || 'Sin nombre') + '</strong>' +
        '<small>' + esc(donde) + ' · Vence ' + esc(vence) + '</small></span>' +
      '<span class="ub-acts">' +
        (tel ? '<a class="wa" href="https://wa.me/' + esc(tel) + '" target="_blank" rel="noopener" title="WhatsApp">💬</a>' +
               '<a class="tel" href="tel:' + esc(tel) + '" title="Llamar">📞</a>' : '') +
      '</span></div>';
  }
  function listado(gente){
    if (!gente.length) return '<div class="ub-empty">No hay usuarios acá.</div>';
    // Primero lo que urge: vencidas, después por vencer, después vigentes.
    var orden = { vencida: 0, porVencer: 1, vigente: 2 };
    var copia = gente.slice().sort(function(a, b){
      var da = orden[a.estado] == null ? 3 : orden[a.estado];
      var db = orden[b.estado] == null ? 3 : orden[b.estado];
      if (da !== db) return da - db;
      return String(a.usuario || '').localeCompare(String(b.usuario || ''), 'es');
    });
    return '<div class="ub-list">' + copia.map(fila).join('') + '</div>';
  }
  function resumen(gente){
    var v = gente.filter(function(u){ return u.estado === 'vencida'; }).length;
    var p = gente.filter(function(u){ return u.estado === 'porVencer'; }).length;
    var partes = [gente.length + (gente.length === 1 ? ' usuario' : ' usuarios')];
    if (v) partes.push(v + ' vencida' + (v === 1 ? '' : 's'));
    if (p) partes.push(p + ' por vencer');
    return partes.join(' · ');
  }

  /* ---------- botones de barrios ---------- */
  function zonas(){
    var mapa = {};
    lista().forEach(function(u){
      var z = String(u.localidad || '').trim();
      if (!z) return;
      (mapa[z] = mapa[z] || []).push(u);
    });
    return Object.keys(mapa).sort(function(a, b){
      return a.localeCompare(b, 'es');
    }).map(function(z){ return { nombre: z, gente: mapa[z] }; });
  }
  function pintarZonas(){
    var host = document.getElementById(ID_ZONAS);
    if (!host) return;
    css();
    var grupos = zonas();
    var sinZona = lista().filter(function(u){ return !String(u.localidad || '').trim(); });

    if (!grupos.length){
      host.innerHTML = '<div class="ub-wrap"><div class="ub-empty">Todavía no hay barrios cargados.</div></div>';
      return;
    }
    var botones = grupos.map(function(g){
      var venc = g.gente.filter(function(u){ return u.estado === 'vencida'; }).length;
      return '<button type="button" class="ub-btn" data-ub-zona="' + esc(g.nombre) + '">' +
        (venc ? '<span class="ub-dot" style="background:#d9534f"></span>' : '') +
        esc(g.nombre) + '<b>' + g.gente.length + '</b></button>';
    });
    if (sinZona.length){
      botones.push('<button type="button" class="ub-btn" data-ub-zona="__sin__">Sin barrio<b>' + sinZona.length + '</b></button>');
    }
    host.innerHTML =
      '<div class="ub-wrap"><div class="ub-head"><h4>Barrios</h4>' +
      '<span>' + grupos.length + (grupos.length === 1 ? ' barrio' : ' barrios') + '</span></div>' +
      '<div class="ub-grid">' + botones.join('') + '</div></div>';

    host.querySelectorAll('[data-ub-zona]').forEach(function(b){
      b.onclick = function(){
        var z = b.getAttribute('data-ub-zona');
        var gente = z === '__sin__' ? sinZona
          : (grupos.filter(function(g){ return g.nombre === z; })[0] || {}).gente || [];
        abrir(z === '__sin__' ? 'Sin barrio' : z, resumen(gente), listado(gente));
      };
    });
  }

  /* ---------- botones de tarjetas ---------- */
  function etiqueta(coleccion, id){
    for (var i = 0; i < coleccion.length; i++){
      if (coleccion[i].id === id) return coleccion[i].label;
    }
    return id;
  }
  function combinaciones(){
    var T = window.APPITarjetas;
    if (!T || typeof T.cardsOf !== 'function') return [];
    var mapa = {};
    lista().forEach(function(u){
      var cards = T.cardsOf(u) || [];
      cards.forEach(function(c){
        if (!c || !c.marca) return;
        var clave = c.marca + '|' + (c.banco || '');
        if (!mapa[clave]){
          mapa[clave] = {
            marca: c.marca,
            banco: c.banco || '',
            label: etiqueta(T.MARCAS || [], c.marca) +
                   (c.banco ? ' ' + etiqueta(T.BANCOS || [], c.banco) : ''),
            gente: []
          };
        }
        // Una persona con dos tarjetas del mismo par no se cuenta dos veces.
        if (mapa[clave].gente.indexOf(u) === -1) mapa[clave].gente.push(u);
      });
    });
    return Object.keys(mapa).map(function(k){ return mapa[k]; })
      .sort(function(a, b){
        if (b.gente.length !== a.gente.length) return b.gente.length - a.gente.length;
        return a.label.localeCompare(b.label, 'es');
      });
  }
  function pintarTarjetas(){
    var host = document.getElementById(ID_TARJETAS);
    if (!host) return;
    css();
    var combos = combinaciones();
    var T = window.APPITarjetas;
    var sinTarjeta = (T && typeof T.cardsOf === 'function')
      ? lista().filter(function(u){ return (T.cardsOf(u) || []).length === 0; })
      : [];

    if (!combos.length){
      host.innerHTML = '<div class="ub-wrap"><div class="ub-head"><h4>Tarjetas</h4></div>' +
        '<div class="ub-empty">Todavía no hay tarjetas cargadas. Se agregan desde la ficha de cada usuario.</div></div>';
      return;
    }
    var botones = combos.map(function(c){
      return '<button type="button" class="ub-btn" data-ub-marca="' + esc(c.marca) + '" data-ub-banco="' + esc(c.banco) + '">' +
        '💳 ' + esc(c.label) + '<b>' + c.gente.length + '</b></button>';
    });
    if (sinTarjeta.length){
      botones.push('<button type="button" class="ub-btn" data-ub-sin="1">Sin tarjeta<b>' + sinTarjeta.length + '</b></button>');
    }
    host.innerHTML =
      '<div class="ub-wrap"><div class="ub-head"><h4>Tarjetas</h4>' +
      '<span>' + combos.length + (combos.length === 1 ? ' combinación' : ' combinaciones') + '</span></div>' +
      '<div class="ub-grid">' + botones.join('') + '</div></div>';

    host.querySelectorAll('[data-ub-marca]').forEach(function(b){
      b.onclick = function(){
        var m = b.getAttribute('data-ub-marca'), k = b.getAttribute('data-ub-banco');
        var combo = combos.filter(function(c){ return c.marca === m && c.banco === k; })[0];
        if (!combo) return;
        abrir('💳 ' + combo.label, resumen(combo.gente), listado(combo.gente));
      };
    });
    var btnSin = host.querySelector('[data-ub-sin]');
    if (btnSin){
      btnSin.onclick = function(){
        abrir('Sin tarjeta cargada', resumen(sinTarjeta), listado(sinTarjeta));
      };
    }
  }

  function pintar(){
    pintarZonas();
    pintarTarjetas();
  }

  window.APPIUsuariosBotones = {
    pintar: pintar,
    pintarZonas: pintarZonas,
    pintarTarjetas: pintarTarjetas,
    abrir: abrir,
    cerrar: cerrar
  };
})();
