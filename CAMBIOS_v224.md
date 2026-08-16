# APPI v224 · Panel de Contactos

Ajustes sobre la pantalla unificada de v223, a pedido del uso real.

## Cambios

- **Se llama Panel de Contactos** (antes "Mi Gente"), en el menú, en el inicio y
  en el encabezado de la pantalla.
- **Vive en “Mi negocio”**, junto a Mi Equipo, Histórico y Usuarios. Antes
  estaba en "Mis herramientas".
- **Se sacó el cartel** "Tu gente, en un solo lugar / Tu trabajo de hoy": ocupaba
  media pantalla y no decía nada que la persona no supiera.
- **Los dos accesos, lado a lado y del mismo tamaño**: *Enviar encuesta* y
  *Agregar contacto*. En pantallas muy angostas (menos de 360px) se apilan.
- **Nueva aclaración bajo los botones:** la encuesta es una **herramienta de
  retorno**, no reemplaza el trabajo cara a cara — el contacto de verdad se
  genera en la demostración.
- **Las tres solapas quedaron centradas.** Estaban en una grilla de cuatro
  columnas heredada de cuando existía la solapa *Embudo*, así que las tres se
  apoyaban a la izquierda con un hueco a la derecha.

## El alta de contactos: por qué fallaba

Cargar a alguien abría **dos ventanitas encadenadas** (nombre, después
teléfono). Si una se cancelaba o el dato salía mal, el trabajo se perdía y el
error llegaba como un mensaje crudo de la base.

Ahora es **un formulario a la vista**, dentro de la misma pantalla:

- se ve todo lo que se está cargando, con nombre, teléfono, interés y notas;
- el error aparece **al lado del campo** que lo causó y **no borra lo escrito**;
- los mensajes de la base se traducen: un teléfono repetido dice *"Ya tenés a
  alguien con ese teléfono"*, no `duplicate key value violates unique
  constraint`;
- si falta correr la migración en Supabase, lo dice con esas palabras;
- el formulario se limpia **recién cuando la nube confirmó** que guardó.

También se protegió el formulario del refresco automático: mientras está
abierto, la pantalla no se redibuja (igual que la ficha de contacto en v223).

## Pruebas

51 en verde, con 7 de Panel de Contactos. Validadas por mutación: se devolvió el
cartel, se sacó la aclaración de la encuesta, se apilaron los botones, se
descentraron las solapas, se movió la entrada del menú y se mostró la jerga
cruda de la base; en los seis casos la prueba correspondiente falló.
