const { test, expect } = require('@playwright/test');
const fs = require('fs');

/* Panel de administración más ordenado (v300): crear cuenta en un popup,
   solicitudes que parpadean, cumplimiento minimizable con buscador,
   usuarios en prueba en las estadísticas, ingresos por mes y credenciales
   en dos mensajes de WhatsApp separados. */

const html = () => fs.readFileSync('index.html', 'utf8');
const panel = () => fs.readFileSync('admin-panel.js', 'utf8');

test('crear cuenta es un botón y el formulario vive en un popup', () => {
  const h = html();
  expect(h).toContain('id="adminOpenCreate"');
  expect(h).toContain('id="adminCreateOverlay"');
  // El formulario completo está adentro del popup, incluido el WhatsApp opcional.
  const overlay = h.slice(h.indexOf('id="adminCreateOverlay"'), h.indexOf('id="adminCreateOverlay"') + 4000);
  for (const id of ['adminSucursal', 'adminNumero', 'adminNombre', 'adminTelefono', 'adminTempPassword', 'adminCreateMembership', 'adminCreateUser']) {
    expect(overlay).toContain(`id="${id}"`);
  }
  const js = panel();
  expect(js).toContain('function abrirCrearCuenta');
  expect(js).toContain('function cerrarCrearCuenta');
});

test('las solicitudes pendientes parpadean fuerte mientras haya alguna', () => {
  const h = html();
  expect(h).toContain('id="adminPendingBadge"');
  expect(h).toContain('@keyframes adminBlinkHard');
  const js = panel();
  expect(js).toContain("classList.toggle('blinking',state.requests.length>0)");
});

test('el cumplimiento diario se minimiza, tiene buscador y ordena alfabético', () => {
  const h = html();
  expect(h).toContain('id="adminAccionesToggle"');
  expect(h).toContain('id="adminAccionesSearch"');
  expect(h).toContain('id="adminAccionesResumen"');
  // Arranca cerrado: el cuerpo nace oculto.
  expect(h).toMatch(/id="adminAccionesBody" hidden/);
  const js = panel();
  expect(js).toContain('localeCompare');
  expect(js).toContain('state.accionesFiltro');
});

test('el tablero reemplaza a las tarjetas sueltas y muestra la prueba', () => {
  const h = html();
  expect(h).toContain('id="adminHero"');
  expect(h).toContain('Necesitan tu atención');
  expect(h).toContain('id="adminGoRequests"');
  // Lo viejo se fue de verdad: ni las 4 tarjetas ni el panel de membresías.
  expect(h).not.toContain('adminStatTotal');
  expect(h).not.toContain('revenueStatsContainer');
  expect(h).not.toContain('Configuración de Precios');
  // Ingresos y Configuración quedaron colapsables.
  expect(h).toContain('id="adminIngresosToggle"');
  expect(h).toContain('id="adminConfigToggle"');
  const js = panel();
  expect(js).toContain('function renderHero');
  expect(js).toContain('function renderAtencion');
  expect(js).toContain('en prueba');
  expect(js).toContain('vs. mes anterior');
});

test('los ingresos se ven por mes con total, nombres y resumen anual', () => {
  const h = html();
  expect(h).toContain('Ingresos por mes');
  expect(h).toContain('id="adminIngresosBody"');
  const js = panel();
  expect(js).toContain('appi_admin_pagos');
  expect(js).toContain('Recaudado en el mes');
  expect(js).toContain('admin-anio-strip');
  const sql = fs.readFileSync('SUPABASE_INGRESOS_ADMIN.sql', 'utf8');
  expect(sql).toContain('create or replace function public.appi_admin_pagos');
  expect(sql).toContain("rol = 'admin'");
  expect(sql).toContain('membership_payments');
});

