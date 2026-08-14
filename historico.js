/* APPI v146 · Histórico mensual local-first */
(function(){
'use strict';

const BASE_DB_NAME='appi-historico-v1';
const DB_VERSION=1;
function historicalDbName(){
  if(window.APPIAuth&&window.APPIAuth.isEnabled()){
    const userId=window.APPIAuth.userId();
    return userId?`${BASE_DB_NAME}-${userId}`:`${BASE_DB_NAME}-locked`;
  }
  return BASE_DB_NAME;
}
const MONTHS_H=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const SHORT_H=['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
const FILE_TYPES={
  equipo:{label:'Línea Descendente',icon:'LD',input:'histFileEquipo'},
  garantias:{label:'Garantías por Organización',icon:'GO',input:'histFileGarantias'},
  ingresos:{label:'Ingresos',icon:'IN',input:'histFileIngresos'}
};
const H={
  db:null,periods:[],reports:[],tab:'dashboard',ready:false,rendering:false,
  uploadYear:new Date().getFullYear(),uploads:{},fileTarget:null,
  selected:new Set(),openMenu:'',personSearch:'',lastReport:null,syncing:false,syncLog:[]
};

const $=id=>document.getElementById(id);
const esc=value=>String(value==null?'':value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=value=>Number(value)||0;
const fmt=value=>new Intl.NumberFormat('es-AR',{maximumFractionDigits:1}).format(num(value));
const pct=(a,b)=>b?Math.round(a/b*100):0;
const periodId=(year,month)=>`${year}-${String(month+1).padStart(2,'0')}`;
const labelPeriod=p=>`${MONTHS_H[p.month]} ${p.year}`;
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const codeNorm=s=>String(s||'').trim().replace(/\s+/g,'').toUpperCase();
const cloneClean=obj=>JSON.parse(JSON.stringify(obj));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

function toast(message,duration=2200){
  try{ if(typeof showToast==='function') showToast(message,duration); else console.log(message); }catch(e){ console.log(message); }
}
function humanBytes(bytes){
  const n=num(bytes);if(n<1024)return `${n} B`;if(n<1048576)return `${(n/1024).toFixed(1)} KB`;return `${(n/1048576).toFixed(1)} MB`;
}
function deltaText(current,previous,suffix=''){
  if(previous==null) return {text:'Primer cierre',cls:'neutral'};
  const d=current-previous;if(Math.abs(d)<.001)return {text:'Sin cambios',cls:'neutral'};
  return {text:`${d>0?'+':''}${fmt(d)}${suffix}`,cls:d>0?'up':'down'};
}
function safeFileName(name){return String(name||'archivo').replace(/[^a-zA-Z0-9._-]+/g,'_').slice(0,120)}
function notifyDbChange(){
  const sorted=[...H.periods].sort((a,b)=>a.id.localeCompare(b.id));
  const latest=sorted[sorted.length-1];
  localStorage.setItem('hist_resumen_cache',JSON.stringify({count:sorted.length,lastLabel:latest?labelPeriod(latest):'Sin cierres'}));
}

async function claimLegacyHistoricalDatabase(targetDb){
  if(!(window.APPIAuth&&window.APPIAuth.isEnabled()))return;
  const userId=window.APPIAuth.userId();if(!userId)return;
  const markerKey='appi_hist_legacy_claimed_by',claimed=localStorage.getItem(markerKey);
  if(claimed&&claimed!==userId)return;
  const targetCount=await new Promise(resolve=>{const req=targetDb.transaction('periods','readonly').objectStore('periods').count();req.onsuccess=()=>resolve(req.result||0);req.onerror=()=>resolve(0)});
  if(targetCount>0){if(!claimed)localStorage.setItem(markerKey,userId);return}
  const legacy=await new Promise(resolve=>{
    let created=false;const req=indexedDB.open(BASE_DB_NAME);
    req.onupgradeneeded=()=>{created=true};
    req.onsuccess=()=>{if(created){req.result.close();indexedDB.deleteDatabase(BASE_DB_NAME);resolve(null)}else resolve(req.result)};
    req.onerror=()=>resolve(null);
  });
  if(!legacy)return;
  const names=['periods','files','reports'].filter(name=>legacy.objectStoreNames.contains(name));
  if(!names.length){legacy.close();return}
  const records={};
  for(const name of names){records[name]=await new Promise(resolve=>{const req=legacy.transaction(name,'readonly').objectStore(name).getAll();req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>resolve([])})}
  legacy.close();
  if(!names.some(name=>records[name].length))return;
  await new Promise((resolve,reject)=>{const tx=targetDb.transaction(names,'readwrite');for(const name of names)for(const value of records[name])tx.objectStore(name).put(value);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});
  localStorage.setItem(markerKey,userId);
}

function openDB(){
  if(H.db)return Promise.resolve(H.db);
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(historicalDbName(),DB_VERSION);
    req.onupgradeneeded=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains('periods')){
        const s=db.createObjectStore('periods',{keyPath:'id'});s.createIndex('year','year');s.createIndex('updatedAt','updatedAt');
      }
      if(!db.objectStoreNames.contains('files')){
        const s=db.createObjectStore('files',{keyPath:'key'});s.createIndex('periodId','periodId');
      }
      if(!db.objectStoreNames.contains('reports')){
        const s=db.createObjectStore('reports',{keyPath:'id'});s.createIndex('createdAt','createdAt');
      }
    };
    req.onsuccess=async()=>{H.db=req.result;try{await claimLegacyHistoricalDatabase(H.db)}catch(error){console.warn('Migración de Histórico',error)}resolve(H.db)};
    req.onerror=()=>reject(req.error||new Error('No se pudo abrir IndexedDB'));
  });
}
function dbGetAll(store,index,query){
  return openDB().then(db=>new Promise((resolve,reject)=>{
    const tx=db.transaction(store,'readonly'),os=tx.objectStore(store);const req=index?os.index(index).getAll(query):os.getAll();
    req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error);
  }));
}
function dbGet(store,key){
  return openDB().then(db=>new Promise((resolve,reject)=>{const req=db.transaction(store,'readonly').objectStore(store).get(key);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error)}));
}
function dbPut(store,value){
  return openDB().then(db=>new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).put(value);tx.oncomplete=()=>resolve(value);tx.onerror=()=>reject(tx.error)}));
}
function dbDelete(store,key){
  return openDB().then(db=>new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).delete(key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)}));
}
async function deletePeriod(id){
  const files=await dbGetAll('files','periodId',id);const db=await openDB();
  await new Promise((resolve,reject)=>{const tx=db.transaction(['periods','files'],'readwrite');tx.objectStore('periods').delete(id);for(const f of files)tx.objectStore('files').delete(f.key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});
  H.periods=H.periods.filter(p=>p.id!==id);H.selected.delete(id);notifyDbChange();
}
async function refreshData(){
  H.periods=(await dbGetAll('periods')).sort((a,b)=>a.id.localeCompare(b.id));
  // v147: el archivo único de Usuarios / Garantías deja de formar parte de los cierres.
  for(const p of H.periods){
    let changed=false;
    if(Object.prototype.hasOwnProperty.call(p,'users')){delete p.users;changed=true}
    if(p.summary&&Object.prototype.hasOwnProperty.call(p.summary,'users')){delete p.summary.users;delete p.summary.userStates;changed=true}
    if(Array.isArray(p.filesMeta)&&p.filesMeta.some(f=>f.type==='usuarios')){p.filesMeta=p.filesMeta.filter(f=>f.type!=='usuarios');changed=true}
    if(changed){p.updatedAt=new Date().toISOString();p.syncStatus='pending';await dbPut('periods',p);await dbDelete('files',`${p.id}:usuarios`)}
  }
  H.reports=(await dbGetAll('reports')).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
  H.lastReport=H.reports[0]||null;notifyDbChange();
  if(!H.selected.size&&H.periods.length){
    const last=H.periods.slice(-Math.min(2,H.periods.length));last.forEach(p=>H.selected.add(p.id));
  }
}

async function sha256(file){
  try{const hash=await crypto.subtle.digest('SHA-256',await file.arrayBuffer());return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('')}catch(e){return ''}
}
async function readSheets(file){
  if(typeof XLSX==='undefined')throw new Error('La librería Excel no está disponible. Abrí APPI con conexión y recargá.');
  const buffer=await file.arrayBuffer(),uint8=new Uint8Array(buffer);
  const first=new TextDecoder('utf-8').decode(uint8.slice(0,700)).toLowerCase();
  const isHtml=first.includes('<html')||first.includes('<!doctype')||first.includes('<table');
  if(isHtml){
    let text;try{text=new TextDecoder('windows-1252').decode(uint8)}catch(e){text=new TextDecoder('utf-8').decode(uint8)}
    const doc=new DOMParser().parseFromString(text,'text/html'),tables=[...doc.querySelectorAll('table')];
    if(!tables.length)throw new Error('El archivo no contiene tablas reconocibles.');
    const rows=[];tables.forEach(table=>[...table.querySelectorAll('tr')].forEach(tr=>{
      const cells=[...tr.children].filter(td=>/^(TD|TH)$/.test(td.tagName)).map(td=>td.querySelector('table')?'':td.textContent.trim().replace(/\s+/g,' '));if(cells.length)rows.push(cells);
    }));
    return [{name:'HTML',rows}];
  }
  const wb=XLSX.read(uint8,{type:'array',cellDates:false,raw:true});
  return wb.SheetNames.map(name=>({name,rows:XLSX.utils.sheet_to_json(wb.Sheets[name],{header:1,defval:'',raw:true,blankrows:false})}));
}
function histIsoDate(value){
  const text=String(value||'').trim();if(!text)return '';
  const m=text.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);if(!m)return text;
  let year=m[3];if(year.length===2)year='20'+year;return `${year}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
}
function histDaysBetween(a,b){const da=new Date(a+'T12:00:00'),db=new Date(b+'T12:00:00');return !a||!b||isNaN(da)||isNaN(db)?null:Math.round((db-da)/86400000)}
function parseIngresosRows(rows){
  const monthMap={enero:1,febrero:2,marzo:3,abril:4,mayo:5,junio:6,julio:7,agosto:8,septiembre:9,setiembre:9,octubre:10,noviembre:11,diciembre:12};
  let periodo='',totalReportado=0,totalDetectado=false,explicitamenteVacio=false;
  for(const row of rows){const norm=normalize((row||[]).join(' ').replace(/\s+/g,' ').trim()),pm=norm.match(/(?:periodo consultado\s*)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s*[ -]\s*(20\d{2})/),tm=norm.match(/total de\s+(\d+)\s+(?:incorporaciones|ingresos)/);if(pm)periodo=`${pm[2]}-${String(monthMap[pm[1]]).padStart(2,'0')}`;if(tm){totalDetectado=true;totalReportado=+tm[1];if(totalReportado===0)explicitamenteVacio=true}if(/(?:sin|no (?:se )?(?:encontraron|registraron)) (?:personas|ingresos|incorporaciones)/.test(norm))explicitamenteVacio=true}
  let headerRow=-1;
  for(let i=0;i<rows.length;i++){
    const cells=(rows[i]||[]).map(c=>normalize(c));
    if(cells.includes('dip')&&cells.filter(c=>c==='nombre').length>=2&&cells.some(c=>c.includes('fecha alta'))&&cells.some(c=>c.includes('patrocinante'))){headerRow=i;break}
  }
  if(headerRow<0){if(explicitamenteVacio)return {ingresos:[],subtotales:[],totalReportado:0,periodo,headerRow:-1,empty:true};throw new Error('No se encontró la tabla principal del archivo Ingresos.');}
  const rawHeaders=rows[headerRow]||[],headers=rawHeaders.map(c=>normalize(c));
  const first=(terms,from=0)=>{for(let i=from;i<headers.length;i++)if(terms.some(t=>headers[i]===t||headers[i].includes(t)))return i;return -1};
  const idxDip=first(['dip']),idxName=first(['nombre'],idxDip+1),idxCat=first(['cat'],idxName+1),idxPhone=first(['telefono']),idxEmail=first(['e mail','email']),idxAlta=first(['fecha alta']),idxLast=first(['ult compra']),idxSponsor=first(['patrocinante']),idxSponsorName=first(['nombre'],idxSponsor+1),idxSponsorCat=first(['cat'],idxSponsorName+1);
  const ingresos=[],subtotales=[];
  for(const row of rows){
    const joined=row.join(' ').replace(/\s+/g,' ').trim(),norm=normalize(joined);
    if(/^sub total/.test(norm)||norm==='lider '+String(row[1]||'').trim()){const count=num(row[row.length-1]||row[1]);if(count)subtotales.push({label:joined.replace(/\s+\d+$/,'').trim(),count});if(norm.startsWith('lider')&&count){totalReportado=count;totalDetectado=true;}continue}
    const dip=String(row[idxDip]||'').trim();if(!/^\d{1,2}-\d{5,}$/.test(dip))continue;
    const alta=histIsoDate(row[idxAlta]),ultimaCompra=histIsoDate(row[idxLast]),dias=histDaysBetween(alta,ultimaCompra),lastValue=row.length?row[row.length-1]:'';
    ingresos.push({
      id:ingresos.length+1,dip,nombre:String(row[idxName]||'').trim(),cat:String(row[idxCat]||'').trim().toUpperCase(),telefono:String(row[idxPhone]||'').trim(),email:String(row[idxEmail]||'').trim(),fechaAlta:alta,ultimaCompra,
      patrocinanteDip:String(row[idxSponsor]||'').trim(),patrocinanteNombre:String(row[idxSponsorName]||'').trim(),patrocinanteCat:String(row[idxSponsorCat]||'').trim().toUpperCase(),capacitacion:num(lastValue),diasHastaCompra:dias,compraPosterior:dias!==null&&dias>0,contactoCompleto:!!String(row[idxPhone]||'').trim()&&!!String(row[idxEmail]||'').trim()
    });
  }
  if(totalDetectado&&totalReportado!==ingresos.length)throw new Error(`El archivo informa ${totalReportado} ingresos, pero se detectaron ${ingresos.length}.`);
  return {ingresos,subtotales,totalReportado:totalReportado||ingresos.length,periodo,headerRow,empty:ingresos.length===0};
}
async function parseHistoricalFile(type,file){
  const sheets=await readSheets(file);
  if(type==='equipo'){
    const result=typeof procesarExcel==='function'?procesarExcel(sheets[0].rows):null;
    if(!result||!result.personas||!result.personas.length)throw new Error('No se pudo reconocer la Línea Descendente.');
    return {result,detail:`${result.personas.length} personas detectadas`};
  }
  if(type==='garantias'){
    const result=typeof procesarGarantias==='function'?procesarGarantias(sheets[0].rows):null;
    const count=result?Object.keys(result.garantiasMap||{}).length:0;if(!count)throw new Error('No se reconocieron datos de Garantías por Organización.');
    return {result,detail:`${count} registros de garantías`};
  }
  if(type==='ingresos'){
    const result=parseIngresosRows(sheets[0].rows);
    return {result,detail:result.ingresos.length?`${result.ingresos.length} ingresos · ${result.periodo||'período detectado'}`:`No hubo ingresos · ${result.periodo||'período detectado'}`};
  }
  throw new Error('Tipo de archivo desconocido.');
}

function makePersonKey(p,index,used){
  const matchKey=p.codigo?`c:${codeNorm(p.codigo)}`:`n:${normalize(p.nombre)}`;let key=matchKey||`fila:${index}`;let n=2;while(used.has(key))key=`${matchKey}#${n++}`;used.add(key);return {key,matchKey};
}
function normalizePeriod(teamData,guarantees,incomeData,year,month){
  const used=new Set(),sourceToKey=new Map();
  const people=teamData.personas.map((p,index)=>{const keys=makePersonKey(p,index,used);sourceToKey.set(String(p.id),keys.key);return {
    key:keys.key,matchKey:keys.matchKey,sourceId:String(p.id),codigo:String(p.codigo||''),nombre:String(p.nombre||'Sin nombre'),cat:String(p.cat||''),nivel:num(p.nivel),
    parentSource:p.padreId==null?'':String(p.padreId),parentKey:'',pnAct:num(p.pnAct),m1:num(p.m1),m2:num(p.m2),m3:num(p.m3),estado:String(p.estado||''),
    alta:String(p.alta||''),cumple:String(p.cumple||''),tel:String(p.tel||''),email:String(p.email||''),teamPB:0,totalPB:0,branchKey:'',
    garantias:{presentadas:0,vencidas:0,porcVencidas:0,pendientes:0}
  }});
  const byKey=new Map(people.map(p=>[p.key,p]));
  for(const p of people){
    p.parentKey=sourceToKey.get(p.parentSource)||'';
    const g=(guarantees.garantiasMap||{})[p.codigo]||(guarantees.garantiasMap||{})[codeNorm(p.codigo)];
    if(g)p.garantias={presentadas:num(g.presentadas),vencidas:num(g.vencidas),porcVencidas:num(g.porcVencidas),pendientes:num(g.pendientes)};
  }
  const sorted=[...people].sort((a,b)=>b.nivel-a.nivel);const totals=new Map(people.map(p=>[p.key,p.pnAct]));
  for(const p of sorted){const total=totals.get(p.key)||0;p.totalPB=total;p.teamPB=Math.max(0,total-p.pnAct);if(p.parentKey)totals.set(p.parentKey,(totals.get(p.parentKey)||0)+total)}
  for(const p of people){let current=p,guard=0;while(current.parentKey&&byKey.has(current.parentKey)&&guard++<40)current=byKey.get(current.parentKey);p.branchKey=current.key}
  const incomeRecords=(incomeData.ingresos||[]).map(item=>{const matchKey=`c:${codeNorm(item.dip)}`,linked=people.find(p=>p.matchKey===matchKey);if(linked)linked.isIncome=true;return {...cloneClean(item),matchKey,linkedPersonKey:linked?linked.key:''}});
  return {people,incomes:incomeRecords,incomeValidation:{totalReportado:incomeData.totalReportado,subtotales:incomeData.subtotales||[],periodo:incomeData.periodo||''},titular:cloneClean(teamData.titular||{}),summary:buildSummary(people,incomeRecords)};
}
function buildSummary(people,incomes=[]){
  const active=people.filter(p=>p.pnAct>0).length,categories={},branches={},incomeCategories={},incomeSponsors={};
  let presented=0,expired=0,pending=0,pb=0;
  for(const p of people){pb+=p.pnAct;categories[p.cat||'?']=(categories[p.cat||'?']||0)+1;presented+=p.garantias.presentadas;expired+=p.garantias.vencidas;pending+=p.garantias.pendientes;const b=p.branchKey||p.key;if(!branches[b])branches[b]={key:b,name:p.nombre,pb:0,people:0};branches[b].pb+=p.pnAct;branches[b].people++}
  for(const item of incomes){incomeCategories[item.cat||'?']=(incomeCategories[item.cat||'?']||0)+1;const key=item.patrocinanteDip||item.patrocinanteNombre||'Sin patrocinante';if(!incomeSponsors[key])incomeSponsors[key]={key,name:item.patrocinanteNombre||item.patrocinanteDip||'Sin patrocinante',dip:item.patrocinanteDip||'',cat:item.patrocinanteCat||'',count:0};incomeSponsors[key].count++}
  const days=incomes.map(i=>i.diasHastaCompra).filter(d=>d!==null&&d>0);
  return {people:people.length,active,inactive:people.length-active,activePct:pct(active,people.length),pbPersonal:pb,pbOrganization:pb,presented,expired,pending,expiredPct:pct(expired,presented),categories,branches:Object.values(branches).sort((a,b)=>b.pb-a.pb),incomeCount:incomes.length,incomeCategories,incomeSponsors:Object.values(incomeSponsors).sort((a,b)=>b.count-a.count),incomeNoPurchase:incomes.filter(i=>!i.compraPosterior).length,incomeContactIncomplete:incomes.filter(i=>!i.contactoCompleto).length,incomeAvgDays:days.length?Math.round(days.reduce((a,b)=>a+b,0)/days.length):0,incomeMatched:incomes.filter(i=>i.linkedPersonKey).length,incomeTraining:incomes.filter(i=>i.capacitacion>0).length};
}

