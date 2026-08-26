# MOTOR DE TRABAJO DE APPI
### De "herramientas" a un coach que te acompaña todos los días

> Propuesta · v361 en adelante · escrita para discutir y priorizar juntos.

---

## 1. El problema de fondo

APPI ya tiene **todas** las herramientas de la formación:

- 🧭 **Los 8 Pasos** (el ciclo mensual: propósito → compromiso → banco de datos → contacto e invitación → presentación → seguimiento → chequeo → evolución).
- 🗓️ **Las 7 P** del plan mensual.
- 📇 **Panel de Contactos** (Mi Encuesta y Mi Gestión).
- 💧 **Usuarios** con sus acciones del día (cumpleaños, retrolavado, garantías por vencer).
- 👥 **Mi Equipo**, planillas, **Cultura del mes** (PB + invitados).
- 📊 **Tablero de comando** (ritmo 30 demos → 10 cierres, bonus 12 PB).
- 🪜 Escalera de Sueños, Porqué vivo, Guía de Demo, Presupuesto, Stock, Garantías.

Las herramientas **por sí solas no crean hábito**. El que no avanza casi nunca lo hace porque "no sabe qué hacer": lo hace porque **nadie se lo recuerda en el momento justo**. La diferencia entre una herramienta y un *coach* es el **ritmo** — decirle a cada persona **QUÉ hacer HOY, cuándo, y registrarlo**.

Y acá está la buena noticia: **el germen del motor ya existe**. Las tarjetas del Home que tanto te gustan (el mazo de acciones diarias) son exactamente ese coach. El objetivo es convertir ese mazo en la **columna vertebral** que une todas las herramientas en un día de trabajo guiado.

---

## 2. El concepto: el "Mazo del día" como motor

La idea es simple: **cada distribuidor abre APPI y encuentra su día de trabajo armado**, como un mazo de tarjetas que va pasando. No un menú con 20 herramientas: **una rutina diaria con 4 a 7 acciones**, cada una con su botón que lo lleva directo a la herramienta y lo deja marcado ✓/✗.

El mazo se arma **solo**, leyendo los datos reales de cada herramienta (exactamente como `home-tarjetas.js` ya hace con Mi Gestión, Usuarios y Mi Equipo):

```
💙 Para vos         →  la frase del día + tu racha (siempre presente)
📅 Tu jornada       →  seguimientos y presentaciones de hoy (Panel)
💧 Acciones         →  mensajes a Usuarios (cumpleaños, retrolavado, garantías)
🧭 Paso del día     →  el paso del ciclo que te toca hoy (Los 8 Pasos)
🎯 Ritmo de demos   →  cuántas demos llevás hoy (30 → 10 cierres)
📇 Una persona nueva→  contactar 1 persona nueva / pedir un referido
🌙 Cierre de día    →  qué hice hoy, qué marqué, preparo mañana
```

Eso **es** el motor. Todas las demás pantallas siguen existiendo para profundizar; el mazo es lo que aparece primero y lo que "aprieta" para que no se pierda nadie.

---

## 3. El día tipo (el ritmo del negocio)

La formación ya tiene su método: **Los 8 Pasos son cíclicos, se recorren todos los meses**. El motor lo que hace es **bajar ese ciclo a la semana y al día**, para que la persona no tenga que pensar qué paso toca.

| Momento | Tarjeta que aparece | Qué hace la persona | Herramienta detrás |
|---|---|---|---|
| **Mañana** | 💙 Para vos + 📅 Tu jornada | Se conecta con su "para qué" y ve quién lo espera hoy | Escalera / Porqué · Panel |
| **Medio día** | 💧 Acciones del día | Manda los mensajes que le tocan (✓/✗) | Usuarios |
| **Tarde** | 🧭 Paso del día + 🎯 Ritmo de demos | Hace el paso del ciclo que toca hoy y una demo o invitación | Los 8 Pasos · Guía de Demo |
| **Noche** | 🌙 Cierre de día | Marca lo hecho, festeja la racha, prepara mañana | — |

