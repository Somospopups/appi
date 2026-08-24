# APPI v327 — El aviso habla claro

## Qué pasaba

Al publicar un anuncio, el resultado (bueno o malo) sólo aparecía en un
mensaje chiquito debajo del botón: fácil de perder. Y si el backend no
conocía la función nueva, el texto del error arrastraba el nombre de otra
migración (SUPABASE_ACCIONES_DIA) y confundía más de lo que ayudaba.

## Qué cambia

- **Publicar aviso** ahora responde con un cartel grande `APPIDialog`:
  - ✅ "Aviso publicado ✓" explica que todo el equipo lo va a ver al
    abrir APPI.
  - ⚠️ Si algo falla, el error sale en el cartel y, cuando es el 404 del
    RPC, dice la verdad: hay que correr el workflow "Publicar backend
    completo de APPI".
- Las validaciones también hablan: reunión con fecha pero sin título, o
  con título pero sin fecha, abren un cartel que explica qué completar.
- **Quitar el aviso vigente** confirma lo mismo con un cartel.

El cambio de caché (`appi-v327-aviso-habla-claro`) fuerza además que
todos los dispositivos bajen el App Shell completo de una: si alguno
había quedado picando con la v325, se actualiza solo al reabrir.

## Verificación del backend (ya comprobada en producción)

`POST /rest/v1/rpc/appi_admin_publicar_anuncio` sin sesión responde
"Sólo la cuenta administradora puede publicar anuncios." — igual que
`appi_admin_pagos`: la función existe, responde y valida el rol.

## Versionado

- `package.json` 327.0.0 · visible `v327` · caché `appi-v327-aviso-habla-claro`.

## Pruebas

- La suite completa queda en verde (329 passed, 1 skipped) sin cambios
  de comportamiento cubierto por pruebas nuevas: los carteles son
  presentación pura sobre funciones ya probadas en v326.