function getMonthDraft(year,month){
  const id=periodId(year,month);
  if(!H.uploads[id])H.uploads[id]={id,year,month,files:{},parsed:{},status:{},changed:false};
  return H.uploads[id];
}
async function hydrateDraftFromSaved(draft){
  const existing=H.periods.find(p=>p.id===draft.id);if(!existing)return;
  for(const type of Object.keys(FILE_TYPES)){
    if(draft.parsed[type]&&draft.files[type])continue;
    const stored=await dbGet('files',`${draft.id}:${type}`);if(!stored||!stored.blob)continue;
    const file=new File([stored.blob],stored.name||`${type}_${draft.id}.xlsx`,{type:stored.mime||stored.blob.type||'application/octet-stream',lastModified:stored.lastModified||Date.now()});
    draft.files[type]=file;draft.parsed[type]=await parseHistoricalFile(type,file);draft.status[type]='saved';
  }
}
async function buildPeriodRecord(draft){
  const existing=H.periods.find(p=>p.id===draft.id);
  const normalized=normalizePeriod(draft.parsed.equipo.result,draft.parsed.garantias.result,draft.parsed.ingresos.result,draft.year,draft.month);
  const filesMeta=[];for(const type of Object.keys(FILE_TYPES)){const file=draft.files[type];filesMeta.push({type,name:file.name,size:file.size,mime:file.type||'application/octet-stream',lastModified:file.lastModified||0,hash:await sha256(file)})}
  return {id:draft.id,year:draft.year,month:draft.month,label:`${MONTHS_H[draft.month]} ${draft.year}`,version:existing?num(existing.version)+1:1,createdAt:existing?existing.createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),syncStatus:'pending',filesMeta,...normalized};
}
async function saveMonthPeriod(id){
  const draft=H.uploads[id],existing=H.periods.find(p=>p.id===id);if(!draft)return;
  const btn=document.querySelector(`[data-save-month="${id}"]`);if(btn){btn.disabled=true;btn.textContent='Guardando…'}
  try{
    await hydrateDraftFromSaved(draft);
    if(!draft.parsed.equipo||!draft.parsed.garantias||!draft.parsed.ingresos){toast(`Falta completar ${MONTHS_H[draft.month]}`,2600);render();return}
    const reportPeriod=draft.parsed.ingresos.result.periodo;if(reportPeriod&&reportPeriod!==draft.id){toast(`Ingresos corresponde a ${reportPeriod}, no a ${draft.id}`,3600);render();return}
    if(existing&&!confirm(`${MONTHS_H[draft.month]} ${draft.year} ya está guardado. ¿Querés actualizar ese cierre?`)){render();return}
    const record=await buildPeriodRecord(draft),db=await openDB();
    await new Promise((resolve,reject)=>{const tx=db.transaction(['periods','files'],'readwrite');tx.objectStore('periods').put(record);for(const type of Object.keys(FILE_TYPES)){const file=draft.files[type];tx.objectStore('files').put({key:`${record.id}:${type}`,periodId:record.id,type,name:file.name,size:file.size,mime:file.type||'',lastModified:file.lastModified||0,blob:file})}tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});
    delete H.uploads[id];await refreshData();H.selected=new Set(H.periods.slice(-Math.min(2,H.periods.length)).map(p=>p.id));render();toast(`✓ ${record.label} guardado`,2400);try{haptic(20)}catch(e){}
    if(navigator.onLine&&cloudReady())setTimeout(()=>syncAll(false),800);
  }catch(e){console.error('Histórico guardar',e);toast(`No se pudo guardar: ${e.message}`,3500);render()}
}

function setActiveTab(){document.querySelectorAll('.hist-tabs [data-hist-tab]').forEach(b=>b.classList.toggle('active',b.dataset.histTab===H.tab))}
function openTab(tab){H.tab=['cargar','meses'].includes(tab)?'cargar':'dashboard';setActiveTab();render()}
function render(){
  const c=$('historicoContent');if(!c||H.rendering)return;H.rendering=true;
  try{
    if(H.tab==='cargar')renderUpload(c);else renderDashboard(c);
  }finally{H.rendering=false}
  updateSyncStatus();
}
function latestPair(){const p=H.periods;return {latest:p[p.length-1]||null,previous:p[p.length-2]||null}}
function kpi(icon,value,label,delta,type=''){const tag=type?'button':'div';return `<${tag} class="hist-kpi ${type?'hist-kpi-click':''}" ${type?`data-hist-drill="${type}"`:''}><div class="k-icon">${icon}</div><strong>${esc(value)}</strong><span>${esc(label)}</span>${delta?`<small class="hist-delta ${delta.cls}">${esc(delta.text)}</small>`:''}${type?'<em>Ver datos ›</em>':''}</${tag}>`}
const HIST_CAT_RANK={DJ:0,D:1,DC:2,CE:3,L:4,LE:5,EJ:6,E:7};
const HIST_CAT_LABEL={DJ:'Distribuidor Junior',D:'Distribuidor',DC:'Distribuidor Calificado',CE:'Coordinador',L:'Líder',LE:'Líder Ejecutivo',EJ:'Ejecutivo',E:'Empresa'};
function histCategoryCode(value){const raw=String(value||'').trim().toUpperCase();if(Object.prototype.hasOwnProperty.call(HIST_CAT_RANK,raw))return raw;const text=normalize(value);if(!text)return '';if(text.includes('lider ejecutivo'))return 'LE';if(text.includes('distribuidor junior'))return 'DJ';if(text.includes('distribuidor calificado'))return 'DC';if(text.includes('coordinador'))return 'CE';if(text.includes('ejecutivo'))return 'EJ';if(text.includes('empresa'))return 'E';if(text.includes('lider'))return 'L';if(text.includes('distribuidor'))return 'D';return ''}
function titularCategory(period){return histCategoryCode(period&&period.titular&&(period.titular.categoria||period.titular.cat))}
function titularInPeople(period){const dip=codeNorm(period&&period.titular&&period.titular.dip);return !!dip&&period.people.some(person=>codeNorm(person.codigo)===dip)}
function categoryPB(period,category){return period.people.filter(person=>person.cat===category).reduce((sum,person)=>sum+num(person.pnAct),0)}
function incomePersonalList(period){const titular=codeNorm(period.titular&&period.titular.dip);return (period.incomes||[]).filter(i=>titular&&codeNorm(i.patrocinanteDip)===titular)}
function passList(period,previous,target){if(!previous)return [];const before=new Map(previous.people.map(p=>[p.matchKey,p]));return period.people.filter(p=>{const old=before.get(p.matchKey);return old&&p.cat===target&&(HIST_CAT_RANK[old.cat]??-1)<(HIST_CAT_RANK[target]??0)})}
function bonusQualifications(period){const peopleByMatch=new Map(period.people.map(p=>[p.matchKey,p])),groups=new Map();for(const income of period.incomes||[]){const sponsor=peopleByMatch.get(`c:${codeNorm(income.patrocinanteDip)}`),entrant=peopleByMatch.get(income.matchKey);if(!sponsor||!entrant||(HIST_CAT_RANK[sponsor.cat]??-1)<HIST_CAT_RANK.D||sponsor.pnAct<12||entrant.pnAct<9)continue;if(!groups.has(sponsor.key))groups.set(sponsor.key,{sponsor,incomes:[]});groups.get(sponsor.key).incomes.push({income,entrant})}return [...groups.values()]}
function bonusWinners(period,level){return bonusQualifications(period).filter(g=>level===1?g.incomes.length===1:g.incomes.length>=2).map(g=>g.sponsor)}
function annualValue(row,period,previous){
  if(!period)return 0;if(row==='ownerOrg')return num(period.summary&&period.summary.pbPersonal);if(row.startsWith('orgcat:'))return categoryPB(period,row.split(':')[1]);
  if(row==='incomePersonal')return incomePersonalList(period).length;if(row==='incomeOrg')return Math.max(0,period.summary.incomeCount-incomePersonalList(period).length);if(row==='purged')return previous?Math.max(0,previous.summary.people-period.summary.people):0;
  if(row.startsWith('pass:'))return passList(period,previous,row.split(':')[1]).length;if(row==='bonus1')return bonusWinners(period,1).length;if(row==='bonus2')return bonusWinners(period,2).length;return 0;
}
function annualRows(year){const yearPeriods=H.periods.filter(p=>p.year===year),present=new Set(yearPeriods.flatMap(p=>p.people.map(x=>x.cat)).filter(Boolean)),ownerPeriod=[...yearPeriods].reverse().find(p=>titularCategory(p)),ownerCat=titularCategory(ownerPeriod),ownerLabel=`Organización del titular${ownerCat?` · ${HIST_CAT_LABEL[ownerCat]||ownerCat}`:''}`,categoryRows=Object.keys(HIST_CAT_RANK).filter(cat=>present.has(cat)).map(cat=>({id:`orgcat:${cat}`,label:`PB realizados por ${cat}`,unit:'pb',category:cat}));return [
  {section:'Resumen de acumulación'},
  {id:'ownerOrg',label:ownerLabel,unit:'pb'},
  {section:'Distribución del PB por categoría'},
  ...categoryRows,
  {section:'Ingresos'},
  {id:'incomeOrg',label:'Ing. por Organización'},
  {id:'incomePersonal',label:'Ing. Personales'},
  {id:'purged',label:'Depurados'},
  {section:'Pases'},
  {id:'pass:D',label:'Pases a Distribuidor'},
  {id:'pass:DC',label:'Pases a DC'},
  {id:'pass:CE',label:'Pases a Coordinador'},
  {id:'pass:L',label:'Pases a Líder'},
  {id:'pass:LE',label:'Pases a Líder Ejecutivo'},
  {section:'Bonus'},
  {id:'bonus1',label:'Personas con Bonus 1'},
  {id:'bonus2',label:'Personas con Bonus 2'}
]}
function annualMatrix(year){const periods=H.periods.filter(p=>p.year===year).sort((a,b)=>a.id.localeCompare(b.id)),byMonth=new Map(periods.map(p=>[p.month,p])),rows=annualRows(year),values=new Map();let previous=null;for(let m=0;m<12;m++){const period=byMonth.get(m);for(const row of rows.filter(r=>r.id))values.set(`${row.id}:${m}`,annualValue(row.id,period,previous));if(period)previous=period}return {periods,byMonth,rows,values}}
function renderAnnualSummary(year){const {periods,byMonth,rows,values}=annualMatrix(year),body=rows.map(row=>{if(row.section)return `<tr class="hist-annual-section"><th colspan="14">${esc(row.section)}</th></tr>`;const vals=Array.from({length:12},(_,m)=>values.get(`${row.id}:${m}`)||0),total=vals.reduce((a,b)=>a+b,0);return `<tr><th>${esc(row.label)}</th>${vals.map((v,m)=>{const period=byMonth.get(m);return `<td>${period?`<button data-hist-annual="${row.id}" data-period-id="${period.id}">${row.unit==='pb'?fmt(v):Math.round(v)}</button>`:'—'}</td>`}).join('')}<td><button data-hist-annual="${row.id}" data-period-id="all" data-year="${year}">${row.unit==='pb'?fmt(total):Math.round(total)}</button></td></tr>`}).join('');
  return `<div class="hist-card hist-annual-summary"><div class="hist-card-head"><div><h3>Resumen anual ${year}</h3><p>El total organizacional se distribuye por categoría sin duplicar personas. Tocá un número para ver su detalle.</p></div><div class="hist-annual-head-actions"><span class="hist-badge">${periods.length}/12 meses</span><button type="button" class="hist-share-pdf" data-hist-share-pdf="${year}"><span>PDF</span> Compartir</button></div></div><div class="hist-annual-table-wrap"><table><thead><tr><th>Indicador</th>${SHORT_H.map(m=>`<th>${m}</th>`).join('')}<th>Total</th></tr></thead><tbody>${body}</tbody></table></div></div>`}
