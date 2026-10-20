#!/usr/bin/env node
/* ============================================================
   APPI · Actualizador del catálogo del Campus PSA
   ------------------------------------------------------------
   Ingresa a mi.psa.com.ar con las credenciales del distribuidor
   (env PSA_DIP_NUMERO / PSA_DIP_CLAVE, centro por defecto 02),
   hace SSO a campus.psa.com.ar y rastrea:

     · los 9 kits (secciones y clases, con el id del stream HLS)
     · las playlists de audio (paginadas)
     · la agenda de clases en vivo

   Escribe campus-catalogo.json en la raíz del repo. Si el parseo
   no alcanza los mínimos razonables, sale con error y NO deja
   un catálogo roto (el workflow no commitea nada).

   Uso:
     PSA_DIP_NUMERO=98020174 PSA_DIP_CLAVE=xxx node scripts/actualizar-campus-psa.mjs

   Cero dependencias: sólo Node 18+ (fetch nativo).
   ============================================================ */
import { readFileSync, writeFileSync, existsSync, renameSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'campus-catalogo.json');
const CAMPUS = 'https://campus.psa.com.ar';
const MI = 'https://mi.psa.com.ar';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

const CENTRO = process.env.PSA_DIP_CENTRO || '02';
const NUMERO = process.env.PSA_DIP_NUMERO || '';
const CLAVE = process.env.PSA_DIP_CLAVE || '';

// Salvaguarda: sin un catálogo mínimo no se publica nada.
const MIN_CLASES = 50;
const MIN_AUDIOS = 10;
const MIN_PLAYLISTS = 5;

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

