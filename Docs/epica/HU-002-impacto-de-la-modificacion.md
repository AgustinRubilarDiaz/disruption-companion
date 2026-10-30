# HU-002 · Saber si la modificación me afecta

- **Tipo:** Historia
- **Épica:** EP-01
- **Estado:** Pre-entrega
- **Owner de aceptación:** usuario (DS)
- **Prioridad / estimación:** Alta · 20 min
- **Capacidad:** C2

## Historia
Como pasajero, quiero saber si el cambio afecta mi itinerario, por ejemplo si pierdo mi conexión,
para entender qué me implica.

## Criterios de aceptación
1. Dado S1 con 160 min de retraso (llegada estimada 20:35) y S2 con salida a las 19:05, cuando se
   calcula el impacto, entonces `missed_connection = true` y `trip_status = RELEVANT_CHANGE`.
2. Dado que sólo existe el `GATE_CHANGE`, entonces `trip_status = INFORMATIVE_CHANGE`.
3. Dado que todos los segmentos están `SCHEDULED` u `ON_TIME` según fuentes sanas y frescas, entonces
   `trip_status = NO_CHANGE`.
4. Dado un retraso que deja la llegada estimada antes de la salida siguiente con el MCT configurado,
   entonces `missed_connection = false`.
5. El impacto informa `delay_minutes` por segmento y la llegada estimada, y declara que el cálculo
   supone la duración de vuelo sin cambios.
6. **(neg)** Dado un segmento con estado `UNVERIFIED`, entonces no se calcula la conexión a partir de
   él y el viaje queda `UNVERIFIED`.

## Reglas de negocio que toca
- RN-05 · `POL-DELAY-2026-03/R3` (conexión perdida)

## Componentes y contratos
- Componentes: `engine/` (`domain/impact.ts`, `domain/control.ts`)
- Contratos: `disruption-api.md` (`trip_status`, `impact`)

## Clasificación de pasos
| Paso | Clasificación | Control / fallback |
|---|---|---|
| Calcular conexión perdida y estado del viaje | determinístico | Segmento `UNVERIFIED` → viaje `UNVERIFIED` |

## Validación
- `.feature`: `features/EP-01_evaluacion-disrupcion.feature` — caso base
- Tests: `engine/test/unit/domain.test.ts` (computeImpact)

| AC | Evidencia |
|---|---|
| 1 | `computeImpact`: llegada 20:35 contra salida 19:05 → conexión perdida |
| 4 | `computeImpact`: el MCT configurable… (cubre el caso inverso: ajustada → perdida) |
| 6 | Escenario DEMOCONF (viaje `UNVERIFIED`) |
| 2, 3, 5 | **Sin test identificado** |

## Dependencias y riesgos
- Depende de HU-001 (segmentos consolidados).
- Supuesto de horas locales sin zona horaria (H-07).

## Preguntas abiertas
- H-01 (modificación relevante) · H-06 (medición del retraso) · H-07 (conexión, MCT, zona horaria)

## Historial
- 2026-10-29 — `b204ab7` implementada en `engine/`.
- 2026-10-30 — migrada desde `Docs/epica/EP-01` (ENH-003).
