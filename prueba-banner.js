/* ============================================================
   APPI · Franja de VERSIÓN DE PRUEBA
   ------------------------------------------------------------
   La cuenta en modo prueba ve una franja roja fija arriba, en
   todas las pantallas, sin botón de cerrar. Muestra los días que
   quedan y, en el último día, las horas. Se apaga sola cuando la
   cuenta deja de estar en prueba (pago o prórroga).

   Si la migración SUPABASE_PRUEBA.sql todavía no corrió, la
   consulta falla en silencio y la app sigue como siempre.
   ============================================================ */
(function(){
  'use strict';

  var TIMER = null;
  var VENCE = 0;

  function texto(vence){
    var ms = vence - Date.now();
    if (ms <= 0) return '🔴 VERSIÓN DE PRUEBA · Tu prueba terminó. Contactá a administración.';
    var horas = Math.ceil(ms / 3600000);
    if (horas <= 24) return '🔴 VERSIÓN DE PRUEBA · ' + (horas === 1 ? 'Te queda 1 hora' : 'Te quedan ' + horas + ' horas') + ' de uso';
    var dias = Math.ceil(ms / 86400000);
    return '🔴 VERSIÓN DE PRUEBA · Te quedan ' + dias + ' días de uso';
  }

  function pintar(vence){
    var b = document.getElementById('appiPruebaBar');
    if (!b){
      b = document.createElement('div');
      b.id = 'appiPruebaBar';
      b.setAttribute('role', 'status');
      document.body.appendChild(b);
      document.body.classList.add('appi-prueba');
      if (!document.getElementById('appiPruebaCss')){
        var st = document.createElement('style');
        st.id = 'appiPruebaCss';
        st.textContent =
          '#appiPruebaBar{position:fixed;top:0;left:0;right:0;z-index:10080;' +
          'background:linear-gradient(135deg,#e02424,#b91c1c);color:#fff;' +
          'font-weight:900;font-size:12.5px;line-height:1.35;text-align:center;' +
          'padding:9px 14px;letter-spacing:.3px;' +
          'padding-top:calc(9px + env(safe-area-inset-top, 0px));' +
          'box-shadow:0 3px 14px rgba(185,28,28,.35);pointer-events:none}' +
          /* La franja no tapa nada: la pantalla se achica exactamente su alto,
             medido en vivo (una o dos líneas, con o sin notch). */
          'body.appi-prueba{padding-top:var(--appi-prueba-alto, 38px)}' +
          'body.appi-prueba #deskSidebar{top:var(--appi-prueba-alto, 38px)}';
        document.head.appendChild(st);
      }
    }
    b.textContent = texto(vence);
    ajustarAltura();
  }

  function ajustarAltura(){
    var b = document.getElementById('appiPruebaBar');
    if (!b) return;
    var alto = Math.ceil(b.getBoundingClientRect().height);
    if (alto > 0) document.documentElement.style.setProperty('--appi-prueba-alto', alto + 'px');
  }
  window.addEventListener('resize', function(){ setTimeout(ajustarAltura, 120); });

  function apagar(){
    var b = document.getElementById('appiPruebaBar');
    if (b) b.remove();
    document.body.classList.remove('appi-prueba');
    document.documentElement.style.removeProperty('--appi-prueba-alto');
    window.__appiEsPrueba = false;
    clearInterval(TIMER);
    TIMER = null;
  }

  async function estado(){
    try{
      if (!(window.APPIAuth && window.APPIAuth.isEnabled && window.APPIAuth.isEnabled())) return null;
      var profile = window.APPIAuth.currentProfile && window.APPIAuth.currentProfile();
      if (!profile || profile.rol === 'admin' || !profile.user_id) return null;
      var c = window.APPIAuth.config ? window.APPIAuth.config() : null;
      var s = window.APPIAuth.load ? window.APPIAuth.load() : null;
      var token = s && s.session && s.session.access_token;
      if (!c || !c.url || !token) return null;
      var r = await fetch(String(c.url).replace(/\/$/, '') +
        '/rest/v1/appi_perfiles?select=membresia_prueba,membresia_vence&user_id=eq.' +
        encodeURIComponent(profile.user_id) + '&limit=1',
        { headers: { apikey: c.anonKey, Authorization: 'Bearer ' + token } });
      if (!r.ok) return null;                     // migración pendiente: sin franja
      var rows = await r.json();
      var row = Array.isArray(rows) ? rows[0] : null;
      if (!row || !row.membresia_prueba || !row.membresia_vence) return null;
      return { vence: new Date(row.membresia_vence).getTime() };
    }catch(e){ return null; }
  }

  async function arrancar(){
    var e = await estado();
    if (!e){ apagar(); return; }
    window.__appiEsPrueba = true;
    VENCE = e.vence;
    pintar(VENCE);
    clearInterval(TIMER);
    TIMER = setInterval(function(){ pintar(VENCE); }, 60000);
  }

  window.APPIPrueba = { arrancar: arrancar, texto: texto, pintar: pintar, apagar: apagar };

  function iniciar(){
    setTimeout(arrancar, 1600);
    // Si la sesión entra después de cargar (o la prueba se activa/levanta
    // mientras la app está abierta), la franja se acomoda sola.
    setInterval(arrancar, 120000);
  }
  if (document.readyState === 'complete') iniciar();
  else window.addEventListener('load', iniciar);
})();
