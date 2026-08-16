const { test, expect } = require('@playwright/test');
const fs = require('fs');

// Archivos que el workflow de backend vuelve a ejecutar en cada despliegue.
const MIGRACIONES = [
  'SUPABASE_INVITACIONES_PERSONA.sql',
  'SUPABASE_ENCUESTAS_GESTION.sql',
  'SUPABASE_INSTALACION_COMPLETA.sql',
  'SUPABASE_RECORDATORIOS.sql',
  'SUPABASE_PERSONAS_CUENTA.sql',
  'SUPABASE_MI_GENTE.sql'
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

// ---------------------------------------------------------------------
// Mi Gente: la migración que unifica Contactos con Mi Gestión.
// ---------------------------------------------------------------------
const MI_GENTE = fs.readFileSync('SUPABASE_MI_GENTE.sql', 'utf8');
const MI_GENTE_LIMPIO = sinComentarios(MI_GENTE);

test('la migración de Mi Gente se puede correr dos veces sin romper', () => {
  // Todo lo que agrega columnas o índices tiene que ser idempotente.
  const addColumns = MI_GENTE_LIMPIO.match(/add\s+column\s+(if\s+not\s+exists\s+)?/gi) || [];
  expect(addColumns.length).toBeGreaterThan(0);
  for (const frag of addColumns) {
    expect(frag.toLowerCase()).toContain('if not exists');
  }

  const createIndex = MI_GENTE_LIMPIO.match(/create\s+(unique\s+)?index\s+(if\s+not\s+exists\s+)?/gi) || [];
  for (const frag of createIndex) {
    expect(frag.toLowerCase()).toContain('if not exists');
  }

  // Las funciones nuevas se borran antes de recrearse (regla del repo).
  const creaciones = MI_GENTE_LIMPIO.match(/create\s+function\s+([\w.]+)/gi) || [];
  for (const frag of creaciones) {
    const nombre = frag.split(/\s+/).pop();
    expect(MI_GENTE_LIMPIO).toMatch(new RegExp(`drop\\s+function\\s+if\\s+exists\\s+${nombre.replace('.', '\\.')}`, 'i'));
  }
});

test('la migración no borra ni vacía datos existentes', () => {
  // Una migración de unificación jamás debería tener estas sentencias.
  expect(MI_GENTE_LIMPIO).not.toMatch(/\bdrop\s+table\b/i);
  expect(MI_GENTE_LIMPIO).not.toMatch(/\btruncate\b/i);
  expect(MI_GENTE_LIMPIO).not.toMatch(/\bdelete\s+from\b/i);
  expect(MI_GENTE_LIMPIO).not.toMatch(/\bdrop\s+column\b/i);
});

test('los estados de Contactos tienen lugar en la tabla unificada', () => {
  // Si falta alguno, al importar salta el check y se pierde el contacto.
  // El check abarca varias líneas: leemos hasta el cierre real de la lista.
  const check = MI_GENTE_LIMPIO.match(/add\s+constraint\s+appi_gestion_estado_valido\s*check\s*\(\s*estado\s+in\s*\(([\s\S]*?)\)\s*\)/i);
  expect(check).not.toBeNull();
  const lista = check[1];
  for (const estado of ['nuevo', 'no_contactado', 'contactado', 'seguimiento', 'presentacion', 'mas_adelante', 'convertido', 'no_interesado']) {
    expect(lista).toContain(`'${estado}'`);
  }
});

test('la importación traduce los estados de Contactos y exige teléfono', () => {
  // Los cinco estados del formulario viejo tienen que mapear a uno válido.
  for (const literal of ['no contactado', 'más adelante', 'no le interesa', 'seguimiento', 'contactado']) {
    expect(MI_GENTE_LIMPIO.toLowerCase()).toContain(`when '${literal}'`);
  }
  // Teléfono obligatorio y validado antes de insertar.
  expect(MI_GENTE_LIMPIO).toMatch(/char_length\(v_digits\)\s+not\s+between\s+8\s+and\s+15/i);
  expect(MI_GENTE_LIMPIO).toMatch(/raise\s+exception/i);
});

test('importar dos veces el mismo contacto no lo duplica', () => {
  // Guarda de reintento por origen_local_id...
  expect(MI_GENTE_LIMPIO).toMatch(/where\s+user_id\s*=\s*v_user\s+and\s+origen_local_id\s*=\s*p_local_id/i);
  // ...y guarda por teléfono ya existente, que actualiza en vez de insertar.
  expect(MI_GENTE_LIMPIO).toMatch(/where\s+user_id\s*=\s*v_user\s+and\s+telefono_normalizado\s*=\s*v_digits/i);
  // El índice único es la red de seguridad final.
  expect(MI_GENTE_LIMPIO).toMatch(/create\s+unique\s+index[\s\S]*origen_local_id/i);
});

test('la función de importar respeta la seguridad por usuario', () => {
  // security invoker + auth.uid(): nunca escribe en la cuenta de otro.
  expect(MI_GENTE_LIMPIO).toMatch(/security\s+invoker/i);
  expect(MI_GENTE_LIMPIO).toMatch(/v_user\s+uuid\s*:=\s*auth\.uid\(\)/i);
  expect(MI_GENTE_LIMPIO).toMatch(/if\s+v_user\s+is\s+null\s+then[\s\S]*raise\s+exception/i);
  // Y no se expone a usuarios anónimos.
  expect(MI_GENTE_LIMPIO).toMatch(/grant\s+execute\s+on\s+function[\s\S]*to\s+authenticated/i);
  expect(MI_GENTE_LIMPIO).not.toMatch(/to\s+anon/i);
});
