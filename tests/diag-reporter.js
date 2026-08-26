// Reporter temporal de diagnóstico: imprime cada test fallido como anotación
// `::error::` con su mensaje, para leerlo desde la API aunque el log esté
// bloqueado. Se usa sólo para depurar y luego se revierte.
'use strict';

class DiagReporter {
  onTestEnd(test, result) {
    const st = result && result.status;
    if (st !== 'passed' && st !== 'skipped' && st !== 'expected') {
      const msg = (result && result.error && result.error.message)
        ? String(result.error.message).replace(/::/g, ';').slice(0, 600)
        : '(sin detalle de error)';
      const t = String(test.title).replace(/::/g, ';');
      process.stdout.write(`::error file=${test.file.replace(/[^a-z0-9_./-]/gi,'_')}::FALLO-TEST ${t} || ERR ${msg}\n`);
    }
  }
}

module.exports = DiagReporter;
