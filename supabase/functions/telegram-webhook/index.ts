// APPI · v544 · Webhook del bot de Telegram
// Pública (--no-verify-jwt): solo Telegram la llama, y la firma con el
// secret_token del setWebhook. Cuando un distribuidor toca "Iniciar" con el
// código de vínculo (t.me/<bot>?start=CODIGO) une su chat_id a su cuenta.
// También atiende /pausa, /reanudar y /ayuda desde el propio chat.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const jsonHeaders = { 'Content-Type': 'application/json; charset=utf-8' };
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: jsonHeaders });

const TELEGRAM_API = 'https://api.telegram.org';

async function botFetch(token: string, metodo: string, cuerpo: Record<string, unknown>) {
  const res = await fetch(`${TELEGRAM_API}/bot${token}/${metodo}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });
  return res.json().catch(() => ({}));
}

function firstName(value: unknown) {
  return String(value ?? '').trim().split(/\s+/)[0] || '';
}

function localDate() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());
}

function plural(count: number, singular: string, pluralWord: string) {
  return `${count} ${count === 1 ? singular : pluralWord}`;
}

// Mismo tono que el resumen de Web Push, en texto plano de Telegram.
function resumenTexto(row: any, nombre: string) {
  const parts: string[] = [];
  if (row.vencidos > 0) parts.push(plural(row.vencidos, 'seguimiento vencido', 'seguimientos vencidos'));
  if (row.hoy > 0) parts.push(plural(row.hoy, 'seguimiento para hoy', 'seguimientos para hoy'));
  if (row.presentaciones > 0) parts.push(plural(row.presentaciones, 'presentación', 'presentaciones'));
  if (row.nuevos > 0) parts.push(plural(row.nuevos, 'contacto nuevo', 'contactos nuevos'));
  const base = parts.length ? `Tenés ${parts.slice(0, -1).join(', ')}${parts.length > 1 ? ' y ' : ''}${parts[parts.length - 1]}.` : 'Tenés acciones pendientes.';
  return `Buen día, ${nombre} 👋\n\n${base}\n\n📱 Abrí APPI para ver el detalle.`;
}

Deno.serve(async request => {
  if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);

  const token = Deno.env.get('TELEGRAM_BOT_TOKEN') || '';
  const secreto = Deno.env.get('TELEGRAM_WEBHOOK_SECRET') || '';
  if (!token) return json({ error: 'El bot no está configurado.' }, 503);

  // Firma: el mismo secret_token que se pasó al setWebhook.
  const header = request.headers.get('x-telegram-bot-api-secret-token') || '';
  if (!secreto || header !== secreto) return json({ error: 'No autorizado.' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRole) return json({ error: 'Servicio no configurado.' }, 503);

  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const update = await request.json().catch(() => ({}));
    const message = update?.message;
    const chatId = String(message?.chat?.id ?? '');
    const texto = String(message?.text ?? '').trim();
    if (!chatId || !texto) return json({ ok: true }); // acuses de teclado, etc.

    const [comando, resto] = texto.split(/\s+/, 2);
    const arg = String(resto || '').trim();

    // ---------- /start <codigo>: vincular ----------
    if (comando === '/start' && arg) {
      const { data: fila } = await admin
        .from('appi_canales_aviso')
        .select('id,user_id,persona_tipo,codigo_vence')
        .eq('codigo', arg)
        .eq('canal', 'telegram')
        .maybeSingle();

      if (!fila || !fila.codigo_vence || new Date(fila.codigo_vence).getTime() <= Date.now()) {
        await botFetch(token, 'sendMessage', {
          chat_id: chatId,
          text: 'Ese código no es válido o ya venció. Volvé a tocar «Conectar Telegram» en APPI para generar uno nuevo.',
        });
        return json({ ok: true });
      }

      const { data: perfil } = await admin
        .from('appi_perfiles')
        .select('nombre,socio_nombre')
        .eq('user_id', fila.user_id)
        .maybeSingle();
      const nombre = fila.persona_tipo === 'socio'
        ? firstName(perfil?.socio_nombre || 'Socio')
        : firstName(perfil?.nombre || 'Distribuidor');

      const { error } = await admin
        .from('appi_canales_aviso')
        .update({
          destino: chatId,
          activo: true,
          codigo: null,
          codigo_vence: null,
          ultimo_error: null,
          actualizado_en: new Date().toISOString(),
        })
        .eq('id', fila.id);

      if (error) {
        const usado = String(error?.message || '').toLowerCase().includes('appi_canales_aviso_destino_uq');
        await botFetch(token, 'sendMessage', {
          chat_id: chatId,
          text: usado
            ? 'Este chat ya está vinculado a otra cuenta de APPI. Desvinculalo desde esa cuenta o escribinos si es un error.'
            : 'No se pudo completar el vínculo. Probá de nuevo en unos minutos.',
        });
        return json({ ok: true });
      }

      // Confirmación y, si hay pendientes hoy, el resumen de muestra.
      const { data: resumen } = await admin.rpc('appi_resumen_gestion', { p_user_id: fila.user_id, p_fecha: localDate() });
      const base = `¡Listo, ${nombre}! ✅\n\nDe ahora en más vas a recibir acá:\n• Tu resumen del día, a las 8:00\n• Avisos de presentaciones próximas\n\n`;
      const extra = resumen && resumen.total > 0 ? `\n\n${resumenTexto(resumen, nombre)}` : '';
      await botFetch(token, 'sendMessage', {
        chat_id: chatId,
        text: base + extra + `\n\nPodés pausar con /pausa y reanudar con /reanudar.`,
      });
      return json({ ok: true });
    }

    // ---------- /demo: muestra cómo llega el resumen de la mañana ----------
    if (comando === '/demo' || comando === '/prueba') {
      const { data: canal } = await admin
        .from('appi_canales_aviso')
        .select('id,user_id,persona_tipo,activo')
        .eq('destino', chatId)
        .eq('canal', 'telegram')
        .maybeSingle();
      if (!canal || !canal.activo) {
        await botFetch(token, 'sendMessage', {
          chat_id: chatId,
          text: 'Este chat todavía no está vinculado a una cuenta de APPI.\n\nPara vincularlo: abrí APPI → engranaje ⚙️ → «Avisos por Telegram» → Conectar. Después volvé y mandame /demo.',
        });
        return json({ ok: true });
      }
      const { data: perfil } = await admin
        .from('appi_perfiles')
        .select('nombre,socio_nombre')
        .eq('user_id', canal.user_id)
        .maybeSingle();
      const nombre = canal.persona_tipo === 'socio'
        ? firstName(perfil?.socio_nombre || 'Socio')
        : firstName(perfil?.nombre || 'Distribuidor');
      const { data: resumen } = await admin.rpc('appi_resumen_gestion', { p_user_id: canal.user_id, p_fecha: localDate() });
      const row = resumen || { nuevos: 0, hoy: 0, vencidos: 0, presentaciones: 0, encuestas_nuevas: 0, total: 0 };
      if (row.total > 0) {
        await botFetch(token, 'sendMessage', {
          chat_id: chatId,
          text: `📨 Así llega tu resumen cada mañana (8:00):\n\n${resumenTexto(row, nombre)}\n\n📱 Abrí APPI para ver el detalle.`,
        });
      } else {
        await botFetch(token, 'sendMessage', {
          chat_id: chatId,
          text: `📨 Así llega tu resumen cada mañana (8:00)\n\nBuen día, ${nombre} 👋\n\nTenés 2 seguimientos vencidos, 1 presentación para hoy y 3 contactos nuevos.\n\n📱 Abrí APPI para ver el detalle.\n\nHoy no tenés acciones pendientes en Mi Gestión 🙌 esto fue un ejemplo: cuando haya pendientes vas a ver tus números reales.`,
        });
      }
      return json({ ok: true });
    }

    // ---------- Comandos del chat ----------
    if (comando === '/start' || comando === '/ayuda' || comando === '/help') {
      await botFetch(token, 'sendMessage', {
        chat_id: chatId,
        text: 'Soy el bot de avisos de APPI 📲\n\n• Vinculación: tocá «Avisos por Telegram» en el engranaje ⚙️ de APPI.\n• /demo — ver cómo llega el resumen de la mañana\n• /pausa — dejar de recibir avisos\n• /reanudar — volver a recibirlos\n\nRecibís el resumen del día a las 8:00 y los avisos de presentaciones.',
      });
      return json({ ok: true });
    }

    if (comando === '/pausa' || comando === '/reanudar') {
      const activo = comando === '/reanudar';
      const { data, error } = await admin
        .from('appi_canales_aviso')
        .update({ activo, ultimo_error: null, actualizado_en: new Date().toISOString() })
        .eq('destino', chatId)
        .eq('canal', 'telegram')
        .select('user_id');
      if (error || !data || !data.length) {
        await botFetch(token, 'sendMessage', {
          chat_id: chatId,
          text: 'Este chat no está vinculado a ninguna cuenta de APPI todavía.',
        });
        return json({ ok: true });
      }
      await botFetch(token, 'sendMessage', {
        chat_id: chatId,
        text: activo ? '✅ Listo: volvés a recibir los avisos.' : '⏸ Listo: no vas a recibir avisos hasta que mandes /reanudar.',
      });
      return json({ ok: true });
    }

    // Cualquier otra cosa: ayuda breve (sin spam de errores).
    if (comando?.startsWith('/')) {
      await botFetch(token, 'sendMessage', {
        chat_id: chatId,
        text: 'No conozco ese comando. Usá /ayuda para ver qué puedo hacer.',
      });
      return json({ ok: true });
    }

    return json({ ok: true });
  } catch (error) {
    console.error('telegram-webhook', error);
    return json({ ok: true }); // Telegram reintenta solo si no respondemos 200
  }
});
