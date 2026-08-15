# APPI · v212 · Titular y socio

## Cuenta compartida con espacios personales

- El administrador puede crear una cuenta con titular y socio/a.
- Las solicitudes de cuenta también preguntan si existe un socio y solicitan su nombre.
- El administrador puede agregar, cambiar o quitar al socio posteriormente desde **Personas**.
- Las cuentas existentes conservan su nombre actual como titular y comienzan sin socio.
- Titular y socio comparten el número de distribuidor, la contraseña y la membresía.

## Selección al ingresar

- Cuando hay socio, después de cada ingreso aparece **¿Quién sos?**.
- Se muestran los dos nombres con las etiquetas **Titular** y **Socio/a**.
- La selección se conserva hasta cerrar la sesión.
- Las cuentas sin socio ingresan directamente como titular.
- El primer widget del Home muestra **Hola + nombre** en lugar del saludo por horario.

## Información personal y compartida

Información personal de cada integrante:

- Home y planificación mensual;
- presupuesto;
- Siete Pasos;
- ruedas de Vida y Negocio;
- contactos y seguimientos personales;
- notas;
- Histórico mensual.

Información compartida por la cuenta:

- Mi Equipo importado mediante Excel;
- Garantías importadas mediante Excel;
- Mi Encuesta;
- Mi Gestión, sus contactos, actividades y referidos.

La Grabadora continúa siendo local en el dispositivo donde se usa.

## Teléfonos y llamadas

- Cada persona puede vincular un teléfono: máximo uno para el titular y uno para el socio.
- El engranaje refleja el teléfono de la persona activa.
- El QR queda asociado al titular o socio que lo generó.
- No se permite vincular un segundo teléfono a la misma persona sin desvincular el anterior.
- Las llamadas se envían automáticamente al teléfono de quien eligió su nombre al ingresar.
- Quitar al socio desde el administrador desactiva también su teléfono.

## Compatibilidad

- Los datos personales existentes quedan asignados al titular.
- El socio comienza con su espacio personal vacío.
- Los Excel y el CRM compartidos siguen disponibles para ambos.
- El Histórico del titular conserva sus identificadores y archivos existentes.

## Backend

- Nueva columna `socio_nombre` en perfiles y solicitudes.
- Nueva asociación `persona_tipo` en teléfonos y vinculaciones.
- Restricción de un teléfono activo por persona.
- Actualización de `admin-distribuidores`, `solicitud-cuenta` y `dispositivo-puente`.
- Migración: `SUPABASE_PERSONAS_CUENTA.sql`.

## Resultados

- Pruebas específicas de identidad, sincronización y teléfonos: **8 aprobadas en 28,9 s**.
- Suite completa de Playwright: **16 aprobadas en 49,2 s**.
- Sintaxis JavaScript y `git diff --check`: correctas.
- Migración y tres Edge Functions publicadas correctamente mediante GitHub Actions.
- Ejecuciones exitosas del backend: `31897390450` y `31897736008`.
