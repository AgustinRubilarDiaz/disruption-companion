# Lógica de los contratos — cómo se usa cada tool

> Complementa `tools-api.md` (qué devuelve cada tool) con **cómo la consume el Companion**:
> precondiciones, validaciones sobre la respuesta, uso en la decisión y manejo de errores.
> ✅ dado por el enunciado · 💡 propuesta (cita `H-XX` si depende de una ambigüedad abierta).

## Principios transversales
1. **Lectura ≠ decisión.** Ninguna respuesta de lectura se muestra o se ejecuta tal cual: pasa por validación.
2. **Todo dato lleva su metadato.** Fuente, timestamp y frescura viajan con el dato hasta el decision log.
3. **Escritura = comando con control.** Precondiciones explícitas, idempotencia y estado final conocido.
4. **Ante la duda, derivar.** Un error o una contradicción que no se resuelve en forma determinística termina en `create_human_case`.

## Orden de llamadas y dependencias
```
get_trip_context ──┬─► get_operational_events(segment_ids)  ┐
                   ├─► get_policy_rules(scenario)*          ├─► evaluación ─► escrituras
                   └─► get_eligible_options(trip_context)   ┘
* el escenario se conoce después de los eventos; con un solo escenario en la V1 (DELAY) puede ir en paralelo.
```

---

## Lectura

### `get_trip_context(booking_id)`
| Aspecto | Lógica |
|---|---|
| Precondición | `booking_id` con formato válido y autorizado para quien consulta (el pasajero sólo ve su booking) |
| Validaciones | `segments` no vacío; `_meta.completeness`; `missing_fields` |
| Uso | Fuente de segmentos (para eventos), composición del grupo (`CHILD` → `group_includes_minor`), condiciones de tarifa |
| `PARTIAL` 💡 (H-09) | Se clasifica cada campo faltante en **crítico** (bloquea la decisión → humano) o **no crítico** (se sigue y se registra). Ej.: `change_penalty_amount` es no crítico si el entitlement es `REBOOK_NO_FEE` |
| PII | `email`, `phone`, `document_id` no salen del adaptador salvo hacia el canal de notificación (RN-06) |
| Errores | No especificados (H-11). 💡 Booking inexistente → mensaje neutro; timeout → no recomendar, derivar |

### `get_operational_events(segment_ids)`
| Aspecto | Lógica |
|---|---|
| Precondición | `segment_ids` del trip context |
| Validaciones | Por evento: `source`, `recorded_at`; por respuesta: `sources_degraded` |
| Consolidación 💡 (H-05) | Por segmento y tipo: (1) descartar eventos de fuentes degradadas si hay una no degradada; (2) entre válidas, el más reciente gana; (3) si dos fuentes sanas se contradicen en un hecho que cambia la decisión → conflicto → humano |
| Frescura 💡 (H-05) | Umbral por definir. Un evento más viejo que el umbral se informa con su hora ("según datos de las 10:48") y no habilita acciones |
| Uso | `delay_minutes`, `new_departure` → impacto (FN-04); `GATE_CHANGE` → informativo |
| Errores | No especificados (H-11). 💡 Sin eventos ≠ "sin cambios": se informa "no tenemos información de cambios" |

### `get_policy_rules(scenario)`
| Aspecto | Lógica |
|---|---|
| Precondición | Escenario derivado de los eventos (V1: `DELAY`) |
| Validaciones | `version` vigente (`effective_from` ≤ fecha del viaje) y no incluida en `superseded_versions` (RN-01) |
| Uso | Se evalúan las condiciones con los hechos calculados; salida: lista de `{rule_id, entitlement, requires_human_approval}` |
| `condition` 💡 (H-13) | **Se mapea a código**, no se interpreta el string: cada `rule_id` conocido tiene un predicado versionado y testeado. Una regla desconocida → no se aplica automáticamente → humano. Más seguro y testeable que un intérprete de expresiones |
| Errores | Política no disponible → no hay recomendación (FN-13) |

