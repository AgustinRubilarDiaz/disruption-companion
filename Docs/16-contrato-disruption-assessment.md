# 16. Contrato de salida — `DisruptionAssessment`

Contrato que el backend del Disruption Companion entrega a cualquier consumidor (la app del pasajero,
la pantalla de la capa complementaria y, en el futuro, el mostrador). El consumidor **no interpreta
eventos crudos ni opciones candidatas**: recibe el resultado ya decidido, con su traza a la política.

- **Versión del esquema:** `1.0`
- **Track:** Backend/Integración (ADR-001). La pantalla consume este contrato tal cual.
- **Reemplaza** al borrador conceptual del documento 7.

## 16.1 Interfaz

| Operación | Forma | Resultado |
|---|---|---|
| Evaluar la reserva | Función `assess_disruption(booking_id, requester)` o `GET /v1/bookings/{booking_id}/disruption-assessment` | `DisruptionAssessment` |
| Aceptar la opción recomendada (diseño, HU-007) | `POST /v1/bookings/{booking_id}/rebooking-requests` con `{ decision_id, option_id }` | Estado de la solicitud |

### Respuestas de la evaluación
| Código | Cuándo | Cuerpo |
|---|---|---|
| 200 | **Siempre que se pudo evaluar**, incluso si el resultado es `UNVERIFIED` o requiere derivación | `DisruptionAssessment` |
| 400 | `booking_id` con formato inválido | `{ "error": "INVALID_BOOKING_ID" }` |
| 404 | La reserva no existe **o** no pertenece a quien consulta (misma respuesta en ambos casos) | `{ "error": "BOOKING_NOT_FOUND" }` |
| 500 | Error inesperado del propio servicio | `{ "error": "INTERNAL_ERROR", "decision_id": "…" }` |

Una falla de un sistema de lectura **no** produce un 5xx: produce un 200 con `trip_status: UNVERIFIED`,
el siguiente paso `WAIT_FOR_AGENT` y una derivación `READ_FAILURE`. Así el pasajero siempre recibe un
siguiente paso.

## 16.2 Campos

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `schema_version` | string | Sí | Versión del contrato |
| `decision_id` | string | Sí | Correlaciona esta respuesta con el registro de decisiones, el caso humano y la notificación |
| `booking_id` | string | Sí | Reserva evaluada |
| `evaluated_at` | fecha y hora UTC | Sí | Momento de la evaluación |
| `trip_status` | enum | Sí | `NO_CHANGE` · `INFORMATIVE_CHANGE` · `RELEVANT_CHANGE` · `UNVERIFIED` |
| `group` | objeto | Sí | `passenger_count`, `includes_minor`. **No incluye** nombres ni datos de contacto |
| `segments[]` | lista | Sí | Estado consolidado por segmento (ver abajo) |
| `impact` | objeto | Sí si `RELEVANT_CHANGE` | `missed_connection`, `connection` (segmentos y horas comparadas, MCT usado) y `delay_basis` |
| `entitlements[]` | lista | Sí (puede estar vacía) | `entitlement`, `policy_ref`, `rule_id`, `requires_human_approval`, `status`: `GRANTED` · `PENDING_APPROVAL` |
| `recommended_option` | objeto o null | No | Única opción ofrecida: vuelo, fecha, hora, `fare_difference`, `covers_passengers`, `policy_ref` y `valid_until` |
| `next_step` | enum | Sí | `ACCEPT_OPTION` · `WAIT_FOR_AGENT` · `NO_ACTION_NEEDED` |
| `escalations[]` | lista | Sí (puede estar vacía) | `reason` (catálogo cerrado), `policy_ref` y `rule_id` si aplica, `status`: `CREATED` · `CREATION_FAILED`, `case_id` y `sla_minutes` si se creó |
| `message` | objeto | Sí | `template_id`, `policy_ref` y `params`: es lo que se envía a `notify_passenger` |
| `data_quality` | objeto | Sí | `completeness`, `missing_fields`, `missing_fields_critical`, cantidad de eventos degradados ignorados y de conflictos resueltos |

### Segmento
`segment_id`, `flight_number`, `origin`, `destination`, `date`, `status` (`SCHEDULED` · `ON_TIME` ·
`DELAYED` · `UNVERIFIED`), horas programadas y nuevas, `delay_minutes`, llegada estimada, `gate` y
`data_as_of`.

## 16.3 Invariantes (el backend las garantiza y los tests las verifican)

1. `next_step = ACCEPT_OPTION` **si y sólo si** `recommended_option` no es null.
2. `recommended_option.valid_until` es posterior a `evaluated_at`. **El consumidor desactiva la
   aceptación cuando pasa `valid_until`** y pide una nueva evaluación.
3. `trip_status = UNVERIFIED` implica `recommended_option = null`, `next_step = WAIT_FOR_AGENT` y al
   menos una derivación.
4. Todo entitlement trae `policy_ref` y `rule_id`. `message.policy_ref` es obligatorio: un mensaje sin
   él no se construye, y por eso `notify_passenger` nunca puede responder 422 por esa causa.
