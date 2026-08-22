# APPI v304 · Las notificaciones del Home son un mazo de tarjetas

## Qué cambia

Al entrar al Home, las novedades aparecen como un **mazo de tarjetas**
que se pasan deslizando a izquierda o derecha (estilo Tinder), divididas
por categorías. **Son inteligentes**: cada categoría aparece solo cuando
tiene algo real para decir.

- 💙 **Especial** — siempre primera: el aliento del día personalizado con
  el progreso real (PB de Cultura, invitados, acciones marcadas). El pool
  tiene **84 frases** que rotan sin repetirse hasta agotarse; la frase se
  fija por día.
- 📅 **Tu jornada** — seguimientos y presentaciones de hoy (y atrasados).
- 🎯 **Oportunidades** — los Bonus al alcance en Mi Equipo.
- 🎂 **Cumpleaños** — del equipo y de los clientes, con saludo directo.
- 👥 **Mi Equipo** — lo que falta de la Cultura del mes (con respiro los
  primeros 3 días del mes).
- 📇 **Panel de Contactos** — nuevos sin contactar y fechas pasadas.
- 💧 **Usuarios** — las acciones del día sin marcar (✓/✗).

**Gestos**: deslizar pasa la tarjeta (cualquier lado); el botón de cada
tarjeta lleva a la pantalla donde se resuelve. También hay botón
"Pasar ›" para PC.

**El botón 🔔 Notificaciones** vive arriba del Home: muestra el contador
y **late solo cuando hay tarjetas sin ver**; al tocarlo, el mazo vuelve.
Las tarjetas reaparecen en cada entrada al Home mientras la novedad siga
viva. "Tu jornada" del Home sigue igual: el mazo convive, no reemplaza.

## Detalles honestos

- El mazo se abre solo únicamente si hay novedades reales (la especial
  sola no interrumpe).
- Modo claro y oscuro, arrastre táctil y con mouse.
- `localStorage.appi_tarjetas_auto='0'` apaga solo la apertura
  automática (lo usan las pruebas).

## Pruebas

Cinco nuevas en `home-limpio.spec.js`: la especial abre primera con el
nombre real, las categorías aparecen solo con novedades, el botón late y
reabre, el arrastre con mouse pasa la tarjeta, y hay 80+ frases con la
del día estable.

## App Shell y caché v304

- `304.0.0` · visible `v304` · caché `appi-v304-mazo-de-tarjetas`
- `home-tarjetas.js` entra al App Shell del Service Worker.
