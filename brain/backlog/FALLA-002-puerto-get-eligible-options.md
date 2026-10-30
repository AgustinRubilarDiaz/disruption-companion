# FALLA-002 · El puerto no respeta el contrato de `get_eligible_options`

- **Estado:** Borrador
- **Severidad:** baja (hoy sólo lo usa el mock; bloquea conectar la tool real)
- **HU / componente afectado:** HU-004 · `disruption-engine` (`ports/tools.ts`, `app/orchestrator.ts`, `adapters/mock/mockTools.ts`)
- **Error observado:** sin error visible; firma distinta a la del contrato (H-36)

## Pasos de reproducción
1. Leer `contracts/tools-api.md`: `get_eligible_options(trip_context)`.
2. Leer `ports/tools.ts`: `get_eligible_options(booking_id, segment_id)`.
3. El orquestador llama `get_eligible_options(booking_id, segmentIds[0])`: sólo pide opciones para el primer segmento.
- Fixture o datos usados: `contracts/fixtures/get_eligible_options.json`

## Comportamiento esperado
RS-12: el puerto respeta el contrato de la tool, también en el mock. El orquestador pasa el
contexto del viaje completo que devolvió `get_trip_context`.

## Comportamiento observado
El puerto recibe `booking_id` y un solo `segment_id`.

## Causa raíz
El puerto se simplificó a lo que necesitaba el mock y nunca se alineó al contrato.

## .feature que la reproduce
`features/FALLA-002_puerto-get-eligible-options.feature` — debe **fallar hoy**.

## Impacto en el Brain al corregir
- H-36: la parte del puerto, Resuelto → FALLA-002. `diagrams.md` no cambia.

## Historial
- 2026-10-30 — separada de FALLA-001 por decisión del usuario (P3 · 1/5).
