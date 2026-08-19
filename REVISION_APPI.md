# Revisión completa de APPI · de arriba a abajo

**Fecha:** 17 de agosto de 2026
**Versión revisada:** **v265** (`d78f19c`) — la que está publicada hoy
**Método:** análisis del código **+ ejecución real** en navegador: las 24
pantallas recorridas una por una, con captura de errores de JavaScript, de red
y de recursos.

> **Nota:** empecé esta revisión con una copia vieja del repo (v224) y detecté a
> tiempo que el repositorio real iba por **v265**, con 140 commits más. Todo lo
> que sigue está hecho sobre el código real y actual.

---

## Veredicto

**APPI está en muy buen estado.** 116 pruebas en verde, las 24 pantallas abren
sin un solo error, no hay secretos expuestos y la versión es coherente. Varios
puntos que iba a marcar **ya fueron resueltos** entre v225 y v265.

Queda **un bug real** (concreto y reproducible) y tres mejoras de fondo.

---

## ✅ Verificado funcionando (probado, no leído)

| Control | Resultado |
|---|---|
| **24 pantallas recorridas una por una** | Todas abren · **0 errores de JavaScript** |
| **Suite automática** | **116 pruebas en verde** (25 archivos de prueba) |
| Errores de red / recursos faltantes | **0** |
| `alert()` / `confirm()` / `prompt()` nativos | **0** — resuelto en v225 |
| Secretos en el frontend | **Ninguno** |
| Versión coherente | v265 en `package.json`, service worker y pie del menú |
| Caché offline (APP_SHELL) | **46 entradas**, ningún JS sin cachear, ninguna rota |
| Librerías externas | **Ahora son locales** (`vendor/`): Leaflet, XLSX, jsPDF, JSZip |
| Botones sin nombre accesible | **Ninguno** |

**Lo que se arregló solo desde mi revisión anterior:** los 13 `alert()` nativos,
el mapa que dependía de CDN (ahora Leaflet es local, funciona sin internet) y el
código muerto de la unificación.

---

## 🔴 Bug real encontrado

### Tres avisos del Home no aparecen en las pantallas nuevas

Al partir el Home en secciones (**Mi mes**, **Mi negocio**), se copiaron los
contenedores de tres avisos, pero el código que los llena usa
`getElementById`, que **devuelve solamente el primero**. El segundo queda
siempre vacío.

| Contenedor | Está en | Se llena en |
|---|---|---|
| `culturaWrap` | Home + **Mi mes** | Sólo en Home |
| `bonusNotifWrap` | Home + **Mi negocio** | Sólo en Home |
| `bdayBannerWrap` | Home + **Mi negocio** | Sólo en Home |

**Verificado en ejecución:** con un cumpleaños cargado para hoy, `culturaWrap`
aparece 2 veces en la página y **sólo 1 tiene contenido**.

**Qué ve la persona:** entra a *Mi mes* o *Mi negocio* esperando ver el aviso de
cultura, el bono o el cumpleaños del equipo, y encuentra un espacio en blanco.
No se rompe nada — simplemente el aviso nunca llega.

**Arreglo:** cambiar `getElementById` por `querySelectorAll` en esos tres
lugares y llenar todos los contenedores. Son tres funciones
(`index.html` ~9804, ~9880, ~10562).

---

## 🟡 Mejoras de fondo

### 1. Nueve archivos SQL sin control de calidad

`migraciones.spec.js` revisa 6 de 15. **No mira 9**: `ACCESO`,
`ADMIN_SIN_DISTRIBUIDOR`, `AJUSTE_DIP`, `DISPOSITIVOS`, `MEMBRESIAS`,
`PASSWORD_OBLIGATORIA`, `SETUP`, `SOLICITUDES`, `VALIDAR_PLANILLAS`.

Las pruebas que ya existen (que no dejen referencias ambiguas, que se puedan
correr dos veces sin romper, que no diverjan del instalador) **los cubrirían
solos**: es agregar una línea por archivo al array `MIGRACIONES`.

### 2. El Histórico creció a 180 KB y sigue siendo el más frágil

Pasó de 124 KB a **180 KB / 1129 líneas** con las funciones nuevas (álbum anual,
Centro de Acción, modos Comparar / Mi año). Maneja lo más sensible que hay:
cierres mensuales, archivos originales y backups en ZIP.

Vale la pena una prueba de lo que más duele si se rompe: que un cierre guardado
se pueda volver a abrir y que un backup ZIP se restaure sin perder datos.

### 3. Un contacto nuevo cargado sin internet se pierde

**Editar** un contacto sin internet funciona (se encola y sube al reconectar).
**Crear** uno nuevo no tiene esa red: avisa *"Sin internet"* y conserva lo
escrito en pantalla, pero si se cierra la app **el dato se perdió**.

Importa porque los contactos se cargan en la calle, después de una demostración,
que es donde peor anda la señal. La cola ya existe (`queueMutation`): es
reutilizarla para el alta.

---

## 🟢 Menores

- **34 `console.log`** en `index.html`. No rompen nada; conviene revisar los que
  impriman datos de personas.
- **Una sola URL externa** quedó: la sombra de los marcadores del mapa
  (`cdnjs`). Es cosmética — el mapa funciona igual sin ella.
- **`openai_api_key`** vive en `localStorage` para la Grabadora. **Contenido**:
  no se sincroniza a la nube ni sale en los backups (verificado).

---

## Orden que recomiendo

1. **Los tres avisos que no aparecen** — es el único bug real, y el arreglo es
   de tres líneas.
2. **Los 9 SQL al spec** — una línea por archivo, mucha red de seguridad gratis.
3. **El alta de contactos sin internet** — pega donde más se usa la app.
4. **Pruebas del Histórico** — el trabajo más grande; conviene planificarlo
   aparte.

---

⚠️ **Pendiente de siempre: revocar el token** → https://github.com/settings/tokens
