/* APPI · Acompañar al Nuevo v701 — hábitos sin valores fijos en pesos
   Hábitos: buscar nuevos USUARIOS, pedir referidos, llamados, demostraciones (purificador), presentaciones de negocio
   PB son del DISTRIBUIDOR, USUARIO es cliente con purificador. Prefiltro vs purificador vs plan canje respetado.
*/
(function(){
  'use strict';
  const HABITOS = [
    {id:'buscar', icono:'🔍', nombre:'Buscar nuevos USUARIOS', desc:'Agregar personas a tu lista / hablar con alguien nuevo', meta:'Hábito diario'},
    {id:'referidos', icono:'🗣️', nombre:'Pedir referidos', desc:'Pedir 2-3 contactos a cada USUARIO contento', meta:'Multiplica tu lista'},
    {id:'llamados', icono:'📞', nombre:'Hacer llamados', desc:'Llamar o mensajear para agendar', meta:'Contacto real'},
    {id:'demos', icono:'💧', nombre:'Demostraciones', desc:'Demostración del purificador al USUARIO', meta:'Donde se ve el valor'},
    {id:'presentaciones', icono:'💼', nombre:'Presentaciones de negocio', desc:'Presentar la Carrera Empresarial a un posible DISTRIBUIDOR', meta:'Construís equipo'}
  ];
  const KEY_PREFIX = 'appi_nuevo_habitos_';
  function hoyKey(){ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
  function loadDia(key){ try{ return JSON.parse(localStorage.getItem(KEY_PREFIX+key)||'null') || {}; }catch(e){ return {}; } }
  function saveDia(key, data){ try{ localStorage.setItem(KEY_PREFIX+key, JSON.stringify(data)); }catch(e){} }
  function getStreak(){
    let c=0; const d=new Date();
    for(let i=0;i<60;i++){
      const k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
      const data=loadDia(k);
      const hecho=HABITOS.every(h=> !!data[h.id]);
      if(hecho) c++; else if(i===0) {} else break;
      d.setDate(d.getDate()-1);
      if(i>0 && c===0 && !hecho && i>1) break;
      if(i===0 && !hecho) continue;
      if(!hecho && c>0) break;
    }
    // simpler: count consecutive days from today backwards where all 5 done
    let streak=0; let cur=new Date();
    for(let i=0;i<90;i++){
      const k=cur.getFullYear()+'-'+String(cur.getMonth()+1).padStart(2,'0')+'-'+String(cur.getDate()).padStart(2,'0');
      const data=loadDia(k);
      const allDone=HABITOS.every(h=> !!data[h.id]);
      if(allDone) streak++;
      else if(i===0) { /* today not done yet, check yesterday */ }
      else break;
      cur.setDate(cur.getDate()-1);
      if(streak===0 && i>0) break;
    }
    // recalc correctly: if today not complete, streak is from yesterday
    let s=0; let dd=new Date(); const todayData=loadDia(hoyKey()); const todayAll=HABITOS.every(h=> !!todayData[h.id]);
    if(!todayAll) dd.setDate(dd.getDate()-1);
    for(let i=0;i<90;i++){
      const k=dd.getFullYear()+'-'+String(dd.getMonth()+1).padStart(2,'0')+'-'+String(dd.getDate()).padStart(2,'0');
      const data=loadDia(k);
      if(HABITOS.every(h=> !!data[h.id])) s++; else break;
      dd.setDate(dd.getDate()-1);
    }
    return s;
  }
  function syncHome(){
    try{
      const key=hoyKey(); const data=loadDia(key);
      const hechos=HABITOS.filter(h=> !!data[h.id]).length;
      const pct=Math.round(hechos/HABITOS.length*100);
      const el=document.getElementById('homeNuevoPct'); if(el) el.textContent=hechos+'/5';
      const bar=document.getElementById('homeNuevoBar'); if(bar) bar.style.width=pct+'%';
    }catch(e){}
  }
  function render(){ syncHome();
    const host=document.getElementById('nuevoHabitosList');
    if(!host) return;
    const key=hoyKey();
    const data=loadDia(key);
    const hechos=HABITOS.filter(h=> !!data[h.id]).length;
    const pct=Math.round(hechos/HABITOS.length*100);
    const streak=getStreak();
    // header stats
    const pctEl=document.getElementById('nuevoPct');
    if(pctEl) pctEl.textContent=pct+'%';
    const bar=document.getElementById('nuevoBarFill');
    if(bar) bar.style.width=pct+'%';
    const streakEl=document.getElementById('nuevoStreak');
    if(streakEl) streakEl.textContent= streak ? streak + ' días 🔥' : '—';
    const hechoEl=document.getElementById('nuevoHechos');
    if(hechoEl) hechoEl.textContent=hechos+' / '+HABITOS.length;

    host.innerHTML=HABITOS.map(h=>{
      const done=!!data[h.id];
      return `<button type="button" class="nuevo-habito ${done?'done':''}" data-habito="${h.id}" aria-pressed="${done?'true':'false'}">
        <span class="nh-check">${done?'✓':'○'}</span>
        <span class="nh-ico">${h.icono}</span>
        <span class="nh-text"><b>${h.nombre}</b><small>${h.desc}</small></span>
        <span class="nh-meta">${h.meta}</span>
      </button>`;
    }).join('');

    syncHome();
    host.querySelectorAll('[data-habito]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const id=btn.getAttribute('data-habito');
        const d=loadDia(key);
        d[id]=!d[id];
        d._ts=Date.now();
        saveDia(key,d);
        // evento para Tu Mes / cerebro
        try{
          if(window.APPIEventos && typeof window.APPIEventos.emit==='function'){
            window.APPIEventos.emit({tipo:'accion', origen:'nuevo-habito', titulo: (d[id]?'✓ ':'') + id, detalle: HABITOS.find(x=>x.id===id)?.nombre||id, dia:key, ts:Date.now()});
          }
        }catch(e){}
        render();
        try{ if(typeof window.showToast==='function') window.showToast(d[id] ? '¡Hecho! '+ HABITOS.find(x=>x.id===id).nombre : 'Desmarcado'); }catch(e){}
      });
    });

    // historial 7 días
    const hist=document.getElementById('nuevoHist');
    if(hist){
      let html='';
      for(let i=6;i>=0;i--){
        const d=new Date(); d.setDate(d.getDate()-i);
        const k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
        const dd=loadDia(k);
        const c=HABITOS.filter(h=> !!dd[h.id]).length;
        const isToday=k===key;
        html+=`<div class="nh-day ${isToday?'today':''}"><span>${d.toLocaleDateString('es-AR',{weekday:'short'}).replace('.','')} ${d.getDate()}</span><div class="nh-dots">${HABITOS.map(h=> `<i class="${dd[h.id]?'on':''}" title="${h.nombre}"></i>`).join('')}</div><b>${c}/5</b></div>`;
      }
      hist.innerHTML=html;
    }
  }

  function init(){
    render();
    // actualizar si cambia fecha a medianoche
    setInterval(render, 60000);
  }

  window.APPINuevoHabitos={render, HABITOS, hoyKey, loadDia, saveDia};
  document.addEventListener('DOMContentLoaded', init);
  setTimeout(init, 800);

  window.openNuevo=function(){
    if(typeof window.showView==='function') window.showView('view-nuevo');
    setTimeout(render, 100);
  };
})();
