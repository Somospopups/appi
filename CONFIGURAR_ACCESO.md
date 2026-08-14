# Configurar acceso por número de distribuidor

Esta etapa reemplaza la activación pública anterior por cuentas individuales con número de distribuidor y contraseña.

## Comportamiento elegido

- La sesión queda recordada.
- APPI permite trabajar hasta 7 días offline desde la última validación online.
- La cuenta puede abrirse en cualquier cantidad de dispositivos.
- Supabase RLS garantiza que cada cuenta consulte únicamente sus propios datos.
- Presupuesto, 7 P, ruedas, equipo, usuarios, contactos, cultura y notas se sincronizan por cuenta.
- **Los audios no se sincronizan:** quedan únicamente en el dispositivo donde fueron grabados. APPI lo informa dentro de Mi cuenta.
- Al cerrar sesión, los datos dejan de estar visibles y quedan separados por cuenta. En equipos compartidos se puede elegir “Cerrar y borrar la copia de este dispositivo”.

## 1. Crear Supabase

1. Crear un proyecto nuevo en Supabase.
2. Abrir **SQL Editor**.
3. Ejecutar primero `SUPABASE_SETUP.sql`.
4. Ejecutar después `SUPABASE_ACCESO.sql`.
5. En **Authentication → Providers → Email**, mantener habilitado Email/Password.
6. Deshabilitar el registro público de usuarios. Las cuentas se crearán solamente desde el panel administrador.

Nunca colocar la clave `service_role` en `auth-config.js`, HTML ni JavaScript del navegador.

## 2. Crear el primer administrador

El primer administrador se crea una sola vez desde Supabase.

1. En **Authentication → Users**, crear un usuario confirmado con:
   - Email interno: `admin-popups@appi.invalid`
   - Password: una contraseña segura de al menos 12 caracteres, con mayúscula, minúscula y números.
2. Ejecutar `SUPABASE_ADMIN_SIN_DISTRIBUIDOR.sql`.
3. Verificar que el perfil tenga:
   - `username`: `popups`
   - `rol`: `admin`
   - `dip`, `sucursal` y `numero_distribuidor`: `NULL`

El administrador entra desde el candado de la pantalla de acceso y solo escribe su contraseña. No se lo asocia a una sucursal ni a un número de distribuidor.

## 3. Desplegar el panel administrador

Con Supabase CLI instalado y el proyecto vinculado:

```bash
supabase functions deploy admin-distribuidores
```

La función usa automáticamente `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` dentro de Supabase. La clave privada nunca llega al navegador.

Si se cambia el dominio sintético de las cuentas, configurar el mismo valor en ambos lugares:

```bash
supabase secrets set DISTRIBUTOR_EMAIL_DOMAIN="distribuidores.appi.invalid"
```

El acceso se realiza desde el botón redondo con candado de la pantalla principal de login. Después de validar la contraseña, APPI abre el panel administrador integrado.

El administrador puede:

- Crear cuentas.
- Generar contraseñas iniciales.
- Restablecer contraseñas.
- Bloquear y reactivar cuentas.
- Crear otro administrador si fuera necesario.

## 4. Conectar APPI

Editar `auth-config.js`:

```js
window.APPI_AUTH = {
  enabled: true,
  url: 'https://TU-PROYECTO.supabase.co',
  anonKey: 'TU_CLAVE_PUBLICA_ANON',
  distributorEmailDomain: 'distribuidores.appi.invalid',
  adminLogin: { username: 'popups', email: 'admin-popups@appi.invalid' },
  loginAliases: {},
  offlineDays: 7
};
```

La clave `anon` es pública y puede estar en el navegador. La seguridad real proviene de Auth y las políticas RLS.

**Activar `enabled: true` solamente después de:**

- Ejecutar ambos SQL.
- Crear el primer administrador.
- Desplegar `admin-distribuidores`.
- Crear al menos una cuenta de prueba.
- Verificar inicio, sincronización, cierre y reapertura en dos navegadores.

## 5. Privacidad de la sincronización

Al habilitar cuentas, APPI guarda en Supabase los datos estructurados asociados al usuario: planificación, presupuesto, equipo, teléfonos/correos presentes en la Línea Descendente, Usuarios/Garantías, domicilios, contactos, cultura y notas. Histórico conserva además sus archivos originales en el bucket privado.

Las políticas RLS exigen que `auth.uid()` coincida con `user_id`, por lo que una cuenta no puede consultar filas de otra. La función administradora usa `service_role` únicamente dentro de Supabase.

Los audios se excluyen de la nube. Si el usuario utiliza el mapa, la dirección consultada se envía a Nominatim/OpenStreetMap para geocodificarla; este uso debe informarse en la interfaz antes del despliegue final.

## 6. Migración desde la activación anterior

Se eligió reactivar a todos.

En el primer ingreso de una cuenta nueva:

- APPI detecta los datos existentes en ese navegador.
- Si la cuenta todavía no tiene datos en la nube, los asocia automáticamente a esa cuenta.
- La activación antigua se elimina después del ingreso exitoso.
- Si la nube ya tiene información, APPI recupera los datos de esa cuenta y evita mostrar información de otra.

Antes del cambio en producción conviene pedir a los usuarios que descarguen un backup. La siguiente etapa unificará el backup completo, incluidos IndexedDB e Histórico.

## 7. Prueba mínima antes de publicar

1. Crear dos distribuidores de prueba: A y B.
2. Ingresar con A y cargar datos distintos.
3. Abrir APPI en otro navegador e ingresar con A: debe recuperar sus datos.
4. Cerrar sesión e ingresar con B: no debe aparecer información de A.
5. Bloquear A desde el panel: A no debe poder iniciar ni consultar tablas protegidas.
6. Desconectar internet con una sesión validada: debe abrir durante el período offline.
7. Simular más de 7 días sin validación: debe solicitar conexión.
8. Confirmar que las grabaciones no aparecen en el segundo dispositivo y que el aviso es visible.
