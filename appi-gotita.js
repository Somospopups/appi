/* APPI v910 · La gotita Appi, personaje vectorial animado.
   Dibujo propio en SVG: no usa imágenes ni servicios externos.
   Cada parte (cuerpo, ojos, párpados, boca, brazos, pies, burbujas) es un
   nodo independiente que se anima con CSS según el estado. */
(function(){
  'use strict';

  const STATES=new Set(['normal','thinking','happy','surprise','alert']);
  const GOTA='M120,38 C120,38 54,108 54,148 a66,66 0 0 0 132,0 C186,108 120,38 120,38 Z';

  function svg(){
    return ''
    +'<svg class="go" data-state="normal" viewBox="0 0 240 240" role="img" aria-hidden="true" focusable="false">'
    +  '<defs>'
    +    '<clipPath id="GoClip"><path d="'+GOTA+'"/></clipPath>'
    +  '</defs>'

    /* sombra en el piso */
    +  '<ellipse class="go-shadow" cx="120" cy="227" rx="46" ry="8" fill="#15365b" opacity=".14"/>'

    /* pies (detrás del cuerpo) */
    +  '<g class="go-feet">'
    +    '<ellipse class="go-foot go-foot-l" cx="104" cy="209" rx="14" ry="8.5" stroke="#123c63" stroke-width="6"/>'
    +    '<ellipse class="go-foot go-foot-r" cx="136" cy="209" rx="14" ry="8.5" stroke="#123c63" stroke-width="6"/>'
    +  '</g>'

    /* brazos (detrás del cuerpo, asoman a los costados) */
    +  '<g class="go-arms">'
    +    '<g class="go-arm go-arm-l"><ellipse class="go-arm-shape go-arm-shape-l" cx="52" cy="168" rx="20" ry="11" stroke="#123c63" stroke-width="6"/></g>'
    +    '<g class="go-arm go-arm-r"><ellipse class="go-arm-shape go-arm-shape-r" cx="190" cy="146" rx="19" ry="10.5" stroke="#123c63" stroke-width="6"/></g>'
    +  '</g>'

    /* cuerpo: la gota */
    +  '<g class="go-body">'
    +    '<path class="go-drop" d="'+GOTA+'" stroke="#123c63" stroke-width="7" stroke-linejoin="round"/>'
    +    '<g clip-path="url(#GoClip)">'
    +      '<circle class="go-shine2" cx="147" cy="86" r="5" fill="#ffffff" opacity=".75"/>'
    /* burbujitas de agua que suben por dentro */
    +      '<g class="go-drops">'
    +        '<circle class="go-bubble" cx="98" cy="198" r="3.6" fill="#ffffff" opacity=".85"/>'
    +        '<circle class="go-bubble" cx="134" cy="206" r="2.6" fill="#ffffff" opacity=".8"/>'
    +        '<circle class="go-bubble" cx="117" cy="211" r="2" fill="#ffffff" opacity=".75"/>'
    +      '</g>'
    +      '<ellipse class="go-gloss" cx="120" cy="216" rx="52" ry="16" fill="#123c63" opacity=".10"/>'
    +    '</g>'

    /* cara */
    +    '<g class="go-face">'
    +      '<g class="go-brows">'
    +        '<path class="go-brow go-brow-l" d="M89,123 q11,-8 22,-2" fill="none" stroke="#123c63" stroke-width="4.6" stroke-linecap="round"/>'
    +        '<path class="go-brow go-brow-r" d="M129,121 q11,-6 22,2" fill="none" stroke="#123c63" stroke-width="4.6" stroke-linecap="round"/>'
    +      '</g>'
    +      '<g class="go-eyes">'
    +        '<g class="go-eye go-eye-l">'
    +          '<ellipse cx="101" cy="150" rx="15.5" ry="17.5" fill="#ffffff"/>'
    +          '<g class="go-pupil">'
    +            '<ellipse cx="102" cy="151" rx="10.5" ry="11.5" fill="#16213c"/>'
    +            '<circle cx="99" cy="147" r="3.7" fill="#ffffff"/>'
    +            '<circle cx="106" cy="156" r="1.9" fill="#ffffff" opacity=".9"/>'
    +          '</g>'
    +        '</g>'
    +        '<g class="go-eye go-eye-r">'
    +          '<ellipse cx="139" cy="150" rx="15.5" ry="17.5" fill="#ffffff"/>'
    +          '<g class="go-pupil">'
    +            '<ellipse cx="138" cy="151" rx="10.5" ry="11.5" fill="#16213c"/>'
    +            '<circle cx="135" cy="147" r="3.7" fill="#ffffff"/>'
    +            '<circle cx="142" cy="156" r="1.9" fill="#ffffff" opacity=".9"/>'
    +          '</g>'
    +        '</g>'
    +      '</g>'
    +      '<g class="go-happy-eyes">'
    +        '<path d="M90,155 q11,-16 22,0" fill="none" stroke="#16213c" stroke-width="6" stroke-linecap="round"/>'
    +        '<path d="M128,155 q11,-16 22,0" fill="none" stroke="#16213c" stroke-width="6" stroke-linecap="round"/>'
    +      '</g>'
    +      '<g class="go-cheeks">'
    +        '<ellipse class="go-cheek" cx="75" cy="175" rx="10" ry="6" fill="#ff9fb4" opacity=".8"/>'
    +        '<ellipse class="go-cheek" cx="165" cy="175" rx="10" ry="6" fill="#ff9fb4" opacity=".8"/>'
    +      '</g>'
    +      '<g class="go-mouth">'
    +        '<path class="go-smile" d="M111,175 q9,10 18,0" fill="none" stroke="#123c63" stroke-width="4.6" stroke-linecap="round"/>'
    +        '<g class="go-open">'
    +          '<ellipse class="go-open-in" cx="120" cy="179" rx="9" ry="10.5" fill="#123c63"/>'
    +          '<ellipse cx="120" cy="185" rx="6" ry="5" fill="#ff8fa8" opacity=".9"/>'
    +        '</g>'
    +      '</g>'
    +    '</g>'
    +  '</g>'

    /* efectos: pensamientos, destellos, ondas, admiración, escucha, salpicadura */
    +  '<g class="go-fx">'
    +    '<g class="go-thoughts">'
    +      '<circle class="go-thought" cx="176" cy="84" r="6" fill="#ffffff" stroke="#7f74c8" stroke-width="3.4"/>'
    +      '<circle class="go-thought" cx="196" cy="60" r="9" fill="#ffffff" stroke="#7f74c8" stroke-width="3.4"/>'
    +      '<circle class="go-thought" cx="216" cy="30" r="13" fill="#ffffff" stroke="#7f74c8" stroke-width="3.4"/>'
    +    '</g>'
    +    '<g class="go-sparkles" fill="#38b894">'
    +      '<path class="go-spark" d="M46,84 l3.4,8.2 8.2,3.4 -8.2,3.4 -3.4,8.2 -3.4,-8.2 -8.2,-3.4 8.2,-3.4 Z"/>'
    +      '<path class="go-spark" d="M198,116 l2.8,6.8 6.8,2.8 -6.8,2.8 -2.8,6.8 -2.8,-6.8 -6.8,-2.8 6.8,-2.8 Z"/>'
    +      '<path class="go-spark" d="M170,48 l2.4,5.8 5.8,2.4 -5.8,2.4 -2.4,5.8 -2.4,-5.8 -5.8,-2.4 5.8,-2.4 Z"/>'
    +    '</g>'
    +    '<g class="go-splash" fill="#6ec2f5" stroke="#123c63" stroke-width="2.6">'
    +      '<circle class="go-dropbit" cx="82" cy="212" r="4.4"/>'
    +      '<circle class="go-dropbit" cx="120" cy="216" r="3.4"/>'
    +      '<circle class="go-dropbit" cx="158" cy="212" r="4"/>'
    +    '</g>'
    +    '<circle class="go-ring" cx="120" cy="146" r="82" fill="none" stroke="#4b93e0" stroke-width="4"/>'
    +    '<g class="go-bang">'
    +      '<rect x="196" y="26" width="11" height="30" rx="5.5" fill="#e5a036"/>'
    +      '<circle cx="201.5" cy="66" r="6" fill="#e5a036"/>'
    +    '</g>'
    +    '<g class="go-listen" fill="none" stroke="#4b93e0" stroke-width="5" stroke-linecap="round">'
    +      '<path d="M196,126 q10,14 0,28"/>'
    +      '<path d="M210,118 q16,22 0,44"/>'
    +      '<path d="M224,110 q22,30 0,60"/>'
    +    '</g>'
    +  '</g>'
    +'</svg>';
  }

  function mount(host){
    if(!host)return null;
    const existing=host.querySelector('svg.go');
    if(existing)return existing;
    host.innerHTML=svg();
    return host.querySelector('svg.go');
  }

  function node(host){
    if(!host)return null;
    return host.tagName==='svg'?host:host.querySelector('svg.go');
  }

  /* El cuerpo se aplasta un instante al cambiar de estado: el cambio se
     siente líquido en vez de ser un corte seco. */
  let switchTimer=0;
  function pop(host){
    const go=node(host);if(!go)return;
    clearTimeout(switchTimer);
    go.classList.remove('is-switch');
    void go.offsetWidth;
    go.classList.add('is-switch');
    switchTimer=setTimeout(()=>go.classList.remove('is-switch'),280);
  }

  function setState(host,state){
    const go=node(host);if(!go)return null;
    const next=STATES.has(state)?state:'normal';
    const changed=go.dataset.state!==next;
    go.dataset.state=next;
    if(changed)pop(go);
    return go.dataset.state;
  }

  function toggle(host,flag,on){
    const go=node(host);if(!go)return;
    if(on===undefined)go.classList.toggle(flag);
    else go.classList.toggle(flag,!!on);
  }

  /* La boca se mueve sílabas mientras Appi lee en voz alta. */
  function setTalking(host,on){toggle(host,'is-talking',on)}
  function setListening(host,on){toggle(host,'is-listening',on)}
  /* Parpadeo suelto (además del automático del CSS). */
  function blink(host,ms){
    const go=node(host);if(!go)return;
    go.classList.remove('is-blinking');
    void go.offsetWidth;
    go.classList.add('is-blinking');
    setTimeout(()=>go.classList.remove('is-blinking'),ms||420);
  }

  window.APPIGotita={
    markup:svg,mount,setState,setTalking,setListening,blink,pop,
    get states(){return Array.from(STATES)}
  };
})();
