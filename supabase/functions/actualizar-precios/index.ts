// APPI · Actualizar precios PSA desde la tienda (botón en Lista de precios)
// Cualquier distribuidor autenticado puede dispararlo, máximo 1 vez por día.
// El primero que toca actualiza para todos: guarda en Storage público
// y Lista de precios lo lee al abrir.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' };
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: jsonHeaders });

const BUCKET = 'catalogo-psa';
const CAT_FILE = 'psa-catalogo.json';
const PRE_FILE = 'psa-precios.json';
const PLAN_FILE = 'psa-planes.json';
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function fechaAR(d = new Date()) {
  const z = new Date(d.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
  return `${z.getDate()}-${MESES[z.getMonth()]}-${z.getFullYear()}`;
}

async function fetchText(url: string, timeout = 20000): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Safari/537.36' }, signal: ctrl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.text();
  } finally { clearTimeout(t); }
}

function parsePrecio(html: string): number | null {
  let m = html.match(/class="price"[^>]*>\s*\$?\s*([\d\.\,]+)/);
  if (m) {
    const raw = m[1].split(',')[0];
    const v = parseInt(raw.replace(/\./g, ''), 10);
    if (v > 1000) return v;
  }
  m = html.match(/Precio final[^$]*\$\s*([\d\.\,]+)/);
  if (m) {
    const raw = m[1].split(',')[0];
    const v = parseInt(raw.replace(/\./g, ''), 10);
    if (v > 1000) return v;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRole) return json({ error: 'Servicio no configurado.' }, 503);

  const supabase = createClient(supabaseUrl, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } });

  // Auth: verificar que sea distribuidor activo (mismo que telegram-canal)
  const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!jwt) return json({ error: 'Iniciá sesión para actualizar.' }, 401);
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !authData.user) return json({ error: 'Sesión no válida.' }, 401);
    const userId = authData.user.id;
    const { data: profile } = await supabase.from('appi_perfiles').select('user_id,rol,activo,membresia_vence').eq('user_id', userId).maybeSingle();
    const exp = profile?.membresia_vence ? new Date(profile.membresia_vence).getTime() : 0;
    if (!profile || profile.rol !== 'usuario' || profile.activo !== true || exp <= Date.now()) {
      return json({ error: 'Tu cuenta no está activa.' }, 403);
    }
  } catch (_) {
    return json({ error: 'No se pudo verificar la sesión.' }, 401);
  }

  // Asegurar bucket público
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find(b => b.name === BUCKET)) {
      await supabase.storage.createBucket(BUCKET, { public: true });
    }
  } catch (_) {}

  // Leer catálogo actual desde Storage (si existe) para check de 1 vez por día
  let actual: any = null;
  try {
    const { data } = await supabase.storage.from(BUCKET).download(CAT_FILE);
    if (data) {
      const txt = await data.text();
      actual = JSON.parse(txt);
    }
  } catch (_) {}
  // Fallback: si no hay en Storage, leer de GitHub Pages
  if (!actual) {
    try {
      const r = await fetch('https://somospopups.github.io/appi/psa-catalogo.json?nocache=' + Date.now());
      if (r.ok) actual = await r.json();
    } catch (_) {}
  }
  if (actual?.actualizado === fechaAR()) {
    return json({ ok: true, yaActualizado: true, actualizado: actual.actualizado, mensaje: `Ya está al día (${actual.actualizado}). Volvé mañana.` });
  }

  // Si no hay catálogo base, error
  if (!actual?.productos?.length) {
    return json({ error: 'No se pudo leer el catálogo base.' }, 500);
  }

  // Scrapear precios
  const productos = actual.productos as any[];
  let cambiados = 0;
  let errores = 0;
  const nuevosPrecios: Record<string, number> = {};
  for (const p of productos) {
    const url = String(p.url || '');
    if (!url) continue;
    try {
      const html = await fetchText(url, 15000);
      const precio = parsePrecio(html);
      if (precio && precio !== p.precio) {
        p.precio = precio;
        p.lista = precio;
        cambiados++;
      }
      if (precio) nuevosPrecios[String(p.sku)] = precio;
      // Pequeña pausa para no saturar la tienda
      await new Promise(r => setTimeout(r, 350));
    } catch (_) {
      errores++;
      if (p.precio) nuevosPrecios[String(p.sku)] = p.precio;
    }
  }

  const nuevaFecha = fechaAR();
  actual.actualizado = nuevaFecha;

  // Actualizar precios cotejo (15 SKUs)
  const SKUS: Record<string,string> = {
    mini: '611030410', vero: '611030420', senior: '611010580', senior4: '611010510',
    s1000: '611120200', senik: '611030540', quantum2: '611030620', c3: '611030430',
    rinnova: '611100240', 'rinnova-poli': '611100250', portatil: '611020010',
    stopper: '611030060', poli2: '612280190', soda: '617110040', iontrix: '611290050',
  };
  let preciosObj: any = null;
  try {
    const { data } = await supabase.storage.from(BUCKET).download(PRE_FILE);
    if (data) preciosObj = JSON.parse(await data.text());
  } catch (_) {}
  if (!preciosObj) {
    try {
      const r = await fetch('https://somospopups.github.io/appi/psa-precios.json?nocache=' + Date.now());
      if (r.ok) preciosObj = await r.json();
    } catch (_) {}
  }
  if (preciosObj) {
    preciosObj.actualizado = nuevaFecha;
    preciosObj.precios = preciosObj.precios || {};
    preciosObj.nombres = preciosObj.nombres || {};
    for (const [k, sku] of Object.entries(SKUS)) {
      if (nuevosPrecios[sku]) {
        preciosObj.precios[k] = nuevosPrecios[sku];
        const prod = productos.find(x => String(x.sku) === sku);
        if (prod) preciosObj.nombres[k] = prod.nombre;
      }
    }
  }

  // Planes: mantener vigente, solo actualizar fecha
  let planesObj: any = null;
  try {
    const { data } = await supabase.storage.from(BUCKET).download(PLAN_FILE);
    if (data) planesObj = JSON.parse(await data.text());
  } catch (_) {}
  if (!planesObj) {
    try {
      const r = await fetch('https://somospopups.github.io/appi/psa-planes.json?nocache=' + Date.now());
      if (r.ok) planesObj = await r.json();
    } catch (_) {}
  }
  if (planesObj) planesObj.actualizado = nuevaFecha;

  // Guardar en Storage (público, upsert)
  const up = async (name: string, obj: any) => {
    const blob = new Blob([JSON.stringify(obj, null, 2) + '\n'], { type: 'application/json' });
    const { error } = await supabase.storage.from(BUCKET).upload(name, blob, { upsert: true, contentType: 'application/json; charset=utf-8' });
    if (error) throw error;
  };
  try {
    await up(CAT_FILE, actual);
    if (preciosObj) await up(PRE_FILE, preciosObj);
    if (planesObj) await up(PLAN_FILE, planesObj);
  } catch (e) {
    return json({ error: 'No se pudo guardar el catálogo: ' + String((e as any)?.message || e) }, 500);
  }

  return json({ ok: true, yaActualizado: false, actualizado: nuevaFecha, cambiados, errores, total: productos.length });
});
