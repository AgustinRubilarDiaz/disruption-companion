# Lenguaje ubicuo — Disruption Companion

> Una definición por término. Si un término aparece con dos sentidos, es una colisión:
> registrarla en `../../HALLAZGOS.md` y resolverla antes de usarlo en código o en un `.feature`.

| Término | Definición canónica | Notas / fuente |
|---|---|---|
| **Booking** | Reserva identificada por `booking_id` (ej. `ABC123`). Agrupa pasajeros y segmentos | `get_trip_context` |
| **Pasajero** | Persona del booking (`passenger_id`). Tipos vistos: `ADULT`, `CHILD` | Un `CHILD` trae `age` |
| **Grupo** | El conjunto de pasajeros del mismo booking | Base de `group_includes_minor` |
| **Segmento** | Un vuelo del itinerario (`segment_id`, `flight_number`, origen, destino, horarios programados) | `S1`, `S2` |
| **Conexión** | Paso de un segmento al siguiente dentro del itinerario (S1 → S2 en LIM) | |
| **Conexión perdida** | `missed_connection == true` en la política. **Cómo se calcula: abierto (H-07)** | No confundir con "retraso" |
| **Trip context** | Respuesta de `get_trip_context`: pasajeros, segmentos, `fare_conditions` y `_meta` | Puede ser `PARTIAL` |
| **Completeness** | `_meta.completeness` (`PARTIAL` …) + `missing_fields` | Valores posibles completos: no documentados |
| **Evento operacional** | Hecho sobre un segmento: `DELAY`, `GATE_CHANGE`, `STATUS` (`event_id`, `source`, `recorded_at`) | `get_operational_events` |
| **Fuente** | Origen del evento: `OPS_CORE`, `AIRPORT_FEED`, `LEGACY_MIRROR` | |
| **Fuente degradada** | Fuente listada en `_meta.sources_degraded` (ej. `LEGACY_MIRROR`) | Menor confiabilidad; tratamiento abierto (H-05) |
| **Frescura** | Antigüedad del dato respecto de "ahora" (`recorded_at`, `retrieved_at`, `ttl_seconds`) | Umbral: abierto (H-05) |
| **Modificación** | Cualquier evento operacional sobre un segmento del booking | |
| **Modificación relevante** | Modificación que amerita avisar / actuar. **Definición abierta (H-01)** | |
| **Opción elegible / candidata** | Alternativa de `get_eligible_options` (`REBOOK`, `REFUND`) con `policy_ref` y `confidence` | **No** es una decisión (RN-02) |
| **Política** | Conjunto versionado de reglas por escenario (`DELAY`) | `get_policy_rules` |
| **Versión de política** | Ej. `POL-DELAY-2026-03`, con `effective_from` y `superseded_versions` | |
| **Regla de política** | `R1…R5` dentro de una versión. Se cita `POL-DELAY-2026-03/R3` | No confundir con `RN-0X` del Brain |
| **Entitlement** | Lo que la política otorga: `REBOOK_NO_FEE`, `MEAL_VOUCHER`, `CASH_COMPENSATION`, `PRIORITY_HANDLING` | |
| **policy_ref** | Referencia a la versión de política que sustenta una opción o un mensaje | Obligatoria para notificar (RN-04) |
| **Recomendación** | Lo que el sistema propone al pasajero, trazado a política y evidencia | Producto propio, no de la tool |
| **Acción de alto impacto** | Cambiar reserva o emitir compensación | RN-03 |
| **Rebooking request** | Solicitud de cambio de reserva. Estados vistos: `PENDING_CONFIRMATION`, con `expires_at` | |
| **Idempotency key** | Clave que hace seguro reintentar una escritura | 409 `DUPLICATE_REQUEST` |
| **Resultado indeterminado** | La escritura pudo o no haberse aplicado (503 `UPSTREAM_TIMEOUT`) | |
| **Caso humano** | Escalamiento a operación (`case_id`, `queue`, `sla_minutes`) | `create_human_case` |
| **Evidencia** | Datos que acompañan un caso humano o justifican una recomendación | Sin PII innecesaria (RN-06) |
| **Notificación** | Mensaje al pasajero vía `notify_passenger` (canal visto: `PUSH`) | Sólo contenido validado |
| **Domain Specialist (DS)** | En este proyecto: el usuario, apoyado en el enunciado | |
| **Comité** | Los dos evaluadores de la defensa | |
