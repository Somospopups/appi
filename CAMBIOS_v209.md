# APPI v209 · Vinculación contextual

## Cambio principal

El acceso del engranaje ahora refleja el estado real de la cuenta:

- **Vincular teléfono** cuando no existen dispositivos vinculados.
- **Desvincular teléfono** cuando existe al menos uno.

Al abrir el engranaje, APPI actualiza la lista desde Supabase antes de definir el texto. Ambas opciones abren el panel de dispositivos, donde la vinculación o desvinculación continúa requiriendo confirmación.

## Pruebas

La prueba E2E valida los dos estados y confirma que, después de desvincular el último dispositivo, el menú cambia a **Vincular teléfono**.
