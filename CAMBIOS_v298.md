# APPI v298 · El Home sin la tarjeta "Tu impulso"

## Qué cambia

A pedido del equipo, la tarjeta **"Tu impulso"** desaparece del Home: el
recuadro con la racha 🔥, la sugerencia del día ("Te faltan invitados",
"Hoy es la demo"…), los chips de PB/invitados y su botón.

Se retiró completa, no solo de la vista: la lógica que la calculaba
(racha, cultura del mes, sugerencias), sus estilos y la notificación
diaria con ese mismo texto. El Home queda: saludo, porqué, **Tu jornada**
y los avisos de siempre.

**No se pierde nada de datos**: la Cultura de Crecimiento, Las 7 P y el
Panel de Contactos siguen intactos en sus propias pantallas; lo que se va
es solo el recordatorio del Home.

El botón "Avisos" del engranaje sigue funcionando: activa el permiso del
navegador que usan los recordatorios del Histórico y del teléfono
vinculado.

## Pruebas

`home-limpio.spec.js` ahora exige que "Tu impulso" NO esté en el Home.

## App Shell y caché v298

- `298.0.0` · visible `v298` · caché `appi-v298-home-sin-impulso`
