# HU-004 · Recibir una opción de cambio válida para todo mi grupo

- **Tipo:** Historia
- **Épica:** EP-01
- **Estado:** Pre-entrega
- **Owner de aceptación:** usuario (DS)
- **Prioridad / estimación:** Alta · 25 min
- **Capacidad:** C3

## Historia
Como pasajero, quiero que me ofrezcan sólo opciones que sirvan para todos los que viajamos y que
respeten lo que me corresponde, para no aceptar algo que después no se puede cumplir.

## Criterios de aceptación
1. Dadas las opciones O1, O2 y O3 del enunciado y el entitlement `REBOOK_NO_FEE`, cuando se filtran,
   entonces la única recomendada es **O1** (LA2412, 16-09, 08:15, válida para los 2 pasajeros).
2. O2 aparece descartada con dos motivos: asientos insuficientes (1 para 2 pasajeros) y diferencia de
   tarifa (180000 CLP) incompatible con el cambio sin costo.
3. O3 aparece descartada con dos motivos: tarifa no reembolsable y confianza `LOW`.
4. Las opciones descartadas nunca llegan al mensaje del pasajero; sólo quedan en el registro.
5. La recomendación informa hasta cuándo es válida (`retrieved_at + ttl_seconds`).
6. **(neg)** Dadas opciones con el TTL vencido al momento de responder, entonces se vuelven a pedir una
   vez; si siguen vencidas o la lectura falla, no se recomienda ninguna y se deriva con `READ_FAILURE`.
7. **(neg)** Dada una opción cuyo `policy_ref` no coincide con la versión vigente, entonces se descarta.
8. **(neg)** Dado que ninguna opción sobrevive al filtro, entonces `next_step = WAIT_FOR_AGENT` y se
   deriva con `NO_VIABLE_OPTION`.
9. Dadas varias opciones viables, se ordenan por menor costo para el pasajero, luego por llegada más
   temprana y luego por `confidence`.

## Reglas de negocio que toca
- RN-02 (opciones candidatas) · RN-01

## Componentes y contratos
- Componentes: `engine/` (`domain/options.ts`, `app/orchestrator.ts` para la segunda lectura)
- Contratos: `tools-api.md` (`get_eligible_options`) · `disruption-api.md` (`recommended_option`)

## Clasificación de pasos
| Paso | Clasificación | Control / fallback |
|---|---|---|
| Filtrar y ordenar opciones | determinístico | Ninguna viable → `NO_VIABLE_OPTION` |

## Validación
- `.feature`: `features/EP-01_evaluacion-disrupcion.feature` — caso base
- Tests: `engine/test/unit/domain.test.ts` (filterOptions, decideControl)

| AC | Evidencia |
|---|---|
| 1, 2, 3 | `filterOptions`: recomienda O1 y descarta O2 y O3 con sus motivos |
| 6 | Parcial: `filterOptions`: opciones vencidas → ninguna recomendada (la segunda lectura no tiene test identificado) |
| 8 | `decideControl`: cambio otorgado sin opción viable → `NO_VIABLE_OPTION` |
| 4, 5, 7, 9 | **Sin test identificado** |

## Dependencias y riesgos
- Depende de HU-003 (entitlements).
- O1 implica pernocta en LIM sin regla de hotel (H-15).

## Preguntas abiertas
- H-08 (criterios de filtro) · H-10 (vigencia) · H-15 (pernocta) · H-23 (política de reembolso no entregada)

## Historial
- 2026-10-29 — `b204ab7` implementada en `engine/`.
- 2026-10-30 — migrada desde `Docs/epica/EP-01` (ENH-003).
