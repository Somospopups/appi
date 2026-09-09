// APPI · v544 · Canal de avisos por Telegram (gestión desde la app)
// La usa el navegador con el JWT de sesión: genera el código de vínculo,
// informa el estado y desvincula el chat. El webhook de Telegram (que es
// público) es quien termina la vinculación con el chat_id.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' };
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: jsonHeaders });

const CODIGO_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sin I, L, O, 0, 1
const CODIGO_MINUTOS = 15;

function codigoNuevo() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  let out = '';
  for (const b of bytes) out += CODIGO_CHARS[b % CODIGO_CHARS.length];
  return out;
}

function personaDe(cuerpo: any) {
  return String(cuerpo?.persona_tipo || 'titular') === 'socio' ? 'socio' : 'titular';
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
      .select('user_id,rol,activo,membresia_vence')
      .eq('user_id', userId)
      .maybeSingle();
    const expires = profile?.membresia_vence ? new Date(profile.membresia_vence).getTime() : 0;
    if (profileError || !profile || profile.rol !== 'usuario' || profile.activo !== true || expires <= Date.now()) {
      return json({ error: 'Tu cuenta no está activa.' }, 403);
    }

    const body = await request.json().catch(() => ({}));
    const accion = String(body?.accion || 'estado');
    const personaTipo = personaDe(body);

    const bot = Deno.env.get('TELEGRAM_BOT_USERNAME') || '';

    const leer = async () => {
      const { data } = await admin
        .from('appi_canales_aviso')
        .select('id,persona_tipo,canal,destino,activo,codigo,codigo_vence,creado_en')
        .eq('user_id', userId)
        .eq('canal', 'telegram')
        .eq('persona_tipo', personaTipo)
        .maybeSingle();
      return data || null;
    };

    if (accion === 'estado') {
      const row = await leer();
      if (!row) return json({ estado: 'desconectado', bot });
      const codigoVigente = row.codigo && row.codigo_vence && new Date(row.codigo_vence).getTime() > Date.now();
      if (row.activo && row.destino) {
        return json({
          estado: 'conectado',
          bot,
          persona_tipo: row.persona_tipo,
          chat: String(row.destino),
          link: bot ? 'https://t.me/' + bot : '',
        });
      }
      const codigo = codigoVigente ? row.codigo : null;
      return json({
        estado: 'pendiente',
        bot,
        codigo,
        url: bot && codigo ? ('https://t.me/' + bot + '?start=' + codigo) : (bot ? ('https://t.me/' + bot) : ''),
      });
    }

    if (accion === 'vincular') {
      const row = await leer();
      if (row && row.activo && row.destino) {
        return json({
          estado: 'conectado',
          bot,
          persona_tipo: row.persona_tipo,
          chat: String(row.destino),
          link: bot ? 'https://t.me/' + bot : '',
        });
      }
      if (!bot) return json({ error: 'El aviso por Telegram todavía no está habilitado. Probá más tarde.' }, 503);

      const codigo = codigoNuevo();
      const vence = new Date(Date.now() + CODIGO_MINUTOS * 60_000).toISOString();
      if (row) {
        const { error } = await admin
          .from('appi_canales_aviso')
          .update({ codigo, codigo_vence: vence, actualizado_en: new Date().toISOString() })
          .eq('id', row.id);
        if (error) return json({ error: 'No se pudo preparar el vínculo.' }, 500);
      } else {
        const { error } = await admin
          .from('appi_canales_aviso')
          .insert({ user_id: userId, persona_tipo: personaTipo, canal: 'telegram', codigo, codigo_vence: vence });
        if (error) return json({ error: 'No se pudo preparar el vínculo.' }, 500);
      }
      return json({ estado: 'pendiente', bot, codigo, url: 'https://t.me/' + bot + '?start=' + codigo, vence: CODIGO_MINUTOS });
    }

    if (accion === 'desvincular') {
      const row = await leer();
      if (row) {
        await admin
          .from('appi_canales_aviso')
          .update({ destino: null, activo: false, codigo: null, codigo_vence: null, actualizado_en: new Date().toISOString() })
          .eq('id', row.id);
      }
      return json({ estado: 'desconectado', bot });
    }

    return json({ error: 'Acción desconocida.' }, 400);
  } catch (error) {
    console.error('telegram-canal', error);
    return json({ error: 'Error inesperado.' }, 500);
  }
});
