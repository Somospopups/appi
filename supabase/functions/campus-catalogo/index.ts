// APPI · Catálogo del Campus PSA rastreado con la cuenta de cada usuario.
//
// v644: el catálogo deja de vivir en campus-catalogo.json (que era de una
// sola cuenta) y pasa a rastrearse ACÁ, con las credenciales MI PSA que el
// usuario ya guardó en la app (sección MI PSA). El resultado se guarda en
// la tabla compartida appi_campus_cache:
//
//   · < 12 h → se devuelve de una (todos leen rápido).
//   · vencido → el primero que lo pide lo refresca con SU sesión y todos
//     quedan al día. Nunca hay una cuenta fija del repo.
//
// Se rastrea sólo metadatos + streams ya conocidos:
//   · kits → secciones → clases (título/autor/duración/url), y el stream
//     HLS sólo de las clases nuevas (se reutiliza el mapa anterior).
//   · playlists de audio + Biblioteca de transmitidos (sus A_ ya vienen).
//
// v652: NO se rastrea la agenda de "próximas clases en vivo": esa página del
// Campus lista las reuniones internas de los equipos (otros equipos), que no
// corresponden publicar en APPI. El Vivo PSA se ubica por fecha en el cliente.
//
// Si el rastreo no alcanza los mínimos o se corta, se devuelve la última
// copia buena (stale) en vez de publicar un catálogo roto.
//
// POST /functions/v1/campus-catalogo
// body: { center: "02", number: "98020174", password: "..." }
// resp: { ok, cat, actualizado, cached, stale?, aviso? }

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
const CAMPUS = 'https://campus.psa.com.ar';

const CLAVE_CACHE = 'catalogo';
const TTL_OK_MS = 12 * 3600 * 1000;      // catálogo completo: 12 horas
const TTL_PEND_MS = 5 * 60 * 1000;       // le faltan streams/secciones: 5 minutos
const DEADLINE_MS = 70_000;              // techo del rastreo dentro de una invocación
const MIN_CLASES = 50;
const MIN_AUDIOS = 10;
const MIN_PLAYLISTS = 5;
const MIN_SECCIONES = 55;

