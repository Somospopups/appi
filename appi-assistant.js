/* APPI v902 · Appi, asistente animada, voz y navegación segura. */
(function(){
  'use strict';
  const STATES=new Set(['normal','thinking','happy','surprise','alert']);
  const ASSETS={normal:'assets/appi/normal.webp',thinking:'assets/appi/thinking.webp',happy:'assets/appi/happy.webp',surprise:'assets/appi/surprise.webp',alert:'assets/appi/alert.webp'};
  let root=null,img=null,panelTitle=null,message=null,heard=null,status=null,micLabel=null,micHelp=null,actionBtn=null,input=null;
  let recognition=null,lastAnswer='',greetingTimer=0,thinkingTimer=0,activationTimer=0,currentAction=null,voiceFailed=false;
  function el(id){return document.getElementById(id)}
  function localDay(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
  function normalize(text){return String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es-AR').replace(/[¿?¡!.,;:]/g,' ').replace(/\s+/g,' ').trim()}
  function firstName(){try{const p=window.APPIAuth&&window.APPIAuth.currentProfile&&window.APPIAuth.currentProfile();return String(p&&p.nombre||'').trim().split(/\s+/)[0]||''}catch(e){return''}}
  function build(){
    if(root)return;
    root=document.createElement('aside');
    root.id='appiAssistant';root.dataset.state='normal';root.setAttribute('aria-label','Appi, asistente personal');
    root.innerHTML=`
      <div class="appi-avatar-shell" aria-hidden="true">
        <div class="appi-thoughts"><i></i><i></i><i></i></div>
        <div class="appi-sparkles"><i>✦</i><i>✦</i><i>✦</i></div>
        <div class="appi-surprise-ring"></div><div class="appi-alert-ring"></div>
        <div class="appi-listen-waves"><i></i><i></i><i></i></div>
        <img class="appi-avatar-image" id="appiAvatarImage" alt="">
      </div>
      <button type="button" class="appi-avatar-hit" id="appiAvatarHit" aria-label="Hablar con Appi" aria-expanded="false"></button>
      <div class="appi-mini-bubble" id="appiMiniBubble">¡Hola! Tocame y hablamos.</div>
      <section class="appi-panel" id="appiPanel" role="dialog" aria-modal="false" aria-label="Hablar con Appi">
        <div class="appi-panel-head"><div class="appi-panel-status"><i></i><span id="appiStatus">Lista para ayudarte</span></div><button type="button" class="appi-panel-close" id="appiClose" aria-label="Cerrar Appi">×</button></div>
        <h2 id="appiPanelTitle">¿En qué te ayudo?</h2>
        <p class="appi-message" id="appiMessage" aria-live="polite">Podés hablarme o escribir con tus propias palabras.</p>
        <div class="appi-heard" id="appiHeard"></div>
        <div class="appi-quick-title">Podés probar</div>
        <div class="appi-quick">
          <button type="button" class="appi-chip" data-appi-question="¿Qué tengo que hacer hoy?">¿Qué tengo hoy?</button>
          <button type="button" class="appi-chip" data-appi-question="Explicame esta pantalla">Explicame esta pantalla</button>
          <button type="button" class="appi-chip" data-appi-question="Abrí Mi Encuesta">Abrí Mi Encuesta</button>
          <button type="button" class="appi-chip" data-appi-question="Mostrame mis cierres anteriores">Mis cierres anteriores</button>
        </div>
        <button type="button" class="appi-action" id="appiAction"></button>
        <div class="appi-talk"><button type="button" class="appi-mic" id="appiMic" aria-label="Hablar con Appi"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="8" y="3" width="8" height="12" rx="4" stroke="currentColor" stroke-width="2"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button><div class="appi-talk-copy"><b id="appiMicLabel">Hablar con Appi</b><span id="appiMicHelp">El micrófono se activa sólo cuando lo tocás.</span></div></div>
        <form class="appi-write" id="appiForm"><input id="appiInput" autocomplete="off" placeholder="O escribí tu pregunta…" aria-label="Escribirle a Appi"><button type="submit" class="appi-send" aria-label="Enviar">›</button></form>
        <div class="appi-panel-foot"><span>Appi nunca queda escuchando sola.</span><button type="button" class="appi-speak" id="appiSpeak">🔊 Escuchar</button></div>
      </section>`;
    root.style.display='none';
    document.body.appendChild(root);
    img=el('appiAvatarImage');panelTitle=el('appiPanelTitle');message=el('appiMessage');heard=el('appiHeard');status=el('appiStatus');micLabel=el('appiMicLabel');micHelp=el('appiMicHelp');actionBtn=el('appiAction');input=el('appiInput');
    el('appiAvatarHit').addEventListener('click',()=>root.classList.contains('appi-open')?close():open());
    el('appiClose').addEventListener('click',close);
    el('appiMic').addEventListener('click',startVoice);
    el('appiForm').addEventListener('submit',event=>{event.preventDefault();const q=input.value.trim();if(!q)return;input.value='';ask(q)});
    el('appiSpeak').addEventListener('click',()=>speak(lastAnswer));
    document.querySelectorAll('[data-appi-question]').forEach(button=>button.addEventListener('click',()=>ask(button.dataset.appiQuestion)));
    actionBtn.addEventListener('click',()=>{const fn=currentAction;currentAction=null;setAction();if(typeof fn==='function'){try{fn();setTimeout(close,260)}catch(e){console.error(e);setState('alert');setCopy('No pude abrir esa sección','Probá nuevamente desde el dock.')}}});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&root.classList.contains('appi-open'))close()});
    document.addEventListener('click',event=>{if(!root.classList.contains('appi-open'))return;if(event.target.closest('#appiAssistant'))return;close()},true);
    document.querySelectorAll('#pageTabs button').forEach(button=>button.addEventListener('click',()=>{if(root.classList.contains('appi-open'))close()}));
    waitUntilAppReady();
  }
  function preload(){Object.values(ASSETS).forEach(src=>{const p=new Image();p.src=src})}
  function appIsReady(){
    const lock=el('lockScreen');
    return !el('bootScreen')&&!document.body.classList.contains('appi-login-abierto')&&(!lock||lock.classList.contains('hidden'));
  }
  function waitUntilAppReady(){
    clearTimeout(activationTimer);
    if(!root||root.dataset.ready==='true')return;
    if(!appIsReady()){activationTimer=setTimeout(waitUntilAppReady,250);return}
    root.dataset.ready='true';root.style.removeProperty('display');setState('normal');preload();greetOnce();
  }
  function greetOnce(){
    const key='appi_saludo_'+localDay();
    let seen=false;try{seen=localStorage.getItem(key)==='1'}catch(e){}
    if(seen)return;
    clearTimeout(greetingTimer);
    greetingTimer=setTimeout(()=>{
      if(!root||root.classList.contains('appi-open'))return;
      root.classList.add('appi-greeting');
      try{localStorage.setItem(key,'1')}catch(e){}
      setTimeout(()=>root&&root.classList.remove('appi-greeting'),4300);
    },1800);
  }
  function open(){
    if(!root)return;
    root.classList.remove('appi-greeting');root.classList.add('appi-open');el('appiAvatarHit').setAttribute('aria-expanded','true');
    if(!lastAnswer){const n=firstName();setState('normal');setCopy('¿En qué te ayudo?',(n?'Hola, '+n+'. ':'')+'Podés hablarme o escribir con tus propias palabras.');}
    setTimeout(()=>input&&input.focus({preventScroll:true}),330);
  }
  function close(){
    if(!root)return;
    if(recognition){try{recognition.abort()}catch(e){}}
    root.classList.remove('appi-open','appi-listening');el('appiAvatarHit').setAttribute('aria-expanded','false');setAction();setTimeout(()=>setState('normal'),360);
  }
  function setState(state){
    state=STATES.has(state)?state:'normal';
    root.dataset.state=state;img.src=ASSETS[state];
    const labels={normal:'Lista para ayudarte',thinking:'Pensando y buscando',happy:'¡Listo!',surprise:'Encontré algo interesante',alert:'Necesito tu atención'};
    status.textContent=labels[state];
    if(state!=='normal')root.classList.remove('appi-listening');
  }
  function setCopy(title,text){panelTitle.textContent=title;message.textContent=text;lastAnswer=text}
  function showHeard(text){heard.textContent='“'+String(text||'').trim()+'”';heard.classList.add('appi-show')}
  function hideHeard(){heard.classList.remove('appi-show');heard.textContent=''}
  function setAction(label,fn){currentAction=typeof fn==='function'?fn:null;actionBtn.textContent=label||'';actionBtn.classList.toggle('appi-show',!!label&&!!currentAction)}
  function respond(raw,options){
    options=options||{};
    const match=String(raw||'').match(/^\s*\[STATE:\s*\{\s*"viseme"\s*:\s*"(normal|thinking|happy|surprise|alert)"\s*\}\s*\]\s*/);
    const state=options.state||(match&&match[1])||'normal';
    const text=String(raw||'').replace(/^\s*\[STATE:\s*\{\s*"viseme"\s*:\s*"(?:normal|thinking|happy|surprise|alert)"\s*\}\s*\]\s*/,'').trim();
    setState(state);setCopy(options.title||({happy:'¡Listo!',surprise:'¡Mirá esto!',alert:'Revisemos esto',thinking:'Un momento…'}[state]||'Appi te responde'),text);setAction(options.actionLabel,options.action);
    return {state,text};
  }
  function call(name,fallback){return function(){if(typeof window[name]==='function')return window[name]();if(fallback&&typeof window.showView==='function')return window.showView(fallback)}}
  const routes=[
    {keys:/\b(encuesta|invitaciones?)\b/,label:'Mi Encuesta',go:call('openEncuestaTool','view-encuesta')},
    {keys:/\b(panel de contactos|mis contactos|contactos|seguimientos?)\b/,label:'Panel de Contactos',go:call('openMiGestion','view-gestion')},
    {keys:/\b(historico|cierres? anteriores?|archivo anual)\b/,label:'Histórico',go:call('openHistorico','view-historico')},
    {keys:/\b(lista de precios|precios?)\b/,label:'Lista de precios',go:call('openLista','view-lista')},
    {keys:/\b(mi stock|stock|productos en casa)\b/,label:'Mi stock',go:call('openStock','view-stock')},
    {keys:/\b(campus|capacitacion|cursos?)\b/,label:'Campus Appi',go:call('openCampusPSA','view-campus')},
    {keys:/\b(mi equipo|equipo|organizacion)\b/,label:'Mi Equipo',go:call('openEquipo','view-equipo')},
    {keys:/\b(mi margarita|margarita)\b/,label:'Mi Margarita',go:call('openMargarita','view-margarita')},
    {keys:/\b(las 7 p|7 p|siete p)\b/,label:'Las 7 P',go:call('openSiete','view-siete')},
    {keys:/\b(presupuesto|ingresos|gastos)\b/,label:'Presupuesto',go:call('openPresu','view-presu')},
    {keys:/\b(mi mes|tu mes)\b/,label:'Mi mes',go:call('openTuMes','view-tumes')},
    {keys:/\b(los 8 pasos|8 pasos|ocho pasos)\b/,label:'Los 8 Pasos',go:call('openOcho','view-ocho')},
    {keys:/\b(escalera de suenos|mis suenos|suenos)\b/,label:'Escalera de Sueños',go:call('openSuenos','view-suenos')},
    {keys:/\b(coach de demo|coach|demostracion)\b/,label:'Coach de Demo',go:call('openDemo','view-demo')},
    {keys:/\b(comparativas?|botellas?)\b/,label:'Comparativas',go:call('openBotella','view-botella')},
    {keys:/\b(canillas?|adaptadores?)\b/,label:'Canillas y adaptadores',go:call('openCanillas','view-canillas')},
    {keys:/\b(simulador|calculadora)\b/,label:'Simulador',go:call('openCalculadora','view-simulador')},
    {keys:/\b(grabadora|grabar audio)\b/,label:'Grabadora',go:call('openGrabadora','view-grabadora')},
    {keys:/\b(recordatorios?|avisos?)\b/,label:'Recordatorios',go:call('__none__','view-recordatorios')},
    {keys:/\b(notas?|keep)\b/,label:'Notas Keep',go:call('__none__','view-notas')},
    {keys:/\b(herramientas?)\b/,label:'Herramientas',go:call('__none__','view-herramientas')},
    {keys:/\b(mi negocio|negocio)\b/,label:'Mi negocio',go:call('__none__','view-negocio')},
    {keys:/\b(home|inicio|principal)\b/,label:'Home',go:call('__none__','view-home')}
  ];
  function todayAnswer(){
    let contacts=[];try{contacts=Array.isArray(window.APPIGestion&&window.APPIGestion.state&&window.APPIGestion.state.contacts)?window.APPIGestion.state.contacts:[]}catch(e){}
    const today=localDay(),closed=new Set(['convertido','no_interesado']);
    const pending=contacts.filter(c=>!closed.has(String(c&&c.estado||''))&&(c.proximo_contacto||c.metadata&&c.metadata.proximo_contacto||'')<=today&&(c.proximo_contacto||c.metadata&&c.metadata.proximo_contacto));
    if(pending.length===1)return{state:'normal',title:'Tu jornada de hoy',text:'Tenés 1 contacto que necesita seguimiento hoy.',actionLabel:'Ver contacto',action:call('openMiGestion','view-gestion')};
    if(pending.length>1)return{state:'surprise',title:'Tu jornada de hoy',text:'Tenés '+pending.length+' contactos que necesitan seguimiento hoy. Te los puedo mostrar ordenados.',actionLabel:'Ver contactos',action:call('openMiGestion','view-gestion')};
    return{state:'happy',title:'Tu jornada de hoy',text:'No veo seguimientos vencidos para hoy. Podés revisar el Panel de Contactos cuando quieras.',actionLabel:'Abrir Panel',action:call('openMiGestion','view-gestion')};
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
    const q=normalize(question),openCommand=/\b(abri|abrime|abrir|mostrame|mostrar|llevame|llevarme|anda|ir a|quiero ir)\b/.test(q);
    if(!q)return{state:'alert',title:'No escuché una pregunta',text:'Probá nuevamente o escribime abajo.'};
    if(/\b(hola|buen dia|buenas tardes|buenas noches)\b/.test(q))return{state:'normal',title:'¡Hola!',text:'Soy Appi. Estoy acá para ayudarte a encontrar, entender y usar las herramientas de APPI.'};
    if(/\b(quien sos|como te llamas|tu nombre)\b/.test(q))return{state:'happy',title:'Soy Appi',text:'Soy tu asistente personal dentro de APPI. Puedo escucharte, explicarte pantallas y llevarte a una herramienta.'};
    if(/\b(que tengo hoy|hacer hoy|para hoy|pendientes de hoy|mi jornada)\b/.test(q))return todayAnswer();
    if(/\b(explica|explicame|como funciona|que es esta pantalla|ayuda con esta pantalla)\b/.test(q))return{state:'normal',title:'Te explico esta pantalla',text:screenHelp()};
    const route=routes.find(r=>r.keys.test(q));
    if(route){
      const result={state:openCommand?'happy':'normal',title:openCommand?'Abriendo '+route.label:route.label,text:openCommand?'Listo, te llevo a '+route.label+'.':'Encontré '+route.label+'. Puedo abrirlo por vos.',actionLabel:'Abrir '+route.label,action:route.go};
      if(openCommand)result.auto=true;
      return result;
    }
    if(/\b(gracias|genial|perfecto|excelente)\b/.test(q))return{state:'happy',title:'¡Me alegra ayudarte!',text:'Cuando necesites algo, tocame desde el dock.'};
    return{state:'normal',title:'Te acompaño',text:'Entendí: “'+question.trim()+'”. Todavía no tengo una respuesta segura para esa consulta, pero puedo ayudarte a encontrar cualquier pantalla o función de APPI.'};
  }
  function ask(question){
    open();clearTimeout(thinkingTimer);showHeard(question);setAction();setState('thinking');setCopy('Un momento…','Estoy buscando la mejor respuesta dentro de APPI.');
    thinkingTimer=setTimeout(()=>{
      const result=interpret(question);respond('[STATE:{"viseme": "'+result.state+'"}] '+result.text,{title:result.title,actionLabel:result.actionLabel,action:result.action});
      if(result.auto&&typeof result.action==='function')setTimeout(()=>{try{result.action()}finally{close()}},780);
    },650);
  }
  function startVoice(){
    open();
    const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SpeechRecognition){setState('alert');setCopy('El micrófono no está disponible','Este navegador no permite reconocimiento de voz. Podés escribirme la pregunta abajo.');return}
    try{
      if(recognition)try{recognition.abort()}catch(e){}
      recognition=new SpeechRecognition();recognition.lang='es-AR';recognition.interimResults=true;recognition.continuous=false;voiceFailed=false;let finalText='';
      recognition.onstart=()=>{root.classList.add('appi-listening');setState('normal');status.textContent='Escuchando';panelTitle.textContent='Te escucho…';message.textContent='Hablame con tranquilidad.';heard.textContent='…';heard.classList.add('appi-show');micLabel.textContent='Estoy escuchando';micHelp.textContent='El micrófono se apagará cuando termines.'};
      recognition.onresult=event=>{let interim='';for(let i=event.resultIndex;i<event.results.length;i++){const text=event.results[i][0].transcript;if(event.results[i].isFinal)finalText+=text;else interim+=text}heard.textContent='“'+(finalText||interim||'…')+'”'};
      recognition.onerror=event=>{voiceFailed=true;root.classList.remove('appi-listening');setState('alert');const denied=event.error==='not-allowed'||event.error==='service-not-allowed';setCopy(denied?'Necesito permiso para escucharte':'No pude escuchar con claridad',denied?'Habilitá el micrófono cuando el navegador lo solicite. También podés escribirme abajo.':'Acercate un poco al teléfono o escribime la pregunta.');micLabel.textContent='Hablar con Appi';micHelp.textContent='El micrófono se activa sólo cuando lo tocás.'};
      recognition.onend=()=>{root.classList.remove('appi-listening');micLabel.textContent='Hablar con Appi';micHelp.textContent='El micrófono se activa sólo cuando lo tocás.';if(finalText&&!voiceFailed)ask(finalText);else if(!voiceFailed){setState('normal');setCopy('¿Probamos otra vez?','No llegué a escuchar una pregunta. También podés escribirla abajo.')}};
      recognition.start();
    }catch(error){root.classList.remove('appi-listening');setState('alert');setCopy('No pude abrir el micrófono','Podés escribir tu pregunta y Appi te ayudará de la misma manera.')}
  }
  function speak(text){
    if(!text||!('speechSynthesis'in window)){setState('alert');setCopy('No puedo leer la respuesta','Este dispositivo no tiene una voz disponible. La respuesta queda escrita en pantalla.');return}
    try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='es-AR';u.rate=.96;speechSynthesis.speak(u)}catch(e){}
  }
  function init(){
    build();
    window.APPIAssistant={open,close,setState,ask,respond,speak,get state(){return root&&root.dataset.state},get isOpen(){return !!(root&&root.classList.contains('appi-open'))}};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
