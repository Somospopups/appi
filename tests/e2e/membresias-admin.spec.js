const { test, expect } = require('@playwright/test');
const fs = require('fs');

const read = file => fs.readFileSync(file, 'utf8');

test('las membresías administrativas usan la sesión y la Edge Function protegida', () => {
  const client = read('js/membership-admin.js');
  const edge = read('supabase/functions/admin-distribuidores/index.ts');

  expect(client).toContain('window.APPIAuth.accessToken');
  expect(client).toContain('/functions/v1/admin-distribuidores');
  expect(client).not.toContain('/rest/v1/user_memberships');
  expect(client).not.toContain('Bearer ${window.APPI_AUTH.anonKey}');

  const adminCheck = edge.indexOf("profile.rol !== 'admin'");
  expect(adminCheck).toBeGreaterThan(-1);
  expect(edge.indexOf("action === 'membership_stats'")).toBeGreaterThan(adminCheck);
  expect(edge).toContain("admin.rpc('appi_admin_prorrogar_membresia'");
  expect(edge).toContain("admin.rpc('appi_admin_registrar_pago_membresia'");
  expect(edge).toContain("action === 'grant_month'");
  expect(edge).toContain('addUtcMonths(base, 1)');
  expect(edge).toContain('Esta cuenta ya tiene acceso permanente.');
});

test('la migración de membresías restringe RLS y mantiene appi_perfiles como acceso real', () => {
  const migration = read('SUPABASE_MEMBRESIAS.sql');
  const consolidated = read('SUPABASE_INSTALACION_COMPLETA.sql');
  const workflow = read('.github/workflows/deploy-backend.yml');

  expect(migration).not.toMatch(/Admins can manage all[\s\S]{0,180}using\s*\(true\)/i);
  expect(migration).toContain('revoke all on public.user_memberships from anon, authenticated');
  expect(migration).toContain('revoke all on public.membership_payments from anon, authenticated');
  expect(migration).toContain("p.rol = 'admin'");
  expect(migration).toContain('update public.appi_perfiles');
  expect(migration).toContain('appi_admin_prorrogar_membresia');
  expect(migration).toContain('appi_admin_registrar_pago_membresia');
  expect(consolidated).toContain('APPI · MEMBRESÍAS, PRÓRROGAS Y PAGOS');
  expect(workflow).toContain('SUPABASE_INSTALACION_COMPLETA.sql');
  expect(workflow).toContain('SUPABASE_MI_GENTE.sql');
  expect(workflow).toContain('SUPABASE_MEMBRESIAS.sql');
  for (const functionName of ['admin-distribuidores','solicitud-cuenta','encuesta-publica','dispositivo-puente','historico-analisis','recordatorios-gestion']) {
    expect(workflow).toContain(`functions deploy ${functionName}`);
  }
});