### `get_eligible_options(trip_context)`
| Aspecto | Lógica |
|---|---|
| Precondición | Trip context ya obtenido |
| Validaciones | Vigencia: `retrieved_at + ttl_seconds` > ahora; `policy_ref` coincide con la versión vigente |
| Filtro 💡 (H-08) | Se descarta la opción si: `seats_available` < pasajeros del grupo; `fare_difference` > 0 con entitlement `REBOOK_NO_FEE`; `REFUND` con `refundable: false` sin regla que lo habilite; `confidence: LOW` no se ofrece automática |
| Orden 💡 | Entre viables: menor costo para el pasajero, luego llegada más temprana, luego `confidence` |
| Vencida | Se vuelve a pedir; nunca se ofrece una opción vencida (RN-02) |

---

## Escritura

### `create_rebooking_request(option, idempotency_key)` — alto impacto
| Aspecto | Lógica |
|---|---|
| Precondiciones | Opción viable y vigente · entitlement que la cubre · sin regla con aprobación humana pendiente que la bloquee (H-03/H-04) · **confirmación explícita del pasajero** |
| Idempotency key 💡 (H-12) | Determinística: `hash(booking_id + option_id + policy_version + passenger_ids)`. El mismo intento produce la misma key; otra opción produce otra key |
| 201 `PENDING_CONFIRMATION` | Se informa al pasajero que quedó solicitada (no confirmada) y hasta cuándo (`expires_at`). Quién confirma: H-10 |
| 409 `DUPLICATE_REQUEST` | **No es error**: ya existe; se usa el `request_id` devuelto y se responde igual que el 201 |
| 503 `UPSTREAM_TIMEOUT` | **Indeterminado.** Se reintenta con **la misma key** (seguro: crea o devuelve 409), con backoff y máximo de intentos. Si sigue indeterminado → `create_human_case("REBOOKING_INDETERMINATE")` y al pasajero "estamos confirmando tu solicitud". Nunca se reintenta con otra key |

### `create_human_case(reason, evidence)`
| Aspecto | Lógica |
|---|---|
| Cuándo 💡 | Regla con `requires_human_approval` (R4, R5) · conflicto de fuentes no resuelto · dato crítico faltante · ninguna opción viable · 503 no reconciliado · error de lectura |
| `reason` | Código cerrado (catálogo propio), no texto libre: `APPROVAL_REQUIRED`, `SOURCE_CONFLICT`, `INCOMPLETE_DATA`, `NO_VIABLE_OPTION`, `UNSUPPORTED_RULE`, `REBOOKING_INDETERMINATE`, `READ_FAILURE` |
| `evidence` | `decision_id`, `booking_id`, `event_ids` usados y descartados, `policy_ref` + `rule_ids`, opciones evaluadas con motivo de descarte. **Sin** email, teléfono ni documento (el agente los ve en su sistema, RN-06) |
| Respuesta 201 | `sla_minutes` se comunica al pasajero como siguiente paso ("un agente te contacta en ≤ 45 min") |
| Idempotencia 💡 | El contrato no recibe key: se evita duplicar consultando el decision log por `decision_id` antes de crear |

### `notify_passenger(message)`
| Aspecto | Lógica |
|---|---|
| Precondiciones | Mensaje construido desde plantilla con hechos verificados · incluye `policy_ref` · sin datos internos (`confidence`, fuentes, IDs de reglas en texto al pasajero) (H-02) |
| 202 `QUEUED` | Encolada, **no entregada**: el log registra `QUEUED` |
| 422 `UNVALIDATED_CONTENT` | Es un bug propio (se envió algo sin validar): no se reintenta igual; se registra y se deriva |

---

## Contrato de salida propio (borrador conceptual) 💡
Se formaliza en `disruption-api.md` al decidir el track (ADR-001). Forma mínima:

```
DisruptionAssessment {
  decision_id
  booking_id
  trip_status:      NO_CHANGE | INFORMATIVE_CHANGE | RELEVANT_CHANGE | UNVERIFIED
  what_happened:    [{ segment_id, type, detail, source, recorded_at }]
  impact:           { missed_connection, delay_minutes_segment, ... }
  entitlements:     [{ policy_ref, rule_id, entitlement, requires_human_approval }]
  recommended_option?: { option_id, valid_until }
  discarded_options:   [{ option_id, reason }]
  next_step:        ACCEPT_OPTION | WAIT_FOR_AGENT | NO_ACTION_NEEDED
  human_case?:      { case_id, sla_minutes }
  data_quality:     { completeness, missing_fields, degraded_sources, conflicts_resolved }
}
```
