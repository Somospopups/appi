# APPI v894 · Primer ingreso acompañado

## Qué cambia

- Reemplaza los carteles separados del primer ingreso por un único recorrido progresivo.
- Da la bienvenida usando el nombre real del perfil.
- Permite elegir iPhone o Android y muestra una guía específica para crear el acceso directo.
- Conecta MI PSA usando el almacenamiento y los campos reales de APPI.
- Solicita el permiso real de notificaciones y guarda la selección en los recordatorios reales.
- Resume qué quedó listo y qué quedó pendiente.
- Permite volver atrás, cerrar y continuar más tarde.
- Muestra una tarjeta discreta en el Home cuando quedan pasos pendientes.

## Coordinación con APPI

- El tutorial anterior no aparece durante el recorrido nuevo.
- El popup automático de MI PSA no se abre durante ni después del primer ingreso guiado.
- El popup automático de avisos no se superpone con el recorrido.
- Si los datos de MI PSA guardados son inválidos, se conserva el popup específico con campos editables.
- Cámara, micrófono, ubicación y otros permisos no se solicitan en el primer ingreso.

## Pruebas

- Recorrido completo iPhone: acceso directo, MI PSA, avisos y resumen.
- Recorrido completo Android: guía, pasos pendientes, tarjeta en Home y continuidad después de recargar.
- Persistencia real en `appsi_psa_creds`, `appi_recordatorios_v1`, `appi_notif_listo_v1` y `appi_onboarding_v1`.
- Ausencia de superposición con los popups anteriores.
- Pruebas focalizadas de autenticación, arranque, sintaxis, App Shell y regresión principal.

## Versión

- Versión: `894.0.0`
- Caché: `appi-v894-primer-ingreso`
