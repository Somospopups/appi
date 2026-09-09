// APPI · Telegram
// Vincula el chat de cada titular/socio y recibe /start CODIGO.
// El token del bot sale de TELEGRAM_BOT_TOKEN (secreto), nunca del navegador.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-telegram-bot-api-secret-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' };
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: jsonHeaders });

const BOT = 'APPI_Avisos_bot';
const TIMEZONE = 'America/Argentina/Buenos_Aires';

function cleanPerson(value: unknown) {
  return String(value || '') === 'socio' ? 'socio' : 'titular';
}
function firstName(value: unknown) {
  return String(value ?? '').trim().split(/\s+/)[0] || '';
}
function codigoNuevo() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  for (let i = 0; i < 8; i++) out += chars[bytes[i] % chars.length];
  return out;
}
async function webhookSecret(token: string) {
  const data = new TextEncoder().encode(token + ':appi-telegram');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}
async function tg(token: string, method: string, body: Record<string, unknown>) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && data?.ok === true, data };
}

function adminClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceRole) return null;
  return createClient(url, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function userFromJwt(admin: any, jwt: string) {
  const { data, error } = await admin.auth.getUser(jwt);
  if (error || !data.user) return null;
  const { data: profile } = await admin
    .from('appi_perfiles')
    .select('user_id,nombre,socio_nombre,rol,activo,membresia_vence')
    .eq('user_id', data.user.id)
    .maybeSingle();
  const expires = profile?.membresia_vence ? new Date(profile.membresia_vence).getTime() : 0;
  if (!profile || profile.rol !== 'usuario' || profile.activo !== true || expires <= Date.now()) return null;
  return { userId: data.user.id, profile };
}

async function handleWebhook(admin: any, token: string, update: any) {
  const msg = update?.message || update?.edited_message;
  if (!msg?.chat?.id) return json({ ok: true });
  const chatId = Number(msg.chat.id);
  const text = String(msg.text || '').trim();
  const username = String(msg.from?.username || '').slice(0, 64);
  const nombreTg = [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(' ').slice(0, 120);

  if (/^\/desvincular/i.test(text)) {
    await admin.from('appi_telegram_vinculos').delete().eq('chat_id', chatId);
    await tg(token, 'sendMessage', { chat_id: chatId, text: 'Listo. Este chat ya no recibe avisos de APPI.\nPara volver a vincular, abrí APPI → engranaje → Telegram.' });
    return json({ ok: true });
  }

  const start = text.match(/^\/start(?:\s+([A-Z0-9]{6,16}))?$/i);
  if (!start) {
    await tg(token, 'sendMessage', {
      chat_id: chatId,
      text: 'Soy APPI Avisos.\nPara vincularte, abrí APPI en el teléfono o la computadora, engranaje → Telegram, y tocá Vincular.\nSi ya estabas vinculado, /desvincular corta los avisos.',
    });
    return json({ ok: true });
  }

  const codigo = String(start[1] || '').toUpperCase();
  if (!codigo) {
    await tg(token, 'sendMessage', {
      chat_id: chatId,
      text: 'Falta el código de APPI.\nEngranaje → Telegram → Vincular, y abrí el enlace que te da la app.',
    });
    return json({ ok: true });
  }

  await admin.from('appi_telegram_codigos').delete().lt('expires_at', new Date().toISOString());
  const { data: row } = await admin.from('appi_telegram_codigos').select('user_id,persona_tipo,expires_at').eq('codigo', codigo).maybeSingle();
  if (!row || new Date(row.expires_at).getTime() < Date.now()) {
    await tg(token, 'sendMessage', { chat_id: chatId, text: 'Ese código no vale o ya venció. Pedí uno nuevo en APPI.' });
    return json({ ok: true });
  }

  await admin.from('appi_telegram_vinculos').delete().eq('chat_id', chatId);
  await admin.from('appi_telegram_vinculos').delete().eq('user_id', row.user_id).eq('persona_tipo', row.persona_tipo);
  const { error } = await admin.from('appi_telegram_vinculos').insert({
    user_id: row.user_id,
    persona_tipo: row.persona_tipo,
    chat_id: chatId,
    telegram_username: username || null,
    telegram_nombre: nombreTg || null,
  });
  await admin.from('appi_telegram_codigos').delete().eq('codigo', codigo);
  if (error) {
    await tg(token, 'sendMessage', { chat_id: chatId, text: 'No pude vincular. Probá de nuevo desde APPI.' });
    return json({ ok: true });
  }

  const { data: perfil } = await admin.from('appi_perfiles').select('nombre,socio_nombre').eq('user_id', row.user_id).maybeSingle();
  const quien = row.persona_tipo === 'socio'
    ? firstName(perfil?.socio_nombre) || 'Socio'
    : firstName(perfil?.nombre) || 'Distribuidor';
  await tg(token, 'sendMessage', {
    chat_id: chatId,
    text: `Listo, ${quien}. Este chat quedó vinculado a APPI.\nAcá te van a llegar los avisos de Mi Gestión.\nSi no los querés más: /desvincular`,
  });
  return json({ ok: true });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);

  const token = Deno.env.get('TELEGRAM_BOT_TOKEN') || '';
  const admin = adminClient();
  if (!admin || !token) return json({ error: 'Telegram todavía no está configurado.' }, 503);

  const secret = await webhookSecret(token);
  const headerSecret = request.headers.get('X-Telegram-Bot-Api-Secret-Token') || '';
  const jwt = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');

  let body: any = {};
  try { body = await request.json(); } catch { body = {}; }

  // Telegram pega acá sin JWT, con el secreto del webhook.
  if (!jwt && (body.update_id || body.message || headerSecret)) {
    if (headerSecret && headerSecret !== secret) return json({ error: 'Webhook inválido.' }, 401);
    try { return await handleWebhook(admin, token, body); }
    catch (error) {
      console.error('telegram webhook', error);
      return json({ ok: true });
    }
  }

  if (!jwt) return json({ error: 'Iniciá sesión para continuar.' }, 401);
  const session = await userFromJwt(admin, jwt);
  if (!session) return json({ error: 'Necesitás una cuenta distribuidora activa.' }, 403);

  const action = String(body?.action || '');
  const persona = cleanPerson(body?.persona_tipo);
  if (persona === 'socio' && !String(session.profile.socio_nombre || '').trim()) {
    return json({ error: 'Esta cuenta no tiene socio/a.' }, 400);
  }

  try {
    if (action === 'estado') {
      const { data } = await admin.from('appi_telegram_vinculos')
        .select('telegram_username,telegram_nombre,created_at')
        .eq('user_id', session.userId)
        .eq('persona_tipo', persona)
        .maybeSingle();
      return json({
        bot: BOT,
        vinculado: !!data,
        username: data?.telegram_username || '',
        nombre: data?.telegram_nombre || '',
      });
    }

    if (action === 'vincular') {
      await admin.from('appi_telegram_codigos').delete().eq('user_id', session.userId).eq('persona_tipo', persona);
      const codigo = codigoNuevo();
      const { error } = await admin.from('appi_telegram_codigos').insert({
        codigo,
        user_id: session.userId,
        persona_tipo: persona,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });
      if (error) throw error;
      return json({
        ok: true,
        codigo,
        bot: BOT,
        url: `https://t.me/${BOT}?start=${codigo}`,
        minutos: 10,
      });
    }

    if (action === 'desvincular') {
      await admin.from('appi_telegram_vinculos').delete().eq('user_id', session.userId).eq('persona_tipo', persona);
      return json({ ok: true, vinculado: false });
    }

    if (action === 'probar') {
      const { data } = await admin.from('appi_telegram_vinculos')
        .select('chat_id')
        .eq('user_id', session.userId)
        .eq('persona_tipo', persona)
        .maybeSingle();
      if (!data?.chat_id) return json({ error: 'Todavía no está vinculado Telegram.' }, 400);
      const hora = new Intl.DateTimeFormat('es-AR', { timeZone: TIMEZONE, hour: '2-digit', minute: '2-digit' }).format(new Date());
      const quien = persona === 'socio' ? firstName(session.profile.socio_nombre) : firstName(session.profile.nombre);
      const sent = await tg(token, 'sendMessage', {
        chat_id: data.chat_id,
        text: `${quien ? `Hola ${quien}. ` : ''}APPI te escribe. Son las ${hora} (Argentina).\nSi leíste esto, Telegram está andando.`,
      });
      if (!sent.ok) return json({ error: 'Telegram no pudo entregar el aviso.' }, 502);
      return json({ ok: true });
    }

    return json({ error: 'Acción desconocida.' }, 400);
  } catch (error) {
    console.error('telegram-avisos', error);
    return json({ error: error instanceof Error ? error.message : 'Error inesperado.' }, 500);
  }
});
