const { test, expect } = require('@playwright/test');
const fs = require('fs');
const vm = require('vm');

function crearJornada() {
  const code = fs.readFileSync('mensajes-usuarios.js', 'utf8');
  const store = {};
  let ahora = new Date(2026, 10, 5, 12, 0, 0).getTime();
  class FakeDate extends Date {
    constructor(...args) { super(...(args.length ? args : [ahora])); }
    static now() { return ahora; }
  }
  const document = {
    readyState: 'complete', getElementById: () => null, querySelector: () => null,
    createElement: () => ({ style:{}, classList:{ add(){}, contains(){ return false; } }, setAttribute(){}, appendChild(){} }),
    head:{ appendChild(){} }, body:{ appendChild(){} }, addEventListener(){}
  };
  const localStorage = {
    getItem: k => store[k] == null ? null : store[k],
    setItem: (k,v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; }
  };
  const window = {
    addEventListener(){}, document, localStorage, _users: [],
    APPIAuth:{ userId: () => 'cuenta-prueba' },
    APPITel:{ primeroValido:t=>String(t||'').replace(/\D/g,''), normalizar:t=>String(t||'').replace(/\D/g,''), abrir:()=>true },
    usuariosTodosActual(){ return this._users; },
    parseFechaU(v){ const d = new FakeDate(v); return isNaN(d) ? null : d; }
  };
  vm.runInNewContext(code, { window, document, localStorage, Date:FakeDate, setInterval(){}, setTimeout(){}, console });
  return {
    window, M:window.APPIMensajes, store,
    avanzarDia(){ ahora += 86400000; },
    usuarios(n) {
      const vence = new FakeDate(ahora - 100 * 86400000).toISOString();
      window._users = Array.from({ length:n }, (_,i) => ({
        usuario:'CLIENTE '+String(i+1).padStart(2,'0'), telf:'351555'+String(1000+i),
        fCompra:vence, fVence:vence, fVenceRaw:vence, estado:'vencida'
      }));
    }
  };
}

const personas = grupos => grupos.flatMap(g => g.gente.map(u => u.telf));

test('si MI PSA carga después del primer cálculo, la jornada pasa sola de 0 a 10 clientes', () => {
  const h = crearJornada();
  expect(personas(h.M.deHoy())).toHaveLength(0);
  h.usuarios(20);
  expect(personas(h.M.deHoy())).toHaveLength(10);
  expect(h.M.resumenHoy()).toMatchObject({ total:10, clientes:10, comerciales:0 });
});

test('con sólo 3 usuarios elegibles completa 7 acciones comerciales y mantiene total 10', () => {
  const h = crearJornada();
  h.usuarios(3);
  expect(personas(h.M.deHoy())).toHaveLength(3);
  const r = h.M.resumenHoy();
  expect(r).toMatchObject({ total:10, clientes:3, comerciales:7, pendientes:10 });
  expect(h.M.accionesRelleno()).toHaveLength(7);
});

test('la cola no repite personas: 20 usuarios se reparten 10 hoy y otros 10 mañana', () => {
  const h = crearJornada();
  h.usuarios(20);
  const dia1 = personas(h.M.deHoy());
  h.M.invalidarJornada();
  expect(personas(h.M.deHoy())).toEqual(dia1); // recargar conserva la jornada
  h.avanzarDia();
  const dia2 = personas(h.M.deHoy());
  expect(dia2).toHaveLength(10);
  expect(dia2.filter(t => dia1.includes(t))).toHaveLength(0);
  h.avanzarDia();
  expect(personas(h.M.deHoy())).toHaveLength(0); // agotó el ciclo: no fuerza repetidos
  expect(h.M.resumenHoy()).toMatchObject({ total:10, clientes:0, comerciales:10 });
});
