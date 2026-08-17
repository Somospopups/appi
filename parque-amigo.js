/* ============================================================
   APPI · Parque amigo (v242)
   ------------------------------------------------------------
   El parque (los hogares que ya tienen un equipo) es el tesoro
   del negocio, pero nadie lo explicaba con cariño. Ahora:

   1. Tarjeta viva en el inicio: cuántos hogares confían en vos
      y cuántas garantías vencidas son oportunidades de visita.
   2. Un tour de tres burbujas, la primera vez, que te lo muestra
      con ternura y te lleva de la mano hasta Usuarios.
   ============================================================ */
(function(){
  'use strict';
  function $(id){ return document.getElementById(id); }
  function equipo(){ try{ return JSON.parse(localStorage.getItem('equipoData') || 'null'); }catch(e){ return null; } }
  function tourKey(){ return 'appi_tour_parque_v1_' + (window.APPIAuth && window.APPIAuth.userId ? window.APPIAuth.userId() : 'anon'); }
  function tourVisto(){ try{ return localStorage.getItem(tourKey()) === '1'; }catch(e){ return true; } }
  function marcarVisto(){ try{ localStorage.setItem(tourKey(), '1'); }catch(e){} }

  function totals(){
    var eq = equipo();
    var t = { vendidas: 0, vencidas: 0, pendientes: 0 };
    function sumar(p){
      var g = p.garantias || {};
      t.vendidas += Number(g.vendidas) || 0;
      t.vencidas += Number(g.vencidas) || 0;
      t.pendientes += Number(g.pendientes) || 0;
      (p.hijos || []).forEach(sumar);
    }
    if (eq && Array.isArray(eq.personas)) eq.personas.forEach(sumar);
    return t;
  }

  function estilo(){
    if ($('parqueStyle')) return;
    var s = document.createElement('style');
    s.id = 'parqueStyle';
    s.textContent = '' +
      '.pq-card{margin:8px 2px;padding:14px;border-radius:18px;background:linear-gradient(135deg,rgba(58,208,164,.12),rgba(91,141,239,.12));border:1px solid rgba(58,208,164,.3)}' +
      '.pq-title{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:950;color:#168765}' +
      '.pq-nums{display:flex;gap:8px;margin:9px 0}' +
      '.pq-num{flex:1;text-align:center;padding:8px 4px;border-radius:14px;background:rgba(255,255,255,.7)}' +
      'body.dark .pq-num{background:rgba(255,255,255,.07)}' +
      '.pq-num b{display:block;font-size:17px;color:#3d63c9}' +
      '.pq-num span{font-size:8.5px;font-weight:900;color:#686977;letter-spacing:.4px}' +
      '.pq-txt{margin:0;font-size:11.5px;font-weight:700;color:#343441;line-height:1.5}' +
      'body.dark .pq-txt{color:#e6e6f0}' +
      '.pq-tour-btn{margin-top:9px;border:1px solid rgba(22,135,101,.3);border-radius:10px;padding:7px 11px;background:rgba(22,135,101,.08);color:#168765;font:inherit;font-size:11px;font-weight:850;cursor:pointer}' +
      '#pqOverlay{position:fixed;inset:0;z-index:12000;background:rgba(15,18,35,.55);backdrop-filter:blur(3px)}' +
      '.pq-bubble{position:fixed;z-index:12001;max-width:290px;padding:14px 15px;border-radius:18px;background:#fff;box-shadow:0 18px 50px rgba(10,20,60,.35);font-size:12.5px;font-weight:700;color:#343441;line-height:1.5}' +
      'body.dark .pq-bubble{background:#25273a;color:#f2f2f7}' +
      '.pq-bubble .pq-step{display:block;font-size:9px;font-weight:950;color:#168765;letter-spacing:.6px;margin-bottom:4px}' +
      '.pq-bubble .pq-actions{display:flex;gap:8px;margin-top:10px}' +
      '.pq-bubble .pq-next{flex:1;border:0;border-radius:11px;padding:9px;background:linear-gradient(135deg,#3ad0a4,#5b8def);color:#fff;font:inherit;font-size:12px;font-weight:900;cursor:pointer}' +
      '.pq-bubble .pq-skip{border:0;border-radius:11px;padding:9px 12px;background:rgba(80,90,130,.1);color:#666776;font:inherit;font-size:11px;font-weight:850;cursor:pointer}';
    document.head.appendChild(s);
  }

  function htmlCard(){
    var t = totals();
    var cuerpo;
    if (t.vendidas > 0) {
      cuerpo = '<div class="pq-txt"><b>' + t.vendidas + ' hogar' + (t.vendidas === 1 ? '' : 'es') + '</b> ya ' + (t.vendidas === 1 ? 'confía' : 'confían') + ' en vos. ' +
        (t.vencidas > 0
          ? 'Y ojo: <b>' + t.vencidas + ' garantía' + (t.vencidas === 1 ? '' : 's') + ' vencida' + (t.vencidas === 1 ? '' : 's') + '</b> no es un problema, es tu mejor excusa para volver a visitar. 💙'
          : 'Y con las garantías al día: momento perfecto para pedir referidos. 💙') + '</div>';
    } else {
      cuerpo = '<div class="pq-txt">Tu parque son los hogares que ya tienen un equipo tuyo: tu tesoro. Cargá las <b>Garantías por Organización</b> en Mi Equipo y conocelos uno por uno.</div>';
    }
    return '<details class="home-section-block" id="parqueBlock" open><summary class="mini-section-label"><span>🏡</span> Tu parque<em>⌄</em></summary><div class="pq-card">' +
      '<div class="pq-title">🏡 Tu parque</div>' +
      '<div class="pq-nums">' +
      '<div class="pq-num"><b>' + t.vendidas + '</b><span>HOGARES</span></div>' +
      '<div class="pq-num"><b>' + t.vencidas + '</b><span>GAR. VENCIDAS</span></div>' +
      '<div class="pq-num"><b>' + t.pendientes + '</b><span>PENDIENTES</span></div>' +
      '</div>' + cuerpo +
      '<button type="button" class="pq-tour-btn" id="pqTourBtn">🫧 Ver el mini tour</button>' +
      '</div></details>';
  }

  /* ---------------- el tour de burbujas ---------------- */
  var overlay = null, bubble = null;
  function cerrarTour(){
    if (overlay) { overlay.remove(); overlay = null; }
    if (bubble) { bubble.remove(); bubble = null; }
  }
  function paso(num, total, texto, target, onDone, ultimo){
    cerrarTour();
    overlay = document.createElement('div'); overlay.id = 'pqOverlay';
    bubble = document.createElement('div'); bubble.className = 'pq-bubble';
    bubble.innerHTML = '<span class="pq-step">PARQUE ' + num + '/' + total + '</span>' + texto +
      '<div class="pq-actions"><button type="button" class="pq-skip">Saltear</button><button type="button" class="pq-next">' + (ultimo ? '¡Listo! 💙' : 'Siguiente →') + '</button></div>';
    document.body.appendChild(overlay);
    document.body.appendChild(bubble);
    var colocar = function(){
      if (target && target.scrollIntoView) target.scrollIntoView({ block: 'center', behavior: 'instant' });
      var r = target && target.getBoundingClientRect ? target.getBoundingClientRect() : null;
      var bw = 290, bh = bubble.offsetHeight || 150;
      var x = 15, y = window.innerHeight / 2 - bh / 2;
      if (r && r.width) {
        x = Math.min(Math.max(10, r.left - 20), window.innerWidth - bw - 10);
        y = r.bottom + 12;
        if (y + bh > window.innerHeight - 10) y = Math.max(10, r.top - bh - 12);
        y = Math.min(Math.max(10, y), window.innerHeight - bh - 10);
      }
      bubble.style.left = x + 'px';
      bubble.style.top = y + 'px';
    };
    setTimeout(colocar, 60);
    bubble.querySelector('.pq-skip').onclick = function(){ marcarVisto(); cerrarTour(); };
    bubble.querySelector('.pq-next').onclick = function(){ if (onDone) onDone(); else { marcarVisto(); cerrarTour(); } };
  }

  function arrancarTour(){
    estilo();
    var card = $('parqueBlock');
    var paso1 = function(){
      paso(1, 3, 'Este es tu <b>parque</b>: cada equipo que pusiste en un hogar. No son números, son relaciones vivas que ya confían en vos. 🏡', card, function(){
        var acceso = document.querySelector('[onclick*="view-usuarios"], [data-ds="view-usuarios"]');
        paso(2, 3, 'Metete acá para verlo casa por casa: quién tiene qué equipo y <b>qué día vence su garantía</b>.', acceso, function(){
          if (typeof window.showView === 'function') window.showView('view-usuarios');
          setTimeout(function(){
            var kpi = document.querySelector('#view-usuarios .stat-card') || $('view-usuarios');
            paso(3, 3, 'Vencida o por vencer = <b>oportunidad de visita</b>. Ahí nace la fidelidad, el servicio… y el próximo referidos. 💙', kpi, null, true);
          }, 500);
        });
      });
    };
    paso1();
  }
  window.arrancarTourParque = arrancarTour;

  function inyectar(){
    estilo();
    if ($('parqueBlock')) { var viejo = $('parqueBlock'); viejo.outerHTML = htmlCard(); }
    else {
      var ancla = $('gpsBlock') || $('carreraBlock');
      if (ancla) ancla.insertAdjacentHTML('afterend', htmlCard());
      else return;
    }
    var btn = $('pqTourBtn');
    if (btn) btn.onclick = arrancarTour;
    if (!tourVisto() && !window.__parqueTourHecho) {
      window.__parqueTourHecho = true;
      setTimeout(arrancarTour, 900);
    }
  }

  function envolver(){
    if (window.__parqueWrapped) return;
    if (typeof window.showView !== 'function') return;
    window.__parqueWrapped = true;
    var orig = window.renderHomeCompleto;
    if (typeof orig === 'function') {
      window.renderHomeCompleto = function(){ var r = orig.apply(this, arguments); try{ inyectar(); }catch(e){} return r; };
    }
    try{ inyectar(); }catch(e){}
  }
  if (document.readyState === 'complete') envolver();
  else window.addEventListener('load', envolver);
  setTimeout(envolver, 1200);
})();
