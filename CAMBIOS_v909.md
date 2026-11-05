# APPI v909 · El titular entra al ranking y el círculo deja de tapar

Sólo mejoras: nada de lo que ya funcionaba se quitó.

## Por qué

El propietario lo reportó así:

> *"hay un problema, por ejemplo en mi caso como distribuidor tengo más de 50 PB
> y no figuro en el ranking de los PB personales. fíjate que eso lo podés ver en
> el reporte de bonos como volumen personal"*

Y tenía razón: el dato estaba, pero el ranking lo dejaba afuera.

## Qué pasaba

El reporte de Línea Descendente de PSA trae **la fila del titular como nivel 0**.
El lector la usa para guardar su PB, pero **no la mete en el árbol de personas**
(`period.people`), porque el árbol empieza en sus patrocinados:

```js
// Nivel 0 = fila del titular (figura primero). No entra al árbol: sólo su PB.
if(nivel === 0){ ... titular.pbPersonal = pbActual; continue; }
```

Todo lo que arma listas de personas —el **Ranking del cierre (Personal)**, el
Top 10 vendedores por categoría y el "PB personal" del resumen— recorre
`period.people`. Resultado: el titular, con su volumen personal bien guardado,
**nunca aparecía**. El reporte de bonos sí lo mostraba porque lee
`titular.pbPersonal`.

## Qué cambió

- **`simpleTitularPerson(period)`**: arma al titular como una persona más
  (`key:'titular'`, `isTitular:true`) con su PB personal, su categoría y su red.
- **Ranking Personal**: se agrega con su volumen personal y se ordena como
  cualquier otro. Si el titular tiene 50 PB, aparece en el puesto que le toca.
- **Ranking Organización**: aparece con **lo suyo + toda su red**
  (`titular.pbPersonal` + `summary.pbPersonal`).
- **Sin duplicados**: si su DIP ya viene dentro de `period.people`
  (`titularInPeople`), no se agrega nada.
- **Su ficha**: tocar la fila abre el detalle con PB Personal, PB de Equipo y
  PB Total, y una nota que aclara que el volumen personal es el mismo del
  reporte de bonos.
- **"PB personal" del resumen** (`simpleScopeStats`): si el titular no estaba en
  la lista, antes quedaba vacío ("—"); ahora muestra su volumen personal.
- **Top 10 vendedores por categoría**: si el titular es de esa categoría, entra.
- **La imagen del ranking** que se comparte por WhatsApp sale de la misma lista,
  así que también lo incluye.

### Dos arreglos que aparecieron de paso

- **El aro del círculo de Appi tapaba botones.** El `::after` decorativo del
  círculo usaba `inset:-4px` y, cuando el botón vive dentro de un contenedor
  posicionado (el encabezado del Histórico es `sticky`), el aro se estiraba
  **hasta el ancho de todo el encabezado** y se comía los toques del
  **"‹ Volver"**. Ahora el círculo establece su propio contexto (`contain:layout`,
  sin tocar el `position` que algunas pantallas ya traen puesto) y el aro tiene
  `pointer-events:none`.
- **Desborde de 16 px en el archivo anual**: el globito del encabezado
  ("Todos los datos del año") tenía `white-space:nowrap` con `max-width:105px`
  y estiraba la tarjeta. Ahora recorta con puntos suspensivos.

## Versión

- `version`: **909.0.0**
- Cache del Service Worker: `appi-v909-ranking-personal`
- Pie de la app: **APPI · v909 · Segura**
- Archivos táctiles: `index.html` y `historico.js` (las dos copias del Histórico
  quedan idénticas, como exige la prueba de copias embebidas), `historico.css`,
  `appi-assistant.css`, `service-worker.js`, `package.json`

## Pruebas

- `ranking-pb.spec.js` — **5/5**, con dos pruebas nuevas:
  - *el titular figura en el ranking de PB personales con su volumen personal*
    (comprueba que su fila no está en el árbol, que el ranking personal lo
    incluye en el puesto correcto, que en Organización suma su red y que el
    "PB personal" del resumen ya no queda vacío),
  - *el titular no se duplica si su fila viene dentro de las personas*.
- `appi-assistant.spec.js` — **14/14**, con una prueba nueva de que el aro del
  círculo no se estira ni recibe toques.
- Histórico completo (`historico`, `historico-archivo-anual`,
  `historico-action-center`, `historico-aesthetic-copa`, `historico-sin-datos`)
  en verde, incluido el desborde del archivo anual que antes fallaba.
