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

  await expect(page.locator('.hist-album-tile')).toHaveCount(12);
  await expect(page.locator('.hist-album-tile:not(.pending)')).toHaveCount(2);
  await expect(page.locator('.hist-album-tile.pending')).toHaveCount(10);
  await expect(page.locator('.hist-quarter, .hist-story-month')).toHaveCount(0);
  await expect(page.locator('.hist-album-readout')).toHaveCount(1);
  await expect(page.locator('.hist-album-readout')).toContainText('Febrero: tu equipo hizo 130 PB y sumó 2 ingresos');
  await expect(page.locator('.hist-album-actions button')).toHaveCount(4);
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

test('los cierres se actualizan desde MI PSA y la carga manual queda como recuperación', () => {
  const html=fs.readFileSync('index.html','utf8'),js=fs.readFileSync('historico.js','utf8');
  for(const text of ['Línea Descendente','Garantías por Organización','Ingresos']){
    expect(html).toContain(text);
    expect(js).toContain(text);
  }
  expect(html).toContain('data-auto-month');
  expect(js).toContain('data-auto-month');
  expect(html).toContain('Carga manual de recuperación');
  expect(js).toContain('Carga manual de recuperación');
  expect(html).toContain("datasets:['linea','garantiasOrg','ingresos']");
  expect(html).toContain('importPSAResponse:importPSAHistoricalResponse');
  expect(js).toContain('importPSAResponse:importPSAHistoricalResponse');
  expect(html).toContain("addHeader('Lectura COPA'");
  expect(js).toContain("addHeader('Lectura COPA'");

  const marker='/* APPI v264 · Histórico: Centro de Acción local-first */';
  const start=html.indexOf(marker),end=html.indexOf('\n</script>',start);
  expect(html.slice(start,end).trim()).toBe(js.trim());
});

test('la pantalla de carga abre los 12 meses en modo automático sin errores', async ({ page }) => {
  await page.route('**/auth-config.js', route => route.fulfill({
    contentType:'application/javascript',
    body:"window.APPI_AUTH={enabled:false,url:'',anonKey:''};"
  }));
  await page.addInitScript(() => {
    localStorage.setItem('welcomeSeen','1');
    localStorage.setItem('tutoVisto_v2','1');
    localStorage.setItem('appi_notif_listo_v1','1');
    localStorage.setItem('appsi_psa_creds', JSON.stringify({ center:'02', number:'9802014', password:'prueba', remember:false }));
    const now=new Date(),id=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    localStorage.setItem(`hist_psa_auto_${id}`, String(Date.now()));
  });
  await page.goto('/index.html', { waitUntil:'domcontentloaded' });
  await page.waitForFunction(() => window.__APPI_HISTORICO__?.state?.ready);
  await page.evaluate(async () => {
    document.getElementById('lockScreen')?.classList.add('hidden');
    document.getElementById('bootScreen')?.remove();
    document.body.classList.remove('appi-login-abierto');
    await window.openHistorico();
  });
  await page.locator('[data-hs-manage]').click();

  await expect(page.locator('.hist-toast-inline.error')).toHaveCount(0);
  await expect(page.locator('.hist-manual-fallback')).toHaveCount(12);
  await expect(page.locator('.hist-manual-fallback[open]')).toHaveCount(0);
  await expect(page.locator('[data-auto-month]')).toHaveCount(12);
  await expect(page.locator('#histAutoCurrent')).toContainText('desde MI PSA');
  await expect(page.locator('.hist-annual-help')).toContainText('La carga de archivos quedó únicamente como alternativa de recuperación');
  expect(await page.evaluate(() => document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});
