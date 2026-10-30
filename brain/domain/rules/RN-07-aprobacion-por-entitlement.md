# RN-07 · Cada entitlement sigue su propia bandera de aprobación 🟡 Decidida

**Fuente:** decisión del usuario sobre P-17 / H-17 (2026-10-29, `Docs/17` §1 decisión 1).

## Qué dice
Cuando aplican a la vez una regla sin aprobación y otra con `requires_human_approval: true`, cada
entitlement se trata por separado. Una regla que requiere aprobación no bloquea a las demás.

## Cómo se aplica
- Regla sin aprobación → entitlement `GRANTED`; si cubre una opción viable, se ofrece (`ACCEPT_OPTION`).
- Regla con aprobación → entitlement `PENDING_APPROVAL` y una derivación `APPROVAL_REQUIRED` en paralelo.
- Caso base: R3 (`REBOOK_NO_FEE`) se otorga y se ofrece O1; R5 (`PRIORITY_HANDLING`, menor en el
  grupo) queda pendiente y abre el caso HC-4471.
- Si el negocio quiere que un menor bloquee todo el caso, lo expresa en la política (por ejemplo,
  `requires_human_approval: true` en R3 para grupos con menores) y el motor lo respeta sin cambiar código.

## Dónde está
`engine/src/domain/policy.ts` y `control.ts` · escenario "Caso base" de `features/EP-01_evaluacion-disrupcion.feature`.

## Abierto
- P-17b: para el piloto se recomienda la lectura conservadora (`Docs/15` §15.7). La decide negocio.
