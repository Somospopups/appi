const { test, expect } = require('@playwright/test');
const fs = require('fs');

// Archivos de la app que el usuario puede llegar a abrir.
// appi-dialog.js queda fuera: es el puente que redefine window.alert
// como último recurso y define la API APPIDialog.
const ARCHIVOS = [
  'index.html', 'encuesta.html', 'revisar-contactos.html',
  'gestion-client.js', 'historico.js', 'data-sync.js', 'auth-client.js',
  'admin-panel.js', 'account-request.js', 'device-bridge.js', 'whatsapp-app.js'
];

test('no hay alert/confirm/prompt nativos: siempre APPIDialog', () => {
  // Convención del README: los diálogos nativos quedan prohibidos.
  // El lookbehind descarta los usos de APPIDialog (llevan un punto antes).
  const problemas = [];
  const patron = /(?<![.\w])(?:window\.)?(?:alert|confirm|prompt)\s*\(/;

  for (const archivo of ARCHIVOS) {
    if (!fs.existsSync(archivo)) continue;
    const lineas = fs.readFileSync(archivo, 'utf8').split('\n');
    lineas.forEach((linea, i) => {
      // Sin el contenido de strings, templates ni comentarios de línea
      // para evitar falsos positivos.
      const codigo = linea
        .replace(/'(?:[^'\\]|\\.)*'/g, "''")
        .replace(/`[^`]*`/g, "''")
        .replace(/\s\/\/.*$/, '');
      if (patron.test(codigo)) {
        problemas.push(`${archivo}:${i + 1}: ${linea.trim().slice(0, 90)}`);
      }
    });
  }

  expect(problemas, `Diálogos nativos detectados (usar APPIDialog):\n${problemas.join('\n')}`).toEqual([]);
});
