# RN-03 · Acciones de alto impacto bajo control ✅ Dada

**Fuente:** enunciado §2 (tools de escritura) y §3 (restricciones).

## Qué dice
- Cambiar una reserva o emitir una compensación son acciones de **alto impacto**.
- Una recomendación incorrecta puede generar costo, reclamo o incumplimiento de política.
- Reglas de política con `requires_human_approval: true` (R4, R5) requieren intervención humana.

## Respuestas de `create_rebooking_request(option, idempotency_key)`
| Respuesta | Significado | Comportamiento obligatorio |
|---|---|---|
| 201 `PENDING_CONFIRMATION` + `expires_at` | Solicitud creada, pendiente de confirmar | Informar estado y vencimiento; no darla por confirmada |
| 409 `DUPLICATE_REQUEST` + `request_id` | Ya existía con esa key | Tratar como la solicitud existente, no como error ni como nueva |
| 503 `UPSTREAM_TIMEOUT` | **Resultado real indeterminado** | No asumir éxito ni fracaso. No reintentar con otra key |

## Cómo se aplica
- La idempotency key es obligatoria y estable por intención (misma acción → misma key).
- Ninguna escritura de alto impacto la decide un modelo sin control determinístico/humano.

## 🟡 Decidido (H-12, `Docs/18` §5 y §11, 2026-10-29)
- **Clave:** `sha256(booking_id | option_id | policy_ref | passenger_ids ordenados)`. Es determinística: el
  mismo pedido da la misma clave.
- **Tras un 503:** hasta 2 reintentos con la misma clave. Si sigue indeterminado, la respuesta es
  202 `CONFIRMING` y se abre un caso humano `REBOOKING_INDETERMINATE`. Nunca se reintenta con otra clave.
- **Antes de escribir,** el backend vuelve a evaluar la reserva: la opción debe ser la recomendada
  vigente y estar cubierta por un entitlement `GRANTED` (422 si no; 410 si venció).
- Implementado en `engine/src/app/rebooking.ts`; contrato en `contracts/disruption-api.md`.

## Abierto
- Quién confirma la solicitud `PENDING_CONFIRMATION` y cómo (H-10).
