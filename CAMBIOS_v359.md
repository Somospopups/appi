# APPI v359 — Sin pantallazo al entrar al Panel de Contactos

## Qué pasaba

Al presionar el botón para ingresar al **Panel de Contactos** aparecía un
"pantallazo" —una pantalla que no correspondía— antes de la pantalla correcta:

1. El panel se abría bien (agenda elegida, contactos, prioridades).
2. **80 ms después** saltaba una barra **"💳 Promos con tarjeta"** arriba de
   todo y empujaba el contenido ~250 px hacia abajo (medido: 157 → 409 px en
   PC; 133 → 399 px en teléfono). Esa barra es la que v357 había quitado del
   Panel: la pantalla se veía como la **versión anterior**.
3. Cuando terminaba la sincronización (`refreshManagement`, 1–3 s según la
   red), `renderManagement` rearmaba el contenido del panel y **borrraba la
   barra**: todo volvía a saltar hacia arriba.

## Por qué

v357/v358 quitaron la barra del Panel desde `gestion-client.js`, pero quedaron
vivos los dos ganchos que la montaban desde `tarjetas-promos.js`:

- el envoltorio de `showView`: `if (id === 'view-gestion')
  setTimeout(montarBarraGestion, 80)`, y
- el envoltorio de `APPIGestion.open`: `setTimeout(montarBarraGestion, 120)`.

Como se montaba **después** de que la pantalla ya era visible (y afuera del
render de `gestion-client.js`), ningún re-render del panel la reconstruía:
aparecía tarde, se borraba sola y el contenido saltaba dos veces.

## Qué cambia

- **`tarjetas-promos.js`**: se quitan los dos ganchos de montaje en el Panel.
  La barra de promos ya no se inyecta nunca en `view-gestion` — tampoco las
  pills 💳 ni los botones "💬 Promo" que se colgaban de ese mismo montaje y
  sufrían el mismo entra-y-salta.
- **El módulo de promos queda intacto en la sección Usuarios** (barra,
  filtros, pills, mensajes por WhatsApp), como estaba.
- `montarBarraGestion` sigue exportada en `window.APPITarjetas` por si el
  Panel vuelve a ofrecerla algún día, con montaje sincrónico dentro del
  render.

## Versionado y caché

- `package.json` y `package-lock.json`: `359.0.0`.
- Pie visible: `v359` · `swVersion='359'`.
- `CACHE_NAME='appi-v359-sin-pantallazo-panel'` en `service-worker.js` y en
  la metadata de `index.html`/`package.json`/`README.md`.
- Sin cambios en la base de datos.

## Cómo se verificó

- Reproducción instrumental (Playwright + Supabase simulado con latencia
  real): grabadora fotograma a fotograma que mide la posición del primer
  contenido del panel y la altura de la barra inyectada.
  - **Antes**: barra de 240–256 px apareciendo a los ~80–120 ms con salto de
    ~250 px, y borrada a los ~2,5 s con salto de vuelta.
  - **Después**: el panel se dibuja una sola vez, sin barra y sin saltos (la
    posición del contenido queda estable dentro de ±4 px de redondeo).
- Nueva regresión `tests/e2e/pantallazo-panel.spec.js`: en PC (botón del
  sidebar) y en teléfono (tarjeta "Panel de Contactos" de Mis herramientas)
  exige que `#gestionTarjetasBar` no exista nunca en el Panel y que el
  contenido no salte. Verificado que falla contra el código anterior y pasa
  con el arreglo.