5. `message.params` sólo contiene valores que ya están en otros campos de esta misma respuesta: el
   mensaje no puede afirmar nada que la evaluación no sostenga.
6. Ninguna opción descartada aparece en la respuesta: las descartadas y sus motivos viven sólo en el
   registro de decisiones.
7. **Sin datos personales:** no hay `name`, `email`, `phone`, `document_id` ni `loyalty_tier`. El grupo
   se describe con cantidades y un indicador de menor.
8. `data_as_of` de un segmento es la hora del **evento más antiguo** usado para construir su estado: el
   dato vale lo que su parte menos fresca.
9. Las horas con sufijo `_local` son hora local del aeropuerto, tal como las entregan los sistemas. La
   zona horaria no está especificada (H-07). Los campos `_at` y `valid_until` están en UTC.
10. Si una derivación tiene `status = CREATION_FAILED`, el mensaje incluye un canal de contacto
    alternativo y nunca menciona un caso que no existe.

### Campos que el consumidor no muestra
`policy_ref`, `rule_id`, `decision_id`, `case_id` (salvo como número de referencia) y `data_quality`
viajan para la trazabilidad y las métricas, pero **no se muestran como texto al pasajero** (RD-02).

## 16.4 Evolución del contrato
- Agregar campos opcionales o valores de enum es un cambio **menor** (`1.x`). Quitar o renombrar un
  campo es **mayor** (`2.0`).
