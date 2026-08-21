# APPI v293 · Flechitas para pasear entre las tareas del día

## Qué cambia

En el carrusel de acciones del día (Garantías) ahora hay **flechitas ‹ ›**
alrededor del contador ("2 de 7") para ir y volver entre las tareas:

- **Pasear no es marcar**: moverse con las flechas no registra nada; las
  tareas siguen pendientes hasta que se tocan ✓, ✗ o Mandar.
- En la primera tarea la ‹ está apagada; en la última se apaga la ›:
  al final se llega marcando, no paseando.
- **Volver a una tarea ya marcada la muestra con su marca** ("✓ Marcada
  como hecha · si te confundiste, tocá la otra") y se puede **corregir**:
  la marca se pisa, no se duplica.
- El resumen final ("N acciones hechas · M sin hacer") ahora se cuenta de
  las marcas reales, así navegar o corregir no infla los números.

## Pruebas

- Nuevas en `mensajes-usuarios.spec.js`: las flechas navegan sin marcar
  (el resumen del día no cambia), los topes se apagan, y volver muestra la
  marca y deja corregirla sin duplicar el cómputo.

## App Shell y caché v293

- Versión del paquete: `293.0.0`
- Versión visible y registro del Service Worker: `v293`
- Caché: `appi-v293-flechitas-de-tareas`
