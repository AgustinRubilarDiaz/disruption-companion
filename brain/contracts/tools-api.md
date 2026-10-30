# Contrato — Tools externas (dadas por el enunciado)

> Fuente: `Docs/Disruption_Companion.pdf` §2. **Si se trabaja con mocks propios, se mantienen estos
> contratos** (exigencia del enunciado). Los ejemplos completos están en `fixtures/` y son la base
> de mocks y tests. Lo que el enunciado no especifica está marcado *no especificado*: no inventarlo.

## Lectura

### `get_trip_context(booking_id)` → `fixtures/get_trip_context_ABC123.json`
- `booking_id`, `passengers[]` (`passenger_id`, `name`, `type` ADULT|CHILD, `age` si CHILD;
  ADULT trae `email`, `phone`, `document_id`, `loyalty_tier` — **PII**, RN-06)
- `segments[]` (`segment_id`, `flight_number`, `origin`, `destination`, `date`,
  `scheduled_departure`, `scheduled_arrival` — *zona horaria no especificada*)
- `fare_conditions` (`changeable`, `refundable`, `fare_family`)
- `_meta` (`retrieved_at`, `completeness`, `missing_fields[]`)
- Errores: *no especificados* (booking inexistente, timeout).

### `get_operational_events(segment_ids[])` → `fixtures/get_operational_events_S1_S2.json`
- `events[]`: `event_id`, `segment_id`, `type` (DELAY | GATE_CHANGE | STATUS), `source`,
  `recorded_at` y campos según tipo (`new_departure`, `delay_minutes` / `gate` / `status`)
- `_meta` (`retrieved_at`, `sources_available[]`, `sources_degraded[]`)
- Otros tipos de evento (cancelación, cambio de equipo): *no especificados*.

### `get_eligible_options(trip_context)` → `fixtures/get_eligible_options.json`
- `options[]`: `option_id`, `type` (REBOOK | REFUND), `policy_ref`, `confidence` (HIGH|MEDIUM|LOW);
  REBOOK agrega vuelo, fecha, `departure`, `fare_difference`, `currency`, `seats_available`
- `_meta` (`retrieved_at`, `ttl_seconds`)

### `get_policy_rules(scenario)` → `fixtures/get_policy_rules_DELAY.json`
- `scenario`, `version`, `effective_from`, `rules[]` (`rule_id`, `condition`, `entitlement`,
  `requires_human_approval`), `_meta` (`retrieved_at`, `superseded_versions[]`)
- `condition` es un **string**: el lenguaje de expresiones *no está especificado* (H-13).

## Escritura — ver `fixtures/write_tools_responses.json`

| Tool | Respuesta | Significado |
|---|---|---|
| `create_rebooking_request(option, idempotency_key)` | 201 `PENDING_CONFIRMATION` + `expires_at` | Creada, pendiente |
| | 409 `DUPLICATE_REQUEST` + `request_id` | Ya existía con esa key |
| | 503 `UPSTREAM_TIMEOUT` | **Indeterminado** (RN-03) |
| `create_human_case(reason, evidence)` | 201 `case_id`, `queue`, `sla_minutes` | Caso creado |
| `notify_passenger(message)` | 202 `notification_id`, `channel`, `QUEUED` | Encolada, no entregada |
| | 422 `UNVALIDATED_CONTENT` | Falta `policy_ref` (RN-04) |

## Lógica de consumo
Precondiciones, validaciones, manejo de errores e idempotencia de cada tool: `logica-contratos.md`.

## Contratos propios
La API del vertical slice (o el contrato que asume el frontend) se documenta en
`contracts/disruption-api.md` **antes** de implementarla. Track decidido: Backend (ADR-001); la
forma (HTTP o función invocable) queda abierta en D-04.