- **Ante un valor de enum desconocido**, el consumidor muestra el estado genérico ("no pudimos
  confirmar el estado de tu viaje") y el siguiente paso de contacto. Nunca deduce nada por su cuenta.

## 16.5 Ejemplo: caso base `ABC123`
Supone la regla por defecto RD-13: O1 se recomienda en automático y R5 se deriva en paralelo (H-17).

```json
{
  "schema_version": "1.0",
  "decision_id": "dec_01JB7Q3M8K2V",
  "booking_id": "ABC123",
  "evaluated_at": "2026-09-15T11:02:40Z",
  "trip_status": "RELEVANT_CHANGE",
  "group": { "passenger_count": 2, "includes_minor": true },
  "segments": [
    {
      "segment_id": "S1", "flight_number": "LA500", "origin": "SCL", "destination": "LIM",
      "date": "2026-09-15", "status": "DELAYED",
      "scheduled_departure_local": "14:30", "new_departure_local": "17:10", "delay_minutes": 160,
      "scheduled_arrival_local": "17:55", "estimated_arrival_local": "20:35",
      "gate": "24", "data_as_of": "2026-09-15T10:48:00Z"
    },
    {
      "segment_id": "S2", "flight_number": "LA2410", "origin": "LIM", "destination": "MEX",
      "date": "2026-09-15", "status": "SCHEDULED",
      "scheduled_departure_local": "19:05", "scheduled_arrival_local": "23:40",
      "data_as_of": "2026-09-15T10:48:00Z"
    }
  ],
  "impact": {
    "missed_connection": true,
    "connection": {
      "from_segment_id": "S1", "to_segment_id": "S2",
      "estimated_arrival_local": "20:35", "next_departure_local": "19:05", "mct_minutes": 0
    },
    "delay_basis": "PER_SEGMENT"
  },
  "entitlements": [
    { "entitlement": "REBOOK_NO_FEE", "policy_ref": "POL-DELAY-2026-03", "rule_id": "R3",
      "requires_human_approval": false, "status": "GRANTED" },
    { "entitlement": "PRIORITY_HANDLING", "policy_ref": "POL-DELAY-2026-03", "rule_id": "R5",
      "requires_human_approval": true, "status": "PENDING_APPROVAL" }
  ],
  "recommended_option": {
    "option_id": "O1", "type": "REBOOK", "flight_number": "LA2412",
    "origin": "LIM", "destination": "MEX", "date": "2026-09-16", "departure_local": "08:15",
    "fare_difference": 0, "covers_passengers": 2,
    "policy_ref": "POL-DELAY-2026-03", "valid_until": "2026-09-15T11:04:35Z"
  },
  "next_step": "ACCEPT_OPTION",
  "escalations": [
    { "reason": "APPROVAL_REQUIRED", "policy_ref": "POL-DELAY-2026-03", "rule_id": "R5",
      "status": "CREATED", "case_id": "HC-4471", "sla_minutes": 45 }
  ],
  "message": {
    "template_id": "DELAY_MISSED_CONNECTION_REBOOK_V1",
    "policy_ref": "POL-DELAY-2026-03",
    "params": {
      "delayed_flight": "LA500", "new_departure_local": "17:10", "missed_flight": "LA2410",
      "option_flight": "LA2412", "option_date": "2026-09-16", "option_departure_local": "08:15",
      "passenger_count": 2, "priority_handling_sla_minutes": 45
    }
  },
  "data_quality": {
    "completeness": "PARTIAL",
    "missing_fields": ["fare_conditions.change_penalty_amount"],
    "missing_fields_critical": false,
    "degraded_events_ignored": 1,
    "conflicts_resolved": 1
  }
}
```

**De dónde sale cada valor:**
- `valid_until` = `retrieved_at` de las opciones (11:02:35) + `ttl_seconds` (120 s) = 11:04:35.
- `estimated_arrival_local` = llegada programada de S1 (17:55) + 160 min = 20:35.
- `case_id` y `sla_minutes` vienen de la respuesta de `create_human_case`.
- El evento `ON_TIME` de `LEGACY_MIRROR` se ignora (`degraded_events_ignored: 1`) y resuelve el único
  conflicto (`conflicts_resolved: 1`).

### Variante conservadora de H-17 (si se elige)
Si con un menor en el grupo todo el caso va a una persona, cambian sólo estos campos:
`recommended_option: null`, `next_step: "WAIT_FOR_AGENT"` y
`message.template_id: "DELAY_MISSED_CONNECTION_AGENT_V1"`. Ese mensaje informa el retraso, la conexión
perdida y que un agente lo contactará en 45 minutos para ofrecerle las alternativas.

## 16.6 Registro de decisiones (interno, no lo consume la pantalla)
Lo que no viaja al consumidor queda en el registro (HU-008):
- Los eventos usados y descartados, con su fuente.
- La evaluación de R1 a R5 con los hechos de cada una.
- Las opciones descartadas con su motivo y `confidence`.
- Los IDs de solicitud y de notificación.

```json
{
  "decision_id": "dec_01JB7Q3M8K2V",
  "booking_ref": "bk_9f2c41",
  "evaluated_at": "2026-09-15T11:02:40Z",
  "policy": { "policy_ref": "POL-DELAY-2026-03", "effective_from": "2026-03-01" },
  "events_used": [
    { "event_id": "E-1001", "segment_id": "S1", "type": "DELAY", "source": "OPS_CORE", "recorded_at": "2026-09-15T10:48:00Z" },
    { "event_id": "E-1007", "segment_id": "S1", "type": "GATE_CHANGE", "source": "AIRPORT_FEED", "recorded_at": "2026-09-15T10:55:00Z" },
    { "event_id": "E-2003", "segment_id": "S2", "type": "STATUS", "source": "OPS_CORE", "recorded_at": "2026-09-15T10:48:00Z" }
  ],
  "events_discarded": [
    { "event_id": "E-1012", "segment_id": "S1", "source": "LEGACY_MIRROR", "reason": "SOURCE_DEGRADED" }
  ],
  "rule_evaluations": [
    { "rule_id": "R1", "applies": false, "facts": { "delay_minutes": 160 } },
    { "rule_id": "R2", "applies": false, "facts": { "delay_minutes": 160, "international": true } },
    { "rule_id": "R3", "applies": true,  "facts": { "missed_connection": true } },
    { "rule_id": "R4", "applies": false, "facts": { "compensation_requested": false } },
    { "rule_id": "R5", "applies": true,  "facts": { "group_includes_minor": true } }
  ],
  "options_evaluated": [
    { "option_id": "O1", "confidence": "HIGH",   "result": "RECOMMENDED", "reasons": [] },
    { "option_id": "O2", "confidence": "MEDIUM", "result": "DISCARDED", "reasons": ["SEATS_INSUFFICIENT", "FARE_DIFFERENCE_CONFLICTS_ENTITLEMENT"] },
    { "option_id": "O3", "confidence": "LOW",    "result": "DISCARDED", "reasons": ["NON_REFUNDABLE_FARE", "POLICY_NOT_AVAILABLE", "LOW_CONFIDENCE"] }
  ],
  "outcome": "RECOMMEND",
  "next_step": "ACCEPT_OPTION",
  "human_case": { "reason": "APPROVAL_REQUIRED", "case_id": "HC-4471" },
  "request_id": null,
  "notification_id": "NT-9912",
  "data_quality": {
    "completeness": "PARTIAL",
    "missing_fields": ["fare_conditions.change_penalty_amount"],
    "sources_degraded": ["LEGACY_MIRROR"]
  }
}
```

`booking_ref` es un seudónimo de `booking_id`. El registro no contiene datos personales, y el valor
`international: true` de R2 depende de cómo se determine el carácter internacional (H-07).

## 16.7 Catálogo de motivos de descarte de opciones
| Código | Cuándo |
|---|---|
| `SEATS_INSUFFICIENT` | `seats_available` es menor que `passenger_count` |
| `FARE_DIFFERENCE_CONFLICTS_ENTITLEMENT` | `fare_difference` mayor que 0 con un entitlement sin costo |
| `NON_REFUNDABLE_FARE` | Reembolso con `refundable: false` |
| `POLICY_NOT_AVAILABLE` | El `policy_ref` de la opción no es la versión vigente o la política no está disponible |
| `LOW_CONFIDENCE` | `confidence: LOW` (no se ofrece en automático) |
| `EXPIRED` | La vigencia venció y la nueva consulta no la renovó |
