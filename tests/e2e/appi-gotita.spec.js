const { test, expect } = require('@playwright/test');

// v904: la gotita dejó de ser cinco fotos WebP que se movían.
// Ahora es un dibujo vectorial cuyas piezas (cuerpo, ojos, párpados, pupilas,
// cejas, boca, brazos, pies y efectos) se animan de verdad con CSS.
// Estas pruebas cuidan eso: que sea dibujo, que cada estado mueva cosas
// distintas, que parpadee, que hable con la boca y que ninguna pieza se
// despegue del cuerpo (el bug de transform-origin de la v904 beta).

const USER_ID='33333333-3333-4333-8333-333333333333';
const hoy=(()=>{const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)})();
const CONTACTOS=[
  {id:'g1',estado:'seguimiento',nombre:'Marta Solís',telefono:'3515551001',telefono_normalizado:'3515551001',tipo:'contacto',proximo_contacto:hoy,created_at:new Date().toISOString(),updated_at:new Date().toISOString()}
];
function tokenFor(sub){const h=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');const p=Buffer.from(JSON.stringify({sub,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url');return `${h}.${p}.firma`}

async function entrar(page){
  await page.setViewportSize({width:390,height:840});
  const accessToken=tokenFor(USER_ID),now=new Date().toISOString();
  const profile={user_id:USER_ID,username:null,dip:'02-9802014',sucursal:'02',numero_distribuidor:'9802014',nombre:'María Pérez',socio_nombre:null,rol:'usuario',activo:true,debe_cambiar_password:false,membresia_meses:1,membresia_inicio:now,membresia_vence:new Date(Date.now()+30*86400000).toISOString()};
  await page.route('**/auth-config.js',route=>route.fulfill({contentType:'application/javascript',body:"window.APPI_AUTH={enabled:true,url:'https://mock.supabase.co',anonKey:'anon-key-publica-de-prueba',distributorEmailDomain:'distribuidores.appi.invalid',adminLogin:{username:'popups',email:'admin@appi.invalid'},loginAliases:{},offlineDays:7};"}));
  await page.route('https://mock.supabase.co/**',route=>{const url=new URL(route.request().url());const headers={'access-control-allow-origin':'*','content-type':'application/json'};if(url.pathname==='/auth/v1/token')return route.fulfill({status:200,headers,body:JSON.stringify({access_token:accessToken,refresh_token:'r',expires_in:3600,user:{id:USER_ID}})});if(url.pathname==='/rest/v1/appi_perfiles')return route.fulfill({status:200,headers,body:JSON.stringify([profile])});if(url.pathname==='/functions/v1/dispositivo-puente')return route.fulfill({status:200,headers,body:JSON.stringify({devices:[]})});if(url.pathname==='/rest/v1/appi_gestion_contactos'&&route.request().method()==='GET')return route.fulfill({status:200,headers,body:JSON.stringify(CONTACTOS)});return route.fulfill({status:200,headers,body:'[]'})});
  await page.addInitScript(([uid,contacts])=>{
    localStorage.setItem('welcomeSeen','1');localStorage.setItem('tutoVisto_v2','1');localStorage.setItem('appi_tarjetas_auto','0');localStorage.setItem('appi_notif_listo_v1','1');localStorage.setItem('appi_notif_popup_later',String(Date.now()+400*86400000));localStorage.setItem('appi_aviso_psa_off','1');localStorage.setItem('equipoData',JSON.stringify({titular:{dip:'02-9802014',nombre:'María Pérez',categoria:'DC'},personas:[]}));localStorage.setItem(`appi_gestion_cache_v1_${uid}`,JSON.stringify({contacts,surveys:[],activities:[],savedAt:Date.now()}));localStorage.setItem(`appi_todo_parque_v1_${uid}`,'1');
  },[USER_ID,CONTACTOS]);
  await page.goto('/index.html',{waitUntil:'networkidle'});
  await page.locator('#distributorInput').fill('02-9802014');await page.locator('#distributorPassword').fill('Clave1234');await page.locator('#btnDistributorLogin').click();
  await expect(page.locator('#lockScreen')).toHaveClass(/hidden/);
  // La gotita se arma antes de que la app termine de cargar: hay que esperar
  // a que Appi esté lista y visible, como la ve la persona.
  await page.waitForFunction(()=>window.APPIGotita&&document.querySelector('#appiGotita svg.go')&&document.getElementById('appiAssistant').dataset.ready==='true');
  await expect(page.locator('#appiAssistant')).toBeVisible();
  // La gotita vive adentro de la caja de Appi: se abre con el círculo del «?».
  await page.locator('.appi-help-btn:visible').first().click();
  await expect(page.locator('#appiAssistant')).toHaveClass(/appi-open/);
  await expect(page.locator('#appiGotita')).toBeVisible();
}