/* ---------- utilidades ---------- */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function dec(s) {
  return String(s || '')
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

function log(...a) { console.log(new Date().toISOString().slice(11, 19), ...a); }

/* ---------- cookies por host ---------- */
class Jar {
  constructor() { this.map = new Map(); } // host -> { name: value }
  put(host, setCookies) {
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
  putFrom(res) {
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
  headerFor(url) {
    const host = new URL(url).hostname;
    const parts = [];
    // cookie del host exacto + de su dominio raíz si lo guardamos así
    for (const [h, cookies] of this.map) {
      if (host === h || host.endsWith('.' + h) || h.endsWith('.' + host)) {
        for (const [k, v] of Object.entries(cookies)) parts.push(k + '=' + v);
      }
    }
    return parts.join('; ');
  }
  has(name) {
    for (const h of this.map.values()) if (h[name]) return true;
    return false;
  }
}

const jar = new Jar();

async function get(url, opts = {}) {
  const headers = { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,*/*' };
  const ck = jar.headerFor(url);
  if (ck) headers.Cookie = ck;
  const res = await fetch(url, {
    ...opts,
    headers: { ...headers, ...(opts.headers || {}) },
    redirect: opts.redirect || 'follow',
  });
  jar.putFrom(res);
  return res;
}

async function getText(url) {
  const res = await get(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
  return res.text();
}

/* ---------- login MI PSA + SSO al Campus ---------- */
async function loginMiPsa() {
  const r1 = await get(MI + '/login');
  const html1 = await r1.text();
  const m = html1.match(/name="_csrf_token" value="([^"]+)"/);
  if (!m) throw new Error('No apareció el token CSRF en mi.psa.com.ar/login');
  const fd = new URLSearchParams();
  fd.set('_center', CENTRO);
  fd.set('_number', NUMERO);
  fd.set('_password', CLAVE);
  fd.set('_term_use', 'accept');
  fd.set('_csrf_token', m[1]);
  const r2 = await get(MI + '/login_check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: fd.toString(),
    redirect: 'manual',
  });
  const loc = r2.headers.get('location');
  if (loc) await get(new URL(loc, MI).href);
  if (!jar.has('psagw')) throw new Error('Login falló: no llegó la cookie psagw (¿clave correcta?)');
  const home = await (await get(MI + '/')).text();
  if (!home.includes('Mi PSA')) throw new Error('La sesión de mi.psa.com.ar no quedó activa');
  log('login mi.psa.com.ar OK');
}

async function ssoCampus() {
  // Cadena: GET campus/login → 302 mi.../apps/campus/login → 303 campus/login?p= → 302 /
  let url = CAMPUS + '/login';
  for (let hop = 0; hop < 8 && url; hop++) {
    const res = await get(url, { redirect: 'manual' });
    const loc = res.headers.get('location');
    log(`  sso hop${hop}: ${res.status} ${url.slice(0, 60)} → ${loc ? loc.slice(0, 60) : '(fin)'}`);
    if (!loc) break;
    url = new URL(loc, res.url).href;
  }
  const homeRes = await get(CAMPUS + '/');
  const home = await homeRes.text();
  log(`  sso home: ${homeRes.status} len=${home.length} session=${home.includes('psa-user-session-area')}`);
  if (!home.includes('psa-user-session-area')) throw new Error('SSO al Campus falló (sin sesión)');
  log('sso campus OK');
}

/* ---------- parsers ---------- */
function titleHeader(html) {
  const m = /<h3[^>]*class="titleHeaderPage"[^>]*>([\s\S]*?)<\/h3>/.exec(html);
  return m ? dec(m[1]) : '';
}

/** Título de página interna: "Kit > Sección" → "Sección". */
function tituloSeccion(header) {
  if (!header) return '';
  return header.includes('>') ? header.split('>').pop().trim() : header;
}

function parseKit(html) {
  const titulo = titleHeader(html).split('|')[0].trim();
  const secciones = [];
  const re = /<li>\s*<a href="(\/(?:tematica\/listadoclases|kit\/[^"]+\/curso)\/[^"]+)"\s+class="linkBox\s+psa-main-content-campus-kit-(thematic|course)-link"/g;
  let m;
  while ((m = re.exec(html))) {
    const url = m[1];
    const tipo = m[2] === 'thematic' ? 'tematica' : 'curso';
    // el título del bloque vive en el <p class="psa-text-center"> anterior más cercano
    const antes = html.lastIndexOf('<p class="psa-text-center">', m.index);
    let tituloSec = '';
    if (antes >= 0 && m.index - antes < 2500) {
      const fin = html.indexOf('</p>', antes); // el </p> es ANTES del link
      if (fin > antes && fin - antes < 500) tituloSec = dec(html.slice(antes + 27, fin));
    }
    secciones.push({ url, tipo, titulo: tituloSec });
  }
  return { titulo, secciones };
}

/**
 * Clases de una sección. Dos formatos en el Campus:
 *   · curso:     <a href="/curso/.../video/..."> envuelve el bloque (href → p)
 *   · temática:  el <p> del bloque y después el href en actionButtons (p → href)
 * Se parsean los dos y se ordenan por posición para no desalinear título/URL.
 */
function parseListado(html) {
  const titulo = tituloSeccion(titleHeader(html));
  const items = [];
  let m;
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

function parseVideo(html) {
  const m = /videoUrl\d*\s*=\s*"(?:https?:)?(\/\/[^"]+\/(V_\d+)\/playlist\.m3u8)"/.exec(html);
  if (m) return { stream: m[2], src: m[0].includes('https:') ? 'https:' + m[1] : m[1] };
  const m2 = /(\/\/[^"']+\/(V_\d+)\/playlist\.m3u8)/.exec(html);
  return m2 ? { stream: m2[2], src: 'https:' + m2[1] } : null;
}

function parseAudios(html) {
  const audios = [];
  const re = /data-title="([^"]*)"[\s\S]{0,900}?data-audio-id="(\d+)"[\s\S]{0,900}?Audios\/HLS\/(A_\d+)\/playlist\.m3u8/g;
  let m;
  while ((m = re.exec(html))) {
    audios.push({ titulo: dec(m[1]), audioId: +m[2], stream: m[3] });
  }
  return audios;
}

function maxPage(html) {
  let max = 1;
  const re = /[?&]page=(\d+)/g;
  let m;
  while ((m = re.exec(html))) max = Math.max(max, +m[1]);
  return Math.min(max, 20); // tope sanitario
}

function parsePlaylistsIndex(html) {
  const listas = [];
  const re = /<a href="(\/playlist\/[^"]+)">[\s\S]*?playlist-title">[^<:]*:\s*([^<]*)<\/p>[\s\S]*?playlist-description">([\s\S]*?)<\/p>/g;
  let m;
  while ((m = re.exec(html))) {
    listas.push({ slug: m[1].split('/').pop(), titulo: dec(m[2]), descripcion: dec(m[3]) });
  }
  return listas;
}

