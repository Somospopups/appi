// APPI · Consulta de serie en la base de PSA (Mi Stock → Pendientes).
//
// Al hacer un plan canje nos llevamos el equipo viejo del usuario y hay
// que entregarlo a la empresa. En la BASE del purificador hay un QR con
// el número de serie. Esta función lo convierte en "a quién pertenece":
//
//   1. Login a mi.psa.com.ar con las credenciales PSA que el usuario ya
//      guardó en APPI (sección MI PSA) — no se guardan acá, se usan solo
//      para la consulta y se descartan.
//   2. SSO a dip.psa.com.ar (la cadena completa: hub → SSO → gw_login →
//      login.php) para obtener la sesión del módulo de Autoconsulta.
//   3. Descarga el reporte "Garantías" (autoconsulta idx=88): tabla
//      Usuario · Telf · Domicilio · C.P. · Localidad · Serie · Producto
//      · F. Compra · F. Vence … y busca la serie.
//
// POST /functions/v1/consulta-serial
// body: { serie: "HTA69440", center: "02", number: "98020174", password: "..." }
// resp: { ok, serie, encontrado, usuario, telefono, domicilio, cp,
//         localidad, producto, compra, vence }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' };
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: jsonHeaders });

const UA = 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36';
const MI = 'https://mi.psa.com.ar';
const DIP = 'https://dip.psa.com.ar';
const DIP_HUB = DIP + '/home/auto_consultas.php';
const DIP_EXEC = DIP + '/home/autoconsulta_exec.php';

function normSerie(s: string): string {
  return String(s || '').replace(/\s+/g, '').toUpperCase();
}

type Jar = Record<string, string>;
function putCookies(h: Headers, jar: Jar) {
  const sc = h.getSetCookie ? h.getSetCookie() : [];
  for (const c of sc) {
    const [par] = c.split(';');
    const i = par.indexOf('=');
    if (i > 0) jar[par.slice(0, i).trim()] = par.slice(i + 1).trim();
  }
}
const cookieH = (jar: Jar) => Object.entries(jar).map(([k, v]) => k + '=' + v).join('; ');

/**
 * Login en mi.psa.com.ar → cookies de la sesión (psagw).
 * IMPORTANTE: la cookie de sesión se setea en la respuesta 302 de
 * /login_check; con redirect:'manual' la capturamos (undici la pierde
 * al seguir el redirect solo).
 */
async function loginPSA(center: string, number: string, password: string): Promise<Jar | null> {
  const mi: Jar = {};
  const r1 = await fetch(MI + '/login', { headers: { 'User-Agent': UA } });
  putCookies(r1.headers, mi);
  const html1 = await r1.text();
  const m = html1.match(/name="_csrf_token" value="([^"]+)"/);
  if (!m) return null;
  const fd = new URLSearchParams();
  fd.set('_center', center);
  fd.set('_number', number);
  fd.set('_password', password);
  fd.set('_term_use', 'accept');
  fd.set('_csrf_token', m[1]);
  const r2 = await fetch(MI + '/login_check', {
    method: 'POST',
    headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded', Cookie: cookieH(mi) },
    body: fd.toString(),
    redirect: 'manual'
  });
  putCookies(r2.headers, mi);
  const loc = r2.headers.get('location');
  if (loc) {
    // Seguir el 302 manualmente (la cookie ya está en el jar).
    const r3 = await fetch(new URL(loc, MI).href, { headers: { 'User-Agent': UA, Cookie: cookieH(mi) } });
    putCookies(r3.headers, mi);
  }
  if (!mi['psagw']) return null;
  // Verificar que la sesión quedó logueada.
  const r4 = await fetch(MI + '/', { headers: { 'User-Agent': UA, Cookie: cookieH(mi) } });
  const h4 = await r4.text();
  if (!h4.includes('Mi PSA')) return null;
  return mi;
}

/**
 * SSO a dip.psa.com.ar (módulo Autoconsulta). Cadena verificada:
 *   1) GET hub (sin cookies)        → 302 al SSO de mi.psa.com.ar (crea PHPSESSID de dip)
 *   2) GET SSO de mi (cookies mi)   → 302 a dip/gw_login_autoconsultas.php?p=<token>
 *   3) GET gw_login (cookies dip)   → 302 a dip/login.php?from=gw2&to=ac&msg=…
 *   4) GET login.php (cookies dip)  → 302 al hub (PSA_AC activo)
 * El token de cada hop se usa EXACTO como viene en el Location (no
 * re-decodificar).
 */