const LEER_PIEZAS=()=>{
  const go=document.querySelector('#appiGotita svg.go');
  const anim=sel=>{const el=go.querySelector(sel);return el?getComputedStyle(el).animationName:null};
  return {
    estado:go.dataset.state,
    body:anim('.go-body'),eyes:anim('.go-eyes'),arm:anim('.go-arm-r'),
    shadow:anim('.go-shadow'),thinks:anim('.go-thought'),bang:anim('.go-bang'),
    piezas:go.querySelectorAll('.go-body,.go-eyes,.go-pupil,.go-mouth,.go-arm,.go-foot,.go-brow,.go-cheek').length
  };
};

test('la gotita es un dibujo vectorial con piezas propias, no una foto que se mueve', async ({ page }) => {
  const pedidos = [];
  page.on('request', req => { if (/assets\/appi\//.test(req.url())) pedidos.push(req.url()); });
  await entrar(page);

  await expect(page.locator('#appiGotita svg.go')).toHaveCount(1);
  await expect(page.locator('#appiAssistant img')).toHaveCount(0);

  // Cada parte del personaje existe como nodo del dibujo.
  for (const sel of ['.go-drop', '.go-eyes', '.go-pupil', '.go-brow', '.go-mouth', '.go-smile', '.go-open', '.go-cheek', '.go-thought', '.go-spark', '.go-ring', '.go-bang', '.go-listen'])
    await expect(page.locator('#appiGotita ' + sel).first(), `falta ${sel}`).toBeAttached();
  await expect(page.locator('#appiGotita .go-arm')).toHaveCount(2);
  await expect(page.locator('#appiGotita .go-foot')).toHaveCount(2);
  await expect(page.locator('#appiGotita .go-eye')).toHaveCount(2);

  // No se descarga ninguna imagen de la gotita.
  expect(pedidos, `la gotita pidió imágenes: ${pedidos.join(', ')}`).toEqual([]);
});

test('cada estado mueve piezas distintas y el dibujo no cambia de tamaño', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await entrar(page);
  // Sin saludos automáticos: se miden los estados, no el saludo.
  await page.evaluate(() => window.APPIAssistant.saludos(false));

  const estados = ['normal', 'thinking', 'happy', 'surprise', 'alert'];
  const mapa = {}, cajas = [];
  for (const estado of estados) {
    await page.evaluate(e => window.APPIAssistant.setState(e), estado);
    // Al cambiar de estado hay un aplaste de entrada de 280 ms: se espera a
    // que termine para leer la animación propia del estado.
    await page.waitForTimeout(360);
    mapa[estado] = await page.evaluate(LEER_PIEZAS);
    cajas.push(await page.locator('#appiGotita').evaluate(el => { const r = el.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }));
  }

  for (const estado of estados) {
    expect(mapa[estado].estado, `${estado} no llegó al dibujo`).toBe(estado);
    expect(mapa[estado].piezas, 'el personaje perdió piezas').toBeGreaterThanOrEqual(13);
    // Cada estado mueve al menos el cuerpo y otra pieza.
    expect(mapa[estado].body, `${estado} no anima el cuerpo`).not.toBe('none');
    expect([mapa[estado].eyes, mapa[estado].arm, mapa[estado].shadow].filter(a => a && a !== 'none').length, `${estado} apenas se mueve`).toBeGreaterThanOrEqual(1);
  }

  // Los cinco cuerpos se animan distinto: no es la misma animación con otro nombre.
  expect(new Set(estados.map(e => mapa[e].body)).size).toBe(5);
  expect(new Set(estados.map(e => mapa[e].arm)).size).toBe(5);

  // Pensar, sorprenderse y alertar encienden sus propios efectos.
  expect(mapa.thinking.thinks).not.toBe('none');
  expect(mapa.surprise.bang).not.toBe('none');
  expect(mapa.alert.bang).not.toBe('none');

  // El dibujo ocupa siempre el mismo lugar: ninguna animación mueve el layout.
  expect(new Set(cajas.map(c => c.join('x'))).size).toBe(1);
});

test('en reposo respira y parpadea de verdad', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await entrar(page);
  await page.evaluate(() => window.APPIAssistant.setState('normal'));

  // Se mide el párpado: la escala vertical de los ojos tiene que bajar y volver.
  const parpadeo = await page.evaluate(async () => {
    const ojos = document.querySelector('#appiGotita .go-eyes');
    let min = 1, max = 0;
    const t0 = performance.now();
    while (performance.now() - t0 < 6800) {
      const m = new DOMMatrixReadOnly(getComputedStyle(ojos).transform);
      min = Math.min(min, m.d); max = Math.max(max, m.d);
      await new Promise(r => requestAnimationFrame(r));
    }
    return { min, max };
  });
  expect(parpadeo.min, 'los ojos nunca se cerraron').toBeLessThan(0.25);
  expect(parpadeo.max, 'los ojos nunca volvieron a abrirse').toBeGreaterThan(0.9);

  // Y el cuerpo respira: la transformación cambia sola con el tiempo.
  const cuerpos = await page.evaluate(async () => {
    const cuerpo = document.querySelector('#appiGotita .go-body');
    const leer = () => getComputedStyle(cuerpo).transform;
    const a = leer(); await new Promise(r => setTimeout(r, 420)); const b = leer();
    return [a, b];
  });
  expect(cuerpos[0]).not.toBe(cuerpos[1]);
});

test('la boca se mueve mientras Appi lee y se detiene al tocarla de nuevo', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  // Voz simulada: avisa cuándo arranca y cuándo termina, sin sonido real.
  await page.addInitScript(() => {
    class VozFalsa { constructor(texto) { this.text = texto; } }
    const hablar = {
      speaking: false,
      cancel() { this.speaking = false; },
      speak(u) { this.speaking = true; if (u.onstart) u.onstart(); window.__terminarLectura = () => { this.speaking = false; if (u.onend) u.onend(); }; }
    };
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: VozFalsa });
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: hablar });
  });
  await entrar(page);
  await page.evaluate(() => window.APPIAssistant.ask('Hola'));
  await expect(page.locator('#appiPanelTitle')).toHaveText('¡Hola!');
  await expect(page.locator('#appiSpeak')).toHaveText(/Escuchar/);

  await page.locator('#appiSpeak').click();
  const go = page.locator('#appiGotita svg.go');
  await expect(go).toHaveClass(/is-talking/);
  await expect(page.locator('#appiSpeak')).toHaveText(/Detener/);
  const boca = await page.locator('#appiGotita .go-open-in').evaluate(el => getComputedStyle(el).animationName);
  expect(boca).toBe('goTalk');

  await page.evaluate(() => window.__terminarLectura());
  await expect(go).not.toHaveClass(/is-talking/);
  await expect(page.locator('#appiSpeak')).toHaveText(/Escuchar/);

  // Y desde el panel también se puede cortar la lectura.
  await page.locator('#appiSpeak').click();
  await expect(go).toHaveClass(/is-talking/);
  await page.evaluate(() => window.APPIAssistant.stopSpeaking());
  await expect(go).not.toHaveClass(/is-talking/);
});