Cada tarjeta **vive unos segundos**, tiene **un botón** y deja una **marca** (✓/✗). Así, terminar el día con el mazo en verde se vuelve un objetivo claro y medible. Esto es lo que mantiene activa a la gente: **la rutina visible**.

---

## 4. Tarjetas nuevas (extensiones del mazo existente)

En `home-tarjetas.js` ya hay: Especial, Jornada, Oportunidades, Cumpleaños, Equipo (Cultura), Panel y Usuarios. Propongo sumar:

### 🧭 Paso del día (la más importante)
Lee la semana del ciclo de los 8 Pasos y muestra el paso que toca hoy ("Semana 3 → Paso 5: Presentación"), con su botón directo a la herramienta. Así el ciclo mensual deja de ser teórico y se vuelve una **agenda semanal automática**. Alternativa: rotación manual simple en `localStorage` para la v1.

### 🎯 Ritmo de demos
Convierte el "30 demos → 10 cierres" del Tablero en un contador diario: "Hoy 0 demos · vas 12 de 30 en el mes". La demo se marca desde la misma tarjeta (o desde la Guía de Demo), y suma al avance mensual.

### 📇 Una persona nueva
Si el banco de datos hace días que no crece, aparece "contactá 1 persona nueva o pedí un referido". Es la **alimentación** del negocio: sin gente nueva, no hay mes que venga.

### 💪 Reactivar un cliente dormido
Usa las garantías/usuarios para proponer "reactivá a un cliente que no compra hace X". Es la venta más barata y hoy ya tenés los datos para encontrarlos.

### 🌙 Cierre de día
Un mini check-in nocturno: "¿Qué dejaste listo para mañana?". Cierra el hábito y arranca la racha. Sin esto, el día queda abierto y la racha no se sostiene.

### 🔥 Racha y nivel (gamificación, no juego)
- **Racha**: 🔥 días seguidos con el día completo (mazo en verde). Se graba en la clave local `appi_*_v1_*`, como el resto.
- **Semáforo del día**: verde (todo), amarillo (parcial), rojo (nada). Visible en el Home.
- **Nivel de constancia**: Nuevo → Activo → Constante → Referente, según racha y acciones completadas.
- **Insignias simples**: primera demo, 7 días de racha, mes completo, primer cierre.

La motivación de la racha ya está sembrada en tus frases del Home ("Tu racha vale oro"). El motor la vuelve **real y medible**.

---

## 5. Acompañamiento 24/7 (todo el día, todos los días)

Ya tenés la infraestructura para esto, así que no es soñar: **Recordatorios de Mi Gestión** ya manda push (resumen 9:00, aviso 30 min antes de una demo) y `service-worker.js` ya recibe notificaciones. El motor los encadena con el mazo:

| Hora | Qué llega |
|---|---|
| **9:00** | Resumen del día: "Te esperan 3 contactos, 2 mensajes y el Paso 5". Toca → abre el mazo. |
| **Mediodía** | Empujón suave si el día está en rojo: "Ya arrancaste? Te faltan 4 acciones". |
| **Antes de cada demo** | (ya existe) aviso + abrir la Guía de Demo. |
| **Noche (20:30)** | Recordatorio de cierre: "Marcá tu día y no pierdas la racha". |

La regla de oro: **empujar, no molestar**. Un aviso por franja, con botón que lleva al mazo. El que completa su día no recibe empujones (la persona que está activa no necesita ruido).

---

## 6. Visibilidad para el líder (la otra mitad del motor)

El motor no sólo acompaña al distribuidor: **le avisa a su línea ascendente quién se está enfriando**, para que el líder pueda reaccionar a tiempo. Esto es clave en tu modelo: **la gente no se pierde a fin de mes, se pierde cuando deja de aparecer**.

