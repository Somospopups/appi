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

// Enlaces directos confirmados en Autoconsulta WEB. PSA permite recuperar
// períodos que ya no aparecen en sus selectores cambiando solamente AAAA-MM.
// Se conservan el discovery y los overrides como respaldo si PSA cambia un idx.
const HISTORICAL_DIRECT_REPORTS = {
  linea: { idx: '69', consulta: 'Línea_Descendente_' },
  garantiasOrg: { idx: '34', consulta: 'Garantías_por_Organización' },
  ingresos: { idx: '71', consulta: 'Patrocinios_por_Organización_' },
} as const;
type HistoricalDirectKey = keyof typeof HISTORICAL_DIRECT_REPORTS;

function normSerie(s: string): string {
  return String(s || '').replace(/\s+/g, '').toUpperCase();
}

type Jar = Record<string, string>;

/*
 * Deno/Undici no siempre expone Set-Cookie de la misma manera: en algunas
 * versiones existe getSetCookie(), mientras que en otras sólo queda el
 * header combinado. Si perdemos la cookie psagw en el primer redirect, el
 * login de todos los distribuidores parece fallar aunque la clave sea
 * correcta. Mantener el fallback acá evita depender de una versión puntual
 * del runtime de Supabase.
 */
function splitSetCookieHeader(raw: string): string[] {
  return String(raw || '').split(/,(?=\s*[^;,=\s]+\s*=)/g).map(v => v.trim()).filter(Boolean);
}
function setCookieValues(h: Headers): string[] {
  try {
    const getter = (h as Headers & { getSetCookie?: () => string[] }).getSetCookie;
    if (typeof getter === 'function') {
      const values = getter.call(h);
      if (Array.isArray(values) && values.length) return values;
    }
  } catch (_) {}
  const raw = h.get('set-cookie') || h.get('set-cookie2') || '';
  return splitSetCookieHeader(raw);
}
function putCookies(h: Headers, jar: Jar) {
  for (const c of setCookieValues(h)) {
    const [par] = c.split(';');
    const i = par.indexOf('=');
    if (i > 0) jar[par.slice(0, i).trim()] = par.slice(i + 1).trim();
  }
}
const cookieH = (jar: Jar) => Object.entries(jar).map(([k, v]) => k + '=' + v).join('; ');

