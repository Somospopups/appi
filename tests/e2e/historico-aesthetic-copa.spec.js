const { test, expect } = require('@playwright/test');
const fs = require('fs');

const fixture = [
  {
    id:'2026-01',year:2026,month:0,label:'Enero 2026',titular:{nombre:'Titular',dip:'02-1',categoria:'L'},
    summary:{pbPersonal:100,people:2,active:1,activePct:50,incomeCount:1,branches:[{key:'r1',name:'Rama 1',pb:70,people:1}]},
    people:[
      {key:'p1',matchKey:'c:1',codigo:'1',nombre:'Ana',cat:'D',pnAct:60,totalPB:70},
      {key:'p2',matchKey:'c:2',codigo:'2',nombre:'Beto',cat:'DJ',pnAct:40,totalPB:30}
    ],incomes:[]
  },
  {
    id:'2026-02',year:2026,month:1,label:'Febrero 2026',titular:{nombre:'Titular',dip:'02-1',categoria:'L'},
    summary:{pbPersonal:130,people:3,active:2,activePct:67,incomeCount:2,branches:[{key:'r1',name:'Rama 1',pb:90,people:2},{key:'r2',name:'Rama 2',pb:40,people:1}]},
    people:[
      {key:'p1',matchKey:'c:1',codigo:'1',nombre:'Ana',cat:'DC',pnAct:70,totalPB:90},
      {key:'p2',matchKey:'c:2',codigo:'2',nombre:'Beto',cat:'D',pnAct:45,totalPB:30},
      {key:'p3',matchKey:'c:3',codigo:'3',nombre:'Cora',cat:'DJ',pnAct:15,totalPB:10}
    ],incomes:[]
  }
];

async function mountArchive(page) {
  await page.goto('/index.html', { waitUntil:'domcontentloaded' });
  await page.waitForFunction(() => window.__APPI_HISTORICO__?.renderAnnualSummary);
  await page.evaluate(periods => {
    const api=window.__APPI_HISTORICO__;
    api.state.periods=periods;
    const host=document.createElement('main');
    host.id='archiveTestHost';
    host.style.cssText='width:min(1120px,100%);margin:auto;padding:8px';
    host.innerHTML=api.renderAnnualSummary(2026)+api.renderCOPA(periods[1],periods[0]);
    document.body.innerHTML='';
    document.body.appendChild(host);
  }, fixture);
}

test('Archivo conserva los doce meses, adapta la matriz y suma la lectura COPA', async ({ page }) => {
  await page.setViewportSize({ width:390, height:844 });
  await mountArchive(page);

  await expect(page.locator('.hist-quarter')).toHaveCount(4);
  await expect(page.locator('.hist-story-month')).toHaveCount(12);
  await expect(page.locator('.hist-story-month:not(.pending)')).toHaveCount(2);
  await expect(page.locator('.hist-story-month.pending')).toHaveCount(10);
  await expect(page.locator('.hist-annual-desktop')).toBeHidden();
  await expect(page.locator('.hist-annual-mobile')).toBeVisible();
  expect(await page.locator('.hist-mobile-matrix-wrap tbody tr').count()).toBeGreaterThanOrEqual(60);

  await expect(page.locator('.hist-copa-item')).toHaveCount(4);
  await expect(page.locator('.hist-copa')).toContainText('Crecimiento · Organización · Productividad · Actividad');
  await expect(page.locator('.hist-copa-item.c')).toContainText('+30%');
  await expect(page.locator('.hist-copa-item.o')).toContainText('3 personas');
  await expect(page.locator('.hist-copa-item.p')).toContainText('65 PB');
  await expect(page.locator('.hist-copa-item.a')).toContainText('67%');

  const overflow=await page.locator('#archiveTestHost').evaluate(el=>el.scrollWidth-el.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('en PC aparece la comparación tradicional completa de enero a diciembre', async ({ page }) => {
  await page.setViewportSize({ width:1280, height:900 });
  await mountArchive(page);
  await expect(page.locator('.hist-annual-desktop')).toBeVisible();
  await expect(page.locator('.hist-annual-mobile')).toBeHidden();
  await expect(page.locator('.hist-annual-desktop thead th')).toHaveCount(14);
  await expect(page.locator('.hist-annual-desktop thead')).toContainText('ENE');
  await expect(page.locator('.hist-annual-desktop thead')).toContainText('DIC');
  await expect(page.locator('.hist-annual-desktop thead')).toContainText('Total');
});

test('la carga mensual mantiene los tres archivos y sus controles originales', () => {
  const html=fs.readFileSync('index.html','utf8'),js=fs.readFileSync('historico.js','utf8');
  for(const text of ['Línea Descendente','Garantías por Organización','Ingresos']){
    expect(html).toContain(text);
    expect(js).toContain(text);
  }
  expect(html).toContain('data-file-slot');
  expect(js).toContain('data-file-slot');
  expect(html).toContain('data-save-month');
  expect(js).toContain('data-save-month');
  expect(html).toContain('Cada archivo correcto mostrará un check verde. Después guardá ese mes.');
  expect(js).toContain('Cada archivo correcto mostrará un check verde. Después guardá ese mes.');
  expect(html).toContain("addHeader('Lectura COPA'");
  expect(js).toContain("addHeader('Lectura COPA'");
});
