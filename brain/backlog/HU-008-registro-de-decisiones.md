# HU-008 · Registrar cada decisión de forma trazable y sin datos personales (habilitadora)

- **Tipo:** Historia
- **Épica:** EP-01
- **Estado:** Pre-entrega
- **Owner de aceptación:** usuario (Tech Lead)
- **Prioridad / estimación:** Alta · 10 min
- **Capacidad:** transversal

## Historia
Como equipo que opera el producto, quiero un registro de cada decisión, para reconstruir cualquier
caso y medir OV-1 y OV-2.

## Criterios de aceptación
1. Cada consulta genera exactamente un registro con un `decision_id` único.
2. El registro contiene: cambio relevante, `policy_ref` y reglas, resultado, opción recomendada, IDs
   de caso, de solicitud y de notificación, y calidad de los datos (`Docs/05`).
3. El mismo `decision_id` aparece en la evidencia del caso humano y en la llamada de notificación.
4. **(neg)** Un test recorre el registro del caso base y no encuentra el email, el teléfono, el
   documento ni el nombre de ningún pasajero.
5. Con el registro se puede calcular el resultado de cada consulta (`NO_ACTION`, `INFORM`,
   `RECOMMEND`, `ACTION_REQUESTED`, `ESCALATED`).

## Reglas de negocio que toca
- RN-06 (datos personales)

## Componentes y contratos
- Componentes: `engine/` (`app/orchestrator.ts`, `domain/assess.ts`)
- Contratos: `../contracts/disruption-assessment.md` §16.6 (registro de decisiones) · fixture `contracts/fixtures/decision_record_ABC123.json`

## Clasificación de pasos
| Paso | Clasificación | Control / fallback |
|---|---|---|
| Registrar la decisión | determinístico | Test de ausencia de PII |

## Validación
- `.feature`: `features/EP-01_pantalla-pasajero.feature` — refrescar la pantalla no repite escrituras
- Tests: `engine/test/unit/orchestrator.test.ts`, `engine/test/contract/contract.test.ts`

| AC | Evidencia |
|---|---|
| 4 | `assessDisruption`: el registro de decisiones no contiene datos personales |
| 1, 2, 3, 5 | **Sin test identificado.** Existe el fixture `decision_record_ABC123.json`, pero `contract.test.ts` sólo verifica que los fixtures del motor sean copia de los del contrato; ningún test compara el registro generado con el fixture |

## Dependencias y riesgos
- El registro se emite como log JSON; no hay almacenamiento persistente.
- `decision_id` fijo por escenario de demostración (H-31).

## Preguntas abiertas
- H-31

## Historial
- 2026-10-29 — `b204ab7` implementada en `engine/`.
- 2026-10-30 — migrada desde `Docs/epica/EP-01` (ENH-003).
