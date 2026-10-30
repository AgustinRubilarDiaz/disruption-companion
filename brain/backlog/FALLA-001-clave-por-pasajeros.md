# FALLA-001 · La clave de idempotencia no distingue grupos del mismo tamaño

- **Estado:** Borrador
- **Severidad:** media (no hay solicitudes reales; con tools reales sería alta)
- **HU / componente afectado:** HU-007 · `disruption-engine` (`app/rebooking.ts`)
- **Error observado:** sin error visible; dos intenciones distintas producen la misma clave (H-36)

## Pasos de reproducción
1. Calcular `idempotencyKey("ABC123", "O1", "POL-DELAY-2026-03", …)` para el grupo P1 + P2.
2. Calcular la clave para otro grupo de 2 pasajeros en la misma reserva (P1 + P3).
3. Las dos claves son iguales: la función sólo recibe la cantidad (2).
- Fixture o datos usados: `contracts/fixtures/get_trip_context_ABC123.json` (P1, P2)

## Comportamiento esperado
RN-03: la clave es estable por intención. Misma reserva, opción, versión de política y **mismos
pasajeros** dan la misma clave; otro grupo da otra clave. Fórmula:
`sha256(booking_id | option_id | policy_ref | passenger_ids ordenados)`. Los reintentos ante un 503
siguen usando la misma clave.

## Comportamiento observado
`rebooking.ts` usa `ev.group.passenger_count`, así que dos grupos del mismo tamaño comparten clave.

## Causa raíz
Decisión 5 de `Docs/18` §5: usar la cantidad alcanzaba con un solo grupo por reserva en el mock.

## .feature que la reproduce
`features/FALLA-001_clave-por-pasajeros.feature` — debe **fallar hoy**.

## Impacto en el Brain al corregir
- ADR-006: enmienda (la clave pasa a `passenger_ids` ordenados). RN-03 y KNOWLEDGE_BASE: la fórmula.
- RD-11 y `contracts/logica-contratos.md`: la fórmula. H-36: la parte de la clave, Resuelto → FALLA-001.
- `passenger_id` no es un dato personal (invariante 7) y sólo viaja dentro del hash.

## Historial
- 2026-10-30 — creada desde H-36 (P3 · 1/5).
- 2026-10-30 — `.feature` aprobado; fix en `engine/src/app/rebooking.ts` y Brain actualizado (P3 · 3/5).
