# HU-003 · Saber qué me corresponde según la política vigente

- **Tipo:** Historia
- **Épica:** EP-01
- **Estado:** Pre-entrega
- **Owner de aceptación:** usuario (DS)
- **Prioridad / estimación:** Alta · 25 min
- **Capacidad:** C3

## Historia
Como pasajero, quiero saber qué me corresponde por la modificación, para no pedir ni de más ni de menos.

## Criterios de aceptación
1. Dado el caso base (160 min, conexión perdida, grupo con un menor, sin pedido de compensación),
   cuando se evalúa `POL-DELAY-2026-03`, entonces aplican R3 (`REBOOK_NO_FEE`, sin aprobación) y R5
   (`PRIORITY_HANDLING`, con aprobación), y **no** aplican R1, R2 ni R4.
2. Cada entitlement de la respuesta cita su `policy_ref` y su `rule_id` (`POL-DELAY-2026-03/R3`).
3. Dado un retraso de 250 min en un segmento internacional, entonces aplican R1 y R2.
4. Dado que el pasajero pidió una compensación, entonces aplica R4 (`CASH_COMPENSATION`) y queda
   marcada como pendiente de aprobación; nunca se ofrece como otorgada.
5. **(neg)** Dada una política cuya versión figura en `superseded_versions` o cuya `effective_from` es
   posterior a la fecha del viaje, entonces no se usa y se deriva con `READ_FAILURE`.
6. **(neg)** Dada una política vigente con un `rule_id` sin predicado en el sistema, entonces esa regla
   no se aplica en automático y se deriva con `UNSUPPORTED_RULE`; el resto de las reglas se evalúa igual.
7. **(neg)** Dado que `get_policy_rules` no responde, entonces no hay entitlement ni recomendación y
   se deriva con `READ_FAILURE`.
8. La evaluación es una función pura: mismos hechos y misma versión de política producen siempre el
   mismo resultado (se verifica con test).

## Reglas de negocio que toca
- RN-01 (política vigente) · RN-07 (aprobación por entitlement) · `POL-DELAY-2026-03/R1…R5`

## Componentes y contratos
- Componentes: `engine/` (`domain/policy.ts`)
- Contratos: `tools-api.md` (`get_policy_rules`) · `disruption-api.md` (`entitlements[]`)

## Clasificación de pasos
| Paso | Clasificación | Control / fallback |
|---|---|---|
| Evaluar reglas con predicados por `rule_id` | determinístico | Regla sin predicado → `UNSUPPORTED_RULE` |

## Validación
- `.feature`: `features/EP-01_evaluacion-disrupcion.feature` — caso base
- Tests: `engine/test/unit/domain.test.ts` (evaluatePolicy)

| AC | Evidencia |
|---|---|
| 1 | `evaluatePolicy`: R3 se otorga y R5 queda pendiente; R1, R2 y R4 no aplican |
| 2 | Escenario caso base |
| 3 | Parcial: `evaluatePolicy`: SCL→LIM→MEX es internacional (no prueba 250 min) |
| 6 | `evaluatePolicy`: una condición que no entiende queda como regla no soportada |
| 4, 5, 8 | **Sin test identificado** |
| 7 | **Desvío conocido:** hoy responde 500 en vez de 200 + `READ_FAILURE` (H-29) |

## Dependencias y riesgos
- Depende de HU-002 (hechos: conexión perdida, retraso).

## Preguntas abiertas
- H-13 (predicados vs intérprete; ADR-004 Propuesto, la POC usa un intérprete acotado) · H-14 (origen de `compensation_requested`) · H-29

## Historial
- 2026-10-29 — `b204ab7` implementada en `engine/`.
- 2026-10-30 — migrada desde `Docs/epica/EP-01` (ENH-003).
