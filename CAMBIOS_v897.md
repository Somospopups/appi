# APPI v897 · Acompañamiento después de una reactivación

## Qué cambia

- APPI reconoce cuando una cuenta está desactivada, no tiene una membresía activa o tiene la membresía vencida.
- En ese dispositivo guarda una marca mínima asociada al identificador interno de la cuenta; no guarda contraseñas ni datos de acceso.
- La primera vez que la cuenta vuelve a ingresar correctamente después de ser reactivada, abre automáticamente los primeros pasos desde la bienvenida.
- El recorrido conserva acceso directo, MI PSA y avisos, usando los estados reales ya guardados.
- Al cerrar o terminar el recorrido, la marca se elimina y no vuelve a interrumpir los ingresos siguientes.

## Casos cubiertos

- Usuario nuevo: continúa viendo el recorrido automáticamente.
- Usuario habitual: no recibe un popup nuevo.
- Cuenta suspendida o desactivada: recibe el recorrido una vez después de volver.
- Membresía vencida o todavía no activa: recibe el recorrido una vez después de renovarse.
- Otro usuario en el mismo teléfono: no hereda la marca de una cuenta diferente.
- Dispositivo nuevo o datos borrados: mantiene el comportamiento de primer ingreso.
- Revisión manual: sigue disponible en Mi perfil → Revisar primeros pasos.

## Pruebas

- Detección real de cuenta desactivada durante el acceso.
- Ingreso posterior con la cuenta reactivada.
- Apertura automática aunque el tutorial anterior ya estuviera completado.
- Eliminación de la marca al cerrar el recorrido.
- Ausencia del popup en la recarga siguiente.
- Recorridos de iPhone y Android, autenticación, sintaxis, versión, caché y App Shell.

## Versión

- Versión: `897.0.0`
- Caché: `appi-v897-reactivacion-acompanada`
