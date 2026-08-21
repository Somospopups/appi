const { test, expect } = require('@playwright/test');
const fs = require('fs');

/* Panel de Contactos privado (v295). Bug real: la cuenta administradora veía
   en su propio Panel de Contactos los encuestados y referidos de todas las
   distribuidoras, porque las políticas RLS de gestión tenían la cláusula
   "or appi_es_admin()" y el panel pide "todo lo visible". Doble arreglo:
   políticas solo-dueño en la base y filtro por cuenta en el cliente. */

test('las políticas de gestión ya no le muestran al admin lo de los demás', () => {
  for (const archivo of ['SUPABASE_ENCUESTAS_GESTION.sql', 'SUPABASE_INSTALACION_COMPLETA.sql', 'SUPABASE_PANEL_PRIVADO.sql']) {
    const sql = fs.readFileSync(archivo, 'utf8');
    expect(sql, `${archivo} no debe tener "or appi_es_admin()" en datos personales`)
      .not.toContain('or public.appi_es_admin()');
  }
  const migracion = fs.readFileSync('SUPABASE_PANEL_PRIVADO.sql', 'utf8');
  // La migración recrea todas las políticas de datos personales de gestión.
  for (const policy of [
    'appi_encuesta_links_select_own', 'appi_encuestas_select_own', 'appi_encuestas_delete_own',
    'appi_encuesta_invitaciones_select_own', 'appi_gestion_select_own', 'appi_gestion_update_own',
    'appi_gestion_delete_own', 'appi_gestion_actividades_select_own',
    'appi_gestion_actividades_insert_own', 'appi_gestion_actividades_delete_own'
  ]) {
    expect(migracion).toContain(`drop policy if exists "${policy}"`);
    expect(migracion).toContain(`create policy "${policy}"`);
  }
});

test('el cliente filtra por cuenta: lo ajeno no entra ni desde la nube ni desde la caché', () => {
  const js = fs.readFileSync('gestion-client.js', 'utf8');
  expect(js).toContain('function soloMios(');
  // En la carga desde la nube…
  expect(js).toContain('conservarPendientes(soloMios(contacts))');
  expect(js).toContain('new Map(soloMios(surveys)');
  // …y al levantar la caché local (pudo quedar mezclada de antes del arreglo).
  expect(js).toContain('soloMios(value.contacts)');
});

test('soloMios deja pasar lo propio y descarta lo de otra cuenta', async ({ page }) => {
  await page.goto('/index.html');
  await page.waitForFunction(() => window.APPIGestion && window.APPIGestion.soloMios);
  const r = await page.evaluate(() => {
    const mios = window.APPIGestion.soloMios([
      { id: 'a', user_id: '', nombre: 'Sin dueño (fila local)' },
      { id: 'b', nombre: 'Sin campo user_id' },
      { id: 'c', user_id: 'otra-cuenta-distinta', nombre: 'Contacto ajeno' }
    ]);
    return mios.map(x => x.id);
  });
  // Sin sesión, el uid es '': las filas locales pasan, la de otra cuenta no.
  expect(r).toContain('a');
  expect(r).toContain('b');
  expect(r).not.toContain('c');
});