async function shareAnnualPdf(year){const jsPDF=window.jspdf&&window.jspdf.jsPDF;if(!jsPDF){toast('No se pudo cargar el generador de PDF. Revisá tu conexión.',3500);return}const matrix=annualMatrix(year);if(!matrix.periods.length){toast('No hay cierres para generar el PDF.',2600);return}const pdf=new jsPDF({orientation:'landscape',unit:'pt',format:'a4',compress:true}),pageW=pdf.internal.pageSize.getWidth(),pageH=pdf.internal.pageSize.getHeight(),margin=25,tableW=pageW-margin*2,indicatorW=166,dataW=(tableW-indicatorW)/13,last=matrix.periods[matrix.periods.length-1],titular=last.titular||{},fileName=`APPI-Resumen-Anual-${year}.pdf`;
  pdf.setFillColor(52,62,105);pdf.roundedRect(margin,22,tableW,52,8,8,'F');pdf.setTextColor(255,255,255);pdf.setFont('helvetica','bold');pdf.setFontSize(18);pdf.text('APPI',margin+15,45);pdf.setFontSize(12);pdf.text(`Resumen anual ${year}`,margin+15,63);pdf.setFont('helvetica','normal');pdf.setFontSize(8);const owner=[titular.nombre,titular.dip&&`DIP ${titular.dip}`].filter(Boolean).join(' · ');pdf.text(owner||'Histórico anual',pageW-margin-15,45,{align:'right'});pdf.text(`${matrix.periods.length} de 12 cierres cargados`,pageW-margin-15,61,{align:'right'});
  let y=85;const headerH=23;pdf.setFillColor(224,229,244);pdf.rect(margin,y,tableW,headerH,'F');pdf.setDrawColor(191,198,218);pdf.setLineWidth(.45);pdf.setTextColor(52,57,76);pdf.setFont('helvetica','bold');pdf.setFontSize(7.3);pdf.text('INDICADOR',margin+7,y+15);[...SHORT_H,'TOTAL'].forEach((label,i)=>pdf.text(label,margin+indicatorW+dataW*i+dataW/2,y+15,{align:'center'}));pdf.rect(margin,y,tableW,headerH);for(let i=0;i<=13;i++){const x=margin+indicatorW+dataW*i;pdf.line(x,y,x,y+headerH)}y+=headerH;
  const sections=matrix.rows.filter(r=>r.section).length,dataRows=matrix.rows.length-sections,available=pageH-y-49,scale=Math.min(1,available/(sections*16+dataRows*20)),sectionH=16*scale,rowH=20*scale;let stripe=0;
  for(const row of matrix.rows){if(row.section){pdf.setFillColor(104,108,127);pdf.rect(margin,y,tableW,sectionH,'F');pdf.setTextColor(255,255,255);pdf.setFont('helvetica','bold');pdf.setFontSize(Math.max(6.2,7*scale));pdf.text(String(row.section).toUpperCase(),pageW/2,y+sectionH*.69,{align:'center'});y+=sectionH;continue}const vals=Array.from({length:12},(_,m)=>matrix.values.get(`${row.id}:${m}`)||0),total=vals.reduce((a,b)=>a+b,0);pdf.setFillColor(stripe++%2?248:242,stripe%2?249:245,252);pdf.rect(margin,y,tableW,rowH,'F');pdf.setFillColor(235,239,250);pdf.rect(margin+indicatorW+dataW*12,y,dataW,rowH,'F');pdf.setDrawColor(208,213,228);pdf.setTextColor(47,50,67);pdf.setFont('helvetica','bold');pdf.setFontSize(Math.max(6,7.2*scale));pdf.text(row.label,margin+7,y+rowH*.67);pdf.setFont('helvetica','normal');pdf.setFontSize(Math.max(5.8,7*scale));vals.forEach((value,m)=>{const text=matrix.byMonth.has(m)?(row.unit==='pb'?fmt(value):String(Math.round(value))):'-';pdf.text(text,margin+indicatorW+dataW*m+dataW/2,y+rowH*.67,{align:'center'})});pdf.setFont('helvetica','bold');pdf.text(row.unit==='pb'?fmt(total):String(Math.round(total)),margin+indicatorW+dataW*12+dataW/2,y+rowH*.67,{align:'center'});pdf.rect(margin,y,tableW,rowH);for(let i=0;i<=13;i++){const x=margin+indicatorW+dataW*i;pdf.line(x,y,x,y+rowH)}y+=rowH}
  const stamp=new Date().toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric'});pdf.setTextColor(99,103,120);pdf.setFont('helvetica','normal');pdf.setFontSize(6.7);pdf.text('El total organizacional se distribuye por categoría usando PB personales; cada persona se cuenta una sola vez.',margin,pageH-26);pdf.text(`Generado por APPI · ${stamp}`,pageW-margin,pageH-26,{align:'right'});const blob=pdf.output('blob'),file=new File([blob],fileName,{type:'application/pdf'});if(navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:`Resumen anual APPI ${year}`,text:`Resumen anual ${year} generado por APPI`});toast('PDF compartido',2200);return}catch(error){if(error&&error.name==='AbortError'){toast('Se canceló el envío del PDF.',2200);return}}}pdf.save(fileName);toast('PDF horizontal descargado. Ya podés compartirlo.',3200)}
async function shareFullHistoricalReport(year){
  const jsPDF=window.jspdf&&window.jspdf.jsPDF,periods=H.periods.filter(p=>p.year===year).sort((a,b)=>a.id.localeCompare(b.id));if(!jsPDF){toast('No se pudo cargar el generador de PDF. Revisá tu conexión.',3500);return}if(!periods.length){toast('No hay cierres para generar el informe.',2600);return}
  const pdf=new jsPDF({orientation:'landscape',unit:'pt',format:'a4',compress:true}),W=pdf.internal.pageSize.getWidth(),PH=pdf.internal.pageSize.getHeight(),M=28,latest=periods[periods.length-1],first=periods[0],owner=latest.titular||{},matrix=annualMatrix(year),strategies=buildStrategies(periods),fileName=`APPI-Informe-Completo-${year}.pdf`;
  const C={navy:[49,57,96],blue:[91,141,239],purple:[160,107,255],green:[58,208,164],red:[217,83,90],amber:[233,154,32],ink:[45,47,64],muted:[112,114,132],line:[216,220,234],soft:[246,247,252],lav:[239,236,253],white:[255,255,255]};
  const color=(kind='text',value=C.ink)=>pdf[kind==='fill'?'setFillColor':kind==='draw'?'setDrawColor':'setTextColor'](...value),clean=value=>String(value??'').replace(/[\u{1F000}-\u{1FFFF}]/gu,''),clip=(value,width,size=7)=>{let text=clean(value);pdf.setFontSize(size);if(pdf.getTextWidth(text)<=width)return text;while(text.length>2&&pdf.getTextWidth(text+'…')>width)text=text.slice(0,-1);return text+'…'},setFont=(size=8,style='normal',tone=C.ink)=>{pdf.setFont('helvetica',style);pdf.setFontSize(size);color('text',tone)},roundRect=(x,y,w,h,fill,draw=C.line,r=8)=>{color('fill',fill);color('draw',draw);pdf.roundedRect(x,y,w,h,r,r,'FD')};
  const addHeader=(title,subtitle)=>{pdf.addPage('a4','landscape');color('fill',C.navy);pdf.rect(0,0,W,66,'F');setFont(16,'bold',C.white);pdf.text('APPI',M,30);setFont(11,'bold',C.white);pdf.text(clean(title),M,50);setFont(7.5,'normal',[220,224,242]);pdf.text(clean(subtitle||''),W-M,31,{align:'right'});pdf.text(`${periods.length}/12 cierres · ${year}`,W-M,49,{align:'right'})};
  const card=(x,y,w,h,label,value,tone=C.blue,sub='')=>{const compact=h<60;roundRect(x,y,w,h,C.white,C.line,9);color('fill',tone);pdf.roundedRect(x+10,y+9,5,h-18,2,2,'F');setFont(compact?6.2:7,'bold',C.muted);pdf.text(clean(label).toUpperCase(),x+24,y+(compact?14:18));setFont(compact?(sub?12.5:15):17,'bold',C.ink);pdf.text(clean(value),x+24,y+(compact?(sub?31:36):39));if(sub){setFont(compact?5.6:6.7,'normal',C.muted);pdf.text(clip(sub,w-34,compact?5.6:6.7),x+24,y+h-(compact?6:8))}};
  const tablePanel=(x,y,w,h,title,columns,rows,empty='Sin datos')=>{roundRect(x,y,w,h,C.white,C.line,9);color('fill',C.navy);pdf.roundedRect(x,y,w,24,9,9,'F');pdf.rect(x,y+12,w,12,'F');setFont(8,'bold',C.white);pdf.text(clean(title),x+10,y+16);const headY=y+25,rowStart=y+42,rowH=Math.min(17,Math.max(12,(h-47)/Math.max(1,rows.length))),innerW=w-16,total=columns.reduce((sum,c)=>sum+c.ratio,0);let cx=x+8;color('fill',[235,238,248]);pdf.rect(x+7,headY,w-14,15,'F');for(const col of columns){const cw=innerW*col.ratio/total;setFont(6.3,'bold',C.muted);pdf.text(clip(col.label,cw-6,6.3),col.align==='right'?cx+cw-3:cx+3,headY+10,{align:col.align==='right'?'right':'left'});cx+=cw}if(!rows.length){setFont(7.5,'normal',C.muted);pdf.text(clean(empty),x+10,rowStart+10);return}rows.slice(0,Math.floor((h-43)/rowH)).forEach((row,index)=>{const ry=rowStart+index*rowH;if(index%2===0){color('fill',C.soft);pdf.rect(x+7,ry-1,w-14,rowH,'F')}let px=x+8;row.forEach((value,i)=>{const col=columns[i],cw=innerW*col.ratio/total;setFont(6.8,i===0?'bold':'normal',i===row.length-1?C.navy:C.ink);pdf.text(clip(value,cw-6,6.8),col.align==='right'?px+cw-3:px+3,ry+rowH*.65,{align:col.align==='right'?'right':'left'});px+=cw})})};
  const drawPdfLine=(x,y,w,h,title,metric,tone,suffix='')=>{roundRect(x,y,w,h,C.white,C.line,10);setFont(9,'bold',C.ink);pdf.text(clean(title),x+12,y+18);const vals=periods.map(p=>metricValue(p,metric));let min=Math.min(...vals),max=Math.max(...vals);if(min===max){min=Math.max(0,min-1);max+=1}const left=x+42,right=x+w-16,top=y+43,bottom=y+h-30,cw=right-left,ch=bottom-top;setFont(5.8,'normal',C.muted);for(let g=0;g<4;g++){const t=g/3,gy=top+t*ch,v=max-t*(max-min);color('draw',C.line);pdf.line(left,gy,right,gy);pdf.text(`${fmt(v)}${suffix}`,left-6,gy+2,{align:'right'})}const points=vals.map((v,i)=>({x:left+(periods.length===1?cw/2:i*cw/(periods.length-1)),y:top+(max-v)/(max-min)*ch})),pale=tone.map(value=>Math.round(value*.12+255*.88)),areaLines=[];areaLines.push([points[0].x-left,points[0].y-bottom]);for(let i=1;i<points.length;i++)areaLines.push([points[i].x-points[i-1].x,points[i].y-points[i-1].y]);areaLines.push([right-points[points.length-1].x,bottom-points[points.length-1].y]);color('fill',pale);pdf.lines(areaLines,left,bottom,[1,1],'F',true);color('draw',tone);pdf.setLineWidth(2.4);for(let i=1;i<points.length;i++)pdf.line(points[i-1].x,points[i-1].y,points[i].x,points[i].y);points.forEach((point,i)=>{const label=`${fmt(vals[i])}${suffix}`;setFont(6.2,'bold',tone);const pillW=Math.max(25,pdf.getTextWidth(label)+10),below=point.y<top+15,pillY=below?point.y+7:point.y-20;color('fill',C.white);color('draw',pale);pdf.roundedRect(point.x-pillW/2,pillY,pillW,13,6,6,'FD');setFont(6.2,'bold',tone);pdf.text(label,point.x,pillY+8.7,{align:'center'});color('fill',tone);color('draw',C.white);pdf.circle(point.x,point.y,4.3,'FD');setFont(5.8,'bold',C.muted);pdf.text(`${SHORT_H[periods[i].month]} ${String(periods[i].year).slice(-2)}`,point.x,bottom+17,{align:'center'})});pdf.setLineWidth(.4)};
  // Portada
  color('fill',[245,242,252]);pdf.rect(0,0,W,PH,'F');color('fill',C.navy);pdf.roundedRect(M,28,W-M*2,108,14,14,'F');setFont(25,'bold',C.white);pdf.text('APPI',M+24,67);setFont(20,'bold',C.white);pdf.text(`Informe completo ${year}`,M+24,99);setFont(8.5,'normal',[221,225,243]);pdf.text('Histórico anual · Documento profesional para análisis y seguimiento',M+24,119);setFont(11,'bold',C.navy);pdf.text(clean(owner.nombre||'Titular del reporte'),M,171);setFont(8,'normal',C.muted);pdf.text(clean(owner.dip?`DIP ${owner.dip}`:'Datos consolidados del Histórico'),M,189);const gap=10,cw=(W-M*2-gap*3)/4,yc=218;card(M,yc,cw,72,'Cierres cargados',`${periods.length} de 12`,C.blue,`${first.label} a ${latest.label}`);card(M+(cw+gap),yc,cw,72,'PB último cierre',`${fmt(latest.summary.pbPersonal)} PB`,C.purple,latest.label);card(M+(cw+gap)*2,yc,cw,72,'Personas activas',`${latest.summary.active} de ${latest.summary.people}`,C.green,`${latest.summary.activePct}% de actividad`);card(M+(cw+gap)*3,yc,cw,72,'Ingresos del año',`${periods.reduce((sum,p)=>sum+p.summary.incomeCount,0)}`,C.amber,'Suma de cierres mensuales');roundRect(M,319,W-M*2,148,C.white,C.line,12);setFont(11,'bold',C.navy);pdf.text('Contenido del informe',M+18,344);const content=['Resumen ejecutivo y evolución mensual','Matriz anual completa por indicador','Distribución del PB por categoría','Rankings de vendedores y organizaciones','Ingresos, pases y detalle de Bonus','Recomendaciones y próximas acciones'];content.forEach((item,i)=>{const col=i%2,row=Math.floor(i/2);color('fill',col?C.purple:C.blue);pdf.circle(M+28+col*380,374+row*32,3,'F');setFont(8.3,'normal',C.ink);pdf.text(item,M+40+col*380,377+row*32)});setFont(7,'normal',C.muted);pdf.text(`Generado el ${new Date().toLocaleDateString('es-AR')} · Los datos provienen de los cierres guardados en APPI.`,M,PH-30);
  // Evolución
  addHeader('Evolución anual','Gráficos con el valor exacto de cada cierre');drawPdfLine(M,87,W-M*2,205,'Evolución del PB del equipo','pbPersonal',C.blue,' PB');drawPdfLine(M,310,W-M*2,205,'Evolución de Ingresos','incomeCount',C.purple,'');
  // Matriz anual
  addHeader('Resumen anual completo','Acumulación, Ingresos, Pases y Bonus');let y=82;const tableW=W-M*2,indicatorW=166,dataW=(tableW-indicatorW)/13,headerH=22;color('fill',[224,229,244]);pdf.rect(M,y,tableW,headerH,'F');color('draw',[191,198,218]);setFont(7,'bold',C.ink);pdf.text('INDICADOR',M+7,y+14);[...SHORT_H,'TOTAL'].forEach((label,i)=>pdf.text(label,M+indicatorW+dataW*i+dataW/2,y+14,{align:'center'}));y+=headerH;const sections=matrix.rows.filter(r=>r.section).length,dataRows=matrix.rows.length-sections,available=PH-y-52,scale=Math.min(1,available/(sections*15+dataRows*19)),sectionH=15*scale,rowH=19*scale;let stripe=0;for(const row of matrix.rows){if(row.section){color('fill',[104,108,127]);pdf.rect(M,y,tableW,sectionH,'F');setFont(Math.max(6,6.8*scale),'bold',C.white);pdf.text(String(row.section).toUpperCase(),W/2,y+sectionH*.68,{align:'center'});y+=sectionH;continue}const vals=Array.from({length:12},(_,m)=>matrix.values.get(`${row.id}:${m}`)||0),total=vals.reduce((a,b)=>a+b,0);color('fill',stripe++%2?[248,249,252]:[243,245,251]);pdf.rect(M,y,tableW,rowH,'F');color('fill',[235,239,250]);pdf.rect(M+indicatorW+dataW*12,y,dataW,rowH,'F');setFont(Math.max(5.8,6.8*scale),'bold',C.ink);pdf.text(clip(row.label,indicatorW-12,Math.max(5.8,6.8*scale)),M+7,y+rowH*.67);setFont(Math.max(5.5,6.5*scale),'normal',C.ink);vals.forEach((value,m)=>pdf.text(matrix.byMonth.has(m)?(row.unit==='pb'?fmt(value):String(Math.round(value))):'-',M+indicatorW+dataW*m+dataW/2,y+rowH*.67,{align:'center'}));setFont(Math.max(5.5,6.5*scale),'bold',C.navy);pdf.text(row.unit==='pb'?fmt(total):String(Math.round(total)),M+indicatorW+dataW*12+dataW/2,y+rowH*.67,{align:'center'});color('draw',C.line);pdf.rect(M,y,tableW,rowH);for(let i=0;i<=13;i++){const lx=M+indicatorW+dataW*i;pdf.line(lx,y,lx,y+rowH)}y+=rowH}setFont(6.2,'normal',C.muted);pdf.text('El total organizacional se distribuye por categoría sin duplicar personas.',M,PH-30);
  // Recomendaciones
  addHeader('Lectura ejecutiva y próximas acciones',`${first.label} a ${latest.label}`);const pbChange=first.summary.pbPersonal?((latest.summary.pbPersonal-first.summary.pbPersonal)/first.summary.pbPersonal*100):0;card(M,84,183,62,'Variación de PB',`${pbChange>=0?'+':''}${Math.round(pbChange)}%`,pbChange>=0?C.green:C.red,`${fmt(first.summary.pbPersonal)} a ${fmt(latest.summary.pbPersonal)} PB`);card(M+193,84,183,62,'Actividad actual',`${latest.summary.activePct}%`,C.blue,`${latest.summary.active} personas activas`);card(M+386,84,183,62,'Pendientes',fmt(latest.summary.pending),C.amber,'Último cierre');card(M+579,84,183,62,'Ingresos totales',String(periods.reduce((sum,p)=>sum+p.summary.incomeCount,0)),C.purple,`Durante ${periods.length} cierres`);let sy=166;strategies.slice(0,5).forEach((strategy,i)=>{const h=68,tone=strategy.priority==='Alta'?C.red:strategy.priority==='Media'?C.amber:C.blue;roundRect(M,sy,W-M*2,h,C.white,C.line,9);color('fill',tone);pdf.roundedRect(M,sy,7,h,3,3,'F');setFont(6.3,'bold',tone);pdf.text(strategy.priority.toUpperCase(),M+18,sy+16);setFont(9,'bold',C.ink);pdf.text(clip(strategy.title,W-M*2-120,9),M+78,sy+16);setFont(7,'normal',C.muted);pdf.text(clip(strategy.evidence,W-M*2-36,7),M+18,sy+34);setFont(7,'bold',C.navy);pdf.text('Acción:',M+18,sy+53);setFont(7,'normal',C.ink);pdf.text(clip(strategy.action,W-M*2-75,7),M+57,sy+53);sy+=76});
  // Detalle por mes: una sola hoja horizontal por cierre.
  const monthlyPanel=(x,y,w,h,title,columns,sourceRows,empty='Sin datos')=>{roundRect(x,y,w,h,C.white,C.line,8);color('fill',C.navy);pdf.roundedRect(x,y,w,22,8,8,'F');pdf.rect(x,y+11,w,11,'F');setFont(7.2,'bold',C.white);pdf.text(clean(title),x+9,y+15);const headerY=y+23,innerW=w-14,total=columns.reduce((sum,col)=>sum+col.ratio,0),maxRows=Math.max(1,Math.floor((h-39)/7.4)),rows=sourceRows.length>maxRows?[...sourceRows.slice(0,maxRows-1),[`+ ${sourceRows.length-maxRows+1} registros`,`Ver detalle dentro de APPI`,...(columns.length>2?Array(columns.length-2).fill(''):[])]]:sourceRows,rowH=Math.min(13,Math.max(7.4,(h-40)/Math.max(1,rows.length)));let cx=x+7;color('fill',[235,238,248]);pdf.rect(x+6,headerY,w-12,13,'F');for(const col of columns){const cw=innerW*col.ratio/total;setFont(5.5,'bold',C.muted);pdf.text(clip(col.label,cw-5,5.5),col.align==='right'?cx+cw-2:cx+2,headerY+9,{align:col.align==='right'?'right':'left'});cx+=cw}if(!rows.length){setFont(6.5,'normal',C.muted);pdf.text(clean(empty),x+9,headerY+27);return}rows.forEach((row,index)=>{const ry=headerY+14+index*rowH;if(index%2===0){color('fill',C.soft);pdf.rect(x+6,ry-1,w-12,rowH,'F')}let px=x+7;columns.forEach((col,colIndex)=>{const cw=innerW*col.ratio/total,value=row[colIndex]??'';setFont(Math.max(4.8,Math.min(6.1,rowH*.52)),colIndex===0?'bold':'normal',colIndex===columns.length-1?C.navy:C.ink);pdf.text(clip(value,cw-4,Math.max(4.8,Math.min(6.1,rowH*.52))),col.align==='right'?px+cw-2:px+2,ry+rowH*.65,{align:col.align==='right'?'right':'left'});px+=cw})})};
  periods.forEach(period=>{const prev=previousPeriodFor(period),summary=period.summary,ownerCat=titularCategory(period),cats=Object.keys(HIST_CAT_RANK).filter(cat=>period.people.some(p=>p.cat===cat)),sellers=[...period.people].sort((a,b)=>b.pnAct-a.pnAct).slice(0,10),orgs=[...period.people];if(ownerCat&&!titularInPeople(period))orgs.push({nombre:period.titular.nombre||'Titular del reporte',cat:ownerCat,totalPB:num(summary.pbPersonal),isTitular:true});orgs.sort((a,b)=>b.totalPB-a.totalPB);const topOrgs=orgs.slice(0,10),passes=['D','DC','CE','L','LE'].flatMap(cat=>passList(period,prev,cat).map(p=>[p.nombre,`${p.codigo} · a ${cat}`])),bonus=bonusQualifications(period).flatMap(group=>group.incomes.length?[[group.sponsor.nombre,`Bonus ${group.incomes.length===1?1:2} · ${group.incomes.length} ingreso${group.incomes.length===1?'':'s'}`]]:[]);addHeader(`Detalle mensual · ${period.label}`,`${summary.people} personas · ${summary.incomeCount} ingresos · Toda la información en una hoja`);const cardGap=8,cardW=(W-M*2-cardGap*4)/5;card(M,79,cardW,49,'PB equipo',`${fmt(summary.pbPersonal)} PB`,C.blue);card(M+(cardW+cardGap),79,cardW,49,'Actividad',`${summary.activePct}%`,C.green,`${summary.active}/${summary.people}`);card(M+(cardW+cardGap)*2,79,cardW,49,'Ingresos',String(summary.incomeCount),C.purple);card(M+(cardW+cardGap)*3,79,cardW,49,'Pendientes',fmt(summary.pending),C.amber);card(M+(cardW+cardGap)*4,79,cardW,49,'Vencidas',`${summary.expiredPct}%`,C.red,`${fmt(summary.expired)} de ${fmt(summary.presented)}`);const gap=8,topY=138,topH=180,panelW=(W-M*2-gap*2)/3;monthlyPanel(M,topY,panelW,topH,'Distribución del PB por categoría',[{label:'Categoría',ratio:1.4},{label:'Personas',ratio:.65,align:'right'},{label:'PB pers.',ratio:1,align:'right'}],cats.map(cat=>[cat,String(period.people.filter(p=>p.cat===cat).length),fmt(categoryPB(period,cat))]),'Sin categorías');monthlyPanel(M+panelW+gap,topY,panelW,topH,'Top 10 vendedores',[{label:'Persona',ratio:1.8},{label:'Cat.',ratio:.5},{label:'PB',ratio:.65,align:'right'}],sellers.map((p,i)=>[`${i+1}. ${p.nombre}`,p.cat,fmt(p.pnAct)]),'Sin vendedores');monthlyPanel(M+(panelW+gap)*2,topY,panelW,topH,'Top 10 organizaciones',[{label:'Persona',ratio:1.75},{label:'Cat.',ratio:.5},{label:'PB total',ratio:.75,align:'right'}],topOrgs.map((p,i)=>[`${i+1}. ${p.nombre}${p.isTitular?' (titular)':''}`,p.cat,fmt(p.totalPB)]),'Sin organizaciones');const bottomY=326,bottomH=198,bottomW=(W-M*2-gap)/2;monthlyPanel(M,bottomY,bottomW,bottomH,'Ingresos del mes',[{label:'Persona / DIP',ratio:1.65},{label:'Cat.',ratio:.42},{label:'Patrocinante',ratio:1.25}],(period.incomes||[]).map(item=>[`${item.nombre} · ${item.dip}`,item.cat||'-',item.patrocinanteNombre||item.patrocinanteDip||'-']),'No hubo ingresos');monthlyPanel(M+bottomW+gap,bottomY,bottomW,bottomH,'Pases y Bonus',[{label:'Persona',ratio:1.65},{label:'Detalle',ratio:1.3}],passes.concat(bonus),'No hubo pases ni Bonus')});
  const pages=pdf.getNumberOfPages();for(let page=1;page<=pages;page++){pdf.setPage(page);if(page>1){color('draw',C.line);pdf.line(M,PH-19,W-M,PH-19)}setFont(6.3,'normal',C.muted);pdf.text(`APPI · Informe completo ${year}`,M,PH-8);pdf.text(`Página ${page} de ${pages}`,W-M,PH-8,{align:'right'})}
  const blob=pdf.output('blob'),file=new File([blob],fileName,{type:'application/pdf'});if(navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:`Informe completo APPI ${year}`,text:`Informe completo ${year} generado por APPI, listo para compartir por WhatsApp.`});toast('Informe compartido',2300);return}catch(error){if(error&&error.name==='AbortError'){toast('Se canceló el envío del informe.',2200);return}}}pdf.save(fileName);toast('Informe PDF descargado. Ya podés compartirlo por WhatsApp.',3600)
}
function renderUnifiedAnalysis(){if(!H.periods.length)return '';let periods=selectedPeriods();if(!periods.length){H.periods.slice(-Math.min(2,H.periods.length)).forEach(p=>H.selected.add(p.id));periods=selectedPeriods()}const analysis=analyzePeriods(periods),latest=periods[periods.length-1],first=periods[0];return `<section id="histUnifiedAnalysis" class="hist-unified-analysis"><div class="hist-card"><div class="hist-card-head"><div><h3>Comparar y analizar</h3><p>Elegí los cierres que querés estudiar dentro del mismo resumen.</p></div><span class="hist-badge">${periods.length} seleccionados</span></div><div class="hist-picker-tools"><button data-pick="latest">Último</button><button data-pick="last2">Últimos 2</button><button data-pick="last6">Últimos 6</button><button data-pick="year">Año ${latest.year}</button><button data-pick="all">Todos</button></div><div class="hist-month-picker">${H.periods.map(p=>`<label class="hist-month-option"><input type="checkbox" value="${p.id}" ${H.selected.has(p.id)?'checked':''}><span>${SHORT_H[p.month]} ${String(p.year).slice(-2)}</span></label>`).join('')}</div><div class="hist-compare-strip"><div><span>PB del equipo</span><b>${fmt(latest.summary.pbPersonal)} PB</b><small class="${analysis.pbDelta.cls}">${esc(analysis.pbDelta.text)}</small></div><div><span>Actividad</span><b>${latest.summary.activePct}%</b><small class="${analysis.activeDelta.cls}">${esc(analysis.activeDelta.text)}</small></div><div><span>Personas</span><b>${latest.summary.people}</b><small class="${analysis.peopleDelta.cls}">${esc(analysis.peopleDelta.text)}</small></div><div><span>Ingresos</span><b>${latest.summary.incomeCount}</b><small class="${analysis.incomeDelta.cls}">${esc(analysis.incomeDelta.text)}</small></div><div><span>Pendientes</span><b>${fmt(latest.summary.pending)}</b><small class="${analysis.pendingDelta.cls}">${esc(analysis.pendingDelta.text)}</small></div></div></div><div class="hist-two-cols hist-analysis-charts"><div class="hist-card"><div class="hist-card-head"><div><h3>Actividad</h3><p>Porcentaje de personas activas</p></div></div>${lineChart(periods,'activePct','#3ad0a4','%')}</div><div class="hist-card"><div class="hist-card-head"><div><h3>Garantías pendientes</h3><p>Evolución entre cierres</p></div></div>${lineChart(periods,'pending','#f5b301','')}</div></div><div class="hist-card"><div class="hist-card-head"><div><h3>Evolución por categoría</h3><p>${esc(first.label)} comparado con ${esc(latest.label)}</p></div></div><div class="hist-table-wrap"><table class="hist-table" style="min-width:420px"><thead><tr><th>Categoría</th><th>${esc(SHORT_H[first.month])} ${first.year}</th><th>${esc(SHORT_H[latest.month])} ${latest.year}</th><th>Cambio</th></tr></thead><tbody>${categoryRows(first,latest)}</tbody></table></div></div><div class="hist-card"><div class="hist-card-head"><div><h3>Cambios individuales</h3><p>${analysis.improved} mejoraron · ${analysis.declined} bajaron · ${analysis.newPeople} nuevos</p></div><span class="hist-badge">${analysis.changes.length} personas</span></div><div class="hist-search"><input id="histPersonSearch" value="${esc(H.personSearch)}" placeholder="Buscar persona o código…"></div><div class="hist-table-wrap"><table class="hist-table"><thead><tr><th>Persona</th><th>Categoría</th><th>PB inicial</th><th>PB final</th><th>Cambio</th><th>Equipo</th></tr></thead><tbody id="histPersonRows">${personRows(analysis.changes,H.personSearch)}</tbody></table></div></div></section>`}
function bindUnifiedAnalysis(root){root.querySelectorAll('#histUnifiedAnalysis .hist-month-option input').forEach(input=>input.onchange=()=>{input.checked?H.selected.add(input.value):H.selected.delete(input.value);if(!H.selected.size)H.selected.add(input.value);render()});root.querySelectorAll('#histUnifiedAnalysis [data-pick]').forEach(button=>button.onclick=()=>pickPeriods(button.dataset.pick));const search=$('histPersonSearch');if(search)search.oninput=event=>{H.personSearch=event.target.value;const periods=selectedPeriods(),analysis=periods.length?analyzePeriods(periods):null;if(analysis&&$('histPersonRows'))$('histPersonRows').innerHTML=personRows(analysis.changes,H.personSearch)};root.querySelectorAll('[data-hist-scroll-analysis]').forEach(button=>button.onclick=()=>document.getElementById('histUnifiedAnalysis')?.scrollIntoView({behavior:'smooth',block:'start'}))}

