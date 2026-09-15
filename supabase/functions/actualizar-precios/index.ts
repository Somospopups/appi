// APPI · Actualizar catálogo PSA desde la lista "Precios Sugeridos con
// Acuerdo" (PDF público de PSA) — botón "Actualizar" en Lista de precios.
//
// - No necesita login: el PDF es público
//   (dip.psa.com.ar/adjuntos/.../argentina-sugeridos-con-acuerdo.pdf).
// - Cualquier distribuidor autenticado puede dispararlo, 1 vez por día.
// - El precio que se toma es el de la PRIMERA columna (Contado - Débito
//   y 1 cuota TC), la que va al lado del producto, como pide la lista.
// - Fusiona con el catálogo vigente: los productos de la tienda
//   conservan sku/url; los nuevos de la lista se suman; si el PDF no se
//   puede leer, el catálogo anterior NO se toca.
//
// Nota: la extracción del texto usa pdfjs-serverless (pdf.js empaquetado
// para edge/Deno). Si cambia el formato del PDF, se devuelve un error y
// el catálogo anterior se mantiene intacto.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { resolvePDFJS } from 'https://esm.sh/pdfjs-serverless@0.4.2';

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
const PDF_URL = 'https://dip.psa.com.ar/adjuntos/Image/promociones/exterior/listas-precios/vigente/argentina/argentina-sugeridos-con-acuerdo.pdf';
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function fechaAR(d = new Date()) {
  const z = new Date(d.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
  return `${z.getDate()}-${MESES[z.getMonth()]}-${z.getFullYear()}`;
}

// ----------------------- parsing del PDF (texto por línea) -----------------------

function parsePrecioAR(raw: string): number | null {
  const limpio = String(raw || '').replace(/\s+/g, '');
  const m = limpio.match(/([\d.]+),(\d{1,2})$/);
  if (!m) return null;
  const entero = parseInt(m[1].replace(/\./g, ''), 10);
  if (!Number.isFinite(entero)) return null;
  return entero;
}

function parseLinea(linea: string): { nombre: string; canje: boolean; precios: (number | null)[] } | null {
  if (!linea.includes('$')) return null;
  const partes = linea.split(/\s*\$\s*/);
  if (partes.length < 3) return null;
  let nombre = partes[0].trim();
  if (!nombre || nombre.startsWith('Vigencia')) return null;
  let canje = false;
  if (/plan canje$/i.test(nombre)) {
    canje = true;
    nombre = nombre.replace(/plan canje$/i, '').trim();
  }
  if (!nombre) return null;
  const precios = partes.slice(1).map(parsePrecioAR);
  if (precios[0] == null || precios[0] <= 0) return null;
  return { nombre, canje, precios };
}

function esRuido(linea: string): boolean {
  if (!linea) return true;
  if (linea.startsWith('Contado')) return true;
  if (linea.startsWith('Vigencia')) return true;
  if (linea.startsWith('TC')) return true;
  if (/^Precio\s+Val\./.test(linea)) return true;
  if (/^\d+$/.test(linea)) return true;
  if (linea.includes('Cuotas sin interes')) return true;
  return false;
}

interface ProdLista { nombre: string; seccion: string; precio: number | null; plan_canje: number | null; precios: number[] }

function parseListaTexto(texto: string): { vigencia: string; productos: ProdLista[] } {
  const lineas = String(texto || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const mVig = texto.match(/Vigencia:\s*Desde el\s+(\d{1,2} de [a-záéíóú]+ de \d{4})/i);
  const vigencia = mVig ? mVig[1].trim() : '';
  const productos = new Map<string, ProdLista>();
  let seccion = 'General';
  for (const linea of lineas) {
    const parsed = parseLinea(linea);
    if (parsed) {
      const clave = parsed.nombre.toUpperCase();
      let p = productos.get(clave);
      if (!p) {
        p = { nombre: parsed.nombre, seccion, precio: null, plan_canje: null, precios: [] };
        productos.set(clave, p);
      }
      if (parsed.canje) p.plan_canje = parsed.precios[0];
      else if (p.precio == null) { p.precio = parsed.precios[0]; p.precios = parsed.precios; }
      continue;
    }
    if (esRuido(linea)) continue;
    seccion = linea;
  }
  return { vigencia, productos: [...productos.values()].filter(p => p.precio != null) };
}

async function textoDePDF(url: string): Promise<string> {
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Safari/537.36' } });
  if (!r.ok) throw new Error(`PDF no disponible (HTTP ${r.status}).`);
  const data = new Uint8Array(await r.arrayBuffer());
  const { getDocument } = await resolvePDFJS();
  const doc = await getDocument({ data, useSystemFonts: true }).promise;
  const todo: string[] = [];
  try {
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const tc = await page.getTextContent();
      // Reconstruir líneas por coordenada Y (pdf.js entrega items sueltos).
      const items: { str: string; x: number; y: number }[] = [];
      for (const it of tc.items as any[]) {
        if (typeof it.str === 'string' && it.str.trim()) {
          items.push({ str: it.str.trim(), x: it.transform[4], y: it.transform[5] });
        }
      }
      items.sort((a, b) => b.y - a.y || a.x - b.x);
      let actual: { y: number; strs: string[] } | null = null;
      for (const it of items) {
        if (!actual || Math.abs(actual.y - it.y) > 3) {
          if (actual) todo.push(actual.strs.join(' '));
          actual = { y: it.y, strs: [] };
        }
        actual.strs.push(it.str);
      }
      if (actual) todo.push(actual.strs.join(' '));
    }
  } finally {
    try { await doc.destroy(); } catch (_) {}
  }
  return todo.join('\n');
}

// ----------------------- merge con el catálogo vigente -----------------------

const SECCION_A_GRUPO: Record<string, string> = {
  'Purificadores': 'equipos',
  'Gasificador': 'equipos',
  'Purificador Osmosis Inversa': 'equipos',
  'Purificador de Aire': 'equipos',
  'Accesorios para la instalación': 'recargas',
  'Reposiciones': 'recargas',
  'Repuestos/mantenim. productos': 'recargas',
  'Servicios': 'otros',
  'Botellas': 'botellas',
  'Material Promocional': 'otros',
  'Análisis de laboratorio': 'otros',
  'Olivare': 'otros'
};

const ROMANOS: Record<string, string> = { ii: '2', iii: '3', iv: '4', vi: '6', ix: '9' };
function tokenCat(t: string): string {
  t = String(t || '').replace(/[^a-z0-9]/g, '');
  return ROMANOS[t] || t;
}
function palabrasCat(t: string): string[] {
  const raw = String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ').split(/\s+/).filter(Boolean).map(tokenCat);
  const out: string[] = [];
  for (const tk of raw) {
    // "S-1000" → s1000 · "SENIOR 4" → senior4 (el número viaja con el modelo)
    if (out.length && /[a-z]$/.test(out[out.length - 1]) && /^[0-9]+$/.test(tk)) out[out.length - 1] += tk;
    else out.push(tk);
  }
  return out;
}
const OPCIONALES = new Set(['kit', 'posv', 'k']);
function tokensNombre(nombre: string): string[] {
  let t = palabrasCat(nombre).filter(x => !OPCIONALES.has(x));
  const has = (x: string) => t.includes(x);
  // BM = "Bajo Mesada" · SM = modelo estándar
  if (has('bajo') && has('mesada')) t = t.filter(x => x !== 'bajo' && x !== 'mesada').concat('bajomesada');
  if (has('bm')) t = t.filter(x => x !== 'bm').concat('bajomesada');
  if (has('sm')) t = t.filter(x => x !== 'sm');
  return t;
}
function mismosTokens(a: string[], b: string[]): boolean {
  if (!a.length || !b.length || a.length !== b.length) return false;
  const sb = new Set(b);
  const sa = new Set<string>();
  for (const t of a) {
    if (sa.has(t) || !sb.has(t)) return false;
    sa.add(t);
  }
  return true;
}
// Nombres que se escriben distinto en la tienda y en la lista (a igual precio).
const ALIAS_VIEJO: Record<string, string> = {
  'PSA Portátil': 'PSA 1-P PORTATIL',
  'PSA Quantum·2': 'PSA QUANTUM 2 SM BIANCO + KIT POSV.',
  'PSA Quantum·2 Bajo Mesada': 'PSA QUANTUM 2 BM BIANCO + KIT POSV.',
  'PSA Senik - Bajo Mesada': 'PSA SENIK BM BIANCO + POSV.',
  'PSA S-1000 II - Bajo Mesada': 'PSA S-1000 2 BM BIANCO + POSV.',
  'PSA SodaBurby - Bianco': 'PSA SODA BURBY BIANCO',
  'Botella SodaBurby': 'BOTELLA PSA P/SODA BURBY X 1100 ML X2 REUTILIZ.',
  'Repuesto Bacterioestático 25 Micrones': 'REPUESTO BACTERIOSTÁTICO 25 MIC S-1000/QUA/SEN',
  'Repuesto Bacterioestático 5 Micrones': 'REPUESTO BACTERIOSTÁTICO 5 MIC S-1000/QUA/SEN',
  'Repuesto Electródo - PSA Iontrix 2': 'ELECTRODO P/IONTRIX',
  'Repuesto FIPOR N° 3 - x 8 unidades': 'FIPOR N° 3 X 8 UNIDADES',
  'Repuesto Jarra Ropot': 'JARRA AGUA OSMOSIS PSA ROPOT',
  'Repuesto PSA Ducha II con KDF': 'REPUESTO PSA DUCHA C/KDF',
  'Repuesto PSA Ducha II con KDF Y POLIFOSFATO': 'REPUESTO PSA DUCHA C/KDF/POLIFOSFATO',
  'Grifería Bicomando - Bajo Mesada': 'GRIFERÍA PSA BICOMANDO',
  'Grifería Bicomando Nero': 'GRIFERÍA PSA BICOMANDO NERO',
  'Botella Térmica 750ml Blanca': 'BOTELLA PSA TÉRMICA 750 CC BLANCA',
  'Botella Térmica 750ml Negra': 'BOTELLA PSA TÉRMICA 750 CC NEGRA',
  'Mate PSA Blanco': 'KIT MATE 2 PSA BIANCO (MATE+BOMBILLA)',
  'Mate PSA Negro': 'KIT MATE 2 PSA NERO (MATE+BOMBILLA)',
  'Kit Matero PSA- Blanco': 'SET MATE 2 PSA BIANCO (TERMO+MATE+BOMBILLA)',
  'Kit Matero PSA- Negro': 'SET MATE 2 PSA NERO (TERMO+MATE+BOMBILLA)',
  'Termo PSA Blanco': 'TERMO 2 PSA BLANCO',
  'Termo PSA - Negro': 'TERMO 2 PSA NEGRO'
};

interface CatProd { sku?: string; nombre: string; precio?: number; lista?: number; url?: string; grupo?: string; plan_canje?: number | null; seccion?: string }

function mergeCatalogo(base: CatProd[], lista: ProdLista[], vigencia: string): CatProd[] {
  const viejos = base.map(p => ({ p, tk: tokensNombre(ALIAS_VIEJO[p.nombre] || p.nombre) }));
  const usados = new Set<number>();
  const salida: CatProd[] = [];
  for (const np of lista) {
    const ntk = tokensNombre(np.nombre);
    let match = -1;
    for (let i = 0; i < viejos.length; i++) {
      if (usados.has(i)) continue;
      if (mismosTokens(viejos[i].tk, ntk)) { match = i; break; }
    }
    if (match >= 0) {
      usados.add(match);
      const vp = viejos[match].p;
      salida.push({
        sku: vp.sku, nombre: np.nombre, precio: np.precio!, lista: np.precio!,
        url: vp.url, grupo: vp.grupo, plan_canje: np.plan_canje, seccion: np.seccion
      });
    } else {
      salida.push({
        sku: '', nombre: np.nombre, precio: np.precio!, lista: np.precio!,
        url: '', grupo: SECCION_A_GRUPO[np.seccion] || 'otros', plan_canje: np.plan_canje, seccion: np.seccion
      });
    }
  }
  for (let i = 0; i < viejos.length; i++) {
    if (usados.has(i)) continue;
    const vp = viejos[i].p;
    salida.push({
      sku: vp.sku, nombre: vp.nombre, precio: vp.precio, lista: vp.lista != null ? vp.lista : vp.precio,
      url: vp.url, grupo: vp.grupo, plan_canje: vp.plan_canje ?? null, seccion: vp.seccion || 'Tienda'
    });
  }
  void vigencia;
  return salida;
}

// ----------------------- main -----------------------

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRole) return json({ error: 'Servicio no configurado.' }, 503);
  const supabase = createClient(supabaseUrl, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } });

  // Auth: distribuidor activo (mismo que antes)
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

  // Catálogo vigente (para el check 1 vez por día y para conservar skus)
  let actual: any = null;
  try {
    const { data } = await supabase.storage.from(BUCKET).download(CAT_FILE);
    if (data) actual = JSON.parse(await data.text());
  } catch (_) {}
  if (!actual) {
    try {
      const r = await fetch('https://somospopups.github.io/appi/psa-catalogo.json?nocache=' + Date.now());
      if (r.ok) actual = await r.json();
    } catch (_) {}
  }
  if (!actual?.productos?.length) {
    return json({ error: 'No se pudo leer el catálogo base.' }, 500);
  }
  if (actual.actualizado === fechaAR()) {
    return json({ ok: true, yaActualizado: true, actualizado: actual.actualizado, mensaje: `Ya está al día (${actual.actualizado}). Volvé mañana.` });
  }

  // 1) Descargar y parsear la lista "Precios Sugeridos con Acuerdo"
  let lista: { vigencia: string; productos: ProdLista[] };
  try {
    const texto = await textoDePDF(PDF_URL);
    lista = parseListaTexto(texto);
  } catch (e) {
    return json({ error: 'No se pudo leer el PDF de la lista: ' + String((e as any)?.message || e) }, 502);
  }
  if (!lista.productos.length) {
    return json({ error: 'El PDF se leyó pero no se reconocieron productos (¿cambió el formato?). El catálogo anterior se mantiene.' }, 502);
  }

  // 2) Fusionar: lista con acuerdo (precios de la primera columna) + lo que
  //    solo existe en la tienda (se conserva con su precio).
  const nuevos = mergeCatalogo(actual.productos as CatProd[], lista.productos, lista.vigencia);
  const nuevaFecha = fechaAR();

  // 3) Cotejo (psa-precios.json): precios de la lista para los SKUs que figuran
  const SKUS: Record<string, string> = {
    mini: '611030410', vero: '611030420', senior: '611010580', senior4: '611010510',
    s1000: '611120200', senik: '611030540', quantum2: '611030620', c3: '611030430',
    rinnova: '611100240', 'rinnova-poli': '611100250', portatil: '611020010',
    stopper: '611030060', poli2: '612280190', soda: '617110040', iontrix: '611290050'
  };
  const porSku = new Map<string, CatProd>();
  for (const p of nuevos) if (p.sku) porSku.set(String(p.sku), p);

  let preciosObj: any = null;
  try {
    const { data } = await supabase.storage.from(BUCKET).download(PRE_FILE);
    if (data) preciosObj = JSON.parse(await data.text());
  } catch (_) {}
  if (preciosObj) {
    preciosObj.actualizado = nuevaFecha;
    preciosObj.precios = preciosObj.precios || {};
    preciosObj.nombres = preciosObj.nombres || {};
    for (const [k, sku] of Object.entries(SKUS)) {
      const prod = porSku.get(sku);
      if (prod && prod.precio) {
        preciosObj.precios[k] = prod.precio;
        preciosObj.nombres[k] = prod.nombre;
      }
    }
  }

  // 4) Planes: vigencias desde el PDF de promociones de la tienda (como antes)
  let planesObj: any = null;
  try {
    const { data } = await supabase.storage.from(BUCKET).download(PLAN_FILE);
    if (data) planesObj = JSON.parse(await data.text());
  } catch (_) {}
  if (planesObj) {
    planesObj.actualizado = nuevaFecha;
    try {
      const r = await fetch('https://tienda.psa.com.ar/promociones_vigentes');
      if (r.ok) {
        const promoHtml = await r.text();
        const mPdf = promoHtml.match(/https:\/\/contenidos\.psa\.com\.ar\/[^"'\s]+\.pdf/i) || promoHtml.match(/https:\/\/[^"'\s]+legales[^"'\s]+\.pdf/i);
        if (mPdf) {
          const mDate = mPdf[0].match(/(\d{1,2})[-_](\d{1,2})[-_](\d{4})/);
          if (mDate) {
            const d1 = parseInt(mDate[1], 10), m1 = parseInt(mDate[2], 10), y1 = mDate[3];
            const nuevaVig = `${d1}-${MESES[m1 - 1]}-${y1}`;
            if (!String(planesObj.vigencia || '').includes(nuevaVig)) {
              if (planesObj.vigencia && planesObj.vigencia.includes(' al ')) {
                const fin = String(planesObj.vigencia).split(' al ')[1] || '';
                planesObj.vigencia = `${nuevaVig} al ${fin}`;
              } else {
                planesObj.vigencia = nuevaVig;
              }
            }
          }
          planesObj.fuente = 'https://tienda.psa.com.ar/promociones_vigentes';
        }
      }
    } catch (_) { /* mantiene la vigencia anterior */ }
  }

  // 5) Publicar (upsert) en Storage público
  const nuevoCat = {
    actualizado: nuevaFecha,
    fuente: PDF_URL,
    vigencia: lista.vigencia,
    productos: nuevos
  };
  const up = async (name: string, obj: unknown) => {
    const blob = new Blob([JSON.stringify(obj, null, 2) + '\n'], { type: 'application/json' });
    const { error } = await supabase.storage.from(BUCKET).upload(name, blob, { upsert: true, contentType: 'application/json; charset=utf-8' });
    if (error) throw new Error(error.message || String(error));
  };
  try {
    await up(CAT_FILE, nuevoCat);
    if (preciosObj) await up(PRE_FILE, preciosObj);
    if (planesObj) await up(PLAN_FILE, planesObj);
  } catch (e) {
    return json({ error: 'No se pudo guardar el catálogo: ' + String((e as any)?.message || e) }, 500);
  }

  const fusionados = nuevos.filter(p => p.sku).length;
  return json({ ok: true, yaActualizado: false, actualizado: nuevaFecha, vigencia: lista.vigencia, total: nuevos.length, conSku: fusionados, soloLista: nuevos.length - fusionados });
});
