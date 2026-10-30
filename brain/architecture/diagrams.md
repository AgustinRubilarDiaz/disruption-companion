# Diagramas

> Track Backend (ADR-001): agregar la vista de contenedores de `disruption-engine` al crear el componente. Validarlos con un parser (`npx @mermaid-js/mermaid-cli`),
> no sólo en la vista previa.

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
Ver `../product/07-flujo.md` (flujo de 7 etapas, caso `ABC123` paso a paso, consulta compleja y
puntos de escalabilidad).
