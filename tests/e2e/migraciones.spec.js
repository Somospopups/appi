const { test, expect } = require('@playwright/test');
const fs = require('fs');

// Archivos que el workflow de backend vuelve a ejecutar en cada despliegue.
const MIGRACIONES = [
  'SUPABASE_INVITACIONES_PERSONA.sql',
  'SUPABASE_ENCUESTAS_GESTION.sql',
  'SUPABASE_INSTALACION_COMPLETA.sql',
  'SUPABASE_RECORDATORIOS.sql',
  'SUPABASE_PERSONAS_CUENTA.sql'
];

// Los comentarios de línea esconden el inicio real de cada sentencia y hacen
// que un `-- nota\n update ...` no se reconozca como UPDATE.
function sinComentarios(texto) {
  return texto.replace(/--[^\n]*/g, '');
}

// Extrae el cuerpo de cada función junto con las columnas que declara devolver.
function funcionesConTabla(sql) {
  const encontradas = [];
  const patron = /create\s+(?:or\s+replace\s+)?function\s+([\w.]+)\s*\(([^)]*)\)\s*returns\s+table\s*\(([^)]*)\)([\s\S]*?)\n\$\$;/gi;
  let match;
  while ((match = patron.exec(sql)) !== null) {
    const salidas = match[3]
      .split(',')
      .map(part => part.trim().split(/\s+/)[0])
      .filter(Boolean);
    encontradas.push({ nombre: match[1], salidas, cuerpo: match[4] });
  }
  return encontradas;
}

test('las funciones no dejan referencias ambiguas a sus columnas de salida', () => {
  const problemas = [];

  for (const archivo of MIGRACIONES) {
    if (!fs.existsSync(archivo)) continue;
    const sql = fs.readFileSync(archivo, 'utf8');

    for (const funcion of funcionesConTabla(sql)) {
      // Un `returns table(expires_at ...)` crea una variable con ese nombre.
      // Si una sentencia sobre una tabla la menciona sin calificar, Postgres
      // aborta en tiempo de ejecución con 42702: "column reference is ambiguous".
      for (const sentencia of sinComentarios(funcion.cuerpo).split(';')) {
        const texto = sentencia.trim();
        if (!/^\s*(update|delete\s+from)\s+/i.test(texto)) continue;

        // Solo interesa la condición: en el SET, `expires_at = ...` es válido
        // porque Postgres ya sabe que el destino es una columna de la tabla.
        const desdeWhere = texto.split(/\bwhere\b/i).slice(1).join(' where ');
        if (!desdeWhere) continue;

        for (const salida of funcion.salidas) {
          // Marca `expires_at <= now()` pero no `vigente.expires_at <= now()`.
          const sinCalificar = new RegExp(`(^|[^.\\w])${salida}\\s*(<=|>=|<>|<|>|=|is\\b)`, 'i');
          if (sinCalificar.test(desdeWhere)) {
            problemas.push(`${archivo} · ${funcion.nombre}(): "${salida}" sin calificar en el WHERE de un ${texto.split(/\s+/)[0].toUpperCase()}`);
          }
        }
      }
    }
  }

  expect(problemas, `Referencias ambiguas detectadas:\n${problemas.join('\n')}`).toEqual([]);
});

test('las migraciones se pueden volver a ejecutar sin chocar', () => {
  const problemas = [];

  for (const archivo of MIGRACIONES) {
    if (!fs.existsSync(archivo)) continue;
    const sql = fs.readFileSync(archivo, 'utf8');

    // `create function` sin `or replace` falla con 42723 al repetirse, salvo
    // que antes se elimine exactamente la misma firma.
    const patron = /create\s+function\s+([\w.]+)\s*\(([^)]*)\)/gi;
    let match;
    while ((match = patron.exec(sql)) !== null) {
      const nombre = match[1];
      const tipos = match[2]
        .split(',')
        .map(arg => arg.trim())
        .filter(Boolean)
        .map(arg => {
          const sinDefault = arg.split(/\s+default\s+/i)[0].trim();
          const partes = sinDefault.split(/\s+/);
          return partes[partes.length - 1].toLowerCase();
        });

      const firma = `${nombre}(${tipos.join(',')})`;
      const dropExacto = new RegExp(
        `drop\\s+function\\s+if\\s+exists\\s+${nombre.replace('.', '\\.')}\\s*\\(\\s*${tipos.join('\\s*,\\s*')}\\s*\\)`,
        'i'
      );
      if (!dropExacto.test(sql)) {
        problemas.push(`${archivo}: falta "drop function if exists ${firma}" antes de crearla`);
      }
    }
  }

  expect(problemas, `Migraciones no repetibles:\n${problemas.join('\n')}`).toEqual([]);
});

test('el instalador consolidado y las migraciones sueltas no divergen', () => {
  const completa = fs.readFileSync('SUPABASE_INSTALACION_COMPLETA.sql', 'utf8');
  const persona = fs.readFileSync('SUPABASE_INVITACIONES_PERSONA.sql', 'utf8');

  // El UPDATE corregido debe estar en ambos: si alguien arregla uno solo,
  // una instalación nueva reintroduce el error.
  const esperado = 'update public.appi_encuesta_invitaciones as vigente';
  expect(completa).toContain(esperado);
  expect(persona).toContain(esperado);
  expect(fs.readFileSync('SUPABASE_ENCUESTAS_GESTION.sql', 'utf8')).toContain(esperado);
});