const HIST_COLLAPSE_KEY='hist_dashboard_collapsed_v1';
function collapsedPreferences(){try{return JSON.parse(localStorage.getItem(HIST_COLLAPSE_KEY)||'{}')}catch(e){return {}}}
function enableDashboardCollapsibles(root){const preferences=collapsedPreferences();root.querySelectorAll('.hist-card').forEach((card,index)=>{const head=card.querySelector(':scope > .hist-card-head');if(!head||card.dataset.collapsibleReady)return;const title=head.querySelector('h3')?.textContent?.trim()||`Sección ${index+1}`,key=normalize(title).replace(/\b20\d{2}\b/g,'').trim()||`section-${index}`,defaultCollapsed=/cambios individuales/i.test(title),collapsed=Object.prototype.hasOwnProperty.call(preferences,key)?!!preferences[key]:defaultCollapsed,content=document.createElement('div');content.className='hist-collapsible-content';while(head.nextSibling)content.appendChild(head.nextSibling);card.appendChild(content);const button=document.createElement('button');button.type='button';button.className='hist-collapse-btn';button.setAttribute('aria-expanded',String(!collapsed));button.innerHTML=collapsed?'<span>＋</span> Mostrar':'<span>−</span> Minimizar';head.appendChild(button);const apply=value=>{card.classList.toggle('hist-collapsed',value);content.hidden=value;button.setAttribute('aria-expanded',String(!value));button.innerHTML=value?'<span>＋</span> Mostrar':'<span>−</span> Minimizar'};apply(collapsed);button.onclick=()=>{const value=!card.classList.contains('hist-collapsed');apply(value);const next=collapsedPreferences();next[key]=value;localStorage.setItem(HIST_COLLAPSE_KEY,JSON.stringify(next))};card.dataset.collapsibleReady='1'})}

