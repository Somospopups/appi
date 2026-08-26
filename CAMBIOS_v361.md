# APPI v361 — Motor de tareas: el día nunca queda vacío

## Qué pasaba

La lista del día (la franja **Hoy** de Mensajes y la tarjeta 💧 de Usuarios del
Home) sólo se armaba con **tres disparadores** que saltan solos:

- 🎂 que a **algún cliente le toque el cumpleaños hoy**,
- 🔧 que a **alguien le haya vencido el retrolavado** (y sólo si venció en los
  últimos 30 días),
- ⏰ que a **alguien le venga la garantía** (sólo si vence en los próximos 30
  días).

En un día donde no coincidía ninguno, **la lista quedaba en cero** y el
distribuidor abría APPI sin nada que hacer. La post-venta (que es la mina de la
cartera) sólo se trabajaba cuando "sonaba la alarma".

## Qué cambia

La lista del día se arma en **dos capas**:

- **Capa A · urgentes**: las que ya existían (cumpleaños, retrolavado vencido,
  garantía por vencer).
- **Capa B · reserva de post-venta**: si las urgentes no llegan al mínimo del
  día (`MIN_TAREAS_DIA = 6`), el motor recorre la cartera por **hace cuánto no
  tocamos a cada cliente** y llena el día con tareas de post-venta:
  - 💤 **Reactivar dormido** — garantía vencida hace tiempo, sin contacto.
  - 🔄 **Cliente frío** — hace 60+ días que no lo tocamos.
  - 📇 **Pedir referido** — hace 30+ días que no le pedimos.
  - 🔧 **Mantenimiento próximo** — su equipo está por cumplir el ciclo.
  - 🛒 **Seguimiento post-venta** — compró hace poco y no lo seguimos.

Resultado: **ningún día queda en cero** y la post-venta se trabaja todos los
días.

## Reglas

- **No se apila**: un cliente que ya tiene una urgencia hoy (Capa A) no recibe
  además una tarea de reserva; su persona ya está atendida.
- **Los dormidos de hace más de un año** siguen fuera de todo, como siempre.
- **Tocar cuenta**: mandarle un mensaje a un cliente, o marcar su tarea de
  post-venta ✓, queda anotado; esa persona no reaparece hasta que pasen unos
  días (se evita que el mismo nombre vuelva todos los días).
- La selección de la reserva se arma **una vez por día**: marcar a alguien no
  lo saca de la franja en el acto (igual que las urgentes).
- Las marcas siguen viviendo en `appi_acciones_v1_*` y suben a la nube, así que
  el **panel del administrador** también ve la actividad de post-venta.

## Cómo se ve en la app

La tarjeta 💧 de Usuarios del Home y la franja **Hoy** de Mensajes ahora
siempre tienen algo para hacer. Un día "vacío" de urgentes pasa a mostrar
"6 mensajes" con las tareas de la cartera, listas para mandar y marcar ✓/✗.

## Archivos tocados

- `mensajes-usuarios.js` — el motor de reserva (Capa B) y la integración en
  `deHoy`, `claveAccion`, `marcarAccion` y `registrar`.
- `tests/e2e/mensajes-usuarios.spec.js` — el test "sin urgentes" ahora refleja
  que el día se llena con post-venta; se sumó el test del mínimo y el de "sin
  cartera no hay franja".
- `package.json`, `service-worker.js`, `index.html`, `README.md` — versión v361
  y nombre del caché nuevo.
