/* APPI · Recorrido guiado de la pantalla.
   "¿Qué hay en mi pantalla?": oscurece todo, ilumina una cosa por vez y la
   explica con palabras simples. Todo local: no hay red ni IA remota. */
(function(){
  'use strict';

  // ---------------------------------------------------------------- pasos
  // Cada paso: qué elemento iluminar (varias opciones, se usa la primera que
  // exista) y qué explicar. Si un elemento no está en pantalla, se saltea.
  const TOURS={
    'view-home':[
      {sel:['.home-hero-card'], titulo:'Tu nombre y el día',
       texto:'Arriba ves quién sos, qué día es y la fecha de Buenos Aires. Es el punto de partida de la jornada.'},
      {sel:['#homeMonthCard'], titulo:'Tu mes',
       texto:'La barra dice cuánto del mes ya recorriste. Tocá la tarjeta para abrir Tu mes con el detalle completo.'},
      {sel:['.hl-card','#homeLimpio .hl-card'], titulo:'Tu jornada',
       texto:'Es la línea de tiempo del día: lo que ya pasó, lo que toca ahora y lo que viene después.'},
      {sel:['.hl-ev'], titulo:'Cada momento del día',
       texto:'Cada línea es una cosa para hacer: el resumen de la mañana, alguien que espera tu mensaje o algo programado. Tocá una y vas derech@.'},
      {sel:['.home-tool-grid','#toolsList'], titulo:'Tus accesos',
       texto:'Las herramientas que más usás, para no tener que buscarlas en el menú.'},
      {sel:['#pageTabs'], titulo:'La barra de abajo',
       texto:'Cuatro lugares fijos: Home, Mi mes, Mi negocio y Herramientas. Arriba a la derecha está el círculo de Appi, que es donde estamos ahora.'}
    ],
    'view-mes':[
      {sel:['#scoreCompactWrap'], titulo:'Cómo venís este mes',
       texto:'Tu puntaje y lo que falta para llegar al objetivo. Se arma con lo que cargás durante el mes.'},
      {sel:['#nextStepWrap'], titulo:'El próximo paso',
       texto:'APPI te propone qué hacer ahora para no quedar cort@. Es una sugerencia: vos decidís.'},
      {sel:['#mesGrid'], titulo:'Las herramientas del mes',
       texto:'Las 7 P, el presupuesto y las dos ruedas: lo que vas cargando para que el mes avance. Cada tarjeta dice si está sin empezar, sin cargar o sin evaluar.'},
      {sel:['#scoreCompact .score-ring','#scoreCompact'], titulo:'El anillo del puntaje',
       texto:'El círculo muestra el mismo puntaje de arriba, de un vistazo. Cuando el mes está completo, se llena.'}
    ],
    'view-negocio':[
      {sel:['#bonosCard','#bonosBtn'], titulo:'Reporte de Bonos',
       texto:'Tocá acá para ver cuánto ganaste de bonos este mes y qué te falta para el próximo nivel.'},
      {sel:['#embudoKpi'], titulo:'Tu equipo de un vistazo',
       texto:'Tres números: cuántas personas tenés, cuántas están activas y cuántos puntos suman entre todas.'},
      {sel:['#negGrid'], titulo:'Los números del negocio',
       texto:'Tus cierres, el promedio y lo que venís creciendo. Cada tarjeta se toca para ver el detalle.'},
      {sel:['#pageTabs'], titulo:'Cómo moverte',
       texto:'Abajo están los cuatro lugares fijos. A la derecha, el círculo de Appi: ahí estamos ahora y podés volver cuando quieras.'}
    ],
    'view-herramientas':[
      {sel:['#herrGrid'], titulo:'Todas las herramientas', 
       texto:'Acá están todas: precios, stock, contactos, historial, encuestas y lo demás. Las que más usás aparecen primero.'},
      {sel:['#herrGrid a, #herrGrid button, #herrGrid .card'], titulo:'Cada herramienta',
       texto:'Un toque y se abre. No hace falta buscar en menús: todo lo que APPI sabe hacer está en esta grilla.'},
      {sel:['#pageTabs'], titulo:'La barra de abajo',
       texto:'Con estos cuatro botones volvés siempre a un lugar conocido: Home, Mi mes, Mi negocio y Herramientas.'}
    ],
    'view-lista':[
      {sel:['#lpSearch'], titulo:'Buscar un producto',
       texto:'Escribí el nombre, la recarga o el SKU y la lista se achica sola. También podés dictarlo con el micrófono.'},
      {sel:['.lp-chips'], titulo:'Filtros rápidos',
       texto:'Tocá una categoría para ver sólo esos productos. Tocar de nuevo la saca.'},
      {sel:['.lp-item'], titulo:'Cada producto',
       texto:'Muestra el precio del día y los planes. Se toca para ver el detalle, las cuotas o agregarlo a un presupuesto.'},
      {sel:['.lp-total-card'], titulo:'El total',
       texto:'Si agregaste productos, acá ves lo que suma todo junto antes de pasarlo a un presupuesto.'}
    ],
    'view-stock':[
      {sel:['.st-tabs'], titulo:'Stock, prestados y pendientes',
       texto:'Tres pestañas: lo que tenés en casa, lo que prestaste y lo que te tienen que devolver. Tocá una para cambiar.'},
      {sel:['#stockCont .st-card','#stockCont'], titulo:'Tu stock',
       texto:'Cada producto muestra cuántas unidades te quedan y qué se está por acabar. Tocá uno para sumar o restar.'},
      {sel:['#stFabGroup','.st-fab'], titulo:'Escanear y compartir',
       texto:'Con el botón de escanear apuntás a la etiqueta y APPI lo carga solo. El otro sirve para compartir tu stock.'}
    ],
    'view-usuarios':[
      {sel:['#usuariosUploadCard'], titulo:'Garantías y Usuarios',
       texto:'Acá se junta la lista de garantías: una persona, todos sus productos y las fechas de vencimiento.'},
      {sel:['#btnSyncPSAAuto'], titulo:'Conectar MI PSA',
       texto:'Un toque y los datos se actualizan solos desde tu cuenta de distribuidor. No hace falta cargar archivos a mano.'},
      {sel:['#usuariosSearch, .usuarios-search, #usuariosFileInput'], titulo:'Buscar una persona',
       texto:'Escribí un nombre, un teléfono o un número de serie y APPI te muestra quién es y qué compró.'},
      {sel:['#usuariosList, .usuario-card, #usuariosResults'], titulo:'Cada usuario',
       texto:'Se abre con un toque: sus datos, sus equipos y cuándo se le vence cada garantía.'}
    ],
    'view-gestion':[
      {sel:['.gestion-card','.gestion-contact'], titulo:'Tus contactos',
       texto:'Las personas que estás acompañando, con el estado de cada una: presentación, seguimiento o cerrada.'},
      {sel:['.gestion-contact'], titulo:'Cada contacto',
       texto:'Tocá uno para abrir su ficha: teléfono, notas, quién lo refirió y lo que hablaron.'}
    ],
    'view-historico':[
      {sel:['.hs-period'], titulo:'El período',
       texto:'Qué mes estás mirando. Con las flechas cambiás de mes o de año.'},
      {sel:['.hs-report-list'], titulo:'Tus informes',
       texto:'Cada botón abre un informe con los números de ese período. Los podés archivar para tenerlos siempre a mano.'}
    ]
  };

  // ---------------------------------------------------------------- estado
  let capa=null,nido=null,tarjetaEl=null,tituloEl=null,textoEl=null,pasoEl=null,
      lista=[],indice=0,activo=false,vistaActual='',oyenteScroll=null;

  function visible(el){
    if(!el)return false;
    const r=el.getBoundingClientRect();
    if(r.width<8||r.height<8)return false;
    const cs=getComputedStyle(el);
    return cs.display!=='none'&&cs.visibility!=='hidden'&&parseFloat(cs.opacity||'1')>0.05;
  }
  function primero(lista){
    for(let i=0;i<lista.length;i++){
      let el=null;
      try{el=document.querySelector(lista[i])}catch(e){}
      if(visible(el))return el;
    }
    return null;
  }
  function vistaDeAhora(){
    const v=document.querySelector('.view.active');
    return v&&v.id?v.id:'view-home';
  }
  function limpiar(t){return String(t||'').replace(/\s+/g,' ').trim()}
  // Si la pantalla no tiene recorrido escrito, se arma uno con lo que se ve:
  // cada tarjeta, bloque o título visible pasa a ser un paso.
  function limpiarTitulo(t){
    return limpiar(t)
      .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2190}-\u{21FF}]/gu,'')  // emojis y flechas
      .replace(/[·•|]+/g,' ')
      .replace(/\s+/g,' ')
      .trim();
  }
  // texto con espacios donde había etiquetas: "1sin movimiento2" → "1 sin movimiento 2"
  function textoSuave(el){
    let out='';
    (function andar(n){
      for(const c of n.childNodes){
        if(c.nodeType===3)out+=' '+c.nodeValue;
        else if(c.nodeType===1){
          const tag=c.tagName;
          if(tag==='SCRIPT'||tag==='STYLE'||tag==='SVG')continue;
          const bloque=/^(DIV|P|LI|H1|H2|H3|H4|SECTION|ARTICLE|BUTTON|SPAN|B|SMALL|STRONG|LABEL|TD|TH)$/.test(tag);
          if(bloque)out+=' ';
          andar(c);
          if(bloque)out+=' ';
        }
      }
    })(el);
    return out;
  }
  function rotulo(el){
    let t='';
    if(/^(H1|H2|H3|H4|B|STRONG|LABEL)$/.test(el.tagName))t=limpiarTitulo(el.textContent);
    if(!t){
      const h=el.querySelector('h1,h2,h3,h4');
      if(h)t=limpiarTitulo(h.textContent);
    }
    if(!t){
      const b=el.querySelector('b,strong,label');
      if(b)t=limpiarTitulo(b.textContent);
    }
    if(!t)t=limpiarTitulo(el.getAttribute('aria-label')||'');
    if(!t||t.length<9){
      const alt=limpiarTitulo(textoSuave(el));
      if(alt.length>t.length)t=alt;
    }
    if(t.length>46)t=t.slice(0,46).replace(/[\s,;:.]+\S*$/,'')+'…';
    return t.trim();
  }
  function esFija(el){
    for(let n=el;n&&n!==document.body;n=n.parentElement){
      const cs=getComputedStyle(n);
      if(cs.position==='fixed')return true;
      if(n.id==='appiTour')return true;
    }
    return false;
  }
  function pasosGenericos(vista){
    const cont=document.getElementById(vista)||document.querySelector('.view.active')||document.body;
    const todos=[...cont.querySelectorAll('[class*="card"],section,article,[class*="grid"],[class*="box"],h1,h2,h3,[class*="item"],[class*="row"]')];
    let nodos=todos.filter(visible).filter(el=>!esFija(el))
      .filter(el=>!el.closest('header.top,nav.tabs,.appi-assistant'))
      .filter(el=>limpiar(el.textContent).length>8)
      .filter((el,i,arr)=>arr.indexOf(el)===i);
    // los botones sueltos ("Reintentar") sólo se usan si no hay otra cosa
    const conCuerpo=nodos.filter(el=>/^(H1|H2|H3)$/.test(el.tagName)||el.querySelector('p,small,h2,h3,b,strong,img'));
    if(conCuerpo.length)nodos=conCuerpo;
    const elegidos=[];
    nodos.forEach(function(el){
      if(elegidos.length>=5)return;
      if(elegidos.some(e=>e.contains(el)||el.contains(e)))return;
      elegidos.push(el);
    });
    const pasos=elegidos.map(function(el){
      const titulo=rotulo(el)||'Esta parte';
      const p=el.querySelector('p,small');
      let texto=limpiarTitulo(p&&p.textContent);
      if(!texto){
        const bajo=titulo.toLowerCase();
        texto='Acá está '+bajo+'. Tocá lo que necesites de esta parte y APPI te lleva.';
      }
      return {el:el,titulo:titulo,texto:texto.slice(0,180)};
    });
    if(!pasos.length){
      // última red: al menos explicar la pantalla entera
      const h=cont.querySelector('h1,h2');
      const sub=cont.querySelector('header .script,header p');
      let titulo=limpiarTitulo(((h&&h.textContent)||'')+' '+((sub&&sub.textContent)||''));
      if(!titulo)titulo=limpiarTitulo(h&&h.textContent)||'Esta pantalla';
      if(titulo.length>46)titulo=titulo.slice(0,46).replace(/[\s,;:.]+\S*$/,'')+'…';
      pasos.push({el:cont,titulo:titulo,texto:'Esta es la pantalla donde estás. Arriba tenés el título y el botón para volver; abajo, la barra con los cuatro lugares fijos. Todo lo que ves trabaja con tus datos guardados en el teléfono, así que no necesitás internet.'});
    }
    return pasos;
  }
  // Si hay un aviso o ventana abierta encima de la pantalla, el recorrido
  // empieza por ahí: es lo primero que la persona tiene que entender.
  function avisoDeArriba(){
    let cands=[];
    try{
      cands=[...document.querySelectorAll('.modal-overlay.open,[id*="Overlay"],[class*="overlay"],[class*="modal"]')];
    }catch(e){return null}
    cands=cands.filter(visible)
      .filter(el=>!el.closest('#appiTour,.appi-assistant'))
      .filter(el=>{const cs=getComputedStyle(el);return cs.position==='fixed'||cs.position==='absolute'})
      .filter(el=>{const r=el.getBoundingClientRect();return r.width>window.innerWidth*.6&&r.height>window.innerHeight*.4});
    return cands.length?cands[cands.length-1]:null;
  }
  function pasosDeLaVista(vista){
    const escritos=TOURS[vista];
    if(escritos){
      const armados=[];
      escritos.forEach(function(p){
        const el=primero(p.sel||[]);
        if(el)armados.push({el:el,titulo:p.titulo,texto:p.texto});
      });
      // Si hay un aviso abierto encima, el recorrido es sobre el aviso: no se
      // puede explicar lo que está tapado. Cuando lo cierren, lo vuelven a abrir.
      const aviso=avisoDeArriba();
      if(aviso){
        const adentro=[...aviso.querySelectorAll('button')].filter(visible);
        const cerrar=adentro.length?adentro[adentro.length-1]:aviso;
        return [
          {el:aviso,titulo:'Este aviso',texto:'Antes de seguir: esto es un aviso que apareció encima de la pantalla. Leelo con calma; lo que está atrás queda esperando.'},
          {el:cerrar,titulo:'Para cerrarlo',texto:'Tocá acá para cerrar el aviso. Cuando se cierre, volvé a tocar Appi y elegí «¿Qué hay en mi pantalla?» para seguir con el resto.'}
        ];
      }
      if(armados.length){
        if(armados.length<3){
          pasosGenericos(vista).forEach(function(g){
            if(armados.length>=4)return;
            if(armados.some(function(a){return a.el===g.el||a.el.contains(g.el)||g.el.contains(a.el)}))return;
            armados.push(g);
          });
        }
        return armados;
      }
    }
    return pasosGenericos(vista);
  }

  // ---------------------------------------------------------------- pantalla
  function armar(){
    if(capa)return;
    capa=document.createElement('div');
    capa.id='appiTour';capa.className='appi-tour';capa.hidden=true;
    capa.innerHTML=''
      +'<div class="tour-nido" aria-hidden="true"><i class="tour-anillo"></i></div>'
      +'<section class="tour-card" role="dialog" aria-modal="false" aria-label="Recorrido de la pantalla">'
      +'  <div class="tour-head"><span class="tour-paso" id="tourPaso">1 de 1</span>'
      +'    <button type="button" class="tour-x" id="tourCerrar" aria-label="Terminar el recorrido">×</button></div>'
      +'  <h3 class="tour-titulo" id="tourTitulo"></h3>'
      +'  <p class="tour-texto" id="tourTexto"></p>'
      +'  <div class="tour-botones">'
      +'    <button type="button" class="tour-escuchar" id="tourEscuchar" aria-label="Escuchar la explicación">'
      +'      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 9.5h3.2L12 5.6v12.8L7.2 14.5H4z" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><path d="M15.4 8.6a4.6 4.6 0 0 1 0 6.8" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>'
      +'      <span>Escuchar</span></button>'
      +'    <button type="button" class="tour-prev" id="tourPrev" aria-label="Paso anterior">‹ Atrás</button>'
      +'    <button type="button" class="tour-next" id="tourNext">Siguiente ›</button>'
      +'  </div>'
      +'  <div class="tour-puntitos" id="tourPuntos" aria-hidden="true"></div>'
      +'</section>';
    document.body.appendChild(capa);
    nido=capa.querySelector('.tour-nido');
    tarjetaEl=capa.querySelector('.tour-card');
    tituloEl=capa.querySelector('#tourTitulo');
    textoEl=capa.querySelector('#tourTexto');
    pasoEl=capa.querySelector('#tourPaso');
    capa.querySelector('#tourCerrar').addEventListener('click',parar);
    capa.querySelector('#tourNext').addEventListener('click',siguiente);
    capa.querySelector('#tourPrev').addEventListener('click',anterior);
    capa.querySelector('#tourEscuchar').addEventListener('click',leerPaso);
    document.addEventListener('keydown',function(ev){
      if(!activo)return;
      if(ev.key==='Escape'){ev.preventDefault();parar()}
      else if(ev.key==='ArrowRight'){ev.preventDefault();siguiente()}
      else if(ev.key==='ArrowLeft'){ev.preventDefault();anterior()}
    });
  }
  function ubicar(){
    if(!activo)return;
    const paso=lista[indice];
    if(!paso||!paso.el)return;
    const r=paso.el.getBoundingClientRect();
    const pad=8;
    nido.style.left=(r.left-pad)+'px';
    nido.style.top=(r.top-pad)+'px';
    nido.style.width=Math.max(0,r.width+pad*2)+'px';
    nido.style.height=Math.max(0,r.height+pad*2)+'px';
    const ancho=Math.min(342,window.innerWidth-20);
    tarjetaEl.style.width=ancho+'px';
    const alto=tarjetaEl.offsetHeight||190;
    let arriba=r.bottom+pad+14;
    if(arriba+alto>window.innerHeight-10)arriba=Math.max(10,r.top-pad-14-alto);
    let izq=r.left+r.width/2-ancho/2;
    izq=Math.max(10,Math.min(izq,window.innerWidth-ancho-10));
    tarjetaEl.style.left=izq+'px';
    tarjetaEl.style.top=arriba+'px';
    // la flechita apunta al medio del elemento iluminado
    const punta=Math.max(18,Math.min(ancho-18,r.left+r.width/2-izq));
    tarjetaEl.classList.toggle('tour-abajo',arriba>r.top); // tarjeta debajo → colita arriba
    tarjetaEl.style.setProperty('--punta',punta+'px');
  }
  function pintar(){
    const paso=lista[indice];
    if(!paso)return;
    tituloEl.textContent=paso.titulo;
    textoEl.textContent=paso.texto;
    pasoEl.textContent=(indice+1)+' de '+lista.length;
    const puntos=capa.querySelector('#tourPuntos');
    puntos.innerHTML=lista.map(function(_,i){return '<i'+(i===indice?' class="on"':'')+'></i>'}).join('');
    capa.querySelector('#tourPrev').disabled=indice===0;
    capa.querySelector('#tourNext').textContent=indice===lista.length-1?'Terminar ✓':'Siguiente ›';
    if(!paso.el||!paso.el.getBoundingClientRect){ubicar();return}
    try{paso.el.scrollIntoView({block:'center',inline:'nearest',behavior:'smooth'})}catch(e){try{paso.el.scrollIntoView()}catch(_){}}
    ubicar();
    let veces=0;
    const tic=setInterval(function(){if(!activo||++veces>14){clearInterval(tic);return}ubicar()},60);
    setTimeout(function(){if(activo)ubicar()},420);
  }
  function siguiente(){
    if(!activo)return;
    if(indice>=lista.length-1){parar();return}
    indice++;pintar();
  }
  function anterior(){
    if(!activo||indice===0)return;
    indice--;pintar();
  }
  function leerPaso(){
    const paso=lista[indice];if(!paso)return;
    try{
      window.speechSynthesis.cancel();
      const u=new SpeechSynthesisUtterance(paso.titulo+'. '+paso.texto);
      u.lang='es-AR';u.rate=.96;
      window.speechSynthesis.speak(u);
    }catch(e){}
  }
  function empezar(pasoDesde){
    armar();
    const vista=vistaDeAhora();
    lista=pasosDeLaVista(vista);
    if(!lista.length){return {pasos:0,vista:vista}}
    // pantallas que se dibujan después: si quedó un solo paso y no hay uno escrito,
    // se vuelve a armar en medio segundo para tomar lo que apareció.
    if(lista.length<=1&&!TOURS[vista]){
      vistaActual=vista;
      setTimeout(function(){
        if(!activo||vistaActual!==vista)return;
        const otra=pasosDeLaVista(vista);
        if(otra.length>lista.length){lista=otra;indice=0;pintar()}
      },520);
    }
    vistaActual=vista;indice=pasoDesde||0;activo=true;
    capa.hidden=false;
    capa.classList.add('tour-on');
    document.documentElement.classList.add('appi-tour-abierto');
    pintar();
    if(!oyenteScroll){
      oyenteScroll=function(){if(activo)ubicar()};
      window.addEventListener('scroll',oyenteScroll,{passive:true});
      window.addEventListener('resize',oyenteScroll);
    }
    return {pasos:lista.length,vista:vista};
  }
  function parar(){
    if(!activo)return;
    activo=false;
    try{window.speechSynthesis.cancel()}catch(e){}
    if(capa){capa.classList.remove('tour-on');capa.hidden=true}
    document.documentElement.classList.remove('appi-tour-abierto');
    if(oyenteScroll){window.removeEventListener('scroll',oyenteScroll);window.removeEventListener('resize',oyenteScroll);oyenteScroll=null}
  }

  window.APPITour={
    empezar,parar,siguiente,anterior,
    get activo(){return activo},
    get paso(){return indice+1},
    get total(){return lista.length},
    get vista(){return vistaActual},
    get titulo(){return lista[indice]&&lista[indice].titulo||''},
    pasosDe:function(v){return pasosDeLaVista(v).map(function(p){return p.titulo})},
    // detalle interno (lo usan las pruebas para revisar qué se ilumina)
    detalle:function(v){return pasosDeLaVista(v||vistaDeAhora()).map(function(p){
      const el=p.el||null;
      return {titulo:p.titulo,texto:p.texto,
        el: el? (el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+(typeof el.className==='string'&&el.className?'.'+el.className.trim().split(/\s+/).slice(0,2).join('.'):'')) : null};
    })}
  };
})();
