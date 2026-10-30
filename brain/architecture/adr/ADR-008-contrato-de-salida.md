# ADR-008 · Contrato de salida `DisruptionAssessment`

- **Estado:** Propuesto (el contrato v1.0 ya está implementado y probado; lo acepta el usuario)
- **Fecha:** 2026-10-30
- **Decide:** usuario (DS / Tech Lead)
- **HU relacionada:** HU-010 y la integración entre `engine/` y `web/` · **Contrato:** `../../contracts/disruption-assessment.md`

## Contexto
El motor decide y cualquier consumidor (pantalla, app, mostrador) muestra. Si el consumidor recibe
eventos crudos u opciones candidatas, termina decidiendo: lógica de negocio en el frontend.
`logica-contratos.md` tenía un borrador conceptual con las descartadas y el caso humano en la respuesta.

## Opciones consideradas
### A. Exponer las salidas de las tools y que el consumidor arme la vista
- A favor: flexible.
- En contra: cada consumidor reimplementa la decisión; las descartadas y la `confidence` llegan al pasajero.
### B. Un resultado ya decidido, versionado, con invariantes que el motor garantiza
- A favor: el consumidor sólo presenta; las garantías (sin datos personales, sin mensaje sin `policy_ref`) se prueban una vez.
- En contra: un dato nuevo en pantalla exige una versión menor del contrato.

## Decisión
**B.** `DisruptionAssessment` v1.0: `trip_status`, `group`, `segments`, `impact`, `entitlements`, una
sola `recommended_option`, un único `next_step`, `escalations`, `message` y `data_quality`, con 10
invariantes. Las descartadas, las reglas evaluadas y los eventos descartados van sólo al registro
(HU-008). Una falla de lectura da 200 `UNVERIFIED` + `READ_FAILURE`, no un 5xx.
- Versionado: campo opcional o valor de enum nuevo = menor (`1.x`); quitar o renombrar = mayor (`2.0`).
- Ante un valor de enum desconocido, el consumidor muestra el estado genérico y el contacto.

Criterio que desempató: la frontera "el frontend no lleva lógica de negocio" se vuelve verificable.

## Consecuencias
- Positivas: `web/` se construyó sin tocar el motor (ADR-010); el contrato es la frontera de cada
  evolución (ADR-011).
- Negativas / costos asumidos: una falla de `get_policy_rules` hoy da 500, no 200 `READ_FAILURE`
  (H-29): el motor todavía no cumple esa parte del contrato.
- Reversibilidad: media — cambiar el contrato toca productor, consumidor y fixtures.

## Evidencia
`engine/test/contract/contract.test.ts` y el escenario del caso base contra
`contracts/fixtures/disruption_assessment_ABC123.json`.

## Pendiente
- Cerrar H-29. Los tests de contrato verifican la copia de fixtures y algunos códigos HTTP, no el esquema completo.
