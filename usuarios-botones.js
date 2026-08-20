/* APPI · Botones de Barrios y Tarjetas en Usuarios / Garantías
 *
 * Dos botones arriba de la pantalla: "Barrios" y "Tarjetas". Cada uno abre un
 * popup con su listado. Al elegir un ítem, el popup se cierra y el listado
 * grande de la pantalla queda filtrado por esa elección.
 *
 * Los filtros no se acumulan: elegir una tarjeta borra el barrio y al revés.
 * Cuando hay uno activo, el botón lo muestra en lugar de su nombre genérico.
 */
(function(){
  'use strict';

  var ID_BOTONES = 'usuariosFiltroBotones';

  // Filtro vigente. `tipo` es 'zona', 'tarjeta' o null.
  var actual = { tipo: null, zona: '', marca: '', banco: '', label: '' };

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }
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
      '.ub-barra-chip{display:flex;margin-bottom:10px}',
      '.ub-chip{display:inline-flex;align-items:center;gap:8px;padding:9px 14px;border:0;border-radius:999px;',
      'background:linear-gradient(135deg,#5b8def,#a06bff);color:#fff;font:inherit;font-size:12.5px;font-weight:800;',
      'cursor:pointer;box-shadow:0 5px 14px rgba(91,112,210,.24)}',
      '.ub-chip .ub-x{display:grid;place-items:center;width:19px;height:19px;flex:0 0 auto;border-radius:50%;',
      'background:rgba(255,255,255,.28);font-size:12px;font-weight:900}',
      '.ub-barra{display:grid;grid-template-columns:1fr;gap:9px;margin-bottom:12px}',
      '.ub-barra:has(.ub-main + .ub-main){grid-template-columns:1fr 1fr}',
      '.ub-main{display:flex;align-items:center;justify-content:center;gap:8px;min-height:52px;padding:11px 14px;',
      'border:1px solid rgba(80,90,130,.14);border-radius:16px;background:rgba(255,255,255,.78);backdrop-filter:blur(14px);',
      'color:#3a3a48;font:inherit;font-size:13px;font-weight:800;cursor:pointer;',
      'transition:transform .16s cubic-bezier(.4,0,.2,1),box-shadow .16s,background .16s}',
      '.ub-main:hover{background:rgba(91,141,239,.10);border-color:rgba(91,141,239,.24);transform:translateY(-1px);box-shadow:0 7px 18px rgba(91,112,210,.15)}',
      '.ub-main:active{transform:translateY(0)}',
      '.ub-main.on{background:linear-gradient(135deg,#5b8def,#a06bff);border-color:transparent;color:#fff;box-shadow:0 7px 18px rgba(91,112,210,.28)}',
      '.ub-main .ub-txt{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.ub-main .ub-x{display:grid;place-items:center;width:22px;height:22px;flex:0 0 auto;border-radius:50%;',
      'background:rgba(255,255,255,.26);font-size:13px;font-weight:900}',
      /* popup */
      '.ub-ov{position:fixed;inset:0;z-index:10050;display:none;background:rgba(24,26,42,.46);backdrop-filter:blur(5px)}',
      '.ub-ov.open{display:block}',
      '.ub-panel{position:absolute;top:0;right:0;bottom:0;width:min(520px,100%);padding:20px;overflow:auto;',
      'background:linear-gradient(160deg,#f5f8ff,#fff3f9);box-shadow:-18px 0 55px rgba(30,35,75,.22);',
      'animation:ubIn .32s cubic-bezier(.4,0,.2,1)}',
      '@keyframes ubIn{from{transform:translateX(28px);opacity:.4}to{transform:none;opacity:1}}',
      '.ub-top{display:flex;align-items:start;justify-content:space-between;gap:12px;padding-bottom:14px;border-bottom:1px solid rgba(80,90,130,.11)}',
      '.ub-top h2{margin:0;color:#292938;font-size:21px}',
      '.ub-top p{margin:5px 0 0;color:#777887;font-size:12px}',
      '.ub-close{width:48px;height:48px;flex:0 0 auto;border:0;border-radius:50%;background:rgba(91,141,239,.11);color:#3d63c9;font-size:22px;font-weight:900;cursor:pointer}',
      '.ub-list{display:grid;gap:7px;margin-top:14px}',
      '.ub-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;width:100%;min-height:56px;',
      'padding:12px 14px;border:1px solid rgba(80,90,130,.1);border-radius:15px;background:#fff;font:inherit;',
      'text-align:left;cursor:pointer;transition:background .14s,border-color .14s}',
      '.ub-item:hover{background:rgba(91,141,239,.07);border-color:rgba(91,141,239,.2)}',
      '.ub-item.on{background:rgba(91,141,239,.12);border-color:rgba(91,141,239,.32)}',
      '.ub-item strong{display:block;color:#30303d;font-size:13.5px;font-weight:750;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.ub-item .ub-n{display:inline-grid;place-items:center;min-width:26px;height:26px;padding:0 8px;border-radius:999px;',
      'background:linear-gradient(135deg,#5b8def,#a06bff);color:#fff;font-size:11px;font-weight:900}',
      '.ub-todos{margin-top:14px;width:100%;min-height:50px;border:1px dashed rgba(91,141,239,.4);border-radius:15px;',
      'background:rgba(91,141,239,.06);color:#3d63c9;font:inherit;font-size:12.5px;font-weight:850;cursor:pointer}',
      '.ub-todos:hover{background:rgba(91,141,239,.13)}',
      /* mensaje de promo dentro del popup */
      '.ub-msg{margin-top:14px;padding:13px 14px;border:1px solid rgba(91,141,239,.18);border-radius:15px;background:rgba(91,141,239,.06)}',
      '.ub-msg label{display:block;margin-bottom:7px;color:#3d63c9;font-size:10.5px;font-weight:900;text-transform:uppercase;letter-spacing:.4px}',
      '.ub-msg textarea{width:100%;min-height:74px;padding:10px 12px;border:1px solid rgba(80,90,130,.16);border-radius:12px;',
      'background:rgba(255,255,255,.9);color:#292938;font:inherit;font-size:12.5px;resize:vertical;box-sizing:border-box}',
      '.ub-msg textarea:focus{outline:none;border-color:#5b8def;box-shadow:0 0 0 3px rgba(91,141,239,.12)}',
      '.ub-msg small{display:block;margin-top:7px;color:#777887;font-size:10.5px;line-height:1.4}',
      /* volver y personas de una tarjeta */
      '.ub-volver{margin-top:14px;min-height:40px;padding:9px 14px;border:0;border-radius:12px;background:rgba(91,141,239,.11);',
      'color:#3d63c9;font:inherit;font-size:12px;font-weight:850;cursor:pointer}',
      '.ub-volver:hover{background:rgba(91,141,239,.2)}',
      '.ub-persona{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;min-height:60px;',
      'padding:11px 14px;border:1px solid rgba(80,90,130,.1);border-radius:15px;background:#fff}',
      '.ub-persona strong{display:block;color:#30303d;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.ub-persona small{display:block;margin-top:3px;color:#777887;font-size:10px}',
      '.ub-wa{min-height:38px;padding:8px 13px;border:0;border-radius:11px;background:#25d366;color:#fff;',
      'font:inherit;font-size:11.5px;font-weight:900;cursor:pointer;white-space:nowrap}',
      '.ub-wa:hover{filter:brightness(1.06)}',
      '.ub-sintel{color:#9a9aa8;font-size:10.5px;font-weight:700}',
      'body.dark .ub-msg textarea{background:#1d1f31;color:#f2f2f7;border-color:rgba(255,255,255,.1)}',
      'body.dark .ub-persona{background:rgba(31,32,49,.8);border-color:rgba(255,255,255,.08)}',
      'body.dark .ub-persona strong{color:#f1f1f6}',
      '.ub-empty{margin-top:14px;padding:16px;border-radius:14px;background:rgba(0,0,0,.04);color:#777887;font-size:12px;text-align:center}',
      'body.dark .ub-main{background:rgba(31,32,49,.74);border-color:rgba(255,255,255,.09);color:#e8e8f0}',
      'body.dark .ub-panel{background:linear-gradient(160deg,#1b1c2b,#241c2b)}',
      'body.dark .ub-top h2{color:#f1f1f6}',
      'body.dark .ub-item{background:rgba(31,32,49,.8);border-color:rgba(255,255,255,.08)}',
      'body.dark .ub-item strong{color:#f1f1f6}',
      '@media(max-width:600px){.ub-panel{width:100%;padding:16px}}'
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
    return ov;
  }

  /* ---------- datos ---------- */
  function zonas(){
    var mapa = {};
    lista().forEach(function(u){
      var z = String(u.localidad || '').trim();
      if (!z) return; // sin barrio cargado no entra a la lista
      mapa[z] = (mapa[z] || 0) + 1;
    });
    return Object.keys(mapa).sort(function(a, b){
      return a.localeCompare(b, 'es');
    }).map(function(z){ return { nombre: z, cuantos: mapa[z] }; });
  }
  function etiqueta(coleccion, id){
    for (var i = 0; i < (coleccion || []).length; i++){
      if (coleccion[i].id === id) return coleccion[i].label;
    }
    return id;
  }
  function combinaciones(){
    var T = window.APPITarjetas;
    if (!T || typeof T.cardsOf !== 'function') return [];
    var mapa = {};
    lista().forEach(function(u){
      var vistas = {};
      (T.cardsOf(u) || []).forEach(function(c){
        if (!c || !c.marca) return;
        var clave = c.marca + '|' + (c.banco || '');
        if (vistas[clave]) return; // no contar dos veces a la misma persona
        vistas[clave] = true;
        if (!mapa[clave]){
          mapa[clave] = {
            marca: c.marca, banco: c.banco || '',
            label: etiqueta(T.MARCAS, c.marca) + (c.banco ? ' ' + etiqueta(T.BANCOS, c.banco) : ''),
            cuantos: 0
          };
        }
        mapa[clave].cuantos++;
      });
    });
    return Object.keys(mapa).map(function(k){ return mapa[k]; })
      .sort(function(a, b){
        if (b.cuantos !== a.cuantos) return b.cuantos - a.cuantos;
        return a.label.localeCompare(b.label, 'es');
      });
  }

  /* ---------- aplicar el filtro al listado grande ---------- */
  function aplicar(){
    var T = window.APPITarjetas;
    // Los dos filtros son excluyentes: al poner uno, el otro se limpia.
    if (actual.tipo === 'zona'){
      if (T && T.resetFiltro) T.resetFiltro();
      window.filtroZonaUExterno = actual.zona;
    } else if (actual.tipo === 'tarjeta'){
      window.filtroZonaUExterno = 'all';
      if (T && T.aplicarFiltro) T.aplicarFiltro(actual.marca, actual.banco);
    } else {
      window.filtroZonaUExterno = 'all';
      if (T && T.resetFiltro) T.resetFiltro();
    }
    if (typeof window.aplicarFiltrosU === 'function') window.aplicarFiltrosU();
    pintar();
  }
  function limpiar(){
    actual = { tipo: null, zona: '', marca: '', banco: '', label: '' };
    aplicar();
  }
  // Igual que limpiar, pero sin volver a filtrar: lo usa el "Limpiar búsqueda"
  // de la pantalla, que ya se encarga de rehacer el listado por su cuenta.
  function olvidar(){
    actual = { tipo: null, zona: '', marca: '', banco: '', label: '' };
    pintar();
  }

  /* ---------- popup de Barrios ---------- */
  function abrirBarrios(){
    var grupos = zonas();
    if (!grupos.length){
      abrir('📍 Zonas', '', '<div class="ub-empty">Todavía no hay barrios en la planilla cargada.</div>');
      return;
    }
    var html = '<div class="ub-list">' + grupos.map(function(g){
      var on = actual.tipo === 'zona' && actual.zona === g.nombre;
      return '<button type="button" class="ub-item' + (on ? ' on' : '') + '" data-ub-zona="' + esc(g.nombre) + '">' +
        '<strong>' + esc(g.nombre) + '</strong><span class="ub-n">' + g.cuantos + '</span></button>';
    }).join('') + '</div>' +
    '<button type="button" class="ub-todos" data-ub-todos>Todos los barrios</button>';

    var ov = abrir('📍 Zonas', grupos.length + (grupos.length === 1 ? ' barrio' : ' barrios'), html);
    ov.querySelectorAll('[data-ub-zona]').forEach(function(b){
      b.onclick = function(){
        var z = b.getAttribute('data-ub-zona');
        actual = { tipo: 'zona', zona: z, marca: '', banco: '', label: z };
        cerrar();
        aplicar();
      };
    });
    ov.querySelector('[data-ub-todos]').onclick = function(){ cerrar(); limpiar(); };
  }

  /* ---------- popup de Tarjetas ---------- */
  function abrirTarjetas(){
    var combos = combinaciones();
    if (!combos.length){
      abrir('💳 Tarjetas', '', '<div class="ub-empty">Todavía no hay tarjetas cargadas.<br>Se agregan desde la ficha de cada usuario.</div>');
      return;
    }
    var T = window.APPITarjetas;
    var texto = (T && T.mensajeActual) ? T.mensajeActual() : '';
    // El mensaje va arriba: se escribe una vez y sirve para cualquier tarjeta
    // que se elija después, sin salir del popup.
    var html =
      '<div class="ub-msg">' +
        '<label for="ubMsg">Mensaje para avisar la promo</label>' +
        '<textarea id="ubMsg" placeholder="Hola {nombre}, hay una promo con {tarjeta}…">' + esc(texto) + '</textarea>' +
        '<small>Podés usar {nombre} y {tarjeta}: se reemplazan por los datos de cada persona.</small>' +
      '</div>' +
      '<div class="ub-list">' + combos.map(function(c){
        var on = actual.tipo === 'tarjeta' && actual.marca === c.marca && actual.banco === c.banco;
        return '<button type="button" class="ub-item' + (on ? ' on' : '') + '" data-ub-marca="' + esc(c.marca) + '" data-ub-banco="' + esc(c.banco) + '">' +
          '<strong>' + esc(c.label) + '</strong><span class="ub-n">' + c.cuantos + '</span></button>';
      }).join('') + '</div>' +
      '<button type="button" class="ub-todos" data-ub-todos>Todas las tarjetas</button>';

    var ov = abrir('💳 Tarjetas', combos.length + (combos.length === 1 ? ' combinación' : ' combinaciones'), html);
    var caja = ov.querySelector('#ubMsg');
    if (caja && T && T.guardarMensaje){
      caja.oninput = function(){ T.guardarMensaje(caja.value); };
    }
    ov.querySelectorAll('[data-ub-marca]').forEach(function(b){
      b.onclick = function(){
        var m = b.getAttribute('data-ub-marca'), k = b.getAttribute('data-ub-banco');
        var combo = combos.filter(function(c){ return c.marca === m && c.banco === k; })[0];
        actual = { tipo: 'tarjeta', zona: '', marca: m, banco: k, label: combo ? combo.label : 'Tarjeta' };
        aplicar();
        verGenteDeTarjeta(combo);
      };
    });
    ov.querySelector('[data-ub-todos]').onclick = function(){ cerrar(); limpiar(); };
  }

  // Segundo paso del popup: la gente que tiene esa tarjeta, con el botón para
  // avisarle a cada uno. El listado grande ya quedó filtrado por detrás.
  function verGenteDeTarjeta(combo){
    if (!combo) { cerrar(); return; }
    var T = window.APPITarjetas;
    var gente = lista().filter(function(u){
      return (T.cardsOf(u) || []).some(function(c){
        return c && c.marca === combo.marca && (c.banco || '') === combo.banco;
      });
    });
    var filas = gente.map(function(u, i){
      var tel = String(u.telf || u.telefono || '').replace(/\D/g, '');
      var donde = [u.localidad, u.domicilio].filter(Boolean).join(' · ') || 'Sin domicilio';
      return '<div class="ub-persona">' +
        '<span><strong>' + esc(u.usuario || 'Sin nombre') + '</strong><small>' + esc(donde) + '</small></span>' +
        (tel ? '<button type="button" class="ub-wa" data-ub-wa="' + i + '">💬 Avisar</button>'
             : '<span class="ub-sintel">Sin teléfono</span>') +
        '</div>';
    }).join('');

    var ov = abrir('💳 ' + combo.label,
      gente.length + (gente.length === 1 ? ' persona' : ' personas'),
      '<button type="button" class="ub-volver" data-ub-volver>‹ Todas las tarjetas</button>' +
      '<div class="ub-list">' + (filas || '<div class="ub-empty">No hay nadie con esta tarjeta.</div>') + '</div>');

    ov.querySelector('[data-ub-volver]').onclick = abrirTarjetas;
    ov.querySelectorAll('[data-ub-wa]').forEach(function(b){
      b.onclick = function(){
        var u = gente[Number(b.getAttribute('data-ub-wa'))];
        if (u && T && T.abrirWhatsApp) T.abrirWhatsApp(u);
      };
    });
  }

  /* ---------- aviso del filtro activo ---------- */
  // Zonas y Tarjetas viven en la barra de herramientas, arriba. Acá sólo queda
  // el chip que avisa qué filtro está puesto: en los botones chicos no entraría
  // el nombre de un barrio, y sin aviso no se entendería por qué la lista está
  // recortada. Tocarlo reabre su popup; la cruz suelta el filtro.
  function pintar(){
    var host = document.getElementById(ID_BOTONES);
    if (!host) return;
    css();
    if (!actual.tipo){
      host.innerHTML = '';
      return;
    }
    var esZona = actual.tipo === 'zona';
    host.innerHTML =
      '<div class="ub-barra-chip">' +
        '<button type="button" class="ub-chip on" id="ubChipFiltro">' +
          '<span class="ub-txt">' + (esZona ? '📍 ' : '💳 ') + esc(actual.label) + '</span>' +
          '<span class="ub-x" data-ub-quitar="1" role="button" aria-label="Quitar filtro">×</span>' +
        '</button>' +
      '</div>';
    host.querySelector('#ubChipFiltro').onclick = esZona ? abrirBarrios : abrirTarjetas;
    host.querySelectorAll('[data-ub-quitar]').forEach(function(x){
      x.onclick = function(e){ e.stopPropagation(); limpiar(); };
    });
  }

  window.APPIUsuariosBotones = {
    pintar: pintar,
    abrirBarrios: abrirBarrios,
    abrirTarjetas: abrirTarjetas,
    cerrar: cerrar,
    limpiar: limpiar,
    olvidar: olvidar,
    filtroActual: function(){ return { tipo: actual.tipo, zona: actual.zona, marca: actual.marca, banco: actual.banco }; }
  };
})();
