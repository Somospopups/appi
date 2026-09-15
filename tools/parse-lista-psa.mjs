// APPI · Parser de la lista "Precios Sugeridos con Acuerdo" (PDF de PSA).
// Trabaja sobre el TEXTO extraído del PDF (una línea por renglón).
// Lógica idéntica a la que corre en la función de Supabase.

const SECCION_KNOWN = [
  'Purificadores', 'Gasificador', 'Purificador Osmosis Inversa', 'Purificador de Aire',
  'Accesorios para la instalación', 'Reposiciones', 'Repuestos/mantenim. productos',
  'Servicios', 'Botellas', 'Material Promocional', 'Análisis de laboratorio', 'Olivare'
];

// Cabeceras / ruido que NO son secciones
function esRuido(linea) {
  if (!linea) return true;
  if (linea.startsWith('Contado')) return true;
  if (linea.startsWith('Vigencia')) return true;
  if (linea.startsWith('TC')) return true;
  if (/^Precio\s+Val\./.test(linea)) return true;
  if (/^\d+$/.test(linea)) return true;                 // número de página
  if (/Cuotas sin interes/.test(linea)) return true;
  return false;
}

// "1.100.000,00" o "9 .700,00" → 1100000
export function parsePrecioAR(raw) {
  const limpio = String(raw || '').replace(/\s+/g, '');
  const m = limpio.match(/([\d.]+),(\d{1,2})$/);
  if (!m) return null;
  const entero = parseInt(m[1].replace(/\./g, ''), 10);
  if (!Number.isFinite(entero)) return null;
  return entero;
}

// Extrae los precios de una línea de producto.
// Devuelve { nombre, canje, precios[] } o null si no es una línea de producto.
export function parseLinea(linea) {
  if (!linea.includes('$')) return null;
  const partes = linea.split(/\s*\$\s*/);
  if (partes.length < 3) return null;           // al menos nombre + 2 precios
  let nombre = partes[0].trim();
  if (!nombre || nombre === 'Vigencia: Desde el') return null;
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

// Parser completo: texto del PDF → { vigencia, secciones, productos }
// productos: [{ nombre, seccion, precio, plan_canje, precios }]
//   precio       = PRIMERA columna (Contado - Débito y 1 cuota TC)
//   plan_canje   = precio de la variante "Plan canje" (si existe)
//   precios      = las 5 columnas: [contado, valCuota1, valCuota3, precio6, valCuota6]
export function parseListaPDF(texto) {
  const lineas = String(texto || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const mVig = texto.match(/Vigencia:\s*Desde el\s+(\d{1,2} de [a-záéíóú]+ de \d{4})/i);
  const vigencia = mVig ? mVig[1].trim() : '';
  const productos = new Map();   // nombre → producto
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
      if (parsed.canje) {
        p.plan_canje = parsed.precios[0];
      } else if (p.precio == null) {
        p.precio = parsed.precios[0];
        p.precios = parsed.precios;
      }
      continue;
    }
    if (esRuido(linea)) continue;
    // línea sin precio → sección (la lista trae las secciones conocidas de PSA)
    seccion = linea;
  }
  const out = [...productos.values()].filter(p => p.precio != null);
  return { vigencia, productos: out };
}

// ---- modo script: parsear un archivo de texto y volcar JSON ----
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const fs = await import('node:fs');
  const [,, archivo, salida] = process.argv;
  const res = parseListaPDF(fs.readFileSync(archivo, 'utf8'));
  if (salida) fs.writeFileSync(salida, JSON.stringify(res, null, 2));
  console.log(`vigencia: "${res.vigencia}"`);
  console.log(`productos: ${res.productos.length}`);
  const porSec = {};
  for (const p of res.productos) porSec[p.seccion] = (porSec[p.seccion] || 0) + 1;
  console.log('por sección:', JSON.stringify(porSec));
  const sinPrecio = res.productos.filter(p => p.precio == null);
  console.log('sin precio:', sinPrecio.length);
}
