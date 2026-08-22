# APPI v308 · Todos los enlaces del mazo son auto-dirigibles

## La regla

Tocar un renglón de una notificación te deja **en la persona o acción
exacta**, no en una pantalla general:

- 📅 **Tu jornada** → tocás a Jorge y se abre el Panel **con su ficha**:
  WhatsApp, llamar, notas e historial a un toque.
- 📇 **Panel de Contactos** → cada contacto nuevo abre **su ficha**; el
  renglón de vencidos abre el Panel en la vista **Hoy**.
- 🎯 **Oportunidades** → tocás a la persona y sale **WhatsApp con la
  propuesta del Bonus** ("estás en 11 PB… ¡a nada del Bonus! ¿te ayudo a
  llegar?"), con el teléfono validado por APPITel.
- 🎂 **Cumpleaños** → WhatsApp con el saludo (desde v307).
- 👥 **Mi Equipo** → "Cargar mi avance" abre Mi Equipo **posicionado en
  la Cultura del mes**.
- 💧 **Usuarios** → la tarjeta ahora lista los motivos pendientes
  (🔧 retrolavados, ⏰ por vencer, 🎂 saludos) y tocar uno abre **el
  carrusel de ese motivo**, listo para mandar y marcar ✓/✗.

Para lograrlo, el Panel expone `abrirContacto(id)`: abre Mi Gestión con
el drawer de esa persona ya desplegado.

## Pruebas

La prueba del renglón de la jornada ahora exige la ficha de Jorge
abierta (con sus botones de contacto), además de la navegación.

## App Shell y caché v308

- `308.0.0` · visible `v308` · caché `appi-v308-enlaces-directos`
