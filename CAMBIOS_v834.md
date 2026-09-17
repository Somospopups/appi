# Cambios en APPI v834

## 📸 Fotos completas de la Lista de Precios (100% de productos con foto del Portal PCD)

- Se autenticó directamente en el **Portal PCD de compras de PSA (`comprasonline.psa.com.ar`)** con credenciales de distribuidor.
- Se recorrió todo el catálogo y sus categorías (Purificadores, Gasificadores, Repuestos y mantenimiento, Botellas PSA, Accesorios para la instalación, Material Promocional, Servicios, Olivare, Purificadores Osmosis Ropot, Reposiciones y Purificador de Aire).
- Se extrajeron y descargaron todas las imágenes PNG 200×200 oficiales directo del CDN de PSA a `catalogo-img/<SKU>.png`.
- **Todos los 312 productos** de la Lista de Precios de APPI (`psa-catalogo.json`) ahora cuentan con su SKU numérico asignado y su foto oficial vinculada.
- Adaptadores de instalación, ablandadores Domus, módulos, botellas, termos, repuestos y equipos ahora muestran su foto tanto en la lista interactiva como en las fichas del presupuesto PDF.
- Cache actualizado a `appi-v834-pcd-fotos-completas`.
