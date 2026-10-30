# ADR-006 · Escrituras de alto impacto: clave de idempotencia y reconciliación

- **Estado:** Propuesto — formaliza la decisión 5 de `../../../Docs/18-plan-frontend.md` §11 (ya registrada en RN-03 🟡)
- **Fecha:** 2026-10-30
- **Decide:** usuario (DS / Tech Lead)
- **HU relacionada:** HU-007 · **Hallazgos:** H-10 (abierto: quién confirma), H-12 (resuelto → RN-03), H-30, H-31

## Contexto
`create_rebooking_request` es de alto impacto (RN-03): exige una clave de idempotencia, un 409 significa
que la solicitud ya existe y un 503 deja el resultado indeterminado. La pantalla permite aceptar la
opción, así que un doble clic, un refresco o un reintento no pueden crear dos solicitudes.

## Opciones consideradas
### A. Clave aleatoria por intento
- A favor: trivial.
- En contra: un reintento tras un 503 crea otra solicitud; viola RN-03.
### B. Clave determinística de la intención + reintentos acotados con la misma clave
- A favor: el mismo pedido da la misma clave; el 409 se vuelve éxito; el 503 se reconcilia sin duplicar.
- En contra: hay que elegir bien qué entra en la clave.
### C. Clave que manda el consumidor
- A favor: el consumidor controla sus reintentos.
- En contra: el motor confía en la pantalla; dos pestañas generan dos claves.

## Decisión
**B.**
- Clave: `sha256(booking_id | option_id | policy_ref | passenger_count)` (`app/rebooking.ts`).
- Antes de escribir, el motor **vuelve a evaluar**: sólo solicita la opción recomendada ahora,
  vigente y cubierta por un `REBOOK_NO_FEE` otorgado (si no, 422 o 410).
- 409 → 200 con el `request_id` existente. 503 → hasta 2 reintentos con la **misma** clave; si sigue
  indeterminado, 202 `CONFIRMING` + caso `REBOOKING_INDETERMINATE`.
- Los casos humanos y las notificaciones se deduplican por `decision_id` (hoy en `MockState`).

Criterio que desempató: es la única opción que cumple RN-03 sin confiar en el consumidor.

## Consecuencias
- Positivas: aceptar dos veces crea una sola solicitud; el pasajero nunca ve "confirmado".
- Negativas / costos asumidos:
  - La clave usa la **cantidad** de pasajeros, no sus IDs: si el grupo cambia sin cambiar de tamaño,
    la clave se repite. `Docs/11` RD-11 decía `passenger_ids`; se alinea a lo implementado (H-36).
  - La deduplicación por `decision_id` vive en el mock; en producción hay que confirmarla (H-30, H-31).
- Reversibilidad: media — cambiar la fórmula de la clave con solicitudes vivas puede duplicarlas.

## Clasificación
| Paso | Clasificación | Razón | Riesgo | Control / fallback |
|---|---|---|---|---|
| Aceptar la opción | human (el pasajero confirma) | Acción de alto impacto | Doble envío | Clave determinística |
| Reconciliar un 503 | determinístico → human | Resultado indeterminado | Solicitud fantasma | 2 reintentos y caso L2 |

## Evidencia
`engine/test/scenarios/EP-01_pantalla-pasajero.test.ts`: clave determinística, aceptar dos veces,
opción no recomendada (422), vencida (410), 503 con la misma clave y 202.

## Pendiente
- Quién confirma `PENDING_CONFIRMATION` (H-10). Decidir `passenger_count` vs `passenger_ids` (H-36).
