const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const src = fs.readFileSync(path.join(__dirname, '..', 'data-sync.js'), 'utf8');

function Storage(){}
Storage.prototype.setItem = function(){};
Storage.prototype.removeItem = function(){};

const localStorage = {
  length: 0,
  key(){ return null; },
  getItem(){ return null; },
  setItem(){},
  removeItem(){}
};
const window = {
  addEventListener(){},
  dispatchEvent(){},
  APPIAuth: { isEnabled: () => false }
};
const document = { addEventListener(){} };
const sandbox = {
  window, document, localStorage, Storage,
  navigator: { onLine: true },
  indexedDB: { open(){ return {}; } },
  setTimeout, clearTimeout,
  setInterval(){ return 0; },
  clearInterval(){},
  console, fetch: async () => ({})
};
vm.runInNewContext(src, sandbox);
const D = sandbox.window.APPIDataSync;

assert.strictEqual(D.isSharedKey('equipoData'), true);
assert.strictEqual(D.isSharedKey('appi_keep_notas'), false);
assert.strictEqual(D.isSharedKey('appi_acciones_v1_abc'), true);
assert.strictEqual(D.isAccionesKey('appi_acciones_v1_abc'), true);
assert.strictEqual(D.cloudDataKey('appi_keep_notas', 'socio'), 'persona_socio__appi_keep_notas');
assert.strictEqual(D.cloudDataKey('appi_acciones_v1_abc', 'socio'), 'appi_acciones_v1_abc');
assert.strictEqual(D.localDataKey('persona_socio__appi_acciones_v1_abc', 'titular'), 'appi_acciones_v1_abc');
assert.strictEqual(D.localDataKey('persona_socio__appi_keep_notas', 'titular'), '');

const left = JSON.stringify({
  dias: { '2026-08-26': {
    marcas: { 'checkin:3511': { e:'hecha', at:'2026-08-26T10:00:00.000Z', n:'Ana' } },
    acc: { llamadas:true }, lista:[{m:'checkin',t:'3511'}], relleno:['llamadas'], total:10, hechas:2, noHechas:0
  } },
  completadas: { 'checkin:3511:checkin:v': { e:'hecha', dia:'2026-08-26', at:'2026-08-26T10:00:00.000Z', n:'Ana' } },
  asignadas: { 'checkin:3511:checkin:v':'2026-08-26' }
});
const right = JSON.stringify({
  dias: { '2026-08-26': {
    marcas: { 'cumple:3512': { e:'hecha', at:'2026-08-26T11:00:00.000Z', n:'Beto' } },
    acc: { referidos:true }, lista:[{m:'cumple',t:'3512'}], relleno:['referidos'], total:10, hechas:2, noHechas:0
  } },
  completadas: { 'cumple:3512:cumple:2026-08-26': { e:'hecha', dia:'2026-08-26', at:'2026-08-26T11:00:00.000Z', n:'Beto' } },
  asignadas: { 'cumple:3512:cumple:2026-08-26':'2026-08-26' }
});
const merged = JSON.parse(D.mergeAccionesValue(left, right));
assert.ok(merged.dias['2026-08-26'].marcas['checkin:3511']);
assert.ok(merged.dias['2026-08-26'].marcas['cumple:3512']);
assert.strictEqual(merged.dias['2026-08-26'].total, 10);
assert.strictEqual(merged.dias['2026-08-26'].hechas, 4);
assert.deepStrictEqual(Object.keys(merged.dias['2026-08-26'].acc).sort(), ['llamadas','referidos']);
assert.strictEqual(merged.dias['2026-08-26'].lista.length, 2);
assert.strictEqual(merged.dias['2026-08-26'].relleno.length, 2);
assert.ok(merged.completadas['checkin:3511:checkin:v']);
assert.ok(merged.completadas['cumple:3512:cumple:2026-08-26']);
assert.strictEqual(merged.asignadas['checkin:3511:checkin:v'], '2026-08-26');
assert.strictEqual(merged.asignadas['cumple:3512:cumple:2026-08-26'], '2026-08-26');
// Titular y socio deben converger a la misma jornada, sin importar cuál sea
// el lado local o remoto de la combinación.
const inverso = JSON.parse(D.mergeAccionesValue(right, left));
assert.deepStrictEqual(inverso.dias['2026-08-26'].lista, merged.dias['2026-08-26'].lista);
assert.deepStrictEqual(inverso.dias['2026-08-26'].relleno, merged.dias['2026-08-26'].relleno);

console.log('acciones-cuenta.node.js ok');
