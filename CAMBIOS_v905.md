# APPI v905 · Appi se asoma desde el borde derecho

Sólo mejoras: no se quitó nada de lo que ya funcionaba.

## Por qué

En la v904 Appi tenía un botón propio en el dock. El propietario lo vio en el
teléfono y lo rechazó: *"hay algo que no me gusta en lo absoluto: el botón de
Appi en el dock. Me parece que ya se reduce demasiado el tamaño de los
botones"*. Y propuso la forma: *"¿y si se asoma desde la derecha saludando?"*.

## Qué cambió

- **El dock vuelve a ser de cuatro botones.** Se quitó el quinto botón y con
  él las reglas que lo acomodaban: Home, Mi mes, Mi negocio y Herramientas
  recuperan su ancho, su ícono y su etiqueta completos. Una prueba mide que
  cada botón tenga más de 80 px de ancho.
- **Appi se asoma desde el borde derecho de la pantalla.** Está inclinada
  hacia adentro y su costado derecho queda cortado por el borde, como quien
  se arrima desde afuera. Queda entre el contenido y el dock: no tapa la
  navegación.
- **Saluda sola cada tanto.** Se estira un poco más hacia la pantalla,
  levanta la mano que se ve (la izquierda del dibujo, con su propia animación
  `goWaveArmL`) y aparece la viñeta *"¡Hola! Tocame y hablamos."*. El primer
  saludo del día llega a los dos segundos de abrir la app; después, cada 15
  segundos como mucho y nunca con el panel abierto ni con la app en segundo
  plano.
- **Un toque la saca de su escondite:** se desliza hasta pararse arriba del
  dock y abre el panel, en el mismo lugar de siempre.
- **Al cerrar el panel vuelve sola** al borde derecho, sin quedar en el medio
  de la pantalla.
- **Los saludos se pueden apagar:** `APPIAssistant.saludos(false)` los corta
  en el acto (y `saludos(true)` los vuelve a prender).
- **Versión:** `905.0.0`, caché `appi-v905-asomada`, pie *APPI · v905 ·
  Segura* y todos los `?v=905`.

## Pruebas

- *"Appi se asoma desde el borde derecho y no achica el dock"*: que el dock
  tenga otra vez cuatro botones de más de 80 px, que ella esté cortada por el
  borde derecho y que al cerrar el panel vuelva sola.
- *"cuando saluda levanta la mano hacia la pantalla"*: que la mano anime con
  `goWaveArmL`, que aparezca la viñeta y que no salude con el panel abierto.
- Total de la asistente: **20/20** (12 del panel, 6 de la gotita y 2 nuevos) y
  **9/9** del buscador.

## Archivos

- Nuevos: `CAMBIOS_v905.md`.
- Modificados: `appi-assistant.js`, `appi-assistant.css`, `appi-gotita.css`,
  `index.html`, `service-worker.js`, `package.json`, `README.md`,
  `tests/e2e/appi-assistant.spec.js`, `tests/e2e/appi-gotita.spec.js`,
  `tests/e2e/appi-buscar.spec.js`.
