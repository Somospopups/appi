const { test, expect } = require('@playwright/test');
const { entrar } = require('./helpers/app-entrar.js');

// v653 · La tarjeta de Producción del mazo del Home acumula los movimientos
// de PB uno a uno (el mismo registro diario que alimenta los avisos
// "⚡ Juan sumó +X PB"), muestra la racha de días con PB y festeja el día
// que hizo más PB de la historia del equipo.

test('la tarjeta suma los movimientos de PB uno a uno y muestra la racha', async ({ page }) => {
  await entrar(page);

  const r = await page.evaluate(() => {
    const personas = [
      { codigo: 'D1', nombre: 'Juan Perez', pnAct: 40, cat: 'Impulso' },
      { codigo: 'D2', nombre: 'Ana Gomez', pnAct: 25, cat: 'Impulso' }
    ];
    window.equipoData = { personas };
    localStorage.setItem('equipoData', JSON.stringify({ personas }));
    const key = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const hoy = key(new Date());
    const ayer = key(new Date(Date.now() - 86400000));
    window.appiPBDiario.registrar(hoy, [
      { n: 'Juan Perez', pb: 30, total: 40, tt: 65 },
      { n: 'Ana Gomez', pb: 25, total: 25, tt: 65 }
    ]);
    window.appiPBDiario.registrar(ayer, [ { n: 'Juan Perez', pb: 12, total: 12, tt: 65 } ]);
    const t = window.APPIHomeTarjetas.tarjetaPbEquipo();
    return { cat: t.cat, titulo: t.titulo, html: t.html };
  });

  expect(r.cat).toBe('pb_equipo');
  expect(r.titulo, 'el título muestra el total del día').toContain('55 PB');
  expect(r.html, 'la lista del feed una a uno').toContain('Sumando PB, uno a uno');
  expect(r.html).toContain('Juan Perez');
  expect(r.html).toContain('Ana Gomez');
  expect(r.html, 'cada movimiento con su PB').toContain('+30 PB');
  expect(r.html).toContain('+25 PB');
  expect(r.html, 'la racha encadena hoy + ayer').toContain('2 días seguidos');
});

test('el día que más PB hizo se festeja como récord histórico', async ({ page }) => {
  await entrar(page);

  const r = await page.evaluate(() => {
    const personas = [ { codigo: 'D1', nombre: 'Juan Perez', pnAct: 40, cat: 'Impulso' } ];
    window.equipoData = { personas };
    localStorage.setItem('equipoData', JSON.stringify({ personas }));
    const key = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const hoy = key(new Date());
    localStorage.setItem('appi_pb_record_v1', JSON.stringify({ pb: 40, dia: '2026-01-10', ant: null }));
    window.appiPBDiario.registrar(hoy, [
      { n: 'Juan Perez', pb: 30, total: 40, tt: 65 },
      { n: 'Ana Gomez', pb: 25, total: 25, tt: 65 }
    ]);
    const t = window.APPIHomeTarjetas.tarjetaPbEquipo();
    return { titulo: t.titulo, html: t.html };
  });

  expect(r.titulo, 'la tarjeta festeja el mejor día').toContain('Mejor día');
  expect(r.html).toContain('Mejor día del equipo');
  expect(r.html, 'cuenta cuál récord batieron').toContain('Superaron el récord de 40 PB');
});

test('con racha viva y hoy sin PB, la tarjeta pide sumar para no cortarla', async ({ page }) => {
  await entrar(page);

  const r = await page.evaluate(() => {
    const personas = [ { codigo: 'D1', nombre: 'Juan Perez', pnAct: 40, cat: 'Impulso' } ];
    window.equipoData = { personas };
    localStorage.setItem('equipoData', JSON.stringify({ personas }));
    const key = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const ayer = key(new Date(Date.now() - 86400000));
    window.appiPBDiario.registrar(ayer, [ { n: 'Juan Perez', pb: 12, total: 12, tt: 65 } ]);
    const t = window.APPIHomeTarjetas.tarjetaPbEquipo();
    return { titulo: t.titulo, html: t.html };
  });

  expect(r.titulo, 'sin PB de hoy el título queda neutro').toContain('Producción del Equipo');
  expect(r.html).toContain('Sumá PB hoy para mantener la racha de 1 día');
  expect(r.html, 'sin festejo de récord').not.toContain('Mejor día');
});

test('sin movimientos de PB no hay racha, feed ni festejo', async ({ page }) => {
  await entrar(page);

  const r = await page.evaluate(() => {
    const personas = [ { codigo: 'D1', nombre: 'Juan Perez', pnAct: 40, cat: 'Impulso' } ];
    window.equipoData = { personas };
    localStorage.setItem('equipoData', JSON.stringify({ personas }));
    const t = window.APPIHomeTarjetas.tarjetaPbEquipo();
    return { cat: t.cat, html: t.html };
  });

  expect(r.cat).toBe('pb_equipo');
  expect(r.html).toContain('Sin cargas hoy');
  expect(r.html).not.toContain('Sumando PB');
  expect(r.html).not.toContain('Mejor día');
});