function renderDashboard(c){
  const {latest,previous}=latestPair();
  if(!latest){c.innerHTML=`<div class="hist-hero"><div class="eyebrow">Nuevo módulo</div><h2>Tu evolución, mes a mes</h2><p>Guardá los tres archivos de cada cierre y convertí todo el año en indicadores, comparaciones y acciones concretas.</p><div class="hist-hero-actions"><button data-go="cargar">Cargar primer mes</button></div></div><div class="hist-empty"><div class="ico">▦</div><h3>Todavía no hay cierres mensuales</h3><p>Para comenzar necesitás Línea Descendente, Garantías por Organización e Ingresos del mismo período.</p><button class="hist-primary" data-go="cargar">Crear primer cierre</button></div>`;bindGo(c);return}
  const s=latest.summary;
  const yearPeriods=H.periods.filter(p=>p.year===latest.year),strategies=buildStrategies(H.periods.slice(-Math.min(6,H.periods.length))),topBranch=(s.branches||[])[0],branchShare=topBranch&&s.pbPersonal?pct(topBranch.pb,s.pbPersonal):0;
  const previousPeople=new Map((previous&&previous.people||[]).map(p=>[p.matchKey,p])),inactive2=latest.people.filter(p=>p.pnAct===0&&previousPeople.get(p.matchKey)&&previousPeople.get(p.matchKey).pnAct===0),highPending=latest.people.filter(p=>num(p.garantias&&p.garantias.pendientes)>=10);
  c.innerHTML=`
    <div class="hist-hero"><div class="eyebrow">Último cierre · ${esc(latest.label)}</div><h2>Histórico y análisis</h2><p>${s.people} personas · ${s.active} activas · ${fmt(s.pbPersonal)} PB · ${s.incomeCount} ingresos. Todo el año y sus comparaciones están reunidos en esta pantalla.</p><div class="hist-hero-actions"><button data-go="cargar">＋ Cargar o administrar meses</button><button class="secondary" data-hist-scroll-analysis>Comparar períodos</button></div></div>
    <div class="hist-card hist-attention-card"><div class="hist-card-head"><div><h3>Atención requerida</h3><p>Qué conviene revisar primero</p></div></div><div class="hist-attention-grid">
      ${previous?histAttention('#d9535a','!',`${inactive2.length} personas con dos meses sin actividad`,'Ver las personas y abrir cada ficha','inactive2'):'<div class="hist-attention hist-info-attention" style="--tone:#5b8def"><span>i</span><div><strong>La comparación comienza con el próximo cierre</strong><small>Con dos meses podremos detectar inactividad consecutiva.</small></div></div>'}
      ${histAttention('#e99a20','◷',`${s.incomeNoPurchase} ingresos sin compra posterior`,'Revisar acompañamiento inicial','incomeNoPurchase')}
      ${histAttention('#8a63e6','▤',`${highPending.length} personas con muchos pendientes`,'Ordenadas por cantidad de garantías','highPending')}
      ${histAttention('#5b8def','↗',`${branchShare}% del PB está en la rama principal`,'Ver la rama y sus integrantes','topBranch')}
    </div></div>
    ${renderAnnualSummary(latest.year)}
    <div class="hist-card"><div class="hist-card-head"><div><h3>Evolución de PB ${latest.year}</h3><p>PB del equipo registrado en cada cierre, con el valor de cada mes.</p></div><span class="hist-badge">${yearPeriods.length}/12 cierres</span></div>${lineChart(yearPeriods,'pbPersonal','#5b8def',' PB')}</div>
    <div class="hist-card"><div class="hist-card-head"><div><h3>Evolución de Ingresos ${latest.year}</h3><p>Cantidad de ingresos registrada en cada cierre mensual.</p></div><span class="hist-badge">${yearPeriods.reduce((sum,p)=>sum+p.summary.incomeCount,0)} total</span></div>${lineChart(yearPeriods,'incomeCount','#a06bff','')}</div>
    ${renderUnifiedAnalysis()}
    <div class="hist-card"><div class="hist-card-head"><div><h3>Próximas acciones</h3><p>Recomendaciones basadas en los datos</p></div><button class="hist-mini-btn" data-hist-scroll-analysis>Revisar comparación</button></div><div class="hist-strategies">${strategies.slice(0,3).map(strategyHtml).join('')}</div></div>
    <section class="hist-full-report-cta"><span class="hist-report-mark">PDF</span><div><h3>Informe completo ${latest.year}</h3><p>Resumen anual, gráficos, indicadores, rankings, ingresos, pases, Bonus y recomendaciones en un documento profesional listo para compartir.</p></div><button type="button" data-hist-full-report="${latest.year}">Generar y compartir PDF</button></section>`;
  bindGo(c);bindDashboardDrill(c,latest,previous,topBranch);bindUnifiedAnalysis(c);enableDashboardCollapsibles(c);
}
function histAttention(tone,icon,title,desc,type){return `<button class="hist-attention" style="--tone:${tone}" data-hist-drill="${type}"><span>${icon}</span><div><strong>${esc(title)}</strong><small>${esc(desc)}</small></div><em>Ver datos ›</em></button>`}
function bindDashboardDrill(root,period,previous,topBranch){
  root.querySelectorAll('[data-hist-drill]').forEach(btn=>btn.onclick=()=>openHistDrill(btn.dataset.histDrill,period,previous,topBranch));
  root.querySelectorAll('[data-hist-sponsor]').forEach(btn=>btn.onclick=()=>openHistSponsor(btn.dataset.histSponsor,period));
  root.querySelectorAll('[data-hist-annual]').forEach(btn=>btn.onclick=()=>openAnnualDrill(btn.dataset.histAnnual,btn.dataset.periodId,+btn.dataset.year||period.year));
  root.querySelectorAll('[data-hist-share-pdf]').forEach(btn=>btn.onclick=async()=>{const original=btn.innerHTML;btn.disabled=true;btn.innerHTML='<span>PDF</span> Generando…';try{await shareAnnualPdf(+btn.dataset.histSharePdf)}catch(error){console.error('PDF anual',error);toast('No se pudo generar el PDF anual.',3200)}finally{btn.disabled=false;btn.innerHTML=original}});
  root.querySelectorAll('[data-hist-full-report]').forEach(btn=>btn.onclick=async()=>{const original=btn.textContent;btn.disabled=true;btn.textContent='Generando informe…';try{await shareFullHistoricalReport(+btn.dataset.histFullReport)}catch(error){console.error('Informe PDF completo',error);toast('No se pudo generar el informe completo.',3400)}finally{btn.disabled=false;btn.textContent=original}});
}
function previousPeriodFor(period){return H.periods.filter(p=>p.id<period.id).sort((a,b)=>b.id.localeCompare(a.id))[0]||null}
function openAnnualDrill(rowId,periodId,year){const def=annualRows(year).find(r=>r.id===rowId)||{label:'Detalle'};
  if(periodId==='all'){const periods=H.periods.filter(p=>p.year===year).sort((a,b)=>a.id.localeCompare(b.id));let previous=null;const html=periods.map(p=>{const value=annualValue(rowId,p,previous);previous=p;return `<button class="hist-data-row hist-month-data" data-annual-open="${p.id}"><span class="hist-data-avatar">${SHORT_H[p.month]}</span><span><strong>${esc(p.label)}</strong><small>${esc(def.label)}</small></span><b>${def.unit==='pb'?fmt(value):Math.round(value)} ›</b></button>`}).join('');openHistDrawer(`${def.label} · Total anual`,`${year} · Tocá un mes para ver el detalle`,`<div class="hist-data-list">${html||'<div class="hist-empty">Sin cierres</div>'}</div>`);document.querySelectorAll('#histDetailBody [data-annual-open]').forEach(b=>b.onclick=()=>openAnnualDrill(rowId,b.dataset.annualOpen,year));return}
  const period=H.periods.find(p=>p.id===periodId);if(!period)return;const previous=previousPeriodFor(period);let html='',sub=period.label,people=[],bindPeriod=period;
  if(rowId==='ownerOrg'){const cat=titularCategory(period),organizations=[{key:'titular',nombre:period.titular.nombre||'Titular del reporte',codigo:period.titular.dip||'',cat,totalPB:num(period.summary.pbPersonal),isTitular:true},...period.people].sort((a,b)=>b.totalPB-a.totalPB).slice(0,10);sub=`${fmt(period.summary.pbPersonal)} PB · cada persona del padrón contada una vez`;html=`<div class="hist-data-row hist-static-row"><span class="hist-data-avatar">TI</span><span><strong>${esc(period.titular.nombre||'Titular del reporte')}</strong><small>${esc(period.titular.dip||'')} · ${esc(HIST_CAT_LABEL[cat]||cat||'Titular')}</small></span><b>${fmt(period.summary.pbPersonal)} PB org.</b></div><h3 class="hist-ranking-title second">Top 10 organizaciones internas</h3>${organizations.filter(p=>!p.isTitular).map(p=>histPersonRow(p,`${fmt(p.totalPB)} PB org.`)).join('')}`}
  else if(rowId.startsWith('orgcat:')){const cat=rowId.split(':')[1],all=period.people.filter(p=>p.cat===cat),sellers=[...all].sort((a,b)=>b.pnAct-a.pnAct).slice(0,10),organizations=[...all];if(titularCategory(period)===cat&&!titularInPeople(period))organizations.push({key:'titular',nombre:period.titular.nombre||'Titular del reporte',codigo:period.titular.dip||'',cat,totalPB:num(period.summary.pbPersonal),isTitular:true});organizations.sort((a,b)=>b.totalPB-a.totalPB);const topOrganizations=organizations.slice(0,10),orgHtml=topOrganizations.map(p=>p.isTitular?`<div class="hist-data-row hist-static-row"><span class="hist-data-avatar">TI</span><span><strong>${esc(p.nombre)}</strong><small>${esc(p.codigo)} · Titular · ${esc(cat)}</small></span><b>${fmt(p.totalPB)} PB org.</b></div>`:histPersonRow(p,`${fmt(p.totalPB)} PB org.`)).join('');sub=`${fmt(categoryPB(period,cat))} PB personales · ${all.length} ${all.length===1?'persona':'personas'} categoría ${cat}`;html=`<h3 class="hist-ranking-title">Top 10 vendedores</h3>${sellers.map(p=>histPersonRow(p,`${fmt(p.pnAct)} PB`)).join('')||'<div class="hist-empty">El PB Personal del titular no está disponible en el reporte.</div>'}<h3 class="hist-ranking-title second">Top 10 organizaciones</h3>${orgHtml||'<div class="hist-empty">Sin organizaciones.</div>'}`}
  else if(rowId==='incomePersonal'||rowId==='incomeOrg'){ const personal=new Set(incomePersonalList(period).map(i=>i.matchKey)),items=(period.incomes||[]).filter(i=>rowId==='incomePersonal'?personal.has(i.matchKey):!personal.has(i.matchKey));html=items.map(histIncomeRow).join('')}
  else if(rowId==='purged'){const before=new Map((previous&&previous.people||[]).map(p=>[p.matchKey,p])),current=new Set(period.people.map(p=>p.matchKey)),missing=[...before.values()].filter(p=>!current.has(p.matchKey)),net=annualValue(rowId,period,previous);sub=`${net} depurados netos · ${missing.length} DIPs dejaron de aparecer`;bindPeriod=previous||period;html=`<div class="hist-drill-note">El valor mensual es la disminución neta entre ${previous?previous.summary.people:0} y ${period.summary.people} personas.</div>${missing.map(p=>histPersonRow(p,'No aparece')).join('')}`}
  else if(rowId.startsWith('pass:')){people=passList(period,previous,rowId.split(':')[1]);html=people.map(p=>histPersonRow(p,`Pasó a ${p.cat}`)).join('')}
  else if(rowId==='bonus1'||rowId==='bonus2'){const level=rowId==='bonus1'?1:2,groups=bonusQualifications(period).filter(g=>level===1?g.incomes.length===1:g.incomes.length>=2);html=groups.map(g=>`<section class="hist-bonus-winner"><button data-hist-person="${esc(g.sponsor.key)}"><span><strong>${esc(g.sponsor.nombre)}</strong><small>${esc(g.sponsor.codigo)} · ${esc(g.sponsor.cat)} · ${fmt(g.sponsor.pnAct)} PB personales</small></span><b>Bonus ${level} ›</b></button><div><h4>Ingresos que calificaron</h4>${g.incomes.map(item=>`<button class="hist-bonus-income" data-hist-person="${esc(item.entrant.key)}"><span><strong>${esc(item.entrant.nombre)}</strong><small>${esc(item.entrant.codigo)}</small></span><b>${fmt(item.entrant.pnAct)} PB ›</b></button>`).join('')}</div></section>`).join('')}
  if(!html)html='<div class="hist-empty">No hay datos para este indicador en el mes.</div>';openHistDrawer(def.label,sub,`<div class="hist-drill-note">El número se calculó automáticamente con los archivos de este cierre.</div><div class="hist-data-list">${html}</div>`);bindHistRows(bindPeriod)}
