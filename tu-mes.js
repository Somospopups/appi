/* APPI · Tu mes
   El mes es un tablero de cartas. Cada día, las 10 de la jornada.
   La puerta es la franja de septiembre del Home. */
(function () {
  'use strict';

  var MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  var SEM = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  var cssListo = false;
  var visto = {};
  var vistaAnio = 0, vistaMes = 0;

  function M(){ return window.APPIMensajes || null; }
  function esc(s){
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function hoy(){ return new Date(); }
  function clave(d){
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }
  function hoyKey(){ return clave(hoy()); }
  function pila(n){
    try{ if (typeof window.nombreDePila === 'function'){ var v = window.nombreDePila(n); if (v) return v; } }catch(e){}
    var t = String(n || '').trim();
    if (!t) return '';
    if (t.indexOf(',') >= 0){
      var der = t.split(',')[1] || '';
      return (der.trim().split(/\s+/)[0] || t).replace(/^\w/, function(c){ return c.toUpperCase(); });
    }
    return t.split(/\s+/)[0];
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
            nombre: pila(u.usuario || u.nombre || '') || (u.usuario || ''),
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
      '.tm-sub{margin:0 0 14px;text-align:center;font-size:12.5px;font-weight:800;color:#686977}',
      'body.dark .tm-sub{color:#b8b9c5}',
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
      '.tm-dia .m{margin-top:auto;font-size:9.5px;opacity:.8}',
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
      '.tm-grupo{margin:10px 0 6px;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;opacity:.85}',
      '.tm-carta-cuerpo{overflow:auto;flex:1;min-height:0;-webkit-overflow-scrolling:touch}',
      '.tm-carta .cab{font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;opacity:.9}',
      '.tm-carta h2{margin:6px 0 10px;font-size:26px;letter-spacing:-.4px}',
      '.tm-carta ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}',
      '.tm-carta li{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:12px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.16);font-size:13.5px;font-weight:800}',
      '.tm-carta li.pend{opacity:.72}',
      '.tm-bola{flex:0 0 22px;width:22px;height:22px;border-radius:50%;background:#7dcc6a;color:#163512;display:grid;place-items:center;font-size:13px;font-weight:900}',
      '.tm-carta li.pend .tm-bola{background:rgba(255,255,255,.2);color:#fff}',
      '.tm-pie{margin-top:12px;text-align:center;font-size:13px;font-weight:800}',
      '.tm-x{position:absolute;top:4px;right:4px;z-index:6;width:44px;height:44px;border:0;border-radius:50%;background:rgba(0,0,0,.22);color:#fff;font-size:22px;font-weight:700;line-height:1;cursor:pointer;display:grid;place-items:center;padding:0}',
      '.tm-kpis{margin-top:16px;background:#fff;border-radius:18px;padding:14px 16px 10px;border:1px solid rgba(11,88,120,.08)}',
      'body.dark .tm-kpis{background:#25273a;border-color:rgba(255,255,255,.08)}',
      '.tm-kpis .tm-frase{margin:0 0 10px;font-size:14.5px;font-weight:800;line-height:1.4;color:#1d1d2c}',
      'body.dark .tm-kpis .tm-frase{color:#f3eee3}',
      '.tm-kpis ul{list-style:none;margin:0;padding:0}',
      '.tm-kpis li{display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-top:1px solid #efeae0;font-size:14px;font-weight:800}',
      'body.dark .tm-kpis li{border-top-color:rgba(255,255,255,.08)}',
      '.tm-kpis li:first-child{border-top:0}',
      '.tm-kpis li i{font-style:normal;color:#0b5878;font-size:16px;font-weight:900}',
      'body.dark .tm-kpis li i{color:#8ec8e0}'
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
    return orden.map(function(o){ return { icono: o.icono, nombre: o.nombre, n: cnt[o.id] || 0 }; });
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
    box.innerHTML = '<p class="tm-frase">' + esc(frase) + '</p><ul>' +
      filas.map(function(f){
        return '<li><span>' + f.icono + ' ' + esc(f.nombre) + '</span><i>' + f.n + '</i></li>';
      }).join('') + '</ul>';
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

    var sem = SEM.map(function(d){ return '<span>' + d + '</span>'; }).join('');
    var celdas = '';
    var shift = (new Date(anio, mes, 1).getDay() + 6) % 7;
    var i;
    for (i = 0; i < shift; i++) celdas += '<button type="button" class="tm-dia" disabled></button>';
    var last = new Date(anio, mes+1, 0).getDate();
    for (i = 1; i <= last; i++){
      var k = anio + '-' + String(mes+1).padStart(2,'0') + '-' + String(i).padStart(2,'0');
      var info = mapa[k];
      var futuro = esActual && i > diaHoy;
      var esHoyCel = esActual && i === diaHoy;
      var hDia = info && info.total ? (Number(info.hechas)||0) : (esHoyCel && partido && partido.hay ? partido.hechas : 0);
      var tDia = info && info.total ? info.total : (esHoyCel && partido && partido.hay ? partido.total : 0);
      var sem = futuro ? '' : semaforo(hDia, tDia);
      var tipo = (futuro ? 'futuro' : '') + (esHoyCel ? ' hoy' : '') + (sem ? ' ' + sem : '');
      var marca = esHoyCel ? 'Hoy ' + i : String(i);
      var mini = '';
      if (tDia){
        mini = '<span class="m">' + hDia + ' / ' + tDia + '</span>';
      } else if (futuro){
        mini = '<span class="m">sin abrir</span>';
      } else {
        mini = '<span class="m">sin movimiento</span>';
      }
      celdas += '<button type="button" class="tm-dia ' + tipo + '" data-tm-dia="' + k + '"' +
        (futuro ? ' disabled' : '') + '><span class="n">' + esc(marca) + '</span>' + mini + '</button>';
    }
    host.innerHTML = '<div class="tm-sem">' + sem + '</div><div class="tm-grid" style="margin-top:8px">' + celdas + '</div>';
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
            nombre: pila(it.n) || it.n || '',
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
          nombre: pila(marca && marca.n) || (marca && marca.n) || '',
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
      var nom = it.nombre ? it.nombre : it.motivo;
      var txt = it.icono + ' ' + nom + (it.motivo && it.nombre ? ' · ' + it.motivo : '');
      return '<li class="' + (ok ? 'ok' : 'pend') + '"><span class="tm-bola">' + (ok ? '✓' : '·') + '</span>' + esc(txt) + '</li>';
    }
    var okItems = items.filter(function(x){ return x.hecha; });
    var noItems = items.filter(function(x){ return !x.hecha; });
    var lista = '<p class="tm-grupo">Hecho · ' + okItems.length + '</p><ul>';
    lista += okItems.length
      ? okItems.map(function(it){ return fila(it, true); }).join('')
      : '<li class="pend"><span class="tm-bola">·</span>Todavía nadie.</li>';
    lista += '</ul><p class="tm-grupo">Falta · ' + noItems.length + '</p><ul>';
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
    var carta = document.getElementById('tmCarta');
    carta.className = 'tm-carta' + (sem ? ' ' + sem : '');
    carta.innerHTML =
      '<button type="button" class="tm-x" aria-label="Cerrar">×</button>' +
      '<div class="tm-carta-cuerpo">' +
      '<div class="cab">💙 Para vos</div>' +
      '<h2>' + esc(tit) + '</h2>' +
      lista +
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
    if (!api || api.__tmHook) return;
    if (typeof api.marcarAccion !== 'function') return;
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
  window.APPITuMes = { pintar: pintar, abrir: abrir, abrirDia: abrirDia };

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
      try{ if (id === 'view-tumes') setTimeout(pintar, 40); }catch(e){}
      return r;
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.addEventListener('appi-datasync-applied', function(){ try{ pintar(); }catch(e){} });
  setTimeout(init, 700);
  setTimeout(envolverShow, 200);
  setTimeout(envolverShow, 900);
})();
