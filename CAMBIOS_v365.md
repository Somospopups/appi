# APPI v365 — A depurados desde el cartel del teléfono

## Qué pasaba

Si el número no servía, APPI avisaba “Número incompleto” y listo. El
distribuidor tenía que ir a la ficha, buscar 🧹 y confirmar. Julieta
quedaba en el limbo.

## Qué cambia

Ese mismo cartel ahora trae **A depurados**. Un toque y la persona entra
a la planilla de depurados (la que se le pasa a la empresa). Aceptar
sigue cerrando sin hacer nada.

Vale para WhatsApp desde Usuarios, el carrusel, el mazo y cualquier
otro lugar que abre el chat.

## Archivos tocados

- **`telefono.js`** · `avisarInvalido` con los dos botones.
- **`index.html`**, **`mensajes-usuarios.js`**, **`usuarios-botones.js`**,
  **`home-tarjetas.js`**.
- **`tests/e2e/telefono.spec.js`**, **`tests/e2e/depurados.spec.js`**.
- Versión y caché: `v365` / `appi-v365-depurados-tel`.
