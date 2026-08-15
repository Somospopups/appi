# APPI · v210 · Vinculación clara

## Objetivo

Simplificar la pantalla de teléfonos vinculados para que cualquier persona, especialmente usuarios mayores, comprenda inmediatamente cómo vincular un teléfono.

## Cambios

- El QR y el código de seis dígitos se generan y muestran automáticamente al abrir la pantalla.
- Se eliminó el botón **Mostrar QR y código**.
- **Vincular este teléfono** ahora es la única acción principal: ocupa todo el ancho, tiene mayor tamaño y alto contraste.
- Las instrucciones se presentan como dos alternativas claras:
  1. escanear el QR con el teléfono que se quiere vincular;
  2. usar **Vincular este teléfono** e ingresar el código mostrado en la PC.
- El código se muestra con números más grandes y separados en dos grupos de tres.
- Se eliminó **Actualizar lista**; los teléfonos se actualizan automáticamente al abrir la pantalla y después de una vinculación.
- **Desvincular dispositivo** se conserva como una acción secundaria de texto y mantiene su confirmación de seguridad.
- Se aumentaron tamaños de fuente, espacios y áreas táctiles en toda la pantalla.
- Se mejoró el comportamiento responsive y el contraste en modo oscuro.

## Pruebas

- La prueba E2E verifica que el QR y el código aparezcan sin presionar ningún botón.
- La prueba E2E verifica que no existan los controles **Mostrar QR y código** ni **Actualizar lista**.
- La prueba E2E confirma que **Vincular este teléfono** sea la acción principal visible.
- Se mantiene la cobertura de listado, desvinculación segura y cambio contextual del menú.

## Resultados

- Pruebas específicas del puente: **2 aprobadas**.
- Suite completa de Playwright: **15 aprobadas en 44,1 s**.
- Cambios de backend: ninguno.
