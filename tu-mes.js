/* APPI · Tu mes v600 — cerebro
   El mes es un tablero de cartas. Cada día, las 10 de la jornada.
   La puerta es la franja de septiembre del Home.
   v600: TU MES detalle por día desde la tarjeta de resumen · popup + v599 cerebro — timeline al abrir día + métricas sutiles arriba.
   Eventos viven en appi-eventos.js (bus central silencioso).
*/
(function () {
  'use strict';

  var MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  var SEM = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  var cssListo = false;
  var visto = {};
  var vistaAnio = 0, vistaMes = 0;

  function M(){ return window.APPIMensajes || null; }
  function E(){ return window.APPIEventos || null; }
  function esc(s){
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');
  }
  function hoy(){ return new Date(); }
  function clave(d){
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }
  function hoyKey(){ return clave(hoy()); }
  function nombreCompleto(n){
    var t = String(n == null ? '' : n).trim();
    if (!t) return '';
    if (t.indexOf(',') >= 0){
      var partes = t.split(',');
      t = ((partes[1] || '').trim() + ' ' + (partes[0] || '').trim()).trim();
    }
    if (t === t.toUpperCase()){
      t = t.toLowerCase().replace(/(^|[\s-])([a-záéíóúüñ])/g, function(m, a, b){ return a + b.toUpperCase(); });
    }
    return t;
  }
  function horaDe(ts){
    try{
      var d = new Date(Number(ts)||0);
      return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
    }catch(e){ return ''; }
  }
  function iconoEv(tipo){
    if(tipo==='mensaje') return '💬';
    if(tipo==='accion') return '✓';
    if(tipo==='contacto') return '👤';
    if(tipo==='cultura') return '🌱';
    if(tipo==='promo') return '🎁';
    return '•';
  }
  function textoTipo(tipo){
    if(tipo==='mensaje') return 'Mensaje';
    if(tipo==='accion') return 'Acción';
    if(tipo==='contacto') return 'Contacto';
    if(tipo==='cultura') return 'Cultura';
    if(tipo==='promo') return 'Promo';
    return tipo||'';
  }

  function planaHoy(){
    var api = M();
    var out = [];
    if (!api || typeof api.deHoy !== 'function') return out;
    try{
      api.deHoy().forEach(function(g){
        (g.gente || []).forEach(function(u){
          var m = api.marcaDe ? api.marcaDe(g.motivo.id, u) : null;
          out.push({
            motivoId: g.motivo.id,
            icono: g.motivo.icono || '✓',
            motivo: g.motivo.nombre || '',
            nombre: nombreCompleto(u.usuario || u.nombre || ''),
            hecha: !!(m && m.e === 'hecha'),
            noHecha: !!(m && m.e === 'no_hecha'),
            user: u
          });
        });
      });
    }catch(e){}
    return out;
  }

  function diasMes(anio, mes){
    var api = M();
    var mapa = {};
    if (!api) return mapa;
    try{
      var raw = JSON.parse(localStorage.getItem('appi_acciones_v1_' + uid()) || '{}');
      var pref = anio + '-' + String(mes+1).padStart(2,'0') + '-';
      Object.keys(raw.dias || {}).forEach(function(k){
        if (k.indexOf(pref) === 0) mapa[k] = raw.dias[k];
      });
    }catch(e){}
    return mapa;
  }
  function uid(){
    try{ if (window.APPIAuth && window.APPIAuth.userId) return window.APPIAuth.userId() || 'local'; }catch(e){}
    return 'local';
  }

  function css(){
    if (cssListo) return;
    cssListo = true;
    var s = document.createElement('style');
    s.textContent = [
      '.home-month-card{cursor:pointer}',
      '.home-month-card:focus{outline:2px solid #e8b84a;outline-offset:2px}',
      '.tm-wrap{padding:12px 14px 28px}',
      '#view-tumes header.top h1{display:flex;align-items:baseline;justify-content:center;gap:8px}',
      '#view-tumes header.top h1 .script{margin-top:0;font-size:36px;line-height:1}',
      '#tmNav.tm-nav{display:grid;grid-template-columns:48px 1fr 48px;align-items:center;margin:4px 0 6px;width:100%}',
      '.tm-nav-mes{text-align:center;min-width:0}',
      '.tm-nav-mes strong{display:block;font-size:22px;font-weight:900;color:#0b5878;letter-spacing:-.5px;line-height:1.15}',
      'body.dark .tm-nav-mes strong{color:#8ec8e0}',
      '.tm-nav-mes span{display:block;margin-top:2px;font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#8a8678}',
      '#tmNav button{width:48px;height:48px;border:0;border-radius:50%;background:#0b5878;color:#fff;font-size:30px;font-weight:900;line-height:1;cursor:pointer;box-shadow:0 10px 24px rgba(11,88,120,.3);display:grid;place-items:center;padding:0}',
      '#tmNav button:active{transform:scale(.94)}',
      '#tmNav button[disabled]{opacity:.34;cursor:default;box-shadow:none}',
      '.tm-sub{margin:0 0 10px;text-align:center;font-size:12.5px;font-weight:800;color:#686977}',
      'body.dark .tm-sub{color:#b8b9c5}',
      /* métricas sutiles arriba — v599 */
      '.tm-metrics{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:0 0 12px}',
      '.tm-metric{display:inline-flex;align-items:center;gap:5px;padding:5px 9px;border-radius:999px;background:rgba(255,255,255,.68);border:1px solid rgba(11,88,120,.08);font-size:11px;font-weight:850;color:#3a3a48;box-shadow:0 4px 12px rgba(80,90,130,.06)}',
      'body.dark .tm-metric{background:rgba(37,41,64,.62);border-color:rgba(255,255,255,.08);color:#d6d7de}',
      '.tm-metric b{font-weight:900}',
      '.tm-metric.muted{opacity:.72}',
      '.tm-sem,.tm-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}',
      '.tm-sem span{text-align:center;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#8a8678}',
      '.tm-dia{aspect-ratio:3/3.7;border:0;border-radius:12px;padding:6px 5px 5px;background:#efeae0;color:#5c5a52;font:inherit;font-size:11px;font-weight:800;text-align:left;cursor:pointer;display:flex;flex-direction:column;min-width:0;overflow:hidden}',
      'body.dark .tm-dia{background:#25273a;color:#b8b9c5}',
      '.tm-dia[disabled]{opacity:.28;cursor:default}',
      '.tm-dia.futuro{background:transparent;border:1px dashed rgba(11,88,120,.22)}',
      '.tm-dia.rojo{background:linear-gradient(150deg,#e05545,#9a2a1c);color:#fff;box-shadow:0 8px 18px rgba(154,42,28,.28)}',
      '.tm-dia.amarillo{background:linear-gradient(150deg,#f0c85a,#d4891a);color:#1d1d2c;box-shadow:0 8px 18px rgba(212,137,26,.28)}',
      '.tm-dia.verde{background:linear-gradient(150deg,#1aa36e,#0f5a46);color:#fff;box-shadow:0 8px 18px rgba(15,90,70,.28)}',
      '.tm-dia.hoy{outline:2px solid #0b5878;outline-offset:1px;box-shadow:0 12px 28px rgba(11,88,120,.32)}',
      '.tm-dia.amarillo .n,.tm-dia.amarillo .m{color:#1d1d2c;opacity:.9}',
      '.tm-dia .n{font-size:10px;letter-spacing:.06em;text-transform:uppercase;opacity:.85}',
      '.tm-dia .ok{margin-top:auto;display:block;font-size:10.5px;font-weight:900;line-height:1.2}',
      '.tm-dia .no{display:block;font-size:8.5px;font-weight:800;line-height:1.2;opacity:.95;max-height:2.5em;overflow:hidden}',
      '.tm-dia .m{margin-top:auto;font-size:9.5px;opacity:.8}',
      '.tm-dia .tm-dot{width:6px;height:6px;border-radius:50%;display:inline-block;margin-left:4px;vertical-align:middle;background:rgba(11,88,120,.22)}',
      '.tm-dia.con-evento .tm-dot{background:#0b5878}',
      'body.dark .tm-dia.con-evento .tm-dot{background:#8ec8e0}',
      '#tmCierre{display:none;position:fixed;inset:0;z-index:45000;align-items:center;justify-content:center;background:rgba(16,20,28,.38);padding:16px}',
      '#tmCierre.on{display:flex}',
      '#tmPicado{position:absolute;inset:0;overflow:hidden;pointer-events:none}',
      '#tmPicado i{position:absolute;top:-24px;animation:tmCae linear infinite}',
      '@keyframes tmCae{to{transform:translate3d(var(--dx),110vh,0) rotate(var(--rot))}}',
      '.tm-carta{position:relative;z-index:2;width:min(380px,100%);max-height:86vh;overflow:hidden;border-radius:24px;padding:16px 16px 14px;background:linear-gradient(150deg,#1278a0,#0b5878 58%,#063652);color:#fff;box-shadow:0 22px 60px rgba(10,12,40,.4);display:flex;flex-direction:column}',
      '.tm-carta.rojo{background:linear-gradient(150deg,#e05545,#9a2a1c 58%,#5c1810)}',
      '.tm-carta.amarillo{background:linear-gradient(150deg,#f0c85a,#d4891a 58%,#8a6410);color:#1d1d2c}',
      '.tm-carta.verde{background:linear-gradient(150deg,#1aa36e,#0f5a46 58%,#08382c)}',
      '.tm-carta.amarillo .cab,.tm-carta.amarillo .tm-pie,.tm-carta.amarillo .tm-grupo,.tm-carta.amarillo .tm-x{color:#1d1d2c}',
      '.tm-carta.amarillo li{background:rgba(0,0,0,.08);border-color:rgba(0,0,0,.12);color:#1d1d2c}',
      '.tm-grupo{margin:12px 0 6px;padding:7px 10px;border-radius:10px;font-size:13px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;background:rgba(0,0,0,.18)}',
      '.tm-grupo.hecho{background:rgba(125,204,106,.4)}',
      '.tm-grupo.falta{background:rgba(0,0,0,.28)}',
      '.tm-carta.amarillo .tm-grupo.hecho{background:rgba(22,80,30,.25);color:#163512}',
      '.tm-carta.amarillo .tm-grupo.falta{background:rgba(0,0,0,.18)}',
      '.tm-carta-cuerpo{overflow:auto;flex:1;min-height:0;-webkit-overflow-scrolling:touch}',
      '.tm-carta .cab{font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;opacity:.9}',
      '.tm-carta h2{margin:6px 0 10px;font-size:26px;letter-spacing:-.4px}',
      '.tm-carta ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}',
      '.tm-carta li{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:12px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.16);font-size:13.5px;font-weight:800}',
      '.tm-carta li .d{display:flex;flex-direction:column;gap:1px;min-width:0}',
      '.tm-carta li .d b{font-size:13.5px;font-weight:900;line-height:1.25}',
      '.tm-carta li .d small{font-size:11.5px;font-weight:800;opacity:.85}',
      '.tm-carta li.pend{opacity:.72}',
      '.tm-bola{flex:0 0 22px;width:22px;height:22px;border-radius:50%;background:#7dcc6a;color:#163512;display:grid;place-items:center;font-size:13px;font-weight:900}',
      '.tm-carta li.pend .tm-bola{background:rgba(255,255,255,.2);color:#fff}',
      '.tm-pie{margin-top:12px;text-align:center;font-size:13px;font-weight:800}',
      '.tm-x{position:absolute;top:4px;right:4px;z-index:6;width:44px;height:44px;border:0;border-radius:50%;background:rgba(0,0,0,.22);color:#fff;font-size:22px;font-weight:700;line-height:1;cursor:pointer;display:grid;place-items:center;padding:0}',
      /* timeline dentro del día — v599 */
      '.tm-tl{margin-top:14px;padding-top:12px;border-top:1px dashed rgba(255,255,255,.22)}',
      '.tm-carta.amarillo .tm-tl{border-top-color:rgba(0,0,0,.14)}',
      '.tm-tl h4{margin:0 0 8px;font-size:11px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;opacity:.88}',
      '.tm-tl-empty{padding:10px 11px;border-radius:12px;background:rgba(255,255,255,.10);border:1px dashed rgba(255,255,255,.18);font-size:12.5px;font-weight:700;opacity:.9}',
      '.tm-carta.amarillo .tm-tl-empty{background:rgba(0,0,0,.06);border-color:rgba(0,0,0,.12)}',
      '.tm-ev{display:flex;gap:9px;align-items:flex-start;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.12)}',
      '.tm-carta.amarillo .tm-ev{border-bottom-color:rgba(0,0,0,.10)}',
      '.tm-ev:last-child{border-bottom:0}',
      '.tm-ev .tm-ev-ico{flex:0 0 26px;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-size:12px;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.14)}',
      '.tm-carta.amarillo .tm-ev .tm-ev-ico{background:rgba(0,0,0,.08);border-color:rgba(0,0,0,.10)}',
      '.tm-ev.mensaje .tm-ev-ico{background:rgba(37,211,102,.22)}',
      '.tm-ev.accion .tm-ev-ico{background:rgba(125,204,106,.28)}',
      '.tm-ev.contacto .tm-ev-ico{background:rgba(91,141,239,.20)}',
      '.tm-ev.cultura .tm-ev-ico{background:rgba(232,184,74,.22)}',
      '.tm-ev .tm-ev-body{flex:1;min-width:0}',
      '.tm-ev .tm-ev-title{font-size:12.5px;font-weight:900;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.tm-ev .tm-ev-detail{margin-top:2px;font-size:11.5px;font-weight:700;opacity:.88;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.tm-ev .tm-ev-hora{flex:0 0 auto;font-size:11px;font-weight:800;opacity:.75;margin-top:2px}',
      '.tm-kpis{margin-top:16px;background:#fff;border-radius:18px;padding:14px 16px 10px;border:1px solid rgba(11,88,120,.08)}',
      'body.dark .tm-kpis{background:#25273a;border-color:rgba(255,255,255,.08)}',
      '.tm-kpis .tm-frase{margin:0 0 10px;font-size:14.5px;font-weight:800;line-height:1.4;color:#1d1d2c}',
      'body.dark .tm-kpis .tm-frase{color:#f3eee3}',
      '.tm-kpis ul{list-style:none;margin:0;padding:0}',
      '.tm-kpis li{display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-top:1px solid #efeae0;font-size:14px;font-weight:800}',
      'body.dark .tm-kpis li{border-top-color:rgba(255,255,255,.08)}',
      '.tm-kpis li:first-child{border-top:0}',
      '.tm-kpis li i{font-style:normal;color:#0b5878;font-size:16px;font-weight:900}',
      'body.dark .tm-kpis li i{color:#8ec8e0}',
      '.tm-kpis{cursor:pointer;transition:transform .12s,box-shadow .12s}',
      '.tm-kpis:active{transform:scale(.98)}',
      '.tm-kpis:focus{outline:2px solid #0b5878;outline-offset:2px}',
      '.tm-kpis-hint{margin-top:10px;text-align:center;font-size:11px;font-weight:850;color:#0b5878;opacity:.75;letter-spacing:.02em}',
      'body.dark .tm-kpis-hint{color:#8ec8e0}',
      '.tm-kpis li.tm-kpi-row{cursor:pointer;border-radius:10px;margin:0 -6px;padding:9px 6px;transition:background .15s}',
      '.tm-kpis li.tm-kpi-row:hover{background:rgba(11,88,120,.06)}',
      'body.dark .tm-kpis li.tm-kpi-row:hover{background:rgba(255,255,255,.06)}',
      '#tmDetalle{display:none;position:fixed;inset:0;z-index:46000;align-items:center;justify-content:center;background:rgba(16,20,28,.44);padding:16px}',
      '#tmDetalle.on{display:flex}',
      '.tm-det-card{position:relative;width:min(440px,100%);max-height:88vh;overflow:hidden;display:flex;flex-direction:column;border-radius:22px;background:#fff;color:#1d1d2c;box-shadow:0 22px 60px rgba(10,12,40,.38)}',
      'body.dark .tm-det-card{background:#1e1f30;color:#f0f0f5}',
      '.tm-det-head{position:sticky;top:0;z-index:2;padding:16px 16px 12px;background:inherit;border-bottom:1px solid rgba(11,88,120,.07)}',
      'body.dark .tm-det-head{border-bottom-color:rgba(255,255,255,.08)}',
      '.tm-det-head .eyebrow{font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#0b5878;opacity:.85}',
      'body.dark .tm-det-head .eyebrow{color:#8ec8e0}',
      '.tm-det-head h2{margin:4px 0 6px;font-size:20px;font-weight:900;letter-spacing:-.3px;line-height:1.2}',
      '.tm-det-head p{margin:0;font-size:12.5px;font-weight:700;color:#5b5a52;line-height:1.4}',
      'body.dark .tm-det-head p{color:#b8b9c5}',
      '.tm-det-close{position:absolute;top:10px;right:10px;width:40px;height:40px;border:0;border-radius:50%;background:rgba(0,0,0,.08);color:#1d1d2c;font-size:22px;font-weight:700;display:grid;place-items:center;cursor:pointer}',
      'body.dark .tm-det-close{background:rgba(255,255,255,.10);color:#fff}',
      '.tm-det-body{overflow:auto;flex:1;min-height:0;padding:14px 16px 16px;-webkit-overflow-scrolling:touch}',
      '.tm-det-summary{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 14px}',
      '.tm-det-chip{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;background:rgba(11,88,120,.07);border:1px solid rgba(11,88,120,.06);font-size:11px;font-weight:850;color:#1d1d2c}',
      'body.dark .tm-det-chip{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.06);color:#f0f0f5}',
      '.tm-det-filt{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 14px}',
      '.tm-det-filt button{border:1px solid rgba(11,88,120,.12);background:rgba(11,88,120,.04);color:#0b5878;padding:6px 10px;border-radius:999px;font-size:11px;font-weight:850;cursor:pointer}',
      '.tm-det-filt button.on{background:#0b5878;color:#fff;border-color:#0b5878}',
      'body.dark .tm-det-filt button{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.08);color:#d6d7de}',
      'body.dark .tm-det-filt button.on{background:#8ec8e0;color:#0b2a3a;border-color:#8ec8e0}',
      '.tm-det-day{margin-bottom:10px;padding:12px;border-radius:16px;background:#f8f7f3;border:1px solid rgba(11,88,120,.06)}',
      'body.dark .tm-det-day{background:rgba(37,41,64,.52);border-color:rgba(255,255,255,.06)}',
      '.tm-det-day-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}',
      '.tm-det-day-head strong{font-size:13.5px;font-weight:900;letter-spacing:-.2px}',
      '.tm-det-day-head .right{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:850}',
      '.tm-det-day .sema{width:8px;height:8px;border-radius:50%;display:inline-block}',
      '.tm-det-day .sema.verde{background:#1aa36e}',
      '.tm-det-day .sema.amarillo{background:#d4891a}',
      '.tm-det-day .sema.rojo{background:#e05545}',
      '.tm-det-day .sema.neutro{background:rgba(11,88,120,.18)}',
      'body.dark .tm-det-day .sema.neutro{background:rgba(255,255,255,.18)}',
      '.tm-det-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}',
      '.tm-det-list li{display:flex;align-items:flex-start;gap:8px;padding:7px 8px;border-radius:10px;background:rgba(255,255,255,.72);border:1px solid rgba(11,88,120,.06);font-size:12.5px;font-weight:750;line-height:1.3}',
      'body.dark .tm-det-list li{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.06)}',
      '.tm-det-list li .ico{flex:0 0 auto;font-size:13px;margin-top:1px}',
      '.tm-det-list li .who{flex:1;min-width:0}',
      '.tm-det-list li .who b{display:block;font-size:12.5px;font-weight:900;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.tm-det-list li .who small{display:block;font-size:11px;font-weight:700;opacity:.75;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.tm-det-empty{padding:18px 14px;border-radius:14px;background:rgba(11,88,120,.04);border:1px dashed rgba(11,88,120,.14);text-align:center;font-size:12.5px;font-weight:700;color:#5b5a52;line-height:1.5}',
      'body.dark .tm-det-empty{background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.08);color:#b8b9c5}'

    ].join('\n');
    document.head.appendChild(s);
  }

  function desgloseMes(anio, mes, mapa){
    var orden = [
      { id: 'cumple', icono: '🎂', nombre: 'Cumpleaños' },
      { id: 'retro', icono: '🔧', nombre: 'Retrolavados' },
      { id: 'porvencer', icono: '⏰', nombre: 'Garantías por vencer' },
      { id: 'renovacion', icono: '🔄', nombre: 'Equipos para canjear' },
      { id: 'checkin', icono: '👋', nombre: '¿Cómo viene el equipo?' }
    ];
    var cnt = {};
    orden.forEach(function(o){ cnt[o.id] = 0; });
    var kHoy = hoyKey();
    var esActual = anio === hoy().getFullYear() && mes === hoy().getMonth();
    try{
      var raw = JSON.parse(localStorage.getItem('appi_acciones_v1_' + uid()) || '{}');
      var pref = anio + '-' + String(mes+1).padStart(2,'0') + '-';
      Object.keys(raw.dias || {}).forEach(function(k){
        if (k.indexOf(pref) !== 0 || (esActual && k === kHoy)) return;
        var marcas = (raw.dias[k] && raw.dias[k].marcas) || {};
        Object.keys(marcas).forEach(function(claveM){
          var m = marcas[claveM];
          if (!m || m.e !== 'hecha') return;
          var id = claveM.split(':')[0];
          if (cnt[id] == null) cnt[id] = 0;
          cnt[id]++;
        });
      });
    }catch(e){}
    if (esActual){
      planaHoy().forEach(function(it){
        if (!it.hecha) return;
        if (cnt[it.motivoId] == null) cnt[it.motivoId] = 0;
        cnt[it.motivoId]++;
      });
    }
    return orden.map(function(o){ return { id: o.id, icono: o.icono, nombre: o.nombre, n: cnt[o.id] || 0 }; });
  }
  function pintarKpis(anio, mes, mapa){
    var box = document.getElementById('tmKpis');
    if (!box) return;
    var personas = 0, vivos = 0;
    Object.keys(mapa).forEach(function(k){
      var d = mapa[k];
      if (!d) return;
      var h = Number(d.hechas) || 0;
      personas += h;
      if (h) vivos++;
    });
    var filas = desgloseMes(anio, mes, mapa);
    var frase = vivos
      ? (vivos + (vivos === 1 ? ' día' : ' días') + ' el negocio estuvo vivo. Atendiste ' + personas + (personas === 1 ? ' persona.' : ' personas.'))
      : 'Este mes todavía no hay movimiento. Las 10 van a ir llenando esto.';
    var evResumen = null;
    try{
      if(E() && typeof E().resumenMes==='function') evResumen = E().resumenMes(anio, mes);
    }catch(e){}
    var extraEventos = '';
    if(evResumen && evResumen.total){
      var chips=[];
      if(evResumen.mensajes) chips.push('💬 '+evResumen.mensajes);
      if(evResumen.acciones) chips.push('✓ '+evResumen.acciones);
      if(evResumen.contactos) chips.push('👤 '+evResumen.contactos);
      if(evResumen.cultura) chips.push('🌱 '+evResumen.cultura);
      if(chips.length){
        extraEventos = '<div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px">'+
          chips.map(function(ch){ return '<span class="tm-metric" style="font-size:10.5px;padding:4px 8px">'+esc(ch)+'</span>'; }).join('')+
          '<span class="tm-metric muted" style="font-size:10.5px;padding:4px 8px">· '+evResumen.total+' movimientos</span></div>';
      }
    }
    var hint = '<div class="tm-kpis-hint">Tocar para ver detalle por día ›</div>';
    box.innerHTML = '<p class="tm-frase">' + esc(frase) + '</p><ul>' +
      filas.map(function(f){
        return '<li class="tm-kpi-row" data-tipo="'+esc(f.id||'')+'"><span>' + f.icono + ' ' + esc(f.nombre) + '</span><i>' + f.n + '</i></li>';
      }).join('') + '</ul>' + extraEventos + hint;
    // — hacer la tarjeta tocable → popup por día (v600) —
    try{
      box.setAttribute('role','button');
      box.setAttribute('tabindex','0');
      box.setAttribute('aria-label','Ver detalle por día de '+MESES[mes]+' '+anio);
      box.__tmDetalleAnio = anio; box.__tmDetalleMes = mes;
      if(!box.__tmDetalleHook){
        box.__tmDetalleHook = true;
        box.addEventListener('click', function(e){
          var row = e.target.closest && e.target.closest('.tm-kpi-row');
          if(row){
            var tipo = row.getAttribute('data-tipo')||'';
            // evitar que el click general también dispare
            e.stopPropagation();
            abrirDetalleMes(box.__tmDetalleAnio, box.__tmDetalleMes, tipo);
            return;
          }
          abrirDetalleMes(box.__tmDetalleAnio, box.__tmDetalleMes);
        });
        box.addEventListener('keydown', function(e){
          if(e.key==='Enter' || e.key===' '){
            e.preventDefault();
            var active = document.activeElement;
            if(active && active.classList.contains('tm-kpi-row')){
              var tipo = active.getAttribute('data-tipo')||'';
              abrirDetalleMes(box.__tmDetalleAnio, box.__tmDetalleMes, tipo);
            } else {
              abrirDetalleMes(box.__tmDetalleAnio, box.__tmDetalleMes);
            }
          }
        });
        // también hacer cada fila focable para teclado
        box.querySelectorAll('.tm-kpi-row').forEach(function(r){
          r.setAttribute('tabindex','0');
          r.setAttribute('role','button');
        });
      } else {
        // actualizar filas focables en re-render
        box.querySelectorAll('.tm-kpi-row').forEach(function(r){
          r.setAttribute('tabindex','0');
          r.setAttribute('role','button');
        });
      }
    }catch(e){}
  }

  var DESC_TAREA = {
    cumple: 'Saludar el cumpleaños',
    retro: 'Pedir el retrolavado',
    porvencer: 'Avisar que vence la garantía',
    renovacion: 'Proponer el canje del equipo',
    checkin: 'Preguntar cómo viene el equipo'
  };
  function descTarea(it){
    if (!it) return 'Tarea del día';
    return DESC_TAREA[it.motivoId] || it.motivo || 'Tarea del día';
  }
  function semaforo(hechas, total){
    if (!total) return '';
    var p = hechas / total;
    if (p >= 0.8) return 'verde';
    if (p >= 0.4) return 'amarillo';
    return 'rojo';
  }
  function irMes(delta){
    var d = new Date(vistaAnio, vistaMes + delta, 1);
    var now = hoy();
    var tope = new Date(now.getFullYear(), now.getMonth(), 1);
    var piso = new Date(now.getFullYear(), now.getMonth() - 12, 1);
    if (d > tope || d < piso) return;
    vistaAnio = d.getFullYear();
    vistaMes = d.getMonth();
    pintar();
  }

  function htmlMetricasSutiles(anio, mes){
    try{
      var ev = E();
      if(!ev || typeof ev.resumenMes!=='function') return '';
      var r = ev.resumenMes(anio, mes);
      if(!r || !r.total) return '<div class="tm-metrics"><span class="tm-metric muted">Sin movimientos aún</span></div>';
      var parts=[];
      if(r.mensajes) parts.push('<span class="tm-metric">💬 '+r.mensajes+' mensajes</span>');
      if(r.acciones) parts.push('<span class="tm-metric">✓ '+r.acciones+' acciones</span>');
      if(r.contactos) parts.push('<span class="tm-metric">👤 '+r.contactos+' contactos</span>');
      if(r.cultura) parts.push('<span class="tm-metric">🌱 '+r.cultura+' cultura</span>');
      // Mostrar total solo si hay más de 2 tipos para no recargar
      var totalTxt = r.total+' movimientos';
      if(parts.length) parts.push('<span class="tm-metric muted">'+esc(totalTxt)+'</span>');
      else parts.push('<span class="tm-metric muted">'+esc(totalTxt)+'</span>');
      return '<div class="tm-metrics">'+parts.join('')+'</div>';
    }catch(e){ return ''; }
  }

  function pintar(){
    css();
    var host = document.getElementById('tmCal');
    if (!host) return;
    var now = hoy();
    if (!vistaAnio){ vistaAnio = now.getFullYear(); vistaMes = now.getMonth(); }
    var anio = vistaAnio;
    var mes = vistaMes;
    var esActual = anio === now.getFullYear() && mes === now.getMonth();
    var diaHoy = now.getDate();
    var mapa = diasMes(anio, mes);
    var kHoy = hoyKey();
    var partido = null;
    try{ partido = M() && M().partidoHoy && M().partidoHoy(); }catch(e){}
    if (esActual && partido && partido.hay){
      mapa[kHoy] = mapa[kHoy] || {};
      mapa[kHoy].total = partido.total;
      mapa[kHoy].hechas = partido.hechas;
      mapa[kHoy].ganado = partido.ganado;
    }
    var vivos = 0;
    Object.keys(mapa).forEach(function(k){
      if (mapa[k] && mapa[k].hechas) vivos++;
    });
    var nav = document.getElementById('tmNav');
    if (nav){
      var pisoD = new Date(anio, mes, 1).getTime() <= new Date(now.getFullYear(), now.getMonth() - 12, 1).getTime();
      nav.innerHTML = '<button type="button" id="tmPrev" aria-label="Mes anterior"' + (pisoD ? ' disabled' : '') + '>‹</button>' +
        '<div class="tm-nav-mes"><strong>' + MESES[mes] + '</strong><span>' + anio + '</span></div>' +
        '<button type="button" id="tmNext" aria-label="Mes siguiente"' + (esActual ? ' disabled' : '') + '>›</button>';
      var prev = document.getElementById('tmPrev');
      var next = document.getElementById('tmNext');
      if (prev) prev.onclick = function(){ irMes(-1); };
      if (next) next.onclick = function(){ irMes(1); };
    }
    var sub = document.getElementById('tmSub');
    if (sub){
      var last = new Date(anio, mes+1, 0).getDate();
      sub.textContent = esActual
        ? ('Día ' + diaHoy + ' de ' + last + (vivos ? ' · ' + vivos + (vivos === 1 ? ' día con movimiento' : ' días con movimiento') : ''))
        : (vivos ? (vivos + (vivos === 1 ? ' día con movimiento' : ' días con movimiento')) : 'Sin movimiento registrado');
    }

    // Métricas sutiles (eventos del cerebro) — justo debajo del subtítulo, sin romper calendario
    var metricsHtml = htmlMetricasSutiles(anio, mes);

    var sem = SEM.map(function(d){ return '<span>' + d + '</span>'; }).join('');
    var celdas = '';
    var shift = (new Date(anio, mes, 1).getDay() + 6) % 7;
    var i;
    for (i = 0; i < shift; i++) celdas += '<button type="button" class="tm-dia" disabled></button>';
    var last = new Date(anio, mes+1, 0).getDate();
    // Para puntitos de evento, precomputar días con eventos
    var diasConEvento = {};
    try{
      if(E() && typeof E().listarMes==='function'){
        var evMes = E().listarMes(anio, mes);
        evMes.forEach(function(ev){ diasConEvento[ev.dia]=1; });
      }
    }catch(e){}
    for (i = 1; i <= last; i++){
      var k = anio + '-' + String(mes+1).padStart(2,'0') + '-' + String(i).padStart(2,'0');
      var info = mapa[k];
      var futuro = esActual && i > diaHoy;
      var esHoyCel = esActual && i === diaHoy;
      var hDia = info && info.total ? (Number(info.hechas)||0) : (esHoyCel && partido && partido.hay ? partido.hechas : 0);
      var tDia = info && info.total ? info.total : (esHoyCel && partido && partido.hay ? partido.total : 0);
      var semCol = futuro ? '' : semaforo(hDia, tDia);
      var conEvento = !!diasConEvento[k];
      var tipo = (futuro ? 'futuro' : '') + (esHoyCel ? ' hoy' : '') + (semCol ? ' ' + semCol : '') + (conEvento ? ' con-evento' : '');
      var marca = esHoyCel ? 'Hoy ' + i : String(i);
      var mini = '';
      if (tDia){
        var falta = Math.max(0, tDia - hDia);
        var faltaTxt = 'completo';
        if (falta){
          var pend = [];
          try{
            itemsDe(k).forEach(function(it){
              if (!it.hecha){
                var d = descTarea(it);
                if (pend.indexOf(d) < 0) pend.push(d);
              }
            });
          }catch(e){}
          faltaTxt = pend.length ? pend.join(' · ') : ('falta ' + falta);
        }
        mini = '<span class="ok">✓ ' + hDia + '</span><span class="no">' + esc(faltaTxt) + '</span>';
      } else if (futuro){
        mini = '<span class="m">sin abrir</span>';
      } else {
        mini = conEvento ? '<span class="m">movimiento</span>' : '<span class="m">sin movimiento</span>';
      }
      // puntito sutil si hubo evento ese día (mensajes/acciones/etc)
      var dot = conEvento ? '<i class="tm-dot" aria-hidden="true"></i>' : '';
      celdas += '<button type="button" class="tm-dia ' + tipo + '" data-tm-dia="' + k + '"' +
        (futuro ? ' disabled' : '') + '><span class="n">' + esc(marca) + dot + '</span>' + mini + '</button>';
    }
    host.innerHTML = metricsHtml + '<div class="tm-sem">' + sem + '</div><div class="tm-grid" style="margin-top:8px">' + celdas + '</div>';
    host.querySelectorAll('[data-tm-dia]').forEach(function(b){
      b.onclick = function(){ abrirDia(b.getAttribute('data-tm-dia'), b.classList.contains('hoy')); };
    });
    pintarKpis(anio, mes, mapa);
  }

  function itemsDe(k){
    if (k === hoyKey()){
      try{ if (M() && M().registrarPartido) M().registrarPartido(); }catch(e){}
      var hoyItems = planaHoy();
      if (hoyItems.length) return hoyItems;
    }
    var out = [];
    try{
      var raw = JSON.parse(localStorage.getItem('appi_acciones_v1_' + uid()) || '{}');
      var dia = raw.dias && raw.dias[k];
      if (!dia) return out;
      var marcas = dia.marcas || {};
      var lista = dia.lista || [];
      if (lista.length){
        return lista.map(function(it){
          var marca = it.t ? marcas[it.m + ':' + it.t] : null;
          if (!marca && it.n){
            Object.keys(marcas).forEach(function(claveM){
              if (marca) return;
              if (claveM.split(':')[0] === it.m && marcas[claveM] && marcas[claveM].n === it.n) marca = marcas[claveM];
            });
          }
          var mot = M() && M().motivoPorId ? M().motivoPorId(it.m) : null;
          return {
            motivoId: it.m,
            icono: it.ico || (mot && mot.icono) || '✓',
            motivo: it.mot || (mot && mot.nombre) || '',
            nombre: nombreCompleto(it.n),
            hecha: !!(marca && marca.e === 'hecha'),
            noHecha: !!(marca && marca.e === 'no_hecha')
          };
        });
      }
      Object.keys(marcas).forEach(function(claveM){
        var motId = claveM.split(':')[0];
        var mot = M() && M().motivoPorId ? M().motivoPorId(motId) : null;
        var marca = marcas[claveM];
        out.push({
          motivoId: motId,
          icono: (mot && mot.icono) || '✓',
          motivo: (mot && mot.nombre) || '',
          nombre: nombreCompleto(marca && marca.n),
          hecha: marca && marca.e === 'hecha',
          noHecha: marca && marca.e === 'no_hecha'
        });
      });
      var faltaN = Math.max(0, (Number(dia.total) || 0) - out.length);
      var i;
      for (i = 0; i < faltaN; i++){
        out.push({ motivoId: '', icono: '·', motivo: '', nombre: 'Sin marcar', hecha: false, noHecha: false });
      }
    }catch(e){}
    return out;
  }

  function abrirDia(k, esHoy, fiesta){
    css();
    var items = itemsDe(k);
    var velo = document.getElementById('tmCierre');
    if (!velo){
      velo = document.createElement('div');
      velo.id = 'tmCierre';
      velo.innerHTML = '<div id="tmPicado" aria-hidden="true"></div><article class="tm-carta" id="tmCarta"></article>';
      document.body.appendChild(velo);
      velo.addEventListener('click', function(e){ if (e.target === velo) cerrarCierre(); });
    }
    var hechas = items.filter(function(x){ return x.hecha; }).length;
    var total = items.length;
    var ganado = total > 0 && hechas === total;
    var sem = semaforo(hechas, total);
    var partes = String(k).split('-');
    var tit = esHoy ? 'Tu día' : 'Tu día · ' + parseInt(partes[2],10) + ' ' + MESES[parseInt(partes[1],10)-1].toLowerCase();
    function fila(it, ok){
      var desc = descTarea(it);
      var nom = it.nombre && it.nombre !== 'Sin marcar' ? it.nombre : '';
      var cuerpo = '<span class="d"><b>' + esc(it.icono || '') + ' ' + esc(desc) + '</b>' +
        (nom ? '<small>' + esc(nom) + '</small>' : '') + '</span>';
      return '<li class="' + (ok ? 'ok' : 'pend') + '"><span class="tm-bola">' + (ok ? '✓' : '·') + '</span>' + cuerpo + '</li>';
    }
    var okItems = items.filter(function(x){ return x.hecha; });
    var noItems = items.filter(function(x){ return !x.hecha; });
    var lista = '<p class="tm-grupo hecho">Hecho · ' + okItems.length + '</p><ul>';
    lista += okItems.length
      ? okItems.map(function(it){ return fila(it, true); }).join('')
      : '<li class="pend"><span class="tm-bola">·</span>Todavía nadie.</li>';
    lista += '</ul><p class="tm-grupo falta">Falta · ' + noItems.length + '</p><ul>';
    lista += noItems.length
      ? noItems.map(function(it){ return fila(it, false); }).join('')
      : '<li class="ok"><span class="tm-bola">✓</span>No falta nadie.</li>';
    lista += '</ul>';
    var pct = total ? Math.round(hechas * 100 / total) : 0;
    var pie = !total
      ? (esHoy ? 'Todavía no hay movimiento. Las 10 te esperan.' : 'Ese día no tuvo movimiento.')
      : (ganado
          ? (esHoy ? 'Hoy el negocio estuvo en movimiento. Eso vale.' : 'Ese día quedó marcado. Eso vale.')
          : (esHoy ? ('Vas ' + hechas + ' de ' + total + ' · ' + pct + '%. El día todavía está abierto.') : (hechas + ' de ' + total + ' · ' + pct + '%.')));

    // — timeline cerebro v599 — //
    var tlHtml = '';
    try{
      var evDay = E() ? E().listar({dia: k}) : [];
      if(evDay && evDay.length){
        // ordenar cronológico
        evDay.sort(function(a,b){ return (a.ts||0)-(b.ts||0); });
        tlHtml = '<div class="tm-tl"><h4>Movimientos del día · ' + evDay.length + '</h4>' +
          evDay.map(function(ev){
            var cls = esc(String(ev.tipo||'otro'));
            var titEv = esc(ev.titulo|| textoTipo(ev.tipo));
            var detEv = esc(ev.detalle||'');
            var hr = esc(horaDe(ev.ts));
            var ico = esc(iconoEv(ev.tipo));
            return '<div class="tm-ev '+cls+'"><span class="tm-ev-ico">'+ico+'</span><div class="tm-ev-body"><div class="tm-ev-title">'+titEv+'</div>'+(detEv?'<div class="tm-ev-detail">'+detEv+'</div>':'')+'</div><span class="tm-ev-hora">'+hr+'</span></div>';
          }).join('') +
          '</div>';
      } else {
        tlHtml = '<div class="tm-tl"><h4>Movimientos del día</h4><div class="tm-tl-empty">Aún no hay movimientos registrados este día. En cuanto envíes un mensaje, marques una acción o sumes un contacto, va a aparecer acá — sin tocar nada.</div></div>';
      }
    }catch(e){ tlHtml=''; }

    var carta = document.getElementById('tmCarta');
    carta.className = 'tm-carta' + (sem ? ' ' + sem : '');
    carta.innerHTML =
      '<button type="button" class="tm-x" aria-label="Cerrar">×</button>' +
      '<div class="tm-carta-cuerpo">' +
      '<div class="cab">💙 Para vos</div>' +
      '<h2>' + esc(tit) + '</h2>' +
      lista +
      tlHtml +
      '<p class="tm-pie">' + esc(pie) + '</p></div>';
    document.getElementById('tmCarta').querySelector('.tm-x').onclick = function(e){
      e.preventDefault(); e.stopPropagation(); cerrarCierre();
    };
    velo.className = 'on';
    picado(!!fiesta || (esHoy && ganado));
  }

  function cerrarCierre(){
    var velo = document.getElementById('tmCierre');
    if (velo) velo.className = '';
    var p = document.getElementById('tmPicado');
    if (p) p.innerHTML = '';
  }

  // — Detalle por día desde la tarjeta de resumen (v600) —
  var _detAnio = 0, _detMes = 0, _detFiltro = '';
  var DIAS_LARGO = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  var DIAS_CORTO = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  function formatoDiaDetalle(k){
    try{
      var partes = String(k).split('-');
      var y = parseInt(partes[0],10), m = parseInt(partes[1],10)-1, d = parseInt(partes[2],10);
      var dt = new Date(y,m,d);
      var wd = dt.getDay();
      var esHoy = k === hoyKey();
      return {
        d: d,
        mTexto: MESES[m].toLowerCase(),
        wdLargo: DIAS_LARGO[wd],
        wdCorto: DIAS_CORTO[wd],
        etiqu: (esHoy ? 'Hoy · ' : '') + DIAS_CORTO[wd] + ' ' + d + ' ' + MESES[m].slice(0,3).toLowerCase(),
        esHoy: esHoy
      };
    }catch(e){ return {d:0,mTexto:'',wdLargo:'',wdCorto:'',etiqu:k,esHoy:false}; }
  }
  function cerrarDetalle(){
    var v = document.getElementById('tmDetalle');
    if(v) v.classList.remove('on');
    // liberar scroll si se había bloqueado
    try{ document.body.classList.remove('appi-scroll-lock'); }catch(e){}
  }
  function asegurarDetalleDom(){
    var v = document.getElementById('tmDetalle');
    if(v) return v;
    v = document.createElement('div');
    v.id = 'tmDetalle';
    v.setAttribute('role','dialog');
    v.setAttribute('aria-modal','true');
    v.innerHTML = '<div class="tm-det-card" id="tmDetCard"><button type="button" class="tm-det-close" aria-label="Cerrar">×</button><div class="tm-det-head" id="tmDetHead"></div><div class="tm-det-body" id="tmDetBody"></div></div>';
    document.body.appendChild(v);
    v.addEventListener('click', function(e){ if(e.target===v) cerrarDetalle(); });
    var btn = v.querySelector('.tm-det-close');
    if(btn) btn.onclick = function(e){ e.preventDefault(); cerrarDetalle(); };
    document.addEventListener('keydown', function(e){
      if(e.key==='Escape'){
        var vv=document.getElementById('tmDetalle');
        if(vv && vv.classList.contains('on')) cerrarDetalle();
      }
    });
    return v;
  }
  function htmlDetalleFiltros(filas, activo){
    var allN = filas.reduce(function(s,f){ return s+ (f.n||0); },0);
    var chips = [{id:'', nombre:'Todos', n: allN, icono:'✦'}].concat(filas);
    return '<div class="tm-det-filt">' + chips.map(function(c){
      var on = String(activo||'')===String(c.id||'');
      var label = c.icono ? (c.icono+' '+c.nombre) : c.nombre;
      return '<button type="button" class="'+(on?'on':'')+'" data-det-filtro="'+esc(c.id||'')+'">'+esc(label)+' <b>'+(c.n||0)+'</b></button>';
    }).join('') + '</div>';
  }
  function renderDetalleCuerpo(){
    var anio=_detAnio, mes=_detMes, filtro=_detFiltro;
    var mapa = diasMes(anio, mes);
    // incluir hoy si es mes actual
    var now=hoy();
    var esActual = anio===now.getFullYear() && mes===now.getMonth();
    if(esActual){
      try{
        var partido = M() && M().partidoHoy && M().partidoHoy();
        if(partido && partido.hay){
          var kHoy=hoyKey();
          mapa[kHoy]=mapa[kHoy]||{};
          mapa[kHoy].total=partido.total;
          mapa[kHoy].hechas=partido.hechas;
          mapa[kHoy].ganado=partido.ganado;
        }
      }catch(e){}
    }
    var filas = desgloseMes(anio, mes, mapa);
    var head = document.getElementById('tmDetHead');
    var body = document.getElementById('tmDetBody');
    if(!head || !body) return;
    var titulo = MESES[mes]+' '+anio;
    var subt = '';
    var vivos=0, personas=0;
    Object.keys(mapa).forEach(function(k){ var d=mapa[k]; if(d && d.hechas){ vivos++; personas+=Number(d.hechas)||0; }});
    if(vivos) subt = vivos+(vivos===1?' día con movimiento':' días con movimiento')+' · '+(personas||0)+(personas===1?' persona atendida':' personas atendidas');
    else subt = 'Aún sin movimiento este mes. Cada Hecho va a aparecer acá, día por día.';
    // chips cerebro
    var evResumen=null; try{ if(E() && E().resumenMes) evResumen=E().resumenMes(anio,mes); }catch(e){}
    var chipsHtml='';
    if(evResumen && evResumen.total){
      var parts=[];
      if(evResumen.mensajes) parts.push('💬 '+evResumen.mensajes);
      if(evResumen.acciones) parts.push('✓ '+evResumen.acciones);
      if(evResumen.contactos) parts.push('👤 '+evResumen.contactos);
      if(evResumen.cultura) parts.push('🌱 '+evResumen.cultura);
      chipsHtml='<div class="tm-det-summary">'+parts.map(function(p){ return '<span class="tm-det-chip">'+esc(p)+'</span>';}).join('')+'<span class="tm-det-chip" style="opacity:.65">· '+evResumen.total+' movimientos</span></div>';
    }
    head.innerHTML = '<div class="eyebrow">Detalle por día</div><h2>'+esc(titulo)+'</h2><p>'+esc(subt)+'</p>'+chipsHtml+ htmlDetalleFiltros(filas, filtro);
    // attach filtro handlers
    head.querySelectorAll('[data-det-filtro]').forEach(function(b){
      b.onclick=function(){ _detFiltro=b.getAttribute('data-det-filtro')||''; renderDetalleCuerpo(); };
    });

    // construir lista de días con movimiento (orden cronológico)
    var diasOrden = Object.keys(mapa).sort();
    // también incluir días que tienen eventos pero no marca hechas (movimiento sutil)
    try{
      if(E() && E().listarMes){
        var evs=E().listarMes(anio,mes);
        evs.forEach(function(ev){ if(diasOrden.indexOf(ev.dia)<0) diasOrden.push(ev.dia); });
        diasOrden.sort();
      }
    }catch(e){}
    // filtrar días futuros en mes actual
    if(esActual){
      var hoyD = now.getDate();
      diasOrden = diasOrden.filter(function(k){
        var diaNum = parseInt(String(k).split('-')[2],10);
        return diaNum <= hoyD;
      });
      // asegurar que hoy aparezca aunque no tenga hechas (para ver timeline)
      var kHoy2=hoyKey();
      if(diasOrden.indexOf(kHoy2)<0){
        // solo si hay al menos un movimiento en el mes o es hoy mismo con partido?
        // lo agregamos al final para no vaciar si mes vacío
        // Si mes totalmente vacío, dejamos lista vacía y mostramos empty
      }
    }

    var htmlDays='';
    var diasConAlgo=0;
    diasOrden.forEach(function(k){
      var info = mapa[k] || null;
      var hechas = info ? (Number(info.hechas)||0) : 0;
      var total = info ? (Number(info.total)||0) : 0;
      var sem = semaforo(hechas, total);
      // items del día
      var items = [];
      try{ items = itemsDe(k); }catch(e){ items=[]; }
      var hechos = items.filter(function(it){ return it.hecha; });
      var hechosFiltrados = filtro ? hechos.filter(function(it){ return String(it.motivoId||'')===String(filtro); }) : hechos;
      // si filtro activo y no hay hechos de ese tipo ese día, saltear día a menos que tenga eventos que coincidan? Para no vaciar, saltamos
      if(filtro && !hechosFiltrados.length){
        // pero si el día tiene eventos y filtro es de tipo tarea, no mostrarlo (para foco)
        return;
      }
      // si no hay hechos ni eventos y no es hoy, saltear (no aporta)
      var evDay=[];
      try{ if(E() && E().listar) evDay = E().listar({dia:k})||[]; }catch(e){}
      if(!hechosFiltrados.length && !evDay.length && hechas===0) return;
      diasConAlgo++;
      var fmt = formatoDiaDetalle(k);
      var semCls = sem || (hechosFiltrados.length ? 'neutro' : 'neutro');
      var badge = total ? (hechas+'/'+total) : (hechosFiltrados.length ? (hechosFiltrados.length+' hecho'+(hechosFiltrados.length>1?'s':'')) : '');
      if(evDay.length && !total) badge = badge ? (badge+' · '+evDay.length+' mov.') : (evDay.length+' mov.');
      var dotEvent = evDay.length ? ' <span style="font-size:11px">· 💬</span>' : '';
      htmlDays += '<div class="tm-det-day" data-det-dia="'+esc(k)+'" role="button" tabindex="0" aria-label="Abrir '+esc(fmt.etiqu)+'">'
        + '<div class="tm-det-day-head"><strong>'+esc(fmt.etiqu)+(fmt.esHoy?' · Hoy':'')+'</strong><span class="right"><i class="sema '+esc(semCls)+'" aria-hidden="true"></i><span>'+esc(badge)+'</span>'+dotEvent+'</span></div>';
      if(hechosFiltrados.length){
        htmlDays += '<ul class="tm-det-list">' + hechosFiltrados.map(function(it){
          var desc = descTarea(it);
          var nom = it.nombre && it.nombre!=='Sin marcar' ? it.nombre : '';
          var ico = esc(it.icono||'✓');
          return '<li><span class="ico">'+ico+'</span><span class="who"><b>'+esc(desc)+'</b>'+(nom?'<small>'+esc(nom)+'</small>':'')+'</span></li>';
        }).join('') + '</ul>';
      } else if(filtro){
        var __fNom=''+filtro; try{ var __ff=filas.find(function(f){return f.id===filtro;}); if(__ff && __ff.nombre) __fNom=__ff.nombre; }catch(e){}
        htmlDays += '<div style="font-size:12px;font-weight:700;opacity:.6;padding:6px 0">Sin '+esc(__fNom)+' este día.</div>';
      } else if(evDay.length){
        // sin hechos pero con eventos: mostrar hint
        htmlDays += '<div style="font-size:12px;font-weight:700;opacity:.65;padding:6px 0">Sin tareas marcadas, pero hay '+evDay.length+' movimiento'+(evDay.length>1?'s':'')+' registrado'+(evDay.length>1?'s':'')+'.</div>';
      }
      if(evDay.length){
        // mini timeline resumido (hasta 3)
        var evShow = evDay.slice(-3).reverse();
        htmlDays += '<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px">'+evShow.map(function(ev){
          return '<span class="tm-det-chip" style="font-size:10.5px;padding:4px 8px">'+esc(iconoEv(ev.tipo))+' '+esc((ev.titulo||textoTipo(ev.tipo)).slice(0,22))+' · '+esc(horaDe(ev.ts))+'</span>';
        }).join('')+'</div>';
      }
      htmlDays += '</div>';
    });
    if(!diasConAlgo){
      var filtroNombre=''; if(filtro){ try{ var __ff2=filas.find(function(f){return f.id===filtro;}); filtroNombre=(__ff2 && __ff2.nombre)?__ff2.nombre:filtro; }catch(e){ filtroNombre=filtro; } }
      body.innerHTML = filtro
        ? '<div class="tm-det-empty">No hay “'+esc(filtroNombre)+'” marcados como Hecho en '+esc(MESES[mes])+'.<br>Probá con “Todos” o tocá otro filtro arriba.</div>'
        : '<div class="tm-det-empty">Este mes todavía no tiene días con Hecho.<br>Cuando marques ✓ en Las 10 o envíes un mensaje, va a aparecer acá — día por día, sin tocar nada extra.</div>';
    } else {
      body.innerHTML = htmlDays;
      // click en día → abrir modal del día (y cerrar detalle)
      body.querySelectorAll('[data-det-dia]').forEach(function(card){
        var k=card.getAttribute('data-det-dia');
        function go(){ cerrarDetalle(); setTimeout(function(){ abrirDia(k, k===hoyKey()); }, 120); }
        card.addEventListener('click', go);
        card.addEventListener('keydown', function(e){ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); go(); }});
      });
    }
  }
  function abrirDetalleMes(anio, mes, filtro){
    css();
    _detAnio = Number(anio)||hoy().getFullYear();
    _detMes = Number(mes)||hoy().getMonth();
    _detFiltro = String(filtro||'');
    asegurarDetalleDom();
    renderDetalleCuerpo();
    var v=document.getElementById('tmDetalle');
    if(v){ v.classList.add('on'); try{ document.body.classList.add('appi-scroll-lock'); }catch(e){} }
    // foco al cierre para accesibilidad
    setTimeout(function(){ try{ var c=document.querySelector('#tmDetalle .tm-det-close'); if(c) c.focus(); }catch(e){} }, 50);
  }


  function picado(on){
    var box = document.getElementById('tmPicado');
    if (!box) return;
    box.innerHTML = '';
    if (!on) return;
    var colores = ['#0b5878','#e8b84a','#f3eee3','#d4891a','#7dcc6a','#ff6b6b','#5b8def','#ffffff','#b03e12','#9a2d58'];
    var n = 200, i;
    for (i = 0; i < n; i++){
      var b = document.createElement('i');
      var w = 6 + Math.random() * 11;
      b.style.width = w + 'px';
      b.style.height = (8 + Math.random() * 16) + 'px';
      b.style.left = (Math.random() * 100) + 'vw';
      b.style.background = colores[i % colores.length];
      b.style.borderRadius = Math.random() > 0.65 ? '50%' : '2px';
      b.style.setProperty('--dx', (Math.random() * 120 - 60) + 'px');
      b.style.setProperty('--rot', (220 + Math.random() * 700) + 'deg');
      b.style.animationDuration = (3 + Math.random() * 3.2) + 's';
      b.style.animationDelay = (-Math.random() * 5) + 's';
      box.appendChild(b);
    }
  }

  function fiestaSiGano(){
    var api = M();
    if (!api || !api.partidoHoy) return;
    var p = api.partidoHoy();
    if (!p || !p.ganado) return;
    var k = hoyKey();
    var flag = 'appi_tumes_fiesta_' + k;
    try{ if (localStorage.getItem(flag)) return; localStorage.setItem(flag, '1'); }catch(e){ if (visto[k]) return; visto[k] = 1; }
    abrirDia(k, true, true);
  }

  function enganchar(){
    var api = M();
    if (api && !api.__tmHook && typeof api.marcarAccion === 'function'){
      api.__tmHook = true;
      var orig = api.marcarAccion;
      api.marcarAccion = function(){
        var r = orig.apply(this, arguments);
        try{
          var v = document.getElementById('view-tumes');
          if (v && v.classList.contains('active')) pintar();
          setTimeout(fiestaSiGano, 80);
        }catch(e){}
        return r;
      };
    }
    // cerebro: repintar si llega un evento y la vista está activa
    try{
      if(E() && !E().__tmLinked){
        E().__tmLinked = true;
        E()._onEmit = function(ev){
          try{
            var v = document.getElementById('view-tumes');
            if(v && v.classList.contains('active')) pintar();
          }catch(e){}
          // Si el modal de día está abierto y el evento es de ese día, refrescar modal
          try{
            var velo = document.getElementById('tmCierre');
            if(velo && velo.classList.contains('on')){
              var tit = document.querySelector('#tmCarta h2');
              // Si el evento es del día abierto, reabrir para mostrar nuevo timeline (suave)
              if(ev && ev.dia){
                var ya = document.querySelector('.tm-tl');
                if(ya){
                  // Re-render simple: cerrar y reabrir con mismo k sería brusco; mejor solo repintar métricas si hace falta
                  // Por ahora, pintar() ya actualiza puntitos; el timeline se verá al reabrir
                }
              }
            }
          }catch(e){}
        };
        window.addEventListener('appi-evento', function(e){
          try{ if(E()._onEmit) E()._onEmit(e.detail); }catch(err){}
        });
      }
    }catch(e){}
  }

  function abrir(){
    css();
    var n = hoy();
    vistaAnio = n.getFullYear();
    vistaMes = n.getMonth();
    if (typeof window.showView === 'function') window.showView('view-tumes');
    pintar();
    enganchar();
  }

  function cablearHome(){
    css();
    var card = document.querySelector('.home-month-card');
    if (!card || card.__tm) return;
    card.__tm = true;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', 'Abrir Tu mes');
    card.addEventListener('click', abrir);
    card.addEventListener('keydown', function(e){
      if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); abrir(); }
    });
  }

  window.openTuMes = abrir;
  window.APPITuMes = { pintar: pintar, abrir: abrir, abrirDia: abrirDia, abrirDetalle: abrirDetalleMes, cerrarDetalle: cerrarDetalle };

  function init(){
    cablearHome();
    enganchar();
    var v = document.getElementById('view-tumes');
    if (v && v.classList.contains('active')) pintar();
  }
  function envolverShow(){
    if (window.__tmShowDone || typeof window.showView !== 'function') return;
    window.__tmShowDone = 1;
    var orig = window.showView;
    window.showView = function(id){
      var r = orig.apply(this, arguments);
      try{
        if (id === 'view-tumes') setTimeout(pintar, 40);
        else cerrarDetalle();
      }catch(e){}
      return r;
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.addEventListener('appi-datasync-applied', function(){ try{ pintar(); }catch(e){} });
  window.addEventListener('appi-evento', function(){ try{ var v=document.getElementById('view-tumes'); if(v&&v.classList.contains('active')) pintar(); }catch(e){} });
  setTimeout(init, 700);
  setTimeout(envolverShow, 200);
  setTimeout(envolverShow, 900);
})();
