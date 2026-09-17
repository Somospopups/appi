// APPI · Generador de psa-catalogo.json a partir de la lista
// "Precios Sugeridos con Acuerdo" (PDF público de PSA) + catálogo anterior.
//
// Uso: node tools/build-catalogo-psa.mjs <texto-del-pdf> <catalogo-antiguo.json> <salida.json>
//
// Reglas:
//  - La lista del PDF es la fuente de productos y precios (primera columna).
//  - Los productos que ya estaban en el catálogo (tienda) conservan su
//    sku/url y grupo; se fusionan cuando son el mismo producto.
//  - Lo que solo existe en la tienda queda como está (con su precio viejo).
//  - "Plan canje" no es un producto: es el precio alternativo del mismo.

import fs from 'node:fs';
import path from 'node:path';
import { parseListaPDF } from './parse-lista-psa.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const FUENTE_PDF = 'https://dip.psa.com.ar/adjuntos/Image/promociones/exterior/listas-precios/vigente/argentina/argentina-sugeridos-con-acuerdo.pdf';

// Sección del PDF → grupo de la app
const SECCION_A_GRUPO = {
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

// ---------------- normalización (misma lógica que el escáner) ----------------
const ROMANOS = { ii: '2', iii: '3', iv: '4', vi: '6', ix: '9' };
function tokenCat(t) {
  t = String(t || '').replace(/[^a-z0-9]/g, '');
  return ROMANOS[t] || t;
}
function palabrasCat(t) {
  const raw = String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ').split(/\s+/).filter(Boolean).map(tokenCat);
  const out = [];
  for (const tk of raw) {
    // "S-1000" → s1000 · "SENIOR 4" → senior4 (el número va con el modelo)
    if (out.length && /[a-z]$/.test(out[out.length - 1]) && /^[0-9]+$/.test(tk)) out[out.length - 1] += tk;
    else out.push(tk);
  }
  return out;
}
function distEdit(a, b) {
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 2) return 99;
  let prev = [], cur = [];
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    for (let k = 1; k <= n; k++) {
      cur[k] = Math.min(prev[k] + 1, cur[k - 1] + 1, prev[k - 1] + (a[i - 1] === b[k - 1] ? 0 : 1));
    }
    [prev, cur] = [cur, prev];
  }
  return prev[n];
}
function puntosToken(cat, ocr) {
  if (cat === ocr) return 2;
  const d = distEdit(cat, ocr);
  if (d === 1 && Math.min(cat.length, ocr.length) >= 3) return 1.5;
  if (d === 2 && Math.min(cat.length, ocr.length) >= 7) return 1;
  if (cat.length >= 4 && ocr.length >= 4 && (cat.indexOf(ocr) === 0 || ocr.indexOf(cat) === 0)) return 1;
  return 0;
}
const OPCIONALES = new Set(['kit', 'posv', 'k']);

