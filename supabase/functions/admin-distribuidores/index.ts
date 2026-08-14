import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' };

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
}
function parseDip(value: unknown) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 14);
  if (digits.length < 3) return null;
  return {
    canonical: `${digits.slice(0, 2)}-${digits.slice(2)}`,
    sucursal: digits.slice(0, 2),
    numero: digits.slice(2),
  };
}
function emailForDip(dip: string) {
  const domain = Deno.env.get('DISTRIBUTOR_EMAIL_DOMAIN') || 'distribuidores.appi.invalid';
  return `dip-${dip}@${domain}`;
}
function validPassword(password: unknown) {
  const text = String(password || '');
  return text.length >= 8 && /[A-Za-z]/.test(text) && /\d/.test(text);
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRole) return json({ error: 'Falta configuración del servidor.' }, 503);

  const authorization = request.headers.get('Authorization') || '';
  const jwt = authorization.replace(/^Bearer\s+/i, '');
  if (!jwt) return json({ error: 'Sesión requerida.' }, 401);

  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: authData, error: authError } = await admin.auth.getUser(jwt);
  if (authError || !authData.user) return json({ error: 'Sesión inválida.' }, 401);

  const { data: profile, error: profileError } = await admin
    .from('appi_perfiles')
    .select('user_id,username,dip,sucursal,numero_distribuidor,nombre,rol,activo')
    .eq('user_id', authData.user.id)
    .maybeSingle();
  if (profileError || !profile || profile.rol !== 'admin' || profile.activo !== true) {
    return json({ error: 'Se requiere una cuenta administradora.' }, 403);
  }

  try {
    const body = await request.json();
    const action = String(body?.action || '');

    if (action === 'list') {
      const { data, error } = await admin
        .from('appi_perfiles')
        .select('user_id,username,dip,sucursal,numero_distribuidor,nombre,rol,activo,created_at,updated_at')
        .order('dip', { ascending: true });
      if (error) throw error;
      return json({ users: data || [] });
    }

    if (action === 'create') {
      const parsedDip = parseDip(body?.dip);
      const nombre = String(body?.nombre || '').trim().slice(0, 120);
      const password = String(body?.password || '');
      const role = 'usuario';
      if (!parsedDip) return json({ error: 'Ingresá una sucursal de 2 dígitos y el número de distribuidor.' }, 400);
      const dip = parsedDip.canonical;
      if (!validPassword(password)) return json({ error: 'La contraseña necesita 8 caracteres, letras y números.' }, 400);

      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: emailForDip(dip),
        password,
        email_confirm: true,
        user_metadata: { dip, nombre },
      });
      if (createError || !created.user) return json({ error: createError?.message || 'No se pudo crear la cuenta.' }, 400);

      const { error: insertError } = await admin.from('appi_perfiles').insert({
        user_id: created.user.id,
        dip,
        sucursal: parsedDip.sucursal,
        numero_distribuidor: parsedDip.numero,
        nombre,
        rol: role,
        activo: true,
      });
      if (insertError) {
        await admin.auth.admin.deleteUser(created.user.id).catch(() => null);
        return json({ error: insertError.message }, 400);
      }
      return json({ user: { user_id: created.user.id, dip, sucursal: parsedDip.sucursal, numero_distribuidor: parsedDip.numero, nombre, rol: role, activo: true } }, 201);
    }

    const targetId = String(body?.user_id || '');
    if (!/^[0-9a-f-]{36}$/i.test(targetId)) return json({ error: 'Usuario inválido.' }, 400);
    if (targetId === authData.user.id && ['set_active', 'delete'].includes(action)) {
      return json({ error: 'No podés desactivar o eliminar tu propia cuenta administradora.' }, 400);
    }

    if (action === 'set_password') {
      const password = String(body?.password || '');
      if (!validPassword(password)) return json({ error: 'La contraseña necesita 8 caracteres, letras y números.' }, 400);
      const { error } = await admin.auth.admin.updateUserById(targetId, { password });
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === 'set_active') {
      const activo = body?.activo === true;
      const { data, error } = await admin
        .from('appi_perfiles')
        .update({ activo })
        .eq('user_id', targetId)
        .select('user_id,username,dip,sucursal,numero_distribuidor,nombre,rol,activo')
        .single();
      if (error) throw error;
      const { error: authUpdateError } = await admin.auth.admin.updateUserById(targetId, {
        ban_duration: activo ? 'none' : '876000h',
      });
      if (authUpdateError) throw authUpdateError;
      return json({ user: data });
    }

    if (action === 'set_name') {
      const nombre = String(body?.nombre || '').trim().slice(0, 120);
      const { data, error } = await admin
        .from('appi_perfiles')
        .update({ nombre })
        .eq('user_id', targetId)
        .select('user_id,username,dip,sucursal,numero_distribuidor,nombre,rol,activo')
        .single();
      if (error) throw error;
      return json({ user: data });
    }

    return json({ error: 'Acción desconocida.' }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Error inesperado.' }, 500);
  }
});
