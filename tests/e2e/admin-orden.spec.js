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