const KITS = [
  { slug: 'programa-de-capacitacion-basica', titulo: 'Capacitación Básica', id: 8 },
  { slug: 'productos-psa', titulo: 'Productos PSA', id: 4 },
  { slug: 'comercializacion', titulo: 'Comercialización', id: 23 },
  { slug: 'crecimiento-empresarial', titulo: 'Crecimiento Empresarial', id: 12 },
  { slug: 'posventa', titulo: 'Posventa', id: 21 },
  { slug: 'autoliderazgo', titulo: 'Autoliderazgo', id: 3 },
  { slug: 'sustentabilidad', titulo: 'Sustentabilidad', id: 1 },
  { slug: 'eventos-de-formacion-psa', titulo: 'Eventos de Formación PSA', id: 15 },
  { slug: 'dip-tecnico', titulo: 'DIP Técnico', id: 16 },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function dec(s: unknown): string {
  return String(s ?? '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&aacute;/gi, 'á').replace(/&eacute;/gi, 'é')
    .replace(/&iacute;/gi, 'í').replace(/&oacute;/gi, 'ó')
    .replace(/&uacute;/gi, 'ú').replace(/&ntilde;/gi, 'ñ')
    .replace(/&Aacute;/gi, 'Á').replace(/&Eacute;/gi, 'É')
    .replace(/&Iacute;/gi, 'Í').replace(/&Oacute;/gi, 'Ó')
    .replace(/&Uacute;/gi, 'Ú').replace(/&Ntilde;/gi, 'Ñ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/\s+/g, ' ')
    .trim();
}

/* ---------- cookies por host (port del crawler del repo) ---------- */
class Jar {
  map = new Map<string, Record<string, string>>();
  put(host: string, setCookies?: string | string[] | null) {
    if (!setCookies) return;
    const arr = typeof setCookies === 'string' ? [setCookies] : setCookies;
    let h = this.map.get(host);
    if (!h) { h = {}; this.map.set(host, h); }
    for (const c of arr) {
      const [par] = c.split(';');
      const i = par.indexOf('=');
      if (i > 0) h[par.slice(0, i).trim()] = par.slice(i + 1).trim();
    }
  }
  putFrom(res: Response) {
    const sc = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
    for (const c of sc) {
      const dm = /domain=([^;]+)/i.exec(c);
      let host = new URL(res.url).hostname;
      if (dm) {
        const d = dm[1].trim().replace(/^\./, '');
        if (host === d || host.endsWith('.' + d)) host = d;
      }
      this.put(host, c);
    }
  }
  headerFor(url: string): string {
    const host = new URL(url).hostname;
    const parts: string[] = [];
    for (const [h, cookies] of this.map) {
      if (host === h || host.endsWith('.' + h) || h.endsWith('.' + host)) {
        for (const [k, v] of Object.entries(cookies)) parts.push(k + '=' + v);
      }
    }
    return parts.join('; ');
  }
  has(name: string): boolean {
    for (const h of this.map.values()) if (h[name]) return true;
    return false;
  }
}

async function get(jar: Jar, url: string, opts: RequestInit & { redirect?: RequestRedirect } = {}): Promise<Response> {
  const headers: Record<string, string> = { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,*/*' };
  const ck = jar.headerFor(url);
  if (ck) headers.Cookie = ck;
  const res = await fetch(url, {
    ...opts,
    headers: { ...headers, ...((opts.headers as Record<string, string>) || {}) },
    redirect: opts.redirect || 'follow',
  });
  jar.putFrom(res);
  return res;
}

async function getText(jar: Jar, url: string): Promise<string> {
  const res = await get(jar, url);
  if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
  return res.text();
}

/* ---------- login MI PSA (mismo flujo que consulta-serial) ---------- */
async function loginMiPsa(jar: Jar, center: string, number: string, password: string): Promise<boolean> {
  const r1 = await get(jar, MI + '/login');
  const html1 = await r1.text();
  const m = html1.match(/name="_csrf_token" value="([^"]+)"/);
  if (!m) return false;
  const fd = new URLSearchParams();
  fd.set('_center', center);
  fd.set('_number', number);
  fd.set('_password', password);
  fd.set('_term_use', 'accept');
  fd.set('_csrf_token', m[1]);
  const r2 = await get(jar, MI + '/login_check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: fd.toString(),
    redirect: 'manual',
  });
  const loc = r2.headers.get('location');
  if (loc) await get(jar, new URL(loc, MI).href);
  if (!jar.has('psagw')) return false;
  const home = await (await get(jar, MI + '/')).text();
  return home.includes('Mi PSA');
}

/* ---------- SSO al Campus (cadena verificada en el crawler) ---------- */
async function ssoCampus(jar: Jar): Promise<boolean> {
  let url = CAMPUS + '/login';
  for (let hop = 0; hop < 8 && url; hop++) {
    const res = await get(jar, url, { redirect: 'manual' });
    const loc = res.headers.get('location');
    if (!loc) break;
    url = new URL(loc, res.url).href;
  }
  try {
    const home = await getText(jar, CAMPUS + '/');
    return home.includes('psa-user-session-area');
  } catch (_) {
    return false;
  }
}

/* ---------- parsers (port exacto del script del repo) ---------- */
function titleHeader(html: string): string {
  const m = /<h3[^>]*class="titleHeaderPage"[^>]*>([\s\S]*?)<\/h3>/.exec(html);
  return m ? dec(m[1]) : '';
}

function tituloSeccion(header: string): string {
  if (!header) return '';
  return header.includes('>') ? header.split('>').pop()!.trim() : header;
}

function parseKit(html: string): { titulo: string; secciones: { url: string; tipo: string; titulo: string }[] } {
  const titulo = titleHeader(html).split('|')[0].trim();
  const secciones: { url: string; tipo: string; titulo: string }[] = [];
  const re = /<li>\s*<a href="(\/(?:tematica\/listadoclases|kit\/[^"]+\/curso)\/[^"]+)"\s+class="linkBox\s+psa-main-content-campus-kit-(thematic|course)-link"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const url = m[1];
    const tipo = m[2] === 'thematic' ? 'tematica' : 'curso';
    const antes = html.lastIndexOf('<p class="psa-text-center">', m.index);
    let tituloSec = '';
    if (antes >= 0 && m.index - antes < 2500) {
      const fin = html.indexOf('</p>', antes);
      if (fin > antes && fin - antes < 500) tituloSec = dec(html.slice(antes + 27, fin));
    }
    secciones.push({ url, tipo, titulo: tituloSec });
  }
  return { titulo, secciones };
}

function parseListado(html: string): { titulo: string; clases: { titulo: string; autor: string; duracion: string; url: string }[] } {
  const titulo = tituloSeccion(titleHeader(html));
  const items: { pos: number; url: string; titulo: string; meta: string }[] = [];
  let m: RegExpExecArray | null;
  const reA = /href="(\/curso\/[^"]+\/video\/[^"]+)"[\s\S]{0,800}?<p class="psa-text-center">([\s\S]*?)<span class="class">([\s\S]*?)<\/span>/g;
  while ((m = reA.exec(html))) items.push({ pos: m.index, url: m[1], titulo: m[2], meta: m[3] });
  const reB = /<p class="psa-text-center">([\s\S]*?)<span class="class">([\s\S]*?)<\/span>[\s\S]{0,800}?href="(\/tematica\/[^"]+\/video\/[^"]+)"/g;
  while ((m = reB.exec(html))) items.push({ pos: m.index, url: m[3], titulo: m[1], meta: m[2] });
  items.sort((a, b) => a.pos - b.pos);
  const clases = items.map((it) => {
    const meta = dec(it.meta);
    const dm = /\((\d{1,2}:\d{2})\)\s*$/.exec(meta);
    const duracion = dm ? dm[1] : '';
    const autor = dec(meta.replace(/\s*\(\d{1,2}:\d{2}\)\s*$/, ''));
    return { titulo: dec(it.titulo), autor, duracion, url: it.url };
  });
  return { titulo, clases };
}

function parseVideo(html: string): string | null {
  const m = /videoUrl\d*\s*=\s*"(?:https?:)?(\/\/[^"]+\/(V_\d+)\/playlist\.m3u8)"/.exec(html);
  if (m) return m[2];
  const m2 = /(\/\/[^"']+\/(V_\d+)\/playlist\.m3u8)/.exec(html);
  return m2 ? m2[2] : null;
}

function parseAudios(html: string): { titulo: string; audioId: number; stream: string }[] {
  const audios: { titulo: string; audioId: number; stream: string }[] = [];
  const re = /data-title="([^"]*)"[\s\S]{0,900}?data-audio-id="(\d+)"[\s\S]{0,900}?Audios\/HLS\/(A_\d+)\/playlist\.m3u8/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) audios.push({ titulo: dec(m[1]), audioId: +m[2], stream: m[3] });
  return audios;
}

