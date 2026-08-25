# APPI v341 — La IA de transcripción se carga solo al usarla

## Qué cambia

La librería de transcripción (`vendor/transformers.min.js`, ~900 KB) se
importaba de forma estática en el arranque: el navegador la bajaba y parseaba
siempre, aunque solo se usa al tocar "Transcribir audio" en la Grabadora.

Ahora se carga con **import dinámico**, recién cuando se transcribe por primera
vez. El arranque de la app es más liviano (se ahorran ~900 KB de descarga y
procesamiento en cada apertura).

## Por qué se sentía lenta la app

1. Cada versión cambia el caché del Service Worker y fuerza la re-descarga del
   App Shell completo (~7,5 MB). Se recomienda agrupar cambios en menos
   despliegues.
2. La IA se cargaba de más al abrir (corregido acá).

## Versionado

- `package.json` 341.0.0 · visible `v341` · caché `appi-v341-ia-diferida`.

## Pruebas

- La transcripción sigue funcionando igual (la librería se pide al tocar
  "Transcribir"). Suite relevante en verde.
