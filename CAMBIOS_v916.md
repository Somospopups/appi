# APPI v916 · Arranque rápido

## Corrección urgente

La primera versión de Mi avance hacía cálculos comerciales durante la ruta crítica de inicio. En cuentas con una planilla grande de garantías, el análisis de reactivación podía volver a leer y parsear el mismo estado por cada usuario y repetir el proceso varias veces. Eso bloqueaba el hilo principal y dejaba la pantalla de arranque aparentemente tildada.

## Solución

- Mi avance espera a que termine el arranque antes de analizar datos.
- El Home ya no dispara el análisis desde cada render.
- La pantalla completa sólo se construye cuando se abre.
- Usuarios anteriores se analiza en una sola pasada lineal y con una sola lectura de almacenamiento.
- La medición de reactivación usa caché breve e invalidación explícita.
- Los eventos de sincronización se agrupan para evitar repintados repetidos.
- Los errores de Mi avance se aíslan y nunca frenan el resto de APPI.

## Prueba de carga

La regresión nueva carga 4.000 usuarios y 1.000 reactivaciones, ejecuta el análisis completo y exige que termine sin bloquear la interfaz.

## Versión

- `version`: **916.0.0**
- Pie: **APPI · v916 · Segura**
- Caché: `appi-v916-arranque-rapido`
