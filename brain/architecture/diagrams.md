# Diagramas

> Validarlos con un parser (`npx -y @mermaid-js/mermaid-cli`), no sólo en la vista previa.
> Si cambia un componente, un endpoint o un tipo del contrato, se actualiza el diagrama en el mismo commit.

## Contexto (C4 nivel 1) — sistemas externos dados por el enunciado

```mermaid
flowchart LR
    pax([Pasajero])
    ops([Operación humana])
    dc[Disruption Companion]
    subgraph lectura[Tools de lectura]
        trip[get_trip_context]
        ev[get_operational_events]
        opt[get_eligible_options]
        pol[get_policy_rules]
    end
    subgraph escritura[Tools de escritura]
        rbk[create_rebooking_request]
        hc[create_human_case]
        np[notify_passenger]
    end
    pax --> dc
    dc --> trip
    dc --> ev
    dc --> opt
    dc --> pol
    dc -->|alto impacto, con control| rbk
    dc --> hc
    dc -->|sólo contenido validado| np
    hc --> ops
    np --> pax
```

## Contenedores y componentes (C4 niveles 2 y 3) — lo implementado

Un solo contenedor (`Dockerfile`, `node:24-slim`, puerto 8080): el motor sirve la API y la pantalla
compilada. Las tools reales no están implementadas; el puerto `Tools` las reemplaza por mocks con los
fixtures del enunciado (`contracts/fixtures/`).

```mermaid
flowchart TB
    pax([Pasajero])
    subgraph contenedor[Contenedor disruption-companion · node:24-slim · :8080]
        subgraph web[passenger-web · web/ · React 19 + Vite]
            ui[App.tsx y components/<br/>sólo presentación]
            vm[viewModel.ts<br/>contrato → pantalla]
            api[api.ts<br/>cliente HTTP]
        end
        subgraph engine[disruption-engine · engine/ · Node 24 + TypeScript]
            http[http/server.ts<br/>endpoints v1 + archivos estáticos]
            subgraph app[app/]
                orch[orchestrator.ts<br/>lecturas → evaluación → escrituras]
                rbk[rebooking.ts<br/>HU-007: clave y reintentos]
            end
            subgraph domain[domain/ · funciones puras, sin I/O]
                cons[consolidate] --> imp[impact] --> pol[policy] --> opt[options] --> ctl[control] --> msg[message]
                inv[invariants]
            end
            port[[ports/tools.ts<br/>puerto Tools: 7 tools]]
            mock[adapters/mock/<br/>MockTools + MockState + escenarios]
        end
    end
    real[(Tools reales de LATAM<br/>no implementadas)]
    pax --> ui
    ui --> vm --> api
    api -->|GET disruption-assessment<br/>POST rebooking-requests| http
    http --> orch
    http --> rbk
    rbk --> orch
    orch --> domain
    orch --> inv
    orch --> port
    rbk --> port
    port -.->|hoy| mock
    port -.->|futuro| real
```

| Endpoint | Componente | Contrato |
|---|---|---|
| `GET /v1/bookings/{id}/disruption-assessment` | `orchestrator.ts` | `contracts/disruption-api.md` |
| `POST /v1/bookings/{id}/rebooking-requests` | `rebooking.ts` | `contracts/disruption-api.md` (HU-007) |
| `GET /v1/scenarios`, `GET /health` | `server.ts` | `contracts/disruption-api.md` |
| `GET /*` (pantalla compilada) | `server.ts` sirve `web/dist` | — |

## Modelo de datos — entrada, decisión y salida

Fuente: `engine/src/domain/types.ts`. A la izquierda lo que entregan las tools (`contracts/tools-api.md`);
al centro la decisión; a la derecha el contrato de salida (`DisruptionAssessment` v1.0) y el registro
interno (HU-008), que nunca viaja al consumidor.

