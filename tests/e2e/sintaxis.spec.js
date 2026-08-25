const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

/* Guardia de sintaxis (v354): la franja "Tareas del día" desapareció en todos
   los dispositivos porque a `mensajes-usuarios.js` le había quedado pegada,
   DESPUÉS del cierre del IIFE, una copia repetida de la cola del
   `window.APPIMensajes = {…}`. Ese texto suelto arrancaba con un `Hoy,`
   inválido y el navegador, ante un SyntaxError en un script clásico, no ejecuta
   ni una línea del archivo: el módulo entero quedaba muerto en silencio y sólo
   se notaba porque una pantalla dejaba de dibujarse.

   Ningún spec anterior lo pescaba: los de navegador necesitaban levantar la app
   y los de texto sólo miran el contenido de archivos puntuales. Acá se compila
   cada archivo que la app carga, así un corte así falla en el runner antes de
   publicarse. */

function jsDelRepo() {
  const raiz = path.resolve(__dirname, '..', '..');
  const dirs = [raiz, path.join(raiz, 'js')];
  const fuera = new Set(['playwright.config.js']);
  const archivos = [];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    for (const nombre of fs.readdirSync(dir)) {
      if (!nombre.endsWith('.js')) continue;
      if (fuera.has(nombre)) continue;
      archivos.push(path.join(dir, nombre));
    }
  }
  return archivos;
}

/* Los <script> inline de los HTML, salvo los que no son JavaScript
   (importmap, application/json, …). */
function scriptsInline(archivo) {
  const html = fs.readFileSync(archivo, 'utf8');
  const bloques = [];
  const patron = /<script\b([^>]*)>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = patron.exec(html))) {
    const attrs = m[1] || '';
    const cuerpo = m[2] || '';
    if (/\bsrc\s*=/.test(attrs)) continue;
    if (/importmap|application\/json|text\/plain/i.test(attrs)) continue;
    if (!cuerpo.trim()) continue;
    const linea = html.slice(0, m.index).split('\n').length;
    bloques.push({ archivo, linea, cuerpo });
  }
  return bloques;
}

function compila(codigo, nombre) {
  const tmp = path.join(require('os').tmpdir(), `appi-sintaxis-${Date.now()}-${Math.random().toString(36).slice(2)}.js`);
  fs.writeFileSync(tmp, codigo, 'utf8');
  try {
    execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' });
    return null;
  } catch (e) {
    const stderr = String(e.stderr || '');
    return `${nombre}: ${stderr.split('\n').find((l) => /SyntaxError|Error:/.test(l)) || stderr.trim() || 'no compila'}`;
  } finally {
    try { fs.unlinkSync(tmp); } catch (_) {}
  }
}

test('todos los .js de la app compilan: ningún script clásico queda muerto', () => {
  const archivos = jsDelRepo();
  expect(archivos.length, 'debería encontrar los .js de la app').toBeGreaterThan(20);

  const rotos = [];
  for (const archivo of archivos) {
    const error = compila(fs.readFileSync(archivo, 'utf8'), path.relative(process.cwd(), archivo));
    if (error) rotos.push(error);
  }
  expect(rotos, `Archivos que no compilan (la app no los va a ejecutar):\n${rotos.join('\n')}`).toEqual([]);
});

test('los scripts inline de los HTML también compilan', () => {
  const htmls = ['index.html', 'encuesta.html', 'revisar-contactos.html']
    .filter((f) => fs.existsSync(f));
  expect(htmls.length).toBeGreaterThan(0);

  const bloques = htmls.flatMap(scriptsInline);
  expect(bloques.length, 'debería encontrar scripts inline').toBeGreaterThan(5);

  const rotos = [];
  for (const b of bloques) {
    const error = compila(b.cuerpo, `${b.archivo}:${b.linea}`);
    if (error) rotos.push(error);
  }
  expect(rotos, `Scripts inline que no compilan:\n${rotos.join('\n')}`).toEqual([]);
});

test('mensajes-usuarios.js define su objeto público una sola vez', () => {
  /* El caso concreto que rompió la franja fue una copia repetida de la cola del
     objeto público pegada después del cierre del IIFE. Contar las definiciones
     atrapa la repetición; el SyntaxError resultante lo atrapa el test de
     compilación de arriba, que es el que de verdad impide publicar. */
  const js = fs.readFileSync('mensajes-usuarios.js', 'utf8');
  const n = js.split('window.APPIMensajes = {').length - 1;
  expect(n, 'window.APPIMensajes debería definirse exactamente una vez').toBe(1);

  // Y cada función exportada aparece una sola vez en el objeto.
  for (const fn of ['pintarHoy: pintarHoy', 'deHoy: deHoy', 'marcarAccion: marcarAccion']) {
    const veces = js.split(fn).length - 1;
    expect(veces, `${fn} debería aparecer exactamente una vez`).toBe(1);
  }
});
