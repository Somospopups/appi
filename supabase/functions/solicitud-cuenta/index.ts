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
  return { canonical: `${digits.slice(0, 2)}-${digits.slice(2)}`, sucursal: digits.slice(0, 2), numero: digits.slice(2) };
}
function cleanName(value: unknown) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, 120);
}
function cleanPhone(value: unknown) {
  return String(value || '').replace(/\D/g, '').slice(0, 15);
}
function whatsappUrl(numero: string, message: string) {
  return numero ? `https://wa.me/${numero}?text=${encodeURIComponent(message)}` : '';
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
  const url = Deno.env.get('SUPABASE_URL'), serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return json({ error: 'Servicio no configurado.' }, 503);
  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  try {
    const body = await request.json(), action = String(body?.action || 'config');
    const { data: setting } = await admin.from('appi_configuracion').select('config_value').eq('config_key', 'whatsapp_soporte').maybeSingle();
    const whatsapp = String(setting?.config_value?.numero || '').replace(/\D/g, '');

    if (action === 'config') return json({ whatsapp });
    if (action !== 'create') return json({ error: 'Acción desconocida.' }, 400);
    if (String(body?.website || '').trim()) return json({ ok: true, whatsapp_url: '' });

    const nombre = cleanName(body?.nombre), socioNombre = cleanName(body?.socio_nombre), dip = parseDip(body?.dip), telefono = cleanPhone(body?.telefono);
    if (nombre.length < 3) return json({ error: 'Ingresá el nombre y apellido del titular.' }, 400);
    if (socioNombre && socioNombre.length < 3) return json({ error: 'Ingresá el nombre y apellido del socio/a.' }, 400);
    if (!dip) return json({ error: 'Ingresá la sucursal y el número de distribuidor.' }, 400);
    if (telefono.length < 8) return json({ error: 'Ingresá un teléfono válido.' }, 400);

    const { data: existing } = await admin.from('appi_perfiles').select('user_id').eq('dip', dip.canonical).maybeSingle();
    if (existing) return json({ error: 'Ese distribuidor ya tiene una cuenta. Usá la solapa Ingresar.' }, 409);
    const { data: pending } = await admin.from('appi_solicitudes').select('id').eq('dip', dip.canonical).eq('estado', 'pendiente').maybeSingle();
    if (pending) return json({ error: 'Ya existe una solicitud pendiente para ese distribuidor.' }, 409);

    const { data: created, error } = await admin.from('appi_solicitudes').insert({
      nombre, socio_nombre: socioNombre || null, dip: dip.canonical, sucursal: dip.sucursal, numero_distribuidor: dip.numero, telefono, estado: 'pendiente'
    }).select('id,created_at').single();
    if (error) throw error;
    const message = `Hola POPUPS, quiero solicitar acceso a APPI.\n\nTitular: ${nombre}${socioNombre ? `\nSocio/a: ${socioNombre}` : ''}\nDistribuidor: ${dip.canonical}\nTeléfono: ${telefono}\n\nLa solicitud ya quedó registrada como pendiente en el panel administrador.`;
    return json({ ok: true, request_id: created.id, whatsapp_url: whatsappUrl(whatsapp, message) }, 201);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Error inesperado.' }, 500);
  }
});
