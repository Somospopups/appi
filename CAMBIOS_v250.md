# APPI v250 · Pre-publicación segura

Versión candidata preparada en una rama aislada. No debe publicarse hasta validar la vista previa y aplicar la migración de Supabase mediante el workflow de backend.

## Seguridad y acceso

- Supabase pasa a ser el único mecanismo de acceso: se eliminó la activación heredada calculada en el navegador y su `blocklist.json`.
- La aplicación permanece cerrada cuando la autenticación no está configurada.
- La grabadora ya no busca claves de OpenAI en `localStorage` ni sube audios directamente a un proveedor. La transcripción se procesa localmente.
- Se reforzó el escape de contenido dinámico en Home, Escalera de Sueños, Porqué y Tablero.
- Las bibliotecas de ejecución quedaron fijadas en `vendor/`, con sus licencias y hashes SRI.

## Membresías

- El frontend administrativo usa el JWT de la sesión administradora y la Edge Function `admin-distribuidores`; nunca usa la clave anónima como autorización.
- `appi_perfiles.membresia_vence` continúa siendo la fuente de verdad para permitir el ingreso.
- Pagos y prórrogas actualizan el acceso y el registro administrativo en una única transacción SQL.
- Las políticas RLS anteriores con `USING (true)` fueron reemplazadas por lectura propia o comprobación real del rol administrador.
- Las operaciones de escritura sólo están disponibles para `service_role` a través de la Edge Function.
- La migración segura quedó integrada en `SUPABASE_MEMBRESIAS.sql` y en el instalador consolidado.

## PWA y sincronización

- Calendario, Escalera de Sueños, Porqué y stock personal ahora participan en la nube, el backup y la separación titular/socio.
- El Service Worker precarga todos los módulos locales activos y las bibliotecas vendorizadas.
- Se alinearon la versión de la aplicación, el registro del Service Worker y el nombre de caché en v250.

## Limpieza y correcciones

- Se corrigió la prioridad de la Agenda del Home: seguimientos con fecha preceden contactos nuevos sin fecha.
- `showView` valida el destino antes de cambiar de pantalla para evitar un Home en blanco ante llamadas inválidas.
- Se eliminó el código y las pruebas de Mi Carrera y Tu Parque, funciones retiradas intencionalmente en la versión anterior.
- Se actualizaron las pruebas del Home, administración y Herramientas para representar la interfaz actual.
- Se corrigió el conflicto de estilos que dejaba los modales de pagos y prórrogas sin interacción.

## Despliegue

El workflow `.github/workflows/deploy-backend.yml` ahora:

1. instala el esquema consolidado y las migraciones posteriores;
2. despliega las seis Edge Functions;
3. mantiene `encuesta-publica` y `solicitud-cuenta` como funciones públicas con validación interna;
4. conserva autenticación JWT para las funciones privadas.

## Scroll

- Tras elegir titular o socio, el `overflow: hidden` del login ya no queda pegado al `body`.
- El overlay de diálogos y el calendario dejan de tapar la página cuando están cerrados (`display: none`).
- En el celular el desplazamiento vive en `.app`, para que iOS/Android no queden trabados por capas `position: fixed`.

## Verificación

- Sintaxis JavaScript comprobada con `node --check`.
- Suite Playwright: **84/84 pruebas en verde**.
- Publicación validada en GitHub Pages y backend desplegado correctamente mediante GitHub Actions.
