// Reporter temporal de diagnóstico: imprime cada test fallido como anotación
// `::error::` para poder leerlo desde la API de GitHub Actions aunque el log
// esté bloqueado. Se usa sólo para depurar y luego se revierte.
'use strict';

class DiagReporter {
  onTestEnd(test, result) {
    const st = result && result.status;
    if (st !== 'passed' && st !== 'skipped' && st !== 'expected') {
      const loc = `${test.file}:${test.title}`;
      process.stdout.write(`::error file=.github::FALLO-TEST ${(test.title || loc).replace(/::/g, ';')}\n`);
    }
  }
  onEnd(result) {
    const total = result ? result.total : 0;
    const ok = result ? result.expected : 0;
    const fail = result ? result.unexpected : 0;
    process.stdout.write(`::error file=.github::RESUMEN total=${total} ok=${ok} fail=${fail}\n`);
  }
}

module.exports = DiagReporter;
