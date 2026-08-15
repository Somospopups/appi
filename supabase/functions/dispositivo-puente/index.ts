import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
// @ts-ignore: paquete npm compatible con el runtime de Supabase.
import webpush from 'npm:web-push@3.6.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' };
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: jsonHeaders });

function cleanText(value: unknown, max = 120) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, max);
}
function cleanPhone(value: unknown) {
  return String(value ?? '').replace(/\D/g, '').slice(0, 15);
}
function validUuid(value: unknown) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}
function platform(value: unknown) {
  const raw = String(value || '').toLowerCase();
  return raw === 'android' || raw === 'ios' ? raw : 'otro';
}
function safeDevice(row: any) {
  return {
    id: row.id,
    device_key: row.device_key,
    nombre: row.nombre,
    plataforma: row.plataforma,
    notificaciones: row.notificaciones === true,
    activo: row.activo === true,
    last_seen: row.last_seen,
    created_at: row.created_at,
  };
}
function pushParts(value: any) {
  const endpoint = cleanText(value?.endpoint, 3000);
  const p256dh = cleanText(value?.keys?.p256dh, 1000);
  const auth = cleanText(value?.keys?.auth, 500);
  if (!endpoint || !p256dh || !auth) return null;
  return { endpoint, p256dh, auth };
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRole) return json({ error: 'Servicio no configurado.' }, 503);
  const jwt = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!jwt) return json({ error: 'Iniciá sesión para continuar.' }, 401);

  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const { data: authData, error: authError } = await admin.auth.getUser(jwt);
    if (authError || !authData.user) return json({ error: 'La sesión no es válida.' }, 401);
    const userId = authData.user.id;
    const { data: profile, error: profileError } = await admin
      .from('appi_perfiles')
      .select('user_id,nombre,rol,activo,membresia_vence')
      .eq('user_id', userId)
      .maybeSingle();
    const expires = profile?.membresia_vence ? new Date(profile.membresia_vence).getTime() : 0;
    if (profileError || !profile || profile.rol !== 'usuario' || profile.activo !== true || expires <= Date.now()) {
      return json({ error: 'Necesitás una cuenta distribuidora activa.' }, 403);
    }

    const body = await request.json();
    const action = String(body?.action || '');

    if (action === 'config') {
      const publicKey = Deno.env.get('VAPID_PUBLIC_KEY') || '';
      return json({
        public_key: publicKey,
        push_ready: Boolean(publicKey && Deno.env.get('VAPID_PRIVATE_KEY')),
        pairing_minutes: 5,
        command_seconds: 120,
      });
    }

    if (action === 'create_pairing') {
      const sourceDeviceKey = validUuid(body?.source_device_key) ? String(body.source_device_key) : null;
      await admin.from('appi_vinculaciones_dispositivo')
        .update({ cancelled_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('claimed_at', null)
        .is('cancelled_at', null)
        .lte('expires_at', new Date().toISOString());

      let created: any = null;
      for (let attempt = 0; attempt < 8 && !created; attempt++) {
        const codigo = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, '0');
        const token = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 5 * 60_000).toISOString();
        const { data, error } = await admin.from('appi_vinculaciones_dispositivo').insert({
          user_id: userId,
          token,
          codigo,
          source_device_key: sourceDeviceKey,
          expires_at: expiresAt,
        }).select('id,token,codigo,expires_at').single();
        if (!error) created = data;
        else if (error.code !== '23505') throw error;
      }
      if (!created) return json({ error: 'No pudimos generar el código. Intentá nuevamente.' }, 503);
      return json({ pairing: created }, 201);
    }

    if (action === 'claim_pairing') {
      const tokenValue = String(body?.token || '');
      const codeValue = String(body?.codigo || '').replace(/\D/g, '').slice(0, 6);
      const deviceKey = String(body?.device_key || '');
      if (!validUuid(deviceKey) || (!validUuid(tokenValue) && !/^\d{6}$/.test(codeValue))) {
        return json({ error: 'El código de vinculación no es válido.' }, 400);
      }
      let query = admin.from('appi_vinculaciones_dispositivo').select('*').eq('user_id', userId);
      query = validUuid(tokenValue) ? query.eq('token', tokenValue) : query.eq('codigo', codeValue);
      const { data: pairing, error: pairError } = await query.is('claimed_at', null).is('cancelled_at', null).maybeSingle();
      if (pairError || !pairing) return json({ error: 'El código no existe o ya fue utilizado.' }, 404);
      if (new Date(pairing.expires_at).getTime() <= Date.now()) return json({ error: 'El código venció. Generá uno nuevo desde la PC.' }, 410);

      const push = pushParts(body?.subscription);
      const row = {
        user_id: userId,
        device_key: deviceKey,
        nombre: cleanText(body?.nombre, 80) || 'Mi teléfono',
        plataforma: platform(body?.plataforma),
        user_agent: cleanText(body?.user_agent, 500),
        push_endpoint: push?.endpoint || null,
        push_p256dh: push?.p256dh || null,
        push_auth: push?.auth || null,
        notificaciones: Boolean(push),
        activo: true,
        last_seen: new Date().toISOString(),
      };
      const { data: device, error: deviceError } = await admin.from('appi_dispositivos_vinculados')
        .upsert(row, { onConflict: 'user_id,device_key' })
        .select('*').single();
      if (deviceError) throw deviceError;
      await admin.from('appi_vinculaciones_dispositivo').update({
        claimed_at: new Date().toISOString(),
        claimed_device_id: device.id,
      }).eq('id', pairing.id);
      return json({ device: safeDevice(device), notifications_enabled: Boolean(push) });
    }

    if (action === 'pair_status') {
      const tokenValue = String(body?.token || '');
      if (!validUuid(tokenValue)) return json({ error: 'Vinculación inválida.' }, 400);
      const { data: pairing } = await admin.from('appi_vinculaciones_dispositivo')
        .select('id,expires_at,claimed_at,cancelled_at,claimed_device_id')
        .eq('token', tokenValue).eq('user_id', userId).maybeSingle();
      if (!pairing) return json({ error: 'Vinculación no encontrada.' }, 404);
      let device = null;
      if (pairing.claimed_device_id) {
        const { data } = await admin.from('appi_dispositivos_vinculados').select('*').eq('id', pairing.claimed_device_id).maybeSingle();
        if (data) device = safeDevice(data);
      }
      return json({
        claimed: Boolean(pairing.claimed_at && device),
        expired: new Date(pairing.expires_at).getTime() <= Date.now(),
        cancelled: Boolean(pairing.cancelled_at),
        device,
      });
    }

    if (action === 'list_devices') {
      const { data, error } = await admin.from('appi_dispositivos_vinculados')
        .select('*').eq('user_id', userId).eq('activo', true).order('last_seen', { ascending: false });
      if (error) throw error;
      return json({ devices: (data || []).map(safeDevice) });
    }

    if (action === 'register_push') {
      const deviceKey = String(body?.device_key || '');
      const push = pushParts(body?.subscription);
      if (!validUuid(deviceKey) || !push) return json({ error: 'La suscripción no es válida.' }, 400);
      const { data, error } = await admin.from('appi_dispositivos_vinculados').update({
        push_endpoint: push.endpoint,
        push_p256dh: push.p256dh,
        push_auth: push.auth,
        notificaciones: true,
        activo: true,
        last_seen: new Date().toISOString(),
      }).eq('user_id', userId).eq('device_key', deviceKey).select('*').maybeSingle();
      if (error || !data) return json({ error: 'Este teléfono todavía no está vinculado.' }, 404);
      return json({ device: safeDevice(data) });
    }

    if (action === 'remove_device') {
      const deviceId = String(body?.device_id || '');
      if (!validUuid(deviceId)) return json({ error: 'Dispositivo inválido.' }, 400);
      const { data: removed, error } = await admin.from('appi_dispositivos_vinculados').update({
        activo: false,
        notificaciones: false,
        push_endpoint: null,
        push_p256dh: null,
        push_auth: null,
      }).eq('id', deviceId).eq('user_id', userId).select('id').maybeSingle();
      if (error) throw error;
      if (!removed) return json({ error: 'El dispositivo ya no está vinculado a esta cuenta.' }, 404);
      await admin.from('appi_comandos_dispositivo')
        .update({ estado: 'cancelado' })
        .eq('target_device_id', deviceId)
        .eq('user_id', userId)
        .in('estado', ['pendiente', 'notificado', 'abierto']);
      return json({ ok: true, device_id: removed.id });
    }

    if (action === 'send_call') {
      const deviceId = String(body?.device_id || '');
      const sourceDeviceKey = validUuid(body?.source_device_key) ? String(body.source_device_key) : null;
      const contactId = validUuid(body?.contact_id) ? String(body.contact_id) : null;
      const telefono = cleanPhone(body?.telefono);
      const nombre = cleanText(body?.nombre, 120) || 'Contacto';
      if (!validUuid(deviceId) || telefono.length < 8) return json({ error: 'Elegí un teléfono vinculado y un número válido.' }, 400);
      const { data: device } = await admin.from('appi_dispositivos_vinculados').select('*')
        .eq('id', deviceId).eq('user_id', userId).eq('activo', true).maybeSingle();
      if (!device) return json({ error: 'El teléfono vinculado ya no está disponible.' }, 404);
      if (!device.notificaciones || !device.push_endpoint || !device.push_p256dh || !device.push_auth) {
        return json({ error: 'Ese teléfono no tiene notificaciones activadas. Volvé a vincularlo desde Mi cuenta.' }, 409);
      }
      if (contactId) {
        const { data: contact } = await admin.from('appi_gestion_contactos').select('id').eq('id', contactId).eq('user_id', userId).maybeSingle();
        if (!contact) return json({ error: 'El contacto no pertenece a esta cuenta.' }, 403);
      }
      const expiresAt = new Date(Date.now() + 2 * 60_000).toISOString();
      const { data: command, error: commandError } = await admin.from('appi_comandos_dispositivo').insert({
        user_id: userId,
        target_device_id: device.id,
        source_device_key: sourceDeviceKey,
        tipo: 'llamada',
        payload: { nombre, telefono, contact_id: contactId },
        expires_at: expiresAt,
      }).select('id,expires_at').single();
      if (commandError) throw commandError;

      const publicKey = Deno.env.get('VAPID_PUBLIC_KEY') || '';
      const privateKey = Deno.env.get('VAPID_PRIVATE_KEY') || '';
      const subject = Deno.env.get('VAPID_SUBJECT') || 'https://somospopups.github.io/appi/';
      if (!publicKey || !privateKey) return json({ error: 'Las notificaciones todavía no están configuradas.' }, 503);
      webpush.setVapidDetails(subject, publicKey, privateKey);
      const notificationPayload = JSON.stringify({
        type: 'call_request',
        command_id: command.id,
        title: 'Llamada desde APPI',
        body: `Llamar a ${nombre} · ${telefono}`,
        url: `./?bridge_call=${command.id}`,
        expires_at: expiresAt,
      });
      try {
        await webpush.sendNotification({
          endpoint: device.push_endpoint,
          keys: { p256dh: device.push_p256dh, auth: device.push_auth }
        }, notificationPayload, { TTL: 120, urgency: 'high' });
        await admin.from('appi_comandos_dispositivo').update({ estado: 'notificado', notified_at: new Date().toISOString() }).eq('id', command.id);
        return json({ ok: true, command_id: command.id, device: safeDevice(device), expires_at: expiresAt });
      } catch (pushError: any) {
        const status = Number(pushError?.statusCode || 0);
        if (status === 404 || status === 410) {
          await admin.from('appi_dispositivos_vinculados').update({ notificaciones: false, push_endpoint: null, push_p256dh: null, push_auth: null }).eq('id', device.id);
        }
        await admin.from('appi_comandos_dispositivo').update({ estado: 'error' }).eq('id', command.id);
        return json({ error: 'No pudimos notificar al teléfono. Abrí APPI en el teléfono y reactivá las notificaciones.' }, 502);
      }
    }

    if (action === 'get_command') {
      const commandId = String(body?.command_id || '');
      if (!validUuid(commandId)) return json({ error: 'Solicitud inválida.' }, 400);
      const { data: command } = await admin.from('appi_comandos_dispositivo').select('id,tipo,payload,estado,expires_at,created_at')
        .eq('id', commandId).eq('user_id', userId).maybeSingle();
      if (!command) return json({ error: 'La solicitud no existe.' }, 404);
      if (new Date(command.expires_at).getTime() <= Date.now() && !['aceptado','cancelado'].includes(command.estado)) {
        await admin.from('appi_comandos_dispositivo').update({ estado: 'vencido' }).eq('id', command.id);
        return json({ error: 'La solicitud de llamada venció.' }, 410);
      }
      if (command.estado === 'aceptado') return json({ error: 'Esta llamada ya fue aceptada.' }, 409);
      if (command.estado === 'cancelado') return json({ error: 'Esta llamada fue cancelada.' }, 409);
      await admin.from('appi_comandos_dispositivo').update({ estado: 'abierto', opened_at: new Date().toISOString() }).eq('id', command.id);
      return json({ command: { ...command, estado: 'abierto' } });
    }

    if (action === 'accept_call') {
      const commandId = String(body?.command_id || '');
      if (!validUuid(commandId)) return json({ error: 'Solicitud inválida.' }, 400);
      const { data: command } = await admin.from('appi_comandos_dispositivo').select('*')
        .eq('id', commandId).eq('user_id', userId).maybeSingle();
      if (!command || command.tipo !== 'llamada') return json({ error: 'La llamada no existe.' }, 404);
      if (new Date(command.expires_at).getTime() <= Date.now()) return json({ error: 'La solicitud de llamada venció.' }, 410);
      await admin.from('appi_comandos_dispositivo').update({ estado: 'aceptado', accepted_at: new Date().toISOString() }).eq('id', command.id);
      const contactId = String(command.payload?.contact_id || '');
      if (validUuid(contactId)) {
        const { data: contact } = await admin.from('appi_gestion_contactos').select('id').eq('id', contactId).eq('user_id', userId).maybeSingle();
        if (contact) await admin.from('appi_gestion_actividades').insert({
          user_id: userId,
          contacto_id: contactId,
          tipo: 'llamada_iniciada',
          detalle: 'La llamada fue aceptada desde un teléfono vinculado.',
          metadata: { command_id: command.id, origen: 'puente_dispositivos' },
        });
      }
      return json({ ok: true, telefono: cleanPhone(command.payload?.telefono), nombre: cleanText(command.payload?.nombre, 120), contact_id: validUuid(contactId) ? contactId : null });
    }

    if (action === 'cancel_command') {
      const commandId = String(body?.command_id || '');
      if (!validUuid(commandId)) return json({ error: 'Solicitud inválida.' }, 400);
      await admin.from('appi_comandos_dispositivo').update({ estado: 'cancelado' }).eq('id', commandId).eq('user_id', userId);
      return json({ ok: true });
    }

    if (action === 'ping') {
      const deviceKey = String(body?.device_key || '');
      if (validUuid(deviceKey)) await admin.from('appi_dispositivos_vinculados').update({ last_seen: new Date().toISOString() }).eq('user_id', userId).eq('device_key', deviceKey);
      return json({ ok: true });
    }

    return json({ error: 'Acción desconocida.' }, 400);
  } catch (error) {
    console.error('dispositivo-puente', error);
    return json({ error: error instanceof Error ? error.message : 'Error inesperado.' }, 500);
  }
});
