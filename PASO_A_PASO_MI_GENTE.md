# Mi Gente — Paso a paso

Guía para unificar **Contactos + Mi Gestión + Mi Encuesta** en una sola pantalla.

Son 3 pasos. El más largo lleva 2 minutos. **No hace falta que sepas SQL**: es copiar y pegar.

---

## Paso 1 — Copiar la migración

Abrí este link. Es el archivo con las instrucciones para la base de datos:

**https://raw.githubusercontent.com/Somospopups/appi/main/SUPABASE_MI_GENTE.sql**

Seleccioná todo el texto y copialo:

- **En la computadora:** `Ctrl + A` y después `Ctrl + C`
- **En el celular:** mantené apretado sobre el texto → *Seleccionar todo* → *Copiar*

> Es texto plano, se ve feo. Está bien, es así.

---

## Paso 2 — Pegarlo en Supabase y ejecutar

Abrí el editor de SQL de tu proyecto:

**https://supabase.com/dashboard/project/tqwnjfnaywjmyfplvatm/sql/new**

1. Pegá todo lo que copiaste en el recuadro grande (`Ctrl + V`).
2. Apretá el botón verde **RUN** (abajo a la derecha). También sirve `Ctrl + Enter`.
3. Esperá unos segundos.

### Cómo sé que salió bien

Abajo tiene que aparecer un cartel verde que dice **Success. No rows returned**.

Eso es correcto: esta migración prepara la base, no devuelve datos.

### Si aparece algo en rojo

Copiame el texto del error y te lo resuelvo. **No pasa nada malo**: la migración está escrita para no romper nada aunque falle a la mitad, y se puede volver a ejecutar las veces que haga falta.

---

## Paso 3 — Avisame

Escribime **"listo"** y sigo con:

- la importación de tus contactos del teléfono a la nube;
- la pantalla nueva **Mi Gente** unificada.

---

## Preguntas que te podés estar haciendo

**¿Esto borra algo?**
No. La migración solo **agrega** columnas y una función nueva. No tiene ninguna instrucción de borrar ni de vaciar: hay una prueba automática que lo verifica en cada despliegue.

**¿Puedo ejecutarla dos veces por error?**
Sí, sin problema. Está escrita para eso (`if not exists` en todo). Si la corrés de nuevo, no duplica nada.

**¿Mis contactos actuales se pierden?**
No. Este paso ni los toca: solo prepara el lugar donde van a entrar. La importación es el paso siguiente, y ahí te voy a mostrar qué se va a mover antes de mover nada.

**¿Y los contactos sin teléfono?**
Elegiste que el teléfono sea obligatorio. Cuando importemos, **te voy a listar los que no tengan número** para que decidas uno por uno: completar el teléfono o dejarlos afuera. No se descarta nada en silencio.

---

## Qué hace la migración, en criollo

| Qué agrega | Para qué |
|---|---|
| Campo **interés** | Guardar el "¿Por qué lo llamamos?" (Producto / Negocio / Canjes / Ambas) que hoy solo existe en Contactos |
| Estados **no_contactado** y **mas_adelante** | Los dos estados de Contactos que la nube todavía no aceptaba |
| Campo **origen** | Saber qué persona vino de Contactos del teléfono y cuál de una encuesta |
| Función **importar contacto** | Traer cada contacto sin duplicar: si la persona ya existe por teléfono, la respeta y suma la info en vez de pisarla |

---

## Links útiles

- Migración (para copiar): https://raw.githubusercontent.com/Somospopups/appi/main/SUPABASE_MI_GENTE.sql
- SQL Editor de Supabase: https://supabase.com/dashboard/project/tqwnjfnaywjmyfplvatm/sql/new
- Ver el archivo en GitHub: https://github.com/Somospopups/appi/blob/main/SUPABASE_MI_GENTE.sql
- La app: https://somospopups.github.io/appi/
