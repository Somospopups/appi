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
function cleanWhatsapp(value: unknown) {
  return String(value || '').replace(/\D/g, '').slice(0, 15);
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

  async function createDistributor(dipValue: unknown, nameValue: unknown, passwordValue: unknown, membershipValue: unknown) {
    const dip = parseDip(dipValue), nombre = String(nameValue || '').trim().replace(/\s+/g, ' ').slice(0, 120), password = String(passwordValue || ''), membership = Number(membershipValue);
    if (!dip) throw new Error('Ingresá una sucursal de 2 dígitos y el número de distribuidor.');
    if (nombre.length < 2) throw new Error('Ingresá el nombre del distribuidor.');
    if (!validPassword(password)) throw new Error('La contraseña necesita 8 caracteres, letras y números.');
    if (![1,3,6].includes(membership)) throw new Error('Elegí una membresía de 1, 3 o 6 meses.');
    const { data: existing } = await admin.from('appi_perfiles').select('user_id').eq('dip', dip.canonical).maybeSingle();
    if (existing) throw new Error('Ese distribuidor ya tiene una cuenta.');
    const { data: created, error: createError } = await admin.auth.admin.createUser({ email: emailForDip(dip.canonical), password, email_confirm: true, user_metadata: { dip: dip.canonical, nombre } });
    if (createError || !created.user) throw new Error(createError?.message || 'No se pudo crear la cuenta.');
    const startedAt = new Date(), expiresAt = new Date(startedAt); expiresAt.setUTCMonth(expiresAt.getUTCMonth() + membership);
    const user = { user_id: created.user.id, username: null, dip: dip.canonical, sucursal: dip.sucursal, numero_distribuidor: dip.numero, nombre, rol: 'usuario', activo: true, debe_cambiar_password: true, membresia_meses: membership, membresia_inicio: startedAt.toISOString(), membresia_vence: expiresAt.toISOString() };
    const { error: insertError } = await admin.from('appi_perfiles').insert(user);
    if (insertError) { await admin.auth.admin.deleteUser(created.user.id).catch(() => null); throw new Error(insertError.message); }
    return user;
  }

  try {
    const body = await request.json(), action = String(body?.action || '');
    if (action === 'list') {
      const { data, error } = await admin.from('appi_perfiles').select('user_id,username,dip,sucursal,numero_distribuidor,nombre,rol,activo,debe_cambiar_password,membresia_meses,membresia_inicio,membresia_vence,created_at,updated_at').order('dip', { ascending: true });
      if (error) throw error; return json({ users: data || [] });
    }
    if (action === 'list_requests') {
      const { data, error } = await admin.from('appi_solicitudes').select('id,nombre,dip,sucursal,numero_distribuidor,telefono,estado,created_at').eq('estado', 'pendiente').order('created_at', { ascending: false });
      if (error) throw error; return json({ requests: data || [] });
    }
    if (action === 'get_settings') {
      const { data, error } = await admin.from('appi_configuracion').select('config_value').eq('config_key', 'whatsapp_soporte').maybeSingle();
      if (error) throw error; return json({ whatsapp: String(data?.config_value?.numero || '') });
    }
    if (action === 'set_whatsapp') {
      const numero = cleanWhatsapp(body?.numero); if (numero.length < 8) return json({ error: 'Ingresá un número de WhatsApp válido con código de país.' }, 400);
      const { error } = await admin.from('appi_configuracion').upsert({ config_key: 'whatsapp_soporte', config_value: { numero }, updated_at: new Date().toISOString() });
      if (error) throw error; return json({ whatsapp: numero });
    }
    if (action === 'create') return json({ user: await createDistributor(body?.dip, body?.nombre, body?.password, body?.membership_months) }, 201);
    if (action === 'approve_request') {
      const requestId = String(body?.request_id || '');
      const { data: pending, error: pendingError } = await admin.from('appi_solicitudes').select('*').eq('id', requestId).eq('estado', 'pendiente').maybeSingle();
      if (pendingError || !pending) return json({ error: 'La solicitud ya no está pendiente.' }, 404);
      const user = await createDistributor(pending.dip, pending.nombre, body?.password, body?.membership_months);
      const { error } = await admin.from('appi_solicitudes').update({ estado: 'aprobada', reviewed_at: new Date().toISOString(), reviewed_by: authData.user.id }).eq('id', requestId);
      if (error) throw error; return json({ user, request: { id: pending.id, telefono: pending.telefono, nombre: pending.nombre } });
    }
    if (action === 'reject_request') {
      const { error } = await admin.from('appi_solicitudes').update({ estado: 'rechazada', reviewed_at: new Date().toISOString(), reviewed_by: authData.user.id }).eq('id', String(body?.request_id || '')).eq('estado', 'pendiente');
      if (error) throw error; return json({ ok: true });
    }

    const targetId = String(body?.user_id || '');
    if (!/^[0-9a-f-]{36}$/i.test(targetId)) return json({ error: 'Usuario inválido.' }, 400);
    if (targetId === authData.user.id && ['set_active','delete_user'].includes(action)) return json({ error: 'No podés modificar o eliminar tu propia cuenta administradora.' }, 400);
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
      await admin.auth.admin.updateUserById(targetId, { ban_duration: 'none' }).catch(() => null);
      return json({ user: data });
    }
    if (action === 'delete_user') {
      const { error } = await admin.auth.admin.deleteUser(targetId); if (error) throw error;
      return json({ ok: true });
    }
    if (action === 'set_active') {
      const activo = body?.activo === true;
      const { data, error } = await admin.from('appi_perfiles').update({ activo }).eq('user_id', targetId).select('user_id,username,dip,sucursal,numero_distribuidor,nombre,rol,activo').single(); if (error) throw error;
      const { error: authUpdateError } = await admin.auth.admin.updateUserById(targetId, { ban_duration: activo ? 'none' : '876000h' }); if (authUpdateError) throw authUpdateError;
      return json({ user: data });
    }
    return json({ error: 'Acción desconocida.' }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Error inesperado.' }, 500);
  }
});
