# Cambios en APPI v835

## 🔄 Fotos en Plan Canje + 🔍 Modal Popup de Fotos en Alta Calidad

1. **Fotos en productos de Plan Canje con insignia**:
   - Las líneas de Plan Canje en la Lista de Precios ahora muestran la miniatura oficial del producto del Portal PCD.
   - Llevan superpuesta una insignia circular `🔄` distintiva de Plan Canje para identificarlas al instante.

2. **Popup Modal al tocar cualquier foto**:
   - Al presionar sobre la foto de cualquier producto (tanto normal como canje), se abre un popup centrado (`#lpFotoModal`) con efecto blur de fondo.
   - La foto se visualiza en tamaño grande (220×220 px) junto al nombre completo del producto, su SKU/sección y botón para cerrar.
   - Tocar la foto no agrega cantidades al presupuesto (evita disparar el contador por error).

3. **Cache y Suite**:
   - Cache actualizado a `appi-v835-canje-fotos-popup`.
   - Pruebas e2e verificadas y en verde.
