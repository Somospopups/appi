const { test, expect } = require('@playwright/test');
const fs = require('fs');

/* Cumplimiento diario (v292): las marcas ✓/✗ del día viajan a la nube y el
   administrador ve el resumen de todas las cuentas. Estas pruebas cuidan la
   cadena completa: clave sincronizada → migración SQL → panel admin. */

test('las marcas del día se sincronizan: la clave está en data-sync', () => {
  const js = fs.readFileSync('data-sync.js', 'utf8');
  expect(js).toContain("'appi_acciones_v1_'");
  // v399: una sola lista para titular y socio.
  expect(js).toContain('isAccionesKey');
  expect(js).toContain('mergeAccionesValue');
  expect(js).toContain("PERSON_PREFIX+'appi_acciones_v1_'");
});

test('la migración del cumplimiento existe y solo responde al admin', () => {
  const sql = fs.readFileSync('SUPABASE_ACCIONES_DIA.sql', 'utf8');
  expect(sql).toContain('create or replace function public.appi_admin_cumplimiento');
  expect(sql).toContain("rol = 'admin'");
  expect(sql).toContain('security definer');
  expect(sql).toContain('set search_path = public');
  // Cubre el espacio del titular y el del socio/a.
  expect(sql).toContain("appi\\_acciones\\_v1\\_%");
  expect(sql).toContain("persona\\_socio\\_\\_appi\\_acciones\\_v1\\_%");
  // Un JSON corrupto no puede voltear la consulta del panel.
  expect(sql).toContain('appi_json_seguro');
});

test('el panel admin tiene la sección de cumplimiento y la carga', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  expect(html).toContain('Cumplimiento diario');
  expect(html).toContain('id="adminAccionesList"');
  expect(html).toContain('id="adminRefreshAcciones"');
  const js = fs.readFileSync('admin-panel.js', 'utf8');
  expect(js).toContain('appi_admin_cumplimiento');
  expect(js).toContain('SUPABASE_ACCIONES_DIA.sql');
  expect(js).toContain('loadAcciones');
});

test('el carrusel obliga a marcar: no queda ningún saltear en el módulo', () => {
  const js = fs.readFileSync('mensajes-usuarios.js', 'utf8');
  expect(js).not.toContain('muFilaSaltar');
  expect(js.toLowerCase()).not.toContain('saltear');
  expect(js).toContain('muFilaHecha');
  expect(js).toContain('muFilaNoHecha');
  // El progreso de una ✓ vive más allá del día y la tarjeta identifica la
  // fecha de la agenda para no confundirla con la de ayer.
  expect(js).toContain('completadas');
  expect(js).toContain('claveAccion');
  expect(js).toContain('mu-hoy-fecha');
});
