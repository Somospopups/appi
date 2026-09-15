/* ============================================================
   APPI · Ruleta PSA (v801 → v802)
   ------------------------------------------------------------
   Una ruleta animada y con sonido para jugar con el trabajo del
   día: la girás y cae una tarea de PSA real (escribirle a 3
   clientes, llamar, pedir referido, demo, revisar stock…) o un
   premio ("¡Ya fue mucho por hoy!" o "⭐⭐ Doble").
   - v802: la entrada vive en Mi negocio (en el lugar donde estaba
     el GPS del mes). Cada tarea trae su botón "IR →" que te lleva
     directo a la sección (stock → Mi Stock, negocio → Mi negocio,
     tareas de cliente → la ficha de ese cliente lista para escribir).
   - Racha 🔥: días consecutivos con al menos una ⭐.
   - ⭐⭐ Doble: si cae, cada ✓ del día vale 2 ⭐.
   - Los nombres salen de la base del teléfono (usuariosTodosActual).
   - Sin archivos externos: canvas + WebAudio (bips, ticks y
     campanita), funciona offline como el resto de la app.
   ============================================================ */
(function(){
'use strict';
if (window.APPIRuleta) return;

var LINK_RETROLAVADO = 'https://www.youtube.com/watch?v=qa6xkQQsyg8';

/* ---------- datos ---------- */
function uid(){
  try{
    if (window.APPIAuth && typeof window.APPIAuth.userId === 'function'){
      var u = window.APPIAuth.userId();
      if (u) return u;
    }
  }catch(e){}
  return 'local';
}
function storeKey(){ return 'appi_ruleta_v1_' + uid(); }
function hoyISO(){
  var h = new Date();
  return h.getFullYear() + '-' + String(h.getMonth()+1).padStart(2,'0') + '-' + String(h.getDate()).padStart(2,'0');
}
function claveDe(d){
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
function leerEstado(){
  try{
    var raw = JSON.parse(localStorage.getItem(storeKey()) || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  }catch(e){ return {}; }
}
function estadoHoy(){
  var d = leerEstado();
  return d[hoyISO()] || { tareas: 0, log: [], doble: false };
}
function rachaRuleta(){
  // Días seguidos con al menos una ⭐. Si hoy todavía no se marcó
  // nada, la racha se cuenta desde ayer (el día de hoy no la corta).
  var d = leerEstado();
  var n = 0;
  var fecha = new Date();
  if (!estadoHoy().tareas) fecha.setDate(fecha.getDate() - 1);
  for (var i = 0; i < 60; i++){
    var dia = d[claveDe(fecha)];
    if (!dia || !(dia.tareas > 0)) break;
    n++;
    fecha.setDate(fecha.getDate() - 1);
  }
  return n;
}
function setDoble(){
  var d = leerEstado();
  var k = hoyISO();
  if (!d[k]) d[k] = { tareas: 0, log: [], doble: false };
  d[k].doble = true;
  d[k].log.push({ t: Date.now(), detalle: '⭐⭐ Doble activado' });
  try{ localStorage.setItem(storeKey(), JSON.stringify(d)); }catch(e){}
  pintarTarjeta();
}
function sumarTarea(detalle, ganancia){
  var d = leerEstado();
  var k = hoyISO();
  if (!d[k]) d[k] = { tareas: 0, log: [], doble: false };
  var g = ganancia || (d[k].doble ? 2 : 1);
  d[k].tareas = (d[k].tareas || 0) + g;
  d[k].log.push({ t: Date.now(), detalle: String(detalle || '').slice(0, 80), g: g });
  try{ localStorage.setItem(storeKey(), JSON.stringify(d)); }catch(e){}
  pintarTarjeta();
  return g;
}

function contactos(){
  try{
    var lista = (typeof window.usuariosTodosActual === 'function') ? (window.usuariosTodosActual() || []) : [];
    return lista.filter(function(u){ return u && (u.usuario || u.nombre) && (u.telf || u.telefono); });
  }catch(e){ return []; }
}
function nombreDe(u){
  var n = String((u && (u.usuario || u.nombre)) || '').trim();
  if (n.indexOf(',') >= 0) n = n.split(',')[0];
  return n || 'cliente';
}
function telDigitos(u){
  return String((u && (u.telf || u.telefono)) || '').replace(/\D/g, '');
}
function repartir(cs, n){
  var out = [], copia = cs.slice();
  for (var i = 0; i < n; i++){
    if (!copia.length) { out.push(null); continue; }
    out.push(copia.splice(Math.floor(Math.random() * copia.length), 1)[0]);
  }
  return out;
}

/* ---------- segmentos ---------- */
function armarSegmentos(){
  var cs = contactos();
  var r = repartir(cs, 5);
  return [
    { id: 'msg3',    ico: '💬', corto: '3 MENSAJES',   color: '#0b5878', kind: 'msg3',    users: cs.length >= 3 ? repartir(cs, 3) : cs.slice(0,3) },
    { id: 'llamada', ico: '📞', corto: 'LLAMAR',        color: '#168765', kind: 'llamada', user: r[0] },
    { id: 'referido',ico: '🗣️', corto: 'REFERIDO',      color: '#b8860b', kind: 'referido', user: r[1] },
    { id: 'mucho',   ico: '🏆', corto: 'MUCHO POR HOY', color: '#3a7bd5', kind: 'mucho' },
    { id: 'doble',   ico: '⭐⭐', corto: 'DOBLE',        color: '#e8a020', kind: 'doble' },
    { id: 'demo',    ico: '💧', corto: 'DEMO',          color: '#0e9594', kind: 'demo',    user: r[2] },
    { id: 'stock',   ico: '📦', corto: 'STOCK',         color: '#8e44ad', kind: 'stock' },
    { id: 'retro',   ico: '🔧', corto: 'RETOLAVADO',    color: '#c0392b', kind: 'retro' },
    { id: 'negocio', ico: '💼', corto: 'NEGOCIO',       color: '#d35400', kind: 'negocio' },
    { id: 'escribir',ico: '✍️', corto: 'ESCRIBIR',      color: '#2c6e49', kind: 'escribir', user: r[3] },
    { id: 'checkin', ico: '👋', corto: 'CHECK-IN',      color: '#6a4c93', kind: 'checkin', user: r[4] }
  ];
}

/* ---------- audio (WebAudio, sin archivos) ---------- */
var AC = null;
function ctx(){
  try{
    if (!AC){
      var W = window.AudioContext || window.webkitAudioContext;
      if (W) AC = new W();
    }
    if (AC && AC.state === 'suspended') AC.resume();
    return AC;
  }catch(e){ return null; }
}
function blip(freq, dur, type, gain){
  var c = ctx(); if (!c) return;
  try{
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || 'square';
    o.frequency.value = freq || 1500;
    g.gain.setValueAtTime(gain || 0.05, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + (dur || 0.03));
    o.connect(g); g.connect(c.destination);
    o.start(); o.stop(c.currentTime + (dur || 0.03) + 0.02);
  }catch(e){}
}
function tic(){ blip(1900, 0.028, 'square', 0.055); }
function whoosh(){
  var c = ctx(); if (!c) return;
  try{
    var dur = 0.9, buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    var src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = buf;
    f.type = 'lowpass';
    f.frequency.setValueAtTime(300, c.currentTime);
    f.frequency.exponentialRampToValueAtTime(2400, c.currentTime + dur * 0.5);
    g.gain.setValueAtTime(0.10, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    src.connect(f); f.connect(g); g.connect(c.destination);
    src.start();
  }catch(e){}
}
function campana(ganadora){
  var notas = ganadora ? [523.25, 659.25, 783.99, 1046.5, 1318.5] : [523.25, 659.25, 783.99];
  var c = ctx(); if (!c) return;
  try{
    notas.forEach(function(f, i){
      setTimeout(function(){ blip(f, 0.22, 'triangle', 0.14); }, i * 110);
    });
  }catch(e){}
}

/* ---------- navegación (sistema de las tarjetas) ---------- */
function irPara(seg){
  function go(fn){
    return function(){
      try{ fn(); }catch(e){}
      try{ cerrar(); }catch(e2){}
    };
  }
  switch (seg.kind){
    case 'stock':
      return { label: 'IR → Mi Stock', go: go(function(){
        if (typeof window.openStock === 'function') window.openStock();
        else if (typeof window.showView === 'function') window.showView('view-stock');
      }) };
    case 'negocio':
      return { label: 'IR → Mi negocio', go: go(function(){
        if (typeof window.showView === 'function') window.showView('view-negocio');
      }) };
    case 'retro':
    case 'msg3':
      return { label: 'IR → Mis clientes', go: go(function(){
        if (typeof window.showView === 'function') window.showView('view-usuarios');
      }) };
    case 'llamada': case 'referido': case 'demo': case 'escribir': case 'checkin':
      if (seg.user){
        var u = seg.user;
        return { label: 'IR → Ficha de ' + nombreDe(u), go: go(function(){
          if (typeof window.showView === 'function') window.showView('view-usuarios');
          try{
            if (window.APPIMensajes && window.APPIMensajes.abrirFilaUsuario){
              setTimeout(function(){
                try{ window.APPIMensajes.abrirFilaUsuario('checkin', u); }catch(e){}
              }, 250);
            }
          }catch(e){}
        }) };
      }
      return { label: 'IR → Mis clientes', go: go(function(){
        if (typeof window.showView === 'function') window.showView('view-usuarios');
      }) };
    default:
      return null; // premios: no hay destino
  }
}

/* ---------- DOM ---------- */
var overlay, canvas, card, pointer, girando = false, rotacion = 0, segs = [];

function css(){
  if (document.getElementById('ruletaCss')) return;
  var st = document.createElement('style');
  st.id = 'ruletaCss';
  st.textContent = [
    '.ruleta-cta{display:flex;align-items:center;gap:10px;width:100%;box-sizing:border-box;margin:0;padding:10px 12px;border:0;border-radius:16px;background:linear-gradient(135deg,#0b5878,#3ad0a4);color:#fff;cursor:pointer;text-align:left;box-shadow:0 6px 18px rgba(11,88,120,.28)}',
    '.ruleta-cta:active{transform:scale(.985)}',
    '.ruleta-cta-ico{font-size:26px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.25))}',
    '.ruleta-cta-txt{flex:1;min-width:0;font:inherit}',
    '.ruleta-cta-txt b{display:block;font-size:14px}',
    '.ruleta-cta-txt span{display:block;font-size:11.5px;opacity:.92}',
    '.ruleta-cta-go{font-size:12px;font-weight:900;background:rgba(255,255,255,.18);padding:7px 12px;border-radius:999px;letter-spacing:.4px}',
    '.ruleta-neg-sub{font-size:12.5px;color:#8a8a94;margin:2px 0 10px}',
    '.ruleta-ov{position:fixed;inset:0;z-index:9999;background:rgba(16,18,30,.72);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity .22s}',
    '.ruleta-ov.open{opacity:1;pointer-events:auto}',
    '.ruleta-box{position:relative;width:min(92vw,380px);text-align:center}',
    '.ruleta-title{color:#fff;font-size:19px;font-weight:900;margin:0 0 4px;text-shadow:0 2px 8px rgba(0,0,0,.4)}',
    '.ruleta-sub{color:rgba(255,255,255,.75);font-size:12.5px;margin:0 0 14px}',
    '.ruleta-wheel{position:relative;width:100%;aspect-ratio:1/1;margin:0 auto}',
    '.ruleta-wheel canvas{width:100%;height:100%;display:block}',
    '.ruleta-pointer{position:absolute;top:-6px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:14px solid transparent;border-right:14px solid transparent;border-top:24px solid #ffd166;filter:drop-shadow(0 3px 4px rgba(0,0,0,.45));z-index:3;transform-origin:50% 100%}',
    '.ruleta-pointer.tick{animation:ruletaTick .09s ease}',
    '@keyframes ruletaTick{0%{transform:translateX(-50%) rotate(0)}50%{transform:translateX(-50%) rotate(-14deg)}100%{transform:translateX(-50%) rotate(0)}}',
    '.ruleta-hub{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:34%;height:34%;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ffffff,#dfe6ee 70%,#c8d2de);border:5px solid #fff;box-shadow:0 6px 16px rgba(0,0,0,.35);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:2;cursor:pointer;font:inherit;color:#0b5878}',
    '.ruleta-hub span{font-size:11px;font-weight:900;letter-spacing:.6px}',
    '.ruleta-confetti{position:absolute;inset:0;pointer-events:none;z-index:4}',
    '.ruleta-card{position:relative;margin-top:16px;background:#fff;border-radius:18px;padding:16px;text-align:left;box-shadow:0 18px 44px rgba(0,0,0,.4);display:none;max-height:56vh;overflow:auto}',
    '.ruleta-card.show{display:block;animation:ruletaUp .3s cubic-bezier(.2,1.4,.4,1)}',
    '@keyframes ruletaUp{from{transform:translateY(24px) scale(.96);opacity:0}to{transform:none;opacity:1}}',
    '.ruleta-card-h{display:flex;align-items:center;gap:10px;margin-bottom:8px}',
    '.ruleta-card-ico{font-size:30px}',
    '.ruleta-card-h b{font-size:16px;color:#1c1c2e}',
    '.ruleta-card p{margin:6px 0;font-size:13px;color:#5c5c66;line-height:1.45}',
    '.ruleta-persona{display:flex;align-items:center;justify-content:space-between;gap:8px;background:#f4f6fb;border-radius:12px;padding:9px 11px;margin:7px 0}',
    '.ruleta-persona b{display:block;font-size:13.5px;color:#1c1c2e}',
    '.ruleta-persona span{font-size:11.5px;color:#8a8a94}',
    '.ruleta-wa{flex:0 0 auto;border:0;border-radius:11px;background:#25d366;color:#fff;font:inherit;font-size:12px;font-weight:800;padding:9px 12px;cursor:pointer}',
    '.ruleta-wa:active{transform:scale(.96)}',
    '.ruleta-call{flex:0 0 auto;border:1px solid #168765;border-radius:11px;background:#fff;color:#168765;font:inherit;font-size:12px;font-weight:800;padding:9px 12px;cursor:pointer;text-decoration:none}',
    '.ruleta-card-foot{display:flex;gap:8px;margin-top:12px}',
    '.ruleta-done{flex:1;border:0;border-radius:12px;background:linear-gradient(135deg,#0b5878,#3ad0a4);color:#fff;font:inherit;font-size:14px;font-weight:900;padding:12px;cursor:pointer}',
    '.ruleta-close{flex:0 0 auto;border:1px solid #d8dbe4;border-radius:12px;background:#fff;color:#5c5c66;font:inherit;font-size:13px;font-weight:700;padding:12px 14px;cursor:pointer}',
    '.ruleta-ir{display:block;width:100%;margin-top:8px;border:0;border-radius:12px;background:linear-gradient(135deg,#3a7bd5,#5b8def);color:#fff;font:inherit;font-size:13.5px;font-weight:800;padding:12px;cursor:pointer}',
    '.ruleta-ir:active{transform:scale(.985)}'
  ].join('\n');
  document.head.appendChild(st);
}

function montar(){
  css();
  if (overlay) return;
  overlay = document.createElement('div');
  overlay.className = 'ruleta-ov';
  overlay.id = 'ruletaOv';
  overlay.innerHTML =
    '<div class="ruleta-box">' +
      '<h3 class="ruleta-title">🎰 Ruleta PSA</h3>' +
      '<p class="ruleta-sub" id="ruletaSub">Girala y sabé qué hacer ahora.</p>' +
      '<div class="ruleta-wheel">' +
        '<div class="ruleta-pointer" id="ruletaPointer"></div>' +
        '<canvas id="ruletaCanvas"></canvas>' +
        '<button type="button" class="ruleta-hub" id="ruletaHub"><span>GIRAR</span></button>' +
        '<canvas class="ruleta-confetti" id="ruletaConfetti"></canvas>' +
      '</div>' +
      '<div class="ruleta-card" id="ruletaCard"></div>' +
    '</div>';
  document.body.appendChild(overlay);
  canvas = overlay.querySelector('#ruletaCanvas');
  pointer = overlay.querySelector('#ruletaPointer');
  card = overlay.querySelector('#ruletaCard');
  overlay.addEventListener('click', function(e){ if (e.target === overlay) cerrar(); });
  overlay.querySelector('#ruletaHub').addEventListener('click', function(){ girar(); });
  redibujar();
  window.addEventListener('resize', redibujar);
}

function abrir(){
  montar();
  segs = armarSegmentos();
  rotacion = 0;
  girando = false;
  card.classList.remove('show');
  var sub = overlay.querySelector('#ruletaSub');
  if (sub){
    var racha = rachaRuleta();
    sub.textContent = 'Girala y sabé qué hacer ahora.' + (racha > 1 ? ' · 🔥 racha ' + racha + ' días' : '');
  }
  overlay.classList.add('open');
  if (typeof window.bloquearScrollCuerpo === 'function') { try{ window.bloquearScrollCuerpo(); }catch(e){} }
  redibujar();
}
function cerrar(){
  if (!overlay) return;
  overlay.classList.remove('open');
  if (typeof window.liberarScrollCuerpo === 'function') { try{ window.liberarScrollCuerpo(); }catch(e){} }
}

/* ---------- dibujo ---------- */
function redibujar(){
  if (!canvas) return;
  var box = canvas.parentElement;
  var size = Math.max(200, Math.min(380, box.clientWidth || 340));
  var dpr = window.devicePixelRatio || 1;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  var c = canvas.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  var cx = size / 2, cy = size / 2, R = size / 2;
  var n = segs.length, ang = (Math.PI * 2) / n;
  c.clearRect(0, 0, size, size);
  c.save();
  c.translate(cx, cy);
  c.rotate(rotacion * Math.PI / 180);
  for (var i = 0; i < n; i++){
    var a0 = i * ang - Math.PI / 2, a1 = a0 + ang;
    c.beginPath();
    c.moveTo(0, 0);
    c.arc(0, 0, R, a0, a1);
    c.closePath();
    c.fillStyle = segs[i].color;
    c.fill();
    c.strokeStyle = 'rgba(255,255,255,.85)';
    c.lineWidth = 2;
    c.stroke();
    var mid = a0 + ang / 2;
    c.save();
    c.rotate(mid);
    c.textAlign = 'right';
    c.textBaseline = 'middle';
    c.fillStyle = '#fff';
    c.font = '900 ' + Math.round(size * 0.036) + 'px system-ui, sans-serif';
    c.fillText(segs[i].ico + ' ' + segs[i].corto, R * 0.86, 0);
    c.restore();
  }
  c.restore();
}

/* ---------- giro ---------- */
function angSegmento(){ return 360 / segs.length; }
function segBajoAguja(rot){
  // El aguja está arriba (270° en pantalla) y el segmento 0 se dibuja
  // también arriba: el punto bajo la aguja está en (-rot) mod 360.
  var bajo = ((-rot) % 360 + 360) % 360;
  var a = angSegmento();
  return Math.min(segs.length - 1, Math.floor(bajo / a));
}
function girar(forzado, opts){
  opts = opts || {};
  if (!segs.length) { segs = armarSegmentos(); redibujar(); }
  if (girando) return;
  girando = true;
  card.classList.remove('show');
  var dur = opts.dur || 5200;
  var vueltas = (5 + Math.floor(Math.random() * 3)) * 360;
  var a = angSegmento();
  var idx = forzado != null ? forzado : Math.floor(Math.random() * segs.length);
  var jitter = (Math.random() * 0.7 - 0.35) * a;
  // R final tal que el centro del segmento idx quede bajo la aguja:
  // (-R) mod 360 = (idx + 0.5) * ang  =>  R ≡ -(idx+0.5)*ang (mod 360).
  var objetivo = (-(idx + 0.5) * a + jitter + 360 * 4) % 360;
  var inicio = rotacion;
  var delta = vueltas + ((objetivo - (inicio % 360)) % 360 + 360) % 360;
  var t0 = performance.now();
  var ultimoSeg = segBajoAguja(inicio);
  whoosh();
  function paso(now){
    var t = Math.min(1, (now - t0) / dur);
    var e = 1 - Math.pow(1 - t, 5); // easeOutQuint
    rotacion = inicio + delta * e;
    var s = segBajoAguja(rotacion);
    if (s !== ultimoSeg){
      ultimoSeg = s;
      tic();
      if (pointer){
        pointer.classList.remove('tick');
        void pointer.offsetWidth;
        pointer.classList.add('tick');
      }
    }
    redibujar();
    if (t < 1) { requestAnimationFrame(paso); }
    else {
      girando = false;
      rotacion = inicio + delta;
      redibujar();
      mostrarResultado(segs[idx]);
    }
  }
  requestAnimationFrame(paso);
}

/* ---------- resultado ---------- */
function waAbrir(url){
  try{
    if (window.APPIWhatsApp && typeof window.APPIWhatsApp.abrir === 'function') { window.APPIWhatsApp.abrir(url); return; }
  }catch(e){}
  window.open(url, '_blank', 'noopener');
}
function mensajePara(kind, n){
  n = n || 'cliente';
  switch (kind){
    case 'llamada':  return 'Hola ' + n + '! Te llamo en unos minutos, ¿estás?';
    case 'referido': return 'Hola ' + n + '! Si conocés a alguien que esté pensando en un purificador, te agradezco que me lo/a presente. 🙌';
    case 'demo':     return 'Hola ' + n + '! ¿Te parece si te muestro el purificador en persona? Le sacamos 15 minutos.';
    case 'escribir': return 'Hola ' + n + '! 👋 Pasando a saludarte. ¿Cómo andás con tu purificador? Cualquier cosa, acá estoy.';
    case 'checkin':  return 'Hola ' + n + '! ¿Cómo viene el equipo? Si necesitás algo o querés saber cómo mantenerlo, me escribís.';
    case 'retro':    return 'Hola ' + n + '! Te dejo el video del retrolavado: en 5 minutos lo tenés listo. ' + LINK_RETROLAVADO;
    default:         return 'Hola ' + n + '! 👋';
  }
}
function personaHTML(u, kind){
  if (!u) return '';
  var nombre = nombreDe(u);
  var tel = telDigitos(u);
  var botones = '';
  if (tel && kind !== 'llamada'){
    botones += '<button type="button" class="ruleta-wa" data-ruleta-wa="' + encodeURIComponent(mensajePara(kind, nombre)) + '">💬 WhatsApp</button>';
  }
  if (tel){
    botones += '<a class="ruleta-call" data-ruleta-tel="' + tel + '" href="tel:' + tel + '">📞 Llamar</a>';
  }
  return '<div class="ruleta-persona"><div><b>' + nombre + '</b><span>' + (u.telf || u.telefono || '') + '</span></div><div style="display:flex;gap:6px">' + botones + '</div></div>';
}
function toastMsg(msg){
  try{
    if (window.APPIDialog && window.APPIDialog.toast) { window.APPIDialog.toast(msg); return; }
    if (typeof toast === 'function') toast(msg);
  }catch(e){}
}
function mostrarResultado(seg){
  var ganadora = seg.kind === 'mucho' || seg.kind === 'doble';
  if (ganadora) campana(true); else campana(false);
  if (ganadora) confetti();
  var h = { ico: seg.ico, t: '', p: '', cuerpo: '' };
  switch (seg.kind){
    case 'msg3':
      h.t = '¡3 mensajes para hoy!';
      h.p = 'Escribile a cualquiera de estos tres clientes (o a los tres, si el día lo permite):';
      h.cuerpo = seg.users.filter(Boolean).map(function(u){ return personaHTML(u, 'escribir'); }).join('') ||
        '<p>Aún no tenés clientes cargados: cargá tu base de garantías y la ruleta los usará.</p>';
      break;
    case 'llamada':
      h.t = 'Llamá a ' + (seg.user ? nombreDe(seg.user) : 'un cliente');
      h.p = 'Una llamada vale más que diez mensajes. Contale algo nuevo de PSA o preguntale cómo viene el equipo.';
      h.cuerpo = personaHTML(seg.user, 'llamada') || '<p>Aún no tenés clientes cargados: elegí a un conocido para llamar.</p>';
      break;
    case 'referido':
      h.t = 'Pedile un referido a ' + (seg.user ? nombreDe(seg.user) : 'un cliente');
      h.p = 'El referido es el cliente más barato que tenés. Preguntale si conoce a alguien que esté pensando en un purificador.';
      h.cuerpo = personaHTML(seg.user, 'referido');
      break;
    case 'demo':
      h.t = 'Agendá una demo con ' + (seg.user ? nombreDe(seg.user) : 'un cliente');
      h.p = 'Diez minutos con el purificador encendido convencen más que mil palabras. Proponé un día y una hora.';
      h.cuerpo = personaHTML(seg.user, 'demo');
      break;
    case 'stock':
      h.t = 'Acordá entregas y acomodá el stock';
      h.p = 'Mirá qué está en tu stock, qué se está por entregar y qué falta. Un stock ordenado es una venta lista.';
      break;
    case 'retro':
      h.t = 'Compartí el video de retrolavado';
      h.p = 'Mandale el video del retrolavado a un cliente (o publicalo en tus historias): mantenimiento fácil = cliente contento.';
      h.cuerpo = (seg.user ? personaHTML(seg.user, 'retro') : '<button type="button" class="ruleta-wa" data-ruleta-wa="' + encodeURIComponent('Hola! Te dejo el video del retrolavado: en 5 minutos lo tenés listo. ' + LINK_RETROLAVADO) + '">💬 Copiar mensaje</button>');
      break;
    case 'negocio':
      h.t = 'Contale la oportunidad a 1 persona';
      h.p = 'Presentale la oportunidad de negocio de PSA a una persona de confianza. Un "tal vez" hoy puede ser un distribuidor mañana.';
      break;
    case 'mucho':
      h.t = '🏆 ¡Ya fue mucho por hoy!';
      h.p = 'La ruleta te exime: hoy ya hiciste lo suficiente. Descansá con la cabeza tranquila, mañana se vuelve a girar. Tu racha sigue intacta.';
      break;
    case 'doble':
      h.t = '⭐⭐ ¡Hoy rinde DOBLE!';
      h.p = 'Cada tarea que marques hoy suma 2 ⭐. Aprovechá el día: la racha también cuenta doble.';
      break;
    case 'escribir':
      h.t = 'Escribile a ' + (seg.user ? nombreDe(seg.user) : 'un cliente');
      h.p = 'Un mensaje corto y a tiempo mantiene vivo el vínculo. Tocá IR para abrir la ficha con el texto listo.';
      h.cuerpo = personaHTML(seg.user, 'escribir');
      break;
    case 'checkin':
      h.t = 'Check-in con ' + (seg.user ? nombreDe(seg.user) : 'un cliente');
      h.p = 'Preguntale cómo viene el equipo. Un check-in a tiempo es la mitad de la renovación.';
      h.cuerpo = personaHTML(seg.user, 'checkin');
      break;
    default:
      h.t = seg.corto;
      h.p = 'Tarea de PSA del día.';
  }
  var ir = irPara(seg);
  var html = '<div class="ruleta-card-h"><span class="ruleta-card-ico">' + h.ico + '</span><b>' + h.t + '</b></div>' +
    (h.p ? '<p>' + h.p + '</p>' : '') +
    h.cuerpo +
    '<div class="ruleta-card-foot">' +
      (seg.kind === 'doble'
        ? '<button type="button" class="ruleta-done" data-ruleta-doble>⭐⭐ ¡Doblar el día!</button>'
        : (ganadora
          ? '<button type="button" class="ruleta-done" data-ruleta-ok="1">🏆 ¡Lo tomo! Cierro el día</button>'
          : '<button type="button" class="ruleta-done" data-ruleta-ok="1">✓ Ya la hice (o la hago ahora)</button>')) +
      '<button type="button" class="ruleta-close" data-ruleta-cerrar>×</button>' +
    '</div>' +
    (ir ? '<button type="button" class="ruleta-ir" data-ruleta-ir>➜ ' + ir.label + '</button>' : '');
  card.innerHTML = html;
  card.classList.add('show');
  card.querySelectorAll('[data-ruleta-wa]').forEach(function(b){
    b.addEventListener('click', function(){
      waAbrir('https://wa.me/?text=' + b.getAttribute('data-ruleta-wa'));
    });
  });
  var irBtn = card.querySelector('[data-ruleta-ir]');
  if (irBtn && ir) irBtn.addEventListener('click', ir.go);
  var dobleBtn = card.querySelector('[data-ruleta-doble]');
  if (dobleBtn) dobleBtn.addEventListener('click', function(){
    setDoble();
    campana(true);
    confetti();
    cerrar();
    toastMsg('⭐⭐ ¡Hoy rinde x2!');
  });
  var ok = card.querySelector('[data-ruleta-ok]');
  if (ok) ok.addEventListener('click', function(){
    var g = sumarTarea(h.t);
    var racha = rachaRuleta();
    campana(true);
    confetti();
    cerrar();
    toastMsg('+' + g + ' ⭐' + (racha > 1 ? ' · 🔥 racha ' + racha : ''));
  });
  var x = card.querySelector('[data-ruleta-cerrar]');
  if (x) x.addEventListener('click', cerrar);
}

/* ---------- confetti ---------- */
function confetti(){
  var cv = overlay && overlay.querySelector('#ruletaConfetti');
  if (!cv) return;
  try{
    var dpr = window.devicePixelRatio || 1;
    var w = cv.clientWidth, h = cv.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    var c = cv.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    var colores = ['#ffd166', '#3ad0a4', '#3a7bd5', '#ff7b9c', '#fff'];
    var ps = [];
    for (var i = 0; i < 90; i++){
      ps.push({
        x: w / 2, y: h / 2,
        vx: (Math.random() - 0.5) * 9,
        vy: -Math.random() * 8 - 2,
        s: Math.random() * 6 + 3,
        r: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        col: colores[Math.floor(Math.random() * colores.length)]
      });
    }
    var t0 = performance.now();
    (function paso(now){
      var t = now - t0;
      c.clearRect(0, 0, w, h);
      ps.forEach(function(p){
        p.x += p.vx; p.y += p.vy; p.vy += 0.25; p.r += p.vr;
        c.save(); c.translate(p.x, p.y); c.rotate(p.r);
        c.fillStyle = p.col; c.globalAlpha = Math.max(0, 1 - t / 1800);
        c.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
        c.restore();
      });
      if (t < 1800) requestAnimationFrame(paso);
      else c.clearRect(0, 0, w, h);
    })(t0);
  }catch(e){}
}

/* ---------- tarjeta en Mi negocio (v802: el lugar del GPS) ---------- */
function pintarTarjeta(){
  var vista = document.getElementById('view-negocio');
  if (!vista || vista.style.display === 'none') return;
  var est = estadoHoy();
  var racha = rachaRuleta();
  var cardN = vista.querySelector('#ruletaNegCard');
  if (!cardN){
    var header = vista.querySelector('header');
    if (!header) return;
    cardN = document.createElement('div');
    cardN.id = 'ruletaNegCard';
    cardN.className = 'tb-card';
    cardN.style.margin = '0 0 12px';
    header.insertAdjacentElement('afterend', cardN);
  }
  cardN.innerHTML =
    '<div class="tb-title">🎰 Ruleta PSA</div>' +
    '<div class="ruleta-neg-sub">Girala y sabé qué hacer ahora. Cada ✓ suma una ⭐' +
      (est.doble ? ' <b style="color:#e8a020">(hoy rinde x2)</b>' : '') + '</div>' +
    '<button type="button" class="ruleta-cta" id="ruletaNegGirar">' +
      '<span class="ruleta-cta-ico">🎰</span>' +
      '<span class="ruleta-cta-txt"><b>GIRAR</b><span>Hoy: ' + (est.tareas || 0) + ' ⭐' +
        (racha > 1 ? ' · 🔥 racha ' + racha + ' días' : '') + '</span></span>' +
      '<span class="ruleta-cta-go">GIRAR</span>' +
    '</button>';
  var btn = cardN.querySelector('#ruletaNegGirar');
  if (btn) btn.onclick = function(){ abrir(); };
}

function observar(){
  try{
    var orig = window.showView;
    if (orig && !orig.__ruletaEnv){
      var env = function(id, opts){
        var r = orig.apply(this, arguments);
        try{ if (id === 'view-negocio') setTimeout(pintarTarjeta, 60); }catch(e){}
        return r;
      };
      env.__ruletaEnv = true;
      window.showView = env;
    }
  }catch(e){}
  setInterval(function(){
    try{
      var v = document.getElementById('view-negocio');
      if (v && v.style.display !== 'none' && v.offsetParent !== null) pintarTarjeta();
    }catch(e){}
  }, 1200);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observar);
else observar();

window.APPIRuleta = {
  abrir: abrir,
  cerrar: cerrar,
  girar: girar,
  armarSegmentos: armarSegmentos,
  estadoHoy: estadoHoy,
  rachaRuleta: rachaRuleta,
  setDoble: setDoble,
  contactos: contactos,
  irPara: irPara
};
})();
