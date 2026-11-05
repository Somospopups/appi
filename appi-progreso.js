/* APPI v915 · Mi avance
   Acompañamiento comercial basado únicamente en evidencia guardada en APPI.
   No inventa ventas ni completa acciones: prepara el próximo paso y el
   distribuidor siempre decide y confirma. */
(function(){
  'use strict';

  var VERSION=1;
  var PREFIX='appi_progreso_v1_';
  var DAY=86400000;
  var MAX_EVENTS=500;
  var MAX_SNAPSHOTS=120;
  var timer=0;
  var lastAnalysis=null;
  var lastKey='';
  var store=null;

  function uid(){
    try{return window.APPIAuth&&window.APPIAuth.userId?String(window.APPIAuth.userId()||'local'):'local'}catch(e){return 'local'}
  }
  function key(){return PREFIX+uid()}
  function isoDay(value){
    var d=value instanceof Date?value:new Date(value||Date.now());
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }
  function startDay(value){var d=value instanceof Date?new Date(value):new Date(value||Date.now());d.setHours(0,0,0,0);return d}
  function daysAgo(value){return Math.max(0,Math.floor((startDay(new Date())-startDay(value))/DAY))}
  function isoDateTime(value){var d=new Date(value||Date.now());return isNaN(d.getTime())?'':d.toISOString()}
  function number(value){var n=Number(value);return isFinite(n)?n:0}
  function arr(value){return Array.isArray(value)?value:[]}
  function obj(value){return value&&typeof value==='object'&&!Array.isArray(value)?value:{}}
  function text(value){return String(value==null?'':value)}
  function esc(value){return text(value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function firstName(value){return text(value).trim().split(/\s+/)[0]||'esta persona'}
  function hash(value){
    var s=text(value),h=2166136261;
    for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}
    return (h>>>0).toString(36);
  }
  function unique(items,keyFn){var seen={},out=[];arr(items).forEach(function(item){var k=keyFn(item);if(!k||seen[k])return;seen[k]=1;out.push(item)});return out}
  function safeParse(raw,fallback){try{var parsed=JSON.parse(raw);return parsed==null?fallback:parsed}catch(e){return fallback}}
  function blankStore(){return {version:VERSION,createdAt:new Date().toISOString(),baseline:null,snapshots:{},events:{},plans:{}}}
  function normalizeStore(raw){
    raw=obj(raw);
    return {version:VERSION,createdAt:raw.createdAt||new Date().toISOString(),baseline:raw.baseline||null,snapshots:obj(raw.snapshots),events:obj(raw.events),plans:obj(raw.plans)};
  }
  function loadStore(){
    var nextKey=key();
    if(store&&lastKey===nextKey)return store;
    lastKey=nextKey;
    try{store=normalizeStore(safeParse(localStorage.getItem(nextKey),{}))}catch(e){store=blankStore()}
    return store;
  }
  function prune(data){
    var snapKeys=Object.keys(data.snapshots||{}).sort().reverse();
    snapKeys.slice(MAX_SNAPSHOTS).forEach(function(k){delete data.snapshots[k]});
    var eventKeys=Object.keys(data.events||{}).sort(function(a,b){return text(data.events[b]&&data.events[b].at).localeCompare(text(data.events[a]&&data.events[a].at))});
    eventKeys.slice(MAX_EVENTS).forEach(function(k){delete data.events[k]});
    var planKeys=Object.keys(data.plans||{}).sort().reverse();
    planKeys.slice(40).forEach(function(k){delete data.plans[k]});
  }
  function saveStore(){
    var data=loadStore();
    prune(data);
    try{var serialized=JSON.stringify(data);if(localStorage.getItem(key())!==serialized)localStorage.setItem(key(),serialized)}catch(e){}
  }
  function validPhone(value){
    var digits=text(value).replace(/\D/g,'');
    return digits.length>=8&&digits.length<=15;
  }
  function contactPhone(contact){return contact&&((contact.telefono!=null&&contact.telefono)||contact.telf||contact.celular||'')}
  function nextContact(contact){return contact&&(contact.proximo_contacto||contact.proximo||contact.fechaSeguimiento||'')}
  function contactClosed(contact){return /^(convertido|descartado)$/i.test(text(contact&&contact.estado))}
  function isConverted(contact){return /^convertido$/i.test(text(contact&&contact.estado))}
  function inLastDays(value,total){var d=new Date(value||0);return !isNaN(d.getTime())&&Date.now()-d.getTime()>=-DAY&&Date.now()-d.getTime()<total*DAY}

  function getJourney(){
    var id=uid(),raw={};
    try{raw=safeParse(localStorage.getItem('appi_acciones_v1_'+id),{})||{}}catch(e){}
    var days=obj(raw.dias),done7=0,total7=0,done30=0,total30=0,activeDays7=0;
    Object.keys(days).forEach(function(day){
      var age=daysAgo(day),row=obj(days[day]),done=number(row.hechos),total=number(row.total);
      if(age<7){done7+=done;total7+=total;if(done>0)activeDays7++}
      if(age<30){done30+=done;total30+=total}
    });
    return {done7:done7,total7:total7,done30:done30,total30:total30,activeDays7:activeDays7,todayDone:number(obj(days[isoDay()]).hechos),todayTotal:number(obj(days[isoDay()]).total)};
  }
  function getActivities(){
    var state=window.APPIGestion&&window.APPIGestion.state;
    if(!state||!state.activities)return [];
    var all=[];
    try{
      if(typeof state.activities.forEach==='function')state.activities.forEach(function(value){all=all.concat(arr(value))});
      else Object.keys(state.activities).forEach(function(k){all=all.concat(arr(state.activities[k]))});
    }catch(e){}
    return all;
  }
  function isDemoActivity(activity){return /presentaci|demo|demostraci/i.test(text(activity&&(activity.tipo||activity.type||activity.resultado||activity.nota)))}
  function getAgendaCount(){try{return window.APPIAgendaPersonal&&window.APPIAgendaPersonal.lista?arr(window.APPIAgendaPersonal.lista()).length:0}catch(e){return 0}}
  function reactivationRaw(){try{return obj(safeParse(localStorage.getItem('appi_reactivacion_v1_'+uid()),{}))}catch(e){return {}}}
  function getReactivation(){
    var dormant=[],revived=[],contactable=[];
    try{
      if(window.APPIReactivacion){
        dormant=arr(window.APPIReactivacion.dormidos&&window.APPIReactivacion.dormidos());
        revived=arr(window.APPIReactivacion.revividos&&window.APPIReactivacion.revividos());
        contactable=arr(window.APPIReactivacion.porContactar&&window.APPIReactivacion.porContactar());
      }
    }catch(e){}
    var raw=reactivationRaw(),recentRevived=0;
    Object.keys(obj(raw.revividos)).forEach(function(k){if(inLastDays(raw.revividos[k]&&raw.revividos[k].at,7))recentRevived++});
    return {dormant:dormant,revived:revived,contactable:contactable,recentRevived:recentRevived};
  }
  function sourceReady(){
    var state=window.APPIGestion&&window.APPIGestion.state;
    return !!(state&&(number(state.lastLoaded)>0||arr(state.contacts).length>0));
  }
  function eventsOf(type,days){
    var out=[];
    Object.keys(loadStore().events||{}).forEach(function(k){var ev=store.events[k];if(ev&&ev.type===type&&(!days||inLastDays(ev.at,days)))out.push(ev)});
    return out;
  }
  function rawMetrics(){
    var state=window.APPIGestion&&window.APPIGestion.state||{};
    var contacts=arr(state.contacts).slice();
    var active=contacts.filter(function(c){return !contactClosed(c)});
    var withPhone=active.filter(function(c){return validPhone(contactPhone(c))});
    var withNext=active.filter(function(c){return !!nextContact(c)});
    var now=Date.now(),due=[],missing=[];
    active.forEach(function(c){
      var next=nextContact(c);
      if(/^(seguimiento|presentacion)$/i.test(text(c.estado))&&!next)missing.push(c);
      if(next){var d=new Date(next);if(!isNaN(d.getTime())&&d.getTime()<now+DAY)due.push(c)}
    });
    var activities=getActivities();
    var recentActivities=activities.filter(function(a){return inLastDays(a&&a.created_at,7)});
    var recentDemos=recentActivities.filter(isDemoActivity);
    var presentationContacts=active.filter(function(c){return /^presentacion$/i.test(text(c.estado))});
    var candidates=active.filter(function(c){return validPhone(contactPhone(c))&&!/^(presentacion)$/i.test(text(c.estado))}).sort(function(a,b){
      var score=function(c){var s=0;if(/^seguimiento$/i.test(text(c.estado)))s+=4;if(/^contactado$/i.test(text(c.estado)))s+=3;if(c.interes)s+=2;if(nextContact(c))s+=1;return s};
      return score(b)-score(a);
    });
    var converted=contacts.filter(isConverted);
    var converted7=converted.filter(function(c){return inLastDays(c.updated_at||c.created_at,7)}).length;
    var react=getReactivation(),journey=getJourney();
    var budgets7=eventsOf('presupuesto',7).length;
    var visits7=eventsOf('visita_programada',7).length;
    var organizedCount=active.filter(function(c){return validPhone(contactPhone(c))&&!!nextContact(c)}).length;
    var orderRatio=active.length?Math.round((organizedCount/active.length)*100):0;
    var results7=converted7+react.recentRevived;
    var movement7=recentActivities.length+budgets7+visits7;
    return {
      ready:sourceReady(),capturedAt:new Date().toISOString(),
      contacts:contacts,active:active,withPhone:withPhone,withNext:withNext,missing:missing,due:due,candidates:candidates,presentationContacts:presentationContacts,
      contactCount:contacts.length,activeCount:active.length,phoneCount:withPhone.length,nextCount:withNext.length,organizedCount:organizedCount,missingCount:missing.length,dueCount:due.length,
      agendaCount:getAgendaCount(),journey:journey,activityCount7:recentActivities.length,demoCount7:recentDemos.length,presentationCount:presentationContacts.length,
      convertedCount:converted.length,converted7:converted7,dormant:react.dormant,contactableOld:react.contactable,revivedCount:react.revived.length,revived7:react.recentRevived,
      budgetCount7:budgets7,visitCount7:visits7,orderRatio:orderRatio,results7:results7,movement7:movement7
    };
  }
  function compactMetrics(m){
    return {capturedAt:m.capturedAt,contactCount:m.contactCount,activeCount:m.activeCount,phoneCount:m.phoneCount,nextCount:m.nextCount,organizedCount:m.organizedCount,missingCount:m.missingCount,dueCount:m.dueCount,agendaCount:m.agendaCount,done7:m.journey.done7,total7:m.journey.total7,activeDays7:m.journey.activeDays7,activityCount7:m.activityCount7,demoCount7:m.demoCount7,presentationCount:m.presentationCount,convertedCount:m.convertedCount,revivedCount:m.revivedCount,budgetCount7:m.budgetCount7,visitCount7:m.visitCount7,orderRatio:m.orderRatio,results7:m.results7,movement7:m.movement7};
  }
  function ensureBaseline(m){
    var data=loadStore();
    if(!m.ready||data.baseline)return;
    data.baseline={at:m.capturedAt,date:isoDay(),metrics:compactMetrics(m)};
    saveStore();
  }
  function saveSnapshot(m){
    if(!m.ready)return;
    var data=loadStore(),today=isoDay(),next=compactMetrics(m),prev=data.snapshots[today];
    if(prev&&prev.metrics){
      var a=Object.assign({},prev.metrics),b=Object.assign({},next);delete a.capturedAt;delete b.capturedAt;
      var recent=Date.now()-new Date(prev.at||0).getTime()<15*60*1000;
      if(recent&&JSON.stringify(a)===JSON.stringify(b))return;
    }
    data.snapshots[today]={at:m.capturedAt,metrics:next};
    saveStore();
  }

  function progressFor(item,m){
    var b=obj(item.baseline),value=0;
    if(item.type==='seguimientos')value=Math.max(0,number(b.missingCount)-m.missingCount);
    if(item.type==='demostraciones')value=Math.max(0,Math.max(m.presentationCount-number(b.presentationCount),m.demoCount7-number(b.demoCount7)));
    if(item.type==='visitas')value=Math.max(0,(m.revivedCount+m.visitCount7)-number(b.revivedCount)-number(b.visitCount7));
    if(item.type==='contactos')value=Math.max(0,(m.contactCount+m.agendaCount)-number(b.contactCount)-number(b.agendaCount));
    if(item.type==='presupuestos')value=Math.max(0,m.budgetCount7-number(b.budgetCount7));
    return Math.min(number(item.target)||1,value);
  }
  function planDefinitions(m){
    var list=[];
    if(m.missingCount>0||m.dueCount>0)list.push({type:'seguimientos',target:Math.min(3,Math.max(1,m.missingCount||m.dueCount)),title:'Ordená tus seguimientos',detail:(m.missingCount?m.missingCount+' contacto'+(m.missingCount===1?'':'s')+' sin próximo paso':m.dueCount+' contacto'+(m.dueCount===1?'':'s')+' para atender hoy'),action:'Abrir contacto'});
    if(m.candidates.length>0)list.push({type:'demostraciones',target:Math.min(2,m.candidates.length),title:'Buscá demostraciones',detail:'Appi encontró '+m.candidates.length+' contacto'+(m.candidates.length===1?'':'s')+' con datos para retomar la conversación',action:'Ver candidato'});
    if(m.contactableOld.length>0)list.push({type:'visitas',target:1,title:'Volvé a un usuario anterior',detail:m.contactableOld.length+' usuario'+(m.contactableOld.length===1?'':'s')+' sin contacto reciente; podés preparar una visita',action:'Preparar visita'});
    if(m.contactCount<10||m.candidates.length===0)list.push({type:'contactos',target:3,title:'Sumá personas nuevas',detail:'Abrí tu Margarita y elegí nombres concretos para conversar',action:'Abrir mi Margarita'});
    if(m.budgetCount7===0)list.push({type:'presupuestos',target:1,title:'Prepará un presupuesto',detail:'Todavía no hay presupuestos registrados esta semana',action:'Abrir lista'});
    if(!list.length)list.push({type:'contactos',target:3,title:'Mantené el movimiento',detail:'Sumá personas nuevas para alimentar la próxima semana',action:'Abrir mi Margarita'});
    return list.slice(0,4);
  }
  function ensurePlan(m){
    var data=loadStore(),today=isoDay(),plan=data.plans[today];
    if(!plan&&!m.ready){
      return {date:today,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),items:planDefinitions(m).map(function(def){return {id:today+':'+def.type,type:def.type,target:def.target,title:def.title,detail:def.detail,action:def.action,baseline:compactMetrics(m),value:0,done:false}})};
    }
    if(!plan){
      plan={date:today,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),items:planDefinitions(m).map(function(def){return {id:today+':'+def.type,type:def.type,target:def.target,title:def.title,detail:def.detail,action:def.action,baseline:compactMetrics(m)}})};
      data.plans[today]=plan;saveStore();
    }else{
      // El plan diario no cambia de objetivo a mitad del día. Sólo refresca el
      // texto descriptivo cuando la evidencia cambió y conserva la línea de partida.
      var defs=planDefinitions(m),changed=false;
      arr(plan.items).forEach(function(item){var def=defs.find(function(d){return d.type===item.type});if(def&&(item.detail!==def.detail||item.action!==def.action)){item.detail=def.detail;item.action=def.action;changed=true}});
      if(changed){plan.updatedAt=new Date().toISOString();saveStore()}
    }
    plan.items=arr(plan.items).map(function(item){var value=progressFor(item,m);return Object.assign({},item,{value:value,done:value>=number(item.target)})});
    return plan;
  }
  function areaModel(m,baseline){
    var b=obj(baseline&&baseline.metrics);
    var areas=[
      {id:'orden',label:'Orden',icon:'✓',color:'#38b894',value:m.orderRatio,display:m.organizedCount+'/'+Math.max(1,m.activeCount),detail:'contactos activos con datos y próximo paso',delta:m.orderRatio-number(b.orderRatio)},
      {id:'constancia',label:'Constancia',icon:'↗',color:'#e7a83e',value:m.journey.total7?Math.round(m.journey.done7/m.journey.total7*100):0,display:m.journey.done7+'/'+m.journey.total7,detail:'acciones de jornada completadas en 7 días',delta:m.journey.done7-number(b.done7)},
      {id:'movimiento',label:'Movimiento comercial',icon:'◎',color:'#6f62c7',value:Math.min(100,m.movement7*12),display:String(m.movement7),detail:'actividades y presupuestos comprobados en 7 días',delta:m.movement7-number(b.movement7)},
      {id:'resultados',label:'Resultados',icon:'★',color:'#e77573',value:Math.min(100,m.results7*25),display:String(m.results7),detail:'conversiones o reactivaciones confirmadas en 7 días',delta:m.results7-number(b.results7)}
    ];
    return areas;
  }
  function analyze(){
    var m=rawMetrics();ensureBaseline(m);saveSnapshot(m);
    var data=loadStore(),baseline=data.baseline;
    var plan=ensurePlan(m),areas=areaModel(m,baseline);
    var activeAreas=areas.filter(function(a){return a.id==='orden'?m.nextCount>0:a.id==='constancia'?m.journey.done7>0:a.id==='movimiento'?m.movement7>0:m.results7>0}).length;
    var doneItems=arr(plan.items).filter(function(i){return i.done}).length;
    lastAnalysis={metrics:m,baseline:baseline,plan:plan,areas:areas,activeAreas:activeAreas,doneItems:doneItems};
    return lastAnalysis;
  }

  function registerEvent(type,id,meta){
    type=text(type).trim();id=text(id).trim();if(!type||!id)return false;
    var data=loadStore(),eventId=type+':'+id;
    if(data.events[eventId])return false;
    data.events[eventId]={id:eventId,type:type,at:new Date().toISOString(),meta:obj(meta)};
    saveStore();refresh();return true;
  }
  function registerBudget(data){
    data=obj(data);
    var lines=arr(data.lineas).map(function(line){var p=line&&line.p||{};return {sku:p.sku||p.id||p.nombre||'',q:number(line&&line.q),precio:number(p.precio||p.price)}});
    var id=isoDay()+':'+hash(JSON.stringify({para:text(data.para).trim().toLowerCase(),total:number(data.total),lineas:lines}));
    return registerEvent('presupuesto',id,{para:text(data.para).trim(),total:number(data.total),cantidad:lines.reduce(function(n,l){return n+l.q},0)});
  }

  function mountMascots(){
    if(!window.APPIGotita||!window.APPIGotita.mount)return;
    document.querySelectorAll('[data-apg-appi]').forEach(function(host){if(host.dataset.apgMounted)return;host.dataset.apgMounted='1';window.APPIGotita.mount(host);window.APPIGotita.setState(host,host.dataset.state||'happy')});
  }
  function homeHtml(a){
    var next=arr(a.plan.items).find(function(i){return !i.done})||a.plan.items[0];
    var ready=a.metrics.ready;
    var headline=ready?(a.activeAreas?('Moviste '+a.activeAreas+' de 4 áreas esta semana'):'Tu punto de partida ya está listo'):'Estoy ordenando tus datos reales';
    var sub=ready?(a.baseline&&a.baseline.date===isoDay()?'Desde hoy vamos a comparar tu avance sin inventar resultados.':'Appi revisó tu jornada y tus contactos para encontrar el próximo paso.'):'En unos segundos voy a preparar tu línea de partida.';
    return '<button type="button" class="apg-home-card" id="appiProgresoHomeCard" aria-label="Abrir Mi avance">'
      +'<span class="apg-home-orb" aria-hidden="true"><span data-apg-appi data-state="happy"></span></span>'
      +'<span class="apg-home-copy"><span class="apg-eyebrow">MI AVANCE <b>· DATOS REALES</b></span><strong>'+esc(headline)+'</strong><small>'+esc(sub)+'</small>'
      +(next?'<span class="apg-next-mini"><i></i><span><em>PRÓXIMO PASO</em>'+esc(next.title)+'</span><b>→</b></span>':'')+'</span>'
      +'<span class="apg-home-ring" style="--p:'+a.activeAreas+'"><b>'+a.activeAreas+'</b><small>/ 4</small></span>'
      +'</button>';
  }
  function ensureHomeCard(){
    var home=document.getElementById('view-home');if(!home)return null;
    var card=document.getElementById('appiProgresoHomeCard');
    if(!card){
      var wrap=document.createElement('div');wrap.id='appiProgresoHomeWrap';wrap.className='apg-home-wrap';
      var anchor=home.querySelector('.home-hero-card');
      if(anchor&&anchor.parentNode)anchor.parentNode.insertBefore(wrap,anchor.nextSibling);
      else {var head=home.querySelector('.home-section-head');if(head&&head.parentNode)head.parentNode.insertBefore(wrap,head);else home.appendChild(wrap)}
    }
    return document.getElementById('appiProgresoHomeWrap');
  }
  function renderHome(a){
    var wrap=ensureHomeCard();if(!wrap)return;
    wrap.innerHTML=homeHtml(a);var card=document.getElementById('appiProgresoHomeCard');if(card)card.onclick=open;
  }
  function deltaText(value,inverse){
    value=number(value);if(!value)return 'sin cambios todavía';
    var good=inverse?value<0:value>0;
    return '<span class="'+(good?'positive':'neutral')+'">'+(value>0?'+':'')+value+'</span> desde que empezaste';
  }
  function areaHtml(area,index){
    var angle=Math.max(0,Math.min(100,area.value))*3.6;
    return '<article class="apg-area" style="--area:'+area.color+';--delay:'+(index*70)+'ms">'
      +'<div class="apg-area-top"><span class="apg-area-icon">'+area.icon+'</span><span><strong>'+esc(area.label)+'</strong><small>'+esc(area.detail)+'</small></span><b>'+esc(area.display)+'</b></div>'
      +'<div class="apg-area-track"><i style="width:'+Math.max(area.value?4:0,Math.min(100,area.value))+'%"></i></div>'
      +'<div class="apg-area-foot"><span>'+Math.round(Math.max(0,Math.min(100,area.value)))+'% de la referencia semanal</span><span>'+deltaText(area.delta,false)+'</span></div>'
      +'</article>';
  }
  function planIcon(type){return {seguimientos:'↗',demostraciones:'✦',visitas:'⌂',contactos:'＋',presupuestos:'$'}[type]||'→'}
  function planHtml(item,index){
    var pct=Math.round((number(item.value)/Math.max(1,number(item.target)))*100);
    return '<article class="apg-plan-item '+(item.done?'is-done':'')+'" style="--delay:'+(index*80)+'ms">'
      +'<div class="apg-plan-icon">'+planIcon(item.type)+'</div><div class="apg-plan-copy"><div class="apg-plan-title"><strong>'+esc(item.title)+'</strong><span>'+item.value+'/'+item.target+'</span></div><p>'+esc(item.detail)+'</p><div class="apg-plan-track"><i style="width:'+pct+'%"></i></div></div>'
      +(item.done?'<span class="apg-done-mark" aria-label="Completado">✓</span>':'<button type="button" data-apg-action="'+esc(item.type)+'">'+esc(item.action)+' <span>→</span></button>')
      +'</article>';
  }
  function formatDate(day){
    var d=new Date(day+'T12:00:00');
    try{return new Intl.DateTimeFormat('es-AR',{day:'numeric',month:'short'}).format(d)}catch(e){return day}
  }
  function renderDetail(a){
    var host=document.getElementById('appiProgresoDetalle');if(!host)return;
    var b=a.baseline&&a.baseline.metrics||{};
    var now=a.metrics;
    var baselineReady=!!a.baseline;
    var silent=[
      '<b>'+now.dueCount+'</b> contacto'+(now.dueCount===1?'':'s')+' para atender hoy',
      '<b>'+now.missingCount+'</b> seguimiento'+(now.missingCount===1?'':'s')+' sin próximo paso',
      '<b>'+now.contactableOld.length+'</b> usuario'+(now.contactableOld.length===1?'':'s')+' anterior'+(now.contactableOld.length===1?'':'es')+' para retomar'
    ];
    var next=arr(a.plan.items).find(function(i){return !i.done})||a.plan.items[0];
    host.innerHTML='<div class="apg-detail-shell">'
      +'<section class="apg-hero">'
      +'<div class="apg-hero-glow"></div><div class="apg-hero-copy"><span class="apg-kicker"><i></i> ACOMPAÑAMIENTO COMERCIAL</span><h1>Tu negocio en movimiento</h1><p>Appi ordena la evidencia que ya guardaste, muestra lo que cambió y prepara acciones para que vos decidas.</p>'
      +'<div class="apg-hero-proof"><span>✓ Sin atribuirse ventas</span><span>✓ Sin ejecutar cambios sola</span></div></div>'
      +'<div class="apg-hero-appi"><div class="apg-orbits"><i></i><i></i><i></i></div><div data-apg-appi data-state="happy"></div><span><i></i>DATOS AL DÍA</span></div>'
      +'</section>'
      +'<section class="apg-section apg-real"><div class="apg-section-head"><div><span>LO QUE YA ESTÁ PASANDO</span><h2>Tus cuatro áreas reales</h2></div><p>Últimos 7 días · actualizado ahora</p></div><div class="apg-areas">'+a.areas.map(areaHtml).join('')+'</div></section>'
      +'<section class="apg-section apg-plan"><div class="apg-section-head"><div><span>PLAN DE HOY</span><h2>Acciones para alinear tu negocio</h2></div><p>'+a.doneItems+' de '+a.plan.items.length+' completadas</p></div>'
      +'<div class="apg-plan-list">'+a.plan.items.map(planHtml).join('')+'</div><p class="apg-confirm-note"><b>Vos tenés la última palabra.</b> Appi prepara y abre el lugar correcto; los cambios se hacen sólo cuando confirmás.</p></section>'
      +'<section class="apg-compare">'
      +'<div class="apg-compare-copy"><span>CUANDO EMPEZASTE / HOY</span><h2>Tu punto de partida no se borra</h2><p>'+(baselineReady?'Comparamos con datos guardados el '+formatDate(a.baseline.date)+'.':'Estamos preparando tu primera línea de partida con los datos reales de tu cuenta.')+'</p></div>'
      +'<div class="apg-compare-grid"><div><small>CONTACTOS CON PRÓXIMO PASO</small><strong>'+(baselineReady?number(b.nextCount):'—')+'</strong><span>al empezar</span></div><i>→</i><div class="today"><small>HOY</small><strong>'+now.nextCount+'</strong><span>'+deltaText(now.nextCount-number(b.nextCount),false)+'</span></div></div>'
      +'<div class="apg-compare-grid"><div><small>SEGUIMIENTOS SIN FECHA</small><strong>'+(baselineReady?number(b.missingCount):'—')+'</strong><span>al empezar</span></div><i>→</i><div class="today"><small>HOY</small><strong>'+now.missingCount+'</strong><span>'+deltaText(now.missingCount-number(b.missingCount),true)+'</span></div></div>'
      +'</section>'
      +'<section class="apg-bottom-grid"><article class="apg-silent"><div><span>TRABAJO SILENCIOSO DE APPI</span><h2>Ordené esto por vos</h2></div><ul>'+silent.map(function(x){return '<li><i>✓</i><span>'+x+'</span></li>'}).join('')+'</ul></article>'
      +'<article class="apg-week"><span>RESUMEN SEMANAL</span><div class="apg-week-number"><strong>'+now.journey.done7+'</strong><small>acciones<br>completadas</small></div><div class="apg-week-row"><span>Días con movimiento</span><b>'+now.journey.activeDays7+' / 7</b></div><div class="apg-week-row"><span>Presupuestos comprobados</span><b>'+now.budgetCount7+'</b></div><div class="apg-week-row"><span>Resultados confirmados</span><b>'+now.results7+'</b></div></article></section>'
      +(next?'<section class="apg-next"><div class="apg-next-appi" data-apg-appi data-state="thinking"></div><div><span>PRÓXIMO PASO RECOMENDADO</span><h2>'+esc(next.title)+'</h2><p>'+esc(next.detail)+'.</p></div><button type="button" data-apg-action="'+esc(next.type)+'">'+esc(next.action)+' <b>→</b></button></section>':'')
      +'<p class="apg-source-note">Fuente: jornada, Panel de Contactos, agenda personal, reactivación y presupuestos generados en Appi. Las ventas sólo cuentan cuando quedaron confirmadas en tus datos.</p>'
      +'</div>';
    bindActions(host);mountMascots();
  }
  function bindActions(host){host.querySelectorAll('[data-apg-action]').forEach(function(btn){btn.onclick=function(){runAction(btn.dataset.apgAction)}})}
  function toast(message){if(typeof window.showToast==='function')window.showToast(message);else if(window.APPIDialog&&window.APPIDialog.alert)window.APPIDialog.alert(message,{title:'Mi avance',icon:'✓'})}
  function openContact(contact){
    if(!contact)return false;
    if(window.APPIGestion&&window.APPIGestion.abrirContacto){window.APPIGestion.abrirContacto(contact.id);return true}
    if(typeof window.openMiGestion==='function'){window.openMiGestion();return true}
    return false;
  }
  function pickContact(list){return arr(list).find(function(c){return c&&c.id})||null}
  function openReactivation(){if(window.APPIReactivacion&&window.APPIReactivacion.abrir){window.APPIReactivacion.abrir();return true}if(typeof window.showView==='function')window.showView('view-usuarios');return false}
  function oldUserName(user){return text(user&&(user.usuario||user.nombre||user.apellido||user.cliente||'Usuario anterior')).trim()||'Usuario anterior'}
  function oldUserPhone(user){return text(user&&(user.telf||user.telefono||user.celular||''))}
  async function prepareVisit(a){
    var user=arr(a.metrics.contactableOld)[0];
    if(!user){openReactivation();return}
    var name=oldUserName(user),phone=oldUserPhone(user);
    if(!window.APPIDialog||!window.APPIDialog.confirm){openReactivation();return}
    var ok=await window.APPIDialog.confirm('Appi encontró a '+name+' entre tus usuarios anteriores.\n\n¿Querés preparar un seguimiento para proponerle una visita? Nada se guarda hasta que confirmes.',{title:'Preparar visita',icon:'⌂',okText:'Sí, preparar'});
    if(!ok)return;
    var phoneDigits=text(phone).replace(/\D/g,''),existing=arr(a.metrics.contacts).find(function(contact){return phoneDigits&&text(contactPhone(contact)).replace(/\D/g,'')===phoneDigits});
    if(existing){toast(firstName(name)+' ya está en tu panel. Abrí la ficha para elegir la fecha y confirmar el seguimiento.');openContact(existing);return}
    var tomorrow=new Date(Date.now()+DAY),defaultDate=isoDay(tomorrow);
    var date=await window.APPIDialog.prompt('Elegí la fecha del próximo contacto. Después vas a poder cambiarla desde su ficha.',defaultDate,{title:'Fecha del seguimiento',icon:'📅',inputType:'date',okText:'Crear seguimiento'});
    if(date===null)return;
    date=text(date).trim();
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)){await window.APPIDialog.alert('Elegí una fecha válida.',{title:'Fecha del seguimiento',icon:'!'});return}
    try{
      if(window.APPIGestion&&window.APPIGestion.importarPersona){
        var saved=await window.APPIGestion.importarPersona({nombre:name,telefono:phone,interes:'Visita a usuario anterior',estado:'seguimiento',notas:'Seguimiento preparado desde Mi avance para volver a acompañar a un usuario anterior.',proximo:date,localId:'avance-visita-'+hash(phone||name)});
        if(window.APPIGestion.refresh)await window.APPIGestion.refresh(false);
        registerEvent('visita_programada',isoDay()+':'+hash((phone||name)+':'+date),{nombre:name,fecha:date});
        if(saved&&saved.id&&window.APPIGestion.abrirContacto)window.APPIGestion.abrirContacto(saved.id);else if(typeof window.openMiGestion==='function')window.openMiGestion();
        toast('Seguimiento preparado para '+firstName(name)+' ✓');
      }else openReactivation();
    }catch(error){await window.APPIDialog.alert('No pudimos guardar el seguimiento. Podés abrir Usuarios anteriores y retomarlo desde ahí.',{title:'Preparar visita',icon:'!'});openReactivation()}
  }
  async function runAction(type){
    var a=analyze();
    if(type==='seguimientos'){
      var contact=pickContact(a.metrics.missing)||pickContact(a.metrics.due);
      if(contact){toast('Abrí la ficha de '+firstName(contact.nombre)+'. Elegí y guardá el próximo paso.');openContact(contact)}
      else if(typeof window.openMiGestion==='function')window.openMiGestion();
      return;
    }
    if(type==='demostraciones'){
      var candidate=pickContact(a.metrics.candidates);
      if(candidate){toast(firstName(candidate.nombre)+' tiene datos para retomar la conversación. Vos decidís si proponer una demostración.');openContact(candidate)}
      else if(typeof window.openMiGestion==='function')window.openMiGestion();
      return;
    }
    if(type==='visitas'){await prepareVisit(a);return}
    if(type==='contactos'){if(typeof window.openMargarita==='function')window.openMargarita();else if(typeof window.showView==='function')window.showView('view-margarita');return}
    if(type==='presupuestos'){if(typeof window.abrirLista==='function')window.abrirLista();else if(typeof window.openLista==='function')window.openLista();return}
  }
  function renderBusinessCard(a){
    var host=document.getElementById('negGrid');if(!host||host.querySelector('[data-apg-business]'))return;
    var next=arr(a.plan.items).find(function(i){return !i.done});
    var card='<button class="home-quick-card" type="button" data-apg-business onclick="APPIProgreso.abrir()" style="--accent:#6f62c7;--grad:linear-gradient(135deg,#0b5878,#6f62c7)"><div class="hqc-glow"></div><div class="hqc-top"><span class="hqc-icon">↗</span><span class="hqc-status pending">'+a.activeAreas+'/4</span></div><h3>Mi avance</h3><p>'+(next?esc(next.title):'Tu negocio en movimiento')+'</p><div class="hqc-progress"><i style="width:'+(a.activeAreas*25)+'%"></i></div><small>Datos reales · plan de hoy</small></button>';
    host.insertAdjacentHTML('afterbegin',card);
  }
  function refresh(){
    clearTimeout(timer);
    var a=analyze();renderHome(a);renderDetail(a);mountMascots();
    return a;
  }
  function scheduleRefresh(delay){clearTimeout(timer);timer=setTimeout(refresh,delay==null?100:delay)}
  function open(){if(typeof window.showView==='function')window.showView('view-progreso');refresh();setTimeout(function(){var el=document.getElementById('view-progreso');if(el)el.scrollTop=0},40)}
  function close(){if(typeof window.showView==='function')window.showView('view-home');if(typeof window.renderHomeCompleto==='function')window.renderHomeCompleto();scheduleRefresh(80)}
  function init(){
    refresh();
    setTimeout(refresh,900);setTimeout(refresh,2400);
    window.addEventListener('storage',function(event){if(event.key&&(/^(appi_acciones_v1_|appi_reactivacion_v1_|appi_gestion_|agenda_personal_|appi_progreso_v1_)/.test(event.key)))scheduleRefresh(80)});
    window.addEventListener('appi-datasync-applied',function(){lastKey='';store=null;scheduleRefresh(120)});
    document.addEventListener('visibilitychange',function(){if(!document.hidden)scheduleRefresh(100)});
    window.addEventListener('online',function(){scheduleRefresh(300)});
  }

  window.openMiAvance=open;
  window.APPIProgreso={
    init:init,refresh:refresh,abrir:open,cerrar:close,ejecutar:runAction,
    registrarEvento:registerEvent,registrarPresupuesto:registerBudget,
    analizar:analyze,clave:key
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