Ya existe la función `appi_admin_cumplimiento()` en `SUPABASE_ACCIONES_DIA.sql`: devuelve por cuenta qué marcó cada día (✓/✗/total). Lo que falta es **subir las marcas del nuevo mazo** con la misma mecánica de `appi_acciones_v1` (que `data-sync` ya sincroniza), y armar en el Panel del administrador:

- **Mapa de actividad**: quién está en racha, quién va a medias, quién no aparece desde hace X días.
- **Lista de alertas**: "Estos 5 no abren APPI hace 7 días" → para que el líder los llame.
- **Coaching por cuenta**: ver el día tipo de un distribuidor y dónde se traba (¿no contacta? ¿no hace demos? ¿no carga planillas?).

Así el motor cierra el círculo completo: **guía al distribuidor y guía al líder para guiar al distribuidor.**

---

## 7. Por qué funciona con lo que ya tenés (y no inventa nada nuevo)

- **No hay pantalla nueva pesada**: el motor es una evolución del mazo que ya amás.
- **Reutiliza el almacenamiento** local + `data-sync` (claves `appi_*_v1_*` → `appi_datos`).
- **Reutiliza los motivos y marcas** de Usuarios (`appi_acciones_v1`, `✓/✗`).
- **Reutiliza los recordatorios** y el `service-worker` para el empuje 24/7.
- **Reutiliza la función del admin** (`appi_admin_cumplimiento`) para la visibilidad del líder.
- **Respeta el método**: Los 8 Pasos, la Cultura del mes, el ritmo 30→10 y el "para qué" siguen siendo el corazón; el motor sólo los **programa en el día**.

El motor no reemplaza el trabajo cara a cara: **lo agenda, lo recuerda y lo celebra.**

---

## 8. Plan por fases (qué construir y en qué orden)

### Fase 1 · El mazo como rutina (la que más valor da)
> Todo con `localStorage` + `data-sync`. Sin backend nuevo.

1. Tarjeta **🧭 Paso del día** (rotación simple o lectura de Los 8 Pasos).
2. Contador **🔥 Racha** + **semáforo del día** en la tarjeta Especial.
3. Tarjeta **🌙 Cierre de día**.
4. Exponer `resumenHoy` del mazo a `data-sync` con la misma mecánica de `appi_acciones_v1`, para que el admin ya vea el cumplimiento completo.

**Resultado**: en una semana, cada distribuidor abre APPI y ve su día armado, con racha y cierre. La gente que hoy se pierde, empieza a volver.

### Fase 2 · El ritmo del ciclo
- Semana del ciclo de 8 Pasos automática por mes (o editable), con recordatorio de "mañana te toca el Paso X".
- Tarjeta **🎯 Ritmo de demos** con marcado de demos en la Guía de Demo.
- Tarjeta **📇 Una persona nueva** y **💪 Reactivar dormido**.

### Fase 3 · Empuje 24/7
- Nuevo `recordatorio-motor` en Supabase (o extensión del existente) para el empujón de mediodía y el recordatorio de cierre, con el aviso adaptado a si el día está verde o rojo.

### Fase 4 · El panel del líder
- Página en el Panel del admin: mapa de actividad, alertas de inactividad y coaching por cuenta, sobre `appi_admin_cumplimiento` + las marcas nuevas.

---

## 9. Decisión para hoy

Lo que te propongo **primero** es la **Fase 1**: es la que más te gusta (el mazo de tarjetas), la que más retención genera y la que **no requiere tocar el backend**. Se puede construir, probar y publicar como la v361.

De Fase 1, el orden interno que recomiendo:

1. **Racha + semáforo del día** en la tarjeta Especial (motiva todos los días, costo bajo).
2. **Cierre de día** (cierra el hábito y sostiene la racha).
3. **Paso del día** (une el mazo con el método de la formación).

---

*Documento de propuesta. A definir juntos: qué construimos primero, qué tarjetas del día entran por defecto y cuáles quedan opcionales, y si querés que el "día tipo" sea el mismo para todos o ajustable por perfil/nivel.*