// tokens "esenciales" de un nombre (sin los opcionales de kit/posventa).
// Semántica de variantes de la lista con acuerdo:
//   BM = "Bajo Mesada"  ·  SM = modelo estándar (no lleva marca)
function tokensNombre(nombre) {
  let t = palabrasCat(nombre).filter(x => !OPCIONALES.has(x));
  const has = x => t.includes(x);
  if (has('bajo') && has('mesada')) t = t.filter(x => x !== 'bajo' && x !== 'mesada').concat('bajomesada');
  if (has('bm')) t = t.filter(x => x !== 'bm').concat('bajomesada');
  if (has('sm')) t = t.filter(x => x !== 'sm');
  return t;
}
// Misma identidad de producto: conjuntos de tokens IGUALES (estricto:
// para fusionar no se acepta "Senior" ≈ "Senior4", ni sin-color ≈ con-color).
function mismosTokens(a, b) {
  if (!a.length || !b.length || a.length !== b.length) return false;
  const sb = new Set(b);
  const sa = new Set();
  for (const t of a) {
    if (sa.has(t) || !sb.has(t)) return false;
    sa.add(t);
  }
  return true;
}
// Nombres que se escriben distinto en la tienda y en la lista con acuerdo
// (se confirmó uno a uno, a igual precio).
const ALIAS_VIEJO = {
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

// ---------------- base del nombre (para la fila del escáner) ----------------
function baseDe(nombreCompleto, color) {
  let n = String(nombreCompleto || '').trim();
  n = n.replace(/\s*\+\s*(?:KIT\s+)?K?\.?\s*POSV\.?(?:\s+PLAN\s+CANJE)?\.?$/i, '').trim();
  n = n.replace(/\s+PLAN\s+CANJE\.?$/i, '').trim();
  if (color) {
    const esc = color.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const mDash = n.match(new RegExp('^(.*?)(\\s*-\\s*' + esc + '\\b.*)$', 'i'));
    if (mDash && mDash[1]) return mDash[1].trim();
    const mPal = n.match(new RegExp('\\s*' + esc + '\\b', 'i'));
    if (mPal) n = (n.slice(0, mPal.index) + ' ' + n.slice(mPal.index + mPal[0].length)).replace(/\s+/g, ' ').trim();
  }
  return n;
}

// ---------------- merge ----------------
const [,, archivoTexto, archivoViejo, archivoSalida] = process.argv;
if (!archivoTexto || !archivoViejo || !archivoSalida) {
  console.error('uso: node build-catalogo-psa.mjs <texto> <viejo.json> <salida.json>');
  process.exit(1);
}
const texto = fs.readFileSync(archivoTexto, 'utf8');
const viejo = JSON.parse(fs.readFileSync(archivoViejo, 'utf8'));
const lista = parseListaPDF(texto);
const productosViejos = (viejo.productos || []);

const viejosTokens = productosViejos.map(p => ({
  p,
  tk: tokensNombre(ALIAS_VIEJO[p.nombre] || p.nombre)
}));
const usados = new Set();
const salida = [];
const info = { fusionados: 0, nuevos: 0, soloTienda: [] };

// Foto del producto (la descarga scripts/actualizar-precios-psa.py en
// catalogo-img/{sku}.jpg). Si el catálogo viejo no la llevó pero el archivo
// existe, se recupera igual: la foto no se pierde en el merge.
function fotoDe(vp) {
  const f = vp.foto || '';
  if (f) return f;
  const sku = vp.sku || '';
  if (sku && fs.existsSync(path.join(ROOT, 'catalogo-img', sku + '.jpg'))) return 'catalogo-img/' + sku + '.jpg';
  return '';
}

for (const np of lista.productos) {
  const ntk = tokensNombre(np.nombre);
  // ¿es el mismo producto que alguno del catálogo viejo?
  let match = null;
  for (let i = 0; i < viejosTokens.length; i++) {
    if (usados.has(i)) continue;
    if (mismosTokens(viejosTokens[i].tk, ntk)) { match = i; break; }
  }
  if (match != null) {
    usados.add(match);
    const vp = viejosTokens[match].p;
    info.fusionados++;
    salida.push({
      sku: vp.sku, nombre: np.nombre, precio: np.precio, lista: np.precio,
      url: vp.url, grupo: vp.grupo, plan_canje: np.plan_canje || null, seccion: np.seccion,
      foto: fotoDe(vp)
    });
  } else {
    info.nuevos++;
    salida.push({
      sku: '', nombre: np.nombre, precio: np.precio, lista: np.precio,
      url: '', grupo: SECCION_A_GRUPO[np.seccion] || 'otros', plan_canje: np.plan_canje || null, seccion: np.seccion,
      foto: ''
    });
  }
}
// Lo que solo existe en la tienda (no está en la lista con acuerdo)
for (let i = 0; i < viejosTokens.length; i++) {
  if (usados.has(i)) continue;
  const vp = viejosTokens[i].p;
  info.soloTienda.push(vp.nombre);
  salida.push({
    sku: vp.sku, nombre: vp.nombre, precio: vp.precio, lista: vp.lista != null ? vp.lista : vp.precio,
    url: vp.url, grupo: vp.grupo, plan_canje: null, seccion: 'Tienda',
    foto: fotoDe(vp)
  });
}

const MES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const d = new Date();
const fecha = `${d.getDate()}-${MES[d.getMonth()].toUpperCase()}-${d.getFullYear()}`;

const out = {
  actualizado: fecha,
  fuente: FUENTE_PDF,
  vigencia: lista.vigencia,
  productos: salida
};
fs.writeFileSync(archivoSalida, JSON.stringify(out, null, 2) + '\n');
console.log(`vigencia: "${lista.vigencia}"`);
console.log(`total: ${salida.length}  (fusionados: ${info.fusionados}, nuevos de la lista: ${info.nuevos}, solo tienda: ${info.soloTienda.length})`);
console.log('solo en tienda:');
for (const n of info.soloTienda) console.log('  -', n);
