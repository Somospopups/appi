/* ============================================================
   APPI · Coach Comercial para la Guía de Demostración
   ------------------------------------------------------------
   Cuatro momentos de conversación con ayuda contextual,
   preguntas, señales, comparativa y laboratorio de objeciones.
   No registra presentaciones ni datos de la persona.
   ============================================================ */
(function(){
  'use strict';

  var STORE = 'appi_demo_coach_v1';

  var FOCOS = [
    {
      key: 'sabor', icon: '💧', label: 'Sabor',
      coach: 'Quedate en la experiencia cotidiana: cuándo se nota, quién lo menciona y qué hacen hoy para resolverlo.',
      bridge: 'Entonces no estamos hablando sólo de tomar agua, sino de poder elegirla con más confianza todos los días.'
    },
    {
      key: 'olor', icon: '🌿', label: 'Olor',
      coach: 'Pedí un ejemplo concreto. Lo que la persona vive vale más que una explicación general.',
      bridge: 'Lo importante es entender en qué momentos aparece y cuánto condiciona el uso diario del agua.'
    },
    {
      key: 'sarro', icon: '✨', label: 'Sarro',
      coach: 'Explorá dónde lo observa y cuánto trabajo le genera. No prometas resultados que todavía no verificaste.',
      bridge: 'Además del agua que toman, acá aparece una molestia visible y repetida en la rutina del hogar.'
    },
    {
      key: 'gasto', icon: '🧾', label: 'Gasto',
      coach: 'Usá sus números reales: cantidad, precio y frecuencia. La comparativa convence cuando le pertenece.',
      bridge: 'Pongamos el hábito actual en números para ver el costo completo, no solamente una compra aislada.'
    },
    {
      key: 'habito', icon: '🔁', label: 'Hábito',
      coach: 'Descubrí cómo compran, trasladan, almacenan y recuerdan reponer. Ahí vive el valor de simplificar.',
      bridge: 'La oportunidad no está sólo en el agua: también está en hacer más simple una rutina que se repite.'
    },
    {
      key: 'duda', icon: '🧭', label: 'No lo tiene claro',
      coach: 'No apures una conclusión. Hacé una pregunta abierta y dejá que la persona encuentre qué cambiaría primero.',
      bridge: 'Antes de comparar alternativas, encontremos juntos qué aspecto tendría más valor mejorar.'
    }
  ];

  var PASOS_DEMO = [
    {
      t: 'Conciencia', icon: '01', eyebrow: 'DESCUBRIR ANTES DE MOSTRAR',
      d: 'Entendé qué vive la persona con el agua de todos los días.',
      script: '“Antes de mostrarte nada, quiero entender qué pasa hoy con el agua que usan todos los días.”',
      questions: [
        '¿Qué notás hoy en el agua: sabor, olor, sarro o algo más?',
        '¿Compran agua envasada? ¿Cuánto consumen aproximadamente por semana?',
        'Si pudieras cambiar una sola cosa del agua de tu casa, ¿cuál sería?',
        '¿Quién de la familia es el que más habla de este tema?',
        '¿Qué hacen actualmente cuando algo del agua no les convence?'
      ],
      signals: 'Escuchá repeticiones, ejemplos concretos, molestias de la rutina y frases como “siempre”, “cada semana” o “me gustaría”.',
      tip: 'Regla 70/30: escuchá el 70% y hablá el 30%. La necesidad debe quedar expresada con palabras de la persona.',
      avoid: 'No empieces con características ni supongas cuál es el problema.'
    },
    {
      t: 'Comparativa', icon: '02', eyebrow: 'HACER VISIBLE LA DIFERENCIA',
      d: 'Convertí el hábito actual en una comparación simple y propia.',
      script: '“Pongámoslo en números con lo que ustedes realmente consumen. Así comparamos decisiones, no promesas.”',
      questions: [
        '¿Cuántas botellas compran en una semana normal?',
        'Además del precio, ¿qué esfuerzo implica comprar, trasladar y almacenar?',
        '¿Qué valorás más al comparar: simplicidad, experiencia de uso, continuidad o inversión?',
        '¿Qué tendría que mejorar una alternativa para que valga la pena cambiar?',
        'Si este hábito siguiera igual durante un año, ¿qué impacto tendría?'
      ],
      signals: 'Cuando pregunta por plazos, inversión, mantenimiento o uso, ya está evaluando una alternativa concreta.',
      tip: 'Usá Comparativas con cifras que la persona te dio. Un número propio es más potente que diez datos genéricos.',
      avoid: 'No ataques otras opciones ni inventes ahorros: compará con transparencia.'
    },
    {
      t: 'Sistema, no producto', icon: '03', eyebrow: 'MOSTRAR EL RESULTADO COMPLETO',
      d: 'Conectá la solución con la rutina y el valor que la persona expresó.',
      script: '“La diferencia no está en un aparato aislado, sino en cómo el sistema acompaña el uso cotidiano que acabás de describir.”',
      questions: [
        '¿En qué situación concreta lo usarías primero?',
        '¿Qué parte de tu rutina te gustaría simplificar?',
        '¿Quién de la familia sentiría más esta diferencia?',
        '¿Qué necesitás conocer para sentir confianza en la implementación?',
        'De todo lo que vimos, ¿qué beneficio tiene más valor para vos?'
      ],
      signals: 'La persona se imagina usándolo, menciona un lugar, incluye a su familia o pregunta cómo sería el día a día.',
      tip: 'Traducí cada característica en una consecuencia útil para la necesidad que escuchaste.',
      avoid: 'No muestres todo por obligación. Profundizá solamente en lo que aporta valor a esta conversación.'
    },
    {
      t: 'Cierre y seguimiento', icon: '04', eyebrow: 'DAR CLARIDAD PARA DECIDIR',
      d: 'Descubrí qué falta y acordá un próximo paso concreto.',
      script: '“Quiero asegurarme de que esto tenga sentido para vos. ¿Qué te gustó y qué necesitarías aclarar antes de avanzar?”',
      questions: [
        '¿Qué fue lo que más valor tuvo para vos?',
        '¿Qué duda te gustaría resolver ahora?',
        '¿Quién más debería conocer la propuesta antes de decidir?',
        '¿Qué información te falta para evaluar con tranquilidad?',
        '¿Cuál sería un próximo paso cómodo y útil para vos?'
      ],
      signals: 'Preguntas por disponibilidad, condiciones, próximos pasos o participación de otra persona indican intención real.',
      tip: 'Cerrar no es presionar: es evitar que una duda importante quede escondida.',
      avoid: 'No respondas una objeción antes de entenderla y no prometas urgencias que no existen.'
    }
  ];

  var OBJECIONES = {
    precio: {
      icon: '💰', label: '“Me parece caro”', title: 'Volvé del precio al valor',
      answer: '“Es razonable mirarlo con cuidado. Para entenderte bien: ¿te preocupa el monto total o la relación con lo que reciben a cambio?”',
      follow: 'Después preguntá: “¿Con qué alternativa o gasto actual lo estás comparando?”'
    },
    pensar: {
      icon: '🤔', label: '“Lo tengo que pensar”', title: 'Descubrí qué necesita pensar',
      answer: '“Claro, es una decisión para evaluar. Para ayudarte sin presionarte: ¿qué aspecto necesitás pensar principalmente?”',
      follow: 'Ofrecé opciones: inversión, uso, tiempos, confianza o conversación con otra persona.'
    },
    otraPersona: {
      icon: '👥', label: '“Tengo que hablarlo”', title: 'Incluí a quien decide',
      answer: '“Tiene sentido. ¿Qué información necesitaría esa persona para poder evaluarlo bien?”',
      follow: 'Proponé una conversación breve con ambos o un resumen claro, sin dar la decisión por tomada.'
    },
    opciones: {
      icon: '⚖️', label: '“Estoy comparando”', title: 'Convertí la comparación en criterios',
      answer: '“Está muy bien comparar. ¿Cuáles son los tres criterios más importantes para elegir?”',
      follow: 'Revisá esos criterios con honestidad. La transparencia genera más confianza que desacreditar alternativas.'
    },
    momento: {
      icon: '🗓️', label: '“Ahora no es el momento”', title: 'Separá momento de interés',
      answer: '“Entiendo. ¿Es una cuestión de prioridad, presupuesto o calendario?”',
      follow: 'Si existe interés, acordá cuándo tendría sentido retomar la conversación.'
    },
    uso: {
      icon: '🔄', label: '“No sé cuánto lo usaría”', title: 'Llevá la duda a situaciones reales',
      answer: '“Es una buena pregunta. Pensemos en el último mes: ¿en qué situaciones concretas habría sido útil?”',
      follow: 'No exageres frecuencia. Si el uso esperado no justifica la decisión, decilo con honestidad.'
    }
  };

  var READINESS = {
    1: { label: 'Recién empieza', text: 'Volvé a escuchar. Preguntá: “¿Qué parte sentís que todavía no conecta con lo que necesitás?”' },
    2: { label: 'Hay distancia', text: 'Buscá la necesidad real: “¿Qué tendría que ser diferente para que esto tenga valor para vos?”' },
    3: { label: 'Necesita claridad', text: 'Identificá el dato faltante: “¿Qué información te permitiría evaluarlo mejor?”' },
    4: { label: 'Está cerca', text: 'No sigas explicando todo. Preguntá: “¿Qué única duda tendríamos que resolver?”' },
    5: { label: 'Listo para avanzar', text: 'Acordá sin presionar: “¿Cuál sería el próximo paso más cómodo para vos?”' }
  };

  var state = loadState();

  function defaultState(){
    return { done: [false, false, false, false], active: 0, focus: '', questions: [0, 0, 0, 0], readiness: 0, sos: false };
  }

  function loadState(){
    var base = defaultState();
    try {
      var saved = JSON.parse(sessionStorage.getItem(STORE) || 'null');
      if (!saved || !Array.isArray(saved.done) || saved.done.length !== 4) return base;
      base.done = saved.done.map(Boolean);
      base.active = Math.max(0, Math.min(3, Number(saved.active) || 0));
      base.focus = FOCOS.some(function(f){ return f.key === saved.focus; }) ? saved.focus : '';
      if (Array.isArray(saved.questions) && saved.questions.length === 4) {
        base.questions = saved.questions.map(function(n, i){ return Math.max(0, Math.min(PASOS_DEMO[i].questions.length - 1, Number(n) || 0)); });
      }
      base.readiness = READINESS[saved.readiness] ? Number(saved.readiness) : 0;
      return base;
    } catch (error) { return base; }
  }

  function saveState(){
    try {
      sessionStorage.setItem(STORE, JSON.stringify({
        done: state.done,
        active: state.active,
        focus: state.focus,
        questions: state.questions,
        readiness: state.readiness
      }));
    } catch (error) {}
  }

  function esc(value){
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function focusData(){
    for (var i = 0; i < FOCOS.length; i++) if (FOCOS[i].key === state.focus) return FOCOS[i];
    return null;
  }

  function doneCount(){
    return state.done.filter(Boolean).length;
  }

  function estilos(){
    if (document.getElementById('demoStyle')) return;
    var s = document.createElement('style');
    s.id = 'demoStyle';
    s.textContent = [
      '#view-demo{--demo-ink:#242435;--demo-muted:#6d6f82;--demo-line:rgba(77,88,132,.11);--demo-purple:#6f56d9;--demo-blue:#4f82e8;--demo-pink:#ec5d98;--demo-green:#168765}',
      '#view-demo .top{margin-bottom:14px}',
      '.demo-wrap{max-width:1020px;margin:0 auto;padding:2px 0 28px}',
      '.demo-hero{position:relative;overflow:hidden;padding:20px;border-radius:25px;color:#fff;background:linear-gradient(135deg,#315fc6 0%,#7358d6 56%,#d44f91 115%);box-shadow:0 18px 40px rgba(70,72,170,.24)}',
      '.demo-hero:before,.demo-hero:after{content:"";position:absolute;border-radius:50%;pointer-events:none}.demo-hero:before{width:210px;height:210px;right:-100px;top:-125px;background:rgba(255,255,255,.12)}.demo-hero:after{width:145px;height:145px;left:-80px;bottom:-105px;background:rgba(255,255,255,.08)}',
      '.demo-hero>*{position:relative;z-index:1}.demo-live{display:flex;align-items:center;gap:7px;margin-bottom:9px;font-size:9px;font-weight:950;letter-spacing:1.15px}.demo-live i{width:8px;height:8px;border-radius:50%;background:#70f3c3;box-shadow:0 0 0 5px rgba(112,243,195,.14);animation:demo-live 1.8s ease-in-out infinite}',
      '.demo-hero h2{max-width:650px;margin:0;font-size:24px;line-height:1.08;letter-spacing:-.55px}.demo-hero>p{max-width:670px;margin:8px 0 16px;color:rgba(255,255,255,.84);font-size:12px;font-weight:650;line-height:1.5}',
      '.demo-progress-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:7px}.demo-progress-head span{font-size:10px;font-weight:850}.demo-reset{border:1px solid rgba(255,255,255,.22);border-radius:999px;padding:6px 9px;background:rgba(255,255,255,.1);color:#fff;font:inherit;font-size:9px;font-weight:900;cursor:pointer}.demo-reset:active{transform:scale(.97)}',
      '.demo-progress{height:7px;border-radius:99px;background:rgba(255,255,255,.18);overflow:hidden}.demo-progress>i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#79f2c5,#fff);box-shadow:0 0 16px rgba(255,255,255,.5);transition:width .45s ease}',
      '.demo-promise{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:11px}.demo-promise div{padding:8px 9px;border:1px solid rgba(255,255,255,.14);border-radius:12px;background:rgba(255,255,255,.08);font-size:9px;font-weight:800;line-height:1.25}.demo-promise b{display:block;margin-bottom:2px;font-size:11px}',
      '.demo-layout{display:grid;grid-template-columns:1fr;gap:12px;margin-top:12px}.demo-rail{display:grid;gap:10px}.demo-panel{padding:14px;border:1px solid rgba(255,255,255,.82);border-radius:20px;background:rgba(255,255,255,.62);box-shadow:0 8px 24px rgba(65,74,120,.07);backdrop-filter:blur(16px)}',
      '.demo-panel-kicker{display:block;margin-bottom:4px;color:var(--demo-purple);font-size:8.5px;font-weight:950;letter-spacing:.9px}.demo-panel h3{margin:0;color:var(--demo-ink);font-size:14px}.demo-panel>p{margin:4px 0 10px;color:var(--demo-muted);font-size:10px;font-weight:650;line-height:1.4}',
      '.demo-focuses{display:flex;flex-wrap:wrap;gap:6px}.demo-focus{min-height:34px;padding:7px 9px;border:1px solid rgba(82,94,140,.1);border-radius:11px;background:rgba(255,255,255,.68);color:#57596a;font:inherit;font-size:9.5px;font-weight:850;cursor:pointer}.demo-focus[aria-pressed="true"]{border-color:rgba(111,86,217,.34);background:linear-gradient(135deg,rgba(79,130,232,.16),rgba(236,93,152,.13));color:#5b45bb;box-shadow:0 5px 13px rgba(100,80,190,.1)}',
      '.demo-coach-now{position:relative;margin-top:10px;padding:12px 12px 12px 39px;border-radius:15px;background:linear-gradient(135deg,rgba(79,130,232,.1),rgba(111,86,217,.09));color:#4e5062;font-size:10.5px;font-weight:700;line-height:1.45}.demo-coach-now:before{content:"✦";position:absolute;left:12px;top:12px;width:19px;height:19px;display:grid;place-items:center;border-radius:7px;background:linear-gradient(135deg,#4f82e8,#8a5ddd);color:#fff;font-size:10px}.demo-coach-now b{display:block;margin-bottom:2px;color:#4c3dae;font-size:8px;letter-spacing:.65px}',
      '.demo-quick-tools{display:grid;grid-template-columns:1fr 1fr;gap:7px}.demo-tool{min-height:48px;padding:9px;border:0;border-radius:14px;background:linear-gradient(135deg,#4f82e8,#7557d4);color:#fff;font:inherit;font-size:9.5px;font-weight:900;line-height:1.25;box-shadow:0 7px 17px rgba(78,91,195,.2);cursor:pointer}.demo-tool.secondary{border:1px solid rgba(111,86,217,.17);background:rgba(111,86,217,.09);color:#5b45bb;box-shadow:none}.demo-tool:active{transform:scale(.98)}',
      '.demo-sos{margin-top:8px;padding:11px;border-left:4px solid #ec5d98;border-radius:13px;background:rgba(236,93,152,.08);animation:demo-pop .25s ease}.demo-sos span{display:block;color:#c33e77;font-size:8px;font-weight:950;letter-spacing:.7px}.demo-sos strong{display:block;margin-top:4px;color:var(--demo-ink);font-size:11px;line-height:1.4}',
      '.demo-privacy{display:flex;align-items:flex-start;gap:7px;padding:0 4px;color:#7b7c8c;font-size:8.5px;font-weight:700;line-height:1.35}.demo-privacy span{color:#168765}',
      '.demo-steps{display:grid;gap:9px;align-content:start}.demo-paso{overflow:hidden;border:1px solid rgba(255,255,255,.86);border-radius:20px;background:rgba(255,255,255,.64);box-shadow:0 8px 24px rgba(65,74,120,.07);transition:border-color .2s ease,box-shadow .2s ease,transform .2s ease}.demo-paso.active{border-color:rgba(111,86,217,.3);box-shadow:0 13px 32px rgba(84,74,166,.13)}.demo-paso.done{border-color:rgba(22,135,101,.2)}',
      '.demo-step-head{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:10px;padding:11px}.demo-number{width:39px;height:39px;display:grid;place-items:center;border-radius:13px;background:linear-gradient(135deg,#4f82e8,#7557d4);color:#fff;font-size:10px;font-weight:950;box-shadow:0 7px 15px rgba(91,100,205,.2)}.demo-paso.done .demo-number{background:linear-gradient(135deg,#20a77e,#54cfaa)}',
      '.demo-step-main{min-width:0;padding:0;border:0;background:transparent;font:inherit;text-align:left;cursor:pointer}.demo-step-main small{display:block;margin-bottom:2px;color:#7c6bd4;font-size:7.5px;font-weight:950;letter-spacing:.65px}.demo-step-main h4{margin:0;color:var(--demo-ink);font-size:13.5px}.demo-step-main p{margin:3px 0 0;color:var(--demo-muted);font-size:9.5px;font-weight:650;line-height:1.3}.demo-chevron{display:inline-block;margin-left:4px;color:#7562cc;transition:transform .2s}.demo-step-main[aria-expanded="true"] .demo-chevron{transform:rotate(180deg)}',
      '.demo-check{appearance:none;width:27px;height:27px;margin:0;border:2px solid rgba(91,100,140,.22);border-radius:9px;background:rgba(255,255,255,.75);cursor:pointer;display:grid;place-items:center}.demo-check:checked{border-color:#20a77e;background:linear-gradient(135deg,#20a77e,#54cfaa)}.demo-check:checked:after{content:"✓";color:#fff;font-size:15px;font-weight:950}',
      '.demo-step-body{padding:0 13px 14px;border-top:1px solid var(--demo-line);animation:demo-open .24s ease}.demo-script{position:relative;margin:12px 0 9px;padding:13px 13px 13px 41px;border-radius:15px;background:linear-gradient(135deg,rgba(79,130,232,.1),rgba(111,86,217,.09));color:#383a4a;font-size:11px;font-weight:750;line-height:1.5}.demo-script:before{content:"🎙";position:absolute;left:12px;top:12px}.demo-script small{display:block;margin-bottom:3px;color:#5b45bb;font-size:8px;font-weight:950;letter-spacing:.75px}',
      '.demo-bridge{margin:-1px 0 9px;padding:9px 11px;border-radius:12px;background:rgba(58,208,164,.1);color:#26735e;font-size:9.5px;font-weight:750;line-height:1.4}.demo-bridge b{font-weight:950}',
      '.demo-question-card{padding:12px;border:1px solid rgba(79,130,232,.13);border-radius:15px;background:rgba(255,255,255,.72)}.demo-question-top{display:flex;align-items:center;justify-content:space-between;gap:8px}.demo-question-top span{color:#4f82e8;font-size:8px;font-weight:950;letter-spacing:.7px}.demo-question-top small{color:#8a8b98;font-size:8px;font-weight:800}.demo-question-card strong{display:block;min-height:35px;margin-top:6px;color:var(--demo-ink);font-size:11px;line-height:1.45}.demo-next-question{margin-top:8px;padding:7px 9px;border:1px solid rgba(79,130,232,.15);border-radius:10px;background:rgba(79,130,232,.07);color:#426fc8;font:inherit;font-size:8.5px;font-weight:900;cursor:pointer}',
      '.demo-insights{display:grid;grid-template-columns:1fr;gap:6px;margin-top:8px}.demo-insight{padding:10px;border-radius:13px;background:rgba(73,84,125,.055)}.demo-insight span{display:block;margin-bottom:3px;color:#6d58c6;font-size:7.5px;font-weight:950;letter-spacing:.65px}.demo-insight p{margin:0;color:#626475;font-size:9px;font-weight:670;line-height:1.42}.demo-insight.avoid{background:rgba(236,93,112,.06)}.demo-insight.avoid span{color:#c64b5e}',
      '.demo-step-action{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.demo-continue,.demo-bottle,.demo-objection-open{min-height:40px;padding:9px 12px;border:0;border-radius:12px;font:inherit;font-size:9.5px;font-weight:950;cursor:pointer}.demo-continue{flex:1;background:linear-gradient(135deg,#4f82e8,#7557d4);color:#fff;box-shadow:0 7px 16px rgba(84,83,190,.18)}.demo-bottle,.demo-objection-open{background:rgba(58,208,164,.13);color:#16745b}.demo-objection-open{background:rgba(236,93,152,.1);color:#b93c70}',
      '.demo-readiness{margin-top:10px;padding:12px;border-radius:15px;background:rgba(111,86,217,.065)}.demo-readiness h5{margin:0;color:var(--demo-ink);font-size:11px}.demo-readiness>p{margin:3px 0 9px;color:var(--demo-muted);font-size:8.5px;font-weight:650}.demo-scale{display:grid;grid-template-columns:repeat(5,1fr);gap:5px}.demo-scale button{aspect-ratio:1;border:1px solid rgba(111,86,217,.14);border-radius:10px;background:rgba(255,255,255,.68);color:#6854c0;font:inherit;font-size:10px;font-weight:950;cursor:pointer}.demo-scale button.active{border-color:transparent;background:linear-gradient(135deg,#4f82e8,#ec5d98);color:#fff;box-shadow:0 6px 13px rgba(116,80,180,.2)}.demo-ready-answer{margin-top:9px;padding:9px 10px;border-radius:11px;background:rgba(255,255,255,.62);color:#555768;font-size:9px;font-weight:700;line-height:1.42}.demo-ready-answer b{display:block;margin-bottom:2px;color:#5b45bb}',
      '.demo-complete{padding:15px;border:1px solid rgba(32,167,126,.2);border-radius:20px;background:linear-gradient(135deg,rgba(58,208,164,.15),rgba(79,130,232,.1));text-align:center;animation:demo-pop .3s ease}.demo-complete .icon{width:42px;height:42px;display:grid;place-items:center;margin:0 auto 7px;border-radius:14px;background:linear-gradient(135deg,#20a77e,#54cfaa);color:#fff;font-size:20px}.demo-complete h3{margin:0;color:var(--demo-ink);font-size:14px}.demo-complete p{max-width:470px;margin:5px auto 0;color:var(--demo-muted);font-size:9.5px;font-weight:680;line-height:1.45}',
      '.demo-sheet{position:fixed;inset:0;z-index:15000;display:grid;align-items:end;background:rgba(24,25,43,.5);backdrop-filter:blur(5px);overscroll-behavior:contain}.demo-sheet[hidden]{display:none!important}.demo-sheet-card{max-height:min(82vh,720px);overflow:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:16px 15px calc(18px + env(safe-area-inset-bottom));border-radius:24px 24px 0 0;background:linear-gradient(160deg,#f5f8ff,#fff5fa);box-shadow:0 -20px 55px rgba(30,34,75,.25);animation:demo-sheet .25s ease}.demo-sheet-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}.demo-sheet-head span{display:block;color:#c33e77;font-size:8px;font-weight:950;letter-spacing:.9px}.demo-sheet-head h2{margin:3px 0 0;color:var(--demo-ink);font-size:20px;letter-spacing:-.3px}.demo-sheet-close{width:40px;height:40px;flex:0 0 auto;border:0;border-radius:13px;background:rgba(111,86,217,.1);color:#654fc0;font-size:20px;cursor:pointer}',
      '.demo-objection-intro{margin:0 0 11px;color:#6d6f80;font-size:10px;font-weight:650;line-height:1.45}.demo-objection-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.demo-objection{min-height:65px;padding:10px;border:1px solid rgba(90,95,135,.1);border-radius:14px;background:rgba(255,255,255,.78);color:#3e4050;font:inherit;font-size:9.5px;font-weight:900;text-align:left;cursor:pointer}.demo-objection span{display:block;margin-bottom:4px;font-size:16px}.demo-objection:hover{border-color:rgba(111,86,217,.28);background:rgba(111,86,217,.07)}',
      '.demo-objection-answer{padding:14px;border-radius:17px;background:rgba(255,255,255,.8);animation:demo-pop .22s ease}.demo-answer-back{margin-bottom:10px;padding:6px 0;border:0;background:transparent;color:#5b45bb;font:inherit;font-size:9px;font-weight:950;cursor:pointer}.demo-objection-answer .answer-icon{font-size:25px}.demo-objection-answer h3{margin:4px 0 9px;color:var(--demo-ink);font-size:15px}.demo-say{padding:12px;border-left:4px solid #6f56d9;border-radius:12px;background:rgba(111,86,217,.08);color:#414354;font-size:11px;font-weight:750;line-height:1.5}.demo-follow{margin-top:8px;padding:10px;border-radius:12px;background:rgba(58,208,164,.1);color:#266f5c;font-size:9.5px;font-weight:750;line-height:1.42}.demo-answer-rule{margin:11px 2px 0;color:#7a7c8b;font-size:8.5px;font-weight:700;line-height:1.4}',
      'body.dark #view-demo{--demo-ink:#f2f2f7;--demo-muted:#b8b9c5;--demo-line:rgba(255,255,255,.08)}body.dark .demo-panel,body.dark .demo-paso{background:rgba(35,37,56,.82);border-color:rgba(255,255,255,.08)}body.dark .demo-focus,body.dark .demo-question-card,body.dark .demo-scale button{background:rgba(255,255,255,.055);border-color:rgba(255,255,255,.08);color:#d1d2db}body.dark .demo-focus[aria-pressed="true"]{background:rgba(111,86,217,.25);color:#c8bfff}body.dark .demo-coach-now,body.dark .demo-script{background:linear-gradient(135deg,rgba(79,130,232,.16),rgba(111,86,217,.14));color:#d9dae2}body.dark .demo-script{color:#eef0f6}body.dark .demo-bridge{background:rgba(58,208,164,.11);color:#8ad8bd}body.dark .demo-insight{background:rgba(255,255,255,.045)}body.dark .demo-question-card strong,body.dark .demo-sos strong{color:#f1f1f6}body.dark .demo-readiness{background:rgba(111,86,217,.12)}body.dark .demo-ready-answer{background:rgba(255,255,255,.055);color:#d3d4dd}body.dark .demo-complete{background:linear-gradient(135deg,rgba(58,208,164,.12),rgba(79,130,232,.1))}body.dark .demo-sheet-card{background:linear-gradient(160deg,#181a2a,#2a2136)}body.dark .demo-objection{background:rgba(255,255,255,.055);border-color:rgba(255,255,255,.08);color:#ededf3}body.dark .demo-objection-answer{background:rgba(255,255,255,.045)}body.dark .demo-say{color:#e4e4ec}',
      '@media(min-width:760px){.demo-hero{padding:24px 26px}.demo-hero h2{font-size:29px}.demo-layout{grid-template-columns:280px minmax(0,1fr);align-items:start}.demo-rail{position:sticky;top:14px}.demo-insights{grid-template-columns:1fr 1fr}.demo-insight.avoid{grid-column:1/-1}.demo-sheet{align-items:center;justify-items:center;padding:20px}.demo-sheet-card{width:min(620px,100%);border-radius:24px;padding:20px;max-height:82vh}}',
      '@media(max-width:410px){.demo-hero{padding:17px}.demo-hero h2{font-size:21px}.demo-promise{grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}.demo-promise div{padding:8px 3px;text-align:center}.demo-promise b{margin:0;font-size:9px}.demo-promise span{display:none}.demo-step-head{gap:8px;padding:10px}.demo-number{width:36px;height:36px}.demo-objection-grid{grid-template-columns:1fr}.demo-quick-tools{grid-template-columns:1fr 1fr}}',
      '@media(prefers-reduced-motion:reduce){.demo-live i,.demo-step-body,.demo-complete,.demo-sos,.demo-sheet-card{animation:none!important}.demo-progress>i{transition:none}}',
      '.demo-focus:focus-visible,.demo-tool:focus-visible,.demo-step-main:focus-visible,.demo-check:focus-visible,.demo-continue:focus-visible,.demo-bottle:focus-visible,.demo-objection-open:focus-visible,.demo-scale button:focus-visible,.demo-objection:focus-visible,.demo-sheet-close:focus-visible{outline:3px solid rgba(79,130,232,.35);outline-offset:2px}',
      '@keyframes demo-live{50%{transform:scale(.72);opacity:.65}}@keyframes demo-open{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:none}}@keyframes demo-pop{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:none}}@keyframes demo-sheet{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}'
    ].join('');
    document.head.appendChild(s);
  }

  function heroHTML(){
    var count = doneCount();
    var pct = count * 25;
    return '<section class="demo-hero" aria-labelledby="demoCoachTitle">' +
      '<div class="demo-live"><i></i> COACH COMERCIAL EN VIVO</div>' +
      '<h2 id="demoCoachTitle">APPI te dice qué hacer en cada momento</h2>' +
      '<p>En una demo real no hay tiempo para buscar apuntes. Escuchá, marcá lo que aparece y recibí la pregunta, el guion o la respuesta que necesitás ahora.</p>' +
      '<div class="demo-progress-head"><span>' + count + ' de 4 momentos completados</span><button type="button" class="demo-reset" data-demo-reset>Nueva demo</button></div>' +
      '<div class="demo-progress" role="progressbar" aria-label="Progreso de la demostración" aria-valuemin="0" aria-valuemax="4" aria-valuenow="' + count + '"><i style="width:' + pct + '%"></i></div>' +
      '<div class="demo-promise"><div><b>🎙 Guiones</b><span>para decirlo simple</span></div><div><b>⚡ Preguntas</b><span>para no trabarte</span></div><div><b>🛡 Objeciones</b><span>para responder con confianza</span></div></div>' +
      '</section>';
  }

  function railHTML(){
    var focus = focusData();
    var coach = focus ? focus.coach : 'Marcá una señal de la conversación y APPI adaptará la recomendación sin elegir productos por vos.';
    var activeQuestion = PASOS_DEMO[state.active].questions[state.questions[state.active]];
    return '<aside class="demo-rail" aria-label="Herramientas del coach">' +
      '<section class="demo-panel">' +
        '<span class="demo-panel-kicker">RADAR DE NECESIDAD</span>' +
        '<h3>¿Qué apareció en la charla?</h3>' +
        '<p>Marcá la señal principal que escuchaste.</p>' +
        '<div class="demo-focuses">' + FOCOS.map(function(f){
          return '<button type="button" class="demo-focus" data-demo-focus="' + esc(f.key) + '" aria-pressed="' + (state.focus === f.key) + '">' + f.icon + ' ' + esc(f.label) + '</button>';
        }).join('') + '</div>' +
        '<div class="demo-coach-now" aria-live="polite"><b>EL COACH TE SUGIERE</b>' + esc(coach) + '</div>' +
      '</section>' +
      '<section class="demo-panel">' +
        '<span class="demo-panel-kicker">AYUDA INMEDIATA</span>' +
        '<h3>No pierdas el hilo</h3>' +
        '<p>Dos accesos para usar en plena conversación.</p>' +
        '<div class="demo-quick-tools">' +
          '<button type="button" class="demo-tool" data-demo-sos>⚡ Dame la próxima pregunta</button>' +
          '<button type="button" class="demo-tool secondary" data-demo-objections>🛡 Resolver una objeción</button>' +
        '</div>' +
        (state.sos ? '<div class="demo-sos" role="status"><span>PREGUNTÁ AHORA</span><strong>' + esc(activeQuestion) + '</strong></div>' : '') +
      '</section>' +
      '<div class="demo-privacy"><span>●</span><div><b>Conversación privada.</b> Esta guía no registra la presentación ni datos de la persona.</div></div>' +
      '</aside>';
  }

  function readinessHTML(){
    var selected = READINESS[state.readiness];
    return '<section class="demo-readiness" aria-labelledby="demoReadinessTitle">' +
      '<h5 id="demoReadinessTitle">Termómetro de decisión</h5>' +
      '<p>¿Qué tan cerca sentís a la persona? No se lo muestres como examen: usalo para elegir tu próxima pregunta.</p>' +
      '<div class="demo-scale" role="group" aria-label="Nivel de decisión">' + [1,2,3,4,5].map(function(n){
        return '<button type="button" data-demo-readiness="' + n + '" class="' + (state.readiness === n ? 'active' : '') + '" aria-pressed="' + (state.readiness === n) + '">' + n + '</button>';
      }).join('') + '</div>' +
      '<div class="demo-ready-answer" aria-live="polite">' + (selected ? '<b>' + esc(selected.label) + '</b>' + esc(selected.text) : 'Elegí un nivel y APPI te sugerirá cómo continuar sin presionar.') + '</div>' +
      '</section>';
  }

  function stepHTML(p, i){
    var open = state.active === i;
    var qIndex = state.questions[i];
    var focus = focusData();
    var actionExtra = '';
    if (i === 1) actionExtra = '<button type="button" class="demo-bottle" data-demo-bottle>🍾 Abrir Comparativas</button>';
    if (i === 3) actionExtra = '<button type="button" class="demo-objection-open" data-demo-objections>🛡 Ver objeciones</button>';
    var nextLabel = i < 3 ? 'Listo, seguir a ' + PASOS_DEMO[i + 1].t + ' →' : 'Completar el recorrido ✓';
    return '<article class="demo-paso ' + (open ? 'active ' : '') + (state.done[i] ? 'done' : '') + '" data-demo-step="' + i + '">' +
      '<div class="demo-step-head">' +
        '<div class="demo-number" aria-hidden="true">' + (state.done[i] ? '✓' : p.icon) + '</div>' +
        '<button type="button" class="demo-step-main" data-open-step="' + i + '" aria-expanded="' + open + '" aria-controls="demoStepBody' + i + '">' +
          '<small>' + esc(p.eyebrow) + '</small><h4>' + (i + 1) + '. ' + esc(p.t) + ' <span class="demo-chevron">⌄</span></h4><p>' + esc(p.d) + '</p>' +
        '</button>' +
        '<input class="demo-check" type="checkbox" data-demo="' + i + '" aria-label="Marcar ' + esc(p.t) + ' como completado" ' + (state.done[i] ? 'checked' : '') + '>' +
      '</div>' +
      '<div class="demo-step-body" id="demoStepBody' + i + '" ' + (open ? '' : 'hidden') + '>' +
        '<div class="demo-script"><small>DECÍ ESTO</small>' + esc(p.script) + '</div>' +
        (focus ? '<div class="demo-bridge"><b>Puente según la charla:</b> ' + esc(focus.bridge) + '</div>' : '') +
        '<div class="demo-question-card">' +
          '<div class="demo-question-top"><span>PREGUNTA RECOMENDADA</span><small>' + (qIndex + 1) + ' / ' + p.questions.length + '</small></div>' +
          '<strong id="demoQuestion' + i + '">' + esc(p.questions[qIndex]) + '</strong>' +
          '<button type="button" class="demo-next-question" data-next-question="' + i + '">Otra pregunta ↻</button>' +
        '</div>' +
        (i === 3 ? readinessHTML() : '') +
        '<div class="demo-insights">' +
          '<div class="demo-insight"><span>SEÑALES PARA ESCUCHAR</span><p>' + esc(p.signals) + '</p></div>' +
          '<div class="demo-insight"><span>TIP DE COACH</span><p>' + esc(p.tip) + '</p></div>' +
          '<div class="demo-insight avoid"><span>EVITÁ ESTO</span><p>' + esc(p.avoid) + '</p></div>' +
        '</div>' +
        '<div class="demo-step-action">' + actionExtra + '<button type="button" class="demo-continue" data-complete-step="' + i + '">' + esc(nextLabel) + '</button></div>' +
      '</div>' +
      '</article>';
  }

  function completeHTML(){
    if (doneCount() !== 4) return '';
    return '<section class="demo-complete" role="status"><div class="icon">✓</div><h3>La conversación quedó completa</h3><p>La persona pudo reconocer su necesidad, comparar con información propia, entender el sistema y expresar qué necesita para decidir. Ahora sólo queda respetar el próximo paso que acordaron.</p></section>';
  }

  function sheetHTML(){
    return '<div class="demo-sheet" id="demoObjectionSheet" data-demo-sheet-backdrop hidden>' +
      '<section class="demo-sheet-card" role="dialog" aria-modal="true" aria-labelledby="demoSheetTitle">' +
        '<div class="demo-sheet-head"><div><span>LABORATORIO DE OBJECIONES</span><h2 id="demoSheetTitle">Respondé sin improvisar</h2></div><button type="button" class="demo-sheet-close" data-demo-sheet-close aria-label="Cerrar">×</button></div>' +
        '<div id="demoObjectionList"><p class="demo-objection-intro">Elegí lo que escuchaste. APPI te dará una respuesta y la pregunta que descubre qué hay detrás.</p><div class="demo-objection-grid">' +
          Object.keys(OBJECIONES).map(function(key){ var o = OBJECIONES[key]; return '<button type="button" class="demo-objection" data-demo-objection="' + esc(key) + '"><span>' + o.icon + '</span>' + esc(o.label) + '</button>'; }).join('') +
        '</div></div>' +
        '<div class="demo-objection-answer" id="demoObjectionAnswer" hidden>' +
          '<button type="button" class="demo-answer-back" data-demo-objection-back>‹ Ver otra objeción</button>' +
          '<div class="answer-icon" id="demoAnswerIcon"></div><h3 id="demoAnswerTitle"></h3>' +
          '<div class="demo-say" id="demoAnswerSay"></div><div class="demo-follow" id="demoAnswerFollow"></div>' +
          '<p class="demo-answer-rule">Principio APPI: reconocé primero, preguntá después y respondé solamente con información que puedas sostener.</p>' +
        '</div>' +
      '</section>' +
      '</div>';
  }

  function render(){
    var cont = document.getElementById('demoCont');
    if (!cont) return;
    estilos();
    cont.innerHTML = '<div class="demo-wrap">' + heroHTML() + '<div class="demo-layout">' + railHTML() + '<main class="demo-steps" aria-label="Cuatro momentos de la demostración">' +
      PASOS_DEMO.map(stepHTML).join('') + completeHTML() + '</main></div></div>' + sheetHTML();
    bind(cont);
  }

  function bind(cont){
    if (cont.dataset.demoBound === '1') return;
    cont.dataset.demoBound = '1';
    cont.addEventListener('click', onClick);
    cont.addEventListener('change', onChange);
  }

  function onChange(event){
    var check = event.target.closest('[data-demo]');
    if (!check) return;
    var i = Number(check.getAttribute('data-demo'));
    state.done[i] = check.checked;
    if (check.checked && i < 3) state.active = i + 1;
    else state.active = i;
    state.sos = false;
    saveState();
    render();
    if (check.checked && i < 3) scrollStep(i + 1);
  }

  function onClick(event){
    var target;
    target = event.target.closest('[data-open-step]');
    if (target) {
      state.active = Number(target.getAttribute('data-open-step'));
      state.sos = false;
      saveState(); render(); return;
    }
    target = event.target.closest('[data-demo-focus]');
    if (target) {
      var key = target.getAttribute('data-demo-focus');
      state.focus = state.focus === key ? '' : key;
      saveState(); render(); return;
    }
    target = event.target.closest('[data-next-question]');
    if (target) {
      var qStep = Number(target.getAttribute('data-next-question'));
      state.questions[qStep] = (state.questions[qStep] + 1) % PASOS_DEMO[qStep].questions.length;
      state.sos = false;
      saveState(); render(); return;
    }
    target = event.target.closest('[data-complete-step]');
    if (target) {
      var complete = Number(target.getAttribute('data-complete-step'));
      state.done[complete] = true;
      state.active = complete < 3 ? complete + 1 : 3;
      state.sos = false;
      saveState(); render();
      if (complete < 3) scrollStep(complete + 1);
      else scrollComplete();
      return;
    }
    target = event.target.closest('[data-demo-readiness]');
    if (target) {
      state.readiness = Number(target.getAttribute('data-demo-readiness'));
      saveState(); render(); return;
    }
    if (event.target.closest('[data-demo-sos]')) {
      var active = state.active;
      state.questions[active] = (state.questions[active] + 1) % PASOS_DEMO[active].questions.length;
      state.sos = true;
      saveState(); render(); return;
    }
    if (event.target.closest('[data-demo-objections]')) { openSheet(); return; }
    if (event.target.closest('[data-demo-sheet-close]') || (event.target.hasAttribute && event.target.hasAttribute('data-demo-sheet-backdrop'))) { closeSheet(); return; }
    target = event.target.closest('[data-demo-objection]');
    if (target) { showObjection(target.getAttribute('data-demo-objection')); return; }
    if (event.target.closest('[data-demo-objection-back]')) { showObjectionList(); return; }
    if (event.target.closest('[data-demo-bottle]')) {
      if (typeof window.openBotella === 'function') window.openBotella();
      else if (typeof window.showToast === 'function') window.showToast('Comparativas no está disponible en este momento.', 2200);
      return;
    }
    if (event.target.closest('[data-demo-reset]')) {
      if (window.APPIDialog && typeof window.APPIDialog.confirm === 'function') {
        window.APPIDialog.confirm('Se limpiará el avance de esta conversación.', {
          title: 'Empezar una nueva demo', icon: '↻', okText: 'Empezar', cancelText: 'Seguir acá'
        }).then(function(confirmed){ if (confirmed) reset(); });
      }
    }
  }

  function openSheet(){
    var sheet = document.getElementById('demoObjectionSheet');
    if (!sheet) return;
    showObjectionList();
    sheet.hidden = false;
    var close = sheet.querySelector('[data-demo-sheet-close]');
    if (close) close.focus();
  }

  function closeSheet(){
    var sheet = document.getElementById('demoObjectionSheet');
    if (sheet) sheet.hidden = true;
    // Limpia el bloqueo que pudo haber dejado una versión anterior.
    if (document.body) document.body.classList.remove('demo-sheet-open');
  }

  function showObjection(key){
    var objection = OBJECIONES[key];
    if (!objection) return;
    var list = document.getElementById('demoObjectionList');
    var answer = document.getElementById('demoObjectionAnswer');
    if (!list || !answer) return;
    list.hidden = true; answer.hidden = false;
    document.getElementById('demoAnswerIcon').textContent = objection.icon;
    document.getElementById('demoAnswerTitle').textContent = objection.title;
    document.getElementById('demoAnswerSay').textContent = objection.answer;
    document.getElementById('demoAnswerFollow').textContent = objection.follow;
    var back = answer.querySelector('[data-demo-objection-back]');
    if (back) back.focus();
  }

  function showObjectionList(){
    var list = document.getElementById('demoObjectionList');
    var answer = document.getElementById('demoObjectionAnswer');
    if (list) list.hidden = false;
    if (answer) answer.hidden = true;
  }

  function scrollStep(i){
    setTimeout(function(){
      var el = document.querySelector('[data-demo-step="' + i + '"]');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 30);
  }

  function scrollComplete(){
    setTimeout(function(){
      var el = document.querySelector('.demo-complete');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 30);
  }

  function reset(){
    state = defaultState();
    try { sessionStorage.removeItem(STORE); } catch (error) {}
    closeSheet(); render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openDemo(){
    clearLegacyScrollLock();
    if (typeof window.showView === 'function') window.showView('view-demo');
    render();
  }

  function clearLegacyScrollLock(){
    if (document.body) document.body.classList.remove('demo-sheet-open');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', clearLegacyScrollLock);
  else clearLegacyScrollLock();

  document.addEventListener('keydown', function(event){
    if (event.key === 'Escape') closeSheet();
  });
  window.addEventListener('popstate', closeSheet);

  window.openDemo = openDemo;
  window.APPIDemoGuia = {
    pasos: PASOS_DEMO,
    objeciones: OBJECIONES,
    render: render,
    reset: reset,
    open: openDemo
  };
})();
