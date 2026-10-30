# 7. Lógica de los contratos

Cómo consume el Companion cada sistema disponible del enunciado: precondiciones, validaciones sobre la
respuesta, uso en la decisión y manejo de errores. Los contratos se mantienen tal como los define el
enunciado, también en los mocks.

## Principios transversales
1. **Leer no es decidir.** Ninguna respuesta de lectura se muestra o se ejecuta tal cual: antes pasa por validación.
2. **Todo dato lleva su metadato.** Fuente, hora y frescura acompañan al dato hasta el registro de decisiones.
3. **Escribir es un comando con control.** Precondiciones explícitas, idempotencia y estado final conocido.
4. **Ante la duda, derivar.** Un error o una contradicción que no se resuelve en forma determinística termina en `create_human_case`.

## Orden de llamadas
```
get_trip_context ──┬─► get_operational_events(segment_ids)  ┐
                   ├─► get_policy_rules(scenario)*          ├─► evaluación ─► escrituras
                   └─► get_eligible_options(trip_context)   ┘
* El escenario se conoce después de los eventos; con un solo escenario en la V1 (DELAY) puede ir en paralelo.
```

---

## Lectura

### `get_trip_context(booking_id)` — puede devolver información parcial
| Aspecto | Lógica |
|---|---|
| Precondición | `booking_id` con formato válido y autorizado para quien consulta (el pasajero sólo ve su reserva) |
| Validaciones | `segments` no vacío; `_meta.completeness`; `missing_fields` |
| Uso | Segmentos (para pedir eventos), composición del grupo (un `CHILD` activa `group_includes_minor`) y condiciones de tarifa |
| Respuesta `PARTIAL` (Supuesto, H-09) | Cada campo faltante se clasifica en **crítico** (bloquea la decisión y deriva) o **no crítico** (se sigue y se registra). Por ejemplo, `change_penalty_amount` no es crítico si el entitlement es sin costo |
| Datos personales | `email`, `phone` y `document_id` no salen del adaptador, salvo hacia el canal de notificación |
| Errores | No especificados (H-11). Supuesto: reserva inexistente → mensaje neutro; timeout → no se recomienda y se deriva |

### `get_operational_events(segment_ids)` — requiere controlar hora, fuente y frescura
| Aspecto | Lógica |
|---|---|
| Precondición | `segment_ids` del contexto del viaje |
| Validaciones | Por evento: `source` y `recorded_at`; por respuesta: `sources_degraded` |
| Consolidación (Supuesto, H-05) | Por segmento y tipo de evento: (1) se descartan los eventos de fuentes degradadas si hay una fuente sana; (2) entre fuentes sanas, gana el más reciente; (3) si dos fuentes sanas se contradicen en un hecho que cambia la decisión, hay conflicto y se deriva |
| Frescura (Supuesto, H-05) | Umbral por definir. Un evento más antiguo que el umbral se informa con su hora ("según datos de las 10:48") y no habilita acciones |
| Uso | `delay_minutes` y `new_departure` → impacto (FN-04); `GATE_CHANGE` → informativo |
| Errores | No especificados (H-11). Supuesto: que no haya eventos no significa "sin cambios"; se informa "no tenemos información de cambios" |

### `get_policy_rules(scenario)` — reglas versionadas y verificables
| Aspecto | Lógica |
|---|---|
| Precondición | Escenario derivado de los eventos (en la V1, `DELAY`) |
| Validaciones | `version` vigente (`effective_from` anterior o igual a la fecha del viaje) y no incluida en `superseded_versions` |
| Uso | Se evalúan las condiciones con los hechos calculados; el resultado es una lista de `{rule_id, entitlement, requires_human_approval}` |
| Campo `condition` (Supuesto, H-13) | **Se evalúa con un intérprete acotado:** `hecho op valor` unidos por `AND`, sobre un catálogo cerrado de hechos (`delay_minutes`, `international`, `missed_connection`, `compensation_requested`, `group_includes_minor`). Lo que no entiende (un `OR`, un hecho desconocido) no se aplica en automático y se deriva con `UNSUPPORTED_RULE`. La alternativa, un predicado en código por `rule_id`, está en ADR-004 |
| Errores | Si la política no está disponible, no hay recomendación (FN-13) |

