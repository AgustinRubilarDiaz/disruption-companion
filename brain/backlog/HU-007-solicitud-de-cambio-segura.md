# HU-007 · Solicitar el cambio de vuelo de forma segura — acción de alto impacto

- **Tipo:** Historia
- **Épica:** EP-01
- **Estado:** Pre-entrega
- **Owner de aceptación:** usuario (DS)
- **Prioridad / estimación:** Media · 15 min (prevista como pseudocódigo; se implementó)
- **Capacidad:** C4

> **Escritura de alto impacto** (RN-03): llama a `create_rebooking_request`.

## Historia
Como pasajero, quiero aceptar la opción recomendada y que quede solicitada una sola vez, para no
perder el asiento ni terminar con dos cambios.

## Criterios de aceptación
1. Sin confirmación explícita del pasajero no se llama a `create_rebooking_request`.
2. Sólo se puede solicitar la opción recomendada en esta evaluación, vigente y cubierta por un
   entitlement; cualquier otra se rechaza.
3. La idempotency key es determinística: la misma reserva, opción, versión de política y pasajeros
   producen la misma key.
4. Dada la respuesta 201, el pasajero ve "solicitado, pendiente de confirmación" y la hora `expires_at`;
   nunca "confirmado".
5. Dada la respuesta 409 `DUPLICATE_REQUEST`, se trata como éxito con el `request_id` devuelto.
6. **(neg)** Dada la respuesta 503, se reintenta con **la misma key** hasta 2 veces; si sigue
   indeterminado, se deriva con `REBOOKING_INDETERMINATE` y al pasajero se le dice "estamos confirmando
   tu solicitud". Nunca se usa una key nueva.
7. **(neg)** Dada una opción vencida al confirmar, se vuelven a pedir las opciones y se pide una nueva
   confirmación; no se solicita la opción vencida.
8. **(neg)** Dada una aprobación humana pendiente que afecte a esa opción, no se crea la solicitud (RN-07).

## Reglas de negocio que toca
- RN-03 (alto impacto) · RN-07

## Componentes y contratos
- Componentes: `engine/` (`app/rebooking.ts`, `http/server.ts`) · `web/` (diálogo de confirmación)
- Contratos: `tools-api.md` (`create_rebooking_request`) · `passenger-experience.md` (`POST /v1/bookings/{id}/rebooking-requests`: 200/201/202/410/422)

## Clasificación de pasos
| Paso | Clasificación | Control / fallback |
|---|---|---|
| Confirmar la opción | human (el pasajero) | Sin confirmación no hay llamada |
| Crear la solicitud | determinístico | Misma key en reintentos; indeterminado → caso humano |

## Validación
- `.feature`: `features/EP-01_pantalla-pasajero.feature` (escenarios `@HU-007`) · `features/UX-01_pantalla-moderna.feature` (diálogo y barra de vigencia)
- Tests: `engine/test/scenarios/EP-01_pantalla-pasajero.test.ts`, `web/test/app.test.tsx`

| AC | Evidencia |
|---|---|
| 1 | Escenario: aceptar pide confirmación y sin confirmar no se llama al backend |
| 2 | Escenario: una opción que no es la recomendada se rechaza |
| 3 | Escenario: la clave de idempotencia es determinística |
| 4 | Escenario: confirmar crea una solicitud pendiente, nunca confirmada |
| 5 | Escenario: aceptar dos veces crea una sola solicitud |
| 6 | 503 de la tool: reintenta con la misma clave hasta 2 veces y luego deriva (202) |
| 7 | Parcial: escenario "solicitar una opción vencida se rechaza" (410); no vuelve a pedir opciones |
| 8 | **Sin test identificado** |

## Dependencias y riesgos
- Quién confirma `PENDING_CONFIRMATION` sigue abierto (H-10).
- **AC 3 corregido (FALLA-001):** `idempotencyKey()` en `engine/src/app/rebooking.ts` usaba
  `passenger_count`; ahora usa los `passenger_ids` ordenados, como dice el criterio.

## Preguntas abiertas
- H-10 · H-36 (`passenger_count` o `passenger_ids` en la clave) · ADR-006 Propuesto

## Historial
- 2026-10-29 — `b204ab7` implementada en `engine/` y `web/` (estaba prevista como diseño).
- 2026-10-30 — migrada desde `Docs/epica/EP-01` (ENH-003).
