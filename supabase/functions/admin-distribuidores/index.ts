import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' };
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: jsonHeaders });

function parseDip(value: unknown) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 14);
  if (digits.length < 3) return null;
  return { canonical: `${digits.slice(0, 2)}-${digits.slice(2)}`, sucursal: digits.slice(0, 2), numero: digits.slice(2) };
}
function emailForDip(dip: string) {
  return `dip-${dip}@${Deno.env.get('DISTRIBUTOR_EMAIL_DOMAIN') || 'distribuidores.appi.invalid'}`;
}
function validPassword(value: unknown) {
  const password = String(value || '');
  return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
}
function cleanName(value: unknown) { return String(value || '').trim().replace(/\s+/g, ' ').slice(0, 120); }
function cleanWhatsapp(value: unknown) {
  return String(value || '').replace(/\D/g, '').slice(0, 15);
}
function validUuid(value: unknown) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}
function addUtcMonths(value: Date, months: number) {
  const result = new Date(value);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Método no permitido' }, 405);
  const supabaseUrl = Deno.env.get('SUPABASE_URL'), serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRole) return json({ error: 'Falta configuración del servidor.' }, 503);
  const jwt = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!jwt) return json({ error: 'Sesión requerida.' }, 401);
  const admin = createClient(supabaseUrl, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: authData, error: authError } = await admin.auth.getUser(jwt);
  if (authError || !authData.user) return json({ error: 'Sesión inválida.' }, 401);
  const { data: profile } = await admin.from('appi_perfiles').select('user_id,username,nombre,rol,activo').eq('user_id', authData.user.id).maybeSingle();
  if (!profile || profile.rol !== 'admin' || profile.activo !== true) return json({ error: 'Se requiere una cuenta administradora.' }, 403);

  async function syncMembership(userId: string, values: Record<string, unknown>) {
    const row = { user_id: userId, ...values, updated_at: new Date().toISOString() };
    const { data, error } = await admin.from('user_memberships')
      .upsert(row, { onConflict: 'user_id' })
      .select('*')
      .single();
    if (error) throw new Error(`No se pudo actualizar la membresía: ${error.message}`);
    return data;
  }

  async function createDistributor(dipValue: unknown, nameValue: unknown, partnerValue: unknown, passwordValue: unknown, membershipValue: unknown) {
    const dip = parseDip(dipValue), nombre = cleanName(nameValue), socioNombre = cleanName(partnerValue), password = String(passwordValue || ''), membership = Number(membershipValue);
    if (!dip) throw new Error('Ingresá una sucursal de 2 dígitos y el número de distribuidor.');
    if (nombre.length < 2) throw new Error('Ingresá el nombre del titular.');
    if (socioNombre && socioNombre.length < 2) throw new Error('Ingresá el nombre completo del socio/a.');
    if (!validPassword(password)) throw new Error('La contraseña necesita 8 caracteres, letras y números.');
    if (![1,3,6].includes(membership)) throw new Error('Elegí una membresía de 1, 3 o 6 meses.');
    const { data: existing } = await admin.from('appi_perfiles').select('user_id').eq('dip', dip.canonical).maybeSingle();
    if (existing) throw new Error('Ese distribuidor ya tiene una cuenta.');
    const { data: created, error: createError } = await admin.auth.admin.createUser({ email: emailForDip(dip.canonical), password, email_confirm: true, user_metadata: { dip: dip.canonical, nombre, socio_nombre: socioNombre || null } });
    if (createError || !created.user) throw new Error(createError?.message || 'No se pudo crear la cuenta.');
    const startedAt = new Date(), expiresAt = new Date(startedAt); expiresAt.setUTCMonth(expiresAt.getUTCMonth() + membership);
    const user = { user_id: created.user.id, username: null, dip: dip.canonical, sucursal: dip.sucursal, numero_distribuidor: dip.numero, nombre, socio_nombre: socioNombre || null, rol: 'usuario', activo: true, debe_cambiar_password: true, membresia_meses: membership, membresia_inicio: startedAt.toISOString(), membresia_vence: expiresAt.toISOString() };
    const { error: insertError } = await admin.from('appi_perfiles').insert(user);
    if (insertError) { await admin.auth.admin.deleteUser(created.user.id).catch(() => null); throw new Error(insertError.message); }
    try {
      await syncMembership(created.user.id, {
        status: 'active',
        starts_at: startedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        monthly_fee: 5000,
        grace_period_until: null,
        grace_period_notes: null,
      });
    } catch (error) {
      await admin.auth.admin.deleteUser(created.user.id).catch(() => null);
      throw error;
    }
    return user;
  }

  try {
    const body = await request.json(), action = String(body?.action || '');
    if (action === 'list') {
      const { data, error } = await admin.from('appi_perfiles').select('user_id,username,dip,sucursal,numero_distribuidor,nombre,socio_nombre,rol,activo,debe_cambiar_password,membresia_meses,membresia_inicio,membresia_vence,created_at,updated_at').order('dip', { ascending: true });
      if (error) throw error; return json({ users: data || [] });
    }
    if (action === 'list_requests') {
      const { data, error } = await admin.from('appi_solicitudes').select('id,nombre,socio_nombre,dip,sucursal,numero_distribuidor,telefono,estado,created_at').eq('estado', 'pendiente').order('created_at', { ascending: false });
      if (error) throw error; return json({ requests: data || [] });
    }
    if (action === 'get_settings') {
      const { data, error } = await admin.from('appi_configuracion').select('config_value').eq('config_key', 'whatsapp_soporte').maybeSingle();
      if (error) throw error; return json({ whatsapp: String(data?.config_value?.numero || '') });
    }
    if (action === 'membership_stats') {
      const [{ data: payments, error: paymentsError }, { data: memberships, error: membershipsError }, { data: users, error: usersError }] = await Promise.all([
        admin.from('membership_payments').select('amount,payment_date'),
        admin.from('user_memberships').select('status,grace_period_until'),
        admin.from('appi_perfiles').select('activo,membresia_vence').eq('rol', 'usuario'),
      ]);
      if (paymentsError) throw paymentsError;
      if (membershipsError) throw membershipsError;
      if (usersError) throw usersError;
      const now = Date.now(), monthStart = new Date(); monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0);
      const totalRevenue = (payments || []).reduce((sum, row) => sum + Number(row.amount || 0), 0);
      const monthlyRevenue = (payments || []).filter(row => new Date(row.payment_date).getTime() >= monthStart.getTime()).reduce((sum, row) => sum + Number(row.amount || 0), 0);
      const activeUsers = (users || []).filter(row => row.activo === true && new Date(row.membresia_vence || 0).getTime() > now).length;
      const gracePeriodUsers = (memberships || []).filter(row => row.status === 'grace_period' && new Date(row.grace_period_until || 0).getTime() > now).length;
      const expiredUsers = (users || []).filter(row => new Date(row.membresia_vence || 0).getTime() <= now).length;
      return json({ total_revenue: totalRevenue, monthly_revenue: monthlyRevenue, active_users: activeUsers, grace_period_users: gracePeriodUsers, expired_users: expiredUsers });
    }
    if (action === 'set_whatsapp') {
      const numero = cleanWhatsapp(body?.numero); if (numero.length < 8) return json({ error: 'Ingresá un número de WhatsApp válido con código de país.' }, 400);
      const { error } = await admin.from('appi_configuracion').upsert({ config_key: 'whatsapp_soporte', config_value: { numero }, updated_at: new Date().toISOString() });
      if (error) throw error; return json({ whatsapp: numero });
    }
    if (action === 'create') return json({ user: await createDistributor(body?.dip, body?.nombre, body?.socio_nombre, body?.password, body?.membership_months) }, 201);
    if (action === 'approve_request') {
      const requestId = String(body?.request_id || '');
      const { data: pending, error: pendingError } = await admin.from('appi_solicitudes').select('*').eq('id', requestId).eq('estado', 'pendiente').maybeSingle();
      if (pendingError || !pending) return json({ error: 'La solicitud ya no está pendiente.' }, 404);
      const user = await createDistributor(pending.dip, pending.nombre, pending.socio_nombre, body?.password, body?.membership_months);
      const { error } = await admin.from('appi_solicitudes').update({ estado: 'aprobada', reviewed_at: new Date().toISOString(), reviewed_by: authData.user.id }).eq('id', requestId);
      if (error) throw error; return json({ user, request: { id: pending.id, telefono: pending.telefono, nombre: pending.nombre } });
    }
    if (action === 'reject_request') {
      const { error } = await admin.from('appi_solicitudes').update({ estado: 'rechazada', reviewed_at: new Date().toISOString(), reviewed_by: authData.user.id }).eq('id', String(body?.request_id || '')).eq('estado', 'pendiente');
      if (error) throw error; return json({ ok: true });
    }

    const targetId = String(body?.user_id || '');
    if (!validUuid(targetId)) return json({ error: 'Usuario inválido.' }, 400);
    if (targetId === authData.user.id && ['set_active','delete_user'].includes(action)) return json({ error: 'No podés modificar o eliminar tu propia cuenta administradora.' }, 400);
    if (action === 'ensure_membership') {
      const { data: target, error } = await admin.from('appi_perfiles').select('user_id,membresia_inicio,membresia_vence').eq('user_id', targetId).eq('rol', 'usuario').maybeSingle();
      if (error) throw error;
      if (!target) return json({ error: 'La cuenta no existe.' }, 404);
      const monthlyFee = Number(body?.monthly_fee || 5000);
      if (!Number.isFinite(monthlyFee) || monthlyFee <= 0 || monthlyFee > 1_000_000_000) return json({ error: 'El importe mensual no es válido.' }, 400);
      const expiresAt = target.membresia_vence ? new Date(target.membresia_vence) : addUtcMonths(new Date(), 1);
      const membership = await syncMembership(targetId, {
        status: expiresAt.getTime() > Date.now() ? 'active' : 'expired',
        starts_at: target.membresia_inicio || new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        monthly_fee: monthlyFee,
      });
      return json({ membership });
    }
    if (action === 'set_grace_period') {
      const rawDate = String(body?.grace_period_until || '');
      const until = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? new Date(`${rawDate}T23:59:59.999-03:00`) : new Date('invalid');
      if (Number.isNaN(until.getTime()) || until.getTime() <= Date.now() || until.getTime() > Date.now() + 366 * 86400000) return json({ error: 'Elegí una fecha futura dentro de los próximos 12 meses.' }, 400);
      const notes = String(body?.notes || '').trim().replace(/\s+/g, ' ').slice(0, 1000);
      const { data, error } = await admin.rpc('appi_admin_prorrogar_membresia', { p_user_id: targetId, p_until: until.toISOString(), p_notes: notes });
      if (error) throw error;
      await admin.auth.admin.updateUserById(targetId, { ban_duration: 'none' }).catch(() => null);
      return json({ membership: data });
    }
    if (action === 'register_membership_payment') {
      const amount = Number(body?.amount), method = String(body?.payment_method || '').toLowerCase();
      if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) return json({ error: 'Ingresá un monto válido.' }, 400);
      if (!['transferencia','efectivo','mercadopago','otro'].includes(method)) return json({ error: 'El método de pago no es válido.' }, 400);
      const notes = String(body?.notes || '').trim().slice(0, 1000);
      const { data, error } = await admin.rpc('appi_admin_registrar_pago_membresia', { p_user_id: targetId, p_amount: amount, p_method: method, p_notes: notes });
      if (error) throw error;
      await admin.auth.admin.updateUserById(targetId, { ban_duration: 'none' }).catch(() => null);
      return json(data || { ok: true });
    }
    if (action === 'update_people') {
      const nombre = cleanName(body?.nombre), socioNombre = cleanName(body?.socio_nombre);
      if (nombre.length < 2) return json({ error: 'Ingresá el nombre del titular.' }, 400);
      if (socioNombre && socioNombre.length < 2) return json({ error: 'Ingresá el nombre completo del socio/a.' }, 400);
      const { data, error } = await admin.from('appi_perfiles').update({ nombre, socio_nombre: socioNombre || null }).eq('user_id', targetId).eq('rol', 'usuario').select('user_id,dip,nombre,socio_nombre').maybeSingle();
      if (error) throw error;if (!data) return json({ error: 'La cuenta no existe.' }, 404);
      if (!socioNombre) {
        await admin.from('appi_dispositivos_vinculados').update({ activo: false, notificaciones: false, push_endpoint: null, push_p256dh: null, push_auth: null }).eq('user_id', targetId).eq('persona_tipo', 'socio');
        await admin.from('appi_vinculaciones_dispositivo').update({ cancelled_at: new Date().toISOString() }).eq('user_id', targetId).eq('persona_tipo', 'socio').is('claimed_at', null).is('cancelled_at', null);
      }
      return json({ user: data });
    }
    if (action === 'set_password') {
      if (!validPassword(body?.password)) return json({ error: 'La contraseña necesita 8 caracteres, letras y números.' }, 400);
      const { error } = await admin.auth.admin.updateUserById(targetId, { password: String(body.password) }); if (error) throw error;
      const { error: profileError } = await admin.from('appi_perfiles').update({ debe_cambiar_password: true }).eq('user_id', targetId); if (profileError) throw profileError;
      return json({ ok: true });
    }
    if (action === 'set_membership') {
      const months = Number(body?.membership_months); if (![1,3,6].includes(months)) return json({ error: 'Elegí una membresía de 1, 3 o 6 meses.' }, 400);
      const startedAt = new Date(), expiresAt = new Date(startedAt); expiresAt.setUTCMonth(expiresAt.getUTCMonth() + months);
      const { data, error } = await admin.from('appi_perfiles').update({ membresia_meses: months, membresia_inicio: startedAt.toISOString(), membresia_vence: expiresAt.toISOString(), activo: true }).eq('user_id', targetId).select('user_id,dip,nombre,membresia_meses,membresia_inicio,membresia_vence,activo').single(); if (error) throw error;
      await syncMembership(targetId, { status: 'active', starts_at: startedAt.toISOString(), expires_at: expiresAt.toISOString(), grace_period_until: null, grace_period_notes: null });
      await admin.auth.admin.updateUserById(targetId, { ban_duration: 'none' }).catch(() => null);
      return json({ user: data });
    }
    if (action === 'delete_user') {
      const { error } = await admin.auth.admin.deleteUser(targetId); if (error) throw error;
      return json({ ok: true });
    }
    if (action === 'set_active') {
      const activo = body?.activo === true;
      const { data, error } = await admin.from('appi_perfiles').update({ activo }).eq('user_id', targetId).select('user_id,username,dip,sucursal,numero_distribuidor,nombre,socio_nombre,rol,activo').single(); if (error) throw error;
      const { error: authUpdateError } = await admin.auth.admin.updateUserById(targetId, { ban_duration: activo ? 'none' : '876000h' }); if (authUpdateError) throw authUpdateError;
      return json({ user: data });
    }
    return json({ error: 'Acción desconocida.' }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Error inesperado.' }, 500);
  }
});
