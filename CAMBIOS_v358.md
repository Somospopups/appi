# APPI v358 — "Elegir del teléfono" explica cuando Android no deja

## Qué cambia

- **Arreglo**: al tocar "📱 Elegir del teléfono", si Android no abría la agenda
  (permiso de contactos bloqueado, navegador sin el servicio, etc.) el botón
  fallaba **en silencio** y parecía que no hacía nada (v357).
- Ahora cada caso se explica en criollo:
  - **Permiso bloqueado** → cómo habilitarlo desde los tres puntitos/candado
    (Chrome) o Ajustes → Apps → Permisos (PWA instalada), con la alternativa
    del `.vcf`.
  - **Otro error** → se nombra el error y se ofrece el `.vcf`.
  - **Cancelar el selector** → sigue en silencio (es lo esperado).
  - **Elegir cero contactos** → avisa cómo volver a intentarlo.
- Tests nuevos del selector con la API simulada: importar, permiso denegado
  con cartel explicativo y cancelación silenciosa.

## Versionado

- `package.json` 358.0.0 · visible `v358` · `swVersion='358'` ·
  `CACHE_NAME='appi-v358-picker-permiso'`.
