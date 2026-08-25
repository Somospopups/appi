# APPI v357 — Agenda personal en el Panel de Contactos

## Qué cambia

- **El Panel de Contactos tiene dos agendas** con un switch arriba, debajo de las
  acciones principales:
  - **📇 AGENDA APPI**: lo que ya existía (Hoy / Todos / Resultados), intacto.
  - **📱 AGENDA PERSONAL**: los contactos del teléfono del distribuidor.

- **Subir la agenda del teléfono** (nuevo módulo `agenda-personal.js`):
  - **📱 Elegir del teléfono**: selector nativo (Contact Picker API). Sólo aparece
    donde funciona: Android con Chrome. iPhone no permite elegir contactos desde
    una web, así que ahí el botón directamente no se muestra.
  - **📂 Subir agenda (.vcf)**: funciona en todos los equipos. El lector de
    vCard entiende los formatos que exportan Android (3.0/4.0), iPhone/iCloud
    (3.0) y las agendas viejas 2.1 con QUOTED-PRINTABLE. Del archivo se queda
    con el mejor número de cada contacto (celular o preferido) y deduplica por
    teléfono.
  - **❓ Cómo paso mi agenda**: guía en criollo para Android e iPhone.

- **Pasar contactos a la Agenda APPI, de a uno y con confirmación**: cada
  contacto de la agenda personal trae su estado —
  - 🆕 **Para pasar** → "Pasar a Agenda APPI" (entra como contacto *Nuevo* del
    embudo, por la única puerta que existe: `appi_gente_importar_contacto`,
    con cola offline igual que el alta manual).
  - 📇 **Ya está en APPI** → se detecta por teléfono y no se duplica; ofrece
    "Ver en APPI".
  - ✓ **En tu Agenda APPI** → ya pasado; "Ver en APPI" abre la ficha.
  - 🗑️ Se puede quitar de la agenda personal sin tocar la Agenda APPI.

- **La agenda personal vive en la cuenta**: nueva tabla
  `appi_agenda_personal` (ver `SUPABASE_AGENDA_PERSONAL.sql`, aditiva y
  re-ejecutable). Sincroniza en segundo plano con tolerancia offline; si la
  tabla todavía no existe, todo funciona en local y el panel avisa que falta
  el paso de la base.

- **Se quita la barra de tarjetas de crédito del Panel de Contactos**
  ("por el momento"): el módulo de promos sigue intacto en la sección
  Usuarios, incluidos sus datos por contacto. Sin cambios en `Usuarios`.

## Versionado

- `package.json` 357.0.0 · visible `v357` · `swVersion='357'` ·
  `CACHE_NAME='appi-v357-agenda-personal'` (nuevo archivo en el App Shell).
- Sin migraciones obligatorias: sin la tabla nueva la solapa funciona en local.
- Claves nuevas: `appi_agenda_personal_v1_<uid>` (caché) y
  `appi_agenda_personal_queue_v1_<uid>` (cola), `appi_gestion_agenda_vista_<uid>`.
