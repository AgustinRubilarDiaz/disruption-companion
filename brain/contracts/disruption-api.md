# Contrato propio — `DisruptionAssessment` v1.0

> Contrato de salida del backend (ADR-001). **Texto canónico:** `../../Docs/16-contrato-disruption-assessment.md`
> (interfaz, campos, 10 invariantes, versionado, ejemplos y catálogo de motivos de descarte).
> Este archivo es el punto de entrada desde el Brain y fija los fixtures que usan los tests.

## Fixtures
| Archivo | Qué es |
|---|---|
| `fixtures/disruption_assessment_ABC123.json` | Respuesta esperada para el caso base (supuesto RD-13 / H-17: O1 automático + R5 en paralelo) |
| `fixtures/decision_record_ABC123.json` | Registro de decisión interno esperado (sin PII; HU-008) |

## Reglas para el código
- Contrato primero: cualquier cambio de campo se hace en `Docs/16` y en estos fixtures **antes** del código.
- Los tests del vertical slice comparan la salida de `assess_disruption("ABC123")` contra
  `disruption_assessment_ABC123.json` (salvo `decision_id` y `evaluated_at`, que se inyectan).
- Invariantes 1–10 de `Docs/16` §16.3 → un test cada una como mínimo las 1, 3, 4, 6 y 7.
- Cambios respecto del borrador de `logica-contratos.md`: `discarded_options` pasa al registro
  interno; `human_case` pasa a `escalations[]`; se agregan `schema_version`, `group`, `segments`,
  `message` y `trip_status: UNVERIFIED`.
