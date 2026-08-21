# APPI v296 · Limpieza: consola sin datos de personas y README al día

Barrida de los pendientes menores que venían del informe `REVISION_APPI.md`.

## Consola sin datos de personas

Los únicos `console.log` de `index.html` que imprimían datos personales eran
los del geocodificador del mapa: al fallar una búsqueda, volcaban la
dirección de la persona en la consola. Ahora loguean solo el error. El resto
de los logs son conteos y diagnósticos sin contenido (la regla "sin volcar
el contenido" ya se cumplía desde antes).

## Mensajes de error desactualizados

Dos mensajes de la carga de Excel todavía aconsejaban "desactivá AdBlock
para cdn.jsdelivr.net": desde v250 las librerías viven en `vendor/` y la app
no depende de ningún CDN. Los textos ahora dicen lo que corresponde (cerrar
y volver a abrir APPI).

## La URL externa de cdnjs

Verificado: ya no existe ninguna referencia externa de cdnjs/jsdelivr/unpkg
en el código. Las únicas URLs externas que quedan son funcionales y a
propósito: Google Maps (navegación), Nominatim/OpenStreetMap (geocodificar)
y el video de retrolavado en YouTube.

## README al día — y vigilado

- El README pasa de v289 a **v296** y no puede volver a quedarse viejo:
  `pwa-cache.spec.js` ahora también verifica que el README diga la misma
  versión que el paquete. Si alguien olvida actualizarlo, la suite falla.

## App Shell y caché v296

- `296.0.0` · visible `v296` · caché `appi-v296-limpieza-de-consola`
