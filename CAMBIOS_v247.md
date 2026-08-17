# APPI v247 · Motion + Agenda de hoy

## Home: Agenda de hoy (Timeline)

**Commit:** `4190879`

El Home ahora muestra tu jornada como una línea de tiempo (Opción E del probador):

```
💙 Tu porqué

┌─────────────────────────────────┐
│ TU JORNADA                      │
│                                 │
│ ● 9:00 · Resumen en tu teléfono │
│ │   Ya enviado: tus acciones    │
│ │                               │
│ ● Ahora · Jorge espera tu       │
│ │   mensaje                     │
│ │   [Escribir] [Llamar]         │
│ │                               │
│ ● 20:00 · Lucía Vega            │
│     🎤 Demo programada          │
└─────────────────────────────────┘

[Ver todo el Panel ›]
```

### Características
- Timeline visual con línea conectora y puntos de colores
- Botones de acción inline (WhatsApp y Llamar)
- Datos reales del Panel de Contactos
- Si no hay contactos, solo muestra el resumen

## Animaciones y Motion Graphics

### Selector de páginas — Glass Morphism
- Fondo glass con `backdrop-filter: blur(24px) saturate(200%)`
- Indicador deslizante con easing `cubic-bezier(.4,0,.2,1)`
- Íconos SVG con animaciones de escala y opacidad
- Ancho casi completo (520px)

### Transiciones entre páginas — Slide suave
- Salida 320ms + Entrada 380ms con cubic-bezier
- Swipe con feedback visual en tiempo real (±60px)
- Vibración háptica sutil (10ms)

### Títulos animados — Entrada desde arriba
- h1 baja con fade + blur → nítido + bounce
- Subtítulo con 100ms de delay (stagger)
- Contenido sube con fade up

## Navegación atrás con historial real (`6944f8f`)
- Pila de navegación que recuerda hasta 20 vistas
- Sub-vistas vuelven a su padre correspondiente
- Las 4 páginas principales navegan en orden inverso

## Simulador mejorado
- **Valores editables** del plan de negocio (`f4fd684`)
- **Sliders sincronizados** con labels inline (`6b87018`)
- **Explicaciones claras** de cada métrica (`02bcbe7`)

## Botella y Simulador conectados (`1553721`)
- Las tarjetas llaman a `abrirBotella()` y `abrirSimulador()`

## Home compacto (`fd67279`, `34e7355`)
- Saludo y fecha en una línea
- Sin "Tu tablero personal", sin Score, sin 3 números grandes
- Widget de bienvenida reducido

## Tests
- 81/82 tests en verde
