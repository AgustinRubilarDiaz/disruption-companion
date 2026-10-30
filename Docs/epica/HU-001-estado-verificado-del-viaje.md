# HU-001 · Ver el estado verificado de mi viaje

- **Tipo:** Historia
- **Épica:** EP-01
- **Estado:** Pre-entrega
- **Owner de aceptación:** usuario (DS)
- **Prioridad / estimación:** Alta · 30 min
- **Capacidad:** C1, C2

## Historia
Como pasajero, quiero ver el estado actual de mis vuelos con datos verificados, para no actuar con
información desactualizada o contradictoria.

## Criterios de aceptación
1. Dado el booking `ABC123`, cuando consulto, entonces obtengo los 2 segmentos (S1, S2) y la
   composición del grupo (1 adulto, 1 menor), sin `email`, `phone` ni `document_id` en la respuesta.
2. Dado que el contexto llega `PARTIAL` sin `change_penalty_amount`, cuando consulto, entonces la
   respuesta informa `completeness: PARTIAL` y el campo faltante, y la consulta continúa porque el campo no es crítico.
3. Dado que S1 tiene `DELAY` de 160 min de `OPS_CORE` (10:48) y `ON_TIME` de `LEGACY_MIRROR` (09:30,
   degradada), cuando se consolidan los eventos, entonces el estado de S1 es "retrasado, nueva salida
   17:10" y el evento E-1012 aparece como descartado con motivo "fuente degradada".
4. Dado el `GATE_CHANGE` a la puerta 24, cuando se consolidan los eventos, entonces se informa como
   cambio informativo con su fuente y su hora.
5. Todo hecho que se muestra al pasajero lleva la hora del dato ("según datos de las 10:48").
6. **(neg)** Dado que dos fuentes sanas informan estados incompatibles para el mismo segmento, cuando
   se consolidan, entonces el estado es `UNVERIFIED` y se deriva con `SOURCE_CONFLICT`.
7. **(neg)** Dado un evento más antiguo que `max_event_age_minutes`, entonces se informa con su hora
   y no habilita ninguna recomendación ni acción.
8. **(neg)** Dado que no llegan eventos para un segmento, o que todas sus fuentes están degradadas,
   entonces el estado es `UNVERIFIED` y nunca `NO_CHANGE`.
9. **(neg)** Dado que `get_trip_context` falla o expira, entonces no se emite ninguna recomendación y
   se deriva con `READ_FAILURE`.
10. **(neg)** Dado un booking que no pertenece a quien consulta, o que no existe, entonces la
    respuesta es la misma en ambos casos y no revela si la reserva existe.

## Reglas de negocio que toca
- RN-05 (calidad de datos) · RN-06 (datos personales)

## Componentes y contratos
- Componentes: `engine/` (`domain/consolidate.ts`, `app/orchestrator.ts`)
- Contratos: `tools-api.md` (`get_trip_context`, `get_operational_events`) · `disruption-api.md` (`segments[]`, `group`, `data_quality`)

## Clasificación de pasos
| Paso | Clasificación | Control / fallback |
|---|---|---|
| Consolidar eventos por segmento | determinístico | Conflicto entre fuentes sanas → `UNVERIFIED` + `SOURCE_CONFLICT` |

## Validación
- `.feature`: `features/EP-01_evaluacion-disrupcion.feature` — caso base, DEMOCONF, DEMONOEV, reserva inexistente
- Tests: `engine/test/unit/domain.test.ts` (consolidate), `engine/test/scenarios/EP-01_evaluacion-disrupcion.test.ts`

| AC | Evidencia (por nombre de test o escenario) |
|---|---|
| 1 | Escenario caso base |
| 3 | `consolidate`: descarta la fuente degradada… |
| 6 | `consolidate`: dos fuentes sanas incompatibles… · escenario DEMOCONF |
| 7 | `consolidate`: descarta un evento más viejo que `max_event_age_minutes` |
| 8 | Escenario DEMONOEV |
| 10 | Escenario reserva inexistente (sin control de pertenencia: no hay autenticación) |
| 2, 4, 5, 9 | **Sin test identificado** |

## Dependencias y riesgos
- AC 10 depende de autenticación, fuera de alcance de la POC.

## Preguntas abiertas
- H-05 (fuentes y frescura) · H-09 (`PARTIAL`) · H-11 (fallas de lectura)

## Historial
- 2026-10-29 — `b204ab7` implementada en `engine/`.
- 2026-10-30 — migrada desde `Docs/epica/EP-01` (ENH-003).
