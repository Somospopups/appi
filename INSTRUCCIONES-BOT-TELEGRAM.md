# 🚀 Alta del bot de Telegram de APPI (pasos para el usuario)

> Todo el código ya está implementado y pusheado. Para encenderlo hacen falta
> 4 pasos manuales (los hace una sola vez, ~5 minutos).

## 1. Crear el bot en Telegram (~2 min)

1. Abrí Telegram y buscá **@BotFather** (es el bot oficial de Telegram).
2. Mandale `/newbot`.
3. Nombre que se muestra: p. ej. `APPI Avisos`.
4. Username: tiene que terminar en `bot` — p. ej. `appi_avisos_bot`.
5. BotFather te devuelve un **token** con esta pinta:
   `1234567890:AAHf...-una-cadena-larga`.
6. Guardalo: lo vas a pegar en el paso 3.
7. (Opcional y lindo) `/setuserpic` para ponerle el logo de APPI, y
   `/setdescription` con «Avisos de APPI: tu resumen diario a las 8:00».

## 2. Generar una contraseña para el webhook

Cualquier contraseña larga al azar (20+ caracteres). La usamos para que nadie
más que Telegram pueda hablar con nuestro webhook. Ejemplo rápido de cómo
generar una:

```bash
openssl rand -hex 24
```

## 3. Guardar los 3 secretos en GitHub

En el repo **Somospopups/appi** → *Settings* → *Secrets and variables* →
*Actions* → *New repository secret*:

| Nombre del secret | Valor |
|---|---|
| `TELEGRAM_BOT_TOKEN` | El token de BotFather (paso 1) |
| `TELEGRAM_BOT_USERNAME` | `appi_avisos_bot` (sin @, sin .bot) |
| `TELEGRAM_WEBHOOK_SECRET` | La contraseña larga del paso 2 |

## 4. Correr el workflow «Configurar bot de Telegram (una vez)»

1. En GitHub: *Actions* → **Configurar bot de Telegram (una vez)** →
   *Run workflow*.
2. Ese workflow:
   - guarda los secretos en las Edge Functions de Supabase, y
   - registra el webhook en Telegram (`setWebhook` + verificación).
3. Al terminar tiene que quedar todo en verde y el último paso muestra el
   `getWebhookInfo` con `url` apuntando a `.../functions/v1/telegram-webhook`.

## 5. Probar el envío real

1. Entrá a APPI → Home → tarjeta **📲 Avisos por Telegram** (o menú lateral).
2. Tocá **Conectar Telegram** → se abre el chat del bot con el código.
3. Tocá **Iniciar**. El bot responde: «¡Listo, {nombre}! ✅».
4. Si ese día hay pendientes de Mi Gestión, el resumen llega al instante como
   muestra. Si no, llega el resumen a las 8:00 del día siguiente (o cuando
   haya presentaciones próximas).

## Qué recibe cada distribuidor (y cómo desactivarlo)

- **8:00 ART**: resumen diario («Tenés 2 seguimientos vencidos y 1
  presentación…»).
- A lo largo del día: aviso **30 min antes** de cada presentación con hora.
- Desde el chat: `/pausa` (deja de recibir), `/reanudar`, `/ayuda`.
- Desde APPI: la misma tarjeta permite **Desconectar**.
- Si el distribuidor **bloquea el bot**, APPI lo detecta y no reintenta.

## Difundir a la red

Cuando la prueba de los primeros chats esté OK, se avisa a la red (anuncio en
APPI + WhatsApp) con el paso a paso de 30 segundos: abrir la tarjeta →
Conectar → Iniciar. No hace falta que nadie instale nada.

## Fase 2 (después)

Anuncios al instante por el mismo canal y, más adelante, WhatsApp Cloud API
con el mismo motor (`appi_canales_aviso` soporta el canal `whatsapp`).
