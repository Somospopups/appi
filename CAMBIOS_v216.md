# APPI · v216 · Recordatorios de Mi Gestión

## Objetivo

Cerrar el pendiente que dejó la v215: definir qué eventos internos generan notificaciones desde el backend. Hasta ahora solo las solicitudes de llamada llegaban con APPI cerrada; los seguimientos, vencidos y presentaciones dependían de que el distribuidor abriera la app.

## Qué recibe el distribuidor

**Resumen diario · 9:00 de la mañana**

Una sola notificación con todo el tablero Hoy:

> **Buen día, María**
> Tenés 2 seguimientos vencidos, 3 seguimientos para hoy y 1 presentación. Además llegaron 2 encuestas nuevas.

Cubre nuevos, seguimientos del día, vencidos, presentaciones y encuestas recibidas el día anterior. Si no hay nada pendiente, no llega ninguna notificación: el silencio también es información.

**Aviso de presentación · 30 minutos antes**

> **Presentación en 30 minutos**
> Carolina Martínez · 15:30

Solo para presentaciones con hora cargada. Sin hora, la presentación viaja únicamente dentro del resumen de la mañana.

## Cambios en la app

- Nuevo campo opcional **Hora de la presentación** en el detalle del contacto.
- La tarjeta del contacto muestra fecha y hora de la presentación.
- Al tocar el resumen se abre Mi Gestión en la vista **Hoy**.
- Al tocar un aviso de presentación se abre directamente ese contacto.
- El destino queda guardado hasta que la persona termina de ingresar y elige titular o socio.
- Un destino ya consumido se limpia de la URL y del almacenamiento: no se repite al recargar.
- Cada tipo de aviso usa su propia etiqueta, así un recordatorio nunca reemplaza una solicitud de llamada en la bandeja.
- Solo la llamada exige interacción; los recordatorios esperan sin bloquear la pantalla.
- `CACHE_NAME` y el registro pasan a `v216`.

## Backend

- Migración `SUPABASE_RECORDATORIOS.sql`.
- Nueva columna `proximo_contacto_hora` en `appi_gestion_contactos`.
- Nueva columna `recordatorios` en `appi_dispositivos_vinculados`: cada teléfono decide si los quiere. Las llamadas llegan siempre.
- Nueva tabla `appi_recordatorios_enviados` con clave única por cuenta, persona, tipo y día.
- Funciones `appi_resumen_gestion`, `appi_pendientes_resumen` y `appi_presentaciones_proximas`.
- Nueva Edge Function `recordatorios-gestion`.
- Tres tareas `pg_cron`: resumen a las 12:00 UTC (9:00 en Argentina), presentaciones cada 15 minutos y limpieza mensual del historial.

## Decisiones de diseño

- **Un solo canal.** Reutiliza las suscripciones Web Push del puente de dispositivos. No pide un permiso nuevo ni agrega otra vinculación.
- **Sin duplicados.** El aviso se reserva en la base antes de enviarse. Si el cron se solapa, se reintenta o el proyecto se reinicia, la clave única lo bloquea.
- **Horario argentino.** "Hoy" se calcula con `America/Argentina/Buenos_Aires` para que coincida con lo que el distribuidor ve en pantalla.
- **Por persona.** Titular y socio reciben el resumen de la cuenta en su propio teléfono vinculado.
- **Sin ruido.** Sin pendientes no hay notificación.
- **Secretos fuera del repo.** La clave de servicio se lee desde Vault; nunca queda escrita en la definición del cron ni en el SQL.

## Seguridad

- La Edge Function exige la clave de servicio: el navegador no puede disparar envíos masivos.
- Solo se notifica a cuentas activas con membresía vigente.
- Los endpoints de push vencidos (404/410) se limpian igual que en el puente de llamadas.
- La tabla de recordatorios tiene RLS y no se expone a `anon` ni `authenticated`.
- El historial se borra automáticamente a los 90 días.

## Instalación

1. Ejecutar `SUPABASE_RECORDATORIOS.sql` en el SQL Editor.
2. Guardar los secretos en Vault una sola vez:

```sql
select vault.create_secret('https://TU_PROYECTO.supabase.co', 'appi_project_url');
select vault.create_secret('SERVICE_ROLE_KEY', 'appi_service_role_key');
```

3. Desplegar la función:

```bash
supabase functions deploy recordatorios-gestion
```

O ejecutar el workflow **Publicar backend de cuentas y teléfonos** desde GitHub Actions.

## Pruebas

- Nueva suite `tests/e2e/recordatorios.spec.js`, 4 pruebas:
  - cada tipo de aviso genera su notificación con etiqueta, ícono e insignia propios;
  - al tocar un recordatorio la ventana existente recibe el destino y se enfoca;
  - un enlace de recordatorio abre Mi Gestión y el contacto avisado, muestra la hora y limpia el destino;
  - el backend protege el envío masivo y el SQL no contiene claves.
- Suite completa de Playwright: **21 aprobadas en 52,8 s**.
- Sintaxis JavaScript y `git diff --check`: correctas.

## Pendiente para la próxima versión

- Permitir que cada distribuidor elija su propio horario de resumen desde el engranaje.
- Avisar cuando llega una encuesta nueva en el momento, no solo en el resumen del día siguiente.