function parseVivo(html) {
  const vivo = [];
  const re = /<div class="boxList card-audio">\s*<div class="widget">\s*<div class="sectorTitle">\s*<i[^>]*><\/i>\s*<p>([^<]*)<\/p>[\s\S]*?Fecha Inicio\s*:\s*([^<]+)<\/p>[\s\S]*?Fecha Fin\s*:\s*([^<]+)<\/p>[\s\S]*?sector info[^>]*>\s*<p>([^<]*)<\/p>/g;
  let m;
  while ((m = re.exec(html))) {
    vivo.push({ equipo: dec(m[1]), inicio: dec(m[2]), fin: dec(m[3]), titulo: dec(m[4]) });
  }
  return vivo;
}

/* ---------- fetch con reutilización de streams ---------- */
function cargarAnterior() {
  try {
    if (!existsSync(OUT)) return { clases: new Map(), audios: new Map() };
    const prev = JSON.parse(readFileSync(OUT, 'utf8'));
    const clases = new Map();
    const audios = new Map();
    for (const k of prev.kits || []) for (const s of k.secciones || []) for (const c of s.clases || []) {
      if (c.url && c.stream) clases.set(c.url, c);
    }
    for (const p of prev.playlists || []) for (const a of p.audios || []) {
      if (a.audioId && a.stream) audios.set(a.audioId, a);
    }
    return { clases, audios };
  } catch (_) { return { clases: new Map(), audios: new Map() }; }
}

async function pool(items, limit, fn) {
  const out = [];
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return out;
}