function maxPage(html: string): number {
  let max = 1;
  const re = /[?&]page=(\d+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) max = Math.max(max, +m[1]);
  return Math.min(max, 20);
}

function parsePlaylistsIndex(html: string): { slug: string; titulo: string; descripcion: string }[] {
  const listas: { slug: string; titulo: string; descripcion: string }[] = [];
  const re = /<a href="(\/playlist\/[^"]+)">[\s\S]*?playlist-title">[^<:]*:\s*([^<]*)<\/p>[\s\S]*?playlist-description">([\s\S]*?)<\/p>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) listas.push({ slug: m[1].split('/').pop()!, titulo: dec(m[2]), descripcion: dec(m[3]) });
  return listas;
}

/* ---------- rastreo ---------- */
async function pool<T, R>(items: T[], limit: number, fn: (item: T, idx: number) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, Math.max(1, items.length)) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return out;
}

/** Mapa url→stream del catálogo anterior (sólo se resuelven los nuevos). */
function streamsAnteriores(catAnterior: unknown): Map<string, string> {
  const mapa = new Map<string, string>();
  const cat = catAnterior as { kits?: { secciones?: { clases?: { url?: string; stream?: string }[] }[] }[] } | null;
  for (const k of cat?.kits || []) for (const s of k.secciones || []) for (const c of s.clases || []) {
    if (c.url && c.stream) mapa.set(c.url, c.stream);
  }
  return mapa;
}

function statsDe(kits: any[], listas: any[]) {
  const secciones = kits.reduce((n, k) => n + k.secciones.length, 0);
  const clases = kits.reduce((n, k) => n + k.secciones.reduce((m: number, s: any) => m + s.clases.length, 0), 0);
  const conStream = kits.reduce((n, k) => n + k.secciones.reduce((m: number, s: any) => m + s.clases.filter((c: any) => c.stream).length, 0), 0);
  const audios = listas.reduce((n: number, l: any) => n + l.audios.length, 0);
  return { kits: kits.length, secciones, clases, conStream, playlists: listas.length, audios };
}