### `get_eligible_options(trip_context)` — opciones candidatas, no una decisión final
| Aspecto | Lógica |
|---|---|
| Precondición | Contexto del viaje ya obtenido |
| Validaciones | Vigencia: `retrieved_at + ttl_seconds` posterior a la hora actual; `policy_ref` igual a la versión vigente |
| Filtro (Supuesto, H-08) | Se descarta la opción si: `seats_available` es menor que la cantidad de pasajeros del grupo; `fare_difference` es mayor que 0 con entitlement `REBOOK_NO_FEE`; es `REFUND` con `refundable: false` y ninguna regla lo habilita; o tiene `confidence: LOW` (no se ofrece en automático) |
| Orden (Supuesto) | Entre las viables: menor costo para el pasajero, luego llegada más temprana, luego `confidence` |
| Opción vencida | Se vuelve a pedir; nunca se ofrece una opción vencida |

---

## Escritura

### `create_rebooking_request(option, idempotency_key)` — acción de alto impacto
| Aspecto | Lógica |
|---|---|
| Precondiciones | Opción viable y vigente · entitlement que la cubre · ninguna aprobación humana pendiente que la bloquee (H-03, H-04) · **confirmación explícita del pasajero** |
| Idempotency key (Supuesto, H-12) | Determinística: `sha256(booking_id + option_id + policy_ref + passenger_count)`. El mismo intento produce la misma key; otra opción produce otra key. Usa la cantidad de pasajeros, no sus IDs (H-36, ADR-006) |
| 201 `PENDING_CONFIRMATION` | Se informa al pasajero que quedó solicitada (no confirmada) y hasta cuándo vale (`expires_at`). Quién confirma: H-10 |
| 409 `DUPLICATE_REQUEST` | **No es un error**: la solicitud ya existe; se usa el `request_id` devuelto y se responde igual que con un 201 |
| 503 `UPSTREAM_TIMEOUT` | **Resultado indeterminado.** Se reintenta con **la misma key** (es seguro: o la crea, o devuelve 409), con espera creciente y un máximo de intentos. Si sigue indeterminado, se crea `create_human_case("REBOOKING_INDETERMINATE")` y al pasajero se le dice "estamos confirmando tu solicitud". Nunca se reintenta con otra key |

### `create_human_case(reason, evidence)` — escalamiento a operación humana
| Aspecto | Lógica |
|---|---|
| Cuándo (Supuesto) | Regla con `requires_human_approval` (R4, R5) · conflicto de fuentes sin resolver · dato crítico faltante · ninguna opción viable · 503 sin reconciliar · error de lectura |
| `reason` | Código de un catálogo cerrado, no texto libre: `APPROVAL_REQUIRED`, `SOURCE_CONFLICT`, `INCOMPLETE_DATA`, `NO_VIABLE_OPTION`, `UNSUPPORTED_RULE`, `REBOOKING_INDETERMINATE`, `READ_FAILURE` |
| `evidence` | `decision_id`, `booking_id`, `event_ids` usados y descartados, `policy_ref` + `rule_ids`, opciones evaluadas con su motivo de descarte. **Sin** email, teléfono ni documento: el agente los ve en su propio sistema |
| Respuesta 201 | El `sla_minutes` se comunica al pasajero como siguiente paso ("un agente te contacta en 45 min o menos") |
| Duplicados (Supuesto) | El contrato no recibe idempotency key: antes de crear un caso se consulta el registro de decisiones por `decision_id` |

### `notify_passenger(message)` — no debe enviar información no validada
| Aspecto | Lógica |
|---|---|
| Precondiciones | Mensaje armado desde una plantilla con hechos verificados · incluye `policy_ref` · sin datos internos (`confidence`, fuentes, IDs de regla en el texto al pasajero) (H-02) |
| 202 `QUEUED` | Encolada, **no entregada**: el registro guarda `QUEUED` |
| 422 `UNVALIDATED_CONTENT` | Es un error propio (se envió algo sin validar): no se reintenta igual; se registra y se deriva |

---

## Contrato de salida propio (borrador)
**Superado por el documento 16**, que es el contrato formal v1.0. Se conserva como antecedente:

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
