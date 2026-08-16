# APPI v227 · Línea Ascendente

El negocio tiene su Línea Descendente (el cierre mensual). Ahora APPI
muestra la **Línea Ascendente** del distribuidor en el home.

## Cambios

- **Panel Línea Ascendente en el home:** categoría actual (Arranque,
  Constructor, Líder o Director), métricas vivas (personas en el equipo y
  conversiones del mes) y, en criollo, lo que falta para la próxima
  categoría. Los criterios usan datos que la app ya tiene: Mi Equipo y el
  Panel de Contactos.
- **Fundadores #1–#10:** las primeras diez cuentas que entran reclaman su
  cupo y muestran la insignia dorada con el precio congelado. La base asigna
  el número de orden y cierra la puerta en el cupo 11; dos reclamos
  simultáneos no pueden llevarse el mismo número.
- Nueva migración `SUPABASE_LINEA_ASCENDENTE.sql` (aditiva e idempotente):
  tabla `appi_fundadores` y función `appi_reclamar_fundador()`.

## Criterios de categoría (propuesta inicial, calibrable)

| Categoría | Requisito |
|---|---|
| Arranque | ingreso |
| Constructor | 3 personas en el equipo **o** 2 conversiones en el mes |
| Líder | 8 personas **y** 4 conversiones |
| Director | 20 personas **y** 8 conversiones |

## Pruebas

59 en verde, con cuatro nuevas: cálculo de categorías por datos (incluido el
caso tramposo de equipo grande sin ventas), reclamo del cupo de Fundador con
insignia visible, cupos llenos sin insignia, y panel con lo que falta para la
próxima categoría.
