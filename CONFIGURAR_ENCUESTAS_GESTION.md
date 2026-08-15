# Configurar Mi Encuesta y Mi Gestión

Este módulo agrega invitaciones privadas de encuesta —una por envío, válidas por 24 horas y para una sola respuesta— y un CRM privado dentro de APPI.

## 1. Instalar las tablas y políticas

Abrir el SQL Editor del proyecto `appi-produccion`:

https://supabase.com/dashboard/project/tqwnjfnaywjmyfplvatm/sql/new

Copiar y ejecutar todo el archivo:

```text
SUPABASE_ENCUESTAS_GESTION.sql
```

El script crea:

- `appi_encuesta_links` — compatibilidad con la versión anterior
- `appi_encuesta_invitaciones` — invitaciones privadas de 24 horas y un solo uso
- `appi_encuestas`
- `appi_gestion_contactos`
- políticas RLS por distribuidor
- índices y validaciones
- un enlace para cada distribuidor existente
- un trigger para las cuentas nuevas
- la función atómica `appi_registrar_encuesta_publica`

La consulta final debe devolver `Mi Encuesta y Mi Gestión instaladas`.

## 2. Desplegar la Edge Function

La función pública valida el token del enlace, la membresía, las respuestas, el consentimiento y los referidos.

```bash
supabase link --project-ref tqwnjfnaywjmyfplvatm
supabase functions deploy encuesta-publica --no-verify-jwt
```

`--no-verify-jwt` es intencional porque quien responde no tiene una cuenta APPI. La función no confía en el navegador: vuelve a validar todo y usa un token opaco que sólo permite enviar, nunca leer.

## 3. Verificaciones técnicas

1. Ingresar a APPI con un distribuidor.
2. Abrir `Mis herramientas → Mi Encuesta`.
3. Tocar `Copiar invitación` y confirmar que se genere un enlace con esta forma:

```text
https://somospopups.github.io/appi/encuesta.html?t=TOKEN
```

4. Abrirlo en una ventana privada y comprobar que una segunda ventana o dispositivo quede bloqueado.
5. En Android con Chrome, probar `Elegir desde mi agenda`; en iPhone debe mantenerse disponible la carga manual.
6. Completar una encuesta de prueba.
7. Volver a APPI y abrir `Mi Gestión`.
8. Confirmar que aparezcan el encuestado y sus referidos.
9. Cambiar estado, notas y próximo contacto.
10. Abrir APPI en otro dispositivo y verificar los cambios.

## 4. Seguridad

- No dar acceso de Supabase a distribuidores.
- No exponer `SUPABASE_SERVICE_ROLE_KEY`.
- No insertar respuestas públicas directamente con la clave publishable.
- No eliminar las políticas RLS.
- No reemplazar los diálogos APPI por confirmaciones del navegador.
- Si un enlace se comparte indebidamente, puede desactivarse en `appi_encuesta_links`; una futura interfaz puede permitir rotarlo.

## 5. Archivos relacionados

- `encuesta.html`
- `gestion-client.js`
- `SUPABASE_ENCUESTAS_GESTION.sql`
- `supabase/functions/encuesta-publica/index.ts`
- `tests/e2e/encuesta-gestion.spec.js`
