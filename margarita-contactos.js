/* ============================================================
   APPI · Mi Margarita
   ------------------------------------------------------------
   Convierte los círculos cotidianos del distribuidor en grupos de
   contacto para demostraciones, presentaciones y referidos.
   Los contactos se eligen con Contact Picker cuando el teléfono lo
   permite, o desde la Agenda Personal de APPI.
   ============================================================ */
(function(){
  'use strict';

  var KEY_PREFIX = 'appi_margarita_contactos_v1_';
  var MAX_GRUPOS = 8;
  var accionActiva = 'Demostración';
  var gruposBase = [
    { id:'amigos', label:'Amigos', icon:'☀️' },
    { id:'vecinos', label:'Vecinos', icon:'🏡' },
    { id:'padres', label:'Padres del cole', icon:'🎒' },
    { id:'gimnasio', label:'Gimnasio', icon:'💪' },
    { id:'familia', label:'Familia', icon:'♡' },
    { id:'trabajo', label:'Trabajo', icon:'✦' },
    { id:'comunidad', label:'Comunidad', icon:'⌂' },
    { id:'clientes', label:'Clientes PSA', icon:'💧' }
  ];

  function uid(){
    try { return (window.APPIAuth && window.APPIAuth.userId && window.APPIAuth.userId()) || 'local'; }
    catch(e){ return 'local'; }
  }
  function key(){ return KEY_PREFIX + uid(); }
  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }
  function slug(s){
    return String(s || '').toLocaleLowerCase('es-AR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,22) || 'grupo';
  }
  function nombreDistribuidor(){
    try {
      var p = window.APPIAuth && window.APPIAuth.activePerson && window.APPIAuth.activePerson();
      var raw = p && p.nombre || (window.APPIAuth && window.APPIAuth.currentProfile && window.APPIAuth.currentProfile() || {}).nombre || 'Tu nombre';
      return String(raw || 'Tu nombre').trim().split(/\s+/)[0].slice(0,18) || 'Tu nombre';
    } catch(e){ return 'Tu nombre'; }
  }
  function clonarGrupos(){ return gruposBase.map(function(g){ return { id:g.id, label:g.label, icon:g.icon }; }); }
  function normalizar(state){
    state = state && typeof state === 'object' ? state : {};
    if (!Array.isArray(state.grupos) || state.grupos.length !== MAX_GRUPOS) state.grupos = clonarGrupos();
    state.grupos = state.grupos.map(function(g, i){
      var base = gruposBase[i] || {};
      return {
        id: slug(g && g.id || base.id || ('grupo-'+i)),
        label: String(g && g.label || base.label || 'Mi grupo').slice(0,24),
        icon: String(g && g.icon || base.icon || '✦').slice(0,3)
      };
    });
    // Evita ids duplicados aunque la persona renombre dos pétalos igual.
    var vistos = {};
    state.grupos.forEach(function(g, i){
      var original = g.id || ('grupo-'+i), n = original, x = 2;
      while(vistos[n]){ n = original + '-' + x; x++; }
      vistos[n] = true; g.id = n;
    });
    if (!state.contactos || typeof state.contactos !== 'object') state.contactos = {};
    state.grupos.forEach(function(g){
      var lista = state.contactos[g.id];
      state.contactos[g.id] = Array.isArray(lista) ? lista.filter(function(c){ return c && c.nombre; }).map(function(c){
        return { id:String(c.id || c.telefono || c.nombre), nombre:String(c.nombre).slice(0,120), telefono:String(c.telefono || '').slice(0,35) };
      }) : [];
    });
    if (!state.nombre) state.nombre = nombreDistribuidor();
    return state;
  }
  function cargar(){
    try { return normalizar(JSON.parse(localStorage.getItem(key()) || '{}')); }
    catch(e){ return normalizar({}); }
  }
  function guardar(state){
    try { localStorage.setItem(key(), JSON.stringify(normalizar(state))); }catch(e){}
    try { window.dispatchEvent(new Event('appi-margarita-updated')); }catch(e){}
    try { if (typeof window.renderHomeCompleto === 'function') window.renderHomeCompleto(); }catch(e){}
  }
  function total(state){
    return state.grupos.reduce(function(n,g){ return n + (state.contactos[g.id] || []).length; },0);
  }
  function grupo(state, id){ return state.grupos.filter(function(g){ return g.id === id; })[0] || null; }
  function iniciales(nombre){
    return String(nombre || '?').trim().split(/\s+/).slice(0,2).map(function(x){ return x.charAt(0).toUpperCase(); }).join('') || '?';
  }
  function candidatosAgenda(){
    try {
      var lista = window.APPIAgendaPersonal && window.APPIAgendaPersonal.lista ? window.APPIAgendaPersonal.lista() : [];
      return (lista || []).filter(function(c){ return c && c.nombre; }).map(function(c){
        return { id:String(c.id || c.tel_norm || c.telefono || c.nombre), nombre:String(c.nombre), telefono:String(c.telefono || '') };
      });
    }catch(e){ return []; }
  }
  function mostrarToast(texto){
    if (typeof window.showToast === 'function') { window.showToast(texto, 2500); return; }
    var t = document.getElementById('mgToast');
    if (!t) return;
    t.textContent = texto; t.classList.add('show'); clearTimeout(mostrarToast.t); mostrarToast.t = setTimeout(function(){ t.classList.remove('show'); }, 2500);
  }

  function css(){
    if (document.getElementById('mgEstilos')) return;
    var st = document.createElement('style'); st.id = 'mgEstilos';
    st.textContent = [
      '#view-margarita{min-height:100vh;background:transparent}',
      '.mg-wrap{max-width:1060px;margin:0 auto;padding:0 14px calc(90px + env(safe-area-inset-bottom))}.mg-hero{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;padding:4px 5px 10px}.mg-kicker{display:inline-flex;align-items:center;gap:6px;color:#0d8576;font-size:9px;font-weight:1000;letter-spacing:1px}.mg-kicker:before{content:"";width:18px;height:2px;border-radius:4px;background:#1bb49d}.mg-hero h2{margin:2px 0 0;color:#153a51;font-size:31px;line-height:1.04;letter-spacing:-1.25px}.mg-hero h2 em{font-style:normal;color:#119884}.mg-hero p{max-width:510px;margin:4px 0 0;color:#698292;font-size:12px;line-height:1.45;font-weight:650}.mg-hero-actions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end;padding-top:9px}.mg-chip{padding:7px 10px;border:1px solid rgba(30,101,116,.1);border-radius:999px;background:rgba(255,255,255,.67);color:#5d7887;font-size:9px;font-weight:900}.mg-chip b{color:#107f71}',
      '.mg-layout{display:grid;grid-template-columns:minmax(420px,1fr) minmax(265px,.55fr);gap:19px;align-items:center}.mg-garden{position:relative;padding:16px 14px 16px;border:1px solid rgba(255,255,255,.9);border-radius:31px;background:radial-gradient(ellipse at 13% 5%,rgba(255,255,255,.96) 0 12%,transparent 39%),radial-gradient(ellipse at 84% 10%,rgba(177,220,245,.58),transparent 43%),radial-gradient(ellipse at 24% 92%,rgba(213,237,255,.7),transparent 45%),linear-gradient(145deg,rgba(236,248,255,.96),rgba(202,229,247,.88) 50%,rgba(238,247,255,.95));box-shadow:0 19px 48px rgba(20,76,92,.16),inset 0 1px 0 rgba(255,255,255,.8);backdrop-filter:blur(14px) saturate(125%);-webkit-backdrop-filter:blur(14px) saturate(125%);overflow:hidden}.mg-garden:before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 38% 35%,rgba(255,255,255,.46),transparent 31%),radial-gradient(ellipse at 68% 77%,rgba(255,255,255,.33),transparent 38%);opacity:.9;pointer-events:none}.mg-garden-head{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 3px}.mg-garden-head b{color:#244657;font-size:13px}.mg-garden-head span{color:#708997;font-size:10px;font-weight:800}.mg-garden-head span strong{color:#119280}.mg-edit-groups{border:0;border-radius:10px;padding:7px 9px;background:#e7faf3;color:#108673;font:inherit;font-size:9px;font-weight:950;cursor:pointer}',
      '.mg-stage{position:relative;z-index:1;width:min(100%,505px);height:440px;transform:scale(.86);transform-origin:center top;margin:46px auto -20px}.mg-orbit{position:absolute;left:50%;top:50%;width:346px;height:346px;transform:translate(-50%,-48%);border:1px dashed rgba(16,136,122,.2);border-radius:50%;animation:mgSpin 44s linear infinite}.mg-orbit:before,.mg-orbit:after{content:"";position:absolute;border-radius:50%;background:#70ddbd;box-shadow:0 0 0 5px rgba(112,221,189,.17)}.mg-orbit:before{width:7px;height:7px;left:17%;top:3%}.mg-orbit:after{width:5px;height:5px;right:8%;bottom:16%}@keyframes mgSpin{to{transform:translate(-50%,-48%) rotate(360deg)}}.mg-flower{position:absolute;left:50%;top:50%;width:0;height:0;transform:translate(-50%,-47%)}',
      '.mg-petal{position:absolute;left:-54px;top:-175px;width:108px;height:175px;padding:0;background:transparent;border:none;transform-origin:50% 100%;border-radius:54px 54px 38px 38px / 80px 80px 38px 38px;filter:drop-shadow(0 10px 18px rgba(15,75,90,.14));overflow:visible;cursor:pointer;z-index:2}.mg-petal-shape{position:absolute;inset:0;border:1.2px solid rgba(35,108,125,.14);border-radius:52px 52px 42px 42px / 80px 80px 38px 38px;background:linear-gradient(160deg,#ffffff 0%,#fbfdfc 55%,#eaf6f2 100%);box-shadow:inset 0 3px 6px rgba(255,255,255,.98),0 2px 8px rgba(18,92,104,.06);transition:transform .28s cubic-bezier(.2,1.2,.3,1),border-color .25s,background .25s;transform-origin:50% 100%;animation:mgPetalShapeIn .68s calc(var(--i)*.055s) cubic-bezier(.18,1.35,.4,1) both}.mg-petal:after{content:"";position:absolute;left:50%;bottom:11px;width:20px;height:20px;transform:translateX(-50%);border-radius:50%;background:rgba(129,224,191,.23);filter:blur(7px);transition:.25s}.mg-petal-content{position:absolute;z-index:1;left:7px;right:7px;top:41px;display:grid;justify-items:center;gap:4px;transform:rotate(var(--counter));color:#153f52;text-align:center;transform-origin:50% 50%;animation:mgPetalContentIn .68s calc(var(--i)*.055s) cubic-bezier(.18,1.35,.4,1) both}.mg-petal-content i{display:grid;place-items:center;width:29px;height:29px;border-radius:10px;background:#e6faf4;color:#15947e;font-size:15px;font-style:normal}.mg-petal-content b{display:block;max-width:100%;font-size:11.5px;line-height:1.06;letter-spacing:-.22px;overflow-wrap:anywhere;text-shadow:0 1px 0 rgba(255,255,255,.9)}.mg-petal-content small{display:flex;align-items:center;gap:3px;color:#587b88;font-size:8.7px;font-weight:900;text-shadow:0 1px 0 rgba(255,255,255,.9)}.mg-petal-content small:before{content:"";width:5px;height:5px;border-radius:50%;background:#39c99c}.mg-petal:hover .mg-petal-shape,.mg-petal.has-contacts .mg-petal-shape{transform:translateY(-7px) scale(1.068);border-color:#60cdb4;background:linear-gradient(145deg,#fffdf4,#fff7e8 66%,#f5dfae)}.mg-petal:hover:after,.mg-petal.has-contacts:after{background:#f3bd3d}.mg-petal:hover .mg-petal-content i,.mg-petal.has-contacts .mg-petal-content i{background:#159d89;color:#fff}@keyframes mgPetalShapeIn{from{opacity:0;transform:scale(.35)}to{opacity:1;transform:scale(1)}}@keyframes mgPetalBreeze{50%{transform:translateY(-4px)}}@keyframes mgPetalContentIn{from{opacity:0;transform:rotate(var(--counter)) scale(.35)}to{opacity:1;transform:rotate(var(--counter)) scale(1)}}@keyframes mgPetalContentBreeze{50%{transform:rotate(var(--counter)) translateY(-4px)}}',
      '.mg-center{position:absolute;z-index:8;left:0;top:0;width:151px;height:151px;transform:translate(-50%,-50%);display:grid;place-items:center;border:8px solid #ffdf73;border-radius:50%;background:radial-gradient(circle at 33% 28%,#fff1a5 0 5%,#ffc848 26%,#f0a82c 70%,#da8b17);box-shadow:0 0 0 7px rgba(255,255,255,.95),0 18px 32px rgba(177,118,15,.22),inset -9px -10px 13px rgba(151,83,5,.18);animation:mgCenter 4.6s ease-in-out infinite}.mg-center:after{content:"";position:absolute;inset:14px;border:1px dashed rgba(121,76,8,.32);border-radius:50%;animation:mgSpin 20s linear infinite}.mg-center-inner{position:relative;z-index:1;width:100px;color:#80500a;text-align:center}.mg-center small{display:block;color:#8b621c;font-size:8px;font-weight:950;letter-spacing:.7px}.mg-name{display:block;max-width:99px;margin:3px auto 0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-size:18px;font-weight:1000;letter-spacing:-.8px}.mg-center em{display:block;margin-top:2px;color:#915c0d;font-size:8px;font-style:normal;font-weight:800}@keyframes mgCenter{50%{box-shadow:0 0 0 9px rgba(255,255,255,.95),0 22px 37px rgba(177,118,15,.27),inset -9px -10px 13px rgba(151,83,5,.18)}}.mg-garden-foot{position:relative;z-index:2;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:0;color:#6c8794;font-size:10px;font-weight:750;text-align:center}.mg-garden-foot i{display:grid;place-items:center;width:22px;height:22px;border-radius:50%;background:#ddfaf0;color:#0b967e;font-style:normal}',
      '.mg-side{display:grid;gap:11px}.mg-card{padding:17px;border:1px solid rgba(255,255,255,.9);border-radius:22px;background:rgba(255,255,255,.78);box-shadow:0 12px 28px rgba(36,83,102,.08)}.mg-card h3{margin:0;color:#203d51;font-size:16px;letter-spacing:-.45px}.mg-card p{margin:5px 0 0;color:#79909d;font-size:11px;line-height:1.4;font-weight:600}.mg-action-list{display:grid;gap:7px;margin-top:13px}.mg-action{display:flex;align-items:center;gap:10px;width:100%;min-height:52px;padding:8px;border:1px solid #e1ecec;border-radius:15px;background:#fff;color:#395a68;text-align:left;transition:.2s}.mg-action.active,.mg-action:hover{transform:translateX(-2px);border-color:#74cfbb;background:#f2fff9;box-shadow:0 7px 15px rgba(21,142,120,.09)}.mg-action i{display:grid;place-items:center;width:35px;height:35px;border-radius:12px;background:#e8faf4;font-size:17px;font-style:normal}.mg-action b{display:block;font-size:11px}.mg-action small{display:block;margin-top:1px;color:#8096a1;font-size:9px;font-weight:700}.mg-action span:last-child{margin-left:auto;color:#55bba3;font-size:18px}.mg-growth{position:relative;overflow:hidden;background:linear-gradient(135deg,#0a5a79,#118d8c);color:#fff}.mg-growth:after{content:"";position:absolute;width:180px;height:180px;right:-90px;top:-94px;border:29px solid rgba(182,255,235,.13);border-radius:50%}.mg-growth h3{position:relative;z-index:1;color:#fff}.mg-growth p{position:relative;z-index:1;color:#d3fffa}.mg-number{position:relative;z-index:1;display:flex;align-items:end;gap:11px;margin-top:13px}.mg-number strong{font-size:36px;line-height:.9;letter-spacing:-1.8px}.mg-number span{font-size:10px;line-height:1.25;color:#c6fdf6;font-weight:750}.mg-progress{position:relative;z-index:1;height:7px;margin-top:14px;border-radius:99px;background:rgba(255,255,255,.24);overflow:hidden}.mg-progress i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#ffdf71,#fff7c5);transition:width .35s}',
      '.mg-modal{position:fixed;z-index:46000;inset:0;display:none;align-items:end;justify-content:center;padding:14px;background:rgba(2,28,48,.38);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px)}.mg-modal.open{display:flex}.mg-sheet{width:min(100%,565px);max-height:min(83vh,680px);overflow:auto;border:1px solid rgba(255,255,255,.82);border-radius:28px;background:#f9fffd;box-shadow:0 -18px 55px rgba(3,30,47,.27);animation:mgSheet .4s cubic-bezier(.22,1.27,.33,1)}@keyframes mgSheet{from{opacity:0;transform:translateY(75px) scale(.96)}to{opacity:1;transform:none}}.mg-sheet-head{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;padding:2px 4px 8px;background:linear-gradient(to bottom,#f9fffd 75%,rgba(249,255,253,.9))}.mg-sheet-title{display:flex;align-items:center;gap:10px}.mg-sheet-title i{display:grid;place-items:center;width:37px;height:37px;border-radius:13px;background:#dff8ef;color:#0b8d79;font-size:18px;font-style:normal}.mg-sheet-title b{display:block;font-size:16px;letter-spacing:-.35px}.mg-sheet-title small{display:block;margin-top:1px;color:#748e9b;font-size:10px;font-weight:700}.mg-close{display:grid;place-items:center;width:35px;height:35px;border:0;border-radius:12px;background:#e8f2f2;color:#66818e;font-size:19px}.mg-sheet-body{padding:0 19px 20px}.mg-input{width:100%;height:43px;padding:10px 12px;border:1px solid #d9e9e7;border-radius:13px;outline:none;background:#fff;color:#294b5d;font:inherit;font-size:12px;font-weight:800}.mg-input:focus{border-color:#4fc5ab;box-shadow:0 0 0 3px rgba(79,197,171,.13)}.mg-help{margin:10px 0;color:#748c9a;font-size:10px;line-height:1.45;font-weight:700}.mg-picker-tools{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:11px 0}.mg-picker-tools button{min-height:40px;border:0;border-radius:12px;background:#e7f8f2;color:#118473;font:inherit;font-size:10px;font-weight:950}.mg-picker-tools button:last-child{background:#edf4f4;color:#58747f}.mg-contact-list{display:grid;gap:7px}.mg-contact{display:flex;align-items:center;gap:10px;width:100%;padding:9px 10px;border:1px solid #dfebeb;border-radius:15px;background:#fff;color:#29485a;text-align:left}.mg-contact.chosen{border-color:#6dceb3;background:#f2fff9}.mg-avatar{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:linear-gradient(145deg,#b9efdf,#73d7bd);color:#126d65;font-size:11px;font-weight:1000}.mg-contact b{display:block;font-size:11px}.mg-contact small{display:block;margin-top:2px;color:#7c94a0;font-size:9px;font-weight:700}.mg-check{display:grid;place-items:center;width:21px;height:21px;margin-left:auto;border:2px solid #c5d9d9;border-radius:8px;color:#fff;font-size:12px}.mg-contact.chosen .mg-check{border-color:#1aaa89;background:#1aaa89}.mg-empty{padding:21px 12px;border:1px dashed #bedbd6;border-radius:15px;background:#f2fbf8;color:#63808b;font-size:11px;line-height:1.5;text-align:center}.mg-sheet-actions{display:flex;gap:8px;margin-top:14px}.mg-sheet-actions button{flex:1;min-height:45px;border:0;border-radius:13px;font:inherit;font-size:12px;font-weight:950}.mg-secondary{background:#eaf3f3;color:#53717e}.mg-primary{color:#fff;background:linear-gradient(135deg,#0b877e,#31c29f);box-shadow:0 7px 14px rgba(19,156,124,.22)}.mg-edit-list{display:grid;gap:8px}.mg-edit-row{display:grid;grid-template-columns:42px 1fr;gap:8px;align-items:center;padding:8px;border:1px solid #dfeeed;border-radius:14px;background:#fff}.mg-edit-row select{height:36px;border:0;border-radius:10px;background:#e6faf3;color:#138673;font-size:16px;text-align:center}.mg-edit-row input{height:36px;padding:8px 9px;border:0;outline:0;background:transparent;color:#29485a;font:inherit;font-size:11px;font-weight:850}',
      '.mg-toast{position:fixed;z-index:47000;left:50%;bottom:20px;padding:11px 15px;border-radius:15px;background:#143d55;color:#fff;font-size:11px;font-weight:800;box-shadow:0 12px 28px rgba(3,30,47,.25);transform:translate(-50%,100px);opacity:0;transition:.34s cubic-bezier(.2,1.3,.3,1)}.mg-toast.show{transform:translate(-50%,0);opacity:1}body.dark #view-margarita{background:transparent}body.dark .mg-hero h2,body.dark .mg-card h3,body.dark .mg-garden-head b{color:#edf6f5}body.dark .mg-hero p,body.dark .mg-card p,body.dark .mg-garden-head span,body.dark .mg-garden-foot{color:#a9bfca}body.dark .mg-garden,body.dark .mg-card{border-color:rgba(255,255,255,.1);background:rgba(38,48,61,.8)}body.dark .mg-action,body.dark .mg-edit-row,body.dark .mg-contact{background:#2d3746;border-color:rgba(255,255,255,.1);color:#eaf4f4}body.dark .mg-action small,body.dark .mg-contact small{color:#adc3cb}body.dark .mg-sheet{background:#202b35}body.dark .mg-sheet-head{background:linear-gradient(to bottom,#202b35 75%,rgba(32,43,53,.9))}body.dark .mg-sheet-title b{color:#f1f8f8}body.dark .mg-input{background:#2d3746;border-color:rgba(255,255,255,.1);color:#f2fbfa}',
      '@media(max-width:820px){.mg-hero{display:block}.mg-hero-actions{justify-content:flex-start}.mg-layout{grid-template-columns:1fr;max-width:590px}.mg-side{grid-template-columns:1fr 1fr}}@media(max-width:515px){.mg-wrap{padding:2px 7px calc(95px + env(safe-area-inset-bottom))}.mg-hero{padding:10px 10px 13px}.mg-hero h2{font-size:27px}.mg-hero p{font-size:11.5px}.mg-hero-actions{display:none}.mg-layout{gap:10px}.mg-garden{min-height:515px;padding:13px 7px;border-radius:25px}.mg-stage{height:384px;transform:scale(.84);transform-origin:center top;margin:12px auto 0}.mg-garden-head{padding:0 7px}.mg-garden-head span{font-size:9px}.mg-side{grid-template-columns:1fr;gap:8px}.mg-card{padding:14px;border-radius:19px}.mg-growth{display:none}.mg-modal{padding:7px}.mg-sheet{border-radius:24px}.mg-sheet-body{padding:0 14px 16px}.mg-sheet-head{padding:15px 14px 11px}}@media(prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;transition-duration:.01ms!important}}'
    ].join('');
    document.head.appendChild(st);
  }

  function modal(){
    var el = document.getElementById('mgModal');
    if (el) return el;
    el = document.createElement('div'); el.id = 'mgModal'; el.className = 'mg-modal';
    el.innerHTML = '<section class="mg-sheet" id="mgSheet" role="dialog" aria-modal="true"></section>';
    el.addEventListener('click', function(e){ if(e.target === el) cerrarModal(); });
    document.body.appendChild(el);
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') cerrarModal(); });
    return el;
  }
  function abrirModal(html){ css(); modal().querySelector('#mgSheet').innerHTML = html; modal().classList.add('open'); }
  function cerrarModal(){ var el=document.getElementById('mgModal'); if(el) el.classList.remove('open'); }
  function cabecera(g, texto){
    return '<header class="mg-sheet-head"><div class="mg-sheet-title"><i>' + esc(g.icon || '✦') + '</i><div><b>' + esc(g.label || 'Mi margarita') + '</b><small>' + esc(texto || '') + '</small></div></div><button type="button" class="mg-close" id="mgClose" aria-label="Cerrar">×</button></header>';
  }

  function render(){
    css();
    var host = document.getElementById('margaritaCont'); if(!host) return;
    var state = cargar(), n = total(state);
        var petals = state.grupos.map(function(g, i){
      var count = (state.contactos[g.id] || []).length;
      var label = esc(g.label);
      return '<button type="button" class="mg-petal ' + (count ? 'has-contacts' : '') + '" style="--angle:' + (i * 45) + 'deg;--counter:-' + (i * 45) + 'deg;--i:' + i + '" data-mg-group="' + esc(g.id) + '">' +
        '<span class="mg-petal-shape"></span>' +
        '<span class="mg-petal-content">' +
          '<i>' + esc(g.icon) + '</i>' +
          '<b>' + label + '</b>' +
          '<small>' + count + ' persona' + (count===1?'':'s') + '</small>' +
        '</span>' +
      '</button>';
    }).join('');
    host.innerHTML =
      '<div class="mg-wrap"><section class="mg-hero"><div><span class="mg-kicker">MI GENTE · EN FLOR</span><h2>Tu negocio empieza<br>por <em>tu mundo.</em></h2><p>Mirar con cariño a las personas que ya tenés cerca convierte vínculos reales en conversaciones con propósito.</p></div><div class="mg-hero-actions"><span class="mg-chip"><b>✦ Tocá</b> un pétalo</span><span class="mg-chip"><b>＋ Elegí</b> contactos</span><span class="mg-chip"><b>→ Activá</b> una acción</span></div></section>' +
      '<div class="mg-layout"><section class="mg-garden"><div class="mg-garden-head"><b>Tu margarita de contactos</b><span><strong>' + n + '</strong> personas elegidas</span><button type="button" class="mg-edit-groups" id="mgEditGroups">✎ Editar pétalos</button></div><div class="mg-stage"><div class="mg-orbit"></div><div class="mg-flower">' + petals + '<button type="button" class="mg-center" id="mgEditName"><span class="mg-center-inner"><small>LA MARGARITA DE</small><span class="mg-name">' + esc(state.nombre) + '</span><em>tocá para editar</em></span></button></div></div><div class="mg-garden-foot"><i>✦</i> Cada pétalo puede convertirse en una conversación que abra una oportunidad.</div></section>' +
      '<aside class="mg-side"><section class="mg-card"><h3>¿Qué querés sembrar hoy?</h3><p>Elegí una acción y después el pétalo que mejor la acompañe.</p><div class="mg-action-list">' + accionesHTML() + '</div></section><section class="mg-card mg-growth"><h3>Tu jardín está creciendo</h3><p>Personas cercanas, oportunidades reales.</p><div class="mg-number"><strong>' + n + '</strong><span>contactos<br>en tu margarita</span></div><div class="mg-progress"><i style="width:' + Math.min(100,Math.max(8,n*12)) + '%"></i></div></section></aside></div></div>' +
      '<div class="mg-toast" id="mgToast"></div>';
    host.querySelectorAll('[data-mg-group]').forEach(function(b){ b.onclick=function(){ abrirGrupo(b.getAttribute('data-mg-group')); }; });
    host.querySelectorAll('[data-mg-action]').forEach(function(b){ b.onclick=function(){ accionActiva=b.getAttribute('data-mg-action'); render(); mostrarToast('Acción elegida: ' + accionActiva); }; });
    document.getElementById('mgEditGroups').onclick = editarGrupos;
    document.getElementById('mgEditName').onclick = editarNombre;
  }
  function accionesHTML(){
    var list = [ ['Demostración','💧','Mostrá una solución real'], ['Presentación de negocio','🚀','Compartí la oportunidad'], ['Pedir un referido','🗣️','Hacé crecer tu círculo'] ];
    return list.map(function(a){ return '<button type="button" class="mg-action ' + (accionActiva===a[0]?'active':'') + '" data-mg-action="' + esc(a[0]) + '"><i>' + a[1] + '</i><span><b>' + esc(a[0]) + '</b><small>' + esc(a[2]) + '</small></span><span>›</span></button>'; }).join('');
  }
  function editarNombre(){
    var state = cargar();
    if (!window.APPIDialog || !window.APPIDialog.prompt) return;
    window.APPIDialog.prompt('Escribí el nombre que querés ver en el centro de tu margarita.', state.nombre, { title:'Tu margarita', icon:'✿', okText:'Guardar', placeholder:'Tu nombre' }).then(function(valor){
      valor = String(valor || '').trim().slice(0,30); if(!valor) return; state.nombre=valor.split(/\s+/)[0]; guardar(state); render();
    });
  }
  function editarGrupos(){
    var state = cargar();
    var opciones = ['☀️','🏡','🎒','💪','♡','✦','⌂','💧','🌱','☕','🎨','🎵'];
    var rows = state.grupos.map(function(g){ return '<label class="mg-edit-row"><select data-mg-icon="' + esc(g.id) + '">' + opciones.map(function(o){ return '<option ' + (o===g.icon?'selected':'') + '>' + o + '</option>'; }).join('') + '</select><input maxlength="24" data-mg-label="' + esc(g.id) + '" value="' + esc(g.label) + '"></label>'; }).join('');
    abrirModal(cabecera({icon:'✎',label:'Editar pétalos'},'Nombrá tus círculos como te resulte natural') + '<div class="mg-sheet-body"><p class="mg-help">Cada pétalo es un grupo de personas. Podés cambiar su nombre y su ícono cuando quieras.</p><div class="mg-edit-list">' + rows + '</div><div class="mg-sheet-actions"><button type="button" class="mg-secondary" id="mgCancelEdit">Cancelar</button><button type="button" class="mg-primary" id="mgSaveEdit">Guardar pétalos</button></div></div>');
    document.getElementById('mgClose').onclick = cerrarModal;
    document.getElementById('mgCancelEdit').onclick = cerrarModal;
    document.getElementById('mgSaveEdit').onclick = function(){
      state.grupos.forEach(function(g){ var l=document.querySelector('[data-mg-label="' + g.id + '"]'), i=document.querySelector('[data-mg-icon="' + g.id + '"]'); if(l && l.value.trim()) g.label=l.value.trim().slice(0,24); if(i) g.icon=i.value; });
      guardar(state); cerrarModal(); render(); mostrarToast('Tus pétalos quedaron actualizados ✿');
    };
  }

  function abrirGrupo(id){
    var state=cargar(), g=grupo(state,id); if(!g) return;
    var seleccion = (state.contactos[id] || []).slice();
    var candidatos = candidatosAgenda();
    function keyContacto(c){ return String(c.id || c.telefono || c.nombre); }
    function esta(c){ var k=keyContacto(c); return seleccion.some(function(x){ return keyContacto(x)===k; }); }
    function pintar(filtro){
      filtro=String(filtro||'').toLocaleLowerCase('es-AR');
      var list=candidatos.filter(function(c){ return !filtro || (c.nombre+' '+c.telefono).toLocaleLowerCase('es-AR').indexOf(filtro)>=0; });
      var contenido = list.length ? list.map(function(c){ var chosen=esta(c); return '<button type="button" class="mg-contact ' + (chosen?'chosen':'') + '" data-mg-contact="' + esc(keyContacto(c)) + '"><span class="mg-avatar">' + esc(iniciales(c.nombre)) + '</span><span><b>' + esc(c.nombre) + '</b><small>' + esc(c.telefono || 'Contacto de tu agenda') + '</small></span><span class="mg-check">✓</span></button>'; }).join('') : '<div class="mg-empty">Todavía no tenés contactos en tu Agenda APPI.<br>Podés abrir el selector del teléfono o cargar/importar la agenda desde APPI.</div>';
      document.getElementById('mgCandidateList').innerHTML=contenido;
      document.querySelectorAll('[data-mg-contact]').forEach(function(b){ b.onclick=function(){ var c=candidatos.filter(function(x){return keyContacto(x)===b.getAttribute('data-mg-contact');})[0]; if(!c)return; if(esta(c))seleccion=seleccion.filter(function(x){return keyContacto(x)!==keyContacto(c);}); else seleccion.push(c); pintar(document.getElementById('mgSearch').value); }; });
    }
    abrirModal(cabecera(g,'Elegí personas para este pétalo') + '<div class="mg-sheet-body"><input class="mg-input" id="mgSearch" placeholder="Buscar en tu Agenda APPI"><div class="mg-picker-tools"><button type="button" id="mgPhone">📱 Elegir del teléfono</button><button type="button" id="mgGoAgenda">📒 Ver mi Agenda APPI</button></div><p class="mg-help">Los contactos seleccionados quedan en este grupo. Elegí después una acción para convertirlos en una próxima conversación.</p><div class="mg-contact-list" id="mgCandidateList"></div><div class="mg-sheet-actions"><button type="button" class="mg-secondary" id="mgCancelPick">Volver</button><button type="button" class="mg-primary" id="mgSavePick">Guardar selección</button></div></div>');
    document.getElementById('mgClose').onclick=cerrarModal; document.getElementById('mgCancelPick').onclick=cerrarModal;
    document.getElementById('mgSearch').oninput=function(){ pintar(this.value); };
    document.getElementById('mgGoAgenda').onclick=function(){ cerrarModal(); if(typeof window.openMiGestion==='function')window.openMiGestion(); else if(typeof window.showView==='function')window.showView('view-gestion'); };
    document.getElementById('mgPhone').onclick=function(){ elegirTelefono(seleccion, function(){ pintar(document.getElementById('mgSearch').value); }); };
    document.getElementById('mgSavePick').onclick=function(){ state.contactos[id]=seleccion; guardar(state); cerrarModal(); render(); var n=seleccion.length; mostrarToast(n ? n+' persona'+(n===1?'':'s')+' lista'+(n===1?'':'s')+' para '+accionActiva.toLocaleLowerCase('es-AR') : 'Pétalo actualizado'); };
    pintar('');
  }
  async function elegirTelefono(seleccion, alVolver){
    var picker=navigator.contacts;
    if(!picker || typeof picker.select!=='function'){
      if(window.APPIDialog && window.APPIDialog.alert) window.APPIDialog.alert('Este dispositivo no permite abrir contactos desde la web. Podés usar tu Agenda APPI: importala una vez desde un archivo .vcf y después elegila desde este pétalo.', {title:'Elegir del teléfono',icon:'📱'});
      return;
    }
    try{
      var lista=await picker.select(['name','tel'],{multiple:true});
      (Array.isArray(lista)?lista:[]).forEach(function(c){
        var nombre=Array.isArray(c.name)?c.name[0]:c.name; var tel=Array.isArray(c.tel)?c.tel[0]:c.tel; if(!nombre)return;
        var item={id:String(tel||nombre),nombre:String(nombre),telefono:String(tel||'')};
        if(!seleccion.some(function(x){return String(x.id||x.telefono||x.nombre)===item.id;})) seleccion.push(item);
      });
      if(alVolver) alVolver();
    }catch(error){
      if(error && /Abort/i.test(String(error.name||'')))return;
      if(window.APPIDialog && window.APPIDialog.alert) window.APPIDialog.alert('No pudimos abrir los contactos. Probá otra vez o usá tu Agenda APPI.',{title:'Contactos',icon:'📱'});
    }
  }

  function abrir(){ if(typeof window.showView==='function')window.showView('view-margarita'); setTimeout(render,0); }
  window.openMargarita=abrir;
  window.APPIMargarita={abrir:abrir,render:render,cargar:cargar,guardar:guardar,elegirTelefono:elegirTelefono};
  window.addEventListener('appi-person-change',function(){ setTimeout(render,40); });
  window.addEventListener('appi-datasync-applied',function(){ setTimeout(render,40); });
})();
