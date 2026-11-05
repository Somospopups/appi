# APPI v919 · Tarjetas primero

## Objetivo

Que las tarjetas inteligentes del Home sean lo primero que aparece al abrir APPI. Es la función estrella y estaba quedando atrás del arranque: con la sesión guardada de más de 7 días —lo habitual en quien abre la aplicación cada tanto— el mazo esperaba a que la nube autorizara la sesión antes de mostrarse.

## Diagnóstico medido

Se instrumentó el arranque real en Chromium con perfil de distribuidora, planilla sembrada en el teléfono y la nube de Supabase simulada, midiendo `performance.now()` desde la navegación hasta la primera tarjeta en el DOM. Sobre v918:

| Escenario | Home activo | Primera tarjeta |
| --- | --- | --- |
| Sesión fresca, red rápida | 271 ms | 625 ms |
| Sesión vencida (>7 días), red rápida | 210 ms | 635 ms |
| Sesión vencida, red lenta de 9 s | 196 ms | **9.433 ms** |
| Sesión vencida, cuenta de 1500 clientes y red lenta | 181 ms | **9.276 ms** |
| Sesión vencida, nube que no contesta | 173 ms | **no apareció en 25 s** |

El Home se dibuja siempre en unos 200 ms. Lo que se demoraba era el mazo, y la demora no dependía del tamaño de la planilla sino de la red.

Dos causas, las dos en `home-tarjetas.js`:

1. **La puerta exigía autorización remota.** `appTerminoDeCargar()` devolvía `false` mientras `APPIAuth.isLocallyAuthorized()` fuera `false`. Con la sesión de más de `offlineDays` (7) eso depende de un pedido a la nube, y ni `auth-client.js` ni `data-sync.js` tienen tiempo máximo de espera: el mazo quedaba colgado de la red el tiempo que la red quisiera.
2. **La espera se rendía a los 6,4 s.** `alEntrarAlHome()` cortaba con `if (++intentos > 400) return;` (400 intentos de 16 ms). Como `autoAbierto` ya quedaba en `true`, el mazo no volvía a abrirse en toda la visita salvo que un `showView('view-home')` posterior lo reiniciara. Con la nube colgada eso no ocurre nunca: la distribuidora se quedaba sin tarjetas hasta salir del Home y volver a entrar.

Ninguna de las dos cosas se introdujo en v916-v918: el tope de 400 intentos viene de v828 y `home-tarjetas.js` no fue tocado por v916, v917 ni v918. Lo que cambió en v918 es que el Home se dibuja antes, así que el contraste entre un Home listo en 200 ms y un mazo que llega a los 9 s se volvió visible.

## Cambios principales

### El mazo ya no espera a la nube

- `appTerminoDeCargar()` deja de exigir `isLocallyAuthorized()`. Sigue bloqueando la pantalla de arranque visible, el overlay de elección de persona y `window.__appiCubriendoInicio`.
- Las tarjetas se arman con lo que hay guardado en el teléfono. No hizo falta agregar nada para eso: `listaUsuariosHome()` ya lee la planilla de `usuarios_garantias` en `localStorage` cuando `window.usuariosU` todavía está vacío, que es justamente el estado del camino rápido de v918 (la planilla se analiza a los 8 s del arranque).
- Se conserva el bloqueo por elección de titular/socio: `needsPersonChoice()` trabaja sobre el perfil guardado, sin red, así que sigue siendo correcto y evita mostrar los números de otra persona. Tampoco hay riesgo de superposición, porque `#htOverlay` es un bloque relativo dentro de `#homeLimpio` mientras que `#personChoiceOverlay` tiene `z-index:10050`.

### La espera no se rinde

- Sale el tope de 400 intentos. La espera reintenta mientras la aplicación viva, con un escalonado que abre al instante cuando se puede y después no gasta batería: 16 ms los primeros 2 s, 250 ms hasta los 10 s, 1 s de ahí en más.
- Si la persona se va del Home la espera queda en suspenso en vez de cancelarse, y al volver abre el mazo sin depender de otro `showView`.
- Un nuevo `esperandoApertura` evita que se apilen varias esperas cuando `showView('view-home')` y el reintentos de 2500 ms coinciden.

