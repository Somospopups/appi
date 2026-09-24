/* ============================================================
   APPI · Teclado a demanda + ojito en contraseñas
   ------------------------------------------------------------
   v1: el teclado del teléfono nunca se abre solo. Solo aparece
   cuando la persona toca un campo que necesita escribir. Los
   focos programáticos (login, popups, modales) no abren nada:
   si no hubo un toque real sobre ese campo, el foco se suelta.

   Además, todo campo type=password lleva su ojito 👁 para
   ver/ocultar lo que se viene escribiendo, sin importar dónde
   se cree el campo (login, admin, cuenta, PSA, Histórico…).
   ============================================================ */
(function(){
  'use strict';

  /* ---------- estilos del ojito ---------- */
  var styleEl=document.createElement('style');
  styleEl.textContent = [
    '.pw-eye-wrap{position:relative;display:block;max-width:100%;flex:1 1 auto;min-width:0}',
    '.pw-eye-wrap>input{width:100%!important;box-sizing:border-box;padding-right:46px!important;margin-bottom:0}',
    '.pw-eye-btn{position:absolute;right:6px;top:50%;transform:translateY(-50%);width:36px;height:36px;border:0;margin:0;padding:0;background:transparent!important;color:#8a8a94;display:grid;place-items:center;cursor:pointer;z-index:2;font:inherit;-webkit-tap-highlight-color:transparent}',
    '.pw-eye-btn svg{width:21px;height:21px;display:block;pointer-events:none}',
    '.pw-eye-btn:active{opacity:.55}',
    '.pw-eye-btn:focus-visible{outline:2px solid #5b8def;outline-offset:1px;border-radius:10px}',
    'body.dark .pw-eye-btn{color:#a0a0b0}',
    'body.dark .pw-eye-btn:focus-visible{outline-color:#7aa3ff}'
  ].join('\n');
  (document.head||document.documentElement).appendChild(styleEl);

  /* ---------- el teclado solo se abre si tocás el campo ---------- */
  function isCoarse(){
    try{return !!(window.matchMedia&&window.matchMedia('(pointer: coarse)').matches)}catch(e){return false}
  }
  if(isCoarse()){
    var SEL='input,textarea,select,[contenteditable="true"]';
    var tapField=null,keyField=null;
    function fieldOf(ev){
      var t=ev&&ev.target;if(!t||!t.closest)return null;
      var f=t.closest(SEL);if(f)return f;
      var lab=t.closest('label');if(!lab)return null;
      var forId=lab.getAttribute('for');
      if(forId){var lel=document.getElementById(forId);if(lel&&lel.matches&&lel.matches(SEL))return lel}
      var inner=lab.querySelector(SEL);if(inner)return inner;
      return null;
    }
    function capture(type,fn){document.addEventListener(type,fn,true)}
    capture('pointerdown',function(e){tapField=fieldOf(e)});
    capture('keydown',function(e){keyField=fieldOf(e)});
    capture('focusin',function(e){
      var tap=tapField,key=keyField;tapField=null;keyField=null;
      var t=e.target;if(!t||t.nodeType!==1)return;
      var f=t.closest?t.closest(SEL):null;if(!f)return;
      var ok=tap&&(f===tap||f.contains(tap)||tap.contains(f));
      // Con teclado físico (Enter/Tab entre campos) el foco sigue siendo del usuario.
      if(!ok&&key&&key!==t&&key.matches&&key.matches(SEL)&&f.matches(SEL))ok=true;
      if(!ok){try{t.blur()}catch(err){}}
    });
  }

  /* ---------- ojito en TODO campo de contraseña ---------- */
  var EYE_ON='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>';
  var EYE_OFF='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';

  function wrap(input){
    if(!input||input.dataset.pwEye==='1')return;
    input.dataset.pwEye='1';
    var parent=input.parentNode;if(!parent)return;
    var box=document.createElement('span');
    box.className='pw-eye-wrap';
    parent.insertBefore(box,input);
    box.appendChild(input);
    var btn=document.createElement('button');
    btn.type='button';
    btn.className='pw-eye-btn';
    btn.setAttribute('aria-label','Mostrar contraseña');
    btn.title='Mostrar contraseña';
    btn.innerHTML=EYE_ON;
    box.appendChild(btn);
    btn.addEventListener('click',function(ev){
      ev.preventDefault();
      var show=input.type==='password';
      input.type=show?'text':'password';
      btn.innerHTML=show?EYE_OFF:EYE_ON;
      btn.setAttribute('aria-label',show?'Ocultar contraseña':'Mostrar contraseña');
      btn.title=btn.getAttribute('aria-label');
      try{
        var len=input.value.length;
        if(input.setSelectionRange)input.setSelectionRange(len,len);
      }catch(err){}
    });
  }
  function scan(){
    var list=document.querySelectorAll('input[type="password"]');
    for(var i=0;i<list.length;i++){try{wrap(list[i])}catch(e){}}
  }
  function boot(){
    scan();
    try{
      if(window.MutationObserver){
        var mo=new MutationObserver(function(){scan()});
        mo.observe(document.documentElement,{childList:true,subtree:true});
      }
    }catch(e){}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
  else boot();
  setTimeout(scan,1200);
  setTimeout(scan,4000);
})();