async function ssoDip(mi: Jar): Promise<Jar | null> {
  const dip: Jar = {};
  const hop = async (url: string, jar: Jar, withMi: boolean): Promise<string | null> => {
    const h: Record<string, string> = { 'User-Agent': UA };
    if (jar['PHPSESSID'] || jar['PSA_AC']) h['Cookie'] = cookieH(jar);
    if (withMi) h['Cookie'] = cookieH(mi);
    const r = await fetch(url, { headers: h, redirect: 'manual' });
    putCookies(r.headers, dip);
    putCookies(r.headers, withMi ? mi : dip);
    return r.headers.get('location');
  };
  try {
    const loc1 = await hop(DIP_HUB, dip, false);
    if (!loc1) return null;
    const loc2 = await hop(new URL(loc1, DIP_HUB).href, dip, true);
    if (!loc2) return null;
    const loc3 = await hop(new URL(loc2, DIP_HUB).href, dip, false);
    if (!loc3) return null;
    await hop(new URL(loc3, DIP_HUB).href, dip, false);
    // Verificar: el hub debe traer la grilla de reportes.
    const r5 = await fetch(DIP_HUB, { headers: { 'User-Agent': UA, Cookie: cookieH(dip) } });
    const h5 = await r5.text();
    if (!h5.includes('txtCons')) return null;
    return dip;
  } catch (_) {
    return null;
  }
}

interface Fila { usuario: string; telefono: string; domicilio: string; cp: string; localidad: string; serie: string; producto: string; compra: string; vence: string; canje: string }

