// Supabase Edge Function: historico-analisis
// Secrets requeridos:
//   OPENAI_API_KEY
// Opcionales:
//   AI_MODEL (por defecto gpt-4o-mini)
//   AI_API_URL (por defecto endpoint compatible con Chat Completions)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function compactPayload(body: any) {
  const periods = Array.isArray(body?.periods) ? body.periods.slice(-12) : [];
  return {
    periods: periods.map((period: any) => ({
      id: String(period.id || ''),
      label: String(period.label || ''),
      summary: period.summary || {},
      people: Array.isArray(period.people)
        ? period.people.slice(0, 500).map((p: any) => ({
            nombre: String(p.nombre || ''),
            codigo: String(p.codigo || ''),
            categoria: String(p.categoria || ''),
            pbPersonal: Number(p.pbPersonal) || 0,
            pbEquipo: Number(p.pbEquipo) || 0,
            garantias: p.garantias || {},
            rama: String(p.rama || ''),
          }))
        : [],
      incomes: Array.isArray(period.incomes)
        ? period.incomes.slice(0, 500).map((i: any) => ({
            nombre: String(i.nombre || ''),
            dip: String(i.dip || ''),
            categoria: String(i.categoria || ''),
            fechaAlta: String(i.fechaAlta || ''),
            ultimaCompra: String(i.ultimaCompra || ''),
            diasHastaCompra: Number(i.diasHastaCompra) || 0,
            compraPosterior: Boolean(i.compraPosterior),
            patrocinante: String(i.patrocinante || ''),
            patrocinanteDip: String(i.patrocinanteDip || ''),
            capacitacion: Number(i.capacitacion) || 0,
          }))
        : [],
    })),
    localStrategies: Array.isArray(body?.localStrategies) ? body.localStrategies : [],
    comparison: body?.comparison || {},
  };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) return json({ error: 'Falta configurar OPENAI_API_KEY en Supabase.' }, 503);

  try {
    const body = await request.json();
    const payload = compactPayload(body);
    if (!payload.periods.length) return json({ error: 'No se recibieron períodos para analizar.' }, 400);

    const model = Deno.env.get('AI_MODEL') || 'gpt-4o-mini';
    const apiUrl = Deno.env.get('AI_API_URL') || 'https://api.openai.com/v1/chat/completions';
    const system = `Sos un analista estratégico de equipos. Analizá únicamente los datos entregados. No inventes cifras ni causas. Escribí en español rioplatense claro y profesional. Cada recomendación debe citar su evidencia numérica. No menciones teléfonos, domicilios, correos ni información que no aparezca en el conjunto permitido.`;
    const user = `Prepará un informe accionable con estas secciones:\n1. Resumen ejecutivo.\n2. Fortalezas verificadas.\n3. Puntos bajos y riesgos.\n4. Personas y ramas prioritarias, explicando por qué.\n5. Estrategia de 30 días dividida por semanas.\n6. Objetivos numéricos sugeridos para el próximo cierre.\n7. Cinco preguntas que el responsable debería hacerse.\n\nDatos históricos:\n${JSON.stringify(payload)}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.25,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      const message = result?.error?.message || `El proveedor de IA respondió ${response.status}`;
      return json({ error: message }, 502);
    }
    const analysis = result?.choices?.[0]?.message?.content;
    if (!analysis) return json({ error: 'La IA no devolvió contenido.' }, 502);
    return json({ analysis, model });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Error inesperado' }, 500);
  }
});