### El mazo se completa cuando llegan los datos

- `repintarSiCambio()` ahora también escucha `appi-usuarios-cambiaron`. La planilla se analiza en segundo plano (a los 8 s del arranque, o al entrar a la vista Usuarios) y ese aviso no estaba cableado: sin él, las tarjetas de clientes y garantías seguían con la lista sin agrupar hasta que una sincronización cualquiera las repintara.
- Con esto el mazo abre enseguida con los datos locales y se completa solo, sin que la persona haga nada.

### PWA y versión

- Versión de aplicación: `919.0.0`.
- Caché: `appi-v919-tarjetas-primero`.
- Pie visible: `APPI · v919 · Segura`.
- `home-tarjetas.js` pasa a `?v=919`: es el archivo que cambió, así que su copia en caché tiene que invalidarse en los teléfonos ya instalados.

## Verificación

Mismos escenarios, con el arreglo:

| Escenario | Primera tarjeta antes | Primera tarjeta ahora |
| --- | --- | --- |
| Sesión fresca, red rápida | 625 ms | 655 ms |
| Sesión vencida, red rápida | 635 ms | 691 ms |
| Sesión vencida, red lenta de 9 s | 9.433 ms | **650 ms** |
| Sesión vencida, 1500 clientes y red lenta | 9.276 ms | **574 ms** |
| Sesión vencida, nube que no contesta | nunca | **650 ms** |

Regresión nueva, `tests/e2e/tarjetas-primero.spec.js` (6 pruebas):

- Con la nube colgada el mazo aparece igual y con la sesión todavía sin autorizar, lo que prueba que se armó con los datos del teléfono.
- Con red lenta de 9 s el mazo no la espera.
- Cuenta grande de 1500 clientes con red lenta: sin demora.
- El camino normal (sesión fresca, red rápida) sigue abriendo enseguida.
- Si el Home queda cubierto más de 6,4 s, la espera sigue viva y abre al liberarse.
- La elección de titular/socio sigue bloqueando el mazo, y al elegir se abre.

**Comprobación de que la regresión protege el arreglo:** corrida sobre v918 limpio, las 4 pruebas del bug fallan y las 2 de resguardo pasan. Con el arreglo, pasan las 6. El umbral afirmado es 3 s, holgado frente a los ~650 ms medidos y muy por debajo de los 9,4 s anteriores.

La prueba queda en el shard A del CI, junto a `home-limpio` y `tarjetas-promos`. También se sumó al shard B `inicio-inmediato.spec.js`, que estaba fuera del CI desde v918.

Regresión focal previa al cambio, con un solo worker: 58 aprobadas y 5 fallas, las cinco preexistentes en v918 limpio (verificado con `git stash` sobre `60407e3`): `boot-help.spec.js:31`, `:74` y `:210`, y `campus-usuario.spec.js:82` y `:121`.

`node --check home-tarjetas.js` sin errores.

## Deuda que queda y no se tocó

Esta versión arregla el síntoma del usuario (las tarjetas) sin meterse en el arranque ni en la red. Sigue abierta la causa de fondo de los casos lentos:

- `data-sync.js`: `cloudFetch` no tiene `AbortController` ni tiempo máximo, así que un pedido colgado no se resuelve nunca.
- `data-sync.js`: ante `status === 401` hace `await refresh()` y vuelve a llamar a `cloudFetch` sin límite de reintentos. `gestion-client.js` sí usa una bandera de un solo reintento.
- `auth-client.js`: `request()` tampoco tiene tiempo máximo, y el camino lento del arranque sigue esperando `authorize()` antes de `iniciarApp()`.
- 31 specs de `tests/e2e` no están en ningún shard del CI.

## Publicación

La actualización se entrega como un único commit Git dentro de un bundle verificable. El publicador usa `cherry-pick` y `git push` normales, nunca `force push`. No se hizo push desde el agente.
