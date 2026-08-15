# APPI · v211 · Desvinculación directa

## Objetivo

Hacer que **Desvincular teléfono** sea una acción directa, simple y segura, y limitar la cuenta a un solo teléfono vinculado.

## Cambios

- Cuando existe un teléfono, el engranaje continúa mostrando **Desvincular teléfono**.
- Al presionarlo ya no se abre el administrador de teléfonos.
- Se muestra únicamente una confirmación con este mensaje:

  > ¿Deseás desvincular tu teléfono de la cuenta?
  >
  > Podrás volver a vincularlo en cualquier momento.

- Los únicos botones de la confirmación son **No** y **Sí**.
- La confirmación no se puede cerrar accidentalmente tocando fuera del cuadro.
- **No** cancela la operación sin realizar cambios.
- **Sí** desvincula el teléfono y no abre una segunda confirmación de éxito.
- Después de desvincularlo, el engranaje vuelve a mostrar **Vincular teléfono**.
- Si no hay teléfono vinculado, la misma opción abre directamente la pantalla clara con QR y código de la v210.
- APPI admite un solo teléfono por cuenta:
  - si ya existe uno, no se genera un nuevo QR;
  - la pantalla de cuenta muestra únicamente el teléfono actual;
  - intentar vincular otro teléfono informa que primero debe desvincularse el actual.
- Si una cuenta antigua tuviera más de un teléfono, se conserva el administrador para resolver ese caso sin eliminar ninguno automáticamente.

## Pruebas específicas

- Verificación del mensaje completo de confirmación.
- Verificación de los botones **No** y **Sí**.
- Verificación de que **No** no llama al servidor.
- Verificación de que **Sí** desvincula el teléfono sin mostrar otro popup.
- Verificación del cambio de **Desvincular teléfono** a **Vincular teléfono**.
- Verificación de que el QR sólo se genera cuando no hay un teléfono vinculado.
- Verificación de que no se puede iniciar una segunda vinculación mientras exista un teléfono activo.

## Backend

No requiere cambios de backend.

## Resultados

- Pruebas específicas del puente: **2 aprobadas en 9,0 s**.
- Suite completa de Playwright: **15 aprobadas en 45,4 s**.
- Validación de sintaxis y `git diff --check`: correctas.
