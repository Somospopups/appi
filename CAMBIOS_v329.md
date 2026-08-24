# APPI v329 — Publicar el aviso vuelve a funcionar

## Qué pasaba

Al tocar **"Publicar aviso"** (y también "Quitar el aviso vigente") no pasaba
nada. La causa era silenciosa: las funciones del panel que manejan anuncios e
ingresos (`publicarAnuncio`, `quitarAnuncioVigente`, `loadAnuncio`,
`loadPagos`, `renderPagos`, etc.) habían quedado declaradas **fuera** del IIFE
que guarda los helpers internos (`$`, `setStatus`, `rpcAdmin`, `state`). Al
hacer clic se lanzaba un `ReferenceError: $ is not defined` que se tragaba la
promesa — sin cartel, sin estado, sin nada. Por lo mismo, "Ingresos por mes"
arrancaba en "Cargando ingresos…" para siempre y el aviso vigente no se
precargaba en el formulario.

## Qué cambia

- Las funciones de anuncios e ingresos vuelven a vivir **dentro** del IIFE,
  donde están sus helpers. Se eliminó además una copia duplicada y rota de
  `loadAcciones` que quedaba suelta al principio del archivo.
- Verificado en runtime: publicar muestra el cartel "Aviso publicado ✓" y el
  estado "Publicado ✓ Lo van a ver todos al abrir APPI.".
- Test de guardia nuevo (`tests/e2e/admin-scope.spec.js`): exige que esas
  funciones estén dentro del IIFE, que aparezcan una sola vez y que no haya
  código suelto antes del IIFE.

## Versionado

- `package.json` 329.0.0 · visible `v329` · caché `appi-v329-publicar-anuncio`.

## Pruebas

- Suite parcial relevante en verde (admin-scope, anuncios, admin-orden,
  acciones-dia, convenciones, prueba, telefono, pwa-cache): 76 passed.

## v328 (anterior, mismo día)

- El panel de administración quedó centrado en el escritorio: la sesión admin
  esconde la sidebar pero `.app` seguía con `margin-left:316px`. Ahora
  `body.appi-admin .app` se centra (`margin:auto`, `max-width:1140px`).
