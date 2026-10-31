const { test, expect } = require('@playwright/test');

function usuariosGrandes(cantidad) {
  return Array.from({ length: cantidad }, (_, i) => ({
    id: i + 1,
    usuario: `PERSONA UNICA ${i}`,
    telf: `351${String(1000000 + i).padStart(7, '0')}`,
    domicilio: `Calle ${i}`,
    localidad: `Zona ${i % 40}`,
    producto: `Producto ${i % 8}`,
    serie: `SERIE-${i}`,
    fCompra: '15/10/2026',
    fVenceRaw: '15/10/2027',
    fVence: '2027-10-15T03:00:00.000Z',
    cumpleRaw: `${String(i % 28 + 1).padStart(2, '0')}/${String(i % 12 + 1).padStart(2, '0')}/1980`,
    email: `persona${i}@example.com`,
    estado: 'vigente'
  }));
}

test('1.500 garantías no bloquean Home y las fichas se crean sólo al abrirlas', async ({ page }) => {
  test.setTimeout(120000);
  const lista = usuariosGrandes(1500);
  await page.addInitScript(data => {
    localStorage.setItem('welcomeSeen', '1');
    localStorage.setItem('tutoVisto_v2', '1');
    localStorage.setItem('usuarios_garantias', JSON.stringify(data));
  }, lista);

  const inicio = Date.now();
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof window.showView === 'function' && typeof window.renderUsuariosPendientes === 'function');
  const cargaHomeMs = Date.now() - inicio;

  // El Home queda disponible sin parsear, agrupar ni dibujar la planilla
  // pesada. La precarga ociosa preserva después mensajes y recordatorios.
  expect(await page.evaluate(() => window.usuariosTodosActual().length)).toBe(0);
  await expect(page.locator('#usuariosList .tree-node')).toHaveCount(0);

  const entrada = Date.now();
  await page.evaluate(() => window.showView('view-usuarios'));
  await expect(page.locator('#usuariosList .tree-node')).toHaveCount(1500);
  expect(await page.evaluate(() => window.usuariosU.length)).toBe(1500);
  const abrirUsuariosMs = Date.now() - entrada;

  // Los detalles y acciones se montan bajo demanda.
  await expect(page.locator('#usuariosList .u-product')).toHaveCount(0);
  await page.locator('#usuariosList .tree-node').first().evaluate(node => node.click());
  await expect(page.locator('#usuariosList .u-product')).toHaveCount(1);
  await expect(page.locator('#usuariosList .action-btn')).toHaveCount(6);

  console.log(`RENDIMIENTO_USUARIOS home_ms=${cargaHomeMs} abrir_ms=${abrirUsuariosMs}`);
  expect(cargaHomeMs).toBeLessThan(5000);
  expect(abrirUsuariosMs).toBeLessThan(5000);
});

test('los índices rápidos conservan las reglas de identidad segura', async ({ page }) => {
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  const personas = await page.evaluate(lista => window.agruparUsuariosU(lista).map(u => ({
    nombre: u.usuario,
    productos: u.productos.length,
    series: u.productos.map(p => p.serie).sort()
  })), [
    { id: 1, usuario: 'ANA PEREZ', telf: '3515551001', email: 'ana@correo.com', serie: 'ANA-1', producto: 'A' },
    { id: 2, usuario: 'PEREZ, ANA', telf: '3515551001', serie: 'ANA-2', producto: 'B' },
    // El nombre puede variar sólo porque coinciden dos datos fuertes.
    { id: 3, usuario: 'JUAN GOMEZ', telf: '3515551002', email: 'juan@correo.com', serie: 'JUAN-1', producto: 'A' },
    { id: 4, usuario: 'JUAN MANUEL GOMEZ', telf: '3515551002', email: 'juan@correo.com', serie: 'JUAN-2', producto: 'B' },
    // Un teléfono familiar, por sí solo, no mezcla nombres diferentes.
    { id: 5, usuario: 'CARLOS LOPEZ', telf: '3515551003', serie: 'CARLOS-1', producto: 'A' },
    { id: 6, usuario: 'LAURA LOPEZ', telf: '3515551003', serie: 'LAURA-1', producto: 'A' },
    // Dos homónimos sin corroboración siguen separados para revisión manual.
    { id: 7, usuario: 'MARTIN DIAZ', telf: '3515551004', serie: 'MARTIN-1', producto: 'A' },
    { id: 8, usuario: 'MARTIN DIAZ', telf: '3515551999', serie: 'MARTIN-2', producto: 'B' }
  ]);

  expect(personas).toHaveLength(6);
  expect(personas.filter(p => p.productos === 2).map(p => p.series)).toEqual([
    ['ANA-1', 'ANA-2'],
    ['JUAN-1', 'JUAN-2']
  ]);
});