function inputValue(html: string, name: string): string {
  const inputs = html.match(/<input\b[^>]*>/gi) || [];
  for (const input of inputs) {
    const nm = input.match(/\bname\s*=\s*["']([^"']+)["']/i);
    if (!nm || nm[1] !== name) continue;
    const value = input.match(/\bvalue\s*=\s*["']([^"']*)["']/i);
    return value ? value[1] : '';
  }
  return '';
}
function formAction(html: string, fallback: string): string {
  const form = html.match(/<form\b[^>]*>/i)?.[0] || '';
  const action = form.match(/\baction\s*=\s*["']([^"']+)["']/i)?.[1];
  return action || fallback;
}
function isLoginPage(html: string): boolean {
  return /<form\b[^>]*(?:action\s*=\s*["'][^"']*login|name\s*=\s*["']formKey["'])/i.test(String(html || ''))
    && /(?:name|id)\s*=\s*["']_?password["']/i.test(String(html || ''));
}
function isLoginUrl(url: string): boolean {
  try { return /\/login(?:[/?#]|$)/i.test(new URL(url).pathname); }
  catch (_) { return /\/login(?:[/?#]|$)/i.test(String(url || '')); }
}
function psaDigits(value: unknown): string {
  return String(value ?? '').replace(/\D/g, '');
}
function normalizePSACenter(value: unknown): string {
  return psaDigits(value).slice(-2).padStart(2, '0');
}
function normalizePSANumber(value: unknown): string {
  const digits = psaDigits(value);
  return digits.length > 8 ? digits.slice(-8) : digits.padStart(8, '0');
}

/**
 * Login en mi.psa.com.ar → cookies de la sesión (psagw).
 * IMPORTANTE: la cookie de sesión se setea en la respuesta 302 de
 * /login_check; con redirect:'manual' la capturamos (undici la pierde
 * al seguir el redirect solo).
 */
async function loginPSA(center: string, number: string, password: string): Promise<Jar | null> {
  const mi: Jar = {};
  const getHeaders = () => ({ 'User-Agent': UA, Cookie: cookieH(mi) });
  const r1 = await fetch(MI + '/login', { headers: { 'User-Agent': UA }, redirect: 'manual' });
  putCookies(r1.headers, mi);
  const html1 = await r1.text();
  const csrf = inputValue(html1, '_csrf_token');
  if (!csrf) return null;

  const fd = new URLSearchParams();
  fd.set('_center', String(center || '').trim());
  fd.set('_number', String(number || '').trim());
  fd.set('_password', String(password || ''));
  fd.set('_term_use', 'accept');
  fd.set('_csrf_token', csrf);
  const action = new URL(formAction(html1, '/login_check'), MI).href;
  let current = action;
  let response = await fetch(current, {
    method: 'POST',
    headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded', Cookie: cookieH(mi) },
    body: fd.toString(),
    redirect: 'manual'
  });
  putCookies(response.headers, mi);

  // PSA responde también con 302 → /login cuando la clave no coincide. El
  // código anterior sólo comprobaba que existiera psagw (cookie que PSA crea
  // incluso antes de autenticar) y que el HTML contuviera "Mi PSA" (también
  // aparece en el <title> de la pantalla de login), por lo que una clave
  // inválida se diagnosticaba como un fallo genérico de SSO. Seguimos los
  // redirects y rechazamos explícitamente ese camino.
  let landing = '';
  for (let i = 0; i < 6; i++) {
    const loc = response.headers.get('location');
    if (!loc) {
      landing = await response.text();
      break;
    }
    current = new URL(loc, current).href;
    if (isLoginUrl(current)) return null;
    response = await fetch(current, { headers: getHeaders(), redirect: 'manual' });
    putCookies(response.headers, mi);
  }
  if (!landing) {
    const r4 = await fetch(MI + '/', { headers: getHeaders(), redirect: 'manual' });
    putCookies(r4.headers, mi);
    current = r4.url || MI + '/';
    const rootLoc = r4.headers.get('location');
    if (rootLoc) {
      current = new URL(rootLoc, current).href;
      if (isLoginUrl(current)) return null;
    }
    landing = await r4.text();
  }
  if (isLoginUrl(current) || isLoginPage(landing)) return null;
  if (!Object.keys(mi).length) return null;
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
    // Verificar que el SSO terminó en el módulo y no volvió a la pantalla de
    // login. "txtCons" era un id interno del hub: PSA lo cambió en algunos
    // despliegues y dejó a todos sin datos aunque la sesión siguiera viva.
    const r5 = await fetch(DIP_HUB, { headers: { 'User-Agent': UA, Cookie: cookieH(dip) } });
    putCookies(r5.headers, dip);
    if (isLoginUrl(r5.url || DIP_HUB)) return null;
    const h5 = await r5.text();
    if (isLoginPage(h5)) return null;
    return dip;
  } catch (_) {
    return null;
  }
}

/* ================= Reporte de Bonos (Mi Equipo, v809) =================
   El tablero de PSA → "Bonos y Bonus" → "Reporte de Bonos" es la
   autoconsulta idx=169. Ojo con dos diferencias con Garantías (88):
     · el período se pide como YYYY-MM (2026-09), no MM-YYYY
     · el HTML viene en ISO-8859-1 (hay que decodificar los bytes)
   Con el formato de período mal, PSA responde un reporte "en blanco"
   (importe cero y período "-09"), por eso se valida el nombre del mes. */

interface AcumFila { c: string; r: string; pb: string; pi: string }
interface BonoFila { d: string; pct: string; total: string; mov: string; estado: string; imp: string }
interface BonosReporte {
  dip: string; nombre: string; socio: string; sucursal: string; categoria: string; pais: string;
  periodo: string;
  acumulacion: AcumFila[];
  bonos: BonoFila[];
  total: string;
  aviso: string;
}

function decodificarHtml(t: string): string {
  return String(t || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&eacute;/gi, 'é')
    .replace(/&iacute;/gi, 'í')
    .replace(/&oacute;/gi, 'ó')
    .replace(/&aacute;/gi, 'á')
    .replace(/&uacute;/gi, 'ú')
    .replace(/&iexcl;/gi, '¡')
    .replace(/&iquest;/gi, '¿')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}
function limpiarCelda(c: string): string {
  return decodificarHtml(c.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}
function filasHtml(h: string): string[][] {
  const trs = h.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || [];
  return trs.map(tr => (tr.match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/g) || []).map(limpiarCelda));
}
/** ISO-8859-1 → texto (los bytes 0x80-0xFF son 1:1 con los codepoints). */
function decodificarLatin1(bytes: Uint8Array): string {
  try { return new TextDecoder('iso-8859-1').decode(bytes); }
  catch (_) { let t = ''; for (let i = 0; i < bytes.length; i++) t += String.fromCharCode(bytes[i]); return t; }
}
/** Período actual (YYYY-MM) en hora de Buenos Aires. */
function periodoActualBA(): string {
  const z = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
  return z.getFullYear() + '-' + String(z.getMonth() + 1).padStart(2, '0');
}

/** Parsea el Reporte de Bonos (idx=169). Devuelve null si el período no se generó. */
function parsearBonos(html: string): BonosReporte | null {
  const out: BonosReporte = { dip: '', nombre: '', socio: '', sucursal: '', categoria: '', pais: '', periodo: '', acumulacion: [], bonos: [], total: '', aviso: '' };
  const filas = filasHtml(html);
  let zona: '' | 'periodo' | 'res' | 'acum' | 'det' | 'brows' = '';
  for (const f of filas) {
    const joined = f.join(' | ');
    if (!zona) {
      if (/DIP\s*Nro/i.test(joined)) {
        const g = (re: RegExp) => { const m = joined.match(re); return m ? m[1].trim() : ''; };
        out.dip = g(/DIP\s*Nro\s*:\s*([0-9][0-9\-]*)/i);
        out.nombre = g(/Nombre\s*y\s*Apellido\s*:\s*(.*?)\s*Socio\s*:/i);
        out.socio = g(/Socio\s*:\s*(.*?)\s*Sucursal\s*:/i);
        out.sucursal = g(/Sucursal\s*:\s*(.*?)\s*Categor/i);
        out.categoria = g(/Categor[ií]a\s*:\s*(.*?)\s*Pa[ií]s\s*:/i);
        out.pais = g(/Pa[ií]s\s*:\s*(.*?)\s*$/i);
        zona = 'periodo';
      }
      continue;
    }
    if (zona === 'periodo') {
      const m = joined.match(/Consultado\s*:\s*([A-Za-zÁÉÍÓÚÑáéíóúñ]+-\d{4})/i);
      if (m) { out.periodo = m[1].trim(); zona = 'res'; }
      continue;
    }
    if (zona === 'res') {
      if (/Resumen de Acumulaci/i.test(joined)) { zona = 'acum'; continue; }
      if (/Detalle de Bonos/i.test(joined)) { zona = 'det'; continue; }
      continue;
    }
    if (zona === 'acum') {
      if (/Detalle de Bonos/i.test(joined)) { zona = 'det'; continue; }
      if (f.length >= 3 && /^\d+$/.test(f[0]) && /\d/.test(f[2] || '')) {
        out.acumulacion.push({ c: f[0], r: f[1] || '', pb: f[2] || '0.00', pi: f[3] || '0.00' });
      }
      continue;
    }
    if (zona === 'det') {
      if (/Descripci/i.test(joined)) { zona = 'brows'; continue; }
      continue;
    }
    // brows: [ '', desc, %, PC total, Mov. PC, estado, importe ]  · total: [ '', importe ]
    if (f.length === 2 && f[0] === '' && /\d/.test(f[1] || '')) { out.total = f[1]; continue; }
    if (f.length >= 6 && f[0] === '' && f[1]) {
      out.bonos.push({ d: f[1], pct: f[2] || '0.00', total: f[3] || '0.00', mov: f[4] || '0.00', estado: f[5] || '', imp: f[6] || '0.00' });
      continue;
    }
    if (/^Aviso$/i.test(f[0] || '') && f[1]) out.aviso = f[1];
  }
  if (!out.periodo) return null; // período mal → PSA no generó el reporte
  return out;
}

interface Fila { usuario: string; telefono: string; domicilio: string; cp: string; localidad: string; serie: string; producto: string; compra: string; vence: string; canje: string; dr: string; e: string; cn: string }

/** Parsea el reporte de Garantías (tabla HTML; col 12 = "Dip reasignado",
 *    col 13 = "E Mail", col 14 = "Cumpleaños", v817). */
function normCol(s: string): string {
  return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
function parsearGarantias(html: string): Fila[] {
  const out: Fila[] = [];
  const trs = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || [];
  let header: string[] | null = null;
  const cellText = (c: string) => c.replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&eacute;/gi, 'é')
    .replace(/&iacute;/gi, 'í').replace(/&oacute;/gi, 'ó').replace(/&aacute;/gi, 'á')
    .replace(/&uacute;/gi, 'ú').replace(/&ntilde;/gi, 'ñ')
    .replace(/\s+/g, ' ').trim();
  const find = (names: RegExp[], fallback: number) => {
    if (!header) return fallback;
    const idx = header.findIndex(v => names.some(re => re.test(v)));
    return idx >= 0 ? idx : fallback;
  };
  for (const tr of trs) {
    const cellsAll = tr.match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/g) || [];
    const cells = cellsAll.map(cellText);
    if (!cells.length) continue;
    const hasTh = /<th\b/i.test(tr);
    const rowNorm = cells.map(normCol);
    if (hasTh || (!header && rowNorm.some(v => /(^| )serie( |$)/.test(v)) && rowNorm.some(v => /(^| )(usuario|cliente|titular)( |$)/.test(v)))) {
      header = rowNorm;
      continue;
    }
    // Si PSA cambia el orden o agrega columnas, usamos los encabezados. Los
    // offsets de abajo quedan como respaldo para el HTML histórico.
    const iUsuario = find([/^usuario$/, /nombre.*(usuario|cliente)/, /^cliente$/, /titular/], 0);
    const iTelefono = find([/^telf/, /^telefono/, /^celular/, /tel/], 1);
    const iDomicilio = find([/^domicilio$/, /direccion/], 2);
    const iCp = find([/^c ?p$/, /^codigo postal/, /^cp$/], 3);
    const iLocalidad = find([/^localidad$/, /ciudad/], 4);
    const iSerie = find([/^serie$/, /nro.*serie/, /numero.*serie/], 5);
    const iProducto = find([/^producto$/, /modelo/], 6);
    const iCompra = find([/^f compra$/, /fecha.*compra/, /compra/], 7);
    const iVence = find([/^f vence$/, /fecha.*vence/, /vencimiento/, /vence/], 8);
    const iCanje = find([/^canje$/, /tipo.*canje/], 11);
    const iDr = find([/dip.*reasign/, /reasign/], 12);
    const iEmail = find([/^e mail$/, /^email$/, /correo/], 13);
    const iCumple = find([/^cumple/, /cumpleanos/], 14);
    if (cells.length <= iSerie) continue;
    const serie = normSerie(cells[iSerie]);
    if (!serie || !/[A-Z0-9]{4,}/.test(serie)) continue;
    out.push({
      usuario: cells[iUsuario] || '', telefono: cells[iTelefono] || '', domicilio: cells[iDomicilio] || '', cp: cells[iCp] || '',
      localidad: cells[iLocalidad] || '', serie, producto: cells[iProducto] || '', compra: cells[iCompra] || '', vence: cells[iVence] || '',
      canje: cells[iCanje] || '', dr: cells[iDr] || '', e: cells[iEmail] || '', cn: cells[iCumple] || ''
    });
  }
  return out;
}

/* ===== Línea descendente (Mi negocio · PB por día) =====
   Autoconsulta → Informes de organización → Línea descendente. El
   informe lista a cada integrante de la organización con su PB del mes.
   Solamente interesan nombre y PB. Como PSA puede exponer el informe por
   índices distintos, el idx se redescubre en el hub (auto_consultas.php);
   si el hub no lo muestra, se usa el secret PSA_LINEA_IDX. */

function numPB(raw: string): number {
  const s = String(raw || '').replace(/[^0-9.,]/g, '');
  if (!s) return 0;
  const c = s.lastIndexOf(','), d = s.lastIndexOf('.');
  if (c > d) {
    return parseFloat(s.slice(0, c).replace(/\./g, '') + '.' + s.slice(c + 1)) || 0;
  }
  if (d > -1) {
    const dec = s.slice(d + 1);
    if (/^\d{1,2}$/.test(dec)) return parseFloat(s.slice(0, d).replace(/,/g, '') + '.' + dec) || 0;
    return parseFloat(s.replace(/[.,]/g, '')) || 0;
  }
  return parseFloat(s) || 0;
}

function pareceNombre(s: string): boolean {
  const t = String(s || '').trim();
  if (t.length < 3 || t.length > 60) return false;
  if (/\d/.test(t)) return false;
  const palabras = t.split(/[\s]+/).filter(Boolean);
  return palabras.length >= 2 && palabras.length <= 6;
}

interface LineaFila { n: string; pb: number }

function parsearLinea(html: string): LineaFila[] | null {
  const filas = filasHtml(html);
  if (!filas.length) return null;
  const out: LineaFila[] = [];
  for (const f of filas) {
    if (!f || f.length < 2) continue;
    let idxNombre = -1;
    for (let i = 0; i < f.length; i++) if (pareceNombre(f[i])) { idxNombre = i; break; }
    if (idxNombre < 0) continue;
    let pb: number | null = null;
    for (let i = idxNombre + 1; i < f.length; i++) {
      const cel = f[i] || '';
      if (!cel || /[A-Za-z]/.test(cel)) continue;
      if (!/[\d.,]/.test(cel)) continue;
      pb = numPB(cel);
      break;
    }
    if (pb == null) continue;
    out.push({ n: f[idxNombre], pb });
  }
  return out.length ? out : null;
}

function columnasHtml(h: string): string[] {
  const filas = filasHtml(h);
  for (const f of filas) if (f.length > 1) return f;
  return [];
}

/* ===== Línea descendente · formato HTML real (v618 sync) =====
   En Autoconsulta la Línea viene como tabla con el Nombre en el formato
   "[2-00000579] APELLIDO, NOMBRE [AR-B]" y el PB del mes en la 4ª celda
   después del nombre (Cat · Tel · Estado · PB). El header de la tabla
   lleva una columna vacía de más que las filas de datos, así que para que
   la app (procesarExcel, hecho para el Excel exportado) lea las filas se
   compensa corriéndolas una celda a la derecha tras el encabezado. */

function parsearLineaHtml(html: string): LineaFila[] | null {
  const filas = filasHtml(html);
  const out: LineaFila[] = [];
  let nombreOffset = 4;
  // El formato habitual tiene "Nombre" y "PB Mes Actual" en la fila de
  // títulos. Calcular el desplazamiento permite tolerar que PSA agregue o
  // quite una columna sin dejar la línea vacía.
  for (const f of filas) {
    const n = f.map(normCol);
    const iNombre = n.findIndex(v => /(^| )(nombre|distribuidor|dip)( |$)/.test(v));
    const iPB = n.findIndex(v => /(^| )(pb|puntos pb|pb mes|pb mes actual|puntos personales)( |$)/.test(v));
    if (iNombre >= 0 && iPB > iNombre) { nombreOffset = iPB - iNombre; break; }
  }
  for (const f of filas) {
    if (!f || f.length < 2) continue;
    let idxNombre = -1;
    for (let i = 0; i < f.length; i++) if (/^\[\s*\d{1,3}-\d+\s*\]/.test(f[i] || '')) { idxNombre = i; break; }
    if (idxNombre < 0) continue;
    const pbCell = f[idxNombre + nombreOffset] || '';
    const pb = numPB(pbCell);
    const nombre = String(f[idxNombre]).replace(/^\[\s*\d{1,3}-\d+\s*\]\s*/, '').replace(/\s*\[\s*[^\]\[]+\s*\]\s*$/, '').trim();
    if (nombre) out.push({ n: nombre, pb });
  }
  return out.length ? out : null;
}

/* ===== Sincronización completa =====
   Los archivos que APPI actualiza al entrar se bajan en UNA sola sesión con
   action:'sync'. Histórico usa las URL directas confirmadas; los índices del
   hub, los secrets y el cache appsi_psa_idx quedan como respaldo. La respuesta
   conserva el `menu` descubierto para poder diagnosticar futuros cambios. */

const dipFetch = (jar: Jar, url: string, opts: { method?: string; body?: string } = {}): Promise<Response> =>
  fetch(url, {
    method: opts.method || 'GET',
    headers: {
      'User-Agent': UA,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Referer': DIP_HUB,
      Cookie: cookieH(jar)
    },
    body: opts.body
  });

function normL(s: string): string {
  return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/_+/g, ' ');
}

/** Primer reporte del hub cuyo nombre (normalizado) cumpla alguno de los
 *  grupos: un grupo es una lista de regex TODAS obligatorias. */
function elegir(reportes: Map<string, string>, grupos: RegExp[][]): string | null {
  for (const grupo of grupos) {
    for (const [id, lbl] of reportes) {
      const n = normL(lbl);
      if (grupo.every(re => re.test(n))) return id;
    }
  }
  return null;
}

/** Descubre los informes que el hub expone como links (idx=NN), entradas
 *  de select o botones AutoConsulta('idx','exec','Nombre') — el formato con
 *  el que PSA lista las autoconsultas de cada categoría. Las páginas vienen
 *  en ISO-8859-1 y los nombres pueden llevar guión bajo (Búsqueda_de_Dips). */
function descubrirReportes(html: string): Map<string, string> {
  const reportes = new Map<string, string>();
  const reAC = /AutoConsulta\s*\(\s*['"]([\d]+)['"]\s*,\s*['"]([^'"]*)['"]\s*,\s*['"]([^'"]*)['"]\s*\)/gi;
  let mc: RegExpExecArray | null;
  while ((mc = reAC.exec(html)) !== null) {
    const nombre = String(mc[3] || '').trim();
    if (nombre.length < 3) continue;
    // Conserva la descrip EXACTA (acentos y guiones bajos): es el parámetro
    // Consulta= que el ejecutor de PSA espera (el <a> del hub no lo trae);
    // para leer el nombre, normL() y el menu la dan por separado.
    if (!reportes.has(String(mc[1]))) reportes.set(String(mc[1]), nombre);
  }
  const anchors = html.match(/<a[^>]*>[\s\S]*?<\/a>/gi) || [];
  for (const a of anchors) {
    const label = limpiarCelda(a);
    if (!label || label.length < 3) continue;
    const midx = a.match(/idx[=_]([\d]+)/i);
    if (midx && !reportes.has(String(midx[1]))) reportes.set(String(midx[1]), label);
  }
  const options = html.match(/<option[^>]*>[\s\S]*?<\/option>/gi) || [];
  for (const o of options) {
    const label = limpiarCelda(o);
    if (!label || label.length < 3) continue;
    const midx = o.match(/value="?([\d]+)"?/i);
    if (midx && !reportes.has(String(midx[1]))) reportes.set(String(midx[1]), label);
  }
  return reportes;
}

function descubrirCategorias(html: string): string[] {
  const categorias = new Set<string>();
  const re = /(?:ac_cat|cat)[=_](\d{1,3})/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) categorias.add(match[1]);
  return [...categorias];
}

async function descubrir(jar: Jar): Promise<{ reportes: Map<string, string>; menu: Record<string, string[]> }> {
  const reportes = new Map<string, string>();
  const menu: Record<string, string[]> = {};
  const pendientes = ['', '20', '21'];
  const visitadas = new Set<string>();
  // PSA puede mover un informe de categoría. Además de las dos categorías
  // históricas, recorremos únicamente las categorías que el propio menú
  // anuncie (con un límite para no convertir un cambio de HTML en un barrido).
  for (let cursor = 0; cursor < pendientes.length && cursor < 18; cursor++) {
    const acCat = pendientes[cursor];
    if (visitadas.has(acCat)) continue;
    visitadas.add(acCat);
    const clave = acCat ? 'ac_cat=' + acCat : 'hub';
    const url = acCat ? DIP_HUB + '?ac_cat=' + acCat : DIP_HUB;
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA, Cookie: cookieH(jar) } });
      const html = decodificarLatin1(new Uint8Array(await r.arrayBuffer()));
      const rep = descubrirReportes(html);
      for (const [id, lbl] of rep) if (!reportes.has(id)) reportes.set(id, lbl);
      menu[clave] = [...rep.entries()].slice(0, 60).map(([i, l]) => i + '=' + l);
      for (const categoria of descubrirCategorias(html)) {
        if (!visitadas.has(categoria) && !pendientes.includes(categoria)) pendientes.push(categoria);
      }
    } catch (_) {
      menu[clave] = [];
    }
  }
  return { reportes, menu };
}

/** Codifica a Latin-1 (los forms de PSA vienen en ISO-8859-1: los nombres
 *  de campo pueden llevar tilde, p. ej. filtro_Cumpleaños). */
function encL1(s: string): string {
  let out = '';
  for (const ch of String(s || '')) {
    const c = ch.charCodeAt(0);
    if (c < 0x80 && /[A-Za-z0-9._~-]/.test(ch)) { out += ch; continue; }
    out += '%' + c.toString(16).toUpperCase().padStart(2, '0');
  }
  return out;
}

function resumenVisibleInforme(html: string): string {
  const texto = limpiarCelda(html);
  const partes: string[] = [];
  const periodo = texto.match(/(?:per[ií]odo consultado\s*[:\-]?\s*)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s*[-\/]\s*(20\d{2})/i);
  const total = texto.match(/total de\s+\d+\s+(?:incorporaciones|ingresos)/i);
  const vacio = texto.match(/(?:sin|no (?:se )?(?:encontraron|registraron))\s+(?:personas|ingresos|incorporaciones)/i);
  if (periodo) partes.push(periodo[0]);
  if (total) partes.push(total[0]);
  if (vacio) partes.push(vacio[0]);
  return partes.join(' · ');
}
const HISTORICAL_MONTH_NUMBER: Record<string, string> = {
  enero: '01', febrero: '02', marzo: '03', abril: '04', mayo: '05', junio: '06',
  julio: '07', agosto: '08', septiembre: '09', setiembre: '09', octubre: '10',
  noviembre: '11', diciembre: '12',
};
function periodoVisibleInforme(html: string): string {
  const texto = limpiarCelda(html);
  const iso = texto.match(/per[ií]odo consultado\s*[:\-]?\s*(20\d{2})-(0[1-9]|1[0-2])/i);
  if (iso) return `${iso[1]}-${iso[2]}`;
  const visible = texto.match(/per[ií]odo consultado\s*[:\-]?\s*(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s*[-\/]\s*(20\d{2})/i);
  if (!visible) return '';
  return `${visible[2]}-${HISTORICAL_MONTH_NUMBER[normL(visible[1])] || ''}`;
}
function informeCoincidePeriodo(html: string, solicitado: string): boolean {
  const visible = periodoVisibleInforme(html);
  return !visible || visible === solicitado;
}
function pareceInformeIngresos(html: string): boolean {
  if (resumenVisibleInforme(html)) return true;
  return filasHtml(html).some(fila => {
    const celdas = fila.map(normL);
    return celdas.includes('dip') && celdas.filter(celda => celda === 'nombre').length >= 2 && celdas.some(celda => celda.includes('fecha alta')) && celdas.some(celda => celda.includes('patrocinante'));
  });
}

/** Baja un informe de autoconsulta con la URL real del navegador:
 *  autoconsulta_exec.php?idx=N&periodo=YYYY-MM&Consulta=<nombre exacto>.
 *  Si PSA responde el form de filtros en vez de la tabla, lo reenvía por
 *  POST a /home/autoconsulta_exec.php cosechando TODOS los campos (inputs y
 *  selects) del form + accion=consultar, sin fijar nada a mano para aguantar
 *  cambios de PSA. */
async function bajarReporte(jar: Jar, idx: string, consulta: string, periodo: string, verifica: (h: string) => boolean): Promise<{ html: string; via: string }> {
  const urlGet = DIP_EXEC + '?idx=' + idx + '&periodo=' + periodo + '&Consulta=' + encL1(consulta);
  try {
    const rg = await dipFetch(jar, urlGet);
    const h1 = decodificarLatin1(new Uint8Array(await rg.arrayBuffer()));
    if (verifica(h1) || !/<form/i.test(h1)) return { html: h1, via: 'GET' };
  } catch (_) {}
  const fd = new URLSearchParams();
  let accion = false;
  try {
    const rf = await dipFetch(jar, urlGet);
    const formH = decodificarLatin1(new Uint8Array(await rf.arrayBuffer()));
    fd.set('idx', idx);
    const inputs = formH.match(/<input[^>]*>/gi) || [];
    for (const inp of inputs) {
      const nm = inp.match(/name="([^"]*)"/i);
      if (!nm) continue;
      const key = String(nm[1]);
      if (key === 'idx' || key === 'frmFiltros' || key.includes('cadena_iddip')) continue;
      const typ = (inp.match(/type="([^"]*)"/i) || ['', ''])[1].toLowerCase();
      if (typ === 'button') continue;
      if (typ === 'radio' || typ === 'checkbox') {
        if (/checked/i.test(inp)) fd.set(key, (inp.match(/value="([^"]*)"/i) || ['', ''])[1]);
        continue;
      }
      fd.set(key, (inp.match(/value="([^"]*)"/i) || ['', ''])[1]);
    }
    const selects = formH.match(/<select[^>]*>[\s\S]*?<\/select>/gi) || [];
    for (const sel of selects) {
      const nm = sel.match(/name="([^"]*)"/i);
      if (!nm) continue;
      const opts = sel.match(/<option[^>]*>[\s\S]*?<\/option>/gi) || [];
      let choice = '';
      for (const o of opts) {
        if (/selected/i.test(o)) { choice = (o.match(/value="([^"]*)"/i) || ['', ''])[1]; break; }
        if (!choice) choice = (o.match(/value="([^"]*)"/i) || ['', ''])[1];
      }
      fd.set(String(nm[1]), choice);
    }
    if (fd.has('accion')) fd.set('accion', 'consultar');
    else fd.set('accion', 'consultar');
    accion = true;
    if (!fd.get('periodo')) fd.set('periodo', periodo);
  } catch (_) {}
  try {
    if (!accion) fd.set('accion', 'consultar');
    const body = Array.from(fd.entries()).map(([k, v]) => encL1(k) + '=' + encL1(v)).join('&');
    const rp = await dipFetch(jar, DIP_EXEC, { method: 'POST', body });
    return { html: decodificarLatin1(new Uint8Array(await rp.arrayBuffer())), via: 'POST' };
  } catch (_) {}
  return { html: '', via: 'NONE' };
}

/** Prioriza la URL directa confirmada para cada informe histórico. Si PSA
 *  cambia el idx o la descripción, prueba después los índices descubiertos,
 *  configurados o recordados por la app. */
async function bajarReporteHistorico(
  jar: Jar,
  key: HistoricalDirectKey,
  periodo: string,
  alternativos: string[],
  reportes: Map<string, string>,
  verifica: (h: string) => boolean,
): Promise<{ html: string; via: string; idx: string; fuente: 'directa' | 'respaldo' }> {
  const directo = HISTORICAL_DIRECT_REPORTS[key];
  const candidatos: Array<{ idx: string; consulta: string; fuente: 'directa' | 'respaldo' }> = [
    { ...directo, fuente: 'directa' },
  ];
  const vistos = new Set([directo.idx]);
  for (const raw of alternativos) {
    const idx = String(raw || '').trim();
    if (!idx || vistos.has(idx)) continue;
    vistos.add(idx);
    candidatos.push({ idx, consulta: reportes.get(idx) || directo.consulta, fuente: 'respaldo' });
  }
  let ultimo: { html: string; via: string; idx: string; fuente: 'directa' | 'respaldo' } = {
    html: '', via: 'NONE', idx: directo.idx, fuente: 'directa'
  };
  for (const candidato of candidatos) {
    try {
      const reporte = await bajarReporte(jar, candidato.idx, candidato.consulta, periodo, verifica);
      ultimo = { ...reporte, idx: candidato.idx, fuente: candidato.fuente };
      if (verifica(reporte.html)) return ultimo;
    } catch (_) {}
  }
  return ultimo;
}

/* ===== Perfil del distribuidor (v827) =====
   1) saldo en cuenta corriente    → dip autoconsulta idx=32
   2) última devolución de saldos  → dip idx=51 (CuentaCorriente)
   3) categoría / tributaria / tel → minegocio.psa.com.ar /account (SSO)  */

/** "1.234.567,89" | "1234567,89" | "1234.56" → number */
function numAR(raw: string): number {
  const clean = String(raw || '').replace(/[^0-9.,]/g, '');
  if (!clean) return 0;
  const lastComma = clean.lastIndexOf(','), lastDot = clean.lastIndexOf('.');
  let int = clean, dec = '0';
  if (lastComma > lastDot) { int = clean.slice(0, lastComma).replace(/\./g, ''); dec = clean.slice(lastComma + 1); }
  else if (lastDot > -1 && clean.slice(lastDot + 1).length === 2) { int = clean.slice(0, lastDot).replace(/\./g, ''); dec = clean.slice(lastDot + 1); }
  else { int = clean.replace(/[.,]/g, ''); }
  const n = parseFloat(int + '.' + dec);
  return isNaN(n) ? 0 : n;
}

/** SSO a minegocio.psa.com.ar (misma familia que dip: mi → app → login?p=token).
 *  Devuelve el HTML del /account o null si la sesión no calza. */
async function ssoMinegocio(mi: Jar): Promise<string | null> {
  const mn: Jar = {};
  const hop = async (url: string, jar: Jar, withMi: boolean): Promise<string | null> => {
    const h: Record<string, string> = { 'User-Agent': UA };
    if (jar['PHPSESSID'] || jar['PSA_AC'] || jar['minegocio_session']) h['Cookie'] = cookieH(jar);
    if (withMi) h['Cookie'] = cookieH(mi);
    const r = await fetch(url, { headers: h, redirect: 'manual' });
    putCookies(r.headers, mn);
    return r.headers.get('location');
  };
  try {
    let loc = await hop('https://minegocio.psa.com.ar/', mn, false);
    if (!loc) return null;
    let u = new URL(loc, 'https://minegocio.psa.com.ar/').href;
    for (let i = 0; i < 7 && loc; i++) {
      if (u.startsWith('https://mi.psa.com.ar')) {
        loc = await hop(u, mn, true);
        if (loc) u = new URL(loc, u).href;
      } else {
        loc = await hop(u, mn, false);
        if (loc) u = new URL(loc, u).href;
      }
    }
    const ra = await fetch('https://minegocio.psa.com.ar/account', { headers: { 'User-Agent': UA, Cookie: cookieH(mn) }, redirect: 'manual' });
    const html = decodificarLatin1(new Uint8Array(await ra.arrayBuffer()));
    if (!/Categor/i.test(html)) return null;
    return html;
  } catch (_) {
    return null;
  }
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
  if (body.action !== 'report' && body.action !== 'bonos' && body.action !== 'perfil' && body.action !== 'linea' && body.action !== 'sync' && serie.length < 4) return json({ error: 'Escribí el número de serie (el del QR de la base).' }, 400);

  // Credenciales PSA: las trae la app (sección MI PSA) o secrets del proyecto.
  // El formulario de PSA pide los 8 últimos dígitos del distribuidor. La
  // interfaz de APPI suele recibirlos desde un input numérico y puede perder
  // el cero inicial; normalizar acá evita que cada cuenta tenga que adivinar
  // si debe escribir 7 u 8 dígitos. Nunca se modifica la clave.
  const centerRaw = body.center || Deno.env.get('PSA_CENTER') || '';
  const numberRaw = body.number || Deno.env.get('PSA_NUMBER') || '';
  const center = normalizePSACenter(centerRaw);
  const number = normalizePSANumber(numberRaw);
  const password = String(body.password || Deno.env.get('PSA_PASSWORD') || '');
  if (!psaDigits(centerRaw) || !psaDigits(numberRaw) || !password) {
    return json({ error: 'Faltan tus datos de MI PSA. Guardalos en APPI (Ajustes → MI PSA) o como secrets PSA_CENTER / PSA_NUMBER / PSA_PASSWORD.' }, 400);
  }

  // 1) Login MI PSA
  let mi: Jar | null;
  try {
    mi = await loginPSA(center, number, password);
  } catch (e) {
    return json({ error: 'No se pudo conectar con PSA: ' + String((e as any)?.message || e) }, 502);
  }
  if (!mi) return json({ code: 'psa_credentials', error: 'No se pudo entrar a mi.psa.com.ar con esos datos (¿clave correcta?).' }, 401);

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

  // 3B) Reporte de Bonos (tablero PSA → Bonos y Bonus). La app lo pide al
  //     entrar y lo muestra en la parte superior de Mi Equipo (v809).
  if (body.action === 'bonos') {
    const periodo = (body.periodo ? String(body.periodo) : periodoActualBA()).replace(/[^0-9\-]/g, '');
    let htmlB = '';
    try {
      const rb = await dipReq(DIP_EXEC + '?idx=169&periodo=' + periodo + '&Consulta=Bonos');
      htmlB = decodificarLatin1(new Uint8Array(await rb.arrayBuffer()));
    } catch (e) {
      return json({ error: 'No se pudo abrir el reporte de Bonos de PSA: ' + String((e as any)?.message || e) }, 502);
    }
    const bonos = parsearBonos(htmlB);
    if (!bonos) {
      return json({ error: 'PSA todavía no calculó los bonos de ese período (o cambió el formato del reporte).' }, 502);
    }
    return json({ ok: true, bonos });
  }

  /* ===== Línea descendente · PB por día (Mi negocio) =====
     La app lo baja en cada apertura para guardar los números de cada
     integrante y acumular los cambios día a día (nombre + PB). */
  if (body.action === 'linea') {
    const periodo = (body.periodo ? String(body.periodo) : periodoActualBA()).replace(/[^0-9\-]/g, '');
    const override: Record<string, string> = (body.idx && typeof body.idx === 'object')
      ? Object.fromEntries(Object.entries(body.idx).map(([k, v]) => [k, String(v)])) : {};
    const { reportes, menu } = await descubrir(dip);
    let idxLinea = override.linea || String(Deno.env.get('PSA_LINEA_IDX') || '').trim();
    if (!idxLinea) {
      const e = elegir(reportes, [[/linea/, /descend/], [/linea/], [/descend/]]);
      if (e) idxLinea = e;
    }
    if (!idxLinea) {
      return json({ ok: false, error: 'No pude ubicar el informe «Línea descendente» en Autoconsulta de PSA (revisá «menu»).', menu }, 502);
    }
    try {
      const descrip = reportes.get(idxLinea) || 'Linea';
      const { html, via } = await bajarReporte(dip, idxLinea, descrip, periodo, h => !!parsearLineaHtml(h));
      const filas = parsearLineaHtml(html);
      if (!filas || !filas.length) {
        return json({ ok: false, error: 'El informe de Línea descendente no devolvió integrantes (via: ' + via + '). Puede haber cambiado el formato de PSA.', columnas: columnasHtml(html) }, 502);
      }
      return json({ ok: true, periodo, via, idx: { linea: idxLinea }, filas: filas.map(f => ({ n: f.n, pb: f.pb })) });
    } catch (e) {
      return json({ ok: false, error: 'No se pudo bajar el informe de Línea descendente: ' + String((e as any)?.message || e) }, 502);
    }
  }

  /* ===== Sincronización de informes PSA (v878) =====
     Línea descendente, Garantías por organización e Ingresos priorizan las
     URL directas confirmadas. El discovery, los secrets y los índices que la
     app recuerda quedan únicamente como respaldo ante cambios futuros de PSA. */
  if (body.action === 'sync') {
    const periodo = (body.periodo ? String(body.periodo) : periodoActualBA()).replace(/[^0-9\-]/g, '');
    const permitidos = new Set(['linea', 'garantiasOrg', 'garantias', 'ingresos']);
    const datasets: string[] = Array.isArray(body.datasets) && body.datasets.length
      ? body.datasets.map(String).filter((item: string) => permitidos.has(item))
      : ['linea', 'garantiasOrg', 'garantias'];
    const quiero = (k: string) => datasets.includes(k);
    const override: Record<string, string> = (body.idx && typeof body.idx === 'object')
      ? Object.fromEntries(Object.entries(body.idx).map(([k, v]) => [k, String(v)])) : {};

    const idx: Record<string, string> = {};
    const alternativas: Record<string, string[]> = { linea: [], garantiasOrg: [], ingresos: [] };
    const errores: string[] = [];
    const { reportes, menu } = await descubrir(dip);
    const agregarAlternativa = (key: string, value: unknown) => {
      const id = String(value || '').trim();
      if (id && !alternativas[key].includes(id)) alternativas[key].push(id);
    };

    if (quiero('linea')) {
      idx.linea = HISTORICAL_DIRECT_REPORTS.linea.idx;
      agregarAlternativa('linea', override.linea);
      agregarAlternativa('linea', Deno.env.get('PSA_LINEA_IDX'));
      agregarAlternativa('linea', elegir(reportes, [[/linea/, /descend/], [/linea/], [/descend/]]));
    }
    if (quiero('garantiasOrg')) {
      idx.garantiasOrg = HISTORICAL_DIRECT_REPORTS.garantiasOrg.idx;
      agregarAlternativa('garantiasOrg', override.garantiasOrg);
      agregarAlternativa('garantiasOrg', Deno.env.get('PSA_GO_IDX'));
      agregarAlternativa('garantiasOrg', elegir(reportes, [[/garant/, /por\s*org/], [/garant/, /orga/], [/orga/], [/por\s*org/]]));
    }
    if (quiero('garantias')) {
      idx.garantias = override.garantias || '';
      if (!idx.garantias) {
        let e: string | null = null;
        // El reporte es el que EMPIEZA en "garantias…" (evita "Carga de datos
        // de garantías", "Certificado de Garantía…", etc., que PSA lista antes).
        for (const [id, lbl] of reportes) {
          if (normL(lbl).startsWith('garant') && id !== idx.garantiasOrg) { e = id; break; }
        }
        if (!e) e = elegir(reportes, [[/^garant/], [/garant/]]);
        if (e) idx.garantias = e;
      }
      if (!idx.garantias) errores.push('Garantías: no encontré el informe en Autoconsulta (revisá «menu»).');
    }
    if (quiero('ingresos')) {
      idx.ingresos = HISTORICAL_DIRECT_REPORTS.ingresos.idx;
      agregarAlternativa('ingresos', override.ingresos);
      agregarAlternativa('ingresos', Deno.env.get('PSA_INGRESOS_IDX'));
      agregarAlternativa('ingresos', elegir(reportes, [
        [/patrocinios?/, /organizacion/],
        [/(^|\s)ingresos?(\s|$)/],
        [/(^|\s)incorporaciones?(\s|$)/],
        [/altas?/, /distribuidor|organizacion/]
      ]));
    }

    const out: any = { ok: true, motor: 'historico-directo-v879', periodo, idx, fuentes: {}, errores, menu, linea: null, garantiasOrg: null, garantias: null, ingresos: null };

    if (idx.linea) {
      try {
        const reporte = await bajarReporteHistorico(dip, 'linea', periodo, alternativas.linea, reportes, h => !!parsearLineaHtml(h) && informeCoincidePeriodo(h, periodo));
        const { html } = reporte;
        idx.linea = reporte.idx;
        out.fuentes.linea = reporte.fuente;
        const par = parsearLineaHtml(html);
        if (par && par.length && informeCoincidePeriodo(html, periodo)) {
          out.linea = {
            filas: filasHtml(html),
            par: par.map(f => ({ n: f.n, pb: f.pb })),
            pb: par.reduce((s, f) => s + f.pb, 0)
          };
        } else {
          errores.push('Línea descendente: el informe salió vacío (¿cambió el formato de PSA?).');
        }
      } catch (_) {
        errores.push('Línea descendente: no se pudo bajar el informe.');
      }
    }
    if (idx.garantiasOrg) {
      try {
        const reporte = await bajarReporteHistorico(dip, 'garantiasOrg', periodo, alternativas.garantiasOrg, reportes, h => filasHtml(h).length > 1 && informeCoincidePeriodo(h, periodo));
        const { html } = reporte;
        idx.garantiasOrg = reporte.idx;
        out.fuentes.garantiasOrg = reporte.fuente;
        const filas = filasHtml(html).filter(f => f.length > 1);
        if (filas.length && informeCoincidePeriodo(html, periodo)) {
          out.garantiasOrg = { filas };
        } else {
          errores.push('Garantías por organización: el informe salió vacío (¿cambió el formato de PSA?).');
        }
      } catch (_) {
        errores.push('Garantías por organización: no se pudo bajar el informe.');
      }
    }
    if (idx.garantias) {
      try {
        const { html } = await bajarReporte(dip, idx.garantias, reportes.get(idx.garantias) || 'Garantias', periodo, h => parsearGarantias(h).length > 0);
        const filas = parsearGarantias(html);
        if (filas.length) {
          out.garantias = { filas: filas.map(f => ({ s: f.serie, u: f.usuario, t: f.telefono, d: f.domicilio, c: f.cp, l: f.localidad, p: f.producto, c2: f.compra, v: f.vence, e: f.e, cn: f.cn })) };
        } else {
          errores.push('Garantías: el reporte salió vacío (¿cambió el formato de PSA?).');
        }
      } catch (_) {
        errores.push('Garantías: no se pudo bajar el reporte.');
      }
    }
    if (idx.ingresos) {
      try {
        const reporte = await bajarReporteHistorico(
          dip,
          'ingresos',
          periodo,
          alternativas.ingresos,
          reportes,
          h => pareceInformeIngresos(h) && informeCoincidePeriodo(h, periodo)
        );
        const { html } = reporte;
        idx.ingresos = reporte.idx;
        out.fuentes.ingresos = reporte.fuente;
        const filas = filasHtml(html).filter(f => f.some(cell => String(cell || '').trim()));
        const resumen = resumenVisibleInforme(html);
        if (pareceInformeIngresos(html) && informeCoincidePeriodo(html, periodo)) {
          out.ingresos = { filas, resumen };
        } else {
          errores.push('Ingresos: el informe salió vacío y no confirmó cero ingresos.');
        }
      } catch (_) {
        errores.push('Ingresos: no se pudo bajar el informe.');
      }
    }

    return json(out);
  }

  /* ===== v827 · PERFIL DEL DISTRIBUIDOR (0 interacción del user) ===== */
  if (body.action === 'perfil') {
    let saldo = 0;
    try {
      const rs = await dipReq(DIP_EXEC + '?idx=32&periodo=' + periodoActualBA() + '&Consulta=SaldoEnCuenta');
      const ts = decodificarLatin1(new Uint8Array(await rs.arrayBuffer()));
      const m = ts.match(/SALDO DISPONIBLE A LA FECHA[^0-9]{0,24}([0-9][0-9.,]*)/i);
      if (m) saldo = numAR(m[1]);
    } catch (_) {}
    let ultimaDevolucion: { fecha: string; importe: number } | null = null;
    try {
      const rc = await dipReq(DIP_EXEC + '?idx=51&periodo=' + periodoActualBA() + '&Consulta=CuentaCorriente');
      const tc = decodificarLatin1(new Uint8Array(await rc.arrayBuffer()));
      const all = [...tc.matchAll(/(\d{2}\/\d{2}\/\d{4})\s+Devoluci[oó]n de saldos\s*\[[^\]]*\]\s+([0-9][0-9.,]*)/g)];
      if (all.length) {
        const u = all[all.length - 1];
        ultimaDevolucion = { fecha: u[1], importe: numAR(u[2]) };
      }
    } catch (_) {}
    let categoria = '', tributaria = '', telefono = '';
    try {
      const htmlMn = await ssoMinegocio(mi);
      if (htmlMn) {
        const t = decodificarHtml(htmlMn);
        const mc = t.match(/Categor[ií]a Comercial\s+([A-ZÁÉÍÓÚÑ ]+?)\s+Categor/i);
        if (mc) categoria = mc[1].trim();
        const mt = t.match(/Categor[ií]a Tributaria\s+([A-Za-zÁÉÍÓÚñ ]+?)\s+Sucursal/i);
        if (mt) tributaria = mt[1].trim();
        const mtel = t.match(/Tel[eé]fono celular\s*\+?(\d[\d\s-]{6,20})/);
        if (mtel) telefono = '+' + mtel[1].replace(/[\s-]/g, '');
      }
    } catch (_) {}
    return json({ ok: true, perfil: { categoria, tributaria, telefono, saldo, ultimaDevolucion, ts: new Date().toISOString() } });
  }

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
    // v817: dr = "Dip reasignado" (ex distribuidor), e = E Mail, cn = Cumpleaños.
    return json({
      ok: true,
      total: filas.length,
      filas: filas.map(f => ({ s: f.serie, u: f.usuario, t: f.telefono, d: f.domicilio, c: f.cp, l: f.localidad, p: f.producto, c2: f.compra, v: f.vence, dr: f.dr, e: f.e, cn: f.cn }))
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
