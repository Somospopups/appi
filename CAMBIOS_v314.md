# APPI v314 · Las tareas del calendario tienen hora

## Qué cambia

Al agendar una tarea en el calendario del Home ahora podés elegir la
**hora** (opcional), con el selector al lado del texto:

- La tarea aparece en la lista del día con su **chip de hora**.
- El día se ordena solo: primero las tareas con hora (de más temprano a
  más tarde), después las sueltas.
- En **Tu jornada**, la tarea sale en la línea de tiempo con su hora en
  lugar del 📌 (que queda para las tareas sin hora).
- Sin hora funciona todo exactamente como antes.

Las tareas siguen sincronizando con la nube como siempre (la clave del
calendario ya estaba en data-sync).

## Pruebas

Nueva en `home-limpio.spec.js`: tres tareas (18:30, 09:15 y una sin
hora) quedan ordenadas 09:15 → 18:30 → suelta, con sus chips, y la
línea de tiempo del Home muestra la hora.

## App Shell y caché v314

- `314.0.0` · visible `v314` · caché `appi-v314-tareas-con-hora`
