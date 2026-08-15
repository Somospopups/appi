import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};
const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' };

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
}

function cleanText(value: unknown, max = 200) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, max);
}

function cleanPhone(value: unknown) {
  const display = String(value ?? '').trim().slice(0, 30);
  const normalized = display.replace(/\D/g, '').slice(0, 15);
  return { display, normalized };
}

function validUuid(value: unknown) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function cleanAnswer(value: unknown): string | number | boolean | string[] {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(-1000, Math.min(1000, value));
  if (Array.isArray(value)) return value.slice(0, 12).map(item => cleanText(item, 160)).filter(Boolean);
  return cleanText(value, 300);
}

const allowedAnswerKeys = new Set([
  'agua_tipo', 'agua_tipo_otros', 'agua_cantidad', 'agua_cantidad_otros',
  'agua_importancia', 'agua_calidad', 'agua_calidad_como', 'agua_proviene',
  'agua_anomalias', 'agua_turbidez', 'agua_potabilizadores',
  'agua_potabilizadores_otros', 'evitar_sustancias', 'alternativas_evitar',
  'alternativas_evitar_otros', 'ambiente', 'laboral_dedica',
  'laboral_dedica_otros', 'laboral_gusta', 'laboral_gusta_otros',
  'laboral_mejorar', 'laboral_mejorar_otros', 'conoces', 'oportunidad'
]);

function cleanAnswers(value: unknown) {
  const source = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(source)) {
    if (allowedAnswerKeys.has(key)) result[key] = cleanAnswer(item);
  }
  return result;
}

function cleanReferrals(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 10).map(item => {
    const row = item && typeof item === 'object' ? item as Record<string, unknown> : {};
    const phone = cleanPhone(row.telefono);
    return {
      nombre: cleanText(row.nombre, 120),
      telefono: phone.display,
      telefono_normalizado: phone.normalized,
      relacion: cleanText(row.relacion, 80),
      zona: cleanText(row.zona, 120),
    };
  }).filter(row => row.nombre || row.telefono_normalizado);
}

function validateRequiredAnswers(answers: Record<string, unknown>) {
  const required = [
    'agua_tipo', 'agua_cantidad', 'agua_importancia', 'agua_calidad',
    'agua_calidad_como', 'agua_proviene', 'agua_anomalias', 'agua_turbidez',
    'agua_potabilizadores', 'evitar_sustancias', 'alternativas_evitar',
    'ambiente', 'laboral_dedica', 'laboral_gusta', 'laboral_mejorar',
    'conoces', 'oportunidad'
  ];
  return required.every(key => {
    const value = answers[key];
    return Array.isArray(value) ? value.length > 0 : value !== '' && value !== null && value !== undefined;
  });
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (!['GET', 'POST'].includes(request.method)) return json({ error: 'Método no permitido.' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRole) return json({ error: 'Servicio no configurado.' }, 503);

  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    if (request.method === 'GET') {
      const requestUrl = new URL(request.url);
      const token = requestUrl.searchParams.get('token') || '';
      if (!validUuid(token)) return json({ error: 'El enlace de encuesta no es válido.' }, 400);

      const { data: linkRow, error: linkError } = await admin
        .from('appi_encuesta_links')
        .select('user_id,activo')
        .eq('token', token)
        .eq('activo', true)
        .maybeSingle();
      if (linkError || !linkRow) return json({ error: 'Esta encuesta no está disponible en este momento.' }, 404);

      const { data: profile, error: profileError } = await admin
        .from('appi_perfiles')
        .select('nombre,rol,activo,membresia_vence')
        .eq('user_id', linkRow.user_id)
        .maybeSingle();
      const expires = profile?.membresia_vence ? new Date(profile.membresia_vence).getTime() : 0;
      if (profileError || !profile || profile.rol !== 'usuario' || profile.activo !== true || expires <= Date.now()) {
        return json({ error: 'Esta encuesta no está disponible en este momento.' }, 404);
      }

      return json({
        ok: true,
        encuesta: 'Mi Encuesta',
        distribuidor: cleanText(profile.nombre, 80),
        privacidad: 'Las respuestas se entregan únicamente al distribuidor que compartió este enlace.'
      });
    }

    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > 80_000) return json({ error: 'La encuesta supera el tamaño permitido.' }, 413);

    const body = await request.json();
    // Honeypot silencioso: los bots creen que la respuesta fue aceptada.
    if (cleanText(body?.website, 100)) return json({ ok: true, recibida: true }, 201);

    const token = String(body?.token || '');
    const submissionId = String(body?.submission_id || '');
    if (!validUuid(token) || !validUuid(submissionId)) return json({ error: 'El enlace o envío no es válido.' }, 400);

    const nombre = cleanText(body?.nombre, 120);
    const telefono = cleanPhone(body?.telefono);
    const respuestas = cleanAnswers(body?.respuestas);
    const referralMap = new Map<string, ReturnType<typeof cleanReferrals>[number]>();
    for (const referral of cleanReferrals(body?.referidos)) {
      if (referral.telefono_normalizado && referral.telefono_normalizado !== telefono.normalized) {
        referralMap.set(referral.telefono_normalizado, referral);
      }
    }
    const referidos = [...referralMap.values()];
    const consentimiento = body?.consentimiento === true;
    const autorizacionReferidos = body?.autorizacion_referidos === true;

    if (nombre.length < 2) return json({ error: 'Ingresá tu nombre y apellido.' }, 400);
    if (telefono.normalized.length < 8) return json({ error: 'Ingresá un teléfono válido.' }, 400);
    if (!validateRequiredAnswers(respuestas)) return json({ error: 'Completá todas las preguntas requeridas.' }, 400);
    if (!consentimiento) return json({ error: 'Necesitamos tu autorización para enviar las respuestas.' }, 400);

    for (const referral of referidos) {
      if (referral.nombre.length < 2 || referral.telefono_normalizado.length < 8) {
        return json({ error: 'Completá nombre y teléfono de cada referido agregado.' }, 400);
      }
    }
    if (referidos.length && !autorizacionReferidos) {
      return json({ error: 'Confirmá que tus referidos autorizaron compartir sus datos.' }, 400);
    }

    const payload = {
      nombre,
      telefono: telefono.display,
      respuestas,
      referidos: referidos.map(({ telefono_normalizado: _normalized, ...row }) => row),
      consentimiento,
      autorizacion_referidos: autorizacionReferidos,
    };

    const { data, error } = await admin.rpc('appi_registrar_encuesta_publica', {
      p_token: token,
      p_submission_id: submissionId,
      p_payload: payload,
    });

    if (error) {
      console.error('encuesta-publica rpc', error);
      const known = /enlace|consentimiento|teléfono|nombre|referidos|formato|límite/i.test(error.message || '');
      return json({ error: known ? error.message : 'No pudimos guardar la encuesta. Intentá nuevamente.' }, known ? 400 : 500);
    }

    return json({ ...data, recibida: true }, 201);
  } catch (error) {
    console.error('encuesta-publica', error);
    return json({
      error: error instanceof SyntaxError
        ? 'El formato enviado no es válido.'
        : 'No pudimos procesar la encuesta. Intentá nuevamente.'
    }, error instanceof SyntaxError ? 400 : 500);
  }
});
