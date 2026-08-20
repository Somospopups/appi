# Sistema de Mensajes para Usuarios — plan acordado

Todo definido con tus respuestas. **Falta tu OK final para programarlo.**

---

## 1. El dato de cumpleaños ya lo tenemos

Yo me había equivocado: dije que el Excel no traía fecha de nacimiento porque
miré el código en vez de la planilla. Vos insististe y tenías razón.

El Excel de Garantías trae **16 columnas**, y la app hoy lee sólo 8:

| # | Columna | ¿La lee hoy? |
|---|---|---|
| 1 | Usuario | ✅ |
| 2 | Teléf. | ✅ |
| 3 | Domicilio | ✅ |
| 4 | C.P. | ✅ |
| 5 | Localidad | ✅ |
| 6 | Garantias | ❌ |
| 7 | Serie | ❌ |
| 8 | Producto | ✅ |
| 9 | F.Compra | ✅ |
| 10 | F.Vence | ✅ |
| 11 | V R | ❌ |
| 12 | Canje | ❌ |
| 13 | Dip reasignado | ❌ |
| 14 | E Mail | ❌ |
| 15 | **Cumpleaños** | ❌ ← **la vamos a leer** |
| 16 | Motivo Baja | ❌ |

Agregar `Cumpleaños` es un cambio chico. De paso dejo enganchado `E Mail`,
que no cuesta nada y puede servir más adelante.

---

## 2. Quién recibe qué

Ésta es la regla central. Cada cliente cae en uno de tres grupos según su
fecha de vencimiento:

```
   VIGENTE                VENCIDO HACE          VENCIDO HACE
   (no venció)            MENOS DE 1 AÑO        MÁS DE 1 AÑO
        │                       │                     │
        ▼                       ▼                     ▼
  🔧 Mantenimiento        🔄 Renovación          ⛔ Nada
  🎂 Cumpleaños           (sin mantenimiento)    (fuera de todo)
  ⏰ Por vencer           (sin cumpleaños)
```

- **Vigentes** → mantenimiento cada 6 meses + saludo de cumpleaños.
- **Vencidos hace menos de 1 año** → sólo mensaje de renovación. No mantenimiento,
  no cumpleaños.
- **Vencidos hace más de 1 año** → ninguna acción, tal como pediste.

---

## 3. El ciclo de 6 meses

Se cuenta **desde la fecha de compra**. A los 6, 12, 18, 24 meses, y así.

Ejemplo con una compra del 10/01/2024:

```
10/01/2024  compra
10/07/2024  ← aviso  (6 meses)
10/01/2025  ← aviso  (12 meses)
10/07/2025  ← aviso  (18 meses)
```

Cada cliente tiene su propia fecha, así que los avisos quedan repartidos a lo
largo del año en vez de amontonarse todos juntos.

Como cada uno arrastra su historia, al principio va a haber clientes con el
aviso ya pasado. Para que no te aparezcan 200 pendientes el primer día, sólo
se muestran los que **caen dentro de los últimos 30 días**. Lo viejo queda atrás.

Y cuando le escribís, la app anota la fecha para no repetirte el mismo aviso
al día siguiente.

---

## 4. Dónde vive

Dentro de **Usuarios / Garantías**, como pediste. No se toca ninguna otra pantalla.

- Un botón nuevo **💬 Mensajes** en la barra de herramientas.
- Un botón **💬** en cada ficha, para escribirle a alguien puntual.
- Un aviso arriba cuando hay pendientes del día.

---

## 5. Los avisos

Las dos formas, como elegiste:

1. **Dentro de Garantías** — al entrar ves "hoy le toca a 3 clientes".
2. **Notificación del celular** — aunque APPI esté cerrada.

Sobre la notificación del sistema, tres cosas honestas:

- Hay que **pedirte permiso** una vez. Si decís que no, no hay notificación.
- En **iPhone** sólo funciona si instalaste APPI en la pantalla de inicio, y
  aun así Apple es caprichosa. En Android anda bien.
- Se dispara **cuando abrís la app**, no a las 9 de la mañana clavadas. Programar
  notificaciones a horario fijo sin un servidor no es confiable en una PWA.

Si querés horario exacto y garantizado, hace falta que el servidor las mande
(se puede hacer con Supabase, pero es otro laburo y lo dejaría para después).

---

## 6. Las plantillas

Escribo yo las primeras y vos las editás desde la app cuando quieras.

Arranco con estas cinco:

| Plantilla | Cuándo |
|---|---|
| 🔧 Retrolavado | Cada 6 meses desde la compra |
| 🎂 Cumpleaños | El día que cumple |
| ⏰ Garantía por vencer | 30 días antes |
| 🔄 Renovación | Vencido hace menos de 1 año |
| 👋 Saludo suelto | Cuando vos quieras |

### Etiquetas que se rellenan solas

`{nombre}` · `{producto}` · `{domicilio}` · `{localidad}` · `{vence}` ·
`{compra}` · `{link_retrolavado}`

### Ejemplo — Retrolavado

```
Hola {nombre}! 👋

Te escribo para recordarte que a tu {producto} le toca un
retrolavado. Es un mantenimiento simple, de 5 minutos, que
mantiene el equipo funcionando como el primer día.

Te dejo el video paso a paso:
{link_retrolavado}

Cualquier duda escribime que te ayudo. 😊
```

### Ejemplo — Cumpleaños

```
¡Feliz cumpleaños, {nombre}! 🎂🎉

Que tengas un día hermoso rodeado de la gente que querés.

Un abrazo grande 🤗
```

### Ejemplo — Renovación

```
Hola {nombre}! 👋

Te cuento que la garantía de tu {producto} venció el {vence}.

Renovarla es simple y te deja tranquilo con el servicio técnico
y el mantenimiento cubierto. ¿Querés que te pase los detalles?
```

Todas editables desde la app.

---

## 7. Un límite de WhatsApp que conviene saber

WhatsApp **no deja** mandar 40 mensajes de un saque desde una app web. Cada
mensaje abre WhatsApp con el texto ya escrito y vos tocás enviar.

No es limitación de APPI — y en el fondo te protege, porque los envíos masivos
son la vía rápida para que te bloqueen el número.

Lo que sí hago es una **fila de trabajo**: "quedan 6", mandás uno, la app pasa
sola al siguiente. Tres toques por cliente en vez de veinte.

---

## 8. Cómo lo publico

Cada etapa se prueba en producción antes de arrancar la siguiente.

| Etapa | Qué entra |
|---|---|
| **1** | Leer Cumpleaños y E Mail del Excel + botón 💬 en cada ficha con las 5 plantillas |
| **2** | Panel "Hoy": mantenimiento a 6 meses, cumpleaños, por vencer, renovación |
| **3** | Notificación del celular |
| **4** | Fila de trabajo y registro de a quién ya le escribiste |

Arrancaría por la **etapa 1**: se ve el resultado enseguida y el riesgo es casi nulo.

---

## 9. Lo que quiero que confirmes

1. El cuadro de quién recibe qué (punto 2).
2. Los textos de las tres plantillas de ejemplo (punto 6).
3. Que arranquemos por la etapa 1.
