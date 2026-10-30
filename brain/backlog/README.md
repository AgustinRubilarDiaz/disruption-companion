# Backlog — gestor de tickets local

> Este proyecto no usa Jira: el backlog vive acá, en markdown. Los skills `feature-discovery`,
> `create-tasks` y `jira-to-implementation` leen y escriben estos archivos.

## Convenciones

| Tipo | Prefijo | Archivo | Plantilla |
|---|---|---|---|
| Épica | `EP-XX` | `EP-01-<slug>.md` | `_templates/epica.md` |
| Historia de usuario | `HU-XXX` | `HU-001-<slug>.md` | `_templates/hu.md` |
| Falla (bug) | `FALLA-XXX` | `FALLA-001-<slug>.md` | `_templates/falla.md` |
| Deuda técnica | `DT-XXX` | `DT-001-<slug>.md` | `_templates/deuda-tecnica.md` |

- Numeración correlativa, nunca se reutiliza un ID.
- Estados: `Borrador` → `Aprobada` (sign-off del usuario) → `En curso` → `Pre-entrega` → `Done`.
  Sólo el usuario cambia el estado.
- Cada archivo termina con una sección **Historial**: ahí el Cierre de versionado agrega
  rama, commit y resultado (con aprobación).

## Índice

| ID | Título | Épica | Estado |
|---|---|---|---|
| EP-01 | Asistencia al pasajero ante una modificación de vuelo (definición y mapa de ruta en `../../Docs/epica/EP-01-asistencia-ante-modificacion-de-vuelo.md`) | — | Borrador |
