# Configurar la nube y la IA del Histórico

El Histórico funciona completamente en forma local sin realizar estos pasos. La configuración siguiente activa acceso por correo, sincronización de cierres, respaldo de los archivos originales y análisis online con IA.

## 1. Crear el proyecto

1. Crear un proyecto en Supabase.
2. Abrir **SQL Editor**.
3. Copiar y ejecutar todo el contenido de `SUPABASE_SETUP.sql`.
4. En **Authentication → URL Configuration**, agregar la URL donde está publicada APPI como Redirect URL.
5. En APPI abrir **Histórico → Nube**.
6. Copiar la Project URL y la clave pública `anon` de Supabase.

La clave `anon` puede estar en el navegador porque las políticas RLS impiden que una cuenta consulte datos de otra. Nunca colocar la `service_role` dentro de APPI.

## 2. Desplegar la función de IA

Con Supabase CLI instalado y el proyecto vinculado:

```bash
supabase functions deploy historico-analisis
supabase secrets set OPENAI_API_KEY="TU_CLAVE_PRIVADA"
supabase secrets set AI_MODEL="gpt-4o-mini"
```

`AI_MODEL` puede cambiarse por otro modelo compatible. Si se usa un proveedor compatible con Chat Completions, también se puede establecer:

```bash
supabase secrets set AI_API_URL="https://proveedor.example/v1/chat/completions"
```

La clave privada de IA queda en Supabase y nunca se envía al navegador.

## 3. Probar

1. En Histórico → Nube, enviar un enlace de acceso al correo.
2. Abrir el enlace recibido.
3. Guardar un cierre y pulsar **Sincronizar ahora**.
4. En Histórico → Analizar, elegir los meses.
5. Marcar la autorización de envío y pulsar **Análisis con IA**.

## Privacidad

La función recibe nombres, códigos, categorías, puntos, ramas, garantías y resultados por período. APPI excluye teléfonos, domicilios, correos y cumpleaños del pedido de análisis. La sincronización de los archivos originales sí conserva las copias completas dentro del almacenamiento privado de la cuenta.
