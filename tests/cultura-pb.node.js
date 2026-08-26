#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function extractFn(name) {
  const start = html.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('no está ' + name);
  let i = html.indexOf('{', start), depth = 0;
  for (; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}') {
      depth--;
      if (depth === 0) return html.slice(start, i + 1);
    }
  }
  throw new Error('llave sin cerrar: ' + name);
}

const src = [
  extractFn('digitosIdentidad'),
  extractFn('numeroIdentidadComparable'),
  extractFn('identidadNombreNorm'),
  extractFn('identidadNombresCoinciden'),
  extractFn('identidadDipCoinciden'),
  extractFn('titularPbPersonalDesdeEquipo')
].join('\n');
const fns = {};
new Function('exports', src + '\nexports.titularPbPersonalDesdeEquipo=titularPbPersonalDesdeEquipo;')(fns);
const lookup = fns.titularPbPersonalDesdeEquipo;

let passed = 0, failed = 0;
function eq(name, got, expected) {
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (ok) { passed++; console.log('  OK  ' + name); }
  else { failed++; console.log('  FAIL ' + name); console.log('    got     ', got); console.log('    expected', expected); }
}

console.log('Cultura · PB oficial del titular');

eq('cabecera gana si ya está el número',
  lookup({ nombre: 'Boulard, Valeria', socio: 'Toledo, Silvia', pbPersonal: 8.5 }, [
    { nombre: 'Toledo, Silvia', codigo: '02-1', pnAct: 20 }
  ]),
  { pb: 8.5, fuente: 'cabecera', nombre: 'Boulard, Valeria' }
);

eq('DIP del titular, aunque el socio figure primero en la grilla',
  lookup({ dip: '02-9802014', nombre: 'Boulard, Valeria', socio: 'Toledo, Silvia' }, [
    { nombre: 'TOLEDO, SILVIA', codigo: '02-7777777', pnAct: 22 },
    { nombre: 'BOULARD, VALERIA', codigo: '02-9802014', pnAct: 8.5 }
  ]),
  { pb: 8.5, fuente: 'fila', nombre: 'BOULARD, VALERIA' }
);

eq('por nombre (apellido, nombre) si el DIP no viene',
  lookup({ nombre: 'María Pérez' }, [
    { nombre: 'PEREZ, MARIA', codigo: '', pnAct: 12 }
  ]),
  { pb: 12, fuente: 'fila', nombre: 'PEREZ, MARIA' }
);

eq('no usa el PB del socio',
  lookup({ dip: '02-9802014', nombre: 'Boulard, Valeria', socio: 'Toledo, Silvia' }, [
    { nombre: 'TOLEDO, SILVIA', codigo: '02-7777777', pnAct: 22 }
  ]),
  null
);

eq('ignora el nodo virtual del titular (pnAct 0)',
  lookup({ dip: '02-9802014', nombre: 'María Pérez' }, [
    { nombre: 'MARÍA PÉREZ', codigo: '02-9802014', pnAct: 0, esTitular: true },
    { nombre: 'Juan Rama', codigo: '02-1000001', pnAct: 40 }
  ]),
  null
);

eq('DIP corto vs DIP con sucursal',
  lookup({ dip: '9802014', nombre: 'María Pérez' }, [
    { nombre: 'Otra', codigo: '02-9802014', pnAct: 9 }
  ]),
  { pb: 9, fuente: 'fila', nombre: 'Otra' }
);

eq('sin datos no inventa',
  lookup({ nombre: 'María Pérez' }, [
    { nombre: 'Juan Rama', codigo: '02-1', pnAct: 40 }
  ]),
  null
);

eq('PB 0 oficial no se descarta',
  lookup({ dip: '02-9802014', nombre: 'María Pérez' }, [
    { nombre: 'María Pérez', codigo: '02-9802014', pnAct: 0 }
  ]),
  { pb: 0, fuente: 'fila', nombre: 'María Pérez' }
);

if (failed) {
  console.log('\n' + failed + ' fallaron, ' + passed + ' ok');
  process.exit(1);
}
console.log('\nALL OK · ' + passed);
