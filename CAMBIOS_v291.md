# APPI v291 · Solo la planilla del titular

## Qué cambia

Hasta ahora, una planilla de **Garantías por Organización** de otro
distribuidor se aceptaba igual: las filas que no coincidían con el equipo se
ignoraban en silencio ("N personas del archivo no están en tu equipo").
Desde v291, **si la planilla no corresponde al titular logueado, se rechaza
entera y no se carga ningún dato**.

La Línea Descendente ya se validaba por el DIP del titular impreso en el
reporte (v256, cliente + triggers de Supabase). El reporte de Garantías no
trae ese dato, así que la validación es por contenido:

> Una planilla es ajena cuando **ningún** DIP del archivo está en la Línea
> Descendente, o cuando (con 5 o más registros) coincide **menos del 20%**.
> El margen tolera bajas del equipo entre un reporte y otro.

## Dónde se aplica

- **Pantalla principal** (`garantiasFileInput`): antes de mezclar nada se
  evalúa la planilla completa. Si es ajena: *"Planilla de otro distribuidor —
  No se cargó ningún dato. Descargá Garantías por Organización desde tu
  propia cuenta."*
- **Histórico · al cargar el archivo**: la GO del mes se compara con la LD de
  ese mismo mes apenas están las dos, en cualquier orden de carga. El archivo
  ajeno queda marcado con el error y no entra al borrador.
- **Histórico · al guardar el cierre** (`normalizePeriod`): respaldo final
  por si el borrador llegó por otro camino (restauración, datos guardados).

`Usar datos actuales de APPI` no cambia: arma las garantías desde la propia
LD ya validada, así que siempre corresponde.

## Pruebas

`garantias-titular.spec.js` (nuevo):
- rechaza planilla sin ninguna coincidencia y planilla con menos del 20%;
- acepta la propia aunque no coincida al 100% y la chica con al menos un DIP
  del equipo;
- la pantalla principal pregunta **antes** del cruce;
- el Histórico valida en carga y en cierre (definición + 3 llamadas).

## App Shell y caché v291

- Versión del paquete: `291.0.0`
- Versión visible y registro del Service Worker: `v291`
- Caché: `appi-v291-planilla-del-titular`
- `historico.js` y su copia embebida en `index.html` siguen sincronizados.
