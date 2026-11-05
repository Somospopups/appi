/* APPI v908 · Appi, asistente animada con la gotita vectorial, voz y navegación segura. */
(function(){
  'use strict';
  const STATES=new Set(['normal','thinking','happy','surprise','alert']);
  let root=null,gotita=null,panelTitle=null,message=null,heard=null,status=null,actionBtn=null,input=null,rowsHost=null,rowsTitle=null,resultsHost=null,ultimaVista='',buscarTimer=0,hitsActuales=[];
  let recognition=null,speaking=false,lastAnswer='',greetingTimer=0,thinkingTimer=0,activationTimer=0,currentAction=null,voiceFailed=false;
  function el(id){return document.getElementById(id)}
  // La fecha del día se toma de Buenos Aires: es la misma que usa el resto de APPI.
  function localDay(){
    try{const iso=String(window.appiFechaBA&&window.appiFechaBA()||'');if(/^\d{4}-\d{2}-\d{2}$/.test(iso))return iso}catch(e){}
    const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')
  }
  function normalize(text){return String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es-AR').replace(/[¿?¡!.,;:]/g,' ').replace(/\s+/g,' ').trim()}
  function firstName(){try{const p=window.APPIAuth&&window.APPIAuth.currentProfile&&window.APPIAuth.currentProfile();return String(p&&p.nombre||'').trim().split(/\s+/)[0]||''}catch(e){return''}}
  // --- Appi vive en el círculo del «?» ---------------------------------
  // Todos los botones de ayuda de la app son ahora el círculo de Appi: un
  // botón redondo, crema y celeste, con su carita animada. Un toque abre la
  // caja y adentro está el buscador, los accesos y la ayuda de la pantalla.
  const CARA_BTN='<svg class="appi-btn-face" viewBox="0 0 24 24" aria-hidden="true" focusable="false">'
    +'<path class="bf-body" d="M12 2.1c3.7 4.1 6.5 7.4 6.5 11.1a6.5 6.5 0 1 1-13 0c0-3.7 2.8-7 6.5-11.1z" fill="#5ec1f2"/>'
    +'<g class="bf-eyes"><circle class="bf-eye" cx="9.8" cy="12.7" r="1.05" fill="#123c63"/>'
    +'<circle class="bf-eye" cx="14.2" cy="12.7" r="1.05" fill="#123c63"/></g>'
    +'<path class="bf-smile" d="M10 15.6c.55.65 1.2 1 2 1s1.45-.35 2-1" stroke="#123c63" stroke-width="1.3" stroke-linecap="round" fill="none"/></svg>';
  let ultimoHelp=null,greetTimer=0,idleTimer=0,waveTimer=0,saludosOn=true,ojosTimer=0;
  function dockState(){return root&&root.classList.contains('appi-open')?'afuera':'asomada'}

  // El «?» de todas las pantallas se viste de Appi: carita, anillo celeste y
  // latido. Se puede llamar las veces que haga falta (las pantallas se
  // dibujan de nuevo al navegar).
  function vestirBotonesDeAyuda(){
    document.querySelectorAll('.help-btn,.hs-help').forEach(function(b){
      if(b.dataset.appiBtn==='1')return;
      b.dataset.appiBtn='1';
      b.classList.add('appi-help-btn');
      b.setAttribute('aria-label','Appi, tu asistente');
      b.setAttribute('title','Appi');
      b.innerHTML=CARA_BTN;
    });
  }
  // Un toque en cualquiera de esos botones abre la caja de Appi. La ayuda
  // propia de la pantalla queda adentro, en una fila.
  function vigilarBotonesDeAyuda(){
    document.addEventListener('click',function(ev){
      const b=ev.target&&ev.target.closest?ev.target.closest('.help-btn,.hs-help'):null;
      if(!b||window.__appiHelpPassthrough)return;
      ev.preventDefault();ev.stopPropagation();
      ultimoHelp=b;
      if(root&&root.classList.contains('appi-open'))close();else open();
    },true);
    if(window.MutationObserver){
      const mo=new MutationObserver(function(){vestirBotonesDeAyuda()});
      mo.observe(document.body,{childList:true,subtree:true});
    }
  }
  // Abre la ayuda que tenía ese botón, sin que la intercepte Appi.
  function ayudaDeLaPantalla(){
    const b=ultimoHelp;
    close();
    if(!b)return;
    window.__appiHelpPassthrough=true;
    setTimeout(function(){
      try{b.click()}catch(e){console.error(e)}
      finally{setTimeout(function(){window.__appiHelpPassthrough=false},60)}
    },120);
  }
  // "¿Qué hay en mi pantalla?": cierra la caja y arranca el recorrido guiado.
  function empezarRecorrido(){
    close();
    setTimeout(function(){
      if(!window.APPITour){setState('alert');setCopy('No pude empezar el recorrido','Probá de nuevo en un segundo.');return}
      const r=window.APPITour.empezar();
      if(!r||!r.pasos){
        open();setState('normal');setCopy('Esta pantalla todavía no tiene recorrido','Probá en Home, Mi mes, Mi negocio, Herramientas, Lista de precios o Mi stock.');
        return;
      }
      setCopy('Recorrido de la pantalla','Te muestro cada parte, paso a paso.');
    },260);
  }
  function saludar(ms){
    if(!root||!saludosOn)return;
    if(document.hidden)return;
    const b=document.querySelector('.appi-help-btn');
    if(b){b.classList.remove('appi-help-hi');void b.offsetWidth;b.classList.add('appi-help-hi');
      clearTimeout(waveTimer);waveTimer=setTimeout(function(){b.classList.remove('appi-help-hi')},3400)}
    if(root.classList.contains('appi-open'))return;
    root.classList.add('appi-greeting');
    const go=gotita&&gotita.querySelector('svg.go');
    if(go){go.classList.remove('is-blinking');void go.offsetWidth;go.classList.add('go-wave-l')}
    clearTimeout(greetTimer);
    greetTimer=setTimeout(function(){
      if(!root)return;
      root.classList.remove('appi-greeting');
      const g=gotita&&gotita.querySelector('svg.go');if(g)g.classList.remove('go-wave-l');
    },ms||3400);
  }
  function saludos(on){
    saludosOn=on!==false;
    if(!saludosOn&&root){root.classList.remove('appi-greeting');
      const g=gotita&&gotita.querySelector('svg.go');if(g)g.classList.remove('go-wave-l')}
    return saludosOn;
  }
  function setDock(state){
    // Compatibilidad: "afuera" abre la caja, "asomada" la cierra.
    if(state==='afuera')open();else close();
    return dockState();
  }
  function toggleFromDock(){
    if(!root)return;
    if(root.classList.contains('appi-open'))close();else open();
  }
  function initDock(){
    vestirBotonesDeAyuda();
    // Los ojos del círculo miran cada tanto hacia los costados: se mueve,
    // se nota que está viva y llama a tocarla.
    clearInterval(ojosTimer);
    ojosTimer=setInterval(function(){
      const b=document.querySelector('.appi-help-btn');
      if(!b||document.hidden)return;
      b.classList.remove('appi-help-look');void b.offsetWidth;b.classList.add('appi-help-look');
      setTimeout(function(){b.classList.remove('appi-help-look')},2200);
    },9000);
    clearInterval(idleTimer);
    idleTimer=setInterval(function(){
      if(!root||!saludosOn||document.hidden)return;
      if(root.classList.contains('appi-open'))return;
      if(!root.dataset.saludado){root.dataset.saludado='1';saludar()}
    },20000);
  }

  function build(){
    if(root)return;
    root=document.createElement('aside');
    root.id='appiAssistant';root.dataset.state='normal';root.dataset.dock='asomada';root.setAttribute('aria-label','Appi, asistente personal');
    root.innerHTML=`
      <section class="appi-panel" id="appiPanel" role="dialog" aria-modal="false" aria-label="Appi, tu asistente">
        <i class="appi-panel-tail" aria-hidden="true"></i>
        <div class="appi-panel-scroll">
          <div class="appi-top">
            <div class="appi-hero" aria-hidden="true">
              <div class="appi-gotita" id="appiGotita"></div>
            </div>
            <div class="appi-top-txt">
              <div class="appi-panel-head"><div class="appi-panel-status"><i></i><span id="appiStatus">Appi está lista para ayudarte</span></div><button type="button" class="appi-panel-close" id="appiClose" aria-label="Cerrar Appi">×</button></div>
              <h2 id="appiPanelTitle">¿Qué necesitás?</h2>
            </div>
          </div>
          <p class="appi-message" id="appiMessage" aria-live="polite"></p>
          <div class="appi-heard" id="appiHeard"></div>
          <form class="appi-search" id="appiForm">
            <svg class="appi-search-ico" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="6.6" stroke="currentColor" stroke-width="2.2"/><path d="M16 16l4.4 4.4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
            <input id="appiInput" autocomplete="off" placeholder="Nombre, DIP o serie…" aria-label="Buscar una pantalla o preguntarle a Appi">
            <button type="button" class="appi-search-mic" id="appiMic" aria-label="Hablar con Appi"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="9" y="3" width="6" height="10" rx="3" stroke="currentColor" stroke-width="2"/><path d="M6 11a6 6 0 0 0 12 0M12 17v3M9 20h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
            <button type="submit" class="appi-send" aria-label="Buscar">›</button>
          </form>
          <button type="button" class="appi-row appi-row-tour" id="appiTourRow">
            <span class="appi-row-ico c1 appi-row-ojo">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="3" stroke="currentColor" stroke-width="2"/><path d="M8.5 10.5a3.5 3.5 0 107 0 3.5 3.5 0 00-7 0z" stroke="currentColor" stroke-width="2"/><path d="M9 20.5h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            </span>
            <span class="appi-row-txt"><b>¿Qué hay en mi pantalla?</b><i>Te lo muestro y te lo explico</i></span>
            <span class="appi-row-chev" aria-hidden="true">›</span>
          </button>
          <div class="appi-rows-title" id="appiRowsTitle">Lo que más usás</div>
          <div class="appi-rows" id="appiRows"></div>
          <div class="appi-results" id="appiResults" hidden></div>
          <button type="button" class="appi-action" id="appiAction"></button>
          <div class="appi-panel-foot"><span>Appi escucha sólo cuando la tocás.</span><button type="button" class="appi-speak" id="appiSpeak"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 9.5h3.2L12 5.6v12.8L7.2 14.5H4z" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><path d="M15.4 8.6a4.6 4.6 0 0 1 0 6.8" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg><span id="appiSpeakLabel">Escuchar</span></button></div>
        </div>
      </section>`;
    root.style.display='none';
    document.body.appendChild(root);
    gotita=el('appiGotita');if(window.APPIGotita)window.APPIGotita.mount(gotita);panelTitle=el('appiPanelTitle');message=el('appiMessage');heard=el('appiHeard');status=el('appiStatus');actionBtn=el('appiAction');input=el('appiInput');rowsHost=el('appiRows');rowsTitle=el('appiRowsTitle');resultsHost=el('appiResults');
    el('appiClose').addEventListener('click',close);
    el('appiTourRow').addEventListener('click',empezarRecorrido);
    el('appiMic').addEventListener('click',startVoice);
    el('appiForm').addEventListener('submit',event=>{
      event.preventDefault();
      const q=input.value.trim();if(!q)return;
      const resultado=buscarAhora(q);
      if(resultado&&resultado.total&&hitsActuales.length){
        // Hay coincidencias: la primera es la que la persona estaba buscando.
        const primero=hitsActuales[0];
        input.value='';mostrarDestinos();close();
        setTimeout(()=>{try{window.APPIBuscar.ir(primero)}catch(e){console.error(e)}},60);
        return;
      }
      input.value='';mostrarDestinos();ask(q);
    });
    if(input)input.addEventListener('input',()=>{
      clearTimeout(buscarTimer);
      const q=input.value.trim();
      if(q.length<2){mostrarDestinos();return}
      buscarTimer=setTimeout(()=>buscarAhora(q),130);
    });
    el('appiSpeak').addEventListener('click',()=>speak(lastAnswer));
    document.querySelectorAll('[data-appi-question]').forEach(button=>button.addEventListener('click',()=>ask(button.dataset.appiQuestion)));
    actionBtn.addEventListener('click',()=>{const fn=currentAction;currentAction=null;setAction();if(typeof fn==='function'){try{fn();setTimeout(close,260)}catch(e){console.error(e);setState('alert');setCopy('No pude abrir esa sección','Probá nuevamente desde el dock.')}}});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&root.classList.contains('appi-open'))close()});
    document.addEventListener('click',event=>{if(!root.classList.contains('appi-open'))return;if(event.target.closest('#appiAssistant'))return;close()},true);
    document.querySelectorAll('#pageTabs button').forEach(button=>{button.addEventListener('click',()=>{if(root.classList.contains('appi-open'))close()})});
    pintarDestinos();
    waitUntilAppReady();
  }
  function appIsReady(){
    const lock=el('lockScreen');
    return !el('bootScreen')&&!document.body.classList.contains('appi-login-abierto')&&(!lock||lock.classList.contains('hidden'));
  }
  function waitUntilAppReady(){
    clearTimeout(activationTimer);
    if(!root||root.dataset.ready==='true')return;
    if(!appIsReady()){activationTimer=setTimeout(waitUntilAppReady,250);return}
    // Si alguien ya le habló mientras la app terminaba de cargar, no se pisa
    // la respuesta en curso: sólo se ordena el estado si está en reposo.
    root.dataset.ready='true';root.style.removeProperty('display');
    if(!root.classList.contains('appi-open'))setState('normal');
    initDock();
    greetOnce();
  }
  function greetOnce(){
    const key='appi_saludo_'+localDay();
    let seen=false;try{seen=localStorage.getItem(key)==='1'}catch(e){}
    if(seen)return;
    clearTimeout(greetingTimer);
    greetingTimer=setTimeout(function(){
      if(!root||!saludosOn||root.classList.contains('appi-open'))return;
      try{localStorage.setItem(key,'1')}catch(e){}
      saludar(4300);
    },1600);
  }
  function open(){
    if(!root)return;
    vestirBotonesDeAyuda();
    pintarDestinos();
    root.classList.remove('appi-greeting');root.classList.add('appi-open');
    if(!lastAnswer){setState('normal');setCopy('¿Qué necesitás?','');}
    if(input&&!input.value)mostrarDestinos();
    setTimeout(()=>input&&input.focus({preventScroll:true}),330);
  }
  function close(){
    if(!root)return;
    if(recognition){try{recognition.abort()}catch(e){}}
    if(window.APPIGotita)window.APPIGotita.setListening(gotita,false);
    stopSpeaking();
    clearTimeout(buscarTimer);
    if(input)input.value='';
    mostrarDestinos();
    root.classList.remove('appi-open','appi-listening');setAction();setTimeout(()=>setState('normal'),360);
    root.classList.remove('appi-greeting');
  }
  function setState(state){
    state=STATES.has(state)?state:'normal';
    root.dataset.state=state;if(window.APPIGotita)window.APPIGotita.setState(gotita,state);
    const labels={normal:'Appi está lista para ayudarte',thinking:'Pensando y buscando',happy:'¡Listo!',surprise:'Encontré algo interesante',alert:'Necesito tu atención'};
    status.textContent=labels[state];
    if(state!=='normal')root.classList.remove('appi-listening');
  }
  function setCopy(title,text){panelTitle.textContent=title;message.textContent=text;lastAnswer=text}
  function showHeard(text){heard.textContent='“'+String(text||'').trim()+'”';heard.classList.add('appi-show')}
  function hideHeard(){heard.classList.remove('appi-show');heard.textContent=''}
  function setAction(label,fn){currentAction=typeof fn==='function'?fn:null;actionBtn.textContent=label||'';actionBtn.classList.toggle('appi-show',!!label&&!!currentAction)}
  function respond(raw,options){
    options=options||{};
    const state=STATES.has(options.state)?options.state:'normal';
    const text=String(raw||'').trim();
    setState(state);setCopy(options.title||({happy:'¡Listo!',surprise:'¡Mirá esto!',alert:'Revisemos esto',thinking:'Un momento…'}[state]||'Appi te responde'),text);setAction(options.actionLabel,options.action);
    return {state,text};
  }
  function call(name,arg){return function(){if(typeof window[name]==='function')return arg===undefined?window[name]():window[name](arg)}}
  function view(id){return function(){if(typeof window.showView==='function')return window.showView(id)}}
  function rueda(kind){return function(){if(typeof window.openRueda==='function')return window.openRueda(kind)}}

  // Íconos propios (SVG): no dependen de emojis ni de la fuente del teléfono.
  const ICONOS={
    tag:'<path d="M20.6 12.6l-8 8a2 2 0 0 1-2.8 0l-6.4-6.4V3.4h10.8l6.4 6.4a2 2 0 0 1 0 2.8z"/><circle cx="7.6" cy="7.6" r="1.5"/>',
    users:'<circle cx="9" cy="8" r="3.2"/><path d="M3.4 20c0-3.1 2.5-5.2 5.6-5.2s5.6 2.1 5.6 5.2"/><path d="M16 5.4a3.2 3.2 0 0 1 0 6.2M17.4 14.8c2 .5 3.4 2.2 3.4 4.4"/>',
    chart:'<path d="M4 20V4M4 20h16"/><rect x="7" y="12" width="3.4" height="5"/><rect x="12.2" y="8.5" width="3.4" height="8.5"/><rect x="17.4" y="10.5" width="3.4" height="6.5"/>',
    target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.6"/>',
    box:'<path d="M12 3 4 7.2v9.6L12 21l8-4.2V7.2z"/><path d="M4 7.2 12 11.4l8-4.2M12 11.4V21"/>',
    team:'<circle cx="10" cy="9" r="3"/><path d="M4.5 19.5c0-2.8 2.4-4.6 5.5-4.6 1 0 1.9.2 2.7.6"/><path d="M17 13.5v5M14.6 16h4.8"/>',
    money:'<circle cx="12" cy="12" r="8"/><path d="M12 8v8M14.2 9.6c-.5-.7-1.3-1-2.2-1-1.4 0-2.3.7-2.3 1.8 0 2.4 4.6 1.2 4.6 3.6 0 1.1-1 1.9-2.4 1.9-1 0-1.9-.4-2.4-1.1"/>',
    cal:'<rect x="3.6" y="5" width="16.8" height="15" rx="2"/><path d="M3.6 10h16.8M8 3v4M16 3v4"/>',
    mic:'<rect x="9" y="3" width="6" height="10" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v3M9 20h6"/>',
    star:'<path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8L3.6 9.7l5.8-.8z"/>',
    play:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10.5 9.2 4.5 2.8-4.5 2.8z"/>',
    bottle:'<path d="M10 3h4v3.2l1.6 2.2a5 5 0 0 1 .9 2.9v6.7a3 3 0 0 1-3 3h-3a3 3 0 0 1-3-3v-6.7a5 5 0 0 1 .9-2.9L10 6.2z"/><path d="M8 13h8"/>'
  };
  function icono(name){
    const d=ICONOS[name]||ICONOS.star;
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+d+'</svg>';
  }

  // Cada lugar de APPI con las palabras que usa la gente de verdad para nombrarlo.
  // `quick` marca los que pueden aparecer en la lista de «lo que más usás».
  const routes=[
    {label:'Historial de presupuesto',keys:/\b(historial de presupuesto|presupuestos anteriores|mis presupuestos)\b/,go:view('view-presu-hist'),view:'view-presu-hist'},
    {label:'Mi Encuesta',keys:/\b(encuesta|invitaciones?|referidos?)\b/,go:call('openEncuestaTool'),view:'view-encuesta',quick:1,icon:'target',sub:'Invitá y sumá contactos',tone:'c4'},
    {label:'Panel de Contactos',short:'Mis contactos',keys:/\b(panel de contactos|mis contactos|contactos|seguimientos?|clientes|prospectos?|agenda)\b/,go:call('openMiGestion'),view:'view-gestion',quick:1,icon:'users',sub:'A quién contactar hoy',tone:'c2'},
    {label:'Histórico',keys:/\b(historico|cierres?( de mes)?|cierres anteriores|archivo|ranking|pb)\b/,go:call('openHistorico'),view:'view-historico',quick:1,icon:'chart',sub:'Tus cierres anteriores',tone:'c3'},
    {label:'Lista de precios',keys:/\b(lista de precios|precios?|lista|catalogo|cuanto (sale|cuesta)|valores)\b/,go:call('openLista'),view:'view-lista',quick:1,icon:'tag',sub:'Precios y presupuestos',tone:'c1'},
    {label:'Mi stock',keys:/\b(mi stock|stock|productos?|mercaderia)\b/,go:call('openStock'),view:'view-stock',quick:1,icon:'box',sub:'Lo que tenés y prestaste',tone:'c4'},
    {label:'Campus PSA',keys:/\b(campus|capacitacion(es)?|cursos?|videos?)\b/,go:call('openCampusPSA'),view:'view-campus',quick:1,icon:'play',sub:'Cursos y videos',tone:'c3'},
    {label:'Mi Equipo',keys:/\b(mi equipo|equipo|mi gente|organizacion|red|descendencia)\b/,go:call('openEquipo'),view:'view-equipo',quick:1,icon:'team',sub:'Tu red y tu organización',tone:'c2'},
    {label:'Mis usuarios',keys:/\b(usuarios?|red de usuarios)\b/,go:view('view-usuarios'),view:'view-usuarios'},
    {label:'Mi Margarita',keys:/\b(mi margarita|margarita)\b/,go:call('openMargarita'),view:'view-margarita'},
    {label:'Las 7 P',keys:/\b(las 7 p|7 p|siete p)\b/,go:call('openSiete'),view:'view-siete'},
    {label:'Los 8 Pasos',keys:/\b(los 8 pasos|8 pasos|ocho pasos)\b/,go:call('openOcho'),view:'view-ocho'},
    {label:'Escalera de Sueños',keys:/\b(escalera de suenos|mis suenos|suenos|metas)\b/,go:call('openSuenos'),view:'view-suenos',quick:1,icon:'star',sub:'Tus metas',tone:'c1'},
    {label:'Presupuesto',keys:/\b(presupuesto|ingresos|gastos)\b/,go:call('openPresu'),view:'view-presu',quick:1,icon:'money',sub:'Ingresos y gastos',tone:'c2'},
    {label:'Mi mes',keys:/\b(mi mes|tu mes|el mes)\b/,go:call('openTuMes'),view:'view-tumes',quick:1,icon:'cal',sub:'Tu mes y tu planificación',tone:'c1'},
    {label:'Planificación',keys:/\b(planificacion|planning|plan semanal|planificar)\b/,go:view('view-planning'),view:'view-planning'},
    {label:'Reuniones',keys:/\b(reuniones?|juntadas?)\b/,go:call('openReuniones'),view:'view-reuniones'},
    {label:'Coach de Demo',keys:/\b(coach de demo|coach|demostracion|demo)\b/,go:call('openDemo'),view:'view-demo'},
    {label:'Comparativas',keys:/\b(comparativas?|botellas?)\b/,go:call('openBotella'),view:'view-botella',quick:1,icon:'bottle',sub:'Para mostrar la diferencia',tone:'c3'},
    {label:'Canillas y adaptadores',keys:/\b(canillas?|adaptadores?)\b/,go:call('openCanillas'),view:'view-canillas'},
    {label:'Simulador',keys:/\b(simulador|calculadora)\b/,go:call('openCalculadora'),view:'view-simulador'},
    {label:'Grabadora',keys:/\b(grabadora|grabar)\b/,go:call('openGrabadora'),view:'view-grabadora',quick:1,icon:'mic',sub:'Grabá y guardá audios',tone:'c4'},
    {label:'Notas',keys:/\b(notas?|keep)\b/,go:view('view-notas'),view:'view-notas'},
    {label:'Recordatorios',keys:/\b(recordatorios?|avisos?|alarmas?)\b/,go:view('view-recordatorios'),view:'view-recordatorios'},
    {label:'Rueda de la vida',keys:/\b(rueda de la vida|mi vida|rueda)\b/,go:rueda('vida'),view:'view-wheel'},
    {label:'Rueda del negocio',keys:/\b(rueda del negocio|rueda del trabajo)\b/,go:rueda('negocio'),view:'view-wheel'},
    {label:'Mi evaluación',keys:/\b(mi evaluacion|evaluacion)\b/,go:view('view-eval'),view:'view-eval'},
    {label:'Mi negocio',keys:/\b(mi negocio|negocio)\b/,go:view('view-negocio'),view:'view-negocio'},
    {label:'Herramientas',keys:/\b(herramientas?)\b/,go:view('view-herramientas'),view:'view-herramientas'},
    {label:'Inicio',keys:/\b(inicio|home|principal|pantalla principal|el comienzo)\b/,go:view('view-home'),view:'view-home'}
  ];
  // Si la persona todavía no usó nada, se ofrecen estos cuatro.
  const ORDEN_BASE=['Lista de precios','Panel de Contactos','Histórico','Mi Encuesta'];

  // --- «Lo que más usás» ----------------------------------------------
  // Se cuentan las visitas a cada pantalla mientras se usa APPI. Las cuatro
  // más visitadas son las que aparecen en el panel.
  const USOS_KEY='appi_usos_v1';
  function leerUsos(){try{const raw=localStorage.getItem(USOS_KEY);const o=raw?JSON.parse(raw):null;return o&&typeof o==='object'?o:{}}catch(e){return{}}}
  function sumarUso(label){
    if(!label)return;
    try{const o=leerUsos();o[label]=(Number(o[label])||0)+1;localStorage.setItem(USOS_KEY,JSON.stringify(o))}catch(e){}
  }
  const vistaLabel={};
  routes.forEach(r=>{if(r.view&&!vistaLabel[r.view])vistaLabel[r.view]=r.label});
  function notarUso(viewId){sumarUso(vistaLabel[viewId])}
  function topDestinos(n){
    const usos=leerUsos();
    const quick=routes.filter(r=>r.quick);
    const pos=r=>{const i=ORDEN_BASE.indexOf(r.label);return i<0?99:i};
    const orden=quick.map((r,i)=>({r,i,usos:Number(usos[r.label])||0}));
    orden.sort((a,b)=>b.usos-a.usos||pos(a.r)-pos(b.r)||a.i-b.i);
    return orden.slice(0,n).map(x=>x.r);
  }
  function pintarDestinos(){
    if(!rowsHost)return;
    const items=topDestinos(4);
    const usos=leerUsos();
    const hayUsos=items.some(r=>Number(usos[r.label])>0);
    if(rowsTitle)rowsTitle.textContent=hayUsos?'Lo que más usás':'Para empezar';
    if(rowsTitle)rowsTitle.hidden=!items.length;
    rowsHost.hidden=!items.length;
    rowsHost.innerHTML=items.map(r=>{
      const nombre=(r.short||r.label);
      return '<button type="button" class="appi-row" data-appi-ir="'+nombre+'">'
        +'<span class="appi-row-ico '+(r.tone||'c1')+'">'+icono(r.icon)+'</span>'
        +'<span class="appi-row-txt"><b>'+nombre+'</b>'+(r.sub?'<i>'+r.sub+'</i>':'')+'</span>'
        +'<span class="appi-row-chev" aria-hidden="true">›</span></button>';
    }).join('');
    rowsHost.querySelectorAll('[data-appi-ir]').forEach(button=>{
      button.addEventListener('click',()=>{
        const r=items.find(x=>(x.short||x.label)===button.dataset.appiIr);
        if(r)irA(r);
      });
    });
  }
  // Ir a una pantalla y cerrar el panel: sin confirmar nada.
  function irA(route){
    if(!route)return;
    close();
    try{return route.go()}catch(error){console.error('Appi no pudo abrir',error);return false}
  }
  function vigilarVistas(){
    const revisar=()=>{
      const activa=document.querySelector('.view.active');
      const id=activa&&activa.id;
      if(!id||id===ultimaVista)return;
      ultimaVista=id;notarUso(id);pintarDestinos();
    };
    revisar();
    try{
      const mo=new MutationObserver(revisar);
      document.querySelectorAll('.view').forEach(v=>mo.observe(v,{attributes:true,attributeFilter:['class']}));
      // Algunas pantallas (Lista de precios, por ejemplo) se crean recién
      // cuando se abren por primera vez: se vigila también el body.
      mo.observe(document.body,{attributes:true,attributeFilter:['class'],childList:true,subtree:false});
    }catch(e){}
  }

  function todayAnswer(){
    let contacts=[];try{contacts=Array.isArray(window.APPIGestion&&window.APPIGestion.state&&window.APPIGestion.state.contacts)?window.APPIGestion.state.contacts:[]}catch(e){}
    const today=localDay(),closed=new Set(['convertido','no_interesado']);
    const pending=contacts.filter(c=>!closed.has(String(c&&c.estado||''))&&(c.proximo_contacto||c.metadata&&c.metadata.proximo_contacto||'')<=today&&(c.proximo_contacto||c.metadata&&c.metadata.proximo_contacto));
    if(pending.length===1)return{state:'normal',title:'Tu jornada de hoy',text:'Tenés 1 contacto para contactar hoy.',actionLabel:'Ver mis contactos',action:call('openMiGestion','view-gestion')};
    if(pending.length>1)return{state:'surprise',title:'Tu jornada de hoy',text:'Tenés '+pending.length+' contactos para contactar hoy.',actionLabel:'Ver mis contactos',action:call('openMiGestion','view-gestion')};
    return{state:'happy',title:'Tu jornada de hoy',text:'Hoy no tenés contactos pendientes.',actionLabel:'Ver mis contactos',action:call('openMiGestion','view-gestion')};
  }
  function screenHelp(){
    const active=document.querySelector('.view.active');const id=active&&active.id||'view-home';
    const help={
      'view-home':'Este es tu inicio. Acá encontrás tu jornada, accesos principales y lo más importante del día.',
      'view-mes':'En Mi mes reunís planificación, presupuesto y herramientas para organizarte.',
      'view-negocio':'En Mi negocio consultás tu equipo, usuarios, histórico y contactos.',
      'view-herramientas':'En Herramientas encontrás recursos prácticos como precios, stock, encuesta, grabadora y simulador.',
      'view-gestion':'Este es el Panel de Contactos. Hoy prioriza a quién contactar; Todos permite buscar; Resultados muestra tu avance.',
      'view-encuesta':'En Mi Encuesta creás una invitación única, la compartís y las respuestas entran al Panel de Contactos.',
      'view-historico':'En Histórico comparás cierres actuales y anteriores, y abrís tus archivos anuales verificados.',
      'view-lista':'En Lista de precios consultás productos y armás presupuestos con los valores disponibles.'
    };
    return help[id]||'Esta pantalla forma parte de APPI. Decime qué querés hacer y te llevo a la herramienta correcta.';
  }
  function interpret(question){
    const q=normalize(question);
    if(!q)return{state:'alert',title:'No escuché una pregunta',text:'Probá nuevamente o escribime abajo.'};
    if(/\b(hola|buen dia|buenas tardes|buenas noches)\b/.test(q))return{state:'normal',title:'¡Hola!',text:'Soy Appi. Estoy acá para ayudarte a encontrar, entender y usar las herramientas de APPI.'};
    if(/\b(quien sos|como te llamas|tu nombre)\b/.test(q))return{state:'happy',title:'Soy Appi',text:'Soy tu asistente personal dentro de APPI. Puedo escucharte, explicarte pantallas y llevarte a una herramienta.'};
    if(/\b(que tengo hoy|hacer hoy|para hoy|pendientes de hoy|mi jornada)\b/.test(q))return todayAnswer();
    if(/\b(explica|explicame|como funciona|que es esta pantalla|ayuda con esta pantalla)\b/.test(q))return{state:'normal',title:'Te explico esta pantalla',text:screenHelp()};
    const route=routes.find(r=>r.keys.test(q));
    if(route)return{state:'happy',title:route.label,text:'Te llevo a '+route.label+'.',direct:route.go};
    if(/\b(gracias|genial|perfecto|excelente)\b/.test(q))return{state:'happy',title:'¡Me alegra ayudarte!',text:'Cuando necesites algo, tocame desde el dock.'};
    return{state:'normal',title:'No la encontré',text:'No encontré “'+String(question||'').trim()+'”. Decime el nombre de la pantalla: lista de precios, mis contactos, Mi Encuesta o histórico.'};
  }
  function ask(question){
    open();clearTimeout(thinkingTimer);showHeard(question);setAction();
    const result=interpret(question);
    // Pedido del usuario: si nombra un lugar, Appi la lleva ahí sin pedir confirmación.
    if(result.direct){
      setState('happy');setCopy(result.title,'Te llevo ahí.');
      const go=result.direct,label=result.title;
      thinkingTimer=setTimeout(()=>{
        close();
        let ok=false;
        try{ok=go()!==false}catch(error){console.error('Appi no pudo abrir',error);ok=false}
        if(ok){lastAnswer='';setTimeout(()=>setState('normal'),1600)}
        else{open();setState('alert');setCopy('No pude abrir '+label,'Probá desde el menú principal.')}
      },240);
      return;
    }
    setState('thinking');setCopy('Un momento…','Estoy buscando la mejor respuesta dentro de APPI.');
    thinkingTimer=setTimeout(()=>{
      respond(result.text,{state:result.state,title:result.title,actionLabel:result.actionLabel,action:result.action});
    },600);
  }
  // --- Buscador global ------------------------------------------------
  // Escribe "juan" y aparecen los usuarios Juan, los distribuidores Juan y
  // todo lo demás que coincida: series, contactos y pantallas.
  function pantallasParaBuscar(){
    return routes.map(function(r){
      return {titulo:(r.short||r.label),sub:'Ir a '+(r.label),claves:r.label+' '+(r.short||''),ir:r.go};
    });
  }
  function buscarAhora(q){
    if(!window.APPIBuscar){mostrarDestinos();return null}
    const resultado=window.APPIBuscar.buscar(q,{pantallas:pantallasParaBuscar()});
    pintarBusqueda(resultado);
    return resultado;
  }
  function mostrarDestinos(){
    hitsActuales=[];
    if(resultsHost){resultsHost.hidden=true;resultsHost.innerHTML=''}
    if(rowsHost)rowsHost.hidden=false;
    if(rowsTitle)rowsTitle.hidden=false;
    pintarDestinos();
  }
  function pintarBusqueda(resultado){
    if(!resultsHost||!rowsHost)return;
    hitsActuales=[];
    rowsHost.hidden=true;if(rowsTitle)rowsTitle.hidden=true;resultsHost.hidden=false;
    if(!resultado||!resultado.total){
      resultsHost.innerHTML='<div class="appi-empty">No encontré «'+escapar(resultado&&resultado.consulta||'')+'».'
        +'<span>Probá con un nombre, un DIP, un teléfono o un número de serie.</span></div>';
      return;
    }
    resultsHost.innerHTML=resultado.secciones.map(function(sec){
      const filas=sec.items.map(function(item){
        const i=hitsActuales.push(item)-1;
        return '<button type="button" class="appi-row" data-appi-hit="'+i+'">'
          +'<span class="appi-row-ico '+(sec.tono||'c1')+'">'+icono(sec.icono)+'</span>'
          +'<span class="appi-row-txt"><b>'+marcar(item.titulo,resultado.consulta)+'</b>'
          +(item.sub?'<i>'+marcar(item.sub,resultado.consulta)+'</i>':'')+'</span>'
          +'<span class="appi-row-chev" aria-hidden="true">›</span></button>';
      }).join('');
      const sobra=sec.total-sec.items.length;
      const verTodos=(sobra>0&&sec.verTodos)
        ?'<button type="button" class="appi-more" data-appi-vertodos="'+sec.id+'">'+escapar(sec.verTodos.texto)+' ›</button>'
        :'';
      return '<div class="appi-sec"><div class="appi-sec-title">'+escapar(sec.titulo)
        +'<b>'+sec.total+'</b></div><div class="appi-rows">'+filas+'</div>'+verTodos+'</div>';
    }).join('');
    resultsHost.querySelectorAll('[data-appi-hit]').forEach(function(button){
      button.addEventListener('click',function(){
        const item=hitsActuales[Number(button.dataset.appiHit)];
        if(!item)return;
        input.value='';mostrarDestinos();close();
        setTimeout(function(){try{window.APPIBuscar.ir(item)}catch(e){console.error(e)}},60);
      });
    });
    resultsHost.querySelectorAll('[data-appi-vertodos]').forEach(function(button){
      button.addEventListener('click',function(){
        const sec=resultado.secciones.filter(function(x){return x.id===button.dataset.appiVertodos})[0];
        input.value='';mostrarDestinos();close();
        setTimeout(function(){try{window.APPIBuscar.irATodos(sec)}catch(e){console.error(e)}},60);
      });
    });
  }
  function escapar(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
  // Resalta lo que la persona escribió, sin importar acentos ni mayúsculas.
  function marcar(texto,consulta){
    const original=String(texto==null?'':texto);
    const buscado=String(consulta==null?'':consulta);
    if(!buscado.trim())return escapar(original);
    let plano='',mapa=[];
    for(let i=0;i<original.length;i++){
      const c=original.charAt(i);
      const limpio=c.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
      if(/[a-z0-9]/.test(limpio)){plano+=limpio;mapa.push(i)}
      else if(/\s/.test(limpio)){plano+=' ';mapa.push(i)}
    }
    const tokens=buscado.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
      .replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(function(t){return t.length>=2});
    if(!tokens.length)return escapar(original);
    const rangos=[];
    tokens.forEach(function(t){
      let desde=0,idx;
      while((idx=plano.indexOf(t,desde))>=0){
        const ini=mapa[idx],fin=mapa[idx+t.length-1];
        if(ini!=null&&fin!=null)rangos.push([ini,fin+1]);
        desde=idx+t.length;
      }
    });
    if(!rangos.length)return escapar(original);
    rangos.sort(function(a,b){return a[0]-b[0]});
    const unidos=[];
    rangos.forEach(function(r){
      const ultimo=unidos[unidos.length-1];
      if(ultimo&&r[0]<=ultimo[1])ultimo[1]=Math.max(ultimo[1],r[1]);
      else unidos.push([r[0],r[1]]);
    });
    let salida='',pos=0;
    unidos.forEach(function(r){
      salida+=escapar(original.slice(pos,r[0]))+'<mark class="appi-mark">'+escapar(original.slice(r[0],r[1]))+'</mark>';
      pos=r[1];
    });
    return salida+escapar(original.slice(pos));
  }

  function startVoice(){
    open();
    const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SpeechRecognition){setState('alert');setCopy('El micrófono no está disponible','Este navegador no permite reconocimiento de voz. Podés escribirme la pregunta abajo.');return}
    try{
      if(recognition)try{recognition.abort()}catch(e){}
      recognition=new SpeechRecognition();recognition.lang='es-AR';recognition.interimResults=true;recognition.continuous=false;voiceFailed=false;let finalText='';
      recognition.onstart=()=>{root.classList.add('appi-listening');if(window.APPIGotita)window.APPIGotita.setListening(gotita,true);setState('normal');status.textContent='Escuchando';panelTitle.textContent='Te escucho…';message.textContent='Hablame con tranquilidad.';heard.textContent='…';heard.classList.add('appi-show')};
      recognition.onresult=event=>{let interim='';for(let i=event.resultIndex;i<event.results.length;i++){const text=event.results[i][0].transcript;if(event.results[i].isFinal)finalText+=text;else interim+=text}heard.textContent='“'+(finalText||interim||'…')+'”'};
      recognition.onerror=event=>{voiceFailed=true;root.classList.remove('appi-listening');if(window.APPIGotita)window.APPIGotita.setListening(gotita,false);setState('alert');const denied=event.error==='not-allowed'||event.error==='service-not-allowed';setCopy(denied?'Necesito permiso para escucharte':'No pude escuchar con claridad',denied?'Habilitá el micrófono cuando el navegador lo solicite. También podés escribirme abajo.':'Acercate un poco al teléfono o escribime la pregunta.')};
      recognition.onend=()=>{root.classList.remove('appi-listening');if(window.APPIGotita)window.APPIGotita.setListening(gotita,false);if(finalText&&!voiceFailed)ask(finalText);else if(!voiceFailed){setState('normal');setCopy('¿Probamos otra vez?','No llegué a escuchar una pregunta. También podés escribirla abajo.')}};
      recognition.start();
    }catch(error){root.classList.remove('appi-listening');setState('alert');setCopy('No pude abrir el micrófono','Podés escribir tu pregunta y Appi te ayudará de la misma manera.')}
  }
  function setSpeakLabel(reading){const b=el('appiSpeakLabel');if(b)b.textContent=reading?'Detener':'Escuchar';const btn=el('appiSpeak');if(btn)btn.classList.toggle('appi-speaking',!!reading)}
  function stopSpeaking(){
    speaking=false;setSpeakLabel(false);
    try{speechSynthesis.cancel()}catch(e){}
    if(window.APPIGotita)window.APPIGotita.setTalking(gotita,false);
  }
  function speak(text){
    if(!text||!('speechSynthesis'in window)){setState('alert');setCopy('No puedo leer la respuesta','Este dispositivo no tiene una voz disponible. La respuesta queda escrita en pantalla.');return}
    // Tocar de nuevo mientras lee la detiene: el botón dice qué va a pasar.
    if(speaking){stopSpeaking();return}
    try{
      speechSynthesis.cancel();
      const u=new SpeechSynthesisUtterance(text);u.lang='es-AR';u.rate=.96;
      // La boca de la gotita se mueve sólo mientras habla de verdad.
      const start=()=>{speaking=true;setSpeakLabel(true);if(window.APPIGotita)window.APPIGotita.setTalking(gotita,true)};
      const done=()=>{stopSpeaking()};
      u.onstart=start;u.onend=done;u.onerror=done;
      speechSynthesis.speak(u);
      if(speechSynthesis.speaking)start();
    }catch(e){stopSpeaking()}
  }
  function init(){
    build();
    vigilarVistas();
    vigilarBotonesDeAyuda();
    window.APPIToggle=toggleFromDock;
    window.APPIAssistant={open,close,setState,ask,respond,speak,stopSpeaking,setDock,saludar,saludos,toggleDock:toggleFromDock,get dock(){return dockState()},get state(){return root&&root.dataset.state},get isOpen(){return !!(root&&root.classList.contains('appi-open'))}};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
