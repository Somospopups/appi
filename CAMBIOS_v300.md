# APPI v300 · El panel de administración, ordenado

Seis mejoras pedidas por el equipo, todas dentro del panel admin.

## Crear cuenta: un botón y un popup

La tarjeta "Nueva cuenta" queda con un solo botón a la vista:
**➕ Crear cuenta nueva**. Al tocarlo se abre la ventana de APPI con todos
los campos (sucursal, número, titular, socio, contraseña con generador,
membresía 1 mes / 🧪 PRUEBA) y un campo nuevo: **WhatsApp del titular
(opcional)**, para mandarle las credenciales directo.

## Credenciales en dos mensajes

Al crear una cuenta o aprobar una solicitud, aparece el popup
**📨 Enviar credenciales** con dos botones:

- **💬 Enviar bienvenida y pasos**: saluda, dice el DIP y el titular, y
  explica cómo entrar. Avisa que la contraseña llega en un mensaje aparte
  — nunca la incluye.
- **🔑 Enviar solo la contraseña**: el mensaje es la contraseña, ni una
  palabra más. Se copia y pega sin borrar nada.

Con teléfono cargado, WhatsApp abre directo a esa persona (validado por
APPITel); sin teléfono, abre el selector de contactos.

## Solicitudes pendientes que parpadean

Mientras haya solicitudes sin resolver, el título parpadea fuerte con el
badge **● N NUEVAS**. Imposible que una creación de cuenta pase de largo.

## Cumplimiento diario, minimizado y con buscador

La sección arranca cerrada mostrando el resumen en el encabezado
(*"12 cuentas · hoy ✓ 45 · ✗ 8"*). Al tocarla se despliega con un
**buscador por nombre o DIP** y la lista en orden alfabético.

## Estadísticas de membresías: 🧪 En prueba

La grilla suma la tarjeta con la cantidad de cuentas en modo PRUEBA.

## 📅 Ingresos por mes

Sección nueva bajo las estadísticas: selector **‹ Agosto 2026 ›** con el
**total recaudado**, la **cantidad de pagos** y la lista de quién pagó
(nombre, DIP, fecha, importe, método), más la **tira anual** con los 12
meses del año y su total para ver la tendencia de un vistazo. Los datos
salen de los pagos registrados con 💳 (ya se guardaban en la base).

> ⚠️ Requiere correr `SUPABASE_INGRESOS_ADMIN.sql` en Supabase (solo
> responde al rol admin). Hasta entonces, la sección avisa el error y el
> resto del panel funciona igual.

La guía "?" del panel quedó actualizada con todo esto.

## Pruebas

`admin-orden.spec.js` (nuevo, 6 pruebas): el popup con todos los campos,
el parpadeo, el colapsable con buscador, la tarjeta En prueba, los
ingresos mensuales con su SQL, y que la bienvenida jamás incluya la
contraseña (y la contraseña viaje sola).

## App Shell y caché v300

- `300.0.0` · visible `v300` · caché `appi-v300-panel-ordenado`
