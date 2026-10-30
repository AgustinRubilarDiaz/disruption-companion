# ADR-003 · Consolidación de eventos operacionales

- **Estado:** Propuesto (implementado como supuesto de la POC; lo acepta el usuario)
- **Fecha:** 2026-10-30
- **Decide:** usuario (DS / Tech Lead)
- **HU relacionada:** HU-001, HU-002 · **Hallazgos:** H-05, H-06, H-07 (siguen abiertos con el dueño de datos operacionales)

## Contexto
`get_operational_events` mezcla fuentes con distinto estado y hora (RN-05). En el caso base,
`LEGACY_MIRROR` (degradada) dice `ON_TIME` y `OPS_CORE` dice `DELAY` 160 min. El enunciado no define
cómo resolver fuentes contradictorias, el umbral de frescura, si el retraso es por segmento o a
destino, ni el tiempo mínimo de conexión (MCT) o la zona horaria. Un error acá es una recomendación
incorrecta (OV-2), así que la regla tiene que ser explicable y conservadora.

## Opciones consideradas
### A. Prioridad fija por fuente (`OPS_CORE` > `AIRPORT_FEED` > `LEGACY_MIRROR`)
- A favor: simple y predecible.
- En contra: inventa una jerarquía que el enunciado no da; si la fuente prioritaria está vieja, gana igual.
### B. Excluir degradadas y viejas, luego gana la más reciente por tipo; contradicción sana → no verificado
- A favor: usa sólo lo que el enunciado entrega (`sources_degraded`, `recorded_at`); ante una duda real no decide.
- En contra: un umbral de frescura mal calibrado deja casos en `UNVERIFIED` y carga a L2.
### C. Cualquier contradicción → persona
- A favor: máxima seguridad.
- En contra: el caso base (una fuente degradada contra una sana) iría a humano sin necesidad.

## Decisión
**B**, con estos parámetros, que viven en `EngineConfig`:
1. Fuente en `sources_degraded` → evento descartado (`SOURCE_DEGRADED`).
2. Evento más viejo que `max_event_age_minutes` (30) → descartado (`STALE`).
3. Por segmento y tipo de evento gana el `recorded_at` más reciente (`SUPERSEDED` el resto).
4. `DELAY` y `STATUS ON_TIME` sanos a la vez → segmento `UNVERIFIED` + derivación `SOURCE_CONFLICT`.
5. Segmento sin eventos válidos → `UNVERIFIED` (ausencia de datos nunca es "sin cambios").
6. Retraso **por segmento**; conexión perdida si `llegada estimada + MCT > salida del siguiente`,
   con `mct_minutes` = 0 y horas `_local` comparadas sin zona horaria.

Criterio que desempató: es la única opción que no inventa datos (ni jerarquía de fuentes ni
zona horaria) y que deriva cuando la duda cambia la decisión.

## Consecuencias
- Positivas: el caso base se resuelve en automático y queda trazado (`events_used`, `events_discarded`
  en el registro); los dos umbrales son configurables sin tocar la lógica.
- Negativas / costos asumidos: MCT 0 subestima las conexiones perdidas; sin zona horaria, una
  conexión entre países con distinto huso puede calcularse mal (H-07). 30 min es un valor supuesto.
- Reversibilidad: alta — los parámetros están en `EngineConfig` y la regla en `domain/consolidate.ts`.

## Clasificación
| Paso | Clasificación | Razón | Riesgo | Control / fallback |
|---|---|---|---|---|
| Consolidar eventos | determinístico | Reglas explícitas sobre campos del enunciado | Umbral mal calibrado | Configurable; contradicción → humano |
| Calcular impacto | determinístico | Comparación de horas | Falta MCT y zona horaria | Parámetro `mct_minutes`; H-07 abierto |

## Evidencia
`engine/test/unit/domain.test.ts` (consolidate, computeImpact) · escenarios `DEMOCONF` y `DEMONOEV`
en `engine/test/scenarios/EP-01_evaluacion-disrupcion.test.ts`.

## Pendiente
- Confirmar con operaciones el umbral de frescura y la jerarquía de fuentes (H-05), el MCT y la zona horaria (H-07).
