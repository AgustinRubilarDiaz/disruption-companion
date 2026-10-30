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
| [EP-01](EP-01-asistencia-ante-modificacion-de-vuelo.md) | Asistencia al pasajero ante una modificación de vuelo | — | En curso |
| [HU-001](HU-001-estado-verificado-del-viaje.md) | Ver el estado verificado de mi viaje | EP-01 | Pre-entrega |
| [HU-002](HU-002-impacto-de-la-modificacion.md) | Saber si la modificación me afecta | EP-01 | Pre-entrega |
| [HU-003](HU-003-entitlements-segun-politica.md) | Saber qué me corresponde según la política vigente | EP-01 | Pre-entrega |
| [HU-004](HU-004-opcion-valida-para-el-grupo.md) | Recibir una opción de cambio válida para todo mi grupo | EP-01 | Pre-entrega |
| [HU-005](HU-005-derivacion-con-evidencia.md) | Ser derivado a una persona con mi caso ya explicado | EP-01 | Pre-entrega |
| [HU-006](HU-006-notificacion-validada.md) | Recibir una notificación clara y validada | EP-01 | Pre-entrega |
| [HU-007](HU-007-solicitud-de-cambio-segura.md) | Solicitar el cambio de vuelo de forma segura | EP-01 | Pre-entrega |
| [HU-008](HU-008-registro-de-decisiones.md) | Registrar cada decisión de forma trazable y sin datos personales | EP-01 | Pre-entrega |
| [HU-009](HU-009-consulta-en-lenguaje-libre.md) | Entender una consulta escrita en lenguaje libre (diseño) | EP-01 | Borrador (diseño) |
| [HU-010](HU-010-pantalla-del-pasajero.md) | Ver en pantalla el estado, la alerta y la recomendación | EP-01 | Pre-entrega |
| [FALLA-001](FALLA-001-clave-por-pasajeros.md) | La clave de idempotencia no distingue grupos del mismo tamaño | EP-01 | Borrador |
| [FALLA-002](FALLA-002-puerto-get-eligible-options.md) | El puerto no respeta el contrato de `get_eligible_options` | EP-01 | Borrador |

> Los estados iniciales los asignó la migración (ENH-003) según el commit `b204ab7`: "Pre-entrega"
> porque el gate `e2e-closure` momento 1 sigue pendiente. El usuario los confirma o corrige.
