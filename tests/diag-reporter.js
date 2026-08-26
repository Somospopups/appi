// Reporter temporal de diagnóstico: imprime cada test fallido como anotación
// `::error::` con su mensaje, para leerlo desde la API aunque el log esté
// bloqueado. Se usa sólo para depurar y luego se revierte.
'use strict';

function limpio(s) {
  return String(s == null ? '' : s).replace(/::/g, ';').replace(/[\r\n]+/g, ' ').slice(0, 400);
}

class DiagReporter {
  onTestEnd(test, result) {
    const st = result && result.status;
    if (st !== 'passed' && st !== 'skipped' && st !== 'expected') {
      const msg = result && result.error && result.error.message
        ? ' | ERR ' + limpio(result.error.message) : ' (sin detalle)';
      process.stdout.write(`::error file=.github::FALLO-TEST ${limpio(test.title)}${msg}\n`);
    }
  }
}

module.exports = DiagReporter;