function ensureHistDrawer(){
  let overlay=document.getElementById('histDetailOverlay');if(overlay)return overlay;
  overlay=document.createElement('div');overlay.id='histDetailOverlay';overlay.className='hist-detail-overlay';overlay.innerHTML='<aside class="hist-detail-drawer" role="dialog" aria-modal="true"><div class="hist-detail-head"><div><h2 id="histDetailTitle">Detalle</h2><p id="histDetailSub"></p></div><button type="button" id="histDetailClose" aria-label="Cerrar">×</button></div><div id="histDetailBody"></div></aside>';document.body.appendChild(overlay);
  overlay.onclick=e=>{if(e.target===overlay)closeHistDrawer()};overlay.querySelector('#histDetailClose').onclick=closeHistDrawer;document.addEventListener('keydown',e=>{if(e.key==='Escape')closeHistDrawer()});return overlay;
}
function openHistDrawer(title,sub,html){const overlay=ensureHistDrawer();overlay.querySelector('#histDetailTitle').textContent=title;overlay.querySelector('#histDetailSub').textContent=sub||'';overlay.querySelector('#histDetailBody').innerHTML=html;overlay.classList.add('open');overlay.querySelector('#histDetailClose').focus()}
function closeHistDrawer(){document.getElementById('histDetailOverlay')?.classList.remove('open')}
function histPersonRow(p,value){return `<button class="hist-data-row" data-hist-person="${esc(p.key)}"><span class="hist-data-avatar">${esc(String(p.nombre||'?').split(/[ ,]+/).filter(Boolean).slice(0,2).map(x=>x[0]).join(''))}</span><span><strong>${esc(p.nombre)}</strong><small>${esc(p.codigo||'Sin DIP')} · ${esc(p.cat||'Sin categoría')}</small></span><b>${esc(value||`${fmt(p.pnAct)} PB`)} ›</b></button>`}
function histIncomeRow(item){return `<button class="hist-data-row" data-hist-income="${esc(item.matchKey)}"><span class="hist-data-avatar income">IN</span><span><strong>${esc(item.nombre)}</strong><small>${esc(item.dip)} · Patrocina ${esc(item.patrocinanteNombre||'—')}</small></span><b>${item.compraPosterior?`${item.diasHastaCompra} días`:'Sin compra'} ›</b></button>`}
function openHistDrill(type,period,previous,topBranch){
  let title='Detalle',sub=`Cierre ${period.label}`,html='',people=[...period.people],incomes=[...(period.incomes||[])];
  if(type==='pb'){title='Aporte de PB';people.sort((a,b)=>b.pnAct-a.pnAct);html=people.map(p=>histPersonRow(p,`${fmt(p.pnAct)} PB`)).join('')}
  else if(type==='active'){title='Personas activas';people=people.filter(p=>p.pnAct>0).sort((a,b)=>b.pnAct-a.pnAct);sub=`${people.length} de ${period.people.length} personas`;html=people.map(p=>histPersonRow(p,`${fmt(p.pnAct)} PB`)).join('')}
  else if(type==='pending'){title='Garantías pendientes';people=people.filter(p=>num(p.garantias&&p.garantias.pendientes)>0).sort((a,b)=>num(b.garantias.pendientes)-num(a.garantias.pendientes));html=people.map(p=>histPersonRow(p,`${fmt(p.garantias.pendientes)} pend.`)).join('')}
  else if(type==='inactive2'){title='Inactividad consecutiva';const prev=new Map((previous&&previous.people||[]).map(p=>[p.matchKey,p]));people=people.filter(p=>p.pnAct===0&&prev.get(p.matchKey)&&prev.get(p.matchKey).pnAct===0);sub='Cero PB en los dos últimos cierres';html=people.map(p=>histPersonRow(p,'2 meses')).join('')}
  else if(type==='highPending'){title='Pendientes prioritarios';people=people.filter(p=>num(p.garantias&&p.garantias.pendientes)>=10).sort((a,b)=>num(b.garantias.pendientes)-num(a.garantias.pendientes));html=people.map(p=>histPersonRow(p,`${fmt(p.garantias.pendientes)} pend.`)).join('')}
  else if(type==='topBranch'){title=topBranch?`Rama de ${topBranch.name}`:'Rama principal';people=people.filter(p=>(p.branchKey||p.key)===(topBranch&&topBranch.key));sub=topBranch?`${fmt(topBranch.pb)} PB · ${topBranch.people} personas`:sub;html=people.map(p=>histPersonRow(p)).join('')}
  else {if(type==='incomeNoPurchase'){title='Ingresos sin compra posterior';incomes=incomes.filter(i=>!i.compraPosterior)}else if(type==='incomeTraining'){title='Ingresos en capacitación';incomes=incomes.filter(i=>i.capacitacion>0)}else if(type==='incomeIncomplete'){title='Contactos incompletos';incomes=incomes.filter(i=>!i.contactoCompleto)}else title='Ingresos del mes';sub=incomes.length?`${incomes.length} personas del archivo Ingresos`:'No hubo ingresos en este cierre';html=incomes.map(histIncomeRow).join('')||'<div class="hist-empty">No hubo ingresos.</div>'}
  if(!html)html='<div class="hist-empty">No hay personas en esta condición.</div>';openHistDrawer(title,sub,`<div class="hist-drill-note">Esta lista contiene exactamente los datos que originaron el indicador.</div><div class="hist-data-list">${html}</div>`);bindHistRows(period)
}
function openHistSponsor(key,period){const sponsor=(period.summary.incomeSponsors||[]).find(s=>s.key===key),items=(period.incomes||[]).filter(i=>(i.patrocinanteDip||i.patrocinanteNombre||'Sin patrocinante')===key);openHistDrawer(sponsor?sponsor.name:'Patrocinante',`${items.length} ingresos · ${sponsor&&sponsor.dip||''}`,`<div class="hist-data-list">${items.map(histIncomeRow).join('')}</div>`);bindHistRows(period)}
function bindHistRows(period){document.querySelectorAll('#histDetailBody [data-hist-person]').forEach(b=>b.onclick=()=>openHistPerson(b.dataset.histPerson,period));document.querySelectorAll('#histDetailBody [data-hist-income]').forEach(b=>b.onclick=()=>{const item=(period.incomes||[]).find(i=>i.matchKey===b.dataset.histIncome);if(item&&item.linkedPersonKey)openHistPerson(item.linkedPersonKey,period);else if(item)openHistIncome(item,period)})}
function openHistPerson(key,period){const p=period.people.find(x=>x.key===key);if(!p)return;const income=(period.incomes||[]).find(i=>i.matchKey===p.matchKey),digits=String(p.tel||income&&income.telefono||'').replace(/\D/g,'');openHistDrawer(p.nombre,`${p.codigo||'Sin DIP'} · Categoría ${p.cat||'—'}`,`<div class="hist-person-kpis"><div><b>${fmt(p.pnAct)} PB</b><span>PB Personal</span></div><div><b>${fmt(p.teamPB)} PB</b><span>PB de Equipo</span></div><div><b>${fmt(p.garantias&&p.garantias.pendientes)}</b><span>Pendientes</span></div><div><b>${income?'Sí':'No'}</b><span>Ingreso del mes</span></div></div>${income?`<div class="hist-drill-note"><b>Fecha de alta:</b> ${esc(income.fechaAlta||'—')}<br><b>Última compra:</b> ${esc(income.ultimaCompra||'—')}<br><b>Patrocinante:</b> ${esc(income.patrocinanteNombre||'—')}</div>`:''}<div class="hist-contact-actions"><a class="wa" href="${digits?`https://wa.me/${digits}`:'#'}" ${digits?'target="_blank"':''}>WhatsApp</a><a class="call" href="${digits?`tel:${digits}`:'#'}">Llamar</a></div>`)}
function openHistIncome(item,period){const digits=String(item.telefono||'').replace(/\D/g,'');openHistDrawer(item.nombre,`${item.dip} · Ingreso de ${period.label}`,`<div class="hist-person-kpis"><div><b>${esc(item.cat||'—')}</b><span>Categoría</span></div><div><b>${item.compraPosterior?'Sí':'No'}</b><span>Compra posterior</span></div><div><b>${item.diasHastaCompra===null?'—':item.diasHastaCompra}</b><span>Días hasta compra</span></div><div><b>${item.capacitacion?'Sí':'No'}</b><span>Capacitación</span></div></div><div class="hist-drill-note"><b>Alta:</b> ${esc(item.fechaAlta||'—')}<br><b>Última compra:</b> ${esc(item.ultimaCompra||'—')}<br><b>Patrocinante:</b> ${esc(item.patrocinanteNombre||'—')} · ${esc(item.patrocinanteDip||'')}</div><div class="hist-contact-actions"><a class="wa" href="${digits?`https://wa.me/${digits}`:'#'}" ${digits?'target="_blank"':''}>WhatsApp</a><a class="call" href="${digits?`tel:${digits}`:'#'}">Llamar</a></div>`)}
function bindGo(root){root.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>openTab(b.dataset.go))}

function periodLibraryHtml(){return `<div class="hist-card hist-period-library"><div class="hist-card-head"><div><h3>Meses guardados</h3><p>${H.periods.length} cierres con sus archivos originales</p></div><span class="hist-badge">Administrar</span></div>${H.periods.length?`<div class="hist-period-list">${[...H.periods].reverse().map(periodRow).join('')}</div>`:`<div class="hist-empty"><h3>Sin cierres guardados</h3><p>Completá los tres archivos de un mes para comenzar.</p></div>`}</div><div class="hist-card"><div class="hist-card-head"><div><h3>Respaldo completo</h3><p>Incluye estadísticas y los archivos originales.</p></div></div><div class="hist-actions"><button class="hist-primary" id="histBackupAll" ${H.periods.length?'':'disabled'}>Descargar backup ZIP</button><button class="hist-secondary" id="histRestore">Restaurar ZIP</button></div></div>`}
function renderUpload(c){
  const year=H.uploadYear,saved=H.periods.filter(p=>p.year===year).length;
  c.innerHTML=`<div class="hist-card hist-year-card"><div class="hist-card-head"><div><h3>Cierres mensuales ${year}</h3><p>Cada mes tiene un casillero para cada archivo.</p></div><span class="hist-badge">${saved}/12 guardados</span></div>
    <div class="hist-year-nav"><button id="histPrevYear" aria-label="Año anterior">‹</button><select id="histAnnualYear">${yearOptions(year)}</select><button id="histNextYear" aria-label="Año siguiente">›</button></div>
    <div class="hist-annual-progress"><span style="width:${Math.round(saved/12*100)}%"></span></div>
    <div class="hist-annual-help"><b>Cómo cargar:</b> elegí los tres archivos dentro del mes correspondiente. Cada archivo correcto mostrará un check verde. Después guardá ese mes.</div>
  </div>
  <div class="hist-annual-grid">${MONTHS_H.map((_,month)=>monthUploadCard(year,month)).join('')}</div>
  <div class="hist-card"><div class="hist-card-head"><div><h3>Datos actuales de APPI</h3><p>Podés convertir Mi Equipo y sus garantías ya cargadas en el cierre del mes actual.</p></div></div><button class="hist-secondary" id="histUseCurrent">Usar datos actuales en ${MONTHS_H[new Date().getMonth()]}</button></div>
  ${periodLibraryHtml()}`;
  $('histAnnualYear').onchange=e=>{H.uploadYear=+e.target.value;render()};$('histPrevYear').onclick=()=>{H.uploadYear--;render()};$('histNextYear').onclick=()=>{H.uploadYear++;render()};
  c.querySelectorAll('[data-file-slot]').forEach(slot=>{
    const id=slot.dataset.periodId,type=slot.dataset.type;
    slot.onclick=()=>{H.fileTarget={id,type};$(FILE_TYPES[type].input).click()};
    slot.ondragover=e=>{e.preventDefault();slot.classList.add('drag')};slot.ondragleave=()=>slot.classList.remove('drag');slot.ondrop=e=>{e.preventDefault();slot.classList.remove('drag');const f=e.dataTransfer.files&&e.dataTransfer.files[0];if(f)handleFile(type,f,id)};
  });
  c.querySelectorAll('[data-save-month]').forEach(btn=>btn.onclick=()=>saveMonthPeriod(btn.dataset.saveMonth));
  $('histUseCurrent').onclick=useCurrentData;bindPeriodRows(c);if($('histBackupAll'))$('histBackupAll').onclick=exportAllZip;if($('histRestore'))$('histRestore').onclick=()=>$('histRestoreInput').click();
}
function monthUploadCard(year,month){
  const id=periodId(year,month),existing=H.periods.find(p=>p.id===id),draft=H.uploads[id],changed=!!(draft&&draft.changed);
  const fileState=type=>{
    const status=draft&&draft.status[type],parsed=draft&&draft.parsed[type],file=draft&&draft.files[type],saved=!!(existing&&existing.filesMeta&&existing.filesMeta.some(f=>f.type===type));
    if(status==='loading')return {kind:'loading',label:'Procesando…',detail:file&&file.name||'Leyendo archivo'};
    if(status&&status.error)return {kind:'error',label:'Reintentar',detail:status.error};
    if(parsed){const noIncome=type==='ingresos'&&parsed.result&&parsed.result.ingresos.length===0;return {kind:'ready',label:noIncome?'✓ Recibido · No hubo ingresos':'✓ Archivo correcto',detail:file&&file.name||'Validado'}}
    if(saved){const meta=existing.filesMeta.find(f=>f.type===type),noIncome=type==='ingresos'&&existing.summary&&existing.summary.incomeCount===0;return {kind:'saved',label:noIncome?'✓ Recibido · No hubo ingresos':'✓ Guardado',detail:meta&&meta.name||'Archivo del cierre'}};
    return {kind:'empty',label:'Cargar archivo',detail:'Excel o CSV'};
  };
  const states=Object.fromEntries(Object.keys(FILE_TYPES).map(t=>[t,fileState(t)])),count=Object.values(states).filter(x=>x.kind==='ready'||x.kind==='saved').length;
  const canSave=changed&&count===3,complete=!!existing&&count===3&&!changed,incompleteSaved=!!existing&&count<3;
  return `<article class="hist-month-card ${complete?'complete':''} ${changed||incompleteSaved?'editing':''}" data-month-card="${id}">
    <div class="hist-month-head"><div><span>${SHORT_H[month]}</span><h3>${MONTHS_H[month]}</h3></div><strong class="hist-month-count ${count===3?'done':''}">${count}/3</strong></div>
    <div class="hist-month-files">${Object.entries(FILE_TYPES).map(([type,cfg])=>monthFileSlot(id,type,cfg,states[type])).join('')}</div>
    <div class="hist-month-foot"><small>${complete?'Cierre guardado':incompleteSaved?'Cierre anterior: falta Ingresos':changed?(count===3?'Listo para guardar':'Carga en progreso'):'Sin cargar'}</small><button class="${canSave?'hist-primary':'hist-secondary'}" data-save-month="${id}" ${canSave?'':'disabled'}>${complete?'Guardado':existing?'Completar mes':'Guardar mes'}</button></div>
  </article>`;
}
function monthFileSlot(id,type,cfg,state){
  const icon=state.kind==='ready'||state.kind==='saved'?'✓':state.kind==='loading'?'…':state.kind==='error'?'!':cfg.icon;
  return `<button type="button" class="hist-file-slot ${state.kind}" data-file-slot data-period-id="${id}" data-type="${type}"><span class="hist-file-check">${icon}</span><span><b>${esc(cfg.label)}</b><small>${esc(state.label)} · ${esc(state.detail)}</small></span></button>`;
}
function yearOptions(selected){const y=new Date().getFullYear(),values=new Set([selected]);for(let n=y+2;n>=y-12;n--)values.add(n);return [...values].sort((a,b)=>b-a).map(n=>`<option value="${n}" ${n===selected?'selected':''}>${n}</option>`).join('')}
async function handleFile(type,file,id){
  if(!file||!id)return;const [year,mo]=id.split('-').map(Number),draft=getMonthDraft(year,mo-1);draft.files[type]=file;draft.status[type]='loading';draft.changed=true;delete draft.parsed[type];render();
  try{draft.parsed[type]=await parseHistoricalFile(type,file);draft.status[type]='ready';const emptyIncome=type==='ingresos'&&draft.parsed[type].result.ingresos.length===0;toast(emptyIncome?`✓ Ingresos recibido · No hubo ingresos`:`✓ ${FILE_TYPES[type].label} · ${MONTHS_H[draft.month]}`,emptyIncome?2600:1800)}catch(e){console.error('Histórico archivo',type,e);draft.status[type]={error:e.message};delete draft.parsed[type];toast(e.message,3200)}render();
}
async function useCurrentData(){
  const currentTeam=(()=>{try{return JSON.parse(localStorage.getItem('equipoData')||'null')}catch(e){return null}})();
  if(!currentTeam||!currentTeam.personas||!currentTeam.personas.length){toast('No hay una Línea Descendente cargada actualmente',3000);return}
  if(!currentTeam.personas.some(p=>p.garantias)){toast('Los datos actuales no incluyen Garantías por Organización',3000);return}
  const month=new Date().getMonth(),year=H.uploadYear,id=periodId(year,month),draft=getMonthDraft(year,month),map={};currentTeam.personas.forEach(p=>{if(p.codigo&&p.garantias)map[p.codigo]=cloneClean(p.garantias)});
  draft.parsed={equipo:{result:currentTeam,detail:`${currentTeam.personas.length} personas de APPI`},garantias:{result:{garantiasMap:map},detail:`${Object.keys(map).length} garantías de APPI`}};
  const makeVirtual=(name,type)=>new File([JSON.stringify({source:'APPI actual',type})],name,{type:'application/json',lastModified:Date.now()});
  draft.files={equipo:makeVirtual('linea_actual_APPI.json','equipo'),garantias:makeVirtual('garantias_actual_APPI.json','garantias')};draft.status={equipo:'ready',garantias:'ready'};draft.changed=true;render();toast(`LD y GO listos en ${MONTHS_H[month]}. Falta Ingresos.`,2600);
}

function periodRow(p){
  const s=p.summary||{},open=H.openMenu===p.id;return `<div class="hist-period" data-period="${p.id}"><div class="hist-period-date"><div><b>${SHORT_H[p.month]}</b><small>${p.year}</small></div></div><div class="hist-period-info"><h4>${esc(p.label)}</h4><p>${fmt(s.people)} personas · ${s.activePct||0}% activas · ${fmt(s.pbPersonal)} PB</p><div class="file-flags"><span>LD</span><span>GO</span><span>IN</span></div></div><div class="hist-period-actions"><button class="hist-more" data-more="${p.id}" aria-label="Opciones">⋯</button></div>${open?`<div class="hist-action-menu"><button data-pa="analyze">Ver en resumen</button><button data-pa="equipo">Descargar LD</button><button data-pa="garantias">Descargar GO</button><button data-pa="ingresos">Descargar IN</button><button data-pa="zip">ZIP del mes</button><button data-pa="delete" class="danger">Eliminar</button></div>`:''}</div>`;
}
function renderPeriods(c){
  c.innerHTML=`<div class="hist-card"><div class="hist-card-head"><div><h3>Biblioteca de cierres</h3><p>${H.periods.length} períodos guardados con sus archivos originales</p></div><button class="hist-mini-btn" data-go="cargar">＋ Nuevo</button></div>${H.periods.length?`<div class="hist-period-list">${[...H.periods].reverse().map(periodRow).join('')}</div>`:`<div class="hist-empty"><h3>Sin cierres</h3><p>Cargá el primer mes para comenzar.</p><button class="hist-primary" data-go="cargar">Cargar mes</button></div>`}</div>
  <div class="hist-card"><div class="hist-card-head"><div><h3>Respaldo completo</h3><p>Incluye estadísticas y los tres archivos originales de cada mes.</p></div></div><div class="hist-actions"><button class="hist-primary" id="histBackupAll" ${H.periods.length?'':'disabled'}>Descargar backup ZIP</button><button class="hist-secondary" id="histRestore">Restaurar ZIP</button></div></div>`;
  bindGo(c);bindPeriodRows(c);$('histBackupAll').onclick=exportAllZip;$('histRestore').onclick=()=>$('histRestoreInput').click();
}
function bindPeriodRows(root){
  root.querySelectorAll('[data-more]').forEach(b=>b.onclick=e=>{e.stopPropagation();H.openMenu=H.openMenu===b.dataset.more?'':b.dataset.more;render()});
  root.querySelectorAll('.hist-action-menu').forEach(menu=>menu.querySelectorAll('[data-pa]').forEach(b=>b.onclick=async()=>{
    const row=b.closest('[data-period]'),id=row.dataset.period,action=b.dataset.pa;
    if(action==='analyze'){H.selected=new Set([id]);H.openMenu='';openTab('analizar')}
    else if(['equipo','garantias','ingresos'].includes(action))await downloadOriginal(id,action);
    else if(action==='zip')await exportPeriodZip(id);
    else if(action==='delete'&&confirm(`¿Eliminar ${H.periods.find(p=>p.id===id)?.label||id} y sus tres archivos?`)){await deletePeriod(id);H.openMenu='';render();toast('Cierre eliminado')}
  }));
}
async function downloadOriginal(id,type){
  let f=await dbGet('files',`${id}:${type}`);
  if((!f||!f.blob)&&cloudReady()&&getSession()){
    try{toast('Recuperando archivo desde la nube…',1800);f=await cloudDownloadFile(id,type)}catch(e){console.error('Descarga nube',e)}
  }
  if(!f||!f.blob){toast('El archivo original no está disponible en este dispositivo',2800);return}
  downloadBlob(f.blob,f.name)
}
function downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name||'archivo';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}

function selectedPeriods(){return H.periods.filter(p=>H.selected.has(p.id)).sort((a,b)=>a.id.localeCompare(b.id))}
function renderAnalyze(c){
  if(!H.periods.length){c.innerHTML=`<div class="hist-empty"><div class="ico">↗</div><h3>Necesitás al menos un cierre</h3><p>Después de cargarlo aparecerán estadísticas, alertas y estrategias.</p><button class="hist-primary" data-go="cargar">Cargar mes</button></div>`;bindGo(c);return}
  let periods=selectedPeriods();if(!periods.length){H.selected.add(H.periods[H.periods.length-1].id);periods=selectedPeriods()}
  const a=analyzePeriods(periods),latest=periods[periods.length-1],first=periods[0],strategies=buildStrategies(periods);
  const report=H.lastReport&&H.lastReport.periodIds&&H.lastReport.periodIds.join('|')===periods.map(p=>p.id).join('|')?H.lastReport:null;
  c.innerHTML=`<div class="hist-card"><div class="hist-card-head"><div><h3>Elegí los meses</h3><p>Podés seleccionar períodos consecutivos o separados.</p></div><span class="hist-badge">${periods.length} seleccionados</span></div><div class="hist-picker-tools"><button data-pick="latest">Último</button><button data-pick="last2">Últimos 2</button><button data-pick="last6">Últimos 6</button><button data-pick="year">Año ${latest.year}</button><button data-pick="all">Todos</button></div><div class="hist-month-picker">${H.periods.map(p=>`<label class="hist-month-option"><input type="checkbox" value="${p.id}" ${H.selected.has(p.id)?'checked':''}><span>${SHORT_H[p.month]} ${String(p.year).slice(-2)}</span></label>`).join('')}</div></div>
    <div class="hist-kpi-grid">${kpi('◆',`${fmt(latest.summary.pbPersonal)} PB`,'PB del equipo',a.pbDelta)}${kpi('●',`${latest.summary.activePct}%`,'Actividad',a.activeDelta)}${kpi('＋',fmt(latest.summary.incomeCount),'Ingresos',a.incomeDelta)}${kpi('!',fmt(latest.summary.pending),'Pendientes',a.pendingDelta)}</div>
    <div class="hist-card"><div class="hist-card-head"><div><h3>PB del equipo por mes</h3><p>${esc(first.label)} — ${esc(latest.label)}</p></div></div>${lineChart(periods,'pbPersonal','#5b8def',' PB')}</div>
    <div class="hist-card"><div class="hist-card-head"><div><h3>Porcentaje de actividad</h3><p>Personas con PB Personal mayor a cero</p></div></div>${lineChart(periods,'activePct','#3ad0a4','%')}</div>
    <div class="hist-card"><div class="hist-card-head"><div><h3>Garantías pendientes</h3><p>Evolución de los registros pendientes</p></div></div>${lineChart(periods,'pending','#f5b301','')}</div>
    <div class="hist-card"><div class="hist-card-head"><div><h3>Evolución por categoría</h3><p>Distribución inicial y final de las personas</p></div></div><div class="hist-table-wrap"><table class="hist-table" style="min-width:420px"><thead><tr><th>Categoría</th><th>${esc(SHORT_H[first.month])} ${first.year}</th><th>${esc(SHORT_H[latest.month])} ${latest.year}</th><th>Cambio</th></tr></thead><tbody>${categoryRows(first,latest)}</tbody></table></div></div>
    <div class="hist-card"><div class="hist-card-head"><div><h3>Cambios individuales</h3><p>${a.changes.length?`${a.improved} mejoraron · ${a.declined} bajaron · ${a.newPeople} nuevos`:'Se necesita más de un mes para comparar'}</p></div><span class="hist-badge">${a.changes.length} personas</span></div><div class="hist-search"><input id="histPersonSearch" value="${esc(H.personSearch)}" placeholder="Buscar persona o código…"></div><div class="hist-table-wrap"><table class="hist-table"><thead><tr><th>Persona</th><th>Categoría</th><th>PB inicial</th><th>PB final</th><th>Cambio</th><th>Equipo</th></tr></thead><tbody id="histPersonRows">${personRows(a.changes,H.personSearch)}</tbody></table></div></div>
    <div class="hist-card"><div class="hist-card-head"><div><h3>Estrategias recomendadas</h3><p>Basadas en datos reales de los períodos seleccionados</p></div><span class="hist-badge">Motor local</span></div><div class="hist-strategies">${strategies.map(strategyHtml).join('')}</div></div>
    <div class="hist-card"><div class="hist-card-head"><div><h3>Análisis profundo</h3><p>Guardá un informe local o consultá la IA online cuando la nube esté conectada.</p></div></div><label class="hist-ai-consent"><input type="checkbox" id="histAiConsent"> Autorizo enviar a la IA nombres, categorías y resultados de los períodos seleccionados. No se enviarán teléfonos, domicilios, correos ni cumpleaños.</label><div class="hist-actions"><button class="hist-primary" id="histLocalReport">Generar informe local</button><button class="hist-secondary" id="histOnlineReport">Análisis con IA</button></div><div id="histReportArea">${report?reportHtml(report):''}</div></div>`;
  c.querySelectorAll('.hist-month-option input').forEach(input=>input.onchange=()=>{input.checked?H.selected.add(input.value):H.selected.delete(input.value);render()});
  c.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>pickPeriods(b.dataset.pick));
  $('histPersonSearch').oninput=e=>{H.personSearch=e.target.value;$('histPersonRows').innerHTML=personRows(a.changes,H.personSearch)};
  $('histLocalReport').onclick=()=>createLocalReport(periods,strategies,a);
  $('histOnlineReport').onclick=()=>createOnlineReport(periods,strategies,a);
}
function pickPeriods(mode){
  H.selected.clear();const all=H.periods,latest=all[all.length-1];let list=[];
  if(mode==='latest')list=all.slice(-1);else if(mode==='last2')list=all.slice(-2);else if(mode==='last6')list=all.slice(-6);else if(mode==='year')list=all.filter(p=>p.year===latest.year);else list=all;
  list.forEach(p=>H.selected.add(p.id));render();
}
function metricValue(p,metric){return num((p.summary||{})[metric])}
function lineChart(periods,metric,color,suffix){
  if(!periods.length)return '<div class="hist-empty">Sin datos</div>';
  if(periods.length===1){const value=metricValue(periods[0],metric);return `<div class="hist-single-chart"><span style="--tone:${color}"></span><strong>${fmt(value)}${suffix}</strong><b>${esc(periods[0].label)}</b><small>Cargá otro mes para ver la evolución y las diferencias.</small></div>`}
  const vals=periods.map(p=>metricValue(p,metric));let min=Math.min(...vals),max=Math.max(...vals);if(min===max){min=Math.max(0,min-1);max+=1}const W=620,Ht=190,left=54,right=18,top=31,bottom=33,cw=W-left-right,ch=Ht-top-bottom;
  const point=(v,i)=>({x:left+(periods.length===1?cw/2:i*cw/(periods.length-1)),y:top+(max-v)/(max-min)*ch});const pts=vals.map(point),poly=pts.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),area=`${left},${top+ch} ${poly} ${left+cw},${top+ch}`;
  const grids=[0,.25,.5,.75,1].map(t=>{const y=top+t*ch,v=max-t*(max-min);return `<line x1="${left}" y1="${y}" x2="${left+cw}" y2="${y}" stroke="#9aa3b5" stroke-opacity=".18"/><text x="${left-8}" y="${y+3}" text-anchor="end" font-size="8.5" fill="#8a8a94">${esc(fmt(v))}${suffix}</text>`}).join('');
  const monthLabels=periods.map((p,i)=>`<text x="${pts[i].x}" y="${Ht-8}" text-anchor="middle" font-size="9" font-weight="700" fill="#777887">${SHORT_H[p.month]} ${String(p.year).slice(-2)}</text>`).join('');
  const valueLabels=pts.map((point,i)=>{const text=`${fmt(vals[i])}${suffix}`,width=Math.max(25,text.length*5.15+9),below=point.y<top+12,labelY=below?point.y+20:point.y-11,rectY=labelY-10;return `<g class="hist-chart-value"><rect x="${point.x-width/2}" y="${rectY}" width="${width}" height="14" rx="6" fill="#fff" fill-opacity=".94" stroke="${color}" stroke-opacity=".2"/><text x="${point.x}" y="${labelY}" text-anchor="middle" font-size="8" font-weight="900" fill="${color}">${esc(text)}</text></g>`}).join('');
  return `<div class="hist-chart"><svg viewBox="0 0 ${W} ${Ht}" role="img" aria-label="Gráfico de ${esc(metric)}">${grids}<polygon points="${area}" fill="${color}" fill-opacity=".09"/><polyline points="${poly}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${valueLabels}${pts.map((point,i)=>`<circle cx="${point.x}" cy="${point.y}" r="4.5" fill="${color}" stroke="#fff" stroke-width="2"><title>${periods[i].label}: ${fmt(vals[i])}${suffix}</title></circle>`).join('')}${monthLabels}</svg></div>`;
}
function analyzePeriods(periods){
  const first=periods[0],last=periods[periods.length-1],fs=first.summary,ls=last.summary;
  const start=new Map(first.people.map(p=>[p.matchKey,p])),end=new Map(last.people.map(p=>[p.matchKey,p])),keys=new Set([...start.keys(),...end.keys()]);const changes=[];
  for(const key of keys){const a=start.get(key),b=end.get(key),old=a?num(a.pnAct):0,current=b?num(b.pnAct):0;changes.push({key,name:(b||a).nombre,code:(b||a).codigo,cat:(b||a).cat,old,current,delta:current-old,teamOld:a?num(a.teamPB):0,teamCurrent:b?num(b.teamPB):0,status:!a?'new':!b?'left':'same'})}
  changes.sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta));
  return {first,last,changes,improved:changes.filter(x=>x.status==='same'&&x.delta>0).length,declined:changes.filter(x=>x.status==='same'&&x.delta<0).length,newPeople:changes.filter(x=>x.status==='new').length,leftPeople:changes.filter(x=>x.status==='left').length,pbDelta:deltaText(ls.pbPersonal,periods.length>1?fs.pbPersonal:null,' PB'),activeDelta:deltaText(ls.activePct,periods.length>1?fs.activePct:null,' pp'),peopleDelta:deltaText(ls.people,periods.length>1?fs.people:null),incomeDelta:deltaText(ls.incomeCount,periods.length>1?fs.incomeCount:null),pendingDelta:deltaText(ls.pending,periods.length>1?fs.pending:null)};
}
function categoryRows(first,last){
  const a=first.summary.categories||{},b=last.summary.categories||{},order=['DJ','D','DC','CE','L','LE','EJ','E'],keys=[...new Set([...order,...Object.keys(a),...Object.keys(b)])].filter(k=>a[k]||b[k]);
  if(!keys.length)return '<tr><td colspan="4">Sin categorías registradas.</td></tr>';
  return keys.map(k=>{const d=num(b[k])-num(a[k]),cls=d>0?'up':d<0?'down':'neutral';return `<tr><td><strong>${esc(k)}</strong></td><td>${fmt(a[k])}</td><td>${fmt(b[k])}</td><td class="${cls}">${d>0?'+':''}${fmt(d)}</td></tr>`}).join('');
}
function personRows(changes,search){
  const q=normalize(search);let list=changes.filter(x=>!q||normalize(`${x.name} ${x.code}`).includes(q)).slice(0,100);if(!list.length)return '<tr><td colspan="6">Sin coincidencias.</td></tr>';
  return list.map(x=>{const cls=x.delta>0?'up':x.delta<0?'down':'neutral',sign=x.delta>0?'+':'';return `<tr><td><strong>${esc(x.name)}</strong><br><small>${esc(x.code||x.status)}</small></td><td>${esc(x.cat||'—')}</td><td>${fmt(x.old)}</td><td>${fmt(x.current)}</td><td class="${cls}">${sign}${fmt(x.delta)}</td><td>${fmt(x.teamCurrent)} PB</td></tr>`}).join('');
}
function buildStrategies(periods){
  if(!periods.length)return [];const first=periods[0],last=periods[periods.length-1],fs=first.summary,ls=last.summary,out=[];const add=(priority,title,evidence,action,tone)=>out.push({priority,title,evidence,action,tone});
  if(periods.length>1){const pbChange=fs.pbPersonal?(ls.pbPersonal-fs.pbPersonal)/fs.pbPersonal*100:0;if(pbChange<=-10)add('Alta','Recuperar el volumen de puntos',`El PB cayó ${Math.abs(Math.round(pbChange))}% entre ${first.label} y ${last.label}.`,'Separar la caída por ramas, hablar primero con quienes más retrocedieron y definir objetivos semanales medibles.','#d9534f');else if(pbChange>=10)add('Oportunidad','Sostener el crecimiento de puntos',`El PB creció ${Math.round(pbChange)}% en el período seleccionado.`,'Identificar las tres acciones que impulsaron el crecimiento y repetirlas con las ramas secundarias.','#168765');
    const activeDiff=ls.activePct-fs.activePct;if(activeDiff<=-5)add('Alta','Reactivar personas inactivas',`La actividad bajó ${Math.abs(activeDiff)} puntos porcentuales y terminó en ${ls.activePct}%.`,'Crear una lista de inactividad consecutiva, asignar un contacto y acordar un primer objetivo pequeño.','#d9534f');else if(activeDiff>=5)add('Positiva','Consolidar la mejora de actividad',`La actividad aumentó ${activeDiff} puntos porcentuales.`,'Reconocer a quienes se reactivaron y acompañarlos para sostener un segundo mes activo.','#168765');
    const pendChange=fs.pending?(ls.pending-fs.pending)/fs.pending*100:0;if(pendChange>=15)add('Alta','Reducir garantías pendientes',`Los pendientes aumentaron ${Math.round(pendChange)}% y llegaron a ${fmt(ls.pending)}.`,'Ordenar por cantidad, trabajar primero el 20% de personas con mayor pendiente y revisar avances cada semana.','#e18a18');
  }
  if(periods.length>=2){const p1=periods[periods.length-2],p2=last,m1=new Map(p1.people.map(p=>[p.matchKey,p]));const consecutive=p2.people.filter(p=>p.pnAct===0&&m1.get(p.matchKey)&&m1.get(p.matchKey).pnAct===0);if(consecutive.length)add('Media','Atender inactividad consecutiva',`${consecutive.length} personas registran cero PB en los dos últimos cierres.`,'Preparar un seguimiento diferenciado: reconexión, diagnóstico de obstáculo y fecha concreta para la próxima acción.','#a06bff')}
  if(ls.incomeNoPurchase>0)add('Alta','Acompañar ingresos sin compra posterior',`${ls.incomeNoPurchase} de ${ls.incomeCount} ingresos todavía no registran una compra posterior al alta.`,'Abrir la lista de ingresos, contactar a cada persona y acordar una primera acción concreta.','#d9534f');
  if(ls.incomeContactIncomplete>0)add('Media','Completar datos de contacto',`${ls.incomeContactIncomplete} ingresos tienen teléfono o correo incompleto.`,'Actualizar esos datos para no perder posibilidades de seguimiento.','#e18a18');
  const branches=(ls.branches||[]).sort((a,b)=>b.pb-a.pb),top=branches[0];if(top&&ls.pbPersonal&&top.pb/ls.pbPersonal>=.55)add('Media','Diversificar el aporte de las ramas',`${top.name} concentra ${pct(top.pb,ls.pbPersonal)}% del PB del período.`,'Definir un plan de crecimiento para las dos ramas siguientes y reducir la dependencia de un solo origen.','#5b8def');
  if(ls.expiredPct>=25)add('Media','Revisar la tasa de vencimiento',`${ls.expiredPct}% de las garantías presentadas aparecen vencidas.`,'Revisar causas, fechas y responsables; usar una rutina de control antes de cada cierre.','#e18a18');
  if(!out.length)add('Seguimiento','Mantener control mensual',`El cierre muestra ${ls.activePct}% de actividad y ${fmt(ls.pbPersonal)} PB.`,'Conservar la carga mensual y fijar un objetivo verificable para actividad, puntos y pendientes.','#5b8def');
  return out.sort((a,b)=>({Alta:0,Media:1,Oportunidad:2,Positiva:2,Seguimiento:3}[a.priority]-({Alta:0,Media:1,Oportunidad:2,Positiva:2,Seguimiento:3}[b.priority])));
}
function strategyHtml(s){return `<article class="hist-strategy" style="--tone:${s.tone}"><div class="s-top"><span class="s-priority">${esc(s.priority)}</span></div><h4>${esc(s.title)}</h4><p>${esc(s.evidence)}</p><div class="action"><b>Acción:</b> ${esc(s.action)}</div></article>`}
function localReportText(periods,strategies,a){
  const first=periods[0],last=periods[periods.length-1],s=last.summary,lines=[];lines.push(`INFORME ESTRATÉGICO · ${first.label}${first.id===last.id?'':` a ${last.label}`}`,'',`Resumen: ${s.people} personas, ${s.activePct}% activas, ${fmt(s.pbPersonal)} PB, ${fmt(s.pending)} garantías pendientes y ${s.incomeCount} ingresos.`);
  if(periods.length>1)lines.push(`Evolución: ${a.pbDelta.text}; actividad ${a.activeDelta.text}; personas ${a.peopleDelta.text}; ingresos ${a.incomeDelta.text}.`,`${a.improved} personas mejoraron sus PB, ${a.declined} bajaron, ${a.newPeople} se incorporaron y ${a.leftPeople} dejaron de aparecer.`);
  lines.push('','PRIORIDADES');strategies.forEach((x,i)=>lines.push(`${i+1}. ${x.title}. ${x.evidence} Acción: ${x.action}`));
  const topUp=a.changes.filter(x=>x.delta>0).slice(0,5),topDown=a.changes.filter(x=>x.delta<0).slice(0,5);if(topUp.length)lines.push('','MAYORES MEJORAS',...topUp.map(x=>`• ${x.name}: +${fmt(x.delta)} PB`));if(topDown.length)lines.push('','SEGUIMIENTOS PRIORITARIOS',...topDown.map(x=>`• ${x.name}: ${fmt(x.delta)} PB`));
  lines.push('','PLAN DE 30 DÍAS','Semana 1: validar causas y ordenar las personas prioritarias.','Semana 2: ejecutar contactos y acordar objetivos individuales.','Semana 3: revisar actividad, pendientes y avances por rama.','Semana 4: cerrar resultados y preparar el próximo archivo mensual.');return lines.join('\n');
}
function reportHtml(report){return `<div class="hist-report"><b>${report.source==='online'?'Análisis con IA':'Informe local'}</b> · ${new Date(report.createdAt).toLocaleString('es-AR')}\n\n${esc(report.text)}</div>`}
async function saveReport(text,periods,source){const r={id:`${Date.now()}-${Math.random().toString(36).slice(2,7)}`,createdAt:new Date().toISOString(),periodIds:periods.map(p=>p.id),source,text};await dbPut('reports',r);H.lastReport=r;H.reports.unshift(r);return r}
async function createLocalReport(periods,strategies,a){const area=$('histReportArea'),btn=$('histLocalReport');btn.disabled=true;btn.textContent='Analizando…';await sleep(250);const r=await saveReport(localReportText(periods,strategies,a),periods,'local');area.innerHTML=reportHtml(r);btn.disabled=false;btn.textContent='Generar informe local';toast('Informe local guardado')}
async function createOnlineReport(periods,strategies,a){
  if(!$('histAiConsent').checked){toast('Confirmá la autorización antes de enviar datos a la IA',3000);return}
  if(!cloudReady()||!getSession()){toast('Conectá la nube e iniciá sesión para usar la IA online',3200);openTab('nube');return}
  const area=$('histReportArea'),btn=$('histOnlineReport');btn.disabled=true;btn.textContent='Consultando IA…';area.innerHTML='<div class="hist-loading"><span></span>Preparando análisis profundo…</div>';
  try{const text=await callOnlineAI(periods,strategies,a),r=await saveReport(text,periods,'online');H.lastReport=r;area.innerHTML=reportHtml(r);toast('Análisis profundo guardado',2200)}catch(e){console.error('IA histórico',e);area.innerHTML=`<div class="hist-toast-inline error">${esc(e.message)}</div>`;toast('No se pudo completar el análisis online',2800)}finally{btn.disabled=false;btn.textContent='Análisis con IA'}
}

