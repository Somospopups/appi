# APPI v226 · ¿Qué WhatsApp utilizás?

Ajustes del selector de WhatsApp y orden en el home, a pedido del uso real.

## Cambios

- **El ítem del engranaje ⚙️ se llama "¿Qué WhatsApp utilizás?"**, y si ya
  hay una elección guardada la muestra al lado (· WhatsApp / · WhatsApp
  Business) para saber de un vistazo por dónde salen los mensajes.
- **En el diálogo, la opción vigente queda marcada** con el color de APPI.
  Antes las dos opciones se veían iguales y no se sabía cuál estaba activa.
  Tocar la otra la cambia en el momento y queda guardada.
- **Las dos opciones quedan centradas y del mismo tamaño.** Con la grilla de
  tres columnas heredada, el par quedaba apoyado a la izquierda con un hueco
  a la derecha.
- **Home sin duplicados:** Panel de Contactos vivía dos veces (como tarjeta
  en Mi negocio y como acceso en Mis herramientas). Queda solo en
  **Mi negocio**, junto a Mi Equipo, Histórico y Usuarios.

## Pruebas

55 en verde, con dos nuevas:

- una mide con bounding boxes que el par de opciones queda centrado respecto
  de la tarjeta, que ambas miden lo mismo y que la preferencia guardada
  aparece marcada (y cambia al tocar la otra);
- otra verifica que el home muestre Panel de Contactos una sola vez, dentro
  de Mi negocio, y que Mis herramientas conserve Grabadora y Notas sin el
  acceso duplicado.