/** Parsea el reporte de Garantías (tabla HTML de 12 columnas). */
function parsearGarantias(html: string): Fila[] {
  const out: Fila[] = [];
  const trs = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || [];
  for (const tr of trs) {
    const cells = (tr.match(/<td[^>]*>[\s\S]*?<\/td>/g) || [])
      .map(c => c.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&eacute;/g, 'é').replace(/&iacute;/g, 'í').replace(/\s+/g, ' ').trim());
    if (cells.length < 12) continue;
    const serie = normSerie(cells[5]);
    if (!serie) continue;
    out.push({
      usuario: cells[0], telefono: cells[1], domicilio: cells[2], cp: cells[3],
      localidad: cells[4], serie, producto: cells[6], compra: cells[7], vence: cells[8], canje: cells[11] || ''
    });
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRole) return json({ error: 'Servicio no configurado.' }, 503);
  const supabase = createClient(supabaseUrl, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } });

  // Auth: distribuidor activo (mismo criterio que actualizar-precios)
  const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!jwt) return json({ error: 'Iniciá sesión para consultar.' }, 401);
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !authData.user) return json({ error: 'Sesión no válida.' }, 401);
    const { data: profile } = await supabase.from('appi_perfiles').select('user_id,rol,activo,membresia_vence').eq('user_id', authData.user.id).maybeSingle();
    const exp = profile?.membresia_vence ? new Date(profile.membresia_vence).getTime() : 0;
    if (!profile || profile.rol !== 'usuario' || profile.activo !== true || exp <= Date.now()) {
      return json({ error: 'Tu cuenta no está activa.' }, 403);
    }
  } catch (_) {
    return json({ error: 'No se pudo verificar la sesión.' }, 401);
  }

  let body: any;
  try { body = await req.json(); } catch (_) { body = {}; }
  const serie = normSerie(body.serie || '');
  if (body.action !== 'report' && serie.length < 4) return json({ error: 'Escribí el número de serie (el del QR de la base).' }, 400);

  // Credenciales PSA: las trae la app (sección MI PSA) o secrets del proyecto.
  const center = String(body.center || Deno.env.get('PSA_CENTER') || '').trim();
  const number = String(body.number || Deno.env.get('PSA_NUMBER') || '').trim().replace(/^0+/, '');
  const password = String(body.password || Deno.env.get('PSA_PASSWORD') || '');
  if (!center || !number || !password) {
    return json({ error: 'Faltan tus datos de MI PSA. Guardalos en APPI (Ajustes → MI PSA) o como secrets PSA_CENTER / PSA_NUMBER / PSA_PASSWORD.' }, 400);
  }

  // 1) Login MI PSA
  let mi: Jar | null;
  try {
    mi = await loginPSA(center, number, password);
  } catch (e) {
    return json({ error: 'No se pudo conectar con PSA: ' + String((e as any)?.message || e) }, 502);
  }
  if (!mi) return json({ error: 'No se pudo entrar a mi.psa.com.ar con esos datos (¿clave correcta?).' }, 401);

  // 2) SSO a dip (Autoconsulta)
  let dip: Jar | null;
  try {
    dip = await ssoDip(mi);
  } catch (e) {
    return json({ error: 'No se pudo abrir el módulo de Autoconsulta de PSA.' }, 502);
  }
  if (!dip) return json({ error: 'La sesión PSA no habilitó el reporte de Garantías para este distribuidor.' }, 502);

  const dipReq = (url: string, opts: { method?: string; body?: string } = {}): Promise<Response> =>
    fetch(url, {
      method: opts.method || 'GET',
      headers: {
        'User-Agent': UA,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': DIP_HUB,
        Cookie: cookieH(dip)
      },
      body: opts.body
    });

  // 3) Formulario del reporte Garantías → trae centro/dip/clave del DIP logueado
  let htmlForm = '';
  try {
    const rf = await dipReq(DIP_EXEC + '?idx=88&periodo=09-2026&Consulta=Garantias');
    htmlForm = await rf.text();
  } catch (e) {
    return json({ error: 'No se pudo abrir el reporte de Garantías de PSA.' }, 502);
  }
  const g = (n: string) => {
    const m = htmlForm.match(new RegExp('name="' + n + '"\\s+value="([^"]*)"'));
    return m ? m[1] : '';
  };
  const centro = g('centro'), dipNum = g('dip'), clave = g('clave');
  const periodo = g('periodo') || (() => {
    const z = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
    return String(z.getMonth() + 1).padStart(2, '0') + '-' + z.getFullYear();
  })();
  if (!dipNum) return json({ error: 'La sesión PSA no reconoce a este distribuidor en el reporte de Garantías.' }, 502);

  // 4) Reporte completo (ordenado por serie) y búsqueda
  let htmlRep = '';
  try {
    const fd = new URLSearchParams();
    fd.set('idx', '88');
    fd.set('centro', centro);
    fd.set('dip', dipNum);
    fd.set('clave', clave);
    fd.set('periodo', periodo);
    fd.set('accion', 'consultar');
    fd.set('filtro_orden', '1');      // por N° de serie
    fd.set('filtro_ingresadas', '1'); // todas
    fd.set('filtro_incluir', '1');    // todas las garantías
    fd.set('filtro_mostrar_canjes', '0');
    fd.set('filtro_Cumpleaos', '1');
    const rr = await dipReq(DIP_EXEC, { method: 'POST', body: fd.toString() });
    htmlRep = await rr.text();
  } catch (e) {
    return json({ error: 'No se pudo bajar el reporte: ' + String((e as any)?.message || e) }, 502);
  }

  const filas = parsearGarantias(htmlRep);
  if (!filas.length) {
    if (body.action === 'report') return json({ ok: true, total: 0, filas: [] });
    return json({ ok: true, serie, encontrado: false, total: 0, aviso: 'El reporte no trajo garantías (¿cambió el formato de PSA?).' });
  }
  // action:'report' → la app baja la base completa UNA vez (al abrir la
  // cámara de Pendientes) y después busca en el teléfono al instante.
  if (body.action === 'report') {
    return json({
      ok: true,
      total: filas.length,
      filas: filas.map(f => ({ s: f.serie, u: f.usuario, t: f.telefono, d: f.domicilio, c: f.cp, l: f.localidad, p: f.producto, c2: f.compra, v: f.vence }))
    });
  }
  const hit = filas.find(f => f.serie === serie) || null;
  if (hit) {
    return json({ ok: true, serie, encontrado: true, total: filas.length, usuario: hit.usuario, telefono: hit.telefono, domicilio: hit.domicilio, cp: hit.cp, localidad: hit.localidad, producto: hit.producto, compra: hit.compra, vence: hit.vence });
  }
  // Tolerancia: prefijo/sufijo (errores de tipeo) si es único
  const fuzzy = filas.filter(f => serie.length >= 6 && (f.serie.startsWith(serie) || serie.startsWith(f.serie)));
  if (fuzzy.length === 1) {
    const f = fuzzy[0];
    return json({ ok: true, serie, serieReal: f.serie, encontrado: true, total: filas.length, usuario: f.usuario, telefono: f.telefono, domicilio: f.domicilio, cp: f.cp, localidad: f.localidad, producto: f.producto, compra: f.compra, vence: f.vence });
  }
  return json({ ok: true, serie, encontrado: false, total: filas.length, aviso: 'La serie no figura en tu base de garantías de PSA.' });
});
