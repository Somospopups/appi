# APPI v247 · Motion

## Animaciones y Motion Graphics

### Selector de páginas — Glass Morphism
- **Fondo glass**: `backdrop-filter: blur(24px) saturate(200%)` con
  transparencia sutil, bordes luminosos y sombras multicapa.
- **Indicador deslizante**: pastilla sólida que se desliza con easing
  `cubic-bezier(.4,0,.2,1)` al botón activo — como un tab indicator
  de Material Motion.
- **Aparece animado**: entrada con `scale(.9) → scale(1)` + bounce
  suave al cargar la app.
- **Íconos activos**: escalan a `1.1` con bounce y se iluminan.
- **Íconos inactivos**: opacidad reducida y escala normal.
- **Tap feedback**: el botón no activo se encoge a `.92` al presionar.

### Transiciones entre páginas — Slide suave
- **Salida**: la página actual se desliza 35% en la dirección del swipe
  con fade out y `cubic-bezier(.4,0,1,1)`.
- **Entrada**: la página nueva entra desde el lado opuesto con
  `cubic-bezier(0,0,.2,1)` (decelerate).
- **Duración**: 320ms salida + 380ms entrada = transición fluida.
- **Feedback háptico**: vibración sutil (10ms) al cambiar.

### Títulos animados — Entrada desde arriba
- **h1/título**: baja 24px con fade + blur(4px) → blur(0), con
  bounce suave en `cubic-bezier(.34,1.3,.64,1)`.
- **Subtítulo/script**: baja 16px con 100ms de delay (stagger).
- **Descripción/mes**: baja 16px con 180ms de delay.
- **Contenido** (cards, grids, números): sube 20px con fade up y
  120ms de delay.

### Swipe con feedback en tiempo real
- Mientras arrastrás el dedo, la página actual se mueve proporcionalmente
  (máximo ±60px, 30% del gesto) — como un carrusel nativo.
- Al soltar, vuelve suavemente si no alcanza el threshold de 50px.
- Al superar el threshold, ejecuta la transición completa.

### PC sin cambios
- La sidebar sigue siendo la navegación principal.
- El selector y las animaciones de página no aparecen en ≥ 1024px.

## Tests
- 81/82 tests en verde.

## Navegación atrás con historial real

**Commit:** `6944f8f`

### Problema
Al usar el gesto de "atrás" del teléfono, la app siempre volvía al Home directamente, sin importar desde qué pantalla venías.

### Solución
Implementada una pila de navegación real que recuerda el historial completo:

- **Navegación entre las 4 páginas principales:** Al ir Home → Mi Mes → Mi Negocio → Herramientas y presionar atrás, vuelve en orden inverso (Herramientas → Mi Negocio → Mi Mes → Home).

- **Sub-vistas vuelven a su padre:**
  - Rueda/Evaluar → Mi Mes
  - 7P/Detalle → 7P
  - Presupuesto/Histórico → Presupuesto
  - Equipo/Histórico/Usuarios/Panel → Mi Negocio
  - 8 Pasos/Sueños/Demo/Grabadora/Notas → Herramientas

- **Pila limitada a 20 entradas** para evitar memory leaks en sesiones largas.

- **Tests actualizados:** 6/6 tests de home-limpio pasando.

### Comportamiento
1. Cada vez que llamás `showView()`, se agrega la vista a la pila
2. Al presionar atrás (gesto o botón), se hace pop de la pila
3. Si la pila está vacía o estás en Home, no hace nada (evita salir de la app)
4. Los modales se cierran primero antes de navegar atrás
