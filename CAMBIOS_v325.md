# APPI v325 — La tarjeta especial se viste de gala y Cumpleaños lleva al mes

## Qué pidió el administrador

1. Que la **primera tarjeta** (💙 Tu impulso de hoy) sea más linda, se
   sienta diferente y el mensaje llegue bien, sin espacio en blanco.
2. Que el botón de la tarjeta de **Cumpleaños** diga "Revisar los
   cumpleaños del mes" y te lleve directo ahí.

## Cómo quedó

### La tarjeta especial (v325)
- **Fondo pleno azul-violeta** (degradado 150°), única del mazo con
  vestido propio (`.ht-card.ht-esp`): se siente otra cosa apenas
  aparece.
- **Frase grande y protagonista**: 21px, blanca con sombra suave, con
  una gran comilla decorativa arriba a la izquierda.
- **Sin espacio muerto**: el cuerpo es una columna flex y la frase se
  centra con `margin:auto`; los chips de progreso (💎 PB, 🤝 invitados,
  ✓ acciones) quedan abajo como píldoras vidriosas.
- **💙 de marca de agua** gigante y translúcido abajo a la derecha.
- Modo oscuro con su propio degradado más profundo.

### El botón de Cumpleaños
- Dice **"Revisar los cumpleaños del mes"** y hace `abrirEquipo()` +
  scroll suave hasta la lista `#bdayListWrap` (reintenta hasta que la
  pantalla termina de pintar).
- Los renglones siguen saludando por WhatsApp directo a cada persona
  (y avisando si no hay teléfono, v322).

## Tests

- **la tarjeta especial se viste distinta y sin espacio muerto (v325)**
  — clase ht-esp solo en la primera, fondo con gradiente, frase blanca,
  comilla y marca de agua presentes, y margin auto repartiendo espacio.
- **el botón de Cumpleaños dice Revisar los cumpleaños del mes y va a
  Mi Equipo (v325)** — texto exacto, navega y la lista del mes queda a
  la vista.
- 29 tests del Home/mazo en verde.
