# APPI v361 — Jornada del parque

## Qué pasaba

La función estrella de APPI —las acciones del día sobre Usuarios / Garantías—
se apagaba en cuanto el calendario no gritaba. Sólo había tres motivos:

- cumpleaños **hoy**
- mantenimiento caído en los últimos 30 días
- garantía que vence en 0–30 días

Si nadie caía en esas ventanas, la franja no se dibujaba y la tarjeta 💧 del
Home desaparecía. El parque seguía lleno de gente para escribirle (canjes de
menos de un año, vigentes sin contacto hace meses) y el distribuidor abría
APPI a un día vacío.

## Qué cambia

El motor pasa de “avisos de calendario” a **el mejor trabajo del día**, con
un techo de **8 acciones**. Los cumpleaños de hoy entran todos (es hoy o no
es). El resto se reparte por urgencia:

1. **⏰ Vida útil por cumplirse** — las más cercanas primero.
2. **🔧 Retrolavado** — el ciclo más viejo primero.
3. **🔄 Equipo para canjear** — vencido hace menos de 1 año. La plantilla ya
   existía en la ficha y no entraba a la cola.
4. **👋 ¿Cómo viene el equipo?** — vigentes sin escribirles en 90 días (y
   con más de 90 días desde la compra, para no molestar a un cliente nuevo).

Una persona no aparece dos veces el mismo día. Completar las 8 no mete a una
novena: mañana entran las que siguen. El vencido hace más de un año sigue
afuera (Reactivación).

La franja y la tarjeta del Home **siguen apareciendo sólo si hay trabajo**.
No se inventa una carta vacía. Lo que cambia es que un parque real casi
nunca deja el día en cero.

## Archivos tocados

- **`mensajes-usuarios.js`** · cupo, capas, canje y check-in en `deHoy()`,
  claves de ciclo nuevas, plantilla `checkin` (no se ofrece en la ficha).
- **`tests/e2e/mensajes-usuarios.spec.js`** · regresiones del cupo, el
  relleno, el canje, el check-in y que un inactivo no entre.
- **`index.html`** · pie `v361`, `swVersion='361'`,
  `CACHE_NAME='appi-v361-jornada-del-parque'`.
- **`service-worker.js`**, **`package.json`**, **`package-lock.json`**,
  **`README.md`**, **`CAMBIOS_v361.md`**.

Sin cambios en la base de datos.

## Versionado y caché

- Pie visible: `APPI · v361 · Segura` · `swVersion='361'`.
- `CACHE_NAME='appi-v361-jornada-del-parque'` en `service-worker.js` y en la
  metadata de `index.html` / `package.json` / `README.md`.
