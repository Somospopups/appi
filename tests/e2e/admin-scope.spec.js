const { test, expect } = require('@playwright/test');
const fs = require('fs');

/* Guardia de alcance (v328): publicar/quitar aviso y los ingresos por mes se
   rompían en silencio porque sus funciones quedaron declaradas FUERA del IIFE
   del panel y no veían los helpers internos ($, setStatus, rpcAdmin, state).
   Al hacer clic en "Publicar aviso" no pasaba nada (ReferenceError invisible). */

test('las funciones del panel viven dentro del IIFE, no afuera', () => {
  const js = fs.readFileSync('admin-panel.js', 'utf8');
  const iife = js.indexOf('(function(){');
  expect(iife).toBeGreaterThanOrEqual(0);

  const dentro = [
    'async function loadPagos',
    'async function fetchAdmin',
    'async function loadAnuncio',
    'function renderAnuncio',
    'async function publicarAnuncio',
    'async function quitarAnuncioVigente',
    'function renderPagos',
    'function renderAcciones',
    'function anuncioEventosDelForm',
    'function anuncioFormDesdeRow'
  ];
  for (const fn of dentro) {
    const pos = js.indexOf(fn);
    expect(pos, `falta ${fn}`).toBeGreaterThanOrEqual(0);
    expect(pos, `${fn} debe estar DENTRO del IIFE`).toBeGreaterThan(iife);
  }

  // Antes del IIFE no puede quedar ninguna copia rota de estas funciones.
  const antes = js.slice(0, iife);
  expect(antes.trim().length, 'no debe haber código suelto antes del IIFE').toBe(0);
});

test('cada función clave aparece una sola vez', () => {
  const js = fs.readFileSync('admin-panel.js', 'utf8');
  for (const fn of ['function publicarAnuncio', 'function quitarAnuncioVigente', 'function loadPagos', 'function loadAnuncio']) {
    const n = js.split(fn).length - 1;
    expect(n, `${fn} debería aparecer exactamente una vez`).toBe(1);
  }
});