function completo(cat: any): boolean {
  const s = cat && cat.stats;
  return !!(s && s.secciones >= MIN_SECCIONES && s.conStream >= s.clases);
}

function valido(cat: any): boolean {
  const s = cat && cat.stats;
  return !!(s && s.clases >= MIN_CLASES && s.audios >= MIN_AUDIOS && s.playlists >= MIN_PLAYLISTS);
}

async function rastrear(jar: Jar, catAnterior: unknown, hasta: number): Promise<{ cat: any; motivos: string[] }> {
  const motivos: string[] = [];
  const anterior = streamsAnteriores(catAnterior);

  // 1) Kits (páginas de índice)
  const kitsBase = await pool(KITS, 3, async (kit) => {
    const kitHtml = await getText(jar, CAMPUS + '/kit/' + kit.slug);
    await sleep(40);
    const { titulo, secciones } = parseKit(kitHtml);
    return { ...kit, titulo: titulo || kit.titulo, secciones };
  });

  // 2) Secciones (listados de clases) en paralelo
  interface SecPlan { kitIdx: number; url: string; tipo: string; titulo: string }
  const plan: SecPlan[] = [];
  kitsBase.forEach((k, kitIdx) => k.secciones.forEach((s) => plan.push({ kitIdx, url: s.url, tipo: s.tipo, titulo: s.titulo })));
  const secs = await pool(plan, 4, async (p) => {
    if (Date.now() > hasta) return null;
    try {
      const secUrl = p.url.startsWith('http') ? p.url : CAMPUS + p.url;
      const secHtml = await getText(jar, secUrl);
      await sleep(40);
      const { titulo, clases } = parseListado(secHtml);
      return { ...p, titulo: titulo || p.titulo, clases };
    } catch (_) { return null; }
  });

  const kits: any[] = kitsBase.map((k, kitIdx) => ({
    slug: k.slug,
    id: k.id,
    titulo: k.titulo,
    url: '/kit/' + k.slug,
    secciones: [] as any[],
  }));
  let seccionesOk = 0;
  secs.forEach((s) => {
    if (!s) return;
    seccionesOk++;
    kits[s.kitIdx].secciones.push({
      id: (s.url.match(/listadoclases\/(\d+)/) || [, s.url.replace(/\/$/, '').split('/').pop()])[1],
      tipo: s.tipo,
      titulo: s.titulo,
      url: s.url,
      clases: s.clases,
    });
  });
  if (seccionesOk < plan.length) motivos.push(`${plan.length - seccionesOk} secciones sin leer`);

  // 3) Streams: sólo las clases nuevas (las viejas salen del mapa anterior)
  const pendientes: { url: string; set: (s: string) => void }[] = [];
  for (const k of kits) for (const s of k.secciones) for (const c of s.clases) {
    const prev = anterior.get(c.url);
    if (prev) c.stream = prev;
    else pendientes.push({ url: c.url, set: (v) => { c.stream = v; } });
  }
  await pool(pendientes, 6, async (p) => {
    if (Date.now() > hasta) return;
    for (let intento = 1; intento <= 2; intento++) {
      try {
        const html = await getText(jar, CAMPUS + p.url);
        const v = parseVideo(html);
        if (v) p.set(v);
        break;
      } catch (_) {
        if (intento === 2) motivos.push(`stream sin resolver: ${p.url}`);
        else await sleep(800);
      }
    }
    await sleep(40);
  });

  // 4) Playlists de audio (índice + detalle paginado)
  const idxHtml = await getText(jar, CAMPUS + '/playlist');
  const listas = parsePlaylistsIndex(idxHtml);
  await pool(listas, 3, async (lista) => {
    const base = CAMPUS + '/playlist/' + lista.slug;
    const audios: { titulo: string; audioId: number; stream: string }[] = [];
    const html1 = await getText(jar, base);
    const paginas = maxPage(html1);
    const paginasHtml = [html1];
    for (let p = 2; p <= paginas; p++) {
      paginasHtml.push(await getText(jar, base + '?page=' + p));
      await sleep(40);
    }
    for (const html of paginasHtml) audios.push(...parseAudios(html));
    const seen = new Set<number>();
    lista.audios = audios.filter((a) => (seen.has(a.audioId) ? false : (seen.add(a.audioId), true)));
  });

  // Biblioteca de audios transmitidos: cobertura extra de lo emitido en vivo
  try {
    const biblioHtml = await getText(jar, CAMPUS + '/audio/transmitidos');
    const extra = parseAudios(biblioHtml);
    const conocidos = new Set<number>();
    for (const l of listas) for (const a of l.audios) conocidos.add(a.audioId);
    const nuevos = extra.filter((a) => !conocidos.has(a.audioId));
    if (nuevos.length) {
      listas.push({ slug: 'biblioteca-transmitidos', titulo: 'Biblioteca de audios transmitidos', descripcion: 'Audios sueltos de transmisiones anteriores.', audios: nuevos });
    }
  } catch (_) { /* sin biblioteca sigue el resto */ }

  const cat = {
    version: 1,
    generado: new Date().toISOString(),
    fuente: 'campus.psa.com.ar',
    kits,
    playlists: listas,
    stats: statsDe(kits, listas),
  };
  if (!valido(cat)) {
    if (cat.stats.clases < MIN_CLASES) motivos.push(`sólo ${cat.stats.clases} clases`);
    if (cat.stats.audios < MIN_AUDIOS) motivos.push(`sólo ${cat.stats.audios} audios`);
    if (cat.stats.playlists < MIN_PLAYLISTS) motivos.push(`sólo ${cat.stats.playlists} playlists`);
  }
  return { cat, motivos };
}