test('mientras escucha muestra las ondas y no queda escuchando sola', async ({ page }) => {
  await page.addInitScript(() => {
    const Falsa = class {
      start() { this.onstart && this.onstart(); window.__cortar = () => { this.onend && this.onend(); }; }
      abort() { this.onend && this.onend(); }
    };
    window.SpeechRecognition = Falsa; window.webkitSpeechRecognition = Falsa;
  });
  await entrar(page);
  await page.locator('.appi-help-btn:visible').first().click();
  await expect(page.locator('#appiAssistant')).toHaveClass(/appi-open/);
  await page.locator('#appiMic').click();
  const go = page.locator('#appiGotita svg.go');
  await expect(go).toHaveClass(/is-listening/);
  const onda = await page.locator('#appiGotita .go-listen path').first().evaluate(el => getComputedStyle(el).animationName);
  expect(onda).toBe('goListen');

  await page.evaluate(() => window.__cortar());
  await expect(go).not.toHaveClass(/is-listening/);
});

test('ninguna pieza se despega del cuerpo', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await entrar(page);
  for (const estado of ['normal', 'thinking', 'happy', 'surprise', 'alert']) {
    await page.evaluate(e => window.APPIAssistant.setState(e), estado);
    await page.waitForTimeout(140);
    const m = await page.evaluate(() => {
      const go = document.querySelector('#appiGotita svg.go');
      const caja = sel => { const r = go.querySelector(sel).getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom }; };
      return { cuerpo: caja('.go-drop'), brazoL: caja('.go-arm-l'), brazoR: caja('.go-arm-r'), ojoL: caja('.go-eye-l'), ojoR: caja('.go-eye-r'), boca: caja('.go-mouth'), shell: caja('.go-fx') };
    });
    expect(m.brazoL.r, `${estado}: el brazo izquierdo se soltó`).toBeGreaterThan(m.cuerpo.l + 2);
    expect(m.brazoR.l, `${estado}: el brazo derecho se soltó`).toBeLessThan(m.cuerpo.r - 2);
    // Los ojos y la boca quedan dentro de la cara.
    expect(m.ojoL.l).toBeGreaterThan(m.cuerpo.l);
    expect(m.ojoR.r).toBeLessThan(m.cuerpo.r);
    expect(m.boca.t).toBeGreaterThan(m.ojoL.t);
    expect(m.boca.b).toBeLessThan(m.cuerpo.b);
  }
});

test('con movimiento reducido queda quieta, entera y visible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await entrar(page);
  for (const estado of ['normal', 'thinking', 'happy', 'surprise', 'alert']) {
    await page.evaluate(e => window.APPIAssistant.setState(e), estado);
    const mov = await page.evaluate(() => {
      const go = document.querySelector('#appiGotita svg.go');
      return Array.from(go.querySelectorAll('*')).map(el => getComputedStyle(el).animationName).filter(n => n && n !== 'none');
    });
    expect(mov, `${estado}: sigue animando con movimiento reducido`).toEqual([]);
  }
  const caja = await page.locator('#appiGotita .go-drop').evaluate(el => el.getBoundingClientRect().width);
  expect(caja).toBeGreaterThan(30);
});