/* ---------- crawl principal ---------- */
async function main() {
  if (!NUMERO || !CLAVE) {
    console.error('Faltan PSA_DIP_NUMERO y PSA_DIP_CLAVE en el entorno.');
    process.exit(1);
  }
  await loginMiPsa();
  await ssoCampus();

  const anterior = cargarAnterior();
  const kits = [];
  let totalClases = 0;

  for (const kit of KITS) {
    const kitUrl = CAMPUS + '/kit/' + kit.slug;
    const kitHtml = await getText(kitUrl);
    await sleep(120);
    const { titulo, secciones } = parseKit(kitHtml);
    log(`kit ${kit.slug}: ${secciones.length} secciones`);
    const seccionesOut = [];
    for (const sec of secciones) {
      const secUrl = sec.url.startsWith('http') ? sec.url : CAMPUS + sec.url;
      const secHtml = await getText(secUrl);
      await sleep(120);
      const { titulo: secTitulo, clases } = parseListado(secHtml);
      seccionesOut.push({
        id: (sec.url.match(/listadoclases\/(\d+)/) || [, sec.url.replace(/\/$/, '').split('/').pop()])[1],
        tipo: sec.tipo,
        titulo: secTitulo || sec.titulo,
        url: sec.url,
        clases: clases.map((c) => ({ ...c })),
      });
      totalClases += clases.length;
    }
    kits.push({
      slug: kit.slug,
      id: kit.id,
      titulo: titulo || kit.titulo,
      url: '/kit/' + kit.slug,
      secciones: seccionesOut,
    });
  }

  // Batches de páginas de video para resolver el id del stream HLS (V_xxxxx).
  // Si la clase ya fue vista en un catálogo anterior, se reutiliza el stream.
  const pendientes = [];
  for (const k of kits) for (const s of k.secciones) for (const c of s.clases) {
    const prev = anterior.clases.get(c.url);
    if (prev && prev.stream) c.stream = prev.stream;
    else pendientes.push(c);
  }
  log(`streams de video: ${pendientes.length} por resolver (${totalClases - pendientes.length} reutilizados)`);
  await pool(pendientes, 3, async (c) => {
    for (let intento = 1; intento <= 2; intento++) {
      try {
        const html = await getText(CAMPUS + c.url);
        const v = parseVideo(html);
        if (v) c.stream = v.stream;
        else log(`sin stream para ${c.url}`);
        break;
      } catch (e) {
        if (intento === 2) log(`error video ${c.url}: ${e.message}`);
        else await sleep(1200);
      }
    }
    await sleep(120);
  });

  // Playlists de audio (índice + detalle paginado)
  const idxHtml = await getText(CAMPUS + '/playlist');
  const listas = parsePlaylistsIndex(idxHtml);
  await sleep(120);
  log(`playlists: ${listas.length}`);
  for (const lista of listas) {
    const audios = [];
    const base = CAMPUS + '/playlist/' + lista.slug;
    const html1 = await getText(base);
    const paginas = maxPage(html1);
    const paginasHtml = [html1];
    for (let p = 2; p <= paginas; p++) {
      paginasHtml.push(await getText(base + '?page=' + p));
      await sleep(120);
    }
    for (const html of paginasHtml) audios.push(...parseAudios(html));
    // de-duplicar por audioId
    const seen = new Set();
    lista.audios = audios.filter((a) => (seen.has(a.audioId) ? false : (seen.add(a.audioId), true)));
    log(`  playlist ${lista.slug}: ${lista.audios.length} audios`);
  }

  // Biblioteca de audios transmitidos (misma estructura; aporta cobertura extra)
  try {
    const biblioHtml = await getText(CAMPUS + '/audio/transmitidos');
    const extra = parseAudios(biblioHtml);
    const conocidos = new Set();
    for (const l of listas) for (const a of l.audios) conocidos.add(a.audioId);
    const nuevos = extra.filter((a) => !conocidos.has(a.audioId));
    if (nuevos.length) {
      listas.push({
        slug: 'biblioteca-transmitidos',
        titulo: 'Biblioteca de audios transmitidos',
        descripcion: 'Audios sueltos de transmisiones anteriores.',
        audios: nuevos,
      });
      log(`  biblioteca: ${nuevos.length} audios extra`);
    }
  } catch (e) {
    log(`biblioteca de audios: ${e.message}`);
  }

  // Agenda de vivo (próximas)
  const vivo = [];
  for (const path of ['/proximas-clases-en-vivo', '/clases-en-vivo']) {
    try {
      const html = await getText(CAMPUS + path);
      vivo.push(...parseVivo(html));
    } catch (e) {
      log(`vivo ${path}: ${e.message}`);
    }
    await sleep(120);
  }
  const vivoSeen = new Set();
  const vivoUnico = vivo.filter((v) => {
    const k = v.equipo + '|' + v.inicio + '|' + v.titulo;
    return vivoSeen.has(k) ? false : (vivoSeen.add(k), true);
  });
  log(`vivo: ${vivoUnico.length} transmisiones`);

  const totalAudios = listas.reduce((n, l) => n + l.audios.length, 0);

  // Salvaguarda: no publicar un catálogo roto.
  const problemas = [];
  if (totalClases < MIN_CLASES) problemas.push(`sólo ${totalClases} clases (mínimo ${MIN_CLASES})`);
  if (totalAudios < MIN_AUDIOS) problemas.push(`sólo ${totalAudios} audios (mínimo ${MIN_AUDIOS})`);
  if (listas.length < MIN_PLAYLISTS) problemas.push(`sólo ${listas.length} playlists (mínimo ${MIN_PLAYLISTS})`);
  if (problemas.length) {
    console.error('Catálogo incompleto, NO se escribe el JSON: ' + problemas.join('; '));
    process.exit(1);
  }

  const catalogo = {
    version: 1,
    generado: new Date().toISOString(),
    fuente: 'campus.psa.com.ar',
    kits,
    playlists: listas,
    vivo: vivoUnico,
    stats: {
      kits: kits.length,
      secciones: kits.reduce((n, k) => n + k.secciones.length, 0),
      clases: totalClases,
      conStream: kits.reduce((n, k) => n + k.secciones.reduce((m, s) => m + s.clases.filter((c) => c.stream).length, 0), 0),
      playlists: listas.length,
      audios: totalAudios,
      vivo: vivoUnico.length,
    },
  };
  const tmp = OUT + '.tmp';
  writeFileSync(tmp, JSON.stringify(catalogo, null, 1));
  renameSync(tmp, OUT);
  log(`OK → campus-catalogo.json (${catalogo.stats.clases} clases, ${catalogo.stats.conStream} con stream, ${catalogo.stats.audios} audios, ${catalogo.stats.vivo} vivo)`);
}

main().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
