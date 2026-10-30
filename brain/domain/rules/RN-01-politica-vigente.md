# RN-01 · La política vigente determina el entitlement ✅ Dada

**Fuente:** enunciado §2, `get_policy_rules("DELAY")`. Fixture: `contracts/fixtures/get_policy_rules_DELAY.json`.

## Política `POL-DELAY-2026-03` (effective_from 2026-03-01; supersede a `POL-DELAY-2025-11`)

| rule_id | Condición | Entitlement | Requiere aprobación humana |
|---|---|---|---|
| R1 | `delay_minutes >= 180` | `REBOOK_NO_FEE` | no |
| R2 | `delay_minutes >= 240 AND international` | `MEAL_VOUCHER` | no |
| R3 | `missed_connection == true` | `REBOOK_NO_FEE` | no |
| R4 | `compensation_requested == true` | `CASH_COMPENSATION` | **sí** |
| R5 | `group_includes_minor == true` | `PRIORITY_HANDLING` | **sí** |

## Cómo se aplica
- Usar sólo la versión vigente; nunca una `superseded_versions`.
- Toda recomendación y todo mensaje cita `version` + `rule_id`.
- Las condiciones se evalúan de forma **determinística** sobre datos ya validados (RN-05).
- Varias reglas pueden aplicar a la vez; los entitlements se acumulan.

## Abierto (no implementar sin decisión)
- Cómo se mide `delay_minutes`: ¿del segmento o a destino final? (H-06)
- Cómo se determina `missed_connection` y `international` (H-07).
- Qué pasa si la política no se puede obtener o está vencida (H-11).
