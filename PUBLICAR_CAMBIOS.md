# Publicar cambios de APPI desde Arena.ai

Este protocolo se usa únicamente cuando el propietario confirma que está trabajando desde Arena.ai. Al cerrar el conjunto de cambios acordados, el agente entrega un ZIP que publica una actualización con doble clic. El propietario no necesita editar código, usar la terminal ni copiar archivos al repositorio.

## Seguridad

- Nunca pedir ni incorporar tokens, contraseñas, cookies o credenciales en el chat, el código, el bundle, el ZIP o los commits.
- El `PUBLICAR.bat` debe usar `git push` normal. Git Credential Manager se encarga de abrir el inicio de sesión oficial de GitHub si hace falta.
- No realizar el push desde la sesión del agente. Entregar el ZIP para que el propietario autentique y publique desde su equipo.

## Preparar la actualización

1. Consultar `origin/main` reciente y trabajar sobre esa base. Antes de actualizar la copia, revisar `git status`; no borrar cambios locales ni ejecutar `reset --hard` sobre trabajo que deba conservarse.
2. Implementar todos los cambios acordados y ejecutar las pruebas relevantes de APPI. La suite completa se ejecuta con `npm ci` y `npm test`. Si un chequeo falla, resolverlo o explicarlo antes de preparar el ZIP.
3. Incrementar la versión de APPI **una sola vez por ZIP/publicación**. Alinear `package.json`, `package-lock.json`, la versión de caché, `index.html` (versión visible, Service Worker y query de `lista-precios.js` cuando corresponda), `service-worker.js` y las notas de versión del `README.md`. No incrementar una versión por cada cambio intermedio si varios van en el mismo ZIP.
4. Crear un commit limpio basado en el último `origin/main`, que contenga únicamente el trabajo acordado. Si hay commits locales anteriores sin publicar que pertenecen a esta misma entrega, consolidarlos para que el bundle represente una sola actualización coherente.
5. Crear un bundle de Git que contenga sólo ese commit. Si `BASE` es el padre del commit:

   ```sh
   BASE=$(git rev-parse HEAD^)
   git bundle create cambio-appi-vNNN.bundle HEAD ^"$BASE"
   ```

6. Entregar un ZIP con esta estructura:

   ```text
   actualizacion-appi-vNNN/
   ├── PUBLICAR.bat
   ├── cambio-appi-vNNN.bundle
   └── LEEME.txt
   ```

## Comportamiento de `PUBLICAR.bat`

El BAT debe ser autocontenido con respecto a la carpeta extraída del ZIP y:

1. Comprobar si Git está instalado; si falta, abrir la página oficial de instalación y salir sin modificar nada.
2. Clonar `https://github.com/Somospopups/appi.git` en una carpeta temporal, obteniendo así el `main` más reciente.
3. Ejecutar `git fetch` del bundle incluido y aplicar su único commit con `git cherry-pick`.
4. Si el commit ya no aplica limpiamente porque `main` avanzó, abortar el cherry-pick, no hacer push y explicar que hay que pedir al agente que regenere el paquete sobre la base nueva.
5. Si aplica, ejecutar `git push origin main`. No incluir credenciales en el BAT: Git Credential Manager gestiona el inicio de sesión.
6. Mostrar claramente si se publicó o si falló. Limpiar la carpeta temporal al terminar correctamente; no eliminar ni alterar el repositorio original del propietario.

## Qué recibe y hace el propietario

El agente entrega el ZIP. El propietario lo descarga, lo extrae y hace doble clic en `PUBLICAR.bat`. Si GitHub solicita autenticación, la confirma en el flujo oficial del navegador/Git Credential Manager. No se le pide abrir una consola ni resolver conflictos manualmente.

## Condición de uso

Este procedimiento es una preferencia del propietario **solo para el trabajo realizado desde Arena.ai**. Al retomar APPI en una nueva sesión, preguntar primero si está trabajando desde Arena.ai; si la respuesta es negativa, consultar la forma de entrega que prefiere.
