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

## Login en PC

- El arreglo de scroll dejaba `pointer-events: none` pegado en la pantalla de ingreso. En el celular casi no se nota; en la PC el clic atravesaba los botones. El login vuelve a recibir clics.
- Los botones del ingreso quedan clickeables aunque el overlay quede trabado, y el menú de PC no se come el clic.

## Herramientas en PC

- El menú lateral de escritorio no tenía Coach de Demo, Botella ni Simulador. En el celular están en la pestaña Herramientas; en la PC ahora aparecen en **Mis herramientas**.
- La barra lateral scrollea el listado y deja fijos el logo y la versión, para que no se corten ítems en pantallas bajas.

## HTML

- Se recortó basura duplicada después de `</html>` que se veía como código suelto al pie de la página.

## Mi stock

- El stock personal salió de Presupuesto y vive en **Mis herramientas** (celular y menú de PC).
- En PC el ítem **📦 Mi stock** va primero en la barra lateral (para no quedar abajo, fuera de vista). Tocá **Mis herramientas** y se abre la grilla con el icono.
- En escritorio la pantalla muestra **En casa** y **Prestados** lado a lado; el popup de prestar queda centrado.
- Se pueden cargar productos a mano y prestar de a una unidad: pide a quién y el teléfono, y pone la fecha de hoy.
- En Prestados: **YA ME LO DEVOLVIÓ** vuelve al stock. **ELIMINAR** borra el préstamo y no toca el stock (pide confirmación).

## Tarjetas y promos

- En **Usuarios** y en el **Panel de Contactos** se puede cargar, por persona, una o varias tarjetas (marca + banco: Visa Galicia, Naranja, etc.).
- El dato se guarda aparte de la planilla: recargar el Excel no borra las tarjetas. Si hay teléfono, se comparte entre Usuarios y Contactos.
- Filtro **Promos con tarjeta** para avisar de a uno por WhatsApp. En el texto se pueden usar `{nombre}` y `{tarjeta}`.

## Mi Equipo

- Se quitó la tarjeta **Duplicación de este mes** (patrocinados directos activos / quiénes ya duplican). No aportaba y ocupaba el tablero.

## Árbol del equipo

- En el listado, tocar el **nombre** abre la ficha. Tocar desde la izquierda hasta la píldora de categoría abre o cierra la organización, si tiene gente debajo.

## Engranaje · WhatsApp

- El ítem **¿Qué WhatsApp utilizás?** ya no agrega «· WhatsApp» / «· WhatsApp Business» al final. La pregunta alcanza; la app elegida se ve al abrir el diálogo.

## Impulso y avisos

- En el Home aparece **Tu impulso**: una sola acción del día, racha y el avance de Cultura (15 PB + 2 invitados).
- En el engranaje, **Activar avisos del día** pide permiso y manda un aviso local si hay algo urgente.
- El teléfono vinculado sigue recibiendo el resumen de las 9:00 y el aviso 30 minutos antes de una demo.

## Simulador

- **Por cada cierre:** ganancia por cada producto comercializado.
- **Por cada producto de red:** compensación económica asociada a las adquisiciones realizadas por la red de distribuidores.

## La botella

- Además de la plata, la demo muestra el impacto ambiental: kilos de plástico, metros cuadrados, años de descomposición y petróleo para fabricar el PET. Los números se mueven con las botellas por día.

## Simulador

- Las barras de **Demos por mes** y **Cierres** quedan atadas: 3 demos = 1 cierre. Mover una mueve la otra (el número y el pulgar de la barra).

## Ingreso en celular · titular y socio

- El diálogo **¿Quién sos?** salió de `#lockScreen`. En el teléfono, `pageshow` (PWA / bfcache) llamaba a `forzarScrollLibre()`, tapaba la elección y dejaba un Home a medias.
- Si falta elegir titular o socio, el overlay se mantiene visible y la app no arranca el Home ni limpia las herramientas.
- Caché PWA: `appi-v250-splash`. Recargar o borrar datos del sitio si quedó el Service Worker viejo.

## Apertura en el celular

- Al abrir la PWA ya no sale la pantalla azul oscura con el ícono cuadrado. El splash usa el mismo fondo claro que la carga (`#eef4ff`) y el ícono redondeado de APPI.
- En iPhone se agregaron imágenes de arranque (`apple-touch-startup-image`) para que no aparezca un recuadro feo antes del boot.
- Después de elegir titular o socio ya no hay un pantallazo de Home roto: el diálogo se queda en **Entrando…** hasta que el Home está pintado.

## Verificación

- Sintaxis JavaScript comprobada con `node --check`.
- Suite Playwright: **84/84 pruebas en verde**.
- Publicación validada en GitHub Pages y backend desplegado correctamente mediante GitHub Actions.
