# Contrato propio — `DisruptionAssessment` v1.0

> Contrato de salida del backend (ADR-001). **Texto canónico:** `disruption-assessment.md` (copia para el comité: `../../Docs/16-contrato-disruption-assessment.md`)
> (interfaz, campos, 10 invariantes, versionado, ejemplos y catálogo de motivos de descarte).
> Este archivo es el punto de entrada desde el Brain y fija los fixtures que usan los tests.

## Fixtures
| Archivo | Qué es |
|---|---|
| `fixtures/disruption_assessment_ABC123.json` | Respuesta esperada para el caso base (supuesto RD-13 / H-17: O1 automático + R5 en paralelo) |
| `fixtures/decision_record_ABC123.json` | Registro de decisión interno esperado (sin PII; HU-008) |

## Endpoints
| Método y ruta | Respuesta |
|---|---|
| `GET /v1/bookings/{booking_id}/disruption-assessment` | 200 `DisruptionAssessment` · 400 `INVALID_BOOKING_ID` · 404 `BOOKING_NOT_FOUND` · 500 `INTERNAL_ERROR`. Una falla de lectura da 200 `UNVERIFIED` + `READ_FAILURE`, no 5xx (salvo la política, H-29) |
| `POST /v1/bookings/{booking_id}/rebooking-requests` | Aceptar la opción (HU-007), abajo |
| `GET /v1/scenarios` | Reservas de demostración (sólo modo demo) |
| `GET /health` | `{ "status": "ok" }` |

En modo demo, cada respuesta declara el reloj del escenario en el encabezado `X-Simulated-Clock`.

### Aceptar la opción (HU-007)
`POST /v1/bookings/{booking_id}/rebooking-requests` con `{ "decision_id": "...", "option_id": "O1" }`.
Texto canónico: `../../Docs/18-plan-frontend.md` §5. Reglas de la clave y la reconciliación: RN-03.

| Código | Cuándo | Cuerpo |
|---|---|---|
| 201 | Solicitud creada | `{ request_id, status: "PENDING_CONFIRMATION", expires_at }` |
| 200 | La tool respondió 409 (duplicado): se trata como éxito | El mismo cuerpo, con el `request_id` existente |
| 202 | Indeterminado tras 2 reintentos con la misma clave | `{ status: "CONFIRMING" }` + derivación `REBOOKING_INDETERMINATE` |
| 400 | Cuerpo o `booking_id` inválido | `{ error: "INVALID_REQUEST" }` |
| 404 | La reserva no existe | `{ error: "BOOKING_NOT_FOUND" }` |
| 410 | La opción venció | `{ error: "OPTION_EXPIRED" }` |
| 422 | La opción no es la recomendada vigente o no la cubre un entitlement `GRANTED` | `{ error: "OPTION_NOT_RECOMMENDED" }` |

El consumidor (`web/`) nunca muestra "confirmado": la solicitud queda "pendiente de confirmación".

## Reglas para el código
- Contrato primero: cualquier cambio de campo se hace en `disruption-assessment.md` y en estos fixtures **antes** del código.
- Los tests del vertical slice comparan la salida de `assess_disruption("ABC123")` contra
  `disruption_assessment_ABC123.json` (salvo `decision_id` y `evaluated_at`, que se inyectan).
- Invariantes 1–10 de `disruption-assessment.md` §16.3 → un test cada una como mínimo las 1, 3, 4, 6 y 7.
- Cambios respecto del borrador de `logica-contratos.md`: `discarded_options` pasa al registro
  interno; `human_case` pasa a `escalations[]`; se agregan `schema_version`, `group`, `segments`,
  `message` y `trip_status: UNVERIFIED`.
