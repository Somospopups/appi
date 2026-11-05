# APPI v918 · Inicio inmediato

## Objetivo

Reducir de forma real el tiempo de apertura de APPI instalada en Android sin borrar datos, sin degradar el funcionamiento offline y sin hacer competir herramientas pesadas con el primer dibujo de Home.

## Cambios principales

### Home primero

- La autorización local permite entrar inmediatamente con la sesión segura ya guardada.
- La elección de persona reanuda primero su workspace local.
- Home se dibuja antes de la revalidación remota, la sincronización de nube y el análisis de la planilla.
- La revalidación remota sigue siendo obligatoria: si la cuenta fue desactivada, APPI vuelve a bloquearla aunque Home ya se hubiera mostrado.
- El splash interno y su salida fueron acortados; la selección de persona también termina más rápido.

### Planillas grandes fuera de la ruta crítica

- `equipoData` se analiza después de que exista el primer nodo real de Home.
- La hidratación ya no reconstruye Home ni reemplaza el nodo que la persona puede estar tocando.
- Revalidaciones y sincronizaciones que no cambiaron la planilla no vuelven a analizar miles de filas.
- El KPI de Mi negocio dejó de leer y parsear la planilla por su cuenta desde un temporizador de arranque: consume la copia ya hidratada y escucha su señal de finalización.

### Bibliotecas pesadas bajo demanda

- PDF.js, ZXing, XLSX, html2canvas, jsPDF, svg2pdf y JSZip salieron del HTML inicial y se cargan mediante `appi-vendors.js` sólo cuando una función las necesita.
- Tesseract/OCR no se carga al abrir APPI ni al abrir Mi stock: espera hasta usar la cámara.
- Mi stock abre de inmediato y prepara ZXing en segundo plano únicamente cuando el teléfono no ofrece `BarcodeDetector`.
- El Service Worker separa el shell crítico de los recursos opcionales y sólo calienta estos últimos después del primer uso estable.

### Sincronización y protección de datos

- `DataSync.resumeLocal()` recupera el workspace local antes de consultar la nube.
- La sincronización inicial continúa después del primer dibujo.
- Las escrituras locales realizadas durante un pull se preservan y ganan sobre la copia remota anterior.
- `syncNow()` queda serializado para evitar pulls simultáneos.
- Valores idénticos no vuelven a aplicarse ni disparan renderizados innecesarios.

### Mi avance

- Mi avance vuelve a recalcularse cuando el Panel de Contactos termina de cargar su caché o sus datos remotos.
- La tarjeta ya no queda en un estado provisional si los contactos reales llegaron después del primer Home.
- En móvil, Appi fue elevada 14 px y permanece centrada en su columna, con separación comprobada respecto de la barra “Próximo paso”.

### PWA y versión

- Versión de aplicación: `918.0.0`.
- Caché: `appi-v918-inicio-inmediato`.
- Pie visible: `APPI · v918 · Segura`.
- Se conserva el arranque offline de la PWA instalada y la estrategia cache-first protegida de v917.

## Verificación

Regresión focal final, con un solo worker:

- **83/83 pruebas aprobadas**.
- Incluye inicio local inmediato, bloqueo remoto tardío, planilla grande, Android/PWA fría y caliente, funcionamiento offline, Mi avance, geometría móvil de Appi, Home, sincronización, autorización, Mi stock, QR, OCR bajo demanda y estados internos animados de Appi.
- Caso de planilla grande repetido **10 veces: 10/10 aprobado**.
- Validación visual móvil: Appi no invade “Próximo paso”.
- `git diff --check` y validaciones de sintaxis JavaScript aprobadas.

## Publicación

La actualización se entrega como un único commit Git dentro de un bundle verificable. El publicador usa `cherry-pick` y `git push` normales, nunca `force push`. No se hizo push desde el agente.
