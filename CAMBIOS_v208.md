# APPI v208 · Menú práctico

## Cambios

- Se agregó **Teléfonos vinculados** directamente al menú del engranaje.
- El acceso sólo aparece para cuentas distribuidoras autenticadas.
- El menú actualiza el estado de la cuenta cada vez que se abre.
- Se retiró **Forzar modo landscape**.
- Se retiró **Backup** del menú del engranaje.
- Se eliminó el antiguo botón flotante de rotación y su código asociado.
- El sistema de backup y sus datos no fueron eliminados; sólo se quitó el acceso del menú para simplificar la interfaz.

## Orden final del menú

1. Modo noche / Modo día.
2. Teléfonos vinculados.
3. Mi cuenta.
4. Cerrar sesión.

## Backend

No requiere cambios SQL ni despliegues de Supabase.
