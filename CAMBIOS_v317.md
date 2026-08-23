# APPI v317 — El gesto de atrás cierra el calendario por la puerta

## El problema (solo en el teléfono)

Abrías el calendario del Home y lo cerrabas con el **botón o gesto de
atrás de Android** (lo más natural del mundo). El calendario desaparecía…
pero el scroll de toda la app quedaba muerto: Mi Equipo, la pantalla más
larga, no se movía más hasta cerrar y volver a abrir APPI.

En la computadora nunca se reprodujo porque ahí no existe el gesto de
atrás: los tests cerraban siempre con la ✕.

## Qué pasaba por dentro

`panel-atras.js` (el módulo que hace que "atrás" cierre el panel abierto
en vez de sacarte de la pantalla) buscaba el botón de cerrar del
calendario y no lo encontraba: el × no tenía `aria-label="Cerrar"`.
Entonces lo cerraba "por la ventana": escondía `#calModal` con `hidden`…
pero la clase `open` vive en el fondo `#calOverlay`, que quedaba puesto
para siempre. El guard de overlays (`overlayDeScrollAbierto`) lo seguía
viendo "abierto" y `liberarScrollCuerpo()` no liberaba nunca más, ni
siquiera al cambiar de pantalla.

## El arreglo

1. **El × del calendario ahora lleva `aria-label="Cerrar"`**: panel-atras
   lo encuentra, lo clickea, y `closeCal()` cierra por la puerta (saca la
   clase `open`, libera el scroll y repinta el Home).
2. **panel-atras vigila `#calOverlay`** (quien lleva la clase `open`) en
   vez de `#calModal`: detecta bien abierto/cerrado.
3. **Cinturón**: `cerrarTodos()` llama a `liberarScrollCuerpo()` al
   terminar; si algún panel se cerró por la ventana, el cuerpo no queda
   trabado (y si todavía hay un overlay a la vista, el guard no libera).
4. **`renderCal()` revive un modal escondido**: si un teléfono quedó con
   `#calModal hidden` de la sesión rota, reabrir el calendario lo
   muestra entero (antes quedaba el fondo oscuro vacío).

## Tests que quedan de guardia

En `panel-atras.spec.js`:

- **el gesto de atrás cierra el calendario por la puerta y el scroll
  sigue vivo (regresión v317)**: abre el calendario, hace `goBack()`, y
  exige fondo sin `open`, cuerpo sin `overflow:hidden` y scroll real en
  Mi Equipo.
- **después del gesto de atrás, el calendario vuelve a abrir entero**:
  reabrir muestra el modal completo, no el fondo vacío.

Los 6 tests anteriores del gesto de atrás siguen en verde.
