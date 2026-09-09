// APPI · v544 · Recordatorios de Mi Gestión
// Envía el resumen diario (8:00 ART) y los avisos de presentación por Web Push
// y por Telegram (canal alternativo: llega aunque la PWA no esté instalada).
// La invoca pg_cron con la clave de servicio; no la usa el navegador.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
// @ts-ignore: paquete npm compatible con el runtime de Supabase.
import webpush from 'npm:web-push@3.6.7';

const jsonHeaders = { 'Content-Type': 'application/json; charset=utf-8' };
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: jsonHeaders });

const TIMEZONE = 'America/Argentina/Buenos_Aires';
const AVISO_MINUTOS = 30;

function localDate() {
  // La fecha "de hoy" siempre se evalúa en horario argentino.
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(new Date());
}

function firstName(value: unknown) {
  return String(value ?? '').trim().split(/\s+/)[0] || '';
}

function shortTime(value: unknown) {
  const raw = String(value ?? '');
  return /^\d{2}:\d{2}/.test(raw) ? raw.slice(0, 5) : '';
}

function joinParts(parts: string[]) {
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} y ${parts[parts.length - 1]}`;
}

function plural(count: number, singular: string, pluralWord: string) {
  return `${count} ${count === 1 ? singular : pluralWord}`;
}

function summaryBody(row: any) {
  const parts: string[] = [];
  if (row.vencidos > 0) parts.push(plural(row.vencidos, 'seguimiento vencido', 'seguimientos vencidos'));
  if (row.hoy > 0) parts.push(plural(row.hoy, 'seguimiento para hoy', 'seguimientos para hoy'));
  if (row.presentaciones > 0) parts.push(plural(row.presentaciones, 'presentación', 'presentaciones'));
  if (row.nuevos > 0) parts.push(plural(row.nuevos, 'contacto nuevo', 'contactos nuevos'));
  const base = parts.length ? `Tenés ${joinParts(parts)}.` : 'Tenés acciones pendientes.';
  const surveys = row.encuestas_nuevas > 0
    ? ` Además llegaron ${plural(row.encuestas_nuevas, 'encuesta nueva', 'encuestas nuevas')}.`
    : '';
  return `${base}${surveys}`;
}

function clavePersona(row: any) {
  return `${row.user_id}|${row.persona_tipo}`;
}

// ---------- Web Push ----------

// Un endpoint muerto se limpia para no reintentar indefinidamente.
async function sendPush(admin: any, target: any, payload: Record<string, unknown>, ttl: number) {
  try {
    await webpush.sendNotification(
      { endpoint: target.push_endpoint, keys: { p256dh: target.push_p256dh, auth: target.push_auth } },
      JSON.stringify(payload),
      { TTL: ttl, urgency: 'normal' }
    );
    return { ok: true as const };
  } catch (error: any) {
    const status = Number(error?.statusCode || 0);
    if (status === 404 || status === 410) {
      await admin.from('appi_dispositivos_vinculados')
        .update({ notificaciones: false, push_endpoint: null, push_p256dh: null, push_auth: null })
        .eq('id', target.device_id);
    }
    return { ok: false as const, status };
  }
}

// ---------- Telegram ----------

async function telegramSend(admin: any, chatId: string, token: string, text: string) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
    const body = await res.json().catch(() => ({}));
    if (body?.ok) return { ok: true as const };
    const code = Number(body?.error_code || 0);
    if (code === 403) {
      // El usuario bloqueó el bot: desactivar el canal para no reintentar.
      await admin.from('appi_canales_aviso')
        .update({ activo: false, ultimo_error: 'bloqueado', actualizado_en: new Date().toISOString() })
        .eq('destino', chatId)
        .eq('canal', 'telegram');
      return { ok: false as const, motivo: 'bloqueado' };
    }
    if (code === 429) return { ok: false as const, motivo: 'limite' };
    return { ok: false as const, motivo: String(body?.description || 'telegram') };
  } catch {
    return { ok: false as const, motivo: 'red' };
  }
}

// ---------- Registro anti-duplicados ----------

async function registrar(admin: any, row: Record<string, unknown>) {
  // La clave única evita un segundo aviso si el cron se solapa o se reintenta.
  const { error } = await admin.from('appi_recordatorios_enviados').insert(row);
  if (error && error.code !== '23505') console.error('registro recordatorio', error);
  return !error;
}

async function marcarEstado(admin: any, filtro: Record<string, unknown>, detalle: Record<string, unknown>, estado: string) {
  await admin.from('appi_recordatorios_enviados')
    .update({ estado, detalle })
    .match(filtro);
}

// ---------- Contexto de envío por persona ----------

async function contextoEnvios(admin: any) {
  const [canales, dispositivos] = await Promise.all([
    admin
      .from('appi_canales_aviso')
      .select('user_id,persona_tipo,destino')
      .eq('canal', 'telegram')
      .eq('activo', true)
      .not('destino', 'is', null),
    admin
      .from('appi_dispositivos_vinculados')
      .select('id,user_id,persona_tipo,push_endpoint,push_p256dh,push_auth')
      .eq('activo', true)
      .eq('notificaciones', true)
      .eq('recordatorios', true)
      .not('push_endpoint', 'is', null),
  ]);
  const chats = new Map<string, string>();
  for (const c of canales.data || []) chats.set(clavePersona(c), String(c.destino));
  const pushes = new Map<string, any[]>();
  for (const d of dispositivos.data || []) {
    const k = clavePersona(d);
    if (!pushes.has(k)) pushes.set(k, []);
    pushes.get(k)!.push({ ...d, device_id: d.id });
  }
  return { chats, pushes };
}

// ---------- Envíos ----------

async function enviarResumen(admin: any, ctx: any, token: string) {
  const fecha = localDate();
  const { data, error } = await admin.rpc('appi_pendientes_canales', { p_fecha: fecha });
  if (error) throw error;
  const pendientes = Array.isArray(data) ? data : [];
  let enviados = 0;
  let fallidos = 0;

  for (const row of pendientes) {
    const claveFiltro = {
      user_id: row.user_id,
      persona_tipo: row.persona_tipo,
      tipo: 'resumen_diario' as const,
      clave: fecha,
    };
    // Se reserva el aviso ANTES de enviarlo (el estado final se ajusta abajo).
    const reservado = await registrar(admin, {
      ...claveFiltro,
      detalle: { nuevos: row.nuevos, hoy: row.hoy, vencidos: row.vencidos, presentaciones: row.presentaciones, encuestas_nuevas: row.encuestas_nuevas, total: row.total },
      estado: 'enviado',
    });
    if (!reservado) continue;

    const nombre = firstName(row.nombre);
    const targets = ctx.pushes.get(clavePersona(row)) || [];
    const chat = ctx.chats.get(clavePersona(row)) || '';

    const canales: Record<string, unknown> = {};
    let llego = false;

    // Web Push a todos los teléfonos aptos de esa persona.
    let pushOk = 0;
    for (const t of targets) {
      const r = await sendPush(admin, t, {
        type: 'daily_summary',
        title: nombre ? `Buen día, ${nombre}` : 'Mi Gestión',
        body: summaryBody(row),
        url: './?gestion=hoy',
        total: row.total,
      }, 3600);
      if (r.ok) { pushOk++; llego = true; }
    }
    canales.push = pushOk > 0 ? { ok: pushOk } : targets.length ? { ok: 0, err: true } : { sin: true };

    // Telegram como canal alternativo (mismo resumen).
    if (chat && token) {
      const texto = `Buen día, ${nombre || 'distribuidor'} 👋\n\n${summaryBody(row)}\n\n📱 Abrí APPI para ver el detalle.`;
      const r = await telegramSend(admin, chat, token, texto);
      if (r.ok) { canales.telegram = { ok: true }; llego = true; }
      else canales.telegram = { ok: false, err: r.motivo };
    } else if (chat) {
      canales.telegram = { ok: false, err: 'sin_token' };
    }

    if (llego) enviados++;
    else {
      fallidos++;
      await marcarEstado(admin, claveFiltro, {
        ...canales,
        nuevos: row.nuevos, hoy: row.hoy, vencidos: row.vencidos,
        presentaciones: row.presentaciones, encuestas_nuevas: row.encuestas_nuevas,
        total: row.total,
      }, 'error');
    }
  }

  return { modo: 'resumen', fecha, candidatos: pendientes.length, enviados, fallidos };
}

async function enviarPresentaciones(admin: any, ctx: any, token: string) {
  const { data, error } = await admin.rpc('appi_presentaciones_canales', { p_minutos: AVISO_MINUTOS });
  if (error) throw error;
  const proximas = Array.isArray(data) ? data : [];
  let enviados = 0;
  let fallidos = 0;

  for (const row of proximas) {
    const claveFiltro = {
      user_id: row.user_id,
      persona_tipo: row.persona_tipo,
      tipo: 'presentacion' as const,
      clave: `${row.contacto_id}|${row.fecha}`,
    };
    const reservado = await registrar(admin, {
      ...claveFiltro,
      contacto_id: row.contacto_id,
      detalle: { fecha: row.fecha, hora: String(row.hora || '').slice(0, 5), nombre: row.contacto_nombre },
      estado: 'enviado',
    });
    if (!reservado) continue;

    const hora = shortTime(row.hora);
    const nombre = String(row.contacto_nombre || 'un contacto');
    const targets = ctx.pushes.get(clavePersona(row)) || [];
    const chat = ctx.chats.get(clavePersona(row)) || '';

    const canales: Record<string, unknown> = {};
    let llego = false;

    let pushOk = 0;
    for (const t of targets) {
      const r = await sendPush(admin, t, {
        type: 'presentation_reminder',
        title: 'Presentación en 30 minutos',
        body: hora ? `${nombre} · ${hora}` : nombre,
        url: `./?gestion=contacto&contacto=${row.contacto_id}`,
        contacto_id: row.contacto_id,
      }, 1800);
      if (r.ok) { pushOk++; llego = true; }
    }
    canales.push = pushOk > 0 ? { ok: pushOk } : targets.length ? { ok: 0, err: true } : { sin: true };

    if (chat && token) {
      const texto = `⏰ Presentación en 30 minutos\n\n${nombre}${hora ? ` · ${hora}` : ''}\n\n📱 Abrí APPI para ver el contacto.`;
      const r = await telegramSend(admin, chat, token, texto);
      if (r.ok) { canales.telegram = { ok: true }; llego = true; }
      else canales.telegram = { ok: false, err: r.motivo };
    } else if (chat) {
      canales.telegram = { ok: false, err: 'sin_token' };
    }

    if (llego) enviados++;
    else {
      fallidos++;
      await marcarEstado(admin, claveFiltro, { ...canales, fecha: row.fecha, hora: String(row.hora || '').slice(0, 5), nombre: row.contacto_nombre }, 'error');
    }
  }

  return { modo: 'presentaciones', candidatos: proximas.length, enviados, fallidos };
}

Deno.serve(async request => {
  if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRole) return json({ error: 'Servicio no configurado.' }, 503);

  // Solo el cron, con la clave de servicio, puede disparar envíos masivos.
  const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token || token !== serviceRole) return json({ error: 'No autorizado.' }, 401);

  const publicKey = Deno.env.get('VAPID_PUBLIC_KEY') || '';
  const privateKey = Deno.env.get('VAPID_PRIVATE_KEY') || '';
  const subject = Deno.env.get('VAPID_SUBJECT') || 'https://somospopups.github.io/appi/';
  const telegramToken = Deno.env.get('TELEGRAM_BOT_TOKEN') || '';

  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const body = await request.json().catch(() => ({}));
    const modo = String((body as any)?.modo || 'resumen');
    const ctx = await contextoEnvios(admin);

    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
    }
    if (modo === 'resumen') return json(await enviarResumen(admin, ctx, telegramToken));
    if (modo === 'presentaciones') return json(await enviarPresentaciones(admin, ctx, telegramToken));
    return json({ error: 'Modo desconocido.' }, 400);
  } catch (error) {
    console.error('recordatorios-gestion', error);
    return json({ error: error instanceof Error ? error.message : 'Error inesperado.' }, 500);
  }
});
