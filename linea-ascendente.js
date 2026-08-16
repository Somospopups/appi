/* ============================================================
   APPI · Línea Ascendente (v227)
   ------------------------------------------------------------
   El negocio tiene su Línea Descendente (el cierre mensual);
   APPI muestra la Línea Ascendente del distribuidor: categoría
   actual, insignia de Fundador y lo que falta para la próxima.

   Las categorías se calculan con datos que la app ya tiene:
   tamaño del equipo (Mi Equipo) y conversiones del mes (Panel).
   ============================================================ */
(function(){
  'use strict';

  var CATEGORIAS = [
    { id: 'arranque',    nombre: 'Arranque',    icono: '🌱' },
    { id: 'constructor', nombre: 'Constructor', icono: '🔨' },
    { id: 'lider',       nombre: 'Líder',       icono: '⭐' },
    { id: 'director',    nombre: 'Director',    icono: '🏆' }
  ];

  var CRITERIOS = {
    constructor: '3 personas en el equipo o 2 conversiones en el mes',
    lider: '8 personas en el equipo y 4 conversiones en el mes',
    director: '20 personas en el equipo y 8 conversiones en el mes'
  };

  function uid(){
    return window.APPIAuth && window.APPIAuth.userId ? window.APPIAuth.userId() : '';
  }

  // Métricas reales: equipo cargado y conversiones del mes en curso.
  function datos(){
    var equipo = 0, conversiones = 0;
    try{
      var raw = JSON.parse(localStorage.getItem('equipoData') || 'null');
      equipo = raw && Array.isArray(raw.personas) ? raw.personas.length : 0;
    }catch(e){}
    try{
      var cache = JSON.parse(localStorage.getItem('appi_gestion_cache_v1_' + uid()) || 'null');
      var inicio = new Date(); inicio.setDate(1); inicio.setHours(0, 0, 0, 0);
      conversiones = (cache && Array.isArray(cache.contacts) ? cache.contacts : []).filter(function(c){
        if ((c.estado || '') !== 'convertido') return false;
        return new Date(c.updated_at || c.created_at || 0) >= inicio;
      }).length;
    }catch(e){}
    return { equipo: equipo, conversiones: conversiones };
  }

  // Categoría actual, siguiente y lo que falta, en criollo.
  function calcularCategoria(d){
    d = d || datos();
    var nivel = 0;
    if (d.equipo >= 3 || d.conversiones >= 2) nivel = 1;
    if (d.equipo >= 8 && d.conversiones >= 4) nivel = 2;
    if (d.equipo >= 20 && d.conversiones >= 8) nivel = 3;

    var actual = CATEGORIAS[nivel];
    var siguiente = CATEGORIAS[nivel + 1] || null;
    var faltantes = [];

    if (siguiente) {
      if (siguiente.id === 'constructor') {
        // Alcanza con uno de los dos caminos; se muestran los dos.
        if (d.equipo < 3) faltantes.push('camino equipo: ' + (3 - d.equipo) + ' persona' + (3 - d.equipo === 1 ? '' : 's') + ' más');
        if (d.conversiones < 2) faltantes.push('camino ventas: ' + (2 - d.conversiones) + (2 - d.conversiones === 1 ? ' conversión más' : ' conversiones más'));
      } else {
        var reqE = siguiente.id === 'lider' ? 8 : 20;
        var reqC = siguiente.id === 'lider' ? 4 : 8;
        if (d.equipo < reqE) faltantes.push((reqE - d.equipo) + ' persona' + (reqE - d.equipo === 1 ? '' : 's') + ' más en el equipo');
        if (d.conversiones < reqC) faltantes.push((reqC - d.conversiones) + (reqC - d.conversiones === 1 ? ' conversión más este mes' : ' conversiones más este mes'));
      }
    }

    return {
      equipo: d.equipo,
      conversiones: d.conversiones,
      actual: actual,
      siguiente: siguiente,
      criterio: siguiente ? CRITERIOS[ siguiente.id ] : '',
      faltantes: faltantes
    };
  }

  // ---------------- Fundadores: primeros 10 cupos ----------------
  function claveFundador(){ return 'appi_fundador_v1_' + uid(); }

  function fundadorGuardado(){
    try{
      var v = localStorage.getItem(claveFundador());
      if (v === 'lleno') return null;
      return v ? Number(v) : undefined;   // undefined = todavía no reclamó
    }catch(e){ return undefined; }
  }

  async function reclamarFundador(){
    if (!uid()) return null;
    var guardado = fundadorGuardado();
    if (guardado !== undefined) return guardado;
    try{
      var cfg = window.APPI_AUTH;
      var token = window.APPIAuth.accessToken();
      var r = await fetch(cfg.url + '/rest/v1/rpc/appi_reclamar_fundador', {
        method: 'POST',
        headers: { apikey: cfg.anonKey, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: '{}'
      });
      if (!r.ok) return null;
      var body = await r.json();
      var n = Array.isArray(body) ? body[0] : body;
      try{ localStorage.setItem(claveFundador(), n == null ? 'lleno' : String(n)); }catch(e){}
      return n == null ? null : Number(n);
    }catch(e){ return null; }
  }

  // ---------------- Panel en el home ----------------
  function estilo(){
    if (document.getElementById('lineaAscendenteStyle')) return;
    var s = document.createElement('style');
    s.id = 'lineaAscendenteStyle';
    s.textContent = '.linea-card{margin:8px 2px;padding:14px;border-radius:18px;background:linear-gradient(135deg,rgba(91,141,239,.12),rgba(139,99,232,.12));border:1px solid rgba(91,141,239,.25)}' +
      '.linea-top{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}' +
      '.linea-cat{display:flex;align-items:center;gap:7px;font-size:15px;font-weight:950;color:#3d63c9}' +
      '.linea-cat .ico{font-size:20px}' +
      '.linea-fundador{padding:4px 10px;border-radius:999px;background:linear-gradient(135deg,#f5b301,#ff8a00);color:#fff;font-size:10px;font-weight:950;box-shadow:0 4px 12px rgba(255,138,0,.35)}' +
      '.linea-metrics{margin-top:7px;font-size:11px;font-weight:800;color:#556277}' +
      'body.dark .linea-metrics{color:#b8b9c5}' +
      '.linea-next{margin-top:8px;padding:9px 11px;border-radius:12px;background:rgba(255,255,255,.65);font-size:11px;font-weight:750;color:#343441;line-height:1.45}' +
      'body.dark .linea-next{background:rgba(255,255,255,.07);color:#e6e6f0}' +
      '.linea-next b{color:#3d63c9}';
    document.head.appendChild(s);
  }

  var estadoFundador;   // número | null | undefined

  function htmlPanel(){
    estilo();
    var c = calcularCategoria();
    var fundador = estadoFundador;
    var next;
    if (!c.siguiente) {
      next = '🏆 Categoría máxima: tu línea ascendente llegó a la cima. Ahora, a construir sucesores.';
    } else if (!c.faltantes.length) {
      next = '🎉 ¡Cumpliste los requisitos de <b>' + c.siguiente.nombre + '</b>! ' + c.criterio + '.';
    } else {
      next = 'Para subir a <b>' + c.siguiente.nombre + '</b> (' + c.criterio + ') te falta: ' + c.faltantes.join(' · ') + '.';
    }
    return '<details class="home-section-block" id="lineaAscendenteBlock" open>' +
      '<summary class="mini-section-label"><span>📈</span> Línea Ascendente<em>⌄</em></summary>' +
      '<div class="linea-card">' +
        '<div class="linea-top">' +
          '<div class="linea-cat"><span class="ico">' + c.actual.icono + '</span>' + c.actual.nombre + '</div>' +
          (fundador ? '<span class="linea-fundador">👑 Fundador #' + fundador + ' · precio congelado</span>' : '') +
        '</div>' +
        '<div class="linea-metrics">👥 ' + c.equipo + ' en el equipo · 🎯 ' + c.conversiones + (c.conversiones === 1 ? ' conversión este mes' : ' conversiones este mes') + '</div>' +
        '<div class="linea-next">' + next + '</div>' +
      '</div>' +
    '</details>';
  }

  function renderLinea(){
    var list = document.getElementById('toolsList');
    if (!list || !uid()) return;
    var viejo = document.getElementById('lineaAscendenteBlock');
    if (viejo) viejo.remove();
    list.insertAdjacentHTML('afterbegin', htmlPanel());
  }

 // El render del home llama a render() al terminar (hook en index.html):
  // dibuja el panel y, apenas hay sesión, reclama el cupo una sola vez.
  function render(){
    if (!uid()) return;
    if (estadoFundador === undefined) iniciar();
    else renderLinea();
  }

  // Al iniciar sesión (o al cargar ya logueado), reclama el cupo y dibuja.
  async function iniciar(){
    if (!uid()) return;
    estadoFundador = await reclamarFundador();
    renderLinea();
  }

  window.APPILineaAscendente = {
    categorias: CATEGORIAS,
    datos: datos,
    calcularCategoria: calcularCategoria,
    reclamarFundador: reclamarFundador,
    render: render,
    iniciar: iniciar
  };

  setTimeout(iniciar, 0);
})();