async function makeBackupZip(periods,fileName){
  if(typeof JSZip==='undefined')throw new Error('El generador ZIP no está disponible.');const zip=new JSZip(),ids=new Set(periods.map(p=>p.id)),files=[];
  for(const p of periods){const stored=await dbGetAll('files','periodId',p.id);for(const f of stored){const path=`archivos/${p.id}/${f.type}-${safeFileName(f.name)}`;zip.file(path,f.blob);files.push({path,key:f.key,periodId:f.periodId,type:f.type,name:f.name,size:f.size,mime:f.mime,lastModified:f.lastModified})}}
  const reports=H.reports.filter(r=>(r.periodIds||[]).some(id=>ids.has(id)));zip.file('historico.json',JSON.stringify({format:'APPI-HISTORICO',schema:1,exportedAt:new Date().toISOString(),periods:cloneClean(periods),reports:cloneClean(reports),files},null,2));
  const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:6}});downloadBlob(blob,fileName);return blob;
}
async function exportAllZip(){
  const btn=$('histBackupAll');if(btn){btn.disabled=true;btn.textContent='Preparando ZIP…'}try{await makeBackupZip(H.periods,`APPI_historico_completo_${new Date().toISOString().slice(0,10)}.zip`);toast('Backup completo descargado',2300)}catch(e){toast(e.message,3200)}finally{if(btn){btn.disabled=false;btn.textContent='Descargar backup ZIP'}}
}
async function exportPeriodZip(id){const p=H.periods.find(x=>x.id===id);if(!p)return;try{await makeBackupZip([p],`APPI_cierre_${id}.zip`);toast('ZIP del mes descargado')}catch(e){toast(e.message,3000)}}
async function restoreBackup(file){
  if(!file)return;toast('Revisando backup…',1800);
  try{const zip=await JSZip.loadAsync(file),entry=zip.file('historico.json');if(!entry)throw new Error('El ZIP no contiene historico.json');const data=JSON.parse(await entry.async('string'));if(data.format!=='APPI-HISTORICO'||!Array.isArray(data.periods))throw new Error('El backup no pertenece al Histórico de APPI.');if(!confirm(`Se restaurarán ${data.periods.length} cierres. Los meses coincidentes serán reemplazados. ¿Continuar?`))return;
    const db=await openDB();for(const p of data.periods)await dbPut('periods',p);for(const r of data.reports||[])await dbPut('reports',r);for(const meta of data.files||[]){const zf=zip.file(meta.path);if(!zf)continue;const blob=await zf.async('blob');await dbPut('files',{...meta,blob})}await refreshData();render();toast(`${data.periods.length} cierres restaurados`,2600)
  }catch(e){console.error('Restaurar histórico',e);toast(`No se pudo restaurar: ${e.message}`,3500)}finally{$('histRestoreInput').value=''}
}