```mermaid
classDiagram
    direction LR
    class TripContext {
        booking_id
        passengers[]
        segments[]
        fare_conditions
        _meta.completeness
    }
    class Passenger {
        passenger_id
        type ADULT|CHILD|INFANT
        age
        PII: queda en el adaptador
    }
    class TripSegment {
        segment_id
        flight_number
        origin / destination
        scheduled_departure / arrival
    }
    class OperationalEvent {
        event_id
        segment_id
        type DELAY|GATE_CHANGE|STATUS
        delay_minutes
        source
        recorded_at
    }
    class EligibleOption {
        option_id
        type REBOOK|REFUND
        seats_available
        fare_difference
        policy_ref
        confidence
    }
    class PolicyRules {
        scenario
        version
        effective_from
        rules[]
    }
    class PolicyRule {
        rule_id
        condition
        entitlement
        requires_human_approval
    }
    class DisruptionAssessment {
        schema_version 1.0
        decision_id
        booking_id
        evaluated_at
        trip_status
        next_step
    }
    class Group {
        passenger_count
        includes_minor
    }
    class ConsolidatedSegment {
        segment_id
        status
        delay_minutes
        estimated_arrival_local
        data_as_of
    }
    class Impact {
        missed_connection
        connection
        delay_basis PER_SEGMENT
    }
    class Entitlement {
        entitlement
        policy_ref
        rule_id
        status GRANTED|PENDING_APPROVAL
    }
    class RecommendedOption {
        option_id
        covers_passengers
        fare_difference
        valid_until
    }
    class Escalation {
        reason
        status CREATED|CREATION_FAILED
        case_id
        sla_minutes
    }
    class Message {
        template_id
        policy_ref
        params
    }
    class DataQuality {
        completeness
        missing_fields
        degraded_events_ignored
        conflicts_resolved
    }
    class DecisionRecord {
        decision_id
        booking_ref seudónimo
        events_used / events_discarded
        rule_evaluations
        options_evaluated
        outcome
    }
    TripContext "1" *-- "1..*" Passenger
    TripContext "1" *-- "1..*" TripSegment
    PolicyRules "1" *-- "1..*" PolicyRule
    OperationalEvent "*" --> "1" TripSegment : segment_id
    TripSegment ..> ConsolidatedSegment : consolidate
    Passenger ..> Group : sólo cantidades
    PolicyRule ..> Entitlement : evaluatePolicy
    EligibleOption ..> RecommendedOption : filterOptions, una sola
    DisruptionAssessment "1" *-- "1" Group
    DisruptionAssessment "1" *-- "1..*" ConsolidatedSegment
    DisruptionAssessment "1" *-- "0..1" Impact
    DisruptionAssessment "1" *-- "*" Entitlement
    DisruptionAssessment "1" *-- "0..1" RecommendedOption
    DisruptionAssessment "1" *-- "*" Escalation
    DisruptionAssessment "1" *-- "1" Message
    DisruptionAssessment "1" *-- "1" DataQuality
    DecisionRecord "1" -- "1" DisruptionAssessment : decision_id
```

Las descartadas y sus motivos (`OptionEvaluation`), las reglas evaluadas (`RuleEvaluation`) y los
eventos descartados (`DiscardedEvent`) viven sólo en `DecisionRecord` (invariante 6 de
`contracts/disruption-assessment.md`). Ningún tipo de salida tiene datos personales (invariante 7).

## Caso base — secuencia de datos (sin decisiones de diseño todavía)

```mermaid
sequenceDiagram
    participant P as Pasajero
    participant DC as Disruption Companion
    participant T as Tools de lectura
    P->>DC: consulta booking ABC123
    DC->>T: get_trip_context(ABC123)
    T-->>DC: trip context (PARTIAL)
    DC->>T: get_operational_events([S1, S2])
    T-->>DC: eventos + fuentes degradadas
    DC->>T: get_policy_rules(DELAY)
    T-->>DC: POL-DELAY-2026-03
    DC->>T: get_eligible_options(trip context)
    T-->>DC: opciones candidatas (TTL 120 s)
    Note over DC: evaluar con reglas determinísticas<br/>(decisiones pendientes en HALLAZGOS)
    DC-->>P: qué pasó + recomendación o derivación
```

## Flujo de decisión y caso base resuelto
Ver `../product/08-flujo.md` (flujo de 7 etapas, caso `ABC123` paso a paso, consulta compleja y
puntos de escalabilidad).
