# APPI v912 · El titular también entra al ranking del Tablero

## Por qué seguía sin aparecer

En APPI hay **dos rankings de ventas** y hasta ahora se había corregido uno solo:

| Dónde | De dónde saca los datos | Estado antes de la v912 |
|---|---|---|
| Histórico → Rankings del cierre | cierre mensual (`period.people` + `period.titular`) | corregido en v909, v910 y v911 |
| **Mi negocio → Tablero → Ranking de Ventas** | **Línea Descendente (`equipoData.personas`)** | **el titular nunca estaba** |

El Tablero arma su ranking con las personas del archivo de PSA, y ese archivo
**sólo lista a los patrocinados**: la fila del titular (nivel 0) se guarda
aparte en `equipoData.titular` y el ranking no la miraba. Resultado: la
distribuidora veía su **Volumen Personal 47,65** en el Reporte de Bonos y en el
Histórico, pero en el Tablero el ranking arrancaba en LODEIRO 24,80.

## Qué cambió

- El ranking del Tablero ahora **agrega al titular** con su volumen personal:
  1. el PB de su fila en el cierre (`equipoData.titular.pbPersonal`);
  2. si no viene, el **"Volumen Personal" del Reporte de Bonos** guardado en el
     teléfono (`appi_bonos_v1`), sin conexión.
- **Personal**: aparece con su PB propio. **Organización**: con lo suyo más toda
  su red.
- **No se duplica**: si su fila llegó como persona, se descarta del árbol sólo
  para el ranking.
- **No se inventa nada**: si no hay volumen personal en ningún lado, el puesto
  no aparece.
- Tocar su fila explica el número (*"47,65 PB personales, del Volumen Personal
  de tu Reporte de Bonos"*).
- El ranking que se comparte por WhatsApp (`compartirRankingEquipo`) usa **la
  misma lista** que la pantalla, así la imagen enviada coincide.

## Pruebas

`tablero-ranking.spec.js` (nueva), **4/4**:

- el titular figura en el ranking personal con 47,65 aunque su fila no venga;
- en Organización aparece primero con 555,60 (47,65 propios + 507,95 de la red);
- si el cierre trae su PB (30), Bonos no lo pisa y no se duplica;
- sin volumen personal no se inventa un puesto.

`ranking-pb.spec.js` sigue **9/9** (ranking del Histórico).

## Versión

- `version`: **912.0.0** · pie **APPI · v912 · Segura**
- Caché: `appi-v912-ranking-completo`
- Archivos: `index.html` (Tablero + copia embebida del Histórico), `historico.js`,
  `service-worker.js`, `package.json`, `README.md`
