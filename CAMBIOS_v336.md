# APPI v336 — La ficha del carrusel de Acciones muestra los datos completos

## Qué cambia

En el carrusel de **Acciones del día** (Usuarios), la ficha de cada persona
mostraba solo el nombre y "localidad · producto". Ahora muestra también lo que
hace falta para decidir y ubicar el contacto:

- 📍 Localidad
- 🏠 Domicilio (dirección)
- 📞 Teléfono
- 🛒 Compra: fecha de compra
- 📅 Vence: fecha de vencimiento
- 📦 Producto

Cada dato aparece en un renglón dentro de la tarjeta, en dos columnas, y se
adapta al modo oscuro.

## Versionado

- `package.json` 336.0.0 · visible `v336` · caché `appi-v336-ficha-con-datos`.

## Pruebas

- `mensajes-usuarios.spec.js`: test nuevo que exige los seis datos en la ficha.
