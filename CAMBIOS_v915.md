# APPI v915 · Mi avance

## Qué suma esta versión

### Tarjeta Home y pantalla completa

- Nueva tarjeta `Mi avance` inmediatamente debajo del calendario del Home.
- Pantalla completa responsive con cuatro áreas verificables:
  - Orden.
  - Constancia.
  - Movimiento comercial.
  - Resultados.
- Comparación `Cuando empezaste / Hoy`, trabajo silencioso de Appi, resumen semanal y próximo paso recomendado.
- Acceso adicional desde Mi negocio y desde preguntas libres al asistente Appi.

### Acompañamiento comercial

El plan diario se arma con datos existentes y prepara hasta cuatro acciones concretas:

1. Abrir un contacto al que le falta el próximo seguimiento o que vence hoy.
2. Abrir un candidato real para retomar la conversación y proponer una demostración.
3. Preparar una visita a un usuario anterior, con confirmación explícita y fecha.
4. Sumar nombres desde Mi Margarita o preparar un presupuesto desde la Lista.

Appi nunca cambia el estado de una venta ni marca una acción como realizada por abrir una pantalla. El avance se verifica cuando cambia la evidencia real.

### Evidencia y sincronización

- Nueva clave de cuenta: `appi_progreso_v1_<uid>`.
- Línea de partida persistente y fotografías diarias acotadas.
- Eventos comerciales deduplicados; el presupuesto se registra sólo cuando el PDF llegó a generarse.
- Fusión entre dispositivos por identidad: conserva la línea de partida más antigua y une fotografías, eventos e ítems de planes.
- La clave es compartida por titular y socio, y entra en sincronización y backup.

### Experiencia y accesibilidad

- Appi usa su SVG por partes con animación interna útil, no una imagen estática desplazada.
- Modo oscuro, diseño móvil/escritorio y `prefers-reduced-motion`.
- Recorrido guiado específico de Mi avance.

## Archivos principales

- Nuevos: `appi-progreso.js`, `appi-progreso.css`, `tests/e2e/mi-avance.spec.js`.
- Integrados: `index.html`, `data-sync.js`, `lista-precios.js`, `appi-assistant.js`, `appi-tour.js`, `service-worker.js`.

## Versión

- `version`: **915.0.0**
- Pie: **APPI · v915 · Segura**
- Caché: `appi-v915-mi-avance`