const CLOUD_CONFIG_KEY='hist_cloud_config_v1',CLOUD_SESSION_KEY='hist_cloud_session_v1';
const accountAuthEnabled=()=>!!(window.APPIAuth&&window.APPIAuth.isEnabled());
function getCloudConfig(){if(accountAuthEnabled()){const c=window.APPIAuth.config();return {url:c.url,anonKey:c.anonKey}}try{return JSON.parse(localStorage.getItem(CLOUD_CONFIG_KEY)||'{}')}catch(e){return {}}}
function saveCloudConfigValue(value){if(!accountAuthEnabled())localStorage.setItem(CLOUD_CONFIG_KEY,JSON.stringify(value))}
function getSession(){if(accountAuthEnabled()){const value=window.APPIAuth.load();return value&&value.session||null}try{return JSON.parse(localStorage.getItem(CLOUD_SESSION_KEY)||'null')}catch(e){return null}}
function setSession(value){if(accountAuthEnabled())return;if(value)localStorage.setItem(CLOUD_SESSION_KEY,JSON.stringify(value));else localStorage.removeItem(CLOUD_SESSION_KEY)}
function cloudReady(){const c=getCloudConfig();return /^https:\/\//.test(c.url||'')&&String(c.anonKey||'').length>20}
function jwtPayload(token){try{return JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')))}catch(e){return {}}}
function sessionUser(){const s=getSession();return s?jwtPayload(s.access_token||''):null}
function sessionExpired(s){const p=s?jwtPayload(s.access_token||''):{};return !p.exp||p.exp*1000<Date.now()+60000}
function logSync(message){H.syncLog.push(`${new Date().toLocaleTimeString('es-AR')} · ${message}`);H.syncLog=H.syncLog.slice(-30);const el=$('histSyncLog');if(el)el.textContent=H.syncLog.join('\n')}
async function refreshCloudSession(){
  let s=getSession();if(!s)return null;if(!sessionExpired(s))return s;
  if(accountAuthEnabled()){try{const value=await window.APPIAuth.refresh();return value&&value.session||null}catch(e){return null}}
  const cfg=getCloudConfig();if(!s.refresh_token)return null;
  const r=await fetch(`${cfg.url.replace(/\/$/,'')}/auth/v1/token?grant_type=refresh_token`,{method:'POST',headers:{apikey:cfg.anonKey,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:s.refresh_token})});if(!r.ok){setSession(null);return null}s=await r.json();setSession(s);return s;
}
async function cloudFetch(path,options={},auth=true){
  const cfg=getCloudConfig();if(!cloudReady())throw new Error('La conexión con Supabase todavía no está configurada.');let session=auth?await refreshCloudSession():null;if(auth&&!session)throw new Error(accountAuthEnabled()?'Volvé a iniciar sesión para continuar.':'Iniciá sesión por correo para continuar.');
  const headers={apikey:cfg.anonKey,...(options.headers||{})};if(session)headers.Authorization=`Bearer ${session.access_token}`;
  const r=await fetch(`${cfg.url.replace(/\/$/,'')}${path}`,{...options,headers});if(!r.ok){let message=`Error de nube ${r.status}`;try{const data=await r.json();message=data.message||data.msg||data.error_description||data.error||message}catch(e){}throw new Error(message)}return r;
}
async function sendMagicLink(email){
  if(accountAuthEnabled())throw new Error('La nube usa tu cuenta de distribuidor.');
  const cfg=getCloudConfig();if(!cloudReady())throw new Error('Primero guardá la configuración de Supabase.');if(!/^[^@]+@[^@]+\.[^@]+$/.test(email))throw new Error('Ingresá un correo válido.');
  const redirect=location.href.split('#')[0];const r=await cloudFetch('/auth/v1/otp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,create_user:true,options:{email_redirect_to:redirect}})},false);await r.text();localStorage.setItem('hist_cloud_email',email);return true;
}
function handleAuthHash(){
  if(accountAuthEnabled())return false;
  if(!location.hash||!location.hash.includes('access_token='))return false;const q=new URLSearchParams(location.hash.slice(1)),access=q.get('access_token');if(!access)return false;setSession({access_token:access,refresh_token:q.get('refresh_token'),expires_in:+q.get('expires_in')||3600,token_type:q.get('token_type')||'bearer'});history.replaceState(null,'',location.pathname+location.search);toast('Nube conectada correctamente',2400);return true;
}
async function upsertCloudPeriod(p){
  const user=sessionUser();if(!user||!user.sub)throw new Error('No se pudo identificar la cuenta.');const data=cloneClean(p);data.syncStatus='synced';
  await cloudFetch('/rest/v1/historico_periodos?on_conflict=user_id,period_id',{method:'POST',headers:{'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify([{user_id:user.sub,period_id:p.id,data,updated_at:p.updatedAt}])});
  const files=await dbGetAll('files','periodId',p.id);for(const f of files){const path=`${encodeURIComponent(user.sub)}/${encodeURIComponent(p.id)}/${encodeURIComponent(f.type)}/${encodeURIComponent(safeFileName(f.name))}`;await cloudFetch(`/storage/v1/object/historico-files/${path}`,{method:'POST',headers:{'Content-Type':f.mime||'application/octet-stream','x-upsert':'true'},body:f.blob})}
  p.syncStatus='synced';p.syncedAt=new Date().toISOString();await dbPut('periods',p);
}
async function pullCloud(){
  const r=await cloudFetch('/rest/v1/historico_periodos?select=period_id,data,updated_at&order=period_id.asc'),rows=await r.json();let added=0;
  for(const row of rows){const remote=row.data;if(!remote||!remote.id)continue;remote.syncStatus='synced';const local=H.periods.find(p=>p.id===remote.id);if(!local||String(remote.updatedAt||row.updated_at)>String(local.updatedAt||'')){await dbPut('periods',remote);added++}}
  if(added)await refreshData();return added;
}
async function syncAll(showResult=true){
  if(H.syncing)return;if(!navigator.onLine){if(showResult)toast('Sin conexión: los datos siguen guardados localmente',2800);return}if(!cloudReady()){if(showResult)openTab('nube');return}if(!getSession()){if(showResult){toast('Iniciá sesión para sincronizar',2300);openTab('nube')}return}
  H.syncing=true;updateSyncStatus();logSync('Inicio de sincronización');
  try{await refreshData();const pending=H.periods.filter(p=>p.syncStatus!=='synced');for(const p of pending){logSync(`Subiendo ${p.label}`);await upsertCloudPeriod(p)}const pulled=await pullCloud();await refreshData();logSync(`Sincronización completa${pulled?` · ${pulled} cierres recuperados`:''}`);if(showResult)toast('Histórico sincronizado',2200);render()}
  catch(e){console.error('Sincronización histórico',e);logSync(`ERROR · ${e.message}`);if(showResult)toast(`No se pudo sincronizar: ${e.message}`,3500);updateSyncStatus(true)}finally{H.syncing=false;updateSyncStatus()}
}
async function cloudDownloadFile(id,type){
  const p=H.periods.find(x=>x.id===id),meta=p&&p.filesMeta&&p.filesMeta.find(f=>f.type===type),user=sessionUser();if(!meta||!user)return null;const path=`${encodeURIComponent(user.sub)}/${encodeURIComponent(id)}/${encodeURIComponent(type)}/${encodeURIComponent(safeFileName(meta.name))}`;const r=await cloudFetch(`/storage/v1/object/authenticated/historico-files/${path}`);const blob=await r.blob(),record={key:`${id}:${type}`,periodId:id,type,name:meta.name,size:meta.size,mime:meta.mime,lastModified:meta.lastModified,blob};await dbPut('files',record);return record;
}
async function callOnlineAI(periods,strategies,a){
  const payload={periods:periods.map(p=>({id:p.id,label:p.label,summary:p.summary,people:p.people.map(x=>({nombre:x.nombre,codigo:x.codigo,categoria:x.cat,pbPersonal:x.pnAct,pbEquipo:x.teamPB,garantias:x.garantias,rama:x.branchKey})),incomes:(p.incomes||[]).map(i=>({nombre:i.nombre,dip:i.dip,categoria:i.cat,fechaAlta:i.fechaAlta,ultimaCompra:i.ultimaCompra,diasHastaCompra:i.diasHastaCompra,compraPosterior:i.compraPosterior,patrocinante:i.patrocinanteNombre,patrocinanteDip:i.patrocinanteDip,capacitacion:i.capacitacion}))})),localStrategies:strategies,comparison:{improved:a.improved,declined:a.declined,newPeople:a.newPeople,leftPeople:a.leftPeople}};
  const r=await cloudFetch('/functions/v1/historico-analisis',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}),data=await r.json();if(!data.analysis)throw new Error(data.error||'La IA no devolvió un análisis.');return data.analysis;
}
function updateSyncStatus(forceError=false){
  const dot=$('histSyncDot'),title=$('histSyncTitle'),detail=$('histSyncDetail'),quick=$('histSyncQuick');if(!dot||!title)return;const pending=H.periods.filter(p=>p.syncStatus!=='synced').length,session=getSession();dot.className='hist-status-dot';
  if(forceError){dot.classList.add('error');title.textContent='Error de sincronización';detail.textContent='Los datos locales están seguros'}else if(H.syncing){dot.classList.add('local');title.textContent='Sincronizando…';detail.textContent='No cierres APPI durante el proceso'}else if(cloudReady()&&session&&pending===0&&H.periods.length){dot.classList.add('online');title.textContent='Nube actualizada';detail.textContent=`${H.periods.length} cierres sincronizados`}else{dot.classList.add('local');title.textContent=pending?`${pending} cierre${pending===1?'':'s'} solo local`:'Datos locales protegidos';detail.textContent=cloudReady()?(session?'Listo para sincronizar':'Falta iniciar sesión'):'Disponible sin conexión'}
  quick.textContent=H.syncing?'Sincronizando':(cloudReady()&&session?'Sincronizar':'Configurar nube');quick.disabled=H.syncing;
}
function renderCloud(c){
  const cfg=getCloudConfig(),session=getSession(),user=sessionUser(),pending=H.periods.filter(p=>p.syncStatus!=='synced').length,email=localStorage.getItem('hist_cloud_email')||'',accountMode=accountAuthEnabled(),profile=accountMode?window.APPIAuth.currentProfile():null;
  c.innerHTML=`<div class="hist-cloud-grid">
    <div class="hist-card"><div class="hist-card-head"><div><h3>Estado de la nube</h3><p>Copia segura y acceso desde otros dispositivos</p></div><span class="hist-badge">${session?'Conectada':'Sin conectar'}</span></div><div class="hist-cloud-state"><div class="c-icon">☁</div><div><b>${session?(accountMode?`Cuenta ${esc(profile&&profile.dip||'')}`:`Sesión activa${user&&user.email?` · ${esc(user.email)}`:''}`):(accountMode?'Volvé a iniciar sesión':'Acceso por enlace de correo')}</b><p>${session?`${pending} cierres pendientes de sincronizar.`:(accountMode?'La sesión de distribuidor no está disponible.':'No necesitás recordar una contraseña.')}</p></div></div>${session?`<div class="hist-actions"><button class="hist-primary" id="histSyncNow">Sincronizar ahora</button><button class="hist-secondary" id="histPullCloud">Recuperar nube</button>${accountMode?'<button class="hist-secondary" id="histAccount">Mi cuenta</button>':'<button class="hist-danger" id="histLogout">Cerrar sesión</button>'}</div>`:(accountMode?'<button class="hist-primary" id="histRelogin">Volver a ingresar</button>':`<label class="hist-field" style="margin-top:11px"><span>Correo de acceso</span><input id="histCloudEmail" type="email" value="${esc(email)}" placeholder="tu@correo.com"></label><button class="hist-primary" id="histMagicLink">Enviar enlace de acceso</button>`)}</div>
    <div class="hist-card"><div class="hist-card-head"><div><h3>Configuración</h3><p>Supabase reúne acceso, base de datos, archivos e IA segura.</p></div></div>${accountMode?'<div class="hist-cloud-note"><b>Administrada por APPI.</b><br>El Histórico usa automáticamente la misma cuenta de distribuidor. No necesitás configurar otra sesión.</div>':`<div class="hist-cloud-note">Para la prueba local no hace falta completar esto. Para activar la nube se debe crear el proyecto con el archivo <b>SUPABASE_SETUP.sql</b> incluido en el paquete.</div><details class="hist-config-details" ${cloudReady()?'':'open'}><summary>${cloudReady()?'Configuración guardada':'Completar conexión'}</summary><div><label class="hist-field"><span>URL de Supabase</span><input id="histCloudUrl" type="url" value="${esc(cfg.url||'')}" placeholder="https://proyecto.supabase.co"></label><label class="hist-field"><span>Clave pública (anon)</span><input id="histCloudKey" type="password" value="${esc(cfg.anonKey||'')}" placeholder="eyJ…"></label><button class="hist-secondary" id="histSaveCloud">Guardar configuración</button></div></details>`}</div>
    <div class="hist-card wide"><div class="hist-card-head"><div><h3>Registro de sincronización</h3><p>Los errores nunca eliminan la copia local.</p></div></div><div class="hist-sync-log" id="histSyncLog">${esc(H.syncLog.join('\n')||'Sin actividad todavía.')}</div></div>
    <div class="hist-card wide"><div class="hist-card-head"><div><h3>Privacidad del análisis con IA</h3><p>Detalle individual sin datos de contacto innecesarios</p></div></div><div class="hist-preview">La IA puede recibir nombres, códigos, categorías, puntos, ramas y garantías. APPI excluye teléfonos, domicilios, correos y cumpleaños. El envío solo ocurre después de marcar la autorización en la pantalla Analizar.</div></div>
  </div>`;
  const save=$('histSaveCloud');if(save)save.onclick=()=>{const url=$('histCloudUrl').value.trim().replace(/\/$/,''),anonKey=$('histCloudKey').value.trim();saveCloudConfigValue({url,anonKey});toast(cloudReady()?'Configuración de nube guardada':'Revisá la URL y la clave pública',2600);render()};
  const magic=$('histMagicLink');if(magic)magic.onclick=async()=>{magic.disabled=true;magic.textContent='Enviando…';try{await sendMagicLink($('histCloudEmail').value.trim());toast('Revisá tu correo y abrí el enlace de acceso',3800);magic.textContent='Enlace enviado'}catch(e){toast(e.message,3500);magic.disabled=false;magic.textContent='Enviar enlace de acceso'}};
  if($('histSyncNow'))$('histSyncNow').onclick=()=>syncAll(true);if($('histPullCloud'))$('histPullCloud').onclick=async()=>{try{const n=await pullCloud();render();toast(n?`${n} cierres recuperados`:'La copia local ya está actualizada')}catch(e){toast(e.message,3200)}};if($('histLogout'))$('histLogout').onclick=()=>{setSession(null);render();toast('Sesión cerrada')};if($('histAccount'))$('histAccount').onclick=()=>{try{abrirCuentaDesdeMenu()}catch(e){}};if($('histRelogin'))$('histRelogin').onclick=()=>location.reload();
}

function showHelp(){
  const html=`<p>El Histórico guarda una fotografía independiente de cada cierre mensual.</p><div class="tip"><b>Necesitás tres archivos del mismo período:</b><br>1. Línea Descendente.<br>2. Garantías por Organización.<br>3. Ingresos.</div><p><b>Resumen y análisis:</b> reúne el Resumen Anual, los gráficos, las comparaciones y las estrategias.<br><b>Cargar y administrar:</b> permite cargar meses, descargar originales, respaldar o eliminar cierres.</p><p style="font-size:11px;color:#777887">Un archivo de Ingresos sin personas es válido y representa cero ingresos. El archivo único de Usuarios / Garantías continúa en su sección habitual.</p>`;
  try{modal.open({icon:'📈',iconBg:'linear-gradient(135deg,#5b8def,#a06bff)',title:'Cómo usar el Histórico',sub:'Control mensual y anual',html})}catch(e){alert('Cargá los tres archivos de cada mes y compará los cierres dentro de Resumen y análisis.')}
}
async function openHistorico(){
  showView('view-historico');const c=$('historicoContent');if(c)c.innerHTML='<div class="hist-loading"><span></span>Abriendo cierres mensuales…</div>';
  try{await refreshData();H.ready=true;render()}catch(e){console.error('Abrir histórico',e);if(c)c.innerHTML=`<div class="hist-toast-inline error">No se pudo abrir el almacenamiento: ${esc(e.message)}</div>`}
}
async function initHistorico(){
  if(window.APPIAuth&&window.APPIAuth.isEnabled()&&!window.APPIAuth.isLocallyAuthorized())return;
  if(H._initialized)return;H._initialized=true;
  try{await openDB();handleAuthHash();await refreshData();H.ready=true}catch(e){console.error('Inicialización histórico',e)}
  document.querySelectorAll('.hist-tabs [data-hist-tab]').forEach(b=>b.onclick=()=>openTab(b.dataset.histTab));
  const back=$('btnBackHistorico');if(back)back.onclick=()=>{showView('view-home');try{renderHomeCompleto()}catch(e){}};
  const help=$('btnHelpHistorico');if(help)help.onclick=showHelp;
  for(const [type,cfg] of Object.entries(FILE_TYPES)){const input=$(cfg.input);if(input)input.onchange=e=>{const f=e.target.files&&e.target.files[0],target=H.fileTarget;if(f&&target&&target.type===type)handleFile(type,f,target.id);H.fileTarget=null;e.target.value=''}}
  const restore=$('histRestoreInput');if(restore)restore.onchange=e=>restoreBackup(e.target.files&&e.target.files[0]);
  const quick=$('histSyncQuick');if(quick)quick.onclick=()=>cloudReady()&&getSession()?syncAll(true):openTab('nube');
  window.addEventListener('online',()=>{updateSyncStatus();if(cloudReady()&&getSession())syncAll(false)});window.addEventListener('offline',()=>updateSyncStatus());
  updateSyncStatus();
  if(window.__histOpenRequested) setTimeout(openHistorico,0);
}
window.openHistorico=openHistorico;
window.initHistoricoAPPI=initHistorico;
window.__APPI_HISTORICO__={state:H,open:openHistorico,refresh:refreshData,parseFile:parseHistoricalFile,saveMonth:saveMonthPeriod,analyze:analyzePeriods,strategies:buildStrategies,dbGetAll};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initHistorico);else initHistorico();
setTimeout(initHistorico,1200);

})();