test('las credenciales viajan en dos mensajes: bienvenida y contraseña sola', () => {
  const js = panel();
  expect(js).toContain('Enviar bienvenida y pasos');
  expect(js).toContain('Enviar solo la contraseña');
  // El mensaje de la contraseña es la contraseña, ni una palabra más.
  expect(js).toContain('abrirWhatsAppCredencial(telefono,String(password),nombre)');
  // La bienvenida explica los pasos y avisa que la clave llega aparte, sin incluirla.
  expect(js).toContain('te la mando en un mensaje aparte');
  const bienvenida = js.slice(js.indexOf('function mensajeBienvenida'), js.indexOf('function abrirWhatsAppCredencial'));
  expect(bienvenida).not.toContain('${password}');
  // Y el popup existe en los dos flujos: crear y aprobar.
  expect(js.match(/popupCredenciales\(\{/g).length).toBeGreaterThanOrEqual(3);
});

test('los envíos del panel abren el WhatsApp elegido (normal o Business)', () => {
  const h = html();
  expect(h).toContain('id="adminWaPref"');
  expect(h).toContain('data-wa-pref="normal"');
  expect(h).toContain('data-wa-pref="business"');
  const js = panel();
  expect(js).toContain('setPreferencia(b.dataset.waPref)');
});

test('un popup largo scrollea en vez de desbordarse', async ({ page }) => {
  await page.goto('/index.html');
  await page.waitForFunction(() => window.APPIDialog && window.APPIDialog.alert);
  const r = await page.evaluate(() => {
    window.APPIDialog.alert('línea de guía\n'.repeat(300), { title: 'Ayuda larga', icon: '?' });
    const msg = document.getElementById('appiDialogMessage');
    const card = msg.closest('.appi-dialog-card');
    return {
      scrollea: msg.scrollHeight > msg.clientHeight,
      entra: card.getBoundingClientRect().height <= window.innerHeight
    };
  });
  expect(r.scrollea).toBe(true);
  expect(r.entra).toBe(true);
});


test('los distribuidores: minimizable, WhatsApp directo y PARA SIEMPRE (v312)', () => {
  const h = html();
  // La sección se minimiza como el cumplimiento.
  expect(h).toContain('id="adminUsersToggle"');
  expect(h).toContain('id="adminUsersResumen"');
  expect(h).toMatch(/id="adminUsersBody" hidden/);
  // La píldora nueva de creación.
  expect(h).toContain('data-create-membership="siempre"');
  const js = panel();
  // Cada renglón se abre con sus acciones cómodas.
  expect(js).toContain('data-user-toggle');
  expect(js).toContain('admin-user-acciones');
  // WhatsApp al distribuidor con el mensaje amable.
  expect(js).toContain('whatsapp_dist');
  expect(js).toContain('¿Cómo vas con APPI?');
  // Para siempre: acción por cuenta + RPC + badge.
  expect(js).toContain("data-admin-action=\"forever\"");
  expect(js).toContain('appi_admin_para_siempre');
  expect(js).toContain('♾️ PARA SIEMPRE');
  const sql = fs.readFileSync('SUPABASE_PARA_SIEMPRE.sql', 'utf8');
  expect(sql).toContain('create or replace function public.appi_admin_para_siempre');
  expect(sql).toContain("rol = 'admin'");
  expect(sql).toContain('2099-12-31');
});

test('el teléfono del distribuidor queda guardado y el 💬 va directo (v313)', () => {
  const js = panel();
  // Al aprobar, el teléfono de la solicitud pasa al perfil sin pasos extra.
  expect(js).toContain('guardarTelefono(result.user.user_id,item.telefono)');
  // Al crear, el teléfono opcional también queda.
  expect(js).toContain('guardarTelefono(data.user.user_id,telefonoNuevo)');
  // El botón va directo con número válido y ofrece cargarlo si falta.
  expect(js).toContain("state.telefonos.get(userId)");
  expect(js).toContain('appi_admin_set_telefono');
  expect(js).toContain('appi_admin_telefonos');
  expect(js).toContain('data-admin-action="phone"');
  const sql = fs.readFileSync('SUPABASE_TELEFONOS.sql', 'utf8');
  expect(sql).toContain('add column if not exists telefono');
  expect(sql).toContain("rol = 'admin'");
  expect(sql).toContain('appi_admin_set_telefono');
});
