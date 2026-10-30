# HU-005 · Ser derivado a una persona con mi caso ya explicado

- **Tipo:** Historia
- **Épica:** EP-01
- **Estado:** Pre-entrega
- **Owner de aceptación:** usuario (DS)
- **Prioridad / estimación:** Alta · 15 min
- **Capacidad:** C4

## Historia
Como pasajero, quiero que, cuando el sistema no pueda resolver solo, me derive a una persona que ya
conozca mi caso, para no tener que explicarlo de nuevo.
Como agente de operación, quiero recibir el caso con su evidencia, para resolverlo sin volver a investigar.

## Criterios de aceptación
1. Dado el caso base, cuando aplica R5, entonces se crea un caso `APPROVAL_REQUIRED` **en paralelo** a
   la recomendación de O1 (RN-07).
2. La evidencia incluye `decision_id`, `booking_id`, eventos usados y descartados, `policy_ref` con
   `rule_ids` y opciones evaluadas con su motivo; **no** incluye `email`, `phone` ni `document_id`.
3. Dada la respuesta 201 con `sla_minutes: 45`, entonces el pasajero recibe como siguiente paso "un
   agente te contacta en 45 min o menos".
4. `reason` siempre es un código del catálogo cerrado de derivaciones, nunca texto libre.
5. **(neg)** Dada una segunda consulta con el mismo `decision_id`, entonces no se crea un caso duplicado.
6. **(neg)** Dado que `create_human_case` falla, entonces el pasajero recibe la información verificada
   y un canal de contacto alternativo, y la falla queda en el registro; nunca se le informa un caso
   que no existe.

## Reglas de negocio que toca
- RN-07 · RN-06 · `POL-DELAY-2026-03/R5`

## Componentes y contratos
- Componentes: `engine/` (`domain/control.ts`, `app/orchestrator.ts`)
- Contratos: `tools-api.md` (`create_human_case`) · `disruption-api.md` (`escalations[]`)

## Clasificación de pasos
| Paso | Clasificación | Control / fallback |
|---|---|---|
| Decidir derivación | determinístico | Catálogo cerrado de motivos |
| Resolver el caso | human | SLA comunicado al pasajero |

## Validación
- `.feature`: `features/EP-01_evaluacion-disrupcion.feature` (caso base, DEMOCONF, DEMONOEV) · `features/EP-01_pantalla-pasajero.feature` (refrescar no repite escrituras)
- Tests: `engine/test/unit/domain.test.ts` (decideControl), `engine/test/unit/orchestrator.test.ts`

| AC | Evidencia |
|---|---|
| 1 | `decideControl`: ACCEPT_OPTION y APPROVAL_REQUIRED en paralelo · `assessDisruption`: crea un caso por R5 |
| 2 | Parcial: `assessDisruption`: el registro no contiene datos personales (verifica el registro, no la evidencia del caso) |
| 4 | Tipado (`EscalationReason` en `domain/types.ts`) |
| 5 | Escenario: refrescar la pantalla no repite escrituras (sólo en el mock; H-30, H-31) |
| 6 | `assessDisruption`: si `create_human_case` falla → `CREATION_FAILED` |
| 3 | **Sin test identificado** |

## Dependencias y riesgos
- En producción, `decision_id` fijo por escenario no sirve para deduplicar (H-31).

## Preguntas abiertas
- H-04 (cuándo interviene una persona) · H-30 · H-31 · H-32 (canal de contacto alternativo)

## Historial
- 2026-10-29 — `b204ab7` implementada en `engine/`.
- 2026-10-30 — migrada desde `Docs/epica/EP-01` (ENH-003).
