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

test('1.500 garantías no bloquean Home y el scroll nunca deja huecos', async ({ page }) => {
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

  // Home no parsea ni dibuja la planilla durante el arranque.
  expect(await page.evaluate(() => window.usuariosTodosActual().length)).toBe(0);
  await expect(page.locator('#usuariosList .tree-node')).toHaveCount(0);

  const entrada = Date.now();
  await page.evaluate(() => {
    document.getElementById('lockScreen')?.classList.add('hidden');
    document.getElementById('bootScreen')?.classList.add('gone');
    document.body.classList.remove('appi-login-abierto', 'appi-scroll-lock');
    window.showView('view-usuarios');
  });
  await page.waitForFunction(() => window.usuariosU && window.usuariosU.length === 1500);
  await expect.poll(() => page.evaluate(() => window.estadoVirtualUsuarios())).toMatchObject({ total: 1500 });
  const abrirUsuariosMs = Date.now() - entrada;

  // La lista completa sigue en memoria, pero el navegador pinta sólo una
  // ventana amplia alrededor de la pantalla.
  let estado = await page.evaluate(() => window.estadoVirtualUsuarios());
  expect(estado.renderizados).toBeGreaterThan(10);
  expect(estado.renderizados).toBeLessThan(120);

  // Los detalles y acciones continúan montándose al desplegar la persona.
  await expect(page.locator('#usuariosList .u-product')).toHaveCount(0);
  await page.locator('#usuariosList .tree-node').first().evaluate(node => node.click());
  await expect(page.locator('#usuariosList .u-product')).toHaveCount(1);
  await expect(page.locator('#usuariosList .action-btn')).toHaveCount(6);

  // Saltos grandes equivalen a deslizar muy rápido. Siempre debe haber una
  // ficha ya preparada dentro de la pantalla en menos de un segundo.
  const demoras = [];
  for (const fraccion of [0.25, 0.5, 0.75, 0.99]) {
    const salto = Date.now();
    await page.evaluate(f => {
      const lista = document.getElementById('usuariosList');
      const canvas = lista.querySelector('.u-virtual-canvas');
      const bodyEsScroller = document.body.scrollHeight > document.documentElement.scrollHeight;
      const actual = bodyEsScroller ? document.body.scrollTop : window.scrollY;
      const destino = actual + lista.getBoundingClientRect().top + canvas.getBoundingClientRect().height * f - window.innerHeight / 2;
      if(bodyEsScroller) document.body.scrollTo(0,destino);
      else window.scrollTo(0,destino);
    }, fraccion);
    await page.waitForFunction(() => [...document.querySelectorAll('#usuariosList .tree-node')].some(node => {
      const r = node.getBoundingClientRect();
      return r.bottom > 0 && r.top < window.innerHeight;
    }), null, { timeout: 1000 });
    demoras.push(Date.now() - salto);
    estado = await page.evaluate(() => window.estadoVirtualUsuarios());
    expect(estado.renderizados).toBeLessThan(120);
  }

  // La búsqueda sigue usando las 1.500 personas en memoria, no sólo las
  // cabeceras que existen en el DOM en ese instante.
  await page.evaluate(() => {
    const input = document.getElementById('usuariosSearch');
    input.value = 'PERSONA UNICA 1234';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect.poll(() => page.evaluate(() => window.estadoVirtualUsuarios())).toMatchObject({ total: 1, renderizados: 1 });
  await expect(page.locator('#usuariosList .tree-node')).toContainText('PERSONA UNICA 1234');
  expect(await page.evaluate(() => window.usuariosTodosActual().length)).toBe(1500);
  await page.evaluate(() => {
    const input = document.getElementById('usuariosSearch');
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect.poll(() => page.evaluate(() => window.estadoVirtualUsuarios())).toMatchObject({ total: 1500 });

  // Volver arriba conserva la ficha que estaba desplegada.
  await page.evaluate(() => {
    const lista = document.getElementById('usuariosList');
    const bodyEsScroller = document.body.scrollHeight > document.documentElement.scrollHeight;
    const actual = bodyEsScroller ? document.body.scrollTop : window.scrollY;
    const destino = actual + lista.getBoundingClientRect().top;
    if(bodyEsScroller) document.body.scrollTo(0,destino);
    else window.scrollTo(0,destino);
  });
  await expect(page.locator('#usuariosList .tree-node').first()).toContainText('PERSONA UNICA 0');
  await expect(page.locator('#usuariosList .u-product')).toHaveCount(1);

  console.log(`RENDIMIENTO_USUARIOS home_ms=${cargaHomeMs} abrir_ms=${abrirUsuariosMs} scroll_max_ms=${Math.max(...demoras)}`);
  expect(cargaHomeMs).toBeLessThan(5000);
  expect(abrirUsuariosMs).toBeLessThan(5000);
  expect(Math.max(...demoras)).toBeLessThan(1000);
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
