const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const code = fs.readFileSync(path.join(__dirname, '..', 'mensajes-usuarios.js'), 'utf8');
const ls = {};
const document = {
  readyState: 'complete',
  getElementById: () => null,
  createElement: () => ({ style: {}, classList: { add(){}, contains(){ return false; } }, setAttribute(){}, appendChild(){} }),
  head: { appendChild(){} },
  body: { appendChild(){} },
  querySelector(){ return null; },
  addEventListener(){}
};
const window = {
  addEventListener(){},
  APPIAuth: { userId: () => 't' },
  APPITel: { primeroValido: t => String(t||'').replace(/\D/g,''), normalizar: t => String(t||'').replace(/\D/g,''), abrir: () => true },
  _users: []
};
window.document = document;
window.usuariosTodosActual = () => window._users;
window.localStorage = { getItem: k => ls[k] == null ? null : ls[k], setItem: (k,v) => { ls[k] = String(v); } };
window.parseFechaU = function(v){
  if (!v) return null;
  const s = String(v);
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return new Date(+m[3], +m[2]-1, +m[1]);
  const d = new Date(v);
  return isNaN(d) ? null : d;
};
vm.runInNewContext(code, { window, document, localStorage: window.localStorage, setInterval(){}, setTimeout(){}, console });

function ddmmyyyy(n){
  const d = new Date(Date.now() + n*86400000);
  return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear();
}
function iso(n){ return new Date(Date.now()+n*86400000).toISOString(); }

for (let i = 0; i < 400; i++){
  window._users.push({
    id: i, usuario: 'U'+i, telf: '351555'+String(2000+i),
    fCompra: ddmmyyyy(-400), fVenceRaw: ddmmyyyy(200), fVence: iso(200),
    estado: 'vigente', producto: i % 3 === 0 ? 'DUCH PLA' : 'PSA'
  });
}

const M = window.APPIMensajes;
const t0 = Date.now();
M.deHoy();
const t1 = Date.now();
for (let i = 0; i < 400; i++) M.enJornada(window._users[i]);
const t2 = Date.now();
assert.ok(t2 - t1 < 80, 'enJornada no está memoizado: ' + (t2 - t1) + 'ms');
const a = M.deHoy();
M.invalidarJornada();
const b = M.deHoy();
assert.notStrictEqual(a, b);
console.log('jornada-memo.node.js ok', 'deHoy', t1-t0+'ms', '400 enJornada', t2-t1+'ms');
