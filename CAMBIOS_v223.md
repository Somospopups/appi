# APPI v223 · Mi Gente

Contactos, Mi Encuesta y Mi Gestión eran tres pantallas separadas que hacían
partes del mismo trabajo. Ahora son una sola: **Mi Gente**.

## Qué cambia para el distribuidor

- **Una sola entrada en el menú.** Donde antes había *Contactos*, *Mi Encuesta*
  y *Mi Gestión*, ahora dice **Mi Gente**. Los accesos viejos siguen andando y
  caen en la pantalla nueva, así que ningún atajo ni notificación queda roto.
- **Lo importante, arriba.** El botón de **Enviar encuesta** y el de **Agregar
  persona a mano** están antes que cualquier otra cosa.
- **Tres solapas en vez de siete pantallas:** *Hoy* (lo que necesita una
  acción), *Todos* (buscar a cualquiera) y *Resultados* (cómo viene el mes, con
  el embudo adentro).
- **Una sola base de datos.** Los contactos vivían sólo en el teléfono. Ahora
  están en la nube: si se pierde o se cambia el celular, la gente no se pierde.

## La mudanza de los contactos viejos

La primera vez que se abre Mi Gente, APPI ofrece subir los contactos guardados
en ese teléfono. Se sube uno por uno con `appi_gente_importar_contacto`, que:

- **exige teléfono** de 8 a 15 números, porque sin número no se puede escribir
  ni llamar;
- **no duplica**: si el número ya está, suma el origen y completa los datos
  vacíos en vez de pisar lo que había;
- **traduce los estados** viejos (`No contactado`, `Más adelante`, `No le
  interesa`) a los de la tabla unificada;
- **se puede correr de nuevo** sin repetir a nadie, gracias a `origen_local_id`.

**Nadie se descarta en silencio.** Los contactos sin teléfono no se suben, pero
quedan a la vista en un cartel con sus nombres y un botón para completarlos.
Cuando se les carga el número, se suben solos.

## Detrás de escena

- Migración de base: `SUPABASE_MI_GENTE.sql` (aditiva e idempotente).
- Un refresco automático ya no puede borrar el botón de enviar en plena
  animación: mientras vuela el avión la pantalla no se redibuja.
- La tarjeta del inicio cuenta desde la nube y cae al conteo local sólo
  mientras queden contactos sin migrar.

## Pruebas

49 pruebas en verde, incluidas 5 nuevas de Mi Gente. Las nuevas se validaron por
mutación: se rompió a propósito el filtro de teléfono, el reparto de los sin
número, la marca de "ya migrado", la cantidad de solapas, el menú lateral y el
cartel de pendientes, y en cada caso la prueba correspondiente falló.

## Arreglo posterior (mismo release)

Al unificar las pantallas apareció una carrera que existía desde antes y que
ahora se hacía visible: el refresco automático de la nube (cada 30 segundos)
volvía a dibujar la pantalla **aunque hubiera una ficha abierta**, y se perdía
lo que la persona estaba escribiendo — la nota, la fecha y la etapa elegida.

Ahora, mientras haya una ficha abierta o una encuesta en pleno envío, el
refresco espera; se aplica solo al cerrar. Hay una prueba que lo cubre y que
falla si se saca la protección.
