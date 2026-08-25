# APPI v354 — Se recupera la franja "Tareas del día"

## Qué pasaba

La franja **Tareas del día** (los pendientes de Usuarios/Garantías: 🎂
cumpleaños, 🔧 retrolavado y ⏰ garantía por vencer) había desaparecido en
todos los dispositivos.

La causa no estaba en la lógica de la franja sino en el final de
`mensajes-usuarios.js`: después del cierre del módulo (`})();`) había quedado
pegado un fragmento duplicado, la cola repetida del `window.APPIMensajes = {…}`.
Ese texto estaba **fuera** del IIFE, así que empezaba con un `Hoy,` suelto:

```js
})();      // ← cierre correcto del módulo (línea 1592)
Hoy,       // ← código repetido y suelto
    marcarAccion: marcarAccion,
    ...
})();
```

Un `SyntaxError` en un script clásico impide que el navegador ejecute **ni una
línea** del archivo. Por eso `window.APPIMensajes` no llegaba a definirse, la
franja nunca se dibujaba y el resto de la app seguía andando: el único archivo
roto era ése.

## Qué cambia

- Se borran las 18 líneas duplicadas del final de `mensajes-usuarios.js`.
  El archivo vuelve a terminar en el cierre correcto del IIFE.
- No cambia ninguna regla de vigencia, marca ✓/✗ ni la clave
  `appi_acciones_v1_`: el progreso ya guardado en los teléfonos y en la nube se
  conserva.

## Cómo se verificó

- `node --check` sobre todos los `.js` del repo y sobre los 15 scripts inline
  de `index.html`: compilan.
- Arnés que ejecuta el archivo real con un DOM mínimo y los mismos 3 clientes
  de `tests/e2e/mensajes-usuarios.spec.js`: la franja se dibuja con sus 3
  renglones tocables, el vencido hace años no entra, la ✓ deja el progreso a la
  vista y persiste por ciclo en `completadas`. Contra el archivo anterior el
  mismo arnés falla con `SyntaxError`.
- `npx playwright test` sobre los specs que no necesitan navegador:
  20 pasaron. Los specs de navegador no se pudieron correr acá porque el
  sandbox no tiene red para descargar Chromium.

## Versionado

- `package.json` 353.0.0 · la caché del Service Worker ya venía en
  `appi-v355-fix-blanco`, que purga las versiones anteriores y vuelve a bajar
  `./mensajes-usuarios.js` al publicar.
