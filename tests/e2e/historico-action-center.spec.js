const { test, expect } = require('@playwright/test');
const fs = require('fs');

const periods = [
  {
    id:'2026-01',year:2026,month:0,label:'Enero 2026',
    summary:{pbPersonal:240,people:2,active:2,activePct:100,pending:1,expired:0,expiredPct:0,incomeCount:0,incomeNoPurchase:0,incomeContactIncomplete:0,branches:[{key:'ana',name:'Ana',pb:200,people:1},{key:'beto',name:'Beto',pb:40,people:1}]},
    people:[
      {key:'ana',matchKey:'c:01-1',codigo:'01-1',nombre:'Ana Pérez',cat:'L',pnAct:200,totalPB:200,teamPB:0,branchKey:'ana',parentKey:'',tel:'3515551111',garantias:{pendientes:0,vencidas:0}},
      {key:'beto',matchKey:'c:01-2',codigo:'01-2',nombre:'Beto Ruiz',cat:'D',pnAct:40,totalPB:40,teamPB:0,branchKey:'beto',parentKey:'',tel:'',garantias:{pendientes:1,vencidas:0}}
    ],
    incomes:[]
  },
  {
    id:'2026-02',year:2026,month:1,label:'Febrero 2026',
    summary:{pbPersonal:80,people:2,active:1,activePct:50,pending:4,expired:2,expiredPct:50,incomeCount:1,incomeNoPurchase:1,incomeContactIncomplete:1,branches:[{key:'ana',name:'Ana',pb:80,people:1},{key:'beto',name:'Beto',pb:0,people:1}]},
    people:[
      {key:'ana',matchKey:'c:01-1',codigo:'01-1',nombre:'Ana Pérez',cat:'L',pnAct:80,totalPB:80,teamPB:0,branchKey:'ana',parentKey:'',tel:'3515551111',garantias:{pendientes:1,vencidas:0}},
      {key:'beto',matchKey:'c:01-2',codigo:'01-2',nombre:'Beto Ruiz',cat:'D',pnAct:0,totalPB:0,teamPB:0,branchKey:'beto',parentKey:'',tel:'',garantias:{pendientes:3,vencidas:2}}
    ],
    incomes:[{matchKey:'c:01-2',linkedPersonKey:'beto',dip:'01-2',nombre:'Beto Ruiz',cat:'D',telefono:'',compraPosterior:false,contactoCompleto:false}]
  }
];

async function app(page) {
  await page.goto('/index.html', { waitUntil:'domcontentloaded' });
  await page.waitForFunction(() => window.__APPI_HISTORICO__?.affectedForStrategy && window.APPIGestion?.programarDesdeHistorico);
}

test('las estrategias usan tipos estables y pb_drop detecta y excluye correctamente', async ({ page }) => {
  await app(page);
  const result = await page.evaluate(data => {
    const api=window.__APPI_HISTORICO__;
    const strategies=api.buildStrategies(data);
    const affected=api.affectedForStrategy({type:'pb_drop'},data);
    return {types:strategies.map(item=>item.type),affected};
  }, periods);
  expect(result.types).toContain('pb_drop');
  expect(result.types).toContain('active_drop');
  expect(result.types).toContain('pending');
  expect(result.types).toContain('income_no_purchase');
  expect(result.types).toContain('contact_incomplete');
  expect(result.types).toContain('branch_balance');
  expect(result.types).toContain('expired');
  expect(result.affected.map(item=>item.person)).toEqual(['Ana Pérez','Beto Ruiz']);
  expect(result.affected.find(item=>item.person==='Ana Pérez').difference).toBe(-120);
  expect(result.affected.find(item=>item.person==='Beto Ruiz').hasPhone).toBe(false);
});

test('el resumen principal explica qué hacer hoy y muestra sus cuatro indicadores', async ({ page }) => {
  await app(page);
  await page.evaluate(data => {
    const api=window.__APPI_HISTORICO__;
    api.state.periods=data;
    api.state.actionPlans=[];
    const host=document.createElement('main');host.id='actionSummaryTest';
    host.innerHTML=api.renderActionSummary(api.buildStrategies(data));
    document.body.innerHTML='';document.body.appendChild(host);
  }, periods);
  await expect(page.locator('.hist-action-summary')).toContainText('Centro de Acción');
  await expect(page.locator('.hist-action-summary')).toContainText('Qué tenés que hacer hoy');
  await expect(page.locator('.hist-action-kpis > div')).toHaveCount(4);
  await expect(page.locator('[data-action-open]')).toContainText('Abrir centro');
});

test('Mi Gestión programa el próximo contacto y conserva metadata e historial del Centro', async ({ page, context }) => {
  await app(page);await context.setOffline(true);
  const saved=await page.evaluate(async()=>{
    const api=window.APPIGestion,now=new Date().toISOString();
    api.state.contacts=[{id:'contact-1',user_id:'user-1',nombre:'Ana Pérez',telefono:'3515551111',estado:'nuevo',metadata:{},notas:'',created_at:now,updated_at:now}];
    const contact=await api.programarDesdeHistorico('contact-1',{nombre:'Ana Pérez',dip:'01-1',telefono:'3515551111',plan_id:'plan-1',plan_title:'Recuperar PB',alerta:'pb_drop',resultado:'conversation_pending',nota:'Necesita acompañamiento.',proximo_contacto:'2026-08-26',activity:'historico_accion'});
    return {date:contact.proximo_contacto,status:contact.estado,metadata:contact.metadata};
  });
  expect(saved.date).toBe('2026-08-26');
  expect(saved.status).toBe('seguimiento');
  expect(saved.metadata.plan_id).toBe('plan-1');
  expect(saved.metadata.alerta).toBe('pb_drop');
  expect(saved.metadata.centro_accion_historial).toHaveLength(1);
});

test('reconciliación, aviso diario y copias embebidas están disponibles y sincronizadas', () => {
  const html=fs.readFileSync('index.html','utf8'),js=fs.readFileSync('historico.js','utf8').trimEnd(),css=fs.readFileSync('historico.css','utf8').trimEnd();
  expect(js).toContain('async function reconcileActionPlans()');
  expect(js).toContain('function notifyActionDueOnce()');
  expect(js).toContain("pb_drop:{");
  expect(js).toContain("monthly_control:{");
  expect(html.match(/id="historico-inline-js"/g)).toHaveLength(1);
  expect(html.match(/id="historico-inline-css"/g)).toHaveLength(1);
  const embeddedJs=html.match(/<script id="historico-inline-js">\n([\s\S]*?)\n<\/script>/)[1];
  const embeddedCss=html.match(/<style id="historico-inline-css">\n([\s\S]*?)\n<\/style>/)[1];
  expect(embeddedJs).toBe(js);
  expect(embeddedCss).toBe(css);
  expect(html).toContain('Tu año, mes por mes');
  expect(html).toContain('class="hist-album-grid"');
});
