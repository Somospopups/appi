// APPI · v216 · Recordatorios de Mi Gestión
// Envía el resumen diario y los avisos de presentación por Web Push.
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

// "3 seguimientos, 1 presentación y 2 nuevos" en lugar de una lista seca.
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

async function registrar(admin: any, row: Record<string, unknown>) {
  // La clave única evita un segundo aviso si el cron se solapa o se reintenta.
  const { error } = await admin.from('appi_recordatorios_enviados').insert(row);
  if (error && error.code !== '23505') console.error('registro recordatorio', error);
  return !error;
}

async function enviarResumen(admin: any) {
  const fecha = localDate();
  const { data, error } = await admin.rpc('appi_pendientes_resumen', { p_fecha: fecha });
  if (error) throw error;
  const pendientes = Array.isArray(data) ? data : [];
  let enviados = 0;
  let fallidos = 0;

  for (const row of pendientes) {
    // Se reserva el aviso ANTES de enviarlo: si el push falla, el registro
    // queda como 'error' y no se reintenta el mismo día.
    const reservado = await registrar(admin, {
      user_id: row.user_id,
      persona_tipo: row.persona_tipo,
      tipo: 'resumen_diario',
      clave: fecha,
      detalle: {
        nuevos: row.nuevos,
        hoy: row.hoy,
        vencidos: row.vencidos,
        presentaciones: row.presentaciones,
        encuestas_nuevas: row.encuestas_nuevas,
        total: row.total,
      },
      estado: 'enviado',
    });
    if (!reservado) continue;

    const nombre = firstName(row.nombre);
    const result = await sendPush(admin, row, {
      type: 'daily_summary',
      title: nombre ? `Buen día, ${nombre}` : 'Mi Gestión',
      body: summaryBody(row),
      url: './?gestion=hoy',
      total: row.total,
    }, 3600);

    if (result.ok) enviados++;
    else {
      fallidos++;
      await admin.from('appi_recordatorios_enviados')
        .update({ estado: 'error' })
        .eq('user_id', row.user_id)
        .eq('persona_tipo', row.persona_tipo)
        .eq('tipo', 'resumen_diario')
        .eq('clave', fecha);
    }
  }

  return { modo: 'resumen', fecha, candidatos: pendientes.length, enviados, fallidos };
}

async function enviarPresentaciones(admin: any) {
  const { data, error } = await admin.rpc('appi_presentaciones_proximas', { p_minutos: AVISO_MINUTOS });
  if (error) throw error;
  const proximas = Array.isArray(data) ? data : [];
  let enviados = 0;
  let fallidos = 0;

  for (const row of proximas) {
    const clave = `${row.contacto_id}|${row.fecha}`;
    const reservado = await registrar(admin, {
      user_id: row.user_id,
      persona_tipo: row.persona_tipo,
      tipo: 'presentacion',
      clave,
      contacto_id: row.contacto_id,
      detalle: { fecha: row.fecha, hora: row.hora, nombre: row.contacto_nombre },
      estado: 'enviado',
    });
    if (!reservado) continue;

    const hora = shortTime(row.hora);
    const nombre = String(row.contacto_nombre || 'un contacto');
    const result = await sendPush(admin, row, {
      type: 'presentation_reminder',
      title: 'Presentación en 30 minutos',
      body: hora ? `${nombre} · ${hora}` : nombre,
      url: `./?gestion=contacto&contacto=${row.contacto_id}`,
      contacto_id: row.contacto_id,
    }, 1800);

    if (result.ok) enviados++;
    else {
      fallidos++;
      await admin.from('appi_recordatorios_enviados')
        .update({ estado: 'error' })
        .eq('user_id', row.user_id)
        .eq('persona_tipo', row.persona_tipo)
        .eq('tipo', 'presentacion')
        .eq('clave', clave);
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
  if (!publicKey || !privateKey) return json({ error: 'Las notificaciones no están configuradas.' }, 503);
  webpush.setVapidDetails(subject, publicKey, privateKey);

  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const body = await request.json().catch(() => ({}));
    const modo = String((body as any)?.modo || 'resumen');
    if (modo === 'resumen') return json(await enviarResumen(admin));
    if (modo === 'presentaciones') return json(await enviarPresentaciones(admin));
    return json({ error: 'Modo desconocido.' }, 400);
  } catch (error) {
    console.error('recordatorios-gestion', error);
    return json({ error: error instanceof Error ? error.message : 'Error inesperado.' }, 500);
  }
});