/* ---------- handler ---------- */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRole) return json({ error: 'Servicio no configurado.' }, 503);
  const supabase = createClient(supabaseUrl, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } });

  // Auth: distribuidor activo (mismo criterio que consulta-serial)
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
  const center = String(body.center || '').trim();
  const number = String(body.number || '').trim().replace(/^0+/, '');
  const password = String(body.password || '');
  if (!center || !number || !password) {
    return json({ error: 'Faltan tus datos de MI PSA. Cargalos en APPI (Ajustes → MI PSA) para armar tu Campus.' }, 400);
  }

  // Caché compartida en la nube
  let catPrev: any = null;
  let actualizadoPrev: string | null = null;
  try {
    const { data } = await supabase.from('appi_campus_cache').select('json, actualizado').eq('clave', CLAVE_CACHE).maybeSingle();
    if (data && data.json) { catPrev = data.json; actualizadoPrev = data.actualizado; }
  } catch (_) { /* sin caché se rastrea igual */ }

  if (catPrev && actualizadoPrev) {
    const ttl = completo(catPrev) ? TTL_OK_MS : TTL_PEND_MS;
    if (Date.now() - Date.parse(actualizadoPrev) < ttl) {
      return json({ ok: true, cat: catPrev, actualizado: actualizadoPrev, cached: true });
    }
  }

  try {
    const jar = new Jar();
    let loginOk = false;
    try { loginOk = await loginMiPsa(jar, center, number, password); }
    catch (e) { return json({ error: 'No se pudo conectar con PSA: ' + String((e as any)?.message || e) }, 502); }
    if (!loginOk) return json({ error: 'No se pudo entrar a mi.psa.com.ar con esos datos (¿clave correcta?).' }, 401);

    let ssoOk = false;
    try { ssoOk = await ssoCampus(jar); }
    catch (_) { ssoOk = false; }
    if (!ssoOk) return json({ error: 'La sesión no habilitó el Campus PSA para este distribuidor.' }, 502);

    const { cat, motivos } = await rastrear(jar, catPrev, Date.now() + DEADLINE_MS);

    if (valido(cat)) {
      const actualizado = new Date().toISOString();
      try {
        await supabase.from('appi_campus_cache').upsert({ clave: CLAVE_CACHE, json: cat, actualizado }, { onConflict: 'clave' });
      } catch (_) { /* aunque no se pueda guardar, el catálogo sirve */ }
      return json({ ok: true, cat, actualizado, cached: false });
    }
    if (catPrev) return json({ ok: true, cat: catPrev, actualizado: actualizadoPrev, cached: true, stale: true, aviso: 'Rastreo incompleto: ' + motivos.join('; ') });
    return json({ error: 'El rastreo del Campus no alcanzó los mínimos: ' + motivos.join('; ') }, 502);
  } catch (e) {
    if (catPrev) return json({ ok: true, cat: catPrev, actualizado: actualizadoPrev, cached: true, stale: true });
    return json({ error: 'No se pudo rastrear el Campus ahora: ' + String((e as any)?.message || e) }, 502);
  }
});
